import {DatabaseSync} from 'node:sqlite';
import * as Y from 'yjs';
import {updateId} from './protocol.mjs';
import {randomUUID} from 'node:crypto';
function valid(doc){
 if([...doc.share.keys()].some(x=>x!=='body'))throw new Error('BAD_DOCUMENT_ROOT');
 const text=doc.getText('body');
 if(text.length>4096||!text.toString().isWellFormed())throw new Error('TEXT_LIMIT');
 for(const delta of text.toDelta())if(typeof delta.insert!=='string'||delta.attributes)throw new Error('PLAIN_TEXT_ONLY');
 if(Y.encodeStateAsUpdate(doc).length>262144)throw new Error('STATE_LIMIT');
}
export class DocumentStore {
 constructor(path){
  this.db=new DatabaseSync(path);this.db.exec('PRAGMA journal_mode=WAL;PRAGMA synchronous=FULL;PRAGMA busy_timeout=3000');
  if(this.db.prepare('PRAGMA user_version').get().user_version>1){this.db.close();throw new Error('UPGRADE_REQUIRED');}
  this.db.exec(`CREATE TABLE IF NOT EXISTS room(id INTEGER PRIMARY KEY CHECK(id=1),epoch TEXT NOT NULL,seq INTEGER NOT NULL,state BLOB NOT NULL);
   CREATE TABLE IF NOT EXISTS updates(hash TEXT PRIMARY KEY,seq INTEGER NOT NULL,data BLOB NOT NULL);
   CREATE TABLE IF NOT EXISTS grants(actor TEXT PRIMARY KEY,role TEXT NOT NULL);
   PRAGMA user_version=1;`);
  this.doc=new Y.Doc();
  const row=this.db.prepare('SELECT state FROM room WHERE id=1').get();
  if(row)Y.applyUpdate(this.doc,row.state);
  else{this.doc.getText('body').insert(0,'Hello');this.db.prepare('INSERT INTO room VALUES(1,?,0,?)').run(randomUUID(),Y.encodeStateAsUpdate(this.doc));}
  for(const [actor,role] of [['M','write'],['D','write'],['V','read']])this.db.prepare('INSERT OR IGNORE INTO grants VALUES(?,?)').run(actor,role);
 }
 role(actor){return this.db.prepare('SELECT role FROM grants WHERE actor=?').get(actor)?.role;}
 allow(actor,role){if(!['M','D','V'].includes(actor)||!['write','read','none'].includes(role))throw new Error('BAD_GRANT');this.db.prepare('UPDATE grants SET role=? WHERE actor=?').run(role,actor);}
 meta(){return {...this.db.prepare('SELECT epoch,seq FROM room WHERE id=1').get()};}
 accept(actor,epoch,id,data,{beforeCommit,afterCommit}={}){
  if(this.role(actor)!=='write')throw new Error('FORBIDDEN');
  if(epoch!==this.meta().epoch)throw new Error('EPOCH_CHANGED');
  if(id!==updateId(data))throw new Error('BAD_UPDATE_ID');
  const prior=this.db.prepare('SELECT seq FROM updates WHERE hash=?').get(id);
  if(prior)return {seq:prior.seq,replay:true};
  const candidate=new Y.Doc();Y.applyUpdate(candidate,Y.encodeStateAsUpdate(this.doc));
  try{Y.applyUpdate(candidate,data);valid(candidate);}catch(error){candidate.destroy();throw error;}
  this.db.exec('BEGIN IMMEDIATE');let seq;
  try{
   seq=this.meta().seq+1;if(!Number.isSafeInteger(seq))throw new Error('SEQUENCE_LIMIT');
   this.db.prepare('INSERT INTO updates VALUES(?,?,?)').run(id,seq,data);
   this.db.prepare('UPDATE room SET state=?,seq=? WHERE id=1').run(Y.encodeStateAsUpdate(candidate),seq);
   beforeCommit?.();this.db.exec('COMMIT');
  }catch(error){if(this.db.isTransaction)this.db.exec('ROLLBACK');candidate.destroy();throw error;}
  // Publish the committed candidate only after the disk transaction commits.
  const previous=this.doc;this.doc=candidate;previous.destroy();afterCommit?.();return {seq,replay:false};
 }
 stats(){return {text:this.doc.getText('body').toString(),...this.meta(),updates:this.db.prepare('SELECT count(*) AS n FROM updates').get().n};}
 close(){this.doc.destroy();this.db.close();}
}
