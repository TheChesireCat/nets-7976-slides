<!-- .slide: id="week-08" class="cover week" -->

<h1>Week 8</h1>
<p class="subtitle">Reasoning in Large Language Models</p>

Note:
Reasoning: how a language model gets from a question to an answer in several steps. Seven readings, each walked in its own order: a survey as the map, then chain of thought, zero-shot chain of thought, self-consistency and its free-text version, ReAct, and DeepSeek-R1.


---

<p class="eyebrow"><span class="paper">Week 8</span> · overview · the readings</p>

## What will this week read, and what does each reading ask?

<div class="rows">

<table class="rules tight">
  <tr><td>reading</td><td>the question it asks</td></tr>
  <tr><td>Plaat et al. 2024 (survey)</td><td>what are the parts of a multi-step reasoning method?</td></tr>
  <tr><td>Wei et al. 2022</td><td>does showing worked examples make a model write out its reasoning, and does that help?</td></tr>
  <tr><td>Kojima et al. 2022</td><td>does one sentence, "Let's think step by step", do the same with no examples?</td></tr>
  <tr><td>Wang et al. 2022</td><td>does sampling many reasoning paths and voting beat one greedy path?</td></tr>
  <tr><td>Chen et al. 2023</td><td>how do we vote when the answers are free text?</td></tr>
  <tr><td>Yao et al. 2022 (ReAct)</td><td>does interleaving reasoning with actions, such as a search, help?</td></tr>
  <tr class="total"><td>DeepSeek-AI 2025 (R1)</td><td>can reinforcement learning on final answers alone teach a model to reason?</td></tr>
</table>

</div>

<p class="footnote">arXiv IDs: Plaat 2407.11511, Wei 2201.11903, Kojima 2205.11916, Wang 2203.11171, Chen 2311.17311, Yao 2210.03629, DeepSeek-R1 2501.12948. Years are first arXiv posting</p>

Note:
Seven readings, each in its own order. The survey by Plaat and colleagues comes first because it gives the vocabulary: a reasoning method generates steps, evaluates them, and controls which to pursue. Then the three prompting papers. Wei and colleagues show a large model a few worked examples and it writes out its reasoning; Kojima and colleagues get the same with one sentence and no examples; Wang and colleagues sample many reasoning paths and take the most common answer, and Chen and colleagues extend that vote to free-text answers. ReAct lets the model act between its thoughts, for example search Wikipedia. Last, DeepSeek-R1 trains reasoning in with reinforcement learning, rewarding only correct final answers and the right format. Week 6 ended on emergence; chain of thought was one of its examples, and we will see it again in Wei's Figure 4.


---


<!-- .slide: class="cover divider" -->

<p class="kicker">Reading 1 of 7</p>
<h1>Plaat et al. 2024</h1>
<p class="subtitle">Multi-Step Reasoning with Large Language Models, a Survey</p>
<p class="question">What are the parts of a reasoning method?</p>
<ol class="track" style="grid-template-columns: repeat(7, 1fr); gap: 12px"><li class="now">Plaat 2024<span>the map</span></li><li>Wei 2022<span>chain of thought</span></li><li>Kojima 2022<span>zero-shot</span></li><li>Wang 2022<span>self-consistency</span></li><li>Chen 2023<span>free-text vote</span></li><li>Yao 2022<span>reason and act</span></li><li>R1 2025<span>reinforcement learning</span></li></ol>

Note:
Reading 1 of 7. Plaat and colleagues at Leiden University, first posted in July 2024; we read the third version, from November 2025. It is a survey, so it is our map for the week. We go through it in its own order: the first page, then the three-stage taxonomy of Section 3 as a tree and as a table, with one optional slide on the benchmarks of Section 2.4.


---

<p class="eyebrow"><span class="paper">Plaat et al. 2024</span> · p. 1 · title and abstract</p>

## What does the survey set out to do?

<div class="cols wide-text">
<div class="fig"><img src="img/week-08-plaat-p1.png" alt="Page 1 of the survey: the title Multi-Step Reasoning with Large Language Models, a Survey, the six authors at Leiden University, and the abstract"></div>
<div class="text">

<p class="plain">It proposes a taxonomy of ways to generate, evaluate and control multi-step reasoning.</p>

</div>
</div>

<p class="footnote">Plaat et al. 2024, arXiv:2407.11511, v3, p. 1. Multi-step reasoning: answering by a chain of intermediate steps instead of in one go</p>

Note:
Read the abstract in three beats. First, language models with billions of parameters can learn from examples placed in the prompt, called in-context learning, but traditional models do not do well on basic reasoning benchmarks. Second, a new in-context approach, chain of thought, has shown strong multi-step reasoning on these benchmarks. Third, the survey reviews the field, starting from the question of whether models can solve grade school maths word problems, and it proposes a taxonomy that identifies different ways to generate, evaluate and control multi-step reasoning, plus open problems and a research agenda. Point at the three verbs in the abstract: generate, evaluate, control. The next slide is exactly that taxonomy. One thing to know: the survey says it focuses on prompt-based, in-context methods built on chain of thought, and that it picked papers from roughly the two years before writing.

---

<p class="eyebrow"><span class="paper">Plaat et al. 2024</span> · §3 · Fig. 1</p>

## How does the survey sort reasoning methods?

<div class="cols wide-fig" style="flex:1 1 auto; min-height:0">
<div class="text">

- <b>1. Generation:</b> how the steps are produced.
- <b>2. Evaluation:</b> how the steps are checked.
- <b>3. Control:</b> how the process moves from step to step.

</div>
<div class="fig"><img src="img/week-08-plaat-fig1-tax.png" alt="The survey's Figure 1, a tree. Generation: hand-written prompt (Scratchpad, Chain-of-Thought by Wei et al., ZS-CoT by Kojima et al.), model-generated prompt, prompt using external knowledge. Evaluation: self-assessment (Self-Verification, Self-Consistency by Wang et al.), tool-based evaluation, external model validation. Control: greedy selection, ensemble strategy (Self-Consistency among others), reinforcement learning (ReAct among others)"></div>
</div>

<p class="footnote">Plaat et al. 2024 · Fig. 1, "Taxonomy of LLM-Reasoning Approaches: Prompt Generation, Evaluation, and Control". Greedy: take one chain and follow it; ensemble: combine several chains</p>

Note:
This is the survey's Figure 1, and the one picture to keep from this reading. Every method has a generation, an evaluation and a control aspect, and the survey files each method under the aspect it changes most. Generation is how the prompt makes the model write steps: hand-written prompt, model-generated prompt, or a prompt using external knowledge. Evaluation is how steps or answers get checked: by the model itself, called self-assessment, by a tool such as an interpreter, or by an outside model. Control is how the process moves: greedy, meaning one chain followed straight through; an ensemble, meaning several chains combined; or what the survey calls reinforcement learning, meaning an outside loop that tries, evaluates and backs up. Now locate this week. Top right, hand-written prompt: Wei's chain of thought and Kojima's zero-shot chain of thought. Self-consistency, Wang, appears twice, under self-assessment and under ensemble. ReAct is filed at the bottom, under reinforcement learning. (Ours) The survey says the tree is not a partition, methods can appear in more than one place. Universal self-consistency, Chen, is not in the figure, and neither is DeepSeek-R1.

---

<p class="eyebrow"><span class="paper">Plaat et al. 2024</span> · §3 · Table 2</p>

## Where do this week's readings sit in the taxonomy?

<div class="rows">
<table class="rules tight" style="font-size:19px">
  <tr><td>Approach</td><td>Domain</td><td>(3.1) Step generation</td><td>(3.2) Step evaluation</td><td>(3.3) Step control</td></tr>
  <tr><td>Chain-of-thought [173]</td><td>math word</td><td><b>hand-written</b></td><td>-</td><td>greedy/1prompt</td></tr>
  <tr><td>ZS-CoT [75]</td><td>math word</td><td><b>hand-written</b></td><td>-</td><td>greedy/1prompt</td></tr>
  <tr><td>Self-consistency [170]</td><td>math word</td><td>hand-written</td><td><b>majority</b></td><td>ensemble</td></tr>
  <tr><td>ReAct [187]</td><td>action</td><td>external knowledge</td><td>self-assessment</td><td><b>reinf learning</b></td></tr>
</table>
<p class="plain">Wei, Kojima, Wang and Yao are rows. Chen and DeepSeek-R1 are not (ours).</p>
</div>

<p class="footnote">Plaat et al. 2024 · Table 2, "Taxonomy of approaches: Generation, Evaluation, and Control". Rows shown: 4 of 31; Result column left out; bold as printed. Numbers in brackets are the survey's reference numbers</p>

Note:
Table 2 is the taxonomy as a table: one row per method, with the domain it works on and one column each for generation, evaluation and control. The full table has 31 rows; we show the four that are this week's readings, with the cells exactly as printed. Chain of thought and zero-shot chain of thought look the same here: hand-written prompt, no evaluation, one prompt followed greedily. The survey says why in a footnote: chain of thought is about prompt generation, not about evaluating or controlling the steps. Self-consistency adds a majority vote as evaluation and an ensemble as control. ReAct is the odd one: external knowledge for generation and, in the control column, reinforcement learning. Two things that the survey does not contain: Chen's universal self-consistency is not a row, and DeepSeek-R1 appears only in the survey's prose, never as a row. (Ours, three cautions.) The survey says its Result column mixes absolute scores, marked with an equals sign, with gains over a baseline, marked with a plus, so do not read it as a leaderboard. The ZS-CoT row prints GSM8K 70 percent and MultiArith 89 percent, which are the numbers Kojima reports for PaLM 540B with a self-consistency vote, not for plain zero-shot chain of thought. And ReAct's printed ALFWorld 34 and WebShop 10 carry the survey's equals sign, meaning absolute score, but the ReAct abstract reports them as absolute gains in success rate over baselines; we check that in the ReAct reading.

--

<p class="eyebrow"><span class="paper">Plaat et al. 2024</span> · §2.4 · Table 1 · optional</p>

## What did chain of thought change on the maths benchmarks?

<div class="rows">
<table class="rules" style="font-size:22px">
  <tr><td>Benchmark</td><td>GPT-3 175B</td><td>Chain-of-thought [173]</td></tr>
  <tr><td>GSM8K</td><td>15.6</td><td>46.9</td></tr>
  <tr><td>ASDiv</td><td>70.3</td><td>71.3</td></tr>
  <tr><td>MAWPS</td><td>72.7</td><td>87.1</td></tr>
  <tr><td>SVAMP</td><td>65.7</td><td>68.9</td></tr>
  <tr><td>AQuA</td><td>24.8</td><td>35.8</td></tr>
</table>
</div>

<p class="footnote">Plaat et al. 2024 · Table 1, accuracy in percent. GSM8K: grade-school maths word problems (8,500); ASDiv: diverse maths word problems; MAWPS: a maths word problem repository; SVAMP: word problems with varied structure; AQuA: algebra word problems</p>

Note:
This is the survey's Table 1, in Section 2.4 on benchmarks. It is taken from the chain of thought paper, and it defines the benchmark names once for the week. GSM8K is the benchmark most associated with multi-step reasoning; the survey says it has 8,500 human-written problems and that models struggled on it before chain of thought. Point at GSM8K: 15.6 to 46.9, the big jump. Point at ASDiv and SVAMP: gains of about one and three points. The survey's own comment is that chain of thought does well on some benchmarks and there is room for improvement on others. (Ours) Notice that the table compares one model, GPT-3 175B, with and without chain of thought, using numbers the survey takes from Wei et al., so it is a recap of the next reading, not a new result.


---


<!-- .slide: class="cover divider" -->

<p class="kicker">Reading 2 of 7</p>
<h1>Wei et al. 2022</h1>
<p class="subtitle">Chain-of-Thought Prompting Elicits Reasoning in Large Language Models</p>
<p class="question">Does writing out the working make a model reason better?</p>
<ol class="track" style="grid-template-columns: repeat(7, 1fr); gap: 12px"><li class="done">Plaat 2024<span>the map</span></li><li class="now">Wei 2022<span>chain of thought</span></li><li>Kojima 2022<span>zero-shot</span></li><li>Wang 2022<span>self-consistency</span></li><li>Chen 2023<span>free-text vote</span></li><li>Yao 2022<span>reason and act</span></li><li>R1 2025<span>reinforcement learning</span></li></ol>

Note:
Reading 2 of 7. Wei and colleagues at Google Brain, 2022, a NeurIPS paper. It is short: an introduction, the method in one section, then arithmetic, commonsense and symbolic experiments, a discussion that holds the limitations, and long appendices. We go through it in that order, and the appendix material is optional sub-slides.

---

<p class="eyebrow"><span class="paper">Wei et al. 2022</span> · p. 1 · title and abstract</p>

## What does the chain-of-thought paper claim?

<div class="cols wide-text">
<div class="fig"><img src="img/week-08-wei-p1.png" alt="Page 1 of the paper: the title Chain-of-Thought Prompting Elicits Reasoning in Large Language Models, nine authors from Google Research Brain Team, and the abstract"></div>
<div class="text">

<p class="plain">A few worked examples with the reasoning written out make large models solve harder problems. PaLM 540B with eight of them sets a new best on GSM8K.</p>

</div>
</div>

<p class="footnote">Wei et al. 2022, "Chain-of-Thought Prompting Elicits Reasoning in Large Language Models", arXiv:2201.11903, p. 1. GSM8K: grade-school maths word problems. PaLM: Google's language model, 540 billion parameters at its largest</p>

Note:
The abstract in one breath. The paper defines a chain of thought as a series of intermediate reasoning steps, and chain-of-thought prompting as giving a few chain of thought demonstrations as exemplars in the prompt. The claim has two halves. First, the reasoning ability emerges naturally in sufficiently large language models, so scale matters. Second, the gains can be striking: prompting a PaLM 540B with just eight chain-of-thought exemplars gives state-of-the-art accuracy on the GSM8K benchmark of math word problems, surpassing even a finetuned GPT-3 with a verifier. Nothing is trained: the model is only prompted. Three large language models are tested in the abstract, and the experiments cover arithmetic, commonsense and symbolic reasoning. Hold on to "sufficiently large": the scale slide checks it.

---

<p class="eyebrow"><span class="paper">Wei et al. 2022</span> · §1 · Fig. 1</p>

## What is the difference between standard and chain-of-thought prompting?

<div class="rows">
<div class="fig"><img src="img/week-08-wei-fig1-prompts.png" alt="Wei et al. Figure 1: on the left, standard prompting shows the question and answer 'The answer is 11' for a tennis ball problem, and the model answers 27 for the apple problem, marked wrong; on the right, the example answer includes the highlighted reasoning, and the model's output works through 23 - 20 = 3 and 3 + 6 = 9, marked right"></div>
<p class="plain">The only change: the example answer shows its working, and the model copies the habit.</p>
</div>

<p class="footnote">Wei et al. 2022 · Fig. 1. Chain-of-thought reasoning is highlighted in colour. The cafeteria problem is the test question; the tennis ball problem is the in-prompt example</p>

Note:
Figure 1 is the whole method, so spend a minute on it. Both columns have the same prompt shape: one worked example, then a new question. On the left, standard prompting, the worked example's answer is just "The answer is 11", and for the cafeteria apples question the model answers 27, which is wrong. On the right, the worked example's answer is written out in the highlighted blue text: Roger started with 5 balls, 2 cans of 3 is 6, 5 plus 6 is 11. Given that, the model writes its own working in green: 23 minus 20 is 3, plus 6 is 9, and gets 9, which is right. Notice the paper's own framing in §1: prompts are triples of input, chain of thought and output, instead of input and output pairs. The tennis ball example is for the figure; it is not one of the eight exemplars used in the experiments (ours, checked against the appendix prompt).

---

<p class="eyebrow"><span class="paper">Wei et al. 2022</span> · §2 · the four properties</p>

## Why would a chain of thought help?

<div class="rows">
<div class="text">

<ol style="font-size:28px; line-height:1.35; margin:0; padding-left:1.2em">
<li style="margin-bottom:16px">It lets the model split a multi-step problem into steps, so more computation goes to harder problems.</li>
<li style="margin-bottom:16px">It gives a window into how the model might have reached an answer, and where the reasoning went wrong.</li>
<li style="margin-bottom:16px">It works for maths, commonsense and symbol tasks: in principle any task people solve with language.</li>
<li>It can be elicited in a sufficiently large off-the-shelf model by putting examples in the prompt.</li>
</ol>

</div>
</div>

<p class="footnote">Wei et al. 2022 · §2, the paper's list of attractive properties, shortened</p>

Note:
This is §2's list, in the paper's own order, shortened. One: decomposition. Additional computation can be given to problems that need more steps. Two: an interpretable window into the behaviour of the model. The paper adds a caution in brackets that fully characterising what the network computes is still open. Three: it is not specific to maths; it is potentially applicable, at least in principle, to any task humans can solve through language. Four: it needs no training, only examples placed in the few-shot prompt. Keep these four in mind: the ablation bears on the first, the limitations section on the second, the commonsense and symbolic sections on the third, and the scale figure on the fourth (our mapping, ours).

---

<p class="eyebrow"><span class="paper">Wei et al. 2022</span> · §3.1 · experimental setup</p>

## What exactly did the authors prompt, and on what?

