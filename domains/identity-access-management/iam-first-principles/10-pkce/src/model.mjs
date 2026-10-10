import {createHash,randomBytes} from 'node:crypto';
import {Codes,clients} from '../../09-oauth-authorization-code/src/model.mjs';
export const verifier=()=>randomBytes(32).toString('base64url');
export const challengeOf=v=>createHash('sha256').update(v,'ascii').digest('base64url');
export function scenario(){const codes=new Codes(clients()),v=verifier(),request={clientId:'browser',redirectUri:'http://127.0.0.1:3000/callback',subject:'alice',scopes:['document:read'],challenge:challengeOf(v),consent:true};return {codes,v,request,code:codes.authorize(request)};}
export function demo(){const s=scenario();let interceptedDenied=false;try{s.codes.redeem({...s.request,code:s.code,verifier:verifier(),challengeOf});}catch{interceptedDenied=true;}return {interceptedDenied,legitimate:s.codes.redeem({...s.request,code:s.code,verifier:s.v,challengeOf}).subject};}
