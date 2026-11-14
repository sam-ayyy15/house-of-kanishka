// Search over the local catalogue: whole words and word starts first, then typo-tolerant
// matching (one slip in a short word, two in a long one) when nothing matches exactly.
import { products, type Product } from './products';

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

type Doc = { product: Product; name: string[]; tags: string[]; text: string[] };

const docs: Doc[] = products.map((product) => ({
  product,
  name: norm(product.name).split(' '),
  tags: norm([product.colour, product.category, ...product.tags].join(' ')).split(' '),
  text: norm(product.description).split(' '),
}));

/** Every word used by name, colour or category: what a typo can be corrected to. */
const vocabulary = [...new Set(docs.flatMap((d) => [...d.name, ...d.tags]).filter((w) => w.length >= 3))];

/** Edit distance, giving up (returns max + 1) once it can't be within `max`. */
function distance(a: string, b: string, max: number): number {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    let low = i;
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      low = Math.min(low, cur[j]);
    }
    if (low > max) return max + 1;
    prev = cur;
  }
  return prev[b.length];
}

const allowed = (word: string) => (word.length >= 7 ? 2 : word.length >= 4 ? 1 : 0);

/** How well one query word matches a list of document words (0 = not at all). */
function match(token: string, words: string[], fuzzy: boolean): number {
  let best = 0;
  for (const w of words) {
    if (w === token) return 3;
    // "dress" for "dresses", "satins" for "satin".
    if (w.startsWith(token) || (w.length >= 4 && token.startsWith(w))) best = Math.max(best, 2);
    else if (fuzzy && allowed(token) && distance(token, w, allowed(token)) <= allowed(token)) best = Math.max(best, 1);
  }
  return best;
}

function run(tokens: string[], fuzzy: boolean): Product[] {
  return docs
    .map((d) => {
      let score = 0;
      for (const t of tokens) {
        const s = Math.max(match(t, d.name, fuzzy) * 3, match(t, d.tags, fuzzy) * 2, match(t, d.text, false));
        if (s === 0) return null; // every word has to match something
        score += s;
      }
      return { d, score };
    })
    .filter((x): x is { d: Doc; score: number } => x !== null)
    .sort((a, b) => b.score - a.score)
    .map((x) => x.d.product);
}

/** The vocabulary word closest to a misspelt one, or null. */
function correct(token: string): string | null {
  if (!allowed(token) || vocabulary.includes(token)) return null;
  let best: string | null = null;
  let bestD = allowed(token) + 1;
  for (const w of vocabulary) {
    const d = distance(token, w, allowed(token));
    if (d < bestD) {
      best = w;
      bestD = d;
    }
  }
  return best;
}

export type SearchResult = {
  results: Product[];
  /** Set when nothing matched as typed and the results are for a corrected spelling. */
  corrected: string | null;
};

export function searchProducts(query: string): SearchResult {
  const tokens = norm(query).split(' ').filter(Boolean);
  if (tokens.length === 0) return { results: [], corrected: null };
  const exact = run(tokens, false);
  if (exact.length > 0) return { results: exact, corrected: null };
  const fuzzy = run(tokens, true);
  if (fuzzy.length === 0) return { results: [], corrected: null };
  const fixed = tokens.map((t) => correct(t) ?? t).join(' ');
  return { results: fuzzy, corrected: fixed === tokens.join(' ') ? null : fixed };
}

export type Suggestion = { kind: 'term'; label: string } | { kind: 'product'; label: string; slug: string };

/** Up to two words and four pieces that start like what has been typed so far. */
export function suggest(query: string): Suggestion[] {
  const tokens = norm(query).split(' ').filter(Boolean);
  const last = tokens.at(-1);
  if (!last || last.length < 2) return [];
  const before = tokens.slice(0, -1).join(' ');
  const terms = vocabulary
    .filter((w) => w.startsWith(last) && w !== last)
    .slice(0, 2)
    .map((w): Suggestion => ({ kind: 'term', label: `${before ? `${before} ` : ''}${w}` }));
  const pieces = docs
    .filter((d) => tokens.every((t) => match(t, d.name, false) >= 2 || match(t, d.tags, false) >= 2))
    .slice(0, 4)
    .map((d): Suggestion => ({ kind: 'product', label: d.product.name, slug: d.product.slug }));
  return [...terms, ...pieces];
}

/** Words offered as one-tap searches when the box is empty. */
export const POPULAR_SEARCHES = ['Satin', 'Midi', 'Halter', 'Burgundy', 'Bags', 'Jewelry'];
