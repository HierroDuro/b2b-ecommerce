/**
 * Typo-tolerant text search, used by the public product listing (see
 * /api/products) instead of a plain SQL "contains". Deliberately pure JS —
 * no Postgres-only extension (pg_trgm) and no SQLite-only pragma — so
 * search behaves identically in dev (SQLite) and prod (Postgres), matching
 * this project's "no engine-specific features" rule (see schema.prisma).
 *
 * The catalog is small enough (low hundreds of products) that scoring every
 * candidate in application code is cheap; this would need revisiting (a
 * real search index) well before that stops being true.
 */

/** Lowercases and strips accents so "inalámbrico" and "inalambrico" compare equal. */
function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

/** Collapses "." and "," used as thousands separators inside a number
 * ("25.600" -> "25600") before word-splitting, so a spec written with
 * separators in the product data is still found by a query typed as one
 * plain digit run (and vice versa). Loops because a single pass only
 * merges non-overlapping pairs — "1.234.567" needs two passes. */
function collapseNumericSeparators(value: string): string {
  let previous: string;
  let current = value;
  do {
    previous = current;
    current = current.replace(/(\d)[.,](\d)/g, "$1$2");
  } while (current !== previous);
  return current;
}

function tokenize(value: string): string[] {
  return collapseNumericSeparators(normalize(value))
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

/** Classic edit-distance DP — words here are short (product names), so the
 * O(n*m) cost is negligible. */
function levenshtein(a: string, b: string): number {
  const rows = a.length + 1;
  const cols = b.length + 1;
  const dist: number[][] = Array.from({ length: rows }, (_, i) => [
    i,
    ...Array<number>(cols - 1).fill(0),
  ]);
  for (let j = 1; j < cols; j++) dist[0]![j] = j;

  for (let i = 1; i < rows; i++) {
    for (let j = 1; j < cols; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dist[i]![j] = Math.min(
        dist[i - 1]![j]! + 1, // deletion
        dist[i]![j - 1]! + 1, // insertion
        dist[i - 1]![j - 1]! + cost, // substitution
      );
    }
  }
  return dist[rows - 1]![cols - 1]!;
}

const isNumeric = (s: string): boolean => /^[0-9]+$/.test(s);

/** How similar two individual words are, 0..1. Exact substrings (either
 * direction) always score 1 — this is what makes correctly-typed searches
 * behave at least as well as the old `contains` check. Words under 4
 * characters skip fuzzy comparison entirely: at that length edit-distance-1
 * matches almost anything, which would make short, common words match
 * unrelated products.
 *
 * Purely numeric words (DPI counts, model numbers, hyphen-split SKU
 * fragments like the "123" in "DX-123") are exact-match only: substring
 * containment and edit-distance leniency both produce nonsense for numbers
 * — "1200" is not a plausible typo of "12000", and a short digit run like
 * "123" is likely to turn up as a coincidental substring of almost any
 * longer query, which would otherwise register as a "perfect" match. */
function wordSimilarity(a: string, b: string): number {
  if (a === b) return 1;
  if (isNumeric(a) || isNumeric(b)) return 0;
  if (a.length >= 3 && b.length >= 3 && (a.includes(b) || b.includes(a))) return 1;
  if (a.length < 4 || b.length < 4) return 0;

  const distance = levenshtein(a, b);
  const similarity = 1 - distance / Math.max(a.length, b.length);
  // Below this, two words just don't resemble each other enough to be a
  // plausible typo of one another. 0.6 used to be the cutoff, but that let
  // through unrelated words that just happen to share several letters —
  // e.g. searching "parlantes" matched a mouse whose description mentioned
  // "variante" (0.667 similarity) — while every real single-typo case this
  // is meant to catch (a missing/extra/swapped letter, like "inalambrico"
  // vs "inalambico") scores 0.8 or higher.
  return similarity >= 0.8 ? similarity : 0;
}

/**
 * Scores how well `query` matches `text`, 0..1 (0 = no match). Every
 * *significant* word in the query (3+ characters) must find some plausible
 * match among the text's words — this is what stops an unrelated word in
 * the query from being silently ignored — and the score is the average of
 * each significant word's best match.
 *
 * Words under 3 characters ("x", "de", "un") are dropped before that check:
 * wordSimilarity() never matches anything that short (too many false
 * positives otherwise), so requiring them to match would let a single
 * stray short word — e.g. someone typing "HyperX" as "hiper x" — zero out
 * an otherwise perfect match. If the *whole* query is short words, they're
 * kept so a query doesn't just match everything by default.
 */
export function fuzzyScore(query: string, text: string): number {
  const allQueryWords = tokenize(query);
  const textWords = tokenize(text);
  if (allQueryWords.length === 0 || textWords.length === 0) return 0;

  const significantWords = allQueryWords.filter((w) => w.length >= 3);
  const queryWords = significantWords.length > 0 ? significantWords : allQueryWords;

  let total = 0;
  for (const qw of queryWords) {
    let best = 0;
    for (const tw of textWords) {
      const score = wordSimilarity(qw, tw);
      if (score > best) best = score;
      if (best === 1) break;
    }
    if (best === 0) return 0; // every (significant) query word must match something
    total += best;
  }
  return total / queryWords.length;
}

/** Builds the combined blob `fuzzyScore` matches a search query against —
 * shared by the public catalog API and the admin product table so both
 * search the same fields the same way. */
export function productSearchText(p: {
  name: string;
  brand: string;
  sku: string;
  description: string;
  category: { name: string };
}): string {
  return `${p.name} ${p.brand} ${p.sku} ${p.description} ${p.category.name}`;
}
