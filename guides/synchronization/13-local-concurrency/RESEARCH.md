# Local concurrency evidence and validation

Status: draft. Research/validation date: 2026-10-14. Reviewer: pending.

## Primary sources and limits

- [Java SE 25 JLS chapter 17](https://docs.oracle.com/javase/specs/jls/se25/html/jls-17.html): memory model, synchronization, final-field construction and per-access caveats. Abstract legal behavior is separate from finite observed behavior.
- [Java atomic package](https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/concurrent/atomic/package-summary.html), [AtomicReference](https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/concurrent/atomic/AtomicReference.html), [AtomicInteger](https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/concurrent/atomic/AtomicInteger.html), [AtomicStampedReference](https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/concurrent/atomic/AtomicStampedReference.html), [VarHandle](https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/lang/invoke/VarHandle.html): identity, pair capture, update purity and access modes. API correctness is not a benchmark/progress proof for the whole runtime.
- [ReentrantLock](https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/concurrent/locks/ReentrantLock.html), [Condition](https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/concurrent/locks/Condition.html), [Semaphore](https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/concurrent/Semaphore.html), [read/write lock](https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/concurrent/locks/ReentrantReadWriteLock.html): ownership, waits, fairness and upgrade/downgrade contracts.
- [Herlihy/Wing linearizability paper](https://www.cs.columbia.edu/~wing/publications/HerlihyWing90.pdf), July 1990; [Herlihy wait-free paper](https://cs.brown.edu/people/mph/Herlihy91/p124-herlihy.pdf), January 1991: original correctness/progress literature. The small checker is an authored bounded example, not a full paper implementation.
- [ECMAScript Atomics](https://tc39.es/ecma262/multipage/structured-data.html#sec-atomics-object), living specification accessed 2026-10-14; [Node 26.7.0 workers](https://nodejs.org/download/release/v26.7.0/docs/api/worker_threads.html): JS shared memory and worker execution. Single-page ECMAScript URL failed; multipage source succeeded.
- [Jellyfish 2011 paper](https://dna.cs.byu.edu/bio465/papers/fastparallel.pdf), university-hosted original authored paper, and [authors' software page](https://www.cs.cmu.edu/~ckingsf/software/jellyfish/), reports last modification 2011-07-26: concrete k-mer/CAS distinction. PMC was blocked by browser checking; genome glossary fetch failed. Neither source's historical version/performance claims are treated as current installation advice. Jellyfish was not installed.
- [OpenJDK jcstress source README](https://github.com/openjdk/jcstress): specialized concurrency investigation. Project landing URL failed; repository content was read. Harness not executed.

The guide's controlled schedules, pair invariants, cost estimates, stamp-wrap calculation, domain examples and implementation are authored reasoning. Source citations identify the narrow specification/theory contract rather than certifying the complete lab.

## Execution environment

The java/javac shims had no selected default. Read-only lookup found an installed JDK at /home/shreyas/.local/share/mise/installs/java/25.0.1. Direct binaries reported OpenJDK 25.0.1+8-27 and javac 25.0.1. The runner explicitly used that root without changing global mise/system configuration. It compiled with --release 17 in a disposable temporary directory. Python executable path reports 3.14.7; Node validation used 26.7.0.

## Executed evidence

Java passed 20 scenario assertions: forced volatile loss, exact atomic increments, reference identity, versioned value-return rejection, coherent CAS pair, speculative-effect duplication, volatile/release-acquire publication, unsafe/stamped ABA, immutable-link stack, condition recheck/interruption, semaphore bounds, read/write lock behavior, ordered transfer, actual/fabricated counter histories, multi-field atomicity counterexample and k-mer windows. Four threads each incremented 5,000 times; the stack retained 4,000 unique values. These counts are correctness checks, not throughput measurements.

The Python runner then launched two independent JVMs, each constructing/incrementing its own counter and returning 1. This is process-boundary evidence, not network replication testing.

Node passed three cases: four actual workers incremented one shared cell to 20,000; an atomic flag published ordinary shared payload; two await-separated operations on one event loop lost a logical increment. The publication variant was tightened so the reader starts before the writer publishes and uses a predicate loop around Atomics.wait; the updated Node run passed.

An initial documentation write used an incorrect doubled directory path and failed after the worker update had been written. The README was subsequently created at its intended path. No test or successful-file-write claim depends on that failed operation.

## What tests do not establish

Latches/barriers add ordering and deliberately select schedules. ABA/lost-update cases are controlled structural races, not observed weak-memory hardware reorderings. Positive publication cases validate specified idioms but cannot prove every possible execution. The condition experiment signals without satisfying a predicate; it does not force a VM spurious wakeup. The history checker covers completed zero-initialized increment calls only.

No jcstress/JMH, exhaustive schedules, alternate architectures/JDKs, hard real-time guarantee, starvation proof, native memory reclamation, distributed transaction or persistent recovery test is claimed. The mutable-node ABA demo is intentionally unsafe; the immutable stack has different lifetime assumptions. No real external side effect or uninterruptible intentional deadlock is executed.

Review priorities: memory/publication proof, retry purity, history/stamp lifetime, progress assumptions, lock/wait/cancellation discipline and local-versus-distributed scope. Guides remain draft; no formal ASD-STE100 compliance claim.

Final checks: the exact documented Python/JDK runner and npm run test:js were rerun successfully: 20 Java scenario passes, one separate-JVM boundary pass and three Node passes. Python --version confirmed 3.14.7. The stack stress case uses four concurrent pushers followed by four concurrent poppers; it does not test arbitrary overlapping push/pop histories. The runner removed temporary classes after execution, and all worker/executor resources completed. Local Markdown targets/fences passed across 43 documents excluding node_modules; new-file whitespace and git diff --check passed.
