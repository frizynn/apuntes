// Sync a Canvas course into <course_dir>/sources/canvas and optionally pull Panopto audio.
// Usage: node canvas_sync.mjs <course_dir> [--audio LNN ...]
// Credentials come from the macOS Keychain (service = host of course.json "canvas", e.g. canvas.vu.nl); nothing
// secret is printed or written. The login step handles a Microsoft SSO form; other universities may need to adapt it.
import { createRequire } from 'module';
import { execFileSync, execSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';

const DEPS = path.join(os.homedir(), '.cache', 'apuntes');
if (!fs.existsSync(path.join(DEPS, 'node_modules', 'playwright'))) {
  fs.mkdirSync(DEPS, { recursive: true });
  execSync('npm install --silent --prefix "' + DEPS + '" playwright@1', { stdio: 'inherit' });
}
const { chromium } = createRequire(path.join(DEPS, 'x.js'))('playwright');

const courseDir = path.resolve(process.argv[2] || '.');
const audioFor = process.argv.slice(3).filter(a => a !== '--audio');
const cfg = JSON.parse(fs.readFileSync(path.join(courseDir, 'course.json'), 'utf8'));
const out = path.join(courseDir, 'sources', 'canvas');
for (const d of ['files', 'pages']) fs.mkdirSync(path.join(out, d), { recursive: true });

const secret = (args) => execFileSync('security', ['find-generic-password', ...args, '-w']).toString().trim();
const host = new URL(cfg.canvas).host;
const user = execFileSync('security', ['find-generic-password', '-s', host]).toString().match(/"acct"<blob>="([^"]+)"/)[1];
const pass = secret(['-s', host]);

function browserPath() {
  const root = path.join(os.homedir(), 'Library', 'Caches', 'ms-playwright');
  if (!fs.existsSync(root)) return undefined;
  const hit = execSync(`find "${root}" -type f -perm +111 -path '*MacOS*' \\( -name 'Google Chrome for Testing' -o -name 'Chromium' \\) | head -1`).toString().trim();
  return hit || undefined;
}

const browser = await chromium.launch({ headless: true, executablePath: browserPath() });
const ctx = await browser.newContext();
const page = await ctx.newPage();
await page.goto(`${cfg.canvas}/courses/${cfg.course_id}/modules`, { waitUntil: 'domcontentloaded' });
if (!page.url().startsWith(cfg.canvas + '/courses')) {
  await page.click('text=Met een VUnetID').catch(() => page.click('text=With a VUnetID'));
  await page.waitForLoadState('networkidle').catch(() => {});
  await page.locator('input[type=email], input[name=UserName], input#username').first().fill(user);
  const pw = page.locator('input[type=password]').first();
  if (!(await pw.isVisible().catch(() => false))) { await page.keyboard.press('Enter'); await page.waitForTimeout(3000); }
  await pw.fill(pass);
  await page.keyboard.press('Enter');
  await page.waitForURL(u => u.toString().startsWith(cfg.canvas + '/courses'), { timeout: 60000 });
}
console.log('canvas login ok');

const api = async (u) => JSON.parse((await (await ctx.request.get(cfg.canvas + u)).text()).replace(/^while\(1\);/, ''));
const modules = await api(`/api/v1/courses/${cfg.course_id}/modules?include[]=items&per_page=100`);
const index = { synced_at: new Date().toISOString(), pages: [], files: {} };
const fileIds = new Set();
for (const m of modules) for (const it of m.items || []) {
  if (it.type === 'File') fileIds.add(String(it.content_id));
  if (it.type !== 'Page') continue;
  const pg = await api(`/api/v1/courses/${cfg.course_id}/pages/${it.page_url}`);
  const html = pg.body || '';
  const ids = [...html.matchAll(/files\/(\d+)/g)].map(x => x[1]);
  ids.forEach(i => fileIds.add(i));
  const panopto = [...new Set([...html.matchAll(/Viewer\.aspx\?id=([0-9a-f-]{36})/gi)].map(x => x[1]))];
  const links = [...html.matchAll(/href="(https?:[^"]+)"/g)].map(x => x[1]).filter(h => !h.includes(cfg.canvas));
  const text = html.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
  fs.writeFileSync(path.join(out, 'pages', it.page_url.slice(0, 80) + '.txt'), `${it.title}\n\n${text}\n\nLinks:\n${links.join('\n')}\n`);
  index.pages.push({ module: m.name, title: it.title, file_ids: ids, panopto, links });
}
for (const id of fileIds) {
  const meta = await api(`/api/v1/courses/${cfg.course_id}/files/${id}`);
  if (!meta.url) continue;
  const dest = path.join(out, 'files', meta.display_name.replace(/\//g, '_'));
  const isNew = !(fs.existsSync(dest) && fs.statSync(dest).size === meta.size);
  if (isNew) fs.writeFileSync(dest, await (await ctx.request.get(meta.url)).body());
  index.files[id] = { name: meta.display_name, created_at: meta.created_at, size: meta.size };
  if (isNew) console.log('NEW', meta.display_name);
}
fs.writeFileSync(path.join(out, 'index.json'), JSON.stringify(index, null, 1));
console.log(`pages ${index.pages.length}, files ${Object.keys(index.files).length}`);

if (audioFor.length) {
  const tool = (await api(`/api/v1/courses/${cfg.course_id}/tabs`)).find(t => /panopto/i.test(t.label || ''));
  if (tool) { await page.goto(cfg.canvas + tool.html_url, { waitUntil: 'networkidle' }).catch(() => {}); await page.waitForTimeout(6000); }
  const audioDir = path.join(courseDir, 'sources', 'audio');
  fs.mkdirSync(audioDir, { recursive: true });
  for (const key of audioFor) {
    const id = cfg.lectures[key.replace(/^L/, '')]?.video_panopto;
    if (!id) { console.log(`no video_panopto for ${key} in course.json`); continue; }
    await page.goto(`${cfg.panopto}/Panopto/Pages/Viewer.aspx?id=${id}`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    const info = await page.evaluate(async id => (await fetch('/Panopto/Pages/Viewer/DeliveryInfo.aspx', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: `deliveryId=${id}&isEmbed=false&responseType=json` })).json(), id);
    const url = info.Delivery?.PodcastStreams?.[0]?.StreamUrl || info.Delivery?.Streams?.[0]?.StreamUrl;
    if (!url) { console.log(`no stream for ${key}`); continue; }
    const mp3 = path.join(audioDir, `${key.startsWith('L') ? key : 'L' + key}.mp3`);
    execFileSync('ffmpeg', ['-nostdin', '-loglevel', 'error', '-y', '-i', url, '-vn', '-ac', '1', '-ar', '16000', '-c:a', 'libmp3lame', '-b:a', '32k', mp3]);
    console.log('audio', mp3, Math.round(info.Delivery.Duration / 60), 'min');
  }
}
await browser.close();
