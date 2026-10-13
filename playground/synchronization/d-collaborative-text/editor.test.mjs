import test from 'node:test';import assert from 'node:assert/strict';
import * as Y from 'yjs';import {WebSocket} from 'ws';
import {mkdtemp,rm} from 'node:fs/promises';import {join} from 'node:path';import {tmpdir} from 'node:os';
import {fork} from 'node:child_process';import {once} from 'node:events';
import {EditorClient,waitFor} from './client.mjs';import {startServer} from './server.mjs';import {DocumentStore} from './store.mjs';
import {b64,updateId} from './protocol.mjs';
async function fixture(t,options={}){const dir=await mkdtemp(join(tmpdir(),'sync-text-test-')),server=await startServer(join(dir,'server.sqlite'),options),m=new EditorClient('M'),d=new EditorClient('D');t.after(async()=>{await m.close();await d.close();await server.close();await rm(dir,{recursive:true,force:true});});await m.connect(server.url);await d.connect(server.url);return {dir,server,m,d};}
function changes(doc,fn){let result;const capture=u=>result=u;doc.on('update',capture);fn();doc.off('update',capture);return result;}
test('Yjs reordered and duplicated updates converge, including missing causal dependency',()=>{
 const base=new Y.Doc();base.clientID=1;base.getText('body').insert(0,'ab');const initial=Y.encodeStateAsUpdate(base);
 const m=new Y.Doc(),d=new Y.Doc();m.clientID=2;d.clientID=3;Y.applyUpdate(m,initial);Y.applyUpdate(d,initial);
 const first=changes(m,()=>m.getText('body').insert(1,'X')),second=changes(m,()=>m.getText('body').insert(2,'Y')),other=changes(d,()=>d.getText('body').delete(0,1));
 const results=[];for(const schedule of [[first,second,other],[other,second,first],[second,second,other,first,first]]){const r=new Y.Doc();Y.applyUpdate(r,initial);for(const u of schedule)Y.applyUpdate(r,u);results.push(r.getText('body').toString());r.destroy();}
 assert.equal(new Set(results).size,1);assert.equal(results[0],'XYb');for(const doc of [base,m,d])doc.destroy();
});
test('state-vector exchange must include deletion evidence even when insertion vectors match',()=>{
 const a=new Y.Doc(),b=new Y.Doc();a.getText('body').insert(0,'abc');Y.applyUpdate(b,Y.encodeStateAsUpdate(a));a.getText('body').delete(1,1);
 assert.deepEqual(Y.encodeStateVector(a),Y.encodeStateVector(b));Y.applyUpdate(b,Y.encodeStateAsUpdate(a,Y.encodeStateVector(b)));assert.equal(b.getText('body').toString(),'ac');a.destroy();b.destroy();
});
test('actual WebSocket clients synchronize text and acknowledge only committed updates',async t=>{
 const {server,m,d}=await fixture(t);m.insert(5,'!');await m.flush();await waitFor(()=>d.value()==='Hello!');assert.equal(server.store.stats().text,'Hello!');assert.equal(server.store.stats().updates,1);assert.equal(m.pending.size,0);
});
test('offline concurrent insertions retain both branches and converge after reconnect',async t=>{
 const {server,m,d}=await fixture(t);await m.disconnect();await d.disconnect();m.insert(5,' Mira');d.insert(5,' Dev');await m.connect(server.url);await m.flush();await d.connect(server.url);await d.flush();await waitFor(()=>m.value()===d.value());assert.match(m.value(),/Mira/);assert.match(m.value(),/Dev/);assert.equal(server.store.stats().text,m.value());
});
test('selective undo removes local contribution while preserving concurrent remote text',async t=>{
 const {server,m,d}=await fixture(t);await m.disconnect();await d.disconnect();m.insert(5,' Mira');d.insert(5,' Dev');await m.connect(server.url);await m.flush();await d.connect(server.url);await d.flush();await waitFor(()=>m.value()===d.value());m.undo();await m.flush();await waitFor(()=>d.value()==='Hello Dev');m.redo();await m.flush();await waitFor(()=>m.value()===d.value()&&d.value().includes('Mira'));
});
test('relative cursor anchors move with concurrent insertion and presence is not persisted',async t=>{
 const {server,m,d}=await fixture(t);m.presence(5);await waitFor(()=>d.peers.size===1);const anchor=[...d.peers.values()][0].anchor;d.insert(0,'X');await d.flush();await waitFor(()=>m.value()==='XHello');assert.equal(d.resolve(anchor),6);assert.equal(server.store.stats().updates,1);
});
test('presence expires without entering document history',async t=>{
 const {server,m,d}=await fixture(t,{presenceMs:100});m.presence(2);await waitFor(()=>d.peers.size===1);await waitFor(()=>d.peers.size===0);assert.equal(server.store.stats().updates,0);
});
test('Unicode editing uses UTF-16 bounds and rejects splitting surrogate pairs',async t=>{
 const {m,d}=await fixture(t);m.insert(5,'😀');assert.throws(()=>m.insert(6,'x'),/SPLIT_SURROGATE/);assert.throws(()=>m.delete(5,1),/SPLIT_SURROGATE/);m.delete(5,2);await m.flush();await waitFor(()=>d.value()==='Hello');assert.equal(m.value(),'Hello');
});
test('read-only clients receive updates but cannot write by forging raw frames',async t=>{
 const {server,m}=await fixture(t);const v=new EditorClient('V');t.after(()=>v.close());await v.connect(server.url);assert.throws(()=>v.insert(0,'x'),/READ_ONLY/);m.insert(5,'!');await m.flush();await waitFor(()=>v.value()==='Hello!');
 const malicious=new Y.Doc();Y.applyUpdate(malicious,Y.encodeStateAsUpdate(v.doc));const update=changes(malicious,()=>malicious.getText('body').insert(0,'x'));
 v.socket.send(JSON.stringify({type:'update',v:1,epoch:v.epoch,id:updateId(update),update:b64(update)}));await waitFor(()=>v.lastError==='FORBIDDEN');assert.equal(server.store.stats().text,'Hello!');malicious.destroy();
});
test('revocation blocks both stale writes and further broadcast disclosure',async t=>{
 const {server,m,d}=await fixture(t);server.store.allow('D','none');m.insert(5,'!');await m.flush();await waitFor(()=>!d.ready);assert.equal(d.value(),'Hello');await assert.rejects(d.connect(server.url),/403/);
});
test('malformed binary and unsupported protocol fail without storing an update',async t=>{
 const {server,m,d}=await fixture(t);m.socket.send(JSON.stringify({type:'update',v:1,epoch:m.epoch,id:'invalid',update:'!!!='}));await waitFor(()=>m.lastError==='BAD_BINARY');d.socket.send(JSON.stringify({type:'update',v:2}));await waitFor(()=>d.lastError==='UPGRADE_REQUIRED');assert.equal(server.store.stats().updates,0);
});
test('candidate validation rejects unexpected roots without mutating server memory or disk',async t=>{
 const {server,m}=await fixture(t);const invalid=new Y.Doc();invalid.getMap('permissions').set('admin',true);const update=Y.encodeStateAsUpdate(invalid);
 assert.throws(()=>server.store.accept('M',m.epoch,updateId(update),update),/BAD_DOCUMENT_ROOT/);assert.equal(server.store.stats().text,'Hello');assert.equal(server.store.stats().updates,0);invalid.destroy();
});
test('duplicate blob replay is idempotent and rechecks current permission',async t=>{
 const {server,m}=await fixture(t);const update=changes(m.doc,()=>m.doc.getText('body').insert(5,'!'));await m.flush();const before=server.store.stats().updates;
 const result=server.store.accept('M',m.epoch,updateId(update),update);assert.equal(result.replay,true);assert.equal(server.store.stats().updates,before);server.store.allow('M','none');assert.throws(()=>server.store.accept('M',m.epoch,updateId(update),update),/FORBIDDEN/);
});
test('out-of-order dependent updates remain recoverable in the stored snapshot',async t=>{
 const dir=await mkdtemp(join(tmpdir(),'sync-text-pending-'));t.after(()=>rm(dir,{recursive:true,force:true}));const path=join(dir,'server.sqlite');let store=new DocumentStore(path);
 const epoch=store.meta().epoch,branch=new Y.Doc();Y.applyUpdate(branch,Y.encodeStateAsUpdate(store.doc));const a=changes(branch,()=>branch.getText('body').insert(5,'X')),b=changes(branch,()=>branch.getText('body').insert(6,'Y'));
 store.accept('M',epoch,updateId(b),b);store.close();store=new DocumentStore(path);
 try{store.accept('M',epoch,updateId(a),a);assert.equal(store.stats().text,'HelloXY');}finally{store.close();branch.destroy();}
});
async function childServer(t,path,fault){
 const cp=fork(new URL('./cli.mjs',import.meta.url),['serve',path,'0'],{execArgv:[],stdio:['ignore','pipe','pipe','ipc'],env:{...process.env,LAB_FAULT:fault??''}});cp.stdout.resume();let errors='';cp.stderr.on('data',x=>errors+=x);const exit=once(cp,'exit');
 t.after(async()=>{if(cp.exitCode===null&&cp.signalCode===null){cp.kill('SIGTERM');const timer=setTimeout(()=>cp.kill('SIGKILL'),2000);try{await exit;}finally{clearTimeout(timer);}}});
 const timer=setTimeout(()=>cp.kill('SIGKILL'),5000);try{const [message]=await once(cp,'message');return {cp,exit,url:message.url,errors:()=>errors};}finally{clearTimeout(timer);}
}
for(const fault of ['before-commit','after-commit'])test(`actual server SIGKILL ${fault} recovers and reconnect retry converges`,async t=>{
 const dir=await mkdtemp(join(tmpdir(),'sync-text-crash-'));t.after(()=>rm(dir,{recursive:true,force:true}));const path=join(dir,'server.sqlite'),s=await childServer(t,path,fault),m=new EditorClient('M');t.after(()=>m.close());await m.connect(s.url);m.insert(5,'!');await waitFor(()=>!m.ready);const [,signal]=await s.exit;assert.equal(signal,'SIGKILL',s.errors());
 const check=new DocumentStore(path);assert.equal(check.stats().text,fault==='before-commit'?'Hello':'Hello!');assert.equal(check.stats().updates,fault==='before-commit'?0:1);check.close();assert.ok(m.pending.size>0);
 const next=await childServer(t,path);await m.connect(next.url);await m.flush();const check2=new DocumentStore(path);assert.equal(check2.stats().text,'Hello!');check2.close();assert.equal(m.value(),'Hello!');
});
test('authority generation change refuses automatic merge of retained private branch',async t=>{
 const {dir,server,m}=await fixture(t);await m.disconnect();m.insert(5,' private');const other=await startServer(join(dir,'new.sqlite'));t.after(()=>other.close());await assert.rejects(m.connect(other.url),/EPOCH_CHANGED_REVIEW_REQUIRED/);assert.equal(m.value(),'Hello private');assert.equal(other.store.stats().text,'Hello');
});

test('multiple in-flight local edits send each pending blob once per connection',async t=>{
 const {m,d}=await fixture(t);for(let i=0;i<20;i++)m.insert(5+i,'x');await m.flush();await waitFor(()=>d.value()===m.value());assert.equal(m.value(),'Hello'+'x'.repeat(20));assert.equal(m.lastError,null);
});
