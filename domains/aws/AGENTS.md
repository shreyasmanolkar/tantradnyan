# AWS domain instructions

Read the root agent protocol and [curriculum import record](service-lifecycle/IMPORT.md).

- `GUIDE.md` derives mechanisms; `aws-service-lab/` owns twenty independent Python models, their walkthroughs and checks; `CLOUD-LABS.md` owns manual real-service comparisons. Keep the local runner free of AWS calls and network listeners.
- `service-lifecycle/` is the canonical imported curriculum. Keep chapters and `examples/` together; original commands use that directory as their working directory.
- Preserve source notes, limitations, and dated research claims. Changes after import may intentionally differ from the hashes in `IMPORT.json`; record those differences rather than rewriting the original provenance.
- Describe cloud lab steps and expected observations separately from actual run evidence. A copied template or local syntax check establishes no deployment, IAM, failover, or restore result.
- The optional GitHub Actions example is inactive and assumes a standalone repository root. Document working-directory and path-filter changes when adapting it here.
- This curriculum task authorizes local implementations and documentation. Cloud execution requires an explicit task with a concrete sandbox target; reading a lab is not authorization to execute it.
- For documentation/catalog edits, use the root catalog commands. For Python API changes, the local check is `python3 examples/smoke.py` from `service-lifecycle/`; templates and shell helpers have separate validation boundaries in `examples/README.md`.
- For local model changes, run `python3 run.py test` and the affected demo/experiment from `aws-service-lab/`. The cloud handler uses an SDK fake locally: `python3 -B cloud/test_handler.py`; verify generated inline code with `python3 -B cloud/build_template.py --check`, then `python3 -B cloud/check_templates.py`. A fake, JSON parser or reference check is not CloudFormation schema or deployment validation.
- The envelope/key model does not encrypt; SQLite is not RDS; the queue's strict stale-handle check is not SQS DeleteMessage semantics; the IaC model's atomic apply/base check is not CloudFormation. Preserve these differences in explanations and checks.
