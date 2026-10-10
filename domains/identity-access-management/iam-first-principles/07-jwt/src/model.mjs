import {generateKeyPair,SignJWT,jwtVerify,decodeJwt,createLocalJWKSet} from 'jose';
export const keys=()=>generateKeyPair('RS256',{modulusLength:2048,extractable:true});
export async function issue(privateKey,{issuer='https://idp.example',audience='urn:docs',subject='alice',now=1000,ttl=60,kid='k1',type='at+jwt',extra={}}={}){
 return new SignJWT({...extra}).setProtectedHeader({alg:'RS256',kid,typ:type}).setIssuer(issuer).setAudience(audience).setSubject(subject).setIssuedAt(now).setNotBefore(now).setExpirationTime(now+ttl).setJti(crypto.randomUUID()).sign(privateKey);
}
export function validate(token,key,{issuer='https://idp.example',audience='urn:docs',now=1000,type='at+jwt'}={}){
 return jwtVerify(token,key,{issuer,audience,algorithms:['RS256'],typ:type,requiredClaims:['sub','iat','exp','nbf','jti'],currentDate:new Date(now*1000),clockTolerance:0});
}
export {decodeJwt,createLocalJWKSet};
export async function demo(){const k=await keys(),t=await issue(k.privateKey);return {untrustedSubject:decodeJwt(t).sub,verifiedSubject:(await validate(t,k.publicKey)).payload.sub};}
