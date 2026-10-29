<!-- .slide: id="week-03" class="cover week" -->

<h1>Week 3</h1>
<p class="subtitle">Rotary Position Embeddings</p>

---

<p class="eyebrow">Su et al. and Kazemnejad</p>

## Two readings, one idea

<div style="display: grid">
  <div class="fragment fade-out" data-fragment-index="0" style="grid-area: 1 / 1"><div class="full"><img style="max-height:430px" src="img/week-03-readings-add.svg" alt="Bars for a word vector, plus bars for the position-3 vector, equal the vector the model sees"></div><p class="center"><b>Kazemnejad 2019: add a position vector to each word</b></p></div>
  <div class="fragment" data-fragment-index="0" style="grid-area: 1 / 1"><div class="full"><img style="max-height:430px" src="img/week-03-readings-rotate.svg" alt="One arrow turned a little further at positions 0, 1, 2 and 3"></div><p class="center"><b>Su et al. (RoPE): turn the vector by its position</b></p></div>
</div>

<p class="footnote">Kazemnejad, "Transformer Architecture: The Positional Encoding" (2019), on Vaswani et al. 2017; Su et al., RoFormer, arXiv:2104.09864 (2021), Neurocomputing 568 (2024)</p>

Note:
Two readings that tell one story, shown one at a time (press → to swap the picture).
First picture: the original Transformer (explained by the Kazemnejad blog) adds a fixed "position vector" to each word's vector before anything else happens. The model only ever sees the sum.
Second picture: RoPE doesn't add anything. It turns (rotates) the vector by an angle that grows with the position: position 0 not at all, position 1 a little, position 2 twice as much, and so on.
The rest of the deck follows RoFormer's own sections (next slide), with the sinusoidal reading placed where the paper discusses absolute position codes (§2.2).

---

<p class="eyebrow">Su et al., RoFormer: the paper's outline</p>

## Following the paper

<table class="rules steps overview">
  <tr><td>§1</td><td>Introduction</td><td>order matters</td></tr>
  <tr><td>§2</td><td>Background</td><td>attention; absolute positions</td></tr>
  <tr><td>§3.1–3.2</td><td>Proposed approach</td><td>the requirement; RoPE in 2-D and $d$-D</td></tr>
  <tr><td>§3.3</td><td>Properties</td><td>decay; linear attention</td></tr>
  <tr><td>§4</td><td>Experiments</td><td>translation, pretraining, GLUE, long text</td></tr>
  <tr><td>§5</td><td>Conclusions</td><td>claims vs evidence</td></tr>
  <tr class="total"><td>beyond</td><td>RoPE in 2026</td><td>stretching to long context</td></tr>
</table>

<p class="footnote">Su et al., arXiv:2104.09864. The sinusoidal reading (Kazemnejad 2019) sits inside §2.2, absolute position embedding. Each slide's tag shows its section</p>

Note:
The deck follows RoFormer's own section order, so you can read the paper alongside it. Each slide carries a small tag with the section it belongs to.
§1 motivates why order matters and why attention doesn't see it. §2 sets up attention (§2.1) and absolute codes added to the input (§2.2, where the Kazemnejad blog on sinusoids fits); the paper's §2.3 on relative methods is left to the notes of the requirement slide. §3 states the requirement (§3.1), builds RoPE in 2-D and then d dimensions (§3.2), and lists its properties (§3.3); the paper's §3.4 (derivation, efficient implementation, decay proof) is summarised in the notes rather than on slides. §4 reports the experiments; we pair each result with its caveat. §5 concludes; we check each claim against the evidence. A final section goes beyond the paper: how RoPE is stretched to long contexts today.

---

<p class="eyebrow">§2.1 Preliminary (needed first)</p>

## Attention in one picture

<div class="full"><img src="img/week-03-attention.svg" alt="Three words, the cat sat, each make a query, key and value vector; a 3 by 3 grid of weights from the softmax of query times key, each row summing to one; and the output for each word, a weighted sum of the values"></div>

<p class="center"><b>Each word mixes in the others, weighted by how well $q$ matches $k$</b></p>

<p class="gloss">$x$: a word's vector (a word or word piece is a <b>token</b>). $q = W_q x$: what it looks for; $k = W_k x$: what it offers; $v = W_v x$: what it passes on. $W$s are learned</p>

<p class="footnote">One attention layer with random weights on three tokens, computed by us; weights are softmax$(q \cdot k / \sqrt{d})$ per row</p>

Note:
Everything this week happens inside this computation, so it's worth having it in one picture.
Each word's vector x is multiplied by three learned matrices to make a query q, a key k and a value v.
For every pair of words, the score is q·k: how well what word A is looking for matches what word B offers. A softmax turns each row of scores into weights that sum to one (middle grid).
Each word's output is the weighted sum of all words' values (right). So "sat" can pull in information from "cat".
Notice what's missing, as the previous slide showed: nothing here says which word came first. Position codes enter through q and k, the score q·k is where position matters, and RoPE will change exactly how q and k are formed.

--

<p class="eyebrow">§2.1 Preliminary (needed first)</p>

## Shuffling the words only shuffles the sum

<div class="full"><img style="max-height:420px" src="img/week-03-softmax-order.svg" alt="For the word dog in dog bites man and in man bites dog: the three scores of dog against each word are the same numbers in a different order; softmax turns them into the same weight per word; the weighted sum of values gives exactly the same output for dog"></div>

<p class="center"><b>Same word pairs, same weights, same sum: order never enters</b></p>

<p class="gloss"><b>Softmax</b>: $w_j = e^{s_j} / \sum_k e^{s_k}$, turns scores into weights that sum to 1. Each weight depends on its own word pair, not on the slot it sits in</p>

<p class="footnote">Same tiny model as the next slide (random weights, $d$ = 6), computed by us; weights matched per word and outputs asserted equal</p>

Note:
This is the step between "what attention computes" and "why it needs positions".
Follow the word "dog". Its score against each word is q_dog · k_word: a number that depends only on which two words they are. In "dog bites man" the three scores come out in the order dog, bites, man; in "man bites dog" the very same three numbers come out in the order man, bites, dog. Nothing changed but the order.
Softmax turns each score into a weight (exponentiate, divide by the total), so each word gets the same weight in both sentences, just in a different slot.
The output for "dog" is the weighted sum of the words' values, and a sum doesn't care about order: weight(bites)·v(bites) + weight(man)·v(man) + … adds up to the same vector either way. So "dog" gets exactly the same output in both sentences. The next slide adds a position code and shows the weights split.

--

<p class="eyebrow">§1 Introduction</p>

## Add a position code and the weights split

<div class="full"><img style="max-height:420px" src="img/week-03-softmax-split.svg" alt="The same example as the previous slide, now with a position code added to each word. Dog's scores are no longer the same numbers reshuffled: in dog bites man, bites gets weight 0.90; in man bites dog, man gets 0.60 and bites 0.40. The output for dog differs between the sentences and from the no-position output"></div>

<p class="center"><b>Position enters the scores, so the same words now get different weights</b></p>

<p class="gloss">$x + p_t$: each word's vector plus a vector for its slot $t$ = 0, 1, 2 (how to build $p_t$: §2.2). "dog @ 0" = dog in slot 0</p>

<p class="footnote">Same tiny model as the previous slide ($d$ = 6, codes scaled ×3), computed by us. Without positions $\mathrm{Attn}(PX) = P\,\mathrm{Attn}(X)$: RoFormer §1</p>

