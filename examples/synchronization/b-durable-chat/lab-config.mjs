import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
const run=promisify(execFile);
export async function labConfig(schema='chat_demo') {
  if(!/^chat_(demo|lab_[a-f0-9]{32})$/.test(schema))throw new Error('Invalid lab schema');
  const endpoint=async(container,port)=>{
    const {stdout}=await run('docker',['port',container,port],{timeout:5000});
    const match=stdout.trim().match(/^127\.0\.0\.1:(\d+)$/);
    if(!match)throw new Error('Require exactly one loopback lab endpoint');
    return Number(match[1]);
  };
  const [dbPort,redisPort]=await Promise.all([endpoint('sync-masterclass-chat-db','5432/tcp'),endpoint('sync-masterclass-chat-broker','6379/tcp')]);
  return {schema,dbPort,redisPort};
}
export function checkedConfig(config){
  if(!/^chat_(demo|lab_[a-f0-9]{32})$/.test(config.schema))throw new Error('Invalid lab schema');
  for(const p of [config.dbPort,config.redisPort])if(!Number.isInteger(p)||p<1||p>65535)throw new Error('Invalid lab port');
  return config;
}
