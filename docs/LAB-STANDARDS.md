# Lab and simulation standards

## Lab manifest

Each registered browser lab has `lab.json` beside its entry file:

```json
{
  "schema_version": 1,
  "id": "instruction-execution-lab",
  "topic": "instruction-execution",
  "title": "Step a tiny CPU",
  "entry": "index.html",
  "model": "../implementations/javascript/model.js",
  "limitations": ["Instruction-index PC; separate byte memory; no pipeline or interrupts."]
}
```

Paths are manifest-relative, stay inside the repository, and must exist. The catalog lists the root-relative manifest path in the topic's `labs` array. The generator discovers the HTML entry and shows it in the atlas. It does not execute arbitrary commands from manifests. The optional model is shared with headless experiments.

## Replayable model

A model's transition function takes state and an action, checks validity, and returns a new state plus an event or trace. Avoid clock reads and hidden global state. The starter CPU is immutable at each successful instruction transition; the counter functions return new vectors. Rendering and UI controls are separate from these operations.

Scenario format for future replay/import tools:

```json
{
  "schema_version": 1,
  "model": "crdt-gcounter-v1",
  "initial": {"replicas": [[0, 0], [0, 0]]},
  "assumptions": ["Replica 0 owns component 0; replica 1 owns component 1."],
  "actions": [
    {"step": 0, "kind": "increment", "actor": 0},
    {"step": 1, "kind": "increment", "actor": 1},
    {"step": 2, "kind": "send-snapshot", "actor": 0, "to": 1},
    {"step": 3, "kind": "deliver", "message": 0}
  ]
}
```

This is an interchange design, not an implemented universal runner. Topic-specific schema checks and import/export should arrive with the first real replay need. Specify seed and PRNG if actions include randomness. Logical event times and wall-clock timings must use separate fields.

## Lab review checklist

- A learner can predict an outcome, change one relevant input, and see state change.
- Initial conditions and reset are visible; errors are text; bounded execution prevents hangs.
- Inputs have labels; controls work with a keyboard; colors have text equivalents.
- The diagram and the model share semantics. A network partition blocks deliveries, not just draws a red edge.
- Trace entries identify causality. Limitations and omitted mechanisms are visible.
- Run instructions specify direct-file support or required localhost serving.
- Headless and browser validation scopes are reported separately.

For large simulations, add a worker and batch trace rendering only when the UI becomes unresponsive. Keep the core model independently inspectable.
