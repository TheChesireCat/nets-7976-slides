<!-- .slide: id="week-06" class="cover week" -->

<h1>Week 6</h1>
<p class="subtitle">Scaling Laws and Emergent Behaviors</p>

Note:
Four readings, about an hour, in two pairs. In each pair the second paper corrects the first. Kaplan and Chinchilla ask how to spend a fixed compute budget; Wei and Schaeffer ask whether some abilities appear suddenly with scale.

---

<p class="eyebrow">Week 6 readings</p>

## Smooth loss, sudden abilities?

<table class="rules">
  <tr><td>reading</td><td>question</td></tr>
  <tr><td>Kaplan et al. 2020, scaling laws</td><td>how does loss fall with scale?</td></tr>
  <tr><td>Hoffmann et al. 2022, Chinchilla</td><td>how to split compute: model or data?</td></tr>
  <tr><td>Wei et al. 2022, emergent abilities</td><td>do some skills appear suddenly?</td></tr>
  <tr class="total"><td>Schaeffer et al. 2023, mirage</td><td>or does the metric make the jump?</td></tr>
</table>

<p class="footnote">arXiv:2001.08361 · arXiv:2203.15556 · arXiv:2206.07682 · arXiv:2304.15004. Press ↓ on any slide for optional depth</p>

Note:
The plan. Two pairs.
First pair: Kaplan et al. found that language-model loss falls as a clean power law in model size, data and compute, and concluded that with more compute you should mostly grow the model. Two years later Hoffmann et al. (Chinchilla) redid the experiment and concluded that model and data should grow about equally. Same question, different answer; we'll look at why.
Second pair: Wei et al. collected tasks where accuracy sits at chance for small models and then jumps. Schaeffer et al. argued that many of those jumps come from the metric, not the model.
The thread through all four: loss improves smoothly and predictably with scale. So what, if anything, jumps?
Vertical sub-slides (press down) are optional depth.


---

<!-- .slide: class="cover divider" -->

<p class="kicker">Reading 1 of 4</p>
<h1>Kaplan et al. 2020</h1>
<p class="subtitle">Scaling Laws for Neural Language Models</p>
<p class="question">If you had 10x more compute, what would you do with it?</p>
<ol class="track"><li class="now">Kaplan 2020<span>scaling laws</span></li><li>Chinchilla 2022<span>compute-optimal training</span></li><li>Wei 2022<span>emergent abilities</span></li><li>Schaeffer 2023<span>a mirage?</span></li></ol>

Note:
Reading 1 of 4. Kaplan, McCandlish and others at OpenAI, January 2020. This is a deep dive: we go through the paper in order and stop to understand each step.

---

<p class="eyebrow"><span class="paper">Kaplan et al. 2020</span> · Motivation</p>

## You have 10x more compute. Where does it go?

<div class="rows">
<div class="points">
<div class="text">

- a bigger model? more data?
- train longer? a new architecture?

</div>
<div class="text">

<p class="q"><b>Q.</b> Why not just try each one? <b>A.</b> One full-size run can cost millions</p>
<p class="q"><b>Kaplan's bet:</b> loss is predictable from size, data and compute</p>

</div>
</div>
<div class="fig"><img src="img/week-06-kaplan-fig1.png" alt="Kaplan et al. Figure 1: test loss against compute, dataset size and parameters, each a straight line on log-log axes"></div>
</div>

<p class="footnote">Kaplan et al. 2020 · arXiv:2001.08361 · Fig. 1</p>

Note:
Start with the practical problem. A lab has a budget. It can make the model bigger, give it more data, train it longer, or change the architecture. A full-size run costs too much to try every option, so you need a rule that says, before you spend the money, which knob to turn.
Kaplan's bet is that the test loss depends mostly on three numbers, model size, data and compute, and in a predictable way. If that's true, you can train small models, fit the trend, and extrapolate. The figure on the right is the evidence they offer: three straight lines. The rest of this section asks whether those lines can be trusted, and what follows from them.

---

<p class="eyebrow"><span class="paper">Kaplan et al. 2020</span> · §1.3 Notation</p>

## What exactly is "loss"?

<div class="cols">
<div class="text">

<div class="eq">$$L = -\frac{1}{T}\sum_{t=1}^{T} \log p_\theta(x_t \mid x_{\lt t})$$</div>

- next-token cross-entropy
- in nats; lower is better
- perplexity $= e^{L}$
- $L$: 3.0 ▸ 2.8 means perplexity 20.1 ▸ 16.4

</div>
<div class="text">

<p class="q"><b>Q.</b> Is lower loss a smarter model?</p>
<p class="a"><b>A.</b> Not measured here. Loss only, no benchmarks</p>
<p class="q"><b>Q.</b> Loss on what?</p>
<p class="a"><b>A.</b> Held-out WebText2, averaged over a 1,024-token context</p>

</div>
</div>

<p class="footnote">Kaplan et al. 2020 · §1.3, §2. Perplexity: the number of equally likely tokens the model is, on average, choosing between</p>

Note:
Everything in the paper is about one number: the average cross-entropy of the next token on held-out text. The model sees the tokens so far and puts a probability on the real next token; loss is minus the log of that probability, averaged.
It's in nats, so e to the loss is the perplexity, roughly how many tokens the model is torn between. A drop from 3.0 to 2.8 looks small, but it takes perplexity from about 20 to about 16.
Be clear about what this is not. It's not reasoning, instruction following or benchmark accuracy. Whether those scale the same way is a separate question, and it's the one the second half of today (Wei, Schaeffer) is about.

---

<p class="eyebrow"><span class="paper">Kaplan et al. 2020</span> · §2 Background and methods</p>

## What did they actually train?

<div class="cols">
<div class="text">

- decoder-only Transformers
- WebText2: $2.29\times10^{10}$ tokens
- 768 to 1.5B parameters (no embeddings)
- data subsets: 22M to 23B tokens
- BPE vocabulary 50,257; context 1,024
- Adam (Adafactor for the largest)
- $2.5\times10^{5}$ steps, $2^{19}$ tokens per batch
- one schedule: 3,000-step warmup, cosine to zero

</div>
<div class="text">

<p class="q"><b>Q.</b> What varies?</p>
<p class="a"><b>A.</b> Size, shape, data, batch, training length</p>
<p class="q"><b>Q.</b> What stays fixed?</p>
<p class="a"><b>A.</b> The learning-rate schedule. Remember this</p>

</div>
</div>

<p class="footnote">Kaplan et al. 2020 · §2.2, §2.3. Also evaluated on Books, Wikipedia, Common Crawl and other text (§3.2.2). The schedule holds "unless otherwise noted"</p>

Note:
The setup. GPT-2-style decoder-only Transformers trained on WebText2, an extended version of GPT-2's dataset, about 23 billion tokens. Models from 768 to 1.5 billion non-embedding parameters. For the data experiments, subsets from 22 million to 23 billion tokens.
Unless otherwise noted, every run used Adam for 250,000 steps at about half a million tokens per batch, with one learning-rate schedule: a 3,000-step warmup, then a cosine decay to zero.
Remember that one schedule. When Chinchilla disagrees two years later, it blames exactly this: compute-limited results were read partway through these long runs.

---

<p class="eyebrow"><span class="paper">Kaplan et al. 2020</span> · §3, App. D · The experiments</p>

## Which experiments did they run?

<table class="rules">
  <tr><td>#</td><td>varied</td><td>runs</td><td>gives</td><td>figures</td></tr>
  <tr><td>1</td><td>model size</td><td>768 to 1.5B, all of WebText2</td><td>$L(N)$, $L(C)$, learning curves</td><td>1, 2, 4, 6, 8, 11, 13, 14</td></tr>
  <tr><td>2</td><td>shape</td><td>fixed $N$: depth, width, heads, feed-forward</td><td>shape barely matters</td><td>5</td></tr>
  <tr><td>3</td><td>model × data</td><td>22M to 23B tokens, early stop</td><td>$L(D)$, $L(N, D)$, overfitting</td><td>1, 4, 9, 16</td></tr>
  <tr><td>4</td><td>batch size</td><td>3M and 85M models</td><td>critical batch $B_{\rm crit}(L)$</td><td>10, 18</td></tr>
  <tr><td>5</td><td>schedule</td><td>a 3M model</td><td>schedule barely matters</td><td>22</td></tr>
  <tr><td>6</td><td>architecture</td><td>LSTMs, recurrent Transformers</td><td>LSTMs worse on late tokens</td><td>7, 17</td></tr>
  <tr><td>7</td><td>context</td><td>8-token contexts</td><td>better on the first tokens</td><td>21</td></tr>
</table>

<p class="footnote">Kaplan et al. 2020 · §3, App. D. The numbering is ours; the paper doesn't number its experiments. §6's compute allocation is fitted from 1 and 4, not new runs. Schedule: learning-rate schedule. Figures: the main ones</p>

Note:
The paper doesn't number its experiments, so here is the list we'll use for the rest of this section. Section 3 opens by naming what they varied: model size, dataset size, shape, context length and batch size. The appendices add a learning-rate schedule scan and the comparison with other architectures.
Experiment 1 is the backbone: models from 768 to 1.5 billion non-embedding parameters, many shapes, all trained on the whole of WebText2 for 250,000 steps. Most of the paper's figures come from these runs: the size law, the compute law read off their learning curves, the learning-curve law, and the transfer to other text.
Experiments 2, 3 and 4 each vary one more thing: the shape at fixed size; dataset size crossed with model size, with early stopping; and the batch size, on two small models. Keep experiment 4 in mind. Its critical batch size is what turns raw compute into the adjusted compute later on.
Experiments 5, 6 and 7 are checks: the learning-rate schedule, LSTMs and recurrent Transformers, and models trained on an 8-token context.
The compute-allocation result of Section 6 isn't a new experiment; it's fitted from experiments 1 and 4. From here on, the running header of each results slide says which experiment it comes from, or "from the fit" when the slide is derived rather than measured.

---

<p class="eyebrow"><span class="paper">Kaplan et al. 2020</span> · §2.1 · Eq. 2.1</p>

## Where does $N \approx 12\thinspace  n_{\rm layer}\thinspace  d_{\rm model}^2$ come from?

<div class="cols">
<div class="text">

- attention: $Q, K, V, O$, each $d \times d$: $4d^2$
- MLP: $d \to 4d \to d$: $8d^2$
- one layer: $12d^2$
- all layers: $12\thinspace  n_{\rm layer} d^2$
- embeddings left out: $n_{\rm vocab} d + n_{\rm ctx} d$

</div>
<div class="text">

<p class="q"><b>Q.</b> Check it on GPT-2: 48 layers, $d$ = 1,600?</p>
<p class="a"><b>A.</b> $12 \times 48 \times 1600^2 \approx 1.47$B</p>
<p class="q"><b>Q.</b> Embeddings of that model?</p>
<p class="a"><b>A.</b> $50{,}257 \times 1{,}600 \approx 80$M, about 5%</p>

</div>
</div>

<p class="footnote">Kaplan et al. 2020 · Eq. 2.1, Table 1 (with $d_{\rm attn} = d_{\rm ff}/4 = d_{\rm model}$). The 80M is our arithmetic</p>

Note:
Where the parameter count comes from. In each layer, attention has four d-by-d matrices (queries, keys, values, output), 4 d squared. The MLP goes from d to 4d and back, 8 d squared. Twelve d squared per layer, times the number of layers. Biases and norms are tiny and ignored.
Check it on GPT-2's largest shape: 48 layers, width 1,600. Twelve times 48 times 1,600 squared is about 1.47 billion, the "1.5B" model.
The embeddings, token and position tables, are left out of N. For this model the token table is about 80 million, 5% of the total. For small models it's a much bigger share, which comes back later.

---

<p class="eyebrow"><span class="paper">Kaplan et al. 2020</span> · §2.1 · Eq. 2.2</p>

## Why $6N$ FLOPs per token?

<div class="cols">
<div class="text">

- forward: one multiply-add per weight: $2N$
- backward: about twice the forward: $4N$
- per token: $6N$
- whole run: $C \approx 6N \times$ tokens $= 6NBS$
- fixed $C$: bigger $N$ means fewer tokens

</div>
<div class="text">

<p class="q"><b>Q.</b> What does $6N$ leave out?</p>
<p class="a"><b>A.</b> Attention over the context, and the output layer</p>
<p class="q"><b>Q.</b> Does that matter?</p>
<p class="a"><b>A.</b> For small models, yes (end of section)</p>

</div>
</div>

<p class="footnote">Kaplan et al. 2020 · §2.1, Table 1. $B$: tokens per batch; $S$: steps; 1 PF-day = $8.64\times10^{19}$ FLOPs. Table 1 lists the output layer's $2 d_{\rm model} n_{\rm vocab}$ FLOPs, then drops them from the total</p>

Note:
Compute. In the forward pass each weight is used once per token, a multiply and an add, so 2N FLOPs. The backward pass costs about twice the forward pass, 4N. Six N per token.
Multiply by tokens processed and you get the budget: C is about 6 N B S, batch times steps being the number of tokens. This one line is the whole trade-off of the next two papers: with C fixed, a bigger model means fewer tokens.
What it leaves out: the attention computation over the context, which the paper says matters only for very long contexts, and the output layer's FLOPs, which Table 1 lists and then drops. In 2024 Porian et al. show that dropping the output layer is one of the reasons Kaplan's allocation came out wrong.

---

<p class="eyebrow"><span class="paper">Kaplan et al. 2020</span> · Experiment 1, model size · §1.1 · Fig. 2</p>

## Does even one training run follow a power law?

<div class="cols wide-fig">
<div class="text">

- plot loss against tokens seen
- after warmup: a straight-ish line on log axes
- bigger models: lower, and faster
- the same shape at every size

<p class="q"><b>Q.</b> Seen this in nanoGPT?</p>
<p class="a"><b>A.</b> Yes: loss vs tokens bends the same way</p>

</div>
<div class="fig"><img src="img/week-06-kaplan-fig2.png" alt="Kaplan et al. Figure 2: test loss against tokens processed and against compute for models from 10^3 to 10^9 parameters; larger models reach a given loss with fewer tokens, and the compute-efficient frontier stops well short of convergence"></div>
</div>

<p class="footnote">Kaplan et al. 2020 · Fig. 2. "Training curves follow predictable power-laws whose parameters are roughly independent of the model size" (§1.1)</p>

Note:
Before the formal laws, the place most of us have already seen a power law: a single training run. Plot the loss of a nanoGPT run against tokens seen, on log axes, and after the first few hundred steps it bends into something close to a straight line, then flattens.
Figure 2 is that, for models from a thousand to a billion parameters. Two things to notice. Bigger models are lower everywhere, and they get to a given loss with fewer tokens, which the paper calls sample efficiency. And the curves have the same shape at every size; the paper says the parameters of the training curve are roughly independent of model size.
That regularity is the hint that loss as a function of scale might be a power law too. The next slide makes it precise.

--

<p class="eyebrow"><span class="paper">Kaplan et al. 2020</span> · From the experiment 1 fit · §5.2 · Eq. 1.6, Fig. 4</p>

## A power law in steps, on top of a floor

<div class="cols wide-fig">
<div class="text">

<div class="eq">$$L(N,S) = \Big(\frac{N_c}{N}\Big)^{\alpha_N} + \Big(\frac{S_c}{S_{\min}}\Big)^{\alpha_S}$$</div>

- first term: the size's floor
- second: still training, $\alpha_S \approx 0.76$
- subtract the floor: one straight line
- fits only after the warmup transient

</div>
<div class="fig"><img src="img/week-06-kaplan-learning-curve.svg" alt="Illustration from Kaplan's Eq. 1.6: left, loss against steps for models of 1M, 10M, 100M and 1B parameters, each flattening to its own floor; right, loss minus the floor against steps on log axes, the same straight line of slope -0.76 for every size"></div>
</div>

<p class="footnote">Kaplan et al. 2020 · Eq. 1.6 with Table 3 constants ($N_c = 6.5\times10^{13}$, $\alpha_N = 0.077$, $S_c = 2.1\times10^3$, $\alpha_S = 0.76$). Illustration drawn from the equation. Fig. 4 right: real runs</p>

Note:
Optional depth. The paper's own model of a training curve: loss equals a floor set by the model's size plus a term that falls as a power law in steps, with exponent 0.76. So a training curve is not a pure power law; it is a power law sitting on top of a constant. Subtract each model's floor and every size falls on the same line. That's the right panel, drawn from the equation with the paper's fitted constants.
Two caveats, both from the paper. It only fits after an initial transient, the warmup. And S here is S_min: the steps the run would need at a very large batch, the fewest possible (defined later, with the critical batch). On optimiser choice: the paper finds the learning-rate schedule matters little, as long as there is a warmup and a decay to near zero (next sub-slide).

--

<p class="eyebrow"><span class="paper">Kaplan et al. 2020</span> · Experiment 1, model size · §5.2 · Fig. 4 (right)</p>

## Do real learning curves fit it?

<div class="cols">
<div class="text">

- solid: measured runs
- dotted: Eq. 1.6
- one fit for all sizes
- "the fits are imperfect"

<p class="q"><b>Q.</b> What could break it?</p>
<p class="a"><b>A.</b> Early transient; a different schedule</p>

</div>
<div class="fig"><img src="img/week-06-kaplan-fig4-right.png" alt="Kaplan et al. Figure 4 right: loss against estimated S_min for models of many sizes, measured curves with the fitted equation dotted, close for all sizes after the start"></div>
</div>

<p class="footnote">Kaplan et al. 2020 · Fig. 4 right, §5.2: "Though the fits are imperfect, we believe they are quite compelling given the simplicity"</p>

Note:
Optional. The measured learning curves (solid) against the fitted equation (dotted), coloured by model size. One equation with four constants tracks all of them reasonably well after the start, which is what makes it useful for predicting where a run will end. The authors' own word is "imperfect".

--

<p class="eyebrow"><span class="paper">Kaplan et al. 2020</span> · Experiment 5, learning-rate schedule · App. D.6 · Fig. 22</p>

## Does the learning-rate schedule change it?

<div class="cols wide-fig">
<div class="text">

- many schedules tried
- final loss: nearly the same
- what matters: total learning rate
- needs: a warmup and a final decay

<p class="q"><b>Q.</b> So optimiser choice is irrelevant?</p>
<p class="a"><b>A.</b> Within these runs. Porian 2024 disagrees for small batches</p>

</div>
<div class="fig"><img src="img/week-06-kaplan-fig22.png" alt="Kaplan et al. Figure 22: top, a variety of learning-rate schedules; bottom, final test loss against the summed learning rate, nearly the same for all schedules once the sum is large enough"></div>
</div>

<p class="footnote">Kaplan et al. 2020 · Fig. 22, App. D.6: the schedule "is mostly irrelevant, as long as the total summed learning rate is sufficiently large, and the schedule includes a warmup period and a final decay"</p>

Note:
Optional. You're right to ask about the optimiser. Kaplan tried a range of schedules on a small model: cosine, linear and faster or slower decays, on a 3M-parameter model. The final loss depends mostly on the total learning rate summed over training, not on the shape of the schedule, provided there is a warmup and a decay to near zero at the end.
That holds for these runs, with Adam at a fixed batch. Two later findings qualify it. Chinchilla shows a schedule much longer than the run hurts. Porian et al. show that at the small batches of compute-optimal small models, AdamW's beta-2 needs retuning.

---

<p class="eyebrow"><span class="paper">Kaplan et al. 2020</span> · §1.2 · Background</p>

## What does a power law buy you?

<div class="cols wide-fig">
<div class="text">

- $L(X) \propto X^{-\alpha}$
- straight line on log-log axes
- every 10x: loss × $10^{-\alpha}$
- $\alpha_N = 0.076$: 10x params, loss × 0.84
- so: fit small, extrapolate big

<p class="q"><b>Q.</b> Why not just say "bigger is better"?</p>
<p class="a"><b>A.</b> A power law says <i>how much</i> better, at every scale</p>

</div>
<div class="fig"><img src="img/week-06-kaplan-powerlaw.svg" alt="Illustration: the power law L = X^-0.076 on linear axes, where it flattens quickly, and on log-log axes, where it is a straight line and each tenfold step multiplies loss by 0.84"></div>
</div>

<p class="footnote">Kaplan et al. 2020 · illustration from $\alpha_N$ (Eq. 1.1), not a paper figure. Valid only inside the regime where it was measured</p>

Note:
Why the power-law form matters. On ordinary axes the curve flattens fast, which looks like diminishing returns. On log-log axes it's a straight line: every tenfold increase multiplies the loss by the same factor.
With the model-size exponent 0.076, ten times the parameters gives loss times 0.84, about 16% lower; a hundred times, 0.84 squared.
That constant ratio is what makes extrapolation possible: estimate the exponent from small models, predict big ones. The catch, which the Chinchilla story is about, is that it holds only while you stay in the same regime.

---

<p class="eyebrow"><span class="paper">Kaplan et al. 2020</span> · Experiments 1 and 3 · §1.2 · Eq. 1.1 to 1.3</p>

## The three laws: what does 10x of each buy?

<div class="rows">
<div class="points">
<div class="text">

- $L(C_{\min}) \propto C_{\min}^{-0.050}$: 10x ▸ 11% lower
- $L(D) = (D_c/D)^{0.095}$: 10x ▸ 20% lower
- $L(N) = (N_c/N)^{0.076}$: 10x ▸ 16% lower

</div>
<div class="text">

<p class="q"><b>Q.</b> So buy data, it has the biggest exponent? <b>A.</b> No: different regimes, different costs</p>
<p class="q"><b>Q.</b> Why is compute's the smallest? <b>A.</b> It is split between size and training</p>

</div>
</div>
<div class="fig"><img src="img/week-06-kaplan-fig1.png" alt="Kaplan et al. Figure 1: the three power laws in compute, dataset size and parameters"></div>
</div>

<p class="footnote">Kaplan et al. 2020 · Eq. 1.1 to 1.3, Fig. 1. $N_c = 8.8\times10^{13}$, $D_c = 5.4\times10^{13}$ tokens; the constants depend on the tokenizer and "do not have a fundamental meaning"</p>

Note:
The three laws of Figure 1, read as numbers. Ten times the parameters, with plenty of data and training: about 16% lower loss. Ten times the data, with a big enough model: about 20%. Ten times compute, spent optimally: about 11%.
Two traps. Don't compare these as if you could buy ten times of each at the same price: each was measured in a different regime, with the other two factors made generous. And the compute exponent is the smallest because extra compute has to be divided between a bigger model and more training, so you only get part of each benefit.
The constants N_c and D_c depend on the tokenizer; the paper says they have no fundamental meaning. The exponents are what carry information.

---

<p class="eyebrow"><span class="paper">Kaplan et al. 2020</span> · Experiment 2, shape · §3.1 · Fig. 5</p>

## Deep and narrow, or shallow and wide?

<div class="rows">
<div class="points">
<div class="text">

- hold $N$ fixed, vary the shape
- aspect ratio varied 40x: loss moves a few %
- (6, 4288) within 3% of GPT-2's (48, 1600)

</div>
<div class="text">

<p class="q"><b>Q.</b> So architecture doesn't matter?</p>
<p class="a"><b>A.</b> Shape, within limits. One layer, or extreme shapes, do worse</p>

</div>
</div>
<div class="fig"><img src="img/week-06-kaplan-shape.png" alt="Kaplan et al. Figure 5: loss increase relative to the best shape against feed-forward ratio, aspect ratio and attention head dimension, for several fixed parameter counts; a few percent over wide ranges"></div>
</div>

<p class="footnote">Kaplan et al. 2020 · Fig. 5, §3.1. Up to about 8% at the extreme shapes. Aspect ratio: width $d_{\rm model}$ over depth $n_{\rm layer}$</p>

Note:
At a fixed parameter count, they vary the shape: the feed-forward ratio, the aspect ratio (width over depth) and the head size. Loss moves by a few percent over wide ranges. A 6-layer model 4,288 wide gets within 3% of the 48-layer, 1,600-wide GPT-2 shape.
Why it's surprising: much of neural network design had been about finding the right architecture. This says that, for standard Transformers in this range, how much capacity you have matters far more than how you arrange it.
The limits: within reasonable shapes, standard Transformers only. Models with one layer, or extreme depth-to-width ratios, deviate.

---

<p class="eyebrow"><span class="paper">Kaplan et al. 2020</span> · Experiment 1, model size · §3.2 · Fig. 6</p>

## Why leave the embeddings out of $N$?

<div class="cols">
<div class="text">

- count all parameters: depths split apart
- count non-embedding only: one line

<p class="q"><b>Q.</b> Are embeddings then useless?</p>
<p class="a"><b>A.</b> No. A counting choice that cleans up the fit</p>
<p class="q"><b>Q.</b> What can go wrong?</p>
<p class="a"><b>A.</b> In small models, embeddings are most of the weights</p>

</div>
<div class="fig"><img src="img/week-06-kaplan-fig6.png" alt="Kaplan et al. Figure 6: loss against parameters; with embeddings, depths lie on separate curves; without, they collapse onto one trend"></div>
</div>

<p class="footnote">Kaplan et al. 2020 · Fig. 6, §3.2. The last answer is Pearce &amp; Song 2024 (arXiv:2406.12907), end of this section</p>

Note:
Why Kaplan counts N without embeddings. Counted with embeddings (top), models of different depth lie on different curves. Without (bottom), every model with at least two layers lines up.
Does that mean embeddings do nothing? No. It's a bookkeeping choice that makes one curve fit everything.
What can go wrong: for a small model the embedding table dwarfs the rest. A 2-layer, 128-wide model has about 0.4M non-embedding parameters and 6.4M in its token table. Leaving them out distorts the size axis exactly where Kaplan had most of his runs. Pearce and Song argue that this is much of why the compute-optimal rule came out wrong.

---

<p class="eyebrow"><span class="paper">Kaplan et al. 2020</span> · Experiment 1, model size · §3.2.2 · Fig. 8</p>

## Does it carry over to other text?

<div class="cols">
<div class="text">

- test on Books, Wikipedia, Common Crawl...
- same trend, shifted up
- a roughly constant offset
- a small offset, growing only slowly with size

<p class="q"><b>Q.</b> So it generalises?</p>
<p class="a"><b>A.</b> To related text. Not to any shift</p>

</div>
<div class="fig"><img src="img/week-06-kaplan-fig8.png" alt="Kaplan et al. Figure 8: top, test loss on other text distributions against model size, parallel lines offset from WebText2; bottom, loss on other distributions against WebText2 loss, close to straight lines"></div>
</div>

<p class="footnote">Kaplan et al. 2020 · Fig. 8, §3.2.2; §1.1: transfer "incurs a constant penalty but otherwise improves roughly in line with performance on the training set"</p>

Note:
Does any of this depend on WebText2? They evaluate the same models on other text: books, Wikipedia, Common Crawl and others. The curves are parallel to the WebText2 curve, shifted up by a roughly constant amount. So a better model on the training distribution is a better model on these, by about the same amount; the shift depends on the distribution, not on the model's size.
What it does not show: robustness to any distribution shift. These are all English text, mostly web and books.

---

<p class="eyebrow"><span class="paper">Kaplan et al. 2020</span> · Experiment 3, model × data · §4 Charting the infinite data limit</p>

## What if model and data are both limited?

<div class="cols">
<div class="text">

<div class="eq">$$L(N,D) = \Big[\Big(\frac{N_c}{N}\Big)^{\alpha_N/\alpha_D} + \frac{D_c}{D}\Big]^{\alpha_D}$$</div>

- $D \to \infty$: back to $L(N)$
- $N \to \infty$: back to $L(D)$
- in between: one smooth surface

<p class="q"><b>Q.</b> Derived or assumed?</p>
<p class="a"><b>A.</b> Assumed (an ansatz), then tested</p>

</div>
<div class="fig"><img src="img/week-06-kaplan-fig9a.png" alt="Kaplan et al. Figure 9 left: test loss against non-embedding parameters for dataset sizes from 21M to 22B tokens, with fits; small datasets flatten early"></div>
</div>

<p class="footnote">Kaplan et al. 2020 · Eq. 1.5, §4.1, Fig. 9 left. Joint fit: $\alpha_N = 0.076$, $\alpha_D = 0.103$ (Table 2)</p>

Note:
Real training is limited by both size and data at once, so they need one function of both. Equation 1.5. Check its limits: with infinite data the second term vanishes and you get the model-size law back; with an infinite model the first term vanishes and you get the data law back. In between, it interpolates.
The form is an ansatz: chosen to have those limits, then tested against runs. The authors give three principles for it; the third, that it should be a series in 1/D at large D, they call "more speculative".
The figure: loss against model size for datasets from 21 million to 22 billion tokens. With little data, bigger models stop helping and the curve flattens; the fitted surface (dotted) follows them.

---

<p class="eyebrow"><span class="paper">Kaplan et al. 2020</span> · Experiment 3, model × data · §4.2 · Fig. 9 (right)</p>

## When does a bigger model stop helping?

<div class="cols">
<div class="text">

<div class="eq">$$\delta L = \frac{L(N,D)}{L(N,\infty)} - 1$$</div>

- the overfitting penalty
- depends on $N^{0.74}/D$ alone
- all runs fall on one curve
- 0.74 = 0.076 / 0.103

<p class="q"><b>Q.</b> A collapse means universality?</p>
<p class="a"><b>A.</b> Suggestive. Not proof of a mechanism</p>

</div>
<div class="fig"><img src="img/week-06-kaplan-fig9b.png" alt="Kaplan et al. Figure 9 right: the relative overfitting penalty L/L(D=infinity) - 1 against N^(alpha_N/alpha_D)/D for all dataset sizes, collapsing onto one curve"></div>
</div>

<p class="footnote">Kaplan et al. 2020 · Eq. 4.3, Fig. 9 right. Early stopping at the best test loss, 10% dropout, regularisation not tuned</p>

Note:
How much worse a finite dataset makes things: delta L, the loss relative to an infinite-data model, minus one. Substitute the joint law and the penalty depends only on N to the 0.74 over D, not on N and D separately.
The figure tests it: runs with very different N and D all land on one curve. In physics you'd call that a scaling collapse. It's suggestive of shared structure, but a collapse by itself doesn't identify a mechanism or a universality class.
A detail: 0.74 is the ratio of the joint-fit exponents, 0.076 over 0.103. The separately fitted data exponent, 0.095, would give 0.80.

---

<p class="eyebrow"><span class="paper">Kaplan et al. 2020</span> · From the experiment 3 fit · §4.2 · Eq. 4.4</p>

## How much data does a billion-parameter model need?

<div class="cols">
<div class="text">

<div class="eq">$$D \gtrsim 5\times10^{3}\thinspace  N^{0.74}$$</div>

- keeps the penalty under seed noise (0.02)
- $N = 10^9$: $D \gtrsim 2.3\times10^{10}$ tokens
- about all of WebText2
- 8x the model: $8^{0.74} \approx 4.7$x the data

</div>
<div class="text">

<p class="q"><b>Q.</b> Why less than 8x?</p>
<p class="a"><b>A.</b> Bigger models use data more efficiently</p>
<p class="q"><b>Q.</b> Is this compute-optimal?</p>
<p class="a"><b>A.</b> No. It only avoids overfitting</p>

</div>
</div>

<p class="footnote">Kaplan et al. 2020 · Eq. 4.4, §4.2. "this does not typically represent maximally compute-efficient training". The 2.3e10 and 4.7x are our arithmetic</p>

Note:
A rule you can use. To keep the overfitting penalty below the run-to-run noise of about 0.02 in loss, D should be at least 5,000 times N to the 0.74.
Plug in a billion parameters: about 23 billion tokens, essentially the whole of WebText2, which is why their largest models start to overfit mildly.
Scale the model 8x and the data needs only about 4.7x. That sublinear rule is the root of Kaplan's advice to grow models faster than data.
But note the paper's own warning: this is the data needed to avoid overfitting, not the compute-optimal amount. Those are different questions, and confusing them is easy.

---

<p class="eyebrow"><span class="paper">Kaplan et al. 2020</span> · Experiment 4, batch size · §5.1 · App. D.3, Fig. 18</p>

## How big can a batch be before it's wasteful?

<div class="cols">
<div class="text">

- small batch: few tokens, many steps
- large batch: few steps, many tokens
- $(S/S_{\min} - 1)(E/E_{\min} - 1) = 1$
- $B_{\rm crit} = E_{\min}/S_{\min}$
- at $B_{\rm crit}$: $2S_{\min}$ steps, $2E_{\min}$ tokens

<p class="q"><b>Q.</b> Why care?</p>
<p class="a"><b>A.</b> Steps cost time; tokens cost FLOPs</p>

</div>
<div class="fig"><img src="img/week-06-kaplan-fig18.png" alt="Kaplan et al. Figure 18: for a 3M and an 85M parameter model, steps against examples processed to reach fixed values of the loss, each a hyperbola-like Pareto front fit by Equation 5.1"></div>
</div>

<p class="footnote">Kaplan et al. 2020 · Eq. 5.1, 5.2, Fig. 18. $S_{\min}$: fewest steps to reach a loss; $E_{\min}$: fewest examples (tokens). Builds on the gradient noise scale (McCandlish et al. 2018)</p>

