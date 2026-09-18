# Exercise generation evaluation — September 18, 2026

Use `openai/gpt-5.6-luna` as the initial **reviewed-draft** default. Both finalists produced valid responses on all 56 cases. Luna had better muscle agreement on the drafts it chose to generate, lower measured cost, and slightly lower latency; Mercury generated more drafts without asking for equipment clarification. This is a bounded comparison of five models, not proof of the globally cheapest accurate model. Neither result supports unattended publication.

## Method

The fixture contains 259 official exercises and 60 muscles. Stable SHA-256 ordering holds out 52 exercise names; all held-out entries are excluded from every prompt catalog. Four additional requests test ambiguous presses/rows, unrelated weather, and an instruction to invent invalid equipment/muscles. Prompts use the production provider with only training IDs/names/types and allowed muscle names, no gold muscle assignments or classifications, no search, concurrency two, and 4,000 output tokens.

The shortlist uses eight held-out names plus four behavioral cases per model. Full finalists use all 52 plus four. Finalist selection is therefore validation-set selection, not an untouched final test. Exact agreement is a catalog-consistency measure, not anatomical ground truth. Two held-out exercises lack both movement and group labels; only those field denominators exclude them. Schema validity, clarification behavior, classifications, and muscle precision/recall are separate. Descriptions were spot-checked, not comprehensively adjudicated.

## Shortlist

| Model                        | Valid / 12 | Equipment agreement / 8 | Movement agreement / 7 | Primary precision / recall | Reported cost | Median latency |
| ---------------------------- | ---------: | ----------------------: | ---------------------: | -------------------------: | ------------: | -------------: |
| `inception/mercury-2.5`      |         11 |                   75.0% |                  85.7% |              71.9% / 64.8% |      $0.00743 |          3.21s |
| `openai/gpt-5.6-luna`        |         12 |                   87.5% |                  85.7% |              83.3% / 69.6% |      $0.00650 |          3.26s |
| `deepseek/deepseek-v4-flash` |         12 |                   62.5% |                  57.1% |              66.7% / 49.8% |      $0.00698 |          7.22s |
| `openai/gpt-oss-20b`         |         12 |                   50.0% |                  14.3% |              52.1% / 39.6% |      $0.00343 |          8.51s |
| `mistralai/mistral-nemo`     |          6 |                   25.0% |                  14.3% |              18.8% / 20.8% |      $0.00243 |          5.21s |

Mercury and Luna advanced because they led classification/muscle agreement. Cheaper nominal token rates did not consistently produce lower request costs or sufficient catalog agreement. The shortlist is small and sensitive to the sampled exercises.

## Full finalists

| Metric                          |          Luna |   Mercury 2.5 |
| ------------------------------- | ------------: | ------------: |
| Valid responses                 |         56/56 |         56/56 |
| Expected response kind (56)     |         78.6% |         91.1% |
| Equipment agreement (52)        |         75.0% |         88.5% |
| Movement agreement (50)         |         72.0% |         86.0% |
| Group agreement (50)            |         74.0% |         86.0% |
| Primary muscle precision (52)   |         65.0% |         76.9% |
| Primary muscle recall (52)      |         69.0% |         76.1% |
| Secondary muscle precision (52) |         43.9% |         40.5% |
| Secondary muscle recall (52)    |         61.1% |         58.5% |
| Reported cost, all 56           |      $0.02294 |      $0.03506 |
| Uncached token-price estimate   |      $0.11135 |      $0.04005 |
| Median / p95 latency            | 3.25s / 4.91s | 3.49s / 5.90s |

These unconditional classification/muscle scores count clarifications as zero, preserving the completion tradeoff. Luna produced 40 drafts and 12 clarifications for the 52 names; Mercury produced 47 drafts and five clarifications. Both correctly clarified all four explicit ambiguous/invalid requests.

Conditioning on generated drafts explains quality but introduces selection bias; these are different subsets:

