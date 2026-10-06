# Questions

Keep the original question even when its assumptions turn out to be wrong. Statuses: `open`, `investigating`, `answered-with-evidence`, or `reopened`. An answer points to an artifact and states what remains unresolved.

| ID | Question | Home | State | Evidence / next observation |
| --- | --- | --- | --- | --- |
| Q-001 | Why do two auto margins center a block? | [CSS centering](domains/web-platform/css-centering/README.md) | investigating | Derive the width constraint, then compare browser measurements |
| Q-002 | What changes when a CPU executes ADD? | [Instruction execution](domains/computer-architecture/instruction-execution/README.md) | investigating | Predict PC, register, and wrapping behavior before stepping |
| Q-003 | Why can replicas merge the same counter state twice safely? | [Sync-engine CRDT lab](domains/sync-engines/sync-engine-lab/14-crdt/README.md) | investigating | Compare componentwise max with addition |
| Q-004 | When does an acknowledged write survive a power loss? | Topic ID `write-ahead-logging` (planned) | open | Separate OS buffering, stable storage, and device assumptions |
| Q-005 | How do we preserve text editing intentions during concurrent edits? | [OT lab](domains/sync-engines/sync-engine-lab/13-ot/README.md) and [CRDT lab](domains/sync-engines/sync-engine-lab/14-crdt/README.md) | open | Define intended outcomes before choosing an algorithm |
| Q-006 | What makes an agent development harness reproducible? | Topic ID `agent-harnesses` (planned) | open | Examine context, tool inputs, artifacts, and external state |

For a larger investigation add a dated note under the owning topic. Track predictions, observations, confidence, and the experiment that would change your mind.
