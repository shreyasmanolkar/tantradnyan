import {createHmac} from 'node:crypto';
const fields=['time','event','actor','tenant','resource','action','outcome','reason','requestId'];
const mac=(key,value)=>createHmac('sha256',key).update(JSON.stringify(value)).digest('hex');
export class Audit {
 constructor(key){this.key=key;this.rows=[];}
 append(input){const row=Object.fromEntries(fields.filter(f=>input[f]!==undefined).map(f=>[f,String(input[f]).replace(/[\r\n]/g,' ').slice(0,256)]));row.prev=this.rows.at(-1)?.mac??'genesis';row.mac=mac(this.key,row);this.rows.push(row);return row;}
 verify(){let prev='genesis';for(const row of this.rows){const {mac:tag,...data}=row;if(data.prev!==prev||mac(this.key,data)!==tag)return false;prev=tag;}return true;}
}
export function demo(){const a=new Audit('example-only audit key');a.append({time:0,event:'login',actor:'alice',outcome:'allow',password:'not logged',access_token:'not logged'});const before=a.verify();a.rows[0].actor='admin';return {before,after:a.verify(),fields:Object.keys(a.rows[0])};}
