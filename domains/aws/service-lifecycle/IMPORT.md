# AWS curriculum import record

[AWS domain](../README.md) · [Original curriculum index](README.md) · [File manifest](IMPORT.json)

## Provenance

| Field | Value |
| --- | --- |
| Source repository | `/home/shreyas/Work/learning/aws` |
| Source revision | `1cc1b8971b2df911bb7f905f24907197ea65fd25` |
| Source commit date | 2026-10-04 |
| Import date | 2026-10-07 |
| Canonical destination | `domains/aws/service-lifecycle/` |
| Source files | 23 tracked regular files, 227,830 bytes |
| Documentation research snapshot | 2026-10-04, retained from the original guides |

The source working tree was clean. Each tracked file was compared with its committed Git blob, copied unchanged, and compared with its destination. [IMPORT.json](IMPORT.json) records original paths, byte counts, SHA-256 hashes, and Git file modes. This record describes the import baseline; later intentional edits can differ from it.

Only tracked files were imported. The source repository and its history were left in place. Git internals, ignored build outputs, virtual environments, local configuration, and credentials were excluded. The source `.gitignore` and `.dockerignore` remain with their examples.

## Working directory

From the Tantradnyan root, run:

```bash
cd domains/aws/service-lifecycle
```

Within imported documents, “repository root” denotes this directory. For example, `examples/lab.sh` uses `LAB_EXAMPLES=examples`; run the lab in this directory so its templates resolve. Keeping the complete source tree together preserves the original chapter links and Docker build context.

## CI working directory

`examples/github-actions.yml.example` is a **non-active example file**. It was copied unchanged and was not installed in `.github/workflows/`.

Its standalone commands use `examples/` directly. If adapting it into a workflow for this repository, review at least:

- Set `defaults.run.working-directory: domains/aws/service-lifecycle` in each applicable job, or explicitly prefix each shell command's paths. A step-level working directory can override the job default.
- Audit file paths passed to actions separately: the shell working-directory default applies to `run` steps, not to `uses` inputs.
- Scope any new path filters to this curriculum and to the workflow itself. Keep action revision placeholders, repository identity/trust configuration, protected environments, and exact-change-set review requirements explicit.

GitHub documents the scope and precedence of these defaults in [setting a default shell and working directory](https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/set-default-values-for-jobs).

The import does not configure OIDC, create repositories/environments, publish images, or apply change sets. The original example's review procedure remains part of the learning material.

## Validation scope

Import verification establishes file identity, catalog structure for the AWS additions, and local documentation targets. It does not establish current AWS guidance, external-link availability, Python application correctness, container reproducibility, CloudFormation deployment, regional capacity, IAM authorization, secret rotation, database bootstrap, failover, or restore.

The [local smoke check](examples/README.md#validation-boundaries) is available as `python3 examples/smoke.py`. Cloud acceptance checks are in the individual [labs](04-hands-on-labs.md). Neither constitutes an observation until actually run and recorded. Catalog milestones remain **available**, not verified learning outcomes.

### Import observations — 2026-10-07

| Check | Observed result |
| --- | --- |
| Source Git blobs, destination hashes, byte counts, executable bits | All 23 files match; source working tree remains clean at the imported revision |
| AWS local Markdown file targets | All resolve; the checker does not validate heading fragments or external URLs |
| Catalog changes | AWS adds one domain and one topic; existing topics, domains, tracks, and learner milestone states are unchanged |
| Catalog validation | No additional errors; validation also passes when the known missing `crdt-counters` topic and its edges are excluded **in memory** for a diagnostic check |
| `python3 scripts/lab.py build` | Exit 1: pre-existing missing CRDT-counter artifacts and links block generation; generated navigation was not refreshed |
| `python3 scripts/lab.py check --generated` | Exit 1: the same 6 metadata errors and 18 local-link errors; generated freshness cannot be established by this command |
| Python smoke check, image build, template schema checks, cloud labs | Not run during this unchanged-source import |

At import time, the full-repository blocker was the absent `domains/synchronization/crdt-counters/` tree, still referenced by active catalog metadata and historical validation notes. These observations describe that import baseline. Later on 2026-10-07, the former synchronization domain and its obsolete catalog references were removed, allowing navigation to be regenerated. The source-file hashes and original import observations remain unchanged.

### Compare with the import baseline

From this curriculum directory, this read-only check uses only Python's standard library:

```bash
python3 - <<'PY'
import hashlib
import json
from pathlib import Path

manifest = json.loads(Path('IMPORT.json').read_text())
changed = []
for record in manifest['files']:
    path = Path(record['path'])
    if not path.is_file():
        changed.append(f'missing: {path}')
        continue
    body = path.read_bytes()
    if len(body) != record['bytes'] or hashlib.sha256(body).hexdigest() != record['sha256']:
        changed.append(f'changed: {path}')
if changed:
    print('\n'.join(changed))
    raise SystemExit(1)
print(f"All {len(manifest['files'])} imported files match the baseline.")
PY
```

A difference can be an intentional curriculum change. Inspect it against the original revision; preserve this historical baseline rather than treating a new hash as evidence of the original import.

## Curriculum extension — 2026-10-07

The domain now adds a [first-principles master guide](../GUIDE.md), [twenty local Python labs](../aws-service-lab/README.md), [cloud workbook](../CLOUD-LABS.md), [exercise review](../EXERCISES.md), and [source map](../references/README.md) beside this imported tree. The canonical catalog entry points to `domains/aws/curriculum/`; this directory still owns the original source material and its working-directory conventions.

The 23 files listed in `IMPORT.json` remain unchanged. Local model observations and SDK-fake/template checks are documented in the [new evidence record](../experiments/README.md); they do not revise the earlier import observations or imply execution of cloud labs.
