<!-- .slide: id="week-07" class="cover week" -->

<h1>Week 7</h1>
<p class="subtitle">Mixture of Experts and Sparse Models</p>

Note:
Mixture of experts: how to store far more parameters than each token uses. First the layer built step by step, then three readings: Mixtral, the Cai et al. survey, and the DeepSeek line, and a last slide on per-layer embeddings.


---

<p class="eyebrow"><span class="paper">Week 7</span> · overview · the readings</p>

## What will this week read, and what does each reading ask?

<div class="cols wide-text">
<div class="text">

<table class="rules">
  <tr><td>reading</td><td>the question it asks</td></tr>
  <tr><td>GShard 2021 (background)</td><td>how do you send a token to an expert?</td></tr>
  <tr><td>Mixtral 2024</td><td>can 13B parameters per token match 70B?</td></tr>
  <tr><td>Cai et al. 2024 (survey)</td><td>what would you have to decide to build one?</td></tr>
  <tr><td>DeepSeekMoE and V3 2024</td><td>what changes when experts are many and small?</td></tr>
  <tr><td>per-layer embeddings</td><td>is there another way to store more than you use?</td></tr>
</table>

</div>
<div class="text">

- A **mixture of experts** (MoE) stores many feed-forward networks and sends each token to only a few.
- A **feed-forward network** (FFN) is the two-layer block that follows attention in every Transformer layer.
- Week 6 said loss falls with parameters and cost grows with parameters; a mixture of experts splits the two.

</div>
</div>

<p class="footnote">arXiv IDs: GShard 2006.16668, Mixtral 2401.04088, Cai et al. 2407.06204, DeepSeekMoE 2401.06066, DeepSeek-V3 2412.19437</p>

Note:
Week 6 ended with a clean rule: loss falls as a power law in the number of parameters N, and every token costs about 2N multiply-adds. In a dense model those are the same number, so a model that knows more costs more on every token, forever, at serving time. A mixture of experts breaks that link. It stores many feed-forward networks, the experts, and lets a small router send each token to only a few of them. Mixtral holds 47 billion parameters and uses 13 billion per token; DeepSeek-V3 holds 671 billion and uses 37 billion. The question for the week is whether a parameter that is stored but unused on most tokens is worth as much as a dense one. Week 6's laws were fitted on dense models.
The historical twist: the idea is older than the Transformer (Jacobs et al. 1991; Shazeer et al. 2017 at scale). GShard made it work for Transformers at 600 billion parameters for translation. Mixtral then showed an open sparse language model matching a dense model with five times its active parameters, and the DeepSeek line showed that many small experts, a few always-on shared experts, and a router balanced without an extra loss work better than GShard's recipe. The table lists the five readings and the question each one asks. We read GShard first only for its mechanism, since Mixtral builds on it.

---

<p class="eyebrow"><span class="paper">Week 7</span> · overview · roadmap</p>

## How is the hour laid out?

<div class="cols wide-text">
<div class="text">

<table class="rules">
  <tr><td>part</td><td>the question it answers</td></tr>
  <tr><td>1. Why sparse</td><td>does a parameter you rarely use count like one you always use?</td></tr>
  <tr><td>2. The layer, step by step</td><td>how does a router turn one token into a weighted sum of experts?</td></tr>
  <tr><td>3. Keeping experts busy</td><td>what goes wrong when the router is left alone?</td></tr>
  <tr><td>4. Mixtral</td><td>can a 13B-active model match a 70B one?</td></tr>
  <tr><td>5. The survey's map</td><td>what would you have to decide to build one?</td></tr>
  <tr><td>6. The DeepSeek line</td><td>what changes with many small experts and no balancing loss?</td></tr>
  <tr><td>7. Per-layer embeddings</td><td>how else can a model store more than it uses?</td></tr>
  <tr><td>Synthesis</td><td>what is established, and what is still open?</td></tr>
</table>

</div>
<div class="text">

- Parts 1 to 3 build the mechanism from the bottom, with one worked example of four experts.
- Parts 4 to 6 read the papers, each in its own order, with its experiments and limits.
- Part 7 and the synthesis return to the opening question.

</div>
</div>

<p class="footnote">The worked example (ours): four experts, top 2, router scores (2.0, 1.0, 0.5, -1.0). Experts are numbered 1 to 4 on every slide</p>

Note:
Parts 1 to 3 are the mechanism, built from the bottom the way we built RLHF in Week 4: one step per slide, each with a worked number, before any paper's results. Parts 4 to 6 then walk the papers: Mixtral in full, the survey as a map of the design choices, and the DeepSeek papers for their key results. Part 7 is a short closing look at per-layer embeddings, which Gemma 3n and Gemma 4 use to store more than they use in a different way. One running example carries Parts 2 and 3: four experts, a token whose router scores are 2.0, 1.0, 0.5 and minus 1.0, top 2. Part 3 follows a group of eight tokens through the same four experts. Mixtral's paper numbers experts from 0; we number them from 1 throughout so the slides agree.

---

<p class="eyebrow"><span class="paper">Mixture of experts</span> · Part 1, why sparse · recap</p>

## What did Weeks 4 and 6 already tell us?

<div class="cols wide-fig">
<div class="text">

- A **dense** model uses every parameter on every token: stored equals used.
- **Total parameters**: everything stored. They set memory. Mixtral calls this the "sparse" count.
- **Active parameters**: those one token uses. They set compute per token.
- Forward cost is about $2N$ FLOPs per token; Week 6's $6N$ adds the backward pass.

<div class="eq">$$\text{forward cost per token} \approx 2N\ \text{FLOPs}$$</div>

<dl class="where">
<dt>$N$</dt><dd>the parameters a token uses: all of them in a dense model, the active ones in an MoE</dd>
<dt>FLOPs</dt><dd>floating-point operations, here one multiply-add counted as 2</dd>
</dl>

</div>
<div class="fig"><img src="img/week-04-raschka-moe.svg" alt="Illustration: percent of parameters used per token: GPT-3 175B 100 percent, Qwen3-235B-A22B 9.4 percent, DeepSeek V3 5.5 percent, gpt-oss-120b 4.4 percent, Llama 4 Maverick 4.2 percent, Kimi K2 3.2 percent"></div>
</div>

<p class="footnote">Mixtral §2.1 defines both counts. Right: Week 4's active shares. Check (ours): a dense 70B model costs about 140 GFLOPs per token; 13B active, about 26</p>

Note:
This is a recap, so keep it quick. In a dense model, parameters stored equal parameters used per token, and the forward cost is about 2N FLOPs: one multiply and one add per weight. Week 6's 6N for training is that forward 2N plus about 4N for the backward pass. The feed-forward block is the biggest block of weights; in GPT-3 it is about two thirds of them, as Week 4 showed.
Week 4 gave two counts and we use them all week. Total parameters are everything stored; they set the memory you need. Active parameters are the ones one token touches; they set compute per token. Mixtral's paper calls the total the sparse count and the active count the active count. The picture is Week 4's table of active shares: 3 to 10 percent in 2025's largest open models. Check: a dense 70B model costs about 140 GFLOPs per token, Mixtral's 13B active parameters about 26.

---

<p class="eyebrow"><span class="paper">Mixture of experts</span> · Part 1, why sparse · the open question</p>

## Does a parameter you store but rarely use count like one you always use?

<div class="cols wide-text">
<div class="text">

- Week 6's power laws were fitted on dense models, where total and active are the same $N$.
- A sparse model has two $N$s, so the laws do not say which one to plug in.
- If total counted fully, Mixtral would get a dense 47B model's loss at a 13B model's cost.
- If only active counted, sparsity would buy nothing. The truth is in between, and the readings give partial answers.

</div>
<div class="text">

<table class="rules">
  <tr><td>reading</td><td>what it compares against</td></tr>
  <tr><td>Mixtral</td><td>dense Llama 2 models; no matched run</td></tr>
  <tr><td>DeepSeekMoE</td><td>a dense model with all experts always on (Part 6)</td></tr>
  <tr><td>GShard</td><td>a 2.3B dense model that is not compute-matched</td></tr>
</table>

<p class="plain">We keep this question open and return to it in the synthesis.</p>

</div>
</div>

<p class="footnote">Week 6: Kaplan et al. 2020 fitted loss against dense $N$. Active and total are Mixtral's terms (§2.1)</p>

Note:
Week 6's laws say loss falls as a power law in the parameter count N. They were fitted on dense models. A mixture of experts has two numbers where a dense model has one. If the total count were what mattered, Mixtral would reach the loss of a dense 47B model at the cost of a 13B model. If only the active count mattered, the extra experts would be dead weight and sparsity would buy nothing. Neither extreme is likely; the question is where in between.
None of the readings answers it cleanly. Mixtral, whose training data is not described, compares against dense Llama 2 models, so there is no matched run. DeepSeekMoE compares against a dense model in which every expert is always on, an upper bound; we meet that in Part 6. GShard compared a 600B MoE against a 2.3B dense model that was not matched in compute. Keep the question in mind; the closing slides come back to it.

--

<p class="eyebrow"><span class="paper">Mixture of experts</span> · Part 1, why sparse · GShard Fig. 1 · optional</p>

## What did GShard buy with 600B parameters?

<div class="cols wide-fig">
<div class="text">

- The largest model reported has 600B parameters and trained on 2048 TPU cores in 4 days.
- It scored 44.3 average BLEU, against 36.9 for a dense 2.3B model.
- That dense model took about 235.5 TPU core-years; the MoE took 22.4.
- The dense baseline is not compute-matched per token (ours), so this is a cost story, not a law.

</div>
<div class="fig"><img src="img/week-07-gshard-fig1-cost.png" alt="GShard Figure 1: translation quality against model size and training cost, comparing the mixture-of-experts models from 37.5B to 600B parameters with a dense 2.3B model and 100 bilingual baselines"></div>
</div>

<p class="footnote">Lepikhin et al. 2021 (arXiv:2006.16668), Fig. 1, Table 3. BLEU: a 0 to 100 score of word-sequence overlap with a human translation. TPU core-year: cores times years</p>

Note:
Optional. GShard's headline: a 600B-parameter MoE translating 100 languages to English, trained in four days on 2048 TPU v3 cores, 22.4 core-years in all, for an average BLEU of 44.3. The dense 2.3B baseline trained with pipeline parallelism reached 36.9 and cost about 235.5 core-years, more than ten times as much. The caption says 37.5B to 600B is 16 times the size and 3.6 times the cost. Caveats: the paper reports no ablation against a dense model of the same compute per token, so the comparison is a cost comparison with one baseline. The experiments section also says it scaled beyond 1 trillion parameters; that run had numerical-stability problems and its results were left out, so 600B is the biggest reported.

---

<p class="eyebrow"><span class="paper">Mixture of experts</span> · Part 2, the layer · the idea</p>

## Why replace the FFN, and not attention?

<div class="cols wide-fig">
<div class="text">

- The FFN holds most of the weights and works on each token alone.
- So tokens can go to different FFNs without changing anything else.
- Attention mixes tokens and stays shared by all of them.
- An **MoE block**: attention, then $n$ experts shaped like the old FFN, plus a **router** that picks which ones see the token.

</div>
<div class="fig"><img src="img/week-07-mixtral-fig1-layer.png" alt="Mixtral Figure 1: an input vector goes to a router that picks 2 of 8 feed-forward experts, and the layer's output is the weighted sum of the two chosen experts"></div>
</div>

<p class="footnote">Jiang et al. 2024, Mixtral (arXiv:2401.04088), Fig. 1. An <b>expert</b> is a standard FFN. The router is also called the gating network</p>

Note:
Why the FFN? It holds most of the weights, and it acts on each token independently: token five's FFN output does not depend on token six. That means we can give different tokens to different FFNs and nothing else in the model has to change. Attention is different: it mixes information across tokens, so it needs to be shared. In an MoE block, attention is unchanged. The single FFN is replaced by n copies of the same shape, called experts, and a small router decides which experts see each token. Figure 1 from the Mixtral paper shows exactly that: the router picks 2 of 8 experts and the output is the weighted sum of those two.
The survey's stated reason for leaving attention alone, relayed from another paper, is the hypothesis that attention layers show lower sparsity and less domain specificity than FFN layers. The survey cites one paper (Pan et al., DS-MoE) as measuring more sparsity in FFN layers than in attention; we did not read it, so treat it as a hypothesis with one supporting report.

---

<p class="eyebrow"><span class="paper">Mixture of experts</span> · Part 2, the layer · Step 1, score</p>

## How does the router score the experts?

<div class="cols wide-fig">
<div class="text">

<div class="eq">$$\ell = x\,W_g$$</div>

<dl class="where">
<dt>$x$</dt><dd>the token's hidden state, a vector of length $d$ (4096 in Mixtral)</dd>
<dt>$W_g$</dt><dd>the router's weights, a $d \times n$ matrix with one column per expert</dd>
<dt>$\ell$</dt><dd>the <b>logits</b>: one raw score per expert, $n$ numbers</dd>
</dl>

- The router is one linear map, no hidden layer.
- Our example: $\ell = (2.0,\ 1.0,\ 0.5,\ -1.0)$ for experts 1 to 4.

<p class="plain">In words: each expert gets one score for this token; a higher score means a better match.</p>

</div>
<div class="fig"><img src="img/week-07-router.png" alt="Our router example in three panels: the four logits 2.0, 1.0, 0.5 and minus 1.0; the top 2 kept; and the softmax weights 0.731 for expert 1 and 0.269 for expert 2"></div>
</div>

<p class="footnote">Jiang et al. 2024 §2.1. Logits and weights in the picture are our worked example (ours)</p>

Note:
The router is tiny: one matrix multiply. A token's hidden state x, a vector of length 4096 in Mixtral, is multiplied by W g, a 4096 by 8 matrix with one column per expert, giving 8 scores, called logits. In our four-expert example the scores are 2.0, 1.0, 0.5 and minus 1.0. That is about 4096 times 8, 32768 weights per layer, and about one million in all 32 layers (ours), against 45 billion in the experts. The picture's first panel shows these four scores; the next slides use panels 2 and 3.

---

<p class="eyebrow"><span class="paper">Mixture of experts</span> · Part 2, the layer · Step 2, keep the top $K$</p>

## Why keep only the top $K$, and why $K = 2$?

<div class="cols wide-fig">
<div class="text">

<div class="eq">$$\mathrm{TopK}(\ell)_i = \begin{cases}\ell_i & \text{if } \ell_i \text{ is among the } K \text{ largest}\\ -\infty & \text{otherwise}\end{cases}$$</div>

<dl class="where">
<dt>$\ell_i$</dt><dd>the router's score for expert $i$</dd>
<dt>$K$</dt><dd>how many experts one token uses; Mixtral sets $K = 2$</dd>
</dl>

- With $K = 2$ our scores become $(2.0,\ 1.0,\ -\infty,\ -\infty)$.
- Experts 3 and 4 never run for this token: that is where compute is saved.
- $K$ sets compute per token; the number of experts $n$ sets the total.

</div>
<div class="fig"><img src="img/week-07-router.png" alt="Our router example in three panels; the second panel shows the top 2 of 4 scores kept and the other two set to minus infinity"></div>
</div>

<p class="footnote">Jiang et al. 2024 §2.1. Why 2: Mixtral gives no reason; GShard uses 2, Switch Transformer uses 1. Survey §4.1 relays M6-t (a Chinese multimodal MoE), not monotone in $K$</p>

Note:
TopK keeps the K largest scores and sets the rest to minus infinity. For us, experts 1 and 2 survive, and experts 3 and 4 are masked. Those two experts do not run for this token at all, which is exactly where the saving comes from. K sets the compute per token; if you raise the number of experts n while holding K fixed, the parameter count grows and the cost per token stays about the same. That is the paper's own description of why it distinguishes total from active parameters.
Why K equals 2? Mixtral gives no reason. GShard also uses 2, Switch uses 1. The survey relays one comparison, from M6-t, a Chinese multimodal mixture-of-experts model, where the order of perplexity was not monotone in K: four groups of top-1 gating beat one top-4, which beat one top-16, which beat one top-1. The survey says most work finds a larger K helps, so M6-t is one counterexample: there is no clean rule that more experts per token is always better. Use the router picture's second panel here.

---

<p class="eyebrow"><span class="paper">Mixture of experts</span> · Part 2, the layer · Step 3, weights</p>

## How do the kept scores become weights?

<div class="cols wide-fig">
<div class="text">

<div class="eq">$$G(x) = \mathrm{Softmax}\big(\mathrm{TopK}(xW_g)\big)$$</div>

<dl class="where">
<dt>$G(x)_i$</dt><dd>the <b>gate</b>: the weight expert $i$ gets for token $x$</dd>
<dt>Softmax</dt><dd>$\mathrm{Softmax}(v)_i = e^{v_i} / \sum_j e^{v_j}$ for a score vector $v$</dd>
<dt>$e^{-\infty}$</dt><dd>equals 0, so masked experts get weight 0</dd>
</dl>

- Only the two kept scores share the weight, and the weights sum to 1.
- Ours: $(e^{2},\ e^{1}) / (e^{2} + e^{1}) = (0.731,\ 0.269)$ for experts 1 and 2.

<p class="plain">In words: the stronger kept expert gets the bigger share, and the rest get nothing.</p>

</div>
<div class="fig"><img src="img/week-07-router.png" alt="Our router example; the third panel shows the softmax weights 0.731 for expert 1, 0.269 for expert 2, and 0 for experts 3 and 4"></div>
</div>

<p class="footnote">Jiang et al. 2024 §2.1: "the softmax over the Top-K logits". Arithmetic (ours): $e^2 = 7.389$, $e^1 = 2.718$, sum 10.107</p>

Note:
Softmax turns scores into weights that are positive and sum to 1. Because the masked scores are minus infinity, their exponentials are 0, so only the two kept experts share the weight. The arithmetic: e squared is 7.389, e to the one is 2.718, the sum is 10.107, so the weights are 0.731 and 0.269. Experts 3 and 4 get exactly 0. Notice that only the gap between the two kept scores matters: a gap of 1 gives 0.731 and 0.269, and adding 100 to both scores changes nothing. That fact comes back in Step 5 and in GShard's gate. The third panel of our picture shows these weights.

---

<p class="eyebrow"><span class="paper">Mixture of experts</span> · Part 2, the layer · Step 4, the output</p>

## What does the layer output?

<div class="cols wide-fig">
<div class="text">

<div class="eq">$$y = \sum_{i=1}^{n} G(x)_i\, E_i(x) = 0.731\,E_1(x) + 0.269\,E_2(x)$$</div>

<dl class="where">
<dt>$x$, $y$</dt><dd>the token's input to the layer, and the layer's output for it</dd>
<dt>$n$, $K$</dt><dd>the number of experts, 8 in Mixtral, and experts used per token, 2</dd>
<dt>$E_i(x)$</dt><dd>expert $i$'s output; Mixtral's experts are SwiGLU FFNs</dd>
<dt>$G(x)_i$</dt><dd>the gate from the last slide; the right-hand side is our example</dd>
</dl>

- The layer is applied independently per token: neighbours can use different experts.
- Mixtral uses an MoE in every layer, 32 of them.

</div>
<div class="fig"><img src="img/week-07-mixtral-fig1-layer.png" alt="Mixtral Figure 1: the router picks 2 of 8 feed-forward experts and the output is the weighted sum of their two outputs"></div>
</div>

<p class="footnote">Jiang et al. 2024 §2.1. <b>SwiGLU</b>: Week 4's gated FFN; the paper names it but does not define it</p>

Note:
The layer's output is the weighted sum of the experts' outputs, with the gate as the weights. In our example it is 0.731 times expert 1's output plus 0.269 times expert 2's. Written for Mixtral, the paper's formula is y equals the sum over i of Softmax of Top2 of x W g, element i, times SwiGLU i of x, with n equal 8 and K equal 2. Each expert is a SwiGLU FFN, the gated FFN from Week 4. The paper names SwiGLU but never writes its form. The layer is applied independently per token, so two neighbouring tokens can use different experts. Since only two experts run, we skip the other six: that is the compute saving.

---

<p class="eyebrow"><span class="paper">Mixture of experts</span> · Part 2, the layer · Step 5, learning</p>

## How does the router learn, if choosing is not differentiable?

<div class="cols wide-text">
<div class="text">

<div class="eq">$$\frac{\partial \mathcal L}{\partial \ell_3} = \frac{\partial \mathcal L}{\partial \ell_4} = 0 \quad\text{for this token}$$</div>

<dl class="where">
<dt>$\mathcal L$</dt><dd>the training loss</dd>
<dt>$\ell_3$, $\ell_4$</dt><dd>the router's scores for experts 3 and 4, masked by TopK</dd>
</dl>

- The top-$K$ choice itself has no gradient. Only the kept two weights, through the softmax, do.
- Unchosen experts, and their router columns, get nothing from this token.
- A rarely chosen expert is rarely trained, so it is chosen even less: the seed of **router collapse** (Part 3).

</div>
<div class="text">

- With $K = 1$ and softmax after TopK, the one weight is always 1, so the router gets no gradient at all (ours).

<p class="plain">The router learns only from the experts it picked, so it can never learn that an unpicked expert was better.</p>

</div>
</div>

<p class="footnote">Survey §4.4.1 relays the two orders: TopK then softmax (Shazeer et al. 2017; also Mixtral §2.1), softmax then TopK (GShard, Switch). The $K = 1$ reasoning is ours</p>

