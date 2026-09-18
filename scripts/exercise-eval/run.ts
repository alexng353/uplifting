import { mkdir } from "node:fs/promises";
import { AsyncLocalStorage } from "node:async_hooks";
import { createHash } from "node:crypto";
import { generateDraft } from "../../apps/api/src/exercise-agent/provider";
import { validateResult } from "../../apps/api/src/exercise-agent/contract";
import catalog from "./fixtures/catalog.json";
import modelSnapshot from "./fixtures/models.json";
import { split, modelInput, score, aggregate } from "./core";

const args = process.argv.slice(2);
const option = (name: string, fallback: string) =>
  args.find((v) => v.startsWith(`--${name}=`))?.slice(name.length + 3) ?? fallback;
const phase = option("phase", "shortlist");
if (!["shortlist", "finalists"].includes(phase))
  throw new Error("phase must be shortlist or finalists");
const selected = option(
  "models",
  phase === "shortlist" ? modelSnapshot.models.map((m) => m.id).join(",") : "",
)
  .split(",")
  .filter(Boolean);
if (!selected.length || new Set(selected).size !== selected.length)
  throw new Error("Supply unique --models=model-id,model-id for finalists");
const models = selected.map((id) => {
  const model = modelSnapshot.models.find((m) => m.id === id);
  if (!model) throw new Error(`Unknown priced model ${id}; update the metadata snapshot first`);
  return model;
});
const budget = Number(option("budget-usd", "1"));
const maxTokens = Number(option("max-tokens", "4000"));
if (
  !Number.isFinite(budget) ||
  budget <= 0 ||
  !Number.isInteger(maxTokens) ||
  maxTokens < 128 ||
  maxTokens > 4000
)
  throw new Error("Invalid budget or max tokens (128–4000)");
const { training, cases } = split(catalog);
const chosen =
  phase === "shortlist"
    ? [...cases.filter((c) => c.gold).slice(0, 8), ...cases.filter((c) => !c.gold)]
    : cases;
const jobs = models.flatMap((model) =>
  chosen.map((test) => ({
    model,
    test,
    input: modelInput(catalog, cases, training, test),
  })),
);
// One UTF-8 byte per input token is deliberately conservative; allow another
// 16K tokens for the provider system prompt/schema. No retries or search calls.
const reserved = jobs.reduce(
  (sum, j) =>
    sum +
    (Buffer.byteLength(JSON.stringify(j.input)) + 16000) * Number(j.model.pricing.prompt) +
    maxTokens * Number(j.model.pricing.completion),
  0,
);
const plan = {
  phase,
  models: selected,
  casesPerModel: chosen.length,
  requests: jobs.length,
  concurrency: 2,
  maxTokens,
  budgetUSD: budget,
  conservativeEstimatedCeilingUSD: reserved,
  metadataCapturedAt: modelSnapshot.capturedAt,
};
console.log(JSON.stringify(plan, null, 2));
if (!args.includes("--execute")) {
  console.log("Dry run only. Add --execute with OPENROUTER_API_KEY to make paid calls.");
  process.exit(0);
}
if (reserved > budget)
  throw new Error(
    "Estimated total exceeds budget; reduce models or explicitly increase --budget-usd",
  );
if (!process.env.OPENROUTER_API_KEY)
  throw new Error("OPENROUTER_API_KEY is required; no requests made");
const directory = option(
  "output",
  `/tmp/uplifting-exercise-eval/${new Date().toISOString().replaceAll(":", "-")}`,
);
await mkdir(directory, { recursive: true });
const providerSHA256 = createHash("sha256")
  .update(
    await Bun.file(
      new URL("../../apps/api/src/exercise-agent/provider.ts", import.meta.url),
    ).text(),
  )
  .digest("hex");
const contractSHA256 = createHash("sha256")
  .update(
    await Bun.file(
      new URL("../../apps/api/src/exercise-agent/contract.ts", import.meta.url),
    ).text(),
  )
  .digest("hex");