| Draft-only metric           | Luna (40 drafts) | Mercury (47 drafts) |
| --------------------------- | ---------------: | ------------------: |
| exercise type               |     97.5% (n=40) |        97.9% (n=47) |
| movement pattern            |     92.3% (n=39) |        93.5% (n=46) |
| muscle group                |     94.9% (n=39) |        93.5% (n=46) |
| primary muscles precision   |     84.5% (n=40) |        85.1% (n=47) |
| primary muscles recall      |     89.8% (n=40) |        84.1% (n=47) |
| secondary muscles precision |     57.0% (n=40) |        44.9% (n=47) |
| secondary muscles recall    |     79.4% (n=40) |        64.7% (n=47) |

## Interpretation and review examples

- Luna asked for equipment on Front Raise, Hip Thrust, Wrist Curl, Woodchop, and other underspecified names. It identified Standing Cable Hip Extension as a synonym of Cable Kickback. These are often reasonable clarifications despite lowering the automated expected-draft score; they were not silently reclassified as successes.
- Luna assigned Chest-Supported T-Bar Row to barbell while the catalog uses plate_loaded_machine. The description/equipment variant needs review.
- Luna assigned Dumbbell Flyes to horizontal_push versus catalog isolation, and Snatch-Grip Deadlift to hamstrings versus catalog back. These are classification disagreements, not automatically established anatomical errors.
- Secondary-muscle agreement remains materially weaker than primary agreement. For example, Luna adds several secondary movers to Cable Internal Rotation and Good Morning. These require human review against the intended catalog convention.
- Draft-only percentages are higher partly because ambiguous exercises were deferred. Mercury has better unconditional completion/agreement, while Luna has higher primary-muscle recall and secondary-muscle precision/recall within its generated drafts. No single score settles that tradeoff.

The measured workload repeatedly reused a large catalog prefix, so caching affects reported cost. Luna cost about $0.00041 per request here versus Mercury $0.00063; uncached estimates favor Mercury. All final and shortlist-v2 responses included usage/cost, including failures. Costs are provider-reported, not independently reconciled invoices. Snapshot pricing and preflight estimates are not hard billing caps.

## Validation and artifacts

Synthetic harness checks: five Bun tests (124 assertions) cover deterministic exclusion of all gold entries, precision/recall, missing-field denominators, error accounting, clarification metrics, and perfect draft scoring. A standalone TypeScript check passed. These do not replace the live model calls above. The official snapshot exercises populated catalog content but does not exercise production authentication, database publication, or user data.

A preliminary run exposed a real contract mismatch: the schema permitted an empty response message while runtime validation rejected it. Response-only diagnostics confirmed `message: ""`; the schema and prompt now require a nonempty message. Earlier runs are diagnostic evidence only and are excluded from the final comparisons. Raw response files and credentials are not committed.

Local run artifacts:

- `/tmp/uplifting-exercise-eval/shortlist-v2/summary.json` and per-case files.
- `/tmp/uplifting-exercise-eval/finalists-v2/summary.json` and per-case files.
- Preliminary diagnostics: `/tmp/uplifting-exercise-eval/shortlist-live/`, `/tmp/uplifting-exercise-eval/finalists-live/`, `/tmp/uplifting-exercise-eval/luna-diagnostic/`. These have missing costs on older failed calls, so their recorded sum is a lower bound.

The shortlist and finalists use the same behavioral provider/contract version; the contract was reformatted between them, so its source hash differs.

Finalist fingerprints (SHA-256):

- Provider: `236bf625431b4390016bb28257466ca660b88ef1c6f9347fdb0d46f979351da4`
- Contract: `d89fdebb2fc827a5e3ac7d1b48d056e3d2ee61e374d15c59793380eba7a14c5d`
- Catalog JSON serialization: `146b830b485aae843467d517a3706b54e0e7dde775758d3ee0e68aba48f8c299`
- Completed: `2026-09-18T22:07:15.672Z`

See `scripts/exercise-eval/README.md` for reproducible dry-run and paid-run commands.
