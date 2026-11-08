#!/usr/bin/env node
// Render a guide diagram (SVG using the diagram classes) to PNG in light and dark, so its author can look at it.
// Usage: node render_svg.mjs <diagram.svg> <out_prefix>   -> <out_prefix>-light.png, <out_prefix>-dark.png
import { createRequire } from 'module';
import { execSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';

const DEPS = path.join(os.homedir(), '.cache', 'apuntes');
if (!fs.existsSync(path.join(DEPS, 'node_modules', 'playwright'))) {
  fs.mkdirSync(DEPS, { recursive: true });
  execSync('npm install --silent --prefix "' + DEPS + '" playwright@1', { stdio: 'inherit' });
}
const { chromium } = createRequire(path.join(DEPS, 'x.js'))('playwright');
const here = path.dirname(fileURLToPath(import.meta.url));
const [svgPath, out] = process.argv.slice(2);
const svg = fs.readFileSync(svgPath, 'utf8').replace(/<\?xml[^>]*>/, '');
const page = `<!doctype html><html><head><style>${fs.readFileSync(path.join(here, 'theme.css'), 'utf8')}
body{margin:0;background:var(--bg);font:16px Inter,-apple-system,system-ui,sans-serif;padding:24px;width:740px}</style></head>
<body><figure class="dg" style="margin:0">${svg}</figure></body></html>`;
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 800, height: 600 }, deviceScaleFactor: 2 });
for (const theme of ['light', 'dark']) {
  await p.setContent(page.replace('<html>', `<html data-theme="${theme}">`));
  await p.locator('figure').screenshot({ path: `${out}-${theme}.png` });
}
await b.close();
console.log(`${out}-light.png ${out}-dark.png`);
