<!-- .slide: id="week-07" class="cover week" -->

<h1>Week 7</h1>
<p class="subtitle">Mixture of Experts and Sparse Models</p>

Note:
Mixture of experts: how to store far more parameters than each token uses. Three readings, Mixtral, the Cai et al. survey and the DeepSeek line, each in its own order, and a last look at per-layer embeddings.


---

<p class="eyebrow"><span class="paper">Week 7</span> · overview · the readings</p>

## What will this week read, and what does each reading ask?

<div class="cols wide-text">
<div class="text">

<table class="rules">
  <tr><td>reading</td><td>the question it asks</td></tr>
  <tr><td>Mixtral 2024</td><td>can 13B parameters per token match 70B?</td></tr>
  <tr><td>Cai et al. 2024 (survey)</td><td>what would you have to decide to build one?</td></tr>
  <tr><td>DeepSeekMoE and V3 2024</td><td>what changes when experts are many and small?</td></tr>
  <tr><td>per-layer embeddings</td><td>is there another way to store more than you use?</td></tr>
</table>

</div>
<div class="text">

- A **mixture of experts** (MoE) stores many feed-forward networks and sends each token to only a few.
- A **feed-forward network** (FFN) is the two-layer block that follows attention in every Transformer layer.

</div>
</div>

<p class="footnote">arXiv IDs: Mixtral 2401.04088, Cai et al. 2407.06204, DeepSeekMoE 2401.06066, DeepSeek-V3 2412.19437</p>

Note:
Week 6 ended with a clean rule: loss falls as a power law in the number of parameters, and every token costs about two multiply-adds per parameter. In a dense model those are the same parameters, so a model that knows more costs more on every token. A mixture of experts breaks that link: it stores many feed-forward networks, the experts, and a small router sends each token to only a few of them. Mixtral holds 47 billion parameters and uses 13 billion per token; DeepSeek-V3 holds 671 billion and uses 37 billion. We read Mixtral first, in its own order, then the survey as a map of the design choices, then the DeepSeek papers, and close with per-layer embeddings.


---


<!-- .slide: class="cover divider" -->

<p class="kicker">Reading 1 of 3</p>
<h1>Jiang et al. 2024</h1>
<p class="subtitle">Mixtral of Experts</p>
<p class="question">Can a model that uses 13B parameters per token match a 70B one?</p>
<ol class="track"><li class="now">Mixtral 2024<span>sparse 8x7B</span></li><li>Cai et al. 2024<span>the survey's map</span></li><li>DeepSeekMoE and V3<span>many small experts</span></li></ol>

Note:
Reading 1 of 3. Jiang and colleagues at Mistral AI, January 2024. A short paper: an introduction, the architecture with its one Sparse Mixture of Experts section, the results, the instruct model and a routing analysis. We go through it in that order.

---

<p class="eyebrow"><span class="paper">Jiang et al. 2024</span> · p. 1 · title and abstract</p>

## What does the Mixtral paper claim?

<div class="cols wide-text">
<div class="fig"><img src="img/week-07-mixtral-p1.png" alt="Page 1 of the Mixtral paper: the title Mixtral of Experts, the 26 authors, and the abstract"></div>
<div class="text">

<img src="img/week-07-mixtral-header.jpeg" alt="The paper's header image: the words Mistral AI in large orange block letters" style="max-width:100%; max-height:150px; margin:0 0 24px 0">

<p class="plain">8 experts in every layer, 2 used per token: 47B parameters stored, 13B used.</p>

</div>
</div>

<p class="footnote">Jiang et al. 2024, "Mixtral of Experts", arXiv:2401.04088, p. 1. Base and instruct weights released under Apache 2.0, a permissive open-source licence</p>

Note:
The abstract in one breath. Mixtral 8x7B has the same architecture as Mistral 7B, except that each layer has 8 feed-forward blocks, the experts. For every token, at each layer, a router picks two experts and combines their outputs, and the two can differ from token to token and layer to layer. So each token has access to 47B parameters but uses 13B active parameters. It was trained with a 32k context, and the abstract claims it outperforms or matches Llama 2 70B and GPT-3.5 across all evaluated benchmarks, vastly so on maths, code and multilingual benchmarks. An instruct version beats GPT-3.5 Turbo, Claude-2.1, Gemini Pro and Llama 2 70B chat on human evaluations. Hold the word "all": we will check it against the tables.

---

<p class="eyebrow"><span class="paper">Jiang et al. 2024</span> · §1, §2.1 · Fig. 1</p>

## What does a Mixtral layer do?

<div class="rows">
<div class="fig"><img src="img/week-07-mixtral-fig1-layer.png" alt="Mixtral Figure 1: an input vector goes to a router that picks 2 of 8 feed-forward experts, and the layer's output is the weighted sum of the outputs of the two chosen experts"></div>
<p class="plain">Each input vector goes to 2 of the 8 experts; the output is the weighted sum of their two outputs.</p>
</div>

<p class="footnote">Jiang et al. 2024 · Fig. 1. An <b>expert</b> is a standard feed-forward block, as in a vanilla Transformer. The <b>router</b> is also called the gating network</p>

