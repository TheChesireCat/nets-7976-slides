
<p class="eyebrow"><span class="paper">RLHF, PPO and GRPO</span> · roadmap</p>

## What will this hour cover?

<div class="cols wide-text">
<div class="text">

<table class="rules">
  <tr><td>part</td><td>the question it answers</td></tr>
  <tr><td>1. Motivation, RL basics</td><td>why is copying answers not enough?</td></tr>
  <tr><td>2. SFT and the reward model</td><td>how do rankings become a score?</td></tr>
  <tr><td>3. PPO's parts</td><td>which four models run, and what do they compute?</td></tr>
  <tr><td>4. PPO's objective</td><td>how does a score become a gradient?</td></tr>
  <tr><td>5. GRPO</td><td>what if we drop the value model?</td></tr>
  <tr><td>6. Which to use</td><td>when does each fit?</td></tr>
</table>

</div>
<div class="text">

- Top down: intuition first, then the math, then one training step of each method.
- Same story as Week 4's InstructGPT, PPO and GRPO readings, told as one pipeline.

<dl class="where">
<dt>$q$, $o$</dt><dd>the prompt (question) and the model's output (answer)</dd>
<dt>$o_t$</dt><dd>token $t$ of the answer; $o_{\lt t}$ the tokens before it</dd>
</dl>

</div>
</div>

<p class="footnote">The letters follow the GRPO paper (Shao et al. 2024, arXiv:2402.03300). Week 4 reads InstructGPT, PPO and GRPO one paper at a time</p>

Note:
This deck is a top-down guide to RLHF: why it is needed, how it works, and where PPO and GRPO fit. We start from the intuition, connect it to the math, then walk through one step of the training loop for each method.
The same material is in the Week 4 deck as three readings: InstructGPT, PPO and GRPO. Here they are told as one pipeline; checks, worked numbers and caveats from Week 4 sit on optional sub-slides below the main slides. The letters: q is the prompt, o the answer, o t its token t; these are the GRPO paper's letters, used throughout.

---

<p class="eyebrow"><span class="paper">RLHF, PPO and GRPO</span> · Part 1, motivation</p>

## Why is supervised fine-tuning alone not enough?

<div class="cols wide-fig">
<div class="text">

- **SFT** (supervised fine-tuning) teaches the model to copy one reference answer.
- It never shows two answers side by side.
- To be helpful, honest and harmless, the model must learn which answer people prefer.
- Learning from comparisons is the motivation for **RLHF** (RL from human feedback).

<p class="q"><b>Q.</b> When is a comparison easier to get than a demonstration?</p>
<p class="a"><b>A.</b> When many answers are good, or judging is easier than writing</p>

</div>
<div class="fig"><img src="img/week-04-rlhf-sft-pref.svg" alt="Illustration: left, what SFT gives: a prompt and one reference answer, copy this. Right, what preference learning needs: a prompt and two answers, A versus B, and a person prefers A"></div>
</div>

<p class="footnote">Helpful, honest, harmless: InstructGPT's three goals (Ouyang et al. 2022 §1, after Askell et al. 2021)</p>

Note:
In supervised fine-tuning we give the model a prompt together with a single reference answer and train it to reproduce that answer token by token. The only signal is essentially "copy this". That's useful, but notice what it leaves out: SFT only ever shows one good answer per problem. It never shows a comparison, so it can teach the model to imitate a demonstration but not to judge which answer is better.
What we actually need: given the same prompt and two candidate answers A and B, the model should learn that people prefer A over B. To make a model more helpful, honest and safe, we need preference feedback, learning from comparisons rather than demonstrations. That is the core motivation for RLHF, and it brings us to reinforcement learning.

---

<p class="eyebrow"><span class="paper">RLHF, PPO and GRPO</span> · Part 1, motivation</p>

## What is reinforcement learning?

<div class="cols wide-fig">
<div class="text">

- An **agent** learns by acting in an **environment** and getting rewards or penalties.
- In state $s$ it takes action $a$; it gets a **reward** $r$, a number, and a new state $s'$.
- The goal: behaviour that maximises the total reward over time.

<p class="q"><b>Q.</b> What does RL have that SFT lacks?</p>
<p class="a"><b>A.</b> A score for the model's own action, not a label to copy</p>

</div>
<div class="fig"><img src="img/week-04-ppo-agent.svg" alt="Illustration: the policy, the agent, sends an action to the environment; the environment returns the next state and a reward"></div>
</div>

<p class="footnote">Figure from the Week 4 PPO section, which writes the reward $R_t$; here it is $r$</p>

Note:
Reinforcement learning is close to how we learn as people: since we were babies we've learned by interacting with the world, trying things, seeing the results, and gradually learning which actions lead to better outcomes. More formally, it's a kind of machine learning in which an agent learns to make good decisions by interacting with an environment and receiving feedback as rewards or penalties.
The loop: starting from a state s, the agent takes an action a. The environment returns a reward r and moves to a new state s prime. From s prime the agent picks the next action, and the loop repeats. The goal is a behaviour that maximises the total reward accumulated over time.

---

<p class="eyebrow"><span class="paper">RLHF, PPO and GRPO</span> · Part 1, motivation</p>

## What are the key RL terms?

<table class="rules">
  <tr><td>term</td><td>what it is</td><td>later, in PPO</td></tr>
  <tr><td><b>policy</b></td><td>how the agent chooses actions</td><td>the language model, $\pi_\theta$</td></tr>
  <tr><td><b>trajectory</b> / <b>rollout</b></td><td>the sequence of states, actions and rewards / the act of sampling one from the current policy</td><td>one sampled answer</td></tr>
  <tr><td><b>return</b></td><td>the total future reward from a step onward</td><td>$G_t$, what we maximise</td></tr>
  <tr><td><b>value</b></td><td>the expected return from a state: how good things look from here</td><td>the value model, $V_\psi$</td></tr>
  <tr><td><b>advantage</b></td><td>how much better or worse an action turned out than the state's expected value</td><td>$\hat A_t$, the weight on each token</td></tr>
</table>

<p class="q"><b>Q.</b> Value or advantage: which one judges a single action?</p>
<p class="a"><b>A.</b> The advantage; the value judges the state before the action is chosen</p>

<p class="footnote">Return, value and advantage get their equations in Parts 3 and 4</p>

Note:
Five words before we map RL onto language models. The policy describes how the agent chooses actions. A trajectory is the sequence of states, actions and rewards produced as the agent interacts with the environment; a rollout is a trajectory generated by running the current policy, so trajectory names the sequence and rollout stresses the sampling. The return is the total future reward from a given point onward, the quantity the agent ultimately wants to maximise. The value of a state is the expected future reward from that state: how good we expect things to be from here. And the advantage says whether a particular action was better or worse than what we expected from that state. The advantage is the word to remember: it is what PPO and GRPO multiply each token's gradient by.

---

<p class="eyebrow"><span class="paper">RLHF, PPO and GRPO</span> · Part 1, motivation</p>

## How is a language model an RL agent?

<div class="cols wide-fig">
<div class="text">

- The **policy** is the language model itself: a distribution over the next token.
- The **state** is the prompt plus the tokens generated so far.
- The **action** is the next token, sampled from the model.
- Appending the token gives the next state, so generation is a sequence of decisions.

<p class="q"><b>Q.</b> What is random in this environment?</p>
<p class="a"><b>A.</b> Nothing: appending a token is deterministic; only the policy samples</p>

</div>
<div class="fig"><img src="img/week-04-rlhf-shanghai.svg" alt="Illustration: the state Where is Shanghai? Shanghai is in goes into the LLM, which gives the next token China probability 0.78, Asia 0.08, Jiangsu 0.05, city 0.03; sampling China appends it to give the next state"></div>
</div>

<p class="footnote">Words drawn as single tokens for simplicity; real tokens can be whole words, pieces of words, punctuation or white space</p>

Note:
In LLM reinforcement learning the policy is the language model itself: given the current context it defines a probability distribution over the next token. The state is the prompt together with the tokens generated so far, the context the model sees. The action is the next token sampled from the model.
Example: the prompt is "Where is Shanghai?" and the model has already written "Shanghai is in". That whole context is the state, and the next action could be "China", with probability 0.78. After it's chosen the state changes: the prefix now includes "China", and the model uses the new context to choose the next token.
One clarification: tokens are drawn as whole words only for simplicity. In real models a token can be a word, part of a word, punctuation or even white space; conceptually the RL formulation is the same. In RLHF we optimise this policy so that its answers receive higher rewards.

---

<p class="eyebrow"><span class="paper">RLHF, PPO and GRPO</span> · Part 1, motivation · Ouyang et al. 2022, Fig. 2</p>

## What are RLHF's three stages?

<div class="rows">
<div class="points">
<div class="text">

- **Stage 1, SFT**: collect demonstrations and fine-tune a supervised policy.
- **Stage 2, reward model**: people rank answers to the same prompt; a model learns to predict the preferred one.

</div>
<div class="text">

- **Stage 3, RL**: optimise the policy against the reward model, so its answers score higher.
- This is OpenAI's InstructGPT pipeline; Parts 2 to 5 take the stages one at a time.

</div>
</div>
<div class="fig"><img src="img/week-04-igpt-fig2.png" alt="Ouyang et al. Figure 2: three steps. Step 1: a prompt, Explain the moon landing to a 6 year old, a labeler writes the desired output, and the data fine-tunes GPT-3 into an SFT model. Step 2: several model outputs A to D for the same prompt, a labeler ranks them D above C above A equal to B, and the ranking trains a reward model. Step 3: a new prompt, Write a story about frogs, the PPO policy writes an output, the reward model gives a reward r k, and the reward updates the policy"></div>
</div>

<p class="footnote">Ouyang et al. 2022, "Training language models to follow instructions with human feedback", arXiv:2203.02155, Fig. 2. Week 4 reads it as "PPO, applied"</p>

Note:
How do we usually apply RL to language models? The classic example is InstructGPT from OpenAI, which introduced the RLHF pipeline for aligning language models. It has three stages. First, supervised fine-tuning: collect demonstration data and train a supervised policy. Second, reward modelling: collect comparison data, where people compare different answers to the same prompt, and train a reward model to predict which answer is preferred. Third, reinforcement learning: optimise the policy against the reward model, so it learns to write answers that get higher preference scores.
The figure is the paper's own. Note step 2's prompt, "Explain the moon landing to a 6 year old": it comes back as the ranking example in Part 2.

---

<p class="eyebrow"><span class="paper">RLHF, PPO and GRPO</span> · Part 2, SFT and reward model</p>

## How does SFT differ from pre-training?

<table class="rules">
  <tr><td></td><td>pre-training</td><td>supervised fine-tuning (SFT)</td></tr>
  <tr><td>data</td><td>a huge mix of raw text: web pages, books, code, articles</td><td>curated pairs: prompt $q$, target answer $o$</td></tr>
  <tr><td>objective</td><td>predict the next token from the previous ones</td><td>the same, teacher-forced on the reference answer</td></tr>
  <tr><td>loss counted on</td><td>every token</td><td>the answer's tokens only; the prompt is masked</td></tr>
  <tr><td>what it buys</td><td>knowledge and fluency</td><td>the habit of answering and following instructions</td></tr>
</table>

<p class="q"><b>Q.</b> If the objective is the same, what makes SFT change the model's behaviour?</p>
<p class="a"><b>A.</b> The data: every example is a prompt followed by a good answer</p>

<p class="footnote">InstructGPT's SFT data: about 13,000 training prompts with labeler-written answers (Ouyang et al. 2022 §3.2, Table 6)</p>