Note:
A detour that the compute numbers depend on. To reach a target loss you can use small batches and many steps, which is cheap in FLOPs but slow, or big batches and few steps, which is fast on parallel hardware but wastes compute.
Kaplan finds the trade-off is a hyperbola: S over S_min minus one, times E over E_min minus one, equals one. S_min is the fewest steps possible, E_min the fewest tokens possible. Figure 18 shows these fronts for two model sizes.
The critical batch size is E_min over S_min. Training at it costs twice the minimum steps and twice the minimum tokens: a reasonable compromise between time and compute.

---

<p class="eyebrow"><span class="paper">Kaplan et al. 2020</span> · Experiment 4, batch size · §5.1 · Fig. 10</p>

## Why does the critical batch grow as loss falls?

<div class="cols">
<div class="text">

<div class="eq">$$B_{\rm crit}(L) \approx \frac{B_*}{L^{1/\alpha_B}},\quad B_* \approx 2\times10^{8},\ \alpha_B \approx 0.21$$</div>

- about $L^{-4.8}$
- doubles every 13% drop in loss
- depends on loss, not model size
- 1 to 2M tokens for the largest models

<p class="q"><b>Q.</b> Why define $C_{\min}$?</p>
<p class="a"><b>A.</b> All runs used one batch; $C_{\min}$ is what they'd cost at a small one</p>

</div>
<div class="fig"><img src="img/week-06-kaplan-fig10.png" alt="Kaplan et al. Figure 10: critical batch size in tokens against WebText2 train loss on log axes, a straight line B_crit = 2.1e8 tokens times L^-4.8"></div>
</div>

<p class="footnote">Kaplan et al. 2020 · Eq. 1.4, 5.5, Fig. 10. $C_{\min} = C/(1 + B/B_{\rm crit}(L))$. Not confident "for values of the loss far outside the range we have explored" (App. C)</p>

Note:
The critical batch size itself follows a power law, in the loss rather than in model size: as the model gets better, gradients get noisier relative to their signal, and you can usefully average over a bigger batch. It doubles for every 13% drop in loss, reaching one to two million tokens for their largest models.
Why this matters for the main result: every run used one fixed batch of half a million tokens, which is not optimal. So the paper converts each run's compute to C_min, the compute it would have needed with small, efficient batches. The headline allocation, 0.73, is in C_min. In raw compute the same fit gives 0.88.

---

<p class="eyebrow"><span class="paper">Kaplan et al. 2020</span> · Experiments 1 and 4 · §5.2 · Fig. 11</p>

## Fixed compute vs fixed steps: which size wins?

<div class="cols">
<div class="text">

- fixed compute: one best size
- too small: capacity-limited
- too big: too few steps
- fixed steps: bigger always better

</div>
<div class="fig"><img src="img/week-06-kaplan-fig11.png" alt="Kaplan et al. Figure 11: top, loss against parameters at fixed compute budgets, each with a minimum at an intermediate size; bottom, loss against parameters at fixed numbers of steps, decreasing with size"></div>
</div>

