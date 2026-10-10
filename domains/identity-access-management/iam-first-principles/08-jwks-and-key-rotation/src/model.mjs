import {exportJWK,createLocalJWKSet,createRemoteJWKSet} from 'jose';
import {keys,issue,validate} from '../../07-jwt/src/model.mjs';
export async function publicJwk(key,kid){return {...await exportJWK(key),kid,alg:'RS256',use:'sig'};}
export function remoteKeys(url){const u=new URL(url);if(u.protocol!=='https:'&&!['127.0.0.1','localhost'].includes(u.hostname))throw new Error('TLS required');return createRemoteJWKSet(u,{cooldownDuration:1000,cacheMaxAge:60000,timeoutDuration:2000});}
export async function demo(){const a=await keys(),b=await keys(),ja=await publicJwk(a.publicKey,'old'),jb=await publicJwk(b.publicKey,'new'),t=await issue(a.privateKey,{kid:'old'});await validate(t,createLocalJWKSet({keys:[ja,jb]}));let retiredRejects=false;try{await validate(t,createLocalJWKSet({keys:[jb]}));}catch{retiredRejects=true;}return {overlapAccepts:true,retiredRejects};}
