/* Tiny educational ISA. Same transition rules in Node and the browser. */
(function (root) {
  'use strict';
  const MEMORY_SIZE = 32, STACK_SIZE = 16;
  const SAMPLE = 'MOV R0 3\nMOV R1 1\nADD R2 R0\nSUB R0 R1\nJNZ R0 2\nSTORE R2 0\nPUSH R2\nPOP R3\nHALT';
  const shapes = {
    MOV: ['reg', 'byte'], ADD: ['reg', 'reg'], SUB: ['reg', 'reg'],
    LOAD: ['reg', 'addr'], STORE: ['reg', 'addr'],
    PUSH: ['reg'], POP: ['reg'], JNZ: ['reg', 'target'], HALT: []
  };
  function integer(value, min, max, label) {
    if (!Number.isInteger(value) || value < min || value > max)
      throw new Error(`${label} must be an integer in ${min}..${max}`);
    return value;
  }
  function parse(source) {
    const lines = source.split(/\r?\n/).map(line => line.split('#')[0].trim()).filter(Boolean);
    if (!lines.length || lines.length > 256) throw new Error('Program must contain 1..256 instructions');
    return lines.map((text, index) => {
      const [op, ...tokens] = text.toUpperCase().split(/\s+/);
      const shape = shapes[op];
      if (!shape || tokens.length !== shape.length) throw new Error(`Instruction ${index}: invalid opcode or operand count`);
      const args = tokens.map((token, i) => {
        if (shape[i] === 'reg') {
          if (!/^R[0-3]$/.test(token)) throw new Error(`Instruction ${index}: expected R0..R3`);
          return Number(token[1]);
        }
        if (!/^\d+$/.test(token)) throw new Error(`Instruction ${index}: expected a nonnegative decimal integer`);
        const max = shape[i] === 'byte' ? 255 : shape[i] === 'addr' ? MEMORY_SIZE - 1 : lines.length - 1;
        return integer(Number(token), 0, max, `Instruction ${index} operand`);
      });
      return {op, args, text};
    });
  }
  function create(source = SAMPLE) {
    return {program: parse(source), pc: 0, registers: [0, 0, 0, 0], memory: Array(MEMORY_SIZE).fill(0), stack: [], halted: false, steps: 0};
  }
  function validate(state) {
    integer(state.pc, 0, state.program.length - 1, 'PC');
    if (state.registers.length !== 4 || state.memory.length !== MEMORY_SIZE || state.stack.length > STACK_SIZE)
      throw new Error('Invalid state dimensions');
    for (const value of [...state.registers, ...state.memory, ...state.stack]) integer(value, 0, 255, 'State byte');
  }
  function snapshot(state) {
    return {pc: state.pc, registers: [...state.registers], stack: [...state.stack], sp: STACK_SIZE - state.stack.length, halted: state.halted};
  }
  function step(state) {
    validate(state);
    if (state.halted) throw new Error('CPU has halted; reset or load a program');
    const before = snapshot(state);
    const next = {...state, registers: [...state.registers], memory: [...state.memory], stack: [...state.stack]};
    const {op, args, text} = state.program[state.pc];
    const [a, b] = args;
    let target = state.pc + 1, detail = '';
    switch (op) {
      case 'MOV': next.registers[a] = b; break;
      case 'ADD': next.registers[a] = (next.registers[a] + next.registers[b]) % 256; break;
      case 'SUB': next.registers[a] = (next.registers[a] - next.registers[b] + 256) % 256; break;
      case 'LOAD': next.registers[a] = next.memory[b]; detail = `read memory[${b}] = ${next.memory[b]}`; break;
      case 'STORE': detail = `memory[${b}]: ${next.memory[b]} → ${next.registers[a]}`; next.memory[b] = next.registers[a]; break;
      case 'PUSH':
        if (next.stack.length === STACK_SIZE) throw new Error('Stack overflow');
        next.stack.push(next.registers[a]); break;
      case 'POP':
        if (!next.stack.length) throw new Error('Stack underflow');
        next.registers[a] = next.stack.pop(); break;
      case 'JNZ': if (next.registers[a] !== 0) target = b; break;
      case 'HALT': next.halted = true; target = state.pc; break;
      default: throw new Error(`Unknown instruction ${op}`);
    }
    // Faults do not partially commit a transition in this educational machine.
    if (!next.halted && target >= next.program.length) throw new Error('PC would leave the program; add HALT or a valid branch');
    next.pc = target;
    next.steps += 1;
    validate(next);
    return {state: next, event: {step: next.steps, kind: 'instruction', actor: 'cpu', instruction: text, before, after: snapshot(next), detail}};
  }
  const api = {MEMORY_SIZE, STACK_SIZE, SAMPLE, integer, parse, create, snapshot, step};
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.TinyCPU = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
