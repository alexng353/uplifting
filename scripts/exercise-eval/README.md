# Exercise generation evaluation

This harness invokes the **same provider and validator as the API**. It does not enable search, retries, publication, database writes, or access user workout data. The fixture is an official-catalog snapshot captured September 18, 2026 (259 exercises, 60 muscle definitions). Recorded live evaluation findings are in `docs/exercise-agent-evaluation.md`; adding this harness or running its default dry run does not make paid calls.

```sh
bun test scripts/exercise-eval/core.test.ts
bun scripts/exercise-eval/run.ts
# Paid run; supply OPENROUTER_API_KEY through your approved credential mechanism.
bun scripts/exercise-eval/run.ts --execute --budget-usd=1
# After inspecting shortlist results, explicitly select finalists:
bun scripts/exercise-eval/run.ts --phase=finalists --models=openai/gpt-5.6-luna,openai/gpt-oss-20b --execute --budget-usd=1
```

Default is a dry run. The shortlist contains five inexpensive models advertised as supporting tools and structured outputs, including Luna. Metadata/prices are pinned in `fixtures/models.json`; actual endpoint support is tested only when a request runs. Models cannot silently fall back to a different model. First evaluate eight held-out exercise requests and four ambiguous/invalid requests per model. Then evaluate chosen finalists on the full 20% held-out partition plus those four cases. Avoid claiming a statistically established winner from eight cases. Finalist selection uses these data, so this is a comparative validation set, not an untouched final test set.

The split is stable SHA-256 ordering over `uplifting-v1:<official exercise id>`. Every held-out exercise is excluded from every input catalog, including cases not selected for the shortlist. Prompts contain only training IDs/names/equipment types and the muscle vocabulary, matching production catalog context; gold classifications/descriptions/muscle assignments never enter the prompt. Related exercises and synonyms may remain in training: inspect unexpected duplicate clarifications rather than automatically blaming anatomical knowledge. The request necessarily contains the exercise name being tested.

Metrics remain separate: runtime schema/taxonomy validity, expected draft/clarification response, equipment/movement/group agreement, and primary/secondary muscle precision and recall. Missing gold classifications are excluded **only** from that field's denominator. Model errors count as failures, not omitted observations. Empty predicted muscle sets have zero precision when gold is nonempty; empty gold has recall one. Names and descriptions require manual review; wording similarity is deliberately not used. Catalog agreement is not proof of anatomical truth. Review apparent disagreements and conservative clarifications before deciding quality is acceptable. Ambiguous/invalid prompts are explicit behavioral expectations, not official-catalog truth.

The runner records each output, sanitized provider error, latency, usage, provider-reported cost when present, and token-price estimate. An evaluation-only fetch wrapper captures response content, finish reason, and usage (including validation failures); it never records request headers or credentials. Reports fingerprint the production provider and contract sources. It summarizes median/p95 latency and missing-cost counts. Missing usage is **unknown cost**, never evidence of a free request. Artifacts go to a timestamped `/tmp/uplifting-exercise-eval/` directory; set `--output=/absolute/path` to retain elsewhere. Do not commit actual request outputs or credentials.

Concurrency is two, token cap defaults to 4,000 (maximum 4,000), with no retries. A conservative preflight estimate uses one input token per UTF-8 byte plus 16,000 system/schema tokens and reserves full output tokens for every request. `--budget-usd` rejects an over-budget plan before sending requests; it is not an enforced billing cap because upstream prices may change or usage may be unavailable. Use a provider account limit for a hard spending cap. Refresh the metadata snapshot before relying on old prices. Choose the cheapest model only after reviewing all metric dimensions and human-checking name/description correctness; this script deliberately does not hide tradeoffs behind a single score.