Note:
The previous slide showed the symmetry: without positions, "dog" gives "bites" the same weight (0.98) whichever sentence it's in, so it gets the same output. Something has to break that symmetry, and that's what a position code does.
Add to each word's vector a vector p_t for the slot it sits in (slot 0, 1, 2). Now "dog in slot 0" and "dog in slot 2" are different inputs, so dog's query and every key change, and the three scores are no longer the same numbers reshuffled.
Follow it through the same steps: in "dog bites man", dog still puts most weight on "bites" (0.90). In "man bites dog", where dog sits last, the scores shift and dog now puts 0.60 on "man" and 0.40 on "bites". Different weights mean a different weighted sum: the output for "dog" (black) now differs between the sentences and from the no-position output (grey outline), so the next layer can tell who bit whom.
In symbols, without positions, reordering the inputs by a permutation P only reorders the outputs: Attn(PX) = P Attn(X). RNNs get order for free by reading one word at a time; a transformer needs it put in explicitly. The rest of the deck is about how to build p_t well: first by adding sinusoids (§2.2), then by rotating (RoPE, §3).
One nuance for decoders: a causal mask (each word only sees earlier words) also breaks the symmetry, and decoders without any position code still learn some order (Haviv et al. 2022, arXiv:2203.16634).

---

<p class="eyebrow">§2.2 Absolute position embedding</p>

## What should a position code do?

<table class="rules steps overview">
  <tr><td></td><td>condition</td><td>if it fails</td></tr>
  <tr><td>1</td><td>unique</td><td>two positions look the same</td></tr>
  <tr><td>2</td><td>bounded</td><td>position drowns the word</td></tr>
  <tr><td>3</td><td>same gap, same meaning</td><td>"one word back" changes with length</td></tr>
  <tr><td>4</td><td>works past training</td><td>long inputs: values never seen</td></tr>
  <tr class="total"><td>5</td><td>computed, not looked up</td><td>no code beyond the table</td></tr>
</table>

<p class="footnote">Conditions from Kazemnejad 2019; one slide each below, then the candidates scored (press ↓)</p>

Note:
Now we know a position code is needed: something added to each word's vector that depends on its slot t. But not any function of t will do. The blog lists what a good one needs, and each slide below shows one condition and why it matters, using the simple candidates you'd try first: the raw number t, t divided by the sentence length N, a learned table (BERT, GPT-2), one sine wave, and many sine waves. The last slide scores them all.

--

<p class="eyebrow">§2.2 Absolute position embedding · Kazemnejad 2019</p>

## Unique: every position its own code

<div class="full"><img style="max-height:400px" src="img/week-03-cond-unique.svg" alt="A fast sine wave that repeats every 8 positions gives exactly the same value at positions 1 and 9; a slow wave gives clearly different values at 1 and 9"></div>

<p class="center"><b>One wave repeats; add a slower wave and positions 1 and 9 differ</b></p>

<p class="footnote">Periods 8 and 64, drawn by us. Raw $t$, $t/N$ and a learned table are unique; a single sine is not</p>

Note:
If two positions get the same code, the model can't tell them apart, which for those two positions is as bad as having no position code at all.
Raw t and t/N give every position a different number, and a learned table gives each its own row, so all three are unique. A single sine wave is not: it repeats. Top: a wave with period 8 has exactly the same value at positions 1 and 9. Bottom: a slower wave (period 64) has clearly different values there. Using several waves at different speeds together, like the bits of a binary counter, makes every position distinct over a very long range. That's the sinusoidal code's answer.

--

<p class="eyebrow">§2.2 Absolute position embedding · Kazemnejad 2019</p>

## Bounded: the code mustn't drown the word

<div class="full"><img style="max-height:400px" src="img/week-03-cond-bounded.svg" alt="Bars on a log scale: with position equal to t, the position value is 5, 50 and 500 at t = 5, 50 and 500, far above a word value of about 1; with position equal to sin of t, the position value never exceeds 1"></div>

<p class="center"><b>Added to the word, $t$ = 500 swamps it; a sine never passes 1</b></p>

<p class="footnote">Word value ≈ 1 is a typical embedding entry; drawn by us. $t$ fails; $t/N$, a learned table and sines are bounded</p>

Note:
The position code is added to the word's vector, so their sizes must be comparable. A word vector's entries are around ±1. If the code is the raw position t, then at t = 500 every entry gets +500 and the word's own information becomes a rounding error: the model would see mostly "position", hardly "which word". Large inputs also make training unstable.
A sine is always between −1 and 1, so the word stays readable at any position. t/N is between 0 and 1, and a learned table is trained to sensible sizes, so they pass too.

--

<p class="eyebrow">§2.2 Absolute position embedding · Kazemnejad 2019</p>

## Same gap, same meaning

<div class="full"><img style="max-height:400px" src="img/week-03-cond-gap.svg" alt="Left: t divided by N rises from 0 to 1 in 10 steps of 0.1 for N = 10, and in 50 steps of 0.02 for N = 50. Right: a sine has exactly the same values at the same positions whether the sentence has 10 or 50 words"></div>

<p class="center"><b>With $t/N$ one step is 0.1 or 0.02; a sine's step never changes</b></p>

<p class="footnote">Drawn by us. $t/N$ fails; raw $t$ and sines pass; a learned table has no built-in notion of a gap</p>

Note:
Many patterns in language are about relative position: "the word just before me", "two words back". For the model to learn such a pattern once and reuse it, a gap of 1 should look the same in every sentence.
Divide by the sentence length and it doesn't: one step is 0.1 in a 10-word sentence and 0.02 in a 50-word one (left), so "one word back" is a different number in every sentence length.
A sine depends only on t, so the values (and the step between neighbours) are identical whatever the length (right; the open circles for N = 50 sit exactly on the N = 10 curve). Raw t also passes this test. A learned table has no built-in notion of a gap: each row is learned separately.

--

<p class="eyebrow">§2.2 Absolute position embedding · Kazemnejad 2019</p>

## Works past the training length

<div class="full"><img style="max-height:400px" src="img/week-03-cond-length.svg" alt="Three panels with the region past the training length of 50 shaded: raw t keeps growing into values never seen in training; a learned table has no entries past 50; a sine keeps cycling through the same range it had in training"></div>

<p class="center"><b>Raw $t$ goes somewhere new, a table runs out, a sine stays familiar</b></p>

<p class="footnote">Training length 50, drawn by us. $t$ and a learned table fail; sines pass (the full code repeats only after very long ranges)</p>

Note:
At test time a text can be longer than anything seen in training. The shaded region is past the training length (50 here).
Raw t keeps growing: at position 80 the model sees values it never saw in training, so it has no idea what they mean. A learned table (BERT, GPT-2) simply has no row past its maximum length; the code doesn't exist. A sine keeps cycling through the same range of values it showed in training, so every input still looks familiar.
That's also why the code should be computed from a formula, not looked up: a formula is defined for every position.

--

<p class="eyebrow">§2.2 Absolute position embedding · Kazemnejad 2019</p>

## Which code passes?

<div class="full short"><img src="img/week-03-naive-codes.svg" alt="Three candidate codes over positions 0 to 100: the raw index t grows without bound; t over N rises with a step size that depends on N; a sine stays between minus one and one"></div>

<table class="rules marks">
  <tr><td></td><td>unique</td><td>bounded</td><td>same gap</td><td>past training</td><td>computed</td></tr>
  <tr><td>$t$</td><td>✓</td><td>✗</td><td>✓</td><td>✗</td><td>✓</td></tr>
  <tr><td>$t/N$</td><td>✓</td><td>✓</td><td>✗</td><td>✓</td><td>✓</td></tr>
  <tr><td>learned table</td><td>✓</td><td>✓</td><td>✗</td><td>✗</td><td>✗</td></tr>
  <tr><td>one sine</td><td>✗</td><td>✓</td><td>✓</td><td>✓</td><td>✓</td></tr>
  <tr class="total"><td>many sines</td><td>✓</td><td>✓</td><td>✓</td><td>✓</td><td>✓</td></tr>
</table>

<p class="footnote">Candidates and criteria after Kazemnejad 2019; learned tables as in BERT and GPT-2 (RoFormer §2.2); marks are our summary of the four slides above</p>