Note:
Most of us already know pre-training and SFT. In pre-training the model sees a very large collection of text, web pages, books, code, articles, and the objective is simple: given the previous tokens, predict the next one. SFT is teacher-forced next-token prediction on a reference answer: the same objective, but the data is prompt and answer pairs instead of arbitrary text. The goal is to make the model more useful as an assistant, teaching it how to answer questions and follow instructions. The one mechanical difference, next slide: the loss is computed only on the answer.

---

<p class="eyebrow"><span class="paper">RLHF, PPO and GRPO</span> · Part 2, SFT and reward model · the policy's head</p>

## How does SFT train on one answer?

<div class="cols wide-fig">
<div class="text">

<div class="eq">$$L_{\rm SFT}(\theta) = -\sum_{t=1}^{T}\log\pi_\theta(o_t \mid q, o_{\lt t})$$</div>

<dl class="where">
<dt>$q$, $o$</dt><dd>the prompt and the reference answer, $o = (o_1, \dots, o_T)$</dd>
<dt>$\pi_\theta$</dt><dd>the model's next-token probability; $\theta$ its weights</dd>
<dt>$T$</dt><dd>the answer's length in tokens, the last one EOS (end of sequence)</dd>
</dl>

- **Teacher forcing**: the targets are the inputs shifted by one, and the model always sees the true previous tokens.
- The sum runs over answer tokens only: the prompt is context, masked out of the loss.

</div>
<div class="fig"><img src="img/week-04-rlhf-heads-policy.svg" alt="Illustration: inputs q1 to q4 and o1 to o3 go into an LLM backbone with a language-model head on top; the targets are q2, q3, q4, o1, o2, o3, EOS; the three prompt targets are greyed out as masked, no loss; the four answer targets carry the loss"></div>
</div>

<p class="footnote">The cross-entropy (negative log-likelihood) of the target tokens. Language-model head: the last layer, which turns each position's hidden state into scores over the vocabulary</p>

Note:
Suppose q is the prompt and o the target answer. We concatenate their tokens and feed the whole sequence into the model. At each position the model predicts the next token, so the target sequence is the input shifted by one. That shifted setup is what teacher forcing means: at every position the model is shown the true previous token from the reference answer, not its own previous prediction, so even if it would have generated a different token, training continues along the reference.
The loss is the standard cross-entropy, the negative log-likelihood of the target tokens: at each position the model gives a distribution over the vocabulary, and we want high probability on the correct next token. The difference from pre-training: the loss counts only the answer's tokens. The prompt tokens are used as context but masked out. So the SFT loss teaches the model to generate the target answer conditioned on the prompt.
Keep the picture: one backbone, a head that scores the vocabulary at every position. The reward model and the value model are the same picture with the head swapped.

---

<p class="eyebrow"><span class="paper">RLHF, PPO and GRPO</span> · Part 2, SFT and reward model · Ouyang et al. 2022 §3.5</p>

## How do you collect preference data?

<div class="cols">
<div class="text">

- Sample several answers to one prompt, from one model at nonzero temperature or from several models.
- A person ranks them from best to worst.
- A ranking of $K$ answers gives $\binom K2$ pairs, each saying which answer won.
- In practice $K$ is small: InstructGPT ranked 4 to 9.

<p class="q"><b>Q.</b> How many pairs does a ranking of 9 give?</p>
<p class="a"><b>A.</b> $\binom 92 = 36$</p>

</div>
<div class="text">

<p class="plain">"Explain the moon landing to a 6-year-old." Answers A to D, ranked <b>C &gt; A &gt; D &gt; B</b>:</p>

<table class="rules nohead">
  <tr><td>C &gt; A</td><td>C &gt; D</td><td>C &gt; B</td></tr>
  <tr><td>A &gt; D</td><td>A &gt; B</td><td>D &gt; B</td></tr>
</table>

<p class="plain">$\binom 42 = 6$ pairwise preferences for one prompt.</p>

</div>
</div>

<p class="footnote">Answers ours, after the paper's Fig. 2 prompt. Ouyang et al. 2022 §3.5: labelers rank "between $K = 4$ and $K = 9$ responses"</p>

Note:
To train a reward model we first collect comparison data. For the same prompt we generate several candidate answers, by sampling the same model a few times with nonzero temperature or by collecting answers from different models. Then a labeler compares them and ranks them from best to worst.
The example: "Explain the moon landing to a 6-year-old", four answers. A: "The moon landing was when people...". B: "In 1969, Apollo 11 executed...". C: "Some astronauts went to the moon...". D: "People took a rocket to the moon...". The labeler ranks C, then A, then D, then B. Four answers give six pairs: C over A, C over D, C over B, A over D, A over B, D over B. Four is just an example; in practice it's a small number, often between four and nine, which is exactly InstructGPT's range. These pairs are the reward model's training data.

---

<p class="eyebrow"><span class="paper">RLHF, PPO and GRPO</span> · Part 2, SFT and reward model · the reward model's head · Ouyang et al. 2022, Eq. 1</p>

## How does a reward model learn from pairs?

<div class="cols wide-fig">
<div class="text">

<div class="eq">$$L_{\rm RM}(\phi) = -\frac1N\sum_{i=1}^{N}\log\sigma\big(r_\phi(q_i, o_i^{\rm chosen}) - r_\phi(q_i, o_i^{\rm rejected})\big)$$</div>

<dl class="where">
<dt>$r_\phi(q, o)$</dt><dd>the <b>reward model</b>'s score; $\phi$ its weights</dd>
<dt>$\sigma(x)$</dt><dd>the sigmoid, $1/(1+e^{-x})$</dd>
<dt>$N$</dt><dd>the number of preference pairs</dd>
</dl>

- A language model with its language-model head swapped for a **reward head**: one number, read at the last token.
- **Bradley-Terry**: the chance the chosen answer wins is $\sigma$ of the score gap.

<p class="q"><b>Q.</b> The chosen answer scores 1.0 higher. Loss?</p>
<p class="a"><b>A.</b> $\sigma(1) = 0.731$, so $-\ln 0.731 = 0.313$ (ours)</p>

</div>
<div class="fig"><img src="img/week-04-rlhf-heads-reward.svg" alt="Illustration: the same inputs and backbone design, with a reward head on the last token only, giving one score r phi of q and o for the whole answer"></div>
</div>

<p class="footnote">Ouyang et al. 2022 §3.5, Eq. 1, after Stiennon et al. 2020. Bradley-Terry (1952): a model of pairwise comparisons in which win odds depend on a score difference</p>

Note:
The reward model takes a prompt q and an answer o and returns a single number; a better answer should get a higher score. In practice it starts from a trained language model, often the SFT model: reuse the backbone, remove the language-model head that predicts the next token, and add a reward head, which turns the final token's hidden state into one scalar score for the whole answer.
For each pair we have the chosen answer, the one people preferred, and the rejected one. The reward model scores both, and we want the chosen one higher. The Bradley-Terry model says that if two candidates have scores, the probability one is preferred depends on the difference: here, the sigmoid of chosen minus rejected. If the chosen answer scores much higher, the difference is very positive, the sigmoid is near one and the loss near zero. If it scores lower, the difference is negative, the sigmoid is near zero and minus the log is very large: strongly penalised. The loss is the negative log probability of people's preferences under Bradley-Terry, averaged over pairs.
InstructGPT's §3.5 describes starting from the SFT model; its appendix says the final 6B reward model started from a GPT-3 fine-tuned on public NLP datasets, with similar results either way. Worked numbers from Week 4: a gap of 1.0 gives 0.313; equal scores give log 2, 0.693; wrong way round by 1.0 gives 1.313.

--

<p class="eyebrow"><span class="paper">RLHF, PPO and GRPO</span> · Part 2, SFT and reward model · Ouyang et al. 2022 §3.5 · optional</p>

## Why average a prompt's pairs first?

<div class="cols">
<div class="text">

- A prompt with 9 ranked answers gives 36 pairs; one with 4 gives 6.
- Averaged pair by pair, the 9-answer prompt would count six times as much.
- The fix: average over each prompt's pairs, then over prompts (the main slide's $1/N$ is the simple form).
- InstructGPT does this with the $1/\binom K2$ in Eq. 1, and puts all of a prompt's pairs in one batch element.

</div>
<div class="text">

<p class="q"><b>Q.</b> Why one batch element, not 36 separate ones?</p>
<p class="a"><b>A.</b> Pairs from one ranking are correlated, so shuffled they overfit; together, each answer is run through the reward model once: 9 forward passes, not 36</p>

</div>
</div>

<p class="footnote">Ouyang et al. 2022 §3.5: shuffled pairs made the model overfit; "we train on all $\binom K2$ comparisons from each prompt as a single batch element". Week 4, InstructGPT section</p>

Note:
Optional, a practical detail and InstructGPT's version of it. Different prompts give different numbers of pairs, so averaging pair by pair lets prompts with many ranked answers dominate. So first average a prompt's pairs, then average across prompts.
InstructGPT does the same and gives a second reason. The pairs within one ranking are highly correlated: if you shuffle them into the dataset as separate examples, each answer is seen many times in one epoch, and the reward model overfits. So they train on all of a prompt's comparisons as one batch element. That is also cheaper: "a single forward pass of the RM for each completion", 9 for K = 9, instead of one per pair, 36, as the paper counts it.

---

<p class="eyebrow"><span class="paper">RLHF, PPO and GRPO</span> · Part 3, PPO's parts · Shao et al. 2024, Fig. 4</p>

## What does stage 3 do, and with which algorithm?

<div class="rows">
<div class="points">
<div class="text">

- Stage 3 uses the reward model as the training signal, so the policy's answers score higher.
- **PPO** (proximal policy optimization) is the classic RLHF algorithm: four models.

</div>
<div class="text">

- **GRPO** (group relative policy optimization) drops the value model and uses a group of answers as the baseline.
- Parts 3 and 4 build PPO; Part 5 shows what GRPO changes.

</div>
</div>
<div class="fig"><img src="img/week-04-grpo-fig4.png" alt="Shao et al. Figure 4. Top, PPO: the policy model writes output o; a frozen reference model and a frozen reward model give a KL-penalised reward r; a trained value model gives v; GAE turns r and v into the advantage A. Bottom, GRPO: the policy writes o1 to oG; the frozen reward model scores them r1 to rG; a group computation gives A1 to AG; the KL to the reference model goes straight to the policy"></div>
</div>

<p class="footnote">Shao et al. 2024, DeepSeekMath, arXiv:2402.03300, Fig. 4: yellow models are trained, blue frozen. Schulman et al. 2017, PPO, arXiv:1707.06347</p>

Note:
Now that we can train a reward model, the final stage: use it as a training signal to optimise the language model, so the model writes answers that get higher scores. Two RL methods are common for LLM policy optimisation. PPO, proximal policy optimization, is the classical and most widely used RLHF algorithm. GRPO, group relative policy optimization, is simpler in some ways, because it removes the value model and uses a group of answers to the same prompt as its baseline.
The figure, which we come back to for PPO and GRPO, is from the GRPO paper, DeepSeekMath. Top row PPO, bottom row GRPO: yellow models are trained, blue ones frozen. Count them: four in PPO, two trained; three in GRPO, one trained.

---

<p class="eyebrow"><span class="paper">RLHF, PPO and GRPO</span> · Part 3, PPO's parts · one network design, three heads</p>

## Which four models does PPO run?

<div class="rows">
<div class="points">
<div class="text">

