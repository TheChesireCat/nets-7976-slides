<!-- .slide: id="week-05" class="cover week" -->

<h1>Week 5</h1>
<p class="subtitle">Beyond Autoregressive Decoders: GLiNER</p>

Note:
One reading, as a deep dive: GLiNER, a small encoder that finds named entities of any type you name, and its claim that it beats much larger generative models at this. The syllabus also lists GLiNER2 and DiffusionGemma; GLiNER2 appears below as later work. With one reading there is no overview table; the closing slides carry the assessment, and the "what does the paper establish" slide is the scorecard.

---

<p class="eyebrow">Week 5 reading</p>

## Do you need a decoder to read a text?

<div class="cols">
<div class="text">

- Weeks 2 to 4: decoders that write the answer
- GPT-3: tasks as text to continue
- this week: an encoder that scores, never writes
- task: find names of any type you ask for (named entity recognition)

</div>
<div class="text">

<p class="q"><b>Q.</b> What would you give up by not generating?</p>
<p class="a"><b>A.</b> Free-form answers. What you gain: one pass, every type at once</p>
<p class="q"><b>Q.</b> Does a 0.3B encoder stand a chance against 7B and 13B models?</p>
<p class="a"><b>A.</b> That's the paper's claim; we'll check it table by table</p>

</div>
</div>

<p class="footnote">Zaratiana, Tomeh, Holat &amp; Charnois 2023 · arXiv:2311.08526 · NAACL 2024 (North American Chapter of the Association for Computational Linguistics). Zero-shot: tested on datasets it was not trained on. Span: a run of consecutive words. Press ↓ on any slide for optional depth</p>

Note:
The theme of the week is going beyond autoregressive decoders. So far every model we've read writes its answer one token at a time; GPT-3 turned every task into text to continue. GLiNER does the opposite for one task, named entity recognition: it reads the text and the list of types you want together, and scores every candidate span against every type in one pass. Nothing is generated.
The question to keep in mind is whether a small encoder trained this way can really beat models 20 to 40 times larger. The paper says yes; the deep dive goes through how, and where the evidence is weaker than the prose.


---

<!-- .slide: class="cover divider" -->

<p class="kicker">This week's reading</p>
<h1>Zaratiana et al. 2023</h1>
<p class="subtitle">GLiNER: Generalist Model for Named Entity Recognition using Bidirectional Transformer</p>
<p class="question">Can a small encoder that reads the type names find any entity type as well as a large generative model, in one pass?</p>

Note:
This week's reading: Zaratiana, Tomeh, Holat and Charnois, from FI Group and the LIPN lab in Paris, posted November 2023 and published at NAACL 2024, the conference of the North American Chapter of the Association for Computational Linguistics. One question: does open-type entity recognition need a model that writes its answer, or can a small bidirectional encoder score candidate spans against type names and do better?

---

<p class="eyebrow"><span class="paper">Zaratiana et al. 2023</span> · Motivation · Fig. 1</p>

## How do the two answers differ?

<div class="cols wide-fig">
<div class="text">

- ask an LLM: one question per type
- the answer is written, token by token
- GLiNER: types and text go in together
- the answer is a score per span and type
- same training data as the LLM (UniNER)

<p class="q"><b>Q.</b> What is the bet?</p>
<p class="a"><b>A.</b> Ours: scoring spans does as well as writing them, with about 23 to 43 times fewer parameters</p>

</div>
<div class="fig"><img src="img/week-05-gliner-fig1.png" alt="GLiNER Figure 1: (a) UniNER prompts an LLM with one question per entity type in a multi-turn dialogue and gets lists of strings back; (b) GLiNER feeds [ENT] person [ENT] location [ENT] organization [SEP] and the sentence into a bidirectional LM and gets spans (0,1, person) and (4,5, organization)"></div>
</div>

<p class="footnote">Zaratiana et al. 2023 · arXiv:2311.08526 · Fig. 1. NER: named entity recognition. LLM: large language model. Open-type NER: the user names the types at run time. 60.9 vs 53.7 and 55.6 F1 on the out-of-domain average (Table 1); F1 is defined on the next slide. Ratio: 7B and 13B over 0.3B (ours)</p>

Note:
Most of this course has been about decoders. In Week 4, GPT-3 showed that a big enough decoder can do new tasks from an instruction, and GLiNER's own introduction credits GPT-3 with opening "a new era for open-type NER". By 2023 the flexible way to find entities was to ask an LLM in plain words, "what describes person in the text?", and let it write the answer: one question per type, one token at a time, from a model with billions of parameters.
GLiNER bets on the opposite. Put the type names into the input of a small bidirectional encoder, give every candidate span and every type a vector, and score them with a dot product. Trained on the same ChatGPT-written data as a 7B or 13B generative model, the 0.3B version scores higher zero-shot. Figure 1 shows the two approaches side by side; we will come back to each panel.

---

<p class="eyebrow"><span class="paper">Zaratiana et al. 2023</span> · background · Fig. 2 sentence</p>

## What is named entity recognition?

<div class="cols">
<div class="text">

- input: text; output: spans with types
- span = (start word, end word, type)
- Alain Farley works at McGill University
- (0, 1, person), (4, 5, organization)
- types: person; gene; pathogen; ...

</div>
<div class="text">

<p class="q"><b>Q.</b> A model outputs (Alain Farley, person) and (McGill, organization). Score?</p>
<p class="a"><b>A.</b> 1 right, 1 wrong, 1 missed: precision 0.5, recall 0.5, F1 0.5</p>
<p class="q"><b>Q.</b> Credit for "McGill"?</p>
<p class="a"><b>A.</b> None: both boundaries and type must match</p>

</div>
</div>

<p class="footnote">Zaratiana et al. 2023 §3.4: "F1-score based on the exact match between predicted and actual entities". F1 = harmonic mean of precision and recall, scaled 0 to 100. UniNER's definition: micro per dataset (counts summed); GLiNER's "Average" columns: plain mean over datasets (macro). Example ours</p>

Note:
NER takes a text and returns spans, runs of consecutive words, each with a type. On the paper's example sentence the answer is Alain Farley, words 0 to 1, a person, and McGill University, words 4 to 5, an organization. Positions count words, not subword tokens.
The scoring is strict. Suppose a model gets Alain Farley right but predicts "McGill" alone as an organization. That is one true positive, one false positive and one missed entity: precision a half, recall a half, F1 a half. Getting the name almost right, one word short, scores the same as missing it, and costs a false positive on top. Keep that in mind: a method good at boundaries gets a big advantage under this metric. Within a dataset F1 is computed on summed counts; the paper's average columns are plain means over datasets.

---

<p class="eyebrow"><span class="paper">Zaratiana et al. 2023</span> · background · §6 Related Works</p>

## Tag every word, or classify every span?

<div class="cols wide-fig">
<div class="text">

- BIO: one tag per word, B-PER I-PER O ...
- types fixed in the output layer
- no nesting; invalid tag runs
- spans: every (i, j) is a candidate
- nesting free; whole spans only

<p class="q"><b>Q.</b> Spans in 6 words?</p>
<p class="a"><b>A.</b> $\frac{6 \cdot 7}{2} = 21$</p>

</div>
<div class="fig"><img src="img/week-05-gliner-spans.svg" alt="Illustration: the 21 spans of Alain Farley works at McGill University as cells of an upper triangle, start word on the rows and end word on the columns; cells (0,1) and (4,5) are black, the two gold entities"></div>
</div>

<p class="footnote">Zaratiana et al. 2023 §6 names BILOU tags, span classification, question answering (Li et al. 2019) and generation (Yan et al. 2021). BIO: B = begins, I = inside, O = outside; PER = person, ORG = organization. Nesting example ours: "the Delta variant of SARS-CoV-2". Illustration ours</p>

Note:
Two classic framings. Sequence labelling gives each word a tag: B for the first word of an entity, I for inside, O for outside. The paper's related work mentions BILOU, a richer cousin. Taggers are fast and good, but the types are baked into the output layer, one word gets one tag so nested entities are impossible ("SARS-CoV-2" inside "the Delta variant of SARS-CoV-2"), and a tagger can emit an I with no B before it.
Span classification lists every span and classifies it. Six words give 21 spans, the triangle on the right. Nesting is just two different spans, and every prediction is a whole span with both boundaries. Two more framings from the related work: NER as question answering, one question per type, which is the ancestor of UniNER's conversations and of GLiNER's type prompts; and NER as generation, the ancestor of the LLM approaches. GLiNER is span classification with question-style type prompts, all asked at once.

--

<p class="eyebrow"><span class="paper">Zaratiana et al. 2023</span> · §2.1 · span cap $K = 12$</p>

## How many spans once they are capped?

<div class="cols wide-fig">
<div class="text">

<div class="eq">$$\sum_{\ell=1}^{K} (N - \ell + 1) = KN - \frac{K(K-1)}{2}$$</div>

- $N$ words; at most $K$ = 12 long
- 30 words: 294, not 465
- 100 words: 1134, not 5050

<p class="q"><b>Q.</b> What is lost?</p>
<p class="a"><b>A.</b> Every entity over 12 words</p>

</div>
<div class="fig"><img src="img/week-05-gliner-spancount.svg" alt="Illustration: number of candidate spans against sentence length; all spans grow quadratically to 5,050 at 100 words, spans capped at 12 words grow linearly to 1,134; at 30 words, 465 vs 294"></div>
</div>

<p class="footnote">Zaratiana et al. 2023 §2.1: the cap keeps "linear complexity, without harming recall"; no recall number is shown. "Linear" is the span count; the encoder's attention is not linear in length. Illustration ours</p>

Note:
Optional. All spans grow as N times N plus one over two, which is quadratic. So span models cap the length. There are N minus ell plus one spans of length ell; sum for ell up to K and you get K N minus K times K minus one over two. With K equal to 12: 294 spans for a 30-word sentence instead of 465, and 1134 for 100 words instead of 5050. About 12 per word: linear.
The cost: an entity longer than 12 words can never be predicted. The paper says the cap does not harm recall but shows no number. For names that is surely fine; for a long description, of an intervention or a method, it might not be.

---

<p class="eyebrow"><span class="paper">Zaratiana et al. 2023</span> · §1 Introduction</p>

## Why open-type NER?

<div class="cols">
<div class="text">

- classic NER: a fixed list of types
- new type: new labelled data
- open-type: name the types at run time
- zero-shot: unseen datasets, no fine-tuning

</div>
<div class="text">

<p class="q"><b>Remember this</b></p>
<p class="a">Unseen datasets, not necessarily unseen types</p>
<p class="q"><b>Q.</b> Are the test types new?</p>
<p class="a"><b>A.</b> Person, organization, location: in the top 1% of training types. The rest: unchecked</p>

</div>
</div>

<p class="footnote">Zaratiana et al. 2023 §1: "Traditional NER models are limited to a predefined set of entity types." Top-1% types from UniNER (Zhou et al. 2023), whose data GLiNER trains on</p>

Note:
What problem is GLiNER solving? Classic models learn a fixed list of types from a labelled dataset; every new type or domain needs new annotation. In open-type NER the user names the types at run time, in words, and the model finds them.
Remember the meaning of zero-shot here: evaluating on datasets and domains the model was not trained on, without fine-tuning. That is not the same as unseen types. Person, organization and location are among the most frequent training types. Whether the domain types of the test sets also appear among the 13,000 training types is not reported anywhere. A critique later turns on this.

---

<p class="eyebrow"><span class="paper">Zaratiana et al. 2023</span> · §1, §3.3 Baselines</p>

## How did LLMs do open NER in 2023?

<table class="rules">
  <tr><td>family</td><td>model</td><td>size</td><td>trained on</td></tr>
  <tr><td>prompt a chat model</td><td>ChatGPT, Vicuna</td><td>unknown; 7B, 13B</td><td>no NER training</td></tr>
  <tr><td>instruction-tune on IE datasets</td><td>InstructUIE (Flan-T5)</td><td>11B</td><td>many human-labelled datasets</td></tr>
  <tr><td>distil ChatGPT's NER labels</td><td>UniNER (LLaMA)</td><td>7B, 13B</td><td>Pile-NER: ChatGPT's labels</td></tr>
  <tr><td>follow annotation guidelines</td><td>GoLLIE (Code-LLaMA)</td><td>7B</td><td>labelled data plus guidelines</td></tr>
</table>

<p class="footnote">Zaratiana et al. 2023 §1, §3.3. IE: information extraction (entities, relations, events). Vicuna: LLaMA tuned on ChatGPT conversations. Flan-T5 is an encoder-decoder; its decoder still generates token by token. Pile-NER: 50,000 passages of the Pile (English text from diverse sources) with ChatGPT's labels; GLiNER's training data too</p>

Note:
Four families appear in the comparisons. Prompting a chat model, ChatGPT or Vicuna, with no NER training at all. InstructUIE: Flan-T5 11B fine-tuned on many human-labelled information extraction datasets phrased as instructions; note Flan-T5 is an encoder-decoder, but its decoder generates the answer token by token, so the paper groups it with the autoregressive models. UniNER: LLaMA 7B or 13B fine-tuned on NER data that ChatGPT wrote. GoLLIE: Code-LLaMA 7B trained to follow annotation guidelines written as code.
UniNER matters most, because its dataset is GLiNER's training data. Same data, different architecture: that is the clean comparison.

---

<p class="eyebrow"><span class="paper">Zaratiana et al. 2023</span> · UniNER, the main baseline · Fig. 1(a)</p>

## How does UniNER ask for entities?

<div class="cols wide-fig">
<div class="text">

- Pile passages, ChatGPT writes the labels
- a conversation: one question per type
- answer: a list of strings
- negative types: answer "[]"
- negatives: 31.5 ▸ 53.4 F1

<p class="q"><b>Q.</b> Strings, not positions. So?</p>
<p class="a"><b>A.</b> Must be found in the text again; how is not described</p>

</div>
<div class="fig"><img src="img/week-05-gliner-fig1a.png" alt="GLiNER Figure 1(a): Human: [Instruction] Text: Alain Farley works at McGill University. Assistant: I've read the text. Human: What describes person in the text? Assistant: ['Alain Farley']. Location: []. Organization: ['Mcgill University']"></div>
</div>