Note:
Figure 1 is the whole idea. Read it left to right. A token's vector arrives at the layer. The router, a small linear layer, scores all 8 experts and keeps the top 2. Only those two experts run on this token. Each returns a vector, and the layer's output is their weighted sum, with weights from the router. The other six experts do no work for this token, which is the saving. Every expert has the shape of an ordinary feed-forward block, and attention is untouched: it is shared by all tokens. The introduction's summary: at every layer, for every token, a router chooses two of eight groups of parameters and combines their output additively. That raises the parameter count while the cost per token follows only the two experts used.

---

<p class="eyebrow"><span class="paper">Jiang et al. 2024</span> · §2 · Table 1</p>

## What are Mixtral's architecture settings?

<div class="cols wide-text">
<div class="text">

<table class="rules" style="font-size:17px">
  <tr><td>parameter</td><td>value</td><td>what it is</td></tr>
  <tr><td><code>dim</code></td><td>4096</td><td>width of each token's hidden vector</td></tr>
  <tr><td><code>n_layers</code></td><td>32</td><td>Transformer blocks, each with an MoE layer</td></tr>
  <tr><td><code>head_dim</code></td><td>128</td><td>width of one attention head</td></tr>
  <tr><td><code>hidden_dim</code></td><td>14336</td><td>width inside one expert</td></tr>
  <tr><td><code>n_heads</code></td><td>32</td><td>query heads</td></tr>
  <tr><td><code>n_kv_heads</code></td><td>8</td><td>key and value heads, each shared by 4 query heads</td></tr>
  <tr><td><code>context_len</code></td><td>32768</td><td>tokens the model reads at once</td></tr>
  <tr><td><code>vocab_size</code></td><td>32000</td><td>distinct tokens</td></tr>
  <tr><td><code>num_experts</code></td><td>8</td><td>experts per layer</td></tr>
  <tr><td><code>top_k_experts</code></td><td>2</td><td>experts used per token</td></tr>
</table>

</div>
<div class="text">

- The same Transformer as Mistral 7B, with two changes.
- A fully dense 32k context.
- Every feed-forward block replaced by an MoE layer.

</div>
</div>

<p class="footnote">Jiang et al. 2024 · §2, Table 1 ("Model architecture"); the third column is ours</p>

Note:
Table 1 as printed, with a column of meanings added. Mixtral is Mistral 7B's Transformer with two exceptions, in the paper's words: it supports a fully dense context length of 32k tokens, and the feed-forward blocks are replaced by mixture-of-experts layers. Each token is a 4096-wide vector, there are 32 layers, and each expert has a hidden width of 14336. Attention has 32 query heads of width 128 and 8 key and value heads, so 4 query heads share each key and value head, which is grouped-query attention, although the paper does not use that name. The last two rows are the mixture: 8 experts per layer and 2 used per token. Why 8x7B is 47B and not 56B: only the feed-forward blocks are copied 8 times; attention and embeddings are shared. The paper states 47B and 13B but does not derive them.

---

<p class="eyebrow"><span class="paper">Jiang et al. 2024</span> · §2.1 · the MoE layer</p>

## What does the MoE layer output?

<div class="cols wide-text">
<div class="text">

<div class="eq">$$\sum_{i=0}^{n-1} G(x)_i \cdot E_i(x)$$</div>

<dl class="where">
<dt>$x$</dt><dd>the input: one token's vector</dd>
<dt>$n$</dt><dd>the number of experts $E_0, \ldots, E_{n-1}$</dd>
<dt>$E_i(x)$</dt><dd>the output of the $i$-th expert</dd>
<dt>$G(x)_i$</dt><dd>the gating network's output for the $i$-th expert</dd>
</dl>

<p class="plain">Where the gate is 0, that expert's output is never computed.</p>

</div>
<div class="fig"><img src="img/week-07-gate.png" alt="Our example gate for one token over four experts: weights 0.731 for expert 0, 0.269 for expert 1, and 0 for experts 2 and 3"></div>
</div>

<p class="footnote">Jiang et al. 2024 · §2.1. Picture: our example, $n = 4$ experts, 2 kept (ours)</p>

Note:
The paper's first equation. The layer's output is a weighted sum of the expert outputs, and the weights come from the gating network, G. In the picture, our own small example with four experts: the gate gives 0.731 to expert 0, 0.269 to expert 1 and exactly 0 to experts 2 and 3. The paper's point is in one sentence: if the gating vector is sparse, we can avoid computing the outputs of experts whose gates are zero. So the sum runs over all n experts on paper, but only two terms are ever computed. The next two slides build G.

---

<p class="eyebrow"><span class="paper">Jiang et al. 2024</span> · §2.1 · the gate</p>

## How is the gate $G(x)$ computed?

<div class="rows">
<div class="eq">$$G(x) := \text{Softmax}(\text{TopK}(x \cdot W_g))$$</div>
<div class="fig"><img src="img/week-07-router.png" alt="Our example in three panels: the logits 2.0, 1.0, 0.5 and minus 1.0 for experts 0 to 3; the top 2 kept and the other two set to minus infinity; the softmax weights 0.731 and 0.269, and 0 for experts 2 and 3"></div>
<dl class="where">
<dt>$x$, $G(x)$</dt><dd>one token's vector, and its gate: one weight per expert</dd>
<dt>$W_g$</dt><dd>the router's weights, one column per expert; $x \cdot W_g$ gives one <b>logit</b> (raw score) per expert</dd>
<dt>TopK</dt><dd>keeps the $K$ largest logits and sets the rest to $-\infty$ (next slide)</dd>
<dt>Softmax</dt><dd>$e^{v_i} / \sum_j e^{v_j}$: positive weights that sum to 1, and $e^{-\infty} = 0$</dd>
</dl>
</div>

