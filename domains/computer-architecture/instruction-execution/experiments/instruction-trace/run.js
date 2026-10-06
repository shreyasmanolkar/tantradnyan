'use strict';
const assert = require('node:assert/strict');
const cpu = require('../../implementations/javascript/model.js');
let state = cpu.create();
while (!state.halted && state.steps < 100) {
  const result = cpu.step(state);
  console.log(`${result.event.step}: PC ${state.pc} ${result.event.instruction} -> PC ${result.state.pc}, registers [${result.state.registers}]`);
  state = result.state;
}
assert.equal(state.halted, true);
assert.equal(state.steps, 15);
assert.equal(state.pc, 8);
assert.deepEqual(state.registers, [0, 1, 6, 6]);
assert.equal(state.memory[0], 6);
assert.deepEqual(state.stack, []);
function execute(program) {
  let s = cpu.create(program);
  for(let i=0; !s.halted && i<100; i++) s=cpu.step(s).state;
  assert.equal(s.halted, true); return s;
}
assert.equal(execute('MOV R0 255\nMOV R1 1\nADD R0 R1\nHALT').registers[0], 0);
assert.equal(execute('MOV R1 1\nSUB R0 R1\nHALT').registers[0], 255);
assert.equal(execute('MOV R0 42\nSTORE R0 31\nLOAD R1 31\nHALT').registers[1], 42);
for (const source of ['MOV R4 0', 'MOV R0 256', 'LOAD R0 32', 'JNZ R0 9', 'HALT 1', 'TYPO', ''])
  assert.throws(()=>cpu.create(source));
let s = cpu.create('POP R0\nHALT'), original=JSON.stringify(s);
assert.throws(()=>cpu.step(s), /underflow/); assert.equal(JSON.stringify(s),original);
s=cpu.create('PUSH R0\nHALT'); s.stack=Array(cpu.STACK_SIZE).fill(0); original=JSON.stringify(s);
assert.throws(()=>cpu.step(s), /overflow/); assert.equal(JSON.stringify(s),original);
s=cpu.create('MOV R0 7'); original=JSON.stringify(s);
assert.throws(()=>cpu.step(s), /leave/); assert.equal(JSON.stringify(s),original);
console.log('PASS: sample trace, wrapping, memory bounds, invalid programs, and atomic fault rejection.');
