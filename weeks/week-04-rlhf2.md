
<p class="eyebrow"><span class="paper">RLHF, PPO and GRPO</span> · roadmap</p>

## What will this hour cover?

<div class="cols wide-text">
<div class="text">

<table class="rules">
  <tr><td>part</td><td>the question it answers</td></tr>
  <tr><td>1. Motivation, RL basics</td><td>why is copying answers not enough?</td></tr>
  <tr><td>2. SFT and the reward model</td><td>how do rankings become a score?</td></tr>
  <tr><td>3. Reward to policy gradient</td><td>how does a score become a gradient?</td></tr>
  <tr><td>4. Reward to advantage</td><td>which tokens deserve the credit?</td></tr>
  <tr><td>5. Advantage to PPO</td><td>how far can one batch move the policy?</td></tr>
  <tr><td>6. PPO on a language model</td><td>why a KL penalty to the reference, and which KL?</td></tr>
  <tr><td>7. GRPO</td><td>what if we drop the value model?</td></tr>
  <tr><td>8. PPO or GRPO</td><td>when does each fit?</td></tr>
</table>

</div>
<div class="text">

- Bottom up: each part fixes the problem the last one left.
- The KL penalty comes last, once the policy gradient and PPO are in place.

<dl class="where">
<dt>$q$, $o$</dt><dd>the prompt (question) and the model's output (answer)</dd>
<dt>$o_t$</dt><dd>token $t$ of the answer; $o_{\lt t}$ the tokens before it</dd>
</dl>

</div>
</div>

<p class="footnote">The letters follow the GRPO paper (Shao et al. 2024, arXiv:2402.03300). Week 4 reads InstructGPT, PPO and GRPO one paper at a time</p>

Note:
This deck builds RLHF from the reward up. After the motivation and the first two stages, supervised fine-tuning and the reward model, it does the reinforcement learning from scratch: what the policy is rewarded for, how a score becomes a gradient, why that gradient is noisy and blames the wrong tokens, how the advantage fixes both, and how PPO reuses each batch safely. Only then does it return to the language model and ask why there is a KL penalty to the reference model, and why it is the KL with the policy first. GRPO and the choice between the two come at the end.
The same material is in the Week 4 deck as three readings: InstructGPT, PPO and GRPO. Checks, worked numbers and caveats sit on optional sub-slides below the main slides. The letters: q is the prompt, o the answer, o t its token t; these are the GRPO paper's letters. In Parts 3 to 5 we also use the general RL letters, s for a state and a for an action; for a language model the state is the prompt plus the tokens so far, and the action is the next token.

--

<p class="eyebrow"><span class="paper">RLHF, PPO and GRPO</span> · roadmap · notation · optional</p>

## Which letters does the deck use?

<div class="cols">
<div class="text">

<table class="rules nohead" style="font-size:19px">
  <tr><td>$q$, $o$</td><td>the prompt, and the answer</td></tr>
  <tr><td>$o_t$, $o_{\lt t}$, $T$</td><td>token $t$, the tokens before it, the answer's length</td></tr>
  <tr><td>$s_t$</td><td>the state, $(q, o_{\lt t})$; the action is the token $o_t$</td></tr>
  <tr><td>$\pi_\theta$, $\theta$</td><td>the policy (the language model), and its weights</td></tr>
  <tr><td>$\pi_{\theta_{\rm old}}$</td><td>the frozen copy that sampled the batch</td></tr>
  <tr><td>$\pi_{\rm ref}$</td><td>the reference: the frozen SFT model</td></tr>
  <tr><td>$r_\phi(q, o)$, $R$</td><td>the reward model's score; an answer's total reward</td></tr>
  <tr><td>$r_t$</td><td>the step reward of token $t$</td></tr>
  <tr><td>$G_t$</td><td>the return (reward-to-go) from step $t$</td></tr>
  <tr><td>$\gamma$</td><td>the discount factor</td></tr>
  <tr><td>$K$</td><td>answers per prompt: ranked (Part 2), or a GRPO group</td></tr>
</table>

</div>
<div class="text">

<table class="rules nohead" style="font-size:19px">
  <tr><td>$V_\psi$, $v_t$</td><td>the value model, and its prediction $V_\psi(s_t)$</td></tr>
  <tr><td>$Q$, $A$, $\hat A_t$</td><td>action value, advantage, estimated advantage</td></tr>
  <tr><td>$\delta_t$</td><td>the TD residual, a one-step advantage estimate</td></tr>
  <tr><td>$\lambda$</td><td>the GAE parameter</td></tr>
  <tr><td>$\rho_t(\theta)$</td><td>the importance ratio $\pi_\theta / \pi_{\theta_{\rm old}}$ of token $t$</td></tr>
  <tr><td>$\epsilon$</td><td>the clip range</td></tr>
  <tr><td>$\mathrm{KL}_t$, $\beta$</td><td>the per-token KL estimate, and its weight</td></tr>
  <tr><td>$\delta_{\rm KL}$</td><td>TRPO's trust-region size</td></tr>
  <tr><td>$H$</td><td>entropy</td></tr>
  <tr><td>$c_1$, $c_2$</td><td>weights of the value loss and the entropy bonus</td></tr>
  <tr><td>$u$</td><td>GRPO's ratio $\pi_{\rm ref}/\pi_\theta$ in its KL estimate</td></tr>
</table>

</div>
</div>

<p class="footnote">One letter, one meaning. Where a paper differs: PPO writes $r_t(\theta)$ for $\rho_t(\theta)$ and $S$ for $H$; GRPO writes $G$ for $K$ and $r_i$ for $R_i$</p>

Note:
Optional, a reference card. Every letter in the deck keeps one meaning from start to finish; each is also defined again on the slides that use it. Three places differ from the papers, so the figures taken from them may show the paper's letter: PPO writes r t of theta for the importance ratio, which we call rho to keep r for rewards; PPO writes S for entropy, we use H; and GRPO writes G for its group size, which we call K, since G is the return here.

---

<p class="eyebrow"><span class="paper">RLHF, PPO and GRPO</span> · Part 1, motivation</p>

## Why is supervised fine-tuning alone not enough?

<div class="cols wide-fig">
<div class="text">

- **SFT** (supervised fine-tuning) teaches the model to copy one reference answer.
- It never shows two answers side by side.
- To be helpful, honest and harmless, the model must learn which answer people prefer.
- Learning from comparisons is the motivation for **RLHF**: reinforcement learning (next slide) from human feedback.

<p class="plain">Comparisons are easier when many answers are good, or when judging is easier than writing.</p>

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
- In state $s$ its **policy** picks action $a$; it gets a **reward** $r$ ($R_t$ in the figure) and a new state $s'$.
- The goal: behaviour that maximises the total reward over time.

<p class="plain">RL scores the model's own action instead of giving it a label to copy.</p>

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
  <tr><td>term</td><td>what it is</td><td>for us</td></tr>
  <tr><td><b>policy</b></td><td>how the agent chooses actions</td><td>the language model</td></tr>
  <tr><td><b>trajectory</b> / <b>rollout</b></td><td>the sequence of states, actions and rewards / the act of sampling one from the current policy</td><td>one sampled answer to a prompt</td></tr>
  <tr><td><b>return</b></td><td>the total future reward from a step onward</td><td>what training maximises (Part 3)</td></tr>
  <tr><td><b>value</b></td><td>the expected return from a state: how good things look from here</td><td>predicted by a value model (Part 4)</td></tr>
  <tr><td><b>advantage</b></td><td>how much better or worse an action turned out than the state's expected value</td><td>the weight on each token's update (Part 4)</td></tr>
</table>

<p class="plain">The advantage judges a single action; the value judges the state before the action is chosen.</p>

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
- From here on the state is $s_t = (q, o_{\lt t})$ and the action is the token $o_t$; appending it gives $s_{t+1}$.

<p class="plain">Nothing in this environment is random: appending a token is certain, and only the policy samples.</p>

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
- This is OpenAI's InstructGPT pipeline; Parts 2 to 6 take the stages one at a time.

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

<p class="plain">The objective is pre-training's; the data, a prompt followed by a good answer, is what changes behaviour.</p>

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

<p class="plain">A ranking of 9 answers gives $\binom 92 = 36$ pairs.</p>

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

<p class="plain">If the chosen answer scores 1.0 higher, the loss is $-\ln\sigma(1) = -\ln 0.731 = 0.313$ (ours).</p>

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

<p class="plain">Pairs from one ranking are correlated, so shuffled they overfit; kept together, each answer passes through the reward model once: 9 forward passes, not 36.</p>

</div>
</div>

<p class="footnote">Ouyang et al. 2022 §3.5: shuffled pairs made the model overfit; "we train on all $\binom K2$ comparisons from each prompt as a single batch element". Week 4, InstructGPT section</p>

Note:
Optional, a practical detail and InstructGPT's version of it. Different prompts give different numbers of pairs, so averaging pair by pair lets prompts with many ranked answers dominate. So first average a prompt's pairs, then average across prompts.
InstructGPT does the same and gives a second reason. The pairs within one ranking are highly correlated: if you shuffle them into the dataset as separate examples, each answer is seen many times in one epoch, and the reward model overfits. So they train on all of a prompt's comparisons as one batch element. That is also cheaper: "a single forward pass of the RM for each completion", 9 for K = 9, instead of one per pair, 36, as the paper counts it.

---

<p class="eyebrow"><span class="paper">RLHF, PPO and GRPO</span> · Part 3, from a reward to a policy gradient · the reward</p>

## What is the policy rewarded for?

<div class="cols wide-fig">
<div class="text">

<div class="eq">$$G_t = \sum_{k=t}^{T}\gamma^{k-t}r_k$$</div>

<dl class="where">
<dt>$r_t$, $T$</dt><dd>the <b>step reward</b> for token $t$; the last token</dd>
<dt>$G_t$, $R$</dt><dd>the <b>return</b> from step $t$, all the reward still to come; the <b>total reward</b> $R = G_1$</dd>
<dt>$\gamma$</dt><dd>the <b>discount factor</b>, between 0 and 1; here 1</dd>
</dl>

- The reward model scores the whole answer, so $r_t$ is 0 until the last token.

<p class="plain">Every token of an answer shares one return: one reward, at the end, and no discount.</p>

</div>
<div class="fig"><img src="img/week-04-rlhf2-rewards.svg" alt="Illustration: two answers to Explain gravity simply. Gravity pulls objects together, reward model score +2, step rewards 0, 0, 0, 2 and every return 2. Gravity pulls objects apart, score minus 1, step rewards 0, 0, 0, minus 1 and every return minus 1"></div>
</div>

<p class="footnote">Example ours: prompt "Explain gravity simply."; scores illustrative. $\gamma$ = 1: InstructGPT, "No discount is applied" (App. C); Stiennon et al. 2020 §3.4</p>

Note:
Everything in this part and the next is built from the reward, so start there. In RLHF the reward has an unusual shape. The reward model gives one score for the whole answer, not one per token. So the step reward r t is zero for every token except the last, where it is the score.
The return G t is everything still to come from step t: the sum of the later step rewards, each discounted by gamma to the power of how far ahead it is. In RLHF gamma is 1: InstructGPT says no discount is applied, and the summarisation paper that InstructGPT builds on, Stiennon et al., uses gamma 1 too. With one final score and no discount, every token's return is just that score.
Our running example for the next three parts: the prompt "Explain gravity simply.", and two answers. "Gravity pulls objects together" gets a score of 2. "Gravity pulls objects apart" gets minus 1. Same first three words; only the last one differs. Keep the bad answer in mind: the first three words were fine, and only "apart" was wrong.

---

<p class="eyebrow"><span class="paper">RLHF, PPO and GRPO</span> · Part 3, from a reward to a policy gradient · the RL objective</p>

## What exactly does RL maximise?

<div class="eq">$$J(\theta) = \mathbb E_{\tau\sim\pi_\theta}\big[R(\tau)\big],\qquad p_\theta(\tau) = p(s_0)\prod_{t=0}^{T}\pi_\theta(o_t \mid s_t)\thinspace P(s_{t+1} \mid s_t, o_t)$$</div>

<div class="cols">
<div class="text">

<dl class="where">
<dt>$\tau$</dt><dd>a <b>trajectory</b>, $(s_0, o_1, s_1, o_2, \dots)$: for us, a prompt and its answer</dd>
<dt>$R(\tau)$</dt><dd>the trajectory's <b>total reward</b>, $\sum_t r_t$</dd>
<dt>$J(\theta)$</dt><dd>the <b>objective</b>: the return averaged over trajectories</dd>
<dt>$p(s_0)$, $P$</dt><dd>the start-state distribution (the prompts) and the environment's transition probability</dd>
<dt>$\pi_\theta(o_t \mid s_t)$</dt><dd>the policy's probability of $o_t$ in $s_t$; $\theta$ its weights</dd>
</dl>

</div>
<div class="text">

- $p_\theta(\tau)$ multiplies the start, every policy choice and every transition.
- We adjust $\theta$ so the policy's trajectories earn more on average.

<p class="plain">For a language model, $P(s_{t+1} \mid s_t, o_t)$ is 1 for "append the token" and 0 for anything else.</p>

</div>
</div>

<p class="footnote">Next: the gradient of $J$</p>

Note:
Now the objective. Suppose tau is a trajectory: a sequence of states and actions, s0, a0, s1, a1 and so on, generated by following the policy pi theta. For us a trajectory is a prompt and the answer the model writes to it. At each step the action is sampled from the policy given the current state; after the action, the environment moves to the next state according to its transition probability P.
The goal is the expected return: J of theta, the average total reward over trajectories sampled from the current policy. We want to adjust theta so that, on average, the trajectories the policy generates earn more. The probability of a whole trajectory is a product: the start state, then every policy choice and every environment transition. For a language model the start state is a prompt drawn from the prompt dataset, and the transition is "append the token", which is certain.

---

<p class="eyebrow"><span class="paper">RLHF, PPO and GRPO</span> · Part 3, from a reward to a policy gradient · the log-derivative trick</p>

## How do you take the gradient of an average over samples?

<div class="eq">$$\nabla_\theta J(\theta) = \sum_\tau R(\tau)\thinspace\nabla_\theta p_\theta(\tau) = \sum_\tau p_\theta(\tau)\thinspace R(\tau)\thinspace\nabla_\theta\log p_\theta(\tau) = \mathbb E_{\tau\sim\pi_\theta}\big[R(\tau)\thinspace\nabla_\theta\log p_\theta(\tau)\big]$$</div>

<div class="cols">
<div class="text">

<dl class="where">
<dt>$\nabla_\theta$</dt><dd>the gradient with respect to the policy's weights $\theta$</dd>
<dt>$p_\theta(\tau)$</dt><dd>the probability the policy gives trajectory $\tau$</dd>
<dt>$R(\tau)$</dt><dd>its total reward</dd>
</dl>

