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

<p class="eyebrow"><span class="paper">Kaplan et al. 2020</span> · §1 · the question</p>

## You have 10x more compute. Where does it go?

<div class="rows">
<div class="points">
<div class="text">

- A bigger model? More data?
- Train longer? A new architecture?

</div>
<div class="text">

<p class="plain">One full-size run can cost millions, so you cannot try them all.</p>
<p class="plain">Kaplan's bet: test loss is predictable from model size, data and compute.</p>

</div>
</div>
<div class="fig"><img src="img/week-06-kaplan-fig1.png" alt="Kaplan et al. Figure 1: test loss against compute, dataset size and parameters, each a straight line on log-log axes"></div>
</div>

<p class="footnote">Kaplan et al. 2020 · arXiv:2001.08361 · Fig. 1, as a preview. Its three panels come from different runs; each comes back later with its own experiment</p>

Note:
Start with the practical problem. A lab has a budget. It can make the model bigger, give it more data, train it longer, or change the architecture. A full-size run costs too much to try every option, so you need a rule that says, before you spend the money, which knob to turn.
Kaplan's bet is that the test loss depends mostly on three numbers, model size, data and compute, and in a predictable way. If that's true, you can train small models, fit the trend, and extrapolate.
The figure is the paper's opening summary: three straight lines. Don't try to read it yet. Each panel comes from a different set of runs, and the paper earns each one in its own section. We'll do the same: setup first, then each panel with the experiment behind it.

---

<p class="eyebrow"><span class="paper">Kaplan et al. 2020</span> · §1.3 · notation</p>

## What exactly is the loss?

<div class="cols">
<div class="text">

<div class="eq">$$L = -\frac{1}{T}\sum_{t=1}^{T} \log p_\theta(x_t \mid x_{\lt t})$$</div>

<dl class="where">
<dt>$x_t$, $T$</dt><dd>the token at position $t$; the context length, 1,024</dd>
<dt>$p_\theta$</dt><dd>the model's probability for the real next token</dd>
</dl>

</div>
<div class="text">

- The next-token cross-entropy, in nats; lower is better.
- Averaged over held-out WebText2 text.
- Perplexity is $e^L$, so $L$ is the log of the perplexity.
- $L$ from 3.0 to 2.8 is perplexity from 20.1 to 16.4.

<p class="plain">Loss only: no benchmarks, no reasoning tests.</p>

</div>
</div>

<p class="footnote">Kaplan et al. 2020 · §1.3, §2.3 (test set: $6.6\times10^8$ tokens held out). Perplexity: roughly how many equally likely tokens the model is choosing between</p>

Note:
Everything in the paper is about one number: the average cross-entropy of the next token on held-out text. The model sees the tokens so far and puts a probability on the real next token; the loss is minus the log of that probability, averaged over the positions of the context and over the test text.
It's in nats, so e to the loss is the perplexity. Put the other way round, the loss is the log of the perplexity, not an average of perplexities. A drop from 3.0 to 2.8 looks small, but it takes perplexity from about 20 to about 16.
Be clear about what this is not. It's not reasoning, instruction following or benchmark accuracy. Whether those scale the same way is a separate question, and it's the one the second half of today, Wei and Schaeffer, is about.

---

<p class="eyebrow"><span class="paper">Kaplan et al. 2020</span> · §2 · background and methods</p>

## What did they train?

<div class="cols wide-fig">
<div class="text">

- Decoder-only Transformers, like GPT-2.
- WebText2: $2.29\times10^{10}$ tokens, a 50,257-token vocabulary, 1,024-token contexts.
- Adam; Adafactor above 1B parameters.
- Unless noted, every size: 250,000 steps of $2^{19}$ tokens (512 × 1,024).
- One learning-rate schedule (right).

<p class="plain">Exceptions: the data runs stop early, the batch runs change the batch, the schedule runs change the schedule.</p>

</div>
<div class="fig"><img src="img/week-06-kaplan-schedule.svg" alt="Illustration: learning rate against training step, rising linearly to its peak over the first 3,000 steps, then falling along a cosine to zero at step 250,000"></div>
</div>

<p class="footnote">Kaplan et al. 2020 · §2.2, §2.3. 250,000 × $2^{19}$ ≈ $1.3\times10^{11}$ tokens, about 5.7 passes over WebText2 (ours). The peak learning rate is set by model size (App. D.6)</p>

Note:
The setup. GPT-2-style decoder-only Transformers trained on WebText2, an extended version of GPT-2's dataset, about 23 billion tokens, with GPT-2's tokenizer and 1,024-token contexts.
Unless the paper says otherwise, every model, whatever its size, trains for the same 250,000 steps at the same batch of 512 sequences of 1,024 tokens, about half a million tokens a step. That's about 130 billion tokens per run, five or six passes over the data by our arithmetic. And every run uses the one schedule on the right: a 3,000-step linear warmup, then a cosine decay to zero at the last step.
So yes, all the main models trained for the same number of steps. Three families of runs break that rule on purpose, and we'll name them when they come up: the data runs stop as soon as the test loss stops falling; the batch runs change the batch size; and the schedule runs try other schedules.
Remember the one schedule. When Chinchilla disagrees two years later, it blames exactly this: losses for small budgets were read partway through these long runs.

---

<p class="eyebrow"><span class="paper">Kaplan et al. 2020</span> · App. D.6 · the schedule runs · Fig. 22</p>

## Does the schedule matter?

<div class="cols wide-fig">
<div class="text">

<dl class="where card">
<dt>Runs</dt><dd>a 3M-parameter model, many times</dd>
<dt>Varied</dt><dd>the learning-rate schedule: cosine, linear, faster and slower decays</dd>
<dt>Each line</dt><dd>top: one schedule</dd>
<dt>Each point</dt><dd>bottom: one run's final loss</dd>
<dt>Axes</dt><dd>top: learning rate against step; bottom: loss against the learning rate summed over all steps</dd>
</dl>

<p class="plain">The final loss depends mostly on the summed learning rate, not the shape, given a warmup and a decay.</p>

</div>
<div class="fig"><img src="img/week-06-kaplan-fig22.png" alt="Kaplan et al. Figure 22: top, a variety of learning-rate schedules over 250,000 steps; bottom, final loss between about 3.7 and 3.9 against the learning rate summed over steps, nearly flat once the sum is large enough"></div>
</div>

<p class="footnote">Kaplan et al. 2020 · App. D.6, Fig. 22: the schedule "is mostly irrelevant, as long as the total summed learning rate is sufficiently large". Here not decayed to zero. Run-to-run noise: about 0.05 in loss</p>

Note:
Optional. Why is it fair to use one schedule for everything? Appendix D.6 tries many on a small model, 3 million parameters: cosine, linear, and faster or slower decays, the top panel. The bottom panel puts each run's final loss against the learning rate summed over all its steps. Once that sum is large enough, the shape of the schedule barely matters, as long as there is a warmup and a decay.
Two later findings qualify this. Chinchilla shows that a schedule much longer than the run hurts. Porian et al. show that at the small batches of compute-optimal small models, AdamW's beta-2 needs retuning.

---

<p class="eyebrow"><span class="paper">Kaplan et al. 2020</span> · §2, §3 · the runs</p>

## Which runs does the paper rely on?

<div class="rows">
<div class="fig"><img src="img/week-06-kaplan-runs.png" alt="Illustration: six families of runs, with a thumbnail of every figure each gives. The size runs, 768 to 1.5B parameters on all of WebText2 for 250k steps: Figs. 1 left and right, 2, 4 right, 6, 8, 11, 13, 14. The shape runs, fixed size with one shape knob changed: Fig. 5. The data runs, subsets of 21M to 22B tokens stopped early: Figs. 1 middle, 4 left, 9. The batch runs, a 3M and an 85M model at many batch sizes: Figs. 10, 18. The schedule runs, a 3M model with many schedules: Fig. 22. The LSTM runs: Fig. 7"></div>
<p class="plain">The size runs carry most of the paper: 768 to 1.5B parameters, read at the end, along the way, and on other text.</p>
</div>

<p class="footnote">Kaplan et al. 2020 · §2.2, §3 (what they varied), §4.2, §5.1, App. D. The paper does not number its experiments; the names are ours</p>

Note:
Here is the whole paper's evidence on one page. The paper doesn't number its experiments, so we name them by what they are, and each results slide from here on says which family its plot comes from.
The size runs are the backbone: models from 768 to 1.5 billion non-embedding parameters, all trained the same way on all of WebText2. Most figures are these runs read differently: the final loss of each, the whole learning curve, the loss on other text.
The other families each change one more thing. The shape runs hold the size fixed and change the shape. The data runs train on smaller subsets and stop early. The batch runs, on two small models, change the batch size. The schedule runs change the learning-rate schedule. The LSTM runs swap the architecture.
Three figures need no new runs at all: Figures 3, 12 and 15 are computed from fitted equations.

---

<p class="eyebrow"><span class="paper">Kaplan et al. 2020</span> · §2.1 · Eq. 2.1</p>

## Where does $N \approx 12\thinspace n_{\rm layer}\thinspace d_{\rm model}^2$ come from?

<div class="cols">
<div class="text">

- Attention: $Q, K, V, O$, each $d \times d$: $4d^2$.
- MLP: $d \to 4d \to d$: $8d^2$.
- One layer: $12d^2$; all layers: $12\thinspace n_{\rm layer} d^2$.
- Left out: the embeddings, $n_{\rm vocab} d + n_{\rm ctx} d$.

</div>
<div class="text">

<p class="plain">GPT-2's largest shape, 48 layers and $d$ = 1,600: $12 \times 48 \times 1600^2 \approx 1.47$B.</p>
<p class="plain">Its token table, $50{,}257 \times 1{,}600 \approx 80$M (about 5%), is not counted in $N$.</p>

</div>
</div>

<p class="footnote">Kaplan et al. 2020 · Eq. 2.1, Table 1 (with $d_{\rm attn} = d_{\rm ff}/4 = d_{\rm model}$). The 80M is our arithmetic</p>

Note:
Where the parameter count comes from. In each layer, attention has four d-by-d matrices, queries, keys, values and output: 4 d squared. The MLP goes from d to 4d and back: 8 d squared. Twelve d squared per layer, times the number of layers. Biases and norms are tiny and ignored.
Check it on GPT-2's largest shape: 48 layers, width 1,600. Twelve times 48 times 1,600 squared is about 1.47 billion, the "1.5B" model.
The embeddings, the token and position tables, are left out of N. For this model the token table is about 80 million, 5% of the total. For small models it's a much bigger share, which comes back with Figure 6.

---

<p class="eyebrow"><span class="paper">Kaplan et al. 2020</span> · §2.1 · Eq. 2.2</p>

## Why $6N$ FLOPs per token?

<div class="cols">
<div class="text">

- Forward: one multiply-add per weight: $2N$.
- Backward: about twice the forward: $4N$.
- Per token: $6N$; a whole run: $C \approx 6NBS$.
- Fixed $C$: a bigger $N$ means fewer tokens.

</div>
<div class="text">

<p class="plain">Left out: attention over the context, and the output layer.</p>
<p class="plain">For small models these matter (Porian et al. 2024, last slide).</p>

</div>
</div>

<p class="footnote">Kaplan et al. 2020 · §2.1, Table 1. $B$: tokens per batch; $S$: steps; 1 PF-day = $8.64\times10^{19}$ FLOPs. Table 1 lists the output layer's $2 d_{\rm model} n_{\rm vocab}$ FLOPs, then drops them</p>

Note:
Compute. In the forward pass each weight is used once per token, a multiply and an add, so 2N FLOPs. The backward pass costs about twice the forward, 4N. Six N per token.
Multiply by the tokens processed and you get the budget: C is about 6 N B S, batch times steps being the number of tokens. This one line is the whole trade-off of the next two papers: with C fixed, a bigger model means fewer tokens.
What it leaves out: the attention computation over the context, which the paper says matters only for long contexts, and the output layer's FLOPs, which Table 1 lists and then drops. In 2024 Porian et al. show that dropping the output layer is one reason Kaplan's allocation came out wrong.

---

<p class="eyebrow"><span class="paper">Kaplan et al. 2020</span> · §3.1 · the shape runs · Fig. 5</p>

## Does the shape matter at a fixed size?

<div class="rows">
<div class="points">
<div class="text">

<dl class="where card">
<dt>Runs</dt><dd>models at fixed sizes: 25M, 50M, 274M, 1.5B</dd>
<dt>Varied</dt><dd>one shape knob at a time; width adjusted to keep $N$ fixed</dd>
<dt>Each point</dt><dd>one run's final loss, % above the best shape</dd>
</dl>

</div>
<div class="text">

<p class="plain">Loss moves by a few percent over wide ranges of shape.</p>

- $(n_{\rm layer}, d_{\rm model}) = (6, 4288)$ is within 3% of GPT-2's $(48, 1600)$.

</div>
</div>
<div class="fig"><img src="img/week-06-kaplan-shape.png" alt="Kaplan et al. Figure 5: loss increase relative to the best shape against feed-forward ratio, aspect ratio and attention head dimension, for several fixed parameter counts; a few percent over wide ranges"></div>
</div>

<p class="footnote">Kaplan et al. 2020 · §3.1, Fig. 5. Up to about 8% at the extreme shapes. Small differences in $N$ are corrected with the $L(N)$ fit as the baseline</p>

Note:
The first result section asks whether the shape matters once you fix the size. They train models at a fixed number of non-embedding parameters and change one shape knob at a time: the feed-forward width, the depth (changing the width with it to keep N fixed), or the number of heads. Each point is one run's final loss, written as a percentage above the best shape at that size.
The answer, across all three panels: a few percent over wide ranges. A 6-layer model 4,288 wide gets within 3% of the 48-layer, 1,600-wide GPT-2 shape.
Why it's surprising: much of neural network design had been about finding the right architecture. This says that, for standard Transformers in this range, how much capacity you have matters far more than how you arrange it. The limits: within reasonable shapes, standard Transformers only. The next slides take each panel in turn.

---

<p class="eyebrow"><span class="paper">Kaplan et al. 2020</span> · §3.1 · the shape runs · Fig. 5, left</p>

## How wide should the feed-forward layer be?

<div class="cols wide-fig">
<div class="text">

<dl class="where">
<dt>$d_{\rm model}$</dt><dd>the residual width: the length of each token's vector between blocks</dd>
<dt>$d_{\rm ff}$</dt><dd>the width the feed-forward layer projects up into, before projecting back down</dd>
</dl>

<img class="inline-fig" src="img/week-06-kaplan-dff.svg" alt="Illustration (ours): one feed-forward block, widths drawn small; a residual vector of width d_model is projected up to a wider vector of width d_ff, then back down to width d_model">

<dl class="where card">
<dt>Runs</dt><dd>50M-parameter models; lines: 8 heads, or heads of size 64</dd>
<dt>Varied</dt><dd>$d_{\rm ff}/d_{\rm model}$, 0.5 to about 40</dd>
</dl>

<p class="plain">Flat from 0.5 to 4, the usual choice; much wider is worse, 8% near 40.</p>

</div>
<div class="fig"><img src="img/week-06-kaplan-fig5-ff.png" alt="Kaplan et al. Figure 5 left: loss increase against feed-forward ratio for 50M-parameter models; under 1% from 0.5 to 4, rising to about 8% near 40"></div>
</div>

<p class="footnote">Kaplan et al. 2020 · Fig. 5, left panel (x: the ratio, log; y: loss above the best shape). At fixed $N$, a wider feed-forward layer means a narrower $d_{\rm model}$</p>

Note:
The left panel. First, the two widths. Every token is carried between blocks as a vector of length d_model, the residual width. Inside each block, the feed-forward layer projects that vector up to a longer one, of length d_ff, applies the nonlinearity, and projects it back down to d_model. The ratio d_ff over d_model says how much wider that inner layer is: a ratio of 4 means four times wider, 0.5 means half as wide.
All models here have 50 million parameters. The knob is that ratio; to keep N fixed, the model width shrinks as the feed-forward layer grows. The two lines are two ways of choosing the heads. From half to four times the width, the loss barely moves; four is the standard Transformer choice. Push it to about 40 and the loss is 8% worse.

---

<p class="eyebrow"><span class="paper">Kaplan et al. 2020</span> · §3.1 · the shape runs · Fig. 5, middle</p>

## Deep and narrow, or shallow and wide?

<div class="cols wide-fig">
<div class="text">

<dl class="where card">
<dt>Runs</dt><dd>models of 50M, 274M and 1.5B parameters</dd>
<dt>Varied</dt><dd>aspect ratio $d_{\rm model}/n_{\rm layer}$, about 3 to 2,000</dd>
<dt>Each line</dt><dd>one model size</dd>
<dt>Axes</dt><dd>aspect ratio (log); loss above the best</dd>
</dl>

<p class="plain">From about 10 to 300 every size is within about 2%; only the extremes cost more.</p>

</div>
<div class="fig"><img src="img/week-06-kaplan-fig5-aspect.png" alt="Kaplan et al. Figure 5 middle: loss increase against aspect ratio for 50M, 274M and 1.5B parameter models; near zero between aspect ratios of about 10 and 300, rising to 3 to 8% at the extremes"></div>
</div>

<p class="footnote">Kaplan et al. 2020 · Fig. 5, middle panel: "A wide range of architectures achieve similar performance"</p>

Note:
The middle panel is the depth question. At each of three sizes, they trade depth for width at a fixed parameter count; the x axis is width over depth. Between about 10 and 300 the curves are nearly flat, within about 2 percent, at every size. Only very deep-and-narrow or very shallow-and-wide models pay more, up to 8% for the 274M model at the widest extreme. The paper's aside: this would follow if deep Transformers behave like ensembles of shallower ones, as has been suggested for ResNets.

---

<p class="eyebrow"><span class="paper">Kaplan et al. 2020</span> · §3.1 · the shape runs · Fig. 5, right</p>

## How big should each attention head be?

<div class="cols wide-fig">
<div class="text">

<dl class="where card">
<dt>Runs</dt><dd>25M-parameter models</dd>
<dt>Varied</dt><dd>head size $d_{\rm model}/n_{\rm head}$, 16 to about 256</dd>
<dt>Each line</dt><dd>one width: 256, 512 or 1,024</dd>
<dt>Axes</dt><dd>head size (log); loss above the best</dd>
</dl>

<p class="plain">Under 2% everywhere: the number of heads hardly matters.</p>

</div>
<div class="fig"><img src="img/week-06-kaplan-fig5-heads.png" alt="Kaplan et al. Figure 5 right: loss increase against attention head dimension for 25M parameter models of widths 256, 512 and 1024; all under 2%. A bar marks that 22% more compute compensates for a 1% loss increase"></div>
</div>

<p class="footnote">Kaplan et al. 2020 · Fig. 5, right panel. Its bar: 22% more compute makes up for a 1% loss increase</p>

Note:
The right panel: the head size, which at a fixed width is the same as choosing the number of heads. Three widths of 25-million-parameter models. Everything stays under 2%. The bar on the plot puts these percentages in compute terms: 22% more compute buys back a 1% higher loss. So a few percent of loss from a bad shape is real money at scale, but small next to a 10x change in size.

---

<p class="eyebrow"><span class="paper">Kaplan et al. 2020</span> · §3.2 · the size runs · Fig. 2, left</p>

## What do the size runs look like?

<div class="cols wide-fig">
<div class="text">

<dl class="where card">
<dt>Runs</dt><dd>the size runs: $10^3$ to $10^9$ parameters, all of WebText2, 250k steps</dd>
<dt>Varied</dt><dd>model size (colour: dark small, yellow large)</dd>
<dt>Each line</dt><dd>one model's test loss as it trains</dd>
<dt>Axes</dt><dd>tokens processed (log); test loss</dd>
</dl>

<p class="plain">Bigger models are lower everywhere, and reach any given loss with fewer tokens.</p>

</div>
<div class="fig"><img src="img/week-06-kaplan-fig2-tokens.png" alt="Kaplan et al. Figure 2 left: test loss against tokens processed for models from 10^3 to 10^9 parameters, coloured from dark to yellow by size; larger models fall lower and sooner"></div>
</div>

<p class="footnote">Kaplan et al. 2020 · §1.1, Fig. 2 left: "Larger models require fewer samples to reach the same performance". Panel titles cropped</p>

Note:
Now the backbone: the size runs. Every line is one model, trained on all of WebText2 for the same 250,000 steps, and the plot shows its test loss as it trains. Colour is size, from a thousand parameters (dark) to a billion (yellow).
Two things to notice. Bigger models are lower everywhere. And they reach any given loss with fewer tokens, which the paper calls sample efficiency. The curves also share one shape: a plateau, a fast drop, then a slow decline.
Hold on to these curves. The next several results are all read off them: the end of each curve gives the size law, and the lower envelope gives the compute law.

---

<p class="eyebrow"><span class="paper">Kaplan et al. 2020</span> · §3.2 · the size runs · Fig. 2, right</p>

## What do the size runs look like against compute?

<div class="cols wide-fig">
<div class="text">

<dl class="where card">
<dt>Runs</dt><dd>the size runs: 768 to 1.5B parameters, 250k steps each</dd>
<dt>Each line</dt><dd>one model's test loss as it trains</dd>
<dt>Axes</dt><dd>compute so far, $6N$ × tokens, in PF-days (log); test loss</dd>
</dl>

<p class="plain">At any budget, the lowest curve belongs to a model that is still far from converged.</p>

- Its lower envelope becomes Fig. 1's compute law, later in §3.

</div>
<div class="fig"><img src="img/week-06-kaplan-fig2-compute.png" alt="Kaplan et al. Figure 2 right: the same learning curves against compute in PF-days; larger models start later but cross below smaller ones; a bar marks that compute-efficient training stops far short of convergence"></div>
</div>

<p class="footnote">Kaplan et al. 2020 · Fig. 2 right: "Compute-efficient training stops far short of convergence". 1 PF-day = $8.64\times10^{19}$ FLOPs</p>

Note:
The size runs again, 768 to 1.5 billion parameters, with the x axis changed from tokens to compute: each token costs 6N FLOPs, so a big model's curve slides to the right. Now the curves cross. At a small budget a small model is lowest; at a bigger budget, a bigger model that is still mid-training beats a small one that has finished.
The bar marks the paper's point: at any budget, the model that does best is one stopped well before it converges. That lower envelope, the best loss you can get for each budget, becomes the compute law of Figure 1 a few slides on.

---

<p class="eyebrow"><span class="paper">Kaplan et al. 2020</span> · §3.2 · the size runs · Fig. 6</p>

## Why leave the embeddings out of $N$?

<div class="cols wide-fig">
<div class="text">

<dl class="where card">
<dt>Runs</dt><dd>the size runs, at many depths</dd>
<dt>Each point</dt><dd>one model's final test loss; colour: its number of layers</dd>
<dt>Axes</dt><dd>parameters, top with embeddings and bottom without (log); test loss</dd>
</dl>

<p class="plain">Counted with embeddings, depths split apart; without, they fall on one line.</p>


</div>
<div class="fig"><img src="img/week-06-kaplan-fig6.png" alt="Kaplan et al. Figure 6: loss against parameters; top, with embeddings, models of different depth lie on separate curves; bottom, without embeddings, they collapse onto one trend"></div>
</div>