<p class="footnote">Jiang et al. 2024 · §2.1: "taking the softmax over the Top-K logits of a linear layer", after Shazeer et al. 2017. Numbers in the picture are ours: $e^2 / (e^2 + e^1) = 0.731$</p>

Note:
The gate in three moves, left to right in the picture. First, the router is one linear layer: multiply the token's vector x by W g, a 4096 by 8 matrix in Mixtral, to get one score per expert. In our example the four scores are 2.0, 1.0, 0.5 and minus 1.0. Second, TopK keeps the K largest and sets the rest to minus infinity; with K equal to 2 that keeps experts 0 and 1. Third, the softmax: e to the minus infinity is 0, so the masked experts get weight 0, and the two kept ones share the weight. e squared is 7.389, e to the one is 2.718, their sum is 10.107, so the weights are 0.731 and 0.269. The paper notes there are other ways to build G; this one it calls simple and performant.

---

<p class="eyebrow"><span class="paper">Jiang et al. 2024</span> · §2.1 · TopK</p>

## What does TopK keep, and what does $K$ control?

<div class="rows">
<div class="eq">$$(\text{TopK}(\ell))_i := \begin{cases} \ell_i & \text{if } \ell_i \text{ is among the top-K coordinates of } \ell \in \mathbb{R}^n \\ -\infty & \text{otherwise} \end{cases}$$</div>
<div class="cols wide-fig" style="flex:1 1 auto; min-height:0">
<div class="text">



<dl class="where">
<dt>$\ell$, $\ell_i$</dt><dd>the logits $x \cdot W_g$, one per expert; $\ell_i$ is expert $i$'s</dd>
<dt>$n$, $K$</dt><dd>the number of experts, and the number used per token</dd>
</dl>

- $K$ sets the compute per token; $n$ sets the parameters stored.
- **Sparse** (total) count grows with $n$; **active** count grows with $K$: 47B and 13B.

</div>
<div class="fig"><img src="img/week-07-topk.png" alt="Our example: logits 2.0 and 1.0 for experts 0 and 1 kept, experts 2 and 3 set to minus infinity"></div>
</div>
</div>

<p class="footnote">Jiang et al. 2024 · §2.1, its definition written as cases. Picture: our example, $K = 2$ of $n = 4$ (ours)</p>

Note:
The paper's definition of TopK: keep a logit if it is among the K largest, otherwise replace it with minus infinity. The paper then says what K is for: it is a hyperparameter that sets the amount of compute used per token. Raise the number of experts n with K fixed and the parameter count grows while the cost per token stays about the same. Hence the paper's two counts: the sparse parameter count, all the weights stored, which grows with n, and the active parameter count, the weights one token uses, which grows with K. For Mixtral, 47B and 13B. The paper gives no reason for K equal to 2.
The rest of §2.1, briefly: MoE layers run fast on one GPU with special kernels, Megablocks, and can be spread over GPUs by expert parallelism, one expert per device, which makes balancing the load across GPUs important. The paper does not say how Mixtral balances its load.

---

<p class="eyebrow"><span class="paper">Jiang et al. 2024</span> · §2.1 · Mixtral's layer</p>

## What is Mixtral's layer, once $K = 2$?

<div class="rows">
<div class="eq">$$y = \sum_{i=0}^{n-1} \text{Softmax}(\text{Top2}(x \cdot W_g))_i \cdot \text{SwiGLU}_i(x)$$</div>
<div class="cols wide-fig" style="flex:1 1 auto; min-height:0">
<div class="text">



<dl class="where">
<dt>$x$, $y$</dt><dd>one token's input to the layer, and the layer's output</dd>
<dt>$n$, $i$</dt><dd>8 experts, indexed $i = 0, \ldots, 7$</dd>
<dt>$W_g$, Top2</dt><dd>the router's weights; TopK with $K = 2$, then Softmax as before</dd>
<dt>$\text{SwiGLU}_i$</dt><dd>expert $i$: a SwiGLU feed-forward block with its own weights</dd>
</dl>

- Applied to each token separately, in place of every feed-forward block.

</div>
<div class="fig"><img src="img/week-07-mixtral-fig1-layer.png" alt="Mixtral Figure 1: the router picks 2 of 8 feed-forward experts and the output is the weighted sum of their two outputs"></div>
</div>
</div>

<p class="footnote">Jiang et al. 2024 · §2.1, Fig. 1. <b>SwiGLU</b>: the gated feed-forward block of Week 4, the same one Mistral 7B uses</p>

Note:
Putting it together, the paper's last equation. The experts are SwiGLU blocks, the same feed-forward form as Mistral 7B, and K is 2. So each token is sent to two SwiGLU blocks with different weights, and the output is their weighted sum. In our example, y equals 0.731 times expert 0's output plus 0.269 times expert 1's. The layer is applied independently per token, so two neighbouring tokens can use different experts, and it replaces the feed-forward sub-block in all 32 layers. The paper closes §2.1 by comparing with an earlier design, GShard, which replaced every other block and used a more elaborate rule for the second expert.

---

<p class="eyebrow"><span class="paper">Jiang et al. 2024</span> · §2.1 · the gradient (ours)</p>