Note:
The loss depends on y equal 0.731 E1 plus 0.269 E2. Gradients flow into the router scores for experts 1 and 2 through the softmax. Because softmax only depends on the gap between the two kept scores, in effect the router learns to widen or narrow that gap, and to change which experts are chosen only indirectly, through the other tokens. Experts 3 and 4 got masked to minus infinity, so the loss does not depend on their scores, and neither they nor their router columns receive any gradient from this token. Consequence: an expert that is rarely chosen is rarely trained, so it stays worse, so it is chosen even less. That is the start of Part 3.
A subtlety, our reasoning: with K equal 1 and softmax after TopK, the single remaining score gets weight exactly 1 whatever its value, so the output does not depend on the router at all and no gradient reaches it. The survey (in its training-schemes section) notes the two orders: softmax then TopK for GShard, Switch and OpenMoE, and TopK then softmax for Shazeer et al.'s original gating; Mixtral's own formula, from its paper, is the second order. Our reading is that this is why Switch keeps the raw softmax probability of the chosen expert as its weight: the weight then varies with the router and gives it a gradient. The Switch paper's own reason was not read for this deck.

---

<p class="eyebrow"><span class="paper">Mixture of experts</span> · Part 2, the layer · GShard's gate</p>

## Is GShard's gate the same as Mixtral's?

<div class="cols wide-text">
<div class="text">

<div class="eq">$$y \approx 0.731\,E_1(x) + 0.538 \times 0.269\,E_2(x)$$</div>

<dl class="where">
<dt>$y$</dt><dd>GShard's expected output for our token</dd>
<dt>$E_1(x)$, $E_2(x)$</dt><dd>the outputs of experts 1 and 2 for token $x$</dd>
<dt>$0.731$, $0.269$</dt><dd>the two kept weights, renormalised by their sum</dd>
<dt>$0.538$</dt><dd>the chance the second expert is used, $2g_2$, with $g_2 = 0.269$</dd>
</dl>

- GShard takes softmax over all experts first, then keeps the top 2 and renormalises them.

</div>
<div class="text">

- GShard uses the second expert only with probability $2g_2$, to save buffer space.
- It also puts MoE in every other layer, uses ReLU experts and caps each expert's load.
- Mixtral calls GShard's second-expert gating "more elaborate".

<p class="plain">The weights match because a ratio of two exponentials ignores the other experts.</p>

</div>
</div>

<p class="footnote">Lepikhin et al. 2021 §2.2, Algorithm 1; Jiang et al. 2024 §2.1. The expected-output line and softmax values are our arithmetic (ours)</p>

Note:
GShard's gate: softmax over all four scores first, giving 0.609, 0.224, 0.136 and 0.030 (ours); take the top two, 0.609 and 0.224; renormalise by their sum, 0.833: 0.731 and 0.269. Those are exactly Mixtral's weights, because the ratio e squared over e squared plus e is independent of the other scores. So the two designs give the same weights when both experts are used. Why GShard needs the full softmax: its balancing loss, next part, uses the mean probability of every expert.
Where they differ. GShard sends a token to its second expert only with probability 2 g2, where g2 is the renormalised second weight; here 2 times 0.269 is 0.538. It does this to save expert capacity when the second expert's weight is small. When the second expert is skipped, the token keeps weight 0.731 alone; nothing renormalises it again, which is our reading of the algorithm. So the expected output is 0.731 E1 plus 0.538 times 0.269 E2 (ours; it is an expectation over the random choice, not an output the layer produces on any single run). GShard also uses ReLU experts, and MoE in every other layer, where Mixtral uses it in every layer. Mixtral's words: GShard "uses a more elaborate gating strategy for the second expert". The next slide shows GShard's Fig. 3.

--

<p class="eyebrow"><span class="paper">Mixture of experts</span> · Part 2, the layer · GShard Fig. 3 · optional</p>

## Where do the experts sit in GShard's Transformer?

<div class="cols wide-fig">
<div class="text">

- Every other FFN in the encoder is replaced by an MoE layer.
- The rest of the layers, attention included, are the same on every device.
- Experts are sharded: each device holds some experts, and tokens travel to them.
- Mixtral replaces every FFN, not every other one.

</div>
<div class="fig"><img src="img/week-07-gshard-fig3-encoder.png" alt="GShard Figure 3: a Transformer encoder with every other feed-forward layer replaced by a mixture-of-experts layer, and the experts spread across devices while all other layers are replicated"></div>
</div>

<p class="footnote">Lepikhin et al. 2021 (arXiv:2006.16668), Fig. 3 and §2.1. <b>Sharded</b>: split across devices rather than copied to each</p>

Note:
Figure 3 of GShard: panel (a) is a standard Transformer encoder, attention and FFN alternating with residual connections and layer norm; (b) replaces every other FFN with an MoE layer; (c) shows what that means on many devices: the MoE layer is sharded across devices, while all other layers are replicated. In the paper's experiments the number of experts per MoE layer equals the number of devices. The decoder is modified the same way. Each expert has the same shape as an ordinary FFN: 1024 model dimension and 8192 hidden dimension.

---

<p class="eyebrow"><span class="paper">Mixture of experts</span> · Part 2, the layer · counting</p>

## How many parameters does Mixtral have, total and active?

<div class="cols wide-fig">
<div class="text">

<div class="eq">$$\text{one expert} = 3 \times 4096 \times 14336 = 176.2\text{M}$$</div>

<dl class="where">
<dt>3</dt><dd>the three weight matrices of a SwiGLU FFN (assumed; the paper does not say)</dd>
<dt>4096</dt><dd>the model dimension, <code>dim</code> in Table 1</dd>
<dt>14336</dt><dd>the expert's hidden size, <code>hidden_dim</code> in Table 1</dd>
</dl>

- Total: $8 \times 32 \times 176.2$M $= 45.1$B in experts, plus 1.34B attention and 0.26B embeddings: 46.7B.
- Active: $2 \times 32 \times 176.2$M $= 11.3$B plus the shared parts: 12.9B.
- "8x7B" is not 56B: only the FFNs are copied eight times.

</div>
<div class="fig"><img src="img/week-07-mixtral-params.png" alt="Our stacked bars for Mixtral: 46.7B total parameters and 12.9B active parameters, split into experts, attention, embeddings and router"></div>
</div>

<p class="footnote">Jiang et al. 2024 Table 1, abstract and §3 (47B, 13B). All counts are our arithmetic (ours), assuming SwiGLU with three matrices and untied embeddings</p>

Note:
The paper says 47B total and 13B active but never derives them. From Table 1, ours: one SwiGLU expert has three matrices of 4096 by 14336, 176.2 million parameters. All experts: 8 times 32 times 176.2 million, 45.1 billion. Attention is 1.34 billion, with 32 query heads and 8 key-value heads of dimension 128, the embeddings and output matrices 0.26 billion untied, the routers one million. Total 46.7 billion, which rounds to the paper's 47. Active: only 2 experts per layer, 2 times 32 times 176.2 million is 11.3 billion, plus 1.34, 0.26 and the router, 12.9 billion, which rounds to 13. Total over active is 3.6, and 70 over 13 is about 5.4, the paper's "5x".
Why 8x7B is not 56B: attention and embeddings are shared, not copied. Memory point, once: serving needs all 46.7 billion in memory, so the memory cost is proportional to the total, 47B, which is still less than Llama 2 70B, as the paper notes. The paper's own caveat is that active-parameter comparisons ignore memory cost and hardware utilisation, and that MoE suits batched workloads. Its claim of faster inference has no speed measurement in the paper.

--

<p class="eyebrow"><span class="paper">Mixture of experts</span> · Part 2, the layer · counting · optional</p>

## What does the active count leave out?

<div class="cols wide-text">
<div class="text">

- Active parameters are proportional to compute per token, not to memory.
- Memory needs all 46.7B stored, even though only 12.9B run for a token.
- The router adds overhead, and loading several experts per device costs memory traffic.
- The authors say MoE suits **batched** workloads, where many tokens share each expert load.

</div>
<div class="text">

<table class="rules">
  <tr><td>count</td><td>Mixtral</td><td>sets</td></tr>
  <tr><td>total (sparse)</td><td>46.7B (ours)</td><td>memory</td></tr>
  <tr><td>active</td><td>12.9B (ours)</td><td>compute per token</td></tr>
  <tr><td>compute ratio vs Llama 2 70B</td><td>about 5.4x (ours)</td><td>paper says 5x</td></tr>
</table>

</div>
</div>

<p class="footnote">Jiang et al. 2024 §3 (size and efficiency paragraph). The ratio 70 / 12.9 is our arithmetic (ours)</p>

Note:
The paper's own caveat: the efficiency analysis focuses on active parameter count, which is proportional to inference compute, but does not consider memory costs and hardware utilisation. The memory cost of serving Mixtral is proportional to the sparse count, 47B. The router adds overhead, and running more than one expert per device means more memory loads; MoE layers are more suitable for batched workloads where you can reach a good degree of arithmetic intensity. The introduction claims faster inference at low batch size and higher throughput at large batch size, but no speed or throughput measurement appears anywhere in the paper.

---

<p class="eyebrow"><span class="paper">Mixture of experts</span> · Part 3, keeping experts busy · the problem</p>

## What goes wrong if the router is left alone?

<div class="cols wide-text">
<div class="text">

- **Router collapse**: the router sends most tokens to a few experts and the others stay untrained.
- It feeds itself: more tokens, more gradient, a better expert, so the router prefers it more.
- GShard: most tokens go "to a small number of experts ... leaving other experts untrained".
- DeepSeekMoE names a second cost: computation bottlenecks across devices.

</div>
<div class="text">

<table class="rules nohead">
  <tr><td>step 1</td><td>an expert gets slightly more tokens</td></tr>
  <tr><td>step 2</td><td>it gets more gradient, so it trains faster</td></tr>
  <tr><td>step 3</td><td>the router scores it higher</td></tr>
  <tr><td>step 4</td><td>back to step 1, with a bigger lead</td></tr>
</table>

<p class="plain">From here on: a group of $S = 8$ tokens and the same four experts.</p>

</div>
</div>

<p class="footnote">Lepikhin et al. 2021 §2.2; Dai et al. 2024, DeepSeekMoE (arXiv:2401.06066) §3.3. The four-step loop is our summary of Step 5 (ours)</p>

Note:
From Step 5: an expert that is slightly ahead early in training gets more tokens, so more gradient, so it improves faster, so the router prefers it more. GShard describes it: without a balancing term, most tokens seen during training would be dispatched to a small number of experts, amassing a very large input buffer for only a few busy experts, and leaving other experts untrained. DeepSeekMoE names two costs: the risk of routing collapse, and, if experts sit on different devices, load imbalance that worsens computation bottlenecks. The next slide is about the second cost.

---

<p class="eyebrow"><span class="paper">Mixture of experts</span> · Part 3, keeping experts busy · time</p>

## Why does imbalance cost time, not just quality?

<div class="cols wide-fig">
<div class="text">

- **Expert parallelism** (EP): experts live on different GPUs, and tokens travel to their expert's GPU and back.
- The travel is an **all-to-all** exchange: every GPU sends to and receives from every other.
- A layer finishes when its busiest GPU finishes.
- Mixtral: EP "introduces challenges in load balancing".

</div>
<div class="fig"><img src="img/week-07-ep.png" alt="Our bars for expert parallelism on 4 GPUs: 16 token-expert pairs split 8, 4, 2 and 2 across the GPUs; the layer waits for the busiest GPU"></div>
</div>

<p class="footnote">Jiang et al. 2024 §2.1. Example (ours): 8 tokens times 2 experts is 16 pairs on 4 GPUs. Balanced, each does 4; here the busiest does 8, so the layer takes 2 times as long</p>

Note:
Expert parallelism puts different experts on different GPUs. Tokens meant for a specific expert are routed to the corresponding GPU, and the expert's output is returned to the token's original place. That exchange is an all-to-all. The layer cannot finish until the slowest GPU does. In our picture, 8 tokens each choose 2 experts, 16 token-expert pairs on 4 GPUs: a balanced layer would give each GPU 4, but here the split is 8, 4, 2 and 2, so the layer waits for the GPU with 8, twice as long as balanced (ours). With one expert per GPU no GPU can get more than 8, since each token's two experts are different. The other three GPUs sit idle part of the time. Mixtral's paper says EP introduces challenges in load balancing, as it is essential to distribute the workload evenly across the GPUs.

---

<p class="eyebrow"><span class="paper">Mixture of experts</span> · Part 3, keeping experts busy · capacity</p>

## Why would you ever drop a token?

<div class="cols wide-fig">
<div class="text">

<div class="eq">$$C = \frac{2S}{E}$$</div>

<dl class="where">
<dt>$C$</dt><dd>the <b>expert capacity</b>: the most tokens one expert accepts from a group</dd>
<dt>$S$</dt><dd>the number of tokens in a group</dd>
<dt>$E$</dt><dd>the number of experts</dd>
</dl>

- GShard's layer is a few fixed-shape tensor products, so each expert needs a fixed buffer.
- Ours: $S = 8$, $E = 4$, so $C = 4$. If 6 tokens pick expert 1 first, 2 do not fit.

</div>
<div class="fig"><img src="img/week-07-capacity.png" alt="Our capacity example: 8 tokens, 4 experts, capacity 4 each; 6 first choices land on expert 1, so 2 are over capacity"></div>
</div>

<p class="footnote">Lepikhin et al. 2021 §2.2 and Algorithm 2 (buffers shaped group by token by expert by capacity). Worked example (ours)</p>

Note:
Why a cap at all? GShard's layer is implemented as a few big tensor products with fixed shapes: buffers of shape groups by tokens by experts by capacity. So each expert needs a fixed buffer size. GShard sets it to 2 S over E tokens per group of S: two choices per token, spread over E experts. Our example: S is 8, E is 4, so C is 4. If 6 tokens choose expert 1 first, 4 fit and 2 do not. The two that do not fit can still reach their second expert. Only a token whose experts are both full is overflowed: its MoE output is zero, and the residual connection carries it on unchanged. In the algorithm, first choices have priority over second choices, because the second pass keeps counting on top of the first. A caveat: GShard reports no overflow rate and no ablation of the capacity.

---

<p class="eyebrow"><span class="paper">Mixture of experts</span> · Part 3, keeping experts busy · capacity</p>

## What happens to an overflowed token, and how do later models avoid it?

<div class="cols wide-text">
<div class="text">

- An **overflowed** token has both experts full: its MoE output is zero.
- It is not lost: the **residual connection** carries its input to the next layer unchanged.
- Megablocks writes the expert step as block-sparse products that take any number of tokens per expert.
- DeepSeekMoE's small models keep all experts on one GPU and drop no tokens.

</div>
<div class="text">

<table class="rules">
  <tr><td>model</td><td>how it treats overflow</td></tr>
  <tr><td>GShard</td><td>caps each expert at $2S/E$; overflow skips the layer</td></tr>
  <tr><td>Mixtral</td><td>says nothing about training</td></tr>
  <tr><td>DeepSeekMoE</td><td>drops none (2B, 16B)</td></tr>
  <tr><td>DeepSeek-V3</td><td>drops none, in training or inference</td></tr>
</table>

</div>
</div>

<p class="footnote">Jiang et al. 2024 §2.1 (Megablocks, kernels released for vLLM); Dai et al. 2024 §4, 5; DeepSeek-V3 §2.1.2. A <b>residual connection</b> adds a layer's input to its output</p>

Note:
An overflowed token is not destroyed. The MoE sublayer outputs zero for it, and because every Transformer sublayer sits inside a residual connection, the token's representation passes to the next layer unchanged. It simply skipped this layer's expert computation. How later models avoid dropping: Megablocks, which Mixtral cites, casts the expert FFN as large block-sparse matrix multiplications, which naturally handle different experts getting a variable number of tokens, so there is no fixed buffer to overflow; Mixtral's authors released changes to vLLM that integrate those kernels. DeepSeekMoE puts all experts on one GPU for its 2B and 16B models and drops no tokens; the 145B model does not say; DeepSeek-V3 reports no token dropping in training or inference. Mixtral's paper says nothing about how it balanced experts in training or whether it dropped tokens.

---

<p class="eyebrow"><span class="paper">Mixture of experts</span> · Part 3, keeping experts busy · GShard's loss</p>

## How do you push the router towards balance?

<div class="cols wide-text">
<div class="text">

<div class="eq">$$\ell_{\rm aux} = \frac{1}{E}\sum_{e=1}^{E} \frac{c_e}{S}\, m_e,\qquad \mathcal L = \ell_{\rm nll} + k\,\ell_{\rm aux}$$</div>

<dl class="where">
<dt>$E$, $S$</dt><dd>the number of experts, and the tokens in a group</dd>
<dt>$c_e$</dt><dd>how many tokens chose expert $e$ first; it has no gradient</dd>
<dt>$m_e$</dt><dd>the mean router probability of expert $e$ over the group; it has a gradient</dd>
<dt>$k$</dt><dd>the loss weight (never stated in the paper); $\ell_{\rm nll}$ is the usual language loss</dd>
</dl>

</div>
<div class="text">

- Goal: equal fractions $c_e/S$. They sum to 1, so $\sum_e (c_e/S)^2$ is smallest when equal.
- Problem: $c_e$ is a count from a top-$K$ choice, so there is no gradient (Step 5).
- Fix: replace one factor $c_e/S$ with the differentiable $m_e$.

<p class="plain">In words: penalise giving a lot of tokens to an expert that the router also likes.</p>

</div>
</div>

<p class="footnote">Lepikhin et al. 2021 §2.2, Algorithm 1. $c_e$ counts first choices only. "nll": negative log-likelihood, the language-model loss</p>

Note:
What we want: the fractions c e over S of tokens whose first choice is expert e to be equal. They sum to 1, so their sum of squares is smallest when they are equal; so minimise the sum of squares. Problem: c e is a count from a top-K choice and has no gradient (2.6). GShard's fix, in its own words: replace the square of c e over S by m e times c e over S, where m e is the mean router probability of expert e over the group, which can be optimised by gradient descent. Algorithm 1 writes the loss as one over E times the sum of c e over S times m e, and adds it as k times that to the language loss. The paper never says what k is. A comment in the paper's LaTeX source says c e counts top-1 dispatches, and it is taken before the second-choice pass. The prose says c e is derived from the top-2 operation; the algorithm shows it is the top-1 count. The survey writes the same loss up to a constant factor, as N times the sum of D i P i, with D i the share of tokens and P i the share of probability.

---

<p class="eyebrow"><span class="paper">Mixture of experts</span> · Part 3, keeping experts busy · worked example</p>

## What does the loss do on a balanced and a collapsed router?

<div class="cols wide-fig">
<div class="text">

<div class="eq">$$\frac{\partial \ell_{\rm aux}}{\partial m_e} = \frac{c_e}{S\,E}$$</div>

<dl class="where">
<dt>$\ell_{\rm aux}$</dt><dd>GShard's auxiliary loss from the last slide</dd>
<dt>$m_e$</dt><dd>the mean router probability of expert $e$</dd>
<dt>$c_e$, $S$, $E$</dt><dd>the first-choice count of expert $e$, tokens in the group, number of experts</dd>
</dl>

- Balanced, $c/S = m = 0.25$ each: loss $\frac14 \cdot 4 \cdot 0.0625 = 0.0625$ (ours).
- Collapsed, all 8 first choices on expert 1, $m = (0.7, 0.1, 0.1, 0.1)$: loss $\frac14 \cdot 0.7 = 0.175$ (ours).
- The busiest expert's probability is pushed down hardest.

</div>
<div class="fig"><img src="img/week-07-auxloss.png" alt="Our bars for the auxiliary loss with 4 experts and 8 tokens: a balanced router gives 0.0625 and a collapsed router gives 0.175"></div>
</div>

<p class="footnote">Lepikhin et al. 2021, Algorithm 1. Both cases are our worked example with $E = 4$, $S = 8$ (ours)</p>

Note:
Ours, E equals 4, S equals 8. Balanced: every fraction and every mean probability is 0.25, the loss is one quarter times four times 0.0625, which is 0.0625, equal to one over E squared. Collapsed: all 8 first choices go to expert 1 and the mean probabilities are 0.7, 0.1, 0.1, 0.1, so the loss is one quarter times 1 times 0.7, which is 0.175. The gradient with respect to m e is c e over S E, largest for the busiest expert, so its probability is pushed down hardest; the idle experts get no direct push and rise only because the softmax must still sum to 1.
Caveat for the notes: one over E squared is the value at an even spread, not a floor. With E equal 2 and S equal 3, two tokens at probabilities (0.51, 0.49) and one at (0, 1), the loss is 0.223, below the balanced 0.25 (ours), because the loss also rewards load that runs against mean probability. In practice it pushes towards balance, and the survey's statement that one is the minimum has the same caveat.

---

<p class="eyebrow"><span class="paper">Mixture of experts</span> · Part 3, keeping experts busy · the trade-off</p>

## Can you balance too hard?

<div class="cols wide-text">
<div class="text">

- The balancing loss fights the language loss: forcing even use can send a token to a worse expert.
- DeepSeekMoE: "excessive constraints on load balance will compromise model performance".
- So the loss weight is kept small: 0.01 or less.
- DeepSeek-V3 drops the loss in favour of a bias on the scores (Part 6).

</div>
<div class="text">

<table class="rules">
  <tr><td>model</td><td>loss weight</td></tr>
  <tr><td>DeepSeekMoE 2B</td><td>0.01</td></tr>
  <tr><td>DeepSeekMoE 16B</td><td>0.001</td></tr>
  <tr><td>DeepSeekMoE 145B</td><td>0.003</td></tr>
  <tr><td>DeepSeek-V3, per sequence</td><td>0.0001</td></tr>
</table>

</div>
</div>

<p class="footnote">Dai et al. 2024 §3.3, 4, 5, 7; DeepSeek-V3 §4.2 (expert-level weights; 145B also has a device-level weight 0.05)</p>

Note:
The auxiliary loss has a cost. It fights the language-model loss: forcing every expert to be used equally can send a token to a worse expert than the router wanted. DeepSeekMoE says excessive constraints on load balance will compromise model performance, and that under its parallelism a higher expert-level balance factor cannot improve computation efficiency but compromises performance. So the weights are small, though not monotone in size: 0.01 for the 2B model, 0.001 for 16B, 0.003 for 145B, where there is also a device-level weight of 0.05 because experts sit on four devices. V3 sets a balance loss weight of 0.0001 only to avoid extreme imbalance within a single sequence, and does the main balancing with a bias, which Part 6 explains. The next slide is an optional reference card for the symbols the papers use.