Note:
The scorecard. Raw t is unique and keeps gaps, but it's unbounded and meets unseen values past training. t/N is bounded and defined everywhere, but a gap means something different in every sentence length. A learned table works within its length but has no notion of a gap and stops at the last row. One sine passes everything except uniqueness, because it repeats.
Many sines at geometrically spaced speeds fix that last gap: together they're unique over a huge range, like the bits of a binary counter. That's the sinusoidal code, built on the next slides.

--

<p class="eyebrow">§2.2 Absolute position embedding · Kazemnejad 2019</p>

## From binary counting to sinusoids

<div class="two-col">
  <table class="rules marks">
    <tr><td>$t$</td><td>bit 2</td><td>bit 1</td><td>bit 0</td></tr>
    <tr><td>0</td><td>0</td><td>0</td><td>0</td></tr>
    <tr><td>1</td><td>0</td><td>0</td><td>1</td></tr>
    <tr><td>2</td><td>0</td><td>1</td><td>0</td></tr>
    <tr><td>3</td><td>0</td><td>1</td><td>1</td></tr>
    <tr><td>4</td><td>1</td><td>0</td><td>0</td></tr>
    <tr><td>5</td><td>1</td><td>0</td><td>1</td></tr>
  </table>
  <div><img src="img/week-03-bits-waves.svg" alt="Bits 0, 1 and 2 of the position drawn as square waves over positions 0 to 15, flipping every 1, 2 and 4 steps, each with a smooth wave of the same period drawn on top"></div>
</div>

<p class="center"><b>A sinusoid is a smooth bit: fast ones for fine position, slow ones for coarse</b></p>

<p class="footnote">Binary analogy from Kazemnejad 2019; waves drawn by us with periods 2, 4, 8</p>

Note:
Write the position in binary (left). Bit 0 flips every step, bit 1 every two steps, bit 2 every four. Read across a row and you get a unique pattern for each position: fast bits pin down fine position, slow bits coarse position.
On the right each bit is drawn as a square wave over positions 0–15 (grey). Draw a smooth wave with the same period on top (black): that's the idea behind the sinusoidal code. Smooth waves are friendlier to a neural network than 0/1 jumps.
The real code uses sines and cosines whose speeds fall geometrically, not exactly halving, but the picture is the same: many waves, from fast to slow.

--

<p class="eyebrow">§2.2 Absolute position embedding · Kazemnejad 2019</p>

## The sinusoidal code

<div class="two-col">
  <div class="big-math line small">$$\begin{gathered} p_t[2i] = \sin(\omega_i t) \\ p_t[2i{+}1] = \cos(\omega_i t) \\ \omega_i = 10000^{-2i/d} \end{gathered}$$</div>
  <div><img src="img/week-03-pe-heatmap.svg" alt="Heatmap of the 128-dimensional sinusoidal position code for positions 0 to 49: the left dimensions oscillate quickly down the positions, the right dimensions barely change"></div>
</div>

<p class="gloss">$t$: position. $i$: which sin/cos pair, 0 to $d/2-1$. $d$: vector length (128 here). $\omega_i$: pair $i$'s speed, fastest first</p>

<p class="footnote">Formula from Kazemnejad 2019 (Vaswani et al. 2017); heatmap: $d$ = 128, positions 0–49, computed by us</p>

Note:
The actual code: for each pair i there is one speed ω_i; coordinate 2i holds sin(ω_i t) and coordinate 2i+1 holds cos(ω_i t). Pair 0 turns 1 radian per position (a full wave every 2π ≈ 6.3 positions); each later pair is slower, down to a wave every 10000·2π ≈ 62,800 positions.
In the heatmap each row is one position's 128 numbers. Left columns (fast pairs) change quickly from row to row; right columns (slow pairs) barely change over 50 positions.
This row is added to the word's vector before the first layer.

--

<p class="eyebrow">§2.2 Absolute position embedding · Kazemnejad 2019</p>

## An offset is a rotation

<div class="two-col">
  <div><img src="img/week-03-pair-circle.svg" alt="One sin and cos pair drawn as a point on a circle for positions 0 to 10; moving from position 1 to 4 and from 6 to 9 turns the point by the same arc"></div>
  <div><img src="img/week-03-pe-dot.svg" alt="Dot product between the position codes of two positions as a function of their offset: 64 at offset zero, falling quickly and oscillating near a lower level, symmetric in the offset"></div>
</div>

<p class="center"><b>Moving 3 positions turns each pair the same angle, wherever you start</b></p>

<p class="gloss">Left: one pair $(\cos\omega t, \sin\omega t)$ as a point on a circle. Right: $p_t \cdot p_{t+\Delta}$, where $\Delta$ is the gap between two positions</p>

<p class="footnote">Shift = a 2×2 rotation with no $t$ in it (Kazemnejad 2019, angle-addition formulas). Right panel: $d$ = 128, checked at $t$ = 0, 37, 120</p>

Note:
Why both sine and cosine? Take one pair (cos ωt, sin ωt). As t grows, that pair moves around a circle: it's a point turning at speed ω (left).
Going from position 1 to 4 turns it by 3ω; going from 6 to 9 turns it by the same 3ω. A shift by Δ positions is a turn by ωΔ, the same turn wherever you start. As a formula that turn is the 2×2 rotation matrix M_Δ = [[cos ωΔ, sin ωΔ], [−sin ωΔ, cos ωΔ]] acting on (sin ωt, cos ωt), which has no t in it. With only a sine you'd have half a circle's information and no such rule.
Right: the dot product of two whole position vectors, p_t · p_{t+Δ} = Σ_i cos(ω_i Δ), depends only on the gap Δ. It's 64 at Δ = 0 (64 pairs, each cos 0 = 1), falls off, and is the same curve whatever t you start from.
Keep this in mind: "a shift is a rotation" and "only the gap matters" is exactly what RoPE builds in directly.

---

<p class="eyebrow">§3 Proposed approach</p>

## RoPE (Su et al. 2021)

<div class="two-col">
  <table class="rules roles opener">
    <tr><td>problem</td><td>score depends on place, not gap</td></tr>
    <tr><td>goal</td><td>score from gap $m - n$ only</td></tr>
    <tr><td>idea</td><td>rotation of $q$, $k$ by position</td></tr>
    <tr><td>trained</td><td>nothing (fixed angles)</td></tr>
    <tr><td>cost</td><td>elementwise ops on $q$, $k$</td></tr>
    <tr><td>results</td><td>small gains, faster pretraining</td></tr>
    <tr class="total"><td>today</td><td>Llama 3, Qwen3</td></tr>
  </table>
  <div><img src="img/week-03-rope-2d.svg" alt="RoPE in two dimensions: the query is rotated by two steps of theta, the key by five steps, and the attention score depends only on the three-step gap between them"></div>
</div>

<p class="footnote">RoFormer §3.1–3.2 (arXiv:2104.09864); Llama 3 and Qwen3 bases in "RoPE in 2026". rows explained on the slides that follow; cost: two elementwise multiplies per vector (RoFormer §3.4.2)</p>

Note:
A recap of RoPE in one table; each row gets its own slide.
Problem: with added position codes, the score q·k mixes word and position, so the same two words score differently at different places (left map on the next slide), and additive codes don't fit linear attention.
Goal: find a way to put position into q and k so that their dot product depends on the two words and the gap m − n only.
Idea: rotate the query by an angle proportional to its position m, the key by an angle proportional to n (right: q at position 2, k at position 5). The angle between them then carries the gap.
Trained: nothing. The angles come from a formula. Values v are not rotated.
Cost: a couple of elementwise multiplies on q and k in every layer.
Results: modest gains (BLEU 27.3 → 27.5), faster masked-LM pretraining, better on long Chinese legal documents.
Today: the default position method in open LLMs (Llama 3, Qwen3 and others).

--

<p class="eyebrow">§3.1 Formulation</p>

## The requirement

