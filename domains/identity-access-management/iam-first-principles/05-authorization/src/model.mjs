const permissions={viewer:['document:read'],editor:['document:read','document:write'],admin:['document:read','document:write','member:manage'],owner:['document:read','document:write','member:manage','owner:transfer']};
export function decide({principal,resource,action,tenant,memberships,deny=false}){
 if(!principal||principal.active!==true)return {allow:false,reason:'inactive principal'};
 if(!resource||resource.tenant!==tenant)return {allow:false,reason:'tenant mismatch'};
 const membership=memberships.find(m=>m.userId===principal.id&&m.tenant===tenant&&m.active===true);
 if(!membership)return {allow:false,reason:'no current membership'};
 if(deny)return {allow:false,reason:'explicit deny'};
 const allow=(permissions[membership.role]??[]).includes(action);
 return {allow,reason:allow?'current tenant role':'default deny'};
}
export function fixture(){return {principal:{id:'alice',active:true},resource:{id:'doc-a',tenant:'a'},tenant:'a',action:'document:read',memberships:[{userId:'alice',tenant:'a',role:'viewer',active:true}]};}
export const demo=()=>({read:decide(fixture()),write:decide({...fixture(),action:'document:write'}),crossTenant:decide({...fixture(),resource:{id:'doc-b',tenant:'b'}})});
