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
Putting it together, the paper's last equation. The experts are SwiGLU blocks, the same feed-forward form as Mistral 7B, and K is 2. So each token is sent to two SwiGLU blocks with different weights, and the output is their weighted sum. In our example, y equals 0.731 times expert 0's output plus 0.269 times expert 1's. The layer is applied independently per token, so two neighbouring tokens can use different experts, and it replaces the feed-forward sub-block in all 32 layers.

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
Reading 2 of 3. Cai, Jiang, Wang, Tang, Kim and Huang, first posted July 2024; we read the latest arXiv version. Mixtral showed one design that works. This survey lays out the menu of designs and who chose what, up to the end of 2024. We follow the survey in its own order: the background with the dense and sparse layer, its taxonomy figure, then algorithm design (gating, experts, adapter experts, training and inference schemes), then system design, applications and open challenges. A survey runs no experiments, so every number on these slides is one the survey relays from another paper. Our own comments in the notes are marked (ours). The question to hold: if you had to build one tomorrow, which of these decisions would the survey actually help you make?

---

<p class="eyebrow"><span class="paper">Cai et al. 2024</span> · §2.1 · Eq. 1, Fig. 2</p>

## What does a dense mixture of experts compute?

<div class="cols wide-fig">
<div class="text">

<div class="eq">$$\mathcal{F}_{\mathrm{dense}}^{\mathrm{MoE}}(\mathbf{x}; \mathbf{\Theta}, \{\mathbf{W}_i\}_{i=1}^{N}) = \sum_{i=1}^{N}\mathcal{G}(\mathbf{x}; \mathbf{\Theta})_i f_{i}(\mathbf{x}; \mathbf{W}_i)$$</div>

<dl class="where">
<dt>$\mathbf{x}$</dt><dd>the input token</dd>
<dt>$f_i$, $\mathbf{W}_i$</dt><dd>expert $i$ and its weights; $N$ experts</dd>
<dt>$\mathcal{G}(\mathbf{x}; \mathbf{\Theta})_i$</dt><dd>the gate's softmax weight on expert $i$; $\mathbf{\Theta}$ are the gate's weights</dd>
</dl>

</div>
<div class="fig"><img src="img/week-07-cai-fig2-layer.png" alt="Cai et al. Figure 2: the same four feed-forward experts and a linear-softmax gate, in (a) a dense MoE where all four gate probabilities are used and (b) a sparse MoE where only the top two are used"></div>
</div>

<p class="footnote">Cai et al. 2024 · §2.1 Eq. 1, 2, Fig. 2. MoE: mixture of experts. FFN: feed-forward network, the block an expert copies</p>

Note:
The background section starts with the layer in Figure 2. A mixture of experts layer is a set of N expert networks plus a gating network, placed where the feed-forward network sits in each Transformer block. The survey notes that the feed-forward network is where the cost grows: in PaLM, its 540B model, 90 percent of the parameters are in the feed-forward layers. Panel a is the dense version, Equation 1: every expert runs and the output is the gate-weighted sum. The gate is a linear layer with a softmax, Equation 2. The survey says dense mixtures were revisited recently by EvoMoE, MoLE, LoRAMoE and DS-MoE. Panel b, the sparse version, is the next slide. Section 4.1.2 adds that dense activation still works where each expert is cheap, which is the adapter case later.

---

<p class="eyebrow"><span class="paper">Cai et al. 2024</span> · §2.2 · Eq. 3, Fig. 2b</p>

## How does the sparse layer pick its experts?

<div class="rows">
<div class="eq">$$\mathcal{G}(\mathbf{x}; \mathbf{\Theta})_i = \operatorname{softmax}\big(\operatorname{TopK}(g(\mathbf{x}; \mathbf{\Theta}) + \mathcal{R}_{\mathrm{noise}}, k)\big)_i$$</div>
<dl class="where">
<dt>$g(\mathbf{x}; \mathbf{\Theta})$</dt><dd>the gating value (score) for each expert, before the softmax</dd>
<dt>$\mathcal{R}_{\mathrm{noise}}$</dt><dd>a noise term that encourages exploration among experts</dd>
<dt>$\operatorname{TopK}$, $k$</dt><dd>keep the $k$ largest entries and set the rest to $-\infty$, so their softmax weight is about 0</dd>
</dl>
<p class="plain">Common choices: $k=1$ (Switch Transformer) or $k=2$ (GLaM, ST-MoE, Mixtral, Skywork-MoE).</p>
</div>

<p class="footnote">Cai et al. 2024 · §2.2 Eq. 3 to 5. Switch Transformer, GLaM, ST-MoE: Google sparse models; Skywork-MoE: Kunlun's 146B model</p>

Note:
Shazeer and colleagues introduced the sparsely gated layer: compute only a weighted sum of the top k experts instead of all of them. Equation 3 changes the dense gate in two ways. First, TopK keeps the k largest scores and sets the others to minus infinity, so after the softmax they are zero; those experts need not be computed. Second, a noise term is added before choosing, which the survey says encourages exploration and stabilises training. The survey never says what the noise is (ours). The survey lists k equal to 1 for Switch Transformer and k equal to 2 for GLaM, ST-MoE, DeepSpeed-MoE, Mixtral and Skywork-MoE. One caution (ours): Equation 3 puts the softmax after TopK, as Mixtral does, but section 4.4.1 says later models take TopK after the softmax. The upcycling sub-slide shows both forms.

---

<p class="eyebrow"><span class="paper">Cai et al. 2024</span> · §2.2 · Eq. 6</p>

## What does the load-balancing loss ask for?

<div class="rows">
<div class="eq">$$\mathcal{L}_{\operatorname{load-balancing}} = N\sum_{i=1}^{N}\mathcal{D}_i\mathcal{P}_i$$</div>
<dl class="where">
<dt>$N$</dt><dd>the number of experts</dd>
<dt>$\mathcal{D}_i$</dt><dd>the proportion of the batch's tokens sent to expert $i$ (by its top choice)</dd>
<dt>$\mathcal{P}_i$</dt><dd>the proportion of the gating probability assigned to expert $i$</dd>
</dl>
<p class="plain">The minimum is 1, reached when every expert gets $1/N$ of the tokens and of the probability.</p>
</div>

<p class="footnote">Cai et al. 2024 · §2.2 Eq. 6 to 8. The survey adds this auxiliary loss to the training loss so no expert is starved or overloaded</p>

Note:
The sparse gate raises a problem: some experts get consulted often and others rarely. The survey's answer is an auxiliary loss, Equation 6, added during training. D sub i is the fraction of the batch's tokens whose top choice is expert i, and P sub i is the average gating probability for expert i. If both are 1 over N for every expert, the sum is N times N times 1 over N squared, which is 1; the survey calls this the minimum. A caution (ours): D counts only top choices, so the loss can dip a little below 1; read 1 as the balanced value to aim for. A second caution (ours): different papers scale this loss differently, so the same coefficient does not mean the same strength in two papers.

---

<p class="eyebrow"><span class="paper">Cai et al. 2024</span> · §3 · Fig. 3</p>

## How does the survey organise the field?

<div class="rows">
<div class="fig"><a href="img/week-07-cai-fig3-taxonomy.png" target="_blank"><img src="img/week-07-cai-fig3-taxonomy.png" alt="Cai et al. Figure 3, the taxonomy of mixture of experts: algorithm design (gating function, experts, training and inference scheme, derivatives), system design (computation, communication, storage) and application (NLP, vision, recommendation, multimodal), each leaf listing the papers"></a></div>
</div>

<p class="plain">Three views: algorithm design, system design, application.</p>

<p class="footnote">Cai et al. 2024 · §3, Fig. 3. NLP: natural language processing; CV: computer vision; RecSys: recommender systems. Click the figure to open it full size</p>

Note:
The survey's own map, Figure 3, with every paper placed in a leaf. You do not need to read it; look at its shape. Three views: algorithm design, system design and application. The algorithm branch is the largest: gating function (dense, sparse, soft), experts (network types, hyperparameters, activation function, shared expert, parameter-efficient), training and inference scheme, and derivatives. The system branch has three leaves: computation, communication, storage. Application has four: language, vision, recommender systems and multimodal. We follow this tree in this order, skipping derivatives. Many papers appear in several leaves because one method changes more than one thing (ours). The survey says the taxonomy covers models from three perspectives, with representative studies.

---

<p class="eyebrow"><span class="paper">Cai et al. 2024</span> · §4.1.1 · Fig. 4</p>

## Which gating functions does the survey show?

<div class="cols wide-fig">
<div class="text">

- **Token choice**: each token picks its own top $k$ experts; the predominant paradigm.
- (a) Switch: top-1. M6-t: groups of experts, top-1 in each group.
- (b) BASE layers: assignment with equal load per expert.
- (d) Expert choice: each expert picks its tokens.

</div>
<div class="fig"><img src="img/week-07-cai-fig4-gating.png" alt="Cai et al. Figure 4: six gating functions, (a) sparse top-1 as in Switch, (b) BASE layers, (c) grouped domain mapping plus random gating, (d) expert choice, (e) an attention router, (f) soft merging of experts"></div>
</div>

<p class="footnote">Cai et al. 2024 · §4.1.1, Fig. 4. BASE: balanced assignment of sparse experts. M6-t: expert prototyping, k groups of experts with top-1 gating inside each</p>

Note:
Figure 4 shows six gating functions. The text first describes token choice: Shazeer and colleagues argued for top k with k above 1, since consulting several experts lets the network weigh their contributions. The survey says later work largely affirmed that more experts per token helps, though Switch showed top-1 is competitive. Hold that sentence loosely (ours): it has no citation, and the one result the survey gives next is not monotone in k. M6-t's expert prototyping, four groups each with top-1, beat one top-4 gate, which beat top-16, which beat plain top-1, in training and downstream perplexity of a 16-layer model. Panel b, BASE, treats routing as a linear assignment with equal load per expert; S-BASE uses optimal transport. Panel c, PanGu-Sigma, maps tokens to a domain group then picks randomly inside it. Panel e is Yuan 2.0-M32's attention router. Panel d and f follow on later slides.

---

<p class="eyebrow"><span class="paper">Cai et al. 2024</span> · §4.1.1 · Table 1</p>

## Which auxiliary losses do models use, and with what weight?

<table class="rules" style="font-size:20px">
  <tr><td>loss</td><td>models</td><td>coefficient</td></tr>
  <tr><td>importance + load</td><td>Shazeer et al., V-MoE</td><td>0.1 and 0.1</td></tr>
  <tr><td>balance loss</td><td>Switch, GLaM, Mixtral, DBRX, Jamba, DeepSeekMoE, DeepSeek-V2, Skywork-MoE</td><td>0.01</td></tr>
  <tr><td>balance + z-loss</td><td>ST-MoE, OpenMoE, MoA, JetMoE</td><td>0.01 and 0.001</td></tr>
  <tr><td>mutual information</td><td>Mod-Squad, ModuleFormer, DS-MoE</td><td>0.001</td></tr>