<div class="cols wide-text">
<div class="text">

<div class="task"><span class="k">One of the eight exemplars (Appendix Table 20)</span>Q: There were nine computers in the server room. Five more computers were installed each day, from monday to thursday. How many computers are now in the server room?<br>A: <mark>There were originally 9 computers. For each of 4 days, 5 more computers were added. So 5 * 4 = 20 computers were added. 9 + 20 is 29.</mark> The answer is 29.</div>

</div>
<div class="text">

- Five maths benchmarks: GSM8K, SVAMP, ASDiv, AQuA, MAWPS.
- One set of eight hand-written exemplars for all but AQuA, which uses four.
- Five models: GPT-3, LaMDA, PaLM, UL2 20B, Codex. Greedy decoding.

</div>
</div>

<p class="footnote">Wei et al. 2022 · §3.1. GSM8K: grade-school maths word problems. SVAMP: word problems with varying structure. ASDiv: diverse maths word problems. AQuA: algebra word problems, multiple choice. MAWPS: a repository of maths word problems</p>

Note:
Read the exemplar on the left: it is one of the eight, from the appendix prompt. The question, then an answer that writes the steps in plain sentences, then "The answer is 29". The highlight marks the chain of thought. The paper composed these eight by hand, took the questions from a training set, and says the exemplars did not undergo prompt engineering. They are used for every benchmark except AQuA, which is multiple choice, so it gets four exemplars from its own training set. The baseline is standard few-shot prompting: the same questions, answers only. The models are GPT-3 from 350M to 175B, LaMDA from 422M to 137B, PaLM at 8B, 62B and 540B, UL2 20B and Codex. Decoding is greedy, one sample, which matters for the next paper in this set, and LaMDA numbers average five orderings of the exemplars.

---

<p class="eyebrow"><span class="paper">Wei et al. 2022</span> · §3.2 · Fig. 4</p>

## Does chain of thought help at every model size?

<div class="cols wide-fig">
<div class="text">

<p class="plain">No. It helps only at about 100B parameters and up; below that it can hurt.</p>

<p class="plain">Gains are larger on harder problems: GSM8K more than doubles for the largest GPT and PaLM models.</p>

</div>
<div class="fig"><img src="img/week-08-wei-fig4-scale.png" alt="Wei et al. Figure 4: solve rate against model scale in billions of parameters for LaMDA, GPT and PaLM on GSM8K, SVAMP and MAWPS; chain of thought is flat or below standard prompting for small models and rises steeply above them, crossing the orange prior supervised best line for PaLM 540B on GSM8K"></div>
</div>

<p class="footnote">Wei et al. 2022 · §3.2, Fig. 4. Solve rate: percent of problems answered correctly. GSM8K: grade-school maths word problems. SVAMP: word problems with varying structure. MAWPS: a repository of maths word problems</p>

Note:
Each row is a benchmark and each column a model family; black is standard prompting, blue is chain of thought, the orange dashed line is the prior best from a supervised model. Look at the left side of every panel: for the small models the blue line sits on or below the black one. The paper says chain-of-thought prompting is an emergent ability of model scale and does not help until models reach about 100B parameters; smaller models wrote fluent but illogical chains. This is the emergence idea from Week 6. Be careful with the word: the paper's own appendix adds that model scale is often conflated with other factors such as training compute, so "size" here is a proxy. Now look at the top-right panel: PaLM 540B on GSM8K goes from 17.9 to 56.9 and passes the orange line, a new best. SVAMP and MAWPS are also new bests for PaLM 540B, though the paper notes that standard prompting already passed the prior best on SVAMP. On AQuA and ASDiv, PaLM with chain of thought comes within 2% of the state of the art.

--

<p class="eyebrow"><span class="paper">Wei et al. 2022</span> · App. B · Table 2 · optional</p>

## What are the numbers behind Fig. 4?

<div class="rows">
<table class="rules tight" style="font-size:15px">
  <tr><td>model</td><td>size</td><td colspan="2">GSM8K</td><td colspan="2">SVAMP</td><td colspan="2">ASDiv</td><td colspan="2">AQuA</td><td colspan="2">MAWPS</td></tr>
  <tr style="font-size:13px; color:#555"><td></td><td></td><td>standard</td><td>CoT</td><td>standard</td><td>CoT</td><td>standard</td><td>CoT</td><td>standard</td><td>CoT</td><td>standard</td><td>CoT</td></tr>
  <tr><td>LaMDA</td><td>420M</td><td>2.6</td><td>0.4</td><td>2.5</td><td>1.6</td><td>3.2</td><td>0.8</td><td>23.5</td><td>8.3</td><td>3.2</td><td>0.9</td></tr>
  <tr><td></td><td>2B</td><td>3.6</td><td>1.9</td><td>3.3</td><td>2.4</td><td>4.1</td><td>3.8</td><td>22.9</td><td>17.7</td><td>3.9</td><td>3.1</td></tr>
  <tr><td></td><td>8B</td><td>3.2</td><td>1.6</td><td>4.3</td><td>3.4</td><td>5.9</td><td>5.0</td><td>22.8</td><td>18.6</td><td>5.3</td><td>4.8</td></tr>
  <tr><td></td><td>68B</td><td>5.7</td><td><b>8.2</b></td><td>13.6</td><td><b>18.8</b></td><td>21.8</td><td><b>23.1</b></td><td>22.3</td><td>20.2</td><td>21.6</td><td><b>30.6</b></td></tr>
  <tr><td></td><td>137B</td><td>6.5</td><td><b>14.3</b></td><td>29.5</td><td><b>37.5</b></td><td>40.1</td><td><b>46.6</b></td><td>25.5</td><td>20.6</td><td>43.2</td><td><b>57.9</b></td></tr>
  <tr><td>PaLM</td><td>8B</td><td>4.9</td><td>4.1</td><td>15.1</td><td><b>16.8</b></td><td>23.7</td><td><b>25.2</b></td><td>19.3</td><td><b>21.7</b></td><td>26.2</td><td><b>30.5</b></td></tr>
  <tr><td></td><td>62B</td><td>9.6</td><td><b>29.9</b></td><td>48.2</td><td>46.7</td><td>58.7</td><td><b>61.9</b></td><td>25.6</td><td>22.4</td><td>61.8</td><td><b>80.3</b></td></tr>
  <tr class="total"><td></td><td>540B</td><td>17.9</td><td><b>56.9</b></td><td>69.4</td><td><b>79.0</b></td><td>72.1</td><td><b>73.9</b></td><td>25.2</td><td><b>35.8</b></td><td>79.2</td><td><b>93.3</b></td></tr>
</table>
<p class="plain">Bold: chain of thought (CoT) beats standard prompting. LaMDA loses almost everywhere below 68B.</p>
</div>

<p class="footnote">Wei et al. 2022 · App. B, Table 2; rows shown: LaMDA and PaLM (the paper also lists GPT, UL2 and Codex). AQuA: algebra word problems. Week 6 showed 20.7 from the emergent-abilities paper's figure, not this table</p>

Note:
Optional. This is Table 2 in the appendix, the raw numbers behind Fig. 4; bold marks where chain of thought beats standard prompting, as the paper's green does. Read the LaMDA GSM8K column: 2.6 against 0.4 at 420M, then 8.2 against 5.7 at 68B and 14.3 against 6.5 at 137B. So for LaMDA the sign flips only between 8B and 68B. A note on Week 6: that deck showed 20.7 and 11.8 for LaMDA. Those come from the emergent-abilities paper's figure, which is a different evaluation, not from this paper; this paper prints 6.5 and 14.3 for the 137B and 5.7 and 8.2 for the 68B. Also notice AQuA: chain of thought is worse for LaMDA at every size and for PaLM 62B, so "bigger is better" is not uniform (ours). The paper's text says 422M for the smallest LaMDA while the table prints 420M.

---

<p class="eyebrow"><span class="paper">Wei et al. 2022</span> · §3.3 · Fig. 5</p>

## Is it the equation, the extra computation, or the reasoning?

<div class="cols wide-fig">
<div class="text">

<p class="plain">Equation only, a row of dots, or the reasoning placed after the answer: each stays near standard prompting.</p>

<p class="plain">The natural-language steps before the answer are what matter.</p>

</div>
<div class="fig"><img src="img/week-08-wei-fig5-ablation.png" alt="Wei et al. Figure 5: GSM8K solve rate for LaMDA 137B and PaLM 540B under standard prompting, equation only, variable compute only, reasoning after answer, and chain-of-thought prompting; only chain of thought is clearly higher, 14.8 for LaMDA and 56.5 for PaLM"></div>
</div>

<p class="footnote">Wei et al. 2022 · §3.3, Fig. 5. GSM8K: grade-school maths word problems; solve rate is percent correct. Variable compute only: the model outputs as many dots as the equation has characters</p>

Note:
Three rivals to the paper's explanation. Equation only: the model writes just the equation before the answer. It does not help much on GSM8K, which the authors read as the questions being too semantic to turn into one equation without the natural-language steps; on one- and two-step datasets it helps more. Variable compute only: the model writes a string of dots as long as the equation, to give it extra tokens to compute with. It performs about the same as the baseline, so extra tokens alone are not the reason. Reasoning after the answer: the chain is written after the answer, to test whether it merely activates knowledge. Again about the baseline, so the order matters. The bars for LaMDA are 6.3, 5.7, 6.0, 5.9 and 14.8; for PaLM 17.9, 21.7, 17.7, 18.0 and 56.5. PaLM's equation-only bar is a few points above baseline (ours).

---

<p class="eyebrow"><span class="paper">Wei et al. 2022</span> · §3.4 · Fig. 6</p>

## Does it depend on who wrote the chains of thought?

<div class="cols wide-fig">
<div class="text">

<p class="plain">No. Other annotators, a concise style and exemplars from the GSM8K training set all beat standard prompting.</p>

<p class="plain">But the spread is real: on GSM8K, 11.1 to 17.6.</p>

</div>
<div class="fig"><img src="img/week-08-wei-fig6-robustness.png" alt="Wei et al. Figure 6: LaMDA 137B solve rate on GSM8K and MAWPS for standard prompting, the original chain of thought, annotators B and C, a concise style, and three exemplar sets from the GSM8K training set; all chain-of-thought variants are well above standard"></div>
</div>

<p class="footnote">Wei et al. 2022 · §3.4, Fig. 6, LaMDA 137B. GSM8K: grade-school maths word problems. MAWPS: a repository of maths word problems. Annotator A wrote the original chains; B and C are two co-authors</p>

Note:
The worry is that the result is one author's writing style. So two other co-authors, annotators B and C, wrote their own chains for the same questions, and annotator A also wrote a more concise version. Separately, three sets of eight exemplars were sampled from the GSM8K training set, which has worker-written reasoning. On GSM8K with LaMDA 137B, standard is 6.5, the original chain 14.3, B 15.5, C 17.6, concise 11.1, and the three sampled sets 13.2, 13.3 and 12.8. On MAWPS, standard is 43.2 and the variants run from 54.1 to 61.1. The paper's conclusion: success does not depend on a particular linguistic style. Our reading (ours): the annotators are co-authors of the paper, not independent people, and in this figure all variants are tested on one model, LaMDA 137B. The appendix adds that prompt engineering still matters, with coin flip ranging from 99.6 to 71.4 across annotators.

---

<p class="eyebrow"><span class="paper">Wei et al. 2022</span> · §4 · Fig. 7</p>

## Does it work beyond maths, on commonsense questions?

<div class="rows">
<div class="fig"><img src="img/week-08-wei-fig7-commonsense.png" alt="Wei et al. Figure 7: PaLM solve rate at 8B, 62B and 540B on CSQA, StrategyQA, Date, Sports and SayCan; chain of thought is above standard prompting at 540B on all five and the gain is small on CSQA; on StrategyQA PaLM 540B passes the prior supervised best and on Sports it passes the human line"></div>
<p class="plain">Gains on all five at PaLM 540B; minimal on CSQA. StrategyQA 75.6 (text) against a prior best of 69.4.</p>
</div>

<p class="footnote">Wei et al. 2022 · §4, Fig. 7. CSQA: commonsense questions about the world. StrategyQA: multi-hop yes/no questions. Date: infer a date from context. Sports: is a sports sentence plausible. SayCan: map an instruction to robot actions</p>

Note:
Section 4 changes the task type: five commonsense datasets, shown for PaLM at 8B, 62B and 540B. CSQA asks commonsense questions about the world, StrategyQA needs a multi-hop strategy, Date and Sports come from the BIG-bench collection, and SayCan maps a natural-language instruction to a sequence of robot actions. The prompts follow the same recipe: chains of thought written by hand for a handful of exemplars. Point at the blue line against the black one in each panel. Scaling up improves standard prompting on every task, and chain of thought adds further gains that the paper says appear largest at 540B (not quite so for Sports, where 62B gains more, ours). On StrategyQA, the paper's text says PaLM 540B reaches 75.6 against a prior best of 69.4 (the appendix table prints 77.8 for the same cell, ours), and on sports understanding 95.4 against an unaided sports enthusiast at 84. On CSQA the two lines are almost on top of each other at 540B. The appendix notes chain of thought did not help GPT-3 on CSQA and StrategyQA.

---

<p class="eyebrow"><span class="paper">Wei et al. 2022</span> · §5 · Fig. 8</p>

## Can it solve longer problems than its examples showed?

<div class="cols wide-fig">
<div class="text">

<p class="plain">Examples had 2 steps; tests also had 3 or 4 words or flips. Standard prompting fails on the longer ones; chain of thought rises with scale.</p>

</div>
<div class="fig"><img src="img/week-08-wei-fig8-symbolic.png" alt="Wei et al. Figure 8: PaLM solve rate at 8B, 62B and 540B for last letter concatenation and coin flip, with 2 steps in domain and 4 steps out of domain; chain of thought climbs towards 100 percent in domain and to about 63 and 90 percent out of domain, while standard prompting stays near zero on letters out of domain"></div>
</div>

<p class="footnote">Wei et al. 2022 · §5, Fig. 8. Last letter concatenation: join the last letters of a name's words. Coin flip: is the coin still heads up after people flip or do not flip it. OOD: out of domain</p>

Note:
Two toy tasks. Last letter concatenation: given a name like Amy Brown, output the last letters, yn. Coin flip: after a series of people flip or do not flip a coin, is it still heads up? The exemplars only show two-word names and two flips. The in-domain test has the same length; the out-of-domain test, OOD, has names of 3 and 4 words and more flips. Top row, letters: in domain, PaLM 540B with chain of thought is near 100 and standard prompting is near zero. Out of domain, the blue line rises with scale, to about 63 at 540B on four words, while standard stays flat at the bottom. Coin flip, bottom row: standard prompting already solves the in-domain case at 540B, about 98, but fails out of domain. The paper calls these toy tasks, because the exemplars already give the solution structure, yet small models still fail: the ability only arises around 100B.

---

<p class="eyebrow"><span class="paper">Wei et al. 2022</span> · §6 · discussion</p>

## What does the paper say it cannot show?

<div class="rows">
<div class="text">

- A chain of thought looks like human reasoning, but that does not show the network is reasoning.
- Writing chains by hand is cheap for prompts, but could be costly for finetuning.
- There is no guarantee the reasoning path is correct: right and wrong answers can both come from wrong paths.
- It appears only at large scale, so it is costly to serve.

</div>
</div>

<p class="footnote">Wei et al. 2022 · §6, the limitations paragraph, shortened</p>

Note:
These are the four limitations in §6, in the paper's order. First, the chain emulates how a person thinks, but whether the network is actually reasoning is left open. Second, annotation: hand-writing eight chains is cheap, but doing it for a finetuning set could be prohibitive; the authors suggest synthetic data or zero-shot generalisation, which is the next reading. Third, no guarantee of correct reasoning paths, which can lead to both correct and incorrect answers. Fourth, because it appears only at large scale, it is costly to serve in real applications, and further research could induce reasoning in smaller models. Notice the third point against the second slide: the "window into the model" property is real only if the chain reflects what happened. The paper does not test that directly beyond the small manual check in the appendix (ours).

--

<p class="eyebrow"><span class="paper">Wei et al. 2022</span> · App. D · optional</p>

## How many of the chains were actually correct?

<div class="rows">
<table class="rules" style="font-size:20px">
  <tr><td>50 LaMDA 137B samples on GSM8K</td><td>what the authors found</td></tr>
  <tr><td>answer correct</td><td>49 had correct logic and maths; 1 was correct by chance</td></tr>
  <tr><td>answer wrong: calculator error only</td><td>8%</td></tr>
  <tr><td>answer wrong: symbol mapping error</td><td>16%</td></tr>
  <tr><td>answer wrong: one step missing</td><td>22%</td></tr>
  <tr class="total"><td>answer wrong: needs substantial edits</td><td>54% (27 of 50), almost all semantic understanding errors</td></tr>
</table>
</div>

<p class="footnote">Wei et al. 2022 · App. D.1 and D.2. GSM8K: grade-school maths word problems. Calculator error: right reasoning, wrong arithmetic. Symbol mapping: right words, wrong numbers in the equation</p>

