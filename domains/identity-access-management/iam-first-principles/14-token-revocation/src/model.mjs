import {secret,digest} from '../../01-cryptography/src/model.mjs';
export class RefreshFamilies {
 constructor(){this.tokens=new Map();this.families=new Map();}
 issue({subject,clientId,now=0,ttl=3600}){const family=secret();this.families.set(family,{subject,clientId,expires:now+ttl,revoked:false});return this.child(family);}
 child(family){const raw=secret();this.tokens.set(digest(raw),{family,used:false});return raw;}
 rotate(raw,clientId,now){const r=this.tokens.get(digest(raw??'')),f=r&&this.families.get(r.family);if(!r||!f||f.clientId!==clientId||f.revoked||f.expires<=now)throw new Error('invalid_grant');if(r.used){f.revoked=true;throw new Error('reuse: family revoked');}r.used=true;return this.child(r.family);}
 revoke(raw){const r=this.tokens.get(digest(raw??''));if(r)this.families.get(r.family).revoked=true;}
 revokeUser(subject){for(const f of this.families.values())if(f.subject===subject)f.revoked=true;}
}
export function demo(){const r=new RefreshFamilies(),a=r.issue({subject:'alice',clientId:'app'}),b=r.rotate(a,'app',1);let reuse=false,childRevoked=false;try{r.rotate(a,'app',2);}catch{reuse=true;}try{r.rotate(b,'app',3);}catch{childRevoked=true;}return {reuse,childRevoked};}