--

<p class="eyebrow"><span class="paper">Mixture of experts</span> · Part 3, keeping experts busy · notation · optional</p>

## Which letters do the papers use for the same things?

<div class="cols wide-text">
<div class="text">

<table class="rules" style="font-size:17px">
  <tr><td>meaning</td><td>Mixtral</td><td>GShard</td><td>survey</td><td>DeepSeekMoE</td><td>V3</td></tr>
  <tr><td>number of experts</td><td>$n$</td><td>$E$</td><td>$N$</td><td>$N'$</td><td>$N_r$</td></tr>
  <tr><td>experts per token</td><td>$K$ (2)</td><td>top 2</td><td>$k$</td><td>$K'$</td><td>$K_r$</td></tr>
  <tr><td>tokens</td><td>none</td><td>$S$ (group)</td><td>$T$ (batch)</td><td>$T$ (sequence)</td><td>$T$ (sequence)</td></tr>
  <tr><td>load share</td><td>none</td><td>$c_e/S$</td><td>$\mathcal D_i$</td><td>$f_i$</td><td>$f_i$</td></tr>
  <tr><td>mean probability</td><td>none</td><td>$m_e$</td><td>$\mathcal P_i$</td><td>$P_i$</td><td>$P_i$</td></tr>
</table>

</div>
<div class="text">

- $T$ means the tokens of one sequence in DeepSeekMoE's and V3's loss, but a whole batch in the survey.
- That difference is the one Part 6 turns on.
- In DeepSeekMoE and V3, $f_i$ is scaled by $N'/K'$ (or $N_r/K_r$), so it equals 1 at balance, unlike $c_e/S$.
- $N'$ and $K'$ count routed experts after splitting experts into smaller ones (Part 6).

</div>
</div>

<p class="footnote">Lepikhin et al. 2021 §2.2; Cai et al. 2024 Eq. 6 to 8; Dai et al. 2024 Eq. 12 to 14; DeepSeek-V3 Eq. 17 to 20. Mixtral has no balancing loss</p>

Note:
A reference card; the same idea carries a different letter in each paper. Number of experts: n in Mixtral, E in GShard, N in the survey, N prime in DeepSeekMoE, N r in V3 (r for routed). Experts per token: K, top 2, k, K prime, K r. Tokens: S for GShard's group; T in the others, but with different meanings: the survey's T counts the tokens of a whole batch, whereas DeepSeekMoE's and V3's loss counts the tokens of one sequence. That difference matters in Part 6, where V3 balances per batch with a bias but per sequence with its small loss. Load share: GShard's c e over S, the survey's D i, and f i in the DeepSeek papers; f i there is scaled by N prime over K prime, so a perfectly balanced router gives f i equal to 1, while c e over S equals one over E. Mean probability: m e, P script i, and P i. Mixtral has no balancing loss in its paper.


---


<!-- .slide: class="cover divider" -->

<p class="kicker">Reading 1 of 3</p>
<h1>Jiang et al. 2024</h1>
<p class="subtitle">Mixtral of Experts</p>
<p class="question">Can a model that uses 13B parameters per token match a 70B one?</p>
<ol class="track"><li class="now">Mixtral 2024<span>sparse 8x7B</span></li><li>Cai et al. 2024<span>the survey's map</span></li><li>DeepSeekMoE and V3<span>many small experts</span></li></ol>

Note:
Reading 1 of 3. Jiang and colleagues at Mistral AI, January 2024. It is a short paper, 13 pages with the appendix, and the first open sparse language model that was widely used. We walk through it in its own order: the architecture, the benchmark results, the instruct model, and the routing analysis. Keep one question in mind as we go: the paper shows a strong model, but does it show that sparsity is the reason?

---

<p class="eyebrow"><span class="paper">Jiang et al. 2024</span> · Part 4, architecture · what it is</p>

## What is Mixtral?

<div class="cols wide-text">
<div class="text">

- Mixtral is Mistral 7B with every feed-forward network (FFN) replaced by 8 experts; each token uses 2.
- Each **expert** is one SwiGLU feed-forward block, the gated FFN form Mistral and Llama use.
- **Total parameters** are all the weights stored: 47B. **Active parameters** are those one token uses: 13B.

</div>
<div class="text">

<table class="rules" style="font-size:16px">
  <tr><td>setting</td><td>value</td><td>meaning</td></tr>
  <tr><td>dim</td><td>4096</td><td>width of the hidden state</td></tr>
  <tr><td>n_layers</td><td>32</td><td>Transformer blocks</td></tr>
  <tr><td>hidden_dim</td><td>14336</td><td>width inside one expert</td></tr>
  <tr><td>n_heads, n_kv_heads</td><td>32, 8</td><td>query heads, key/value heads</td></tr>
  <tr><td>head_dim</td><td>128</td><td>size of one head</td></tr>
  <tr><td>context_len</td><td>32768</td><td>tokens the model reads at once</td></tr>
  <tr><td>vocab_size</td><td>32000</td><td>distinct tokens</td></tr>
  <tr><td>num_experts, top_k_experts</td><td>8, 2</td><td>experts per layer, chosen per token</td></tr>
</table>

</div>
</div>

<p class="footnote">Jiang et al. 2024, "Mixtral of Experts", arXiv:2401.04088, §2, Table 1. Base and instruct weights released under Apache 2.0, a permissive open-source licence</p>

Note:
This is Table 1 of the paper, with a meaning column added. Mixtral keeps Mistral 7B's architecture and swaps each feed-forward block for 8 experts and a router that picks 2 per token. The paper says the model has a fully dense 32k context, and its Table 1 shows 32 query heads sharing 8 key/value heads, which is grouped-query attention, although the paper does not use that name. Every layer is an MoE layer; GShard, which you saw in Part 3, made only every other layer one.
Numbering: the paper numbers experts from 0 to 7. We number from 1 on every slide; the paper's expert 0 is our expert 1.
The two counts matter later. Memory to serve the model follows the 47B, because every expert must be loaded. Compute per token follows the 13B. The name 8x7B suggests 56B, but attention and embeddings are shared across experts, so the real total is about 47B. The paper never derives either number; the next slide does, from Table 1 (ours).

--

<p class="eyebrow"><span class="paper">Jiang et al. 2024</span> · Part 4, architecture · optional</p>

## How do 47B and 13B follow from Table 1?

<div class="cols wide-fig">
<div class="text">

- One expert has three $4096 \times 14336$ matrices: 176M weights (ours).
- All 8 experts in all 32 layers: 45.1B. Two per token: 11.3B (ours).
- Attention (1.34B), embeddings (0.26B) and routers (1M) are used by every token (ours).
- Total 46.7B and active 12.9B, which the paper rounds to 47B and 13B (ours).

</div>
<div class="fig"><img src="img/week-07-mixtral-params.png" alt="Illustration: two bars, total 46.7 billion parameters and active per token 12.9 billion; in both, the experts are almost all of the bar, then attention, then a sliver for embeddings and router"></div>
</div>

<p class="footnote">Our arithmetic from Table 1, assuming three-matrix SwiGLU experts and untied embeddings; the paper does not state either</p>

Note:
Optional arithmetic, ours. A SwiGLU expert has three matrices, 4096 by 14336, so 3 times 4096 times 14336, which is 176,160,768 weights. Eight experts in each of 32 layers is 45.1 billion. Attention per layer: queries and output are 4096 by 4096, keys and values are 4096 by 1024, so 2 times 4096 squared plus 2 times 4096 times 1024, about 41.9 million; over 32 layers 1.34 billion. Embedding in and out, untied, is 2 times 32000 times 4096, 0.26 billion. Add the routers and the total is 46.70 billion.
Active: only 2 of 8 experts per layer, so 11.3 billion in experts plus the same 1.6 billion of shared weights gives 12.88 billion. Total over active is 3.6. The paper's headline "5x fewer active parameters" is 70 over 13, which is 5.4 (ours).

---

<p class="eyebrow"><span class="paper">Jiang et al. 2024</span> · Part 4, setup · the runs</p>

## What did they run, and what do they not tell us?

<div class="cols wide-text">
<div class="text">

<table class="rules">
  <tr><td>#</td><td>what they ran</td><td>where</td></tr>
  <tr><td>1</td><td>base model against Llama 2 7B, 13B, 70B, Llama 1 34B and Mistral 7B, six benchmark groups</td><td>Table 2, Figs. 2, 3</td></tr>
  <tr><td>2</td><td>against Llama 2 70B and GPT-3.5</td><td>Table 3</td></tr>
  <tr><td>3</td><td>French, German, Spanish, Italian</td><td>Table 4</td></tr>
  <tr><td>4</td><td>long context: passkey, perplexity</td><td>Fig. 4</td></tr>
  <tr><td>5</td><td>bias: BBQ and BOLD</td><td>§3.3 table</td></tr>
  <tr><td>6</td><td>instruct model: fine-tuning, then human votes</td><td>Fig. 6</td></tr>
  <tr><td>7</td><td>routing analysis on the Pile</td><td>Figs. 7 to 10, Table 5</td></tr>
</table>

</div>
<div class="text">

- **Not disclosed**: training data and token count, compute, optimiser and router balancing.
- Also missing: whether it started from Mistral 7B, the seeds, and any ablation.
- No dense model of the same size was trained, and there are no error bars.
- Remember this: it shapes every critique later.

</div>
</div>

<p class="footnote">Jiang et al. 2024 · §3 to §5. The paper does not number its experiments; the numbers are ours. BBQ, BOLD, passkey and the Pile are defined where they appear</p>

Note:
The paper has no numbered experiments, so here are seven sets of runs, numbered by us, in the paper's order. Experiments 1 and 2 are the headline: the base model against dense open models and against GPT-3.5. Experiments 3 to 5 check languages, long inputs and bias. Experiment 6 is the chat model. Experiment 7 is the routing analysis, which the authors call small.
What the paper does not tell us is as important. It gives no training data or token count, no compute, no optimiser settings, no description of how the router is kept balanced, and it does not say whether the experts were copied from Mistral 7B or trained from scratch. There are no seeds or error bars anywhere. And there is no ablation: no dense model of matching size, no run with a different number of experts. Hold on to that; it decides which claims survive in the critiques.

---

<p class="eyebrow"><span class="paper">Jiang et al. 2024</span> · Part 4, setup · how they compare</p>

## How do they compare it with the others?

<div class="cols wide-text">
<div class="text">

<table class="rules" style="font-size:16px">
  <tr><td>group</td><td>benchmarks, with what each tests</td></tr>
  <tr><td>commonsense, 0-shot</td><td>HellaSwag (pick a sentence ending), WinoGrande (resolve a pronoun), PIQA (physical know-how), ARC (school science)</td></tr>
  <tr><td>knowledge, 5-shot</td><td>NaturalQuestions (real search queries), TriviaQA (trivia, no reference text)</td></tr>
  <tr><td>comprehension, 0-shot</td><td>BoolQ (yes/no on a passage), QuAC (dialogue about a passage)</td></tr>
  <tr><td>math</td><td>GSM8K (school word problems, 8-shot, maj@8), MATH (competition problems, 4-shot, maj@4)</td></tr>
  <tr><td>code, 0-shot and 3-shot</td><td>HumanEval (write a function from a docstring), MBPP (short Python tasks)</td></tr>
  <tr><td>aggregates</td><td>MMLU (57-subject exam, 5-shot), BBH (hard reasoning, 3-shot), AGI Eval (human exams)</td></tr>
</table>

</div>
<div class="text">

- They re-ran every open model on their own pipeline, so the numbers are not copied from other papers.
- **maj@k**: a majority vote over $k$ sampled answers.
- **$n$-shot**: the prompt holds $n$ solved examples; 0-shot has none.
- Llama 2 34B was never released, so Llama 1 34B stands in.

</div>
</div>

<p class="footnote">Jiang et al. 2024 · §3, benchmark list, footnote 1, and the protocol note in §3: MBPP hand-verified subset; TriviaQA without Wikipedia contexts. Table 2 labels the stand-in "33B", the text "34B"</p>

Note:
Everything is re-run by the authors, which is good for fairness: the same prompts and scoring for every model. They group 19 benchmarks into six families. Shot counts are in the table. The commonsense group also has SIQA, OpenbookQA and CommonsenseQA, which Table 2 does not show; the paper does not say which go into the Fig. 2 and 3 averages.
Two departures from the Llama 2 paper's own protocol, which the authors state: MBPP uses a hand-verified subset, and TriviaQA gets no Wikipedia passages. This is why numbers here differ from Llama 2's published ones.
maj@8 on GSM8K means the model samples 8 answers and the most common final answer is scored, which helps a lot on math. It matters for the Table 3 slide: Table 2 uses that setting and Table 3 does not, so the two tables give different numbers for the same model.
Llama 2 34B was never released, so the comparison uses Llama 1 34B; the paper's tables label it 33B and its text 34B, but it is the same model.

---

<p class="eyebrow"><span class="paper">Jiang et al. 2024</span> · Part 4, results · Table 2</p>

## Does it beat Llama 2 70B?

<div class="rows">
<div class="points">
<div class="text">

- Mixtral is ahead of Llama 2 70B on 9 of 12 columns (ours); it trails on HellaSwag, WinoGrande and TriviaQA.

</div>
<div class="text">

- The big gains are code and math: MATH 28.4 against 13.8, HumanEval 40.2 against 29.3.
- Against dense Mistral 7B: MMLU +8.1 and GSM8K +24.4, but with more multilingual data (ours).

</div>
</div>

<table class="rules tight" style="font-size:14px">
  <tr><td>model</td><td>active</td><td>MMLU</td><td>HellaS</td><td>WinoG</td><td>PIQA</td><td>Arc-e</td><td>Arc-c</td><td>NQ</td><td>TriQA</td><td>HumanE</td><td>MBPP</td><td>Math</td><td>GSM8K</td></tr>
  <tr><td>Llama&nbsp;2&nbsp;7B</td><td>7B</td><td>44.4</td><td>77.1</td><td>69.5</td><td>77.9</td><td>68.7</td><td>43.2</td><td>17.5</td><td>56.6</td><td>11.6</td><td>26.1</td><td>3.9</td><td>16.0</td></tr>
  <tr><td>Llama&nbsp;2&nbsp;13B</td><td>13B</td><td>55.6</td><td>80.7</td><td>72.9</td><td>80.8</td><td>75.2</td><td>48.8</td><td>16.7</td><td>64.0</td><td>18.9</td><td>35.4</td><td>6.0</td><td>34.3</td></tr>
  <tr><td>Llama&nbsp;1&nbsp;33B</td><td>33B</td><td>56.8</td><td>83.7</td><td>76.2</td><td>82.2</td><td>79.6</td><td>54.4</td><td>24.1</td><td>68.5</td><td>25.0</td><td>40.9</td><td>8.4</td><td>44.1</td></tr>
  <tr><td>Llama&nbsp;2&nbsp;70B</td><td>70B</td><td>69.9</td><td><b>85.4</b></td><td><b>80.4</b></td><td>82.6</td><td>79.9</td><td>56.5</td><td>25.4</td><td><b>73.0</b></td><td>29.3</td><td>49.8</td><td>13.8</td><td>69.6</td></tr>
  <tr><td>Mistral&nbsp;7B</td><td>7B</td><td>62.5</td><td>81.0</td><td>74.2</td><td>82.2</td><td>80.5</td><td>54.9</td><td>23.2</td><td>62.5</td><td>26.2</td><td>50.2</td><td>12.7</td><td>50.0</td></tr>
  <tr class="total"><td>Mixtral&nbsp;8x7B</td><td>13B</td><td><b>70.6</b></td><td>84.4</td><td>77.2</td><td><b>83.6</b></td><td><b>83.1</b></td><td><b>59.7</b></td><td><b>30.6</b></td><td>71.5</td><td><b>40.2</b></td><td><b>60.7</b></td><td><b>28.4</b></td><td><b>74.4</b></td></tr>
</table>
</div>

<p class="footnote">Jiang et al. 2024 · Table 2, accuracy in %, bold as the paper bolds (best per column). "Active": parameters used per token. Metrics as on the last slide; NQ and TriQA are 5-shot, Arc-e and Arc-c the easy and hard school-science sets</p>

Note:
This is Table 2 in full, with the paper's own bold. The caption says Mixtral "outperforms or matches Llama 2 70B performance on almost all popular benchmarks while using 5x fewer active parameters during inference". Counting the columns (ours), Mixtral is ahead on 9 of the 12 and behind on HellaSwag by 1.0, WinoGrande by 3.2 and TriviaQA by 1.5 points. The largest gaps in its favour are MATH, 28.4 against 13.8, a ratio of 2.1, and HumanEval and MBPP, each about 11 points.
The tempting reading is "sparsity gave these gains". The closest pair in the table is Mistral 7B, the same architecture but dense: Mixtral beats it by 8.1 on MMLU and 24.4 on GSM8K. But the paper says Mixtral saw much more multilingual data, and everything else about its training is unknown. So this is the closest pair the paper gives, not a controlled test of sparsity.

---

<p class="eyebrow"><span class="paper">Jiang et al. 2024</span> · Part 4, results · Fig. 3</p>

## How should you read Fig. 3?

<div class="cols wide-fig">
<div class="text">

- The x axis is **active parameters**, the compute cost per token: 7B, 13B, 34B, 70B.
- Llama 2 is one line from 7B to 70B; Mistral's line runs from 7B to Mixtral at 13B.
- Mixtral sits at or above Llama 2 70B in five panels and below on comprehension (approximate reads).
- The memory axis, 47B stored, is not drawn.

</div>
<div class="fig"><img src="img/week-07-mixtral-fig3-active.png" alt="Jiang et al. Figure 3: six panels, MMLU, knowledge, reasoning, comprehension, math and code, each with accuracy against active parameters; Mixtral at 13B sits near or above the Llama 2 70B point in all but comprehension"></div>
</div>

<p class="footnote">Jiang et al. 2024 · §3, Fig. 3. Panels are the §3 benchmark groups, not all in Table 2; accuracy in %. Reads from the axes are ours, the figure prints no numbers</p>

Note:
Figure 3 turns the benchmark groups into a cost picture; comprehension, BoolQ and QuAC, is not in Table 2 at all. The horizontal axis is active parameters, which is proportional to compute per token. Llama 2 gives a line of three points; Mistral 7B to Mixtral is the second line, and the jump between them is large in every panel. At 13B active, Mixtral lands at or above Llama 2 70B in MMLU, knowledge, reasoning, math and code, and below it on comprehension, about 65.8 against 67 (approximate reads, ours). The caption's "largely outperforms" is generous: on knowledge and reasoning the margins read as about 1 and 0.5 points.
This is the honest framing for a sparse model: it compares on compute. But the figure leaves out the other cost. Serving needs all 47 billion parameters in memory, so a point drawn at 13B on the x axis hides a model that does not fit where a 13B dense model fits. The paper says so in words, in §3, but not in the figure.

---

<p class="eyebrow"><span class="paper">Jiang et al. 2024</span> · Part 4, results · Fig. 2</p>

## What does Fig. 2 show that its caption does not?

<div class="rows">
<div class="points">
<div class="text">

- The caption: Mixtral "outperforms or matches Llama 2 70B on all benchmarks".
- The bars show Llama 2 70B above Mixtral on AGI Eval, BBH and comprehension (approximate reads).

</div>
<div class="text">

- The claim shifts: abstract "across all"; Fig. 2 "all"; Table 2 "almost all"; Fig. 3 "except comprehension".
- Check each caption against its data before you cite it.

</div>
</div>
<div class="fig"><img src="img/week-07-mixtral-fig2-bars.png" alt="Jiang et al. Figure 2: grouped bars for six models on MMLU, knowledge, reasoning, comprehension, AGI Eval, math, BBH and code; Llama 2 70B is the tallest bar on AGI Eval, BBH and comprehension"></div>
</div>

<p class="footnote">Jiang et al. 2024 · Fig. 2, abstract, Table 2, Fig. 3 captions. BBH: hard reasoning tasks; AGI Eval: questions from human exams. Reads from the bars are ours; the paper prints no values</p>

Note:
Read the caption of Fig. 2 and then look at the bars. Mixtral is the clear winner on math and code. But on AGI Eval, BBH and comprehension the Llama 2 70B bar is visibly taller: about 54 against 51 on AGI Eval, 45 against 42 on BBH, and 67 against 66 on comprehension (approximate reads, ours; no numbers are printed).
The paper's own wording drifts. The abstract says "across all evaluated benchmarks"; the Fig. 2 caption says "all benchmarks"; the Table 2 caption says "almost all"; the Fig. 3 caption says "all benchmarks, except on reading comprehension"; the conclusion says Mixtral outperforms the previous best model that uses 70B parameters per token. The most careful versions are the ones next to the numbers. This is a reading lesson, the same one as Week 6's: check the claim against the data it sits on.

---

<p class="eyebrow"><span class="paper">Jiang et al. 2024</span> · Part 4, results · Table 3</p>

## Does it beat GPT-3.5, and why do the numbers change?

<div class="cols wide-text">
<div class="text">

<table class="rules">
  <tr><td>benchmark</td><td>Llama 2 70B</td><td>GPT-3.5</td><td>Mixtral</td></tr>
  <tr><td>MMLU</td><td>69.9</td><td>70.0</td><td><b>70.6</b></td></tr>
  <tr><td>HellaSwag, 10-shot</td><td><b>87.1</b></td><td>85.5</td><td>86.7</td></tr>
  <tr><td>ARC-c, 25-shot</td><td>85.1</td><td>85.2</td><td><b>85.8</b></td></tr>
  <tr><td>WinoGrande, 5-shot</td><td><b>83.2</b></td><td>81.6</td><td>81.2</td></tr>
  <tr><td>MBPP, pass@1</td><td>49.8</td><td>52.2</td><td><b>60.7</b></td></tr>
  <tr><td>GSM8K, 5-shot</td><td>53.6</td><td>57.1</td><td><b>58.4</b></td></tr>
  <tr><td>MT-Bench, instruct</td><td>6.86</td><td><b>8.32</b></td><td>8.30</td></tr>