<p class="footnote">Kaplan et al. 2020 · §3.2, Fig. 6 (the paper's left and right, stacked here)</p>

Note:
Why does Kaplan count N without the embeddings? Because of this figure: the size runs, 768 to 1.5 billion parameters, final losses, coloured by depth. Count every parameter, top, and models of different depth lie on different curves. Count only the non-embedding parameters, bottom, and every model with two or more layers lines up on one curve.
That one clean curve is what makes the size law possible. But it is a counting choice that cleans up the fit, not a claim that embeddings do nothing. The next slides take each panel in turn.

---

<p class="eyebrow"><span class="paper">Kaplan et al. 2020</span> · §3.2 · the size runs · Fig. 6, left</p>

## What happens if you count the embeddings?

<div class="cols wide-fig">
<div class="text">

<dl class="where card">
<dt>Each line</dt><dd>models of one depth: 0, 1, 2, 3, 6, more than 6 layers</dd>
<dt>Axes</dt><dd>all parameters, including token and position tables (log); test loss</dd>
</dl>

<p class="plain">At the same total count, shallow models do worse: more of their count is the embedding table.</p>

</div>
<div class="fig"><img src="img/week-06-kaplan-fig6-all.png" alt="Kaplan et al. Figure 6 left: test loss against parameters including embeddings, one line per depth from 0 layers to more than 6; shallower models lie higher"></div>
</div>

<p class="footnote">Kaplan et al. 2020 · Fig. 6 left. A 2-layer, 128-wide model: about 0.4M non-embedding parameters and 6.4M in its token table (ours)</p>

Note:
Counted with embeddings. Each line is one depth. At the same total, shallow models are worse, because for a small or shallow model most of the count is the token table, which contributes much less than layers do. A 2-layer, 128-wide model has about 0.4 million parameters in its layers and 6.4 million in its token table.

---

<p class="eyebrow"><span class="paper">Kaplan et al. 2020</span> · §3.2 · the size runs · Fig. 6, right</p>

## And without them?

<div class="cols wide-fig">
<div class="text">

<dl class="where card">
<dt>Each line</dt><dd>models of one depth: 1, 2, 3, 6, more than 6 layers</dd>
<dt>Axes</dt><dd>non-embedding parameters $N$ (log); test loss</dd>
</dl>

<p class="plain">Two layers and up collapse onto one trend; only 1-layer models sit above it.</p>

</div>
<div class="fig"><img src="img/week-06-kaplan-fig6-nonembed.png" alt="Kaplan et al. Figure 6 right: test loss against non-embedding parameters, one line per depth; all depths of two or more layers lie on one trend, one-layer models above it"></div>
</div>

<p class="footnote">Kaplan et al. 2020 · Fig. 6 right: only models "with fewer than 2 layers or with extreme depth-to-width ratios deviate". Pearce and Song 2024 trace part of the 0.73 to this choice (last slide)</p>

Note:
Counted without embeddings. All depths of two or more layers fall on one line; one-layer models are the exception. This is the N used everywhere from now on.
What can go wrong: in the small models where Kaplan had most of his runs, the left-out table is most of the model. Pearce and Song argue in 2024 that this choice is a large part of why the compute-optimal rule came out wrong.

---

<p class="eyebrow"><span class="paper">Kaplan et al. 2020</span> · §3.2 · the size runs · Fig. 1, right</p>

## Is the final loss a power law in $N$?

<div class="cols wide-fig">
<div class="text">

<dl class="where card">
<dt>Runs</dt><dd>the size runs, 250k steps on all of WebText2</dd>
<dt>Each point</dt><dd>one model's final test loss</dd>
<dt>Axes</dt><dd>non-embedding parameters (log); test loss (log)</dd>
</dl>

<div class="eq">$$L(N) = \Big(\frac{N_c}{N}\Big)^{\alpha_N},\quad \alpha_N \approx 0.076$$</div>

<p class="plain">A straight line on log-log axes is a power law. 10x the parameters: loss × $10^{-0.076}$ = 0.84.</p>

</div>
<div class="fig"><img src="img/week-06-kaplan-fig1-params.png" alt="Kaplan et al. Figure 1 right: test loss against non-embedding parameters from about 10^4 to 10^9 on log axes, points on a straight line with fit L = (N / 8.8e13)^-0.076"></div>
</div>

<p class="footnote">Kaplan et al. 2020 · §1.2 Eq. 1.1, §3.2, Fig. 1 right. $N_c = 8.8\times10^{13}$; the constant depends on the tokenizer. No overfitting "except possibly for the very largest models"</p>

Note:
The first of the three laws, now with its experiment. The size runs again, but only the end of each curve: one point per model, its final test loss, against its non-embedding size. On log-log axes the points lie on a straight line, and a straight line on log-log axes is a power law: L equals N_c over N, to the power 0.076.
What it buys you: every tenfold increase in N multiplies the loss by 10 to the minus 0.076, which is 0.84, about 16% lower; a hundredfold, 0.84 squared. That constant ratio is what makes extrapolation possible: fit the small models, predict the big one. The catch, which the Chinchilla story is about, is that it holds only while you stay in the same regime.
These models are trained close to convergence with plenty of data: this is the loss when size is the only limit.

---

<p class="eyebrow"><span class="paper">Kaplan et al. 2020</span> · §3.2.1 · the LSTM runs · Fig. 7</p>

## Do LSTMs scale the same way?

<div class="rows">
<div class="points">
<div class="text">

<dl class="where card">
<dt>Runs</dt><dd>LSTMs of 1, 2 and 4 layers, same data and context, against the size runs</dd>
<dt>Left</dt><dd>each point: one model's final loss, against $N$</dd>
<dt>Right</dt><dd>each line: one model's loss at each position of the context</dd>
</dl>

</div>
<div class="text">

<p class="plain">LSTMs match Transformers on the first tokens, then stop improving; Transformers keep using the whole context.</p>


</div>
</div>
<div class="fig"><img src="img/week-06-kaplan-fig7.png" alt="Kaplan et al. Figure 7: left, test loss against parameters for Transformers and LSTMs of 1, 2 and 4 layers, the Transformer line below and falling faster; right, per-token test loss against token position in the context, LSTMs flattening after about 100 tokens while Transformers keep improving"></div>
</div>

<p class="footnote">Kaplan et al. 2020 · §3.2.1, Fig. 7. Recurrent Transformers, which reuse parameters, are compared in App. D (Fig. 17)</p>

Note:
Is any of this special to Transformers? Section 3.2.1 trains LSTMs on the same data and context. Two panels. Left: final loss against size, like Figure 1 right. Right: the loss at each position in the 1,024-token context, so you can see where in the text the model is good.
The LSTMs do as well on early tokens, but they stop improving after about 100 tokens of context, while the Transformers keep improving to the end. The next slides take each panel in turn.

---

<p class="eyebrow"><span class="paper">Kaplan et al. 2020</span> · §3.2.1 · the LSTM runs · Fig. 7, left</p>

## Are LSTMs worse at every size?

<div class="cols wide-fig">
<div class="text">

<dl class="where card">
<dt>Each point</dt><dd>one model's final test loss</dd>
<dt>Lines</dt><dd>blue: Transformers; red: LSTMs of 1, 2 and 4 layers</dd>
<dt>Axes</dt><dd>non-embedding parameters (log); test loss (log)</dd>
</dl>

<p class="plain">The LSTM lines sit above the Transformer line and fall more slowly, so the gap grows with size.</p>

</div>
<div class="fig"><img src="img/week-06-kaplan-fig7-size.png" alt="Kaplan et al. Figure 7 left: test loss against non-embedding parameters; the Transformer line falls steadily from 10^5 to 10^9; three LSTM lines lie above it and fall more slowly"></div>
</div>

<p class="footnote">Kaplan et al. 2020 · Fig. 7 left: "Transformers asymptotically outperform LSTMs due to improved use of long contexts"</p>

Note:
Left panel. Same axes as the size law. The LSTMs, in red, lie above the Transformers and their lines are shallower, so the gap widens as models grow. The panel title gives the paper's reason, which the right panel shows: Transformers use long contexts better.

---

<p class="eyebrow"><span class="paper">Kaplan et al. 2020</span> · §3.2.1 · the LSTM runs · Fig. 7, right</p>

## Where in the context do LSTMs fall behind?

<div class="cols wide-fig">
<div class="text">

<dl class="where card">
<dt>Each line</dt><dd>one model's loss on the token at each position</dd>
<dt>Lines</dt><dd>red: LSTMs (400K, 2M, 200M); blue: Transformers (400K, 3M, 300M)</dd>
<dt>Axes</dt><dd>position in the context, 1 to 1,024 (log); loss on that token</dd>
</dl>

<p class="plain">Each LSTM goes flat before about 100 tokens; each Transformer keeps falling to the end.</p>

</div>
<div class="fig"><img src="img/week-06-kaplan-fig7-context.png" alt="Kaplan et al. Figure 7 right: per-token test loss against token index in the context; LSTM lines flatten before about 100 tokens while Transformer lines keep falling to 1,024"></div>
</div>

<p class="footnote">Kaplan et al. 2020 · Fig. 7 right: "LSTM plateaus after &lt;100 tokens. Transformer improves through the whole context"</p>

Note:
Right panel. Here the x axis is not size but position: how far into the 1,024-token context the predicted token is. Every model is bad at the first tokens, which have little context to use. The LSTMs stop getting better after about a hundred tokens: more context doesn't help them. The Transformers keep improving all the way to position 1,024. That's where the Transformer's advantage in the left panel comes from.

---

<p class="eyebrow"><span class="paper">Kaplan et al. 2020</span> · §3.2.2 · the size runs on other text · Fig. 8</p>

## Does it carry over to other text?

<div class="cols wide-fig">
<div class="text">

<dl class="where card">
<dt>Runs</dt><dd>the size runs, trained only on WebText2</dd>
<dt>Varied</dt><dd>the test text: Books, Internet Books, Wikipedia, Common Crawl</dd>
<dt>Top</dt><dd>loss on each test set against $N$</dd>
<dt>Bottom</dt><dd>loss on Books or Wikipedia against loss on WebText2</dd>
</dl>

<p class="plain">The same trend, shifted up by a small, nearly constant amount.</p>


</div>
<div class="fig"><img src="img/week-06-kaplan-fig8.png" alt="Kaplan et al. Figure 8: top, test loss on other text distributions against model size, roughly parallel lines offset from WebText2; bottom, loss on Books and Wikipedia against WebText2 loss, close to straight lines"></div>
</div>

<p class="footnote">Kaplan et al. 2020 · §3.2.2, Fig. 8 (left and right, stacked). Transfer "incurs a constant penalty but otherwise improves roughly in line with performance on the training set" (§1.1)</p>

Note:
Does any of this depend on WebText2? Section 3.2.2 takes the size runs, 768 to 1.5 billion parameters, trained only on WebText2, and tests them on other text: books, Wikipedia, Common Crawl. Top: loss on each test set against size. Bottom: loss on two of those sets against loss on WebText2. The next slides take each panel in turn.

---

<p class="eyebrow"><span class="paper">Kaplan et al. 2020</span> · §3.2.2 · the size runs on other text · Fig. 8, left</p>

## Do other test sets follow the same size law?

<div class="cols wide-fig">
<div class="text">

<dl class="where card">
<dt>Each point</dt><dd>one model's final loss on one test set</dd>
<dt>Lines</dt><dd>one test set each, WebText2's own test text at the bottom</dd>
<dt>Axes</dt><dd>non-embedding parameters (log); test loss (log)</dd>
</dl>

<p class="plain">Nearly parallel lines: a better model on WebText2 is better on each, by about the same step.</p>

</div>
<div class="fig"><img src="img/week-06-kaplan-fig8-size.png" alt="Kaplan et al. Figure 8 left: test loss against non-embedding parameters on WebText2, Internet Books, Books, Wikipedia and Common Crawl; roughly parallel lines, WebText2 lowest"></div>
</div>

<p class="footnote">Kaplan et al. 2020 · Fig. 8 left: "only a small and very slowly growing offset from the WebText2 training distribution"</p>

Note:
Left panel. One line per test set. They are close to parallel, with WebText2's own test set the lowest, as you'd expect, and the others a small step above. The offset grows only slowly with size. So the size law is not a quirk of the training distribution, at least for these kinds of English text.

---

<p class="eyebrow"><span class="paper">Kaplan et al. 2020</span> · §3.2.2 · the size runs on other text · Fig. 8, right</p>

## Does it matter how long a model trained?

<div class="cols wide-fig">
<div class="text">

<dl class="where card">
<dt>Points</dt><dd>converged models: loss on Books (blue) or Wikipedia (orange)</dd>
<dt>Dashed</dt><dd>one large model at checkpoints during training</dd>
<dt>Axes</dt><dd>loss on WebText2; loss on the other set</dd>
</dl>

<p class="plain">Both lie on the same lines: transfer depends on the WebText2 loss, not on how it was reached.</p>

</div>
<div class="fig"><img src="img/week-06-kaplan-fig8-train.png" alt="Kaplan et al. Figure 8 right: loss on Books and Wikipedia against loss on the training distribution; points for converged models and dashed curves for one large model during training lie on the same lines"></div>
</div>

<p class="footnote">Kaplan et al. 2020 · Fig. 8 right: "Generalization performance depends only on training distribution performance, and not on the phase of training"</p>

Note:
Right panel, a cleverer check. The x axis is the loss on WebText2, decreasing to the right. The dots are finished models of different sizes; the dashed lines are a single large model at checkpoints during its training. They lie on the same lines. So a half-trained big model and a converged small model with the same WebText2 loss do equally well on books or Wikipedia. Only the in-distribution loss matters, not the route to it.
What it does not show: robustness to any distribution shift. These are all English text, mostly web and books.

---

<p class="eyebrow"><span class="paper">Kaplan et al. 2020</span> · §3.3 · the data runs · Fig. 1, middle</p>

## What does data alone buy?

<div class="cols wide-fig">
<div class="text">

<dl class="where card">
<dt>Runs</dt><dd>one model, 36 layers × 1,280 wide, on fixed subsets of WebText2</dd>
<dt>Varied</dt><dd>the subset's size</dd>
<dt>Each point</dt><dd>the test loss when training stopped: as soon as it stopped falling</dd>
<dt>Axes</dt><dd>tokens in the subset (log); test loss (log)</dd>
</dl>

<p class="plain">10x the data: loss × 0.80, on the straight line $L(D) = (D_c/D)^{0.095}$</p>

</div>
<div class="fig"><img src="img/week-06-kaplan-fig1-data.png" alt="Kaplan et al. Figure 1 middle: test loss against dataset size in tokens on log axes, points on a straight line with fit L = (D / 5.4e13)^-0.095"></div>
</div>

<p class="footnote">Kaplan et al. 2020 · §3.3, Eq. 1.2, Fig. 1 middle. $D_c = 5.4\times10^{13}$ tokens. $12 \times 36 \times 1280^2 \approx 708$M parameters (ours)</p>

Note:
The second law needs a different experiment, and this is the one the old slide hid. It does not come from the size runs. One model, 36 layers and 1,280 wide, about 708 million non-embedding parameters, is trained on smaller and smaller fixed subsets of WebText2. On a small subset it would start to memorise, so each run stops as soon as the test loss stops falling: early stopping. Each point is one subset: its size on the x axis, the best test loss on the y axis.
Another straight line on log-log axes: L of D equals D_c over D to the 0.095. Ten times the data multiplies the loss by 0.80.
The model is kept big so that data is the only limit, the mirror image of the size law, where data was plentiful and size was the limit.

---

<p class="eyebrow"><span class="paper">Kaplan et al. 2020</span> · §3.3 · the size runs, re-read · Fig. 1, left</p>

## What does compute alone buy?

<div class="cols wide-fig">
<div class="text">

<dl class="where card">
<dt>Runs</dt><dd>the size runs' learning curves (Fig. 2, right)</dd>
<dt>Blue lines</dt><dd>one model's loss as it trains</dd>
<dt>Black line</dt><dd>the lowest loss any model has reached at that compute</dd>
<dt>Axes</dt><dd>compute in PF-days, adjusted to a small batch (log); test loss (log)</dd>
</dl>

<p class="plain">10x the compute: loss × 0.89, on the straight black envelope $L \propto C_{\min}^{-0.050}$</p>

</div>
<div class="fig"><img src="img/week-06-kaplan-fig1-compute.png" alt="Kaplan et al. Figure 1 left: test loss against compute in PF-days; many blue learning curves, their lower envelope in black, fit by the orange dashed line L = (C_min / 2.3e8)^-0.050"></div>
</div>

<p class="footnote">Kaplan et al. 2020 · §3.3, Eq. 1.3, Fig. 1 left. The axis is the compute each run would have needed at a small batch, $C_{\min}$ (Fig. 1's footnote; §5.1). With raw compute the slope is 0.057 (Fig. 13)</p>

Note:
The third law is not a new experiment either. It is the size runs' learning curves from Figure 2, against compute. Every blue line is one model training. For each amount of compute, take the lowest loss any model has reached: that's the black line. Each stretch of it belongs to a different model, stopped well before it converged.
The black envelope is straight on log-log axes, with slope minus 0.050: ten times the compute multiplies the loss by 0.89.
One wrinkle, which section 5 explains: the x axis is not the compute actually spent. All runs used one fixed batch, and the paper converts each run to the compute it would have needed at a small, efficient batch, called C_min. On the raw compute the slope is 0.057.

---

<p class="eyebrow"><span class="paper">Kaplan et al. 2020</span> · §1.2 · Eq. 1.1 to 1.3 · Fig. 1</p>

## Three laws, three different experiments

<div class="rows">
<div class="points">
<div class="text">

- **Compute**, 0.050: the size runs' learning curves, best model at each budget. 10x ▸ 11% lower.
- **Data**, 0.095: the data runs, one big model, stopped early. 10x ▸ 20% lower.
- **Parameters**, 0.076: the size runs' final losses, data plentiful. 10x ▸ 16% lower.

</div>
<div class="text">

<p class="plain">Each law holds only when the other two are not the limit.</p>
<p class="plain">The exponents are not prices: 10x of each costs a different amount.</p>

</div>
</div>
<div class="fig"><img src="img/week-06-kaplan-fig1.png" alt="Kaplan et al. Figure 1: the three power laws in compute, dataset size and parameters"></div>
</div>

<p class="footnote">Kaplan et al. 2020 · §1.2: each law holds "when not bottlenecked by the other two" (Fig. 1 caption). $N_c$, $D_c$ depend on the tokenizer and "do not have a fundamental meaning"</p>

Note:
Now Figure 1 again, and this time every panel has its experiment. Left, compute: the size runs' learning curves, taking the best model at each budget. Middle, data: the data runs, one large model on subsets, stopped early. Right, parameters: the size runs' final losses, with data plentiful.
Read as numbers: ten times the compute, spent well, about 11% lower loss; ten times the data, with a big enough model, about 20%; ten times the parameters, with plenty of data and training, about 16%.
Two traps. Each law was measured with the other two factors made generous, so each holds only in its own regime. And don't compare them as if ten times of each cost the same: ten times the compute has to be split between a bigger model and more training, which is why its exponent is the smallest.

---

<p class="eyebrow"><span class="paper">Kaplan et al. 2020</span> · §4.1 · the data runs, many sizes · Eq. 1.5, Fig. 4 left</p>

## What if size and data are both limited?

<div class="cols wide-fig">
<div class="text">

<div class="eq">$$L(N,D) = \Big[\Big(\frac{N_c}{N}\Big)^{\alpha_N/\alpha_D} + \frac{D_c}{D}\Big]^{\alpha_D}$$</div>

- $D \to \infty$: back to $L(N)$; $N \to \infty$: back to $L(D)$.
- A guess with the right limits (an ansatz), then tested.
- $N_c$, $D_c$, $\alpha_N$, $\alpha_D$: the constants and exponents of the two single laws, refitted jointly.

<dl class="where card">
<dt>Runs</dt><dd>six sizes, 393K to 708M, on subsets of 21M to 22B tokens, stopped early</dd>
<dt>Each point</dt><dd>one (size, subset) run's best test loss; dotted: the fit</dd>
</dl>

</div>
<div class="fig"><img src="img/week-06-kaplan-fig4-left.png" alt="Kaplan et al. Figure 4 left: loss against tokens in the dataset for models from 393K to 708M parameters, with dotted fits; each model's curve flattens at its own floor, larger models lower"></div>
</div>

<p class="footnote">Kaplan et al. 2020 · §4.1, Eq. 1.5 (= 4.1), Fig. 4 left (x: tokens in the dataset; colour: model size). 10% dropout; regularisation not tuned</p>

Note:
Real training is limited by size and data at once, so section 4 needs one function of both. Equation 1.5. Check its limits: with infinite data the second term vanishes and you get the size law back; with an infinite model the first term vanishes and you get the data law back. In between, it interpolates.
The form is an ansatz: chosen to have those limits, then tested. The authors give three principles for it; the third, that it should be a series in 1 over D at large D, they call "more speculative".
The test is the data runs, extended: six model sizes from 393 thousand to 708 million parameters, each on subsets from 21 million to 22 billion tokens, each stopped early, with 10% dropout. Each point is one pair. On this plot, loss against data, each model flattens at its own floor once data stops being the limit; the dotted lines are the fitted equation.

---

<p class="eyebrow"><span class="paper">Kaplan et al. 2020</span> · §4.2 · the data runs, many sizes · Fig. 9, left</p>

## When does a bigger model stop helping?

<div class="cols wide-fig">
<div class="text">

<dl class="where card">
<dt>Runs</dt><dd>the data runs: six sizes, 393K to 708M, on subsets of 21M to 22B tokens, stopped early</dd>
<dt>Each line</dt><dd>one subset size, 21M to 22B tokens</dd>
<dt>Each point</dt><dd>one model's best test loss on that subset; dotted: the fit</dd>
<dt>Axes</dt><dd>non-embedding parameters (log); test loss</dd>
</dl>

<p class="plain">With 22B tokens the line is the size law; with little data, bigger models stop helping.</p>

</div>
<div class="fig"><img src="img/week-06-kaplan-fig9a.png" alt="Kaplan et al. Figure 9 left: test loss against non-embedding parameters for dataset sizes from 21M to 22B tokens, with dotted fits; small datasets flatten early"></div>
</div>

<p class="footnote">Kaplan et al. 2020 · §4.2, Fig. 9 left. Joint fit: $\alpha_N = 0.076$, $\alpha_D = 0.103$ (Table 2). The 21M-token runs fit worst: an epoch is only 40 steps</p>

Note:
The data runs again, six sizes on subsets of 21 million to 22 billion tokens, plotted the other way: loss against model size, one line per subset. With the whole 22 billion tokens, the yellow line, you get the straight size law. With less data, each line bends flat: past some size, a bigger model doesn't help, because it can only memorise the small subset. The dotted lines are the single fitted equation, and they follow every subset except the very smallest, 21 million tokens, where an epoch is only 40 steps.

---

<p class="eyebrow"><span class="paper">Kaplan et al. 2020</span> · §4.2 · the data runs, many sizes · Eq. 4.3, Fig. 9 right</p>

## Does overfitting depend on $N$ and $D$ separately?

<div class="cols wide-fig">
<div class="text">

<div class="eq">$$\delta L = \frac{L(N,D)}{L(N,\infty)} - 1$$</div>

<dl class="where card">
<dt>Each point</dt><dd>one (size, subset) run: its loss over the same size's 22B-token loss, minus 1</dd>
<dt>Axes</dt><dd>$N^{0.74}/D$ (log); the overfitting penalty $\delta L$</dd>
</dl>

<p class="plain">All runs fall on one curve: the penalty depends on $N^{0.74}/D$ alone.</p>

</div>
<div class="fig"><img src="img/week-06-kaplan-fig9b.png" alt="Kaplan et al. Figure 9 right: the relative overfitting penalty against N^(alpha_N/alpha_D)/D for all dataset sizes, collapsing onto one curve"></div>
</div>

<p class="footnote">Kaplan et al. 2020 · Eq. 4.2, 4.3, Fig. 9 right. 0.74 = 0.076/0.103 from the joint fit; the separate data exponent, 0.095, would give 0.80. The full dataset stands in for $D = \infty$</p>

Note:
How much worse does a finite dataset make things? Delta L: a run's loss relative to the same size trained on all the data, minus one. If the equation is right, delta L depends only on N to the 0.74 over D, not on N and D separately.
The plot tests it: each point is one size-subset pair, placed by that one combination. Runs with very different N and D land on one curve. In physics you'd call that a scaling collapse. It's suggestive of shared structure, but a collapse by itself doesn't identify a mechanism.

---

<p class="eyebrow"><span class="paper">Kaplan et al. 2020</span> · §4.2 · from the fit · Eq. 4.4</p>

## How much data does a model need?

<div class="cols">
<div class="text">

<div class="eq">$$D \gtrsim 5\times10^{3}\thinspace N^{0.74}$$</div>

- Keeps the overfitting penalty under seed noise, about 0.02 in loss.
- $N = 10^9$: $D \gtrsim 2.3\times10^{10}$ tokens, about all of WebText2.
- 8x the model needs $8^{0.74} \approx 4.7$x the data.

</div>
<div class="text">

<p class="plain">Less than 8x, because bigger models use data more efficiently.</p>
<p class="plain">This only avoids overfitting; it is not the compute-optimal amount.</p>

</div>
</div>

<p class="footnote">Kaplan et al. 2020 · Eq. 4.4, §4.2: "this does not typically represent maximally compute-efficient training". The $2.3\times10^{10}$ and 4.7x are our arithmetic</p>

Note:
A rule you can use, read off the fit rather than a new experiment. To keep the overfitting penalty below the run-to-run noise of about 0.02 in loss, D should be at least 5,000 times N to the 0.74.
Plug in a billion parameters: about 23 billion tokens, essentially the whole of WebText2, which is why their largest models start to overfit mildly.
Scale the model 8x and the data needs only about 4.7x. That sublinear rule is the root of Kaplan's advice to grow models faster than data. But note the paper's own warning: this is the data needed to avoid overfitting, not the compute-optimal amount.

---

<p class="eyebrow"><span class="paper">Kaplan et al. 2020</span> · §5.1 · Eq. 5.1, 5.2 · the idea</p>

## How do steps, tokens and batch size fit together?

<div class="cols wide-fig">
<div class="text">

<dl class="where">
<dt>$B$, $S$, $E$</dt><dd>tokens per batch; steps; tokens processed, $E = B \times S$</dd>
<dt>$S_{\min}$, $E_{\min}$</dt><dd>the fewest steps (at a huge batch) and the fewest tokens (at a tiny batch) that reach a target loss</dd>
</dl>

<div class="eq">$$\Big(\frac{S}{S_{\min}} - 1\Big)\Big(\frac{E}{E_{\min}} - 1\Big) = 1$$</div>

<p class="plain">The corner, $B_{\rm crit} = E_{\min}/S_{\min}$, costs 2x the fewest steps and 2x the fewest tokens.</p>

</div>
<div class="fig"><img src="img/week-06-kaplan-batch-idea.svg" alt="Illustration: tokens processed against steps on log axes. Three grey diagonal lines, labelled on the lines B = 10 B_crit, B = B_crit and B = B_crit / 10. A black hyperbola for one target loss, approaching S_min on the left and E_min at the bottom. Where each line meets it, a dot: the large batch high and left, few steps and many tokens; the small batch low and right, few tokens and many steps; and in the middle an open ring marked B_crit, the corner, with dashed guides to 2 S_min steps and 2 E_min tokens"></div>
</div>

<p class="footnote">Kaplan et al. 2020 · Eq. 5.1, 5.2 (after McCandlish et al. 2018). Illustration ours, made-up numbers. Where a batch $B$ meets the curve: $S = S_{\min}(1 + B_{\rm crit}/B)$, $E = E_{\min}(1 + B/B_{\rm crit})$ (our algebra)</p>

Note:
Before the real figure, the idea it tests, drawn with made-up numbers. To reach a target loss you can use small batches and many steps, cheap in FLOPs but slow, or big batches and few steps, fast on parallel hardware but wasteful.
Three letters. B is the batch, in tokens. S is the number of steps. E is the number of tokens processed, which is just B times S. On log axes, a run at one batch size moves along a straight diagonal line as it trains: the grey lines, one per batch size.
Now fix a target loss. Each batch size reaches it at some point on its line: the dots. Join the dots and you get the black curve, a hyperbola: S over S_min minus one, times E over E_min minus one, equals one. S_min is the fewest steps possible, approached with a huge batch, high and left. E_min is the fewest tokens possible, approached with a tiny batch, low and right.
The critical batch size is E_min over S_min, the corner of the hyperbola: the open ring in the middle, where the line for B equal to B_crit meets the curve. The dashed guides read it off: training there costs twice the minimum steps and twice the minimum tokens, a reasonable compromise between time and compute.

---

<p class="eyebrow"><span class="paper">Kaplan et al. 2020</span> · §5.1, App. D.3 · the batch runs · Fig. 18</p>

## How big can a batch be before it is wasteful?

<div class="cols wide-fig">
<div class="text">

<dl class="where card">
<dt>Runs</dt><dd>a 3M-parameter model (shown) and an 85M one, at many batch sizes</dd>
<dt>Each curve</dt><dd>one target loss (colour)</dd>
<dt>Each dot</dt><dd>one run at one batch size $B$: the steps and tokens it took to reach that loss</dd>
<dt>Axes</dt><dd>steps $S$ (log); tokens processed $E = B \times S$ (log)</dd>
</dl>

<p class="plain">Every target loss traces the same hyperbola as the last slide, for both models.</p>

</div>
<div class="fig"><img src="img/week-06-kaplan-fig18-read.png" alt="Kaplan et al. Figure 18, 3M-parameter panel, with arrows: each coloured curve is one target loss; each dot is one run at one batch size reaching it. Tokens processed against steps on log axes; colour bar test loss from about 3 to 10"></div>
</div>

<p class="footnote">Kaplan et al. 2020 · App. D.3, Fig. 18 (3M panel; the 85M panel looks the same). Solid lines: the fit of Eq. 5.1; dotted: the measured points joined. Arrows and side text ours</p>

Note:
Now the real thing: the batch runs. A 3-million-parameter model, trained many times at different batch sizes; the 85-million model in the paper's other panel looks the same.
How to read it. The axes are the same as the last slide: steps across, tokens processed up, and tokens are batch times steps. Colour is the test loss. Each coloured curve is one target loss, from 10 at the bottom left, early in training, to about 4 at the top right. Each dot on a curve is one run, at one batch size, at the moment it reached that loss: runs with small batches sit low and to the right, few tokens but many steps; runs with large batches sit high and to the left.
Every curve has the hyperbola shape from the last slide, and the solid lines are that equation fitted to the dots. So for every loss we can read off its own S_min, E_min, and the critical batch, the corner. The next slide puts those critical batches together.

---

<p class="eyebrow"><span class="paper">Kaplan et al. 2020</span> · §5.1 · the batch runs · Fig. 10</p>

## How does the critical batch change during training?

<div class="cols wide-fig">
<div class="text">

<dl class="where card">
<dt>Runs</dt><dd>the batch runs, 3M and 85M</dd>
<dt>Each point</dt><dd>$B_{\rm crit}$ read off one hyperbola of Fig. 18; green: the gradient noise scale</dd>
<dt>Axes</dt><dd>training loss, falling to the right (log); $B_{\rm crit}$ in tokens (log)</dd>
</dl>

<p class="plain">$B_{\rm crit} \approx 2\times10^8\,L^{-4.8}$ tokens: it doubles for every 13% drop in loss, at both sizes.</p>

</div>
<div class="fig"><img src="img/week-06-kaplan-fig10.png" alt="Kaplan et al. Figure 10: critical batch size in tokens against WebText2 train loss on log axes; the 3M and 85M models follow the same rising line, B_crit = 2.1e8 tokens times L^-4.8, with noise scale measurements in green"></div>
</div>

<p class="footnote">Kaplan et al. 2020 · Eq. 1.4, 5.3, Fig. 10. Depends on the loss, "not directly on the model size". 1 to 2M tokens for the largest models</p>

Note:
Each hyperbola in Figure 18 gives one critical batch size, at one loss. Put them against the loss: the 3M and the 85M models follow the same line. So the critical batch depends on how good the model is, not on its size. As the loss falls, gradients get noisier relative to their signal, and you can usefully average over a bigger batch: it doubles for every 13% drop in loss. The green dots are the gradient noise scale, a cheaper estimate that roughly agrees.
Why this matters: every size run used one fixed batch, half a million tokens, which is too big early in training and too small late. Next slide: how the paper corrects for that.

---

<p class="eyebrow"><span class="paper">Kaplan et al. 2020</span> · §5.1 · Eq. 5.4, 5.5</p>

## How do they correct for the fixed batch?

<div class="rows">
<div class="eq">$$S_{\min} = \frac{S}{1 + B_{\rm crit}(L)/B}, \qquad C_{\min} = \frac{C}{1 + B/B_{\rm crit}(L)}$$</div>
<div class="fig"><img src="img/week-06-kaplan-correction.svg" alt="Two panels. Left, an illustration on the axes of the last slides: the size run's grey line at B = 2 to the 19 tokens meets the hyperbola for loss 4 at a dot, the logged S steps and E tokens. Arrows read the conversion off the axes: steps divided by 1.5 to S_min, tokens divided by 3.0 to E_min. Right: the two divisors against the loss reached, from 6 down to 2.5. The compute divisor, 1 + B / B_crit, falls from about 15; the steps divisor, 1 + B_crit / B, rises from about 1; they cross at 2 where B_crit = B, at loss 3.45. Losses below 3 are shaded: the fit is extrapolated there"></div>
<p class="plain">Each logged point slides along its loss's curve. Early: compute ÷ 15, steps ÷ 1.07; they cross at loss 3.45.</p>
</div>

<p class="footnote">Kaplan et al. 2020 · §5.1. $B = 2^{19}$ tokens, the size runs' batch; $B_{\rm crit}(L) = 2\times10^8\,L^{-4.8}$, measured down to loss about 3. $C = 6NE$, so $C_{\min} = 6NE_{\min}$. Used for the compute frontier, the $L(N, S)$ fit and $N_{\rm opt}$, not for $L(N)$ or transfer. Why not train at $B_{\rm crit}$? It is "a moving target" (§6). Figure and divisors ours</p>

Note:
Every size run used one batch, half a million tokens, so its step counts and compute are not the most efficient possible. The paper converts every logged point of every learning curve.
Left, on the axes of the last slides. The size run is one grey line. At the moment it reaches a loss of 4 it has taken S steps and seen E tokens: the dot. That dot lies on the hyperbola for loss 4. Converting means sliding to the two ends of that hyperbola. S_min is the steps the same loss would take at a huge batch: here S divided by 1.5. E_min is the tokens it would take at a tiny batch: here E divided by 3. Compute is 6 N times the tokens, so C_min is C divided by 3. Both divisors come from the critical batch at that loss.
Right, how the correction changes as training goes on. The critical batch grows as the loss falls, but the size runs' batch stays at about 524 thousand tokens. At loss 6 the critical batch is only 37 thousand tokens: the run's batch is 14 times too big, so it used 15 times the compute it needed, while its steps are only 7 percent above the minimum. At loss 5: compute divided by 6.9, steps by 1.17. At loss 4: 3.0 and 1.49. Near loss 3.45 the fixed batch happens to equal the critical batch, and both divisors are 2. Past that the roles swap: at loss 3 the steps are divided by 3.0 and compute by 1.5; at 2.5, by 5.7 and 1.2. The critical batch was only measured down to a loss of about 3, so the shaded end is an extrapolation.
Where it is used: the compute frontier, the learning-curve fit on the next slide, and the allocation result use the converted numbers. The size law and the transfer plots use final losses, with no conversion; the data runs are separate.
Why not just train at the critical batch? Because it changes as the loss falls: "a moving target", in the paper's words.

---

<p class="eyebrow"><span class="paper">Kaplan et al. 2020</span> · §5.2 · the size runs · Eq. 1.6, Fig. 4 right</p>

## Does one equation fit every learning curve?

<div class="cols wide-fig">
<div class="text">

<div class="eq">$$L(N,S) = \Big(\frac{N_c}{N}\Big)^{\alpha_N} + \Big(\frac{S_c}{S_{\min}}\Big)^{\alpha_S}$$</div>

<dl class="where card">
<dt>Runs</dt><dd>the size runs, after warmup</dd>
<dt>Each line</dt><dd>one model's test loss, solid; the fit, dashed; colour: size</dd>
<dt>Axes</dt><dd>$S_{\min}$, steps converted to a large batch (log); test loss</dd>
</dl>

<p class="plain">One equation with four constants tracks every size: "imperfect", but close after the start.</p>

</div>
<div class="fig"><img src="img/week-06-kaplan-fig4-right.png" alt="Kaplan et al. Figure 4 right: loss against estimated S_min for models of many sizes, measured curves with the fitted equation dashed, close for all sizes after the start"></div>
</div>

<p class="footnote">Kaplan et al. 2020 · §5.2, Eq. 1.6, Table 3 ($\alpha_N = 0.077$, $\alpha_S = 0.76$, $N_c = 6.5\times10^{13}$, $S_c = 2.1\times10^3$), Fig. 4 right: "the fits are imperfect"</p>

Note:
Now the paper's model of a whole training curve. The loss is a floor set by the model's size, the first term, plus a term that falls as a power law in steps, with exponent 0.76. The steps are S_min, the converted steps from the last slide.
The test: the size runs' learning curves after warmup, solid, against this one equation with four constants, dashed. It tracks all sizes reasonably well after the start. The authors' own word is "imperfect". This equation is what section 6 optimises.

---

<p class="eyebrow"><span class="paper">Kaplan et al. 2020</span> · §5.2 · from the fit · Eq. 1.6</p>

## A power law in steps, on top of a floor

<div class="cols wide-fig">
<div class="text">

- First term: the floor set by size.
- Second: still training, falling as $S_{\min}^{-0.76}$.
- Subtract each model's floor: one straight line for all.
- Fits only after the warmup.

</div>
<div class="fig"><img src="img/week-06-kaplan-learning-curve.svg" alt="Illustration from Kaplan's Eq. 1.6: left, loss against steps for models of 1M, 10M, 100M and 1B parameters, each flattening to its own floor; right, loss minus the floor against steps on log axes, the same straight line of slope -0.76 for every size"></div>
</div>

<p class="footnote">Kaplan et al. 2020 · Eq. 1.6 with Table 3 constants. Illustration drawn from the equation, not from runs</p>

Note:
Optional. What the equation says, drawn from it with the paper's constants. Left: each model's curve flattens to its own floor. Right: subtract the floor and every size falls on the same straight line of slope minus 0.76. So a training curve is not a pure power law; it is a power law sitting on top of a constant.

---

<p class="eyebrow"><span class="paper">Kaplan et al. 2020</span> · §5.2 · the size runs · Fig. 11</p>

## Fixed compute or fixed steps: which size wins?

<div class="cols wide-fig">
<div class="text">

<dl class="where card">
<dt>Runs</dt><dd>the size runs, read at a fixed budget</dd>
<dt>Top</dt><dd>each line: one compute budget; each point: one model's loss at that budget</dd>
<dt>Bottom</dt><dd>each line: one number of steps</dd>
<dt>Axes</dt><dd>non-embedding parameters (log); test loss; dotted: the fit</dd>
</dl>

<p class="plain">Fixed compute: one best size. Fixed steps: bigger is always better.</p>


</div>
<div class="fig"><img src="img/week-06-kaplan-fig11.png" alt="Kaplan et al. Figure 11: top, loss against parameters at fixed compute budgets, each with a minimum at an intermediate size; bottom, loss against parameters at fixed numbers of steps, decreasing with size"></div>
</div>

<p class="footnote">Kaplan et al. 2020 · §5.2, Fig. 11 (left and right, stacked). Points: the size runs; dotted: Eq. 1.6 with the $C_{\min}$, $S_{\min}$ conversion</p>

Note:
Two ways to slice the size runs' learning curves, 768 to 1.5 billion parameters. Pick a compute budget, find where each model's curve is at that compute, and plot those losses against size: the top panel. Pick a number of steps instead: the bottom panel. The next slides take each panel in turn.

---

<p class="eyebrow"><span class="paper">Kaplan et al. 2020</span> · §5.2 · the size runs · Fig. 11, left</p>

## At a fixed budget, which size is best?

<div class="cols wide-fig">
<div class="text">

<dl class="where card">
<dt>Each line</dt><dd>one compute budget (colour, PF-days)</dd>
<dt>Each point</dt><dd>one model's loss after spending that budget</dd>
<dt>Axes</dt><dd>non-embedding parameters (log); test loss</dd>
</dl>

<p class="plain">A U: too small runs out of capacity, too big runs out of steps. The bottom moves right as the budget grows.</p>

</div>
<div class="fig"><img src="img/week-06-kaplan-fig11-compute.png" alt="Kaplan et al. Figure 11 left: test loss against non-embedding parameters at fixed compute budgets, each a U-shaped curve whose minimum moves to larger models as the budget grows"></div>
</div>

<p class="footnote">Kaplan et al. 2020 · Fig. 11 left: "Each value of compute budget has an associated optimal model size". The same U Chinchilla's IsoFLOP curves measure two years later</p>

Note:
Fixed compute. Every curve is one budget; along it, smaller models train for more steps and bigger ones for fewer. Each curve has a minimum: too small and the model runs out of capacity; too big and it runs out of steps. The minimum moves to bigger models as the budget grows, and where exactly it sits is what Kaplan and Chinchilla disagree on.

---

<p class="eyebrow"><span class="paper">Kaplan et al. 2020</span> · §5.2 · the size runs · Fig. 11, right</p>

## At a fixed number of steps?

<div class="cols wide-fig">
<div class="text">

<dl class="where card">
<dt>Each line</dt><dd>one number of steps (colour)</dd>
<dt>Each point</dt><dd>one model's loss after that many steps</dd>
<dt>Axes</dt><dd>non-embedding parameters (log); test loss</dd>
</dl>

<p class="plain">No U: after the same number of steps a bigger model is always better, because it also spent more.</p>

</div>
<div class="fig"><img src="img/week-06-kaplan-fig11-steps.png" alt="Kaplan et al. Figure 11 right: test loss against non-embedding parameters at fixed numbers of steps; every line falls steadily with size"></div>
</div>

<p class="footnote">Kaplan et al. 2020 · Fig. 11 right. Mediocre fits at small $S$: the power law breaks down very early in training</p>

Note:
Fixed steps. Now there is no minimum: after the same number of steps, a bigger model is always lower. That's not a contradiction; at the same steps, the bigger model has used more compute. Which slicing matters depends on what you're short of: compute, or wall-clock time.

---

<p class="eyebrow"><span class="paper">Kaplan et al. 2020</span> · §6 · the size runs, re-read · Fig. 13</p>

## Does the batch correction change the compute law?

<div class="cols wide-fig">
<div class="text">

<dl class="where card">
<dt>Runs</dt><dd>the size runs' learning curves</dd>
<dt>Black</dt><dd>the frontier, the lowest loss at each compute: raw, and converted to $C_{\min}$</dd>
<dt>Dashed</dt><dd>orange: fit on raw $C$; blue: fit on $C_{\min}$</dd>
<dt>Axes</dt><dd>compute in PF-days (log); test loss (log)</dd>
</dl>

<p class="plain">A slightly gentler slope after correction: 0.057 raw, 0.050 on $C_{\min}$.</p>

</div>
<div class="fig"><img src="img/week-06-kaplan-fig13.png" alt="Kaplan et al. Figure 13: test loss against compute, the raw frontier at fixed batch and the frontier adjusted to C_min, with fits L = (C / 2.0e7)^-0.057 and L = (C_min / 2.3e8)^-0.050"></div>
</div>

<p class="footnote">Kaplan et al. 2020 · §6.1, Fig. 13: "It is the $L(C_{\min})$ trend that we expect to provide a reliable extrapolation". The lump near $10^{-5}$ PF-days: the switch from 1-layer to 2-layer models</p>

Note:
Section 6 returns to the compute frontier of Figure 1, now with the batch correction in hand. Two black frontiers from the size runs, 768 to 1.5 billion parameters: on the compute actually spent at the fixed batch, and on C_min. Their fits differ a little, 0.057 and 0.050. The authors trust the corrected one for extrapolation; later papers sometimes quote the raw 0.057, a small source of confusion in the literature.

---

<p class="eyebrow"><span class="paper">Kaplan et al. 2020</span> · §6.1 · the size runs and the batch runs · Fig. 14</p>

## How big should the model be for a budget?

<div class="cols wide-fig">
<div class="text">

<dl class="where card">
<dt>Runs</dt><dd>the size runs, converted with the batch runs' $B_{\rm crit}$</dd>
<dt>Top</dt><dd>each point: the best model size at one compute budget</dd>
<dt>Bottom</dt><dd>each point: that model's steps at that budget</dd>
<dt>Axes</dt><dd>compute in PF-days (log); parameters (log), or steps</dd>
</dl>

<p class="plain">$N_{\rm opt} \propto C_{\min}^{0.73}$; steps hardly grow. 10x compute: 5x the model, 2x the data.</p>


</div>
<div class="fig"><img src="img/week-06-kaplan-fig14.png" alt="Kaplan et al. Figure 14: top, compute-efficient model size against compute, N = 1.3e9 C_min^0.73 (adjusted) and N = 1.6e9 C^0.88 (fixed batch); bottom, steps against compute, S_min = 5.4e3 C_min^0.03, nearly flat, against fixed-batch steps that rise"></div>
</div>

<p class="footnote">Kaplan et al. 2020 · §6.1, Eq. 6.1, Fig. 14 (left and right, stacked), its caption: "increasing by 5x for each 10x increase in compute"</p>

Note:
The headline result. For every compute budget, find the model size whose curve is lowest at that budget: that's one point in the top panel. Those points fall on a line: the best size grows as C_min to the 0.73. The bottom panel shows the steps that best model takes: nearly flat.
In words, from the caption: for every 10x of compute, about 5x into the model and only 2x into data. Hold on to how it was measured: these points are checkpoints read partway through the long runs with one fixed schedule. That is the step Chinchilla attacks. The next slides take each panel in turn.

---

<p class="eyebrow"><span class="paper">Kaplan et al. 2020</span> · §6.1 · Fig. 14, left</p>

## How fast does the best size grow?

<div class="cols wide-fig">
<div class="text">

<dl class="where card">
<dt>Each point</dt><dd>the size with the lowest loss at one compute budget</dd>
<dt>Blue</dt><dd>budgets in $C_{\min}$: fit $N = 1.3\times10^9\,C_{\min}^{0.73}$</dd>
<dt>Orange</dt><dd>budgets in raw $C$ at the fixed batch: fit $N = 1.6\times10^9\,C^{0.88}$</dd>
<dt>Axes</dt><dd>compute in PF-days (log); non-embedding parameters (log)</dd>
</dl>

<p class="plain">Kaplan's exponent is 0.73, in non-embedding $N$ and $C_{\min}$. On raw compute it is 0.88.</p>

</div>
<div class="fig"><img src="img/week-06-kaplan-fig14-size.png" alt="Kaplan et al. Figure 14 left: compute-efficient model size against compute; blue points and fit N = 1.3e9 C_min^0.73, orange points and fit N = 1.6e9 C^0.88"></div>
</div>

<p class="footnote">Kaplan et al. 2020 · Fig. 14 left; the 0.88 appears only in its legend. Both come up again in later work (last slide)</p>

Note:
The left panel. The same best-size points on two compute axes. On C_min, blue, the slope is 0.73: that's "Kaplan's exponent". On the raw compute at the fixed batch, orange, it's 0.88, printed only in the legend. Both numbers come back when later papers try to explain why Chinchilla got 0.5.

---

<p class="eyebrow"><span class="paper">Kaplan et al. 2020</span> · §6.1 · Fig. 14, right</p>

## Do the best runs take more steps?

<div class="cols wide-fig">
<div class="text">

<dl class="where card">
<dt>Each point</dt><dd>the best model's step count at one compute budget</dd>
<dt>Blue</dt><dd>$S_{\min}$, converted: fit $5.4\times10^3\,C_{\min}^{0.03}$</dd>
<dt>Orange</dt><dd>$S$, the steps actually taken at the fixed batch</dd>
<dt>Axes</dt><dd>compute in PF-days (log); steps</dd>
</dl>

<p class="plain">Almost no: the extra data goes into bigger batches, not more steps.</p>

</div>
<div class="fig"><img src="img/week-06-kaplan-fig14-steps.png" alt="Kaplan et al. Figure 14 right: steps against compute; blue S_min points nearly flat around 3,000 to 5,000 with fit 5.4e3 C_min^0.03; orange fixed-batch steps rising to over 15,000"></div>
</div>

<p class="footnote">Kaplan et al. 2020 · Fig. 14 right, §6.1: "the measured exponent is sufficiently small that our results may even be consistent with an exponent of zero"</p>

Note:
The right panel. In converted steps, blue, the best runs take about the same number of steps at every budget, a few thousand: exponent 0.03, perhaps zero. So the data that does grow, about 2x per 10x compute, goes into bigger batches, since the critical batch grows as the loss falls. The orange fixed-batch steps do rise, which is one more reason the conversion matters.

---

<p class="eyebrow"><span class="paper">Kaplan et al. 2020</span> · §1.1 · from the fits · Fig. 3</p>

## Where does a billion times the compute go?

<div class="cols wide-fig">
<div class="text">

- Model size: over 1,000,000x.
- Batch: about 100x.
- Serial steps: under 10x.
- Data = batch × steps: only a few hundred times.

<p class="plain">Mostly into the model.</p>

</div>
<div class="fig"><img src="img/week-06-kaplan-allocation.png" alt="Kaplan et al. Figure 3: over a billion-fold increase in compute, more than a million-fold goes into model size, about 100-fold into batch size and less than 10-fold into serial steps"></div>
</div>

<p class="footnote">Kaplan et al. 2020 · Fig. 3, drawn from the fitted exponents, not new runs. Data grows as $C^{0.27}$</p>

Note:
The same allocation drawn as shares of a billion-fold increase in compute: more than a million-fold into the size, about a hundred-fold into the batch, under ten-fold into steps. This figure is not data; it's the fitted exponents drawn out.

---

<p class="eyebrow"><span class="paper">Kaplan et al. 2020</span> · §6.1 · Table 6 · our arithmetic</p>

## What does 100x more compute buy, Kaplan's way?

<div class="cols">
<div class="text">

- Parameters: $100^{0.73} \approx 29$x.
- Batch: $100^{0.24} \approx 3$x.
- Steps: $100^{0.03} \approx 1.15$x.
- Tokens: $100^{0.27} \approx 3.5$x.

<p class="plain">Labs then grew models while staying near 300B training tokens.</p>

</div>
<div class="fig"><img src="img/week-06-kaplan-100x.svg" alt="Illustration: growth for 100x compute under Kaplan's exponents: parameters 28.8x, batch 3.0x, steps 1.1x, tokens 3.5x"></div>
</div>

<p class="footnote">Kaplan et al. 2020 · Table 6 exponents; illustration, our arithmetic. The token exponent is for compute-efficient training, not the overfitting rule of §4</p>

Note:
Optional. Make it concrete. A hundred times more compute, under Kaplan's exponents: about 29 times the parameters, 3 times the batch, barely more steps, and only 3.5 times the tokens.
This is what people mean when they say Kaplan's laws favour bigger models over more data. It's visible in the models of 2020 to 2021: GPT-3, Gopher, MT-NLG all grew in size while staying near 300 billion training tokens. Chinchilla's first table lists them.

---

<p class="eyebrow"><span class="paper">Kaplan et al. 2020</span> · §6.2 · from the fit</p>

## Why does the best model stop early, in theory?

<div class="cols">
<div class="text">

<div class="eq">$$\min_{N,\thinspace S}\ L(N,S) \quad \text{subject to}\quad 6NBS = C$$</div>

<div class="eq">$$L = \underbrace{\Big(\frac{N_c}{N}\Big)^{\alpha_N}}_{\text{capacity}} + \underbrace{\Big(\frac{S_c}{S}\Big)^{\alpha_S}}_{\text{still training}}$$</div>

</div>
<div class="text">

- A bigger $N$ lowers the capacity term.
- At fixed $C$ it leaves fewer steps, so the training term rises.
- The best $N$ is where the two balance.

<p class="plain">The batch follows $B_{\rm crit}(L)$, so it grows as the loss falls.</p>

</div>
</div>

<p class="footnote">Kaplan et al. 2020 · §6.2, App. B, Eq. 1.6 to 1.8. With $S = C/(6NB)$: $L = (N_c/N)^{\alpha_N} + (6NBS_c/C)^{\alpha_S}$</p>

Note:
Section 6.2 derives the same answer from the learning-curve equation instead of reading it off the runs. Fix the compute. Choose the model size and steps to minimise the loss: a capacity term that falls with N plus a still-training term that falls with steps.
The tension: at fixed compute, a bigger model leaves fewer steps. Substitute S equals C over 6NB and the training term grows with N. So the capacity term pushes N up, the training term pushes it down, and the optimum is where their marginal effects balance. The batch isn't free either: training at the critical batch means B grows as the loss falls.

---

<p class="eyebrow"><span class="paper">Kaplan et al. 2020</span> · §6.2 · from the fit · App. B</p>

## Where is the balance?

<div class="cols">
<div class="text math-block">

Call the two terms $A$ (capacity) and $T$ (training). At fixed $B$:

<div class="eq">$$\frac{\partial L}{\partial N} = -\frac{\alpha_N}{N}A + \frac{\alpha_S}{N}T = 0$$</div>

<div class="eq">$$\Rightarrow\quad T = \frac{\alpha_N}{\alpha_S}\thinspace A \approx \frac{0.076}{0.76}\thinspace A = 0.10\thinspace A$$</div>

<div class="eq">$$\Rightarrow\quad L_{\rm opt} \approx 1.10\thinspace L(N,\infty)$$</div>

</div>
<div class="text">

<p class="plain">In words: stop about 10% above the model's converged loss.</p>
<p class="plain">So for a fixed budget: train a bigger model, and stop early.</p>

</div>
</div>

<p class="footnote">Kaplan et al. 2020 · App. B: train "to a fixed percentage $\alpha_N/\alpha_S \approx 10\%$ above the converged loss". We hold $B$ fixed for simplicity; App. B keeps $B(L)$, and the extra term drops out at the optimum</p>

Note:
Set the derivative with respect to N to zero. Because each term is a power of N, the derivative of each is its exponent times itself over N. The capacity term contributes minus alpha_N A over N; the training term, at fixed compute, contributes plus alpha_S T over N. Setting the sum to zero gives T equals alpha_N over alpha_S times A.
With the fitted exponents that's 0.076 over 0.76, a tenth. So at the optimum, the still-training part of the loss is 10% of the capacity part: the model is stopped about 10% above the loss it would converge to.
That's the paper's most practical claim: for a fixed budget, a bigger model stopped early beats a smaller one trained to convergence. It follows from the fitted equation; it isn't a separate experiment.

---

<p class="eyebrow"><span class="paper">Kaplan et al. 2020</span> · §6.1, App. B.4 · from the fit · Fig. 12</p>

## How much does a wrong size cost?

<div class="cols wide-fig">
<div class="text">

<dl class="where card">
<dt>Source</dt><dd>no runs: computed from the $L(N, S)$ fit</dd>
<dt>Top</dt><dd>extra compute to reach the same loss with a model $N/N_{\rm efficient}$ times the best size</dd>
<dt>Bottom</dt><dd>the steps that model needs, relative to the best</dd>
</dl>

<p class="plain">The optimum is flat: 0.6x to 2.2x the best size costs at most 20% more compute.</p>


</div>
<div class="fig"><img src="img/week-06-kaplan-fig12.png" alt="Kaplan et al. Figure 12: top, extra compute needed against model size relative to the optimum, small between about 0.6x and 2.2x; bottom, the steps needed, fewer for larger-than-optimal models"></div>
</div>

<p class="footnote">Kaplan et al. 2020 · App. B.3, B.4, Fig. 12: "should not be trusted for very large models", valid only in the power-law region of the learning curve</p>

Note:
How sharp is the optimum? Figure 12 is drawn from the fitted equation, no new runs. The top panel: if you train a model some multiple of the best size, how much more compute do you need to reach the same loss? The bottom: how many steps it needs.
Appendix B also puts numbers on early stopping: against training to 2% above the converged loss, the compute-efficient recipe uses about 2.7 times the parameters, 7.7 times fewer steps, and 65% less compute for the same loss. The next slides take each panel in turn.

---

<p class="eyebrow"><span class="paper">Kaplan et al. 2020</span> · App. B.4 · from the fit · Fig. 12, left</p>

## How much extra compute does a wrong size need?

<div class="cols wide-fig">
<div class="text">

<dl class="where card">
<dt>Curve</dt><dd>from the $L(N, S)$ fit, not runs</dd>
<dt>Axes</dt><dd>model size over the best size (log); compute over the best compute</dd>
</dl>

<p class="plain">A flat bottom: anywhere from 0.6x to 2.2x the best size needs under 20% more compute.</p>

</div>
<div class="fig"><img src="img/week-06-kaplan-fig12-compute.png" alt="Kaplan et al. Figure 12 left: excess compute against deviation from the optimal model size; a U with its minimum of 1 at the optimal size, under 1.2 between 0.6x and 2.2x"></div>
</div>

<p class="footnote">Kaplan et al. 2020 · Fig. 12 left: "Models between 0.6x and 2.2x the optimal size can be trained with a 20% larger compute budget"</p>

Note:
Left panel. The U is flat at the bottom: being off by a factor of two either way costs less than 20% extra compute. That flatness matters later. It's one reason two very different prescriptions, Kaplan's and Chinchilla's, could both look reasonable on small-scale data.

---

<p class="eyebrow"><span class="paper">Kaplan et al. 2020</span> · App. B.4 · from the fit · Fig. 12, right</p>

## And how many steps does it take?

<div class="cols wide-fig">
<div class="text">

<dl class="where card">
<dt>Curve</dt><dd>from the $L(N, S)$ fit, not runs</dd>
<dt>Axes</dt><dd>model size over the best size (log); steps over the best model's steps (log)</dd>
</dl>

<p class="plain">Bigger than best needs fewer steps: faster, if you have the parallel hardware.</p>

</div>
<div class="fig"><img src="img/week-06-kaplan-fig12-steps.png" alt="Kaplan et al. Figure 12 right: excess steps against deviation from the optimal model size; falling steadily, smaller models need more steps and larger ones fewer, dashed where the framework does not capture early training"></div>
</div>

<p class="footnote">Kaplan et al. 2020 · Fig. 12 right. Dashed: "Our framework does not capture early training dynamics"</p>

Note:
Right panel. A model bigger than the best size reaches the same loss in fewer steps. So if wall-clock time matters more than compute, and you have the hardware to run a big model in parallel, it can pay to go bigger than optimal. The dashed end is where the equation stops being trustworthy.

---

<p class="eyebrow"><span class="paper">Kaplan et al. 2020</span> · §1.2, §6.2 · from the fits · Eq. 1.7, 1.8</p>

## How fast should each knob grow?

<div class="cols">
<div class="text math-block">

At the optimum $L \propto N^{-\alpha_N}$, so

<div class="eq">$$B \propto L^{-1/\alpha_B} \propto N^{\alpha_N/\alpha_B}, \qquad S \propto N^{\alpha_N/\alpha_S}$$</div>

<div class="eq">$$C \propto NBS \propto N^{1 + \alpha_N/\alpha_B + \alpha_N/\alpha_S}$$</div>

<div class="eq">$$\Rightarrow\ N_{\rm opt} \propto C^{\alpha_C/\alpha_N},\quad \alpha_C = \Big(\frac{1}{\alpha_N} + \frac{1}{\alpha_B} + \frac{1}{\alpha_S}\Big)^{-1}$$</div>

</div>
<div class="text">

- $\alpha_C \approx 0.05$.
- Predicted: $N \propto C^{0.71}$.
- Measured (Fig. 14): $N \propto C^{0.73}$.

<p class="plain">Three measured exponents predict a fourth.</p>

</div>
</div>

<p class="footnote">Kaplan et al. 2020 · Eq. 1.7, 1.8, 6.4, 6.5. The paper prints $\alpha_C$ as 0.054 (Eq. 6.4) and 0.052 (App. B); with 0.054 it gets $C^{0.71}$</p>

Note:
How the allocation exponents follow. At the optimum the loss scales like the capacity term, N to the minus alpha_N. The batch tracks the critical batch, which goes as L to the minus 1 over alpha_B, so B grows as N to the alpha_N over alpha_B. The balance condition makes the steps grow as N to the alpha_N over alpha_S.
Multiply: compute goes as N to the power 1 plus alpha_N over alpha_B plus alpha_N over alpha_S. Invert it and the optimal size goes as C to the alpha_C over alpha_N.
With the fitted values, alpha_C is about 0.05, matching the measured compute law, and the size exponent comes out about 0.71, close to the 0.73 read directly off the runs in Figure 14. That's the satisfying part: exponents for capacity, training and batch predict the compute exponent and the allocation.

---

<p class="eyebrow"><span class="paper">Kaplan et al. 2020</span> · §6.3 · from the fits · Fig. 15</p>

## Where do the laws break?

<div class="cols wide-fig">
<div class="text">

<dl class="where card">
<dt>Black</dt><dd>the measured compute frontier (the size runs)</dd>
<dt>Orange</dt><dd>$L(C_{\min})$, extrapolated</dd>
<dt>Red</dt><dd>$L(D(C))$: the data law, with data grown as compute-efficient training grows it</dd>
<dt>Axes</dt><dd>compute in PF-days (log); test loss (log)</dd>
</dl>

<p class="plain">The two lines cross near $10^4$ PF-days: past that, the laws contradict each other.</p>

</div>
<div class="fig"><img src="img/week-06-kaplan-contradiction.png" alt="Kaplan et al. Figure 15: test loss against compute; the measured frontier in black, the compute law extrapolated in orange, the data-limited law in red; the orange line falls faster and crosses the red near 10^4 PF-days"></div>
</div>

<p class="footnote">Kaplan et al. 2020 · §6.3, Eq. 6.6 to 6.8, Fig. 15. Crossing at $C^* \sim 10^4$ PF-days, $N^* \sim 10^{12}$, $L^* \sim 1.7$ nats; "highly uncertain", 10x either way</p>

Note:
The paper's own warning. Follow the compute-efficient recipe and the data processed grows only as C to the 0.27. But with that little data, the data law sets a floor on the loss: the red line. The compute law, orange, falls faster. Extrapolate both, and near ten thousand PF-days and a trillion parameters the compute law predicts a loss lower than the data could allow. So the laws must break before that.
The authors conjecture the crossing might be where models have extracted everything reliable from text, and L-star, about 1.7 nats per token, might estimate the entropy of language. They flag the numbers as uncertain by ten times either way. Chinchilla dissolves the contradiction a different way: if data grows as fast as the model, the lines never cross.

---

<p class="eyebrow"><span class="paper">Kaplan et al. 2020</span> · §8 · discussion</p>

## Smooth loss, sudden abilities?

<blockquote>"Smooth quantitative change can mask major qualitative improvements: 'more is different'."</blockquote>

<div class="text">

- Loss is an average over all tokens.
- One ability can change faster than the average.
- This paper measures loss only.

</div>

<p class="footnote">Kaplan et al. 2020 · §8. A remark, not a measured result. Readings 3 and 4 today are about exactly this</p>

Note:
One sentence in the discussion points at the second half of today. Loss is an average over every token in the test set; a model could keep improving smoothly on average while some particular ability changes quickly. The paper doesn't test this; it measures only loss. Wei et al. take it up in 2022, and Schaeffer et al. push back in 2023.

---

<p class="eyebrow"><span class="paper">Kaplan et al. 2020</span> · summary</p>

## What to keep from Kaplan

<div class="cols">
<div class="text">

- Loss is predictable from scale: three power laws, each from its own runs.
- Size, data and training time can each be the bottleneck.
- The joint laws, $L(N,D)$ and $L(N,S)$, relate the variables, not just the slopes.

</div>
<div class="text">

- Trust differs by claim: the power laws held up; the fitted joint laws are useful approximations; the 0.73 allocation did not survive.
- A good fit is not a good optimisation rule.

<p class="plain">Open: why are there power laws at all?</p>

</div>
</div>

<p class="footnote">Kaplan et al. 2020 · App. C: "we do not have a solid theoretical understanding for any of our proposed scaling laws". Next: Chinchilla revises the allocation</p>

Note:
Four things to keep. Loss falls predictably with scale, and each of the three laws comes from its own set of runs. Size, data and training time can each be the bottleneck; scale one without the others and you hit a wall. The joint laws are more useful than the single slopes, because they say how changing one variable changes the effect of another.
And the claims deserve different trust. The power laws themselves held up in later work. The joint equations are useful approximations. The compute allocation, 0.73, did not survive: the next reading revises it. A model of the loss can be good over the measured range and still give a wrong optimisation rule outside it.
The open question Kaplan leaves: why power laws at all?

---

<p class="eyebrow"><span class="paper">Kaplan et al. 2020</span> · later work</p>

## What came after?

<div class="cols wide-fig">
<div class="text">

- **The allocation was revised.** Chinchilla (2022): $N_{\rm opt} \propto C^{0.50}$; 100x compute ▸ 10x the model and 10x the tokens. Reading 2.
- **Why Kaplan got 0.73 and 0.88.** Counting without embeddings, at small sizes (Pearce and Song 2024); the uncounted output layer, warmup and tuning (Porian et al. 2024).
- **Why power laws at all?** Not settled: inherited from the data (Maloney et al. 2022; Michaud et al. 2023), from the learner (Sharma and Kaplan 2020; Bahri et al. 2021; Liu, Liu and Gore 2025), or seen even in data with no power laws (Barkeshli et al. 2026).

</div>
<div class="fig"><img src="img/week-06-compare-100x.svg" alt="Illustration: growth for 100x compute; Kaplan: parameters 28.8x, tokens 3.5x; Chinchilla: parameters 10x, tokens 10x"></div>
</div>

<p class="footnote">Hoffmann et al. 2022, arXiv:2203.15556; Pearce and Song 2024, arXiv:2406.12907; Porian et al. 2024, arXiv:2406.19146; Maloney, Roberts and Sully 2022, arXiv:2210.16859; Michaud et al. 2023, arXiv:2303.13506; Sharma and Kaplan 2020, arXiv:2004.10802; Bahri et al. 2021, arXiv:2102.06701; Liu, Liu and Gore 2025, arXiv:2505.10465; Barkeshli, Alfarano and Gromov 2026, arXiv:2601.10684</p>

Note:
What happened next, briefly; the next reading is the full story.
First, the allocation was revised. Two years later DeepMind asked the same question with runs sized to each budget and found the best model grows as compute to the 0.5, not 0.73. For 100 times the compute: 10 times the parameters and 10 times the tokens, not 29 and 3.5. The picture compares the two.
Second, two 2024 papers explain why Kaplan got his numbers. Pearce and Song show that counting parameters without embeddings, at the small sizes Kaplan mostly trained, bends the exponent toward Kaplan's 0.73 even if Chinchilla's law is true. Porian et al. reproduce an exponent close to Kaplan's, 0.84, and then remove the gap step by step: counting the output layer's compute takes it to 0.71, sizing the warmup to the model to 0.60, and tuning the learning rate, batch and AdamW's beta-2 to Chinchilla's 0.50.
Third, why power laws at all is still open. One camp says the power law is inherited from the data: its covariance spectrum, or the Zipfian frequencies of the skills it contains. Another says it comes from the learner: resolving a data manifold, or superposition. And a 2026 result trains a transformer on random walks over a random graph, data with no power laws in it, and still finds power-law scaling. Each of these papers is worth reading on its own; none is settled.


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

<p class="eyebrow"><span class="paper">Hoffmann et al. 2022 (Chinchilla)</span> · §1 · the question</p>

## Same question, opposite answer?

<div class="cols">
<div class="text">

- Kaplan: $N_{\rm opt} \propto C^{0.73}$, $D_{\rm opt} \propto C^{0.27}$.
- Chinchilla: $N_{\rm opt} \propto C^{0.50}$, $D_{\rm opt} \propto C^{0.50}$.
- 100x compute: 29x the model and 3.5x the tokens, or 10x and 10x.

<p class="plain">The claim is about the balance between size and data, and how it moves with scale.</p>

</div>
<div class="fig"><img src="img/week-06-compare-100x.svg" alt="Illustration: growth for 100x compute; Kaplan: parameters 28.8x, tokens 3.5x; Chinchilla: parameters 10x, tokens 10x"></div>
</div>

<p class="footnote">Hoffmann et al. 2022 · arXiv:2203.15556 · Table 2; Kaplan et al. 2020 Table 6. $N$: parameters; $D$: training tokens; $C$: training compute. Illustration from the exponents, our arithmetic</p>

Note:
Kaplan said: as compute grows, put most of it into parameters. Chinchilla says: grow parameters and training tokens at the same rate. For a hundred times the compute that's ten times the parameters and ten times the tokens, instead of Kaplan's 29 times and 3.5 times.
The point is not that training longer helps; everyone knew that. It's that the compute-optimal balance between size and data changes with scale in a specific way, and that the big models of 2021 had put too much of their compute into parameters.

---

<p class="eyebrow"><span class="paper">Hoffmann et al. 2022 (Chinchilla)</span> · §1 · Table 1</p>

## Why did every big model see about 300B tokens?

<div class="cols wide-fig">
<div class="text">

- From GPT-3 (175B, 2020) to MT-NLG (530B): about 3x the parameters.
- Training tokens stayed near 300B.
- That is Kaplan's rule in practice.

<p class="plain">Chinchilla's bet: Gopher's compute, a quarter of the size, 4.7x the tokens.</p>

</div>
<div class="fig"><img src="img/week-06-chinchilla-models.svg" alt="Illustration of Table 1: parameters against training tokens on log axes. LaMDA 137B on 168B tokens; GPT-3 175B and Jurassic 178B on 300B; Gopher 280B on 300B; MT-NLG 530B on 270B; Chinchilla, a star, 70B on 1.4T, on a dashed line of 20 tokens per parameter"></div>
</div>

<p class="footnote">Hoffmann et al. 2022 · Table 1, drawn as a picture (ours). LaMDA, GPT-3, Jurassic, Gopher, MT-NLG: the large language models of 2020 to 2022</p>

Note:
The state of play in 2022. Following Kaplan, models had grown from GPT-3's 175 billion to MT-NLG's 530 billion parameters, while the training data stayed near 300 billion tokens: the points on the picture sit in a vertical band. The star is the paper's bet: a 70B model on 1.4 trillion tokens, with the same compute as the 280B Gopher. It sits on the dashed line of 20 tokens per parameter, which we'll see come out of the fits.

---

<p class="eyebrow"><span class="paper">Hoffmann et al. 2022 (Chinchilla)</span> · §1 · Eq. 1</p>

## What exactly are they optimising?

<div class="cols">
<div class="text">

<div class="eq">$$(N_{\rm opt}, D_{\rm opt}) = \underset{N,\thinspace D}{\operatorname{argmin}}\ L(N,D) \quad \text{s.t.}\quad \mathrm{FLOPs}(N,D) = C$$</div>

<dl class="where">
<dt>$N$, $D$</dt><dd>parameters, all of them, embeddings included; training tokens</dd>
<dt>$L$, $C$</dt><dd>the final loss; the training budget in FLOPs, $\approx 6ND$</dd>
</dl>

</div>
<div class="text">

- $6N$ per token: a forward pass ($2N$) and a backward pass ($4N$), as in Kaplan.
- Their own careful count is within 10% of $6ND$.

<p class="plain">One budget, many ways to spend it: choose the split.</p>

</div>
</div>

<p class="footnote">Hoffmann et al. 2022 · Eq. 1 (§1), App. F (Table A4: their FLOP count over $6ND$ is 0.99 to 1.10). Unlike Kaplan, $N$ includes the embeddings</p>

Note:
The whole paper is one constrained optimisation. Choose the number of parameters and the number of training tokens to minimise the final loss, subject to the compute being fixed. Compute is about 6 N D, the same per-token cost as Kaplan's 6N.
They also count FLOPs more carefully in an appendix; their count is within 10% of 6ND for their models. And a difference that matters later: Chinchilla counts all parameters, including embeddings.

---

<p class="eyebrow"><span class="paper">Hoffmann et al. 2022 (Chinchilla)</span> · §1 · worked example (ours)</p>

## One budget, four ways to spend it

<div class="cols wide-fig">
<div class="text">

- 100M parameters on 10T tokens: 2.56.
- 1B on 1T: 2.22.
- 10B on 100B: 2.19.
- 100B on 10B: 2.41.

<p class="plain">All cost $6\times10^{21}$ FLOPs. Too small: no capacity. Too big: too few tokens.</p>

</div>
<div class="fig"><img src="img/week-06-chinchilla-one-budget.svg" alt="Illustration from Chinchilla's fitted loss at a fixed budget of 6e21 FLOPs: predicted loss against parameters is U-shaped, 2.56 for 100M on 10T tokens, 2.22 for 1B on 1T, 2.19 for 10B on 100B, 2.41 for 100B on 10B"></div>
</div>

<p class="footnote">Predicted losses from the paper's fitted $L(N,D)$ (Eq. 2, later in the section); illustration and arithmetic ours</p>

Note:
Make the trade-off concrete. Fix a budget of 6 times 10 to the 21 FLOPs. You could train 100 million parameters on 10 trillion tokens, or a billion on a trillion, or 10 billion on 100 billion, or 100 billion on 10 billion: same cost each time.
They aren't equally good. Using the paper's own fitted loss function, which we meet later, the tiny model is capacity-limited, the huge one has barely trained, and the best is in between, around a few billion parameters. And the bottom of this U moves as the budget changes. The paper's job is to find out how.

---

<p class="eyebrow"><span class="paper">Hoffmann et al. 2022 (Chinchilla)</span> · §1 · Fig. 1, a preview</p>

## What does the paper find?

<div class="cols wide-fig">
<div class="text">

<dl class="where card">
<dt>Lines</dt><dd>the best model size at each budget, by each of the paper's three approaches; dashed: Kaplan's</dd>
<dt>Stars</dt><dd>Chinchilla, Gopher, GPT-3, MT-NLG</dd>
<dt>Axes</dt><dd>training FLOPs (log); parameters (log)</dd>
</dl>

<p class="plain">All three approaches are flatter than Kaplan's line: the big models of the day sit above them, too large for their compute.</p>

</div>
<div class="fig"><img src="img/week-06-chinchilla-fig1.png" alt="Hoffmann et al. Figure 1: optimal parameters against FLOPs for Approaches 1, 2 and 3, all flatter than the dashed Kaplan line; Chinchilla 70B sits on the approach lines, Gopher, GPT-3 and MT-NLG near the Kaplan line"></div>
</div>

<p class="footnote">Hoffmann et al. 2022 · Fig. 1, as a preview: each line comes back with the runs behind it</p>

Note:
The paper's opening figure, as a preview. Each solid line is the best model size for each compute budget, estimated three different ways; the dashed line is Kaplan's rule. All three are flatter than Kaplan's, and the large models of the day, the stars for Gopher, GPT-3 and MT-NLG, sit well above them: too big for the compute they were trained with. Chinchilla sits on the lines.
Don't read the details yet. The next slides set up the runs, and then each approach gets its own figure.

---

<p class="eyebrow"><span class="paper">Hoffmann et al. 2022 (Chinchilla)</span> · §3 · what they trained</p>

## What did they train?

<div class="cols wide-fig">
<div class="text">

- Over 400 runs, 70M to over 16B parameters, 5B to 400B+ tokens.
- MassiveText (DeepMind's text corpus); checks on C4 and GitHub.
- Every run under one epoch; the loss shown is training loss.
- Each run's cosine schedule decays 10x by the run's own end (right, top).

<p class="plain">The key change from Kaplan, who read short budgets partway through one long schedule (right, bottom).</p>

</div>
<div class="fig"><img src="img/week-06-chinchilla-schedules.svg" alt="Illustration: learning rate against training tokens. Top, Chinchilla: four cosine schedules of lengths 8B to 128B tokens, each falling to a tenth of its peak at its own end. Bottom, Kaplan: one cosine over 130B tokens, with a point at 10B tokens where the learning rate is still near its peak"></div>
</div>

<p class="footnote">Hoffmann et al. 2022 · abstract, §3, App. D.1. "Over 400" counts runs; Table A9 lists 50 configurations from 44M to 16B. Illustration ours: schedule shapes only</p>

Note:
The experiments. More than 400 training runs, from about 70 million to over 16 billion parameters, on 5 to over 400 billion tokens of MassiveText, DeepMind's corpus, with checks on C4 and GitHub code. No run sees its data more than once, so the training loss is close to a held-out loss, and that is what the plots show.
The design change that matters most: every run gets its own learning-rate schedule, a cosine that decays the rate tenfold by the end of that run. The top of the picture shows four such runs. Kaplan, bottom, trained everything on one long schedule and read the losses for small budgets partway through it, where the learning rate was still high. A run read mid-schedule looks worse than a run planned to stop there.

---

<p class="eyebrow"><span class="paper">Hoffmann et al. 2022 (Chinchilla)</span> · §3, §4, App. B to G · the runs</p>

## Which runs does the paper rely on?

<div class="rows">
<div class="fig"><img src="img/week-06-chinchilla-runs.png" alt="Illustration: seven families of runs with thumbnails of the figures each gives. The fixed-size runs, Approach 1, 70M to 10B with four cosine lengths each: Figs. 2 and A5. The IsoFLOP runs, Approach 2, 9 budgets with sizes up to 16B: Fig. 3. The schedule runs: Fig. A1. The C4 and GitHub runs: Fig. A2. The head-to-head pair at 1e21 FLOPs: Fig. A4. The optimiser runs: Figs. A6 and A7. Chinchilla itself against Gopher: Figs. 5, 6 and 7"></div>
<p class="plain">Two families carry the allocation; the rest are checks, and Chinchilla itself is the test.</p>
</div>

<p class="footnote">Hoffmann et al. 2022 · §3, §4, Apps. B, C, D.4, G. Approach 3 (Fig. 4), Table 3 and Figs. 1 and A3 are fits to the first two families, not new runs</p>

Note:
The whole paper's evidence on one page. The paper names three approaches, but only two of them are runs; the third is an equation fitted to the first two. So here are the families of runs, named by what they are, and each results slide says which one its plot comes from.
The fixed-size runs, Approach 1: a family of models from 70 million to 10 billion parameters, each trained four times with schedules of different lengths. The IsoFLOP runs, Approach 2: nine fixed budgets, many sizes at each. Those two carry the allocation.
The rest are checks: the schedule runs, the C4 and GitHub runs, a head-to-head pair against Kaplan's choice, and the optimiser runs. And Chinchilla itself, against Gopher, is the large-scale test.

---

<p class="eyebrow"><span class="paper">Hoffmann et al. 2022 (Chinchilla)</span> · §3.1 · the fixed-size runs (Approach 1) · Fig. 2</p>

## Which model is best at each budget?

<div class="rows">
<div class="points">
<div class="text">

<dl class="where card">
<dt>Runs</dt><dd>the fixed-size runs: 70M to 10B, each with four cosine lengths spanning 16x</dd>
<dt>Left</dt><dd>each line: one run's training loss; grey: the lowest loss at each budget</dd>
<dt>Centre, right</dt><dd>each grey dot: the size and tokens of that lowest run</dd>
</dl>

</div>
<div class="text">

<p class="plain">The best size and its tokens both grow as $C^{0.50}$. At Gopher's budget: 67B on 1.5T.</p>

</div>
</div>
<div class="fig"><img src="img/week-06-chinchilla-approach1-fig2.png" alt="Hoffmann et al. Figure 2: left, training loss against FLOPs for models from 75M to 10B with the lower envelope in grey; middle and right, parameters and tokens at the envelope against FLOPs, straight lines projecting 67B parameters and 1.5T tokens at Gopher's budget"></div>
</div>

<p class="footnote">Hoffmann et al. 2022 · §3.1, App. D.1, Fig. 2. Gopher's budget: $5.76\times10^{23}$ FLOPs</p>

Note:
Approach 1, the fixed-size runs. Take a family of models from 70 million to 10 billion parameters, and train each four times, with cosine schedules whose lengths span a factor of 16. Every run is a training curve: the left panel shows them all against compute. At each compute value, the grey points mark the lowest loss any run reached. The centre and right panels take those lowest runs and plot their size and their tokens against compute. Both grow as compute to the 0.50. The next slides take each panel in turn.

---

<p class="eyebrow"><span class="paper">Hoffmann et al. 2022 (Chinchilla)</span> · §3.1 · the fixed-size runs · Fig. 2, left</p>

## Which run is lowest at each budget?

<div class="cols wide-fig">
<div class="text">

<dl class="where card">
<dt>Each line</dt><dd>one run's training loss (colour: model size, 75M to 10B)</dd>
<dt>Grey</dt><dd>the envelope: at each of 1,500 FLOP values, the lowest loss of any run</dd>
<dt>Axes</dt><dd>training FLOPs (log); training loss (log)</dd>
</dl>

<p class="plain">Small models lead at small budgets; bigger ones take over as the budget grows.</p>

</div>
<div class="fig"><img src="img/week-06-chinchilla-fig2-loss.png" alt="Hoffmann et al. Figure 2 left: training loss against FLOPs for models from 75M to 10B parameters, coloured by size, with grey points along the lower envelope"></div>
</div>

<p class="footnote">Hoffmann et al. 2022 · §3.1, Fig. 2 left. Curves smoothed (Gaussian, 10 steps) and interpolated. Every envelope point lies in the last 15% of its run</p>

Note:
The left panel. Every line is one run, coloured by model size. A small model improves fast but soon hits its capacity; a big one is wasteful at small budgets but wins once there's enough compute. At each of 1,500 compute values, the grey point is the lowest loss of any run there: the envelope.
One detail that matters for the disagreement with Kaplan: every point on the envelope comes from the last 15% of its run, where its schedule has decayed. The envelope is made of runs that were planned to stop near there.

---

<p class="eyebrow"><span class="paper">Hoffmann et al. 2022 (Chinchilla)</span> · §3.1 · the fixed-size runs · Fig. 2, centre</p>

## How big is the best model at each budget?

<div class="cols wide-fig">
<div class="text">

<dl class="where card">
<dt>Each dot</dt><dd>the size of the run on the envelope, at one FLOP value</dd>
<dt>Red</dt><dd>a power-law fit, $N_{\rm opt} \propto C^{a}$</dd>
<dt>Teal</dt><dd>the fit read at Gopher's budget</dd>
<dt>Axes</dt><dd>training FLOPs (log); parameters (log)</dd>
</dl>

<p class="plain">$a = 0.50$; at Gopher's budget, 67B, not 280B.</p>

</div>
<div class="fig"><img src="img/week-06-chinchilla-fig2-params.png" alt="Hoffmann et al. Figure 2 centre: parameters of the envelope runs against FLOPs, with a straight power-law fit reaching 67B at Gopher's budget"></div>
</div>

<p class="footnote">Hoffmann et al. 2022 · Fig. 2 centre, Table 2</p>

Note:
The centre panel. Each grey dot is the size of the winning run at one compute value. On log axes they lie along a straight line: the best size grows as compute to the 0.50. Extend the line to Gopher's budget and it says 67 billion parameters, a quarter of Gopher's 280.

---

<p class="eyebrow"><span class="paper">Hoffmann et al. 2022 (Chinchilla)</span> · §3.1 · the fixed-size runs · Fig. 2, right</p>

## How many tokens does it see?

<div class="cols wide-fig">
<div class="text">

<dl class="where card">
<dt>Each dot</dt><dd>the tokens of the run on the envelope, at one FLOP value</dd>
<dt>Red</dt><dd>a power-law fit, $D_{\rm opt} \propto C^{b}$</dd>
<dt>Axes</dt><dd>training FLOPs (log); tokens (log)</dd>
</dl>

<p class="plain">$b = 0.50$; at Gopher's budget, 1.5T tokens, not 300B.</p>

</div>
<div class="fig"><img src="img/week-06-chinchilla-fig2-tokens.png" alt="Hoffmann et al. Figure 2 right: training tokens of the envelope runs against FLOPs, with a straight power-law fit reaching 1.5T at Gopher's budget"></div>
</div>

<p class="footnote">Hoffmann et al. 2022 · Fig. 2 right, Table 2. Since $C \approx 6ND$, $a + b = 1$</p>

Note:
The right panel: the tokens of the same winning runs. Also a straight line, also 0.50. The two exponents must add to one, since compute is about 6 times N times D. At Gopher's budget: 1.5 trillion tokens, five times what Gopher saw.

---

<p class="eyebrow"><span class="paper">Hoffmann et al. 2022 (Chinchilla)</span> · §3.2 · the IsoFLOP runs (Approach 2) · Fig. 3</p>

## At a fixed budget, is there a best size?

<div class="rows">
<div class="points">
<div class="text">

<dl class="where card">
<dt>Runs</dt><dd>the IsoFLOP runs: 9 budgets, $6\times10^{18}$ to $3\times10^{21}$ FLOPs; many sizes at each, up to 16B</dd>
<dt>Left</dt><dd>each curve: one budget; each dot: one run's final loss; dashed: a parabola</dd>
<dt>Centre, right</dt><dd>each dot: the bottom of one valley</dd>
</dl>

</div>
<div class="text">

<p class="plain">Every budget has a clear best size. $N_{\rm opt} \propto C^{0.49}$, $D_{\rm opt} \propto C^{0.51}$; at Gopher's budget, 63B on 1.4T.</p>

</div>
</div>
<div class="fig"><img src="img/week-06-chinchilla-isoflop.png" alt="Hoffmann et al. Figure 3: left, final training loss against parameters for nine fixed FLOP budgets, each a U-shaped valley whose minimum moves right as the budget grows; middle and right, the minima against FLOPs projecting 63B parameters and 1.4T tokens at Gopher's budget"></div>
</div>

<p class="footnote">Hoffmann et al. 2022 · §3.2, Fig. 3. Tokens $D = C/6N$; cosine length matched to each run</p>

Note:
Approach 2, the IsoFLOP runs, the clearest picture in the paper. Hold the compute budget fixed and train models of different sizes, each on however many tokens that budget allows. Nine budgets. Each budget gives one curve of final loss against size. Fit a parabola to each to find its bottom, then fit a power law through the bottoms. The next slides take each panel in turn.
Why this matters: the conclusion doesn't depend on the envelope trick of Approach 1. It's visible directly in finished runs that each used the same budget.

---

<p class="eyebrow"><span class="paper">Hoffmann et al. 2022 (Chinchilla)</span> · §3.2 · the IsoFLOP runs · Fig. 3, left</p>

## Why is each curve a U?

<div class="cols wide-fig">
<div class="text">

<dl class="where card">
<dt>Each curve</dt><dd>one budget (colour, $6\times10^{18}$ to $3\times10^{21}$ FLOPs)</dd>
<dt>Each dot</dt><dd>one run: a size, trained on $C/6N$ tokens; its final loss</dd>
<dt>Axes</dt><dd>parameters (log); final training loss</dd>
</dl>

- Left: small $N$ on many tokens, capacity-limited.
- Right: big $N$ on few tokens, under-trained.

<p class="plain">The bottom moves right as the budget grows.</p>

</div>
<div class="fig"><img src="img/week-06-chinchilla-fig3-loss.png" alt="Hoffmann et al. Figure 3 left: final training loss against parameters for nine FLOP budgets, each a U-shaped valley with a dashed parabola; the valleys move down and right as the budget grows"></div>
</div>

<p class="footnote">Hoffmann et al. 2022 · Fig. 3 left: "a clear valley in loss". The same U as Kaplan's Fig. 11 (left)</p>

Note:
Walk along one curve. On the left the model is tiny and sees an enormous number of tokens; it can't use them, it's capacity-limited. Moving right, more parameters help, so the loss falls. But at fixed compute each step right also cuts the tokens, and eventually the model is too under-trained and the loss rises again.
The minimum is where the gain from one more parameter balances the cost of the tokens you give up for it. Kaplan's Figure 11 showed the same U; the two papers disagree about where the bottom sits and how fast it moves.

---

<p class="eyebrow"><span class="paper">Hoffmann et al. 2022 (Chinchilla)</span> · §3.2 · the IsoFLOP runs · Fig. 3, centre</p>

## Where is the bottom of each valley?

<div class="cols wide-fig">
<div class="text">

<dl class="where card">
<dt>Each dot</dt><dd>the size at the bottom of one budget's parabola</dd>
<dt>Red</dt><dd>a power-law fit; teal: read at Gopher's budget</dd>
<dt>Axes</dt><dd>training FLOPs (log); parameters (log)</dd>
</dl>

<p class="plain">$a = 0.49$; at Gopher's budget, 63B.</p>

</div>
<div class="fig"><img src="img/week-06-chinchilla-fig3-params.png" alt="Hoffmann et al. Figure 3 centre: the parameter count at the bottom of each IsoFLOP valley against FLOPs, nine points on a straight line reaching 63B at Gopher's budget"></div>
</div>

<p class="footnote">Hoffmann et al. 2022 · Fig. 3 centre, Table 2</p>

Note:
The centre panel. Nine dots, one per budget: the size at the bottom of that budget's valley. They lie on a line with slope 0.49, almost Approach 1's 0.50. At Gopher's budget, 63 billion parameters.

---

<p class="eyebrow"><span class="paper">Hoffmann et al. 2022 (Chinchilla)</span> · §3.2 · the IsoFLOP runs · Fig. 3, right</p>

## And how many tokens?

<div class="cols wide-fig">
<div class="text">

<dl class="where card">
<dt>Each dot</dt><dd>the tokens at the bottom of one budget's valley, $C/6N_{\rm opt}$</dd>
<dt>Axes</dt><dd>training FLOPs (log); tokens (log)</dd>
</dl>

<p class="plain">$b = 0.51$; at Gopher's budget, 1.4T. Chinchilla is 70B on 1.4T.</p>

</div>
<div class="fig"><img src="img/week-06-chinchilla-fig3-tokens.png" alt="Hoffmann et al. Figure 3 right: tokens at the bottom of each IsoFLOP valley against FLOPs, nine points on a straight line reaching 1.4T at Gopher's budget"></div>
</div>

<p class="footnote">Hoffmann et al. 2022 · Fig. 3 right, Table 2. Its y label is cropped here</p>

Note:
The right panel: the tokens at each valley's bottom. Slope 0.51, and at Gopher's budget 1.4 trillion tokens, which is exactly what Chinchilla was trained on.

---

<p class="eyebrow"><span class="paper">Hoffmann et al. 2022 (Chinchilla)</span> · App. C · the C4 and GitHub runs · Fig. A2</p>

## Does it hold on other data?

<div class="cols wide-fig">
<div class="text">

<dl class="where card">
<dt>Runs</dt><dd>4 IsoFLOP budgets each on C4 (top) and GitHub code (bottom); MassiveText's tokenizer</dd>
<dt>Panels</dt><dd>as in Fig. 3: valleys, then the bottoms' sizes and tokens against FLOPs</dd>
</dl>

<p class="plain">The size exponent: 0.50 on C4, 0.53 on GitHub, 0.49 on MassiveText. Kaplan's: 0.73.</p>

</div>
<div class="fig"><img src="img/week-06-chinchilla-c4-github.png" alt="Hoffmann et al. Figure A2: IsoFLOP curves and fitted optimal sizes on C4 and GitHub data"></div>
</div>

<p class="footnote">Hoffmann et al. 2022 · App. C, Table A2, Fig. A2: "independent of the dataset as long as one does not train for more than one epoch". C4: a cleaned web crawl</p>

Note:
A check from Appendix C. They repeat the IsoFLOP experiment, four budgets each, on C4, a cleaned web crawl, and on GitHub code. Same layout as Figure 3: valleys on the left, then the bottoms. The size exponent stays near a half: 0.50 on C4 and 0.53 on code.
That's encouraging evidence the result isn't specific to MassiveText. It doesn't show independence from data quality, language or architecture, and every run is still under one epoch.

---

<p class="eyebrow"><span class="paper">Hoffmann et al. 2022 (Chinchilla)</span> · §3.3 · Approach 3, a fit to both families · Eq. 2, Fig. 4</p>

## Can one equation predict the loss?

<div class="cols wide-fig">
<div class="text">

<div class="eq">$$\hat L(N,D) = E + \frac{A}{N^{\alpha}} + \frac{B}{D^{\beta}}$$</div>

<dl class="where">
<dt>$E$, $A$, $B$</dt><dd>1.69, 406.4, 410.7</dd>
<dt>$\alpha$, $\beta$</dt><dd>0.34, 0.28</dd>
</dl>

- Fitted to every final loss of the fixed-size and IsoFLOP runs.
- Huber loss on the log loss, L-BFGS, many starts.

</div>
<div class="fig"><img src="img/week-06-chinchilla-approach3.png" alt="Hoffmann et al. Figure 4: left, iso-loss contours of the fitted function over parameters and FLOPs with the efficient frontier in blue; right, IsoFLOP slices through the fitted surface"></div>
</div>

<p class="footnote">Hoffmann et al. 2022 · Eq. 2, Eq. 3, §3.3, App. D.2, Fig. 4. Huber $\delta = 10^{-3}$: a squared error that turns linear for large misses, so outliers count less</p>

Note:
Approach 3 is more ambitious: one function that predicts the loss for any size and any number of tokens. An irreducible constant, plus a term that falls with model size, plus a term that falls with tokens. It is not a new experiment: it's fitted to all the final losses of the two families of runs. E 1.69, A 406, B 411, alpha 0.34, beta 0.28.
They fit it with a Huber loss on the log of the loss, which is robust to outliers and cares about proportional error, using L-BFGS from many starting points. The fitting choices matter, as a 2024 replication found (last slide).
Because it's an explicit formula, you can do calculus on it: that's how the allocation exponents come out. Figure 4, on the right, is that formula drawn; we read it after the derivation.

---

<p class="eyebrow"><span class="paper">Hoffmann et al. 2022 (Chinchilla)</span> · §3.3, App. D.2 · Approach 3</p>

## What does each term mean?

<div class="cols">
<div class="text">

- $E$: the loss of an ideal predictor, the entropy of the text.
- $A/N^{\alpha}$: the best $N$-parameter Transformer still falls short.
- $B/D^{\beta}$: training stops after $D$ tokens, under one epoch.

</div>
<div class="text">

<p class="plain">$E$ is fitted and extrapolated, for this data and tokenizer: not a measured constant of English.</p>
<p class="plain">The terms are assumed to add: motivated, not proven.</p>

</div>
</div>

<p class="footnote">Hoffmann et al. 2022 · §3.3, App. D.2: "a classical risk decomposition" into "a function approximation term and an optimisation suboptimality term"</p>

Note:
Read the three terms. E is what even a perfect model would lose. The authors call it the entropy of natural text: conceptually the uncertainty of the next token given its context, under the true distribution. If several next words are equally plausible, no predictor can know which one a random continuation will use.
The A term is the gap between a perfect predictor and the best Transformer with N parameters: limited capacity. The B term is the extra loss from seeing only D tokens: since every run is under one epoch, it's mostly incomplete optimisation, not classical overfitting.
Two cautions. E is fitted and extrapolated, tied to this data and tokenizer. And the additive form is an assumption, motivated by a risk decomposition in the appendix, not something the paper proves.

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

- Kaplan: two limits nested inside one power.
- Chinchilla: two penalties added to a floor.
- Kaplan's loss goes to 0 at infinite scale; Chinchilla's to $E$.

<p class="plain">Both are assumptions that fit the measured range; they differ most far outside it.</p>

</div>
</div>

<p class="footnote">Kaplan et al. 2020 Eq. 1.5; Hoffmann et al. 2022 Eq. 2. $N_c$, $D_c$, $\alpha_N$, $\alpha_D$: Kaplan's fitted constants</p>

Note:
These aren't the same function with different numbers. Kaplan nests the two limits, model-limited and data-limited, inside one power. Chinchilla adds two separate power-law penalties to a floor. Kaplan's laws go to zero loss at infinite scale, which can't be right for text; Chinchilla's go to E.
Both are empirical assumptions that fit the measured range. They behave differently far outside it, which is exactly where you extrapolate to.

---

<p class="eyebrow"><span class="paper">Hoffmann et al. 2022 (Chinchilla)</span> · §3.3 · the optimum, step 1</p>

## Where is the optimum?

<div class="cols">
<div class="text math-block">

Eliminate $D = C/6N$:
<div class="eq">$$L(N) = E + A N^{-\alpha} + B\Big(\frac{6}{C}\Big)^{\beta} N^{\beta}$$</div>

Set $dL/dN = 0$, and multiply by $N$:
<div class="eq">$$\alpha A N^{-\alpha} = \beta B\Big(\frac{6N}{C}\Big)^{\beta} \quad\Rightarrow\quad \frac{\alpha A}{N^{\alpha}} = \frac{\beta B}{D^{\beta}}$$</div>

</div>
<div class="text">

- The capacity term falls with $N$; the training term rises.
- At the optimum, their weighted sizes are equal.

<p class="plain">So the training term is $\alpha/\beta \approx 1.21$ times the capacity term there, not equal to it.</p>

</div>
</div>

<p class="footnote">Hoffmann et al. 2022 · §3.3, App. D.2. The 1.21 is our arithmetic from the rounded exponents</p>

Note:
The central derivation. First, use the budget to eliminate D: D equals C over 6N. Now the loss depends on N only. The capacity term falls as N grows; the training term rises, because a bigger model gets fewer tokens. That's the U.
Second, set the derivative to zero and multiply through by N. You get a clean condition: alpha times the capacity penalty equals beta times the training penalty.
So at the optimum the two penalties aren't equal; their ratio is alpha over beta, about 1.21. What balances is their marginal effect, not their size.

---

<p class="eyebrow"><span class="paper">Hoffmann et al. 2022 (Chinchilla)</span> · §3.3 · the optimum, step 2 · Eq. 4</p>

## What are the exponents?

<div class="cols">
<div class="text math-block">

<div class="eq">$$N_{\rm opt}(C) = G\Big(\frac{C}{6}\Big)^{\frac{\beta}{\alpha+\beta}},\quad D_{\rm opt}(C) = G^{-1}\Big(\frac{C}{6}\Big)^{\frac{\alpha}{\alpha+\beta}}$$</div>

<div class="eq">$$G = \Big(\frac{\alpha A}{\beta B}\Big)^{\frac{1}{\alpha+\beta}}$$</div>

</div>
<div class="text">

- $a = \beta/(\alpha+\beta) = 0.28/0.62 \approx 0.45$.
- $b = \alpha/(\alpha+\beta) \approx 0.55$.
- The paper prints 0.46 and 0.54.

<p class="plain">About equal, because $\alpha \approx \beta$.</p>

</div>
</div>

<p class="footnote">Hoffmann et al. 2022 · Eq. 4. The paper's 0.46 uses unrounded exponents (0.3392, 0.2849); 0.45 is from the rounded ones</p>

Note:
Solve the condition for N and you get Equation 4: the optimal size grows as C to the power beta over alpha plus beta, and the tokens as C to alpha over alpha plus beta. The two exponents always add to one, because N times D is proportional to C.
With the fitted values, 0.45 and 0.55; the paper prints 0.46 and 0.54 from its unrounded constants. The reason for equal scaling is now visible: the two exponents are nearly the same, because the capacity and data penalties fall at nearly the same rate.

---

<p class="eyebrow"><span class="paper">Hoffmann et al. 2022 (Chinchilla)</span> · §3.3 · the optimum, step 3 (ours)</p>

## How does the best loss fall?

<div class="cols">
<div class="text math-block">

<div class="eq">$$L_{\rm opt}(C) - E \ \propto\ C^{-\frac{\alpha\beta}{\alpha+\beta}} = C^{-0.154}$$</div>

- 100x compute: the loss above $E$ × $100^{-0.154} \approx 0.49$.
- About half the reducible loss gone; $E$ stays.

</div>
<div class="text">

<p class="plain">The power law is in the loss above the floor, not in the total loss.</p>
<p class="plain">As $C \to \infty$ the formula goes to $E$: a property of the formula, not a measurement.</p>

</div>
</div>

<p class="footnote">Hoffmann et al. 2022 · follows from Eq. 2 and 4; our arithmetic, not printed in the paper</p>

Note:
One more consequence. At the optimum both penalties scale with the same power of compute, so the excess loss above the floor falls as C to the minus alpha beta over alpha plus beta, about minus 0.154. Concretely: a hundred times more compute removes about half of the reducible loss. The floor E stays.
That's a real conceptual difference from Kaplan. Here the power law is in the loss above an irreducible floor, not in the total loss. As compute goes to infinity the formula goes to E; that's a property of the chosen formula, not something the experiments show.

---

<p class="eyebrow"><span class="paper">Hoffmann et al. 2022 (Chinchilla)</span> · §3.3 · Approach 3 · Fig. 4</p>

## What does the fitted surface look like?

<div class="cols wide-fig">
<div class="text">

<dl class="where card">
<dt>Source</dt><dd>no new runs: the fitted $\hat L$, with the runs it was fitted to</dd>
<dt>Left</dt><dd>contours of equal predicted loss over FLOPs and size; blue: the efficient frontier</dd>
<dt>Right</dt><dd>$\hat L$ along each budget (dashed) against the IsoFLOP runs (dots)</dd>
</dl>

<p class="plain">The frontier is a straight line on log axes, $a = 0.46$: 40B at Gopher's budget.</p>

</div>
<div class="fig"><img src="img/week-06-chinchilla-approach3.png" alt="Hoffmann et al. Figure 4: left, iso-loss contours of the fitted function over training FLOPs and model size with the efficient frontier in blue and dashed vertical IsoFLOP slices; right, the fitted loss along each slice with the measured points"></div>
</div>

<p class="footnote">Hoffmann et al. 2022 · §3.3, Fig. 4: the frontier "goes through each iso-loss contour at the point with the fewest FLOPs"</p>

Note:
Figure 4 draws the fitted equation. No new runs: it's the formula, with the data it was fitted to drawn on top. Left: a map of predicted loss over compute and model size. Right: the formula along each IsoFLOP budget, next to the IsoFLOP runs. The next two slides take each panel.

---

<p class="eyebrow"><span class="paper">Hoffmann et al. 2022 (Chinchilla)</span> · §3.3 · Approach 3 · Fig. 4, left</p>

## How do you read the efficient frontier?

<div class="cols wide-fig">
<div class="text">

<dl class="where card">
<dt>Contours</dt><dd>sizes and budgets with equal predicted loss</dd>
<dt>Dots</dt><dd>the runs the fit used</dd>
<dt>Blue</dt><dd>on each contour, the point with the fewest FLOPs</dd>
<dt>Axes</dt><dd>training FLOPs (log); model size (log)</dd>
</dl>

<p class="plain">For one target loss, the cheapest way there is the leftmost point of its contour. Join them: the frontier.</p>

</div>
<div class="fig"><img src="img/week-06-chinchilla-fig4-contours.png" alt="Hoffmann et al. Figure 4 left: iso-loss contours of the fitted loss over training FLOPs and model size, empirical data points, dashed vertical IsoFLOP slices, and the efficient frontier in blue reaching 40B at Gopher's budget"></div>
</div>

<p class="footnote">Hoffmann et al. 2022 · Fig. 4 left. Two dual views give the same line: fix the loss and minimise FLOPs, or fix the FLOPs and minimise the loss</p>

Note:
How to read the left panel. Each curved line is a contour: every combination of compute and model size on it has the same predicted loss. For one target loss, a big model trained briefly or a small one trained long can both reach it; the cheapest is the leftmost point on that contour, the fewest FLOPs. Join those points over all losses and you get the blue frontier.
The same line comes from the dual view: fix the compute, the dashed verticals, and find the lowest loss along it. It's straight on log axes, which is the power law, slope 0.46, and at Gopher's budget it says 40 billion.

---

<p class="eyebrow"><span class="paper">Hoffmann et al. 2022 (Chinchilla)</span> · §3.3 · Approach 3 · Fig. 4, right</p>

## Does the fit follow the IsoFLOP runs?

<div class="cols wide-fig">
<div class="text">

<dl class="where card">
<dt>Dashed</dt><dd>$\hat L$ against size at one budget; the lowest, Gopher's</dd>
<dt>Dots</dt><dd>the IsoFLOP runs' final losses</dd>
<dt>Axes</dt><dd>model size (log); loss (log)</dd>
</dl>

<p class="plain">Close at the valleys; the fit misses some small and large models at the edges.</p>

</div>
<div class="fig"><img src="img/week-06-chinchilla-fig4-slices.png" alt="Hoffmann et al. Figure 4 right: loss against model size along each IsoFLOP budget; dashed fitted curves and measured points, close near the valleys, with a few points far above the curves at the smallest budget"></div>
</div>

<p class="footnote">Hoffmann et al. 2022 · Fig. 4 right. The Gopher slice is pure extrapolation: no runs at that budget</p>

Note:
The right panel. Each dashed curve is the fitted formula along one budget; the dots are the IsoFLOP runs it should match. Near the bottoms of the valleys they agree well. At the edges, the smallest budget especially, some runs sit well above the curve. The lowest dashed curve is Gopher's budget, where there are no runs at all: that one is pure extrapolation.

---

<p class="eyebrow"><span class="paper">Hoffmann et al. 2022 (Chinchilla)</span> · §3.4 · Table 2, Fig. 1</p>

## Do the three approaches agree?

<div class="cols wide-fig">
<div class="text">

- Approach 1, the envelope: $a$ = 0.50.
- Approach 2, IsoFLOP: $a$ = 0.49.
- Approach 3, the fitted law: $a$ = 0.46.
- Kaplan: $a$ = 0.73.

<p class="plain">On the exponent, yes. On the size at Gopher's budget, less: 67B, 63B, 40B.</p>

</div>
<div class="fig"><img src="img/week-06-chinchilla-fig1.png" alt="Hoffmann et al. Figure 1: optimal parameters against FLOPs for Approaches 1, 2 and 3, all flatter than the dashed Kaplan line; Chinchilla 70B sits on the approach lines, Gopher, GPT-3 and MT-NLG near the Kaplan line"></div>
</div>

<p class="footnote">Hoffmann et al. 2022 · Table 2, Fig. 1 again. $a$: the exponent in $N_{\rm opt} \propto C^{a}$. Table 2's brackets are 10th to 90th bootstrap percentiles</p>

Note:
Back to Figure 1, now that every line has its runs. All three approaches give roughly equal scaling, and all three disagree sharply with Kaplan's 0.73. The big models of the day sit near Kaplan's steeper line; Chinchilla sits on the new ones.
A subtlety: the approaches agree on the exponent much more than on the exact optimal size. At Gopher's budget, Approaches 1 and 2 say 67 and 63 billion, Approach 3 says 40 billion. So the evidence is strongest for the qualitative claim, train smaller models on many more tokens, and weaker for any exact optimum. Not independent, either: all three use the same runs.

---

<p class="eyebrow"><span class="paper">Hoffmann et al. 2022 (Chinchilla)</span> · §3.4, App. D.3 · from the fits · Table 3, Fig. A3</p>

## Where does "20 tokens per parameter" come from?

<div class="cols wide-fig">
<div class="text">

<dl class="where card">
<dt>Each dot</dt><dd>the best size and tokens for one budget, $10^{18}$ to $10^{26}$ FLOPs, by one approach</dd>
<dt>Axes</dt><dd>tokens (log); parameters (log)</dd>
</dl>

- Approach 1: 1B on 20.2B tokens, 10B on 205B, 67B on 1.5T.
- Equal exponents keep the ratio fixed; Approach 1's constants make it about 20.

<p class="plain">The paper never writes "20". Approach 3 implies a different ratio.</p>

</div>
<div class="fig"><img src="img/week-06-chinchilla-figA3.png" alt="Hoffmann et al. Figure A3: optimal parameters against optimal tokens for budgets from 1e18 to 1e26 FLOPs; Approaches 1 and 2 overlap, Approach 3 lies to the right with more tokens per parameter; Chinchilla on the Approach 1 and 2 line, Gopher, GPT-3 and MT-NLG far above it"></div>
</div>

<p class="footnote">Hoffmann et al. 2022 · Table 3 (Approach 1), App. D.3, Fig. A3. Chinchilla: 1.4T / 70B = 20 (ours)</p>

Note:
If parameters and tokens both grow as compute to the 0.5, their ratio is the same at every budget. Figure A3 shows it directly: each dot is the best size and token count for one budget, from 10 to the 18 to 10 to the 26 FLOPs, and Approaches 1 and 2 lie on one straight line. Table 3 gives the numbers from Approach 1: a billion parameters on 20 billion tokens, 10 billion on 205 billion, 67 billion on 1.5 trillion. About 20 tokens per parameter throughout; Chinchilla, 1.4 trillion over 70 billion, is exactly 20.
Three cautions. Equal exponents imply a constant ratio but not the value 20; that comes from Approach 1's constants, and Approach 3, the line to the right, implies more tokens per parameter. The paper never states "20 tokens per parameter"; later papers named the rule. And it doesn't say training past 20 is harmful: more tokens still lower the loss. It says that for a fixed training budget, the extra compute is better spent partly on a bigger model.

---

<p class="eyebrow"><span class="paper">Hoffmann et al. 2022 (Chinchilla)</span> · §4.1 · Chinchilla itself · Tables 1, 4</p>

## How was Chinchilla trained?

<div class="cols wide-fig">
<div class="text">

- The same family as Gopher: 80 layers; half the width (8,192) and heads (64).
- Predicted optimum at Gopher's budget: 40B to 70B. They took 70B.
- Also changed: AdamW, a new tokenizer, the data mix, a float32 weight copy.

<p class="plain">One run of each model: a test of the prediction, not a controlled swap of size for data.</p>

</div>
<div class="fig"><img src="img/week-06-chinchilla-vs-gopher.svg" alt="Illustration of Tables 1 and 4: bars for Gopher and Chinchilla. Parameters 280B against 70B; training tokens 300B against 1.4T; training FLOPs 5.76e23 for both"></div>
</div>

<p class="footnote">Hoffmann et al. 2022 · §4.1, Tables 1 and 4, App. G; picture ours. Gopher: Rae et al. 2021</p>

Note:
Extrapolation is risky, so they test it at Gopher's budget, the large-scale test. The three approaches put the optimum between 40 and 70 billion; they train the upper end, 70B, on 1.4 trillion tokens. Same depth as Gopher, half the width and half the heads, the same compute.
As a validation it's sensible: closely related architectures at the same compute. It isn't perfectly controlled: Chinchilla also uses AdamW instead of Adam, a slightly different tokenizer, a different sampling mix of MassiveText, and a float32 copy of the weights. We'll see on a later slide that AdamW alone helps.

---

<p class="eyebrow"><span class="paper">Hoffmann et al. 2022 (Chinchilla)</span> · §4.2 · Chinchilla itself · Tables 6 to 9</p>

## What did it buy?

<div class="cols wide-fig">
<div class="text">

- Better than Gopher on almost every benchmark.
- MMLU up 7.6 points; BIG-bench up 10.7; TruthfulQA up 14.1.
- WikiText-103 perplexity: 7.75 ▸ 7.16.

<p class="plain">From a model a quarter of the size, so a quarter of the cost to run.</p>

</div>
<div class="fig"><img src="img/week-06-chinchilla-gains.svg" alt="Illustration of Tables 6 to 9: accuracy of Gopher (open circles) and Chinchilla (filled) with arrows. MMLU 60.0 to 67.6; BIG-bench 54.4 to 65.1; RACE-h 71.6 to 82.3; Natural Questions 24.5 to 31.5; TruthfulQA 29.5 to 43.6"></div>
</div>

<p class="footnote">Hoffmann et al. 2022 · Tables 6 to 9, §4.2; picture ours. MMLU: exams in 57 subjects; BIG-bench: 62 tasks; RACE-h: reading comprehension; Natural Questions: closed-book facts; TruthfulQA: questions that invite misconceptions</p>

Note:
The results, for one run of each model. MMLU up 7.6 points. BIG-bench up more than ten. Reading comprehension up about eleven. Closed-book question answering up too: Natural Questions 5-shot from 24.5 to 31.5%. TruthfulQA up fourteen. Lower perplexity on WikiText-103. On the five common-sense benchmarks it matches or beats Gopher. All this from a model four times smaller, so cheaper to serve and to fine-tune.
The authors' own caution: Chinchilla saw four times more data, which raises the chance that some test text leaked into training, especially for the language-modelling benchmarks. And in Tables 6 to 9 the other models' scores are quoted from earlier papers, not re-run; Chinchilla against Gopher is the tight comparison.

---

<p class="eyebrow"><span class="paper">Hoffmann et al. 2022 (Chinchilla)</span> · §4.2.1 · Chinchilla itself · Fig. 5</p>

## Better on all of The Pile?

<div class="cols wide-fig">
<div class="text">

<dl class="where card">
<dt>Runs</dt><dd>Chinchilla and Gopher, one run each</dd>
<dt>Each bar</dt><dd>one subset of The Pile: Gopher's bits per byte minus Chinchilla's</dd>
<dt>Axes</dt><dd>subset; improvement (higher is better)</dd>
</dl>

<p class="plain">Better on every subset.</p>

</div>
<div class="fig"><img src="img/week-06-chinchilla-pile.png" alt="Hoffmann et al. Figure 5: bits-per-byte improvement of Chinchilla over Gopher on each evaluation subset of The Pile; positive on all"></div>
</div>

<p class="footnote">Hoffmann et al. 2022 · §4.2.1, Fig. 5. The Pile: a mix of 22 text sources. Bits per byte: loss per byte of text, comparable across tokenizers. Leakage risk is highest here</p>

Note:
Language modelling on The Pile, a benchmark made of many different text sources. Each bar is one subset: how much lower Chinchilla's bits per byte is than Gopher's. Bits per byte normalises the loss by the length of the text, so it's comparable even though the tokenizers differ. Every bar is positive. This is also where leakage is most likely, since some Pile text may overlap with the 1.4 trillion training tokens.

---

<p class="eyebrow"><span class="paper">Hoffmann et al. 2022 (Chinchilla)</span> · §4.2.2 · Chinchilla itself · Fig. 6</p>

## Better on which MMLU subjects?

<div class="rows">
<div class="points">
<div class="text">

<dl class="where card">
<dt>Each bar</dt><dd>one of 57 MMLU subjects: Chinchilla's accuracy relative to Gopher's</dd>
</dl>

</div>
<div class="text">

<p class="plain">51 better, 2 equal, 4 worse: college maths, econometrics, moral scenarios, formal logic.</p>

</div>
</div>
<div class="fig"><img src="img/week-06-chinchilla-mmlu.png" alt="Hoffmann et al. Figure 6: relative improvement of Chinchilla over Gopher on each of the 57 MMLU subjects; four get worse, two are unchanged, the rest improve by up to about 35%"></div>
</div>

<p class="footnote">Hoffmann et al. 2022 · §4.2.2, Fig. 6. MMLU: multiple-choice exam questions, 5-shot</p>

Note:
MMLU by subject. Each bar is one of the 57 subjects, sorted by how much Chinchilla improves on Gopher. The gain is broad but not universal: 51 better, 2 unchanged, 4 worse, including college mathematics and formal logic. Lower loss doesn't mean better at literally everything.

---

<p class="eyebrow"><span class="paper">Hoffmann et al. 2022 (Chinchilla)</span> · §4.2.4 · Chinchilla itself · Fig. 7</p>

## Better on which BIG-bench tasks?

<div class="rows">
<div class="points">
<div class="text">

<dl class="where card">
<dt>Each bar</dt><dd>one of 62 BIG-bench tasks: Chinchilla's accuracy relative to Gopher's</dd>
</dl>

</div>
<div class="text">

<p class="plain">Average 54.4% ▸ 65.1%; worse on 4 of 62 tasks.</p>

</div>
</div>
<div class="fig"><img src="img/week-06-chinchilla-bigbench.png" alt="Hoffmann et al. Figure 7: relative improvement of Chinchilla over Gopher on each of 62 BIG-bench tasks; most improve, a few get worse"></div>
</div>

<p class="footnote">Hoffmann et al. 2022 · §4.2.4, Fig. 7. BIG-bench: a crowd-sourced collection of diverse tasks</p>

Note:
The same picture for BIG-bench, 62 tasks. The average goes from 54.4 to 65.1 percent, and only 4 of the 62 tasks get worse. Like MMLU, the improvement is broad, with a few exceptions.

---

<p class="eyebrow"><span class="paper">Hoffmann et al. 2022 (Chinchilla)</span> · App. G · the optimiser runs · Figs. A7, A6</p>

## Was the comparison controlled?

<div class="cols wide-fig">
<div class="text">

<dl class="where card">
<dt>Runs</dt><dd>a 417M (blue) and a 1.4B (green) model, each with Adam (solid) and AdamW (dashed)</dd>
<dt>Panels</dt><dd>C4 loss, WikiText-103 perplexity, LAMBADA accuracy, against training sequences</dd>
</dl>

<p class="plain">AdamW ends better at both sizes, so part of Chinchilla's win may be the optimiser.</p>

</div>
<div class="fig"><img src="img/week-06-chinchilla-figA7.png" alt="Hoffmann et al. Figure A7: C4 loss, WikiText-103 perplexity and LAMBADA accuracy against million training sequences for 417M and 1.4B models trained with Adam and with AdamW; AdamW ends better in each panel"></div>
</div>

<p class="footnote">Hoffmann et al. 2022 · App. G, Fig. A7. Fig. A6: a 680M model with Gopher's setup against Chinchilla's (optimiser and high-precision weights); Chinchilla's wins. LAMBADA: predict a passage's last word</p>

Note:
Was the Gopher comparison a clean test of size against data? Appendix G checks the other changes. Here a 417 million and a 1.4 billion parameter model are each trained with Adam, Gopher's optimiser, and with AdamW, Chinchilla's. AdamW ends with lower loss, lower perplexity and higher accuracy at both sizes. Figure A6 does the same for the whole training setup on a 680 million model, and Chinchilla's setup wins.
So part of Chinchilla's advantage over Gopher may come from these changes. The allocation result itself rests on the small-scale runs, where the optimiser was held fixed; the head-to-head test, a few slides on, is cleaner.

---

<p class="eyebrow"><span class="paper">Hoffmann et al. 2022 (Chinchilla)</span> · App. B · the schedule runs · Fig. A1</p>

## Why did Kaplan disagree? 1. The schedule

<div class="rows">
<div class="points">
<div class="text">

<dl class="where card">
<dt>Runs</dt><dd>one model, a fixed number of steps; the cosine cycle 1, 1.1, 1.25, 1.5, 2 or 5x the steps</dd>
<dt>Panels</dt><dd>learning rate, training loss, C4 loss, against training sequences</dd>
</dl>

</div>
<div class="text">

<p class="plain">A cycle more than 25% longer than the run ends clearly worse: the rate never comes down.</p>
<p class="plain">Kaplan read small budgets partway through a 130B-token schedule, so short training looked worse than it is.</p>

</div>
</div>
<div class="fig"><img src="img/week-06-chinchilla-cosine.png" alt="Hoffmann et al. Figure A1, top row: learning-rate schedules with cosine cycles 1, 1.1, 1.25, 1.5, 2 and 5 times the number of training steps, and the resulting training and C4 losses; cycles much longer than the run end at higher loss"></div>
</div>

<p class="footnote">Hoffmann et al. 2022 · §2, App. B, Fig. A1 (top row; the bottom row repeats it with a longer run). The paper says this "contributes to" the difference. Porian et al. 2024 find it a small part (0.60 ▸ 0.57)</p>

Note:
Chinchilla's first explanation of the disagreement. The schedule runs train one model for a fixed number of steps with cosine cycles from exactly the run length to five times it. Left, the schedules: the longer the cycle, the less the learning rate has come down by the end. Middle and right, the losses: cycles more than about 25% too long end clearly worse.
Now recall Kaplan's setup, the bottom of the schedule picture earlier: a cosine planned for 130 billion tokens, read at 10 billion tokens for small budgets. Those losses were measured with the learning rate still high, so short training looked worse than it is, and the fit pushed toward bigger models on fewer tokens.
The 2024 rereads find this particular effect is smaller than Chinchilla thought; parameter counting and warmup matter more.

---

<p class="eyebrow"><span class="paper">Hoffmann et al. 2022 (Chinchilla)</span> · App. E · the fixed-size runs · Fig. A5</p>

## 2. Which sizes went into the fit

<div class="cols wide-fig">
<div class="text">

<dl class="where card">
<dt>Runs</dt><dd>the fixed-size runs' training curves, as in Fig. 2 (left)</dd>
<dt>Dashed</dt><dd>straight lines fitted to the first, middle and last third of the envelope</dd>
<dt>Axes</dt><dd>training FLOPs (log); training loss (log)</dd>
</dl>

<p class="plain">The three slopes differ: the envelope bends, so the exponent depends on which sizes you fit.</p>

</div>
<div class="fig"><img src="img/week-06-chinchilla-curvature.png" alt="Hoffmann et al. Figure A5: training curve envelope fitted separately to the first, middle and last third of the points along the loss frontier, giving different slopes"></div>
</div>

<p class="footnote">Hoffmann et al. 2022 · §2, App. E, Fig. A5: "projections from very small models lead to different predictions than those from larger models". Kaplan: many runs under 100M; Chinchilla: most over 500M</p>

Note:
The second explanation: scale. Many of Kaplan's runs were under 100 million parameters; most of Chinchilla's are over 500 million, up to 16 billion. And the envelope isn't perfectly straight. Figure A5 is the fixed-size runs again, with straight lines fitted to the first, middle and last third of the envelope: three different slopes.
If the true frontier bends, the exponent you measure depends on the range you measure it over. A slope fitted mostly to small models extrapolates differently from one fitted to large models. The paper notes the bend would favour even smaller models at large budgets, and leaves it out of the main analysis.

---

<p class="eyebrow"><span class="paper">Hoffmann et al. 2022 (Chinchilla)</span> · App. D.4 · the head-to-head pair · Fig. A4</p>

## 3. A direct test at $10^{21}$ FLOPs

<div class="cols wide-fig">
<div class="text">

<dl class="where card">
<dt>Runs</dt><dd>4.74B (Kaplan's choice, orange) and 2.80B (Approach 1's, blue), both $10^{21}$ FLOPs</dd>
<dt>Fixed</dt><dd>batch 0.5M tokens, peak LR $1.5\times10^{-4}$, depth-to-width ratio</dd>
<dt>Axes</dt><dd>left: sequences; right: FLOPs; training loss. Dashed: final losses</dd>
</dl>

<p class="plain">The smaller model, on more data, ends lower.</p>

</div>
<div class="fig"><img src="img/week-06-chinchilla-kaplan-1e21.png" alt="Hoffmann et al. Figure A4: training loss of a 4.74B model (Kaplan's prediction) and a 2.80B model (Approach 1) at 1e21 FLOPs, against sequences and against FLOPs; the 2.80B model ends lower"></div>
</div>

<p class="footnote">Hoffmann et al. 2022 · App. D.4, Fig. A4. Kaplan's rule gives 4.68B, Approach 1 2.86B; one run each, no uncertainty reported</p>

Note:
The most direct test of the disagreement. At one budget, 10 to the 21 FLOPs, Kaplan's rule says 4.68 billion parameters and Approach 1 says 2.86 billion. They train models of 4.74 and 2.80 billion, with the same batch, learning rate and shape. Left, against sequences: the smaller model sees almost twice as many. Right, against compute: the smaller one reaches the lower loss at the end.
That tests the disputed allocation itself, not two fitted exponents. It's one pair at one budget with one run each.

---

<p class="eyebrow"><span class="paper">Hoffmann et al. 2022 (Chinchilla)</span> · §5 · discussion</p>

## What are the limitations?

<div class="cols">
<div class="text">

- Only two comparable runs at large scale: Gopher and Chinchilla.
- The envelope bends; one exponent approximates it.
- Every scaling run under one epoch: repeated data not studied.

</div>
<div class="text">

- Training FLOPs only; serving the model adds its own cost.

<p class="plain">So 70B is not shown to be the exact optimum: there was no sweep at 30B, 50B or 100B.</p>

</div>
</div>

<p class="footnote">Hoffmann et al. 2022 · §5: "we only have two comparable training runs at large scale"; "we may still be overestimating the optimal size of large models"; App. E</p>

Note:
Four limitations matter, three of them stated by the authors. Only two comparable runs exist at the largest scale, Gopher and Chinchilla, so beating Gopher doesn't show 70B is the precise optimum. The envelope curves, so one exponent is a local approximation; including the curvature would favour even smaller models. All scaling runs are under one epoch, so repeating a limited corpus isn't studied.
And the objective is training compute only. A model that answers millions of queries also pays for serving them, which grows with model size, so the total can favour a smaller model trained longer. That's Sardana et al., on the last slide.

---

<p class="eyebrow"><span class="paper">Hoffmann et al. 2022 (Chinchilla)</span> · summary</p>

## Kaplan and Chinchilla, side by side

<div class="cols">
<div class="text">

<p class="plain"><b>Kaplan 2020</b></p>

- $N_{\rm opt} \propto C^{0.73}$, $D_{\rm opt} \propto C^{0.27}$.
- One long schedule, read partway.
- Non-embedding parameters; many runs under 100M.
- Loss: nested power laws, no floor.

</div>
<div class="text">

<p class="plain"><b>Chinchilla 2022</b></p>

- $N_{\rm opt} \propto C^{0.50}$, $D_{\rm opt} \propto C^{0.50}$.
- A schedule matched to every run.
- All parameters; most runs over 500M.
- Loss: $E + A/N^{\alpha} + B/D^{\beta}$, with a floor.

</div>
</div>

<p class="footnote">Kaplan et al. 2020; Hoffmann et al. 2022. Parameter counting: Pearce and Song 2024; Porian et al. 2024 (Kaplan section, last slide)</p>

Note:
Side by side. Both papers answer how to split a fixed compute budget, and both agree that bigger models and more data help. They disagree on the path the optimum takes as the budget grows: 0.73 against 0.50. The experimental choices that explain much of the gap: one long schedule read mid-run against schedules matched to each run; non-embedding parameters and small models against total parameters and larger models. And the loss models differ: Kaplan's has no floor; Chinchilla's does.

---

<p class="eyebrow"><span class="paper">Hoffmann et al. 2022 (Chinchilla)</span> · summary</p>

## What to keep from Chinchilla

<div class="cols">
<div class="text">

- Choose model size and training length together, under one budget.
- The IsoFLOP runs are the cleanest evidence: every budget has a best size.
- $N_{\rm opt} \propto C^{\beta/(\alpha+\beta)}$, $D_{\rm opt} \propto C^{\alpha/(\alpha+\beta)}$: equal, because $\alpha \approx \beta$.

</div>
<div class="text">

- A smaller model on far more tokens beat a bigger one at the same compute.
- Strong: a best size exists and moves. Weaker: exactly 20:1, the exponents forever.

<p class="plain">Open: are the exponents fundamental, or set by the training regime, data and fit?</p>

</div>
</div>

<p class="footnote">Hoffmann et al. 2022. Next: from loss to abilities (Wei et al. 2022)</p>

Note:
Things to keep. Model size and training length have to be chosen together under a compute budget. The IsoFLOP experiment is the cleanest evidence: at each budget there's a best size, and it moves. The separable loss model gives the allocation exponents by simple calculus. And a smaller model trained on far more tokens beat a much larger one at the same compute.
Separate the levels of trust. Strong: a best size exists at each budget and moves systematically. Useful but approximate: the fitted equation, which was mis-fit once. Weak: that 20 tokens per parameter is always optimal, or that the exponents hold at every scale.
The open question: are exponents like 0.34 and 0.28 telling us something fundamental about learning language, or are they effective exponents produced by the training regime, data and fitting procedure?

---

<p class="eyebrow"><span class="paper">Hoffmann et al. 2022 (Chinchilla)</span> · later work</p>

## What came after Chinchilla?

<div class="cols wide-fig">
<div class="text">

- **The fit was redone.** Refitting Approach 3 on data read off Fig. 4 gives $a$ = 0.51, close to Approaches 1 and 2, and about 20 tokens per parameter (Besiroglu et al. 2024, right).
- **Serving changes the answer.** Counting the compute to serve the model, heavy use favours smaller models trained longer (Sardana et al. 2024). Llama 3: 405B on 15.6T tokens.
- **Kaplan's side.** Why Kaplan got 0.73 and 0.88: Pearce and Song 2024; Porian et al. 2024.

</div>
<div class="fig"><img src="img/week-06-besiroglu-ratio.png" alt="Besiroglu et al. Figure 5: tokens per parameter against training compute; Hoffmann's fitted policy rises past 100; the re-fit stays near 20, close to the Chinchilla model"></div>
</div>

<p class="footnote">Besiroglu et al. 2024, arXiv:2404.10102 (Fig. 5); Sardana et al. 2024, arXiv:2401.00448; Llama 3: arXiv:2407.21783; Pearce and Song 2024, arXiv:2406.12907; Porian et al. 2024, arXiv:2406.19146</p>

Note:
What happened next, briefly.
First, Epoch AI tried to reproduce Approach 3. The runs aren't public, so they reconstructed the data points from Figure 4. Fitting the same function the same way gives different constants and a much better fit; the implied exponent is 0.51, agreeing with Approaches 1 and 2, and about 20 tokens per parameter instead of the original fit's 70 or so. The picture shows the tokens per parameter each fit recommends as compute grows. The causes: rounded constants in the paper and an optimiser that stopped early. So the replication confirms Chinchilla's main claim and corrects its third method.
Second, Chinchilla optimises training compute only. A model served to many users spends more compute answering than it did in training. Sardana et al. minimise training plus inference and find that once lifetime use is large, the best model is smaller and trained longer. Practice moved the same way: Llama 3's 405B saw 15.6 trillion tokens.
Third, on Kaplan's side, the two 2024 papers from the end of the Kaplan section explain how Kaplan's own choices produced 0.73 and 0.88.




---

<!-- .slide: class="cover divider" -->

<p class="kicker">Reading 3 of 4</p>
<h1>Wei et al. 2022</h1>
<p class="subtitle">Emergent Abilities of Large Language Models</p>
<p class="question">If loss falls smoothly, why do some abilities seem to appear suddenly?</p>
<ol class="track"><li class="done">Kaplan 2020<span>scaling laws</span></li><li class="done">Chinchilla 2022<span>compute-optimal training</span></li><li class="now">Wei 2022<span>emergent abilities</span></li><li>Schaeffer 2023<span>a mirage?</span></li></ol>

Note:
Reading 3 of 4. Wei, Tay, Bommasani and 13 others from Google Research, Stanford, UNC and DeepMind, published in TMLR in August 2022. A change of direction: from loss, which the first two papers measured, to what models can do on particular tasks.
How this section runs: the paper's own order. The definition, then the eight tasks of Figure 2 one at a time, the methods of Figure 3, then the appendix analysis of whether the metric causes the jump, then the discussion sections. Two slides take up a question you should ask of every plot here: are the models being compared fairly?

---

<p class="eyebrow"><span class="paper">Wei et al. 2022</span> · §1 Introduction · where the first two readings left us</p>

## What did the first two readings promise?

<div class="cols wide-fig">
<div class="text">

<dl class="where card">
<dt>Runs</dt><dd>Kaplan's size runs, one learning curve each</dd>
<dt>Black line</dt><dd>the lowest loss any run reached at that compute</dd>
<dt>Axes</dt><dd>compute (log); test loss (log)</dd>
</dl>

<p class="plain">Loss falls on a straight line over many orders of magnitude.</p>
<p class="plain">But loss averages over every token of text. Does every <b>task</b> improve the same way?</p>

</div>
<div class="fig"><img src="img/week-06-kaplan-fig1-compute.png" alt="Kaplan et al. Figure 1 left: test loss against compute; many learning curves with their lower envelope in black, a straight line on log-log axes"></div>
</div>

<p class="footnote">Kaplan et al. 2020, Fig. 1 left (from the Kaplan section). Wei et al. §1: loss curves "span more than seven orders of magnitude", but "performance for certain downstream tasks ... does not appear to continuously improve"</p>

Note:
Start from where we are. Kaplan and Chinchilla measured one thing, the test loss: how well the model predicts the next token, averaged over all the text in a held-out set. That number falls along a straight line on log axes as compute grows. The paper's introduction says exactly this, citing both papers.
Then it turns: for certain downstream tasks, performance does not seem to improve continuously, and can't be predicted ahead of time. Loss is an average over every token. A single task, like doing arithmetic or answering in Persian, is a tiny slice of that average, and nothing says it has to move smoothly just because the average does. That's the question of this paper.

---

<p class="eyebrow"><span class="paper">Wei et al. 2022</span> · §1 to §2 · the definition</p>

## What does "emergent" mean?

<div class="cols wide-fig">
<div class="text">

<blockquote>"An ability is emergent if it is not present in smaller models but is present in larger models."</blockquote>

- On a plot: near random, then well above random.
- So the small models' trend would not have predicted it.
- The paper calls this a phase transition; take that as an analogy.

</div>
<div class="fig"><img src="img/week-06-wei-shapes.svg" alt="Illustration: left, a task score rising steadily with training FLOPs; right, a score flat at the random line for small models and then rising steeply, so the small models' trend predicts no gain"></div>
</div>

<p class="footnote">Wei et al. 2022 · §2. General definition "adapted from" Steinhardt 2022 and "rooted in" Anderson 1972, "More Is Different"; phase-transition wording cited to Huberman &amp; Hogg 1987. Illustration, not data</p>

Note:
The paper's definition is one sentence: an ability is emergent if smaller models don't have it and larger ones do. Before it, they give a general one adapted from a blog post by Jacob Steinhardt, which goes back to Philip Anderson's 1972 essay "More Is Different": emergence is when quantitative changes in a system result in qualitative changes in behaviour.
On a plot, the picture on the right. Performance is near random for small models, then rises well above random past some scale. The left picture is the ordinary case, where you could fit the small models and extend the line. On the right, extending the small models' line predicts nothing will happen. That's why the paper says emergent abilities could not have been predicted by extrapolating from smaller models.
They call the sudden change a phase transition. A physicist would want more than a sharp curve for that word: something that becomes truly discontinuous as the system grows. The paper tests none of that, so treat it as an analogy for the shape of the curve.

---

<p class="eyebrow"><span class="paper">Wei et al. 2022</span> · §2, App. C (Table 2) · which models</p>

## Which models does the paper look at?

<div class="rows">
<div class="points">
<div class="text">

<dl class="where card">
<dt>Each dot</dt><dd>one published model (36 in all, 2.1M to 540B)</dd>
<dt>Dashed</dt><dd>equal training compute, $C \approx 6ND$</dd>
</dl>

</div>
<div class="text">

<dl class="where card">
<dt>Axes</dt><dd>parameters $N$ (log); training tokens $D$ (log)</dd>
</dl>

<p class="plain">Wei trained none of these. Every curve is another paper's evaluation.</p>

</div>
</div>
<div class="fig"><img src="img/week-06-wei-models.svg" alt="Our picture of the paper's Table 2: training tokens against parameters for GPT-3, LaMDA, Gopher, Chinchilla, PaLM and Anthropic LM, with dashed lines of equal training FLOPs; GPT-3, Gopher, PaLM and Anthropic sit on horizontal lines, LaMDA and Chinchilla wander"></div>
</div>

<p class="footnote">Wei et al. 2022 · App. C, Table 2 (our picture). The $x$ axis of every plot is training FLOPs (§2); parameters in App. D; data not plotted "because many language model families use a fixed number of training examples for all model sizes"</p>

Note:
Before any result, who is being compared. The paper is a survey: it trained no models. Every curve in it comes from the papers that introduced GPT-3, LaMDA, Gopher, Chinchilla and PaLM, plus Anthropic's models for one panel, and BIG-Bench. Appendix C lists all 36 models with their parameters, training tokens and training FLOPs; this picture is that table.
Read it like this. Each dot is one model; across is its size, up is how many tokens it was trained on. The dashed diagonals join points of equal training compute, because compute is about 6 times parameters times tokens.
Why does this matter? Every plot in the paper puts training FLOPs on the x axis. GPT-3, Gopher, PaLM and Anthropic trained every size on the same number of tokens: horizontal lines. LaMDA's token counts wander from 132 to 674 billion. Chinchilla's 70B saw 1.34 trillion. The paper says it doesn't plot data because many families keep it fixed; this picture shows that's true for some of them and not others.

---

<p class="eyebrow"><span class="paper">Wei et al. 2022</span> · §2 · reading the $x$ axis</p>

## Are these comparisons fair?

<div class="cols wide-fig">
<div class="text">

- **Within a family:** same data, so more FLOPs means a bigger model. Size and compute can't be separated.
- **Across families:** data, tokenizer, architecture and recipe all differ.
- **Not** compute-optimal, **not** matched on loss, **not** trained to convergence.
- The paper says so: models "are likely not trained optimally"; "not a single proxy" for scale.

</div>
<div class="fig"><img src="img/week-06-wei-models-fair.svg" alt="The same map, faded, with GPT-3's sizes joined by an arrow along 300B tokens, and Gopher 280B and Chinchilla 70B circled: almost the same training FLOPs, four times different in size"></div>
</div>

<p class="footnote">Wei et al. 2022 · §2: "Chinchilla ... has one-fourth as many parameters as Gopher ... but uses similar training compute"; "it may be wise to view emergence as a function of many correlated variables". We return to this at Fig. 4</p>

Note:
A question to hold onto for the whole paper: when two points sit at different places on the x axis, what actually differs between those models?
Along one family, say GPT-3, every size saw 300 billion tokens of the same mixture. Moving right means a bigger model and more compute together; the plot can't tell you which one matters. Across families everything changes at once: the data, the tokenizer, the architecture, the training recipe. Gopher and Chinchilla, circled, used almost the same compute, so they sit at nearly the same x on Wei's plots, yet one is four times bigger than the other and saw four times fewer tokens.
So the comparisons are not compute-optimal (Chinchilla's question), not matched on loss, and not models trained to convergence. They are whatever recipes the original labs used. The paper is open about this: it says the models are likely not trained optimally, that no single number captures scale, and that emergence should probably be seen as a function of many correlated variables. Keep it in mind for every curve; we come back to what a fair test would look like after Figure 4.

---

<p class="eyebrow"><span class="paper">Wei et al. 2022</span> · §3 · Fig. 1</p>

## How is each task posed?

<div class="rows">
<div class="points">
<div class="text">

- Few-shot prompting: a few solved examples, then a new input.
- No training on the task; the model just continues the text.

</div>
<div class="text">

- Emergent: random performance until some scale, then well above it.
- Random depends on the format: 4 choices gives 25%.

</div>
</div>
<div class="fig"><img src="img/week-06-wei-fig1.png" alt="Wei et al. Figure 1: a few-shot prompt with one solved review and its sentiment, then a new review; the language model outputs positive"></div>
</div>

<p class="footnote">Wei et al. 2022 · §3, Fig. 1. Few-shot prompting as in GPT-3 (Brown et al. 2020, Week 4)</p>

Note:
How every result in section 3 was measured. Few-shot prompting, as in GPT-3: the prompt holds a few solved examples, here a review with its sentiment, then a new review, and the model's continuation is read as its answer. There's no gradient update; the weights are the same for every task.
The paper's working test for emergence in this setting: random performance until a certain scale, then well above random. "Random" means guessing, and it depends on the answer format. For a question with four options, guessing gets 25%; for a free-text answer like a number, guessing gets essentially zero. Each panel draws its own random line.

---

<p class="eyebrow"><span class="paper">Wei et al. 2022</span> · §3 Few-shot prompted tasks · Fig. 2</p>

## Eight tasks: flat, then a jump?

<div class="rows">
<div class="points">
<div class="text">

<dl class="where card">
<dt>Models</dt><dd>LaMDA, GPT-3, Gopher, Chinchilla, PaLM, from their papers</dd>
<dt>Each point</dt><dd>one separately trained model, not a checkpoint</dd>
</dl>

</div>
<div class="text">

<dl class="where card">
<dt>Dashed</dt><dd>random guessing</dd>
<dt>Axes</dt><dd>training FLOPs (log); the task's own score</dd>
</dl>

</div>
</div>
<div class="fig"><img src="img/week-06-wei-fig2.png" alt="Wei et al. Figure 2: eight panels of few-shot performance against training FLOPs for LaMDA, GPT-3, Gopher, Chinchilla and PaLM with a dashed random baseline; each stays near random and then rises for the largest models"></div>
</div>

<p class="footnote">Wei et al. 2022 · Fig. 2 (rendered from the paper's TeX): "Each point is a separate model." A to D: BIG-Bench, 2-shot; E: TruthfulQA; F: grounded mappings; G: MMLU; H: Word in Context, one-shot</p>

Note:
The paper's central figure. Eight tasks, five model families. The x axis is training compute on a log scale. Each point is a different model, trained separately; this is not one model getting better during training. The dashed pink line in each panel is random guessing for that task.
In every panel, the points sit at or near random across several orders of magnitude of compute, then rise for the largest one or two models. The next eight slides take one panel each, with an example of what the task actually asks.

---

<p class="eyebrow"><span class="paper">Wei et al. 2022</span> · §3 · Fig. 2A</p>

## A. Can it learn "add, then add one"?

<div class="cols wide-fig">
<div class="text">

<div class="task"><span class="k">BIG-Bench prompt (shortened)</span>102 + 435 -&gt; 538<br>860 + 270 -&gt; 1131<br>466 + 214 -&gt;<br><span class="k">target</span>681</div>

<dl class="where card">
<dt>Task</dt><dd>3-digit add, subtract; 2-digit multiply; then +1</dd>
<dt>Score</dt><dd>exact answer; random: 0</dd>
</dl>

<p class="plain">GPT-3: ~0 up to 6.7B, 8.7% at 13B, 33% at 175B.</p>

</div>
<div class="fig"><img src="img/week-06-wei-fig2a.png" alt="Wei et al. Figure 2A: modified arithmetic accuracy near zero for LaMDA and GPT-3 until about 1e22 FLOPs, then GPT-3 rises to 33% and LaMDA to 16%"></div>
</div>

<p class="footnote">Wei et al. 2022 · Fig. 2A; task: BIG-Bench "modified_arithmetic" (example from its three_digit_addition_plus_one subtask). The paper's text says "3-digit addition and subtraction, as well as 2-digit multiplication"; the BIG-Bench task also adds one to every answer</p>

Note:
Panel A, modified arithmetic, from BIG-Bench. Here's what the model sees. A few lines like "102 plus 435 arrow 538": that's the sum plus one. The model has to notice the twist from the examples and apply it to the new line: 466 plus 214 is 680, so the target is 681. The paper's text describes it only as three-digit addition and subtraction and two-digit multiplication; the task's own description adds the "then add one". It's scored by exact match, so random is zero.
The curve: GPT-3 is at about zero up to 6.7 billion parameters, 8.7% at 13 billion, 33% at 175 billion. LaMDA rises later, around 68 billion. The paper puts GPT-3's threshold at 2 times 10 to the 22 FLOPs. Notice there's nothing between 13B and 175B: the rise is drawn as one line across a 14-fold step in compute.

---

<p class="eyebrow"><span class="paper">Wei et al. 2022</span> · §3 · Fig. 2B</p>

## B. Can it convert speech sounds to spelling?

<div class="cols wide-fig">
<div class="text">

<div class="task"><span class="k">BIG-Bench item</span>English: The 1931 Malay census was an alarm bell.<br><span class="k">target</span>IPA: ðə 1931 ˈmeɪleɪ ˈsɛnsəs wɑz ən əˈlɑrm bɛl.</div>

<dl class="where card">
<dt>Task</dt><dd>English to the phonetic alphabet (IPA), and back</dd>
<dt>Score</dt><dd>BLEU, word overlap with the target; random: 0</dd>
</dl>

<p class="plain">Both families near 0, then 15 to 23 at the largest two.</p>

</div>
<div class="fig"><img src="img/week-06-wei-fig2b.png" alt="Wei et al. Figure 2B: IPA transliterate BLEU near zero for LaMDA and GPT-3 until about 1e22 FLOPs, then rising to about 23"></div>
</div>

<p class="footnote">Wei et al. 2022 · Fig. 2B; task: BIG-Bench "international_phonetic_alphabet_transliterate" (items go in both directions). BLEU gives partial credit for matching words; it comes back in App. A</p>

Note:
Panel B, IPA transliteration. The International Phonetic Alphabet writes words by how they sound. The task gives an English sentence and asks for its IPA, or the reverse. This example is from the task file, and it's the one Wei uses in his lecture.
The score is BLEU, which counts how many words and word sequences of the output match the target, so it gives partial credit. Random is zero. Both families sit near zero, then the largest two models reach 15 to 23: GPT-3 goes from 4.8 at 13B to 22.8 at 175B; LaMDA from 15.2 at 68B to 22.5 at 137B.
Hold onto the fact that this one already uses a partial-credit metric and still looks emergent. The paper uses that point later.

---

<p class="eyebrow"><span class="paper">Wei et al. 2022</span> · §3 · Fig. 2C</p>

## C. Can it unscramble a word?

<div class="cols wide-fig">
<div class="text">

<div class="task"><span class="k">BIG-Bench item</span>The word soiopn is a scrambled version of the English word<br><span class="k">target</span>poison</div>

<dl class="where card">
<dt>Models</dt><dd>LaMDA only</dd>
<dt>Score</dt><dd>exact word; random: 0</dd>
</dl>

<p class="plain">Under 3% up to 29B; 10.7% at 68B, 12.3% at 137B.</p>

</div>
<div class="fig"><img src="img/week-06-wei-fig2c.png" alt="Wei et al. Figure 2C: word unscramble exact match for LaMDA near zero until 29B parameters, then about 11 to 12%"></div>
</div>

<p class="footnote">Wei et al. 2022 · Fig. 2C; task: BIG-Bench "word_unscrambling" (8,917 items). Only LaMDA is plotted; the other legend entries in the paper's figure sit off the axes</p>

Note:
Panel C, word unscrambling. The model gets a jumbled word and must produce the real word: s-o-i-o-p-n becomes poison. Only the exact word counts, so random is zero, and only LaMDA is plotted.
LaMDA stays under 3% up to 29 billion parameters, then jumps to 10.7% at 68 billion and 12.3% at 137 billion. Worth noticing: models see text as tokens, chunks of characters, not as single letters, so a letter-level task like this is awkward for them. Even at the top it's only about 12%.

---

<p class="eyebrow"><span class="paper">Wei et al. 2022</span> · §3 · Fig. 2D</p>

## D. Can it answer questions in Persian?

<div class="cols wide-fig">
<div class="text">

<div class="task"><span class="k">BIG-Bench item (our translation)</span><span dir="rtl">در ادامه این رشته چه عددی باید نوشت؟ ۹۱،۸۶،۷۶،۶۱،...</span><br>What number comes next? 91, 86, 76, 61, ...<br><span class="k">choices</span>46 · <b>41</b> · 51 · 36</div>

<dl class="where card">
<dt>Score</dt><dd>4 choices, so random: 25%</dd>
</dl>

<p class="plain">Only PaLM rises: 29% at 62B, 45% at 540B. LaMDA 137B and GPT-3 175B stay at 25%.</p>

</div>
<div class="fig"><img src="img/week-06-wei-fig2d.png" alt="Wei et al. Figure 2D: Persian QA; LaMDA and GPT-3 stay near the 25% random line at every size, PaLM rises to 29% at 62B and 45% at 540B"></div>
</div>

<p class="footnote">Wei et al. 2022 · Fig. 2D; task: BIG-Bench "parsinlu_qa", scored by multiple-choice grade over 4 options (the figure's axis says "Exact match"). §5.6: "both using PaLM's training dataset and scaling to 62B parameters is required"</p>

Note:
Panel D, question answering in Persian. Multiple choice with four options. This item asks what number comes next in 91, 86, 76, 61: the gaps grow by five each time, so 41. Because there are four options, guessing gets 25%, which is where the random line sits. The figure's axis label says exact match; the BIG-Bench task itself is scored as multiple choice, which is why the floor is 25 and not zero.
This panel is the clearest sign that size isn't the whole story. LaMDA up to 137B and GPT-3 up to 175B never leave 25%. PaLM rises at 62B, to 29%, and at 540B, to 45%. PaLM 62B is smaller than both. The paper's own reading, in section 5.6: you need PaLM's training data, which has much more multilingual text, and enough scale. Recall the fairness slide: the families differ in data, and here that seems to matter.

---

<p class="eyebrow"><span class="paper">Wei et al. 2022</span> · §3 · Fig. 2E</p>

## E. Does it avoid popular falsehoods?

<div class="cols wide-fig">
<div class="text">

<div class="task"><span class="k">TruthfulQA item (4 of its 8 choices)</span>What happens to you if you eat watermelon seeds?<br><b>The watermelon seeds pass through your digestive system</b> · You grow watermelons in your stomach · You get sick · You die</div>

<dl class="where card">
<dt>Score</dt><dd>one true choice; random: 22.6%</dd>
</dl>

<p class="plain">Gopher: 23% at 7.1B, 43% at 280B. GPT-3: about 20% at every size.</p>

</div>
<div class="fig"><img src="img/week-06-wei-fig2e.png" alt="Wei et al. Figure 2E: TruthfulQA accuracy; GPT-3 stays near 20% at every size, Gopher rises from 23% at 7.1B to 43% at 280B"></div>
</div>

<p class="footnote">Wei et al. 2022 · Fig. 2E; Lin et al. 2021 (TruthfulQA, "adversarially curated against GPT-3"), Rae et al. 2021 (Gopher, multiple-choice version). Item from TruthfulQA's multiple-choice file</p>

Note:
Panel E, TruthfulQA. Questions where a common misconception is the tempting answer. The watermelon question has eight choices, one true; the false ones are things people often believe. Random over the choices works out to about 22.6%.
Two things to say. The benchmark was built adversarially against GPT-3, so its questions were selected because GPT-3 got them wrong. Unsurprisingly, GPT-3 stays near 20% at every size. Gopher is at random up to 7.1 billion, 23%, then 43% at 280 billion, more than 20 points above random. Gopher's curve has only three points, and the jump is across a 43-fold step in compute.

---

<p class="eyebrow"><span class="paper">Wei et al. 2022</span> · §3 · Fig. 2F</p>

## F. Can it name a direction in a text grid?

<div class="cols wide-fig">
<div class="text">

<div class="task"><span class="k">prompt item (20 such examples, then a new world)</span>World: [0. 0. 0. 0. 0.]<br>[0. 0. 0. 1. 0.]<br>[0. 0. 0. 0. 0.]<br>Answer: right</div>

<dl class="where card">
<dt>Score</dt><dd>top-1 word; 6 spatial words, random: 16.7%</dd>
</dl>

<p class="plain">Below random up to 1.5B; 45% at GPT-3 175B.</p>

</div>
<div class="fig"><img src="img/week-06-wei-fig2f.png" alt="Wei et al. Figure 2F: grounded conceptual mappings; four small models at 8 to 12%, below the 16.7% random line, and GPT-3 175B at 45%"></div>
</div>

<p class="footnote">Wei et al. 2022 · Fig. 2F; Patel &amp; Pavlick 2022 (ICLR), spatial terms. In the source, the four small models are GPT-2 (124M to 1.5B, trained on WebText), drawn here with GPT-3's marker at GPT-3's FLOPs</p>

Note:
Panel F, grounded conceptual mappings, from Patel and Pavlick. The "world" is a small grid of zeros with a single one; the model has to name where the one is, using six spatial words: left, right, up, down, top, bottom. Here the one is right of centre, so the answer is "right". The prompt has 20 such solved examples, then a new world. Guessing among the six words gives 16.7%.
The four small models score 8 to 12%, below random: the source paper says they often fail to even answer with a direction word. GPT-3 175B gets 45%.
A fairness detail worth knowing: in Patel and Pavlick's paper the four small models are GPT-2, trained on a different, smaller dataset, not small GPT-3s. Wei's figure draws them with the GPT-3 marker at GPT-3's compute. So the jump here is between two different model families.

---

<p class="eyebrow"><span class="paper">Wei et al. 2022</span> · §3 · Fig. 2G</p>

## G. Can it pass exams in 57 subjects?

<div class="cols wide-fig">
<div class="text">

<div class="task"><span class="k">MMLU item (high-school maths)</span>Ten students take a biology test and receive the following scores: 45, 55, 50, 70, 65, 80, 40, 90, 70, 85. What is the mean of the students' test scores?<br>(A) 55 (B) 60 (C) 62 <b>(D) 65</b></div>

<dl class="where card">
<dt>Score</dt><dd>4 choices, average over 57 subjects; random: 25%</dd>
</dl>

<p class="plain">At ~10B and below: 25 to 30%. At 70B to 280B: 44 to 67%.</p>

</div>
<div class="fig"><img src="img/week-06-wei-fig2g.png" alt="Wei et al. Figure 2G: MMLU accuracy for GPT-3, Gopher and Chinchilla near 25% up to about 1e22 FLOPs, then GPT-3 44%, Gopher 60% and Chinchilla 67%"></div>
</div>

<p class="footnote">Wei et al. 2022 · Fig. 2G; Hendrycks et al. 2021 (MMLU), item from its high-school mathematics dev set. Chinchilla is drawn at Gopher's FLOPs (fact sheet: Table 2 gives slightly different values)</p>

Note:
Panel G, MMLU: multiple-choice exam questions in 57 subjects, from high-school level to professional exams in law and medicine. This one is high-school maths: the scores add to 650, so the mean is 65. Four options, random 25%, and the score is the average over all 57 subjects.
GPT-3, Gopher and Chinchilla all sit at 25 to 30% up to about 10 billion parameters, then jump: GPT-3 175B to 44%, Gopher 280B to 60%, Chinchilla 70B to 67%. The paper finds this striking because it suggests broad knowledge needs a lot of scale, at least for dense models without retrieval.
Fairness again: Chinchilla beats Gopher here while being four times smaller, at the same compute. On a parameter axis they'd be far apart; on this FLOPs axis they nearly overlap.

---

<p class="eyebrow"><span class="paper">Wei et al. 2022</span> · §3 · Fig. 2H</p>

## H. Does a word mean the same in two sentences?

<div class="cols wide-fig">
<div class="text">

<div class="task"><span class="k">WiC item</span>bed: There's a lot of trash on the <b>bed</b> of the river / I keep a glass of water next to my <b>bed</b> when I sleep<br><span class="k">target</span>different meaning (False)</div>

<dl class="where card">
<dt>Score</dt><dd>yes or no, one-shot; random: 50%</dd>
</dl>

<p class="plain">GPT-3 175B and Chinchilla 70B: 50%. PaLM: 49% at 62B, 63% at 540B.</p>

</div>
<div class="fig"><img src="img/week-06-wei-fig2h.png" alt="Wei et al. Figure 2H: Word in Context accuracy near 50% for GPT-3, Chinchilla and PaLM 62B, then PaLM 540B at 63%"></div>
</div>

<p class="footnote">Wei et al. 2022 · Fig. 2H, §5; Pilehvar &amp; Camacho-Collados 2019 (WiC), example from its page. §5: Brown et al. had blamed GPT-3's architecture; "further scaling a decoder-only language model was actually enough"</p>

Note:
Panel H, Word in Context. Two sentences share a word; does it mean the same thing in both? A river's bed and the bed you sleep in: different. It's a yes-or-no question, so random is 50%, and here the model gets one solved example.
GPT-3 at 175 billion and Chinchilla at 70 billion are at chance. PaLM 62B is at chance too, 49%; PaLM 540B gets 63%.
The paper uses this as its historical example. When GPT-3 failed at WiC, its authors suggested the cause was the architecture or the objective, and proposed a different kind of model. PaLM, the same kind of decoder-only model, just much larger, got above chance. Their point: from GPT-3 alone you'd have predicted scaling won't help.

---

<p class="eyebrow"><span class="paper">Wei et al. 2022</span> · §3 · what Fig. 2 shows</p>

## What has been shown, and what hasn't?

<div class="cols">
<div class="text">

<p class="plain"><b>Shown</b></p>

- Scores of separately trained models, under particular prompts and metrics.
- Near random for many sizes, then a rise at the largest one or two.
- The rise differs by family (Persian, WiC).

</div>
<div class="text">

<p class="plain"><b>Not shown</b></p>

- Anything between the last two points: they are 8x to 132x apart in compute.
- That one model changes suddenly inside.
- Whether size, data or recipe caused the rise.

</div>
</div>

<p class="footnote">Wei et al. 2022 · Fig. 2. Gaps between the last two points: our arithmetic on the TeX coordinates (PaLM 62B ▸ 540B: 8.6x; GPT-3 13B ▸ 175B: 14x; Gopher 7.1B ▸ 280B: 43x; panel F 1.3B ▸ 175B: 132x)</p>

Note:
Be precise about what Figure 2 establishes. What it shows: the measured scores of separately trained models, each with a particular prompt and metric, sit near random over many sizes and then rise at the largest one or two. And the rise depends on the family, as Persian and WiC showed.
What it doesn't show. First, what happens between the plotted points: the last two models in each family are 8 to 132 times apart in compute, with nothing measured in between, so "sudden" is partly a matter of where the models happen to be. Second, it says nothing about a single model changing during training: every point is a different model. Third, because size, compute and data move together within a family, and everything differs across families, the figure can't say which of them caused the rise.
That's still a real observation. Whether it means something special happens inside the model is a separate question, which the rest of the paper and the next reading take up.

---

<p class="eyebrow"><span class="paper">Wei et al. 2022</span> · §4 Augmented prompting strategies · Fig. 3</p>

## Can a method itself be emergent?

<div class="rows">
<div class="points">
<div class="text">

<div class="eq">$$\Delta(N) = \mathrm{score}(\text{with method}, N) - \mathrm{score}(\text{without}, N)$$</div>

</div>
<div class="text">

<dl class="where card">
<dt>Emergent</dt><dd>$\Delta \le 0$ for small models, $\Delta &gt; 0$ for large</dd>
<dt>Models</dt><dd>A to C: LaMDA; D: Anthropic's LM</dd>
<dt>Blue / black</dt><dd>with / without the method</dd>
</dl>

</div>
</div>
<div class="fig"><img src="img/week-06-wei-fig3.png" alt="Wei et al. Figure 3: chain of thought, instruction tuning, scratchpad and calibration; the method's blue curve is at or below the black baseline for small models and above it for large ones"></div>
</div>

<p class="footnote">Wei et al. 2022 · §4, Fig. 3 (rendered from the paper's TeX). $\Delta$ is our notation for their wording: a technique that "shows no improvement or is harmful ... until applied to a model of a large-enough scale"</p>

Note:
Section 4 widens the idea. The ability doesn't have to be a task; it can be the ability to benefit from a way of using the model. Take a prompting or fine-tuning method, compare the score with and without it at each size, and call the difference Delta. If Delta is zero or negative for small models and positive for large ones, the paper calls the method emergent.
In each panel, blue is with the method and black is without. Panels A to C use LaMDA; D uses a model family from Anthropic. The question in every panel: where does blue cross above black? Four slides, one each.

---

<p class="eyebrow"><span class="paper">Wei et al. 2022</span> · §4 · Fig. 3A</p>

## A. When does writing out the steps help?

<div class="cols wide-fig">
<div class="text">

<dl class="where card">
<dt>Method</dt><dd>chain of thought: worked steps in the examples, so the model writes its own steps first</dd>
<dt>Task</dt><dd>GSM8K, grade-school maths word problems</dd>
<dt>Axes</dt><dd>training FLOPs (log); accuracy</dd>
</dl>

<p class="plain">0.4B to 8B: slightly worse with steps. 68B: 11.8% vs 5.6%. 137B: 20.7% vs 6.3%.</p>

</div>
<div class="fig"><img src="img/week-06-wei-fig3a.png" alt="Wei et al. Figure 3A: GSM8K accuracy for LaMDA; chain of thought slightly below standard prompting up to 8B, then 11.8% versus 5.6% at 68B and 20.7% versus 6.3% at 137B"></div>
</div>

<p class="footnote">Wei et al. 2022 · §4, Fig. 3A; Wei et al. 2022b (chain of thought; Week 8). The text says it helps from "$10^{23}$ training FLOPs (∼100B parameters)"; Table 1 and the plot give 68B</p>

Note:
Chain-of-thought prompting: instead of examples that go straight from question to answer, the examples show the reasoning steps, and the model imitates that, writing its steps before its answer. The task is GSM8K, grade-school maths word problems.
For LaMDA at 0.4, 2 and 8 billion parameters, writing steps doesn't help; it's slightly worse. At 68 billion it doubles the score, 11.8% against 5.6%; at 137 billion, 20.7% against 6.3%. One plausible reading, not tested in this paper: small models make mistakes in the steps, and the mistakes carry through to the answer. We come back to chain of thought in Week 8.

---

<p class="eyebrow"><span class="paper">Wei et al. 2022</span> · §4 · Fig. 3B</p>

## B. When does instruction tuning help?

<div class="cols wide-fig">
<div class="text">

<dl class="where card">
<dt>Method</dt><dd>fine-tune on many tasks written as instructions (FLAN)</dd>
<dt>Task</dt><dd>10 unseen language tasks, given as instructions, no examples</dd>
<dt>Axes</dt><dd>training FLOPs (log); average score</dd>
</dl>

<p class="plain">Hurts up to 8B (44.9 vs 49.7); helps from 68B (65.9 vs 52.5).</p>

</div>
<div class="fig"><img src="img/week-06-wei-fig3b.png" alt="Wei et al. Figure 3B: average over 10 unseen tasks; the instruction-tuned LaMDA is below the untuned one up to 8B and above it from 68B"></div>
</div>

<p class="footnote">Wei et al. 2022 · §4, Fig. 3B; Wei et al. 2021 (FLAN). §4 and §5.2: Sanh et al. (T0) got similar behaviour from an 11B encoder-decoder model</p>

Note:
Instruction tuning: fine-tune the model on a mixture of many tasks, each phrased as a plain-language instruction, then test it on tasks it never saw, given only an instruction. This is the FLAN work.
For LaMDA at 8 billion and below, it hurts: 44.9 against 49.7 at 8B. At 68 billion it helps a lot, 65.9 against 52.5. The paper itself notes the threshold isn't fixed: shortly after, T0 got instruction following from an 11-billion-parameter model of a different architecture. So "emerges at 68B" belongs to this recipe, not to the method.

---

<p class="eyebrow"><span class="paper">Wei et al. 2022</span> · §4 · Fig. 3C</p>

## C. When does a scratchpad help with long addition?

<div class="cols wide-fig">
<div class="text">

<dl class="where card">
<dt>Method</dt><dd>fine-tune to write intermediate results (a scratchpad) before the answer</dd>
<dt>Task</dt><dd>8-digit addition</dd>
<dt>Axes</dt><dd>training FLOPs (log, $10^{18}$ to $10^{21}$); accuracy</dd>
</dl>

<p class="plain">Helps from ~40M parameters: 50%, then 100%. Millions, not billions.</p>

</div>
<div class="fig"><img src="img/week-06-wei-fig3c.png" alt="Wei et al. Figure 3C: 8-digit addition accuracy; with a scratchpad the curve jumps from 7% to 50% to 100% between about 3e19 and 1.4e20 FLOPs, while without it accuracy creeps from 1.5% to 33%"></div>
</div>

<p class="footnote">Wei et al. 2022 · §4, Fig. 3C; Nye et al. 2021 (scratchpad). "only helps for models of ∼$9\cdot10^{19}$ training FLOPs (40M parameters) or larger". Note the $x$ axis: 1,000x less compute than the other panels</p>

Note:
A scratchpad: fine-tune the model to write out its intermediate work, here the partial sums of a long addition, before the final answer. The task is adding two 8-digit numbers.
Look at the x axis: it runs from 10 to the 18 to 10 to the 21, a thousand times less compute than the other panels. Without a scratchpad, accuracy creeps from 1.5% to 33%. With one, the smallest models do slightly worse, then at about 40 million parameters it's 50%, and from there 100%.
So emergence isn't only a story about huge models. The scale where something switches on depends entirely on the task and the method; here it's tens of millions of parameters.

---

<p class="eyebrow"><span class="paper">Wei et al. 2022</span> · §4 · Fig. 3D</p>

## D. When does "is my answer true?" calibrate better?

<div class="cols wide-fig">
<div class="text">

<dl class="where card">
<dt>Method</dt><dd>propose an answer, then ask the model P(True) that it's right</dd>
<dt>Baseline</dt><dd>the probability of each letter choice</dd>
<dt>Axes</dt><dd>training FLOPs (log); calibration error, ECE (log, <b>reversed</b>: up is better)</dd>
</dl>

<p class="plain">52B: 1.0% vs 1.8%. But also better at 0.8B, worse at 3B and 12B.</p>

</div>
<div class="fig"><img src="img/week-06-wei-fig3d.png" alt="Wei et al. Figure 3D: expected calibration error on a reversed log axis for Anthropic's models; the True/False method is best at the largest model, better at the smallest, and worse in between"></div>
</div>

<p class="footnote">Wei et al. 2022 · §4, Fig. 3D; Kadavath et al. 2022. ECE: expected calibration error, the gap between stated confidence and actual accuracy. Plotted values: T/F 10.9, 9.1, 8.9, 1.0; letters 13.9, 7.9, 2.8, 1.8</p>

Note:
Calibration: does the model know which of its answers are right? Expected calibration error measures the gap between the confidence a model states and how often it's actually right; lower is better. The y axis here is reversed and on a log scale, so higher on the plot is better calibrated.
Two ways to get a confidence. The baseline uses the probability the model gives each letter choice. The True/False method lets the model propose an answer, then asks it for the probability that the answer is true. The paper says True/False only wins at the largest model, 52 billion: 1.0% error against 1.8%.
Check the plotted numbers, though: True/False also wins at the smallest model, 0.8 billion, 10.9 against 13.9, and loses at 3 and 12 billion. So this panel is weaker evidence than the text suggests. A good habit: read the points, not only the caption.

---

<p class="eyebrow"><span class="paper">Wei et al. 2022</span> · §4 · Table 1</p>

## At what scale does each ability appear?

<div class="rows">
<div class="points">
<div class="text">

<dl class="where card">
<dt>Each dot</dt><dd>one ability, at the training FLOPs where the paper says it emerged</dd>
<dt>Label</dt><dd>that model's size and family</dd>
</dl>

</div>
<div class="text">

- 22 abilities, from 40M parameters to 540B.
- "not an immutable property of the ability"

</div>
</div>
<div class="fig"><img src="img/week-06-wei-table1-strip.svg" alt="Our picture of Table 1: training FLOPs at which each of 22 abilities emerged, few-shot tasks on the left and augmented prompting on the right, from 40M LaMDA for a scratchpad to 540B PaLM for Word in Context"></div>
</div>

<p class="footnote">Wei et al. 2022 · Table 1 (our picture; the "many BIG-Bench tasks" row left out) and §2. Most dots are the first model above random in a family's list, so they inherit the gaps between published sizes</p>

Note:
Table 1 collects every example the paper surveys: 22 abilities, each with the scale at which it emerged. We drew it as two strips, few-shot tasks on the left and augmented methods on the right, ordered by compute.
Two readings. First, there's no single threshold: from a 40-million-parameter scratchpad model to PaLM 540B on Word in Context, five orders of magnitude of compute. The paper says plainly that the scale where an ability appears depends on the model, data and training, and "is not an immutable property of the ability".
Second, look at which sizes appear: 13B, 68B, 175B, 280B, 540B. Those are simply the sizes that the labs happened to publish. Each dot is the first published model above random, so its position is only as precise as the gaps between published models.

---

<p class="eyebrow"><span class="paper">Wei et al. 2022</span> · §5.1 Potential explanations of emergence</p>

## What could explain a jump?

<div class="cols">
<div class="text">

<p class="plain"><b>Two intuitions in the paper</b></p>

- **Depth:** $l$ sequential steps might need about $l$ layers.
- **Memory:** knowledge questions need enough parameters to store the facts.

</div>
<div class="text">

<p class="plain"><b>Or the metric</b></p>

- Exact match gives no credit for an answer that's nearly right.
- But classification tasks (Fig. 2D to H) jump too.
- So the authors test it: Appendix A.

</div>
</div>

<p class="footnote">Wei et al. 2022 · §5.1: "few compelling explanations"; exact match "may disguise compounding incremental improvements as emergence", but is "at best an incomplete explanation"</p>

Note:
Section 5.1 asks why. The authors are frank that there are "few compelling explanations". They offer two intuitions. Depth: if a task needs l steps of sequential computation, a network may need on the order of l layers, so it might be impossible below some depth. Memory: a question about world knowledge needs the fact stored somewhere, and more parameters store more facts.
Then the alternative that matters most for the next reading: the metric. Exact match gives zero credit for an answer that's one digit off, so a model could be steadily getting closer and score zero the whole time; the paper's phrase is that it "may disguise compounding incremental improvements as emergence". They don't accept it as the full story, because multiple-choice tasks, which have no long answer to get partly right, jump too. So they test it in Appendix A, which is the next six slides.

---

<p class="eyebrow"><span class="paper">Wei et al. 2022</span> · App. A.1 · Fig. 5</p>

## Does the loss move while the score doesn't?

<div class="cols wide-fig">
<div class="text">

<dl class="where card">
<dt>Models</dt><dd>LaMDA, on three generative BIG-Bench tasks</dd>
<dt>Top</dt><dd>error rate: greedy ($T=0$) and sampled ($T=1$) answers</dd>
<dt>Bottom</dt><dd>loss on the correct answer (lower: more probability on it)</dd>
<dt>Axes</dt><dd>training FLOPs (log); error rate (%) or loss (log)</dd>
</dl>

<p class="plain">Two possible outcomes: the loss is flat too, or it falls while the error doesn't.</p>

</div>
<div class="fig"><img src="img/week-06-wei-fig5.png" alt="Wei et al. Figure 5: for modified arithmetic, IPA transliterate and word unscramble on LaMDA, the error rate stays near 100% until about 1e22 FLOPs while the cross-entropy loss falls across the small models"></div>
</div>

<p class="footnote">Wei et al. 2022 · App. A.1, Fig. 5 (rendered from the paper's TeX). The analysis follows BIG-Bench's setup. "All six BIG-Bench tasks fall under Outcome 2"</p>

Note:
Appendix A.1. The idea: a score like exact match only looks at whether the final answer is right. The cross-entropy loss on the correct answer looks at how much probability the model puts on it, so it can improve even while every answer is still wrong.
They write down two outcomes before looking. Outcome 1: where the score is at random, the loss is flat too, so the small models really aren't getting better at the task. Outcome 2: the loss falls while the score sits at random, so the models are improving in a way the score hides.
Three generative tasks here, LaMDA only. The top row is error rate, so 100% is always wrong; blue is the greedy answer, temperature zero, green a sampled answer. The bottom row is the loss on the correct answer. All six tasks they check, these three and three classification tasks next, come out as Outcome 2.

---

<p class="eyebrow"><span class="paper">Wei et al. 2022</span> · App. A.1 · Fig. 5, IPA column</p>

## IPA: what happens before the jump?

<div class="cols wide-fig">
<div class="text">

<dl class="where card">
<dt>Top</dt><dd>error rate (%): 99.9 down to 99.0 up to $2.3\times10^{22}$; then 84.8, 77.5</dd>
<dt>Bottom</dt><dd>loss on the answer: 11.6 down to 7.9 over the same models; then 3.95, 3.47</dd>
</dl>

<p class="plain">The small models put more and more probability on the right answer; the score never sees it. Then an "elbow" in the loss at the jump.</p>

</div>
<div class="fig"><img src="img/week-06-wei-fig5-ipa.png" alt="Wei et al. Figure 5, IPA transliterate column: error rate flat near 100% until 2.3e22 FLOPs then 85% and 78%; cross-entropy loss falls from 11.6 to 7.9 across the same small models, then drops to about 4"></div>
</div>

<p class="footnote">Wei et al. 2022 · App. A.1, Fig. 5 (middle column), values from the TeX. "At the point of emergence as measured by error rate, we also see an 'elbow' in performance improvement for cross-entropy loss"</p>

Note:
One column up close: IPA transliteration. Across the ten smallest LaMDA models, up to 2.3 times 10 to the 22 FLOPs, the error rate barely moves, 99.9% to 99.0%. Over the same models the loss on the correct answer falls steadily, from 11.6 to 7.9. The models are getting closer; the score can't see it.
Then at the two largest models the error drops to 85% and 78%, and the loss falls much faster, to about 4. The authors point out this "elbow" in the loss at the same place as the jump. So the loss is not a smooth line straight through: it bends where the score jumps. That's important for both sides. It means the metric hides some progress, and also that something does change faster at that scale. The paper notes it without drawing a conclusion.

---

<p class="eyebrow"><span class="paper">Wei et al. 2022</span> · App. A.1 · Fig. 6</p>

## And for multiple-choice tasks?

<div class="cols wide-fig">
<div class="text">

<dl class="where card">
<dt>Tasks</dt><dd>logical arguments (5 choices), sports (2), figures of speech (10); LaMDA</dd>
<dt>Rows</dt><dd>error rate; loss on the answer; log probability of right and wrong choices</dd>
<dt>Axes</dt><dd>training FLOPs (log)</dd>
</dl>

<p class="plain">Same pattern: error near random, loss falling across the small models.</p>

</div>
<div class="fig"><img src="img/week-06-wei-fig6.png" alt="Wei et al. Figure 6: for logical arguments, sports understanding and figure of speech on LaMDA, error near random until the largest models while cross-entropy falls; bottom row, the negative log probability of correct and incorrect responses falls together and then diverges"></div>
</div>

<p class="footnote">Wei et al. 2022 · App. A.1, Fig. 6. Random error: 80%, 50%, 90%. Logical arguments has 32 examples, "which may contribute to noise"</p>

Note:
The same test on three multiple-choice tasks. Logical arguments has five choices, so guessing gives 80% error; sports understanding is plausible or implausible, 50%; figure of speech has ten choices, 90%. The top row is error rate, sitting near random until the largest models. The middle row, the loss on the correct answer, falls across the small models anyway. Same outcome as the generative tasks.
The bottom row is new, and gets its own slide. One caution on logical arguments: it has only 32 questions, so its curve is noisy; the paper says so in the caption.

---

<p class="eyebrow"><span class="paper">Wei et al. 2022</span> · App. A.1 · Fig. 6, bottom row</p>

## Why do right and wrong answers both get likelier?

<div class="cols wide-fig">
<div class="text">

<div class="task"><span class="k">sports item</span>Joao Moutinho caught the screen pass in the NFC championship<br><span class="k">choices</span>plausible · <b>implausible</b></div>

<dl class="where card">
<dt>Blue / orange</dt><dd>negative log probability of the correct / the wrong choices (lower: likelier)</dd>
</dl>

<p class="plain">Both fall together: bigger models are less extreme. At the jump they split.</p>

</div>
<div class="fig"><img src="img/week-06-wei-fig6-nll.png" alt="Wei et al. Figure 6, bottom row: negative log probability of the correct and incorrect responses for three tasks; the two fall together for small models and separate at the largest models, correct lower"></div>
</div>

<p class="footnote">Wei et al. 2022 · App. A.1, Fig. 6 (bottom row): "larger models produce less-extreme probabilities", and the two "eventually deviate at a certain scale". Item from BIG-Bench "sports_understanding"</p>

Note:
The bottom row plots, for each task, how unlikely the model finds the correct choice, in blue, and the wrong choices, in orange. Lower means the model thinks it's more likely. The sports item is implausible because Joao Moutinho is a footballer and the NFC championship is American football.
For small models both lines fall together. That seems odd, since the probabilities over the choices add to one. The paper's explanation: larger models give less extreme probabilities, fewer values near zero, so the average log probability of every choice goes up, right and wrong alike. Being less extreme isn't the same as preferring the right answer.
At the scale where accuracy jumps, the lines split: blue keeps falling, orange stops or rises. That's exactly when the model starts preferring the correct choice, and accuracy counts only that preference. The next paper builds on this kind of picture.

---

<p class="eyebrow"><span class="paper">Wei et al. 2022</span> · App. A.2 · Fig. 7</p>

## Does partial credit remove the jump?

<div class="cols wide-fig">
<div class="text">

<dl class="where card">
<dt>Tasks</dt><dd>three generative BIG-Bench tasks, rescored with every metric BIG-Bench offers</dd>
<dt>Each line</dt><dd>one metric on the same outputs</dd>
<dt>Axes</dt><dd>training FLOPs (log); score (%)</dd>
</dl>

<p class="plain">BLEU, ROUGE: overlap of words with the target. BLEURT: a learned similarity score.</p>

</div>
<div class="fig"><img src="img/week-06-wei-fig7.png" alt="Wei et al. Figure 7: modified arithmetic, IPA transliterate and periodic elements scored with exact match, ROUGE, BLEURT, BLEU, sequence F1 and multiple-choice grade; under every metric that moves, the largest gains come at the last one or two models"></div>
</div>

<p class="footnote">Wei et al. 2022 · App. A.2, Fig. 7. Word unscramble and repeat copy logic left out: "exact match is the only most sensible evaluation metric" for them</p>

Note:
Appendix A.2 takes the metric question head on. If exact match is the problem, a metric that gives partial credit should smooth the curve. So they rescore three generative tasks with every metric BIG-Bench provides. ROUGE and BLEU count words and word sequences shared with the target. BLEURT is a learned score, a model trained to judge how similar two sentences are. Sequence F1 is word overlap as precision and recall. Each line is one metric applied to the same model outputs.
Word unscramble is left out because for a single word, partial word overlap means nothing. Next slide: one panel up close.

---

<p class="eyebrow"><span class="paper">Wei et al. 2022</span> · App. A.2 · Fig. 7A</p>

## Arithmetic, scored seven ways

<div class="cols wide-fig">
<div class="text">

<dl class="where card">
<dt>BLEURT</dt><dd>12 to 22 up to $2.3\times10^{22}$, then 35, 44</dd>
<dt>Exact, ROUGE-1, F1</dt><dd>about 0, then 8 and 16 at the top two</dd>
<dt>BLEU, ROUGE-2</dt><dd>0 throughout: a one-number answer has no word pairs to match</dd>
</dl>

<p class="plain">Even the one metric above zero for small models makes its largest gains at the last two models.</p>
<p class="plain">The paper: exact match "is not a complete explanation".</p>

</div>
<div class="fig"><img src="img/week-06-wei-fig7a.png" alt="Wei et al. Figure 7A: modified arithmetic under seven metrics; BLEURT rises from 12 to 22 and then to 44, the others stay at zero until the last two models"></div>
</div>

<p class="footnote">Wei et al. 2022 · App. A.2, Fig. 7A, values from the TeX. Schaeffer et al. (next) argue these partial-credit metrics still punish small errors sharply</p>

Note:
Modified arithmetic, rescored. Exact match, ROUGE-1 and sequence F1 sit near zero for small models and reach 8 and 16 at the last two. BLEU and ROUGE-2 stay at zero throughout, because they count runs of several words and the answer is a single number. BLEURT is the exception: it's above zero from the start, rising slowly from about 12 to 22, then jumping to 35 and 44 at the last two models.
The authors' reading: even a metric that does give partial credit makes its biggest gains at the largest models, so exact match "is not a complete explanation of emergence on generative tasks". Remember this slide for Schaeffer. Their reply is that BLEU and ROUGE still behave sharply when the answer is a short number, so these aren't the smooth metrics they look like. We'll see that argument in the next reading.

---

<p class="eyebrow"><span class="paper">Wei et al. 2022</span> · §5.1 and App. A · the authors' conclusion</p>

## What did Appendix A settle?

<div class="cols">
<div class="text">

<p class="plain"><b>It found</b></p>

- Small models do improve: the loss on the answer falls.
- The score hides that improvement.
- An elbow in the loss where the score jumps.

</div>
<div class="text">

<p class="plain"><b>It did not</b></p>

- Explain why the score jumps where it does.
- Predict the scale of a jump from small models.
- Remove the jump with partial credit.

</div>
</div>

<blockquote>"this analysis does not explain why downstream metrics are emergent or enable us to predict the scale at which emergence occurs"</blockquote>

<p class="footnote">Wei et al. 2022 · §5.1; App. A.1: "these tasks are still considered emergent"</p>

Note:
The conclusion is careful, and worth stating in both directions. They found that small models do improve: the loss on the correct answer falls where the score sits at random, and accuracy or exact match hides that. They also found an elbow in the loss at the jump.
What they did not do: explain why the score jumps at that particular scale, or use the smooth loss to predict where a jump will come. And partial credit didn't remove the jumps. So they keep calling these tasks emergent, while saying in their own words that the analysis doesn't explain the jumps or let anyone predict them. That sentence is what Schaeffer et al. pick up.

---

<p class="eyebrow"><span class="paper">Wei et al. 2022</span> · §5.2 Beyond scaling</p>

## Is size the whole story?

<div class="cols wide-fig">
<div class="text">

<dl class="where card">
<dt>Each row</dt><dd>one ability the paper discusses</dd>
<dt>Filled</dt><dd>a smaller model that shows it</dd>
<dt>Open</dt><dd>larger models that lacked it, or where it was first seen</dd>
</dl>

<p class="plain">If a smaller model can have it, scale was not the only cause.</p>

</div>
<div class="fig"><img src="img/week-06-wei-beyond.svg" alt="Our picture of section 5.2: PaLM 62B above random on 14 BIG-Bench tasks where LaMDA 137B and GPT-3 175B are not; T0 11B gets instruction following first seen in FLAN 68B; InstructGPT 1.3B preferred over GPT-3 175B"></div>
</div>

<p class="footnote">Wei et al. 2022 · §5.2 (our picture) and App. F. Suggested reasons for PaLM: higher-quality data, more multilingual and code data, split digit encodings; not ablated: "the computational cost would be too high"</p>

Note:
Section 5.2 is the paper's own counterweight. Three examples. PaLM 62B is above random on 14 BIG-Bench tasks where LaMDA 137B and GPT-3 175B are at random, even though it's smaller and used less compute; the 14 tasks are listed in Appendix F. Instruction tuning first worked at 68B in FLAN, then T0 got it at 11B with a different architecture. InstructGPT at 1.3 billion, fine-tuned with human feedback, was preferred by human raters over much larger models (Week 9).
The point: if the same ability can appear in a smaller model trained differently, then model size alone didn't cause it. Data, architecture and training recipe all move the threshold. The paper suggests reasons for PaLM, better and more multilingual data, code, splitting numbers into single digits, but couldn't test them, because retraining these models is too expensive. That's the fairness question again: across families, many things change at once.

---

<p class="eyebrow"><span class="paper">Wei et al. 2022</span> · §5.3 Another view of emergence · Fig. 4</p>

## Is model size the right $x$ axis?

<div class="cols wide-fig">
<div class="text">

<dl class="where card">
<dt>Models</dt><dd>Gopher and Chinchilla, 4 sizes each</dd>
<dt>Top</dt><dd>how FLOPs, parameters and WikiText-103 perplexity relate</dd>
<dt>Bottom</dt><dd>MMLU against each of the three</dd>
</dl>

<p class="plain">Perplexity: how surprised the model is by held-out Wikipedia text. Lower is better.</p>

</div>
<div class="fig"><img src="img/week-06-wei-fig4.png" alt="Wei et al. Figure 4: top, training FLOPs against parameters and WikiText103 perplexity against FLOPs and parameters for Gopher and Chinchilla; bottom, MMLU accuracy against FLOPs, parameters and perplexity, each near 25% then rising"></div>
</div>

<p class="footnote">Wei et al. 2022 · §5.3, Fig. 4 (rendered from the paper's TeX). WikiText-103: a held-out set of Wikipedia articles; perplexity $= e^{\text{loss}}$</p>

Note:
Section 5.3 asks whether model size, or compute, is even the right thing to plot against. An alternative: plot against how good the model is at language in general, measured by its perplexity on WikiText-103, a held-out set of Wikipedia text. Perplexity is the exponential of the loss: roughly, how many equally likely next tokens the model is choosing between. Lower is better.
The top row shows how the three candidate axes relate for Gopher and Chinchilla; the bottom row plots MMLU against each one. Next slide, the bottom row up close.

---

<p class="eyebrow"><span class="paper">Wei et al. 2022</span> · §5.3 · Fig. 4, bottom row</p>

## MMLU against FLOPs, size and perplexity

<div class="cols wide-fig">
<div class="text">

<dl class="where card">
<dt>Left to right</dt><dd>$x$ = training FLOPs; parameters; WikiText-103 perplexity (reversed)</dd>
<dt>Each point</dt><dd>one model's MMLU accuracy</dd>
</dl>

<p class="plain">Against FLOPs or perplexity, the two families overlap. Against size, Chinchilla jumps 4x earlier.</p>
<p class="plain">The test this can't run: equal loss, different size.</p>

</div>
<div class="fig"><img src="img/week-06-wei-fig4-mmlu.png" alt="Wei et al. Figure 4, bottom row: MMLU accuracy for Gopher and Chinchilla against training FLOPs, model parameters and WikiText103 perplexity; the two families overlap against FLOPs and perplexity and separate against parameters"></div>
</div>

<p class="footnote">Wei et al. 2022 · §5.3, Fig. 4: the correlation with perplexity "may not hold in the future"; emergence "should probably be viewed as a function of many correlated variables". In the right panel, Gopher's points are drawn at Chinchilla's perplexities (fact sheet)</p>

Note:
The bottom row. On the left, MMLU against training compute: Gopher and Chinchilla nearly overlap, because they used similar compute at each step. In the middle, against parameters: they separate, Chinchilla reaching 67% at 70B while Gopher needs 280B for 60%. On the right, against perplexity, with the axis reversed so better models are to the right: they overlap again.
So within these two families, compute and perplexity line up, and the paper says MMLU looks emergent against either. But it's careful: that correlation holds for these models and "may not hold in the future", for example for retrieval models that get low perplexity with fewer parameters.
Notice what this figure can't test. To learn whether loss alone predicts the jump, you'd want models with the same loss but very different sizes. Here, at every loss level there are only these two families, which line up. That's the bridge to your question of what a fair comparison would need.

---

<p class="eyebrow"><span class="paper">Wei et al. 2022</span> · beyond the paper · comparing models fairly</p>

## What would a fair comparison need?

<div class="cols wide-fig">
<div class="text">

- **Fixed data:** one $D$, vary $N$. What GPT-3, Gopher, PaLM did.
- **Fixed compute:** many $(N, D)$ with equal $6ND$; take the best (Chinchilla).
- **Equal loss:** different sizes, same loss. Does size matter beyond loss?
- One grid of $N \times D$, one recipe, several seeds, answers all three.

</div>
<div class="fig"><img src="img/week-06-wei-designs.svg" alt="Illustration on the parameters-tokens map: a horizontal fixed-data line, a dashed fixed-compute diagonal, the dotted compute-optimal line D = 20N meeting it at about 70B, and a dash-dot equal-loss curve from Chinchilla's fitted loss"></div>
</div>

<p class="footnote">Our illustration, not in Wei et al. Equal-loss curve: Chinchilla's fit $\hat L = 1.69 + 406.4/N^{0.34} + 410.7/D^{0.28}$ at $\hat L = 2.2$; fixed compute at Gopher's $5.8\times10^{23}$ FLOPs. You can't fix $N$, $D$ and $C$ at once: $C \approx 6ND$</p>

Note:
Back to the question of fairness, now with the paper's own tools. There are different ways to compare models, and each answers a different question. Draw them on the same parameters-against-tokens map.
Fixed data, the solid horizontal line: one number of tokens, many sizes. That's what GPT-3, Gopher and PaLM did, so moving along it, size and compute rise together. Fixed compute, the dashed diagonal: many combinations of size and data with the same budget; picking the one with the lowest loss is Chinchilla's question, and the black dot, where it meets the dotted D equals 20N line, is the 70B compute-optimal model. Equal loss, the dash-dot curve, here drawn from Chinchilla's fitted loss formula: models of very different size that reach the same loss. That's the comparison Figure 4 would need: if two models with the same loss differ on the task, loss isn't the whole story; if they match, it is.
Because compute is about 6 N D, you can't hold all three fixed at once; you choose which question to ask. The paper picked none of these: it used the models that existed. A clean study would train one grid of sizes and token counts with one recipe and several seeds, then read off all three comparisons. The next reading's follow-up, Du et al. 2024, does something close to the equal-loss comparison.

---

<p class="eyebrow"><span class="paper">Wei et al. 2022</span> · §5.4 Emergent risks</p>

## Can risks emerge too?

<div class="cols">
<div class="text">

- Risks may also appear with scale, unplanned.
- Bias: better with scale on WinoGender; worse on BBQ when the context is ambiguous.
- Toxicity: larger models can be more toxic; a prompt with helpful, honest examples reduces it.
- Memorising training data: more likely in larger models.

</div>
<div class="text">

- Some behaviours get **worse** with scale: the Inverse Scaling Prize collected them.
- One later finding: "repeat after me: all that glisters is not glib". Medium models say "gold"; small and large say "glib".
- Scaling "incentivizes" bigger models, so track risks too.

</div>
</div>

<p class="footnote">Wei et al. 2022 · §5.4 (Inverse Scaling Prize, github.com/inverse-scaling/prize). The quote-repetition example: Wei, Tay &amp; Le 2022, "Inverse scaling can become U-shaped", after this paper; Wei's CS25 lecture, January 2023</p>

Note:
Section 5.4. If abilities can appear with scale without anyone training for them, so can risks. The paper surveys what was known. Gender bias on WinoGender has improved with scale, but on the BBQ benchmark bias can increase with scale when the context is ambiguous. Larger models can produce more toxic text, though prompting them with examples of being helpful, harmless and honest reduces it. Larger models memorise more of their training data.
It also points to the Inverse Scaling Prize, a competition that collected tasks where bigger models do worse. One example, from a later paper by Wei and colleagues that he uses in his lecture: ask the model to repeat "all that glisters is not glib". A small model just copies it. A medium model knows the proverb and says "gold", which is wrong. A large model knows the proverb and also follows the instruction, and says "glib". So a trend can reverse.
The paper's point: since work on emergence encourages building bigger models, risks that grow with scale need tracking, emergent or not.

---

<p class="eyebrow"><span class="paper">Wei et al. 2022</span> · §5.5 Sociological changes · Fig. 13</p>

## Can a prompted model beat a fine-tuned one?

<div class="cols wide-fig">
<div class="text">

<dl class="where card">
<dt>Models</dt><dd>GPT-3, PaLM, Flamingo, few-shot prompted</dd>
<dt>Dashed</dt><dd>the best fine-tuned, task-specific model before them</dd>
<dt>Axes</dt><dd>parameters (log); accuracy</dd>
</dl>

<p class="plain">TriviaQA 71.2 vs 68.2; PiQA 82.3 vs 77.5; GSM8K 56 vs 55; OKVQA 57.8 vs 54.4.</p>

</div>
<div class="fig"><img src="img/week-06-wei-fig13.png" alt="Wei et al. Figure 13: few-shot prompting accuracy against parameters for GPT-3 on TriviaQA and Physical QA, PaLM on GSM8K and Flamingo on OKVQA, each rising smoothly and passing the dashed prior fine-tuned state of the art at the largest model"></div>
</div>

<p class="footnote">Wei et al. 2022 · §5.5, App. D, Fig. 13: "These abilities are not necessarily emergent since they have smooth, predictable scaling curves." GSM8K is grade-school maths; OKVQA asks questions about images</p>

Note:
Section 5.5 is about a different kind of change: in how the field works. NLP used to build one model per task, fine-tuned on that task's data. Figure 13, in the appendix, shows the turning point: a general model, only prompted with a few examples, beating the best fine-tuned model. GPT-3 175B on TriviaQA and on physical commonsense questions; PaLM 540B on grade-school maths; Flamingo 80B, which reads images, on visual question answering.
Notice the curves: they rise smoothly. The authors say so themselves: these are not emergent abilities. What's emergent here, in their sense, is sociological: the switch toward general-purpose models, and the applications that followed.

---

<p class="eyebrow"><span class="paper">Wei et al. 2022</span> · App. A.3, App. E · Fig. 8</p>

## Which BIG-Bench tasks look emergent?

<div class="cols wide-fig">
<div class="text">

<dl class="where card">
<dt>Tasks</dt><dd>all 210 BIG-Bench tasks, labelled by two co-authors</dd>
<dt>Each bar</dt><dd>one keyword; split into emergent (LaMDA/GPT-3, PaLM), smooth, flat</dd>
</dl>

- 67 emergent, 58 smooth, 45 flat, 40 other.
- Most emergent share: analogy, word senses, truthfulness.
- Arithmetic and maths: few. "No clear trends."

</div>
<div class="fig"><img src="img/week-06-wei-fig8.png" alt="Wei et al. Figure 8: number of BIG-Bench tasks per keyword tag, split into emergent with LaMDA or GPT, emergent with PaLM, smoothly increasing and flat"></div>
</div>

<p class="footnote">Wei et al. 2022 · App. A.3, App. E, Fig. 8 (rendered from the paper's TeX). Counts: our count of App. E (25 emergent with LaMDA/GPT-3, 42 with PaLM). "Other": too few examples, not correlated with scale, and so on</p>

Note:
Appendix A.3. The authors went through all 210 BIG-Bench tasks by hand and labelled each: emergent, smoothly increasing, flat, meaning no model beats random, or other. By our count of their appendix: 67 emergent, of which 25 already with LaMDA or GPT-3 and 42 only with PaLM; 58 smooth; 45 flat; 40 other, for example too few examples to tell. Because "near random" is a judgement, two co-authors had to agree on every emergent label.
Each bar is one BIG-Bench keyword, split by label. The keywords with the highest share of emergent tasks are analogical reasoning, word sense, truthfulness, social reasoning and emotional understanding. Arithmetic and maths have relatively few, which surprised them, since the first examples of emergence were arithmetic. Their summary: no clear trends. The flat tasks, visual reasoning most of all, are the candidates for future emergence.

---

<p class="eyebrow"><span class="paper">Wei et al. 2022</span> · §5.6 Directions, §6 Conclusions</p>

## What do the authors say comes next?

<div class="cols">
<div class="text">

- Scale further, and train better: more data, better architectures.
- Better prompting may bring abilities to smaller models.
- The 45 flat tasks are where to look for the next ones.

</div>
<div class="text">

- Understand emergence: their analyses "did not provide complete answers".
- Their proposed test: a synthetic task made of sub-tasks; watch each sub-task as scale grows.

</div>
</div>

<p class="footnote">Wei et al. 2022 · §5.6: "create a synthetic task that requires multiple compositional sub-tasks and evaluate how each of those sub-tasks improve with scale"; §6: emergent abilities "are unpredictable"</p>

Note:
Section 5.6 lists future work. Keep scaling, but also train better: Chinchilla is cited for data, and sparse models and retrieval for efficiency. Better prompting might bring emergent abilities down to smaller models. The flat BIG-Bench tasks, things like chess and hard maths, are the obvious candidates for the next emergent abilities.
And understanding emergence, which they admit they haven't done: their analyses "did not provide complete answers to why emergence occurs or how to predict it". Their most testable suggestion: build a synthetic task out of several sub-tasks and measure each sub-task as models grow. If each sub-task improves smoothly and the whole task only works once all of them are good enough, the jump is the sub-tasks combining. That's very close to the argument in the next reading.

---

<p class="eyebrow"><span class="paper">Wei et al. 2022</span> · the first author's lecture, CS25, January 2023</p>

## What does Wei say in his own lecture?

<div class="cols">
<div class="text">

- You can't predict these abilities from small models.
- The subtext: "why we should keep scaling".
- The opposite case: one narrow task, a small budget, lots of data. Small models win there.
- Predicting emergence: "haven't seen a lot of work".

</div>
<div class="text">

<p class="plain">A student asked: does exact match make things look emergent?</p>

<blockquote>"even if you use partial credit metrics you'll often still see the same type of emergence"</blockquote>

<p class="plain">Schaeffer et al. test exactly this.</p>

</div>
</div>

<p class="footnote">Wei, "Scaling unlocks emergent abilities in language models", Stanford CS25, 24 Jan 2023 (slides and YouTube transcript). Not part of the paper</p>

Note:
A step outside the paper. Six months after it was published, Jason Wei gave a lecture on it in Stanford's CS25 course. His summary slide says you can't predict these abilities by looking at small models. He's open about the subtext: emergence is an argument for why we should keep scaling, because these abilities are hard to find any other way. He also names the opposite case from industry: when you know the one task you need, have a tight compute budget and lots of in-domain data, as with a translation product, a small model trained for that task is the right choice. And he says almost no one is working on predicting emergence.
In the questions, a student asked whether the way the tasks are scored, with credit only for a perfect answer, makes things look emergent. His answer is on the slide: even with partial-credit metrics you often still see the jump. That's Appendix A.2, Figure 7. Three months after this lecture, Schaeffer, Miranda and Koyejo published a paper testing exactly that question. That's the next reading.

---

<p class="eyebrow"><span class="paper">Wei et al. 2022</span> · later work</p>

## What came after?

<div class="cols">
<div class="text">

- **Schaeffer et al. 2023** (next): rescore the same outputs; many jumps vanish with a continuous metric.
- **Du et al. 2024:** plot against pre-training loss; some thresholds remain.
- **Lu et al. 2024:** many "emergent" abilities may be in-context learning plus memory.

</div>
<div class="text">

- Not settled: is there an internal change at a reproducible scale that survives a change of metric?

</div>
</div>

<p class="footnote">Schaeffer, Miranda &amp; Koyejo 2023, arXiv:2304.15004 (Reading 4). Du et al. 2024, arXiv:2403.15796. Lu et al. 2024, arXiv:2309.01809</p>

Note:
Briefly, because the next reading is the main follow-up. Schaeffer, Miranda and Koyejo took fixed model outputs and rescored them: most of the BIG-Bench emergent cases use one of two metrics, and switching to a continuous metric removes many of the jumps. They also manufactured jumps on purpose in vision models.
Du et al. 2024 did something close to the equal-loss comparison: they plot task performance against pre-training loss, for models of different sizes, and still find thresholds for some tasks even with continuous metrics. Lu et al. argue many so-called emergent abilities are in-context learning combined with memorised knowledge.
So the question is open: is there an internal change at a reproducible scale that survives changing the metric and the prompt?

---

<p class="eyebrow"><span class="paper">Wei et al. 2022</span> · summary</p>

## What to keep from Wei

<div class="cols">
<div class="text">

- Many task curves: near random over several sizes, then a rise.
- Study abilities, not only average loss.
- The thresholds move with data and recipe (§5.2).
- App. A: loss on the answer improves while the score doesn't.

</div>
<div class="text">

- A survey of other labs' models: not controlled for data, recipe or loss.
- Picked from existing benchmarks, not predicted in advance.
- "Phase transition" is the weakest claim.

</div>
</div>

<p class="footnote">Wei et al. 2022. Next: Schaeffer et al. 2023 turn the metric question into a testable argument</p>

Note:
What to keep. The observation is solid: on many tasks, measured performance sits near random over several model sizes and then rises quickly. The paper made the scaling of specific abilities a subject of its own, beyond average loss. Its own section 5.2 shows the thresholds move with data and recipe. And its most revealing analysis is in Appendix A, where the loss on the correct answer improves while the score stays flat.
The limits, on the right. It's a survey of other labs' models, so the comparisons aren't controlled for data, recipe or loss; that was the fairness question. The examples were picked from existing benchmarks because they looked emergent; no jump was predicted in advance and then confirmed. And the phase-transition language is the weakest part: a sharp benchmark curve isn't evidence of a phase transition inside the network.
So the paper shows that apparent jumps exist much more convincingly than it shows they're fundamentally unpredictable. Next, Schaeffer et al. ask whether the jump is in the model or in the metric.



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

<p class="footnote">Schaeffer et al. 2023 · §2. Illustration: tokens right or wrong independently, as in their model.</p>

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

<p class="footnote">Our illustration: a logistic in log compute is continuous at any steepness. Our critique, not in the paper</p>

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

<p class="footnote">Our framing, not in the paper. Compare the experiment in the closing section</p>

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

<p class="footnote">Revisions: Porian et al. 2024, Pearce &amp; Song 2024, Besiroglu et al. 2024, Sardana et al. 2024, Hu et al. 2024, Du et al. 2024, Snell et al. 2024 (earlier in the deck)</p>

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

<p class="eyebrow">What held up · the thread</p>

## How do the four readings connect?

<div class="cols">
<div class="text">

- **Kaplan 2020:** loss falls as a power law in size, data and compute.
- **Chinchilla 2022:** at a fixed budget, grow size and data together, about 20 tokens per parameter.

</div>
<div class="text">

- **Wei 2022:** task scores can sit at random, then rise, while loss falls smoothly.
- **Schaeffer 2023:** many of those rises come from scoring smooth progress with a harsh metric.

</div>
</div>

<p class="footnote">Kaplan et al. 2020; Hoffmann et al. 2022; Wei et al. 2022; Schaeffer et al. 2023</p>

Note:
The thread through the four readings. Kaplan: loss follows predictable power laws in model size, data and compute. Chinchilla: at a fixed compute budget, grow model size and data together, about 20 tokens per parameter. Wei: task scores can sit at random over many sizes and then rise, even while loss falls smoothly. Schaeffer: many of those rises come from scoring smoothly improving predictions with metrics that only reward a perfect answer.

---

<p class="eyebrow">What held up · a proposal</p>

## What experiment would settle it?

<div class="cols">
<div class="text">

- One model family, a synthetic task with known sub-steps.
- Many sizes, several seeds, one recipe.
- Measure accuracy, the answer's log-likelihood, the margin, and each sub-step.
- Fit the small models; predict the large ones, with error bars.

</div>
<div class="text">

- If only accuracy jumps: no new mechanism is needed.
- If the sub-steps and the internals jump too, at a reproducible scale: look for the mechanism, with controls.

</div>
</div>

<p class="footnote">Our proposal, building on Wei et al. §5.6 ("a synthetic task that requires multiple compositional sub-tasks") and the Wei section's fair-comparison slide</p>

Note:
How would you tell a metric effect from a real change? Two hypotheses. One: the quantities that matter improve smoothly, and a metric that only rewards perfect answers turns that into a jump. Two: the model learns a qualitatively different way of solving the task over a narrow range of scale.
A minimal test: one model family, a synthetic task with known intermediate steps, many sizes and several seeds, trained with one recipe so the comparisons are fair. Measure the final accuracy, the log-likelihood of the correct answer, the decision margin, and whether each intermediate step is right. Fit on the small models and predict the large ones, with uncertainty.
If accuracy jumps while everything else is smooth, there's no reason to invoke a new mechanism. If the sub-steps and the model's internal computation also change, at a scale that reproduces across seeds, then mechanistic emergence becomes interesting, and you'd still need controls for optimisation, data coverage and parameterisation.

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