</table>

<p class="plain">The survey says the methods behind the balance loss "remain the predominant choice in industry".</p>

<p class="footnote">Cai et al. 2024 · Table 1 (first column trimmed to the first named models). Mod-Squad: a multi-task vision mixture of experts; MoA: mixture of attention heads; z-loss: next, optional</p>

Note:
Table 1 as the survey prints it, with the first column shortened. Four families of loss. The first, from Shazeer: an importance loss, the squared coefficient of variation of each expert's summed gate values, plus a load loss that smoothly estimates how many examples each expert gets; both weighted 0.1. The second, the balance loss of the last slide, weight 0.01, used by most models since. The third adds ST-MoE's z-loss, weight 0.001. The fourth, Mod-Squad, maximises mutual information between experts and tasks, because forcing balance across conflicting tasks can hurt a multi-task model. A check against the DeepSeekMoE paper (ours): 0.01 is DeepSeekMoE's coefficient for its 2B runs only; its 16B model uses 0.001 and its 145B model 0.003, and Mixtral's paper states no value. So treat this table as typical values, not exact ones.

--

<p class="eyebrow"><span class="paper">Cai et al. 2024</span> · §4.1.1 · Eq. 11 · optional</p>

## What is the router z-loss?

<div class="rows">
<div class="eq">$$\mathcal{L}_{z} = \frac{1}{T}\sum_{x \in \mathcal{B}} \Big(\log \sum_{i=1}^{N} e^{x_i}\Big)^2$$</div>
<dl class="where">
<dt>$x$, $\mathcal{B}$, $T$</dt><dd>a token, the batch, and the number of tokens in it</dd>
<dt>$x_i$</dt><dd>the gating logit (raw score) for expert $i$; the survey reuses the letter $x$ (reading ours)</dd>
<dt>$N$</dt><dd>the number of experts</dd>
</dl>
<p class="plain">It penalises large logits entering the gate, which reduces round-off errors in the exponentials.</p>
</div>

<p class="footnote">Cai et al. 2024 · §4.1.1 Eq. 11. ST-MoE: Google's stable sparse mixture of experts; round-off: rounding error in floating-point arithmetic</p>

Note:
Optional. ST-MoE found the plain balance loss gave unreliable training at larger scales. To improve stability without hurting quality they added the z-loss: take the log of the sum of the exponentials of the router's raw scores for a token, square it, and average over tokens. Large scores inside an exponential cause large round-off errors, so keeping the logits small makes the router numerically safer. A notation point (ours): the survey writes the logit as x sub i while also using x for the token; the formula only makes sense with logits. The survey also notes the balance loss, even with this, can still lead to training instability, and it lists that as its first open challenge.

--

<p class="eyebrow"><span class="paper">Cai et al. 2024</span> · §4.1.1 · expert capacity · optional</p>

## What happens when an expert is full?

<div class="rows">
<div class="points">
<div class="text">

- An expert has a **capacity**: a threshold on tokens it will process; the excess overflows and is not processed by it.
- OpenMoE: tokens late in a sequence are dropped more ("Drop-towards-the-End"), worse in instruction-tuning data.

</div>
<div class="text">

- OpenMoE: routing follows token identity, set early in pretraining and then fixed.
- Remedy: Batch Prioritized Routing ranks tokens by gate score, not by position.

</div>
</div>
</div>

<p class="footnote">Cai et al. 2024 · §4.1.1. OpenMoE: an open mixture of experts model family; instruction tuning: fine-tuning on instruction and answer pairs</p>

Note:
Optional. Alongside the balance loss, token-choice models cap how many tokens each expert accepts per batch. The cost is token overflow: tokens sent to a full expert are not processed by it. OpenMoE's analysis names three effects. Drop-towards-the-End: later tokens in a sequence are at greater risk of being dropped, and this is worse in instruction-tuning data. Context-independent Specialization: routing follows the token's identity. Early Routing Learning: that identity routing is set early in pretraining and stays largely fixed. For vision, Riquelme and colleagues proposed Batch Prioritized Routing, which gives priority by gate score instead of position; Zoph and colleagues showed it works for language models too. Kim and colleagues randomise token priority to reduce bias toward early positions.

---

<p class="eyebrow"><span class="paper">Cai et al. 2024</span> · §4.1.1, §4.1.3 · Fig. 4</p>

## What else could do the choosing?

<table class="rules" style="font-size:20px">
  <tr><td>family</td><td>who chooses</td><td>the survey's claim</td></tr>
  <tr><td><b>non-trainable</b> (Hash Layer)</td><td>a fixed hash of the token</td><td>no gate parameters; load balancing by the choice of hash</td></tr>
  <tr><td><b>expert choice</b> (Zhou et al.)</td><td>each expert picks its top tokens</td><td>no balance loss, even load; but some tokens get several experts or none</td></tr>
  <tr><td><b>soft: token merging</b> (Soft MoE)</td><td>experts get weighted averages of tokens</td><td>stable and balanced; needs future tokens, which complicates autoregressive decoders</td></tr>
  <tr><td><b>soft: expert merging</b> (SMEAR, Lory)</td><td>one merged expert per input</td><td>fully differentiable; Lory gains 13.9% perplexity over a matched dense model</td></tr>
</table>

<p class="footnote">Cai et al. 2024 · §4.1.1 (non-trainable, expert choice), §4.1.3 (soft), Fig. 4c, 4d, 4f. SMEAR: averages experts' weights with the router's probabilities; Lory: SMEAR merged per text segment, for language-model pretraining</p>

Note:
Three alternatives to learned token choice. Non-trainable: Hash Layer routes by hashing the token, with competitive results and no gate to train. A wording check (ours): the survey says full load balancing, but the hash is chosen in advance to spread batches; that is not an enforced guarantee. Expert choice inverts the direction: every expert takes its top tokens, so load is even without a balance loss, and the model can spend more computation on some tokens. The survey notes that Komatsuzaki and colleagues use it in an encoder and keep token choice in the T5 decoder; our reading (ours) is that expert choice compares tokens within a batch, so a token's route can depend on later tokens, which a decoder cannot see. Soft methods avoid the discrete choice altogether. Soft MoE merges tokens, SMEAR and Lory merge expert weights. Lory's 13.9 percent perplexity gain over parameter-matched dense models, and 1.5 to 11.1 percent on downstream tasks, is relayed from its paper.

---

<p class="eyebrow"><span class="paper">Cai et al. 2024</span> · §4.2.1, §4.2.4 · Fig. 5</p>

## Which network types can be experts, and what is a shared expert?

<div class="rows">
<div class="fig"><a href="img/week-07-cai-fig5-shared.png" target="_blank"><img src="img/week-07-cai-fig5-shared.png" alt="Cai et al. Figure 5: (a) mixture of attention heads, where each expert has its own query and output projections and keys and values are shared; (b) a shared expert, a fixed FFN beside gated FFN experts"></a></div>
<p class="plain">Almost always a feed-forward expert; attention experts are rare. A shared expert is a fixed FFN every token uses.</p>
</div>

<p class="footnote">Cai et al. 2024 · §4.2.1, §4.2.4, Fig. 5. MoA: mixture of attention heads (Zhang et al.), followed by JetMoE and ModuleFormer. FFN: feed-forward network</p>

Note:
Figure 5. Experts replace the feed-forward layer and each copies its architecture. The survey's reason is a hypothesis: self-attention layers are less sparse and less domain-specific than feed-forward layers. As support it relays DS-MoE's finding that only 20 percent of feed-forward experts engage against 80 percent in attention. Panel a, Mixture of Attention Heads: experts differ only in query and output projections, while key and value weights are shared. JetMoE, ModuleFormer and DS-MoE follow it. Panel b, the shared expert, from DeepSpeed-MoE's Residual-MoE: each token goes through one fixed feed-forward network plus one chosen by the gate, the chosen one acting as an error-correcting add-on. DeepSeekMoE, OpenMoE and Qwen1.5-MoE adopted it and the survey calls it a mainstream configuration.

---

<p class="eyebrow"><span class="paper">Cai et al. 2024</span> · §4.2.2 to §4.2.4 · Table 2</p>

## How many experts, how big, and how often?

<div class="rows">
<table class="rules tight" style="font-size:19px">
  <tr><td>model (active / total parameters)</td><td>experts active / total</td><td>expert width</td><td>MoE layers</td><td>activation</td><td>shared experts</td></tr>
  <tr><td>Switch 1571B</td><td>1 / 2048</td><td>FFN width</td><td>every layer</td><td>ReLU</td><td>0</td></tr>
  <tr><td>GLaM 64B / 1.2T</td><td>2 / 64</td><td>FFN width</td><td>every 2nd</td><td>GeGLU</td><td>0</td></tr>
  <tr><td>Mixtral 13B / 47B</td><td>2 / 8</td><td>FFN width</td><td>every layer</td><td>SwiGLU</td><td>0</td></tr>
  <tr><td>LLaMA-MoE 3.0B / 6.7B</td><td>2 / 16</td><td>688</td><td>every layer</td><td>SwiGLU</td><td>0</td></tr>
  <tr><td>LLaMA-MoE 3.5B / 6.7B</td><td>4 / 16</td><td>688</td><td>every layer</td><td>SwiGLU</td><td>0</td></tr>
  <tr><td>LLaMA-MoE 3.5B / 6.7B</td><td>2 / 8</td><td>1376</td><td>every layer</td><td>SwiGLU</td><td>0</td></tr>
  <tr><td>DeepSeekMoE 2.8B / 16.4B</td><td>8 / 66</td><td>1408</td><td>all but 1st</td><td>SwiGLU</td><td>2</td></tr>
  <tr><td>Qwen1.5-MoE 2.7B / 14.3B</td><td>8 / 64</td><td>1408</td><td>every layer</td><td>SwiGLU</td><td>4</td></tr>
  <tr><td>DBRX 36B / 132B</td><td>4 / 16</td><td>FFN width</td><td>every layer</td><td>SwiGLU</td><td>0</td></tr>
  <tr><td>DeepSeek-V3 37B / 671B</td><td>9 / 257</td><td>2048</td><td>all but first 3</td><td>SwiGLU</td><td>1</td></tr>
</table>
</div>

<p class="footnote">Cai et al. 2024 · Table 2 (10 of its rows). Counts include shared experts. FFN width: as wide as the dense network's feed-forward layer. GeGLU, SwiGLU: gated activation functions</p>

