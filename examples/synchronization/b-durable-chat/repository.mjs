import pg from 'pg';
import {readFile} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import {checkedConfig} from './lab-config.mjs';
export class ProtocolError extends Error {
  constructor(code){super(code);this.code=code;}
}
export function identity(x){return typeof x==='string'&&/^[A-Za-z0-9:._-]{1,80}$/.test(x);}
export function channelId(x){return typeof x==='string'&&/^[a-z0-9_-]{1,48}$/.test(x);}
export function cursor(value){
  if(!value||typeof value.seq!=='string'||!/^(0|[1-9][0-9]{0,18})$/.test(value.seq)||BigInt(value.seq)>9223372036854775807n||
    (value.epoch!==null&&(typeof value.epoch!=='string'||!/^[a-f0-9]{8}(-[a-f0-9]{4}){3}-[a-f0-9]{12}$/.test(value.epoch))))throw new ProtocolError('BAD_CURSOR');
  if(value.epoch===null&&value.seq!=='0')throw new ProtocolError('BAD_CURSOR');
  return {epoch:value.epoch,seq:value.seq};
}
export class Repository {
  constructor(config){
    checkedConfig(config);this.schema=config.schema;this.p=`"${config.schema}".`;
    this.pool=new pg.Pool({host:'127.0.0.1',port:config.dbPort,database:'sync_chat',user:'sync_chat',password:'local-chat-lab-only',
      max:8,connectionTimeoutMillis:2000,idleTimeoutMillis:1000,statement_timeout:5000});
    this.pool.on('error',()=>{});
  }
  async init(){
    const c=await this.pool.connect();
    try{
      const info=await c.query("SELECT current_database() AS db,current_user AS actor,current_setting('server_version') AS version;");
      if(info.rows[0].db!=='sync_chat'||info.rows[0].actor!=='sync_chat'||!info.rows[0].version.startsWith('18.'))throw new Error('Require isolated PostgreSQL 18 lab');
      await c.query('BEGIN;');
      const sql=(await readFile(new URL('./schema.sql',import.meta.url),'utf8')).replaceAll('__SCHEMA__',`"${this.schema}"`);
      await c.query(sql);await c.query('COMMIT;');return info.rows[0].version;
    }catch(e){await c.query('ROLLBACK;').catch(()=>{});throw e;}finally{c.release();}
  }
  async allowed(c,user,channel,lock=false){
    const rows=await c.query(`SELECT user_id FROM ${this.p}memberships WHERE user_id=$1 AND channel_id=$2${lock?' FOR SHARE':''};`,[user,channel]);
    if(!rows.rowCount)throw new ProtocolError('FORBIDDEN');
  }
  async submit(user,{opId,channel,body},{beforeCommit}={}){
    if(!identity(opId)||!channelId(channel)||typeof body!=='string'||Buffer.byteLength(body,'utf8')<1||Buffer.byteLength(body,'utf8')>4096)throw new ProtocolError('BAD_REQUEST');
    if(body.includes('\0')||[...body].some(x=>{const p=x.codePointAt(0);return p>=0xd800&&p<=0xdfff;}))throw new ProtocolError('BAD_REQUEST');
    const c=await this.pool.connect();
    try{
      await c.query('BEGIN;');await this.allowed(c,user,channel,true);
      const claimed=await c.query(`INSERT INTO ${this.p}operation_results(user_id,op_id,channel_id,body) VALUES($1,$2,$3,$4)
        ON CONFLICT DO NOTHING RETURNING op_id;`,[user,opId,channel,body]);
      if(!claimed.rowCount){
        const {rows:[old]}=await c.query(`SELECT channel_id,body,outcome FROM ${this.p}operation_results WHERE user_id=$1 AND op_id=$2;`,[user,opId]);
        if(!old||old.channel_id!==channel||old.body!==body)throw new ProtocolError('IDENTITY_REUSE');
        if(!old.outcome)throw new Error('Incomplete replay record');
        await c.query('COMMIT;');return old.outcome;
      }
      const {rows:[head]}=await c.query(`UPDATE ${this.p}channels SET next_seq=next_seq+1 WHERE channel_id=$1 RETURNING epoch,(next_seq-1)::text AS seq;`,[channel]);
      if(!head)throw new ProtocolError('FORBIDDEN');
      const entry={messageId:randomUUID(),channel,seq:head.seq,author:user,body};
      await c.query(`INSERT INTO ${this.p}messages VALUES($1,$2,$3,$4,$5);`,[entry.messageId,channel,entry.seq,user,body]);
      await c.query(`INSERT INTO ${this.p}outbox(channel_id,seq) VALUES($1,$2);`,[channel,entry.seq]);
      const outcome={channel,epoch:head.epoch,entry};
      await c.query(`UPDATE ${this.p}operation_results SET outcome=$3::jsonb WHERE user_id=$1 AND op_id=$2;`,[user,opId,JSON.stringify(outcome)]);
      if(beforeCommit)await beforeCommit(opId);
      await c.query('COMMIT;');return outcome;
    }catch(e){await c.query('ROLLBACK;').catch(()=>{});throw e;}finally{c.release();}
  }
  async page(user,channel,position,limit=10){
    if(!channelId(channel))throw new ProtocolError('BAD_REQUEST');position=cursor(position);
    if(!Number.isInteger(limit)||limit<1||limit>10)throw new Error('Invalid internal page limit');
    const c=await this.pool.connect();
    try{
      await c.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY;');await this.allowed(c,user,channel);
      const {rows:[head]}=await c.query(`SELECT epoch,(next_seq-1)::text AS high_water,floor::text FROM ${this.p}channels WHERE channel_id=$1;`,[channel]);
      if(position.epoch!==null&&position.epoch!==head.epoch)throw new ProtocolError('RESET_REQUIRED');
      if(BigInt(position.seq)<BigInt(head.floor))throw new ProtocolError('RESET_REQUIRED');
      if(BigInt(position.seq)>BigInt(head.high_water))throw new ProtocolError('BAD_CURSOR');
      const {rows}=await c.query(`SELECT message_id AS "messageId",seq::text,author_id AS author,body FROM ${this.p}messages AS m
        WHERE channel_id=$1 AND seq>$2 AND seq<=$3 ORDER BY m.seq LIMIT $4;`,[channel,position.seq,head.high_water,limit]);
      const entries=rows.map(row=>({...row,channel}));const next=entries.at(-1)?.seq||position.seq;
      const result={channel,epoch:head.epoch,after:position.seq,highWater:head.high_water,entries,nextCursor:{epoch:head.epoch,seq:next},hasMore:BigInt(next)<BigInt(head.high_water)};
      await c.query('COMMIT;');return result;
    }catch(e){await c.query('ROLLBACK;').catch(()=>{});throw e;}finally{c.release();}
  }
  async pendingNotifications(){
    return (await this.pool.query(`SELECT channel_id AS channel,seq::text FROM ${this.p}outbox AS o WHERE NOT published ORDER BY o.channel_id,o.seq LIMIT 20;`)).rows;
  }
  async markPublished(channel,seq){await this.pool.query(`UPDATE ${this.p}outbox SET published=true WHERE channel_id=$1 AND seq=$2;`,[channel,seq]);}
  // Test/setup control only; never exposed to WebSocket clients.
  async addChannel(channel){
    if(!channelId(channel))throw new Error('Invalid fixture channel');
    await this.pool.query(`INSERT INTO ${this.p}channels(channel_id) VALUES($1);`,[channel]);
    await this.pool.query(`INSERT INTO ${this.p}memberships VALUES($1,'M'),($1,'D');`,[channel]);
  }
  async revoke(user,channel){await this.pool.query(`DELETE FROM ${this.p}memberships WHERE user_id=$1 AND channel_id=$2;`,[user,channel]);}
  async stats(channel){
    const {rows:[r]}=await this.pool.query(`SELECT (SELECT count(*)::int FROM ${this.p}messages WHERE channel_id=$1) AS messages,
      (SELECT count(*)::int FROM ${this.p}operation_results WHERE channel_id=$1) AS results,
      (SELECT count(*)::int FROM ${this.p}outbox WHERE channel_id=$1) AS outbox,
      (SELECT count(*)::int FROM ${this.p}outbox WHERE channel_id=$1 AND published) AS published;`,[channel]);return r;
  }
  async setFloor(channel,floor){await this.pool.query(`UPDATE ${this.p}channels SET floor=$2 WHERE channel_id=$1;`,[channel,floor]);}
  async drop(){await this.pool.query(`DROP SCHEMA "${this.schema}" CASCADE;`);}
  async close(){await this.pool.end();}
}