- The **policy** $\pi_\theta$ is trained: the language model, with its language-model head.
- The **reference** $\pi_{\rm ref}$ is frozen: the SFT model before RL, the anchor for a KL penalty.

</div>
<div class="text">

- The **reward model** $r_\phi$ is frozen; it scores the whole answer through a reward head.
- The **value model** $V_\psi$ is trained; it predicts the expected return at each token through a value head.

</div>
</div>
<div class="fig"><img src="img/week-04-rlhf-heads-all.svg" alt="Illustration, three panels with the same inputs q1 to q4, o1 to o3 and the same backbone design. Left, policy: a language-model head over every position predicts the next tokens q2 to EOS, the prompt targets masked. Middle, reward model: a reward head on the last token gives one score r phi of q and o. Right, value model: a value head over the answer positions gives v1 to v4"></div>
</div>

<p class="footnote">The reference model has the policy's head; it is a frozen copy. KL: Kullback-Leibler divergence, how far one distribution is from another. $\theta$, $\phi$, $\psi$: each model's weights</p>

Note:
There are four models in PPO. First, the policy model: the language model we want to optimise; it gives the probability of the next token given the prompt and the tokens so far. Second, the reference model: usually a frozen copy of the model before RL, which anchors the policy to what it learned in SFT and keeps it from drifting too far. Third, the reward model we trained in Part 2: it scores the full answer. Fourth, the value model: it predicts the expected future reward from the current state and is used to compute the advantage.
The picture makes one point: these are the same kind of transformer with a different head on top, though only the policy and the value model may share weights. The policy and the reference have the language-model head; the reward model has one scalar at the last token; the value model one scalar at every answer position.
At a high level PPO works like this. The policy writes an answer o to a prompt q. We compute a KL penalty by comparing the policy with the reference, and score the answer with the reward model; together they make the reward signal r. Separately, the value model gives value estimates v. Then r and v go into GAE, generalised advantage estimation, which gives the advantage A, and the advantage tells us how to update the policy.

--

<p class="eyebrow"><span class="paper">RLHF, PPO and GRPO</span> · Part 3, PPO's parts · Ouyang et al. 2022 §3.5 · optional</p>

## Do the value model and the policy share a backbone?

<div class="cols">
<div class="text">

- Often yes in practice: one backbone with two heads, updated together.
- InstructGPT: no. "The value function is initialized from the RM", a separate 6B model.
- So for the 175B policy the value model is 29 times smaller (ours).
- Count for InstructGPT: four models in memory, two trained.

</div>
<div class="text">

<p class="q"><b>Q.</b> Which roles does the SFT model play in InstructGPT?</p>
<p class="a"><b>A.</b> Three: the policy's start, the KL reference, the 175B comparison baseline; the final RM started from a 6B GPT-3 (ours)</p>

</div>
</div>

<p class="footnote">Ouyang et al. 2022 §3.5, App. C; RM: reward model, 6B at every policy size, "initialized from a 6B GPT-3 model that was fine-tuned on a variety of public NLP datasets" (SFT or GPT-3 starts gave "similar results"). Week 4, "How many models does RLHF run?"</p>

Note:
Optional. In many implementations the policy and the value model share one transformer backbone, with one head for the next token and one for the value, and PPO training then updates the backbone and both heads together. That's a common implementation choice. InstructGPT did not: its value function is initialised from the 6B reward model, at every policy size. So at 175B the value model is 29 times smaller than the policy (our arithmetic), which matters when GRPO later says the value model is "typically another model of comparable size as the policy model".

---

<p class="eyebrow"><span class="paper">RLHF, PPO and GRPO</span> · Part 3, PPO's parts · per-token reward, $k_1$ KL</p>

## How does one score become a reward for every token?

<div class="eq">$$r_t = \begin{cases} -\beta\thinspace \mathrm{KL}_t, & t \lt T\\ r_\phi(q, o) - \beta\thinspace \mathrm{KL}_t, & t = T\end{cases}\qquad \mathrm{KL}_t = \log\frac{\pi_\theta(o_t \mid q, o_{\lt t})}{\pi_{\rm ref}(o_t \mid q, o_{\lt t})}$$</div>

<div class="cols">
<div class="text">

<dl class="where">
<dt>$r_t$</dt><dd>the <b>step reward</b> of token $t$</dd>
<dt>$\mathrm{KL}_t$</dt><dd>the per-token KL estimate (the <b>$k_1$ estimator</b>)</dd>
<dt>$\beta$</dt><dd>the <b>KL coefficient</b>: how hard the reference pulls</dd>
<dt>$T$</dt><dd>the answer's last token</dd>
</dl>

</div>
<div class="text">

- The answer's one score is added at the last token.
- Every token pays a KL penalty; a larger $\beta$ keeps the policy nearer the reference.

<p class="q"><b>Q.</b> Probability 0.6 under the policy, 0.5 under the reference. Reward at $\beta$ = 0.1?</p>
<p class="a"><b>A.</b> $-0.1 \ln 1.2 = -0.018$; with the policy at 0.4 instead, $+0.022$, a small bonus (ours)</p>

</div>
</div>

<p class="footnote">Ouyang et al. 2022 §3.5: "a per-token KL penalty from the SFT model at each token". $\beta$ = 0.1 is illustrative. $k_1$: Schulman 2020's name for the one-sample log ratio</p>

Note:
In PPO the reward combines two parts: the reward model's final score r phi of q and o, and per-token KL penalties. The reward model gives one score for the whole answer, but in LLM PPO each generated token is an action, so we need token-level quantities: log probabilities, KL penalties, advantages. The score is only available for the complete answer, so we add it at the final token. For every earlier token the step reward is just minus beta times the per-token KL estimate; for the last token it's the reward model's score minus beta times its KL estimate.
The KL estimate is the k1 estimator: for each token, compare its probability under the current policy with its probability under the reference, given the same context, and take the log ratio. Beta sets the strength. A larger beta keeps the policy closer to the reference; a smaller beta lets it move more aggressively toward answers with a high score. The KL penalty is an anchor to the reference policy: it stops the policy drifting too far during RL, and stops it finding answers the reward model overrates.
One thing the Q/A shows: a single k1 term can be negative, a small bonus for a token the policy now likes less than the reference. On average over the policy's own tokens the sum is still the KL. GRPO, in Part 5, uses a different estimator that is never negative.

---

<p class="eyebrow"><span class="paper">RLHF, PPO and GRPO</span> · Part 3, PPO's parts · the value model's head</p>

## What does the value model predict, and how is it trained?

<div class="cols wide-fig">
<div class="text">

<div class="eq">$$G_t = r_t + \gamma G_{t+1} = \sum_{k=t}^{T}\gamma^{k-t}r_k$$</div>

<dl class="where">
<dt>$G_t$</dt><dd>the <b>return</b> from step $t$: rewards from here on, discounted</dd>
<dt>$\gamma$</dt><dd>the <b>discount factor</b>, between 0 and 1; near or equal to 1 for language models</dd>
<dt>$v_t = V_\psi(s_t)$</dt><dd>the value model's guess of $G_t$ from $s_t = (q, o_{\lt t})$</dd>
</dl>

- In words: "from this partial answer, how good do we expect the final answer to be?"
- Its loss is the mean squared error to the returns, $\frac1T\sum_t (V_\psi(s_t) - G_t)^2$.

</div>
<div class="fig"><img src="img/week-04-rlhf-heads-value.svg" alt="Illustration: the same inputs and backbone design, with a value head over the answer positions q4, o1, o2 and o3, giving one value each, v1 to v4"></div>
</div>

<p class="footnote">$s_t$: the state before token $o_t$ is chosen. PPO's robot runs used $\gamma$ = 0.99; InstructGPT used "No discount", $\gamma$ = 1 (Week 4)</p>

Note:
The value model estimates the expected future return from the current state s t, before taking action a t. For an LLM, s t is the prompt plus the tokens so far and the action is the next token. Architecturally it's an LLM backbone with a value head, which predicts a scalar for each generated token position; often it shares the backbone with the policy.
The return from step t, G t, is defined recursively: the current reward plus gamma times the next return. Equivalently, the discounted sum of future rewards. Gamma is a discount factor; intuitively, like preferring money sooner rather than later. In standard RL gamma is between 0 and 1; a smaller gamma discounts the future more. In LLM RLHF gamma is often near or exactly 1. Why? The main reward comes from the final, complete answer, but the early tokens set its structure, direction and reasoning path, so we don't want to discount the final reward much when assigning credit to them. And unlike some RL problems, the answer has a finite length, so gamma near 1 is safe.
So V psi of s t is the expected return from that state: given the partial answer so far, how good do we expect the final outcome to be? To train it, fit its predictions to the returns: the loss is the mean squared error between V psi of s t and G t, averaged over the answer's tokens. The value estimate is then used to compute the advantage.

--

<p class="eyebrow"><span class="paper">RLHF, PPO and GRPO</span> · Part 3, PPO's parts · Schulman et al. 2017 · optional</p>

## What does $\gamma$ below 1 do to a final reward?

<div class="cols">
<div class="text">

- A reward $k$ steps ahead counts $\gamma^k$ of one received now.
- With one reward at the end, the first token of a 500-token answer sees $\gamma^{499}$ of it.
- At $\gamma$ = 0.99 that is 0.007: the early tokens barely hear the score (ours).
- InstructGPT applies no discount, $\gamma$ = 1; this is the reason we would expect (ours).

</div>
<div class="text">

<p class="q"><b>Q.</b> With $\gamma$ = 0.99, what is a reward 100 steps away worth?</p>
<p class="a"><b>A.</b> $0.99^{100} = 0.366$ of one received now</p>

</div>
</div>

<p class="footnote">Schulman et al. 2017, App. A: $\gamma$ = 0.99 in every robot and Atari run. GAE paper (Schulman et al. 2015): $\gamma$ cuts variance "at the cost of introducing bias"</p>

Note:
Optional: why gamma near 1 matters so much here. With a single reward at the end and gamma 0.99, a token 499 steps before the end sees 0.99 to the 499, about 0.007 of it (our arithmetic). The first sentence of a long answer would learn almost nothing from the score. The reason given on the main slide, that earlier tokens set the direction of the answer, is exactly this. PPO's robot settings use 0.99, where rewards arrive at every step (our reading); InstructGPT applies no discount.

---

<p class="eyebrow"><span class="paper">RLHF, PPO and GRPO</span> · Part 3, PPO's parts · worked example</p>

## What are the returns for "Gravity pulls objects together"?

<table class="rules">
  <tr><td>$t$</td><td>token $o_t$</td><td class="num">$\mathrm{KL}_t$</td><td class="num">step reward $r_t$</td><td class="num">return $G_t$</td><td class="num">value $v_t$ (ours)</td><td class="num">$(v_t - G_t)^2$ (ours)</td></tr>
  <tr><td>1</td><td>Gravity</td><td class="num">0.03</td><td class="num">−0.03</td><td class="num">−0.03 + 1.93 = 1.90</td><td class="num">1.70</td><td class="num">0.0400</td></tr>
  <tr><td>2</td><td>pulls</td><td class="num">0.02</td><td class="num">−0.02</td><td class="num">−0.02 + 1.95 = 1.93</td><td class="num">1.80</td><td class="num">0.0169</td></tr>
  <tr><td>3</td><td>objects</td><td class="num">0.04</td><td class="num">−0.04</td><td class="num">−0.04 + 1.99 = 1.95</td><td class="num">1.85</td><td class="num">0.0100</td></tr>
  <tr><td>4</td><td>together</td><td class="num">0.01</td><td class="num">2 − 0.01 = 1.99</td><td class="num">1.99</td><td class="num">1.95</td><td class="num">0.0016</td></tr>
