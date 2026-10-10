import {randomUUID} from 'node:crypto';
export const schemas={User:'urn:ietf:params:scim:schemas:core:2.0:User',Group:'urn:ietf:params:scim:schemas:core:2.0:Group',Patch:'urn:ietf:params:scim:api:messages:2.0:PatchOp',List:'urn:ietf:params:scim:api:messages:2.0:ListResponse',Error:'urn:ietf:params:scim:api:messages:2.0:Error'};
export function error(status,detail,scimType){return Object.assign(new Error(detail),{status,scimType});}
export class Scim {
 constructor(onDeactivate=()=>{}){this.rows=new Map();this.onDeactivate=onDeactivate;}
 key(tenant,kind,id){return `${tenant}:${kind}:${id}`;}
 create(tenant,kind,input){
 if(!['User','Group'].includes(kind)||!input.schemas?.includes(schemas[kind]))throw error(400,'invalid schema','invalidValue');
 const name=kind==='User'?'userName':'displayName';if(typeof input[name]!=='string'||!input[name].trim())throw error(400,'name required','invalidValue');
 if(input.externalId!==undefined&&typeof input.externalId!=='string')throw error(400,'invalid externalId','invalidValue');
 if(input.active!==undefined&&typeof input.active!=='boolean')throw error(400,'invalid active','invalidValue');
 if([...this.rows.values()].some(r=>r.tenant===tenant&&r.kind===kind&&r[name].toLowerCase()===input[name].toLowerCase()))throw error(409,'duplicate name','uniqueness');
 const id=randomUUID(),now=new Date().toISOString();
 const r={schemas:[schemas[kind]],id,tenant,kind,[name]:input[name],externalId:input.externalId,version:1,created:now,lastModified:now,...(kind==='User'?{active:input.active??true}:{members:[]})};
 if(kind==='Group'&&input.members){this.validateMembers(tenant,input.members);r.members=structuredClone(input.members);}
 this.rows.set(this.key(tenant,kind,id),r);return this.view(r);
 }
 validateMembers(tenant,members){if(!Array.isArray(members)||members.some(m=>typeof m.value!=='string'||!this.rows.has(this.key(tenant,'User',m.value))))throw error(400,'unknown member','invalidValue');}
 view(r){const {tenant,kind,version,created,lastModified,...resource}=r;return {...structuredClone(resource),meta:{resourceType:kind,created,lastModified,version:`W/"${version}"`}};}
 get(tenant,kind,id){const r=this.rows.get(this.key(tenant,kind,id));if(!r)throw error(404,'not found');return this.view(r);}
 list(tenant,kind,{filter,startIndex=1,count=100}={}){
 let rows=[...this.rows.values()].filter(r=>r.tenant===tenant&&r.kind===kind);
 if(filter){const m=/^(userName|externalId|displayName|active) eq ("([^"\\]*)"|true|false)$/.exec(filter);if(!m)throw error(400,'supported subset: simple eq only','invalidFilter');const v=m[3]??(m[2]==='true');rows=rows.filter(r=>typeof v==='string'?(m[1]==='externalId'?r[m[1]]===v:String(r[m[1]]??'').toLowerCase()===v.toLowerCase()):r[m[1]]===v);}
 startIndex=Number(startIndex);count=Number(count);if(!Number.isInteger(startIndex)||startIndex<1||!Number.isInteger(count)||count<0||count>1000)throw error(400,'invalid pagination','invalidValue');
 return {schemas:[schemas.List],totalResults:rows.length,startIndex,itemsPerPage:Math.min(count,Math.max(0,rows.length-startIndex+1)),Resources:rows.slice(startIndex-1,startIndex-1+count).map(r=>this.view(r))};
 }
 patch(tenant,kind,id,input,ifMatch){
 const old=this.rows.get(this.key(tenant,kind,id));if(!old)throw error(404,'not found');if(ifMatch&&ifMatch!==`W/"${old.version}"`)throw error(412,'version conflict');
 if(!input.schemas?.includes(schemas.Patch)||!Array.isArray(input.Operations)||!input.Operations.length)throw error(400,'invalid patch','invalidSyntax');
 const r=structuredClone(old);
 for(const op of input.Operations){const operation=String(op.op).toLowerCase();if(!['add','replace','remove'].includes(operation))throw error(400,'unknown operation','invalidSyntax');
 if(kind==='User'&&op.path==='active'&&operation!=='remove'&&typeof op.value==='boolean')r.active=op.value;
 else if(kind==='Group'&&op.path==='members'){if(operation==='remove')r.members=[];else{this.validateMembers(tenant,op.value);r.members=operation==='replace'?structuredClone(op.value):[...r.members,...op.value.filter(m=>!r.members.some(x=>x.value===m.value))];}}
 else if(kind==='Group'&&operation==='remove'&&/^members\[value eq "[^"\\]+"\]$/.test(op.path??'')){const value=/"([^"]+)"/.exec(op.path)[1];r.members=r.members.filter(m=>m.value!==value);}
 else throw error(400,'unsupported patch path','invalidPath');}
 r.version++;r.lastModified=new Date().toISOString();this.rows.set(this.key(tenant,kind,id),r);if(kind==='User'&&old.active&&!r.active)this.onDeactivate(tenant,id);return this.view(r);
 }
}
export function demo(){const revoked=[],s=new Scim((t,id)=>revoked.push(id)),u=s.create('a','User',{schemas:[schemas.User],userName:'alice',externalId:'hr-1'});s.patch('a','User',u.id,{schemas:[schemas.Patch],Operations:[{op:'replace',path:'active',value:false}]},u.meta.version);return {active:s.get('a','User',u.id).active,revocationEvents:revoked.length};}
