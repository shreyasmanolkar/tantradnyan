import {scrypt as derive,randomBytes,timingSafeEqual} from 'node:crypto';
import {promisify} from 'node:util';
const scrypt=promisify(derive);
// Standard scrypt, explicit costs; benchmark on your deployment before selecting a cost.
const cost={N:32768,r:8,p:1,maxmem:64*1024*1024};
export async function hashPassword(password){
 if(typeof password!=='string'||password.length<15||Buffer.byteLength(password)>1024)throw new Error('password policy');
 const salt=randomBytes(16);const hash=await scrypt(password,salt,32,cost);
 return {algorithm:'scrypt',N:cost.N,r:8,p:1,salt:salt.toString('hex'),hash:hash.toString('hex')};
}
export async function verifyPassword(password,record){
 if(typeof password!=='string'||Buffer.byteLength(password)>1024)return false;
 if(record.algorithm!=='scrypt'||record.N!==cost.N||record.r!==8||record.p!==1)throw new Error('unsupported password record');
 const hash=await scrypt(password,Buffer.from(record.salt,'hex'),32,cost),expected=Buffer.from(record.hash,'hex');
 return hash.length===expected.length&&timingSafeEqual(hash,expected);
}
export const demo=async()=>{const r=await hashPassword('example-only long passphrase');return {correct:await verifyPassword('example-only long passphrase',r),incorrect:await verifyPassword('incorrect',r)};};