- The **log-derivative trick**: $\nabla_\theta p_\theta = p_\theta\thinspace\nabla_\theta\log p_\theta$.

</div>
<div class="text">

- The result is an average under the policy, so sampled answers can estimate it.
- It never needs the gradient of $G$: the reward can be any black box.

<p class="plain">We cannot backpropagate through the sampling: picking a token is a discrete draw, and the reward model scores text, not probabilities.</p>

</div>
</div>

<p class="footnote">The sum over $\tau$ runs over every possible answer; for continuous actions it is an integral. Check the trick on $p = e^\theta$: both sides are $e^\theta$</p>

Note:
How do we take the gradient of J? The difficulty: J is an average over answers that the policy itself samples, so changing theta changes which answers we would see. Why not just backpropagate through the sampling, the way we backpropagate through everything else? Because choosing a token is a discrete draw: there is no gradient of "which token came out" with respect to the weights. And the reward model scores the sampled text, not the probabilities.
The way out is the log-derivative trick. Write J as a sum over all trajectories of probability times return. The gradient only touches the probability. And the gradient of a probability equals the probability times the gradient of its log. So the gradient becomes a sum of probability, times return, times the gradient of the log probability: an expectation under the policy. That we can estimate by sampling answers.
Notice what we never needed: the gradient of G. The reward can be any black box: a reward model, a unit test, a human. That is what makes reinforcement learning usable with a reward model at all.

---

<p class="eyebrow"><span class="paper">RLHF, PPO and GRPO</span> · Part 3, from a reward to a policy gradient · one term per token</p>

## Why does $\log p_\theta(\tau)$ split into one term per token?

<div class="eq">$$\nabla_\theta\log p_\theta(\tau) = \nabla_\theta\Big[\log p(s_0) + \sum_t\log\pi_\theta(o_t \mid s_t) + \sum_t\log P(s_{t+1} \mid s_t, o_t)\Big] = \sum_t\nabla_\theta\log\pi_\theta(o_t \mid s_t)$$</div>

<div class="cols">
<div class="text">

<dl class="where">
<dt>$p(s_0)$</dt><dd>the start-state probability: which prompt we drew</dd>
<dt>$\pi_\theta(o_t \mid s_t)$</dt><dd>the policy's probability of token $o_t$ given the text so far</dd>
<dt>$P$</dt><dd>the transition probability: "append the token"</dd>
</dl>

</div>
<div class="text">

- The log turns the product into a sum.
- Only the policy's terms depend on $\theta$, so we never need a model of the environment.
- For a language model the sum is the answer's log-likelihood, the quantity SFT maximises.

<p class="plain">For a language model $\nabla_\theta\log P = 0$: "append the token" has no $\theta$ in it.</p>

</div>
</div>

<p class="footnote">So $\nabla_\theta J = \mathbb E\big[R(\tau)\sum_t\nabla_\theta\log\pi_\theta(o_t \mid s_t)\big]$: the policy gradient. In a robot task $P$ is unknown physics, and it still drops out</p>

Note:
Now expand the trajectory's probability. It is the start-state probability, times every policy probability, times every transition probability. Take the log and the products become sums. Only the policy terms depend on theta: the start distribution and the transitions don't, so their gradients vanish. What is left is the sum over time of the gradient of log pi theta of o t given s t.
That is a remarkable simplification. We never need a model of the environment. In a robot task the transitions are unknown physics, and they still drop out. For a language model they are trivially "append the token".
And look at what the sum is for a language model: the sum over the answer's tokens of the log probability of each token given the text before it. That is the answer's log-likelihood, exactly the quantity SFT maximises. Put back into the last slide, the policy gradient is the return times the gradient of the answer's log-likelihood.

---

<p class="eyebrow"><span class="paper">RLHF, PPO and GRPO</span> · Part 3, from a reward to a policy gradient · REINFORCE · Williams 1992</p>

## What is REINFORCE?

<div class="eq">$$\hat g = \frac1N\sum_{i=1}^{N}R(\tau_i)\sum_t\nabla_\theta\log\pi_\theta(o_{i,t} \mid s_{i,t})$$</div>

<div class="cols">
<div class="text">

<dl class="where">
<dt>$\hat g$</dt><dd>the estimated gradient; a hat means estimated from samples</dd>
<dt>$N$, $\tau_i$</dt><dd>the number of sampled answers, and answer $i$</dd>
<dt>$o_{i,t}$, $s_{i,t}$</dt><dd>token $t$ of answer $i$, and the text before it</dd>
</dl>

<p class="plain">In words: SFT on the model's own samples, each answer weighted by its score.</p>

</div>
<div class="text">

- **REINFORCE**: sample answers, score them, take one gradient step, repeat.
- **On-policy**: the samples must come from the current policy, so each batch is used once.
- One fact used below: $\mathbb E_{o\sim\pi_\theta}[\nabla_\theta\log\pi_\theta(o)] = \nabla_\theta\sum_o\pi_\theta(o) = \nabla_\theta 1 = 0$.

<p class="plain">If every answer scores exactly 1, REINFORCE does nothing on average, by that fact; each sample still adds noise.</p>

</div>
</div>

<p class="footnote">Williams 1992, "Simple statistical gradient-following algorithms for connectionist reinforcement learning", Machine Learning 8. As a loss to minimise: $-\frac1N\sum_i R(\tau_i)\sum_t\log\pi_\theta(o_{i,t} \mid s_{i,t})$</p>

Note:
Put the last two slides together and replace the expectation by an average over N sampled answers. That is REINFORCE, from Williams in 1992: for each answer, its return times the gradient of its log-likelihood, averaged. In code you write a loss: minus the return times the log-likelihood. Read it as SFT on the model's own samples, with each answer weighted by its score. A high score makes all of the answer's tokens more likely; a negative score makes them all less likely.
The loop: sample a batch of answers from the current policy, score them, take one gradient step, and sample again. That is what on-policy means: the gradient is only right for the policy that produced the samples, so after one step the batch is stale.
One fact we will use three times: the gradient of the log probability has mean zero under the policy, because the probabilities sum to one and the gradient of one is zero. So if every answer scores the same, say 1, REINFORCE's expected gradient is zero: imitating yourself does not move you on average. Each single sample still pushes somewhere, which is noise. Only differences in score carry signal.

---

<p class="eyebrow"><span class="paper">RLHF, PPO and GRPO</span> · Part 3, from a reward to a policy gradient · problem 1, noise</p>

## Why is REINFORCE so noisy?

<div class="cols wide-fig">
<div class="text">

- Two actions at 0.5 each, a softmax with logit $z$: $\partial_z\log\pi = \pm 0.5$.
- Rewards (left, right) = (1, 0): one sample gives 0.5 or 0. With (11, 10): 5.5 or −5.0.
- Both average 0.25, the true gradient; the spread grows with the rewards' size. (The figure's third row is Part 4.)

<p class="plain">With rewards (11, 10), one "right" sample pushes toward right by −5.0: the wrong way.</p>

</div>
<div class="fig"><img src="img/week-04-ppo-noise.svg" alt="Illustration: single-sample gradient estimates; rewards 1 and 0 give 0.5 or 0; rewards 11 and 10 give 5.5 or minus 5.0; with baseline 10.5 both samples give 0.25; the true gradient is 0.25 in every case"></div>
</div>

<p class="footnote">Ours, from Week 4's PPO section: the standard deviation grows from 0.25 to 5.25, 21 times. $R$: an action's reward; $\partial_z$: the derivative with respect to $z$. The third row is Part 4's fix</p>

Note:
REINFORCE is unbiased: on average it gives the true gradient. Its problem is how much a single sample can miss by. The smallest example: two actions, left and right, a softmax with a logit z on left and 0 on right, starting at z = 0 so each has probability one half. The derivative of log pi with respect to z is one minus pi of left, 0.5, for left, and minus pi of left, minus 0.5, for right. The true gradient of the expected reward is 0.25 times the difference in rewards.
With rewards 1 for left and 0 for right, one sample gives 1 times 0.5 or 0 times minus 0.5: 0.5 or 0. The mean is 0.25, correct, with standard deviation 0.25. Now add 10 to both rewards, 11 and 10. Nothing about which action is better has changed, and the true gradient is still 0.25. But one sample now gives 5.5 or minus 5.0. The mean is still 0.25; the standard deviation is 5.25, 21 times larger. A single "right" sample pushes toward right, the wrong way; only the average over many samples comes out right.
So the variance depends on the absolute size of the rewards, not just their differences. Ignore the third row of the figure for now: it is the fix in Part 4.

---

<p class="eyebrow"><span class="paper">RLHF, PPO and GRPO</span> · Part 3, from a reward to a policy gradient · problem 2, blame</p>

## Who gets the blame when only the last word is wrong?

<div class="cols wide-fig">
<div class="text">

- "Gravity pulls objects apart" scores −1; only "apart" is wrong.
- REINFORCE weights every token by −1, so the three good words are pushed down too.
- The good words recover only on average over many answers: slowly, and noisily.
- This is the **credit-assignment** problem: which action caused the reward?

<p class="plain">"Gravity" deserves a weight of about 0: it is in both answers, so it was no better or worse than expected.</p>

</div>
<div class="fig"><img src="img/week-04-rlhf2-blame.svg" alt="Illustration: bar chart over the four tokens Gravity, pulls, objects, apart; REINFORCE puts weight minus 1 on each"></div>
</div>

<p class="footnote">Example ours. Part 4 answers both problems: a baseline for the noise, a value model for the blame</p>

Note:
The second problem. Take the bad answer, "Gravity pulls objects apart", score minus 1. Only the last word is wrong. But REINFORCE multiplies the whole answer's log-likelihood by the score, so every token gets the same weight, minus 1. "Gravity", "pulls" and "objects" are pushed down exactly as hard as "apart".
Over many answers this washes out: "Gravity" also appears in the good answers, where it is pushed up, so on average it ends up right. But it washes out slowly and noisily. That is the credit-assignment problem: when the reward arrives at the end, which of the actions earned it? The longer the answer, the worse it gets. A long, good answer that hallucinates one fact at the end is punished everywhere.
What weight would "Gravity" deserve? About zero. It appears in both answers, so choosing it told us nothing about the outcome. Part 4 builds a weight that knows that.

---

<p class="eyebrow"><span class="paper">RLHF, PPO and GRPO</span> · Part 4, from a reward to an advantage · fix 1, reward-to-go</p>

## Why count only the rewards after step $t$?

<div class="eq">$$\nabla_\theta J = \mathbb E\Big[\sum_t\nabla_\theta\log\pi_\theta(o_t \mid s_t)\thinspace G_t\Big]$$</div>

<div class="cols">
<div class="text">

<dl class="where">
<dt>$G_t$</dt><dd>the <b>reward-to-go</b>: the return from step $t$ on, in place of the whole $R(\tau)$</dd>
<dt>$\nabla_\theta\log\pi_\theta(o_t \mid s_t)$</dt><dd>how to make token $o_t$ more likely</dd>
</dl>

- A token cannot change rewards that came before it.

</div>
<div class="text">

- Given $s_t$, an earlier reward is fixed, and $\nabla_\theta\log\pi_\theta(o_t \mid s_t)$ has mean 0, so their product averages to 0.
- Dropping them lowers the variance and keeps the average.

<p class="plain">It does not help "...apart": with one reward at the end every $G_t$ is −1. It matters once rewards arrive on every token (Part 6).</p>

</div>
</div>

<p class="footnote">GAE paper (Schulman et al. 2015, arXiv:1506.02438) §2 lists the weights we pass through: total reward, reward-to-go, minus a baseline, $Q$, the advantage, the TD residual</p>

Note:
The first fix is free. A token cannot affect rewards that were given before it was chosen. Formally: take the gradient term at step t and multiply it by a reward from an earlier step. Condition on the state at step t. That earlier reward is then fixed, and the gradient of log pi has mean zero given the state, by the fact from REINFORCE. So those cross terms are zero on average. Drop them, and each token is weighted only by the rewards from its own step on: the reward-to-go, which is just the return G t from Part 3.
The average is unchanged and the variance goes down, because we removed terms that were pure noise.
Does it help our bad answer? Not at all: the only reward is at the end, so every token's reward-to-go is minus 1. It starts to matter in Part 6, when the KL penalty puts a small reward on every token. The footnote's list is the GAE paper's: the six choices of weight that this part walks through, in order.

---

<p class="eyebrow"><span class="paper">RLHF, PPO and GRPO</span> · Part 4, from a reward to an advantage · fix 2, a baseline</p>

## What does subtracting a baseline change?

<div class="cols wide-fig">
<div class="text">

<div class="eq">$$\mathbb E_{o\sim\pi_\theta}\big[\nabla_\theta\log\pi_\theta(o \mid s)\thinspace b(s)\big] = b(s)\cdot 0 = 0$$</div>

<dl class="where">
<dt>$b(s)$</dt><dd>a <b>baseline</b>: any number that depends on the state, not the action</dd>
</dl>

- The mean of $\nabla_\theta\log\pi_\theta$ is 0 (REINFORCE slide), so weighting by $G_t - b(s_t)$ keeps the average.
- With $b$ = 10.5, the two-action example gives 0.25 from either sample: no noise left.
- The natural baseline is the expected return from the state: the **value**, defined next.

<p class="plain">The noise is zero here, not just smaller, because the rewards are fixed, the actions equally likely, and the baseline at their midpoint (ours).</p>

</div>
<div class="fig"><img src="img/week-04-ppo-noise.svg" alt="Illustration: single-sample gradient estimates; rewards 1 and 0 give 0.5 or 0; rewards 11 and 10 give 5.5 or minus 5.0; with baseline 10.5 both samples give 0.25; the true gradient is 0.25 in every case"></div>
</div>

<p class="footnote">Ours: $(11 - 10.5) \times 0.5 = 0.25$ and $(10 - 10.5) \times (-0.5) = 0.25$. In general a baseline lowers the variance; it does not remove it</p>

Note:
The second fix. Part 3's fact says the gradient of log pi has mean zero under the policy. So multiplying it by anything that does not depend on the action, a baseline b of s, still gives zero on average. That means we can subtract a baseline from the return without changing the average gradient.
Why would we want to? Because of the noise problem. In the two-action example with rewards 11 and 10, subtract 10.5. Left gives 0.5 times 0.5, 0.25; right gives minus 0.5 times minus 0.5, also 0.25. Both samples now give exactly the true gradient: the noise is gone. That is the third row of the figure. It goes all the way to zero here only because the rewards are fixed, both actions are equally likely, and the baseline sits at their midpoint; in general a baseline lowers the variance without removing it.
Which baseline? The natural one is what we expected to get from this state: the value. Next, what the value is, and its partner Q.

