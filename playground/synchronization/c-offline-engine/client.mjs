import {randomUUID} from 'node:crypto';
import {open,transaction,encode,decode,ProtocolError,exact,integer,uuid,record,operation,optimistic} from './storage.mjs';
export class OfflineClient {
  constructor(path,actor) {
    if(!['M','D'].includes(actor))throw new Error('Invalid fixture actor');
    this.db=open(path);this.actor=actor;this.running=false;
    if(this.db.prepare('PRAGMA user_version').get().user_version>1){this.db.close();throw new ProtocolError('LOCAL_UPGRADE_REQUIRED');}
    this.db.exec(`CREATE TABLE IF NOT EXISTS meta(id INTEGER PRIMARY KEY CHECK(id=1),actor TEXT NOT NULL,device TEXT NOT NULL,epoch TEXT,cursor INTEGER NOT NULL);
      CREATE TABLE IF NOT EXISTS confirmed(id TEXT PRIMARY KEY,value TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS pending(ordinal INTEGER PRIMARY KEY AUTOINCREMENT,op_id TEXT NOT NULL UNIQUE,operation TEXT NOT NULL,status TEXT NOT NULL,seq INTEGER);
      CREATE TABLE IF NOT EXISTS receipts(op_id TEXT PRIMARY KEY,value TEXT NOT NULL);
      PRAGMA user_version=1;`);
    transaction(this.db,()=>{this.db.prepare('INSERT OR IGNORE INTO meta VALUES(1,?,?,NULL,0)').run(actor,randomUUID());});
    if(this.meta().actor!==actor){this.db.close();throw new ProtocolError('ACTOR_MISMATCH');}
  }
  meta(){return {...this.db.prepare('SELECT actor,device,epoch,cursor FROM meta').get()};}
  pending(){return this.db.prepare('SELECT ordinal,operation,status,seq FROM pending ORDER BY ordinal').all().map(x=>({...x,operation:decode(x.operation)}));}
  receipts(){return this.db.prepare('SELECT value FROM receipts ORDER BY rowid').all().map(x=>decode(x.value));}
  confirmed(){const x=this.db.prepare('SELECT value FROM confirmed WHERE id=?').get('task-7');return x?decode(x.value):null;}
  view(){let value=this.confirmed();if(!value)return null;for(const row of this.pending())if(['queued','accepted'].includes(row.status))value=optimistic(value,row.operation);return value;}
  enqueue(kind,value,{beforeCommit,afterCommit}={}) {
    const id=transaction(this.db,()=>{
      const meta=this.meta(),base=this.view();
      if(!base||!meta.epoch)throw new ProtocolError('BOOTSTRAP_REQUIRED');
      if(base.deleted)throw new ProtocolError('DELETED');
      if(this.pending().length>=100)throw new ProtocolError('QUEUE_FULL');
      const payload=kind==='increment'?{delta:value}:kind==='title'?{expectedVersion:base.version,title:value}:{expectedVersion:base.version};
      const op=operation({v:1,schema:1,epoch:meta.epoch,opId:randomUUID(),recordId:base.id,kind,payload,dependsOn:kind==='increment'?null:this.pending().filter(x=>['queued','accepted'].includes(x.status)).at(-1)?.operation.opId??null});
      optimistic(base,op); // Validate proposed projection before storing durable intent.
      this.db.prepare('INSERT INTO pending(op_id,operation,status) VALUES(?,?,?)').run(op.opId,encode(op),'queued');
      beforeCommit?.();return op.opId;
    });
    afterCommit?.();return id;
  }
  pullRequest(){const m=this.meta();return {v:1,schema:1,epoch:m.epoch,after:m.cursor,pendingIds:this.pending().map(x=>x.operation.opId)};}
  saveReceipt(receipt,head=Number.MAX_SAFE_INTEGER) {
    if(!receipt||typeof receipt!=='object'||!uuid(receipt.opId))throw new ProtocolError('BAD_RECEIPT');
    if(receipt.status==='accepted'){exact(receipt,['opId','status','seq']);if(!integer(receipt.seq)||receipt.seq<1||receipt.seq>head)throw new ProtocolError('BAD_RECEIPT');}
    else {exact(receipt,['opId','status','reason']);if(!['conflict','rejected'].includes(receipt.status)||!['STALE_VERSION','DELETED','DEPENDENCY_FAILED'].includes(receipt.reason))throw new ProtocolError('BAD_RECEIPT');}
    const row=this.db.prepare('SELECT operation FROM pending WHERE op_id=?').get(receipt.opId);
    if(!row)throw new ProtocolError('UNKNOWN_RECEIPT');
    const prior=this.db.prepare('SELECT value FROM receipts WHERE op_id=?').get(receipt.opId);
    if(prior&&prior.value!==encode(receipt))throw new ProtocolError('CHANGED_RECEIPT');
    this.db.prepare('INSERT OR IGNORE INTO receipts VALUES(?,?)').run(receipt.opId,encode(receipt));
    this.db.prepare('UPDATE pending SET status=?,seq=? WHERE op_id=?').run(receipt.status,receipt.seq??null,receipt.opId);
  }
  install(response,request,{beforeCommit,afterCommit}={}) {
    transaction(this.db,()=>{
      const m=this.meta();
      if(m.epoch!==request.epoch||m.cursor!==request.after)throw new ProtocolError('STALE_RESPONSE');
      const common=['v','schema','epoch','after','head','receipts','mode','next','more'];
      exact(response,[...common,response.mode==='snapshot'?'records':'changes']);
      if(response.v!==1||response.schema!==1)throw new ProtocolError('UPGRADE_REQUIRED');
      if(!uuid(response.epoch)||response.after!==request.after||!integer(response.head)||!integer(response.next)||response.next>response.head||typeof response.more!=='boolean'||!Array.isArray(response.receipts)||response.receipts.length>100||new Set(response.receipts.map(x=>x.opId)).size!==response.receipts.length)throw new ProtocolError('BAD_PAGE');
      if(response.receipts.some(x=>!request.pendingIds.includes(x.opId)))throw new ProtocolError('UNREQUESTED_RECEIPT');
      const sameEpoch=m.epoch===response.epoch;
      if(sameEpoch&&response.head<m.cursor)throw new ProtocolError('SOURCE_ROLLBACK');
      if(response.mode==='snapshot'){
        if(!Array.isArray(response.records)||response.records.length!==1||response.next!==response.head||response.more)throw new ProtocolError('BAD_SNAPSHOT');
        record(response.records[0]);
        this.db.exec('DELETE FROM confirmed');
        this.db.prepare('INSERT INTO confirmed VALUES(?,?)').run('task-7',encode(response.records[0]));
        if(!sameEpoch&&m.epoch!==null){
          // Unknown old-generation effects must never be retried automatically.
          this.db.prepare("UPDATE pending SET status='review',seq=NULL WHERE status IN ('queued','accepted')").run();
        }
      }else if(response.mode==='delta'){
        if(!sameEpoch||!Array.isArray(response.changes)||response.changes.length>4)throw new ProtocolError('BAD_DELTA');
        let next=m.cursor;
        for(const change of response.changes){exact(change,['seq','record']);if(change.seq!==next+1||change.seq>response.head)throw new ProtocolError('NONCONTIGUOUS');record(change.record);this.db.prepare('INSERT INTO confirmed VALUES(?,?) ON CONFLICT(id) DO UPDATE SET value=excluded.value').run(change.record.id,encode(change.record));next=change.seq;}
        if(response.next!==next||response.more!==(next<response.head))throw new ProtocolError('BAD_CHECKPOINT');
      }else throw new ProtocolError('BAD_MODE');
      // Reconcile pending effects in the SAME transaction as the projection/cursor.
      for(const receipt of response.receipts){
        const row=this.db.prepare('SELECT operation FROM pending WHERE op_id=?').get(receipt.opId);
        if(!row||decode(row.operation).epoch!==response.epoch)throw new ProtocolError('RECEIPT_EPOCH');
        this.saveReceipt(receipt,response.head);
      }
      this.db.prepare('UPDATE meta SET epoch=?,cursor=? WHERE id=1').run(response.epoch,response.next);
      this.db.prepare("DELETE FROM pending WHERE status='accepted' AND seq<=?").run(response.next);
      beforeCommit?.();
    });
    afterCommit?.();
  }
  recordOutcome(outcome,opId) {
    if(outcome.opId!==opId)throw new ProtocolError('WRONG_OUTCOME');
    transaction(this.db,()=>this.saveReceipt(outcome));
  }
  async synchronize(url,{fault,maxPages=100}={}) {
    if(this.running)throw new ProtocolError('SYNC_BUSY');this.running=true;
    const kill=()=>process.kill(process.pid,'SIGKILL');
    try {
      const transport=new HttpTransport(url,this.actor);
      const pull=async()=>{
        for(let page=0;page<maxPages;page++){
          const request=this.pullRequest(),response=await transport.call('/pull',request);
          this.install(response,request,{beforeCommit:fault==='before-client-install'?kill:undefined,afterCommit:fault==='after-client-install'?kill:undefined});
          if(!response.more)return;
        }
        throw new ProtocolError('CATCHUP_BUDGET');
      };
      // Receipts reconcile unknown prior successes before replay, including snapshot reset.
      await pull();
      for(const row of this.pending())if(row.status==='queued'){
        const outcome=await transport.call('/submit',row.operation);
        if(fault==='after-response-before-receipt')kill();
        this.recordOutcome(outcome,row.operation.opId);
      }
      await pull();return {meta:this.meta(),confirmed:this.confirmed(),view:this.view(),pending:this.pending()};
    } finally {this.running=false;}
  }
  // Human resolution creates a NEW intent; never changes an old operation fingerprint.
  resolve(opId,decision,title) {
    return transaction(this.db,()=>{
      const row=this.db.prepare('SELECT status FROM pending WHERE op_id=?').get(opId);
      if(!row||!['conflict','rejected','review'].includes(row.status))throw new ProtocolError('NOT_REVIEWABLE');
      if(decision==='discard'){this.db.prepare('DELETE FROM pending WHERE op_id=?').run(opId);return null;}
      if(decision!=='title')throw new ProtocolError('BAD_DECISION');
      const base=this.view(),meta=this.meta();if(!base||base.deleted)throw new ProtocolError('DELETED');
      const op=operation({v:1,schema:1,epoch:meta.epoch,opId:randomUUID(),recordId:base.id,kind:'title',payload:{expectedVersion:base.version,title},dependsOn:this.pending().filter(x=>['queued','accepted'].includes(x.status)).at(-1)?.operation.opId??null});
      optimistic(base,op);
      this.db.prepare('DELETE FROM pending WHERE op_id=?').run(opId);
      this.db.prepare('INSERT INTO pending(op_id,operation,status) VALUES(?,?,?)').run(op.opId,encode(op),'queued');return op.opId;
    });
  }
  close(){this.db.close();}
}
export class HttpTransport {
  constructor(url,actor,{attempts=3,fetchFn=fetch,delayMs=20}={}){
    const u=new URL(url);
    if(u.protocol!=='http:'||u.hostname!=='127.0.0.1'||u.pathname!=='/'||u.username||u.password||u.search||u.hash||!['M','D'].includes(actor))throw new Error('Require fixture loopback URL');
    if(!Number.isInteger(attempts)||attempts<1||attempts>5||!integer(delayMs)||delayMs>1000)throw new Error('Invalid retry budget');
    this.url=u.origin;this.actor=actor;this.attempts=attempts;this.fetchFn=fetchFn;this.delayMs=delayMs;
  }
  async call(path,body){
    if(!['/submit','/pull'].includes(path))throw new Error('Unknown path');
    const encoded=encode(body); // Every retry transmits exactly the same logical request.
    for(let attempt=0;attempt<this.attempts;attempt++){
      try {
        const response=await this.fetchFn(this.url+path,{method:'POST',headers:{authorization:`Bearer ${this.actor==='M'?'mira-demo':'dev-demo'}`,'content-type':'application/json'},body:encoded,signal:AbortSignal.timeout(3000),redirect:'error'});
        let bytes=0;const chunks=[];
        for await(const chunk of response.body){bytes+=chunk.length;if(bytes>262144)throw new ProtocolError('RESPONSE_TOO_LARGE');chunks.push(chunk);}
        let result;try{result=decode(Buffer.concat(chunks).toString('utf8'));}catch{throw new ProtocolError('BAD_JSON_RESPONSE');}
        if(!response.ok)throw new ProtocolError(result.error??'HTTP_ERROR');return result;
      }catch(error){
        const transient=error instanceof TypeError||['AbortError','TimeoutError'].includes(error.name)||error.code==='RETRY_UNKNOWN';
        if(!transient||attempt+1===this.attempts)throw error;
        const delay=Math.floor(Math.random()*this.delayMs*2**attempt);
        await new Promise(resolve=>setTimeout(resolve,delay));
      }
    }
  }
}