<div class="big-math line">$$\langle f_q(x_m, m),\ f_k(x_n, n)\rangle = g(x_m, x_n, m - n)$$</div>

<div class="full short"><img src="img/week-03-score-maps.svg" alt="Position part of the attention score over all query and key positions: with added sinusoids it has no regular pattern; the wanted picture, on the right, is constant along every diagonal"></div>

<p class="center"><b>Wanted: a score that depends on the two words and their gap only (right)</b></p>

<p class="gloss">$f_q, f_k$: how position $m$ (or $n$) is put into the query (or key). $g$: some function of the words and the gap $m - n$</p>

<p class="footnote">RoFormer §3.1, eq. 11. Maps computed by us; the right panel is what RoPE produces (constant along every diagonal)</p>

Note:
RoFormer starts from a requirement, not a design. Find functions f_q and f_k that put the position into the query and key such that their dot product depends only on the two words and the gap m − n, never on where in the text they sit.
In pictures: over all query positions m (rows) and key positions n (columns), the position part of the score should be constant along every diagonal, because a diagonal is a fixed gap. Added sinusoids (left) don't do that: once the code p is added to the word vector x and both pass through W_q and W_k, the score picks up word × position cross terms and the gap no longer decides it alone. Relative methods before RoPE (Shaw et al., Transformer-XL, T5, DeBERTa; RoFormer §2.3) patch this by adding gap-dependent terms to the score. The right panel is the target, and it's what RoPE delivers by multiplying instead.
The rest of §3 finds such an f: a rotation.

--

<p class="eyebrow">§3.2.1 A 2D case</p>

## RoPE in two dimensions

<div class="two-col">
  <div>
    <div class="big-math line">$$f(x, m) = (W x)\,e^{i m \theta}$$</div>
    <table class="rules roles">
      <tr><td>$q, k$</td><td>$(1, 0.4)$, $(0.7, -0.5)$; $\theta$ = 30°</td></tr>
      <tr><td>positions 2, 5</td><td>score 0.780</td></tr>
      <tr class="total"><td>positions 12, 15</td><td>score 0.780: same gap, same score</td></tr>
    </table>
  </div>
  <div><img src="img/week-03-rope-shift.svg" alt="The same query and key rotated for positions 2 and 5, and again for positions 12 and 15: both hands have moved, but the angle between them, and the score 0.780, are the same"></div>
</div>

<p class="gloss">Read a 2-D vector as a complex number; multiplying by $e^{im\theta}$ rotates it by the angle $m\theta$. The unrotated $q \cdot k$ is 0.500</p>

<p class="footnote">RoFormer eq. 12–13; worked numbers computed and checked by us (shifts of 1, 3, 10 and 1,000 give the same score)</p>

Note:
Take d = 2 so each vector is a point in the plane, or a complex number. RoPE multiplies the projected query W_q x by e^{imθ}: a rotation by m·θ. Same for the key at position n.
Worked example with θ = 30°: q = (1, 0.4) at position 2 is rotated 60° to (0.154, 1.066); k = (0.7, −0.5) at position 5 is rotated 150° to (−0.356, 0.783). Their dot product is 0.780.
The figure shows exactly this: at positions 2 and 5 and again at 12 and 15, both hands have turned but the angle between them is the same. Now move both tokens 10 positions later: both rotate 300° more, the angle between them is unchanged, and the score is still 0.780. Only the offset n − m = 3 matters, here as an extra 90° between them.
Rotation keeps lengths, so the position never changes how strong a query or key is, only its direction.


--

<p class="eyebrow">§3.2.1 A 2D case</p>

## The 2-D rotation, as a matrix

<div class="two-col">
  <div class="big-math line small" style="font-size:0.72em">$$\begin{gathered}
  R(m\theta) = \begin{pmatrix}\cos m\theta & -\sin m\theta\\ \sin m\theta & \cos m\theta\end{pmatrix} \\[0.6em]
  \underbrace{\begin{pmatrix}0.50 & -0.87\\ 0.87 & 0.50\end{pmatrix}}_{R(60°):\ q \text{ at } m = 2}\begin{pmatrix}1\\ 0.4\end{pmatrix} = \begin{pmatrix}0.154\\ 1.066\end{pmatrix} \\[0.6em]
  \underbrace{\begin{pmatrix}-0.87 & -0.50\\ 0.50 & -0.87\end{pmatrix}}_{R(150°):\ k \text{ at } n = 5}\begin{pmatrix}0.7\\ -0.5\end{pmatrix} = \begin{pmatrix}-0.356\\ 0.783\end{pmatrix}
  \end{gathered}$$</div>
  <div><img style="width:100%" src="img/week-03-rot-matrix.svg" alt="The x and y axes turned by 60 degrees: the first column of the rotation matrix, cos 60 and sin 60, is where the x-axis lands; the second column, minus sin 60 and cos 60, is where the y-axis lands; q equal to 1, 0.4 turns with them to 0.154, 1.066"></div>
</div>

<p class="center"><b>The matrix's columns are where the axes land; $q$ turns with them</b></p>

<p class="gloss">$q = W_q x$ first, then turned: $f_q(x_m, m) = R(m\theta)\,W_q x_m$. Same $q$, $k$ and $\theta$ = 30° as the previous slide</p>

<p class="footnote">RoFormer eq. 13 (matrix form of eq. 12); entries rounded to 2 decimals, products checked by us</p>

Note:
The previous slide wrote the turn as a complex number, e^{imθ}. Here is the same turn as an ordinary 2×2 matrix, which is how the paper writes it in eq. 13 and how it's generalised to d dimensions next.
The matrix R(mθ) has cos and sin of the angle mθ. Its first column (cos, sin) is where the x-axis lands after turning by mθ; its second column (−sin, cos) is where the y-axis lands (right: turning by 60°). Multiplying a vector by R turns the whole plane, so the vector turns with the axes and keeps its length.
Worked: the query q = (1, 0.4) at position m = 2 with θ = 30° is turned by 60°: R(60°) = [[0.50, −0.87], [0.87, 0.50]], and R(60°)·(1, 0.4) = (0.5·1 − 0.87·0.4, 0.87·1 + 0.5·0.4) = (0.154, 1.066). The key k = (0.7, −0.5) at position n = 5 is turned by 150°: R(150°)·(0.7, −0.5) = (−0.356, 0.783). Their dot product is 0.780, as before.
Order of operations: the word vector x is first projected (q = W_q x), then turned by its position. The projection W_q is learned; the turn R(mθ) is fixed.

--

<p class="eyebrow">§3.2.1 A 2D case</p>

## Why only the offset survives

<div class="big-math line">$$(R_m q)^\top (R_n k) = q^\top R_{n-m}\, k$$</div>

<div class="full"><img style="max-height:330px" src="img/week-03-turn-equiv.svg" alt="Left: q turned by 60 degrees and k by 150 degrees. Right: q left alone and k turned by 90 degrees, the gap. The angle between the arrows and the score, 0.780, are the same in both"></div>

<p class="center"><b>Turning both is the same as turning only $k$, by the gap</b></p>

<p class="gloss">$R_m$: turn by $m\theta$. Undo $q$'s turn ($R_m^\top$) and apply $k$'s ($R_n$): one turn by $(n-m)\theta$. Here $m$ = 2, $n$ = 5, $\theta$ = 30°</p>

<p class="footnote">RoFormer eq. 16 (which drops a subscript and a transpose: $x_m^\top W_q^\top$); complex form eq. 12: $\mathrm{Re}[q\,\bar k\, e^{i(m-n)\theta}]$. Same numbers as the 2-D slide, checked by us</p>