</table>

</div>
<div class="text">

- Mixtral loses HellaSwag and WinoGrande to Llama 2 70B, and WinoGrande and MT-Bench to GPT-3.5.
- Same model, new numbers: GSM8K 74.4 in Table 2 (8-shot, maj@8) and 58.4 here (5-shot).
- ARC-c: 59.7 (0-shot) in Table 2 and 85.8 (25-shot) here.
- Shot counts and scoring decide the level, so compare only within one table.

</div>
</div>

<p class="footnote">Jiang et al. 2024 · Table 3, %, bold as the paper bolds. pass@1: solved with one answer; MT-Bench: chat questions scored out of 10 by a judge model; GPT-3.5 on MT-Bench is gpt-3.5-turbo-1106</p>

Note:
Table 3 adds GPT-3.5 and keeps the losses in. Mixtral wins MMLU, ARC-challenge, MBPP and GSM8K and loses HellaSwag and WinoGrande to Llama 2 70B. Against GPT-3.5 it loses WinoGrande by 0.4 and MT-Bench by 0.02, which is a tie. The text of the paper says Mixtral "performs similarly or above the two other models", which is fair; the abstract's "across all evaluated benchmarks" is not.
The point to teach is the second column of bullets. The same Mixtral scores 74.4 on GSM8K in Table 2 and 58.4 in Table 3; the Llama 2 70B figure drops from 69.6 to 53.6. The settings differ: Table 2 uses 8-shot with a majority vote over 8 samples, Table 3 uses 5-shot. ARC-challenge goes from 59.7 to 85.8 between 0-shot and 25-shot. The Table 2 caption does not say its settings differ from Table 3's. In Table 3 the HellaSwag and WinoGrande gaps to Llama 2 70B narrow to 0.4 and 2.0 points. The paper's text also says "47B tokens" where it means 47B parameters, a slip. The MT-Bench pointer in the instruct section names Table 2, but the number is in this table.

---

<p class="eyebrow"><span class="paper">Jiang et al. 2024</span> · Part 4, results · §3.1, §3.2</p>

## Does it hold up on long inputs and other languages?

<div class="rows">
<div class="points">
<div class="text">

- **Passkey retrieval**: find a number hidden in a long prompt. Mixtral scores 100% at every length and position up to 32k.
- Perplexity on a maths-text subset falls as the context grows, then flattens.

</div>
<div class="text">

- Multilingual: Mixtral beats Llama 2 70B in all 12 cells, by +3.1 to +8.3 points (ours).
- The authors credit a larger share of multilingual data, so this says little about sparsity.

</div>
</div>
<div class="fig"><img src="img/week-07-mixtral-fig4.png" alt="Jiang et al. Figure 4: left, a passkey heat map where every filled cell is green, 100 percent accuracy, across sequence lengths to 32 thousand; right, proof-pile perplexity falling from about 3.8 to about 1.9 as context length grows"></div>
</div>

<p class="footnote">Jiang et al. 2024 · §3.1 Table 4, §3.2 Fig. 4. Perplexity: how surprised the model is by text, lower is better; proof-pile: a dataset of mathematical text; the number of trials is not given. Curve values are our reads</p>

Note:
Two more checks, each short. Long context: the passkey task hides a number at a random place in a long prompt and asks for it. The heat map is green everywhere it is filled; the cells above the diagonal are empty because a passkey cannot sit after the end of the prompt. The paper gives no trial counts. The perplexity curve on a subset of proof-pile falls from about 3.8 at short contexts to about 2.0 near 10k and then falls less than 0.1 more out to 32k (approximate reads, ours).
Languages: Table 4 is on the next, optional slide. Mixtral wins every one of the twelve cells against Llama 2 70B in French, German, Spanish and Italian on ARC-challenge, HellaSwag and MMLU. But the paper itself says it significantly upsampled multilingual data relative to Mistral 7B, and gives no fraction. So the gain is evidence about the data mix, not about experts.

--

<p class="eyebrow"><span class="paper">Jiang et al. 2024</span> · Part 4, results · Table 4 · optional</p>

## What does the multilingual table say?

<div class="rows">
<table class="rules tight" style="font-size:15px">
  <tr><td>model</td><td>active</td><td>FR Arc-c</td><td>FR HellaS</td><td>FR MMLU</td><td>DE Arc-c</td><td>DE HellaS</td><td>DE MMLU</td><td>ES Arc-c</td><td>ES HellaS</td><td>ES MMLU</td><td>IT Arc-c</td><td>IT HellaS</td><td>IT MMLU</td></tr>
  <tr><td>Llama 1 33B</td><td>33B</td><td>39.3</td><td>68.1</td><td>49.9</td><td>41.1</td><td>63.3</td><td>48.7</td><td>45.7</td><td>69.8</td><td>52.3</td><td>42.9</td><td>65.4</td><td>49.0</td></tr>
  <tr><td>Llama 2 70B</td><td>70B</td><td>49.9</td><td>72.5</td><td>64.3</td><td>47.3</td><td>68.7</td><td>64.2</td><td>50.5</td><td>74.5</td><td>66.0</td><td>49.4</td><td>70.9</td><td>65.1</td></tr>
  <tr class="total"><td>Mixtral 8x7B</td><td>13B</td><td><b>58.2</b></td><td><b>77.4</b></td><td><b>70.9</b></td><td><b>54.3</b></td><td><b>73.0</b></td><td><b>71.5</b></td><td><b>55.4</b></td><td><b>77.6</b></td><td><b>72.5</b></td><td><b>52.8</b></td><td><b>75.1</b></td><td><b>70.9</b></td></tr>
</table>
<div class="points">
<div class="text">

- The smallest gap over Llama 2 70B is +3.1 (Spanish HellaSwag); the largest is +8.3 (French ARC-c) (ours).
- Mistral 7B is not in this table, so the effect of the extra multilingual data cannot be separated.

</div>
</div>
</div>

<p class="footnote">Jiang et al. 2024 · Table 4, accuracy in %, the paper bolds every Mixtral cell. FR, DE, ES, IT: French, German, Spanish, Italian; ARC-c: hard school science; HellaS: sentence endings; MMLU: 57-subject exam</p>

Note:
Table 4 in full. The paper bolds every Mixtral cell, and the differences are all positive, between 3.1 and 8.3 points. The reason the authors give is that they upsampled the multilingual share of the data compared with Mistral 7B, and that "the extra capacity" lets it keep English accuracy. The extra capacity is a claim about experts, but there is no run that tests it, and the multilingual Mistral 7B is not in the table. The data fraction is not given.

--

<p class="eyebrow"><span class="paper">Jiang et al. 2024</span> · Part 4, results · §3.3 · optional</p>

## Does the bias table say what its caption says?

<div class="cols wide-text">
<div class="text">

<table class="rules">
  <tr><td></td><td>Llama 2 70B</td><td>Mixtral</td></tr>
  <tr><td>BBQ accuracy</td><td>51.5</td><td>56.0</td></tr>
  <tr><td>BOLD gender</td><td>0.293 ± 0.073</td><td>0.323 ± 0.045</td></tr>
  <tr><td>BOLD profession</td><td>0.218 ± 0.073</td><td>0.243 ± 0.087</td></tr>
  <tr><td>BOLD religion</td><td>0.188 ± 0.133</td><td>0.144 ± 0.089</td></tr>
  <tr><td>BOLD politics</td><td>0.149 ± 0.140</td><td>0.186 ± 0.146</td></tr>
  <tr><td>BOLD race</td><td>0.232 ± 0.049</td><td>0.232 ± 0.052</td></tr>
</table>

</div>
<div class="text">

- The caption says "lower std on BOLD". The spread is lower in 2 of 5 groups, higher in 3 (ours).
- The text's "similar variances" fits the table better.
- BBQ accuracy mixes bias with plain ability to answer, and no error bars are given.

</div>
</div>

<p class="footnote">Jiang et al. 2024 · §3.3 (the table is printed as Fig. 5). BBQ: hand-written questions on nine social biases; BOLD: 23,679 text prompts, scored by average sentiment (higher is more positive) and its spread (std)</p>

Note:
Optional. The authors test the base model on two bias sets. BBQ gives 56.0 for Mixtral against 51.5 for Llama 2 70B, and the text calls this "less bias". But BBQ accuracy counts correct answers, so a more capable model scores higher without being less biased; the paper does not split the ambiguous and the clear questions. On BOLD, each row is the average sentiment of generated text, with its standard deviation. The caption claims lower std; checking row by row (ours), gender 0.045 against 0.073 and religion 0.089 against 0.133 are lower, while profession, politics and race are slightly higher. So the text, "similar variances", is the safer sentence. The table is printed as Figure 5 in the paper though it is a table. One more mismatch: the introduction says the instruct model shows reduced bias, but §3.3 tests the base model.

---

<p class="eyebrow"><span class="paper">Jiang et al. 2024</span> · Part 4, instruct model · §4</p>

## How was the instruct model made, and how good is it?

<div class="cols wide-fig">
<div class="text">

- **SFT** (supervised fine-tuning) on instructions, then **DPO** (Direct Preference Optimization, Week 9) on paired feedback.
- MT-Bench 8.30, the best open-weights score in December 2023.
- Arena Elo 1121, above Claude-2.1 and the best GPT-3.5-Turbo (both 1117), and Gemini Pro (1111).
- The next open models, Tulu-2-DPO-70B and Yi-34B-Chat, are at 1110: 11 back, no intervals given.

</div>
<div class="fig"><img src="img/week-07-mixtral-fig6-lmsys.png" alt="Jiang et al. Figure 6: LMSys leaderboard screenshot of 22 December 2023; Mixtral-8x7b-Instruct-v0.1 is highlighted at Arena Elo 1121, below GPT-4 and Claude-1 and Claude-2.0, above Claude-2.1, GPT-3.5-Turbo, Gemini Pro and Llama-2-70b-chat at 1077"></div>
</div>

<p class="footnote">Jiang et al. 2024 · §4, Fig. 6, screenshot of 22 Dec 2023. Arena Elo: a rating from human votes between two anonymous models; MT-Bench: chat questions scored out of 10 by a judge model</p>

Note:
The chat model is trained in two steps: supervised fine-tuning on an instruction set, then direct preference optimization on pairs of better and worse answers. DPO is Week 9's reading, so one line is enough here. The paper gives no data sizes, hyperparameters, or a comparison of SFT alone against SFT plus DPO.
Two evaluations. MT-Bench: 8.30, which Table 3 shows level with GPT-3.5's 8.32. And the LMSys Chatbot Arena, where people vote between two anonymous models: Elo 1121 in the screenshot of 22 December 2023. Mixtral sits below the GPT-4 versions, Claude-1 and Claude-2.0, by 10 to 122 points. It sits above Claude-2.1 and GPT-3.5-Turbo (best version) by 4 points, Gemini Pro by 10 and Llama-2-70b-chat by 44. A 4 point gap may well be within the noise of the votes; no confidence intervals are printed (ours). The paper says the model is the best open-weights model "by a large margin", yet the next open models in the screenshot, Tulu-2-DPO-70B and Yi-34B-Chat, are 11 points behind.

---

<p class="eyebrow"><span class="paper">Jiang et al. 2024</span> · Part 4, routing analysis · Fig. 7</p>

## Did the experts specialise by topic?

<div class="cols wide-fig">
<div class="text">

- If experts are "experts", one should favour maths and another biology. Predict before you look.
- They ran eight Pile subsets and counted each expert's share of tokens as first or second choice, at layers 0, 15, 31.
- Their words: "we do not observe obvious patterns in the assignment of experts based on the topic".
- ArXiv, PubMed and PhilPapers look alike; only DM Mathematics differs, "likely" because it is synthetic.

</div>
<div class="fig"><img src="img/week-07-mixtral-fig7-routing.png" alt="Jiang et al. Figure 7: three panels for layers 0, 15 and 31, selection proportion by expert 0 to 7 for eight Pile subsets; the colored bars are close together at every expert, with DM Mathematics slightly apart"></div>
</div>

<p class="footnote">Jiang et al. 2024 · §5, Fig. 7. The Pile: a large public mix of web, books, code and papers; DM Mathematics: synthetic maths exercises. The grey 1/8 line is the even-share level (drawn horizontal, captioned vertical)</p>

Note:
Ask the room first: if you trained eight experts, would you expect one to handle mathematics, one biology, one law? That is what the word expert suggests. The authors check this on the validation split of the Pile, eight subsets, at layers 0, 15 and 31, counting the share of tokens that picked each expert as first or second choice. The 1/8 reference line is drawn horizontal in the figure although the caption calls it vertical.
Their finding, in their words: "Surprisingly, we do not observe obvious patterns in the assignment of experts based on the topic." ArXiv papers in LaTeX, PubMed biology and PhilPapers philosophy look the same. Only DM Mathematics is marginally different, particularly at the first and last layers, which the authors attribute to the dataset being synthetic with limited coverage of natural language; that explanation is stated as "likely" and untested. The paper does not say whether this is the base or the instruct model.

---

<p class="eyebrow"><span class="paper">Jiang et al. 2024</span> · Part 4, routing analysis · Fig. 8</p>

## Then what does the router follow?

<div class="cols wide-fig">
<div class="text">

- Fig. 8 colours each token by its first-choice expert, in Python, maths and English samples.
- The text: `self` and the indentation get the same expert, "particularly at the first and last layers".
- The authors read this as "structured syntactic behavior".
- Our caveat: three hand-picked samples, no colour legend, no quantified test.

</div>
<div class="fig"><img src="img/week-07-mixtral-fig8-tokens.png" alt="Jiang et al. Figure 8: three text samples, Python code, maths questions and an English question, each in three columns for layers 0, 15 and 31, every token shaded by its first-choice expert; indentation blocks in the code are one solid colour at layer 31 and mostly one colour at layer 0"></div>
</div>

<p class="footnote">Jiang et al. 2024 · §5, Fig. 8. First choice: the expert with the largest router weight for a token. The text's "Question in English" matches only the maths sample in the image (ours)</p>

Note:
If the router does not follow topic, what does it follow? The authors colour each token by its first-choice expert and look. In the code sample the indentation is one solid colour at layer 31, but at layer 0 it is mostly one colour with a few rows in two others, so the text's "always assigned to the same experts" is stronger than the image (ours). `self` often, not always, keeps one colour. They conclude that the router "does exhibit some structured syntactic behavior" and that expert choice looks more aligned with syntax than with domain, especially at the initial and final layers.
Our reading: this is a suggestion, not a measurement. Three samples chosen by the authors, no legend telling us which colour is which expert, and no number such as how much information the token type gives about the expert. One detail may not match the image: the text says the word "Question" gets one expert in English, but the only "Question" in the figure is in the maths sample. Also, authors expected topic and found none; syntax is the explanation they reach for, and nothing here rules out others.

---

<p class="eyebrow"><span class="paper">Jiang et al. 2024</span> · Part 4, routing analysis · Table 5</p>

## Do neighbouring tokens share experts, and why does it matter?

<div class="rows">
<div class="points">
<div class="text">

- **Repetition**: how often token $i+1$ uses the same expert as token $i$ ("first"), or shares one of its two ("either").
- Even chance would be $1/8$, or 12.5%, for first, and about 46% for either (ours: $1 - \tfrac68 \cdot \tfrac57$).

</div>
<div class="text">

- Layer 0 is near chance; layer 15 is about twice it on first choice (23.6 to 28.4%).
- Runs of one expert can overload a GPU, or let a cache reuse it.

</div>
</div>
<table class="rules tight" style="font-size:14px">
  <tr><td>Pile subset</td><td>first L0</td><td>first L15</td><td>first L31</td><td>either L0</td><td>either L15</td><td>either L31</td></tr>
  <tr><td>ArXiv</td><td>14.0</td><td>27.9</td><td>22.7</td><td>46.5</td><td>62.3</td><td>52.9</td></tr>
  <tr><td>DM Mathematics</td><td>14.1</td><td>28.4</td><td>19.7</td><td>44.9</td><td>67.0</td><td>44.5</td></tr>
  <tr><td>Github</td><td>14.9</td><td>28.1</td><td>19.7</td><td>49.9</td><td>66.9</td><td>49.2</td></tr>
  <tr><td>Gutenberg</td><td>13.9</td><td>26.1</td><td>26.3</td><td>49.5</td><td>63.1</td><td>52.2</td></tr>
  <tr><td>PhilPapers</td><td>13.6</td><td>25.3</td><td>22.1</td><td>46.9</td><td>61.9</td><td>51.3</td></tr>
  <tr><td>PubMed Abstracts</td><td>14.2</td><td>24.6</td><td>22.0</td><td>48.6</td><td>61.6</td><td>51.8</td></tr>
  <tr><td>StackExchange</td><td>13.6</td><td>27.2</td><td>23.6</td><td>48.2</td><td>64.6</td><td>53.6</td></tr>
  <tr><td>Wikipedia (en)</td><td>14.4</td><td>23.6</td><td>25.3</td><td>49.8</td><td>62.1</td><td>51.8</td></tr>
</table>
</div>

<p class="footnote">Jiang et al. 2024 · §5, Table 5, % of consecutive token pairs; L0, L15, L31: layers 0, 15, 31. Github: code; Gutenberg: books; PhilPapers: philosophy; StackExchange: Q and A forums. The caption's "significantly higher" has no test behind it</p>

Note:
Table 5 asks a different question: is the expert for token i+1 the same as for token i? The paper reports two measures. "First" is the same first-choice expert. "First or second" means the two experts of the next token share at least one with the two of this token.
The baseline, if every expert were equally likely: 1/8 or 12.5% for first. For first-or-second, token i+1's two experts both have to avoid token i's two; the first avoids them with probability 6 over 8, the second with 5 over 7, so no overlap has probability 30 over 56, and overlap 1 minus that, about 46%. Layer 0 sits near both baselines, 13.6 to 14.9% on first choice. Layer 15 is about twice the chance level, and at layer 31 first-choice repeats are 19.7 to 26.3%; Gutenberg and Wikipedia repeat more at 31 than at 15.
Our checks (ours): on first-or-second, DM Mathematics at layer 31 is 44.5%, below the 46% baseline, so the caption's "significantly higher at layers 15 and 31" fails there, and no test is given. Also the baseline assumes even loads, while Fig. 7 shows shares up to about 0.20, so the true chance rate is a little above 1/8.
Why it matters, in the authors' words: locality can cause over-subscription of some experts under expert parallelism, and it can be used for caching, as in Eliseev and Mazur 2023, which is their claim to check. The appendix shows every layer.

--

<p class="eyebrow"><span class="paper">Jiang et al. 2024</span> · Part 4, routing analysis · Fig. 10 · optional</p>

## How does repetition change across all 32 layers?

<div class="cols wide-fig">
<div class="text">

- Appendix Fig. 10 plots the same two repeat rates at every layer, one curve per Pile subset.
- The dashed lines mark the even-chance levels, 12.5% and about 46%.
- The authors say repeats occur "a lot more often" than chance, with fewer for DM Mathematics.
- No per-layer numbers are printed, so reads from the curves are approximate.

</div>
<div class="fig"><img src="img/week-07-mixtral-fig10-repeats.png" alt="Jiang et al. Figure 10: two panels, first choice and first or second choice, repeated assignments by layer 0 to 31 for eight Pile subsets, curves above the dashed chance lines in most layers, DM Mathematics often lowest"></div>
</div>

<p class="footnote">Jiang et al. 2024 · Appendix, Fig. 10. Proportion of consecutive tokens with a repeated expert; Pile subsets as in Table 5</p>

Note:
Optional. Table 5 gave three layers; Figure 10 in the appendix gives all 32 as curves. The dashed lines are the chance levels. The authors' caption says repeated assignments occur a lot more often than they would with uniform assignment, with patterns similar across datasets and fewer repeats for DM Mathematics. Layer 0 is near chance and the middle layers are well above, matching the table. Because the figure prints no values, any number you read off it is approximate.

---

<p class="eyebrow"><span class="paper">Jiang et al. 2024</span> · Part 4, after the paper · limits</p>

## What limits do the authors admit?

<div class="cols wide-text">
<div class="text">

- Active parameters ignore "memory costs and hardware utilization".
- Routing adds overhead and "increased memory loads", so MoE suits "batched workloads".
- Expert parallelism (EP, experts on different GPUs) "introduces challenges in load balancing".
- The routing study is "a small analysis"; their protocol differs from Llama 2's.

</div>
<div class="text">

- There is no limitations section, and the conclusion lists no weaknesses.
- The intro claims faster inference at low batch size, but no speed is ever measured.
- Missing, and not admitted: no matched dense model and no error bars.

</div>
</div>

<p class="footnote">Jiang et al. 2024 · §2.1, §3 (size and efficiency), §3 (protocol note), §5; quotes are the paper's. Batch size: tokens or prompts processed together</p>

Note:
The paper has no limitations section. These are the nearest admissions, in the authors' words. First, comparing by active parameters leaves out memory and hardware use: serving cost follows the 47B, and the routing adds overhead, so sparse models suit batched workloads where the arithmetic is dense enough. Second, expert parallelism, which places experts on different GPUs, makes load balancing hard. Third, they call the routing study a small analysis, and they note that their evaluation protocol differs from Llama 2's.
Two things stand out that they do not admit. The introduction says sparse models give faster inference at low batch sizes, yet the only related text says they suit batched workloads, which cuts the other way, and no speed measurement appears. And there is no matched dense baseline, so the paper cannot say how much of the gain is sparsity.

---

<p class="eyebrow"><span class="paper">Jiang et al. 2024</span> · Part 4, after the paper · verdict</p>

