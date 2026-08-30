// gcn-geometric-computation-network · gcn.mjs — THE NETWORK LAW (reference implementation).
// Drafted with sididy, the estate's resident mind, from Thomas Frumkin's Konomi geometric stack.
//
// The runnable heart of the disclosure: computation whose STATE IS A NUMBER, distributed over a
// mesh with no coordinator. Three mechanisms:
//
//   · FOLD    — machine state (a list of small integers) folds losslessly to ONE integer and
//               back. State that is a number can be checksummed, sharded, signed and carried on
//               any medium. (The full codec is the estate's geometric-computer; this is the
//               distribution-grade core.)
//   · SHARD   — the folded integer splits into k pieces, each a valid integer of its own, and
//               REASSEMBLES exactly — in any order, because every shard carries its index.
//               Losing any one shard makes reassembly refuse, loudly.
//   · PLACE   — which node holds which shard is decided by the golden angle (the estate's
//               golden-placer law): placements never cluster, for any number of shards and
//               nodes, with no coordinator and no hash ring to rebalance.
//
// Pure and total: bad input → { ok:false, why }, never a throw mid-computation.

const GOLDEN_ANGLE = 0.3819660112501051;  // 1 − 1/φ, as a fraction of the circle

/** FOLD — a list of integers in [0, 65535] becomes one integer (decimal string), losslessly.
 *  Base 65537 digits behind a sentinel 1: leading zeros and length survive. */
export function fold(state) {
  if (!Array.isArray(state)) return { ok: false, why: 'state must be a list of integers' };
  let n = 1n;
  for (const v of state) {
    if (!Number.isInteger(v) || v < 0 || v > 65535) return { ok: false, why: `state values must be integers in [0, 65535], got ${JSON.stringify(v)}` };
    n = n * 65537n + BigInt(v);
  }
  return { ok: true, n: n.toString() };
}

export function unfold(nStr) {
  if (typeof nStr !== 'string' || !/^[0-9]+$/.test(nStr)) return { ok: false, why: 'a fold is a decimal integer string' };
  let n = BigInt(nStr);
  if (n < 1n) return { ok: false, why: 'not a fold: the sentinel is missing' };
  const state = [];
  while (n > 1n) { state.unshift(Number(n % 65537n)); n /= 65537n; }
  return { ok: true, state };
}

/** SHARD — split a fold into k pieces by digit-striping in base 65537: shard i takes digits
 *  i, i+k, i+2k… Each piece is itself a sentinel-guarded integer plus its index, so shards
 *  reassemble in ANY order and a missing piece is named, never papered over. */
export function shard(nStr, k) {
  const u = unfold(nStr);
  if (!u.ok) return u;
  if (!Number.isInteger(k) || k < 1) return { ok: false, why: 'k must be a positive integer' };
  const stripes = Array.from({ length: k }, () => []);
  u.state.forEach((d, i) => stripes[i % k].push(d));
  const shards = [];
  for (let i = 0; i < k; i++) {
    const f = fold(stripes[i]);
    shards.push({ i, k, n: f.n });
  }
  return { ok: true, shards };
}

export function reassemble(shards) {
  if (!Array.isArray(shards) || shards.length === 0) return { ok: false, why: 'shards must be a non-empty list' };
  const k = shards[0] && shards[0].k;
  if (!Number.isInteger(k) || k < 1) return { ok: false, why: 'shards carry no valid k' };
  if (shards.length !== k) return { ok: false, why: `incomplete: ${shards.length} of ${k} shards — the missing piece is not guessable` };
  const byIndex = new Array(k).fill(null);
  for (const s of shards) {
    if (!s || !Number.isInteger(s.i) || s.i < 0 || s.i >= k || s.k !== k) return { ok: false, why: 'a shard is malformed or from a different split' };
    if (byIndex[s.i]) return { ok: false, why: `duplicate shard ${s.i} — two claims to the same stripe` };
    const u = unfold(s.n);
    if (!u.ok) return { ok: false, why: `shard ${s.i}: ${u.why}` };
    byIndex[s.i] = u.state;
  }
  const total = byIndex.reduce((a, st) => a + st.length, 0);
  const state = [];
  for (let pos = 0; pos < total; pos++) {
    const stripe = byIndex[pos % k];
    const j = Math.floor(pos / k);
    if (j >= stripe.length) return { ok: false, why: 'stripe lengths are inconsistent — not one fold’s shards' };
    state.push(stripe[j]);
  }
  return fold(state);
}

/** PLACE — shard s of k goes to the node at golden-angle position s·(1−1/φ) mod 1 around the
 *  ring of nodes. Deterministic, coordinator-free, and never clusters (golden-placer's law). */
export function place(shardIndex, nodes) {
  if (!Number.isInteger(shardIndex) || shardIndex < 0) return { ok: false, why: 'shard index must be a non-negative integer' };
  if (!Array.isArray(nodes) || nodes.length === 0 || nodes.some((n) => typeof n !== 'string' || !n)) return { ok: false, why: 'nodes must be a non-empty list of names' };
  const theta = (shardIndex * GOLDEN_ANGLE) % 1;
  const at = Math.floor(theta * nodes.length);
  return { ok: true, node: nodes[at], theta: Math.round(theta * 1e6) / 1e6 };
}