Note:
Optional. The authors read 50 chains where LaMDA 137B got the right answer: in 49 the logic and maths were correct, and one reached the right answer by chance. They then read 50 wrong answers and sorted them by what edit would make the chain correct. Eight percent needed only a calculator fix, and giving the model an external calculator did lift GSM8K from 14.3 to 17.3. Sixteen percent had a symbol mapping error, 22 percent were missing one step, and 54 percent, 27 of 50, needed substantial edits, mostly errors of semantic understanding, with 8 of those 27 incoherent. Two caveats (ours): the main text says all correct answers had correct chains except two, the appendix says one, and the table caption says seven imperfect cases while six are listed. The check is also easy for free-response maths; the appendix says multiple-choice and yes or no tasks are far more likely to be right by luck.

--

<p class="eyebrow"><span class="paper">Wei et al. 2022</span> · App. A · optional</p>

## When should I expect chain of thought to help my task?

<div class="rows">
<div class="text">

- It helps most when the task needs multi-step reasoning, the model is large, and the scaling curve is flat.
- It helps less when one or more of those fail: one- and two-step MAWPS subsets, where PaLM 540B is already at 90 or higher, gain little.
- Prompt engineering still matters: coin flip ranged from 99.6 to 71.4 across annotators, though both beat standard prompting at 50.0.

</div>
</div>

<p class="footnote">Wei et al. 2022 · App. A.2 and A.3, two FAQ answers. MAWPS: a repository of maths word problems. Coin flip: is the coin still heads up after people flip or do not flip it</p>

Note:
Optional. Two FAQ answers from Appendix A. On when it helps: from their experiments, the authors' intuition is that chain of thought helps the most when three conditions are met: the task is challenging and needs multi-step reasoning, a large model is used, and the scaling curve for standard prompting is relatively flat. The gain is largest for PaLM 540B on GSM8K, which meets all three, and small on the easy MAWPS subsets, where the model is already above 90 and there is little room. On prompt engineering: results are fairly robust for arithmetic, but they say plainly that prompt engineering still matters. Coin flip varied from 99.6 for annotator A to 71.4 for annotator C. They also report a task, reversing a list of five items, where two co-authors could not write a working chain and a third could. The intuition is stated as an intuition, not tested (ours).


---


<!-- .slide: class="cover divider" -->

<p class="kicker">Reading 3 of 7</p>
<h1>Kojima et al. 2022</h1>
<p class="subtitle">Large Language Models are Zero-Shot Reasoners</p>
<p class="question">Do we even need worked examples?</p>
<ol class="track" style="grid-template-columns: repeat(7, 1fr); gap: 12px"><li class="done">Plaat 2024<span>the map</span></li><li class="done">Wei 2022<span>chain of thought</span></li><li class="now">Kojima 2022<span>zero-shot</span></li><li>Wang 2022<span>self-consistency</span></li><li>Chen 2023<span>free-text vote</span></li><li>Yao 2022<span>reason and act</span></li><li>R1 2025<span>reinforcement learning</span></li></ol>

Note:
Reading 3 of 7. Kojima and colleagues at the University of Tokyo and Google Research, posted in May 2022, a few months after Wei et al. It is a short paper. We go through it in its own order: the introduction's Figure 1, the two-stage method of Section 3, and the results of Section 4.1.


---

<p class="eyebrow"><span class="paper">Kojima et al. 2022</span> · §1 · Fig. 1</p>

## Can one sentence replace the worked examples?

<div class="rows">
<div class="fig"><img src="img/week-08-kojima-fig1.png" alt="Kojima Figure 1, four panels on the juggler problem: (a) few-shot answers 8, wrong; (b) few-shot chain of thought reasons and answers 4, right; (c) zero-shot answers 8, wrong; (d) zero-shot chain of thought, with the added sentence Let's think step by step, reasons and answers 4, right"></div>
<p class="plain">Panel (d) has no examples, only the sentence "Let's think step by step."</p>
</div>

<p class="footnote">Kojima et al. 2022 · Fig. 1: GPT-3 with (a) few-shot, (b) few-shot chain of thought (CoT), (c) zero-shot, (d) zero-shot chain of thought. Zero-shot: no worked examples in the prompt</p>

Note:
Figure 1 is the whole paper. The same juggler question is asked four ways. Panel (a), top left, standard few-shot: one worked example with just an answer, and the model answers 8, which is wrong. Panel (b) is Wei's method: the worked example now includes the reasoning, and the model writes its own reasoning and reaches 4. Panel (c), bottom left, is the zero-shot baseline: no example, only the question and an answer prompt, and the model says 8. Panel (d) is this paper: no example, but the answer line starts with "Let's think step by step", the pink box, and the model writes the reasoning and reaches 4. The caption's claim is that the same sentence is used across all tasks, while few-shot chain of thought needs step-by-step examples for each task. (Ours) The slide shows one question and one model, so it illustrates the idea; the evidence is in the tables that follow.

---

<p class="eyebrow"><span class="paper">Kojima et al. 2022</span> · §3.1 · Fig. 2</p>

## How is the answer read out of the reasoning?

<div class="rows">
<div class="fig"><img src="img/week-08-kojima-fig2.png" alt="Kojima Figure 2: the first prompt, reasoning extraction, ends with A: Let's think step by step and the model writes the reasoning; the second prompt, answer extraction, repeats the question and the reasoning and ends with Therefore, the answer (arabic numerals) is, and the model writes 375"></div>
<p class="plain">Two calls: first the reasoning, then the answer.</p>
</div>

<p class="footnote">Kojima et al. 2022 · Fig. 2, "Full pipeline of Zero-shot-CoT". Greedy decoding: always take the most likely next word, so zero-shot results are deterministic</p>

Note:
Figure 2 is the method in full, and it uses the model twice. Left, the first prompt: the question in the form "Q: question. A:" followed by the trigger sentence, "Let's think step by step". The model writes the reasoning, here the Joe punches example, ending at 375. Right, the second prompt: the first prompt, plus the reasoning the model just wrote, plus a second trigger that asks for the answer in the right format, here "Therefore, the answer (arabic numerals) is". The model then writes 375. The paper uses a slightly different answer trigger depending on the answer format, for example "among A through E" for multiple choice, and it uses greedy decoding throughout. The paper's own summary of the trade: few-shot chain of thought needs careful human engineering of examples per task, zero-shot chain of thought needs less engineering but prompts the model twice. (Ours) So the one sentence is the same across tasks, but the answer trigger is not.

---

<p class="eyebrow"><span class="paper">Kojima et al. 2022</span> · §4.1 · Table 1</p>

## What does the sentence buy on 12 tasks?

<div class="rows">
<table class="rules tight" style="font-size:17px">
  <tr><td></td><td colspan="6"><b>Arithmetic</b></td></tr>
  <tr><td></td><td>SingleEq</td><td>AddSub</td><td>MultiArith</td><td>GSM8K</td><td>AQUA</td><td>SVAMP</td></tr>
  <tr><td>zero-shot</td><td>74.6/<b>78.7</b></td><td><b>72.2</b>/<b>77.0</b></td><td>17.7/22.7</td><td>10.4/12.5</td><td>22.4/22.4</td><td>58.8/58.7</td></tr>
  <tr><td>zero-shot-cot</td><td><b>78.0</b>/<b>78.7</b></td><td>69.6/74.7</td><td><b>78.7</b>/<b>79.3</b></td><td><b>40.7</b>/<b>40.5</b></td><td><b>33.5</b>/<b>31.9</b></td><td><b>62.1</b>/<b>63.7</b></td></tr>
</table>
<table class="rules tight" style="font-size:17px">
  <tr><td></td><td colspan="2"><b>Common Sense</b></td><td colspan="2"><b>Other Reasoning Tasks</b></td><td colspan="2"><b>Symbolic Reasoning</b></td></tr>
  <tr><td></td><td>CommonSenseQA</td><td>StrategyQA</td><td>Date Understand</td><td>Shuffled Objects</td><td>Last Letter (4 words)</td><td>Coin Flip (4 times)</td></tr>
  <tr><td>zero-shot</td><td><b>68.8</b>/<b>72.6</b></td><td>12.7/<b>54.3</b></td><td>49.3/33.6</td><td>31.3/29.7</td><td>0.2/-</td><td>12.8/53.8</td></tr>
  <tr><td>zero-shot-cot</td><td>64.6/64.0</td><td><b>54.8</b>/52.3</td><td><b>67.5</b>/<b>61.8</b></td><td><b>52.4</b>/<b>52.9</b></td><td><b>57.6</b>/-</td><td><b>91.4</b>/<b>87.8</b></td></tr>
</table>
</div>

<p class="footnote">Kojima et al. 2022 · Table 1, accuracy in percent; left of each slash: answer prompt per format, right: "The answer is". SingleEq to SVAMP: maths word problems; CommonsenseQA, StrategyQA: common sense; Date Understanding, Shuffled Objects: BIG-bench logic; Last Letter, Coin Flip: symbolic</p>

Note:
Table 1 compares plain zero-shot with zero-shot chain of thought on twelve tasks, using text-davinci-002, an instruction-tuned GPT-3. Each cell has two numbers: on the left, the answer-extraction prompt matched to the answer format; on the right, the plain "The answer is" prompt. Bold marks the better of the pair of rows, as printed. Point at the headline: MultiArith from 17.7 to 78.7 and GSM8K from 10.4 to 40.7. The paper says the method gives on-par results on SingleEq and AddSub, which do not need multiple steps, and that it helps on all the symbolic and logic tasks. On common sense it gives no gain, which the paper says is expected, since Wei's few-shot chain of thought also did not help LaMDA 135B there. (Ours) The zero-shot baseline itself moves a lot with the answer phrase: StrategyQA is 12.7 with one phrase and 54.3 with the other. Against the stronger baseline the StrategyQA result is 54.3 to 52.3, a small loss, so the headline gains lean on the weaker baseline. Forward pointer to the next paper: in the paper's Table 2, PaLM 540B with zero-shot chain of thought and a self-consistency vote reaches 70.1 on GSM8K, against 43.0 without the vote. That is Kojima's own number for zero-shot chain of thought with voting, and the next sub-slide shows it.

--

<p class="eyebrow"><span class="paper">Kojima et al. 2022</span> · §4.1 · Table 2 · optional</p>

## How close does zero-shot get to few-shot chain of thought?

<div class="rows">
<table class="rules" style="font-size:20px">
  <tr><td></td><td>MultiArith</td><td>GSM8K</td></tr>
  <tr><td>Zero-Shot</td><td>17.7</td><td>10.4</td></tr>
  <tr><td>Few-Shot (8 samples)</td><td>33.8</td><td>15.6</td></tr>
  <tr><td><b>Zero-Shot-CoT</b></td><td><b>78.7</b></td><td><b>40.7</b></td></tr>
  <tr><td>Few-Shot-CoT (8 samples)</td><td>93.0</td><td>48.7</td></tr>
  <tr><td><b>PaLM 540B: Zero-Shot-CoT</b></td><td><b>66.1</b></td><td><b>43.0</b></td></tr>
  <tr><td><b>PaLM 540B: Zero-Shot-CoT + self consistency</b></td><td><b>89.0</b></td><td><b>70.1</b></td></tr>
  <tr><td>PaLM 540B: Few-Shot-CoT [Wei et al.]</td><td>-</td><td>56.9</td></tr>
  <tr><td>PaLM 540B: Few-Shot-CoT + self consistency [Wang et al.]</td><td>-</td><td>74.4</td></tr>
</table>
</div>

<p class="footnote">Kojima et al. 2022 · Table 2, accuracy in percent; text-davinci-002 unless PaLM is named. Rows shown: 8 of 17. MultiArith: multi-step maths word problems; GSM8K: grade-school maths word problems</p>

Note:
This is Table 2 of the paper, with eight of its seventeen rows. On text-davinci-002, zero-shot chain of thought scores 78.7 and 40.7, below few-shot chain of thought with eight examples at 93.0 and 48.7, and far above standard few-shot with eight examples at 33.8 and 15.6. The paper says exactly this in the introduction: it underperforms few-shot chain of thought with carefully crafted examples, but gains enormously over zero-shot. The bottom block is PaLM 540B: zero-shot chain of thought scores 43.0 on GSM8K, and with a self-consistency vote it reaches 70.1, which is Kojima's own zero-shot chain of thought with voting figure. Wei's few-shot chain of thought on the same model is 56.9, and with Wang's vote 74.4. (Ours) Note the introduction quotes Wei's PaLM figure as 58.1, while the paper's own tables print 56.9, so use 56.9. Wang's self-consistency, the reading after next, is the vote in these rows. The survey's Table 2 prints GSM8K 70 percent in the zero-shot chain of thought row, which is this voting number.


---


<!-- .slide: class="cover divider" -->

<p class="kicker">Reading 4 of 7</p>
<h1>Wang et al. 2022</h1>
<p class="subtitle">Self-Consistency Improves Chain of Thought Reasoning in Language Models</p>
<p class="question">Is one chain enough, or should we sample many and vote?</p>
<ol class="track" style="grid-template-columns: repeat(7, 1fr); gap: 12px"><li class="done">Plaat 2024<span>the map</span></li><li class="done">Wei 2022<span>chain of thought</span></li><li class="done">Kojima 2022<span>zero-shot</span></li><li class="now">Wang 2022<span>self-consistency</span></li><li>Chen 2023<span>free-text vote</span></li><li>Yao 2022<span>reason and act</span></li><li>R1 2025<span>reinforcement learning</span></li></ol>

Note:
Reading 4 of 7. Wang and colleagues at Google Research, Brain Team, posted this in March 2022; the version we use is the ICLR 2023 one. It builds directly on the chain-of-thought paper and the zero-shot one we just read. The paper is short and runs in this order: the abstract and introduction with one overview figure, the method in Section 2, the experiments in Section 3 (setup, main results, a study where chain of thought hurts, comparisons with other approaches, and additional studies), then related work and a short conclusion. We walk it in that order, and the optional slides hang below the main ones.

---

<p class="eyebrow"><span class="paper">Wang et al. 2022</span> · p. 1 · title and abstract</p>

## What does the self-consistency paper claim?

<div class="cols wide-text">
<div class="fig"><img src="img/week-08-wang-p1.png" alt="Page 1 of the self-consistency paper: the title, eight authors from Google Research Brain Team, and the abstract with gains on five benchmarks"></div>
<div class="text">

<p class="plain">Sample several reasoning paths instead of one greedy path, then take the most consistent answer.</p>

</div>
</div>

<p class="footnote">Wang et al. 2022, "Self-Consistency Improves Chain of Thought Reasoning in Language Models", arXiv:2203.11171, p. 1. GSM8K: grade-school maths word problems; SVAMP, AQuA: more maths word problems; StrategyQA: yes or no questions needing several steps; ARC-challenge: hard school science questions</p>

Note:
The abstract in one breath. Chain-of-thought prompting works, but it is decoded greedily, one path per question. The paper proposes a new decoding strategy, self-consistency, to replace that greedy decoding. It first samples a diverse set of reasoning paths instead of only taking the greedy one, and then selects the most consistent answer by marginalizing out the sampled paths. The intuition is that a hard problem can be solved in several ways that all lead to the same unique correct answer. The abstract names five gains: GSM8K plus 17.9, SVAMP plus 11.0, AQuA plus 12.2, StrategyQA plus 6.4 and ARC-challenge plus 3.9 percentage points. Keep them in mind: when we reach the tables we will see which model they come from. (Ours: all five are the code-davinci-002 rows, which the abstract does not say.)

---

<p class="eyebrow"><span class="paper">Wang et al. 2022</span> · §1 · Fig. 1</p>

## What does self-consistency do differently from greedy decoding?

<div class="rows">
<div class="fig"><img src="img/week-08-wang-fig1-method.png" alt="Wang et al. Figure 1: chain-of-thought prompting with greedy decoding gives the answer 14 dollars, wrong; self-consistency samples three reasoning paths giving 18, 26 and 18 dollars and aggregates them to the answer 18 dollars"></div>
<p class="plain">Greedy decoding keeps one path. Self-consistency samples several and keeps the answer most of them reach.</p>
</div>

<p class="footnote">Wang et al. 2022 · Fig. 1. <b>Greedy decoding</b>: always take the single most likely next token</p>

Note:
Figure 1 is the whole method. The top row is ordinary chain-of-thought prompting: the model decodes greedily, writes one path, and answers 14 dollars, which is wrong. The bottom row uses the same prompt, the same question about Janet's ducks and the same model, but samples a diverse set of reasoning paths. The paper's figure shows three: two reach 18 dollars, one reaches 26. The last step, marginalize out the reasoning paths, means we ignore how each path got there and just aggregate the final answers. The most consistent answer, 18 dollars, wins. The paper's caption names three steps: prompt with chain of thought, sample instead of greedy decode, aggregate by choosing the most consistent answer. No training and no extra model are involved, which the introduction stresses against trained verifiers and re-rankers.

---

<p class="eyebrow"><span class="paper">Wang et al. 2022</span> · §2 · the aggregation rule</p>

## How does the paper pick the answer?

<div class="rows">
<div class="eq">$$\arg\max_a\sum\nolimits_{i=1}^m \mathbb{1} (\mathbf{a}_i = a)$$</div>

