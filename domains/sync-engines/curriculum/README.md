# Sync engines: curriculum entry

**Question:** how do independent, intermittently connected processes reconcile concurrent local changes under explicit consistency and failure contracts?

Read the [domain overview](../README.md) and [single master guide](../GUIDE.md). The [twenty-stage Node.js lab](../sync-engine-lab/README.md) implements the guide's bounded models; the [experiments](../experiments/README.md) distinguish observed results from expected properties and production claims.

```sh
cd domains/sync-engines/sync-engine-lab
npm test
npm run demo
npm run faults
```

Node.js 22.4+ is required; socket checks need localhost binding permission. The final engine is a persistent, single-authority field map. OT, CRDT text, chat, and multiplayer models demonstrate separate mechanisms and their limits.

This page registers topic ID `sync-engines` under its own domain. The guide and implementation paths remain at `domains/sync-engines/`; the former synchronization catalog domain has been removed.
