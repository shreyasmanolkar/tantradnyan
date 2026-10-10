import test from 'node:test';
import assert from 'node:assert/strict';

import {switchTenant,setRole} from '../src/model.mjs';
import {decide,fixture} from '../../05-authorization/src/model.mjs';
test('cross tenant, stale membership, revocation, escalation, switching, suspension and unauthorized admin',()=>{const f=fixture();assert.equal(decide({...f,resource:{tenant:'b'}}).allow,false);assert.throws(()=>switchTenant(f.principal,'b',f.memberships));assert.deepEqual(switchTenant(f.principal,'a',f.memberships),{userId:'alice',tenant:'a'});assert.throws(()=>setRole({actor:f.principal,target:'alice',role:'owner',tenant:'a',memberships:f.memberships}));assert.equal(decide({...f,action:'member:manage'}).allow,false);assert.equal(decide({...f,principal:{...f.principal,active:false}}).allow,false);const stale={...f.principal,claimedRole:'admin'};f.memberships[0].active=false;assert.equal(decide({...f,principal:stale}).allow,false);});
