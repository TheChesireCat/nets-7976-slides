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
We walk the survey in its own order: the layer (§2), the taxonomy (§3), then gating functions (§4.1), experts (§4.2) and parameter-efficient experts (§4.3), ending on its open challenges (§7).

---

<p class="eyebrow"><span class="paper">Cai et al. 2024</span> · p. 1</p>

## What does this survey set out to do?

<div class="cols wide-fig">
<div class="text">

- A review of mixture of experts (MoE) in large language models. Its model tables run to December 2024.
- Its order: the MoE layer, a new taxonomy, the algorithm and system designs, applications, open directions.
- A survey runs no experiments: every number in this section is one it relays from the paper it cites.

</div>
<div class="fig"><img src="img/week-07-cai-p1.png" alt="Cai et al. 2024, page 1: title, the six authors, the abstract and the index terms"></div>
</div>

<p class="footnote">Cai, Jiang, Wang, Tang, Kim, Huang 2024, p. 1 (arXiv 2407.06204, latest version). MoE: mixture of experts</p>

Note:
The p. 1 slide. The abstract promises the layer, the taxonomy, the designs and a resource repository; we follow the algorithm part closely.

---

<p class="eyebrow"><span class="paper">Cai et al. 2024</span> · §2 · Fig. 2</p>

## What is a mixture-of-experts layer, and where does it sit?

<div class="cols wide-fig">
<div class="text">

- $N$ **expert networks** $f_1, \ldots, f_N$, each usually linear, ReLU, linear, with weights $\mathbf{W}_i$.
- A **gating network** $\mathcal{G}$ with weights $\mathbf{\Theta}$, usually linear plus softmax, sends each input to the experts.
- The layer replaces the feed-forward network (FFN) in each Transformer block, after self-attention.
- Why there: the FFN grows most costly with scale. In PaLM 540B, 90% of the parameters are in FFN layers.

</div>
<div class="fig"><img src="img/week-07-cai-fig2-layer.png" alt="Cai et al. Figure 2: four FFN experts and a gate; (a) dense, all four gate probabilities used; (b) sparse, only the top two used"></div>
</div>

<p class="footnote">Cai et al. 2024 · §2, Fig. 2. FFN: feed-forward network, the two-layer block in each Transformer layer. PaLM: Google's 540B dense model. ReLU: max(0, x)</p>

Note:
The gate decides; the experts compute. Panel a is dense, panel b sparse; the next two slides give each its equation.

---

<p class="eyebrow"><span class="paper">Cai et al. 2024</span> · §2.1 · Eq. 1, 2 · Fig. 2a</p>

## What does a dense mixture of experts compute?

<div class="eq">$$\begin{aligned}&\mathcal{F}_{\mathrm{dense}}^{\mathrm{MoE}}(\mathbf{x}; \mathbf{\Theta}, \{\mathbf{W}_i\}_{i=1}^{N}) = \sum_{i=1}^{N}\mathcal{G}(\mathbf{x}; \mathbf{\Theta})_i f_{i}(\mathbf{x}; \mathbf{W}_i),\\ &\mathcal{G}(\mathbf{x}; \mathbf{\Theta})_i = \operatorname{softmax}(g(\mathbf{x}; \mathbf{\Theta}))_i = \frac{\exp(g(\mathbf{x}; \mathbf{\Theta})_i)}{\sum_{j=1}^{N} \exp(g(\mathbf{x}; \mathbf{\Theta})_j)}\end{aligned}$$</div>

<div class="cols wide-text">
<div class="text">

