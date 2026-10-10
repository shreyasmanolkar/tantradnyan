export function expanded(role,roles,seen=new Set()){
 if(seen.has(role))throw new Error('role cycle');const r=roles[role];if(!r)return new Set();const next=new Set(seen).add(role);return new Set([...(r.permissions??[]),...(r.parents??[]).flatMap(p=>[...expanded(p,roles,next)])]);
}
export function mayAssign(actorRole,targetRole){return actorRole==='owner'&&['viewer','editor','admin'].includes(targetRole);}
export const demo=()=>({editor:[...expanded('editor',{viewer:{permissions:['read']},editor:{permissions:['write'],parents:['viewer']}})],adminMayCreateOwner:mayAssign('admin','owner')});