<dl class="where">
<dt>$m$</dt><dd>the number of reasoning paths sampled from the decoder</dd>
<dt>$\mathbf{a}_i$</dt><dd>the final answer read off the $i$-th sampled output</dd>
<dt>$a$</dt><dd>a candidate answer, from the fixed set of possible answers</dd>
<dt>$\mathbb{1}(\cdot)$</dt><dd>1 if the statement inside is true, 0 otherwise</dd>
</dl>

<p class="plain">Count the votes for each answer; the answer with the most votes wins.</p>
</div>

<p class="footnote">Wang et al. 2022 · §2, written in the text as a majority vote over $\mathbf{a}_i$, the most 'consistent' answer among the final answer set; it has no equation number</p>

Note:
This is the paper's own rule, written in the text of Section 2 without an equation number. Each sampled output has two parts: a reasoning path and an answer. The paper treats the path as a latent variable, hidden, used only to reach the answer, and applies a marginalization over it by taking a majority vote over the answers. In practice a parser reads the number after "The answer is". Count how many sampled outputs give each answer and take the biggest count. One thing to say once: this vote has other names in the course. It is maj at k in Week 4 and in the Mixtral paper, and cons at k in the R1 paper later today. Same rule, three names. The printed paper never says how ties are broken. (Ours: the usual reading of marginalization is that the share of samples ending in an answer estimates that answer's probability, summed over all paths.)

--

<p class="eyebrow"><span class="paper">Wang et al. 2022</span> · §2 · the probability weights · optional</p>

## What would a probability-weighted vote use?

<div class="rows">
<div class="eq">$$P(\mathbf{r}_i, \mathbf{a}_i \mid \text{prompt}, \text{question}) = \exp^{\frac{1}{K}\sum_{k=1}^K {\log P(t_k \mid \text{prompt}, \text{question}, t_1, \ldots, t_{k-1})}}$$</div>

<dl class="where">
<dt>$\mathbf{r}_i$, $\mathbf{a}_i$</dt><dd>the reasoning path and the answer of the $i$-th sampled output</dd>
<dt>$t_k$, $K$</dt><dd>the $k$-th token of that output, and the total number of tokens in it</dd>
<dt>$P(t_k \mid \ldots)$</dt><dd>the probability the model gives that token, given the prompt, question and earlier tokens</dd>
</dl>

<p class="plain">The probability of the whole output, divided by its length: a per-token average.</p>
</div>

<p class="footnote">Wang et al. 2022 · §2, the paper's one numbered equation, "normalized by the output length" (Brown et al. 2020), exactly as typeset there</p>

Note:
The paper's only numbered equation. Instead of counting each sample as one vote, one could weight it by how likely the model thought the whole output was. Raw output probability shrinks with length, so the paper also normalizes by the number of tokens: the exponent is the average log probability per token, so this is the geometric mean of the token probabilities. As typeset, the paper writes e to the power with the exp symbol, which reads like a typo for the exponential function (ours); the value is the per-token geometric mean. The paper adds that these normalized probabilities are quite close to each other across samples, so the model regards all the generations as similarly likely. The next slide shows what that means for the vote.

---

<p class="eyebrow"><span class="paper">Wang et al. 2022</span> · §2 · Table 1</p>

## Does weighting the votes by the model's own probability help?

<div class="rows">
<p class="plain">Plain majority vote matches the best weighting to within 0.3 points on every task (ours).</p>
<table class="rules tight" style="font-size:18px">
  <tr><td></td><td>GSM8K</td><td>MultiArith</td><td>AQuA</td><td>SVAMP</td><td>CSQA</td><td>ARC-c</td></tr>
  <tr><td>Greedy decode</td><td>56.5</td><td>94.7</td><td>35.8</td><td>79.0</td><td>79.0</td><td>85.2</td></tr>
  <tr><td>Weighted avg (unnormalized)</td><td>56.3 ± 0.0</td><td>90.5 ± 0.0</td><td>35.8 ± 0.0</td><td>73.0 ± 0.0</td><td>74.8 ± 0.0</td><td>82.3 ± 0.0</td></tr>
  <tr><td>Weighted avg (normalized)</td><td>22.1 ± 0.0</td><td>59.7 ± 0.0</td><td>15.7 ± 0.0</td><td>40.5 ± 0.0</td><td>52.1 ± 0.0</td><td>51.7 ± 0.0</td></tr>
  <tr><td>Weighted sum (unnormalized)</td><td>59.9 ± 0.0</td><td>92.2 ± 0.0</td><td>38.2 ± 0.0</td><td>76.2 ± 0.0</td><td>76.2 ± 0.0</td><td>83.5 ± 0.0</td></tr>
  <tr><td>Weighted sum (normalized)</td><td>74.1 ± 0.0</td><td>99.3 ± 0.0</td><td>48.0 ± 0.0</td><td>86.8 ± 0.0</td><td>80.7 ± 0.0</td><td>88.7 ± 0.0</td></tr>
  <tr><td>Unweighted sum (majority vote)</td><td>74.4 ± 0.1</td><td>99.3 ± 0.0</td><td>48.3 ± 0.5</td><td>86.6 ± 0.1</td><td>80.7 ± 0.1</td><td>88.7 ± 0.1</td></tr>
</table>
</div>

<p class="footnote">Wang et al. 2022 · Table 1, PaLM-540B, accuracy %. Normalized: probability divided by output length. MultiArith, AQuA, SVAMP: maths word problems; CSQA: commonsense multiple choice; ARC-c: hard science questions</p>

Note:
Table 1 compares ways to aggregate the same sampled answers on PaLM-540B. The top row is greedy decoding, 56.5 on GSM8K. A weighted sum adds up each answer's sample probabilities instead of counting one per sample; a weighted average divides that sum by the number of votes. Point at the bottom two rows: the normalized weighted sum and the plain majority vote are nearly the same, 74.1 and 74.4 on GSM8K, and identical on MultiArith, CSQA and ARC-c. The paper's explanation is that the normalized probabilities are very close to each other. Its footnote adds that this means the model is not well calibrated. Unnormalized weights do much worse, and the normalized weighted average collapses to 22.1. So the paper uses the simple majority vote. (Ours: the plus or minus 0.0 entries on the weighted rows are exact zeros as printed.)

---

<p class="eyebrow"><span class="paper">Wang et al. 2022</span> · §3.1 · experiment setup</p>

## What did they test, and on which models?

<div class="rows">
<table class="rules" style="font-size:20px">
  <tr><td>model</td><td>parameters</td><td>sampling</td></tr>
  <tr><td>UL2</td><td>20B</td><td>temperature 0.5, top-$k$ 40</td></tr>
  <tr><td>LaMDA</td><td>137B</td><td>temperature 0.5, top-$k$ 40</td></tr>
  <tr><td>PaLM</td><td>540B</td><td>temperature 0.7, top-$k$ 40</td></tr>
  <tr><td>GPT-3 (code-davinci-001, -002)</td><td>175B</td><td>temperature 0.7, no top-$k$</td></tr>
</table>
<p class="plain">Arithmetic, commonsense and symbolic reasoning tasks; few-shot, with the same prompts as the chain-of-thought paper.</p>
</div>

<p class="footnote">Wang et al. 2022 · §3.1. <b>Temperature</b>: lower is closer to greedy, higher is more varied; <b>top-$k$</b>: sample only among the $k$ most likely tokens</p>

Note:
Section 3.1 sets the scene. Tasks: arithmetic, including AddSub, MultiArith, ASDiv, AQuA, GSM8K and SVAMP; commonsense, CommonsenseQA, StrategyQA and ARC; and two symbolic tasks, last-letter concatenation and coin flip, where the test uses four names or four flips though the examples show two. Four models of very different scale, two of them public, UL2 and GPT-3. Everything is few-shot with no training. For arithmetic they reuse the same eight exemplars as the chain-of-thought paper; for commonsense, four to seven exemplars per task. Point at the sampling column: to get diverse paths the paper samples with a temperature and a top-k cut, with the settings in the table. Section 3.2 then says each reported number is averaged over 10 runs, each sampling 40 outputs, and the baseline is greedy chain of thought.

---

<p class="eyebrow"><span class="paper">Wang et al. 2022</span> · §3.2 · Table 2</p>

## How much does voting add on arithmetic?

<div class="rows">
<p class="plain">The paper: gains grow with scale, +3 to 6 points on UL2-20B, +9 to 23 on LaMDA-137B and GPT-3.</p>
<table class="rules tight" style="font-size:15px">
  <tr><td>model</td><td>method</td><td>AddSub</td><td>MultiArith</td><td>ASDiv</td><td>AQuA</td><td>SVAMP</td><td>GSM8K</td></tr>
  <tr><td></td><td>Previous SoTA</td><td><b>94.9</b></td><td>60.5</td><td>75.3</td><td>37.9</td><td>57.4</td><td>35 / 55</td></tr>
  <tr><td>UL2-20B</td><td>CoT-prompting</td><td>18.2</td><td>10.7</td><td>16.9</td><td>23.6</td><td>12.6</td><td>4.1</td></tr>
  <tr><td></td><td>Self-consistency</td><td>24.8 <small>(+6.6)</small></td><td>15.0 <small>(+4.3)</small></td><td>21.5 <small>(+4.6)</small></td><td>26.9 <small>(+3.3)</small></td><td>19.4 <small>(+6.8)</small></td><td>7.3 <small>(+3.2)</small></td></tr>
  <tr><td>LaMDA-137B</td><td>CoT-prompting</td><td>52.9</td><td>51.8</td><td>49.0</td><td>17.7</td><td>38.9</td><td>17.1</td></tr>
  <tr><td></td><td>Self-consistency</td><td>63.5 <small>(+10.6)</small></td><td>75.7 <small>(+23.9)</small></td><td>58.2 <small>(+9.2)</small></td><td>26.8 <small>(+9.1)</small></td><td>53.3 <small>(+14.4)</small></td><td>27.7 <small>(+10.6)</small></td></tr>
  <tr><td>PaLM-540B</td><td>CoT-prompting</td><td>91.9</td><td>94.7</td><td>74.0</td><td>35.8</td><td>79.0</td><td>56.5</td></tr>
  <tr><td></td><td>Self-consistency</td><td>93.7 <small>(+1.8)</small></td><td>99.3 <small>(+4.6)</small></td><td>81.9 <small>(+7.9)</small></td><td>48.3 <small>(+12.5)</small></td><td>86.6 <small>(+7.6)</small></td><td>74.4 <small>(+17.9)</small></td></tr>
  <tr><td>GPT-3&nbsp;code-davinci-001</td><td>CoT-prompting</td><td>57.2</td><td>59.5</td><td>52.7</td><td>18.9</td><td>39.8</td><td>14.6</td></tr>
  <tr><td></td><td>Self-consistency</td><td>67.8 <small>(+10.6)</small></td><td>82.7 <small>(+23.2)</small></td><td>61.9 <small>(+9.2)</small></td><td>25.6 <small>(+6.7)</small></td><td>54.5 <small>(+14.7)</small></td><td>23.4 <small>(+8.8)</small></td></tr>
  <tr><td>GPT-3&nbsp;code-davinci-002</td><td>CoT-prompting</td><td>89.4</td><td>96.2</td><td>80.1</td><td>39.8</td><td>75.8</td><td>60.1</td></tr>
  <tr><td></td><td>Self-consistency</td><td>91.6 <small>(+2.2)</small></td><td><b>100.0</b> <small>(+3.8)</small></td><td><b>87.8</b> <small>(+7.6)</small></td><td><b>52.0</b> <small>(+12.2)</small></td><td><b>86.8</b> <small>(+11.0)</small></td><td><b>78.0</b> <small>(+17.9)</small></td></tr>
</table>
</div>

<p class="footnote">Wang et al. 2022 · Table 2, accuracy %; bold = best per task. Previous SoTA (best prior published result) source marks omitted. GSM8K: school maths; AddSub, MultiArith, ASDiv, AQuA, SVAMP: other maths word problems</p>

Note:
Table 2, every model, the chain-of-thought baseline above self-consistency, with the gain in brackets. Each self-consistency number is the mean over 10 runs of 40 sampled paths; the paper says the standard deviation of self-consistency is at most 0.5 on every task and leaves it out. Point at the PaLM-540B GSM8K column: 56.5 goes to 74.4, plus 17.9. The paper's text says the gains become more significant as the model scale increases, roughly 3 to 6 points on UL2 and 9 to 23 on LaMDA and GPT-3. On the largest models the gain is still 12 to 18 on AQuA and GSM8K. The previous state of the art column includes a GPT-3 fine-tuned with 7.5 thousand examples, 35 on GSM8K, and one plus an extra verifier, 55; self-consistency is unsupervised. (Ours: the abstract's five gains all come from the code-davinci-002 rows.)

---

<p class="eyebrow"><span class="paper">Wang et al. 2022</span> · §3.2 · Table 3</p>

## Does it help on commonsense and symbolic tasks too?

<div class="rows">
<p class="plain">Gains again, except Letter (4) on UL2 and LaMDA: 0.0 and 8.2, unchanged (ours).</p>
<table class="rules tight" style="font-size:15px">
  <tr><td>model</td><td>method</td><td>CSQA</td><td>StrategyQA</td><td>ARC-e</td><td>ARC-c</td><td>Letter (4)</td><td>Coinflip (4)</td></tr>
  <tr><td></td><td>Previous SoTA</td><td><b>91.2</b></td><td>73.9</td><td>86.4</td><td>75.0</td><td>N/A</td><td>N/A</td></tr>
  <tr><td>UL2-20B</td><td>CoT-prompting</td><td>51.4</td><td>53.3</td><td>61.6</td><td>42.9</td><td>0.0</td><td>50.4</td></tr>
  <tr><td></td><td>Self-consistency</td><td>55.7 <small>(+4.3)</small></td><td>54.9 <small>(+1.6)</small></td><td>69.8 <small>(+8.2)</small></td><td>49.5 <small>(+6.8)</small></td><td>0.0 <small>(+0.0)</small></td><td>50.5 <small>(+0.1)</small></td></tr>
  <tr><td>LaMDA-137B</td><td>CoT-prompting</td><td>57.9</td><td>65.4</td><td>75.3</td><td>55.1</td><td>8.2</td><td>72.4</td></tr>
  <tr><td></td><td>Self-consistency</td><td>63.1 <small>(+5.2)</small></td><td>67.8 <small>(+2.4)</small></td><td>79.3 <small>(+4.0)</small></td><td>59.8 <small>(+4.7)</small></td><td>8.2 <small>(+0.0)</small></td><td>73.5 <small>(+1.1)</small></td></tr>
  <tr><td>PaLM-540B</td><td>CoT-prompting</td><td>79.0</td><td>75.3</td><td>95.3</td><td>85.2</td><td>65.8</td><td>88.2</td></tr>
  <tr><td></td><td>Self-consistency</td><td>80.7 <small>(+1.7)</small></td><td><b>81.6</b> <small>(+6.3)</small></td><td><b>96.4</b> <small>(+1.1)</small></td><td><b>88.7</b> <small>(+3.5)</small></td><td>70.8 <small>(+5.0)</small></td><td>91.2 <small>(+3.0)</small></td></tr>
  <tr><td>GPT-3&nbsp;code-davinci-001</td><td>CoT-prompting</td><td>46.6</td><td>56.7</td><td>63.1</td><td>43.1</td><td>7.8</td><td>71.4</td></tr>
  <tr><td></td><td>Self-consistency</td><td>54.9 <small>(+8.3)</small></td><td>61.7 <small>(+5.0)</small></td><td>72.1 <small>(+9.0)</small></td><td>53.7 <small>(+10.6)</small></td><td>10.0 <small>(+2.2)</small></td><td>75.9 <small>(+4.5)</small></td></tr>
  <tr><td>GPT-3&nbsp;code-davinci-002</td><td>CoT-prompting</td><td>79.0</td><td>73.4</td><td>94.0</td><td>83.6</td><td>70.4</td><td>99.0</td></tr>
  <tr><td></td><td>Self-consistency</td><td>81.5 <small>(+2.5)</small></td><td>79.8 <small>(+6.4)</small></td><td>96.0 <small>(+2.0)</small></td><td>87.5 <small>(+3.9)</small></td><td><b>73.4</b> <small>(+3.0)</small></td><td><b>99.5</b> <small>(+0.5)</small></td></tr>
</table>
</div>

<p class="footnote">Wang et al. 2022 · Table 3, accuracy %; bold = best per task. CSQA: commonsense multiple choice; StrategyQA: yes or no; ARC-e, ARC-c: easy and hard science; Letter (4), Coinflip (4): symbolic tasks with four names or flips</p>

Note:
Table 3 has the same layout. Self-consistency gains on commonsense across all four models, for example PaLM on StrategyQA from 75.3 to 81.6. For symbolic reasoning the test is out of distribution: the prompt shows two letters or two flips and the test uses four. Point at the Letter (4) column: UL2 stays at 0.0 and LaMDA at 8.2, so a vote cannot help when no path solves the task (ours). The paper says self-consistency gets the best result on 5 of 6 tasks, but (ours) two of the six have no previous state of the art, and on CommonsenseQA the previous best, 91.2, is far above 80.7 and 81.5. The paper's text: the gain on symbolic tasks is still quite significant with sufficient model sizes.

---

<p class="eyebrow"><span class="paper">Wang et al. 2022</span> · §3.2 · Fig. 2</p>

## Do more sampled paths keep helping?

