import {createHash} from 'node:crypto';
export function canonical(value){
 if(value===null||typeof value==='boolean'||typeof value==='string')return JSON.stringify(value);
 if(typeof value==='number'&&Number.isFinite(value))return JSON.stringify(value);
 if(Array.isArray(value))return '['+value.map(canonical).join(',')+']';
 if(value&&Object.getPrototypeOf(value)===Object.prototype)return '{'+Object.keys(value).sort().map(k=>JSON.stringify(k)+':'+canonical(value[k])).join(',')+'}';
 throw new Error('FINITE_JSON_REQUIRED');
}
const hash=value=>createHash('sha256').update(canonical(value)).digest('hex');
export function scopeKey(...parts){if(parts.length===0||parts.some(x=>typeof x!=='string'||!x))throw new Error('BAD_SCOPE');return canonical(parts);}
export class Journal {
 constructor(){this.rows=[];}
 append(event){const body=JSON.parse(canonical(event)),seq=this.rows.length+1,prev=this.rows.at(-1)?.hash??'0'.repeat(64);const row={seq,prev,event:body};row.hash=hash(row);this.rows.push(row);return row.hash;}
 entries(){return structuredClone(this.rows);}
 anchor(){return {seq:this.rows.length,hash:this.rows.at(-1)?.hash??'0'.repeat(64)};}
 static verify(rows,anchor){if(!Array.isArray(rows))return false;try{let previous='0'.repeat(64);for(let i=0;i<rows.length;i++){const r=rows[i];if(!r||Object.keys(r).sort().join(',')!=='event,hash,prev,seq')return false;if(r.seq!==i+1||r.prev!==previous||r.hash!==hash({seq:r.seq,prev:r.prev,event:r.event}))return false;previous=r.hash;}return !anchor||(anchor.seq===rows.length&&anchor.hash===previous);}catch{return false;}}
}
