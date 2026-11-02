<!-- .slide: id="week-04" class="cover week" -->

<h1>Week 4</h1>
<p class="subtitle">Current Model Landscape and Policy Optimization</p>

Note:
Four readings, as deep dives, in two pairs. GPT-3 and Raschka's architecture survey ask what a modern language model is: how far scale alone goes, and what changed in the transformer block since. PPO and GRPO ask how to train one on a reward instead of the next token.

---

<p class="eyebrow">Week 4 readings</p>

## From predicting text to optimising reward?

<table class="rules">
  <tr><td>reading</td><td>question</td></tr>
  <tr><td>Brown et al. 2020, GPT-3</td><td>what does scale alone buy?</td></tr>
  <tr><td>Raschka 2025, architecture comparison</td><td>what changed in the block since?</td></tr>
  <tr><td>Schulman et al. 2017, PPO</td><td>how to take safe steps on a reward?</td></tr>
  <tr class="total"><td>Shao et al. 2024, DeepSeekMath (GRPO)</td><td>can you drop PPO's critic?</td></tr>
</table>

<p class="footnote">arXiv:2005.14165 · magazine.sebastianraschka.com (version of 2 Apr 2026) · arXiv:1707.06347 · arXiv:2402.03300. Press ↓ on any slide for optional depth</p>

Note:
The plan. Two pairs.
First pair: GPT-3 shows how far next-token prediction plus scale goes, and ends by naming where it stops: the objective "weights every token equally". Raschka's survey then shows that five years of models changed the transformer block only in its details.
Second pair: PPO is the tool for training on a reward instead, the method later used to tune GPT-3 toward human preferences. GRPO, from DeepSeekMath, makes it cheaper by dropping the value network.
The thread: what does each step change, and how good is the evidence that the change is what helped? Vertical sub-slides (press down) are optional depth.



---

<!-- .slide: class="cover divider" -->

<p class="kicker">Reading 1 of 4</p>
<h1>Brown et al. 2020</h1>
<p class="subtitle">Language Models are Few-Shot Learners</p>
<p class="question">Can a language model do a new task from the prompt alone, with no weight updates?</p>
<ol class="track"><li class="now">GPT-3 2020<span>few-shot learners</span></li><li>Raschka 2025<span>architectures</span></li><li>PPO 2017<span>policy optimization</span></li><li>GRPO 2024<span>DeepSeekMath</span></li></ol>

Note:
Reading 1 of 4. Brown, Mann, Ryder, Subbiah, Kaplan, Amodei and 25 others at OpenAI, May 2020. This is a deep dive: we go through the paper in its own order and stop to understand each step.
The question is in one line: can you skip fine-tuning altogether, describe a task in the prompt, maybe show a few examples, and let the model continue the text? The answer the paper gives is "sometimes, and more often as the model gets bigger". Our job is to see exactly where that holds and where it doesn't.

---

<p class="eyebrow"><span class="paper">Brown et al. 2020</span> · Motivation · Fig. 2.1</p>

## Why not just ask the model?

<div class="cols wide-fig">
<div class="text">

- 2020 default: fine-tune per task
- thousands of labelled examples each
- GPT-2 by prompting alone: 4% on Natural Questions
- the bet: scale fixes prompting

<p class="q"><b>Q.</b> What is "the prompt"?</p>
<p class="a"><b>A.</b> All the text before the answer: instructions and examples</p>

</div>
<div class="fig"><img src="img/week-04-gpt3-fig2-1.png" alt="Brown et al. Figure 2.1: zero-shot, one-shot and few-shot prompts for English to French translation, with no gradient updates, contrasted with fine-tuning, which takes a gradient update after each example"></div>
</div>

<p class="footnote">Brown et al. 2020 · arXiv:2005.14165 · §1, Fig. 2.1. Natural Questions: real search queries answered from Wikipedia. CoQA: conversational questions about a passage; GPT-2's score was "more than 35 points behind the state of the art"</p>

Note:
In 2020 the standard way to get a language model to do a task was to fine-tune it, as we did in Week 2: take a pretrained model, collect thousands of labelled examples, and run gradient descent on them. LoRA, a year later, made that cheaper, but every new task still needed a dataset and a training run.
GPT-2 had already tried the alternative, putting the task in the prompt, and it worked badly: 4% on Natural Questions. The bet of GPT-3 is that this was a problem of scale. Train a model of 175 billion parameters, ten times bigger than any dense model before it, and test it on more than two dozen benchmarks with no fine-tuning at all.
The right half of Figure 2.1 is fine-tuning: a gradient update after every example. The left half is what this paper studies: the same examples, written into the prompt, and no update at all.

---

<p class="eyebrow"><span class="paper">Brown et al. 2020</span> · Abstract · §1</p>

## What does the paper claim?

<blockquote>"scaling up language models greatly improves task-agnostic, few-shot performance, sometimes even reaching competitiveness with prior state-of-the-art fine-tuning approaches."</blockquote>

<table class="rules">
  <tr><td>why avoid fine-tuning</td><td>in the paper's words</td></tr>
  <tr><td>practical</td><td>a labelled dataset per task "limits the applicability"</td></tr>
  <tr><td>spurious correlations</td><td>grow "with the expressiveness of the model and the narrowness of the training distribution"</td></tr>
  <tr class="total"><td>humans</td><td>"a brief directive" or "a tiny number of demonstrations"</td></tr>
</table>

<p class="footnote">Brown et al. 2020 · abstract; §1. Task-agnostic: one model, no task-specific training. We grade this sentence at the end of the section</p>

Note:
The headline, in the abstract's own words. Keep it in mind: at the end of the section we grade each part of it.
The introduction gives three reasons to want a model that needs no task-specific training. The practical one: a labelled dataset for every task limits what a model can be used for. The subtle one: a huge model fine-tuned on a narrow dataset can learn that dataset's quirks, so a fine-tuned score that looks human-level "may exaggerate actual performance on the underlying task". And the motivating one: a person can do a new task from a one-line instruction or a couple of examples, such as "here are two examples of people acting brave; please give a third example of bravery".
The second reason will come back in another form: a benchmark score can be a property of the data or the prompt, not only of the model.

---

<p class="eyebrow"><span class="paper">Brown et al. 2020</span> · §1 · Fig. 1.1</p>

## How can a model learn without changing its weights?

<div class="cols wide-fig">
<div class="text">

- outer loop: pretraining by SGD
- inner loop: within one sequence
- repeated sub-tasks reward pattern-continuing
- "in-context learning": the inner loop

<p class="q"><b>Q.</b> Learn, or recognise?</p>
<p class="a"><b>A.</b> Left open on purpose: "agnostic"</p>

</div>
<div class="fig"><img src="img/week-04-gpt3-fig1-1.png" alt="Brown et al. Figure 1.1: an outer loop of learning by stochastic gradient descent during pretraining, and inner loops within three sequences that repeat a sub-task: sums, unscrambled words, English to French"></div>
</div>

<p class="footnote">Brown et al. 2020 · Fig. 1.1, §1 footnote. SGD: stochastic gradient descent. Analogue named in §7: RL², a recurrent network that adapts within an episode</p>

Note:
How could a model "learn" a task without changing its weights? The paper borrows the language of meta-learning. The outer loop is ordinary pretraining: gradient descent on next-token prediction over hundreds of billions of tokens, and the weights change. The inner loop happens inside one sequence. The figure shows three: sums, misspelled words and their corrections, English words and their French. Within each, the same little task repeats, so a model that predicts the next token well has to notice the pattern and continue it. Whatever adaptation happens is in the activations. That inner loop is what they call in-context learning.
The figure isn't a claim about what pretraining data looks like; the caption says it is "not intended to be representative". It only says that some sequences contain repeated sub-tasks, and predicting them well rewards a general skill.
Remember this: the footnote that defines the term says it is "intended to remain agnostic on the question of whether the model learns new tasks from scratch at inference time or simply recognizes patterns seen during training". Learning here names a behaviour, not a mechanism. Most of the later work on this paper is about exactly that question. And why should scale help? §1's argument is one sentence, stated before any result: in-context learning involves "absorbing many skills and tasks within the parameters of the model", so it might improve with size the way loss does.

---

<p class="eyebrow"><span class="paper">Brown et al. 2020</span> · §2 · Fig. 2.1</p>

## What exactly are zero-, one- and few-shot?

<div class="cols">
<div class="text">

<table class="rules">
  <tr><td>setting</td><td>in the prompt</td><td>weights</td></tr>
  <tr><td>fine-tuning</td><td>none; thousands of labelled examples in training</td><td>updated</td></tr>
  <tr><td>few-shot</td><td>description + $K$ examples</td><td>fixed</td></tr>
  <tr><td>one-shot</td><td>description + 1 example</td><td>fixed</td></tr>
  <tr class="total"><td>zero-shot</td><td>description only</td><td>fixed</td></tr>
</table>

<p class="q"><b>Q.</b> How big is $K$? <b>A.</b> What fits in 2,048 tokens: 5 to 100</p>

</div>
<div class="fig"><img src="img/week-04-gpt3-fig2-1-left.png" alt="Brown et al. Figure 2.1, left column: zero-shot gives only the task description and the prompt; one-shot adds one example; few-shot adds several examples"></div>
</div>

<p class="footnote">Brown et al. 2020 · §2, §2.4, Fig. 2.1, Table H.1 ($K$ per task). Token: a piece of text from GPT-2's byte-pair-encoding (BPE) tokenizer, about 0.7 words. Context window: the text the model can read at once, here 2,048 tokens</p>

Note:
Four settings, from most task data to least. Fine-tuning updates the weights on thousands to hundreds of thousands of labelled examples. Few-shot writes a task description and K worked examples into the prompt. One-shot gives exactly one example; zero-shot only the description. In the last three nothing is trained.
K is "as many demonstrations as will fit into the model's context window (typically 10 to 100)". In practice it runs from 5 for the conversational question-answering tasks CoQA and QuAC, through 32 for SuperGLUE and 50 for arithmetic, to 100 for word scrambling. Where a task has separate development and test sets, they tried a few values of K on the development set and kept the best.
Why bother distinguishing one-shot? Because it "most closely matches the way in which some tasks are communicated to humans": a crowd-work task usually comes with one example. And zero-shot can be "unfairly hard": "make a table of world records for the 200m dash" is ambiguous until you see one table.
One more detail that matters later: for each test question the examples are drawn fresh and at random from that task's training set.

---

<p class="eyebrow"><span class="paper">Brown et al. 2020</span> · §2.4, §3.9.1 · App. G</p>

## What does the model actually see?

<div class="rows">
<div class="points">
<div class="text">

- the question format is the paper's
- examples come from the same task
- scored by exact match: "1053" or nothing

</div>
<div class="text">

<p class="q"><b>Q.</b> Where is the instruction in zero-shot? <b>A.</b> In the question itself</p>

</div>
</div>
<div class="fig"><img src="img/week-04-gpt3-prompt.svg" alt="Illustration: three prompts for 3-digit addition. Zero-shot is 'Q: What is 556 plus 497? A:'. One-shot adds one solved addition problem. Few-shot adds two. The model should write 1053"></div>
</div>

<p class="footnote">Brown et al. 2020 · App. G (Fig. G.47, 3-digit addition format), §3.9.1. The paper uses $K$ = 50. Exact match: the answer must equal the reference string</p>

Note:
Here is what the model sees on the 3-digit addition task. The question format, "Q: What is 556 plus 497? A:", is the paper's own, from Appendix G. The demonstrations are ours, drawn the way the paper draws them, from the same task. The real run used fifty of them.
Nothing in the prompt says "you are a calculator". The model has to infer from the pattern that the next tokens should be a number, and which number. And the scoring is unforgiving: exact match, so "1053" is right and "1,053" or "1052" are wrong.
Check it: in the zero-shot version, what's left? Just the question. The question carries the instruction.
Budget: 50 examples fit in the 2,048-token context at about 41 tokens each (our arithmetic).

---

<p class="eyebrow"><span class="paper">Brown et al. 2020</span> · §1 · Fig. 1.2</p>

## Do bigger models use the examples better?

<div class="cols wide-fig">
<div class="text">

- one task: remove symbols from a word
- x: examples in context $K$ (log)
- solid: with a task description
- 175B climbs steeply; 1.3B barely moves

<p class="q"><b>Q.</b> Is this one task typical?</p>
<p class="a"><b>A.</b> Chosen as "particularly striking". Tested later today</p>

</div>
<div class="fig"><img src="img/week-04-gpt3-fig1-2.png" alt="Brown et al. Figure 1.2: accuracy on removing random symbols from a word against the number of examples in context, for 1.3B, 13B and 175B models, with and without a natural-language prompt; the 175B curves rise steeply to about 67%, the 1.3B curves stay near zero"></div>
</div>

<p class="footnote">Brown et al. 2020 · Fig. 1.2. Table H.1 at $K$ = 100: 0.11, 0.28, 2.19, 4.18, 6.61, 11.0, 27.3, 67.2% from 125M to 175B. The figure's sweep is a separate run and, by our reading, stops short of $K$ = 100</p>

Note:
The first evidence for the hypothesis. One synthetic task: remove random symbols from a word, so "s.u!c/c!e.s s i/o/n" becomes "succession". Three sizes, the number of examples on the x-axis on a log scale with zero at the far left, solid lines with a natural-language description of the task, dashed without.
The slope of each line is how much each extra example helps: an "in-context learning curve". The 175B line climbs steeply; the 1.3B line barely leaves zero. At 175B the description helps a lot when there are few examples and stops mattering once there are many. The caption's reading: "larger models demonstrate improved ability to learn a task from contextual information".
What it doesn't show: it's one task, and the paper itself calls the result "particularly striking". The text claims "the general trends with both model size and number of examples in-context hold for most tasks we study", and the caption says "qualitatively similar behavior across a wide range of tasks". We'll test that claim on every task in a few slides.

---

<p class="eyebrow"><span class="paper">Brown et al. 2020</span> · §1 · Fig. 1.3</p>

## What does the aggregate show, and how strongly?

<div class="cols wide-fig">
<div class="text">

- 42 accuracy benchmarks, averaged
- faint lines: single tasks
- few-shot pulls away from zero-shot
- no curve shape is fitted

<p class="q"><b>Q.</b> "demonstrating" or "perhaps suggesting"?</p>
<p class="a"><b>A.</b> The paper says both. And: not "a rigorous or meaningful benchmark"</p>

</div>
<div class="fig"><img src="img/week-04-gpt3-fig1-3.png" alt="Brown et al. Figure 1.3: average accuracy over 42 benchmarks against model size from 0.1B to 175B; few-shot rises from about 25 to 57, one-shot to about 51, zero-shot to about 43; faint lines show individual tasks"></div>
</div>

<p class="footnote">Brown et al. 2020 · Fig. 1.3 caption ("demonstrating"); §1 ("perhaps suggesting", "should not be seen as a rigorous or meaningful benchmark in itself")</p>

Note:
The paper's most reproduced figure. The average over "all 42 accuracy-denominated benchmarks", in zero-, one- and few-shot, against size. The gap between orange and blue is what the examples are worth, on average, and it widens with size.
Notice the two registers. The caption: "few-shot performance increases more rapidly, demonstrating that larger models are more proficient at in-context learning". The introduction, more carefully: "perhaps suggesting that larger models are more proficient meta-learners". And the introduction warns that the figure "should not be seen as a rigorous or meaningful benchmark in itself".
Two cautions of our own. No curve shape is fitted: it rises steadily on a log axis, nothing more, and certainly not a power law in accuracy. And it averages tasks with different chance levels, two-way, four-way and free-form. Next we take it apart task by task with the paper's appendix table.

---

<p class="eyebrow"><span class="paper">Brown et al. 2020</span> · §2.1 · Table 2.1</p>

## What changed from GPT-2?

<div class="cols">
<div class="text">

- same architecture as GPT-2, but alternate dense and banded attention
- eight sizes, 125M to 175B; all: 2,048-token context, 300B tokens

<p class="q"><b>Q.</b> Why keep it ordinary?</p>
<p class="a"><b>A.</b> To test scale alone</p>

</div>
<div class="text">

<table class="rules">
  <tr><td>model</td><td>layers</td><td>$d_{\rm model}$</td><td>batch</td></tr>
  <tr><td>Small 125M</td><td>12</td><td>768</td><td>0.5M</td></tr>
  <tr><td>Medium 350M</td><td>24</td><td>1,024</td><td>0.5M</td></tr>
  <tr><td>Large 760M</td><td>24</td><td>1,536</td><td>0.5M</td></tr>
  <tr><td>XL 1.3B</td><td>24</td><td>2,048</td><td>1M</td></tr>
  <tr><td>2.7B</td><td>32</td><td>2,560</td><td>1M</td></tr>
  <tr><td>6.7B</td><td>32</td><td>4,096</td><td>2M</td></tr>
  <tr><td>13B</td><td>40</td><td>5,140</td><td>2M</td></tr>
  <tr class="total"><td>175B</td><td>96</td><td>12,288</td><td>3.2M</td></tr>
</table>

</div>
</div>

<p class="footnote">Brown et al. 2020 · §2.1, Table 2.1 (batch in tokens). Banded layers "similar to the Sparse Transformer"; no band width given</p>

