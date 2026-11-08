#!/usr/bin/env node
// Local study server: serves each course's study-guide HTML with a Claude chat (ask, tutor, open-answer grading, and
// edit mode that updates the guide from the course material). Claude runs through the installed Claude Code CLI, so it uses whatever account the CLI is logged into.
// Usage: node estudio.mjs <course_dir> [<course_dir> ...]   (env PORT, ESTUDIO_MODEL)
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawn, execFile } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 4317);
const MODEL = process.env.ESTUDIO_MODEL || 'sonnet';
const TOKEN = crypto.randomBytes(16).toString('hex');
const EMPTY = fs.mkdtempSync(path.join(os.tmpdir(), 'estudio-'));

// Arguments are course folders (with course.json) or workspace roots whose subfolders hold <Course>/apunte/course.json.
const ARGS = (process.argv.slice(2).length ? process.argv.slice(2) : ['.']).map((d) => path.resolve(d));
const ROOT = ARGS.find((d) => !fs.existsSync(path.join(d, 'course.json'))) || path.dirname(path.dirname(ARGS[0]));
const slugify = (t) => t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
function loadCourse(root) {
  try {
    const cfg = JSON.parse(fs.readFileSync(path.join(root, 'course.json'), 'utf8'));
    return { root, cfg, slug: slugify(cfg.title || path.basename(path.dirname(root))), html: cfg.output_html ? path.join(root, '..', cfg.output_html) : null };
  } catch { return null; }
}
function discover() {
  const dirs = [];
  for (const a of ARGS) {
    if (fs.existsSync(path.join(a, 'course.json'))) { dirs.push(a); continue; }
    if (fs.existsSync(path.join(a, 'apunte', 'course.json'))) dirs.push(path.join(a, 'apunte'));
    for (const d of fs.readdirSync(a, { withFileTypes: true })) {
      if (d.isDirectory() && !d.name.startsWith('.') && fs.existsSync(path.join(a, d.name, 'apunte', 'course.json'))) dirs.push(path.join(a, d.name, 'apunte'));
    }
  }
  return [...new Set(dirs)].map(loadCourse).filter(Boolean);
}
let courses = discover();
setInterval(() => { courses = discover(); }, 3000).unref();