Note:
The survey's Table 2, ten of its rows, with columns trimmed. Count: thousands of experts early, then the survey says recent models commonly use no more than 64. Its own table has exceptions: DeepSeekMoE with 66 and 132, DeepSeek-V3 with 257 (ours). Size: GLaM widened each expert; DeepSeekMoE, Qwen1.5-MoE and DBRX split experts finer, though its table gives DBRX full-width experts. The one controlled comparison is LLaMA-MoE: activating 4 of 16 experts of width 688 marginally beats 2 of 8 of width 1376, with no numbers given. Frequency: every other layer, every fourth, or every layer since Mixtral. DeepSeekMoE keeps its first layer dense because load balance converges slowly there. Activation: from ReLU toward SwiGLU, following dense models. Shared experts: 1, 2 or 4 in DeepSeekMoE, Qwen1.5-MoE and DeepSeek-V3.

---

<p class="eyebrow"><span class="paper">Cai et al. 2024</span> · §4.2.2 · Table 3</p>

## Which open models did the survey list?

<div class="rows">
<table class="rules tight" style="font-size:15px">
  <tr><td>name</td><td>time</td><td>affiliation</td><td>active</td><td>total</td><td>MMLU</td><td>GSM8K</td><td>MATH</td><td>HumanEval</td></tr>
  <tr><td>Mixtral-8x7B-v0.1</td><td>2023.12</td><td>Mistral</td><td>13B</td><td>47B</td><td>70.6</td><td>58.4, 74.4 (8-shot)</td><td>28.4</td><td>40.2</td></tr>
  <tr><td>DeepSeekMoE-16B-Base</td><td>2024.1</td><td>DeepSeek</td><td>3B</td><td>16B</td><td>45.0</td><td>18.8 (8-shot)</td><td>4.3</td><td>26.8</td></tr>
  <tr><td>Grok-1</td><td>2024.3</td><td>xAI</td><td>86B</td><td>314B</td><td>73.0</td><td>62.9</td><td>23.9</td><td>63.2</td></tr>
  <tr><td>Qwen1.5-MoE-A2.7B</td><td>2024.3</td><td>Alibaba</td><td>3B</td><td>14B</td><td>62.5</td><td>61.5 (8-shot)</td><td>-</td><td>34.2</td></tr>
  <tr><td>DBRX Instruct</td><td>2024.3</td><td>Databricks</td><td>36B</td><td>132B</td><td>73.7</td><td>72.8</td><td>-</td><td>70.1</td></tr>
  <tr><td>Jamba-v0.1</td><td>2024.3</td><td>AI21 Labs</td><td>12B</td><td>52B</td><td>67.4</td><td>59.9 (3-shot)</td><td>-</td><td>29.3</td></tr>
  <tr><td>Mistral-8x22B-v0.1</td><td>2024.4</td><td>Mistral</td><td>39B</td><td>141B</td><td>77.8</td><td>78.6, 88.4 (8-shot)</td><td>41.8</td><td>45.1</td></tr>
  <tr><td>Arctic Instruct</td><td>2024.4</td><td>Snowflake</td><td>17B</td><td>480B</td><td>67.3</td><td>74.2</td><td>-</td><td>-</td></tr>
  <tr><td>DeepSeek-V2</td><td>2024.5</td><td>DeepSeek</td><td>21B</td><td>236B</td><td>78.5</td><td>79.2 (8-shot)</td><td>43.6</td><td>48.8</td></tr>
  <tr><td>DeepSeek-V2-Chat (RL)</td><td>2024.5</td><td>DeepSeek</td><td>21B</td><td>236B</td><td>77.8</td><td>92.2 (8-shot)</td><td>53.9</td><td>81.1</td></tr>
  <tr><td>Yuan 2.0-M32</td><td>2024.5</td><td>IEIT</td><td>4B</td><td>40B</td><td>72.2</td><td>92.7 (8-shot)</td><td>55.9 (8-shot)</td><td>74.4</td></tr>
  <tr><td>Skywork-MoE-Base</td><td>2024.6</td><td>Kunlun</td><td>22B</td><td>146B</td><td>77.4</td><td>76.1</td><td>31.9</td><td>43.9</td></tr>
  <tr><td>OLMoE-0924-Base</td><td>2024.9</td><td>Ai2</td><td>1.3B</td><td>6.9B</td><td>54.1</td><td>3.0 (8-shot)</td><td>-</td><td>22.4</td></tr>
  <tr><td>DeepSeek-V3-Base</td><td>2024.12</td><td>DeepSeek</td><td>37B</td><td>671B</td><td>87.1</td><td>89.3 (8-shot)</td><td>61.6</td><td>65.2</td></tr>
</table>
</div>

<p class="footnote">Cai et al. 2024 · Table 3 (14 rows; links dropped). MMLU: multiple-choice exam questions; GSM8K: grade-school math problems; MATH: competition math; HumanEval: write Python functions. n-shot: n worked examples in the prompt</p>

Note:
The survey's Table 3: recent open-source models with active and total parameters and four benchmark scores, MMLU with 5 shots, GSM8K with 5, MATH with 4 and HumanEval with 0 unless a cell says otherwise. Notice the sweep from Mixtral in December 2023 to DeepSeek-V3 in December 2024: active parameters stay far below total, for instance 37B of 671B for DeepSeek-V3. Cautions (ours): the survey runs no experiments, so these scores are relayed. Rows mix base, instruct and chat models, some GSM8K cells use 8 or 3 shots and two cells give two numbers, so the rows do not compare cleanly. The table ends at the end of 2024; Week 4's 2025 models come after it. Use it as a list of models, not a leaderboard.

---

<p class="eyebrow"><span class="paper">Cai et al. 2024</span> · §4.3 · Fig. 6</p>

## Can the experts be small adapters instead?

<div class="cols wide-fig">
<div class="text">

- **PEFT**: update a small set of weights, leave the base model untouched. **LoRA**: two low-rank matrices take the update.
- **MoPE**: each expert is built with PEFT; a gate mixes them.
- (a) attention, (b) FFN, (c) Transformer block, (d) every layer.

</div>
<div class="fig"><img src="img/week-07-cai-fig6-mope.png" alt="Cai et al. Figure 6: mixtures of parameter-efficient experts by placement, (a) in attention, (b) in the feed-forward network, (c) in the whole Transformer block with two expert groups, (d) every layer treated as one expert"></div>
</div>

<p class="footnote">Cai et al. 2024 · §4.3, Fig. 6. PEFT: parameter-efficient fine-tuning; MoPE: mixture of parameter-efficient experts; FFN: feed-forward network</p>

Note:
Section 4.3. Full fine-tuning updates every weight, which is expensive. PEFT updates a small set and keeps the base model untouched; LoRA is the example, with two low-rank matrices receiving the update. The survey's problem statement: PEFT often struggles to generalise across several tasks and can forget. The remedy is a mixture of parameter-efficient experts: the gate and multi-expert structure of a mixture of experts, with each expert built with PEFT. The survey says this combines task versatility with resource efficiency. Figure 6 sorts methods by placement: (a) attention, as in MoELoRA, MoCLE and SiRA; (b) the feed-forward network, as in LoRAMoE, AdaMix and MixLoRA; (c) the whole block, with two expert groups each with its own gate, as in MoV and MoLoRA; (d) every layer as one expert, MoLE. Only qualitative claims are given here.

---

<p class="eyebrow"><span class="paper">Cai et al. 2024</span> · §4.4 · Fig. 7</p>

## Where does a mixture of experts come from?

<div class="cols wide-fig">
<div class="text">

- (a) Original: train as a mixture from scratch.
- (b) Merge separately trained expert models (Branch-Train-MiX).
- (c) Dense to sparse: **upcycling** copies a trained dense FFN into every expert.
- (d) Sparse to dense: distil the mixture into a dense model.

</div>
<div class="fig"><img src="img/week-07-cai-fig7-schemes.png" alt="Cai et al. Figure 7: four training and inference schemes, (a) original, trained as a mixture from the start, (b) merging separate expert models, (c) dense to sparse, (d) sparse to dense"></div>
</div>

<p class="footnote">Cai et al. 2024 · §4.4, Fig. 7. Distil: train a small model to copy a large one. Branch-Train-MiX: separate domain models merged into one mixture</p>

Note:
Figure 7 shows four schemes. (a) The original: build the mixture and train from scratch. (c) Dense to sparse, upcycling, from Komatsuzaki and colleagues: copy a trained dense checkpoint's feed-forward network into every expert, initialise the gate at random and keep training. Skywork-MoE reports that models trained from scratch consistently beat upcycled ones, so the choice depends on the dense checkpoint and the training budget, and more similar experts predict a worse model; no magnitudes. (d) Sparse to dense: Switch's distillation keeps about 30 percent of the sparse model's quality gain with about 5 percent of the parameters, a relayed figure; OneS keeps 61.7 percent on ImageNet and 88.2 percent on language tasks. (b) Merging: Branch-Train-Merge trains domain models separately; Branch-Train-MiX joins their feed-forward networks as experts, averages attention, and fine-tunes on all data together. One check (ours): Mixtral has Mistral 7B's exact shape, but its paper does not say whether it was upcycled.

--

<p class="eyebrow"><span class="paper">Cai et al. 2024</span> · §4.4.1 · optional</p>

## Does the order of softmax and TopK matter?

<div class="rows">
<div class="eq">$$\operatorname{softmax}(\operatorname{TopK}(g(\mathbf{x}; \mathbf{\Theta}), k)) \quad\text{versus}\quad \operatorname{TopK}(\operatorname{softmax}(g(\mathbf{x}; \mathbf{\Theta})), k)$$</div>
<dl class="where">
<dt>left</dt><dd>Shazeer et al.: the kept scores are normalised to sum to 1</dd>
<dt>right</dt><dd>later models (Switch, OpenMoE): softmax over all experts first, then keep the top $k$</dd>
</dl>
<p class="plain">Upcycling work: normalising the combined gate scores to 1 helped upcycled vision models and hurt upcycled language models.</p>
</div>

<p class="footnote">Cai et al. 2024 · §4.4.1 (Komatsuzaki et al.). Symbols as in Eq. 3: $g$ the gating value, $\mathbf{x}$ the token, $\mathbf{\Theta}$ the gate weights, $k$ the number of experts kept</p>

Note:
Optional. Inside the upcycling discussion, the survey gives the one evidence it has on a detail that matters. Komatsuzaki and colleagues normalised the gating scores for each token to 1, to limit the initial performance drop after upcycling, since in the dense model each token went through a single feed-forward network. That helped upcycled vision models and hurt upcycled language models. The survey then points out that Shazeer's original form takes the softmax after TopK, which normalises to 1, while later language models such as Switch and OpenMoE take the softmax over all experts first and then TopK. This also shows its own Equation 3 is the first form while most later models use the second (ours). A reason from our own reading, not the survey's: with k equal to 1, renormalising a single kept weight gives exactly 1, so the router would get no gradient through it.