## How does the gradient reach the router?

<div class="rows">
<div class="eq">$$\frac{\partial y}{\partial \ell_i} = \begin{cases} G(x)_i\,\big(E_i(x) - y\big) & \text{if } i \text{ is one of the top } K \\ 0 & \text{otherwise} \end{cases}$$</div>
<div class="fig"><img src="img/week-07-router-grad.png" alt="Left: our example's gradient of the output with respect to each logit, 0.197 for expert 0, minus 0.197 for expert 1, and 0 for experts 2 and 3. Right: the product of the two kept weights against the gap between their logits, 0.25 at gap 0 falling towards 0, with our token at gap 1 and 0.197"></div>
<dl class="where">
<dt>$\ell_i$, $K$</dt><dd>expert $i$'s logit, from $x \cdot W_g$; $K$ experts are kept</dd>
<dt>$y$, $E_i(x)$, $G(x)_i$</dt><dd>the layer output, expert $i$'s output, and its gate weight</dd>
</dl>
</div>

<p class="footnote">Not in the paper: our derivation from the §2.1 formula (ours). With $K = 2$: $\partial y / \partial \ell_0 = G(x)_0\, G(x)_1\, (E_0(x) - E_1(x))$</p>

Note:
The paper does not discuss training the router, so this slide is ours, derived from its formula. The top-K choice itself has no gradient. Gradient flows only through the softmax over the kept experts. For a kept expert i, the derivative of y with respect to its logit is its weight times how far its output is from the layer's output. Masked experts get exactly zero: neither they nor their router columns learn anything from this token.
With two kept experts it simplifies: the derivative for expert 0 is G0 times G1 times E0 minus E1, and expert 1's is the negative. So the router learns only how to split the weight between the two experts it already picked. In our example that factor is 0.731 times 0.269, 0.197. The right panel shows it shrinking as the gap between the two logits grows: a confident router gets little gradient. The router weights W g get x transposed times the gradient on the logits. One more consequence, ours: with K equal to 1, the single weight is always 1, so no gradient reaches the router at all.

---

<p class="eyebrow"><span class="paper">Jiang et al. 2024</span> · §3 · Table 2</p>

## Does Mixtral match Llama 2 70B with 13B active parameters?

<div class="rows">
<p class="plain">Ahead on 9 of 12 columns (ours); behind on HellaSwag, WinoGrande and TriviaQA. Largest gains: code and maths.</p>

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

<p class="footnote">Jiang et al. 2024 · Table 2, %, paper's bold. MMLU: 57-subject exam; HellaS: sentence endings; WinoG: pronouns; PIQA: physical know-how; Arc-e, Arc-c: school science, easy and hard; NQ, TriQA: trivia questions; HumanE, MBPP: Python tasks; Math, GSM8K: competition and school maths</p>

Note:
Table 2 in full, with the paper's own bold. The authors re-ran every model on their own evaluation pipeline, so the numbers are comparable within the table. The caption: Mixtral "outperforms or matches Llama 2 70B performance on almost all popular benchmarks while using 5x fewer active parameters during inference". Counting columns (ours), it is ahead on 9 of 12 and behind on HellaSwag by 1.0, WinoGrande by 3.2 and TriviaQA by 1.5. The biggest gaps are MATH, 28.4 against 13.8, and the two code sets, about 11 points each. Settings, from §3: commonsense sets 0-shot, NaturalQuestions and TriviaQA 5-shot, GSM8K 8-shot with a majority vote over 8 samples, MATH 4-shot with a vote over 4, HumanEval 0-shot, MBPP 3-shot, MMLU 5-shot. Llama 2 34B was never released, so Llama 1 stands in; the table says 33B, the text 34B. Single runs, no error bars, and no dense model trained the same way, so the table does not say how much of the gain is the experts.

--

<p class="eyebrow"><span class="paper">Jiang et al. 2024</span> · §3 · Fig. 2 · optional</p>

## How does Fig. 2 group the same results?

<div class="rows">
<div class="fig"><img src="img/week-07-mixtral-fig2-bars.png" alt="Jiang et al. Figure 2: grouped bars for six models on MMLU, knowledge, reasoning, comprehension, AGI Eval, math, BBH and code; Mixtral is tallest on math and code, and Llama 2 70B is tallest on AGI Eval, BBH and comprehension"></div>
<p class="plain">Mixtral leads on maths and code; by eye (ours), Llama 2 70B is taller on AGI Eval, BBH and comprehension.</p>
</div>

<p class="footnote">Jiang et al. 2024 · Fig. 2. BBH: hard reasoning tasks; AGI Eval: questions from human exams; comprehension: BoolQ (yes or no on a passage) and QuAC (dialogue about a passage)</p>

Note:
Figure 2 is Table 2 grouped into categories, plus three that are not in the table: reading comprehension, AGI Eval and BBH. Its caption says Mixtral "outperforms or matches Llama 2 70B on all benchmarks". By eye, the Llama 2 70B bar is taller on AGI Eval, about 54 against 51, on BBH, about 45 against 42, and on comprehension, about 67 against 66 (approximate reads, ours; the figure prints no values). So the claim drifts across the paper: "all" in the abstract and this caption, "almost all" in Table 2's caption, "except reading comprehension" in Fig. 3's. The careful versions are the ones next to the numbers.

---

