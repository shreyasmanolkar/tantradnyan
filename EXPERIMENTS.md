# Experiment registry

Experiments live with their explanation. See [the index](experiments/README.md) for existing experiments and [the template](templates/experiment/README.md) for new ones.

Every experiment records hypothesis → setup → prediction → execution → observations → interpretation → limitations → next question. A deterministic trace establishes behavior within a declared model. A hardware measurement needs environment, controls, repetitions, and raw results. Neither implies personal mastery.

Store small curated result bundles under `results/<UTC-run-id>/` inside an experiment. Use `not run` when there is no observation. Do not turn a predicted result into an actual result by rewording it.