## What does Mixtral show, and not show?

<div class="cols wide-text">
<div class="text">

**Shows**

- A released model with 47B total and 13B active parameters.
- It matches or beats Llama 2 70B on most of the benchmarks they re-ran, and GPT-3.5 on most of theirs.
- At three layers, its router shows no obvious topic pattern.

</div>
<div class="text">

**Does not show**

- That sparsity is the cause: no matched dense run, data unknown.
- Speed: nothing was measured.
- That its "experts" are experts in a human sense.

</div>
</div>

<p class="footnote">Jiang et al. 2024 · whole paper. The "does not show" list is our reading of what the paper omits</p>

Note:
Putting the paper together. What it shows is solid and useful: a released sparse model, 47 billion stored and 13 billion used per token, that matches or beats a dense model with five times its active parameters on most of the benchmarks the authors re-ran, and GPT-3.5 on most of the ones in Table 3, with the losses on the table.
What it does not show is also clear. Sparsity as the cause: no dense model of matching size was trained, and the data are not disclosed. Speed: no measurement. And the word "expert": at the layers checked, the router does not split by subject.

---

<p class="eyebrow"><span class="paper">Jiang et al. 2024</span> · Part 4, critique 1 of 2</p>

## Is there a controlled comparison?

<div class="cols wide-text">
<div class="text">

- Objection (ours): no dense model of the same size and data was trained.
- Mistral 7B differs from Mixtral in data as well as architecture, and the data are unknown.
- Do they admit it? No.
- Does it sink the argument? It sinks "sparsity caused the gain", not "this model is strong per active parameter".

</div>
<div class="text">

<p class="plain">The paper's evidence is one model against other released models, so every gap mixes sparsity, data and training choices.</p>

</div>
</div>

<p class="footnote">Jiang et al. 2024 · whole paper; the objection is ours. Matched means same size, data and training budget, with only the architecture changed</p>

Note:
Critique one. A controlled test would train a dense model and a sparse model on the same data with the same training compute and compare. The paper does not. Its comparisons are against Llama 2, trained by someone else on different data, and against Mistral 7B, whose training data is also unspecified. Mixtral is described as having more multilingual data than Mistral 7B, which alone could explain part of the gain.
Do they admit it? No. Does it sink the argument? It depends on which claim you take. If the claim is "sparsity is why Mixtral beats Llama 2 70B", it fails: the paper cannot support it. If the claim is "an open model with 13B active parameters can be as strong as a dense 70B", the evidence is the benchmark table, and it holds on most columns. Week 7's other readings, DeepSeekMoE and V3, are where controlled ablations appear. The point about captions that overstate is already made on the Fig. 2 slide.

---

<p class="eyebrow"><span class="paper">Jiang et al. 2024</span> · Part 4, critique 2 of 2</p>

## How much can the routing analysis carry?

<div class="cols wide-text">
<div class="text">

- Objection (ours): three layers, eight domains and three hand-picked samples.
- The syntax claim has no test, such as how well token type predicts the expert.
- Do they admit it? In part: they call it "a small analysis".
- Does it sink the argument? It limits "syntax, not domain" to a suggestion.

</div>
<div class="text">

<p class="plain">The no-topic result stands for these layers and subsets; the syntax explanation is a hypothesis.</p>

</div>
</div>

<p class="footnote">Jiang et al. 2024 · §5, Figs. 7 and 8, Table 5; the objection is ours</p>

Note:
Critique two. The routing section is the paper's one look inside the model, and it is small by the authors' own word: layers 0, 15 and 31 out of 32, eight Pile subsets, three samples chosen by hand for the coloured text, no count of tokens, and no statement of whether it is the base or the instruct model. The syntax conclusion comes from looking at colours, not from a measure.
They do admit it is small. It does not sink the finding that domains look alike at these layers. It does leave "the router follows syntax" as a suggestion to test, not a result. The sub-slide shows what later work found.

--

<p class="eyebrow"><span class="paper">Jiang et al. 2024</span> · Part 4, later work · DeepSeek-V3 Fig. 9</p>

## Does later work overturn the no-topic finding?

<div class="cols wide-fig">
<div class="text">

- DeepSeek-V3 compares two 16B models on the Pile: one balanced within each sequence, one over the whole batch.
- **Per-batch balance** only asks that experts share the load across a batch, not inside each sequence.
- With it, some experts run hot for one domain, such as expert 25 on DM Mathematics.
- Verdict (ours): Mixtral is challenged, not revised.

</div>
<div class="fig"><img src="img/week-07-v3-fig9-load.png" alt="DeepSeek-V3 Figure 9: heat maps of relative expert load for Wikipedia, Github and DM Mathematics across 64 experts at two layers; the sequence-wise balanced model is evenly pale, the auxiliary-loss-free model has a few hot experts for individual domains"></div>
</div>

<p class="footnote">DeepSeek-AI 2024 (DeepSeek-V3), §4.5.3, Fig. 9. Relative expert load: actual load divided by perfectly even load. Our caveat: its domains also differ in token type, and its experts are small and numerous</p>

Note:
Later work, from Part 6. DeepSeek-V3 records the expert load of two 16B models on three Pile domains. When the load is balanced within each sequence, every domain uses every expert about evenly, much like Mixtral. When it is balanced only over the batch, some experts become hot for one domain, for example one expert at about ten times its even load for DM Mathematics at layer 9 (approximate read, ours). The authors say the flexibility lets experts specialise.
Does that overturn Mixtral? Not cleanly. Their domains are Wikipedia, GitHub and DM Mathematics, where the token types, code and digits, differ as well, so this cannot tell domain experts from token-type experts. And DeepSeek's model has 64 small experts, not 8. Also the claim is visual, with no number for "greater specialisation". Verdict: challenged, not revised. It is a reminder that Mixtral's no-topic result may depend on how the router was balanced in training, which Mixtral does not disclose.

---

<p class="eyebrow"><span class="paper">Jiang et al. 2024</span> · Part 4, synthesis</p>

## What should you keep from Mixtral?

<div class="cols wide-text">
<div class="text">

- Two counts: 47B total sets memory, 13B active sets compute per token.
- A top-2 of 8 model, MoE in every layer, matched or beat a dense model with 5x its active parameters on most benchmarks. The paper does not separate sparsity from data.
- Its experts are not topic experts at the layers checked.
- Neighbouring tokens reuse experts in the middle layers.

</div>
<div class="text">

<p class="plain">Open question: how much of the gain is sparsity, and how much is data?</p>

</div>
</div>

<p class="footnote">Jiang et al. 2024 · summary of §2 to §5. Top-2 of 8: each token goes to 2 of 8 experts</p>

Note:
Four things to keep. One: the two parameter counts and which cost each sets. Memory follows the 47B, compute per token follows the 13B. Two: a model that picks 2 of 8 experts in every layer matched or beat a dense model with five times its active parameters on most of these benchmarks, for reasons the paper does not separate. Three: the experts are not topic experts, at least at layers 0, 15 and 31 on these Pile subsets. Four: in the middle layers, neighbouring tokens tend to reuse experts, which matters for load and for caching.
The open question for the rest of the day: how much of the gain is sparsity, and how much is data? The survey that follows gives a map of the design choices, and the DeepSeek papers are the ones that run ablations.


---


<!-- .slide: class="cover divider" -->

<p class="kicker">Reading 2 of 3</p>
<h1>Cai et al. 2024</h1>
<p class="subtitle">A Survey on Mixture of Experts in Large Language Models</p>
<p class="question">If you were building a mixture of experts today, what would you have to decide?</p>
<ol class="track"><li class="done">Mixtral 2024<span>sparse 8x7B</span></li><li class="now">Cai et al. 2024<span>the survey's map</span></li><li>DeepSeekMoE and V3<span>many small experts</span></li></ol>

Note:
Reading 2 of 3. Cai, Jiang, Wang, Tang, Kim and Huang, first posted July 2024; we read version 3 from April 2025. Mixtral showed one design that works. This survey lays out the whole menu: every decision a builder faces, who chose what, and the numbers the field relied on up to the end of 2024. We follow it the way we followed Raschka in Week 4: one map, then each design choice with the same beats, what it is, who uses it, how it helps, and what it costs. Six choices: how tokens pick experts, how the load is kept balanced, what the experts are, whether they can be small adapters, where the model comes from, and what the hardware has to do. The question to hold: if you had to build one tomorrow, which of these would the survey actually help you decide?

---

<p class="eyebrow"><span class="paper">Cai et al. 2024</span> · §3, Fig. 3 · the map</p>

## What kind of paper is this, and what is on its map?

<div class="cols">
<div class="text">

- A **survey**: no experiments of its own; every number is relayed from another paper.
- Its model tables stop at DeepSeek-V3 (December 2024); Week 4's 2025 models come after.
- Three branches: algorithm, system, application; we take six choices from the first two (ours).
- Read it as a map of options; check each number at its source.

</div>
<div class="text">

<table class="rules" style="font-size:20px">
  <tr><td>choice</td><td>what it decides</td></tr>
  <tr><td>1 gating</td><td>how a token picks experts</td></tr>
  <tr><td>2 balance</td><td>losses and capacity limits</td></tr>
  <tr><td>3 experts</td><td>kind, count, size, frequency, shared</td></tr>
  <tr><td>4 adapter experts</td><td>experts made of small fine-tuning adapters (PEFT, defined on its own slide)</td></tr>
  <tr><td>5 schemes</td><td>scratch, upcycle, distil, merge</td></tr>
  <tr><td>6 systems</td><td>computation, communication, storage</td></tr>
</table>

</div>
</div>

<p class="footnote">Cai et al. 2024 · arXiv:2407.06204 v3 · §3, Fig. 3. PEFT: parameter-efficient fine-tuning. Not covered: dense gating, activation functions, applications, "derivatives" such as Mixture-of-Depths (skips layers for some tokens)</p>

Note:
The map. A survey does not run experiments; it organises a literature. Everything quantitative in it is a number someone else measured, so it is useful for finding papers and seeing lineage, and risky for quoting numbers. We will check a few of its numbers against the papers we have read.
Its cut-off matters. Its open-model table (Table 3) runs from Mixtral in December 2023 to DeepSeek-V3 in December 2024. Version 3 is dated April 2025, but the content is a late-2024 snapshot. Llama 4, Qwen3, gpt-oss and the other 2025 models from Week 4 are after it, so where the survey says "mainstream" we say "as of its cut-off".
The survey's own tree has three branches: algorithm design, system design, application. The algorithm branch splits into gating function, experts, training and inference scheme, and derivatives. We reorganise it into six choices, numbered by us, in the order a builder meets them. The survey discusses the auxiliary losses under gating; we give balance its own choice because it is where the practical trouble is. Left out, and said here: dense gating (we see it on a sub-slide), the choice of activation function (a progression from ReLU to SwiGLU that follows dense models, no measurement), the derivatives, and the application section, which is a catalogue by domain: language, vision, recommendation, multimodal. The next sub-slide is the full tree.

--

<p class="eyebrow"><span class="paper">Cai et al. 2024</span> · §3, Fig. 3 · the map (sub-slide)</p>

## What does the whole taxonomy look like?

<div class="rows">
<div class="fig"><a href="img/week-07-cai-fig3-taxonomy.png" target="_blank"><img src="img/week-07-cai-fig3-taxonomy.png" alt="Cai et al. Figure 3, the taxonomy tree of mixture of experts: algorithm design (gating function, experts, training and inference scheme, derivatives), system design (computation, communication, storage) and application (NLP, vision, recommendation, multimodal), each leaf listing the papers"></a></div>
</div>

<p class="footnote">Cai et al. 2024 · Fig. 3. Several papers sit in more than one leaf (DS-MoE, a dense-training sparse-inference method, appears in five). Click the figure to open it full size</p>

Note:
Optional. The survey's Figure 3 as printed: the whole tree with every paper placed in a leaf. You do not need to read it. Use it to see the shape: the algorithm branch is by far the largest; the system branch is three leaves (computation, communication, storage); application is four (language, vision, recommendation, multimodal).
One thing the tree makes visible: many papers appear in several leaves, one method in five, because a paper often changes more than one thing. So the tree is a map of ideas, not a partition of papers.

---

<p class="eyebrow"><span class="paper">Cai et al. 2024</span> · §2.2, §4.1.1 · Choice 1 of 6, gating · What and who · Eq. 3, Fig. 4</p>

## Which experts does a token pick, and in what order?

<div class="cols wide-fig">
<div class="text">

<div class="eq">$$\mathcal{G}(\mathbf{x})_i = \operatorname{softmax}\big(\operatorname{TopK}(g(\mathbf{x}) + \mathcal{R}_{\rm noise},\thinspace k)\big)_i$$</div>

<dl class="where">
<dt>$\mathcal{G}(\mathbf{x})_i$</dt><dd>the weight on expert $i$ for token $\mathbf{x}$</dd>
<dt>$g(\mathbf{x})$</dt><dd>the router's score for each expert</dd>
<dt>$\mathcal{R}_{\rm noise}$</dt><dd>noise added before choosing; never defined in the survey</dd>
<dt>$\operatorname{TopK}$, $k$</dt><dd>keep the $k$ largest scores, drop the rest</dd>
</dl>

<p class="plain">In words: keep the top $k$ scores, then turn them into weights that sum to 1.</p>

- **Token choice**: each token picks its own top $k$ experts.
- Softmax after TopK (Mixtral): the kept weights sum to 1.
- TopK after softmax (GShard, Switch, OpenMoE): they do not.

</div>
<div class="fig"><img src="img/week-07-cai-fig4-gating.png" alt="Cai et al. Figure 4: six gating functions, (a) sparse top-1 as in Switch, (b) BASE layers, (c) grouped domain mapping plus random gating, (d) expert choice, (e) an attention router, (f) soft merging of experts"></div>
</div>

<p class="footnote">Cai et al. 2024 · §2.2 Eq. 3, §4.1.1, Fig. 4; renormalising helped upcycled vision models, hurt upcycled language models (Komatsuzaki et al.). OpenMoE: an open mixture of experts model family</p>

Note:
Choice 1, gating. What we built in Part 2 is token choice: every token scores all experts and picks its own top k. The survey's Equation 3 is the Shazeer 2017 form: add noise to the router scores, keep the top k, and apply softmax to the survivors. The noise is meant to encourage exploration among experts, and the survey never says what distribution or scale it has. Who uses which k: k equals 1 for Switch; k equals 2 for GShard, GLaM, ST-MoE (Google's stable sparse model), Mixtral and Skywork-MoE.
Why the order of softmax and TopK matters: with softmax after TopK, as in Mixtral and Equation 3, the surviving weights sum to one. With TopK after softmax, as in GShard, Switch and OpenMoE, the kept weights are slices of a larger distribution and sum to less than one. With k equal to 1, TopK after softmax is what keeps the router learning: if you renormalised a single kept weight it would always be exactly one, and the router would receive no gradient through it. That reasoning is ours (the survey gives only the two orders and the upcycling finding) and ties back to Part 2. DeepSeekMoE also takes TopK after softmax without renormalising.
The survey's only evidence on this is a relayed one: renormalising the combined weights to one helped upcycled vision models and hurt upcycled language models. A caution in passing: its Equation 3 is the Mixtral order, but the survey says later models use the other order, so its background equation is not the order its own text describes for most models. Figure 4 shows six gating ideas in one picture; the next slide takes the ones that are not token choice.

--

<p class="eyebrow"><span class="paper">Cai et al. 2024</span> · §2.1, §2.2 · Choice 1 of 6, gating · What (sub-slide) · Fig. 2</p>

## What is the difference between a dense and a sparse MoE layer?

<div class="cols wide-fig">
<div class="text">

- **Dense MoE**: every expert runs for every token; the outputs are mixed by the gate.
- **Sparse MoE**: only the top $k$ experts run; the others cost nothing for that token.
- The survey says sparse trades some quality for compute; it gives no number.

</div>
<div class="fig"><img src="img/week-07-cai-fig2-layer.png" alt="Cai et al. Figure 2: the same four feed-forward experts and a linear-softmax gate, in (a) a dense MoE where all four gate probabilities are used and (b) a sparse MoE where only the top two are used"></div>
</div>

<p class="footnote">Cai et al. 2024 · Fig. 2, §2.1 Eq. 1 and 2, §4.1.2. MoE: mixture of experts. Gate: the router, a linear layer followed by softmax. Dense gating still appears in adapter experts, next</p>

Note:
Optional. The survey's Figure 2 is the simplest picture of the layer. Left: a dense mixture of experts, where the gate gives every expert a probability and the layer returns the probability-weighted sum of all of them. Right: the sparse version, where only the top two are kept and the rest are skipped. Everything we call a mixture of experts in this deck is the right-hand side.
The survey states the trade plainly: sparse activation buys computational efficiency at the expense of some performance compared with a densely activated mixture of the same total size. It cites three papers and gives no size for the gap. It also says dense activation still works well where each expert is cheap, which is the adapter case on a later slide.

---

<p class="eyebrow"><span class="paper">Cai et al. 2024</span> · §4.1.1, §4.1.3 · Choice 1 of 6, gating · Who and costs · Fig. 4</p>

## What else could do the choosing?

<table class="rules" style="font-size:20px">
  <tr><td>family</td><td>who chooses</td><td>what it gains</td><td>what it costs</td></tr>
  <tr><td><b>non-trainable</b> (Hash Layer)</td><td>a fixed hash of the token id</td><td>balanced by construction; no router to train</td><td>cannot learn which expert suits which token</td></tr>
  <tr><td><b>expert choice</b> (Zhou et al.)</td><td>each expert picks its top tokens</td><td>even load without a balance loss</td><td>some tokens get several experts, some none</td></tr>
  <tr><td><b>soft</b> (Soft MoE, SMEAR, Lory)</td><td>merge tokens, or merge experts' weights</td><td>fully differentiable; no discrete choice</td><td>token merging needs future tokens</td></tr>
</table>

<p class="plain">Check (ours): expert choice picks among a batch of tokens, so one token's route can depend on later tokens, which a causal decoder cannot see.</p>

<p class="footnote">Cai et al. 2024 · §4.1.1 (non-trainable, expert choice), §4.1.3 (soft), Fig. 4d, 4f. Hash Layer: routes by hashing the token id. SMEAR: averages experts into one per input. Lory: SMEAR for language-model pretraining, merging per text segment</p>

Note:
Three alternatives to learned token choice, each trading something away.
Non-trainable gating: Hash Layer routes by a fixed hash of the token's id. The survey's claimed benefit is that no router has to be trained and the balance is good because the hash spreads tokens evenly. The cost is that nothing is learned about which expert suits which token; the survey says the results are "competitive" and gives no number. Its claim of "full load balancing" is stronger than its own sentence supports: the hash is chosen in advance to spread a batch, which is not an enforced guarantee.
Expert choice, from Zhou et al. 2022, inverts the direction: each expert picks its top tokens. Every expert gets exactly its share, so no balance loss is needed, and the model can spend more computation on some tokens. The cost, in the survey's words, is uneven token coverage: some tokens get several experts, some get none.
Soft gating avoids the discrete choice altogether. Soft MoE merges tokens into per-expert slots; SMEAR and Lory average the experts' weights with the router's probabilities and run the merged expert. Fully differentiable, and the survey notes merging tokens does not fit an autoregressive decoder because the average needs future tokens. Lory fixes that by merging per text segment, with a relayed 13.9 percent perplexity gain over a matched dense model.
Our check on expert choice: it chooses among a batch of tokens, so a token's route can depend on tokens after it. The survey notes only that Komatsuzaki et al. use expert choice in an encoder and keep token choice in the decoder, and does not say why. That is a gap, and our reading of it.

---

<p class="eyebrow"><span class="paper">Cai et al. 2024</span> · §4.1.1, Table 1, Eq. 6 to 8 · Choice 2 of 6, balance · What and who</p>

## Which losses keep the experts evenly used?

<div class="cols">
<div class="text">

<table class="rules" style="font-size:20px">
  <tr><td>loss</td><td>from</td><td>weight</td></tr>
  <tr><td>importance + load</td><td>Shazeer 2017</td><td>0.1, 0.1</td></tr>
  <tr><td>balance loss</td><td>GShard, Switch</td><td>0.01</td></tr>
  <tr><td>balance + z-loss</td><td>ST-MoE</td><td>0.01, 0.001</td></tr>
  <tr><td>mutual information</td><td>Mod-Squad</td><td>0.001</td></tr>
</table>

</div>
<div class="text">

<div class="eq">$$\mathcal{L} = N\sum_{i=1}^{N}\mathcal{D}_i\,\mathcal{P}_i$$</div>

<dl class="where">
<dt>$N$</dt><dd>the number of experts</dd>
<dt>$\mathcal{D}_i$</dt><dd>the share of tokens whose top choice is expert $i$</dd>
<dt>$\mathcal{P}_i$</dt><dd>the mean gate probability of expert $i$</dd>
</dl>

<p class="plain">In words: the loss is 1 when every expert gets $1/N$ of the tokens; $N$ if one gets all.</p>

</div>
</div>

<p class="footnote">Cai et al. 2024 · Table 1, §2.2 Eq. 6 to 8. Weight: the coefficient on the loss. ST-MoE: Google's stable sparse model; Mod-Squad: a multi-task vision mixture of experts. Check (ours): same form as GShard's loss times $N^2$</p>