<p class="eyebrow"><span class="paper">Jiang et al. 2024</span> · §3, size and efficiency · Fig. 3</p>

## How does accuracy grow with active parameters?

<div class="rows">
<div class="fig"><img src="img/week-07-mixtral-fig3-active.png" alt="Jiang et al. Figure 3: six panels, MMLU, knowledge, reasoning, comprehension, math and code, each with accuracy against active parameters; Mixtral at 13B sits near or above the Llama 2 70B point in all but comprehension"></div>
<p class="plain">The x axis is active parameters, the compute per token. Memory follows the 47B stored, which is not drawn.</p>
</div>

<p class="footnote">Jiang et al. 2024 · §3, Fig. 3. Accuracy in %, panels are the §3 benchmark groups</p>

Note:
Figure 3 puts the results on a cost axis: active parameters, which the paper says is directly proportional to inference compute. Llama 2 is a line through 7B, 13B and 70B; Mistral runs from 7B to Mixtral at 13B. With 5x fewer active parameters, Mixtral is at or above Llama 2 70B in every panel except comprehension. The paper's own caveat, in the same paragraph: this ignores memory and hardware use. Serving memory is proportional to the sparse count, 47B, still smaller than 70B. And the routing adds overhead, so MoE layers suit batched workloads, where many tokens share each expert's weights. The introduction's claim of faster inference has no speed measurement in the paper.

---

<p class="eyebrow"><span class="paper">Jiang et al. 2024</span> · §3 · Table 3</p>

## Does Mixtral match GPT-3.5?

<div class="cols wide-text">
<div class="text">

<table class="rules">
  <tr><td>benchmark</td><td>Llama 2 70B</td><td>GPT-3.5</td><td>Mixtral</td></tr>
  <tr><td>MMLU</td><td>69.9</td><td>70.0</td><td><b>70.6</b></td></tr>
  <tr><td>HellaSwag, 10-shot</td><td><b>87.1</b></td><td>85.5</td><td>86.7</td></tr>
  <tr><td>ARC Challenge, 25-shot</td><td>85.1</td><td>85.2</td><td><b>85.8</b></td></tr>
  <tr><td>WinoGrande, 5-shot</td><td><b>83.2</b></td><td>81.6</td><td>81.2</td></tr>
  <tr><td>MBPP, pass@1</td><td>49.8</td><td>52.2</td><td><b>60.7</b></td></tr>
  <tr><td>GSM-8K, 5-shot</td><td>53.6</td><td>57.1</td><td><b>58.4</b></td></tr>
  <tr><td>MT Bench, instruct models</td><td>6.86</td><td><b>8.32</b></td><td>8.30</td></tr>
</table>

</div>
<div class="text">

- The paper: Mixtral "performs similarly or above the two other models".
- GSM8K is 74.4 in Table 2 (8-shot, vote of 8) but 58.4 here (5-shot).

</div>
</div>

<p class="footnote">Jiang et al. 2024 · Table 3, %, paper's bold. MMLU: 57-subject exam; HellaSwag: sentence endings; ARC: school science; WinoGrande: pronouns; MBPP: Python, pass@1 = solved with one answer; GSM-8K: school maths; MT Bench: chat scored out of 10 by a judge model</p>

Note:
Table 3 adds GPT-3.5. Mixtral is best on MMLU, ARC Challenge, MBPP and GSM8K, behind Llama 2 70B on HellaSwag and WinoGrande, and level with GPT-3.5 on MT Bench, 8.30 against 8.32. The text's wording, similar or above, fits. Two things to notice. The same model has different numbers in the two tables: GSM8K 74.4 in Table 2, 8-shot with a vote over 8 samples, and 58.4 here at 5-shot; ARC Challenge 59.7 at 0-shot and 85.8 at 25-shot. So compare only within one table. And the paper lists its own evaluation differences from the Llama 2 paper: MBPP uses the hand-verified subset, and TriviaQA gets no Wikipedia contexts. One slip: the text says "47B tokens" where it means parameters.

---

<p class="eyebrow"><span class="paper">Jiang et al. 2024</span> · §3.1, §3.2 · Fig. 4</p>

## Does it hold up in other languages and on long inputs?

<div class="rows">
<div class="points">
<div class="text">

- §3.1: more multilingual data than Mistral 7B; ahead of Llama 2 70B in all 12 French, German, Spanish and Italian cells.

</div>
<div class="text">

- §3.2: 100% passkey retrieval at every length and position; perplexity falls as the context grows.

</div>
</div>
<div class="fig"><img src="img/week-07-mixtral-fig4.png" alt="Jiang et al. Figure 4: left, a passkey heat map where every filled cell is green, 100 percent accuracy, across sequence lengths to 32 thousand; right, proof-pile perplexity falling from about 3.8 to about 1.9 as context length grows"></div>
</div>

<p class="footnote">Jiang et al. 2024 · §3.1, Table 4; §3.2, Fig. 4. Passkey: find a number hidden at a random place in a long prompt. Perplexity: how surprised the model is by text, lower is better; proof-pile: mathematical text</p>