<p class="footnote">Kaplan et al. 2020 · Fig. 11, §5.2. The top panel (the paper's left) is the same U-shaped trade-off Chinchilla's IsoFLOP curves measure two years later</p>

Note:
Two ways to slice the same runs. Hold compute fixed (top panel) and there is a best model size: smaller ones run out of capacity, bigger ones get too few steps. Hold the number of steps fixed (bottom) and bigger is always better, since the bigger model just costs more.
The top panel is the seed of the whole Chinchilla paper: a U-shaped curve at fixed compute whose minimum moves with the budget. Where exactly that minimum sits is what the two papers disagree on.

---

<p class="eyebrow"><span class="paper">Kaplan et al. 2020</span> · From the experiment 1 fit · §6 Optimal allocation of the compute budget</p>

## The question, as an optimisation

<div class="cols">
<div class="text">

<div class="eq">$$\min_{N,\thinspace B,\thinspace S}\ L(N,S) \quad \text{subject to}\quad 6NBS = C$$</div>

<div class="eq">$$L = \underbrace{\Big(\frac{N_c}{N}\Big)^{\alpha_N}}_{\text{capacity}} + \underbrace{\Big(\frac{S_c}{S}\Big)^{\alpha_S}}_{\text{still training}}$$</div>

- bigger $N$: capacity term falls
- but fewer steps: training term rises
- best $N$: where they balance

</div>
<div class="text">

<p class="q"><b>Q.</b> Why not train each size to convergence?</p>
<p class="a"><b>A.</b> Convergence wastes compute (next slides)</p>
<p class="q"><b>Q.</b> Where's the batch?</p>
<p class="a"><b>A.</b> $B$ tracks $B_{\rm crit}(L)$, so it grows as loss falls</p>

</div>
</div>

<p class="footnote">Kaplan et al. 2020 · §6, Eq. 1.6 to 1.8. With $S = C/(6NB)$: $L = (N_c/N)^{\alpha_N} + (6NBS_c/C)^{\alpha_S}$</p>

Note:
Now the main result, as an optimisation. Fix the compute C. Choose model size, batch and steps to minimise loss, using the learning-curve law: a capacity term that falls with N plus a still-training term that falls with steps.
The tension: at fixed compute, a bigger model leaves fewer steps. Substitute S = C over 6NB and the training term grows with N. So the capacity term pushes N up, the training term pushes it down, and the optimum is where their marginal effects balance.
The batch isn't free either: training at the critical batch means B grows as the loss falls.

---

<p class="eyebrow"><span class="paper">Kaplan et al. 2020</span> · From the experiment 1 fit · §6 · App. B</p>

## Where is the balance?

<div class="cols">
<div class="text math-block">

Call the two terms $A$ (capacity) and $T$ (training). At fixed $B$:

<div class="eq">$$\frac{\partial L}{\partial N} = -\frac{\alpha_N}{N}A + \frac{\alpha_S}{N}T = 0$$</div>

<div class="eq">$$\Rightarrow\quad T = \frac{\alpha_N}{\alpha_S}\thinspace A \approx \frac{0.076}{0.76}\thinspace A = 0.10\thinspace A$$</div>

<div class="eq">$$\Rightarrow\quad L_{\rm opt} \approx 1.10\thinspace  L(N,\infty)$$</div>

</div>
<div class="text">

<p class="q"><b>Q.</b> In words?</p>
<p class="a"><b>A.</b> Stop about 10% above the model's converged loss</p>
<p class="q"><b>Q.</b> So what should you do?</p>
<p class="a"><b>A.</b> Train a bigger model, and stop early</p>

</div>
</div>

<p class="footnote">Kaplan et al. 2020 · App. B: train "to a fixed percentage $\alpha_N/\alpha_S \approx 10\%$ above the converged loss". We hold $B$ fixed for simplicity; App. B keeps $B(L)$, and the extra term drops out at the optimum</p>

Note:
Set the derivative with respect to N to zero. Because each term is a power of N, the derivative of each is its exponent times itself over N. The capacity term contributes minus alpha_N A over N; the training term, at fixed compute, contributes plus alpha_S T over N. Setting the sum to zero gives T = (alpha_N / alpha_S) A.
With the fitted exponents that's 0.076 over 0.76, a tenth. So at the optimum, the still-training part of the loss is 10% of the capacity part: the model is stopped about 10% above the loss it would converge to.
That's the paper's most practical claim: for a fixed budget, a bigger model stopped early beats a smaller one trained to convergence. It follows from the fitted model; it isn't a separate experiment.

---

<p class="eyebrow"><span class="paper">Kaplan et al. 2020</span> · From the experiment 1 fit · App. B · Fig. 12</p>

## How much does early stopping save?

<div class="cols">
<div class="text">

- vs stopping 2% above converged:
- 2.7x more parameters
- 7.7x fewer steps
- 65% less compute, same loss
- sizes 0.6x to 2.2x optimal: under 20% extra

<p class="q"><b>Q.</b> How sharp is the optimum?</p>
<p class="a"><b>A.</b> Flat: being 2x off costs little</p>

</div>
<div class="fig"><img src="img/week-06-kaplan-fig12.png" alt="Kaplan et al. Figure 12: top, extra compute needed against model size relative to the optimum, small between about 0.6x and 2.2x; bottom, the reduction in serial steps for larger-than-optimal models"></div>
</div>

<p class="footnote">Kaplan et al. 2020 · App. B.3, B.4, Fig. 12. "should not be trusted for very large models", valid only in the power-law region of the learning curve</p>

Note:
Appendix B puts numbers on it. Compared with training to 2% above the converged loss, the compute-efficient recipe uses about 2.7 times as many parameters, 7.7 times fewer steps, and 65% less compute to reach the same loss.
Figure 12 shows the optimum is flat: models from 0.6 to 2.2 times the optimal size cost less than 20% extra compute. That flatness matters later. It's one reason two very different prescriptions could both look reasonable on small-scale data.

---

<p class="eyebrow"><span class="paper">Kaplan et al. 2020</span> · From experiments 1 and 4 · §1.2 · Eq. 1.7, 1.8</p>

## How fast should each knob grow?

<div class="cols">
<div class="text math-block">

At the optimum $L \propto N^{-\alpha_N}$, so

<div class="eq">$$B \propto L^{-1/\alpha_B} \propto N^{\alpha_N/\alpha_B}, \qquad S \propto N^{\alpha_N/\alpha_S}$$</div>

<div class="eq">$$C \propto NBS \propto N^{1 + \alpha_N/\alpha_B + \alpha_N/\alpha_S}$$</div>

<div class="eq">$$\Rightarrow\ N_{\rm opt} \propto C^{\alpha_C/\alpha_N},\quad \alpha_C = \Big(\frac{1}{\alpha_N} + \frac{1}{\alpha_B} + \frac{1}{\alpha_S}\Big)^{-1}$$</div>

</div>
<div class="text">

- $\alpha_C \approx 0.05$
- predicted: $N \propto C^{0.71}$
- measured: $N \propto C^{0.73}$

<p class="q"><b>Q.</b> Why is this neat?</p>
<p class="a"><b>A.</b> Three measured exponents predict a fourth</p>

</div>
</div>

<p class="footnote">Kaplan et al. 2020 · Eq. 1.7, 1.8, 6.4, 6.5. The paper prints $\alpha_C$ as 0.054 (Eq. 6.4) and 0.052 (App. B); with 0.054 it gets $C^{0.71}$</p>

Note:
How the allocation exponents follow. At the optimum the loss scales like the capacity term, N to the minus alpha_N. The batch tracks the critical batch, which goes as L to the minus 1 over alpha_B, so B grows as N to the alpha_N over alpha_B. The optimality condition from two slides back makes the steps grow as N to the alpha_N over alpha_S.
Multiply: compute goes as N to the power 1 + alpha_N/alpha_B + alpha_N/alpha_S. Invert it and the optimal size goes as C to the alpha_C over alpha_N, where alpha_C is the harmonic-style combination of the three exponents.
With the fitted values, alpha_C is about 0.05, matching the measured compute law, and the size exponent comes out about 0.71, close to the 0.73 they fit directly. That's the satisfying part: exponents for capacity, training and batch predict the compute exponent and the allocation.

---

<p class="eyebrow"><span class="paper">Kaplan et al. 2020</span> · Experiments 1 and 4 · §6.1 · Fig. 14</p>

## The measured answer: $N_{\rm opt} \propto C_{\min}^{0.73}$

<div class="cols">
<div class="text">

- blue: batch-adjusted, $C_{\min}^{0.73}$
- orange: raw fixed batch, $C^{0.88}$
- steps: $C^{0.03}$, nearly flat
- batch $C^{0.24}$, data $C^{0.27}$
- 10x compute: model 5x, data 2x

<p class="q"><b>Q.</b> Which exponent is "Kaplan's"?</p>
<p class="a"><b>A.</b> 0.73, in non-embedding $N$ and $C_{\min}$</p>

</div>
<div class="fig"><img src="img/week-06-kaplan-fig14.png" alt="Kaplan et al. Figure 14: top, compute-efficient model size against compute, N = 1.3e9 C_min^0.73 (adjusted) and N = 1.6e9 C^0.88 (fixed batch); bottom, steps against compute, S_min = 5.4e3 C_min^0.03"></div>
</div>

<p class="footnote">Kaplan et al. 2020 · Fig. 14 (legend), Eq. 6.1, Table 6. Read from checkpoints of the long fixed-schedule runs (§3.3)</p>

Note:
The direct measurement. At each compute budget, find the model size with the lowest loss. In batch-adjusted compute it grows as C_min to the 0.73; in raw compute at the fixed batch, 0.88, printed only in the legend. Steps barely grow (exponent 0.03); the batch takes up most of the rest.
In words, from the caption: for every 10x of compute, about 5x into the model and only 2x into data.
Hold on to how it was measured: these frontier points are checkpoints read partway through the long runs with one fixed schedule. That is the step Chinchilla attacks.

--

<p class="eyebrow"><span class="paper">Kaplan et al. 2020</span> · Experiments 1 and 4 · §6.1 · Fig. 13</p>

## Why adjust for the batch?

<div class="cols">
<div class="text">

- raw compute: $L \propto C^{-0.057}$
- adjusted: $L \propto C_{\min}^{-0.050}$
- adjusted is what to extrapolate

</div>
<div class="fig"><img src="img/week-06-kaplan-fig13.png" alt="Kaplan et al. Figure 13: test loss against compute, raw at fixed batch and adjusted to the critical batch, two parallel power laws"></div>
</div>

<p class="footnote">Kaplan et al. 2020 · Fig. 13, §6: "It is the $L(C_{\min})$ trend that we expect to provide a reliable extrapolation for larger compute"</p>

Note:
Optional. The compute frontier before and after the batch adjustment. The authors trust the adjusted one for extrapolation; Pearce and Song later quote the raw 0.057, a small source of confusion in the literature.

--

<p class="eyebrow"><span class="paper">Kaplan et al. 2020</span> · From experiments 1 and 4 · §1.1 · Fig. 3</p>

## A billion times the compute, spent how?

<div class="cols">
<div class="text">

- model size: over 1,000,000x
- batch: about 100x
- serial steps: under 10x
- data = batch × steps

</div>
<div class="fig"><img src="img/week-06-kaplan-allocation.png" alt="Kaplan et al. Figure 3: over a billion-fold increase in compute, more than a million-fold goes into model size, about 100-fold into batch size and less than 10-fold into serial steps"></div>
</div>

<p class="footnote">Kaplan et al. 2020 · Fig. 3. Data grows only a few hundred-fold ($C^{0.27}$)</p>

Note:
Optional. The same allocation drawn as shares of a billion-fold increase in compute: more than a million-fold into size, about a hundred-fold into batch, under ten-fold into steps.

---

<p class="eyebrow"><span class="paper">Kaplan et al. 2020</span> · From experiments 1 and 4 · §6.1 · Table 6</p>

## What does 100x more compute buy, Kaplan's way?

<div class="cols">
<div class="text">

- parameters: $100^{0.73} \approx 29$x
- batch: $100^{0.24} \approx 3$x
- steps: $100^{0.03} \approx 1.15$x
- tokens: $100^{0.27} \approx 3.5$x

<p class="q"><b>Q.</b> What did labs do with this?</p>
<p class="a"><b>A.</b> Bigger models, about 300B tokens each</p>

</div>
<div class="fig"><img src="img/week-06-kaplan-100x.svg" alt="Illustration: growth for 100x compute under Kaplan's exponents: parameters 28.8x, batch 3.0x, steps 1.1x, tokens 3.5x"></div>
</div>

<p class="footnote">Kaplan et al. 2020 · Table 6 exponents; illustration, our arithmetic. The token exponent is for one epoch of compute-efficient training, not the overfitting rule of §4</p>

Note:
Make it concrete. A hundred times more compute, under Kaplan's exponents: about 29 times the parameters, 3 times the batch, barely more steps, and only 3.5 times the tokens.
This is what people mean when they say Kaplan's laws favour bigger models over more data. It's visible in the models of 2020 to 2021: GPT-3, Gopher, MT-NLG all grew in size while staying near 300 billion training tokens. Chinchilla's first table lists them.

---

<p class="eyebrow"><span class="paper">Kaplan et al. 2020</span> · From experiments 1, 3 and 4 · §6.3 · Fig. 15</p>

## Where do the laws break?

<div class="cols wide-fig">
<div class="text">

- data grows as $C^{0.26}$ (Eq. 6.7)
- avoiding overfitting needs $C^{0.54}$
- the two loss predictions cross: $C^* \sim 10^4$ PF-days
- $N^* \sim 10^{12}$, $L^* \sim 1.7$ nats
- "highly uncertain", 10x either way

<p class="q"><b>Q.</b> A target size?</p>
<p class="a"><b>A.</b> No: a predicted breakdown</p>

</div>
<div class="fig"><img src="img/week-06-kaplan-contradiction.png" alt="Kaplan et al. Figure 15: test loss against compute; the compute-efficient law falls faster than the data-limited law and the two cross near 10^4 PF-days"></div>
</div>

<p class="footnote">Kaplan et al. 2020 · Fig. 15, Eq. 6.6 to 6.8. Conjecture: $L^*$ may estimate "the entropy-per-token of natural language"</p>

Note:
The paper's own warning. Follow the compute-optimal recipe and data grows only as C to the 0.27. But to stay clear of overfitting, data must grow as N to the 0.74, which is C to the 0.54. Extrapolate both and eventually the compute law predicts a loss lower than the data you have could allow. The lines cross near ten thousand PF-days and a trillion parameters, so the laws must break before that.
The authors conjecture the crossing might be where models have extracted everything reliable from text, and L-star, about 1.7 nats per token, might estimate the entropy of language. They flag the numbers as uncertain by ten times either way.
Chinchilla dissolves the contradiction a different way: if data grows as fast as the model, the lines never cross.

---

<p class="eyebrow"><span class="paper">Kaplan et al. 2020</span> · §8 Discussion</p>

## Smooth loss, sudden abilities?

<blockquote>"Smooth quantitative change can mask major qualitative improvements: 'more is different'."</blockquote>

<div class="text">

- loss is an average over all tokens
- one ability can change faster than the average
- this paper measures loss only

</div>

<p class="footnote">Kaplan et al. 2020 · §8. A remark, not a measured result. Readings 3 and 4 today are about exactly this</p>

Note:
One sentence in the discussion points at the second half of today. Loss is an average over every token in the test set; a model could keep improving smoothly on average while some particular ability changes quickly. The paper doesn't test this; it measures only loss. Wei et al. take it up in 2022, and Schaeffer et al. push back in 2023.

---

<p class="eyebrow"><span class="paper">Kaplan et al. 2020</span> · Later work</p>

## Was 0.73 right?

<div class="cols">
<div class="text">

- Chinchilla 2022: $N_{\rm opt} \propto C^{0.50}$
- 100x compute: 10x params, 10x tokens
- not 29x and 3.5x
- why the gap: next two slides

</div>
<div class="fig"><img src="img/week-06-compare-100x.svg" alt="Illustration: growth for 100x compute; Kaplan: parameters 28.8x, tokens 3.5x; Chinchilla: parameters 10x, tokens 10x"></div>
</div>

<p class="footnote">Hoffmann et al. 2022, arXiv:2203.15556, Table 2 (Approach 1); illustration, our arithmetic. Reading 2 covers Chinchilla in full</p>

Note:
The twist, briefly; the next reading is the full story. Two years later, DeepMind asked the same question with runs sized to each budget and found the optimal model grows as compute to the 0.5, not 0.73. For 100 times the compute: 10 times the parameters and 10 times the tokens, not 29 and 3.5.
So the loss laws survived, but the allocation rule didn't. Two 2024 papers explain why Kaplan got his number (sub-slides).

--

<p class="eyebrow"><span class="paper">Kaplan et al. 2020</span> · Later work · Porian et al. 2024</p>

## Why did Kaplan get 0.88?

<div class="cols wide-fig">
<div class="text">

- reproduce Kaplan: 0.84
- count the output layer: 0.71
- warmup sized to the model: 0.60
- tune LR, batch, AdamW $\beta_2$: 0.50
- cosine per budget: adds little

</div>
<div class="fig"><img src="img/week-06-porian-fig1.png" alt="Porian et al. Figure 1: five panels of compute-optimal model size against compute; reproducing Kaplan gives a = 0.835; counting last-layer FLOPs 0.706; correcting warmup 0.602; cosine decay 0.571; optimizer tuning with no decay 0.497"></div>
</div>

<p class="footnote">Porian et al. 2024, arXiv:2406.19146, Fig. 1, Table 1 (RefinedWeb). 16 models, 5M to 901M, over 900 runs; at Kaplan's scale, far below Chinchilla's</p>

Note:
Porian et al. reproduced Kaplan's setup on open data and got the raw exponent back, about 0.84. Then they fixed one thing at a time. Counting the output layer's FLOPs, which matters most for small models: 0.71. Shortening the warmup, which at small budgets is longer than the whole compute-optimal run: 0.60. Tuning the learning rate, batch and AdamW beta-2 for each size: 0.50. Matching cosine decay to each budget, Chinchilla's own explanation, moved it only from 0.60 to 0.57.
Three causes of similar size: the output layer, the warmup, and an untuned optimiser.

--

<p class="eyebrow"><span class="paper">Kaplan et al. 2020</span> · Later work · Pearce &amp; Song 2024</p>

## Is it how parameters are counted?

<div class="cols">
<div class="text">

- take Chinchilla's fitted law
- count Kaplan's way: no embeddings
- at Kaplan's small sizes
- local exponent: 0.74 to 0.78

<p class="q"><b>Q.</b> Their own check?</p>
<p class="a"><b>A.</b> 5 tiny models: 0.49 (total) vs 0.74 (non-embedding)</p>

</div>
<div class="fig"><img src="img/week-06-pearce-fig5.png" alt="Pearce and Song Figure 5: simulated compute-optimal non-embedding parameters against non-embedding compute from Chinchilla's loss model over Kaplan's size range, with local exponent about 0.78"></div>
</div>

<p class="footnote">Pearce &amp; Song 2024, arXiv:2406.12907, Fig. 5, Table 1. Mostly analytic; tiny models 0.8M to 4.6M at context 16. Explains 0.73, not the raw 0.88</p>

Note:
A different route to the same gap, mostly on paper. Take Chinchilla's loss function, which uses total parameters, re-express it in Kaplan's non-embedding units, and look only at Kaplan's small sizes. There the optimum isn't a power law: embeddings are a large share of small models, and the curve bends. Fit a line locally and you get 0.74 to 0.78, close to Kaplan's 0.73.
Their tiny experiment says the same thing directly: the same five runs give 0.49 counted in total parameters and 0.74 counted without embeddings.
Pearce counts total parameters; Porian leaves out the input embeddings. Both find the learning-rate decay matters little. Pearce puts most of the gap on counting; Porian finds the warmup length matters about as much as counting the output layer.

---

<p class="eyebrow"><span class="paper">Kaplan et al. 2020</span> · Summary</p>

## Three kinds of claim, three levels of trust

<table class="rules">
  <tr><td>claim</td><td>example</td><td>status</td></tr>
  <tr><td>observation</td><td>loss vs $N$, $D$, $C$ is a power law</td><td>held up</td></tr>
  <tr><td>fitted model</td><td>$L(N,D)$, $L(N,S)$</td><td>useful, approximate</td></tr>
  <tr class="total"><td>extrapolation</td><td>$N_{\rm opt} \propto C^{0.73}$</td><td>revised to about 0.5</td></tr>
</table>

<p class="footnote">Kaplan et al. 2020 · App. C: "we do not have a solid theoretical understanding for any of our proposed scaling laws"</p>

Note:
Three kinds of claim, and they deserve different trust. The observation, that loss falls as a power law in size, data and compute across many orders of magnitude, has held up. The fitted functions, L(N,D) and L(N,S), add structure beyond the data; they describe the runs well enough to be useful. The extrapolation, how to spend compute far beyond the runs, is the least secure step, and it's the one that was revised.
The authors say plainly they have no theory for any of the laws.

---

<p class="eyebrow"><span class="paper">Kaplan et al. 2020</span> · Summary</p>

## What to keep from Kaplan

<div class="cols">
<div class="text">

- loss is predictable from scale
- size, data, training: each can bottleneck
- laws relate variables, not just slopes
- a good fit ≠ a good optimisation rule

</div>
<div class="text">

<p class="q"><b>Open question</b></p>
<p class="a">Why are there power laws at all?</p>

</div>
</div>

<p class="footnote">Kaplan et al. 2020. Next: Chinchilla revises the allocation</p>

Note:
Four things to keep. Language-model loss improves predictably with scale, which makes planning possible. Size, data and training time interact, and any one can become the bottleneck. Equations like L(N,D) are more useful than single slopes because they say how changing one variable changes the effect of another. And a description of loss that fits the measured range can still give a wrong rule when you optimise and extrapolate with it.
What the paper leaves open, and what later work tries to answer: why should neural language models show power laws at all?


--

<p class="eyebrow"><span class="paper">Kaplan et al. 2020</span> · Later work · why power laws?</p>

## Why are there power laws at all? Five answers

<table class="rules" style="font-size:20px">
  <colgroup><col style="width:48%"><col style="width:32%"><col style="width:20%"></colgroup>
  <tr><td>paper</td><td>the power law comes from</td><td>needs power-law data?</td></tr>
  <tr><td><b>A Solvable Model of Neural Scaling Laws</b><br><small>Maloney, Roberts &amp; Sully 2022</small></td><td>the data's covariance spectrum</td><td>yes</td></tr>
  <tr><td><b>A Neural Scaling Law from the Dimension of the Data Manifold</b><br><small>Sharma &amp; Kaplan 2020</small><br><b>Explaining Neural Scaling Laws</b><br><small>Bahri et al. 2021/2024</small></td><td>resolving a data manifold of dimension $d$</td><td>no, a smooth manifold</td></tr>
  <tr><td><b>The Quantization Model of Neural Scaling</b><br><small>Michaud et al. 2023</small></td><td>many skills, Zipf-frequent</td><td>yes</td></tr>
  <tr><td><b>Superposition Yields Robust Neural Scaling</b><br><small>Liu, Liu &amp; Gore 2025</small></td><td>superposition: overlaps $\sim 1/\text{width}$</td><td>not in the strong regime</td></tr>
  <tr class="total"><td><b>On the origin of neural scaling laws: from random graphs to natural language</b><br><small>Barkeshli, Alfarano &amp; Gromov 2026</small></td><td>not explained; shown without power-law data</td><td>no</td></tr>
</table>

<p class="footnote">Kaplan et al. 2020 §8 hoped for "a 'statistical mechanics' underlying the 'thermodynamics' we have observed"</p>

Note:
Kaplan left the question open; he even hoped for a statistical mechanics underneath the thermodynamics. Here are the main answers proposed since, in one table. They split into two camps. Either the power law is inherited from power laws already in the data, its spectrum or the frequencies of what has to be learned. Or it comes from the learner, from geometry or fluctuations, and would appear even with structureless data. The most recent paper, from Meta FAIR, builds a test case for exactly that question.

--

<p class="eyebrow"><span class="paper">Kaplan et al. 2020</span> · Later work · Maloney, Roberts &amp; Sully 2022</p>

## Is the power law already in the data?

<div class="cols">
<div class="text">

- data covariance spectrum: a power law
- $\lambda_i \sim i^{-(1+\alpha)}$, no gap
- nonlinear features extend it
- loss $\sim N^{-\alpha}$ and $T^{-\alpha}$
- "power-law in, power-law out"

<p class="q"><b>Q.</b> And with a flat spectrum?</p>
<p class="a"><b>A.</b> In their model, no power law at all</p>

</div>
<div class="fig"><img src="img/week-06-origins-maloney.png" alt="Maloney et al. Figure 2 right: the sorted eigenvalue spectrum of GPT-2-embedded WikiText tokens on log-log axes, close to a straight line over several decades"></div>
</div>

<p class="footnote">Maloney, Roberts &amp; Sully 2022 · arXiv:2210.16859 · Fig. 2 (WikiText). Spectrum: sorted eigenvalues of the feature covariance. $N$: features, $T$: samples. A solvable random-feature regression with squared error, not a transformer</p>

Note:
The first answer: the power law is inherited. Take the data, compute the covariance of its features, sort the eigenvalues. For images and for text they fall as a power law over several decades, with no clear cutoff. This is GPT-2-embedded WikiText.
Maloney and coauthors solve a random-feature regression model on data like this. The test loss falls with the same exponent as the spectrum, in both model size and number of samples, and plateaus when the other resource runs out. Their slogan: power-law in, power-law out. If you make the data isotropic, with a flat spectrum, the power law disappears.
The caveat: this is linear regression on random features with squared error. No transformer is trained on language. And the paper prints no fitted exponent for the WikiText spectrum to compare with Kaplan's 0.076.

--

<p class="eyebrow"><span class="paper">Kaplan et al. 2020</span> · Later work · Sharma &amp; Kaplan 2020; Bahri et al.</p>

## What would set the exponent?

<div class="cols">
<div class="text">

- the network carves a data manifold into cells
- halve the cell size: $2^d$ more parameters
- ReLU nets predict $\alpha \approx 4/d$
- GPT-2: $4/\alpha \approx 53$, measured $d \ge 90$

<p class="q"><b>Q.</b> Does language fit $4/d$?</p>
<p class="a"><b>A.</b> Only as a bound: "quite far from equality"</p>

</div>
<div class="fig"><img src="img/week-06-origins-sharma.png" alt="Sharma and Kaplan Figure 1: intrinsic dimension against 4/alpha; teacher-student and image tasks lie near the line ID = 4/alpha, while GPT is a lower-bound arrow well above it"></div>
</div>

<p class="footnote">Sharma &amp; Kaplan 2020 · arXiv:2004.10802 · Fig. 1. Intrinsic dimension: estimated from nearest-neighbour distances of final-layer activations. Bahri et al. 2021/2024 (arXiv:2102.06701) add a "variance-limited" regime with exponent 1</p>

Note:
The second answer is geometric, from Kaplan himself with Sharma. Suppose a network is really doing regression on a smooth manifold of dimension d. Extra parameters buy finer resolution: to halve the size of each region you need 2 to the d times more of them. For piecewise-linear ReLU networks the error per region scales as the fourth power of its size, so the loss falls as N to the minus 4 over d.
It works well when teacher networks set the dimension; that's the figure. For language it doesn't (the arrow at the top right): Kaplan's 0.076 would mean a dimension of about 53, but the measured dimension of GPT-2's representations is above 90. The inequality holds, the equality doesn't, and the authors say so.
Bahri and coauthors extend this into four regimes. Besides this resolution-limited regime, there's a variance-limited one, where one resource is effectively infinite and the exponent is exactly 1 whatever the data. No language models are studied there.

--

<p class="eyebrow"><span class="paper">Kaplan et al. 2020</span> · Later work · Michaud et al. 2023</p>

## Or a long list of skills?

<div class="cols wide-fig">
<div class="text">

- skills ("quanta"): learned or not
- learned in order of use frequency
- Zipf frequencies ▸ power-law loss
- smooth average = many small jumps
- Pythia: 0.083, near Kaplan's 0.076

<p class="q"><b>Q.</b> Do measured frequencies match?</p>
<p class="a"><b>A.</b> Predicted slope $-1.08$, measured $\approx -1.24 \pm 0.2$</p>

</div>
<div class="fig"><img src="img/week-06-origins-michaud.png" alt="Michaud et al. Figure 2: on multitask sparse parity, top row, mean loss against parameters, steps and data follows power laws; bottom row, each subtask's loss drops suddenly at a different scale"></div>
</div>

<p class="footnote">Michaud, Liu, Girit &amp; Tegmark 2023 · arXiv:2303.13506 · Fig. 2. Multitask sparse parity: many parity sub-tasks drawn with Zipf frequencies. The Pythia fit has no floor term (see Barkeshli, below)</p>

Note:
The third answer, the quantization model. Prediction needs many discrete skills, "quanta", each either learned or not. Networks learn them in order of how often they're useful, and those frequencies follow Zipf's law. Learn more quanta and you shrink the tail of unlearned ones, and that tail shrinks as a power law.
In their toy task you can see both levels at once: the mean loss (top) is smooth, while each subtask (bottom) switches on suddenly at its own scale. That links straight to Wei's emergent abilities: a smooth average over many small jumps.
On real models the evidence is rougher. Their Pythia fit gives 0.083, close to Kaplan's 0.076, but without an irreducible-loss term; the predicted and measured frequency slopes agree within large error bars.

--

<p class="eyebrow"><span class="paper">Kaplan et al. 2020</span> · Later work · Liu, Liu &amp; Gore 2025</p>

## Can the model, not the data, make the power law?

<div class="cols wide-fig">
<div class="text">

- more features than dimensions: superposition
- random directions' squared overlaps $\sim 1/m$
- loss $\propto 1/\text{width}$, for many data shapes
- LLMs: width exponent $0.91 \pm 0.04$

<p class="q"><b>Q.</b> Matches Chinchilla?</p>
<p class="a"><b>A.</b> $\alpha_N = 0.35$, $N \propto m^{2.52}$ gives 0.88</p>

</div>
<div class="fig"><img src="img/week-06-origins-liu.png" alt="Liu, Liu and Gore Figure 6: left, mean squared overlap of language-model head vectors against inverse model dimension for OPT, Qwen, GPT-2 and Pythia, slope about 1; right, the model part of the loss against model dimension, slope -0.91"></div>
</div>

<p class="footnote">Liu, Liu &amp; Gore 2025 · arXiv:2505.10465 · Fig. 6. $m$: model width. Toy model plus correlations in real models, not an intervention; data and step scaling not studied</p>

Note:
The fourth answer puts it in the model. A network that stores more features than it has dimensions must let them overlap. In m dimensions, the typical squared overlap of independent isotropic unit directions is one over m. In their toy model, once superposition is strong, that gives a loss falling as one over width across a broad class of feature frequencies.
They measure the output heads of OPT, Qwen, GPT-2 and Pythia: the overlaps scale as about 1 over m, and the model part of the loss falls with width at exponent 0.91. Converting Chinchilla's parameter exponent to width gives 0.88.
It's a toy model plus correlations in real models, not an intervention on superposition, and it says nothing about data scaling.

--

<p class="eyebrow"><span class="paper">Kaplan et al. 2020</span> · Later work · Liu, Liu &amp; Gore 2025</p>

## Why does superposition give $1/m$?

<div class="cols wide-fig">
<div class="text">

- store more features than width $m$
- assign each feature a direction $w_i$
- unrelated directions are almost orthogonal

<div class="eq">$$\mathbb{E}\!\left[(w_i^\top w_j)^2\right] = \frac{1}{m}$$</div>

- interference loss inherits the same scale
- converting width to parameters needs $N(m)$

</div>
<div class="fig"><img src="img/week-06-origins-liu.png" alt="Liu, Liu and Gore Figure 6: language-model head-vector overlaps fall with inverse model width, and the fitted model-dependent loss has width exponent about 0.91"></div>
</div>

<p class="footnote">Liu, Liu &amp; Gore 2025 · Fig. 6. Equation: independent isotropic unit vectors in $m$ dimensions. LLM fit: $\alpha_m = 0.91 \pm 0.04$. $N \propto m^{2.52}$ and $\alpha_N = 0.35$ imply $\alpha_m = 0.88$. Toy mechanism plus correlation</p>

Note:
The previous slide gave the claim; this is the geometric step. Give each feature a unit vector in an m-dimensional hidden space. Two unrelated random directions are nearly orthogonal, but not perfectly. Their dot product has mean zero, while its square has expectation one over m. If reconstruction error is dominated by these cross terms, the loss inherits a one-over-m floor.
That is a power law generated by representation geometry, even when the feature frequencies themselves have no power-law tail. In real language models, Liu, Liu and Gore measure overlaps close to one over width and fit a width exponent of 0.91. They also translate a parameter exponent of 0.35 into a width exponent of 0.88 using the empirical relation between parameter count and width.
The caveat remains: the paper does not intervene on superposition in a language model. The mechanism is established in the toy setting, then compared with correlations in real models.

--

<p class="eyebrow"><span class="paper">Kaplan et al. 2020</span> · Later work · Barkeshli, Alfarano &amp; Gromov 2026</p>

## What if the data has no power laws at all?

<div class="rows">
<div class="points">
<div class="text">

- random walks on a random graph
- no power law in degrees or spectrum
- 2-layer transformer: next node

</div>
<div class="text">

- loss still a power law in $N$ and $D$
- $\overline{\alpha_D} = 1.03$, $\overline{\beta_N} = 0.75$
- beats exponential fits by 7x and 24x

</div>
</div>
<div class="fig"><img src="img/week-06-origins-barkeshli-fig1.png" alt="Barkeshli et al. Figure 1: for random walks on an Erdos-Renyi graph, top row, the compute-optimal loss, model size and token count against compute; bottom row, test loss against model parameters at fixed data and against tokens at fixed model size, all following fitted power laws with a floor"></div>
</div>

<p class="footnote">Barkeshli, Alfarano &amp; Gromov 2026 (Meta FAIR) · arXiv:2601.10684 · Fig. 1. Erdős-Rényi graph: 8,192 nodes, each edge present independently. Their $\alpha_D$ is the exponent in model size at fixed data, $\beta_N$ in data at fixed size. Tiny models, context 50</p>

Note:
The Meta FAIR paper. If the power law comes from the data, a dataset with no power laws anywhere should give no power law. So they built one: random walks on an Erdős-Rényi random graph, where every node has about the same degree and the spectrum has no power law. A 2-layer transformer learns to predict the next node.
The loss still scales as a power law in model size and in data, with a floor: exponents about 1.0 and 0.75, and the power-law fit beats the best exponential by about 7 times in model size and 24 times in data, in squared error. Making the graph scale-free, with a power-law degree distribution, doesn't make the fit cleaner; for model size it's slightly worse.
So "power laws in, power laws out" can't be the whole story. Note the scale, though: tiny models, a 50-token context, and the authors say these graph runs needed careful hyperparameter searches. Also, a simple counting estimator already gives a 1 over D law with no data power law; what's new is a trained transformer showing other exponents.

--

<p class="eyebrow"><span class="paper">Kaplan et al. 2020</span> · Later work · Bahri et al.; Barkeshli et al.</p>

## Why can more data give an algebraic curve?

<div class="cols">
<div class="text">

- estimate a transition probability from $D$ samples

<div class="eq">$$\operatorname{Var}(\hat p) = \frac{p(1-p)}{D}$$</div>

- mean squared error: $D^{-1}$
- typical absolute error: $D^{-1/2}$

</div>
<div class="text">

- Bahri: variance-limited exponent $1$
- counting a bigram table: $E + B/D + O(D^{-2})$
- trained ER transformer: data exponent $0.749$

<p class="q"><b>Q.</b> Does this derive Chinchilla's $0.28$?</p>
<p class="a"><b>A.</b> No. It gives a baseline regime, not the language exponent</p>

</div>
</div>

<p class="footnote">Bahri et al. 2021/2024 · variance-limited regime. Barkeshli et al. 2026 · App. F counting baseline; ER 8K transformer, Fig. 1. $E$: limiting cross-entropy. ER: Erdős–Rényi random graph</p>

Note:
The previous slide already mentioned the counting baseline. Here is why it is algebraic. Estimate one transition probability from D independent samples. Its variance is p times one minus p over D. Mean squared error therefore falls as one over D, while the typical signed or absolute fluctuation is of order one over square root D.
Bahri and coauthors call this the variance-limited regime and predict exponent one under a strong hierarchy between model size and data. Barkeshli and coauthors derive the same leading one-over-D correction for a counting estimator of a bigram table.
The trained transformer on the Erdős–Rényi walks has a data exponent of 0.749 instead. The paper does not explain that gap. Finite-sample variance gives a baseline mechanism, but the different transformer exponent still needs explaining. This calculation does not derive Chinchilla's 0.28 or identify SGD as its cause.

--

<p class="eyebrow"><span class="paper">Kaplan et al. 2020</span> · Later work · Barkeshli et al. 2026, Fig. 2</p>

## From bigrams to real text: how do exponents move?

<div class="cols">
<div class="text">

- bigrams ▸ text from 1-layer ▸ 2-layer model ▸ real text
- model-size exponent: 0.98 ▸ 0.55 ▸ 0.50 ▸ 0.50
- data exponent: about 0.4 to 0.55 throughout
- richer data, smaller size exponent

<p class="q"><b>Q.</b> A clean trend?</p>
<p class="a"><b>A.</b> Mostly one step; the last two overlap</p>

</div>
<div class="fig"><img src="img/week-06-origins-barkeshli-fig2.png" alt="Barkeshli et al. Figure 2 right: model-size exponents against an entropy proxy, with the text endpoint differing across training parameterizations; data exponents stay near 0.5"></div>
</div>

<p class="footnote">Barkeshli et al. 2026 · Fig. 2 (right). "Entropy": the smallest fitted irreducible loss, a rough proxy. Text: Fineweb-edu (educational web text). 2-layer learner, μP</p>

Note:
To see what language adds, they dial up the complexity of the data while keeping the same small learner. Start from a bigram model of web text, then text sampled from a 1-layer and a 2-layer transformer trained on real text, then real text. The x axis is a rough entropy proxy: the lowest irreducible loss their fits find.
The model-size exponent falls from about 1 for bigrams to about 0.5 for text; the data exponent stays around 0.4 to 0.55. Richer data, smaller exponent.
Read it carefully: most of the drop is the first step, from bigrams to 1-layer text; the last two points overlap within their spreads. What sets the value is still open; the paper offers only speculation, such as power laws developing in the model's internal activations.

--

<p class="eyebrow"><span class="paper">Kaplan et al. 2020</span> · Later work · Barkeshli et al. 2026, Fig. 9</p>

## Can we trust the fitted exponents?

<div class="cols">
<div class="text">

- leave out the floor: exponent halves
- Pythia: $N^{-0.083}$ without, $N^{-0.17}$ with
- error 14x lower with the floor
- embeddings counted or not flips Kaplan ▸ Chinchilla

<p class="q"><b>Q.</b> Is Kaplan's 0.076 too small, then?</p>
<p class="a"><b>A.</b> Not tested: nobody refits Kaplan's data with a floor</p>

</div>
<div class="fig"><img src="img/week-06-origins-barkeshli-fig9.png" alt="Barkeshli et al. Figure 9 left: test loss of six Pythia models against non-embedding parameters, fit by N^-0.083 with no floor (dashed) and by E + A N^-0.17 with E = 2.07 (solid), the latter fitting better"></div>
</div>

<p class="footnote">Barkeshli et al. 2026 · Fig. 9 (Pythia losses from Michaud et al.). Their text gives non-embedding allocation (0.742, 0.386); Fig. 12 prints (0.711, 0.294). Kaplan's $L(N)$ has no constant term</p>

Note:
Before explaining an exponent, check how it was measured. Fit a straight line on log-log axes without the floor the loss is heading to, and the exponent comes out about half as large. On the same six Pythia models it's 0.083 without the floor and 0.17 with it, and the fit with the floor has about 14 times lower error. That's exactly Michaud's 0.083 from two slides back.
They also find that, in their 2-layer models, whether you count embedding parameters is enough to move the optimal allocation from Chinchilla-like to Kaplan-like, agreeing with Pearce and Song.
So is Kaplan's 0.076 too small? Kaplan's law has no constant term, so the same bias could apply, but no paper here refits Kaplan's own data. One more caution from checking: the paper's text and its Figure 12 give different numbers for that allocation.

--

<p class="eyebrow"><span class="paper">Kaplan et al. 2020</span> · Later work · summary</p>

## So, why power laws?

<div class="cols">
<div class="text">

- not settled
- inherited from data: spectra, Zipf skills
- from the learner: geometry, superposition
- data without power laws still scales
- exponents depend on how you fit

</div>
<div class="text">

<p class="q"><b>Q.</b> What would decide it?</p>
<p class="a"><b>A.</b> Vary the data's structure, and the learner, independently; measure inside the model</p>

</div>
</div>

<p class="footnote">Maloney et al. 2022; Sharma &amp; Kaplan 2020; Bahri et al. 2021/2024; Michaud et al. 2023; Liu, Liu &amp; Gore 2025; Barkeshli et al. 2026; Cagnetta &amp; Wyart 2024 (arXiv:2406.00048) on language's correlation structure</p>

Note:
Where this leaves Kaplan's open question. There is no settled answer. One camp says the power law is inherited from power laws in the data, its spectrum or the Zipfian frequencies of skills. Another says it comes from the learner, from resolving a manifold or from superposition. The Meta FAIR result pushes against the first camp: a transformer shows power laws on data with none. And the exponents themselves depend on how you fit, especially whether you include a floor.
A decisive test would vary the structure of the data and the learner independently and look inside the model, which is roughly what Barkeshli's group has started to do.


--

<p class="eyebrow"><span class="paper">Bahri et al. 2021/2024</span> · Scaling and architecture</p>

## Do MLPs also show power laws?

<div class="cols wide-fig">
<div class="text">

- yes, in tested regimes
- random features, fully connected nets, CNNs
- architecture can change slope and offset
- a power law alone does not identify the mechanism

<p class="q"><b>Q.</b> Does an ER walk test long-context attention?</p>
<p class="a"><b>A.</b> Its next-step rule needs only the current node</p>

</div>
<div class="fig"><img src="img/week-06-practical-bahri.png" alt="Bahri et al.: fully connected teacher-student networks show power-law loss scaling with dataset size across input dimensions"></div>
</div>

<p class="footnote">Bahri et al. · arXiv:2102.06701 · Appendix, teacher-student dataset-scaling figure. MLP: multilayer perceptron; CNN: convolutional neural network; ER: Erdős–Rényi graph. The same exponent across every architecture is not established. Markov-task observation: ours</p>

Note:
The origin question leads to an engineering question: if the mechanism is not unique to attention, can we use the curves to compare architectures? Yes. Bahri studies random-feature models, fully connected networks, convolutional networks and Wide ResNets. Power laws occur in several settings, but that does not imply that every model has the same exponents in parameters, data and compute.
There is also a task-design issue. An unbiased first-order random walk has a next-state distribution determined by the current node. A lookup table is already a sufficient predictor. An MLP can in principle represent that map too, but its learned curve need not match a transformer. This task cannot establish which architecture best retrieves a fact across thousands of intervening tokens. We need both scaling measurements and tasks that exercise the capability we care about.

--

<p class="eyebrow"><span class="paper">Scaling laws</span> · Architecture comparison · worked example (ours)</p>

## Can the small-model winner lose at scale?

<div class="cols">
<div class="text">

- compare excess loss $\Delta L=L-E$
- let $x=C/C_0$: compute relative to a base budget

<div class="eq">$$\Delta L_A=x^{-0.2}$$</div>
<div class="eq">$$\Delta L_B=2x^{-0.3}$$</div>

- A wins at $x=1$: $1$ versus $2$

</div>
<div class="text">

<div class="eq">$$x^{-0.2}=2x^{-0.3}$$</div>
<div class="eq">$$x^{0.1}=2 \quad\Rightarrow\quad x=1024$$</div>

- both reach $\Delta L=0.25$ at the crossover
- prefactor: vertical shift
- exponent: slope change

</div>
</div>

<p class="footnote">Hypothetical curves and arithmetic: ours. $C$: training compute; $C_0$: base budget. Assumes a shared floor and a scaling regime that persists. These numbers are not measured architecture results</p>

Note:
Choosing the winner at one tiny budget assumes the curves will not cross. This worked example shows why that can fail. Model B starts with twice the excess loss, but has the steeper exponent. Dividing the two equations gives x to the power 0.1 equals 2, so the crossover is 2 to the tenth, or 1024 base budgets. Both excess losses are then one quarter.
A lower prefactor at the same exponent gives a constant ratio of excess losses over the fitted regime. Different exponents make the relative advantage depend on scale. A fitted floor can also change if the model class or allowed context restricts the attainable predictor. None of these quantities should be inferred from a single point, and the example does not justify extrapolating three decades without an intermediate check.

--

<p class="eyebrow"><span class="paper">Hoffmann et al.; Poli et al.; Yang et al.</span> · Practical workflow</p>

## How would we compare candidate architectures?

<div class="cols">
<div class="text">

- fix target data, tokenizer and context
- choose the cost: FLOPs, latency or memory
- tune each candidate's training recipe
- compare several compute budgets

</div>
<div class="text">

- inside each budget, vary size and tokens
- use each architecture's actual compute cost
- reserve a larger scale to test the forecast
- report uncertainty and deployment costs

</div>
</div>

<p class="footnote">Our workflow synthesis from Chinchilla §3, Poli et al. 2024 §4, and Yang et al. 2022. IsoFLOP: equal training floating-point operations. $\mu$P can help width transfer; retuning at each scale is also valid</p>

Note:
First define the intended task and the resource constraint. A model that wins in training FLOPs may lose in decoding latency or cache memory. Hold the held-out distribution, tokenizer and context fixed so that losses mean the same thing. If tokenization changes, use a common unit such as bytes rather than comparing raw per-token losses.
For each candidate, tune learning rate, batch size and schedule fairly. Then compare several budgets, and at each budget explore how to divide resources between model size and training tokens. This estimates a frontier rather than comparing arbitrarily undertrained models. The FLOP formula can differ between recurrent, sparse and attention models, so do not blindly use the same 6ND count for all of them.
Finally reserve a larger scale before choosing the fit. Does the forecast predict that point, with useful uncertainty? If it fails, investigate the regime change before funding a much larger run. Three or four noisy points are not automatically enough to identify a stable floor and two exponents: over a narrow range, the fitted floor and slope can trade off and yield similar losses. Check sensitivity to the floor and the fitting window. Track both tokens processed and distinct examples, since reuse changes coverage and optimization differently.

--

<p class="eyebrow"><span class="paper">Kaplan et al.; Hoffmann et al.</span> · Diagnosing a bottleneck</p>

## What should we change when a curve flattens?

<div class="cols">
<div class="text">

<p class="q"><b>More parameters stop helping</b></p>

- hold the data fixed
- compare training and held-out loss
- add distinct data at the same model size
- test a data bottleneck

</div>
<div class="text">

<p class="q"><b>More data stops helping</b></p>

- hold the model size fixed
- check optimisation and the loss floor
- enlarge the model with a tuned recipe
- test a capacity bottleneck

</div>
</div>

<p class="footnote">Our diagnostic controls, motivated by Kaplan §4 and Chinchilla's joint loss surface. A plateau suggests an intervention to test; it does not identify a unique cause. Distinct data means new examples rather than extra passes over the same set</p>

Note:
A scaling curve is useful as a diagnostic because it tells us which controlled intervention could be informative. If increasing model size gives no held-out improvement while training loss keeps falling, more distinct data is a natural next control. Keep the model fixed and change the data supply. Keep processed-token compute fixed by comparing fresh examples with reuse, or compare properly tuned, near-converged runs and report their different costs. Otherwise extra optimization steps can masquerade as a coverage effect. If fresh examples restart the improvement under the matched comparison, the data-bottleneck interpretation has support.
Conversely, if more data gives little improvement at fixed model size, check whether the optimizer is actually using the extra data and whether the loss is already near its attainable floor. Then test a larger model. The diagnosis comes from the response to the intervention, not from naming the shape of the original curve. Noise, a distribution mismatch, a short context, and a poor recipe can all mimic saturation.

--

<p class="eyebrow"><span class="paper">Poli et al. 2024</span> · §4 · Batch size and learning rate</p>

## Could training settings fake an architectural limit?

<div class="cols wide-fig">
<div class="text">

- changing batch within an IsoFLOP group biases it
- optimal learning rate can drift with width
- retune before blaming capacity
- $\mu$P helps control width scaling

<p class="q"><b>Q.</b> Is a bad fitted slope a diagnosis?</p>
<p class="a"><b>A.</b> First test whether tuning changes it</p>

</div>
<div class="fig"><img src="img/week-06-practical-batch.png" alt="Poli et al. batch-size comparison: different batch-scaling choices change the measured compute-efficient frontier"></div>
</div>

<p class="footnote">Poli et al. · arXiv:2403.17844 · §4, batch-size figure. Yang et al. · arXiv:2203.03466. $\mu$P: maximal update parameterization, a rule for scaling initialization and learning rates with width</p>

Note:
Before declaring that an architecture has a worse exponent, ask whether its training recipe became worse as it grew. In this figure, jumping the batch size after one billion parameters within an IsoFLOP group makes larger models appear worse and shifts the estimated optimal model size down. The authors recommend scaling batch across compute budgets while keeping it fixed within a group. This is a concrete recipe confound, not a general claim that larger batches are worse.
There are two reasonable controls. Retune each scale, with a fair tuning budget, or use an appropriate parameterization to reduce width-related drift and verify that the optima transfer. Maximal update parameterization, muP, supports the second approach within model families. It does not automatically transfer settings across arbitrary architecture changes, depth, datasets or context lengths.

--

<p class="eyebrow"><span class="paper">Barkeshli et al.; Poli et al.; Gu &amp; Dao</span> · Choosing a proxy task</p>

## Which small task tests the intended architecture?

<div class="cols">
<div class="text">

- Markov walk: local transition learning
- recall over distractors: retrieval
- selective copying: retain relevant tokens
- sweep distance and task difficulty

</div>
<div class="text">

<p class="q"><b>Known entropy floor?</b></p>
<p class="a">Useful when the generator makes it calculable</p>
<p class="q"><b>Proxy success?</b></p>
<p class="a">Check that the ranking survives on target data</p>

</div>
</div>

<p class="footnote">Poli et al. §3, §5; Gu &amp; Dao §4.1; Barkeshli et al. App. F. Recall: recover a value associated with a key seen earlier. A source entropy and a fitted finite-model loss floor need not coincide</p>

Note:
The proxy must contain the operation whose efficiency we are trying to compare. A random walk probes learning local transition probabilities. It is a useful control, but cannot rank architectures for long-distance recall by itself. For that, put key-value pairs in a sequence, insert distractors, and increase the gap. Selective copying changes the spacing so that remembering positions is insufficient and the model must choose which content to keep.
Controlled generators can provide a known entropy baseline, such as the conditional entropy of the next state in a known graph. But synthetic does not automatically mean every relevant entropy is known. Finite context, hidden teacher state, or a restricted predictor can introduce additional uncertainty. Use the theoretical floor as a baseline and inspect the residual, then validate the proxy ranking on real target data.

--

<p class="eyebrow"><span class="paper">Yang et al. 2022</span> · Tensor Programs V · Tuning transfer</p>

## Has tuning on a tiny proxy worked at scale?

<div class="cols wide-fig">
<div class="text">

- tune a 40M-parameter proxy
- transfer settings to 6.7B parameters
- tuning cost: 7% of target pretraining
- held-out loss: 2.03 to 1.98

<p class="q"><b>Q.</b> What transfers most directly?</p>
<p class="a"><b>A.</b> Width within the tested model family</p>

</div>
<div class="fig"><img src="img/week-06-practical-mup.png" alt="Yang et al. Figure 1: learning-rate optima drift across widths under standard parameterization and align more closely under maximal update parameterization"></div>
</div>

<p class="footnote">Yang et al. · arXiv:2203.03466 · Fig. 1, §7.4 GPT-3 experiment. HP: hyperparameter. Baseline uses absolute attention and FP16; transferred model uses relative attention and FP32. The loss improvement has these confounds</p>

Note:
This is a concrete example of reducing the cost of tuning. The authors shrink a GPT-3-like model from width 4096 to 256, yielding a roughly 40-million-parameter proxy. They tune it and transfer the settings to a 6.7-billion-parameter target, about 168 times larger. Tuning costs seven percent of the target pretraining cost, and their target validation loss is 1.98 compared with 2.03 for a baseline re-run.
The figure shows the underlying width-transfer idea: learning-rate optima line up better under muP. The large-model improvement is useful evidence but not a perfectly isolated tuning effect. The baseline used absolute rather than relative attention, and numerical problems led the transferred model to use FP32 while the baseline used FP16. The authors disclose both differences. Depth transfer and initialization also have caveats, so this is not a promise that a tiny proxy predicts every architectural change.

--

<p class="eyebrow"><span class="paper">Poli et al. 2024</span> · Mechanistic Architecture Design</p>

## Did synthetic tasks predict better language models?

<div class="cols wide-fig">
<div class="text">

- MAD: recall, copying, compression tests
- validate on over 500 language models
- model sizes: 70M to 7B
- better proxy scores track lower perplexity
- tested optimum: 1 attention layer per 3 Hyena layers

</div>
<div class="fig"><img src="img/week-06-practical-mad.png" alt="Poli et al.: Hyena variants' MAD scores correlate with compute-optimal Pile perplexity at a budget of two times ten to the nineteenth FLOPs"></div>
</div>

<p class="footnote">Poli et al. · ICML 2024 · §4–5, aggregate MAD-to-scale panel at $2\times10^{19}$ FLOPs. MAD: Mechanistic Architecture Design; The Pile: text corpus; perplexity: $e^{\text{cross-entropy}}$. Cross-family prediction is noisier; 25% is specific to their compute objective and tested settings</p>

Note:
MAD is the closest published match to the proposed workflow. The authors evaluate synthetic capability tasks, use them to improve candidate architectures, and then check the predictions with more than 500 language-model runs from 70 million to 7 billion parameters. The figure follows progressively improved Hyena variants: stronger synthetic performance tracks lower language perplexity at a fixed compute budget.
They also measure hybridization choices. In their tested StripedHyena settings, making one in four sequence-mixing layers attention is best for training compute, while optimizing state memory shifts the preferred ratio. The percentage is a layer count, not a percentage of parameters or FLOPs. This supports a bounded design method: use proxies to screen and diagnose, then validate the resulting architecture on the target scaling curve. Correlations across different architecture families are noisier, and this paper does not establish that MAD directly created every later named production hybrid.

--

<p class="eyebrow"><span class="paper">Gu &amp; Dao 2023/2024</span> · Mamba · Diagnosis and validation</p>

## Can a small test reveal a useful architectural change?

<div class="cols wide-fig">
<div class="text">

- selective copying defeats position shortcuts
- Mamba block + fixed S4 layer: 56.4%
- same block + selective S6 layer: 99.8%
- language sweep: 125M to 1.3B parameters
- matches strong Transformer++ over tested scales

</div>
<div class="fig"><img src="img/week-06-practical-mamba.png" alt="Mamba paper's 8K-context language scaling comparison against Transformer, Transformer++, and other sequence architectures"></div>
</div>

<p class="footnote">Gu &amp; Dao · arXiv:2312.00752 · §4.1–4.2, selective-copy table and 8K scaling panel. S4: fixed state-space dynamics; S6: input-dependent selection. Transformer++: tuned Transformer with RoPE and SwiGLU. LM sweep uses about 20 tokens per parameter, not a full allocation search</p>

Note:
Mamba provides a useful example of diagnosing a missing operation before scaling. Ordinary copying can be solved by tracking positions. Randomizing the spacing forces a model to select relevant content. In the paper's ablation, a Mamba block with an S4 layer scores 56.4 percent, and changing the layer to selective S6 raises that to 99.8 percent. Those are synthetic-task accuracies, not language-model scores.
The selective layer makes the step size and input/output maps depend on the token. The authors then validate the complete model on language, from roughly 125 million to 1.3 billion parameters and at 2K and 8K context. The plotted result matches a strong Transformer baseline over that range. The sweep uses roughly 20 tokens per parameter rather than independently optimizing every architecture's allocation at each compute budget. It does not establish identical asymptotic exponents, or a guarantee at 100 billion parameters.

--

<p class="eyebrow"><span class="paper">Dai et al. 2024</span> · DeepSeekMoE · Ablate, then scale</p>

## Did smaller ablations guide expert design?

<div class="cols wide-fig">
<div class="text">

- start at 2B total, 0.3B active parameters
- match total and active counts in ablations
- test smaller experts and shared experts
- scale the design to 16.4B total, 2.8B active
- comparable to DeepSeek 7B at 40.5% compute

</div>
<div class="fig"><img src="img/week-06-practical-deepseek.png" alt="DeepSeekMoE expert-design ablations: normalized benchmark performance as shared experts and finer expert segmentation are introduced"></div>
</div>

<p class="footnote">Dai et al. · arXiv:2401.06066 · §4.4, §5, Table 3. MoE: mixture of experts; active parameters process a token, total parameters must be stored. Larger comparison uses the same 2T-token corpus. Smaller-scale ablations, not a proof of a new scaling exponent</p>

Note:
DeepSeekMoE is another form of evidence: controlled smaller ablations followed by a larger validation. At about two billion total parameters and 0.3 billion active parameters, the authors compare expert designs while holding total and active counts matched. Finer segmentation and shared experts improve their benchmark results. The figure shows normalized scores rather than fitted power-law exponents.
They then train a 16.4-billion-total-parameter model with 2.8 billion active parameters. Against dense DeepSeek 7B on the same two-trillion-token corpus, Table 3 reports broadly comparable performance with 40.5 percent of the computation, with differences by task. This supports the design-and-validation workflow. It does not show that MLA or all subsequent DeepSeek choices were discovered entirely through tiny scaling curves. It also illustrates why active compute and stored memory must be measured separately.

--

<p class="eyebrow"><span class="paper">Scaling laws</span> · Practical synthesis</p>

## What evidence earns a larger training run?

<div class="cols">
<div class="text">

- proxy tests exercise the intended capability
- the gain survives fair tuning
- several budgets support the comparison
- a reserved larger scale matches the forecast

</div>
<div class="text">

- check latency and stored state too
- use failed forecasts to choose controls
- keep extrapolation within tested assumptions

<p class="q"><b>Q.</b> Must the microscopic theory be settled?</p>
<p class="a"><b>A.</b> An empirical forecast can be useful while its mechanism remains open</p>

</div>
</div>

<p class="footnote">Our synthesis of Yang et al., Poli et al., Gu &amp; Dao, Dai et al., and the earlier scaling papers. Evidence to prioritize an experiment, not a guarantee of frontier-scale performance</p>

Note:
The practical payoff is a sequence of increasingly expensive checks. A proxy reveals whether a design has the operation we want. Fair tuning checks that the apparent gain survives optimizer choices. Several budgets show whether the advantage persists or the curves cross. A reserved larger scale tests the extrapolation before the biggest commitment. Deployment measurements add the memory and latency costs that training loss alone misses.
When the forecast fails, that is useful information: check the data regime, context, floor, optimization and compute accounting. A theory of the microscopic origin would help choose better interventions, but empirical model selection does not have to wait for it. What we should carry forward is a measured advantage over a stated range, together with the assumptions that make a larger test worth doing.





---

<!-- .slide: class="cover divider" -->

<p class="kicker">Reading 2 of 4</p>
<h1>Hoffmann et al. 2022</h1>
<p class="subtitle">Training Compute-Optimal Large Language Models (Chinchilla)</p>
<p class="question">For a fixed budget: a bigger model, or more data?</p>
<ol class="track"><li class="done">Kaplan 2020<span>scaling laws</span></li><li class="now">Chinchilla 2022<span>compute-optimal training</span></li><li>Wei 2022<span>emergent abilities</span></li><li>Schaeffer 2023<span>a mirage?</span></li></ol>

Note:
Reading 2 of 4. Hoffmann, Borgeaud, Mensch and others at DeepMind, March 2022. The same question as Kaplan's compute-allocation result, asked again with a different experimental design, and a different answer.

---

<p class="eyebrow"><span class="paper">Hoffmann et al. 2022 (Chinchilla)</span> · §1 Introduction</p>

## Same question, opposite answer?

<div class="cols">
<div class="text">

- Kaplan: $N_{\rm opt} \propto C^{0.73}$, $D_{\rm opt} \propto C^{0.27}$
- Chinchilla: $N_{\rm opt} \propto C^{0.50}$, $D_{\rm opt} \propto C^{0.50}$
- 100x compute: 29x and 3.5x, or 10x and 10x
- size and data should grow together

<p class="q"><b>Q.</b> Isn't "train longer" obvious?</p>
<p class="a"><b>A.</b> The claim is about the <i>balance</i>, and how it moves with scale</p>

</div>
<div class="fig"><img src="img/week-06-compare-100x.svg" alt="Illustration: growth for 100x compute; Kaplan: parameters 28.8x, tokens 3.5x; Chinchilla: parameters 10x, tokens 10x"></div>
</div>

<p class="footnote">Hoffmann et al. 2022 · arXiv:2203.15556 · Table 2; Kaplan et al. 2020 Table 6. Illustration from the exponents, our arithmetic</p>

Note:
Kaplan said: as compute grows, put most of it into parameters. Chinchilla says: grow parameters and training tokens at the same rate. For a hundred times the compute that's ten times the parameters and ten times the tokens, instead of Kaplan's 29 times and 3.5 times.
The point is not that training longer helps; everyone knew that. It's that the compute-optimal balance between size and data changes with scale in a specific way, and that the big models of 2021 had put too much of their compute into parameters.

---

<p class="eyebrow"><span class="paper">Hoffmann et al. 2022 (Chinchilla)</span> · §1 · Table 1</p>

## Why did every big model see about 300B tokens?

<div class="cols">
<div class="text">

<table class="rules">
  <tr><td>model</td><td class="num">params</td><td class="num">tokens</td></tr>
  <tr><td>LaMDA</td><td class="num">137B</td><td class="num">168B</td></tr>
  <tr><td>GPT-3</td><td class="num">175B</td><td class="num">300B</td></tr>
  <tr><td>Jurassic</td><td class="num">178B</td><td class="num">300B</td></tr>
  <tr><td>Gopher</td><td class="num">280B</td><td class="num">300B</td></tr>
  <tr><td>MT-NLG</td><td class="num">530B</td><td class="num">270B</td></tr>
  <tr class="total"><td>Chinchilla</td><td class="num">70B</td><td class="num">1.4T</td></tr>
</table>

</div>
<div class="text">

- GPT-3 (2020) to MT-NLG (2022): about 3x
- tokens stayed near 300B
- that is Kaplan's rule in practice

<p class="q"><b>Q.</b> What does Chinchilla bet?</p>
<p class="a"><b>A.</b> Same compute as Gopher, a quarter of the size</p>

</div>
</div>

<p class="footnote">Hoffmann et al. 2022 · Table 1</p>

Note:
The state of play in 2022. Following Kaplan, models had grown from GPT-3's 175 billion to MT-NLG's 530 billion parameters, while training data stayed near 300 billion tokens. The last row is the paper's bet: a 70B model on 1.4 trillion tokens, with the same compute as the 280B Gopher.

---

<p class="eyebrow"><span class="paper">Hoffmann et al. 2022 (Chinchilla)</span> · §4 · Tables 1, 6</p>

## The headline experiment

<div class="cols">
<div class="text">

<table class="rules">
  <tr><td></td><td class="num">Gopher</td><td class="num">Chinchilla</td></tr>
  <tr><td>parameters</td><td class="num">280B</td><td class="num">70B</td></tr>
  <tr><td>training tokens</td><td class="num">300B</td><td class="num">1.4T</td></tr>
  <tr><td>training FLOPs</td><td class="num">$5.76\times10^{23}$</td><td class="num">same</td></tr>
  <tr class="total"><td>MMLU, 5-shot</td><td class="num">60.0%</td><td class="num">67.6%</td></tr>
</table>

</div>
<div class="text">

- a quarter of the size, 4.7x the tokens
- better, with a quarter of the weights to serve

<p class="q"><b>Q.</b> What else changed?</p>
<p class="a"><b>A.</b> Optimizer (AdamW), tokenizer, data mix</p>

</div>
</div>

<p class="footnote">Hoffmann et al. 2022 · Tables 1, 6, §4.1. MMLU: multiple-choice exams in 57 subjects. The abstract says 67.5%; Table 6 says 67.6%</p>

Note:
The experiment that made the paper famous. Gopher and Chinchilla have the same training compute. Chinchilla is a quarter of the size and sees almost five times the tokens, and it's better on almost everything: MMLU goes from 60.0 to 67.6%, 7.6 points.
Two reasons this matters. It shows the scaling-law argument has consequences far beyond a small change in loss. And the smaller model is about four times cheaper to serve and easier to fine-tune.
Keep one qualification in mind, which we come back to: Chinchilla also changed optimizer, tokenizer and data mix, so this isn't a perfectly controlled swap of size for data.

---

<p class="eyebrow"><span class="paper">Hoffmann et al. 2022 (Chinchilla)</span> · §1 · Eq. 1</p>

## What exactly are they optimising?

<div class="cols">
<div class="text">

<div class="eq">$$(N_{\rm opt}, D_{\rm opt}) = \underset{N,\thinspace D}{\operatorname{argmin}}\ L(N,D) \quad \text{s.t.}\quad \mathrm{FLOPs}(N,D) = C$$</div>

- $N$: parameters; $D$: training tokens
- $C$: training FLOPs, with $\mathrm{FLOPs} \approx 6ND$
- one budget, many ways to spend it

</div>
<div class="text">

<p class="q"><b>Q.</b> Why $6ND$?</p>
<p class="a"><b>A.</b> Forward $2N$ + backward $4N$ per token (as in Kaplan)</p>
<p class="q"><b>Q.</b> Exact?</p>
<p class="a"><b>A.</b> An approximation; their own count is within 10%</p>

</div>
</div>

<p class="footnote">Hoffmann et al. 2022 · Eq. 1 (§1), App. F (Table A4: their FLOP count over $6ND$ is 0.99 to 1.10). Unlike Kaplan, $N$ includes the embeddings</p>

Note:
The whole paper is one constrained optimisation. Choose the number of parameters and the number of training tokens to minimise the final loss, subject to the compute being fixed. Compute is about 6 N D, the same per-token cost as Kaplan's 6N.
They also count FLOPs more carefully in an appendix; their count is within 10% of 6ND for their models. And a difference that matters later: Chinchilla counts all parameters, including embeddings.

---

<p class="eyebrow"><span class="paper">Hoffmann et al. 2022 (Chinchilla)</span> · §1 · worked example</p>

## One budget, four ways to spend it

<div class="cols">
<div class="text">

<table class="rules">
  <tr><td>parameters</td><td class="num">tokens</td><td class="num">predicted loss</td></tr>
  <tr><td>100M</td><td class="num">10T</td><td class="num">2.56</td></tr>
  <tr><td>1B</td><td class="num">1T</td><td class="num">2.22</td></tr>
  <tr><td>10B</td><td class="num">100B</td><td class="num">2.19</td></tr>
  <tr class="total"><td>100B</td><td class="num">10B</td><td class="num">2.41</td></tr>
</table>

- all cost $6\times10^{21}$ FLOPs
- too small: no capacity
- too big: too few tokens

</div>
<div class="fig"><img src="img/week-06-chinchilla-one-budget.svg" alt="Illustration from Chinchilla's fitted loss at a fixed budget of 6e21 FLOPs: predicted loss against parameters is U-shaped, 2.56 for 100M on 10T tokens, 2.22 for 1B on 1T, 2.19 for 10B on 100B, 2.41 for 100B on 10B"></div>
</div>

<p class="footnote">Hoffmann et al. 2022 · losses from the fitted $L(N,D)$ of App. D.2 (next section); illustration, our arithmetic</p>

Note:
Make the trade-off concrete. Fix a budget of 6 times 10 to the 21 FLOPs. You could train 100 million parameters on 10 trillion tokens, or a billion on a trillion, or 10 billion on 100 billion, or 100 billion on 10 billion: same cost each time.
They aren't equally good. Using the paper's own fitted loss function (we derive it later), the tiny model is capacity-limited, the huge one has barely trained, and the best is in between, around a few billion parameters.
And crucially, the bottom of this U moves as the budget changes. The paper's job is to find out how.

---

<p class="eyebrow"><span class="paper">Hoffmann et al. 2022 (Chinchilla)</span> · §3</p>

## How did they measure it?

<div class="cols">
<div class="text">

- over 400 runs
- 70M to 16B parameters
- 5B to 500B tokens
- MassiveText; also C4, GitHub
- schedule matched to each run's length
- three methods, one answer?

</div>
<div class="text">

<p class="q"><b>Q.</b> The key change from Kaplan?</p>
<p class="a"><b>A.</b> Learning-rate decay set to the planned run length</p>
<p class="q"><b>Q.</b> Are the three methods independent?</p>
<p class="a"><b>A.</b> No, they share the runs. Cross-checks, not replications</p>

</div>
</div>

<p class="footnote">Hoffmann et al. 2022 · abstract, §3. "Over 400" counts runs; Table A9 lists 50 configurations from 44M to 16B. §1 says "5B to over 400B" tokens</p>

Note:
The experiments. More than 400 training runs, from about 70 million to over 16 billion parameters, on 5 to 500 billion tokens of MassiveText, DeepMind's corpus, with checks on C4 and GitHub code.
The key design change from Kaplan: they vary model size and training length together, and they set the learning-rate schedule to the planned length of each run.
Then they estimate the optimal allocation three ways. That's a strength: they don't fit one equation and trust it. But the three methods share the same runs, so they're cross-checks rather than independent replications.

---

<p class="eyebrow"><span class="paper">Hoffmann et al. 2022 (Chinchilla)</span> · §3.1 Approach 1 · Fig. 2</p>

## Which model is best at each budget?

<div class="rows">
<div class="points">
<div class="text">

- train many sizes; plot loss vs FLOPs
- $L_{\rm best}(C) = \min_N L_N(C)$: the lower envelope
- the winning size changes with $C$

</div>
<div class="text">

- envelope point ▸ $N_{\rm opt}(C)$, $D_{\rm opt}(C)$
- fit: $N_{\rm opt} \propto C^{0.50}$, $D_{\rm opt} \propto C^{0.50}$
- at Gopher's budget: 67B, 1.5T tokens

</div>
</div>
<div class="fig"><img src="img/week-06-chinchilla-approach1-fig2.png" alt="Hoffmann et al. Figure 2: left, training loss against FLOPs for models from 75M to 10B with the lower envelope in grey; middle and right, parameters and tokens at the envelope against FLOPs, straight lines projecting 67B parameters and 1.5T tokens at Gopher's budget"></div>
</div>

<p class="footnote">Hoffmann et al. 2022 · Fig. 2, §3.1. 1,500 log-spaced FLOP values; every selected point lies in the last 15% of its run</p>

Note:
Approach 1. Train models of many sizes and plot every training curve against compute (left). A small model improves fast but hits its capacity limit; a big one is wasteful at small budgets but wins once there's enough compute. So the identity of the best model changes with the budget.
Take the lower envelope, the best loss reached at each FLOP count, and note which size and how many tokens produced it. Middle and right: both grow as compute to the 0.50. At Gopher's budget that projects 67 billion parameters on 1.5 trillion tokens, not 280 billion on 300 billion.

---

<p class="eyebrow"><span class="paper">Hoffmann et al. 2022 (Chinchilla)</span> · §3.1</p>

## Why train each size four times?

<div class="cols">
<div class="text">

- a checkpoint ≠ a run planned to stop there
- mid-run, the learning rate is still high
- so the loss looks worse than it should
- fix: 4 cosine schedules per size
- horizons spanning 16x; take the best

</div>
<div class="text">

<p class="q"><b>Q.</b> Why does this matter?</p>
<p class="a"><b>A.</b> It's exactly Kaplan's setup: one long schedule, read mid-run</p>
<p class="q"><b>Q.</b> How much does it change?</p>
<p class="a"><b>A.</b> See App. B (end of section)</p>

</div>
</div>

<p class="footnote">Hoffmann et al. 2022 · §3.1: learning rate decayed 10x "over a horizon ... that ranges by a factor of $16\times$"; curves smoothed (Gaussian, 10 steps) and interpolated</p>

Note:
A subtle point that turns out to be the crux of the disagreement with Kaplan. A checkpoint taken halfway through a long run isn't the same as a run planned to stop there. Mid-run the learning rate is still high, so the loss is worse than a run of that length with a properly decayed schedule would reach.
So for each size they train four runs with cosine schedules whose lengths span a factor of 16, and at each compute budget they use whichever run did best there. Kaplan read his compute frontier off checkpoints of runs scheduled for 130 billion tokens.

---

<p class="eyebrow"><span class="paper">Hoffmann et al. 2022 (Chinchilla)</span> · §3.2 Approach 2 · Fig. 3</p>

## At a fixed budget, is there a best size?

<div class="rows">
<div class="points">
<div class="text">

- fix $C$; vary $N$; set $D = C/6N$
- measures $L_C(N) = L(N, C/6N)$
- 9 budgets, $6\times10^{18}$ to $3\times10^{21}$

</div>
<div class="text">

- every budget: a U-shaped valley
- parabola fit finds the bottom
- $N_{\rm opt} \propto C^{0.49}$, $D_{\rm opt} \propto C^{0.51}$

</div>
</div>
<div class="fig"><img src="img/week-06-chinchilla-isoflop.png" alt="Hoffmann et al. Figure 3: left, final training loss against parameters for nine fixed FLOP budgets, each a U-shaped valley whose minimum moves right as the budget grows; middle and right, the minima against FLOPs projecting 63B parameters and 1.4T tokens at Gopher's budget"></div>
</div>

<p class="footnote">Hoffmann et al. 2022 · Fig. 3, §3.2. Models up to 16B. At Gopher's budget: 63B parameters, 1.4T tokens</p>

Note:
Approach 2, the clearest picture in the paper. Hold the compute budget fixed and train models of different sizes, each on however many tokens that budget allows. Each budget is one curve of loss against size.
Every curve is a valley, and the bottoms move right as compute grows. Fit a parabola to each valley to find its minimum, then fit a power law through the minima: 0.49 for parameters, 0.51 for tokens. Almost the same as Approach 1.
Why this matters: the conclusion doesn't depend on the envelope trick. It's visible directly in finished runs that each used the same budget.

---

<p class="eyebrow"><span class="paper">Hoffmann et al. 2022 (Chinchilla)</span> · §3.2</p>

## Why is each curve a U?

<div class="cols">
<div class="text">

- left: small $N$, huge $D$
- capacity-limited
- right: big $N$, tiny $D$
- under-trained
- bottom: the marginal gains balance

<p class="q"><b>Q.</b> Seen this before?</p>
<p class="a"><b>A.</b> Kaplan Fig. 11, left panel</p>

</div>
<div class="fig"><img src="img/week-06-chinchilla-one-budget.svg" alt="Illustration from Chinchilla's fitted loss at 6e21 FLOPs: a U-shaped curve of predicted loss against parameters"></div>
</div>

<p class="footnote">Hoffmann et al. 2022 · §3.2; illustration from the fitted law (App. D.2)</p>

Note:
Walk along one curve. On the left the model is tiny and sees an enormous number of tokens; it can't use them, it's capacity-limited. Moving right, more parameters help, so the loss falls. But at fixed compute each step right also cuts the tokens, and eventually the model is too under-trained and the loss rises again.
The minimum is where the gain from one more parameter exactly balances the cost of the tokens you give up for it. Kaplan's Figure 11 showed the same U; the two papers disagree about where the bottom sits and how fast it moves.

---

<p class="eyebrow"><span class="paper">Hoffmann et al. 2022 (Chinchilla)</span> · §3.3 Approach 3 · Eq. 2</p>

## Can one equation predict the loss?

<div class="rows">
<div class="points">
<div class="text">

<div class="eq">$$\hat L(N,D) = E + \frac{A}{N^{\alpha}} + \frac{B}{D^{\beta}}$$</div>

</div>
<div class="text">

- $E = 1.69$, $A = 406.4$, $B = 410.7$
- $\alpha = 0.34$, $\beta = 0.28$
- fit: Huber loss on log loss, L-BFGS

</div>
</div>
<div class="fig"><img src="img/week-06-chinchilla-approach3.png" alt="Hoffmann et al. Figure 4: left, iso-loss contours of the fitted function over parameters and FLOPs with the efficient frontier in blue; right, IsoFLOP slices through the fitted surface"></div>
</div>

<p class="footnote">Hoffmann et al. 2022 · Eq. 2, §3.3, App. D.2, Fig. 4. Huber $\delta = 10^{-3}$; many initialisations. $N$ in parameters, $D$ in tokens</p>

Note:
Approach 3 is more ambitious: one function that predicts the loss for any size and any number of tokens. An irreducible constant, plus a term that falls with model size, plus a term that falls with tokens. Fitted to all the final losses: E 1.69, A 406, B 411, alpha 0.34, beta 0.28.
They fit it with a Huber loss on the log of the loss, which is robust to outliers and cares about proportional error, using L-BFGS from many starting points. The fitting choices matter, as a 2024 replication found (sub-slide below the next slides).
Because it's an explicit formula, you can do calculus on it: that's how the allocation exponents come out.

---

<p class="eyebrow"><span class="paper">Hoffmann et al. 2022 (Chinchilla)</span> · §3.3 · App. D.2</p>

## What does each term mean?

<div class="cols">
<div class="text">

- $E$: loss of an ideal predictor
- conceptually $H(\text{next token} \mid \text{past})$
- $A/N^{\alpha}$: limited capacity
- $B/D^{\beta}$: limited training
- under one epoch: not overfitting

</div>
<div class="text">

<p class="q"><b>Q.</b> Is $E$ the entropy of English?</p>
<p class="a"><b>A.</b> No: a fitted, extrapolated number for this data and tokenizer</p>
<p class="q"><b>Q.</b> Do the terms really add?</p>
<p class="a"><b>A.</b> Assumed. Motivated, not proven</p>

</div>
</div>

<p class="footnote">Hoffmann et al. 2022 · §3.3, App. D.2: "a classical risk decomposition" into "a function approximation term and an optimisation suboptimality term"</p>

Note:
Read the three terms. E is what even a perfect model would lose. The authors call it the entropy of natural text: conceptually the conditional entropy of the next token given its context (up to the sequence length), under the true distribution. If several next words are equally plausible after a context, no predictor can know which one a random continuation will use, so some uncertainty can't be removed.
The A term is the gap between a perfect predictor and the best Transformer with N parameters: limited capacity. The B term is the extra loss from seeing only D tokens: since every run is under one epoch, it's mostly incomplete optimisation and gradient noise, not classical overfitting.
Two cautions. E is fitted and extrapolated, tied to this data and tokenizer, not a measured constant of language. And the additive form is an assumption, motivated by a risk decomposition in the appendix, not something the paper proves.

---

<p class="eyebrow"><span class="paper">Hoffmann et al. 2022 (Chinchilla)</span> · §3.3 · compared with Kaplan</p>

## How is this different from Kaplan's $L(N,D)$?

<div class="cols">
<div class="text math-block">

Kaplan:
<div class="eq">$$L = \Big[\Big(\frac{N_c}{N}\Big)^{\alpha_N/\alpha_D} + \frac{D_c}{D}\Big]^{\alpha_D}$$</div>

Chinchilla:
<div class="eq">$$L = E + \frac{A}{N^{\alpha}} + \frac{B}{D^{\beta}}$$</div>

</div>
<div class="text">

- Kaplan: two limits nested in one power
- Chinchilla: two terms added, plus a floor
- Kaplan's loss goes to 0; Chinchilla's to $E$

<p class="q"><b>Q.</b> Which is right?</p>
<p class="a"><b>A.</b> Both are assumptions; they differ most far outside the data</p>

</div>
</div>

<p class="footnote">Kaplan et al. 2020 Eq. 1.5; Hoffmann et al. 2022 Eq. 2</p>

Note:
These aren't the same function with different numbers. Kaplan nests the two limits, model-limited and data-limited, inside one power. Chinchilla adds two separate power-law penalties to a floor. Kaplan's laws go to zero loss at infinite scale, which can't be right for text; Chinchilla's go to E.
Both are empirical assumptions that fit the measured range. They behave differently far outside it, which is exactly where you extrapolate to.

---

<p class="eyebrow"><span class="paper">Hoffmann et al. 2022 (Chinchilla)</span> · §3.3 · Eq. 4, derivation</p>

## Where is the optimum? Steps 1 and 2

<div class="cols">
<div class="text math-block">

Eliminate $D = C/6N$:
<div class="eq">$$L(N) = E + A N^{-\alpha} + B\Big(\frac{6}{C}\Big)^{\beta} N^{\beta}$$</div>

Set $dL/dN = 0$:
<div class="eq">$$\alpha A N^{-\alpha-1} = \beta B\Big(\frac{6}{C}\Big)^{\beta} N^{\beta-1}$$</div>

<div class="eq">$$\Rightarrow\quad \frac{\alpha A}{N^{\alpha}} = \frac{\beta B}{D^{\beta}}$$</div>

</div>
<div class="text">

- first term falls with $N$
- second rises with $N$
- optimum: weighted terms equal

<p class="q"><b>Q.</b> Are the two penalties equal?</p>
<p class="a"><b>A.</b> No: training term $= \alpha/\beta \approx 1.21\times$ capacity term</p>

</div>
</div>

<p class="footnote">Hoffmann et al. 2022 · §3.3, App. D.2. Multiply the derivative condition by $N$ to get the last line. The 1.21 is our arithmetic from the rounded exponents</p>

Note:
The central derivation, in three steps. First, use the budget to eliminate D: D = C over 6N. Now loss depends on N only. The capacity term falls as N grows; the training term rises, because a bigger model gets fewer tokens. That's the U.
Second, set the derivative to zero. Multiply through by N and you get a clean condition: alpha times the capacity penalty equals beta times the training penalty.
So at the optimum the two penalties aren't equal; their ratio is alpha over beta, about 1.21. The training term is about 21% bigger than the capacity term. What balances is their marginal effect, not their size.

---

<p class="eyebrow"><span class="paper">Hoffmann et al. 2022 (Chinchilla)</span> · §3.3 · Eq. 4</p>

## Steps 3 and 4: the exponents

<div class="cols">
<div class="text math-block">

<div class="eq">$$N_{\rm opt}(C) = G\Big(\frac{C}{6}\Big)^{\frac{\beta}{\alpha+\beta}},\quad D_{\rm opt}(C) = G^{-1}\Big(\frac{C}{6}\Big)^{\frac{\alpha}{\alpha+\beta}}$$</div>

<div class="eq">$$G = \Big(\frac{\alpha A}{\beta B}\Big)^{\frac{1}{\alpha+\beta}}$$</div>

</div>
<div class="text">

- $a = \beta/(\alpha+\beta) = 0.28/0.62 \approx 0.45$
- $b = \alpha/(\alpha+\beta) \approx 0.55$
- paper: 0.46 and 0.54
- again: about equal

<p class="q"><b>Q.</b> Why equal?</p>
<p class="a"><b>A.</b> Because $\alpha \approx \beta$</p>

</div>
</div>

<p class="footnote">Hoffmann et al. 2022 · Eq. 4. The paper's 0.46 uses unrounded exponents (0.3392, 0.2849); 0.45 is from the rounded ones</p>

Note:
Solve the condition for N and you get Equation 4: the optimal size grows as C to the power beta over alpha plus beta, and the tokens as C to alpha over alpha plus beta. The two exponents always add to one, because N times D is proportional to C.
With the fitted values, 0.45 and 0.55; the paper prints 0.46 and 0.54 from its unrounded constants.
The reason for equal scaling is now visible: the two exponents are nearly the same, because the capacity and data penalties fall at nearly the same rate.

---

<p class="eyebrow"><span class="paper">Hoffmann et al. 2022 (Chinchilla)</span> · §3.3 · consequence</p>

## Step 5: how does the best loss fall?

<div class="cols">
<div class="text math-block">

<div class="eq">$$L_{\rm opt}(C) - E \ \propto\ C^{-\frac{\alpha\beta}{\alpha+\beta}} = C^{-0.154}$$</div>

- 100x compute: excess loss × $100^{-0.154} \approx 0.49$
- about half the reducible loss gone
- $E$ stays

</div>
<div class="text">

<p class="q"><b>Q.</b> Is total loss a power law now?</p>
<p class="a"><b>A.</b> No: loss <i>above the floor</i> is</p>
<p class="q"><b>Q.</b> Limit as $C \to \infty$?</p>
<p class="a"><b>A.</b> $E$. A property of the formula, not a measurement</p>

</div>
</div>

<p class="footnote">Hoffmann et al. 2022 · follows from Eq. 2 and 4; our arithmetic, not printed in the paper</p>

Note:
One more consequence. At the optimum both penalties scale with the same power of compute, so the excess loss above the floor falls as C to the minus alpha beta over alpha plus beta, about minus 0.154.
Concretely: a hundred times more compute removes about half of the reducible loss. The floor E stays.
That's a real conceptual difference from Kaplan. Here the power law is in the loss above an irreducible floor, not in the total loss. As compute goes to infinity the formula goes to E; that's a property of the chosen formula, not something the experiments show.

---

<p class="eyebrow"><span class="paper">Hoffmann et al. 2022 (Chinchilla)</span> · §3.3 · Fig. 4 (left)</p>

## Reading the efficient frontier

<div class="cols">
<div class="text">

- contours: equal predicted loss
- each loss: the leftmost point is cheapest
- join those points: the frontier (blue)
- a straight line in log-log: $N_{\rm opt} \propto C^{a}$
- at Gopher's budget: 40B

<p class="q"><b>Q.</b> Straight forever?</p>
<p class="a"><b>A.</b> They see some curvature</p>

</div>
<div class="fig"><img src="img/week-06-chinchilla-approach3.png" alt="Hoffmann et al. Figure 4: iso-loss contours over training FLOPs and model size with the efficient frontier in blue, and IsoFLOP slices"></div>
</div>

<p class="footnote">Hoffmann et al. 2022 · Fig. 4 left, App. E. Two dual views: fix the loss and minimise compute, or fix the compute and minimise the loss</p>

Note:
How to read Figure 4. The coloured lines are contours of equal predicted loss over compute and model size. For one target loss, a big model trained briefly or a small one trained long can both reach it; the cheapest is the leftmost point on that contour. Join those points over all losses and you get the blue frontier.
The same frontier comes from the dual view: fix the compute and find the lowest loss. It's close to a straight line in log-log, which is the power law. But the authors note curvature at high compute, so one fixed exponent is an approximation.

---

<p class="eyebrow"><span class="paper">Hoffmann et al. 2022 (Chinchilla)</span> · §3.4 · Table 2, Fig. 1</p>

## Do the three methods agree?

<div class="cols wide-fig">
<div class="text">

<table class="rules">
  <tr><td>method</td><td class="num">$a$</td><td class="num">$b$</td></tr>
  <tr><td>1. envelope</td><td class="num">0.50</td><td class="num">0.50</td></tr>
  <tr><td>2. IsoFLOP</td><td class="num">0.49</td><td class="num">0.51</td></tr>
  <tr><td>3. fitted law</td><td class="num">0.46</td><td class="num">0.54</td></tr>
  <tr class="total"><td>Kaplan</td><td class="num">0.73</td><td class="num">0.27</td></tr>
</table>

<p class="q"><b>Q.</b> Agree on the size too?</p>
<p class="a"><b>A.</b> Less: 67B, 63B, 40B at Gopher's budget</p>

</div>
<div class="fig"><img src="img/week-06-chinchilla-fig1.png" alt="Hoffmann et al. Figure 1: optimal parameters against FLOPs for Approaches 1, 2 and 3, all flatter than the dashed Kaplan line; Chinchilla 70B sits on the approach lines, Gopher, GPT-3 and MT-NLG near the Kaplan line"></div>
</div>

<p class="footnote">Hoffmann et al. 2022 · Table 2, Fig. 1. Brackets in Table 2 are 10th to 90th bootstrap percentiles, not 95% intervals</p>

Note:
All three methods give roughly equal scaling, and all three disagree sharply with Kaplan's 0.73. In Figure 1 the big models of the day sit near Kaplan's steeper line; Chinchilla sits on the new ones.
A subtlety: the methods agree on the exponent much more than on the exact optimal size. At Gopher's budget, Approaches 1 and 2 say 67 and 63 billion, Approach 3 says 40 billion. So the evidence is strongest for the qualitative claim, train smaller models on many more tokens, and weaker for any exact optimum.

--

<p class="eyebrow"><span class="paper">Hoffmann et al. 2022 (Chinchilla)</span> · Later work · Besiroglu et al. 2024</p>

## Was the fitted equation right?

<div class="cols wide-fig">
<div class="text">

- refit Approach 3 on reconstructed data
- $a = 0.51$: agrees with 1 and 2
- about 20 tokens per parameter
- original: fit stopped early; rounded constants

<p class="q"><b>Q.</b> And the original's 0.454 to 0.455 interval?</p>
<p class="a"><b>A.</b> Implausibly narrow</p>

</div>
<div class="fig"><img src="img/week-06-besiroglu-ratio.png" alt="Besiroglu et al. Figure 5: tokens per parameter against training compute; Hoffmann's fitted policy rises past 100; the re-fit stays near 20, close to the Chinchilla model"></div>
</div>

<p class="footnote">Besiroglu et al. 2024 · arXiv:2404.10102 · Fig. 5, Table 1. Data read from Hoffmann's Fig. 4 (240 points). Re-fit: $E$ = 1.82, $A$ = 482, $B$ = 2085, $\alpha$ = 0.35, $\beta$ = 0.37</p>

Note:
Optional. Epoch AI tried to reproduce Approach 3. The runs aren't public, so they reconstructed the data points from Figure 4, a limitation they state. Fitting the same function the same way gives different constants and a much better fit; the implied exponent is 0.51, agreeing with Approaches 1 and 2, and about 20 tokens per parameter instead of the original fit's 70 or so.
The causes: rounded constants in the paper, and, as the original authors explained, the Huber losses were averaged instead of summed, so the optimiser stopped early. So the replication confirms Chinchilla's main claim and corrects its third method.

---

<p class="eyebrow"><span class="paper">Hoffmann et al. 2022 (Chinchilla)</span> · App. C · Fig. A2</p>

## Does it hold on other data?

<div class="cols wide-fig">
<div class="text">

<table class="rules">
  <tr><td>dataset</td><td class="num">$a$</td><td class="num">$b$</td></tr>
  <tr><td>MassiveText</td><td class="num">0.49</td><td class="num">0.51</td></tr>
  <tr><td>C4</td><td class="num">0.50</td><td class="num">0.50</td></tr>
  <tr class="total"><td>GitHub code</td><td class="num">0.53</td><td class="num">0.47</td></tr>
</table>

<p class="q"><b>Q.</b> So it's universal?</p>
<p class="a"><b>A.</b> Three corpora, all under one epoch</p>

</div>
<div class="fig"><img src="img/week-06-chinchilla-c4-github.png" alt="Hoffmann et al. Figure A2: IsoFLOP curves and fitted optimal sizes on C4 and GitHub data"></div>
</div>

<p class="footnote">Hoffmann et al. 2022 · App. C, Table A2, Fig. A2. "our results are independent of the dataset as long as one does not train for more than one epoch"</p>

Note:
Optional. They repeat Approach 2 on C4, web text, and on GitHub code. The exponents stay near a half. That's encouraging evidence the result isn't specific to MassiveText, though it doesn't show independence from data quality, language or architecture, and every run is under one epoch.

---

<p class="eyebrow"><span class="paper">Hoffmann et al. 2022 (Chinchilla)</span> · §3.4 · Table 3</p>

## Where does "20 tokens per parameter" come from?

<div class="cols">
<div class="text">

<table class="rules">
  <tr><td>parameters</td><td class="num">tokens</td><td class="num">per param</td></tr>
  <tr><td>400M</td><td class="num">8.0B</td><td class="num">20.0</td></tr>
  <tr><td>1B</td><td class="num">20.2B</td><td class="num">20.2</td></tr>
  <tr><td>10B</td><td class="num">205.1B</td><td class="num">20.5</td></tr>
  <tr><td>67B</td><td class="num">1.5T</td><td class="num">22.4</td></tr>
  <tr class="total"><td>280B</td><td class="num">5.9T</td><td class="num">21.1</td></tr>
</table>

</div>
<div class="text">

- equal exponents ▸ constant ratio
- the 20 comes from Approach 1's constants
- the paper never writes "20"

<p class="q"><b>Q.</b> Is training past 20:1 wasteful?</p>
<p class="a"><b>A.</b> No: it still helps, just not compute-optimally</p>

</div>
</div>

<p class="footnote">Hoffmann et al. 2022 · Table 3 (Approach 1); the last column is our division. Chinchilla itself: 1.4T / 70B = 20</p>

Note:
If parameters and tokens both grow as C to the 0.5, their ratio is constant along the frontier. Table 3 shows it: 20 to 22 tokens per parameter at every size. Chinchilla itself, 1.4 trillion over 70 billion, is exactly 20.
Three cautions. Equal exponents imply a constant ratio but not the value 20; that comes from the constants of Approach 1, and Approach 3 implies a different ratio. The paper never states "20 tokens per parameter"; later papers named the rule. And it doesn't say training past 20 is harmful: more tokens still lower the loss. It says that for a fixed training budget, the extra compute is better spent partly on a bigger model. Nor is it the answer once serving cost counts, which we come to with Sardana et al.

---

<p class="eyebrow"><span class="paper">Hoffmann et al. 2022 (Chinchilla)</span> · §4.1 · Table 4</p>

## The large-scale test: Chinchilla vs Gopher

<div class="cols">
<div class="text">

<table class="rules">
  <tr><td></td><td class="num">Gopher</td><td class="num">Chinchilla</td></tr>
  <tr><td>parameters</td><td class="num">280B</td><td class="num">70B</td></tr>
  <tr><td>layers</td><td class="num">80</td><td class="num">80</td></tr>
  <tr><td>heads</td><td class="num">128</td><td class="num">64</td></tr>
  <tr><td>width</td><td class="num">16,384</td><td class="num">8,192</td></tr>
  <tr class="total"><td>tokens</td><td class="num">300B</td><td class="num">1.4T</td></tr>
</table>

</div>
<div class="text">

- same family, same compute
- predicted optimum: 40B to 70B
- they chose the upper end, 70B

<p class="q"><b>Q.</b> A clean comparison?</p>
<p class="a"><b>A.</b> No: also AdamW, a new tokenizer, a new data mix</p>

</div>
</div>

<p class="footnote">Hoffmann et al. 2022 · Table 4, §4.1. Also a float32 copy of the weights in the optimiser; App. G shows AdamW alone helps</p>

Note:
Extrapolation is risky, so they test it at Gopher's budget. The three approaches put the optimum between 40 and 70 billion; they train the upper end, 70B, on 1.4 trillion tokens. Same depth, half the width and heads of Gopher.
As a validation it's sensible: closely related architectures at the same compute. It isn't perfectly controlled: Chinchilla also uses AdamW instead of Adam, a slightly different tokenizer, a different sampling mix of MassiveText and a float32 weight copy. Appendix G shows AdamW alone helps, so the main comparison can't fully separate the allocation from those changes.

---

<p class="eyebrow"><span class="paper">Hoffmann et al. 2022 (Chinchilla)</span> · §4.2 · Tables 6 to 9</p>

## What did it buy?

<div class="cols">
<div class="text">

<table class="rules">
  <tr><td></td><td class="num">Gopher</td><td class="num">Chinchilla</td></tr>
  <tr><td>WikiText-103 perplexity</td><td class="num">7.75</td><td class="num">7.16</td></tr>
  <tr><td>MMLU, 5-shot</td><td class="num">60.0</td><td class="num">67.6</td></tr>
  <tr><td>BIG-bench average</td><td class="num">54.4</td><td class="num">65.1</td></tr>
  <tr><td>RACE-h, few-shot</td><td class="num">71.6</td><td class="num">82.3</td></tr>
  <tr><td>Natural Questions, 5-shot</td><td class="num">24.5</td><td class="num">31.5</td></tr>
  <tr class="total"><td>TruthfulQA, 0-shot</td><td class="num">29.5</td><td class="num">43.6</td></tr>
</table>

</div>
<div class="text">

- better on almost everything
- MMLU: 51 of 57 subjects better
- The Pile: all subsets better

<p class="q"><b>Q.</b> Any reason to discount?</p>
<p class="a"><b>A.</b> Leakage risk for the language-modelling scores (WikiText, Pile)</p>

</div>
</div>

<p class="footnote">Hoffmann et al. 2022 · Tables 6 to 9 and §4.2 text, Figs. 5 to 7. BIG-bench: 62 tasks; RACE-h: high-school reading comprehension; Natural Questions: closed-book factual questions; TruthfulQA: questions that invite misconceptions. One run of each model</p>

Note:
The results. Lower perplexity on WikiText-103. MMLU up 7.6 points, better on 51 of 57 subjects. BIG-bench up more than ten points. Reading comprehension up about eleven. Closed-book question answering up too: Natural Questions 5-shot from 24.5 to 31.5%. On the five common-sense benchmarks it matches or beats Gopher (PIQA is a tie). TruthfulQA up fourteen. On The Pile, better on every subset. All this from a model four times smaller.
The authors' own caution: Chinchilla saw four times more data, which raises the chance that some test text leaked into training, especially for the language-modelling benchmarks. And it's one run of each model.
One more caution: in Tables 6 to 9 the outside models' scores are quoted from earlier papers, not re-run (the GPT-3 MMLU number, for instance, is taken from Hendrycks et al.), and the authors themselves flag that GPT-3 and MT-NLG used a different prompt format on RACE, so those scores are not comparable. Chinchilla against Gopher is the tight comparison.

--

<p class="eyebrow"><span class="paper">Hoffmann et al. 2022 (Chinchilla)</span> · §4.2.2 · Fig. 6</p>

## Better on which subjects?

<div class="rows">
<div class="points">
<div class="text">

- 51 of 57 better, 2 equal, 4 worse

</div>
<div class="text">

- worse: college maths, econometrics, moral scenarios, formal logic

</div>
</div>
<div class="fig"><img src="img/week-06-chinchilla-mmlu.png" alt="Hoffmann et al. Figure 6: relative improvement of Chinchilla over Gopher on each of the 57 MMLU subjects; four get worse, two are unchanged, the rest improve by up to about 35%"></div>
</div>

<p class="footnote">Hoffmann et al. 2022 · Fig. 6</p>

Note:
Optional. The MMLU gain is broad but not universal: four subjects get worse, including college mathematics and formal logic. Lower loss doesn't mean better at literally everything.

--

<p class="eyebrow"><span class="paper">Hoffmann et al. 2022 (Chinchilla)</span> · §4.2.1 · Fig. 5</p>

## Language modelling on The Pile

<div class="cols wide-fig">
<div class="text">

- bits per byte, every subset
- Chinchilla better on all

</div>
<div class="fig"><img src="img/week-06-chinchilla-pile.png" alt="Hoffmann et al. Figure 5: bits-per-byte improvement of Chinchilla over Gopher on each evaluation subset of The Pile; positive on all"></div>
</div>

<p class="footnote">Hoffmann et al. 2022 · Fig. 5. Bits per byte: loss normalised by text length, comparable across tokenizers</p>

Note:
Optional. On every subset of The Pile, Chinchilla has lower bits-per-byte than Gopher. Bits per byte normalises by the length of the text, so it's comparable even though the tokenizers differ.

--

<p class="eyebrow"><span class="paper">Hoffmann et al. 2022 (Chinchilla)</span> · Later work · Sardana et al. 2024</p>

## What if the model is then used a lot?

<div class="cols">
<div class="text">

- Chinchilla minimises training FLOPs only
- serving cost grows with $N$
- minimise $6ND_{\rm tr} + 2ND_{\rm inf}$
- heavy use: train smaller, longer
- e.g. 70B on 4.26T ▸ 41.6B on 7.92T

</div>
<div class="fig"><img src="img/week-06-sardana-model.png" alt="Sardana et al. Figure 2: contours of compute-optimal model size relative to Chinchilla over inference tokens and pre-training loss; the optimal model shrinks as expected inference grows"></div>
</div>

<p class="footnote">Sardana et al. 2024 · arXiv:2401.00448 · Fig. 2, appendix Table 2: at $10^{13}$ inference tokens, 12% less total compute. Llama 3: 405B on 15.6T tokens (arXiv:2407.21783)</p>

Note:
Optional. Chinchilla optimises training compute only. A model that's served to many users spends more compute answering than it did in training, and that cost grows with the number of parameters. Sardana et al. minimise training plus inference and find that once lifetime inference is large, the best model is smaller and trained longer. For a 70B model trained Chinchilla-style (4.26T tokens under the fitted law) and expected to serve ten trillion tokens, a 41.6B model on 7.9 trillion tokens matches it with 12% less total compute.
Practice moved the same way: Llama 3's 405B saw 15.6 trillion tokens, and its smaller models far more per parameter.

---

<p class="eyebrow"><span class="paper">Hoffmann et al. 2022 (Chinchilla)</span> · §2 Related work · App. B, Fig. A1</p>

## Why did Kaplan disagree? 1. The schedule

<div class="rows">
<div class="points">
<div class="text">

- cosine planned for 130B tokens
- stop at 10B: learning rate still high
- loss worse than a run planned for 10B

</div>
<div class="text">

- Fig. A1: cycle over 25% too long hurts
- so short runs looked bad to Kaplan
- which favoured bigger models

</div>
</div>
<div class="fig"><img src="img/week-06-chinchilla-cosine.png" alt="Hoffmann et al. Figure A1, top row: learning-rate schedules with cosine cycles 1, 1.1, 1.25, 1.5, 2 and 5 times the number of training steps, and the resulting training and C4 losses; cycles much longer than the run end at higher loss"></div>
</div>

<p class="footnote">Hoffmann et al. 2022 · §2, App. B, Fig. A1. The paper says this "contributes to" the difference. Porian et al. 2024 find it a small part (0.60 ▸ 0.57; Kaplan sub-slides)</p>

Note:
Chinchilla's first explanation. Picture a cosine schedule planned for 130 billion tokens. At 10 billion tokens the learning rate is still near its peak, because the optimiser expects to keep going. Measure the loss there and a 10-billion-token run looks worse than it would if it had been planned that way.
Appendix B tests it: a cosine cycle more than about 25% longer than the run clearly hurts the final loss. Kaplan read compute-limited losses partway through runs scheduled for 130 billion tokens, so short training looked worse than it is, and the fit pushed toward bigger models on fewer tokens.
The lesson: a scaling law can partly reflect how the training was organised, not only the model and data. A fair comparison between allocations has to let the schedule fit the compute each run is given. The 2024 rereads under Kaplan find this particular effect is smaller than Chinchilla thought; the parameter counting and warmup matter more.

---

<p class="eyebrow"><span class="paper">Hoffmann et al. 2022 (Chinchilla)</span> · §2 Related work · App. E, Fig. A5</p>

## 2. Which sizes went into the fit

<div class="cols">
<div class="text">

- Kaplan: many runs under 100M
- Chinchilla: most over 500M, up to 16B
- the frontier bends a little
- fit small models, get a different slope

<p class="q"><b>Q.</b> So an exponent depends on the range?</p>
<p class="a"><b>A.</b> If the frontier isn't a perfect power law, yes</p>

</div>
<div class="fig"><img src="img/week-06-chinchilla-curvature.png" alt="Hoffmann et al. Figure A5: training curve envelope fitted separately to the first, middle and last third of the points along the loss frontier, giving different slopes"></div>
</div>

<p class="footnote">Hoffmann et al. 2022 · §2, App. E, Fig. A5: "projections from very small models lead to different predictions than those from larger models"</p>

Note:
The second explanation: scale. Many of Kaplan's runs were under 100 million parameters; most of Chinchilla's are over 500 million, up to 16 billion. And the frontier isn't perfectly straight: fit the first, middle and last third of it separately (Figure A5) and you get different slopes.
If the true frontier bends, the exponent you measure depends on the range you measure it over. A slope fitted mostly to small models extrapolates differently from one fitted to large models.

---

<p class="eyebrow"><span class="paper">Hoffmann et al. 2022 (Chinchilla)</span> · App. D.4 · Fig. A4</p>

## A direct test at $10^{21}$ FLOPs

<div class="cols wide-fig">
<div class="text">

- Kaplan's rule: 4.68B
- Approach 1: 2.86B
- trained: 4.74B and 2.80B
- same batch, max LR and depth-to-width ratio
- the smaller one wins

<p class="q"><b>Q.</b> How strong is this?</p>
<p class="a"><b>A.</b> Direct, but one pair; no repeats reported</p>

</div>
<div class="fig"><img src="img/week-06-chinchilla-kaplan-1e21.png" alt="Hoffmann et al. Figure A4: training loss of a 4.74B model (Kaplan's prediction) and a 2.80B model (Approach 1) at 1e21 FLOPs; the 2.80B model ends lower"></div>
</div>

<p class="footnote">Hoffmann et al. 2022 · App. D.4, Fig. A4. Batch 0.5M tokens, max learning rate $1.5\times10^{-4}$; no uncertainty reported</p>

Note:
The most direct test of the disagreement. At one budget, 10 to the 21 FLOPs, Kaplan's rule says 4.68 billion parameters and Approach 1 says 2.86 billion. They train models of 4.74 and 2.80 billion, same batch and learning rate, and the smaller one reaches the lower loss at the end.
That tests the disputed allocation itself, not just two fitted exponents. It's one pair at one budget with one seed each.

---

<p class="eyebrow"><span class="paper">Hoffmann et al. 2022 (Chinchilla)</span> · Summary</p>

## What do the experiments actually establish?

<table class="rules">
  <tr><td>level</td><td>claim</td><td>evidence</td></tr>
  <tr><td>observation</td><td>fixed compute has a best size, which moves</td><td>strong: IsoFLOP</td></tr>
  <tr><td>fitted model</td><td>$E + A/N^{\alpha} + B/D^{\beta}$</td><td>useful; mis-fit once</td></tr>
  <tr><td>prediction</td><td>70B on 1.4T beats 280B on 300B</td><td>strong, not controlled</td></tr>
  <tr class="total"><td>stronger claims</td><td>exactly 20:1; exponents forever</td><td>weak</td></tr>
</table>

<p class="footnote">Hoffmann et al. 2022 · §3, §4, §5</p>

Note:
Separate the levels. The observation, that at fixed compute there's a best model size and it moves systematically with compute, is directly supported by the IsoFLOP sweeps. The fitted function describes the losses and its optimum agrees with the observations, but it doesn't prove that capacity and training penalties are independent universal power laws, and it was mis-fit once. The large-scale prediction, 70B on 1.4T beating 280B on 300B, is strongly supported, though other things changed too.
Weak: that 20 tokens per parameter is always optimal, that the exponents hold at every scale, or that the decomposition is the true mechanism.

---

<p class="eyebrow"><span class="paper">Hoffmann et al. 2022 (Chinchilla)</span> · §5 Discussion</p>

## What are the limitations?

<div class="cols">
<div class="text">

- only two runs at large scale
- the frontier curves; one exponent approximates it
- all scaling runs under one epoch
- training FLOPs only; serving adds $C_{\rm inference}$

</div>
<div class="text">

<p class="q"><b>Q.</b> Is 70B then the exact optimum?</p>
<p class="a"><b>A.</b> Unknown: no sweep at 30B, 50B, 100B</p>
<p class="q"><b>Q.</b> Which way would curvature push?</p>
<p class="a"><b>A.</b> "even smaller models"</p>

</div>
</div>

<p class="footnote">Hoffmann et al. 2022 · §5: "we only have two comparable training runs at large scale"; "we may still be overestimating the optimal size of large models"; under one epoch; App. E</p>

Note:
Four limitations matter, three of them stated by the authors. Only two comparable runs exist at the largest scale, Gopher and Chinchilla, so beating Gopher doesn't show 70B is the precise optimum. The frontier curves, so one exponent is a local approximation; including the curvature would favour even smaller models. All scaling runs are under one epoch, so repeating a limited corpus isn't studied, and tokens processed aren't the same as unique information. And the objective is training FLOPs: C train is about 6ND. A model that answers millions of queries also pays C inference, which grows with model size, so the total C train plus C inference can favour a smaller model trained longer. The paper mentions cheaper inference as a benefit but doesn't optimise the total (that's Sardana, a sub-slide under the results).

---

<p class="eyebrow"><span class="paper">Hoffmann et al. 2022 (Chinchilla)</span> · Summary</p>

## What is the deeper lesson?

<div class="cols">
<div class="text">

- the law that matters: the path of optima
- $(N_{\rm opt}(C), D_{\rm opt}(C))$ through $L(N,D)$
- exponents can belong to the regime
- fit range and schedule can move them
- prediction is not explanation

</div>
<div class="text">

<p class="q"><b>Q.</b> Did Kaplan and Chinchilla disagree that bigger helps?</p>
<p class="a"><b>A.</b> No: both agree. They disagree on the path</p>
<p class="q"><b>Q.</b> Does App. D.2 explain 0.34 and 0.28?</p>
<p class="a"><b>A.</b> It motivates the form (theory: about 1/2), not the fitted values</p>

</div>
</div>

<p class="footnote">Hoffmann et al. 2022 · App. D.2 ("a classical risk decomposition"), App. E (curvature). The three lessons are our reading of the paper</p>

Note:
The most interesting contribution may not be the number 20 or the exponent 0.5, but the lesson about experimental design. Kaplan showed that simple regularities appear when you scale Transformers. Chinchilla argues those regularities can move with decisions that look secondary: which training lengths you look at, whether the schedule fits them, which model sizes go into the fit.
Three lessons. First, the scaling law you usually care about isn't the loss surface L of N and D itself; it's the path that the optimum traces through that surface as the budget grows. Two analyses can agree that bigger models and more data both help and still disagree a lot about that path. That is exactly Kaplan versus Chinchilla.
Second, an exponent fitted as a straight line in log-log over a finite range is easy to read as a fundamental constant. But a different fitting range or optimisation protocol can give a different effective exponent, and the curvature in Chinchilla's own frontier is a warning against assuming exact scale invariance. (Its datasets check, C4 and GitHub, found the exponents stable; and the 2024 rereads under Kaplan find the schedule effect smaller than Chinchilla thought.)
Third, prediction and explanation are different achievements. Chinchilla's prediction worked: the 70B model beat Gopher. That doesn't tell us why the exponents are 0.34 and 0.28, or why balanced scaling should appear. The appendix motivates the additive terms and even the power-law shapes: theory for two-layer networks and for stochastic gradient descent suggests exponents of about one half. But 0.34 and 0.28 are fitted, not derived. A first-principles account in terms of the structure of language, learning dynamics and data is still missing; the Kaplan sub-slides on why power laws exist at all are the start of that story.

---

<p class="eyebrow"><span class="paper">Hoffmann et al. 2022 (Chinchilla)</span> · Summary</p>

## Kaplan vs Chinchilla

<table class="rules">
  <tr><td></td><td>Kaplan 2020</td><td>Chinchilla 2022</td></tr>
  <tr><td>allocation from</td><td>charted laws, then derived</td><td>fitted directly, three ways</td></tr>
  <tr><td>loss model</td><td>nested power laws, no floor</td><td>$E + A/N^{\alpha} + B/D^{\beta}$</td></tr>
  <tr><td>$N_{\rm opt}$</td><td>$C^{0.73}$</td><td>$C^{0.50}$</td></tr>
  <tr><td>$D_{\rm opt}$</td><td>$C^{0.27}$</td><td>$C^{0.50}$</td></tr>
  <tr><td>schedule</td><td>one, read mid-run</td><td>matched to each run</td></tr>
  <tr><td>parameters counted</td><td>non-embedding</td><td>all</td></tr>
  <tr><td>main validation</td><td>fits agree</td><td>$10^{21}$ control; Chinchilla vs Gopher</td></tr>
  <tr><td>weak point (ours)</td><td>allocation extrapolated badly</td><td>exact optimum uncertain</td></tr>
</table>

<p class="footnote">Kaplan et al. 2020; Hoffmann et al. 2022; parameter counting: Pearce &amp; Song 2024, Porian et al. 2024</p>

Note:
Side by side. Both papers answer how to split a fixed compute budget. Kaplan charted how loss scales with parameters, data and compute and derived the allocation from those laws; Chinchilla fitted the allocation directly, three ways. Different loss functions, different exponents, and the experimental choices that explain the gap: one long schedule read mid-run versus schedules matched to each run, and non-embedding versus total parameters. Kaplan's main evidence was that their fits agreed with each other; Chinchilla added a direct test at 10 to the 21 FLOPs and the Chinchilla-Gopher comparison. The last row is our judgement: Kaplan's weak point turned out to be the compute-optimal extrapolation; Chinchilla's is that the exact optimum, and extrapolation far beyond its runs, remain uncertain.

---

<p class="eyebrow"><span class="paper">Hoffmann et al. 2022 (Chinchilla)</span> · Summary</p>

## What to keep from Chinchilla

<div class="cols">
<div class="text">

- optimise size and training together
- IsoFLOP: every budget has a best size
- $N_{\rm opt} \propto C^{\beta/(\alpha+\beta)}$, $D_{\rm opt} \propto C^{\alpha/(\alpha+\beta)}$
- smaller and longer can beat bigger

</div>
<div class="text">

<p class="q"><b>Open question</b></p>
<p class="a">Are these exponents fundamental, or effective ones set by training regime, data and fit?</p>

</div>
</div>

<p class="footnote">Hoffmann et al. 2022. Next: from loss to abilities (Wei et al. 2022)</p>

Note:
Four things to keep. Model size and training length have to be optimised together under a compute budget. The IsoFLOP experiment is the cleanest evidence: at each budget there's a best size. The separable loss model gives the allocation exponents by simple calculus. And a smaller model trained on far more tokens can beat a much larger one at the same compute.
The open question: are exponents like 0.34 and 0.28 telling us something fundamental about learning language, or are they effective exponents produced by the training regime, data and fitting procedure? Kaplan found the patterns, Chinchilla showed that experimental design moves the optimum, and explaining why the patterns exist is still open.



---

<!-- .slide: class="cover divider" -->

<p class="kicker">Reading 3 of 4</p>
<h1>Wei et al. 2022</h1>
<p class="subtitle">Emergent Abilities of Large Language Models</p>
<p class="question">If loss falls smoothly, why do some abilities seem to appear suddenly?</p>
<ol class="track"><li class="done">Kaplan 2020<span>scaling laws</span></li><li class="done">Chinchilla 2022<span>compute-optimal training</span></li><li class="now">Wei 2022<span>emergent abilities</span></li><li>Schaeffer 2023<span>a mirage?</span></li></ol>

Note:
Reading 3 of 4. Wei, Tay, Bommasani and others from Google Research, Stanford, UNC and DeepMind, published in TMLR in 2022. A change of direction: from loss to what models can actually do.

---

<p class="eyebrow"><span class="paper">Wei et al. 2022</span> · Motivation</p>

## Smooth loss, sudden abilities?

<div class="cols wide-fig">
<div class="text">

- Kaplan, Chinchilla: loss falls smoothly
- but some tasks: flat, then a jump
- error near 100%, then not
- while loss falls across the small models

<p class="q"><b>Q.</b> Which one is the "real" picture?</p>
<p class="a"><b>A.</b> That's the question for this paper and the next</p>

</div>
<div class="fig"><img src="img/week-06-wei-fig5.png" alt="Wei et al. Figure 5: for modified arithmetic, IPA transliterate and word unscramble on LaMDA, the error rate stays near 100% until about 1e22 FLOPs while cross-entropy loss falls across the small models"></div>
</div>

<p class="footnote">Wei et al. 2022 · arXiv:2206.07682 · Fig. 5 (rendered from the paper's TeX). Top: error rate; bottom: cross-entropy; LaMDA models</p>

Note:
The tension in one picture. Kaplan and Chinchilla told us that loss improves smoothly and predictably. But on some tasks, accuracy sits at the floor for many model sizes and then jumps. In this figure, from the paper's own appendix, the bottom row, cross-entropy, falls across the small models, while the top row, error rate, is stuck near 100% until the largest models (on word unscramble the loss rises again at the very largest).
Wei et al. call these abilities emergent. Schaeffer et al., next, ask whether the jump is in the model or in the metric. We'll look at both.

---

<p class="eyebrow"><span class="paper">Wei et al. 2022</span> · §2 Emergent abilities definition</p>

## What do they mean by "emergent"?

<div class="cols">
<div class="text">

<blockquote>"An ability is emergent if it is not present in smaller models but is present in larger models."</blockquote>

- near random until a scale
- then well above random
- not predictable from smaller models

</div>
<div class="text">

<p class="q"><b>Q.</b> Where does the idea come from?</p>
<p class="a"><b>A.</b> Anderson's "More Is Different" (1972), via Steinhardt</p>
<p class="q"><b>Q.</b> A phase transition, as in physics?</p>
<p class="a"><b>A.</b> Our reading: an analogy. No order parameter, no singularity</p>

</div>
</div>

<p class="footnote">Wei et al. 2022 · §1 to §2. General definition "adapted from" Steinhardt 2022 and "rooted in" Anderson 1972; phase-transition analogy cited to Huberman &amp; Hogg 1987. Scale: training FLOPs (parameters in App. D)</p>

Note:
The definition is one sentence: an ability is emergent if smaller models don't have it and larger ones do. On a plot, that looks like performance near random until some scale, then a rise well above random. The consequence they draw is unpredictability: you could not have extrapolated it from the smaller models.
The definition is adapted from Steinhardt and rooted in Philip Anderson's 1972 essay "More is different": quantitative change in a system can produce qualitative change in behaviour. They call the rapid change a phase transition.
Take that as an analogy. A physical phase transition has an order parameter, a limit of infinite system size, a singularity and critical exponents. The paper identifies none of these. At this stage, "emergent" is an operational label for the shape of a curve. That distinction matters for the next reading.

---

<p class="eyebrow"><span class="paper">Wei et al. 2022</span> · Context</p>

## Is this another scaling-law paper?

<table class="rules">
  <tr><td></td><td>Kaplan</td><td>Chinchilla</td><td>Wei et al.</td></tr>
  <tr><td>measures</td><td>loss</td><td>loss</td><td>task scores</td></tr>
  <tr><td>question</td><td>how does loss scale?</td><td>how to split compute?</td><td>why do abilities jump?</td></tr>
  <tr><td>method</td><td>training sweeps</td><td>controlled sweeps</td><td>survey of others' results</td></tr>
  <tr class="total"><td>maths</td><td>fitted laws</td><td>fitted loss, optimum</td><td>none new</td></tr>
</table>

<p class="footnote">Wei et al. 2022. Curves replotted from GPT-3, LaMDA, Gopher, Chinchilla, PaLM and BIG-Bench papers; the new analysis is in the appendices</p>

Note:
Not in the same sense as the first two. Kaplan and Chinchilla trained their own models and fitted laws to loss. Wei et al. is a survey: it collects published evaluations of GPT-3, LaMDA, Gopher, Chinchilla, PaLM and BIG-Bench, and points to tasks where small models are at chance and large ones are not. There is no new scaling equation. The analysis comparing accuracy with cross-entropy, in the appendices, follows BIG-Bench's setup, and it turns out to be the most important part.

---

<p class="eyebrow"><span class="paper">Wei et al. 2022</span> · §3 · Fig. 1</p>

## How are the tasks posed?

<div class="rows">
<div class="points">
<div class="text">

- few-shot prompting
- a few solved examples, then the new input

</div>
<div class="text">

- no weight updates
- score: the model's answer

</div>
</div>
<div class="fig"><img src="img/week-06-wei-fig1.png" alt="Wei et al. Figure 1: a few-shot prompt with one solved review and its sentiment, followed by a new review; the language model outputs positive"></div>
</div>

<p class="footnote">Wei et al. 2022 · Fig. 1, §3; as in GPT-3 (Week 4)</p>

Note:
How every result in the next section was measured. Few-shot prompting, as in GPT-3: put a few solved examples in the prompt, then the new input, and read off the model's answer. No fine-tuning. The ability being measured is the ability to do the task from that prompt.

---

<p class="eyebrow"><span class="paper">Wei et al. 2022</span> · §3 Few-shot prompted tasks · Fig. 2</p>

## Eight tasks: flat, then a jump

<div class="rows">
<div class="points">
<div class="text">

- $x$: training FLOPs, $10^{18}$ to $10^{24}$
- $y$: accuracy, exact match or BLEU

</div>
<div class="text">

- one point = one trained model
- dashed: random guessing

</div>
</div>
<div class="fig"><img src="img/week-06-wei-fig2.png" alt="Wei et al. Figure 2: eight panels of few-shot performance against training FLOPs for LaMDA, GPT-3, Gopher, Chinchilla and PaLM with a dashed random baseline; each stays near random and then rises for the largest models"></div>
</div>

<p class="footnote">Wei et al. 2022 · Fig. 2 (rendered from the paper's TeX). A to D: BIG-Bench, 2-shot; E: TruthfulQA; F: Patel &amp; Pavlick 2022; G: MMLU; H: WiC, one-shot</p>

Note:
The paper's central evidence. Eight tasks, five model families, few-shot prompting. The x axis is training compute on a log scale; each point is a separately trained model; the dashed pink line is random guessing.
In every panel, performance stays at or near the random line across several orders of magnitude of compute and then rises for the largest one or two models. The next few slides go through the panels in groups.

---

<p class="eyebrow"><span class="paper">Wei et al. 2022</span> · §3 · Fig. 2A</p>

## A. Arithmetic: what changes, and what doesn't?

<div class="rows">
<div class="points">
<div class="text">

- 3-digit add and subtract, 2-digit multiply
- GPT-3: near 0 until 13B ($2\times10^{22}$ FLOPs)
- 13B: 8.7%; 175B: 33%
- LaMDA: rises around 68B

</div>
<div class="text">

<p class="q"><b>Q.</b> What stays fixed?</p>
<p class="a"><b>A.</b> Task, prompt, metric. Only the model changes</p>
<p class="q"><b>Remember:</b> scored by exact answer only</p>

</div>
</div>
<div class="fig"><img src="img/week-06-wei-fig2.png" alt="Wei et al. Figure 2, see panel A: modified arithmetic accuracy near zero for GPT-3 and LaMDA until about 1e22 FLOPs, then rising"></div>
</div>

<p class="footnote">Wei et al. 2022 · §3, Fig. 2A (panel A, top left). Plotted values from the TeX coordinates</p>

Note:
Panel A, top left. A BIG-Bench arithmetic task: three-digit addition and subtraction and two-digit multiplication, from a few examples in the prompt. GPT-3 is near zero until 13 billion parameters, about 2 times 10 to the 22 FLOPs, where it reaches 8.7%, then 33% at 175B. LaMDA rises later, around 68B.
What's interesting: the task, the prompt and the metric don't change; only the model's scale does. From the benchmark's point of view, small models can't do it and large ones can.
But hold on to one detail. Arithmetic is scored by exact answer. A model that gets three of four digits right scores the same as one that gets every digit wrong. We come back to that.

---

<p class="eyebrow"><span class="paper">Wei et al. 2022</span> · §3 · Fig. 2B to D</p>

## B to D. Transliterate, unscramble, Persian

<div class="rows">
<div class="points">
<div class="text">

- B: from the phonetic alphabet (IPA) to text
- C: recover a word from scrambled letters
- D: questions in Persian

</div>
<div class="text">

- D: only PaLM rises (62B: 29%, 540B: 45%)
- LaMDA 137B, GPT-3 175B stay near 25%

<p class="q"><b>Q.</b> One universal threshold? <b>A.</b> No: it differs by family</p>

</div>
</div>
<div class="fig"><img src="img/week-06-wei-fig2.png" alt="Wei et al. Figure 2, see panels B to D: IPA transliterate, word unscramble and Persian QA; in Persian QA only PaLM rises above the 25% random line"></div>
</div>

<p class="footnote">Wei et al. 2022 · §3, Fig. 2B to D (top row). Persian QA random line at 25%, unexplained in the paper</p>

Note:
Panels B to D, the rest of the top row. Transliterating from the International Phonetic Alphabet, recovering a word from scrambled letters, and answering questions in Persian. Same shape: flat, then a rise at the largest models.
Persian is the revealing one. Only PaLM rises: 29% at 62 billion parameters, 45% at 540 billion. LaMDA at 137B and GPT-3 at 175B stay at the random line. So there's no single parameter count at which an ability switches on; training data, tokenization and architecture may matter too (the paper calls these potential reasons and did not ablate them).

---

<p class="eyebrow"><span class="paper">Wei et al. 2022</span> · §3 · Fig. 2E, F</p>

## E, F. Truthfulness and grounded concepts

<div class="rows">
<div class="points">
<div class="text">

- E: TruthfulQA, built to trip up GPT-3
- Gopher 7.1B: 23%; 280B: 43%
- random: 22.6%

</div>
<div class="text">

- F: map words to directions in a text grid world
- GPT-3 1.3B: 10%; 175B: 45%
- random: 16.7%

</div>
</div>
<div class="fig"><img src="img/week-06-wei-fig2.png" alt="Wei et al. Figure 2, see panels E and F: TruthfulQA, where Gopher rises to 43% at 280B while GPT-3 stays near 20%; grounded mappings, where GPT-3 jumps to 45% only at 175B"></div>
</div>

<p class="footnote">Wei et al. 2022 · §3, Fig. 2E, F (bottom row, left). TruthfulQA is "adversarially curated against GPT-3", so GPT-3 stays near random at every size</p>

Note:
Bottom row, first two panels. TruthfulQA asks questions designed to elicit common misconceptions; it was built adversarially against GPT-3, which stays near random at every size. Gopher is near random up to 7 billion parameters and then jumps to 43% at 280B, more than 20 points above random.
Grounded conceptual mappings: the model has to map a concept, such as a cardinal direction, onto a grid world described in text. GPT-3 is below random until its largest size, where it reaches 45%.

---

<p class="eyebrow"><span class="paper">Wei et al. 2022</span> · §3 · Fig. 2G, H</p>

## G, H. Knowledge exams and word senses

<div class="rows">
<div class="points">
<div class="text">

- G: MMLU, exams in 57 subjects
- up to ~10B: chance (25%)
- 70B to 280B: well above (Chinchilla ~67%)

</div>
<div class="text">

- H: WiC, does a word mean the same twice?
- GPT-3, Chinchilla: chance (50%) at full size
- PaLM 540B: ~63%

</div>
</div>
<div class="fig"><img src="img/week-06-wei-fig2.png" alt="Wei et al. Figure 2, see panels G and H: MMLU accuracy near 25% until about 10B parameters then rising to about 44 to 67%; WiC near 50% for GPT-3 and Chinchilla, rising to 63% only for PaLM 540B"></div>
</div>

<p class="footnote">Wei et al. 2022 · §3, Fig. 2G, H (bottom row, right). WiC: Word in Context, one-shot</p>

Note:
The last two. MMLU, multiple-choice exams across 57 subjects. GPT-3, Gopher and Chinchilla are at chance, 25%, up to about 10 billion parameters, then well above it at 70 to 280 billion: Chinchilla reaches about 67%. It looks like a broad knowledge-based ability appearing.
Word in Context: does a word mean the same thing in two sentences? GPT-3 and Chinchilla stay at chance, 50%, even at full size. Only PaLM at 540 billion gets above it, to about 63%. The authors use this as their example of unpredictability: a task that looked immune to scaling rose above chance with a bigger model.

---

<p class="eyebrow"><span class="paper">Wei et al. 2022</span> · §3 · what is claimed</p>

## What exactly has been shown?

<div class="cols">
<div class="text">

<p class="q"><b>Shown</b></p>

- measured scores of separately trained models
- with particular prompts and metrics
- rise quickly between sizes

</div>
<div class="text">

<p class="q"><b>Not shown</b></p>

- a 12.9B model lacks it, a 13B has it
- one model reorganises inside
- anything between the last two points

</div>
</div>

<p class="footnote">Wei et al. 2022 · Fig. 2. The jump usually spans one gap between two models, 5x to 132x apart in compute (our arithmetic on the TeX coordinates)</p>

Note:
Be precise about the claim. What the figure shows: the measured performance of separately trained models, under particular prompts and metrics, rises quickly between some model sizes.
What it doesn't show: that a 12.9B model lacks the ability and a 13B model has it; that a single model undergoes a sudden internal change during training; or what happens between the plotted sizes. Most jumps happen across one gap near the top of each family, and the two models on either side of it are 5 to 132 times apart in compute, with nothing measured in between.
That's still an interesting observation. Whether it's an internal transition is a separate question.

---

<p class="eyebrow"><span class="paper">Wei et al. 2022</span> · §4 Augmented prompting strategies · Fig. 3</p>

## A second kind: methods that only help at scale

<div class="rows">
<div class="points">
<div class="text">

<div class="eq">$$\Delta(N) = \mathrm{perf}(P_1, N) - \mathrm{perf}(P_0, N)$$</div>

</div>
<div class="text">

- $P_0$: plain prompting; $P_1$: the method
- $\Delta \le 0$ for small models, $> 0$ for large
- then the method is "emergent"

</div>
</div>
<div class="fig"><img src="img/week-06-wei-fig3.png" alt="Wei et al. Figure 3: chain of thought, instruction tuning, scratchpad and calibration; the method's curve is at or below the baseline for small models and above it for large ones"></div>
</div>

<p class="footnote">Wei et al. 2022 · §4, Fig. 3 (rendered from the paper's TeX). $\Delta$ is our notation for their definition: "no improvement or is harmful ... until applied to a model of a large-enough scale"</p>

Note:
A broader idea. An ability might not be a task but the ability to benefit from a way of using the model. Compare plain prompting with a special prompting or fine-tuning method; call the difference Delta. If Delta is zero or negative for small models and positive for large ones, the paper calls the method's usefulness emergent.
That's different from a model suddenly solving a task: here the intervention itself starts working at some scale. Four examples follow.

---

<p class="eyebrow"><span class="paper">Wei et al. 2022</span> · §4 · Fig. 3A, B</p>

## Chain of thought and instruction tuning

<div class="rows">
<div class="points">
<div class="text">

- A: chain of thought on GSM8K
- small LaMDA: no help, slightly worse
- 68B: 11.8% vs 5.6%; 137B: 20.7% vs 6.3%

</div>
<div class="text">

- B: instruction tuning (FLAN)
- 8B: 44.9 vs 49.7, hurts
- 68B: 65.9 vs 52.5, helps

</div>
</div>
<div class="fig"><img src="img/week-06-wei-fig3.png" alt="Wei et al. Figure 3, see panels A and B: chain of thought below standard prompting for small LaMDA models and above it from 68B; instruction tuning below the untuned model up to 8B and above from 68B"></div>
</div>

<p class="footnote">Wei et al. 2022 · §4, Fig. 3A, B. GSM8K: grade-school maths word problems. Text says chain of thought helps from ~100B; Table 1 and the plot show 68B. Chain of thought: Week 8</p>

Note:
Chain of thought: give worked examples with intermediate reasoning steps, and the model writes its own steps before answering. On GSM8K maths word problems, it doesn't help small LaMDA models and slightly hurts; from 68 billion parameters it clearly helps, 20.7% versus 6.3% at 137B. One possible reason, not established by the paper: small models make errors in the intermediate steps, and those errors compound.
Instruction tuning, fine-tuning on many tasks phrased as instructions (FLAN): it hurts models of 8B and smaller and helps from 68B. But other work got instruction following in much smaller encoder-decoder models, so the threshold depends on the recipe.

---

<p class="eyebrow"><span class="paper">Wei et al. 2022</span> · §4 · Fig. 3C, D</p>

## Scratchpads and calibration

<div class="rows">
<div class="points">
<div class="text">

- C: fine-tune to write intermediate digits
- 8-digit addition: helps from ~40M parameters
- millions, not billions

</div>
<div class="text">

- D: is my answer true? (P(True))
- better than letter choices at 52B
- but also at the smallest model

</div>
</div>
<div class="fig"><img src="img/week-06-wei-fig3.png" alt="Wei et al. Figure 3, see panels C and D: scratchpad 8-digit addition jumps to 100% from about 1e20 FLOPs; calibration error of the True/False method lowest at the largest model"></div>
</div>

<p class="footnote">Wei et al. 2022 · §4, Fig. 3C, D. ECE: expected calibration error, lower is better (axis reversed). In the plotted data T/F also beats letter choices at the smallest model</p>

Note:
Scratchpad: a model fine-tuned to write out its intermediate computation for 8-digit addition. It helps from about 40 million parameters. That's millions, not billions: a counterexample to the idea that emergence needs huge models. Different tasks and different scaffolds have very different scale requirements.
Calibration: can the model judge whether its own answer is right? Asking for the probability that an answer is true beats comparing letter choices at the largest model, 52B. One caveat from the plotted numbers: it also wins at the smallest model and loses in the middle, so this example is weaker than the text suggests.
Together: scale changes not only what a model can do directly, but which prompting and training methods work on it.

---

<p class="eyebrow"><span class="paper">Wei et al. 2022</span> · §4 · Table 1</p>

## At what scale does each ability appear?

<div class="cols wide-fig">
<div class="text">

- 22 abilities, plus BIG-Bench tasks
- from 40M (scratchpad)
- to 540B (WiC, PaLM)
- no single threshold

<p class="q"><b>Q.</b> Do they claim a scale is needed?</p>
<p class="a"><b>A.</b> No: "not an immutable property"</p>

</div>
<div class="fig"><img src="img/week-06-wei-table1.png" alt="Wei et al. Table 1: emergent abilities with the training FLOPs and parameters at which they emerge, from 40M parameters for scratchpad 8-digit addition to 540B for Word in Context"></div>
</div>

<p class="footnote">Wei et al. 2022 · Table 1 (from the paper's PDF), §2: the emergence scale "is not an immutable property of the ability"</p>

Note:
The paper's list: 22 abilities with the scale where each emerges, from a 40-million-parameter scratchpad model to PaLM 540B on word in context, plus many BIG-Bench tasks in the appendix. So there's no single threshold. And the authors say so: the scale at which an ability emerges depends on the model, data and training, and is "not an immutable property of the ability".

---

<p class="eyebrow"><span class="paper">Wei et al. 2022</span> · §2 · what a phase transition would need</p>

## Is a sharp curve a phase transition?

<div class="cols">
<div class="text">

<div class="eq">$$A(s) = A_0 + \frac{A_{\max} - A_0}{1 + e^{-k(s - s_c)}},\quad s = \log C$$</div>

- large $k$: looks like a jump
- but smooth for every finite $k$
- physics also needs: an order parameter
- and a transition that sharpens as size grows

</div>
<div class="fig"><img src="img/week-06-wei-sigmoid.svg" alt="Illustration: logistic curves of accuracy against log training FLOPs with steepness k = 1, 3 and 10; all smooth, the steepest looks like a jump"></div>
</div>

<p class="footnote">Illustration, not fitted in the paper. Finite-size scaling, e.g. $m = L^{-\beta/\nu} F\big((g - g_c) L^{1/\nu}\big)$ for linear system size $L$, predicts the transition sharpens as the system grows; nothing like it is tested here</p>

Note:
Let's formalise "sudden". With s the log of compute, a smoothly improving ability might be a straight line in s. The emergent-looking curves look more like a logistic: a baseline, a ceiling, a midpoint s_c and a steepness k. With large k the rise happens over a narrow range of scale and looks like a jump.
But a logistic is smooth: for any finite k it has derivatives everywhere. A fast rise is not a discontinuity. To claim something like a thermodynamic phase transition you'd need more: an order parameter, and evidence that the transition sharpens in a specific way as the system grows, which is what finite-size scaling describes. The paper doesn't test any of that, and doesn't claim to; "phase transition" is an analogy.

---

<p class="eyebrow"><span class="paper">Wei et al. 2022</span> · §5.1 · App. A.1, Fig. 5</p>

## Is it the metric? Asked before Schaeffer

<div class="cols wide-fig">
<div class="text">

- six emergent LaMDA tasks
- error rate flat near 100%
- cross-entropy falls across small models
- an "elbow" at the jump

<p class="q"><b>Q.</b> So small models learn nothing?</p>
<p class="a"><b>A.</b> No: they put more probability on the answer</p>

</div>
<div class="fig"><img src="img/week-06-wei-fig5.png" alt="Wei et al. Figure 5: for three generative tasks on LaMDA, error rate stays near 100% until about 1e22 FLOPs while cross-entropy loss falls across the small models, with an elbow at the point of emergence"></div>
</div>

<p class="footnote">Wei et al. 2022 · §5.1, App. A.1, Fig. 5: exact match "may disguise compounding incremental improvements as emergence". All six tasks show this ("Outcome 2"); it repeats BIG-Bench's analysis</p>

Note:
The part of the paper to pay most attention to. The authors raise the alternative explanation themselves: maybe the models improve smoothly all along, and the metric hides it until a threshold.
They test it on six BIG-Bench tasks where LaMDA looks emergent. For the three generative ones here, the error rate is flat near 100%, but the cross-entropy on the correct answer falls across the small models: they are putting more and more probability on the right answer, even though their score doesn't move. All six tasks behave this way.
In their words, exact match "may disguise compounding incremental improvements as emergence". They also note an elbow in the loss at the same scale as the jump, without drawing a conclusion from it.

---

<p class="eyebrow"><span class="paper">Wei et al. 2022</span> · toy model</p>

## A toy: ten tokens, all must be right

<div class="cols">
<div class="text">

<div class="eq">$$P(\text{exact match}) = p^{10}$$</div>

<table class="rules">
  <tr><td>per-token $p$</td><td class="num">exact match</td></tr>
  <tr><td>0.5</td><td class="num">0.10%</td></tr>
  <tr><td>0.7</td><td class="num">2.8%</td></tr>
  <tr><td>0.8</td><td class="num">10.7%</td></tr>
  <tr><td>0.9</td><td class="num">34.9%</td></tr>
  <tr class="total"><td>0.95</td><td class="num">59.9%</td></tr>
</table>

</div>
<div class="fig"><img src="img/week-06-wei-p10.svg" alt="Illustration: per-token probability correct p rises linearly while exact match on a 10-token answer, p^10, stays near zero until p is about 0.7 and then rises steeply"></div>
</div>

<p class="footnote">Illustration; assumes each token is right independently, which real tokens are not. Schaeffer et al. 2023 (next) builds the argument on this</p>

Note:
Why the metric can do this, in one line. Suppose an answer is ten tokens and each is right with probability p, independently. Exact match needs all ten, so it scores p to the tenth.
Per-token accuracy of 0.5 gives exact match of a tenth of a percent; 0.7 gives under 3%; 0.9 gives 35%. The underlying token accuracy rises steadily; the exact-match score sits near zero for a long time and then shoots up. That looks like emergence without any jump in token-level competence.
It's simplified: tokens aren't independent, and greedy decoding behaves differently from sampling. But it shows the measurement problem, and it's the core of the next paper.

---

<p class="eyebrow"><span class="paper">Wei et al. 2022</span> · App. A.1 · Fig. 6</p>

## What about multiple-choice tasks?

<div class="cols">
<div class="text">

- logical arguments, sports, figures of speech
- error near random; loss still falls
- bottom: correct vs wrong answers
- both fall together, then split apart

<p class="q"><b>Q.</b> Why both at first?</p>
<p class="a"><b>A.</b> Bigger models give "less-extreme probabilities"</p>

</div>
<div class="fig"><img src="img/week-06-wei-fig6.png" alt="Wei et al. Figure 6: for logical arguments, sports understanding and figure of speech on LaMDA, error rate near random until the largest models while cross-entropy falls; bottom row, the negative log probability of correct and incorrect responses falls together and then diverges at the scale where accuracy improves"></div>
</div>

<p class="footnote">Wei et al. 2022 · App. A.1, Fig. 6. Logical arguments has only 32 examples</p>

Note:
The same check on three multiple-choice tasks. Error rate sits near random until the largest models; cross-entropy improves anyway.
The bottom row is the interesting one: the log probability the model puts on the correct answer and on the wrong answers. For small models both negative log probabilities fall together, because bigger models give less extreme probabilities to everything. At the scale where accuracy jumps, they split apart: the correct answer pulls ahead. That's the picture the next slide formalises.

---

<p class="eyebrow"><span class="paper">Wei et al. 2022</span> · our framing of App. A.1</p>

## Smooth margin, step-like accuracy

<div class="rows">
<div class="points">
<div class="text">

<div class="eq">$$m(x;N) = \log p_N(y^* \mid x) - \max_{y \ne y^*} \log p_N(y \mid x)$$</div>

- correct exactly when $m > 0$
- accuracy $= P_x\big(m(x;N) > 0\big)$

</div>
<div class="text">

- $m$ can grow smoothly: $a(x) + b\log N$
- each question flips once
- similar difficulties ▸ sharp aggregate jump

</div>
</div>
<div class="fig"><img src="img/week-06-wei-margin.svg" alt="Illustration: left, the margin of the median question rises linearly with log N and crosses zero at 1e10; right, accuracy as the share of questions with positive margin, gradual when difficulties are spread out and sharp when they are similar"></div>
</div>

<p class="footnote">Illustration and derivation ours, not in Wei et al.; it formalises Fig. 6 (bottom row). Crossing the boundary is a real change in outputs, not proof of a new internal mechanism</p>

Note:
A simple way to see it, our own framing. For one multiple-choice question, define the margin: the log probability of the correct answer minus that of the strongest wrong answer. The model answers correctly exactly when the margin is positive.
Suppose the margin grows smoothly with log model size, a(x) plus b log N, where a(x) is the question's difficulty. Nothing discontinuous happens inside the model. But accuracy on that question is a step: wrong until the margin crosses zero, right after. Averaged over questions, accuracy is the share of questions whose margin has crossed zero. If the questions have similar difficulty, they all cross at about the same scale and the average jumps (right panel, dark curve); if difficulty is spread out, it rises gradually.
So the transition can be in the decision boundary, not in the learning dynamics. Two cautions: crossing the boundary is a real change in what the model outputs, which may matter a lot for an application. And it doesn't prove there's no internal change either.

---

<p class="eyebrow"><span class="paper">Wei et al. 2022</span> · App. A.2 · Fig. 7</p>

## Does partial credit remove the jump?

<div class="rows">
<div class="points">
<div class="text">

- three generative tasks, every BIG-Bench metric
- BLEU, ROUGE: overlap with the answer

</div>
<div class="text">

- BLEURT: a learned similarity
- every metric that moves still jumps

</div>
</div>
<div class="fig"><img src="img/week-06-wei-fig7.png" alt="Wei et al. Figure 7: modified arithmetic, IPA transliterate and periodic elements scored with exact match, BLEU, ROUGE, BLEURT and other metrics; under every metric that moves, the largest gains come at the last one or two models"></div>
</div>

<p class="footnote">Wei et al. 2022 · App. A.2, Fig. 7: exact match "is not a complete explanation of emergence on generative tasks". App. E lists periodic elements as smoothly increasing</p>

Note:
The authors go one step further. If exact match is the problem, metrics that give partial credit should smooth the curve. They rescore three generative tasks with every metric BIG-Bench provides: BLEU and ROUGE, which count overlapping words, and BLEURT, a learned similarity score. Under every metric that moves, the jump survives: BLEURT, and ROUGE on IPA, are above zero for small models, but the biggest gains are still at the last two models.
Schaeffer's reply, next reading: these partial-credit metrics are still nonlinear in the per-token error.

---

<p class="eyebrow"><span class="paper">Wei et al. 2022</span> · §5.1 · their conclusion</p>

## So what did Wei conclude?

<div class="cols">
<div class="text">

- the metric hides some progress
- but is "at best an incomplete explanation"
- classification tasks jump too
- partial credit still jumps
- (and they note an elbow in the loss)

</div>
<div class="text">

<p class="q"><b>Q.</b> Can we predict where the jump will be?</p>
<p class="a"><b>A.</b> Their own answer: no</p>

<blockquote>"this analysis does not explain why downstream metrics are emergent or enable us to predict the scale"</blockquote>

</div>
</div>

<p class="footnote">Wei et al. 2022 · §5.1, App. A.1, A.2</p>

Note:
Their conclusion is careful. The metric does hide incremental progress, they agree. But they call it at best an incomplete explanation, for two reasons: classification tasks are emergent too, and partial-credit metrics still show the jump. They also note an elbow in the loss at the same scale.
And they say plainly that their analysis doesn't explain why the downstream metrics jump, or let you predict at what scale. Keep that sentence for the next reading.

---

<p class="eyebrow"><span class="paper">Wei et al. 2022</span> · §5.1 Potential explanations</p>

## Could there be a real mechanism?

<div class="cols">
<div class="text">

- depth: $l$ sequential steps may need $O(l)$ layers
- knowledge: more parameters store more facts
- composition (ours): $k$ sub-skills, $P = p(N)^k$
- or a new strategy that ties them (ours)

</div>
<div class="text">

<p class="q"><b>Q.</b> Can exact match tell these apart?</p>
<p class="a"><b>A.</b> No. Score the sub-steps instead</p>
<p class="q"><b>Their proposal</b></p>
<p class="a">a synthetic task of compositional sub-tasks</p>

</div>
</div>

<p class="footnote">Wei et al. 2022 · §5.1 (depth, memorisation), §5.6: "create a synthetic task that requires multiple compositional sub-tasks". The depth bound is an intuition, not a theorem for these benchmarks</p>

Note:
The authors give two possible mechanisms without settling on either; the compounding and new-strategy readings are ours. A task with l sequential steps might need a network with at least order-l layers; that's an intuition, not a general bound for Transformers. Knowledge-heavy tasks might need enough parameters to store the facts. Our addition: a task might need k sub-skills, each improving gradually, so the end-to-end success is p to the k: the same compounding as the toy. Or the model might learn a genuinely new strategy that coordinates them.
Under exact-match accuracy those look the same. Mechanistically they're very different. That's why their suggested future work is the most testable idea in the paper: build a synthetic task from compositional sub-tasks, and watch each sub-task improve with scale.

---

<p class="eyebrow"><span class="paper">Wei et al. 2022</span> · §5.2 Beyond scaling</p>

## Is model size the right axis?

<table class="rules">
  <tr><td>finding</td><td>smaller model</td><td>larger model</td></tr>
  <tr><td>14 BIG-Bench tasks above random</td><td>PaLM 62B</td><td>GPT-3 175B, LaMDA 137B: at random</td></tr>
  <tr><td>instruction tuning helps</td><td>T0 11B</td><td>FLAN needed 68B</td></tr>
  <tr class="total"><td>preferred by human raters</td><td>InstructGPT 1.3B</td><td>much larger models</td></tr>
</table>

<p class="center"><b>If the threshold moves with the recipe, size isn't the whole story</b></p>

<p class="footnote">Wei et al. 2022 · §5.2. Suggested reasons for PaLM: more multilingual and code data, split digit encodings; not ablated ("the computational cost would be too high")</p>

Note:
The paper's own counterweight to "just scale". PaLM 62B is above random on 14 BIG-Bench tasks where the bigger GPT-3 and LaMDA are not. Instruction tuning needed 68B in FLAN but worked at 11B in T0. InstructGPT at 1.3B was preferred by human raters over much larger models (Week 9).
If the threshold moves this much with data, code, tokenization and training recipe, then model size can't be the full control variable.

---

<p class="eyebrow"><span class="paper">Wei et al. 2022</span> · §5.3 · Fig. 4</p>

## Maybe loss is the better axis?

<div class="rows">
<div class="points">
<div class="text">

- MMLU against FLOPs, parameters, perplexity
- Gopher and Chinchilla: all three look alike

</div>
<div class="text">

- because the three move together here
- the test: models with equal loss, different size

</div>
</div>
<div class="fig"><img src="img/week-06-wei-fig4.png" alt="Wei et al. Figure 4: top, training FLOPs against parameters and WikiText103 perplexity against FLOPs and parameters for Gopher and Chinchilla; bottom, MMLU accuracy against FLOPs, parameters and perplexity, each near 25% then rising"></div>
</div>

<p class="footnote">Wei et al. 2022 · §5.3, Fig. 4 (rendered from the paper's TeX): emergence "should probably be viewed as a function of many correlated variables". Du et al. 2024 (next reading) does this test</p>

Note:
They try one more axis: WikiText-103 perplexity, how well the model predicts held-out text. Plotted against compute, parameters or perplexity, MMLU looks similar for Gopher and Chinchilla, because in these families the three move together.
The experiment that would separate them: two models of very different size that reach the same loss. If loss is what matters, they should be equally able; if raw capacity or architecture matters, they won't be. The paper doesn't run it. Du et al. 2024, in the next reading's sub-slides, does something close.

---

<p class="eyebrow"><span class="paper">Wei et al. 2022</span> · App. A.3, E · Fig. 8</p>

## Which kinds of tasks look emergent?

<div class="cols wide-fig">
<div class="text">

- all 210 BIG-Bench tasks, labelled by hand
- 67 emergent, 58 smooth, 45 flat
- most emergent: analogy, word sense, truthfulness
- arithmetic, maths: few
- "no clear trends"

<p class="q"><b>Q.</b> How solid are the labels?</p>
<p class="a"><b>A.</b> Two co-authors' judgement</p>

</div>
<div class="fig"><img src="img/week-06-wei-fig8.png" alt="Wei et al. Figure 8: number of BIG-Bench tasks per keyword tag, split into emergent with LaMDA or GPT, emergent with PaLM, smoothly increasing and flat"></div>
</div>

<p class="footnote">Wei et al. 2022 · App. A.3, E, Fig. 8 (rendered from the paper's TeX). 67 = 25 emergent with LaMDA/GPT-3 + 42 with PaLM; 40 "other" (our count of App. E)</p>

Note:
They labelled all 210 BIG-Bench tasks by hand: emergent, smoothly increasing, flat, or other (not correlated with scale, worse with scale, too few examples, incomplete evaluations). By our count of their appendix: 67 emergent, 58 smooth, 45 flat, 40 other. Two co-authors agreed on each emergent label.
By keyword, the most emergent categories include analogical reasoning, word-sense disambiguation, truthfulness, social reasoning and emotional understanding. Arithmetic and mathematics have relatively few, which surprised them, since the earliest examples of emergence were on arithmetic. Their own summary: no clear trends.
Limits: categories overlap, groups differ in size, and "emergent" rests on a judgement about how far above chance counts. Exploratory, not a controlled finding about which skills have transitions.

---

<p class="eyebrow"><span class="paper">Wei et al. 2022</span> · Later work</p>

## The challenge that came next

<div class="cols">
<div class="text">

- Schaeffer et al. 2023: "a mirage?"
- same outputs, different metrics
- over 92% of claims: two metrics
- continuous metric: many jumps vanish
- not a proof there is no emergence

</div>
<div class="text">

<p class="q"><b>Q.</b> Settled, then?</p>
<p class="a"><b>A.</b> No: against loss, thresholds remain (Du 2024)</p>

</div>
</div>

<p class="footnote">Schaeffer, Miranda &amp; Koyejo 2023, arXiv:2304.15004 (Reading 4). Du et al. 2024, arXiv:2403.15796. See also Lu et al. 2024 on in-context learning, arXiv:2309.01809</p>

Note:
Brief, because it's the next reading. In 2023 Schaeffer, Miranda and Koyejo took fixed model outputs and rescored them. Over 92% of the hand-labelled emergent BIG-Bench cases use one of two metrics, exact string match or multiple-choice grade, and switching to a continuous metric removes many of the jumps. They can even create jumps on purpose in vision models.
That's strong evidence against treating a sharp benchmark curve as proof of a phase transition. It doesn't show that all capabilities change smoothly. Du et al. 2024 plot performance against pre-training loss and still find thresholds under continuous metrics. Lu et al. argue many emergent abilities are in-context learning combined with memory and linguistic competence. The question is open.

---

<p class="eyebrow"><span class="paper">Wei et al. 2022</span> · a proposal</p>

## What experiment would settle it?

<div class="cols">
<div class="text">

- one model family, a synthetic task
- dense sizes, several seeds
- measure: accuracy, log-likelihood, margin
- and the correctness of each sub-step
- predict large from small, with error bars

</div>
<div class="text">

<p class="q"><b>If only accuracy jumps</b></p>
<p class="a">no new mechanism needed</p>
<p class="q"><b>If sub-steps and internals jump too</b></p>
<p class="a">look for the mechanism, with controls</p>

</div>
</div>

<p class="footnote">Our proposal, building on the paper's §5.6 suggestion; not in Wei et al.</p>

Note:
How would you tell a metric effect from a real change? Two hypotheses. One: the model's relevant quantities improve smoothly, and a thresholded metric turns that into a jump. Two: the model learns a qualitatively different strategy over a narrow range of scale.
A minimal test: one model family, a synthetic task with known intermediate steps, a dense set of sizes and several seeds. Measure final accuracy, the log-likelihood of the answer, the decision margin, and whether each intermediate step is right. Fit on small models and predict the large ones with uncertainty.
If accuracy jumps while everything else is smooth, there's no reason to invoke a new mechanism. If the sub-steps and the model's internal computation also change reproducibly, then mechanistic emergence becomes interesting, and you'd still need controls for optimisation, data coverage and parameterisation.

---

<p class="eyebrow"><span class="paper">Wei et al. 2022</span> · Summary</p>

## How the four readings connect

<table class="rules">
  <tr><td>reading</td><td>contribution</td><td>key object</td></tr>
  <tr><td>Kaplan 2020</td><td>loss scales predictably</td><td>$L(N) \propto N^{-\alpha}$</td></tr>
  <tr><td>Chinchilla 2022</td><td>how to split compute</td><td>$N_{\rm opt}, D_{\rm opt} \propto C^{0.5}$</td></tr>
  <tr><td>Wei 2022</td><td>abilities can look sudden</td><td>$A_{\rm task}(C)$ rises sharply</td></tr>
  <tr class="total"><td>Schaeffer 2023</td><td>maybe the metric</td><td>smooth $p$, thresholded score</td></tr>
</table>

<p class="footnote">Kaplan et al. 2020; Hoffmann et al. 2022; Wei et al. 2022; Schaeffer et al. 2023</p>

Note:
The thread so far. Kaplan: loss follows predictable power laws. Chinchilla: how to divide a compute budget between size and data. Wei: smooth loss can coexist with task scores that rise sharply. Schaeffer, next: some of those rises come from scoring smoothly improving predictions with thresholded metrics.

---

<p class="eyebrow"><span class="paper">Wei et al. 2022</span> · Summary</p>

## What to keep from Wei

<div class="cols">
<div class="text">

- many task curves: flat, then steep
- study abilities, not just average loss
- App. A: loss improves while scores don't
- the phase-transition analogy is weakest
- picked from existing benchmarks, not predicted

</div>
<div class="text">

<p class="q"><b>Open question</b></p>
<p class="a">Is there an internal change at a reproducible scale that survives a change of metric and prompt?</p>

</div>
</div>

<p class="footnote">Wei et al. 2022. Next: Schaeffer et al. 2023 turns the metric critique into a testable argument</p>

Note:
What to keep. The observation is solid: on many tasks, measured accuracy barely moves over several model sizes and then rises quickly. The paper made capability-specific scaling a subject in its own right. Its most revealing analysis is in Appendix A, where task cross-entropy improves while accuracy stays flat, which opens the door to the measurement explanation.
The weakest part is the physics analogy: a sudden rise in a benchmark score isn't evidence of a phase transition inside the network. And there's a selection issue: the examples were picked from existing benchmarks because they looked emergent; no threshold was predicted in advance and then confirmed. So the paper shows apparent capability jumps exist much more convincingly than it shows they're fundamentally unpredictable.
The open question: can we find an internal computational change that happens at a reproducible scale, survives changes of metric and prompt, and can't be explained by smoothly improving probabilities?



---

<!-- .slide: class="cover divider" -->

<p class="kicker">Reading 4 of 4</p>
<h1>Schaeffer et al. 2023</h1>
<p class="subtitle">Are Emergent Abilities of Large Language Models a Mirage?</p>
<p class="question">Is the jump in the model, or in how we score it?</p>
<ol class="track"><li class="done">Kaplan 2020<span>scaling laws</span></li><li class="done">Chinchilla 2022<span>compute-optimal training</span></li><li class="done">Wei 2022<span>emergent abilities</span></li><li class="now">Schaeffer 2023<span>a mirage?</span></li></ol>

Note:
Reading 4 of 4. Schaeffer, Miranda and Koyejo, Stanford, NeurIPS 2023. A direct challenge to the emergence claims we just read in Wei et al.

---

<p class="eyebrow"><span class="paper">Schaeffer et al. 2023</span> · Motivation · Fig. 1</p>

## Is the jump in the model, or in the ruler?

<div class="cols wide-fig">
<div class="text">

- Wei: flat, then a jump
- read as: a new ability at some scale
- Schaeffer: maybe nothing sudden inside
- a smooth model, a jumpy score

<p class="q"><b>Q.</b> How could you tell the two apart?</p>
<p class="a"><b>A.</b> Keep the outputs, change only the score</p>

</div>
<div class="fig"><img src="img/week-06-wei-fig2.png" alt="Wei et al. Figure 2, reproduced as Schaeffer et al. Figure 1: eight tasks where few-shot performance stays near random and then rises for the largest models"></div>
</div>

<p class="footnote">Schaeffer, Miranda &amp; Koyejo 2023 · arXiv:2304.15004 · NeurIPS 2023. Their Fig. 1 reproduces Wei et al. 2022 Fig. 2 (shown here rendered from Wei's TeX)</p>

Note:
Recall Wei et al.: on some tasks, small models score near zero, then a big enough model suddenly scores well. Wei called these emergent abilities, ones you could not predict by extrapolating from smaller models.
Schaeffer and colleagues propose a different explanation. What if nothing particularly sudden happens inside the model? What if models improve gradually, and our way of scoring them makes the improvement look like a phase transition? The test that follows from this is simple: hold the model outputs fixed and change only the scoring. That's the backbone of the paper.

---

<p class="eyebrow"><span class="paper">Schaeffer et al. 2023</span> · §1 Introduction</p>

## What exactly is being questioned?

<div class="cols">
<div class="text">

<blockquote>"1. Sharpness, transitioning seemingly instantaneously from not present to present<br>2. Unpredictability, transitioning at seemingly unforeseeable model scales"</blockquote>

- both properties questioned
- for the published examples

</div>
<div class="text">

<p class="q"><b>Q.</b> Main cause, in their words?</p>
<p class="a"><b>A.</b> "a metric that nonlinearly or discontinuously deforms per-token error rates"</p>
<p class="q"><b>Q.</b> Second cause?</p>
<p class="a"><b>A.</b> "too few test data" to measure small models</p>

</div>
</div>

<p class="footnote">Schaeffer et al. 2023 · §1. The two properties are distilled from quotations in the emergence literature</p>

Note:
They start by pinning down what makes emergence interesting. Collecting quotes from the literature, they find two defining properties: sharpness, going from absent to present almost at once, and unpredictability, happening at a scale nobody could have foreseen.
Their thesis ranks two causes. Primarily, the researcher chose a metric that nonlinearly or discontinuously deforms per-token error rates. Secondarily, there was too little test data to estimate how well the small models really do.

---

<p class="eyebrow"><span class="paper">Schaeffer et al. 2023</span> · §2 Alternative explanation</p>

## What could make a smooth model look sudden?

<div class="cols">
<div class="text">

1. a nonlinear or discontinuous metric
2. too few test examples at small scale
3. too few model sizes at large scale

</div>
<div class="text">

<p class="q"><b>Q.</b> Do they say emergence is impossible?</p>
<p class="a"><b>A.</b> No. Only that this evidence doesn't show it</p>
<p class="q"><b>Q.</b> What do they assume?</p>
<p class="a"><b>A.</b> Loss falls smoothly; a power law only illustrates it</p>

</div>
</div>

<p class="footnote">Schaeffer et al. 2023 · §2: sharp, unpredictable changes "can be fully explained by three interpretable factors"; resolution "set by 1/test dataset size". Disclaimer in §7</p>

Note:
The paper names three ingredients. One, a metric that bends a smooth improvement: exact-match accuracy and multiple-choice grading turn graded progress into all-or-nothing success. Two, too little evaluation data: a small but nonzero success rate gets recorded as zero. Three, too few model sizes: four points can make a gradual rise look abrupt.
Importantly, they don't claim genuine emergence is impossible. Their stated aim is to challenge whether the existing evidence demonstrates it. And notice the starting assumption: loss falls smoothly with scale. They use a Kaplan-style power law, but say the exact form isn't required. The paper builds on the scaling laws; it doesn't explain them.

---

<p class="eyebrow"><span class="paper">Schaeffer et al. 2023</span> · the key distinction</p>

## The model, or the metric?

<div class="cols">
<div class="text">

- model: a distribution $p_\theta(y \mid x)$
- researcher: a score $A = M(p_\theta, y^*)$
- what gets plotted:

<div class="eq">$$A(N) = M\big(p_{\theta_N},\ y^*\big)$$</div>

</div>
<div class="text">

<p class="q"><b>Q.</b> If $p_{\theta_N}$ changes smoothly with $N$, must $A(N)$?</p>
<p class="a"><b>A.</b> No. $M$ can bend it, even into a step</p>
<p class="q"><b>Q.</b> Which one do benchmarks plot?</p>
<p class="a"><b>A.</b> $A$, never $p$ itself</p>

</div>
</div>

<p class="footnote">Our notation for the argument of Schaeffer et al. 2023 §2. $N$: parameters; $y^*$: the target answer</p>

Note:
This one distinction carries the whole paper. A model produces a probability distribution over outputs. A researcher turns those predictions into a number with a scoring function M. So every scaling curve of a benchmark is a composition: the model at size N, then the metric.
Even if the model's probabilities change smoothly with N, the metric can turn that into a rapid, or even discontinuous, change in the score. Benchmarks report the score, so that's what Wei plotted.

---

<p class="eyebrow"><span class="paper">Schaeffer et al. 2023</span> · overview</p>

## Three tests of one idea

<table class="rules">
  <tr><td>test</td><td>what changes</td><td>what stays fixed</td></tr>
  <tr><td>GPT-3 arithmetic, §3</td><td>the metric; the test-set size</td><td>the model outputs</td></tr>
  <tr><td>BIG-Bench meta-analysis, §4</td><td>which metric shows emergence</td><td>published scores</td></tr>
  <tr><td>LaMDA rescoring, §4</td><td>multiple choice ▸ Brier</td><td>LaMDA's outputs</td></tr>
  <tr class="total"><td>vision networks, §5</td><td>a metric they invent</td><td>ordinary training</td></tr>
</table>

<p class="footnote">Schaeffer et al. 2023 · §3 to §5. Unlike Kaplan and Chinchilla, no new scaling exponent is fitted</p>

Note:
Unlike Kaplan and Chinchilla, they aren't fitting a universal scaling exponent. They give a mathematical account of apparent emergence, then test it three ways.
First, GPT-3 arithmetic: does emergence disappear when the same outputs are scored differently, or with more test data? Second, BIG-Bench: are the reported emergent abilities concentrated on particular metrics, and do they vanish when LaMDA's released outputs are rescored? Third, vision: can you manufacture apparent emergence in unrelated networks just by choosing a metric?
The third is the cleverest. If an ordinary vision model can be made to look emergent by changing only the evaluation, then the shape of such a curve is not evidence of a new internal mechanism.

---

<p class="eyebrow"><span class="paper">Schaeffer et al. 2023</span> · §2 · Fig. 2</p>

## Can a smooth loss produce a sudden jump?

<div class="rows">
<div class="points">
<div class="text">

- A: loss, a power law in $N$
- B: per-token probability correct, toward 1

</div>
<div class="text">

- C, D: exact match, multiple choice: jumps
- E, F: edit distance, Brier: smooth

</div>
</div>
<div class="fig"><img src="img/week-06-schaeffer-fig2.png" alt="Schaeffer et al. Figure 2: per-token cross-entropy falls as a power law in parameters (A), so per-token probability correct rises smoothly (B); scored with accuracy on 5-token targets (C) or multiple-choice grade (D) the curve looks emergent; scored with token edit distance (E) or Brier score (F) it improves smoothly"></div>
</div>

<p class="footnote">Schaeffer et al. 2023 · Fig. 2. C and E: 5-token targets; D and F: 2 choices. Insets: published emergent curves, for comparison</p>

Note:
The most important figure. The centre column is the model: loss falls as a smooth power law (A), so the probability of each token being right rises smoothly (B). Nothing sudden there.
Left: score the same predictions with a nonlinear metric, exact match on five tokens (C), or a discontinuous one, multiple-choice grade (D), and you get curves that look like the published emergent abilities, in the insets. Right: score them with a linear metric, token edit distance (E), or a continuous one, Brier score (F), and the improvement is smooth.
Same predictions, qualitatively different plots. The next slides derive each piece.

---

<p class="eyebrow"><span class="paper">Schaeffer et al. 2023</span> · §2 · Fig. 2A, B</p>

## Step 1: from loss to per-token probability

<div class="cols wide-fig">
<div class="text">

<div class="eq">$$L_{\rm CE}(N) = \Big(\frac{N}{c}\Big)^{\alpha}, \quad c > 0,\ \alpha \lt 0$$</div>
<div class="eq">$$p(N) = e^{-L_{\rm CE}(N)} = \exp\!\big(-(N/c)^{\alpha}\big)$$</div>

- smooth in $N$, rises toward 1
- form "for illustrative purposes"

<p class="q"><b>Q.</b> Is $e^{-\text{mean loss}}$ the accuracy?</p>
<p class="a"><b>A.</b> No: a geometric mean of $p(y^*)$, not greedy accuracy</p>

</div>
<div class="fig"><img src="img/week-06-schaeffer-fig2.png" alt="Schaeffer et al. Figure 2, see the centre column: panel A, loss falling as a straight line on log-log axes; panel B, per-token probability correct rising from about 0.1 to 0.9"></div>
</div>

<p class="footnote">Schaeffer et al. 2023 · §2, Fig. 2A, B. $\alpha \lt 0$ here, so loss falls with $N$. The constants $c$, $\alpha$ behind Fig. 2 are not printed. Q&amp;A: ours</p>

Note:
Assume something like Kaplan's law: per-token cross-entropy falls as a power of N. In their notation the exponent alpha is negative. They stress that they don't need this exact form; it's for illustration.
For a target token, cross-entropy is minus the log of the probability assigned to it, so the probability is e to the minus loss. Substituting the power law gives a smoothly rising probability of getting a token right.
One caveat. e to the minus the average cross-entropy is the geometric mean of the target-token probabilities, not the accuracy of greedy decoding. That matters if you treat the model as quantitative; it doesn't stop it illustrating the measurement effect.

---

<p class="eyebrow"><span class="paper">Schaeffer et al. 2023</span> · §2 · exact match</p>

## Step 2: every token must be right

<div class="cols wide-fig">
<div class="text">

<div class="eq">$$A_L(N) \approx p(N)^L = \exp\!\big(-L\,(N/c)^{\alpha}\big)$$</div>

- 12345: all five digits right
- independence: "not true", they say
- longer answer: sharper curve

<p class="q"><b>Q.</b> $p$: 0.2 ▸ 0.4?</p>
<p class="a"><b>A.</b> 0.032% ▸ 1%: 32x better, still reads 0</p>
<p class="q"><b>Q.</b> $p$: 0.7 ▸ 0.9?</p>
<p class="a"><b>A.</b> 17% ▸ 59%: looks like a new skill</p>

</div>
<div class="fig"><img src="img/week-06-schaeffer-pL.svg" alt="Illustration: probability the whole answer is right against per-token probability p, for answers of 1, 3 and 5 tokens; the 5-token curve stays near zero until p is about 0.5 and then rises steeply, with points at 0.032%, 1.0%, 16.8% and 59.0%"></div>
</div>

<p class="footnote">Schaeffer et al. 2023 · §2. Illustration: tokens right or wrong independently, as in their model. The Wei section's toy used 10 tokens</p>

Note:
Now the metric. Say the task is arithmetic and the answer is 12345. Exact match gives credit only if all five digits are right. If each digit is right with probability p, independently, the whole answer is right with probability p to the fifth. For length L, p to the L.
Read the five-token curve. Going from 0.2 to 0.4 per token takes exact match from 0.032% to about 1%: a 32-fold improvement that a small evaluation would still record as roughly zero. From 0.7 to 0.9 it jumps from 17% to 59%. Someone looking only at exact match would say the model suddenly learned arithmetic. The per-token correctness improved steadily the whole time.
They say plainly in a footnote that independence is not true; the approximation is only meant to match the emergence claims qualitatively.

---

<p class="eyebrow"><span class="paper">Schaeffer et al. 2023</span> · §2 · why it looks like a step</p>

## Continuous, so why does it look like a step?

<div class="cols wide-fig">
<div class="text">

- $p(N)^L$ is smooth: no discontinuity
- very flat early, steep later
- linear $y$, log $x$: flat part reads 0
- 4 sizes; 6.7B to 175B: a 26x gap

<p class="q"><b>Q.</b> Which of the three factors?</p>
<p class="a"><b>A.</b> 3: too few sizes where it rises</p>

</div>
<div class="fig"><img src="img/week-06-schaeffer-sparse.svg" alt="Illustration: exact match on 5 tokens against parameters on a log axis; a dashed curve for every size and black dots at 350M, 1.3B, 6.7B and 175B joined by straight lines; the dots read near zero for the first three and 0.59 at 175B"></div>
</div>

<p class="footnote">Illustration: the §2 model with $\alpha$ = −0.5, $c$ = 2 × 10<sup>9</sup>, our constants chosen to reproduce Fig. 2 (the paper prints none). §2: the jump shows "on a linear-log plot"</p>

Note:
A subtle point. In their simple model, exact match is p of N to the L: a perfectly continuous function of N. Nothing is discontinuous. What it does is stay extremely flat over one range of sizes and rise quickly over another.
Three things then make it look like a phase transition. The y-axis is linear, so a value of one in a thousand looks like zero. The x-axis is log scale. And there are only four model sizes, with a 26-fold gap between the last two, so the plot shows three points near zero and then a big one.
The dashed curve is the same model at every size. The black line is what you see with four sizes. Constants here are ours, chosen to reproduce Figure 2; the paper doesn't print them.

---

<p class="eyebrow"><span class="paper">Schaeffer et al. 2023</span> · §2 · App. A.2 · token edit distance</p>

## Partial credit: token edit distance

<div class="cols">
<div class="text">

<table class="rules">
  <tr><td>target</td><td>output</td><td class="num">distance</td></tr>
  <tr><td>12345</td><td>12345</td><td class="num">0</td></tr>
  <tr><td>12345</td><td>12346</td><td class="num">1</td></tr>
  <tr><td>12345</td><td>12356</td><td class="num">2</td></tr>
  <tr class="total"><td>12345</td><td>98765</td><td class="num">4</td></tr>
</table>

</div>
<div class="text">

<div class="eq">$$\text{edit distance}(N) \approx L\,\big(1 - p(N)\big)$$</div>

- exact match: $p^L$, a power of $p$
- edit distance: linear in the error rate
- plotted negated: higher is better

<p class="q"><b>Q.</b> The prediction?</p>
<p class="a"><b>A.</b> Same outputs, edit distance: smooth</p>

</div>
</div>

<p class="footnote">Schaeffer et al. 2023 · §2, App. A.2. Levenshtein distance: fewest substitutions, insertions and deletions. App. A.2 writes $L(1-\epsilon)$ with $\epsilon$ the error rate; it should be $L\epsilon$</p>

Note:
The first falsification test needs a metric that gives partial credit. Token edit distance counts how many changes turn the output into the target: substitutions, insertions, deletions.
If each of L positions is wrong with probability one minus p, the expected number of wrong tokens is L times one minus p. Compare: exact match depends on a power of p; edit distance is linear in the error rate. That's the difference between panels C and E of Figure 2.
So a prediction: if arithmetic only looks emergent because of exact match, scoring the same generated answers by edit distance should show the small models gradually improving. One slip to know about: the appendix writes L times one minus epsilon where epsilon is the error rate; it should be L epsilon. The main-text form is right.

---

<p class="eyebrow"><span class="paper">Schaeffer et al. 2023</span> · §3 InstructGPT/GPT-3 arithmetic</p>

## GPT-3 arithmetic: what did they run?

<div class="cols">
<div class="text">

- InstructGPT/GPT-3: 350M, 1.3B, 6.7B, 175B
- 2-shot multiply: 2 digits × 2 digits
- 2-shot add: 4 digits + 4 digits
- target lengths 1 to 5 (products: at most 4)
- temperature 0 and 1

</div>
<div class="text">

<p class="q"><b>Their predictions</b></p>

1. other metric: smooth
2. more test data: small models above 0
3. longer targets: geometric fall in accuracy, about linear in edit distance

</div>
</div>

<p class="footnote">Schaeffer et al. 2023 · §3. The four sizes available through the OpenAI API (March 2023); GPT was the family they could query. Predictions stated before results; not a formal preregistration</p>

Note:
Now the experiments. GPT-3, because it was the family anyone could query: four sizes available through the API in March 2023. Two tasks that earlier papers had shown as emergent: two-shot multiplication of two-digit numbers, and two-shot addition of four-digit numbers. They score target strings of length one to five, at temperatures 0 and 1.
Before the results they state three predictions, all from the simple model. Change to a linear or continuous metric and improvement should look smooth. Add test data and the small models should show nonzero accuracy. And longer targets should hurt accuracy roughly geometrically, edit distance roughly linearly. Stated up front, though not formally preregistered.

---

<p class="eyebrow"><span class="paper">Schaeffer et al. 2023</span> · §3 · Fig. 3</p>

## Same outputs, two metrics?

<div class="rows">
<div class="points">
<div class="text">

- columns: their model, multiply, add
- top: accuracy (exact match)

</div>
<div class="text">

- bottom: minus token edit distance
- outputs fixed; only the score changes

</div>
</div>
<div class="fig"><img src="img/week-06-schaeffer-fig3.png" alt="Schaeffer et al. Figure 3: six panels. Top row, accuracy against parameters for the model, multiplication and addition: longer targets stay near zero until 6.7B and then rise to 175B. Bottom row, negative token edit distance for the same outputs rises at every size"></div>
</div>

<p class="footnote">Schaeffer et al. 2023 · Fig. 3, assembled from the paper's six panel files. Colour: target length 1 to 5; line style: temperature</p>

Note:
Figure 3. Three columns: the mathematical model, multiplication, addition. Top row, accuracy: the longer targets stay near zero for the smaller GPT-3 models, then rise at the largest. That looks like the published emergent arithmetic.
Bottom row, the same outputs scored by token edit distance, negated so higher is better: improvement across all sizes. Even the small models get more of the digits right as they grow.
The striking thing is what's held fixed. No retraining, no new prompts, no arithmetic data. Only the scoring changes.

---

<p class="eyebrow"><span class="paper">Schaeffer et al. 2023</span> · §3 · Fig. 3, multiplication</p>

## Read the longest-target curves

<div class="rows">
<div class="points">
<div class="text">

- length 4: under 0.1 up to 6.7B, then about 0.85
- edit distance: better at almost every size

<p class="q"><b>Q.</b> What changed between the panels?</p>
<p class="a"><b>A.</b> Only the scoring function</p>

</div>
<div class="text">

<p class="q"><b>Q.</b> Is the bottom a straight line?</p>
<p class="a"><b>A.</b> No: the biggest gain is still in the last gap</p>
<p class="q"><b>Q.</b> Does it show the internals are smooth?</p>
<p class="a"><b>A.</b> No: only that the curve depends on $M$</p>

</div>
</div>
<div class="fig"><img src="img/week-06-schaeffer-mult.png" alt="Schaeffer et al. Figure 3, multiplication: left, accuracy for the longest targets near zero at 350M, 1.3B and 6.7B, then about 0.85 at 175B; right, negative token edit distance for the same outputs rising at every size, most steeply in the last gap to near zero at 175B"></div>
</div>

<p class="footnote">Schaeffer et al. 2023 · Fig. 3 (multiplication column). "keeping the models' outputs fixed" (§3). A 2-digit product has at most 4 digits, though §3 says "4 or 5 digits". Q&amp;A on the right: ours</p>

Note:
Zoom in on multiplication. Under accuracy, the longest targets read essentially zero for three model sizes, then about 0.85 at 175B: textbook emergence. (Two 2-digit numbers multiply to at most 4 digits, so for this task the longest real target is 4 digits, even though the paper's text says 4 or 5.)
Under edit distance, the same outputs get better at almost every step; one curve dips slightly between 350M and 1.3B. That's the core result: the shape of the curve depends on the metric.
Two honest readings. First, the bottom curve isn't a straight line either: the largest gain is still between 6.7B and 175B, the 26-fold gap. Smoother, but not uniform. Second, this doesn't show the model's internal algorithm is unchanged. It undermines a specific inference: that a flat exact-match curve proves the small models have no task-relevant competence.

---

<p class="eyebrow"><span class="paper">Schaeffer et al. 2023</span> · §2 · resolution</p>

## Is a measured zero really zero?

<div class="cols wide-fig">
<div class="text">

- true rate $q$ = 0.001, 100 questions
- $P(\text{score} = 0) = 0.999^{100} \approx 0.905$
- smallest nonzero score: $1/m$
- 100 questions can't show 0.1%

<p class="q"><b>Q.</b> The fix?</p>
<p class="a"><b>A.</b> More questions, and a log-scale axis</p>

</div>
<div class="fig"><img src="img/week-06-schaeffer-zero.svg" alt="Illustration: chance of scoring exactly zero against the number of test questions on a log axis; for a true rate of 0.001 it is 90.5% at 100 questions, 36.8% at 1,000 and 0.7% at 5,000; for 0.01 it falls much sooner"></div>
</div>

<p class="footnote">Illustration: independent questions of equal difficulty. Schaeffer et al. 2023 §2: resolution is "set by 1/test dataset size"</p>

Note:
The second ingredient, statistical resolution. Suppose a small model truly gets an arithmetic question right one time in a thousand. Test it on 100 questions. The chance of seeing zero correct is 0.999 to the 100th, about 90%. Nine times out of ten you'd report zero.
Another way to see it: with m questions, the possible scores are 0, 1 over m, 2 over m and so on. With 100 questions the smallest nonzero score is 1%; you can't observe 0.1%.
So a flat line at zero over the small models may just mean the test set was too small to resolve them.

---

<p class="eyebrow"><span class="paper">Schaeffer et al. 2023</span> · §3 · Fig. 4</p>

## More test data: are the small models at zero?

<div class="rows">
<div class="points">
<div class="text">

- more test questions; log-scale accuracy
- every size above zero

</div>
<div class="text">

- longer targets: falls about geometrically
- as the model (left) predicts

</div>
</div>
<div class="fig"><img src="img/week-06-schaeffer-fig4.png" alt="Schaeffer et al. Figure 4: accuracy on a log scale against parameters for the model, multiplication and addition; every GPT-3 size has nonzero accuracy, longer targets are lower by roughly constant factors, and a dashed horizontal line sits near 1e-4"></div>
</div>

<p class="footnote">Schaeffer et al. 2023 · Fig. 4. How many extra questions: not stated. The dashed lines (10<sup>−4</sup>, about 5 × 10<sup>−5</sup>) are not explained; a few points fall below them. Later work below (press ↓)</p>

Note:
They generated more test questions and replotted accuracy on a log scale. With enough data, every model in the family has measurable accuracy on both tasks, including targets that read as zero before. And as targets get longer, accuracy drops by roughly constant factors, the geometric fall the model predicts.
Two gaps. The paper doesn't say how many questions it added. And each panel has a dashed horizontal line that is never explained; if it's meant as chance, a couple of the 350M points sit under it, which sits awkwardly with their statement that all models "achieve above-chance accuracy".

--

<p class="eyebrow"><span class="paper">Schaeffer et al. 2023</span> · Later work · Hu et al. 2024</p>

## How far can resolution go?

<div class="rows">
<div class="points">
<div class="text">

- PassUntil: sample until $r$ answers pass
- pass rate $r/K$, up to $K = 10^5$ samples
- small models: about $10^{-5}$, not 0

</div>
<div class="text">

- fit to 1.5B, predict 2.4B
- HumanEval: 0.05990 real, 0.05987 predicted
- keep resolution, reject the metric half

</div>
</div>
<div class="fig"><img src="img/week-06-hu-fig1.png" alt="Hu et al. Figure 1: left, BIG-Bench emoji_movie exact match measured by PassUntil on Hu et al.'s models rises smoothly from near zero and follows a fitted curve; right, conventional exact-match scores for BIG-G models (Sorscher et al. 2022) read zero below about 1B parameters"></div>
</div>

<p class="footnote">Hu et al. 2024 (ICLR) · arXiv:2310.03262 · Fig. 1, §4 to §5. HumanEval: Python problems with unit tests. 0.05% is relative error on a 6% pass rate, with an instance-level fit; other tasks 1.7% to 19%. Models up to 2.4B</p>

Note:
Optional. Hu et al. push resolution as far as it goes. Instead of one answer per question, keep sampling until the model gets it right once or twice, up to 100,000 samples. Pass rates near one in a hundred thousand become measurable.
With that, small models aren't at zero: they improve smoothly, and the curve can be fit and extrapolated. Their headline: fit on models up to 1.5B and predict the 2.4B model's HumanEval pass rate to within 0.05%, relative.
Their stance on Schaeffer is split: they accept the resolution argument but reject the metric one, because exact match is what we care about. And on 5 of 8 in-context-learning tasks they see growth faster than their law predicts, which they can't fully explain.

---

<p class="eyebrow"><span class="paper">Schaeffer et al. 2023</span> · §3 · what it shows</p>

## What does the arithmetic show, and not show?

<div class="cols">
<div class="text">

<p class="q"><b>Strong</b></p>

- exact match hides partial progress
- small test sets hide small rates
- same outputs: a clean control

</div>
<div class="text">

<p class="q"><b>Weaker</b></p>

- two tasks, one family, 4 sizes
- no fit on small, predict large
- $p^L$ never fitted to GPT-3's per-token data

</div>
</div>

<p class="footnote">Schaeffer et al. 2023 · §3. "Weaker" column: our reading. A comparison with GPT-3's measured per-token probabilities was cut from the paper; it survives only, commented out, in the arXiv source</p>

Note:
What does this establish? Two claims, strongly. Exact-match scoring can hide progress that a graded score shows. And small test sets can make small models look like they have zero ability when they have a small, measurable one. Holding the outputs fixed makes that a clean experiment.
Less decisively: that arithmetic learning itself is smooth or predictable. Two tasks, one model family, four sizes. They never fit a curve on the small models and predict the big one out of sample. And the p-to-the-L model is never fitted to GPT-3's actual per-token accuracy; an analysis that would have done so was cut. So the evidence is qualitative: smoother under other measures, not a predictive theory.

---

<p class="eyebrow"><span class="paper">Schaeffer et al. 2023</span> · §4 Meta-analysis of claimed emergent abilities</p>

## If emergence belongs to a task, why only some metrics?

<div class="cols">
<div class="text">

- BIG-Bench: over 200 tasks, many metrics
- a real new ability: visible under several
- a metric artefact: only under harsh ones

</div>
<div class="text">

<p class="q"><b>Their predictions</b></p>

1. emergence clusters by metric, not by task or model family
2. switch the metric on an emergent case: it goes away

</div>
</div>

<p class="footnote">Schaeffer et al. 2023 · §4. BIG-Bench: Srivastava et al. 2022, a collaborative benchmark that popularised emergence and reports several metrics per task</p>

Note:
Arithmetic is two tasks and one model family. So they turn to BIG-Bench, the benchmark suite that helped popularise emergence, which reports several metrics per task.
The logic: suppose LaMDA shows an emergent ability at logical reasoning. If a genuinely new reasoning ability appeared at some scale, you'd expect to see it under several reasonable metrics. If it's a metric artefact, the abruptness should be concentrated in metrics that threshold or strongly bend the predictions.
Two predictions: across the benchmark, emergence should cluster by metric, not by task-model pair; and on cases that look emergent, switching to a continuous metric should remove it.

---

<p class="eyebrow"><span class="paper">Schaeffer et al. 2023</span> · §4 · emergence score</p>

## How do you score "emergent"?

<div class="cols">
<div class="text">

<div class="eq">$$E = \frac{\operatorname{sign}(i_{\max} - i_{\min})\,(y_{\max} - y_{\min})}{\sqrt{\operatorname{Median}\{(y_i - y_{i-1})^2\}}}$$</div>

- top: total change, with direction
- bottom: a typical step between sizes

</div>
<div class="text">

<table class="rules">
  <tr><td>scores by size</td><td class="num">$E$</td></tr>
  <tr><td>0.1, 0.2, 0.3, 0.4, 0.5</td><td class="num">4</td></tr>
  <tr class="total"><td>0.1, 0.1, 0.1, 0.1, 0.5</td><td class="num">∞</td></tr>
</table>

<p class="q"><b>Q.</b> What does a high $E$ measure?</p>
<p class="a"><b>A.</b> A shape: one step does it all. Not a mechanism</p>

</div>
</div>

<p class="footnote">Emergence score from BIG-Bench (Srivastava et al. 2022), as printed in Schaeffer et al. 2023 §4; $y_i$: score at the $i$-th size, sizes in increasing order. No cut-off printed. Example ours</p>

Note:
To search all of BIG-Bench they reuse BIG-Bench's own emergence score. The numerator is the total change in performance, signed by whether the best score comes after the worst. The denominator is the square root of the median squared step between neighbouring sizes: a typical step size.
A gradual rise: steps of 0.1, total 0.4, score 4. Flat then one jump: the same 0.4 total, but the median step is zero, so the score blows up. That shows both the purpose and the weakness. It detects a shape: flat regions plus one big step. It's very sensitive to flat stretches and to how many sizes you have. It doesn't tell you the model underwent a discontinuity.

---

<p class="eyebrow"><span class="paper">Schaeffer et al. 2023</span> · §4 · Fig. 5A, B</p>

## Which metrics can show emergence at all?

<div class="cols wide-fig">
<div class="text">

- 39 BIG-Bench preferred metrics
- A: high scores under at most 5
- BLEU, exact match, multiple-choice grade, normalised aggregate, ROUGE-L-Sum
- B: hand labels: 4 of 39 metrics
- log-likelihood: no high scores

</div>
<div class="fig"><img src="img/week-06-schaeffer-fig5a.png" alt="Schaeffer et al. Figure 5A: emergence scores over all BIG-Bench tasks for each of 39 metrics; most metrics stay below about 50, while bleu, exact_str_match, multiple_choice_grade, normalized_aggregate_score and rougeLsum have long tails above 100"></div>
</div>

<p class="footnote">Schaeffer et al. 2023 · Fig. 5A, B (5B: 4 of 39 metrics carry hand-labelled emergence, 10.26%). Hand labels from Jason Wei's 2022 list of 137 emergent abilities, not Schaeffer's</p>

Note:
First prediction, at the scale of the whole benchmark. Panel A: the emergence score for every task, grouped by metric. Of 39 preferred metrics, at most 5 ever give high scores: BLEU, exact string match, multiple-choice grade, normalised aggregate score and ROUGE-L-Sum. Metrics like log-likelihood never do.
Panel B uses hand labels of which task-model pairs are emergent, from a list Jason Wei published in 2022. Only 4 of the 39 metrics carry any of the labelled emergence.

---

<p class="eyebrow"><span class="paper">Schaeffer et al. 2023</span> · §4 · Fig. 5C</p>

## Over 92%: of what?

<div class="cols wide-fig">
<div class="text">

- 67 hand-labelled emergent cases
- multiple-choice grade: 51 (76%)
- exact string match: 11 (16%)
- two metrics: 62 of 67, 92.5%
- not 92% of BIG-Bench tasks

<p class="q"><b>Q.</b> Proof that the metric causes it?</p>
<p class="a"><b>A.</b> Not alone: how common is each metric?</p>

</div>
<div class="fig"><img src="img/week-06-schaeffer-pie.png" alt="Schaeffer et al. Figure 5C: of the BIG-Bench task and model pairs labelled emergent, 76.12% are scored by multiple choice grade, 16.42% by exact string match, 4.48% by normalized aggregate score and 2.99% by BLEU"></div>
</div>

<p class="footnote">Schaeffer et al. 2023 · Fig. 5C, §4 ("&gt;92%"). The rest: normalised aggregate 3, BLEU 2 (counts as printed in Fig. 5C). A case: one task with one model family</p>

Note:
The headline. Of the 67 hand-labelled emergent cases, 51 are scored by multiple-choice grade and 11 by exact string match: 62 of 67, about 92.5%. Those are exactly the two kinds of metric the model predicts will produce apparent jumps: one discontinuous, one nonlinear.
Careful with the denominator: 92% of the labelled emergent cases, not of BIG-Bench tasks.
And a statistical caution: multiple-choice grade is also simply a very common metric in BIG-Bench. To read 92% as enrichment you'd need to know how often each metric is used, and on which tasks. The concentration alone isn't causal; the stronger evidence is comparing metrics on the same outputs, next.

---

<p class="eyebrow"><span class="paper">Schaeffer et al. 2023</span> · §4 · multiple choice vs Brier</p>

## Why is multiple-choice grade a step?

<div class="cols wide-fig">
<div class="text">

- right answer B; model: (0.40, 0.30, 0.20, 0.10)
- A wins: grade 0, Brier 0.70
- bigger model: (0.31, 0.39, 0.20, 0.10)
- B wins: grade 1, Brier 0.52

<div class="eq">$$\text{Brier} = \textstyle\sum_k (p_k - y_k)^2$$</div>

- Brier: moves with every probability
- proper: honest probabilities score best

</div>
<div class="fig"><img src="img/week-06-schaeffer-brier.svg" alt="Illustration: one two-option question; multiple-choice grade is 0 until the probability on the right answer passes 0.5 and then 1; the binary Brier score (1 minus p) squared falls smoothly from 1 to 0"></div>
</div>

<p class="footnote">Brier 1950. Schaeffer et al. 2023 defines it in words only (§4); for two options they use the binary form $(1-p)^2$, half the sum above. Example and illustration ours; $y_k$ = 1 for the right answer, else 0</p>

Note:
The classification version of the arithmetic argument. Four options, the right one is B. The model puts 0.40 on A and 0.30 on B: A wins, grade zero. A larger model shifts a little: 0.31 on A, 0.39 on B. Now B wins: grade one. The probabilities moved modestly; the grade jumped from zero to one.
For a two-option question the grade is a step function at 0.5: as the probability on the right answer rises smoothly, the grade flips when it crosses one half.
The Brier score is the squared distance between the predicted probabilities and the one-hot answer, lower is better. In our example it goes from 0.70 to 0.52, a gradual change. It's also a proper scoring rule: in expectation you do best by reporting your true probabilities. Multiple-choice grade throws away everything except which option is top.

---

<p class="eyebrow"><span class="paper">Schaeffer et al. 2023</span> · §4 · Fig. 6</p>

## Same LaMDA outputs, Brier instead?

<div class="rows">
<div class="points">
<div class="text">

- tasks where LaMDA looks emergent
- outputs released with BIG-Bench

</div>
<div class="text">

- left: grade flat, then up at the top
- right: minus Brier, gradual

</div>
</div>
<div class="fig"><img src="img/week-06-schaeffer-lamda.png" alt="Schaeffer et al. Figure 6: LaMDA on four BIG-Bench tasks at 2 and 3 shots; scored with multiple choice grade the curves jump at the largest models, scored with Brier score the same outputs mostly improve gradually"></div>
</div>

<p class="footnote">Schaeffer et al. 2023 · Fig. 6, §4. Tasks: irony identification, logical arguments, sports understanding, Swahili-English proverbs; 2 and 3 shots. Later work below (press ↓)</p>

Note:
The second prediction on real outputs. LaMDA's predictions on BIG-Bench are public, so they took tasks where LaMDA looks emergent under multiple-choice grade and rescored the same predictions with BIG-Bench's Brier score.
Left: flat, then a rise at the largest model. Right, same predictions: a more gradual change. Models and tasks unchanged; only the metric differs. That's the strongest part of Section 4, stronger than the aggregate pie chart. Look closely, though: Swahili-English proverbs under Brier gets slightly worse at the top, which is worth remembering for the next sub-slide.

--

<p class="eyebrow"><span class="paper">Schaeffer et al. 2023</span> · Later work · Du et al. 2024</p>

## Plot against loss instead of size?

<div class="rows">
<div class="points">
<div class="text">

- same pre-training loss, same score, any size
- MMLU: at chance until loss about 2.2

</div>
<div class="text">

- also under Brier and correct-choice probability
- guessing on 4 options: Brier 0.75

</div>
</div>
<div class="fig"><img src="img/week-06-du-metric.png" alt="Du et al. Figure 4, top row: MMLU performance against pre-training loss for 1.5B, 6B and 32B models under accuracy, correct-choice probability and Brier score; all three stay at the random baseline until the loss falls below about 2.2, then improve"></div>
</div>

<p class="footnote">Du et al. 2024 (NeurIPS) · arXiv:2403.15796 · Fig. 4, §3. $x$: pre-training loss, falling to the right; Brier axis inverted (lower is better, at the top). Over 30 models, 300M to 32B, one corpus. Their reading of Schaeffer's Fig. 6 rests on a guess about how Brier was normalised. Thresholds don't transfer across corpora or tokenizers</p>

Note:
Optional. Du et al. change the x-axis. Instead of model size, plot performance against pre-training loss, across many checkpoints of models up to 32B. Models of different sizes at the same loss perform the same.
Against loss, MMLU stays at chance until the loss passes about 2.2, then climbs, under accuracy, under the probability of the correct choice and under the Brier score. So a continuous metric doesn't remove that tipping point. They also note the Brier score can improve without beating chance: guessing uniformly on four options already scores 0.75.
Their redefinition: an ability is emergent if it is absent at higher loss and present at lower loss.

---

<p class="eyebrow"><span class="paper">Schaeffer et al. 2023</span> · §5 Inducing emergence in vision</p>

## Can you make emergence on purpose?

<div class="cols">
<div class="text">

- pick a domain with no claimed jumps: vision
- train ordinary model families
- invent a harsher metric
- does a "jump" appear?

</div>
<div class="text">

<p class="q"><b>Q.</b> Why is this convincing?</p>
<p class="a"><b>A.</b> Here we know the metric made the jump</p>
<p class="q"><b>Q.</b> What can't it show?</p>
<p class="a"><b>A.</b> That every LLM jump is an artefact</p>

</div>
</div>

<p class="footnote">Schaeffer et al. 2023 · §5: vision, because "abrupt transitions in vision models' capabilities have not been observed"</p>

Note:
Arguably the most creative part. Until now they re-examined existing claims. Here they reverse the logic: if a metric can produce apparent emergence, can we manufacture it in a domain where no one has claimed any?
They choose vision because abrupt jumps in vision models haven't been reported. Train ordinary model families, then invent a deliberately harsh metric, and see whether an "emergent ability" appears.
It works as a constructive counterexample: here we know the curve's shape was made by the metric. What it can't do is show that every jump in language models is an artefact.

---

<p class="eyebrow"><span class="paper">Schaeffer et al. 2023</span> · §5 · Fig. 7</p>

## CIFAR100 autoencoders: a threshold makes a jump

<div class="rows">
<div class="points">
<div class="text">

- one-hidden-layer autoencoders, CIFAR100
- B: reconstruction error falls smoothly

</div>
<div class="text">

- C: share of images with error below $c$
- A: a published BIG-Bench curve, to compare

</div>
</div>
<div class="fig"><img src="img/week-06-schaeffer-cifar.png" alt="Schaeffer et al. Figure 7: left, a published emergent ability for comparison; middle, shallow autoencoders on CIFAR100 whose test mean squared error falls smoothly with size; right, the same models scored by the fraction of images reconstructed within a threshold c, which jumps at the largest sizes"></div>
</div>

<p class="footnote">Schaeffer et al. 2023 · Fig. 7, §5. $R_c = \frac{1}{n}\sum_i \mathbb{I}\big[\lVert x_i - \hat x_i \rVert^2 \lt c\big]$, $c$ = 0.003, 0.004. A: BIG-Bench Periodic Elements. CIFAR100: small colour images</p>

Note:
First, autoencoders: a network compresses each image through a bottleneck and reconstructs it. They train shallow ones, one hidden layer, on CIFAR100. Mean squared reconstruction error falls smoothly as the bottleneck grows (middle). Ordinary.
Now a new metric: the fraction of test images whose squared error is below a threshold c. Each image scores zero or one. An image just above c gets nothing; just below, full credit. The underlying improvement is tiny, the indicator flips.
Plotted against size (right), it sits at zero and then shoots up, much like the published BIG-Bench curve on the left. The resemblance is created by the metric and the choice of threshold.

---

<p class="eyebrow"><span class="paper">Schaeffer et al. 2023</span> · §5 · Fig. 8</p>

## Omniglot transformers: all images right

<div class="rows">
<div class="points">
<div class="text">

- small decoder-only transformers
- B: per-image accuracy rises with size

</div>
<div class="text">

- C: right only if all 3 images are right
- roughly $a^L$, the $p^L$ again (ours)

</div>
</div>
<div class="fig"><img src="img/week-06-schaeffer-omniglot.png" alt="Schaeffer et al. Figure 8: left, a published emergent ability on MMLU for GPT-3; middle, causal transformers classifying Omniglot images, accuracy rising from 0.15 to 0.82 over five sizes; right, the same models scored as correct only when all 3 images are right, near zero for the first two sizes and then rising to 0.57"></div>
</div>

<p class="footnote">Schaeffer et al. 2023 · Fig. 8, §5. Images embedded by convolutional layers, setup after Chan et al. 2022. A: MMLU from Ganguli et al. 2022. Text: sequences of 1 to 5 images; the figure shows 3. With $a^3$ the middle sizes would be 2 to 3x lower than plotted: errors are not independent</p>

Note:
Second, transformers classifying handwritten Omniglot characters: images are embedded by convolutional layers and fed with their labels to a small decoder-only transformer. Ordinary per-image accuracy rises steadily with size (middle).
Now score a sequence as right only if every image in it is classified right. Under independence that's per-image accuracy cubed: the p to the L structure from arithmetic. It's only rough: for the middle sizes the plotted values are 2 to 3 times higher than a cubed, so the errors are correlated, which is critique 1 in action. With three images (right), the curve is flatter at small sizes and rises more sharply, qualitatively like the MMLU curve on the left. The text describes lengths one to five; the figure shows only three.

---

<p class="eyebrow"><span class="paper">Schaeffer et al. 2023</span> · App. B · Fig. 10</p>

## MNIST CNNs: a harsh metric plus few sizes

<div class="rows">
<div class="points">
<div class="text">

- LeNet CNNs on MNIST digits
- B: accuracy, sigmoidal, 14 sizes

</div>
<div class="text">

- C: all $K$ of $K$ right, $K$ = 6, 8, 10
- and only 4 of the 14 sizes

</div>
</div>
<div class="fig"><img src="img/week-06-schaeffer-mnist.png" alt="Schaeffer et al. Figure 10: left, a published emergent ability, BIG-Bench grounded mappings; middle, LeNet on MNIST, test accuracy rising sigmoidally over 14 sizes from 0.19 to 0.96; right, all K of K correct for K = 6, 8 and 10 at only 4 sizes, near zero for three and 0.66 to 0.78 at the largest"></div>
</div>

<p class="footnote">Schaeffer et al. 2023 · App. B, Fig. 10. Text says $K$ from 1 to 5; the figure shows 6, 8, 10. Their words: "especially when combined with sparse sampling of model sizes". A: Wei et al.'s grounded mappings; its axis says parameters but shows training FLOPs, as in Wei's Fig. 2F</p>

Note:
The appendix repeats it with LeNet convolutional networks on MNIST. Per-image accuracy rises in an ordinary sigmoid across 14 sizes. Score groups of K images as right only if all K are right, and the curve sharpens as K grows.
Read the figure closely, because it differs from the text. The text says K from 1 to 5; the panel shows 6, 8 and 10. And panel C keeps only 4 of the 14 sizes. That's deliberate; they say the effect is strongest "combined with sparse sampling of model sizes". So this jump is the harsh metric plus dropping the in-between sizes: factors one and three together. A fair demonstration of their point, but it shows how much the sampling contributes.

---

<p class="eyebrow"><span class="paper">Schaeffer et al. 2023</span> · §5 · what it proves</p>

## What does a manufactured jump prove?

<div class="cols">
<div class="text">

- a counterexample to an inference
- "sharp curve, so a new mechanism": doesn't follow
- curve shape alone is not evidence

</div>
<div class="text">

<p class="q"><b>Q.</b> Are LLM jumps artefacts, then?</p>
<p class="a"><b>A.</b> Not shown. Only that the shape can't decide</p>
<p class="q"><b>Q.</b> What could decide?</p>
<p class="a"><b>A.</b> Graded measures, more sizes, a look inside</p>

</div>
</div>

<p class="footnote">Schaeffer et al. 2023 · §5, App. B. Three architectures: fully connected, convolutional, self-attention</p>

Note:
Why is this strong? It's a constructive counterexample to a common inference: "a benchmark score jumps at large sizes, so a new computational mechanism must appear at that scale". The vision experiments produce the same qualitative curves from ordinary learning curves, by measurement alone, in three architectures.
They don't prove every jump in a language model is an artefact. They do prove the shape of a benchmark curve is insufficient evidence, on its own, of mechanistic emergence. Deciding needs other evidence: graded measures, denser sizes, and ideally a look at what the model computes.

---

<p class="eyebrow"><span class="paper">Schaeffer et al. 2023</span> · §7 Discussion</p>

## What does the paper actually refute?

<table class="rules">
  <tr><td>claim in the emergence literature</td><td>after this paper</td></tr>
  <tr><td>some benchmark curves rise sharply</td><td>still true: the scores are real</td></tr>
  <tr><td>the rise can't be predicted from small models</td><td>seriously challenged</td></tr>
  <tr class="total"><td>a sharp curve means a sudden internal change</td><td>does not follow</td></tr>
</table>

<p class="footnote">Our summary of Schaeffer et al. 2023 §3 to §7</p>

Note:
Separate observation, explanation and mechanism. The emergence literature made at least three claims.
One: some benchmark curves rise sharply with scale. Still true; the measured scores are real. Two: those rises are unpredictable from small models. Seriously challenged: other metrics and better resolution show progress at small scales. Three: a sharp curve implies a sudden internal change. That inference doesn't hold; the paper gives explicit counterexamples.
The strongest contribution is the third. Getting emergent-looking curves without any underlying discontinuity shows that the existing benchmark evidence isn't enough to conclude there is one.

---

<p class="eyebrow"><span class="paper">Schaeffer et al. 2023</span> · §7 Discussion</p>

## Did they say emergence isn't real?

<div class="cols">
<div class="text">

<blockquote>"nothing in this paper should be interpreted as claiming that large language models <i>cannot</i> display emergent abilities; rather, our message is that previously claimed emergent abilities … might likely be a mirage induced by researcher analyses."</blockquote>

</div>
<div class="text">

<p class="q"><b>Their advice</b></p>

- task and metric: separate choices
- with accuracy: "sufficient data"
- many comparisons: correct for them
- closed models: hard to check

</div>
</div>

<p class="footnote">Schaeffer et al. 2023 · §7. The title is a question, but the paper also writes "metric choice is likely wholly responsible for emergent abilities" (§7) and "can be fully explained" (§2). Later work below (press ↓)</p>

Note:
In their own words: nothing here says language models cannot have emergent abilities. Notice the two registers, though: elsewhere the paper is much stronger, saying metric choice is "likely wholly responsible" and that the jumps "can be fully explained" by the three factors. The claim is about the evidence: previously claimed abilities might be a mirage produced by the analysis. The title is a question.
Their practical advice: choose the metric separately from the task; if you use accuracy, use enough test data to see small values; correct for multiple comparisons, since with hundreds of tasks, dozens of metrics and several model families some curves will look sharp by chance; and note that closed models make independent checks hard.

--

<p class="eyebrow"><span class="paper">Schaeffer et al. 2023</span> · Later work · Snell et al. 2024</p>

## Can emergence be forecast?

<div class="rows">
<div class="points">
<div class="text">

- fine-tune checkpoints before the jump
- the jump moves earlier; more data, further

</div>
<div class="text">

- fit the shift, extrapolate to few-shot
- predicted 1.9x to 4.3x compute ahead

</div>
</div>
<div class="fig"><img src="img/week-06-snell-fig2.png" alt="Snell et al. Figure 2: left, GSM8K accuracy against pre-training loss for few-shot and fine-tuned models with different amounts of fine-tuning data; fine-tuning moves the point where accuracy starts to rise to higher loss. Right, how far in advance emergence can be predicted: 4.3x FLOPs for MMLU, 3.9x GSM8K, 2.3x CoLA, 1.9x CommonsenseQA"></div>
</div>

<p class="footnote">Snell et al. 2024 · arXiv:2411.16035 · Fig. 2, §5 to §6. OpenLLaMA 3B fit, checked on 7B and 13B. CoLA: is this sentence grammatical? CommonsenseQA: everyday-knowledge multiple choice. In practice "the metric of primary interest may be fundamentally discontinuous"</p>

Note:
Optional, and the most constructive answer. Snell et al. accept that the metric people care about is often discontinuous, and ask whether the jump can be predicted anyway. Fine-tuning on a task makes the jump appear in smaller, earlier checkpoints, and more fine-tuning data moves it earlier still. Fit how the jump point moves, extrapolate to the few-shot case, and you predict where few-shot emergence will happen.
On MMLU and GSM8K they predict it up to 4.3x and 3.9x compute ahead, from 3B checkpoints at or near chance; CommonsenseQA and CoLA only 1.9x and 2.3x. They don't know why fine-tuning shifts emergence.

---

<p class="eyebrow"><span class="paper">Schaeffer et al. 2023</span> · critique 1 · §2, App. A</p>

## Are token errors independent?

<div class="cols">
<div class="text">

- $p^L$ assumes independent digits
- one carry slip: many wrong digits
- or a whole method right or wrong
- chain rule is exact, but conditional:

<div class="eq">$$P(y_{1:L} \mid x) = \textstyle\prod_t P(y_t \mid x, y_{\lt t})$$</div>

</div>
<div class="text">

<p class="q"><b>Q.</b> Do they admit it?</p>
<p class="a"><b>A.</b> Yes: "not true"; App. A: a step that "would make most mathematicians cry"</p>
<p class="q"><b>Q.</b> Does it sink the argument?</p>
<p class="a"><b>A.</b> No: the same-output rescoring stands on its own</p>

</div>
</div>

<p class="footnote">Schaeffer et al. 2023 · §2 footnote, App. A (opening), A.3. App. A.3 uses $\mathbb{E}[\text{acc}] \approx \exp(\mathbb{E}[\log \text{acc}])$, not an identity. Free-running decoding conditions on the model's own tokens, not the target's</p>

Note:
Now critique. The central derivation assumes token-level successes are independent. Real autoregressive errors are highly dependent. In long multiplication, one carry error can corrupt several later digits. Or the model may run the whole algorithm correctly, or pick a wrong strategy entirely: errors come in correlated bundles.
The probability of a whole target sequence does factor exactly by the chain rule, but each factor is conditioned on the earlier target tokens. That's not the same as multiplying the chances that each generated token is right during free-running decoding, where the model conditions on its own outputs. The simple model blurs these.
To their credit they say so: independence "is not true", and the appendix calls one approximation a step that would make most mathematicians cry. These weaknesses limit the model's quantitative use; they don't touch the experimental result that rescoring the same outputs changes the curve.

---

<p class="eyebrow"><span class="paper">Schaeffer et al. 2023</span> · critique 2</p>

## Does continuous mean smooth?

<div class="cols wide-fig">
<div class="text">

- $1/(1+e^{-100x})$: continuous, near-step
- small cause, small loss change: possible
- smooth score $\not\Rightarrow$ smooth mechanism
- sharp score $\not\Rightarrow$ sharp mechanism

<p class="q"><b>Q.</b> So how do you test a mechanism?</p>
<p class="a"><b>A.</b> Look at what the model computes</p>

</div>
<div class="fig"><img src="img/week-06-wei-sigmoid.svg" alt="Illustration: logistic curves in log compute with steepness 1, 3 and 10; all are continuous, and the steepest looks like a jump"></div>
</div>

<p class="footnote">Illustration from the Wei section: a logistic in log compute is continuous at any steepness. Our critique, not in the paper</p>

Note:
The paper often contrasts discontinuous metrics with continuous ones. But continuity isn't enough. A continuous function can change extremely fast: one over one plus e to the minus 100 x goes from near zero to near one over a tiny range.
The other way round too: a genuinely abrupt change in one internal computation could barely move the average cross-entropy if that computation contributes little to the loss.
So a smooth score doesn't imply a smooth mechanism, and a sharp score doesn't imply a sharp mechanism. Two separate inference problems. If the scientific claim is about a qualitative change in how the model solves a task, you have to look at its representations and computation.

---

<p class="eyebrow"><span class="paper">Schaeffer et al. 2023</span> · critique 3</p>

## Is exact match a bad metric?

<div class="cols">
<div class="text">

- code must pass every test
- one wrong step breaks a proof
- users feel all-or-nothing
- that jump is real for them

</div>
<div class="text">

<p class="q"><b>Q.</b> Then what's the mistake?</p>
<p class="a"><b>A.</b> Reading the learning process off a threshold metric</p>
<p class="q"><b>Q.</b> Who else said this?</p>
<p class="a"><b>A.</b> Snell et al. 2024: the metric of interest "may be fundamentally discontinuous"</p>

</div>
</div>

<p class="footnote">Our critique; Snell et al. 2024 §2. Hu et al. 2024 likewise keep exact match as the target metric</p>

Note:
Exact match isn't necessarily a bad metric. A program that's 99% textually right but doesn't compile is worth nothing. A proof with one invalid step proves nothing. For those uses, all-or-nothing correctness is the right measure, and a jump in it is a real jump in usefulness.
So the mistake isn't using an all-or-nothing metric. It's assuming the all-or-nothing metric shows the structure of the learning process. This is also why the later papers, Hu and Snell, keep exact match as the thing to predict.

---

<p class="eyebrow"><span class="paper">Schaeffer et al. 2023</span> · critique 4 · §4, §7</p>

## Is 92% evidence of cause?

<div class="cols">
<div class="text">

- multiple-choice grade: common in BIG-Bench
- base rate per metric: not given
- same-output test in BIG-Bench: LaMDA only
- other families: outputs not public

</div>
<div class="text">

<p class="q"><b>Q.</b> How many chances to look sharp?</p>
<p class="a"><b>A.</b> ≥ 220 tasks × ~40 metrics × ~10 families</p>

- paper: "∼10<sup>6</sup>"; the factors give ≈ 10<sup>5</sup>
- no correction across all claims

</div>
</div>

<p class="footnote">Schaeffer et al. 2023 · §4, §7. The multiple-comparisons point is theirs; the base-rate point is ours</p>

Note:
The meta-analysis is observational. More than 92% of labelled cases sit on two metrics, but multiple-choice grade is also very common in BIG-Bench, and some task types may be more prone to looking emergent. Without the base rate of each metric, the concentration isn't a causal result.
The ideal is what they did for LaMDA: several metrics on exactly the same outputs. They couldn't repeat that for every claim, because most models' predictions weren't public.
Multiple comparisons: they point out there are at least 220 tasks, about 40 metrics and about 10 model families. They call that about a million combinations; the factors actually multiply to about 88,000, so ten to the fifth. Either way, some curves will look sharp by chance, and nobody has corrected the emergence claims for that.

---

<p class="eyebrow"><span class="paper">Schaeffer et al. 2023</span> · critique 5</p>

## Smoother, but predictable?

<div class="cols">
<div class="text">

- Kaplan: fit, then predict loss
- Chinchilla: predict, then train to test it
- Schaeffer: smoother curves, no forecast
- the test: fit small, predict large, held out

</div>
<div class="text">

<p class="q"><b>Q.</b> Has anyone done it?</p>
<p class="a"><b>A.</b> Hu et al. 2024: fit to 1.5B, predict 2.4B (sub-slide under Fig. 4)</p>
<p class="a"><b>A.</b> Snell et al. 2024: 1.9x to 4.3x ahead</p>

</div>
</div>

<p class="footnote">Our critique. "Smooth, continuous, predictable" is the paper's phrase (§3); a forecast of a held-out size is not reported</p>

Note:
A big difference from Kaplan and Chinchilla. Kaplan fits a relationship and uses it to predict loss at other sizes. Chinchilla predicts a compute-optimal model and trains it to check. Schaeffer and colleagues show that other metrics give smoother curves, and call them predictable, but smoother doesn't mean quantitatively predictable.
The ideal test: fit a curve on the smaller networks only, then predict the larger ones on held-out sizes. Success there would be much stronger evidence. Hu and Snell are steps toward that. Schaeffer's paper makes the explanation plausible; it doesn't fully establish it.

---

<p class="eyebrow"><span class="paper">Schaeffer et al. 2023</span> · a proposal</p>

## Three levels: where did the jump happen?

<div class="cols">
<div class="text">

<table class="rules">
  <tr><td>level</td><td>example measures</td></tr>
  <tr><td>1 output</td><td>exact-answer accuracy</td></tr>
  <tr><td>2 graded</td><td>log-probability, margin, step accuracy</td></tr>
  <tr class="total"><td>3 internal</td><td>carries, digit positions</td></tr>
</table>

</div>
<div class="text">

<p class="q"><b>Q.</b> A jump at level 1 only?</p>
<p class="a"><b>A.</b> A metric effect</p>
<p class="q"><b>Q.</b> Level 2 smooth, level 3 changes?</p>
<p class="a"><b>A.</b> A new strategy: test it causally</p>

</div>
</div>

<p class="footnote">Our framing, not in the paper. Compare the experiment proposed at the end of the Wei section</p>

Note:
If the question is whether a model really changes how it computes, separate three levels. Level one, output success: does the model produce usable answers? Level two, graded competence: probabilities, token errors, decision margins, accuracy on intermediate steps. Does the model improve before the final-answer metric notices? Level three, internal computation: for arithmetic, does the model represent carries, track digit positions, reuse operations?
A jump only at level one is a metric effect. A change at level three, say from a heuristic to an algorithm, would be mechanistic emergence, and you'd want to identify the computation on both sides of the transition and test causally that it drives the behaviour.

---

<p class="eyebrow"><span class="paper">Schaeffer et al. 2023</span> · a proposal</p>

## Four explanations, four predictions

<table class="rules">
  <tr><td>hypothesis</td><td>what you'd observe</td></tr>
  <tr><td>metric artefact</td><td>exact accuracy jumps; graded measures smooth</td></tr>
  <tr><td>hidden by prompting or decoding</td><td>competence earlier, not elicited</td></tr>
  <tr><td>mechanistic emergence</td><td>a new computation, found and causally tested</td></tr>
  <tr class="total"><td>a mixture</td><td>smooth gains plus a change of strategy</td></tr>
</table>

<p class="footnote">Our framing, not in the paper. Not mutually exclusive</p>

Note:
Make the alternatives sharp. Metric artefact: exact accuracy jumps while graded competence improves smoothly. Thresholded elicitation: the competence is there earlier, but the prompt or the decoding fails to expose it. Mechanistic emergence: the model acquires a qualitatively different computation you can identify and test causally. And a mixture: both.
They aren't exclusive. A model could reorganise internally while the metric also exaggerates the jump. The goal is to find which explanation the data actually need.

---

<p class="eyebrow"><span class="paper">Schaeffer et al. 2023</span> · assessment</p>

## Why is this a strong paper?

<table class="rules">
  <tr><td>if the jump is the metric, then…</td><td>tested on</td><td>result</td></tr>
  <tr><td>change the metric: the jump goes</td><td>GPT-3 Fig. 3; LaMDA Fig. 6</td><td>yes</td></tr>
  <tr><td>more test data: small models above 0</td><td>GPT-3 Fig. 4</td><td>yes</td></tr>
  <tr><td>longer targets: a predictable fall</td><td>GPT-3 Figs. 3, 4</td><td>yes</td></tr>
  <tr class="total"><td>a harsh metric elsewhere: a fake jump</td><td>vision Figs. 7, 8, 10</td><td>yes</td></tr>
</table>

<p class="footnote">Schaeffer et al. 2023 · §3 to §5. Every "yes" is qualitative; no alternative mechanism is ruled out</p>

Note:
The experimental strategy matters more than the particular mathematical model. They didn't just argue a measurement artefact was possible. They derived specific predictions from it and tested each one: change the metric and the jump should disappear; add test data and hidden progress should show; lengthen the target and exact match should fall predictably; build a harsh metric in another domain and fake emergence should appear.
Each prediction gets qualitative support. That's a better way to examine an extraordinary claim than collecting more examples that seem to support it, and going beyond language models shows the effect doesn't need anything special about them.

---

<p class="eyebrow"><span class="paper">Schaeffer et al. 2023</span> · Wei vs Schaeffer</p>

## Where do Wei and Schaeffer disagree?

<table class="rules">
  <tr><td>question</td><td>Wei et al. 2022</td><td>Schaeffer et al. 2023</td></tr>
  <tr><td>do sharp curves exist?</td><td>yes</td><td>yes</td></tr>
  <tr><td>what explains them?</td><td>possibly new abilities</td><td>possibly the metric</td></tr>
  <tr><td>key evidence</td><td>sharp benchmark curves</td><td>same outputs, other metrics</td></tr>
  <tr><td>smooth loss compatible?</td><td>yes (App. A)</td><td>yes: it's the explanation</td></tr>
  <tr class="total"><td>is emergence impossible?</td><td>no</td><td>no</td></tr>
</table>

<p class="footnote">Wei et al. 2022 §5.1, App. A; Schaeffer et al. 2023 §2, §7</p>

Note:
Side by side. Both agree that the sharp benchmark curves exist; the large-model improvements really happened. They disagree on interpretation. Wei: possibly genuine new abilities. Schaeffer: possibly nonlinear evaluation. Wei's evidence is the shape of benchmark curves; Schaeffer's is that the same outputs give different shapes under different metrics.
Both see that smooth loss coexists with sharp accuracy; Wei raised it in his own appendix, Schaeffer makes it the explanation. Neither says emergence is impossible. What's unresolved for Wei: the mechanism. For Schaeffer: whether any genuine transition survives once the measurement is controlled.

---

<p class="eyebrow"><span class="paper">Schaeffer et al. 2023</span> · Summary</p>

## What should we ask first now?

<div class="cols">
<div class="text">

- not: "at what size does arithmetic emerge?"
- first: under which measure is there a jump?
- then: does it survive another measure?
- only then: is there a new mechanism?

</div>
<div class="text">

<p class="q"><b>Q.</b> Does this explain scaling laws?</p>
<p class="a"><b>A.</b> No: it assumes loss falls smoothly</p>
<p class="q"><b>Q.</b> Or say when new algorithms form?</p>
<p class="a"><b>A.</b> No: it rules out a simpler story first</p>

</div>
</div>

<p class="footnote">Our summary. Why loss follows a power law at all: the origins sub-slides under the Kaplan summary</p>

Note:
The question shifts. Instead of asking at what model size arithmetic emerges, first ask: under which operational definition of arithmetic ability does a transition appear, and what happens if we measure the same behaviour differently? Only after controlling the measurement should we ask whether a new internal computation appears.
What the paper doesn't do: it doesn't explain the origin of scaling laws; it assumes loss falls smoothly and uses a power law only for illustration. And it doesn't give a theory of when new algorithms form inside a transformer. What it establishes is that before looking for a critical mechanism, you must rule out a much simpler explanation.

---

<p class="eyebrow"><span class="paper">Schaeffer et al. 2023</span> · Summary</p>

## What to keep from Schaeffer

<div class="cols">
<div class="text">

- $A_L \approx p^L$: smooth $p$, sharp score
- rescore the same outputs: a clean control
- measured zero ≠ zero ability
- weakens, doesn't disprove, emergence

</div>
<div class="text">

<p class="q"><b>Open question</b></p>
<p class="a">With metric, resolution and model sizes controlled, does any jump remain? Against loss, Du et al. say yes</p>

</div>
</div>

<p class="footnote">Schaeffer et al. 2023. Next: what held up across the four readings</p>

Note:
Four ideas. First, the central equation: smooth per-token improvement, raised to the L, gives sharp-looking exact match. Second, changing the metric while holding the outputs fixed is a powerful control for whether a jump depends on our measurement choices. Third, statistical resolution matters: zero successes in a small evaluation doesn't mean zero probability. Fourth, the paper weakens claims of mechanistic emergence without disproving all forms of it; benchmark thresholds, real jumps in usefulness and internal reorganisation are distinct things.
The original emergence work established interesting observations; many interpretations went further than the evidence. Schaeffer raised the standard of evidence. The open question: once metric, resolution and model sizes are all controlled, does any jump remain? Against loss, Du et al. find one.


---

<!-- .slide: class="cover divider" -->

<p class="kicker">Across the four readings</p>
<h1>What held up</h1>
<p class="subtitle">Scorecard, limitations, open questions, discussion</p>
<ol class="track"><li class="done">Kaplan 2020<span>scaling laws</span></li><li class="done">Chinchilla 2022<span>compute-optimal training</span></li><li class="done">Wei 2022<span>emergent abilities</span></li><li class="done">Schaeffer 2023<span>a mirage?</span></li></ol>

Note:
All four readings together: which claims survived, what the authors admit, what is left open, and questions for discussion.

---

<p class="eyebrow">Week 6 · scorecard</p>

## What survived?

<table class="rules">
  <tr><td>claim</td><td>source</td><td>status</td></tr>
  <tr><td>loss is a power law in $N$, $D$, $C$</td><td>Kaplan Fig. 1</td><td>survived, plus a floor $E$</td></tr>
  <tr><td>$N_{\rm opt} \propto C^{0.73}$</td><td>Kaplan §6.1</td><td>revised: about 0.5</td></tr>
  <tr><td>about 20 tokens per parameter</td><td>Chinchilla Table 3</td><td>survived for training compute</td></tr>
  <tr><td>Approach 3 fit, $a$ = 0.46</td><td>Chinchilla §3.3</td><td>revised: 0.51 on re-fit</td></tr>
  <tr><td>abilities absent, then present</td><td>Wei Fig. 2</td><td>open: metric, resolution, loss</td></tr>
  <tr class="total"><td>the jumps are a metric artefact</td><td>Schaeffer §3, §4</td><td>partly: a loss threshold remains</td></tr>
</table>

<p class="footnote">Revisions: Porian et al. 2024, Pearce &amp; Song 2024, Besiroglu et al. 2024, Sardana et al. 2024, Hu et al. 2024, Du et al. 2024, Snell et al. 2024 (sub-slides above)</p>

Note:
The verdicts in one table.
Kaplan's power laws in loss survived; Chinchilla adds an irreducible term. Kaplan's allocation exponent of 0.73 did not survive: it came from how parameters and compute were counted, a warmup too long for small budgets, and untuned optimiser settings. Chinchilla's equal scaling, about 20 tokens per parameter, holds for training compute alone; once inference is counted, practice trains smaller models much longer. Chinchilla's third method was mis-fit, and fixing it agrees with the other two.
Emergence is the open one. Schaeffer showed that much of the published evidence depends on the metric and the test-set size. But resolution studies (Hu), loss-axis studies (Du) and forecasting work (Snell) all still find something that changes quickly: under a high-resolution or loss-based view, abilities appear past a threshold, and the metrics we care about are often all-or-nothing.

---

<p class="eyebrow">Week 6 · limitations the authors admit</p>

## What do the authors say they could not show?

<table class="rules">
  <tr><td>paper</td><td>own limitation</td></tr>
  <tr><td>Kaplan</td><td>no theory; regularisation and some hyperparameters not tuned</td></tr>
  <tr><td>Chinchilla</td><td>two large runs only; power-law frontier assumed; under one epoch</td></tr>
  <tr><td>Wei</td><td>no complete explanation, no way to predict the scale</td></tr>
  <tr class="total"><td>Schaeffer</td><td>tokens assumed independent; only GPT-3 queried directly</td></tr>
</table>

<p class="footnote">Kaplan App. C; Hoffmann §5; Wei §5.1, §5.6 ("did not provide complete answers to why emergence occurs or how to predict it"); Schaeffer §2, App. A, §4</p>

Note:
In their own words. Kaplan, Appendix C: "we do not have a solid theoretical understanding for any of our proposed scaling laws", and they may have neglected some hyperparameter that matters for scaling; Porian later shows the optimiser settings did.
Chinchilla: only two comparable large runs, Chinchilla and Gopher; they assumed a power-law frontier while seeing some curvature, which may mean they still overestimate the best size; and all scaling runs used less than one epoch of data.
Wei: no compelling explanation for why abilities emerge, and the loss analysis doesn't predict the scale.
Schaeffer: their model assumes independent tokens ("not true") and a constant error rate ("empirically false"); only GPT-3 could be queried directly, other families only through published results and LaMDA's released BIG-Bench outputs.

---

<p class="eyebrow">Week 6 · extensions</p>

## What do these papers leave open?

<table class="rules">
  <tr><td>question</td><td>why it is open</td></tr>
  <tr><td>scaling laws for downstream tasks</td><td>loss is smooth, task scores are not</td></tr>
  <tr><td>data quality and repetition</td><td>the scaling papers assume fresh text of fixed quality</td></tr>
  <tr><td>laws for inference compute</td><td>reasoning models spend compute at test time</td></tr>
  <tr class="total"><td>a mechanism for thresholds</td><td>none of the four explains one</td></tr>
</table>

<p class="footnote">Inference-time scaling and reasoning models: Week 8. Data-constrained scaling: Muennighoff et al. 2023, arXiv:2305.16264</p>

Note:
Four directions the readings point to.
First, predicting task performance, not just loss. Loss laws are reliable, but what we deploy for are task scores, often all-or-nothing. Snell and Du are early attempts.
Second, data. All four papers assume an endless supply of fresh text of fixed quality. Chinchilla's own speculation is that more data helps only if it is high quality, and modern training repeats data and filters hard.
Third, compute at test time. The laws here are for training compute. Reasoning models spend compute when answering, which changes both the allocation question and what "scale" means (Week 8).
Fourth, mechanism. None of the papers explains why a threshold would exist. Hu suggests multiple circuits; Du a loss threshold; neither is a mechanism yet.

---

<p class="eyebrow">Week 6 · as a reviewer</p>

## What would I ask the authors?

<table class="rules">
  <tr><td>paper</td><td>request</td></tr>
  <tr><td>Kaplan</td><td>runs sized to each budget, not read mid-run</td></tr>
  <tr><td>Chinchilla</td><td>error bars on the Gopher comparison; one change at a time</td></tr>
  <tr><td>Wei</td><td>more model sizes between the last two points</td></tr>
  <tr class="total"><td>Schaeffer</td><td>fit the $p^L$ model to GPT-3's measured per-token accuracy</td></tr>
</table>

<p class="footnote">Schaeffer's source contains a cut analysis of GPT-3's per-token probabilities (commented out of its source); the published model is never fitted to the data</p>

Note:
One request each.
Kaplan: the compute frontier is read from intermediate checkpoints of runs scheduled for 130B tokens. Training runs sized to each budget would have tested the 0.73 directly; Chinchilla did exactly that.
Chinchilla: the headline comparison is one run of each model and changes the optimiser, tokenizer and data mix along with size and tokens. Separating those, or reporting seeds, would make the 67.6 vs 60.0 more convincing.
Wei: most jumps happen across one gap between two models, 5 to 132 times apart in compute. Intermediate sizes would show whether the rise is sudden or merely unsampled.
Schaeffer: the exact-match model is qualitative. The source contains a commented-out comparison with GPT-3's measured per-token probabilities; fitting p^L to those would turn the argument into a test.

---

<p class="eyebrow">Discussion</p>

## Questions for discussion

<table class="rules">
  <tr><td>reading</td><td>question</td></tr>
  <tr><td>Kaplan</td><td>why should loss be a power law at all?</td></tr>
  <tr><td>Chinchilla</td><td>who should pay for training: the lab or the users?</td></tr>
  <tr><td>Wei</td><td>which abilities would you expect never to emerge?</td></tr>
  <tr class="total"><td>Schaeffer</td><td>if the metric we care about is all-or-nothing, is the jump still a mirage?</td></tr>
</table>

<p class="footnote">Chinchilla question: Sardana et al. 2024 on training plus inference cost. Schaeffer question: Snell et al. 2024 §2</p>

Note:
One question per reading.
Kaplan: the paper has no theory for why loss follows a power law. What would have to be true about language, or about the networks, for that to happen?
Chinchilla: compute-optimal for training is not cost-optimal once a model is served. Whose cost should the scaling law minimise?
Wei: the paper lists 45 BIG-Bench tasks with flat curves, many visual, multi-step or long-context. Which would you bet never emerge from scaling alone, and why?
Schaeffer: if a user only cares whether the answer is exactly right, a jump in exact match is a real jump for them. In what sense is it a mirage, then?