<p class="footnote">Zhou et al. 2023 (UniNER) · arXiv:2308.03279 · §2, §4: loss only on the answers; negatives sampled by type frequency; out-of-domain average 31.5 without negatives, 53.4 with. Asking all types in one query was worse "by 3.3%" (F1 points). Figure: GLiNER Fig. 1(a)</p>

Note:
UniNER's recipe is targeted distillation: take ChatGPT as the teacher and distil one capability, open NER, into LLaMA. They cut Pile documents into passages of at most 256 tokens, sampled 50 thousand, and had ChatGPT list all entities and their types. Then the student is trained as a conversation: the passage, then "what describes person in the text?", answer a list of strings, and so on, one type per turn, loss only on the answers.
Two details. They add negative types, types absent from the passage, answered with an empty list, and that lifts the out-of-domain average from 31.5 to 53.4. And they tried asking all types in one query; it was 3.3 points worse, so the accuracy comes with one turn per type. A decoder-trained reader should ask: the model outputs strings, so how are they located back in the text, and which occurrence if a string appears twice? UniNER's paper does not say.

---

<p class="eyebrow"><span class="paper">Zaratiana et al. 2023</span> · §1 · cost (ours)</p>

## What does generating the answer cost?

<div class="cols">
<div class="text">

- forward pass: about $2P$ FLOPs per token
- 7B: about 14 GFLOP per token
- 0.3B: about 0.6 GFLOP per token
- ratio about 23 per token
- worse: steps wait for each other

</div>
<div class="text">

<p class="q"><b>Q.</b> Sequential steps, UniNER?</p>
<p class="a"><b>A.</b> One turn per type, one step per output token</p>
<p class="q"><b>Q.</b> And GLiNER?</p>
<p class="a"><b>A.</b> One encoder pass for all types</p>

</div>
</div>

<p class="footnote">Our arithmetic. $P$: parameters; each weight does one multiply and one add per token (an embedding lookup does none, so strictly only the other weights count). FLOPs: floating-point operations; GFLOP: a billion of them. The ratio is per token and before UniNER's extra turns per type. Week 6 reuses this rule. The paper never measures speed (see "Faster: is that measured?")</p>

Note:
The paper's three complaints about generation: it is slow, token by token; the models have billions of parameters; and there is no way to predict several entity types in parallel.
A rough count, ours. In a forward pass each weight takes part in one multiply and one add per token, so a model with P parameters costs about 2P floating-point operations per token. A 7B model: about 14 billion per token. A 0.3B model: about 0.6 billion. A ratio of about 23. The bigger difference is sequential steps: UniNER needs one turn per type and one decoder step per output token, each waiting for the one before; GLiNER needs a single encoder pass for every type at once. UniNER also has to read the passage again in every turn unless it caches it, so 23 is per token and understates the gap. Hold on to the fact that the paper argues this but never times it.

---

<p class="eyebrow"><span class="paper">Zaratiana et al. 2023</span> · background · encoders</p>

## Same transformer: what makes it an encoder?

<div class="rows">
<div class="points">
<div class="text">

- same blocks, different attention mask
- decoder: each word sees itself and its left

</div>
<div class="text">

- encoder: every word sees every word
- "McGill" sees "University" only in an encoder

</div>
</div>
<div class="fig"><img src="img/week-05-gliner-masks.svg" alt="Illustration: two 6 by 6 attention masks over Alain Farley works at McGill University; the decoder mask is lower-triangular with 21 of 36 cells allowed, the encoder mask is full with 36 of 36"></div>
</div>

<p class="footnote">Illustration ours: rows attend, columns are seen. The causal mask allows $\frac{6 \cdot 7}{2} = 21$ of 36 pairs; the full mask all 36</p>

Note:
GLiNER's whole argument rests on using an encoder, so let's be precise about what that is for someone who has only worked with decoders. The blocks are the same transformer blocks. What differs is the attention mask: which positions each token may look at.
In a decoder, the causal mask lets each word see itself and the words to its left: 21 of the 36 pairs in our six-word sentence. In an encoder, every word sees every word: all 36. So in an encoder the vector for "McGill" has seen "University"; in a decoder it has not. That one difference will matter for the span representation.

---

<p class="eyebrow"><span class="paper">Zaratiana et al. 2023</span> · background · DeBERTaV3</p>

## How do you train an encoder, if not on the next token?

<div class="cols">
<div class="text">

- masked language modelling (BERT): hide 15%, recover

<div class="eq">$$\max_{\theta} \sum_{i \in \mathcal{C}} \log p_{\theta}(\tilde{x}_i = x_i \mid \tilde{X})$$</div>

- replaced token detection (ELECTRA, DeBERTa-v3): original or replaced, at every position

</div>
<div class="text">

<p class="q"><b>Q.</b> Why not generate with it?</p>
<p class="a"><b>A.</b> Not trained left to right; generating by unmasking needs its own setup</p>
<p class="q"><b>Q.</b> What is it good for?</p>
<p class="a"><b>A.</b> One context-aware vector per token</p>

</div>
</div>

<p class="footnote">He, Gao &amp; Chen 2023 (DeBERTaV3) · arXiv:2111.09543 · §2. $\tilde X$: corrupted input; $\mathcal{C}$: masked positions. Replaced token detection is "a more sample-efficient pre-training task". Masked diffusion language models generate by unmasking (not covered). Q&amp;A ours</p>

Note:
A decoder is pretrained to predict the next token. An encoder can't be, because it sees the next token. Two other objectives. Masked language modelling, BERT's: replace about 15% of the tokens and train the model to recover them from both sides. In our six-word sentence that is about one word per pass, so most positions give no signal. Replaced token detection, ELECTRA's, which DeBERTa-v3 uses: a small generator fills the masked positions with plausible guesses, and the main model labels every position original or replaced. Every token now teaches something.
Why don't we generate text with these? A masked-language-model encoder never learned the left-to-right distribution a decoder samples from; generating by repeated unmasking needs its own training setup, which is what masked diffusion language models do, and we are not covering those. What a plain encoder does well is give one context-aware vector per token, which is exactly what extraction needs.

--

<p class="eyebrow"><span class="paper">Zaratiana et al. 2023</span> · background · the encoders named</p>

## Which encoders appear in this paper?

<table class="rules">
  <tr><td>encoder</td><td>in a few words</td></tr>
  <tr><td>BERT</td><td>the original masked-language-model encoder</td></tr>
  <tr><td>RoBERTa</td><td>BERT trained longer, on more data, larger batches</td></tr>
  <tr><td>ALBERT</td><td>BERT with weights shared across layers</td></tr>
  <tr><td>ELECTRA</td><td>trained by replaced token detection</td></tr>
  <tr><td>DeBERTa-v3</td><td>separate content and relative-position vectors, plus replaced token detection</td></tr>
  <tr><td>mDeBERTa-v3</td><td>multilingual DeBERTa-v3</td></tr>
  <tr><td>XLNet</td><td>a permutation-based language-modelling objective</td></tr>
  <tr><td>XLM-R</td><td>multilingual RoBERTa-style encoder</td></tr>
</table>

<p class="footnote">Glosses ours, from DeBERTaV3 §2 and the cited papers. DeBERTa-v3 is GLiNER's backbone; mDeBERTa-v3 and XLM-R appear in Table 3; the rest in Fig. 4. Relative positions: a cousin of Week 3's rotary embeddings (our link)</p>

Note:
Optional, for reference. These are all the encoders that appear later. BERT is the original masked-language-model encoder from the pre-course reading; RoBERTa is BERT trained longer on more data with bigger batches; ALBERT shares weights across layers to save parameters; ELECTRA introduced replaced token detection; DeBERTa-v3, GLiNER's backbone, combines DeBERTa's attention, with separate vectors for content and relative position, and replaced token detection. The relative-position idea is a cousin of the rotary embeddings from Week 3. mDeBERTa-v3 and XLM-R are multilingual, used in the language experiment; XLNet uses a different, permutation-based objective and fails badly in GLiNER's backbone test.

---

<p class="eyebrow"><span class="paper">Zaratiana et al. 2023</span> · §2 Method · Fig. 2</p>

## What if we never generate anything?

<div class="rows">
<div class="points">
<div class="text">

- one input: type prompts, [SEP], sentence
- encoder reads it all at once

</div>
<div class="text">

- [ENT] vectors ▸ type embeddings; words ▸ span embeddings
- score = sigmoid of a dot product, every pair

</div>
</div>
<div class="fig"><img src="img/week-05-gliner-fig2.png" alt="GLiNER Figure 2: entity type prompts [ENT] Person [ENT] Organization [ENT] Location, then [SEP] and the words Alain Farley works at McGill University numbered 0 to 5, go through a bidirectional transformer; the [ENT] outputs pass an FFN layer to entity type embeddings, the word outputs pass a span representation layer to span embeddings; an entity type by span similarity matrix scores Person at (0,1) 0.9 and Organization at (4,5) 0.8"></div>
</div>

<p class="footnote">Zaratiana et al. 2023 §2, Fig. 2. FFN: a two-layer feedforward network. Matrix values in the figure are illustrative. §1: "matching entity type embeddings to textual span representations in latent space, rather than as a generation task"</p>

Note:
Figure 2 is the whole method; read it from the top. The input is one sequence: [ENT] Person, [ENT] Organization, [ENT] Location, a [SEP] token, then the sentence. A bidirectional transformer reads it all at once. The outputs at the three [ENT] tokens go through a small feedforward network and become three entity type embeddings. The word outputs go through a span layer and become one embedding per candidate span. Then every type is compared with every span by a dot product and a sigmoid: a score table. In the figure Person at span (0,1) scores 0.9 and Organization at (4,5) scores 0.8; those numbers are illustrative.
In the paper's words: matching type embeddings to span representations in a shared space, rather than generation. Panel (b) of Figure 1 is the same thing in one line. After two short detours, the next five slides take the method step by step.

---

<p class="eyebrow"><span class="paper">Zaratiana et al. 2023</span> · §1 · why an encoder</p>

## Why not score a decoder's hidden states?

<div class="cols">
<div class="text">

1. types and text must see each other
2. each word must see its right context
3. nothing generated: no reason for a causal mask

</div>
<div class="text">

<p class="q"><b>Q.</b> Types before the text, in a decoder?</p>
<p class="a"><b>A.</b> Text sees types; types never see text</p>
<p class="q"><b>Q.</b> Why does the right context matter?</p>
<p class="a"><b>A.</b> The end word decides if a name goes on: as the last word of (4,4), "McGill" cannot see "University"</p>

</div>
</div>

<p class="footnote">Our two-step argument. The paper's own reason is briefer (§1): bidirectional processing "enables richer representations". A causal mask makes this harder, not impossible: decoders with token-classification heads exist</p>

Note:
The question this audience should ask: a decoder also outputs a vector per token, so why not put the types and the text into LLaMA and score its hidden states the same way? Two steps.
First, types and text must condition on each other. In a decoder, put the types first and the text sees them, but the type tokens never see the text; put them after and the text never sees the types. Only full attention gives both. Second, each word must see what lies to its right. GLiNER builds a span's vector from its first and last word only. Take the span (4,4), "McGill" alone: its end word has to help decide whether the name stops there or goes on to "University", and a causal mask hides "University" from it. Decoders with token-classification heads exist and can be made to work, so the mask makes this harder rather than impossible. And since nothing is generated, there's no reason to keep the mask at all. The paper itself just says bidirectional context enables richer representations; the two steps are our reading.

---

<p class="eyebrow"><span class="paper">Zaratiana et al. 2023</span> · overview</p>

## What does the paper test?

<table class="rules">
  <tr><td>experiment</td><td>question</td><td>where</td></tr>
  <tr><td>zero-shot out-of-domain benchmark</td><td>beat LLMs on 7 unseen datasets?</td><td>Table 1</td></tr>
  <tr><td>20 NER datasets</td><td>does it hold across domains?</td><td>Table 2</td></tr>
  <tr><td>multilingual</td><td>does English-only training transfer?</td><td>Table 3</td></tr>
  <tr><td>supervised fine-tuning</td><td>with labels, still competitive?</td><td>Table 4</td></tr>
  <tr><td>backbones</td><td>DeBERTa, or the method?</td><td>Fig. 4</td></tr>
  <tr><td>Pile-NER stage vs data size</td><td>how much with few labels?</td><td>Fig. 5</td></tr>
  <tr><td>negative types</td><td>does asking for absent types matter?</td><td>Table 5</td></tr>
  <tr><td>type dropping</td><td>does varying the type count matter?</td><td>Fig. 6</td></tr>
</table>

<p class="footnote">Zaratiana et al. 2023 §4, §5. All zero-shot models are trained on Pile-NER only</p>

Note:
A map before the details. Eight experiments. The headline is the zero-shot out-of-domain benchmark in Table 1, then twenty more datasets in Table 2, then other languages, then fine-tuning with labels, and four ablations: which encoder, how much the Pile-NER training stage helps when labels are few, negative types, and randomly dropping types. First, the method in five steps.

---

<p class="eyebrow"><span class="paper">Zaratiana et al. 2023</span> · §2.1 Architecture · input format</p>

## Step 1: how do you tell an encoder which types to find?

<div class="rows">
<div class="points">
<div class="text">

- write the types into the input
- [ENT] before each type; [SEP] before the text
- both learned, randomly initialised

</div>
<div class="text">

<p class="q"><b>Q.</b> Prompt tokens for our 3 types, at least?</p>
<p class="a"><b>A.</b> $3 \times 2 + 1 = 7$</p>
<p class="q"><b>Q.</b> Cost of more types?</p>
<p class="a"><b>A.</b> A longer input; trained with at most 25</p>

</div>
</div>
<div class="fig"><img src="img/week-05-gliner-input.png" alt="GLiNER's unnumbered input-format figure: [ENT] t0 [ENT] t1 ... [ENT] t_{M-1} [SEP] x0 x2 ... x_{N-1}"></div>
</div>

<p class="footnote">Zaratiana et al. 2023 §2.1, §3.2. $t$: $M$ type names; $x$: $N$ words. The figure prints $x_0\ x_2$, skipping $x_1$ (a typo). No reason is given for the 25-type cap; input length is probably one (ours). GLiREL notes DeBERTa's 512-token input caps the labels</p>