Note:
Two short checks. Languages, §3.1: compared with Mistral 7B the authors significantly upsampled multilingual data, and Mixtral beats Llama 2 70B on ARC Challenge, HellaSwag and MMLU in French, German, Spanish and Italian, all 12 cells, by 3.1 to 8.3 points (ours); the table is the next sub-slide. Because the data changed, this says more about the data mix than about experts. Long context, §3.2: the passkey task hides a number in a long prompt and asks for it; the heat map is 100% in every filled cell up to 32k tokens, and the cells above the diagonal are empty because a passkey cannot sit past the end of the prompt. Perplexity on a subset of proof-pile falls monotonically as the context grows, from about 3.8 to about 2.0 by 10k and to about 1.9 at 32k (by eye, ours). No trial counts are given.

--

<p class="eyebrow"><span class="paper">Jiang et al. 2024</span> · §3.1 · Table 4 · optional</p>

## What does the multilingual table say?

<div class="rows">
<table class="rules tight" style="font-size:15px">
  <tr><td>model</td><td>active</td><td>FR Arc-c</td><td>FR HellaS</td><td>FR MMLU</td><td>DE Arc-c</td><td>DE HellaS</td><td>DE MMLU</td><td>ES Arc-c</td><td>ES HellaS</td><td>ES MMLU</td><td>IT Arc-c</td><td>IT HellaS</td><td>IT MMLU</td></tr>
  <tr><td>Llama 1 33B</td><td>33B</td><td>39.3</td><td>68.1</td><td>49.9</td><td>41.1</td><td>63.3</td><td>48.7</td><td>45.7</td><td>69.8</td><td>52.3</td><td>42.9</td><td>65.4</td><td>49.0</td></tr>
  <tr><td>Llama 2 70B</td><td>70B</td><td>49.9</td><td>72.5</td><td>64.3</td><td>47.3</td><td>68.7</td><td>64.2</td><td>50.5</td><td>74.5</td><td>66.0</td><td>49.4</td><td>70.9</td><td>65.1</td></tr>
  <tr class="total"><td>Mixtral 8x7B</td><td>13B</td><td><b>58.2</b></td><td><b>77.4</b></td><td><b>70.9</b></td><td><b>54.3</b></td><td><b>73.0</b></td><td><b>71.5</b></td><td><b>55.4</b></td><td><b>77.6</b></td><td><b>72.5</b></td><td><b>52.8</b></td><td><b>75.1</b></td><td><b>70.9</b></td></tr>
</table>
<p class="plain">Mixtral is ahead in every cell, by 3.1 to 8.3 points (ours). Mistral 7B is not in the table.</p>
</div>

<p class="footnote">Jiang et al. 2024 · Table 4, %, the paper bolds every Mixtral cell. FR, DE, ES, IT: French, German, Spanish, Italian; Arc-c: hard school science; HellaS: sentence endings; MMLU: 57-subject exam</p>

Note:
Table 4 in full. The smallest gap over Llama 2 70B is 3.1 points, Spanish HellaSwag, and the largest 8.3, French ARC Challenge (ours). The authors give two reasons together: more multilingual data, and "the extra capacity" that lets the model keep its English accuracy. Neither is separated by a run, the data share is not given, and Mistral 7B, the dense model with the old data mix, is missing from the table.

--

<p class="eyebrow"><span class="paper">Jiang et al. 2024</span> · §3.3 · bias benchmarks · optional</p>

## How biased is the base model?

<div class="cols wide-text">
<div class="text">

<table class="rules">
  <tr><td></td><td>Llama 2 70B</td><td>Mixtral 8x7B</td></tr>
  <tr><td>BBQ accuracy</td><td>51.5</td><td>56.0</td></tr>
  <tr><td>BOLD gender</td><td>0.293 ± 0.073</td><td>0.323 ± 0.045</td></tr>
  <tr><td>BOLD profession</td><td>0.218 ± 0.073</td><td>0.243 ± 0.087</td></tr>
  <tr><td>BOLD religious ideology</td><td>0.188 ± 0.133</td><td>0.144 ± 0.089</td></tr>
  <tr><td>BOLD political ideology</td><td>0.149 ± 0.140</td><td>0.186 ± 0.146</td></tr>
  <tr><td>BOLD race</td><td>0.232 ± 0.049</td><td>0.232 ± 0.052</td></tr>
</table>

</div>
<div class="text">

- Higher BBQ accuracy; more positive BOLD sentiment in 3 of 5 groups (ours).
- The text says "similar variances"; the spread is lower in 2 of 5 groups (ours).

</div>
</div>

<p class="footnote">Jiang et al. 2024 · §3.3, printed as Fig. 5. BBQ: hand-written questions on nine social biases; BOLD: 23,679 text prompts, average sentiment ± its spread</p>

Note:
Optional. The authors measure the base model, to find flaws for fine-tuning to fix. BBQ is hand-written questions targeting nine social biases; Mixtral scores 56.0 against 51.5, which the paper reads as less bias, although a more capable model also answers more questions right. BOLD gives prompts in five domains and scores the sentiment of what the model writes: higher average is more positive, lower spread less bias within a group. Mixtral is more positive in three of five groups, less on religious ideology, level on race, and its spread is lower for gender and religious ideology only (ours). So the caption's "lower std" overstates; the text's "similar variances" fits the table. The table is printed as a figure, Fig. 5.

---

<p class="eyebrow"><span class="paper">Jiang et al. 2024</span> · §4 · Fig. 6</p>

## How good is the instruct model?

<div class="cols wide-fig">
<div class="text">