Note:
Choice 2, balance. If the router favours a few experts, the others never learn. The survey's Table 1 lists four families of loss with their usual weights. Shazeer 2017: an importance loss, the squared coefficient of variation of each expert's summed gate values, plus a load loss that smoothly estimates the number of examples each expert gets; both weighted 0.1. The GShard and Switch balance loss, weight 0.01 (Switch uses 0.01; GShard itself prints no value), which most models since have copied, and which the survey says remains the predominant choice in industry. ST-MoE adds a z-loss on top, weights 0.01 and 0.001; the next slide. Mod-Squad uses mutual information between experts and tasks, because forcing balance across conflicting tasks can hurt a multi-task model; weight 0.001.
The one equation the survey writes out is Equations 6 to 8. D_i is the fraction of tokens whose top-1 choice is expert i; P_i is the average gate probability for expert i; the loss is N times the sum of their products. At the balanced point each is 1 over N, so the sum is N times N times 1 over N squared, which is 1. The survey calls that the minimum; it is not quite (ours). D counts only top choices, so a router can dip below 1: with two experts, three quarters of tokens leaning barely toward expert 1 and the rest firmly on expert 2 give 7/8. Read 1 as the balanced value to aim for.
A scale warning, ours. With N experts the survey's form is N squared times GShard's original loss, which averages over experts with a factor 1 over E (GShard writes E for the number of experts). So GShard's loss has balanced value 1 over N squared, the survey's has 1. A coefficient of 0.01 in one paper's form is not the same strength as 0.01 in another's.

---

<p class="eyebrow"><span class="paper">Cai et al. 2024</span> · §4.1.1, Eq. 11 · Choice 2 of 6, balance · Costs</p>

## What are the z-loss, and the dropped tokens?

<div class="cols">
<div class="text">

<div class="eq">$$\mathcal{L}_z = \frac{1}{T}\sum_{\mathbf{x}\in\mathcal{B}}\Big(\log\sum_{i=1}^{N} e^{\ell_i}\Big)^2$$</div>

<dl class="where">
<dt>$\mathbf{x}$, $\mathcal{B}$, $T$</dt><dd>a token, the batch, the number of tokens in it</dd>
<dt>$\ell_i$</dt><dd>the router logit (raw score) of the token for expert $i$</dd>
<dt>$N$</dt><dd>the number of experts</dd>
</dl>

<p class="plain">In words: penalise large router scores, so the exponentials stay small and round-off errors stay small.</p>

</div>
<div class="text">

- The **router z-loss** (ST-MoE) is for stability; it adds to the balance loss.
- **Dropped tokens**: an expert at capacity skips the extra tokens it was sent.
- OpenMoE: later tokens in a sequence are dropped more; worse for instruction data.
- The survey admits balance losses "can still lead to training instability".

</div>
</div>

<p class="footnote">Cai et al. 2024 · §4.1.1 Eq. 11 (survey writes $x_i$ for the logit; reading ours), §7 challenge 1. ST-MoE: Google's stable sparse model; OpenMoE: an open mixture of experts model family. Capacity: tokens an expert accepts per batch</p>

Note:
The z-loss comes from ST-MoE. Take the router's raw scores for a token, take the log of the sum of their exponentials, square it, and average over tokens. It penalises large logits. Big numbers inside an exponential cause round-off errors, so keeping the logits small makes the router numerically safer. ST-MoE found the plain balance loss unreliable at larger scales and added this for stability without hurting quality. A notation point, ours: the survey writes the logit as x sub i while also using x for the token; the formula only makes sense with logits.
Dropped tokens. Each expert has a capacity, a limit on how many tokens it will take in a batch; GShard introduced this. Tokens sent to a full expert overflow and are skipped by that expert. OpenMoE reports "Drop-towards-the-End": tokens later in a sequence are dropped more often, and it is worse in instruction-tuning data. It also reports that routing by token identity is learned early in pretraining and then stays fixed.
The survey's own challenge number one in its closing section: auxiliary losses "can still lead to training instability" and often neglect how important different tokens are. What is missing is DeepSeek-V3's balancing without any auxiliary loss, which we meet in the next reading, even though V3 is in the survey's own model table.

---

<p class="eyebrow"><span class="paper">Cai et al. 2024</span> · §4.2.1, §4.2.2, Table 2 · Choice 3 of 6, experts · What and who</p>

## What kind of experts, how many, and how big?

<div class="rows">
<div class="points">
<div class="text">

- Kind: almost always a feed-forward network (FFN), copied from the dense block.
- Count: thousands early, then "no more than 64"; its own table has 257.

</div>
<div class="text">

- Size: GLaM grows each expert; DeepSeekMoE, Qwen1.5-MoE and DBRX cut them finer.
- One matched test: 4 of 16 experts of width 688 slightly beat 2 of 8 of width 1376.

</div>
</div>

<table class="rules" style="font-size:18px">
  <tr><td>model</td><td>experts active / total</td><td>expert width</td><td>MoE layers</td><td>shared</td></tr>
  <tr><td>GShard 600B</td><td>2 / 2048</td><td>FFN width</td><td>every 2nd</td><td>0</td></tr>
  <tr><td>Switch 1571B</td><td>1 / 2048</td><td>FFN width</td><td>every</td><td>0</td></tr>
  <tr><td>GLaM 1.2T</td><td>2 / 64</td><td>FFN width</td><td>every 2nd</td><td>0</td></tr>
  <tr><td>Mixtral 13B / 47B</td><td>2 / 8</td><td>FFN width</td><td>every</td><td>0</td></tr>
  <tr><td>DeepSeekMoE 16B</td><td>8 / 66</td><td>1408</td><td>all but first</td><td>2</td></tr>
  <tr><td>Qwen1.5-MoE</td><td>8 / 64</td><td>1408</td><td>every</td><td>4</td></tr>
  <tr><td>DBRX</td><td>4 / 16</td><td>FFN width</td><td>every</td><td>0</td></tr>
  <tr><td>DeepSeek-V3</td><td>9 / 257</td><td>2048</td><td>all but first 3</td><td>1</td></tr>
</table>
</div>

<p class="footnote">Cai et al. 2024 · Table 2 (8 of 36 rows); counts include shared. GLaM: Google's 1.2T model; Qwen1.5-MoE: Alibaba's 14.3B; DBRX: Databricks' 132B; LLaMA-MoE: LLaMA's FFNs split into experts. "FFN width": as wide as the dense FFN</p>

Note:
Choice 3, the experts themselves. This is the survey's Table 2, eight of its 36 rows. Columns: active and total experts, counting shared ones; expert width; how often a layer is a mixture of experts layer; and how many experts are shared.
Kind: nearly always a feed-forward network. The reason offered is a hypothesis: attention layers are less sparse and less domain-specific than feed-forward layers, with a relayed figure that only 20 percent of feed-forward experts engage against 80 percent in attention. Attention experts exist (next sub-slide) but are rare.
Count: the survey writes that recent models "commonly utilize no more than 64 experts", and its own Table 2 has two clear exceptions: DeepSeekMoE 145B has 132 and DeepSeek-V3 has 257 (the models it cites for the claim do stay at 64 or fewer). Size: GLaM widened each expert at 64 of them; the DeepSeek line, Qwen1.5-MoE and DBRX went the other way, finer. One wobble: the survey also lists DBRX among the larger-expert models, and its Table 2 gives DBRX full-width experts, 4 of 16. The one controlled comparison the survey reports is LLaMA-MoE: splitting an 11,008-wide feed-forward network into 16 pieces of 688 and using 4, against 8 pieces of 1,376 and using 2. Both activate 2,752 neurons, and the first "marginally outperforms" the second. Our check of that arithmetic holds. No numbers, no error bars.
Notice what the table shows (ours): the count first fell, from GShard's 2,048 full-width experts to Mixtral's 8; then, from DeepSeekMoE on, experts got narrower and more numerous, up to 9 of 257. From Mixtral on, every layer is a mixture of experts layer.

---

<p class="eyebrow"><span class="paper">Cai et al. 2024</span> · §4.2.2 to §4.2.4, Table 3 · Choice 3 of 6, experts · How often, and shared</p>

## How often is a layer a mixture, and should one expert be shared?

<div class="cols wide-fig">
<div class="text">

- Every other layer (GShard, GLaM), every fourth (ST-MoE, OpenMoE), every layer from Mixtral on.
- DeepSeekMoE keeps its first layer dense: that layer's balance converges slowly.
- A **shared expert** is an FFN every token uses, on top of the routed ones.
- Called "mainstream" at the survey's cut-off; Week 4's Qwen3 and gpt-oss have none.

</div>
<div class="fig"><img src="img/week-07-cai-active-share.png" alt="Illustration: active share of total parameters for the 13 models in the survey's Table 3; Mixtral and DBRX near 27 percent, Qwen1.5-MoE 21.4, DeepSeek-V2 8.9, DeepSeek-V3 5.5, Arctic 3.5 percent"></div>
</div>

<p class="footnote">Cai et al. 2024 · §4.2.2, §4.2.4, Table 3; chart ours (active ÷ total parameters, 13 models). GLaM: Google's 1.2T MoE; ST-MoE: Google's stable MoE; OpenMoE: an open MoE family; Qwen1.5-MoE: Alibaba's 14.3B</p>

Note:
Two more parts of choice 3. Frequency: which layers are mixture layers. GShard and GLaM replace every other feed-forward network, ST-MoE and OpenMoE every fourth, and since Mixtral the trend is every layer. DeepSeekMoE replaces all but the first, because the load balance in that first layer converges especially slowly; DeepSeek-V3 keeps three dense layers; the survey gives no reason for that.
Shared experts. DeepSpeed-MoE's Residual-MoE gave every token one fixed expert plus one routed expert, the routed one acting as an error-correcting add-on. DeepSeekMoE, Qwen1.5-MoE and OpenMoE followed, and the survey calls it a "mainstream configuration". Be careful with that: it is a statement about 2024. Week 4 showed Qwen3 dropping the shared expert and gpt-oss using none. The survey also says shared experts reduce communication, but of the papers it cites only DeepSpeed-MoE argues that directly (Arctic argues overlap, not less traffic); DeepSeekMoE's own reason is redundancy of common knowledge. The survey gives no experiment for or against shared experts.
The chart is ours, from the survey's Table 3: active parameters divided by total for its 13 models. The 2023 and 2024 models with 8 or 16 big experts, Mixtral at 27.7 percent, Grok-1 27.4, DBRX 27.3, sit near 27. Qwen1.5-MoE is 21.4. DeepSeek-V2 (8.9) and DeepSeek-V3 (5.5) sit near the bottom; Arctic, Snowflake's 480-billion-parameter model (128 large experts plus a dense part, 17 billion active), is lowest at 3.5. The sub-slide shows the survey's Figure 5.

--

<p class="eyebrow"><span class="paper">Cai et al. 2024</span> · §4.2.1, §4.2.4 · Choice 3 of 6, experts · What (sub-slide) · Fig. 5</p>

## What do attention experts and the shared expert look like?

<div class="rows">
<div class="fig"><img src="img/week-07-cai-fig5-shared.png" alt="Cai et al. Figure 5: (a) mixture of attention heads, where each expert has its own query and output projections and keys and values are shared; (b) a shared expert, a fixed FFN beside gated FFN experts"></div>
</div>

<p class="footnote">Cai et al. 2024 · Fig. 5, §4.2.1, §4.2.4. FFN: feed-forward network. MoA: mixture of attention heads (Zhang et al.), followed by JetMoE and ModuleFormer</p>

Note:
Optional. Figure 5, two panels. Panel a: a mixture of attention heads. Each expert has its own query and output projection; the keys and values are shared across experts to save computation; one gate picks the same expert indices for both. Panel b: a shared expert: a fixed feed-forward network that every token goes through, next to the gated feed-forward experts, with the outputs added.
Attention experts are rare: JetMoE, ModuleFormer and DS-MoE (dense training, sparse inference) followed the first one, but most models keep attention dense. Panel b is the shared expert we just discussed; the survey's Table 2 gives shared counts of 1, 2 and 4 for DeepSeekMoE's three sizes, 4 for Qwen1.5-MoE and 1 for DeepSeek-V3.

---

<p class="eyebrow"><span class="paper">Cai et al. 2024</span> · §4.3, Fig. 6 · Choice 4 of 6, PEFT experts · What and who</p>

## Can the experts be small adapters instead?

<div class="cols wide-fig">
<div class="text">

- **PEFT**: train a few weights on a frozen model; **LoRA** adds a small low-rank update.
- Each expert is one adapter; a router mixes them.
- Placed in attention, in the FFN, in the whole block, or per layer.
- Claim: multi-task gains at adapter cost; dense mixing works because adapters are cheap.

</div>
<div class="fig"><img src="img/week-07-cai-fig6-mope.png" alt="Cai et al. Figure 6: mixtures of parameter-efficient experts by placement, (a) in attention, (b) in the feed-forward network, (c) in the whole Transformer block with two expert groups, (d) every layer treated as one expert"></div>
</div>

<p class="footnote">Cai et al. 2024 · §4.3, Fig. 6, Eq. 12 to 18; qualitative claims only, no numbers. LoRAMoE: two adapter groups, against forgetting; MixLoRA: adapters beside the shared FFN; MoLE: only the router trains, over existing adapters</p>

Note:
Choice 4. A different reading of "expert": not a slice of the pretrained network but a small adapter on top of a frozen one. PEFT, parameter-efficient fine-tuning, trains a small set of weights and leaves the base model untouched, as in Week 2; LoRA is the common example, a low-rank update added to a weight matrix. The survey's problem statement is that a single adapter generalises poorly across several tasks and can cause catastrophic forgetting. The remedy is a mixture of adapters with a router.
Figure 6 sorts methods by where they sit. Attention: adapters on keys and values, or queries and outputs (MoELoRA, MoCLE, SiRA). Feed-forward: LoRAMoE, which keeps two adapter groups, one for downstream tasks and one for keeping pretrained world knowledge aligned with instructions, against forgetting; AdaMix, MixDA, LLaVA-MoLE, MixLoRA. Whole block: MoV, MoLoRA, UniPELT, Omni-SMoLA, MoLA and others. Every layer: MoLE, which treats each trained LoRA layer as an expert and trains only the router to compose them.
The claim is better multi-task behaviour at adapter-sized cost. Only qualitative claims are given here. On the earlier gating slide we saw that dense mixing is acceptable because adapters are cheap to run. The costs the survey names, in its closing challenges: these methods may hurt performance or complicate existing parallel strategies for pretraining and inference.

---

<p class="eyebrow"><span class="paper">Cai et al. 2024</span> · §4.4, Fig. 7 · Choice 5 of 6, schemes · What, who and costs</p>

## Where does a mixture of experts come from?

<div class="cols wide-fig">
<div class="text">

- **Upcycling**: copy a trained dense FFN into every expert, add a random router, keep training.
- Skywork-MoE: from scratch beats upcycled; more similar experts predict a worse model.
- **Distillation**: train a small dense model to copy the mixture; Switch keeps about 30% of the gain at about 5% of the parameters.
- **Merging**: Branch-Train-MiX trains domain models apart, then joins their FFNs as experts.

</div>
<div class="fig"><img src="img/week-07-cai-fig7-schemes.png" alt="Cai et al. Figure 7: four training and inference schemes, (a) original, trained as a mixture from the start, (b) merging separate expert models, (c) dense to sparse, (d) sparse to dense"></div>
</div>

<p class="footnote">Cai et al. 2024 · §4.4, Fig. 7; the Switch figure is relayed. Skywork-MoE: Kunlun's 146B model; Branch-Train-MiX: separate domain models merged into one mixture. Check (ours): Mixtral has Mistral 7B's exact shape; the paper does not say if it was upcycled</p>

Note:
Choice 5: not how to build the layer, but where the model comes from. Figure 7 has four panels. The original scheme trains from scratch. Dense to sparse is upcycling, Komatsuzaki et al. 2022: take a trained dense checkpoint, copy every feed-forward network into all the experts, initialise a random router and keep training. The cost is an initial quality drop from the surgery. Skywork-MoE reports that models trained from scratch beat upcycled ones, that you should decide by what dense checkpoints and training budget you have, and that more similar experts predict a worse model; no magnitudes are given.
Sparse to dense: distil the mixture into a small dense model for cheap serving. The survey relays from Switch that the distilled model keeps about 30 percent of the sparse model's quality gain with about 5 percent of the parameters; and from another paper, 61.7 percent on ImageNet and 88.2 percent on language tasks. So some of the gain is lost.
Merging: Branch-Train-Merge trains a set of domain language models separately; Branch-Train-MiX joins their feed-forward networks as experts, averages the attention layers, and fine-tunes the mixture on all the data together.
Our check: Mixtral has exactly Mistral 7B's shape with 8 feed-forward networks per layer, which looks like upcycling, but its paper does not say whether it was.

---

<p class="eyebrow"><span class="paper">Cai et al. 2024</span> · §5, Fig. 8 · Choice 6 of 6, systems · What, who and costs</p>

## What does the hardware have to do?

<div class="rows">
<div class="points">
<div class="text">

- **Expert parallelism**: each expert lives on its own GPU; the other layers are copied.
- Flow: route, group tokens by expert, **all-to-all** dispatch, compute, all-to-all combine.

</div>
<div class="text">

- Four all-to-alls per layer per step: often the main bottleneck.
- Fixes: topology-aware routing, overlap with compute, offload idle experts to CPU or SSD.

</div>
</div>
<div class="fig"><img src="img/week-07-cai-fig8-parallel.png" alt="Cai et al. Figure 8: expert parallelism across four GPUs, with all-to-all dispatch before and all-to-all combine after expert computation, shown as (a) data plus expert, (b) with tensor, (c) with pipeline, (d) expert plus tensor parallelism"></div>
</div>

<p class="footnote">Cai et al. 2024 · §5, Fig. 8a (flow), §5 storage. All-to-all: every device sends a piece to every other device. All claims qualitative; the survey gives no speed numbers. Every expert has to be stored somewhere</p>

Note:
Choice 6. Mixtures of experts are as much a systems problem as a modelling one. Expert parallelism, introduced by GShard, puts each expert on a different device while the non-expert layers are copied on every device, like data parallelism with the experts split. Figure 8a gives the flow: the gate routes; tokens for the same expert are grouped into one contiguous block, so the matrix multiply is big enough to keep the device busy; an all-to-all sends each group to the device holding its expert; the experts compute; a second all-to-all brings results home; the outputs are put back in order. Panels b to d add tensor and pipeline parallelism.
The survey says the four all-to-alls per mixture layer, two forward and two backward, are often the main bottleneck. Fixes: hierarchical and topology-aware routing that keeps traffic inside a node, DeepSeek-V3's node limit being one we meet in the next reading; overlapping communication with computation; and, for memory, offloading idle experts to CPU memory or SSD with prefetching. A dense-expert hybrid in the shared-expert style helps overlap.
The survey's own statement of the memory problem is worth keeping: every expert has to be stored somewhere. That matches Week 4: a mixture cuts arithmetic per token, not the weights that must be held. And note there are no throughput numbers anywhere in its system section; every claim is attributed and qualitative.

---

<p class="eyebrow"><span class="paper">Cai et al. 2024</span> · §7 · Open questions</p>

## What does the survey say is still open?

<table class="rules" style="font-size:19px">
  <tr><td>challenge</td><td>in the survey's words</td></tr>
  <tr><td>stability and balance</td><td>balance losses "can still lead to training instability"</td></tr>
  <tr><td>communication</td><td>a "significant bottleneck" in distributed training</td></tr>
  <tr><td>specialisation and collaboration</td><td>a weighted sum of the top experts can overlook relations among them</td></tr>
  <tr><td>sparse compute on hardware</td><td>sparse operations are "non-uniform" for accelerators</td></tr>
  <tr><td>generalisation</td><td>sparse models tend to overfit specific tasks</td></tr>
  <tr><td>interpretability</td><td>hard to explain which expert does what</td></tr>
  <tr><td>best expert architecture</td><td>how many experts, in which layers</td></tr>
  <tr><td>plugging into existing models</td><td>adapt a model without training from scratch</td></tr>
</table>

<p class="footnote">Cai et al. 2024 · §7, eight challenges as listed there, in its order; the quotes are its words, the other cells short paraphrases (ours)</p>

Note:
The survey ends with eight open challenges, in this order. One: stability and balance; losses help but "can still lead to training instability". Two: communication overhead, which the survey says is a significant bottleneck, and it suggests shared experts might reduce data movement. Three: specialisation and collaboration; shared experts are the prevailing strategy, but a sparse weighted sum of a few experts can overlook relations across the whole set. Four: making sparse computation fast, since sparse operations are non-uniform for accelerators. Five: generalisation; sparse models tend to overfit specific tasks, with dropout, token dropping and multi-task instruction tuning offered as remedies. Six: interpretability. Seven: the best expert architecture, which network type and how many experts per layer, including the idea of different counts in different layers and automated architecture search. Eight: integration with existing models, adapting a trained model without training from scratch.
The first row of the table is its header, so there are eight challenges.

---

<p class="eyebrow"><span class="paper">Cai et al. 2024</span> · §3, §4, Tables 1 to 3 · Critique</p>

## As a reviewer, what is missing or wrong?

<div class="cols">
<div class="text">

1. No experiments; Table 3 mixes protocols (base, instruct and chat models; 5- and 8-shot), so its rows do not compare.
2. Errors: DeepSeekMoE 16B needs "40% less computation", but the paper says about 40% of the computation.
3. Table 1's 0.01 fits DeepSeekMoE's 2B runs, not its 16B (0.001) or 145B (0.003); GShard and Mixtral print none.
4. Missing: balancing without an auxiliary loss, and sigmoid gating, though V3 is in its Table 2.

</div>
<div class="text">

<p class="plain">The survey also states "increasing $k$ enhances performance" with no citation, next to a result that is not monotone in $k$ (ours).</p>
<p class="plain">Does it sink the survey? No. It is a good map: use it to find papers, not numbers.</p>

</div>
</div>

<p class="footnote">Cai et al. 2024 · §3, §4.1.1, Tables 1 to 3, checked against the DeepSeekMoE paper. GSM8K: grade-school maths word problems; n-shot: n worked examples in the prompt; instruct, chat: tuned to follow instructions</p>

