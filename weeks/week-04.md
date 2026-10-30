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
<p class="q"><b>Q.</b> Budget? <b>A.</b> 50 examples in 2,048 tokens: about 41 tokens each (ours)</p>

</div>
</div>
<div class="fig"><img src="img/week-04-gpt3-prompt.svg" alt="Illustration: three prompts for 3-digit addition. Zero-shot is 'Q: What is 556 plus 497? A:'. One-shot adds one solved addition problem. Few-shot adds two. The model should write 1053"></div>
</div>

<p class="footnote">Brown et al. 2020 · App. G (Fig. G.47, 3-digit addition format), §3.9.1. The paper uses $K$ = 50. Exact match: the answer must equal the reference string</p>

Note:
Here is what the model sees on the 3-digit addition task. The question format, "Q: What is 556 plus 497? A:", is the paper's own, from Appendix G. The demonstrations are ours, drawn the way the paper draws them, from the same task. The real run used fifty of them.
Nothing in the prompt says "you are a calculator". The model has to infer from the pattern that the next tokens should be a number, and which number. And the scoring is unforgiving: exact match, so "1053" is right and "1,053" or "1052" are wrong.
Check it: in the zero-shot version, what's left? Just the question. The question carries the instruction.

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

- same architecture as GPT-2
- one change: alternate dense and banded attention
- eight sizes, 125M to 175B
- all: 2,048-token context, 300B tokens
- bigger: larger batch, smaller learning rate

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

<p class="footnote">Brown et al. 2020 · §2.1, Table 2.1 (batch in tokens). Banded layers "similar to the Sparse Transformer" (Child et al. 2019, arXiv:1904.10509); no band width given. Learning rate $6.0\times10^{-4}$ (Small) to $0.6\times10^{-4}$ (175B)</p>