<div class="rows">
<div class="fig"><img src="img/week-08-wang-fig2-paths.png" alt="Wang et al. Figure 2: accuracy against the number of sampled reasoning paths, 1 to 40, on MultiArith, SVAMP, Commonsense QA and ARC Challenge for LaMDA-137B; the self-consistency curve rises above the flat greedy line"></div>
<p class="plain">Accuracy rises with the number of sampled paths: 1, 5, 10, 20, 40.</p>
</div>

<p class="footnote">Wang et al. 2022 · Fig. 2, LaMDA-137B; greedy decoding is the orange line; mean and standard deviation over 10 runs. MultiArith, SVAMP: maths word problems; ARC (Challenge): hard science questions</p>

Note:
Figure 2 answers how many paths we need. The x-axis is the number of sampled paths, 1, 5, 10, 20 and 40; the blue curve is self-consistency, the flat orange line is the greedy baseline, and the bars are the standard deviation over 10 runs. The paper's reading: sampling a higher number, say 40, leads to consistently better performance. Point at the left end of each panel: with a single sampled path, the blue point is at or below the greedy line, because one sample is a noisy draw (ours); the vote is what lifts it. The curves flatten as paths increase; the conclusion later says performance saturates quickly. The paper also shows, in its Table 4, example questions where greedy decoding errs and sampled paths find the right answer.

---

<p class="eyebrow"><span class="paper">Wang et al. 2022</span> · §3.3 · Table 5</p>

## Does it help where chain of thought hurts?

<div class="rows">
<table class="rules" style="font-size:20px">
  <tr><td></td><td>ANLI R1 / R2 / R3</td><td>e-SNLI</td><td>RTE</td><td>BoolQ</td><td>HotpotQA (EM/F1)</td></tr>
  <tr><td>Standard-prompting (no-rationale)</td><td>69.1 / 55.8 / 55.8</td><td>85.8</td><td>84.8</td><td>71.3</td><td>27.1 / 36.8</td></tr>
  <tr><td>CoT-prompting</td><td>68.8 / 58.9 / 60.6</td><td>81.0</td><td>79.1</td><td>74.2</td><td>28.9 / 39.8</td></tr>
  <tr><td>Self-consistency</td><td><b>78.5</b> / <b>64.5</b> / <b>63.4</b></td><td><b>88.4</b></td><td><b>86.3</b></td><td><b>78.4</b></td><td><b>33.8 / 44.6</b></td></tr>
</table>
<p class="plain">On ANLI R1, e-SNLI and RTE, chain of thought scores below standard prompting; self-consistency beats both.</p>
</div>

<p class="footnote">Wang et al. 2022 · Table 5, PaLM-540B, accuracy %. ANLI, e-SNLI, RTE: does one sentence imply another; BoolQ: yes or no questions; HotpotQA: multi-fact questions, EM exact match and F1 word overlap</p>

Note:
Section 3.3 starts from a known problem: Ye and Durrett showed that chain of thought can hurt compared with standard prompting in few-shot learning. Table 5 is on PaLM-540B. Read the first two rows: on ANLI round 1, 68.8 against 69.1, on e-SNLI, 81.0 against 85.8, and on RTE, 79.1 against 84.8, adding a chain of thought lowers the score. Then the bottom row: self-consistency is 78.5, 88.4 and 86.3, above standard prompting on all three, and best in every column. The paper's reading is that it is a reliable way to add rationales in few-shot learning on common language tasks. (Ours: the table does not say how many samples were used here.)

---

<p class="eyebrow"><span class="paper">Wang et al. 2022</span> · §3.4 · Fig. 3</p>

## Is it just picking the most likely sample?

<div class="rows">
<div class="fig"><img src="img/week-08-wang-fig3-rank.png" alt="Wang et al. Figure 3: accuracy against the number of sampled paths for GSM8K, MultiArith and ARC Challenge with GPT-3; self-consistency rises well above sample and rank, which gains less and on ARC ends near the greedy line"></div>
<p class="plain">Ranking the samples by probability gains much less than voting on them, with the same number of samples.</p>
</div>

<p class="footnote">Wang et al. 2022 · Fig. 3, GPT-3 code-davinci-001. <b>Sample-and-rank</b>: sample many outputs, keep the one with the highest log probability</p>

Note:
Section 3.4 compares self-consistency with other ways of using many samples. First, sample-and-rank, a common approach: sample several sequences and rank them by each sequence's log probability, then take the answer of the top-ranked one. Same number of samples as self-consistency, on GPT-3 code-davinci-001. Point at the green line, sample and rank, against the blue line, self-consistency, in each panel: the green line improves with more samples but the paper says the gain is much smaller. This fits the footnote in Section 2: the model's own probabilities are close to each other, so they do not separate good paths from bad ones. The optional slide below is the beam search comparison.

--

<p class="eyebrow"><span class="paper">Wang et al. 2022</span> · §3.4 · Table 6 · optional</p>

## Does beam search do as well?

<div class="rows">
<table class="rules tight" style="font-size:19px">
  <tr><td></td><td>Beam size / Self-consistency paths</td><td>1</td><td>5</td><td>10</td><td>20</td><td>40</td></tr>
  <tr><td>AQuA</td><td>Beam search decoding (top beam)</td><td>23.6</td><td>19.3</td><td>16.1</td><td>15.0</td><td>10.2</td></tr>
  <tr><td></td><td>Self-consistency using beam search</td><td>23.6</td><td>19.8 ± 0.3</td><td>21.2 ± 0.7</td><td>24.6 ± 0.4</td><td>24.2 ± 0.5</td></tr>
  <tr><td></td><td>Self-consistency using sampling</td><td>19.7 ± 2.5</td><td><b>24.9 ± 2.6</b></td><td><b>25.3 ± 1.8</b></td><td><b>26.7 ± 1.0</b></td><td><b>26.9 ± 0.5</b></td></tr>
  <tr><td>MultiArith</td><td>Beam search decoding (top beam)</td><td>10.7</td><td>12.0</td><td>11.3</td><td>11.0</td><td>10.5</td></tr>
  <tr><td></td><td>Self-consistency using beam search</td><td>10.7</td><td>11.8 ± 0.0</td><td>11.4 ± 0.1</td><td>12.3 ± 0.1</td><td>10.8 ± 0.1</td></tr>
  <tr><td></td><td>Self-consistency using sampling</td><td>9.5 ± 1.2</td><td>11.3 ± 1.2</td><td><b>12.3 ± 0.8</b></td><td><b>13.7 ± 0.9</b></td><td><b>14.7 ± 0.3</b></td></tr>
</table>
</div>

<p class="footnote">Wang et al. 2022 · Table 6, UL2-20B, accuracy %. <b>Beam search</b>: keep the few most likely partial outputs at each step. AQuA, MultiArith: maths word problems</p>

Note:
Table 6 uses UL2-20B on two tasks, with the same number of beams and paths. Look at the first row of AQuA: the top beam of beam search gets worse as the beam gets wider, from 23.6 at width 1 down to 10.2 at width 40. Self-consistency using sampling goes the other way, from 19.7 at one path up to 26.9 at 40. The paper also tried using beam search to decode each path inside self-consistency, the middle row, and it is worse than sampling. Its reason: beam search yields lower diversity in the outputs, while diversity of the reasoning paths is the key to better performance in self-consistency.

---

<p class="eyebrow"><span class="paper">Wang et al. 2022</span> · §3.4 · Table 7</p>

## Is it just an ensemble?

<div class="rows">
<table class="rules" style="font-size:20px">
  <tr><td></td><td>GSM8K</td><td>MultiArith</td><td>SVAMP</td><td>ARC-e</td><td>ARC-c</td></tr>
  <tr><td>CoT (Wei et al., 2022)</td><td>17.1</td><td>51.8</td><td>38.9</td><td>75.3</td><td>55.1</td></tr>
  <tr><td>Ensemble (3 sets of prompts)</td><td>18.6 ± 0.5</td><td>57.1 ± 0.7</td><td>42.1 ± 0.6</td><td>76.6 ± 0.1</td><td>57.0 ± 0.2</td></tr>
  <tr><td>Ensemble (40 prompt permutations)</td><td>19.2 ± 0.1</td><td>60.9 ± 0.2</td><td>42.7 ± 0.1</td><td>76.9 ± 0.1</td><td>57.0 ± 0.1</td></tr>
  <tr><td>Self-Consistency (40 sampled paths)</td><td><b>27.7 ± 0.2</b></td><td><b>75.7 ± 0.3</b></td><td><b>53.3 ± 0.2</b></td><td><b>79.3 ± 0.3</b></td><td><b>59.8 ± 0.2</b></td></tr>
</table>
<p class="plain">Voting over varied prompts gains 1.3 to 9.1 points; voting over sampled paths gains 4.0 to 23.9 (ours).</p>
</div>

<p class="footnote">Wang et al. 2022 · Table 7, LaMDA-137B, accuracy %. Both ensembles take a majority vote over greedy answers. SVAMP, MultiArith, GSM8K: maths word problems; ARC-e, ARC-c: easy and hard science questions</p>

Note:
Last comparison in 3.4: ensembles. The objection is that any vote over several runs might help. The paper builds two ensembles that vote over greedy answers: one over 3 different sets of prompts that they wrote by hand, and one over 40 random permutations of the exemplar order. Point at the GSM8K column: chain of thought is 17.1, the two ensembles reach 18.6 and 19.2, and self-consistency with 40 sampled paths reaches 27.7. Same pattern on every column. The paper says the ensembles achieve a much smaller gain, and that self-consistency is different from a model ensemble because it acts like a self-ensemble on top of a single model. (Ours: the 3-prompt ensemble has only 3 votes, so the comparison does not match cost.)

---

<p class="eyebrow"><span class="paper">Wang et al. 2022</span> · §3.5 · Fig. 5</p>

## Does agreement tell us when the model is wrong?

<div class="rows">
<div class="fig"><img src="img/week-08-wang-fig5-consistency.png" alt="Wang et al. Figure 5: accuracy in percent against consistency in percent on GSM8K; the points rise from near 0 at low consistency to 100 at high consistency"></div>
<p class="plain">The more of the sampled paths agree with the final answer, the more often that answer is right.</p>
</div>

<p class="footnote">Wang et al. 2022 · Fig. 5, GSM8K. <b>Consistency</b>: the percentage of decodes that agree with the final aggregated answer</p>

Note:
Figure 5 is one scatter plot on GSM8K: consistency on the x-axis, the percentage of decodes that agree with the final answer, and accuracy on the y-axis. The points climb from near zero to 100. The paper's reading: low consistency indicates that the model has low confidence, so self-consistency gives some ability to know when it does not know. (Ours: this is a correlation on one task, and the caption does not name the model; the conclusion also claims improved calibration, but the paper shows no calibration measure.) Now the cost. The conclusion says, in the paper's words: "One limitation of self-consistency is that it incurs more computation cost. In practice people can try a small number of paths (e.g., 5 or 10) as a starting point to realize most of the gains while not incurring too much cost, as in most cases the performance saturates quickly." Forty samples is forty decodes per question; the paper gives no cost figure.

--

<p class="eyebrow"><span class="paper">Wang et al. 2022</span> · §3.5 · Fig. 4 · optional</p>

## Does it depend on the sampling settings or the model size?

<div class="rows">
<div class="fig"><img src="img/week-08-wang-fig4-sampling.png" alt="Wang et al. Figure 4: left, GSM8K accuracy against the number of sampled paths for several temperature, top-k and nucleus settings, all above the greedy line; right, GSM8K accuracy against model size for self-consistency and greedy decoding"></div>
<p class="plain">Left: several sampling settings all beat greedy. Right: the vote helps at every model size.</p>
</div>

<p class="footnote">Wang et al. 2022 · Fig. 4, GSM8K. Left: PaLM-540B; right: the LaMDA series. T: temperature; $k$: top-$k$; $p$: nucleus sampling, sample from the smallest set of tokens whose probabilities add to $p$</p>

Note:
Figure 4 has two panels on GSM8K. On the left, PaLM-540B with different sampling strategies and parameters: temperature, top-k and nucleus sampling. All the curves rise above the grey greedy line as paths are added. The paper's claim is that self-consistency is robust to sampling strategies and parameters. (Ours: the green curve, temperature 0.3, ends several points below the others, in line with a low temperature giving less diversity, so "robust" holds for the middle settings.) On the right, the LaMDA series from 2 billion to 137 billion parameters: self-consistency is above greedy at every size, and the paper notes the gain is relatively lower for smaller models because abilities such as arithmetic only emerge at a sufficient scale.

--

<p class="eyebrow"><span class="paper">Wang et al. 2022</span> · §3.5 · Table 8 · optional</p>

## Does it survive imperfect prompts, equations and zero-shot chain of thought?

<div class="rows">
<table class="rules" style="font-size:22px">
  <tr><td>LaMDA-137B</td><td>Prompt with correct chain-of-thought</td><td>17.1</td></tr>
  <tr><td></td><td>Prompt with imperfect chain-of-thought</td><td>14.9</td></tr>
  <tr><td></td><td>&nbsp;&nbsp;+ Self-consistency (40 paths)</td><td><b>23.4</b></td></tr>
  <tr><td></td><td>Prompt with equations</td><td>5.0</td></tr>
  <tr><td></td><td>&nbsp;&nbsp;+ Self-consistency (40 paths)</td><td><b>6.5</b></td></tr>
  <tr><td>PaLM-540B</td><td>Zero-shot CoT (Kojima et al., 2022)</td><td>43.0</td></tr>
  <tr><td></td><td>&nbsp;&nbsp;+ Self-consistency (40 paths)</td><td><b>69.2</b></td></tr>
</table>
</div>

<p class="footnote">Wang et al. 2022 · Table 8, GSM8K accuracy %. Imperfect: the numbers in the exemplars' reasoning are swapped for random ones. Equations: reasoning written as short equations. Zero-shot CoT: no exemplars, "let's think step by step"</p>

Note:
Table 8 has three tests, all on GSM8K. First, imperfect prompts: the paper swaps the numbers inside the exemplars' reasoning for random ones, so the reasoning is wrong but the final answer is kept. Greedy accuracy drops from 17.1 to 14.9 on LaMDA, and self-consistency lifts it to 23.4. Second, equations instead of sentences: greedy 5.0, self-consistency 6.5; the paper says the gain is smaller because equations are shorter and leave less room for diversity. Third, zero-shot chain of thought from the previous reading, on PaLM-540B: 43.0 goes to 69.2 with self-consistency, a gain of 26.2 points. The paper presents this as a test of generality.


---


<!-- .slide: class="cover divider" -->

<p class="kicker">Reading 5 of 7</p>
<h1>Chen et al. 2023</h1>
<p class="subtitle">Universal Self-Consistency for Large Language Model Generation</p>
<p class="question">How do we vote when answers are free text?</p>
<ol class="track" style="grid-template-columns: repeat(7, 1fr); gap: 12px"><li class="done">Plaat 2024<span>the map</span></li><li class="done">Wei 2022<span>chain of thought</span></li><li class="done">Kojima 2022<span>zero-shot</span></li><li class="done">Wang 2022<span>self-consistency</span></li><li class="now">Chen 2023<span>free-text vote</span></li><li>Yao 2022<span>reason and act</span></li><li>R1 2025<span>reinforcement learning</span></li></ol>

Note:
Reading 5 of 7. Chen and colleagues, also at Google and again with Denny Zhou, November 2023: a direct follow-up to the paper we just read. It is short. The introduction and a one-section background on self-consistency lead to the method in Section 3, the experiments in Section 4 with their ablations, a discussion, related work and a limitations section. We take two slides: the method, and one results table.

---

<p class="eyebrow"><span class="paper">Chen et al. 2023</span> · §3 · Fig. 1</p>

## How do we vote when answers are free text?

<div class="rows">
<div class="fig"><img src="img/week-08-chen-fig1-usc.png" alt="Chen et al. Figure 1: a question goes to a language model, which writes several responses; all responses are pasted into one prompt that ends with the instruction to select the most consistent response based on majority consensus; a second call to the model returns the selected response"></div>
<p class="plain">Sample responses, paste them all into one prompt, and ask the model itself to pick the most consistent one.</p>
</div>

<p class="footnote">Chen et al. 2023 · Fig. 1. USC: universal self-consistency. Exact-match voting needs one closed-form answer, such as a single number</p>

Note:
Start from the limit the previous paper admitted: a majority vote needs an answer you can compare by exact match, such as one number. Summaries, open-ended answers and code have none. Figure 1 is the paper's fix. Read it left to right. The model writes several responses to the question. Instead of extracting and counting answers, all the responses are concatenated into one prompt, and the prompt ends with an instruction, which you can read in bold: select the most consistent response based on majority consensus. A second call to the model returns the index of the chosen response. The authors' bet is that judging consistency among responses is easier than judging correctness. In the paper's Figure 2 example, a question whose answer is a list of countries, no two responses match exactly, yet the model picks the one whose entities appear most often. (Ours: this costs one extra model call, and the number of responses is bounded by the context length, as the limitations section admits.)

---

<p class="eyebrow"><span class="paper">Chen et al. 2023</span> · §4.2 · Table 1</p>

## Does asking the model match the exact-match vote?