// Capture response-only diagnostics per concurrent call; never record requests,
// authorization headers, or environment values. Production generation is unchanged.
const responseContext = new AsyncLocalStorage<{
  body?: { choices?: unknown; usage?: Record<string, unknown> };
}>();
const realFetch = globalThis.fetch;
globalThis.fetch = (async (...args: Parameters<typeof fetch>) => {
  const response = await realFetch(...args);
  const context = responseContext.getStore();
  if (context && args[0] === "https://openrouter.ai/api/v1/chat/completions") {
    try {
      const body = (await response.clone().json()) as any;
      context.body = {
        choices: body.choices?.map((choice: any) => ({
          finish_reason: choice.finish_reason,
          content: choice.message?.content,
        })),
        usage: body.usage,
      };
    } catch {}
  }
  return response;
}) as typeof fetch;
const rows: any[] = [];
let cursor = 0;
await Promise.all(
  Array.from({ length: 2 }, async () => {
    while (cursor < jobs.length) {
      const job = jobs[cursor++]!;
      const started = performance.now();
      const diagnostic: {
        body?: { choices?: unknown; usage?: Record<string, unknown> };
      } = {};
      let result: unknown = null,
        usage: Record<string, unknown> = {},
        error: string | null = null,
        schemaValid = false;
      try {
        const response = await responseContext.run(diagnostic, () =>
          generateDraft(job.input, { model: job.model.id, maxTokens }),
        );
        result = validateResult(response.result, catalog.muscles);
        usage = response.usage;
        schemaValid = true;
      } catch (e) {
        error = e instanceof Error ? e.message : "Unknown provider error";
      }
      usage = diagnostic.body?.usage ?? usage;
      const promptTokens = typeof usage.prompt_tokens === "number" ? usage.prompt_tokens : null;
      const completionTokens =
        typeof usage.completion_tokens === "number" ? usage.completion_tokens : null;
      const reportedCost = typeof usage.cost === "number" ? usage.cost : null;
      const estimatedCost =
        promptTokens !== null && completionTokens !== null
          ? promptTokens * Number(job.model.pricing.prompt) +
            completionTokens * Number(job.model.pricing.completion)
          : null;
      const row = {
        model: job.model.id,
        caseId: job.test.id,
        request: job.test.request,
        expectedKind: job.test.expected,
        result,
        error,
        providerResponse: diagnostic.body?.choices ?? null,
        latencyMs: performance.now() - started,
        usage,
        reportedCostUSD: reportedCost,
        estimatedCostUSD: estimatedCost,
        metrics: score(job.test, result, schemaValid),
      };
      rows.push(row);
      // Separate files preserve completed results if interrupted without shared append races.
      await Bun.write(
        `${directory}/${job.model.id.replaceAll("/", "_")}-${job.test.id}.json`,
        JSON.stringify(row, null, 2),
      );
      console.log(
        `${rows.length}/${jobs.length} ${job.model.id} ${job.test.id} ${error ? "ERROR" : "OK"}`,
      );
    }
  }),
);
const summary = models.map((model) => {
  const subset = rows.filter((r) => r.model === model.id);
  const latencies = subset.map((r) => r.latencyMs).sort((a, b) => a - b);
  return {
    model: model.id,
    metrics: aggregate(subset),
    errors: subset.filter((r) => r.error).length,
    latencyMedianMs: latencies[Math.floor(latencies.length * 0.5)],
    latencyP95Ms: latencies[Math.min(latencies.length - 1, Math.ceil(latencies.length * 0.95) - 1)],
    reportedCostUSD: subset.reduce((n, r) => n + (r.reportedCostUSD ?? 0), 0),
    reportedCostMissing: subset.filter((r) => r.reportedCostUSD === null).length,
    estimatedKnownCostUSD: subset.reduce((n, r) => n + (r.estimatedCostUSD ?? 0), 0),
    estimatedCostMissing: subset.filter((r) => r.estimatedCostUSD === null).length,
  };
});
const report = {
  plan,
  providerSHA256,
  contractSHA256,
  catalogSHA256: createHash("sha256").update(JSON.stringify(catalog)).digest("hex"),
  completedAt: new Date().toISOString(),
  summary,
  limitations: [
    "Official catalog agreement is a proxy, not anatomical ground truth.",
    "Description/name quality requires manual review; no gold text similarity score.",
    "Errors may incur unreported cost; missing usage is not zero cost.",
    "Snapshot pricing is an estimate, not a provider-enforced billing cap.",
    "Shortlist selection and synonym duplicates can bias results; inspect individual outputs.",
  ],
};
await Bun.write(`${directory}/summary.json`, JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
console.log(`Results: ${directory}/summary.json`);
