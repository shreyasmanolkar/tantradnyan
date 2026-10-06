import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {MVCC} from '../../shared/mechanisms.mjs';
export async function run() {
 function skew(validate) {
  const db=new MVCC({A:true,B:true}),a=db.begin(),b=db.begin();
  if(db.read(a,'B'))db.write(a,'A',false);if(db.read(b,'A'))db.write(b,'B',false);
  const commits=[db.commit(a,validate),db.commit(b,validate)];return {commits,state:db.values};
 }
 const snapshot=skew(false),serial=skew(true);assert.deepEqual(snapshot.state,{A:false,B:false});assert.deepEqual(serial.commits,[true,false]);
 return {snapshot,serial};
}
if(process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href) console.log(JSON.stringify(await run(),null,2));