Note:
A reviewer's pass, with the survey checked against the papers we have read. First, no experiments of its own, so every number is relayed. Its Table 3 lists 13 models with MMLU, GSM8K, MATH and HumanEval scores under a header saying 5-shot, 5-shot, 4-shot and 0-shot "unless specified otherwise", but some GSM8K cells are 8-shot or 3-shot, two cells give two numbers, and rows mix base, instruct and chat models. Rows are not comparable.
Second, errors we could check. It says DeepSeekMoE 16B needs "40% less computation" than Llama 2 7B; the DeepSeekMoE paper says about 40 percent of the computation, which is about 60 percent less. Third, Table 1 gives one coefficient, 0.01, for DeepSeekMoE and DeepSeek-V2. DeepSeekMoE uses 0.01 only for its 2B validation runs, 0.001 for 16B and 0.003 for 145B; DeepSeek-V2 uses three losses with 0.003, 0.05 and 0.02. GShard prints no value for its multiplier and Mixtral's paper states none. Also, "top-16" for DeepSeekMoE 145B is 4 shared plus 12 routed.
Fourth, what is missing: auxiliary-loss-free balancing and sigmoid gating, though DeepSeek-V3 is in its model table. The survey also states without citation that "increasing the value of k enhances performance", just above the one result it gives, where top-16 beat top-1 but lost to plain top-4, and four grouped top-1 gates beat them all (ours).
Does it sink the survey? No. A map with a few wrong labels is still a map. Use it to find papers and see lineage, and then go to the paper for the number.


---


<!-- .slide: class="cover divider" -->

<p class="kicker">Reading 3 of 3</p>
<h1>Dai et al. 2024; DeepSeek-AI 2024</h1>
<p class="subtitle">DeepSeekMoE and DeepSeek-V3, key results</p>
<p class="question">What changes when experts are many and small, and when the balance loss goes?</p>
<ol class="track"><li class="done">Mixtral 2024<span>sparse 8x7B</span></li><li class="done">Cai et al. 2024<span>the survey's map</span></li><li class="now">DeepSeekMoE and V3<span>many small experts</span></li></ol>

Note:
Reading 3 of 3, in key results only. Two papers from the same group. DeepSeekMoE (Dai et al., January 2024) is a method paper: split experts finer and keep some always on. DeepSeek-V3 (December 2024) is a model report that uses that design at 671 billion parameters and changes two things, the router and the way load is balanced. We go through each result once and keep what changes how you read the other two readings.

---

<p class="eyebrow"><span class="paper">Dai et al. 2024</span> · Part 6, many small experts · the equation</p>

## What were fine-grained and shared experts again?

<div class="cols">
<div class="text">

- **Shared experts** are always on and have no gate. Each token uses all of them.
- **Routed experts** are the ordinary kind: the router picks the top few per token.
- The 2B model has 1 shared and 7 of 63 routed experts, each a quarter-size FFN.
- Why: with 8 or 16 big experts, one expert's tokens "cover diverse knowledge".

</div>
<div class="text">

<div class="eq">$$h_t = u_t + \sum_{i=1}^{K_s} \mathrm{FFN}_i(u_t) + \sum_{i=K_s+1}^{mN} g_{i,t}\,\mathrm{FFN}_i(u_t)$$</div>

<dl class="where">
<dt>$h_t$, $u_t$</dt><dd>layer output and input for token $t$ (the hidden state after attention)</dd>
<dt>$\mathrm{FFN}_i$</dt><dd>the $i$-th expert, a feed-forward network (FFN)</dd>
<dt>$K_s$</dt><dd>number of shared experts</dd>
<dt>$N$, $m$</dt><dd>experts before splitting, and how many pieces each is split into</dd>
<dt>$g_{i,t}$</dt><dd>gate: the router's softmax score if expert $i$ is in the top $mK - K_s$, else 0 ($K$ = number chosen before splitting)</dd>
</dl>

<p class="plain">In words: a few always-on experts hold common knowledge, and the router picks many small specialists on top.</p>

</div>
</div>

<p class="footnote">Dai et al. 2024 (DeepSeekMoE), arXiv:2401.06066 · Eq. 9 to 11, §3.2; Fig. 2 was shown in Week 4. FLOPs (floating-point operations): arithmetic count per forward pass</p>

Note:
Week 4 showed the picture, DeepSeekMoE Figure 2: top-2 of N experts, then each expert split into smaller ones with more chosen, then one expert made shared. This is the same idea as an equation. The gate is zero for all but the top mK minus K_s routed experts, so the arithmetic stays equal to the unsplit design: split every expert into m pieces, choose m times as many, and take K_s of those choices away because the shared experts already run.
The numbers: at 2B, N is 16, m is 4, K is 2 and K_s is 1, so 64 experts, one shared and 63 routed, 7 routed chosen. The paper's reason: "Knowledge Hybridity", with only 8 or 16 experts the tokens sent to one expert cover diverse knowledge, and "Knowledge Redundancy", different experts each relearn common knowledge. The headline count of combinations (120 for top-2 of 16, against 4.4 billion for 8 of 64) uses the pre-shared design; with the shared expert it is 7 of 63, 553 million (ours). The paper says the surge in combinations "enhances the potential" for more targeted knowledge, but never tests the combination count by itself.
One oddity: at 16B the model has 2 shared and 64 routed, and at 145B 4 shared and 128 routed. Those counts do not map onto an integer N in the formal notation, and the paper does not reconcile it.

---

<p class="eyebrow"><span class="paper">Dai et al. 2024</span> · Part 6, many small experts · Experiment 1, same size as GShard · Table 1</p>

## Does it beat GShard at matched size?

<div class="rows">
<div class="points">
<div class="text">

- Same as GShard: 2.0B total and 0.3B active parameters, 4.3T FLOPs per 2K tokens, 100B training tokens.
- Pile loss falls from 1.867 to 1.808, and DeepSeekMoE is best on all 11 rows.

</div>
<div class="text">

- Switch (top-1) and Hash are cheaper context, at 0.2B active.
- One number per model, no error bars.

</div>
</div>

<table class="rules">
  <tr><td>2B models, 100B tokens</td><td>active</td><td>FLOPs</td><td>Pile loss</td><td>HellaSwag</td><td>TriviaQA</td></tr>
  <tr><td>Dense</td><td>0.2B</td><td>2.9T</td><td>2.060</td><td>38.8</td><td>4.9</td></tr>
  <tr><td>Hash Layer</td><td>0.2B</td><td>2.9T</td><td>1.932</td><td>46.2</td><td>6.5</td></tr>
  <tr><td>Switch</td><td>0.2B</td><td>2.9T</td><td>1.881</td><td>49.1</td><td>8.9</td></tr>
  <tr><td>GShard</td><td>0.3B</td><td>4.3T</td><td>1.867</td><td>50.5</td><td>10.2</td></tr>
  <tr class="total"><td>DeepSeekMoE</td><td>0.3B</td><td>4.3T</td><td><b>1.808</b></td><td><b>54.8</b></td><td><b>16.6</b></td></tr>
</table>
</div>

<p class="footnote">Dai et al. 2024 · §4.2, Table 1. Pile: a large mixed English text corpus, test loss (lower is better). HellaSwag: choose a story's sensible ending, accuracy. TriviaQA: closed-book trivia, exact match. Hash: fixed hash routing; Switch: top-1 learned</p>

Note:
This is the one comparison that isolates the architecture, because GShard and DeepSeekMoE have the same total parameters, the same active parameters, the same FLOPs and the same data. Only the layer design differs: top-2 of 16 big experts against 1 shared plus 7 of 63 quarter-size ones.
Pile loss goes from 1.867 to 1.808, a drop of 0.059, and DeepSeekMoE is best on all 11 rows: for example HellaSwag 50.5 to 54.8, TriviaQA 10.2 to 16.6, NaturalQuestions 3.2 to 5.7 (ours: differences). The dense 0.2B model is at 2.060, so the whole sparse family beats it at equal active parameters. Caveats: single runs per model, no seeds or error bars anywhere in the paper, and the code rows (HumanEval 3.7 to 4.9, MBPP 0.2 to 2.2) are close to zero so they carry little signal. The claim is limited to this scale: about 2B total and 100B tokens.

---

<p class="eyebrow"><span class="paper">Dai et al. 2024</span> · Part 6, many small experts · Experiment 2, the capacity bound · Table 2</p>

## How close is it to every expert always on?

<div class="rows">
<div class="points">
<div class="text">

- **Dense x16** uses all 16 FFN-widths for every token; the paper calls it the "upper bound".
- DeepSeekMoE needs 4.3T FLOPs, Dense x16 needs 24.6T: 5.7 times more (ours).

</div>
<div class="text">

- GShard x1.5 has 1.5 times the expert size and 5.8T FLOPs (1.35 times, ours).
- The reading-comprehension rows trail both by 0.7 to 2.4 points.

</div>
</div>

<table class="rules">
  <tr><td>2B models, 100B tokens</td><td>GShard x1.5</td><td>Dense x16</td><td>DeepSeekMoE</td></tr>
  <tr><td>activated expert parameters</td><td>0.35B</td><td>1.89B</td><td>0.24B</td></tr>
  <tr><td>FLOPs per 2K tokens</td><td>5.8T</td><td>24.6T</td><td>4.3T</td></tr>
  <tr><td>Pile loss</td><td>1.808</td><td>1.806</td><td>1.808</td></tr>
  <tr class="total"><td>RACE-middle</td><td>46.4</td><td>46.3</td><td>44.0</td></tr>
</table>
</div>

<p class="footnote">Dai et al. 2024 · §4.3, Table 2. "Upper bound" is the authors' word, not a theorem; they claim it only "at least at the scale of about 2B parameters and 100B training tokens". RACE-middle: reading comprehension from school exams, accuracy</p>

Note:
Dense x16 is a model whose 16 experts are all shared, so every parameter is used for every token. The paper treats it as the capacity ceiling: in its view no routing choice can do better with the same parameters. DeepSeekMoE reaches 1.808 against its 1.806 at less than a fifth of the arithmetic (4.3T against 24.6T FLOPs, 5.7 times, ours). That ties back to Part 1: at this size and data, stored sparse capacity is worth almost what dense capacity is.
Read the claims carefully. "Upper bound" is the paper's framing. The abstract says GShard x1.5 has 1.5 times the computation, but the table's FLOPs ratio is 5.8 over 4.3, 1.35 (ours); the 1.5 is the expert-size ratio. The match is on Pile loss and most tasks; the RACE reading-comprehension rows are 0.7 to 2.4 points below both comparators and the paper does not discuss it. Another detail: DeepSeekMoE has 0.3B active parameters in Table 1 but 0.24B in Table 2, because Table 2 counts expert weights only; GShard x1.5's 0.35B is a bigger model than Table 1's GShard.

---

<p class="eyebrow"><span class="paper">Dai et al. 2024</span> · Part 6, many small experts · Experiment 3, specialisation · Fig. 4</p>

## Are the experts more specialised?

<div class="cols wide-fig">
<div class="text">

- Test: switch off each token's top-scoring routed experts, then pick from the rest.
- DeepSeekMoE's Pile loss climbs faster than GShard x1.5's, so each expert is harder to replace.
- Switching off the shared expert and adding one routed: 1.808 rises to 2.414.
- These tests damage a trained model. They show dependence, not a better design (ours).

</div>
<div class="fig"><img src="img/week-07-dsmoe-fig4-redundancy.png" alt="Line chart of Pile loss against the ratio of disabled top routed experts, 0 to 4/16: DeepSeekMoE rises faster than GShard x1.5, both starting near 1.8"></div>
</div>

<p class="footnote">Dai et al. 2024 · §4.5, Fig. 4; shared-expert test in the same section. Both curves leave the 1.8 range once experts are masked (about 5 to 9), so the figure shows how fast, not a usable setting (ours)</p>

Note:
The paper's evidence for "specialisation", in three tests. The one in this figure: for each token, mask a share of the routed experts with the highest routing score and pick the top K from what is left. GShard x1.5 is the comparator because it has the same Pile loss, 1.808, with nothing disabled. DeepSeekMoE gets worse faster, which the authors read as lower redundancy: each routed expert is harder to replace. Reading caveat (ours): once the top experts are masked both models sit at loss 5 to 9, so both are broken, and the share is relative to 16 for both models, so the number of masked experts differs per model; the text does not say how the fractions map to counts.
The shared expert test: disable it and add one more routed expert, and Pile loss rises from 1.808 to 2.414, worse than the dense 0.2B model in Table 1 (2.060, ours). Next slide's depth: the test that retrains. "Specialisation" itself, meaning non-overlapping, focused knowledge, is inferred, never measured per expert. V3 later does show per-domain load.

--

<p class="eyebrow"><span class="paper">Dai et al. 2024</span> · Part 6, many small experts · Experiment 3, specialisation · Fig. 5 and Fig. 6</p>

## What if it activates fewer experts?

<div class="rows">
<div class="points">
<div class="text">

- Fig. 5 (left): with only 4 routed experts on, DeepSeekMoE already matches GShard's Pile loss.

</div>
<div class="text">

- Fig. 6 (right) retrains with 1 shared and 3 of 63 routed: half GShard's active expert parameters.

</div>
</div>
<div class="fig"><img style="max-width:40%" src="img/week-07-dsmoe-fig5-activated.png" alt="Pile loss against the number of activated routed experts, 3 to 7, for DeepSeekMoE, with GShard's loss as a dashed horizontal line"><img style="max-width:58%" src="img/week-07-dsmoe-fig6-half.png" alt="Bars on six benchmarks: GShard with 2 of 16 experts against DeepSeekMoE with 1 shared and 3 of 63 routed, half the active expert parameters"></div>
</div>

<p class="footnote">Dai et al. 2024 · §4.5, Fig. 5 and Fig. 6. ARC-easy: grade-school science questions. NaturalQuestions: real search questions answered closed-book, exact match</p>

Note:
Fig. 5 varies how many routed experts a trained DeepSeekMoE model uses, from 3 to 7. Pile loss is roughly 1.96 at 3, 1.87 at 4, 1.83 at 5, 1.81 at 6 and 1.808 at 7 (ours, read off the figure), and GShard's 1.867 is the dashed line. So 4 routed plus the shared expert, 1.25 FFN-widths of compute against GShard's 2.0, matches GShard.
Fig. 6 is the only one of the three tests that retrains from scratch: one shared expert and 3 of 63 routed, so four quarter-size experts, one FFN-width, half of GShard's. It still beats GShard on all six benchmarks plotted. Approximate reads of the bars (ours): HellaSwag 52 against 50.5, ARC-easy 48 against 44, TriviaQA 16 against 10, NaturalQuestions 5.3 against 3.2.

--

<p class="eyebrow"><span class="paper">Dai et al. 2024</span> · Part 6, many small experts · Scale-up to 16B · Table 3</p>

## Does 16B at 40% of the compute match a dense 7B?

<div class="cols wide-text">
<div class="text">

- Both train on the same 2T-token corpus; DeepSeekMoE 16B has 2.8B active, dense 7B has 6.9B.
- It uses 40.5% of the FLOPs and scores higher on 12 of 20 rows, lower on 8.
- Authors' explanation of the losses: small attention, 0.5B parameters against 2.5B.

</div>
<div class="fig">
<table class="rules">
  <tr><td>16B vs dense 7B</td><td>dense 7B</td><td>MoE 16B</td></tr>
  <tr><td>FLOPs per 4K tokens</td><td>183.5T</td><td>74.4T</td></tr>
  <tr><td>Pile (BPB)</td><td>0.75</td><td>0.74</td></tr>
  <tr><td>TriviaQA</td><td>59.7</td><td>64.8</td></tr>
  <tr><td>MMLU</td><td>48.2</td><td>45.0</td></tr>
  <tr><td>CEval</td><td>45.0</td><td>40.6</td></tr>
  <tr class="total"><td>CMMLU</td><td>47.2</td><td>42.5</td></tr>
</table>
</div>
</div>

<p class="footnote">Dai et al. 2024 · §5.2, Table 3; row counts are ours. BPB: bits per byte, lower is better. MMLU: 57-subject exam. CEval, CMMLU: Chinese multi-subject exams like MMLU. Attention: the part of each layer that mixes tokens</p>

Note:
Optional depth. At scale the authors train a 16.4B-parameter DeepSeekMoE with 2.8B active on 2 trillion tokens and set it beside a dense 7B model on the same corpus, with 40.5% of the FLOPs. Their summary is "comparable". The strict count (ours) is higher on 12 of 20 rows and lower on 8. The wins are on knowledge and language modelling: TriviaQA plus 5.1, NaturalQuestions plus 3.3. The losses are on multiple choice: MMLU minus 3.2, CEval minus 4.4, CMMLU minus 4.7. The authors attribute these to the small attention, about 0.5B parameters against 2.5B, and say FFNs hold memorised knowledge. Against LLaMA2 7B the model is higher on 16 of 20 rows, but the code and Chinese gaps are attributed to the corpus mix, not the architecture. The 16B model fits one 40 GB GPU without quantization (about 33 GB in 16-bit, ours), a reminder that every expert must be resident.

---

<p class="eyebrow"><span class="paper">DeepSeek-AI 2024</span> · Part 6, DeepSeek-V3 · §2.1, Fig. 2 · the router</p>

## What is new in DeepSeek-V3's router?

<div class="cols wide-fig">
<div class="text">

- 58 of its 61 layers are MoE: all but the first three. Each has 1 shared and 256 routed experts.
- The score is a sigmoid, so the 8 kept scores are rescaled to sum to 1.
- **Node limit**: each token goes to at most 4 nodes (a node is one server of 8 GPUs).

<div class="eq">$$g_{i,t} = \frac{g'_{i,t}}{\sum_{j} g'_{j,t}},\qquad s_{i,t} = \mathrm{Sigmoid}(u_t^\top e_i)$$</div>

<dl class="where">
<dt>$s_{i,t}$</dt><dd>token $t$'s affinity to routed expert $i$</dd>
<dt>$u_t$, $e_i$</dt><dd>the token's hidden state, and expert $i$'s learned centroid vector</dd>
<dt>$g'_{i,t}$</dt><dd>$s_{i,t}$ if expert $i$ is among the top 8, else 0</dd>
<dt>$g_{i,t}$</dt><dd>the gate actually used, kept scores summing to 1</dd>
</dl>

</div>
<div class="fig"><img src="img/week-07-v3-fig2-arch.png" alt="DeepSeek-V3 Figure 2: a Transformer block with an expanded DeepSeekMoE layer, shared experts 1 to N_s and routed experts 1 to N_r with a router and top-K_r choice, and the MLA attention block below"></div>
</div>

<p class="footnote">DeepSeek-AI 2024 (DeepSeek-V3), arXiv:2412.19437 · §2.1.2, Eq. 13 to 15, Fig. 2. GPU: graphics processor. No reason or ablation for the sigmoid is given. MLA: its attention variant</p>

