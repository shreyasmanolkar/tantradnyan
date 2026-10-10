import {randomBytes, createHash, createHmac, timingSafeEqual, generateKeyPairSync, sign, verify, createCipheriv, createDecipheriv, hkdfSync} from 'node:crypto';
export const secret = () => randomBytes(32).toString('base64url');
export const digest = value => createHash('sha256').update(value).digest('hex');
export function equal(a,b) {const x=Buffer.from(a),y=Buffer.from(b);return x.length===y.length && timingSafeEqual(x,y);}
export function demo() {
 const {privateKey,publicKey}=generateKeyPairSync('ed25519'); const message=Buffer.from('tenant-a:document:read');
 const signature=sign(null,message,privateKey);
 const key=Buffer.from(hkdfSync('sha256',randomBytes(32),randomBytes(16),'iam-lab/encryption',32));
 const iv=randomBytes(12), cipher=createCipheriv('aes-256-gcm',key,iv);
 const ciphertext=Buffer.concat([cipher.update(message),cipher.final()]);
 const decipher=createDecipheriv('aes-256-gcm',key,iv);decipher.setAuthTag(cipher.getAuthTag());
 return {signatureValid:verify(null,message,publicKey,signature),tamperValid:verify(null,Buffer.from('tenant-b:document:read'),publicKey,signature),
 decrypted:Buffer.concat([decipher.update(ciphertext),decipher.final()]).toString(),
 hash:digest(message), mac:createHmac('sha256',key).update(message).digest('hex'), entropyBits:256};
}