- Supervised fine-tuning, then DPO on paired feedback.
- MT-Bench 8.30, the best open-weights model in December 2023.
- Arena Elo 1121: above Claude-2.1 and GPT-3.5-Turbo (1117), Gemini Pro (1111) and Llama-2-70b-chat (1077).

</div>
<div class="fig"><img src="img/week-07-mixtral-fig6-lmsys.png" alt="Jiang et al. Figure 6: LMSys leaderboard screenshot of 22 December 2023; Mixtral-8x7b-Instruct-v0.1 is highlighted at Arena Elo 1121, below GPT-4 and Claude-1 and Claude-2.0, above Claude-2.1, GPT-3.5-Turbo, Gemini Pro and Llama-2-70b-chat at 1077"></div>
</div>

<p class="footnote">Jiang et al. 2024 · §4, Fig. 6, screenshot of 22 Dec 2023. DPO: Direct Preference Optimization, Week 9. Arena Elo: a rating from human votes between two anonymous models; MT-Bench: chat questions scored by a judge model</p>

Note:
§4 is one paragraph. Mixtral Instruct is trained with supervised fine-tuning on an instruction dataset and then Direct Preference Optimization on a paired feedback dataset; DPO is Week 9's reading. No data sizes or settings are given. MT-Bench is 8.30. The independent human evaluation is the LMSys Chatbot Arena, where people vote between two anonymous models: Elo 1121 on 22 December 2023, above Claude-2.1 and the best GPT-3.5-Turbo at 1117, Gemini Pro at 1111 and Llama-2-70b-chat at 1077, and below the GPT-4 versions, Claude-1 and Claude-2.0. A 4-point gap is likely within the noise of the votes; the screenshot prints no intervals (ours).

---

<p class="eyebrow"><span class="paper">Jiang et al. 2024</span> · §5, routing analysis · Fig. 7</p>

## Did the experts specialise by topic?

<div class="rows">
<div class="fig"><img src="img/week-07-mixtral-fig7-routing.png" alt="Jiang et al. Figure 7: three panels for layers 0, 15 and 31, selection proportion by expert 0 to 7 for eight Pile subsets; the coloured bars are close together at every expert, with DM Mathematics slightly apart"></div>
<p class="plain">"Surprisingly, we do not observe obvious patterns in the assignment of experts based on the topic."</p>
</div>

<p class="footnote">Jiang et al. 2024 · §5, Fig. 7: share of tokens sent to each expert, first or second choice, layers 0, 15, 31. The Pile: a public mix of web, books, code and papers; DM Mathematics: synthetic maths exercises. Grey dashed line: 1/8, an even share</p>

Note:
Ask the room first: with eight experts, would you expect one for maths, one for biology, one for philosophy? That is what the word expert suggests. The authors check on the validation set of the Pile: for each of eight subsets, the share of tokens that picked each expert as first or second choice, at the first, middle and last layers. The answer, in their words: surprisingly, no obvious patterns by topic. ArXiv papers in LaTeX, PubMed biology and PhilPapers philosophy look the same at every layer. Only DM Mathematics is marginally different, most at the first and last layers, which they put down, "likely", to its synthetic text and to those layers' hidden states being close to the input and output embeddings. That explanation is not tested.

---

<p class="eyebrow"><span class="paper">Jiang et al. 2024</span> · §5, routing analysis · Fig. 8</p>

## Then what does the router follow?

<div class="rows">
<div class="fig"><img src="img/week-07-mixtral-fig8-tokens.png" alt="Jiang et al. Figure 8: three text samples, Python code, maths questions and an English question, each in three columns for layers 0, 15 and 31, every token shaded by its first-choice expert; indentation blocks in the code are one solid colour at layer 31"></div>
<p class="plain">Each token coloured by its first-choice expert: the choice "appears to be more aligned with the syntax rather than the domain".</p>
</div>

<p class="footnote">Jiang et al. 2024 · §5, Fig. 8. First choice: the expert the router ranks first of its two; the samples are Python code, maths and English</p>

Note:
If not topic, then what? Figure 8 colours every token by the expert it chose first, for a Python sample, a maths sample and an English sample, at layers 0, 15 and 31. The authors' reading: the choice is more aligned with syntax than with domain, especially at the first and last layers. The word self in Python and the word Question often get the same expert even though they span several tokens, and in code the indentation tokens get the same experts, particularly at the first and last layers. They call this structured syntactic behaviour. Two cautions, ours: these are three hand-picked samples with no colour legend and no number behind them, and in the image the indentation at layer 0 is mostly, not always, one colour. The paper's conclusion then restates the headline: the first mixture of experts to reach state of the art among open models, with 13B active parameters per token against Llama 2 70B's 70B.

--

<p class="eyebrow"><span class="paper">Jiang et al. 2024</span> · §5, routing analysis · Table 5 · optional</p>

## Do neighbouring tokens share experts?

<div class="rows">
<p class="plain">Same expert for token $i$ and token $i+1$: near chance at layer 0, well above it at layers 15 and 31.</p>
<table class="rules tight" style="font-size:14px">
  <tr><td>Pile subset</td><td>first, layer 0</td><td>first, 15</td><td>first, 31</td><td>first or second, 0</td><td>first or second, 15</td><td>first or second, 31</td></tr>
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

