<!-- .slide: id="week-02" class="cover week" -->

<h1>Week 2</h1>
<p class="subtitle">LLM Fine-tuning: LoRA, QLoRA, and Beyond</p>

---

## Why parameter-efficient fine-tuning?

<div class="two-col">
  <div class="big-math">$$W$$</div>
  <div><img src="img/week-02-model-sizes.svg" alt="Parameter counts of LLMs from GPT-2 (1.5B) to Kimi K2 (1T), sorted increasing"></div>
</div>

<p class="gloss"><b>Fine-tuning</b>: keep training a pretrained model on your own task data. <b>Parameter-efficient</b>: train only a small set of new parameters. <b>Qwen3-4B</b>: the model we fine-tune in the first mini project</p>

Note:
W is every weight in the model, so |W| is the parameter count. Full fine-tuning updates all of W, and Adam keeps two more copies of the same size.
Sources: one citation per model size. Only publicly disclosed sizes; GPT-4/Claude/Gemini are not published.
DeepSeek-V3 and Kimi K2 are MoE: total shown (671B / 1T); only 37B / 32B are active per token, but all of W must still be stored.

---

## What does it take to store W?

<div class="two-col">
  <div class="big-math stack">$$\begin{gathered} |W| \\ \times \\ 2\ \text{bytes}^{*} \end{gathered}$$</div>
  <div><img src="img/week-02-model-storage.svg" alt="Storage of W at 16-bit, from GPT-2 (3 GB) to Kimi K2 (2 TB), sorted increasing"></div>
</div>

<p class="footnote">*if the model uses 2 bytes per parameter</p>

Note:
2 bytes per parameter = bf16/fp16, the usual precision for released weights and for fine-tuning. Decimal units (1 GB = 10^9 B).
Real checkpoints vary: DeepSeek-V3 and Kimi K2 ship FP8 weights (1 byte/param, so half these numbers); fp32 doubles them.
This is only the weights. Full fine-tuning with Adam also stores gradients and two optimizer moments, several times |W| more.

---

## What does it take to run W?

<div class="two-col">
  <div class="big-math stack tall">$$\begin{gathered} |W| \\ \times \\ 2\ \text{bytes} \\ + \\ \text{KV cache}^{*} \end{gathered}$$</div>
  <div><img src="img/week-02-inference-memory.svg" alt="Memory to run Qwen3-4B at batch 1: 8 GB of weights plus a KV cache that grows from 0.15 GB at 1K tokens to 6 GB at 40K tokens, under a 16 GB V100 line"></div>
</div>

<p class="footnote">*per token: 2 (K, V) × 36 layers × 8 KV heads × 128 dims × 2 bytes = 147 KB for Qwen3-4B</p>

<p class="gloss"><b>KV cache</b>: the keys and values of every earlier token, kept so each new token doesn't recompute them. <b>V100</b>: the 16 GB GPUs on our cluster</p>

Note:
Inference keeps the weights plus, for every token already in the context, its keys and values in every layer, so attention doesn't recompute them. That is the KV cache, and it grows linearly with context length and with batch size.
Qwen3-4B uses grouped-query attention: 8 KV heads shared by 32 query heads, which makes its cache 4x smaller than full multi-head attention would.
Activations at inference are transient (one layer at a time) and are left out. At batch 8, the 32K-token cache alone is ~39 GB.
Config: from the Hugging Face model card.

---

## What does it take to train W?

<div class="two-col">
  <table class="rules">
    <tr><td>weights</td><td>$|W| \times 2$ bytes</td></tr>
    <tr><td>gradients</td><td>$|W| \times 2$ bytes</td></tr>
    <tr><td>fp32 copy of W <small>(keeps tiny updates)</small></td><td>$|W| \times 4$ bytes</td></tr>
    <tr><td>Adam $m$ <small>(avg. gradient)</small></td><td>$|W| \times 4$ bytes</td></tr>
    <tr><td>Adam $v$ <small>(avg. gradient²)</small></td><td>$|W| \times 4$ bytes</td></tr>
    <tr class="total"><td></td><td>$|W| \times 16$ bytes</td></tr>
    <tr><td>activations</td><td>$\approx 34\,sbhL$ bytes$^{*}$</td></tr>
  </table>
  <div><img src="img/week-02-training-memory.svg" alt="Memory to fully fine-tune Qwen3-4B with 2048-token sequences: 64 GB of model state plus activations, 70 GB at batch 1 to 115 GB at batch 8, all far past a 16 GB V100 line"></div>
</div>

<p class="footnote">*s tokens × b batch × h hidden × L layers, with FlashAttention (Korthikanti et al. 2022); 16 bytes/param from ZeRO (Rajbhandari et al. 2020)</p>

<p class="gloss"><b>Adam</b>: the standard optimizer; it keeps two running averages per weight. <b>Activations</b>: each layer's intermediate outputs, kept for the backward pass</p>

Note:
Training keeps everything inference does, plus: a gradient for every weight, Adam's two running moments, and an fp32 master copy (small updates round away in bf16). That's 16 bytes per parameter, 8x the storage slide.
Activations: backprop needs every layer's forward inputs, so they're all kept until the backward pass reaches them. They grow with batch x sequence length, not with |W|. The 34 sbh per layer is the GPT-style count; Qwen3's wider SwiGLU MLP makes it somewhat higher, so the chart understates.
Gradient checkpointing keeps only layer inputs (~2 sbh per layer) and recomputes the rest: roughly one extra forward pass.
Qwen3-4B at batch 1 needs ~70 GB, more than 4x the V100. That is the problem LoRA and QLoRA solve.

---

## Five ways to fine-tune cheaply

<table class="rules steps overview">
  <tr><td></td><td>what changes</td><td>what is trained</td><td>Qwen3-4B, batch 1</td><td>headline</td></tr>
  <tr><td>LoRA</td><td>add a low-rank $BA$ to frozen $W_0$</td><td>$B, A$</td><td>14.7 GB</td><td>matches full FT, 10,000× fewer trainable params</td></tr>
  <tr><td>QLoRA</td><td>LoRA on a 4-bit frozen model</td><td>$B, A$</td><td>9.3 GB</td><td>4-bit matches 16-bit on average</td></tr>
  <tr><td>DoRA</td><td>split $W$ into length × direction</td><td>$B, A$ + lengths $m$</td><td>≈ LoRA</td><td>+1.0 to +4.4 over LoRA</td></tr>
  <tr><td>LongLoRA</td><td>sparse shifted attention while training</td><td>$B, A$ + embeddings + norms</td><td>≈ LoRA per token</td><td>Llama2 7B to 100K tokens</td></tr>
  <tr><td>ReFT</td><td>edit hidden states, not weights</td><td>$R, W, b$ per layer</td><td>&lt; LoRA</td><td>best on commonsense, worse on math</td></tr>
</table>

<p class="footnote">Memory: our estimates from the earlier slides (2,048-token sequences, V100 in mind). Headlines: each paper's own claim, detailed in its section</p>

<p class="gloss"><b>Adapter</b>: the small trained add-on ($B, A$). <b>Embeddings</b>: the token → vector table. <b>Norms</b>: normalisation layers. <b>Hidden state</b>: a layer's output vector for one token</p>

Note:
A map before the details. Every method keeps the pretrained model frozen; they differ in what they add and train.
LoRA is the base: a low-rank update B A next to each frozen matrix. QLoRA keeps LoRA and shrinks the frozen model to 4 bits. DoRA keeps LoRA and changes what it learns (direction only, plus a separate length per neuron). LongLoRA keeps LoRA and makes long-context training cheap (sparse attention during training, plus training embeddings and norms). ReFT drops weight updates entirely and edits hidden states at a few token positions.
Each section follows the same order: why it exists, what it changes, what is trained, memory, performance, what is learned, and caveats (sub-slides).

---

## LoRA (Hu et al. 2022)

<div class="two-col">
  <table class="rules roles opener">
    <tr><td>problem</td><td>full fine-tuning GPT-3 needs 1.2 TB and a 350 GB copy per task</td></tr>
    <tr><td>idea</td><td>the update $\Delta W$ is low rank: $\Delta W = BA$</td></tr>
    <tr><td>trains</td><td>$B, A$ only; $W_0$ frozen</td></tr>
    <tr><td>memory</td><td>GPT-3: 1.2 TB → 350 GB; checkpoint 350 GB → 35 MB</td></tr>
    <tr><td>performance</td><td>on par with full fine-tuning</td></tr>
    <tr class="total"><td>cost at inference</td><td>none: merge $W_0 + BA$</td></tr>
  </table>
  <div><img src="img/week-02-lora-forward.svg" alt="LoRA forward pass: the input x goes through the frozen pretrained weight W0 and, in parallel, through a trainable low-rank path A then B; A is initialised from a Gaussian and B at zero; the two results are added to give h"></div>
</div>

<p class="footnote">Diagram after Hu et al. 2022, Fig. 1: grey = frozen, black = trained</p>

Note:
Why it exists: fine-tuning every weight of a big model needs optimizer memory for every weight and a full copy of the model per task.
What they noticed: the change fine-tuning makes, Delta W, has low intrinsic rank, so it can be written as a thin B times a thin A.
The forward pass: x goes through the frozen W0 and, in parallel, down through A (to r numbers) and up through B; the two are added. B starts at zero, so training starts exactly at the pretrained model.
Numbers from the paper (GPT-3 175B): training memory 1.2 TB -> 350 GB, per-task checkpoint 350 GB -> 35 MB, 25% faster training, no extra inference latency.
The next slides: why low rank is plausible, what it costs, which matrices and which rank, and what Delta W actually learns.

---

## Where LoRA comes in

<div class="two-col">
  <div class="big-math line">$$\underbrace{W_0}_{\text{frozen}} + \underbrace{\Delta W^{*}}_{\text{low rank}}$$</div>
  <div><img src="img/week-02-rank-factorization.svg" alt="Rank factorization drawn as shapes: a d by k matrix Delta W equals a tall thin d by r matrix B times a short wide r by k matrix A"></div>
</div>

<p class="footnote">*"We hypothesize that the change in weights during model adaptation also has a low 'intrinsic rank'" (Hu et al. 2022)</p>

<p class="gloss"><b>Rank $r$</b>: the number of independent directions. A rank-$r$ matrix is stored as $r(d_{\text{in}} + d_{\text{out}})$ numbers instead of $d_{\text{in}}\,d_{\text{out}}$</p>

Note:
Precise version of the linear algebra: a matrix has rank r exactly when it factors as BA with inner dimension r. A full-rank d_out x d_in matrix needs r = min(d_out, d_in), so this does NOT compress W0 itself (pretrained weights are close to full rank).
The claim is about the update: fine-tuning only moves the model in a few directions, so Delta W can be low rank even though W0 is not.
Inspiration: Li et al. 2018 and Aghajanyan et al. 2020, who show fine-tuning works in a random low-dimensional subspace ("intrinsic dimension"). LoRA §7 gives evidence: on GPT-3, r = 1 suffices for many tasks.
The drawing is schematic: r is drawn wider than to scale, or B and A would be hairlines.
Notation: the paper writes W0 in R^{d x k}. Here d = d_out (rows, output size) and k = d_in (columns, input size), since h = W0 x with x in R^{d_in}.

---

## LoRA: train B and A, not W

<div class="two-col">
  <div class="big-math line">$$h = W_0 x + BAx^{*}$$</div>
  <div><img src="img/week-02-lora-params.svg" alt="Trainable parameters in one Qwen3-4B query projection: full fine-tuning 10.5M, LoRA 6.7K at r=1, 53K at r=8, 426K at r=64"></div>
</div>

<p class="footnote">*$A \sim \mathcal{N}(0, \sigma^2)$ and $B = 0$, so $BA = 0$ and training starts exactly at the pretrained model (Hu et al. 2022, Fig. 1)</p>

Note:
Trainable parameters per matrix: d_out·d_in for full fine-tuning vs r(d_in + d_out) for LoRA. For Qwen3-4B's q_proj (d_out = 4096, d_in = 2560), r = 8 gives 53K vs 10.5M, i.e. 0.5%.
Only B and A get gradients, Adam states, and fp32 copies, so on the training slide those rows shrink from |W| to |B| + |A|. The weights row (W0, 2 bytes/param) and activations stay.
The update is scaled by alpha / r; the paper sets alpha to the first r tried and doesn't tune it.
Init in practice: the paper says only "random Gaussian" (Fig. 1: N(0, sigma^2), sigma unspecified). Microsoft's loralib and PEFT both default to kaiming_uniform_(A, a=sqrt(5)); PEFT's init_lora_weights="gaussian" uses std 1/r. What matters is B = 0, which makes BA = 0 whatever A is.
No inference cost: after training, merge W = W0 + BA and deploy a normal model.

---

## What does it take to train with LoRA?

<div class="two-col">
  <table class="rules">
    <tr><td>weights $W_0$</td><td>$|W| \times 2$ bytes</td></tr>
    <tr><td>gradients</td><td>$(|B| + |A|) \times 2$ bytes</td></tr>
    <tr><td>fp32 copy</td><td>$(|B| + |A|) \times 4$ bytes</td></tr>
    <tr><td>Adam $m$</td><td>$(|B| + |A|) \times 4$ bytes</td></tr>
    <tr><td>Adam $v$</td><td>$(|B| + |A|) \times 4$ bytes</td></tr>
    <tr class="total"><td></td><td>$|W| \times 2 + (|B| + |A|) \times 16$ bytes</td></tr>
    <tr><td>activations</td><td>$\approx 34\,sbhL$ bytes</td></tr>
  </table>
  <div><img src="img/week-02-lora-training-memory.svg" alt="Memory to LoRA fine-tune Qwen3-4B at r=8: 14.7 GB at batch 1 fits under the 16 GB V100 line; 21 GB at batch 2, 34 GB at batch 4, 60 GB at batch 8; dotted outlines show full fine-tuning at 70 to 115 GB"></div>
</div>

<p class="footnote">$|B| + |A| = 16.5\text{M}$ for Qwen3-4B at $r = 8$ on all 7 projections per layer (0.41% of $|W|$)</p>