const read = (p) => (fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : '');
function workspaceInfo(c) {
  const count = (dir, ext) => { try { return fs.readdirSync(path.join(c.root, dir)).filter((f) => f.endsWith(ext)).length; } catch { return 0; } };
  let questions = 0;
  try { for (const f of fs.readdirSync(path.join(c.root, 'practice'))) { const p = JSON.parse(read(path.join(c.root, 'practice', f))); questions += (p.mc || []).length + (p.open || []).length; } } catch { /* no practice yet */ }
  const st = c.html && fs.existsSync(c.html) ? fs.statSync(c.html) : null;
  return { slug: c.slug, title: c.cfg.title, folder: path.relative(ROOT, path.dirname(c.root)) || '.', lectures: count('lectures', '.md'), planned: Object.keys(c.cfg.lectures || {}).length, questions, guide: !!st, updated: st ? st.mtimeMs : null, exam: c.cfg.exam || '' };
}
const lectureText = (c, key) => read(path.join(c.root, 'lectures', key.toUpperCase() + '.md'));
function practiceItem(c, key, kind, i) {
  const p = JSON.parse(read(path.join(c.root, 'practice', key.toUpperCase() + '.json')) || '{}');
  return (p[kind] || [])[i];
}
function outline(c) {
  return fs.readdirSync(path.join(c.root, 'lectures')).filter((f) => f.endsWith('.md')).sort()
    .map((f) => read(path.join(c.root, 'lectures', f)).split('\n').filter((l) => /^#{1,2} /.test(l)).join('\n')).join('\n\n');
}

const STYLE = 'Reply in the language the student writes in (default: the language of the guide). Plain, direct, short sentences; if replying in Spanish use "vos". Give exam terms in English the first time, with their meaning. No em dashes. Format: short paragraphs, "- " lists only for real lists, **bold** only for the key term.';
const QUIZ = `To ask the student a question, end your message with exactly one fenced block and nothing after it:
\`\`\`quiz
{"q": "question text", "options": ["option A", "option B", "option C", "option D"], "answer": 1, "why": "one or two sentences: why the right option is right and the tempting one is wrong"}
\`\`\`
Use 3-4 options when there is a clear answer, with "answer" (0-based index of the right option) and "why": the page hides both and shows the student right or wrong the moment they pick. For a goal or topic question with no right answer, leave out "answer" and "why". Omit "options" for an open question (the student writes the answer). Never reveal the answer in your prose. Do not repeat the question in your prose: the block shows it. The student replies with their answer, a confidence (probability 0-100 that it is right, absent if they said "I don't know") and optionally their reasoning. Read confidence against correctness: right and confident = held, move on; right but unsure = fragile, one reinforcing touch; wrong and confident = a committed misconception, name it and repair it before anything else; wrong and unsure or "I don't know" = an honest gap, a small correction. Use their reasoning to find exactly where the thinking broke.`;
const SYSTEM = {
  ask: (c) => `You are the tutor for the course "${c.cfg.title}". ${STYLE} Answer from the study guide first (below, inside <guide>). If the answer is not in the guide, say so in one line and then answer from general knowledge, marked as such. Never invent studies, authors or numbers. Keep it brief: just enough to understand, with one example if it helps. Exam: ${c.cfg.exam || ''}`,
  tutor: (c) => `You are a one-to-one tutor for the course "${c.cfg.title}". Your goal: the student ends up holding the chosen topic of the lecture in <guide> as obviously true, not memorised. ${STYLE}

Work in phases, one question per message, always waiting for the answer:
1. Goal. If the conversation is just starting, ask which topic of the lecture to work on, as a quiz block whose options are the lecture's main topics (plus "the whole lecture").
2. Probe. Find what the student already holds and where it ends, with 2-5 quiz questions. Start near the hardest thing the goal needs; correct and confident jumps up, a miss walks down. Every question must move the edge; no warm-ups.
3. Plan. Then show the route as a plan block, the smallest set of steps from what they hold to the goal, and start step 1 in the same message:
\`\`\`plan
{"steps": ["short step name", "..."], "current": 0}
\`\`\`
(The plan block goes before the text of the step. Send an updated plan block whenever "current" advances.)
4. Teach. One reasoning step per message, built on what they already hold, in clear prose with one concrete example if useful; no meta-narration of the method. End every step with a check question (quiz block) that needs the step to answer, ideally a short case. Repair before moving on.
5. Finish. When the goal is held, give a 3-5 line summary of the structure they built and suggest what to study next.

Stay inside the guide's content; never invent facts. ${QUIZ}`,
  grade: (c) => `You grade an open exam answer for "${c.cfg.title}". ${STYLE} Use the guide (inside <guide>), the points the grader looks for and the model answer. Return exactly these parts: **Estimated grade:** X/10 and one line why. **What you covered:** list. **Missing or wrong:** list, with the fix. **Improved version:** the student's answer rewritten in English, 120-200 words, keeping their correct ideas. Be fair: reward points, not length.`,
};

const SKILL = path.dirname(here);
const SOURCES = (c) => `Your working directory is the course folder. It holds the original material (slides, readings, books as PDFs). Prepared text versions: apunte/sources/slides/LNN.txt, apunte/sources/readers/*.txt, apunte/sources/book/*.txt. Lecture write-ups: apunte/lectures/LNN.md. apunte/course.json maps every lecture to its sources and its Granola meeting IDs (lecture recordings; read them with the Granola get_meeting_transcript tool, paging with offset).`;
const LOOKUP = 'When the guide does not cover what is asked well enough, look it up in the course material (Grep the .txt versions first, then Read; Granola for what was said in class) and say where it comes from (file and slide or page). Use tools only when needed and keep it quick.';
SYSTEM.ask = ((base) => (c) => base(c) + ' ' + SOURCES(c) + ' ' + LOOKUP)(SYSTEM.ask);
SYSTEM.tutor = ((base) => (c) => base(c) + '\n\n' + SOURCES(c) + ' ' + LOOKUP)(SYSTEM.tutor);
SYSTEM.edit = (c) => `You maintain the study guide of "${c.cfg.title}" with the "apuntes" skill at ${SKILL}. Before changing anything, read ${SKILL}/SKILL.md and the brief it points to for the task (references/writer-brief.md for lecture text, references/practice-brief.md for practice). ${SOURCES(c)}
The student tells you in the chat what to change: add a lecture, update one from new material (a Granola recording, new slides), expand a thin section, fix an error, add practice questions. Do it yourself, one lecture at a time, following the briefs (sources, length, images, checks). Prepare a lecture's inputs with: python3 ${SKILL}/scripts/prepare_lecture.py apunte NN. Validate with ${SKILL}/scripts/check.sh apunte LNN and python3 ${SKILL}/scripts/check_practice.py apunte. Never invent content. Do not run build_html.py: the guide is rebuilt automatically when you finish. If the request is unclear, ask one short question instead of guessing. Finish with a short summary in the student's language: what changed, and what you could not verify. No em dashes.`;

SYSTEM.home = () => `You are the study assistant on the student's workspace home. A workspace is a course: a folder with apunte/course.json and one study guide. The working directory holds all of them:
${courses.map((c) => { const w = workspaceInfo(c); return `- "${w.title}" in ${w.folder}/ (${w.lectures} lectures written, ${w.questions} practice questions)`; }).join('\n') || '- (none yet)'}
You use the "apuntes" skill at ${SKILL}: read ${SKILL}/SKILL.md before changing anything and the brief it points to for the task. You can: answer questions across workspaces; create a workspace (folder <Course>/apunte/course.json shaped like ${SKILL}/example/apunte/course.json, with "output_html": "<Course> - Study guide.html"); add or update lectures from the material in a course folder or from Granola recordings; add practice; fix a guide. Course material lives in each course folder; Granola holds lecture recordings (search_meetings, get_meeting_transcript). Paths in commands are relative to the working directory, e.g. python3 ${SKILL}/scripts/prepare_lecture.py "Managing People/apunte" 05. Never invent content. Do not run build_html.py: guides are rebuilt when you finish. If the request is unclear, ask one short question. ${STYLE} Finish with a short summary of what changed.`;

function buildPrompt(c, body) {
  if (body.mode === 'home') {
    const msgs = (body.messages || []).slice(-20).map((m) => `${m.role === 'user' ? 'USER' : 'ASSISTANT'}: ${String(m.content).slice(0, 6000)}`).join('\n\n');
    return `<conversation>\n${msgs}\n</conversation>\n\nReply to the USER's last message.`;
  }
  const lec = /^l\d\d$/.test(body.lec || '') ? body.lec : null;
  const guide = lec ? lectureText(c, lec) : '';
  const ctx = `<guide>\n${guide || '(no lecture selected)'}\n</guide>\n\n<course_outline>\n${outline(c)}\n</course_outline>\n\n`;
  if (body.mode === 'grade') {
    const q = practiceItem(c, lec, 'open', Number(body.index));
    if (!q) throw new Error('question not found');
    return ctx + `<question>${q.q}</question>\n<points>\n- ${q.points.join('\n- ')}\n</points>\n<model_answer>${q.model}</model_answer>\n<student_answer>\n${String(body.answer || '').slice(0, 6000)}\n</student_answer>`;
  }
  const who = body.mode === 'edit' || body.mode === 'home' ? 'USER' : 'STUDENT';
  const msgs = (body.messages || []).slice(-20).map((m) => `${m.role === 'user' ? who : 'ASSISTANT'}: ${String(m.content).slice(0, 6000)}`).join('\n\n');
  const sel = body.selection ? `<selected_text>\n${String(body.selection).slice(0, 3000)}\n</selected_text>\n\n` : '';
  const where = lec ? `The ${who.toLowerCase()} is reading ${lec.toUpperCase()}.\n\n` : '';
  return (body.mode === 'edit' ? `<course_outline>\n${outline(c)}\n</course_outline>\n\n` + where : ctx) + sel + `<conversation>\n${msgs}\n</conversation>\n\nReply to the ${who}'s last message.`;
}

const MODELS = ['haiku', 'sonnet', 'opus'], EFFORTS = ['low', 'medium', 'high', 'xhigh', 'max'];
const READ_TOOLS = ['Read', 'Grep', 'Glob', 'WebSearch', 'WebFetch', 'mcp__claude_ai_Granola'];
const editTools = () => [...READ_TOOLS, 'Edit', 'Write', 'MultiEdit',
  ...['prepare_lecture.py', 'check_practice.py', 'extract_notes.py'].map((f) => `Bash(python3 ${SKILL}/scripts/${f}:*)`),
  `Bash(${SKILL}/scripts/check.sh:*)`, 'Bash(pdftotext:*)', 'Bash(pdftoppm:*)', 'Bash(sips:*)', 'Bash(ls:*)', 'Bash(mkdir:*)', 'Bash(rm apunte/img/:*)'];
const busyEdit = new Set();

function describe(name, input, cwd) {
  const rel = (p) => String(p || '').replace(cwd + '/', '');
  if (name === 'Read') return 'Reading ' + rel(input.file_path) + (input.pages ? ` (p. ${input.pages})` : '');
  if (name === 'Grep') return `Searching “${input.pattern}”` + (input.path ? ' in ' + rel(input.path) : '');
  if (name === 'Glob') return 'Listing ' + input.pattern;
  if (name === 'WebSearch') return 'Web search: ' + input.query;
  if (name === 'WebFetch') return 'Opening ' + input.url;
  if (name === 'Edit' || name === 'MultiEdit' || name === 'Write') return 'Editing ' + rel(input.file_path);
  if (name === 'Bash') return 'Running ' + rel(String(input.command || '')).slice(0, 90);
  if (name === 'ToolSearch') return null;
  if (name.includes('Granola')) return 'Granola: ' + name.split('__').pop().replace(/_/g, ' ');
  return name;
}

function runClaude(c, mode, system, prompt, res, opts = {}) {
  const model = MODELS.includes(opts.model) ? opts.model : MODEL;
  const effort = EFFORTS.includes(opts.effort) ? opts.effort : null;
  const env = { ...process.env, CLAUDE_CODE_DISABLE_CLAUDE_MDS: '1' };
  delete env.ANTHROPIC_API_KEY; // force the CLI's own login (subscription), never an API key from this shell
  const cwd = c.cwd || path.dirname(c.root);
  const editing = mode === 'edit' || mode === 'home';
  const tools = mode === 'grade' ? ['--tools', '', '--strict-mcp-config']
    : editing ? ['--tools', 'Read,Grep,Glob,WebSearch,WebFetch,ToolSearch,Edit,Write,MultiEdit,Bash', '--allowedTools', ...editTools(), '--permission-mode', 'acceptEdits']
      : ['--tools', 'Read,Grep,Glob,WebSearch,WebFetch,ToolSearch', '--allowedTools', ...READ_TOOLS];
  const child = spawn('claude', ['-p', '--model', model, ...(effort ? ['--effort', effort] : []), ...tools, '--disable-slash-commands',
    '--no-session-persistence', '--setting-sources', '', '--system-prompt', system,
    '--output-format', 'stream-json', '--verbose', '--include-partial-messages'], { cwd: mode === 'grade' ? EMPTY : cwd, env });
  res.writeHead(200, { 'Content-Type': 'application/x-ndjson; charset=utf-8', 'Cache-Control': 'no-cache' });
  const emit = (o) => res.write(JSON.stringify(o) + '\n');
  let buf = '', sent = false, err = '';
  if (editing) busyEdit.add(c.slug);
  child.stdout.on('data', (d) => {
    buf += d;
    let i;
    while ((i = buf.indexOf('\n')) >= 0) {
      const line = buf.slice(0, i); buf = buf.slice(i + 1);
      let ev; try { ev = JSON.parse(line); } catch { continue; }
      const se = ev.type === 'stream_event' ? ev.event : null;
      if (se?.type === 'content_block_start' && se.content_block?.type === 'text' && sent) emit({ t: 'text', d: '\n\n' });
      if (se?.type === 'content_block_delta' && se.delta?.text) { emit({ t: 'text', d: se.delta.text }); sent = true; }
      if (ev.type === 'assistant') for (const b of ev.message?.content || []) {
        if (b.type !== 'tool_use') continue;
        const what = describe(b.name, b.input || {}, cwd);
        if (what) emit({ t: 'tool', d: what });
      }
      if (ev.type === 'result' && !sent && ev.result) emit({ t: 'text', d: String(ev.result) });
      if (ev.type === 'result' && ev.is_error) emit({ t: 'text', d: `\n\n[error: ${ev.result || ev.subtype}]` });
    }
  });
  child.stderr.on('data', (d) => { err += d; });
  child.on('close', (code) => {
    if (code && !sent) emit({ t: 'text', d: `[Claude did not answer (exit ${code}). ${err.slice(0, 300)}]` });
    if (!editing) return res.end();
    busyEdit.delete(c.slug);
    courses = discover();
    const targets = mode === 'home' ? courses.filter((x) => x.html) : [c];
    const next = (i, outs) => {
      if (i >= targets.length) { emit({ t: 'rebuilt', d: outs.join('\n') }); return res.end(); }
      execFile('python3', [path.join(here, 'build_html.py'), targets[i].root], (e, out) => {
        if (e) emit({ t: 'tool', d: `Rebuild of ${targets[i].cfg.title} failed: ` + String(e.message).slice(0, 160) });
        next(i + 1, e ? outs : [...outs, out.trim()]);
      });
    };
    next(0, []);
  });
  res.on('close', () => { if (child.exitCode === null) child.kill(); });
  child.stdin.end(prompt);
}

function createWorkspace(body, res) {
  const name = String(body.name || '').trim().replace(/[\\/:*?"<>|]/g, '').slice(0, 80);
  if (!name) { res.writeHead(400); return res.end('Name required'); }
  const dir = path.join(ROOT, name), apunte = path.join(dir, 'apunte');
  if (fs.existsSync(path.join(apunte, 'course.json'))) { res.writeHead(409); return res.end('A workspace with that name already exists.'); }
  fs.mkdirSync(path.join(apunte, 'lectures'), { recursive: true });
  const cfg = { title: name, language: body.language === 'es' ? 'es' : 'en', output_html: `${name} - Study guide.html`, max_words: 3500, max_image_px: 1000, exam: '', lectures: {} };
  fs.writeFileSync(path.join(apunte, 'course.json'), JSON.stringify(cfg, null, 1) + '\n');
  execFile('python3', [path.join(here, 'build_html.py'), apunte], () => {
    courses = discover();
    const c = courses.find((x) => x.root === apunte);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(c ? workspaceInfo(c) : { title: name }));
  });
}

const TYPES = { '.pdf': 'application/pdf', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.txt': 'text/plain; charset=utf-8', '.md': 'text/plain; charset=utf-8', '.json': 'application/json', '.mp4': 'video/mp4', '.html': 'text/html; charset=utf-8' };
const PANEL = read(path.join(here, 'estudio_panel.js'));
if (!PANEL) { console.error('estudio_panel.js is missing'); process.exit(1); }
const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://x');
  const parts = url.pathname.split('/').filter(Boolean).map(decodeURIComponent);
  if (!parts.length) {
    const data = { token: TOKEN, api: '/api', home: true, workspaces: courses.map(workspaceInfo) };
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
    return res.end(read(path.join(here, 'home.html')).replace('/*THEME*/', () => read(path.join(here, 'theme.css')))
      .replace('/*DATA*/', () => 'window.ESTUDIO=' + JSON.stringify(data).replace(/</g, '\\u003c') + ';').replace('/*PANEL*/', () => PANEL));
  }
  if (parts[0] === 'api') {
    if (req.method !== 'POST' || req.headers['x-estudio-token'] !== TOKEN) { res.writeHead(403); return res.end('token'); }
    let raw = '';
    req.on('data', (d) => { raw += d; if (raw.length > 2e5) req.destroy(); });
    req.on('end', () => {
      try {
        const body = JSON.parse(raw);
        if (parts[1] === 'list') { courses = discover(); res.writeHead(200, { 'Content-Type': 'application/json' }); return res.end(JSON.stringify(courses.map(workspaceInfo))); }
        if (parts[1] === 'workspaces') return createWorkspace(body, res);
        if (busyEdit.has('__home')) { res.writeHead(409); return res.end('Another request is still running.'); }
        runClaude({ slug: '__home', cwd: ROOT, cfg: { title: 'Workspaces' } }, 'home', SYSTEM.home(), buildPrompt(null, { ...body, mode: 'home' }), res, body);
      } catch (e) { res.writeHead(400); res.end(String(e.message)); }
    });
    return;
  }
  const c = courses.find((x) => x.slug === parts[0]);
  if (!c) { res.writeHead(404); return res.end('not found'); }
  if (!c.html && req.method === 'GET' && parts.length === 1) { res.writeHead(404); return res.end('This workspace has no HTML guide (no output_html in course.json).'); }
  if (req.method === 'GET' && parts.length === 1) {
    const page = read(c.html);
    if (!page) { res.writeHead(404); return res.end('Guide missing: run build_html.py'); }
    const cfg = `<script>window.ESTUDIO={token:${JSON.stringify(TOKEN)},api:${JSON.stringify('/' + c.slug + '/api')}};</script>`;
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
    return res.end(page.replace('</head>', () => cfg + '</head>').replace('</body>', () => `<script>${PANEL}</script></body>`));
  }
  if (req.method === 'GET') { // course files (slides, readings) linked from the guide
    const base = path.dirname(c.root), file = path.resolve(base, ...parts.slice(1));
    if (!file.startsWith(base + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) { res.writeHead(404); return res.end('not found'); }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream' });
    return fs.createReadStream(file).pipe(res);
  }
  if (req.method === 'POST' && parts[1] === 'api') {
    if (req.headers['x-estudio-token'] !== TOKEN) { res.writeHead(403); return res.end('token'); }
    let raw = '';
    req.on('data', (d) => { raw += d; if (raw.length > 2e5) req.destroy(); });
    req.on('end', () => {
      try {
        const body = JSON.parse(raw);
        const mode = ['ask', 'tutor', 'grade', 'edit'].includes(body.mode) ? body.mode : 'ask';
        if (mode === 'edit' && busyEdit.has(c.slug)) { res.writeHead(409); return res.end('An edit is already running for this course.'); }
        runClaude(c, mode, SYSTEM[mode](c), buildPrompt(c, { ...body, mode }), res, body);
      } catch (e) { res.writeHead(400); res.end(String(e.message)); }
    });
    return;
  }
  res.writeHead(404); res.end();
});
server.listen(PORT, '127.0.0.1', () => {
  const url = `http://localhost:${PORT}/`;
  console.log(`Study server at ${url} (default model ${MODEL}). Ctrl+C to stop.`);
  if (!process.env.NO_OPEN) execFile('open', [url]);
});
process.on('exit', () => fs.rmSync(EMPTY, { recursive: true, force: true }));
process.on('SIGINT', () => process.exit(0));
