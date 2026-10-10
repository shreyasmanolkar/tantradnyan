import {secret,digest,equal} from '../../01-cryptography/src/model.mjs';
export class Clients {
 constructor(){this.rows=new Map();}
 register(id,audience,scopes){const raw=secret();this.rows.set(id,{hash:digest(raw),audience,scopes,active:true});return raw;}
 authenticate(id,raw,audience,scopes){const c=this.rows.get(id);if(!c?.active||!raw||!equal(c.hash,digest(raw)))throw new Error('invalid_client');if(c.audience!==audience||scopes.some(s=>!c.scopes.includes(s)))throw new Error('invalid_scope');return {id,kind:'service',audience,scopes};}
}
export function demo(){const c=new Clients(),key=c.register('worker','urn:docs',['document:read']);return c.authenticate('worker',key,'urn:docs',['document:read']);}
