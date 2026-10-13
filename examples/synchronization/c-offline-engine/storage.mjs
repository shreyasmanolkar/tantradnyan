import {DatabaseSync} from 'node:sqlite';
export function open(path) {
  const db=new DatabaseSync(path);
  db.exec('PRAGMA journal_mode=WAL; PRAGMA synchronous=FULL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=3000;');
  return db;
}
// No await inside this boundary: the synchronous callback must own the connection.
export function transaction(db, fn, {write=true}={}) {
  db.exec(write?'BEGIN IMMEDIATE':'BEGIN');
  try { const result=fn(); db.exec('COMMIT'); return result; }
  catch(error) { if(db.isTransaction)db.exec('ROLLBACK'); throw error; }
}
export class ProtocolError extends Error {
  constructor(code){super(code);this.code=code;}
}
export const encode=JSON.stringify;
export const decode=JSON.parse;
export const integer=x=>Number.isSafeInteger(x)&&x>=0;
export const uuid=x=>typeof x==='string'&&/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(x);
export function exact(value, keys) {
  if(!value||typeof value!=='object'||Array.isArray(value)||Object.keys(value).sort().join(',')!==keys.slice().sort().join(','))throw new ProtocolError('BAD_SHAPE');
}
export function record(value) {
  exact(value,['id','title','count','version','deleted']);
  if(value.id!=='task-7'||typeof value.title!=='string'||Buffer.byteLength(value.title)>1024||!value.title.isWellFormed()||value.title.includes('\0')||!integer(value.count)||!integer(value.version)||typeof value.deleted!=='boolean')throw new ProtocolError('BAD_RECORD');
  return value;
}
export function operation(value) {
  exact(value,['v','schema','epoch','opId','recordId','kind','payload','dependsOn']);
  if(value.v!==1||value.schema!==1)throw new ProtocolError('UPGRADE_REQUIRED');
  if(!uuid(value.epoch)||!uuid(value.opId)||(value.dependsOn!==null&&!uuid(value.dependsOn))||value.dependsOn===value.opId||value.recordId!=='task-7')throw new ProtocolError('BAD_OPERATION');
  if(value.kind==='increment') {
    exact(value.payload,['delta']);
    if(!Number.isSafeInteger(value.payload.delta)||value.payload.delta<1||value.payload.delta>100)throw new ProtocolError('BAD_DELTA');
  } else if(value.kind==='title') {
    exact(value.payload,['expectedVersion','title']);
    if(!integer(value.payload.expectedVersion)||typeof value.payload.title!=='string'||!value.payload.title||Buffer.byteLength(value.payload.title)>1024||!value.payload.title.isWellFormed()||value.payload.title.includes('\0'))throw new ProtocolError('BAD_TITLE');
  } else if(value.kind==='delete') {
    exact(value.payload,['expectedVersion']);
    if(!integer(value.payload.expectedVersion))throw new ProtocolError('BAD_VERSION');
  } else throw new ProtocolError('BAD_KIND');
  return value;
}
export function optimistic(base, op) {
  if(base.deleted)return base;
  const next={...base,version:base.version+1};
  if(op.kind==='increment')next.count+=op.payload.delta;
  if(op.kind==='title')next.title=op.payload.title;
  if(op.kind==='delete')next.deleted=true;
  return record(next);
}
