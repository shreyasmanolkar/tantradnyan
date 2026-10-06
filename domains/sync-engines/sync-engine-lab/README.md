# Sync engine lab

Twenty Node.js labs implement the [master curriculum](../GUIDE.md). Run from this directory:

```sh
npm test
npm run demo
npm run faults
```

No install step: all dependencies are Node built-ins. Node.js 22.4+ is required for its native WebSocket client. The WebSocket server is a bounded educational frame implementation. Tests include real localhost TCP, UDP and WebSocket traffic, temporary-file recovery, and deterministic fault simulations. These are transport/protocol checks; no graphical editor or game UI is included.

The [final engine](20-production-sync-engine/README.md) exposes separate server and client processes. The shared files contain explicit transition functions used by several labs; begin with the numbered demo and follow its imports.

A copied lab tree is self-contained. Generated catalog navigation is optional. `.data/` holds private local runtime state and is ignored.