---

<p class="eyebrow"><span class="paper">Cai et al. 2024</span> · §5 · Fig. 8</p>

## What does the hardware have to do?

<div class="rows">
<div class="fig"><a href="img/week-07-cai-fig8-parallel.png" target="_blank"><img src="img/week-07-cai-fig8-parallel.png" alt="Cai et al. Figure 8: expert parallelism across four GPUs, with all-to-all dispatch before and all-to-all combine after expert computation, shown as (a) data plus expert, (b) with tensor, (c) with pipeline, (d) expert plus tensor parallelism"></a></div>
<p class="plain">Flow in (a): gate routing, input encode, All-to-All dispatch, expert computation, All-to-All combine, output decode.</p>
</div>

<p class="footnote">Cai et al. 2024 · §5, Fig. 8. Expert parallelism: each expert on its own device, other layers copied. All-to-All: every device sends a piece to every other device. GEMM: a matrix multiplication</p>

Note:
Section 5, system design. Expert parallelism puts each expert on a different device while non-expert layers are duplicated, an augmentation of data parallelism. Figure 8a gives the flow: gate routing; input encode, which gathers the tokens for one expert into contiguous memory so the matrix multiply is large enough to use the device well; All-to-All dispatch to the devices holding the experts; expert computation; All-to-All combine; output decode, which restores the original layout. Panels b to d combine expert parallelism with tensor and pipeline parallelism. The survey says the choice of strategy trades off computation, communication and memory, and depends on the hardware. It says the quadruple All-to-All per mixture layer, in forward and backward, is a significant overhead and often the main constraint. It gives no speed numbers; all claims are attributed and qualitative (ours).

--

<p class="eyebrow"><span class="paper">Cai et al. 2024</span> · §5 · Table 4 · optional</p>

## Which open frameworks optimise which part?

<div class="rows">
<table class="rules tight" style="font-size:19px">
  <tr><td>framework</td><td>affiliation</td><td>computation</td><td>communication</td><td>storage</td><td>GitHub stars</td></tr>
  <tr><td>OpenMoE (Colossal-AI)</td><td>Colossal-AI</td><td>&#10003;</td><td>&#10003;</td><td></td><td>38K</td></tr>
  <tr><td>ScatterMoE</td><td>Mila Quebec</td><td>&#10003;</td><td></td><td></td><td>140</td></tr>
  <tr><td>Megablocks</td><td>Stanford University</td><td>&#10003;</td><td></td><td></td><td>1.1K</td></tr>
  <tr><td>Tutel</td><td>Microsoft</td><td>&#10003;</td><td>&#10003;</td><td></td><td>672</td></tr>
  <tr><td>SE-MoE</td><td>Baidu</td><td>&#10003;</td><td>&#10003;</td><td>&#10003;</td><td>21K</td></tr>
  <tr><td>HetuMoE</td><td>Peking University</td><td>&#10003;</td><td>&#10003;</td><td></td><td>236</td></tr>
  <tr><td>Deepspeed-MoE</td><td>Microsoft</td><td>&#10003;</td><td>&#10003;</td><td></td><td>33K</td></tr>
  <tr><td>FastMoE</td><td>Tsinghua University</td><td>&#10003;</td><td>&#10003;</td><td></td><td>1.4K</td></tr>
  <tr><td>Fairseq</td><td>Meta</td><td></td><td></td><td></td><td>29K</td></tr>
  <tr><td>Mesh-TensorFlow</td><td>Google</td><td></td><td></td><td></td><td>1.6K</td></tr>
</table>
</div>

<p class="footnote">Cai et al. 2024 · §5, framework table (arranged newest to oldest in the survey; stars as of June 2024). Computation: kernels and expert placement; communication: All-to-All; storage: offloading</p>

Note:
Optional. The survey's overview of open-source frameworks and which of three optimisations each covers. Computation: load imbalance across devices, handled by dynamic expert placement in SE-MoE, Tutel, FlexMoE and SmartMoE, and by FasterMoE's shadowed experts; and the gate, encode and decode operations, handled by tailored GPU kernels, with MegaBlocks reformulating the computation as block-sparse operations. Communication: hierarchical All-to-All, topology-aware routing, and overlapping communication with computation, including by restructuring the architecture as ScMoE and Arctic do. Storage: keep non-expert parameters and active experts in GPU memory, offload the rest to CPU memory or SSD, and prefetch by predicting the next experts. The survey's statement of the memory problem (ours, in short): every expert has to be stored somewhere.

---

<p class="eyebrow"><span class="paper">Cai et al. 2024</span> · §6 · applications</p>

## Where has mixture of experts been applied?

<table class="rules" style="font-size:20px">
  <tr><td>domain</td><td>examples in the survey</td></tr>
  <tr><td><b>natural language</b></td><td>translation, open-domain question answering, code generation, maths; MoGU balances a usable and a safe model</td></tr>
  <tr><td><b>computer vision</b></td><td>V-MoE, SwinV2-MoE (Tutel), ADVMOE, pMoE</td></tr>
  <tr><td><b>recommender systems</b></td><td>MMoE (one gate per task), PLE, AdaMCT, M3oE</td></tr>
  <tr><td><b>multimodal</b></td><td>LIMoE, MoCLE, LLaVA-MoLE, MoE-LLaVA, Uni-MoE</td></tr>
</table>

<p class="footnote">Cai et al. 2024 · §6. V-MoE: sparse mixture inside a vision Transformer; MMoE: multi-gate mixture of experts; PLE here: Progressive Layered Extraction, not per-layer embeddings; LIMoE: image and text mixture of experts</p>

Note:
Section 6 is a catalogue, so keep it short. Natural language: machine translation, open-domain question answering, code generation and maths, plus MoGU, which uses dynamic routing to balance a usable model and a safe one. Vision: V-MoE puts a sparse mixture of MLPs into selected ViT blocks and rivals state-of-the-art networks with much less inference compute; Tutel is demonstrated with SwinV2-MoE; ADVMOE studies adversarial robustness; pMoE routes image patches. Recommender systems: multi-task settings, where MMoE shares expert submodels across tasks with one gate per task, and PLE separates shared and task-specific parts to counter the seesaw effect. Multimodal: LIMoE trains on images and text with an entropy-based regulariser against load imbalance; MoCLE and LLaVA-MoLE use LoRA experts. The survey also repeats a rumour that GPT-4 uses a mixture of experts (ours: unconfirmed).

---

<p class="eyebrow"><span class="paper">Cai et al. 2024</span> · §7 · challenges</p>

## What does the survey say is still open?

<table class="rules" style="font-size:19px">
  <tr><td>challenge</td><td>in the survey</td></tr>
  <tr><td>stability and load balancing</td><td>losses "can still lead to training instability"</td></tr>
  <tr><td>scalability and communication</td><td>a "significant bottleneck" in distributed training</td></tr>
  <tr><td>expert specialization and collaboration</td><td>a weighted sum of top-k experts "can overlook" relations across experts</td></tr>
  <tr><td>sparse activation and efficiency</td><td>sparse operations are non-uniform for hardware accelerators</td></tr>
  <tr><td>generalization and robustness</td><td>sparse models tend to overfit specific tasks</td></tr>
  <tr><td>interpretability and transparency</td><td>methods to visualize and explain each expert</td></tr>
  <tr><td>optimal expert architecture</td><td>network types, number of experts per layer, architecture search</td></tr>
  <tr><td>integration with existing frameworks</td><td>adapt a model to MoE without training from scratch</td></tr>
</table>

<p class="footnote">Cai et al. 2024 · §7, eight challenges in its order; quoted words are its own, other cells short paraphrases (ours)</p>

Note:
The survey ends with eight challenges and opportunities, in this order. One: training stability and load balancing; losses help but can still lead to instability and neglect token importance. Two: scalability and communication overhead; it says shared experts hold promise for reducing the data sent between devices. Three: specialisation and collaboration; shared experts are the prevailing strategy but a sparse weighted sum can overlook relations across experts. Four: sparse activation and computational efficiency on hardware. Five: generalisation and robustness; sparse models overfit, with dropout, token dropping and multi-task instruction tuning as remedies. Six: interpretability. Seven: optimal expert architecture, including different numbers of experts per layer and automated architecture search. Eight: integration with existing frameworks, where PEFT-plus-mixture methods may compromise performance or complicate parallel strategies. A closing note (ours): the survey lists DeepSeek-V3 in its tables but not the auxiliary-loss-free balancing it introduced, which we meet in the next reading.


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

<p class="eyebrow"><span class="paper">Dai et al. 2024</span> · §2 · Eq. 3 to 5</p>

## How does an ordinary MoE layer compute its output?

<div class="cols">
<div class="text">

<div class="eq">$$\begin{aligned} \mathbf{h}_t^l &= \sum_{i=1}^{N} g_{i,t}\,\mathrm{FFN}_i(\mathbf{u}_t^l) + \mathbf{u}_t^l \\ g_{i,t} &= \begin{cases} s_{i,t}, & s_{i,t} \in \mathrm{Topk}(\{s_{j,t} \mid 1 \le j \le N\}, K) \\ 0, & \text{otherwise} \end{cases} \\ s_{i,t} &= \mathrm{Softmax}_i\big({\mathbf{u}_t^l}^{\top} \mathbf{e}_i^l\big) \end{aligned}$$</div>

</div>
<div class="text">

<dl class="where">
<dt>$\mathbf{u}_t^l$, $\mathbf{h}_t^l$</dt><dd>token $t$'s hidden state after attention, and after the layer</dd>
<dt>$N$, $K$</dt><dd>number of experts, and how many are used per token</dd>
<dt>$\mathrm{FFN}_i$</dt><dd>the $i$-th expert, a feed-forward network</dd>
<dt>$g_{i,t}$, $s_{i,t}$</dt><dd>gate value and token-to-expert affinity</dd>
<dt>$\mathbf{e}_i^l$</dt><dd>the centroid vector of expert $i$</dd>
</dl>

<p class="plain">Only $K$ of the $N$ gates are nonzero.</p>

</div>
</div>

<p class="footnote">Dai et al. 2024 (DeepSeekMoE), arXiv:2401.06066 · §2, Eq. 3 to 5; layer normalisation omitted, as in the paper</p>

Note:
The paper starts from a generic MoE layer. A standard Transformer block has attention and then one feed-forward network. In an MoE layer that feed-forward network is replaced by N experts, each the same shape as the ordinary one. The router scores every expert with a softmax of the token's hidden state against that expert's centroid vector, keeps the K highest scores, and sets all other gates to zero. The output is the weighted sum of the chosen experts plus the residual input. Because only K gates are nonzero, each token is computed in only K experts, which is where the saving comes from. Everything that follows changes how the experts are cut up and how many of them are always on.

