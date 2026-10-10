import {secret,digest,equal} from '../../01-cryptography/src/model.mjs';
export class ApiKeys {
 constructor(){this.rows=new Map();}
 issue({principal,audience,scopes,expires}){const id=secret().slice(0,12),raw=secret();this.rows.set(id,{hash:digest(raw),principal,audience,scopes,expires,active:true});return `${id}.${raw}`;}
 validate(token,audience,now){const [id,raw,...extra]=(token??'').split('.'),r=this.rows.get(id);if(extra.length||!r||!raw||!r.active||r.expires<=now||r.audience!==audience||!equal(r.hash,digest(raw)))return null;return {principal:r.principal,scopes:[...r.scopes]};}
 revoke(token){const row=this.rows.get(token.split('.')[0]);if(row)row.active=false;}
}
export function demo(){const k=new ApiKeys(),token=k.issue({principal:'integration',audience:'docs',scopes:['read'],expires:10});const valid=!!k.validate(token,'docs',0);k.revoke(token);return {valid,revoked:!k.validate(token,'docs',1)};}