<dl class="where">
<dt>$\mathbf{x}$</dt><dd>the input (one token's vector)</dd>
<dt>$f_i(\mathbf{x}; \mathbf{W}_i)$</dt><dd>the output of expert $i$, with weights $\mathbf{W}_i$; $N$ experts</dd>
<dt>$g(\mathbf{x}; \mathbf{\Theta})$</dt><dd>the gating value for each expert before the softmax; $\mathbf{\Theta}$ the gate's weights</dd>
<dt>$\mathcal{G}(\mathbf{x}; \mathbf{\Theta})_i$</dt><dd>the softmax weight on expert $i$; the weights sum to 1</dd>
</dl>

<p class="plain">Every expert runs on every input. Used by many early proposals; revisited by EvoMoE, MoLE, LoRAMoE and DS-MoE.</p>

</div>
<div class="fig"><img src="img/week-07-cai-fig2-dense.png" alt="Cai et al. Figure 2a: dense MoE, the gate gives p = 0.41, 0.19, 0.32, 0.08 to the four FFN experts and all four outputs are weighted and summed"></div>
</div>

<p class="footnote">Cai et al. 2024 · §2.1, Eq. 1, 2, Fig. 2a. In the figure the four weights 0.41, 0.19, 0.32, 0.08 sum to 1</p>

Note:
The output is a weighted sum of all N experts; the cost is N full feed-forward passes per token.

---

<p class="eyebrow"><span class="paper">Cai et al. 2024</span> · §2.2 · Eq. 3 to 5 · Fig. 2b</p>

## Why go sparse, and how does the gate keep only $k$ experts?

<div class="cols wide-text">
<div class="text">

<p class="plain">Dense usually gives higher accuracy but costs significantly more compute. Shazeer et al.'s sparsely gated layer sums only the top-$k$ experts' outputs:</p>

<div class="eq">$$\begin{aligned}&\mathcal{G}(\mathbf{x}; \mathbf{\Theta})_i = \operatorname{softmax}(\operatorname{TopK}(g(\mathbf{x}; \mathbf{\Theta}) + \mathcal{R}_{\mathrm{noise}}, k))_i,\\ &\operatorname{TopK}(g(\mathbf{x}; \mathbf{\Theta}), k)_i = \begin{cases} g(\mathbf{x}; \mathbf{\Theta})_i, &\text{condition}, \\ -\infty, &\text{otherwise}, \end{cases}\\ &\text{condition: if } g(\mathbf{x}; \mathbf{\Theta})_i \text{ is in the top-}k\text{ elements of } g(\mathbf{x}; \mathbf{\Theta})\end{aligned}$$</div>

<dl class="where">
<dt>$\operatorname{TopK}(\cdot, k)$</dt><dd>keeps the $k$ largest entries; the rest become $-\infty$, so their softmax weight is about 0</dd>
<dt>$\mathcal{R}_{\mathrm{noise}}$</dt><dd>added noise, to encourage exploration among experts and stabilise training</dd>
<dt>$k$</dt><dd>usually 1 (Switch Transformer) or 2 (GLaM, ST-MoE, DeepSpeed-MoE, Mixtral, Skywork-MoE)</dd>
</dl>

</div>
<div class="fig"><img src="img/week-07-cai-fig2-sparse.png" alt="Cai et al. Figure 2b: sparse MoE, only FFN2 and FFN3 are used, with p = 0.52 and 0.37"></div>
</div>

<p class="footnote">Cai et al. 2024 · §2.2, Eq. 3 to 5, Fig. 2b. Switch Transformer, GLaM, ST-MoE: Google sparse models; DeepSpeed-MoE: Microsoft's; Skywork-MoE: a 146B model from Kunlun</p>

Note:
Two changes from Eq. 2: TopK before the softmax, and noise. Only the kept experts need to be computed.

---

<p class="eyebrow"><span class="paper">Cai et al. 2024</span> · §2.2 · Fig. 2b</p>

## Why does a sparse layer need a load-balancing loss?

<div class="cols wide-text">
<div class="text">

- The sparse gate adds many parameters without a matching rise in compute.
- But it can cause a **load-balancing issue**: work spreads unevenly, some experts used often, others seldom.
- The fix: each MoE layer adds an **auxiliary loss** to the training loss that pushes the batch's tokens to spread evenly across experts.
- Setup: a batch $\mathcal{B} = \lbrace\mathbf{x}_1, \ldots, \mathbf{x}_T\rbrace$ of $T$ tokens, and $N$ experts indexed $i = 1, \ldots, N$.

</div>
<div class="fig"><img src="img/week-07-cai-fig2-sparse.png" alt="Cai et al. Figure 2b again: FFN1 and FFN4 receive no weight for this input"></div>
</div>

<p class="plain">In Fig. 2b, FFN1 and FFN4 do nothing for this input. If that holds for most tokens, they barely train (ours).</p>

<p class="footnote">Cai et al. 2024 · §2.2. Auxiliary loss: an extra term added to the language-modelling loss with a small weight</p>

Note:
The survey's own motivation for the loss, before its formula on the next slide.

---

<p class="eyebrow"><span class="paper">Cai et al. 2024</span> · §2.2 · Eq. 6 to 8</p>

## What does the load-balancing loss measure?

<div class="rows">
<div class="eq">$$\begin{aligned}&\mathcal{L}_{\operatorname{load-balancing}} = N\sum_{i=1}^{N}\mathcal{D}_i\mathcal{P}_i,\\ &\mathcal{D}_i = \frac{1}{T}\sum_{x \in \mathcal{B}}\mathbb{1}\{\operatorname{argmax} \mathcal{G}(\mathbf{x}; \mathbf{\Theta}) = i\},\qquad \mathcal{P}_i = \frac{1}{T}\sum_{x \in \mathcal{B}} \mathcal{G}(\mathbf{x}; \mathbf{\Theta})_i\end{aligned}$$</div>
<dl class="where">
<dt>$\mathcal{D}_i$</dt><dd>the share of the batch's tokens dispatched to expert $i$: tokens whose largest gate weight is on $i$, divided by $T$</dd>
<dt>$\mathcal{P}_i$</dt><dd>the share of gating probability given to expert $i$: its gate weight averaged over the batch</dd>
<dt>$\mathbb{1}\{\cdot\}$</dt><dd>1 if the condition holds, else 0</dd>
<dt>$N$, $T$, $\mathcal{B}$</dt><dd>experts, tokens in the batch, the batch</dd>
</dl>
<p class="plain">Balanced optimum: $\mathcal{D}_i = \mathcal{P}_i = \frac{1}{N}$ for every expert gives $N\sum_{i=1}^{N}\frac{1}{N}\frac{1}{N} = 1$.</p>
<p class="plain">(ours) $\mathcal{D}_i$ is a count, so the gradient reaches the gate only through $\mathcal{P}_i$.</p>
</div>

<p class="footnote">Cai et al. 2024 · §2.2, Eq. 6 to 8. From here on the survey's "MoE" means sparse MoE</p>

Note:
An expert that gets many tokens and high probability makes the product large; the loss pushes both shares toward 1 over N.

---

<p class="eyebrow"><span class="paper">Cai et al. 2024</span> · §3 · Fig. 3 (gating branch)</p>

## How does the survey's taxonomy sort gating functions?

<div class="rows">
<div class="fig"><img src="img/week-07-cai-fig3-gating.png" alt="Cai et al. Figure 3, Gating Function branch: Dense; Sparse, split into Token-Choice, Non-trainable Token-Choice and Expert-Choice; Soft, split into Token Merging and Expert Merging; each leaf lists the papers"></div>
<p class="plain">The taxonomy has three views: algorithm, system, application. We read the algorithm view's gating and experts branches (§4.1 to §4.3).</p>
</div>

<p class="footnote">Cai et al. 2024 · §3, Fig. 3, Gating Function branch only. Numbers in boxes are the survey's reference numbers</p>

Note:
Dense, sparse with its three kinds, and soft with its two kinds; each gets a slide in §4.1.

---

<p class="eyebrow"><span class="paper">Cai et al. 2024</span> · §3 · Fig. 3 (experts branch, part 1)</p>

## And how does it sort the experts themselves?

<div class="rows">
<div class="fig"><img src="img/week-07-cai-fig3-experts-top.png" alt="Cai et al. Figure 3, Experts branch, first part: Network Types (FFN, Attention, Others), Hyperparameters (Count, Size, Frequency) and Activation Function, each leaf listing the papers"></div>
<p class="plain">Network types and activation functions come in §4.2; we skip the hyperparameters leaf.</p>
</div>

<p class="footnote">Cai et al. 2024 · §3, Fig. 3, Experts branch, upper part. FFN: feed-forward network</p>

Note:
These leaves map onto §4.2.

---

<p class="eyebrow"><span class="paper">Cai et al. 2024</span> · §3 · Fig. 3 (experts branch, part 2)</p>

## Where do shared experts and adapter experts sit in the map?

<div class="rows">
<div class="fig"><img src="img/week-07-cai-fig3-experts-bottom.png" alt="Cai et al. Figure 3, Experts branch, second part: Shared Expert, and PEFT experts by placement (FFN, Attention, Transformer Block, Every Layer), each leaf listing the papers"></div>
<p class="plain">Shared experts close §4.2; the four PEFT placements are §4.3, one slide each.</p>
</div>

<p class="footnote">Cai et al. 2024 · §3, Fig. 3, Experts branch, lower part. PEFT: parameter-efficient fine-tuning, training only a few added weights</p>

Note:
These leaves map onto §4.2.4 and §4.3.

---

<p class="eyebrow"><span class="paper">Cai et al. 2024</span> · §4.1, §4.1.1 · Fig. 4a</p>

## What is token-choice gating?

<div class="cols wide-text">
<div class="text">

- The gate (router) decides which experts compute and how their outputs combine. Three kinds: **sparse** (a subset), **dense** (all), **soft** (merge tokens or experts).
- Sparse: Shazeer et al. weight each expert's output by its selection probability, so gradients reach the gate. This became the predominant paradigm.
- Each token chooses its experts, so it is called **token choice**.
- (a) Switch Transformer: top-1. Each token ($X_1$ green, $X_2$ orange) goes to one FFN.

</div>
<div class="fig"><img src="img/week-07-cai-fig4-a.png" alt="Cai et al. Figure 4a: sparse MoE with top-1 gating; token X1 goes to FFN2 with p = 0.58, token X2 to FFN4 with p = 0.76"></div>
</div>

<p class="footnote">Cai et al. 2024 · §4.1, §4.1.1, Fig. 4a. Router: another name for the gating function</p>

Note:
In panel a each token's bar chart is its gate distribution; it goes only to its tallest bar.

---

<p class="eyebrow"><span class="paper">Cai et al. 2024</span> · §4.1.1 · token choice</p>

## How many experts should each token choose?

<div class="rows">

- Shazeer et al.: top-$k$ with $k > 1$, so the network can weigh several experts' contributions. For thousands of experts, a two-level hierarchy.
- The survey: later work "largely affirmed" that larger $k$ helps. But Switch Transformer showed top-1 is also competitive.
- M6-t's **expert prototyping**: split the experts into $k$ groups and take top-1 in each. Ranking on a 16-layer model:

<table class="rules" style="font-size:20px">
  <tr><td>rank</td><td>gating</td></tr>
  <tr><td>1 (best)</td><td>expert prototyping: 4 groups, top-1 in each</td></tr>
  <tr><td>2</td><td>one gate, top-4</td></tr>
  <tr><td>3</td><td>one gate, top-16</td></tr>
  <tr><td>4</td><td>one gate, top-1</td></tr>
</table>

</div>

<p class="footnote">Cai et al. 2024 · §4.1.1. Ranked by training and downstream perplexity, best to worst. Perplexity: how surprised the model is by the text, lower is better. Top-4 beating top-16 is not "larger k is better" (ours)</p>

Note:
The survey relays the ranking with no numbers.

---

<p class="eyebrow"><span class="paper">Cai et al. 2024</span> · §4.1.1 · Table 1</p>

## Which auxiliary losses do token-choice models use?

<div class="rows">
<table class="rules" style="font-size:19px">
  <tr><td>reference</td><td>auxiliary loss</td><td>coefficient</td></tr>
  <tr><td><b>Shazeer et al.</b>, <u>V-MoE</u></td><td>$L_{importance}+L_{load}$</td><td>$w_{importance}=0.1$, $w_{load}=0.1$</td></tr>
  <tr><td><b>Switch-T</b>, GLaM, Mixtral-8x7B, DBRX, Jamba, <u>DeepSeekMoE</u>, <u>DeepSeek-V2</u>, <u>Skywork-MoE</u></td><td>$L_{aux}$</td><td>$w_{aux}=0.01$</td></tr>
  <tr><td><b>ST-MoE</b>, OpenMoE, MoA, JetMoE</td><td>$L_{aux}+L_{z}$</td><td>$w_{aux}=0.01$, $w_{z}=0.001$</td></tr>
  <tr><td><b>Mod-Squad</b>, <u>Moduleformer</u>, <u>DS-MoE</u></td><td>$L_{MI}$</td><td>$w_{MI}=0.001$</td></tr>
</table>
<p class="plain">Bold: introduced the loss. Underlined: modified it. Each loss is added to the training loss times its weight $w$; the next four slides take them one at a time.</p>
</div>

<p class="footnote">Cai et al. 2024 · Table 1 (first column shortened). Switch-T: Switch Transformer; V-MoE: vision MoE; MoA: mixture of attention heads; Mod-Squad: a multi-task vision MoE</p>

Note:
Four families of loss with their typical weights.

---

<p class="eyebrow"><span class="paper">Cai et al. 2024</span> · §4.1.1 · Eq. 9, 10</p>

## What do $L_{importance}$ and $L_{load}$ measure?

<div class="rows">
<div class="eq">$$\operatorname{Importance}(\mathcal{B}) = \sum_{x \in \mathcal{B}} \mathcal{G}(\mathbf{x}; \mathbf{\Theta}), \qquad \mathcal{L}_{\mathrm{importance}} = \operatorname{CV}(\operatorname{Importance}(\mathcal{B}))^2$$</div>
<dl class="where">
<dt>$\operatorname{Importance}(\mathcal{B})$</dt><dd>for each expert, its gate values summed over the batch: one number per expert</dd>
<dt>$\operatorname{CV}$</dt><dd>coefficient of variation of those $N$ numbers: standard deviation divided by mean; 0 when all are equal</dd>
</dl>

- $L_{importance}$ (Shazeer et al.) pushes all experts to equal importance, weight $w_{importance} = 0.1$.
- Equal importance does not mean an equal number of examples per expert, which wastes time on distributed hardware.
- So $L_{load}$: a smooth estimate of how many examples each expert gets, smooth so that gradients flow. Weight 0.1.

</div>

<p class="footnote">Cai et al. 2024 · §4.1.1, Eq. 9, 10. The survey gives no formula for $L_{load}$; it is in Shazeer et al. 2017</p>

Note:
Importance is about probability mass; load is about counts. The next loss folds both into one product.

---

<p class="eyebrow"><span class="paper">Cai et al. 2024</span> · §4.1.1 · Eq. 6</p>

## What is $L_{aux}$, and why did it win?

<div class="rows">
<div class="eq">$$\mathcal{L}_{\mathrm{aux}} = \mathcal{L}_{\operatorname{load-balancing}} = N\sum_{i=1}^{N}\mathcal{D}_i\mathcal{P}_i$$</div>
<dl class="where">
<dt>$\mathcal{D}_i$, $\mathcal{P}_i$</dt><dd>share of tokens and share of gate probability for expert $i$ (Eq. 7, 8)</dd>
</dl>

- A simpler, differentiable replacement for importance plus load: the dot product of mean gating decisions and mean gates per expert. The survey says it is the same as Eq. 6.
- Used by Switch Transformer, GLaM, Mixtral, DBRX and Jamba; modified by DeepSeekMoE, DeepSeek-V2 and Skywork-MoE. Weight 0.01.
- The survey: still "the predominant choice in industry".

</div>

<p class="footnote">Cai et al. 2024 · §4.1.1, Table 1. (ours) 0.01 is typical, not universal: DeepSeekMoE's own paper uses 0.001 at 16B</p>

Note:
One product per expert replaces two losses.

---

<p class="eyebrow"><span class="paper">Cai et al. 2024</span> · §4.1.1 · Eq. 11</p>

## What does the router z-loss add?

<div class="rows">
<div class="eq">$$\mathcal{L}_{z} = \frac{1}{T}\sum_{x \in \mathcal{B}} \Big(\log \sum_{i=1}^{N} e^{x_i}\Big)^2$$</div>
<dl class="where">
<dt>$x$, $\mathcal{B}$, $T$</dt><dd>a token, the batch, the number of tokens in it</dd>
<dt>$x_i$</dt><dd>the gate's raw score (logit) for expert $i$; the survey reuses the letter $x$ (reading ours)</dd>
</dl>

- ST-MoE found $L_{aux}$ alone gave unreliable training at larger scales.
- $L_z$ penalises large logits entering the gate. Smaller values mean smaller round-off errors, which matter in exponentials such as the gate's softmax.
- Used with $L_{aux}$: $w_{aux} = 0.01$, $w_z = 0.001$ (ST-MoE, OpenMoE, MoA, JetMoE).

</div>

<p class="footnote">Cai et al. 2024 · §4.1.1, Eq. 11. ST-MoE: Google's stable sparse MoE. Round-off: rounding error in floating-point arithmetic</p>

Note:
The log-sum-exp is large when any logit is large; squaring and averaging penalises that.

---

<p class="eyebrow"><span class="paper">Cai et al. 2024</span> · §4.1.1 · $L_{MI}$</p>

## Why would a multi-task model drop the balance loss?

<div class="rows">

- Mod-Squad: forcing balance can make experts set parameters for **conflicting tasks**, and can block the gain from sharing parameters across **complementary tasks**.
- Instead, maximise the **mutual information** between experts and tasks, so each task lines up with its own experts: $L_{MI}$, weight 0.001.
- ModuleFormer: mutual information between experts and **tokens** instead of tasks.
- DS-MoE: uses $L_{MI}$ in both attention and FFN MoE modules, with the weight $w_{MI}$ tuned per model size.

</div>

<p class="footnote">Cai et al. 2024 · §4.1.1. Mutual information: how much knowing one variable (the task) tells you about another (the expert chosen). The survey gives no formula for $L_{MI}$</p>

Note:
The opposite goal from balance: specialise experts to tasks on purpose.

---

<p class="eyebrow"><span class="paper">Cai et al. 2024</span> · §4.1.1 · expert capacity</p>

## What happens when an expert is full?

<div class="rows">

- Used alongside the auxiliary loss: an **expert capacity**, a limit on how many tokens an expert processes per batch. Excess tokens **overflow** and are not processed by that expert.
- Batch Prioritized Routing (vision, then language): give priority by gate score, not by position in the sequence. Kim et al.: randomise priority, to avoid a bias toward early tokens.
- OpenMoE's three findings. **Drop-towards-the-End**: later tokens are dropped more, worse on instruction-tuning data. **Context-independent Specialization**: routing follows token identity. **Early Routing Learning**: that routing is fixed early in pretraining.

</div>

<p class="footnote">Cai et al. 2024 · §4.1.1. OpenMoE: an open MoE model family. Instruction tuning: fine-tuning on instruction and answer pairs</p>

Note:
Capacity keeps devices in step; the price is dropped tokens.

---

<p class="eyebrow"><span class="paper">Cai et al. 2024</span> · §4.1.1 · Fig. 4b</p>

## What if token-to-expert assignment is solved exactly?

<div class="cols wide-text">
<div class="text">

- Load imbalance persists despite gating heuristics and balance losses.
- (b) **BASE layers** (Lewis et al.): a **linear assignment problem**. Maximise the total token-to-expert affinity, subject to every expert getting the same number of tokens.
- S-BASE (Clark et al.): the same idea solved with **optimal transport**.
- Clark et al. also train a top-1 gate by reinforcement learning, with reward the negative cross-entropy of the predicted token.

</div>
<div class="fig"><img src="img/week-07-cai-fig4-b.png" alt="Cai et al. Figure 4b: BASE layers, a Solve Linear Assignment box takes the token-expert scores and sends X1 to FFN2 and X2 to FFN4"></div>
</div>

<p class="footnote">Cai et al. 2024 · §4.1.1, Fig. 4b. BASE: Balanced Assignment of Sparse Experts. Optimal transport: moving one distribution onto another at least total cost</p>

Note:
Balance is enforced by construction, not encouraged by a loss.

---

<p class="eyebrow"><span class="paper">Cai et al. 2024</span> · §4.1.1 · other token-choice advances</p>

## What other fixes to token choice does the survey list?

<div class="rows">
<table class="rules tight" style="font-size:18px">
  <tr><td>method</td><td>problem it names</td><td>fix</td></tr>
  <tr><td>DSelect-k</td><td>discrete top-$k$ hurts gradient training</td><td>a smooth version of top-$k$</td></tr>
  <tr><td>Kudugunta et al.</td><td>gating each token separately</td><td>route a sentence: the mean of its tokens</td></tr>
  <tr><td>X-MoE (Chi et al.)</td><td>representations collapse around expert centroids</td><td>project to low dimension, L2-normalise, score on a hypersphere</td></tr>
  <tr><td>Cai et al. (Flextron)</td><td>router gradients vanish</td><td>a frozen surrogate model predicts the loss from router choices</td></tr>
  <tr><td>Skywork-MoE</td><td>diversify the experts; tune balance per layer</td><td>gating logit normalisation; layer-specific auxiliary loss weights</td></tr>
  <tr><td>AdaMoE</td><td>tokens need different numbers of experts</td><td>add null experts and raise $k$</td></tr>
  <tr><td>DYNMoE</td><td>same</td><td>trainable per-expert thresholds; add or remove experts</td></tr>
  <tr><td>SCMoE</td><td>unchosen experts go unused</td><td>at inference, contrast different gating strategies, no training</td></tr>
</table>
</div>

<p class="footnote">Cai et al. 2024 · §4.1.1, in the survey's order. L2-normalise: scale a vector to length 1. Null expert: an expert that outputs nothing</p>

Note:
The survey's catalogue; one line each, with the problem each paper names.

---

<p class="eyebrow"><span class="paper">Cai et al. 2024</span> · §4.1.1 · Fig. 4e</p>

## What is an attention router?

<div class="cols wide-text">
<div class="text">

- (e) Yuan 2.0-M32 replaces the linear gate with an **Attention Router**.
- The survey: it selects experts more efficiently and gives higher accuracy than a classical linear router.
- In the figure (reading ours): the input passes through three linear maps $W$, $W'$, $W''$, which are combined attention-style into the experts' scores.

</div>
<div class="fig"><img src="img/week-07-cai-fig4-e.png" alt="Cai et al. Figure 4e: attention router, the input X goes through three projections W, W' and W'' whose outputs are combined into a score matrix and then a distribution over FFN1 to FFN4"></div>
</div>

<p class="footnote">Cai et al. 2024 · §4.1.1, Fig. 4e. Yuan 2.0-M32: a 40B MoE with 32 experts from IEIT</p>

Note:
The survey gives no numbers for this router.

---

<p class="eyebrow"><span class="paper">Cai et al. 2024</span> · §4.1.1 · Fig. 4c</p>

## Can the gate be fixed instead of trained?

<div class="cols wide-text">
<div class="text">

- **Non-trainable token choice**: no gate parameters, and full balance by the routing rule itself.
- Hash Layer: hash the token; competitive with no trained gate. THOR: two random experts per input, plus a consistency loss.
- DEMix: one expert per pretraining domain; M2M-100: one sublayer per language.
- (c) PanGu-$\Sigma$: route to a **domain's** expert group, then pick **at random** inside it.

</div>
<div class="fig"><img src="img/week-07-cai-fig4-c.png" alt="Cai et al. Figure 4c: domain mapping plus random gating; X1 from domain 1 goes to the FFN1, FFN2 group and X2 from domain 2 to the FFN3, FFN4 group, with a random choice inside each"></div>
</div>

<p class="footnote">Cai et al. 2024 · §4.1.1, Fig. 4c. Hash: a fixed function from a token to an expert number. PanGu-$\Sigma$: Huawei's 1.1T sparse model</p>

Note:
In panel c the dashed boxes are the domain groups; "Random" picks inside each.

--

<p class="eyebrow"><span class="paper">Cai et al. 2024</span> · §4.1.1 · trainable alternatives · optional</p>

## Which trainable gates does the survey set against the fixed ones?

<div class="rows">

- NLLB: a trained gate for multilingual translation, beating M2M-100's fixed language routing.
- Conditional MoE (Zhu et al.): a trained gate given extra information: token, context, modality, task, token attributes.
- StableMoE: routing **fluctuates** during training. Stage 1 learns a balanced gate and distils it into a light gate; stage 2 freezes that gate.

</div>

<p class="footnote">Cai et al. 2024 · §4.1.1. NLLB: No Language Left Behind, Meta's 200-language translation model. Distil: train a small model to copy a larger one</p>

Note:
The survey's paragraph that follows PanGu.

---

<p class="eyebrow"><span class="paper">Cai et al. 2024</span> · §4.1.1 · Fig. 4d</p>

## What if each expert chooses its tokens?

<div class="cols wide-text">
<div class="text">

- (d) **Expert choice** (Zhou et al.): each expert picks its top-$k$ tokens.
- Load is even by construction, so no auxiliary balance loss is needed.
- But coverage is uneven: a token may get several experts, or none.
- Strong results, and the model can spend more computation on some tokens. Komatsuzaki et al. use it in the T5 encoder but keep token choice in the decoder.

</div>
<div class="fig"><img src="img/week-07-cai-fig4-d.png" alt="Cai et al. Figure 4d: expert-choice gating, each of the four FFN experts has its own gate over the tokens X1 and X2 and picks which to process"></div>
</div>

<p class="footnote">Cai et al. 2024 · §4.1.1, Fig. 4d. T5: Google's encoder-decoder Transformer. (ours) An expert compares tokens in a batch, including later ones a decoder cannot see</p>

Note:
In panel d each FFN has its own gate with a bar per token; the direction of choice is reversed.

---

<p class="eyebrow"><span class="paper">Cai et al. 2024</span> · §4.1.2 · Fig. 2a</p>

## When is it worth running every expert?

<div class="cols wide-text">
<div class="text">

- Against a dense MoE with the same total parameters, sparse activation saves compute at the cost of some performance (DeepSeekMoE, DS-MoE, ModuleFormer).
- Dense works well for **LoRA-MoE fine-tuning**: each LoRA expert is cheap, so running all of them costs little.
- It keeps the pretrained model's generative ability and each task's LoRA character (MoLE, LoRAMoE).
- Dense also seeds the dense-to-sparse training schemes (§4.4).

</div>
<div class="fig"><img src="img/week-07-cai-fig2-dense.png" alt="Cai et al. Figure 2a again: dense MoE, all four experts weighted and summed"></div>
</div>

<p class="footnote">Cai et al. 2024 · §4.1.2. LoRA: low-rank adaptation, a small added update to frozen weights (§4.3)</p>

Note:
Dense returns where the experts are small adapters.

---

<p class="eyebrow"><span class="paper">Cai et al. 2024</span> · §4.1.3 · token merging</p>

## What is soft gating, and how does token merging work?

<div class="rows">

- The discrete choice is the core difficulty of sparse MoE: it needs heuristic balance losses and leaves tokens unassigned, worse on small inference batches, new inputs or transfer.
- **Soft** gating uses all experts and stays fully differentiable, like dense, but saves compute by **merging** tokens or experts with the gate weights.
- **Token merging** (Soft MoE, Puigcerver et al.): form several weighted averages of all tokens, weights depending on tokens and experts; each expert processes its average.
- In image classification: more stable gate training, and balanced by construction. HOMOE follows it. The catch: an auto-regressive decoder cannot average over future tokens.

</div>

<p class="footnote">Cai et al. 2024 · §4.1.3. Auto-regressive: generates one token at a time from the ones before it. HOMOE: Soft MoE with a Hopfield network, for compositional zero-shot learning</p>

Note:
No panel of Fig. 4 shows token merging; expert merging is panel f, next.

---

<p class="eyebrow"><span class="paper">Cai et al. 2024</span> · §4.1.3 · Fig. 4f</p>

## What if the experts are merged instead of the tokens?

<div class="cols wide-text">
<div class="text">

- (f) **SMEAR**: average all experts' **parameters**, weighted by the gate, and run the input through one merged expert.
- Its reason: sparse MoEs often fall short of parameter-matched dense models, perhaps because gradients through discrete gates are estimated badly.
- Little extra compute and plain gradient training. On ResNet-DomainNet, 1.5% higher average accuracy than Soft MoE with one slot per expert, for about 10% less throughput.
- **Lory** scales it to language-model pretraining: merge per segment, causally. Versus parameter-matched dense: 13.9% better perplexity, 1.5% to 11.1% on downstream tasks.

</div>
<div class="fig"><img src="img/week-07-cai-fig4-f.png" alt="Cai et al. Figure 4f: soft MoE with expert merging, the gate weights 0.41, 0.19, 0.32, 0.08 combine the four FFNs into one Merged FFN that processes X"></div>
</div>

<p class="footnote">Cai et al. 2024 · §4.1.3, Fig. 4f. SMEAR: Soft Merging of Experts with Adaptive Routing. DomainNet: images in six styles; ResNet: a convolutional image network. Throughput: inputs per second</p>

Note:
Compare panel f with Fig. 2a: same weights, but here the weights mix parameters, not outputs.

--

<p class="eyebrow"><span class="paper">Cai et al. 2024</span> · §4.1.3 · expert merging with adapters · optional</p>

## Does expert merging help adapter experts too?

<div class="rows">

- MoV (Zadouri et al.): soft merging of 10 (IA)$^3$ vector experts beats top-1 and top-2 sparse gating when fine-tuning T5.
- Omni-SMoLA: soft mixing of multimodal low-rank experts, better across vision-language tasks.
- MEO: merge the selected experts into one to cut expert compute, choosing experts per sequence.

</div>

<p class="footnote">Cai et al. 2024 · §4.1.3. (IA)$^3$: a PEFT method that learns vectors rescaling activations. MEO: Merging Experts into One</p>

Note:
The last paragraph of §4.1.3.

---

<p class="eyebrow"><span class="paper">Cai et al. 2024</span> · §4.2.1 · network types</p>

## Why are experts almost always feed-forward networks?

<div class="rows">

- Since the first Transformer MoEs, the experts replace the FFN, and each copies the FFN's architecture.
- The hypothesis: self-attention layers are less sparse and less domain-specific than FFN layers.
- DS-MoE's evidence: on Wikitext, 20% of experts active in FFN layers against 80% in self-attention.
- Earlier work: most inputs activate only a small share of an FFN's neurons. Emergent Modularity: neuron activation tracks specific tasks, which supports the idea that MoE structure reflects the modularity of pretrained Transformers.

</div>

<p class="footnote">Cai et al. 2024 · §4.2.1. Wikitext: Wikipedia articles used to test language models. Other expert types: convolutional networks (pMoE, ADVMOE) and PEFT experts (§4.3)</p>

Note:
The FFN leaf of the taxonomy.

---

<p class="eyebrow"><span class="paper">Cai et al. 2024</span> · §4.2.1 · Fig. 5a</p>

## Can attention heads be experts?

<div class="cols wide-fig">
<div class="text">

- (a) **Mixture of Attention Heads** (MoA, Zhang et al.): two expert sets, for the query projection and the output projection. One gate picks the same indices in both.
- Key and value weights $W_k$, $W_v$ are **shared**, so $KW_k$ and $VW_v$ are computed once.
- Experts differ only in $q_t W_i^q$ and $o_{i,t} W_i^o$.
- Followed by DS-MoE, JetMoE and ModuleFormer.

</div>
<div class="fig"><img src="img/week-07-cai-fig5-a.png" alt="Cai et al. Figure 5a: MoA, a gate on the query picks query projections Q1 and Q4 and matching output projections O1 and O4, with shared Linear K and Linear V feeding both attention heads"></div>
</div>

<p class="footnote">Cai et al. 2024 · §4.2.1, Fig. 5a. $q_t$: the query for token $t$; $o_{i,t}$: head $i$'s output for token $t$; $W_i^q$, $W_i^o$: expert $i$'s projections</p>

Note:
In panel a only heads 1 and 2 are active; Linear K and Linear V serve both.

---

<p class="eyebrow"><span class="paper">Cai et al. 2024</span> · §4.2.3, §4.2.4 · Fig. 5b</p>

## What do experts copy from dense models, and what is a shared expert?

<div class="cols wide-text">
<div class="text">

- Activation: like dense models, from ReLU to GeLU, GeGLU and SwiGLU; also RMSNorm, GQA and RoPE.
- (b) **Shared expert**: DeepSpeed-MoE's Residual-MoE sends every token through one fixed FFN plus one gated expert: two experts at top-1 communication cost. The gated one acts as an error-correcting add-on.
- Adopted by DeepSeekMoE, OpenMoE, Qwen1.5-MoE, MoCLE: "a mainstream configuration". DeepSeekMoE and Qwen1.5-MoE use several shared experts.

</div>
<div class="fig"><img src="img/week-07-cai-fig5-b.png" alt="Cai et al. Figure 5b: shared expert, tokens X1 and X2 both go through the Shared FFN, and each also through one gated FFN, FFN1 for X1 and FFN3 for X2"></div>
</div>

<p class="footnote">Cai et al. 2024 · §4.2.3, §4.2.4, Fig. 5b. GeGLU, SwiGLU: gated activations; RMSNorm: a layer normalisation; GQA: grouped-query attention; RoPE: rotary position embeddings</p>

Note:
Shared experts return in the DeepSeek reading.

---

<p class="eyebrow"><span class="paper">Cai et al. 2024</span> · §4.3 · Fig. 6</p>

## Can the experts be small adapters instead?

<div class="cols wide-fig">
<div class="text">

- Full fine-tuning updates every weight: costly. **PEFT** updates a small set and leaves the base model untouched. **LoRA** adds two low-rank matrices that take the update.
- But PEFT struggles across several tasks and can forget.
- **MoPE**: an MoE gate over experts that are each built with PEFT. Fig. 6 sorts them by placement.

</div>
<div class="fig"><img src="img/week-07-cai-fig6-mope.png" alt="Cai et al. Figure 6: PEFT experts placed in (a) attention, (b) the FFN, (c) the whole Transformer block, (d) every layer"></div>
</div>

<p class="footnote">Cai et al. 2024 · §4.3, Fig. 6. PEFT: parameter-efficient fine-tuning; LoRA: low-rank adaptation; MoPE: mixture of parameter-efficient experts. The hourglass icons are PEFT experts</p>

Note:
The next four slides take the panels in the survey's text order: b, a, c, d.

---

<p class="eyebrow"><span class="paper">Cai et al. 2024</span> · §4.3.1 · Eq. 12, 13 · Fig. 6b</p>

## What does a PEFT expert in the FFN compute?

<div class="eq">$$\begin{aligned}&\operatorname{FFN}^{MoE}(\mathbf{x}^\prime) = \operatorname{FFN}(\mathbf{x}^\prime) + \sum_{i=1}^n \mathbf{x}^\prime \Delta \mathbf{W}_i^{ffn} \cdot G^{ffn}(\mathbf{x}^\prime)_i,\\ &\mathbf{x}^\prime = \operatorname{LayerNorm}(\operatorname{SA}(\mathbf{x}) + \mathbf{x})\end{aligned}$$</div>

<div class="cols wide-text">
<div class="text">

<dl class="where">
<dt>$\operatorname{FFN}$, $\operatorname{SA}$</dt><dd>the frozen pretrained feed-forward and self-attention layers</dd>
<dt>$\mathbf{x}^\prime$</dt><dd>the input to the FFN, after attention, residual and LayerNorm</dd>
<dt>$\Delta \mathbf{W}_i^{ffn}$</dt><dd>PEFT expert $i$'s weight update; $n$ experts</dd>
<dt>$G^{ffn}(\mathbf{x}^\prime)_i$</dt><dd>the gate's weight on expert $i$</dd>
</dl>

<p class="plain">Only the experts and the gate train. Examples: LoRAMoE, AdaMix, MixDA, LLaVA-MoLE, MixLoRA (next, optional).</p>

</div>
<div class="fig"><img src="img/week-07-cai-fig6-b.png" alt="Cai et al. Figure 6b: three PEFT experts beside the FFN, weighted by a gate with P1 = 0.61 and P2 = 0.28, their sum added to the FFN output"></div>
</div>

<p class="footnote">Cai et al. 2024 · §4.3.1, Eq. 12, 13, Fig. 6b. LayerNorm: layer normalisation</p>

Note:
The frozen FFN output plus a gated sum of small updates.

--

<p class="eyebrow"><span class="paper">Cai et al. 2024</span> · §4.3.1 · FFN methods · optional</p>

## What do the FFN methods each add?

<div class="rows">
<table class="rules" style="font-size:19px">
  <tr><td>method</td><td>what it does</td></tr>
  <tr><td>LoRAMoE</td><td>two LoRA expert groups, downstream tasks and world knowledge; a local balance loss in each group; against forgetting</td></tr>
  <tr><td>AdaMix</td><td>adapter experts after the FFN; random routing in training, all experts averaged at inference</td></tr>
  <tr><td>MixDA</td><td>stage 1: domain adapters beside the FFN; stage 2: a gate and task adapters on top</td></tr>
  <tr><td>LLaVA-MoLE</td><td>LoRA experts for multimodal inputs from different domains, top-1; beats plain LoRA</td></tr>
  <tr><td>MixLoRA</td><td>LoRA experts fused with the shared FFN, like a conventional MoE; faster, less memory</td></tr>
</table>
</div>

<p class="footnote">Cai et al. 2024 · §4.3.1. Adapter: a small down-and-up projection inserted in a block; LLaVA: a vision-language model</p>

Note:
The survey's FFN examples in its order.

---

<p class="eyebrow"><span class="paper">Cai et al. 2024</span> · §4.3.2 · Eq. 14 · Fig. 6a</p>

## What does a PEFT expert in attention compute?

<div class="eq">$$\operatorname{SA}^{MoE}(\mathbf{x}) = \operatorname{Softmax}\Big(\frac{\mathbf{Q}(\mathbf{K^T} + \sum_{i=1}^n \mathbf{x} \Delta \mathbf{W}_i^k \cdot G^k(\mathbf{x})_i)}{\sqrt{d_{head}}}\Big)(\mathbf{V} + \sum_{i=1}^n \mathbf{x} \Delta \mathbf{W}_i^v \cdot G^v(\mathbf{x})_i)$$</div>

<div class="cols wide-text">
<div class="text">

<dl class="where">
<dt>$\mathbf{Q}, \mathbf{K}, \mathbf{V}$</dt><dd>the frozen query, key and value modules</dd>
<dt>$\Delta \mathbf{W}_i^k$, $G^k$</dt><dd>key expert $i$ and its gate; $\Delta \mathbf{W}_i^v$, $G^v$ the same for values</dd>
<dt>$n$, $d_{head}$</dt><dd>number of experts; dimension per attention head</dd>
</dl>

- MoELoRA: LoRA experts on query and value, top-$k$, a contrastive loss so experts differ.
- MoCLE: cluster the tasks; task experts plus one universal expert.
- SiRA: top-$k$ LoRA experts with capacity, a balance loss and expert dropout.

</div>
<div class="fig"><img src="img/week-07-cai-fig6-a.png" alt="Cai et al. Figure 6a: PEFT experts beside the attention block, their gated sums added to K and V"></div>
</div>

<p class="footnote">Cai et al. 2024 · §4.3.2, Eq. 14, Fig. 6a (keys and values shown; queries and outputs work the same way). Contrastive loss: pushes outputs apart</p>

Note:
The experts add gated updates to the keys and values inside the attention softmax.

---

<p class="eyebrow"><span class="paper">Cai et al. 2024</span> · §4.3.3 · Eq. 15, 16 · Fig. 6c</p>

## What if both attention and FFN get PEFT experts?

<div class="eq">$$\begin{aligned}&y = \operatorname{LayerNorm}(\mathbf{x}^\prime + \operatorname{FFN}^{MoE}(\mathbf{x}^\prime)),\\ &\mathbf{x}^\prime = \operatorname{LayerNorm}(\operatorname{SA}^{MoE}(\mathbf{x}) + \mathbf{x})\end{aligned}$$</div>

<div class="cols wide-text">
<div class="text">

<dl class="where">
<dt>$\operatorname{SA}^{MoE}$, $\operatorname{FFN}^{MoE}$</dt><dd>attention and FFN with PEFT experts (Eq. 14, Eq. 12), each with its own gate</dd>
<dt>$y$</dt><dd>the block's output</dd>
</dl>

<p class="plain">Two expert groups in one block. Examples: MoV, MoLoRA, UniPELT, Omni-SMoLA, MoLA, MOELoRA, MoR1E, MeteoRA (next, optional).</p>

</div>
<div class="fig"><img src="img/week-07-cai-fig6-c.png" alt="Cai et al. Figure 6c: two stacks of PEFT experts, one feeding the attention block's K and V and one feeding the FFN"></div>
</div>

<p class="footnote">Cai et al. 2024 · §4.3.3, Eq. 15, 16, Fig. 6c</p>

Note:
Panel c is panels a and b at once.

--

<p class="eyebrow"><span class="paper">Cai et al. 2024</span> · §4.3.3 · block methods · optional</p>

## What do the Transformer-block methods each add?

<div class="rows">
<table class="rules tight" style="font-size:18px">
  <tr><td>method</td><td>what it does</td></tr>
  <tr><td>MoV, MoLoRA</td><td>(IA)$^3$ vectors, or LoRA experts, on attention and FFN; MoLoRA beats standard LoRA</td></tr>
  <tr><td>UniPELT</td><td>three PEFT methods as experts: LoRA on query and key, prefix vectors on key and value, an adapter after the FFN</td></tr>
  <tr><td>Omni-SMoLA</td><td>three LoRA sets: text, visual and multimodal tokens</td></tr>
  <tr><td>MoLA</td><td>a different number of experts in each layer</td></tr>
  <tr><td>MOELoRA</td><td>medical tasks; the gate uses the task's identity</td></tr>
  <tr><td>MoR1E</td><td>rank-1 experts: any up matrix pairs with any down matrix</td></tr>
  <tr><td>MeteoRA</td><td>many task-specific LoRAs in one model, custom GPU kernels</td></tr>
</table>
</div>

<p class="footnote">Cai et al. 2024 · §4.3.3. Prefix tuning: learn vectors prepended to attention's input. (IA)$^3$: learned vectors rescaling activations</p>

Note:
The survey's block examples in its order.

---

<p class="eyebrow"><span class="paper">Cai et al. 2024</span> · §4.3.4 · Eq. 17, 18 · Fig. 6d</p>

## What if the whole layer is one expert?

<div class="eq">$$\begin{aligned}&y = \operatorname{LayerNorm}(\mathbf{x}^\prime + \operatorname{FFN}(\mathbf{x}^\prime)) + \sum_{i=1}^n \mathbf{x} \Delta \mathbf{W}_i^{layer} \cdot G^{layer}(\mathbf{x})_i,\\ &\mathbf{x}^\prime = \operatorname{LayerNorm}(\operatorname{SA}(\mathbf{x}) + \mathbf{x})\end{aligned}$$</div>

<div class="cols wide-text">
<div class="text">

<dl class="where">
<dt>$\Delta \mathbf{W}_i^{layer}$</dt><dd>PEFT expert $i$ for the whole layer, fed the layer's input $\mathbf{x}$</dd>
<dt>$G^{layer}(\mathbf{x})_i$</dt><dd>the layer's gate weight on expert $i$</dd>
</dl>

- Attention and FFN treated as one unit, with one gate.
- MoLE: each layer of a set of already trained LoRAs is an expert; only the gate trains, learning how to compose them for a domain.

</div>
<div class="fig"><img src="img/week-07-cai-fig6-d.png" alt="Cai et al. Figure 6d: one stack of PEFT experts takes the layer input X and its gated sum is added to the layer's output Y"></div>
</div>

<p class="footnote">Cai et al. 2024 · §4.3.4, Eq. 17, 18, Fig. 6d. MoLE: Mixture of LoRA Experts</p>

Note:
The experts bypass the whole layer and add to its output.

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

<p class="plain">(ours) The survey lists DeepSeek-V3 but not its auxiliary-loss-free balancing: the next reading.</p>

<p class="footnote">Cai et al. 2024 · §7, eight challenges in its order; quoted words are its own, other cells short paraphrases (ours)</p>

Note:
The first challenge is the load-balancing story of §2.2 and §4.1.1; DeepSeek-V3 answers it differently.


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