Note:
Week 4 had the counts, one shared plus 8 of 256, and the sigmoid. New here: 58 of 61 layers are MoE, the first three are dense (no reason is given in V3; DeepSeekMoE's reason for a dense first layer was that balance converges slowly there). The affinity is a sigmoid of a dot product with a learned expert vector, Equation 15, where DeepSeekMoE used a softmax. Because sigmoid scores do not sum to 1, the kept top 8 are divided by their sum, Equation 13. The paper gives no reason for the sigmoid and keeps it fixed in its ablations, so it is a control, not a tested choice.
The node limit is new. Each token may go to at most M equals 4 nodes, chosen by the sum of the top K_r over M, that is 2, scores on each node. Why: links between servers (InfiniBand, 50 GB/s) are 3.2 times slower than links inside a server (NVLink, 160 GB/s), so the cap keeps the all-to-all exchange overlapped with computation. The paper notes a token could then use up to about 13 experts at the same communication cost, though it uses 8.

---

<p class="eyebrow"><span class="paper">DeepSeek-AI 2024</span> · Part 6, DeepSeek-V3 · §2.1.2 · balance without an auxiliary loss</p>

## How can you balance without an auxiliary loss?

<div class="cols">
<div class="text">

- Each expert gets a bias $b_i$ that only affects which experts are chosen.
- After each step, $b_i$ goes down by $\gamma$ if the expert was overloaded, up if underloaded.
- $\gamma$ is 0.001, then 0 for the last 500B of 14.8T tokens. No tokens are dropped.
- A tiny sequence-wise loss remains, with weight 0.0001.

</div>
<div class="text">

<div class="eq">$$g'_{i,t} = \begin{cases} s_{i,t} & s_{i,t} + b_i \in \mathrm{Topk}(\{s_{j,t} + b_j\}, K_r)\\ 0 & \text{otherwise} \end{cases}$$</div>

<dl class="where">
<dt>$s_{i,t}$</dt><dd>token $t$'s affinity to routed expert $i$</dd>
<dt>$b_i$</dt><dd>the bias of expert $i$, set by a controller, not by a gradient</dd>
<dt>$K_r$</dt><dd>routed experts kept per token (8)</dd>
<dt>$g'_{i,t}$</dt><dd>the score kept for expert $i$, before rescaling</dd>
</dl>

<p class="plain">In words: the bias changes who is asked, never how much their answer counts.</p>

</div>
</div>

<p class="footnote">DeepSeek-AI 2024 · §2.1.2, Eq. 16 and Eq. 17 to 20, §4.2. Method credited to Wang et al. 2024, arXiv:2408.15664 (same group). Auxiliary loss: a penalty added to training that pushes load to be even</p>

Note:
The old fix for uneven expert load was an auxiliary loss, but a big one hurts the model. V3 instead adds a bias to each expert's score only when choosing the top 8. The value that multiplies the expert's output is still the original score s, with no bias. Check: if the bias were added to the weight too, balancing would change what the layer outputs, which is what the auxiliary loss did; here the bias only changes who is asked.
The update is a controller, not a gradient: after each step, look at each expert's load over the whole batch, lower its bias by gamma if overloaded and raise it if underloaded. The paper gives no threshold for "overloaded" (presumably above the mean, ours). Gamma is 0.001 for the first 14.3T tokens and 0 for the last 0.5T, so the bias freezes. A small sequence-wise balance loss with weight 0.0001 remains, 10 to 100 times below DeepSeekMoE's 0.01, 0.001 and 0.003 coefficients (ours), just to avoid extreme imbalance inside one sequence. No tokens are dropped in training or inference. Credit: the method comes from Wang et al. 2024, same group; V3's contribution is using it at scale.

---

<p class="eyebrow"><span class="paper">DeepSeek-AI 2024</span> · Part 6, DeepSeek-V3 · §4.5, Table 5 · ablation</p>

## Does the bias beat the auxiliary loss, and why?

<div class="rows">
<div class="points">
<div class="text">

- The bias wins 9 of 10 rows at 15.7B and 8 of 10 at 228.7B.
- Control: a batch-wise auxiliary loss ties the bias (validation loss 2.253 at 1B, 2.080 at 3B, for both).
- Sequence-wise: 2.258 and 2.085. So scope, not the bias, may do the work.

</div>
<div class="text">

- Single runs; the control only at 1B and 3B.

</div>
</div>

<table class="rules">
  <tr><td>aux loss vs bias</td><td>15.7B aux</td><td>15.7B bias</td><td>228.7B aux</td><td>228.7B bias</td></tr>
  <tr><td>Pile (BPB)</td><td>0.727</td><td><b>0.724</b></td><td>0.656</td><td><b>0.652</b></td></tr>
  <tr><td>MMLU</td><td>51.0</td><td><b>51.8</b></td><td><b>68.3</b></td><td>67.2</td></tr>
  <tr><td>HumanEval</td><td>22.0</td><td><b>22.6</b></td><td>40.2</td><td><b>46.3</b></td></tr>
  <tr class="total"><td>GSM8K</td><td>27.1</td><td><b>29.6</b></td><td>70.7</td><td><b>74.5</b></td></tr>
</table>
</div>

<p class="footnote">DeepSeek-AI 2024 · §4.5, Table 5; control in the text after Fig. 9 (counts are ours). BPB: bits per byte, lower is better. HumanEval: 164 Python problems, Pass@1. GSM8K: grade-school math word problems, exact match</p>

Note:
The ablation: two baselines, 15.7B total on 1.33T tokens and 228.7B on 578B tokens, trained only with auxiliary losses, then the same models with the losses replaced by the bias. The bias is better on 9 of 10 benchmarks at the small size and 8 of 10 at the large one. Pile bits per byte improves by only 0.003 and 0.004, about half a percent. At 228.7B several rows move by a point or more: HumanEval plus 6.1 (ten problems out of 164, ours), GSM8K plus 3.8, MATH plus 2.4; MMLU goes down 1.1. The auxiliary-loss coefficients are given only by reference to DeepSeek-V2.
A correction to a Week 4 note: it said the gain was mostly under a point; that is true at 15.7B but at 228.7B seven of nine non-Pile rows gain a point or more for the bias (MMLU loses 1.1).
The control is the important part. A batch-wise auxiliary loss, balancing over a batch rather than each sequence, matches the bias at 1B and 3B: validation loss 2.253 and 2.253, 2.080 and 2.080, against 2.258 and 2.085 for the sequence-wise loss. So the gain is consistent with batch-wise scope rather than the bias itself, shown at two small sizes with no seeds. The cost of batch-wise balance: imbalance inside a sequence, and under domain shift at inference; V3 answers with large batches and 32 redundant copies of busy experts when serving (in prefilling; decoding keeps 64 of 320 GPUs for redundant and shared experts).

---

<p class="eyebrow"><span class="paper">DeepSeek-AI 2024</span> · Part 6, DeepSeek-V3 · §4.5, Fig. 9 · expert load</p>

## Do V3's experts specialise by domain?

<div class="cols wide-fig">
<div class="text">

- **Relative expert load**: an expert's actual load divided by the perfectly balanced load.
- Auxiliary-loss model: load is even for Wikipedia, GitHub and DM Mathematics.
- Bias model: some experts run hot for one domain, many others sit near zero.
- A picture, no number. These domains differ in token types too (code, digits).

</div>
<div class="fig"><img src="img/week-07-v3-fig9-load.png" alt="Heat maps of relative expert load for 64 experts on three Pile domains in layers 9 and 18, for an auxiliary-loss model (even, pale) and the auxiliary-loss-free model (a few hot columns per domain)"></div>
</div>

<p class="footnote">DeepSeek-AI 2024 · §4.5, Fig. 9 (two layers of 16B models, Pile test set; appendix has all layers). Wikipedia: encyclopedia text. GitHub: code. DM Mathematics: generated school maths questions. Confounds are ours</p>

Note:
The authors' claim: balancing per batch is more flexible than per sequence, so experts can specialise by domain. They record the load of a 16B auxiliary-loss model and a 16B bias model on three domains of the Pile test set. In the auxiliary-loss panels every domain uses every expert about evenly. In the bias panels there are hot cells, for example one expert near the top of the colour scale (about 10 times balanced load) for DM Mathematics in layer 9, and several for GitHub, and many pale cells.
What it does not show: it is visual, with no number; the comparison changes both the balancing scope and the method; no load map for the batch-wise auxiliary loss is given; and the domains differ in token types, so some of this may be token-type routing, not topic routing. Contrast with Mixtral, where the routing analysis found no clear topic experts: per-sequence balance may hide domain experts, though Mixtral's own balancing method is not stated.

--

<p class="eyebrow"><span class="paper">DeepSeek-AI 2024</span> · Part 6, DeepSeek-V3 · Table 1 · cost</p>

## What did V3 cost to train?

<div class="cols wide-text">
<div class="text">

- 2.788M H800 GPU hours, about 5.576M USD at an assumed 2 USD per hour.
- About 180K GPU hours per trillion tokens, for 14.8T tokens.
- The figure leaves out "prior research and ablation experiments".

</div>
<div class="fig">
<table class="rules">
  <tr><td>stage</td><td>GPU hours</td><td>USD at 2 per hour</td></tr>
  <tr><td>pre-training</td><td>2,664K</td><td>5.328M</td></tr>
  <tr><td>context extension</td><td>119K</td><td>0.238M</td></tr>
  <tr><td>post-training</td><td>5K</td><td>0.01M</td></tr>
  <tr class="total"><td>total</td><td>2,788K</td><td>5.576M</td></tr>
</table>
</div>
</div>

<p class="footnote">DeepSeek-AI 2024 · §1, Table 1. H800: an Nvidia datacentre GPU. Dollars are a rental-price conversion, not a bill (ours). DualPipe (overlapping compute and expert all-to-all) and multi-token prediction (§2.2) are pointers only</p>

Note:
Optional. The headline cost: 2,664K H800 hours for pre-training, 119K for context extension, 5K for post-training, 2,788K in all, converted at an assumed 2 USD per hour to 5.576 million USD. The arithmetic checks (ours): 2,664K over 14.8T tokens is 180K per trillion, 3.7 days on 2,048 GPUs. The paper's own caveat: this includes only the official training run, not the research and ablations that led to it, and the dollar figure is a rental price. The MoE-relevant point is the claim that co-design lets them use fine-grained experts across nodes with near-zero all-to-all overhead. Two pointers only: DualPipe overlaps forward and backward computation with the expert all-to-all, and multi-token prediction trains the model to predict one extra token ahead.


---


<p class="eyebrow"><span class="paper">Per-layer embeddings</span> · Part 7 · another way to store more than you use</p>

## What is a per-layer embedding, and why can it leave the GPU?

<div class="cols wide-fig">
<div class="text">

- A second table, read by **token id**: one 256-number vector per token for every layer.
- Nothing is routed. Google's stated purpose: keep the table off the accelerator, in CPU memory or fast storage.
- Why it can leave (ours): rows are known from token ids before the forward pass; experts only after the router runs.

<div class="eq">$$h \leftarrow h + \mathrm{RMSNorm}\big(W_{\rm up}\,(\mathrm{GELU}(W_{\rm gate}\,h) \odot p_{t,j})\big)$$</div>

<dl class="where">
<dt>$h$</dt><dd>the hidden state of width $d$</dd>
<dt>$W_{\rm gate}$, $W_{\rm up}$</dt><dd>matrices from $d$ down to 256 and back</dd>
<dt>$p_{t,j}$</dt><dd>token $t$'s 256-number vector for layer $j$, built from the table row</dd>
<dt>GELU, RMSNorm, $\odot$</dt><dd>a smooth activation, a normalisation, an elementwise product</dd>
</dl>

</div>
<div class="fig"><img src="img/week-07-ple-params.png" alt="Stacked bars of parameters for Gemma 4 E2B (5.07B total, 2.27B effective) and E4B (7.88B total, 4.61B effective), split into transformer weights, main embedding, per-layer table and audio and vision encoders"></div>
</div>

<p class="footnote">Gemma 4 report, arXiv:2607.02770, parameter table; Gemma 3n documentation. Table size $262{,}144 \times (L \cdot 256)$, $L$ layers. <b>Effective</b> parameters: those that must sit on the accelerator. Bars: ours</p>

Note:
Per-layer embeddings (PLE) come from Gemma 3n and are used in the Gemma 4 E2B and E4B models. It is not a mixture of experts, but it answers the same question: how to store more parameters than you use per token. The table has one row per vocabulary item, 262,144 rows, and each row packs a 256-number vector for every layer side by side, so its width is the number of layers times 256. The vector is mixed with a projection of the ordinary embedding and scaled by one over root two. In each layer of Gemma 4 a small gated add-on uses it: the hidden state goes down to 256 numbers through W_gate, through GELU, is multiplied by the layer's vector, goes back up through W_up, is normalised and added to the hidden state. Gemma 3n adds it to its extra residual streams instead.
Why it can leave the accelerator: the rows a batch needs are known from the token ids before the forward pass, so they can be fetched from CPU memory or fast storage ahead of time. An expert is known only once that layer's router has run, so experts must sit in fast memory, or be fetched late, which is why expert offloading leans on locality. This is Google's stated purpose; the open-source reference code itself does not offload. So there is a third count beside total and active parameters: effective parameters, the ones that must sit on the accelerator. In the picture, E2B is 5.07B total and 2.27B effective, E4B 7.88B total and 4.61B effective (report table, helper drafter excluded, effective sum ours).

--

<p class="eyebrow"><span class="paper">Per-layer embeddings</span> · Part 7 · how big, and what is the evidence?</p>

## How big are the tables, and does PLE improve quality?

<div class="cols wide-text">
<div class="text">

- The per-layer table is 46% of E2B's total parameters and 36% of E4B's (ours).
- The report says 2.3B and 4.5B effective; its own table gives 2.27B and 4.61B.
- Gemma 3n E2B: 5.44B loaded normally, 1.91B with PLE cached and vision and audio encoders skipped.
- No source ablates PLE: "dramatically improves model quality" is Google's claim.

</div>
<div class="fig">
<table class="rules">
  <tr><td>Gemma 4 (millions)</td><td>E2B</td><td>E4B</td></tr>
  <tr><td>per-layer table</td><td>2,340</td><td>2,820</td></tr>
  <tr><td>total</td><td>5,065</td><td>7,885</td></tr>
  <tr><td>share of total</td><td>46%</td><td>36%</td></tr>
  <tr><td>stated effective</td><td>2.3B</td><td>4.5B</td></tr>
  <tr class="total"><td>transformer + main embedding</td><td>2,270</td><td>4,610</td></tr>
</table>
</div>
</div>

<p class="footnote">Gemma 4 report, parameter table (drafter excluded); Gemma 3n documentation, Fig. 1. Sums and shares are ours. Ablation: the same model trained with and without one component, to isolate its effect</p>

Note:
The numbers. In the Gemma 4 report's table the per-layer tables are 2,340M for E2B and 2,820M for E4B. Adding the audio encoder, vision encoder, main embedder, per-layer table and transformer matrices gives 5,065M and 7,885M, so the per-layer tables are 46% and 36% (ours). Effective is the transformer matrices plus the main embedding: 1,870 plus 400 is 2,270M for E2B, which matches the stated 2.3B; for E4B, 3,940 plus 670 is 4,610M, which does not round to the stated 4.5B (ours). The report's memory table also seems to count effective parameters only: 4.6 GB for E2B in 16-bit is 2.3B parameters.
For Gemma 3n E2B the documentation figure shows 5.44B loaded in standard execution against 1.91B with PLE caching and with the vision and audio encoders skipped; PLE alone is 2.55B of the difference (that figure likely also includes the ordinary token embedding, ours). One popular annotation says this compares against "Gemma 3 4B"; the documentation names it E2B, so that annotation is wrong. On quality: none of the sources, report, documentation or blog, shows a model with and without PLE, so the quality claim is untested here.


---


<p class="eyebrow"><span class="paper">Week 7</span> · synthesis · the four layers side by side</p>

## How do the four layer designs compare?

<table class="rules">
  <tr><td></td><td>GShard</td><td>Mixtral</td><td>DeepSeekMoE 16B</td><td>DeepSeek-V3</td></tr>
  <tr><td>experts per MoE layer</td><td>2048 (600B model)</td><td>8</td><td>2 shared + 64 routed</td><td>1 shared + 256 routed</td></tr>
  <tr><td>chosen per token</td><td>2 (second one random)</td><td>2</td><td>2 shared + 6 routed</td><td>1 shared + 8 routed</td></tr>
  <tr><td>which layers</td><td>every other layer</td><td>every layer</td><td>all but the first</td><td>all but the first 3</td></tr>
  <tr><td>router</td><td>softmax, top 2 renormalised</td><td>softmax over the top 2</td><td>softmax, top-k not renormalised</td><td>sigmoid, top 8 renormalised</td></tr>
  <tr><td>balancing</td><td>auxiliary loss</td><td>not stated</td><td>expert loss 0.001, no device loss</td><td>bias, plus loss 0.0001</td></tr>
  <tr class="total"><td>dropped tokens</td><td>yes, on overflow</td><td>not stated</td><td>none</td><td>none</td></tr>
</table>

<p class="footnote">Lepikhin et al. 2021 (GShard), Jiang et al. 2024 (Mixtral), Dai et al. 2024, DeepSeek-AI 2024. Router: the small network scoring experts. Top 2: keep the 2 highest scores. Overflow: an expert receives more tokens than its capacity</p>

Note:
One table across the readings. Reading across: the number of experts per layer rises from 8 (Mixtral) to 66 (DeepSeekMoE 16B) to 257 (V3), while the number chosen stays small, so the experts get smaller. GShard's 2048 experts are for its 600B model. The router moves from softmax over all experts to a softmax over the top 2 (Mixtral) to a sigmoid with renormalisation. Balancing moves from an auxiliary loss to an expert-level loss to a bias plus a very small loss. Dropped tokens: GShard drops tokens that overflow an expert's capacity; DeepSeekMoE and V3 drop none; Mixtral does not say. Note: the 16B model has 2 shared and 6 routed chosen; Mixtral's balancing method is not stated in its paper.

---

<p class="eyebrow"><span class="paper">Week 7</span> · scorecard</p>

## What survived?

<table class="rules">
  <tr><td>claim</td><td>source</td><td>status today</td></tr>
  <tr><td>13B active matches 70B</td><td>Mixtral</td><td>holds on most of their benchmarks, cause untested</td></tr>
  <tr><td>no topic experts</td><td>Mixtral</td><td>challenged by V3 Fig. 9, not settled</td></tr>
  <tr><td>fine-grained plus shared beats GShard at matched size</td><td>DeepSeekMoE Table 1</td><td>holds at 2B, single runs</td></tr>
  <tr><td>bias balancing beats the auxiliary loss</td><td>V3 Table 5</td><td>holds in two ablations; a small control points to batch-wise scope</td></tr>
  <tr class="total"><td>PLE improves quality</td><td>Google</td><td>untested: no ablation in the sources</td></tr>
</table>

<p class="footnote">Mixtral: Jiang et al. 2024. DeepSeekMoE: Dai et al. 2024, Table 1. V3: DeepSeek-AI 2024, Table 5, Fig. 9. PLE: Gemma 3n documentation and developer blog. Verdicts are ours</p>

Note:
The verdicts in one table. Mixtral's headline, that 13B active parameters match a 70B dense model, holds on most of the benchmarks they ran (ahead on 9 of 12 in their main table, ours), but no matched dense run isolates the cause. Its claim that routing shows no topic experts is challenged by V3's Figure 9, which shows domain-hot experts, but with confounds (token types, method and scope changed together), so it is not settled. DeepSeekMoE's win over GShard holds at 2B and 100B tokens in single runs. V3's bias beats the auxiliary loss in two ablations, but a control shows a batch-wise auxiliary loss ties it at 1B and 3B, which points to the balancing scope. "PLE improves quality" is Google's claim with no ablation in any source we read, so it is open.

---

<p class="eyebrow"><span class="paper">Week 7</span> · limitations the authors admit</p>

## What do the authors say they could not show?

<table class="rules">
  <tr><td>paper</td><td>own limitation</td></tr>
  <tr><td>Mixtral</td><td>memory, batching, expert-parallel balance; small routing analysis</td></tr>
  <tr><td>Survey</td><td>no limitations section; open challenges listed instead</td></tr>
  <tr><td>DeepSeekMoE</td><td>claim only "at least at the scale of about 2B parameters and 100B training tokens"; weak on multiple choice</td></tr>
  <tr class="total"><td>DeepSeek-V3</td><td>large deployment unit; generation speed still to improve</td></tr>
</table>

<p class="footnote">Jiang et al. 2024; Cai et al. 2024; Dai et al. 2024, §4.3, §5.2; DeepSeek-AI 2024, conclusion. Expert-parallel: experts spread over several GPUs</p>

Note:
In their own words, as far as they say them. Mixtral admits that all experts must sit in memory, that batching and balancing across devices are harder, and gives only a small routing analysis. The survey has no limitations section; its closing open-challenges section is the nearest thing. DeepSeekMoE scopes its main claim to about 2B parameters and 100B tokens, calls its 145B model preliminary, and admits weakness on multiple choice, blamed on small attention. V3 says its recommended deployment unit is relatively large, a burden for small teams, and that generation speed can still improve. Not admitted (ours): single runs and no error bars in the ablations.

---

<p class="eyebrow"><span class="paper">Week 7</span> · what is left open</p>

## What do these papers leave open?

<table class="rules">
  <tr><td>question</td><td>why it is open</td></tr>
  <tr><td>sparse against dense at equal data</td><td>no matched dense run in Mixtral; DeepSeekMoE at 2B and 16B only</td></tr>
  <tr><td>why routers specialise, or do not</td><td>Mixtral and V3 Fig. 9 point opposite ways</td></tr>
  <tr><td>the right granularity</td><td>8, 66 and 257 experts; only DeepSeekMoE varies it, at 2B</td></tr>
  <tr class="total"><td>cost at batch size 1</td><td>every expert must be resident, but few are used</td></tr>
</table>

<p class="footnote">Part 1 posed the first question (does stored capacity count like dense capacity?). Batch size 1: one request at a time, as on a phone or laptop</p>

Note:
Four directions the readings point to. First, the question from Part 1: does stored sparse capacity count like dense capacity? DeepSeekMoE answers at 2B and 100B tokens, and against a dense 7B on the same 2T tokens; Mixtral has no matched dense model. Second, why routers specialise: Mixtral saw syntax-like patterns, V3 saw domain-hot experts, and neither tests a cause. Third, granularity: only DeepSeekMoE varies it (16, 32 and 64 experts at 2B, its ablation figure); Mixtral's 8 and V3's 257 are not ablated. Fourth, cost at batch size 1: with one request, few experts are used but all must be in memory, which is where per-layer embeddings, fetched by token id, offer a different trade.

---

<p class="eyebrow"><span class="paper">Week 7</span> · as a reviewer</p>

## What would I ask the authors?

<table class="rules">
  <tr><td>paper</td><td>request</td></tr>
  <tr><td>Mixtral</td><td>a matched dense run, and the data mix</td></tr>
  <tr><td>Survey</td><td>a table of matched comparisons, not configurations</td></tr>
  <tr><td>DeepSeekMoE</td><td>seeds and error bars on Table 1</td></tr>
  <tr class="total"><td>DeepSeek-V3</td><td>seeds and error bars on Table 5</td></tr>
</table>

<p class="footnote">Mixtral: Jiang et al. 2024. Survey: Cai et al. 2024. Seeds: repeated runs with different random starts. Requests are ours</p>

Note:
One request each. Mixtral: a dense model trained on the same data with the same recipe would turn "13B active matches 70B" into a test of the sparse design, and the training data mix is not disclosed. The survey: a table of results from matched comparisons, with the same data and budget, instead of a catalogue of configurations. DeepSeekMoE and V3: repeated runs with error bars on Table 1 and Table 5. Several differences there are one or two points on a single run, which run-to-run variance could produce at these sizes.

---

<p class="eyebrow"><span class="paper">Week 7</span> · discussion</p>

## Questions for discussion

<table class="rules">
  <tr><td>reading</td><td>question</td></tr>
  <tr><td>Mixtral</td><td>if experts follow syntax, not topic, what is an expert for?</td></tr>
  <tr><td>Survey</td><td>which comparison would you need to choose among the designs?</td></tr>
  <tr class="total"><td>DeepSeek</td><td>if a batch-wise loss ties the bias, what did the bias add?</td></tr>
</table>

<p class="footnote">Mixtral: Jiang et al. 2024 routing analysis. Survey: Cai et al. 2024. DeepSeek: DeepSeek-AI 2024, §4.5 control</p>

Note:
One question per reading. Mixtral: its routing analysis found no clear topic experts, with patterns that follow syntax and position. If that holds, what is the benefit of having many experts, and what would we measure to say what an expert does? The survey: it describes many designs; what matched comparison, same data and budget, would you ask for before choosing one? DeepSeek: the control shows a batch-wise auxiliary loss reaching the same loss as the bias at 1B and 3B. What, then, does the bias add, perhaps simplicity or no extra gradient term, and would you expect the same at 671B?