Note:
Why does only the gap n − m survive? Left: the 2-D example from the previous slide, q turned by 2θ = 60° and k by 5θ = 150°. The score depends only on the lengths of the arrows and the angle between them.
Right: undo q's turn, which turns k back by 60° as well. Now q sits in its original place and k is turned by only 150° − 60° = 90°, that is (5 − 2)θ, the gap. The angle between the arrows, and so the score 0.780, hasn't changed.
In symbols: (R_m q)·(R_n k) = q·(R_m^T R_n k), and undoing a turn by mθ then turning by nθ is a single turn by (n − m)θ: R_m^T R_n = R_{n−m}. The positions m and n only ever appear as their difference.
In complex numbers the same step is e^{imθ}·conj(e^{inθ}) = e^{i(m−n)θ}.

--

<p class="eyebrow">§3.2.1 A 2D case</p>

## Slide the pair along the text

<div class="full"><img style="max-height:400px" src="img/week-03-slide-along.svg" alt="Score between two words that are always 3 positions apart, as the pair slides from position 0 to 200: with RoPE the score is a flat line; with added sinusoids it wobbles with the position"></div>

<p class="center"><b>Keep the gap at 3, move the pair: RoPE's score never changes</b></p>

<p class="gloss">"+3": the two words are always 3 apart, the first at position $m$, the second at $m + 3$. $m$ runs from 0 to 200</p>

<p class="footnote">$d$ = 32, random word vectors and projections, computed by us; the RoPE line is flat to $10^{-9}$</p>

Note:
The same fact as an experiment. Take two fixed words and keep them exactly 3 positions apart: the first at position m, the second at m + 3. Now slide the pair through the text, m = 0, 1, 2, … 200, and compute their score each time.
With RoPE (black) the score is the same at every m: only the gap of 3 enters, and it never changes. With added sinusoids (grey) the score wobbles as the pair moves, because the absolute positions leak into the score: adding p to x makes cross terms between word and position. That's the property the requirement (§3.1) asked for, now delivered.

--

<p class="eyebrow">§3.2.2 General form</p>

## In $d$ dimensions: $d/2$ clocks

<div class="two-col">
  <div><img src="img/week-03-rope-blocks.svg" alt="The 8 by 8 RoPE matrix at position 3: four 2 by 2 rotation blocks on the diagonal with their cosine and sine values, zeros everywhere else; the blocks rotate by 3, 0.3, 0.03 and 0.003 radians"></div>
  <div><img src="img/week-03-rope-clocks.svg" alt="A grid of clock faces: rows are positions 0, 1, 2, 10 and 100, columns are the four pairs; the hand of pair 1 swings round quickly from row to row, pair 4's hand barely moves even at position 100"></div>
</div>

<p class="gloss">One $q$'s $d$ numbers, cut into $d/2$ pairs of neighbouring dimensions, each turned on its own by $m\theta_i$. Here $d$ = 8</p>

<p class="footnote">RoFormer eq. 14–15: $R_m = \mathrm{diag}(R(m\theta_1), \dots, R(m\theta_{d/2}))$, $\theta_i = 10000^{-2(i-1)/d}$. Matrix shown at $m$ = 3; numbers computed by us</p>

Note:
Why d/2: a rotation always happens in a plane, two coordinates at a time. So RoPE splits the d coordinates of q (and k) into d/2 non-overlapping pairs, (x1, x2), (x3, x4), …, and rotates each pair in its own plane. The full rotation matrix is block diagonal: one 2×2 rotation per pair, zeros elsewhere (left, at position 3).
Each pair is a clock hand. Its angle is the position times that pair's speed θ_i. On the right, d = 8 with speeds 1, 0.1, 0.01, 0.001 radians per token: pair 1's hand swings round every few tokens; pair 4's hand has moved only 0.1 radians by position 100.
Because the dot product is a sum over pairs, the 2-D argument from before holds pair by pair: each pair contributes a term that depends only on the offset, so the total does too.


--

<p class="eyebrow">§3.2.2 General form</p>

## How $R_m$ turns $q$ and $k$

<div class="full"><img style="max-height:440px" src="img/week-03-rope-pairs.svg" alt="An 8-number query split into four pairs, each drawn as a 2-D arrow: at position 2 each pair is turned by 2 times its speed (1, 0.1, 0.01, 0.001 radians), the key's pairs by 5 times. Each pair's dot product is shown, and their sum is the score; at positions 12 and 15 the four numbers are the same"></div>

<p class="center"><b>Four separate 2-D turns; the score adds up four gap-only parts</b></p>

<p class="gloss"><b>Pair</b>: two neighbouring numbers of the <i>same</i> vector, $(q_1, q_2)$, $(q_3, q_4)$, … — not two different vectors. Pair $i$ of $q$ only meets pair $i$ of $k$</p>

<p class="footnote">$d$ = 8, random $q, k$, speeds $\theta_i$ = 1, 0.1, 0.01, 0.001; dashed: before turning. Computed by us; shifting both positions by 10 leaves every pair's part unchanged</p>

Note:
What RoPE is trying to do in d dimensions is exactly what it did in 2-D: make the score q·k depend only on the gap between the two positions. In 2-D that was easy: turn q by mθ and k by nθ, and the angle between them changes by (n − m)θ.
A 128-number vector has no single plane to turn in, so RoPE cuts it into pairs: (q1, q2), (q3, q4), … Each pair is treated as its own little 2-D arrow and turned in its own plane by its own angle: m·θ_i for the query at position m, n·θ_i for the key at position n. Here d = 8, so four pairs with speeds 1, 0.1, 0.01 and 0.001 radians per position. The fast pair 1 turns a lot (2 rad for q, 5 rad for k), pair 4 barely moves.
The big d × d matrix R_m is nothing more than these four 2×2 turns written side by side on the diagonal (previous slide), with zeros elsewhere: pairs never mix, and lengths never change.
Why this keeps "only the gap matters": a dot product adds up coordinate by coordinate, so q·k = (pair 1 · pair 1) + (pair 2 · pair 2) + … Each term is a 2-D dot product, and by the 2-D argument it depends only on n − m. So the sum does too. Bottom row: the four parts and their sum; move both words 10 positions later and you get the same four numbers.

--

<p class="eyebrow">§3.2.2 General form</p>

## Why many speeds?

<div class="full"><img style="max-height:440px" src="img/week-03-rope-alias.svg" alt="Two positions, 0 and 44, on a fast clock and a slow clock: the fast clock's hand points the same way at both positions, the slow clock's hands point in clearly different directions"></div>

<p class="center"><b>One fast hand repeats; add a slow hand and positions stay distinct</b></p>

<p class="footnote">44 rad = 7 full turns + 0.018 rad: the speed-1 hand is at 0° and 1°, the speed-0.1 hand at 0° and 252°. Computed by us</p>

Note:
Why not one speed for every pair? Because a single clock repeats. A hand turning 1 radian per token comes back to almost the same place every 2π ≈ 6.3 tokens; positions 0 and 44 differ by 7 full turns plus 0.018 radians, so that hand can't tell them apart.
Add a slower hand (0.1 radian per token): at position 44 it is at 252°, far from 0°. Fast hands resolve nearby positions; slow hands resolve far-apart ones, like the units and thousands digits of a counter, or the fast and slow bits of the binary table earlier.
Geometrically spaced speeds (each pair slower by the same factor) cover every scale from a few tokens to tens of thousands.

--

<p class="eyebrow">§3.2.2 General form</p>

## How slow are the slow clocks?

<div class="two-col">
  <table class="rules roles">
    <tr><td></td><td>tokens per full turn</td></tr>
    <tr><td>pair 1</td><td>6.3</td></tr>
    <tr><td>pair 64, base $10^4$</td><td>54,410</td></tr>
    <tr><td>pair 64, base $10^6$</td><td>5,063,256</td></tr>
    <tr><td></td><td>pairs never turning once</td></tr>
    <tr><td>base $10^4$, 512 tokens</td><td>33 of 64</td></tr>
    <tr class="total"><td>base $10^6$, 40,960 tokens</td><td>23 of 64</td></tr>
  </table>
  <div><img src="img/week-03-wavelengths.svg" alt="Wavelength of each of the 64 rotation pairs in a 128-dimensional head, on a log scale: from 6.3 tokens for the first pair up to 54 thousand tokens with base ten thousand and 5 million tokens with base one million; dashed lines mark 512 and 40,960 tokens"></div>
