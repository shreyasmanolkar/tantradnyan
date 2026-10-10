import {secret,digest,equal} from '../../01-cryptography/src/model.mjs';
export class Codes {
 constructor(clients){this.clients=clients;this.rows=new Map();}
 authorize({clientId,redirectUri,subject,scopes,challenge,method='S256',now=0,consent=false}){
 const c=this.clients.get(clientId);if(!c||!c.redirects.includes(redirectUri))throw new Error('invalid redirect: do not redirect');
 if(!consent||!challenge||method!=='S256'||!/^[A-Za-z0-9_-]{43}$/.test(challenge)||scopes.some(s=>!c.scopes.includes(s)))throw new Error('invalid request or consent');
 const code=secret();this.rows.set(digest(code),{clientId,redirectUri,subject,scopes:[...scopes],challenge,expires:now+60,used:false});return code;
 }
 redeem({code,clientId,redirectUri,verifier,challengeOf,now=0}){
 const r=this.rows.get(digest(code??''));if(!r||r.used||r.expires<=now||r.clientId!==clientId||r.redirectUri!==redirectUri)throw new Error('invalid_grant');
 if(typeof verifier!=='string'||!/^[A-Za-z0-9._~-]{43,128}$/.test(verifier)||!equal(r.challenge,challengeOf(verifier)))throw new Error('invalid_grant');
 // No await between checking and consuming: atomic only in this single-process model.
 r.used=true;return {subject:r.subject,clientId:r.clientId,scopes:[...r.scopes]};
 }
}
export const clients=()=>new Map([['browser',{redirects:['http://127.0.0.1:3000/callback'],scopes:['document:read']}]]);
export const demo=()=>({states:['authenticated + consent','issued bound code','validated verifier','atomically consumed'],redirectRule:'exact registered URI'});
