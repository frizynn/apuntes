#!/usr/bin/env node
// Local study server: serves each course's study-guide HTML with a Claude side panel (ask, guided tutor, open-answer
// grading). Claude runs through the installed Claude Code CLI, so it uses whatever account the CLI is logged into.
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

const courses = process.argv.slice(2).map((dir) => {
  const root = path.resolve(dir);
  const cfg = JSON.parse(fs.readFileSync(path.join(root, 'course.json'), 'utf8'));
  const slug = cfg.title.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return { root, cfg, slug, html: path.join(root, '..', cfg.output_html) };
});
if (!courses.length) { console.error('usage: node estudio.mjs <course_dir> ...'); process.exit(2); }

const read = (p) => (fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : '');
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
{"q": "question text", "options": ["option A", "option B", "option C", "option D"]}
\`\`\`
Use 3-4 options when there is a clear answer to choose; omit "options" for an open question (the student writes the answer). Never reveal the correct answer in the block or before the student answers. Do not repeat the question in your prose: the block shows it. The student replies with their answer, a confidence (probability 0-100 that it is right, absent if they said "I don't know") and optionally their reasoning. Read confidence against correctness: right and confident = held, move on; right but unsure = fragile, one reinforcing touch; wrong and confident = a committed misconception, name it and repair it before anything else; wrong and unsure or "I don't know" = an honest gap, a small correction. Use their reasoning to find exactly where the thinking broke.`;
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

function buildPrompt(c, body) {
  const lec = /^l\d\d$/.test(body.lec || '') ? body.lec : null;
  const guide = lec ? lectureText(c, lec) : '';
  const ctx = `<guide>\n${guide || '(no lecture selected)'}\n</guide>\n\n<course_outline>\n${outline(c)}\n</course_outline>\n\n`;
  if (body.mode === 'grade') {
    const q = practiceItem(c, lec, 'open', Number(body.index));
    if (!q) throw new Error('question not found');
    return ctx + `<question>${q.q}</question>\n<points>\n- ${q.points.join('\n- ')}\n</points>\n<model_answer>${q.model}</model_answer>\n<student_answer>\n${String(body.answer || '').slice(0, 6000)}\n</student_answer>`;
  }
  const msgs = (body.messages || []).slice(-20).map((m) => `${m.role === 'user' ? 'STUDENT' : 'TUTOR'}: ${String(m.content).slice(0, 6000)}`).join('\n\n');
  const sel = body.selection ? `<selected_text>\n${String(body.selection).slice(0, 3000)}\n</selected_text>\n\n` : '';
  return ctx + sel + `<conversation>\n${msgs}\n</conversation>\n\nReply to the STUDENT's last message.`;
}

const MODELS = ['haiku', 'sonnet', 'opus'], EFFORTS = ['low', 'medium', 'high', 'xhigh', 'max'];
function runClaude(system, prompt, res, opts = {}) {
  const model = MODELS.includes(opts.model) ? opts.model : MODEL;
  const effort = EFFORTS.includes(opts.effort) ? opts.effort : null;
  const env = { ...process.env, CLAUDE_CODE_DISABLE_CLAUDE_MDS: '1' };
  delete env.ANTHROPIC_API_KEY; // force the CLI's own login (subscription), never an API key from this shell
  const child = spawn('claude', ['-p', '--model', model, ...(effort ? ['--effort', effort] : []), '--tools', '', '--strict-mcp-config', '--disable-slash-commands',
    '--no-session-persistence', '--setting-sources', '', '--system-prompt', system,
    '--output-format', 'stream-json', '--verbose', '--include-partial-messages'], { cwd: EMPTY, env });
  res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-cache' });
  let buf = '', sent = false, err = '';
  child.stdout.on('data', (d) => {
    buf += d;
    let i;
    while ((i = buf.indexOf('\n')) >= 0) {
      const line = buf.slice(0, i); buf = buf.slice(i + 1);
      try {
        const ev = JSON.parse(line);
        const t = ev.type === 'stream_event' && ev.event?.type === 'content_block_delta' ? ev.event.delta?.text : null;
        if (t) { res.write(t); sent = true; }
        if (ev.type === 'result' && !sent && ev.result) res.write(String(ev.result));
        if (ev.type === 'result' && ev.is_error) res.write(`\n\n[error: ${ev.result || ev.subtype}]`);
      } catch { /* non-JSON line */ }
    }
  });
  child.stderr.on('data', (d) => { err += d; });
  child.on('close', (code) => { if (code && !sent) res.write(`[Claude did not answer (exit ${code}). ${err.slice(0, 300)}]`); res.end(); });
  res.on('close', () => child.kill());
  child.stdin.end(prompt);
}

const PANEL = read(path.join(here, 'estudio_panel.js'));
if (!PANEL) { console.error('falta estudio_panel.js'); process.exit(1); }
const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://x');
  const parts = url.pathname.split('/').filter(Boolean);
  if (!parts.length) {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    return res.end(`<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Study</title><body style="font:16px/1.6 -apple-system,system-ui,sans-serif;max-width:560px;margin:48px auto;padding:0 16px"><h1 style="font-weight:600">Study guides</h1>${courses.map((c) => `<p><a href="/${c.slug}/" style="color:#c96442">${c.cfg.title}</a></p>`).join('')}</body>`);
  }
  const c = courses.find((x) => x.slug === parts[0]);
  if (!c) { res.writeHead(404); return res.end('no existe'); }
  if (req.method === 'GET' && parts.length === 1) {
    const page = read(c.html);
    if (!page) { res.writeHead(404); return res.end('Guide missing: run build_html.py'); }
    const cfg = `<script>window.ESTUDIO={token:${JSON.stringify(TOKEN)},api:${JSON.stringify('/' + c.slug + '/api')}};</script>`;
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    return res.end(page.replace('</head>', () => cfg + '</head>').replace('</body>', () => `<script>${PANEL}</script></body>`));
  }
  if (req.method === 'POST' && parts[1] === 'api') {
    if (req.headers['x-estudio-token'] !== TOKEN) { res.writeHead(403); return res.end('token'); }
    let raw = '';
    req.on('data', (d) => { raw += d; if (raw.length > 2e5) req.destroy(); });
    req.on('end', () => {
      try {
        const body = JSON.parse(raw);
        const mode = ['ask', 'tutor', 'grade'].includes(body.mode) ? body.mode : 'ask';
        runClaude(SYSTEM[mode](c), buildPrompt(c, { ...body, mode }), res, body);
      } catch (e) { res.writeHead(400); res.end(String(e.message)); }
    });
    return;
  }
  res.writeHead(404); res.end();
});
server.listen(PORT, '127.0.0.1', () => {
  const url = `http://localhost:${PORT}/` + (courses.length === 1 ? courses[0].slug + '/' : '');
  console.log(`Study server at ${url} (default model ${MODEL}). Ctrl+C to stop.`);
  if (!process.env.NO_OPEN) execFile('open', [url]);
});
process.on('exit', () => fs.rmSync(EMPTY, { recursive: true, force: true }));
process.on('SIGINT', () => process.exit(0));