<p class="footnote">Jiang et al. 2024 · Table 5, % of consecutive token pairs. Chance: $\frac{1}{8} = 12.5$ for first choice, $1-\frac{6}{8} \frac{5}{7} \approx 46$ for first or second. DM Mathematics: synthetic maths; Github: code; Gutenberg: books; PhilPapers: philosophy; StackExchange: Q and A forums</p>

Note:
Table 5 asks whether token i+1 gets the same expert as token i. Two measures: the same first choice, or any overlap between the two experts of each. The paper's chance levels: one in eight, 12.5%, for first choice, and 1 minus six eighths times five sevenths, about 46%, for first or second. Layer 0 is near chance, 13.6 to 14.9% on first choice; at layer 15 first-choice repeats are about twice chance, 23.6 to 28.4%, and first-or-second repeats are about 1.4 times it, 61.6 to 67.0% (ours). The authors call this temporal locality and say it matters for speed: runs of one expert can overload one GPU under expert parallelism, and can be exploited by caching. A check, ours: DM Mathematics at layer 31 on first or second is 44.5%, below the 46% chance level, so the caption's "significantly higher at layers 15 and 31" does not hold in that cell, and no test is given. The appendix's Fig. 10 shows all 32 layers.


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
Choice 1, gating. What Mixtral uses is token choice: every token scores all experts and picks its own top k. The survey's Equation 3 is the Shazeer 2017 form: add noise to the router scores, keep the top k, and apply softmax to the survivors. The noise is meant to encourage exploration among experts, and the survey never says what distribution or scale it has. Who uses which k: k equals 1 for Switch; k equals 2 for GShard, GLaM, ST-MoE (Google's stable sparse model), Mixtral and Skywork-MoE.
Why the order of softmax and TopK matters: with softmax after TopK, as in Mixtral and Equation 3, the surviving weights sum to one. With TopK after softmax, as in GShard, Switch and OpenMoE, the kept weights are slices of a larger distribution and sum to less than one. With k equal to 1, TopK after softmax is what keeps the router learning: if you renormalised a single kept weight it would always be exactly one, and the router would receive no gradient through it. That reasoning is ours (the survey gives only the two orders and the upcycling finding) and ties back to the gradient slide in Mixtral. DeepSeekMoE also takes TopK after softmax without renormalising.
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
Dense x16 is a model whose 16 experts are all shared, so every parameter is used for every token. The paper treats it as the capacity ceiling: in its view no routing choice can do better with the same parameters. DeepSeekMoE reaches 1.808 against its 1.806 at less than a fifth of the arithmetic (4.3T against 24.6T FLOPs, 5.7 times, ours). That answers the week's opening question: at this size and data, stored sparse capacity is worth almost what dense capacity is.
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


<p class="eyebrow"><span class="paper">Week 7</span> · synthesis · the three layers side by side</p>

## How do the three layer designs compare?

<table class="rules">
  <tr><td></td><td>Mixtral</td><td>DeepSeekMoE 16B</td><td>DeepSeek-V3</td></tr>
  <tr><td>experts per MoE layer</td><td>8</td><td>2 shared + 64 routed</td><td>1 shared + 256 routed</td></tr>
  <tr><td>chosen per token</td><td>2</td><td>2 shared + 6 routed</td><td>1 shared + 8 routed</td></tr>
  <tr><td>which layers</td><td>every layer</td><td>all but the first</td><td>all but the first 3</td></tr>
  <tr><td>router</td><td>softmax over the top 2</td><td>softmax, top-k not renormalised</td><td>sigmoid, top 8 renormalised</td></tr>
  <tr><td>balancing</td><td>not stated</td><td>expert loss 0.001, no device loss</td><td>bias, plus loss 0.0001</td></tr>
  <tr class="total"><td>dropped tokens</td><td>not stated</td><td>none</td><td>none</td></tr>
</table>

<p class="footnote">Jiang et al. 2024 (Mixtral), Dai et al. 2024, DeepSeek-AI 2024. Router: the small network scoring experts. Top 2: keep the 2 highest scores</p>

Note:
One table across the readings. Reading across: the number of experts per layer rises from 8 (Mixtral) to 66 (DeepSeekMoE 16B) to 257 (V3), while the number chosen stays small, so the experts get smaller. The router moves from a softmax over the top 2 (Mixtral) to a softmax without renormalising (DeepSeekMoE) to a sigmoid with renormalisation (V3). Balancing goes from unstated (Mixtral) to an expert-level loss to a bias plus a very small loss. Dropped tokens: DeepSeekMoE and V3 drop none; Mixtral does not say. Note: the 16B model has 2 shared and 6 routed chosen; Mixtral's balancing method is not stated in its paper.

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

<p class="footnote">The first question is the week's opening one (does stored capacity count like dense capacity?). Batch size 1: one request at a time, as on a phone or laptop</p>

Note:
Four directions the readings point to. First, the week's opening question: does stored sparse capacity count like dense capacity? DeepSeekMoE answers at 2B and 100B tokens, and against a dense 7B on the same 2T tokens; Mixtral has no matched dense model. Second, why routers specialise: Mixtral saw syntax-like patterns, V3 saw domain-hot experts, and neither tests a cause. Third, granularity: only DeepSeekMoE varies it (16, 32 and 64 experts at 2B, its ablation figure); Mixtral's 8 and V3's 257 are not ablated. Fourth, cost at batch size 1: with one request, few experts are used but all must be in memory, which is where per-layer embeddings, fetched by token id, offer a different trade.

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