</table>

<p class="plain">Prompt $q$ = "Explain gravity simply."; reward model score $r_\phi(q, o) = 2$; $\beta = 1$, $\gamma = 1$. Returns are computed backwards, from $G_4$.</p>

<p class="q"><b>Q.</b> With our values, what is the value loss?</p>
<p class="a"><b>A.</b> $(0.0400 + 0.0169 + 0.0100 + 0.0016)/4 = 0.0171$ (ours)</p>

<p class="footnote">Example ours: prompt, answer, score, KL values, $\beta$ and $\gamma$ are illustrative. The value predictions $v_t$ give the loss a number; we reuse them for GAE in Part 4</p>

Note:
A small example. Prompt: "Explain gravity simply." Answer: "Gravity pulls objects together", four tokens, one word each for simplicity. The reward model's score for this pair is 2. The per-token sampled KL estimates are 0.03, 0.02, 0.04 and 0.01.
With beta 1, the step rewards: for the first three tokens only the negative KL penalty, so minus 0.03, minus 0.02, minus 0.04. For the last we add the score: 2 minus 0.01, 1.99. With gamma 1, no discount, compute the returns backwards from the end: G4 = r4 = 1.99; G3 = minus 0.04 plus 1.99 = 1.95; G2 = minus 0.02 plus 1.95 = 1.93; G1 = minus 0.03 plus 1.93 = 1.90. These returns are the value model's training targets: at each position the value head predicts a number, and we want it to match G t. The loss is the mean squared error between each prediction and its return, averaged over the four tokens.
To give the loss a number we add value predictions of our own, 1.70, 1.80, 1.85 and 1.95: a value model that slightly underrates this answer. The squared errors are 0.04, 0.0169, 0.01 and 0.0016, mean 0.0171. We keep these four values for the GAE example in Part 4.

---

<p class="eyebrow"><span class="paper">RLHF, PPO and GRPO</span> · Part 4, PPO's objective · the RL objective</p>

## What exactly does RL maximise?

<div class="eq">$$J(\theta) = \mathbb E_{\tau\sim\pi_\theta}\big[G(\tau)\big],\qquad p_\theta(\tau) = p(s_0)\prod_{t=0}^{T}\pi_\theta(a_t \mid s_t)\thinspace P(s_{t+1} \mid s_t, a_t)$$</div>

<div class="cols">
<div class="text">

<dl class="where">
<dt>$\tau$</dt><dd>a <b>trajectory</b>, $(s_0, a_0, s_1, a_1, \dots)$, sampled by following the policy</dd>
<dt>$G(\tau)$</dt><dd>the trajectory's return, its total reward</dd>
<dt>$J(\theta)$</dt><dd>the <b>objective</b>: the return averaged over trajectories</dd>
<dt>$p(s_0)$, $P$</dt><dd>the start-state distribution and the environment's transition probability</dd>
</dl>

</div>
<div class="text">

- $p_\theta(\tau)$ multiplies the start, every policy choice and every transition.
- We adjust $\theta$ so the policy's trajectories earn more on average.

<p class="q"><b>Q.</b> For a language model, what is $P(s_{t+1} \mid s_t, a_t)$?</p>
<p class="a"><b>A.</b> 1 for "append the token", 0 for anything else</p>

</div>
</div>

<p class="footnote">This is the setup for GAE; the reward $r_t$ may depend on $s_t$, $a_t$ and $s_{t+1}$</p>

Note:
Before GAE, set up the RL objective. Suppose tau is a trajectory: a sequence of states and actions, s0, a0, s1, a1 and so on, generated by following the policy pi theta. At each step the action is sampled from the policy given the current state; after the action, the environment moves to the next state according to its transition probability P. At each step the agent also gets a reward, which can depend on the state, the action and the next state.
The goal is the expected return: J of theta, the average total reward over trajectories sampled from the current policy. We want to adjust theta so that, on average, the trajectories the policy generates earn more total reward. The probability of a whole trajectory is a product: the start state, then every policy choice and every environment transition. That product is what the next slide differentiates.

---

<p class="eyebrow"><span class="paper">RLHF, PPO and GRPO</span> · Part 4, PPO's objective · the policy gradient</p>

## How do you take the gradient of an average over samples?

<div class="eq">$$\begin{aligned}\nabla_\theta J(\theta) &= \int \nabla_\theta p_\theta(\tau)\thinspace G(\tau)\thinspace d\tau = \int p_\theta(\tau)\thinspace\nabla_\theta\log p_\theta(\tau)\thinspace G(\tau)\thinspace d\tau\\ \nabla_\theta\log p_\theta(\tau) &= \nabla_\theta\Big[\log p(s_0) + \sum_t\log\pi_\theta(a_t \mid s_t) + \sum_t\log P(s_{t+1} \mid s_t, a_t)\Big] = \sum_t\nabla_\theta\log\pi_\theta(a_t \mid s_t)\\ \nabla_\theta J(\theta) &= \mathbb E_{\tau\sim\pi_\theta}\Big[G(\tau)\sum_t\nabla_\theta\log\pi_\theta(a_t \mid s_t)\Big] \ \text{▸}\ \mathbb E_{\tau\sim\pi_\theta}\Big[\sum_t\Psi_t\thinspace\nabla_\theta\log\pi_\theta(a_t \mid s_t)\Big]\end{aligned}$$</div>

<div class="cols">
<div class="text">

- Line 1, the **log-derivative trick**: $\nabla_\theta p_\theta = p_\theta\nabla_\theta\log p_\theta$.
- Line 2: the log turns the product into a sum; the start and the transitions don't depend on $\theta$.

</div>
<div class="text">

- Line 3 is an average we can estimate from sampled trajectories.
- Then replace $G(\tau)$ by a per-step weight $\Psi_t$. Which weight is best?

</div>
</div>

<p class="footnote">$\Psi_t$: the weight on step $t$'s gradient. The ▸ is a generalisation, not an equality: $G(\tau)$ is one valid choice of $\Psi_t$, the advantage another (GAE paper, Schulman et al. 2015, §2)</p>

Note:
Now the gradient of the objective. J of theta is an expectation over trajectories, so by definition it's an integral over all trajectories of the trajectory's probability times its return. Take the gradient with respect to theta. The key step: the gradient of a probability equals the probability times the gradient of its log. So the gradient becomes the integral of p theta of tau, times the gradient of log p theta of tau, times G of tau.
Expand the trajectory's probability: the start-state probability, times all the policy probabilities, times all the transition probabilities. Take the log and the products become sums: log of the start state, plus the sum of the log policy probabilities, plus the sum of the log transition probabilities. Only the policy depends on theta. The start distribution and the transitions don't, so their gradients vanish, and the gradient of the log trajectory probability is the sum over time of the gradient of log pi theta of a t given s t.
Put it back: the policy gradient is the expectation of the return times the sum of the gradients of the log action probabilities. We can then generalise by replacing the whole-trajectory return with a per-step signal Psi t: the expectation of a sum over time, each gradient weighted by its own Psi t. So the key question becomes: what should Psi t be?

---

<p class="eyebrow"><span class="paper">RLHF, PPO and GRPO</span> · Part 4, PPO's objective · the advantage as baseline</p>

## Why weight each step by its advantage?

<div class="cols">
<div class="text">

<div class="eq">$$\Psi_t = A^{\pi_\theta}(s_t, a_t) = Q^{\pi_\theta}(s_t, a_t) - V^{\pi_\theta}(s_t)$$</div>

<dl class="where">
<dt>$Q^{\pi_\theta}(s_t, a_t)$</dt><dd>the expected return if we take $a_t$ in $s_t$, then follow the policy</dd>
<dt>$V^{\pi_\theta}(s_t)$</dt><dd>the expected return from $s_t$, averaged over the policy's actions: the <b>baseline</b></dd>
<dt>$A^{\pi_\theta}$</dt><dd>the <b>advantage</b>: how much better than average $a_t$ is</dd>
</dl>

- Subtracting the baseline lowers the gradient's variance without changing its average.

</div>
<div class="text">

<table class="rules">
  <tr><td>prompt</td><td class="num">$V$</td><td class="num">reward</td><td class="num">advantage</td></tr>
  <tr><td>easy, answer 1</td><td class="num">0.90</td><td class="num">0.95</td><td class="num">+0.05</td></tr>
  <tr><td>easy, answer 2</td><td class="num">0.90</td><td class="num">0.85</td><td class="num">−0.05</td></tr>
  <tr><td>hard, answer 1</td><td class="num">0.20</td><td class="num">0.40</td><td class="num">+0.20</td></tr>
  <tr><td>hard, answer 2</td><td class="num">0.20</td><td class="num">0.10</td><td class="num">−0.10</td></tr>
</table>

<p class="q"><b>Q.</b> Easy 2 or hard 1: which beat expectations?</p>
<p class="a"><b>A.</b> Hard 1: its reward, 0.40, is lower than easy 2's 0.85, but its advantage is +0.20 against −0.05</p>

</div>
</div>

<p class="footnote">Numbers ours. The true $Q$ and $V$ are unknown, so they must be estimated: that is GAE, next</p>

Note:
Connect this to advantage estimation. A good choice for the weight Psi t is the advantage: Q of s t, a t minus V of s t. Q is the expected return if we take action a t at state s t and then keep following the policy. V is the expected return from s t, averaging over actions the policy might take. So V acts as a baseline, and the advantage says how much better than average action a t is in state s t.
Why does the baseline help? It reduces variance. Imagine two prompts. Prompt A is easy, so most completions get high scores. Prompt B is hard, so even the best completions get relatively low scores. Looking only at raw reward, the easy prompt always looks good and the hard one always looks bad. What we want to know is whether a completion was better or worse than expected for that prompt. Subtracting the baseline makes the signal reflect better-than-expected quality, not prompt difficulty.
In our numbers (ours): the easy prompt's weaker answer, 0.85, has a much higher raw reward than the hard prompt's best, 0.40, but its advantage is negative, and the hard prompt's 0.40 has the largest positive advantage. In practice the true advantage is unknown, so we need to estimate it. That's GAE.

---

<p class="eyebrow"><span class="paper">RLHF, PPO and GRPO</span> · Part 4, PPO's objective · GAE · Schulman et al. 2015</p>

## How does GAE estimate the advantage?

<div class="cols">
<div class="text">

<div class="eq">$$\delta_t = r_t + \gamma V(s_{t+1}) - V(s_t),\qquad \hat A_t = \delta_t + \gamma\lambda\hat A_{t+1}$$</div>

<dl class="where">
<dt>$\delta_t$</dt><dd>the <b>TD residual</b> (temporal difference): the one-step advantage estimate</dd>
<dt>$\hat A_t$</dt><dd>the <b>GAE</b> estimate, $\sum_l(\gamma\lambda)^l\delta_{t+l}$, computed backwards</dd>
<dt>$\lambda$</dt><dd>the <b>GAE parameter</b>, between 0 and 1</dd>
</dl>

<p class="plain">$\delta_t > 0$: the step went better than the value model expected.</p>

</div>
<div class="text">

<table class="rules">
  <tr><td>$\lambda$</td><td>estimate</td><td>bias</td><td>variance</td></tr>
  <tr><td>0</td><td>one-step, $\delta_t$</td><td>high</td><td>low</td></tr>
  <tr><td>0.95</td><td>a blend, typical</td><td>some</td><td>some</td></tr>
  <tr><td>1</td><td>Monte Carlo, $G_t - V(s_t)$</td><td>low</td><td>high</td></tr>
