---
name: apuntes
description: Builds and maintains one study guide per course (a single HTML page with every lecture, exam practice and a Claude chat) from slides, readings, books, recordings and notes. One agent per lecture writes its section with concepts and studies explained and slide screenshots; another writes multiple-choice and open practice questions. Works for any course and university. Use for "build the study guide for <course>", "add the new lecture", "update the study guide", "make exam practice", "armá la guía de <materia>", "sumá la clase nueva".
disable-model-invocation: true
---

# Apuntes

`C` is the course's `apunte/` folder with its `course.json` (shape in `example/apunte/course.json`). `S` is this skill's
`scripts/`. Each lecture lives in `C`: `lectures/LNN.md` (text), `img/LNN/` (screenshots), `sources/` (inputs),
`reports/LNN_report.md` and `practice/LNN.json`. `LNN` is the `course.json` key, in date order; a tutorial or lab is an
entry with `"kind": "tutorial"`. Adding a lecture means adding its entry and running the steps for it only.

## Steps

1. **Course.** If `C/course.json` is missing, create it: `title`, `language` (language of the guide), `exam` (format and
   scope, from the syllabus), `output_html`, and one entry per lecture with `title`, `date`, `kind` and its sources:
   `slides` (PDF name), `readers` (required readings for that lecture), `paper` (a reading not in the folder, to find),
   `chapters` + `book` (book PDF with page ranges), `quiz`, `clips` (required videos and podcasts), `prior` (old notes
   worth reusing), `granola` or transcripts. PDFs are searched across the whole course folder.
   - Course on Canvas: add `course_id` and `canvas` (URL) and run `node S/canvas_sync.mjs C` to download pages and files.
     Username and password come from the macOS keychain, service = host of `canvas`:
     `security add-generic-password -U -a <user> -s <host> -w '<password>'`. Login is tested with Microsoft SSO.
2. **Recording.** Any transcript works: Granola meeting IDs in `granola` (find them by date and title), or text in
   `C/sources/transcripts/LNN_*.txt`. Own audio or video: `S/transcribe_groq.sh <audio> C/sources/transcripts/LNN_video.txt`
   (key in the keychain, service `groq-api-key`). A 2-hour lecture is about 60k characters and one agent reads it whole.
   Only above 150k, split it into 60k chunks with 5k overlap, have one agent extract each chunk to
   `sources/transcripts/LNN_partK.md`, and give the writer those. Without a recording, write from slides, notes and readings.
3. **Student notes.** If `course.json` has `notes_export_glob`: `python3 S/extract_notes.py C NN <export.md> <first> <last>`.
4. **Inputs.** `python3 S/prepare_lecture.py C NN` prints the manifest (slides as text and images, book, readings with OCR
   when scanned, quiz). Resolve each `MISSING` or record it as missing.
5. **Writing.** One agent per lecture, in parallel when there are several (each writes only its own files). Prompt:
   "Read `<path of this skill>/references/writer-brief.md` and follow it. C=<absolute path>. Lecture NN: <title>. Sources: <manifest>."
   Run one pilot lecture first and launch the rest after reviewing it. Without subagents, write it yourself from the same brief.
6. **Review.** `S/check.sh C LNN` exits 0 ("source refs" lines are reviewed by hand). Read the report, a stretch of text
   and two images. Fixes go back to the same agent.
7. **Practice.** A different agent from the writer (so it does not only ask what the writer chose to explain) writes
   `C/practice/LNN.json`: "Read `<path of this skill>/references/practice-brief.md` and follow it. C=<path>. Lectures: LNN ...".
   One agent can take 2 or 3 lectures. `python3 S/check_practice.py C` exits 0.
8. **Build.** `python3 S/build_html.py C` rebuilds the whole guide (always the same file) next to `apunte/`: contents
   that follow your reading, practice after each lecture and a separate mock exam view. Check it at phone and desktop width
   with a screenshot before calling it done. For PDF or docx with a book: `output` in `course.json`, `assemble.py`,
   `render_pdf.mjs` and `export_docx.py`.

## Studying with Claude

`node S/estudio.mjs "<Course>/apunte" ...` starts a local server (127.0.0.1:4317, `PORT` to change) that serves each guide
with a chat sidebar: **Ask** (about the lecture being read or a selected passage), **Tutor** (probes what the student knows,
shows a plan, teaches one step at a time and checks each step with a question carrying answer, confidence and reasoning) and
**Grade with Claude** on every open question. It uses the installed `claude` CLI with no tools and without
`ANTHROPIC_API_KEY`, so it runs on the logged-in account (the subscription). Model and effort are chosen in the chat.
Opened as a file, without the server, the guide works without the chat.

## Reply

Per lecture: sources used (recording or not), errors fixed, what was added, quiz and practice coverage, unverified items.
Then the verdict and what is left for the student (missing slides or readings, unrecorded lectures).