Note:
Same table as full fine-tuning: only the trainable parameters carry gradients, an fp32 copy, and Adam states, so those rows shrink from |W| (4B) to |B| + |A| (16.5M). 48 GB of optimizer state becomes 0.26 GB.
The weights row stays: W0 must still be in memory for the forward and backward pass.
Activations stay roughly the same: backprop still runs through every frozen layer to reach the adapters below it. (Frozen linear layers don't need their inputs saved, so the real number is somewhat lower than 34 sbhL; the norms, attention, and nonlinearities still do.)
Result: batch 1 fits the V100 (14.7 GB), batch 2 does not. Weights and activations are now the whole bill, and LoRA can't shrink either. Next: QLoRA for the weights, gradient checkpointing for the activations.
Count: per layer r*(in + out) for q (2560->4096), k, v (2560->1024), o (4096->2560), gate, up (2560->9728), down (9728->2560) = 458,752; x 36 layers.

---

## Two knobs: rank and coverage

<div class="two-col">
  <div class="big-math line">$$|\Theta| = \sum_{W \in \underbrace{\mathcal{S}}_{\text{which}}} \underbrace{r}_{\text{rank}}\,(d^{W}_{\text{in}} + d^{W}_{\text{out}})$$</div>
  <div><img src="img/week-02-lora-axes.svg" alt="LoRA's two knobs as a square: x axis is rank r up to full rank, y axis is which matrices get adapters up to all; bottom-left is the original model, top-right is full fine-tuning"></div>
</div>

<p class="footnote">"as we increase the number of trainable parameters, training LoRA roughly converges to training the original model" (Hu et al. 2022, §4.2)</p>

Note:
So far we only turned one knob, the rank r. The second knob is which weight matrices get a B, A pair at all: the set S.
Bottom-left: no adapters, the original model. Top-right: adapters on every matrix at full rank, which is full fine-tuning. That's why the paper calls LoRA "a generalization of full fine-tuning" (§4.2).
Every LoRA config is a point in this square, and |Theta| grows along both axes.

---

## What gets trained in practice

<div class="two-col">
  <table class="rules marks">
    <tr><td></td><td>LoRA paper</td><td>PEFT default</td><td>QLoRA</td></tr>
    <tr><td>$W_q$</td><td>●</td><td>●</td><td>●</td></tr>
    <tr><td>$W_k$</td><td></td><td></td><td>●</td></tr>
    <tr><td>$W_v$</td><td>●</td><td>●</td><td>●</td></tr>
    <tr><td>$W_o$</td><td></td><td></td><td>●</td></tr>
    <tr><td>MLP (gate, up, down)</td><td></td><td></td><td>●</td></tr>
    <tr><td>rank $r$</td><td>4</td><td>8</td><td>64</td></tr>
  </table>
  <div><img src="img/week-02-lora-recipes.svg" alt="Recipes placed on Qwen3-4B: LoRA paper and PEFT default adapt q and v, covering 13 percent of each layer's linear parameters at r 4 and 8; QLoRA adapts all linear layers, 100 percent at r 64; full fine-tuning is 100 percent at full rank"></div>
</div>

<p class="footnote">"LoRA on all linear transformer block layers are required to match full finetuning" (Dettmers et al. 2023)</p>

<p class="gloss"><b>PEFT</b>: Hugging Face's parameter-efficient fine-tuning library; "default" = what you get without choosing target matrices</p>

Note:
LoRA paper: adapted only attention weights and froze the MLP "for simplicity and parameter-efficiency", leaving MLP, LayerNorm, and biases to future work. At a fixed 18M budget on GPT-3, W_q + W_v at r = 4 and all four attention matrices at r = 2 tied for best (Table 5). Spreading a budget across more matrix types beats a higher rank on one.
PEFT: if you don't set target_modules, Qwen3 gets q_proj and v_proj only, which is 13% of each layer's linear parameters. Easy to miss.
QLoRA: found the number of adapters matters most and r barely matters; all linear layers are needed to match full fine-tuning. They used r = 64 everywhere.
Coverage is measured on Qwen3-4B (100.9M linear params per layer), so all three recipes are on one architecture. The MLP alone is 74% of each layer.
Never adapted by these recipes: embeddings, norms, biases.

--

## The seven matrices in a layer

<div class="two-col">
  <table class="rules roles">
    <tr><td></td><td>$d_{\text{in}} \to d_{\text{out}}$</td><td>role</td></tr>
    <tr><td>$W_q$</td><td>2560 → 4096</td><td>query: what this token looks for</td></tr>
    <tr><td>$W_k$</td><td>2560 → 1024</td><td>key: what each token can be found by</td></tr>
    <tr><td>$W_v$</td><td>2560 → 1024</td><td>value: what each token passes on</td></tr>
    <tr><td>$W_o$</td><td>4096 → 2560</td><td>mixes the heads back to hidden size</td></tr>
    <tr><td>$W_{\text{gate}}$</td><td>2560 → 9728</td><td>valve: which features pass</td></tr>
    <tr><td>$W_{\text{up}}$</td><td>2560 → 9728</td><td>expands into 9,728 features</td></tr>
    <tr><td>$W_{\text{down}}$</td><td>9728 → 2560</td><td>projects back to hidden size</td></tr>
  </table>
  <div class="eqs">
    $$\text{Attn}(X) = W_o\,\text{softmax}\!\Big(\frac{QK^\top}{\sqrt{d_h}}\Big)V$$
    $$Q = W_q X,\quad K = W_k X,\quad V = W_v X$$
    $$\text{MLP}(x) = W_{\text{down}}\big(\text{SiLU}(W_{\text{gate}}\,x) \odot W_{\text{up}}\,x\big)$$
  </div>
</div>

<p class="footnote">Qwen3-4B: $K, V$ are 1024 wide because 8 KV heads are shared by 32 query heads (grouped-query attention); $d_h = 128$</p>

Note:
Each decoder layer = attention block then MLP block, each wrapped in RMSNorm + a residual connection. These seven are all of its linear layers; they're what LoRA can attach B, A to.
Attention: each token's query is compared with every token's key; the softmax weights decide how much of each value flows in. W_o mixes the 32 heads' outputs back into one hidden vector. (Qwen3 also RMS-normalises q and k per head; left out of the equation.)
MLP (SwiGLU): up expands to 9,728 features, gate passes through SiLU and scales each feature elementwise (a learned valve), down projects back to 2,560. Classic Transformers used two matrices with a ReLU; the gate is the modern addition.
Parameter share per layer: q 10.5M, k 2.6M, v 2.6M, o 10.5M, gate/up/down 24.9M each. The MLP is 74% of the layer's 100.9M, which is why attention-only LoRA skips most of the model.

--

## Attention, MLP, or both?

<div class="two-col">
  <table class="rules roles">
    <tr><td>LoRA</td><td>attention only: $W_q, W_v$ ($r$ = 4) beat $W_q$ ($r$ = 8), 73.7 vs 70.4</td></tr>
    <tr><td>QLoRA</td><td>searched 5 layer sets: all linear layers needed to match full FT</td></tr>
    <tr><td>2025</td><td>MLP-only ≈ all layers; attention-only worse</td></tr>
    <tr><td>even at</td><td>equal parameters: attention $r$ = 256 loses to MLP $r$ = 128</td></tr>
    <tr class="total"><td>for us</td><td><code>target_modules="all-linear"</code>; MLP is 64% of the LoRA</td></tr>
  </table>
  <div><img src="img/week-02-lora-modules.svg" alt="LoRA parameter counts on Llama-3.1-8B: all layers at rank 256 is 0.70 billion, MLP at rank 256 0.49 billion, attention at rank 256 0.25 billion, MLP at rank 128 0.24 billion; attention at rank 256 does worse than MLP at rank 128 despite the same size"></div>
</div>

<p class="gloss"><b>WikiSQL</b>: questions → SQL queries (GPT-3 175B, 18M trainable parameters in every column of the comparison)</p>

<p class="footnote">Hu et al. 2022, Table 5; Dettmers et al. 2023, §4 and appendix; Schulman et al. 2025, Llama-3.1-8B and Qwen3-30B-A3B. MLP share: our Qwen3-4B count</p>

Note:
The papers this week mostly adapt attention only, so it's worth knowing what's been learned since about where to put adapters.
LoRA (Table 5): GPT-3 175B with the trainable budget fixed at 18M. Putting all of it in one matrix (W_q or W_k at r = 8) is clearly worse; W_q and W_v at r = 4 or all four attention matrices at r = 2 are best (WikiSQL 73.7, MultiNLI 91.3 / 91.7). Lesson: spread a small rank over more matrices. The MLP was never tested.
QLoRA (LLaMA-7B on Alpaca; appendix search over key+query, all attention, all FFN, all layers, attention + FFN output): "LoRA on all linear transformer block layers are required to match full finetuning", and once every layer is adapted, r barely matters.
LoRA Without Regret (Thinking Machines, 2025): attention-only LoRA "significantly underperforms MLP-only LoRA, and does not further improve performance on top of LoRA-on-MLP", on dense Llama-3.1-8B and the Qwen3-30B-A3B MoE, in supervised learning and RL. It isn't just size: attention-only at r = 256 (0.25B parameters) loses to MLP-only at r = 128 (0.24B), the black pair in the chart. They cite Biderman et al. 2024 as finding the same.
For Qwen3-4B: at any rank, the MLP's gate, up and down are 64% of an all-linear adapter's parameters (36,864 vs 20,480 per unit of rank per layer). PEFT's default for Qwen3 is still q and v only, so set target_modules="all-linear".

---

## How small can r be?

<div class="two-col">
  <div class="big-math line">$$r = 1^{*}$$</div>
  <div><img src="img/week-02-lora-table6.svg" alt="LoRA Table 6: GPT-3 175B validation accuracy versus rank r from 1 to 64 on WikiSQL and MultiNLI; every line is flat across r, while adapting W_q alone sits below W_q plus W_v and all four attention matrices"></div>
</div>

<p class="footnote">*"a rank as small as one suffices for adapting both $W_q$ and $W_v$ on these datasets" (Hu et al. 2022, Table 6)</p>

<p class="gloss"><b>WikiSQL</b>: English questions → SQL queries. <b>MultiNLI</b>: does one sentence imply another? ±: run-to-run noise the paper reports</p>

Note:
GPT-3 175B, validation accuracy. Each line is one choice of which matrices get adapters; x is the rank.
Flat lines: going from r = 1 to r = 64 changes accuracy by less than the noise (WikiSQL +/-0.5%, MultiNLI +/-0.1%). The rank knob barely matters here.
Gaps between lines: W_q alone is ~3-4 points below W_q + W_v on WikiSQL at every r. The coverage knob matters. Same conclusion QLoRA reached.
Caveat the authors give themselves (§7.2 footnote): "we do not expect a small r to work for every task or dataset". A task in a different language could need r close to d_model. For us: epidemic-modeling abstracts are English but domain-shifted, so sweep r (H02 already requires 3 ranks) rather than assume r = 1.

---

## The farther from the base model, the larger r

<div class="full"><img src="img/week-02-lora-tree.svg" alt="Adaptation tree: base model branches into English, French and Chinese (new language, large r, thick edges), English into Medical and Code and French into Math (new domain, medium r), Code into code completion and code translation (new task, small r, thin edges)"></div>

<p class="footnote">Tree after E. Hu, "What is Low-Rank Adaptation (LoRA), explained by the inventor" (YouTube) · a task "in a different language" may need full rank (Hu et al. 2022, §7.2)</p>

Note:
Source of the tree: Edward Hu (LoRA first author), "What is Low-Rank Adaptation (LoRA) | explained by the inventor", https://www.youtube.com/watch?v=DhRoTONcyZE
Edge thickness stands for the rank an adaptation needs. A new language is far from what the base model knows: large r, maybe full fine-tuning. A new domain inside a known language: medium r. A specific task inside a known domain: small r.
Table 6's tasks (WikiSQL, MultiNLI) are English tasks for an English model, which puts them near the leaves. That's why r = 1 works there.
LoRA modules can also be stacked down the tree: adapt the base to English, then English to code, then code to completion, each with a smaller r.
Where our first mini project sits: English scientific text (known language) in a narrow domain (epidemic modeling) for a specific task (entity/relation extraction), so somewhere between the domain and task levels.

---

## What does ΔW learn?

<div class="two-col">
  <div class="big-math line">$$\Delta W_q = U \Sigma V^\top$$
  $$\underbrace{\frac{\|\Delta W_q\|_F}{\|U^\top W_q V^\top\|_F}}_{\text{amplification ratio}} = \frac{6.91}{0.32} \approx 21.6$$</div>
  <div><img src="img/week-02-delta-w.svg" alt="Dot plot on a log axis: along random directions W_q has 0.02; along Delta W's top-4 directions W_q has 0.32 while Delta W itself has norm 6.91, an amplification of 21.6 times; along W_q's own top-4 directions W_q has 21.67; all of W_q has norm 61.95"></div>
</div>

<p class="footnote">ΔW "only amplifies directions that are not emphasized in W" (Hu et al. 2022, Table 7: GPT-3 175B, layer 48, $W_q$, $r = 4$)</p>

<p class="gloss">$\|M\|_F$ (<b>Frobenius norm</b>): the square root of the sum of all squared entries, i.e. a matrix's overall size</p>

Note:
Question: is Delta W just more of what W already does, or something new? Take Delta W's top-4 singular directions (U, V) and measure how much of the pretrained W_q lies along them.
Along random directions: 0.02. Along Delta W's directions: 0.32, more than random, so the directions are already present in W. Along W's own top directions: 21.67. So Delta W does not boost W's strongest directions; it picks weak ones.
And it boosts them hard: Delta W's norm along those directions is 6.91, 21.6x what W had there. (The paper prints 21.5; 6.91/0.32 = 21.59.)
Authors' reading: fine-tuning "amplifies the important features for specific downstream tasks that were learned but not emphasized in the general pre-training model". Pretraining already learned the features; adaptation turns up a few quiet ones.
Links to §7.2: runs at r = 8 and r = 64 share about one strong direction; the rest looks like noise. A few directions, amplified a lot.
At r = 64 the factor is smaller (1.90 vs 3.57 -> ~1.9x) because the extra directions are mostly noise (App. H.4).

--

## Reading the ratio

<table class="rules steps">
  <tr><td>$\Delta W_q = U \Sigma V^\top$</td><td>take the update's top-$r$ directions: $U$ is $d_{\text{out}} \times r$, $V$ is $r \times d_{\text{in}}$</td><td>$r = 4$</td></tr>
  <tr><td>$\|U^\top W_q V^\top\|_F$</td><td>project the pretrained $W_q$ onto those directions: how strongly it already maps ΔW's inputs to its outputs</td><td>0.32</td></tr>
  <tr><td>$\|\Delta W_q\|_F$</td><td>size of the update, which lies entirely in those directions</td><td>6.91</td></tr>
  <tr class="total"><td>$\dfrac{\|\Delta W_q\|_F}{\|U^\top W_q V^\top\|_F}$</td><td>how many times fine-tuning amplified what was already there</td><td>21.6</td></tr>
</table>

<p class="footnote">For scale, the same projection onto random directions gives 0.02, and onto $W_q$'s own top-4 directions gives 21.67 (Hu et al. 2022, Table 7)</p>

Note:
Step 1: SVD of the learned update. Its top-r singular vectors say which input directions (V) it reads and which output directions (U) it writes. With r = 4, the update lives in a 4-dimensional slice.
Step 2: U^T W V^T is a 4 x 4 matrix: the part of the pretrained W that maps those input directions to those output directions. Its Frobenius norm (square root of the sum of squared entries) says how strong W already is in that slice. 0.32 is small next to W's total 61.95, but bigger than a random slice (0.02). So the directions exist in W; they're just quiet.
Step 3: the update's own norm, 6.91. All of Delta W is inside that slice by construction.
Step 4: 6.91 / 0.32 = 21.6. Fine-tuning made that slice about 21x stronger than pretraining left it.
Contrast: W's own strongest slice is 21.67. The update didn't touch the loud directions; it turned up quiet ones.
Notation follows the paper (V as rows, so V^T is d_in x r).

--

## LoRA caveats

<table class="rules steps">
  <tr><td>batching tasks</td><td>once $BA$ is merged into $W$, inputs for different tasks can't share one forward pass</td><td>authors, §4.2</td></tr>
  <tr><td>small $r$</td><td>"we do not expect a small $r$ to work for every task", e.g. a new language</td><td>authors, §7.2</td></tr>
  <tr><td>which matrices</td><td>only attention was studied; MLP, LayerNorm, biases left for future work</td><td>authors, §4.2</td></tr>
  <tr><td>choosing</td><td>"we mostly depend on heuristics to select the weight matrices"</td><td>authors, §8</td></tr>
  <tr class="total"><td>evidence</td><td>rank findings: GPT-3 on two datasets; a "typical" standard deviation, not per result</td><td>our read</td></tr>
</table>

<p class="footnote">Later work filled some of these gaps: QLoRA found all linear layers are needed to match full fine-tuning</p>

Note:
Batching: the zero-latency trick (merge BA into W) means one set of weights per task. Serving many tasks at once needs unmerged adapters, which brings back a small cost.
Small r is not universal: the authors' own footnote says a task far from pretraining (a different language) may need close to full rank. The adaptation-tree slide.
Coverage: the paper only adapted attention weights; which matrices to adapt is chosen by heuristics. QLoRA later showed that attention-only LoRA falls short of full fine-tuning.
Evidence: the striking rank results (r = 1 suffices) are on GPT-3 with WikiSQL and MultiNLI; GPT-3 results report a typical standard deviation rather than one per entry.
Open question from their conclusion: the mechanism of fine-tuning is "far from clear".

---

## QLoRA (Dettmers et al. 2023)

<div class="two-col wide-right">
  <table class="rules roles opener">
    <tr><td>problem</td><td>the frozen 16-bit model itself no longer fits</td></tr>
    <tr><td>idea</td><td>store $W_0$ in 4 bits, compute in 16</td></tr>
    <tr><td>uses</td><td>NF4, double quantization, paged optimizers</td></tr>
    <tr><td>trains</td><td>LoRA $B, A$ on all linear layers</td></tr>
    <tr><td>memory</td><td>65B on one 48 GB GPU; Qwen3-4B weights 8 → 2.65 GB</td></tr>
    <tr class="total"><td>performance</td><td>matches 16-bit LoRA and full fine-tuning</td></tr>
  </table>
  <div><img src="img/week-02-qlora-compare.svg" alt="Full fine-tuning, LoRA and QLoRA compared: full fine-tuning has one large 32-bit optimizer state updating the whole 16-bit base model; LoRA has small optimizer states updating small adapters, with gradients flowing through the 16-bit base; QLoRA is the same with a smaller 4-bit base model and optimizer states that can page to CPU RAM"></div>
</div>

<p class="footnote">Diagram after Dettmers et al. 2023, Fig. 1: black = trained adapters, grey = frozen base model</p>

Note:
Why it exists: after LoRA, the optimizer state is tiny, and the frozen base model is the biggest thing in memory (8 GB of 16-bit weights for Qwen3-4B, 130 GB for a 65B model).
Left to right in the diagram: full fine-tuning updates every weight from a huge 32-bit optimizer state; LoRA updates only small adapters, with gradients flowing through the frozen base; QLoRA does the same with the base stored in 4 bits and the optimizer states allowed to page to CPU RAM.
Three pieces, in the paper's order: NF4 (a 4-bit format fitted to normally distributed weights), double quantization (compress the scales too), paged optimizers (survive memory spikes). Then how they fit together, whether accuracy survives, and what it costs.

---

## What can each data type store?

<div class="two-col">
  <table class="rules roles dtypes">
    <tr><td></td><td>bits</td><td>values</td><td>largest</td><td>gap at 1.0</td></tr>
    <tr><td>NF4</td><td>4</td><td>16</td><td>$1 \times c$</td><td>0.08 – 0.28</td></tr>
    <tr><td>INT4</td><td>4</td><td>16</td><td>7</td><td>1</td></tr>
    <tr><td>FP4</td><td>4</td><td>15</td><td>6</td><td>0.5</td></tr>
    <tr><td>INT8</td><td>8</td><td>256</td><td>127</td><td>1</td></tr>
    <tr><td>FP8</td><td>8</td><td>253</td><td>448</td><td>0.125</td></tr>
    <tr><td>FP16</td><td>16</td><td>65,536</td><td>65,504</td><td>0.001</td></tr>
    <tr><td>BF16</td><td>16</td><td>65,536</td><td>$3.4 \times 10^{38}$</td><td>0.008</td></tr>
    <tr><td>FP32</td><td>32</td><td>$4.3 \times 10^{9}$</td><td>$3.4 \times 10^{38}$</td><td>$1.2 \times 10^{-7}$</td></tr>
  </table>
  <div><img src="img/week-02-dtypes.svg" alt="Range of each data type on a log axis from its smallest normal value to its largest: INT4 and FP4 span 1 to 7 and 6, INT8 1 to 127, FP8 0.016 to 448, FP16 6e-5 to 65,504, BF16 and FP32 both 1e-38 to 3.4e38"></div>
</div>

<p class="footnote">FP8 = E4M3, FP4 = E2M1. Float limits from torch.finfo; NF4 is a 16-entry lookup scaled by each block's $c$</p>

Note:
Two different things a format has to trade with its bits: range (how big and how small a number it can hold, the chart) and resolution (the gap between neighbouring values, last column; smaller is finer).
Floats split bits into exponent (range) and mantissa (resolution). FP16 = 5 exponent + 10 mantissa bits: fine steps (0.001) but overflows past 65,504. BF16 = 8 + 7: same range as FP32 (1e38) but coarse steps (0.008). That's why training uses BF16: gradients and activations never overflow, and the coarse steps are handled by the fp32 master copy (training slide).
FP8 (E4M3): 253 finite values, max 448, gap 0.125 at 1.0. Used for QLoRA's scales c2.
The 4-bit formats have only 16 values. INT4 and FP4 have a fixed grid; NF4 has no fixed range at all: its 16 levels live in [-1, 1] and are stretched by each block's scale c, and its spacing is uneven, 0.08 near 0 and 0.28 near +-1.
The fp32 row is why the fp32 copy of W exists: 1.2e-7 steps absorb tiny updates that BF16's 0.008 steps round away.

---

## 4-bit NormalFloat (NF4)

<div class="two-col">
  <div class="big-math line">$$W_0 \approx c \cdot \text{NF4}\!\left(\frac{W_0}{c}\right)$$
  $$c = \max_{\text{block of } 64} |w|$$</div>
  <div><img src="img/week-02-nf4.svg" alt="NF4's 16 levels are packed near zero and spread out in the tails, following the bell curve of normalised weights; INT4's 15 levels are evenly spaced from -1 to 1"></div>
</div>

<p class="footnote">Weights are roughly zero-mean normal, so NF4's levels are quantiles of $\mathcal{N}(0,1)$: equal share per level (Dettmers et al. 2023, §3)</p>

Note:
Each block of 64 weights is divided by its absolute max c, so it lands in [-1, 1], then each weight is rounded to the nearest of 16 NF4 levels and stored as a 4-bit index. c is kept per block.
Why NF4 and not INT4: weights pile up near zero. Evenly spaced INT4 levels waste most of their resolution in the sparse tails; NF4's levels are quantiles of the normal, so every level is used equally often ("information theoretically optimal" for normal data, §3).
NF4 is asymmetric: 7 negative levels, an exact 0 (so padding and zeros quantize with no error), 8 positive.
The levels on the plot are the paper's exact appendix values; the script rebuilds them from N(0,1) quantiles and checks they match.
Caveat (App. normality): 7.5% of LLaMA-7B neurons fail a normality test at 5%, ~2.5 points above chance. Mostly normal, with exceptions.

--

## NF4 step 0: split W into blocks

<div class="two-col">
  <table class="rules roles">
    <tr><td>$W_q$</td><td>4,096 rows × 2,560 inputs</td></tr>
    <tr><td>one row</td><td>the 2,560 input weights of one neuron</td></tr>
    <tr><td>one block</td><td>64 consecutive weights in a row</td></tr>
    <tr><td>blocks per row</td><td>2,560 / 64 = 40</td></tr>
    <tr class="total"><td>blocks in $W_q$</td><td>163,840, each with its own scale $c$</td></tr>
  </table>
  <div><img src="img/week-02-nf4-split.svg" alt="Top: a toy 3 by 12 grid of weight values cut into blocks of 4 with alternating shading and each block's scale c written under it. Bottom: Qwen3-4B's W_q as a 4096 by 2560 rectangle with one row zoomed into 40 blocks of 64 input weights"></div>
</div>

<p class="footnote">Blocks are just consecutive runs of 64 numbers in memory, not chosen by value (bitsandbytes quantize_4bit). Toy values simulated</p>

Note:
How the blocks are decided: flatten the weight matrix row by row and cut every 64 numbers. Nothing adaptive, nothing chosen by value.
PyTorch stores a linear layer's weight as (out x in), so a row is one output neuron's input weights. 2,560 = 40 x 64, so each row splits into exactly 40 blocks, and a block never mixes two neurons. That matches the paper's normality check, done per hidden unit.
Each block gets its own scale c (its largest |w|), and that's what the next steps use. The toy uses blocks of 4 so the numbers fit on the slide.
Block size is a knob (bitsandbytes allows 32 to 4,096; QLoRA uses 64): smaller blocks fit better and contain outliers, but cost more scales.

--

## NF4 step 1: scale each block

<div class="two-col">
  <table class="rules roles">
    <tr><td></td><td>$w$</td><td>$w / c$</td></tr>
    <tr><td>$w_1$</td><td>0.0069</td><td>0.127</td></tr>
    <tr><td>$w_2$</td><td>0.0164</td><td>0.303</td></tr>
    <tr><td>$w_3$</td><td>0.0066</td><td>0.122</td></tr>
    <tr><td>$w_4$</td><td>−0.0261</td><td>−0.481</td></tr>
    <tr><td>$w_5$</td><td>0.0181</td><td>0.334</td></tr>
    <tr class="total"><td>$c$</td><td>0.0542</td><td>= max $|w|$ in the block</td></tr>
  </table>
  <div><img src="img/week-02-nf4-scale.svg" alt="One block of 64 weights on a number line in raw units around plus or minus 0.05, with c marked at the largest absolute weight, and the same dots after dividing by c spread over minus 1 to 1"></div>
</div>

<p class="footnote">Simulated block of 64 weights drawn from $\mathcal{N}(0, 0.02^2)$; the five in the table are the black dots</p>

Note:
Role of c: one number per block of 64 weights, the block's largest absolute value. Dividing by it maps every block onto the same [-1, 1] range, so one fixed table of 16 levels can serve every block in the model, whatever its original scale.
The weight with the largest |w| lands exactly on -1 or +1.
c is kept (32-bit, or 8-bit after double quantization): it's needed to undo the scaling later.

--

## NF4 step 2: round to a level, store its index

<div class="two-col">
  <table class="rules roles">
    <tr><td></td><td>$w / c$</td><td>nearest level</td><td>stored</td></tr>
    <tr><td>$w_1$</td><td>0.127</td><td>0.161</td><td>9</td></tr>
    <tr><td>$w_2$</td><td>0.303</td><td>0.338</td><td>11</td></tr>
    <tr><td>$w_3$</td><td>0.122</td><td>0.161</td><td>9</td></tr>
    <tr><td>$w_4$</td><td>−0.481</td><td>−0.525</td><td>2</td></tr>
    <tr><td>$w_5$</td><td>0.334</td><td>0.338</td><td>11</td></tr>
  </table>
  <div><img src="img/week-02-nf4-round.svg" alt="The scaled weights as dots on a line from minus 1 to 1, with the 16 NF4 levels drawn above them and numbered 0 to 15; lines connect five highlighted weights to their nearest level"></div>
</div>

<p class="footnote">Only the index (0–15) is stored: 4 bits per weight. The 16 levels themselves are one fixed table shared by the whole model</p>

Note:
Role of the index: each weight becomes a number from 0 to 15 saying which level it's closest to. That's the 4 bits.
Role of the level table: 16 fixed numbers in [-1, 1], the same for every block and every layer. They're the quantiles of N(0, 1), so they're denser near 0.
Different weights can share an index: w1 and w3 both become 9, w2 and w5 both 11. That's where the information is lost.

--

## NF4 step 3: multiply back

<div class="two-col">
  <table class="rules roles">
    <tr><td>stored per weight</td><td>4-bit index</td></tr>
    <tr><td>stored per block of 64</td><td>scale $c$</td></tr>
    <tr><td>stored once</td><td>the 16 NF4 levels</td></tr>
    <tr class="total"><td>recovered</td><td>$\hat w = c \cdot \text{level}[\text{index}]$</td></tr>
    <tr><td>$w_1$: 0.0069</td><td>→ 0.0087</td></tr>
    <tr><td>$w_4$: −0.0261</td><td>→ −0.0285</td></tr>
    <tr><td>block mean error</td><td>0.0012 (max 0.0045)</td></tr>
  </table>
  <div><img src="img/week-02-nf4-back.svg" alt="Scatter of original weight against stored c times level for the 64 weights: points sit near the diagonal but on 16 horizontal steps, the only values a weight in this block can come back as"></div>
</div>

<p class="footnote">Each block can only return 16 distinct values: the horizontal steps are $c \times$ the NF4 levels</p>

Note:
To use a weight (every forward and backward pass in QLoRA), look up its level and multiply by the block's c. That's the dequantize step in the QLoRA equation, done in bf16 on the fly.
Points off the diagonal are the rounding error. Mean 0.0012 on weights of typical size 0.02.
LoRA's adapters then learn around this error: QLoRA's claim is that fine-tuning after quantization recovers the lost accuracy.

--

## Why NF4's levels, not INT4's

<div class="two-col">
  <table class="rules roles">
    <tr><td></td><td>NF4</td><td>INT4</td></tr>
    <tr><td>levels used by one block</td><td>14 / 16</td><td>11 / 15</td></tr>
    <tr><td>busiest level</td><td>9%</td><td>15%</td></tr>
    <tr><td>emptiest level</td><td>1.7%</td><td>1.2%</td></tr>
    <tr class="total"><td>mean error ($w/c$ units)</td><td>0.028</td><td>0.035</td></tr>
  </table>
  <div><img src="img/week-02-nf4-share.svg" alt="Share of weights landing on each level over 100,000 simulated blocks: NF4's inner levels each take a similar share of about 7 to 9 percent, while INT4's central levels take up to 15 percent and its outer levels almost nothing"></div>
</div>

<p class="footnote">100,000 simulated blocks of 64 from $\mathcal{N}(0, 0.02^2)$. NF4 spreads the weights more evenly over its levels, so each level carries more information</p>

Note:
Evenly spaced INT4 levels put as much resolution in the tails (few weights) as near zero (most weights): the centre levels are crowded and the outer ones nearly empty.
NF4's levels are quantiles of the normal, so the weights spread more evenly across them. The outermost levels are still light because each block's max is pinned to +-1 by the absmax scaling.
More even use = less rounding error: 0.028 vs 0.035 on average (20% less). That's the "information theoretically optimal for normal data" claim, on simulated weights.

--

## Why blocks of 64

<div class="two-col">
  <table class="rules roles">
    <tr><td>one weight</td><td>set to 0.5 (25σ)</td></tr>
    <tr><td>one $c$ for the whole matrix</td><td>$c = 0.5$: every other weight is squeezed near 0</td></tr>
    <tr><td>one $c$ per 64 weights</td><td>only the outlier's block is stretched</td></tr>
  </table>
  <div><img src="img/week-02-nf4-blocks.svg" alt="Mean error on the ordinary weights of a 4,096-weight matrix with one outlier: one scale for the whole tensor gives 0.0105 error using 4 of 16 levels; one scale per 64 weights gives 0.0016 using all 16 levels"></div>
</div>

<p class="footnote">Simulated 4,096 weights from $\mathcal{N}(0, 0.02^2)$ plus one outlier. Small blocks cost a scale per 64 weights, which double quantization shrinks</p>

Note:
LLMs have rare, very large weights and activations. With one scale for the whole matrix, c becomes the outlier's size, every ordinary weight divided by c lands near 0, and they all share the 4 middle levels: error goes up 6.6x.
With a scale per 64 weights, the outlier only ruins its own block; every other block gets its own c and uses all 16 levels.
The price is one scale per 64 weights: 0.5 extra bits per parameter at 32 bits each. That is the overhead double quantization (next slide) cuts to 0.127.

---

## Double quantization

<div class="full"><img src="img/week-02-dq-pipeline.svg" alt="Pipeline: the weight matrix W cut into blocks; the max of each block gives a smaller grid of scales c2; after subtracting their mean, the c2 grid is cut into groups and the max of each group gives a column of c1. Weights are stored as 4-bit NF4 indices (10,485,760 in W_q), c2 as 8-bit (163,840), c1 and the mean as 32-bit (640 plus 1)"></div>

<p class="footnote">The same step twice, cut into blocks and take the max: first on the weights ($c_2$), then on the scales ($c_1$). 4 + 0.125 + 0.002 = 4.127 bits per weight instead of 4.5</p>

Note:
Left to right: the weight matrix is cut into blocks (64 weights each; 4 in the toy). Each block's largest |w| is its scale c2: that's the NF4 step. Those scales form a new, smaller grid.
Double quantization does the same thing to that grid: subtract the mean of all the c2 (one number per weight matrix), cut it into groups (256 scales each; 8 in the toy), and take each group's max: that's c1.
Storage, bottom row: each weight keeps a 4-bit NF4 index, each c2 is stored in 8 bits relative to its group's c1, and the c1 and the mean stay 32-bit. The higher the level, the fewer numbers and the more bits each.
For layer 5's W_q: 10.5M weights, 163,840 c2, 640 c1, one mean. 4 + 8/64 + 32/(64*256) = 4.127 bits per weight, versus 4.5 with the c2 in 32 bits.

--

## Follow one block

<div class="full"><img src="img/week-02-dq-one-block.svg" alt="The same pipeline with one path highlighted: one block of 64 weights starting 0.0069, 0.0164, 0.0066, -0.0261; its scale c2 = max = 0.0542; its group's c1 = 0.02617 and the matrix mean 0.05194. The block stores 64 four-bit NF4 indices starting 9 11 9 2, one 8-bit value +0.089, and shares c1 and the mean"></div>

<p class="footnote">What one block of 64 weights costs: 64 × 4 bits + 8 bits for its scale + its share of $c_1$ and $\bar c_2$. The NF4 slides' block; values simulated</p>

Note:
The same pipeline, following one block. Its 64 weights (0.0069, 0.0164, ...) have largest |w| 0.0542: that's its c2.
That c2 is one of 256 scales in its group; the group's largest centred scale is c1 = 0.02617, and the whole matrix shares one mean, 0.05194.
What this block keeps: 64 four-bit indices (9, 11, 9, 2, ...), each pointing into the NF4 table, and one 8-bit number, +0.089, which stands for its scale: 0.02617 x 0.089 + 0.05194 = 0.0543.
Per block: 64 x 4 = 256 bits for the weights, 8 bits for the scale, plus a 1/256 share of a 32-bit c1. Without double quantization the scale alone would be 32 bits.

--

## DQ step 0: what gets stored

<div class="two-col">
  <table class="rules roles">
    <tr><td></td><td>stored as</td><td>bits per weight</td></tr>
    <tr><td>each weight</td><td>4-bit NF4 index</td><td>4</td></tr>
    <tr><td>each block scale $c_2$</td><td>8-bit $q_8$, relative to $c_1$</td><td>$8/64 = 0.125$</td></tr>
    <tr><td>$c_1$</td><td>FP32, one per 256 scales</td><td>$32/(64 \cdot 256) = 0.002$</td></tr>
    <tr><td>$\bar c_2$</td><td>FP32, one per weight matrix</td><td>≈ 0</td></tr>
    <tr class="total"><td></td><td>with double quantization</td><td>4.127</td></tr>
    <tr><td></td><td>scales kept in FP32</td><td>4.5</td></tr>
  </table>
  <div><img src="img/week-02-dq-worked.svg" alt="Tree of stored numbers, simulated: at the top two FP32 numbers, c1 = 0.02617 and the mean of the scales 0.05194; in the middle three 8-bit stored values +0.089, -0.116, -0.107 that stand for block scales 0.0542, 0.0488 and 0.0491; at the bottom each block's weights as 4-bit NF4 indices such as 9 11 9"></div>
</div>

<p class="footnote">Quantize the quantization constants: each block's scale $c_2$ is stored as 8 bits, $q_8 = (c_2 - \bar c_2) / c_1$, instead of 32. Values simulated</p>

Note:
Problem: every block of 64 weights carries a scale c2 (NF4's c). At 32 bits each that's 0.5 extra bits per weight: 4.5 bits instead of 4.
Idea: the scales are just numbers, so quantize them too. Subtract their mean (c2 bar), group them 256 at a time, give each group one FP32 scale c1, and store each c2 as an 8-bit value q8 relative to it.
Read the tree bottom to top: the weights are 4-bit indices; above each block, its scale is stored as a small 8-bit number (+0.089), which stands for the real scale 0.0542; at the top, two FP32 numbers make that translation possible.
Why the top gets the most bits: there are only 640 c1 in W_q but 10.5M weights, so bits are cheap at the top; and an error spreads downward: one c1 affects 256 blocks = 16,384 weights, one c2 affects 64, one index 1 weight.
Result: 4.127 bits per weight instead of 4.5. The next slides define c1 and c2, then walk through compressing and undoing it.
The paper says FP8 for the 8-bit scales; bitsandbytes uses its own dynamic 8-bit code; this example uses FP8 E4M3.

--

## DQ step 1: the scales add up

<div class="two-col">
  <table class="rules roles">
    <tr><td>one scale $c_2$</td><td>per block of 64 weights, 32 bits</td></tr>
    <tr><td>cost per weight</td><td>$32 / 64 = 0.5$ bits, on top of 4</td></tr>
    <tr><td>Qwen3-4B</td><td>56.8M scales</td></tr>
    <tr class="total"><td>in fp32</td><td>227 MB</td></tr>
  </table>
  <div><img src="img/week-02-dq-scales.svg" alt="Histogram of block scales c2 over many simulated blocks: all positive, clustered between about 0.03 and 0.1 around 0.05"></div>
</div>

<p class="footnote">Scales of simulated blocks of 64 weights from $\mathcal{N}(0, 0.02^2)$: always positive, in a narrow range</p>

Note:
Every block of 64 weights needs its scale c2 (the paper's name for NF4's c) to undo the scaling. At 32 bits each, that's 0.5 extra bits per weight: 12% on top of the 4-bit weights.
For Qwen3-4B's 3.63B linear-layer weights: 56.8M scales, 227 MB. At 65B parameters it's about 4 GB.
Look at the histogram: the scales are all positive and bunched in a narrow range. Numbers that similar don't need 32 bits each. That's the opening double quantization uses.

--

## DQ step 2: quantize the scales

<div class="two-col">
  <table class="rules roles">
    <tr><td>1. centre</td><td>subtract the mean of all $c_2$</td></tr>
    <tr><td>2. group</td><td>blocks of 256 scales</td></tr>
    <tr><td>3. scale</td><td>one FP32 $c_1$ per 256 (its absmax)</td></tr>
    <tr><td>4. store</td><td>each scale in 8 bits</td></tr>
    <tr class="total"><td>error added</td><td>0.29% of $c_2$ on average</td></tr>
  </table>
  <div><img src="img/week-02-dq-quant.svg" alt="Top: the scales after subtracting their mean, centred around zero. Bottom: histogram of the relative error of the 8-bit scales, almost all well under one percent"></div>
</div>

<p class="footnote">The same trick as NF4, one level up: the scales get their own blocks (256) and their own scales ($c_1$)</p>

Note:
It's quantization applied to the quantization constants. Step 1: the scales are all positive, so subtract their mean to centre them on 0 (one number per weight matrix), which lets a symmetric 8-bit code use both signs.
Steps 2-4: cut the centred scales into blocks of 256, give each block one FP32 scale c1 (its largest absolute value), and store each scale in 8 bits.
Error: on simulated scales, the 8-bit scales are off by 0.29% on average (max 4%). A 0.3% error in c nudges all 64 weights of a block by 0.3%, small next to NF4's own rounding. The paper saw no accuracy loss.
Implementation note: the paper says FP8; bitsandbytes uses its own "dynamic" 8-bit code (quantize_blockwise, blocksize 256) and subtracts the mean first (functional.py, compress_statistics). The simulation here uses FP8 E4M3.

--

## DQ step 3: undo it

<div class="big-math line small center">$$c_2 = c_1 \cdot q_8 + \bar c_2 = 0.02617 \times 0.089 + 0.05194 = 0.0543$$
$$w_1 = c_2 \cdot \text{NF4}[9] = 0.0543 \times 0.161 = 0.0087$$</div>

<div class="full short"><img src="img/week-02-dq-bits.svg" alt="Bits per parameter: bf16 16 bits; NF4 plus fp32 scales 4.5 bits; NF4 plus double quantization 4.127 bits"></div>

<p class="footnote">Two lookups per weight: first its block's scale, then its NF4 level. Block 1 and $w_1$ from the NF4 example; values simulated</p>

Note:
To use a weight, undo the two levels in order. First rebuild its block's scale from the stored 8-bit value: 0.02617 x 0.089 + 0.05194 = 0.0543 (the true scale was 0.0542, so double quantization moved it 0.1%). Then look up the weight's NF4 level and multiply: 0.0543 x 0.161 = 0.0087.
The true w1 was 0.0069. That gap is NF4's rounding (NF4 slides), not double quantization.
This is doubleDequant(c1, c2, W) in the QLoRA equation, done on the fly in bf16 every forward and backward pass.
Bit budget: 4 + 8/64 + 32/(64*256) = 4.127 bits per weight, versus 4.5 with FP32 scales and 16 for bf16. For Qwen3-4B's scales: 227 MB -> 58 MB.

---

## Paged optimizers

<div class="two-col">
  <table class="rules roles">
    <tr><td>what</td><td>the optimizer states (Adam $m$, $v$)</td></tr>
    <tr><td>when</td><td>the GPU runs out of memory mid-step</td></tr>
    <tr><td>where to</td><td>CPU RAM, paged back for the optimizer update</td></tr>
    <tr><td>how</td><td>NVIDIA unified memory: like RAM paging to disk</td></tr>
  </table>
  <div><img src="img/week-02-paged-optim.svg" alt="Schematic: memory needed over training steps stays under the GPU memory line except for two short spikes; the part of each spike above the line is paged to CPU RAM and back"></div>
</div>

<p class="footnote">Schematic. Optimizer states are "automatically evicted to CPU RAM when the GPU runs out-of-memory" (Dettmers et al. 2023, §3)</p>

Note:
Memory during training isn't flat: an unusually long sequence, or gradient checkpointing recomputing a layer, briefly spikes it. Without paging, one spike above the GPU limit is an out-of-memory crash, even if average use fits.
Paged optimizers allocate the optimizer states in NVIDIA unified memory. When the GPU runs out, pages move to CPU RAM automatically, and come back when the optimizer step needs them. Slower during the spike, but no crash.
With LoRA the optimizer states are small (only B, A), so this is a safety valve for spikes rather than a big saving. The paper's appendix: the 33B model "does not quite fit into a 24 GB" GPU and needs paged optimizers.
The plot is a schematic, not a measurement.

--

## Why memory spikes

<div class="two-col">
  <table class="rules roles">
    <tr><td>most steps</td><td>abstract-length inputs</td><td>≈ 7 GB</td></tr>
    <tr><td>now and then</td><td>a long document in the batch</td><td>up to 26 GB</td></tr>
    <tr class="total"><td>cause</td><td>activations grow with tokens</td><td>$\approx 34\,sbhL$</td></tr>
  </table>
  <div><img src="img/week-02-paged-spikes.svg" alt="Simulated memory over 300 training steps of QLoRA on Qwen3-4B: most steps near 7 GB, with a handful of spikes up to about 26 GB crossing the 16 GB V100 line"></div>
</div>

<p class="footnote">Simulated: QLoRA on Qwen3-4B, r = 8, batches of 4 sequences, ~1% of them 2.5K–4K tokens. Memory = 2.65 GB weights + LoRA state + activations</p>

Note:
Memory per step is not constant: it depends on how many tokens are in the batch, because activations scale with tokens (34 s b h L). Most abstracts are a few hundred tokens: about 7 GB a step. When a long document lands in a batch, that step alone needs far more.
One step over the limit is an out-of-memory crash, even if the average fits easily. Gradient checkpointing also produces short spikes when it recomputes a layer.
That's the failure paged optimizers were built for.

--

## How paging works

<div class="two-col">
  <table class="rules roles">
    <tr><td>allocate</td><td>optimizer states in CUDA unified memory</td></tr>
    <tr><td>GPU full</td><td>the driver moves their pages to CPU RAM</td></tr>
    <tr><td>before the update</td><td>prefetch them back to the GPU</td></tr>
    <tr class="total"><td>turn it on</td><td><code>optim="paged_adamw_8bit"</code></td></tr>
  </table>
  <div><img src="img/week-02-paged-how.svg" alt="Diagram: GPU memory holds the 4-bit weights, a large block of activations during a spike, and a few pages of Adam state; other Adam pages have been evicted to CPU RAM and are prefetched back for the optimizer update"></div>
</div>

<p class="footnote">bitsandbytes: states allocated with <code>cudaMallocManaged</code>, prefetched before each step. Also <code>paged_adamw_32bit</code></p>

Note:
Like an operating system paging RAM to disk, one level up: GPU memory to CPU RAM.
The optimizer states (Adam m, v) are allocated in CUDA unified memory, which both the GPU and CPU can address. When the GPU runs out mid-step, the driver evicts pages to CPU RAM instead of crashing; the forward/backward pass keeps running.
The optimizer only needs its states at the update, so right before it, bitsandbytes prefetches them back to the GPU (optimizer.py, prefetch_state). Moving pages over PCIe is slow, but it only happens on the rare spike steps.
In Hugging Face Trainer it's one argument: optim="paged_adamw_32bit" or "paged_adamw_8bit" (8-bit Adam states, a further saving).

--

## Does paging help us?

<div class="two-col">
  <table class="rules roles">
    <tr><td>our spike</td><td>≈ 10 GB over the V100</td></tr>
    <tr><td>paging can free</td><td>the Adam states: 132 MB</td></tr>
    <tr class="total"><td>for QLoRA on a V100</td><td>not enough: cap length, checkpoint</td></tr>
    <tr><td>full fine-tuning</td><td>32 GB of states: paging matters</td></tr>
  </table>
  <div><img src="img/week-02-paged-size.svg" alt="Adam states that paging could move to CPU: 132 MB for QLoRA at r equals 8, 32 GB for full fine-tuning of Qwen3-4B"></div>
</div>

<p class="footnote">Paging only moves optimizer states. With LoRA they're tiny, so the activation spike itself has to be controlled</p>

Note:
Critical point for our setup: paging can only move the optimizer states. With LoRA r = 8 on Qwen3-4B those are 16.5M params x 8 bytes (m, v in fp32) = 132 MB. Our simulated spike overshoots the V100 by ~10 GB. Paging frees about 1% of that.
So for QLoRA on a V100, the spikes must be handled at the source: gradient checkpointing (store layer inputs only), a maximum sequence length, or grouping batches by length so a long document doesn't share a batch.
Where paging does matter: when optimizer states are big relative to the headroom, e.g. full fine-tuning (32 GB of Adam states for 4B params) or the paper's 33B model, which "does not quite fit into a 24 GB" GPU without paged optimizers (App. memory footprint).
Good reviewer question for the paper: paged optimizers are presented as one of three QLoRA innovations, but for LoRA-sized states their effect is a safety margin, not a capacity gain.

---

## QLoRA: 4-bit storage, 16-bit compute

<div class="big-math line center">$$Y = X\,\underbrace{\text{doubleDequant}\big(c_1, c_2, W^{\text{NF4}}\big)}_{\text{bf16, on the fly}} + X L_1 L_2$$</div>

<table class="rules steps">
  <tr><td>$W$</td><td>stored as NF4 with double-quantized scales</td><td>frozen, no gradient</td></tr>
  <tr><td>compute</td><td>bf16: each layer is dequantized for the forward and backward pass</td><td>no 4-bit arithmetic</td></tr>
  <tr><td>$L_1, L_2$</td><td>LoRA adapters in bf16</td><td>the only weights updated</td></tr>
  <tr><td>optimizer</td><td>Adam states for $L_1, L_2$, in paged memory</td><td>spills to CPU on spikes</td></tr>
</table>

<p class="footnote">"QLoRA has one storage data type (usually 4-bit NormalFloat) and a computation data type (16-bit BrainFloat)" (Dettmers et al. 2023, §3)</p>

Note:
The three pieces together, for one linear layer (the paper's eq. 5). L1, L2 are the paper's names for LoRA's B and A.
There is no 4-bit arithmetic: weights sit in memory as NF4 and are dequantized to bf16 one layer at a time for the matmul, forward and backward. 4-bit saves storage, not compute (it's actually a bit slower).
doubleDequant: first dequantize the FP8 scales c2 with c1, then the weights with c2.
Gradients flow through the dequantized W to reach adapters in earlier layers, but W itself gets no gradient. Only L1, L2 are updated.

---

## Does 4-bit lose accuracy?

<div class="two-col">
  <div class="big-math line">$$\overline{\Delta}_{\text{NF4}} = -0.05$$
  $$\overline{\Delta}_{\text{FP4}} = -0.85$$</div>
  <div><img src="img/week-02-qlora-accuracy.svg" alt="MMLU points versus BF16 for eight settings of LLaMA 7B to 65B adapters on Alpaca and FLAN v2: NF4 scatters around zero with a mean of -0.05, FP4 is mostly below zero with a mean of -0.85"></div>
</div>

<p class="footnote">Mean 5-shot MMLU, LLaMA 7B–65B adapters on Alpaca and FLAN v2 (Dettmers et al. 2023, Table 4)</p>

<p class="gloss"><b>MMLU</b>: a 57-subject multiple-choice exam. <b>Alpaca</b>, <b>FLAN v2</b>: instruction datasets used for fine-tuning. <b>5-shot</b>: 5 worked examples in the prompt</p>

Note:
Each row is one model size and dataset; the dot is how many MMLU points the 4-bit version gains or loses against BF16 LoRA.
NF4 + double quantization scatters around zero: mean -0.05. FP4 sits mostly below: mean -0.85. So the format matters, and NF4's normal-shaped levels are what recover 16-bit quality.
Not uniform: NF4 is 1.1 below on 7B FLAN v2 and 1.3 below on 33B FLAN v2, and 1.4 above on 65B FLAN v2. "Matches 16-bit" holds on average.
Rounding note: the printed NF4 cells average to 52.99; the paper's Mean column says 53.1, likely from unrounded scores.
Also in §4: 16-, 8- and 4-bit adapters all match full 16-bit fine-tuning on GLUE and Super-NaturalInstructions (125M-3B). And "it is beneficial to increase the number of parameters in the base model while decreasing their precision": a bigger 4-bit model beats a smaller 16-bit one at the same memory.
For us: all of this is instruction tuning and MMLU. Nothing here tests structured extraction, so our first mini project should keep a bf16 LoRA control.

---

## What does it take to train with QLoRA?

<div class="two-col">
  <table class="rules">
    <tr><td>weights $W_0$</td><td>$|W| \times 0.52$ bytes$^{*}$</td></tr>
    <tr><td>gradients</td><td>$(|B| + |A|) \times 2$ bytes</td></tr>
    <tr><td>fp32 copy</td><td>$(|B| + |A|) \times 4$ bytes</td></tr>
    <tr><td>Adam $m$</td><td>$(|B| + |A|) \times 4$ bytes</td></tr>
    <tr><td>Adam $v$</td><td>$(|B| + |A|) \times 4$ bytes</td></tr>
    <tr class="total"><td></td><td>$|W| \times 0.52 + (|B| + |A|) \times 16$ bytes</td></tr>
    <tr><td>activations</td><td>$\approx 34\,sbhL$ bytes</td></tr>
  </table>
  <div><img src="img/week-02-qlora-training-memory.svg" alt="Memory to QLoRA fine-tune Qwen3-4B at r=8: 9.3 GB at batch 1 and 15.8 GB at batch 2 both fit under the 16 GB V100 line; 28.6 GB at batch 4 and 54.3 GB at batch 8 do not; dotted outlines show plain LoRA at 14.7 to 59.6 GB"></div>
</div>

<p class="footnote">*4 bits + 0.127 bits of scales per linear-layer weight; embeddings and norms stay bf16, so Qwen3-4B's weights take 2.65 GB instead of 8 GB</p>

Note:
Only the weights row changes from the LoRA slide: 2 bytes/param becomes 4.127 bits = 0.52 bytes/param for the 3.63B linear-layer weights. The 389M-param embedding table and the norms stay bf16. Total 2.65 GB.
Result for Qwen3-4B on a 16 GB V100: batch 1 = 9.3 GB, batch 2 = 15.8 GB fit; batch 4 does not. Plain LoRA only fit batch 1.
Activations are now the biggest item. QLoRA §2: on LLaMA-7B at batch 1, LoRA parameters take 26 MB but LoRA input gradients take 567 MB, and the 4-bit base 5,048 MB. "gradient checkpointing is important", and shrinking LoRA further "yields only minor memory benefits", which is also why adding adapters to every layer is nearly free.
This is our first mini project's setup: QLoRA on Qwen3-4B on 16 GB V100s, with gradient checkpointing to push the batch further.

--

## QLoRA caveats

<table class="rules steps">
  <tr><td>scale</td><td>not shown to match full 16-bit fine-tuning at 33B and 65B, only 16-bit LoRA</td><td>authors, §7</td></tr>
  <tr><td>evaluation</td><td>MMLU and chatbot benchmarks; results track how similar the training data is to the benchmark</td><td>authors, §7</td></tr>
  <tr><td>normality</td><td>7.5% of LLaMA-7B neurons fail a normality test (≈ 2.5 points above chance)</td><td>authors, appendix</td></tr>
  <tr><td>speed</td><td>dequantizing every layer on every pass: 4-bit saves memory, not time</td><td>our read</td></tr>
  <tr class="total"><td>for us</td><td>no structured-extraction task tested; V100s lack bf16, so compute in fp16</td><td>our read</td></tr>
</table>

<p class="footnote">Also untested by the authors: 3-bit bases and adapters other than LoRA</p>

Note:
Scale: at 33B and 65B they compare against 16-bit LoRA, not full fine-tuning, because full fine-tuning at that size was too expensive.
Evaluation: their own observation that benchmark scores depend on how close the fine-tuning data is to the benchmark (FLAN v2 and MMLU).
Normality: NF4's levels assume normal weights; most are, but not all.
Speed: every forward and backward pass dequantizes each layer from NF4 to 16-bit, so QLoRA training is somewhat slower than 16-bit LoRA.
For our first mini project: extraction is a structured-output task, unlike anything in the paper, so keep a 16-bit LoRA control. And V100s have no bf16 hardware, so the compute type must be fp16 (bf16 needs an A100 or newer, such as a B200).

---

## DoRA (Liu et al. 2024)

<div class="two-col wide-right">
  <table class="rules roles opener">
    <tr><td>problem</td><td>a gap remains between LoRA and full fine-tuning</td></tr>
    <tr><td>finding</td><td>LoRA changes length and direction together</td></tr>
    <tr><td>idea</td><td>train length $m$ directly; LoRA only turns</td></tr>
    <tr><td>trains</td><td>$B, A$ + one length per neuron</td></tr>
    <tr><td>memory</td><td>+6.7% parameters; extra norm each step</td></tr>
    <tr class="total"><td>performance</td><td>+1.0 to +4.4 over LoRA (commonsense)</td></tr>
  </table>
  <div><img src="img/week-02-dora-block.svg" alt="LoRA and DoRA side by side: LoRA adds the trainable low-rank B A to the frozen W0; DoRA takes W0 plus B A, divides by its norm to get unit-length directions, and multiplies by a trainable magnitude m, one per neuron"></div>
</div>

<p class="footnote">Diagram after Liu et al. 2024, Fig. 1: grey = frozen, black = trained. Merges into one matrix after training</p>

Note:
Why it exists: LoRA usually trails full fine-tuning a little, and the usual explanation is "too few parameters". DoRA argues it's also about what kind of change LoRA can make.
The diagram: LoRA is W0 + BA. DoRA takes the same W0 + BA, normalises each neuron to unit length (so BA only sets directions), and multiplies by a trainable length m.
Next slides: the magnitude/direction split, the evidence that LoRA couples them, the update and its gradients, what it costs, results, and caveats.

---

## DoRA: magnitude and direction

<div class="two-col">
  <div class="big-math line">$$W = \underbrace{m}_{\text{length}} \cdot \underbrace{\frac{V}{\|V\|}}_{\text{direction}}$$</div>
  <div><img src="img/week-02-dora-decomp.svg" alt="Schematic in 2-D: three neuron weight vectors w1, w2, w3 drawn as arrows from the origin, with a dashed unit circle; for w1 the arrow's length is labelled m1 = norm of w1 = 2.02 and the point where it crosses the unit circle is its direction w1 over its norm"></div>
</div>

<p class="footnote">One length per output neuron (the paper's column-wise norm; PEFT: each row of the out × in weight). Drawn in 2-D (Liu et al. 2024)</p>

Note:
Every output neuron of a linear layer has a vector of incoming weights (one row of W in PyTorch's out x in layout). Any vector can be written as a length times a unit direction.
So the whole matrix splits into m, one length per neuron (4,096 numbers for Qwen3-4B's W_q), and V/||V||, the unit directions (the rest of the matrix, rescaled so every row has length 1).
The paper borrows this from Weight Normalization (Salimans and Kingma 2016), which trains networks from scratch in this form. DoRA's twist: start from the pretrained weights, so m = ||W0|| and V = W0 at step 0.
Notation: the paper writes W in R^{d x k} with a column-wise norm ||.||_c. In PEFT's (out x in) weight that's the norm over each row (dora.py, dim=1): one magnitude per output neuron.
Next: why separating the two parts matters for fine-tuning.

---

## LoRA couples length and direction

<div class="two-col">
  <table class="rules roles">
    <tr><td>$\Delta M$</td><td>mean change in each neuron's length $m$</td></tr>
    <tr><td>$\Delta D$</td><td>mean $1 - \cos$ between old and new directions</td></tr>
    <tr class="total"><td>full fine-tuning</td><td>big turn with small stretch, or the reverse</td></tr>
    <tr><td>LoRA</td><td>turn and stretch always move together</td></tr>
  </table>
  <div><img src="img/week-02-dora-corr.svg" alt="Correlation between direction change and magnitude change across layers and training steps: full fine-tuning -0.62, LoRA +0.83, DoRA -0.31"></div>
</div>

<p class="footnote">Measured on the query and value matrices of VL-BART across layers and training steps (Liu et al. 2024, §3.2 and §4.1)</p>

<p class="gloss"><b>VL-BART</b>: a vision-and-language model (images + text). <b>Correlation</b> across layers and checkpoints, one point each</p>

Note:
The authors split the pretrained, fully fine-tuned, and LoRA-merged weights into magnitude and direction, and measured for each layer and checkpoint how much each changed.
Full fine-tuning: negative correlation (-0.62). A layer either turns a lot and barely stretches, or stretches a lot and barely turns.
LoRA: strong positive correlation (+0.83). Direction and length change together, in proportion. The authors read this as LoRA lacking "the nuanced capability" of full fine-tuning.
So the gap between LoRA and full fine-tuning isn't only about the number of trainable parameters; it's also about what kinds of change the update can express.
DoRA (-0.31) moves back toward full fine-tuning's pattern. Caveat: this analysis is one model (VL-BART) on image-text tasks, and only a correlation summary is reported.

--

## Measuring ΔM and ΔD

<div class="two-col">
  <div class="big-math line small">$$\Delta M^t = \frac{1}{k}\sum_{n=1}^{k} \big|\, m^{n,t} - m_0^{n} \big|$$
  $$\Delta D^t = \frac{1}{k}\sum_{n=1}^{k} \Big(1 - \cos\big(V^{n,t},\, W_0^{n}\big)\Big)$$</div>
  <div><img src="img/week-02-dora-measure.svg" alt="Schematic of one neuron's weight vector before (w0, grey) and after fine-tuning (wt, black): the angle between them gives Delta D = 1 minus cosine, and the difference in length, drawn as a dimension line, gives Delta M"></div>
</div>

<p class="footnote">Averaged over the $k$ neurons of a matrix, at training step $t$; one point per layer and checkpoint (Liu et al. 2024, eqs. 3–4)</p>

Note:
For each neuron n: Delta M is how much its length changed, |m_t - m_0|; Delta D is how much it turned, 1 - cosine between the new and old direction (0 = same direction). Average over the k neurons of the matrix.
Each (Delta D, Delta M) pair is one layer at one checkpoint; the correlation on the previous slide is across those points.
Full fine-tuning: layers that turn a lot stretch little, and vice versa (negative correlation). LoRA: the two go together (positive).

---

## The DoRA update

<div class="two-col">
  <div class="big-math line">$$W' = \underline{m}\;\frac{W_0 + \underline{BA}}{\|W_0 + \underline{BA}\|}$$</div>
  <div><img src="img/week-02-dora-update.svg" alt="Schematic: the pretrained vector w0 becomes w' by two separate changes, a rotation along the unit circle labelled direction from BA and a stretch along w' labelled length from m"></div>
</div>

<p class="footnote">Underlined = trained. $m$ starts at $\|W_0\|$ and $BA$ at 0, so $W' = W_0$ at step 0; after training it merges into one matrix. PEFT: <code>use_dora=True</code></p>

Note:
Two knobs instead of one. BA (plain LoRA) changes the direction: W0 + BA is renormalised to unit length per neuron, so BA can only rotate. m changes the length, directly, one trainable number per neuron (4,096 for W_q, on top of LoRA's 53K).
Initialisation: m = ||W0|| and B = 0, so the model starts exactly at the pretrained weights. After training, compute W' once and replace W0: no inference cost, same as LoRA.
Why it trains better (§4.2): the gradient reaching BA is rescaled by m/||V'|| and projected away from the current weight, which the authors (following Weight Normalization) argue makes optimisation more stable.
Cost (§4.3): the norm ||W0 + BA|| makes backprop heavier; they treat it as a constant in the backward pass, cutting training memory by 24% on LLaMA-7B for a 0.2-point accuracy change.
In PEFT: LoraConfig(use_dora=True).

--

## DoRA worked example

<table class="rules steps">
  <tr><td>$W_0$</td><td>neuron 1: (0.6, 0.8, 0) · neuron 2: (0, 0.3, 0.4)</td><td></td></tr>
  <tr><td>$m_0 = \|W_0\|$</td><td>lengths 1.0 and 0.5</td><td>start of $m$</td></tr>
  <tr><td>$BA$</td><td>adds (0, 0, 0.2) to neuron 1 only</td><td>$r = 1$</td></tr>
  <tr><td>$\frac{W_0 + BA}{\|W_0 + BA\|}$</td><td>neuron 1 turns to (0.588, 0.784, 0.196)</td><td>11.3°, $\Delta D = 0.019$</td></tr>
  <tr><td>$m$ (trained)</td><td>1.2 and 0.5</td><td>$\Delta M = 0.2$</td></tr>
  <tr class="total"><td>$W'$</td><td>neuron 1: (0.706, 0.941, 0.235) · neuron 2 unchanged</td><td>length exactly 1.2</td></tr>
  <tr><td>plain LoRA</td><td>$W_0 + BA$: neuron 1 length 1.0198</td><td>turning also stretched it</td></tr>
</table>

<p class="footnote">A toy layer with 2 neurons and 3 inputs. After training, $W'$ is stored as an ordinary matrix</p>

Note:
Start: two neurons with lengths 1.0 and 0.5; those lengths are the initial m.
BA (rank 1) adds 0.2 to neuron 1's third input weight. DoRA renormalises W0 + BA per neuron, so this only turns neuron 1 by 11.3 degrees; its length is not touched.
Separately, training moved neuron 1's magnitude m from 1.0 to 1.2. So W' = 1.2 x the new unit direction, length exactly 1.2.
Plain LoRA with the same BA: W0 + BA has neuron 1 at length 1.0198. The turn dragged the length along, and there is no separate knob to undo that. That's the coupling from two slides back, in numbers.

--

## What each part learns

<div class="two-col">
  <div class="big-math line small">$$\nabla_{m}\mathcal{L} = \frac{\nabla_{W'}\mathcal{L} \cdot V'}{\|V'\|}$$
  $$\nabla_{V'}\mathcal{L} = \frac{m}{\|V'\|}\Big(I - \frac{V'V'^{\top}}{\|V'\|^2}\Big)\nabla_{W'}\mathcal{L}$$</div>
  <div><img src="img/week-02-dora-grad.svg" alt="Schematic: the gradient on W' for one neuron splits into a component along the neuron's direction, which goes to the magnitude m, and a component across it at a right angle, which goes to V' = W0 + BA and so to B and A"></div>
</div>

<p class="footnote">$V' = W_0 + BA$, per neuron (Liu et al. 2024, eqs. 6–7). Checked against autograd: $\nabla_{V'}\mathcal{L}$ is perpendicular to $V'$ to within $10^{-6}$</p>

Note:
These are the update rules: Adam then steps m, B, and A using these gradients (the gradient w.r.t. V' is the gradient w.r.t. BA, since W0 is frozen).
Magnitude: gets the part of the ordinary gradient that points along the neuron's current direction. "Should this neuron get longer or shorter?"
Direction: gets the part perpendicular to the neuron (the bracket is a projection that removes the along-direction part), scaled by m/||V'||. So B and A can only turn the neuron, never stretch it.
The authors (following Weight Normalization) argue this projection plus rescaling makes the gradient better conditioned and training more stable.
Detached-norm version (§4.3), used in practice: treat ||V'|| as a constant C in backprop, so the direction gradient becomes (m/C) times the ordinary gradient. It saves memory at a 0.2-point accuracy cost (next slide).

--

## What DoRA costs

<table class="rules steps">
  <tr><td>trainable parameters</td><td>LoRA's $B, A$ + one magnitude per output neuron</td><td>Qwen3-4B, r = 8: 16.5M + 1.1M (+6.7%)</td></tr>
  <tr><td>training compute</td><td>the norm $\|W_0 + BA\|$ every step, through the full matrix</td><td>more work per step than LoRA</td></tr>
  <tr><td>training memory</td><td>norm detached from backprop (§4.3)</td><td>37.3 → 28.2 GB, accuracy 78.3 → 78.1</td></tr>
  <tr class="total"><td>inference</td><td>merge $W' = m\,\frac{W_0 + BA}{\|W_0 + BA\|}$ once</td><td>no extra cost</td></tr>
</table>

<p class="footnote">Memory: LLaMA-7B, batch 16 (Liu et al. 2024, Table 5, which compares DoRA with and without the trick, not with LoRA)</p>

Note:
Parameters: the magnitudes are tiny, one per output neuron: for Qwen3-4B's seven projections x 36 layers that's 1.1M, +6.7% on top of LoRA's 16.5M at r = 8.
Compute: unlike LoRA, DoRA can't just add BA x on the side: it needs the per-neuron norm of W0 + BA every step, which touches the whole matrix. With QLoRA that means dequantizing W0 for the norm too.
Memory: backprop through that norm is expensive; detaching it cuts LLaMA-7B training from 37.3 to 28.2 GB (-24.4%) for a 0.2-point accuracy change.
Reviewer point: the published cost table compares DoRA to itself. A LoRA row exists in the source but is commented out; it showed DoRA using more memory than LoRA (48.7 vs 45.5 GB on LLaMA-13B).
Inference: after training compute W' once; it's an ordinary matrix, so no latency, same as LoRA.

---

## Does DoRA help?

<div class="two-col">
  <table class="rules roles">
    <tr><td></td><td>LoRA</td><td>DoRA</td><td>gain</td></tr>
    <tr><td>LLaMA-7B</td><td>74.7</td><td>78.4</td><td>+3.7</td></tr>
    <tr><td>LLaMA-13B</td><td>80.5</td><td>81.5</td><td>+1.0</td></tr>
    <tr><td>LLaMA2-7B</td><td>77.6</td><td>79.7</td><td>+2.1</td></tr>
    <tr><td>LLaMA3-8B</td><td>80.8</td><td>85.2</td><td>+4.4</td></tr>
  </table>
  <div><img src="img/week-02-dora-results.svg" alt="Average accuracy on 8 commonsense tasks for LoRA, DoRA at half rank, and DoRA on four LLaMA models: DoRA is higher than LoRA on every model, by 1.0 to 4.4 points, and DoRA at half the rank also beats LoRA"></div>
</div>

<p class="footnote">Average over 8 commonsense reasoning tasks, same rank as LoRA; grey squares: DoRA at half the rank (Liu et al. 2024, Table 1)</p>

<p class="gloss"><b>Commonsense tasks</b>: 8 multiple-choice reasoning benchmarks (e.g. BoolQ yes/no questions, HellaSwag sentence completion)</p>

Note:
Same rank, same trainable-parameter budget (DoRA adds only the magnitudes, +0.01%). DoRA wins on all four models, by 1.0 to 4.4 points.
DoRA at half the rank (grey squares) still beats LoRA everywhere; on LLaMA2-7B it even beats full-rank DoRA (80.5 vs 79.7).
They also report gains on image/video-text (VL-BART) and visual instruction tuning (LLaVA), and that DoRA drops into QLoRA ("QDoRA").
Fairness detail: DoRA's learning rate was tuned; LoRA used the configuration from prior work. See the next slide.

--

## DoRA caveats

<div class="two-col">
  <table class="rules roles">
    <tr><td>baseline</td><td>LoRA below chance at some ranks (BoolQ 2.3%)</td></tr>
    <tr><td>tuning</td><td>DoRA's LR tuned; LoRA config copied</td></tr>
    <tr><td>diagnosis</td><td>ΔD/ΔM on one model (VL-BART)</td></tr>
    <tr><td>memory</td><td>cost table compares DoRA with itself</td></tr>
    <tr class="total"><td>limitations</td><td>none stated beyond "try audio"</td></tr>
  </table>
  <div><img src="img/week-02-dora-rank.svg" alt="Average accuracy versus rank on LLaMA-7B: DoRA sits near 78 from r = 8 to 32 and 72 at 64; LoRA is near 40 at r = 4 and 8, 71 to 75 at 16 and 32, and 66 at 64. Labels mark 4, 3 and 1 tasks below chance for LoRA at r = 4, 8 and 64, and 1 for DoRA at r = 4"></div>
</div>

<p class="footnote">Below-chance accuracy means training or the answer format broke, not that the model can't learn the task (Liu et al. 2024, Table 7)</p>

Note:
Baseline: in the rank table, LoRA at r = 4 and 8 averages ~40%, with BoolQ at 2.3% and HellaSwag at 11.8%, far below the 50% and 25% you'd get by guessing. That's a broken run, not a capacity limit. It also clashes with the LoRA paper, where rank barely mattered. So part of DoRA's "consistently surpasses LoRA across all ranks" may be LoRA runs failing.
Tuning: DoRA's learning rate was tuned; LoRA's configuration was taken from prior work, and a commented-out line in the source says the baseline scores were "directly cited".
Diagnosis: the length/direction coupling (+0.83 vs -0.62) is measured on VL-BART image-text tasks, one model, and reported only as a correlation summary.
Memory: the cost table compares DoRA with and without its detached-norm trick; a LoRA row exists in the source but is commented out (it showed DoRA using more memory than LoRA: 48.7 vs 45.5 GB on LLaMA-13B).
Limitations: the paper states none beyond future work on audio, so this slide is our reviewer contribution.
For our first mini project: if we compare LoRA and DoRA, give both the same learning-rate sweep and check for below-chance results before believing a gap.

---

## LongLoRA (Chen et al. 2024)

<div class="two-col">
  <table class="rules roles opener">
    <tr><td>problem</td><td>extending context is costly: attention grows as $n^2$</td></tr>
    <tr><td>idea 1</td><td>train with shifted sparse attention (S²-Attn)</td></tr>
    <tr><td>idea 2</td><td>LoRA plus trainable embeddings and norms</td></tr>
    <tr><td>trains</td><td>$B, A$ in attention, embeddings, norms</td></tr>
    <tr><td>memory</td><td>≈ LoRA; time 56.6% of LoRA at 64K</td></tr>
    <tr class="total"><td>performance</td><td>Llama2 7B → 100K, 70B → 32K on 8 A100s</td></tr>
  </table>
  <div><img src="img/week-02-longlora-arch.svg" alt="One decoder block in LongLoRA: the embedding and both norms are trained, attention is frozen with a trainable LoRA added and uses shifted sparse attention during training, and the feed-forward layer is frozen"></div>
</div>

<p class="footnote">Diagram after Chen et al. 2024, Fig. 2: black = trained, grey = frozen. Uses Position Interpolation to stretch RoPE (next week)</p>

Note:
Why it exists: models are pretrained at a fixed context (Llama2: 4K). Using longer documents means fine-tuning at longer contexts, where attention's n^2 cost dominates and plain LoRA falls short of full fine-tuning.
Two ideas. S2-Attn: during training only, attend within shifted groups of tokens, cutting attention cost 4x; at test time the model uses normal full attention. LoRA+: plain LoRA can't close the long-context gap at any rank, so also train the embedding layer and the norms.
The diagram shows one block: embedding and norms trained, attention frozen with LoRA added, feed-forward frozen.
Positions: stretching the context also needs RoPE positions interpolated, which LongLoRA takes from Position Interpolation (Chen et al. 2023). That's next week's reading.

---

## LongLoRA: long context is expensive

<div class="two-col">
  <div class="big-math line">$$\text{attention cost} \propto n^2$$
  $$\text{S}^2\text{-Attn, 4 groups:}\;\; 4 \times \Big(\frac{n}{4}\Big)^2 = \frac{n^2}{4}$$</div>
  <div><img src="img/week-02-longlora-flops.svg" alt="Training FLOPs per sequence for Llama2 7B at 8K, 16K, 32K and 64K context: attention grows from 35 to 2,252 TFLOPs with full attention and from 9 to 563 with S2-Attn; totals 144 to 3,118 TFLOPs full versus 117 to 1,429 with S2-Attn"></div>
</div>

<p class="footnote">Llama2 7B, one sequence, forward pass; attention is 24.5% of compute at 8K and 72.2% at 64K, 39.4% with S²-Attn (Chen et al. 2024, appendix)</p>

<p class="gloss"><b>FLOPs</b>: floating-point operations (multiply-adds), the usual measure of compute. <b>$n$</b>: number of tokens in the context</p>

Note:
Goal of LongLoRA: extend a pretrained model's context window (e.g. Llama2's 4K to 32K or 100K) cheaply.
Every other layer costs n (linear in tokens); attention compares every token with every other, n^2. Doubling the context doubles FFN cost but quadruples attention: at 64K, attention is 72% of all compute.
S2-Attn splits the sequence into 4 groups and attends only within a group during training: 4 groups x (n/4)^2 = n^2/4. Attention FLOPs drop exactly 4x (2,252 -> 563 TFLOPs at 64K).
The rest of LongLoRA is LoRA, plus training embeddings and norms (two slides on).
Position: long context also needs the positional encoding stretched. LongLoRA uses Position Interpolation on RoPE, which is next week's topic.

---

## Shifted sparse attention (S²-Attn)

<div class="full"><img src="img/week-02-longlora-steps.svg" alt="S2-Attn step by step with 8 tokens and 4 attention heads: the inputs; split the heads into two halves; shift the second half by half a group so token 8 wraps to the top; attend within groups of 2, giving groups 1-2, 3-4 and so on in the left heads and 8-1, 2-3 and so on in the right heads"></div>

<p class="footnote">After Chen et al. 2024, Fig. 3: 8 tokens, 4 heads, groups of $G = 2$. Two lines of code: roll half the heads by $G/2$, attend in groups, roll back (Alg. 1)</p>

Note:
Step by step, as in the paper's figure. Rows are tokens, columns are attention heads.
1. Split the heads into two halves.
2. In the second half, shift the tokens by half a group (G/2): token 8 wraps round to the top.
3. Cut the sequence into groups and attend only within each group. Left heads see groups {1,2}, {3,4}, ...; right heads see {8,1}, {2,3}, {4,5}, ...
Because the right heads' groups straddle the left heads' group borders, information crosses between groups inside every layer, and spreads across the whole sequence over many layers. The cost is the same as plain groups: 4 groups of n/4 tokens -> n^2/4.
Implementation (Algorithm 1): split qkv along the head dimension, roll the second half by -G/2 along the sequence, reshape into groups, run standard attention (FlashAttention works unchanged), roll back.
Only for training. At inference the model uses normal full attention, so it is still a standard Llama.

--

## The attention masks

<div class="two-col">
  <table class="rules roles">
    <tr><td>left heads</td><td>causal attention inside each group</td></tr>
    <tr><td>right heads</td><td>same, groups shifted by $G/2$</td></tr>
    <tr><td>the wrapped group</td><td>last $G/2$ + first $G/2$ tokens</td></tr>
    <tr class="total"><td>as coded</td><td>first tokens attend to the last (grey)</td></tr>
  </table>
  <div><img src="img/week-02-longlora-masks.svg" alt="Two 16 by 16 attention masks, toy example with groups of 4: left, block-diagonal causal blocks for half the heads; right, blocks shifted by 2 tokens for the other half, where the wrapped last group lets tokens 0 and 1 see tokens 14 and 15, marked in grey"></div>
</div>

<p class="footnote">Masks computed from the paper's pseudocode: roll by $-G/2$, causal attention in each group, roll back. The paper's Fig. 2 draws the wrapped block bottom-left instead</p>

Note:
Which query attends to which key, toy example with 16 tokens and groups of 4. Left: plain groups, causal inside each block. Right: the same blocks shifted by 2 tokens.
The last shifted group wraps round the end of the sequence: it holds tokens 14, 15, 0, 1. In the rolled order used by the code, tokens 0 and 1 come after 14 and 15, so causal attention lets tokens 0 and 1 attend to tokens 14 and 15, i.e. to the future (grey cells, top right).
The paper's Figure 2 draws that wrapped block bottom-left (last tokens attending to the first, which would be legal). Its pseudocode produces the top-right version. A small training-time leak, in one group per sequence, and gone at inference where attention is full.
Reviewer question for the authors: does masking that block (or not wrapping) change results?

--

## Why the shift

<div class="two-col">
  <table class="rules roles">
    <tr><td></td><td>8K</td><td>16K</td><td>32K</td></tr>
    <tr><td>full attention</td><td>8.02</td><td>8.05</td><td>8.04</td></tr>
    <tr><td>groups only</td><td>8.29</td><td>8.83</td><td>9.47</td></tr>
    <tr class="total"><td>S²-Attn</td><td>8.04</td><td>8.03</td><td>8.08</td></tr>
  </table>
  <div><img src="img/week-02-longlora-pilot.svg" alt="Perplexity versus context length: full attention flat near 8.0; attention in groups only rises from 8.29 at 8K to 9.47 at 32K; S2-Attn stays flat near 8.0, matching full attention"></div>
</div>

<p class="footnote">Perplexity on PG19 (lower is better), Llama2 7B fully fine-tuned, tested at the training length (Chen et al. 2024, Table 1)</p>

<p class="gloss"><b>Perplexity</b>: how surprised the model is by the true next token, $e^{\text{average loss}}$; lower = better. <b>PG19</b>: a corpus of long books</p>

Note:
The authors' pilot: train with full attention, with groups only (1/4 of the context each), or with shifted groups. Test perplexity at the same length.
Groups only gets worse as context grows (8.29 -> 9.47): tokens far apart never interact. Adding the shift brings it back to full attention (8.08 vs 8.04 at 32K) at the cost of groups.
Also tested (Table 3): models trained with S2-Attn but tested with full attention do better (8.12) than tested with S2-Attn (8.64); other sparse patterns like dilated attention break when switched back to full attention (11.78). The shift keeps the model compatible with standard attention.

---

## LoRA isn't enough for long context

<div class="two-col">
  <table class="rules roles">
    <tr><td>LoRA, any rank</td><td>11.4 – 12.0</td></tr>
    <tr><td>+ train norms</td><td>10.49</td></tr>
    <tr><td>+ train embeddings</td><td>8.29</td></tr>
    <tr class="total"><td>+ both ("LoRA+")</td><td>8.12, vs 8.08 full FT</td></tr>
  </table>
  <div><img src="img/week-02-longlora-lora.svg" alt="Perplexity at 32K context: LoRA at ranks 8 to 256 stays between 11.44 and 11.98; adding trainable norms gives 10.49, trainable embeddings 8.29, both 8.12, close to full fine-tuning at 8.08"></div>
</div>

<p class="footnote">Llama2 7B with S²-Attn at 32K; norms are 0.004% of the parameters (Chen et al. 2024, Table 2)</p>

Note:
With plain LoRA the long-context model is far worse than full fine-tuning (11.4 vs 8.1 perplexity), and raising the rank from 8 to 256 doesn't help at all; it gets slightly worse.
What closes the gap: also train the embedding layer and the normalization layers, which LoRA normally freezes. Norms alone help a bit (10.49); embeddings most (8.29); both reach 8.12, almost full fine-tuning.
Norms are tiny (0.004% of Llama2 7B); the embedding table is not (it's a full vocab x hidden matrix), so "LoRA+" trains noticeably more parameters than LoRA.
Connects to the two-knobs slide: here the missing capacity isn't rank or which projections, it's two parameter groups outside the attention/MLP matrices altogether.
Naming: this "LoRA+" is not the same as the later LoRA+ of Hayou et al. (different learning rates for A and B).

---

## What LongLoRA buys

<div class="two-col">
  <table class="rules roles">
    <tr><td>Llama2 7B</td><td>4K → 100K context</td></tr>
    <tr><td>Llama2 13B</td><td>4K → 64K</td></tr>
    <tr><td>Llama2 70B</td><td>4K → 32K</td></tr>
    <tr class="total"><td>hardware</td><td>one 8 × A100 machine</td></tr>
  </table>
  <div><img src="img/week-02-longlora-eff.svg" alt="Training hours and GPU memory versus context length for Llama2 7B: LongLoRA takes 52 hours at 64K versus 93 for LoRA, while full fine-tuning runs out of memory; memory for LongLoRA and LoRA is nearly identical, 26 to 70 GB"></div>
</div>

<p class="footnote">Llama2 7B, 1,000 steps on 8 × A100 with FlashAttention-2; at 64K LongLoRA needs 56.6% of LoRA's hours (Chen et al. 2024, appendix)</p>

Note:
Time: S2-Attn cuts attention compute 4x, so training at 64K takes 52 hours instead of 93 for plain LoRA (56.6%). Full fine-tuning doesn't fit at all at 64K.
Memory: almost the same as plain LoRA (69.8 vs 71.1 GB at 64K). The authors say why: FlashAttention-2 already avoids storing the attention matrix, so the FLOP savings barely touch memory. The big memory win is LoRA's, not S2-Attn's.
Results: Llama2 7B extended to 100K, 13B to 64K, 70B to 32K on one 8xA100 machine; perplexity improves with longer context (7B: 2.72 -> 2.50 on proof-pile going 8K -> 32K), and passkey retrieval works to ~33K.
Limitations: perplexity at short contexts degrades a bit after extension (a known cost of Position Interpolation, which the authors note); evaluation is mostly perplexity and retrieval, not long-document reasoning.
For our first mini project: our abstracts are a few hundred tokens, so LongLoRA isn't needed. It matters if we move to full papers.


---

## Does LongLoRA work?

<div class="two-col">
  <table class="rules roles">
    <tr><td>trained at</td><td>2K eval</td><td>longest eval</td></tr>
    <tr><td>8K</td><td>3.20</td><td>2.72 at 8K</td></tr>
    <tr><td>32K</td><td>3.35</td><td>2.50 at 32K</td></tr>
    <tr class="total"><td>100K</td><td>3.36</td><td>2.52 at 100K</td></tr>
  </table>
  <div><img src="img/week-02-longlora-ppl.svg" alt="Perplexity versus evaluation context length for Llama2 7B trained with LongLoRA at 8K, 16K, 32K and 100K: every model improves as the evaluation context grows up to its training length, reaching about 2.5; models trained longer are slightly worse at 2K (3.35 versus 3.20)"></div>
</div>

<p class="footnote">Perplexity on proof-pile (lower is better), Llama2 7B with S²-Attn + LoRA+ (Chen et al. 2024, Tables 4–5)</p>

<p class="gloss"><b>Proof-pile</b>: long mathematical documents. Each line is one model, evaluated on windows up to its training length</p>

Note:
What is learned: the extended models actually use the extra context. Perplexity keeps falling as the evaluation window grows up to the training length: the 32K model goes from 2.78 at 8K to 2.50 at 32K; the 100K model reaches 2.52 at 100K.
Cost at short context: models trained longer are slightly worse on short inputs (2K: 3.20 for the 8K model, 3.35 for the 32K model, vs 3.14 for full-attention fine-tuning at 8K). The authors attribute this to Position Interpolation.
Also reported: passkey retrieval (find a number hidden in a long document) works up to ~33K for the 32K model, and topic retrieval on LongChat matches a fully fine-tuned 13B model.
Against full attention and full fine-tuning at the same length, LongLoRA is close (e.g. 2.66 vs 2.68 at 8K for the 16K model with and without LoRA+).

--

## LongLoRA caveats

<table class="rules steps">
  <tr><td>short context</td><td>perplexity at 2K gets worse after extension (3.14 → 3.35)</td><td>authors: Position Interpolation</td></tr>
  <tr><td>memory</td><td>almost none saved over LoRA; FlashAttention-2 already avoids the $n^2$ matrix</td><td>authors, appendix</td></tr>
  <tr><td>leak</td><td>as coded, the wrapped shifted group lets early tokens see late ones</td><td>our read of Alg. 1</td></tr>
  <tr><td>evaluation</td><td>mostly perplexity and retrieval, little long-document reasoning</td><td>our read</td></tr>
  <tr class="total"><td>LoRA+</td><td>trains the whole embedding table, far more than LoRA's adapters</td><td>our read</td></tr>
</table>

<p class="footnote">Not to be confused with LoRA+ of Hayou et al. 2024 (different learning rates for $A$ and $B$)</p>

Note:
Short context: extending the window costs a little on short inputs, a known side effect of Position Interpolation that the authors acknowledge.
Memory: S2-Attn saves compute (time), not memory, when FlashAttention-2 is used; the big memory saving comes from LoRA. Without FlashAttention the saving is larger (full attention runs out of memory at 16K on 8 A100s).
Leak: from their pseudocode, the wrapped group lets the first G/2 tokens attend to the last G/2 during training (the masks sub-slide).
Evaluation: perplexity, passkey and topic retrieval test whether the model can use distant tokens, not whether it can reason over a long document.
LoRA+: the embedding table is vocabulary x hidden (32K x 4096 for Llama2 7B, ~131M parameters), much bigger than the LoRA adapters, so "LoRA+" is less parameter-efficient than the name suggests.
For our first mini project: our abstracts are a few hundred tokens, so LongLoRA isn't needed; it matters if we move to full papers.

---

## ReFT (Wu et al. 2024)

<div class="two-col">
  <table class="rules roles opener">
    <tr><td>problem</td><td>LoRA-style methods edit weights; meaning lives in hidden states</td></tr>
    <tr><td>idea</td><td>learn an edit of hidden states at a few positions</td></tr>
    <tr><td>uses</td><td>LoReFT: edit inside the subspace spanned by $R$ ($r$ directions)</td></tr>
    <tr><td>trains</td><td>$R, W, b$ per edited layer; model frozen</td></tr>
    <tr><td>parameters</td><td>0.031% of LLaMA-7B (LoRA: 0.83%)</td></tr>
    <tr class="total"><td>performance</td><td>best on commonsense; below LoRA on math</td></tr>
  </table>
  <div><img src="img/week-02-reft-graph.svg" alt="LoReFT compute graph: from the hidden state h, compute W h plus b minus R h, an edit of r numbers; map it back with R transpose and add it to a copy of h to get Phi(h)"></div>
</div>

<p class="footnote">Diagram after Wu et al. 2024, Fig. 1 (right): black = trained. The edit can't be merged into the weights</p>

Note:
Why it exists: interpretability work finds that concepts often live in linear subspaces of hidden representations, and editing those subspaces changes behaviour. Every PEFT so far edits weights instead. ReFT learns the edit directly.
The graph: from the hidden state h, compute the target Wh + b and the current value Rh, both r numbers; their difference is the edit; R^T maps it back to d dimensions and it's added to h.
Next slides: where the edits go, the subspace geometry, where the idea comes from, how few parameters, results, what one intervention can hold, and caveats.

---

## ReFT: edit representations, not weights

<div class="two-col">
  <table class="rules roles">
    <tr><td></td><td>LoRA</td><td>ReFT</td></tr>
    <tr><td>changes</td><td>weights $W$</td><td>hidden states $h$</td></tr>
    <tr><td>where</td><td>every token</td><td>a few positions</td></tr>
    <tr><td>frozen</td><td>$W_0$</td><td>the whole model</td></tr>
    <tr class="total"><td>after training</td><td>merge into $W$</td><td>stays a separate edit</td></tr>
  </table>
  <div><img src="img/week-02-reft-where.svg" alt="Two grids of prompt tokens by layers: for LoRA every cell is grey because the new weights act on every token at every layer; for ReFT only the first two and last two token columns are black, the positions where hidden states are edited"></div>
</div>

<p class="footnote">Schematic: 12 prompt tokens, 6 layers. ReFT edits the residual stream after chosen layers, at the first $p$ and last $s$ prompt tokens (Wu et al. 2024, §3.3–4)</p>

<p class="gloss"><b>Hidden state</b> $h$: the vector a layer outputs for one token. <b>Residual stream</b>: the running sum of those vectors that every layer reads and writes</p>

Note:
Every method so far changes weights. ReFT (representation fine-tuning) keeps every weight frozen and instead learns a small function that edits the hidden representation h (the residual stream) at chosen layers and token positions during the forward pass.
The motivation comes from interpretability: concepts are often encoded in linear subspaces of h, and editing that subspace changes behaviour. So why not learn the edit directly?
Where: the first p and last s tokens of the prompt (7 + 7 in their LLaMA runs), at all layers or a subset. Generated tokens are not edited. Later tokens still see the edits through attention.
Consequence: unlike LoRA, the edit can't be folded into the weights; it runs as a small extra step at those positions, a fixed cost that doesn't grow with prompt length.
This is Wu, Arora, Wang, Geiger, Jurafsky, Manning, Potts (Stanford), NeurIPS 2024.

---

## LoReFT: edit inside a subspace

<div class="two-col">
  <div class="big-math line">$$\Phi(h) = h + R^{\top}\big(\underbrace{Wh + b}_{\text{target}} - \underbrace{Rh}_{\text{current}}\big)$$</div>
  <div><img src="img/week-02-reft-subspace.svg" alt="2-D worked example with r = 1: the subspace is a dashed line; h has coordinate Rh = 1.17 along it; the learned target is Wh + b = 1.90; Phi(h) is h moved parallel to the line so its coordinate becomes 1.90, with the perpendicular part unchanged"></div>
</div>

<p class="footnote">$R \in \mathbb{R}^{r \times d}$ with orthonormal rows, $W \in \mathbb{R}^{r \times d}$, $b \in \mathbb{R}^{r}$; only these are trained. Worked example: $d = 2$, $r = 1$ (Wu et al. 2024, eq. 2)</p>

Note:
R picks an r-dimensional subspace of the d-dimensional hidden state (rank r, orthonormal rows). Rh is where h currently sits in that subspace.
Wh + b is a learned target: where h should sit in the subspace, computed from h itself.
R^T(target - current) moves h only inside the subspace, by exactly the difference. Everything outside the subspace is untouched.
Worked example (d = 2, r = 1): h's coordinate along R is 1.17; the target is 1.90; Phi(h) slides h parallel to R until its coordinate is 1.90. The perpendicular part of h doesn't change.
LoReFT = Low-rank Linear Subspace ReFT. In their runs r = 8 and d = 4096: an 8-dimensional edit of a 4,096-dimensional vector.

--

## What R is

<table class="rules steps">
  <tr><td>$R \in \mathbb{R}^{r \times d}$</td><td>$r$ directions in the $d$-dimensional hidden space, one per row: unit length, mutually perpendicular</td><td>$RR^{\top} = I_r$</td></tr>
  <tr><td>$Rh$</td><td>read: $h$'s $r$ coordinates along those directions</td><td>$0.866 \cdot 0.6 + 0.5 \cdot 1.3 = 1.17$</td></tr>
  <tr><td>$Wh + b - Rh$</td><td>the edit: target coordinates minus current ones</td><td>$1.90 - 1.17 = 0.73$</td></tr>
  <tr><td>$R^{\top}(\cdot)$</td><td>write: turn $r$ coordinates back into a $d$-dimensional vector</td><td>$0.73 \cdot (0.866, 0.5) = (0.633, 0.365)$</td></tr>
  <tr class="total"><td>$R\,\Phi(h)$</td><td>$= Rh + RR^{\top}(Wh + b - Rh) = Wh + b$: lands exactly on the target</td><td>$R\,\Phi(h) = 1.90$</td></tr>
</table>

<p class="footnote">Numbers from the 2-D example: $d = 2$, $r = 1$, $R = (\cos 30°, \sin 30°)$, $h = (0.6, 1.3)$. In the paper $d = 4096$ and $r = 8$: eight directions</p>

Note:
R is a set of r directions in hidden-state space, stacked as rows. "Orthonormal" means each row has length 1 and the rows are perpendicular, so R R^T = I (the r x r identity).
Reading: R h is h's coordinates along those r directions (a dot product per row). Here one direction at 30 degrees: h's coordinate along it is 1.17.
The edit: the learned target W h + b (here 1.90) minus the current coordinate: 0.73.
Writing: R^T turns those r numbers back into a full d-dimensional vector along the same directions, (0.633, 0.365), which is added to h.
Why it lands exactly: R Phi(h) = R h + R R^T (target - R h) = target, because R R^T = I. And any direction perpendicular to all rows of R is untouched.
R itself is learned (kept orthonormal during training), so training chooses which subspace to edit as well as what to write there.

--

## Where LoReFT comes from

<table class="rules steps">
  <tr><td>interchange intervention</td><td>$h + R^{\top}(R\,s - R\,h)$</td><td>copy a subspace from another input's state $s$</td></tr>
  <tr><td>LoReFT</td><td>$h + R^{\top}(W h + b - R\,h)$</td><td>learn what to write: $Rs \to Wh + b$</td></tr>
  <tr class="total"><td>DiReFT (ablation)</td><td>$h + W_2^{\top}(W_1 h + b)$</td><td>drop orthogonality: LoRA applied to $h$</td></tr>
</table>

<p class="footnote">Distributed interchange intervention (Geiger et al.), used in interpretability to test where a concept lives in a network (Wu et al. 2024, eqs. 1–3)</p>

Note:
Interpretability background: to test whether a concept is encoded in a subspace, run the model on input b and on a counterfactual input s, and swap the subspace R of b's hidden state for s's. If the output changes as the concept predicts, the concept lives there.
LoReFT keeps that operation but replaces the counterfactual source Rs with a learned linear function Wh + b, so the swap steers the model toward the task instead of toward another input.
DiReFT drops the orthogonal R and the subtraction: h + W2^T(W1 h + b). That's exactly LoRA's low-rank form, applied to hidden states instead of weights. Faster to train, slightly worse.
The paper frames all of these as one family: an intervention = (function Phi, positions P, layer l), and a ReFT method = a set of non-overlapping interventions.

---

## How few parameters?

<div class="two-col">
  <table class="rules roles">
    <tr><td>per layer</td><td>$R, W$: $2rd$, $b$: $r$</td></tr>
    <tr><td>LLaMA-7B, paper</td><td>2.1M = 0.031% (LoRA 0.83%)</td></tr>
    <tr><td>knobs</td><td>positions $p, s$; layers; rank; tied</td></tr>
    <tr class="total"><td>inference</td><td>small extra step, can't merge</td></tr>
  </table>
  <div><img src="img/week-02-reft-params.svg" alt="Trainable parameters for Qwen3-4B: LoReFT at rank 8 on all 36 layers 1.47 million, LoRA on q and v at rank 8 2.95 million, LoRA on all seven projections at rank 8 16.5 million"></div>
</div>

<p class="footnote">Qwen3-4B counts computed from its config ($d$ = 2,560, 36 layers); paper setting: $p = s = 7$, tied, $r = 8$, all layers (Wu et al. 2024, appendix)</p>

Note:
The parameters don't depend on the weight matrices at all, only on the hidden size d: R and W are r x d each, plus an r-vector b, per intervened layer. Prefix and suffix positions share (tie) one intervention.
Their LLaMA-7B setting (p = s = 7, tied, r = 8, all 32 layers, d = 4096): 32 x (2 x 8 x 4096 + 8) = 2.10M parameters, 0.031% of the model. LoRA in the same comparison: 0.83%, 26x more.
For our Qwen3-4B (d = 2560, 36 layers): LoReFT 1.47M vs LoRA on all seven projections 16.5M (11x), or 2x fewer than q, v-only LoRA.
The catch is the search space: which positions (p, s), which layers, what rank, tied or not, on top of the usual learning rate and epochs. Their own guidance: intervene on multiple positions, start with all layers, rank below 32, tie weights.
Inference: the edit stays a separate operation at p + s positions. It can't be merged into the weights the way LoRA or DoRA can.

--

## Where to intervene?

<div class="two-col">
  <table class="rules roles">
    <tr><td>positions</td><td>first $p$ and last $s$ prompt tokens</td></tr>
    <tr><td>layers</td><td>a few, or all</td></tr>
    <tr><td>tied</td><td>prefix and suffix share one $\Phi$: half the parameters</td></tr>
    <tr><td>rank</td><td>$r$ = 1 to 8 won</td></tr>
    <tr class="total"><td>chosen by</td><td>grid search on a dev set, per task family</td></tr>
    <tr><td>generation</td><td>new tokens unedited: cost only when filling the KV cache</td></tr>
  </table>
  <div><img src="img/week-02-reft-configs.svg" alt="Chosen intervention locations in three settings. Commonsense and arithmetic on LLaMA-7B: first 7 and last 7 prompt tokens at all 32 layers. Instruction following on LLaMA-7B: first 5 and last 5 tokens at layers 3, 9, 18 and 24. GLUE on RoBERTa-base: first 3 tokens only, at all 12 layers"></div>
</div>

<p class="gloss">KV cache: the stored keys and values of the prompt, computed once and reused for every generated token</p>

<p class="footnote">Search grids and winners from the appendix tables (Wu et al. 2024); commonsense reuses the GSM8K search; GLUE is tuned per task ($p$1–$p$11, $p$3 on 5 of 8)</p>

Note:
Four location knobs (paper, sec. 4 / appendix): p prefix positions, s suffix positions, the set of layers, tied or untied. Only prompt tokens are edited. The last tokens feed the first generated token directly; the first tokens are attended to by everything after them.
Because the number of edited positions is fixed, the extra inference cost does not scale with prompt length (their words), and generated tokens run through the unmodified model, so the overhead is paid only while populating the KV cache (their inference appendix).
How the values were picked: a grid search on a development set, not a principled procedure. GSM8K dev (last 300 training examples) for LoReFT on LLaMA-7B searched p1+s1 to p11+s11, tied or not, r in 8-64, four layer sets; the winner p7+s7, tied, r = 8, all layers was reused for commonsense. Alpaca: p5+s5, tied, r = 4, layers 3;9;18;24. GLUE: each task separately, prefix only, r = 1.
The winners differ across families, so expect a fresh search per new task family.
Their own heuristics (appendix): multiple positions beat one; start with all layers and shrink; rank below 32 (e.g. 4); tie as much as you can; tune learning rate etc. last.

--

## Search, not interpretability

<table class="rules roles">
  <tr><td>motivation</td><td>interpretability: DAS finds a subspace at a hypothesized location</td></tr>
  <tr><td>practice</td><td>locations found by brute-force grid search</td></tr>
  <tr><td>check</td><td>do the searched locations land on a discovered circuit?</td></tr>
  <tr><td>choose</td><td>pick layers and positions by patching or circuits instead</td></tr>
  <tr><td>test</td><td>does that match the searched config with less tuning?</td></tr>
  <tr class="total"><td>link</td><td>a discovered circuit is a map of where to intervene</td></tr>
</table>

<p class="gloss">DAS (distributed alignment search): learn a rotation that finds the subspace carrying a concept. Activation patching: copy one activation from another input and see if the output changes</p>

<p class="footnote">Rows 3–6 are future work we propose, not in the paper; LoReFT builds on DAS (Geiger et al. 2023; Wu et al. 2023)</p>

Note:
The irony: LoReFT's form comes straight from interpretability (DAS and causal abstraction learn a low-rank rotated subspace and intervene on it), but where to put the intervention is decided by hyperparameter search on dev accuracy.
Future work 1 (check): take the grid-searched ReFT locations and ask whether they land on the components a circuit-discovery method identifies for the same task. If they do, the search was rediscovering the circuit; if not, that is interesting too.
Future work 2 (choose): use interpretability tools to choose the locations. Run activation patching (or attribution patching) on the task, rank (layer, position) sites by causal effect, and put interventions there. Then compare with the grid-searched configuration: same accuracy? fewer runs? fewer parameters?
If a circuit-discovery method finds the components a task relies on, that circuit is a map of where interventions should go, and ReFT becomes a test of whether the circuit is right: edits on the circuit should beat edits off it at matched parameters.
This is our proposal; the paper does not test it.

---

## Does ReFT help?

<div class="two-col">
  <table class="rules roles">
    <tr><td></td><td>LoRA</td><td>LoReFT</td></tr>
    <tr><td>commonsense, LLaMA-7B</td><td>74.7</td><td>80.2</td></tr>
    <tr><td>commonsense, Llama-3 8B</td><td>80.8</td><td>86.6</td></tr>
    <tr class="total"><td>arithmetic, LLaMA-7B</td><td>46.9</td><td>42.6</td></tr>
    <tr><td>arithmetic, LLaMA-13B</td><td>51.1</td><td>49.6</td></tr>
  </table>
  <div><img src="img/week-02-reft-results.svg" alt="Average accuracy: on commonsense reasoning LoReFT is highest on all four LLaMA models, above LoRA, DoRA and DiReFT; on arithmetic reasoning LoReFT and DiReFT are below LoRA on both LLaMA-7B and LLaMA-13B"></div>
</div>

<p class="footnote">Averages over 8 commonsense and 4 arithmetic tasks; baselines copied from the DoRA and LLM-Adapters papers, ReFT averaged over 3 seeds (Wu et al. 2024, Tables 1–2)</p>

Note:
Commonsense: LoReFT is best on all four LLaMA models with ~0.03% trainable parameters, 25x fewer than LoRA. They also report state of the art on instruction following (Alpaca-Eval) and GLUE.
Arithmetic: LoReFT is worse than LoRA on both models (42.6 vs 46.9 on LLaMA-7B; on GSM8K 26.0 vs 37.5). Multi-step reasoning with long generations is where editing a few prompt positions falls short; the authors note it.
So "15-65x more parameter-efficient" holds on some task types, not all.


---

## What can one intervention hold?

<table class="rules steps">
  <tr><td>setup</td><td>one rank-1 edit, one layer, last prompt token; LLaMA-7B</td><td>4,097 parameters</td></tr>
  <tr><td>a long passage</td><td>recalls the first 2,048 tokens of <i>Alice in Wonderland</i> exactly, at most layers</td><td>100% match</td></tr>
  <tr><td>harder text</td><td>scrambled word order or random tokens: much worse recall</td><td>helped by pretraining</td></tr>
  <tr class="total"><td>many items</td><td>a lookup table of 256 input → output pairs in one edit (13B, layer 20)</td><td>near-perfect</td></tr>
</table>

<p class="footnote">4,097 parameters ≈ 17.5 KB. LLaMA-13B recalls up to 2,560 tokens (Wu et al. 2024, appendix)</p>

Note:
What is learned, probed with memorisation: a single rank-1 intervention (one direction in a 4,096-dimensional hidden state, 4,097 numbers) at one layer, on the last prompt token, trained to make the model generate a fixed passage.
It recovers 2,048 tokens of Alice's Adventures in Wonderland word for word; LLaMA-7B breaks down past 2,048 (its pretraining length), the 13B model reaches 2,560.
Scrambled Alice or random tokens are much harder: the edit is steering the model toward text it already knows rather than storing 2,048 tokens from scratch.
And "how many": one rank-1 edit can hold a 256-entry lookup table of random IDs to single tokens.
The authors' reading: a tiny subspace edit has a lot of control over the model. Their argument for interpretability: a subspace spread across many neurons can steer the whole model, a problem for interpreting neurons one at a time.

--

## ReFT caveats

<table class="rules steps">
  <tr><td>arithmetic</td><td>below LoRA on both models; GSM8K 26.0 vs 37.5 (LLaMA-7B)</td><td>task-dependent</td></tr>
  <tr><td>baselines</td><td>copied from other papers, not rerun; the DoRA row reads 78.1, the DoRA paper says 78.4</td><td>not like-for-like</td></tr>
  <tr><td>search space</td><td>positions, layers, rank, tying, on top of the usual training settings</td><td>their stated limitation</td></tr>
  <tr><td>models</td><td>LLaMA family only</td><td>their stated limitation</td></tr>
  <tr class="total"><td>to their credit</td><td>tuned on dev sets, not test; reran with LoRA's epochs and still led on commonsense</td><td>appendix</td></tr>
</table>

<p class="footnote">The paper criticises PEFT work that tunes on test sets ("hill-climbs performance on test sets"), which includes the baselines it compares against (Wu et al. 2024, §6)</p>

<p class="gloss"><b>GSM8K</b>: grade-school math word problems solved step by step</p>

Note:
Arithmetic: a clear loss to LoRA, which the paper reports. Editing a few prompt positions may not give enough control over long chains of generated reasoning.
Baselines: the LoRA/DoRA numbers are copied from the DoRA paper, and the copy doesn't even match (78.1 here vs 78.4 in DoRA's own table for LLaMA-7B). Different codebases and tuning, so the margins are indicative.
Search: which positions and layers is a new, large hyperparameter space; the authors list automating it as future work.
Scope: only LLaMA-family models were tested.
To their credit: they tune on development sets and explicitly criticise the PEFT literature for tuning on test sets. That criticism applies to the LoRA and DoRA numbers they compare against. And when rerun with LoRA's exact epochs and batch size, LoReFT still leads on commonsense.
For interpretability fans: the authors argue ReFT's success challenges interpreting individual neurons, since an 8-dimensional subspace spread across neurons can steer a whole model.

---

## Week 2 in one slide

<table class="rules steps overview">
  <tr><td></td><td>idea</td><td>Qwen3-4B</td><td>where it wins</td><td>watch out</td><td>in 2026</td></tr>
  <tr><td>LoRA</td><td>low-rank $BA$ beside frozen $W_0$</td><td>14.7 GB</td><td>small to medium data, RL</td><td>large data: code, math</td><td>the default</td></tr>
  <tr><td>QLoRA</td><td>LoRA on a 4-bit frozen model</td><td>9.3 GB</td><td>memory-bound</td><td>no bf16 on V100</td><td>default recipe</td></tr>
  <tr><td>DoRA</td><td>split $W$ into length × direction</td><td>≈ LoRA</td><td>small gains over LoRA</td><td>weak LoRA baselines</td><td>one flag, off</td></tr>
  <tr><td>LongLoRA</td><td>sparse shifted attention in training</td><td>≈ LoRA</td><td>stretching context</td><td>leak in pseudocode</td><td>faded</td></tr>
  <tr><td>ReFT</td><td>edit hidden states, not weights</td><td>&lt; LoRA</td><td>fewest parameters</td><td>worse on math</td><td>research code</td></tr>
</table>

<p class="center"><b>All five: freeze almost everything, learn a few well-placed numbers</b></p>

<p class="footnote">Memory: our estimates from the method slides (batch 1, 2,048 tokens). "Watch out": each method's caveat slide. "In 2026": next sub-slides</p>

Note:
One line per method. LoRA and QLoRA are what people actually run; DoRA is a cheap A/B test on top; LongLoRA and ReFT are mainly research references now.
The sub-slides cover: what production uses and why, what frontier labs do, how much data you need, how to check you're not leaving performance on the table, and why any of this works (intrinsic dimension vs intrinsic rank).

--

## What production uses

<table class="rules steps">
  <tr><td>LoRA</td><td>serving: many adapters share one base model on a GPU, swapped per request</td><td>vLLM; AWS 2026, incl. MoE</td></tr>
  <tr><td>QLoRA</td><td>"We recommend starting with QLoRA": NF4 + double quant set by the library</td><td>Unsloth, Axolotl</td></tr>
  <tr><td>DoRA</td><td><code>use_dora=True</code> in LoraConfig; default <code>False</code></td><td>HF PEFT</td></tr>
  <tr><td>LongLoRA</td><td>long context now comes from pretraining (Llama 3: 8K → 128K in 6 stages) or YaRN at inference (Qwen3: 32K × 4)</td><td>tech reports</td></tr>
  <tr><td>ReFT</td><td>research library (pyreft); servers are built for weight adapters</td><td>our reading</td></tr>
  <tr><td>recipe</td><td>all linear layers, rank 16–32, learning rate ~10× full FT's</td><td>Tinker docs</td></tr>
  <tr><td>serving speed</td><td>GPT-OSS 20B: 454% more output tokens/s, 87% lower time to first token (vLLM 0.15 vs 0.11)</td><td>vLLM blog 2026</td></tr>
  <tr class="total"><td>lesson</td><td>adapt all linear layers: attention-only LoRA underperforms MLP-only</td><td>Schulman et al. 2025</td></tr>
</table>

<p class="gloss"><b>MoE</b>: mixture of experts, only some MLP blocks run per token. <b>YaRN</b>: rescales RoPE positions to read longer inputs (Week 3)</p>

<p class="footnote">PEFT's default for Qwen3 is still q, v only; pass <code>target_modules="all-linear"</code>. Sources: vLLM docs and blog (2026-02-26), Unsloth guide, PEFT docs, Llama 3 and Qwen3 reports, "LoRA Without Regret"</p>

Note:
LoRA: a serving advantage the original paper didn't stress (it emphasised merging). With multi-LoRA, one base model sits on the GPU and each request brings its own small adapter. vLLM and AWS extended this to MoE models (GPT-OSS, Qwen3-MoE) in Feb 2026.
QLoRA: Unsloth's guide says "We recommend starting with QLoRA"; its loader and Axolotl's set NF4 and double quantization for you. The three paper tricks are now library flags.
DoRA: one flag in PEFT, off by default. Blog claims that frameworks turn it on by default are not what PEFT does. Treat it as something to A/B against LoRA.
LongLoRA: models now ship with long context. Llama 3 reached 128K by staged pretraining (about 800B tokens) after raising the RoPE base to 500,000; Qwen3 trains to 32K and uses YaRN at inference for 4x. Its lasting idea: unfreeze embeddings and norms.
ReFT: pyreft exists, but serving engines like vLLM load weight adapters; representation interventions need hooks in the forward pass. That's our reading, not a claim from a source.
Lesson: the LoRA paper adapted attention only (q, v). "LoRA Without Regret" (Thinking Machines, 2025): "Attention-only LoRA significantly underperforms MLP-only LoRA." Recipe: Tinker's primer defaults to rank 32 and says LoRA's best learning rate is about 10x full fine-tuning's (the blog measures 9.8x, roughly independent of rank).
Serving speed: the vLLM/AWS post reports the multi-LoRA kernels got much faster for MoE models between vLLM releases; that's an engineering number, not a method comparison.
For our mini-project: QLoRA in Unsloth or Axolotl with all-linear targets is the realistic start.

--

## What frontier labs use

<div class="two-col">
  <table class="rules roles">
    <tr><td>flagship</td><td>standard fine-tuning; no PEFT mentioned (Llama 3, DeepSeek-V3, Qwen3)</td></tr>
    <tr><td>as a service</td><td>Tinker: LoRA only, to "share the same pool of compute"; up to ~1T-parameter MoEs</td></tr>
    <tr><td>on device</td><td>Apple: small base + LoRA adapter per task (rank 16, tens of MB), swapped in memory</td></tr>
    <tr><td>developers</td><td>Apple 2025: train rank-32 adapters</td></tr>
    <tr><td>closed APIs</td><td>method not disclosed (OpenAI, Google)</td></tr>
    <tr class="total"><td>open</td><td>RL at rank 1 matches full FT: will RL move to adapters?</td></tr>
  </table>
  <div><img src="img/week-02-bits-per-weight.svg" alt="Bits per stored weight: bf16 16, QLoRA NF4 with double quantization 4.127, Apple on-device 2024 3.7, Apple server 2025 3.56, Apple on-device 2025 2"></div>
</div>

<p class="gloss">Apple's base models are stored below QLoRA's 4 bits; adapters "must be retrained with each new version of the base model"</p>

<p class="footnote"> Sources: tech reports, Tinker announcement and site, Apple ML research posts (2024, 2025), "LoRA Without Regret"; QLoRA 4.127 = 4 + 0.127 bits for constants</p>

Note:
Flagship training: the Llama 3, DeepSeek-V3 and Qwen3 reports describe ordinary fine-tuning ("we finetune the pre-trained language model using a standard cross entropy loss") and never mention LoRA or PEFT. They don't literally say "full-parameter", so we say "no PEFT mentioned". With a huge budget, capacity matters more than memory, and LoRA is known to fall behind on large datasets.
Tinker (Thinking Machines' fine-tuning service): LoRA only, on open models up to MoEs around 1T parameters (Kimi K2). Their reason is economic: many customers' runs share one pool of compute. Their docs say LoRA matches full FT for RL and small-to-medium supervised sets, worse on large ones.
Apple is the clearest frontier-scale PEFT user: the on-device model plus per-task LoRA adapters, a QLoRA-like design for phones. 2024: mixed 2/4-bit at 3.7 bits per weight on average. 2025: 2 bits per weight with quantization-aware training, and a toolkit for developers to train rank-32 adapters. Catch: adapters are tied to the base version.
OpenAI and Google have fine-tuning APIs but don't say what's underneath, so no claim either way.
Discussion question: much frontier post-training effort now goes into RL, and RL is where LoRA matches full FT even at rank 1. Whether labs move RL to adapters is open, a good question for Matteo.

--

## How much data?

<div class="two-col">
  <table class="rules roles">
    <tr><td>quality first</td><td>LIMA: 1,000 examples; QLoRA: 9k beat 450k</td></tr>
    <tr><td>capacity</td><td>LoRA params ≥ completion tokens</td></tr>
    <tr><td>so</td><td>more data needs more rank</td></tr>
    <tr><td>new skills</td><td>code, math: LoRA falls behind full FT</td></tr>
    <tr><td>RL</td><td>little information per episode: rank 1 is enough</td></tr>
    <tr><td>example*</td><td>2,000 answers × 300 tokens = 0.6M tokens</td></tr>
    <tr class="total"><td>so</td><td>$r$ = 1 on all 7 (2.1M) already clears it</td></tr>
  </table>
  <div><img src="img/week-02-lora-capacity.svg" alt="Trainable LoRA parameters for Qwen3-4B against rank on log axes: all seven matrices gives 2.1 million per unit of rank, 16.5 million at rank 8 and 66 million at rank 32; q and v only is about 5.6 times smaller"></div>
</div>

<p class="gloss"><b>Completion tokens</b>: the tokens the model is trained to produce (the answers, not the prompts)</p>

<p class="footnote">*Illustrative sizes, not a dataset. Rule of thumb from the Tinker docs; Qwen3-4B counts from its config. LIMA (Zhou et al. 2023), QLoRA §1, Biderman et al. 2024, Schulman et al. 2025</p>

Note:
Task first, method second. For narrow adaptation (a format, a style, a domain assistant) small curated sets work: LIMA aligned LLaMA-65B with 1,000 examples (Week 9 reading); QLoRA found 9k OASST1 samples beat a 450k FLAN v2 subsample for chat.
Capacity framing ("LoRA Without Regret"): LoRA does well when its trainable parameters exceed the information to be learned (they estimate about 2 bits per parameter). Tinker's practical version: pick a rank so LoRA parameters are at least the number of completion tokens. Qwen3-4B all-linear: r = 8 gives 16.5M, r = 32 (Tinker's default) 66M.
New knowledge or skills need much more data, and that's where LoRA loses: Biderman et al. 2024, code and math, 100K instruction pairs or 20B tokens of continued pretraining, "LoRA substantially underperforms full finetuning" at standard ranks.
RL: a policy-gradient episode gives only a few bits (a reward), so even rank 1 matches full FT.
Worked example (made-up sizes): 2,000 examples with 300-token answers is 0.6M completion tokens. Qwen3-4B all-linear LoRA has 2.06M parameters per unit of rank, so capacity isn't the binding constraint for a small SFT set; rank starts to matter for data in the tens of millions of tokens. That's why for small data people see little difference between r = 8 and r = 64.

--

## Are we doing as well as we can?

<table class="rules steps overview">
  <tr><td></td><td>how</td><td>asks</td><td>if it fails</td></tr>
  <tr><td>rank sweep</td><td>$r$ = 8, 16, 64, 256 (Qwen3-4B: 16.5M → 528M params)</td><td>capacity-limited?</td><td>raise rank, or full FT</td></tr>
  <tr><td>full FT, small model</td><td>LoRA vs full FT on a 0.5–1.5B model, same data</td><td>method gap?</td><td>expect a gap at 4B too</td></tr>
  <tr><td>prompt baseline</td><td>base + good prompt + few-shot; <code>disable_adapter()</code></td><td>worth training?</td><td>fix the data first</td></tr>
  <tr><td>learning curve</td><td>train on 25%, 50%, 100% of the data</td><td>data-limited?</td><td>collect more</td></tr>
  <tr><td>forgetting</td><td>a general benchmark (MMLU) beside the task</td><td>side effects?</td><td>lower LR, fewer epochs</td></tr>
  <tr><td>seeds</td><td>3+ seeds; report the spread, not the best</td><td>real or noise?</td><td>more seeds</td></tr>
  <tr class="total"><td>hygiene</td><td>held-out set deduplicated from training</td><td>leakage?</td><td>rebuild the split</td></tr>
</table>

<p class="gloss"><b>MMLU</b>: a broad multiple-choice exam across 57 subjects, a common "general knowledge" check. <b>LLM judge</b>: another model grading outputs; noisy and biased on its own</p>

<p class="footnote">A checklist we propose, not from one paper. For mini-project 1: a rank sweep plus a small full-FT comparison tests the LoRA paper's "is low rank enough?" directly</p>

Note:
Each check answers one question in the right column.
Rank sweep: if accuracy keeps rising with rank, LoRA is leaving performance on the table; if it plateaus early, LoRA is fine.
Full FT at small scale: full FT on Qwen3-4B won't fit our V100s, but on a 0.5-1.5B model it will. If LoRA matches full FT there on our data, that's decent evidence the gap is small at 4B.
Prompt baseline: a fine-tune that only matches a good prompt isn't worth it. PEFT's disable_adapter() context manager runs the base model with the adapter switched off, so the A/B is one line.
Learning curve: flat means the bottleneck is quality, rank or learning rate, not quantity.
Forgetting: LoRA forgets less than full FT (Biderman et al. 2024), but a big drop on a general benchmark means overfitting or a too-high learning rate.
Hygiene: small-data fine-tunes are noisy, so run seeds and report spread (our AGENT_PROTOCOL standards apply).

--

## Why does it work at all?

<div class="two-col">
  <table class="rules roles">
    <tr><td>intrinsic dimension</td><td>train in a random subspace: $\theta = \theta_0 + Pz$, learn only $z$</td></tr>
    <tr><td>MNIST</td><td>750 of 199k parameters reach 90%</td></tr>
    <tr><td>RoBERTa-Large</td><td>207 numbers reach 90% on MRPC</td></tr>
    <tr><td>trend</td><td>bigger, better-pretrained models need fewer</td></tr>
    <tr><td>intrinsic rank</td><td>LoRA's stronger bet: each $\Delta W$ is itself low-rank</td></tr>
    <tr class="total"><td>open</td><td>does the low-rank shape matter, or only the small budget?</td></tr>
  </table>
  <div><img src="img/week-02-intrinsic-dim.svg" alt="Parameters needed to reach 90% of full fine-tuning on MRPC: BERT-Base 1,608, RoBERTa-Base 896, BERT-Large 1,037, RoBERTa-Large 207"></div>
</div>

<div class="big-math line">$$\theta = \theta_0 + \underbrace{P}_{\text{frozen}}\,z \qquad\text{vs}\qquad W = W_0 + \underbrace{B A}_{\text{learned}}$$</div>

<p class="gloss">$P$: a fixed random matrix mapping a few numbers $z$ into all the weights. <b>MRPC</b>: do two sentences mean the same thing?</p>

<p class="footnote">Aghajanyan et al. 2020 (SAID, Table 1), building on Li et al. 2018 (MNIST: 750 of ~199k parameters); the LoRA paper cites both</p>

Note:
Two different claims hide under "low-dimensional".
Intrinsic dimension (Li et al. 2018; Aghajanyan et al. 2020) is about the whole parameter space: freeze a random projection P and learn only a short vector z. Aghajanyan: "by optimizing only 200 trainable parameters randomly projected back into the full space, we can tune a RoBERTa model to achieve 90% of the full parameter performance levels on MRPC." And larger models have lower intrinsic dimension, so pretraining makes fine-tuning easier.
Intrinsic rank is LoRA's additional hypothesis: the update to each weight matrix is low-rank. That's a claim about matrix shape, not just a count of parameters.
Both sides agree fine-tuning needs few degrees of freedom. They disagree on whether the low-rank matrix structure matters or just the small, well-placed budget. Irony: the intrinsic-dimension experiments used random projections, which is closer to the Thinking Machines view than LoRA's own framing is.

--

## Does the low-rank shape matter?

<table class="rules steps">
  <tr><td>$r$ = 1 works; $r$ = 8 and $r$ = 64 share their top direction</td><td>LoRA §7</td><td>shape</td></tr>
  <tr><td>$\Delta W$ amplifies weak directions of $W$ by 21.5×</td><td>LoRA §7</td><td>shape</td></tr>
  <tr><td>at init $\partial L/\partial B = (\partial L/\partial W)\,A^\top$: the full gradient, randomly projected</td><td>math</td><td>budget</td></tr>
  <tr><td>freeze $A$ (LoRA-FA) or train only scales (VeRA: 1.6M vs 159.9M params, MT-Bench 4.77 vs 5.03)</td><td>2023 papers</td><td>budget</td></tr>
  <tr><td>full-FT updates have 10–100× higher rank than LoRA's</td><td>Biderman 2024</td><td>budget</td></tr>
  <tr><td>results track capacity; RL at rank 1 matches full FT</td><td>Schulman 2025</td><td>budget</td></tr>
  <tr class="total"><td>LoRA adds "intruder dimensions" full FT lacks, where its forgetting sits</td><td>Shuttleworth 2024</td><td>both</td></tr>
</table>

<p class="gloss"><b>Top direction</b>: the first singular vector, the direction the update changes most. <b>MT-Bench</b>: chat quality graded 1–10 by GPT-4</p>

<p class="footnote">Tinker docs: low rank "is not terribly important… think of LoRA as just a random projection of the parameter space that happens to be efficient to implement"</p>

Note:
For shape (LoRA paper, sec. 7): very small ranks work; the top singular direction of the r = 8 and r = 64 adapters overlaps (normalised similarity > 0.5), a small consistent subspace; and ΔW amplifies directions already in W but not dominant (21.5x at r = 4, only about 2 at r = 64). A specific story: fine-tuning re-weights existing features.
For budget: with B = 0 and A random, B's gradient is the full-weight gradient multiplied by Aᵀ, i.e. projected onto the r random directions of A. Early in training LoRA is random-subspace training. LoRA-FA freezes A for good and stays close to LoRA; VeRA freezes shared random matrices and trains only scaling vectors: Llama-7B 1.6M vs 159.9M parameters, MT-Bench 4.77 vs 5.03 (13B: 5.08 vs 5.19). Close, a little lower.
Biderman et al.: "full finetuning learns perturbations with a rank that is 10-100X greater than typical LoRA configurations." LoRA finds a different solution, not a compressed copy of full FT's.
Schulman et al.: what predicts success is capacity vs information and covering all layers; in RL rank 1 is enough.
Against both simple stories: Shuttleworth et al. find new high-ranking singular vectors in LoRA weights ("intruder dimensions") that full FT doesn't produce, even at equal accuracy. LoRA's forgetting is localised there, and they fade at high rank or with alpha = 2r scaling. So the shape doesn't change accuracy much, but it changes what the model forgets.

--

## How to settle it

<table class="rules steps overview">
  <tr><td></td><td>experiment</td><td>on Qwen3-4B</td><td>reading</td></tr>
  <tr><td>matched budget</td><td>LoRA vs a random subspace at equal trainable count</td><td>PEFT <code>VeraConfig</code> vs LoRA</td><td>equal: budget wins</td></tr>
  <tr><td>spectra</td><td>effective rank of $\Delta W$, full FT vs LoRA</td><td><code>torch.linalg.svdvals</code> per matrix</td><td>how low is "low"?</td></tr>
  <tr><td>rank vs count</td><td>fix params, trade rank against matrices adapted</td><td>$r$ = 28 on q, v = $r$ = 5 on all 7 (10.3M)</td><td>which predicts?</td></tr>
  <tr class="total"><td>equal accuracy</td><td>forgetting and out-of-distribution scores</td><td>MMLU + a held-out domain</td><td>intruder test</td></tr>
</table>

<p class="gloss"><b>Effective rank</b>: $\exp$ of the entropy of the normalised singular values; the same idea as the spectral entropy of a graph</p>

<p class="footnote">Experiments we propose. Open question: fine-tuning needs few degrees of freedom; does their low-rank shape matter for accuracy, or only for what the model forgets?</p>

Note:
Four experiments, each separating the two views.
Matched budget: if a dense random-subspace method with the same number of trainable parameters matches LoRA, the projection view wins for that task.
Spectra: compute the effective rank of full-FT and LoRA updates on our mini-project data. It's the network-science move: the same tool as spectral entropy of an adjacency matrix.
Rank vs count: hold total parameters fixed and trade rank against how many matrices get adapters. If performance follows the count, structure isn't the driver.
Equal accuracy: intruder dimensions predict LoRA and full FT diverge on forgetting and out-of-distribution tests even when the task score is the same.
Rank vs count on Qwen3-4B: q and v cost 368,640 parameters per unit of rank, all seven 2,064,384 (5.6x), so r = 28 on q, v and r = 5 on all seven both give 10.3M trainable parameters. If accuracy follows coverage rather than rank, structure isn't the driver.

--

## Threads for discussion

<table class="rules steps">
  <tr><td>weights vs states</td><td>LoRA, QLoRA, DoRA, LongLoRA edit $W$ for every token; ReFT edits $h$ at a few positions</td><td>the week's split</td></tr>
  <tr><td>block models</td><td>a $k$-block stochastic block model has an expected adjacency of rank $k$</td><td>low rank = few groups</td></tr>
  <tr><td>spectral embedding</td><td>top eigenvectors recover the groups; the rest is noise</td><td>like the top directions of $\Delta W$</td></tr>
  <tr><td>spectral entropy</td><td>how spread a graph's spectrum is ~ effective rank of $\Delta W$</td><td>same idea</td></tr>
  <tr><td>tensors</td><td>LoTRA: Tucker decomposition, low-rank adaptation for KAN tensors</td><td>optional reading</td></tr>
  <tr class="total"><td>for us</td><td>is fine-tuning "re-weighting a few communities" of features?</td><td>a question, not a claim</td></tr>
</table>

<p class="gloss"><b>Stochastic block model</b>: nodes in $k$ groups, edge probability set by the two nodes' groups. <b>KAN</b>: Kolmogorov–Arnold network, learnable functions on edges</p>

<p class="footnote">SBM and spectral facts are textbook network science; the analogy to $\Delta W$ is ours. LoTRA: Gao, Ng, Tan 2025 (arXiv:2502.06153)</p>

Note:
Weights vs representations is the clean framing for the whole week: four methods change weights (so the change applies at every token), one changes hidden states at chosen positions.
Network-science analogy: in a stochastic block model the expected adjacency matrix is a k x k block pattern expanded to n x n, so its rank is at most k. Spectral clustering uses the top k eigenvectors to recover the groups; the remaining spectrum is noise. LoRA's section 7 finding (a few top directions carry the update; they amplify existing features) reads like "the update re-weights a few groups of features".
Spectral entropy of a graph and the effective rank of ΔW both measure how spread a spectrum is, so the same tools transfer.
LoTRA (optional reading) generalises low-rank matrices to low-rank tensors (Tucker) for KAN parameters.
This is an analogy to discuss, not an established result.

---

## Project ideas

<table class="rules steps overview">
  <tr><td></td><td>idea</td><td>fine-tune</td><td>network angle</td><td>builds on</td></tr>
  <tr><td>1</td><td>Reward-hacking contagion in agent teams</td><td>hacker / honest LoRA adapters</td><td>spread over a topology</td><td>—</td></tr>
  <tr><td>2</td><td>Inferring mixing patterns among agents</td><td>none (reuse 1)</td><td>mixing matrices, transmission</td><td>1</td></tr>
  <tr><td>3</td><td>Agent teams as epidemic forecasting ensembles</td><td>forecast-style adapters, GRPO</td><td>ensembles on a graph</td><td>—</td></tr>
  <tr><td>4</td><td>Do LoRA updates land on circuits?</td><td>LoRA rank sweep + full FT</td><td>circuits as graphs</td><td>—</td></tr>
  <tr><td>5</td><td>Predicting update targets from the transformer DAG</td><td>many LoRA runs + a GNN</td><td>GNN over the model graph</td><td>4</td></tr>
</table>

<p class="footnote">Ideas for mini-projects 1–3 and the final project. Build order: 4 → 5 and 1 → 2 share infrastructure; 3 follows the FluSight season</p>

Note:
Five candidate directions. Pairs share infrastructure: idea 4's circuit pipeline produces idea 5's labels, and idea 1's simulations produce idea 2's logs. Idea 3 is independent and runs on the flu season's calendar.
Fit with the course arc: mini-project 1 is fine-tuning (the adapters), 2 is agents interacting (teams on a graph), 3 is a dynamic workflow (agents choosing whom to message, idea 2).
Fit with our course project (topology x behavioral fine-tuning in agent populations): idea 1 is the direct fit; 2 extends it; 3 is partial; 4 and 5 are not multi-agent.

--

## Reward-hacking contagion

<table class="rules steps">
  <tr><td>fine-tune</td><td>Qwen3-4B to 8B, LoRA on all linear layers, $r$ = 16–64: overt hacker, covert hacker, honest control</td><td>3 adapters</td></tr>
  <tr><td>task</td><td>coding problems graded by unit tests, with shortcuts (visible or editable tests, weak checkers)</td><td>MBPP / HumanEval style</td></tr>
  <tr><td>data</td><td>a strong model writes a hack and a genuine solution per problem; School of Reward Hacks has 100 coding items</td><td>mostly generated</td></tr>
  <tr><td>training</td><td>QLoRA SFT, completion-only loss, 1–3 epochs, a few thousand examples; check hack rate first</td><td>Unsloth / TRL</td></tr>
  <tr><td>let loose</td><td>one base model, vLLM multi-LoRA; hack adapter on one agent; messages only along edges; shared team reward</td><td>sandboxed</td></tr>
  <tr><td>sweep</td><td>topology, placement, dose (adapter scale), number of hacked agents</td><td>at matched budget</td></tr>
  <tr class="total"><td>controls</td><td>all-base team and honest adapter in the same seat (negative); all agents hacked (positive)</td><td>before any claim</td></tr>
</table>

<p class="gloss"><b>Reward hacking</b>: passing the grader without doing the task, e.g. special-casing the test inputs</p>

<p class="footnote">Held-out evaluation: ImpossibleBench (Zhong et al. 2025), Reward Hacking Benchmark (2026). Data: Taylor et al. 2025, School of Reward Hacks (1,073 samples, 100 coding)</p>

Note:
Why it fits: the adapter is the "behavioral fine-tuning" in our project question and its spread over the graph is the topology effect. Teammates stay the unmodified base model, so any contagion is in-context, through messages, not learning. Say that explicitly.
Data: School of Reward Hacks (Taylor et al. 2025, on Hugging Face as longtermrisk/school-of-reward-hacks) is mostly natural-language tasks; only 100 are coding. So the coding set is mostly generated: a hack that passes the tests without solving the problem, and a genuine solution, per problem.
Verify the adapter before any team runs: hack rate on held-out ImpossibleBench, whose tests are mutated to conflict with the spec so any pass is a hack.
Serving: exactly the production pattern from the summary: one base on the GPU, adapters attached per agent via vLLM multi-LoRA. Check that the vLLM version supports our GPU (V100 vs B200).
Needed before it's a hypothesis: a kill criterion fixed in advance, a hack detector (passes visible tests, fails hidden ones), and a base-model check that Qwen3-4B can solve the problems honestly at all. Our literature priors suggest topology effects of a few points, so plan several seeds.

--

## Inferring mixing patterns

<table class="rules steps">
  <tr><td>fine-tune</td><td>nothing new: reuse idea 1's adapters</td><td>method is the contribution</td></tr>
  <tr><td>task</td><td>idea 1's team tasks, but agents choose whom to message, so mixing emerges</td><td>fixed graph = known mixing</td></tr>
  <tr><td>data</td><td>message logs, addressees, who adopted whose content</td><td>from simulations</td></tr>
  <tr><td>ground truth</td><td>tracked hack adoption</td><td>for validation</td></tr>
  <tr><td>method</td><td>mobility-to-mixing inference on logs → role-by-role mixing matrix → SIR or Hawkes model</td><td>predict spread</td></tr>
  <tr class="total"><td>let loose</td><td>many teams, agents migrate between them (GLEAM-style); infer from early rounds</td><td>beat raw message counts?</td></tr>
</table>

<p class="gloss"><b>Mixing matrix</b>: how often each group contacts each other group. <b>Hawkes process</b>: events that raise the rate of further events, a self-exciting model of spread</p>

<p class="footnote">Mini-project 3 fit: free addressee choice is a dynamic workflow. Depends on idea 1's simulator and hack detector</p>

Note:
With a fixed topology, who talks to whom is known by construction, so there is nothing to infer. Letting agents pick addressees makes mixing emergent, like contact patterns in a population.
Method: adapt the mobility-to-mixing inference to message logs, estimate role-by-role mixing matrices, then fit a transmission model on the inferred matrix and predict spread.
Test: run many teams with migration between them, infer mixing from the early rounds, and ask whether it predicts later cross-team spread better than naive baselines such as raw message counts.
Hard part: labelling adoption, i.e. deciding when an agent copied another agent's hack rather than finding it independently.

--

## Forecasting ensembles

<table class="rules steps">
  <tr><td>fine-tune</td><td>several LoRA adapters on one base, each a forecasting style (trend-following, mechanistic)</td><td>diversity as a knob</td></tr>
  <tr><td>task</td><td>weekly quantile forecasts of flu hospitalizations, FluSight format</td><td>probabilistic</td></tr>
  <tr><td>data</td><td>FluSight hub targets and past submissions; NHSN and ILINet history</td><td>available</td></tr>
  <tr><td>training</td><td>SFT on (data window, quantiles), then GRPO with reward = −WIS; seasons before the model's cutoff</td><td>verifiable reward</td></tr>
  <tr><td>let loose</td><td>live 2026–27 season; agents exchange forecasts along a topology, then aggregate</td><td>no contamination</td></tr>
  <tr class="total"><td>compare</td><td>accuracy and diversity across topologies vs single agents and the hub ensemble</td><td>the test</td></tr>
</table>

<p class="gloss"><b>WIS</b>: weighted interval score, a proper scoring rule for quantile forecasts (lower is better). <b>GRPO</b>: RL that scores a group of sampled answers against each other</p>

<p class="footnote">Risks: only a few live forecast weeks before 12/16; aggregation may hide topology (Choi et al. 2025, "Debate or Vote"). Ties to Week 4</p>

Note:
Idea: make agent diversity controllable by training each adapter on a different forecasting style, rather than hoping prompts create diversity.
WIS is a proper scoring rule, so negative WIS is a verifiable reward that directly targets calibrated forecasts.
Real-time evaluation on the new season avoids contamination completely, but by the December deadline only a handful of weeks will have been scored, so statistical power is limited.
Prior to watch: Choi et al. show that when outputs are aggregated, message exchange mostly doesn't change expected accuracy. A topology effect would need to show up in diversity or calibration, not just the mean.

--

## Do LoRA updates land on circuits?

<table class="rules steps">
  <tr><td>fine-tune</td><td>GPT-2 small or Pythia 160M–410M; LoRA on all linear layers, $r$ = 4–256; full FT reference; several seeds</td><td>cheap</td></tr>
  <tr><td>task</td><td>a known circuit the base model partly solves: greater-than (GPT-2 small), two-digit addition</td><td>known map</td></tr>
  <tr><td>data</td><td>a few thousand generated examples, plus an unrelated task for the null update profile</td><td>programmatic</td></tr>
  <tr><td>training</td><td>language-modeling loss on the answer token; one GPU, hours</td><td>PEFT / TRL</td></tr>
  <tr><td>analysis</td><td>circuit discovery before and after (edge attribution patching, ACDC); slice $\Delta W$ per head; patch it in and out</td><td>per component</td></tr>
  <tr class="total"><td>test</td><td>is the update concentrated on the circuit, beyond the null profile?</td><td>vs rank</td></tr>
</table>

<p class="gloss"><b>Circuit</b>: the small subgraph of heads and MLPs that computes a behavior. <b>ACDC</b>: automatic circuit discovery by pruning edges that don't matter</p>

<p class="footnote">Prior: Prakash et al. 2024, fine-tuning mostly enhances the existing entity-tracking circuit. New: LoRA, rank sweep, per-head $\Delta W$</p>

Note:
This is the "check" row of our ReFT future-work slide, done for LoRA: do adapter updates land where circuit discovery says the task is computed?
Prior: Prakash et al. 2024 found fine-tuned LLaMA-7B variants use primarily the same entity-tracking circuit as the base model, with better performance. So "fine-tuning uses the existing circuit" is partly known; what's open is how LoRA distributes its update across components, how that depends on rank, and whether the update is concentrated on the circuit relative to an unrelated task's update (the null profile).
Links to the summary: rank sweep tests the shape-vs-budget question; intruder dimensions predict LoRA and full FT may differ.
Not multi-agent; a good side study or course mini-project.

--

## Predicting update targets

<table class="rules steps">
  <tr><td>fine-tune</td><td>level 1: many LoRA runs across dozens of tasks, for labels; level 2: the predictor, a GNN</td><td>two levels</td></tr>
  <tr><td>task</td><td>predict each component's update effect for a new task without fine-tuning</td><td>regression on a graph</td></tr>
  <tr><td>data</td><td>idea 4's pipeline at scale: effects as labels; activations, attributions, initial gradients as node features</td><td>generated</td></tr>
  <tr><td>training</td><td>hold out whole tasks (ideally a second model); baseline: initial gradients</td><td>generalization</td></tr>
  <tr class="total"><td>let loose</td><td>LoRA only on the top-$k$ predicted components vs all-layer LoRA at matched parameters</td><td>the payoff</td></tr>
</table>

<p class="gloss"><b>Transformer DAG</b>: the model as a directed graph of components (heads, MLPs) along the residual stream. <b>GNN</b>: graph neural network</p>

<p class="footnote">Builds on idea 4 and on GCL. Scale: dozens of tasks × ranks × seeds; likely beyond 12/16</p>

Note:
Idea: turn "where should the adapter go?" into a graph-learning problem over the model's own computational graph.
Labels come from idea 4's pipeline run over many tasks; node features are cheap signals (activations, attribution scores, initial gradients).
The honest baseline is the initial gradient magnitude per component: if the GNN can't beat it on held-out tasks, the graph structure isn't adding anything.
Payoff test: place adapters only on the top-k predicted components and compare with all-layer LoRA at matched parameter counts (the rank-vs-count experiment from the summary).
Scale is the risk: it needs idea 4 working first, then many runs. Likely semester 2.
