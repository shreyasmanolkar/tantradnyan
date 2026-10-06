# Initial deterministic verification

Recorded 2026-10-06 UTC. Runtime: Node.js v26.7.0. Source: the newly scaffolded uncommitted working tree; no commit ID existed. Initial state: zero registers and memory, empty stack, PC=0. No physical CPU timing or randomness was involved.

Command from repository root:

```sh
node domains/computer-architecture/instruction-execution/experiments/instruction-trace/run.js
```

Observed sample trace:

```text
1: PC 0 MOV R0 3 -> PC 1, registers [3,0,0,0]
2: PC 1 MOV R1 1 -> PC 2, registers [3,1,0,0]
3: PC 2 ADD R2 R0 -> PC 3, registers [3,1,3,0]
4: PC 3 SUB R0 R1 -> PC 4, registers [2,1,3,0]
5: PC 4 JNZ R0 2 -> PC 2, registers [2,1,3,0]
6: PC 2 ADD R2 R0 -> PC 3, registers [2,1,5,0]
7: PC 3 SUB R0 R1 -> PC 4, registers [1,1,5,0]
8: PC 4 JNZ R0 2 -> PC 2, registers [1,1,5,0]
9: PC 2 ADD R2 R0 -> PC 3, registers [1,1,6,0]
10: PC 3 SUB R0 R1 -> PC 4, registers [0,1,6,0]
11: PC 4 JNZ R0 2 -> PC 5, registers [0,1,6,0]
12: PC 5 STORE R2 0 -> PC 6, registers [0,1,6,0]
13: PC 6 PUSH R2 -> PC 7, registers [0,1,6,0]
14: PC 7 POP R3 -> PC 8, registers [0,1,6,6]
15: PC 8 HALT -> PC 8, registers [0,1,6,6]
PASS: sample trace, wrapping, memory bounds, invalid programs, and atomic fault rejection.
```

The driver also confirmed memory[0]=6, an empty stack, wrapping in both directions, LOAD/STORE at address 31, malformed program rejection, and preservation of the input state after stack overflow, stack underflow, or falling off a program. Exit code: 0.

The observations support the declared transition rules for these cases. They say nothing about the cycle count or behavior of a production ISA. Next investigation: choose byte encodings and examine how instruction fetch and PC must change.
