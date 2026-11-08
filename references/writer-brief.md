# Writer brief: one lecture of the course notes

You own ONE lecture. C = the course folder given in your task (it holds course.json, lectures/, img/, sources/).
Write the study section for that lecture so the student can pass the exam with only this document, and can actually
study it: a whole course has about 18 lectures. The exam format is in course.json ("exam").

## Course settings (read course.json first; they override the defaults below)
- `language`: write in it. For "es": plain Spanish with "vos", short sentences. Keep every exam term, model and study
  name in English the first time, with the Spanish explanation: "el punto de reserva (reservation point)". The exam is
  in English, so the student must recognise the English terms. Study lines become *Pregunta:* *Método:* *Resultado:*
  *Muestra:* and the closing section is `## Para el examen`.
- `max_words` and `max_image_px` replace the 2,500 words and 480 px below (`check.sh` reads them).
- `output_html`: the course is studied from one HTML page, so lean on visuals: 3-6 images per lecture (model diagrams,
  key slides, result graphs, tables from papers), each explained in the text. Resize with `sips -Z <max_image_px>`.
- `exam`: what the exam covers. If it says methods and findings of articles are not exam material, give each article its
  question, theory and conclusion and keep design and numbers to one line.
- `kind: "tutorial"`: what was done and asked, the method or framework used, the tutor's feedback, and which theory it
  applies. Graded-work requirements stay complete.
- `prior`: an earlier guide written for this student. Reuse its correct content and examples; check its numbers against
  the sources; do not copy its structure.
- `clips`: videos and podcasts are exam material. Get a transcript (YouTube tools via ToolSearch "youtube_get_transcript",
  or the page with WebFetch). If you cannot, list it in the report as not covered; do not summarise from memory.
- Granola transcripts: read the whole transcript, paging with `offset`/`next_offset` (40k characters per page). The
  meeting notes are a summary and miss things; never write from them alone.

## Length and priority (most important rule)
- Aim for 1,800-2,000 words per lecture; hard limit 2,500 (about 5-7 pages with images). Going over 2,000 is for explaining a key model properly (mechanism, how to recognize it), never for extra examples or detail. `check.sh` fails above it. Earlier versions at 3,000
  words read as dense and padded: the student wants to read it once and understand it.
- Priority 1 is what the lecture itself covered: every slide topic, study and example, plus what the lecturer explained or
  stressed in the recording. Priority 2 is the book/reader: add only what explains or completes those topics, plus the few
  book-only concepts a multiple-choice question would most likely test, each in a sentence or two. Do not summarise whole chapters.
- Explain ideas well; leave out statistical detail (p-values, F, t, chi-square, exact N unless it is the point), exact
  formulas (state the idea in words), long lists of minor studies, anecdotes that add nothing, and repetition.
- A study that the lecture presents gets a block; a book-only study gets at most one sentence, or nothing.

## Read every source listed in your task
- Student notes `sources/notes/LNN.md`: keep everything correct, fix what is wrong. Keep `![][imageN]` references that are
  useful (their images live in `sources/notes/image_defs.md`; infer their content from the surrounding text).
- Slides `sources/slides/LNN.txt` plus LOOK at every `sources/slides/LNN/p-*.png` with the Read tool: graphs, results and
  stimuli are often only in the images. Handout pages hold about 3 slides each.
- Book chapters `sources/book/chNN.txt` and readers `sources/readers/*.txt`: the exam tests them, so include every concept,
  model, distinction and study they cover, briefly. Skip filler, long anecdotes and reference lists.
- Transcripts: `sources/transcripts/LNN_*.txt` and/or Granola meetings named in your task (load with ToolSearch
  "select:mcp__claude_ai_Granola__get_meeting_transcript"). A recording can hold two lectures; use the slides to cut your part.
  The lecturer's examples, anecdotes and "this matters for the exam" moments are high value. ASR misspells names: check them.
- Quiz `sources/quiz/LNN.txt`: every question must be answerable from your section. If a quiz points at a chapter you were
  not given, say so in the report instead of answering from memory.
- Empirical paper named in your task: find the full text (WebSearch/WebFetch, author pages, open PDFs). Cover question,
  hypotheses, design, participants, procedure, measures, results with key numbers, conclusion, limitations. If you cannot get
  it, say which details are unverified.
- Skim the headings of the other files in `lectures/` so you do not re-teach a topic another lecture owns; one line plus
  "(see Lecture N)" is enough there.