<div class="rows">
<p class="plain">USC is within 0.7 points of the vote without parsing answers; random selection falls below greedy (ours).</p>
<table class="rules" style="font-size:20px">
  <tr><td>model</td><td>approach</td><td>GSM8K</td><td>MATH</td></tr>
  <tr><td><code>PaLM 2-L</code></td><td>Greedy decoding</td><td>85.7</td><td>30.8</td></tr>
  <tr><td></td><td>Random</td><td>82.9</td><td>28.0</td></tr>
  <tr><td></td><td>SC (Wang et al.)</td><td><b>90.4</b></td><td><b>37.9</b></td></tr>
  <tr><td></td><td>USC</td><td>90.2</td><td>37.4</td></tr>
  <tr><td><code>gpt-3.5-turbo</code></td><td>Greedy decoding</td><td>73.4</td><td>33.2</td></tr>
  <tr><td></td><td>Random</td><td>68.5</td><td>26.3</td></tr>
  <tr><td></td><td>SC</td><td><b>78.5</b></td><td>38.0</td></tr>
  <tr><td></td><td>USC</td><td>77.8</td><td><b>38.1</b></td></tr>
</table>
</div>

<p class="footnote">Chen et al. 2023 · Table 1, accuracy %, 8 samples; bold = best per column. SC: self-consistency vote. GSM8K: school maths word problems; MATH: competition problems. Tables 2 to 4 (code, summaries, TruthfulQA) not shown</p>

Note:
Table 1, mathematical reasoning, with two models, 8 sampled responses each, zero-shot. The rows: greedy decoding; random, which picks one of the sampled responses at random as the control, from the same set of samples that SC and USC choose from; SC, the standard exact-match vote of Wang and colleagues, which needs answer parsing; and USC. Point at PaLM 2-L on GSM8K: 90.2 for USC against 90.4 for SC, and random at 82.9 is below greedy at 85.7, so the gain is not just from having several samples. The paper says USC is generally comparable to SC without needing answer parsing. The other tables, where no vote exists: code generation, where USC matches execution-based voting, 45.5 against 45.6 on BIRD-SQL; summarization, GovReport ROUGE-1 38.8 greedy, 38.5 random, 40.2 USC; and TruthfulQA, 62.1, 62.9 and 67.7 for PaLM 2-L. The ordering check, Table 5: USC was re-run with 5 random orders of the responses, mean and standard deviation, for example GSM8K 89.7 plus or minus 0.3, and the paper concludes the effect of order is minimal. (Ours: the main tables report no spread, and the paper says USC sits notably below an oracle choice.)


---


<!-- .slide: class="cover divider" -->

<p class="kicker">Reading 6 of 7</p>
<h1>Yao et al. 2022</h1>
<p class="subtitle">ReAct: Synergizing Reasoning and Acting in Language Models</p>
<p class="question">What if the model can look things up between thoughts?</p>
<ol class="track" style="grid-template-columns: repeat(7, 1fr); gap: 12px"><li class="done">Plaat 2024<span>the map</span></li><li class="done">Wei 2022<span>chain of thought</span></li><li class="done">Kojima 2022<span>zero-shot</span></li><li class="done">Wang 2022<span>self-consistency</span></li><li class="done">Chen 2023<span>free-text vote</span></li><li class="now">Yao 2022<span>reason and act</span></li><li>R1 2025<span>reinforcement learning</span></li></ol>

Note:
Reading 6 of 7. Yao and colleagues at Princeton and Google Brain, first posted in October 2022 and published at ICLR 2023. The paper opens with one big figure, defines the method in a short section, then tests it on question answering and fact checking, and on two interactive tasks. We walk it in that order, and finish with one appendix example where a person edits the model's thoughts.

---

<p class="eyebrow"><span class="paper">Yao et al. 2022</span> · §1 · Fig. 1</p>

## What does reasoning plus acting look like on one question?

<div class="rows">
<div class="fig"><img src="img/week-08-react-fig1-hotpot.png" alt="ReAct Figure 1, top half: a HotpotQA question about the Apple Remote answered by standard prompting (iPod, wrong), chain of thought (iPhone, iPad, iPod Touch, wrong, with invented facts in red), act-only (yes, wrong) and ReAct (keyboard function keys, right)"></div>
</div>

<p class="footnote">Yao et al. 2022 · Fig. 1, top half; the ALFWorld half is the sub-slide below. HotpotQA: multi-hop questions over Wikipedia</p>

Note:
This is the top half of the paper's Figure 1, and the whole idea is in it, so take your time on it. One HotpotQA question: what other device can control the program the Apple Remote was designed for. Standard prompting, panel 1a, just answers iPod, wrong. Chain of thought, panel 1b, reasons fluently but invents facts, the red text, and says iPhone, iPad and iPod Touch, wrong. Act-only, panel 1c, searches but never thinks about what it found, and finishes with yes. ReAct, panel 1d on the right, alternates a thought, an action and an observation. It searches, finds Front Row, sees that the next search failed, tries Front Row (software), and answers keyboard function keys. (ours) The green highlights seem to follow facts from an observation into the next thought; the caption does not explain the colours.

--

<p class="eyebrow"><span class="paper">Yao et al. 2022</span> · §1 · Fig. 1, bottom half · optional</p>

## What does the same contrast look like in a household game?

<div class="rows">
<div class="fig"><img src="img/week-08-react-fig1-alfworld.png" alt="ReAct Figure 1, bottom half: an ALFWorld task, put some pepper shaker on a drawer. Act-only looks in the sink basin, then repeats a failed take action and fails; ReAct thinks about where a pepper shaker is likely to be, searches cabinets and countertops, finds it on countertop 3 and puts it in the drawer"></div>
</div>

<p class="footnote">Yao et al. 2022 · Fig. 1, bottom half. ALFWorld: a text-based household game; the agent reads what it sees and types actions</p>

Note:
The bottom half of Figure 1, the same contrast in ALFWorld, a text game set in a house. The task: put some pepper shaker on a drawer. Act-only, on the left, opens drawer 1, goes to the sink basin, tries to take a pepper shaker that is not there, gets "Nothing happens", and repeats the same action. ReAct, on the right, first thinks about where a pepper shaker is likely to be, cabinets and countertops, checks them in turn, finds it on countertop 3, and then thinks again about the next sub-goal, putting it in drawer 1, which it does. Here the thoughts are sparse: the model decides when to think, unlike HotpotQA where thoughts and actions alternate every step.

---

<p class="eyebrow"><span class="paper">Yao et al. 2022</span> · §2 · the augmented action space</p>

## What is a thought, formally?

<div class="cols wide-text">
<div class="text">

<div class="eq">$$\hat{\mathcal{A}} = \mathcal{A} \cup \mathcal{L}$$</div>

<dl class="where">
<dt>$\hat{\mathcal{A}}$</dt><dd>the action space with thoughts added</dd>
<dt>$\mathcal{A}$</dt><dd>the task's actions $a_t$, taken after seeing observation $o_t$</dd>
<dt>$\mathcal{L}$</dt><dd>the space of language</dd>
<dt>$\hat a_t \in \mathcal{L}$</dt><dd>a thought: changes nothing outside, gets no observation</dd>
<dt>$c_t$</dt><dd>the context $(o_1, a_1, \cdots, o_{t-1}, a_{t-1}, o_t)$; a thought gives $c_{t+1} = (c_t, \hat a_t)$</dd>
</dl>

</div>
<div class="text">

- The agent follows a policy $\pi(a_t \mid c_t)$.
- A frozen PaLM-540B is prompted with a few human-written examples.

</div>
</div>

<p class="footnote">Yao et al. 2022 · §2. PaLM-540B: Google's 540-billion-parameter language model</p>

Note:
Section 2 is short. A standard agent sees an observation and picks an action from the task's action set A, following a policy that reads the context, the whole history of observations and actions so far. The idea of ReAct is simple, in the paper's words: add the space of language to the action set. A thought is an action written in language. It does not touch the environment, so there is no new observation. Its only effect is to be appended to the context, so later steps can use it. The paper lists useful kinds of thought: splitting the goal into a plan, recalling common sense, pulling out the important part of an observation, tracking progress, and handling exceptions. Because the language space is unlimited, learning this is hard, so the paper does not train: it prompts a frozen PaLM with one to six hand-written trajectories. (ours) Nothing is trained, so this is prompting, not reinforcement learning, whatever its filing in the survey.

---

<p class="eyebrow"><span class="paper">Yao et al. 2022</span> · §3 · Table 1</p>

## Does ReAct beat chain of thought on HotpotQA and FEVER?

<div class="rows">
<table class="rules" style="font-size:20px; margin:0 auto">
  <tr><td>Prompt method</td><td>HotpotQA (EM)</td><td>FEVER (Acc)</td></tr>
  <tr><td>Standard</td><td>28.7</td><td>57.1</td></tr>
  <tr><td>CoT</td><td>29.4</td><td>56.3</td></tr>
  <tr><td>CoT-SC</td><td>33.4</td><td>60.4</td></tr>
  <tr><td>Act</td><td>25.7</td><td>58.9</td></tr>
  <tr><td>ReAct</td><td>27.4</td><td>60.9</td></tr>
  <tr><td>CoT-SC ▸ ReAct</td><td>34.2</td><td><b>64.6</b></td></tr>
  <tr><td>ReAct ▸ CoT-SC</td><td><b>35.1</b></td><td>62.0</td></tr>
  <tr><td>Supervised SoTA</td><td>67.5</td><td>89.5</td></tr>
</table>
<p class="plain">ReAct beats Act on both, beats chain of thought on FEVER only; the hybrids are best.</p>
</div>

<p class="footnote">Yao et al. 2022 · Table 1, PaLM-540B. HotpotQA: multi-hop Wikipedia questions, scored by exact match (EM). FEVER: claims labelled supported, refuted or not enough info. CoT-SC: chain of thought with a vote; A ▸ B: A, falling back to B; SoTA: best published</p>

Note:
Table 1, PaLM-540B prompting. Read the top block first: Standard, chain of thought, and chain of thought with self-consistency, which votes over 21 samples. Then Act and ReAct. On FEVER, ReAct gets 60.9 against 56.3 for chain of thought. On HotpotQA it is slightly below chain of thought, 27.4 against 29.4, and the paper says so. The authors explain it in their error analysis: ReAct's answers are more grounded, with fewer made-up facts, but the interleaved format makes it less flexible in reasoning, and it sometimes loops. So they combine the two. ReAct falling back to self-consistency when it finds no answer in 7 steps reaches 35.1 on HotpotQA, and self-consistency falling back to ReAct when the vote is weak reaches 64.6 on FEVER. (ours) There are no seeds or error bars, and every prompting method is far below the supervised state of the art in the last row.

---

<p class="eyebrow"><span class="paper">Yao et al. 2022</span> · §4 · Tables 3 and 4</p>

## Does it work when the model has to act in a game and a shop?

<div class="rows">
<table class="rules tight" style="font-size:17px; margin:0 auto">
  <tr><td>ALFWorld success (%)</td><td>Pick</td><td>Clean</td><td>Heat</td><td>Cool</td><td>Look</td><td>Pick 2</td><td>All</td></tr>
  <tr><td>Act (best of 6)</td><td>88</td><td>42</td><td>74</td><td>67</td><td>72</td><td><b>41</b></td><td>45</td></tr>
  <tr><td>ReAct (avg)</td><td>65</td><td>39</td><td>83</td><td>76</td><td>55</td><td>24</td><td>57</td></tr>
  <tr><td>ReAct (best of 6)</td><td><b>92</b></td><td>58</td><td><b>96</b></td><td>86</td><td><b>78</b></td><td><b>41</b></td><td><b>71</b></td></tr>
  <tr><td>BUTLER (best of 8)</td><td>46</td><td>39</td><td>74</td><td><b>100</b></td><td>22</td><td>24</td><td>37</td></tr>
</table>
<table class="rules tight" style="font-size:17px; margin:0 auto">
  <tr><td>WebShop</td><td>Score</td><td>SR</td></tr>
  <tr><td>Act</td><td>62.3</td><td>30.1</td></tr>
  <tr><td>ReAct</td><td><b>66.6</b></td><td><b>40.0</b></td></tr>
  <tr><td>IL</td><td>59.9</td><td>29.1</td></tr>
  <tr><td>IL+RL</td><td>62.4</td><td>28.7</td></tr>
  <tr><td>Human expert</td><td>82.1</td><td>59.6</td></tr>
</table>
</div>

<p class="footnote">Yao et al. 2022 · Tables 3, 4 (the ReAct-IM and second BUTLER rows omitted). ALFWorld: text household game. WebShop: simulated online shop. SR: success rate. IL: imitation learning; RL: reinforcement learning. BUTLER: trained ALFWorld agent</p>

Note:
Top, Table 3, ALFWorld, 134 unseen household games, six task types. The best of six ReAct prompts reaches 71 percent overall, against 45 for Act's best and 37 for BUTLER, an agent trained on expert trajectories. Even the average ReAct trial, 57, beats both. Bottom, Table 4, WebShop, a simulated online shop where the agent must buy the product matching an instruction. ReAct's success rate is 40.0, against 30.1 for Act and 29.1 for imitation learning. The paper writes that this is an absolute 10 percent improvement over the previous best success rate; subtracting the table gives 10.9 over imitation learning (ours), and 11.3 over imitation plus reinforcement learning. Human experts are far ahead at 59.6. (ours) The abstract's 34 percent for ALFWorld compares ReAct's best of six with BUTLER's best, chosen on the same test games; the average gives 20.

--

<p class="eyebrow"><span class="paper">Yao et al. 2022</span> · App. A.3 · Fig. 5 · optional</p>

## What happens when a person edits two thoughts?

<div class="rows">
<div class="fig"><img src="img/week-08-react-fig5.png" alt="ReAct Figure 5: in an ALFWorld task, the ReAct trajectory fails after a hallucinated thought at Act 17; after a human edits the thoughts at Act 17 and Act 23 the trajectory succeeds"></div>
<p class="plain">Remove one hallucinated sentence, add one hint, and the trajectory succeeds.</p>
</div>

<p class="footnote">Yao et al. 2022 · App. A.3, Fig. 5. Task: put two keychains in a safe</p>

Note:
Appendix A.3, Figure 5. Left, panel a: a ReAct run in ALFWorld fails because of a hallucinated thought at Act 17, it claims it can find the second keychain later in drawer 4, the red text. It goes back to drawer 4, where there is only a watch, and nothing happens. Right, panel b: a human removes that sentence, the strike-through at Act 17, and adds a hint at Act 23, the underlined text, about where keychains are more likely to be. The rest of the trajectory changes and succeeds. The paper's point is that a person can steer the agent by editing a couple of thoughts instead of typing tens of actions, which is hard for act-only agents and for methods that would need new training. The authors call it an exciting direction and leave systematic study as future work.


---


<!-- .slide: class="cover divider" -->

<p class="kicker">Reading 7 of 7</p>
<h1>DeepSeek-AI 2025</h1>
<p class="subtitle">DeepSeek-R1: Incentivizing Reasoning Capability in LLMs via Reinforcement Learning</p>
<p class="question">Can reinforcement learning alone teach a model to reason?</p>
<ol class="track" style="grid-template-columns: repeat(7, 1fr); gap: 12px"><li class="done">Plaat 2024<span>the map</span></li><li class="done">Wei 2022<span>chain of thought</span></li><li class="done">Kojima 2022<span>zero-shot</span></li><li class="done">Wang 2022<span>self-consistency</span></li><li class="done">Chen 2023<span>free-text vote</span></li><li class="done">Yao 2022<span>reason and act</span></li><li class="now">R1 2025<span>reinforcement learning</span></li></ol>

Note:
Reading 7 of 7. DeepSeek-AI, January 2025; we read the later, journal-style version, whose main text is short and whose appendix is long. We walk the main text in its own order: the group-relative objective and the rewards, the training template, the R1-Zero results and the "aha moment", then the multi-stage R1 pipeline, its stage-by-stage table and the limitations. Then the distilled models from the appendix, and a few optional appendix slides.

---

<p class="eyebrow"><span class="paper">DeepSeek-AI 2025</span> · p. 1 · title and abstract</p>

## What does the DeepSeek-R1 paper claim?

<div class="cols wide-text">
<div class="fig"><img src="img/week-08-r1-p1.png" alt="Page 1 of the DeepSeek-R1 paper: the title, DeepSeek-AI as author, and the abstract"></div>
<div class="text">

<p class="plain">Pure reinforcement learning, with no human-written reasoning examples, can teach a model to reason.</p>

</div>
</div>

<p class="footnote">DeepSeek-AI 2025, "DeepSeek-R1: Incentivizing Reasoning Capability in LLMs via Reinforcement Learning", arXiv:2501.12948, p. 1. Reinforcement learning (RL): the model is trained from a reward on its own outputs</p>

Note:
The abstract in one breath. The authors start from the point that chain of thought, the technique of Wei and Kojima that we read earlier, depends on human-annotated demonstrations. Their claim: reasoning ability can be incentivized through pure reinforcement learning, so human-labeled reasoning trajectories are not needed. They say the training produces self-reflection, verification and dynamic strategy adaptation, that the trained model beats counterparts trained on human demonstrations on mathematics, coding competitions and science questions, and that these patterns can be used to teach smaller models. Hold two words: "pure" and "emerge". We check them against the training recipe and the figures. The author is the team, DeepSeek-AI, with a long contributor list at the end.

