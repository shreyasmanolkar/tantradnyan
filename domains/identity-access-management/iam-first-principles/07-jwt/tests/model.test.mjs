import test from 'node:test';
import assert from 'node:assert/strict';

import {keys,issue,validate,decodeJwt} from '../src/model.mjs';
import {SignJWT} from 'jose';
test('decode is not trust: reject tamper, issuer, audience, expiry, nbf, algorithm and ID-token substitution',async()=>{const k=await keys(),t=await issue(k.privateKey);assert.equal((await validate(t,k.publicKey)).payload.sub,'alice');const parts=t.split('.');parts[1]=Buffer.from(JSON.stringify({...decodeJwt(t),sub:'admin'})).toString('base64url');assert.equal(decodeJwt(parts.join('.')).sub,'admin');await assert.rejects(validate(parts.join('.'),k.publicKey));for(const options of [{issuer:'https://evil.invalid'},{audience:'urn:billing'},{now:1060},{now:999}])await assert.rejects(validate(t,k.publicKey,options));await assert.rejects(validate(await issue(k.privateKey,{type:'JWT',audience:'client'}),k.publicKey));const hs=await new SignJWT({sub:'alice'}).setProtectedHeader({alg:'HS256'}).sign(new Uint8Array(32));await assert.rejects(validate(hs,k.publicKey));});