## Writing (the student's main complaint was "hard to read, filler in between, bold everywhere")
- Every concept follows the same order: (1) a plain-language definition in one sentence with simple words, (2) the
  explanation: why it works or matters, in two to four sentences, (3) at most one intuitive example, only if it helps.
  Understanding first; examples are not decoration.
- No filler between ideas: no restating, no "this matters because" chains, no asides that do not change what the student
  must know. If a sentence can go without losing an exam point, it goes.
- Make every relationship between concepts explicit, before the details. For a list or typology, say first what the
  items are: kinds that each case belongs to only one of, components every case has, possible reasons that can combine,
  steps in order, or alternatives. Say whether it is "all", "some", "one or several", "per person". Example of the failure
  this prevents: listing five attitude functions without saying they are reasons for holding an attitude, that one
  attitude can serve several, and that the same attitude can serve different functions for different people.
  Also say how a new model relates to the previous one (extends it, replaces it, competes with it).
- Simple English: short sentences, everyday words, one idea per sentence. Explain any technical term the first time.
- Bold only the key terms the exam asks about, once, where they are defined: max 30 per lecture (`check.sh` fails above).
  Never bold whole phrases or results.
- Keep every author, study and slide topic of the lecture; shorten them, do not drop them.
- Exam traps: one short sentence where they belong ("Do not confuse X with Y: ..."), not a "Careful:" in every paragraph.
- Output `lectures/LNN.md`, in the course `language` (English if unset). Start with `# <the lecture title from course.json>` and a short intro paragraph: the question this lecture
  answers and why it matters.
- Natural and direct, like a good tutor talking to a smart friend. Short paragraphs.
- Bullets only for real lists (the five functions, the steps of a model). Tables only to compare several items on the same
  dimensions, a few per lecture at most. No "Intuition: / Definition:" label scaffolding.
- Headings without numbers. `##` for main topics, `###` for subtopics and for each study.
- End with `## Key takeaways` (5-8 one-line bullets): what to remember for the exam.
- Every study with a design and a result gets its own heading, e.g. `### Festinger & Carlsmith (1959): the $1 vs $20 experiment`,
  then four short lines with italic lead-ins (italics do not count as bold): *Question:* *Method:* *Result:* *Shows:*
  One or two sentences each.
- Say things once. When in doubt, cut detail, never the core idea.

## Images
Add only the visuals that really help (key result graphs, model diagrams, famous stimuli), 1-3 per lecture.
Crop them from the slides PDF, the book PDF (path in course.json; PDF page = book page + offset) or readers/papers:
render the full page with `pdftoppm -png -r 150 -f P -l P in.pdf /tmp/page`, look at it, crop with
`pdftoppm -png -r 150 -f P -l P -x X -y Y -W W -H H in.pdf C/img/LNN/name`, look at the crop, then
`sips -Z 480 -s format jpeg -s formatOptions 70 name.png --out C/img/LNN/name.jpg` and delete the png
(480 px max side keeps it small on the page; check.sh fails on larger images).
Insert as `![Caption saying what to look at](img/LNN/name.jpg)` where it is discussed, and explain it in the text too.

## Hard rules
- Self-contained: never mention the sources ("the book says", "Perloff argues", "in class", "the lecturer", "slide 12",
  "the recording"). Researcher names and years are content and stay. Authors of a definition may be named.
- Correct: do not invent numbers, years or findings. If unsure, leave the number out and list it in the report.
- No em dashes, no filler, no "In conclusion", no hype.
- Markdown that imports cleanly into Google Docs: headings, bold, bullets, tables, images. No LaTeX or HTML.
- Write only `lectures/LNN.md`, `img/LNN/*` and `reports/LNN_report.md`.

## Report and reply
`reports/LNN_report.md` (max ~40 lines): sources used, errors fixed in the student's notes, content added by source, quiz
coverage per question, images with source page, unverified items. Reply with a 5-line summary.

## Rewrite mode
When asked to shorten an existing `lectures/LNN.md`: the existing file is the content source (it was verified against
slides, recording and readings); do not re-research. Check the slides text `sources/slides/LNN.txt` so no slide topic or
study is lost, rewrite to this brief, keep the best 1-3 existing images and delete unused ones in `img/LNN/`.
Example of the target style:

> ## Brand image
> Brand image is everything people associate with a brand: the ideas that pop up when they hear its name. It lives in
> the consumer's head, not in the ads; an ad only becomes image if people accept it.
>
> Each association differs in three ways: how **strong** it is (how fast it comes to mind), how **favorable** it is, and
> how **unique** it is compared with other brands. For easyJet, "cheap" is strong, positive and fairly unique; "airplane"
> is weak and shared by every airline.
