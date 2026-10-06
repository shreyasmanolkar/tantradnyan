# Sync engines from first principles

**Learner question:** How can independent, intermittently connected processes turn concurrent local changes into an understandable shared state?

Start with the [single master guide](GUIDE.md). It derives networking, concurrency, ordering, replication, OT, CRDTs, offline recovery, collaboration, messaging, games and production architectures from explicit state machines and invariants.

The [Node.js lab](sync-engine-lab/README.md) contains twenty progressive stages, handwritten algorithms, property checks, real loopback sockets, persistent replicas and seeded failure simulations. No synchronization library or npm dependency is required.

```sh
cd domains/sync-engines/sync-engine-lab
npm test
npm run demo
npm run faults
```

Node.js 22.4+ is required. Socket checks need permission to bind localhost. The final engine has separate [server](sync-engine-lab/20-production-sync-engine/src/server.mjs) and [CLI client](sync-engine-lab/20-production-sync-engine/src/client.mjs) processes. See [chapter 17](GUIDE.md#17-build-the-complete-engine) for the three-terminal walkthrough.

The guide is a foundational curriculum, with explicitly bounded implementations. The final engine is a single-authority field map; the text editor and game models are separate teaching branches. It does not implement a commercial editor, game renderer, production consensus, full WebRTC/QUIC stack, or power-loss-safe storage. Those boundaries are part of the explanation.

[Experiment evidence](experiments/README.md) records actual validation scope. [Source reading map](references/README.md) distinguishes documented architecture, inference and proposed designs. Availability of these artifacts does not mark the learner's outcomes as verified.