</table>

<p class="q"><b>Q.</b> Why is $\lambda$ = 0 biased?</p>
<p class="a"><b>A.</b> It trusts the value model's guess after one step</p>

</div>
</div>

<p class="footnote">GAE: generalised advantage estimation, Schulman et al. 2015 (ICLR 2016), arXiv:1506.02438. Monte Carlo: estimating from complete sampled rollouts. PPO's robot runs: $\lambda$ = 0.95</p>

Note:
How do we estimate the advantage with GAE? First the temporal-difference residual, TD residual for short, written delta t: a one-step estimate of the advantage. It compares what the value model predicted before with what we see after one step: the reward at step t, plus gamma times the value of the next state, minus the value of the current state. If delta is positive, the outcome was better than the value model expected; if negative, worse.
GAE combines these residuals over many future steps: an exponentially weighted sum of future TD residuals. The recursive form is what we implement: the advantage at step t equals delta t plus gamma lambda times the advantage at the next step.
Lambda controls the bias-variance trade-off. At lambda 0, GAE is the pure one-step TD estimate: lower variance but higher bias, because it only looks one step ahead and trusts the value model. At lambda 1 it becomes Monte Carlo estimation: lower bias, because it uses the full rollout, but higher variance, because it depends on many sampled future rewards. In practice lambda is often around 0.95, a balance.

--

<p class="eyebrow"><span class="paper">RLHF, PPO and GRPO</span> · Part 4, PPO's objective · Later work · DeepSeek-AI 2025 · optional</p>

## Is $\lambda$ = 0.95 right for a language model?

<div class="cols wide-fig">
<div class="text">

- 0.95 is PPO's robot and Atari setting, where rewards arrive every step.
- With one reward at the end, the first of 500 tokens gets $0.95^{499}$ of it, almost nothing: credit rides on the value model (ours).
- In R1's supplement, on MATH: PPO 0.501 at $\lambda$ = 0.95, 0.536 at $\lambda$ = 1, GRPO 0.555.
- One run each, by GRPO's authors.

</div>
<div class="fig"><img src="img/week-04-grpo-r1-ppo.png" alt="DeepSeek-R1 supplement figure: MATH accuracy against training steps up to about 2,400 for PPO with lambda 0.95, PPO with lambda 1.0 and GRPO. GRPO ends near 0.555, PPO with lambda 1.0 near 0.536, PPO with lambda 0.95 near 0.501"></div>
</div>

<p class="footnote">DeepSeek-AI 2025, DeepSeek-R1, arXiv:2501.12948, supplement; a 16B mixture-of-experts model; values by eye. MATH: competition maths problems. Week 4, "Where is the PPO baseline?"</p>

Note:
Optional. The "typical" 0.95 comes from robotics, where a reward arrives at every step. For a language model with one reward at the end, 0.95 to the 499th is effectively zero, so with lambda 0.95 the early tokens' advantages are almost entirely the value model's opinion (our reading). R1's supplement is the one head-to-head: on MATH, PPO with lambda 0.95 "performs considerably worse than GRPO"; with lambda 1.0 it "improves substantially, nearing that of GRPO". By eye, 0.501, 0.536 and 0.555; one run per setting, one model, by GRPO's own authors.

---

<p class="eyebrow"><span class="paper">RLHF, PPO and GRPO</span> · Part 4, PPO's objective · Schulman et al. 2017, Eq. 7</p>

## What is PPO's objective?

<div class="eq">$$J_{\rm PPO}(\theta) = \mathbb E_{q\sim P(Q),\ o\sim\pi_{\theta_{\rm old}}(O \mid q)}\Big[\frac{1}{\lvert o\rvert}\sum_{t=1}^{\lvert o\rvert}\min\big(r_t(\theta)\hat A_t,\ \mathrm{clip}(r_t(\theta), 1-\epsilon, 1+\epsilon)\thinspace \hat A_t\big)\Big]$$</div>

<div class="cols">
<div class="text">

<dl class="where">
<dt>$\pi_{\theta_{\rm old}}$</dt><dd>a frozen copy of the policy that sampled the answers</dd>
<dt>$r_t(\theta)$</dt><dd>the <b>importance ratio</b>, $\pi_\theta(o_t \mid q, o_{\lt t})/\pi_{\theta_{\rm old}}(o_t \mid q, o_{\lt t})$</dd>
<dt>$\hat A_t$</dt><dd>token $t$'s GAE advantage</dd>
<dt>$\epsilon$</dt><dd>the <b>clip range</b>, often 0.2</dd>
<dt>$\lvert o\rvert$, $P(Q)$</dt><dd>the answer's length, and the prompt dataset</dd>
</dl>

</div>
<div class="text">

- Raise the probability of tokens with positive advantage, lower it for negative ones.
- Take the smaller of the plain and the clipped term, so no step goes too far.

<p class="q"><b>Q.</b> Is $r_t(\theta)$ the step reward $r_t$?</p>
<p class="a"><b>A.</b> No: same letter, a probability ratio; the $(\theta)$ tells them apart</p>

</div>
</div>

<p class="footnote">Schulman et al. 2017 §3, Eq. 7; $\epsilon$ = 0.2 in its robot runs. The $1/\lvert o\rvert$ token average is the language-model form, as in Shao et al. 2024 Eq. 1</p>

Note:
Now we have the building blocks. PPO's objective is something we maximise. At a high level: increase the probability of tokens with positive advantage and decrease it for tokens with negative advantage. The formula looks complicated, but the idea is simple: update the current policy using rollouts from the old policy, while making sure the update isn't too large.
Read it. Sample a prompt q from the prompt dataset, then an answer o from the old policy. For each generated token compute two surrogates. The unclipped one is the importance ratio r t of theta times the advantage: the token's probability under the current policy divided by its probability under the old policy, given the same prompt and previous tokens. The clipped one clips the ratio so it can't go below 1 minus epsilon or above 1 plus epsilon. PPO takes the minimum of the two. That clipping is PPO's key idea: it stops the new policy moving too far from the old one in one update. One over the length of o averages over the answer's tokens; the outer expectation averages over the batch. A hat t is the GAE advantage.
Watch the letters: like the PPO paper, we write r for the step reward and r of theta for the ratio.

---

<p class="eyebrow"><span class="paper">RLHF, PPO and GRPO</span> · Part 4, PPO's objective · the importance ratio</p>

## Why sample from an old copy of the policy?

<div class="cols">
<div class="text">

- Rollouts are expensive for language models: long answers, long tasks.
- Pure on-policy training would need fresh rollouts after every gradient step.
- So freeze a copy $\pi_{\theta_{\rm old}}$, sample one batch with it, then update $\pi_\theta$ several times on that fixed batch.
- The problem: the answers came from $\pi_{\theta_{\rm old}}$, but we are updating $\pi_\theta$. The ratio $r_t(\theta)$ corrects for that.

</div>
<div class="text">

<div class="eq">$$r_t(\theta) = \frac{\pi_\theta(o_t \mid q, o_{\lt t})}{\pi_{\theta_{\rm old}}(o_t \mid q, o_{\lt t})}$$</div>

<p class="q"><b>Q.</b> A token's log-probability went from −1.1 under the old policy to −0.9 now. Its ratio, and is it clipped at $\epsilon$ = 0.2?</p>
<p class="a"><b>A.</b> $e^{0.2} = 1.221$, above 1.2: clipped if its advantage is positive (ours)</p>

</div>
</div>

<p class="footnote">Importance sampling: reweighting samples drawn from one distribution so they average correctly under another. At the first update $\pi_\theta = \pi_{\theta_{\rm old}}$, so every ratio is 1</p>

Note:
Why generate the rollouts with the old policy? Efficiency. In pure on-policy training, every time the policy changes you need fresh rollouts from the new policy. For a large language model, generating rollouts is expensive, especially for long outputs or long-horizon tasks. So PPO first makes a frozen copy of the current policy, the old policy, uses it to generate a batch of rollouts, and then optimises the current policy on that fixed batch. That allows a small, controlled amount of off-policy mismatch.
Here's the problem: the rollouts came from the old policy, but the model we're updating is the current policy. To correct for that we multiply the advantage by the importance ratio, which compares how likely the sampled token is under the current policy versus the old one. But we don't want this ratio to become too large or too small. That's why PPO clips it: next slide.

---

<p class="eyebrow"><span class="paper">RLHF, PPO and GRPO</span> · Part 4, PPO's objective · Schulman et al. 2017, Fig. 1</p>

## What does the clip do when the advantage is positive, and when negative?

<div class="cols">
<div class="text">

<table class="rules">
  <tr><td></td><td>$\hat A_t > 0$, good</td><td>$\hat A_t \lt 0$, bad</td></tr>
  <tr><td>goal</td><td>push $r$ up</td><td>push $r$ down</td></tr>
  <tr><td>clipped</td><td>$r > 1+\epsilon$</td><td>$r \lt 1-\epsilon$</td></tr>
  <tr><td>active</td><td>$r \lt 1-\epsilon$: push back up</td><td>$r > 1+\epsilon$: push back down</td></tr>
</table>

<p class="q"><b>Q.</b> Where does every token start?</p>
<p class="a"><b>A.</b> At $r$ = 1, the red dot: before the update the two policies are the same</p>

</div>
<div class="fig"><img src="img/week-04-ppo-fig1.png" alt="Schulman et al. Figure 1: one term of L CLIP against the ratio r. Left, positive advantage: rising from the origin, flat beyond 1 plus epsilon. Right, negative advantage: flat below 1 minus epsilon, then falling. A red dot marks the start at r = 1"></div>
</div>

<p class="footnote">Schulman et al. 2017, Fig. 1: one token's term of the objective against the ratio $r$. The clip caps only the improvement; a move the wrong way is never clipped</p>

Note:
A closer look at the clipping. The plot shows the objective for a single time step t; the horizontal axis is the importance ratio r. The red dot is where the update starts: r equals 1, because before the update the current policy is the old one.
Positive advantage: the token was better than expected, so we want it more often. To maximise the objective PPO wants to raise r, giving the token more probability than the old policy did. But not too far: once r passes 1 plus epsilon the objective is clipped, and raising the probability further gives no extra gradient. If r is below 1 minus epsilon, a good token's probability has dropped too much; there the unclipped objective stays active, so the gradient can push it back up.
Negative advantage: the token was worse than expected, so we want it less. Since A is negative, r times A becomes less negative as r falls, so PPO wants to lower r. Once r is below 1 minus epsilon, it's clipped: no extra benefit from lowering it more. If r is above 1 plus epsilon, a bad token is still too likely; the unclipped term stays active and the gradient pushes it back down. So clipping allows useful updates but stops the policy changing too aggressively in one step.

--

<p class="eyebrow"><span class="paper">RLHF, PPO and GRPO</span> · Part 4, PPO's objective · Week 4, PPO section · optional</p>

## Four worked cases of the clip

<div class="cols wide-fig">
<div class="text">

