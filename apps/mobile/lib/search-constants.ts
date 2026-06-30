/**
 * Tunable constants + scoring for exercise search.
 *
 * `EXERCISE_SEARCH_ALIASES` maps a typed query to one or more exercise-name
 * fragments that should be boosted when that exact query is typed. This is the
 * file to edit when you want a shorthand to surface a specific result first.
 *
 *   e.g. typing "b" boosts "Bench Press" to the top.
 *
 * Keys are matched against the lowercased, trimmed query. Values are
 * lowercased name fragments (a value matches an exercise when the exercise
 * name contains it).
 */
export const EXERCISE_SEARCH_ALIASES: Record<string, string[]> = {
  b: ["bench press"],
};

// Scoring weights — higher means ranked sooner. Tune freely.
const W_EXACT_NAME = 1000; // query equals the whole exercise name
const W_ALIAS_EXACT = 800; // query is an alias whose target equals the name
const W_ALIAS_PARTIAL = 400; // query is an alias whose target is within the name
const W_PHRASE = 200; // the full multi-word query appears in order in the name
const W_NAME_PREFIX = 120; // the name starts with the typed query string
const W_EXACT_WORD = 100; // a query word matches a whole word in the name
const W_PREFIX_WORD = 30; // a query word is a prefix of some name word

function words(s: string): string[] {
  return s
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

/**
 * Score how well `name` matches `query`. Higher is better; 0 means no boost
 * beyond whatever the fuzzy layer surfaced.
 *
 * Priority (per product spec):
 *  - exact whole-word matches boost the result, and accrue per match so more
 *    matched words rank higher;
 *  - matches in exact order (the whole query as a contiguous phrase) get an
 *    extra boost on top;
 *  - alias hits (see `EXERCISE_SEARCH_ALIASES`) get the strongest boost.
 */
export function scoreExercise(name: string, query: string): number {
  const q = query.trim().toLowerCase();
  if (!q) return 0;
  const n = name.toLowerCase();

  let score = 0;

  // Exact full-name match wins outright.
  if (n === q) score += W_EXACT_NAME;

  // Alias boosts (strongest signal — the user typed a known shorthand).
  const aliasTargets = EXERCISE_SEARCH_ALIASES[q];
  if (aliasTargets) {
    for (const target of aliasTargets) {
      const t = target.toLowerCase();
      if (n === t) score += W_ALIAS_EXACT;
      else if (n.includes(t)) score += W_ALIAS_PARTIAL;
    }
  }

  // Name starts with the typed query (e.g. "ben" -> "Bench Press").
  if (n.startsWith(q)) score += W_NAME_PREFIX;

  // Phrase / exact-order match: the whole multi-word query appears contiguously.
  if (q.includes(" ") && n.includes(q)) score += W_PHRASE;

  // Per-word matching: exact whole-word matches accrue per match.
  const nameWords = words(n);
  const nameWordSet = new Set(nameWords);
  for (const qw of words(q)) {
    if (nameWordSet.has(qw)) {
      score += W_EXACT_WORD;
    } else if (nameWords.some((nw) => nw.startsWith(qw))) {
      score += W_PREFIX_WORD;
    }
  }

  return score;
}