---

<p class="eyebrow"><span class="paper">Dai et al. 2024</span> · §3 · Fig. 2</p>

## What does DeepSeekMoE change in the layer?

<div class="rows">
<div class="fig"><img src="img/week-07-dsmoe-fig2-arch.png" alt="DeepSeekMoE Figure 2: (a) conventional top-2 routing over N experts, (b) the same with each expert split into smaller ones and more chosen, (c) one expert made shared and always on, which is the full DeepSeekMoE layer"></div>
<p class="plain">Same expert parameters and same computation in all three; two changes: split the experts, and keep some always on.</p>
</div>

<p class="footnote">Dai et al. 2024 · §3, Fig. 2. Routed expert: chosen by the router. Shared expert: used by every token</p>

Note:
Figure 2 is the paper's summary. Panel (a) is the conventional layer: top-2 of N experts. Panel (b) is fine-grained expert segmentation: each expert is cut into smaller ones and more of them are chosen, so the cost stays the same. Panel (c) isolates one expert as shared, in green: it skips the router and every token uses it, and the number of routed experts chosen goes down by one to compensate. The caption says the number of expert parameters and the computational cost stay constant across all three. The next two slides give each change as an equation.

---

<p class="eyebrow"><span class="paper">Dai et al. 2024</span> · §3.1 · Eq. 6 to 8</p>

## What does fine-grained expert segmentation do?

<div class="cols">
<div class="text">

<div class="eq">$$\begin{aligned} \mathbf{h}_t^l &= \sum_{i=1}^{mN} g_{i,t}\,\mathrm{FFN}_i(\mathbf{u}_t^l) + \mathbf{u}_t^l \\ g_{i,t} &= \begin{cases} s_{i,t}, & s_{i,t} \in \mathrm{Topk}(\{s_{j,t} \mid 1 \le j \le mN\}, mK) \\ 0, & \text{otherwise} \end{cases} \end{aligned}$$</div>

</div>
<div class="text">

<dl class="where">
<dt>$m$</dt><dd>pieces each expert is split into; each has $1/m$ of the hidden width</dd>
<dt>$mN$, $mK$</dt><dd>experts in total, and experts used per token</dd>
<dt>$\mathbf{u}$, $\mathbf{h}$, $\mathrm{FFN}_i$, $g_{i,t}$, $s_{i,t}$</dt><dd>as on the previous slide</dd>
</dl>

<p class="plain">Same parameters and cost, more ways to combine experts: 120 choices become 4,426,165,368.</p>

</div>
</div>

<p class="footnote">Dai et al. 2024 · §3.1, Eq. 6 to 8. The two counts are the paper's example: top-2 of 16 experts, against top-8 of 64 after splitting each into 4</p>

Note:
Fine-grained segmentation. Take each expert feed-forward network and cut it into m smaller experts by reducing its hidden width to one over m. To keep the arithmetic the same, choose m times as many. The total expert parameters are still N times one ordinary feed-forward network, but there are now mN experts and mK nonzero gates. The paper's reason: with few experts, the tokens sent to one expert cover very different kinds of knowledge, which is hard for one expert to hold. If a token can reach more experts, the knowledge can be spread over them and each stays focused. The combinatorial example in the text: with N equal to 16, top-2 gives 120 combinations, while splitting each expert into 4 and choosing 8 gives about 4.4 billion. The paper says this enhances the potential for more targeted knowledge acquisition and does not test the count by itself.

---

<p class="eyebrow"><span class="paper">Dai et al. 2024</span> · §3.2 · Eq. 9 to 11</p>

## What does shared expert isolation do?

<div class="cols">
<div class="text">

<div class="eq">$$\begin{aligned} \mathbf{h}_t^l &= \sum_{i=1}^{K_s} \mathrm{FFN}_i(\mathbf{u}_t^l) + \sum_{i=K_s+1}^{mN} g_{i,t}\,\mathrm{FFN}_i(\mathbf{u}_t^l) + \mathbf{u}_t^l \\ g_{i,t} &= \begin{cases} s_{i,t}, & s_{i,t} \in \mathrm{Topk}(\{s_{j,t} \mid K_s+1 \le j \le mN\}, mK-K_s) \\ 0, & \text{otherwise} \end{cases} \end{aligned}$$</div>

</div>
<div class="text">

<dl class="where">
<dt>$K_s$</dt><dd>number of shared experts, always used, no gate</dd>
<dt>$mN-K_s$</dt><dd>number of routed experts</dd>
<dt>$mK-K_s$</dt><dd>number of nonzero gates, so cost stays constant</dd>
</dl>

<p class="plain">Shared experts hold common knowledge; the routed ones can specialise.</p>

</div>
</div>

<p class="footnote">Dai et al. 2024 · §3.2, Eq. 9 to 11; other symbols as before. The paper credits the prototype to DeepSpeed-MoE, which came from an engineering view</p>

Note:
Shared expert isolation. Out of the mN experts, K_s are isolated as shared. Every token goes through them regardless of the router, and they have no gate, so the first sum has no g. The router chooses among the remaining mN minus K_s experts, and picks mK minus K_s of them, so the total number of experts running per token is unchanged. The paper's reason: tokens sent to different experts often need common knowledge, so several experts end up relearning it, which wastes parameters. Dedicated shared experts take that job, so the routed experts are less redundant and can be more specialised. The paper credits the prototype to DeepSpeed-MoE, and says the difference is that they derive it from an engineering view and DeepSeekMoE from an algorithmic one.

---

<p class="eyebrow"><span class="paper">Dai et al. 2024</span> · §3.3 · Eq. 12 to 14</p>

## How is the load kept balanced?

