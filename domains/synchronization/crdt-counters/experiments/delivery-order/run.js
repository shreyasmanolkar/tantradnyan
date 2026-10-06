'use strict';
const assert = require('node:assert/strict');
const counter = require('../../implementations/javascript/model.js');
const snapshots = [[2,0,0],[0,3,0],[0,0,1]];
function permutations(items){if(!items.length)return [[]];return items.flatMap((item,i)=>permutations(items.filter((_,j)=>i!==j)).map(rest=>[item,...rest]));}
for(const order of permutations([0,1,2])){
  let result=counter.create(3);
  for(const index of [...order,...order])result=counter.merge(result,snapshots[index]);
  assert.deepEqual(result,[2,3,1]);assert.equal(counter.value(result),6);
  console.log(`Delivery ${order.join(' → ')} (then duplicated): [${result}], value ${counter.value(result)}`);
}
const vectors=[];
for(let a=0;a<=2;a++)for(let b=0;b<=2;b++)for(let c=0;c<=2;c++)vectors.push([a,b,c]);
for(const a of vectors){
  assert.deepEqual(counter.merge(a,a),a);
  for(const b of vectors){
    assert.deepEqual(counter.merge(a,b),counter.merge(b,a));
    for(const c of vectors)assert.deepEqual(counter.merge(counter.merge(a,b),c),counter.merge(a,counter.merge(b,c)));
  }
}
let original=[0,0,0], incremented=counter.increment(original,1);
assert.deepEqual(original,[0,0,0]);assert.deepEqual(incremented,[0,1,0]);
assert.throws(()=>counter.merge([0],[0,0]));
assert.throws(()=>counter.merge([-1],[0]));
assert.throws(()=>counter.increment([0],1));
assert.throws(()=>counter.increment([Number.MAX_SAFE_INTEGER],0));
assert.throws(()=>counter.value([Number.MAX_SAFE_INTEGER,1]));
const wrongMerge=(a,b)=>a.map((x,i)=>x+b[i]);
const wrong=wrongMerge(wrongMerge([0,0,0],snapshots[0]),snapshots[0]);
assert.deepEqual(wrong,[4,0,0]);
console.log(`Counterexample: sum-merge duplicates one writer's 2 increments into [${wrong}].`);
console.log('PASS: six orders, duplicates, finite merge properties, validation, and the incorrect-rule counterexample.');
