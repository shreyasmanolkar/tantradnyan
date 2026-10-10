import test from 'node:test';
import assert from 'node:assert/strict';

import {demo,RefreshFamilies} from '../src/model.mjs';
import {keys,issue,validate} from '../../07-jwt/src/model.mjs';
test('refresh reuse revokes family; JWT remains valid until an online policy check or expiry',async()=>{assert.deepEqual(demo(),{reuse:true,childRevoked:true});const f=new RefreshFamilies(),a=f.issue({subject:'alice',clientId:'app',ttl:10});assert.throws(()=>f.rotate(a,'other',0));assert.throws(()=>f.rotate(a,'app',10));const k=await keys(),t=await issue(k.privateKey);f.revokeUser('alice');assert.equal((await validate(t,k.publicKey,{now:1001})).payload.sub,'alice');});
