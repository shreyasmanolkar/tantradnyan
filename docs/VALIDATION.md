# Initial verification record

Recorded 2026-10-06 UTC (2026-10-07 in Asia/Kolkata). The repository was a newly scaffolded, uncommitted working tree with no existing commit ID.

## Environment and checks

- Python 3.14.7: `python3 scripts/lab.py check --generated` passed for 243 topics, 19 domains, and 3 registered labs. Local Markdown file targets and generated-output freshness passed.
- Validator counterexamples: injected prerequisite cycle, unknown related topic, and missing milestone artifact were all rejected. These checks used copies of the catalog without modifying its maintained records.
- Node.js v26.7.0: [CPU model experiment](../domains/computer-architecture/instruction-execution/experiments/instruction-trace/results/20261006T194732Z-initial-validation/README.md) and [counter merge experiment](../domains/synchronization/crdt-counters/experiments/delivery-order/results/20261006T194732Z-initial-validation/README.md) passed.
- Chromium 151.0.7922.137: browser automation loaded the actual HTML files using `file://`, drove their controls, and reported zero uncaught JavaScript exceptions. Desktop screenshots were visually inspected. Browser report: [browser.json](validation/browser.json).

## Browser observations and reproduction

| Lab | Actions reviewed | Observed result |
| --- | --- | --- |
| CSS centering | Reset; width:auto; child=650px; flex with explicit zero margins; grid; narrow viewport | Initial parent/child/gaps=420/180/120/120 px; width:auto child=420px and left margin=0; oversized child gaps=0/-230px; flex left gap=120px; grid left/top gaps=120/78px |
| CSS responsive layout | Set viewport to 390px wide | After fixing grid-item minimum sizing, document width and viewport width both measured 390px; the experiment surface scrolls within its panel |
| CPU | Step; reset/run sample; empty-stack POP; invalid register; nonterminating branch; manual register edit | First MOV puts 3 in R0; sample halts in 15 instructions with registers `[0,1,6,6]` and memory[0]=6; invalid actions show errors; run stops at the 256-step limit |
| Counter replicas | Disconnect client 1; edit clients 0/1; queue online states; reconnect; duplicate/deliver snapshots; block delivery with an offline endpoint | Updated states converge to totals `[2,2,2]`; duplicate snapshots do not add increments; disconnected endpoints pause delivery |
| Atlas | Existing-content filter; planned-topic selection; search; lab launches; SVG Enter handler; select each of 243 topics | Filter shows 3 starter topics; planned node has no launch link; CPU has 8 milestones; every topic renders its connections without an uncaught exception |

To reproduce the browser review manually, open the linked labs from the root README, perform these actions, and inspect the displayed state and computed geometry. The review used temporary CDP automation and screenshots under `/tmp`; those are not required repository dependencies.

## Verification limits

This is a functional review of the starter artifacts. It does not establish learner mastery, real CPU timing, actual networking behavior, power-loss durability, production protocol conformance, or scientific correctness of planned topics. Browser observations cover one Chromium version and the cases above; a full accessibility audit and other browser engines remain future work.

Metadata checks do not verify external URLs, heading anchors, HTML links, or every prose claim. The two headless drivers check model behavior and selected counterexamples. The CRDT algebraic explanation supports a broader argument than its finite test space. All catalog learner milestone states remain available or planned.