Note:
What's new in the architecture? Almost nothing, on purpose. "We use the same model and architecture as GPT-2", with one exception: "alternating dense and locally banded sparse attention patterns", every other layer seeing only a local band of earlier tokens, "similar to the Sparse Transformer". The paper gives no band width and no reason; the Sparse Transformer introduced such patterns to cut attention's quadratic cost. Positions aren't discussed, so GPT-2's learned absolute position embeddings carry over, the kind Week 3 contrasted with rotary embeddings (that's GPT-2's design; this paper doesn't restate it).
Why so ordinary? Because the question is about scale. Change the architecture too and a better score could come from either.
Eight sizes over three orders of magnitude. Bigger models get bigger batches and smaller learning rates, chosen by measuring the gradient noise scale. All share a 2,048-token context, about 1,430 words, and all are trained on the same 300 billion tokens. That last fact will matter.

---

<p class="eyebrow"><span class="paper">Brown et al. 2020</span> · §2.1 · Table 2.1, Table D.1</p>

## Where do 175 billion parameters come from?

<div class="cols">
<div class="text">

- attention: $Q, K, V, O$, each $d \times d$: $4d^2$
- MLP: widen $d$ to $4d$, back to $d$: $8d^2$
- one layer: $12d^2$; 96 layers: 173.9B
- embeddings: $(50{,}257 + 2{,}048) \times 12{,}288$ = 0.64B
- total 174.6B: Table D.1's count

</div>
<div class="text">

<div class="eq">$$N \approx 12\thinspace n_{\rm layers}\thinspace d^2 = 12 \times 96 \times 12288^2$$</div>

<p class="q"><b>Q.</b> Share in the embeddings?</p>
<p class="a"><b>A.</b> 0.64B of 174.6B: about 0.4% (ours)</p>
<p class="q"><b>Q.</b> What does $4d^2$ assume?</p>
<p class="a"><b>A.</b> Heads tile the width: $n_{\rm heads} \times d_{\rm head} = d$</p>

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

- sampled by quality, not size
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
- the reason: a 2020 scaling-law analysis
- so compute grows with $N$
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

<p class="footnote">Brown et al. 2020 · Table H.1 (every task at every size, in zero-, one- and few-shot). Symbol insertion: remove random symbols from a word; WebQuestions, TriviaQA: factual questions, no documents given; HellaSwag: pick the sensible ending; PIQA: physical common sense; ARC: school science exams</p>

Note:
The paper's central claim is about size: the value of examples grows with the model. The results sections mostly quote 175B numbers, but the appendix table H.1 has every task in every setting at every size, so we can test the claim task by task. On the right, few-shot minus zero-shot for a handful of tasks.
Three kinds of task. On some the gap grows strongly with size: symbol insertion ends at plus 59 points, 3-digit addition at plus 46, WebQuestions at plus 27; LAMBADA starts negative, examples hurting small models, and ends at plus 10. On others there's little or no gap at any size: HellaSwag, PIQA, ARC; the model either does the task from the question alone or not at all. And on TriviaQA the gap shrinks at the top.
Predict before I answer: why would it shrink? Zero-shot catches up, 41.8 at 13B to 64.3 at 175B. Our reading, not the paper's: the examples teach the answer format, and a big enough model gets the format from the question alone.

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

<p class="footnote">Brown et al. 2020 · §3.3, Table 3.4 (multi-bleu; SacreBLEU in App. H runs higher, De▸En 43.0). Unsupervised: XLM, MASS, mBART, trained without paired sentences; our row takes the best of the three in each column. Bold as in the paper. En English, Fr French, De German, Ro Romanian; En▸Fr is English to French. Few-shot $K$ = 64. 7% of training words are non-English</p>

Note:
Why is translation a good test? GPT-3 was given no deliberately paired data: it "learns from a blend of training data that mixes many languages together in a natural way", and only 7% of its words aren't English. Six directions, English with French, German and Romanian; few-shot uses 64 examples, a page or two of text.
Read the columns that end in English against those that start with it. Into English, few-shot GPT-3 beats the prior unsupervised systems, "reflecting its strength as an English LM", a language model. Out of English it trails, and English to Romanian is over 10 BLEU worse; the authors' guess is GPT-2's tokenizer, built for almost entirely English text.
Averaged over all six, few-shot is "similar average performance to prior unsupervised NMT work", neural machine translation. One example gives the biggest jump: on our averages, 22.0 zero-shot, 29.6 one-shot, 33.8 few-shot. Note the format: zero-shot is a question, one- and few-shot are "sentence equals". Our reading is that much of that jump is learning the format, then its English does the work.

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

<p class="footnote">Brown et al. 2020 · Fig. 3.10, §3.9.1: "even zero-shot performance of the full GPT-3 significantly outperforms few-shot learning for all smaller models". 2D+: 2-digit addition; 3D+: 3-digit addition. Forward pointer: Week 6's Schaeffer et al. ask whether such jumps come from exact-match scoring</p>

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

<p class="q"><b>Q.</b> What does this rule out?</p>
<p class="a"><b>A.</b> Verbatim lookup of these problems</p>
<p class="q"><b>Q.</b> And not?</p>
<p class="a"><b>A.</b> Other phrasings; frequent numbers being easier. No error counts given</p>

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

<p class="footnote">Brown et al. 2020 · §3.7, Table 3.8 (test server, $K$ = 32; CB, MultiRC, ReCoRD accuracy shown, F1 also given; the paper bolds the fine-tuned row). SuperGLUE: eight language-understanding tasks scored 0 to 100. BoolQ: yes/no questions about a passage; CB, RTE: does one sentence imply another; COPA: pick the cause or effect; WiC: same word sense in two sentences; WSC: pronoun resolution; MultiRC: reading with several correct answers; ReCoRD: fill in an entity in a news passage</p>

Note:
Why SuperGLUE? It is the standard suite for fine-tuned models, so it is the cleanest few-shot against fine-tuned comparison in the paper. Eight tasks, 32 examples in the prompt for each, scored on the test server.
Read the table by rows. The top row is the best fine-tuned system, 89.0 on average. GPT-3 few-shot gets 71.8: above fine-tuned BERT-Large, 69.0, but 17 points short of the state of the art. By task it beats BERT-Large on four of eight, COPA, WSC, MultiRC and ReCoRD, and comes close to the state of the art on COPA and ReCoRD. And on WiC it is at 49.4, which is chance for a yes/no task.
So "sometimes competitive" holds task by task, and "matches fine-tuning" does not hold on the suite. The next slides look at why some tasks fail.

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
- QuAC: "13 F1 below an ELMo baseline"
- ANLI: examples help only at 175B

<p class="q"><b>Q.</b> How much do examples help on ANLI?</p>
<p class="a"><b>A.</b> +0.1 at 13B, +5.7 at 175B</p>

</div>
</div>

<p class="footnote">Brown et al. 2020 · §3.6 to §3.8, §5; Tables 3.7, 3.8, 3.9. ANLI: adversarially written sentence pairs, three-way (follows, contradicts, unclear). QuAC: questions in a teacher-student dialogue; DROP: reading questions needing counting or arithmetic; RACE: English exams, h high school, m middle school; ELMo: an earlier word-embedding model. ANLI gains: few-shot minus zero-shot, Table H.1 (our arithmetic)</p>

Note:
Put the failures side by side. On WiC, whether a word means the same in two sentences, GPT-3 is at chance; the authors tried "a number of different phrasings and formulations" and none helped. On RTE only the largest model is "convincingly better than random". On reading comprehension it is far behind: QuAC is 13 F1 below an ELMo baseline, DROP is 36.5 against 89.1, RACE-h is 43 points behind (our subtraction).
What do they share? Each asks the model to compare two pieces of text, or to look back over a passage and give a short answer. And in the appendix table H.1, examples add only +0.1 points on ANLI Round 3 at 13B, and +5.7 at 175B. So for ANLI at least the failure is not a missing format that examples can supply: for most of the size range, examples don't help at all. We did not check the other tasks in this table.

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
- expected: "frequent, but ... not as large as feared"
- train and validation loss: gap barely grows with size

<p class="q"><b>Q.</b> What would overfitting look like here?</p>
<p class="a"><b>A.</b> Dashed (train) far below solid (validation), more for big models</p>

</div>
<div class="fig"><img src="img/week-04-gpt3-fig4-1.png" alt="Brown et al. Figure 4.1: training and validation cross-entropy loss against tokens elapsed up to 300 billion for every model size; dashed training lines sit only slightly below the solid validation lines at every size"></div>
</div>

<p class="footnote">Brown et al. 2020 · §4, Fig. 4.1: "the gap grows only minimally with model size and training time, suggesting that most of the gap comes from a difference in difficulty rather than overfitting". Cross-entropy: average negative log-probability per token, in nats</p>

Note:
Why does contamination matter more here than for earlier models? The training data is about two orders of magnitude bigger than GPT-2's, scraped from the web, and benchmark test sets are on the web. If the model has seen the answers, a high score tells you about memory, not about ability.
The authors' prior is that contamination "is likely to be frequent, but that its effects may not be as large as feared", because even the 175B model "does not overfit its training set by a significant amount". Figure 4.1 is that evidence: training loss, dashed, and validation loss, solid, for every size. The dashed lines sit a little below the solid ones, but the gap grows only minimally with size and with training time. The authors read the gap as a difference in difficulty between the two sets, not overfitting.
This is evidence about the model's loss on typical text. It says nothing about any one benchmark, which is what the next slides address.

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
<p class="q"><b>Q.</b> Where do most sit?</p>
<p class="a"><b>A.</b> On the zero line at every level</p>

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
<p class="q"><b>Q.</b> Their reply?</p>
<p class="a"><b>A.</b> "the sheer number of shifts close to zero suggests this is unlikely"</p>

</div>
</div>

<p class="footnote">Brown et al. 2020 · §4. Distribution: the clean subset may be systematically easier or harder than the full set. Our summary of what the check covers</p>

Note:
What the check shows: copying of test examples doesn't explain GPT-3's scores. Clean and full scores move together, and small models, which can't memorise much, show the same shifts as the large one.
What it doesn't show: that the model never met the tasks in other forms. An n-gram check misses paraphrases, translations and frequent patterns. And the authors name the deepest problem themselves: the clean subset might not be drawn from the same distribution as the original. Suppose dirty examples are easier, because they are popular and quoted online. Then memorisation might inflate the dirty score while the clean subset looks fine for a separate reason. Their reply is practical: so many shifts sit near zero that this would require a coincidence. That's a fair argument, not a proof.
Keep this in mind for the arithmetic claim, which leans on the same kind of check.

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
<p class="q"><b>Q.</b> Is this a result?</p>
<p class="a"><b>A.</b> No: a direction, with no experiment</p>

</div>
</div>

<p class="footnote">Brown et al. 2020 · §5: "scaling pure self-supervised prediction is likely to hit limits". PPO: proximal policy optimization; GRPO: group relative policy optimization (both later this week)</p>

Note:
This is the sentence that connects the paper to the rest of today. Next-token prediction treats every token as equally important. A useful assistant, though, "might be better thought of as taking goal-directed actions rather than just making predictions". The authors name three remedies: learn the objective from humans, fine-tune with reinforcement learning, or add other modalities such as images.
They don't test any of them. The second is what the next readings take up: PPO and GRPO, later today, change this signal.

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

- flip all labels, or use "Foo/Bar"
- only the largest follow the flip below chance
- text-davinci-002, all labels flipped: 90.3 ▸ 22.5
- base GPT-3, even 175B: only falls to chance
- instruction-tuned PaLM: follows flips less

<p class="q"><b>Q.</b> Is base GPT-3 "large" here?</p>
<p class="a"><b>A.</b> No: the authors count it "small"</p>

</div>
<div class="fig"><img src="img/week-04-gpt3-wei23-fig1.png" alt="Wei et al. Figure 1: regular in-context learning with natural labels, flipped-label in-context learning with swapped positive and negative labels, and semantically-unrelated-label in-context learning with Foo and Bar"></div>
</div>

<p class="footnote">Wei et al. 2023 · arXiv:2303.03846 · Fig. 1, §3. Models: PaLM-540B, OpenAI text-davinci-002 and code-davinci-002 follow flips; base davinci does not. "Instruction-tuned models are more reluctant to follow flipped labels": Flan-PaLM against PaLM; Wei et al. do not compare InstructGPT with GPT-3. Flipped-label: positive examples marked negative and the reverse</p>

Note:
Wei et al. push on Min's result from the other side. Flip every label, so positive reviews are marked negative, and see whether the model follows the examples or its prior. A model that really learns the mapping from the prompt should go below chance, because the right answer under the flip is the opposite of the sensible one.
Only the largest models do. PaLM and OpenAI's text-davinci-002 and code-davinci-002 follow the flip; text-davinci-002 drops from 90.3% to 22.5%. Base GPT-3, even at 175B, only falls to chance, and the authors count every base GPT-3 model as small here. Instruction tuning works the other way: Flan-PaLM, the instruction-tuned version of PaLM, follows flipped labels less than PaLM does. (Wei et al. compare PaLM with Flan-PaLM, not GPT-3 with InstructGPT, because they cannot tell if instruction tuning is the only difference there.)
So the ability to override a prior from the examples grows with scale, but it's not what the base GPT-3 shows.

---

<p class="eyebrow"><span class="paper">Brown et al. 2020</span> · §6.2.1 · Gender</p>

## How do you measure gender bias in a language model?

<div class="cols">
<div class="text">

- prompt: "The {occupation} was a"
- compare the chance of male and female words
- 83% of 388 occupations lean male
- midwife, nurse, receptionist lean female

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

<p class="footnote">Brown et al. 2020 · §6.2.1, Table 6.1. Last column: $e^{\text{score}}$ (ours): the mean of logs is a geometric mean over occupations, so the typical occupation gives a female word that fraction of a male word's probability. Winogender (pronoun resolution): 175B most accurate, 64.17%. "Beautiful" co-occurs with female words 158 times</p>

Note:
The first of three preliminary probes. Prompt "The occupation was a", and compare how likely a male word is against a female word. The bias score is the average, over occupations, of the log of the ratio of female to male probability. Zero would be no bias. It is negative: minus 1.11.
Read it as a ratio. An average of logs exponentiates to a geometric mean over occupations, so for the typical occupation a female word gets e to the minus 1.11, about 0.33, of the male word's probability. With "competent" in the prompt the ratio drops to 0.12, about an eighth. With "incompetent" it barely moves, 0.32. The paper doesn't say why; a plausible reading of ours is that praise for competence co-occurs more often with men in the training text.
On Winogender pronoun resolution, 175B was the most accurate model, 64.17%. And female pronouns co-occur with appearance words such as "beautiful", 158 times. The paper's summary line: "internet-trained models have internet-scale biases". It links back to the data slide: the mixture decides what the model reads most.

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

<p class="q"><b>Q.</b> Do they admit it?</p>
<p class="a"><b>A.</b> Not about prompt choice. §5 only says "much higher variance in performance than humans on standard benchmarks"</p>
<p class="q"><b>Q.</b> Does it sink the argument?</p>
<p class="a"><b>A.</b> No: the averages are robust. But "how good is my prompt?" is untested (press ↓)</p>

</div>
</div>

<p class="footnote">Our critique, not in the paper. Brown et al. 2020 · §2.4; SuperGLUE: "we sampled a new set of examples to use in the context for each problem" (except WSC, MultiRC). App. C seed check: symbol insertion 66.9 vs 67.2, SAT 65.8 vs 65.2</p>

Note:
It is tempting to say GPT-3's scores come from "one random prompt". They don't. Every test question gets a fresh random draw of K examples, and for SuperGLUE a new set for each problem, except WSC and MultiRC. So each score averages over thousands of different prompts, and in the two rows we checked, re-running with a different draw of examples moves scores by under a point: in the contamination table symbol insertion is 66.9 against 67.2, SAT 65.8 against 65.2.
The real gap is the other way round. In use, people write one prompt and reuse it for every input. The averaged scores say nothing about how much a single fixed prompt varies.
Do the authors admit it? Not about prompt choice: §5 mentions higher variance than humans on benchmarks, in a passage about calibration. Does it sink the argument? No, the averages are robust. But the most practical question is untested here. Later work measured it.

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

<p class="q"><b>Q.</b> Do they admit it?</p>
<p class="a"><b>A.</b> Format: yes, in a caption. Compute: no; they followed the scaling-law advice</p>
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
Reading 2 of 4. Not a paper: a long blog post by Sebastian Raschka, first published in July 2025 and updated until April 2026, that draws about thirty open-weight models as block diagrams. The blog is organised by model; we reorganise it by mechanism, derive each change, put numbers on it, and ask what evidence exists for it: an ablation in a paper, or only Raschka's reading.

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
<p class="q"><b>Q.</b> What is left out?</p>
<p class="a"><b>A.</b> Data, training, benchmarks</p>

</div>
<div class="fig"><img src="img/week-04-raschka-fig1-lineup.png" alt="Raschka Figure 1, two of its six panels: DeepSeek V3 (671B) and Qwen3 235B-A22B; both are the same stack of embedding, repeated blocks of attention and a mixture-of-experts feed-forward with RMSNorm, and an output layer, differing in the details"></div>
</div>

<p class="footnote">Raschka, "The Big LLM Architecture Comparison", Ahead of AI, 19 July 2025, version of 2 April 2026 · Fig. 1 (two of its six models). KV cache: the stored keys and values of past tokens, explained shortly</p>

Note:
Raschka's first paragraph: looking from GPT-2 to DeepSeek V3 and Llama 4, "one might be surprised at how structurally similar these models still are." Positions became rotations, attention heads started sharing keys and values, the activation function changed. "Have we truly seen groundbreaking changes, or are we simply polishing the same architectural foundations?"
The figure shows two of the six models in his first figure, DeepSeek V3 and Qwen3 235B-A22B: the same stack, with the same parts in nearly the same places. So the useful question is the one underneath: if the block works, why change it? Sorted by what they do, almost all changes attack one of three costs: the arithmetic each token needs, the cache of keys and values that grows with context, and training runs that blow up. A smaller group is about long context. That sorting is ours. Some changes are also claimed to improve quality, but few such claims have more than one ablation behind them.
What the blog leaves out on purpose: data, training recipes and mostly benchmarks, because these "vary widely and are often not well documented". So it can tell us what each model is, not which choice made which model better.

---

<p class="eyebrow"><span class="paper">Raschka 2025</span> · §13 · Fig. 38</p>

## Who released what, and when?

<div class="rows">
<div class="points">
<div class="text">

- Dec 2024: DeepSeek V3, base of R1
- 2025: OLMo 2, Gemma 3, Llama 4, Qwen3, <span style="white-space:nowrap">gpt-oss</span>, Kimi K2
- a branch: attention hybrids

</div>
<div class="text">

<p class="q"><b>Q.</b> Are all of them giant mixtures of experts?</p>
<p class="a"><b>A.</b> No: Gemma 3, OLMo 2, SmolLM3 and six Qwen3 sizes are dense</p>

</div>
</div>
<div class="fig"><img src="img/week-04-raschka-fig38-timeline.png" alt="Raschka Figure 38: a timeline from GPT (2018) through OLMo 2, DeepSeek V3/R1, Gemma 3, Mistral 3.1, Llama 4, Qwen3, SmolLM 3, Kimi K2, gpt-oss, GLM 4.5, DeepSeek V3.1, GLM 4.6 and MiniMax-M2, with a branch of attention hybrids: MiniMax-M1, Qwen3-Next, DeepSeek V3.2-Exp"></div>
</div>

<p class="footnote">Raschka 2025 · Fig. 38. Dates are the blog's; it puts OLMo 2 in 2024 here but says "released in January" 2025 in the text. R1: DeepSeek-R1, arXiv:2501.12948</p>

Note:
The week's syllabus title is "Current Model Landscape", so here is the landscape. Raschka's timeline: one line of decoder-style transformers from GPT in 2018 to MiniMax-M2, and a branch of attention hybrids splitting off in 2025, which we reach at the end.
The first model in the blog, DeepSeek V3 from December 2024, is the base of DeepSeek R1, and R1's paper says how: "we build upon DeepSeek-V3-Base and employ Group Relative Policy Optimization (GRPO)", reading 4 of this week. So this reading is the bridge between GPT-3's block and the reinforcement learning that follows.
And it is not all giant mixture-of-experts models. Many of the models are dense, which is the next table's first half.

--

<p class="eyebrow"><span class="paper">Raschka 2025</span> · lineup, dense models (sub-slide)</p>

## Which dense models changed what?

<table class="rules" style="font-size:19px">
  <tr><td>model</td><td>attention</td><td>local : global</td><td>norm</td><td>positions</td></tr>
  <tr><td>GPT-3 175B</td><td>MHA</td><td>1 : 1, banded</td><td>pre</td><td>learned</td></tr>
  <tr><td>OLMo 2 7B</td><td>MHA</td><td>none</td><td>post, QK-norm</td><td>RoPE</td></tr>
  <tr><td>Gemma 3 27B</td><td>GQA</td><td>5 : 1, 1024</td><td>pre + post, QK-norm</td><td>RoPE, two bases</td></tr>
  <tr><td>Mistral Small 3.1*</td><td>GQA</td><td>window off</td><td>n/a</td><td>n/a</td></tr>
  <tr><td>SmolLM3 3B*</td><td>GQA</td><td>none</td><td>n/a</td><td>NoPE every 4th</td></tr>
  <tr><td>Olmo 3 7B*</td><td>MHA</td><td>3 : 1, 4096</td><td>post</td><td>RoPE</td></tr>
  <tr><td>Gemma 4 31B*</td><td>GQA, V = K</td><td>5 : 1</td><td>pre + post</td><td>25% rotated</td></tr>
</table>

<p class="footnote">Raschka 2025 and each model's report; * Raschka only; n/a: not in our sources. MHA, GQA: multi-head, grouped-query attention; QK-norm: normalised queries and keys; RoPE, NoPE: rotary, no position embedding. Each column is a later slide</p>

Note:
Optional: the lineup in two tables, dense models first. Rows without a star are checked against each model's own report; rows with a star are Raschka's reading of a configuration file or a company blog. n/a means we have no source for that cell, not that the model has none. Each column is one of the swaps that follow, so come back to these tables at the end: most rows differ from GPT-3 in four or more of the six swaps, so almost every model is a different mix of the same few swaps.

--

<p class="eyebrow"><span class="paper">Raschka 2025</span> · lineup, mixtures of experts (sub-slide)</p>

## Which mixtures of experts changed what?

<table class="rules" style="font-size:18px">
  <tr><td>model</td><td>total / active</td><td>attention</td><td>local : global</td><td>norm</td><td>positions</td></tr>
  <tr><td>DeepSeek V3</td><td>671B / 37B</td><td>MLA</td><td>none</td><td>pre*</td><td>RoPE, decoupled</td></tr>
  <tr><td>Llama 4 Maverick*</td><td>400B / 17B</td><td>GQA</td><td>none</td><td>n/a</td><td>RoPE, some NoPE</td></tr>
  <tr><td>Qwen3 235B-A22B</td><td>235B / 22B</td><td>GQA 64 / 4</td><td>none</td><td>pre, QK-norm</td><td>RoPE</td></tr>
  <tr><td>Kimi K2*</td><td>1T / 32B</td><td>MLA</td><td>none</td><td>n/a</td><td>RoPE</td></tr>
  <tr><td>gpt-oss-120b</td><td>116.8B / 5.1B</td><td>GQA 64 / 8</td><td>1 : 1, 128</td><td>pre</td><td>RoPE, YaRN</td></tr>
  <tr><td>Qwen3-Next*</td><td>80B / 3B</td><td>3 linear : 1 full</td><td>hybrid</td><td>QK-norm</td><td>partial RoPE</td></tr>
  <tr><td>MiniMax-M2*</td><td>230B / 10B</td><td>GQA</td><td>window off</td><td>QK-norm</td><td>partial RoPE</td></tr>
</table>

<p class="footnote">Raschka 2025 and each model's report; * Raschka only; n/a: not in our sources. Total / active: weights. MLA: multi-head latent attention; GQA 64 / 4: 64 query heads, 4 key-value heads; YaRN: a RoPE rescaling for long context</p>

Note:
The mixtures of experts, which the dense table leaves out. Total over active is the pair that matters later: DeepSeek V3 holds 671 billion weights and uses 37 billion for any one token. Stars mean Raschka's reading of a configuration file or a company blog, not a paper; n/a means we have no source for the cell.

---

<p class="eyebrow"><span class="paper">Raschka 2025</span> · GPT-3 baseline · Brown et al. 2020 §2.1</p>

## What is in GPT-3's block?

<div class="cols">
<div class="text">

- 96 blocks, $d_{\rm model}$ = 12288
- MHA (multi-head attention): 96 heads of 128, each with its own K, V (keys, values)
- dense and "locally banded" layers alternate
- pre-norm LayerNorm; learned positions
- FFN: $4d$ wide, GELU, every token uses it

</div>
<div class="text">

<p class="q"><b>Q.</b> Weights per block, ignoring biases?</p>
<p class="a"><b>A.</b> $12 d^2$: attention $4d^2$, FFN $8d^2$</p>
<p class="q"><b>Q.</b> For GPT-3?</p>
<p class="a"><b>A.</b> $12 \times 96 \times 12288^2$ = 173.9B</p>
<p class="q"><b>Q.</b> How much is FFN?</p>
<p class="a"><b>A.</b> 116.0B: two thirds</p>

</div>
</div>

<p class="footnote">Brown et al. 2020 · arXiv:2005.14165 · §2.1, Table 2.1. Learned positions and GELU (Gaussian error linear unit) come with GPT-2, not stated in GPT-3's text. FFN: feed-forward network. Counts are ours: embeddings (about 0.6B), biases and norms are not in 173.9B, the paper says 175B</p>

Note:
The baseline is reading 1. GPT-3 175B is one decoder block repeated 96 times: multi-head attention with 96 heads of size 128, so every head keeps its own keys and values; layers that alternate between full attention and "locally banded" attention, after the Sparse Transformer; LayerNorm before each sublayer; a learned vector per position added once at the input; and a feed-forward network four times as wide as the model, used by every token.
The count we need later: each block has four d-by-d attention matrices and two d-by-4d feed-forward matrices, 12 d squared, ignoring biases and norms. For GPT-3 that's 173.9 billion, and the feed-forward part alone is 116 billion. The paper's 175 billion also counts the token and position embeddings, about 0.6 billion by our estimate, plus biases and norms; the match is close, not exact. Two thirds of the weights are in the feed-forward networks, and every token uses all of them.

---

<p class="eyebrow"><span class="paper">Raschka 2025</span> · Introduction · the six swaps</p>

## Which six parts were swapped?

<table class="rules" style="font-size:21px">
  <tr><td>swap point</td><td>2025 replacement</td><td>what it saves or fixes</td></tr>
  <tr><td>who caches K and V</td><td>GQA, MLA</td><td>memory: KV cache</td></tr>
  <tr><td>FFN activation</td><td>gated: SwiGLU, GeGLU</td><td>quality per weight (claimed)</td></tr>
  <tr><td>the FFN itself</td><td>mixture of experts</td><td>arithmetic per token</td></tr>
  <tr><td>how far attention looks</td><td>sliding windows + a few global layers</td><td>memory: cache at long context</td></tr>
  <tr><td>where the norm sits</td><td>post-norm, sandwich (norm before and after), QK-norm</td><td>training stability</td></tr>
  <tr><td>how positions enter</td><td>RoPE with bigger bases, NoPE, partial RoPE</td><td>long context</td></tr>
</table>

<p class="q" style="margin-top:22px"><b>Q.</b> Which swap cuts arithmetic per token, not cache memory?</p>
<p class="a"><b>A.</b> The mixture of experts</p>

<p class="footnote">Raschka 2025 · organised by mechanism (ours). KV cache: stored keys and values, so new tokens need not recompute the past (next slides). GQA, MLA: grouped-query, multi-head latent attention. QK-norm: normalised queries and keys. RoPE, NoPE: rotary, no position embedding</p>

Note:
This table is the whole lecture in one picture. Almost every model in the blog keeps GPT's skeleton and swaps one or more of six parts. Two swaps are about the KV cache: who caches keys and values, and how far attention looks. One, the mixture of experts, is about arithmetic per token. One is claimed to give better quality per weight, the gated activation. One is about training stability, where the norm sits. One is about long context, how positions enter. The rest of the section derives each row, starting with why the cache matters at all.

--

<p class="eyebrow"><span class="paper">Raschka 2025</span> · small differences (sub-slide)</p>

## What else changes in a configuration file?

<div class="cols">
<div class="text">

- no biases: OLMo, Qwen3
- tied embeddings: Gemma 2; Qwen3 up to 4B
- vocabularies grew 2.5 to 5x

</div>
<div class="text">

<table class="rules" style="font-size:18px">
  <tr><td>model</td><td>vocabulary size</td></tr>
  <tr><td>GPT-2</td><td>50,257</td></tr>
  <tr><td>DeepSeek-V3</td><td>128K</td></tr>
  <tr><td>Qwen3</td><td>151,669</td></tr>
  <tr><td>gpt-oss</td><td>201,088</td></tr>
  <tr><td>Gemma 2</td><td>256,128</td></tr>
</table>

</div>
</div>

<p class="footnote">GPT-2's BPE (byte-pair encoding) vocabulary, Radford et al. 2019, not in our sources; OLMo 2 arXiv:2501.00656 §3 ("We exclude all bias terms"); Qwen3 arXiv:2505.09388 §2; Gemma 2 arXiv:2408.00118 Table 1; DeepSeek-V3 arXiv:2412.19437 §4.1; gpt-oss arXiv:2508.10925 §2.3. Tied: input embedding and output layer share one matrix. Ratios ours</p>

Note:
Optional. Diff a 2025 configuration against GPT-3 and three small items show up first. Bias terms are gone in OLMo and Qwen3 (gpt-oss and GLM-4.5 bring attention biases back). The input embedding and output layer often share one matrix in small models: all Gemma 2 sizes, Qwen3 up to 4B, not Qwen3 8B and larger. And vocabularies are two and a half to five times GPT-2's 50,257 (DeepSeek-V3 2.5x, Qwen3 3x, gpt-oss 4x, Gemma 2 5x), to cover many languages; Gemma's 256K vocabulary is "designed to work on a large number of languages".

---

<p class="eyebrow"><span class="paper">Raschka 2025</span> · what a token costs · DeepSeek-V2 §2.1.1</p>

## What does generating one token cost?

<div class="cols">
<div class="text">

- prefill: whole prompt at once, busy arithmetic
- decode: one token at a time
- weights: one multiply and one add each, about $2N$ FLOPs; all $N$ read
- KV cache: the keys and values of past tokens, kept so they are not recomputed
- per token: one key, one value per head, per layer

<div class="eq" style="margin-top:16px">$$2 \times n_h \times d_h \times n_{\rm layers} = 2{,}359{,}296$$</div>

<p class="note-line" style="font-size:15px;margin-top:2px">$n_h$ heads, $d_h$ head size, $n_{\rm layers}$ layers (GPT-3: 96, 128, 96)</p>

</div>
<div class="text">

<p class="q"><b>Q.</b> In bytes for GPT-3?</p>
<p class="a"><b>A.</b> 4.72 MB per token; 9.66 GB per 2,048-token user</p>
<p class="q"><b>Q.</b> Why not cache queries?</p>
<p class="a"><b>A.</b> A past query is never used again</p>

</div>
</div>

<p class="footnote">DeepSeek-V2 arXiv:2405.04434 §2.1.1 (MHA, multi-head attention, caches $2 n_h d_h l$ elements). FLOPs: floating-point operations. GPT-3 sizes, Table 2.1; 16-bit numbers assumed; ours</p>

Note:
Before any swap, ask what is expensive when a model serves users. Serving has two phases. Prefill reads the whole prompt in one pass: every weight multiplies hundreds of tokens at once, so the hardware is busy doing arithmetic. Decode writes the answer one token at a time, and that is where the swaps in this reading aim.
For each new token: every weight is used for one multiply and one add, so a dense model with N weights does about 2N operations, and reads all N weights to do it. And in every attention layer the new query is compared with the keys of every earlier token and mixes their values. Those keys and values are stored, not recomputed: that is the KV cache. Queries aren't stored, because a past token's query is never used again.
GPT-3: 2 times 96 heads times 128 times 96 layers, 2.36 million numbers per token. At two bytes each, 4.7 megabytes per token, 9.7 gigabytes for one 2,048-token conversation.

---

<p class="eyebrow"><span class="paper">Raschka 2025</span> · what a token costs</p>

## Why is decoding limited by memory, not arithmetic?

<div class="cols wide-fig">
<div class="text">

- batch 1: 2 FLOPs per 2-byte weight
- 1 FLOP per byte read
- a GPU: a few hundred per byte
- batch $B$: weights shared, $B$ FLOPs per byte
- the cache is per user: never shared

</div>
<div class="fig"><img src="img/week-04-raschka-decode.png" alt="Illustration: gigabytes read per decoding step for GPT-3 against the number of users; weights stay at 350 GB, the KV cache grows by 9.66 GB per user and equals the weights at 36 users"></div>
</div>

<p class="footnote">Illustration, our arithmetic: GPT-3 at 16 bits, weights 350 GB, each user at 2,048 tokens. "A few hundred" is a vendor figure for current GPUs (graphics processing units), not from a reading. DeepSeek-V2 §2.1.1: the cache "limits the maximum batch size and sequence length"</p>

Note:
Count bytes against operations. A 16-bit weight is two bytes, and at batch one it is used for two operations: one operation per byte read. A current GPU can do a few hundred operations in the time it reads a byte, so at batch one the arithmetic units mostly wait. Decode is memory-bound.
The usual fix is batching: serve many users at once and each weight read serves all of them. But batching only shares the weights. Each user's cache belongs to that user and is read for that user alone.
The figure: GPT-3's weights are 350 gigabytes, read once per step however many users there are. The cache grows by 9.7 gigabytes per user. At about 36 users the cache equals the weights; beyond that, the cache is most of what is read, and it limits how many users fit at all. That is why so many swaps go after the cache.

---

<p class="eyebrow"><span class="paper">Raschka 2025</span> · §1.1 · Fig. 2</p>

## Do the heads need their own keys and values?

<div class="cols wide-fig">
<div class="text">

- MHA (multi-head): every head its own key, value
- GQA (grouped-query): a group of query heads shares one key, one value
- MQA (multi-query): one key, one value for all heads
- "groups": a count (DeepSeek) or a size (Gemma)

</div>
<div class="fig"><img src="img/week-04-raschka-fig2-gqa.png" alt="Raschka Figure 2: multi-head attention with four query heads each paired with its own key and value, next to grouped-query attention where heads 1 and 2 share one key and value and heads 3 and 4 share another"></div>
</div>

<p class="footnote">Raschka 2025 · §1.1, Fig. 2. MQA: Shazeer 2019. DeepSeek-V2's $n_g$ is the number of key-value heads; Gemma 2's "num_groups = 2" is 2 queries per key-value head</p>

Note:
In multi-head attention each head has its own query, key and value projections; that's the point of having many heads. But only keys and values get cached, for every head.
Grouped-query attention asks: do the heads need their own keys and values, or only their own queries? Split the query heads into groups and let each group share one key head and one value head. Raschka's figure has four query heads and two key-value pairs. At the extreme, all heads share one: multi-query attention.
A warning about the word "groups". DeepSeek's papers count groups, which equals the number of key-value heads. Gemma 2 writes "num_groups = 2" for 32 query heads and 16 key-value heads, so there it means the group size. We just say key-value heads.

---

<p class="eyebrow"><span class="paper">Raschka 2025</span> · §1.1 · DeepSeek-V2 · Table 1, Fig. 3</p>

## How much does sharing save?

<div class="rows">
<div class="points">
<div class="text">

<div class="eq">$$\text{per token, MHA: } 2 n_h d_h n_{\rm layers}\qquad \text{GQA: } 2 n_{\rm kv} d_h n_{\rm layers}$$</div>

- Qwen3-235B: 64 queries share 4 KV heads: 1/16
- gpt-oss: 1,024 vs 8,192 per layer: 1/8
- Gemma 2 27B: 4,096 vs 8,192 per layer: 1/2

</div>
<div class="text">

<p class="q"><b>Q.</b> GPT-3 with 8 KV heads?</p>
<p class="a"><b>A.</b> $96/8$ = 12 times less</p>

</div>
</div>
<div class="fig"><img src="img/week-04-raschka-dsv2-fig3.png" alt="DeepSeek-V2 Figure 3: MHA with a key and value per query head, GQA with one key-value pair per two queries, MQA with one for all, and MLA caching one compressed latent vector projected up to keys and values; hatched boxes are cached during inference"></div>
</div>

<p class="footnote">DeepSeek-V2 arXiv:2405.04434 · Table 1 (elements per token), Fig. 3 (hatched = cached). Qwen3 arXiv:2505.09388 Table 2; gpt-oss arXiv:2508.10925 §2.2; Gemma 2 arXiv:2408.00118 Table 1. Ratios ours</p>

Note:
DeepSeek-V2's table gives the cache per token: MHA stores 2 times heads times head size times layers; GQA replaces the number of heads by the number of key-value heads. So the saving is just the number of query heads per key-value head.
Three real models. Qwen3-235B: 64 query heads on 4 key-value heads, a sixteenth of MHA's cache. gpt-oss: 64 query heads of size 64 on 8 key-value heads, 1,024 numbers per layer per token instead of 8,192. Gemma 2 27B shares only in pairs: 4,096 against 8,192 per layer, half the cache.
Gemma 4, per Raschka, goes further on its global layers: values equal keys, so only one tensor is stored there and the factor of 2 in the formula becomes 1. No ablation is given for that.
The DeepSeek figure is useful for the next slides too (DeepSeek-V2's Fig. 3, not Raschka's): hatched boxes are what's cached, and the rightmost scheme caches only one small vector.

---

<p class="eyebrow"><span class="paper">Raschka 2025</span> · §1.1 · DeepSeek-V2 · Table 8 · Gemma 2 · Table 8</p>

## Does sharing keys and values hurt?

<div class="cols">
<div class="text">

<table class="rules" style="font-size:19px">
  <tr><td>DeepSeek-V2, dense 7B</td><td>MQA</td><td>GQA (8 groups)</td><td>MHA</td></tr>
  <tr><td>BBH</td><td>33.2</td><td>35.6</td><td>37.0</td></tr>
  <tr><td>MMLU</td><td>37.9</td><td>41.2</td><td>45.2</td></tr>
  <tr><td>C-Eval</td><td>30.0</td><td>37.7</td><td>42.9</td></tr>
  <tr><td>CMMLU</td><td>34.6</td><td>38.4</td><td>43.5</td></tr>
  <tr><td>Gemma 2, 9B (avg of 4)</td><td></td><td>50.8</td><td>50.3</td></tr>
</table>

</div>
<div class="text">

<p class="q"><b>Q.</b> Which is right?</p>
<p class="a"><b>A.</b> Neither settles it: no error bars, presumably one run each</p>
<p class="q"><b>Q.</b> What differs?</p>
<p class="a"><b>A.</b> Sharing strength, data, scale, benchmarks</p>

</div>
</div>

<p class="footnote">DeepSeek-V2 App. D.1, Table 8 (1.33T tokens, params matched "by adjusting the number of layers"); Gemma 2 Table 8 (benchmarks unnamed). BBH: 23 hard BIG-Bench reasoning tasks; MMLU: 57-subject multiple-choice exam; C-Eval, CMMLU: Chinese multiple-choice exams</p>

Note:
Raschka says GQA "performs comparably to standard MHA", citing the GQA paper and Llama 2, then prints a DeepSeek-V2 table where it doesn't. We can check two ablations.
DeepSeek-V2: three dense 7B models on 1.33 trillion tokens, identical except attention, parameter counts matched by adjusting depth. The order is the same on every benchmark: MHA beats GQA beats MQA, 4 points on MMLU from GQA to MHA. Gemma 2: two 9B models, MHA 50.3, GQA 50.8 on the average of four unnamed benchmarks: "few changes".
So one lab finds GQA 4 points worse, another half a point better. Gemma shares keys only between pairs of queries; DeepSeek's dense ablation doesn't state its head count. Data, scale and benchmarks differ, and neither table has error bars. What it shows: sharing is sometimes cheap. What it doesn't: that it's free, or that it's clearly worse.

---

<p class="eyebrow"><span class="paper">Raschka 2025</span> · §1.1 · Raschka Fig. 3 · DeepSeek-V2 §2.1.2</p>

## Steps 1 and 2: why compress instead of share?

<div class="cols wide-fig">
<div class="text">

<div class="eq">$$c_t^{KV} = W^{DKV} h_t \in \mathbb{R}^{d_c}$$</div>

<div class="eq">$$k_t = W^{UK} c_t^{KV},\quad v_t = W^{UV} c_t^{KV}$$</div>

- step 1, compress: $h_t$, token $t$'s hidden state, ▸ a small latent $c_t^{KV}$
- step 2, expand: keys and values for all heads from $c_t^{KV}$
- cache $c_t^{KV}$ only: $d_c \ll 2 n_h d_h$
- $W^{UK} W^{DKV}$ replaces the key matrix: rank at most $d_c$
- the shape of LoRA's $BA$ (Week 2)

</div>
<div class="fig"><img src="img/week-04-raschka-fig3-mla.png" alt="Raschka Figure 3, MLA and MHA panels: at inference step t the input is projected by W_dkv to a compressed key and value, which W_uk and W_uv expand to key and value, next to regular MHA with separate W_q, W_k, W_v; a note says the key idea reduces memory usage in the KV cache"></div>
</div>

<p class="footnote">Raschka 2025 · §1.1, Fig. 3 (MLA and MHA panels); DeepSeek-V2 arXiv:2405.04434 §2.1.2. D: down-projection, U: up-projection; $d_c$: latent size. The position (RoPE) part of the key is step 5. LoRA: low-rank adaptation</p>

Note:
DeepSeek-V2's authors read their Table 8 firmly: GQA and MQA "require a smaller magnitude of KV cache, but their performance does not match MHA". So instead of throwing away key and value heads, store a compressed version of all of them.
Step one, compress: for each token, one down-projection of its hidden state h to a small vector of size d_c. That latent is the only thing cached. Step two, expand: two up-projections recover keys and values for all heads.
So the key projection has become a product of two thin matrices, a rank-d_c factorisation: in MLA the product is the key projection by construction, not an approximation of a bigger matrix. It's the same shape as the B times A update in LoRA from Week 2, used here to shrink what's stored rather than what's trained. The paper's keys also have a second, position-carrying part, which step 5 adds.

---

<p class="eyebrow"><span class="paper">Raschka 2025</span> · §1.1 · DeepSeek-V2 §2.1.2</p>

## Step 3: can we skip expanding the keys?

<div class="cols">
<div class="text">

<div class="eq">$$q_{t,i}^\top \big(W_i^{UK} c_j\big) = \big(W_i^{UK\top} q_{t,i}\big)^\top c_j$$</div>

- fold $W^{UK}$ into the query side: a one-off matrix product, not applied to every cached key
- fold $W^{UV}$ into the output matrix
- compare the query with the latent directly

</div>
<div class="text">

<p class="q"><b>Q.</b> Raschka: "an extra matrix multiplication"?</p>
<p class="a"><b>A.</b> Without folding, yes; folded, no keys are built</p>
<p class="q"><b>Q.</b> Why does it work?</p>
<p class="a"><b>A.</b> Matrix products associate</p>

</div>
</div>

<p class="footnote">DeepSeek-V2 §2.1.2: "$W^{UK}$ can be absorbed into $W^{Q}$, and $W^{UV}$ can be absorbed into $W^{O}$, we even do not need to compute keys and values out for attention". $q_{t,i}$: head $i$'s query at step $t$; $c_j$: token $j$'s cached latent; $W_i^{UK}$: rows producing head $i$'s key</p>

Note:
Raschka describes the direct way: project the latents back up before use, an extra matrix multiplication. DeepSeek-V2 points out a shortcut at inference.
The score for head i is the query dotted with the key, and the key is the up-projection times the cached latent. Matrix products associate, so you can move the up-projection onto the query side: multiply the query by its transpose (a product we can fold into the query weights once, for the static form), then compare directly with the latent. The same goes for the values and the output matrix. In the paper's words, "we even do not need to compute keys and values out for attention."

---

<p class="eyebrow"><span class="paper">Raschka 2025</span> · §1.1 · DeepSeek-V3 sizes</p>

## Step 4: is absorbing cheap?

<div class="cols">
<div class="text">

- absorbed, 131,072 tokens: about 2.2 TFLOPs per token
- re-expand every latent instead: about 268 TFLOPs
- hypothetical MHA cache: 0.65 TFLOPs, but 524 GB
- MLA: 9.2 GB read for 2.2 TFLOPs

</div>
<div class="text">

<p class="q"><b>Q.</b> FLOPs per byte?</p>
<p class="a"><b>A.</b> MLA about 240; MHA about 1.2</p>
<p class="q"><b>Q.</b> So is 3.4x more arithmetic bad?</p>
<p class="a"><b>A.</b> No: the GPU was waiting on memory anyway</p>

</div>
</div>

<p class="footnote">Our arithmetic at DeepSeek-V3 sizes (128 heads, 61 layers, latents 576 and 512). TFLOPs: $10^{12}$ FLOPs per generated token</p>

Note:
What does it cost? After absorbing, each of 128 heads compares its query with 576-number latents and mixes 512-number latent values. At 131 thousand tokens of context that's about 2.2 teraflops per generated token.
Compare the alternatives. Keep the latent cache but don't absorb: then every cached latent must be re-expanded into keys and values every step, about 268 teraflops. So given the latent cache, absorbing is more than a hundred times cheaper. Or cache full keys and values, as in a hypothetical MHA version of the model (keys 192, values 128 per head): attention is only 0.65 teraflops, but the cache is 524 gigabytes instead of 9.
So against MHA, MLA reads 57 times fewer bytes for about 3.4 times more arithmetic. Use the measure from the decode slide: MLA does about 240 operations per byte read, MHA about 1.2. MLA moves long-context decoding from deeply memory-bound to roughly the hardware's own balance. The extra arithmetic is nearly free.

---

<p class="eyebrow"><span class="paper">Raschka 2025</span> · §1.1 · DeepSeek-V2 §2.1.3</p>

## Step 5: why does RoPE break the trick?

<div class="cols">
<div class="text">

- RoPE (rotary position embedding, Week 3): rotate $q$ and $k$ by an angle proportional to position, so $R_t^\top R_j = R_{j-t}$

<div class="eq" style="margin-top:12px">$$(R_t q_t)^\top (R_j W^{UK} c_j) = q_t^\top R_{j-t} W^{UK} c_j$$</div>

- a different matrix for every distance $j - t$
- fix: 64 extra rotated dims per head
- one rotated key shared by all heads
- cache per layer: $d_c + d_h^R = 512 + 64$, where $d_h^R$ is the size of that rotated key

</div>
<div class="text">

<p class="q"><b>Q.</b> What if a layer has no positions at all?</p>
<p class="a"><b>A.</b> No rotation, so no extra rotated channel is needed: Kimi Linear's global layers (per Raschka)</p>

</div>
</div>

<p class="footnote">DeepSeek-V2 §2.1.3: a RoPE matrix "will lie between $W^{Q}$ and $W^{UK}$ and matrix multiplication does not obey a commutative law". $R_t$: rotation at position $t$ (RoPE, later slide). Kimi Linear per Raschka §14.4</p>

Note:
The snag. RoPE, which we met in Week 3, multiplies each query and key by a rotation that depends on position, and rotations compose: R_t transposed times R_j is R of j minus t. So with RoPE the score becomes the query times R of j minus t times W_UK times the latent. The matrix we wanted to fold into the query now depends on the distance: a different matrix for every pair of positions. It can't be folded in once, and you'd have to recompute keys for the whole prefix.
DeepSeek's fix: give position its own small channel. Each head gets 64 extra query dimensions that carry RoPE, and one extra 64-dimension rotated key shared by all heads. The content part is absorbed; the position part is computed normally. Cache per token per layer: 512 plus 64, 576.
And read backwards: Kimi Linear's global layers use no positions at all, which per Raschka "lets MLA run as pure multi-query attention at inference". Absorption itself is always exact; without rotation there is simply no need for the extra rotated channel.

---

<p class="eyebrow"><span class="paper">Raschka 2025</span> · §1.1 · DeepSeek-V2 · Table 1</p>

## How small is the cache now?

<div class="cols wide-fig">
<div class="text">

- MLA: 576 per layer vs MHA's 32,768
- = GQA with 2.25 KV heads
- GPT-3 ▸ DeepSeek-V3: 67x less per token
- for a model 3.8x larger

<p class="q" style="margin-top:18px"><b>Q.</b> DeepSeek-V3 at 131K tokens?</p>
<p class="a"><b>A.</b> 9.2 GB: about GPT-3 at 2,048</p>

</div>
<div class="fig"><img src="img/week-04-raschka-kvbytes.png" alt="Illustration: KV cache per token at 16 bits on a log scale: GPT-3 4.72 MB, MHA at DeepSeek-V3 sizes 4.00 MB (hypothetical), GQA with 8 KV heads 250 KB (hypothetical), gpt-oss-120b 74 KB, DeepSeek-V3 with MLA 70 KB, MQA 31 KB (hypothetical)"></div>
</div>

<p class="footnote">DeepSeek-V2 Table 1: MLA's cache "is equal to GQA with only 2.25 groups". Sizes: DeepSeek-V3 arXiv:2412.19437 §4.2. Illustration, ours; hatched rows are hypothetical (V3 never had MHA)</p>

Note:
At DeepSeek-V3's sizes, MLA caches 576 numbers per layer per token, where MHA would cache 32,768: 57 times less. 576 divided by 2 times 128 is 2.25, which is the paper's own claim: the same cache as GQA with 2.25 key-value heads, "but its performance is stronger than MHA". Next slide checks that.
Against our baseline: GPT-3 caches 2.36 million numbers per token, DeepSeek-V3 35 thousand. 67 times less for a model 3.8 times larger. DeepSeek-V3 holding 131 thousand tokens needs about the cache GPT-3 needed for 2 thousand.
DeepSeek-V2's own headline, 93% less cache and 5.8 times the throughput, compares against their old dense 67B model, which differs in much more than attention, so it isn't an MLA-only number.

---

<p class="eyebrow"><span class="paper">Raschka 2025</span> · §1.1 · DeepSeek-V2 · Table 9</p>

## Is MLA better than MHA?

<div class="cols">
<div class="text">

<table class="rules" style="font-size:18px">
  <tr><td></td><td>small MHA</td><td>small MLA</td><td>large MHA</td><td>large MLA</td></tr>
  <tr><td>active</td><td>2.5B</td><td>2.4B</td><td>25.0B</td><td>21.5B</td></tr>
  <tr><td>KV / token</td><td>110.6K</td><td>15.6K</td><td>860.2K</td><td>34.6K</td></tr>
  <tr><td>BBH</td><td>37.9</td><td>39.0</td><td>46.6</td><td>50.7</td></tr>
  <tr><td>MMLU</td><td>48.7</td><td>50.0</td><td>57.5</td><td>59.0</td></tr>
  <tr><td>C-Eval</td><td>51.6</td><td>50.9</td><td>57.9</td><td>59.2</td></tr>
  <tr><td>CMMLU</td><td>52.3</td><td>53.4</td><td>60.7</td><td>62.5</td></tr>
</table>

</div>
<div class="text">

- MLA wins 7 of 8
- cache: 14% and 4% of MHA's
- no run compares MLA with GQA

<p class="q"><b>Q.</b> Does "MLA beats GQA" follow?</p>
<p class="a"><b>A.</b> It chains two tables: dense 7B, then MoE</p>

</div>
</div>

<p class="footnote">DeepSeek-V2 App. D.2, Table 9: MoE (mixture of experts) pairs of about 16B (1.33T tokens) and 250B (420B tokens) total. Benchmarks as on the GQA slide. No seeds or error bars given</p>

Note:
What they ran: two pairs of mixture-of-experts models, MHA against MLA, said to share the same architecture except attention. A small pair of about 16 billion weights trained on 1.3 trillion tokens, a large pair of about 250 billion on 420 billion tokens.
How to read it: MLA wins 7 of 8 comparisons, losing C-Eval at small size, with 14% and 4% of MHA's cache. The large MLA model also has 3.5 billion fewer active weights.
What it doesn't show. First, MLA against GQA: no run compares them. "GQA is worse than MHA" comes from dense 7B models; "MLA is better than MHA" from MoE models. Raschka's summary that a DeepSeek-V2 study "has shown it delivers better modeling performance than GQA" chains two different experiments; he himself notes the missing comparison. Second, robustness: no seeds or error bars are given, and the gaps are 1 to 4 points. And the sub-slide shows the large pair may not be matched.

--

<p class="eyebrow"><span class="paper">Raschka 2025</span> · §1.1 · DeepSeek-V2 · Table 9 (sub-slide)</p>

## Are the Table 9 pairs really matched?

<div class="cols">
<div class="text">

- small MHA: $110.6\text{K} = 2 \times 16 \times 128 \times 27$
- small MLA: $15.6\text{K} = 576 \times 27$
- large MLA: $34.6\text{K} = 576 \times 60$
- large MHA: heads × layers = 3,360

</div>
<div class="text">

<p class="q"><b>Q.</b> And V2's 128 heads × 60 layers?</p>
<p class="a"><b>A.</b> 7,680: so the MHA baseline has fewer heads or a different depth</p>
<p class="q"><b>Q.</b> Proof?</p>
<p class="a"><b>A.</b> An inference, assuming head size 128</p>

</div>
</div>

<p class="footnote">Our arithmetic from Table 9's cache row; V2-Lite: 27 layers, 16 heads of 128 (App. B). The paper says the pairs "share the same architecture except for the attention mechanisms"</p>

Note:
Optional, and a nice check you can do with only the table. The cache column tells you the architectures. Small MHA: 110.6 thousand is 2 times 16 heads times 128 times 27 layers, exactly V2-Lite's sizes. Small MLA: 576 times 27. The small pair matches.
Large MLA: 576 times 60, DeepSeek-V2's 60 layers and 128 heads. But large MHA: 860.2 thousand divided by 2 times 128 is 3,360 heads times layers, for example 56 heads on 60 layers, or 40 on 84. Not 128 times 60, which would be 7,680. So the large MHA baseline has fewer heads or a different depth than its partner, and part of the large-scale win may come from that. It's an inference, but it belongs in "what this does not show".

---

<p class="eyebrow"><span class="paper">Raschka 2025</span> · Introduction · OLMo 2 §3</p>

## Why three matrices in a feed-forward network?

<div class="cols">
<div class="text">

<div class="eq">$$\mathrm{SwiGLU}(x) = W_2\big(\mathrm{SiLU}(W_1 x) \odot W_3 x\big)$$</div>

- one projection gates the other, feature by feature
- claimed: the gate lets the layer switch features per token; not shown here
- 3 matrices of width $f$: $3df$ weights
- GPT-3's FFN: $8d^2$; same weights at $f = \tfrac{8}{3} d$

</div>
<div class="text">

<p class="q"><b>Q.</b> OLMo 2 7B, $d$ = 4096?</p>
<p class="a"><b>A.</b> $\tfrac{8}{3} \times 4096$ = 10,923, rounded up to 11,008</p>
<p class="q"><b>Q.</b> Same size as GPT-3's?</p>
<p class="a"><b>A.</b> 135.3M vs 134.2M per layer</p>

</div>
</div>

<p class="footnote">OLMo 2 arXiv:2501.00656 §3 ("approximately $\frac{8}{3}d$ ... 11,008 for our 7B model"). SiLU$(z) = z\sigma(z)$, the sigmoid linear unit; GeGLU (Gemma 2) uses GELU. The evidence that gating helps (Shazeer 2020) is not in our sources</p>

Note:
Raschka's first paragraph says "the more efficient SwiGLU has replaced activation functions like GELU". It matters because every expert in the next slides is a SwiGLU network, and GPT-3's feed-forward network has only two matrices.
A gated network computes two projections of the input and multiplies them element by element, so one acts as a learned, input-dependent gate on the other, then projects back. Three matrices. The claimed benefit is that the gate lets the layer switch features on and off per token; no source we have shows that. To keep the same number of weights as GPT-3's 8 d squared, three times d times f equals 8 d squared, so the width is eight thirds of d instead of 4d.
OLMo 2 7B: eight thirds of 4096 is 10,923, rounded up to a multiple of 128, 11,008, and that's the number in their paper. What we can say is that every 2025 model in the lineup uses a gated network.

---

<p class="eyebrow"><span class="paper">Raschka 2025</span> · §1.2 · Fig. 5</p>

## Does every token need the whole feed-forward network?

<div class="cols wide-fig">
<div class="text">

- FFN: two thirds of GPT-3, all used
- MoE: many small FFNs, "experts"
- router: a small learned scoring layer picks a few per token
- shared expert: one that every token uses
- DeepSeek V3: 1 shared + 8 of 256

</div>
<div class="fig"><img src="img/week-04-raschka-fig5-moe.png" alt="Raschka Figure 5, the MoE layer of DeepSeek V3: a router chooses among 256 feed-forward experts; resource savings: model size 671B, but only 1 shared plus 8 experts active per token, only 37B parameters active per inference step"></div>
</div>

<p class="footnote">Raschka 2025 · §1.2, Fig. 5 (MoE layer panel). MoE: mixture of experts. DeepSeek-V3 arXiv:2412.19437 §4.2: "1 shared expert and 256 routed experts ... 8 experts will be activated for each token"</p>

Note:
Back to GPT-3's count: two thirds of its weights are in the feed-forward networks and every token uses all of them. That's the biggest single cost per token.
Mixture of experts asks: does every token need the whole network, or could different tokens use different parts? Replace the one feed-forward network with many smaller ones, the experts, and add a router, a small learned layer that scores the experts and picks a few for each token. DeepSeek V3 has 256 routed experts per layer plus one shared expert that every token uses, and each token gets 8 routed ones. So 9 experts run per token, and 37 of 671 billion weights are active.

---

<p class="eyebrow"><span class="paper">Raschka 2025</span> · §1.2 · DeepSeek-V3 · Eq. 12 to 15</p>

## How does the router choose?

<div class="cols">
<div class="text">

<div class="eq">$$h_t' = u_t + \sum_{i=1}^{N_s} \mathrm{FFN}^{(s)}_i(u_t) + \sum_{i=1}^{N_r} g_{i,t}\thinspace \mathrm{FFN}^{(r)}_i(u_t)$$</div>

- $u_t$: the token's input; $N_s$ shared, $N_r$ routed experts
- affinity $s_{i,t} = \sigma(u_t^\top e_i)$, $e_i$: expert $i$'s learned vector
- keep the top $K_r$, others zero
- rescale the kept ones to sum to 1: the gates $g_{i,t}$

</div>
<div class="text">

<p class="q"><b>Q.</b> Top-$K_r$ has no gradient. How is it trained? (ours)</p>
<p class="a"><b>A.</b> Through the gates $g_{i,t}$ of the chosen experts</p>
<p class="q"><b>Q.</b> And in gpt-oss?</p>
<p class="a"><b>A.</b> A softmax over the 4 chosen</p>

</div>
</div>

<p class="footnote">DeepSeek-V3 §2.1.2 ($e_i$: "the centroid vector" of expert $i$; $K_r$: routed experts kept, 8; $\sigma$: sigmoid). gpt-oss arXiv:2508.10925 §2.2</p>

Note:
DeepSeek-V3's layer: the input passes through the residual, plus all shared experts, plus the routed experts weighted by gates that are zero for all but K_r of them.
The gate: each routed expert has a learned vector. The token's affinity to expert i is a sigmoid of the dot product with that vector. Keep the k highest, zero the rest, rescale the kept ones to sum to one. So a token goes to the experts whose vectors point most its way. gpt-oss does the same with a softmax over the selected four.
How does a hard choice get trained? That reasoning is ours. The choice itself has no gradient. But the gates of the chosen experts multiply their outputs, so the gradient reaches the router through them: an expert that helped gets its gate, and its vector, pushed up for similar tokens.

---

<p class="eyebrow"><span class="paper">Raschka 2025</span> · §1.2 · DeepSeek-V3 §2.1.2</p>

## How do you keep every expert busy?

<div class="cols">
<div class="text">

- risk: a few experts get every token
- old fix: an extra balancing loss
- DeepSeek-V3: a bias $b_i$ per expert
- used only to choose, not to weight
- overloaded: $b_i - \gamma$; idle: $b_i + \gamma$

</div>
<div class="text">

<p class="q"><b>Q.</b> Why not just the loss?</p>
<p class="a"><b>A.</b> "too large an auxiliary loss will impair the model performance"</p>
<p class="q"><b>Q.</b> What is $\gamma$?</p>
<p class="a"><b>A.</b> The bias step: 0.001 for the first 14.3 trillion tokens, then 0.0 for the last 500 billion</p>

</div>
</div>

<p class="footnote">DeepSeek-V3 §2.1.2, §4.2. Auxiliary loss: an extra training loss penalising uneven expert use</p>

Note:
If the router sends most tokens to a few experts, the rest never learn and the busy ones become a bottleneck. The classic fix adds a loss that penalises uneven use, but DeepSeek notes that too large a balancing loss hurts the model.
Their alternative: a bias per expert, added to its affinity only when choosing experts, never in the gate weights. After each step, lower the bias of an overloaded expert by gamma, raise an idle one's. Gamma is 0.001 for nearly all of training. A small balancing loss within each sequence is kept as a backstop. Did it help? Sub-slide.

--

<p class="eyebrow"><span class="paper">Raschka 2025</span> · §1.2 · DeepSeek-V3 · balancing ablation (sub-slide)</p>

## Did the bias method help?

<div class="cols">
<div class="text">

<table class="rules" style="font-size:16px">
  <tr><td>benchmark</td><td>small, loss</td><td>small, bias</td><td>large, loss</td><td>large, bias</td></tr>
  <tr><td>Pile (BPB, lower is better)</td><td>0.727</td><td>0.724</td><td>0.656</td><td>0.652</td></tr>
  <tr><td>BBH</td><td>37.3</td><td>39.3</td><td>66.7</td><td>67.9</td></tr>
  <tr><td>MMLU</td><td>51.0</td><td>51.8</td><td>68.3</td><td>67.2</td></tr>
  <tr><td>DROP</td><td>38.1</td><td>39.0</td><td>67.1</td><td>67.1</td></tr>
  <tr><td>HumanEval</td><td>22.0</td><td>22.6</td><td>40.2</td><td>46.3</td></tr>
  <tr><td>MBPP</td><td>36.6</td><td>35.8</td><td>59.2</td><td>61.2</td></tr>
  <tr><td>GSM8K</td><td>27.1</td><td>29.6</td><td>70.7</td><td>74.5</td></tr>
</table>

</div>
<div class="text">

- wins 9 of 10 small, 8 of 10 large
- most gaps 0.2 to 1 point
- big: HumanEval +6.1, GSM8K +3.8
- no error bars

</div>
</div>

<p class="footnote">DeepSeek-V3 §4.5.2 table: 15.7B total on 1.33T tokens; 228.7B on 578B; 7 of 10 benchmarks shown (TriviaQA, NaturalQuestions, MATH not shown; all favour the bias method). Pile: a large mixed text corpus; BPB: bits per byte; BBH: hard reasoning tasks; MMLU: 57-subject exam; DROP: reading with arithmetic; HumanEval, MBPP: Python coding (pass rate); GSM8K: school maths</p>

Note:
Optional. What they ran: two baseline models, 15.7 and 228.7 billion weights, balanced with losses only; then, "keeping the training data and the other architectures the same", the losses removed and the bias method used.
How to read it: the Pile row is bits per byte of held-out text, lower is better; the rest are scores, higher is better. The bias method wins 9 of 10 benchmarks at small scale, losing MBPP, and 8 of 10 at large scale, losing MMLU and tying DROP. Most gaps are under a point; the large ones are HumanEval and GSM8K at the large scale. The paper: "consistently achieves better model performance on most of the evaluation benchmarks." No error bars are given, so one-point gaps may be noise.

---

<p class="eyebrow"><span class="paper">Raschka 2025</span> · §1.2, §5, §13.2 · total vs active</p>

## What does a mixture of experts buy per token?

<div class="cols wide-fig">
<div class="text">

- weight arithmetic: $2 \times$ active
- DeepSeek-V3: 74 GFLOPs vs GPT-3's 350
- 3.8x the weights, 4.7x less arithmetic
- as cheap as a dense model of the active size: 5.8x (gpt-oss-20b) to 31x (Kimi K2, per Raschka) fewer weights used than in total

<p class="q" style="margin-top:16px"><b>Q.</b> At 131K tokens?</p>
<p class="a"><b>A.</b> Attention, 2.2 TFLOPs, dominates: 74 is short-context</p>

</div>
<div class="fig"><img src="img/week-04-raschka-active.png" alt="Illustration: share of weights used per token: GPT-3 100%, gpt-oss-20b 17.3%, Qwen3-235B 9.36%, DeepSeek-V3 5.51%, gpt-oss-120b 4.39%, Llama 4 Maverick 4.25%, Kimi K2 3.2%"></div>
</div>

<p class="footnote">Illustration, ours: active / total from each report (Qwen3 Table 2, DeepSeek-V3 §4.2, gpt-oss Table 1); Llama 4 per Meta's blog, Kimi K2 per Raschka. At large batch, different users pick different experts, so most are read anyway (our reasoning). The next two sub-slides rebuild the counts</p>

Note:
What MoE buys is arithmetic. Weight arithmetic is about twice the active weights: DeepSeek-V3 does 74 billion operations per token against GPT-3's 350. A model with 3.8 times GPT-3's weights does 4.7 times less weight arithmetic per token. Across these models, the active share runs from 17% down to 3%: that is 5.8 times fewer weights used than the total for gpt-oss-20b, and 31 times for Kimi K2.
Two qualifications. This counts weight multiplies only: at long context the attention itself dominates, 2.2 teraflops at 131 thousand tokens, 30 times the 74. And at large batch, different users' tokens pick different experts, so most experts get read every step anyway, and the saving is mainly arithmetic.
What it's claimed to buy, capacity, more weights to store knowledge at the arithmetic of a small model, the blog asserts without evidence. The two sub-slides after this one rebuild gpt-oss-120b's and DeepSeek-V3's counts from their own reports, so you can see where the totals and active numbers come from.

--

<p class="eyebrow"><span class="paper">Raschka 2025</span> · §9 · Fig. 26 · gpt-oss · Table 1 (sub-slide)</p>

## Can we rebuild gpt-oss-120b's parameter count?

<div class="cols">
<div class="text">

<table class="rules" style="font-size:18px">
  <tr><td>piece</td><td>card</td><td>ours</td></tr>
  <tr><td>one expert $3 \times 2880^2$</td><td></td><td>24.9M</td></tr>
  <tr><td>all experts × 128 × 36</td><td>114.71B</td><td>114.66B</td></tr>
  <tr><td>attention</td><td>0.96B</td><td>0.955B</td></tr>
  <tr><td>active: 4 experts × 36</td><td></td><td>3.58B</td></tr>
  <tr class="total"><td>active + attention + output</td><td>5.13B</td><td>5.12B</td></tr>
</table>

</div>
<div class="text">

<p class="q"><b>Q.</b> What is the 48M gap?</p>
<p class="a"><b>A.</b> Router 13.3M plus, likely, expert biases (ours)</p>
<p class="q"><b>Q.</b> What share is used per token?</p>
<p class="a"><b>A.</b> 5.13 / 116.83: 4.39%</p>

</div>
</div>

<p class="footnote">gpt-oss arXiv:2508.10925 Table 1, §2.2 (36 layers, width 2880, 128 experts, top-4; 64 query heads and 8 key-value heads of 64). Expert width 2880 from Raschka Fig. 26. Output layer $201{,}088 \times 2880$ = 0.58B, counted active by the card. Ours</p>

Note:
Everything here is in the model card. 36 layers, width 2880, 128 experts per layer, 4 chosen per token. One expert is a SwiGLU network with three 2880 by 2880 matrices: 24.9 million weights. Times 128 experts times 36 layers: 114.66 billion against the card's 114.71; the 48 million gap is the router, 13 million, plus very likely bias terms in the experts.
Attention: queries 2880 by 4096, keys and values 2880 by 512 each, output back: 0.955 billion, the card's 0.96.
Active per token: 4 experts per layer, 3.58 billion, plus all the attention, plus the output layer, 0.58 billion. The card counts the output layer as active but not the input embedding; our reading is that a lookup costs no multiplications. Total 5.12 against 5.13. So 117 billion weights, 4.4% used per token.

--

<p class="eyebrow"><span class="paper">Raschka 2025</span> · §1.2 · Fig. 1 · DeepSeek-V3 §4.2 (sub-slide)</p>

## Can we rebuild DeepSeek-V3's 671B and 37B?

<div class="cols">
<div class="text">

<table class="rules" style="font-size:18px">
  <tr><td>piece</td><td>total</td><td>active</td></tr>
  <tr><td>experts: 44.0M × 257, or × 9, × 58 layers</td><td>656.5B</td><td>23.0B</td></tr>
  <tr><td>3 dense layers</td><td>1.19B</td><td>1.19B</td></tr>
  <tr><td>MLA attention, 187.1M × 61</td><td>11.4B</td><td>11.4B</td></tr>
  <tr><td>embedding + output</td><td>1.85B</td><td>0.93 to 1.85B</td></tr>
  <tr class="total"><td>sum (with router)</td><td>671.0B</td><td>36.6 to 37.6B</td></tr>
</table>

</div>
<div class="text">

- 97.8% of weights are experts
- dense width 18,432 = 9 × 2048
- same FFN work per token in every layer

</div>
</div>

<p class="footnote">DeepSeek-V3 §4.2 (61 layers, width 7168, 1 + 256 experts of width 2048, 8 routed active). Dense width 18,432 from Raschka Fig. 1; vocabulary 129,280 from the model's config (not in the paper). Our arithmetic</p>

Note:
The same exercise for DeepSeek-V3. One expert is three 7168 by 2048 matrices, 44 million weights. 257 experts in each of 58 MoE layers: 656 billion; 9 active: 23 billion. Add three dense layers, the attention at 187 million per layer, the embedding and output layer, the router, and both totals land on the paper's 671 and 37 billion.
Two things to notice. 98% of the weights are experts, but only 23 of 656 billion run for any token. And the dense layers' width, 18,432, is exactly 9 times 2048: the first three layers do the same feed-forward work as the 9 active experts. Every layer does the same amount of work per token; MoE changes which weights do it.

---

<p class="eyebrow"><span class="paper">Raschka 2025</span> · §3 · gpt-oss §2.1</p>

## What does a mixture of experts not buy?

<div class="cols">
<div class="text">

- every expert must sit in memory
- same weight memory as a dense model
- gpt-oss at 16 bits: 233.7 GB
- experts at 4.25 bits: 60.7 GiB (65.2 GB)
- one 80 GB GPU: quantisation, not sparsity

</div>
<div class="text">

<p class="q"><b>Q.</b> Does MoE reduce "memory requirements at inference", as Raschka writes?</p>
<p class="a"><b>A.</b> It cuts arithmetic and reads per token, not resident memory</p>
<p class="q"><b>Q.</b> Seen this trick before?</p>
<p class="a"><b>A.</b> QLoRA's 4-bit base model, Week 2</p>

</div>
</div>

<p class="footnote">gpt-oss arXiv:2508.10925 §2.1: MXFP4 (a 4-bit floating-point format) at 4.25 bits; MoE weights "90+% of the total parameter count"; checkpoint 60.8 GiB (Table 1). Rebuild: $114.71 \times 4.25/8 + 2.12 \times 2$ GB, ours</p>

Note:
What MoE doesn't buy is memory for the weights. Every expert must be resident, because the next token might need it. At a fixed total size an MoE model needs exactly as much weight memory as a dense one. Raschka once writes that MoE reduces memory requirements at inference; it reduces arithmetic and reads per token, not what has to be held.
gpt-oss makes it concrete. At 16 bits throughout, 234 gigabytes. Its experts are stored at 4.25 bits each; rebuild the checkpoint from that and you get 60.7 gibibytes, matching the card. Every expert is in there. It fits on one 80-gigabyte GPU because of quantisation, not sparsity: the 4-bit base-model idea of QLoRA from Week 2, applied to a whole model.

---

<p class="eyebrow"><span class="paper">Raschka 2025</span> · §1.2, §9.2 · Fig. 6 · DeepSeekMoE · Fig. 2</p>

## Many small experts or a few large ones?

<div class="rows">
<div class="points">
<div class="text">

- few experts: each holds mixed knowledge
- split each into $m$, choose $m$ times as many
- same weights, same arithmetic
- the other way: gpt-oss-20b has 32 experts, 4 active; Grok 2.5, 8 (per Raschka)

</div>
<div class="text">

<p class="q"><b>Q.</b> How many ways to choose?</p>
<p class="a"><b>A.</b> 2 of 16: 120; 8 of 64: 4,426,165,368</p>

</div>
</div>
<div class="fig"><img src="img/week-04-raschka-dsmoe-fig2.png" alt="DeepSeekMoE Figure 2: (a) conventional top-2 routing over N experts, (b) fine-grained segmentation into 2N smaller experts with top-4 routing, (c) one shared expert always active plus routed experts with K = 3"></div>
</div>

<p class="footnote">DeepSeekMoE (Dai et al. 2024, arXiv:2401.06066) Fig. 2 (Raschka's Fig. 6), §3.1; counts are the paper's. gpt-oss Table 1; Grok 2.5: Raschka §10</p>

Note:
DeepSeek's line is to split experts finer and choose more of them. Why? The DeepSeekMoE paper names the problem "Knowledge Hybridity": with only 8 or 16 experts, the tokens sent to one expert "cover diverse knowledge", more than one expert's weights hold well. The fix keeps weights and arithmetic fixed: split each expert into m smaller ones and activate m times as many.
Their own count: top-2 of 16 experts gives 120 possible combinations; split each into 4, choose 8 of 64, and there are 4.4 billion. More, finer combinations.
Others go the other way: gpt-oss-20b has 32 large experts, 4 active; Grok 2.5, per Raschka, 8. Llama 4 Maverick has 128 experts with 1 shared and 1 routed active. Does finer help? Next slide.

---

<p class="eyebrow"><span class="paper">Raschka 2025</span> · §1.2 · DeepSeekMoE §4.4 · Fig. 3</p>

## Do fine-grained and shared experts help?

<div class="rows">
<div class="points">
<div class="text">

- about 2B total, 0.3B active, 100B tokens
- same total and active weights in every run
- finer experts: better on every benchmark

</div>
<div class="text">

- 1, 2, 4 shared: Pile loss 1.808, 1.806, 1.811
- "do not significantly impact the performance"
- shown at 2B only

</div>
</div>
<div class="fig"><img src="img/week-04-raschka-dsmoe-fig3.png" alt="DeepSeekMoE Figure 3: normalised performance on HellaSwag, PIQA, ARC-easy, ARC-challenge, TriviaQA and NaturalQuestions for GShard (0 shared, 2 of 16 routed), plus one shared expert (1 of 15), plus finer segmentation (3 of 31) and finer still (7 of 63); the finest is best on all six"></div>
</div>

<p class="footnote">DeepSeekMoE §4.4, Fig. 3: scores "normalized by the best performance" per benchmark. HellaSwag: pick a story's sensible ending; PIQA: physical common sense; ARC: school science questions; TriviaQA, NaturalQuestions: factual questions. Pile: a large mixed text corpus</p>

Note:
What they ran: MoE models of about 2 billion weights, 0.3 billion active, on 100 billion tokens, with "the same number of total parameters and activated parameters" in every comparison. Start from a conventional top-2 design, GShard. Add one shared expert. Then split experts into 2, then 4.
How to read it: each benchmark is normalised so its best model sits at 1. The finest model, 1 shared plus 7 of 63, is best everywhere. Adding the shared expert alone helps on most benchmarks, "a majority" in the paper's words, but not on PIQA or ARC-challenge.
And a null result: with 64 experts, making 1, 2 or 4 of them shared gives Pile losses of 1.808, 1.806 and 1.811, which "do not significantly impact the performance". What it doesn't show: that this holds at 671 billion weights, or against Qwen3's choice at its own scale.

---

<p class="eyebrow"><span class="paper">Raschka 2025</span> · §6.2 · Fig. 19</p>

## Is a shared expert worth it?

<div class="cols wide-fig">
<div class="text">

- DeepSeek: "Knowledge Redundancy"
- Qwen3: "excludes shared experts"
- Qwen3-Next: adds one back (per Raschka)
- made, unmade, remade

<p class="q" style="margin-top:16px"><b>Q.</b> What was Qwen's reason?</p>
<p class="a"><b>A.</b> "No straight answer to this question honestly"</p>

</div>
<div class="fig"><img src="img/week-04-raschka-fig19-qwen3.png" alt="Raschka Figure 19: DeepSeek V3 next to Qwen3 235B-A22B; both have MoE layers, but DeepSeek V3 has 1 shared plus 8 of 256 experts active while Qwen3 has 8 of 128 and no shared expert, plus Q/K RMSNorm"></div>
</div>

<p class="footnote">DeepSeekMoE §1; Qwen3 arXiv:2505.09388 §2 ("Unlike Qwen2.5-MoE, the Qwen3-MoE design excludes shared experts"); Qwen developer's post quoted by Raschka §6.2; Qwen3-Next per Raschka §12.1</p>

Note:
DeepSeekMoE's reason for a shared expert is "Knowledge Redundancy": tokens routed to different experts may need the same common knowledge, so several experts learn it separately; one always-on expert should hold it once. DeepSeek V3 keeps one.
Qwen3 dropped it, and the only reason on record is a post by a Qwen developer: "we did not find significant enough improvement on shared expert and we were worrying about the optimization for inference caused by shared expert. No straight answer to this question honestly." Then Qwen3-Next added one back.
So a choice made, unmade and remade. DeepSeek published an ablation for its choice; we found none from Qwen for either of theirs. Also unsettled: keeping the first layers dense, as DeepSeek V3 does, which nothing in our sources tests.

---

<p class="eyebrow"><span class="paper">Raschka 2025</span> · §3.1 · Fig. 12</p>

## Does every layer need the whole context?

<div class="cols wide-fig">
<div class="text">

- the cache still grows with every token
- local layer: only the last $w$ tokens (a window)
- caches $w$ tokens, at any context length
- a few global layers see everything
- GPT-3 already did this: next slide

</div>
<div class="fig"><img src="img/week-04-raschka-fig12-mask.png" alt="Raschka Figure 12: a regular causal mask over 'The cat sat on the', where the last token attends to all five, next to a sliding-window mask where it attends only to the last three; the dropped entries are marked 'not attended to save computation'"></div>
</div>

<p class="footnote">Raschka 2025 · §3.1, Fig. 12. Local attention is also called sliding-window attention; global means full causal attention</p>

Note:
GQA and MLA made each cache entry smaller, but the cache still grows with every token of context. At 128 thousand tokens, even a small entry adds up. The next question: does every layer need to see the whole context?
Sliding-window, or local, attention lets each token attend only to the previous w tokens. Raschka's figure: with a normal causal mask the last "the" attends to all five tokens; with a window, to the last three. A local layer only ever needs to cache w tokens, whatever the context length.
But a model of only local layers can't connect a token to something a hundred thousand tokens back in one step. So models mix: most layers local, a few global. If you remember GPT-3's "locally banded" layers, that is the same idea; the next slide says what is new.

---

<p class="eyebrow"><span class="paper">Raschka 2025</span> · §3.1 · gpt-oss §2.2</p>

## Was local attention new in 2025?

<div class="cols">
<div class="text">

<table class="rules" style="font-size:19px">
  <tr><td>model</td><td>local : global</td><td>window</td></tr>
  <tr><td>GPT-3 (2020)</td><td>1 : 1</td><td>not stated</td></tr>
  <tr><td>Gemma 2</td><td>1 : 1</td><td>4096</td></tr>
  <tr><td>gpt-oss</td><td>1 : 1</td><td>128</td></tr>
  <tr><td>Gemma 3</td><td>5 : 1</td><td>1024</td></tr>
  <tr><td>Olmo 3, Trinity*</td><td>3 : 1</td><td>4096</td></tr>
  <tr><td>MiMo-V2-Flash*</td><td>5 : 1</td><td>128</td></tr>
</table>

</div>
<div class="text">

- GPT-3: dense and "locally banded"
- gpt-oss: "Following GPT-3"
- new: the ratio and the width

</div>
</div>

<p class="footnote">GPT-3 §2.1; gpt-oss arXiv:2508.10925 §2.2: "Following GPT-3, attention blocks alternate between banded window and fully dense patterns ... the bandwidth is 128 tokens"; Gemma 2 §2; Gemma 3 arXiv:2503.19786 §2. * per Raschka</p>

Note:
Not new. GPT-3 itself, reading 1, alternated dense and "locally banded" layers, after the 2019 Sparse Transformer. The gpt-oss card makes the lineage explicit: "Following GPT-3, attention blocks alternate between banded window and fully dense patterns", with a band of 128 tokens.
What changed in 2025 is the settings: how many local layers per global one, and how narrow the window. Gemma 2 alternated one to one with a 4096 window; Gemma 3 went to five to one with 1024; MiMo, per Raschka, five to one with just 128.

---

<p class="eyebrow"><span class="paper">Raschka 2025</span> · §3.1 · Longformer §3</p>

## How far can information travel through local layers?

<div class="cols wide-fig">
<div class="text">

- each layer relays $w - 1$ further back
- $\ell$ layers: about $\ell \times w$
- Gemma 3: 5 local layers × 1024 = 5,120
- further: through a global layer

<p class="q" style="margin-top:16px"><b>Q.</b> Where have you seen stacking like this?</p>
<p class="a"><b>A.</b> Stacked small filters in a CNN</p>

</div>
<div class="fig"><img src="img/week-04-raschka-reach.png" alt="Illustration: 16 tokens; the last token reaches 4 tokens after one local layer with window 4, 7 after two, 10 after three, and all 16 after a global layer"></div>
</div>

<p class="footnote">Longformer, Beltagy et al. 2020, arXiv:2004.05150 §3: "the receptive field size at the top layer is $\ell \times w$". Illustration, ours: a causal window of $w$ past tokens; Longformer's $w$ is two-sided. CNN: convolutional neural network</p>

Note:
Even local layers can carry information far by relaying it. Each layer lets a token gather from the w minus 1 tokens before it, and those tokens already gathered from theirs in the layer below. Longformer states the rule: after l layers the reach is l times w, the same reasoning as stacking small filters in a convolutional network. (Longformer's window is two-sided, w over two each way; the Gemma-style window we draw counts only past tokens.)
The figure, with a window of 4: one layer reaches 4 tokens, two reach 7, three reach 10, and one global layer reaches all 16.
Gemma 3 has 5 local layers between global ones, window 1024: within one run of local layers, information moves at most about 5 thousand tokens. Anything further has to go through a global layer.

---

<p class="eyebrow"><span class="paper">Raschka 2025</span> · §3.1 · Fig. 11 · Gemma 3 · Fig. 6</p>

## How much cache does a window save?

<div class="cols wide-fig">
<div class="text">

<div class="eq">$$\text{kept} = \frac{T + r\thinspace w}{(r+1)\thinspace T}$$</div>

- $r$ local layers per global layer
- Gemma 3 at 32K: 0.193
- at 128K: 0.173

<p class="q"><b>Q.</b> Limit as $T$ grows?</p>
<p class="a"><b>A.</b> $1/(r+1)$: 1/6 for Gemma 3</p>

</div>
<div class="fig"><img src="img/week-04-raschka-swafrac.png" alt="Illustration: share of a global-only KV cache kept against context length from 4K to 128K; Gemma 2's 1:1 with window 4096 falls toward a floor of one half, Gemma 3's 5:1 with window 1024 falls to 0.271, 0.193 and 0.173 at 8K, 32K and 128K, near its floor of one sixth"></div>
</div>

<p class="footnote">Illustration, our formula (one global layer caches $T$, each local layer $w$). Dashed: beyond Gemma 2's 8,192 global span, hypothetical. Gemma 3 Fig. 6 (Raschka's Fig. 11) shows the same gap measured on a 2B model</p>

Note:
Compared with making every layer global, how much cache do you keep? Each global layer caches all T tokens, each local layer only w. With r local layers per global one, the kept share is T plus r w over r plus 1 times T.
Gemma 3, five to one with 1024: 27% of the cache at 8 thousand tokens, 19% at 32 thousand, 17% at 128 thousand. As the context grows the local layers stop costing anything and the share falls to 1 over r plus 1, a sixth. That's why Gemma 3 went from one to one to five to one: at long context, the ratio matters far more than the window.
gpt-oss at 131 thousand tokens: all-dense would cache 9.7 gigabytes, alternating 4.8, half. And with every layer dense, gpt-oss at 131 thousand tokens would cache exactly what GPT-3 caches at 2 thousand: a factor of 64, of which GQA supplies 12, a smaller head 2, and fewer layers the rest.

--

<p class="eyebrow"><span class="paper">Raschka 2025</span> · §3.1 · Gemma 3 · Fig. 5 (sub-slide)</p>

## What does Gemma 3's "1:3" mean?

<div class="rows">
<div class="points">
<div class="text">

- global only: KV adds 60% to memory
- "1:3, sw=1024": under 15%

</div>
<div class="text">

<p class="q"><b>Q.</b> What if it is 1 local per 3 global?</p>
<p class="a"><b>A.</b> $(3T + w)/(4T)$ = 0.758 ▸ 45% overhead: no</p>
<p class="q"><b>Q.</b> So what does it mean?</p>
<p class="a"><b>A.</b> 3 local per global (0.273 ▸ 16%), as a later plot's legend says</p>

</div>
</div>
<div class="fig"><img src="img/week-04-raschka-gemma3-fig5.png" alt="Gemma 3 Figure 5: inference memory of a 2B model split into model and KV cache, at 32K prefill, for global only, 1:1 with window 4096, 1:1 with 1024, 1:3 with 4096 and 1:3 with 1024; the cache shrinks from the largest bar to a small one"></div>
</div>

<p class="footnote">Gemma 3 arXiv:2503.19786 §5.1, Fig. 5 (2B, 32K tokens): "reduced to less than 15% with 1:3 and sliding windows of 1024". Fig. 4's legend reads "L:G=3:1". Our check with the formula at $T$ = 32,768, $w$ = 1024</p>

Note:
Optional, and a small puzzle the formula solves. Gemma 3 measures memory for a 2B model at 32 thousand tokens: the cache adds 60% to the weights for global-only attention, "reduced to less than 15% with 1:3 and sliding windows of 1024". But does 1:3 mean one local to three global, or three local to one?
Test both. As one local per three global, the cache kept would be 76%, an overhead of 45%: nowhere near 15. As three local per global, 27%, an overhead of 16%, close to (if a bit above) their figure. So "1:3" means three local per global, which is what the legend of their window-size plot says. The paper writes it both ways.

---

<p class="eyebrow"><span class="paper">Raschka 2025</span> · §3.1 · Fig. 13 · Gemma 3 · Figs. 3, 4</p>

## Does a narrow window hurt?

<div class="rows">
<div class="points">
<div class="text">

- ratio: zero line is 1:1, not "no window"
- largest change about +0.03 (2B, 7:1; read off the plot)
- window: zero line at 1024

</div>
<div class="text">

- curves wobble by about 0.01: noise (ours; no error bars)
- perplexity only, text-only models
- no full-attention point at all

</div>
</div>
<div class="fig"><img src="img/week-04-raschka-gemma3-fig34.png" alt="Gemma 3 Figures 3 and 4: left, change in perplexity against local:global ratio from 1:1 to 7:1 for 2B and 9B models, within about 0.03 of zero; right, change in perplexity against sliding window from 512 to 4096 for 2B models at L:G 1:1 and 3:1, within about 0.02 of zero at 1024"></div>
</div>

<p class="footnote">Gemma 3 §5.1, Fig. 3: "The impact is minimal, even with 7-to-1"; Fig. 4: the window "can be reduced significantly without impacting perplexity". Perplexity: how surprised the model is by held-out text, lower is better; base value not given. Gemma 2 Table 10: windows 4096 / 2048 / 1024 at inference give 1.63 / 1.63 / 1.64</p>

Note:
What they ran: text-only models, validation perplexity, reported as the change from a reference. Left, the ratio from one-to-one up to seven-to-one, 2B and 9B models. Right, the window from 512 to 4096 on two 2B models.
How to read them. The ratio plot's zero line is one-to-one, where half the layers are already local; it is not "no sliding window". The biggest change is about three hundredths. The window plot's zero line is at 1024, not at the largest window, and its curves aren't monotone: the one-to-one model is worse at 2048 than at either 1024 or 4096. So the noise is around a hundredth.
What it shows: going from half local to seven-eighths local, and narrowing the window to 1024, moves perplexity by about the noise. What it doesn't show: that sliding windows cost nothing against full attention, since there's no full-attention point, or anything about long-range retrieval, which a narrow window could hurt and perplexity barely measures. Raschka's caption, "little to no impact", claims more than the plots show.

---

<p class="eyebrow"><span class="paper">Raschka 2025</span> · §4, §16, §21</p>

## If windows save memory, why switch them off?

<div class="cols">
<div class="text">

- Mistral Small 3.1, MiniMax-M2: window off
- Raschka's guess: latency
- full attention: faster fused code
- memory, latency, throughput: three goals

</div>
<div class="text">

<p class="q"><b>Q.</b> Is there another way to look less?</p>
<p class="a"><b>A.</b> DeepSeek V3.2's sparse attention, also in GLM-5 (per Raschka)</p>

</div>
</div>

<p class="footnote">Raschka 2025 · §4 ("sliding window attention ... doesn't necessarily reduce inference latency"; "more optimized code (i.e., FlashAttention)", the standard fused attention kernel); §16, §21. All per Raschka. He calls V3.2's sparse attention "a linear attention variant" and puts it on Fig. 38's hybrid branch</p>

Note:
Mistral Small 3.1 ships with sliding windows switched off, per its configuration file, and so does MiniMax-M2. Raschka's guess: "while sliding window attention reduces memory usage, it doesn't necessarily reduce inference latency", because plain full attention can use highly optimised kernels such as FlashAttention. It's labelled speculation, and it's a useful reminder: "efficient" can mean memory, latency or throughput, and a change that helps one may not help another.
A third answer to "how far does attention look", besides windows and the linear attention at the end: DeepSeek V3.2's sparse attention, adopted by GLM-5 "to reduce the inference cost when working with long contexts". The blog moves the mechanism to a separate article, so we only note it and do not explain how it works; Raschka groups it with the linear-attention hybrids.

---

<p class="eyebrow"><span class="paper">Raschka 2025</span> · §2.1 · Fig. 8</p>

## Where should the normalisation go?

<div class="cols wide-fig">
<div class="text">

- a norm rescales a vector to a fixed size
- $F$: attention or the FFN

<div class="eq">$$\text{post: } \mathrm{Norm}(x + F(x))$$</div>
<div class="eq">$$\text{pre: } x + F(\mathrm{Norm}(x))$$</div>
<div class="eq">$$\text{OLMo 2: } x + \mathrm{Norm}(F(x))$$</div>
<div class="eq">$$\text{Gemma: } x + \mathrm{Norm}(F(\mathrm{Norm}(x)))$$</div>

- Gemma's is a sandwich: a norm before and after

</div>
<div class="fig"><img src="img/week-04-raschka-fig8-norms.png" alt="Raschka Figure 8: the original Transformer decoder with LayerNorm after each residual addition (Post-Norm), Llama 3 8B with RMSNorm before attention and feed-forward (Pre-Norm), and OLMo 2 7B with RMSNorm after attention and feed-forward but inside the residual branch"></div>
</div>

<p class="footnote">Raschka 2025 · §2.1, Fig. 8; §3.2. RMSNorm: rescale to unit root-mean-square with a learned gain (LayerNorm without the mean); OLMo 2 finds "no difference" between RMSNorm and LayerNorm, which is not about placement</p>

Note:
A block adds each sublayer's output to a running sum, the residual stream. Over dozens of blocks the numbers can drift, and gradients through all of them can grow or shrink. A norm rescales a vector to a fixed size; almost every model here uses RMSNorm, which is LayerNorm without subtracting the mean.
Where to put it? Four answers. The original Transformer normalised after adding: post-norm, the norm of the sum. GPT-2, GPT-3, Llama, Qwen3 and gpt-oss normalise the sublayer's input and add its raw output: pre-norm. OLMo 2 normalises the sublayer's output, still inside the residual branch. Gemma 2, 3 and 4 do both, a sandwich.

---

<p class="eyebrow"><span class="paper">Raschka 2025</span> · §2.1, §3.2 · Fig. 14</p>

## What does each placement protect?

<div class="cols wide-fig">
<div class="text">

- post: the stream itself is normalised (our intuition)
- no clean path back to early layers
- pre: $x$ passes untouched, an identity path
- but $F$'s output can grow
- OLMo 2, Gemma: normalise what is added

</div>
<div class="fig"><img src="img/week-04-raschka-fig14-sandwich.png" alt="Raschka Figure 14: OLMo 2 7B's block with RMSNorm after attention and feed-forward and QK-Norm, next to Gemma 3 4B's block with RMSNorm both before and after attention and feed-forward, QK-Norm and sliding-window attention"></div>
</div>

<p class="footnote">Raschka 2025 · §3.2, Fig. 14. Our intuition: the theory (Xiong et al. 2020, arXiv:2002.04745) is cited by Raschka, not in our sources. gpt-oss: "Similar to GPT-2 we use Pre-LN placement" (Pre-LN: pre-norm with LayerNorm)</p>

Note:
Our intuition for what each placement does; the theory paper Raschka cites, Xiong et al. 2020, isn't in our sources. Post-norm passes the residual stream itself through a norm in every block, so there's no clean path from the output back to the early layers; Raschka quotes Xiong that pre-norm has better-behaved gradients at initialisation and needs less careful warm-up. GPT-2 chose pre-norm before that paper; Xiong explained the choice later.
Pre-norm keeps an identity path: x passes through untouched. Its weak point: each block adds an un-normalised output, and nothing stops that output from growing during training.
OLMo 2 normalises every addition before it enters the stream; Gemma does both, which Raschka thinks "can't hurt". And plenty of models stay with pre-norm: gpt-oss, Qwen3. Does OLMo 2's choice help? Next.

---

<p class="eyebrow"><span class="paper">Raschka 2025</span> · §2.1 · Fig. 9 · OLMo 2 · Fig. 7</p>

## Did OLMo 2's norm changes stabilise training?

<div class="rows">
<div class="points">
<div class="text">

- blue: pre-norm; orange: reordered + QK-norm
- spike score: 0.108 ▸ 0.069
- "In isolation, neither of these changes yield good results"

</div>
<div class="text">

<p class="q"><b>Q.</b> Which change did it?</p>
<p class="a"><b>A.</b> Only the pair is shown</p>
<p class="q"><b>Q.</b> Is it a better model?</p>
<p class="a"><b>A.</b> Fewer gradient spikes; no quality comparison</p>

</div>
</div>
<div class="fig"><img src="img/week-04-raschka-olmo2-fig7.png" alt="OLMo 2 Figure 7: L2 norm of the gradient over about 150,000 training steps on a log scale; the pre-attention norm run has many tall spikes, the post-attention norm plus QK-norm run is smoother and slightly lower"></div>
</div>

<p class="footnote">OLMo 2 arXiv:2501.00656 §4, Fig. 7 (Raschka's Fig. 9). L2 norm: square root of the sum of squares. Spike score: percentage of values at least 7 standard deviations from the rolling mean of the last 1,000. One of 8 stability changes</p>

Note:
What they ran: OLMo 2's earlier model had "sudden spikes in the loss, and more frequently, in the gradient norm", growing with model size, which "would lead to training divergence". They made eight changes; two are about norms: the reordering and QK-norm, next slide.
The figure: gradient size over training. Pre-norm, blue, has tall spikes; reordered plus QK-norm, orange, is smoother. Their measure, the spike score, the share of points seven standard deviations from a rolling average, falls from 0.108 to 0.069.
What it shows and doesn't. It's about the pair, so the title credits both changes. Raschka notes the confound; the paper says more: "In isolation, neither of these changes yield good results, but together they improve" the gradient's growth and spikiness. The single-change runs aren't shown. And "stable" means fewer gradient spikes in one model family; there's no final-quality comparison.

---

<p class="eyebrow"><span class="paper">Raschka 2025</span> · §2.2 · OLMo 2 §3</p>

## What goes wrong when attention scores grow?

<div class="cols">
<div class="text">

- score $q \cdot k/\sqrt{d_h}$ grows as both sizes
- $[2, 1, 0]$ ▸ $[0.665, 0.245, 0.090]$
- ×4: $[8, 4, 0]$ ▸ $[0.982, 0.018, 0.0003]$
- ×16: all weight on one token

</div>
<div class="text">

<p class="q"><b>Q.</b> Why is all weight on one token bad?</p>
<p class="a"><b>A.</b> Almost no gradient to other tokens; tiny changes flip the winner (ours)</p>
<p class="q"><b>Q.</b> OLMo 2's words?</p>
<p class="a"><b>A.</b> Large logits "can lead to training loss divergence"</p>

</div>
</div>

<p class="footnote">OLMo 2 arXiv:2501.00656 §3 (QK-norm "avoids attention logits being too large"). Softmax numbers ours. Doubling both $q$ and $k$ multiplies scores by 4</p>

Note:
Attention weights are a softmax of scores, query dot key over root d. If queries and keys both grow during training, the scores grow as the product of their sizes. Watch the softmax: scores 2, 1, 0 give weights two thirds, a quarter, a tenth. Double both vectors, scores times four: 98% on one token. Times sixteen: all of it.
A head whose softmax has collapsed passes almost no gradient to the other positions, and tiny changes in the scores flip which position wins. OLMo 2 says large logits "can lead to training loss divergence".

---

<p class="eyebrow"><span class="paper">Raschka 2025</span> · §2.2 · Gemma 2 §2 · Gemma 3 §2</p>

## How do labs keep the scores in range?

<div class="cols">
<div class="text">

- QK-norm: RMSNorm on each $q$, $k$
- score ≤ about $\sqrt{d_h}\thinspace g_q g_k$: 11.3 × gains
- clip to 8 (OLMo-0424)
- soft-cap: $50\tanh(x/50)$ (Gemma 2)
- z-loss (OLMo 2): same idea, on the output logits, not attention

</div>
<div class="text">

<p class="q"><b>Q.</b> Soft-cap 10 and 100?</p>
<p class="a"><b>A.</b> 9.87 and 48.2</p>
<p class="q"><b>Q.</b> Does Gemma 2 use QK-norm?</p>
<p class="a"><b>A.</b> No: Gemma 3 swapped soft-capping for it</p>

</div>
</div>

<p class="footnote">Gemma 2 arXiv:2408.00118 §2 (soft-cap 50 in attention, 30 on the output); Gemma 3 §2; Qwen3 §2 ("to ensure stable training"); OLMo 2 Table 3. $g$: the norm's learned gain. Bound ours: a normalised vector has length $\sqrt{d_h}\thinspace g$, so $|q \cdot k| \le d_h g_q g_k$, then divide by $\sqrt{d_h}$; $d_h$ = 128. No paper compares the methods; Gemma 3 says it replaces the soft-capping of Gemma 2 with QK-norm</p>

Note:
QK-norm applies RMSNorm to each head's query and key before the dot product. Each normalised vector then has length about root d times its gain, so the score is at most about root d times the gains, 11 times for head size 128, however large the raw activations grow. It goes back to Dehghani et al. 2023 on vision transformers. OLMo 2, Qwen3 and Gemma 3 use it.
Other ways to bound the same scores: OLMo's earlier model clipped activations to 8. Gemma 2 soft-capped the scores: 50 times tanh of score over 50. A score of 10 becomes 9.9; a score of 100 becomes 48. Small scores pass, large ones are squashed. OLMo 2 also adds a z-loss, a related fix on the output logits, not on attention scores. Why the bound: each normalised vector has length root d times its gain, so the dot product is at most d times the two gains, and dividing by root d leaves root d times the gains.
One correction: Raschka lists Gemma 2 among QK-norm users. It used soft-capping; Gemma 3 is where the swap happened, and the paper gives no reason beyond "inspired by" earlier work. No source compares the methods head to head.

--

<p class="eyebrow"><span class="paper">Raschka 2025</span> · §12.2, §13.1 · DeepSeek-V2 §3.1.2 (sub-slide)</p>

## Who uses a variant, and who uses neither?

<div class="cols">
<div class="text">

- MiniMax-M2: one norm over all heads, per-head gains
- Qwen3-Next: output gate, zero-centred QK-norm
- Trinity: gate "reduces attention sinks"
- DeepSeek: norms on the latents instead

</div>
<div class="text">

<p class="q"><b>Q.</b> Is MiniMax's norm per head?</p>
<p class="a"><b>A.</b> Gains only: one head can still grow if others shrink (ours)</p>
<p class="q"><b>Q.</b> Why no QK-norm in DeepSeek?</p>
<p class="a"><b>A.</b> A norm on expanded keys would block absorption (ours)</p>

</div>
</div>

<p class="footnote">Raschka 2025 §13.1 (code `RMSNorm(head_dim * total_num_heads)`), §12.2, §20; all blog only. DeepSeek-V2 §3.1.2, V3 §4.2: "additional RMS Norm layers after the compressed latent vectors"</p>

Note:
Optional. MiniMax-M2's "per_layer" QK-norm, read from its code, normalises all heads' queries together, one root mean square over all of them, with a separate gain per head dimension. Raschka reads it as a separate norm for each head; it's per-head gains, not per-head normalisation, so the bound from the previous slide doesn't hold head by head.
Qwen3-Next's gated attention, per Raschka, adds a sigmoid output gate on the attention result, a zero-centred RMSNorm for QK-norm and partial RoPE, "essentially just stability changes to GQA". Trinity's similar gate is said to reduce attention sinks.
DeepSeek uses neither QK-norm nor soft-capping; it puts RMSNorm after the compressed latents. And a per-head norm on the expanded keys would sit between the up-projection and the score, which would block the absorption trick.

---

<p class="eyebrow"><span class="paper">Raschka 2025</span> · §7.1 · RoFormer §3.2 (Week 3)</p>

## How does RoPE turn position into distance?

<div class="cols">
<div class="text">

<div class="eq">$$(R_m q)^\top (R_n k) = q^\top R_m^\top R_n k = q^\top R_{n-m} k$$</div>

- RoPE, rotary position embedding: rotate each pair of dims by position × $\theta_i$
- $\theta_i = 10000^{-2(i-1)/d_h}$
- inside every layer, not once at the input

</div>
<div class="text">

<p class="q"><b>Q.</b> Fastest and slowest pair, $d_h$ = 128?</p>
<p class="a"><b>A.</b> One turn per 6.3 tokens; about 54,000 tokens</p>
<p class="q"><b>Q.</b> What is GPT-3's limit?</p>
<p class="a"><b>A.</b> No learned vector for position 2049</p>

</div>
</div>

<p class="footnote">RoFormer, Su et al., arXiv:2104.09864 §3.2. $R_m$: block-diagonal rotation by $m\theta_i$ on pair $i$. Wavelength $2\pi/\theta_i$; numbers ours</p>

Note:
A recap from Week 3, with one step written out. GPT-3 adds a learned vector per position, once, at the input, and has no vector for position 2049. RoPE instead rotates each pair of query and key dimensions, inside every attention layer, by an angle proportional to position, with frequencies falling from pair to pair.
Why does that encode relative position? Rotations compose: R_m transposed times R_n is R of n minus m. So the score depends on the two positions only through their distance.
With head size 128, the fastest pair turns once every six tokens; the slowest pair's wavelength at base 10,000 is about 54 thousand tokens.

---

<p class="eyebrow"><span class="paper">Raschka 2025</span> · §15 · Gemma 3 §2, §5.3 (Week 3)</p>

## Why raise the RoPE base for long context?

<div class="cols">
<div class="text">

- OLMo 2: 10,000 ▸ 500,000; Qwen3: ▸ 1,000,000
- Gemma 3: 10k local, 1M global
- Week 3: 24 of 64 pairs never turn in 32K
- helps "if the model is (pre)trained with the new base"
- candidate reason: slower long-term decay

</div>
<div class="text">

<p class="q"><b>Q.</b> Why 10k on local layers?</p>
<p class="a"><b>A.</b> Our guess: they only see 1024 tokens; the paper gives no reason</p>
<p class="q"><b>Q.</b> Gemma 3: 32K, "factor of 8", 128K?</p>
<p class="a"><b>A.</b> 32K × 8 is 256K; the paper doesn't explain it</p>

</div>
</div>

<p class="footnote">OLMo 2 §3 ("increases the resolution of positional encoding"); Qwen3 §3.2 (ABF: adjusted base frequency, Xiong et al. 2023, not in our sources); Gemma 3 §2, §5.3; RoFormer §3.3 ("a long-term decay property"; derived in §3.4.3). Week 3 count: Qwen3, base $10^6$</p>

Note:
The 2025 models mostly keep RoPE and change its base. OLMo 2 raised it from 10 thousand to half a million, Qwen3 to a million. Gemma 3 uses a million on global layers and keeps 10 thousand on local layers, which only ever see 1024 tokens and never need long wavelengths.
Why does a bigger base help? Recall Week 3. A bigger base slows every pair, and Week 3 counted the cost: with Qwen3's base, 24 of the 64 pairs never complete a turn within 32 thousand training tokens, so at longer lengths they reach angles never seen. The condition we saw: it helps if the model is trained at long context with the new base. The base alone doesn't extend context.
The usual reason, also from Week 3, is RoFormer's long-term decay: a ceiling on the score that falls with distance at a rate set by the frequencies. A larger base slows the fall, so distant tokens can still get large scores. That's the candidate rationale, not a result in our sources; OLMo 2 only says it "increases the resolution".
And a flag: Gemma 3 trains at 32 thousand and says a scaling factor of 8 reaches 128 thousand. 32 times 8 is 256. The paper doesn't explain it.

---

<p class="eyebrow"><span class="paper">Raschka 2025</span> · §7.1 · NoPE · Theorem 1</p>

## Can a model work with no position signal at all?

<div class="cols">
<div class="text">

- NoPE (no position embedding): "Not fixed, not learned, not relative. Nothing."
- the causal mask still gives order
- start token carries a marker
- uniform attention: weight $1/t$ each
- output holds $1/t$: a position

</div>
<div class="text">

<p class="q"><b>Q.</b> Then what does the FFN do?</p>
<p class="a"><b>A.</b> Turns $1/t$ into $t$</p>
<p class="q"><b>Q.</b> Relative position?</p>
<p class="a"><b>A.</b> Later layers "can implement" it (Theorem 2)</p>

</div>
</div>

<p class="footnote">Kazemnejad et al. 2023, arXiv:2305.19466 §4, App. C: Theorem 1, "the first layer ... can recover absolute positions"; the proof uses uniform attention weights $1/t$. Raschka §7.1</p>

Note:
The bolder idea: some layers get no positional information at all. How can that work? The causal mask. Token t can see exactly t tokens, so what it can attend to already depends on where it is.
The NoPE paper proves the first layer can recover absolute position, and the proof is one line of intuition. Give the start-of-sequence token a marker no other token has. Let a head attend uniformly to everything it can see: each of the t visible tokens gets weight 1 over t, so the head's output contains the marker times 1 over t. That number is the position, and the feed-forward layer can turn 1 over t into t. Later layers can then build relative position on top.

---

<p class="eyebrow"><span class="paper">Raschka 2025</span> · §7.1 · Fig. 23 · NoPE · Fig. 3</p>

## Does NoPE generalise to longer inputs?

<div class="rows">
<div class="points">
<div class="text">

- 107M models, trained per toy task
- grey: training lengths (20 for Copy)
- NoPE usually falls last; T5 bias close

</div>
<div class="text">

<p class="q"><b>Q.</b> And Rotary?</p>
<p class="a"><b>A.</b> Among the weakest here, yet most 2025 models keep it</p>
<p class="q"><b>Q.</b> How long is "longer"?</p>
<p class="a"><b>A.</b> 20 ▸ 40 items, not 32K ▸ 128K tokens</p>

</div>
</div>
<div class="fig"><img src="img/week-04-raschka-nope-fig3.png" alt="NoPE paper Figure 3: accuracy against problem length on Copy, Addition, SCAN, Reverse, Summation and PCFG for NoPE, T5's relative bias, ALiBi, Rotary and absolute position embedding, with training lengths shaded; NoPE stays near 1 on Copy to length 40 while absolute and Rotary drop to 0, all fail on Addition beyond about 10 and tie on PCFG"></div>
</div>

<p class="footnote">Kazemnejad et al. 2023 · Fig. 3 (Raschka's Fig. 23). T5 bias: a learned number per distance added to the score; ALiBi: a penalty growing linearly with distance; SCAN: commands to action sequences; PCFG: string tasks from a probabilistic grammar. Lengths are task counts: 20 for most, 8 for Addition and Summation</p>

Note:
What they ran: small decoder-only models, about 107 million weights, trained from scratch on synthetic tasks, each with five position schemes: learned absolute, T5's relative bias, ALiBi, Rotary, and none. Trained on short problems, tested on longer ones.
How to read it: grey is the training range. Inside it most methods are near perfect. Beyond it, NoPE usually falls off last: on Copy it stays near 1 where absolute and Rotary drop to 0. T5's relative bias tracks NoPE on Reverse and SCAN; all tie on PCFG and all fail on Addition beyond about 10. The paper: NoPE "performs on par with or even better than the best-performing explicit" encoding, T5's bias.
Note the tension: Rotary, which most 2025 models keep (with NoPE in a few layers), is among the weakest here. And note the scale: "length generalisation" is 20 to 40 items in a toy task, not 32 thousand to 128 thousand tokens of text.

--

<p class="eyebrow"><span class="paper">Raschka 2025</span> · §7.1 · NoPE §7 (sub-slide)</p>

## Does it hold at a billion parameters?

<div class="cols">
<div class="text">

- three 1B models, code, 1,024-token context
- Rotary: perplexity "explodes"
- NoPE ≈ ALiBi to about 2x the context
- beyond: ALiBi more stable

</div>
<div class="text">

<p class="q"><b>Q.</b> So how is NoPE used?</p>
<p class="a"><b>A.</b> In some layers only: SmolLM3, Llama 4, Kimi Linear, Trinity</p>

</div>
</div>

<p class="footnote">NoPE paper §7 ("we trained three 1B variants post-submission"); "We could not study how large-scale pretraining affects different PEs" (positional encodings). Raschka §7.1: "It is unclear how well these findings generalize". Usage per Raschka and Meta's blog</p>

Note:
Optional. Raschka says it plainly: these are 100-million-parameter models on small contexts, and "it is unclear how well these findings generalize". The paper agrees and adds three 1B models after submission, trained on code with a 1,024-token context. Rotary's perplexity explodes past the training length; NoPE and ALiBi both generalise to about twice it, and beyond that ALiBi is steadier. So at 1B NoPE's advantage over ALiBi disappears.
Plausibly, though this motive is Raschka's guess, that is why it's used cautiously, in some layers only: SmolLM3 drops RoPE from every fourth layer; Llama 4, Kimi Linear and Trinity have global layers without positions.

--

<p class="eyebrow"><span class="paper">Raschka 2025</span> · §13.3, §23 · DeepSeek-V2 §2.1.3 (sub-slide)</p>

## What if only some dimensions rotate?

<div class="cols">
<div class="text">

- partial RoPE: rotate part of each head
- MiniMax: half the head
- Gemma 4: 25% of the pairs
- DeepSeek: 64 of 192 dims (one third)

</div>
<div class="text">

<p class="q"><b>Q.</b> Why only some dimensions?</p>
<p class="a"><b>A.</b> No source says, except DeepSeek's: keep absorption</p>
<p class="q"><b>Q.</b> What is Raschka's guess?</p>
<p class="a"><b>A.</b> No rotation beats an extreme one never seen</p>

</div>
</div>

<p class="footnote">MiniMax per its README, Gemma 4 per its model card, both via Raschka. DeepSeek-V2 §2.1.3: 128 unrotated plus 64 rotated dims per head (ours: a form of partial RoPE)</p>

Note:
Optional. The middle ground: in each head, rotate some dimensions and leave the rest plain. MiniMax rotates half of each head, per its README; Gemma 4 rotates a quarter of the pairs, per its model card. Why? No primary source we have motivates it; Raschka guesses that no rotation may be better than an extreme rotation never seen in training.
One verified example the blog doesn't point out: DeepSeek's decoupled RoPE is a form of partial RoPE. Each head has 128 unrotated dimensions plus 64 rotated ones, so a third of the score carries position. DeepSeek got there for a different reason, keeping absorption, so the same design was reached from two directions.

---

<p class="eyebrow"><span class="paper">Raschka 2025</span> · §9.1 · Fig. 27 · Gemma 2 · Table 9</p>

## Wider or deeper?

<div class="cols wide-fig">
<div class="text">

- gpt-oss-20b: 24 blocks, width 2880
- Qwen3-30B: 48 blocks, width 2048
- not a controlled pair: sizes and experts differ
- Gemma 2 9B: wide 50.8, deep 52.0
- blog: the labels swapped
- depth is slower (Raschka's timing)

</div>
<div class="fig"><img src="img/week-04-raschka-fig27-width.png" alt="Raschka Figure 27, the MoE layers of gpt-oss-20b (left, 32 experts, 4 active, embedding 2880) and Qwen3 30B-A3B (right, 128 experts, 8 active, 32 heads, embedding 2048)"></div>
</div>

<p class="footnote">Raschka 2025 · §9.1, Fig. 27 (left: gpt-oss-20b; right: Qwen3 30B-A3B; widths other than 2880 are from the blog only). Gemma 2 arXiv:2408.00118 Table 9: "a deeper 9B network is slightly better than a wider 9B" (4-benchmark average only). Raschka reports wider 52.0, deeper 50.8. Speed: Raschka §6.1 (Qwen3 0.6B vs Llama 3 1B on an A100)</p>

Note:
gpt-oss is wide and shallow, Qwen3 narrow and deep, but the two are not a controlled pair: total size, expert count and active experts all differ. Which is better at a fixed size? Raschka says there's no good apples-to-apples comparison except Gemma 2's Table 9, which he reports as wider 52.0, deeper 50.8. The paper says the opposite: wide 50.8, deep 52.0, "a deeper 9B network is slightly better". The numbers are right, the labels are swapped, and it's the blog's only quality evidence on the question, so the slip reverses its conclusion. The paper also says the gap is "consistent across benchmarks" but prints only the average.
The other side, from Raschka's own timing: Qwen3 0.6B, deeper than Llama 3 1B, generates more slowly, because layers run one after another. So as far as these sources go: deeper may be slightly better per weight, wider is faster.

--

<p class="eyebrow"><span class="paper">Raschka 2025</span> · §9.3, §12.3 · gpt-oss §2.2 · DeepSeek-V3 §4.5 (sub-slide)</p>

## What are three smaller changes?

<div class="cols">
<div class="text">

- sinks: a learned term in the softmax denominator
- lets a head attend to "no tokens"
- biases: gone in OLMo, back in gpt-oss
- multi-token prediction: an extra head for $t+2$

</div>
<div class="text">

<p class="q"><b>Q.</b> Does the extra head help?</p>
<p class="a"><b>A.</b> V3: better "on most" benchmarks; discarded at inference</p>
<p class="q"><b>Q.</b> Is it always discarded?</p>
<p class="a"><b>A.</b> Not in Nemotron 3 Super: it drafts tokens (per Raschka)</p>

</div>
</div>

<p class="footnote">gpt-oss §2.2: "a learned bias in the denominator of the softmax ... pay no attention to any tokens". DeepSeek-V3 §4.5.1: 15.7B and 228.7B baselines, "1-depth MTP module" (multi-token prediction), "we directly discard the MTP module". Biases per Raschka §9.3</p>

Note:
Optional, three smaller items. Attention sinks: gpt-oss gives each head a learned term in the softmax denominator, so a head with nothing useful to read can put its weight on "nowhere". Biases: removed in OLMo and Qwen3, brought back in gpt-oss's attention, which Raschka calls "commonly regarded as redundant"; no reason is given for the return.
Multi-token prediction: an extra head trained to predict the token after next. DeepSeek-V3 ablates it at two scales with data and architecture fixed, and since the module is thrown away at inference, inference cost is identical: it "consistently enhances the model performance on most" benchmarks. Nemotron 3 Super, per Raschka, keeps the head at inference to draft tokens for speculative decoding.

---

<p class="eyebrow"><span class="paper">Raschka 2025</span> · §12, §14 · Fig. 42</p>

## Can attention stop growing with the context?

<div class="rows">
<div class="points">
<div class="text">

- drop the softmax: $\phi$ is a feature map

<div class="eq" style="margin-top:8px">$$\big(\phi(Q)\phi(K)^\top\big)V = \phi(Q)\big(\phi(K)^\top V\big)$$</div>

- state $\sum_j \phi(k_j) v_j^\top$: fixed size
- $128 \times 128$ = 16,384 = a 64-token cache

</div>
<div class="text">

- the catch: a fixed state forgets
- hybrids: 3 linear layers : 1 full
- MiniMax: back to full attention in M2

</div>
</div>
<div class="fig"><img src="img/week-04-raschka-fig42-ratio.png" alt="Raschka Figure 42, the layer lists of Qwen3-Next 80B-A3B (left) and Kimi Linear 48B-A3B (right): a 3:1 ratio, layers 1 to 3 linear attention then MoE, layer 4 full attention then MoE, and the same again for layers 5 to 8"></div>
</div>

<p class="footnote">Raschka 2025 §12.2, §14, Fig. 42 (the 3:1 layer lists of Qwen3-Next, left, and Kimi Linear, right); all blog only. $\phi$: a feature map (Katharopoulos et al. 2020). Gated DeltaNet: linear attention with a gated "fast-weight memory"; Mamba-2 (Nemotron 3): a state-space layer with a running hidden state. 16,384 ours</p>

Note:
Softmax attention forms a score for every pair of tokens, and at decode the cache grows with the context. The old linear-attention idea replaces the softmax with a feature map, and then uses the same associativity as MLA's absorption: compute phi of K transposed times V first, and you never form the n by n matrix. The equality on the slide only holds after the softmax is gone.
At decode it's better still. That product is a fixed-size state, updated once per token, with a running sum that handles the causal mask. The cache stops growing. Head size 128: 16 thousand numbers per head, the size of a plain cache of just 64 tokens.
The catch: a fixed-size state has to forget, so exact recall of a far-back token is weaker. Raschka: the modern versions give "less precise content-based retrieval than full attention". So 2025 models mix, like local and global layers: Qwen3-Next and Kimi Linear use three linear layers per full one, as the figure's layer lists show, and Nemotron 3 uses Mamba-2 layers. And MiniMax went back to full attention for M2, citing poor accuracy in reasoning and multi-turn tasks. All of this is blog-only: a map, not a result.

---

<p class="eyebrow"><span class="paper">Raschka 2025</span> · Synthesis</p>

## How much should we trust each kind of claim?

<table class="rules" style="font-size:21px">
  <tr><td>level</td><td>example</td><td>where it shows up</td><td>status</td></tr>
  <tr><td>observation</td><td>what each model is</td><td>the lineup tables</td><td>mostly correct readings</td></tr>
  <tr><td>mechanism</td><td>KV cache, active weights, parameter counts</td><td>the rebuilds</td><td>solid: arithmetic we redid</td></tr>
  <tr><td>effect on quality</td><td>"X is better"</td><td>GQA, MLA, windows, NoPE</td><td>thin: no error bars, confounds, 3 misreported</td></tr>
</table>

<p class="q" style="margin-top:24px"><b>Q.</b> Which level do the blog's "X helps" sentences sit on?</p>
<p class="a"><b>A.</b> The thinnest one (ours)</p>
<p class="q"><b>Q.</b> Which level did we find most useful for teaching?</p>
<p class="a"><b>A.</b> Mechanism: you can check it with arithmetic (ours)</p>

<p class="footnote">Raschka 2025; checks against DeepSeek-V2, DeepSeek-V3, DeepSeekMoE, Gemma 2, Gemma 3, OLMo 2, gpt-oss, Qwen3, NoPE. Misreported: width vs depth, Gemma 2 QK-norm, query compression</p>

Note:
Three kinds of claim deserve different trust. Observation, what the models are structurally: the blog's strength, careful readings of configurations and reports in a uniform style that makes comparison easy. Mechanism, why each swap saves what it saves: solid where it's arithmetic, and we rebuilt most of it today. Effect on quality, whether a swap makes models better: the weakest level. A handful of ablations without error bars, often confounded, sometimes contradicting each other, and in three places misreported by the blog.

---

<p class="eyebrow"><span class="paper">Raschka 2025</span> · Limitations</p>

## What does Raschka admit?

<div class="cols">
<div class="text">

- data and training "vary widely and are often not well documented"
- "difficult to determine their exact impact"
- width vs depth: "no good apples-to-apples comparison"
- NoPE: "unclear how well these findings generalize"

</div>
<div class="text">

<p class="q"><b>Q.</b> What is his view of architecture?</p>
<p class="a"><b>A.</b> "A lot of the secret sauce these days is in the training pipeline"</p>
<p class="q"><b>Q.</b> How does he mark guesses?</p>
<p class="a"><b>A.</b> "I speculate", "If I had to guess"</p>

</div>
</div>

<p class="footnote">Raschka 2025 · Introduction, §5, §9.1, §7.1; the "secret sauce" remark is in §17, about Mistral 3 Large reusing the DeepSeek V3 architecture</p>

Note:
He is upfront. Datasets, training and hyperparameters "vary widely and are often not well documented". Given the many small differences, "it is difficult to determine their exact impact on final model performance". On width versus depth, there's "no good apples-to-apples comparison". On NoPE, "it is unclear how well these findings generalize".
And in his section on Mistral 3 Large reusing the DeepSeek V3 architecture, a remark that undercuts the premise of an architecture survey: "why change what ain't broke? A lot of the secret sauce these days is in the training pipeline as well as the inference scaling strategies."
He also marks his guesses as guesses, which makes the blog easier to check than many papers.

---

<p class="eyebrow"><span class="paper">Raschka 2025</span> · Critique 1 (ours)</p>

## Can a survey say what made a model good?

<div class="cols">
<div class="text">

- every model differs in data, training, size
- and in several swaps at once
- "X helps" only as good as its ablation

</div>
<div class="text">

<p class="q"><b>Q.</b> Does he admit it?</p>
<p class="a"><b>A.</b> Yes, in the first lines</p>
<p class="q"><b>Q.</b> Does it sink the argument?</p>
<p class="a"><b>A.</b> Mostly no: the survey is descriptive; where it says "X helps", see the next slide</p>

</div>
</div>

<p class="footnote">Ours. Raschka 2025 Introduction: comparing LLMs "is notoriously challenging"</p>

Note:
The first critique: a structural survey can't say what made a model good. Every model differs from every other in data, training, size and several architecture choices at once. He admits it in the first lines. It doesn't sink the argument, because the argument is descriptive: here is what labs chose. It does mean that every sentence of the form "X helps" is only as good as the ablation behind it, which is why we checked each one.

---

<p class="eyebrow"><span class="paper">Raschka 2025</span> · Critique 2 (ours)</p>

## Are the blog's citations right?

<table class="rules" style="font-size:22px">
  <tr><td>claim in the blog</td><td>the source says</td><td>verdict</td></tr>
  <tr><td>Gemma 2: wider 52.0, deeper 50.8</td><td>wide 50.8, deep 52.0</td><td>wrong</td></tr>
  <tr><td>Gemma 2 uses QK-norm</td><td>soft-capping; Gemma 3 swapped</td><td>wrong</td></tr>
  <tr><td>queries compressed "only during training"</td><td>motive is training; runs at inference too</td><td>wrong</td></tr>
  <tr><td>MLA beats GQA</td><td>never compared</td><td>imprecise</td></tr>
  <tr><td>windows "originally" from Longformer</td><td>GPT-3, Sparse Transformer first</td><td>imprecise</td></tr>
  <tr><td>windows: "little to no impact"</td><td>no full-attention baseline</td><td>imprecise</td></tr>
  <tr><td>MoE reduces memory</td><td>reduces arithmetic, not storage</td><td>imprecise</td></tr>
</table>

<p class="footnote">Ours, against Gemma 2 Table 9 and §2, Gemma 3 §2, §5.1, DeepSeek-V2 §2.1.2, App. D, GPT-3 §2.1, Longformer §2 ("most similar ... Sparse Transformer"), gpt-oss §2.1. Also imprecise: Fig. 9's "loss spikes" label. Unverified: Fig. 1's dense Qwen3 layers</p>

Note:
Checked against the papers. Three are wrong: Gemma 2's width-depth result is reversed; Gemma 2 is said to use QK-norm but used soft-capping; and MLA's query compression is said to be training-only, when the paper's reason is training memory but the compressed path runs at inference too.
Four are imprecise: MLA beating GQA chains two experiments; sliding windows didn't originate in Longformer, which itself names the Sparse Transformer; Gemma 3's plot has no full-attention baseline; and MoE reduces arithmetic, not stored memory. Smaller: the OLMo figure annotated as loss spikes plots gradient norm; and one overview diagram gives Qwen3-235B dense layers that its own later figure and the Qwen3 report don't, which we couldn't verify.
Does the blog admit these? No; it does not know. Does it sink the argument? Not the survey; but the width-depth paragraph should be discarded as written. A good secondary source is a map; numbers on slides come from the papers.

---

<p class="eyebrow"><span class="paper">Raschka 2025</span> · Critique 3 (ours)</p>

## Efficient at what?

<div class="cols">
<div class="text">

- memory: GQA, MLA, windows
- arithmetic: mixture of experts
- latency: dropping windows (Mistral)
- summaries blur the three

</div>
<div class="text">

<p class="q"><b>Q.</b> Does he admit it?</p>
<p class="a"><b>A.</b> Partly: the latency guess is his</p>
<p class="q"><b>Q.</b> Does it sink the argument?</p>
<p class="a"><b>A.</b> No, but it's the first thing to fix in teaching</p>

</div>
</div>

<p class="footnote">Ours. Raschka §3 ("reduce memory requirements"), §4 (latency)</p>

Note:
"Efficient" is used for three different things: memory, for GQA, MLA and windows; arithmetic, for mixture of experts; and latency, for Mistral's choice to drop windows. The blog usually says which, and the latency point is his own, but the summary sentences blur them. That doesn't sink the argument, but it's the first thing to fix when teaching it, which is why we started from what one token costs.

---

<p class="eyebrow"><span class="paper">Raschka 2025</span> · Critique 4 (ours)</p>

## What about the choices that failed?

<div class="cols">
<div class="text">

- we see what was adopted
- rarely what was tried and dropped
- exceptions: MiniMax, Qwen's quote, DeepSeekMoE's null
- and the blog itself keeps changing

</div>
<div class="text">

<p class="q"><b>Q.</b> Does it sink the argument?</p>
<p class="a"><b>A.</b> It weakens "many labs adopted X" as evidence for X</p>
<p class="q"><b>Q.</b> How do you cite a living document?</p>
<p class="a"><b>A.</b> Give the version date: 2 April 2026</p>

</div>
</div>

<p class="footnote">Ours. The blog grew from 8 to 23 sections; the shared-expert discussion was overtaken by Qwen3-Next</p>

Note:
We hear which choices were adopted, rarely which were tried and dropped. The exceptions: MiniMax's return to full attention, the Qwen shared-expert quote, and DeepSeekMoE's null result on the number of shared experts. Survivorship makes every choice look like a success, which weakens any reading of "many labs adopted X" as evidence that X works.
And the blog is a living document: it grew from 8 to 23 sections, and early sections were overtaken by later models. Cite it with a date.

--

<p class="eyebrow"><span class="paper">Raschka 2025</span> · Outside evidence (sub-slide)</p>

## What evidence changes the reading?

<div class="cols">
<div class="text">

- Gemma 2's GQA test vs DeepSeek-V2's
- Table 9's large pair: not matched
- NoPE at 1B: ties ALiBi
- labs reversing themselves: Gemma 3, Qwen3-Next
- MiniMax-M2 back to full attention

</div>
<div class="text">

<p class="q"><b>Q.</b> What would settle each open point?</p>
<p class="a"><b>A.</b> A matched GQA vs MLA run; a full-attention point in Gemma 3's ablation; NoPE at scale (ours)</p>

</div>
</div>

<p class="footnote">Gemma 2 Table 8; DeepSeek-V2 Tables 8, 9; NoPE §7; Gemma 3 §2; Raschka §12.1, §14.3</p>

Note:
Optional: the pieces of evidence that revise what the blog says. Gemma 2's own MHA against GQA test sits against DeepSeek-V2's, so whether sharing hurts is open both ways. The large MLA-MHA pair isn't matched in heads or depth. NoPE's advantage shrinks to a tie with ALiBi at 1B. Gemma 3 replacing soft-capping and Qwen3-Next bringing back the shared expert are labs revising themselves. And MiniMax's return to full attention is a public negative result for linear attention. What would settle each point: a matched GQA against MLA run, a full-attention point in Gemma 3's window ablation, and NoPE tested at scale (our list).

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

<p class="footnote">GPT-3 §2.1, Table 2.1; Gemma 3 §2; OLMo 2 §3; DeepSeek-V3 §4.2; gpt-oss §2.2. KV per token: numbers per token, 2 × KV heads × head size × layers (ours). Active shares: 5.51% (DeepSeek-V3), 4.39% (gpt-oss-120b); ours. YaRN: a RoPE rescaling for long context</p>

Note:
The pairing with reading 1 teaches one thing well. GPT-3's argument was that scale is what matters, and it barely touched the architecture. Five years later the architecture is still recognisably GPT-3's: same skeleton, same block. Most of what changed is about making that scale cheaper to run: a cache 67 times smaller per token, a few percent of the weights used per token, and positions that stretch to long context. The rest is stability, context length and (claimed) quality.

---

<p class="eyebrow"><span class="paper">Raschka 2025</span> · Summary</p>

## What to keep from Raschka

<div class="cols">
<div class="text">

- still GPT's block, six parts swapped
- decode is memory-bound: bytes, not FLOPs
- two numbers explain half the swaps: KV per token, active weights
- total ≠ active: memory vs arithmetic
- quality evidence: thin

</div>
<div class="text">

<p class="q"><b>Open question</b></p>
<p class="a">If the architecture barely changed, what in training does the work?</p>

</div>
</div>

<p class="footnote">Raschka 2025. Next: PPO and GRPO, the method DeepSeek-R1 used on top of DeepSeek-V3 (arXiv:2501.12948)</p>

Note:
Five things to keep. The 2025 block is still GPT's block; six parts were swapped, and each is easiest to understand as an answer to "what is expensive?". During decoding, the expensive thing is moving bytes, not doing arithmetic. Two numbers explain half the swaps (the cache sharing, the windows and the mixture of experts): the KV cache per token and the active weights per token; compute those for a model and you know much of what its architecture is for. Total and active weights are different things: memory follows the total, arithmetic the active count. And the quality evidence for these changes is thin; the memory arithmetic is solid.
The open question for the rest of the week: if the architecture changed this little, and even Raschka suspects the secret sauce is in training, what in training is doing the work? PPO and GRPO, the method R1 used on top of DeepSeek-V3, take up one answer.




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

<p class="eyebrow"><span class="paper">Schulman et al. 2017</span> · Motivation · §1</p>

## What problem is PPO solving?

<div class="cols">
<div class="text">

- data is expensive: reuse it?
- too little: wasted samples
- too far: the policy collapses
- TRPO (trust region policy optimization): safe, but second-order (uses curvature)
- PPO: clip one ratio, then plain Adam

</div>
<div class="text">

<p class="q"><b>Q.</b> Why should a language-model class care?</p>
<p class="a"><b>A.</b> The model is the policy; each token is an action; InstructGPT used PPO</p>
<p class="q"><b>Q.</b> The twist?</p>
<p class="a"><b>A.</b> Later work: much of PPO's gain over TRPO came from code details, not the clip</p>

</div>
</div>

<p class="footnote">Schulman et al. 2017 · arXiv:1707.06347 · OpenAI. TRPO: Schulman et al. 2015. The paper says TRPO is "not compatible with architectures that include noise (such as dropout) or parameter sharing" (§1). Twist: Engstrom et al. 2020, later in this section (their claim is about PPO's gain in reward over TRPO)</p>

Note:
Here is the practical question. You have a policy, a network that picks actions, and a batch of experience it just collected. How far can you move the policy using that batch before you need fresh data? Move too little and you waste expensive samples: a plain policy gradient uses each one for a single gradient step. Move too far and the policy can collapse, because the data no longer describes the policy you are running.
The best method of the day for staying safe, TRPO, needed second-order machinery, and the paper says it didn't mix with dropout or with networks that share layers between the policy and the value estimate. PPO's answer is tiny: clip the ratio between new and old policy, take a pessimistic minimum, and run several epochs of ordinary Adam on the same batch.
Why care in this class? Fine-tune a language model on a reward and the model is the policy, every token an action. PPO is what InstructGPT used, and our next reading modifies it. And a twist we'll come back to: three years later, Engstrom et al. showed much of PPO's edge over TRPO came from undocumented code details, not the clip.

---

<p class="eyebrow"><span class="paper">Schulman et al. 2017</span> · Preliminary (needed first)</p>

## What are a policy, a reward and a return?

<div class="cols wide-fig">
<div class="text">

- state $s_t$, action $a_t$, reward $R_t$
- policy $\pi_\theta(a \mid s)$: a network
- episode $\tau$: one run to the end
- return: total reward from now on
- goal: expected return
- discount $\gamma \lt 1$: later rewards count less (a variance knob, not the goal)

<div class="eq">$$J(\theta) = \mathbb{E}_{\tau\sim\pi_\theta}\Big[\textstyle\sum_t R_t\Big]$$</div>

<p class="q"><b>Q.</b> $\gamma = 0.99$: a reward 100 steps away?</p>
<p class="a"><b>A.</b> $0.99^{100} = 0.366$ of one now</p>

</div>
<div class="fig"><img src="img/week-04-ppo-agent.svg" alt="Illustration: the policy, the agent, sends an action to the environment; the environment returns the next state and a reward"></div>
</div>

<p class="footnote">Preliminary, ours. GAE (generalised advantage estimation, Schulman et al. 2015): $\gamma$ is a way "to reduce variance ... at the cost of introducing bias". Andrychowicz et al. 2020 likewise treat the goal as undiscounted. The paper writes $r_t$ for reward; we write $R_t$, since $r_t$ is also its ratio</p>

Note:
Supervised learning has a target for every input; here we only find out afterwards whether what we did was good. At step t the agent sees a state, picks an action, and gets a reward, a number. One run to the end is an episode. The policy is a network that outputs a distribution over actions: on the paper's robots a Gaussian (bell curve) over joint torques, on Atari a softmax over joystick moves.
The return is the total reward from now on, and the goal is its expectation over episodes, tau being one run to the end. Every table in the paper uses a discount gamma of 0.99, so a reward 100 steps away counts about a third: gamma below 1 makes later rewards count less. But the GAE paper and later Andrychowicz et al. treat gamma as part of the algorithm, a knob that cuts variance at the cost of bias, not part of the goal. That reading is what makes the paper's Eq. 1 come out exactly as printed.
Two notation warnings. The paper uses r t for both the reward and the probability ratio; we write capital R for reward. And it uses delta for both TRPO's KL limit and the one-step surprise.

---

<p class="eyebrow"><span class="paper">Schulman et al. 2017</span> · Preliminary (needed first)</p>

## How is a language model a policy?

<div class="cols wide-fig">
<div class="text">

- state: prompt + tokens so far
- action: next token, 1 of 50257
- transition: append it; deterministic
- reward: one number, at the end
- too many responses: we must sample

<p class="q"><b>Q.</b> One step or many?</p>
<p class="a"><b>A.</b> Both: one reward per response, but we apply PPO's ratio per token (ours)</p>

</div>
<div class="fig"><img src="img/week-04-ppo-tokens.svg" alt="Illustration: a prompt followed by three tokens with probabilities 0.9, 0.8 and 0.5; rewards 0, 0 and 1; the response probability is 0.36"></div>
</div>

<p class="footnote">Ours. 50257: GPT-2's byte-pair vocabulary (subword pieces); GPT-3 reuses the tokenizer (this week's GPT-3 reading). InstructGPT calls the setting "a bandit environment": one prompt, one response, one reward</p>

Note:
The mapping is direct. The state is the prompt plus the tokens generated so far; the action is the next token, one of about fifty thousand; the transition is deterministic, append the token; and the reward is usually one number at the end, from a reward model or a checker. For "Name the capital of France." three tokens with probabilities 0.9, 0.8 and 0.5 give the whole response probability 0.36, and only the last token sees a reward.
Is this a one-step or many-step problem? Both, and hold both views. InstructGPT calls it a bandit: one prompt in, one response out, one reward. But PPO's ratio, clip and advantage run per token, treating each token as a step whose only nonzero reward is at the end. And we can't compute expectations exactly: there are astronomically many responses, so everything below is an estimate from samples, with a variance.

---

<p class="eyebrow"><span class="paper">Schulman et al. 2017</span> · Preliminary (needed first)</p>

## What makes an action good?

<div class="cols">
<div class="text">

- value $V(s)$: expected return from $s$
- $Q(s, a)$: take $a$ first, then the policy
- advantage $A = Q - V$: better than expected?
- $A \gt 0$: do it more; $A \lt 0$: less
- $V$ is learned: regress it onto returns we observe

</div>
<div class="text">

<p class="q"><b>Q.</b> Who knows $V$?</p>
<p class="a"><b>A.</b> Nobody: a second network learns it, the value network ("critic")</p>
<p class="q"><b>Q.</b> For a language model?</p>
<p class="a"><b>A.</b> A transformer with a scalar head, predicting the final reward; InstructGPT: 6B, started from the reward model (a network trained on human rankings)</p>

</div>
</div>

<p class="footnote">Ours, standard definitions. InstructGPT (Ouyang et al. 2022) used "a 6B RM and a 6B value function" for policies of every size; RM: reward model</p>

Note:
A good action isn't one with high reward; it's one that did better than we expected from that state. The value V of s is the expected return from s following the policy. Q of s and a is the expected return if we take a first. The advantage, Q minus V, is how much better a is than the policy's average behaviour there. A positive advantage means do this more often, negative means less. That sign steers every update in this paper, and PPO treats the two signs differently.
V isn't known; a second network learns it, the value network or critic, by regression onto the returns we actually observe. For a robot it's a small net. For a language model it's itself a transformer with a scalar output head, reading the prompt and response so far and predicting the final reward. InstructGPT used a 6-billion-parameter value network for every policy size. Remember this: the next reading removes this piece.

---

<p class="eyebrow"><span class="paper">Schulman et al. 2017</span> · overview · §6</p>

## What will the paper test?

<table class="rules">
  <tr><td>experiment</td><td>question</td><td>compared with</td><td>result</td></tr>
  <tr><td>Table 1, §6.1</td><td>which way of limiting the step?</td><td>PPO variants: none, clip, KL penalty</td><td>clip 0.82; none −0.39</td></tr>
  <tr><td>Fig. 3, §6.2</td><td>better than other algorithms?</td><td>TRPO, CEM, vanilla policy gradient, A2C</td><td>ahead on 3 of 7; behind TRPO on Swimmer</td></tr>
  <tr><td>Figs. 4, 5, §6.3</td><td>does it scale to a humanoid?</td><td>nothing</td><td>runs, steers, gets up</td></tr>
  <tr><td>Table 2, §6.4</td><td>pixels, discrete actions, shared network?</td><td>A2C, ACER</td><td>fastest (30 games); ACER ends higher (28 to 19)</td></tr>
</table>

<p class="footnote">Schulman et al. 2017 §6. MuJoCo: a physics simulator for robot tasks (Gym: a standard set of RL tasks). CEM: cross-entropy method, gradient-free. A2C: advantage actor-critic. ACER: actor-critic with experience replay. Atari: 49 Atari 2600 games from pixels</p>

Note:
Before any maths, here is what the paper will test. Table 1 compares ways of limiting the update inside PPO itself: nothing, clipping, a fixed or adaptive KL penalty, on seven MuJoCo robot tasks. Figure 3 compares PPO with other algorithms on the same tasks. Figures 4 and 5 show a simulated humanoid learning to run and steer, with nothing to compare against. And Table 2 runs 49 Atari games against A2C and ACER.
Two things to notice already. Only Table 1 isolates the clip; everything else compares whole algorithms. And TRPO, the method PPO claims to match, appears only in Figure 3.

---

<p class="eyebrow"><span class="paper">Schulman et al. 2017</span> · §2.1 Policy gradient methods</p>

## Step 1: how do you differentiate what you sample?

<div class="cols">
<div class="text">

<div class="eq">$$\nabla_\theta J = \sum_\tau R(\tau)\,p_\theta(\tau)\nabla_\theta\log p_\theta(\tau)$$</div>
<div class="eq">$$= \mathbb{E}_{\tau\sim\pi_\theta}\big[R(\tau)\nabla_\theta\log p_\theta(\tau)\big]$$</div>

- trick: $\nabla p = p\nabla\log p$
- an expectation: estimate by sampling

</div>
<div class="text">

<div class="eq">$$\log p_\theta(\tau) = \textstyle\sum_t \log\pi_\theta(a_t \mid s_t) + \text{dynamics}$$</div>

- dynamics don't depend on $\theta$
- no model of the environment needed

<p class="q"><b>Q.</b> For a language model?</p>
<p class="a"><b>A.</b> Dynamics: "append the token"; nothing to model</p>

</div>
</div>

<p class="footnote">Our derivation of Eq. (1), Schulman et al. 2017 §2.1. $R(\tau)$: total reward of trajectory $\tau$; $p_\theta(\tau)$: its probability under the policy</p>

Note:
The question: how do you differentiate an expectation over trajectories when the trajectories are sampled from the policy you're differentiating? Write J as a sum over trajectories of probability times return. Differentiate, and use the log-derivative trick: the gradient of p equals p times the gradient of log p. The result is again an expectation under the policy, so we can estimate it by sampling.
Now expand the log-probability of a trajectory: a sum of log-policy terms plus the environment's transition terms. Only the policy terms depend on theta, so the dynamics drop out. We never need a model of the environment. For a language model the dynamics are trivial anyway.

---

<p class="eyebrow"><span class="paper">Schulman et al. 2017</span> · §2.1 · Eqs. 1, 2</p>

## Step 2: which rewards does each action answer for?

<div class="cols">
<div class="text">

<div class="eq">$$\mathbb{E}_{a\sim\pi}\big[\nabla\log\pi(a)\big] = \nabla\textstyle\sum_a\pi(a) = 0$$</div>

- earlier rewards can't depend on $a_t$: times mean 0
- later rewards, averaged given $s_t, a_t$ ▸ $Q(s_t, a_t)$
- subtract $V(s_t)$: changes nothing
- left: the advantage

</div>
<div class="text">

<div class="eq">$$\hat g = \hat{\mathbb{E}}_t\big[\nabla_\theta\log\pi_\theta(a_t \mid s_t)\hat A_t\big]$$</div>
<div class="eq">$$L^{PG}(\theta) = \hat{\mathbb{E}}_t\big[\log\pi_\theta(a_t \mid s_t)\hat A_t\big]$$</div>

- exact so far; bias enters with $\hat A_t$
- for now: $\hat A_t$ = return − $V(s_t)$

</div>
</div>

<p class="footnote">Schulman et al. 2017 · Eqs. (1), (2); the batch average is "the empirical average over a finite batch of samples". Steps from the score identity: ours. GAE, the $\hat A_t$ PPO uses, comes with the algorithm (§5)</p>

Note:
One identity does all the work: the score, the gradient of log pi, has mean zero, because the probabilities sum to one. So the score times anything that doesn't depend on the action averages to zero.
Use it three times. A reward earned before step t is fixed once we condition on the history up to s t, so its product with the score at t averages to zero: an action can't have caused a reward that came before it, so each action only answers for the rewards after it. Averaging those later rewards given the state and action is the definition of Q (the law of total expectation: average over what happens next). And subtracting V of s t, which doesn't depend on the action, changes nothing. What remains is the score weighted by the advantage: the paper's Eq. 1. Eq. 2 is the loss whose gradient that is.
Those steps are exact. Bias enters only when we plug in an estimated advantage. For now, think of it as the return from t minus V of s t. In words: maximum likelihood on your own samples, weighted by how much better than expected they were.

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

<p class="footnote">Ours: softmax over two actions with logit $z$ at 0, true gradient $0.25(R_{\rm left} - R_{\rm right})$. Baseline 10.5 = $V$ = 0.5 × 11 + 0.5 × 10. A baseline zeroes the variance here only because both scores have size 0.5; in general $V(s)$ is the natural, near-best choice</p>

Note:
The smallest possible example. Two actions, left and right, each with probability 0.5. The score for the logit is plus 0.5 for left and minus 0.5 for right, and the true gradient is 0.25 times the reward difference.
Rewards 1 and 0: a single sample gives 0.5 or 0. The mean is 0.25, correct, standard deviation 0.25. Now add 10 to both rewards. Which action is better hasn't changed, the true gradient is still 0.25, but one sample now gives 5.5 or minus 5. Same mean, standard deviation 5.25, 21 times larger. A single right sample pushes the wrong way. The estimator is unbiased, but its variance depends on the size of the rewards, not only their differences.
The fix is a baseline. Subtract 10.5 and both samples give exactly 0.25: zero variance. That's allowed because of the score identity. In general it won't remove all the variance; it does here because both scores have the same size. The value V of s is the natural baseline, which is why PPO learns one. And a check: if every advantage is 1, the loss is imitation of your own samples, and its expected gradient is zero. Only differences in advantage carry signal. The next reading gets a baseline another way.

---

<p class="eyebrow"><span class="paper">Schulman et al. 2017</span> · §2.1 · the motivating failure</p>

## Why not take ten steps on one batch?

<div class="cols">
<div class="text">

<blockquote>"doing so is not well-justified, and empirically it often leads to destructively large policy updates"</blockquote>

<div style="height:18px"></div>

- after step 1: data from the old policy
- nothing in $L^{PG}$ says stop
- a lucky action ▸ probability 1

</div>
<div class="text">

<p class="q"><b>Q.</b> The evidence?</p>
<p class="a"><b>A.</b> Not shown: "results are not shown but were similar or worse than" the no-clip row of Table 1 (§6.1)</p>
<p class="q"><b>Q.</b> Nearest number?</p>
<p class="a"><b>A.</b> Table 1, no clip or penalty: −0.39, below random</p>

</div>
</div>

<p class="footnote">Schulman et al. 2017 · §2.1. That Table 1 row is the ratio objective $r_t\hat A_t$ of §3 run for several epochs, not $L^{PG}$; it fails on HalfCheetah, "worse than the initial random policy" (§6.1)</p>

Note:
Collecting data is the expensive part, so why not run ten epochs of Adam on this loss instead of one step? This sentence is what the whole paper exists to fix: doing so is not well-justified and often leads to destructively large policy updates.
Why? The loss's gradient is right only at the policy that collected the data. After the first step we're evaluating a new policy on the old policy's samples. Worse, nothing in the loss says stop: a positive-advantage action's log-probability can keep rising every epoch until the policy always picks it, all on a few noisy estimates.
What's the evidence? Less than it seems. The paper says see Section 6.1 and that the results aren't shown but were similar or worse than the "no clipping or penalty" setting. So the pointer lands on Table 1's no-clip row, which uses the ratio objective we're about to meet: minus 0.39 on average, below random, because HalfCheetah collapses.

---

<p class="eyebrow"><span class="paper">Schulman et al. 2017</span> · §3 · Eq. 6 (ratio first used in Eq. 3, §2.2)</p>

## How do you score a new policy on old samples?

<div class="cols">
<div class="text">

<div class="eq">$$r_t(\theta) = \frac{\pi_\theta(a_t \mid s_t)}{\pi_{\theta_{\rm old}}(a_t \mid s_t)}, \qquad r_t(\theta_{\rm old}) = 1$$</div>
<div class="eq">$$L^{CPI}(\theta) = \hat{\mathbb{E}}_t\big[r_t(\theta)\hat A_t\big]$$</div>

- importance sampling: reweight old samples by the ratio
- at $\theta_{\rm old}$: same gradient as $L^{PG}$
- corrects actions, not states

</div>
<div class="text">

<div class="eq">$$\mathbb{E}_{a\sim\pi}[f(a)] = \mathbb{E}_{a\sim\pi_{\rm old}}\Big[\tfrac{\pi(a)}{\pi_{\rm old}(a)}f(a)\Big]$$</div>

<p class="q"><b>Q.</b> $\pi_{\rm old}(a) = 0.2$, advantage positive: how far can the ratio go?</p>
<p class="a"><b>A.</b> To $1/0.2 = 5$; the objective rises all the way to certainty</p>

</div>
</div>

<p class="footnote">Schulman et al. 2017 · §3, Eq. (6). CPI: conservative policy iteration (Kakade &amp; Langford 2002). "Without a constraint, maximization of $L^{CPI}$ would lead to an excessively large policy update" (§3). At $\theta_{\rm old}$, $\nabla r_t = \nabla\log\pi_\theta$ (ours). The ratio example: ours</p>

Note:
Our samples came from the old policy. To evaluate a different policy on them, use importance sampling: an average under the new policy equals an average under the old policy with each term multiplied by the probability ratio, new over old. That identity is the one on the slide. It starts at 1. The resulting surrogate objective, L CPI, is named for Kakade and Langford's conservative policy iteration.
Check it against the policy gradient: at the old parameters the gradient of the ratio equals the gradient of log pi, so the two losses have exactly the same gradient at the start. They differ only once we move. And notice what the ratio doesn't fix: it corrects which action the new policy would pick, but the states are still the ones the old policy visited. That's why the surrogate is only trusted nearby.
Why is it dangerous alone? It's linear in the ratio. If the old policy gave a good action probability 0.2, the ratio can reach 5, and the optimiser is rewarded all the way to certainty.

---

<p class="eyebrow"><span class="paper">Schulman et al. 2017</span> · §2.2 · Eqs. 3, 4</p>

## How big is a KL of 0.02?

<div class="cols">
<div class="text">

<div class="eq">$$\mathrm{KL}[p, q] = \textstyle\sum_a p(a)\ln\frac{p(a)}{q(a)}$$</div>

- TRPO: maximise $L^{CPI}$ with mean KL $\le\delta$, a hand-set limit (value not given)
- zero if equal, grows as they differ; old first; in nats ($\ln$)
- 50/50 ▸ 60/40: 0.0204 (reverse 0.0201)
- ratios 1.2 and 0.8: here, the clip edges

</div>
<div class="text">

<div class="eq">$$0.5\ln\tfrac{0.5}{0.6} + 0.5\ln\tfrac{0.5}{0.4} = 0.0204$$</div>

<p class="q"><b>Q.</b> Is a 0.02 KL always ratios within 0.8 to 1.2?</p>
<p class="a"><b>A.</b> No: many actions or a Gaussian can hide much larger ones</p>

</div>
</div>

<p class="footnote">Schulman et al. 2017 · Eqs. (3), (4). KL: Kullback-Leibler divergence. A nat: information with natural logs, 1.44 bits. TRPO solves it by "the conjugate gradient algorithm" with linear and quadratic approximations. Worked numbers: ours; Fig. 2's update has KL "about 0.02"</p>

Note:
TRPO limits how far the action distribution moves, measured by the Kullback-Leibler divergence: zero when the distributions agree, growing as they separate. It isn't symmetric; the paper always puts the old policy first. With natural logs it's in nats. TRPO maximises the surrogate subject to the mean KL staying below delta, a limit the paper never gives a value for, solved with conjugate gradients after linear and quadratic approximations. That means Hessian-vector products on every update.
What does 0.02 feel like? Move a 50/50 choice to 60/40: KL 0.0204, the other order 0.0201. That's the size of the PPO update in Figure 2. In this two-action example the ratios are 1.2 and 0.8, exactly the clip edges at epsilon 0.2. Don't generalise from that: with many actions, or a Gaussian over torques, the same mean KL can hide individual ratios far outside the band. Engstrom et al. measured exactly that.

---

<p class="eyebrow"><span class="paper">Schulman et al. 2017</span> · §2.2 · Eq. 5</p>

## Why would a KL penalty guarantee improvement?

<div class="cols">
<div class="text">

<div class="eq">$$\max_\theta\ \hat{\mathbb{E}}_t\big[r_t\hat A_t - \beta\,\mathrm{KL}[\pi_{\theta_{\rm old}}, \pi_\theta]\big]$$</div>

1. $M(\pi)$: old performance + surrogate − $\beta$ × max KL; with the right $\beta$, $M(\pi) \le \eta(\pi)$
2. tight at the start: $M(\pi_{\rm old}) = \eta(\pi_{\rm old})$
3. so $\eta(\pi_{\rm new}) \ge M(\pi_{\rm new}) \ge M(\pi_{\rm old}) = \eta(\pi_{\rm old})$

</div>
<div class="text">

<p class="q"><b>Q.</b> Which step matters most?</p>
<p class="a"><b>A.</b> 2: a bound that doesn't touch the curve guarantees nothing</p>
<p class="q"><b>Q.</b> Does practical TRPO keep the theorem?</p>
<p class="a"><b>A.</b> No: mean KL, a hand-set $\delta$, approximations</p>

</div>
</div>

<p class="footnote">Schulman et al. 2017 · §2.2: the penalty form uses "the max KL over states instead of the mean". $\eta$: true performance; $M$: the penalised lower bound. The three steps are ours; the constant is in the TRPO paper (not read here) and needs $\gamma \lt 1$</p>

Note:
"The theory justifying TRPO actually suggests using a penalty instead of a constraint." Why would a penalised surrogate guarantee improvement? Three lines. One: with the maximum KL over states and the right beta, call M of pi the old policy's performance plus the surrogate minus the penalty; it is a lower bound on the true performance eta of any policy. Two: the bound is tight at the old policy, because there both the KL and the change are zero. Three: the new policy maximises M, so M at the new policy is at least M at the old one, which equals the old performance; and eta at the new policy is at least M there. Chain them and performance can't go down. 
Step two is the key one: raising a lower bound that doesn't touch the true curve at your current point guarantees nothing. And TRPO itself already leaves the theorem: it uses the mean KL, a hand-set delta and approximations. (The paper's reason for a hard constraint rather than a penalty is that "it is hard to choose a single value of beta".) A fixed beta with SGD, stochastic gradient descent run as ascent, is "not sufficient". The paper's two fixes are next: the clip and an adaptive beta.

---

<p class="eyebrow"><span class="paper">Schulman et al. 2017</span> · §3 Clipped surrogate objective · Eq. 7 · Fig. 1</p>

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

</div>
</div>
<div class="fig"><img src="img/week-04-ppo-fig1.png" alt="Schulman et al. Figure 1: one term of L CLIP against the ratio r. Left, positive advantage: rising from the origin, flat beyond 1 plus epsilon. Right, negative advantage: flat below 1 minus epsilon, then falling. A red dot marks the start at r = 1"></div>
</div>

<p class="footnote">Schulman et al. 2017 · Eq. (7), Fig. 1 ("$L^{CLIP}$ sums many of these terms"; the right panel's tick labels crowd in the paper). "we only ignore the change in probability ratio when it would make the objective improve, and we include it when it makes the objective worse" (§3)</p>

Note:
The paper's idea in one equation. Take the surrogate, the ratio times the advantage. Next to it, the same thing with the ratio clipped to 1 minus epsilon, 1 plus epsilon, epsilon 0.2. Take the minimum of the two.
Read Figure 1, one term of the sum. Left, positive advantage: the term rises with the ratio and goes flat at 1 plus epsilon. Right, negative advantage: flat until 1 minus epsilon, then falling. The red dot is the start, ratio 1. The flat parts sit on the side the advantage pushes toward; on the other side the slope continues without limit. In the paper's words: ignore the change in ratio when it would make the objective improve, include it when it makes it worse.
And at ratio 1 every sample is inside the band, so to first order the clipped objective equals the surrogate: the first gradient step of each iteration is exactly the policy-gradient step. Clipping only bites after the policy has moved.

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

<p class="q"><b>Q.</b> $A = -1$: min and slope at $r = 1.5$? At 0.5?</p>
<p class="a"><b>A.</b> $r = 1.5$: min $-1.5$ (unclipped), slope $-1$, gradient flows. $r = 0.5$: min $-0.8$ (clipped), slope 0</p>

</div>
<div class="fig"><img src="img/week-04-ppo-cases.svg" alt="Illustration: one term of the clipped objective against the ratio for advantage plus 2 and minus 2, epsilon 0.2, with the unclipped line dashed; cases a, 2.4, and c, minus 1.6, sit on flat parts; cases b, 1.4, and d, minus 2.6, sit on sloped parts"></div>
</div>

<p class="footnote">Ours, from Eq. (7) with $\epsilon$ = 0.2. A token at 0.30 under the old policy and 0.39 now has $r = 1.3$. Gradient is zero only if ($A \gt 0$, $r \gt 1+\epsilon$) or ($A \lt 0$, $r \lt 1-\epsilon$)</p>

Note:
Work the four cases with epsilon 0.2 and advantages plus or minus 2. Think of a token whose probability went from 0.30 to 0.39: ratio 1.3.
Case a: a good action already 30% more likely, past the 20% allowance. The clipped term, 2.4, is smaller, so the min picks it, and it's flat: no gradient, stop pushing. Case b: a good action that became less likely, because other samples' updates dragged it down. Now the unclipped term, 1.4, is smaller, and the full gradient pushes it back up. Case c: a bad action already cut by 30%: flat, stop. Case d: a bad action that became more likely: unclipped, full gradient to push it down.
The rule in one line: a sample's gradient is switched off only when it has already moved the way its advantage wanted, by more than epsilon. Moves that made things worse are never clipped. Check it with the question on the slide: at ratio 1.5 with advantage minus 1 the unclipped term, minus 1.5, is the smaller one, so the slope is minus 1; at 0.5 the clipped term, minus 0.8, is the smaller one, so the slope is zero.

---

<p class="eyebrow"><span class="paper">Schulman et al. 2017</span> · §3 · why the min</p>

## Why the min, and not just the clip?

<div class="cols">
<div class="text">

- clip alone: flat outside the band, both sides
- case b: good action fell to 0.7: slope 0
- case d: bad action rose to 1.3: slope 0
- it would refuse to undo a harmful move
- the min restores those two cases

</div>
<div class="text">

<p class="q"><b>Q.</b> In both cases, what is capped?</p>
<p class="a"><b>A.</b> The improvement. The worsening never is</p>
<p class="q"><b>Q.</b> Clip vs a KL penalty?</p>
<p class="a"><b>A.</b> Clip: per sample, one side only. KL: every action, both ways</p>

</div>
</div>

<p class="footnote">Ours, from Eq. (7). Compact form: $\hat A\min(r, 1+\epsilon)$ if $\hat A \gt 0$, $\hat A\max(r, 1-\epsilon)$ if $\hat A \lt 0$. Fig. 2 (next) shows the clip-only and min curves side by side</p>

Note:
The natural whiteboard question. Drop the min and use only the clipped term. What goes wrong? Cases b and d. With clip alone, a good action whose ratio has fallen to 0.7 sits on the flat part below 0.8 and gets zero gradient, and so does a bad action whose ratio has risen to 1.3. The objective would refuse to undo a harmful move. The min puts the unclipped, worsening term back exactly in those two cases.
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
<p class="a"><b>A.</b> No (ours): the update comes from minibatch Adam on $L^{CLIP}$, so the peak is near 1 (about 1.05 on the plot). The shape is the news</p>
<p class="q"><b>Q.</b> Is KL 0.02 enforced?</p>
<p class="a"><b>A.</b> No (ours): it's where the optimiser stopped</p>

</div>
</div>
<div class="fig"><img src="img/week-04-ppo-fig2.png" alt="Schulman et al. Figure 2: four curves against the linear interpolation factor from minus 0.5 to about 1.9; the KL rises quadratically; L CPI keeps rising; the clip-only objective levels off near 0.04; L CLIP peaks near factor 1 at about 0.034 and falls to about 0.01"></div>
</div>

<p class="footnote">Schulman et al. 2017 · Fig. 2: "The updated policy has a KL divergence of about 0.02 from the initial policy, and this is the point at which $L^{CLIP}$ is maximal." Hopper-v1: a one-legged MuJoCo robot rewarded for hopping forward. One update, one task</p>

Note:
Figure 2 takes the first PPO update on Hopper and evaluates four quantities along the straight line from the old parameters, at 0, to the updated ones, at 1, extended either side. Blue is the mean KL; orange the plain surrogate; green the clip without the min; red the full clipped objective.
Read it from left to right. Left of zero the objectives coincide. Past 1, orange keeps rising: it would happily keep going, as we said. Green levels off at about 0.04 and stays flat, because every sample that has moved far enough stops counting. Red bends over and falls. The gap between green and red is the min at work: further out, more samples land in cases b and d, and their worsening terms pull red down. At 1, the KL is about 0.02.
Is the peak at 1 surprising? Not really: the point at 1 was found by ten epochs of minibatch Adam maximising this very objective, so the peak sits near 1, just past it on the plot, not exactly at it. What's informative is the shape: the clipped objective has an interior maximum, the surrogate has none. And, in our reading, the KL of 0.02 is where the optimiser stopped, not something the objective enforces. One update on one task.

---

<p class="eyebrow"><span class="paper">Schulman et al. 2017</span> · §3 · the clip on a language model's tokens</p>

## What does the clip do to a model's tokens?

<div class="cols wide-fig">
<div class="text">

- ratio per token, not per response
- 1.1 per token: 3 tokens 1.331; 100 tokens 13,781
- $A \gt 0$, token 0.95: ratio at most 1.053
- $A \gt 0$, token 0.01: clipped at 0.012
- $A \lt 0$: lower clip binds at $0.8p$, any $p$

<p class="q"><b>Q.</b> For $A \gt 0$, where does the upper clip never bind?</p>
<p class="a"><b>A.</b> Old probability above $1/1.2 = 0.833$</p>

</div>
<div class="fig"><img src="img/week-04-ppo-tokenclip.svg" alt="Illustration: on log axes, the highest probability a token can reach before the upper clip binds, min of 1.2 p and 1, against its old probability; 0.01 can reach 0.012, 0.30 can reach 0.36, and 0.95 can never be clipped upward"></div>
</div>

<p class="footnote">Ours, from Eq. (7) with $\epsilon$ = 0.2. The paper's ratio is per timestep; applying it per token is how language-model practice uses it (ours). InstructGPT's KL penalty is per token too</p>

Note:
Two consequences that surprise people who know language-model distributions. First, the ratio and clip are per token. Why not the ratio of whole responses, which is what importance sampling over sequences would literally ask for? Because ratios multiply: 1.1 on every token gives 1.331 for a 3-token response and 13,781 for a 100-token one. Sequence ratios explode.
Second, in probability terms the upper clip, which matters for positive advantages, is very uneven. A token the old policy gave 0.95 can reach a ratio of at most 1 over 0.95, 1.053, so the upper clip at 1.2 never binds: confident tokens can be pushed all the way to 1. A token at 0.01 is clipped as soon as it reaches 0.012. Anything above 0.833 can't be clipped upward at all. For negative advantages the lower clip binds at 0.8 times the old probability for every token, so it is even in ratio terms. Whether that's the right shape for language models, rather than an accident of a rule built for robots, is an open question.

---

<p class="eyebrow"><span class="paper">Schulman et al. 2017</span> · §4 Adaptive KL penalty coefficient · Eq. 8</p>

## Or adapt a KL penalty instead?

<div class="cols">
<div class="text">

<div class="eq">$$L^{KLPEN} = \hat{\mathbb{E}}_t\big[r_t\hat A_t - \beta\,\mathrm{KL}[\pi_{\theta_{\rm old}}, \pi_\theta]\big]$$</div>

- measure $d$, the mean KL, after the update
- $d \lt d_{\rm targ}/1.5$: halve $\beta$
- $d \gt 1.5 d_{\rm targ}$: double $\beta$

</div>
<div class="text">

<p class="q"><b>Q.</b> $d_{\rm targ}$ = 0.01, $\beta$ = 1; $d$ = 0.004? 0.02?</p>
<p class="a"><b>A.</b> Below 0.00667: $\beta$ = 0.5. Above 0.015: $\beta$ = 2</p>
<p class="q"><b>Q.</b> $d$ = 0.012?</p>
<p class="a"><b>A.</b> No change</p>

</div>
</div>

<p class="footnote">Schulman et al. 2017 · §4. "performed worse than the clipped surrogate objective, however, we've included it here because it's an important baseline". 1.5 and 2 "chosen heuristically". Usable "in addition to" clipping; never tested. Worked numbers: ours</p>

Note:
Why include a method the authors say is worse? Because it's the natural alternative and a fair comparison needs it. Keep the penalty form, but adjust beta after each update to hit a target KL. Run several epochs on the penalised objective, measure the mean KL d, then halve beta if d came in below the target over 1.5, double it if above 1.5 times the target.
With a target of 0.01 the thresholds are 0.00667 and 0.015. An update that reached only 0.004 halves beta; one that reached 0.02 doubles it; 0.012 leaves it alone. It's a thermostat: it reacts after the fact, so a single update can still overshoot. The authors say such misses are rare and beta quickly adjusts, and the constants were picked by hand.
Remember: this KL is to the policy one iteration ago. The KL penalty in language-model fine-tuning is to a frozen reference model, a different thing we'll see at the end.

---

<p class="eyebrow"><span class="paper">Schulman et al. 2017</span> · §5 Algorithm · Eq. 9</p>

## Why does the loss have three parts?

<div class="cols">
<div class="text">

<div class="eq">$$L^{CLIP+VF+S} = \hat{\mathbb{E}}_t\big[L^{CLIP}_t - c_1 L^{VF}_t + c_2 S[\pi_\theta](s_t)\big]$$</div>

- $L^{VF} = (V_\theta(s_t) - V_t^{\rm targ})^2$: train the critic
- $S = -\sum_a\pi\ln\pi$: entropy, keeps exploring
- $V^{\rm targ}$: the observed return (regression)
- MuJoCo: separate networks, $c_1$ irrelevant; no entropy bonus ($c_2$ = 0)
- Atari: $c_1$ = 1, $c_2$ = 0.01

</div>
<div class="text">

<p class="q"><b>Q.</b> Case a ($A = +2$): value 0.7, target $A + V_{\rm old} = 2.7$, policy (0.39, 0.61), $c_1 = 1$, $c_2 = 0.01$?</p>
<p class="a"><b>A.</b> $2.4 - 4 + 0.01(0.669) = -1.5933$ (ours): the critic's error dominates</p>
<p class="q"><b>Q.</b> Why minus $c_1$?</p>
<p class="a"><b>A.</b> The whole thing is maximised</p>

</div>
</div>

<p class="footnote">Schulman et al. 2017 · Eq. (9), §5, §6.1, Table 5. $V^{\rm targ}$ undefined in the paper (common code: $\hat A_t + V_{\rm old}$, which is the return). Atari sharing: our inference from $c_1$. A 50/50 choice has entropy $\ln 2$ = 0.693 nats. Worked loss: ours</p>

Note:
Why more than the clipped term? Because we also have to train the value function the advantages come from, and if the policy and value share a network, both losses must live in one objective. So Eq. 9 subtracts c1 times the value network's squared error, subtracted because the whole thing is maximised, and adds c2 times the policy's entropy, a bonus "to ensure sufficient exploration": it rewards keeping the action distribution spread out.
A worked number for one sample: case a's clip term, 2.4, with advantage plus 2. The advantage is the return minus V, so with V at 0.7 the return-like target is about 2.7 (common code uses the advantage plus the old V). The value network predicted 0.7, squared error 4, c1 of 1; the state has two actions at 0.39 and 0.61, entropy 0.669, c2 of 0.01. Total 2.4 minus 4 plus 0.00669, which is minus 1.5933. A badly wrong critic dominates the loss, which is why the value term needs its own coefficient.
When do the coefficients matter? On MuJoCo the networks are separate, so c1 is irrelevant, and the paper says it uses no entropy bonus, c2 of zero. Atari lists c1 of 1 and c2 of 0.01; the paper never says the network is shared, but that's the implication. For a language model with a separate value model, c1 is irrelevant again. Remember: the value term and the V inside the advantage are the two places a critic enters PPO. The next reading removes both.

---

<p class="eyebrow"><span class="paper">Schulman et al. 2017</span> · §5 · Eqs. 10 to 12 · GAE</p>

## GAE step 1: how surprised was the critic?

<div class="cols">
<div class="text">

<div class="eq">$$\delta_t = R_t + \gamma V(s_{t+1}) - V(s_t)$$</div>

- got ($R_t$ + where I landed) − expected
- right $V$: unbiased; else biased, low variance
- $V$ is poor early on: lean on it less
- sum $k$ of them: it telescopes

</div>
<div class="text">

<div class="eq">$$\hat A^{(k)}_t = \textstyle\sum_{l=0}^{k-1}\gamma^l\delta_{t+l}$$</div>
<div class="eq">$$= -V(s_t) + R_t + \dots + \gamma^{k-1}R_{t+k-1} + \gamma^k V(s_{t+k})$$</div>

- more real rewards: less bias, more variance

</div>
</div>

<p class="footnote">Schulman et al. 2017 · Eq. (12); GAE: Schulman et al. 2015, arXiv:1506.02438. TD (temporal-difference) residual. $k \to \infty$: "the empirical returns minus the value function baseline" (GAE paper)</p>

Note:
We've treated the advantage as return minus V since Section 2. Section 5 says how PPO actually computes it, using generalised advantage estimation from the GAE paper.
Start with the one-step surprise, the temporal-difference residual: what I got, the reward plus the value of where I landed, minus what I expected, V of s t. If V were exactly right, delta would be an unbiased estimate of the advantage. If V is wrong it's biased, but it has low variance, because it involves one random reward.
Add k of them and the sum telescopes: each plus gamma V of the next state cancels the next minus V. You get k real rewards, then the critic's estimate for the rest, minus the baseline. More real rewards means less reliance on V, so less bias, but more random terms, so more variance. As k goes to infinity you get the plain return minus the baseline.

---

<p class="eyebrow"><span class="paper">Schulman et al. 2017</span> · §5 · Eqs. 10 to 12 · GAE</p>

## GAE step 2: why not average every horizon?

<div class="cols wide-fig">
<div class="text">

<div class="eq">$$(1-\lambda)\big(\hat A^{(1)} + \lambda\hat A^{(2)} + \dots\big) = \textstyle\sum_l(\gamma\lambda)^l\delta_{t+l}$$</div>

- $\lambda = 0$: $\delta_t$; $\lambda = 1$: return − $V$
- segment: $\hat A_t = \delta_t + \gamma\lambda\hat A_{t+1}$
- $\gamma$ 0.99, $\lambda$ 0.95: reach about 16.8 steps (ours)

<p class="q"><b>Q.</b> $\hat A_0$ (token 1) with $\lambda = 1$, $\gamma = 1$?</p>
<p class="a"><b>A.</b> $0.1 + 0.2 + 0.2 = 0.5 = 1 - V(s_0)$</p>

</div>
<div class="fig"><img src="img/week-04-ppo-gaesteps.svg" alt="Illustration: advantages for a three-token response with rewards 0, 0, 1 and values 0.5, 0.6, 0.8; with lambda 0 they are 0.1, 0.2, 0.2; with lambda 0.95, 0.4705, 0.39, 0.2; with lambda 1, 0.5, 0.4, 0.2"></div>
</div>

<p class="footnote">Schulman et al. 2017 · Eqs. (10), (11) print the last exponent as $T-t+1$; it must be $T-t-1$. Example ours, $\gamma$ = 1 (InstructGPT applies "No discount"); $t$ = 0 is token 1. At a terminal state $V$ = 0; at a time-limit cut, bootstrap (Andrychowicz et al.: little difference at 1000 steps)</p>

Note:
Rather than pick one k, GAE averages all of them, weighting the k-step estimate by one minus lambda times lambda to the k minus one. Collect the coefficient of each delta: delta t appears in every term and gets one minus lambda times a geometric series, which is 1; delta t plus 1 gets lambda; in general gamma to the l delta gets lambda to the l. So GAE is a discounted sum of surprises with the steeper discount gamma lambda. Lambda 0 gives the one-step surprise, low variance, biased; lambda 1 gives the return minus the baseline, unbiased, high variance. The GAE paper finds the best lambda well below the best gamma.
On a segment, standard code computes it backwards: A t equals delta t plus gamma lambda A t plus 1. Worked example: three tokens, reward 1 at the end, values 0.5, 0.6, 0.8. Deltas 0.1, 0.2, 0.2. Backwards, 0.2, then 0.39, then 0.4705. With lambda 1 the first is 0.5, the return minus the baseline. With the paper's settings, by our calculation of 1 over 1 minus gamma lambda, credit reaches back about 17 steps: an effective horizon.
Two practical notes. The paper's printed exponent in Eqs. 10 and 11 is off by two; check it at t equals T minus 1. And on MuJoCo the segment of 2048 steps is longer than the 1000-step episodes, so a terminal state sets V to zero and restarts the recursion, while a time-limit cut should bootstrap; Andrychowicz et al. found that choice made little difference.

---

<p class="eyebrow"><span class="paper">Schulman et al. 2017</span> · §5 · Algorithm 1</p>

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

- $N$ actors × $T$ steps, old policy frozen
- advantages once per iteration (ours: GAE needs time order)
- $K$ passes over this batch, then discard (ours)
- only the first step is on-policy

<p class="q"><b>Q.</b> What changed from a policy gradient?</p>
<p class="a"><b>A.</b> "one simply constructs the loss $L^{CLIP}$ ... instead of $L^{PG}$"</p>

</div>
</div>

<p class="footnote">Schulman et al. 2017 · Algorithm 1, "PPO, Actor-Critic Style"; optimised "with minibatch SGD (or usually for better performance, Adam)". Shuffling into minibatches: standard code, not stated. Bookkeeping below (press ↓)</p>

Note:
Algorithm 1. Each iteration, N parallel actors each run the frozen old policy for T timesteps. Advantages are computed once; our reason is that GAE needs the time order. Then the N T samples are split into minibatches of size M and the clipped loss is optimised for K epochs, usually with Adam. Then the old parameters are set to the new ones and we repeat.
What does epoch mean here? Not a pass over a fixed training set. It's a pass over the batch you just sampled, which is thrown away after K passes. Only the very first minibatch step is exactly on-policy; every later step evaluates a moved policy on old data, which is the whole reason the ratio and the clip exist.
And the selling point: compared with a standard policy-gradient implementation, you just build a different loss.

--

<p class="eyebrow"><span class="paper">Schulman et al. 2017</span> · App. A · Tables 3 to 5</p>

## How many gradient steps per batch?

<table class="rules">
  <tr><td>setting</td><td class="num">$N$</td><td class="num">$T$</td><td class="num">samples</td><td class="num">minibatch</td><td class="num">epochs</td><td class="num">steps per batch</td></tr>
  <tr><td>MuJoCo, Table 3</td><td class="num">not stated</td><td class="num">2048</td><td class="num">2048 if $N$ = 1</td><td class="num">64</td><td class="num">10</td><td class="num">320</td></tr>
  <tr><td>Roboschool running, Table 4</td><td class="num">32</td><td class="num">512</td><td class="num">16,384</td><td class="num">4096</td><td class="num">15</td><td class="num">60</td></tr>
  <tr><td>Roboschool flagrun, Table 4</td><td class="num">128</td><td class="num">512</td><td class="num">65,536</td><td class="num">4096</td><td class="num">15</td><td class="num">240</td></tr>
  <tr><td>Atari, Table 5</td><td class="num">8</td><td class="num">128</td><td class="num">1024</td><td class="num">256</td><td class="num">3</td><td class="num">12</td></tr>
</table>

<p class="q"><b>Q.</b> Iterations in a 10M-timestep Atari run? <b>A.</b> $10^7/1024 \approx 9766$</p>

<p class="footnote">Schulman et al. 2017 · App. A. Steps per batch: ours (samples / minibatch × epochs). Atari: stepsize $2.5\times10^{-4}\alpha$ and clip $0.1\alpha$, "$\alpha$ is linearly annealed from 1 to 0": at halfway, $1.25\times10^{-4}$ and 0.05</p>

Note:
Optional. The bookkeeping from the hyperparameter tables. MuJoCo: horizon 2048, minibatch 64, 10 epochs, so 320 gradient steps per batch if there's one actor; the paper doesn't say how many. Roboschool: 32 or 128 actors, 512 steps, minibatch 4096, 15 epochs: 60 or 240 steps. Atari: 8 actors, 128 steps, so 1024 samples, minibatch 256, 3 epochs: 12 steps per batch, about 9766 iterations over 10 million timesteps.
One detail for later: on Atari both the learning rate and the clip shrink linearly to zero. Halfway through, epsilon is 0.05. So on Atari epsilon is neither 0.2 nor fixed.

---

<p class="eyebrow"><span class="paper">Schulman et al. 2017</span> · §5 · in a language model</p>

## What are these pieces in a language model?

<div class="cols">
<div class="text">

- $\pi_{\theta_{\rm old}}$: stored log-probs, not a copy
- $r_t = \exp(\log\pi_\theta - \log\pi_{\rm old})$
- actors: prompts answered in parallel
- $T$: the response length
- critic: a prediction at every token

</div>
<div class="text">

<p class="q"><b>Q.</b> What does "$\theta_{\rm old} \leftarrow \theta$" cost?</p>
<p class="a"><b>A.</b> Nothing: sample the next batch with the current weights</p>
<p class="q"><b>Q.</b> InstructGPT's epochs?</p>
<p class="a"><b>A.</b> One: 512 responses, 8 minibatches of 64</p>

</div>
</div>

<p class="footnote">Ours, standard practice; InstructGPT (Ouyang et al. 2022) appendix: "batch size for each iteration is 512, with a minibatch size of 64 ... only a single inner epoch"</p>

Note:
Make it concrete for a language model. The old policy isn't a second copy kept in memory. When you sample, you record the log-probability of every generated token. Later you compute the current model's log-probability of the same token and exponentiate the difference: that's the ratio. Setting old to new just means sampling the next batch with the current weights.
Actors are prompts answered in parallel; T is the response length; the critic predicts the eventual reward at every token position. And the epochs are passes over those responses: InstructGPT used one, eight minibatches of 64 from a batch of 512.

---

<p class="eyebrow"><span class="paper">Schulman et al. 2017</span> · §6.1 Comparison of surrogate objectives</p>

## Which way of limiting the step works best?

<div class="cols">
<div class="text">

- 7 MuJoCo tasks, 1M timesteps, 3 seeds
- policy: 2 layers of 64 tanh units (a squashing function), Gaussian (bell-curve) actions; separate critic
- no limit; clip $\epsilon$ 0.1, 0.2, 0.3
- KL: fixed $\beta$ 0.3 to 10; adaptive $d_{\rm targ}$ 0.003 to 0.03
- also clipping in log space: "no better"

</div>
<div class="text">

**Scoring**

- last 100 episodes, per task
- random 0, "the best result" 1
- mean over 21 runs

**Prediction (ours):** no limit: bad. Clip and KL: both rescue it

</div>
</div>

<p class="footnote">Schulman et al. 2017 · §6.1, Table 3 settings. MuJoCo tasks ("-v1"): HalfCheetah, Hopper, Walker2d, Swimmer: legged or swimming robots rewarded for forward speed; Reacher: an arm touching a target; InvertedPendulum, InvertedDoublePendulum: balance one or two poles on a cart. Normalised score $(x - x_{\rm random})/(x_{\rm best} - x_{\rm random})$: ours, from the words</p>

Note:
The only experiment that isolates the paper's idea: same code, same tasks, only the policy loss changes. Seven MuJoCo tasks, a million timesteps each, three seeds, chosen because it's cheap and they were searching hyperparameters for each variant. Policy: two hidden layers of 64 tanh units giving the mean of a Gaussian, a separate value network, no entropy bonus.
Three families: no clipping or penalty; clipping at 0.1, 0.2, 0.3; and a KL penalty, fixed beta from 0.3 to 10 or adaptive with targets 0.003 to 0.03. They also tried clipping in log space: no better, no number given.
Scoring: each run's average reward over its last 100 episodes, rescaled per task so random is 0 and the best result is 1, averaged over 21 runs. The paper states no prediction; ours would be that no limit fails and both clip and KL rescue it.

---

<p class="eyebrow"><span class="paper">Schulman et al. 2017</span> · §6.1 · Table 1</p>

## Clip, KL or nothing: what scored best?

<div class="cols wide-fig">
<div class="text">

- no limit: −0.39, below random
- clip 0.2: 0.82, the best
- best adaptive KL: 0.74
- gap 0.08; all ten settings span 0.20
- control vs none: at least 1.01

<p class="q"><b>Q.</b> Why negative over 7 tasks?</p>
<p class="a"><b>A.</b> One task: HalfCheetah, far below random</p>

</div>
<div class="fig"><img src="img/week-04-ppo-scores.svg" alt="Table 1 re-plotted as horizontal bars: no clipping or penalty minus 0.39; clip at epsilon 0.1, 0.2, 0.3 scores 0.76, 0.82, 0.70; adaptive KL with targets 0.003, 0.01, 0.03 scores 0.68, 0.74, 0.71; fixed KL with beta 0.3, 1, 3, 10 scores 0.62, 0.71, 0.72, 0.69"></div>
</div>

<p class="footnote">Schulman et al. 2017 · Table 1 ("$\beta$ was initialized at 1"). Differences ours. No error bars, no per-task scores, 3 seeds; settings chosen and scored on the same runs (see "Were the settings tuned on the test?")</p>

Note:
Table 1, re-plotted. A score of 0.82 means that, averaged over tasks and seeds, epsilon 0.2 gets 82% of the way from random to the best result seen. The no-control row is minus 0.39 because of one task: on HalfCheetah it ends far below the random policy.
What it shows: controlling the step is essential. The worst controlled setting beats no control by more than one full unit, and that row is the paper's cleanest negative control. Clipping at 0.2 has the best single number, and clipping isn't very sensitive to epsilon in this range.
What it doesn't show: the margin over KL. Best clip minus best adaptive KL is 0.08, and all ten controlled settings span 0.20. No error bars, no per-task scores, three seeds, and the settings were chosen on the very runs being reported. We can't tell whether 0.08 is more than seed noise.

---

<p class="eyebrow"><span class="paper">Schulman et al. 2017</span> · §6.2 · Fig. 3</p>

## Is PPO better than other algorithms?

<div class="rows">
<div class="points">
<div class="text">

- ahead: HalfCheetah, Walker2d, Reacher
- level: Hopper, InvertedPendulum
- InvertedDoublePendulum: first; TRPO stuck near 0

</div>
<div class="text">

<p class="q"><b>Q.</b> "almost all": the exception?</p>
<p class="a"><b>A.</b> Swimmer: TRPO about 120, PPO about 108</p>
<p class="q"><b>Q.</b> What can't we test?</p>
<p class="a"><b>A.</b> No table, seeds or band meaning given</p>

</div>
</div>
<div class="fig"><img src="img/week-04-ppo-fig3.png" alt="Schulman et al. Figure 3: return against timesteps up to one million on seven MuJoCo tasks for A2C, A2C with trust region, CEM, PPO with clipping, vanilla policy gradient with adaptive stepsize, and TRPO; PPO is far ahead on HalfCheetah and Walker2d, highest on Reacher, roughly level on Hopper and InvertedPendulum, and below TRPO on Swimmer"></div>
</div>

<p class="footnote">Schulman et al. 2017 · Fig. 3, §6.2: "PPO outperforms the previous methods on almost all the continuous control environments". Values read off the plot: ours, approximate. PPO: purple. Tasks as defined two slides back. Vanilla PG: policy gradient with a KL-adjusted Adam stepsize</p>

Note:
Table 1 compared PPO's variants with each other. It says nothing about whether PPO beats what people actually used, TRPO above all. So Figure 3: the same seven tasks against tuned TRPO, the cross-entropy method, vanilla policy gradient with an adaptive stepsize, A2C, and A2C with a trust region. Our prediction: if PPO matches TRPO's reliability, it should be at least level with TRPO everywhere.
Read the panels; PPO is purple. HalfCheetah: about 1800 against about 1000 for the next best. Walker2d: about 3000 against 1000. Reacher: highest. InvertedDoublePendulum: PPO learns first, the A2C variants catch up, and TRPO, CEM and vanilla stay near zero the whole run. Hopper and InvertedPendulum: roughly level. Swimmer: TRPO ends above PPO, about 120 against 108. That's the exception behind "almost all".
What it doesn't show: there's no table behind the curves, no seed count, and we're not told what the bands are. PPO's settings were chosen on these same tasks. And we don't know which code details each implementation had.

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

<p class="footnote">Schulman et al. 2017 · Fig. 4, §6.3, Table 4 (Adam stepsize "adjusted based on the target value of the KL divergence"; log std annealed −0.7 to −1.6; no clipping parameter listed). Roboschool: open-source simulated robots. Two curves per panel: apparently two runs. Stills below (press ↓)</p>

Note:
A showcase, not a comparison. Three tasks with a simulated 3D humanoid: run forward; Flagrun, where the target moves every 200 timesteps or when reached; and FlagrunHarder, where the robot is pelted by cubes and has to get up. 32 or 128 parallel actors, up to 100 million timesteps.
The curves rise steadily. Each panel shows two curves, apparently two runs; on Flagrun they separate visibly between about 50 and 70 million steps, so the run-to-run spread is unknown.
Can we conclude that clipping works on humanoids? No. There's nothing to compare against. The learning rate is steered by a KL target whose value isn't given, which mixes in the Section 4 idea. Exploration is set by a hand-made schedule. And Table 4 lists no clipping parameter, so we don't know which epsilon was used, or whether clipping was used at all.

--

<p class="eyebrow"><span class="paper">Schulman et al. 2017</span> · §6.3 · Fig. 5</p>

## What does the learned policy do?

<div class="rows">
<div class="points">
<div class="text">

- frames 1 to 6: runs toward the target

</div>
<div class="text">

- then the target moves: it turns and runs

</div>
</div>
<div class="fig"><img src="img/week-04-ppo-fig5.png" alt="Schulman et al. Figure 5: twelve still frames of a simulated humanoid on a striped green field, first running toward a target, then turning toward a new target"></div>
</div>

<p class="footnote">Schulman et al. 2017 · Fig. 5: "Still frames of the policy learned from RoboschoolHumanoidFlagrun". Low resolution in the paper. Optional</p>

Note:
Optional. Twelve still frames of the Flagrun policy. In the first six the robot runs toward a target; then the target moves and it turns and runs toward the new one. A nice picture of what high-dimensional control looks like; it carries no numbers. The frames are low resolution in the paper. The paper also notes concurrent work by Heess et al. that used the adaptive-KL variant to learn locomotion.

---

<p class="eyebrow"><span class="paper">Schulman et al. 2017</span> · §6.4 · Table 2</p>

## Atari: who wins, and on what?

<div class="cols">
<div class="text">

<table class="rules">
  <tr><td>games won</td><td class="num">A2C</td><td class="num">ACER</td><td class="num">PPO</td><td class="num">tie</td></tr>
  <tr><td>(1) over all training</td><td class="num">1</td><td class="num">18</td><td class="num">30</td><td class="num">0</td></tr>
  <tr><td>(2) last 100 episodes</td><td class="num">1</td><td class="num">28</td><td class="num">19</td><td class="num">1</td></tr>
</table>

<div style="height:20px"></div>

- 49 games, 40M frames = 10M timesteps
- metric 1: learning speed; 2: final score
- TRPO absent, though sharing was its weak spot

</div>
<div class="text">

<p class="q"><b>Q.</b> Replay is for sample efficiency. So who should learn faster?</p>
<p class="a"><b>A.</b> ACER, naively. It doesn't: PPO wins metric 1</p>
<p class="q"><b>Q.</b> Do they admit ACER ends higher?</p>
<p class="a"><b>A.</b> Partly: §1 says "similarly to ACER"; §7 says "better overall performance", with no Atari qualifier (ours: row 2 does not support that)</p>

</div>
</div>

<p class="footnote">Schulman et al. 2017 · §6.4, Table 2, Table 5; winner "by averaging the scoring metric across three trials". ACER: Wang et al. 2016, "Sample Efficient Actor-Critic with Experience Replay". Prediction: ours. Per-game results below (press ↓)</p>

Note:
Atari is the paper's only setting with discrete actions, pixels and, by inference, a network shared between policy and value: exactly the setting the introduction said TRPO doesn't suit. Yet TRPO isn't a baseline here, so that complaint is never tested. The opponents are well-tuned A2C and ACER, which reuses old data from a replay buffer. 49 games, 10 million timesteps, three trials.
Two metrics. Metric 1, average reward over all of training, favours fast learning: PPO wins 30 games, ACER 18. Metric 2, the last 100 episodes, favours final performance: ACER 28, PPO 19.
Here's the surprise. Experience replay is a sample-efficiency device; ACER's paper has "sample efficient" in its title. So the naive prediction is that ACER learns faster. It doesn't on metric 1; it only wins the end point. The paper doesn't explain this. And notice the two registers: the introduction says "similarly to ACER"; the conclusion says "better overall performance", about the family of methods and with no Atari qualifier. Row 2 doesn't support it for Atari, in our reading.

--

<p class="eyebrow"><span class="paper">Schulman et al. 2017</span> · App. B · Fig. 6, Table 6</p>

## Which games does each method win?

<div class="rows">
<div class="points">
<div class="text">

- only PPO learns: Enduro 758.3, Kangaroo 9928.7, Zaxxon 5008.7
- ACER far ahead: Gopher 37802.3, DemonAttack 38808.3

</div>
<div class="text">

- Table 6 count: ACER 27, PPO 19, A2C 1, ties 2
- Table 2 says 28 and 1 tie: Pong 20.7 = 20.7
- captions say "PPO and A2C"; ACER is there

</div>
</div>
<div class="fig"><img src="img/week-04-ppo-fig6-rows.png" alt="Schulman et al. Figure 6, three of its ten rows: fifteen Atari games with three runs each for A2C in blue, ACER in green and PPO in red; on Enduro, Freeway, Kangaroo and Montezuma's Revenge only PPO's curves rise; on Gopher and DemonAttack ACER's curves rise far above the others"></div>
</div>

<p class="footnote">Schulman et al. 2017 · App. B, Fig. 6 (rows 4 to 6 of 10; A2C blue, ACER green, PPO red), Table 6 (final scores, last 100 episodes, 40M frames). Counting Table 6: ours. A2C / ACER / PPO on Enduro: 0.0 / 0.0 / 758.3</p>

Note:
Optional. The appendix has learning curves for all 49 games and a table of final scores, the same metric as Table 2's second row. The spread across games is wide. On Enduro, Freeway, Kangaroo, Zaxxon and Montezuma's Revenge only PPO learns anything: Enduro 758.3 against zero for both others. On Gopher and DemonAttack ACER is far ahead.
Count the best per row of Table 6 and you get ACER 27, PPO 19, A2C 1 and two ties, Pong and Venture. Table 2 says ACER 28 with one tie; the two agree only if unrounded Pong favours ACER, which the paper doesn't say. And a labelling slip: Figure 6's caption, Table 6's caption and the appendix prose all say PPO and A2C, but ACER is in the legend and the table.

---

<p class="eyebrow"><span class="paper">Schulman et al. 2017</span> · §7 Conclusion: claims vs evidence</p>

## What does PPO not guarantee?

<table class="rules">
  <tr><td>claim (where)</td><td>evidence</td><td>verdict (ours)</td></tr>
  <tr><td>"stability and reliability of trust-region methods" (§7)</td><td>Table 1, Fig. 3; KL on one update</td><td>trust region never measured</td></tr>
  <tr><td>"much simpler to implement" (§5, §7)</td><td>Algorithm 1, first-order</td><td>supported</td></tr>
  <tr><td>"more general": joint policy-value network (abstract, §7)</td><td>Atari</td><td>TRPO never run that way</td></tr>
  <tr><td>"(i.e., lower bound) of the performance" (§1)</td><td>§3: bound on $L^{CPI}$</td><td>overstated</td></tr>
  <tr><td>"favorable balance ... and wall-time" (abstract)</td><td>no timing anywhere</td><td>not measured</td></tr>
  <tr><td>"better overall performance" (§7)</td><td>Table 2 row 2: ACER 28, PPO 19</td><td>not on Atari final scores</td></tr>
</table>

<p class="footnote">Schulman et al. 2017 · abstract, §1, §3, §7. Abstract: "outperforms other online policy gradient methods", defensible if ACER (replay) is not online</p>

Note:
Put the paper's claims next to its evidence. Stability and reliability of trust-region methods: plausible on MuJoCo, but the trust region is never measured across training, only one update in Figure 2. Much simpler to implement: yes. More general, because it works with a joint policy-value network: PPO works on Atari, but TRPO is never run that way, so "more general than TRPO" isn't tested. A lower bound on performance: Section 3 shows a bound on a surrogate only. A favourable balance of wall-time: no timing is reported anywhere. Better overall performance: not on Atari final scores.
So, plainly: no improvement theorem, no trust-region guarantee, and, outside Table 1, no attribution of the results to the clip rather than the rest of the code.

---

<p class="eyebrow"><span class="paper">Schulman et al. 2017</span> · the paper against itself</p>

## Where does the paper disagree with itself?

<div class="cols">
<div class="text">

- bound on: "performance" (§1) or $L^{CPI}$ (§3)?
- Atari: "similarly to ACER" vs "better overall"
- captions omit ACER (Fig. 6, Table 6)
- Table 2 vs Table 6: 28 vs 27 for ACER

</div>
<div class="text">

- §2.1 cites §6.1, "results are not shown": only the no-clip row
- Eqs. 10, 11: exponent $T-t+1$ ▸ $T-t-1$
- $r_t$: ratio and reward; $\delta$: limit and residual
- "without hyperparameter tuning" vs per-domain settings

</div>
</div>

<p class="footnote">Schulman et al. 2017 · §1, §2.1, §3, §5, §6.4, §7, App. B. Also: a misplaced parenthesis in §6.1's clipping line; Algorithm 1 indexes $1..T$, Eq. (10) says $[0, T]$. None changes the method; the first two change how strongly to read the claims</p>

Note:
The places where the paper disagrees with itself. The introduction calls the clipped objective a lower bound on the policy's performance; Section 3 says it bounds the unclipped surrogate. On Atari, the introduction says similar to ACER; the conclusion says better overall. Figure 6 and Table 6 captions forget ACER. Table 2 and Table 6 count ACER's wins differently. Section 2.1 points to Section 6.1 for results it says aren't shown; the nearest row is the no-clip one it calls similar, so the evidence is thin rather than contradictory. The GAE equations print the wrong exponent. Two symbols carry two meanings each. And the robustness goal, "without hyperparameter tuning", sits next to different settings in every domain.
None of these changes the method. The first two change how strongly we should read the paper's claims.

---

<p class="eyebrow"><span class="paper">Schulman et al. 2017</span> · the authors' own limitations</p>

## What do the authors admit?

<div class="cols">
<div class="text">

- multi-epoch $L^{PG}$ fails: "results are not shown"
- fixed $\beta$: "not sufficient"
- adaptive KL misses $d_{\rm targ}$: "these are rare"
- 1.5 and 2: "chosen heuristically"

</div>
<div class="text">

- KL penalty "performed worse"
- log-space clipping "no better"
- no limit: HalfCheetah below random
- Atari: "similarly to ACER"

<p class="q"><b>Q.</b> What do the admissions share?</p>
<p class="a"><b>A.</b> Nearly all are about variants that lost; the one about PPO itself is Atari "similarly to ACER"</p>

</div>
</div>

<p class="footnote">Schulman et al. 2017 · §2.1, §2.2, §4, §6.1, §1. The paper has no limitations section; these are scattered</p>

Note:
There's no limitations section; the concessions are scattered. Multi-epoch policy gradients fail, but the results aren't shown. A fixed beta isn't sufficient. The adaptive rule sometimes misses its target, rarely they say, and its constants were picked by hand. The KL penalty performed worse; log-space clipping was no better. Without any limit, HalfCheetah ends below random. And on Atari, PPO is similar to ACER.
My reading: nearly every admission is about a variant that lost. The one exception is Atari, where PPO is only similar to ACER. None concerns its lack of a guarantee, the seed counts, or the code. Those are the critiques that follow.

---

<p class="eyebrow"><span class="paper">Schulman et al. 2017</span> · critique 1 · §1 vs §3</p>

## Is it a lower bound on performance?

<div class="cols">
<div class="text">

<blockquote>§1: "a pessimistic estimate (i.e., lower bound) of the performance of the policy"</blockquote>
<blockquote>§3: "a lower bound ... on the unclipped objective"</blockquote>

</div>
<div class="text">

<p class="q"><b>Q.</b> Do they admit it?</p>
<p class="a"><b>A.</b> Implicitly: §3 is precise</p>
<p class="q"><b>Q.</b> Does it sink the argument?</p>
<p class="a"><b>A.</b> No: it sinks the theory reading, not the method</p>

</div>
</div>

<p class="footnote">Schulman et al. 2017 · §1, §3; §3 on Fig. 2: "$L^{CLIP}$ is a lower bound on $L^{CPI}$". Our critique</p>

Note:
The introduction says the clipped objective forms a lower bound on the performance of the policy. Section 3 says something much weaker: it's a lower bound on the unclipped surrogate, a local approximation. Only TRPO's max-KL penalty form is a bound on true performance.
Do they admit it? Implicitly; Section 3 is precise. Does it sink the argument? No. It sinks the theoretical reading, not the method. PPO should be presented as a well-motivated heuristic, not a cheaper TRPO with the same guarantee.

---

<p class="eyebrow"><span class="paper">Schulman et al. 2017</span> · critique 2</p>

## Does clipping keep a trust region?

<div class="cols">
<div class="text">

- a clipped sample still moves: shared weights
- first step of each iteration: unclipped
- KL measured once (Fig. 2), by construction
- bounds neither ratio nor KL

</div>
<div class="text">

<p class="q"><b>Q.</b> Do they admit it?</p>
<p class="a"><b>A.</b> No</p>
<p class="q"><b>Q.</b> Does it sink the argument?</p>
<p class="a"><b>A.</b> Partly: PPO acts like a trust region, but not by the stated mechanism (↓)</p>

</div>
</div>

<p class="footnote">Our critique, from Eq. (7) and Fig. 2. Measured by Engstrom et al. 2020 (below, press ↓)</p>

Note:
Clipping zeroes a sample's gradient once its ratio has moved enough. But the parameters are shared, so other samples' gradients keep moving it; nothing stops the ratio leaving the band. And the first step of every iteration is exactly the unclipped step, since all ratios start at 1. The only KL measurement in the paper is one update in Figure 2, whose peak is near-guaranteed by construction.
Do they admit it? No. Does it sink the argument? Partly. Engstrom et al. measured it, next.

--

<p class="eyebrow"><span class="paper">Schulman et al. 2017</span> · Later work · Engstrom et al. 2020</p>

## Do the ratios stay in the band?

<div class="rows">
<div class="points">
<div class="text">

- middle: max ratio far above $1+\epsilon$ (dashed)
- for PPO and PPO-M, trained with the clip

</div>
<div class="text">

- right: mean KL stays small, below TRPO's 0.07
- "For agents trained with optimal parameters"

</div>
</div>
<div class="fig"><img src="img/week-04-ppo-engstrom-fig2.png" alt="Engstrom et al. Figure 2, Humanoid-v2: left, mean reward against iterations for TRPO, PPO and PPO-M; middle, the maximum probability ratio climbs to between about 2.5 and 17 for all three, far above the dashed 1 plus epsilon line; right, mean KL between successive policies stays between about 0.02 and 0.065"></div>
</div>

<p class="footnote">Engstrom et al. 2020 (ICLR) · arXiv:2005.12729 · Fig. 2, §4, Humanoid-v2 (MuJoCo: a simulated 3D humanoid rewarded for running). PPO-M: PPO without the code-level optimizations. "all three algorithms fail to maintain a ratio-based trust region"</p>

Note:
Optional. Engstrom and colleagues measured what the PPO paper didn't. On Humanoid, for tuned agents, the maximum ratio climbs far above 1 plus epsilon, the dashed line, for PPO and for PPO-Minimal, both trained directly with the clip. Yet the mean KL between successive policies stays small, well under TRPO's bound of 0.07.
Their explanation: the first step is the unclipped step, so how far PPO moves depends on the optimiser and the learning rate, not on the objective. So PPO behaves like a trust-region method, for reasons that aren't the stated mechanism.

---

<p class="eyebrow"><span class="paper">Schulman et al. 2017</span> · critique 3 · Table 1</p>

## Were the settings tuned on the test?

<div class="cols">
<div class="text">

- each family's best: max of 3 or 4 noisy numbers
- on the very runs reported: a winner's curse
- $\epsilon$ = 0.2 reused on the same tasks (Fig. 3)
- 3 seeds, no error bars

</div>
<div class="text">

<p class="q"><b>Q.</b> Do they admit it?</p>
<p class="a"><b>A.</b> They chose "a computationally cheap benchmark" to search; no bias noted</p>
<p class="q"><b>Q.</b> Does it sink the argument?</p>
<p class="a"><b>A.</b> Weakens clip > KL (0.08), not control > none (1.01)</p>

</div>
</div>

<p class="footnote">Our critique. Schulman et al. 2017 · §6.1, §6.2</p>

Note:
Every family's best row in Table 1 is the maximum of three or four noisy estimates, computed on the very runs being reported, with three seeds and no error bars. That's a winner's curse: it inflates each family's best number. Then the chosen epsilon of 0.2 is reused on the same seven tasks in Figure 3, so that comparison benefits too.
Do they admit it? They say they chose a cheap benchmark because they were searching, not that this biases the comparison. Does it sink the argument? It weakens "clipping beats KL", a gap of 0.08, far more than "controlling the step beats not controlling it", a gap of more than 1.

---

<p class="eyebrow"><span class="paper">Schulman et al. 2017</span> · critique 4 · App. A</p>

## Robust "without hyperparameter tuning"?

<div class="cols">
<div class="text">

- MuJoCo: $\epsilon$ 0.2, fixed
- Atari: $0.1\alpha$, annealed, as is the learning rate
- Roboschool: KL-steered rate, exploration schedule, $\epsilon$ not listed (Table 4)
- epochs: 3 to 15

</div>
<div class="text">

<p class="q"><b>Q.</b> Do they admit it?</p>
<p class="a"><b>A.</b> No</p>
<p class="q"><b>Q.</b> Does it sink the argument?</p>
<p class="a"><b>A.</b> No: read "robust" as "sensible per-domain defaults"</p>

</div>
</div>

<p class="footnote">Our critique. Schulman et al. 2017 · §1 goal: "robust (i.e., successful on a variety of problems without hyperparameter tuning)"; Tables 3 to 5</p>

Note:
The stated goal is a method that succeeds on many problems without hyperparameter tuning. But each domain has its own settings: epsilon 0.2 fixed on MuJoCo; on Atari, 0.1 times a schedule that anneals to zero, along with the learning rate; on Roboschool, a KL-steered learning rate, a hand-set exploration schedule and no epsilon listed in Table 4; and between 3 and 15 epochs.
Do they admit it? No. Does it sink the argument? No. But "robust" should be read as "works with sensible per-domain defaults", not one setting everywhere.

---

<p class="eyebrow"><span class="paper">Schulman et al. 2017</span> · critique 5</p>

## Is it the clip, or the code?

<div class="cols">
<div class="text">

- baselines code: 9 optimizations (Engstrom)
- in the paper: tanh; Atari rate annealing
- not described: value clipping, reward scaling, observation normalisation, orthogonal init, gradient clipping
- the paper links no PPO code

</div>
<div class="text">

<p class="q"><b>Q.</b> Do they admit it?</p>
<p class="a"><b>A.</b> No</p>
<p class="q"><b>Q.</b> Does it sink the argument?</p>
<p class="a"><b>A.</b> It sinks crediting the clip for beating TRPO on MuJoCo; not PPO as a recipe (↓)</p>

</div>
</div>

<p class="footnote">Engstrom et al. 2020 §3 ("Attributing Success in PPO") list nine in OpenAI baselines' PPO; Schulman et al. 2017 §6.1 (tanh), Table 5 (annealing). Our critique. Later work below (press ↓)</p>

Note:
Engstrom et al. list nine details in the OpenAI baselines implementation of PPO. Two are in the paper: tanh activations, and on Atari only, learning-rate annealing. The rest are not described: value-function clipping, reward scaling, reward and observation clipping, observation normalisation, orthogonal initialisation, gradient clipping. Their comparison is on MuJoCo, where the paper's Table 3 uses a fixed learning rate. And the paper itself links no PPO code (its one link, in a footnote, is a vanilla policy gradient implementation).
Do they admit it? No. Does it sink the argument? It sinks crediting PPO's advantage over TRPO on MuJoCo to the clip. It doesn't sink PPO as a practical recipe. The numbers are next.

--

<p class="eyebrow"><span class="paper">Schulman et al. 2017</span> · Later work · Engstrom et al. 2020</p>

## What does the code add, and what does the clip add?

<div class="cols">
<div class="text">

<table class="rules">
  <tr><td></td><td class="num">Walker2d</td><td class="num">Hopper</td><td class="num">Humanoid</td></tr>
  <tr><td>PPO</td><td class="num">3292</td><td class="num">2513</td><td class="num">806</td></tr>
  <tr><td>PPO-M (no code details)</td><td class="num">2735</td><td class="num">2142</td><td class="num">674</td></tr>
  <tr><td>TRPO</td><td class="num">2791</td><td class="num">2043</td><td class="num">586</td></tr>
  <tr><td>TRPO+ (with them)</td><td class="num">3050</td><td class="num">2466</td><td class="num">1030</td></tr>
  <tr><td>PPO-NoClip (with them)</td><td class="num">2867</td><td class="num">2371</td><td class="num">831</td></tr>
</table>

</div>
<div class="text">

- algorithm swap: up to 242, 99, 224
- code details: up to 557, 423, 444
- TRPO+ beats PPO on Humanoid
- clip removed: −425, −142, +25

</div>
</div>

<p class="footnote">Engstrom et al. 2020 · Tables 2, 3 (§5); at least 80 agents per estimate, 95% bootstrap intervals; MuJoCo -v2 tasks: Walker2d and Hopper, robots rewarded for forward speed; Humanoid, a 3D humanoid. Reward = mean episode reward. They print 421 for Hopper; their table gives 2466 − 2043 = 423 (ours). Their "average" improvements are maxima</p>

Note:
Optional. Engstrom et al. ran every combination of step algorithm and code details on three MuJoCo tasks, at least 80 agents per number. Swapping the algorithm with the code fixed changes reward by at most 242, 99 and 224. Adding the code details with the algorithm fixed changes it by up to 557, 423 and 444. They print 421 for Hopper, but their own table gives 423. Without the details, PPO is below TRPO on Walker2d. With them, TRPO beats PPO on Humanoid, 1030 to 806.
And the clip itself: PPO with the details but no clip, NoClip, loses 425 on Walker2d, about 13% with non-overlapping intervals, 142 on Hopper, and nothing on Humanoid, where it's 25 higher. Its settings came from a grid search, which helps it. So the clip's contribution is between nothing and about 13%, depending on the task.

--

<p class="eyebrow"><span class="paper">Schulman et al. 2017</span> · Later work · Andrychowicz et al. 2020</p>

## Which of the many choices matter?

<div class="rows">
<div class="points">
<div class="text">

- over 50 choices, over 250,000 agents, 5 tasks
- PPO loss best on 4 of 5; start clip at 0.25

</div>
<div class="text">

- PPO's value clipping hurts; GAE $\lambda$ 0.9
- several epochs "crucial"; normalise observations

</div>
</div>
<div class="fig"><img src="img/week-04-ppo-andrychowicz-fig1.png" alt="Andrychowicz et al. Figure 1: 95th-percentile score for six policy losses, AWR, policy gradient, PPO, RPA, V-MPO and V-trace, on Hopper, Humanoid, Walker2d, HalfCheetah and Ant; PPO's bar is the highest or close to it on every panel"></div>
</div>

<p class="footnote">Andrychowicz et al. 2020 · arXiv:2006.05990 · Fig. 1 (95th percentile over sampled settings), §3. Losses compared: PG, plain policy gradient; AWR, advantage-weighted regression; V-MPO and V-trace, other loss families; RPA, repeat positive advantages (their own); only PPO is needed to read the figure. Tasks: Hopper, Walker2d, HalfCheetah, Ant (legged robots, forward speed), Humanoid. Their conjecture, "the PPO policy loss already enforces the trust region", meets Engstrom's measured ratios: a live disagreement</p>

Note:
Optional. Andrychowicz and colleagues at Google built one configurable agent with more than 50 choices and trained over 250,000 agents on five MuJoCo tasks. The PPO policy loss came out best on four of five; their advice is to start the clip at 0.25. Several passes over each batch are crucial, observation normalisation too. But PPO's own value clipping, in the released code, hurts.
There's a live disagreement worth naming. They conjecture the PPO loss already enforces the trust region; Engstrom measured that the ratio leaves the band. Both can be true if trust region means a small KL, and that comes from the whole recipe, not the clip alone.

---

<p class="eyebrow"><span class="paper">Schulman et al. 2017</span> · assessment</p>

## Why is this a strong paper?

<div class="cols">
<div class="text">

- a real negative control: no clip ▸ −0.39
- keeps the losing KL baseline, fully swept
- one loss, three domains
- Fig. 2: a clever line-search diagnostic
- a few lines of code: one reason it spread

</div>
<div class="text">

<p class="q"><b>Q.</b> The most convincing result?</p>
<p class="a"><b>A.</b> Table 1: same code, remove the clip, it fails (on one task)</p>
<p class="q"><b>Q.</b> The least?</p>
<p class="a"><b>A.</b> Clip vs KL: 0.08, three seeds</p>

</div>
</div>

<p class="footnote">Our assessment of Schulman et al. 2017 · Table 1, §4, §6, Fig. 2</p>

Note:
It would be easy to read the last few slides as a takedown. They aren't. The paper has a real negative control: the same algorithm with the clip removed fails below random. It keeps the losing method, the KL penalty, as a fully swept baseline. One core loss, with per-domain settings, works across continuous robots, a 3D humanoid and pixel games. Figure 2, a line search through parameter space with four objectives on one axis, shows in one picture why the min matters. And it's a few lines of code on a standard policy gradient, first-order only, which is surely one reason it was adopted so widely, including for language models.

---

<p class="eyebrow"><span class="paper">Schulman et al. 2017</span> · a proposal</p>

## What would convince us the clip is the mechanism?

<div class="cols">
<div class="text">

1. fix every code detail
2. ablate only the loss: clip, none, KL
3. tune on held-out tasks
4. many seeds, with intervals
5. log ratio and KL across training

</div>
<div class="text">

<p class="q"><b>Q.</b> Has it been done?</p>
<p class="a"><b>A.</b> Nearly: Engstrom, 80+ agents per number</p>
<p class="q"><b>Q.</b> The answer?</p>
<p class="a"><b>A.</b> Recipe works; clip adds 0 to 13%; without the details, PPO vs TRPO is −56 to +99</p>

</div>
</div>

<p class="footnote">Our proposal; numbers from Engstrom et al. 2020 Tables 2, 3 (PPO-M − TRPO: −56, +99, +88)</p>

Note:
The cheapest decisive experiment. Fix every code-level detail. Change only the policy loss: clip, nothing, KL penalty. Choose hyperparameters on held-out tasks, not the evaluation tasks. Use many seeds with intervals. And log the ratio range and the KL across all of training, not one update.
Engstrom et al. ran close to this. Their answer: the recipe works; removing the clip with the details on costs between nothing and about 13%; and without the details, PPO against TRPO ranges from 56 worse to 99 better. So the clip's specific contribution is small and depends on the task.

---

<p class="eyebrow"><span class="paper">Schulman et al. 2017</span> · Later work · Ouyang et al. 2022</p>

## What changes when the policy is a language model?

<div class="cols wide-fig">
<div class="text">

- RLHF: SFT ▸ reward model ▸ PPO
- per-token reward: KL term; RM score at the end
- 6B critic, started from the RM
- $\beta$ 0.02; clip 0.2; 1 epoch; no discount
- 256k episodes, about 31k prompts

<div class="eq">$$\max\ \mathbb{E}\Big[r_\theta(x,y) - \beta\log\frac{\pi^{\rm RL}(y \mid x)}{\pi^{\rm SFT}(y \mid x)}\Big]$$</div>

</div>
<div class="fig"><img src="img/week-04-ppo-instructgpt-fig2.png" alt="InstructGPT Figure 2: three steps; collect demonstrations and fine-tune GPT-3 with supervised learning; collect rankings of several outputs and train a reward model; sample a new prompt, generate an output with the policy, score it with the reward model and update the policy with PPO"></div>
</div>

<p class="footnote">Ouyang et al. 2022 · arXiv:2203.02155 · Fig. 2, Eq. 2 (pretraining term dropped), App. C. RLHF: reinforcement learning from human feedback. SFT: supervised fine-tuning. RM: reward model. $r_\theta$ is the RM here, not a ratio. Two KLs below (press ↓)</p>

Note:
What happens when the policy is a large language model? InstructGPT's recipe, RLHF: supervised fine-tuning on human demonstrations, a reward model trained on human rankings, then PPO against that reward model. The environment is a bandit: a prompt, a response, a reward, done. Inside, PPO runs per token: each token's reward is a KL term to the supervised model, plus the reward model's score at the last token, and GAE with no discount spreads the score back.
The settings: beta 0.02, clip 0.2, a single inner epoch, no discount, 256 thousand episodes over about 31 thousand prompts, and a 6-billion-parameter value network started from the reward model, for policies of every size.
The machinery carries over almost unchanged, but the costs grow: the critic is itself a 6B language model, trained to predict a reward that appears only at the last token. That's what the next reading targets. For scale, InstructGPT reports 60 petaflop/s-days for its 175B PPO run with pretraining mix, against 3,640 for pretraining GPT-3.

--

<p class="eyebrow"><span class="paper">Schulman et al. 2017</span> · Later work · Ouyang et al. 2022</p>

## Two KLs: which is which?

<div class="cols">
<div class="text">

- PPO: to $\pi_{\theta_{\rm old}}$, one iteration ago: step size
- RLHF: to $\pi^{\rm SFT}$, frozen: a leash on drift
- token 0.6 vs SFT 0.5: costs 0.0036
- token 0.4 vs SFT 0.5: a bonus of 0.0045

</div>
<div class="text">

<p class="q"><b>Q.</b> Can the per-token "penalty" be negative?</p>
<p class="a"><b>A.</b> Yes; only its expectation is a KL, never negative</p>
<p class="q"><b>Q.</b> 1 epoch, 8 minibatches: where can the clip bind?</p>
<p class="a"><b>A.</b> Not on the first (ratio 1); at most the other 7</p>

</div>
</div>

<p class="footnote">Ouyang et al. 2022: "a per-token KL penalty from the SFT model at each token to mitigate over-optimization of the reward model"; best $\beta$ "around 0.01 and 0.02". Worked numbers: ours, $\beta$ = 0.02</p>

Note:
Optional, but the point students most often confuse. PPO's own KL, and its clip, are to the policy one iteration ago: a step-size control. The RLHF KL is to the frozen supervised model: a leash on total drift, so the model stays close to fluent text and doesn't exploit the reward model's blind spots.
Worked numbers. A token the policy raised to 0.6 from the reference's 0.5 costs 0.02 times log 1.2, 0.0036. But a token it lowered to 0.4 gets a per-token reward of plus 0.0045: a bonus. On one sampled token the penalty can have either sign; only its expectation is a KL. And with one epoch of eight minibatches, the clip can't bind on the first minibatch at all. How much it does in RLHF is not measured in anything we read.

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
A one-line preview of the next reading. It keeps PPO's clipped ratio and removes the value network, getting the baseline from a group of sampled responses instead. We looked at the cost on the InstructGPT slides: the critic is as large as the policy. The side-by-side comparison belongs with that reading.

---

<p class="eyebrow"><span class="paper">Schulman et al. 2017</span> · Summary</p>

## What do the experiments establish?

<table class="rules">
  <tr><td>level</td><td>claim</td><td>evidence</td></tr>
  <tr><td>observed, with a control</td><td>multi-epoch updates need some step control</td><td>Table 1: −0.39 vs 0.62 to 0.82</td></tr>
  <tr><td>observed, no uncertainty</td><td>clip slightly above KL</td><td>0.82 vs 0.74, 3 seeds, tuned on test</td></tr>
  <tr><td>whole-algorithm comparisons</td><td>fast and competitive</td><td>Fig. 3, Table 2; loss and code not separated</td></tr>
  <tr><td>not established</td><td>trust region, guarantee, wall-time, clip as cause</td><td>later work: the clip's share is small</td></tr>
</table>

<p class="footnote">Our summary of Schulman et al. 2017 §6, with Engstrom et al. 2020</p>

Note:
Sort the claims by how much evidence stands behind them. With a control: multi-epoch updates without step control fail, and clipping or a KL penalty fixes it. Observed but without uncertainty: clipping scores a little above the best KL setting, on three seeds tuned on the same runs. Whole-algorithm comparisons: PPO learns fast and competes on MuJoCo and Atari, but those can't separate the loss from the code. Not established by the paper: a trust region across training, any improvement guarantee, wall-time, or that the clip is what makes PPO work; later work says its share is small.

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
- two halves: data first, then RL (from "Why drop PPO's critic?")

<p class="q"><b>Q.</b> Are the three numbers comparable?</p>
<p class="a"><b>A.</b> Not quite: Base is few-shot (Table 2); the other two are Table 5 chain-of-thought runs, prompting not stated</p>

</div>
<div class="fig"><img src="img/week-04-grpo-fig1.png" alt="Figure 1 of the paper: MATH top-1 accuracy of open models against release date, from LLaMA1-65B at about 10.6% in early 2023 up to Qwen-72B at about 35.2%, then a red star for DeepSeekMath-7B at about 51.7% in January 2024, just under dashed lines for Gemini-Ultra and GPT-4 API and above a GPT-4 early version line"></div>
</div>

<p class="footnote">Shao et al. 2024 · arXiv:2402.03300 · Abstract; Tables 2, 5; Fig. 1. SFT: supervised fine-tuning; RL: reinforcement learning; GRPO: Group Relative Policy Optimization. <b>MATH</b>: competition math problems; top-1: one answer, no tools, no voting. Fig. 1's values for Mistral-7B and Llemma-34B don't match Table 2 and its settings are not stated</p>

Note:
The model is built in three stages, and each has its number. DeepSeekMath-Base 7B is DeepSeek-Coder-Base-v1.5 7B trained on another 500B tokens, 56% from a new math corpus mined from Common Crawl: 36.2% on MATH, few-shot. Supervised fine-tuning (SFT) on 776K worked solutions gives DeepSeekMath-Instruct: 46.8%. Reinforcement learning (RL) with GRPO on about 144K questions gives DeepSeekMath-RL: 51.7%, close to GPT-4 and Gemini Ultra at the time. Self-consistency over 64 samples reaches 60.9%.
The abstract names exactly two factors: "a meticulously engineered data selection pipeline" and GRPO. Keep the first step honest: 36.2 is a few-shot evaluation of a base model; the other two are instruction-following models in Table 5, whose prompting the paper does not state. So 36.2 to 46.8 crosses two set-ups. Figure 1 is the paper's leaderboard over time; use it as motivation, not data: its Mistral and Llemma values don't match the tables.
The paper has two halves, and we take them in order. The data half comes first, as optional sub-slides: how the corpus was mined and checked, and whether it beats others. Then Base, Instruct, and from "Why drop PPO's critic?" on, the RL half, which is the spine of this week.

--

<p class="eyebrow"><span class="paper">Shao et al. 2024</span> · §2.1 · Fig. 2</p>

## How do you find 120B tokens of math on the web?

<div class="rows">
<div class="points">
<div class="text">

- 1: fastText classifier, seeded with OpenWebMath
- 2: recall pages from 40B deduplicated pages

</div>
<div class="text">

- 3: domains with over 10% collected
- 4: humans label math URL paths ▸ new seeds

</div>
</div>
<div class="fig"><img src="img/week-04-grpo-fig2.png" alt="Figure 2 of the paper: a loop. Math Seed, then 1. Train a FastText Model, 2. Recall Math-Related Webpages From Common Crawl, giving the Math Corpus, 3. Discover Math-Related Domains, 4. Annotate Math-Related URL Path From Labelers, back to the seed. Centre: Deduplicated Common Crawl, 40B HTML pages"></div>
</div>

<p class="footnote">Shao et al. 2024 · §2.1, Fig. 2. fastText: a fast linear classifier over word n-grams. OpenWebMath: an earlier 13.6B-token corpus of math web pages. Result: 35.5M pages, 120B tokens, after four iterations</p>

Note:
In 2023 open math corpora were small: OpenWebMath had 13.6B tokens, MathPile 8.9B, mostly arXiv. The bet is that much more math sits in Common Crawl, mixed in with everything else. Figure 2 is the loop that finds it.
Box 1: train a fastText classifier on 500,000 OpenWebMath pages against 500,000 random Common Crawl pages. fastText is crude but fast enough to score 40B pages. Box 2: score the deduplicated crawl and keep the top; in iteration 1, the top 40B tokens. Box 3: group the crawl by domain, and call a domain math-related if more than 10% of its pages were collected, mathoverflow.net for example. Box 4: humans label which URL paths in those domains hold math; missed pages under them become new positives. Retrain and go round again. The clever part: humans label URL patterns, not pages.

--

<p class="eyebrow"><span class="paper">Shao et al. 2024</span> · §2.1 · stopping and decontamination</p>

## When do you stop, and what slips through?

<div class="cols">
<div class="text">

- stop: about 98% already found in round 3
- 4 rounds: 35.5M pages, 120B tokens
- removed: any exact 10-gram match
- with GSM8K, MATH, CMATH, AGIEval

</div>
<div class="text">

<p class="q"><b>Q.</b> What does an exact 10-gram filter miss?</p>
<p class="a"><b>A.</b> Paraphrased or translated questions; reworded solutions (ours)</p>
<p class="q"><b>Q.</b> Which step mattered most?</p>
<p class="a"><b>A.</b> Unknown: no step is ablated</p>

</div>
</div>

<p class="footnote">Shao et al. 2024 · §2.1. Benchmark texts under 10 grams but at least 3: exact match. Q/A: ours. <b>GSM8K</b>: grade-school math word problems. <b>CMATH</b>: Chinese elementary-school math word problems. <b>AGIEval</b>: exam questions, including China's college-entrance Gaokao</p>

Note:
Why iterate? The first classifier only knows the kind of math in its seed; in their words, many pages stay uncollected because the positives lack diversity. After four iterations they have 35.5M pages and 120B tokens, and they stop because nearly 98% of the data had already been collected in the third iteration: the loop had converged for this classifier.
A web corpus will contain benchmark questions, because people post them. They remove any text segment with a 10-gram that exactly matches GSM8K, MATH, CMATH or AGIEval. That catches copies, not paraphrases, translations or reworded solutions, and the paper doesn't measure what it misses. Nor is any step of the pipeline ablated: we see only the final corpus.

--

<p class="eyebrow"><span class="paper">Shao et al. 2024</span> · §2.2 · Fig. 3, Table 1</p>

## Better corpus, or just a bigger one?

<div class="cols wide-fig">
<div class="text">

- 1.3B model, 150B tokens each; corpus 120.2B vs Proof-Pile-2 51.9B
- MATH: 13.6% vs Proof-Pile-2 11.2%
- passes: MathPile 16.85, ours 1.25
- Proof-Pile-2 web part: 6.3 passes
- steps at 120B, 135B: learning-rate drops

<p class="q"><b>Q.</b> The control?</p>
<p class="a"><b>A.</b> At 50B tokens it already leads (their "one full epoch" is loose under the 2:4:1 mix, ours)</p>

</div>
<div class="fig"><img src="img/week-04-grpo-fig3.png" alt="Figure 3 of the paper: four panels, GSM8K, MATH, CMATH and BBH accuracy against training tokens up to 150B for DeepSeek-LLM 1.3B trained on MathPile, OpenWebMath, Proof-Pile-2 and the DeepSeekMath Corpus; the DeepSeekMath curve is on top in the first three, MathPile stays flat, and the curves step up at about 120B tokens"></div>
</div>

<p class="footnote">Shao et al. 2024 · §2.2, Table 1, Fig. 3. Passes and the learning-rate reading: ours; Proof-Pile-2 is mixed arXiv:web:code 2:4:1. "Ours" in the points: the DeepSeekMath Corpus. <b>BBH</b>: 23 hard multi-step reasoning tasks</p>

Note:
Fair comparison: the same 1.3B model trained for 150B tokens on each corpus. Table 1's end points: the DeepSeekMath Corpus wins every column, MATH 13.6% against Proof-Pile-2's 11.2%, and MathPile, over 85% arXiv, is no better than no math training at all. In Figure 3 the red line is clearly on top on GSM8K, MATH and CMATH; on BBH the lines are tangled until about 95B tokens. Every curve except MathPile's steps up at 120B, with a smaller step at 135B: that is 80% and 90% of training, the two learning-rate drops, not the data.
The confound is repetition. In 150B tokens MathPile is seen 16.85 times, the new corpus 1.25 times, and even Proof-Pile-2's web part, under its 2:4:1 mix, 6.3 times. Bigger could beat better. The authors see it, and point out that at 50B tokens, "1 full epoch of Proof-Pile-2", the new corpus is already ahead. Under the mix that epoch is loose, and it is one noisy run per corpus, but it supports higher quality per token.

---

<p class="eyebrow"><span class="paper">Shao et al. 2024</span> · §2.3 · Table 2</p>

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

- mix: 56% corpus, 20% code, 10% arXiv
- start: a code model, DeepSeek-Coder 7B
- "outperforming" (§1) vs "comparable" (§1.1)

<p class="q"><b>Q.</b> Which wording does the table support?</p>
<p class="a"><b>A.</b> "Comparable": behind on OCW, MMLU-STEM</p>

</div>
</div>

<p class="footnote">Shao et al. 2024 · §2.3, Table 2 (few-shot chain of thought, %). Rest of the mix: 4% math code, 10% web text. Bold row: the paper's, though Minerva leads two columns. <b>Minerva</b>: Google's math-tuned language model (540B). <b>Llemma</b>: an open math-tuned Code Llama. <b>OCW</b>: undergraduate STEM problems from MIT OpenCourseWare. <b>MMLU-STEM</b>: STEM part of a 57-subject multiple-choice exam</p>

Note:
The real base model starts from a code model, DeepSeek-Coder-Base-v1.5 7B, and trains 500B more tokens: 56% the new corpus, 4% math code, 10% arXiv, 20% GitHub code, 10% web text. None of the shares is ablated; the 20% code has a reason we'll see in the code experiments.
Table 2: Base 7B beats every open base model, and on MATH beats Llemma 34B by 10.9 points and Minerva 540B, a model 77 times larger. But look at OCW and MMLU-STEM: Minerva is ahead there. The introduction says "outperforming Minerva 540B" in one place and "comparable performance" in another; the table supports the second. Even so, a 7B model matching 540B on math says a lot about data relative to parameters. Table 3, not shown: with Python tools Base reaches 66.9% on GSM8K and 31.4% on MATH.

--

<p class="eyebrow"><span class="paper">Shao et al. 2024</span> · §2.3 · Table 4</p>

## Did math training cost general ability?

<table class="rules">
  <tr><td>model</td><td class="num">MMLU</td><td class="num">BBH</td><td class="num">HumanEval</td><td class="num">MBPP</td></tr>
  <tr><td>Coder † (before learning-rate decay)</td><td class="num">42.9</td><td class="num">42.9</td><td class="num">40.2</td><td class="num">52.6</td></tr>
  <tr><td>Coder (final)</td><td class="num">49.1</td><td class="num">55.2</td><td class="num"><b>43.2</b></td><td class="num"><b>60.4</b></td></tr>
  <tr><td>DeepSeekMath-Base</td><td class="num">54.9</td><td class="num"><b>59.5</b></td><td class="num">40.9</td><td class="num">52.6</td></tr>
</table>

<p class="q"><b>Q.</b> Math training started from †. Is +16.6 on BBH the math?</p>
<p class="a"><b>A.</b> Mostly not: the decay alone gives +12.3. Fair gain: +4.3 (ours)</p>

<p class="footnote">Shao et al. 2024 · Table 4 (%). <b>MMLU</b>: 57-subject multiple-choice exam. <b>HumanEval</b>, <b>MBPP</b>: Python problems checked by unit tests. Bold: the paper's. Differences: ours</p>

Note:
Math training started from the dagger checkpoint, the Coder model just before its learning-rate decay. Against it, MMLU rises 12.0 and BBH 16.6. But the step from dagger to the final Coder is nothing except the decay, and it alone is worth MMLU +6.2 and BBH +12.3. Math training ends with a decay too. So the fair comparison is with the final Coder: MMLU +5.8, BBH +4.3, still gains.
Code falls against the final model: HumanEval 43.2 to 40.9, minus 2.3, and MBPP 60.4 to 52.6, minus 7.8. The paper's "effectively maintains" is true against dagger, less true against the final model. And MMLU and BBH contain math-like items, so a gain there need not mean general reasoning improved (our caution).

---

<p class="eyebrow"><span class="paper">Shao et al. 2024</span> · §3 · Table 5</p>

## What does instruction tuning add?

<div class="cols">
<div class="text">

- 776K examples, English and Chinese
- words, programs, text plus run code
- 500 steps, batch 256, rate 5e-5
- MATH 46.8%: best open model 37.7%
- over Base: 36.2 ▸ 46.8 (set-ups differ)

</div>
<div class="text">

<p class="q"><b>Q.</b> "Beats all 7B counterparts"?</p>
<p class="a"><b>A.</b> Not on GSM8K: two 7B PPO models score 84.1, 83.2 vs 82.9 (ours)</p>
<p class="q"><b>Q.</b> "Over 50% on MATH for the first time"?</p>
<p class="a"><b>A.</b> With tools, three open models already were (ours)</p>

</div>
</div>

<p class="footnote">Shao et al. 2024 · §3, Table 5. Math-Shepherd-Mistral 7B and WizardMath-v1.1 7B were trained with PPO (proximal policy optimization); Math-Shepherd: step-level math labels, built by checking whether a step can reach the right answer. Q/A: our checks. <b>GSM8K</b>: grade-school math word problems. Open models over 50% with tools: InternLM2-Math 20B 54.3, DeepSeek-LLM-Chat 67B 51.1, ToRA 34B 50.8</p>

Note:
A base model continues text; RL needs a policy that already answers in a consistent format and is right often enough that some samples earn reward. So: 776K examples in three formats, chain of thought, program of thought, and tool-integrated text with code that is run. A short run, 500 steps at batch 256. Instruct scores 82.9% on GSM8K and 46.8% on MATH, beating every open model's 37.7% on MATH but still under GPT-4's 52.9%.
Two claims in the introduction don't match Table 5. "Beats all 7B counterparts": on GSM8K, Math-Shepherd-Mistral and WizardMath-v1.1, both 7B, are ahead. Both were trained with PPO; they are the only PPO numbers in the paper. And "over 50% on MATH for the first time" is true only for the RL model with chain of thought. Remember Instruct's numbers, 82.9 and 46.8: they are RL's starting point.

---

<p class="eyebrow"><span class="paper">Shao et al. 2024</span> · notation</p>

## Which letters mean what?

<table class="rules">
  <tr><td>symbol</td><td>meaning</td><td>the paper writes</td></tr>
  <tr><td>$r_{i,t}(\theta)$</td><td>ratio: new policy over sampling policy, token $t$ of answer $i$</td><td>the fraction</td></tr>
  <tr><td>$R_i$</td><td>reward of answer $i$, one number per answer</td><td>$r_i$</td></tr>
  <tr><td>$\hat A_{i,t}$</td><td>advantage of token $t$ of answer $i$</td><td>same</td></tr>
  <tr><td>$G$</td><td>answers sampled per question (64)</td><td>same</td></tr>
  <tr><td>$\pi_{\rm ref}$</td><td>reference model, the KL anchor (frozen within a round)</td><td>same</td></tr>
  <tr><td>$u$</td><td>$\pi_{\rm ref}(o_t)/\pi_\theta(o_t)$ for the sampled token</td><td>the fraction</td></tr>
</table>

<p class="footnote">Our notation, matching the PPO section: $r$ is the ratio, $R$ the reward. The paper uses $r$ for rewards. KL: Kullback-Leibler divergence</p>

Note:
Same letters as the PPO section. The ratio is r, now indexed by answer i and token t; the reward is capital R. The paper writes rewards with lowercase r and never names the ratio, so its equations look different from ours; the content is the same.
Two new symbols. G is the group size: how many answers are sampled for one question, 64 in the paper. And u is the reference model's probability of the sampled token divided by the policy's; it is the quantity the KL estimator is built from.

---

<p class="eyebrow"><span class="paper">Shao et al. 2024</span> · §4.1.1 · Fig. 4</p>

## Why drop PPO's critic?

<div class="rows">
<div class="points">
<div class="text">

- PPO: 4 models, 2 trained
- value model: "comparable size" to the policy
- reward usually arrives at the last token only

</div>
<div class="text">

- GRPO: $G$ answers per question
- baseline: their mean reward (the group computation box replaces the value model)
- 3 models, 1 trained

</div>
</div>
<div class="fig"><img src="img/week-04-grpo-fig4.png" alt="Figure 4 of the paper. Top, PPO: the policy model writes output o; a frozen reference model and a frozen reward model give a KL-penalised reward r; a trained value model gives v; GAE turns r and v into the advantage A. Bottom, GRPO: the policy writes o1 to oG; the frozen reward model scores them r1 to rG; a group computation gives A1 to AG; the KL to the reference model goes straight to the policy"></div>
</div>

<p class="footnote">Shao et al. 2024 · §4.1.1, Fig. 4 (yellow: trained, blue: frozen; the paper's $r$ is our $R$). PPO: proximal policy optimization. GAE: generalised advantage estimation. Caption: "significantly reducing training resources", never measured</p>

Note:
No re-teaching of PPO; just the diff. Top row: PPO as used for language models, four models. The policy and the value model are trained; the reward model and the frozen reference model are not. The advantage comes from GAE, which needs the value model's prediction at every token. The KL to the reference sits inside the reward, token by token, following InstructGPT. Careful: that KL anchors to the frozen starting model, not to the previous policy as in the PPO paper's penalty variant. Same letter beta, different job.
The paper's two arguments against the value model: it is "typically another model of comparable size as the policy model", a "substantial memory and computational burden"; and "usually only the last token is assigned a reward score", which makes a per-token value hard to train. Bottom row, GRPO: sample a group of G answers, score them, and let the group's own mean be the baseline. Three models, one trained.

---

<p class="eyebrow"><span class="paper">Shao et al. 2024</span> · §4.1.1 · the critic's cost (ours)</p>

## How heavy is the critic, and how hard is its job?

<div class="cols">
<div class="text">

<table class="rules">
  <tr><td>7B model</td><td class="num">PPO</td><td class="num">GRPO</td></tr>
  <tr><td>policy, trained</td><td class="num">112 GB</td><td class="num">112 GB</td></tr>
  <tr><td>value, trained</td><td class="num">112 GB</td><td class="num">none</td></tr>
  <tr><td>reward + reference, frozen</td><td class="num">28 GB</td><td class="num">28 GB</td></tr>
  <tr class="total"><td>total</td><td class="num">252 GB</td><td class="num">140 GB</td></tr>
</table>

</div>
<div class="text">

- reward at token 500, $\lambda$ = 0.95
- weight reaching token 5:

<div class="eq">$$0.95^{495} \approx 9 \times 10^{-12}$$</div>

<p class="q"><b>Q.</b> And at $\lambda$ = 1?</p>
<p class="a"><b>A.</b> Weight 1: final reward plus later KL penalties, minus $V(s_t)$</p>

</div>
</div>

<p class="footnote">Ours, not the paper's: mixed-precision Adam, 16 bytes per trained parameter, 2 per frozen one (bf16: 16-bit floats); GRPO's 140 GB assumes the same 7B reward model; activations and generation cache left out. $\lambda$: GAE's credit decay, as in the PPO section, with $\gamma$ = 1</p>

Note:
The paper never puts a number on the burden, so here is our accounting. Training a model with mixed-precision Adam costs about 16 bytes per parameter: weights, gradients, optimiser state. A frozen model needs only its 16-bit weights, 2 bytes. At 7B, PPO holds about 252 GB, GRPO about 140 GB: 44% less, before activations and the generation cache.
The second argument is the deeper one. Recall GAE: the advantage is a discounted sum of surprises, discounted by lambda. The reward arrives at the last token. For token 5 of a 500-token answer, with the common lambda of 0.95, the reward reaches its advantage with weight 0.95 to the 495th, about 9 times 10 to the minus 12. Effectively zero. Everything token 5 learns about the final score comes through the value model's guess from a half-written solution. At lambda equal to 1 the reward reaches every token, and the value model is just a baseline: keep this for DeepSeek-R1's PPO comparison later.

---

<p class="eyebrow"><span class="paper">Shao et al. 2024</span> · §4.1.1 · Step 1</p>

## Step 1: why is subtracting a baseline free?

<div class="cols">
<div class="text">

<div class="eq">$$\nabla J = \mathbb E_{o\sim\pi_\theta}\big[(R(o) - b)\thinspace \nabla\log\pi_\theta(o)\big]$$</div>
<div class="eq">$$\mathbb E\big[b\thinspace \nabla\log\pi_\theta(o)\big] = b\thinspace \nabla\textstyle\sum_o \pi_\theta(o) = b\thinspace \nabla 1 = 0$$</div>

- REINFORCE: the PPO section's policy gradient
- $b$ must not depend on the sampled answer
- PPO: $b$ learned; GRPO: $b$ = group mean
- caveat, next slide: the group mean includes answer $i$

</div>
<div class="text">

<p class="q"><b>Q.</b> Group $(1,1,1,0)$: weights with no baseline?</p>
<p class="a"><b>A.</b> $(1,1,1,0)$: the wrong answer is ignored</p>
<p class="q"><b>Q.</b> With the mean, 0.75?</p>
<p class="a"><b>A.</b> $(0.25, 0.25, 0.25, -0.75)$: it is pushed down</p>
<p class="q"><b>Q.</b> Which known recipe weights answers like this?</p>
<p class="a"><b>A.</b> Rejection sampling fine-tuning (RFT): keep only the correct answers; we meet it again in the unified view</p>

</div>
</div>

<p class="footnote">Shao et al. 2024 · §4.1.1 (the group mean as baseline). Derivation and worked group: ours. REINFORCE: Williams 1992. RFT: rejection sampling fine-tuning, fine-tune on your own correct answers</p>

Note:
Why can you replace the value model at all? Because it is only a baseline. Start from the plain policy gradient from the PPO section, known as REINFORCE: push up the log-probability of each sampled answer in proportion to its reward. You may subtract any baseline b that doesn't depend on the sampled answer. The proof is one line: the expectation of b times the gradient of log pi is b times the gradient of the sum of the probabilities, which is the gradient of 1, which is zero.
So the baseline is free in expectation, and it changes what each answer gets. Take 0/1 rewards and a group with three right, one wrong. No baseline: weights 1, 1, 1, 0, and the wrong answer is simply ignored. That is rejection sampling fine-tuning, and its online version, which we'll meet in the unified view. Subtract the group mean of 0.75 and the wrong answer gets minus 0.75: it is pushed down. PPO learns the baseline with a network; GRPO estimates it by sampling.

---

<p class="eyebrow"><span class="paper">Shao et al. 2024</span> · §4.1.2 · Step 2</p>

## Step 2: why one advantage for every token?

<div class="cols">
<div class="text">

<div class="eq">$$\nabla\log\pi_\theta(o) = \sum_{t=1}^{\lvert o\rvert}\nabla\log\pi_\theta(o_t \mid q, o_{\lt t})$$</div>

- every token gets the answer's $R - b$
- that is REINFORCE, not a shortcut
- GRPO's loss carries two weights REINFORCE lacks:
- $1/\lvert o_i\rvert$: divide by the answer's length (also in PPO, Eq. 1)
- divide by the group's std

</div>
<div class="text">

<p class="q"><b>Q.</b> The mean includes answer $i$'s own reward. Biased?</p>
<p class="a"><b>A.</b> Only a factor $(G-1)/G$ = 0.984 at $G$ = 64</p>
<p class="q"><b>Q.</b> Then what really bends the gradient?</p>
<p class="a"><b>A.</b> The std: it depends on answer $i$'s reward</p>

</div>
</div>

<p class="footnote">Derivation: ours, from Shao et al. 2024 Eq. 3 and §4.1.2. Std: standard deviation. Both weights come back under later work (Dr. GRPO)</p>

Note:
Step two goes from whole answers to tokens. An answer's probability is the product of its token probabilities, so its log is a sum, and so is its gradient. Substitute into step one: every token of the answer is weighted by the same number, the answer's reward minus the baseline. So giving every token one advantage, which GRPO calls outcome supervision, is not a cheap approximation. It is exactly REINFORCE with a baseline.
GRPO's loss then carries two weights REINFORCE doesn't have: it divides each answer's gradient by its length, so a token in a long answer counts less (the paper's own PPO objective, Eq. 1, already has this length average); and it divides by the group's standard deviation. One more check: the group mean includes answer i's own reward. Write it out and that only rescales the true gradient by G minus 1 over G, 0.984 at G equals 64. The std division is the real departure, because the std depends on answer i itself. Hold on to both weights.

---

<p class="eyebrow"><span class="paper">Shao et al. 2024</span> · §4.1.1 · Eq. 3</p>

## What does GRPO change in PPO's objective?

<div class="eq">$$\mathcal J_{\rm GRPO} = \mathbb E\Big[\frac1G\sum_{i=1}^G\frac{1}{\lvert o_i\rvert}\sum_{t=1}^{\lvert o_i\rvert}\Big(\min\big[r_{i,t}\hat A_{i,t},\ \mathrm{clip}(r_{i,t}, 1-\epsilon, 1+\epsilon)\hat A_{i,t}\big] - \beta\thinspace \mathbb D_{\rm KL}[\pi_\theta \Vert \pi_{\rm ref}]\Big)\Big]$$</div>

<div class="rows">
<div class="points">
<div class="text">

1. clipped term: PPO's, unchanged
2. average over $G$ answers (the token average is already in PPO's Eq. 1)

<p class="q"><b>Q.</b> Why compare siblings?</p>
<p class="a"><b>A.</b> Reward models are trained on comparisons of answers to one question</p>

</div>
<div class="text">

<ol start="3">
<li>$\hat A_{i,t}$ from the group, no GAE (next slide)</li>
<li>KL to $\pi_{\rm ref}$: out of the reward, into the loss</li>
</ol>

</div>
</div>
</div>

<p class="footnote">Shao et al. 2024 · Eq. 1, Eq. 3, §4.1.1. $r_{i,t}$: ratio of $\pi_\theta$ to the sampling policy $\pi_{\theta_{\rm old}}$ for token $t$ of answer $i$. The KL leaves the reward to avoid "complicating the calculation of" $\hat A_{i,t}$</p>

Note:
Read Eq. 3 as a diff of PPO's clipped objective. One: the min and clip are exactly PPO's, now indexed by answer and token. Two: an average over G answers to the same question. That is the new part; the average over each answer's own tokens is already in the paper's PPO objective, Eq. 1, so it is not new here, though it comes back as the length bias in step two's extras. Three: the advantage comes from the group's rewards, not from GAE and a value model. Four: the KL penalty to the reference model leaves the reward and enters the loss. The paper's reason is that this avoids complicating the advantage; our reading is that the advantage is one number per answer, and a per-token penalty inside it would break that.
The authors add a nice argument for groups: reward models are trained on comparisons between answers to the same question, so they are better at saying which of two siblings is better than at absolute scores across questions. GRPO only ever compares siblings.

---

<p class="eyebrow"><span class="paper">Shao et al. 2024</span> · §4.1.2 · outcome supervision</p>

## How does a group grade its own answers?

<div class="cols wide-fig">
<div class="text">

<div class="eq">$$\hat A_{i,t} = \frac{R_i - \mathrm{mean}(R_1..R_G)}{\mathrm{std}(R_1..R_G)}$$</div>

- a z-score within each question
- same number on every token of answer $i$
- rare right answer: big push

<p class="q"><b>Q.</b> Do a group's advantages sum to 0?</p>
<p class="a"><b>A.</b> Yes: $1.732 - 3\times0.577 \approx 0$ (exactly $\sqrt3 - 3/\sqrt3 = 0$)</p>

</div>
<div class="fig"><img src="img/week-04-grpo-adv.svg" alt="Illustration: two groups of four answers with 0/1 rewards. Hard question, one right: the right answer gets +1.73, each wrong one -0.58. Easy question, three right: each right answer +0.58, the wrong one -1.73"></div>
</div>

<p class="footnote">Shao et al. 2024 · §4.1.2. Illustration: ours, 0/1 rewards and the population std (the paper doesn't say which std; the sample std gives +1.5 / -0.5). The paper's rewards come from a reward model, so they are graded</p>

Note:
Now the formula. A reward model scores each of the G answers. Subtract the group mean, so the advantages sum to zero; divide by the group's standard deviation, so every group's advantages have spread 1; and give that number to every token of the answer. It is a z-score within each question: for a network-science audience, standardisation within strata, each question its own stratum.
A worked group with 0/1 rewards. Hard question, one of four right: mean 0.25, std 0.433, so the right answer gets plus 1.73 and each wrong one minus 0.58. Easy question, three right: the signs flip, plus 0.58 each and minus 1.73 for the one wrong answer. A rare right answer on a hard question gets a big push; common outcomes get a nudge. With graded scores, say 0.9, 0.2, 0.4, 0.7, the advantages are plus 1.30, minus 1.30, minus 0.56, plus 0.56: both above-average answers are pushed up, the better one more.

---

<p class="eyebrow"><span class="paper">Shao et al. 2024</span> · §4.1.2 · the std division (ours)</p>

## What does dividing by the std cost?

<div class="cols wide-fig">
<div class="text">

- $G$ = 64, 1 right: std 0.124, ×8.06
- 32 right: std 0.5, ×2
- weight = sum of $\lvert\hat A_i\rvert$; 32-right vs 1-right question: 16x plain, 4x with the std
- scores 0.80, 0.81, 0.80, 0.81: ×200

<p class="q"><b>Q.</b> All 64 answers equal?</p>
<p class="a"><b>A.</b> std = 0, so $0/0$: not handled</p>

</div>
<div class="fig"><img src="img/week-04-grpo-std.svg" alt="Illustration: total weight per question against the number of right answers out of 64. Without the std the weight rises from 1.97 at one right to 32 at 32 right; with the std it rises from 15.9 to 64. The gap between the two questions shrinks from 16-fold to 4-fold"></div>
</div>

<p class="footnote">Ours: the paper gives no reason for the division and doesn't discuss its costs. Total weight: sum of absolute advantages. Every group ends with $\sum_i \hat A_i^2 = G$</p>

Note:
The paper gives no reason for the std. It is attractive because the advantage then ignores the reward model's scale, and every group ends with the same sum of squared advantages. But it has two costs.
First, questions are reweighted by difficulty. With 64 answers and one right, the std is 0.124, so the centred rewards are multiplied by 8; with half right, by 2. Compared with the plain policy gradient, which only centres, the half-right question carried 16 times the hard question's total weight; after the std it carries 4 times. The std boosts the near-impossible question four times more. Second, noise is amplified: four near-identical reward-model scores, 0.80 and 0.81, get a std of 0.005, a factor 200, and advantages of minus 1 and plus 1, as if one answer were right. And if all answers get the same reward the formula is zero over zero, which the paper doesn't discuss. Which std, population or sample? Not stated either.

--

<p class="eyebrow"><span class="paper">Shao et al. 2024</span> · Later work · Liu et al. 2025 (Dr. GRPO)</p>

## Should the length average and the std go?

<div class="cols">
<div class="text">

- $1/\lvert o_i\rvert$: long wrong answers punished less
- 100 vs 1,000 tokens: −0.01 vs −0.001 per token
- std: almost-all-right or all-wrong questions weighted up
- fix: remove both ▸ PPO with a Monte Carlo baseline

</div>
<div class="text">

<p class="q"><b>Q.</b> What does training then do to length?</p>
<p class="a"><b>A.</b> GRPO keeps growing wrong answers; Dr. GRPO mostly stops it</p>
<p class="q"><b>Q.</b> Verdict?</p>
<p class="a"><b>A.</b> Group baseline kept; both normalisations revised</p>

</div>
</div>

<p class="footnote">Liu et al. 2025, "Understanding R1-Zero-Like Training", arXiv:2503.20783, §3. Per-token toy: ours. Their ablation, Qwen2.5-1.5B: removing either term beats vanilla GRPO. They assume $\beta$ = 0 with rule-based rewards, unlike DeepSeekMath's 0.04</p>

Note:
Optional. Liu and colleagues found "an optimization bias in GRPO, which artificially increases response length (especially for incorrect outputs)". It comes from exactly the two extras of step two. The length average spreads a wrong answer's negative advantage over its tokens, so a 1,000-token wrong answer is pushed down ten times less per token than a 100-token one: if you are going to be wrong, be long. The std gives larger weight to questions the model almost always or almost never solves, our 16-fold to 4-fold.
Their fix, Dr. GRPO, removes both, which recovers PPO's objective with a Monte Carlo return and an unbiased baseline: step two exactly. The length growth many read as reasoning "emerging" under GRPO may be, at least in part, an artefact of the loss (their word: confounded).

---

<p class="eyebrow"><span class="paper">Shao et al. 2024</span> · §4.1.1 · Eq. 4</p>

## What estimator does GRPO use for the KL, and why is it fine?

<div class="cols wide-fig">
<div class="text">

- one sampled token, $u = \pi_{\rm ref}/\pi_\theta$
- PPO, in the reward: $k_1 = -\log u$ (not differentiated there, so fine)
- GRPO, in the loss: $k_3 = u - \log u - 1$
- same mean if tokens come from $\pi_\theta$: $\mathbb E_{\pi_\theta}[u-1] = \sum\pi_{\rm ref} - \sum\pi_\theta = 0$

<p class="q"><b>Q.</b> Why is $k_3 \ge 0$?</p>
<p class="a"><b>A.</b> $f'(u) = 1 - 1/u$: minimum 0 at $u = 1$</p>

</div>
<div class="fig"><img src="img/week-04-grpo-kl-est.svg" alt="Illustration: per-token KL estimates against u on a log axis. k3 = u - log u - 1 is a curve touching zero at u = 1 and positive elsewhere; k1 = -log u is a falling line that goes negative above u = 1. Dots at u = 0.625 (k1 +0.470, k3 +0.095) and u = 2.5 (k1 -0.916, k3 +0.584)"></div>
</div>

<p class="footnote">Shao et al. 2024 · Eq. 2, Eq. 4, after Schulman 2020, "Approximating KL Divergence" (blog), whose names $k_1$, $k_3$ we use. Toy: $\pi_\theta$ = (0.8, 0.2), $\pi_{\rm ref}$ = (0.5, 0.5); true KL 0.1927; variance $k_1$ 0.3075, $k_3$ 0.0382 (ours). "Guaranteed to be positive": non-negative</p>

Note:
Both methods estimate the KL from the one sampled token. Write u for the reference's probability of that token over the policy's. PPO's per-token penalty is k1, minus log u: right on average, but a single token can give a negative penalty, and inside a reward that is a bonus for drifting (our reading). PPO's k1 is fine in a reward, because a reward is not differentiated. GRPO uses k3, u minus log u minus 1. Its average is still the KL, because u minus 1 has mean zero under the policy: the sum of pi theta times pi ref over pi theta is the sum of pi ref, which is 1. That needs the tokens to come from pi theta itself.
Check it on two tokens: policy 0.8 and 0.2, reference a half each. True KL 0.1927. k1 gives 0.470 and minus 0.916, averaging 0.1927; k3 gives 0.095 and 0.584, also averaging 0.1927, and with a variance of 0.038 against 0.31. And k3 is never negative: its derivative 1 minus 1 over u is zero only at u equals 1, where it is zero. The paper says "guaranteed to be positive"; strictly, non-negative. But in a loss the sign of a sample doesn't matter. The gradient does. Next slide.

---

<p class="eyebrow"><span class="paper">Shao et al. 2024</span> · App. A.1.6 · the KL gradient (ours)</p>

## What does the KL term do to the gradient?

<div class="cols">
<div class="text">

<table class="rules">
  <tr><td>as a loss, tokens from $\pi_\theta$</td><td>expected gradient</td><td>descends</td></tr>
  <tr><td>$k_1 = \log(\pi_\theta/\pi_{\rm ref})$</td><td>$(0, 0)$</td><td>nothing</td></tr>
  <tr><td>$k_3 = u - \log u - 1$</td><td>$(0.3, -0.3)$</td><td>$\mathrm{KL}(\pi_{\rm ref}\Vert\pi_\theta)$</td></tr>
</table>

</div>
<div class="text">

- per token: $\nabla k_3 = (1-u)\nabla\log\pi_\theta$
- weight added: $\beta(u-1)$: $-0.015$, $+0.06$
- $(0.3, -0.3) = \pi_\theta - \pi_{\rm ref}$
- on average: distillation toward $\pi_{\rm ref}$

<p class="q"><b>Q.</b> Same mean as $k_3$, so why not $k_1$?</p>
<p class="a"><b>A.</b> Its expected gradient is zero</p>

</div>
</div>

<p class="footnote">Shao et al. 2024 · App. A.1.6, Eq. 21 ($GC_{\rm GRPO}$ has the $\beta(u-1)$ term). Toy: $\pi_\theta$ = (0.8, 0.2), $\pi_{\rm ref}$ = (0.5, 0.5); table: expected gradient of each loss with respect to the two logits (the scores before the softmax), tokens from $\pi_\theta$, $\beta$ not included; "descends": the divergence it lowers on average; the $\beta(u-1)$ values use $\beta$ = 0.04 (ours). Note the order: $k_3$ descends the divergence with the arguments swapped from Eq. 3's notation</p>

Note:
Differentiate k3 with the token held fixed: you get one minus u times the gradient of log pi. Subtracting beta k3 therefore adds beta times u minus 1 to each token's weight, which is exactly the appendix's gradient coefficient: positive when the reference likes the token more than the policy does. In our toy, minus 0.015 and plus 0.06.
Now average over tokens sampled from the policy. The sum of p minus q times the gradient of log p is the gradient of KL of the reference from the policy, with the arguments in the opposite order from the D KL of pi theta and pi ref the paper writes. The table does k1 and k3 on the toy; the sub-slide adds Schulman's k2. k1 has the same mean value as k3 but zero expected gradient: as a loss it does nothing. k3 descends the KL with the arguments swapped. Its expected gradient is pi theta minus pi ref, the gradient of a cross-entropy toward the reference: on average, a little distillation. I avoid the words forward and reverse, because authors use them in opposite ways.

--

<p class="eyebrow"><span class="paper">Shao et al. 2024</span> · App. A.1.6 · Schulman's $k_2$ (ours)</p>

## Which estimator descends the KL as the paper writes it?

<table class="rules">
  <tr><td>as a loss, tokens from $\pi_\theta$</td><td>expected gradient</td><td>descends</td></tr>
  <tr><td>$k_1 = \log(\pi_\theta/\pi_{\rm ref})$</td><td>$(0, 0)$</td><td>nothing</td></tr>
  <tr><td>$k_2 = \frac12\log^2(\pi_\theta/\pi_{\rm ref})$</td><td>$(0.22, -0.22)$</td><td>$\mathrm{KL}(\pi_\theta\Vert\pi_{\rm ref})$</td></tr>
  <tr><td>$k_3 = u - \log u - 1$</td><td>$(0.3, -0.3)$</td><td>$\mathrm{KL}(\pi_{\rm ref}\Vert\pi_\theta)$</td></tr>
</table>

<p class="q"><b>Q.</b> Which row is the KL that Eq. 3 names?</p>
<p class="a"><b>A.</b> $k_2$; GRPO uses $k_3$, which descends the other order</p>

<p class="footnote">Same toy as the previous slide: $\pi_\theta$ = (0.8, 0.2), $\pi_{\rm ref}$ = (0.5, 0.5); gradients with respect to the logits, $\beta$ not included. $k_2$: Schulman's squared estimator; the paper's appendix says it gives an unbiased gradient of $\mathrm{KL}(\pi,\pi_{\rm ref})$</p>

Note:
The same table with Schulman's third estimator, k2, put back. K2, half the squared log ratio, has an expected gradient of 0.22 and minus 0.22 on the toy, and it is the one that descends the KL in the order the paper writes. GRPO does not use it; it uses k3, whose expected gradient is the gradient of the divergence with the arguments swapped.

--

<p class="eyebrow"><span class="paper">Shao et al. 2024</span> · Later work · Tang &amp; Munos 2025</p>

## Does the KL term anchor what it says it anchors?

<div class="cols">
<div class="text">

- needs tokens from $\pi_\theta$ ($\mu$ = 1: yes)
- off-policy, $\pi_{\theta_{\rm old}}$ = (0.6, 0.4): value 0.2905, gradient (0.525, −0.525)
- per position only: ignores effects on later tokens
- $k_3$ loss: "positions of the two distributions ... reversed"

</div>
<div class="text">

<p class="q"><b>Q.</b> Does it matter in practice?</p>
<p class="a"><b>A.</b> At $\beta$ = 0.001 little, they "speculate" because KL stays low</p>
<p class="q"><b>Q.</b> And at DeepSeekMath's 0.04?</p>
<p class="a"><b>A.</b> Not tested by them; large gaps shown only in distillation</p>

</div>
</div>

<p class="footnote">Tang &amp; Munos 2025, "On a few pitfalls in KL divergence gradient estimation for RL", arXiv:2506.09477; they name GRPO among affected designs. Off-policy numbers: ours (true KL 0.1927). For $k_3$ token losses: "does not produce even the partial gradient" of a sequence-level divergence</p>

Note:
Optional. Three conditions the paper leaves implicit. The tokens must come from the current policy: in the paper's run they do, since there is one update per batch. With samples from an older policy, say 0.6 and 0.4, the estimate's mean becomes 0.29 instead of 0.19, and the expected gradient is the gradient of neither divergence. Second, the derivation holds per position, ignoring how a token changes the later tokens' distributions. Third, the length average applies to this term too.
Tang and Munos make the same point in 2025: differentiating k1 does nothing, differentiating k3 gives the gradient with the two distributions reversed, and k3 token losses don't even give a partial gradient of a whole-answer divergence. They found little practical difference at beta 0.001, R1's value, and speculate it is because training stays at low KL; DeepSeekMath's 0.04 wasn't tested. So the term still anchors the policy to the reference, just not exactly the anchor the notation names.

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

<p class="eyebrow"><span class="paper">Shao et al. 2024</span> · §4.1.4 · Algorithm 1</p>

## Why retrain the reward model mid-run?

<div class="cols">
<div class="text">

<table class="rules">
  <tr><td>model</td><td>changes</td></tr>
  <tr><td>$\pi_\theta$, trained</td><td>every gradient step</td></tr>
  <tr><td>$\pi_{\theta_{\rm old}}$, sampled from</td><td>every sampling step</td></tr>
  <tr><td>$\pi_{\rm ref}$, KL anchor</td><td>every outer iteration</td></tr>
  <tr><td>Instruct 7B, start</td><td>never</td></tr>
</table>

</div>
<div class="text">

- reward model goes stale as the policy moves
- each round: new samples + 10% old data
- then $\pi_{\rm ref} \leftarrow \pi_\theta$
- loops: $I$ rounds, $M$ steps, $\mu$ updates

<p class="q"><b>Q.</b> KL at a round's first step?</p>
<p class="a"><b>A.</b> Zero: $\pi_{\rm ref} = \pi_\theta$, so $u = 1$</p>

</div>
</div>

<p class="footnote">Shao et al. 2024 · §4.1.4, Algorithm 1. $\mu$ = 1 in the paper's run; $M$ not stated. Algorithm 1 line 11 cites "Equation 21", the gradient coefficient, for the objective (Eq. 3)</p>

Note:
Four versions of the model, three loops. The policy changes at every gradient step. The old policy, the copy that sampled the batch, is refreshed at every sampling step. The reference model, the KL anchor, is reset to the current policy at every outer iteration. The starting Instruct model never changes.
Why iterate? The reward model was trained on answers from the starting model. As RL proceeds, the policy writes answers the reward model has never seen, and its scores get less reliable exactly where the policy explores. So after each round they retrain it on the current policy's samples, with a replay of 10% old data so it doesn't forget, and reset the reference to the policy. A small slip: Algorithm 1 cites Equation 21, the appendix's gradient coefficient, as the objective.

--

<p class="eyebrow"><span class="paper">Shao et al. 2024</span> · §5.2.1 · Fig. 6</p>

## Does iterating the reward model help?

<div class="rows">
<div class="points">
<div class="text">

- iteration 0: MATH 46.8 ▸ about 49.9, then dips
- iteration 1: about 50 to 52; GSM8K about 87 to 88

</div>
<div class="text">

- iteration 2: GSM8K up to about 89; MATH flat
- 2 things change at once; 1 run each

</div>
</div>
<div class="fig"><img src="img/week-04-grpo-fig6.png" alt="Figure 6 of the paper: GSM8K and MATH accuracy against training steps for iterations 0, 1 and 2 of iterative RL from DeepSeekMath-Instruct 7B. Iteration 0 rises from 82.9 and 46.8; iteration 1 sits clearly higher; iteration 2 adds a little on GSM8K and little on MATH"></div>
</div>

<p class="footnote">Shao et al. 2024 · §5.2.1, Fig. 6, DeepSeekMath-Instruct 7B; GSM8K: grade-school word problems; MATH: competition problems. iterations 0 to 2 are the paper's "two rounds". Readings by eye. Iteration 1 starts near step 1,100 to 1,300, before iteration 0 ends near 2,800: not explained</p>

Note:
Optional. How to read it: steps on x, accuracy on y, one run per iteration. Iteration 0 climbs from Instruct's 82.9 and 46.8 to about 86 to 87 and 49.9, then on MATH falls back to about 48.7, consistent with a stale reward model. Iteration 1 is clearly higher, about 87 to 88 and 50 to 52. Iteration 2 adds a little on GSM8K and nothing clear on MATH. The paper: iterative RL helps "especially at the first iteration". The figure supports that.
What it doesn't show: between rounds two things change at once, the reward model is retrained and the reference is reset, so it can't say which helped; and each is one run. Also unexplained: iteration 1 starts before iteration 0 ends, as if branched from an earlier checkpoint.

---

<p class="eyebrow"><span class="paper">Shao et al. 2024</span> · §4.2 · the recipe</p>

## What exactly did they train with?

<div class="cols">
<div class="text">

<table class="rules nohead">
  <tr><td>start</td><td>Instruct 7B</td></tr>
  <tr><td>questions</td><td>about 144K, GSM8K and MATH</td></tr>
  <tr><td>group $G$, KL $\beta$</td><td>64, 0.04</td></tr>
  <tr><td>learning rate, max length</td><td>1e-6, 1024</td></tr>
  <tr><td>updates per batch $\mu$</td><td>1</td></tr>
  <tr><td>clip $\epsilon$</td><td>not reported</td></tr>
</table>

</div>
<div class="text">

- questions only: never the SFT solutions
- reward model: from Base 7B, labels from answer checks
- up to 65,536 tokens per question per step (ours)

<p class="q"><b>Q.</b> $\mu$ = 1: what is $r_{i,t}$ at the gradient?</p>
<p class="a"><b>A.</b> Exactly 1, so the clip never binds</p>

</div>
</div>

<p class="footnote">Shao et al. 2024 · §4.2; §5.2.1 (reward labels "based on the rule judgment"); App. A.1.5: with one update, "we can remove the $\min$ and clip operation". No value is justified in the paper. Batch 1024: questions or answers, not stated. Token bound $64 \times 1024$: ours</p>

Note:
The recipe, and why each setting matters. RL starts from Instruct 7B and uses only the questions of about 144K GSM8K and MATH chain-of-thought examples; it samples its own answers and never trains on the SFT solutions. Everything else is held out on purpose, to test transfer. The reward model is trained from Base 7B on labels built following Math-Shepherd, which come from checking answers. Why a learned model rather than the check itself? The paper doesn't say; plausibly because it gives graded scores and can score steps.
G equals 64 makes the group statistics stable and is expensive: up to 65,536 generated tokens per question per step. The row to stare at is mu equals 1: one update per sampled batch. Then the policy being differentiated is the one that sampled, the ratio is exactly 1, and the clip never binds. The appendix says so. Our reading: in this run GRPO is REINFORCE with a group baseline, a std scaling, a length average and a KL anchor; the PPO machinery is present but inert. That would also explain why epsilon is never given.

---

<p class="eyebrow"><span class="paper">Shao et al. 2024</span> · §4.2 · Table 5</p>

## What did RL buy across eight benchmarks?

<table class="rules">
  <tr><td>setting</td><td>benchmark</td><td class="num">Instruct</td><td class="num">RL</td><td class="num">change</td></tr>
  <tr><td>setting</td><td>benchmark</td><td class="num">Instruct</td><td class="num"><b>RL</b></td><td class="num">change</td></tr>
  <tr><td>chain of thought</td><td>GSM8K</td><td class="num">82.9</td><td class="num"><b>88.2</b></td><td class="num">+5.3</td></tr>
  <tr><td>chain of thought</td><td>MATH</td><td class="num">46.8</td><td class="num"><b>51.7</b></td><td class="num">+4.9</td></tr>
  <tr><td>chain of thought</td><td>MGSM-zh</td><td class="num">73.2</td><td class="num"><b>79.6</b></td><td class="num">+6.4</td></tr>
  <tr><td>chain of thought</td><td>CMATH</td><td class="num">84.6</td><td class="num"><b>88.8</b></td><td class="num">+4.2</td></tr>
  <tr><td>tools</td><td>GSM8K</td><td class="num">83.7</td><td class="num"><b>86.7</b></td><td class="num">+3.0</td></tr>
  <tr><td>tools</td><td>MATH</td><td class="num">57.4</td><td class="num"><b>58.8</b></td><td class="num">+1.4</td></tr>
  <tr><td>tools</td><td>MGSM-zh</td><td class="num">72.0</td><td class="num"><b>78.4</b></td><td class="num">+6.4</td></tr>
</table>

<p class="footnote">Shao et al. 2024 · Table 5 (top-1, %); bold: the paper's (RL rows); in domain (§4.2): only GSM8K and MATH with chain of thought, the rest the paper calls out of domain; changes: ours. <b>MGSM-zh</b>: GSM8K test problems translated into Chinese. Tools: answers that write and run code. <b>GSM8K</b>: grade-school word problems; <b>MATH</b>: competition problems; <b>CMATH</b>: Chinese elementary word problems. GPT-4 on MATH, chain of thought: 52.9</p>

Note:
All eight cells go up. The two in-domain cells, GSM8K and MATH with chain of thought, rise about 5 points; the cells the paper calls out of domain rise as much, MGSM-zh by 6.4 in both settings. The smallest gain is tool-integrated MATH, 1.4. For scale, GPT-4 scores 52.9 on MATH and Gemini Ultra 53.2; RL's 51.7 is close.
Read the labels carefully, though. MGSM-zh is GSM8K translated into Chinese, and the tool-integrated cells are the same benchmarks answered in another format. "Out of domain" here means another language or answer format, not another kind of problem. Question for the room: why would Chinese GSM8K gain as much as English GSM8K? First because it is GSM8K. Second, if RL mostly sharpens which existing answer wins, a hypothesis we'll test with Figure 7, the language shouldn't matter.

--

<p class="eyebrow"><span class="paper">Shao et al. 2024</span> · §4.2 · what it shows</p>

## What does Table 5 show, and not show?

<div class="cols">
<div class="text">

<p class="q"><b>Shows</b></p>

- narrow RL lifts a strong model everywhere
- including held-out benchmarks
- no value model needed

</div>
<div class="text">

<p class="q"><b>Doesn't show</b></p>

- that GRPO matches PPO: no PPO run
- which variant: outcome or process, 1 or 2 rounds
- seed spread: one run, no error bars

</div>
</div>

<p class="footnote">Shao et al. 2024 · §4.2, Table 5. "Doesn't show" column: our reading of what the paper does not report</p>

Note:
What Table 5 establishes: RL with GRPO on a narrow question set improves a strong instruct model on every benchmark, including the held-out ones, and does so without a value model. That is the paper's core RL claim, and it holds.
What it doesn't: that GRPO is as good as PPO, since no PPO model is trained on the same data; which variant produced the row, outcome or process rewards, one round or two, which the paper never says; and how much of a 1.4- or 3-point gain would survive another seed, since there is one run per model and no error bars.

---

<p class="eyebrow"><span class="paper">Shao et al. 2024</span> · §5.1.1 · Tables 6, 7</p>

## Does code before math help math?

<table class="rules">
  <tr><td>1.3B model</td><td class="num">GSM8K</td><td class="num">MATH</td><td class="num">GSM8K + Python</td><td class="num">MATH + Python</td></tr>
  <tr><td>general 400B only</td><td class="num">2.9</td><td class="num">3.2</td><td class="num">3.3</td><td class="num">2.3</td></tr>
  <tr><td>code 400B only</td><td class="num">5.9</td><td class="num">3.6</td><td class="num">12.4</td><td class="num">10.0</td></tr>
  <tr><td>general ▸ math 150B</td><td class="num">19.1</td><td class="num">14.4</td><td class="num">14.3</td><td class="num">6.7</td></tr>
  <tr><td>code ▸ math 150B</td><td class="num"><b>21.9</b></td><td class="num"><b>15.3</b></td><td class="num">17.4</td><td class="num">9.4</td></tr>
  <tr><td>code and math mixed</td><td class="num">17.6</td><td class="num">12.1</td><td class="num"><b>19.7</b></td><td class="num"><b>13.5</b></td></tr>
</table>

<p class="q"><b>Q.</b> Code first, without tools: how much?</p>
<p class="a"><b>A.</b> +2.8 GSM8K, +0.9 MATH, one run each (ours)</p>

<p class="footnote">Shao et al. 2024 · §5.1.1, Table 6 (%, bold: the paper's); Table 7: math after code drops HumanEval 25.0 ▸ 12.2, MBPP 40.0 ▸ 17.0; mixing keeps 29.3, 39.4. Uses the 89B-token second-iteration corpus</p>

Note:
Optional depth. "A popular yet unverified hypothesis suggests that code training improves reasoning." They test it at 1.3B with a real control: 400B tokens of code, or of general text, then the same 150B of math. The stage-one rows carry the strongest result: code alone takes GSM8K with Python from 3.3 to 12.4 and MATH with Python from 2.3 to 10.0. After the math stage, code first wins every column, but without tools only by 2.8 and 0.9 points, one run each.
Mixing code and math in one stage gives the best tool-using scores and worse scores without tools; their guess is that 1.3B lacks capacity for both. And math after code destroys coding, HumanEval 25.0 to 12.2, which mixing prevents: that is why the real model keeps 20% code. The sentence "We believe it does" rests on small gaps at 1.3B.

---

<p class="eyebrow"><span class="paper">Shao et al. 2024</span> · §5.1.2 · Tables 8, 9</p>

## Do arXiv papers help math?

<div class="cols">
<div class="text">

<table class="rules">
  <tr><td>7B, 40B tokens</td><td class="num">GSM8K</td><td class="num">MATH</td><td class="num">SAT</td><td class="num">MathQA</td></tr>
  <tr><td>no math training</td><td class="num">29.0</td><td class="num">12.5</td><td class="num">40.6</td><td class="num">21.1</td></tr>
  <tr><td>MathPile</td><td class="num">23.6</td><td class="num">11.5</td><td class="num">46.9</td><td class="num">25.6</td></tr>
  <tr><td>ArXiv-RedPajama</td><td class="num">28.1</td><td class="num">11.1</td><td class="num">50.0</td><td class="num">24.8</td></tr>
</table>

</div>
<div class="text">

- 1.3B: MMLU-STEM 19.5 ▸ 9.0
- 7B: down or flat, except SAT, Gaokao
- "no notable improvements on all"
- vs "a grain of salt"

<p class="q"><b>Q.</b> And the real model?</p>
<p class="a"><b>A.</b> Still keeps 10% arXiv</p>

</div>
</div>

<p class="footnote">Shao et al. 2024 · §1.1, §5.1.2, Table 8 (%). ArXiv-RedPajama: 28.0B tokens of arXiv LaTeX. <b>SAT</b>: the US college-admission exam, math section. <b>MathQA</b>: Gaokao-MathQA, Chinese college-entrance multiple choice. Table 9: miniF2F-test 21.7 ▸ 11.9 (formal Olympiad proofs)</p>

Note:
Optional depth. Perhaps counter-intuitively, they write, arXiv papers seem ineffective. They train a 1.3B model and the 7B Coder model on two arXiv corpora. At 1.3B arXiv clearly hurts: MMLU-STEM 19.5 to 9.0. At 7B, GSM8K, MATH and formal proofs go down or stay flat, but SAT rises by up to 9.4 points and Gaokao-MathQA by up to 4.5. Repetition matters too: at 1.3B, MathPile is seen almost 17 times.
So two registers again. The contributions say arXiv "brings no notable improvements on all mathematical benchmarks". The section itself says the conclusion "should be taken with a grain of salt" and lists what it didn't test, including arXiv mixed with other data. The table matches the second. And the real Base model still keeps 10% arXiv, consistent with that caveat.

---

<p class="eyebrow"><span class="paper">Shao et al. 2024</span> · §5.2.1 · Eq. 5, Table 10</p>

## Is every method SFT with a weight per token?

<div class="eq">$$\nabla\mathcal J_{\mathcal A} = \mathbb E_{(q,o)\sim\mathcal D}\Big[\frac{1}{\lvert o\rvert}\sum_t GC_{\mathcal A}(q,o,t)\ \nabla\log\pi_\theta(o_t \mid q, o_{\lt t})\Big]$$</div>

<table class="rules">
  <tr><td>method</td><td>answers sampled from</td><td>reward</td><td>weight on each token</td></tr>
  <tr><td>SFT</td><td>human-written data</td><td>none</td><td>1</td></tr>
  <tr><td>RFT</td><td>the frozen SFT model</td><td>rule</td><td>1 if correct, else 0</td></tr>
  <tr><td>Online RFT</td><td>the current policy</td><td>rule</td><td>1 if correct, else 0</td></tr>
  <tr><td>PPO</td><td>the current policy</td><td>model</td><td>$\hat A_t$ from a value model</td></tr>
  <tr><td>GRPO</td><td>the current policy, $G$ per question</td><td>model</td><td>$\hat A_{i,t} + \beta(u - 1)$</td></tr>
</table>

<p class="footnote">Shao et al. 2024 · §5.2.1, Eq. 5, Table 10, App. A.1 (with $\mu$ = 1). Table 10 also lists DPO (direct preference optimisation, a later reading): a pairwise weight. Rule: answer checked against the key; the reward model's labels also come from the rule</p>

Note:
The paper's most reusable idea. Write the gradient of any of these methods the same way: SFT's gradient of log pi of each token, times a per-token weight, the gradient coefficient. Methods differ in only three knobs: where the answers come from, what the reward is, and how the weight is computed.
SFT weights every token of a human solution by 1. Rejection sampling fine-tuning samples from the frozen SFT model and keeps the correct answers: weight 1 or 0, the no-baseline weights of step one. Online RFT does the same with the current policy: with a 0/1 reward, that is REINFORCE with no baseline. PPO's weight is the value-model advantage; GRPO's is the group advantage plus the KL term. Read down the table and you see what RL adds over SFT: answers from the model's own current distribution, and weights that can be negative and graded. Check: on the group 1, 0, 0, 0, Online RFT gives 1, 0, 0, 0; GRPO gives plus 1.73 and three minus 0.58s.

--

<p class="eyebrow"><span class="paper">Shao et al. 2024</span> · §5.2.1 · Fig. 5</p>

## Which ingredient wins in Figure 5?

<div class="rows">
<div class="points">
<div class="text">

- online beats offline, late in training
- GRPO beats Online RFT
- per-step beats per-answer on GSM8K

</div>
<div class="text">

- on MATH: GRPO curves peak near step 4,000, interleave
- no PPO, no DPO curve; 1.3B; one run each

</div>
</div>
<div class="fig"><img src="img/week-04-grpo-fig5.png" alt="Figure 5 of the paper: GSM8K and MATH accuracy against training steps up to about 8,800 for DeepSeekMath-Instruct 1.3B trained with RFT, Online RFT, GRPO with outcome supervision and GRPO with process supervision. On GSM8K RFT stays lowest near 60, Online RFT near 62, GRPO with outcome rewards near 63 to 64 and with process rewards near 65; on MATH the two GRPO curves peak around step 4,000 and are interleaved later"></div>
</div>

<p class="footnote">Shao et al. 2024 · §5.2.1, Fig. 5, DeepSeekMath-Instruct 1.3B (not otherwise described). GSM8K: grade-school word problems; MATH: competition problems. Legend: GRPO+OS = outcome rewards, GRPO+PS = process (per-step) rewards. Readings by eye</p>

Note:
Optional. The closest the paper comes to a method comparison. All four start together. Three findings. Online beats offline: Online RFT "is comparable to RFT in the early stage of training but gains an absolute advantage in the later stage", because early on the policy and the SFT model are nearly the same model. Signed, graded weights beat 0/1: GRPO surpasses Online RFT. Step rewards beat answer rewards: clear on GSM8K, where process rewards end near 65 against 63 to 64. On MATH the GRPO curves peak near step 4,000 and then interleave, so that finding is not clear there.
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

<p class="footnote">Shao et al. 2024 · Fig. 7, temperature 0.7; GSM8K: grade-school word problems; MATH: competition problems. readings and gaps by eye (ours). Caption: "RL enhances Maj@K but not Pass@K." K = 1: Instruct GSM8K about 81.5 here vs 82.9 in Table 5 (different decoding)</p>

Note:
Prediction first: if RL only sharpens, the two Pass at K curves should meet at large K. Now the figure. Lower pair Maj at K, upper pair Pass at K, Instruct against RL, temperature 0.7. At K equals 1 both metrics are just accuracy, and RL is ahead by about 6.7 points on GSM8K and 6.4 on MATH. As K grows, the Maj gap shrinks to about 1.5 and 1.0, and the Pass curves meet: on MATH from K equals 16, and on GSM8K Instruct ends higher.
So check the caption against the figure: "RL enhances Maj@K but not Pass@K" is true for large K only, on both halves. A sharper reading of ours: Instruct gains 8.0 points on GSM8K and 15.3 on MATH by voting over 64 samples; RL, with one sample, recovers 84% and 42% of that. RL bakes much of the benefit of voting into a single sample. The paper's own reading, in bold: the improvement "seems" to come from "boosting the correct response from TopK rather than the enhancement of fundamental capabilities".

--

<p class="eyebrow"><span class="paper">Shao et al. 2024</span> · Later work · Yue et al. 2025</p>

## What happens at much larger K?

<div class="cols">
<div class="text">

- $k$ up to hundreds, many models and tasks
- small $k$: RL model ahead
- large $k$: base model ahead
- on the training set: pass@1 26.1 ▸ 42.5, pass@256 falls

</div>
<div class="text">

<p class="q"><b>Q.</b> Same comparison as DeepSeekMath?</p>
<p class="a"><b>A.</b> No: RL vs its base model, not vs Instruct</p>
<p class="q"><b>Q.</b> Verdict on §5.2.2?</p>
<p class="a"><b>A.</b> Confirmed and sharpened; still debated (ours)</p>

</div>
</div>

<p class="footnote">Yue et al. 2025, "Does Reinforcement Learning Really Incentivize Reasoning Capacity in LLMs Beyond the Base Model?", arXiv:2504.13837. RLVR: RL with verifiable rewards, from a checker. LLM: large language model. Six RL algorithms "perform similarly"</p>

Note:
Optional. Yue and colleagues push the paper's tentative finding to k in the hundreds, across model families, algorithms and tasks, for RL with verifiable rewards: "while RLVR-trained models outperform their base models at smaller values of k, base models achieve higher pass@k score when k is large". The boundary "often narrows as RLVR training progresses": in one run, pass at 1 on the training set rose from 26.1 to 42.5 while pass at 256 fell. Distillation from a stronger model, by contrast, can add new reasoning patterns.
One difference: they compare RL against the base model it started from; DeepSeekMath compared against Instruct. The paper's "it seems" became one of the central debates of 2025.

---

<p class="eyebrow"><span class="paper">Shao et al. 2024</span> · assessment</p>

## What does the paper actually establish?

<table class="rules">
  <tr><td>claim</td><td>status</td></tr>
  <tr><td>a big math corpus in Common Crawl</td><td>yes: 120.2B tokens, better per token at 1.3B</td></tr>
  <tr><td>7B matches Minerva 540B</td><td>on GSM8K and MATH; not OCW, MMLU-STEM</td></tr>
  <tr><td>code first helps; arXiv doesn't</td><td>at 1.3B, small gaps; arXiv with exceptions</td></tr>
  <tr><td>no value model needed</td><td>yes: every benchmark improves</td></tr>
  <tr><td>as good as PPO</td><td>not tested: no PPO run</td></tr>
  <tr><td>saves memory</td><td>asserted, never measured</td></tr>
  <tr><td>RL extends what can be solved</td><td>no: its own Fig. 7 says it sharpens</td></tr>
</table>

<p class="footnote">Our assessment against Shao et al. 2024 §2 to §5. The lasting contribution: a group-mean baseline is sufficient, not shown to be better</p>

Note:
At each level of trust. Established: a large, good math corpus can be mined from the web; a 7B model can match Minerva 540B on GSM8K and MATH; and a value model is unnecessary for RL on math, in the sense that GRPO without one improves every benchmark. Weaker: code-first and arXiv results rest on small gaps, mostly at 1.3B. Not tested: that GRPO is as good as PPO. Asserted, never measured: that it saves memory. And the paper's own Figure 7 says RL here sharpens rather than extends.
The strongest contribution, measured by what lasted, is the simplest: a group-mean baseline is good enough.

---

<p class="eyebrow"><span class="paper">Shao et al. 2024</span> · §6, §5.2.3 · limitations</p>

## What do the authors admit?

<div class="cols">
<div class="text">

<blockquote>"cannot handle problems related to triangles and ellipses, which may indicate data selection bias"</blockquote>

- worse than GPT-4 at few-shot
- arXiv result: "a grain of salt"

</div>
<div class="text">

<p class="q"><b>Q.</b> Why only Maj@K, in their view?</p>
<p class="a"><b>A.</b> SFT questions and "a naive nucleus sampling"</p>
<p class="q"><b>Q.</b> And the reward?</p>
<p class="a"><b>A.</b> Unreliable: even PRM800K is about 20% mislabelled</p>

</div>
</div>

<p class="footnote">Shao et al. 2024 · §6, §5.1.2, §5.2.3. PRM800K: OpenAI's step-level human labels on MATH solutions. Few-shot: "similar performance in zero-shot and few-shot evaluation"</p>

Note:
In their words. Geometry and theorem proving are weaker than closed models: "the model cannot handle problems related to triangles and ellipses, which may indicate data selection bias". A classifier seeded from one corpus is a plausible cause, though they don't connect the two. And "restricted by the model scale", it is worse than GPT-4 at few-shot: it performs the same zero-shot and few-shot. Recall GPT-3 earlier this week: that is striking: in-context examples don't help this model.
On RL, their own diagnosis: they used only the instruction-tuning questions and "a naive nucleus sampling", a "potential reason" RL only improved Maj@K. Every method "fully TRUST"s its reward, yet even PRM800K, a carefully annotated dataset, has about 20% wrong labels. Without a reward model that generalises, RL "may merely stabilize the distribution".

---

<p class="eyebrow"><span class="paper">Shao et al. 2024</span> · critique 1 · §4, §5.2.1</p>

## Where is the PPO baseline?

<div class="cols">
<div class="text">

- GRPO is sold as a cheaper PPO
- no PPO run on the same model and data
- Fig. 5: RFT and Online RFT only
- Table 5's PPO 7B models: other bases, data

</div>
<div class="text">

<p class="q"><b>Q.</b> Do they admit it?</p>
<p class="a"><b>A.</b> No: "efficient and effective", unqualified</p>
<p class="q"><b>Q.</b> Does it sink the argument?</p>
<p class="a"><b>A.</b> It sinks "as good as PPO"; it leaves "GRPO works at all", which Table 5 supports</p>

</div>
</div>

<p class="footnote">Our critique of Shao et al. 2024 §1.1, §4, §5.2.1. Later work below: DeepSeek-R1's supplement runs the comparison</p>

Note:
The paper introduces GRPO as a variant of PPO that is cheaper and works, but never trains PPO on the same model and data. Figure 5 compares GRPO with RFT and Online RFT. Table 5 does contain two PPO-trained 7B models, and both beat Instruct on GSM8K, but they have different base models, data and rewards, so they say nothing about the algorithm.
Do they admit it? No. Does it sink the argument? It sinks "GRPO is as good as PPO", which needs a PPO run. It leaves "GRPO works at all", which Table 5 supports. The comparison came a year later.

--

<p class="eyebrow"><span class="paper">Shao et al. 2024</span> · Later work · DeepSeek-AI 2025 (R1)</p>

## When someone finally ran PPO, what happened?

<div class="cols wide-fig">
<div class="text">

- MATH, a 16B mixture-of-experts model
- PPO, $\lambda$ = 0.95: about 0.501
- PPO, $\lambda$ = 1.0: about 0.536
- GRPO: about 0.555

<p class="q"><b>Q.</b> Why does $\lambda$ matter so much?</p>
<p class="a"><b>A.</b> At 0.95 the reward barely reaches early tokens (ours, untested there)</p>

</div>
<div class="fig"><img src="img/week-04-grpo-r1-ppo.png" alt="DeepSeek-R1 supplement figure: MATH accuracy against training steps up to about 2,400 for PPO with lambda 0.95, PPO with lambda 1.0 and GRPO. GRPO ends near 0.555, PPO with lambda 1.0 near 0.536, PPO with lambda 0.95 near 0.501"></div>
</div>

<p class="footnote">DeepSeek-AI 2025, DeepSeek-R1, arXiv:2501.12948, supplement, "Performance of PPO and GRPO on the MATH task"; DeepSeek-Coder-V2-Lite (2.4B active parameters). One run per setting, by GRPO's authors; the reading of $\lambda$ is ours, not R1's; values at about step 2,400 by eye</p>

Note:
Optional. DeepSeek-R1's supplement has the head-to-head. On MATH with a 16B mixture-of-experts model, PPO with the common lambda of 0.95 "performs considerably worse than GRPO"; with lambda 1.0, PPO "improves substantially, nearing that of GRPO". By eye at the end: 0.501, 0.536, 0.555.
Read it carefully: one run per setting, one model, two lambdas, by GRPO's own authors. Within that, GRPO wins. Our 0.95-to-the-495 slide explains why lambda is the knob: at 0.95 everything rides on the value model; at 1 the advantage is the final reward minus the value, the closest PPO gets to GRPO's score-the-whole-answer view.

---

<p class="eyebrow"><span class="paper">Shao et al. 2024</span> · critique 2 · §1, §6</p>

## Does GRPO really save memory?

<div class="cols">
<div class="text">

- "significantly reducing training resources"
- "less memory consumption"
- no number anywhere
- ours: 252 GB ▸ 140 GB at 7B

</div>
<div class="text">

<p class="q"><b>Q.</b> Do they admit it?</p>
<p class="a"><b>A.</b> No</p>
<p class="q"><b>Q.</b> Does it sink the argument?</p>
<p class="a"><b>A.</b> No, but 64 samples per question cost too</p>

</div>
</div>

<p class="footnote">Our critique. Shao et al. 2024 §1, Fig. 4 caption, §6. Our accounting excludes generation memory and time</p>

Note:
Three places claim the saving: the introduction, the Figure 4 caption and the conclusion. None gives a number. Removing a trained, policy-sized model plausibly saves a lot; our accounting says about 44% of training state at 7B.
But GRPO pays elsewhere. Sampling 64 answers per question, up to 1,024 tokens each, is a lot of generation, and generation memory and time are not in that accounting. Whether total cost goes down is an empirical question the paper never asks. It doesn't sink the method; it leaves the efficiency claim unmeasured.

---

<p class="eyebrow"><span class="paper">Shao et al. 2024</span> · critique 3 · §4.2, App. A.1.5</p>

## Is it still PPO if the clip never binds?

<div class="cols">
<div class="text">

- $\epsilon$ in Eq. 3, never given
- $\mu$ = 1: ratio is 1, clip inert
- reported run: REINFORCE + group baseline
- + std, length average, KL anchor

</div>
<div class="text">

<p class="q"><b>Q.</b> Do they admit it?</p>
<p class="a"><b>A.</b> Indirectly: App. A.1.5 drops the clip</p>
<p class="q"><b>Q.</b> Does it sink the argument?</p>
<p class="a"><b>A.</b> No: it changes what GRPO is here</p>

</div>
</div>

<p class="footnote">Our critique. Shao et al. 2024 §4.2 ("a single update following each exploration stage"), App. A.1.5. Later work below: R1 and DAPO, where the clip binds</p>

Note:
Epsilon appears in the objective but not in the recipe. With one update per sampled batch, the ratio is exactly 1 where the gradient is taken, and the clip never binds. The appendix removes the min and clip "to simplify the analysis" under exactly that assumption.
So the method in the reported run is closer to REINFORCE with a group baseline, plus the std, the length average and a KL anchor, than to PPO. That doesn't sink it; it changes what it is. Later systems took several updates per batch, so the clip binds, and both found that it helps to loosen it.

--

<p class="eyebrow"><span class="paper">Shao et al. 2024</span> · Later work · R1 2025; Yu et al. 2025 (DAPO)</p>

## What did later systems do with the clip?

<div class="cols">
<div class="text">

<table class="rules">
  <tr><td>DAPO, Qwen2.5-32B</td><td class="num">AIME 2024, avg@32</td></tr>
  <tr><td>R1-Zero-Qwen-32B (target)</td><td class="num">47</td></tr>
  <tr><td>naive GRPO</td><td class="num">30</td></tr>
  <tr><td>+ overlong filtering</td><td class="num">36</td></tr>
  <tr><td>+ Clip-Higher</td><td class="num">38</td></tr>
  <tr><td>+ soft overlong punishment</td><td class="num">41</td></tr>
  <tr><td>+ token-level loss</td><td class="num">42</td></tr>
  <tr><td>+ dynamic sampling (DAPO)</td><td class="num"><b>50</b></td></tr>
</table>

</div>
<div class="text">

- R1: $\epsilon$ = 10, a very loose clip
- DAPO: $\epsilon_{\rm low}$ 0.2, $\epsilon_{\rm high}$ 0.28
- at $\epsilon$ = 0.2, $p$ 0.01 can reach only 0.012
- drops prompts all right or all wrong
- token loss: divide by $\sum_i \lvert o_i\rvert$; no KL

</div>
</div>

<p class="footnote">Yu et al. 2025, DAPO, arXiv:2503.14476, Table 1 (avg@32: average over 32 samples; bold: the paper's); DeepSeek-AI 2025, arXiv:2501.12948, §2 (R1's first RL stage). <b>AIME</b>: a US high-school math competition. DAPO counts four techniques: the two overlong rows are one</p>

Note:
Optional. R1-Zero ran GRPO on DeepSeek-V3-Base with rule-based rewards, 16 answers per question, KL weight 0.001, and many updates per rollout, so the clip binds; its AIME 2024 pass at 1 rose from 15.6% to 77.9%. For R1 itself they set epsilon to 10: an interval from minus 9 to 11, so in effect a very loose clip, because a tight one "can lead to the truncation of gradients for a significant number of tokens".
DAPO, a 2025 set of repairs to GRPO for long answers, points the same way. Clip-Higher raises only the upper limit, to 0.28: at 0.2, a token with probability 0.01 can only grow to 0.012 per step. Dynamic sampling drops prompts whose answers are all right or all wrong, our zero-over-zero groups. The token-level loss divides by all tokens in the group, removing the length bias, and they drop the KL. Overlong filtering ignores the loss on answers cut off at the length limit; soft overlong punishment adds a graded penalty as an answer nears the limit (DAPO section 3.4). Step by step, naive GRPO's 30 becomes 50, above R1-Zero's 47.

---

<p class="eyebrow"><span class="paper">Shao et al. 2024</span> · critique 4 · §4.2, Fig. 6</p>

## Which model is in Table 5?

<div class="cols">
<div class="text">

- outcome or process rewards?
- one round or two?
- reward data "following" Math-Shepherd
- Fig. 6 MATH peak about 52.2 at step 4,700
- GSM8K there: about 87.5, not 88.2

</div>
<div class="text">

<p class="q"><b>Q.</b> Do they admit it?</p>
<p class="a"><b>A.</b> No</p>
<p class="q"><b>Q.</b> Does it sink the argument?</p>
<p class="a"><b>A.</b> No, but the headline can't be traced to one point in Fig. 6 (by eye)</p>

</div>
</div>

<p class="footnote">Our critique. Shao et al. 2024 §4.1.2 to §4.2, Table 5, Fig. 6 (by eye). Math-Shepherd builds process (per-step) labels, which suggests but doesn't state process supervision</p>

Note:
The paper describes three variants, outcome rewards, process rewards and iterative RL, and never says which produced the 7B model in Table 5. The reward model's training data follows Math-Shepherd, which suggests a process reward model, but that is an inference.
Figure 6 deepens the question: by eye, iteration 1's MATH curve peaks at about 52.2 near step 4,700, where its GSM8K is about 87.5, not Table 5's 88.2. No single point in the figure obviously gives both numbers. They may be different checkpoints. It doesn't sink the method, but the paper alone doesn't say which model the headline is.

---

<p class="eyebrow"><span class="paper">Shao et al. 2024</span> · critique 5 · §2.2, §5</p>

## Can one run per setting settle a 1-point gap?

<div class="cols">
<div class="text">

- no seeds, no error bars anywhere
- Fig. 5: 1.3B; headline: 7B
- code first, no tools: +0.9 to +2.8
- process vs outcome: clear on GSM8K only

</div>
<div class="text">

<p class="q"><b>Q.</b> Do they admit it?</p>
<p class="a"><b>A.</b> No</p>
<p class="q"><b>Q.</b> Does it sink the argument?</p>
<p class="a"><b>A.</b> Not the big effects; the small ones are unsettled</p>

</div>
</div>

<p class="footnote">Our critique. Large effects: corpus vs corpus, Instruct vs RL, code first with tools. Small: process vs outcome rewards, code vs general first without tools, round 2 vs round 1</p>

Note:
Every result in the paper is one run without error bars. The method comparison is at 1.3B while every headline is at 7B, and the code-first gains without tools are 1 to 3 points, about the size of the curves' own wiggle in Figure 5. Figure 5 also changes several things at once, so even a clean gap couldn't be attributed.
Do they admit it? No. Does it sink the argument? Not for the large effects: corpus against corpus, Instruct against RL, code first with tools. For the small ones, process against outcome rewards, round two against round one, we can't tell signal from noise.

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

<p class="eyebrow"><span class="paper">Shao et al. 2024</span> · what I'd ask the authors</p>

## What would convince us?

<div class="cols">
<div class="text">

<p class="q"><b>GRPO vs PPO</b></p>

- same model, questions, reward model
- count generation compute too
- PPO at $\lambda$ 0.95 and 1
- GRPO with and without std, length terms
- seeds, error bars, measured memory

</div>
<div class="text">

<p class="q"><b>Sharpen vs extend</b></p>

- Pass@K to K = 256 or more
- Base, Instruct and RL models
- held-out questions
- several temperatures

</div>
</div>

<p class="footnote">Our proposal, as a reviewer's ask</p>

Note:
Two experiments would settle the paper's two open claims. GRPO against PPO: same starting model, questions and reward model, compute matched including generation, so GRPO's 64 samples are paid for. PPO at lambda 0.95 and 1, GRPO with and without the std and length factors, several seeds, and measured memory and time.
Sharpening against new ability: Pass at K out to 256 or more, for the Base, Instruct and RL models, on held-out questions, at several temperatures. If RL's Pass at K at large K never exceeds the Base model's, RL sharpened; if it does, on questions the Base model never solves, RL taught something.

---

<p class="eyebrow"><span class="paper">Shao et al. 2024</span> · assessment</p>

## Why is this a strong paper?

<table class="rules">
  <tr><td>design choice</td><td>what it buys</td></tr>
  <tr><td>RL on GSM8K and MATH questions only</td><td>a built-in transfer test</td></tr>
  <tr><td>general text instead of code, stage 1</td><td>a real control for "code helps"</td></tr>
  <tr><td>comparison at 50B tokens</td><td>faces the repetition problem</td></tr>
  <tr><td>Fig. 7, Maj@K vs Pass@K</td><td>reports its own deflating finding</td></tr>
  <tr><td>Eq. 5, one gradient</td><td>a map of post-training methods</td></tr>
</table>

<p class="footnote">Our assessment of Shao et al. 2024 §2.2, §4.2, §5.1.1, §5.2</p>

Note:
The critiques are fair, but the paper does several things well. Its RL design trains on two benchmarks' questions and holds out the rest on purpose, so transfer is tested. Its code ablation has a real control. Its corpus comparison faces the repetition problem and offers a control.
And it writes down its own most deflating finding. Most method papers would have stopped at Table 5; this one ran Figure 7 and said, in bold, that RL seems to sharpen rather than extend. The unified paradigm is still the clearest way to read post-training papers.

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
  <tr><td>architecture or training: which does the work?</td><td>no swap is ablated at matched data</td></tr>
  <tr><td>what does PPO's clip actually do?</td><td>code details and the loss were never separated</td></tr>
  <tr class="total"><td>can RL extend what a model can solve?</td><td>at large K, base models solve more</td></tr>
</table>

<p class="footnote">Inference-time compute and reasoning models: later weeks</p>

Note:
Four questions the readings point to.
First, in-context learning. Later work splits it into task recognition, present at every size, and task learning, which grows with scale: only the largest models follow flipped labels. How it works inside is still open.
Second, architecture versus training. Raschka suspects the "secret sauce" is in the training pipeline; no swap in the survey is ablated with the data held fixed.
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
