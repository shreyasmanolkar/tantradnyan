# AWS domain instructions

Read the root agent protocol and [curriculum import record](service-lifecycle/IMPORT.md).

- `service-lifecycle/` is the canonical imported curriculum. Keep chapters and `examples/` together; original commands use that directory as their working directory.
- Preserve source notes, limitations, and dated research claims. Changes after import may intentionally differ from the hashes in `IMPORT.json`; record those differences rather than rewriting the original provenance.
- Describe cloud lab steps and expected observations separately from actual run evidence. A copied template or local syntax check establishes no deployment, IAM, failover, or restore result.
- The optional GitHub Actions example is inactive and assumes a standalone repository root. Document working-directory and path-filter changes when adapting it here.
- This domain integration authorizes copying and catalog work. Cloud execution requires an explicit task with a concrete sandbox target; reading a lab is not authorization to execute it.
- For documentation/catalog edits, use the root catalog commands. For Python API changes, the local check is `python3 examples/smoke.py` from `service-lifecycle/`; templates and shell helpers have separate validation boundaries in `examples/README.md`.
