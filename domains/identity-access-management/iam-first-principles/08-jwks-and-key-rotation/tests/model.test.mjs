import test from 'node:test';
import assert from 'node:assert/strict';

import {demo,publicJwk,remoteKeys} from '../src/model.mjs';
import {keys,issue,validate} from '../../07-jwt/src/model.mjs';
import {createServer} from 'node:http';
test('overlap works and trusted remote JWKS resolves kid without trusting token URLs',async()=>{assert.deepEqual(await demo(),{overlapAccepts:true,retiredRejects:true});const k=await keys(),jwk=await publicJwk(k.publicKey,'k1');assert.equal(jwk.d,undefined);const server=createServer((q,r)=>{r.setHeader('content-type','application/json');r.end(JSON.stringify({keys:[jwk]}));});await new Promise(r=>server.listen(0,'127.0.0.1',r));try{const set=remoteKeys(`http://127.0.0.1:${server.address().port}/jwks`);assert.equal((await validate(await issue(k.privateKey),set)).payload.sub,'alice');await assert.rejects(validate(await issue(k.privateKey,{kid:'unknown'}),set));}finally{await new Promise(r=>server.close(r));}});