Note:
What's new in the architecture? Almost nothing, on purpose. "We use the same model and architecture as GPT-2", with one exception: "alternating dense and locally banded sparse attention patterns", every other layer seeing only a local band of earlier tokens, "similar to the Sparse Transformer". The paper gives no band width and no reason; the Sparse Transformer introduced such patterns to cut attention's quadratic cost. Positions aren't discussed, so GPT-2's learned absolute position embeddings carry over, the kind Week 3 contrasted with rotary embeddings (that's GPT-2's design; this paper doesn't restate it).
Why so ordinary? Because the question is about scale. Change the architecture too and a better score could come from either.
Eight sizes over three orders of magnitude. Bigger models get bigger batches and smaller learning rates, chosen by measuring the gradient noise scale. All share a 2,048-token context, about 1,430 words, and all are trained on the same 300 billion tokens. That last fact will matter.
Footnote detail: the Sparse Transformer is Child et al. 2019, arXiv:1904.10509. The learning rate runs from $6.0\times10^{-4}$ (Small) to $0.6\times10^{-4}$ (175B), per Table 2.1.

---

<p class="eyebrow"><span class="paper">Brown et al. 2020</span> · §2.1 · Table 2.1, Table D.1</p>

## Where do 175 billion parameters come from?

<div class="cols">
<div class="text">

- attention: $Q, K, V, O$, each $d \times d$: $4d^2$
- MLP: widen $d$ to $4d$, back to $d$: $8d^2$
- one layer: $12d^2$; 96 layers: 173.9B
- embeddings: $(50{,}257 + 2{,}048) \times 12{,}288$ = 0.64B; total 174.6B, Table D.1's count

</div>
<div class="text">

<div class="eq">$$N \approx 12\thinspace n_{\rm layers}\thinspace d^2 = 12 \times 96 \times 12288^2$$</div>

<p class="q"><b>Q.</b> Share in the embeddings?</p>
<p class="a"><b>A.</b> 0.64B of 174.6B: about 0.4% (ours)</p>

</div>
</div>

<p class="footnote">Brown et al. 2020 · §2.1, Table 2.1, Table D.1 (174,600M). $d = d_{\rm model}$; MLP: multilayer perceptron, the feed-forward block. Vocabulary 50,257 is GPT-2's, not restated here. Arithmetic ours</p>

Note:
Let's derive the number so it isn't magic. Write d for the model width. Attention has four d-by-d matrices, queries, keys, values and output: 4 d squared. This assumes the heads tile the width, number of heads times head size equals d. The MLP widens to 4d and back: 8 d squared. So 12 d squared per layer, ignoring biases and layer norms.
Times 96 layers at width 12,288: 173.9 billion. Add a token embedding table, 50,257 tokens times 12,288, and a position table, 2,048 times 12,288: another 0.64 billion. Total 174.6 billion, exactly the count in the paper's compute table, Table D.1.
At this scale the embedding table is about 0.4% of the model; almost every parameter is in the layers. (This is the same count Week 6's scaling-law paper uses, without the embeddings.)

---

<p class="eyebrow"><span class="paper">Brown et al. 2020</span> · §2.2 · Table 2.2</p>

## Why read Wikipedia 3.4 times and Common Crawl less than once?

<div class="cols">
<div class="text">

<table class="rules">
  <tr><td>dataset</td><td>tokens</td><td>weight</td><td>epochs</td></tr>
  <tr><td>Common Crawl</td><td>410B</td><td>60%</td><td>0.44</td></tr>
  <tr><td>WebText2</td><td>19B</td><td>22%</td><td>2.9</td></tr>
  <tr><td>Books1</td><td>12B</td><td>8%</td><td>1.9</td></tr>
  <tr><td>Books2</td><td>55B</td><td>8%</td><td>0.43</td></tr>
  <tr class="total"><td>Wikipedia</td><td>3B</td><td>3%</td><td>3.4</td></tr>
</table>

</div>
<div class="text">

- Common Crawl: 82% of tokens, 60% of the mix
- "a small amount of overfitting" accepted

<p class="q"><b>Q.</b> Epochs $= 300\text{B} \times w / T$. Check WebText2</p>
<p class="a"><b>A.</b> 3.5, not 2.9; Wikipedia 3.0, not 3.4 (ours)</p>

</div>
</div>

<p class="footnote">Brown et al. 2020 · §2.2, Table 2.2 ("Epochs elapsed when training for 300B tokens"). Weights sum to 101%; App. C says 40% of filtered Common Crawl was used. 93% of words are English. Arithmetic ours</p>

Note:
The mixture. Weight is the chance a training example comes from that source, and it is deliberately not proportional to size. Common Crawl is 82% of the tokens available but only 60% of what the model reads; Wikipedia is under 1% of the tokens and 3% of the mix. So Wikipedia is read about three times and most of Common Crawl never at all. The authors: "This essentially accepts a small amount of overfitting in exchange for higher quality training data."
Check it. Epochs should be 300 billion times the weight, divided by the tokens. For WebText2 that's 300 times 0.22 over 19, about 3.5, not the printed 2.9. Wikipedia gives 3.0, not 3.4. The weights add up to 101%, and Appendix C says they trained on 40% of filtered Common Crawl, against 0.44 here. Something is rounded and the paper doesn't say what. A good habit: recompute any table with a formula hiding in it.
And 93% of the words are English, which matters for translation.

---

<p class="eyebrow"><span class="paper">Brown et al. 2020</span> · §2 · Fig. 2.2 caption</p>

## Why 300B tokens for every size?

<div class="cols">
<div class="text">

- every model: exactly 300B tokens
- "bigger" also means "more compute"

<p class="q"><b>Q.</b> Is a 13B-vs-175B comparison compute-matched?</p>
<p class="a"><b>A.</b> No: 175B got about 14x the compute (3,640 vs 268 PF-days)</p>

</div>
<div class="text">

<table class="rules">
  <tr><td>model</td><td>tokens per parameter</td></tr>
  <tr><td>Small 125M</td><td>2,400</td></tr>
  <tr><td>13B</td><td>23</td></tr>
  <tr class="total"><td>175B</td><td>1.7</td></tr>
</table>

</div>
</div>

<p class="footnote">Brown et al. 2020 · Fig. 2.2 caption: "we train much larger models on many fewer tokens than is typical". Ratios ours; 3,640 ÷ 268 = 13.6. Forward pointer: Week 6's Chinchilla paper revisits this choice</p>

Note:
Remember this. Every model, from 125 million to 175 billion parameters, saw exactly 300 billion tokens. The reason is in the Figure 2.2 caption: based on the scaling-laws analysis of early 2020, "we train much larger models on many fewer tokens than is typical".
In tokens per parameter: 2,400 for the smallest model, 23 for 13B, 1.7 for 175B. Two consequences for reading the rest. First, compute grows in proportion to model size, so every "bigger is better" curve mixes more parameters with more compute: 175B got about 14 times the compute of 13B (3,640 against 268 petaflop/s-days, Table D.1). Second, the comparisons are not compute-matched; whether a 13B model given more tokens would close some gaps is a question the paper doesn't test.
Forward pointer: in Week 6, the Chinchilla paper argues that 1.7 tokens per parameter left GPT-3 far from the best use of its compute.

---

<p class="eyebrow"><span class="paper">Brown et al. 2020</span> · §3 · Fig. 3.1</p>

## Does loss keep falling as a power law?

<div class="cols wide-fig">
<div class="text">

- 8 models + 6 tiny ones
- frontier: $L = 2.57 \cdot C^{-0.048}$
- 10x compute: loss × 0.895
- at 3,640 PF-days: 1.73

<p class="q"><b>Q.</b> Compute to halve the loss?</p>
<p class="a"><b>A.</b> $2^{1/0.048}$: about $2\times10^6$ times (ours)</p>

</div>
<div class="fig"><img src="img/week-04-gpt3-fig3-1.png" alt="Brown et al. Figure 3.1: validation loss against training compute on log-log axes for models from 10^5 to 10^11 parameters; a dashed power-law frontier L = 2.57 C^-0.048, with the 175B curve ending slightly above it"></div>
</div>

<p class="footnote">Brown et al. 2020 · §3, Fig. 3.1 (fit printed only in the legend; embeddings excluded). "Only small deviations" (caption) vs "a slight bending of the curve can perhaps be detected" (§7). Forward pointer: Week 6, Kaplan's $C^{-0.050}$</p>

Note:
Before any benchmark, the loss. Validation loss during training for the eight models plus six tiny ones down to 100,000 parameters, against compute, both axes logarithmic. Each coloured curve is one training run; small models flatten as they run out of capacity, and the lower envelope is the frontier. Its fit is printed only in the legend: loss equals 2.57 times compute to the minus 0.048.
Read it as numbers. Ten times the compute multiplies loss by ten to the minus 0.048, 0.895, about 10% lower. At GPT-3's 3,640 petaflop/s-days the line predicts 1.73. To halve the loss you'd need about two million times the compute. Smooth, and very expensive.
Three registers on the same figure: the caption says the trend continues "with only small deviations", §3 says "only a slight (if any) departure", and related work says "a slight bending of the curve can perhaps be detected". Look at the end of the yellow 175B curve, just above the dashed line: that's the bending. The authors then argue that the loss gains aren't "spurious details of our training corpus", because downstream tasks improve too. That's what the next slides test.

---

<p class="eyebrow"><span class="paper">Brown et al. 2020</span> · Table H.1 · our test of the claim</p>

## Do examples help more as models grow, on every task?

<div class="cols wide-fig">
<div class="text">

- few-shot minus zero-shot, by size
- grows: symbols, arithmetic, WebQuestions
- little or none: HellaSwag (and PIQA, ARC)
- shrinks at 175B: TriviaQA

<p class="q"><b>Q.</b> Why would TriviaQA's gap shrink?</p>
<p class="a"><b>A.</b> Zero-shot catches up: 41.8 ▸ 64.3 (13B ▸ 175B)</p>

</div>
<div class="fig"><img src="img/week-04-gpt3-gap.svg" alt="Illustration from Table H.1: few-shot minus zero-shot accuracy against model size; symbol insertion rises to +58.9 and 3-digit addition to +46.2 at 175B, WebQuestions to +27.1, LAMBADA from -20.7 to +10.2, TriviaQA peaks at 13B and falls to +6.9, HellaSwag stays near zero"></div>
</div>

<p class="footnote">Brown et al. 2020 · Table H.1 (every task, every size). Symbol insertion: remove random symbols from a word; WebQuestions, TriviaQA: factual questions; HellaSwag: pick the sensible ending; PIQA: physical common sense; ARC: school science exams</p>

Note:
The paper's central claim is about size: the value of examples grows with the model. The results sections mostly quote 175B numbers, but the appendix table H.1 has every task in every setting at every size, so we can test the claim task by task. On the right, few-shot minus zero-shot for a handful of tasks.
Three kinds of task. On some the gap grows strongly with size: symbol insertion ends at plus 59 points, 3-digit addition at plus 46, WebQuestions at plus 27; LAMBADA starts negative, examples hurting small models, and ends at plus 10. On others there's little or no gap at any size: HellaSwag, PIQA, ARC; the model either does the task from the question alone or not at all. And on TriviaQA the gap shrinks at the top.
Predict before I answer: why would it shrink? Zero-shot catches up, 41.8 at 13B to 64.3 at 175B. Our reading, not the paper's: the examples teach the answer format, and a big enough model gets the format from the question alone.
Footnote detail: Table H.1 gives every task at every size in zero-, one- and few-shot; WebQuestions and TriviaQA give no documents.

---

<p class="eyebrow"><span class="paper">Brown et al. 2020</span> · §3.2 · Fig. 3.3</p>

## Does knowledge grow with size?

<div class="cols wide-fig">
<div class="text">

- few-shot: 6.96% (125M) ▸ 71.2% (175B)
- smooth in all three settings
- "continue to absorb knowledge"
- the gap shrinks at the top

<p class="q"><b>Q.</b> Does this show reliable knowledge?</p>
<p class="a"><b>A.</b> No: exact match on short answers</p>

</div>
<div class="fig"><img src="img/week-04-gpt3-fig3-3.png" alt="Brown et al. Figure 3.3: TriviaQA accuracy against model size for zero-, one- and few-shot, rising smoothly; few-shot passes the fine-tuned state of the art at 175B"></div>
</div>

<p class="footnote">Brown et al. 2020 · Fig. 3.3, Table H.1. TriviaQA: trivia questions; few-shot result on the wiki-split test server</p>

Note:
TriviaQA against size. All three settings rise smoothly, few-shot from 7% at the smallest model to 71% at 175B, and the caption reads it as the model continuing "to absorb knowledge as their capacity increases".
Tie back to the size table: this is the task whose gap shrinks at 175B. Zero-shot jumps most at the top. Our reading: the knowledge grows with size, and the big model no longer needs examples to know how to answer.
What it doesn't show: that the model knows facts reliably. This is exact match on short answers, and Natural Questions shows the limit.

---

<p class="eyebrow"><span class="paper">Brown et al. 2020</span> · §3.3 · Table 3.4</p>

## Can it translate without being given paired data?

<table class="rules">
  <tr><td>BLEU</td><td>En▸Fr</td><td>Fr▸En</td><td>En▸De</td><td>De▸En</td><td>En▸Ro</td><td>Ro▸En</td></tr>
  <tr><td>best supervised cited</td><td><b>45.6</b></td><td>35.0</td><td><b>41.2</b></td><td>40.2</td><td><b>38.5</b></td><td><b>39.9</b></td></tr>
  <tr><td>best prior unsupervised (ours)</td><td>37.5</td><td>34.9</td><td>29.8</td><td>35.2</td><td>35.2</td><td>33.1</td></tr>
  <tr><td>GPT-3 zero-shot</td><td>25.2</td><td>21.2</td><td>24.6</td><td>27.2</td><td>14.1</td><td>19.9</td></tr>
  <tr><td>GPT-3 one-shot</td><td>28.3</td><td>33.7</td><td>26.2</td><td>30.4</td><td>20.6</td><td>38.6</td></tr>
  <tr><td>GPT-3 few-shot</td><td>32.6</td><td>39.2</td><td>29.7</td><td>40.6</td><td>21.0</td><td>39.5</td></tr>
</table>

<p class="q"><b>Q.</b> Where does it win? <b>A.</b> Into English. Out of English it trails; En▸Ro "over 10 BLEU worse"</p>

<p class="footnote">Brown et al. 2020 · §3.3, Table 3.4 (multi-bleu). Unsupervised: XLM, MASS, mBART, trained without paired sentences. En English, Fr French, De German, Ro Romanian; En▸Fr is English to French. Few-shot $K$ = 64. 7% of training words are non-English</p>

Note:
Why is translation a good test? GPT-3 was given no deliberately paired data: it "learns from a blend of training data that mixes many languages together in a natural way", and only 7% of its words aren't English. Six directions, English with French, German and Romanian; few-shot uses 64 examples, a page or two of text.
Read the columns that end in English against those that start with it. Into English, few-shot GPT-3 beats the prior unsupervised systems, "reflecting its strength as an English LM", a language model. Out of English it trails, and English to Romanian is over 10 BLEU worse; the authors' guess is GPT-2's tokenizer, built for almost entirely English text.
Averaged over all six, few-shot is "similar average performance to prior unsupervised NMT work", neural machine translation. One example gives the biggest jump: on our averages, 22.0 zero-shot, 29.6 one-shot, 33.8 few-shot. Note the format: zero-shot is a question, one- and few-shot are "sentence equals". Our reading is that much of that jump is learning the format, then its English does the work.
Footnote detail: SacreBLEU in App. H runs higher, De▸En 43.0. Bold in the table is as in the paper. Our unsupervised row takes the best of XLM, MASS and mBART in each column.

---

<p class="eyebrow"><span class="paper">Brown et al. 2020</span> · §3.9.1 · Fig. 3.10</p>

## What happens between 13B and 175B?

<div class="cols wide-fig">
<div class="text">

- under 15% up to 6.7B
- 13B: 2-digit about half (55.5, 52.4)
- 175B: most lines jump
- "a significant jump" (caption)

<p class="q"><b>Q.</b> 175B with no examples, or 13B with 50?</p>
<p class="a"><b>A.</b> 3-digit addition: 34.2 vs 8.4. The big model</p>

</div>
<div class="fig"><img src="img/week-04-gpt3-fig3-10.png" alt="Brown et al. Figure 3.10: few-shot accuracy on ten arithmetic tasks against model size; nearly all below 15% up to 6.7B, 2-digit addition and subtraction near 55% at 13B, and large jumps at 175B"></div>
</div>

<p class="footnote">Brown et al. 2020 · Fig. 3.10, §3.9.1. 2D+: 2-digit addition; 3D+: 3-digit addition</p>

Note:
Figure 3.10, few-shot accuracy against size, one line per task. Almost everything is below 15% up to 6.7B. At 13B, 2-digit addition and subtraction reach about half. At 175B most lines jump: the caption calls it "a significant jump from the second largest model".
Check it: on 3-digit addition, which is better, 175B with no examples at all or 13B with fifty? 34.2 against 8.4: the big model with nothing. The paper: "even zero-shot performance of the full GPT-3 significantly outperforms few-shot learning for all smaller models."
Forward pointer: in Week 6, Schaeffer et al. run new arithmetic tests on four OpenAI models and ask whether jumps like this come from the model or from exact-match scoring and testing only a few sizes.

---

<p class="eyebrow"><span class="paper">Brown et al. 2020</span> · §3.9.1</p>

## Is it just looking the answers up?

<div class="cols">
<div class="text">

<table class="rules">
  <tr><td>3-digit test problems</td><td>found in training data</td></tr>
  <tr><td>addition, 2,000</td><td>17 (0.8%)</td></tr>
  <tr><td>subtraction, 2,000</td><td>2 (0.1%)</td></tr>
</table>

</div>
<div class="text">

- searched as "NUM1 + NUM2 =" and "NUM1 plus NUM2"
- errors like "not carrying a 1"

<p class="q"><b>Q.</b> What does this rule out, and not?</p>
<p class="a"><b>A.</b> Rules out verbatim lookup of these problems. Not other phrasings, or frequent numbers being easier; no error counts given</p>

</div>
</div>

<p class="footnote">Brown et al. 2020 · §3.9.1: mistakes "suggesting it is actually attempting to perform the relevant computation rather than memorizing a table"</p>

Note:
The memorisation spot-check. They took the 3-digit test problems and searched the training data for them, written as "number plus sign number equals" and "number plus number". Of 2,000 addition problems, 17 matches; of 2,000 subtraction problems, 2. And looking at wrong answers, "the model often makes mistakes such as not carrying a 1, suggesting it is actually attempting to perform the relevant computation rather than memorizing a table."
What this rules out: verbatim lookup of these exact problems. What it doesn't: problems written some other way, and softer dependence on the training data, such as frequent numbers being easier. And the carry-error evidence is an impression; no count is given.

---

<p class="eyebrow"><span class="paper">Brown et al. 2020</span> · §3.9.2</p>

## Why can no model reverse a word?

<blockquote>"our BPE encoding operates on significant fractions of a word (on average ∼0.7 words per token), so from the LM's perspective succeeding at these tasks involves not just manipulating BPE tokens but understanding and pulling apart their substructure."</blockquote>

<div class="cols">
<div class="text">

- the model sees token IDs, not letters
- "objects" is one or two tokens
- to reverse it: know the letters inside

</div>
<div class="text">

<p class="q"><b>Q.</b> Does the same hit arithmetic?</p>
<p class="a"><b>A.</b> Plausibly, numbers are tokens too. Not discussed in the paper</p>

</div>
</div>

<p class="footnote">Brown et al. 2020 · §3.9.2. BPE: byte-pair encoding; LM: language model. Reversed words, 175B few-shot: 0.44%</p>

Note:
No model can reverse a word: 0.44% at 175B. The paper's explanation is worth reading in full: the tokenizer works on pieces of words, about 0.7 words per token, so to succeed the model has to understand and pull apart the substructure of its tokens. It never sees the letters o-b-j-e-c-t-s; it sees one or two token IDs, and to reverse the word it must know what letters sit inside each.
Our reading: the same issue plausibly limits long arithmetic, since numbers are tokens too. The paper doesn't discuss that.

---

<p class="eyebrow"><span class="paper">Brown et al. 2020</span> · §3.7 · Table 3.8</p>

## Does few-shot GPT-3 match fine-tuned models on SuperGLUE?

<table class="rules">
  <tr><td></td><td>Avg</td><td>BoolQ</td><td>CB</td><td>COPA</td><td>RTE</td><td>WiC</td><td>WSC</td><td>MultiRC</td><td>ReCoRD</td></tr>
  <tr><td>fine-tuned state of the art</td><td><b>89.0</b></td><td><b>91.0</b></td><td><b>96.9</b></td><td><b>94.8</b></td><td><b>92.5</b></td><td><b>76.1</b></td><td><b>93.8</b></td><td><b>62.3</b></td><td><b>92.5</b></td></tr>
  <tr><td>fine-tuned BERT-Large</td><td>69.0</td><td>77.4</td><td>83.6</td><td>70.6</td><td>71.7</td><td>69.6</td><td>64.6</td><td>24.1</td><td>71.3</td></tr>
  <tr><td>GPT-3 few-shot</td><td>71.8</td><td>76.4</td><td>75.6</td><td>92.0</td><td>69.0</td><td>49.4</td><td>80.1</td><td>30.5</td><td>90.2</td></tr>
</table>

<p class="q"><b>Q.</b> Where does it win, and where is it at chance? <b>A.</b> Beats BERT-Large on COPA, WSC, MultiRC, ReCoRD; WiC 49.4 is chance</p>

<p class="footnote">Brown et al. 2020 · §3.7, Table 3.8 (test server, $K$ = 32). SuperGLUE: eight language-understanding tasks scored 0 to 100. BoolQ: yes/no questions about a passage; CB, RTE: does one sentence imply another; COPA: pick cause or effect; WiC: same word sense in two sentences; WSC: pronoun resolution; MultiRC: several correct answers; ReCoRD: fill in an entity</p>

Note:
Why SuperGLUE? It is the standard suite for fine-tuned models, so it is the cleanest few-shot against fine-tuned comparison in the paper. Eight tasks, 32 examples in the prompt for each, scored on the test server.
Read the table by rows. The top row is the best fine-tuned system, 89.0 on average. GPT-3 few-shot gets 71.8: above fine-tuned BERT-Large, 69.0, but 17 points short of the state of the art. By task it beats BERT-Large on four of eight, COPA, WSC, MultiRC and ReCoRD, and comes close to the state of the art on COPA and ReCoRD. And on WiC it is at 49.4, which is chance for a yes/no task.
So "sometimes competitive" holds task by task, and "matches fine-tuning" does not hold on the suite. The next slides look at why some tasks fail.
Footnote detail: for CB, MultiRC and ReCoRD the table shows accuracy (F1 is also given); the paper bolds the fine-tuned row.

---

<p class="eyebrow"><span class="paper">Brown et al. 2020</span> · §3.6 to §3.8 · Table 3.7</p>

## Which tasks does it fail on, and what do they share?

<div class="cols">
<div class="text">

<table class="rules">
  <tr><td>175B few-shot</td><td>GPT-3</td><td>fine-tuned best</td></tr>
  <tr><td>WiC</td><td>49.4</td><td>76.1</td></tr>
  <tr><td>RTE</td><td>69.0</td><td>92.5</td></tr>
  <tr><td>ANLI Round 3</td><td>40.2</td><td>48.3</td></tr>
  <tr><td>QuAC (F1)</td><td>44.3</td><td>74.4</td></tr>
  <tr><td>DROP (F1)</td><td>36.5</td><td>89.1</td></tr>
  <tr><td>RACE-h</td><td>46.8</td><td>90.0</td></tr>
  <tr><td>RACE-m</td><td>58.1</td><td>93.1</td></tr>
</table>

</div>
<div class="text">

- WiC: "a number of different phrasings", none worked
- all: compare two pieces of text, or re-read a passage

<p class="q"><b>Q.</b> How much do examples help on ANLI?</p>
<p class="a"><b>A.</b> +0.1 at 13B, +5.7 at 175B</p>

</div>
</div>

<p class="footnote">Brown et al. 2020 · §3.6 to §3.8; Tables 3.7 to 3.9. ANLI: adversarial sentence pairs, three-way. QuAC: dialogue questions; DROP: questions needing counting; RACE: English exams (h high school, m middle). Gains: Table H.1 (ours)</p>

Note:
Put the failures side by side. On WiC, whether a word means the same in two sentences, GPT-3 is at chance; the authors tried "a number of different phrasings and formulations" and none helped. On RTE only the largest model is "convincingly better than random". On reading comprehension it is far behind: QuAC is 13 F1 below an ELMo baseline, DROP is 36.5 against 89.1, RACE-h is 43 points behind (our subtraction).
What do they share? Each asks the model to compare two pieces of text, or to look back over a passage and give a short answer. And in the appendix table H.1, examples add only +0.1 points on ANLI Round 3 at 13B, and +5.7 at 175B. So for ANLI at least the failure is not a missing format that examples can supply: for most of the size range, examples don't help at all. We did not check the other tasks in this table.
Footnote detail: ELMo is an earlier word-embedding model. ANLI: adversarially written sentence pairs, three-way (follows, contradicts, unclear). QuAC: questions in a teacher-student dialogue. DROP needs counting or arithmetic. ANLI gains are few-shot minus zero-shot from Table H.1.

---

<p class="eyebrow"><span class="paper">Brown et al. 2020</span> · §3.9.4 · Table 3.11, Fig. 3.13</p>

## How well do people detect it, as models grow?

<div class="cols wide-fig">
<div class="text">

- 125M: 76%; 13B: 55%; 175B: 52% (interval 49-54)
- control: 86%; chance: 50%
- 500-word follow-up: control 88%, 175B 52% (48-57)
- best-disguised article: spotted by 12%

<p class="q"><b>Q.</b> Why can't $ax^{-b}$ hold far past 175B?</p>
<p class="a"><b>A.</b> It heads to 0, but guessing scores 50% (ours)</p>

</div>
<div class="fig"><img src="img/week-04-gpt3-fig3-13.png" alt="Brown et al. Figure 3.13: human accuracy at detecting model-generated news against number of parameters on a log axis; dots with error bars fall from about 76 percent at 125M to about 52 percent at 175B, a fitted power-law curve with a shaded band, and dashed lines at the 86 percent control and 50 percent chance"></div>
</div>

<p class="footnote">Brown et al. 2020 · §3.9.4, Table 3.11, Fig. 3.13 (dots: Table 3.11, dotted bars: 95% confidence intervals; solid curve: fitted power law $ax^{-b}$). Follow-up: 12 Reuters articles, GPT-3's about 498 words (Table 3.12)</p>

Note:
Detection falls toward chance as the model grows. The small model is spotted 76% of the time, 13B 55%, and for 175B the accuracy is 52% with an interval, 49 to 54%, that includes 50. The 500-word follow-up with Reuters articles gives the same: 88% for the control, 52% for GPT-3. People also spent more time per article as the model grew, so, by our reading, lower accuracy didn't come from less effort.
What it does not show: that GPT-3 writes good journalism. Participants were the general public, with no fact-checking, and the articles were short. Medium, at 61%, was harder to spot than Large, at 68%, so the trend is noisy. The authors also note that automatic detectors "may have greater success".
Check it: the figure's solid curve is a power law. A power law in accuracy goes to zero as the model grows, but people guessing at random still score 50%. So the fitted curve can't be read as a law that keeps going.

---

<p class="eyebrow"><span class="paper">Brown et al. 2020</span> · §4 · Fig. 4.1</p>

## Why does the test set matter more at this scale?

<div class="cols wide-fig">
<div class="text">

- hundreds of billions of web tokens
- test sets "often exist on the web"
- a model that memorised would look capable
- train and validation loss: gap barely grows with size

<p class="q"><b>Q.</b> What would overfitting look like here?</p>
<p class="a"><b>A.</b> Dashed (train) far below solid (validation), more for big models</p>

</div>
<div class="fig"><img src="img/week-04-gpt3-fig4-1.png" alt="Brown et al. Figure 4.1: training and validation cross-entropy loss against tokens elapsed up to 300 billion for every model size; dashed training lines sit only slightly below the solid validation lines at every size"></div>
</div>

<p class="footnote">Brown et al. 2020 · §4, Fig. 4.1: "the gap grows only minimally with model size and training time". Cross-entropy: average negative log-probability per token, in nats</p>

Note:
Why does contamination matter more here than for earlier models? The training data is about two orders of magnitude bigger than GPT-2's, scraped from the web, and benchmark test sets are on the web. If the model has seen the answers, a high score tells you about memory, not about ability.
The authors' prior is that contamination "is likely to be frequent, but that its effects may not be as large as feared", because even the 175B model "does not overfit its training set by a significant amount". Figure 4.1 is that evidence: training loss, dashed, and validation loss, solid, for every size. The dashed lines sit a little below the solid ones, but the gap grows only minimally with size and with training time. The authors read the gap as a difference in difficulty between the two sets, not overfitting.
This is evidence about the model's loss on typical text. It says nothing about any one benchmark, which is what the next slides address.
Full quote from §4: "the gap grows only minimally with model size and training time, suggesting that most of the gap comes from a difference in difficulty rather than overfitting".

---

<p class="eyebrow"><span class="paper">Brown et al. 2020</span> · §4 · Fig. 4.2</p>

## How do you read Figure 4.2?

<div class="rows">
<div class="points">
<div class="text">

- x: how much of the benchmark is clean
- y: percent change in score, clean part only
- above zero: the clean part did better
- below zero: the dirty part helped

</div>
<div class="text">

<p class="q"><b>Q.</b> If memorisation mattered, where would points sit?</p>
<p class="a"><b>A.</b> Dirty benchmarks (left), below zero, falling with dirtiness</p>

</div>
</div>
<div class="fig"><img src="img/week-04-gpt3-fig4-2.png" alt="Brown et al. Figure 4.2: percent change in performance on the clean subset against the percentage of data that is clean, for about forty benchmarks; most points sit near zero; QuAC is at plus 20 percent and DROP at minus 21 percent at the far left, reversed words at minus 26 percent near 93 percent clean"></div>
</div>

<p class="footnote">Brown et al. 2020 · §4, Fig. 4.2 (x: "a conservative lower bound for how much of the dataset is known with high confidence to be clean"). "No evidence that contamination level and performance difference are correlated"</p>

Note:
How to read the figure. Each dot is one benchmark. Left to right is how much of it is clean: a dot at the far left is a benchmark that is almost entirely flagged. Up and down is how the score changes when you keep only the clean part, in percent. Above zero, the clean part did better; below zero, including the dirty examples helped.
Predict before looking: if the model were getting its scores by memorising test examples, the dirty benchmarks, on the left, should sit below zero, and the drop should grow as you go left.
That's not what you see. Most points sit on the zero line at every level of contamination, and the paper says "we see no evidence that contamination level and performance difference are correlated". Their conclusion is an either-or: "either our conservative method substantially overestimated contamination or that contamination has little effect on performance". A few points do sit off the line; the paper lists them in Table C.1.

---

<p class="eyebrow"><span class="paper">Brown et al. 2020</span> · §4 · limitations of the check</p>

## What does the contamination check show, and not show?

<div class="cols">
<div class="text">

- shows: verbatim overlap does not drive the scores
- clean and full scores track each other
- small models show the same shifts
- misses paraphrases, translations, frequent patterns

</div>
<div class="text">

<p class="q"><b>Q.</b> What is the authors' own worry?</p>
<p class="a"><b>A.</b> "we cannot be sure that the clean subset is drawn from the same distribution"</p>

</div>
</div>

<p class="footnote">Brown et al. 2020 · §4. Distribution: the clean subset may be systematically easier or harder than the full set. Our summary of what the check covers</p>

Note:
What the check shows: copying of test examples doesn't explain GPT-3's scores. Clean and full scores move together, and small models, which can't memorise much, show the same shifts as the large one.
What it doesn't show: that the model never met the tasks in other forms. An n-gram check misses paraphrases, translations and frequent patterns. And the authors name the deepest problem themselves: the clean subset might not be drawn from the same distribution as the original. Suppose dirty examples are easier, because they are popular and quoted online. Then memorisation might inflate the dirty score while the clean subset looks fine for a separate reason. Their reply is practical: so many shifts sit near zero that this would require a coincidence. That's a fair argument, not a proof.
Keep this in mind for the arithmetic claim, which leans on the same kind of check.
Their reply, in the paper's words: "the sheer number of shifts close to zero suggests this is unlikely".

---

<p class="eyebrow"><span class="paper">Brown et al. 2020</span> · §5 · Limitations</p>

## What do the authors say GPT-3 cannot do?

<table class="rules">
  <tr><td>limit</td><td>in their words</td></tr>
  <tr><td>text quality</td><td>long samples "repeat themselves", "lose coherence", "contradict themselves"</td></tr>
  <tr><td>common sense physics</td><td>"If I put cheese into the fridge, will it melt?"</td></tr>
  <tr><td>comparison tasks</td><td>"little better than chance" on WiC, ANLI, some reading</td></tr>
  <tr><td>direction</td><td>untested; see the slide on comparing two texts</td></tr>
  <tr><td>sample efficiency</td><td>sees "much more text ... than a human sees in their lifetime"</td></tr>
  <tr><td>cost</td><td>"expensive and inconvenient to perform inference on"</td></tr>
  <tr><td>the usual limits</td><td>not interpretable, not "well-calibrated", "retains the biases"</td></tr>
</table>

<p class="footnote">Brown et al. 2020 · §5. Two more limits get their own slides: the training objective, and learning versus recognising. Calibrated: a model's confidence matches how often it is right</p>

Note:
The limitations section is unusually candid, and the table gives it in the authors' words. Text quality: long samples repeat themselves, lose coherence and contradict themselves. Physical common sense is weak. Comparison tasks are "little better than chance". On architecture, they trained no bidirectional models. On efficiency, the model sees far more text in pretraining than a person does in a lifetime, and is expensive to run, which they suggest distillation could address. And the standard limits of deep learning apply: hard to interpret, not necessarily well-calibrated, and it keeps the biases of its data.
Two further limits deserve their own slides, because the rest of the week and the later work grow out of them.

---

<p class="eyebrow"><span class="paper">Brown et al. 2020</span> · §5 · Limitations</p>

## What is wrong with the training objective itself?

<blockquote>"Our current objective weights every token equally and lacks a notion of what is most important to predict."</blockquote>

<div class="cols">
<div class="text">

- useful systems: "goal-directed actions", not just predictions
- remedies named: "learning the objective function from humans"
- "fine-tuning with reinforcement learning"
- "adding additional modalities"

</div>
<div class="text">

<p class="q"><b>Q.</b> Which readings today pick this up?</p>
<p class="a"><b>A.</b> PPO, then GRPO: reward instead of next-token loss</p>

</div>
</div>

<p class="footnote">Brown et al. 2020 · §5: "scaling pure self-supervised prediction is likely to hit limits". PPO: proximal policy optimization; GRPO: group relative policy optimization (both later this week)</p>

Note:
This is the sentence that connects the paper to the rest of today. Next-token prediction treats every token as equally important. A useful assistant, though, "might be better thought of as taking goal-directed actions rather than just making predictions". The authors name three remedies: learn the objective from humans, fine-tune with reinforcement learning, or add other modalities such as images.
They don't test any of them. The second is what the next readings take up: PPO and GRPO, later today, change this signal.
Is this a result? No: it is a direction, with no experiment.

---

<p class="eyebrow"><span class="paper">Brown et al. 2020</span> · §5 · Limitations</p>

## Does the model learn the task, or recognise it?

<div class="rows">
<div class="points">
<div class="text">

- "These possibilities exist on a spectrum"
- word scrambling, nonsense words: "especially likely to be learned de novo"
- translation: "clearly must be learned during pretraining"
- "an important unexplored direction"

</div>
<div class="text">

<p class="q"><b>Q.</b> Place LAMBADA with blanks, WebQuestions, symbol insertion</p>
<p class="a"><b>A.</b> Different format; style of a general task; near de novo (ours)</p>

</div>
</div>
<div class="fig"><img src="img/week-04-gpt3-spectrum.svg" alt="Illustration: the four points of the authors' spectrum, from demonstrations drawn from the same distribution as the test, to the same task in a different format, to the style of a general task such as question answering, to a skill learned entirely de novo, with an arrow from recognise to learn"></div>
</div>

<p class="footnote">Brown et al. 2020 · §5; our placements of three tasks. De novo: from scratch. LAMBADA with blanks: guess a passage's last word, asked as fill-in-the-blank. Later work on this question: press ↓</p>

Note:
This is the key passage of the limitations, and it is the question the paper left on purpose. Few-shot learning could mean four different things, which "exist on a spectrum": the test-time demonstrations may look like demonstrations that were in the training set; or the model recognises the same task in a different format; or it adapts to the style of a general task such as question answering; or it learns a skill entirely de novo. "Where GPT-3 is on this spectrum may also vary from task to task."
The authors place word scrambling and nonsense words near the de novo end, and translation at the other, clearly learned in pretraining. They end: "understanding precisely how few-shot learning works is an important unexplored direction for future research."
Check it with the room: where do LAMBADA with blanks, WebQuestions and symbol insertion sit? Our placement: LAMBADA is the same task in a different format, WebQuestions is the style of a general task, and symbol insertion is near de novo, by the authors' own placement. The sub-slides below are what later work found.

--

<p class="eyebrow"><span class="paper">Brown et al. 2020</span> · Later work · Min et al. 2022</p>

## Do the labels in the examples even matter?

<div class="rows">
<div class="points">
<div class="text">

- swap the labels for random ones
- cost: only 0 to 5 points (mean 2.6, classification)
- six language models, 774M to 175B
- what matters: label space, inputs, format

</div>
<div class="text">

<p class="q"><b>Q.</b> Does it always hold?</p>
<p class="a"><b>A.</b> No: Yoo et al.: up to 80 points on some tasks</p>

</div>
</div>
<div class="fig"><img src="img/week-04-gpt3-min-fig1.png" alt="Min et al. Figure 1: classification macro-F1 and multiple-choice accuracy for no demonstrations, demonstrations with gold labels and demonstrations with random labels, for MetaICL, GPT-J and GPT-3; random labels lose little of the gain over no demonstrations"></div>
</div>

<p class="footnote">Min et al. 2022 · arXiv:2202.12837 · Fig. 1, §4; Yoo et al. 2022 · arXiv:2205.12685 (hate speech, GPT-J). Macro-F1: F1 averaged over classes. Gold labels: the correct ones. MetaICL: a 774M model trained on many tasks</p>

Note:
Min et al. take the examples in the prompt and replace their labels with random ones. If the model were learning the input to label mapping from the examples, this should hurt a lot. It doesn't: across six language models up to 175B GPT-3, accuracy falls by only 0 to 5 points, 2.6 on average for classification. What the examples seem to supply is the label space, the distribution of inputs and the format. That looks like recognition: the examples tell the model which task it's in.
It isn't the whole story. Yoo et al. find tasks, hate speech with GPT-J for one, where correct against all-wrong labels differ by up to 80 points. So for some tasks the labels matter a lot.

--

<p class="eyebrow"><span class="paper">Brown et al. 2020</span> · Later work · Wei et al. 2023</p>

## What if every label is flipped?

<div class="cols wide-fig">
<div class="text">

- flip all labels, or use "Foo/Bar": only the largest follow the flip below chance
- text-davinci-002, all labels flipped: 90.3 ▸ 22.5
- base GPT-3, even 175B: only falls to chance
- instruction-tuned PaLM: follows flips less

<p class="q"><b>Q.</b> Is base GPT-3 "large" here?</p>
<p class="a"><b>A.</b> No: the authors count it "small"</p>

</div>
<div class="fig"><img src="img/week-04-gpt3-wei23-fig1.png" alt="Wei et al. Figure 1: regular in-context learning with natural labels, flipped-label in-context learning with swapped positive and negative labels, and semantically-unrelated-label in-context learning with Foo and Bar"></div>
</div>

<p class="footnote">Wei et al. 2023 · arXiv:2303.03846 · Fig. 1, §3. Flipped-label: positive examples marked negative and the reverse. Flan-PaLM (instruction-tuned) against PaLM; Wei et al. do not compare InstructGPT with GPT-3</p>

Note:
Wei et al. push on Min's result from the other side. Flip every label, so positive reviews are marked negative, and see whether the model follows the examples or its prior. A model that really learns the mapping from the prompt should go below chance, because the right answer under the flip is the opposite of the sensible one.
Only the largest models do. PaLM and OpenAI's text-davinci-002 and code-davinci-002 follow the flip; text-davinci-002 drops from 90.3% to 22.5%. Base GPT-3, even at 175B, only falls to chance, and the authors count every base GPT-3 model as small here. Instruction tuning works the other way: Flan-PaLM, the instruction-tuned version of PaLM, follows flipped labels less than PaLM does. (Wei et al. compare PaLM with Flan-PaLM, not GPT-3 with InstructGPT, because they cannot tell if instruction tuning is the only difference there.)
So the ability to override a prior from the examples grows with scale, but it's not what the base GPT-3 shows.
Footnote detail: the models that follow flips are PaLM-540B, text-davinci-002 and code-davinci-002; base davinci does not. Quote: "Instruction-tuned models are more reluctant to follow flipped labels".

---

<p class="eyebrow"><span class="paper">Brown et al. 2020</span> · §6.2.1 · Gender</p>

## How do you measure gender bias in a language model?

<div class="cols">
<div class="text">

- prompt: "The {occupation} was a"; compare the chance of male and female words
- 83% of 388 occupations lean male

<div class="eq">$$\frac{1}{n_{\rm jobs}} \sum_{\rm jobs} \log \frac{P(\text{female} \mid \text{context})}{P(\text{male} \mid \text{context})}$$</div>

</div>
<div class="text">

<table class="rules">
  <tr><td>prompt</td><td>score</td><td>female ÷ male</td></tr>
  <tr><td>"The {occupation} was a"</td><td>−1.11</td><td>0.33</td></tr>
  <tr><td>"The competent {occupation} was a"</td><td>−2.14</td><td>0.12</td></tr>
  <tr class="total"><td>"The incompetent {occupation} was a"</td><td>−1.15</td><td>0.32</td></tr>
</table>

<p class="q"><b>Q.</b> Why does "competent" make it worse?</p>
<p class="a"><b>A.</b> Not explained; perhaps praise co-occurs with men in the text (ours)</p>

</div>
</div>

<p class="footnote">Brown et al. 2020 · §6.2.1, Table 6.1. Last column: $e^{\text{score}}$ (ours), a geometric mean over occupations. Winogender: a pronoun-resolution test</p>

Note:
The first of three preliminary probes. Prompt "The occupation was a", and compare how likely a male word is against a female word. The bias score is the average, over occupations, of the log of the ratio of female to male probability. Zero would be no bias. It is negative: minus 1.11.
Read it as a ratio. An average of logs exponentiates to a geometric mean over occupations, so for the typical occupation a female word gets e to the minus 1.11, about 0.33, of the male word's probability. With "competent" in the prompt the ratio drops to 0.12, about an eighth. With "incompetent" it barely moves, 0.32. The paper doesn't say why; a plausible reading of ours is that praise for competence co-occurs more often with men in the training text.
On Winogender pronoun resolution, 175B was the most accurate model, 64.17%. And female pronouns co-occur with appearance words such as "beautiful", 158 times. The paper's summary line: "internet-trained models have internet-scale biases". It links back to the data slide: the mixture decides what the model reads most.
Moved from the slide: midwife, nurse and receptionist lean female. Winogender: 175B was most accurate, 64.17%. "Beautiful" co-occurs with female words 158 times.

---

<p class="eyebrow"><span class="paper">Brown et al. 2020</span> · critique 1 · §2.4, §5</p>

## Do the scores say anything about one fixed prompt?

<div class="cols">
<div class="text">

- every test question: a fresh random draw of $K$ examples
- so each score averages over thousands of prompts
- another seed, in the two rows we checked: under a point
- in use: one prompt, reused for every input

</div>
<div class="text">

<p class="q"><b>Q.</b> Does it sink the argument?</p>
<p class="a"><b>A.</b> No: the averages are robust. But "how good is my prompt?" is untested (press ↓)</p>

</div>
</div>

<p class="footnote">Our critique, not in the paper. Brown et al. 2020 · §2.4; SuperGLUE: "we sampled a new set of examples to use in the context for each problem" (except WSC, MultiRC). App. C seed check: symbol insertion 66.9 vs 67.2, SAT 65.8 vs 65.2</p>

Note:
It is tempting to say GPT-3's scores come from "one random prompt". They don't. Every test question gets a fresh random draw of K examples, and for SuperGLUE a new set for each problem, except WSC and MultiRC. So each score averages over thousands of different prompts, and in the two rows we checked, re-running with a different draw of examples moves scores by under a point: in the contamination table symbol insertion is 66.9 against 67.2, SAT 65.8 against 65.2.
The real gap is the other way round. In use, people write one prompt and reuse it for every input. The averaged scores say nothing about how much a single fixed prompt varies.
Do the authors admit it? Not about prompt choice: §5 mentions higher variance than humans on benchmarks, in a passage about calibration. Does it sink the argument? No, the averages are robust. But the most practical question is untested here. Later work measured it.
On §5 the exact words are "much higher variance in performance than humans on standard benchmarks".

--

<p class="eyebrow"><span class="paper">Brown et al. 2020</span> · Later work · Zhao et al. 2021</p>

## How much does one fixed prompt vary?

<div class="cols wide-fig">
<div class="text">

- one fixed set of 4 SST-2 examples
- reorder them: 54.3% ▸ 93.4%
- near chance to near the state of the art
- ten example sets, each in every order

<p class="q"><b>Q.</b> Which GPT-3?</p>
<p class="a"><b>A.</b> The API model they call 2.7B</p>

</div>
<div class="fig"><img src="img/week-04-gpt3-zhao-fig2.png" alt="Zhao et al. Figure 2: box plots of SST-2 accuracy for ten sets of four training examples, each across all orderings; accuracy within one set spans roughly 50 to 93 percent"></div>
</div>

<p class="footnote">Zhao et al. 2021 · arXiv:2102.09690 · Fig. 2, §3 ("Calibrate Before Use"); numbers from the text. SST-2: movie-review sentiment, positive or negative; chance is 50%. API: the paid web interface for GPT-3</p>

Note:
Zhao et al. do the experiment the paper didn't: fix one prompt for the whole test set. On GPT-3, the API model they call 2.7B, take four SST-2 sentiment examples. Merely reordering the same four examples moved accuracy from 54.3%, near chance, to 93.4%, near the state of the art. Each box in the figure is one set of four examples across all orderings.
How this changes the reading: GPT-3's averaged scores are fine as averages, but a user's single prompt can sit anywhere in a wide range. The gap named in the critique was real and large.

---

<p class="eyebrow"><span class="paper">Brown et al. 2020</span> · critique 2 · Fig. 2.2, Fig. 3.2</p>

## Is bigger better, or more compute and a different format?

<div class="cols">
<div class="text">

- all eight models saw 300B tokens
- so bigger also means more compute
- zero-shot format differs on LAMBADA, translation
- so some of the gain is a format's

</div>
<div class="text">

<p class="q"><b>Q.</b> Does it sink the argument?</p>
<p class="a"><b>A.</b> No. It leaves open parameters vs compute; "bigger, more trained models do more" stands</p>

</div>
</div>

<p class="footnote">Our critique. Brown et al. 2020 · Fig. 2.2 caption ("much larger models on many fewer tokens"), Fig. 3.2 ("different format"). 175B: about 14x the compute of 13B (ours)</p>

Note:
Two confounds. First, every model, from 125 million to 175 billion parameters, saw exactly 300 billion tokens, so a bigger model also got proportionally more compute: "scale helps" mixes more parameters with more compute. Second, on LAMBADA and translation the zero-shot prompt has a different format from the few-shot one, so part of the value of examples is the value of a format.
The authors admit the format in a caption and an appendix. The compute confound they don't discuss; they followed the advice of the scaling-laws analysis, which Week 6's Chinchilla paper later revises. It doesn't sink "bigger, more trained models do more in context". It leaves open whether the gains come from parameters or from compute, and it rules out reading all of LAMBADA's ten-point gain as the value of the examples.

---

<p class="eyebrow"><span class="paper">Brown et al. 2020</span> · Summary</p>

## What does the paper establish, and how far can we trust it?

<table class="rules">
  <tr><td>claim</td><td>evidence</td><td>trust today</td></tr>
  <tr><td>tasks done from the prompt alone</td><td>dozens of benchmarks</td><td>strong</td></tr>
  <tr><td>examples help more with size</td><td>Figs. 1.2, 1.3, 3.8, 3.11; scale test</td><td>strong on some tasks, near zero on many</td></tr>
  <tr><td>few-shot sometimes rivals fine-tuning</td><td>TriviaQA, COPA, ReCoRD, into English</td><td>holds there; far behind on SuperGLUE</td></tr>
  <tr><td>weak at comparing two texts</td><td>WiC, ANLI, RTE, CB</td><td>observed; reason untested</td></tr>
  <tr><td>arithmetic computed, not looked up</td><td>17 of 2,000; carry errors</td><td>verbatim lookup ruled out</td></tr>
  <tr><td>contamination not the cause</td><td>clean-subset scores</td><td>verbatim overlap ruled out</td></tr>
  <tr><td>people cannot tell short news</td><td>Table 3.11, about 80 per model</td><td>strong for this setting</td></tr>
  <tr><td>the model "learns" in context</td><td>rising curves with $K$</td><td>partly: recognition at all sizes</td></tr>
</table>

<p class="footnote">Our assessment, not the paper's. WiC, CB, RTE: sentence-pair tasks; ReCoRD: fill in an entity in a news passage; COPA: cause or effect; TriviaQA: trivia questions</p>

Note:
Three levels of trust, from firm to open. Firm: the behaviour. One pretrained model does dozens of tasks from the prompt alone, with no weight updates. Solid as a trend but narrower than the headline: the value of examples grows with size, on a subset of tasks, over eight models whose size and compute grew together. Open: "learning" as a mechanism. The paper names it and wisely leaves it open; later work splits it into recognition at all sizes and learning that grows with size, with candidate mechanisms shown only in smaller, different models.
Go down the table and ask of each row which part of the abstract's sentence it supports. "Task-agnostic" holds. "Greatly improves" holds on a subset. "Sometimes even reaching competitiveness" is true for some tasks and false on the suite as a whole.

---

<p class="eyebrow"><span class="paper">Brown et al. 2020</span> · Summary · Week 4</p>

## What does GPT-3 hand on to the next readings?

<div class="cols">
<div class="text">

- Raschka: what changed in the block since GPT-3
- PPO, then GRPO: change the training signal
- GPT-3 is the dense baseline throughout

</div>
<div class="text">

<p class="q"><b>Q.</b> Where is the full comparison?</p>
<p class="a"><b>A.</b> In the week's closing section, after all four readings</p>

</div>
</div>

<p class="footnote">Brown et al. 2020 · §5, §7. Order today: GPT-3, Raschka, PPO, GRPO</p>

Note:
A pointer, not a comparison: the closing section of the week sets all four readings side by side. The thread from here: GPT-3 shows how far next-token prediction plus scale goes, and ends by saying where it stops: it "weights every token equally" and its outputs "are not able to perform consistently without human feedback". Raschka's survey is next and shows how the architecture changed in its details; PPO and GRPO, after that, change the objective.
Forward pointers beyond today, one line each: Week 6's Chinchilla paper re-examines the 300-billion-token choice and Schaeffer et al. re-examine sudden-looking jumps like Figure 3.10; in Week 9, InstructGPT fine-tunes GPT-3 with human preferences and PPO, the remedy from the limitations section carried out.

---

<p class="eyebrow"><span class="paper">Brown et al. 2020</span> · Summary</p>

## What to keep from GPT-3

<div class="cols">
<div class="text">

- the prompt is a training set you don't train on
- examples help more with size, on some tasks
- a score is model, prompt and data together
- where it fails is informative

</div>
<div class="text">

<p class="q"><b>Open question</b></p>
<p class="a">Does the model learn the task, or recognise it? Later work says both, in different amounts at different scales</p>

</div>
</div>

<p class="footnote">Brown et al. 2020. Next: Raschka's architecture survey, then PPO and GRPO</p>

Note:
Four ideas. First, the prompt is a training set you don't train on: zero-, one- and few-shot differ only in what sits in the context, and no weights change. Second, bigger models use the examples more, but on some tasks: the few-shot advantage grows with size on synthetic, unusual-format and question-answering tasks, and is near zero at every size on many standard benchmarks. Third, a benchmark score is a property of the model, the prompt and the data together: translation's change of format, contamination and single-prompt sensitivity all show it. Fourth, where it fails is informative: comparing two pieces of text, and anything below the token, such as reversing words or long arithmetic, stayed hard.
The open question: does the model learn the task, or recognise it? The authors asked; later work says both. For class discussion, the paper's own limitation: was the problem the objective, or the lack of a way to steer it?




---

<!-- .slide: class="cover divider" -->

<p class="kicker">Reading 2 of 4</p>
<h1>Raschka 2025</h1>
<p class="subtitle">The Big LLM Architecture Comparison</p>
<p class="question">If GPT's block works, why would anyone change it, and what does each change buy?</p>
<ol class="track"><li class="done">GPT-3 2020<span>few-shot learners</span></li><li class="now">Raschka 2025<span>architectures</span></li><li>PPO 2017<span>policy optimization</span></li><li>GRPO 2024<span>DeepSeekMath</span></li></ol>

Note:
Reading 2 of 4. Not a paper: a long blog post by Sebastian Raschka, first published in July 2025 and updated until April 2026, that draws about thirty open-weight models as block diagrams. The blog is organised by model, 23 sections, and explains each change where a model first uses it; we reorganise it by change, taken in that same order. Six changes, and for each one the same four questions: what is the change, which models use it, how does it help, and what are its costs and open questions.

---

<p class="eyebrow"><span class="paper">Raschka 2025</span> · Introduction · Fig. 1</p>

## Why change an architecture that works?

<div class="cols wide-fig">
<div class="text">

- seven years after GPT: still the same block
- "one might be surprised at how structurally similar"
- most changes attack a cost, not quality (ours)

<p class="q" style="margin-top:18px"><b>Q.</b> Which costs?</p>
<p class="a"><b>A.</b> Cache memory, arithmetic, training blow-ups</p>

</div>
<div class="fig"><img src="img/week-04-raschka-fig1-lineup.png" alt="Raschka Figure 1, two of its six panels: DeepSeek V3 (671B) and Qwen3 235B-A22B; both are the same stack of embedding, repeated blocks of attention and a mixture-of-experts feed-forward with RMSNorm, and an output layer, differing in the details"></div>
</div>

<p class="footnote">Raschka, "The Big LLM Architecture Comparison", Ahead of AI, 19 July 2025, version of 2 April 2026 · Fig. 1 (two of its six models). Cache: the stored keys and values of past tokens, explained shortly</p>

Note:
Raschka's first paragraph: looking from GPT-2 to DeepSeek V3 and Llama 4, "one might be surprised at how structurally similar these models still are." Positions became rotations, attention heads started sharing keys and values, the activation function changed. "Have we truly seen groundbreaking changes, or are we simply polishing the same architectural foundations?"
The figure shows two of the six models in his first figure, DeepSeek V3 and Qwen3 235B-A22B: the same stack, with the same parts in nearly the same places. So the useful question is the one underneath: if the block works, why change it? Sorted by what they do, almost all changes attack one of three costs: the arithmetic each token needs, the cache of keys and values that grows with context, and training runs that blow up. A smaller group is about long context. That sorting is ours. Some changes are also claimed to improve quality, but few such claims have more than one ablation behind them.
What the blog leaves out on purpose: data, training recipes and mostly benchmarks, because these "vary widely and are often not well documented". So it can tell us what each model is, not which choice made which model better.

---

<p class="eyebrow"><span class="paper">Raschka 2025</span> · Outline · the six changes</p>

## Which six parts of GPT-3's block changed?

<div class="rows">
<div class="fig"><img src="img/week-04-raschka-block.svg" alt="Diagram: GPT-3's decoder block, token plus position, then LayerNorm, attention with 96 heads of 128, a residual add, LayerNorm, a feed-forward network from 12288 to 49152 and a residual add, repeated 96 times; six numbered marks: 1 keys and values shared or compressed, 2 one dense feed-forward network replaced by many experts, 3 norm placement, 4 sliding windows, 5 positions, 6 the feed-forward network gated"></div>
</div>

<p class="footnote">Diagram ours, GPT-3 sizes from Brown et al. 2020 Table 2.1. LN: LayerNorm; FFN: feed-forward network; K, V: keys, values. Numbered in the blog's order, next slide. Each change gets what, who, how it helps, and costs</p>

Note:
The map for the rest of the reading. GPT-3 175B is one block repeated 96 times: LayerNorm, attention with 96 heads of 128, each with its own keys and values, a residual add; LayerNorm, a feed-forward network four times as wide as the model, a residual add. Learned position vectors are added once at the input. GPT-3 already alternates full and "locally banded" attention layers, which matters for change 4.
A count we use later: each block has four d-by-d attention matrices and two d-by-4d feed-forward matrices, 12 d squared, ignoring biases and norms. For GPT-3 that's 173.9 billion, and the feed-forward part alone is 116 billion. Two thirds of the weights are in the feed-forward networks, and every token uses all of them.
The six changes, numbered in the order the blog first explains them. 1, keys and values: shared between heads or compressed, which shrinks the cache. 2, the one feed-forward network becomes many experts, of which each token uses a few, which cuts arithmetic. 3, the norm moves, and queries and keys get their own, for training stability. 4, most layers look only at a window of recent tokens, which shrinks the cache at long context. 5, positions: rotations with a bigger base, or no position at all in some layers, for long context. 6, the feed-forward network gets a third, gating matrix; the blog mentions it in one line and gives it no section, so it comes last.
Predict before we start: which of the six cuts arithmetic per token rather than cache memory? Change 2, the mixture of experts. Each change gets the same four slides: what it is, which models use it, how it helps, and what it costs or leaves open. Small extras such as dropped biases and bigger vocabularies are at the end.

---

<p class="eyebrow"><span class="paper">Raschka 2025</span> · Outline · where the blog covers each change</p>

## Where in the blog is each change?

<table class="rules" style="font-size:21px">
  <tr><td>change</td><td>first explained</td><td>with</td><td>comes back in</td></tr>
  <tr><td>1 sharing keys and values</td><td>§1.1</td><td>DeepSeek V3</td><td>§8 Kimi K2, §17 Mistral 3, §21 GLM-5</td></tr>
  <tr><td>2 mixture of experts</td><td>§1.2</td><td>DeepSeek V3</td><td>§6.2 Qwen3, §9.2 gpt-oss, §12.1, §13.2</td></tr>
  <tr><td>3 where the norm goes</td><td>§2.1, §2.2</td><td>OLMo 2</td><td>§3.2 Gemma 3, §13.1 MiniMax</td></tr>
  <tr><td>4 sliding windows</td><td>§3.1</td><td>Gemma 3</td><td>§9 gpt-oss, §19 MiMo, §23 Gemma 4</td></tr>
  <tr><td>5 positions</td><td>§7.1</td><td>SmolLM3</td><td>§13.3 partial RoPE</td></tr>
  <tr><td>6 gated feed-forward</td><td>intro, one line</td><td></td><td>no section: ours</td></tr>
  <tr><td>beyond the six</td><td>§9.1, §9.3, §12, §14</td><td>gpt-oss, Qwen3-Next, Kimi Linear</td><td>one slide, at the end</td></tr>
</table>

<p class="footnote">Raschka 2025, version of 2 April 2026: 23 sections, one per model family, in release order</p>

Note:
The blog is a tour of models, not of changes: 23 numbered sections, from DeepSeek V3 in section 1 to Gemma 4 in section 23. Each technique is explained the first time a model in the tour uses it, as a subsection of that model. Multi-head latent attention and mixture of experts come with DeepSeek V3, the norm changes with OLMo 2, sliding windows with Gemma 3, and no positional embeddings with SmolLM3 in section 7. So our numbering is the blog's order, and the table tells you where to read along.
Later sections are mostly "same as an earlier model, with these numbers changed": Kimi K2 and Mistral 3 reuse DeepSeek V3's architecture, gpt-oss, MiMo and Gemma 4 use windows like Gemma 3. That's why the six changes cover most of the blog.
Two rows are ours. The gated feed-forward network is in every 2025 model but the blog only names it in its first paragraph, so we add it as change 6. And the newer ideas, width against depth, attention sinks, linear-attention hybrids, multi-token prediction, get one slide before the synthesis.

---

<p class="eyebrow"><span class="paper">Raschka 2025</span> · Before the changes · what a token costs</p>

## What does generating one token cost?

<div class="cols wide-fig">
<div class="text">

- decode: one token at a time
- reads every weight: $2N$ FLOPs, $N$ weights
- reads the KV cache: keys, values of every past token
- GPT-3: $2 \times 96 \times 128 \times 96$ = 2.36M numbers per token

<p class="q" style="margin-top:14px"><b>Q.</b> So what limits decoding?</p>
<p class="a"><b>A.</b> Bytes read, not arithmetic</p>

</div>
<div class="fig"><img src="img/week-04-raschka-decode.png" alt="Illustration: gigabytes read per decoding step for GPT-3 against the number of users; weights stay at 350 GB, the KV cache grows by 9.66 GB per user and equals the weights at 36 users"></div>
</div>

<p class="footnote">Illustration, our arithmetic: GPT-3 at 16 bits, weights 350 GB, each user at 2,048 tokens (9.66 GB of cache). Cache per token: $2 n_h d_h n_{\rm layers}$, DeepSeek-V2 arXiv:2405.04434 §2.1.1. FLOPs: floating-point operations</p>

Note:
Before any change, ask what is expensive when a model serves users. Prefill reads the whole prompt at once and keeps the hardware busy. Decode writes the answer one token at a time, and that is where most changes aim.
For each new token every weight is used for one multiply and one add, about 2N operations for N weights, and all N weights are read. In every attention layer the new query is compared with the keys of every earlier token and mixes their values. Those keys and values are stored, not recomputed: the KV cache. Queries aren't stored, because a past token's query is never used again. GPT-3: 2 times 96 heads times 128 times 96 layers, 2.36 million numbers per token, 4.7 megabytes at 16 bits, 9.7 gigabytes for one 2,048-token conversation.
Count bytes against operations. A 16-bit weight is two bytes, used for two operations at batch one: one operation per byte. A current GPU can do a few hundred operations per byte it reads (a vendor figure, not from a reading), so decode is memory-bound. Batching helps by sharing each weight read across users, but each user's cache is read for that user alone. The figure: weights 350 gigabytes, read once per step however many users; the cache grows by 9.7 gigabytes per user and equals the weights at about 36 users. So the cache limits how many users fit, and changes 1 and 4 go after it.

---

<p class="eyebrow"><span class="paper">Raschka 2025</span> · §1.1 · Change 1 of 6, sharing keys and values · What · Fig. 2</p>

## Do the heads need their own keys and values?

<div class="cols wide-fig">
<div class="text">

- MHA (multi-head): every head its own key, value
- GQA (grouped-query): a group of heads shares one
- MQA (multi-query): one for all heads
- MLA (multi-head latent): cache one small compressed vector (↓)

<p class="q" style="margin-top:16px"><b>Q.</b> Why share keys, not queries?</p>
<p class="a"><b>A.</b> Only keys and values are cached</p>

</div>
<div class="fig"><img src="img/week-04-raschka-fig2-gqa.png" alt="Raschka Figure 2: multi-head attention with four query heads each paired with its own key and value, next to grouped-query attention where heads 1 and 2 share one key and value and heads 3 and 4 share another"></div>
</div>

<p class="footnote">Raschka 2025 · §1.1, Fig. 2. MQA: Shazeer 2019. "Groups" is ambiguous: DeepSeek counts key-value heads, Gemma 2's "num_groups = 2" is 2 queries per key-value head. We say key-value heads</p>

Note:
Change 1. In multi-head attention each head has its own query, key and value projections; that's the point of having many heads. But only keys and values get cached, for every head. Grouped-query attention asks: do the heads need their own keys and values, or only their own queries? Split the query heads into groups and let each group share one key head and one value head. Raschka's figure has four query heads and two key-value pairs. At the extreme, all heads share one: multi-query attention.
DeepSeek went another way, multi-head latent attention: keep a key and value for every head, but cache only one small compressed vector per token and rebuild from it. The sub-slide shows how. A warning about the word "groups": DeepSeek's papers count groups, which equals the number of key-value heads; Gemma 2 writes "num_groups = 2" for 32 query heads and 16 key-value heads, so there it means the group size.

--

<p class="eyebrow"><span class="paper">Raschka 2025</span> · §1.1 · Change 1 of 6, sharing keys and values · What · Fig. 3 (sub-slide)</p>

## How does MLA shrink the cache further?

<div class="cols wide-fig">
<div class="text">

- compress: token ▸ one latent $c_t$ (512 numbers), the only thing cached; keys, values rebuilt from it
- trick: fold the rebuild into the query
- RoPE blocks the fold: a 64-number rotated key, shared
- cache per layer: $512 + 64 = 576$, MHA's 32,768

<p class="q" style="margin-top:14px"><b>Q.</b> Extra arithmetic?</p>
<p class="a"><b>A.</b> About 3.4x, but decoding was waiting on memory</p>

</div>
<div class="fig"><img src="img/week-04-raschka-fig3-mla.png" alt="Raschka Figure 3, MLA and MHA panels: at inference step t the input is projected by W_dkv to a compressed key and value, which W_uk and W_uv expand to key and value, next to regular MHA with separate W_q, W_k, W_v; a note says the key idea reduces memory usage in the KV cache"></div>
</div>

<p class="footnote">Raschka 2025 · §1.1, Fig. 3; DeepSeek-V2 arXiv:2405.04434 §2.1.2 to §2.1.3. Sizes: DeepSeek-V3 arXiv:2412.19437 §4.2. RoPE: rotary position embedding (Week 3, change 5). 3.4x is our arithmetic at 131K tokens</p>

Note:
Optional depth, in five steps. Step 1, compress: one down-projection of each token's hidden state h to a small latent c, size 512 in DeepSeek-V3, and only c is cached. Step 2, expand: two up-projections rebuild keys and values for all 128 heads. The key projection has become a product of two thin matrices, the same shape as LoRA's B times A from Week 2, used here to shrink what's stored rather than what's trained.
Step 3, skip the rebuild. The score is the query times W_UK times c, and matrix products associate, so fold W_UK into the query side once and compare the query with the latent directly; fold W_UV into the output matrix. In the paper's words, "we even do not need to compute keys and values out for attention." Raschka's "extra matrix multiplication" is the unfolded version.
Step 4, is it cheap? At 131 thousand tokens the folded version does about 2.2 teraflops per token; re-expanding every latent would be about 268. Against a hypothetical MHA version, 0.65 teraflops but a 524-gigabyte cache instead of 9: 57 times fewer bytes for 3.4 times more arithmetic, about 240 operations per byte against 1.2. The arithmetic is nearly free because decoding was waiting on memory.
Step 5, the snag: RoPE rotates queries and keys by position, so the matrix to fold in would depend on the distance between tokens and can't be folded once. DeepSeek's fix gives position its own small channel: 64 extra rotated dimensions per head, and one 64-number rotated key shared by all heads. Cache per layer: 512 plus 64, 576.
Footnote detail: DeepSeek-V2 §2.1.2 to §2.1.3 says $W^{UK}$ "can be absorbed into $W^{Q}$".

---

<p class="eyebrow"><span class="paper">Raschka 2025</span> · §1.1 · Change 1 of 6, sharing keys and values · Who</p>

## Who shares keys and values, and how much?

<div class="cols">
<div class="text">

<table class="rules" style="font-size:19px">
  <tr><td>model</td><td>attention</td><td>query : KV heads</td><td>cache vs MHA</td></tr>
  <tr><td>GPT-3 175B</td><td>MHA</td><td>96 : 96</td><td>1</td></tr>
  <tr><td>OLMo 2 7B</td><td>MHA</td><td>32 : 32</td><td>1</td></tr>
  <tr><td>Gemma 2 27B</td><td>GQA</td><td>32 : 16</td><td>1/2</td></tr>
  <tr><td>gpt-oss-120b</td><td>GQA</td><td>64 : 8</td><td>1/8</td></tr>
  <tr><td>Qwen3 235B</td><td>GQA</td><td>64 : 4</td><td>1/16</td></tr>
  <tr><td>DeepSeek V3</td><td>MLA</td><td>128 : one latent</td><td>1/57</td></tr>
  <tr><td>Kimi K2*</td><td>MLA</td><td>n/a</td><td>n/a</td></tr>
</table>

</div>
<div class="text">

- most 2025 models: GQA
- saving = query heads per KV head

<p class="q" style="margin-top:16px"><b>Q.</b> GPT-3 with 8 KV heads?</p>
<p class="a"><b>A.</b> $96/8$ = 12 times less cache</p>

</div>
</div>

<p class="footnote">Gemma 2 Table 1; gpt-oss §2.2; Qwen3 Table 2; OLMo 2 §3; DeepSeek-V2 Table 1 and V3 §4.2 (576 vs 32,768 per layer). * per Raschka; n/a: not in our sources. Ratios ours</p>

Note:
Who uses which. GPT-3 and OLMo 2 keep plain multi-head attention, one key and value per head. Most 2025 models use grouped-query attention, and the saving is simply the number of query heads per key-value head: Gemma 2 27B shares only in pairs, half the cache; gpt-oss 64 query heads on 8, an eighth; Qwen3-235B 64 on 4, a sixteenth. The DeepSeek line, V2, V3, and per Raschka Kimi K2, uses MLA: 576 numbers per layer per token where MHA at the same sizes would store 32,768.
Gemma 4, per Raschka, goes further on its global layers: values equal keys, so only one tensor is stored. No ablation is given for that.
Footnote detail: arXiv numbers are Gemma 2 2408.00118, gpt-oss 2508.10925, Qwen3 2505.09388, OLMo 2 2501.00656.

---

<p class="eyebrow"><span class="paper">Raschka 2025</span> · §1.1 · Change 1 of 6, sharing keys and values · How it helps</p>

## How much cache does sharing save?

<div class="cols wide-fig">
<div class="text">

- GPT-3: 2.36M numbers per token
- gpt-oss (GQA): 36.9K; DeepSeek V3 (MLA): 35.1K
- 67x less, for a model 3.8x larger
- MLA's cache = GQA with 2.25 KV heads

<p class="q" style="margin-top:14px"><b>Q.</b> DeepSeek V3 at 131K tokens?</p>
<p class="a"><b>A.</b> 9.2 GB: about GPT-3 at 2,048</p>

</div>
<div class="fig"><img src="img/week-04-raschka-kv.svg" alt="Illustration: keys and values cached per token for the whole model on a log axis: GPT-3 175B with MHA 2.36 million, DeepSeek V3 if it used MHA 2.00 million (hatched, hypothetical), gpt-oss-120b with GQA and 8 KV heads 36.9 thousand, DeepSeek V3 with MLA 35.1 thousand"></div>
</div>

<p class="footnote">Illustration, ours, from DeepSeek-V2 Table 1's formulas ($2 n_h d_h l$ for MHA, $(d_c + d_h^R) l$ for MLA) and each model's sizes. Hatched: hypothetical. DeepSeek-V2 Table 1: MLA's cache "is equal to GQA with only 2.25 groups"</p>

Note:
How it helps: the cache per token, for the whole model. GPT-3 stores 2.36 million numbers per token. DeepSeek V3 with plain MHA would store 2 million; with MLA it stores 35 thousand, 57 times less. gpt-oss with 8 key-value heads lands in the same place, 37 thousand. Against our baseline, DeepSeek V3 caches 67 times less per token than GPT-3 for a model 3.8 times larger, so holding 131 thousand tokens needs about the cache GPT-3 needed for 2 thousand.
576 divided by 2 times 128 is 2.25: the paper's own claim that MLA's cache equals GQA with 2.25 key-value heads, "but its performance is stronger than MHA". The next slide checks that. DeepSeek-V2's headline, 93% less cache and 5.8 times the throughput, compares against their old dense 67B model, which differs in much more than attention, so it isn't an MLA-only number.

---

<p class="eyebrow"><span class="paper">Raschka 2025</span> · §1.1 · Change 1 of 6, sharing keys and values · Costs · DeepSeek-V2 Tables 8, 9</p>

## Does sharing cost quality?

<div class="cols">
<div class="text">

<table class="rules" style="font-size:18px">
  <tr><td>comparison</td><td>source</td><td>MMLU, or average</td></tr>
  <tr><td>GQA vs MHA, dense 7B</td><td>DeepSeek-V2</td><td>41.2 vs 45.2</td></tr>
  <tr><td>GQA vs MHA, 9B</td><td>Gemma 2</td><td>50.8 vs 50.3 (avg of 4)</td></tr>
  <tr><td>MLA vs MHA, MoE 16B</td><td>DeepSeek-V2</td><td>50.0 vs 48.7</td></tr>
  <tr><td>MLA vs MHA, MoE 250B</td><td>DeepSeek-V2</td><td>59.0 vs 57.5</td></tr>
  <tr><td>MLA vs GQA</td><td>none</td><td>never run</td></tr>
</table>

</div>
<div class="text">

- one lab: GQA 4 points worse; another: half a point better
- no error bars, presumably one run each

<p class="q" style="margin-top:14px"><b>Q.</b> Does "MLA beats GQA" follow?</p>
<p class="a"><b>A.</b> No: it chains two experiments</p>

</div>
</div>

<p class="footnote">DeepSeek-V2 App. D, Tables 8 (dense 7B, 1.33T tokens) and 9 (MoE pairs); Gemma 2 Table 8. MMLU: a 57-subject multiple-choice exam. MoE: mixture of experts (change 2). Unmatched: our arithmetic from Table 9's cache row</p>

Note:
Costs and open questions. Raschka says GQA "performs comparably to standard MHA", then prints a DeepSeek-V2 table where it doesn't. Two ablations disagree. DeepSeek-V2: three dense 7B models on 1.33 trillion tokens, identical except attention; MHA beats GQA beats MQA on every benchmark, 4 points on MMLU from GQA to MHA. Gemma 2: two 9B models, GQA 50.8 and MHA 50.3 on an average of four unnamed benchmarks. Gemma shares keys only between pairs of queries; DeepSeek's head count isn't stated; data, scale and benchmarks differ; neither has error bars. Sharing is sometimes cheap, not provably free.
MLA against MHA, in two mixture-of-experts pairs: MLA wins 7 of 8 comparisons with 14% and 4% of MHA's cache. But check the cache row: the large MHA baseline stores 860.2 thousand numbers per token, which is 3,360 heads times layers at head size 128, not the 128 heads times 60 layers of its MLA partner. So it has fewer heads or a different depth, and part of the large-scale win may come from that. It's an inference, but it belongs here.
And no run compares MLA with GQA. "GQA is worse than MHA" comes from dense 7B models, "MLA is better than MHA" from MoE models; Raschka's summary that MLA beats GQA chains the two, which he himself notes.
Footnote detail: Gemma 2's benchmarks are unnamed.

---

<p class="eyebrow"><span class="paper">Raschka 2025</span> · §1.2 · Change 2 of 6, mixture of experts · What · Fig. 5</p>

## Does every token need the whole feed-forward network?

<div class="cols wide-fig">
<div class="text">

- GPT-3: FFN is two thirds of weights, all used
- MoE: many small FFNs, "experts"
- router: scores experts, keeps the top few
- DeepSeek V3: 1 shared (every token uses it) + 8 of 256

</div>
<div class="fig"><img src="img/week-04-raschka-fig5-moe.png" alt="Raschka Figure 5, the MoE layer of DeepSeek V3: a router chooses among 256 feed-forward experts; resource savings: model size 671B, but only 1 shared plus 8 experts active per token, only 37B parameters active per inference step"></div>
</div>

<p class="footnote">Raschka 2025 · §1.2, Fig. 5. MoE: mixture of experts. DeepSeek-V3 arXiv:2412.19437 §2.1.2, §4.2 ("1 shared expert and 256 routed experts")</p>

Note:
Change 2. Back to GPT-3's count: two thirds of its weights are in the feed-forward networks and every token uses all of them, the biggest single cost per token. Mixture of experts asks: does every token need the whole network, or could different tokens use different parts? Replace the one feed-forward network with many smaller ones, the experts, and add a router that picks a few for each token.
How the router chooses, in DeepSeek-V3: each routed expert has a learned vector; a token's affinity to an expert is a sigmoid of their dot product; keep the 8 highest, zero the rest, rescale the kept ones to sum to one, and use them as weights on the experts' outputs. The choice itself has no gradient, but the weights of the chosen experts do, so the router learns through them (that reasoning is ours). gpt-oss does the same with a softmax over its chosen four.
DeepSeek V3 has 256 routed experts per layer plus one shared expert every token uses, so 9 experts run per token, and 37 of 671 billion weights are active. The sub-slide asks why so many small experts, and whether the shared one is worth it.

--

<p class="eyebrow"><span class="paper">Raschka 2025</span> · §1.2 · Change 2 of 6, mixture of experts · What · DeepSeekMoE Fig. 2 (sub-slide)</p>

## Many small experts, and a shared one?

<div class="rows">
<div class="points">
<div class="text">

- split each expert into $m$, choose $m$ times as many
- finer: better on all six benchmarks (2B models)

</div>
<div class="text">

- shared: DeepSeek keeps one; Qwen3 drops it; Qwen3-Next adds it back*
- 1, 2 or 4 shared: Pile loss 1.808, 1.806, 1.811

</div>
</div>
<div class="fig"><img src="img/week-04-raschka-dsmoe-fig2.png" alt="DeepSeekMoE Figure 2: (a) conventional top-2 routing over N experts, (b) fine-grained segmentation into 2N smaller experts with top-4 routing, (c) one shared expert always active plus routed experts with K = 3"></div>
</div>

<p class="footnote">DeepSeekMoE, Dai et al. 2024, arXiv:2401.06066 · Fig. 2 (Raschka's Fig. 6), §4.4, Fig. 3 (about 2B total, 0.3B active, 100B tokens, matched). Qwen3 §2 ("excludes shared experts"). * per Raschka. Pile: a large mixed text corpus</p>

Note:
Optional. DeepSeek's line is to split experts finer and choose more of them. The DeepSeekMoE paper's reason: with only 8 or 16 experts, the tokens sent to one expert "cover diverse knowledge". Split each into 4 and choose 8 of 64 instead of 2 of 16, with the same weights and arithmetic: 120 possible combinations become 4.4 billion. In their matched 2B runs, the finest design is best on all six benchmarks. Others go the other way: gpt-oss-20b has 32 large experts, 4 active.
The shared expert: DeepSeekMoE's reason is "Knowledge Redundancy", common knowledge learned once instead of in every expert. But with 64 experts, 1, 2 or 4 shared give Pile losses of 1.808, 1.806 and 1.811, which "do not significantly impact the performance". Qwen3 dropped it; the only reason on record is a Qwen developer's post, "No straight answer to this question honestly". Qwen3-Next added one back. A choice made, unmade and remade, tested only at 2B.

---

<p class="eyebrow"><span class="paper">Raschka 2025</span> · §1.2 · Change 2 of 6, mixture of experts · Who</p>

## Who uses experts, and how many?

<div class="cols wide-fig">
<div class="text">

- DeepSeek V3: 1 shared + 8 of 256
- Qwen3 235B: 8 of 128, no shared
- gpt-oss-120b: 4 of 128
- Llama 4 Maverick*: 1 shared + 1 of 128

</div>
<div class="fig"><img src="img/week-04-raschka-moe.svg" alt="Illustration: percent of parameters used per token: GPT-3 175B 100 percent, Qwen3-235B-A22B 9.4 percent (22B of 235B), DeepSeek V3 5.5 percent (37B of 671B), gpt-oss-120b 4.4 percent (5.13B of 116.83B), Llama 4 Maverick 4.2 percent (17B of 400B), Kimi K2 3.2 percent (32B of 1T)"></div>
</div>

<p class="footnote">Illustration, ours: active / total from Qwen3 Table 2, DeepSeek-V3 §4.2, gpt-oss Table 1; Llama 4 per Meta's blog, Kimi K2 per Raschka. * per Raschka</p>

Note:
Who uses it: the largest open models of 2025 are all mixtures of experts, and they use between 3 and 10 percent of their weights per token. DeepSeek V3: one shared plus 8 of 256 routed experts, 37 of 671 billion. Qwen3's largest: 8 of 128, no shared expert, 22 of 235 billion. gpt-oss-120b: 4 of 128, 5.1 of 117 billion. Llama 4 Maverick, per Meta's blog: one shared and one routed of 128. Kimi K2, per Raschka, 32 billion of a trillion.
And not everyone: Gemma 3, OLMo 2, SmolLM3 and the six smaller Qwen3 sizes are dense.

---

<p class="eyebrow"><span class="paper">Raschka 2025</span> · §1.2 · Change 2 of 6, mixture of experts · How it helps</p>

## What does a mixture of experts buy per token?

<div class="cols">
<div class="text">

<table class="rules" style="font-size:19px">
  <tr><td>model</td><td>total</td><td>active</td><td>weight GFLOPs per token</td></tr>
  <tr><td>GPT-3 175B</td><td>175B</td><td>175B</td><td>350</td></tr>
  <tr><td>DeepSeek V3</td><td>671B</td><td>37B</td><td>74</td></tr>
  <tr><td>Qwen3 235B</td><td>235B</td><td>22B</td><td>44</td></tr>
  <tr><td>gpt-oss-120b</td><td>116.8B</td><td>5.1B</td><td>10</td></tr>
</table>

</div>
<div class="text">

- arithmetic: $2 \times$ active weights
- DeepSeek V3: 3.8x GPT-3's weights, 4.7x less arithmetic

<p class="q" style="margin-top:14px"><b>Q.</b> At 131K tokens?</p>
<p class="a"><b>A.</b> Attention, 2.2 TFLOPs, dominates: 74 is short-context</p>

</div>
</div>

<p class="footnote">Our arithmetic from each report's total and active counts (DeepSeek-V3 §4.2, Qwen3 Table 2, gpt-oss Table 1). GFLOPs: $10^9$ floating-point operations; weight multiplies only, attention over the context not counted</p>

Note:
How it helps: arithmetic. Each active weight is one multiply and one add, so weight arithmetic per token is twice the active count. GPT-3 does 350 billion operations per token; DeepSeek V3, with 3.8 times as many weights, does 74 billion, 4.7 times less; gpt-oss-120b about 10. A mixture of experts runs about as cheaply as a dense model of its active size.
Two checks you can do from the model cards. gpt-oss-120b: one expert is three 2880-by-2880 matrices, 24.9 million weights; times 128 experts times 36 layers is 114.66 billion against the card's 114.71; four active per layer plus attention and the output layer gives 5.12 billion against 5.13. DeepSeek V3: 257 experts of 44 million weights in 58 layers is 656 billion, 98% of the model, and its three dense layers are 18,432 wide, exactly 9 times 2048, so every layer does the same work as the 9 active experts.
The qualification: this counts weight multiplies only. At long context attention dominates, 2.2 teraflops at 131 thousand tokens, 30 times the 74.

---

<p class="eyebrow"><span class="paper">Raschka 2025</span> · §1.2 · Change 2 of 6, mixture of experts · Costs · gpt-oss §2.1</p>

## What does a mixture of experts not buy?

<div class="cols">
<div class="text">

- every expert must sit in memory
- gpt-oss at 16 bits: 233.7 GB; fits one 80 GB GPU at 4.25 bits: quantisation, not sparsity
- experts must be kept busy: a balancing loss hurts quality
- large batch: most experts read anyway (ours)

</div>
<div class="text">

<p class="q"><b>Q.</b> Does MoE reduce "memory requirements at inference"?</p>
<p class="a"><b>A.</b> It cuts arithmetic per token, not memory</p>

</div>
</div>

<p class="footnote">gpt-oss arXiv:2508.10925 §2.1 (MXFP4, a 4-bit format at 4.25 bits; checkpoint 60.8 GiB). Raschka §3. DeepSeek-V3 §2.1.2, §4.5.2 ablation, no error bars. Auxiliary loss: an extra loss penalising uneven expert use</p>

Note:
Costs. What MoE doesn't buy is memory for the weights: every expert must be resident, because the next token might need it, so at a fixed total size an MoE model needs as much weight memory as a dense one. Raschka once writes that MoE reduces memory requirements at inference; it reduces arithmetic per token, not what has to be held. gpt-oss at 16 bits would be 234 gigabytes; its experts are stored at 4.25 bits, which gives the 61-gibibyte checkpoint. It fits on one 80-gigabyte GPU because of quantisation, QLoRA's 4-bit idea from Week 2, not because of sparsity. And at large batch, different users' tokens pick different experts, so most experts get read every step anyway.
Second cost: balance. If the router sends most tokens to a few experts, the rest never learn. The classic fix is an extra balancing loss, but DeepSeek notes too large a one hurts the model. Their alternative: a bias per expert, added only when choosing, raised for idle experts and lowered for busy ones by 0.001 per step. In their ablation at 16B and 229B it wins 9 of 10 and 8 of 10 benchmarks, mostly by under a point, with no error bars.
What's claimed and not shown: that the extra weights buy capacity, knowledge stored at the cost of a small model. The blog asserts it; none of our sources tests it at matched training.
DeepSeek's balancing fix: a bias per expert, used only to choose; it wins most benchmarks by about a point. Their warning, from §2.1.2: "too large an auxiliary loss will impair the model performance".

---

<p class="eyebrow"><span class="paper">Raschka 2025</span> · §2.1, §2.2 · Change 3 of 6, where the norm goes · What and who · Figs. 8, 14</p>

## Where should the normalisation go?

<div class="rows">
<div class="points">
<div class="text">

- a norm rescales a vector to a fixed size
- post: normalise the sum; pre: the sublayer's input
- OLMo 2: its output; Gemma: both, a sandwich

</div>
<div class="text">

- QK-norm: normalise each query and key (RMSNorm: LayerNorm without the mean)

</div>
</div>
<div class="fig"><img src="img/week-04-raschka-norms.svg" alt="Diagram: five residual sublayers drawn bottom to top: Post-LN, attention then add then norm (2017 Transformer); Pre-LN, norm then attention then add (GPT-2, GPT-3, gpt-oss, Qwen3); norm on outputs, attention then norm then add (OLMo 2); both, norm, attention, norm, add (Gemma 2, 3); and QK-norm, RMSNorm on q and k before RoPE and the dot product (OLMo 2, Gemma 3, Qwen3)"></div>
</div>

<p class="footnote">Raschka 2025 · §2.1, §3.2, Figs. 8, 14. Diagram ours, with each design's users: OLMo 2 §3, Gemma 2 §2, Gemma 3 §2, gpt-oss §2 ("Pre-LN placement"), Qwen3 §2. LN: LayerNorm</p>

Note:
Change 3. A block adds each sublayer's output to a running sum, the residual stream. Over dozens of blocks the numbers can drift, and gradients through all of them can grow or shrink. A norm rescales a vector to a fixed size; almost every model here uses RMSNorm, LayerNorm without subtracting the mean.
Where to put it? Under each design, who uses it. The original Transformer normalised after adding: post-norm. GPT-2, GPT-3, gpt-oss and Qwen3 normalise the sublayer's input and add its raw output: pre-norm. OLMo 2 normalises the sublayer's output, still inside the residual branch. Gemma 2 and 3 do both, a sandwich. And a separate change, right: QK-norm, an RMSNorm on each head's query and key before they're compared, used by OLMo 2, Gemma 3 and Qwen3.

---

<p class="eyebrow"><span class="paper">Raschka 2025</span> · §2.1, §2.2 · Change 3 of 6, where the norm goes · How it helps · OLMo 2 Fig. 7</p>

## What does each placement protect?

<div class="rows">
<div class="points">
<div class="text">

- post: no clean path back to early layers
- pre: $x$ passes untouched, but $F(x)$ can grow

</div>
<div class="text">

- OLMo 2: reordered + QK-norm; spike score 0.108 ▸ 0.069
- "In isolation, neither ... good results"

</div>
</div>
<div class="fig"><img src="img/week-04-raschka-olmo2-fig7.png" alt="OLMo 2 Figure 7: L2 norm of the gradient over about 150,000 training steps on a log scale; the pre-attention norm run has many tall spikes, the post-attention norm plus QK-norm run is smoother and slightly lower"></div>
</div>

<p class="footnote">OLMo 2 arXiv:2501.00656 §4, Fig. 7. L2 norm: square root of the sum of squares. Spike score: percentage of values at least 7 standard deviations from the rolling mean of the last 1,000. $F$: attention or the FFN</p>

Note:
How it helps, our intuition first, since the theory paper Raschka cites isn't in our sources. Post-norm passes the residual stream itself through a norm in every block, so there's no clean path from the output back to the early layers, and it needs careful warm-up. Pre-norm keeps an identity path: x passes through untouched. Its weak point: each block adds an un-normalised output, and nothing stops that from growing during training. OLMo 2 normalises every addition before it enters the stream; Gemma does both.
The evidence: OLMo 2's earlier model had "sudden spikes in the loss, and more frequently, in the gradient norm", which "would lead to training divergence". The figure is gradient size over training: pre-norm in blue has tall spikes; reordered norms plus QK-norm, orange, is smoother. The spike score falls from 0.108 to 0.069.
Footnote detail: OLMo 2's Fig. 7 is Raschka's Fig. 9. The placement intuition is ours. OLMo 2 and Gemma normalise what is added.

---

<p class="eyebrow"><span class="paper">Raschka 2025</span> · §2.1, §2.2 · Change 3 of 6, where the norm goes · How it helps · OLMo 2 §3</p>

## Why normalise queries and keys?

<div class="cols">
<div class="text">

- score $q \cdot k/\sqrt{d_h}$ grows as both sizes
- $[2, 1, 0]$ ▸ $[0.665, 0.245, 0.090]$; ×4: $[8, 4, 0]$ ▸ $[0.982, 0.018, 0.0003]$
- QK-norm: score ≤ about $\sqrt{d_h}\thinspace g_q g_k$
- Gemma 2 soft-capped instead: $50\tanh(x/50)$

</div>
<div class="text">

<p class="q"><b>Q.</b> Why is all weight on one token bad?</p>
<p class="a"><b>A.</b> Almost no gradient to the others; tiny changes flip the winner (ours)</p>

</div>
</div>

<p class="footnote">OLMo 2 §3; Gemma 2 arXiv:2408.00118 §2; Gemma 3 §2. $g$: the norm's learned gain; $d_h$: head size. Softmax numbers and bound ours: a normalised vector has length $\sqrt{d_h}\thinspace g$</p>

Note:
Attention weights are a softmax of scores, query dot key over root d. If queries and keys both grow during training, the scores grow as the product. Scores 2, 1, 0 give weights two thirds, a quarter, a tenth. Double both vectors, scores times four: 98% on one token. A head whose softmax has collapsed passes almost no gradient to the other positions, and tiny changes flip which position wins; OLMo 2 says large logits "can lead to training loss divergence".
QK-norm applies RMSNorm to each head's query and key first. Each normalised vector has length root d times its gain, so the score is at most root d times the gains, about 11 times for head size 128, however large the raw activations grow. Other ways to bound the same scores: OLMo's earlier model clipped activations to 8, and Gemma 2 soft-capped the scores, 50 times tanh of score over 50, which leaves 10 at 9.9 and squashes 100 to 48. Raschka lists Gemma 2 among QK-norm users; it used soft-capping, and Gemma 3 is where the swap happened.
Does Gemma 2 use QK-norm? No: Gemma 3 swapped soft-capping for it. OLMo 2 §3 says large logits "can lead to training loss divergence".

---

<p class="eyebrow"><span class="paper">Raschka 2025</span> · §2.1, §2.2 · Change 3 of 6, where the norm goes · Costs</p>

## What do the norm results not show?

<div class="cols">
<div class="text">

- only the pair is tested, not each change
- fewer gradient spikes, not a better model
- one model family
- QK-norm vs soft-capping: never compared

</div>
<div class="text">

<p class="q"><b>Q.</b> Who stays with plain pre-norm?</p>
<p class="a"><b>A.</b> gpt-oss, Qwen3 (with QK-norm)</p>

</div>
</div>

<p class="footnote">OLMo 2 §4: "In isolation, neither of these changes yield good results, but together they improve" the gradient; single-change runs not shown. Gemma 3 §2: QK-norm replaces soft-capping, "inspired by" earlier work. Raschka §3.2</p>

Note:
Costs and open questions. The OLMo 2 result is about the pair, reordering plus QK-norm; the paper says "In isolation, neither of these changes yield good results", and the single-change runs aren't shown. "Stable" means fewer gradient spikes in one model family, with no final-quality comparison. No source compares QK-norm with soft-capping head to head; Gemma 3 swapped one for the other with no reason beyond "inspired by" earlier work.
And plenty of models stay with pre-norm, gpt-oss and Qwen3 among them. Gemma's sandwich, which Raschka thinks "can't hurt", has no ablation in our sources. The cost of the change itself is small, a few extra norms, so the question is only whether it's needed.

---

<p class="eyebrow"><span class="paper">Raschka 2025</span> · §3.1 · Change 4 of 6, sliding windows · What · Longformer §3</p>

## Does every layer need the whole context?

<div class="cols wide-fig">
<div class="text">

- local layer: sees only the last $w$ tokens
- caches $w$ tokens, at any context length
- a few global layers see everything
- stacked windows reach about $\ell \times w$

<p class="q" style="margin-top:14px"><b>Q.</b> Gemma 3: 5 local layers, $w$ = 1024?</p>
<p class="a"><b>A.</b> About 5,120 tokens; further needs a global layer</p>

</div>
<div class="fig"><img src="img/week-04-raschka-masks.svg" alt="Diagram: three attention masks over 14 tokens: full causal for a global layer, a band of width 4 for a local layer, and the wider band two stacked local layers can reach, 7 tokens"></div>
</div>

<p class="footnote">Raschka 2025 · §3.1, Fig. 12 (the same mask). Longformer, Beltagy et al. 2020, arXiv:2004.05150 §3. Diagram ours. Local attention is also called sliding-window attention; global means full causal attention</p>

Note:
Change 4. Sharing keys and values made each cache entry smaller, but the cache still grows with every token of context. Does every layer need to see the whole context? A local layer lets each token attend only to the previous w tokens, so it only ever caches w tokens, whatever the context length. The middle mask is a window of 4.
A model of only local layers can still carry information far by relaying it: each layer reaches w minus 1 further back, so two windows of 4 reach 7 tokens, the right-hand mask, and l layers reach about l times w, like stacking small filters in a convolutional network. Gemma 3 has 5 local layers of window 1024 between global ones, so about 5 thousand tokens. Anything further must go through a global layer, which is why models mix the two.
Longformer §3: "the receptive field size at the top layer is $\ell \times w$".

---

<p class="eyebrow"><span class="paper">Raschka 2025</span> · §3.1 · Change 4 of 6, sliding windows · Who · gpt-oss §2.2</p>

## Who uses windows, and how many?

<div class="rows">
<div class="points">
<div class="text">

- GPT-3 already alternated: gpt-oss is "Following GPT-3"
- new in 2025: the ratio and the width
- Olmo 3*: 3 : 1, 4096; MiMo-V2-Flash*: 5 : 1, 128

</div>
<div class="text">

- none: DeepSeek V3, Qwen3, Llama 4; switched off: Mistral Small 3.1*, MiniMax-M2*

</div>
</div>
<div class="fig"><img src="img/week-04-raschka-swa.svg" alt="Diagram: twelve layers per model, black for global and grey for local: GPT-3 175B, Gemma 2 and gpt-oss-120b alternate one local to one global, with windows not stated, 4,096 and 128; Gemma 3 has five local layers per global one with window 1,024"></div>
</div>

<p class="footnote">GPT-3 §2.1 ("locally banded"); gpt-oss §2.2 ("the bandwidth is 128 tokens"); Gemma 2 §2; Gemma 3 arXiv:2503.19786 §2 ("5 local layers for every global layer"). * per Raschka. Diagram ours</p>

Note:
Who uses it. Not new: GPT-3 itself alternated dense and "locally banded" layers, after the 2019 Sparse Transformer, and the gpt-oss card says so: "Following GPT-3, attention blocks alternate between banded window and fully dense patterns", with a band of 128 tokens. Gemma 2 alternated one to one with 4096. What changed is the settings: Gemma 3 went to five local per global with 1024, Olmo 3 three to one, and MiMo, per Raschka, five to one with just 128.
And a lot of models don't use it: DeepSeek V3, Qwen3 and Llama 4 have no windows, and Mistral Small 3.1 and MiniMax-M2 ship with them switched off. The costs slide asks why.

---

<p class="eyebrow"><span class="paper">Raschka 2025</span> · §3.1 · Change 4 of 6, sliding windows · How it helps · Fig. 11</p>

## How much cache does a window save?

<div class="cols wide-fig">
<div class="text">

<div class="eq">$$\text{kept} = \frac{T + r\thinspace w}{(r+1)\thinspace T}$$</div>

- $r$ local layers per global, context $T$
- Gemma 3 at 32K: 0.193
- at 128K: 0.173

<p class="q"><b>Q.</b> Limit as $T$ grows?</p>
<p class="a"><b>A.</b> $1/(r+1)$: 1/6 for Gemma 3</p>

</div>
<div class="fig"><img src="img/week-04-raschka-swafrac.png" alt="Illustration: share of a global-only KV cache kept against context length from 4K to 128K; Gemma 2's 1:1 with window 4096 falls toward a floor of one half, Gemma 3's 5:1 with window 1024 falls to 0.271, 0.193 and 0.173 at 8K, 32K and 128K, near its floor of one sixth"></div>
</div>

<p class="footnote">Illustration, our formula (one global layer caches $T$, each local layer $w$). Dashed: beyond Gemma 2's 8,192 global span, hypothetical. Gemma 3 Figs. 5, 6 measure the same saving on a 2B model: cache overhead 60% ▸ "less than 15%"</p>

Note:
How it helps. Compared with making every layer global, how much cache do you keep? Each global layer caches all T tokens, each local layer only w. With r local layers per global one, the kept share is T plus r w over r plus 1 times T. Gemma 3, five to one with 1024: 27% of the cache at 8 thousand tokens, 19% at 32 thousand, 17% at 128 thousand. As the context grows the local layers stop costing anything and the share falls to 1 over r plus 1, a sixth. That's why Gemma 3 went from one to one to five to one: at long context, the ratio matters far more than the window.
Gemma 3 measures it on a 2B model at 32 thousand tokens: the cache adds 60% to memory with global layers only, "less than 15%" with windows. A small puzzle: they call that setting "1:3", and only three local per global reproduces their number with our formula (one local per three global would keep 76%); their own window plot's legend writes it "L:G=3:1".
Footnote detail: Gemma 3's Fig. 6 is Raschka's Fig. 11.

---

<p class="eyebrow"><span class="paper">Raschka 2025</span> · §3.1 · Change 4 of 6, sliding windows · Costs · Gemma 3 Figs. 3, 4</p>

## What do windows cost?

<div class="rows">
<div class="points">
<div class="text">

- perplexity moves by about 0.03 at most
- but the zero line is 1:1, not full attention; perplexity only, long-range recall untested

</div>
<div class="text">

- latency: full attention has faster fused code, so Mistral, MiniMax switch windows off*

</div>
</div>
<div class="fig"><img src="img/week-04-raschka-gemma3-fig34.png" alt="Gemma 3 Figures 3 and 4: left, change in perplexity against local:global ratio from 1:1 to 7:1 for 2B and 9B models, within about 0.03 of zero; right, change in perplexity against sliding window from 512 to 4096 for 2B models at L:G 1:1 and 3:1, within about 0.02 of zero at 1024"></div>
</div>

<p class="footnote">Gemma 3 §5.1, Figs. 3, 4; no error bars, no full-attention point. Perplexity: how surprised the model is by held-out text, lower is better. * Raschka §4. FlashAttention: the standard fused attention kernel</p>

Note:
Costs and open questions. Gemma 3's ablations: left, the ratio from one-to-one to seven-to-one at 2B and 9B; right, the window from 512 to 4096. The biggest change is about three hundredths of perplexity, and the curves wobble by about a hundredth, so that's near the noise. But read the zero lines: the ratio plot's is one-to-one, where half the layers are already local, and there is no full-attention point at all. And perplexity on typical text barely measures retrieving one fact from a hundred thousand tokens back, which a narrow window could hurt. Raschka's caption, "little to no impact", claims more than the plots show.
The other cost is speed. Mistral Small 3.1 and MiniMax-M2 switch windows off. Raschka's guess, labelled as one: "while sliding window attention reduces memory usage, it doesn't necessarily reduce inference latency", because plain full attention runs on highly optimised kernels. "Efficient" can mean memory, latency or throughput, and a change that helps one may not help another. A third way to look less, DeepSeek V3.2's sparse attention, the blog leaves to a separate article.
Footnote detail: Gemma 3 §5.1 calls the effect "minimal, even with 7-to-1". Raschka §4 says windows reduce memory but don't "necessarily reduce inference latency". The three goals are memory, latency and throughput.

---

<p class="eyebrow"><span class="paper">Raschka 2025</span> · §7.1 · Change 5 of 6, positions · What · RoFormer §3.2 (Week 3)</p>

## How does RoPE turn position into distance?

<div class="cols">
<div class="text">

<div class="eq">$$(R_m q)^\top (R_n k) = q^\top R_m^\top R_n k = q^\top R_{n-m} k$$</div>

- RoPE: rotate each pair of dims by position × $\theta_i$
- $\theta_i = 10000^{-2(i-1)/d_h}$; 10,000 is the base
- inside every layer, not once at the input
- changes: a bigger base, no position in some layers, or only some dims rotated

</div>
<div class="text">

<p class="q"><b>Q.</b> Slowest pair at base 10,000, $d_h$ = 128?</p>
<p class="a"><b>A.</b> One turn per about 54,000 tokens</p>

</div>
</div>

<p class="footnote">RoFormer, Su et al., arXiv:2104.09864 §3.2. RoPE: rotary position embedding. $R_m$: block-diagonal rotation by $m\theta_i$ on pair $i$. Wavelength $2\pi/\theta_i$; numbers ours</p>

Note:
Change 5, with a recap from Week 3. GPT-3 adds a learned vector per position, once, at the input, and has no vector for position 2049. RoPE instead rotates each pair of query and key dimensions, inside every attention layer, by an angle proportional to position, with frequencies falling from pair to pair. Rotations compose, R_m transposed times R_n is R of n minus m, so the score depends on the two positions only through their distance. With head size 128, the fastest pair turns once every six tokens, the slowest once per about 54 thousand at base 10,000.
Almost every 2025 model uses RoPE. The changes are in how: a bigger base, no position signal at all in some layers, or rotating only some dimensions of each head.

---

<p class="eyebrow"><span class="paper">Raschka 2025</span> · §7.1 · Change 5 of 6, positions · Who</p>

## Who carries position where?

<div class="rows">
<div class="points">
<div class="text">

- bigger base: OLMo 2 500K, Qwen3 1M
- Gemma 3: 10K local, 1M global layers
- no position: SmolLM3 every 4th layer; Llama 4*

</div>
<div class="text">

- partial: MiniMax-M2* half a head; DeepSeek: 64 of 192 dims rotated

</div>
</div>
<div class="fig"><img src="img/week-04-raschka-positions.svg" alt="Diagram: which layers carry position: GPT-3 175B adds a learned position once at the input; Gemma 3 uses RoPE base 10k on local and 1M on global layers; SmolLM3 has no position in every fourth layer; below, one head's dimensions: most models rotate all of them, MiniMax-M2 rotates half"></div>
</div>

<p class="footnote">OLMo 2 §3; Qwen3 §3.2; Gemma 3 §2; DeepSeek-V2 §2.1.3 (128 plain plus 64 rotated dims per head). * per Raschka. Diagram ours</p>

Note:
Who does what. The 2025 models mostly keep RoPE and raise its base: OLMo 2 from 10 thousand to half a million, Qwen3 to a million. Gemma 3 uses a million on global layers and keeps 10 thousand on local layers, which only ever see 1024 tokens. SmolLM3 drops position entirely from every fourth layer; per Raschka, Llama 4, Kimi Linear and Trinity have global layers without positions.
And partial RoPE: MiniMax rotates half of each head per its README, Gemma 4 a quarter of the pairs per its model card. One verified case the blog doesn't point out: DeepSeek's decoupled RoPE from change 1 is partial RoPE, 128 plain dimensions plus 64 rotated per head, reached for a different reason, keeping the MLA fold.
Footnote detail: Gemma 3 §2 says "from 10k to 1M on global self-attention layers". Per Raschka, Gemma 4 rotates 25%.

---

<p class="eyebrow"><span class="paper">Raschka 2025</span> · §7.1 · Change 5 of 6, positions · How it helps · NoPE Fig. 3</p>

## Why raise the base, or drop positions?

<div class="rows">
<div class="points">
<div class="text">

- bigger base: slower turns, slower decay with distance
- helps "if the model is (pre)trained with the new base"
- NoPE: the causal mask alone gives order

</div>
<div class="text">

- toy tasks, 107M models: NoPE usually falls last; Rotary among the weakest

</div>
</div>
<div class="fig"><img src="img/week-04-raschka-nope-fig3.png" alt="NoPE paper Figure 3: accuracy against problem length on Copy, Addition, SCAN, Reverse, Summation and PCFG for NoPE, T5's relative bias, ALiBi, Rotary and absolute position embedding, with training lengths shaded; NoPE stays near 1 on Copy to length 40 while absolute and Rotary drop to 0, all fail on Addition beyond about 10 and tie on PCFG"></div>
</div>

<p class="footnote">RoFormer §3.3 ("a long-term decay property"); Kazemnejad et al. 2023, arXiv:2305.19466, Theorem 1, Fig. 3; grey: training lengths. NoPE: no position embedding; T5 bias: a learned number per distance; ALiBi: a penalty linear in distance</p>

Note:
How it helps. A bigger base slows every pair's rotation, and with it RoFormer's long-term decay, a ceiling on the score that falls with distance, so distant tokens can still get large scores. That's the candidate rationale; OLMo 2 only says it "increases the resolution". Week 3's caveat holds: with Qwen3's base, 24 of 64 pairs never complete a turn within 32 thousand training tokens, so the base helps only if the model is trained at long context with it.
No position at all can work because of the causal mask: token t sees exactly t tokens. The NoPE paper's Theorem 1 gives the start token a marker and lets a head attend uniformly, weight 1 over t each, so its output holds 1 over t, which is the position; later layers can build relative position on top. Their Figure 3: 107-million-parameter models trained on short toy problems and tested on longer ones. Grey is the training range. Beyond it NoPE usually falls off last; on Copy it stays near 1 where absolute and Rotary drop to 0. The paper: NoPE "performs on par with or even better than the best-performing explicit" encoding.
Footnote detail: the NoPE paper's Fig. 3 is Raschka's Fig. 23.

---

<p class="eyebrow"><span class="paper">Raschka 2025</span> · §7.1 · Change 5 of 6, positions · Costs · NoPE §7</p>

## What is unproven about positions?

<div class="cols">
<div class="text">

- "longer" means 20 ▸ 40 items, not 32K ▸ 128K tokens
- at 1B: NoPE ties ALiBi; beyond 2x, ALiBi steadier
- so NoPE goes in some layers only
- partial RoPE: no source says why, except DeepSeek's fold

</div>
<div class="text">

<p class="q"><b>Q.</b> Rotary was weak in the toy test. Why keep it?</p>
<p class="a"><b>A.</b> Untested at scale against NoPE (ours)</p>

</div>
</div>

<p class="footnote">NoPE paper §7 (three 1B models on code, 1,024-token context, "post-submission"); Raschka §7.1: "It is unclear how well these findings generalize". Gemma 3 §5.3. Partial RoPE motives: Raschka's guess only</p>

Note:
Costs and open questions. The NoPE evidence is small: 100-million-parameter models on toy tasks, where "longer" means 20 to 40 items, not 32 thousand to 128 thousand tokens. Raschka says it plainly: "it is unclear how well these findings generalize". The paper's three 1B models on code: Rotary's perplexity explodes past the training length, NoPE and ALiBi both reach about twice it, and beyond that ALiBi is steadier. So at 1B the advantage over ALiBi disappears, and models use NoPE cautiously, in some layers only.
The tension: Rotary, which most 2025 models keep, was among the weakest in the toy test; nothing in our sources compares them at scale. Partial RoPE has no stated motive in a primary source except DeepSeek's; Raschka guesses that no rotation may be better than an extreme one never seen in training. And a flag: Gemma 3 trains at 32 thousand and says a scaling factor of 8 reaches 128 thousand, but 32 times 8 is 256.

---

<p class="eyebrow"><span class="paper">Raschka 2025</span> · not a blog section · Change 6 of 6, gated feed-forward · What and who · OLMo 2 §3</p>

## Why three matrices in a feed-forward network?

<div class="cols">
<div class="text">

<div class="eq">$$\mathrm{SwiGLU}(x) = W_2\big(\mathrm{SiLU}(W_1 x) \odot W_3 x\big)$$</div>

- one projection gates the other, feature by feature
- 3 matrices of width $f$: $3df$ weights
- same weights as GPT-3's $8d^2$ at $f = \tfrac{8}{3} d$
- who: every 2025 model in the lineup; Gemma uses GeGLU

</div>
<div class="text">

<p class="q"><b>Q.</b> Same size as GPT-3's?</p>
<p class="a"><b>A.</b> 135.3M vs 134.2M per layer</p>

</div>
</div>

<p class="footnote">Ours: one line in the blog's introduction, no section. OLMo 2 arXiv:2501.00656 §3 ("approximately $\frac{8}{3}d$ ... 11,008 for our 7B model"). SiLU$(z) = z\sigma(z)$, the sigmoid linear unit; GeGLU gates with GELU (Gaussian error linear unit) instead</p>

Note:
Change 6, the smallest, and the one the blog never gives a section: we add it because every 2025 model has it. Raschka's first paragraph says "the more efficient SwiGLU has replaced activation functions like GELU". GPT-3's feed-forward network has two matrices with a GELU between them. A gated network computes two projections of the input and multiplies them element by element, so one acts as a learned, input-dependent gate on the other, then projects back: three matrices.
To keep GPT-3's budget of 8 d squared, 3 times d times f equals 8 d squared, so the width is eight thirds of d instead of 4d. OLMo 2 7B: eight thirds of 4096 is 10,923, rounded up to a multiple of 128, 11,008, the number in their paper. Who: every 2025 model in the lineup; Gemma's variant gates with GELU instead of SiLU. Looking back at change 2: every expert is one of these gated networks.

---

<p class="eyebrow"><span class="paper">Raschka 2025</span> · not a blog section · Change 6 of 6, gated feed-forward · How it helps, and costs</p>

## What does the gate buy?

<div class="cols">
<div class="text">

- claimed: better quality per weight
- intuition: switch features on and off per token
- cost: none in weights, at $f = \tfrac{8}{3}d$
- one extra matrix product per layer

</div>
<div class="text">

<p class="q"><b>Q.</b> Does any of our sources test it?</p>
<p class="a"><b>A.</b> No: every lab inherits it as a default</p>

</div>
</div>

<p class="footnote">Raschka 2025 · Introduction. The original evidence that gating helps (Shazeer 2020, "GLU Variants Improve Transformer") is cited widely but is not in our sources</p>

Note:
How it helps: the claim is better quality for the same number of weights, and the intuition is that the gate lets the layer switch features on and off for each token. The cost is small: at eight thirds of d the weights are the same as GPT-3's, so memory and arithmetic per token barely change; there are three matrix products instead of two, each narrower.
What's open: none of the papers in our set ablates it. It's an inherited default, and the evidence people point to, Shazeer's 2020 note, isn't among our readings. And Raschka's "more efficient" isn't explained: at matched size it uses the same weights, not fewer. So this is the change we can say least about.

---

<p class="eyebrow"><span class="paper">Raschka 2025</span> · Beyond the six · §9, §12, §14 · Fig. 42</p>

## What else is changing?

<div class="rows">
<div class="points">
<div class="text">

- wider or deeper: Gemma 2 9B, deep 52.0 vs wide 50.8 (blog swaps them)
- linear attention: a fixed-size state, no growing cache; hybrids 3 linear : 1 full, but MiniMax went back to full

</div>
<div class="text">

- small: no biases, tied embeddings; vocabularies 2.5 to 5x GPT-2's
- an extra head predicting $t+2$ (DeepSeek V3)

</div>
</div>
<div class="fig"><img src="img/week-04-raschka-fig42-ratio.png" alt="Raschka Figure 42, the layer lists of Qwen3-Next 80B-A3B (left) and Kimi Linear 48B-A3B (right): a 3:1 ratio, layers 1 to 3 linear attention then MoE, layer 4 full attention then MoE, and the same again for layers 5 to 8"></div>
</div>

<p class="footnote">Gemma 2 Table 9 ("a deeper 9B network is slightly better"); Raschka §9.1 reports the labels swapped. Raschka §12, §14, Fig. 42: Qwen3-Next and Kimi Linear, blog only. DeepSeek-V3 §4.5.1. Vocabularies: GPT-2 50,257; Gemma 2 256,128</p>

Note:
Beyond the six, briefly. Width against depth: gpt-oss is wide and shallow, Qwen3 narrow and deep, but they aren't a controlled pair. Gemma 2's Table 9 is the one matched test: deep 52.0, wide 50.8, "a deeper 9B network is slightly better". Raschka reports it with the labels swapped, which reverses his conclusion. Depth is slower to run, because layers run one after another.
Linear attention drops the softmax so that phi of K transposed times V can be computed first, the same associativity as MLA's fold; at decode that product is a fixed-size state, 16 thousand numbers per head at head size 128, the size of a 64-token cache. The catch: a fixed state forgets, giving "less precise content-based retrieval than full attention". So 2025 models mix, like local and global layers: Qwen3-Next and Kimi Linear use three linear layers per full one, the layer lists in the figure. MiniMax went back to full attention for M2, citing poor accuracy in reasoning and multi-turn tasks. All blog-only: a map, not a result.
Small items: bias terms gone in OLMo and Qwen3 but back in gpt-oss's attention; input and output embeddings shared in small models; vocabularies two and a half to five times GPT-2's to cover many languages; gpt-oss's attention sinks, a learned term that lets a head attend to nothing; and DeepSeek V3's multi-token prediction, an extra head for the token after next, which "consistently enhances" most benchmarks and is thrown away at inference.
Footnote detail: DeepSeek-V3's multi-token prediction head is discarded at inference.

---

<p class="eyebrow"><span class="paper">Raschka 2025</span> · Synthesis</p>

## How much should we trust each kind of claim?

<table class="rules" style="font-size:21px">
  <tr><td>level</td><td>example</td><td>where it shows up</td><td>status</td></tr>
  <tr><td>observation</td><td>what each model is</td><td>the "who" slides</td><td>mostly correct readings</td></tr>
  <tr><td>mechanism</td><td>KV cache, active weights</td><td>the "how it helps" slides</td><td>solid: arithmetic we redid</td></tr>
  <tr><td>effect on quality</td><td>"X is better"</td><td>the "costs" slides</td><td>thin: no error bars, confounds, 3 misreported</td></tr>
</table>

<p class="q" style="margin-top:24px"><b>Q.</b> Which level do the blog's "X helps" sentences sit on?</p>
<p class="a"><b>A.</b> The thinnest one (ours)</p>

<p class="footnote">Raschka 2025; checks against DeepSeek-V2, DeepSeek-V3, DeepSeekMoE, Gemma 2, Gemma 3, OLMo 2, gpt-oss, Qwen3, NoPE. Misreported: width vs depth, Gemma 2's QK-norm, MLA's query compression "only during training"</p>

Note:
Which level is easiest to check? Mechanism: you can redo it with arithmetic (ours).
Three kinds of claim deserve different trust, and they line up with our four-slide pattern. Observation, what the models are: the "who" slides, the blog's strength, careful readings of configurations and reports in a uniform style. Mechanism, why each change saves what it saves: the "how it helps" slides, solid where it's arithmetic, and we redid most of it. Effect on quality, whether a change makes models better: the "costs" slides, the weakest level. A handful of ablations without error bars, often confounded, sometimes contradicting each other.
Checked against the papers, three blog claims are wrong: Gemma 2's width-depth result is reversed; Gemma 2 is said to use QK-norm but used soft-capping; and MLA's query compression is said to be training-only, when the compressed path runs at inference too. Four are imprecise: MLA beating GQA chains two experiments; windows are said to come from Longformer, which itself credits the Sparse Transformer, and GPT-3 used them; "little to no impact" has no full-attention baseline; and MoE reduces arithmetic, not stored memory.

---

<p class="eyebrow"><span class="paper">Raschka 2025</span> · Critique (ours) · Limitations</p>

## Can a survey say what made a model good?

<div class="cols">
<div class="text">

- every model differs in data, training, size
- and in several changes at once
- "X helps" only as good as its ablation
- we see what was adopted, rarely what failed

</div>
<div class="text">

<p class="q"><b>Q.</b> Does it sink the survey?</p>
<p class="a"><b>A.</b> No: it's descriptive, a map, not a ranking</p>

</div>
</div>

<p class="footnote">Ours. Raschka 2025 Introduction (comparing LLMs "is notoriously challenging"); §17, on Mistral 3 Large reusing DeepSeek V3's architecture. Cited at its version of 2 April 2026: the blog grew from 8 to 23 sections</p>

Note:
The main critique: a structural survey can't say what made a model good. Every model differs from every other in data, training, size and several architecture choices at once. Raschka admits it in the first lines, data and training "vary widely and are often not well documented", and later, on Mistral 3 Large reusing DeepSeek V3's architecture: "why change what ain't broke? A lot of the secret sauce these days is in the training pipeline as well as the inference scaling strategies." He also marks his guesses as guesses, "I speculate", "If I had to guess", which makes the blog easier to check than many papers.
It doesn't sink the survey, because the survey is descriptive: here is what labs chose. It does mean every "X helps" is only as good as the ablation behind it, which is why each change had a costs slide. Two more cautions. Survivorship: we hear which choices were adopted, rarely which were tried and dropped; the exceptions are MiniMax's return to full attention, the Qwen shared-expert quote and DeepSeekMoE's null result, so "many labs adopted X" is weak evidence that X works. And the blog is a living document, overtaken in places by later models; cite it with a date.
What would settle the open points, our list: a matched GQA against MLA run, a full-attention point in Gemma 3's window ablation, and NoPE tested at scale.
Does Raschka admit it? Yes: "A lot of the secret sauce these days is in the training pipeline". His introduction says data and training "vary widely and are often not well documented".

---

<p class="eyebrow"><span class="paper">Raschka 2025</span> · Comparison with GPT-3</p>

## What changed from GPT-3 to the open models?

<table class="rules" style="font-size:20px">
  <tr><td></td><td>GPT-3 175B</td><td>2025 dense (Gemma 3, OLMo 2)</td><td>2025 MoE (DeepSeek-V3, gpt-oss)</td></tr>
  <tr><td>attention</td><td>MHA, 96 KV heads</td><td>GQA or MHA</td><td>MLA, or GQA with 8 KV heads</td></tr>
  <tr><td>pattern</td><td>dense + banded</td><td>5 : 1, window 1024; or full</td><td>full; or 1 : 1, window 128</td></tr>
  <tr><td>KV per token</td><td>2,359,296</td><td>n/a for Gemma 3; OLMo 2 7B (MHA): 262,144</td><td>DeepSeek-V3: 35,136 (67x less); gpt-oss: 36,864</td></tr>
  <tr><td>FFN</td><td>dense GELU, 116.0B, all used</td><td>dense, gated</td><td>gated experts, 4 to 6% used</td></tr>
  <tr><td>positions</td><td>learned, 2,048</td><td>RoPE, bigger bases</td><td>RoPE (decoupled), YaRN</td></tr>
  <tr><td>norm</td><td>pre-norm LayerNorm</td><td>sandwich or post, QK-norm</td><td>pre-norm RMSNorm</td></tr>
</table>

<p class="footnote">GPT-3 §2.1, Table 2.1; Gemma 3 §2; OLMo 2 §3; DeepSeek-V3 §4.2; gpt-oss §2.2. KV per token: numbers per token, 2 × KV heads × head size × layers (ours). Active shares ours. YaRN: a RoPE rescaling for long context</p>

Note:
The pairing with reading 1 teaches one thing well. GPT-3's argument was that scale is what matters, and it barely touched the architecture. Five years later the architecture is still recognisably GPT-3's: same skeleton, same block. Most of what changed is about making that scale cheaper to run: a cache 67 times smaller per token, a few percent of the weights used per token, and positions that stretch to long context. The rest is stability, context length and (claimed) quality.
Active shares, ours: 5.51% (DeepSeek-V3), 4.39% (gpt-oss-120b).

---

<p class="eyebrow"><span class="paper">Raschka 2025</span> · Summary</p>

## What to keep from Raschka

<div class="cols">
<div class="text">

- still GPT's block, six parts changed
- decode is memory-bound: bytes, not FLOPs
- two numbers explain most: KV per token, active weights (total ≠ active: memory vs arithmetic)
- quality evidence: thin

</div>
<div class="text">

<p class="q"><b>Open question</b></p>
<p class="a">If the architecture barely changed, what in training does the work?</p>

</div>
</div>

<p class="footnote">Raschka 2025. Next: PPO and GRPO, the method DeepSeek-R1 used on top of DeepSeek-V3 (arXiv:2501.12948)</p>

Note:
Five things to keep. The 2025 block is still GPT's block; six parts changed, and each is easiest to understand as an answer to "what is expensive?". During decoding, the expensive thing is moving bytes, not doing arithmetic. Two numbers explain changes 1, 2 and 4: the KV cache per token and the active weights per token; compute those for a model and you know much of what its architecture is for. Total and active weights are different things: memory follows the total, arithmetic the active count. And the quality evidence for these changes is thin; the memory arithmetic is solid.
The open question for the rest of the week: if the architecture changed this little, and even Raschka suspects the secret sauce is in training, what in training is doing the work? PPO and GRPO, the method R1 used on top of DeepSeek-V3, take up one answer. The R1 paper says it built "upon DeepSeek-V3-Base and employ Group Relative Policy Optimization (GRPO)", reading 4 of this week.




---

<!-- .slide: class="cover divider" -->

<p class="kicker">Reading 3 of 4</p>
<h1>Schulman et al. 2017</h1>
<p class="subtitle">Proximal Policy Optimization Algorithms</p>
<p class="question">How far can one batch of experience safely move a policy?</p>
<ol class="track"><li class="done">GPT-3 2020<span>few-shot learners</span></li><li class="done">Raschka 2025<span>architectures</span></li><li class="now">PPO 2017<span>policy optimization</span></li><li>GRPO 2024<span>DeepSeekMath</span></li></ol>

Note:
Reading 3 of 4. Schulman, Wolski, Dhariwal, Radford and Klimov, OpenAI, 2017. This is the algorithm InstructGPT used for its reinforcement-learning step, and the one our next reading, GRPO, modifies. We have to build some reinforcement learning first, because the paper assumes it.


---

<p class="eyebrow"><span class="paper">Schulman et al. 2017</span> · Before the paper · why reinforcement learning (ours)</p>

## Why not just fine-tune on answers?

<table class="rules" style="font-size:24px">
  <tr><td></td><td>fine-tuning</td><td>reinforcement learning</td></tr>
  <tr><td>prompt</td><td>"The capital of France is"</td><td>"What is 17 × 19?"</td></tr>
  <tr><td>we have</td><td>the answer: Paris</td><td>a checker: 323 ▸ 1, anything else ▸ 0</td></tr>
  <tr><td>the model learns from</td><td>the right token</td><td>a score for its own answer</td></tr>
  <tr><td>loss</td><td>$-\log\pi_\theta(\text{Paris} \mid x)$</td><td>this reading</td></tr>
</table>

<p class="q" style="margin-top:24px"><b>Q.</b> When is a score easier to get than a label?</p>
<p class="a"><b>A.</b> Many good answers (an essay), or a checker but no worked solution</p>

<p class="footnote">Ours. $\pi_\theta$: the model, called the policy. We use 17 × 19 = 323 as the running example through PPO and GRPO</p>

Note:
Start from what you already know. Fine-tuning: the model reads "The capital of France is", predicts a distribution over the next token, and we know the right one, Paris, so we minimise minus log of its probability. Every step has a label.
Now ask "What is 17 × 19?". We may have no worked solution to imitate, only a checker: 323 is right, anything else is wrong. Or ask for an essay, where there are hundreds of good answers and no single target sequence. What we can do is let the model answer, score the answer, and change the model so high-scoring answers become more likely.
That's the whole difference. Fine-tuning says: here is the answer you should give. Reinforcement learning says: here is how good the answer you gave was.
Say the model answers 323, 324 and 326 on three tries: rewards 1, 0, 0. We want 323 pushed up and the other two pushed down, without any label. The rest of this reading is how to do that, and how to do it without wrecking the model on a few lucky samples. We keep this example through PPO and GRPO.

---

<p class="eyebrow"><span class="paper">Schulman et al. 2017</span> · Motivation · §1</p>

## What problem is PPO solving?

<div class="cols">
<div class="text">

- data is expensive: reuse it?
- too small a step wastes samples; too big collapses the policy
- TRPO (trust region policy optimization): safe, but second-order (uses curvature)
- PPO: clip one ratio, then plain Adam

</div>
<div class="text">

<p class="q"><b>Q.</b> Why should a language-model class care?</p>
<p class="a"><b>A.</b> The model is the policy; each token is an action; InstructGPT used PPO</p>

</div>
</div>

<p class="footnote">Schulman et al. 2017 · arXiv:1707.06347 · OpenAI. TRPO: Schulman et al. 2015. The paper says TRPO is "not compatible with architectures that include noise (such as dropout) or parameter sharing" (§1)</p>

Note:
Here is the practical question. You have a policy, a network that picks actions, and a batch of experience it just collected. How far can you move the policy using that batch before you need fresh data? Move too little and you waste expensive samples: a plain policy gradient uses each one for a single gradient step. Move too far and the policy can collapse, because the data no longer describes the policy you are running.
The best method of the day for staying safe, TRPO, needed second-order machinery, and the paper says it didn't mix with dropout or with networks that share layers between the policy and the value estimate. PPO's answer is tiny: clip the ratio between new and old policy, take a pessimistic minimum, and run several epochs of ordinary Adam on the same batch.
Why care in this class? Fine-tune a language model on a reward and the model is the policy, every token an action. PPO is what InstructGPT used, and our next reading modifies it.
The twist, which we come back to: three years later, Engstrom et al. (2020, later in this section) showed much of PPO's edge over TRPO came from undocumented code details, not the clip. Their claim is about PPO's gain in reward over TRPO.

---

<p class="eyebrow"><span class="paper">Schulman et al. 2017</span> · Preliminary (needed first)</p>

## What are a policy, a reward and a return?

<div class="cols wide-fig">
<div class="text">

- state $s_t$, action $a_t$, reward $R_t$; policy $\pi_\theta(a \mid s)$: a network
- episode $\tau$: one run to the end; return: total reward from now on
- goal: expected return
- discount $\gamma \lt 1$: later rewards count less (a variance knob, not the goal)

<div class="eq">$$J(\theta) = \mathbb{E}_{\tau\sim\pi_\theta}\Big[\textstyle\sum_t R_t\Big]$$</div>

<p class="q"><b>Q.</b> $\gamma = 0.99$: a reward 100 steps away?</p>
<p class="a"><b>A.</b> $0.99^{100} = 0.366$ of one now</p>

</div>
<div class="fig"><img src="img/week-04-ppo-agent.svg" alt="Illustration: the policy, the agent, sends an action to the environment; the environment returns the next state and a reward"></div>
</div>

<p class="footnote">Preliminary, ours. GAE (generalised advantage estimation, Schulman et al. 2015): $\gamma$ is a way "to reduce variance ... at the cost of introducing bias". The paper writes $r_t$ for reward; we write $R_t$, since $r_t$ is also its ratio</p>

Note:
Supervised learning has a target for every input; here we only find out afterwards whether what we did was good. At step t the agent sees a state, picks an action, and gets a reward, a number. One run to the end is an episode. The policy is a network that outputs a distribution over actions: on the paper's robots a Gaussian (bell curve) over joint torques, on Atari a softmax over joystick moves.
The return is the total reward from now on, and the goal is its expectation over episodes, tau being one run to the end. Every table in the paper uses a discount gamma of 0.99, so a reward 100 steps away counts about a third: gamma below 1 makes later rewards count less. But the GAE paper and later Andrychowicz et al. treat gamma as part of the algorithm, a knob that cuts variance at the cost of bias, not part of the goal; Andrychowicz et al. 2020 likewise treat the goal as undiscounted. That reading is what makes the paper's Eq. 1 come out exactly as printed.
Two notation warnings. The paper uses r t for both the reward and the probability ratio; we write capital R for reward. And it uses delta for both TRPO's KL limit and the one-step surprise.

---

<p class="eyebrow"><span class="paper">Schulman et al. 2017</span> · Preliminary (needed first)</p>

## How is a language model a policy?

<div class="cols wide-fig">
<div class="text">

- state: prompt + tokens so far
- action: next token, 1 of 50257
- transition: append it; deterministic
- reward: 1 if the answer is 323, at the end

<p class="q"><b>Q.</b> One step or many?</p>
<p class="a"><b>A.</b> Both: one reward per response, but we apply PPO's ratio per token (ours)</p>

</div>
<div class="fig"><img src="img/week-04-ppo-tokens.svg" alt="Illustration: the prompt What is 17 × 19? followed by three tokens, 3, 2 and 3, with probabilities 0.9, 0.8 and 0.5; rewards 0, 0 and 1; the response probability is 0.36"></div>
</div>

<p class="footnote">Ours; one digit per token for the example. 50257: GPT-2's byte-pair vocabulary (subword pieces); GPT-3 reuses the tokenizer (this week's GPT-3 reading). InstructGPT calls the setting "a bandit environment": one prompt, one response, one reward</p>

Note:
The mapping is direct. The state is the prompt plus the tokens generated so far; the action is the next token, one of about fifty thousand; the transition is deterministic, append the token; and the reward is usually one number at the end, from a reward model or a checker. For "What is 17 × 19?" the model writes 3, then 2, then 3, with probabilities 0.9, 0.8 and 0.5: the whole response has probability 0.36, and only the last token sees a reward, 1, because 323 is right. (A real tokenizer may write 323 as one token; we split the digits so the example has three steps.)
Is this a one-step or many-step problem? Both, and hold both views. InstructGPT calls it a bandit: one prompt in, one response out, one reward. But PPO's ratio, clip and advantage run per token, treating each token as a step whose only nonzero reward is at the end. And we can't compute expectations exactly: there are astronomically many responses, so everything below is an estimate from samples, with a variance.

---

<p class="eyebrow"><span class="paper">Schulman et al. 2017</span> · Preliminary (needed first)</p>

## What makes an action good?

<div class="cols">
<div class="text">

- value $V(s)$: expected return from $s$
- $Q(s, a)$: take $a$ first, then the policy
- advantage $A = Q - V$: better than expected? $A \gt 0$: do it more; $A \lt 0$: less
- $V$ is learned by a second network, the critic: regress it onto returns

</div>
<div class="text">

<table class="rules" style="font-size:22px">
  <tr><td>state</td><td class="num">critic's $V$</td></tr>
  <tr><td>prompt</td><td class="num">0.5</td></tr>
  <tr><td>prompt + "3"</td><td class="num">0.6</td></tr>
  <tr><td>prompt + "32"</td><td class="num">0.8</td></tr>
  <tr><td>prompt + "4"</td><td class="num">≈ 0</td></tr>
</table>

<p class="q" style="margin-top:14px"><b>Q.</b> Advantage of writing "4" first?</p>
<p class="a"><b>A.</b> About $0 - 0.5 = -0.5$: do it less</p>

</div>
</div>

<p class="footnote">Ours, standard definitions; critic values illustrative, reused in the GAE example. InstructGPT (Ouyang et al. 2022) used "a 6B RM and a 6B value function" for policies of every size; RM: reward model, a network trained on human rankings</p>

Note:
A good action isn't one with high reward; it's one that did better than we expected from that state. The value V of s is the expected return from s following the policy. Q of s and a is the expected return if we take a first. The advantage, Q minus V, is how much better a is than the policy's average behaviour there. A positive advantage means do this more often, negative means less. That sign steers every update in this paper, and PPO treats the two signs differently.
V isn't known; a second network learns it, the value network or critic, by regression onto the returns we actually observe.
Make it concrete with 17 × 19 (the critic's guesses are ours). Before any digit, the critic thinks the model gets it right half the time: 0.5. After "3" it is more hopeful, 0.6; after "32", 0.8. After "4" the answer is already wrong, since 323 starts with 3: a dead end, value about 0. So writing "4" first has advantage about 0 minus 0.5, strongly negative, even though no reward has arrived yet. That is what the critic buys: a judgement on each token, not just on the finished answer.
For a language model the critic is itself a transformer with a scalar output head, reading the prompt and response so far and predicting the final reward. InstructGPT used a 6-billion-parameter value network, started from the reward model (a network trained on human rankings), for every policy size. Remember this: the next reading removes this piece.

---

<p class="eyebrow"><span class="paper">Schulman et al. 2017</span> · §2.1 Policy gradient methods · Eqs. 1, 2</p>

## How do you differentiate what you sample?

<div class="cols">
<div class="text">

<div class="eq">$$\hat g = \hat{\mathbb{E}}_t\big[\nabla_\theta\log\pi_\theta(a_t \mid s_t)\hat A_t\big]$$</div>

- trick: $\nabla p = p\nabla\log p$, so the gradient is an expectation: sample it
- dynamics don't depend on $\theta$: no model of the environment
- only later rewards count; subtract $V(s_t)$: changes nothing

</div>
<div class="text">

<table class="rules" style="font-size:22px">
  <tr><td></td><td>loss</td><td>on</td></tr>
  <tr><td>fine-tuning</td><td>$-\log\pi_\theta(y^\star \mid x)$</td><td>the label</td></tr>
  <tr><td>policy gradient</td><td>$-\hat A\log\pi_\theta(y \mid x)$</td><td>own sample</td></tr>
</table>

<p class="q" style="margin-top:14px"><b>Q.</b> Sample "324", $\hat A = -0.5$?</p>
<p class="a"><b>A.</b> A fine-tuning step on 324, reversed, at half size</p>

</div>
</div>

<p class="footnote">Our derivation of Eqs. (1), (2), Schulman et al. 2017 §2.1; the batch average is "the empirical average over a finite batch of samples". Comparison with fine-tuning: ours. GAE, the $\hat A_t$ PPO uses, comes with the algorithm (§5)</p>

Note:
Step 1: how do you differentiate an expectation over trajectories when the trajectories are sampled from the policy you're differentiating? Write J as a sum over trajectories of probability times return, with R of tau the total reward of trajectory tau and p theta of tau its probability under the policy:
$$\nabla\_\theta J = \sum\_\tau R(\tau)\thinspace p\_\theta(\tau)\nabla\_\theta\log p\_\theta(\tau) = \mathbb{E}\_{\tau\sim\pi\_\theta}\big[R(\tau)\nabla\_\theta\log p\_\theta(\tau)\big]$$
Differentiate, and use the log-derivative trick: the gradient of p equals p times the gradient of log p. The result is again an expectation under the policy, so we can estimate it by sampling.
Now expand the log-probability of a trajectory: a sum of log-policy terms plus the environment's transition terms. Only the policy terms depend on theta, so the dynamics drop out. We never need a model of the environment. For a language model the dynamics are trivial anyway.
Step 2: which rewards does each action answer for? One identity does all the work: the score, the gradient of log pi, has mean zero, because the probabilities sum to one:
$$\mathbb{E}\_{a\sim\pi}\big[\nabla\log\pi(a)\big] = \nabla\textstyle\sum\_a\pi(a) = 0$$
So the score times anything that doesn't depend on the action averages to zero.
Use it three times. A reward earned before step t is fixed once we condition on the history up to s t, so its product with the score at t averages to zero: an action can't have caused a reward that came before it, so each action only answers for the rewards after it. Averaging those later rewards given the state and action is the definition of Q (the law of total expectation: average over what happens next). And subtracting V of s t, which doesn't depend on the action, changes nothing. What remains is the score weighted by the advantage: the paper's Eq. 1. Eq. 2 is the loss whose gradient that is:
$$L^{PG}(\theta) = \hat{\mathbb{E}}\_t\big[\log\pi\_\theta(a\_t \mid s\_t)\hat A\_t\big]$$
Those steps are exact. Bias enters only when we plug in an estimated advantage. For now, think of it as the return from t minus V of s t. In words: maximum likelihood on your own samples, weighted by how much better than expected they were.
Set it next to fine-tuning, the table. Fine-tuning pushes up the log-probability of a label someone wrote. The policy gradient pushes up the log-probability of the model's own sample, the same update, multiplied by the advantage. On 17 × 19: the sample 323 with advantage plus 0.5 gets a half-size fine-tuning step toward 323. The sample 324 with advantage minus 0.5 gets a half-size step away from it. The advantage is the scaling factor; everything else in PPO is about estimating it and keeping these steps safe. For a language model the dynamics are just "append the token", so there is nothing to model.

---

<p class="eyebrow"><span class="paper">Schulman et al. 2017</span> · §2.1 · why it is noisy</p>

## Why is the estimate so noisy, and what fixes it?

<div class="cols wide-fig">
<div class="text">

- two actions at 0.5; scores ±0.5
- rewards (1, 0): estimates 0.5 or 0; standard deviation 0.25
- add 10 to both: 5.5 or −5.0; standard deviation 5.25, 21x
- baseline 10.5 (= $V$ here): both 0.25; standard deviation 0

<p class="q"><b>Q.</b> Every $\hat A_t = 1$: what does $L^{PG}$ do?</p>
<p class="a"><b>A.</b> Nothing on average: imitating your own samples has mean gradient 0</p>

</div>
<div class="fig"><img src="img/week-04-ppo-noise.svg" alt="Illustration: single-sample gradient estimates; rewards 1 and 0 give 0.5 or 0; rewards 11 and 10 give 5.5 or minus 5.0; with baseline 10.5 both samples give 0.25; the true gradient is 0.25 in every case"></div>
</div>

<p class="footnote">Ours: softmax over two actions with logit $z$ at 0, true gradient $0.25(R_{\rm left} - R_{\rm right})$. Baseline 10.5 = $V$ = 0.5 × 11 + 0.5 × 10. A baseline zeroes the variance here only because both scores have size 0.5</p>

Note:
The smallest possible example. Two actions, left and right, each with probability 0.5. The score for the logit is plus 0.5 for left and minus 0.5 for right, and the true gradient is 0.25 times the reward difference.
Rewards 1 and 0: a single sample gives 0.5 or 0. The mean is 0.25, correct, standard deviation 0.25. Now add 10 to both rewards. Which action is better hasn't changed, the true gradient is still 0.25, but one sample now gives 5.5 or minus 5. Same mean, standard deviation 5.25, 21 times larger. A single right sample pushes the wrong way. The estimator is unbiased, but its variance depends on the size of the rewards, not only their differences.
The fix is a baseline. Subtract 10.5 and both samples give exactly 0.25: zero variance. That's allowed because of the score identity. In general it won't remove all the variance; it does here because both scores have the same size, and in general V of s is the natural, near-best choice. It is the natural baseline, which is why PPO learns one. And a check: if every advantage is 1, the loss is imitation of your own samples, and its expected gradient is zero. Only differences in advantage carry signal. The next reading gets a baseline another way.

---

<p class="eyebrow"><span class="paper">Schulman et al. 2017</span> · §2.1, §3 · Eq. 6 (ratio first used in Eq. 3, §2.2)</p>

## Why not take ten steps on one batch?

<div class="cols">
<div class="text">

<blockquote>"doing so is not well-justified, and empirically it often leads to destructively large policy updates"</blockquote>

- after step 1: old data, and nothing in $L^{PG}$ says stop; a lucky action ▸ probability 1
- 0.20 ▸ 0.30: $r$ = 1.5, outside $[0.8, 1.2]$

</div>
<div class="text">

<div class="eq">$$r_t(\theta) = \frac{\pi_\theta(a_t \mid s_t)}{\pi_{\theta_{\rm old}}(a_t \mid s_t)}, \qquad r_t(\theta_{\rm old}) = 1$$</div>

- importance sampling: reweight old samples by the ratio
- at $\theta_{\rm old}$: same gradient as $L^{PG}$

<p class="q"><b>Q.</b> $\pi_{\rm old}(a) = 0.2$, advantage positive: how far can the ratio go?</p>
<p class="a"><b>A.</b> To $1/0.2 = 5$; the objective rises all the way to certainty</p>

</div>
</div>

<p class="footnote">Schulman et al. 2017 · §2.1, §3. CPI: conservative policy iteration (Kakade &amp; Langford 2002). "Without a constraint, maximization of $L^{CPI}$ would lead to an excessively large policy update" (§3). Ratio example: ours</p>

Note:
Collecting data is the expensive part, so why not run ten epochs of Adam on this loss instead of one step? This sentence is what the whole paper exists to fix: doing so is not well-justified and often leads to destructively large policy updates.
Why? The loss's gradient is right only at the policy that collected the data. After the first step we're evaluating a new policy on the old policy's samples. Worse, nothing in the loss says stop: a positive-advantage action's log-probability can keep rising every epoch until the policy always picks it, all on a few noisy estimates.
What's the evidence? Less than it seems. The paper says see Section 6.1 and that "results are not shown but were similar or worse than" the "no clipping or penalty" setting. So the pointer lands on Table 1's no-clip row, which uses the ratio objective we're about to meet: minus 0.39 on average, below random, because HalfCheetah collapses ("worse than the initial random policy", §6.1). That row is the ratio objective r t times the advantage of §3 run for several epochs, not L PG.
How do you score a new policy on old samples? Our samples came from the old policy. Use importance sampling: an average under the new policy equals an average under the old policy with each term multiplied by the probability ratio, new over old:
$$\mathbb{E}\_{a\sim\pi}[f(a)] = \mathbb{E}\_{a\sim\pi\_{\rm old}}\Big[\tfrac{\pi(a)}{\pi\_{\rm old}(a)}f(a)\Big]$$
That identity is the one that justifies the ratio, which starts at 1. A number to hold: if a token had probability 0.20 when we sampled and 0.30 now, the ratio is 1.5, the token is 50% more likely, already outside the band 0.8 to 1.2 that PPO will allow (ours). The resulting surrogate objective is named for Kakade and Langford's conservative policy iteration:
$$L^{CPI}(\theta) = \hat{\mathbb{E}}\_t\big[r\_t(\theta)\hat A\_t\big]$$
Check it against the policy gradient: at the old parameters the gradient of the ratio equals the gradient of log pi (ours), so the two losses have exactly the same gradient at the start. They differ only once we move. And notice what the ratio doesn't fix: it corrects which action the new policy would pick, but the states are still the ones the old policy visited. That's why the surrogate is only trusted nearby.
Why is it dangerous alone? It's linear in the ratio. If the old policy gave a good action probability 0.2, the ratio can reach 5, and the optimiser is rewarded all the way to certainty.

---

<p class="eyebrow"><span class="paper">Schulman et al. 2017</span> · §2.2 · Eqs. 3 to 5</p>

## How did TRPO limit the step?

<div class="cols">
<div class="text">

<div class="eq">$$\mathrm{KL}[p, q] = \textstyle\sum_a p(a)\ln\frac{p(a)}{q(a)}$$</div>

- TRPO: maximise $L^{CPI}$ with mean KL $\le\delta$, a hand-set limit (value not given)
- 50/50 ▸ 60/40: KL 0.0204; ratios 1.2 and 0.8, here the clip edges
- theory says: penalise instead; a bound tight at the start guarantees no worse
- practical TRPO leaves the theorem

</div>
<div class="text">

<p class="q"><b>Q.</b> Is a 0.02 KL always ratios within 0.8 to 1.2?</p>
<p class="a"><b>A.</b> No: many actions or a Gaussian can hide much larger ones</p>

</div>
</div>

<p class="footnote">Schulman et al. 2017 · Eqs. (3) to (5). KL: Kullback-Leibler divergence, zero if equal, old first, in nats (natural logs, 1 nat = 1.44 bits). Worked numbers: ours; Fig. 2's update has KL "about 0.02"</p>

Note:
TRPO limits how far the action distribution moves, measured by the Kullback-Leibler divergence: zero when the distributions agree, growing as they separate. It isn't symmetric; the paper always puts the old policy first. With natural logs it's in nats. TRPO maximises the surrogate subject to the mean KL staying below delta, a limit the paper never gives a value for, solved with "the conjugate gradient algorithm" after linear and quadratic approximations. That means Hessian-vector products on every update.
What does 0.02 feel like? Move a 50/50 choice to 60/40:
$$0.5\ln\tfrac{0.5}{0.6} + 0.5\ln\tfrac{0.5}{0.4} = 0.0204$$
the other order gives 0.0201. That's the size of the PPO update in Figure 2. In this two-action example the ratios are 1.2 and 0.8, exactly the clip edges at epsilon 0.2. Don't generalise from that: with many actions, or a Gaussian over torques, the same mean KL can hide individual ratios far outside the band. Engstrom et al. measured exactly that.
Why would a KL penalty guarantee improvement? "The theory justifying TRPO actually suggests using a penalty instead of a constraint":
$$\max\_\theta\ \hat{\mathbb{E}}\_t\big[r\_t\hat A\_t - \beta\thinspace \mathrm{KL}[\pi\_{\theta\_{\rm old}}, \pi\_\theta]\big]$$
Three lines. One: with the maximum KL over states (the penalty form uses "the max KL over states instead of the mean") and the right beta, call M of pi the old policy's performance plus the surrogate minus the penalty; it is a lower bound on the true performance eta of any policy. Two: the bound is tight at the old policy, because there both the KL and the change are zero. Three: the new policy maximises M, so M at the new policy is at least M at the old one, which equals the old performance; and eta at the new policy is at least M there. Chain them and performance can't go down. The three steps are ours; the constant is in the TRPO paper (not read here) and needs gamma below 1.
Step two is the key one: raising a lower bound that doesn't touch the true curve at your current point guarantees nothing. And TRPO itself already leaves the theorem: it uses the mean KL, a hand-set delta and approximations. (The paper's reason for a hard constraint rather than a penalty is that "it is hard to choose a single value of beta".) A fixed beta with SGD, stochastic gradient descent run as ascent, is "not sufficient". The paper's two fixes are next: the clip and an adaptive beta.

---

<p class="eyebrow"><span class="paper">Schulman et al. 2017</span> · §3 Clipped surrogate objective · §4 · Eq. 7 · Fig. 1</p>

## What is the one-line change PPO makes?

<div class="rows">
<div class="points">
<div class="text">

<div class="eq">$$L^{CLIP} = \hat{\mathbb{E}}_t\big[\min\big(r_t\hat A_t,\ \mathrm{clip}(r_t, 1-\epsilon, 1+\epsilon)\hat A_t\big)\big]$$</div>

</div>
<div class="text">

- $\epsilon = 0.2$, "say"
- clip: no incentive outside $[1-\epsilon, 1+\epsilon]$
- min: "a pessimistic bound" on $L^{CPI}$
- the alternative, an adaptive KL penalty, "performed worse"

</div>
</div>
<div class="fig"><img src="img/week-04-ppo-fig1.png" alt="Schulman et al. Figure 1: one term of L CLIP against the ratio r. Left, positive advantage: rising from the origin, flat beyond 1 plus epsilon. Right, negative advantage: flat below 1 minus epsilon, then falling. A red dot marks the start at r = 1"></div>
</div>

<p class="footnote">Schulman et al. 2017 · Eq. (7), Fig. 1 ("$L^{CLIP}$ sums many of these terms"). "we only ignore the change in probability ratio when it would make the objective improve, and we include it when it makes the objective worse" (§3)</p>

Note:
The paper's idea in one equation. Take the surrogate, the ratio times the advantage. Next to it, the same thing with the ratio clipped to 1 minus epsilon, 1 plus epsilon, epsilon 0.2. Take the minimum of the two.
Read Figure 1, one term of the sum (the right panel's tick labels crowd in the paper). Left, positive advantage: the term rises with the ratio and goes flat at 1 plus epsilon. Right, negative advantage: flat until 1 minus epsilon, then falling. The red dot is the start, ratio 1. The flat parts sit on the side the advantage pushes toward; on the other side the slope continues without limit. In the paper's words: ignore the change in ratio when it would make the objective improve, include it when it makes it worse.
And at ratio 1 every sample is inside the band, so to first order the clipped objective equals the surrogate: the first gradient step of each iteration is exactly the policy-gradient step. Clipping only bites after the policy has moved.
Or adapt a KL penalty instead? Section 4 keeps the penalty form but adjusts beta after each update to hit a target KL:
$$L^{KLPEN} = \hat{\mathbb{E}}\_t\big[r\_t\hat A\_t - \beta\thinspace \mathrm{KL}[\pi\_{\theta\_{\rm old}}, \pi\_\theta]\big]$$
Run several epochs, measure the mean KL d, then halve beta if d is below the target over 1.5, double it if d is above 1.5 times the target. With a target of 0.01 and beta of 1 the thresholds are 0.00667 and 0.015 (ours): an update that reached 0.004 halves beta to 0.5; one that reached 0.02 doubles it to 2; 0.012 leaves it alone. It's a thermostat: it reacts after the fact, so a single update can still overshoot. The authors say such misses are rare and beta quickly adjusts; 1.5 and 2 were "chosen heuristically". The paper says it "performed worse than the clipped surrogate objective, however, we've included it here because it's an important baseline". It is usable "in addition to" clipping; never tested.
Remember: this KL is to the policy one iteration ago. The KL penalty in language-model fine-tuning is to a frozen reference model, a different thing we'll see at the end.

--

<p class="eyebrow"><span class="paper">Schulman et al. 2017</span> · §1, §2, §5 · what was already there (sub-slide)</p>

## What did PPO actually add?

<table class="rules" style="font-size:22px">
  <tr><td>piece</td><td>from</td></tr>
  <tr><td>likelihood × reward: the policy gradient</td><td>Williams 1992 (REINFORCE)</td></tr>
  <tr><td>a learned critic as baseline; many actors</td><td>Mnih et al. 2016 (A3C)</td></tr>
  <tr><td>GAE for the advantage</td><td>Schulman et al. 2015a</td></tr>
  <tr><td>the ratio surrogate $L^{CPI}$</td><td>Kakade &amp; Langford 2002</td></tr>
  <tr><td>a KL limit on each update</td><td>TRPO, Schulman et al. 2015b</td></tr>
  <tr><td>clip and min; $K$ epochs of Adam on one batch</td><td>PPO 2017: new</td></tr>
</table>

<p class="q" style="margin-top:20px"><b>Q.</b> So what is PPO's contribution?</p>
<p class="a"><b>A.</b> One clipped loss that lets a batch take many first-order steps</p>

<p class="footnote">Schulman et al. 2017, references [Wil92], [Mni+16], [Sch+15a], [KL02], [Sch+15b]. The paper cites Williams 1992 for the entropy bonus; REINFORCE is that paper's estimator. Actor-critic itself is older than A3C</p>

Note:
Optional. Everything before this slide existed before PPO. The policy gradient, likelihood times reward, is Williams's REINFORCE from 1992. A learned value function as a baseline, with many actors running in parallel, is the actor-critic style the paper takes from Mnih et al. 2016, A3C. GAE, the way PPO turns the critic into advantages, is Schulman's own 2015 paper. The ratio surrogate is Kakade and Langford's conservative policy iteration from 2002. Limiting each update by a KL is TRPO, 2015.
What PPO adds is the clip with its pessimistic minimum, and the recipe of running several epochs of Adam on each batch. That is a few lines of code, which is both why the paper is short and why it spread. Keep this in mind for the critiques: if most of the parts are older, it is fair to ask how much of PPO's success is the new part, and Engstrom et al. ask exactly that.

---

<p class="eyebrow"><span class="paper">Schulman et al. 2017</span> · §3 · Eq. 7, four cases</p>

## What does the clip do in each case?

<div class="cols wide-fig">
<div class="text">

<table class="rules">
  <tr><td></td><td class="num">$A$</td><td class="num">$r$</td><td class="num">$rA$</td><td class="num">clip</td><td class="num">min</td><td class="num">slope in $r$</td></tr>
  <tr><td>a</td><td class="num">+2</td><td class="num">1.3</td><td class="num">2.6</td><td class="num">2.4</td><td class="num">2.4</td><td class="num">0</td></tr>
  <tr><td>b</td><td class="num">+2</td><td class="num">0.7</td><td class="num">1.4</td><td class="num">1.6</td><td class="num">1.4</td><td class="num">+2</td></tr>
  <tr><td>c</td><td class="num">−2</td><td class="num">0.7</td><td class="num">−1.4</td><td class="num">−1.6</td><td class="num">−1.6</td><td class="num">0</td></tr>
  <tr><td>d</td><td class="num">−2</td><td class="num">1.3</td><td class="num">−2.6</td><td class="num">−2.4</td><td class="num">−2.6</td><td class="num">−2</td></tr>
</table>

- clip alone would be flat in b and d: it would refuse to undo a harmful move; the min restores them

<p class="q"><b>Q.</b> In every case, what is capped?</p>
<p class="a"><b>A.</b> The improvement. The worsening never is</p>

</div>
<div class="fig"><img src="img/week-04-ppo-cases.svg" alt="Illustration: one term of the clipped objective against the ratio for advantage plus 2 and minus 2, epsilon 0.2, with the unclipped line dashed; cases a, 2.4, and c, minus 1.6, sit on flat parts; cases b, 1.4, and d, minus 2.6, sit on sloped parts"></div>
</div>

<p class="footnote">Ours, from Eq. (7) with $\epsilon$ = 0.2. A token at 0.30 under the old policy and 0.39 now has $r = 1.3$. Gradient is zero only if ($A \gt 0$, $r \gt 1+\epsilon$) or ($A \lt 0$, $r \lt 1-\epsilon$)</p>

Note:
Work the four cases with epsilon 0.2 and advantages plus or minus 2. Think of a token whose probability went from 0.30 to 0.39: ratio 1.3.
Case a: a good action already 30% more likely, past the 20% allowance. The clipped term, 2.4, is smaller, so the min picks it, and it's flat: no gradient, stop pushing. Case b: a good action that became less likely, because other samples' updates dragged it down. Now the unclipped term, 1.4, is smaller, and the full gradient pushes it back up. Case c: a bad action already cut by 30%: flat, stop. Case d: a bad action that became more likely: unclipped, full gradient to push it down.
The rule in one line: a sample's gradient is switched off only when it has already moved the way its advantage wanted, by more than epsilon. Moves that made things worse are never clipped. Check it with a new case: at ratio 1.5 with advantage minus 1 the unclipped term, minus 1.5, is the smaller one, so the slope is minus 1 and the gradient flows; at 0.5 the clipped term, minus 0.8, is the smaller one, so the slope is zero.
Why the min, and not just the clip? Drop the min and use only the clipped term. With clip alone, a good action whose ratio has fallen to 0.7 (case b) sits on the flat part below 0.8 and gets zero gradient, and so does a bad action whose ratio has risen to 1.3 (case d). The objective would refuse to undo a harmful move. The min puts the unclipped, worsening term back exactly in those two cases. Compact form (ours): A min(r, 1 plus epsilon) if A is positive, A max(r, 1 minus epsilon) if A is negative. Figure 2 (next) shows the clip-only and min curves side by side.
So in both signs the objective's improvement is capped and its worsening isn't. Compare a KL penalty: it acts on the whole action distribution at every state, whatever the advantage's sign, so it also resists moves the advantage wants and penalises changes to actions nobody sampled. The clip acts per sample and only on the favoured side.

---

<p class="eyebrow"><span class="paper">Schulman et al. 2017</span> · §3 · Fig. 2</p>

## What does one real update look like?

<div class="rows">
<div class="points">
<div class="text">

- Hopper: first update; line from $\theta_{\rm old}$ (0) to new (1)
- orange $L^{CPI}$ keeps rising; green clip-only goes flat
- red $L^{CLIP}$ peaks near 1, then falls: the min

</div>
<div class="text">

<p class="q"><b>Q.</b> Is a peak at 1 surprising?</p>
<p class="a"><b>A.</b> No (ours): the update comes from minibatch Adam on $L^{CLIP}$, so the peak is near 1. The shape is the news; the KL of 0.02 is where the optimiser stopped, not enforced</p>

</div>
</div>
<div class="fig"><img src="img/week-04-ppo-fig2.png" alt="Schulman et al. Figure 2: four curves against the linear interpolation factor from minus 0.5 to about 1.9; the KL rises quadratically; L CPI keeps rising; the clip-only objective levels off near 0.04; L CLIP peaks near factor 1 at about 0.034 and falls to about 0.01"></div>
</div>

<p class="footnote">Schulman et al. 2017 · Fig. 2: "The updated policy has a KL divergence of about 0.02 from the initial policy, and this is the point at which $L^{CLIP}$ is maximal." Hopper-v1: a one-legged MuJoCo robot rewarded for hopping forward</p>

Note:
Figure 2 takes the first PPO update on Hopper and evaluates four quantities along the straight line from the old parameters, at 0, to the updated ones, at 1, extended either side. Blue is the mean KL; orange the plain surrogate; green the clip without the min; red the full clipped objective.
Read it from left to right. Left of zero the objectives coincide. Past 1, orange keeps rising: it would happily keep going, as we said. Green levels off at about 0.04 and stays flat, because every sample that has moved far enough stops counting. Red bends over and falls. The gap between green and red is the min at work: further out, more samples land in cases b and d, and their worsening terms pull red down. At 1, the KL is about 0.02.
Is the peak at 1 surprising? Not really: the point at 1 was found by ten epochs of minibatch Adam maximising this very objective, so the peak sits near 1, about 1.05 on the plot, not exactly at it. What's informative is the shape: the clipped objective has an interior maximum, the surrogate has none. And, in our reading, the KL of 0.02 is where the optimiser stopped, not something the objective enforces. One update on one task.
What does the clip do to a model's tokens? Two consequences that surprise people who know language-model distributions. First, the ratio and clip are per token (ours; the paper's ratio is per timestep, and applying it per token is how language-model practice uses it; InstructGPT's KL penalty is per token too). Why not the ratio of whole responses, which is what importance sampling over sequences would literally ask for? Because ratios multiply: 1.1 on every token gives 1.331 for a 3-token response and 13,781 for a 100-token one. Sequence ratios explode.
Second, in probability terms the upper clip, which matters for positive advantages, is very uneven. A token the old policy gave 0.95 can reach a ratio of at most 1 over 0.95, 1.053, so the upper clip at 1.2 never binds: confident tokens can be pushed all the way to 1. A token at 0.01 is clipped as soon as it reaches 0.012. For a positive advantage the upper clip never binds for old probability above 1 over 1.2, 0.833, so anything above that can't be clipped upward at all. For negative advantages the lower clip binds at 0.8 times the old probability for every token, so it is even in ratio terms. Whether that's the right shape for language models, rather than an accident of a rule built for robots, is an open question.

---

<p class="eyebrow"><span class="paper">Schulman et al. 2017</span> · §5 · Eq. 9 · the loss</p>

## Why does the loss have three parts?

<div class="cols">
<div class="text">

<div class="eq">$$L^{CLIP+VF+S} = \hat{\mathbb{E}}_t\big[L^{CLIP}_t - c_1 L^{VF}_t + c_2 S[\pi_\theta](s_t)\big]$$</div>

- $L^{VF}$: train the critic, squared error to the return
- $S$: entropy, keeps the policy exploring
- MuJoCo: separate networks, no entropy; Atari: $c_1$ 1, $c_2$ 0.01

</div>
<div class="text">

<p class="q"><b>Q.</b> Separate policy and critic: does $c_1$ matter?</p>
<p class="a"><b>A.</b> No: it only trades the two losses off when they share weights</p>

</div>
</div>

<p class="footnote">Schulman et al. 2017 · Eq. (9), App. A, Table 5. $c_1$, $c_2$: weights; $S$: entropy of the action distribution</p>

Note:
Why more than the clipped term? Because we also have to train the value function the advantages come from, and if the policy and value share a network, both losses must live in one objective. So Eq. 9 subtracts c1 times the value network's squared error, subtracted because the whole thing is maximised, and adds c2 times the policy's entropy, a bonus "to ensure sufficient exploration": it rewards keeping the action distribution spread out. Here L VF is the squared error between the value network and its target, and S is minus the sum over actions of pi times log pi. V targ is the observed return (regression); the paper leaves it undefined (common code uses the advantage plus the old V, which is the return).
A worked number for one sample: case a's clip term, 2.4, with advantage plus 2. With V at 0.7 the target is 2.7. The value network predicted 0.7, squared error 4, c1 of 1; the state has two actions at 0.39 and 0.61, entropy 0.669 (a 50/50 choice has entropy ln 2, 0.693 nats), c2 of 0.01. Total 2.4 minus 4 plus 0.00669, which is minus 1.5933 (ours). A badly wrong critic dominates the loss, which is why the value term needs its own coefficient.
When do the coefficients matter? On MuJoCo the networks are separate, so c1 is irrelevant, and the paper says it uses no entropy bonus, c2 of zero. Atari lists c1 of 1 and c2 of 0.01 (Table 5); the paper never says the network is shared, but that's our inference from c1. For a language model with a separate value model, c1 is irrelevant again. Remember: the value term and the V inside the advantage are the two places a critic enters PPO. The next reading removes both.

---

<p class="eyebrow"><span class="paper">Schulman et al. 2017</span> · §5 · Eqs. 10 to 12 · GAE</p>

## How do we estimate the advantage?

<div class="cols wide-fig">
<div class="text">

<div class="eq">$$\hat A_t = \textstyle\sum_l(\gamma\lambda)^l\delta_{t+l},\quad \delta_t = R_t + \gamma V(s_{t+1}) - V(s_t)$$</div>

- return − $V(s_t)$: real rewards; unbiased, noisy
- one step, $\delta_t$: trusts the critic; steady, biased
- GAE blends them: $\lambda$ 0 = one step, 1 = full return

<p class="q"><b>Q.</b> $\hat A_0$ (writes "3") with $\lambda = 1$, $\gamma = 1$?</p>
<p class="a"><b>A.</b> $0.1 + 0.2 + 0.2 = 0.5 = 1 - V(s_0)$</p>

</div>
<div class="fig"><img src="img/week-04-ppo-gaesteps.svg" alt="Illustration: advantages for the 17 × 19 answer 3, 2, 3 with rewards 0, 0, 1 and critic values 0.5, 0.6, 0.8; with lambda 0 they are 0.1, 0.2, 0.2; with lambda 0.95, 0.4705, 0.39, 0.2; with lambda 1, 0.5, 0.4, 0.2"></div>
</div>

<p class="footnote">Schulman et al. 2017 · Eqs. (10) to (12); GAE: generalised advantage estimation (Schulman et al. 2015a). $\delta_t$: temporal-difference residual. Example ours, $\gamma$ = 1 (InstructGPT applies "No discount")</p>

Note:
The advantage asks: how much better than expected was this token? There are two honest ways to measure it, and they fail in opposite directions.
One: wait for the end, add up the real rewards from here, the return, and subtract the critic's V of s t. No guess is involved beyond the baseline, so it is unbiased; but it rides on every random thing that happened later in the answer, so it is noisy. With a reward only at the end and no discount, the return is just the final reward: every token of 323 gets 1 minus its own V.
Two: look one step ahead. Take the reward you just got plus the critic's value of where you landed, minus the critic's value of where you were: the one-step surprise delta. Only one random reward is involved, so it is steady; but it trusts the critic, and early in training the critic is poor, so it is biased.
GAE takes a weighted blend of every horizon in between. Lambda sets the blend: lambda 0 is the one-step surprise, all critic; lambda 1 is the full return, no critic beyond the baseline. Careful with the direction: a lower lambda leans more on the critic, so it has more bias and less variance. PPO's settings, gamma 0.99 and lambda 0.95, lean mostly on real rewards: credit reaches back about 16.8 steps (ours, 1 over 1 minus gamma lambda).
GAE step 1: how surprised was the critic? Section 5 says how PPO actually computes the advantage, using generalised advantage estimation from the GAE paper (arXiv:1506.02438). Start with the one-step surprise, the temporal-difference residual: what I got, the reward plus the value of where I landed, minus what I expected, V of s t:
$$\delta\_t = R\_t + \gamma V(s\_{t+1}) - V(s\_t)$$
If V were exactly right, delta would be an unbiased estimate of the advantage. If V is wrong it's biased, but it has low variance, because it involves one random reward. V is poor early on, so lean on it less. Add k of them and the sum telescopes:
$$\hat A^{(k)}\_t = \textstyle\sum\_{l=0}^{k-1}\gamma^l\delta\_{t+l} = -V(s\_t) + R\_t + \dots + \gamma^{k-1}R\_{t+k-1} + \gamma^k V(s\_{t+k})$$
Each plus gamma V of the next state cancels the next minus V. You get k real rewards, then the critic's estimate for the rest, minus the baseline. More real rewards means less reliance on V, so less bias, but more random terms, so more variance. As k goes to infinity you get "the empirical returns minus the value function baseline" (GAE paper).
GAE step 2: why not average every horizon? Rather than pick one k, GAE averages all of them, weighting the k-step estimate by one minus lambda times lambda to the k minus one:
$$(1-\lambda)\big(\hat A^{(1)} + \lambda\hat A^{(2)} + \dots\big) = \textstyle\sum\_l(\gamma\lambda)^l\delta\_{t+l}$$
Collect the coefficient of each delta: delta t appears in every term and gets one minus lambda times a geometric series, which is 1; delta t plus 1 gets lambda; in general gamma to the l delta gets lambda to the l. So GAE is a discounted sum of surprises with the steeper discount gamma lambda. Lambda 0 gives the one-step surprise, low variance, biased; lambda 1 gives the return minus the baseline, unbiased, high variance. The GAE paper finds the best lambda well below the best gamma.
On a segment, standard code computes it backwards: A t equals delta t plus gamma lambda A t plus 1. Worked example (the figure): the 17 × 19 answer, digits 3, 2, 3, reward 1 at the end, the critic's values 0.5, 0.6, 0.8 from the earlier slide. Deltas 0.1, 0.2, 0.2. Backwards, 0.2, then 0.39, then 0.4705. With lambda 1 the first is 0.5, the return minus the baseline. With the paper's settings, by our calculation of 1 over 1 minus gamma lambda, credit reaches back about 17 steps (16.8): an effective horizon.
Two practical notes. The paper's printed exponent in Eqs. 10 and 11 is T minus t plus 1; it must be T minus t minus 1, so check it at t equals T minus 1. And on MuJoCo the segment of 2048 steps is longer than the 1000-step episodes, so a terminal state sets V to zero and restarts the recursion, while a time-limit cut should bootstrap; Andrychowicz et al. found that choice made little difference at 1000 steps.

---

<p class="eyebrow"><span class="paper">Schulman et al. 2017</span> · §5 · Algorithm 1 · App. A</p>

## What does one PPO iteration do?

<div class="cols">
<div class="text">

<pre style="font-size:22px;line-height:1.5;font-family:Menlo,monospace;color:#000;background:none;box-shadow:none;width:100%;margin:0;padding:0">for iteration = 1, 2, ... do
  for actor = 1, ..., N do
    run π_θold for T timesteps
    compute advantages Â_1..Â_T
  optimise L wrt θ: K epochs,
    minibatch size M ≤ NT
  θ_old ← θ</pre>

</div>
<div class="text">

- $N$ actors × $T$ steps, old policy frozen; advantages once (ours: GAE needs time order)
- $K$ passes over this batch, then discard (ours); only the first step is on-policy
- steps per batch: MuJoCo 320, Atari 12 (ours)

<p class="q"><b>Q.</b> In a language model?</p>
<p class="a"><b>A.</b> $\pi_{\rm old}$ is stored log-probs, so $r_t = \exp(\log\pi_\theta - \log\pi_{\rm old})$; actors are prompts, $T$ the response length. InstructGPT: 1 epoch, 512 responses, 8 minibatches of 64</p>

</div>
</div>

<p class="footnote">Schulman et al. 2017 · Algorithm 1, "PPO, Actor-Critic Style"; optimised "with minibatch SGD (or usually for better performance, Adam)". "one simply constructs the loss $L^{CLIP}$ ... instead of $L^{PG}$"; steps per batch: samples / minibatch × epochs</p>

Note:
Algorithm 1. Each iteration, N parallel actors each run the frozen old policy for T timesteps. Advantages are computed once; our reason is that GAE needs the time order. Then the N T samples are split into minibatches of size M and the clipped loss is optimised for K epochs, usually with Adam (shuffling into minibatches is standard code, not stated). Then the old parameters are set to the new ones and we repeat.
What does epoch mean here? Not a pass over a fixed training set. It's a pass over the batch you just sampled, which is thrown away after K passes. Only the very first minibatch step is exactly on-policy; every later step evaluates a moved policy on old data, which is the whole reason the ratio and the clip exist.
What changed from a policy gradient? The selling point, in the paper's words: "one simply constructs the loss L CLIP ... instead of L PG".
How many gradient steps per batch? The bookkeeping from the hyperparameter tables (App. A, Tables 3 to 5):
MuJoCo, Table 3: N not stated, T 2048, 2048 samples if N is 1, minibatch 64, 10 epochs, so 320 gradient steps per batch.
Roboschool running, Table 4: N 32, T 512, 16,384 samples, minibatch 4096, 15 epochs, 60 steps.
Roboschool flagrun, Table 4: N 128, T 512, 65,536 samples, minibatch 4096, 15 epochs, 240 steps.
Atari, Table 5: N 8, T 128, 1024 samples, minibatch 256, 3 epochs, 12 steps. A 10M-timestep Atari run is about 10 to the 7 over 1024, 9766 iterations.
One detail for later: on Atari the stepsize is 2.5 times 10 to the minus 4 times alpha and the clip is 0.1 alpha, where "alpha is linearly annealed from 1 to 0". Halfway through, the stepsize is 1.25 times 10 to the minus 4 and epsilon is 0.05. So on Atari epsilon is neither 0.2 nor fixed.
Make it concrete for a language model. The old policy isn't a second copy kept in memory. When you sample, you record the log-probability of every generated token. Later you compute the current model's log-probability of the same token and exponentiate the difference: that's the ratio. What does setting old to new cost? Nothing: you sample the next batch with the current weights. Actors are prompts answered in parallel; T is the response length; the critic predicts the eventual reward at every token position. And the epochs are passes over those responses: InstructGPT used one, eight minibatches of 64 from a batch of 512 ("batch size for each iteration is 512, with a minibatch size of 64 ... only a single inner epoch").

---

<p class="eyebrow"><span class="paper">Schulman et al. 2017</span> · §6 · §6.1 · Table 1</p>

## Which way of limiting the step works best?

<div class="cols wide-fig">
<div class="text">

- 7 MuJoCo tasks, 1M timesteps, 3 seeds; score 0 = random, 1 = "the best result"
- four tests in the paper; only this one isolates the clip
- no limit: −0.39, below random (HalfCheetah)
- clip 0.2: 0.82, the best; best adaptive KL: 0.74 (gap 0.08)

<p class="q"><b>Q.</b> What does it show, and what not?</p>
<p class="a"><b>A.</b> Control vs none: at least 1.01. Clip vs KL: 0.08, no error bars, tuned on the same runs</p>

</div>
<div class="fig"><img src="img/week-04-ppo-scores.svg" alt="Table 1 re-plotted as horizontal bars: no clipping or penalty minus 0.39; clip at epsilon 0.1, 0.2, 0.3 scores 0.76, 0.82, 0.70; adaptive KL with targets 0.003, 0.01, 0.03 scores 0.68, 0.74, 0.71; fixed KL with beta 0.3, 1, 3, 10 scores 0.62, 0.71, 0.72, 0.69"></div>
</div>

<p class="footnote">Schulman et al. 2017 · §6.1, Table 1 ("$\beta$ was initialized at 1"). MuJoCo: a physics simulator for robot tasks. Score $(x - x_{\rm random})/(x_{\rm best} - x_{\rm random})$, last 100 episodes: ours. Differences ours</p>

Note:
What will the paper test? Four experiments. Table 1, §6.1: which way of limiting the step works best, comparing PPO variants (none, clip, KL penalty); result clip 0.82, none minus 0.39. Fig. 3, §6.2: is PPO better than other algorithms, against TRPO, CEM, vanilla policy gradient and A2C; ahead on 3 of 7, behind TRPO on Swimmer. Figs. 4 and 5, §6.3: does it scale to a humanoid, against nothing; it runs, steers, gets up. Table 2, §6.4: pixels, discrete actions, a shared network, against A2C and ACER; fastest (30 games), though ACER ends higher (28 to 19). Two things to notice already. Only Table 1 isolates the clip; everything else compares whole algorithms. And TRPO, the method PPO claims to match, appears only in Figure 3.
The setup of Table 1: the same code, same tasks, only the policy loss changes. Seven MuJoCo tasks, a million timesteps each, three seeds, chosen because it's cheap and they were searching hyperparameters for each variant. The tasks (the "-v1" versions): HalfCheetah, Hopper, Walker2d and Swimmer are legged or swimming robots rewarded for forward speed; Reacher is an arm touching a target; InvertedPendulum and InvertedDoublePendulum balance one or two poles on a cart. Policy: two hidden layers of 64 tanh units (a squashing function) giving the mean of a Gaussian (bell-curve) over actions, a separate value network, no entropy bonus.
Three families: no clipping or penalty; clipping at 0.1, 0.2, 0.3; and a KL penalty, fixed beta from 0.3 to 10 or adaptive with targets 0.003 to 0.03. They also tried clipping in log space: "no better", no number given.
Scoring: each run's average reward over its last 100 episodes, rescaled per task so random is 0 and the best result is 1, averaged over 21 runs (our reading of the words). The paper states no prediction; ours would be that no limit fails and both clip and KL rescue it.
The result. A score of 0.82 means that, averaged over tasks and seeds, epsilon 0.2 gets 82% of the way from random to the best result seen. The no-control row is minus 0.39 because of one task: on HalfCheetah it ends far below the random policy.
What it shows: controlling the step is essential. The worst controlled setting beats no control by more than one full unit, and that row is the paper's cleanest negative control. Clipping at 0.2 has the best single number, and clipping isn't very sensitive to epsilon in this range.
What it doesn't show: the margin over KL. Best clip minus best adaptive KL is 0.08, and all ten controlled settings span 0.20. No error bars, no per-task scores, three seeds, and the settings were chosen on the very runs being reported (see the tuning critique later). We can't tell whether 0.08 is more than seed noise.

---

<p class="eyebrow"><span class="paper">Schulman et al. 2017</span> · §6.2 · Fig. 3</p>

## Is PPO better than other algorithms?

<div class="rows">
<div class="points">
<div class="text">

- ahead: HalfCheetah, Walker2d, Reacher
- level: Hopper, InvertedPendulum
- InvertedDoublePendulum: first; TRPO stuck near 0
- no table, seeds or band meaning given

</div>
<div class="text">

<p class="q"><b>Q.</b> "almost all": the exception?</p>
<p class="a"><b>A.</b> Swimmer: TRPO about 120, PPO about 108</p>

</div>
</div>
<div class="fig"><img src="img/week-04-ppo-fig3.png" alt="Schulman et al. Figure 3: return against timesteps up to one million on seven MuJoCo tasks for A2C, A2C with trust region, CEM, PPO with clipping, vanilla policy gradient with adaptive stepsize, and TRPO; PPO is far ahead on HalfCheetah and Walker2d, highest on Reacher, roughly level on Hopper and InvertedPendulum, and below TRPO on Swimmer"></div>
</div>

<p class="footnote">Schulman et al. 2017 · Fig. 3, §6.2: "PPO outperforms the previous methods on almost all the continuous control environments". Values read off the plot: ours. PPO: purple. CEM: cross-entropy method. Vanilla PG: policy gradient with a KL-adjusted Adam stepsize</p>

Note:
Table 1 compared PPO's variants with each other. It says nothing about whether PPO beats what people actually used, TRPO above all. So Figure 3: the same seven MuJoCo tasks against tuned TRPO, the cross-entropy method (CEM, gradient-free), vanilla policy gradient with an adaptive stepsize, A2C (advantage actor-critic), and A2C with a trust region. Our prediction: if PPO matches TRPO's reliability, it should be at least level with TRPO everywhere.
Read the panels; PPO is purple. HalfCheetah: about 1800 against about 1000 for the next best. Walker2d: about 3000 against 1000. Reacher: highest. InvertedDoublePendulum: PPO learns first, the A2C variants catch up, and TRPO, CEM and vanilla stay near zero the whole run. Hopper and InvertedPendulum: roughly level. Swimmer: TRPO ends above PPO, about 120 against 108. That's the exception behind "almost all".
What it doesn't show, and what we can't test: there's no table behind the curves, no seed count, and we're not told what the bands are. PPO's settings were chosen on these same tasks. And we don't know which code details each implementation had.

---

<p class="eyebrow"><span class="paper">Schulman et al. 2017</span> · §6.3 · Fig. 4 · Table 4</p>

## Does it scale to a humanoid?

<div class="rows">
<div class="points">
<div class="text">

- run; Flagrun: target moves every 200 steps
- FlagrunHarder: pelted by cubes, get up
- 32 or 128 actors, up to 100M timesteps

</div>
<div class="text">

<p class="q"><b>Q.</b> Proof that clipping works here?</p>
<p class="a"><b>A.</b> No baseline; apparently 2 runs; KL-steered learning rate; $\epsilon$ not stated</p>

</div>
</div>
<div class="fig"><img src="img/week-04-ppo-fig4.png" alt="Schulman et al. Figure 4: two PPO learning curves on each of three Roboschool humanoid tasks; all rise steadily, running over 50M timesteps and the two Flagrun tasks over 100M; on Flagrun the two runs separate between about 50M and 70M"></div>
</div>

<p class="footnote">Schulman et al. 2017 · Fig. 4, §6.3, Table 4 (Adam stepsize "adjusted based on the target value of the KL divergence"; log std annealed −0.7 to −1.6; no clipping parameter listed). Roboschool: open-source simulated robots</p>

Note:
A showcase, not a comparison. Three tasks with a simulated 3D humanoid: run forward; Flagrun, where the target moves every 200 timesteps or when reached; and FlagrunHarder, where the robot is pelted by cubes and has to get up. 32 or 128 parallel actors, up to 100 million timesteps.
The curves rise steadily. Each panel shows two curves, apparently two runs; on Flagrun they separate visibly between about 50 and 70 million steps, so the run-to-run spread is unknown.
Can we conclude that clipping works on humanoids? No. There's nothing to compare against. The learning rate is steered by a KL target whose value isn't given, which mixes in the Section 4 idea. Exploration is set by a hand-made schedule. And Table 4 lists no clipping parameter, so we don't know which epsilon was used, or whether clipping was used at all.
What does the learned policy do? Figure 5 (not shown here, low resolution in the paper) gives twelve still frames of the policy learned from RoboschoolHumanoidFlagrun. In the first six the robot runs toward a target; then the target moves and it turns and runs toward the new one. A nice picture of what high-dimensional control looks like; it carries no numbers. The paper also notes concurrent work by Heess et al. that used the adaptive-KL variant to learn locomotion.

---

<p class="eyebrow"><span class="paper">Schulman et al. 2017</span> · §6.4 · Table 2 · App. B · Fig. 6, Table 6</p>

## Atari: who wins, and on what?

<div class="cols wide-fig">
<div class="text">

<table class="rules">
  <tr><td>games won</td><td class="num">A2C</td><td class="num">ACER</td><td class="num">PPO</td><td class="num">tie</td></tr>
  <tr><td>(1) over all training</td><td class="num">1</td><td class="num">18</td><td class="num">30</td><td class="num">0</td></tr>
  <tr><td>(2) last 100 episodes</td><td class="num">1</td><td class="num">28</td><td class="num">19</td><td class="num">1</td></tr>
</table>

- 49 games; (1) learning speed, (2) final score

<p class="q"><b>Q.</b> Replay is for sample efficiency. Who learns faster?</p>
<p class="a"><b>A.</b> PPO (row 1); ACER ends higher (row 2)</p>

</div>
<div class="fig"><img src="img/week-04-ppo-fig6-rows.png" alt="Schulman et al. Figure 6, three of its ten rows: fifteen Atari games with three runs each for A2C in blue, ACER in green and PPO in red; on Enduro, Freeway, Kangaroo and Montezuma's Revenge only PPO's curves rise; on Gopher and DemonAttack ACER's curves rise far above the others"></div>
</div>

<p class="footnote">Schulman et al. 2017 · §6.4, Table 2, App. B (Fig. 6 rows 4 to 6 of 10, Table 6). Atari: 49 Atari 2600 games from pixels. ACER: actor-critic with experience replay (Wang et al. 2016). Winner: average over three trials</p>

Note:
On the slide in short: 49 games, 40M frames = 10M timesteps; metric 1 is learning speed, metric 2 the final score. Only PPO learns on Enduro 758.3, Kangaroo 9928.7, Zaxxon 5008.7; ACER is far ahead on Gopher 37802.3 and DemonAttack 38808.3. Replay is for sample efficiency, so naively ACER should learn faster. It doesn't: PPO wins metric 1. And ACER ends higher, yet §1 says "similarly to ACER" and §7 "better overall performance" (ours: row 2 does not support that).
Atari is the paper's only setting with discrete actions, pixels and, by inference, a network shared between policy and value: exactly the setting the introduction said TRPO doesn't suit. Yet TRPO isn't a baseline here, so that complaint is never tested. The opponents are well-tuned A2C and ACER, which reuses old data from a replay buffer. 49 games, 10 million timesteps, three trials (winner "by averaging the scoring metric across three trials"; Tables 2 and 5). Our prediction is below.
Two metrics. Metric 1, average reward over all of training, favours fast learning: PPO wins 30 games, ACER 18. Metric 2, the last 100 episodes, favours final performance: ACER 28, PPO 19.
Here's the surprise. Experience replay is a sample-efficiency device; ACER's paper, "Sample Efficient Actor-Critic with Experience Replay", has "sample efficient" in its title. So the naive prediction is that ACER learns faster. It doesn't on metric 1; it only wins the end point. The paper doesn't explain this. Do they admit ACER ends higher? Partly. And notice the two registers: the introduction says "similarly to ACER"; the conclusion says "better overall performance", about the family of methods and with no Atari qualifier. Row 2 doesn't support it for Atari, in our reading.
Which games does each method win? The appendix has learning curves for all 49 games and a table of final scores, the same metric as Table 2's second row (last 100 episodes, 40M frames). The figure shows rows 4 to 6 of 10, with A2C blue, ACER green and PPO red. The spread across games is wide. On Enduro, Freeway, Kangaroo, Zaxxon and Montezuma's Revenge only PPO learns anything: Enduro 758.3 against zero for both others (A2C / ACER / PPO: 0.0 / 0.0 / 758.3). On Gopher and DemonAttack ACER is far ahead.
Count the best per row of Table 6 (our count) and you get ACER 27, PPO 19, A2C 1 and two ties, Pong (20.7 for both) and Venture. Table 2 says ACER 28 with one tie; the two agree only if unrounded Pong favours ACER, which the paper doesn't say. And a labelling slip: Figure 6's caption, Table 6's caption and the appendix prose all say PPO and A2C, but ACER is in the legend and the table.

---

<p class="eyebrow"><span class="paper">Schulman et al. 2017</span> · critique 1 · §7 claims vs evidence</p>

## What does PPO give up?

<div class="cols">
<div class="text">

<table class="rules">
  <tr><td>claim (where)</td><td>verdict (ours)</td></tr>
  <tr><td>"stability and reliability of trust-region methods" (§7)</td><td>trust region never measured</td></tr>
  <tr><td>"(i.e., lower bound) of the performance" (§1)</td><td>overstated: §3 bounds $L^{CPI}$</td></tr>
  <tr><td>"favorable balance ... and wall-time" (abstract)</td><td>no timing anywhere</td></tr>
  <tr><td>"better overall performance" (§7)</td><td>not on Atari final scores</td></tr>
</table>

</div>
<div class="text">

- no improvement theorem, no trust-region guarantee
- the paper disagrees with itself in places (notes)
- admissions are nearly all about variants that lost

<p class="q"><b>Q.</b> Does the lower-bound slip sink the argument?</p>
<p class="a"><b>A.</b> No: it sinks the theory reading, not the method</p>

</div>
</div>

<p class="footnote">Schulman et al. 2017 · abstract, §1, §3, §7. Our critique. Abstract: "outperforms other online policy gradient methods", defensible if ACER (replay) is not online</p>

Note:
Put the paper's claims next to its evidence. Stability and reliability of trust-region methods (§7): evidence is Table 1, Fig. 3 and the KL on one update; plausible on MuJoCo, but the trust region is never measured across training, only one update in Figure 2. Much simpler to implement (§5, §7): Algorithm 1, first-order; supported. More general, because it works with a joint policy-value network (abstract, §7): evidence is Atari, but TRPO is never run that way, so "more general than TRPO" isn't tested. A lower bound on performance (§1): Section 3 shows a bound on a surrogate only; overstated. A favourable balance of wall-time: no timing is reported anywhere. Better overall performance (§7): Table 2 row 2 has ACER 28, PPO 19, so not on Atari final scores.
So, plainly: no improvement theorem, no trust-region guarantee, and, outside Table 1, no attribution of the results to the clip rather than the rest of the code.
Is it a lower bound on performance? §1: "a pessimistic estimate (i.e., lower bound) of the performance of the policy". §3: "a lower bound ... on the unclipped objective" ("$L^{CLIP}$ is a lower bound on $L^{CPI}$" on Fig. 2). The introduction says the clipped objective forms a lower bound on the performance of the policy; Section 3 says something much weaker: it's a lower bound on the unclipped surrogate, a local approximation. Only TRPO's max-KL penalty form is a bound on true performance. Do they admit it? Implicitly; Section 3 is precise. Does it sink the argument? No. It sinks the theoretical reading, not the method. PPO should be presented as a well-motivated heuristic, not a cheaper TRPO with the same guarantee.
Where does the paper disagree with itself? The introduction calls the clipped objective a lower bound on the policy's performance; Section 3 says it bounds the unclipped surrogate. On Atari, the introduction says "similarly to ACER"; the conclusion says "better overall". Figure 6 and Table 6 captions forget ACER. Table 2 and Table 6 count ACER's wins differently, 28 against 27. Section 2.1 points to Section 6.1 for results it says aren't shown; the nearest row is the no-clip one it calls similar, so the evidence is thin rather than contradictory. The GAE equations 10 and 11 print the exponent T minus t plus 1 where it must be T minus t minus 1. Two symbols carry two meanings each: r t is ratio and reward, delta is limit and residual. And the robustness goal, "without hyperparameter tuning", sits next to different settings in every domain. Also: a misplaced parenthesis in §6.1's clipping line; Algorithm 1 indexes 1 to T while Eq. 10 says 0 to T. None changes the method; the first two change how strongly we should read the paper's claims.
What do the authors admit? There's no limitations section; the concessions are scattered (§1, §2.1, §2.2, §4, §6.1). Multi-epoch policy gradients fail, but "results are not shown". A fixed beta is "not sufficient". The adaptive rule sometimes misses its target, "these are rare" they say, and its constants, 1.5 and 2, were "chosen heuristically". The KL penalty "performed worse"; log-space clipping was "no better". Without any limit, HalfCheetah ends below random. And on Atari, PPO is "similarly to ACER". My reading: nearly every admission is about a variant that lost. The one exception is Atari, where PPO is only similar to ACER. None concerns its lack of a guarantee, the seed counts, or the code. Those are the critiques that follow.

---

<p class="eyebrow"><span class="paper">Schulman et al. 2017</span> · critique 2 · Later work · Engstrom et al. 2020 · Fig. 2</p>

## Does clipping keep a trust region?

<div class="rows">
<div class="points">
<div class="text">

- a clipped sample still moves (shared weights); the first step of each iteration is unclipped
- paper: KL measured once (Fig. 2), by construction
- Engstrom: max ratio far above $1+\epsilon$ (dashed) with the clip
- but mean KL stays small, below TRPO's 0.07

</div>
<div class="text">

<p class="q"><b>Q.</b> Do they admit it? Does it sink the argument?</p>
<p class="a"><b>A.</b> No. Partly: PPO acts like a trust region, but not by the stated mechanism</p>

</div>
</div>
<div class="fig"><img src="img/week-04-ppo-engstrom-fig2.png" alt="Engstrom et al. Figure 2, Humanoid-v2: left, mean reward against iterations for TRPO, PPO and PPO-M; middle, the maximum probability ratio climbs to between about 2.5 and 17 for all three, far above the dashed 1 plus epsilon line; right, mean KL between successive policies stays between about 0.02 and 0.065"></div>
</div>

<p class="footnote">Engstrom et al. 2020 (ICLR) · arXiv:2005.12729 · Fig. 2, §4, Humanoid-v2 (MuJoCo: a simulated 3D humanoid). PPO-M: PPO without the code-level optimizations. "all three algorithms fail to maintain a ratio-based trust region"</p>

Note:
Our critique, from Eq. (7) and Fig. 2. Clipping zeroes a sample's gradient once its ratio has moved enough. But the parameters are shared, so other samples' gradients keep moving it; nothing stops the ratio leaving the band. And the first step of every iteration is exactly the unclipped step, since all ratios start at 1. The only KL measurement in the paper is one update in Figure 2, whose peak is near-guaranteed by construction. It bounds neither the ratio nor the KL. Do they admit it? No. Does it sink the argument? Partly.
Do the ratios stay in the band? Engstrom and colleagues measured what the PPO paper didn't. On Humanoid, for agents "trained with optimal parameters", the maximum ratio climbs far above 1 plus epsilon, the dashed line (middle panel), for PPO and for PPO-Minimal, both trained directly with the clip. Yet the mean KL between successive policies (right panel) stays small, well under TRPO's bound of 0.07.
Their explanation: the first step is the unclipped step, so how far PPO moves depends on the optimiser and the learning rate, not on the objective. So PPO behaves like a trust-region method, for reasons that aren't the stated mechanism.

---

<p class="eyebrow"><span class="paper">Schulman et al. 2017</span> · critique 3 · Later work · Engstrom et al. 2020, Andrychowicz et al. 2020</p>

## Is it the clip, or the code?

<div class="rows">
<div class="points">
<div class="text">

- baselines code has 9 optimizations; the paper describes only tanh and Atari annealing
- Engstrom: code details move reward more than swapping the algorithm
- Andrychowicz: PPO loss best on 4 of 5 tasks; but PPO's value clipping hurts
- settings tuned on the reported runs; "robust" means per-domain defaults

</div>
<div class="text">

<p class="q"><b>Q.</b> Do they admit it? Does it sink the argument?</p>
<p class="a"><b>A.</b> No. It sinks crediting the clip for beating TRPO on MuJoCo; not PPO as a recipe</p>

</div>
</div>
<div class="fig"><img src="img/week-04-ppo-andrychowicz-fig1.png" alt="Andrychowicz et al. Figure 1: 95th-percentile score for six policy losses, AWR, policy gradient, PPO, RPA, V-MPO and V-trace, on Hopper, Humanoid, Walker2d, HalfCheetah and Ant; PPO's bar is the highest or close to it on every panel"></div>
</div>

<p class="footnote">Andrychowicz et al. 2020 · arXiv:2006.05990 · Fig. 1, §3; Engstrom et al. 2020 Tables 2, 3, §3. MuJoCo: robot-physics tasks; Humanoid, Walker2d, Hopper. Losses: PG, AWR, V-MPO, V-trace and RPA are alternatives to PPO's. Our critique</p>

Note:
On the slide in short, Engstrom's numbers: swapping the algorithm with the code fixed moves reward by at most 242, 99 and 224; the code details by up to 557, 423 and 444; removing the clip: −425, −142, +25.
Is it the clip, or the code? Engstrom et al. list nine details in the OpenAI baselines implementation of PPO ("Attributing Success in PPO", §3). Two are in the paper: tanh activations (§6.1), and on Atari only, learning-rate annealing (Table 5). The rest are not described: value-function clipping, reward scaling, reward and observation clipping, observation normalisation, orthogonal initialisation, gradient clipping. Their comparison is on MuJoCo, where the paper's Table 3 uses a fixed learning rate. And the paper itself links no PPO code (its one link, in a footnote, is a vanilla policy gradient implementation).
What does the code add, and what does the clip add? Engstrom et al. (Tables 2, 3, §5) ran every combination of step algorithm and code details on three MuJoCo tasks (Walker2d and Hopper, robots rewarded for forward speed; Humanoid, a 3D humanoid), at least 80 agents per estimate, 95% bootstrap intervals; reward is mean episode reward. Mean reward on Walker2d, Hopper, Humanoid:
PPO: 3292, 2513, 806. PPO-M (no code details): 2735, 2142, 674. TRPO: 2791, 2043, 586. TRPO+ (with them): 3050, 2466, 1030. PPO-NoClip (with them): 2867, 2371, 831.
Swapping the algorithm with the code fixed changes reward by at most 242, 99 and 224. Adding the code details with the algorithm fixed changes it by up to 557, 423 and 444. They print 421 for Hopper, but their own table gives 2466 minus 2043, 423 (ours). Their "average" improvements are maxima. Without the details, PPO is below TRPO on Walker2d. With them, TRPO beats PPO on Humanoid, 1030 to 806.
And the clip itself: PPO with the details but no clip, NoClip, loses 425 on Walker2d, about 13% with non-overlapping intervals, 142 on Hopper, and nothing on Humanoid, where it's 25 higher. Its settings came from a grid search, which helps it. So the clip's contribution is between nothing and about 13%, depending on the task. Do they admit it? No. Does it sink the argument? It sinks crediting PPO's advantage over TRPO on MuJoCo to the clip. It doesn't sink PPO as a practical recipe.
Which of the many choices matter? Andrychowicz and colleagues at Google built one configurable agent with more than 50 choices and trained over 250,000 agents on five MuJoCo tasks (Hopper, Walker2d, HalfCheetah, Ant, Humanoid). The PPO policy loss came out best on four of five (Fig. 1 shows the 95th percentile over sampled settings); their advice is to start the clip at 0.25, GAE lambda 0.9. Several passes over each batch are crucial, observation normalisation too. But PPO's own value clipping, in the released code, hurts. The other losses: PG, plain policy gradient; AWR, advantage-weighted regression; V-MPO and V-trace, other loss families; RPA, repeat positive advantages (their own).
There's a live disagreement worth naming. They conjecture "the PPO policy loss already enforces the trust region"; Engstrom measured that the ratio leaves the band. Both can be true if trust region means a small KL, and that comes from the whole recipe, not the clip alone.
Were the settings tuned on the test? Every family's best row in Table 1 is the maximum of three or four noisy estimates, computed on the very runs being reported, with three seeds and no error bars. That's a winner's curse: it inflates each family's best number. Then the chosen epsilon of 0.2 is reused on the same seven tasks in Figure 3, so that comparison benefits too. Do they admit it? They chose "a computationally cheap benchmark" to search; no bias noted. Does it sink the argument? It weakens "clipping beats KL", a gap of 0.08, far more than "controlling the step beats not controlling it", a gap of at least 1.01.
Robust "without hyperparameter tuning"? The stated goal (§1) is "robust (i.e., successful on a variety of problems without hyperparameter tuning)". But each domain has its own settings (Tables 3 to 5): epsilon 0.2 fixed on MuJoCo; on Atari, 0.1 times a schedule that anneals to zero, along with the learning rate; on Roboschool, a KL-steered learning rate, a hand-set exploration schedule and no epsilon listed in Table 4; and between 3 and 15 epochs. Do they admit it? No. Does it sink the argument? No. But "robust" should be read as "works with sensible per-domain defaults", not one setting everywhere.
What would convince us the clip is the mechanism? Our proposal, the cheapest decisive experiment. One: fix every code-level detail. Two: change only the policy loss: clip, nothing, KL penalty. Three: choose hyperparameters on held-out tasks, not the evaluation tasks. Four: many seeds with intervals. Five: log the ratio range and the KL across all of training, not one update. Has it been done? Nearly: Engstrom et al. ran close to this, at least 80 agents per number. Their answer: the recipe works; removing the clip with the details on costs between nothing and about 13%; and without the details, PPO against TRPO ranges from 56 worse to 99 better (PPO-M minus TRPO: −56, +99, +88, Tables 2 and 3). So the clip's specific contribution is small and depends on the task.

---

<p class="eyebrow"><span class="paper">Schulman et al. 2017</span> · Later work · Ouyang et al. 2022</p>

## What changes when the policy is a language model?

<div class="cols wide-fig">
<div class="text">

- RLHF: SFT ▸ reward model ▸ PPO
- per-token reward: KL term; RM score at the end
- 6B critic from the RM; $\beta$ 0.02, clip 0.2, 1 epoch, no discount
- 256k episodes, about 31k prompts

<div class="eq">$$\max\ \mathbb{E}\Big[r_\theta(x,y) - \beta\log\frac{\pi^{\rm RL}(y \mid x)}{\pi^{\rm SFT}(y \mid x)}\Big]$$</div>

<p class="q"><b>Q.</b> Two KLs: which is which?</p>
<p class="a"><b>A.</b> PPO's is to $\pi_{\theta_{\rm old}}$, one iteration ago: a step size. RLHF's is to the frozen $\pi^{\rm SFT}$: a leash on drift</p>

</div>
<div class="fig"><img src="img/week-04-ppo-instructgpt-fig2.png" alt="InstructGPT Figure 2: three steps; collect demonstrations and fine-tune GPT-3 with supervised learning; collect rankings of several outputs and train a reward model; sample a new prompt, generate an output with the policy, score it with the reward model and update the policy with PPO"></div>
</div>

<p class="footnote">Ouyang et al. 2022 · arXiv:2203.02155 · Fig. 2, Eq. 2 (pretraining term dropped), App. C. RLHF: reinforcement learning from human feedback. SFT: supervised fine-tuning. RM: reward model. $r_\theta$ is the RM here, not a ratio</p>

Note:
What happens when the policy is a large language model? InstructGPT's recipe, RLHF: supervised fine-tuning on human demonstrations, a reward model trained on human rankings, then PPO against that reward model. The environment is a bandit: a prompt, a response, a reward, done. Inside, PPO runs per token: each token's reward is a KL term to the supervised model, plus the reward model's score at the last token, and GAE with no discount spreads the score back.
The settings: beta 0.02, clip 0.2, a single inner epoch, no discount, 256 thousand episodes over about 31 thousand prompts, and a 6-billion-parameter value network started from the reward model, for policies of every size.
The machinery carries over almost unchanged, but the costs grow: the critic is itself a 6B language model, trained to predict a reward that appears only at the last token. That's what the next reading targets. For scale, InstructGPT reports 60 petaflop/s-days for its 175B PPO run with pretraining mix, against 3,640 for pretraining GPT-3.
Two KLs: which is which? The point students most often confuse. PPO's own KL, and its clip, are to the policy one iteration ago: a step-size control. The RLHF KL is to the frozen supervised model: a leash on total drift, so the model stays close to fluent text and doesn't exploit the reward model's blind spots. Ouyang et al.: "a per-token KL penalty from the SFT model at each token to mitigate over-optimization of the reward model"; best beta "around 0.01 and 0.02".
Worked numbers (ours, beta 0.02). A token the policy raised to 0.6 from the reference's 0.5 costs 0.02 times log 1.2, 0.0036. But a token it lowered to 0.4 gets a per-token reward of plus 0.0045: a bonus. So can the per-token "penalty" be negative? Yes; only its expectation is a KL, never negative. And with one epoch of eight minibatches, where can the clip bind? Not on the first minibatch (ratio 1); at most the other seven. How much it binds in RLHF is not measured in anything we read.

---

<p class="eyebrow"><span class="paper">Schulman et al. 2017</span> · Summary · §6 with Engstrom et al. 2020</p>

## What do the experiments establish?

<div class="cols">
<div class="text">

<table class="rules">
  <tr><td>level</td><td>claim</td><td>evidence</td></tr>
  <tr><td>with a control</td><td>multi-epoch updates need step control</td><td>Table 1: −0.39 vs 0.62 to 0.82</td></tr>
  <tr><td>no uncertainty</td><td>clip slightly above KL</td><td>0.82 vs 0.74, 3 seeds, tuned on test</td></tr>
  <tr><td>whole algorithms</td><td>fast and competitive</td><td>Fig. 3, Table 2</td></tr>
  <tr><td>not established</td><td>trust region, guarantee, wall-time, clip as cause</td><td>later work: clip's share is small</td></tr>
</table>

</div>
<div class="text">

- a real negative control: no clip ▸ −0.39
- keeps the losing KL baseline, fully swept
- one loss, three domains; Fig. 2 a clever diagnostic
- a few lines of code: one reason it spread

<p class="q"><b>Q.</b> Most and least convincing?</p>
<p class="a"><b>A.</b> Most: Table 1, remove the clip and it fails (one task). Least: clip vs KL, 0.08, three seeds</p>

</div>
</div>

<p class="footnote">Our summary and assessment of Schulman et al. 2017 · Table 1, §4, §6, Fig. 2; Engstrom et al. 2020</p>

Note:
Sort the claims by how much evidence stands behind them. With a control: multi-epoch updates without step control fail, and clipping or a KL penalty fixes it. Observed but without uncertainty: clipping scores a little above the best KL setting, on three seeds tuned on the same runs. Whole-algorithm comparisons: PPO learns fast and competes on MuJoCo and Atari, but those can't separate the loss from the code (loss and code not separated). Not established by the paper: a trust region across training, any improvement guarantee, wall-time, or that the clip is what makes PPO work; later work says its share is small.
Why is this a strong paper? It would be easy to read the last few slides as a takedown. They aren't. The paper has a real negative control: the same algorithm with the clip removed fails below random. It keeps the losing method, the KL penalty, as a fully swept baseline. One core loss, with per-domain settings, works across continuous robots, a 3D humanoid and pixel games. Figure 2, a line search through parameter space with four objectives on one axis, shows in one picture why the min matters. And it's a few lines of code on a standard policy gradient, first-order only, which is surely one reason it was adopted so widely, including for language models.

---

<p class="eyebrow"><span class="paper">Schulman et al. 2017</span> · Next reading</p>

## What will the next reading change?

<div class="cols">
<div class="text">

- keeps PPO's clipped ratio
- drops the value network (the critic)
- gets the baseline from a group of responses instead

</div>
<div class="text">

<p class="q"><b>Q.</b> Why look at the critic?</p>
<p class="a"><b>A.</b> In RLHF it is a 6B model that must predict a reward given only at the last token</p>

</div>
</div>

<p class="footnote">Forward pointer only; the comparison table comes with the GRPO reading (Shao et al. 2024). Critic size: Ouyang et al. 2022, App. C</p>

Note:
A one-line preview of the next reading. It keeps PPO's clipped ratio and removes the value network, getting the baseline from a group of sampled responses instead. We looked at the cost on the InstructGPT slide: the critic is as large as the policy. The side-by-side comparison belongs with that reading.

---

<p class="eyebrow"><span class="paper">Schulman et al. 2017</span> · Summary</p>

## What to keep from PPO

<div class="cols">
<div class="text">

- policy gradient: likelihood × advantage; baselines tame it
- reusing a batch is the danger; the ratio only works nearby
- the clip caps improvement, never worsening: the min
- a strong recipe, not a proven mechanism

</div>
<div class="text">

<p class="q"><b>Open question</b></p>
<p class="a">If the clip doesn't keep updates small and the critic is the costliest part, how much of PPO does a language model need?</p>

</div>
</div>

<p class="footnote">Schulman et al. 2017. Next reading: GRPO</p>

Note:
Four ideas. First, the policy gradient is maximum likelihood on your own samples weighted by advantage, and the baseline is what makes it usable: it keeps the gradient unbiased and can remove most of its variance. Second, reusing a batch is where the danger is: the importance ratio lets you evaluate a new policy on old data, but only nearby, and PPO is a cheap way to stay nearby. Third, the clip is asymmetric on purpose, and the min makes it safe: it caps the reward for moving further in a sample's favoured direction and never hides a move that made things worse. Fourth, the evidence supports PPO as a strong recipe, not a mechanism: the experiments can't separate the clip from the code, and later work says the code mattered as much or more.
And the question to carry into GRPO: if the clip isn't what keeps updates small, and the value network is the most expensive part, how much of PPO does a language model actually need?




---

<!-- .slide: class="cover divider" -->

<p class="kicker">Reading 4 of 4</p>
<h1>Shao et al. 2024</h1>
<p class="subtitle">DeepSeekMath: Pushing the Limits of Mathematical Reasoning in Open Language Models</p>
<p class="question">Can you keep PPO's baseline without paying for a second model?</p>
<ol class="track"><li class="done">GPT-3 2020<span>few-shot learners</span></li><li class="done">Raschka 2025<span>architectures</span></li><li class="done">PPO 2017<span>policy optimization</span></li><li class="now">GRPO 2024<span>DeepSeekMath</span></li></ol>

Note:
Reading 4 of 4. Shao and ten co-authors at DeepSeek-AI, Tsinghua and Peking University, 2024. It picks up exactly where PPO left off. PPO for language models trains a second network, the value model, about the size of the policy, only to predict how good a half-written answer will turn out. This paper asks whether you can keep the benefit of that baseline without the second model. Their answer is GRPO, Group Relative Policy Optimization: sample a group of answers to the same question and judge each one against its siblings.
The historical twist: GRPO is one subsection of a paper whose other half is about data. The next year, the same company used it to train DeepSeek-R1, and it was widely adopted for reasoning models. The famous part of this paper is the small part.

---

<p class="eyebrow"><span class="paper">Shao et al. 2024</span> · Abstract · Fig. 1</p>

## What did a 7B open model reach, and how?

<div class="cols wide-fig">
<div class="text">

- Base: 500B tokens, 56% new math corpus
- Instruct: 776K worked solutions
- RL: GRPO on about 144K questions
- MATH: 36.2% ▸ 46.8% ▸ 51.7%

<p class="q"><b>Q.</b> Are the three numbers comparable?</p>
<p class="a"><b>A.</b> Not quite: Base is few-shot (Table 2); the other two are Table 5 chain-of-thought runs, prompting not stated</p>

</div>
<div class="fig"><img src="img/week-04-grpo-fig1.png" alt="Figure 1 of the paper: MATH top-1 accuracy of open models against release date, from LLaMA1-65B at about 10.6% in early 2023 up to Qwen-72B at about 35.2%, then a red star for DeepSeekMath-7B at about 51.7% in January 2024, just under dashed lines for Gemini-Ultra and GPT-4 API and above a GPT-4 early version line"></div>
</div>

<p class="footnote">Shao et al. 2024 · arXiv:2402.03300 · Abstract; Tables 2, 5; Fig. 1. SFT: supervised fine-tuning; RL: reinforcement learning; GRPO: Group Relative Policy Optimization. <b>MATH</b>: competition math problems; top-1: one answer, no tools, no voting</p>

Note:
The model is built in three stages, and each has its number. DeepSeekMath-Base 7B is DeepSeek-Coder-Base-v1.5 7B trained on another 500B tokens, 56% from a new math corpus mined from Common Crawl: 36.2% on MATH, few-shot. Supervised fine-tuning (SFT) on 776K worked solutions gives DeepSeekMath-Instruct: 46.8%. Reinforcement learning (RL) with GRPO on about 144K questions gives DeepSeekMath-RL: 51.7%, close to GPT-4 and Gemini Ultra at the time. Self-consistency over 64 samples reaches 60.9%.
The abstract names exactly two factors: "a meticulously engineered data selection pipeline" and GRPO. Keep the first step honest: 36.2 is a few-shot evaluation of a base model; the other two are instruction-following models in Table 5, whose prompting the paper does not state. So 36.2 to 46.8 crosses two set-ups. Figure 1 is the paper's leaderboard over time; use it as motivation, not data: its Mistral and Llemma values don't match the tables, and its settings are not stated.
The paper has two halves, and we take them in order. The data half comes first: how the corpus was mined and checked, whether it beats others, and what Base and Instruct add. Then the RL half, which is the spine of this week.

---

<p class="eyebrow"><span class="paper">Shao et al. 2024</span> · §2.1, §2.2 · Fig. 2</p>

## How do you find 120B tokens of math on the web?

<div class="rows">
<div class="points">
<div class="text">

- fastText classifier, seeded with OpenWebMath, recalls pages from 40B deduplicated
- domains with over 10% collected
- humans label math URL paths ▸ new seeds
- stop after 4 rounds: 35.5M pages, 120B tokens

</div>
<div class="text">

<p class="q"><b>Q.</b> Better corpus, or just a bigger one?</p>
<p class="a"><b>A.</b> Better per token: at 1.3B and 150B tokens, MATH 13.6% vs Proof-Pile-2 11.2%, and ahead already at 50B tokens</p>

</div>
</div>
<div class="fig"><img src="img/week-04-grpo-fig2.png" alt="Figure 2 of the paper: a loop. Math Seed, then 1. Train a FastText Model, 2. Recall Math-Related Webpages From Common Crawl, giving the Math Corpus, 3. Discover Math-Related Domains, 4. Annotate Math-Related URL Path From Labelers, back to the seed. Centre: Deduplicated Common Crawl, 40B HTML pages"></div>
</div>

<p class="footnote">Shao et al. 2024 · §2.1, §2.2, Fig. 2, Table 1. fastText: a fast linear classifier over word n-grams. OpenWebMath: an earlier 13.6B-token math web corpus. Proof-Pile-2: an open math corpus (arXiv, web, code)</p>

Note:
In 2023 open math corpora were small: OpenWebMath had 13.6B tokens, MathPile 8.9B, mostly arXiv. The bet is that much more math sits in Common Crawl, mixed in with everything else. Figure 2 is the loop that finds it.
Box 1: train a fastText classifier on 500,000 OpenWebMath pages against 500,000 random Common Crawl pages. fastText is crude but fast enough to score 40B pages. Box 2: score the deduplicated crawl and keep the top; in iteration 1, the top 40B tokens. Box 3: group the crawl by domain, and call a domain math-related if more than 10% of its pages were collected, mathoverflow.net for example. Box 4: humans label which URL paths in those domains hold math; missed pages under them become new positives. Retrain and go round again. The clever part: humans label URL patterns, not pages.
When do you stop? The first classifier only knows the kind of math in its seed; in their words, many pages stay uncollected because the positives lack diversity. After four iterations they have 35.5M pages and 120B tokens, and they stop because nearly 98% of the data had already been collected in the third iteration: the loop had converged for this classifier.
What slips through? A web corpus will contain benchmark questions, because people post them. They remove any text segment with a 10-gram that exactly matches GSM8K, MATH, CMATH or AGIEval (benchmark texts under 10 grams but at least 3: exact match). GSM8K is grade-school math word problems; CMATH is Chinese elementary-school math word problems; AGIEval is exam questions, including China's college-entrance Gaokao. An exact 10-gram filter catches copies, not paraphrases, translations or reworded solutions (ours), and the paper doesn't measure what it misses. Nor is any step of the pipeline ablated, so which step mattered most is unknown: we see only the final corpus.
Better corpus, or just a bigger one? Fair comparison: the same 1.3B model trained for 150B tokens on each corpus (Table 1, Fig. 3). The corpus is 120.2B tokens against Proof-Pile-2's 51.9B. The DeepSeekMath Corpus wins every column, MATH 13.6% against Proof-Pile-2's 11.2%, and MathPile, over 85% arXiv, is no better than no math training at all. In Figure 3 (not shown) the new corpus is clearly on top on GSM8K, MATH and CMATH; on BBH, 23 hard multi-step reasoning tasks, the lines are tangled until about 95B tokens. Every curve except MathPile's steps up at 120B tokens, with a smaller step at 135B: that is 80% and 90% of training, the two learning-rate drops (ours), not the data.
The confound is repetition. In 150B tokens MathPile is seen 16.85 times, the new corpus 1.25 times, and even Proof-Pile-2's web part, under its 2:4:1 arXiv, web, code mix, 6.3 times (passes: ours). Bigger could beat better. The authors see it, and point out that at 50B tokens, "1 full epoch of Proof-Pile-2", the new corpus is already ahead. Under the mix that epoch is loose (ours), and it is one noisy run per corpus, but it supports higher quality per token.

---

<p class="eyebrow"><span class="paper">Shao et al. 2024</span> · §2.3, §3 · Tables 2, 4, 5</p>

## Does a 7B model really match Minerva 540B?

<div class="cols">
<div class="text">

<table class="rules">
  <tr><td>model</td><td class="num">GSM8K</td><td class="num">MATH</td><td class="num">OCW</td><td class="num">MMLU-STEM</td></tr>
  <tr><td>Minerva 540B</td><td class="num">58.8</td><td class="num">33.6</td><td class="num">17.6</td><td class="num">63.9</td></tr>
  <tr><td>Llemma 34B</td><td class="num">54.0</td><td class="num">25.3</td><td class="num">10.3</td><td class="num">52.9</td></tr>
  <tr class="total"><td>Base 7B</td><td class="num">64.2</td><td class="num">36.2</td><td class="num">15.4</td><td class="num">56.5</td></tr>
</table>

</div>
<div class="text">

- start: a code model; mix 56% corpus, 20% code, 10% arXiv
- "outperforming" (§1) vs "comparable" (§1.1)
- math training kept general ability: BBH +4.3 over final Coder (ours), but code falls
- Instruct: 776K examples, MATH 46.8%

<p class="q"><b>Q.</b> Which wording does the table support?</p>
<p class="a"><b>A.</b> "Comparable": behind on OCW, MMLU-STEM</p>

</div>
</div>

<p class="footnote">Shao et al. 2024 · Table 2 (few-shot chain of thought, %). <b>GSM8K</b>: grade-school word problems. <b>Minerva</b>: Google's math model. <b>Llemma</b>: open math Code Llama. <b>OCW</b>: MIT course problems. <b>MMLU-STEM</b>: STEM part of a 57-subject exam. <b>BBH</b>: hard reasoning tasks</p>

Note:
The real base model starts from a code model, DeepSeek-Coder-Base-v1.5 7B, and trains 500B more tokens: 56% the new corpus, 4% math code, 10% arXiv, 20% GitHub code, 10% web text. None of the shares is ablated; the 20% code has a reason we'll see in the code experiments. In the table the bold row is the paper's, though Minerva leads two columns.
Table 2: Base 7B beats every open base model, and on MATH beats Llemma 34B by 10.9 points and Minerva 540B, a model 77 times larger. But look at OCW and MMLU-STEM: Minerva is ahead there. The introduction says "outperforming Minerva 540B" in one place and "comparable performance" in another; the table supports the second. Even so, a 7B model matching 540B on math says a lot about data relative to parameters. Table 3, not shown: with Python tools Base reaches 66.9% on GSM8K and 31.4% on MATH.
Did math training cost general ability? Table 4, in %: Coder dagger (the checkpoint before its learning-rate decay, where math training started) MMLU 42.9, BBH 42.9, HumanEval 40.2, MBPP 52.6. Coder final: 49.1, 55.2, 43.2, 60.4. DeepSeekMath-Base: 54.9, 59.5, 40.9, 52.6. MMLU is a 57-subject multiple-choice exam; HumanEval and MBPP are Python problems checked by unit tests. Against the dagger checkpoint, MMLU rises 12.0 and BBH 16.6. But the step from dagger to the final Coder is nothing except the decay, and it alone is worth MMLU +6.2 and BBH +12.3. Math training ends with a decay too. So the fair comparison is with the final Coder: MMLU +5.8, BBH +4.3, still gains (differences ours). Code falls against the final model: HumanEval 43.2 to 40.9, minus 2.3, and MBPP 60.4 to 52.6, minus 7.8. The paper's "effectively maintains" is true against dagger, less true against the final model. And MMLU and BBH contain math-like items, so a gain there need not mean general reasoning improved (our caution).
What does instruction tuning add? A base model continues text; RL needs a policy that already answers in a consistent format and is right often enough that some samples earn reward. So: 776K examples in English and Chinese, in three formats, chain of thought, program of thought, and tool-integrated text with code that is run. A short run, 500 steps at batch 256, learning rate 5e-5. Instruct scores 82.9% on GSM8K and 46.8% on MATH, beating every open model's 37.7% on MATH but still under GPT-4's 52.9%; over Base, 36.2 to 46.8, with differing set-ups.
Two claims in the introduction don't match Table 5 (our checks). "Beats all 7B counterparts": on GSM8K, Math-Shepherd-Mistral 84.1 and WizardMath-v1.1 83.2, both 7B, are ahead of Instruct's 82.9. Both were trained with PPO (proximal policy optimization); they are the only PPO numbers in the paper. Math-Shepherd is step-level math labels, built by checking whether a step can reach the right answer. And "over 50% on MATH for the first time" is true only for the RL model with chain of thought: with tools, three open models already were, InternLM2-Math 20B 54.3, DeepSeek-LLM-Chat 67B 51.1, ToRA 34B 50.8. Remember Instruct's numbers, 82.9 and 46.8: they are RL's starting point.

---

<p class="eyebrow"><span class="paper">Shao et al. 2024</span> · §4.1.1 · Fig. 4 · the critic's cost</p>

## Why drop PPO's critic?

<div class="rows">
<div class="points">
<div class="text">

- PPO: 4 models, 2 trained; value model "comparable size" to the policy
- reward arrives at the last token: it reaches token 5 of 500 with weight $9 \times 10^{-12}$ (ours)
- GRPO: $G$ answers per question, baseline their mean reward
- 3 models, 1 trained

</div>
<div class="text">

<p class="q"><b>Q.</b> How much memory does the critic cost?</p>
<p class="a"><b>A.</b> At 7B, about 252 GB ▸ 140 GB (ours)</p>

</div>
</div>
<div class="fig"><img src="img/week-04-grpo-fig4.png" alt="Figure 4 of the paper. Top, PPO: the policy model writes output o; a frozen reference model and a frozen reward model give a KL-penalised reward r; a trained value model gives v; GAE turns r and v into the advantage A. Bottom, GRPO: the policy writes o1 to oG; the frozen reward model scores them r1 to rG; a group computation gives A1 to AG; the KL to the reference model goes straight to the policy"></div>
</div>

<p class="footnote">Shao et al. 2024 · §4.1.1, Fig. 4 (yellow: trained, blue: frozen; the paper's $r$ is our $R$, a reward). $G$: group size. GAE: generalised advantage estimation; $\lambda$: its credit decay. Memory is ours: 16 bytes per trained parameter, 2 per frozen one</p>

Note:
No re-teaching of PPO; just the diff. Top row: PPO as used for language models, four models. The policy and the value model are trained; the reward model and the frozen reference model are not. The advantage comes from GAE, which needs the value model's prediction at every token. The KL to the reference sits inside the reward, token by token, following InstructGPT. Careful: that KL anchors to the frozen starting model, not to the previous policy as in the PPO paper's penalty variant. Same letter beta, different job.
The paper's two arguments against the value model: it is "typically another model of comparable size as the policy model", a "substantial memory and computational burden"; and "usually only the last token is assigned a reward score", which makes a per-token value hard to train. Bottom row, GRPO: sample a group of G answers, score them, and let the group's own mean be the baseline. Three models, one trained. The caption's "significantly reducing training resources" is never measured.
The paper never puts a number on the burden, so here is our accounting, in GB, for a 7B model. Training a model with mixed-precision Adam costs about 16 bytes per parameter: weights, gradients, optimiser state. A frozen model needs only its 16-bit (bf16) weights, 2 bytes. PPO: policy trained 112, value trained 112, reward plus reference frozen 28, total 252. GRPO: policy 112, no value model, frozen 28, total 140 (assuming the same 7B reward model): 44% less, before activations and the generation cache.
The second argument is the deeper one. Recall GAE: the advantage is a discounted sum of surprises, discounted by lambda, with gamma equal to 1. The reward arrives at the last token. For token 5 of a 500-token answer, with the common lambda of 0.95, the reward reaches its advantage with weight 0.95 to the 495th, about 9 times 10 to the minus 12. Effectively zero. Everything token 5 learns about the final score comes through the value model's guess from a half-written solution. At lambda equal to 1 the weight is 1 and the reward reaches every token: final reward plus later KL penalties, minus the value of the state, so the value model is just a baseline. Keep this for DeepSeek-R1's PPO comparison later.

---

<p class="eyebrow"><span class="paper">Shao et al. 2024</span> · §4.1.1, §4.1.2 · Steps 1 and 2</p>

## Why can a group replace the critic?

<div class="cols">
<div class="text">

<div class="eq">$$\mathbb E\big[b\thinspace \nabla\log\pi_\theta(o)\big] = b\thinspace \nabla\textstyle\sum_o \pi_\theta(o) = b\thinspace \nabla 1 = 0$$</div>

- any baseline $b$ that ignores the sampled answer is free
- PPO learns $b$; GRPO: $b$ = group mean
- every token gets the answer's $R - b$: REINFORCE, not a shortcut
- the mean includes answer $i$: only a factor $(G-1)/G$ = 0.984 at $G$ = 64

</div>
<div class="text">

<p class="q"><b>Q.</b> 17 × 19, four answers: 323, 323, 323, 326, rewards $(1,1,1,0)$. What does the mean 0.75 change?</p>
<p class="a"><b>A.</b> Weights $(1,1,1,0)$ become $(0.25, 0.25, 0.25, -0.75)$: the wrong answer is pushed down, not ignored</p>

</div>
</div>

<p class="footnote">Derivation and worked group: ours, from Shao et al. 2024 §4.1.1, §4.1.2, Eq. 3. $R$: an answer's reward; $b$: baseline; $G$: group size. REINFORCE: Williams 1992, the plain policy gradient</p>

Note:
Why can you replace the value model at all? Because it is only a baseline. Start from the plain policy gradient from the PPO section, known as REINFORCE: the gradient of the objective is the expectation over sampled answers of (R of o minus b) times the gradient of log pi of o; that is, push up the log-probability of each sampled answer in proportion to its reward. You may subtract any baseline b that doesn't depend on the sampled answer. The proof is the equation on the slide: the expectation of b times the gradient of log pi is b times the gradient of the sum of the probabilities, which is the gradient of 1, which is zero.
So the baseline is free in expectation, and it changes what each answer gets. Take 0/1 rewards and a group with three right, one wrong: four tries at 17 × 19, answering 323, 323, 323 and 326. No baseline: weights 1, 1, 1, 0, and the wrong answer is simply ignored. That is rejection sampling fine-tuning (RFT: fine-tune on your own correct answers), and its online version, which we meet again in the unified view. Subtract the group mean of 0.75 and the wrong answer gets minus 0.75: it is pushed down. PPO learns the baseline with a network; GRPO estimates it by sampling.
Step two goes from whole answers to tokens. An answer's probability is the product of its token probabilities, so its log is a sum, and so is its gradient: the gradient of log pi of o is the sum over t of the gradient of log pi of o_t given the question and the earlier tokens. Substitute into the policy gradient: every token of the answer is weighted by the same number, the answer's reward minus the baseline. So giving every token one advantage, which GRPO calls outcome supervision, is not a cheap approximation. It is exactly REINFORCE with a baseline.
GRPO's loss then carries two weights REINFORCE doesn't have: it divides each answer's gradient by its length, so a token in a long answer counts less (the paper's own PPO objective, Eq. 1, already has this length average); and it divides by the group's standard deviation. One more check: the group mean includes answer i's own reward. Write it out and that only rescales the true gradient by G minus 1 over G, 0.984 at G equals 64. So the mean is not the real worry. The std division is the real departure, because the std depends on answer i itself. Both weights come back under later work (Dr. GRPO). Hold on to both.

---

<p class="eyebrow"><span class="paper">Shao et al. 2024</span> · §4.1.1 · Eq. 3</p>

## What does GRPO change in PPO's objective?

<div class="eq">$$\mathcal J_{\rm GRPO} = \mathbb E\Big[\frac1G\sum_{i=1}^G\frac{1}{\lvert o_i\rvert}\sum_{t=1}^{\lvert o_i\rvert}\Big(\min\big[r_{i,t}\hat A_{i,t},\ \mathrm{clip}(r_{i,t}, 1-\epsilon, 1+\epsilon)\hat A_{i,t}\big] - \beta\thinspace \mathbb D_{\rm KL}[\pi_\theta \Vert \pi_{\rm ref}]\Big)\Big]$$</div>

<div class="rows">
<div class="points">
<div class="text">

1. clipped term: PPO's, unchanged
2. average over $G$ answers (the token average is already in PPO's Eq. 1)

</div>
<div class="text">

<ol start="3">
<li>$\hat A_{i,t}$ from the group, no GAE</li>
<li>KL to $\pi_{\rm ref}$: out of the reward, into the loss</li>
</ol>

</div>
</div>
</div>

<p class="q"><b>Q.</b> The clip and the KL both keep the model close. Close to what?</p>
<p class="a"><b>A.</b> Clip: the policy that sampled this batch. KL: the frozen reference, for the whole run</p>

<p class="footnote">Shao et al. 2024 · Eq. 1, Eq. 3. $r_{i,t}$: ratio of $\pi_\theta$ to the sampling policy for token $t$ of answer $i$; $\hat A_{i,t}$: its advantage; $\pi_{\rm ref}$: frozen reference model; $\beta$: KL weight; $\epsilon$: clip width</p>

Note:
Read Eq. 3 as a diff of PPO's clipped objective. One: the min and clip are exactly PPO's, now indexed by answer and token. Two: an average over G answers to the same question. That is the new part; the average over each answer's own tokens is already in the paper's PPO objective, Eq. 1, so it is not new here, though it comes back as a length bias later. Three: the advantage comes from the group's rewards, not from GAE and a value model. Four: the KL penalty to the reference model leaves the reward and enters the loss. The paper's reason (§4.1.1) is that this avoids "complicating the calculation of" the advantage; our reading is that the advantage is one number per answer, and a per-token penalty inside it would break that.
Same letters as the PPO section. The ratio is r, now indexed by answer i and token t; the reward is capital R. The paper writes rewards with lowercase r and never names the ratio, so its equations look different from ours; the content is the same. Other new symbols: G is the group size, 64 in the paper; u, introduced with the KL estimator, is the reference model's probability of the sampled token divided by the policy's.
The authors add a nice argument for groups: reward models are trained on comparisons between answers to the same question, so they are better at saying which of two siblings is better than at absolute scores across questions. GRPO only ever compares siblings.
Two leashes, as in the PPO section. The clip compares the current model with the one that sampled this batch, so it limits each update. The KL compares it with a frozen reference, the supervised model, so it limits total drift over the whole run. GRPO keeps both; only the KL moves, from the reward into the loss.

---

<p class="eyebrow"><span class="paper">Shao et al. 2024</span> · §4.1.2 · outcome supervision · the std (ours)</p>

## How does a group grade its own answers?

<div class="cols wide-fig">
<div class="text">

<div class="eq">$$\hat A_{i,t} = \frac{R_i - \mathrm{mean}(R_1..R_G)}{\mathrm{std}(R_1..R_G)}$$</div>

- a z-score within each question, same number on every token of answer $i$
- rare right answer: big push
- the std rescales: 1 right of 64 ×8.06, 32 right ×2
- Dr. GRPO drops the std and the length average

<p class="q"><b>Q.</b> All 64 answers equal?</p>
<p class="a"><b>A.</b> std = 0, so $0/0$: not handled</p>

</div>
<div class="fig"><img src="img/week-04-grpo-adv.svg" alt="Illustration: two groups of four answers with 0/1 rewards. Hard question, one right: the right answer gets +1.73, each wrong one -0.58. Easy question, three right: each right answer +0.58, the wrong one -1.73"></div>
</div>

<p class="footnote">Shao et al. 2024 · §4.1.2. Illustration and std costs: ours, 0/1 rewards, population std (the paper doesn't say which). Std: standard deviation. Dr. GRPO: Liu et al. 2025, arXiv:2503.20783</p>

Note:
Now the formula. A reward model scores each of the G answers. Subtract the group mean, so the advantages sum to zero; divide by the group's standard deviation, so every group's advantages have spread 1; and give that number to every token of the answer. It is a z-score within each question: for a network-science audience, standardisation within strata, each question its own stratum. The paper's rewards come from a reward model, so they are graded.
A worked group with 0/1 rewards. Hard question, one of four right: mean 0.25, std 0.433, so the right answer gets plus 1.73 and each wrong one minus 0.58. Easy question, three right: the signs flip, plus 0.58 each and minus 1.73 for the one wrong answer. Do the advantages sum to zero? Yes: 1.732 minus 3 times 0.577 is about 0, exactly the square root of 3 minus 3 over the square root of 3. A rare right answer on a hard question gets a big push; common outcomes get a nudge. With graded scores, say 0.9, 0.2, 0.4, 0.7, the advantages are plus 1.30, minus 1.30, minus 0.56, plus 0.56: both above-average answers are pushed up, the better one more. The sample std instead of the population std gives +1.5 and -0.5 on the hard question.
What does dividing by the std cost? The paper gives no reason for the std and doesn't discuss its costs. It is attractive because the advantage then ignores the reward model's scale, and every group ends with the same sum of squared advantages, equal to G. But it has two costs (ours). First, questions are reweighted by difficulty. With 64 answers and one right, the std is 0.124, so the centred rewards are multiplied by 8.06; with half right (32), the std is 0.5, by 2. Take a question's weight as the sum of the absolute advantages. Compared with the plain policy gradient, which only centres, the half-right question carried 16 times the hard question's total weight (32 against 1.97); after the std it carries 4 times (64 against 15.9). The std boosts the near-impossible question four times more. Second, noise is amplified: four near-identical reward-model scores, 0.80, 0.81, 0.80, 0.81, get a std of 0.005, a factor 200, and advantages of minus 1 and plus 1, as if one answer were right. And if all answers get the same reward the formula is zero over zero, which the paper doesn't discuss. Which std, population or sample? Not stated either.
Later work (Liu et al. 2025, "Understanding R1-Zero-Like Training", §3) found "an optimization bias in GRPO, which artificially increases response length (especially for incorrect outputs)". It comes from exactly the two extras: the length average and the std. The length average spreads a wrong answer's negative advantage over its tokens, so a 1,000-token wrong answer is pushed down ten times less per token than a 100-token one (minus 0.01 against minus 0.001 per token in our toy): if you are going to be wrong, be long. The std gives larger weight to questions the model almost always or almost never solves, our 16-fold to 4-fold. Their fix, Dr. GRPO, removes both, which recovers PPO's objective with a Monte Carlo return and an unbiased baseline. What does training then do to length? GRPO keeps growing wrong answers; Dr. GRPO mostly stops it. The length growth many read as reasoning "emerging" under GRPO may be, at least in part, an artefact of the loss (their word: confounded). In their ablation on Qwen2.5-1.5B, removing either term beats vanilla GRPO. They assume beta equal to 0 with rule-based rewards, unlike DeepSeekMath's 0.04. Verdict: the group baseline kept, both normalisations revised.

---

<p class="eyebrow"><span class="paper">Shao et al. 2024</span> · §4.1.1 · Eq. 4 · App. A.1.6 · Tang &amp; Munos 2025</p>

## What estimator does GRPO use for the KL, and why is it fine?

<div class="cols wide-fig">
<div class="text">

<div class="eq">$$k_3 = u - \log u - 1,\qquad u = \pi_{\rm ref}/\pi_\theta$$</div>

- PPO: $k_1 = -\log u$ in the reward; GRPO: $k_3$ in the loss
- same mean; $k_3$ never negative
- as a loss, only $k_3$ pulls toward $\pi_{\rm ref}$

<p class="q"><b>Q.</b> Does it anchor what it says?</p>
<p class="a"><b>A.</b> Roughly; little difference found at small $\beta$</p>

</div>
<div class="fig"><img src="img/week-04-grpo-kl-est.svg" alt="Illustration: per-token KL estimates against u on a log axis. k3 = u - log u - 1 is a curve touching zero at u = 1 and positive elsewhere; k1 = -log u is a falling line that goes negative above u = 1. Dots at u = 0.625 (k1 +0.470, k3 +0.095) and u = 2.5 (k1 -0.916, k3 +0.584)"></div>
</div>

<p class="footnote">Shao et al. 2024 · Eq. 2, Eq. 4, App. A.1.6, after Schulman 2020 (blog; names $k_1$, $k_3$). Tang &amp; Munos 2025, arXiv:2506.09477. KL: Kullback-Leibler divergence; $\beta$: KL weight; $\pi_{\rm ref}$: frozen reference model. Toy numbers: ours</p>

Note:
On the slide in short: both estimators use one sampled token; they have the same mean on tokens drawn from the current policy, and k3 is never negative. As a loss term, k1 has zero expected gradient, while k3 pulls toward the reference; it descends the KL in the order Eq. 3 does not write. Does the KL term anchor what it says it anchors? Roughly: on-policy and per position only; little difference was found at beta = 0.001, and 0.04, the value used, was untested.
Both methods estimate the KL from the one sampled token. Write u for the reference's probability of that token over the policy's. PPO's per-token penalty is k1, minus log u: right on average, but a single token can give a negative penalty, and inside a reward that is a bonus for drifting (our reading). PPO's k1 is fine in a reward, because a reward is not differentiated. GRPO uses k3, u minus log u minus 1. Its average is still the KL, because u minus 1 has mean zero under the policy: the sum of pi theta times pi ref over pi theta is the sum of pi ref, which is 1. That needs the tokens to come from pi theta itself.
Check it on a toy: policy (0.8, 0.2), reference (0.5, 0.5). True KL 0.1927. k1 gives 0.470 and minus 0.916, averaging 0.1927; k3 gives 0.095 and 0.584, also averaging 0.1927, with a variance of 0.0382 against 0.3075. And k3 is never negative: its derivative 1 minus 1 over u is zero only at u equals 1, where it is zero. The paper says "guaranteed to be positive"; strictly, non-negative. But in a loss the sign of a sample doesn't matter. The gradient does.
What does the KL term do to the gradient? Differentiate k3 with the token held fixed: you get one minus u times the gradient of log pi. Subtracting beta k3 therefore adds beta times u minus 1 to each token's weight, which is exactly the appendix's gradient coefficient (App. A.1.6, Eq. 21): positive when the reference likes the token more than the policy does. In our toy, with beta 0.04, minus 0.015 and plus 0.06. Now average over tokens sampled from the policy. The expected gradients with respect to the two logits (the scores before the softmax), beta not included: k1 = log of pi theta over pi ref gives (0, 0), it descends nothing. k2, Schulman's half squared log ratio, gives (0.22, minus 0.22) and descends KL of pi theta from pi ref, the order the paper's Eq. 3 writes; the paper's appendix says it gives an unbiased gradient of that. GRPO does not use k2. k3 gives (0.3, minus 0.3), which equals pi theta minus pi ref: the gradient of the divergence with the arguments swapped, a cross-entropy toward the reference, so on average a little distillation. I avoid the words forward and reverse, because authors use them in opposite ways.
Does it anchor what it says? Three conditions the paper leaves implicit. The tokens must come from the current policy: in the paper's run they do, since there is one update per batch. With samples from an older policy, say (0.6, 0.4), the estimate's mean becomes 0.2905 instead of 0.1927, and the expected gradient, (0.525, minus 0.525), is the gradient of neither divergence (ours). Second, the derivation holds per position, ignoring how a token changes the later tokens' distributions. Third, the length average applies to this term too.
Tang and Munos make the same point in 2025 ("On a few pitfalls in KL divergence gradient estimation for RL", naming GRPO among affected designs): differentiating k1 does nothing, differentiating k3 gives the gradient with the two distributions reversed, with "positions of the two distributions ... reversed", and k3 token losses "do not produce even the partial gradient" of a sequence-level divergence. Do they find it matters? At beta 0.001, R1's value, little, and they "speculate" it is because KL stays low. At DeepSeekMath's 0.04: not tested by them; large gaps are shown only in distillation. So the term still anchors the policy to the reference, just not exactly the anchor the notation names.

---

<p class="eyebrow"><span class="paper">Shao et al. 2024</span> · §4.1.3 · process supervision</p>

## Can we credit each step instead of the answer?

<div class="cols wide-fig">
<div class="text">

- a process reward model scores each step
- z-score over all steps of all $G$ answers
- token advantage: sum of its own and later steps' scores

<div class="eq">$$\hat A_{i,t} = \sum_{j:\ {\rm index}(j) \ge t}\tilde R_i^{(j)}$$</div>

<p class="q"><b>Q.</b> Answer 1's step 2 scores 0.6, not 0.2. What happens to answer 2's step 1 advantage?</p>
<p class="a"><b>A.</b> −0.408 ▸ −1.769: the pool couples answers</p>

</div>
<div class="fig"><img src="img/week-04-grpo-steps.svg" alt="Illustration: one toy answer with three steps scored 0.9, 0.2 and 0.8. Normalised step rewards +1.22, -1.63, +0.82; reward-to-go advantages for the tokens of each step +0.41, -0.82, +0.82"></div>
</div>

<p class="footnote">Shao et al. 2024 · §4.1.3, following Math-Shepherd (arXiv:2312.08935; step labels built by checking whether a step can reach the right answer). index($j$): last token of step $j$; $\tilde R_i^{(j)}$: normalised score of step $j$ of answer $i$. Toy: ours, pooled mean 0.6, std 0.245</p>

Note:
One number per answer punishes five right steps along with one wrong one; the authors say outcome rewards "may not be sufficient and efficient" for complex math. So, following Math-Shepherd, a process reward model scores each step. Normalise every step score against the pool of all steps of all G answers, then give each token the sum of the normalised scores of its own step and every later one: a reward-to-go, like a return.
Toy: answer 1 has steps scored 0.9, 0.2, 0.8; answer 2 has 0.5 and 0.6. Pool mean 0.6, std 0.245. The bad second step drags down its own tokens and step 1's, to plus 0.41 and minus 0.82, but not step 3's. Two things to notice: the pool couples answers, so changing one step of answer 1 changes answer 2's advantages; and an early token in a long answer sums many scores, so its advantage can be large just because the answer is long.

---

<p class="eyebrow"><span class="paper">Shao et al. 2024</span> · §4.1.4, §5.2.1 · Algorithm 1, Fig. 6</p>

## Why retrain the reward model mid-run?

<div class="rows">
<div class="points">
<div class="text">

- reward model goes stale as the policy moves
- each round: new samples + 10% old data, then $\pi_{\rm ref} \leftarrow \pi_\theta$
- iteration 0: MATH 46.8 ▸ about 49.9, then dips; iteration 1 about 50 to 52; iteration 2 flat on MATH
- 2 things change at once; 1 run each

</div>
<div class="text">

<p class="q"><b>Q.</b> KL at a round's first step?</p>
<p class="a"><b>A.</b> Zero: $\pi_{\rm ref} = \pi_\theta$, so $u = 1$</p>

</div>
</div>
<div class="fig"><img src="img/week-04-grpo-fig6.png" alt="Figure 6 of the paper: GSM8K and MATH accuracy against training steps for iterations 0, 1 and 2 of iterative RL from DeepSeekMath-Instruct 7B. Iteration 0 rises from 82.9 and 46.8; iteration 1 sits clearly higher; iteration 2 adds a little on GSM8K and little on MATH"></div>
</div>

<p class="footnote">Shao et al. 2024 · §4.1.4, §5.2.1, Fig. 6 (by eye). $\pi_{\rm ref}$: KL anchor; $u$: ratio of $\pi_{\rm ref}$ to $\pi_\theta$. GSM8K: grade-school word problems; MATH: competition problems. Iterations 0 to 2 are the paper's "two rounds"</p>

Note:
Four versions of the model, three loops. The policy changes at every gradient step. The old policy, the copy that sampled the batch, is refreshed at every sampling step. The reference model, the KL anchor, is reset to the current policy at every outer iteration. The starting Instruct 7B model never changes. Algorithm 1 loops over I rounds, M steps and mu updates per batch; mu is 1 in the paper's run, M is not stated. A small slip: Algorithm 1 line 11 cites Equation 21, the appendix's gradient coefficient, as the objective (Eq. 3).
Why iterate? The reward model was trained on answers from the starting model. As RL proceeds, the policy writes answers the reward model has never seen, and its scores get less reliable exactly where the policy explores. So after each round they retrain it on the current policy's samples, with a replay of 10% old data so it doesn't forget, and reset the reference to the policy. At a round's first step the reference equals the policy, so u is 1 and the KL term is zero.
Does iterating help? How to read Figure 6: steps on x, accuracy on y, one run per iteration. Iteration 0 climbs from Instruct's 82.9 and 46.8 to about 86 to 87 and 49.9, then on MATH falls back to about 48.7, consistent with a stale reward model. Iteration 1 is clearly higher, about 87 to 88 on GSM8K and 50 to 52 on MATH. Iteration 2 adds a little on GSM8K, up to about 89, and nothing clear on MATH. The paper: iterative RL helps "especially at the first iteration". The figure supports that.
What it doesn't show: between rounds two things change at once, the reward model is retrained and the reference is reset, so it can't say which helped; and each is one run. Also unexplained: iteration 1 starts near step 1,100 to 1,300, before iteration 0 ends near 2,800, as if branched from an earlier checkpoint.

---

<p class="eyebrow"><span class="paper">Shao et al. 2024</span> · §4.2 · Table 5</p>

## What did RL buy across eight benchmarks?

<div class="cols">
<div class="text">

<table class="rules">
  <tr><td>setting</td><td>benchmark</td><td class="num">Instruct</td><td class="num">RL</td><td class="num">change</td></tr>
  <tr><td>chain of thought</td><td>GSM8K</td><td class="num">82.9</td><td class="num"><b>88.2</b></td><td class="num">+5.3</td></tr>
  <tr><td>chain of thought</td><td>MATH</td><td class="num">46.8</td><td class="num"><b>51.7</b></td><td class="num">+4.9</td></tr>
  <tr><td>chain of thought</td><td>MGSM-zh</td><td class="num">73.2</td><td class="num"><b>79.6</b></td><td class="num">+6.4</td></tr>
  <tr><td>chain of thought</td><td>CMATH</td><td class="num">84.6</td><td class="num"><b>88.8</b></td><td class="num">+4.2</td></tr>
  <tr><td>tools</td><td>GSM8K</td><td class="num">83.7</td><td class="num"><b>86.7</b></td><td class="num">+3.0</td></tr>
  <tr><td>tools</td><td>MATH</td><td class="num">57.4</td><td class="num"><b>58.8</b></td><td class="num">+1.4</td></tr>
  <tr><td>tools</td><td>MGSM-zh</td><td class="num">72.0</td><td class="num"><b>78.4</b></td><td class="num">+6.4</td></tr>
  <tr><td>tools</td><td>CMATH</td><td class="num">84.3</td><td class="num"><b>87.6</b></td><td class="num">+3.3</td></tr>
</table>

</div>
<div class="text">

- shows: narrow RL lifts a strong model everywhere, held-out benchmarks too
- shows: no value model needed
- not shown: GRPO matches PPO (no PPO run)
- not shown: which variant, or seed spread

</div>
</div>

<p class="footnote">Shao et al. 2024 · Table 5 (top-1, %); changes: ours. Recipe: Instruct 7B, about 144K questions, $G$ = 64, $\beta$ = 0.04, rate 1e-6, max length 1024. <b>MGSM-zh</b>: GSM8K in Chinese; <b>CMATH</b>: Chinese primary-school maths</p>

Note:
All eight cells go up. The two in-domain cells, GSM8K and MATH with chain of thought, rise about 5 points; the cells the paper calls out of domain rise as much, MGSM-zh by 6.4 in both settings. The smallest gain is tool-integrated MATH, 1.4. Only GSM8K and MATH with chain of thought are in domain (§4.2); the rest the paper calls out of domain. For scale, GPT-4 scores 52.9 on MATH with chain of thought and Gemini Ultra 53.2; RL's 51.7 is close. GSM8K is grade-school word problems, MATH competition problems, CMATH Chinese elementary word problems. Tools means answers that write and run code.
Read the labels carefully, though. MGSM-zh is GSM8K translated into Chinese, and the tool-integrated cells are the same benchmarks answered in another format. "Out of domain" here means another language or answer format, not another kind of problem. Question for the room: why would Chinese GSM8K gain as much as English GSM8K? First because it is GSM8K. Second, if RL mostly sharpens which existing answer wins, a hypothesis we'll test with Figure 7, the language shouldn't matter.
What exactly did they train with? Start: Instruct 7B. Questions: about 144K GSM8K and MATH chain-of-thought examples, questions only, never the SFT solutions; it samples its own answers. Group G is 64, KL beta 0.04, learning rate 1e-6, max length 1024, one update per batch (mu equals 1), clip epsilon not reported. Batch 1024: questions or answers, not stated. No value is justified in the paper. Everything else is held out on purpose, to test transfer. The reward model is trained from Base 7B on labels built following Math-Shepherd, which come from checking answers (§5.2.1: "based on the rule judgment"). Why a learned model rather than the check itself? The paper doesn't say; plausibly because it gives graded scores and can score steps.
G equals 64 makes the group statistics stable and is expensive: up to 65,536 generated tokens per question per step (ours: 64 times 1024). The row to stare at is mu equals 1. Then the policy being differentiated is the one that sampled, the ratio r at the gradient is exactly 1, and the clip never binds. The appendix (A.1.5) says so: with one update, "we can remove the min and clip operation". We return to this in the critique.
What does Table 5 show, and not show? It establishes that RL with GRPO on a narrow question set improves a strong instruct model on every benchmark, including the held-out ones, and does so without a value model. That is the paper's core RL claim, and it holds. What it doesn't establish: that GRPO is as good as PPO, since no PPO model is trained on the same data; which variant produced the row, outcome or process rewards, one round or two, which the paper never says; and how much of a 1.4- or 3-point gain would survive another seed, since there is one run per model and no error bars. (The "not shown" bullets are our reading of what the paper does not report.)

---

<p class="eyebrow"><span class="paper">Shao et al. 2024</span> · §5.1 · Tables 6 to 9</p>

## Which pretraining data helped?

<div class="cols">
<div class="text">

<table class="rules">
  <tr><td>1.3B model</td><td class="num">GSM8K</td><td class="num">MATH</td><td class="num">GSM8K + Python</td><td class="num">MATH + Python</td></tr>
  <tr><td>general ▸ math 150B</td><td class="num">19.1</td><td class="num">14.4</td><td class="num">14.3</td><td class="num">6.7</td></tr>
  <tr><td>code ▸ math 150B</td><td class="num"><b>21.9</b></td><td class="num"><b>15.3</b></td><td class="num">17.4</td><td class="num">9.4</td></tr>
  <tr><td>code and math mixed</td><td class="num">17.6</td><td class="num">12.1</td><td class="num"><b>19.7</b></td><td class="num"><b>13.5</b></td></tr>
</table>

- code first, no tools: +2.8 GSM8K, +0.9 MATH, one run each (ours)

</div>
<div class="text">

<table class="rules">
  <tr><td>7B, 40B tokens</td><td class="num">GSM8K</td><td class="num">MATH</td><td class="num">SAT</td><td class="num">MathQA</td></tr>
  <tr><td>no math training</td><td class="num">29.0</td><td class="num">12.5</td><td class="num">40.6</td><td class="num">21.1</td></tr>
  <tr><td>MathPile</td><td class="num">23.6</td><td class="num">11.5</td><td class="num">46.9</td><td class="num">25.6</td></tr>
  <tr><td>ArXiv-RedPajama</td><td class="num">28.1</td><td class="num">11.1</td><td class="num">50.0</td><td class="num">24.8</td></tr>
</table>

- arXiv: "no notable improvements on all" vs "a grain of salt"
- the real model still keeps 20% code, 10% arXiv

</div>
</div>

<p class="footnote">Shao et al. 2024 · §5.1.1, §5.1.2, Tables 6, 8 (%, bold: the paper's). Python: with code tools. <b>SAT</b>: US college-admission exam, math section. <b>MathQA</b>: Gaokao-MathQA, Chinese college-entrance multiple choice. ArXiv-RedPajama: 28.0B tokens of arXiv LaTeX</p>

Note:
Optional depth. Does code before math help math? "A popular yet unverified hypothesis suggests that code training improves reasoning." They test it at 1.3B with a real control: 400B tokens of code, or of general text, then the same 150B of math (the second-iteration, 89B-token corpus). The stage-one rows we don't show carry the strongest result. General 400B only: GSM8K 2.9, MATH 3.2, with Python 3.3 and 2.3. Code 400B only: 5.9, 3.6, with Python 12.4 and 10.0. So code alone takes GSM8K with Python from 3.3 to 12.4 and MATH with Python from 2.3 to 10.0. After the math stage, code first wins every column, but without tools only by 2.8 and 0.9 points, one run each.
Mixing code and math in one stage gives the best tool-using scores and worse scores without tools; their guess is that 1.3B lacks capacity for both. And math after code destroys coding (Table 7): HumanEval 25.0 to 12.2, MBPP 40.0 to 17.0, which mixing prevents, keeping 29.3 and 39.4: that is why the real model keeps 20% code. The sentence "We believe it does" rests on small gaps at 1.3B.
Do arXiv papers help math? Perhaps counter-intuitively, they write, arXiv papers seem ineffective. They train a 1.3B model and the 7B Coder model on two arXiv corpora. At 1.3B arXiv clearly hurts: MMLU-STEM 19.5 to 9.0. At 7B, GSM8K, MATH and formal proofs go down or stay flat (Table 9: miniF2F-test, formal Olympiad proofs, 21.7 to 11.9), but SAT rises by up to 9.4 points and Gaokao-MathQA by up to 4.5. Repetition matters too: at 1.3B, MathPile is seen almost 17 times.
So two registers again. The contributions say arXiv "brings no notable improvements on all mathematical benchmarks" (§1.1). The section itself says the conclusion "should be taken with a grain of salt" and lists what it didn't test, including arXiv mixed with other data. The table matches the second. And the real Base model still keeps 10% arXiv, consistent with that caveat.

---

<p class="eyebrow"><span class="paper">Shao et al. 2024</span> · §5.2.1 · Eq. 5, Table 10, Fig. 5</p>

## Is every method SFT with a weight per token?

<div class="cols wide-fig">
<div class="text">

<div class="eq">$$\nabla\mathcal J_{\mathcal A} = \mathbb E_{(q,o)\sim\mathcal D}\Big[\frac{1}{\lvert o\rvert}\sum_t GC_{\mathcal A}(q,o,t)\ \nabla\log\pi_\theta(o_t \mid q, o_{\lt t})\Big]$$</div>

<table class="rules">
  <tr><td>method</td><td>weight on each token</td></tr>
  <tr><td>SFT</td><td>1</td></tr>
  <tr><td>RFT, Online RFT</td><td>1 if correct, else 0</td></tr>
  <tr><td>PPO</td><td>$\hat A_t$ from a value model</td></tr>
  <tr><td>GRPO</td><td>$\hat A_{i,t} + \beta(u - 1)$</td></tr>
</table>

- Fig. 5 (1.3B): online beats offline, GRPO beats Online RFT, per-step beats per-answer on GSM8K
- no PPO, no DPO curve; one run each

</div>
<div class="fig"><img src="img/week-04-grpo-fig5.png" alt="Figure 5 of the paper: GSM8K and MATH accuracy against training steps up to about 8,800 for DeepSeekMath-Instruct 1.3B trained with RFT, Online RFT, GRPO with outcome supervision and GRPO with process supervision. On GSM8K RFT stays lowest near 60, Online RFT near 62, GRPO with outcome rewards near 63 to 64 and with process rewards near 65; on MATH the two GRPO curves peak around step 4,000 and are interleaved later"></div>
</div>

<p class="footnote">Shao et al. 2024 · §5.2.1, Eq. 5, Table 10, Fig. 5 (by eye). $GC$: gradient coefficient. RFT: rejection sampling fine-tuning, on the frozen SFT model's correct answers; Online RFT: same, current policy. DPO: direct preference optimisation</p>

Note:
The paper's most reusable idea. Write the gradient of any of these methods the same way: SFT's gradient of log pi of each token, times a per-token weight, the gradient coefficient. Methods differ in only three knobs: where the answers come from, what the reward is, and how the weight is computed. The full Table 10 (with App. A.1, mu equals 1): SFT, answers from human-written data, no reward, weight 1. RFT, answers from the frozen SFT model, rule reward, weight 1 if correct else 0. Online RFT, answers from the current policy, rule reward, same weight. PPO, current policy, model reward, the value-model advantage. GRPO, current policy with G per question, model reward, the group advantage plus beta times u minus 1. A rule means the answer is checked against the key; the reward model's labels also come from the rule. Table 10 also lists DPO, a later reading with a pairwise weight.
SFT weights every token of a human solution by 1. RFT keeps the correct answers: the no-baseline weights of step one. Online RFT does the same with the current policy: with a 0/1 reward, that is REINFORCE with no baseline. PPO's weight is the value-model advantage; GRPO's is the group advantage plus the KL term. Read down the table and you see what RL adds over SFT: answers from the model's own current distribution, and weights that can be negative and graded. Check: on the group 1, 0, 0, 0, Online RFT gives 1, 0, 0, 0; GRPO gives plus 1.73 and three minus 0.58s.
Which ingredient wins in Figure 5? The closest the paper comes to a method comparison, DeepSeekMath-Instruct 1.3B (not otherwise described), legend GRPO+OS for outcome rewards and GRPO+PS for process (per-step) rewards. All four start together. Three findings. Online beats offline: Online RFT "is comparable to RFT in the early stage of training but gains an absolute advantage in the later stage", because early on the policy and the SFT model are nearly the same model. Signed, graded weights beat 0/1: GRPO surpasses Online RFT. Step rewards beat answer rewards: clear on GSM8K, where process rewards end near 65 against 63 to 64 (RFT stays lowest near 60, Online RFT near 62). On MATH the GRPO curves peak near step 4,000 and then interleave, so that finding is not clear there.
Cautions: no PPO and no DPO curve, though Table 10 lists both; a 1.3B model while every headline is at 7B; one run each, with gaps of 1 to 3 points about the size of the curves' wiggle. And GRPO against Online RFT changes several things at once: baseline, std, KL and a reward model instead of a rule.

---

<p class="eyebrow"><span class="paper">Shao et al. 2024</span> · §5.2.2 · Maj@K vs Pass@K (ours)</p>

## Sharpen or extend: how would we tell?

<div class="cols wide-fig">
<div class="text">

- Pass@K: any of $K$ samples right
- Maj@K: the majority answer right
- raise $p$ 0.3 ▸ 0.6: Maj@15 +0.74, Pass@15 +0.005
- $p$ = 0: both stay 0

<p class="q"><b>Q.</b> At $p$ = 0.3, why does voting hurt?</p>
<p class="a"><b>A.</b> The wrong answer is more common</p>

</div>
<div class="fig"><img src="img/week-04-grpo-majpass.svg" alt="Illustration: chance a question counts as solved against K. Pass@K rises to nearly 1 within a few samples for p = 0.3 and 0.6. Maj@K rises from 0.600 to 0.787 at K = 15 for p = 0.6, and falls from 0.300 to 0.050 for p = 0.3"></div>
</div>

<p class="footnote">Illustration: ours. One question; each sample right with probability $p$, otherwise one fixed wrong answer; odd $K$, so votes can't tie. Maj@K is the paper's majority vote (self-consistency)</p>

Note:
What did RL change? Two possibilities: it made the right answer more likely among the answers the model already produces, or it taught the model to produce a right answer it couldn't before. Two metrics separate them. Pass at K: sample K answers, solved if any is right; it measures what the model can reach. Maj at K: solved if the majority answer is right; it measures what the distribution favours.
A toy: each sample is right with probability p, otherwise one particular wrong answer. Raise p from 0.3 to 0.6 and Maj at 15 jumps from 0.05 to 0.79, while Pass at 15 barely moves: the question was already reachable, only the vote changed. If p is zero, nothing changes either metric; only learning something new can. So Maj up with Pass flat at large K is the signature of sharpening.

---

<p class="eyebrow"><span class="paper">Shao et al. 2024</span> · §5.2.2 · Fig. 7</p>

## What did RL change in Figure 7?

<div class="rows">
<div class="points">
<div class="text">

- K = 1: RL ahead by about 6.7 (GSM8K), 6.4 (MATH)
- Maj@64 gap: about 1.5 and 1.0

</div>
<div class="text">

- Pass@K: Instruct ahead on GSM8K from K = 8
- MATH Pass@K curves meet from K = 16

</div>
</div>
<div class="fig"><img src="img/week-04-grpo-fig7.png" alt="Figure 7 of the paper: Maj@K and Pass@K of the Instruct and RL 7B models on GSM8K and MATH for K from 1 to 64 at temperature 0.7. RL starts well above Instruct at K = 1; the Maj@K gap shrinks with K; on GSM8K the Instruct Pass@K curve ends above RL's, on MATH the two Pass@K curves meet"></div>
</div>

<p class="footnote">Shao et al. 2024 · Fig. 7, temperature 0.7; GSM8K: grade-school word problems; MATH: competition problems. Readings and gaps by eye (ours). Caption: "RL enhances Maj@K but not Pass@K."</p>

Note:
Prediction first: if RL only sharpens, the two Pass at K curves should meet at large K. Now the figure. Lower pair Maj at K, upper pair Pass at K, Instruct against RL, temperature 0.7. At K equals 1 both metrics are just accuracy, and RL is ahead by about 6.7 points on GSM8K and 6.4 on MATH (Instruct's GSM8K at K equals 1 is about 81.5 here against 82.9 in Table 5: different decoding). As K grows, the Maj gap shrinks to about 1.5 and 1.0, and the Pass curves meet: on MATH from K equals 16, and on GSM8K Instruct ends higher.
So check the caption against the figure: "RL enhances Maj@K but not Pass@K" is true for large K only, on both halves. A sharper reading of ours: Instruct gains 8.0 points on GSM8K and 15.3 on MATH by voting over 64 samples; RL, with one sample, recovers 84% and 42% of that. RL bakes much of the benefit of voting into a single sample. The paper's own reading, in bold: the improvement "seems" to come from "boosting the correct response from TopK rather than the enhancement of fundamental capabilities".

--

<p class="eyebrow"><span class="paper">Shao et al. 2024</span> · Later work · Yue et al. 2025</p>

## What happens at much larger K?

<div class="cols">
<div class="text">

- $k$ up to hundreds, many models and tasks
- small $k$: RL model ahead; large $k$: base model ahead
- on the training set: pass@1 26.1 ▸ 42.5, pass@256 falls
- verdict on §5.2.2: confirmed and sharpened; still debated (ours)

</div>
<div class="text">

<p class="q"><b>Q.</b> Same comparison as DeepSeekMath?</p>
<p class="a"><b>A.</b> No: RL vs its base model, not vs Instruct</p>

</div>
</div>

<p class="footnote">Yue et al. 2025, "Does Reinforcement Learning Really Incentivize Reasoning Capacity in LLMs Beyond the Base Model?", arXiv:2504.13837. RLVR: RL with verifiable rewards, from a checker. LLM: large language model</p>

Note:
Optional. Yue and colleagues push the paper's tentative finding to k in the hundreds, across model families, algorithms and tasks, for RL with verifiable rewards: "while RLVR-trained models outperform their base models at smaller values of k, base models achieve higher pass@k score when k is large". Six RL algorithms "perform similarly". The boundary "often narrows as RLVR training progresses": in one run, pass at 1 on the training set rose from 26.1 to 42.5 while pass at 256 fell. Distillation from a stronger model, by contrast, can add new reasoning patterns.
One difference: they compare RL against the base model it started from; DeepSeekMath compared against Instruct. The paper's "it seems" became one of the central debates of 2025.

---

<p class="eyebrow"><span class="paper">Shao et al. 2024</span> · critique 1 · §4, §5.2.1 · Later work: DeepSeek-AI 2025 (R1)</p>

## Where is the PPO baseline?

<div class="cols wide-fig">
<div class="text">

- no PPO run on the same model and data
- R1's supplement, MATH: PPO 0.501 and 0.536, GRPO 0.555
- one run each, by GRPO's authors

<p class="q"><b>Q.</b> Does it sink the argument?</p>
<p class="a"><b>A.</b> It sinks "as good as PPO", not "GRPO works"</p>

</div>
<div class="fig"><img src="img/week-04-grpo-r1-ppo.png" alt="DeepSeek-R1 supplement figure: MATH accuracy against training steps up to about 2,400 for PPO with lambda 0.95, PPO with lambda 1.0 and GRPO. GRPO ends near 0.555, PPO with lambda 1.0 near 0.536, PPO with lambda 0.95 near 0.501"></div>
</div>

<p class="footnote">Our critique of Shao et al. 2024 §1.1, §4, §5.2.1. DeepSeek-AI 2025, DeepSeek-R1, arXiv:2501.12948, supplement: a 16B mixture-of-experts model (2.4B active parameters); values by eye. $\lambda$: GAE's credit decay</p>

Note:
On the slide in short: GRPO is sold as a cheaper PPO, but there is no PPO run on the same model and data. Fig. 5 compares only RFT and Online RFT; Table 5's PPO 7B models use other bases and data. Later, the R1 supplement on MATH: PPO with lambda 0.95 about 0.501, with lambda 1.0 about 0.536, GRPO about 0.555, one run per setting, by GRPO's authors. It sinks "as good as PPO"; it leaves "GRPO works at all", which Table 5 supports.
The paper introduces GRPO as a variant of PPO that is cheaper and works, but never trains PPO on the same model and data. Figure 5 compares GRPO with RFT and Online RFT. Table 5 does contain two PPO-trained 7B models, and both beat Instruct on GSM8K, but they have different base models, data and rewards, so they say nothing about the algorithm.
Do they admit it? No: "efficient and effective", unqualified. Does it sink the argument? It sinks "GRPO is as good as PPO", which needs a PPO run. It leaves "GRPO works at all", which Table 5 supports. The comparison came a year later.
When someone finally ran PPO, what happened? DeepSeek-R1's supplement has the head-to-head ("Performance of PPO and GRPO on the MATH task", DeepSeek-Coder-V2-Lite). On MATH with a 16B mixture-of-experts model, PPO with the common lambda of 0.95 "performs considerably worse than GRPO"; with lambda 1.0, PPO "improves substantially, nearing that of GRPO". By eye at about step 2,400: 0.501, 0.536, 0.555.
Read it carefully: one run per setting, one model, two lambdas, by GRPO's own authors. Within that, GRPO wins. Why does lambda matter so much? The reading is ours, not R1's, and untested there: at 0.95 the reward barely reaches early tokens, the 0.95 to the 495th weight from earlier, so everything rides on the value model; at 1 the advantage is the final reward minus the value, the closest PPO gets to GRPO's score-the-whole-answer view.

---

<p class="eyebrow"><span class="paper">Shao et al. 2024</span> · critique 2 · §1, §6</p>

## Does GRPO really save memory?

<div class="cols">
<div class="text">

- "significantly reducing training resources"
- "less memory consumption"
- no number anywhere, and not flagged
- ours: 252 GB ▸ 140 GB at 7B

</div>
<div class="text">

<p class="q"><b>Q.</b> Does it sink the argument?</p>
<p class="a"><b>A.</b> No, but 64 samples per question cost too</p>

</div>
</div>

<p class="footnote">Our critique. Shao et al. 2024 §1, Fig. 4 caption, §6. Our accounting excludes generation memory and time</p>

Note:
Three places claim the saving: the introduction, the Figure 4 caption and the conclusion. None gives a number. Do they admit it? No. Removing a trained, policy-sized model plausibly saves a lot; our accounting says about 44% of training state at 7B.
But GRPO pays elsewhere. Sampling 64 answers per question, up to 1,024 tokens each, is a lot of generation, and generation memory and time are not in that accounting. Whether total cost goes down is an empirical question the paper never asks. It doesn't sink the method; it leaves the efficiency claim unmeasured.

---

<p class="eyebrow"><span class="paper">Shao et al. 2024</span> · critique 3 · §4.2, App. A.1.5 · Later work: R1, DAPO</p>

## Is it still PPO if the clip never binds?

<div class="cols">
<div class="text">

- $\epsilon$ in Eq. 3, never given
- $\mu$ = 1: ratio is 1, clip inert; reported run: REINFORCE + group baseline + std, length average, KL anchor
- later systems update several times per batch, so the clip binds
- R1: $\epsilon$ = 10, very loose; DAPO: $\epsilon_{\rm low}$ 0.2, $\epsilon_{\rm high}$ 0.28

</div>
<div class="text">

<p class="q"><b>Q.</b> Does it sink the argument?</p>
<p class="a"><b>A.</b> No: it changes what GRPO is here</p>

</div>
</div>

<p class="footnote">Our critique. Shao et al. 2024 §4.2, App. A.1.5; DeepSeek-AI 2025, arXiv:2501.12948; Yu et al. 2025, DAPO, arXiv:2503.14476. $\mu$: updates per batch; $\epsilon$: clip width. <b>AIME</b>: US high-school math competition</p>

Note:
Epsilon appears in the objective but not in the recipe. With one update per sampled batch ("a single update following each exploration stage", §4.2), the ratio is exactly 1 where the gradient is taken, and the clip never binds. Do they admit it? Indirectly: the appendix removes the min and clip "to simplify the analysis" under exactly that assumption.
So the method in the reported run is closer to REINFORCE with a group baseline, plus the std, the length average and a KL anchor, than to PPO. That doesn't sink it; it changes what it is. Later systems took several updates per batch, so the clip binds, and both found that it helps to loosen it.
What did later systems do with the clip? R1-Zero ran GRPO on DeepSeek-V3-Base with rule-based rewards, 16 answers per question, KL weight 0.001, and many updates per rollout, so the clip binds; its AIME 2024 pass at 1 rose from 15.6% to 77.9%. For R1 itself they set epsilon to 10: an interval from minus 9 to 11, so in effect a very loose clip, because a tight one "can lead to the truncation of gradients for a significant number of tokens".
DAPO, a 2025 set of repairs to GRPO for long answers, points the same way. Clip-Higher raises only the upper limit, to 0.28: at 0.2, a token with probability 0.01 can only grow to 0.012 per step. Dynamic sampling drops prompts whose answers are all right or all wrong, our zero-over-zero groups. The token-level loss divides by the sum of all answer lengths in the group, removing the length bias, and they drop the KL. Overlong filtering ignores the loss on answers cut off at the length limit; soft overlong punishment adds a graded penalty as an answer nears the limit (DAPO section 3.4). The ladder on Qwen2.5-32B, AIME 2024, avg@32 (average over 32 samples; DAPO's Table 1): R1-Zero-Qwen-32B, the target, 47; naive GRPO 30; plus overlong filtering 36; plus Clip-Higher 38; plus soft overlong punishment 41; plus token-level loss 42; plus dynamic sampling, which is DAPO, 50. DAPO counts four techniques: the two overlong rows are one. Step by step, naive GRPO's 30 becomes 50, above R1-Zero's 47.

---

<p class="eyebrow"><span class="paper">Shao et al. 2024</span> · critique 4 · §2.2, §4.2, §5, Fig. 6</p>

## Can these gaps be trusted?

<div class="cols">
<div class="text">

- which model is in Table 5: outcome or process rewards, one round or two? never said
- Fig. 6 MATH peak about 52.2 at step 4,700; GSM8K there about 87.5, not 88.2
- no seeds, no error bars; Fig. 5 at 1.3B, headline at 7B
- small gaps: code first, no tools +0.9 to +2.8; process vs outcome, GSM8K only

</div>
<div class="text">

<p class="q"><b>Q.</b> Does it sink the argument?</p>
<p class="a"><b>A.</b> Not the big effects (corpus, Instruct vs RL, code first with tools); the small ones are unsettled</p>

</div>
</div>

<p class="footnote">Our critique. Shao et al. 2024 §2.2, §4.1.2 to §4.2, §5, Table 5, Fig. 6 (by eye). Math-Shepherd builds per-step labels, which suggests but doesn't state process supervision</p>

Note:
Which model is in Table 5? The paper describes three variants, outcome rewards, process rewards and iterative RL, and never says which produced the 7B model in Table 5. The reward model's training data follows Math-Shepherd, which suggests a process reward model, but that is an inference. Figure 6 deepens the question: by eye, iteration 1's MATH curve peaks at about 52.2 near step 4,700, where its GSM8K is about 87.5, not Table 5's 88.2. No single point in the figure obviously gives both numbers. They may be different checkpoints. It doesn't sink the method, but the paper alone doesn't say which model the headline is. Do they admit it? No.
Can one run per setting settle a 1-point gap? Every result in the paper is one run without error bars. The method comparison is at 1.3B while every headline is at 7B, and the code-first gains without tools are 1 to 3 points, about the size of the curves' own wiggle in Figure 5. Process against outcome rewards is clear on GSM8K only. Figure 5 also changes several things at once, so even a clean gap couldn't be attributed. Do they admit it? No.
Does it sink the argument? Not for the large effects: corpus against corpus, Instruct against RL, code first with tools. For the small ones, process against outcome rewards, code against general first without tools, round two against round one, we can't tell signal from noise.

---

<p class="eyebrow"><span class="paper">Shao et al. 2024</span> · PPO vs GRPO</p>

## How do PPO and GRPO differ?

<table class="rules">
  <tr><td>question</td><td>PPO (Schulman et al. 2017)</td><td>GRPO (Shao et al. 2024)</td></tr>
  <tr><td>baseline from</td><td>a learned value model</td><td>mean of $G$ sibling answers</td></tr>
  <tr><td>advantage</td><td>GAE over per-step rewards</td><td>z-score, same on every token</td></tr>
  <tr><td>models, for language models</td><td>4, two trained</td><td>3, one trained</td></tr>
  <tr><td>KL</td><td>$k_1$ in the reward</td><td>$k_3$ in the loss</td></tr>
  <tr><td>updates per batch</td><td>several: hence the clip</td><td>one here: clip inert</td></tr>
  <tr><td>suits (ours)</td><td>dense per-step reward</td><td>one score per answer</td></tr>
</table>

<p class="footnote">Schulman et al. 2017; Shao et al. 2024 §4.1. PPO's own KL (penalty variant) anchors to the previous policy; PPO for language models anchors to $\pi_{\rm ref}$</p>

Note:
Side by side with the reading before. The deepest difference is not memory. PPO estimates how good a state is with a network; GRPO estimates how good an answer is compared with its siblings, by sampling. For a task where the reward arrives only at the end, sampling siblings is the more direct question.
The rest follows. GAE against a per-answer z-score; four models against three; the KL as a per-token reward against an estimator in the loss; several updates per batch, which is why PPO clips, against one, which leaves GRPO's clip inert. And they were never compared in this paper.

---

<p class="eyebrow"><span class="paper">Shao et al. 2024</span> · assessment · §6, §5.2.3</p>

## What does the paper actually establish?

<div class="cols">
<div class="text">

<table class="rules">
  <tr><td>claim</td><td>status</td></tr>
  <tr><td>big math corpus in Common Crawl</td><td>yes: 120.2B tokens</td></tr>
  <tr><td>7B matches Minerva 540B</td><td>GSM8K, MATH only</td></tr>
  <tr><td>code first helps; arXiv doesn't</td><td>1.3B, small gaps</td></tr>
  <tr><td>no value model needed</td><td>yes</td></tr>
  <tr><td>as good as PPO</td><td>not tested</td></tr>
  <tr><td>saves memory</td><td>never measured</td></tr>
  <tr><td>RL extends what is solved</td><td>no: Fig. 7 says sharpens</td></tr>
</table>

</div>
<div class="text">

- admits: weak on triangles and ellipses, behind GPT-4 few-shot, arXiv "a grain of salt"
- admits: reward unreliable (PRM800K about 20% mislabelled)
- strong: RL on two benchmarks' questions only, real controls, reports its own deflating Fig. 7

<p class="q"><b>Q.</b> What would convince us?</p>
<p class="a"><b>A.</b> PPO on the same model, data and reward model, generation compute counted; Pass@K to 256 or more</p>

</div>
</div>

<p class="footnote">Our assessment against Shao et al. 2024 §2 to §6. PRM800K: OpenAI's step-level human labels on MATH solutions. The lasting contribution: a group-mean baseline is sufficient, not shown to be better</p>

Note:
At each level of trust. Established: a large, good math corpus can be mined from the web (120.2B tokens, better per token at 1.3B); a 7B model can match Minerva 540B on GSM8K and MATH, not on OCW or MMLU-STEM; and a value model is unnecessary for RL on math, in the sense that GRPO without one improves every benchmark. Weaker: code-first and arXiv results rest on small gaps, mostly at 1.3B, with exceptions for arXiv. Not tested: that GRPO is as good as PPO, since there is no PPO run. Asserted, never measured: that it saves memory. And the paper's own Figure 7 says RL here sharpens rather than extends. The strongest contribution, measured by what lasted, is the simplest: a group-mean baseline is good enough.
What do the authors admit? In their words. Geometry and theorem proving are weaker than closed models: "the model cannot handle problems related to triangles and ellipses, which may indicate data selection bias". A classifier seeded from one corpus is a plausible cause, though they don't connect the two. And "restricted by the model scale", it is worse than GPT-4 at few-shot: it performs the same zero-shot and few-shot ("similar performance in zero-shot and few-shot evaluation"). Recall GPT-3 earlier this week: that is striking: in-context examples don't help this model. The arXiv result needs "a grain of salt". On RL, their own diagnosis: they used only the instruction-tuning questions and "a naive nucleus sampling", a "potential reason" RL only improved Maj@K. Every method "fully TRUST"s its reward, yet even PRM800K, a carefully annotated dataset, has about 20% wrong labels. Without a reward model that generalises, RL "may merely stabilize the distribution".
Why is this a strong paper? The critiques are fair, but the paper does several things well. Design choice and what it buys: RL on GSM8K and MATH questions only, a built-in transfer test (everything else is held out on purpose). General text instead of code in stage 1, a real control for "code helps". Comparison at 50B tokens, which faces the repetition problem. Fig. 7, Maj@K against Pass@K: it reports its own deflating finding; most method papers would have stopped at Table 5, but this one ran Figure 7 and said, in bold, that RL seems to sharpen rather than extend. Eq. 5, one gradient: a map of post-training methods, still the clearest way to read post-training papers.
What would convince us? Two experiments would settle the paper's two open claims. GRPO against PPO: same starting model, questions and reward model, compute matched including generation, so GRPO's 64 samples are paid for. PPO at lambda 0.95 and 1, GRPO with and without the std and length factors, several seeds, error bars, and measured memory and time. Sharpening against new ability: Pass at K out to 256 or more, for the Base, Instruct and RL models, on held-out questions, at several temperatures. If RL's Pass at K at large K never exceeds the Base model's, RL sharpened; if it does, on questions the Base model never solves, RL taught something. (This is our proposal, as a reviewer's ask.)

---

<p class="eyebrow"><span class="paper">Shao et al. 2024</span> · Summary</p>

## What to keep from DeepSeekMath

<div class="cols">
<div class="text">

- $\hat A_i$ = z-score in the group: no critic
- every method: SFT gradient × a weight
- normalisations shape what is learned
- measure what RL changed: Maj vs Pass

</div>
<div class="text">

<p class="q"><b>Open question</b></p>
<p class="a">Does RL with verifiable rewards ever extend what a model can solve, or only sharpen it?</p>

</div>
</div>

<p class="footnote">Shao et al. 2024. Next: what held up across the four readings</p>

Note:
Four ideas. First, the central equation is a z-score: sampling several answers to the same question gives a baseline for free, and giving every token that number is just REINFORCE with a baseline. Second, every post-training method is the SFT gradient with a weight on each token; what changes is where the answers come from and whether the weight can be negative and graded. Third, normalisation details are not details: the length average, the std and the KL estimator shaped what models learned, and later work removed or revised all three. Fourth, measure what RL changed: Maj up with Pass flat means sharpening.
DeepSeekMath's lasting contributions are a data recipe and a simplification. It didn't prove GRPO beats PPO, and its own analysis says RL here mostly rearranges what pre-training built. But it made RL on reasoning look cheaper, which R1 then used; the saving was never measured. The open question is still argued.



---

<!-- .slide: class="cover divider" -->

<p class="kicker">Across the four readings</p>
<h1>What held up</h1>
<p class="subtitle">Scorecard, limitations, open questions, discussion</p>
<ol class="track"><li class="done">GPT-3 2020<span>few-shot learners</span></li><li class="done">Raschka 2025<span>architectures</span></li><li class="done">PPO 2017<span>policy optimization</span></li><li class="done">GRPO 2024<span>DeepSeekMath</span></li></ol>

Note:
All four readings together: which claims survived, what the authors admit, what is left open, and questions for discussion.

---

<p class="eyebrow">Week 4 · scorecard</p>

## What survived?

<table class="rules">
  <tr><td>claim</td><td>source</td><td>status</td></tr>
  <tr><td>the prompt alone does dozens of tasks</td><td>GPT-3 §3</td><td>holds</td></tr>
  <tr><td>examples help more as models grow</td><td>GPT-3 Figs. 1.2, 1.3</td><td>on some tasks; near zero on many</td></tr>
  <tr><td>today's block is GPT's, six parts swapped</td><td>Raschka</td><td>holds; quality evidence thin</td></tr>
  <tr><td>clipping keeps a trust region</td><td>PPO §3</td><td>no: ratios leave the band; the recipe works</td></tr>
  <tr><td>a group-mean baseline replaces the critic</td><td>GRPO §4</td><td>holds; never compared with PPO in the paper</td></tr>
  <tr class="total"><td>RL extends what a model can solve</td><td>GRPO Fig. 7</td><td>no: it sharpens; at large K the base model is ahead</td></tr>
</table>

<p class="footnote">Revisions: Min et al. 2022, Wei et al. 2023 (recognition vs learning); Engstrom et al. 2020 (ratios and code details); DeepSeek-R1 2025 (a PPO comparison); Yue et al. 2025 (Pass@K at large K). Sub-slides above. Pass@K: solved if any of K samples is right</p>

Note:
The verdicts in one table.
GPT-3's basic observation holds: one pretrained model does many tasks from the prompt alone. The scale claim is narrower than the headline: the benefit of examples grows with size on synthetic, format and question-answering tasks, and is near zero at every size on many standard benchmarks.
Raschka's survey holds as a map: the 2025 block is still GPT's block with six parts swapped. What's thin is the evidence that each swap improves quality; most of it is efficiency.
PPO's recipe works, but the story that the clip keeps updates in a trust region didn't survive: Engstrom and colleagues found the ratios leave the band, and that code-level details matter as much as the loss.
GRPO's group-mean baseline works without a critic; the paper never runs PPO, and DeepSeek-R1's later comparison, one run per setting, has PPO close behind at λ = 1 (about 0.536 against 0.555 on MATH). And by the paper's own Figure 7, RL sharpens what the model can already do rather than extending it; Yue and colleagues find the base model ahead once K reaches the hundreds.

---

<p class="eyebrow">Week 4 · limitations the authors admit</p>

## What do the authors say they could not show?

<table class="rules">
  <tr><td>reading</td><td>own limitation</td></tr>
  <tr><td>GPT-3</td><td>weak at comparing two texts; the objective "weights every token equally"</td></tr>
  <tr><td>Raschka</td><td>training data "often not well documented": impact "difficult to determine"</td></tr>
  <tr><td>PPO</td><td>no limitations section; losing variants scattered, constants "chosen heuristically"</td></tr>
  <tr class="total"><td>GRPO</td><td>fails on triangles and ellipses; the arXiv result "with a grain of salt"</td></tr>
</table>

<p class="footnote">Brown et al. §5; Raschka, Introduction; Schulman et al. §4; Shao et al. §6, §5.1.2</p>

Note:
In their own words.
GPT-3, §5, is unusually candid: little better than chance on some comparison tasks, a possible but untested explanation in left-to-right training, and the deeper limit that the objective weights every token equally and lacks a notion of what matters; they suggest learning the objective from humans or fine-tuning with reinforcement learning, which is where PPO comes in.
Raschka says the data and training vary widely and are often not well documented, so the impact of each architecture choice is difficult to determine.
PPO has no limitations section; the admissions are scattered, mostly about variants that lost, and the adaptive-KL constants are "chosen heuristically".
DeepSeekMath admits the model can't handle triangles and ellipses, possibly a data selection bias, and asks for its arXiv finding to be taken with a grain of salt.

---

<p class="eyebrow">Week 4 · extensions</p>

## What do these readings leave open?

<table class="rules">
  <tr><td>question</td><td>why it is open</td></tr>
  <tr><td>does a large model learn the task in context, or recognise it?</td><td>mechanisms shown only in small models</td></tr>
  <tr><td>architecture or training: which does the work?</td><td>few swaps are ablated at matched data</td></tr>
  <tr><td>what does PPO's clip actually do?</td><td>code details and the loss were never separated</td></tr>
  <tr class="total"><td>can RL extend what a model can solve?</td><td>at large K, base models solve more</td></tr>
</table>

<p class="footnote">Inference-time compute and reasoning models: later weeks</p>

Note:
Four questions the readings point to.
First, in-context learning. Later work splits it into task recognition, present at every size, and task learning, which grows with scale: only the largest models follow flipped labels. How it works inside is still open.
Second, architecture versus training. Raschka suspects the "secret sauce" is in the training pipeline; few of the survey's swaps are ablated with the data held fixed, and those few disagree or lack error bars.
Third, the clip. Engstrom and colleagues show the code-level details carry much of PPO's performance; a clean ablation of the loss alone is still rare.
Fourth, RL with verifiable rewards. DeepSeekMath's Figure 7, and Yue and colleagues at larger K, find RL raising the chance of the first answer being right more than the set of problems ever solved.

---

<p class="eyebrow">Week 4 · as a reviewer</p>

## What would I ask the authors?

<table class="rules">
  <tr><td>reading</td><td>request</td></tr>
  <tr><td>GPT-3</td><td>sizes at matched compute; the spread over single prompts</td></tr>
  <tr><td>Raschka</td><td>for each swap, one ablation at fixed data</td></tr>
  <tr><td>PPO</td><td>the loss ablated with code fixed; many seeds, intervals</td></tr>
  <tr class="total"><td>GRPO</td><td>PPO on the same model and reward; memory measured</td></tr>
</table>

<p class="footnote">Each request is the cheapest experiment that would test the reading's main claim (ours)</p>

Note:
One request each.
GPT-3: its eight models grew in size and compute together, and each score averages over many random prompts, while users face one prompt. Sizes at matched compute, and the spread over single prompts, would show how much is scale and how much is prompting.
Raschka: the survey reads configurations; for each of the six swaps, one ablation with the data held fixed would say which changed quality and which only cost.
PPO: ablate only the loss (clip, KL penalty, none) with every code detail fixed, over many seeds with intervals. Engstrom came close.
GRPO: the paper's central practical claim, that dropping the critic saves memory without losing quality, is asserted, not measured. Run PPO on the same model, questions and reward model, and measure the memory.

---

<p class="eyebrow">Discussion</p>

## Questions for discussion

<table class="rules">
  <tr><td>reading</td><td>question</td></tr>
  <tr><td>GPT-3</td><td>was the limit the objective, or the lack of a way to steer it?</td></tr>
  <tr><td>Raschka</td><td>if the block barely changed, what in training does the work?</td></tr>
  <tr><td>PPO</td><td>if the clip doesn't keep updates small, how much of PPO does a language model need?</td></tr>
  <tr class="total"><td>GRPO</td><td>does RL with verifiable rewards ever extend what a model can solve?</td></tr>
</table>

<p class="footnote">GPT-3 question: Brown et al. §5 ("learning the objective function from humans"). GRPO question: Shao et al. Fig. 7; Yue et al. 2025</p>

Note:
One question per reading.
GPT-3: the authors named next-token prediction as a limit and suggested learning the objective from humans. Was the problem the objective itself, or that there was no way to steer the model toward what we want?
Raschka: five years of architecture changes are mostly about cost, the cache and active parameters. If quality gains came from somewhere else, where?
PPO: the clip doesn't keep ratios in the band, and the critic is the most expensive part. For a language model with one reward at the end, which parts of PPO earn their cost?
GRPO: RL raised Maj@K and the first-answer accuracy more than Pass@K at large K. Is RL with verifiable rewards a way to teach new skills, or a way to make a model reliably do what it already sometimes can?