---

<p class="eyebrow"><span class="paper">DeepSeek-AI 2025</span> · §2.1 · the objective</p>

## What does GRPO maximise?

<div class="rows">
<div class="eq">$$\begin{aligned}
\mathcal{J}_{GRPO}(\theta) &= \mathbb{E}\left[q \sim P(Q),\ \{o_i\}_{i=1}^G \sim \pi_{\theta_{old}}(O|q)\right] \\
&\quad \frac{1}{G}\sum_{i=1}^G \Bigg( \min\left( \frac{\pi_\theta(o_i|q)}{\pi_{\theta_{old}}(o_i|q)} A_i,\ \text{clip}\left( \frac{\pi_\theta(o_i|q)}{\pi_{\theta_{old}}(o_i|q)}, 1-\epsilon, 1+\epsilon \right) A_i \right) \\
&\qquad - \beta\, \mathbb{D}_{KL}\left(\pi_\theta \,||\, \pi_{ref}\right)\Bigg), \\
\mathbb{D}_{KL}\left(\pi_\theta \,||\, \pi_{ref}\right) &= \frac{\pi_{ref}(o_i|q)}{\pi_\theta(o_i|q)} - \log\frac{\pi_{ref}(o_i|q)}{\pi_\theta(o_i|q)} - 1
\end{aligned}$$</div>
<dl class="where" style="font-size:17px">
<dt>$q$, $P(Q)$</dt><dd>a question, drawn from the training questions</dd>
<dt>$o_i$, $G$</dt><dd>the $i$-th of $G$ outputs sampled for that question (a group)</dd>
<dt>$\pi_\theta$, $\pi_{\theta_{old}}$</dt><dd>the policy being trained, and the old policy that sampled the group</dd>
<dt>$\pi_{ref}$</dt><dd>the reference policy</dd>
<dt>$A_i$</dt><dd>the advantage of output $i$, from the group's rewards (sub-slide)</dd>
<dt>$\epsilon$, $\beta$</dt><dd>hyper-parameters: the clip range, and the weight of the KL penalty</dd>
<dt>$\mathbb{D}_{KL}$</dt><dd>the penalty for drifting from $\pi_{ref}$, per output</dd>
</dl>
</div>

<p class="footnote">DeepSeek-AI 2025 · §2.1. For R1-Zero: learning rate 3e-6, KL coefficient 0.001, temperature 1, 16 outputs per question, 32 questions per step</p>

Note:
The paper's objective, as printed, split over three lines of one display. For each question, sample a group of G outputs from the old policy, 16 in R1-Zero. For each output, take the ratio of new to old probability, multiply by the advantage, clip the ratio to the range one minus epsilon to one plus epsilon, and take the smaller of the two. That is the PPO clipped objective. Then subtract beta times a KL term that keeps the policy near a reference policy. The paper says GRPO was introduced to simplify PPO and cut its resource use; it has no separate value model, the advantage comes from the group (next sub-slide). Hyper-parameters the paper gives for R1-Zero: learning rate 3e-6, KL coefficient 0.001, temperature 1 for rollouts, maximum length 32,768 tokens before step 8.2k and 65,536 after, 10,400 steps in total, which is 1.6 epochs, 32 questions per step so a batch of 512, the reference model replaced by the latest policy every 400 steps. For the first stage of R1 the paper prints "the GRPO clip ratio epsilon to 10", and no value is given for R1-Zero. Read as a clip range that is huge next to PPO's usual 0.2 (ours: it may be a typo or a different convention, and the paper does not explain it). The paper adds that the clip ratio plays a crucial role: too low truncates gradients for many tokens, too high can cause instability. Pointer back: Week 4 showed how GRPO's loss itself can lengthen responses, which matters when we look at the length curve later.

--

<p class="eyebrow"><span class="paper">DeepSeek-AI 2025</span> · §2.1 · the advantage · optional</p>

## How does GRPO score each output in a group?

<div class="rows">
<div class="eq">$$A_i = \frac{r_i - \mathrm{mean}(\{r_1, r_2, \cdots, r_G\})}{\mathrm{std}(\{r_1, r_2, \cdots, r_G\})}$$</div>
<dl class="where">
<dt>$A_i$</dt><dd>the advantage of output $o_i$</dd>
<dt>$r_1, \ldots, r_G$</dt><dd>the rewards of the $G$ outputs for the same question</dd>
<dt>mean, std</dt><dd>the average and standard deviation of those $G$ rewards</dd>
</dl>
</div>

<p class="footnote">DeepSeek-AI 2025 · §2.1. Compared with PPO in the appendix (App. A.3, Fig. 3): GRPO has no value model, the group scores give the baseline</p>

Note:
The advantage is each output's reward, minus the group's average reward, divided by the group's standard deviation. An output better than its siblings gets a positive advantage, a worse one a negative advantage. So the baseline comes from the group itself, not from a learned value network. Point at the footnote: the appendix compares PPO and GRPO in a figure. (Ours: if every output in a group gets the same reward, the numerator is zero for all of them, so that question gives no learning signal in that step.)

---

<p class="eyebrow"><span class="paper">DeepSeek-AI 2025</span> · §2.1 · Table 1</p>

## What does the R1-Zero training prompt look like?

<div class="rows">
<table class="rules" style="font-size:19px">
  <tr><td>A conversation between User and Assistant. The user asks a question, and the Assistant solves it. The assistant first thinks about the reasoning process in the mind and then provides the user with the answer. The reasoning process and answer are enclosed within <code>&lt;think&gt;...&lt;/think&gt;</code> and <code>&lt;answer&gt;...&lt;/answer&gt;</code> tags, respectively, i.e., <code>&lt;think&gt;</code> reasoning process here <code>&lt;/think&gt;</code> <code>&lt;answer&gt;</code> answer here <code>&lt;/answer&gt;</code>. User: <i>prompt</i>. Assistant:</td></tr>
</table>
<p class="plain">The prompt only asks for a thinking part, then an answer part.</p>
</div>

<p class="footnote">DeepSeek-AI 2025 · §2.1, Table 1. "prompt" is replaced by the reasoning question during training</p>

Note:
Table 1 as printed. This is the whole template: a short description of a conversation, then the instruction to think first and then answer, with the thinking inside think tags and the answer inside answer tags. The paper says it deliberately limits the constraint to this structural format, with no content-specific bias, so that they can watch the model's natural progression during RL. Point at what is absent: no worked example, no "think step by step", no steps to follow. Compare Wei's exemplars and Kojima's trigger phrase. Training starts from the DeepSeek-V3 base model, with no supervised fine-tuning before the RL.

---

<p class="eyebrow"><span class="paper">DeepSeek-AI 2025</span> · §2.2 · reward design</p>

## What reward does R1-Zero get?

<div class="rows">
<div class="eq">$$Reward_\text{rule} = Reward_\text{acc} + Reward_\text{format}$$</div>
<dl class="where">
<dt>$Reward_\text{acc}$</dt><dd>accuracy: is the final answer correct (a boxed answer is checked by rule; code is run against test cases)</dd>
<dt>$Reward_\text{format}$</dt><dd>format: is the reasoning enclosed in the think tags</dd>
</dl>
<p class="plain">Two rule-based rewards, equal weight; no neural reward model on reasoning tasks.</p>
</div>

<p class="footnote">DeepSeek-AI 2025 · §2.2. Neural reward models are avoided because "susceptible to reward hacking" at scale</p>

Note:
The reward in one line: rule-based accuracy plus rule-based format, combined with the same weight, the paper says. Accuracy: for maths with a deterministic result the model must put the final answer in a specified format, such as a box, so a rule can check it; for code competition prompts a compiler runs the answer against predefined test cases. Format: the reasoning must sit inside the think tags. Pointing out the second half matters: the signal is not only "correct". The paper says it does not use neural reward models, outcome or process, on reasoning tasks, because they are susceptible to reward hacking during large-scale RL and retraining them costs resources. We meet the reward-hacking figure in the optional appendix slides.

---

<p class="eyebrow"><span class="paper">DeepSeek-AI 2025</span> · §2.3 · Fig. 1</p>

## Does R1-Zero improve on AIME as training goes on?

<div class="rows">
<div class="fig"><img src="img/week-08-r1-fig1-aime.png" alt="Fig. 1: left, R1-Zero's AIME pass at 1 and cons at 16 rising over 10,000 training steps, above the human participants line; right, the average response length growing from about 500 to about 13,000 tokens"></div>
<p class="plain">AIME 2024 pass@1 rises from 15.6% to 77.9%; the average response gets steadily longer.</p>
</div>

<p class="footnote">DeepSeek-AI 2025 · Fig. 1. AIME 2024: 30 integer-answer problems from a US high-school maths contest. pass@1: average over sampled answers of whether each is right; cons@16: accuracy of the majority answer</p>

Note:
Figure 1 has two panels. Left: accuracy on AIME 2024 across training steps. The blue curve is pass@1, the average correctness of single sampled answers, which goes from 15.6 percent to 77.9 percent. The red curve is cons@16, the accuracy of the majority answer among the samples, which is the self-consistency idea from Wang's paper; the main text reports 86.7 percent for it. (The appendix also gives 86.7 percent as majority voting on the final R1, from 79.8; the paper does not say whether this is a coincidence or a mix-up.) The green dashed line is the average of human participants. Right: the average response length on the training set rises through the run, with a jump near step 8.2k, which is where the paper raised the maximum length from 32,768 to 65,536 tokens. Caveats (ours): AIME 2024 has 30 problems, so one problem is about 3.3 points, and the many percentage points here come from averaging over samples. Also, the figure and caption say cons@16 while the appendix evaluation section defines the AIME consensus number with 64 samples; the paper does not reconcile them. The length rise is the authors' "more thinking time"; Week 4 showed that the loss itself can lengthen responses, so length alone does not show better reasoning.

---

<p class="eyebrow"><span class="paper">DeepSeek-AI 2025</span> · §2.3 · Table 2</p>

## What is the "aha moment"?

<div class="rows">
<table class="rules" style="font-size:17px; text-align:left">
  <tr><td>Question: If $a \gt 1$, then the sum of the real solutions of $\sqrt{a - \sqrt{a + x}} = x$ is equal to</td></tr>
  <tr><td>Response: <code>&lt;think&gt;</code><br>
  To solve the equation $\sqrt{a - \sqrt{a + x}} = x$, let's start by squaring both $\cdots$<br>
  $\left(\sqrt{a - \sqrt{a + x}}\right)^2 = x^2 \implies a - \sqrt{a + x} = x^2.$<br>
  Rearrange to isolate the inner square root term:<br>
  $(a - x^2)^2 = a + x \implies a^2 - 2ax^2 + (x^2)^2 = a + x \implies x^4 - 2ax^2 - x + (a^2 - a) = 0$<br>
  $\ldots$<br>
  <b>Wait, wait. Wait. That's an aha moment I can flag here</b>.<br>
  Let's reevaluate this step-by-step to identify if the correct sum can be $\cdots$<br>
  We started with the equation: $\sqrt{a - \sqrt{a + x}} = x$<br>
  First, let's square both sides: $a - \sqrt{a + x} = x^2 \implies \sqrt{a + x} = a - x^2$<br>
  Next, I could square both sides again, treating the equation: $\cdots$<br>
  $\ldots$</td></tr>
</table>
</div>

<p class="footnote">DeepSeek-AI 2025 · §2.3, Table 2, as printed (the paper colours the "Wait" line red): "an intermediate version of DeepSeek-R1-Zero"; the model "learns to rethink using an anthropomorphic tone"</p>

Note:
Table 2, retyped as printed, including the paper's own cuts marked with dots. Point at the passage in the middle: "Wait, wait. Wait. That's an aha moment I can flag here", and then the model restarts the derivation from the original equation. The paper's reading: this is an intermediate version of R1-Zero, the model learns to rethink, and the "wait" use shows a sudden increase during training; the paper shows the count of reflective words in an appendix figure. Be careful with what the table shows (ours): the excerpt is cut before the "wait", and in the lines printed there is no visible slip, since the first squaring step is correct. So the table by itself does not show a mistake being caught. That the model "learns to re-evaluate" is the authors' reading of one chosen example plus a word-frequency curve, and we found no result in the paper on whether the answers after a "wait" are more often right.

---

<p class="eyebrow"><span class="paper">DeepSeek-AI 2025</span> · §3 · Fig. 2</p>

## How is DeepSeek-R1 trained, step by step?

<div class="rows">
<div class="fig"><img src="img/week-08-r1-fig2-pipeline.png" alt="Fig. 2: the multi-stage pipeline: R1-Zero by RL on reasoning prompts, then cold-start SFT giving Dev-1, RL with rule-based and language consistency rewards giving Dev-2, sampling and SFT giving Dev-3, and a final RL with rule-based and preference rewards giving R1"></div>
<p class="plain">R1-Zero first; then cold-start fine-tuning, reasoning RL, more fine-tuning, and a final RL stage.</p>
</div>

<p class="footnote">DeepSeek-AI 2025 · Fig. 2. SFT: supervised fine-tuning on written examples; CoT: chain of thought. Dev-1, Dev-2, Dev-3 are intermediate checkpoints</p>

Note:
Figure 2 from left to right. Why a second recipe: R1-Zero reasons well but has poor readability and mixes languages, because the base model is trained on both English and Chinese, and it is narrow. Left column: R1-Zero, from DeepSeek-V3 base with RL on reasoning prompts and accuracy and format rewards. Its samples are filtered and refined, with DeepSeek-V3 and humans, into cold-start data. Middle column: the V3 base is fine-tuned on thousands of cold-start long chain-of-thought examples, giving Dev-1; then RL with rule-based reward and a language consistency reward gives Dev-2. Right column: sampling from Dev-2 gives reasoning data, together with non-reasoning data from V3, for fine-tuning the base again, giving Dev-3; the last RL stage uses diverse prompts with rule-based and preference rewards and gives R1. Note that the pipeline mixes RL and human-aligned supervised data, so the final model is not "pure RL"; the paper says so in its discussion, calling both RL and supervised fine-tuning indispensable.

---

<p class="eyebrow"><span class="paper">DeepSeek-AI 2025</span> · §3.1 · model-based rewards</p>

## What rewards does R1 use beyond the rules?

<div class="rows">
<div class="eq">$$\begin{aligned} Reward_{helpful} &= RM_{helpful}(Response_A, Response_B) \\ Reward_{safety} &= RM_{safety}(Response) \end{aligned}$$</div>
<dl class="where">
<dt>$RM_{helpful}$</dt><dd>reward model trained on 66,000 preference pairs; judges the final summary only</dd>
<dt>$RM_{safety}$</dt><dd>reward model trained point-wise on 106,000 prompts labelled safe or unsafe; judges the whole response, reasoning included</dd>
<dt>$Response_A$, $Response_B$</dt><dd>the two candidate answers of a preference pair</dd>
</dl>
</div>

<p class="footnote">DeepSeek-AI 2025 · §3.1. Helpfulness pairs are labelled by DeepSeek-V3, four judgments averaged, kept if the score gap exceeds 1</p>

Note:
For general data, where no rule can check an answer, R1 uses reward models. The helpful reward model is trained on preference pairs that DeepSeek-V3 labels: each pair is judged four times with the order swapped at random, the four scores are averaged, and only pairs with a gap above 1 are kept. The helpfulness model sees only the final summary, so the reasoning is not interfered with. The safety reward model is point-wise, safe versus unsafe, and sees the entire response. In the second RL stage the total reward adds the reasoning reward, the general reward and a language reward, the proportion of target-language words in the chain of thought (the paper says it slightly lowers performance but is more readable). The preference rewards are used only in the last 400 of 1,700 steps, because longer use led to reward hacking, which the paper documents in the appendix.

---

<p class="eyebrow"><span class="paper">DeepSeek-AI 2025</span> · §4 · Table 3</p>

## How good is each stage?

<div class="rows">
<table class="rules tight" style="font-size:17px">
  <tr><td>benchmark (metric)</td><td>R1-Zero</td><td>R1-Dev1</td><td>R1-Dev2</td><td>R1-Dev3</td><td>R1</td></tr>
  <tr><td>AIME 2024 (pass@1)</td><td>77.9</td><td>59.0</td><td>74.0</td><td>78.1</td><td><b>79.8</b></td></tr>
  <tr><td>MATH-500 (pass@1)</td><td>95.9</td><td>94.2</td><td>95.9</td><td>95.4</td><td><b>97.3</b></td></tr>
  <tr><td>GPQA Diamond (pass@1)</td><td><b>75.8</b></td><td>66.1</td><td>70.7</td><td>71.2</td><td>71.5</td></tr>
  <tr><td>LiveCodeBench (pass@1-COT)</td><td>50.0</td><td>57.5</td><td>63.5</td><td>64.6</td><td><b>65.9</b></td></tr>
  <tr><td>Codeforces (rating)</td><td>1444</td><td>1534</td><td>1687</td><td>1746</td><td><b>2029</b></td></tr>
  <tr><td>IF-Eval (prompt strict)</td><td>46.6</td><td>71.7</td><td>72.0</td><td>78.1</td><td><b>83.3</b></td></tr>
  <tr><td>AlpacaEval 2.0 (LC-winrate)</td><td>24.7</td><td>50.1</td><td>55.8</td><td>62.1</td><td><b>87.6</b></td></tr>
  <tr><td>ArenaHard (GPT-4-1106)</td><td>53.6</td><td>77.0</td><td>73.2</td><td>75.6</td><td><b>92.3</b></td></tr>
