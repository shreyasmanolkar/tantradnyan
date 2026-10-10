import test from 'node:test';
import assert from 'node:assert/strict';

import {demo,canonical,SignedRequests} from '../src/model.mjs';
import {generateKeyPairSync,sign} from 'node:crypto';
test('request-bound proof rejects replay, mutation, stale timestamp and wrong audience',()=>{assert.deepEqual(demo(),{first:true,replay:false});const k=generateKeyPairSync('ed25519'),r={method:'POST',path:'/docs',body:'{}',nonce:'n',time:100,audience:'docs'},s=sign(null,canonical(r),k.privateKey);for(const change of [{body:'admin'},{audience:'billing'},{time:0}])assert.equal(new SignedRequests(k.publicKey,'docs').check({...r,...change},s,100),false);});
