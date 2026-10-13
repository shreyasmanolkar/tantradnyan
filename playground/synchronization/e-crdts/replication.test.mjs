import test from 'node:test';
import assert from 'node:assert/strict';
import * as C from '../03-crdts/model.mjs';
import {fixtures,replicate} from './replication.mjs';

for(const fixture of fixtures())test(`${fixture.name}: ten seeded adverse schedules converge after repair`,()=>{
 for(const seed of [1,2,3,7,11,19,42,51,99,123]) {
  const a=replicate(fixture,seed),b=replicate(fixture,seed);
  assert.deepEqual(a,b);
  for(const projection of a.after)assert.deepEqual(projection,a.expected);
  assert.ok(a.stats.sent>0);
 }
});
test('permanent complete loss does not imply liveness; reliable catch-up restores it',()=>{
 const fixture=fixtures()[0];
 const isolated=replicate(fixture,7,{loss:1,repair:false});
 assert.deepEqual(isolated.after,['2','3','4']);
 assert.equal(isolated.stats.delivered,0);
 assert.deepEqual(replicate(fixture,7,{loss:1}).after,['9','9','9']);
});
test('two copies reusing one writer converge while losing one intended increment',()=>{
 const one=C.gInc(C.emptyG(),'M'),other=C.gInc(C.emptyG(),'M');
 const merged=C.mergeG(one,other);
 assert.equal(C.gValue(merged),1n);
 assert.notEqual(C.gValue(merged),2n);
});
test('convergent inventory can violate a domain invariant',()=>{
 const base=C.pnInc(C.emptyPN(),'S');
 const merged=C.mergePN(C.pnDec(base,'M'),C.pnDec(base,'D'));
 assert.equal(C.pnValue(merged),-1n);
});
