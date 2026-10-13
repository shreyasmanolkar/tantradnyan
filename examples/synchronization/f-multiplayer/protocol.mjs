export const TICK_MS=50,STEP_MM=50,MAX_LEAD=12,PACKET_BYTES=1200;
export const int=x=>Number.isSafeInteger(x)&&x>=0&&x<=2147483647;
export const uuid=x=>typeof x==='string'&&/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(x);
export function shape(value,keys){if(!value||typeof value!=='object'||Array.isArray(value)||Object.keys(value).sort().join(',')!==keys.slice().sort().join(','))throw new Error('BAD_SHAPE');}
export function command(c){shape(c,['seq','dir']);if(!int(c.seq)||c.seq<1||![-1,0,1].includes(c.dir))throw new Error('BAD_COMMAND');}
export function packet(value){const bytes=Buffer.from(JSON.stringify(value));if(bytes.length>PACKET_BYTES)throw new Error('PACKET_LIMIT');return bytes;}
export function parse(bytes){if(bytes.length>PACKET_BYTES)throw new Error('PACKET_LIMIT');return JSON.parse(bytes.toString('utf8'));}
export const move=(x,dir,right=1000)=>Math.max(-1000,Math.min(right,x+dir*STEP_MM));
export function snapshot(value){
 shape(value,['type','v','epoch','session','tick','startTick','ack','players']);
 if(value.type!=='snapshot'||value.v!==1||!uuid(value.epoch)||!uuid(value.session)||!int(value.tick)||!int(value.startTick)||value.startTick>value.tick||value.ack!==value.tick-value.startTick||!Array.isArray(value.players)||value.players.length>2)throw new Error('BAD_SNAPSHOT');
 const ids=new Set();for(const p of value.players){shape(p,['id','x']);if(!['M','D'].includes(p.id)||ids.has(p.id)||!Number.isInteger(p.x)||p.x< -1000||p.x>1000)throw new Error('BAD_ENTITY');ids.add(p.id);}
 return value;
}
