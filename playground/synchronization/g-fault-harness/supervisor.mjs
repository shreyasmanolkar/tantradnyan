import {fork} from 'node:child_process';import {once} from 'node:events';
const cli=new URL('../c-offline-engine/cli.mjs',import.meta.url);
export function launch(args,{fault}={}){
 const child=fork(cli,args,{execArgv:[],stdio:['ignore','pipe','pipe','ipc'],env:{...process.env,LAB_FAULT:fault??''}});let errors='';child.stdout.resume();child.stderr.on('data',data=>errors+=data);const exited=once(child,'exit');
 return {child,exited,errors:()=>errors,stop:async()=>{if(child.exitCode===null&&child.signalCode===null){child.kill('SIGTERM');const timer=setTimeout(()=>child.kill('SIGKILL'),2000);try{await exited;}finally{clearTimeout(timer);}}}};
}
export async function authorityProcess(path,{fault}={}){
 const process=launch(['serve',path,'0'],{fault});const timer=setTimeout(()=>process.child.kill('SIGKILL'),5000);
 try{const [message]=await Promise.race([once(process.child,'message'),process.exited.then(()=>{throw new Error('SERVER_EXIT_BEFORE_READY: '+process.errors());})]);return {...process,url:message.url};}finally{clearTimeout(timer);}
}
export async function crashedClient(args,fault){const process=launch(args,{fault});let timedOut=false;const timer=setTimeout(()=>{timedOut=true;process.child.kill('SIGKILL');},6000);try{const [code,signal]=await process.exited;if(timedOut)throw new Error('CRASH_PHASE_TIMEOUT');if(signal!=='SIGKILL'||code!==null)throw new Error('EXPECTED_CRASH: '+process.errors());}finally{clearTimeout(timer);await process.stop();}}