</div>

<p class="center"><b>Slow pairs barely turn in context: nearly position-free</b></p>

<p class="gloss"><b>Base</b>: the 10,000 in $\theta_i = 10000^{-2(i-1)/d}$. <b>Head</b>: one of the parallel attention units; each rotates its own 128 numbers</p>

<p class="footnote">Wavelength $2\pi/\theta_i$, head dimension 128; base $10^4$ = RoFormer, $10^6$ = Qwen3 config. RoFormer §3.3 writes $\theta_i = 10000^{-2i/d}$ (index shift vs eq. 15)</p>

Note:
A real head has d = 128, so 64 clocks. The first turns 1 radian per token (a full circle every 6.3 tokens); with base 10,000 the last needs 54,410 tokens for one turn.
With base 10,000, 33 of the 64 pairs never complete a turn within 512 tokens, RoFormer's pretraining length. They hardly rotate in context, so they act almost like position-free channels the model can use for content.
Qwen3 raises the base to 1,000,000: then 23 of 64 pairs never complete a turn even within its 40,960-token context.

---

<p class="eyebrow">§3.3 Properties of RoPE</p>

## Long-term decay

<div class="full"><img src="img/week-03-decay-chain.svg" alt="The score drawn as a chain of 64 unit arrows, one per pair: at distance 0 they line up in a straight line of length 64; at distance 10 the chain bends; at distance 100 the fast part curls into a knot while the slow pairs still point straight, so the total is about half"></div>

<p class="center"><b>Far apart, fast pairs cancel; slow pairs keep adding</b></p>

<p class="gloss">Each small arrow: one pair's contribution, turned by distance × $\theta_i$. Black arrow: their sum, whose length along the axis is the score</p>

<p class="footnote">RoFormer §3.4.3. Drawn by us for $d$ = 128 and an aligned query and key ($q = k$ = all ones, score halved)</p>

Note:
The paper's "long-term decay" in one picture. The RoPE score is a sum over the 64 pairs. Each pair contributes a little arrow (a complex number) turned by the distance times that pair's speed θ_i. Lay the arrows tip to tail.
At distance 0 nothing is turned: all 64 arrows line up and the score is as big as it gets (64 here).
At distance 10 the fast pairs have turned a lot and the chain bends.
At distance 100 the fast pairs' arrows point in every direction and curl into a knot that adds almost nothing, but the slow pairs have barely turned and still line up: the score drops from 64 to about 30 and then levels off (42.8 at 10, 30.5 at 100). That's the decay: the fast pairs cancel for far-apart tokens, when the query and key point the same way. The slow pairs never cancel within the context, which is the plateau in the earlier dot-product plot and why they act like position-free channels.
Why "when the query and key point the same way" matters: what the paper proves (§3.4.3) is only a ceiling on the score, (largest jump between neighbouring pair contributions) × (sum of the partial sums of these rotating arrows). The ceiling falls with distance, but a given score doesn't have to: for random q and k the expected score is zero at every distance and nothing decays. Barbero et al. 2024 (arXiv:2410.06205, §3) make the same point and argue decay is "unlikely to be the core reason" RoPE works.

--

<p class="eyebrow">§3.3 Properties of RoPE</p>

## RoPE with linear attention

<div class="big-math line small">$$\mathrm{Attn}_m = \frac{\sum_n \big(R_m\,\phi(q_m)\big)^\top \big(R_n\,\varphi(k_n)\big)\, v_n}{\sum_n \phi(q_m)^\top \varphi(k_n)}$$</div>

<div class="full short"><img src="img/week-03-linear-attention.svg" alt="Left: softmax attention builds a 12 by 12 grid of scores. Right: linear attention builds one small 4 by 4 summary from rotated keys and values, reused by every rotated query"></div>

<p class="center"><b>A rotation keeps lengths, so it slots into linear attention</b></p>

<p class="gloss"><b>Linear attention</b>: replace the softmax with feature maps $\phi, \varphi$ so cost grows linearly with length. Denominator left unrotated</p>

<p class="footnote">RoFormer §3.3 (after Katharopoulos et al. 2020); tested in §4.4 with <b>Performer</b>, a linear-attention transformer, trained on <b>enwik8</b> (raw English Wikipedia text); loss curves only</p>

Note:
Linear attention (e.g. Performer) avoids the n × n score matrix by writing the similarity as φ(q)·φ(k) with non-negative feature maps, so sums can be computed once and reused.
Additive position methods break this because they add terms to the score itself. RoPE only rotates vectors, which keeps their lengths, so the authors simply rotate the feature-mapped queries and keys in the numerator.
They leave the denominator unrotated to avoid dividing by zero; the weights are then not strictly normalized and can be negative, which they acknowledge. §4.4 reports faster, lower training loss for Performer with RoPE, as a curve only.

---

<p class="eyebrow">§4 Experiments</p>

## Does RoPE help?

<div class="two-col">
  <table class="rules roles">
    <tr><td></td><td>baseline</td><td>RoFormer</td></tr>
    <tr><td>WMT14 En–De BLEU</td><td>27.3</td><td>27.5</td></tr>
    <tr><td>GLUE, tasks won</td><td></td><td>3 of 6</td></tr>
    <tr><td>long text, 512</td><td>68.10</td><td>68.29</td></tr>
    <tr class="total"><td>long text, 1,024</td><td></td><td>69.79</td></tr>
  </table>
  <div><img src="img/week-03-glue.svg" alt="GLUE scores as printed in RoFormer Table 2: RoFormer is above BERT on MRPC, STS-B and QQP, and below on SST-2, QNLI and MNLI"></div>
</div>

<p class="center"><b>Small gains; pretraining loss falls faster (curves only, no numbers)</b></p>

<p class="gloss"><b>WMT14 En–De</b>: 4.5M English–German sentence pairs; <b>BLEU</b>: 0–100 overlap of 1–4-word runs with human translations. <b>GLUE</b>: six English understanding tasks</p>

<p class="footnote">RoFormer Tables 1, 2, 5. Long text: <b>CAIL2019-SCM</b>, Chinese legal case matching (baseline WoBERT-512). Curves only: masked-LM pretraining (predict hidden words, BookCorpus + Wikipedia) and Performer, Fig. 3</p>

Note:
Translation: 0.2 BLEU over Transformer-base on WMT14 English–German, single run.
GLUE fine-tuning (right): wins on MRPC, STS-B and QQP, losses on SST-2, QNLI and MNLI. The caveats slides explain why this chart can't be read at face value.
Long Chinese legal documents: at 512 tokens RoFormer is on par with WoBERT (68.29 vs 68.10 test); allowing 1,024 tokens gives 69.79.
Pretraining: swapping BERT's position embeddings for RoPE makes the masked-LM loss fall faster, and adding RoPE to Performer (linear attention) trains faster and lower. Both are shown only as curves (Fig. 3), with no numbers.

--

<p class="eyebrow">§4.1 Machine translation</p>

## A 0.2 BLEU gain, one run each

<div class="full"><img style="max-height:400px" src="img/week-03-bleu-noise.svg" alt="BLEU of Transformer-base 27.3 and RoFormer 27.5 drawn against a band of plus or minus one and two standard deviations, 27.26 plus or minus 0.15, measured across 21 checkpoints of one Transformer-base run; both points fall inside the band"></div>

<p class="center"><b>Both results sit inside ordinary run-to-run spread</b></p>

<p class="gloss"><b>Checkpoint</b>: a saved snapshot during training. <b>sd</b>: standard deviation, the typical wobble between snapshots</p>