</table>
</div>

<p class="footnote">DeepSeek-AI 2025 · Table 3, paper's bold (t-test, p &lt; 0.01); rows shown: 8 of 21. MATH-500: 500 competition maths problems; GPQA Diamond: hard graduate science questions; LiveCodeBench: fresh programming problems; Codeforces: online contests, rating is Elo-style; IF-Eval: following format instructions; AlpacaEval 2.0, ArenaHard: judged open-ended chat</p>

Note:
Table 3 with the rows we need; the full table has 21 rows, including the knowledge, Chinese and software engineering sets. Read it along the pipeline. R1-Zero is strong on maths and weak at instruction following: IF-Eval 46.6, ArenaHard 53.6. Dev1, the cold-start step, fixes instruction following, but the paper says it partly degrades reasoning because the cold-start set is small: AIME drops from 77.9 to 59.0. Dev2, after reasoning RL, recovers: AIME 74.0, Codeforces 1687. Dev3, with the 800K supervised mix, helps chat and Aider-Polyglot. The final RL stage gives R1: AIME 79.8, MATH-500 97.3, and the main gains in instruction following and preference benchmarks, AlpacaEval 2.0 up 25 percent and ArenaHard up 17 percent in the paper's words. Two things to point at (ours): R1-Zero is bold and best on GPQA Diamond, 75.8 against 71.5, and the AIME difference between Zero and R1, 77.9 against 79.8, is about half of one problem in 30. The bold marks the paper's significance test, not simply the best number.

---

<p class="eyebrow"><span class="paper">DeepSeek-AI 2025</span> · §6 · limitations</p>

## What does the paper say R1 cannot do yet?

<div class="rows">
<ul>
<li><b>Token efficiency:</b> "overthinking" still occurs on simpler questions.</li>
<li><b>Language mixing:</b> tuned for Chinese and English; it may reason in English for other languages.</li>
<li><b>Prompting:</b> few-shot prompts consistently degrade it; use zero-shot.</li>
<li><b>Reward hacking:</b> pure RL needs a reliable reward; a model-assigned reward is easier to exploit.</li>
</ul>
</div>

<p class="footnote">DeepSeek-AI 2025 · §6. Also listed: weak structured output and no tool use; little RL on software engineering tasks</p>

Note:
Section 6 states its limitations under two headings: capability limitations and the challenges of the pure RL method. Capability: structured output and tool use are weaker, and R1 cannot call search or a calculator; token efficiency, where instead of a fixed budget like majority voting it adapts, fewer tokens for easy questions and more for hard, but still overthinks easy ones; language mixing; prompt sensitivity, where few-shot prompting consistently degrades performance, the opposite of the Wei result; and software engineering, where long evaluation times kept RL from being applied widely, so there is no large gain over V3. Method: reward hacking. Pure RL depends on a reliable reward, which is easy to build for maths and code and hard for writing; for tasks without a reliable signal, R1 uses human-annotated supervised data and only hundreds of RL steps. The paper's closing view is that pure RL holds immense potential for any task that a verifier can effectively evaluate.

---

<p class="eyebrow"><span class="paper">DeepSeek-AI 2025</span> · App. F · Table 15</p>

## Can the reasoning be moved into small models?

<div class="rows">
<table class="rules tight" style="font-size:18px">
  <tr><td>model</td><td>AIME 2024 pass@1</td><td>AIME 2024 cons@64</td><td>MATH-500 pass@1</td><td>GPQA Diamond pass@1</td><td>LiveCodeBench pass@1</td><td>Codeforces rating</td></tr>
  <tr><td>GPT-4o-0513</td><td>9.3</td><td>13.4</td><td>74.6</td><td>49.9</td><td>32.9</td><td>759</td></tr>
  <tr><td>Claude-3.5-Sonnet-1022</td><td>16.0</td><td>26.7</td><td>78.3</td><td>65.0</td><td>38.9</td><td>717</td></tr>
  <tr><td>R1-Distill-Qwen-1.5B</td><td>28.9</td><td>52.7</td><td>83.9</td><td>33.8</td><td>16.9</td><td>954</td></tr>
  <tr><td>R1-Distill-Qwen-7B</td><td>55.5</td><td>83.3</td><td>92.8</td><td>49.1</td><td>37.6</td><td>1189</td></tr>
  <tr><td>R1-Distill-Qwen-14B</td><td>69.7</td><td>80.0</td><td>93.9</td><td>59.1</td><td>53.1</td><td>1481</td></tr>
  <tr><td>R1-Distill-Qwen-32B</td><td><b>72.6</b></td><td>83.3</td><td>94.3</td><td>62.1</td><td>57.2</td><td>1691</td></tr>
  <tr><td>R1-Distill-Llama-8B</td><td>50.4</td><td>80.0</td><td>89.1</td><td>49.0</td><td>39.6</td><td>1205</td></tr>
  <tr><td>R1-Distill-Llama-70B</td><td>70.0</td><td><b>86.7</b></td><td><b>94.5</b></td><td><b>65.2</b></td><td><b>57.5</b></td><td><b>1633</b></td></tr>
</table>
</div>

<p class="footnote">DeepSeek-AI 2025 · App. F, Table 15, paper's bold (t-test). AIME 2024: 30 maths problems; cons@64: majority of 64 samples; MATH-500: 500 maths problems; GPQA Diamond: graduate science; LiveCodeBench: fresh code problems; Codeforces: contest rating</p>

Note:
Table 15, all rows, as printed. The distilled models are the smaller Qwen and Llama models fine-tuned on outputs of R1, with no RL of their own; the paper calls this straightforward distillation. Point at the first two rows, GPT-4o and Claude 3.5 Sonnet, as baselines, then read down the Qwen rows: performance rises with the size of the student. The 1.5B model beats both baselines on MATH-500, 83.9 against 74.6 and 78.3, but not on GPQA Diamond or LiveCodeBench. The paper's comparison in the next table, Table 16, finds that distilling into Qwen-32B beats running RL on that same base: AIME 72.6 against 47.0; the authors recommend that future work validate pure RL on sufficiently large models. (Ours: the distilled models learn from R1's outputs, so this table says what transfers, not whether small models can discover reasoning by RL.)

--

<p class="eyebrow"><span class="paper">DeepSeek-AI 2025</span> · App. G.2 · unsuccessful attempts · optional</p>

## What did the authors try that did not work?

<div class="rows">
<ul>
<li><b>Process reward model:</b> hard to define a fine-grained step, hard to judge a step, and a model-based reward invites reward hacking.</li>
<li><b>Monte Carlo tree search:</b> the search space of token generation is exponentially larger than a game's, and a fine-grained value model is hard to train.</li>
</ul>
</div>

<p class="footnote">DeepSeek-AI 2025 · App. G.2. Process reward model: scores each reasoning step; Monte Carlo tree search: explores branching continuations, as in AlphaGo</p>

Note:
The authors share failed attempts, and say this does not mean the approaches cannot work. Process reward models: three limits. It is hard to define a step in general reasoning; judging whether an intermediate step is right is hard, since automatic annotation is not satisfactory and manual annotation does not scale; and a model-based reward invites reward hacking and needs retraining. They say a process reward model can rerank top responses or guide search, but its benefit is limited against the extra cost in large-scale RL. Monte Carlo tree search, inspired by AlphaGo: they broke answers into parts, guided search with a value model and trained actor and value models on the results. Two problems: token generation has an exponentially larger search space, so capping the branches per node led to local optima; and training a good fine-grained value model is hard. Their conclusion: search helps at inference with a pre-trained value model, but iteratively improving through self-search is a challenge. No numbers are given for either attempt (ours).

--

<p class="eyebrow"><span class="paper">DeepSeek-AI 2025</span> · App. B.5 · Fig. 6 · optional</p>

## What does reward hacking look like in R1's training?

<div class="rows">
<div class="fig"><img src="img/week-08-r1-fig6-hacking.png" alt="Fig. 6: over 700 training steps the reward score (blue) rises while Codeforces test pass at 1 (red) falls from about 0.34 to about 0.29"></div>
<p class="plain">The reward keeps rising while the Codeforces score falls.</p>
</div>

<p class="footnote">DeepSeek-AI 2025 · App. B.5, Fig. 6, with the helpful reward model. Codeforces: online programming contests</p>

Note:
Figure 6. The blue curve is the reward the model receives, the red curve is the pass@1 on Codeforces, on the right-hand axis. Over about 700 steps the reward drifts upward, while the Codeforces score falls, to roughly 0.29 at the end from about 0.34 earlier. The paper defines reward hacking as exploiting flaws or biases in the reward function to get a high score without matching human intent, and says it observed it with the helpful reward model. This is why the final RL stage uses the preference rewards for only the last 400 steps. The reward line is noisy, and (ours) the Codeforces points are few and also noisy, so the drop is clearest at the final point.

--

<p class="eyebrow"><span class="paper">DeepSeek-AI 2025</span> · App. B.6 · Fig. 7 · optional</p>

## What does the language consistency reward trade away?

<div class="rows">
<div class="fig"><img src="img/week-08-r1-fig7-lc.png" alt="Fig. 7: three panels over 5,000 steps: the language consistency reward stays near 0.99 with the reward and falls to about 0.87 without it; LiveCodeBench pass at 1 ends near 0.49 with and 0.51 without; AIME accuracy is similar for both"></div>
<p class="plain">With the reward the language stays consistent; coding is slightly lower, maths about the same.</p>
</div>

<p class="footnote">DeepSeek-AI 2025 · App. B.6, Fig. 7, on a distilled 7B model. LiveCodeBench: fresh programming problems; AIME: maths contest</p>

Note:
Figure 7, from the ablation on DeepSeek-R1-Distill-Qwen-7B, which uses the same cold-start data and also mixes languages. Left panel: without the language consistency reward, the proportion of target-language words falls over training, to about 0.87 by step 5,000, with the reward it stays near 0.99. Middle: LiveCodeBench is a little lower with the reward, and right: AIME is comparable. The paper says the reward costs a slight degradation on coding but makes the output more readable and aligns with human preferences. (Ours: the curves are noisy and the gaps are small except on the language curve.)

--

<p class="eyebrow"><span class="paper">DeepSeek-AI 2025</span> · App. D.2 · Table 8 · optional</p>

## How does R1 compare with other models?

<div class="rows">
<table class="rules tight" style="font-size:18px">
  <tr><td>benchmark (metric)</td><td>Claude-3.5-Sonnet-1022</td><td>GPT-4o 0513</td><td>DeepSeek V3</td><td>OpenAI o1-mini</td><td>OpenAI o1-1217</td><td>DeepSeek R1</td></tr>
  <tr><td>MMLU (EM)</td><td>88.3</td><td>87.2</td><td>88.5</td><td>85.2</td><td><b>91.8</b></td><td>90.8</td></tr>
  <tr><td>GPQA Diamond (pass@1)</td><td>65.0</td><td>49.9</td><td>59.1</td><td>60.0</td><td><b>75.7</b></td><td>71.5</td></tr>
  <tr><td>LiveCodeBench (pass@1-COT)</td><td>38.9</td><td>32.9</td><td>36.2</td><td>53.8</td><td>63.4</td><td><b>65.9</b></td></tr>
  <tr><td>Codeforces (rating)</td><td>717</td><td>759</td><td>1134</td><td>1820</td><td>2061</td><td>2029</td></tr>
  <tr><td>SWE Verified (resolved)</td><td><b>50.8</b></td><td>38.8</td><td>42.0</td><td>41.6</td><td>48.9</td><td>49.2</td></tr>
  <tr><td>AIME 2024 (pass@1)</td><td>16.0</td><td>9.3</td><td>39.2</td><td>63.6</td><td>79.2</td><td>79.8</td></tr>
  <tr><td>MATH-500 (pass@1)</td><td>78.3</td><td>74.6</td><td>90.2</td><td>90.0</td><td>96.4</td><td>97.3</td></tr>
</table>
</div>

<p class="footnote">DeepSeek-AI 2025 · App. D.2, Table 8, paper's bold; rows shown: 7 of 21. MMLU: 57-subject exam; SWE Verified: fixing real software issues; other sets as on the earlier slides</p>

Note:
Table 8 with seven of its 21 benchmark rows. Read the right two columns: OpenAI o1-1217 against R1. The paper says R1 is on par with o1-1217 on maths and surpasses other models by a large margin: AIME 79.8 against 79.2, MATH-500 97.3 against 96.4, LiveCodeBench 65.9 against 63.4, but o1-1217 is ahead on MMLU, GPQA Diamond and Codeforces rating, 2061 against 2029. Bold marks the paper's significance test, which is why R1's AIME is not bold even though it is the highest number. OpenAI's numbers are taken from official reports, since the API was hard to reach (the paper's remark), so they were not rerun in the authors' own pipeline. DeepSeek V3, the base of R1, is the "before" column: AIME 39.2 to 79.8.


---


<p class="eyebrow"><span class="paper">Week 8</span> · closing · the readings side by side</p>

## What did each reading change, and what did it buy?

<div class="rows">

<table class="rules tight" style="font-size:18px">
  <tr><td>reading</td><td>what changes</td><td>extra cost</td><td>headline result</td></tr>
  <tr><td>Wei et al. 2022</td><td>exemplars in the prompt</td><td>a longer answer</td><td>PaLM 540B, GSM8K: 17.9 ▸ 56.9</td></tr>
  <tr><td>Kojima et al. 2022</td><td>one trigger sentence</td><td>a second call</td><td>text-davinci-002, MultiArith: 17.7 ▸ 78.7</td></tr>
  <tr><td>Wang et al. 2022</td><td>decoding: sample, vote</td><td>many sampled paths</td><td>PaLM 540B, GSM8K: 56.5 ▸ 74.4</td></tr>
  <tr><td>Chen et al. 2023</td><td>selection: the model picks</td><td>samples plus one call</td><td>PaLM 2-L, GSM8K: 90.2, against the vote's 90.4</td></tr>
  <tr><td>Yao et al. 2022</td><td>the loop: thought, action</td><td>tool calls</td><td>FEVER: 60.9; 64.6 with a vote fallback</td></tr>
  <tr class="total"><td>DeepSeek-AI 2025</td><td>the weights, by RL training</td><td>training, long answers</td><td>R1-Zero, AIME 2024: 15.6 ▸ 77.9</td></tr>
</table>

</div>

<p class="footnote">Table ours, numbers from Wei App. B Table 2, Kojima Table 1, Wang Table 2, Chen Table 1, Yao Table 1, R1 §2.3. Accuracy in percent; RL: reinforcement learning. GSM8K, MultiArith: maths word problems; FEVER: fact checking against Wikipedia; AIME 2024: 30 competition maths problems</p>

Note:
One table to close, ours, with each paper's own headline number. Read it down the second column: each reading moves the extra work to a different place. Wei changes what is in the prompt; Kojima replaces the worked examples with one sentence and pays a second call to pull the answer out; Wang changes the decoding, sampling many paths and voting, which multiplies the cost by the number of samples; Chen keeps the samples but lets the model choose among them, which works when answers are free text; ReAct changes the loop, letting the model act between thoughts; and R1 changes the weights, so the long reasoning is in the model rather than the prompt, at the price of training and of very long answers. None of these headlines is cost-matched against the others (ours); the comparison is what each paper reports against its own baseline.

---

<p class="eyebrow"><span class="paper">Week 8</span> · closing · discussion</p>

## What should we argue about?

<div class="rows">

<ol class="points" style="grid-template-columns: 1fr; font-size:21px">
  <li>Plaat: the map has generate, evaluate and control. What would a fourth stage, training the model, add?</li>
  <li>Wei: the variable-compute ablation replaces the chain with dots as long as the equation. What result would change your mind about why chains help?</li>
  <li>Kojima: why might one fixed sentence work at 175B and not at 6.7B?</li>
  <li>Wang: if most sampled chains make the same mistake, the vote picks it. What could detect a shared error?</li>
  <li>Chen: when is "the most consistent answer" the wrong thing to pick?</li>
  <li>Yao: when should a model stop thinking and look something up?</li>
  <li>R1: if the base model already samples a right chain when asked many times, what did reinforcement learning add?</li>
</ol>

</div>

Note:
One question per reading, for discussion rather than for answers. The survey's three stages all happen at inference time; R1 suggests a fourth, changing the weights. Wei's variable-compute ablation prompts for dots equal in number to the characters in the needed equation, and performs about the same as the baseline; the paper concludes that extra compute alone is not the reason chains help. Ask what evidence would show the chain's content, not just its presence, matters. Kojima reports that chain of thought is not effective on smaller models; the scale curves run from 0.3B to 175B for Original GPT-3. Self-consistency assumes wrong chains scatter; ask what happens when they agree. Chen's selection asks the model which answer is most consistent, which is not always the right answer. (Ours) In Chen, USC on PaLM 2-L is within 0.2 of the vote on GSM8K. ReAct lets the model decide inside the prompt when to search. And R1: reinforcement learning may sharpen what the base model could already sample rather than teach something new; the paper does not measure that.

