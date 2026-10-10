import test from 'node:test';
import assert from 'node:assert/strict';

import {decide,fixture} from '../src/model.mjs';
test('deny by default, tenant, principal status and live membership precede permissions',()=>{const f=fixture();assert.equal(decide(f).allow,true);for(const bad of [{action:'unknown'},{action:'member:manage'},{resource:{tenant:'b'}},{principal:{id:'alice',active:false}},{memberships:[]},{deny:true}])assert.equal(decide({...f,...bad}).allow,false);});
