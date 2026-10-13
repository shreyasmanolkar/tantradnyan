import {randomUUID} from 'node:crypto';
import {open,transaction,encode,decode,ProtocolError,exact,integer,uuid,record,operation,optimistic} from './storage.mjs';
export class Authority {
  constructor(path) {
    this.db=open(path);
    if(this.db.prepare('PRAGMA user_version').get().user_version>1){this.db.close();throw new ProtocolError('LOCAL_UPGRADE_REQUIRED');}
    this.db.exec(`CREATE TABLE IF NOT EXISTS meta(id INTEGER PRIMARY KEY CHECK(id=1),epoch TEXT NOT NULL,head INTEGER NOT NULL,floor INTEGER NOT NULL);
      CREATE TABLE IF NOT EXISTS records(id TEXT PRIMARY KEY,value TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS grants(actor TEXT PRIMARY KEY,allowed INTEGER NOT NULL);
      CREATE TABLE IF NOT EXISTS outcomes(actor TEXT NOT NULL,epoch TEXT NOT NULL,op_id TEXT NOT NULL,fingerprint TEXT NOT NULL,value TEXT NOT NULL,PRIMARY KEY(actor,epoch,op_id));
      CREATE TABLE IF NOT EXISTS changes(seq INTEGER PRIMARY KEY,record TEXT NOT NULL); PRAGMA user_version=1;`);
    transaction(this.db,()=>{
      this.db.prepare('INSERT OR IGNORE INTO meta VALUES(1,?,0,0)').run(randomUUID());
      this.db.prepare('INSERT OR IGNORE INTO records VALUES(?,?)').run('task-7',encode({id:'task-7',title:'Draft',count:0,version:0,deleted:false}));
      for(const actor of ['M','D'])this.db.prepare('INSERT OR IGNORE INTO grants VALUES(?,1)').run(actor);
    });
  }
  meta(){return {...this.db.prepare('SELECT epoch,head,floor FROM meta').get()};}
  authorize(actor){if(!['M','D'].includes(actor)||this.db.prepare('SELECT allowed FROM grants WHERE actor=?').get(actor)?.allowed!==1)throw new ProtocolError('FORBIDDEN');}
  current(){return decode(this.db.prepare('SELECT value FROM records WHERE id=?').get('task-7').value);}
  submit(actor,input,{beforeCommit,afterCommit}={}) {
    operation(input);
    const fingerprint=encode([input.v,input.schema,input.epoch,input.opId,input.recordId,input.kind,input.dependsOn,input.kind==='title'?[input.payload.expectedVersion,input.payload.title]:input.kind==='delete'?[input.payload.expectedVersion]:[input.payload.delta]]);
    const result=transaction(this.db,()=>{
      this.authorize(actor);
      const meta=this.meta();
      if(input.epoch!==meta.epoch)throw new ProtocolError('EPOCH_CHANGED');
      const prior=this.db.prepare('SELECT fingerprint,value FROM outcomes WHERE actor=? AND epoch=? AND op_id=?').get(actor,input.epoch,input.opId);
      if(prior){if(prior.fingerprint!==fingerprint)throw new ProtocolError('ID_REUSED');return decode(prior.value);}
      const base=this.current();let outcome;
      const dependency=input.dependsOn===null?null:this.db.prepare('SELECT value FROM outcomes WHERE actor=? AND epoch=? AND op_id=?').get(actor,input.epoch,input.dependsOn);
      if(input.dependsOn!==null&&(!dependency||decode(dependency.value).status!=='accepted'))outcome={opId:input.opId,status:'conflict',reason:'DEPENDENCY_FAILED'};
      else if(base.deleted)outcome={opId:input.opId,status:'rejected',reason:'DELETED'};
      else if(input.kind!=='increment'&&input.payload.expectedVersion!==base.version)outcome={opId:input.opId,status:'conflict',reason:'STALE_VERSION'};
      else {
        if(!integer(meta.head+1))throw new ProtocolError('LIMIT');
        const next=optimistic(base,input),seq=meta.head+1;
        this.db.prepare('UPDATE records SET value=? WHERE id=?').run(encode(next),base.id);
        this.db.prepare('UPDATE meta SET head=? WHERE id=1').run(seq);
        this.db.prepare('INSERT INTO changes VALUES(?,?)').run(seq,encode(next));
        outcome={opId:input.opId,status:'accepted',seq};
      }
      this.db.prepare('INSERT INTO outcomes VALUES(?,?,?,?,?)').run(actor,input.epoch,input.opId,fingerprint,encode(outcome));
      beforeCommit?.();return outcome;
    });
    afterCommit?.();return result;
  }
  pull(actor,input) {
    exact(input,['v','schema','epoch','after','pendingIds']);
    if(input.v!==1||input.schema!==1)throw new ProtocolError('UPGRADE_REQUIRED');
    if((input.epoch!==null&&!uuid(input.epoch))||!integer(input.after)||(input.epoch===null&&input.after!==0)||!Array.isArray(input.pendingIds)||input.pendingIds.length>100||new Set(input.pendingIds).size!==input.pendingIds.length||!input.pendingIds.every(uuid))throw new ProtocolError('BAD_CURSOR');
    return transaction(this.db,()=>{
      this.authorize(actor);const meta=this.meta();
      if(input.epoch===meta.epoch&&input.after>meta.head)throw new ProtocolError('FUTURE_CURSOR');
      const receipts=[];
      // Outcomes remain retained even after changes are pruned. Same read snapshot.
      for(const id of input.pendingIds){const row=this.db.prepare('SELECT value FROM outcomes WHERE actor=? AND epoch=? AND op_id=?').get(actor,meta.epoch,id);if(row)receipts.push(decode(row.value));}
      const common={v:1,schema:1,epoch:meta.epoch,after:input.after,head:meta.head,receipts};
      if(input.epoch!==meta.epoch||input.after<meta.floor)return {...common,mode:'snapshot',records:[this.current()],next:meta.head,more:false};
      const changes=this.db.prepare('SELECT seq,record FROM changes WHERE seq>? ORDER BY seq LIMIT 4').all(input.after).map(x=>({seq:x.seq,record:decode(x.record)}));
      const next=changes.at(-1)?.seq??input.after;
      return {...common,mode:'delta',changes,next,more:next<meta.head};
    },{write:false});
  }
  // Trusted local operator/test controls. Not network endpoints.
  allow(actor,allowed){if(!['M','D'].includes(actor))throw new Error('Invalid actor');this.db.prepare('UPDATE grants SET allowed=? WHERE actor=?').run(allowed?1:0,actor);}
  prune(){return transaction(this.db,()=>{const {head}=this.meta();this.db.prepare('DELETE FROM changes WHERE seq<=?').run(head);this.db.prepare('UPDATE meta SET floor=? WHERE id=1').run(head);return head;});}
  rotate(){return transaction(this.db,()=>{this.db.exec('DELETE FROM changes;DELETE FROM outcomes');this.db.prepare('UPDATE meta SET epoch=?,head=0,floor=0 WHERE id=1').run(randomUUID());});}
  stats(){return {meta:this.meta(),record:this.current(),outcomes:this.db.prepare('SELECT count(*) AS n FROM outcomes').get().n,changes:this.db.prepare('SELECT count(*) AS n FROM changes').get().n};}
  close(){this.db.close();}
}