<table class="rules">
  <tr><td></td><td class="num">$A$</td><td class="num">$r$</td><td class="num">$rA$</td><td class="num">clip</td><td class="num">min</td><td class="num">slope</td></tr>
  <tr><td>a</td><td class="num">+2</td><td class="num">1.3</td><td class="num">2.6</td><td class="num">2.4</td><td class="num">2.4</td><td class="num">0</td></tr>
  <tr><td>b</td><td class="num">+2</td><td class="num">0.7</td><td class="num">1.4</td><td class="num">1.6</td><td class="num">1.4</td><td class="num">+2</td></tr>
  <tr><td>c</td><td class="num">−2</td><td class="num">0.7</td><td class="num">−1.4</td><td class="num">−1.6</td><td class="num">−1.6</td><td class="num">0</td></tr>
  <tr><td>d</td><td class="num">−2</td><td class="num">1.3</td><td class="num">−2.6</td><td class="num">−2.4</td><td class="num">−2.6</td><td class="num">−2</td></tr>
</table>

<dl class="where" style="margin-top:12px">
<dt>clip</dt><dd>$\mathrm{clip}(r, 0.8, 1.2)\thinspace A$</dd>
<dt>min</dt><dd>the smaller of $rA$ and clip: what PPO uses</dd>
<dt>slope</dt><dd>change of min with $r$; 0 means no gradient</dd>
</dl>

</div>
<div class="fig"><img src="img/week-04-ppo-cases.svg" alt="Illustration: one term of the clipped objective against the ratio for advantage plus 2 and minus 2, epsilon 0.2, with the unclipped line dashed; cases a, 2.4, and c, minus 1.6, sit on flat parts; cases b, 1.4, and d, minus 2.6, sit on sloped parts"></div>
</div>

<p class="footnote">Ours, from Eq. 7 with $\epsilon$ = 0.2; $A$: advantage, $r$: importance ratio. A token at 0.30 under the old policy and 0.39 now has $r = 1.3$</p>

Note:
Optional, from Week 4. Case a: a good token already 30% more likely, past the 20% allowance: the clipped term, 2.4, is smaller, so the min picks it, and it's flat; stop pushing. Case b: a good token that became less likely: the unclipped term, 1.4, is smaller, and the full gradient pushes it back up. Case c: a bad token already cut by 30%: flat, stop. Case d: a bad token that became more likely: unclipped, full gradient to push it down. The rule: a token's gradient is switched off only when it has already moved the way its advantage wanted by more than epsilon. Moves that made things worse are never clipped; that is what the min is for.

---

<p class="eyebrow"><span class="paper">RLHF, PPO and GRPO</span> · Part 4, PPO's objective · recap: the advantage in PPO</p>

## How does PPO compute each token's advantage?

<div class="cols wide-fig">
<div class="text">

- Input 1, the per-token reward: $-\beta\thinspace \mathrm{KL}_t$, plus the reward model's score at the last token.
- Input 2, the value model's prediction $v_t = V_\psi(s_t)$ at each state.
- Pass 1: the TD error $\delta_t$ at every token.
- Pass 2, backwards from the end: the advantage $\hat A_t$.

<p class="q"><b>Q.</b> Which of the four models feed this?</p>
<p class="a"><b>A.</b> All four: policy and reference (the KL), the reward model (the score), the value model</p>

</div>
<div class="fig"><img src="img/week-04-rlhf-gaeflow.svg" alt="Illustration: box 1, reward and value per token: the step reward r t equals minus beta KL t, plus r phi at the last token, and the value v t from the value model. Box 2, TD error delta t equals r t plus gamma v t+1 minus v t, with v T+1 equal to 0. Box 3, advantage backward: A t equals delta t plus gamma lambda A t+1, starting from A T+1 equal to 0"></div>
</div>

<p class="footnote">GAE (Schulman et al. 2015) applied to PPO for language models; the reward and reference models are frozen, the value model is trained</p>

Note:
A quick recap of how A t is computed. It comes from applying GAE to two inputs: the per-token rewards from the current step on, and the learned value function. The first input, the per-token reward, combines the per-token KL estimate and, at the final token, the reward model's score. KL t measures how much the policy deviates from the reference at token t, and beta times KL t is the penalty we subtract. The second input is the value model's scalar prediction for each state.
With those two inputs, GAE produces the advantage in two steps. First the TD error: the reward at step t plus gamma times the value of the next state minus the value of the current state. Then the advantage, backwards: A t equals delta t plus gamma lambda times A t plus 1.

--

<p class="eyebrow"><span class="paper">RLHF, PPO and GRPO</span> · Part 4, PPO's objective · the gravity example, continued (ours) · optional</p>

## What advantages does GAE give "Gravity pulls objects together"?

<table class="rules">
  <tr><td>$t$</td><td>token</td><td class="num">$r_t$</td><td class="num">$v_t$ (ours)</td><td class="num">$\delta_t = r_t + v_{t+1} - v_t$</td><td class="num">$\hat A_t$, $\lambda$ = 0.95</td><td class="num">$\hat A_t$, $\lambda$ = 1</td><td class="num">target $\hat A_t + v_t$, $\lambda$ = 0.95</td></tr>
  <tr><td>1</td><td>Gravity</td><td class="num">−0.03</td><td class="num">1.70</td><td class="num">−0.03 + 1.80 − 1.70 = 0.07</td><td class="num">0.187</td><td class="num">0.20</td><td class="num">1.887</td></tr>
  <tr><td>2</td><td>pulls</td><td class="num">−0.02</td><td class="num">1.80</td><td class="num">−0.02 + 1.85 − 1.80 = 0.03</td><td class="num">0.123</td><td class="num">0.13</td><td class="num">1.923</td></tr>
  <tr><td>3</td><td>objects</td><td class="num">−0.04</td><td class="num">1.85</td><td class="num">−0.04 + 1.95 − 1.85 = 0.06</td><td class="num">0.098</td><td class="num">0.10</td><td class="num">1.948</td></tr>
  <tr><td>4</td><td>together</td><td class="num">1.99</td><td class="num">1.95</td><td class="num">1.99 + 0 − 1.95 = 0.04</td><td class="num">0.040</td><td class="num">0.04</td><td class="num">1.990</td></tr>
</table>

<p class="q"><b>Q.</b> Check $\hat A_3$ at $\lambda$ = 0.95, and $\hat A_1$ at $\lambda$ = 1.</p>
<p class="a"><b>A.</b> $0.06 + 0.95 \times 0.04 = 0.098$; at $\lambda$ = 1, $G_1 - v_1 = 1.90 - 1.70 = 0.20$</p>

<p class="footnote">Ours: the rewards and values of the worked example in Part 3; $\gamma$ = 1, $v_5 = 0$. Every advantage is positive because our value model underrated this answer. At $\lambda$ = 1 the targets equal the returns $G_t$</p>

Note:
Optional, ours: the gravity example carried through GAE. Rewards and values from Part 3, gamma 1, and the value after the last token is 0 because the answer has ended. TD errors: 0.07, 0.03, 0.06, 0.04. Backwards with lambda 0.95: A4 = 0.04, A3 = 0.06 + 0.95 times 0.04 = 0.098, A2 = 0.03 + 0.95 times 0.098 = 0.123, A1 = 0.07 + 0.95 times 0.123 = 0.187. With lambda 1 the deltas telescope and each advantage is the return minus the value: 0.20, 0.13, 0.10, 0.04. All are positive because our value model expected a little less than this answer got, so PPO will push all four tokens up, the first most. The value targets, advantage plus value, are 1.887, 1.923, 1.948 and 1.99: slightly below the Monte Carlo returns, because lambda below 1 leans on the value model's lower guesses.

---

<p class="eyebrow"><span class="paper">RLHF, PPO and GRPO</span> · Part 4, PPO's objective · one PPO step, 1 of 2: the rollout</p>

## One PPO step: what happens during the rollout?

<table class="rules" style="font-size:22px">
  <tr><td>step</td><td>what</td><td>formula</td></tr>
  <tr><td>1</td><td>freeze the policy; sample an answer per prompt</td><td>$\pi_{\theta_{\rm old}} \leftarrow \pi_\theta$; $o = (o_1, \dots, o_T) \sim \pi_{\theta_{\rm old}}(\cdot \mid q)$</td></tr>
  <tr><td>2</td><td>score the whole answer</td><td>$r_\phi(q, o)$</td></tr>
  <tr><td>3</td><td>for every token, in parallel: value and KL</td><td>$v_t = V_\psi(s_t)$; $\mathrm{KL}_t \approx \log\pi_{\theta_{\rm old}}(o_t \mid q, o_{\lt t}) - \log\pi_{\rm ref}(o_t \mid q, o_{\lt t})$</td></tr>
  <tr><td>4</td><td>step rewards</td><td>$r_t = -\beta\thinspace \mathrm{KL}_t$, plus $r_\phi(q, o)$ at $t = T$</td></tr>
  <tr><td>5</td><td>TD errors</td><td>$\delta_t = r_t + \gamma v_{t+1} - v_t$, with $v_{T+1} = 0$</td></tr>
  <tr><td>6</td><td>GAE backwards, and value targets</td><td>$\hat A_t = \delta_t + \gamma\lambda\hat A_{t+1}$, $\hat A_{T+1} = 0$; $\hat G_t = \hat A_t + v_t$</td></tr>
</table>

<p class="q"><b>Q.</b> Why $\log\pi_{\theta_{\rm old}}$ in step 3, not $\log\pi_\theta$?</p>
<p class="a"><b>A.</b> At rollout time they are the same model, and sampling already computed them</p>

<p class="footnote">$\hat G_t$: the return target for the value model, since an advantage is a return minus a value</p>

Note:
To finish PPO, one step of the training loop. First, copy the current policy and freeze it as the old policy; for each prompt, sample an answer from it, a sequence of tokens o1 to oT. Next, compute the reward model's score for the complete answer: one scalar for the whole response. Then for all response tokens compute several token-level quantities in parallel. The value model predicts v t for each state, the prompt plus the tokens before position t. And the per-token KL estimate: conceptually it compares pi theta with the reference; we use log pi theta old because at rollout time the old policy is a frozen copy of pi theta and we already have its log probabilities.
From the score and the KL estimates form the step rewards: for tokens before the last, just the negative KL penalty; for the last, add the reward model's score. With step rewards and values, compute the TD error: r t plus gamma times the next value minus the current value. At the final token the next value is zero, because the answer ends there.
Then the advantages, backwards from the final token with the recursive GAE formula, starting from A T plus 1 equal to zero. We also compute the return target for the value model: since an advantage is a return minus a value, adding the value back gives an estimated return, G hat t = A hat t + v t.

---

<p class="eyebrow"><span class="paper">RLHF, PPO and GRPO</span> · Part 4, PPO's objective · one PPO step, 2 of 2: the update</p>

## One PPO step: what happens during the update?

<table class="rules">
  <tr><td>step</td><td>what</td><td>formula</td></tr>
  <tr><td>7</td><td>recompute the current policy's log-probabilities on the same rollout</td><td>$\log\pi_\theta(o_t \mid q, o_{\lt t})$</td></tr>
  <tr><td>8</td><td>importance ratios</td><td>$r_t(\theta) = \exp\big(\log\pi_\theta(o_t \mid q, o_{\lt t}) - \log\pi_{\theta_{\rm old}}(o_t \mid q, o_{\lt t})\big)$</td></tr>
  <tr><td>9</td><td>minimise the combined loss</td><td>$L = -J_{\rm PPO} + c_v L_{\rm VM}$, with $L_{\rm VM} = \frac1T\sum_t\big(V_\psi(s_t) - \hat G_t\big)^2$</td></tr>
</table>

<div class="cols">
<div class="text">

- Steps 7 to 9 can repeat over one batch, which is why the ratio and clip exist; InstructGPT made one pass.
- The policy and the value model are updated; the reward and reference models stay frozen.

</div>
<div class="text">

