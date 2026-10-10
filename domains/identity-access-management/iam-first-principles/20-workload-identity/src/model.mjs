import {generateKeyPairSync,sign,verify} from 'node:crypto';
import {digest} from '../../01-cryptography/src/model.mjs';
// Canonical bytes for this bounded exercise; production uses RFC 9421 implementations.
export function canonical({method,path,body,nonce,time,audience}){if(!/^[A-Z]+$/.test(method)||[path,nonce,audience].some(v=>/[\r\n]/.test(v)))throw new Error('ambiguous request');return Buffer.from([method,path,digest(body),nonce,String(time),audience].join('\n'));}
export class SignedRequests {
 constructor(publicKey,audience){this.publicKey=publicKey;this.audience=audience;this.used=new Set();}
 check(request,signature,now){if(request.audience!==this.audience||Math.abs(now-request.time)>30||this.used.has(request.nonce)||!verify(null,canonical(request),this.publicKey,signature))return false;this.used.add(request.nonce);return true;}
}
export function demo(){const k=generateKeyPairSync('ed25519'),r={method:'POST',path:'/docs',body:'{}',nonce:crypto.randomUUID(),time:100,audience:'docs'},s=sign(null,canonical(r),k.privateKey),v=new SignedRequests(k.publicKey,'docs');return {first:v.check(r,s,100),replay:v.check(r,s,101)};}