---

<p class="eyebrow"><span class="paper">RLHF, PPO and GRPO</span> · Part 4, from a reward to an advantage · $V$ and $Q$</p>

## What do $V(s)$ and $Q(s, o)$ measure?

<div class="cols wide-fig">
<div class="text">

<dl class="where">
<dt>$V^\pi(s)$</dt><dd>the <b>state-value function</b>: the expected return from $s$, following the policy $\pi$</dd>
<dt>$Q^\pi(s, o)$</dt><dd>the <b>action-value function</b>: the expected return if we take $o$ first, then follow $\pi$</dd>
</dl>

- At $s_4$ = "Gravity pulls objects", the policy picks "together" (0.9) or "apart" (0.1).
- That word is the last, so each choice's $Q$ is its score: 2 or −1.
- $V$ averages over what the policy would do: 1.7.

<p class="plain">No answer scores 1.7: $V$ is the average, 0.9 × 2 + 0.1 × (−1).</p>

</div>
<div class="fig"><img src="img/week-04-rlhf2-qv.svg" alt="Illustration: the state Gravity pulls objects branches to together with probability 0.9, Q = 2, advantage +0.3, and to apart with probability 0.1, Q = minus 1, advantage minus 2.7; V of s4 = 0.9 times 2 plus 0.1 times minus 1 = 1.7"></div>
</div>

<p class="footnote">Example ours: $s_4$ is the prompt plus "Gravity pulls objects", which we assume the policy writes for sure; the answer ends at the fourth word. The figure's $A$ is two slides on</p>

Note:
Two functions. V of s, the state-value function: the expected return from state s if we follow the policy from there. Q of s and a, the action-value function: the expected return if we take action a first, and then follow the policy.
Our example. Assume the policy always writes "Gravity pulls objects"; at that state, s4, it picks "together" with probability 0.9 and "apart" with 0.1. That word is the last action, so Q of each is just its score: Q of together is 2, Q of apart is minus 1. V of s4 averages over what the policy would do: 0.9 times 2 plus 0.1 times minus 1, which is 1.7.
No answer actually scores 1.7. V is an expectation: what we expect before the last word is chosen. Because the first three words are certain, V is also 1.7 at every earlier state: nothing has been decided yet. Remember that; it is why "Gravity" deserves a weight of zero.

---

<p class="eyebrow"><span class="paper">RLHF, PPO and GRPO</span> · Part 4, from a reward to an advantage · $Q$ from $V$</p>

## How are $Q$ and $V$ related?

<div class="eq">$$V^\pi(s) = \sum_o\pi(o \mid s)\thinspace Q^\pi(s, o),\qquad Q^\pi(s_t, o_t) = r_t + \gamma V^\pi(s_{t+1})$$</div>

<div class="cols">
<div class="text">

<dl class="where">
<dt>$s_{t+1}$</dt><dd>the next state: $s_t$ with token $o_t$ appended</dd>
<dt>$r_t$, $\gamma$</dt><dd>the step reward, and the discount factor</dd>
<dt>$\pi(o \mid s)$</dt><dd>the policy's probability of $o$ in $s$</dd>
</dl>

- $V$ is $Q$ averaged over the policy's actions.
- $Q$ is one real step, plus the value of where it lands.

</div>
<div class="text">

- Appending a token is certain, so the second identity needs no average over next states.
- After the last token $V$ = 0, so the last token's $Q$ is its reward.

<p class="plain">Check with the first identity: $V(s_4)$ = 0.9 × 2 + 0.1 × (−1) = 1.7.</p>

</div>
</div>