<p class="footnote">Band: Transformer-base on <b>newstest2014</b> (the WMT14 English–German news test set), 27.26 ± 0.15 across 21 checkpoints of one run (RNMT+, arXiv:1804.09849, Table 2); RoFormer Table 1</p>

Note:
RoFormer reports 27.5 BLEU vs 27.3 for Transformer-base, one run each, no error bars.
For scale: the RNMT+ paper reports Transformer-base on the same test set as 27.26 ± 0.15, the spread across 21 consecutive checkpoints of a single run. Across random seeds the spread is likely larger (DynamicConv reports ±0.1–0.3 across 3 seeds for a related model on the validation set). A 0.2 gain from one run is inside that noise.

--

<p class="eyebrow">§4.2 Pre-training language modeling</p>

## 40× less pretraining

<div class="full"><img style="max-height:400px" src="img/week-03-budget.svg" alt="Pretraining sequences seen: BERT 256 million (256 per batch for 1 million steps), RoFormer 6.4 million (64 per batch for 100 thousand steps)"></div>

<p class="center"><b>The GLUE table compares a lightly trained model to fully trained BERT</b></p>

<p class="gloss"><b>BERT</b>: Google's 2018 model whose position table RoFormer replaces with RoPE; its published scores are the baseline</p>

<p class="footnote">BERT: batch 256 × 1,000,000 steps (Devlin et al. 2019, App. A.2); RoFormer: batch 64 × 100k steps, learning rate 1e-5 (RoFormer §4.2.2)</p>

Note:
RoFormer pretrained with batch 64 for 100,000 steps; BERT used batch 256 for 1,000,000 steps: 6.4 million vs 256 million sequences, a factor of 40.
Their own pretraining loss curve trains both models the same way, which is fair. The GLUE table instead puts their lightly trained model next to the published, fully trained BERT.

--

<p class="eyebrow">§4.3 Fine-tuning on GLUE</p>

## Test scores vs validation scores

<div class="full"><img style="max-height:400px" src="img/week-03-glue.svg" alt="GLUE chart: open circles are BERT's GLUE test-server scores, filled circles are RoFormer's validation scores; the biggest gap, QQP 71.2 vs 86.4, is a test-versus-validation difference"></div>

<p class="center"><b>BERT's row is the test server; RoFormer's is its own validation set</b></p>

<p class="gloss"><b>Validation set</b>: data you may look at to choose settings. <b>Test server</b>: hidden data scored once by the benchmark</p>

<p class="footnote"><b>GLUE</b> tasks: MRPC paraphrase, SST-2 sentiment, QNLI question–answer match, STS-B sentence similarity, QQP duplicate questions, MNLI entailment. BERT: Devlin et al. 2019 Table 1 (test server); RoFormer §4.3.2 (validation)</p>

Note:
The BERT numbers in RoFormer's Table 2 (88.9, 93.5, 90.5, 85.8, 71.2, 84.6/83.4) are exactly BERT-base in the BERT paper's Table 1, which are GLUE test-server results. RoFormer's own numbers are best-averaged validation scores. Different data, different selection.
The QQP pair (71.2 vs 86.4) is the clearest symptom: test F1 and validation F1 on QQP are on different scales. The chart supports no claim that RoFormer "significantly outperforms" BERT.

--

<p class="eyebrow">§4.5 Evaluation on Chinese data</p>

## Longer input, not a better encoding

<div class="full"><img style="max-height:400px" src="img/week-03-cail.svg" alt="CAIL legal case matching test accuracy: BERT 67.77, WoBERT 68.10 and RoFormer 68.29, all at 512 tokens; RoFormer 69.79 at 1,024 tokens"></div>

<p class="center"><b>At equal length RoFormer ties; the gain needs twice the text</b></p>

<p class="footnote"><b>CAIL2019-SCM</b>: 8,964 triplets of Chinese court cases; is case A closer to B or to C? RoFormer Table 5 (test accuracy). The 512-token baselines use absolute position tables, which can't read longer inputs</p>

Note:
At the same 512-token limit the three models are within 0.5 points (67.77, 68.10, 68.29). The headline 69.79 comes from letting RoFormer read 1,024 tokens. That shows RoPE can be used on longer inputs than an absolute-position table allows, but it isn't evidence that RoPE encodes position better at equal length.

--

<p class="eyebrow">§1 claim, §4.5 Chinese data</p>

## "Length flexibility", untested

<div class="full"><img style="max-height:400px" src="img/week-03-untested.svg" alt="A line of positions from 0 to 4,096: up to 512 trained and tested; 512 to 1,536 reached only by the Chinese model's training stages; beyond 1,536 never evaluated"></div>

<p class="center"><b>Claimed as a property, never measured past the training length</b></p>

<p class="footnote">RoFormer §1 lists "sequence length flexibility"; English experiments use 512 (§4.2.2); the Chinese model's stages reach 1,536 (Table 4); no evaluation beyond the training length</p>

Note:
The introduction lists "sequence length flexibility" among RoPE's properties, but no experiment tests a model on inputs longer than it was trained on. In practice RoPE models degrade past their training length, which is exactly why the "RoPE in 2026" section exists.

--

<p class="eyebrow">§4.5.5 Limitations of the work</p>

## What the authors admit

<p class="center" style="font-size: 1.35em; margin-top: 1.6em; line-height: 1.4">"there lacks of thorough explanations on why it converges faster than baseline models that incorporates other position encoding strategies"</p>

<p class="center">RoFormer §4.5.5, Limitations of the work</p>

<p class="footnote">Their second limitation: superior long-text performance "we have not come up with a faithful explanation"</p>

Note:
To their credit, the authors say plainly that they can't explain the two things the paper highlights: why RoPE models converge faster, and why they do better on long text. The long-term-decay property is the closest thing to an explanation, and the earlier slides showed it is only a bound.

--

<p class="eyebrow">§4 Experiments: caveats, in short</p>

## Caveats, in short

<table class="rules steps">
  <tr><td>GLUE baseline</td><td>test vs validation scores</td><td>not like-for-like</td></tr>
  <tr><td>training budget</td><td>40× fewer sequences</td><td>vs published BERT</td></tr>
  <tr><td>BLEU +0.2</td><td>one run each</td><td>within noise</td></tr>
  <tr><td>long-text gain</td><td>2× longer input</td><td>not equal length</td></tr>
  <tr><td>length flexibility</td><td>no test past training</td><td>claim only</td></tr>
  <tr class="total"><td>authors</td><td>no explanation of speed-up</td><td>§4.5.5</td></tr>
</table>

<p class="footnote">Recap of the caveat slides above, one per experiment</p>

Note:
A recap of the six problems with the paper's evidence, each shown on its own slide in this section.

---

<p class="eyebrow">§5 Conclusions</p>

## What the paper concludes

<table class="rules steps">
  <tr><td>claim</td><td>evidence</td><td>our read</td></tr>
  <tr><td>relative position via rotation</td><td>derivation, §3</td><td>holds</td></tr>
  <tr><td>long-term decay</td><td>a bound, §3.4.3</td><td>bound only</td></tr>
  <tr><td>works with linear attention</td><td>Performer curve, §4.4</td><td>plausible</td></tr>
  <tr><td>faster convergence</td><td>loss curves, §4.2</td><td>unexplained</td></tr>
  <tr class="total"><td>better on long texts</td><td>CAIL at 1,024, §4.5</td><td>longer input</td></tr>
</table>

<p class="footnote">RoFormer §5 and §4.5.5; "our read" summarizes the caveat slides of §4</p>

Note:
The paper's conclusion makes four claims; here each is set against what the paper shows.
Relative position through rotation: proven cleanly in §3; this is the paper's lasting contribution.
Long-term decay: what's proven is a ceiling on the score, not that scores decay (notes of the long-term decay slide).
Linear attention: compatible by construction; the experiment is one loss curve.
Faster convergence: shown as curves, with the authors admitting they can't explain it.
Better on long texts: the gain comes with reading twice as much text, not from a better encoding at equal length.

