# Existing experiments

| Experiment | Owner | Claim examined |
| --- | --- | --- |
| [Instruction trace](../domains/computer-architecture/instruction-execution/experiments/instruction-trace/README.md) | CPU instruction execution | Defined state transitions, byte wrapping, memory access, and stack bounds |
| [Sync-engine failure simulations](../domains/sync-engines/experiments/README.md) | Sync engines | CRDT merge laws, concurrent edits, retry deduplication, offline recovery, and server restart under explicit model assumptions |
| [Browser layout](../domains/web-platform/css-centering/README.md) | CSS centering | Width conservation and the effect of width:auto, overflow, flex, and grid |
| [AWS service mechanisms](../domains/aws/experiments/README.md) | AWS | Permission/path failures, conditional conflicts, queue redelivery, cache races, checkpoint replay and file-backed recovery; cloud evidence recorded separately |

Instruction trace, sync-engine simulations and AWS service models have headless drivers. Browser layout is a browser experiment with live measurements. AWS cloud experiments require their own run evidence. The original counter delivery-order lab has been removed; its historical observations remain in the [initial validation record](../docs/VALIDATION.md). Add experiments here when they have an owner and a question; results belong beside their drivers.
