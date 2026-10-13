import * as Y from 'yjs';
import {WebSocket} from 'ws';
import {EventEmitter} from 'node:events';
import {LOCAL,REMOTE,binary,b64,updateId,boundary} from './protocol.mjs';
export async function waitFor(predicate,{timeout=4000}={}){
 const end=Date.now()+timeout;while(!predicate()){if(Date.now()>end)throw new Error('WAIT_TIMEOUT');await new Promise(r=>setTimeout(r,10));}
}
export class EditorClient extends EventEmitter {
 constructor(actor){
  super();if(!['M','D','V'].includes(actor))throw new Error('BAD_ACTOR');this.actor=actor;
  this.doc=new Y.Doc();this.text=this.doc.getText('body');this.pending=new Map();this.inFlight=new Set();this.peers=new Map();this.socket=null;this.epoch=null;this.role=null;this.lastError=null;this.ready=false;
  this.undoManager=new Y.UndoManager(this.text,{trackedOrigins:new Set([LOCAL]),captureTimeout:0});
  this.doc.on('update',(update,origin)=>{
   if(origin===REMOTE)return;
   const id=updateId(update);this.pending.set(id,b64(update));this.sendPending();this.emit('change',this.value());
  });
 }
 value(){return this.text.toString();}
 checkEditable(){if(!this.epoch)throw new Error('BOOTSTRAP_REQUIRED');if(this.role!=='write')throw new Error('READ_ONLY');if(this.pending.size>=100)throw new Error('LOCAL_QUEUE_LIMIT');}
 insert(index,value){this.checkEditable();if(typeof value!=='string'||!value.isWellFormed()||!value)throw new Error('BAD_TEXT');boundary(this.value(),index);if(this.text.length+value.length>4096)throw new Error('TEXT_LIMIT');this.doc.transact(()=>this.text.insert(index,value),LOCAL);}
 delete(index,length){this.checkEditable();if(!Number.isInteger(length)||length<1)throw new Error('BAD_LENGTH');boundary(this.value(),index);boundary(this.value(),index+length);this.doc.transact(()=>this.text.delete(index,length),LOCAL);}
 undo(){this.checkEditable();this.undoManager.undo();}
 redo(){this.checkEditable();this.undoManager.redo();}
 anchor(index,assoc=0){boundary(this.value(),index);return b64(Y.encodeRelativePosition(Y.createRelativePositionFromTypeIndex(this.text,index,assoc)));}
 resolve(anchor){try{const p=Y.createAbsolutePositionFromRelativePosition(Y.decodeRelativePosition(binary(anchor,256)),this.doc);return p?.type===this.text?p.index:null;}catch{return null;}}
 presence(index){if(!this.ready)throw new Error('DISCONNECTED');this.socket.send(JSON.stringify({type:'presence',v:1,anchor:this.anchor(index)}));}
 sendPending(){if(!this.ready||this.role!=='write'||this.socket?.readyState!==WebSocket.OPEN)return;for(const [id,update] of this.pending){if(this.inFlight.has(id))continue;if(this.socket.bufferedAmount>524288){this.socket.close(1013,'local queue retained');return;}this.inFlight.add(id);this.socket.send(JSON.stringify({type:'update',v:1,epoch:this.epoch,id,update}));}}
 async connect(url){
  if(this.socket&&[WebSocket.OPEN,WebSocket.CONNECTING].includes(this.socket.readyState))throw new Error('ALREADY_CONNECTED');
  const u=new URL(url);if(u.protocol!=='ws:'||u.hostname!=='127.0.0.1'||u.pathname!=='/document'||u.username||u.password||u.search||u.hash)throw new Error('LOOPBACK_ONLY');
  this.ready=false;this.lastError=null;this.peers.clear();this.inFlight.clear();
  const token={M:'mira-demo',D:'dev-demo',V:'viewer-demo'}[this.actor];
  const socket=new WebSocket(url,'text.v1',{headers:{authorization:`Bearer ${token}`},maxPayload:524288,perMessageDeflate:false});this.socket=socket;
  return new Promise((resolve,reject)=>{
   const timer=setTimeout(()=>{socket.terminate();reject(new Error('CONNECT_TIMEOUT'));},4000);let settled=false;
   const fail=error=>{this.lastError=error.message;this.emit('protocol-error',error.message);if(!settled){settled=true;clearTimeout(timer);reject(error);}};
   socket.on('error',fail);
   socket.on('close',()=>{this.ready=false;this.peers.clear();if(!settled)fail(new Error('CLOSED_BEFORE_SYNC'));this.emit('connection',false);});
   socket.on('message',raw=>{
    try{
     const m=JSON.parse(raw.toString());
     if(m.type==='snapshot'){
      if(m.v!==1||!['write','read'].includes(m.role)||!Number.isSafeInteger(m.seq)||m.seq<0||typeof m.epoch!=='string')throw new Error('BAD_SNAPSHOT');
      if(this.epoch&&this.epoch!==m.epoch)throw new Error('EPOCH_CHANGED_REVIEW_REQUIRED');
      this.epoch=m.epoch;this.role=m.role;Y.applyUpdate(this.doc,binary(m.update),REMOTE);
      this.ready=true;
      if(this.role==='write'){
       const diff=Y.encodeStateAsUpdate(this.doc,binary(m.vector,65536));
       if(diff.length>2)this.pending.set(updateId(diff),b64(diff));
       this.sendPending();
      }
      if(!settled){settled=true;clearTimeout(timer);resolve();}this.emit('change',this.value());this.emit('connection',true);
     }else if(m.type==='update'){
      if(m.epoch!==this.epoch)throw new Error('EPOCH_CHANGED_REVIEW_REQUIRED');Y.applyUpdate(this.doc,binary(m.update),REMOTE);this.emit('change',this.value());
     }else if(m.type==='ack'){
      if(m.epoch!==this.epoch||!this.pending.has(m.id))return;this.pending.delete(m.id);this.inFlight.delete(m.id);this.emit('ack',m);
     }else if(m.type==='presence'){this.peers.set(m.session,{actor:m.actor,anchor:m.anchor});this.emit('presence');}
     else if(m.type==='presence-remove'){this.peers.delete(m.session);this.emit('presence');}
     else if(m.type==='error'){fail(new Error(m.code));}
     else throw new Error('BAD_MESSAGE');
    }catch(error){fail(error);socket.close(1008,'provider error');}
   });
  });
 }
 async flush(){await waitFor(()=>this.pending.size===0||this.lastError);if(this.lastError)throw new Error(this.lastError);}
 async disconnect(){const socket=this.socket;if(!socket||socket.readyState===WebSocket.CLOSED)return;await new Promise(resolve=>{socket.once('close',resolve);socket.close();});}
 async close(){await this.disconnect();this.undoManager.destroy();this.doc.destroy();}
}
