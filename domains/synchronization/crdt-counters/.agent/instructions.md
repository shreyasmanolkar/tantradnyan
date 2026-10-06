# CRDT counter teaching contract

This topic teaches a state-based grow-only counter: stable unique writers, component ownership, nondecreasing counts, and componentwise max merge. Explain eventual dissemination as a condition for convergence. Do not equate convergence with durability, authorization, or preservation of text editing intentions.

Keep the model shared by browser and headless driver. Snapshot copies must not reference later-mutated live vectors. Client disconnects must affect message delivery. Reset creates a new isolated experiment; it is not a valid live identity-reset protocol.

For model changes run `node domains/synchronization/crdt-counters/experiments/delivery-order/run.js`. Review offline edits, reconnect, duplicate/drop, queue bounds, and reset in a browser for UI changes. A sequence CRDT or OT algorithm deserves its own topic and specification rather than expanding this tiny counter model.