<p class="q"><b>Q.</b> Why minimise $-J_{\rm PPO}$?</p>
<p class="a"><b>A.</b> $J_{\rm PPO}$ is to be maximised; optimisers minimise</p>

</div>
</div>

<p class="footnote">$c_v$: the value loss's weight; $L_{\rm VM}$: the value model's mean squared error. Several passes per batch: Schulman et al. 2017 §5, "$K$ epochs"; InstructGPT used "a single inner epoch" (App. C)</p>

Note:
During PPO optimisation we recompute the current policy's log probability on the same rollout: for each generated token, its log probability under pi theta given the prompt and the earlier tokens. Then the importance ratio: the exponential of the current log probability minus the old one, for the same token and context. Finally the training loss. J PPO is an objective we want to maximise, so in code we minimise its negative, and add the value model's loss weighted by a coefficient.
In many implementations the policy and the value model share a transformer backbone, with one head for next-token prediction and one for the value, and PPO updates the backbone and both heads together. The reward model and the reference model stay frozen. Steps 7 to 9 can run several epochs on one batch, which is exactly why the ratio and the clip are needed: after the first pass, pi theta is no longer pi theta old.

---

<p class="eyebrow"><span class="paper">RLHF, PPO and GRPO</span> · Part 5, GRPO · Shao et al. 2024, Fig. 4</p>

## What does GRPO drop?

<div class="rows">
<div class="points">
<div class="text">

- Three models: the policy $\pi_\theta$, the reference $\pi_{\rm ref}$ and the reward model $r_\phi$.
- The value model is gone, and with it GAE.

</div>
<div class="text">

- Each prompt gets a group of answers, so the policy is indexed by answer $i$ and token $t$: $\pi_\theta(o_{i,t} \mid q, o_{i,\lt t})$.
- The advantage comes from the group (next slide).

</div>
</div>
<div class="fig"><img src="img/week-04-grpo-fig4.png" alt="Shao et al. Figure 4. Top, PPO: the policy model writes output o; a frozen reference model and a frozen reward model give a KL-penalised reward r; a trained value model gives v; GAE turns r and v into the advantage A. Bottom, GRPO: the policy writes o1 to oG; the frozen reward model scores them r1 to rG; a group computation gives A1 to AG; the KL to the reference model goes straight to the policy"></div>
</div>

<p class="footnote">Shao et al. 2024, "DeepSeekMath: Pushing the Limits of Mathematical Reasoning in Open Language Models", arXiv:2402.03300, §4.1, Fig. 4 (bottom row)</p>

Note:
Now from PPO to GRPO, group relative policy optimization. It uses a simpler setup. PPO had four models: policy, reference, reward and value. GRPO keeps three. The policy model pi theta, the one we optimise; because GRPO samples a group of answers per prompt, we index by both the answer i and the token position t. The reference model, a frozen copy of the model before RL, anchoring the KL penalty. And the reward model we trained earlier, which scores complete answers.
The value model V psi: GRPO removes it entirely. And because there is no value model, there is no GAE either. Instead GRPO computes the advantage from a group of sampled answers. Compare the two rows of the paper's figure: the value model and the GAE box are gone; a "group computation" takes their place.

---

<p class="eyebrow"><span class="paper">RLHF, PPO and GRPO</span> · Part 5, GRPO · group as baseline · Shao et al. 2024 §4.1.2</p>

## How does a group of answers become the baseline?

<div class="cols wide-fig">
<div class="text">

<div class="eq">$$\hat A_{i,t} = \tilde r_i = \frac{r_i - \mathrm{mean}(r_1, \dots, r_G)}{\mathrm{std}(r_1, \dots, r_G)}$$</div>

<dl class="where">
<dt>$o_1, \dots, o_G$</dt><dd>a <b>group</b> of $G$ answers to one prompt, sampled from $\pi_{\theta_{\rm old}}$</dd>
<dt>$r_i$</dt><dd>answer $i$'s reward, $r_\phi(q, o_i)$</dd>
<dt>$\tilde r_i$</dt><dd>its normalised reward, given to every token $t$ of $o_i$</dd>
</dl>

- An answer above the group's average gets a positive advantage.

<p class="q"><b>Q.</b> Four answers, one right (1) and three wrong (0). Advantages?</p>
<p class="a"><b>A.</b> Mean 0.25, std 0.433: +1.73 for the right one, −0.58 for each wrong one</p>

</div>
<div class="fig"><img src="img/week-04-grpo-adv.svg" alt="Illustration: two groups of four answers with 0/1 rewards. Hard question, one right: the right answer gets +1.73, each wrong one -0.58. Easy question, three right: each right answer +0.58, the wrong one -1.73"></div>
</div>

<p class="footnote">$r_i$ is a reward, not the ratio $r_{i,t}(\theta)$ of the next slide. Shao et al. 2024 §4.1.2, outcome supervision; the paper samples $G$ = 64. std: standard deviation, population form in our numbers. Figure from Week 4 (ours)</p>

Note:
How does GRPO compute the advantage? For each question q, sample a group of answers from the old policy, o1 up to oG. The reward model scores each, giving G rewards r1 up to rG. Instead of a value model as the baseline, GRPO uses the rewards within the same group: for each answer, subtract the group's mean reward and divide by the group's standard deviation. That normalised reward is the advantage for the answer, and the same advantage is assigned to every token in it.
If an answer scores above the group average its advantage is positive, and GRPO encourages answers like it; below average, negative, and GRPO discourages it. That's what "group as baseline" means: an answer is judged relative to other answers to the same prompt, not relative to a learned value estimate.
Worked numbers from Week 4: one right answer in four gets plus 1.73, each wrong one minus 0.58; on an easy question with three right, each right answer gets only plus 0.58 and the wrong one minus 1.73.

--

<p class="eyebrow"><span class="paper">RLHF, PPO and GRPO</span> · Part 5, GRPO · Later work · Liu et al. 2025, Yu et al. 2025 · optional</p>

## What if every answer in the group gets the same score?

<div class="cols">
<div class="text">

- All right or all wrong: the mean equals every reward and the std is 0, so the formula is 0/0.
- Code adds a small constant, so every advantage is 0: the prompt teaches nothing.
- Near-equal scores are worse: 0.80, 0.81, 0.80, 0.81 become −1, +1, −1, +1.
- DAPO drops all-same groups; Dr. GRPO drops the std altogether.

</div>
<div class="text">

<p class="q"><b>Q.</b> When does a group spread out naturally?</p>
<p class="a"><b>A.</b> With a checker: some answers pass the unit tests, some fail (Part 6)</p>

</div>
</div>

<p class="footnote">Ours, after Week 4's GRPO section. Yu et al. 2025, DAPO, arXiv:2503.14476 (dynamic sampling). Liu et al. 2025, "Understanding R1-Zero-Like Training", arXiv:2503.20783 (Dr. GRPO)</p>

Note:
Optional, from Week 4. The paper doesn't discuss the case where every answer in a group gets the same reward: the formula is zero over zero, implementations add a small epsilon to the std, and every advantage becomes zero, so the prompt contributes no gradient. Near-identical reward-model scores are worse than equal ones: a std of 0.005 multiplies tiny differences by 200, and four answers that are all about the same look like two right and two wrong. DAPO, a later repair of GRPO, filters out groups whose answers are all right or all wrong; Dr. GRPO removes the std division, and the length average, altogether. This is the low-reward-variance point of Part 6, seen from the formula.

---

<p class="eyebrow"><span class="paper">RLHF, PPO and GRPO</span> · Part 5, GRPO · Shao et al. 2024, Eq. 3, Eq. 4</p>

## What is GRPO's objective, and its KL estimate?

<div class="eq">$$J_{\rm GRPO}(\theta) = \mathbb E\Big[\frac1G\sum_{i=1}^{G}\frac{1}{\lvert o_i\rvert}\sum_{t=1}^{\lvert o_i\rvert}\Big\{\min\big(r_{i,t}(\theta)\hat A_{i,t},\ \mathrm{clip}(r_{i,t}(\theta), 1-\epsilon, 1+\epsilon)\hat A_{i,t}\big) - \beta\thinspace \mathbb D_{\rm KL}[\pi_\theta \Vert \pi_{\rm ref}]\Big\}\Big]$$</div>

<div class="cols">
<div class="text">

<dl class="where">
<dt>$r_{i,t}(\theta)$</dt><dd>the importance ratio for token $t$ of answer $i$</dd>
<dt>$\hat A_{i,t}$</dt><dd>the group advantage $\tilde r_i$</dd>
<dt>$\mathbb D_{\rm KL}$</dt><dd>the per-token KL, by the <b>$k_3$ estimator</b>: $\rho_{i,t} - \log\rho_{i,t} - 1$</dd>
<dt>$\rho_{i,t}$</dt><dd>$\pi_{\rm ref}(o_{i,t} \mid q, o_{i,\lt t})/\pi_\theta(o_{i,t} \mid q, o_{i,\lt t})$</dd>
<dt>$G$, $\lvert o_i\rvert$</dt><dd>the group size, and answer $i$'s length</dd>
<dt>$\epsilon$, $\beta$</dt><dd>the clip range, and the KL weight</dd>
</dl>

</div>
<div class="text">

- PPO's clipped objective, averaged over the group and each answer's tokens.
- The KL moves out of the reward and into the objective, as a separate penalty.
- $k_3$ is never negative and usually has lower variance than PPO's $k_1$.

<p class="q"><b>Q.</b> $\rho$ = 1: what is $k_3$?</p>
<p class="a"><b>A.</b> $1 - 0 - 1 = 0$: no penalty where the two models agree</p>

</div>
</div>

<p class="footnote">Shao et al. 2024 §4.1.1, Eq. 3, Eq. 4; $\beta$ = 0.04 and $G$ = 64 from its RL training setup. $k_3$: Schulman 2020's name. The expectation is over $q \sim P(Q)$ and the group $\{o_i\} \sim \pi_{\theta_{\rm old}}$</p>

Note:
GRPO's objective is very like PPO's, adapted to groups. Instead of one answer per prompt, sample a group of G answers from the old policy. For each answer and each token, compute the importance ratio r i t: the token's probability under the current policy over its probability under the old policy, given the prompt and the earlier tokens. The advantage A hat i t is the group-relative reward from the last slide. The clipping is the same as PPO's: it stops the current policy moving too far from the old one in one update.
One difference from the PPO we built: where the KL goes. In PPO the KL penalty was inside the reward signal. In GRPO it is subtracted directly in the objective as a separate regularisation term, and it uses the k3 estimator: rho minus log rho minus 1, where rho is the reference's probability of the token over the current policy's. Compared with the k1 estimate PPO uses, k3 is always non-negative and usually has lower variance.
So in short: GRPO keeps PPO's clipped objective, removes the value model, replaces the value baseline with a group-relative one, and adds the KL term directly to the objective.

--

<p class="eyebrow"><span class="paper">RLHF, PPO and GRPO</span> · Part 5, GRPO · Week 4, GRPO section · optional</p>

## Why $k_3$ and not $k_1$?

<div class="cols wide-text">
<div class="text">

- Both use one sampled token and average to the true KL, on the policy's own tokens.
- $k_1 = -\log\rho$ can be negative; inside a reward that is fine, since a reward is not differentiated.
- In a loss the gradient matters: $k_1$'s expected gradient is 0, while $k_3$'s pulls toward the reference.
- Toy policy (0.8, 0.2), reference (0.5, 0.5): true KL 0.193; $k_3$ variance 0.038 against $k_1$'s 0.307 (ours).

