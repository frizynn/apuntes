# Practice brief: exam practice for one or more lectures

You write the practice questions of lectures that already have a finished section. C = the course folder in your task.
The student answers first and reads the explanation after; questions are the main study tool before the exam, so they
must be correct, exam-like and fully answerable from the guide.

## Read first
- `C/course.json`: `exam` (format and what it tests) and `language`.
- For each lecture: `C/lectures/LNN.md` (the content source), `C/reports/LNN_report.md` (do NOT ask about anything it
  marks unverified), `C/sources/slides/LNN.txt`, and `C/sources/quiz/LNN.txt` if it exists (it shows the lecturer's style;
  do not copy its questions).

## Output: `C/practice/LNN.json`, one per lecture
```json
{"mc": [{"q": "...", "options": ["...", "...", "...", "..."], "answer": 2,
         "why": "...", "ref": "exact text of a ## heading in LNN.md"}],
 "open": [{"q": "...", "points": ["...", "..."], "model": "...", "ref": "..."}]}
```
- Lectures: 10 `mc` and 3 `open`. Tutorials: 6 `mc` and 2 `open`.
- `q`, `options`, `points` and `model` in English: the exam is in English. `why` in the course `language`.
- `ref` must equal a `##` heading of the lecture file, so the page can link "see in the guide".

## Multiple choice
- Four options, one clearly correct. Distractors are real concepts from the course that a half-prepared student would
  pick, never silly or "all of the above".
- At least 6 of 10 test application: a short case (a buyer, a manager, a team, a company) where the student must
  recognise which concept, strategy or model applies, without the question naming it. The rest test a definition
  distinction or a comparison between two theories or studies.
- `why`: two or three sentences: why the right answer is right, and why the most tempting wrong option is wrong.
- Spread the correct position: across a file, each of 0-3 is the answer at least twice (tutorials: at least once).
- Nothing that depends on a number the student cannot reason out, unless the guide stresses that number.

## Open questions
- One applies the theory to a new case and asks what the actor should do and why; one compares two theories or
  perspectives; one asks to explain a concept or study with an example. Exam length: answerable in 150-250 words.
- `points`: the 3-6 elements a grader looks for. `model`: a model answer of 120-220 words in plain English.

## Rules
- Everything answerable from `LNN.md`. If a good question needs something the guide lacks, skip it and list it in your reply.
- No em dashes. No references to "the slides", "the lecturer" or "the guide" inside questions.
- Write only `C/practice/LNN.json`. Validate with `python3 <skill>/scripts/check_practice.py C LNN` (exit 0).
- Reply: per lecture, counts, the topics covered and anything skipped.
