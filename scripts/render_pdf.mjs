// Render the assembled notes markdown to an A4 PDF and print its page count.
// Usage: node render_pdf.mjs <notes.md> <out.pdf>
import { createRequire } from 'module';
import { execSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';

const DEPS = path.join(os.homedir(), '.cache', 'apunte-clase');
for (const dep of ['playwright@1', 'marked@15']) {
  if (!fs.existsSync(path.join(DEPS, 'node_modules', dep.split('@')[0]))) {
    fs.mkdirSync(DEPS, { recursive: true });
    execSync(`npm install --silent --prefix "${DEPS}" ${dep}`, { stdio: 'inherit' });
  }
}
const req = createRequire(path.join(DEPS, 'x.js'));
const { chromium } = req('playwright');
const { marked } = req('marked');

const [src, out] = process.argv.slice(2);
// Give headings ids and build a clickable index of lectures and their main topics.
let n = 0;
const toc = [];
const renderer = {
  heading({ tokens, depth }) {
    const text = this.parser.parseInline(tokens);
    const id = 'h' + (++n);
    if (depth === 1 && n > 1) toc.push(`<li class="l1"><a href="#${id}">${text}</a></li>`);
    if (depth === 2) toc.push(`<li class="l2"><a href="#${id}">${text}</a></li>`);
    return `<h${depth} id="${id}">${text}</h${depth}>`;
  },
};
marked.use({ renderer });
const bodyHtml = marked.parse(fs.readFileSync(src, 'utf8'));
const tocHtml = `<nav><h2>Contents</h2><ul>${toc.join('')}</ul></nav>`;
const html = `<!doctype html><meta charset="utf-8"><style>
  body { font: 10.5pt/1.45 Georgia, serif; margin: 0; color: #111; }
  h1 { font-size: 18pt; page-break-before: always; margin-top: 0; }
  h1:first-of-type { page-break-before: avoid; }
  h2 { font-size: 13.5pt; margin: 1.2em 0 .4em; }
  h3 { font-size: 11.5pt; margin: 1em 0 .3em; }
  p, li { margin: .35em 0; }
  img { display: block; max-width: 8cm; max-height: 7cm; margin: .6em auto; }
  table { border-collapse: collapse; font-size: 9.5pt; margin: .6em 0; }
  td, th { border: 1px solid #bbb; padding: 3px 6px; vertical-align: top; }
  nav { page-break-after: always; } nav ul { list-style: none; padding: 0; font-size: 9.5pt; }
  nav .l1 { font-weight: bold; margin-top: .5em; } nav .l2 { margin-left: 1.2em; } nav a { color: #111; text-decoration: none; }
  body > ul:first-of-type { display: none; }
</style>${bodyHtml.replace(/(<\/h1>[\s\S]*?<\/p>)/, m => m + tocHtml)}`;

function browserPath() {
  const root = path.join(os.homedir(), 'Library', 'Caches', 'ms-playwright');
  if (!fs.existsSync(root)) return undefined;
  return execSync(`find "${root}" -type f -perm +111 -path '*MacOS*' \\( -name 'Google Chrome for Testing' -o -name 'Chromium' \\) | head -1`).toString().trim() || undefined;
}
const browser = await chromium.launch({ headless: true, executablePath: browserPath() });
const page = await browser.newPage();
await page.setContent(html, { waitUntil: 'load' });
await page.pdf({ path: out, format: 'A4', outline: true, tagged: true, margin: { top: '18mm', bottom: '18mm', left: '18mm', right: '18mm' } });
await browser.close();
const pages = execSync(`pdfinfo "${out}"`).toString().match(/Pages:\s+(\d+)/)[1];
console.log(`${out}: ${pages} pages`);