</div>
<div class="fig"><img src="img/week-04-grpo-kl-est.svg" alt="Illustration: per-token KL estimates against u on a log axis. k3 = u - log u - 1 is a curve touching zero at u = 1 and positive elsewhere; k1 = -log u is a falling line that goes negative above u = 1. Dots at u = 0.625 (k1 +0.470, k3 +0.095) and u = 2.5 (k1 -0.916, k3 +0.584)"></div>
</div>

<p class="footnote">Ours, after Week 4. The figure's $u$ is this slide's $\rho$. Tang &amp; Munos 2025, arXiv:2506.09477: $k_3$ in a loss gives the KL's gradient with the two distributions swapped</p>

Note:
Optional, from Week 4. Write rho for the reference's probability of the sampled token over the policy's. k1 is minus log rho: right on average, but a single token can give a negative value. k3 is rho minus log rho minus 1: still right on average, because rho minus 1 averages to zero on the policy's own tokens, and never negative. On a toy two-token policy, (0.8, 0.2) against a reference (0.5, 0.5), the true KL is 0.193; both estimators average to it, with variances 0.038 for k3 and 0.307 for k1.
The deeper reason is the gradient. As a loss term, k1's expected gradient is zero: it pulls the policy nowhere. k3's pulls toward the reference, though Tang and Munos point out it is the gradient of the divergence with its arguments swapped, not quite the KL that Eq. 3 writes. At small beta the difference barely matters.

---

<p class="eyebrow"><span class="paper">RLHF, PPO and GRPO</span> · Part 5, GRPO · one GRPO step</p>

## One GRPO step: what happens?

<table class="rules">
  <tr><td>step</td><td>what</td><td>formula</td></tr>
  <tr><td>1</td><td>freeze the policy; sample a group per prompt</td><td>$\pi_{\theta_{\rm old}} \leftarrow \pi_\theta$; $\{o_1, \dots, o_G\} \sim \pi_{\theta_{\rm old}}(\cdot \mid q)$</td></tr>
  <tr><td>2</td><td>score every answer, with a reward model or a checker</td><td>$r_i = r_\phi(q, o_i)$</td></tr>
  <tr><td>3</td><td>for every answer and token, in parallel: ratio, advantage, KL</td><td>$r_{i,t}(\theta)$; $\hat A_{i,t} = (r_i - \mathrm{mean}(r))/\mathrm{std}(r)$; $\rho_{i,t} - \log\rho_{i,t} - 1$</td></tr>
  <tr><td>4</td><td>minimise the negative objective</td><td>$L_{\rm GRPO} = -J_{\rm GRPO}$</td></tr>
</table>

<div class="cols">
<div class="text">

- Only the policy is updated; the reference and the reward source stay frozen.
- No value model and no value loss, so no backward GAE pass.

</div>
<div class="text">

<p class="q"><b>Q.</b> Count the forward passes PPO needs that GRPO does not.</p>
<p class="a"><b>A.</b> The value model's, at rollout and in every update; but GRPO samples $G$ answers per prompt</p>

</div>
</div>

<p class="footnote">Reward source: a reward model or a rule, such as a checker of the final answer or unit tests for code</p>

Note:
One step of GRPO, as for PPO. First copy the current policy and freeze it as the old policy; for each prompt, sample a group of answers from it, o1 to oG. Next use a reward model, or more generally a reward function, to score each answer: a group of scores r1 to rG, r i being the score for prompt q and answer o i. Then for each answer and each token compute, in parallel: the importance ratio, comparing the token's probability under the current and the old policy; the advantage, the group-normalised reward assigned to every token of the answer; and the per-token KL term between the current policy and the reference, which is multiplied by beta and subtracted from the objective. Since J GRPO is to be maximised, in code we minimise its negative.
During GRPO training only the policy is updated. The reference model stays frozen, and so does the reward source, whether a reward model or a reward function.

---

<p class="eyebrow"><span class="paper">RLHF, PPO and GRPO</span> · Part 6, PPO or GRPO</p>

## How do PPO and GRPO differ?

<table class="rules">
  <tr><td></td><td>PPO</td><td>GRPO</td></tr>
  <tr><td>baseline</td><td>a learned value model (the critic)</td><td>the group of sampled answers</td></tr>
  <tr><td>advantage</td><td>per token, by GAE</td><td>per answer, the same on every token</td></tr>
  <tr><td>models</td><td>4, two trained</td><td>3, one trained</td></tr>
  <tr><td>KL</td><td>$k_1$, inside the reward</td><td>$k_3$, in the objective</td></tr>
  <tr><td>cost (rule of thumb)</td><td>heavier: policy and value model to train</td><td>simpler and cheaper, but $G$ answers per prompt</td></tr>
  <tr><td>the question it asks</td><td>"Was this token better than my value estimate?"</td><td>"Was this answer better than other answers to the same prompt?"</td></tr>
</table>

<p class="q"><b>Q.</b> Which is more general?</p>
<p class="a"><b>A.</b> PPO: it works with rewards at every step; GRPO needs several answers to one prompt</p>

<p class="footnote">Week 4's comparison table adds: with one update per batch, as in DeepSeekMath's runs, GRPO's clip never binds</p>

Note:
At a high level the biggest difference between PPO and GRPO is the choice of baseline. PPO uses a learned value model, the critic, as its baseline; GRPO uses the group of sampled answers. That leads to different characteristics. PPO learns a value model and estimates the advantage token by token. It's more general, but the training pipeline is heavier, because we train and update both the policy and the value model. GRPO needs no value model: it samples several completions per prompt, scores them and normalises the rewards within the group, so it is usually simpler and cheaper to train.
Intuitively, PPO asks: was this token better than my value estimate? GRPO asks: was this answer better than other answers to the same prompt?

---

<p class="eyebrow"><span class="paper">RLHF, PPO and GRPO</span> · Part 6, PPO or GRPO · rules of thumb</p>

## When would you choose PPO, and when GRPO?

<div class="cols">
<div class="text">

<p class="plain"><b>Choose PPO when</b></p>

- Token-level credit matters: long answers where some parts drive quality.
- Rewards within a group vary little, so a learned value baseline is steadier.
- Stability matters: PPO is the more mature, more tested recipe.
- Typical use: general RLHF for an assistant (helpful, honest, harmless).

</div>
<div class="text">

<p class="plain"><b>Choose GRPO when</b></p>

- Outcome-level supervision is enough: only the final answer needs judging.
- Group rewards spread out naturally: a checker or unit tests pass some answers and fail others.
- Simplicity and cost matter: no value model, no GAE.
- Typical use: reasoning with verifiable answers, such as maths and code.

</div>
</div>

<p class="footnote">These are rules of thumb from practice, not results from either paper; the sub-slide below gives what the papers and later work show</p>

Note:
When should we choose PPO? When token-level credit assignment matters. The reward model usually gives one score for the whole answer, not one per token; PPO uses the value model and GAE to propagate that sequence-level reward back and estimate token-level advantages. That is especially useful for long outputs, or where different parts of the answer contribute differently to its quality. PPO also helps when the reward variance within a group of sampled answers is low: then group normalisation gives a weak baseline, and a learned value model can be more robust. Another reason is stability: PPO is the more mature and widely tested recipe for general RLHF. Typical use: general RLHF for assistant alignment, making the model more helpful, honest and harmless.
And GRPO? When outcome-level supervision is enough: we only need to know whether the final answer is good or bad, not detailed token-level advantages from a value model. When rewards within a group naturally spread out: in maths or code, some completions pass the verifier or unit tests and others fail, which gives a clear relative signal. And simplicity: no value model, no GAE, so the pipeline is simpler and cheaper. That makes GRPO especially suited to verifiable reasoning: maths and code.

--

<p class="eyebrow"><span class="paper">RLHF, PPO and GRPO</span> · Part 6, PPO or GRPO · Week 4 critiques · optional</p>

## What do the papers and later work say about this advice?

<div class="cols">
<div class="text">

- Token credit: PPO's per-token credit needs $\lambda$ near 1 to reach early tokens, and then it is close to GRPO's whole-answer credit (Part 4).
- Head to head on maths, R1's supplement: GRPO 0.555, PPO 0.536 at best; one run each.
- Low variance: a value model is no fix for all-same groups; DAPO drops them instead.
- "Cheaper" is not measured: DeepSeekMath gives no memory or time numbers, and samples 64 answers per question.

</div>
<div class="text">

<p class="q"><b>Q.</b> Which claim in the guide is best supported?</p>
<p class="a"><b>A.</b> "Verifiable rewards suit GRPO": R1 and DeepSeekMath both use it there; the rest is plausible but untested (ours)</p>

</div>
</div>

<p class="footnote">Our reading. DeepSeek-AI 2025, arXiv:2501.12948, supplement; Shao et al. 2024 §1, §6; Yu et al. 2025, DAPO, arXiv:2503.14476. Week 4, GRPO critiques</p>

Note:
Optional: the rules of thumb against the evidence in Week 4. Token-level credit: with one reward at the end, PPO's GAE at lambda 0.95 barely reaches the early tokens, and at lambda 1 its advantage is the final return minus the value, close to GRPO's score-the-whole-answer view; R1's supplement found PPO needed lambda 1 to come near GRPO on MATH. That is one run per setting, by GRPO's authors. Low within-group variance: true that the group baseline is weak there, and a group with identical rewards teaches nothing; DAPO's fix is to drop those groups and sample new ones, not to add a value model. Cost: DeepSeekMath says GRPO uses fewer resources but gives no number, and it samples 64 answers per question. Stability and maturity: fair as a description of practice, not something any of our readings tests.

---

<p class="eyebrow"><span class="paper">RLHF, PPO and GRPO</span> · summary</p>

## What to keep from the hour

<div class="cols">
<div class="text">

- SFT teaches imitation; a reward model trained on rankings adds a score to optimise.
- Policy, reward model and value model are one network design with different heads.
- PPO: per-token rewards with a KL penalty, GAE advantages from a value model, a clipped ratio on reused rollouts.
- GRPO: the group is the baseline, the KL moves into the loss, the value model goes.

</div>
<div class="text">

<table class="rules nohead">
  <tr><td>InstructGPT</td><td>Ouyang et al. 2022, arXiv:2203.02155</td></tr>
  <tr><td>PPO</td><td>Schulman et al. 2017, arXiv:1707.06347</td></tr>
  <tr><td>GAE</td><td>Schulman et al. 2015, arXiv:1506.02438</td></tr>
  <tr><td>GRPO</td><td>Shao et al. 2024, arXiv:2402.03300</td></tr>
</table>

<p class="q"><b>Q.</b> What is the one quantity both methods multiply each token's gradient by?</p>
<p class="a"><b>A.</b> An advantage: from GAE in PPO, from the group in GRPO</p>

</div>
</div>

<p class="footnote">Three of the four are read in depth in the Week 4 deck</p>

Note:
That is the whole pipeline: the motivation for RLHF, supervised fine-tuning, reward modelling, PPO and GRPO. This is a high-level walk-through; the original papers have the design choices and details. Those four papers are the references here, and three of them are Week 4's readings in depth.
Four things to keep. SFT teaches imitation; a reward model trained on rankings gives a score to optimise. One backbone, three heads: the policy predicts tokens, the reward model gives one number for the answer, the value model one number per token. PPO turns the final score into per-token rewards with a KL penalty, estimates advantages with GAE and a value model, and clips the ratio so reused rollouts don't push too far. GRPO replaces the value model with a group of answers to the same prompt, and moves the KL into the loss.
