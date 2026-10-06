# Instruction trace

## Hypothesis

The sample loop produces R2=6, memory[0]=6, and R3=6, with PC at HALT. Byte addition/subtraction wrap. Invalid stack transitions preserve the input machine.

## Setup and code

Use Node.js 18+ from the repository root. The driver imports the exact model used by the browser. Initial registers and memory are zero; time is counted in instructions, not CPU cycles. No randomness or hardware measurement is involved.

```sh
node domains/computer-architecture/instruction-execution/experiments/instruction-trace/run.js
```

The [driver](run.js) prints every transition and checks sample output, wrapping, LOAD/STORE, parser rejection, empty/full stack faults, and falling off a program.

## Expected result

The sample executes 15 instructions, halts at PC=8, and leaves registers `[0, 1, 6, 6]`. Its stack is empty. The driver prints a success line only if all checked claims hold.

## Actual result

The [initial verification record](results/20261006T194732Z-initial-validation/README.md) contains the observed trace and passing checks under Node.js v26.7.0. This establishes the checked model cases; it does not mark a personal learning outcome verified. Save a new record when investigating a changed program or assumption.

## Explanation and limitations

State transitions expose the meaning of instructions without reproducing physical hardware. The checks concern this custom ISA, not RISC-V conformance or cycle timings. A successful execution is not a proof for every possible program.

## Further experiments

Change a loop bound, force wrapping, or introduce a bad jump. Add a byte-encoded assembler only after specifying how fetch and PC change.