<p class="footnote">In general $Q^\pi(s, o) = \mathbb E\big[r + \gamma V^\pi(s')\big]$ over the next state $s'$. The second identity lets a value model stand in for $Q$: one sampled step, then $V$</p>

Note:
Two identities connect Q and V, and the second one is what the rest of the part is built on.
First: V is Q averaged over the policy's actions. In a state, the policy picks each action with some probability; V is the probability-weighted average of the Q values. Our check: 0.9 times 2 plus 0.1 times minus 1 is 1.7.
Second: Q is one real step plus the value of where it lands. If I take action o t in state s t, I get the step reward r t, and then I am in state s t plus 1, from which I expect V of s t plus 1. In general the next state is random, so you average over it; for a language model the next state is just the text with the token appended, which is certain, so no average is needed. And after the last token there is no future, so V is zero and the last token's Q is its reward.
Why does this matter? Because it means we never need a separate network for Q. One sampled step and a value model give us an estimate of Q. That is where the next three slides go.

---

<p class="eyebrow"><span class="paper">RLHF, PPO and GRPO</span> · Part 4, from a reward to an advantage · the advantage</p>

## Why is the advantage $Q - V$?

<div class="eq">$$\nabla_\theta J = \mathbb E\Big[\sum_t\nabla_\theta\log\pi_\theta(o_t \mid s_t)\thinspace A^\pi(s_t, o_t)\Big],\qquad A^\pi(s, o) = Q^\pi(s, o) - V^\pi(s)$$</div>

<div class="cols">
<div class="text">

<dl class="where">
<dt>$A^\pi(s, o)$</dt><dd>the <b>advantage</b>: how much better $o$ is than the policy's average in $s$</dd>
</dl>

- Take the baseline $b = V$, and replace $G_t$ by its average given $s_t$ and $o_t$, which is $Q$.
- The second is allowed because $\nabla_\theta\log\pi_\theta(o_t \mid s_t)$ depends only on $s_t$ and $o_t$.

</div>
<div class="text">

- At $s_4$: "together" +0.3, "apart" −2.7; they average to 0 under the policy.

<p class="plain">"Together" was expected (90%), so it beats the average by little; "apart" is a rare, bad surprise.</p>

</div>
</div>

<p class="footnote">Check: $0.9 \times 0.3 + 0.1 \times (-2.7) = 0$. Positive advantage: make the action more likely; negative: less likely</p>

Note:
Now combine the two fixes. Subtract the baseline V of s t. And replace the reward-to-go G t by its average given the state and action, which by definition is Q. Why is that replacement allowed? The gradient term depends only on s t and o t; so inside the expectation we can first average G t over everything that happens after, given s t and o t, and that average is Q. The policy gradient then becomes the expectation of the gradient of log pi times the advantage, Q minus V.
The advantage asks: how much better was this action than what the policy does on average in this state? At s4, "together" has advantage 2 minus 1.7, plus 0.3; "apart" has minus 1 minus 1.7, minus 2.7. Weighted by the policy, they average to zero: 0.9 times 0.3 plus 0.1 times minus 2.7. That is always true: advantages average to zero under the policy.
The sizes make sense. "Together" was already the expected choice, 90% likely, so it beats the average only slightly. "Apart" is a rare, bad surprise, so it gets a big negative weight. And for the first three words, whose choice was certain, Q equals V and the advantage is zero: exactly the weight we said "Gravity" deserved.

--

<p class="eyebrow"><span class="paper">RLHF, PPO and GRPO</span> · Part 4, from a reward to an advantage · the baseline across prompts · optional</p>

## Does a high reward always mean a good answer?

<div class="cols">
<div class="text">

- No: a reward is high or low relative to what the prompt allows.
- The advantage judges each answer against its own prompt's value $V$.
- This is the noise fix of the baseline, seen across prompts of different difficulty.

</div>
<div class="text">

<table class="rules">
  <tr><td>prompt</td><td class="num">$V$</td><td class="num">reward</td><td class="num">advantage</td></tr>
  <tr><td>easy, answer 1</td><td class="num">0.90</td><td class="num">0.95</td><td class="num">+0.05</td></tr>
  <tr><td>easy, answer 2</td><td class="num">0.90</td><td class="num">0.85</td><td class="num">−0.05</td></tr>
  <tr><td>hard, answer 1</td><td class="num">0.20</td><td class="num">0.40</td><td class="num">+0.20</td></tr>
  <tr><td>hard, answer 2</td><td class="num">0.20</td><td class="num">0.10</td><td class="num">−0.10</td></tr>
</table>

<p class="plain">Hard 1 beat expectations: its reward, 0.40, is below easy 2's 0.85, but its advantage is +0.20 against −0.05.</p>

</div>
</div>

<p class="footnote">Numbers ours. $V$: the prompt's expected reward; advantage here: reward minus $V$, a one-answer estimate</p>

Note:
Optional. Imagine two prompts. Prompt A is easy, so most completions get high scores. Prompt B is hard, so even the best completions get relatively low scores. Looking only at raw reward, the easy prompt always looks good and the hard one always looks bad, and REINFORCE would push up every easy-prompt answer. What we want to know is whether a completion was better or worse than expected for that prompt. Subtracting the value makes the signal reflect better-than-expected quality, not prompt difficulty. In our numbers, the easy prompt's weaker answer, 0.85, has a much higher raw reward than the hard prompt's best, 0.40, but its advantage is negative, and the hard prompt's 0.40 has the largest positive advantage.

---

<p class="eyebrow"><span class="paper">RLHF, PPO and GRPO</span> · Part 4, from a reward to an advantage · one-step estimate</p>

## How do you estimate the advantage from one step?

<div class="cols">
<div class="text">

<div class="eq">$$\delta_t = r_t + \gamma V(s_{t+1}) - V(s_t)$$</div>

<dl class="where">
<dt>$\delta_t$</dt><dd>the <b>TD residual</b> (temporal difference): a one-step advantage estimate</dd>
<dt>$V$</dt><dd>a learned <b>value model</b>'s prediction (its training: end of this part)</dd>
<dt>bias, noise</dt><dd>an error that does not average away; the spread from sample to sample (variance)</dd>
</dl>

<p class="plain">In words: what happened (one reward, plus the value of where we landed) minus what we expected.</p>

</div>
<div class="text">

- Replace $Q$ by one sampled step plus $V$, the second identity.
- If $V$ is exact, $\delta_t$ averages to the advantage; if not, it is biased.
- Its noise is low: it depends on one sampled step.

<p class="plain">On "...apart" with exact values 1.7, the $\delta$'s are 0, 0, 0 and −1 + 0 − 1.7 = −2.7: all the blame on "apart".</p>

</div>
</div>

<p class="footnote">Ours: the first three words are certain, so $V$ = 1.7 before each. A value model off by 0.1 there would hand those words ±0.1 of credit: that is the bias</p>

Note:
In practice we know neither Q nor V. What we have is a value model, a network trained to predict V, and the step we sampled. The second identity says Q of s t, o t is r t plus gamma V of s t plus 1. So replace Q by that, using the value model's prediction. The advantage estimate becomes delta t: the reward at step t, plus gamma times the value of the next state, minus the value of the current state. That is the temporal-difference residual. Read it as what happened minus what we expected.
If the value model is exact, delta t averages to the true advantage. If it is off, delta t is biased by its errors. In exchange it is low-noise: it depends on only one sampled step.
On the bad answer, with the exact values, 1.7 before each of the first three words: the first three deltas are 0 plus 1.7 minus 1.7, zero. The last is minus 1, plus 0 because the answer has ended, minus 1.7: minus 2.7. All the blame lands on "apart", none on the good words. Compare REINFORCE's minus 1 on everything. But this precision depends on V being right: if the value model guessed 1.6 instead of 1.7 before "objects", that word would get a credit of 0.1 it did nothing to earn.

---

<p class="eyebrow"><span class="paper">RLHF, PPO and GRPO</span> · Part 4, from a reward to an advantage · $k$-step estimates · Schulman et al. 2015</p>

## How many steps should you look ahead?

<div class="eq">$$\hat A^{(k)}_t = \sum_{l=0}^{k-1}\gamma^l\delta_{t+l} = r_t + \gamma r_{t+1} + \dots + \gamma^{k-1}r_{t+k-1} + \gamma^k V(s_{t+k}) - V(s_t)$$</div>

<div class="cols">
<div class="text">

<dl class="where">
<dt>$\hat A^{(k)}_t$</dt><dd>the $k$-step advantage estimate: $k$ real rewards, then trust $V$</dd>
<dt>$l$</dt><dd>how many steps ahead of $t$</dd>
</dl>

<table class="rules">
  <tr><td>$k$</td><td>estimate</td><td>bias</td><td>variance</td></tr>
  <tr><td>1</td><td>$\delta_t$</td><td>from $V$'s errors</td><td>low</td></tr>
  <tr><td>$\infty$</td><td>$G_t - V(s_t)$</td><td>none</td><td>high</td></tr>
</table>

</div>
<div class="text">

- More real rewards: less reliance on $V$, more sampled steps.
- At $k = \infty$, $V(s_t)$ is just a baseline, so a wrong $V$ adds no bias.

<p class="plain">The sum collapses: each $+\gamma V(s_{t+1})$ cancels the next residual's $-\gamma V(s_{t+1})$.</p>

</div>
</div>

<p class="footnote">GAE paper (Schulman et al. 2015, arXiv:1506.02438) §3. Bias and variance: of the gradient estimate built from $\hat A$</p>

Note:
Why stop at one step? We can take k real rewards before trusting the value model. The k-step estimate adds up the next k rewards, discounted, then the discounted value of the state k steps ahead, minus the value now. And it equals the sum of the first k TD residuals, because the sum telescopes: each plus gamma V of the next state cancels the minus gamma V of the next residual.
The trade-off. With k equal to 1, we lean entirely on V after one step: low variance, but biased by V's errors. As k grows we use more real rewards: less reliance on V, so less bias, but more sampled steps, so more variance. At k equal to infinity, the estimate is the reward-to-go minus V of s t. There V is only a baseline, and Part 4's second slide showed a baseline never biases the gradient, whatever its value. That is the REINFORCE-with-baseline end.
So we have a family of estimates, from low-variance-biased to unbiased-noisy. GAE's idea: don't choose one. Average them.

---

<p class="eyebrow"><span class="paper">RLHF, PPO and GRPO</span> · Part 4, from a reward to an advantage · GAE · Schulman et al. 2015</p>

## How does GAE blend them?

<div class="cols wide-fig">
<div class="text">

<div class="eq">$$\hat A_t = \sum_{l\ge 0}(\gamma\lambda)^l\delta_{t+l} = \delta_t + \gamma\lambda\hat A_{t+1}$$</div>

<dl class="where">
<dt>$\hat A_t$</dt><dd>the <b>GAE</b> estimate: all $k$-step estimates, weighted $(1-\lambda)\lambda^{k-1}$</dd>
<dt>$\lambda$</dt><dd>the <b>GAE parameter</b>, between 0 and 1</dd>
</dl>

- $\lambda$ = 0 gives $\delta_t$: the blame falls on "apart" alone.
- $\lambda$ = 1 gives $G_t - V(s_t)$: −2.7 on every token.

<p class="plain">At $\lambda$ = 1, "Gravity" gets +0.3 in "together" (table below) and −2.7 in "apart": on average 0.9 × 0.3 + 0.1 × (−2.7) = 0, right but noisy.</p>

</div>
<div class="fig"><img src="img/week-04-rlhf2-blame-gae.svg" alt="Illustration: weight on each token of Gravity pulls objects apart. REINFORCE minus 1 on every token. GAE at lambda 1, minus 2.7 on every token. At lambda 0.95, minus 2.31, minus 2.44, minus 2.57, minus 2.70. At lambda 0, 0, 0, 0 and minus 2.70 on apart"></div>
</div>

<p class="footnote">GAE: generalised advantage estimation, Schulman et al. 2015, arXiv:1506.02438. Computed in one backward pass from the last token. Values exact (ours); PPO's robot runs used $\lambda$ = 0.95</p>

Note:
GAE, generalised advantage estimation, averages all the k-step estimates, with weights 1 minus lambda times lambda to the k minus 1, which sum to one. Collect the terms and each TD residual l steps ahead ends up with weight gamma lambda to the l. So GAE is a discounted sum of future residuals, and the recursive form is what we implement: the advantage at step t is delta t plus gamma lambda times the advantage at the next step, one pass backwards from the end.
Lambda is the knob. At lambda 0 we get delta t, the one-step estimate: on our bad answer, the blame lands only on "apart". At lambda 1 we get the reward-to-go minus the value: minus 2.7 on every token. That looks like REINFORCE's mistake again, but it isn't quite. It is measured against the right baseline, and it is unbiased: in the good answers, "Gravity" gets plus 0.3, and averaged over both answers its weight is exactly zero. It is just noisy, one answer at a time. Lambda 0.95 sits in between: weights shrink by 0.95 per step back from "apart".
So: lambda near 0 trusts the value model and assigns blame sharply, but inherits the value model's errors; lambda near 1 trusts the rewards and is unbiased but noisy. Our exact value model makes lambda 0 look perfect; with a real value model it isn't.

--

<p class="eyebrow"><span class="paper">RLHF, PPO and GRPO</span> · Part 4, from a reward to an advantage · Schulman et al. 2017 · optional</p>

## What does $\gamma$ below 1 do to a final reward?

<div class="cols">
<div class="text">

- A reward $k$ steps ahead counts $\gamma^k$ of one received now.
- With one reward at the end, the first token of a 500-token answer sees $\gamma^{499}$ of it.
- At $\gamma$ = 0.99 that is 0.007: the early tokens barely hear the score (ours).
- InstructGPT applies no discount, $\gamma$ = 1; a plausible reason (ours).

</div>
<div class="text">

<p class="plain">With $\gamma$ = 0.99, a reward 100 steps away is worth $0.99^{100} = 0.366$ of one received now.</p>

</div>
</div>

<p class="footnote">Schulman et al. 2017, App. A: $\gamma$ = 0.99 in every robot and Atari run. GAE paper (Schulman et al. 2015): $\gamma$ cuts variance "at the cost of introducing bias"</p>

Note:
Optional: why gamma near 1 matters so much here. With a single reward at the end and gamma 0.99, a token 499 steps before the end sees 0.99 to the 499, about 0.007 of it (our arithmetic). The first sentence of a long answer would learn almost nothing from the score. PPO's robot settings use 0.99, where rewards arrive at every step (our reading); InstructGPT applies no discount.

--

<p class="eyebrow"><span class="paper">RLHF, PPO and GRPO</span> · Part 4, from a reward to an advantage · the good answer (ours) · optional</p>

## What advantages does GAE give "Gravity pulls objects together"?

<table class="rules">
  <tr><td>$t$</td><td>token</td><td class="num">$r_t$</td><td class="num">$v_t$</td><td class="num">$\delta_t = r_t + v_{t+1} - v_t$</td><td class="num">$\hat A_t$, $\lambda$ = 0</td><td class="num">$\hat A_t$, $\lambda$ = 0.95</td><td class="num">$\hat A_t$, $\lambda$ = 1</td></tr>
  <tr><td>1</td><td>Gravity</td><td class="num">0</td><td class="num">1.7</td><td class="num">0 + 1.7 − 1.7 = 0</td><td class="num">0</td><td class="num">0.257</td><td class="num">0.3</td></tr>
  <tr><td>2</td><td>pulls</td><td class="num">0</td><td class="num">1.7</td><td class="num">0</td><td class="num">0</td><td class="num">0.271</td><td class="num">0.3</td></tr>
  <tr><td>3</td><td>objects</td><td class="num">0</td><td class="num">1.7</td><td class="num">0</td><td class="num">0</td><td class="num">0.285</td><td class="num">0.3</td></tr>
  <tr><td>4</td><td>together</td><td class="num">2</td><td class="num">1.7</td><td class="num">2 + 0 − 1.7 = 0.3</td><td class="num">0.3</td><td class="num">0.300</td><td class="num">0.3</td></tr>
</table>

<p class="plain">Had the value model guessed $v_1$ = 1.4, $\lambda$ = 0 would give "Gravity" $\delta_1 = 0 + 1.7 - 1.4 = 0.3$: credit from the value model's error, not the word.</p>

<p class="footnote">Ours: $\gamma$ = 1; $v_t = V(s_t)$, exact; $v_5 = 0$ after the end. Check $\hat A_3$ at 0.95: $0 + 0.95 \times 0.3 = 0.285$</p>

Note:
Optional, the good answer through GAE. Rewards 0, 0, 0 and 2; the exact values are 1.7 at every step and 0 after the end. The TD residuals are 0, 0, 0 and 0.3. Backwards with lambda 0.95: A4 = 0.3, A3 = 0.95 times 0.3 = 0.285, A2 = 0.95 times 0.285 = 0.271, A1 = 0.257. With lambda 1 every token gets 0.3; with lambda 0 only "together" does.
The last line shows the bias. Suppose the value model is imperfect and predicts 1.4 for the prompt alone. Then at lambda 0 "Gravity" gets delta 1 = 0 + 1.7 − 1.4 = 0.3: credit from the value model changing its mind, not from anything the word did. At lambda 1 that error would cancel out. That is the bias-variance trade in one number.

---

<p class="eyebrow"><span class="paper">RLHF, PPO and GRPO</span> · Part 4, from a reward to an advantage · the value model's head</p>

## How is the value model trained?

<div class="cols wide-fig">
<div class="text">

<div class="eq">$$L_V(\psi) = \frac1T\sum_{t=1}^{T}\big(V_\psi(s_t) - \hat G_t\big)^2$$</div>

<dl class="where">
<dt>$V_\psi$</dt><dd>the value model; $\psi$ its weights</dd>
<dt>$\hat G_t$</dt><dd>the target return: $G_t$, or the GAE target $\hat A_t + V(s_t)$</dd>
</dl>

- The same backbone with a **value head**: one number per answer position.

<p class="plain">1.7 misses "together" by 0.3, but over both answers the loss is 0.9 × 0.09 + 0.1 × 2.7² = 0.81 per token, and no other number does better (ours).</p>

</div>
<div class="fig"><img src="img/week-04-rlhf-heads-value.svg" alt="Illustration: the same inputs and backbone design, with a value head over the answer positions q4, o1, o2 and o3, giving one value each, v1 to v4"></div>
</div>

<p class="footnote">Mean squared error is minimised by the mean, here the expected return 1.7. Value head: a last layer that turns each position's hidden state into one number</p>

Note:
Where does V come from? A value model: architecturally the same transformer backbone, with a value head that outputs one scalar at every answer position. Keep this picture: it is the third of the three heads, next to the policy's language-model head and the reward model's head.
Train it by regression: the mean squared error between its prediction at each position and a target return. The target can be the sampled return G t; common PPO implementations use the advantage plus the old value, which is the GAE version of a return.
A subtle point. Even the exact value, 1.7, has a loss on any single answer: on "together", whose return is 2, it misses by 0.3, a squared error of 0.09 per token. On "apart" it misses by 2.7. Averaged over the answers the policy actually writes, 90% "together" and 10% "apart", the loss is 0.81 per token, and no other prediction does better, because a squared error is minimised by the mean. The value model learns the expected return, which is exactly what V is.

---

<p class="eyebrow"><span class="paper">RLHF, PPO and GRPO</span> · Part 5, from an advantage to PPO · sample reuse</p>

## Why reuse a batch more than once?

<div class="cols">
<div class="text">

- Sampling long answers from a large model is the expensive step.
- The policy gradient is on-policy: it is right only at the policy that sampled the batch.
- So freeze a copy $\pi_{\theta_{\rm old}}$, sample once with it, and take several steps on that batch.
- PPO's warning: several plain steps "often leads to destructively large policy updates".

</div>
<div class="text">

<p class="plain">After the first step the batch is stale: it came from $\pi_{\theta_{\rm old}}$, but we now evaluate $\pi_\theta$.</p>

</div>
</div>

<p class="footnote">Schulman et al. 2017, PPO, arXiv:1707.06347, §2.1. $\pi_{\theta_{\rm old}}$: the policy's weights frozen at sampling time</p>

Note:
We now have a good weight for each token, the advantage. The next problem is cost. For a large language model, generating answers is the expensive part, especially long ones. And the policy gradient is on-policy: it is only correct for the policy that produced the samples. After one gradient step the policy has changed and the batch is stale, so plain policy gradient uses each expensive batch once.
The obvious idea: freeze a copy of the policy, the old policy, sample a batch with it, and then take several gradient steps on that batch. The PPO paper's warning about doing this naively: performing multiple steps on the plain loss "is not well-justified, and empirically it often leads to destructively large policy updates". The batch describes the old policy, and after a few steps we are optimising a different one on the strength of data that no longer describes it. Two questions follow. How do we correct for the mismatch? And how do we stop the policy moving too far?

---

<p class="eyebrow"><span class="paper">RLHF, PPO and GRPO</span> · Part 5, from an advantage to PPO · the importance ratio</p>

## How does the importance ratio let old samples stand in for new ones?

<div class="eq">$$\mathbb E_{o\sim\pi_\theta}\big[f(o)\big] = \mathbb E_{o\sim\pi_{\theta_{\rm old}}}\Big[\frac{\pi_\theta(o)}{\pi_{\theta_{\rm old}}(o)}f(o)\Big],\qquad L(\theta) = \hat{\mathbb E}_t\big[\rho_t(\theta)\thinspace\hat A_t\big]$$</div>

<div class="cols">
<div class="text">

<dl class="where">
<dt>$\rho_t(\theta)$</dt><dd>the <b>importance ratio</b>, $\pi_\theta(o_t \mid s_t)/\pi_{\theta_{\rm old}}(o_t \mid s_t)$; PPO writes $r_t(\theta)$</dd>
<dt>$f$, $L(\theta)$</dt><dd>any function of the token; the <b>surrogate objective</b>, averaged over the batch's tokens ($\hat{\mathbb E}_t$)</dd>
<dt>$\hat A_t$</dt><dd>the GAE advantage, computed once from the old policy's batch</dd>
</dl>

- **Importance sampling**: reweight old samples so they average correctly under the new policy.

</div>
<div class="text">

- At $\theta = \theta_{\rm old}$ every ratio is 1, and $L$'s gradient is the policy gradient.
- The ratio corrects token probabilities, but the states still come from the old policy: trust $L$ only near $\theta_{\rm old}$.

<p class="plain">A token whose log-probability went from −1.1 to −0.9 has ratio $e^{0.2} = 1.221$ (ours).</p>

</div>
</div>

<p class="footnote">PPO writes $L^{CPI}$, after conservative policy iteration (Kakade and Langford 2002), Eq. 6. The ratio is per token: a whole answer's ratio multiplies them, and $1.1^{100} \approx 13{,}781$</p>

Note:
The correction is importance sampling. An average under the new policy equals an average under the old policy, if each sample is reweighted by the ratio of its new probability to its old one. Apply it per token: the importance ratio rho t of theta is the token's probability under the current policy divided by its probability under the old policy that sampled it. Multiply the advantage by it and average over the batch: that is the surrogate objective. PPO calls it L CPI, after conservative policy iteration.
Check it is the right thing: at theta equal to theta old, every ratio is 1, and the gradient of the ratio is the gradient of log pi. So at the start, the surrogate's gradient is exactly the policy gradient of Part 4. It differs only once we have moved.
What the ratio does not fix: it corrects for which tokens the new policy would choose, but the states, the partial answers in the batch, are still the ones the old policy wrote. A policy that has moved far would write different partial answers. So the surrogate is only trustworthy near the old policy.
Why per token and not per answer? An answer's ratio is the product of its token ratios, and products explode: 1.1 per token over 100 tokens is about 13,781.

---

<p class="eyebrow"><span class="paper">RLHF, PPO and GRPO</span> · Part 5, from an advantage to PPO · the problem</p>

## Why is the surrogate dangerous on its own?

<div class="cols">
<div class="text">

- $L$ is linear in the ratio: a good token's term keeps rising until the token is certain.
- A token at 0.2 under the old policy can reach a ratio of 1/0.2 = 5.
- So one noisy advantage could push a token all the way to certainty.
- PPO: "Without a constraint, maximization of $L^{CPI}$ would lead to an excessively large policy update."

</div>
<div class="text">

<p class="plain">What we need: a meter for how far the policy has moved, and a limit on it.</p>

</div>
</div>

<p class="footnote">Schulman et al. 2017 §3. $L^{CPI}$: the surrogate objective $L$ of the last slide</p>

Note:
The surrogate is linear in the ratio. For a token with a positive advantage, the objective keeps increasing as its probability rises, all the way until the token is certain. If the old policy gave it probability 0.2, the ratio can reach 5, and the optimiser is rewarded for going the whole way, on the strength of a single noisy advantage estimate from one batch. The paper says it directly: without a constraint, maximising L CPI would lead to an excessively large policy update. So we need a way to measure how far the policy has moved, and a limit on it. The measure is the KL divergence.

---

<p class="eyebrow"><span class="paper">RLHF, PPO and GRPO</span> · Part 5, from an advantage to PPO · the KL divergence</p>

## What does a KL divergence measure?

<div class="cols">
<div class="text">

<div class="eq">$$\mathrm{KL}(p \Vert p') = \sum_x p(x)\log\frac{p(x)}{p'(x)}$$</div>

<dl class="where">
<dt>$p$, $p'$</dt><dd>two probability distributions over the same outcomes $x$</dd>
<dt>KL</dt><dd>the Kullback-Leibler divergence, in <b>nats</b> with the natural log</dd>
</dl>

</div>
<div class="text">

- It is zero when the two agree and positive otherwise.
- It is an average under $p$, the first argument, and not symmetric.
- It measures a change in behaviour, not in weights.

<p class="plain">A coin moved from 50/50 to 60/40: KL(old ‖ new) = 0.5 ln(0.5/0.6) + 0.5 ln(0.5/0.4) = 0.0204 nats; the other order gives 0.0201.</p>

</div>
</div>

<p class="footnote">Numbers ours, from Week 4's PPO section. A tiny weight change can move the outputs a lot, so a limit on the weights, such as a small learning rate, is the wrong meter</p>

Note:
The KL divergence, Kullback-Leibler, compares two distributions over the same outcomes. For each outcome, take the log of the ratio of the two probabilities, and average that under the first distribution, p. It is zero when they agree and positive otherwise. With natural logs it is in nats.
Two properties matter later. It is an average under its first argument, so you need samples from, or the full table of, the first distribution. And it is not symmetric: KL of p to p prime is not KL of p prime to p. For small moves the two orders nearly agree: moving a coin from 50/50 to 60/40 is 0.0204 nats one way and 0.0201 the other. That is about the size of one PPO update in the paper's Figure 2.
Why KL and not, say, a small learning rate? Because what we care about is how the policy behaves, and a small step in weights can be a large step in behaviour, differently in different layers and at different points in training. KL measures the step where it matters.

---

<p class="eyebrow"><span class="paper">RLHF, PPO and GRPO</span> · Part 5, from an advantage to PPO · TRPO · Schulman et al. 2015</p>

## What does TRPO add?

<div class="eq">$$\max_\theta\ L(\theta)\quad\text{subject to}\quad \mathbb E_{s}\big[\mathrm{KL}\big(\pi_{\theta_{\rm old}}(\cdot \mid s)\thinspace\Vert\thinspace\pi_\theta(\cdot \mid s)\big)\big] \le \delta_{\rm KL}$$</div>

<div class="cols">
<div class="text">

<dl class="where">
<dt>$\delta_{\rm KL}$</dt><dd>the trust region's size: 0.01 in all of TRPO's experiments</dd>
<dt>$\mathbb E_s$</dt><dd>the average over states the old policy visited</dd>
<dt>$\pi(\cdot \mid s)$</dt><dd>the policy's whole next-action distribution in $s$</dd>
</dl>

- A **trust region** limits the step to where the surrogate $L$ can be trusted.

</div>
<div class="text">

- A constraint, not a penalty: "it is hard to robustly choose the penalty coefficient".
- It costs an inner solver every update (conjugate gradient, a line search), with second derivatives.
- This KL limits one step, between the policy and its own previous version.

<p class="plain">As a one-state toy, the 50/50 to 60/40 move, 0.0204 nats, is outside $\delta_{\rm KL}$ = 0.01: TRPO would step less.</p>

</div>
</div>

<p class="footnote">TRPO: trust region policy optimization, Schulman et al. 2015, arXiv:1502.05477, Eq. 12; old policy first. PPO adds that TRPO does not fit dropout or a network shared by policy and value</p>

Note:
TRPO, trust region policy optimization, is the method PPO set out to simplify. It maximises the surrogate subject to a constraint: the average, over the states the old policy visited, of the KL from the old policy's next-action distribution to the new one must stay below delta. Delta was 0.01 in all of TRPO's experiments. The idea of a trust region: the surrogate is a local approximation, so only move within the region where it can be trusted.
Note the direction: old policy first. The batch came from the old policy, so that is the distribution we can average under.
Why a constraint and not just subtracting a penalty coefficient times the KL? TRPO's theory actually suggests a penalty, but "it is hard to robustly choose the penalty coefficient": one beta does not work across problems, or even through one run. The cost of the constraint: every update solves a constrained problem with conjugate gradient and a line search, second-order machinery. PPO adds that it does not fit architectures with dropout or a backbone shared between policy and value.
Remember: this KL is between the policy and its own previous version, and it limits one step. In Part 6 we meet a second KL, which is a different thing.

---

<p class="eyebrow"><span class="paper">RLHF, PPO and GRPO</span> · Part 5, from an advantage to PPO · Schulman et al. 2017, Eq. 7</p>

## What is PPO's objective?

<div class="eq">$$J_{\rm PPO}(\theta) = \mathbb E_{q\sim\mathcal D,\ o\sim\pi_{\theta_{\rm old}}(\cdot \mid q)}\Big[\frac1T\sum_{t=1}^{T}\min\big(\rho_t(\theta)\hat A_t,\ \mathrm{clip}(\rho_t(\theta), 1-\epsilon, 1+\epsilon)\thinspace \hat A_t\big)\Big]$$</div>

<div class="cols">
<div class="text">

<dl class="where">
<dt>$q$, $o$</dt><dd>a prompt from the prompt set $\mathcal D$, and an answer sampled from the old policy</dd>
<dt>$\rho_t(\theta)$</dt><dd>the importance ratio, $\pi_\theta(o_t \mid q, o_{\lt t})/\pi_{\theta_{\rm old}}(o_t \mid q, o_{\lt t})$</dd>
<dt>$\hat A_t$</dt><dd>token $t$'s GAE advantage</dd>
<dt>$\mathrm{clip}(r, 1-\epsilon, 1+\epsilon)$</dt><dd>$r$ held inside the band; $\epsilon$ the <b>clip range</b>, often 0.2</dd>
<dt>$T$, $o_t$</dt><dd>the answer's length; its token $t$</dd>
</dl>

</div>
<div class="text">

- PPO swaps TRPO's constraint for a clipped ratio: first-order, plain Adam.
- Take the smaller of the plain and the clipped term, so no token is pushed too far.


</div>
</div>

<p class="footnote">Schulman et al. 2017 §3, Eq. 7; $\epsilon$ = 0.2 in its robot runs. The $1/T$ token average is the language-model form, as in Shao et al. 2024 Eq. 1</p>

Note:
PPO, proximal policy optimization, keeps the surrogate and replaces TRPO's constraint with something an ordinary optimiser can handle: clip the ratio. For each token compute two terms. The unclipped one is the ratio times the advantage: the surrogate. The clipped one clips the ratio to between 1 minus epsilon and 1 plus epsilon before multiplying. PPO takes the minimum of the two. That removes the incentive to move any token's ratio far outside the band, so the policy stays near the old one without any second-order machinery: just several epochs of Adam on the batch.
We write it here in the language-model form: sample a prompt q from the prompt dataset, an answer o from the old policy, and average the per-token terms over the answer's length. The letters: like the PPO paper, r t is the step reward and rho t of theta is the ratio.

---

<p class="eyebrow"><span class="paper">RLHF, PPO and GRPO</span> · Part 5, from an advantage to PPO · Schulman et al. 2017, Fig. 1</p>

## What does the clip do when the advantage is positive, and when negative?

<div class="cols">
<div class="text">

<table class="rules">
  <tr><td></td><td>$\hat A_t > 0$, good</td><td>$\hat A_t \lt 0$, bad</td></tr>
  <tr><td>goal</td><td>push $\rho$ up</td><td>push $\rho$ down</td></tr>
  <tr><td>clipped</td><td>$\rho > 1+\epsilon$</td><td>$\rho \lt 1-\epsilon$</td></tr>
  <tr><td>active</td><td>$\rho \lt 1-\epsilon$: push back up</td><td>$\rho > 1+\epsilon$: push back down</td></tr>
</table>

<p class="plain">Every token starts at $\rho$ = 1, the red dot: before the update the two policies are the same.</p>

</div>
<div class="fig"><img src="img/week-04-ppo-fig1.png" alt="Schulman et al. Figure 1: one term of L CLIP against the ratio r. Left, positive advantage: rising from the origin, flat beyond 1 plus epsilon. Right, negative advantage: flat below 1 minus epsilon, then falling. A red dot marks the start at r = 1"></div>
</div>

<p class="footnote">Schulman et al. 2017, Fig. 1: one token's term against the ratio $\rho$ (the paper's $r$). $\epsilon$: the clip range. A move the wrong way is never clipped</p>

Note:
A closer look at the clipping. The plot shows the objective for a single time step t; the horizontal axis is the importance ratio rho. The red dot is where the update starts: rho equals 1, because before the update the current policy is the old one.
Positive advantage: the token was better than expected, so we want it more often. PPO wants to raise rho, but not too far: once rho passes 1 plus epsilon the objective is flat, and raising the probability further gives no extra gradient. If rho is below 1 minus epsilon, a good token's probability has dropped too much; there the unclipped objective stays active, so the gradient can push it back up.
Negative advantage: the token was worse than expected, so we want it less. Once rho is below 1 minus epsilon, it's flat: no extra benefit from lowering it more. If rho is above 1 plus epsilon, a bad token is still too likely; the unclipped term stays active and the gradient pushes it back down. So clipping allows useful updates but stops the policy changing too aggressively in one step.

--

<p class="eyebrow"><span class="paper">RLHF, PPO and GRPO</span> · Part 5, from an advantage to PPO · Week 4, PPO section · optional</p>

## Four worked cases of the clip

<div class="cols wide-fig">
<div class="text">

<table class="rules">
  <tr><td></td><td class="num">$A$</td><td class="num">$\rho$</td><td class="num">$\rho A$</td><td class="num">clip</td><td class="num">min</td><td class="num">slope</td></tr>
  <tr><td>a</td><td class="num">+2</td><td class="num">1.3</td><td class="num">2.6</td><td class="num">2.4</td><td class="num">2.4</td><td class="num">0</td></tr>
  <tr><td>b</td><td class="num">+2</td><td class="num">0.7</td><td class="num">1.4</td><td class="num">1.6</td><td class="num">1.4</td><td class="num">+2</td></tr>
  <tr><td>c</td><td class="num">−2</td><td class="num">0.7</td><td class="num">−1.4</td><td class="num">−1.6</td><td class="num">−1.6</td><td class="num">0</td></tr>
  <tr><td>d</td><td class="num">−2</td><td class="num">1.3</td><td class="num">−2.6</td><td class="num">−2.4</td><td class="num">−2.6</td><td class="num">−2</td></tr>
</table>

<dl class="where" style="margin-top:12px">
<dt>clip</dt><dd>$\mathrm{clip}(\rho, 0.8, 1.2)\thinspace A$</dd>
<dt>min</dt><dd>the smaller of $\rho A$ and clip: what PPO uses</dd>
<dt>slope</dt><dd>change of min with $\rho$; 0 means no gradient</dd>
</dl>

</div>
<div class="fig"><img src="img/week-04-ppo-cases.svg" alt="Illustration: one term of the clipped objective against the ratio for advantage plus 2 and minus 2, epsilon 0.2, with the unclipped line dashed; cases a, 2.4, and c, minus 1.6, sit on flat parts; cases b, 1.4, and d, minus 2.6, sit on sloped parts"></div>
</div>

<p class="footnote">Ours, from Eq. 7 with $\epsilon$ = 0.2; $A$: advantage, $\rho$: importance ratio (the figure's $r$). A token at 0.30 under the old policy and 0.39 now has $\rho = 1.3$</p>

Note:
Optional, from Week 4. Case a: a good token already 30% more likely, past the 20% allowance: the clipped term, 2.4, is smaller, so the min picks it, and it's flat; stop pushing. Case b: a good token that became less likely: the unclipped term, 1.4, is smaller, and the full gradient pushes it back up. Case c: a bad token already cut by 30%: flat, stop. Case d: a bad token that became more likely: unclipped, full gradient to push it down. The rule: a token's gradient is switched off only when it has already moved the way its advantage wanted by more than epsilon. Moves that made things worse are never clipped; that is what the min is for.

---

<p class="eyebrow"><span class="paper">RLHF, PPO and GRPO</span> · Part 5, from an advantage to PPO · Schulman et al. 2017, Eq. 9</p>

## What is PPO's full loss?

<div class="eq">$$J_{\rm PPO}(\theta) - c_1 L_V(\psi) + c_2\thinspace\hat{\mathbb E}_t\big[H\big(\pi_\theta(\cdot \mid s_t)\big)\big]$$</div>

<div class="cols">
<div class="text">

<dl class="where">
<dt>$J_{\rm PPO}$</dt><dd>the clipped objective of the last slides</dd>
<dt>$L_V(\psi)$</dt><dd>the value model's squared error (Part 4)</dd>
<dt>$H(\pi)$</dt><dd>the <b>entropy</b>, $-\sum_o\pi(o \mid s)\ln\pi(o \mid s)$</dd>
<dt>$c_1$, $c_2$, $\hat{\mathbb E}_t$</dt><dd>the two weights; the average over the batch's tokens</dd>
</dl>

</div>
<div class="text">

- The entropy bonus is there "to ensure sufficient exploration": it keeps choices spread out.
- The whole thing is maximised, so the value error is subtracted.
- With separate policy and value networks, $c_1$ is not needed to balance the two losses.

<p class="plain">A 50/50 choice has entropy ln 2 = 0.693 nats; a certain one has 0.</p>

</div>
</div>

<p class="footnote">Schulman et al. 2017 §5, Eq. 9; Atari used $c_1$ = 1, $c_2$ = 0.01. PPO writes $S$ for $H$. InstructGPT and Stiennon et al. describe no entropy term; Stiennon et al. say the KL penalty acts as one (Part 6)</p>

Note:
The full objective PPO optimises has three parts. The clipped policy term from the last slides. Minus c 1 times the value model's squared error, because when the policy and the value model share a network both losses must be in one objective, and the objective is maximised, so the error is subtracted. And plus c 2 times the entropy of the policy's action distribution, a bonus "to ensure sufficient exploration": it rewards keeping the distribution spread out. A 50/50 choice has entropy ln 2, 0.693 nats; a certain choice has zero.
With separate policy and value networks, as in InstructGPT, c 1 is irrelevant: each network gets its own loss. Atari used c 1 = 1 and c 2 = 0.01. InstructGPT and Stiennon et al. describe no separate entropy term. That is not because exploration doesn't matter: in Part 6 we will see the KL penalty to the reference contains an entropy bonus of its own, and Stiennon et al. say so.
That completes PPO as a general algorithm. Next, back to the language model.

---

<p class="eyebrow"><span class="paper">RLHF, PPO and GRPO</span> · Part 6, PPO on a language model · Shao et al. 2024, Fig. 4</p>

## What does stage 3 do, and with which algorithm?

<div class="rows">
<div class="points">
<div class="text">

- Stage 3 uses the reward model as the training signal, so the policy's answers score higher.
- **PPO** (proximal policy optimization) is the classic RLHF algorithm: four models.

</div>
<div class="text">

- **GRPO** (group relative policy optimization) drops the value model and uses a group of answers as the baseline.
- The next slides explain each box of the top row; the bottom row is Part 7.

</div>
</div>
<div class="fig"><img src="img/week-04-grpo-fig4.png" alt="Shao et al. Figure 4. Top, PPO: the policy model writes output o; a frozen reference model and a frozen reward model give a KL-penalised reward r; a trained value model gives v; GAE turns r and v into the advantage A. Bottom, GRPO: the policy writes o1 to oG; the frozen reward model scores them r1 to rG; a group computation gives A1 to AG; the KL to the reference model goes straight to the policy"></div>
</div>

<p class="footnote">Shao et al. 2024, DeepSeekMath, arXiv:2402.03300, Fig. 4: yellow models are trained, blue frozen. Schulman et al. 2017, PPO, arXiv:1707.06347</p>

Note:
Now that we can train a reward model, the final stage: use it as a training signal to optimise the language model, so the model writes answers that get higher scores. Two RL methods are common for LLM policy optimisation. PPO, proximal policy optimization, is the classical and most widely used RLHF algorithm. GRPO, group relative policy optimization, is simpler in some ways, because it removes the value model and uses a group of answers to the same prompt as its baseline.
The figure, which we come back to for PPO and GRPO, is from the GRPO paper, DeepSeekMath. Top row PPO, bottom row GRPO: yellow models are trained, blue ones frozen. Count them: four in PPO, two trained; three in GRPO, one trained.

---

<p class="eyebrow"><span class="paper">RLHF, PPO and GRPO</span> · Part 6, PPO on a language model · one network design, three heads</p>

## Which four models does PPO run?

<div class="rows">
<div class="points">
<div class="text">

- The **policy** $\pi_\theta$ is trained: the language model, with its language-model head.
- The **reference** $\pi_{\rm ref}$ is frozen: the SFT model before RL, the anchor for a KL penalty (why: next slide).

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

<p class="eyebrow"><span class="paper">RLHF, PPO and GRPO</span> · Part 6, PPO on a language model · Ouyang et al. 2022 §3.5 · optional</p>

## Do the value model and the policy share a backbone?

<div class="cols">
<div class="text">

- Many implementations do: one backbone with two heads, updated together.
- InstructGPT: no. "The value function is initialized from the RM", a separate 6B model.
- So for the 175B policy the value model is 29 times smaller (ours).
- Count for InstructGPT: four models in memory, two trained.

</div>
<div class="text">

<p class="plain">In InstructGPT the SFT model has three roles: the policy's start, the KL reference, the 175B comparison baseline; the final RM started from a 6B GPT-3 (ours).</p>

</div>
</div>

<p class="footnote">Ouyang et al. 2022 §3.5, App. C; RM: reward model, 6B at every policy size, "initialized from a 6B GPT-3 model that was fine-tuned on a variety of public NLP datasets" (SFT or GPT-3 starts gave "similar results"). Week 4, "How many models does RLHF run?"</p>

Note:
Optional. In many implementations the policy and the value model share one transformer backbone, with one head for the next token and one for the value, and PPO training then updates the backbone and both heads together. That's a common implementation choice. InstructGPT did not: its value function is initialised from the 6B reward model, at every policy size. So at 175B the value model is 29 times smaller than the policy (our arithmetic), which matters when GRPO later says the value model is "typically another model of comparable size as the policy model".

---

<p class="eyebrow"><span class="paper">RLHF, PPO and GRPO</span> · Part 6, PPO on a language model · why a KL penalty · Stiennon et al. 2020, Fig. 5</p>

## Why add a KL penalty to the reference model?

<div class="cols wide-fig">
<div class="text">

- The reward model is a learned stand-in for people, trained on a narrow set of answers.
- Pushed hard, the policy finds answers it overrates: **reward over-optimisation**.
- As the policy drifts, predicted preference climbs; people's actual preference peaks, then falls.
- The penalty keeps the policy near outputs the reward model has seen.

<p class="plain">The best policy in the sweep sits near KL 10 nats, about 0.47 by eye: still below the human reference.</p>

</div>
<div class="fig"><img src="img/week-04-rlhf2-stiennon-fig5.png" alt="Stiennon et al. Figure 5: fraction of summaries preferred to the reference against KL from the supervised baseline, 0 to 250 on a log-like axis. The dashed RM prediction rises from about 0.37 to about 1.0. The solid actual preference rises from about 0.24 to a peak of about 0.47 near KL 10, stays near 0.42 at 75, then falls to about 0.06 at 250"></div>
</div>

<p class="footnote">Stiennon et al. 2020, arXiv:2009.01325, Fig. 5: summaries, an earlier reward model, PPO at several KL weights $\beta$; values by eye. InstructGPT §3.5: "to mitigate over-optimization of the reward model"</p>

Note:
Now the question from the start: why is there a KL penalty to the reference model at all? Because the reward model is not the thing we care about. It is a learned stand-in for human judgement, with limited capacity, trained on a narrow set of answers: in Stiennon et al.'s words, it "only sees a small amount of comparison data from a relatively narrow distribution of summaries". Push a policy hard against it and the policy finds answers the reward model overrates. This is reward over-optimisation, often called reward hacking.
The figure is the classic demonstration, from the summarisation paper InstructGPT builds on. They trained PPO policies with different KL weights, so each policy ends at a different distance from the supervised model, the horizontal axis, KL in nats. The dashed line is what the reward model predicts: the fraction of the policy's summaries people would prefer to the human-written reference. It keeps climbing, toward 1. The solid line is what labelers actually preferred. It rises to about 0.47 near KL 10, then falls, to about 0.06 at KL 250: by then the reward model is anti-correlated with people. The samples there, in their words, are "clearly long, low quality, and full of idiosyncrasies".
So the penalty's job is to keep the policy near the outputs the reward model was trained on, where its scores can be trusted. InstructGPT says it in one line: the per-token KL penalty is there "to mitigate over-optimization of the reward model". One caution: the figure shows the trade-off along a sweep of KL weights; it does not by itself show that a penalty is the only, or best, way to stop at the peak.

---

<p class="eyebrow"><span class="paper">RLHF, PPO and GRPO</span> · Part 6, PPO on a language model · the direction · Ouyang et al. 2022, Eq. 2</p>

## Why does the penalty put the policy first?

<div class="eq">$$\mathbb E_{o\sim\pi_\theta}\Big[r_\phi(q, o) - \beta\log\frac{\pi_\theta(o \mid q)}{\pi_{\rm ref}(o \mid q)}\Big] = \mathbb E_{o\sim\pi_\theta}\big[r_\phi(q, o)\big] - \beta\thinspace\mathrm{KL}\big(\pi_\theta \Vert \pi_{\rm ref}\big)$$</div>

<div class="cols">
<div class="text">

<dl class="where">
<dt>$\pi_\theta(o \mid q)$</dt><dd>the probability of the whole answer: the product of its token probabilities</dd>
<dt>$r_\phi$, $\beta$</dt><dd>the reward model's score, and the <b>KL coefficient</b></dd>
<dt>$H(\pi)$</dt><dd>the entropy (Part 5's $S$); $H(\pi, \pi_{\rm ref}) = -\sum\pi\log\pi_{\rm ref}$, the cross-entropy</dd>
</dl>

<p class="plain">In words: the penalty is part of the reward, averaged over the policy's own answers; that average is the KL with the policy first.</p>

</div>
<div class="text">

- A natural choice: the rollouts are the policy's own answers, and each token needs one reference pass.
- The KL splits as $-H(\pi_\theta) + H(\pi_\theta, \pi_{\rm ref})$; Stiennon et al. read the first part as an entropy bonus.

<p class="plain">A token at 0.30 under the policy and 0.001 under the reference has log ratio ln 300 = 5.70: a reward penalty of 5.70 $\beta$.</p>

</div>
</div>

<p class="footnote">Ouyang et al. 2022 Eq. 2 (without its pretraining term) and Stiennon et al. 2020 §3.4 write this reward; Stiennon et al.: it "acts as an entropy bonus" and keeps outputs near "those that the reward model has seen during training"</p>

Note:
Now the direction, which was the question we could not answer before. Start from what RLHF actually optimises. Stiennon et al., and InstructGPT's Eq. 2 without its pretraining term, write the reward as the reward model's score minus beta times the log ratio of the policy's probability of the answer to the reference's. The policy maximises the average of that over its own answers, and the average, under the policy, of the log of policy over reference is by definition the KL with the policy first. Writing the penalty that way is a choice, not a theorem, but a natural one: the rollouts are the policy's own answers, we already have each token's probability under the policy, and one forward pass of the reference gives its probability too. The other direction would be an average over answers the reference writes, which we do not have.
What does this KL do? It splits into minus the entropy of the policy plus the cross-entropy from the policy to the reference. Stiennon et al. read the minus-entropy part as "an entropy bonus, encouraging the policy to explore and deterring it from collapsing to a single mode". Be careful with that reading: the two parts are not independent, and the KL as a whole is smallest when the policy equals the reference, not when its entropy is largest. The cross-entropy part is the pull toward text the reference finds likely, their second purpose. The worked line shows how hard that pull is on text the reference finds nearly impossible: a token at 0.30 under the policy and 0.001 under the reference has a log ratio of ln 300, 5.7, so with beta it costs 5.7 beta of reward in one token.

--

<p class="eyebrow"><span class="paper">RLHF, PPO and GRPO</span> · Part 6, PPO on a language model · the direction, in a toy (ours) · optional</p>

## What does the direction change, in a toy?

<div class="cols wide-fig">
<div class="text">

- Fit one bump to a two-bump reference.
- $\mathrm{KL}(\pi \Vert {\rm ref})$: the fit stays inside one bump, with almost no mass in the gap.
- $\mathrm{KL}({\rm ref} \Vert \pi)$: the fit covers both, and puts mass in the gap.
- With no one-bump limit, the KL alone would make the policy equal the reference.

<p class="plain">The $\mathrm{KL}({\rm ref} \Vert \pi)$ fit writes outputs the reference finds nearly impossible: its mass in the gap.</p>

</div>
<div class="fig"><img src="img/week-04-rlhf2-kldir.svg" alt="Illustration: a grey reference with two bumps. The best single bump under KL of pi to ref sits on the left bump. The best single bump under KL of ref to pi is wide, spans both bumps and puts mass in the gap between them"></div>
</div>

<p class="footnote">Ours: reference $\frac12\mathcal N(-2, 0.6^2) + \frac12\mathcal N(2, 0.6^2)$, fits found by grid search. Often called mode-seeking and mass-covering; a toy shape, not a measured property of RLHF policies</p>

Note:
Optional, a toy for intuition about the two directions. The grey reference has two bumps. Suppose the policy can only be a single bump, and we pick the single bump that minimises each KL.
With the policy first, the KL averages the log ratio over the policy's own outputs, so any output where the policy has mass and the reference has almost none is very expensive. The best fit sits inside one of the bumps and ignores the other. Dropping a bump costs only a modest amount: here about log 2.
With the reference first, the KL averages over the reference's outputs, so the expensive thing is the policy having almost no mass where the reference has some. The best fit stretches to cover both bumps, and in doing so puts mass in the gap between them, where the reference has almost none.
For RLHF, the outputs in the gap are the worry: text the reference would almost never write, such as the idiosyncratic summaries in Stiennon's figure. The policy-first direction is the one that refuses them. Two cautions. The difference here comes from forcing a single bump; a policy free to take any shape would, under the KL alone, simply become the reference. And "mode-seeking" describes this toy, not a measured property of trained language models.

---

<p class="eyebrow"><span class="paper">RLHF, PPO and GRPO</span> · Part 6, PPO on a language model · two KLs</p>

## Is this the same KL as TRPO's?

<table class="rules">
  <tr><td></td><td>trust-region KL (Part 5)</td><td>drift KL (here)</td></tr>
  <tr><td>between</td><td>the policy and its own previous version</td><td>the policy and the frozen SFT model</td></tr>
  <tr><td>written</td><td>$\mathrm{KL}(\pi_{\theta_{\rm old}} \Vert \pi_\theta)$, old first</td><td>$\mathrm{KL}(\pi_\theta \Vert \pi_{\rm ref})$, policy first</td></tr>
  <tr><td>limits</td><td>one update</td><td>all of training</td></tr>
  <tr><td>strength</td><td>$\delta_{\rm KL}$, a safe step size</td><td>$\beta$, the trade-off of reward against drift</td></tr>
  <tr><td>in PPO</td><td>replaced by the clip (an adaptive penalty did worse)</td><td>a penalty in the reward</td></tr>
</table>

<p class="plain">A penalty is fine here: $\beta$ is a trade-off we set and sweep on purpose; TRPO needed a safe step size, a different job.</p>

<p class="footnote">$\pi_{\rm ref}$: the frozen SFT model. PPO §4's adaptive KL penalty scored 0.74 against the clip's 0.82 (Table 1). Stiennon et al.'s Fig. 5 is a sweep of $\beta$; they used $\beta$ = 0.05 for their main runs (App. B)</p>

Note:
Two KL divergences appear in this story, and they are easy to mix up. Here they are side by side.
The trust-region KL, from Part 5, is between the policy and its own previous version. It limits the size of one update. TRPO enforces it as a constraint with size delta; PPO replaces it with the clip. It is written old policy first.
The drift KL, here, is between the policy and the frozen SFT model, the reference. It limits how far the policy wanders over all of training, however many small steps it takes. It is written policy first. Its strength is beta, and in PPO for language models it is a penalty in the reward. A policy can take only tiny, clipped steps and still drift far over thousands of updates; the clip cannot stop that, the drift penalty can.
Why is a penalty acceptable here when TRPO rejected one? Because the jobs differ. TRPO needed a step size that is safe everywhere, and one beta could not give it. Here beta expresses a choice we want to make, how much reward to buy with how much drift, and it is chosen deliberately: Stiennon et al.'s figure is exactly a sweep over beta, and they used 0.05 for their main runs.

---

<p class="eyebrow"><span class="paper">RLHF, PPO and GRPO</span> · Part 6, PPO on a language model · per-token reward, $k_1$ KL</p>

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
- Summed over an answer's tokens, $\mathrm{KL}_t$ is the answer's log ratio; averaged over the policy's answers, the KL.

<p class="plain">At 0.6 under the policy and 0.5 under the reference, the reward at $\beta$ = 0.1 is $-0.1 \ln 1.2 = -0.018$; at 0.4 instead, $+0.022$, a small bonus (ours).</p>

</div>
</div>

<p class="footnote">Ouyang et al. 2022 §3.5: "a per-token KL penalty from the SFT model at each token". $\beta$ = 0.1 is illustrative. $k_1$: Schulman 2020's name for the one-sample log ratio</p>

Note:
Now the per-token reward can land: we know what the policy maximises, why the reference is there, and why the KL is the policy-first one. Summed over the answer, the per-token log ratios give the answer's log ratio, by the chain rule, so the per-token form is equivalent to the reward of the last slide.
In PPO the reward combines two parts: the reward model's final score r phi of q and o, and per-token KL penalties. The reward model gives one score for the whole answer, but in LLM PPO each generated token is an action, so we need token-level quantities: log probabilities, KL penalties, advantages. The score is only available for the complete answer, so we add it at the final token. For every earlier token the step reward is just minus beta times the per-token KL estimate; for the last token it's the reward model's score minus beta times its KL estimate.
The KL estimate is the k1 estimator: for each token, compare its probability under the current policy with its probability under the reference, given the same context, and take the log ratio. Beta sets the strength. A larger beta keeps the policy closer to the reference; a smaller beta lets it move more aggressively toward answers with a high score. The KL penalty is an anchor to the reference policy: it stops the policy drifting too far during RL, and stops it finding answers the reward model overrates.
One thing the worked line shows: a single k1 term can be negative, a small bonus for a token the policy now likes less than the reference. On average over the policy's own tokens the sum is still the KL. GRPO, in Part 7, uses a different estimator that is never negative.

--

<p class="eyebrow"><span class="paper">RLHF, PPO and GRPO</span> · Part 6, PPO on a language model · the gravity example, with the KL (ours) · optional</p>

## What do the KL terms do to "Gravity pulls objects together"?

<table class="rules">
  <tr><td>$t$</td><td>token $o_t$</td><td class="num">$\mathrm{KL}_t$</td><td class="num">step reward $r_t$</td><td class="num">reward-to-go $G_t$</td><td class="num">$\hat A_t$, $\lambda$ = 0.95</td><td class="num">$\hat A_t$, $\lambda$ = 1</td></tr>
  <tr><td>1</td><td>Gravity</td><td class="num">0.03</td><td class="num">−0.03</td><td class="num">−0.03 + 1.93 = 1.90</td><td class="num">0.164</td><td class="num">0.20</td></tr>
  <tr><td>2</td><td>pulls</td><td class="num">0.02</td><td class="num">−0.02</td><td class="num">−0.02 + 1.95 = 1.93</td><td class="num">0.204</td><td class="num">0.23</td></tr>
  <tr><td>3</td><td>objects</td><td class="num">0.04</td><td class="num">−0.04</td><td class="num">−0.04 + 1.99 = 1.95</td><td class="num">0.236</td><td class="num">0.25</td></tr>
  <tr><td>4</td><td>together</td><td class="num">0.01</td><td class="num">2 − 0.01 = 1.99</td><td class="num">1.99</td><td class="num">0.290</td><td class="num">0.29</td></tr>
</table>

<p class="plain">Score $r_\phi(q, o) = 2$; $\beta = 1$, $\gamma = 1$; values kept at $V = 1.7$, so $\hat A_t = G_t - 1.7$ at $\lambda$ = 1.</p>

<p class="plain">"Gravity" now gets less than "objects" at $\lambda$ = 1: its reward-to-go carries all four KL penalties, "objects" only the last two (ours).</p>

<p class="footnote">Ours: KL values, $\beta$ and the score are illustrative, and the values are not refitted to the new rewards. Now rewards-to-go differ by token (Part 4's first fix)</p>

Note:
Optional, ours: the good answer again, now with the KL penalty in the reward. The per-token KL estimates are 0.03, 0.02, 0.04 and 0.01, beta is 1 to keep the arithmetic visible, and the score is 2. Step rewards: minus the KL on the first three tokens, and 2 minus 0.01 on the last. Returns backwards: 1.99, 1.95, 1.93, 1.90.
Two things to see. First, rewards-to-go now differ by token, which is when Part 4's first fix starts to matter: a token is charged only for the KL penalties from its own position on. Second, with values left at 1.7, the advantages at lambda 1 are 0.20, 0.23, 0.25 and 0.29: the earlier the token, the more of the KL bill it carries. With lambda 0.95 the TD residuals are minus 0.03, minus 0.02, minus 0.04 and 0.29, and backwards they give 0.290, 0.236, 0.204 and 0.164. A real value model would be refitted to these rewards; we keep 1.7 for simplicity.

---

<p class="eyebrow"><span class="paper">RLHF, PPO and GRPO</span> · Part 6, PPO on a language model · recap: the advantage in PPO</p>

## How does PPO compute each token's advantage?

<div class="cols wide-fig">
<div class="text">

- Input 1 is the per-token reward: $-\beta\thinspace \mathrm{KL}_t$, plus the score at the last token.
- Input 2 is the value model's prediction $v_t = V_\psi(s_t)$ at each state.
- Pass 1 computes the TD residual $\delta_t$ at every token.
- Pass 2 runs backwards from the end and gives the advantage $\hat A_t$.

<p class="plain">All four models feed this: policy and reference (the KL), the reward model (the score), the value model.</p>

</div>
<div class="fig"><img src="img/week-04-rlhf2-gaeflow.svg" alt="Illustration: box 1, reward and value per token: the step reward r t equals minus beta KL t, plus r phi at the last token, and the value v t from the value model. Box 2, TD residual delta t equals r t plus gamma v t+1 minus v t, with v T+1 equal to 0. Box 3, advantage backward: A t equals delta t plus gamma lambda A t+1, starting from A T+1 equal to 0"></div>
</div>

<p class="footnote">$\delta_t$: the TD residual; $\hat A_t$: the GAE advantage; $\gamma$, $\lambda$: the discount and the GAE parameter; $\beta$: the KL coefficient (Parts 4 and 6)</p>

Note:
A quick recap of how A t is computed. It comes from applying GAE to two inputs: the per-token rewards from the current step on, and the learned value function. The first input, the per-token reward, combines the per-token KL estimate and, at the final token, the reward model's score. KL t measures how much the policy deviates from the reference at token t, and beta times KL t is the penalty we subtract. The second input is the value model's scalar prediction for each state.
With those two inputs, GAE produces the advantage in two steps. First the TD residual: the reward at step t plus gamma times the value of the next state minus the value of the current state. Then the advantage, backwards: A t equals delta t plus gamma lambda times A t plus 1.

---

<p class="eyebrow"><span class="paper">RLHF, PPO and GRPO</span> · Part 6, PPO on a language model · one PPO step, 1 of 2: the rollout</p>

## One PPO step: what happens during the rollout?

<table class="rules" style="font-size:22px">
  <tr><td>step</td><td>what</td><td>formula</td></tr>
  <tr><td>1</td><td>freeze the policy; sample an answer per prompt</td><td>$\pi_{\theta_{\rm old}} \leftarrow \pi_\theta$; $o = (o_1, \dots, o_T) \sim \pi_{\theta_{\rm old}}(\cdot \mid q)$</td></tr>
  <tr><td>2</td><td>score the whole answer</td><td>$r_\phi(q, o)$</td></tr>
  <tr><td>3</td><td>for every token, in parallel: value and KL</td><td>$v_t = V_\psi(s_t)$; $\mathrm{KL}_t \approx \log\pi_{\theta_{\rm old}}(o_t \mid q, o_{\lt t}) - \log\pi_{\rm ref}(o_t \mid q, o_{\lt t})$</td></tr>
  <tr><td>4</td><td>step rewards</td><td>$r_t = -\beta\thinspace \mathrm{KL}_t$, plus $r_\phi(q, o)$ at $t = T$</td></tr>
  <tr><td>5</td><td>TD residuals</td><td>$\delta_t = r_t + \gamma v_{t+1} - v_t$, with $v_{T+1} = 0$</td></tr>
  <tr><td>6</td><td>GAE backwards, and value targets</td><td>$\hat A_t = \delta_t + \gamma\lambda\hat A_{t+1}$, $\hat A_{T+1} = 0$; $\hat G_t = \hat A_t + v_t$</td></tr>
</table>

<p class="plain">Step 3 uses $\log\pi_{\theta_{\rm old}}$: at rollout time it is the same model as $\pi_\theta$, and sampling already computed it.</p>

<p class="footnote">$\hat G_t$: the value model's return target (advantage plus value). $r_\phi$, $V_\psi$, $\pi_{\rm ref}$: reward, value and reference models; $\beta$, $\gamma$, $\lambda$ as before</p>

Note:
To finish PPO, one step of the training loop. First, copy the current policy and freeze it as the old policy; for each prompt, sample an answer from it, a sequence of tokens o1 to oT. Next, compute the reward model's score for the complete answer: one scalar for the whole response. Then for all response tokens compute several token-level quantities in parallel. The value model predicts v t for each state, the prompt plus the tokens before position t. And the per-token KL estimate: conceptually it compares pi theta with the reference; we use log pi theta old because at rollout time the old policy is a frozen copy of pi theta and we already have its log probabilities.
From the score and the KL estimates form the step rewards: for tokens before the last, just the negative KL penalty; for the last, add the reward model's score. With step rewards and values, compute the TD residual: r t plus gamma times the next value minus the current value. At the final token the next value is zero, because the answer ends there.
Then the advantages, backwards from the final token with the recursive GAE formula, starting from A T plus 1 equal to zero. We also compute the return target for the value model: since an advantage is a return minus a value, adding the value back gives an estimated return, G hat t = A hat t + v t.

---

<p class="eyebrow"><span class="paper">RLHF, PPO and GRPO</span> · Part 6, PPO on a language model · one PPO step, 2 of 2: the update</p>

## One PPO step: what happens during the update?

<table class="rules">
  <tr><td>step</td><td>what</td><td>formula</td></tr>
  <tr><td>7</td><td>recompute the current policy's log-probabilities on the same rollout</td><td>$\log\pi_\theta(o_t \mid q, o_{\lt t})$</td></tr>
  <tr><td>8</td><td>importance ratios</td><td>$\rho_t(\theta) = \exp\big(\log\pi_\theta(o_t \mid q, o_{\lt t}) - \log\pi_{\theta_{\rm old}}(o_t \mid q, o_{\lt t})\big)$</td></tr>
  <tr><td>9</td><td>minimise the combined loss</td><td>$L = -J_{\rm PPO} + c_1 L_V$, with $L_V = \frac1T\sum_t\big(V_\psi(s_t) - \hat G_t\big)^2$</td></tr>
</table>

<div class="cols">
<div class="text">

- Steps 7 to 9 repeat over minibatches; InstructGPT: one epoch, 8 minibatch steps of 64.
- The policy and the value model are updated; the reward and reference models stay frozen.

</div>
<div class="text">

<p class="plain">Code minimises $-J_{\rm PPO}$ because $J_{\rm PPO}$ is to be maximised and optimisers minimise.</p>

</div>
</div>

<p class="footnote">$c_1$: the value loss's weight (Part 5); $L_V$: the value model's squared error (Part 4). InstructGPT, App. C: batches of 512 split into 8 minibatches, "a single inner epoch"</p>

Note:
During PPO optimisation we recompute the current policy's log probability on the same rollout: for each generated token, its log probability under pi theta given the prompt and the earlier tokens. Then the importance ratio: the exponential of the current log probability minus the old one, for the same token and context. Finally the training loss. J PPO is an objective we want to maximise, so in code we minimise its negative, and add the value model's loss weighted by a coefficient.
In many implementations the policy and the value model share a transformer backbone, with one head for next-token prediction and one for the value, and PPO updates the backbone and both heads together. The reward model and the reference model stay frozen. Steps 7 to 9 can run several epochs on one batch, which is exactly why the ratio and the clip are needed: after the first pass, pi theta is no longer pi theta old.

---

<p class="eyebrow"><span class="paper">RLHF, PPO and GRPO</span> · Part 7, GRPO · Shao et al. 2024, Fig. 4</p>

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

<p class="eyebrow"><span class="paper">RLHF, PPO and GRPO</span> · Part 7, GRPO · group as baseline · Shao et al. 2024 §4.1.2</p>

## How does a group of answers become the baseline?

<div class="cols wide-fig">
<div class="text">

<div class="eq">$$\hat A_{i,t} = \tilde R_i = \frac{R_i - \mathrm{mean}(R_1, \dots, R_K)}{\mathrm{std}(R_1, \dots, R_K)}$$</div>

<dl class="where">
<dt>$o_1, \dots, o_K$</dt><dd>a <b>group</b> of $K$ answers to one prompt, sampled from $\pi_{\theta_{\rm old}}$</dd>
<dt>$R_i$</dt><dd>answer $i$'s total reward, $r_\phi(q, o_i)$</dd>
<dt>$\tilde R_i$</dt><dd>its normalised reward, given to every token $t$ of $o_i$</dd>
</dl>

- An answer above the group's average gets a positive advantage.

<p class="plain">Four answers, one right (1) and three wrong (0): mean 0.25, std 0.433, so +1.73 for the right one and −0.58 for each wrong one.</p>

</div>
<div class="fig"><img src="img/week-04-grpo-adv.svg" alt="Illustration: two groups of four answers with 0/1 rewards. Hard question, one right: the right answer gets +1.73, each wrong one -0.58. Easy question, three right: each right answer +0.58, the wrong one -1.73"></div>
</div>

<p class="footnote">Shao et al. 2024 §4.1.2, outcome supervision; the paper samples 64 and writes $G$ for our $K$. std: standard deviation, population form in our numbers. Figure from Week 4 (ours)</p>

Note:
How does GRPO compute the advantage? For each question q, sample a group of answers from the old policy, o1 up to oK. The reward model scores each, giving K rewards R1 up to RK. Instead of a value model as the baseline, GRPO uses the rewards within the same group: for each answer, subtract the group's mean reward and divide by the group's standard deviation. That normalised reward is the advantage for the answer, and the same advantage is assigned to every token in it.
If an answer scores above the group average its advantage is positive, and GRPO encourages answers like it; below average, negative, and GRPO discourages it. That's what "group as baseline" means: an answer is judged relative to other answers to the same prompt, not relative to a learned value estimate.
Worked numbers from Week 4: one right answer in four gets plus 1.73, each wrong one minus 0.58; on an easy question with three right, each right answer gets only plus 0.58 and the wrong one minus 1.73.

--

<p class="eyebrow"><span class="paper">RLHF, PPO and GRPO</span> · Part 7, GRPO · Later work · Liu et al. 2025, Yu et al. 2025 · optional</p>

## What if every answer in the group gets the same score?

<div class="cols">
<div class="text">

- All right or all wrong: the mean equals every reward and the std is 0, so the formula is 0/0.
- Code adds a small constant, so every advantage is 0: the prompt teaches nothing.
- Near-equal scores are worse: 0.80, 0.81, 0.80, 0.81 become −1, +1, −1, +1.
- DAPO drops all-same groups; Dr. GRPO drops the std altogether.

</div>
<div class="text">

<p class="plain">A group spreads out naturally with a checker: some answers pass the unit tests, some fail (Part 8).</p>

</div>
</div>

<p class="footnote">Ours, after Week 4's GRPO section. Yu et al. 2025, DAPO, arXiv:2503.14476 (dynamic sampling). Liu et al. 2025, "Understanding R1-Zero-Like Training", arXiv:2503.20783 (Dr. GRPO)</p>

Note:
Optional, from Week 4. The paper doesn't discuss the case where every answer in a group gets the same reward: the formula is zero over zero, implementations add a small epsilon to the std, and every advantage becomes zero, so the prompt contributes no gradient. Near-identical reward-model scores are worse than equal ones: a std of 0.005 multiplies tiny differences by 200, and four answers that are all about the same look like two right and two wrong. DAPO, a later repair of GRPO, filters out groups whose answers are all right or all wrong; Dr. GRPO removes the std division, and the length average, altogether. This is the low-reward-variance point of Part 8, seen from the formula.

---

<p class="eyebrow"><span class="paper">RLHF, PPO and GRPO</span> · Part 7, GRPO · Shao et al. 2024, Eq. 3, Eq. 4</p>

## What is GRPO's objective, and its KL estimate?

<div class="eq">$$J_{\rm GRPO}(\theta) = \mathbb E\Big[\frac1K\sum_{i=1}^{K}\frac{1}{T_i}\sum_{t=1}^{T_i}\Big\{\min\big(\rho_{i,t}(\theta)\hat A_{i,t},\ \mathrm{clip}(\rho_{i,t}(\theta), 1-\epsilon, 1+\epsilon)\hat A_{i,t}\big) - \beta\thinspace \mathrm{KL}_{i,t}\Big\}\Big]$$</div>

<div class="cols">
<div class="text">

<dl class="where">
<dt>$\rho_{i,t}(\theta)$</dt><dd>the importance ratio for token $t$ of answer $i$</dd>
<dt>$\hat A_{i,t}$</dt><dd>the group advantage $\tilde R_i$</dd>
<dt>$\mathrm{KL}_{i,t}$</dt><dd>the per-token KL, by the <b>$k_3$ estimator</b>: $u_{i,t} - \log u_{i,t} - 1$</dd>
<dt>$u_{i,t}$</dt><dd>$\pi_{\rm ref}(o_{i,t} \mid q, o_{i,\lt t})/\pi_\theta(o_{i,t} \mid q, o_{i,\lt t})$</dd>
<dt>$K$, $T_i$</dt><dd>the group size, and answer $i$'s length</dd>
<dt>$\epsilon$, $\beta$</dt><dd>the clip range, and the KL weight</dd>
</dl>

</div>
<div class="text">

- PPO's clipped objective, averaged over the group and each answer's tokens.
- The KL moves out of the reward and into the objective, as a separate penalty.
- $k_3$ is never negative and usually has lower variance than PPO's $k_1$.

<p class="plain">At $u$ = 1, $k_3 = 1 - 0 - 1 = 0$: no penalty where the two models agree.</p>

</div>
</div>

<p class="footnote">Shao et al. 2024 §4.1.1, Eq. 3, Eq. 4; $\beta$ = 0.04 and $K$ = 64 from its RL training setup. $k_3$: Schulman 2020's name. The expectation is over $q \sim \mathcal D$ and the group $\{o_i\} \sim \pi_{\theta_{\rm old}}$</p>

Note:
GRPO's objective is very like PPO's, adapted to groups. Instead of one answer per prompt, sample a group of K answers from the old policy. For each answer and each token, compute the importance ratio R i t: the token's probability under the current policy over its probability under the old policy, given the prompt and the earlier tokens. The advantage A hat i t is the group-relative reward from the last slide. The clipping is the same as PPO's: it stops the current policy moving too far from the old one in one update.
One difference from the PPO we built: where the KL goes. In PPO the KL penalty was inside the reward signal. In GRPO it is subtracted directly in the objective as a separate regularisation term, and it uses the k3 estimator: u minus log u minus 1, where u is the reference's probability of the token over the current policy's. Compared with the k1 estimate PPO uses, k3 is always non-negative and usually has lower variance.
So in short: GRPO keeps PPO's clipped objective, removes the value model, replaces the value baseline with a group-relative one, and adds the KL term directly to the objective.

--

<p class="eyebrow"><span class="paper">RLHF, PPO and GRPO</span> · Part 7, GRPO · Week 4, GRPO section · optional</p>

## Why $k_3$ and not $k_1$?

<div class="cols wide-text">
<div class="text">

- Both use one sampled token and average to the true KL, on the policy's own tokens.
- $k_1 = -\log u$ can be negative; inside a reward that is fine, since a reward is not differentiated.
- In a loss the gradient matters: $k_1$'s expected gradient is 0, while $k_3$'s pulls toward the reference.
- Toy policy (0.8, 0.2), reference (0.5, 0.5): true KL 0.193; $k_3$ variance 0.038 against $k_1$'s 0.307 (ours).

</div>
<div class="fig"><img src="img/week-04-grpo-kl-est.svg" alt="Illustration: per-token KL estimates against u on a log axis. k3 = u - log u - 1 is a curve touching zero at u = 1 and positive elsewhere; k1 = -log u is a falling line that goes negative above u = 1. Dots at u = 0.625 (k1 +0.470, k3 +0.095) and u = 2.5 (k1 -0.916, k3 +0.584)"></div>
</div>

<p class="footnote">Ours, after Week 4. Tang &amp; Munos 2025, arXiv:2506.09477: $k_3$ in a loss gives the KL's gradient with the two distributions swapped</p>

Note:
Optional, from Week 4. Write u for the reference's probability of the sampled token over the policy's. k1 is minus log u: right on average, but a single token can give a negative value. k3 is u minus log u minus 1: still right on average, because u minus 1 averages to zero on the policy's own tokens, and never negative. On a toy two-token policy, (0.8, 0.2) against a reference (0.5, 0.5), the true KL is 0.193; both estimators average to it, with variances 0.038 for k3 and 0.307 for k1.
The deeper reason is the gradient. As a loss term, k1's expected gradient is zero: it pulls the policy nowhere. k3's pulls toward the reference, though Tang and Munos point out it is the gradient of the divergence with its arguments swapped, not quite the KL that Eq. 3 writes. At small beta the difference barely matters.

---

<p class="eyebrow"><span class="paper">RLHF, PPO and GRPO</span> · Part 7, GRPO · one GRPO step</p>

## One GRPO step: what happens?

<table class="rules">
  <tr><td>step</td><td>what</td><td>formula</td></tr>
  <tr><td>1</td><td>freeze the policy; sample a group per prompt</td><td>$\pi_{\theta_{\rm old}} \leftarrow \pi_\theta$; $\{o_1, \dots, o_K\} \sim \pi_{\theta_{\rm old}}(\cdot \mid q)$</td></tr>
  <tr><td>2</td><td>score every answer, with a reward model or a checker</td><td>$R_i = r_\phi(q, o_i)$</td></tr>
  <tr><td>3</td><td>for every answer and token, in parallel: ratio, advantage, KL</td><td>$\rho_{i,t}(\theta)$; $\hat A_{i,t} = (R_i - \mathrm{mean}(R))/\mathrm{std}(R)$; $u_{i,t} - \log u_{i,t} - 1$</td></tr>
  <tr><td>4</td><td>minimise the negative objective</td><td>$L_{\rm GRPO} = -J_{\rm GRPO}$</td></tr>
</table>

<div class="cols">
<div class="text">

- Only the policy is updated; the reference and the reward source stay frozen.
- No value model and no value loss, so no backward GAE pass.

</div>
<div class="text">

<p class="plain">GRPO saves the value model's forward passes, at rollout and in every update, but samples $K$ answers per prompt.</p>

</div>
</div>

<p class="footnote">Reward source: a reward model or a rule, such as a checker of the final answer or unit tests for code</p>

Note:
One step of GRPO, as for PPO. First copy the current policy and freeze it as the old policy; for each prompt, sample a group of answers from it, o1 to oK. Next use a reward model, or more generally a reward function, to score each answer: a group of scores R1 to RK, R i being the score for prompt q and answer o i. Then for each answer and each token compute, in parallel: the importance ratio, comparing the token's probability under the current and the old policy; the advantage, the group-normalised reward assigned to every token of the answer; and the per-token KL term between the current policy and the reference, which is multiplied by beta and subtracted from the objective. Since J GRPO is to be maximised, in code we minimise its negative.
During GRPO training only the policy is updated. The reference model stays frozen, and so does the reward source, whether a reward model or a reward function.

---

<p class="eyebrow"><span class="paper">RLHF, PPO and GRPO</span> · Part 8, PPO or GRPO</p>

## How do PPO and GRPO differ?

<table class="rules">
  <tr><td></td><td>PPO</td><td>GRPO</td></tr>
  <tr><td>baseline</td><td>a learned value model (the critic)</td><td>the group of sampled answers</td></tr>
  <tr><td>advantage</td><td>per token, by GAE</td><td>per answer, the same on every token</td></tr>
  <tr><td>models</td><td>4, two trained</td><td>3, one trained</td></tr>
  <tr><td>KL</td><td>$k_1$, inside the reward</td><td>$k_3$, in the objective</td></tr>
  <tr><td>cost (rule of thumb)</td><td>heavier: policy and value model to train</td><td>simpler and cheaper, but $K$ answers per prompt</td></tr>
  <tr><td>the question it asks</td><td>"Was this token better than my value estimate?"</td><td>"Was this answer better than other answers to the same prompt?"</td></tr>
</table>

<p class="plain">PPO is the more general: it works with rewards at every step; GRPO needs several answers to one prompt.</p>

<p class="footnote">Week 4's comparison table adds: with one update per batch, as in DeepSeekMath's runs, GRPO's clip never binds</p>

Note:
At a high level the biggest difference between PPO and GRPO is the choice of baseline. PPO uses a learned value model, the critic, as its baseline; GRPO uses the group of sampled answers. That leads to different characteristics. PPO learns a value model and estimates the advantage token by token. It's more general, but the training pipeline is heavier, because we train and update both the policy and the value model. GRPO needs no value model: it samples several completions per prompt, scores them and normalises the rewards within the group, so it is usually simpler and cheaper to train.
Intuitively, PPO asks: was this token better than my value estimate? GRPO asks: was this answer better than other answers to the same prompt?

--

<p class="eyebrow"><span class="paper">RLHF, PPO and GRPO</span> · Part 8, PPO or GRPO · Later work · DeepSeek-AI 2025 · optional</p>

## Is $\lambda$ = 0.95 right for a language model?

<div class="cols wide-fig">
<div class="text">

- 0.95 is PPO's robot and Atari setting, where rewards arrive every step.
- With one final reward, the first of 500 tokens gets $0.95^{499}$ of it: credit rides on the value model (ours).
- In R1's supplement, on MATH: PPO 0.501 at $\lambda$ = 0.95, 0.536 at $\lambda$ = 1, GRPO 0.555.
- One run each, by GRPO's authors.

</div>
<div class="fig"><img src="img/week-04-grpo-r1-ppo.png" alt="DeepSeek-R1 supplement figure: MATH accuracy against training steps up to about 2,400 for PPO with lambda 0.95, PPO with lambda 1.0 and GRPO. GRPO ends near 0.555, PPO with lambda 1.0 near 0.536, PPO with lambda 0.95 near 0.501"></div>
</div>

<p class="footnote">DeepSeek-AI 2025, DeepSeek-R1, arXiv:2501.12948, supplement; a 16B mixture-of-experts model; values by eye. MATH: competition maths problems. GAE and $\lambda$: Part 4</p>

Note:
Optional. The "typical" 0.95 comes from robotics, where a reward arrives at every step. For a language model with one reward at the end, 0.95 to the 499th is effectively zero, so with lambda 0.95 the early tokens' advantages are almost entirely the value model's opinion (our reading). R1's supplement is the one head-to-head: on MATH, PPO with lambda 0.95 "performs considerably worse than GRPO"; with lambda 1.0 it "improves substantially, nearing that of GRPO". By eye, 0.501, 0.536 and 0.555; one run per setting, one model, by GRPO's own authors.

---

<p class="eyebrow"><span class="paper">RLHF, PPO and GRPO</span> · Part 8, PPO or GRPO · rules of thumb</p>

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

<p class="eyebrow"><span class="paper">RLHF, PPO and GRPO</span> · Part 8, PPO or GRPO · Week 4 critiques · optional</p>

## What do the papers and later work say about this advice?

<div class="cols">
<div class="text">

- Token credit: PPO's per-token credit needs $\lambda$ near 1 to reach early tokens, and then it is close to GRPO's whole-answer credit (Part 4).
- Head to head on maths, R1's supplement: GRPO 0.555, PPO 0.536 at best; one run each.
- Low variance: a value model is no fix for all-same groups; DAPO drops them instead.
- "Cheaper" is not measured: DeepSeekMath gives no memory or time numbers, and samples 64 answers per question.

</div>
<div class="text">

<p class="plain">Best supported: "verifiable rewards suit GRPO", since R1 and DeepSeekMath both use it there; the rest is plausible but untested (ours).</p>

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

- A reward model trained on rankings gives one score per answer.
- The advantage, estimated by GAE, weights each token's gradient: less noise, better blame.
- PPO reuses a batch through the clipped ratio; GRPO swaps the value model for a group.
- The KL to the reference guards against over-optimisation; the policy comes first.

</div>
<div class="text">

<table class="rules nohead">
  <tr><td>InstructGPT</td><td>Ouyang et al. 2022, arXiv:2203.02155</td></tr>
  <tr><td>Summarisation RLHF</td><td>Stiennon et al. 2020, arXiv:2009.01325</td></tr>
  <tr><td>TRPO</td><td>Schulman et al. 2015, arXiv:1502.05477</td></tr>
  <tr><td>GAE</td><td>Schulman et al. 2015, arXiv:1506.02438</td></tr>
  <tr><td>PPO</td><td>Schulman et al. 2017, arXiv:1707.06347</td></tr>
  <tr><td>GRPO</td><td>Shao et al. 2024, arXiv:2402.03300</td></tr>
</table>

</div>
</div>

<p class="footnote">REINFORCE: Williams 1992. InstructGPT, PPO and GRPO are read in depth in the Week 4 deck</p>

Note:
That is the whole chain, bottom up. A reward model trained on rankings gives one score per answer. The policy gradient turns a score into a push on every token's log-probability; REINFORCE does it directly, and is noisy and blames every token alike. Rewards-to-go, a baseline and the value function turn the score into an advantage, and GAE estimates it, trading the value model's bias against the rewards' noise with lambda. To reuse an expensive batch, the importance ratio corrects for the policy having moved, and PPO's clip stands in for TRPO's trust region. Back on a language model, the reward gets a KL penalty to the frozen SFT model: because the reward model can be over-optimised, and the penalty is averaged over the policy's own answers, which is why the policy comes first. GRPO keeps PPO's clip, drops the value model, and uses a group of answers to the same prompt as the baseline.
