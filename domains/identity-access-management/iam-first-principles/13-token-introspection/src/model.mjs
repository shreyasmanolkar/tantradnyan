import {secret,digest} from '../../01-cryptography/src/model.mjs';
export class OpaqueTokens {
 constructor(){this.rows=new Map();}
 issue({sub,aud,scope,expires}){const t=secret();this.rows.set(digest(t),{sub,aud,scope,exp:expires,active:true});return t;}
 introspect(token,resource,now){const r=this.rows.get(digest(token??''));return r?.active&&r.exp>now&&r.aud===resource?{...r}:{active:false};}
 revoke(token){const r=this.rows.get(digest(token??''));if(r)r.active=false;}
}
export function demo(){const s=new OpaqueTokens(),t=s.issue({sub:'alice',aud:'docs',scope:'read',expires:10});const before=s.introspect(t,'docs',0).active;s.revoke(t);return {before,after:s.introspect(t,'docs',1).active};}
