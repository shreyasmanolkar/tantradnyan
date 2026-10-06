# Experiment integrity

An experiment needs a hypothesis, setup, driver, expected observation, actual observation or "not run", explanation, limitations, and next experiment. Use the experiment template.

Record environment, workload, revisions, units, command, and raw observations for measurements. Explain variation and controls. A deterministic simulation uses explicit initial state and ordered events; randomness needs a seed and named PRNG. Clock assumptions belong in the explanation.

Do not infer power-loss durability from an ordinary process kill. Do not infer a production consensus guarantee from an animation. Do not equate a successful run with a proof. Preserve failure traces as small fixtures when they teach a mechanism.

Topic agents may run documented deterministic checks. Experiments involving disks, namespaces, raw packets, hardware, or privileged commands need a bounded environment such as a VM, simulator, or explicitly designated scratch resource. Make the intended target concrete before executing.
