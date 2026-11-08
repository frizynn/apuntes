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

const STYLE = 'Escribís en español rioplatense (vos), simple y directo, frases cortas. Los términos del examen van en inglés la primera vez, con su explicación. Sin em dash. Formato: párrafos cortos, listas con "- " sólo si son listas de verdad, **negrita** sólo para el término clave.';
const SYSTEM = {
  ask: (c) => `Sos el tutor de la materia "${c.cfg.title}" de un alumno de intercambio en la VU Amsterdam. ${STYLE} Respondé primero con lo que dice la guía de estudio (abajo, entre <guia>). Si la respuesta no está en la guía, decilo en una línea y después respondé con conocimiento general, marcado como tal. Nunca inventes estudios, autores ni números. Respuestas breves: lo justo para entender, con un ejemplo si ayuda. Examen: ${c.cfg.exam || ''}`,
  tutor: (c) => `Sos un tutor que enseña paso a paso la materia "${c.cfg.title}". ${STYLE} Modo guiado: 1) si es el inicio, preguntá qué sabe el alumno del tema en una pregunta corta; 2) explicá UN paso por mensaje, apoyándote en lo que ya entiende; 3) cerrá cada mensaje con UNA pregunta corta para chequear (de aplicación a un caso cuando se pueda), y esperá; 4) si responde mal, corregí la confusión antes de avanzar; si responde bien, avanzá. La meta es que entienda la clase de la guía (abajo, entre <guia>). No inventes nada que no esté en la guía.`,
  grade: (c) => `Corregís una respuesta abierta de examen de "${c.cfg.title}". ${STYLE} Usá la guía (entre <guia>), los puntos que busca el corrector y la respuesta modelo. Devolvé exactamente estas partes: **Nota estimada:** X/10 y una línea de por qué. **Lo que cubriste:** lista. **Lo que falta o está mal:** lista, con la corrección. **Versión mejorada:** la respuesta del alumno reescrita en inglés, 120-200 palabras, manteniendo sus ideas correctas. Sé justo: no premies largo, premiá los puntos.`,
};

function buildPrompt(c, body) {
  const lec = /^l\d\d$/.test(body.lec || '') ? body.lec : null;
  const guide = lec ? lectureText(c, lec) : '';
  const ctx = `<guia>\n${guide || '(sin clase seleccionada)'}\n</guia>\n\n<indice_de_la_materia>\n${outline(c)}\n</indice_de_la_materia>\n\n`;
  if (body.mode === 'grade') {
    const q = practiceItem(c, lec, 'open', Number(body.index));
    if (!q) throw new Error('pregunta no encontrada');
    return ctx + `<pregunta>${q.q}</pregunta>\n<puntos>\n- ${q.points.join('\n- ')}\n</puntos>\n<modelo>${q.model}</modelo>\n<respuesta_del_alumno>\n${String(body.answer || '').slice(0, 6000)}\n</respuesta_del_alumno>`;
  }
  const msgs = (body.messages || []).slice(-20).map((m) => `${m.role === 'user' ? 'ALUMNO' : 'TUTOR'}: ${String(m.content).slice(0, 4000)}`).join('\n\n');
  const sel = body.selection ? `<texto_seleccionado>\n${String(body.selection).slice(0, 3000)}\n</texto_seleccionado>\n\n` : '';
  return ctx + sel + `<conversacion>\n${msgs}\n</conversacion>\n\nRespondé al último mensaje del ALUMNO.`;
}

function runClaude(system, prompt, res) {
  const env = { ...process.env, CLAUDE_CODE_DISABLE_CLAUDE_MDS: '1' };
  delete env.ANTHROPIC_API_KEY; // force the CLI's own login (subscription), never an API key from this shell
  const child = spawn('claude', ['-p', '--model', MODEL, '--tools', '', '--strict-mcp-config', '--disable-slash-commands',
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
  child.on('close', (code) => { if (code && !sent) res.write(`[Claude no respondió (código ${code}). ${err.slice(0, 300)}]`); res.end(); });
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
    return res.end(`<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Estudio</title><body style="font:16px/1.6 -apple-system,system-ui,sans-serif;max-width:560px;margin:48px auto;padding:0 16px"><h1 style="font-weight:600">Estudio</h1>${courses.map((c) => `<p><a href="/${c.slug}/" style="color:#c96442">${c.cfg.title}</a></p>`).join('')}</body>`);
  }
  const c = courses.find((x) => x.slug === parts[0]);
  if (!c) { res.writeHead(404); return res.end('no existe'); }
  if (req.method === 'GET' && parts.length === 1) {
    const page = read(c.html);
    if (!page) { res.writeHead(404); return res.end('Falta la guía: corré build_html.py'); }
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
        runClaude(SYSTEM[mode](c), buildPrompt(c, { ...body, mode }), res);
      } catch (e) { res.writeHead(400); res.end(String(e.message)); }
    });
    return;
  }
  res.writeHead(404); res.end();
});
server.listen(PORT, '127.0.0.1', () => {
  const url = `http://localhost:${PORT}/` + (courses.length === 1 ? courses[0].slug + '/' : '');
  console.log(`Estudio en ${url} (modelo ${MODEL}). Ctrl+C para cortar.`);
  if (!process.env.NO_OPEN) execFile('open', [url]);
});
process.on('exit', () => fs.rmSync(EMPTY, { recursive: true, force: true }));
process.on('SIGINT', () => process.exit(0));