Note:
Step 1. How do you tell an encoder which types to look for? You write them into the input: the M type names in plain language, each after an [ENT] marker, then [SEP], then the N words. Both special tokens are new and learned from a random start. For our sentence, M is 3 and N is 6. (The figure skips x1; a typo.)
Why a marker before each type? A type name can be several subword tokens, "medical condition" is at least two, and the model needs one vector per type. The output at the [ENT] token becomes that type's summary, much as BERT's [CLS] summarises a sentence. Check it: three types cost at least seven prompt tokens, three markers, three one-token names and a [SEP]. Adding types makes the input longer; all are read in one pass, but attention cost grows with length. GLiNER trains with at most 25 types per sentence; the paper gives no reason, and length is probably one.

---

<p class="eyebrow"><span class="paper">Zaratiana et al. 2023</span> · §2.1 · token representation</p>

## Step 2: which encoder outputs does GLiNER keep?

<div class="cols">
<div class="text">

- $\mathbf p \in \mathbb{R}^{M \times D}$: outputs at the [ENT] tokens
- $\mathbf h \in \mathbb{R}^{N \times D}$: one vector per word
- a word = its first subword
- words see the types; types see the words

<p class="q"><b>Q.</b> Shapes for our sentence?</p>
<p class="a"><b>A.</b> $3 \times D$ and $6 \times D$</p>

</div>
<div class="text">

<p class="q"><b>The price</b></p>

- word vectors depend on the types asked
- new types: a new pass over the text
- bi-encoders: precompute types, any number

</div>
</div>

<p class="footnote">Zaratiana et al. 2023 §2.1; $D$: encoder width. First subword: "a standard choice in the NER literature". Bi- and poly-encoders added to the GLiNER library later (GLiREL, Limitations); the multi-task paper argues joint encoding gives better representations</p>

Note:
Step 2. The encoder gives one D-dimensional vector per token. GLiNER keeps two sets: p, the outputs at the M [ENT] tokens, one per type; and h, one vector per word, using the first subword when a word is split. If the tokenizer split "Farley" into "Far" and "ley", h1 would be the output at "Far". That's why span indices count words, not tokens. For our sentence, p is 3 by D and h is 6 by D.
The point of joint encoding: the vector for "McGill" has seen the word "Organization" in the prompt, and the Organization vector has seen "McGill University". The price: since the word vectors depend on which types were asked, you can't encode a corpus once and query new types later; every new type set needs a new pass. Encoding types and text separately, a bi-encoder, avoids that and allows any number of types; GLiREL's authors note such variants were later added to the GLiNER library.

---

<p class="eyebrow"><span class="paper">Zaratiana et al. 2023</span> · §2.1 · Eq. 1</p>

## Step 3: how do you turn a span into one vector?

<div class="cols">
<div class="text">

<div class="eq">$$\mathbf{S}_{ij} = \mathrm{FFN}(\mathbf{h}_i \otimes \mathbf{h}_j) \in \mathbb{R}^{D}$$</div>

- only the first and last word
- $\otimes$: concatenation (not Kronecker)
- FFN: two layers, $2D$ ▸ $D$
- all 21 spans: one batched call

</div>
<div class="text">

<p class="q"><b>Q.</b> Why only the ends?</p>
<p class="a"><b>A.</b> Not ablated, nor against averaging the words inside. Ours: in an encoder the ends already know both sides</p>
<p class="q"><b>Q.</b> Spans in 13 words, $K$ = 12?</p>
<p class="a"><b>A.</b> $91 - 1 = 90$</p>

</div>
</div>

<p class="footnote">Zaratiana et al. 2023 §2.1, Eq. 1. $i \le j$, $j - i + 1 \le 12$. The FFN activation is not stated. 200 words: 2334 spans (ours)</p>

Note:
Step 3. How do you turn a span of several words into one vector? GLiNER's answer is deliberately simple: concatenate the vectors of its first and last word and pass them through a two-layer feedforward network. The circled-times sign is defined in the paper as concatenation, not the Kronecker product, so the input has length 2D and the output length D. All 21 spans of our sentence are one batched call.
Why only the endpoints? The paper doesn't justify or ablate it, and doesn't compare it with averaging the words inside the span. Our reading: this is where the encoder pays off. The vector for "McGill" already knows "University" follows and vice versa, only because attention runs both ways. So the endpoints carry the boundary information that exact-match F1 rewards. Check it: a 13-word sentence has 91 spans, minus the single 13-word one, so 90 with the cap.

---

<p class="eyebrow"><span class="paper">Zaratiana et al. 2023</span> · §2.1 · entity representation</p>

## Step 4: why another network for the types?

<div class="cols">
<div class="text">

<div class="eq">$$\mathbf{q}_t = \mathrm{FFN}(\mathbf{p}_t), \qquad \mathbf{q} \in \mathbb{R}^{M \times D}$$</div>

- goal: types and spans in "a unified latent space"
- two small maps, one per side

</div>
<div class="text">

<p class="q"><b>Q.</b> Why not use $\mathbf p_t$ directly?</p>
<p class="a"><b>A.</b> Ours: the encoder's output space was trained for token-level tasks, not for matching a type with a span</p>
<p class="q"><b>Q.</b> Which FFN sees a concatenation?</p>
<p class="a"><b>A.</b> The span FFN ($2D$ in); the type FFN maps $D$ to $D$</p>

</div>
</div>

<p class="footnote">Zaratiana et al. 2023 §2.1. Not ablated in the paper; the reason in the Q&amp;A is ours</p>

Note:
Step 4. The [ENT] outputs go through another two-layer feedforward network to give the type vectors q. The paper's stated goal is to encode types and spans into a unified latent space. Our reading of why a separate map helps, untested in the paper: the encoder's output space was trained for token-level tasks, such as telling original from replaced tokens or filling in masked words, not to compare a type with a span. Two small learned maps, one for spans and one for types, give the model room to put matching pairs near each other.

---

<p class="eyebrow"><span class="paper">Zaratiana et al. 2023</span> · §2.1 · Eq. 2</p>

## Step 5: how is a span matched to a type?

<div class="cols wide-fig">
<div class="text">

<div class="eq">$$\phi(i, j, t) = \sigma\big(\mathbf{S}_{ij}^{\top} \mathbf{q}_t\big)$$</div>

- toy: $\mathbf q_{\rm person} = (2, 0)$, $\mathbf q_{\rm org} = (0, 2)$
- Alain Farley (1.1, −1.1): 2.2 ▸ 0.90
- McGill University (−1.1, 0.7): 1.4 ▸ 0.80
- all scores: $\sigma(\mathbf S \mathbf q^{\top})$, one product

<p class="q"><b>Q.</b> Orthogonal vectors?</p>
<p class="a"><b>A.</b> $\sigma(0) = 0.5$: on the threshold</p>

</div>
<div class="fig"><img src="img/week-05-gliner-sigmoid.svg" alt="Illustration: the sigmoid curve with three toy points: Alain Farley as person at z = 2.2, score 0.90; McGill University as organization at z = 1.4, score 0.80; works, and Alain Farley as organization, at z = -2.2, score 0.10; a dashed line at the 0.5 threshold"></div>
</div>

<p class="footnote">Zaratiana et al. 2023 §2.1, Eq. 2; $\sigma(z) = 1/(1 + e^{-z})$. Toy vectors, $D$ = 2, ours; they reproduce Fig. 2's 0.9 and 0.8. Our table is spans by types, the transpose of Fig. 2. 200 words, 25 types: 58,350 scores (ours). Later work below (press ↓)</p>

Note:
Step 5. The score that span i to j has type t is the sigmoid of the dot product of the span vector and the type vector. Large and positive when they point the same way. With two dimensions, ours: person is (2, 0) and organization (0, 2). Alain Farley's span vector (1.1, minus 1.1) has dot product 2.2 with person, sigmoid 0.90, and minus 2.2 with organization, 0.10. McGill University, (minus 1.1, 0.7), gets 1.4 with organization, 0.80. "Works" gets minus 2.2 with both. These reproduce the two highlighted cells of Figure 2. Check it: an orthogonal span gets sigmoid of zero, exactly 0.5, on the threshold.
Stack all span vectors as rows of S and all type vectors as rows of q, and every score is one matrix product: 63 scores for our sentence, 58,350 for a 200-word paragraph with 25 types, after a single encoder pass. That is the "parallel extraction" of the abstract.

--

<p class="eyebrow"><span class="paper">Zaratiana et al. 2023</span> · §2.1 · a familiar head</p>

## Isn't a language-model head the same thing?

<div class="cols">
<div class="text">

- decoder head: $\mathbf h^{\top}\mathbf e_v$ for each vocabulary token $v$
- softmax over a fixed vocabulary
- GLiNER: vocabulary built from the prompt
- softmax ▸ one sigmoid per pair

</div>
<div class="text">

<p class="q"><b>Why a sigmoid?</b></p>

1. $M$ changes per input
2. "no entity": 61 of 63 pairs, about 97%
3. "person" independent of "org", on paper

<p class="q"><b>Q.</b> In practice?</p>
<p class="a"><b>A.</b> Joint encoding couples them</p>

</div>
</div>

<p class="footnote">Our bridge and reasons; the paper gives none for the sigmoid. GLiREL, Limitations: "performance on one label can be influenced by the order and number of other provided labels". The paper calls type shuffling and dropping "a form of regularization" (§3.2)</p>

Note:
Optional, but it makes the method click if you know decoders. A decoder's output layer takes the last hidden state, dots it with every vocabulary embedding, and takes a softmax over the fixed vocabulary. GLiNER keeps the dot product and changes the rest: the vocabulary is the M type vectors built from this input's prompt, and the softmax becomes an independent sigmoid for each span-type pair.
Why a sigmoid? The type set is open and its size changes with every input, so there's no fixed list to normalise over. "Not an entity" is the right answer for almost every pair, 61 of our 63, and a softmax would need a null class: its scores must sum to 1, so asking for an absent type would still hand the probability to some type. And on paper the person score doesn't depend on whether organization was asked. The twist: through joint encoding it does, in practice, because the vectors change with the prompt. GLiREL's authors say so for the relation version. That plausibly also explains why shuffling and dropping types helps in training; the paper itself calls it regularization.

--

<p class="eyebrow"><span class="paper">Zaratiana et al. 2023</span> · §2.1 · probability?</p>

## Can the score be read as a probability?

<div class="cols">
<div class="text">

- paper: $\phi$ "can be interpreted as the probability"
- step: BCE is a proper scoring rule
- best expected loss: the true probability

</div>
<div class="text">

<p class="q"><b>Q.</b> So 0.7 means right 70% of the time?</p>
<p class="a"><b>A.</b> Only if the model fits; about 30 negatives per positive, finite data</p>
<p class="q"><b>Q.</b> Tested?</p>
<p class="a"><b>A.</b> No (see the cap and threshold critique)</p>

</div>
</div>

<p class="footnote">Zaratiana et al. 2023 §2.1. BCE: binary cross-entropy, Eq. 3 (next slide). Proper scoring rule: expected loss is minimised by reporting the true probability. The step and caveats are ours</p>

Note:
Optional. The paper says that because training uses binary cross-entropy, phi can be read as the probability the span has that type. The missing step: binary cross-entropy is a proper scoring rule, so its expected value is smallest when the predicted score equals the true probability. A model that fits the training distribution well therefore outputs probability estimates.
Two caveats: that holds only as far as the model fits, and with about 30 negatives per positive and finite data it need not. Whether 0.7 really means right 70% of the time is an empirical question the paper doesn't test.

---

<p class="eyebrow"><span class="paper">Zaratiana et al. 2023</span> · §2.2 Training · Eq. 3</p>

## Training: what does each span-type pair cost?

<div class="cols wide-fig">
<div class="text">

<div class="eq">$$\mathcal{L}_{\rm BCE} = -\sum_{s \in \mathcal{S} \times \mathcal{T}} \mathbb{I}_{s \in \mathcal{P}} \log \phi(s) + \mathbb{I}_{s \in \mathcal{N}} \log\big(1 - \phi(s)\big)$$</div>

- 63 pairs: 2 positive, 61 negative
- positives 0.9, 0.8; negatives 0.1: 6.755
- negatives carry most of it
- a plain sum, no weighting

<p class="q"><b>Q.</b> All 63 pairs at 0.5?</p>
<p class="a"><b>A.</b> $63 \times 0.693 = 43.67$</p>

</div>
<div class="fig"><img src="img/week-05-gliner-bce.svg" alt="Illustration: cost of one pair against its score; a positive pair costs minus log phi, 2.303 at 0.1 and 0.105 at 0.9; a negative pair costs minus log of one minus phi, 0.105 at 0.1"></div>
</div>

<p class="footnote">Zaratiana et al. 2023 §2.2, Eq. 3. $\mathcal{P}$, $\mathcal{N}$: positive and negative pairs; $\mathbb{I}$: 1 if true, else 0. Numbers ours: $0.329 + 61 \times 0.105$. A sum, not a mean: long texts with many types weigh more. Later work below (press ↓)</p>

Note:
How do you train a score table? Every span-type pair is labelled: positive if the training data gives that span that type, negative otherwise. The loss is binary cross-entropy summed over all pairs. A positive costs minus log of its score, zero at 1, large near 0. A negative costs minus log of one minus its score.
Worked numbers, ours. Our sentence has 63 pairs, two positive, 61 negative. Score the positives 0.9 and 0.8 and every negative 0.1: the positives cost 0.329 together, the negatives 61 times 0.105, total 6.755. Most of the loss is negatives, simply because there are 30 of them per positive. Check it: with every pair at 0.5, roughly where a fresh model sits, the loss is 63 times log 2, 43.67. The paper uses a plain sum with no weighting; later work weighted it. And a sum, not a mean, means a long text with many types counts more in a batch.

--

<p class="eyebrow"><span class="paper">Zaratiana et al. 2023</span> · Later work · Stepanov &amp; Shtopko 2024</p>

## GLiNER multi-task: one encoder, many extraction tasks?

<div class="cols">
<div class="text">

- token classification, not spans
- start, end, inside scores per token
- span score: mean inside score
- BCE weighted 0.75 positive, 0.25 negative
- labels written by Llama 3 8B

</div>
<div class="text">

<p class="q"><b>Results</b></p>