<div class="rows">
<div class="eq">$$\mathcal{L}_{\mathrm{ExpBal}} = \alpha_1 \sum_{i=1}^{N'} f_i P_i,\quad f_i = \frac{N'}{K'T} \sum_{t=1}^{T} \mathbb{1}(\text{Token } t \text{ selects Expert } i),\quad P_i = \frac{1}{T} \sum_{t=1}^{T} s_{i,t}$$</div>
<dl class="where">
<dt>$\alpha_1$, $N'$, $K'$</dt><dd>balance weight; $mN-K_s$ routed experts, $mK-K_s$ used per token</dd>
<dt>$T$, $s_{i,t}$</dt><dd>number of tokens, and token $t$'s router score for expert $i$ (Eq. 5)</dd>
<dt>$f_i$, $P_i$</dt><dd>scaled fraction of tokens selecting expert $i$, and its mean router score</dd>
</dl>
<p class="plain">Without it the router may use only a few experts: routing collapse.</p>
</div>

<p class="footnote">Dai et al. 2024 · §3.3, Eq. 12 to 14. $\mathbb{1}(\cdot)$ is 1 if the statement is true and 0 otherwise</p>

Note:
Two defects of a learned router, in the paper's words: a risk of routing collapse, where the model always picks the same few experts and the others never train, and, when experts sit on different devices, load imbalance that creates computation bottlenecks. The expert-level balance loss addresses the first. For each expert, multiply the fraction of tokens that chose it by its average router score, and sum. This is smallest when both are even across experts. The coefficient alpha one is a weight. Values used: 0.01 in the 2B validation experiments, 0.001 at 16B, 0.003 at 145B. At 16B the authors say a higher value did not improve efficiency under their parallelism and only hurt the model. Next slide: the device-level version.

--

<p class="eyebrow"><span class="paper">Dai et al. 2024</span> · §3.3 · Eq. 15 to 17 · optional</p>

## And across devices?

<div class="cols">
<div class="text">

<div class="eq">$$\mathcal{L}_{\mathrm{DevBal}} = \alpha_2 \sum_{i=1}^{D} f'_i P'_i,\quad f'_i = \frac{1}{|\mathcal{E}_i|} \sum_{j \in \mathcal{E}_i} f_j,\quad P'_i = \sum_{j \in \mathcal{E}_i} P_j$$</div>

</div>
<div class="text">

<dl class="where">
<dt>$\mathcal{E}_1, \ldots, \mathcal{E}_D$</dt><dd>the $D$ groups of routed experts, one group per device</dd>
<dt>$\alpha_2$</dt><dd>device-level balance factor, a weight</dd>
<dt>$f'_i$, $P'_i$</dt><dd>group-level versions of $f$ and $P$</dd>
</dl>

<p class="plain">Strict balance per expert is not needed, only per device.</p>

</div>
</div>

<p class="footnote">Dai et al. 2024 · §3.3, Eq. 15 to 17. Used only at 145B, with $\alpha_2 = 0.05$ and experts on 4 devices</p>

Note:
When the aim is only to avoid computation bottlenecks, the paper says strict balance at the expert level is unnecessary, because too much constraint on load balance hurts the model. So the experts are split into D groups, one group per device, and the same product of load and score is computed per group. In practice they use a small expert-level factor against collapse and a larger device-level factor for balanced computation. At 145B the device factor is 0.05 against 0.003 for the expert level, with routed experts spread over 4 devices. The smaller models keep all experts on one device, drop no tokens and use no device-level loss.

---

<p class="eyebrow"><span class="paper">Dai et al. 2024</span> · §4.1 to §4.2 · Table 1</p>

## Does it beat the other MoE designs at the same size?

<div class="rows">
<div class="points">
<div class="text">

- Setup: 9 layers, every FFN an MoE layer, 2B parameters in total and 0.3B active, trained on 100B tokens.
- DeepSeekMoE: 1 shared and 63 routed experts, each a quarter of an FFN, 7 routed used.

</div>
<div class="text">

- Best on every benchmark row of the paper's table; the dense model has 0.2B active against 0.3B.

</div>
</div>

<table class="rules tight" style="font-size:19px">
  <tr><td>2B models, 100B tokens</td><td>Dense</td><td>Hash Layer</td><td>Switch</td><td>DeepSeekMoE</td></tr>
  <tr><td>activated parameters</td><td>0.2B</td><td>0.2B</td><td>0.2B</td><td>0.3B</td></tr>
  <tr><td>FLOPs per 2K tokens</td><td>2.9T</td><td>2.9T</td><td>2.9T</td><td>4.3T</td></tr>
  <tr><td>Pile (loss)</td><td>2.060</td><td>1.932</td><td>1.881</td><td><b>1.808</b></td></tr>
  <tr><td>HellaSwag</td><td>38.8</td><td>46.2</td><td>49.1</td><td><b>54.8</b></td></tr>
  <tr><td>ARC-easy</td><td>41.0</td><td>45.3</td><td>45.9</td><td><b>49.4</b></td></tr>
  <tr><td>TriviaQA</td><td>4.9</td><td>6.5</td><td>8.9</td><td><b>16.6</b></td></tr>
  <tr class="total"><td>NaturalQuestions</td><td>1.4</td><td>1.4</td><td>2.5</td><td><b>5.7</b></td></tr>
</table>
</div>

<p class="footnote">Dai et al. 2024 · §4, Table 1 (7 of its 15 rows shown). Pile: mixed English text, test loss. HellaSwag: pick a story's ending. ARC-easy: grade-school science. TriviaQA, NaturalQuestions: closed-book questions. Hash: fixed hash routing; Switch: top-1 learned routing</p>

Note:
The first experiment. The models share the corpus and the hyper-parameters, and the MoE models share 2.0 billion total parameters. The paper has one more baseline column that the slide leaves out. Setup from the paper: 100 billion tokens of a multilingual corpus, mostly English and Chinese, 9 Transformer layers of width 1280, an expert-level balance factor of 0.01, no token dropping. The dense model has 0.2B parameters. Hash Layer and Switch use top-1 routing, fixed hash and learned, with 0.2B active. DeepSeekMoE has one shared and 63 routed experts, 7 routed used, 0.3B active. Pile loss falls from 2.060 for dense through 1.932 and 1.881 to 1.808, and DeepSeekMoE is best on all 11 rows of the full table, for example TriviaQA 16.6 against 8.9 for Switch. Caveats (ours): one run per model, no error bars in the paper, and the code rows are near zero for every model. Note DeepSeekMoE also has 0.3B active against 0.2B for Hash and Switch, so it is not at equal active parameters with them.

---

<p class="eyebrow"><span class="paper">Dai et al. 2024</span> · §4.3 · Table 2</p>

## How close is it to a model with every expert on?

<div class="rows">
<div class="points">
<div class="text">

- Dense x16: 16 shared experts of full FFN size, so all 16 FFN-widths of parameters are used for every token.
- The paper calls it the upper bound for MoE models, at about 2B parameters and 100B tokens.

</div>
<div class="text">

- DeepSeekMoE matches its Pile loss with 4.3T FLOPs against 24.6T.

</div>
</div>

<table class="rules" style="font-size:20px">
  <tr><td>2B models, 100B tokens</td><td>Dense x16</td><td>DeepSeekMoE</td></tr>
  <tr><td>activated expert parameters</td><td>1.89B</td><td>0.24B</td></tr>
  <tr><td>FLOPs per 2K tokens</td><td>24.6T</td><td>4.3T</td></tr>
  <tr><td>Pile (loss)</td><td>1.806</td><td>1.808</td></tr>
  <tr><td>HellaSwag</td><td>55.1</td><td>54.8</td></tr>
  <tr><td>TriviaQA</td><td>16.5</td><td>16.6</td></tr>
  <tr class="total"><td>RACE-middle</td><td>46.3</td><td>44.0</td></tr>
</table>
</div>

<p class="footnote">Dai et al. 2024 · §4.3, Table 2 (6 of its rows shown). RACE-middle: reading comprehension from school exams, accuracy. "Upper bound" is the authors' word</p>

Note:
To see how much is left to gain, the paper compares against a dense model with 16 times the standard FFN parameters. It builds it as 16 shared experts, each the size of a standard FFN, so every parameter is used for every token. The authors call this the strict upper bound of MoE models in terms of capacity, and claim DeepSeekMoE aligns closely with it, at least at the scale of about 2B parameters and 100B tokens. The numbers: Pile loss 1.806 against 1.808, HellaSwag 55.1 against 54.8, TriviaQA 16.5 against 16.6. The cost is very different: 24.6T FLOPs against 4.3T, 5.7 times more (ours). One row does not follow: RACE-middle is 46.3 against 44.0, and the paper does not discuss it.

---

<p class="eyebrow"><span class="paper">Dai et al. 2024</span> · §5 · Table 3</p>

## Does 16B at 40% of the compute match a dense 7B?

<div class="cols wide-text">
<div class="text">

- Both train on the same 2T tokens; DeepSeekMoE 16B has 2.8B active, the dense 7B has 6.9B.
- About 40% of the computations, and comparable overall.
- Ahead on language modelling and knowledge, behind on multiple choice; the authors point to its small attention: 0.5B against 2.5B parameters.

</div>
<div class="fig">
<table class="rules" style="font-size:19px">
  <tr><td>16B vs dense 7B</td><td>dense 7B</td><td>MoE 16B</td></tr>
  <tr><td>FLOPs per 4K tokens</td><td>183.5T</td><td>74.4T</td></tr>
  <tr><td>Pile (BPB)</td><td>0.75</td><td>0.74</td></tr>
  <tr><td>TriviaQA</td><td>59.7</td><td>64.8</td></tr>
  <tr><td>GSM8K</td><td>17.4</td><td>18.8</td></tr>
  <tr><td>MMLU</td><td>48.2</td><td>45.0</td></tr>
  <tr><td>CEval</td><td>45.0</td><td>40.6</td></tr>
  <tr class="total"><td>CMMLU</td><td>47.2</td><td>42.5</td></tr>
</table>
</div>
</div>

<p class="footnote">Dai et al. 2024 · §5.2, Table 3 (7 of its 24 rows shown). BPB: bits per byte, lower is better. GSM8K: grade-school maths, exact match. MMLU: 57-subject exam. CEval, CMMLU: Chinese exams like MMLU. Attention: the part of a layer that mixes tokens</p>

Note:
At scale the authors train a 16.4B-parameter DeepSeekMoE with 2.8B active on 2 trillion tokens, with 28 layers and, from the second layer on, MoE layers of 2 shared and 64 routed experts, 6 routed used. The first layer stays dense because load balance converges more slowly there. Against DeepSeek 7B, a dense 6.9B model on the same corpus, it needs 40.5% of the computation. The authors' summary is comparable performance. Strengths: Pile, HellaSwag, TriviaQA, NaturalQuestions, which they link to FFNs storing knowledge. Weakness: multiple choice such as MMLU, 45.0 against 48.2, which they link to the small attention. Strict count (ours): MoE higher on 12 of the 20 rows, lower on 8. The paper also says the model fits on one 40 GB GPU and is nearly 2.5 times faster than a dense 7B.

--

<p class="eyebrow"><span class="paper">Dai et al. 2024</span> · §5.3 · Table 4 · optional</p>

## And against LLaMA 2 7B?

<div class="cols wide-text">
<div class="text">

- Same 2T training tokens; DeepSeekMoE 16B needs 39.6% of the computations.
- It is ahead on most benchmarks; the authors credit the maths, code and Chinese gaps to its corpus.

</div>
<div class="fig">
<table class="rules" style="font-size:19px">
  <tr><td>16B vs LLaMA 2 7B</td><td>LLaMA 2 7B</td><td>MoE 16B</td></tr>
  <tr><td>FLOPs per 4K tokens</td><td>187.9T</td><td>74.4T</td></tr>
  <tr><td>Pile (BPB)</td><td>0.76</td><td>0.74</td></tr>
  <tr><td>HellaSwag</td><td>75.6</td><td>77.1</td></tr>
  <tr><td>HumanEval</td><td>14.6</td><td>26.8</td></tr>
  <tr><td>MBPP</td><td>21.8</td><td>39.2</td></tr>
  <tr><td>MMLU</td><td>45.8</td><td>45.0</td></tr>
  <tr class="total"><td>CMMLU</td><td>32.6</td><td>42.5</td></tr>
</table>
</div>
</div>

<p class="footnote">Dai et al. 2024 · §5.3, Table 4 (7 of its 24 rows shown). HumanEval, MBPP: Python coding problems, pass rate on one try. CMMLU: Chinese multi-subject exam</p>

Note:
LLaMA 2 7B has 6.7B parameters and was also trained on 2T tokens. DeepSeekMoE 16B has 245% of its total parameters but 39.6% of its computations, 74.4T against 187.9T FLOPs. The authors report it outperforms LLaMA 2 7B on the majority of the benchmarks. Maths and code are much stronger, HumanEval 26.8 against 14.6, which they attribute to the enriched maths and code text in their corpus. Chinese benchmarks are far ahead, as expected from the bilingual corpus. On English understanding and knowledge it is comparable or better, with MMLU a little lower at 45.0 against 45.8. Because the training corpora differ, the comparison does not isolate the architecture (ours); Table 3 is the cleaner test.

--

<p class="eyebrow"><span class="paper">Dai et al. 2024</span> · §7 · Table 6 · optional</p>

## Does it hold at 145B?

<div class="rows">
<div class="points">
<div class="text">

- A preliminary run on only 245B tokens; 4 shared and 128 routed experts, 12 routed used.
- With 28.5% of the computations, comparable to a dense 67B; the half-activated version uses 18.2%.

</div>
</div>

<table class="rules tight" style="font-size:19px">
  <tr><td>245B tokens</td><td>dense 67B</td><td>DeepSeekMoE 145B</td><td>142B, half activated</td></tr>
  <tr><td>activated parameters</td><td>67.4B</td><td>22.2B</td><td>12.2B</td></tr>
  <tr><td>FLOPs per 4K tokens</td><td>2057.5T</td><td>585.6T</td><td>374.6T</td></tr>
  <tr><td>Pile (loss)</td><td>1.905</td><td><b>1.876</b></td><td>1.888</td></tr>
  <tr><td>HellaSwag</td><td>74.8</td><td><b>75.8</b></td><td>74.9</td></tr>
  <tr><td>TriviaQA</td><td>57.2</td><td><b>61.1</b></td><td>59.8</td></tr>
  <tr><td>GSM8K</td><td>11.8</td><td>12.2</td><td>13.8</td></tr>
  <tr class="total"><td>MMLU</td><td>45.1</td><td>39.4</td><td>37.5</td></tr>
</table>
</div>

<p class="footnote">Dai et al. 2024 · §7, Table 6 (7 of its 27 rows shown). The paper calls this "ongoing", not a final model. Half activated: 2 shared and 6 of 128 routed used</p>

Note:
The last section is a preliminary run, marked ongoing by the authors: 62 layers, 144.6B total and 22.2B active parameters, trained on only 245 billion tokens. Compared with a dense 67B model, the paper says that with 28.5% of the computations DeepSeekMoE 145B achieves comparable performance: better on Pile loss, 1.876 against 1.905, and on knowledge such as TriviaQA, worse on MMLU, 39.4 against 45.1. The half-activated variant, 2 shared and 6 of 128 routed, uses 18.2% of the computation and still matches the dense model on much of the table, though MMLU falls to 37.5. The paper repeats the pattern from 16B: strong on language modelling and knowledge, weak on multiple choice. A short training run with a constant learning rate, so treat it as a first look (ours).

---

<p class="eyebrow"><span class="paper">DeepSeek-AI 2024</span> · §1 · Table 1</p>

## What did DeepSeek-V3 cost to train?

<div class="rows">
<table class="rules">
  <tr><td>training costs</td><td>pre-training</td><td>context extension</td><td>post-training</td><td>total</td></tr>
  <tr><td>H800 GPU hours</td><td>2664K</td><td>119K</td><td>5K</td><td>2788K</td></tr>
  <tr class="total"><td>USD</td><td>5.328M</td><td>0.238M</td><td>0.01M</td><td>5.576M</td></tr>
</table>
<p class="plain">14.8T tokens of pre-training at 180K GPU hours per trillion tokens; USD at a rental price of 2 USD per GPU hour.</p>
</div>

<p class="footnote">DeepSeek-AI 2024 (DeepSeek-V3), arXiv:2412.19437 · §1, Table 1. H800: an Nvidia datacentre GPU. Context extension: further training on longer inputs</p>

Note:
Now DeepSeek-V3, only its mixture-of-experts parts. The introduction's cost table. Pre-training took 2664K H800 GPU hours, context extension 119K and post-training 5K, 2788K in all, which is 5.576 million USD at an assumed 2 USD per GPU hour. The text gives 180K GPU hours per trillion tokens, which is 3.7 days on their cluster of 2048 GPUs, so pre-training finished in under two months. The paper says this is the result of co-design of algorithms, frameworks and hardware. Read it as a rental price for the official run, not a bill: the paper says the costs exclude prior research and ablation experiments on architectures, algorithms or data. The MoE choices in this section are part of that co-design.

---

<p class="eyebrow"><span class="paper">DeepSeek-AI 2024</span> · §2 · Fig. 2</p>

## Where do the experts sit in DeepSeek-V3?

<div class="rows">
<div class="fig"><img src="img/week-07-v3-fig2-arch.png" alt="DeepSeek-V3 Figure 2: a Transformer block with a DeepSeekMoE layer, shared experts 1 to N_s and routed experts 1 to N_r with a router and top-K_r choice, below a multi-head latent attention block"></div>
<p class="plain">Each feed-forward layer is a DeepSeekMoE layer: shared experts, plus routed experts chosen by a router.</p>
</div>

<p class="footnote">DeepSeek-AI 2024 · §2, Fig. 2. MLA (multi-head latent attention): its attention variant, not covered here</p>

Note:
Figure 2 is V3's architecture: a Transformer with multi-head latent attention, which compresses keys and values to shrink the cache, and DeepSeekMoE feed-forward layers. The expanded layer shows shared experts one to N_s on the left, always on, and routed experts one to N_r on the right, with a router that picks the top K_r. The paper says both were thoroughly validated in DeepSeek-V2, and that the exception is a new auxiliary-loss-free load balancing strategy. Counts from the text elsewhere: 61 layers, the first three dense, and in the others one shared and 256 routed experts with 8 routed used. The next slides give the equations and the new balancing.

---

<p class="eyebrow"><span class="paper">DeepSeek-AI 2024</span> · §2.1.2 · Eq. 12 to 15</p>

## What is the DeepSeekMoE layer in V3?

<div class="cols">
<div class="text">

<div class="eq">$$\begin{aligned} \mathbf{h}'_t &= \mathbf{u}_t + \sum_{i=1}^{N_s} \mathrm{FFN}^{(s)}_i(\mathbf{u}_t) + \sum_{i=1}^{N_r} g_{i,t}\,\mathrm{FFN}^{(r)}_i(\mathbf{u}_t) \\ g_{i,t} &= \frac{g'_{i,t}}{\sum_{j=1}^{N_r} g'_{j,t}} \\ g'_{i,t} &= \begin{cases} s_{i,t}, & s_{i,t} \in \mathrm{Topk}(\{s_{j,t} \mid 1 \le j \le N_r\}, K_r) \\ 0, & \text{otherwise} \end{cases} \\ s_{i,t} &= \mathrm{Sigmoid}(\mathbf{u}_t^{\top} \mathbf{e}_i) \end{aligned}$$</div>

</div>
<div class="text">

<dl class="where">
<dt>$\mathbf{u}_t$, $\mathbf{h}'_t$</dt><dd>layer input and output for token $t$</dd>
<dt>$N_s$, $N_r$, $K_r$</dt><dd>shared and routed experts, and routed used per token; $\mathrm{FFN}^{(s)}_i$, $\mathrm{FFN}^{(r)}_i$ are the $i$-th of each</dd>
<dt>$s_{i,t}$, $\mathbf{e}_i$</dt><dd>affinity, and the centroid vector of routed expert $i$</dd>
<dt>$g'_{i,t}$, $g_{i,t}$</dt><dd>gate before and after normalising the selected ones</dd>
</dl>

<p class="plain">Differs from DeepSeekMoE: sigmoid scores, normalised over the chosen experts.</p>

</div>
</div>

<p class="footnote">DeepSeek-AI 2024 · §2.1.2, Eq. 12 to 15. Sigmoid: squashes a score into 0 to 1; unlike softmax, the scores need not sum to 1</p>

Note:
The same structure as DeepSeekMoE: the input plus all shared experts plus the gated routed experts. The paper says compared with traditional designs, DeepSeekMoE uses finer-grained experts and isolates some as shared. The difference from the earlier paper is slight: V3 computes the affinity with a sigmoid rather than a softmax, and then normalises among the selected affinity scores to give the gating values, so the chosen ones sum to one. The paper states this is slightly different from DeepSeek-V2 and gives no reason or ablation for the sigmoid. All of its ablations keep it fixed, so it acts as a control, not a tested choice (ours).

---

<p class="eyebrow"><span class="paper">DeepSeek-AI 2024</span> · §2.1.2 · auxiliary-loss-free balancing</p>

## How can load be balanced without an auxiliary loss?

<div class="cols">
<div class="text">

<div class="eq">$$g'_{i,t} = \begin{cases} s_{i,t}, & s_{i,t} + b_i \in \mathrm{Topk}(\{s_{j,t} + b_j \mid 1 \le j \le N_r\}, K_r) \\ 0, & \text{otherwise} \end{cases}$$</div>

</div>
<div class="text">

<dl class="where">
<dt>$b_i$</dt><dd>a bias for routed expert $i$, used only to choose experts</dd>
<dt>$s_{i,t}$</dt><dd>the original affinity, still the value that multiplies the output</dd>
<dt>$g'_{i,t}$, $N_r$, $K_r$</dt><dd>gate before normalising; routed experts, and how many are used per token</dd>
</dl>

<p class="plain">After each step, lower $b_i$ by $\gamma$ if expert $i$ was overloaded, raise it by $\gamma$ if underloaded.</p>

</div>
</div>

<p class="footnote">DeepSeek-AI 2024 · §2.1.2, Eq. 16, and §4.2. $\gamma$ is the bias update speed: 0.001 for the first 14.3T tokens, then 0. Auxiliary loss: a penalty added to training that pushes load to be even</p>

Note:
Conventional solutions use an auxiliary loss to avoid unbalanced load, but the paper says too large an auxiliary loss impairs model performance. Instead, each routed expert gets a bias that is added to its affinity only when picking the top K_r. The bias is only used for routing: the gate value that multiplies the expert's output is still derived from the original affinity. During training, the load of each expert is monitored over the whole batch of each step, and at the end of the step the bias is decreased by gamma for an overloaded expert and increased by gamma for an underloaded one. Gamma, the bias update speed, is 0.001 for the first 14.3T tokens and 0 for the remaining 500B. The method is credited to a companion paper from the same group. The paper gives no threshold for overloaded (ours).

---

<p class="eyebrow"><span class="paper">DeepSeek-AI 2024</span> · §2.1.2 · Eq. 17 to 20</p>

## Is there still a balance loss?

<div class="rows">
<div class="eq">$$\begin{aligned} \mathcal{L}_{\mathrm{Bal}} &= \alpha \sum_{i=1}^{N_r} f_i P_i, \qquad f_i = \frac{N_r}{K_r T} \sum_{t=1}^{T} \mathbb{1}\big(s_{i,t} \in \mathrm{Topk}(\{s_{j,t} | 1 \leq j \leq N_r\}, K_r)\big), \\ s'_{i,t} &= \frac{s_{i,t}}{\sum_{j=1}^{N_r} s_{j,t}}, \qquad P_i = \frac{1}{T} \sum_{t=1}^{T} s'_{i,t} \end{aligned}$$</div>
<dl class="where">
<dt>$\alpha$</dt><dd>balance factor, 0.0001</dd>
<dt>$N_r$, $K_r$, $T$</dt><dd>routed experts, used per token, tokens in the sequence</dd>
<dt>$s_{i,t}$, $s'_{i,t}$</dt><dd>router score of expert $i$ for token $t$, and the scores normalised to sum to one</dd>
<dt>$f_i$, $P_i$</dt><dd>load fraction and mean normalised score of expert $i$</dd>
</dl>
<p class="plain">A tiny loss that balances inside each sequence.</p>
</div>

<p class="footnote">DeepSeek-AI 2024 · §2.1.2, Eq. 17 to 20, and §4.2. $\mathbb{1}(\cdot)$ is 1 if the statement is true and 0 otherwise</p>

Note:
V3 mainly relies on the bias, but adds a complementary sequence-wise balance loss to prevent extreme imbalance within any single sequence. It has the same form as the expert-level loss in DeepSeekMoE: load fraction times mean score, summed over the routed experts, but computed per sequence, with the scores normalised to sum to one. The paper says the balance factor alpha is an extremely small value, and in the hyper-parameters section it is 0.0001, just to avoid extreme imbalance within any single sequence. The earlier paper used 0.01, 0.001 and 0.003 for its expert-level factor, so this is 10 to 100 times smaller (ours). The contrast the paper draws later: this loss balances per sequence, while the bias balances over a whole batch.

--

<p class="eyebrow"><span class="paper">DeepSeek-AI 2024</span> · §2.1.2 · node-limited routing · optional</p>

## How is the communication kept cheap?

<div class="rows">
<div class="points">
<div class="text">

- **Node-limited routing**: each token goes to at most $M$ nodes, chosen by the sum of the highest $K_r / M$ affinities of the experts on each node. $M = 4$.
- Routed experts sit on 64 GPUs in 8 nodes. This gives nearly full overlap of computation and communication.

</div>
<div class="text">

- **No token dropping**, in training or in inference, because the load balance is good enough.

</div>
</div>
</div>

<p class="footnote">DeepSeek-AI 2024 · §2.1.2 and §4.2. Node: one server holding several GPUs. Token dropping: discarding tokens sent to an expert that is already full</p>

Note:
Two more MoE details from the architecture section. Like the device-limited routing in DeepSeek-V2, V3 limits communication cost in training: each token is sent to at most M nodes, chosen according to the sum of the highest K_r over M affinity scores of the experts on each node. With this constraint the training framework can nearly achieve full computation-communication overlap. In the hyper-parameters, the routed experts of each layer are spread uniformly over 64 GPUs on 8 nodes, and M is 4. And because the load balancing is effective, no tokens are dropped during training; the paper adds that specific deployment strategies keep inference balanced, so nothing is dropped there either.

---

<p class="eyebrow"><span class="paper">DeepSeek-AI 2024</span> · §4.5 · Table 5</p>

## Does the bias beat the auxiliary loss?

<div class="rows">
<div class="points">
<div class="text">

- Small: 15.7B on 1.33T tokens; large: 228.7B on 578B. Only the balancing differs.

</div>
<div class="text">

- Control: a batch-wise auxiliary loss ties the bias at 1B and 3B.

</div>
</div>

<table class="rules tight" style="font-size:14px">
  <tr><td>benchmark (metric)</td><td>small, aux loss</td><td>small, bias</td><td>large, aux loss</td><td>large, bias</td></tr>
  <tr><td>Pile-test (BPB)</td><td>0.727</td><td><b>0.724</b></td><td>0.656</td><td><b>0.652</b></td></tr>
  <tr><td>BBH (EM)</td><td>37.3</td><td><b>39.3</b></td><td>66.7</td><td><b>67.9</b></td></tr>
  <tr><td>MMLU (EM)</td><td>51.0</td><td><b>51.8</b></td><td><b>68.3</b></td><td>67.2</td></tr>
  <tr><td>DROP (F1)</td><td>38.1</td><td><b>39.0</b></td><td><b>67.1</b></td><td><b>67.1</b></td></tr>
  <tr><td>TriviaQA (EM)</td><td><b>58.3</b></td><td><b>58.5</b></td><td>66.7</td><td><b>67.7</b></td></tr>
  <tr><td>NaturalQuestions (EM)</td><td><b>23.2</b></td><td><b>23.4</b></td><td>27.1</td><td><b>28.1</b></td></tr>
  <tr><td>HumanEval (Pass@1)</td><td>22.0</td><td><b>22.6</b></td><td>40.2</td><td><b>46.3</b></td></tr>
  <tr><td>MBPP (Pass@1)</td><td><b>36.6</b></td><td>35.8</td><td>59.2</td><td><b>61.2</b></td></tr>
  <tr><td>GSM8K (EM)</td><td>27.1</td><td><b>29.6</b></td><td>70.7</td><td><b>74.5</b></td></tr>
  <tr class="total"><td>MATH (EM)</td><td><b>10.9</b></td><td><b>11.1</b></td><td>37.2</td><td><b>39.6</b></td></tr>
</table>
</div>

<p class="footnote">DeepSeek-AI 2024 · §4.5, Table 5 and the text after it. BBH: hard multi-step reasoning tasks. DROP: reading comprehension with arithmetic. MATH: competition maths. HumanEval, MBPP: Python problems</p>

Note:
The ablation validates the bias on two baselines that use only auxiliary losses and sigmoid gating with normalisation, with the same data and architecture, so only the balancing method changes. The paper's reading: the bias consistently achieves better performance on most benchmarks. The size of the effect (ours): Pile bits per byte improves by 0.003 and 0.004, while at the large size HumanEval gains 6.1 points and GSM8K 3.8, and MMLU loses 1.1. Single runs, no error bars. The text after the figure adds the control: a batch-wise auxiliary loss reaches the same validation loss as the bias, 2.253 at 1B and 2.080 at 3B, against 2.258 and 2.085 for the sequence-wise loss. So the gain is consistent with balancing over a batch rather than over each sequence (ours), shown only at two small sizes.

---

<p class="eyebrow"><span class="paper">DeepSeek-AI 2024</span> · §4.5 · Fig. 9</p>

## Do the experts specialise by domain?

<div class="cols wide-fig">
<div class="text">

- Relative expert load: actual load divided by the perfectly balanced load.
- Auxiliary-loss model: even on all three domains.
- Bias model: some experts run hot for one domain, many sit near zero.

</div>
<div class="fig"><img src="img/week-07-v3-fig9-load.png" alt="Heat maps of relative expert load for 64 experts on three Pile domains in layers 9 and 18, for an auxiliary-loss model (even, pale) and the auxiliary-loss-free model (a few hot columns per domain)"></div>
</div>

<p class="footnote">DeepSeek-AI 2024 · §4.5, Fig. 9 (two layers of 16B models, Pile test set). Wikipedia: encyclopedia text. GitHub: code. DM Mathematics: generated school maths questions. A picture, no number (ours)</p>

Note:
The paper's argument: batch-wise balancing is a more flexible constraint than per-sequence balancing, because it does not enforce balance within each sequence, so experts can specialise by domain. To test it, they record the load of a 16B auxiliary-loss model and a 16B bias model on three domains of the Pile test set. The relative expert load is the actual load over the balanced load. In the auxiliary-loss panels each domain uses the experts about evenly; in the bias panels the paper reports greater specialisation patterns, with hot columns for some domains. Caveats (ours): it is visual with no number, the comparison changes the method as well as the scope, and the domains also differ in token types, such as code and digits. The paper notes that batch-wise balance risks imbalance inside a sequence and under domain shift at inference, and answers with large batches and redundant experts when serving.


---


<p class="eyebrow"><span class="paper">Gemma 4 report</span> · §2 · Dense and MoE</p>

## What does the Gemma 4 report say about per-layer embeddings?

<div class="rows">
<div class="fig"><img src="img/week-07-gemma4-sec2-dense-moe.png" alt="The Dense and MoE paragraph of the Gemma 4 report: E2B and E4B use per-layer embeddings as in Gemma 3n, making them 2.3B and 4.5B effective out of 5B and 8B total parameters"></div>
<p class="plain">Two small models, 2.3B and 4.5B effective, stored as 5B and 8B in total.</p>
</div>

<p class="footnote">Gemma Team, "Gemma 4 Technical Report", arXiv:2607.02770, §2. <b>Effective</b> parameters: Google's term (Gemma 3n documentation) for the reduced set of parameters the model runs with in memory. The report has no figure of its own on this</p>

Note:
This is everything the Gemma 4 report says about per-layer embeddings in its text: one sentence. The small models, E2B and E4B, use per-layer embeddings as in Gemma 3n, which makes them 2.3 billion and 4.5 billion effective parameters out of 5 billion and 8 billion in total. The report does not explain the mechanism and has no figure for it; it points to the Gemma 3n release. The Gemma 3n documentation says the E prefix means the model can run with a reduced set of effective parameters, and that the per-layer embedding parameters can be generated outside the model's operating memory, cached in fast storage, and added as each layer runs. The documentation's stated purpose: keep them out of the model's memory space. (ours) It is not a mixture of experts: nothing is routed, a table is read by token. (ours) We found no comparison with and without the table in the report, the documentation or the blog, so the quality benefit is Google's claim here, not something we can check.

--

<p class="eyebrow"><span class="paper">Gemma 4 report</span> · Table 1 · optional</p>

## How many parameters sit in the per-layer tables?

<div class="rows">
<table class="rules tight" style="font-size:20px">
  <tr><td>Model</td><td>Audio encoder</td><td>Vision encoder</td><td>Embedder</td><td>Einsums</td><td>Drafter</td></tr>
  <tr><td><b>E2B</b></td><td>305M</td><td>150M</td><td>400M + 2,340M</td><td>1,870M</td><td>76M</td></tr>
  <tr><td><b>E4B</b></td><td>305M</td><td>150M</td><td>670M + 2,820M</td><td>3,940M</td><td>77M</td></tr>
</table>
<p class="plain">The extra embedder parameters in E2B and E4B are per-layer embeddings.</p>
</div>

<p class="footnote">Gemma 4 report, Table 1 (rows for E2B and E4B). The vocabulary has 262k entries. The report does not define "Einsums"; the drafter is a small helper model</p>

Note:
These are the E2B and E4B rows of the report's parameter table. The embedder column has two numbers: the first is the ordinary embedding, the second, the one the caption calls per-layer embeddings. For E2B that is 400 million plus 2,340 million, for E4B 670 million plus 2,820 million. (ours) Adding all columns except the drafter gives 5,065 million and 7,885 million, matching the stated 5B and 8B, so the per-layer tables are 46 percent and 36 percent of the total. (ours) Einsums plus the ordinary embedder gives 2,270 million for E2B, matching the stated 2.3B, but 4,610 million for E4B, which does not round to the stated 4.5B. The report does not define Einsums; we read it as the transformer matrices. (ours) The report's memory table also looks like it counts effective parameters only: 4.6 GB in 16-bit for E2B is 2.3 billion parameters.


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
  <tr><td>fine-grained plus shared beats a conventional top-2 MoE at matched size</td><td>DeepSeekMoE Table 1</td><td>holds at 2B, single runs</td></tr>
  <tr><td>bias balancing beats the auxiliary loss</td><td>V3 Table 5</td><td>holds in two ablations; a small control points to batch-wise scope</td></tr>
  <tr class="total"><td>PLE improves quality</td><td>Google</td><td>untested: no ablation in the sources</td></tr>
</table>

<p class="footnote">Mixtral: Jiang et al. 2024. DeepSeekMoE: Dai et al. 2024, Table 1. V3: DeepSeek-AI 2024, Table 5, Fig. 9. PLE: Gemma 3n documentation and developer blog. Verdicts are ours</p>

Note:
The verdicts in one table. Mixtral's headline, that 13B active parameters match a 70B dense model, holds on most of the benchmarks they ran (ahead on 9 of 12 in their main table, ours), but no matched dense run isolates the cause. Its claim that routing shows no topic experts is challenged by V3's Figure 9, which shows domain-hot experts, but with confounds (token types, method and scope changed together), so it is not settled. DeepSeekMoE's win over a conventional top-2 MoE of the same size holds at 2B and 100B tokens in single runs. V3's bias beats the auxiliary loss in two ablations, but a control shows a batch-wise auxiliary loss ties it at 1B and 3B, which points to the balancing scope. "PLE improves quality" is Google's claim with no ablation in any source we read, so it is open.

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
Four directions the readings point to. First, the week's opening question: does stored sparse capacity count like dense capacity? DeepSeekMoE answers at 2B and 100B tokens, and against a dense 7B on the same 2T tokens; Mixtral has no matched dense model. Second, why routers specialise: Mixtral saw syntax-like patterns, V3 saw domain-hot experts, and neither tests a cause. Third, granularity: only DeepSeekMoE varies it (16, 32 and 64 experts at 2B, in its ablation); Mixtral's 8 and V3's 257 are not ablated. Fourth, cost at batch size 1: with one request, few experts are used but all must be in memory, which is where per-layer embeddings, fetched by token id, offer a different trade.

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

