// gcn.test.mjs — the network law, falsifiable. The load-bearing properties: fold round-trips
// EVERY state, shards reassemble in any order but never with one missing, and golden-angle
// placement spreads — a network that loses or clusters state is not a computation network.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fold, unfold, shard, reassemble, place } from './gcn.mjs';

test('FOLD — lossless round trip, exact arithmetic, leading zeros survive', () => {
  const f = fold([0, 42, 65535]);
  const u = unfold(f.n);
  assert.deepEqual(u.state, [0, 42, 65535], 'the leading zero survives behind the sentinel');
  assert.equal(fold([]).n, '1', 'the empty state is the sentinel alone');
  assert.equal(fold([7]).n, String(65537 + 7), 'one digit: 1×65537 + 7');
  assert.match(fold([65536]).why, /\[0, 65535\]/, 'a value past the alphabet refuses');
  assert.match(fold([1.5]).why, /\[0, 65535\]/);
  assert.match(fold('x').why, /must be a list/);
  assert.match(unfold('0').why, /sentinel/);
  assert.match(unfold('xyz').why, /decimal integer/);
});

test('SHARD — digit-striping: each shard is a valid fold with its index aboard', () => {
  const f = fold([10, 20, 30, 40, 50]);
  const s = shard(f.n, 2);
  assert.equal(s.shards.length, 2);
  assert.deepEqual(unfold(s.shards[0].n).state, [10, 30, 50], 'stripe 0 takes digits 0,2,4');
  assert.deepEqual(unfold(s.shards[1].n).state, [20, 40], 'stripe 1 takes digits 1,3');
  assert.deepEqual(s.shards.map((x) => [x.i, x.k]), [[0, 2], [1, 2]]);
  assert.match(shard(f.n, 0).why, /positive integer/);
  assert.match(shard('junk', 2).why, /decimal integer/);
  // more shards than digits: the extra stripes are the empty fold, and it still reassembles
  const tiny = shard(fold([5]).n, 3);
  assert.equal(tiny.shards.length, 3);
  assert.equal(reassemble(tiny.shards).n, fold([5]).n);
});

test('REASSEMBLE — any order works; a missing, duplicate or alien shard is named', () => {
  const f = fold([1, 2, 3, 4, 5, 6, 7]);
  const s = shard(f.n, 3);
  assert.equal(reassemble([s.shards[2], s.shards[0], s.shards[1]]).n, f.n, 'order does not matter — the index is aboard');
  assert.match(reassemble([s.shards[0], s.shards[1]]).why, /incomplete: 2 of 3/, 'a missing piece is named, never guessed');
  assert.match(reassemble([s.shards[0], s.shards[0], s.shards[1]]).why, /duplicate shard 0/);
  const alien = { i: 2, k: 3, n: 'zzz' };
  assert.match(reassemble([s.shards[0], s.shards[1], alien]).why, /shard 2/);
  const otherSplit = { ...s.shards[2], k: 4 };
  assert.match(reassemble([s.shards[0], s.shards[1], otherSplit]).why, /malformed or from a different split/);
  assert.match(reassemble([]).why, /non-empty/);
  assert.match(reassemble('x').why, /non-empty/);
  // each malformation ALONE is named — and the index boundary i === k is out of range, exactly
  assert.match(reassemble([{ i: 0, k: 0, n: '1' }]).why, /no valid k/, 'k below 1');
  assert.match(reassemble([{ i: 0, k: 'x', n: '1' }]).why, /no valid k/, 'k not an integer');
  const two = shard(fold([1, 2, 3, 4]).n, 2).shards;
  assert.match(reassemble([two[0], { ...two[1], i: 2 }]).why, /malformed or from a different split/, 'i === k is off the end');
  assert.match(reassemble([two[0], { ...two[1], i: -1 }]).why, /malformed or from a different split/);
  assert.match(reassemble([two[0], { ...two[1], i: 1.5 }]).why, /malformed or from a different split/);
  assert.match(reassemble([two[0], null]).why, /malformed or from a different split/);
  // stripes inconsistent by exactly one digit: refuse by name, never push a hole through fold
  const gutted = [two[0], { ...two[1], n: '1' }];
  assert.match(reassemble(gutted).why, /inconsistent/, 'a stripe short by one is named, not guessed');
});

test('PLACE — deterministic golden-angle placement; spread, not clustered', () => {
  const nodes = ['n0', 'n1', 'n2', 'n3', 'n4'];
  const p0 = place(0, nodes);
  assert.deepEqual([p0.node, p0.theta], ['n0', 0], 'shard 0 sits at angle 0');
  assert.equal(place(1, nodes).node, place(1, nodes).node, 'same input, same node, always');
  // golden-angle spread: 5 consecutive shards over 5 nodes never pile onto one node badly
  const counts = {};
  for (let i = 0; i < 25; i++) { const n = place(i, nodes).node; counts[n] = (counts[n] || 0) + 1; }
  for (const n of nodes) assert.ok(counts[n] >= 3 && counts[n] <= 7, `${n} holds ${counts[n]} of 25 — golden spread keeps every node in [3,7]`);
  assert.match(place(-1, nodes).why, /non-negative/);
  assert.match(place(0, []).why, /non-empty list of names/);
  assert.match(place(0, ['a', '']).why, /non-empty list of names/);
});

test('THE FUZZ — 200 random states: fold→shard→reassemble→unfold is the identity, for any k', () => {
  let seed = 1234;
  const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
  for (let t = 0; t < 200; t++) {
    const len = Math.floor(rnd() * 20);
    const state = Array.from({ length: len }, () => Math.floor(rnd() * 65536));
    const k = 1 + Math.floor(rnd() * 6);
    const f = fold(state);
    const s = shard(f.n, k);
    // shuffle the shards
    const mixed = [...s.shards].sort(() => rnd() - 0.5);
    const r = reassemble(mixed);
    assert.ok(r.ok, 'reassembly holds');
    assert.equal(r.n, f.n, 'the number that comes back is the number that left');
    assert.deepEqual(unfold(r.n).state, state, 'and it is still the same state');
  }
  for (const junk of [null, 7, 'x', [null], [{ i: 0 }]]) {
    assert.equal(typeof reassemble(junk).ok, 'boolean', 'answers, never throws');
  }
});