- 7 out-of-domain sets: 62.76 F1 (paper's GLiNER-L: 60.9)
- released gliner_large-v2.1: 57.54
- FewRel relations: 87.36 vs Llama-3-8B 44.28

</div>
</div>

<p class="footnote">Stepanov &amp; Shtopko 2024 · arXiv:2406.12925 · §2, §3. FewRel: Wikipedia sentences labelled with one of 80 relation types. Their table's numbers converted to 0 to 100. Different training data (Llama 3 8B labels) and an added BiLSTM, so not a like-for-like gain; FewRel 87.36 is the 440M multitask model. A released checkpoint is not the paper's model; protocols may differ (ours)</p>

Note:
Optional. Knowledgator's multi-task GLiNER keeps the shared encoder but classifies tokens instead of spans: start, end and inside scores per token and type, with a span scored by its average inside score. It answers our loss point directly: its binary cross-entropy weights positives 0.75 and negatives 0.25. Training labels come from Llama 3 8B over Wikipedia, for NER, relations, question answering and more.
On the same seven out-of-domain datasets it reports 62.76, 1.9 above the original paper's GLiNER-L. In the same table the public gliner_large-v2.1 checkpoint scores 57.54, below the paper's 60.9: a reminder that the model you download is not the paper's model. On FewRel relation extraction it reports 87.36 against 44.28 for Llama-3-8B-Instruct.

---

<p class="eyebrow"><span class="paper">Zaratiana et al. 2023</span> · §3.2 · negative types</p>

## Why ask for types that are not there?

<div class="cols">
<div class="text">

- negative spans: free ("Farley works")
- negative types: absent from the text
- Pile-NER lists only present types
- fix: types from other batch examples

</div>
<div class="text">

<p class="q"><b>Q.</b> Never seen an absent type at training. At test?</p>
<p class="a"><b>A.</b> Forces a match for every type asked</p>
<p class="q"><b>Q.</b> Worth?</p>
<p class="a"><b>A.</b> More than 7 F1 (Table 5, Fig. 6)</p>
<p class="q"><b>Q.</b> A sampled type that is present?</p>
<p class="a"><b>A.</b> Not addressed</p>

</div>
</div>

<p class="footnote">Zaratiana et al. 2023 §3.2: "sampling random entities from other examples in the same batch". For a negative type every span is a negative pair, if the type is truly absent; the paper does not say it checks. Frequent types such as person would often be present</p>

Note:
Two kinds of negatives. Negative spans, "Farley works" is not a person, come for free. Negative types are types absent from the passage. Pile-NER only lists the types ChatGPT found in each passage, so in training every asked-for type is present somewhere. A model trained that way learns to find something for every type you ask about; ask for "location" in a sentence with none and you plausibly get a false one.
GLiNER's fix is to add types sampled from other examples in the same batch. For such a type every span is a negative. A sampled type could well be present in this passage (person is among the most frequent types), and the paper does not say it filters such cases. We'll see in the ablations that this single change is worth more than seven F1 points.

---

<p class="eyebrow"><span class="paper">Zaratiana et al. 2023</span> · §2.3 Decoding algorithm</p>

## From a score table to a list of entities?

<div class="cols wide-fig">
<div class="text">

- keep pairs with $\phi \gt 0.5$
- highest first; drop overlaps
- nested: fully inside may stay
- priority queue: $O(n \log n)$

<p class="q"><b>Q.</b> One span above 0.5 for two types?</p>
<p class="a"><b>A.</b> Flat: the higher one only (ours)</p>

</div>
<div class="fig"><img src="img/week-05-gliner-decoding.svg" alt="Illustration: candidates person 0.9 over Alain Farley, organization 0.8 over McGill University and organization 0.6 over University alone; flat decoding keeps the first two and drops University; nested decoding keeps all three because University lies fully inside McGill University"></div>
</div>

<p class="footnote">Zaratiana et al. 2023 §2.3; $n$: candidate spans. Applied "independently to each sentence"; which mode is used for which benchmark is not reported. Long texts must be cut into chunks (512 tokens for GLiNER, per GLiNER2). (5,5) at 0.6 is our hypothetical</p>

Note:
The score table gives probabilities; decoding turns them into a clean list. Keep only pairs above 0.5. Flat mode: take the highest-scoring span, discard anything overlapping it, repeat. Nested mode: the same, but a span fully inside an already chosen one may stay; partial overlaps are still dropped. With a priority queue that's n log n in the number of candidates.
Our example adds a hypothetical third candidate, "University" alone as an organization at 0.6. Flat mode takes Alain Farley, takes McGill University, drops University because it overlaps. Nested mode keeps it, since it lies fully inside McGill University: here a false positive, but for "the Delta variant of SARS-CoV-2" exactly what you want. Two things the paper leaves out: which mode it used for which benchmark, and long documents, which must be cut into chunks, losing entities across a boundary.

---

<p class="eyebrow"><span class="paper">Zaratiana et al. 2023</span> · §3.1 Training data · Fig. 3</p>

## Where do the training labels come from?

<div class="rows">
<div class="points">
<div class="text">

- Pile-NER: 50,000 passages, ChatGPT-labelled
- no type list: ChatGPT picks types
- after filtering: 45,889 passages
- 240,725 entities; 13,020 types

</div>
<div class="text">

- top 1% of types: 74% of mentions
- English only; no human labels
- no negative types
- labels are strings; how they become word spans: not said

</div>
</div>
<div class="fig"><img src="img/week-05-gliner-fig3.png" alt="GLiNER Figure 3: System message: You are a helpful information extraction system. Prompt: Given a passage, your task is to extract all entities and identify their entity types. The output should be in a list of tuples of the following format: [(entity 1, type of entity 1), ...]. Passage: {input_passage}"></div>
</div>

<p class="footnote">Zaratiana et al. 2023 §3.1, Fig. 3; counts from Zhou et al. 2023. The Pile: English text from diverse sources. GLiNER prints "44889 passages", almost certainly a typo for 45,889. Top types: person, organization, location, date, concept...; the tail includes "pokemon"</p>

Note:
GLiNER trains only on Pile-NER, and this is the prompt behind every label. Notice what it doesn't contain: a list of types. ChatGPT decides what counts as an entity and what to call it. That one choice produces both the long tail and the missing negatives.
From 50,000 Pile passages, after filtering, UniNER reports 45,889 passages, 240,725 entities and 13,020 types; GLiNER prints 44,889, almost certainly a typo. The distribution is heavy-tailed: the top 1% of types account for 74% of mentions, led by person, organization, location and date, with a tail down to things like "pokemon". Three things to remember: it's English only, which makes the language result interesting; every label is ChatGPT's judgement; and there are no absent types, hence the negatives. One more gap: ChatGPT returns entity strings, but training needs word positions, and the paper doesn't say how strings become spans or what happens when a string repeats.

---

<p class="eyebrow"><span class="paper">Zaratiana et al. 2023</span> · §3.2 Hyperparameters</p>

## How was it trained, and how cheaply?

<div class="cols">
<div class="text">

<table class="rules">
  <tr><td>setting</td><td>value</td></tr>
  <tr><td>backbone</td><td>DeBERTa-v3 small, base, large</td></tr>
  <tr><td>new layers</td><td>width 768, dropout 0.4</td></tr>
  <tr><td>learning rate</td><td>$10^{-5}$ backbone, $5 \times 10^{-5}$ new</td></tr>
  <tr><td>steps</td><td>at most 30k; 10% warmup; cosine</td></tr>
  <tr><td>types per sentence</td><td>at most 25; shuffled, dropped</td></tr>
  <tr><td>GLiNER-L</td><td>5 hours on one A100</td></tr>
</table>

</div>
<div class="text">

- sizes: S 50M, M 90M, L 0.3B
- not reported: batch size, max length, seeds, how 768-wide heads join a wider backbone

<p class="q"><b>Q.</b> Why two learning rates?</p>
<p class="a"><b>A.</b> Ours: keep the backbone, move the new heads fast (like Week 2)</p>

</div>
</div>

<p class="footnote">Zaratiana et al. 2023 §3.2, Table 1 (sizes). Optimizer AdamW. Shuffling and dropping follow GoLLIE "as a form of regularization". "Pretrained" in the paper means either stage: DeBERTa's own pretraining, or GLiNER's Pile-NER stage</p>

Note:
The training recipe. The two learning rates are not explained in the paper; the reason below is ours. DeBERTa-v3 in three sizes for GLiNER S, M and L: 50M, 90M and 0.3B parameters. The new layers are 768 wide with dropout 0.4. Two learning rates, 1e-5 for the backbone and 5e-5 for the new layers: the backbone is good and easily damaged, the heads start random. Same reasoning as Week 2's frozen base, in a milder form. At most 30k steps with warmup and cosine decay; at most 25 types per sentence, shuffled and randomly dropped so the model can't rely on order or count. GLiNER-L trains in five hours on one A100: a large cost difference against fine-tuning a 7B or 13B LLaMA, though the paper never measures it.
One vocabulary fix: the paper says "pretrained" for two things. Backbone pretraining is DeBERTa's own, done by its authors. The Pile-NER stage is GLiNER's training; it makes the zero-shot model. Not reported: batch size, maximum input length, number of seeds.

---

<p class="eyebrow"><span class="paper">Zaratiana et al. 2023</span> · §3.3 Baselines</p>

## Whose numbers are the baselines?

<div class="cols">
<div class="text">

<table class="rules">
  <tr><td>table</td><td>baselines from</td></tr>
  <tr><td>1</td><td>Zhou; Wang; Sainz</td></tr>
  <tr><td>2</td><td>Zhou</td></tr>
  <tr><td>3</td><td>Malmasi; Lai</td></tr>
  <tr><td>4</td><td>UniNER's re-evaluation (not stated)</td></tr>
</table>

</div>
<div class="text">

- none rerun: five other papers
- InstructUIE: original in 1, re-scored in 4
- same data as GLiNER: UniNER only
- USM: different design; its data not described

</div>
</div>

<p class="footnote">Zaratiana et al. 2023 Tables 1 to 4 captions. Zhou: UniNER; Wang: InstructUIE (and USM); Sainz: GoLLIE; USM: Unified Semantic Matching, Lou et al. 2023; Malmasi: MultiCoNER; Lai: ChatGPT on many languages. UniNER re-scored InstructUIE because its scorer counted a placeholder "none" entity</p>

Note:
Before reading any table: none of the baselines were rerun. Across the four comparison tables the numbers come from five other papers: UniNER's, InstructUIE's, GoLLIE's, the MultiCoNER paper, and a study of ChatGPT on many languages. Table 4's columns match UniNER's supervised table, whose InstructUIE numbers are UniNER's re-evaluation, done because InstructUIE's original scorer counted a placeholder "none" entity in passages with no entities. So InstructUIE appears in its original evaluation in Table 1 and re-scored in Table 4.
The baselines also trained on different things. Only UniNER is stated to share GLiNER's data, so that is the comparison that isolates the architecture. USM, the paper says, has a different architecture of similar size; what it was trained on is not described.

---

<p class="eyebrow"><span class="paper">Zaratiana et al. 2023</span> · §4.1 · Table 1</p>

## Does a 0.3B encoder beat LLMs out of domain?

<table class="rules">
  <tr><td>model</td><td>size</td><td class="num">Movie</td><td class="num">Restaurant</td><td class="num">AI</td><td class="num">Literature</td><td class="num">Music</td><td class="num">Politics</td><td class="num">Science</td><td class="num">Avg</td></tr>
  <tr><td>Vicuna-13B</td><td>13B</td><td class="num">0.9</td><td class="num">0.4</td><td class="num">22.7</td><td class="num">22.7</td><td class="num">26.6</td><td class="num">27.0</td><td class="num">22.0</td><td class="num">17.5</td></tr>
  <tr><td>USM</td><td>0.3B</td><td class="num">37.7</td><td class="num">17.7</td><td class="num">28.2</td><td class="num">56.0</td><td class="num">44.9</td><td class="num">36.1</td><td class="num">44.0</td><td class="num">37.8</td></tr>
  <tr><td>ChatGPT</td><td></td><td class="num">5.3</td><td class="num">32.8</td><td class="num">52.4</td><td class="num">39.8</td><td class="num">66.6</td><td class="num">68.5</td><td class="num"><b>67.0</b></td><td class="num">47.5</td></tr>
  <tr><td>InstructUIE</td><td>11B</td><td class="num"><b>63.0</b></td><td class="num">21.0</td><td class="num">49.0</td><td class="num">47.2</td><td class="num">53.2</td><td class="num">48.1</td><td class="num">49.2</td><td class="num">47.2</td></tr>
  <tr><td>UniNER-7B</td><td>7B</td><td class="num">42.4</td><td class="num">31.7</td><td class="num">53.6</td><td class="num">59.3</td><td class="num">67.0</td><td class="num">60.9</td><td class="num">61.1</td><td class="num">53.7</td></tr>
  <tr><td>UniNER-13B</td><td>13B</td><td class="num">48.7</td><td class="num">36.2</td><td class="num">54.2</td><td class="num">60.9</td><td class="num">64.5</td><td class="num">61.4</td><td class="num">63.5</td><td class="num">55.6</td></tr>
  <tr><td>GoLLIE</td><td>7B</td><td class="num"><b>63.0</b></td><td class="num"><b>43.4</b></td><td class="num"><b>59.1</b></td><td class="num">62.7</td><td class="num">67.8</td><td class="num">57.2</td><td class="num">55.5</td><td class="num">58.0</td></tr>
  <tr><td>GLiNER-S</td><td>50M</td><td class="num">46.9</td><td class="num">33.3</td><td class="num">50.7</td><td class="num">60.0</td><td class="num">60.9</td><td class="num">61.5</td><td class="num">55.6</td><td class="num">52.7</td></tr>
  <tr><td>GLiNER-M</td><td>90M</td><td class="num">42.9</td><td class="num">37.3</td><td class="num">51.8</td><td class="num">59.7</td><td class="num">69.4</td><td class="num">68.6</td><td class="num">58.1</td><td class="num">55.4</td></tr>
  <tr><td>GLiNER-L</td><td>0.3B</td><td class="num">57.2</td><td class="num">42.9</td><td class="num">57.2</td><td class="num"><b>64.4</b></td><td class="num"><b>69.6</b></td><td class="num"><b>72.6</b></td><td class="num">62.6</td><td class="num"><b>60.9</b></td></tr>
</table>

<p class="footnote">Zaratiana et al. 2023 Table 1, zero-shot F1, bold as in the paper (Vicuna-7B, average 13.0, omitted). Movie, Restaurant: MIT query datasets; AI to Science: CrossNER, Wikipedia-style text with 8 to 16 domain types each. Avg: as printed (GoLLIE's is not its cell mean). USM: Unified Semantic Matching (Lou et al. 2023)</p>

Note:
The headline. Train on Pile-NER only, then test with no fine-tuning on the standard out-of-domain benchmark: MIT Movie and MIT Restaurant, short movie and restaurant queries, and five CrossNER domains, Wikipedia-style text with domain-specific types. Read the rows that share training data first: UniNER-7B 53.7, UniNER-13B 55.6, GLiNER-L 60.9. Then the rest: ChatGPT 47.5, InstructUIE 47.2, GoLLIE 58.0.
Look past the average, though. GLiNER-L wins only three of the seven domains, literature, music and politics. GoLLIE wins restaurant and AI and ties InstructUIE on movie; ChatGPT wins science. Its lead comes from being consistently good, not from winning everywhere. And ChatGPT's 5.3 on Movie against 67.0 on Science is a reminder of what exact match does to a prompted model facing a dataset's own conventions: MIT Movie's twelve types are specific to that dataset.

---

<p class="eyebrow"><span class="paper">Zaratiana et al. 2023</span> · §4.1 · what Table 1 shows</p>

## What does Table 1 show, and not show?

<div class="cols">
<div class="text">

<p class="q"><b>Claims, checked</b></p>

- S (50M) above ChatGPT, InstructUIE: 52.7 vs 47.5, 47.2
- M "140 times smaller", "55 for both": 144; 55.4 vs 55.6
- L over UniNER-13B "by 5": 5.3
- same data: +5.3 (13B), +7.2 (7B)
- USM 37.8: "superiority of our architecture"?

</div>
<div class="text">

<p class="q"><b>Not shown</b></p>

- speed: not measured
- truly new types: unchecked
- noise: one run, no error bars
- baselines from three papers
- UniNER-7B row: 4 cells differ from UniNER's own
- GoLLIE: 58.0 printed, cells mean 58.4

</div>
</div>

<p class="footnote">Zaratiana et al. 2023 §4.1; checks ours. USM's training data is not described in the paper (see the USM critique). UniNER's own table: music 65.0 (here 67.0), average 53.4 (here 53.7)</p>

Note:
The claims check out on the table. The 50M model beats ChatGPT and InstructUIE on average. The 90M model is "140 times smaller" than UniNER-13B, 13 billion over 90 million is 144, with 55.4 against 55.6. GLiNER-L beats UniNER-13B by 5.3, and UniNER-7B, which shares the training data too, by 7.2. One claim doesn't follow: USM is of similar size and scores 37.8, which the paper reads as "the superiority of our architecture", but the paper says nothing about what USM was trained on, so the gap may mix architecture with data.
What it doesn't show: speed, never measured; recognition of truly new types; whether the gaps are outside run-to-run noise, with one run and no error bars. And the baseline numbers are copied: GLiNER's UniNER-7B row differs from UniNER's own table in four cells, music by 2 points, and GoLLIE's printed 58.0 isn't the mean of its cells, 58.4. None of that changes who wins.

---

<p class="eyebrow"><span class="paper">Zaratiana et al. 2023</span> · §4.1 · Table 2</p>

## Does it hold on 20 datasets from other domains?

<div class="cols">
<div class="text">

<table class="rules">
  <tr><td>dataset</td><td class="num">ChatGPT</td><td class="num">UniNER-7B</td><td class="num">GLiNER-L</td></tr>
  <tr><td>ACE05</td><td class="num">26.6</td><td class="num"><b>36.9</b></td><td class="num">27.3</td></tr>
  <tr><td>AnatEM</td><td class="num">30.7</td><td class="num">25.1</td><td class="num"><b>33.3</b></td></tr>
  <tr><td>bc2gm</td><td class="num">40.2</td><td class="num">46.2</td><td class="num"><b>47.9</b></td></tr>
  <tr><td>bc4chemd</td><td class="num">35.5</td><td class="num"><b>47.9</b></td><td class="num">43.1</td></tr>
  <tr><td>bc5cdr</td><td class="num">52.4</td><td class="num"><b>68.0</b></td><td class="num">66.4</td></tr>
  <tr><td>Broad Tweeter</td><td class="num">61.8</td><td class="num"><b>67.9</b></td><td class="num">61.2</td></tr>
  <tr><td>CoNLL03</td><td class="num">52.5</td><td class="num"><b>72.2</b></td><td class="num">64.6</td></tr>
  <tr><td>FabNER</td><td class="num">15.3</td><td class="num"><b>24.8</b></td><td class="num">23.6</td></tr>
  <tr><td>FindVehicle</td><td class="num">10.5</td><td class="num">22.2</td><td class="num"><b>41.9</b></td></tr>
  <tr><td>GENIA</td><td class="num">41.6</td><td class="num">54.1</td><td class="num"><b>55.5</b></td></tr>
  <tr><td>HarveyNER</td><td class="num">11.6</td><td class="num">18.2</td><td class="num"><b>22.7</b></td></tr>
</table>

</div>
<div class="text">

<table class="rules">
  <tr><td>dataset</td><td class="num">ChatGPT</td><td class="num">UniNER-7B</td><td class="num">GLiNER-L</td></tr>
  <tr><td>MIT Movie</td><td class="num">5.3</td><td class="num">42.4</td><td class="num"><b>57.2</b></td></tr>
  <tr><td>MIT Restaurant</td><td class="num">32.8</td><td class="num">31.7</td><td class="num"><b>42.9</b></td></tr>
  <tr><td>MultiNERD</td><td class="num">58.1</td><td class="num">59.3</td><td class="num"><b>59.7</b></td></tr>
  <tr><td>ncbi</td><td class="num">42.1</td><td class="num">60.4</td><td class="num"><b>61.9</b></td></tr>
  <tr><td>OntoNotes</td><td class="num">29.7</td><td class="num">27.8</td><td class="num"><b>32.2</b></td></tr>
  <tr><td>PolyglotNER</td><td class="num">33.6</td><td class="num">41.8</td><td class="num"><b>42.9</b></td></tr>
  <tr><td>TweetNER7</td><td class="num">40.1</td><td class="num"><b>42.7</b></td><td class="num">41.4</td></tr>
  <tr><td>WikiANN</td><td class="num">52.0</td><td class="num">55.4</td><td class="num"><b>58.9</b></td></tr>
  <tr><td>WikiNeural</td><td class="num">57.7</td><td class="num">69.2</td><td class="num"><b>71.8</b></td></tr>
  <tr><td>Average</td><td class="num">36.5</td><td class="num">45.7</td><td class="num"><b>47.8</b></td></tr>
</table>

</div>
</div>

<p class="footnote">Zaratiana et al. 2023 Table 2, zero-shot F1, bold as in the paper. MIT Movie and Restaurant repeat Table 1. Groups ours (UniNER calls the news and Wikipedia sets "General"). News: ACE05, CoNLL03, OntoNotes. Wikipedia: MultiNERD, PolyglotNER, WikiANN, WikiNeural. Biomedical: AnatEM, bc2gm, bc4chemd, bc5cdr, GENIA, ncbi. Tweets: Broad Tweeter, HarveyNER, TweetNER7. FabNER: manufacturing; FindVehicle: vehicles. Later work below (press ↓)</p>

Note:
Twenty datasets from UniNER's benchmark, all zero-shot, and only ChatGPT and UniNER-7B to compare with; two of them, MIT Movie and MIT Restaurant, are also in Table 1, so 18 are new. They span news, Wikipedia, biomedical text (anatomy, genes, chemicals, diseases), tweets, manufacturing and vehicle descriptions; the grouping is ours, and UniNER itself calls the news and Wikipedia sets "General".
The paper says GLiNER is best on 13 of 20 and 2 points ahead of UniNER on average; both right, 47.8 against 45.7. It also says GLiNER underperforms on tweet-based datasets. Look at what UniNER actually wins: ACE05 by 9.6, the largest gap, CoNLL03 by 7.6, Broad Tweeter by 6.7, bc4chemd, bc5cdr, TweetNER7 and FabNER. So two news sets, two chemistry and disease sets, manufacturing, and two of three tweet sets; GLiNER wins the third, HarveyNER. On Broad Tweeter even ChatGPT is slightly ahead. Closest to biomedical text, bc5cdr and ncbi, GLiNER-L scores 66.4 and 61.9: F1 in the low to mid sixties even on standard disease and chemical names.

--

<p class="eyebrow"><span class="paper">Zaratiana et al. 2023</span> · Table 2 · where the lead comes from</p>

## Where does the 2.1-point lead come from?

<div class="cols">
<div class="text">

- FindVehicle +19.7
- MIT Movie +14.8
- MIT Restaurant +11.2
- the two MIT sets: also in Table 1

</div>
<div class="text">

<p class="q"><b>Q.</b> Drop the two MIT sets?</p>
<p class="a"><b>A.</b> 18 datasets: 47.6 vs 46.7, a lead of 0.9</p>
<p class="q"><b>Q.</b> And FindVehicle too?</p>
<p class="a"><b>A.</b> 17 datasets: UniNER-7B ahead, about 48.1 vs 47.9 (ours)</p>
<p class="q"><b>Q.</b> Why 7 points in Table 1, 2 here?</p>
<p class="a"><b>A.</b> Harder, more varied sets; standard news types suit UniNER? (ours, speculative)</p>

</div>
</div>

<p class="footnote">Our arithmetic on Zaratiana et al. 2023 Table 2. MIT Movie and MIT Restaurant have identical numbers in Tables 1 and 2, so the two benchmarks are not independent</p>

Note:
Optional, our arithmetic. GLiNER's 2.1-point lead is concentrated in three datasets: FindVehicle, plus 19.7, MIT Movie, plus 14.8, and MIT Restaurant, plus 11.2. The two MIT sets are also in Table 1, with identical numbers, so the two benchmarks aren't independent evidence. Drop them and the 18-dataset averages are 47.6 against 46.7: a lead of 0.9. Drop FindVehicle as well and, from the printed cells, UniNER-7B is ahead on the remaining 17, about 48.1 against 47.9: the whole lead rests on three datasets. That's small enough to matter for the one-run question in the critiques.
Why does the gap shrink from 7 points to 2? The twenty datasets are harder and more varied, averages in the forties. One possible reason, ours and speculative: they include standard news types like CoNLL03's and ACE05's, which a large generative model handles well.

---

<p class="eyebrow"><span class="paper">Zaratiana et al. 2023</span> · §4.2 · Table 3</p>

## Does English-only training transfer to other languages?

<div class="cols wide-text">
<div class="text">

<table class="rules">
  <tr><td>language</td><td class="num">Sup.</td><td class="num">ChatGPT</td><td class="num">GLiNER En</td><td class="num">GLiNER Multi</td></tr>
  <tr><td>German</td><td class="num">64.6</td><td class="num">37.1</td><td class="num">35.6</td><td class="num"><b>39.5</b></td></tr>
  <tr><td>English</td><td class="num">62.7</td><td class="num">37.2</td><td class="num"><b>42.4</b></td><td class="num">41.7</td></tr>
  <tr><td>Spanish</td><td class="num">58.7</td><td class="num">34.7</td><td class="num">38.7</td><td class="num"><b>42.1</b></td></tr>
  <tr><td>Dutch</td><td class="num">62.6</td><td class="num">35.7</td><td class="num">35.6</td><td class="num"><b>38.9</b></td></tr>
  <tr><td>Bengali</td><td class="num">39.7</td><td class="num">23.3</td><td class="num">0.89</td><td class="num"><b>25.9</b></td></tr>
  <tr><td>Persian</td><td class="num">52.3</td><td class="num">25.9</td><td class="num">14.9</td><td class="num"><b>30.2</b></td></tr>
  <tr><td>Hindi</td><td class="num">47.8</td><td class="num">27.3</td><td class="num">11.3</td><td class="num"><b>27.8</b></td></tr>
  <tr><td>Korean</td><td class="num">55.8</td><td class="num"><b>30.0</b></td><td class="num">20.5</td><td class="num">28.7</td></tr>
  <tr><td>Russian</td><td class="num">59.7</td><td class="num">27.4</td><td class="num">30.3</td><td class="num"><b>33.3</b></td></tr>
  <tr><td>Turkish</td><td class="num">46.8</td><td class="num"><b>31.9</b></td><td class="num">22.0</td><td class="num">30.0</td></tr>
  <tr><td>Chinese</td><td class="num">53.1</td><td class="num">18.8</td><td class="num">6.59</td><td class="num"><b>24.3</b></td></tr>
  <tr><td>Average</td><td class="num">54.9</td><td class="num">29.9</td><td class="num">23.6</td><td class="num"><b>32.9</b></td></tr>
</table>

</div>
<div class="text">

- Multi beats ChatGPT: 8 of 10 new languages
- Multi: Spanish 42.1 above English 41.7
- En, non-Latin: 15.2 vs ChatGPT 26.4
- En above ChatGPT on Russian, not German

<p class="q"><b>Q.</b> Why does Multi work at all?</p>
<p class="a"><b>A.</b> Ours: the backbone carries the languages</p>

</div>
</div>

<p class="footnote">Zaratiana et al. 2023 Table 3, zero-shot F1 on MultiCoNER (NER in 11 languages), bold as in the paper. Sup.: XLM-R trained on each language. En: DeBERTa-v3-large; Multi: mDeBERTa-v3-base; both trained only on English Pile-NER. Non-Latin means ours. Type-name language not stated</p>

Note:
Pile-NER is English only. On MultiCoNER, eleven languages, zero-shot, two versions: En with the English DeBERTa-v3-large, Multi with the multilingual mDeBERTa-v3-base. "Sup." is XLM-R trained on each language's own data: an upper reference, not a competitor.
GLiNER-Multi beats ChatGPT on 8 of the 10 languages it never saw, losing Korean and Turkish, as the introduction says. Oddly, Multi does slightly better on Spanish than on English. GLiNER-En collapses on non-Latin scripts, Bengali 0.89, Chinese 6.59; its non-Latin average is 15.2 against ChatGPT's 26.4. Two text slips: Russian is a non-Latin exception the paper doesn't mention, and on German, which it calls competitive or superior, En is below ChatGPT. Our explanation of why Multi works at all: the multilingual backbone places "Universidad de Madrid" near "university", and the English-trained head just matches spans to type names. The paper doesn't say whether the type names were given in English.

---

<p class="eyebrow"><span class="paper">Zaratiana et al. 2023</span> · §4.3 · Table 4</p>

## With labels, is the encoder still competitive?

<div class="cols">
<div class="text">

<table class="rules">
  <tr><td>dataset</td><td class="num">InstructUIE<br>w/o</td><td class="num">UniNER-7B<br>w/</td><td class="num">GLiNER-L<br>w/</td><td class="num">GLiNER-L<br>w/o</td></tr>
  <tr><td>ACE05</td><td class="num">79.9</td><td class="num"><b>86.7</b></td><td class="num">82.8</td><td class="num">81.3</td></tr>
  <tr><td>HarveyNER</td><td class="num"><b>74.7</b></td><td class="num">74.2</td><td class="num">68.6</td><td class="num">67.4</td></tr>
  <tr><td>TweetNER7</td><td class="num"><b>65.9</b></td><td class="num">65.8</td><td class="num">51.4</td><td class="num">50.3</td></tr>
  <tr><td>WikiANN</td><td class="num">64.5</td><td class="num"><b>84.9</b></td><td class="num">83.7</td><td class="num">82.8</td></tr>
  <tr><td>Average (20)</td><td class="num">81.2</td><td class="num"><b>84.8</b></td><td class="num">82.9</td><td class="num">82.1</td></tr>
</table>

</div>
<div class="text">

- w/, w/o: with, without the Pile-NER stage; gap 0.8 ✓
- "0.9" over InstructUIE: 1.7 for w/
- "almost 3" behind UniNER: 1.9 for w/
- "30 times" larger: 36.7
- "7 of 20" bests: 6 w/, 1 w/o

<p class="q"><b>Q.</b> What changed?</p>
<p class="a"><b>A.</b> Two numbers use w/o, name w/</p>

</div>
</div>

<p class="footnote">Zaratiana et al. 2023 Table 4 (4 of 20 rows, bold as in the paper; rows chosen by us, all four losses for GLiNER-L, TweetNER7 the biggest; the full table is in the paper), §4.3. w/: with the Pile-NER stage before fine-tuning. Up to 10,000 examples per dataset, as InstructUIE. Text says "Table 3"; it is Table 4. Pretrained beats w/o on 17 of 20</p>

Note:
Why run this at all? It separates two questions: with labels, is the architecture a good learner, and does the Pile-NER stage still help? Everyone fine-tunes on the training sets of the same 20 datasets, up to 10,000 examples each. GLiNER-L comes in two versions: w/, starting from the Pile-NER model, and w/o, starting from plain DeBERTa.
This is where text and table disagree most. The 0.8 gain from the Pile-NER stage is right. But the paper says the pretrained model beats InstructUIE by 0.9 and trails UniNER by almost 3: like for like it's 1.7 ahead and 1.9 behind. Both of the paper's numbers come from the w/o column while naming the w/ one. "About 30 times" smaller is 36.7, and "best on 7 of 20" holds only if you count both GLiNER columns, six for the pretrained one and one for the other. So with labels, a 7B generative model fits these datasets about 2 points better than a 0.3B encoder, with the biggest loss on TweetNER7, 14.4 points.

---

<p class="eyebrow"><span class="paper">Zaratiana et al. 2023</span> · §5.1 · Fig. 4</p>

## Is it DeBERTa, or the method?

<div class="cols wide-fig">
<div class="text">

- GLiNER-M with 5 backbones, base size
- DeBERTa-v3: 55.4 OOD, 45.0 on 20
- lead: 3.0 OOD (ALBERT), about 1.0 on 20 (ELECTRA)
- other four: 49.4 to 52.4 OOD, over ChatGPT's 47.5
- but under UniNER-7B's 53.7

<p class="q"><b>Q.</b> What does the most work?</p>
<p class="a"><b>A.</b> Vs ChatGPT, the method: all beat 47.5. Vs UniNER, same data, the backbone: only DeBERTa-v3 passes 53.7</p>

</div>
<div class="fig"><img src="img/week-05-gliner-fig4.png" alt="GLiNER Figure 4: average zero-shot F1 on the out-of-domain benchmark against the 20-dataset average for five backbones; DeBERTa top right near 55.4 and 45.0, ELECTRA near 51.4 and 44.0, ALBERT near 52.4 and 42.5, BERT and RoBERTa bottom left near 49.4 to 49.5 and 42.1 to 42.3"></div>
</div>

<p class="footnote">Zaratiana et al. 2023 §5.1, Fig. 4. OOD: out-of-domain benchmark (Table 1). Values read off the figure (ours, about ±0.1). Learning rate tuned per backbone. ALBERT and ELECTRA swap ranks between the two axes. XLNet: "at most 3 F1" OOD despite extensive tuning</p>

Note:
Is the result about DeBERTa specifically? They rebuild GLiNER-M on five base-size backbones and tune the learning rate for each. Up and to the right is better on both benchmarks. DeBERTa-v3 sits alone in the top right: 55.4 out of domain, its Table 1 score, and about 45 on the twenty datasets. Its margin is 3 points out of domain but only about 1 on the twenty, so "a clear margin", the paper's words, fits one axis better than the other. ALBERT and ELECTRA swap places between the two.
The more important point: even BERT-base, the weakest, gets about 49 out of domain, above ChatGPT's 47.5. So the method plus Pile-NER is enough to pass ChatGPT with any backbone, but passing UniNER, which shares the data, needed DeBERTa-v3 at this size: BERT, RoBERTa, ELECTRA and ALBERT score 49.4 to 52.4, below UniNER-7B's 53.7, and the spread across backbones, 6.0 points, is larger than GLiNER-L's whole lead over UniNER-13B, 5.3. One unexplained failure: XLNet, which uses a different pretraining objective, reached at most 3 F1 despite extensive tuning.

---

<p class="eyebrow"><span class="paper">Zaratiana et al. 2023</span> · §5.2 · Fig. 5</p>

## How much does the Pile-NER stage help with few labels?

<div class="cols wide-fig">
<div class="text">

- gap: 5.6 at 100 per dataset ▸ 0.6 at 10,000
- 100 per dataset, w/: about 72.6
- zero-shot: 47.8 (Table 2)
- 2,000 labels: about 25 points

<p class="q"><b>Q.</b> All new skill?</p>
<p class="a"><b>A.</b> Ours: not all; the model also learns each dataset's annotation rules</p>

</div>
<div class="fig"><img src="img/week-05-gliner-fig5.png" alt="GLiNER Figure 5: average F1 on the 20 datasets against supervised examples per dataset, 100 to 10000, with and without Pile-NER pretraining; the gap is 5.6 at 100, 1.6 at 500, 1.3 at 1000, 1.2 at 5000 and 0.6 at 10000"></div>
</div>

<p class="footnote">Zaratiana et al. 2023 §5.2, Fig. 5; bar heights read off the figure (ours). $100 \times 20 = 2{,}000$; $72.6 - 47.8 = 24.8$ (ours). At 10,000, the "full training setup", Table 4's gap is 0.8: the bar without Pile-NER (about 82.3) does not match Table 4's 82.1</p>

Note:
The supervised setting again, at five sizes from 100 to 10,000 examples per dataset, with and without the Pile-NER stage. The stage always helps, and most when labels are scarce: 5.6 points at 100 examples, shrinking to 0.6 at 10,000.
The most practical number in the paper, our arithmetic: with the Pile-NER stage, 100 labelled examples per dataset bring the average to about 72.6, against 47.8 zero-shot. About 2,000 labels buy roughly 25 points. Caveat: the fine-tuned model also learns each dataset's annotation conventions, what counts as an entity, where boundaries go, so part of that is learning the rules of the test. And a contradiction: at 10,000, which the text calls the full setup, Table 4 gives a gap of 0.8 but the figure prints 0.6; the bar without Pile-NER doesn't match the table. One of them is a different run, or they weren't reconciled.

---

<p class="eyebrow"><span class="paper">Zaratiana et al. 2023</span> · §5.3 Ablations · Table 5</p>

## What do absent types do to precision and recall?

<div class="cols">
<div class="text">

<table class="rules">
  <tr><td>negative types</td><td class="num">precision</td><td class="num">recall</td><td class="num">F1</td></tr>
  <tr><td>0%</td><td class="num">49.3</td><td class="num">58.1</td><td class="num">53.3</td></tr>
  <tr><td>50%</td><td class="num"><b>62.3</b></td><td class="num"><b>59.7</b></td><td class="num"><b>60.9</b></td></tr>
  <tr><td>75%</td><td class="num">61.1</td><td class="num">56.5</td><td class="num">58.6</td></tr>
</table>

<p class="q"><b>Reading it</b></p>

- 0%: half the predictions wrong
- 75%: cautious, misses more
- UniNER: 31.5 ▸ 53.4

</div>
<div class="text">

<p class="q"><b>Q.</b> 50% of what?</p>
<p class="a"><b>A.</b> Not defined: share of the type list, or chance of adding negatives</p>
<p class="q"><b>Q.</b> Which model, which benchmark?</p>
<p class="a"><b>A.</b> Not named; 60.9 = GLiNER-L on Table 1 (inferred)</p>

</div>
</div>

<p class="footnote">Zaratiana et al. 2023 §5.3, Table 5. Precision: share of predictions that are right; recall: share of gold entities found. "Higher recall" at 0% holds against 75% only (58.1 vs 59.7 at 50%). UniNER: Zhou et al. 2023, out-of-domain average, no negatives vs frequency-based</p>

Note:
The absent-type problem, measured. Training with no negative types gives precision 49.3: half the predictions are wrong, the model finds something for every type asked. With 75% negatives it becomes cautious and recall falls to 56.5. 50% is best on both. The paper says the all-positive model has "higher recall"; that's true against 75% but not against 50%.
Two things the paper leaves out. What "50% negative types" means: half of each prompt's types absent, or negatives added half the time? And which model and benchmark: the 60.9 matches GLiNER-L's Table 1 average, so very likely that. UniNER's own ablation agrees and is even stronger, 31.5 without negatives to 53.4 with. Negative types are not a detail; they're 7 to 22 F1 points.

---

<p class="eyebrow"><span class="paper">Zaratiana et al. 2023</span> · §5.3 · Fig. 6</p>

## Does dropping types during training matter?

<div class="cols wide-fig">
<div class="text">

- drop, with negatives: $60.9 - 59.5 = 1.4$
- drop, without: $53.3 - 52.3 = 1.0$
- text: "over 1.4"; mean 1.2
- negatives: 7.6 and 7.2

<p class="q"><b>Q.</b> Is 1 point real?</p>
<p class="a"><b>A.</b> One run each: unknown</p>

</div>
<div class="fig"><img src="img/week-05-gliner-fig6.png" alt="GLiNER Figure 6: average F1 bars: Full 60.90, without type dropping 59.50, without negatives 53.30, without both 52.30"></div>
</div>

<p class="footnote">Zaratiana et al. 2023 §5.3, Fig. 6 (the text calls it "Figure 5"). Dropping: randomly varying the number of types per training example. Differences ours</p>

Note:
Randomly varying how many types each training example shows, with and without negatives. Compare Full with "w/o drop" for the effect of dropping with negatives: 1.4. Compare "w/o Neg" with "w/o both" for the effect without: 1.0. The text says "an average improvement of over 1.4 points"; the average is 1.2 and nothing is over 1.4. It also calls this Figure 5; it's Figure 6.
Negatives are the big lever, about 7 points either way; dropping is a small one, about 1, and the two add almost independently. Whether 1 point is outside the noise of one run, we can't tell.

---

<p class="eyebrow"><span class="paper">Zaratiana et al. 2023</span> · what it establishes</p>

## What does the paper establish?

<table class="rules">
  <tr><td>claim</td><td>evidence</td><td>trust</td></tr>
  <tr><td>span matching beats generation on the same data</td><td>Table 1: +7.2 (7B), +5.3 (13B); Table 2: +2.1</td><td>good on Table 1; needs DeBERTa-v3 at base size (Fig. 4); weak on Table 2</td></tr>
  <tr><td>beats ChatGPT and other LLMs zero-shot</td><td>Tables 1, 2 (exact match; ChatGPT prompted by others)</td><td>good on average, not everywhere</td></tr>
  <tr><td>cheaper and faster</td><td>sizes; 5 GPU-hours</td><td>plausible, not measured</td></tr>
  <tr><td>transfers to other languages</td><td>Table 3</td><td>moderate: one benchmark</td></tr>
  <tr><td>competitive with labels</td><td>Table 4</td><td>1.9 behind UniNER-7B</td></tr>
  <tr><td>negatives matter; dropping a little</td><td>Table 5, Fig. 6</td><td>good; weak for dropping</td></tr>
</table>

<p class="footnote">Our assessment of Zaratiana et al. 2023 §4 to §5. Table 2's lead is 0.9 without the two MIT sets it shares with Table 1. Later work (GLiREL, multi-task, GLiNER2) extends the idea but does not re-test these claims

Note:
Putting the experiments together at three levels of trust. The core claim, that a span-matching encoder beats a generative model trained on the same data, is solid on Table 1, a large margin with shared data, and weak on Table 2, 2.1 points and 0.9 without the overlap. The core claim also depends on the backbone: with BERT, RoBERTa, ELECTRA or ALBERT at base size, GLiNER-M falls below UniNER-7B. Beating ChatGPT holds on average, with any backbone. Cheaper and faster is plausible from sizes and the five-hour training run, but never measured. Language transfer rests on one benchmark. With labels it's 1.9 behind UniNER-7B. And the negative types result is large and matches UniNER's; type dropping is small and single-run.

---

<p class="eyebrow"><span class="paper">Zaratiana et al. 2023</span> · assessment</p>

## Why is this a strong paper?

<div class="cols">
<div class="text">

- a clean comparison: same data as UniNER
- cheap to rerun: code, public data, 5 GPU-hours
- ablations on the right levers
- two equations and a greedy decoder

</div>
<div class="text">

<p class="q"><b>Q.</b> What is the real lesson?</p>
<p class="a"><b>A.</b> Ours: on this task, much of the gain came from the data and the output format, not from generating</p>
<p class="q"><b>Q.</b> Evidence it was built on?</p>
<p class="a"><b>A.</b> Extended by GLiREL, multi-task, GLiNER2; one released checkpoint scored 3.4 lower</p>

</div>
</div>

<p class="footnote">Our assessment. Descendants named in GLiNER2 §1: GLiREL, GLiClass, GLiNER-BioMed, OpenBioNER, GLiDRE (only GLiREL read here). Extensions, not reruns; the 3.4 is 60.9 minus 57.54 (multi-task paper), and a different protocol is possible. Later work below (press ↓)</p>

Note:
Before the critiques, the strengths, in fairness. The core comparison is clean: GLiNER and UniNER share training data, so Table 1 isolates the architecture, generation against span matching, better than most "small model beats LLM" claims, which change data and model together. It's cheap and reproducible: released code, public data, five hours on one GPU, and its many descendants show people built on it, though extensions are not reruns: the one released checkpoint we saw, 57.54 against the paper's 60.9, scored lower, which a different protocol could explain. The ablations target the questions a practitioner would ask. And the method fits in your head: two equations and a greedy decoder. The simplicity is itself a result, in our reading: on this task, much of the gain came from the data and the output format, not from the generation.

--

<p class="eyebrow"><span class="paper">Zaratiana et al. 2023</span> · Later work · Zaratiana et al. 2025</p>

## GLiNER2: from entities to schemas?

<div class="cols">
<div class="text">

- one encoder: NER, classification, records
- special tokens [P] [E] [C] [L], a schema
- records: predict count 0 to 19, then fields
- 205M parameters, 2048-token context
- 254,334 GPT-4o-labelled examples

</div>
<div class="text">

<p class="q"><b>Does the idea scale? CrossNER, 5 domains</b></p>

- GLiNER2 59.0; GPT-4o 59.9
- GLiNER-M 61.5; GLiNER-L not compared
- "higher in AI (0.526 vs. 0.547)": lower
- records: not evaluated

</div>
</div>

<p class="footnote">Zaratiana et al. 2025 · arXiv:2507.18546 · Tables 1, 3; App. A. [P] prompt, [E] entity, [C] child field, [L] label. Their fractions shown ×100. GLiNER-M copied from GLiNER Table 1. "Not evaluated due to the absence of established zero-shot benchmarks". Training data includes 16,400 PubMed abstracts</p>

Note:
Optional. The first author's own sequel, from a company. One encoder of 205M parameters with a 2048-token context handles NER with natural-language type descriptions, text classification, and structured records, like a product with a name and a price. Special tokens mark prompts, entities, child fields and labels, and several tasks can share one forward pass. For records it first predicts how many instances there are, as a 20-way classification, then matches each instance's fields to spans. Trained on 254,334 GPT-4o-labelled examples.
On five CrossNER domains it averages 59.0, a little below GPT-4o and below the original GLiNER-M at 61.5; GLiNER-L isn't compared. Its text says it scores higher on AI, 0.526 against 0.547, which is lower. Structured extraction isn't evaluated at all. What it changes: the idea scales from entities to schemas at a small cost in NER accuracy, and its table is where the 195M count in the parameter-count critique, later, comes from.

---

<p class="eyebrow"><span class="paper">Zaratiana et al. 2023</span> · limitations, in their words</p>

## What limitations do the authors admit?

<div class="cols">
<div class="text">

<blockquote>"GLiNER underperforms compared to UniNER on tweet-based NER datasets ... informal, colloquial, or noisy data"</blockquote>

<blockquote>"particularly in Bengali, where it scored only 0.89 in the F1 score"</blockquote>

</div>
<div class="text">

- supervised: "falls behind UniNER"
- future: "better adapt it for low-resource languages"
- no Limitations section

</div>
</div>

<p class="footnote">Zaratiana et al. 2023 §4.1, §4.2, §4.3, §7. The arXiv version (v1) has no Limitations section; the NAACL version was not checked</p>

Note:
The arXiv version has no Limitations section, so these are scattered through the results and conclusion. Social media: GLiNER trails UniNER on tweet datasets, which the authors attribute to informal, noisy text. Non-Latin scripts with the English backbone: Bengali at 0.89 F1. With labels it falls behind UniNER. And as future work, a better design and better support for low-resource languages. Everything that follows is ours.

---

<p class="eyebrow"><span class="paper">Zaratiana et al. 2023</span> · critique · speed · Abstract, §1</p>

## Faster: is that measured?

<div class="cols">
<div class="text">

- abstract: parallel extraction, vs "slow sequential token generation"
- no latency, throughput or memory number
- only timing: 5 hours to train

</div>
<div class="text">

<p class="q"><b>Q.</b> Do they admit it?</p>
<p class="a"><b>A.</b> No</p>
<p class="q"><b>Q.</b> Does it sink the argument?</p>
<p class="a"><b>A.</b> No: one pass vs many steps, about 23x cheaper per token (before UniNER's extra turns per type). But an inference, not a result</p>

</div>
</div>

<p class="footnote">Our critique of Zaratiana et al. 2023. Per-token ratio from the cost slide ($2P$ rule, ours). Later work below (press ↓)</p>

Note:
The speed critique. Speed is the paper's selling point: the abstract contrasts parallel extraction with slow sequential generation. Yet there's no timing, throughput or memory number anywhere; the only time given is training. They don't admit the gap. It doesn't sink the argument: the structural case is sound, one encoder pass against many sequential decoder steps, and about 23 times cheaper per token by our count, before counting UniNER's extra turn per type. But "faster" is an inference, not a result. One table of sentences per second on the same GPU would have settled it.

--

<p class="eyebrow"><span class="paper">Zaratiana et al. 2023</span> · Later work · Boylan et al. 2025</p>

## GLiREL: does span matching extend to relations?

<div class="cols">
<div class="text">

<div class="eq">$$\boldsymbol{\kappa}_{uv} = \mathrm{FFN}(\mathbf{e}_u \otimes \mathbf{e}_v), \quad \phi(u, v, t) = \sigma(\boldsymbol{\kappa}_{uv}^{\top}\mathbf{q}_t)$$</div>

- entities: GLiNER's Eq. 1; pairs scored like Eq. 2
- entities must be given as input
- 15 unseen labels: 73.91, 84.48
- GPT-4o: 41.57, 70.70

</div>
<div class="text">

<p class="q"><b>Speed (not an LLM comparison)</b></p>

- CPU: 4.63 to 4.93 sentences/s
- TMC-BERT: 0.12 to 1.91
- relations, not NER

</div>
</div>

<p class="footnote">Boylan, Hokamp &amp; Gholipour Ghalandari 2025 · arXiv:2501.03172 · §3 to §5. Macro F1 (mean of per-relation F1) on Wiki-ZSL (Wikipedia, 113 relation types, labels from Wikidata) and FewRel (80 types). TMC-BERT: earlier classifier, one pass per pair and label. With synthetic pretraining; "beats GPT-4o at every m" needs it</p>

Note:
Optional. GLiREL takes GLiNER to relations. Each entity is represented exactly as in Eq. 1, every ordered pair of entities gets a vector from the concatenation of the two, and each pair is scored against each relation label exactly as in Eq. 2. All pairs and labels in one pass.
With 15 unseen relation labels and synthetic pretraining, it scores 73.91 and 84.48 macro F1 on Wiki-ZSL and FewRel, far above GPT-4o's 41.57 and 70.70. On speed, it shows that one-pass scoring is faster than a per-pair classifier: on CPU, 4.63 to 4.93 sentences per second against 0.12 to 1.91 for TMC-BERT, which needs a forward pass per pair and label. It does not time an LLM, so it does not settle the speed question for NER. Two limits: entities must be given as input, it classifies relations between known entities; and the "beats GPT-4o at every setting" claim holds only for the synthetic-pretrained model.

---

<p class="eyebrow"><span class="paper">Zaratiana et al. 2023</span> · critique · parameter count · Table 1</p>

## "140 times smaller": counting what?

<div class="cols">
<div class="text">

- DeBERTaV3 "backbone": base 86M, small 44M
- same table: BERT-base 86M (usual total: 110M)
- so: GLiNER counts exclude embeddings (ours)
- 128K vocabulary × 768: about 98M
- GLiNER2's table (earlier slide): GLiNER at 195M

</div>
<div class="text">

<p class="q"><b>Q.</b> Which ratio is right?</p>
<p class="a"><b>A.</b> Compute: about 144. Memory: about 67</p>
<p class="q"><b>Q.</b> Admit? Sink?</p>
<p class="a"><b>A.</b> Not stated. No: 67x is still dramatic</p>

</div>
</div>

<p class="footnote">He et al. 2023 (DeBERTaV3) Table 5; Zaratiana et al. 2025 (GLiNER2) Table 1. Compute: non-embedding count, since a lookup costs almost no arithmetic. 110M is general knowledge, not in the cited table. Arithmetic ours</p>

Note:
The parameter-count critique. GLiNER-M is "90M" and 140 times smaller than UniNER-13B. DeBERTaV3's own size table gives backbone counts of 86M for base and 44M for small; the same table lists BERT-base at 86M, against its usual 110M, so those backbone counts leave out the embedding matrix (the 110M is general knowledge, not in that table). That's our reading, and it makes GLiNER's 50M and 90M the backbones plus heads. The 128-thousand-token vocabulary at width 768 adds about 98M. GLiNER2's comparison table lists GLiNER at 195M with embeddings.
Which ratio is right depends on the question. For compute, the non-embedding count is fair, since an embedding lookup costs almost no arithmetic, only the other weights do multiply-adds. So about 144. For memory, all weights count: about 67. The paper doesn't say how it counts. It doesn't sink anything; 67 times smaller is still dramatic. Just say which ratio you mean.


---

<p class="eyebrow"><span class="paper">Zaratiana et al. 2023</span> · critique · new types · §3.4</p>

## Zero-shot: new datasets, or new types?

<div class="cols">
<div class="text">

- tested: new text, new datasets
- person, organization, location: top 1% of training types
- domain types in the 13,000? not reported
- truly unseen types: untested

</div>
<div class="text">

<p class="q"><b>Q.</b> Do they admit it?</p>
<p class="a"><b>A.</b> No</p>
<p class="q"><b>Q.</b> Does it sink the argument?</p>
<p class="a"><b>A.</b> Not the UniNER comparison (same types). It limits "open-type"</p>

</div>
</div>

<p class="footnote">Our critique. Top-1% types from Zhou et al. 2023 (UniNER) §2.1. A settling test: hold out types from Pile-NER's list, train without them, test on them</p>

Note:
The new-types critique. "Zero-shot" here means unseen datasets, not unseen types. We can verify that the general types, person, organization and location, are among Pile-NER's most frequent. Whether the domain types of CrossNER or the biomedical sets are among its 13,000 isn't reported, so recognising a type the model has never seen named is untested, not disproved. They don't discuss it. It doesn't undermine the comparison with UniNER, which saw the same training types, but it limits what "open-type" has been shown to mean, and it's the key unknown for any new domain. The settling experiment: hold out types from Pile-NER's list, train without them, and test on them.

---

<p class="eyebrow"><span class="paper">Zaratiana et al. 2023</span> · critique · copied baselines · Tables 1 to 4</p>

## Copied baselines: comparable?

<div class="cols">
<div class="text">

- five papers' prompts, scorers, preprocessing
- InstructUIE: two evaluations
- UniNER-7B row: 4 cells differ
- GoLLIE average: not its row mean

</div>
<div class="text">

<p class="q"><b>Q.</b> Do they admit it?</p>
<p class="a"><b>A.</b> They cite sources; comparability not discussed</p>
<p class="q"><b>Q.</b> Does it sink the argument?</p>
<p class="a"><b>A.</b> Not Table 1 (5 to 7 points vs at most 2). It weakens Table 2's 2.1</p>

</div>
</div>

<p class="footnote">Our critique. Discrepancies: our comparison of GLiNER Table 1 with UniNER's own table (music 67.0 vs 65.0)</p>

Note:
The copied-baselines critique. Every baseline number comes from another paper, with its own prompts, scorers and preprocessing, and we can see the cost: a scorer bug fixed in one paper and not another, InstructUIE in two different evaluations, a UniNER-7B row that differs from UniNER's own table, a GoLLIE average that isn't its row mean. They cite the sources but don't discuss comparability. It doesn't sink Table 1, where the margin of 5 to 7 points dwarfs discrepancies of at most 2 on a cell. It does weaken close calls, like the 2.1-point lead on the twenty datasets.

---

<p class="eyebrow"><span class="paper">Zaratiana et al. 2023</span> · critique · noise</p>

## One run per number: how big is the noise?

<div class="cols">
<div class="text">

- no seeds, error bars or intervals
- GLiREL: one label's score moves with "order and number of other provided labels"
- UniNER: type-name model "sometimes fails to recognize entities with similar semantic meanings"

</div>
<div class="text">

<p class="q"><b>Q.</b> Do they admit it?</p>
<p class="a"><b>A.</b> No</p>
<p class="q"><b>Q.</b> Does it sink the argument?</p>
<p class="a"><b>A.</b> Not the big effects (7 points, 5 points). It does hurt the small ones: type dropping (1.0 to 1.4), the pretraining gap at full data (0.6 or 0.8) and Table 2's lead (0.9)</p>

</div>
</div>

<p class="footnote">Our critique. GLiREL (Boylan et al. 2025) Limitations; UniNER (Zhou et al. 2023) appendix case study, "Sensitivity to entity type paraphrasing". Seed variance itself is not measured in any paper read here</p>

Note:
The noise critique. No seeds, no error bars, no intervals. We have two pieces of evidence that results move with the prompt. GLiREL's authors report that one label's performance depends on the order and number of the other labels. And UniNER's own case study says its type-name model "sometimes fails to recognize entities with similar semantic meanings", while a definition-based model is robust to paraphrasing: bare type names are sensitive to wording, in their words. How much seeds move these numbers isn't measured anywhere we read. It doesn't touch the big effects, Table 1 and negatives. It does for the small ones: type dropping at 1.0 to 1.4, the full-data pretraining gap of 0.6 or 0.8, and Table 2's lead.

---

<p class="eyebrow"><span class="paper">Zaratiana et al. 2023</span> · critique · text vs tables · §4.3, §5.3</p>

## Do the text and the tables agree?

<table class="rules">
  <tr><td>the text says</td><td>the table or figure says</td></tr>
  <tr><td>"almost 3 points" behind UniNER</td><td>1.9 like for like</td></tr>
  <tr><td>"0.9" ahead of InstructUIE</td><td>1.7 for the variant named</td></tr>
  <tr><td>"over 1.4" for type dropping</td><td>1.4 and 1.0</td></tr>
  <tr><td>0.8 gap at full data (text and Table 4)</td><td>0.6 (Fig. 5)</td></tr>
  <tr><td>"Table 3", "Figure 5"</td><td>Table 4, Figure 6</td></tr>
  <tr><td>44889 passages</td><td>45,889 (UniNER)</td></tr>
</table>

<p class="footnote">Zaratiana et al. 2023 §3.1, §4.3, §5.2, §5.3; Zhou et al. 2023 §2.1. Our checks. No slip changes a conclusion</p>

Note:
The text-versus-tables critique, in one table. The supervised comparison uses the wrong variant twice; the type-dropping gain is overstated; the same full-data gap is 0.8 in the table and 0.6 in the figure; a table and a figure are cited by the wrong number; and the dataset size has a typo. No single slip changes a conclusion. Together they say: read the tables, not the prose.

---

<p class="eyebrow"><span class="paper">Zaratiana et al. 2023</span> · critique · cap and threshold · §2.1, §2.3</p>

## The 12-word cap and the 0.5 threshold: tested?

<div class="cols">
<div class="text">

- $K$ = 12 "without harming recall": no number
- 0.5 threshold fixed; calibration untested
- same 0.5, training ratio moves precision/recall
- 49.3/58.1 ▸ 61.1/56.5

</div>
<div class="text">

<p class="q"><b>Q.</b> Do they admit it?</p>
<p class="a"><b>A.</b> No</p>
<p class="q"><b>Q.</b> Does it sink the argument?</p>
<p class="a"><b>A.</b> No, but new domains differ in entity length and score spread</p>

</div>
</div>

<p class="footnote">Our critique; Table 5 numbers at 0% and 75% negatives. So the best threshold likely depends on training (ours). A settling test: recall on gold spans over 12 words; a reliability plot of score vs observed precision</p>

Note:
The cap-and-threshold critique. Two design choices are never tested. The 12-word cap "doesn't harm recall", with no recall number. The 0.5 threshold is fixed, and nothing shows the scores are calibrated. Table 5 is a hint that it matters: at the same 0.5 threshold, changing only the training ratio of negative types moves precision and recall from 49.3 and 58.1 to 61.1 and 56.5, so the best threshold likely depends on how the model was trained. Not admitted; not fatal; but both matter in a new domain, where entity lengths and score distributions can differ. The tests are easy: recall on long gold spans, and a reliability plot.

---

<p class="eyebrow"><span class="paper">Zaratiana et al. 2023</span> · critique · student beats teacher · Tables 1, 2</p>

## How does the student beat its teacher?

<div class="cols">
<div class="text">

- trained only on ChatGPT's labels
- beats ChatGPT: +13.4 (Table 1), +11.3 (Table 2)
- UniNER does too: not the architecture

</div>
<div class="text">

<p class="q"><b>Possible reasons (ours)</b></p>

- a different prompt for the ChatGPT baseline
- 45,889 passages average out its noise
- whole spans suit exact match
- negatives teach restraint

</div>
</div>

<p class="footnote">Our critique. The ChatGPT baseline used Ye et al. 2023's prompt (§3.3), not the Pile-NER labelling prompt. The paper offers no explanation</p>

Note:
The student-beats-teacher critique. GLiNER learns only from ChatGPT's labels, then beats ChatGPT by 13.4 points on Table 1 and 11.3 on Table 2. The paper doesn't explain it. Possible reasons, ours: the ChatGPT baseline was prompted differently, with Ye et al.'s template rather than the labelling prompt; training on 45,889 passages averages out ChatGPT's inconsistent individual decisions; span classification outputs whole spans with exact boundaries, which exact match rewards; and negatives teach a restraint a prompted ChatGPT lacks. UniNER, with the same labels, also beats ChatGPT, so it's not about GLiNER's architecture. It doesn't sink anything, but "beats ChatGPT" is partly a statement about how ChatGPT was prompted in 2023.

---

<p class="eyebrow"><span class="paper">Zaratiana et al. 2023</span> · critique · type names · §3.4</p>

## Which type names were fed at test time?

<div class="cols">
<div class="text">

- the model matches on the type name
- "person" or "PER"? "company" or "organisation"?
- a dataset's "misc": phrased how, or dropped?
- not reported

</div>
<div class="text">

<p class="q"><b>Q.</b> Did UniNER say?</p>
<p class="a"><b>A.</b> Yes: "we replace per with person"; some types removed</p>
<p class="q"><b>Q.</b> Sink?</p>
<p class="a"><b>A.</b> No, but a hidden setting behind every zero-shot number</p>

</div>
</div>

<p class="footnote">Our critique. Zhou et al. 2023 (UniNER) §3: labels converted "into natural language formats"; types such as Else removed; documents split into sentences. Whether GLiNER used these processed versions is not stated</p>

Note:
The type-names critique. GLiNER matches spans to type names, so the exact string fed for each test type is part of the method: "person" or "PER", "organisation" or "company", and how a dataset's miscellaneous type was phrased, or whether it was dropped. The paper never says. UniNER's benchmark paper did state its choices: labels converted to natural language, per to person, some types removed, documents split into sentences. Whether GLiNER used those processed versions isn't stated. Not admitted, not fatal, but a hidden setting behind every zero-shot number, and it affects how comparable GLiNER is with UniNER, which was run with its own prompts.

---

<p class="eyebrow"><span class="paper">Zaratiana et al. 2023</span> · critique · USM · §4.1</p>

## Does the USM gap show "the superiority of our architecture"?

<div class="cols">
<div class="text">

- USM: 0.3B, 37.8; GLiNER-L: 60.9
- USM: different design; data not described
- gap: architecture plus whatever else differs
- InstructUIE, GoLLIE: other training sets

</div>
<div class="text">

<p class="q"><b>Q.</b> Do they admit it?</p>
<p class="a"><b>A.</b> No</p>
<p class="q"><b>Q.</b> Does it sink the argument?</p>
<p class="a"><b>A.</b> No: UniNER carries the architectural claim alone</p>

</div>
</div>

<p class="footnote">Our critique of Zaratiana et al. 2023 §4.1: "the performance is significantly lower, highlighting the superiority of our architecture". USM: Unified Semantic Matching (Lou et al. 2023). InstructUIE: fine-tuned "on various NER datasets"; GoLLIE: on annotation guidelines (§3.3)</p>

Note:
The USM critique. The paper reads USM's 37.8, against GLiNER-L's 60.9 at similar size, as showing the superiority of its architecture. But the paper describes USM only as similar in size with a different architecture; its training data isn't given here, so the gap may mix architecture with data. The same goes for InstructUIE, fine-tuned on various NER datasets, and GoLLIE, fine-tuned on annotation guidelines. Only UniNER is stated to share GLiNER's training data. Not admitted. It doesn't sink anything, because the UniNER comparison carries the architectural claim on its own; just don't repeat this sentence as evidence.

---

<p class="eyebrow"><span class="paper">Zaratiana et al. 2023</span> · GLiNER vs UniNER</p>

## How do GLiNER and UniNER compare?

<table class="rules">
  <tr><td>question</td><td>UniNER (Zhou et al. 2023)</td><td>GLiNER (Zaratiana et al. 2023)</td></tr>
  <tr><td>model</td><td>LLaMA decoder, 7B or 13B</td><td>DeBERTa-v3 encoder, 50M to 0.3B</td></tr>
  <tr><td>training data</td><td>Pile-NER (built it)</td><td>Pile-NER (borrowed)</td></tr>
  <tr><td>output</td><td>generated lists, one type per turn</td><td>a score per span-type pair, at once</td></tr>
  <tr><td>negatives</td><td>by frequency: 31.5 ▸ 53.4</td><td>from the batch: 53.3 ▸ 60.9</td></tr>
  <tr><td>zero-shot, 7 sets</td><td>53.7 (7B), 55.6 (13B)</td><td>60.9 (L)</td></tr>
  <tr><td>zero-shot, 20 sets</td><td>45.7 (7B)</td><td>47.8 (L)</td></tr>
  <tr><td>supervised, 20 sets</td><td>84.8 (7B)</td><td>82.9 (L, with Pile-NER)</td></tr>
  <tr><td>long, nested, free-form (ours)</td><td>any length in principle; free-form output</td><td>at most 12 words; nested by rule</td></tr>
</table>

<p class="footnote">Zaratiana et al. 2023 Tables 1, 2, 4, 5; Zhou et al. 2023 §3. Neither paper measures speed. UniNER figures as printed in GLiNER's tables: 53.4 is UniNER's own average, 53.7 GLiNER's printed copy of it. Last row ours: neither paper claims it</p>

Note:
UniNER isn't assigned this week, but it's the paper GLiNER answers, and the comparison is the cleanest in the paper. Same data, opposite output: generated lists, one type per turn, against a score for every span-type pair at once. Both add negative types and both gain a lot from them. Zero-shot, GLiNER wins: 60.9 against 53.7 and 55.6 on the seven out-of-domain sets, 47.8 against 45.7 on twenty. With labels, UniNER keeps the edge, 84.8 against 82.9. And generation plausibly still has things scoring can't do: entities of any length in principle, free-form output, explanations; neither paper claims this, it is our reading. They agree that distilling ChatGPT's labels works and that negatives are essential; they disagree on whether you need to generate.

---

<p class="eyebrow"><span class="paper">Zaratiana et al. 2023</span> · Summary</p>

## What to keep from GLiNER

<div class="cols">
<div class="text">

- two equations: end words, then sigmoid of a dot product
- an LM head with a vocabulary built from the prompt
- same data: scoring beat generating, zero-shot (with DeBERTa-v3)
- negative types: the biggest training lever
- read the tables, not the prose

</div>
<div class="text">

<p class="q"><b>Open question</b></p>
<p class="a">How well does it find types it has never seen named? Hold out types from Pile-NER, train without them, test on them</p>

</div>
</div>

<p class="footnote">Zaratiana et al. 2023. Other open questions: speed on the same GPU; calibration of the 0.5 threshold; why the student beats the teacher; how far scoring can go for relations</p>

Note:
What to keep. First, the whole model is two equations: a span is its two end words through a small network, and a match is the sigmoid of a dot product. It's a language-model head whose vocabulary is built from the prompt, and putting the type names in the same bidirectional input as the text is what makes it open-type. Second, on the same ChatGPT-written data, scoring spans beats generating them zero-shot, 60.9 against 53.7 and 55.6. Third, negative types matter more than any other training choice they ablate: 7 to 8 points here, up to 22 in UniNER. Fourth, read the tables, not the prose.
The open question: how well does it find types it has never seen named? Nobody here tests it, and it's the case that matters in any new domain. Others worth asking: how much faster is it on the same GPU, are its scores calibrated, why does the student beat its teacher, and how far can scoring go for relations?


---

<!-- .slide: class="cover divider" -->

<p class="kicker">After the reading</p>
<h1>As a reviewer</h1>
<p class="subtitle">What to ask for, and questions for discussion</p>

Note:
Two closing slides: what I would ask the authors for as a reviewer, and three questions to open the discussion.

---

<p class="eyebrow">Week 5 · as a reviewer</p>

## What would I ask the authors?

<table class="rules">
  <tr><td>missing</td><td>the test that would settle it</td></tr>
  <tr><td>speed and memory</td><td>time GLiNER and UniNER on the same GPU and texts</td></tr>
  <tr><td>truly unseen types</td><td>hold types out of Pile-NER, train, test on them</td></tr>
  <tr><td>one protocol for baselines</td><td>rerun the LLMs with the same type names and scorer</td></tr>
  <tr><td>variance</td><td>several seeds; spread over type wordings</td></tr>
  <tr><td>the 12-word cap and 0.5 threshold</td><td>recall of gold spans over 12 words; a threshold sweep</td></tr>
</table>

<p class="footnote">Zaratiana et al. 2023. The text-table slips (text-versus-tables slide) change no conclusion, but they mean the tables, not the prose, are the record</p>

Note:
Five requests. Speed is the paper's motivation and is never timed: one table of sentences per second against UniNER on the same GPU would settle it. Unseen types: "zero-shot" here means unseen datasets, and some test types or near-synonyms may be among Pile-NER's 13,000; hold types out and test on them. Baselines: the LLM numbers are copied from other papers with their own prompts and scorers; rerun at least ChatGPT and UniNER under one protocol. Variance: every number is one run. And the two fixed choices, the 12-word span cap and the 0.5 threshold, are asserted rather than measured.

---

<p class="eyebrow">Discussion</p>

## Questions for discussion

<table class="rules nohead">
  <tr><td>1</td><td>GLiNER learned from ChatGPT's labels, then beat ChatGPT. How can a student beat its teacher?</td></tr>
  <tr><td>2</td><td>"Zero-shot" meant new datasets, not new types. What would a fair test of a new type look like?</td></tr>
  <tr><td>3</td><td>When is generating the answer worth its cost, and when is scoring candidates enough?</td></tr>
</table>

<p class="footnote">Question 1: critique slide "How does the student beat its teacher?". Question 3: the week's theme, beyond autoregressive decoders</p>

Note:
Three questions to open the discussion.
One, the student-beats-teacher puzzle. Possible answers: the benchmarks reward exact span boundaries, which a span scorer is built for and a text generator is not; training adds negative types ChatGPT never had to handle; and ChatGPT's own numbers come from a different prompt.
Two, a fair zero-shot test: types invented after the training data was made, or types with no near-synonym among Pile-NER's 13,000.
Three, the week's theme. Generation is flexible: any output format, explanations, relations. Scoring is fast and exact but needs the candidates listed in advance. Where is the line?