---

<p class="eyebrow">Beyond the paper</p>

## RoPE in 2026: stretching the clocks

<div class="full"><img style="max-height:400px" src="img/week-03-long-context.svg" alt="Full turns completed by each of Qwen3's 64 rotation pairs at 32,768 tokens and at 131,072 tokens on a log scale; pairs 40 to 63, 24 of the 64, complete less than one turn during training, so longer inputs reach angles never seen"></div>

<p class="center"><b>Past the training length, slow pairs reach angles never seen</b></p>

<p class="footnote">Qwen3 base $10^6$, head dimension 128; trained to 32,768 tokens (Qwen3 report §3.2); computed by us</p>

Note:
A model trained on sequences of length L has only seen rotation angles up to L·θ_i in each pair. With Qwen3's base, 24 of the 64 pairs (40 to 63) never complete a single turn within 32,768 training tokens. At 131,072 tokens those pairs reach angles the model never saw; the fast pairs have seen every angle many times over.
Three families of fixes change the clocks, not the model: squeeze the positions, slow every clock, or treat each pair by its speed. One slide each below.

--

<p class="eyebrow">Beyond the paper · Chen et al. 2023</p>

## Position Interpolation: squeeze the positions

<div class="full"><img style="max-height:330px" src="img/week-03-pi.svg" alt="Two number lines: new input positions from 0 to 16,384 on top, each mapped by a line to position divided by 4 on the bottom line, which stays inside the trained range 0 to 4,096"></div>

<div class="big-math line small">$$m\,\theta_i \;\to\; \frac{m}{s}\,\theta_i,\qquad s = L'/L$$</div>

<p class="center"><b>Every position divided by the same factor; about 1,000 fine-tuning steps</b></p>

<p class="gloss">$L$: training length (4,096 here). $L'$: the longer length wanted (16,384). $s = L'/L$: the stretch factor (4)</p>

<p class="footnote">Chen et al. 2023, arXiv:2306.15595, §2.3 and §3.1 ("we fine-tune the models for 1000 steps"); used by LongLoRA (Week 2)</p>

Note:
Position Interpolation divides every position by s = L'/L, the ratio of the new to the trained length. Positions up to L' then land inside the trained range [0, L), so no pair sees an unseen angle (picture: s = 4, 16,384 squeezed into 4,096). A short fine-tune (about 1,000 steps on the Pile) adapts the model.
The cost: neighbouring tokens are now only 1/s of a position apart, which blurs fine local order in the fast pairs. LongLoRA (Week 2) used this to stretch Llama 2 to 100K.

--

<p class="eyebrow">Beyond the paper · Xiong et al. 2023</p>

## Raise the base: slow every clock

<div class="two-col">
  <table class="rules roles">
    <tr><td></td><td>base $b$</td></tr>
    <tr><td>RoFormer</td><td>10,000</td></tr>
    <tr><td>Xiong et al. 2023 ("ABF")</td><td>500,000</td></tr>
    <tr><td>Llama 3</td><td>500,000</td></tr>
    <tr class="total"><td>Qwen3</td><td>10,000 → 1,000,000</td></tr>
  </table>
  <div><img src="img/week-03-wavelengths.svg" alt="Wavelength of each rotation pair for base ten thousand and base one million: raising the base leaves the first pair alone and slows each later pair more"></div>
</div>

<p class="center"><b>A larger base slows the slow pairs most; the fastest pair is unchanged</b></p>

<p class="footnote">$\theta_i = b^{-2(i-1)/d}$. Xiong et al. 2023 (arXiv:2309.16039, §4.1) name it "adjusted base frequency"; Llama 3 §3.2; Qwen3 §3.2 ("using the ABF technique")</p>

Note:
Raising the base b makes every θ_i smaller except the first (i = 1 has θ = 1 for any base), and the later the pair, the more it slows (right). More context then fits inside angles the model has seen, if the model is (pre)trained with the new base.
Xiong et al. 2023 coined "ABF" (adjusted base frequency) for raising b from 10,000 to 500,000; Llama 3 uses 500,000; Qwen3 went from 10,000 to 1,000,000 during pretraining. Code Llama did the same a month before Xiong et al., calling it the "base period".

--

<p class="eyebrow">Beyond the paper · Peng et al. 2023</p>

## YaRN: treat each pair by its speed

<div class="full"><img style="max-height:400px" src="img/week-03-yarn.svg" alt="Speed multiplier per rotation pair for Llama 2 with a 4K context and a stretch factor of 4: pairs 0 to 20 kept at 1, pairs 21 to 45 blended linearly, pairs 46 to 63 divided by 4 like Position Interpolation, which divides every pair by 4"></div>

<p class="center"><b>Fast pairs kept, slow pairs squeezed, the middle blended</b></p>

<p class="gloss">Kept: more than 32 turns in training. Squeezed: under 1 turn. <b>Temperature</b>: rescales $q, k$ by $0.1\ln s + 1$ to keep attention sharp</p>

<p class="footnote">Peng et al. 2023, arXiv:2309.00071, §3.2–3.3 ($\alpha$ = 1, $\beta$ = 32 for Llama); our computation for Llama 2, 4K, $s$ = 4. Qwen3: trained to 32K, YaRN ×4 to 128K at inference</p>

Note:
YaRN leaves the positions alone and changes each pair's speed separately, by how many full turns that pair makes over the training length.
Fast pairs (more than 32 turns) already see every angle many times, so they're kept: local order stays sharp. Slow pairs (less than one turn) are squeezed exactly like Position Interpolation (÷s). The pairs in between are blended linearly. For Llama 2 at 4K that's pairs 0–20 kept, 21–45 blended, 46–63 squeezed (picture, s = 4; the dashed line is plain PI, which squeezes everything).
It also rescales q and k by √(1/t) = 0.1 ln s + 1 (1.14 for s = 4), which sharpens attention that the stretching would otherwise flatten.
Qwen3 trains to 32K tokens and applies YaRN at inference for 4× to 128K. Qwen3-4B's config: rope_theta = 1,000,000, head dimension 128, max 40,960 positions. RoPE has no parameters, so LoRA can't change it; position handling can only change through W_q and W_k.

---

<p class="eyebrow">Discussion</p>

## Questions for discussion

1. Sinusoids are added; RoPE multiplies. What exactly is lost by adding?
2. If half the pairs barely rotate within the context, are they position channels at all?
3. If decay is only a bound, what makes RoPE train faster?
4. RoFormer's GLUE table mixes test and validation scores. What would a fair comparison be?
5. Raising the base slows every clock. What does that cost for short-range order?
6. Does LoRA on $W_q, W_k$ change how a fine-tuned Qwen3 uses its slow pairs?

Note:
1. Adding creates word–position cross terms and loses "only the gap matters" after the projections (left map on the requirement slide); multiplying keeps the score a function of the words and the gap.
2. With base 10,000 and 512 tokens, 33 of 64 pairs never complete a turn; with Qwen3's base and context, 23 of 64. Barbero et al. 2024 find Gemma uses its slowest pairs mostly for meaning, its fastest for position-tracking heads.
3. Open: the paper proves a ceiling, not a mechanism; the authors say they can't explain it.
4. Same pretraining budget, the same split (validation) for both, several seeds, and an equal-length long-text comparison.
5. A larger base makes most pairs turn less per token, so fewer pairs resolve neighbouring positions; the fastest pair still turns 1 radian per token. YaRN keeps the fast pairs untouched for this reason.
6. A testable mini-project: compare per-pair attention use in Qwen3-4B before and after LoRA on the attention projections. Related: LLMs encode numbers with sinusoids at periods 2, 5 and 10 (Zhou et al. 2024), and RoPE is a representation of the shift group acting on q and k (the "Why Models Learn" course, Week 5).
