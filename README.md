# GCN — the Geometric Computation Network

**LIVE: https://sjgant80-hub.github.io/gcn-geometric-computation-network/**

> **DEFENSIVE PUBLICATION.** This document is published to establish prior art. Every mechanism
> described here is placed irrevocably in the public domain (CC0-1.0) so that no party may
> enclose it by patent. The first commit timestamp of this repository anchors the disclosure
> date. *Drafted with sididy, the estate's resident local mind, from Thomas Frumkin's Konomi
> geometric stack.*

## Abstract

A distributed computing fabric whose working state **is a number**. Machine state folds
losslessly to a single integer; the integer shards by digit-striping across a mesh; shards are
placed on nodes by the golden angle, which provably never clusters; and reassembly is exact,
order-free, and **loud about absence** — a missing shard is named, never interpolated. There
is no coordinator, no hash ring to rebalance, and nothing to disagree about: the state either
reassembles to the number that left, or the fabric says which piece is missing.

## 1) State as a number (`fold` / `unfold`)

A machine state (a list of integers in [0, 65535]) becomes one integer in base 65537 behind a
sentinel digit, so leading zeros and length survive. The round trip is exact for **every**
state — fuzz-proven over random states — and a state that is a number inherits arithmetic for
free: equality is `===`, a checksum is `mod p`, a signature signs one value. The full
research codec (primorial folds, entropic torus harmonics for stability under perturbation) is
the estate's [geometric-computer](https://github.com/sjgant80-hub/geometric-computer), gated;
this reference law is the distribution-grade core.

## 2) Sharding by digit-stripe (`shard` / `reassemble`)

Shard *i* of *k* takes digits *i, i+k, i+2k…* Each shard is itself a sentinel-guarded fold
carrying its own index, so:

- shards reassemble **in any order** — the index is aboard, not implied by position;
- an incomplete set refuses: `incomplete: 2 of 3 shards — the missing piece is not guessable`;
- a duplicate, an alien shard from a different split, and an index off the end (`i === k`) are
  each refused by name;
- the identity `fold → shard → reassemble → unfold` holds for every state and every k —
  the fuzz shuffles shard order and proves it 200 ways.

## 3) Placement by golden angle (`place`)

Shard *s* goes to the node at angle `s·(1−1/φ) mod 1` around the node ring. Deterministic, so
any node can compute any placement with zero coordination — and golden-angle sequences never
cluster, for any n ([golden-placer](https://github.com/sjgant80-hub/golden-placer), the
estate's provably-novel primitive, gated). Consistent hashing without virtual nodes and
without a rebalancing protocol.

## 4) Composition (why this is a computation network, not a storage trick)

With state-as-number as the invariant, the other disclosures in this family snap in: frames
of [MCTP](https://sjgant80-hub.github.io/mctp-multi-carrier-transport/) carry shards over
sound, radio, or light; the admission walls of
[chorus](https://github.com/sjgant80-hub/chorus) gate which node may submit which shard; the
lineage law of [proof-carrying-models](https://sjgant80-hub.github.io/proof-carrying-models/)
attests which fold a result came from. A mesh of small devices can hold, verify, and hand
around computations none of them could hold alone — with every hop refusable and every
absence named.

## What already runs (gated, live, today)

| organ | what it proves | gate |
|---|---|---|
| [`gcn.mjs`](gcn.mjs) (this repo) | fold, stripe-shard, golden placement, exact reassembly | 33/33 mutants killed |
| [geometric-computer](https://github.com/sjgant80-hub/geometric-computer) | the full v23 codec + torus harmonics | witness-gated |
| [golden-placer](https://github.com/sjgant80-hub/golden-placer) | never-clustering placement ∀n | witness-gated |
| [the-cam](https://github.com/sjgant80-hub/the-cam) | golden-angle content-addressable memory | witness-gated |
| [the-kg](https://github.com/sjgant80-hub/the-kg) / [the-rotor](https://github.com/sjgant80-hub/the-rotor) | typed traversal / Cl(3,0) rotors | witness-gated |

## What must catch up (the honest speculation)

- **BigInt at scale**: folding megabyte states into single integers is exact but not yet fast;
  hardware big-integer units or chunked folds are the road forward — chunking is disclosed here
  (shards ARE chunks), the silicon is not ours to build.
- **Erasure coding**: this reference law names a missing shard; it does not recover one.
  Parity shards compose naturally (a parity stripe is just another fold) but are future work.
- **Real-time geometric algebra**: the rotor layer at network scale is speculation measured
  in years.
- **What is NOT claimed**: no performance numbers against existing DHTs or erasure systems —
  the claim is the *composition*: lossless numeric state + stripe-sharding + golden placement
  + named absence, with no coordinator.

## Claims anticipated (the patent surface this blocks)

Any claim covering: representation of distributed machine state as a single arbitrary-
precision integer for transfer, checkpoint, or verification; digit-striped sharding of such
integers with per-shard sentinel integrity and order-free reassembly; refusal-with-naming of
missing or alien shards; golden-angle/irrational-rotation placement of shards or tasks across
compute nodes; or coordinator-free meshes composing these mechanisms. Prior art here, dated by
first commit.

## Run the reference law

```bash
node --test          # 5 suites: exact arithmetic, any-order reassembly, named absence, golden spread, the identity fuzz
```

The live page carries the same gated kernel inline: fold a state, shard it, lose a shard,
watch the fabric name it.

---

*Built on the Konomi architecture, created by **Thomas Frumkin** (konomi-systems.com). The estate builds WITH Konomi. Published CC0-1.0; see LICENSE.
Drafted with sididy, the estate's resident mind.*
