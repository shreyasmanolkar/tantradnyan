# Instruction execution teaching contract

Explain one architectural state transition before introducing hardware concurrency. Model byte registers, 32-byte memory, instruction-index PC, a separate 16-byte stack, and atomic rejection of invalid transitions. HALT keeps its PC. R0 is an ordinary writable register, unlike RISC-V's x0.

Keep `implementations/javascript/model.js` shared by the interactive lab and headless driver. Validate parsing, bounds, arithmetic wrapping, branch behavior, and stack faults. Run `node domains/computer-architecture/instruction-execution/experiments/instruction-trace/run.js` for model changes; review reset, editable state, errors, and execution limits in the browser for UI changes.

Do not quietly add cycles, byte addressing for PC, flags, privileged instructions, or a pipeline to this first model. Such extensions need an explicit specification and a separate learning question. Preserve predictable behavior and readable transition rules.
