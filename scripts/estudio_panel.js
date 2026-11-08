// Chat sidebar injected by estudio.mjs into a study guide. Talks only to the local server.
(() => {
  const E = window.ESTUDIO;
  if (!E) return;
  const HOME = !!E.home; // mounted inline on the workspace home instead of as the guide's sidebar
  const css = `
  #ep{position:fixed;z-index:7;top:48px;left:0;bottom:0;width:var(--ep-w,380px);background:var(--bg);display:flex;flex-direction:column;font-size:14px;line-height:20px;box-shadow:1px 0 0 var(--line);transform:translateX(-100%);visibility:hidden;transition:transform .22s cubic-bezier(.2,0,0,1),width .26s cubic-bezier(.2,0,0,1),visibility 0s .22s}
  body.ep-on #ep{transform:none;visibility:visible;transition:transform .22s cubic-bezier(.2,0,0,1),width .26s cubic-bezier(.2,0,0,1)}
  body.ep-full #ep{width:100vw}body.ep-full #ep .msgs>*,body.ep-full #ep form,body.ep-full #ep .hd,body.ep-full #ep .plan{width:min(760px,100% - 32px);margin-left:auto;margin-right:auto}
  body.ep-drag #ep,body.ep-drag main,body.ep-drag #exam{transition:none!important;user-select:none}
  main,#exam{transition:margin-left .26s cubic-bezier(.2,0,0,1),max-width .26s cubic-bezier(.2,0,0,1)}
  #ep .rs{position:absolute;top:0;right:-4px;bottom:0;width:8px;cursor:col-resize;z-index:2}#ep .rs:hover,body.ep-drag #ep .rs{background:linear-gradient(90deg,transparent 3px,var(--acc) 3px,var(--acc) 5px,transparent 5px)}
  body.ep-full #ep .rs,#ep.inline .rs{display:none}
  @media (min-width:1180px){body.ep-on main{margin-left:max(calc(var(--ep-w,380px) + 24px),calc((100vw - 740px)/2));margin-right:auto;max-width:min(740px,calc(100vw - var(--ep-w,380px) - 334px))}body.ep-on.toc-off main{max-width:min(740px,calc(100vw - var(--ep-w,380px) - 48px))}body.ep-on #exam{margin-left:max(calc(var(--ep-w,380px) + 24px),calc((100vw - 740px)/2));margin-right:auto;max-width:min(740px,calc(100vw - var(--ep-w,380px) - 48px))}}
  @media (max-width:1179px){#ep{width:100%}}
  #ep.inline{position:relative;top:auto;left:auto;bottom:auto;width:100%;height:100%;transform:none;visibility:visible;box-shadow:none;background:transparent;transition:none}
  #ep.inline .hd,#ep.inline .ctx{display:none}#ep.inline .msgs{padding:24px 4px}#ep.inline form{margin:0 0 16px}
  #ep .hd{display:flex;align-items:center;gap:6px;padding:10px 12px 6px}
  #ep .hd .ttl{flex:1;min-width:0;color:var(--mute);font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  #ep .ic{width:28px;height:28px;border:0;background:none;border-radius:8px;color:var(--mute);cursor:pointer;display:grid;place-items:center}
  #ep .ic:hover{background:var(--hover);color:var(--fg)}
  #ep .ctx{display:none;padding:0 16px 8px;color:var(--mute);font-size:12px;line-height:16px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;box-shadow:0 1px 0 var(--line)}
  #ep .plan{display:none;padding:8px 16px;font-size:12px;line-height:18px;box-shadow:0 1px 0 var(--line);color:var(--mute)}
  #ep .plan.show{display:block}#ep .plan ol{margin:0;padding-left:18px}#ep .plan li.cur{color:var(--fg);font-weight:550}#ep .plan li.done{text-decoration:line-through}
  #ep .msgs{flex:1;overflow-y:auto;padding:16px;overscroll-behavior:contain}
  #ep .m{margin:0 0 16px}#ep .m.new{animation:ep-in .16s cubic-bezier(.2,0,0,1)}
  #ep .m.u{margin-left:auto;max-width:85%;width:fit-content;background:color-mix(in oklab,var(--acc),var(--bg) 85%);border-radius:14px;padding:8px 12px;white-space:pre-wrap}
  #ep .m.e{color:var(--mute)}
  #ep .tools{margin:0 0 8px;color:var(--mute);font-size:12px;line-height:17px}
  #ep .tools div{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}#ep .tools div:before{content:"· "}
  #ep .tools summary{cursor:pointer;list-style:none}#ep .tools summary::-webkit-details-marker{display:none}
  #ep .reload{margin-top:10px;height:30px;padding:0 14px;border:0;border-radius:15px;background:var(--fg);color:var(--on-fg);font:inherit;font-size:13px;cursor:pointer}
  #ep .m p{margin:0}#ep .m p+p,#ep .m p+ul,#ep .m ul+p{margin-top:8px}#ep .m ul{margin:6px 0 0;padding-left:18px}#ep .m li{margin:2px 0}
  @keyframes ep-in{from{opacity:0;transform:translateY(6px)}}
  .ep-think{display:inline-block;color:transparent;background:linear-gradient(90deg,var(--mute) 0%,var(--fg) 50%,var(--mute) 100%);background-size:300% 100%;-webkit-background-clip:text;background-clip:text;animation:ep-sh 1.6s linear infinite}
  @keyframes ep-sh{from{background-position:100% 0}to{background-position:0 0}}
  @media (prefers-reduced-motion:reduce){#ep,#ep .m.new{transition:none;animation:none}.ep-think{animation:none;color:var(--mute)}}
  #ep .card{margin-top:12px;border-radius:14px;padding:14px;background:var(--card);box-shadow:0 0 0 1px var(--line)}
  #ep .card .qq{font-weight:550;margin-bottom:10px}
  #ep .card .op{display:flex;align-items:flex-start;gap:10px;width:100%;text-align:left;font:inherit;font-size:14px;color:var(--fg);background:var(--surface);border:0;border-radius:10px;box-shadow:0 0 0 1px var(--line);padding:9px 10px;margin:7px 0;cursor:pointer;transition:box-shadow .08s,background .12s,transform .08s}
  #ep .card .op:hover:not(:disabled){box-shadow:0 0 0 1px var(--acc)}#ep .card .op:active:not(:disabled){transform:scale(.99)}
  #ep .card .op .k{flex:none;width:22px;height:22px;border-radius:11px;display:grid;place-items:center;font-size:12px;font-weight:600;background:color-mix(in oklab,var(--acc),var(--bg) 82%);color:var(--acc);transition:background .12s,color .12s}
  #ep .card .op:disabled{cursor:default}
  #ep .card .op.right{background:var(--ok-bg);box-shadow:0 0 0 1.5px var(--ok)}#ep .card .op.right .k{background:var(--ok);color:var(--bg)}
  #ep .card .op.wrong{background:var(--bad-bg);box-shadow:0 0 0 1.5px var(--bad)}#ep .card .op.wrong .k{background:var(--bad);color:var(--bg)}
  #ep .card .op.dim{opacity:.55}
  #ep .card .conf{display:flex;align-items:center;gap:4px;flex-wrap:wrap;margin:2px 0 4px;font-size:12px;color:var(--mute)}
  #ep .card .conf button{height:24px;padding:0 9px;border:0;border-radius:12px;background:var(--hover);color:var(--mute);font:inherit;font-size:12px;cursor:pointer}
  #ep .card .conf button.on{background:var(--fg);color:var(--on-fg)}
  #ep .card .res{margin-top:10px;font-size:14px;line-height:1.5;animation:ep-in .2s cubic-bezier(.2,0,0,1)}#ep .card .res b.ok{color:var(--ok)}#ep .card .res b.no{color:var(--bad)}
  #ep .card details{margin-top:6px;font-size:13px;color:var(--mute)}#ep .card summary{cursor:pointer}
  #ep .card textarea{width:100%;min-height:52px;border:0;border-radius:8px;box-shadow:0 0 0 1px var(--line);padding:7px 10px;font:inherit;font-size:14px;resize:vertical;background:var(--surface);color:var(--fg);margin-top:6px}
  #ep .card .go{margin-top:10px;height:32px;padding:0 14px;border:0;border-radius:16px;background:var(--fg);color:var(--on-fg);font:inherit;font-size:13px;cursor:pointer}
  #ep .card .go:disabled{opacity:.3;cursor:default}
  #ep .sel{margin:0 16px 8px;font-size:12px;line-height:16px;color:var(--mute);display:none;align-items:center;gap:6px}
  #ep .sel span{flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  #ep .sel button{border:0;background:none;color:var(--mute);cursor:pointer}
  #ep form{position:relative;margin:0 12px 12px;border-radius:14px;background:var(--surface);box-shadow:0 0 0 1px var(--line),0 1px 1px rgba(0,0,0,.04);transition:box-shadow .08s}
  #ep form:hover{box-shadow:0 0 0 1px var(--line2),0 1px 1px rgba(0,0,0,.04)}#ep form:focus-within{box-shadow:0 0 0 1px color-mix(in oklab,var(--fg),transparent 70%),0 1px 1px rgba(0,0,0,.04)}
  #ep form textarea{display:block;width:100%;border:0;outline:0;background:none;color:var(--fg);resize:none;font:inherit;font-size:14px;line-height:20px;padding:10px 12px 2px;max-height:200px}
  #ep form .row{display:flex;align-items:center;gap:0;padding:2px 6px 6px}
  #ep .pick{white-space:nowrap;height:26px;padding:0 7px;border:0;background:none;border-radius:7px;color:var(--mute);font:inherit;font-size:12px;cursor:pointer;display:inline-flex;align-items:center;gap:3px;transition:background .08s,color .08s}
  #ep .pick:hover,#ep .pick.on{background:var(--hover);color:var(--fg)}#ep .pick svg{width:10px;height:10px;opacity:.6}
  #ep .menu{position:absolute;left:6px;bottom:calc(100% + 6px);z-index:3;min-width:200px;background:var(--surface);border-radius:12px;padding:4px;box-shadow:0 0 0 1px var(--hover2),0 10px 28px var(--shadow);animation:ep-pop .12s cubic-bezier(.2,0,0,1);transform-origin:bottom left}
  #ep .menu button{display:flex;width:100%;align-items:baseline;gap:8px;border:0;background:none;border-radius:8px;padding:6px 10px;font:inherit;font-size:13px;color:var(--fg);cursor:pointer;text-align:left}
  #ep .menu button:hover{background:var(--hover)}#ep .menu small{color:var(--mute);font-size:12px;margin-left:auto}
  #ep .menu button.on{font-weight:550}
  @keyframes ep-pop{from{opacity:0;transform:scale(.96) translateY(4px)}}
  @media (pointer:coarse){#ep textarea{font-size:16px!important}}
  #ep form .send{margin-left:auto;width:30px;height:30px;border:0;border-radius:15px;background:var(--fg);color:var(--on-fg);cursor:pointer;display:grid;place-items:center}
  #ep form .send:disabled{opacity:.25;cursor:default}
  #ep .att{display:none;gap:6px;padding:10px 10px 0;flex-wrap:wrap}#ep .att.show{display:flex}
  #ep .att span{position:relative;width:56px;height:56px;border-radius:8px;overflow:hidden;box-shadow:inset 0 0 0 1px var(--hover2)}
  #ep .att img{width:100%;height:100%;object-fit:cover;display:block}
  #ep .att button{position:absolute;top:2px;right:2px;width:18px;height:18px;border:0;border-radius:9px;background:rgba(0,0,0,.6);color:#fff;font-size:11px;line-height:18px;cursor:pointer;padding:0}
  #ep form.drop{box-shadow:0 0 0 1.5px var(--acc)}
  #ep .clip{width:26px;height:26px;border:0;background:none;border-radius:7px;color:var(--mute);cursor:pointer;display:grid;place-items:center}#ep .clip:hover{background:var(--hover);color:var(--fg)}
  #ep .m.u .thumbs{display:flex;gap:4px;margin-bottom:6px;flex-wrap:wrap}#ep .m.u .thumbs img{width:56px;height:56px;object-fit:cover;border-radius:6px}
  #ep .m figure.dg{margin:10px 0;padding:10px;border-radius:12px}#ep .m figure.dg svg{max-height:none}
  #ep-ask{position:absolute;z-index:9;display:none;height:28px;padding:0 12px;border:0;border-radius:14px;background:var(--fg);color:var(--on-fg);font:inherit;font-size:12px;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,.15)}
  `;
  document.head.append(Object.assign(document.createElement('style'), { textContent: css }));

  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const inline = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<i>$2</i>');
  const md = (s) => s.trim().split(/\n{2,}/).map((b) => {
    const lines = b.split('\n');
    if (lines.every((l) => /^\s*([-*]|\d+\.)\s/.test(l) || !l.trim()))
      return '<ul>' + lines.filter((l) => l.trim()).map((l) => '<li>' + inline(l.replace(/^\s*([-*]|\d+\.)\s/, '')) + '</li>').join('') + '</ul>';
    return '<p>' + lines.map(inline).join('<br>') + '</p>';
  }).join('');
  // Split an assistant message into prose, an optional plan and an optional quiz. A block still streaming is hidden.
  function parse(text) {
    const out = { text, plan: null, quiz: null };
    const grab = (name) => {
      const m = out.text.match(new RegExp('```' + name + '\\s*([\\s\\S]*?)```'));
      if (!m) return null;
      out.text = out.text.replace(m[0], '');
      try { return JSON.parse(m[1]); } catch { return null; }
    };
    out.plan = grab('plan'); out.quiz = grab('quiz');
    out.svgs = [];
    out.text = out.text.replace(/```svg\s*([\s\S]*?)```/g, (_, code) => { out.svgs.push(code); return `\n\n§DG${out.svgs.length - 1}§\n\n`; });
    const open = out.text.indexOf('```');
    if (open >= 0) out.text = out.text.slice(0, open);
    return out;
  }

  // Diagrams Claude draws in a reply: parsed as SVG and stripped of anything active before being shown.
  function safeSvg(code) {
    const doc = new DOMParser().parseFromString(code.trim(), 'image/svg+xml');
    const svg = doc.documentElement;
    if (svg.nodeName !== 'svg' || doc.querySelector('parsererror')) return '';
    svg.querySelectorAll('script,foreignObject,iframe,image,use[href^="http"]').forEach((n) => n.remove());
    for (const n of [svg, ...svg.querySelectorAll('*')]) for (const a of [...n.attributes]) {
      if (/^on/i.test(a.name) || a.name === 'style' || (/href$/i.test(a.name) && !a.value.startsWith('#'))) n.removeAttribute(a.name);
    }
    svg.removeAttribute('width'); svg.removeAttribute('height');
    return '<figure class="dg">' + new XMLSerializer().serializeToString(svg) + '</figure>';
  }
  const icon = (d) => `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
  const ep = document.createElement('aside');
  ep.id = 'ep';
  ep.innerHTML = `<div class="rs" title="Drag to resize"></div><div class="hd"><span class="ttl"></span>
      <button class="ic" data-act="new" title="New chat" aria-label="New chat">${icon('<path d="M8 3.5v9M3.5 8h9"/>')}</button>
      <button class="ic" data-act="full" title="Expand" aria-label="Expand">${icon('<path d="M9.5 2.5h4v4M13.5 2.5 9 7M6.5 13.5h-4v-4M2.5 13.5 7 9"/>')}</button></div>
    <div class="ctx"></div><div class="plan"></div><div class="msgs"></div><div class="sel"><span></span><button type="button" aria-label="Clear">✕</button></div>
    <form><div class="att"></div><input type="file" accept="image/*" multiple hidden><textarea rows="1" placeholder="Ask about this lecture"></textarea><div class="row"><button type="button" class="clip" title="Attach images (or paste / drop them)" aria-label="Attach images">${icon('<path d="M13 7.5 8 12.5a3 3 0 0 1-4.2-4.2L9 3.1a2 2 0 0 1 2.8 2.8L6.7 11a1 1 0 0 1-1.4-1.4L10 4.9"/>')}</button><button type="button" class="pick" data-k="mode"></button><button type="button" class="pick" data-k="model"></button><button type="button" class="pick" data-k="effort"></button><button class="send" aria-label="Send" disabled>${icon('<path d="M8 13V3M3.5 7.5 8 3l4.5 4.5"/>')}</button></div></form>`;
  const toggle = document.createElement('button');
  toggle.className = 'b'; toggle.title = 'Chat'; toggle.setAttribute('aria-label', 'Chat');
  toggle.innerHTML = icon('<rect x="2" y="2.5" width="12" height="11" rx="2"/><path d="M6 2.5v11"/>') + '<span>Chat</span>';
  const askSel = Object.assign(document.createElement('button'), { id: 'ep-ask', textContent: 'Ask about this' });
  if (HOME) { ep.classList.add('inline'); document.getElementById('home-chat').append(ep); }
  else {
    document.body.append(ep, askSel);
    const home = Object.assign(document.createElement('a'), { className: 'b', href: '/', title: 'Workspaces' });
    home.setAttribute('aria-label', 'Workspaces');
    home.innerHTML = icon('<path d="M2.5 7 8 2.5 13.5 7M4 6v7.5h8V6"/>');
    (document.getElementById('barl') || document.querySelector('nav.bar')).append(home, toggle);
  }
  const $ = (s) => ep.querySelector(s);

  const store = {
    get(k, d) { try { const v = localStorage.getItem('ep:' + k); return v == null ? d : JSON.parse(v); } catch { return d; } },
    set(k, v) { try { localStorage.setItem('ep:' + k, JSON.stringify(v)); } catch { /* storage blocked */ } },
  };
  const course = location.pathname;
  const hist = { ask: store.get(course + ':ask', []), tutor: store.get(course + ':tutor', []), edit: store.get(course + ':edit', []), home: store.get(course + ':home', []) };
  const save = () => { for (const k in hist) store.set(course + ':' + k, hist[k].slice(-60).map(({ thumbs, ...m }) => (thumbs ? { ...m, content: m.content + `\n[${thumbs.length} image${thumbs.length > 1 ? 's' : ''}]` } : m))); };
  let mode = HOME ? 'home' : store.get('mode', 'ask'), selection = '', busy = null;
  const CHOICES = {
    mode: [['ask', 'Ask', 'questions about the lecture'], ['tutor', 'Tutor', 'teaches you step by step'], ['edit', 'Edit', 'changes the guide']],
    model: [['haiku', 'Haiku', 'fastest'], ['sonnet', 'Sonnet', 'balanced'], ['opus', 'Opus', 'deepest']],
    effort: [['low', 'Low', 'quick'], ['medium', 'Medium', 'default'], ['high', 'High', 'thinks more'], ['xhigh', 'Extra high', 'slowest']],
  };
  const pickVal = { mode, model: store.get('model', 'sonnet'), effort: store.get('effort', 'medium') };
  if (HOME) ep.querySelector('.pick[data-k=mode]').remove();
  const caret = '<svg viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M2.5 4 5 6.5 7.5 4"/></svg>';
  let menu = null;
  const closeMenu = () => { menu?.remove(); menu = null; ep.querySelectorAll('.pick').forEach((b) => b.classList.remove('on')); };
  function paintPicks() {
    ep.querySelectorAll('.pick').forEach((b) => {
      const k = b.dataset.k, c = CHOICES[k].find((x) => x[0] === pickVal[k]) || CHOICES[k][1];
      b.innerHTML = (k === 'effort' ? c[1] + ' effort' : c[1]) + caret;
      if (k === 'mode') b.style.color = 'var(--fg)';
    });
  }
  ep.querySelectorAll('.pick').forEach((b) => (b.onclick = (e) => {
    e.stopPropagation();
    const was = menu && menu.dataset.k === b.dataset.k; closeMenu(); if (was) return;
    const k = b.dataset.k;
    menu = document.createElement('div'); menu.className = 'menu'; menu.dataset.k = k;
    menu.style.left = b.offsetLeft + 'px';
    menu.innerHTML = CHOICES[k].map(([v, l, d]) => `<button type="button" data-v="${v}" class="${v === pickVal[k] ? 'on' : ''}">${l}<small>${d}</small></button>`).join('');
    menu.querySelectorAll('button').forEach((x) => (x.onclick = () => { pickVal[k] = x.dataset.v; if (k === 'mode') setMode(x.dataset.v); else store.set(k, x.dataset.v); paintPicks(); closeMenu(); ta.focus(); }));
    $('form').append(menu); b.classList.add('on');
  }));
  document.addEventListener('click', (e) => { if (menu && !menu.contains(e.target)) closeMenu(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMenu(); });
  paintPicks();

  const open = (v) => {
    document.body.classList.toggle('ep-on', v); toggle.classList.toggle('on', v);
    if (innerWidth >= 1180) store.set('open', v);
  };
  if (!HOME) open(innerWidth >= 1180 && store.get('open', true));
  toggle.onclick = () => open(!document.body.classList.contains('ep-on'));

  function currentLec() {
    if (HOME) return null;
    let cur = null;
    for (const s of document.querySelectorAll('section.lec[id^="l"]')) if (getComputedStyle(s).display !== 'none' && s.getBoundingClientRect().top < innerHeight * 0.4) cur = s;
    return cur;
  }
  const showCtx = () => { const s = currentLec(); $('.hd .ttl').textContent = s ? s.querySelector('h2').textContent : (HOME ? '' : 'Contents'); };
  addEventListener('scroll', showCtx, { passive: true }); showCtx();

  const box = $('.msgs');
  function setMode(m) {
    mode = m; if (!HOME) store.set('mode', m);
    pickVal.mode = m; paintPicks?.();
    $('form textarea').placeholder = { ask: 'Ask about this lecture', tutor: 'Answer, or type "start"', edit: 'What should change in the guide?', home: 'Create a workspace, add a lecture from Granola, ask anything…' }[m];
    renderAll();
  }
  // Resize by dragging the right edge; expand to full width with the header button.
  const setW = (w) => document.documentElement.style.setProperty('--ep-w', Math.round(Math.max(300, Math.min(w, innerWidth * 0.7))) + 'px');
  setW(store.get('width', 380));
  $('.rs').onpointerdown = (e) => {
    e.preventDefault(); document.body.classList.add('ep-drag');
    const move = (ev) => setW(ev.clientX);
    const up = () => { document.body.classList.remove('ep-drag'); removeEventListener('pointermove', move); store.set('width', parseInt(getComputedStyle(document.documentElement).getPropertyValue('--ep-w'))); };
    addEventListener('pointermove', move); addEventListener('pointerup', up, { once: true });
  };
  $('[data-act="full"]').onclick = () => document.body.classList.toggle('ep-full');
  $('[data-act="new"]').onclick = () => { if (busy) busy.abort(); hist[mode] = []; save(); renderAll(); };

  function renderPlan() {
    const plan = [...hist[mode]].reverse().map((m) => m.role === 'assistant' && parse(m.content).plan).find(Boolean);
    const el = $('.plan');
    el.classList.toggle('show', mode === 'tutor' && !!plan);
    if (plan && Array.isArray(plan.steps))
      el.innerHTML = '<ol>' + plan.steps.map((s, i) => `<li class="${i < plan.current ? 'done' : i === plan.current ? 'cur' : ''}">${esc(s)}</li>`).join('') + '</ol>';
  }
  function fillAssistant(node, msg, live) {
    const p = parse(msg.content), tools = msg.tools || [];
    let html = '';
    if (tools.length) html = live ? `<div class="tools">${tools.slice(-3).map((t) => `<div>${esc(t)}</div>`).join('')}</div>`
      : `<details class="tools"><summary>Used ${tools.length} step${tools.length > 1 ? 's' : ''} ›</summary>${tools.map((t) => `<div>${esc(t)}</div>`).join('')}</details>`;
    html += p.text.trim() ? md(p.text).replace(/<p>§DG(\d+)§<\/p>/g, (_, i) => safeSvg(p.svgs[i])) : live ? '<span class="ep-think">' + (tools.length ? 'Working…' : 'Thinking…') + '</span>' : '';
    node.innerHTML = html;
    if (p.quiz) node.append(cardFor(p.quiz, msg));
    if (msg.rebuilt && !live && !HOME) {
      const b = Object.assign(document.createElement('button'), { className: 'reload', textContent: HOME ? 'Refresh workspaces' : 'Reload the guide' });
      b.onclick = () => location.reload(); node.append(b);
    }
  }
  function addNode(msg, animate) {
    const n = document.createElement('div');
    n.className = 'm' + (msg.role === 'user' ? ' u' : '') + (animate ? ' new' : '');
    if (msg.role === 'user') {
      if (msg.thumbs?.length) { const t = document.createElement('div'); t.className = 'thumbs'; t.innerHTML = msg.thumbs.map((u) => `<img src="${u}" alt="">`).join(''); n.append(t); }
      n.append(document.createTextNode(msg.content));
    } else fillAssistant(n, msg, false);
    box.append(n);
    return n;
  }
  function renderAll() {
    box.innerHTML = '';
    if (!hist[mode].length) {
      box.innerHTML = `<div class="m e">${{
        ask: 'Ask anything about the lecture you are reading, or select text in the guide. Claude answers from the guide and digs into the slides, readings and recordings when the guide is thin.',
        tutor: 'The tutor first finds out what you already know, then teaches the topic one step at a time and checks each step with a question. Type "start".',
        home: 'This chat works across all your workspaces. Try: "create a workspace for Corporate Finance with the PDFs in that folder", "add Lecture 4 of Managing People from my Granola recording of 12/11", "which topics do my two courses share?".',
        edit: 'Change the guide itself. For example: "add Lecture 4 from my Granola recording of 12/11", "expand the AMO model with the Bos-Nehles paper", "add more practice for Lecture 2". Claude reads the material, edits the guide and rebuilds it.',
      }[mode]}</div>`;
    } else hist[mode].forEach((m) => addNode(m, false));
    renderPlan();
    box.scrollTop = box.scrollHeight;
  }

  const cards = new WeakMap();
  const cardFor = (q, msg) => { if (!cards.has(msg)) cards.set(msg, card(q, msg)); return cards.get(msg); };
  const CONF = [['Guess', 25], ['Unsure', 50], ['Fairly sure', 75], ['Certain', 95]];
  // A tutor question. Multiple choice carries its answer and explanation: the pick is marked right or wrong at once,
  // then the answer (with confidence and optional reasoning) goes back to the tutor.
  function card(q, msg) {
    const c = document.createElement('div');
    c.className = 'card';
    const hasOpts = Array.isArray(q.options) && q.options.length;
    const key = (i) => String.fromCharCode(65 + i);
    c.innerHTML = `<div class="qq">${inline(q.q || '')}</div>
      <div class="conf"><span>How sure?</span>${CONF.map(([l], i) => `<button type="button" data-c="${i}">${l}</button>`).join('')}</div>` +
      (hasOpts ? q.options.map((o, i) => `<button class="op" data-i="${i}"><span class="k">${key(i)}</span><span>${inline(o)}</span></button>`).join('')
        + `<button class="op idk" data-i="-1"><span class="k">?</span><span>I don't know</span></button>`
        : '<textarea class="ans" placeholder="Your answer"></textarea><button class="go" disabled>Answer</button>') +
      '<details><summary>Add your reasoning</summary><textarea class="why" placeholder="How did you think about it? (optional)"></textarea></details><div class="res"></div>';
    let conf = msg.conf ?? null;
    const paintConf = () => c.querySelectorAll('.conf button').forEach((b) => b.classList.toggle('on', Number(b.dataset.c) === conf));
    c.querySelectorAll('.conf button').forEach((b) => (b.onclick = () => { if (msg.answered) return; conf = Number(b.dataset.c); paintConf(); }));
    const why = () => c.querySelector('.why').value.trim();
    function mark(pick) {
      const has = Number.isInteger(q.answer);
      c.querySelectorAll('.op').forEach((b) => {
        const i = Number(b.dataset.i); b.disabled = true;
        if (has && i === q.answer) { b.classList.add('right'); b.querySelector('.k').textContent = '✓'; }
        else if (i === pick) { b.classList.add(has ? 'wrong' : 'right'); b.querySelector('.k').textContent = has ? '✗' : '•'; }
        else b.classList.add('dim');
      });
      const ok = has && pick === q.answer;
      c.querySelector('.res').innerHTML = (has ? `<b class="${ok ? 'ok' : 'no'}">${ok ? 'Correct.' : pick === -1 ? 'The answer is ' + key(q.answer) + '.' : 'Not quite.'}</b> ` : '') + (q.why ? inline(q.why) : '');
      return ok;
    }
    function submit(answer, extra) {
      const lines = [`Answer: ${answer}${extra || ''}`];
      if (conf !== null) lines.push(`Confidence: ${CONF[conf][1]}%`);
      if (why()) lines.push(`Reasoning: ${why()}`);
      msg.answered = true; msg.conf = conf; save();
      setTimeout(() => send(lines.join('\n')), 700);
    }
    c.querySelectorAll('.op').forEach((b) => (b.onclick = () => {
      if (msg.answered || busy) return;
      const pick = Number(b.dataset.i); msg.pick = pick;
      const ok = mark(pick), has = Number.isInteger(q.answer);
      submit(pick === -1 ? "I don't know" : `${key(pick)}. ${q.options[pick]}`, has && pick !== -1 ? (ok ? ' (correct)' : ` (wrong; the right answer is ${key(q.answer)})`) : '');
    }));
    const ans = c.querySelector('.ans'), go = c.querySelector('.go');
    if (ans) { ans.oninput = () => { go.disabled = !ans.value.trim(); }; go.onclick = () => { if (msg.answered || busy) return; go.disabled = true; ans.disabled = true; submit(ans.value.trim()); }; }
    if (msg.answered) { paintConf(); if (hasOpts && msg.pick !== undefined) mark(msg.pick); c.querySelectorAll('textarea,.go').forEach((x) => { x.disabled = true; }); }
    return c;
  }

  // The server streams newline-delimited JSON events: {t:"text"|"tool"|"rebuilt", d}.
  async function stream(body, onText, signal, onEvent = () => {}) {
    const r = await fetch(E.api, { method: 'POST', signal, headers: { 'Content-Type': 'application/json', 'X-Estudio-Token': E.token }, body: JSON.stringify(body) });
    if (!r.ok) throw new Error(await r.text());
    const rd = r.body.getReader(), dec = new TextDecoder();
    let all = '', buf = '';
    for (;;) {
      const { done, value } = await rd.read(); if (done) break;
      buf += dec.decode(value, { stream: true });
      let i, changed = false;
      while ((i = buf.indexOf('\n')) >= 0) {
        const line = buf.slice(0, i); buf = buf.slice(i + 1);
        let ev; try { ev = JSON.parse(line); } catch { continue; }
        if (ev.t === 'text') { all += ev.d; changed = true; } else onEvent(ev);
      }
      if (changed) onText(all);
    }
    return all;
  }
  const opts = () => ({ ...pickVal });

  let atts = [];
  const ta = $('form textarea'), sendBtn = $('form .send');
  const grow = () => { ta.style.height = 'auto'; ta.style.height = Math.min(ta.scrollHeight, 200) + 'px'; sendBtn.disabled = (!ta.value.trim() && !atts.length) || !!busy; };
  ta.addEventListener('input', grow);
  ta.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); $('form').requestSubmit(); } });
  $('form').onsubmit = (e) => { e.preventDefault(); const t = ta.value.trim(); if ((t || atts.length) && !busy) { ta.value = ''; send(t || 'What is this?'); } };
  $('.sel button').onclick = () => { selection = ''; $('.sel').style.display = 'none'; };

  // Attachments: paste, drop or pick images; each is shrunk to at most 1600px before sending.
  const attBox = $('.att'), fileIn = $('input[type=file]');
  const paintAtts = () => {
    attBox.classList.toggle('show', atts.length > 0);
    attBox.innerHTML = atts.map((a, i) => `<span><img src="${a.url}" alt=""><button type="button" data-i="${i}" aria-label="Remove">✕</button></span>`).join('');
    attBox.querySelectorAll('button').forEach((b) => (b.onclick = () => { atts.splice(Number(b.dataset.i), 1); paintAtts(); grow(); }));
    grow();
  };
  async function addFile(f) {
    if (!f || !f.type.startsWith('image/') || atts.length >= 6) return;
    const img = await createImageBitmap(f);
    const k = Math.min(1, 1600 / Math.max(img.width, img.height));
    const cv = Object.assign(document.createElement('canvas'), { width: Math.round(img.width * k), height: Math.round(img.height * k) });
    cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
    const url = cv.toDataURL('image/jpeg', 0.85);
    atts.push({ url, type: 'image/jpeg', data: url.split(',')[1] }); paintAtts();
  }
  $('.clip').onclick = () => fileIn.click();
  fileIn.onchange = async () => { for (const f of fileIn.files) await addFile(f); fileIn.value = ''; };
  ta.addEventListener('paste', async (e) => {
    const files = [...(e.clipboardData?.files || [])].filter((f) => f.type.startsWith('image/'));
    if (files.length) { e.preventDefault(); for (const f of files) await addFile(f); }
  });
  const formEl = $('form');
  ep.addEventListener('dragover', (e) => { if ([...e.dataTransfer.types].includes('Files')) { e.preventDefault(); formEl.classList.add('drop'); } });
  ep.addEventListener('dragleave', (e) => { if (!ep.contains(e.relatedTarget)) formEl.classList.remove('drop'); });
  ep.addEventListener('drop', async (e) => { e.preventDefault(); formEl.classList.remove('drop'); for (const f of e.dataTransfer.files) await addFile(f); });

  async function send(text) {
    const h = hist[mode], m = mode;
    if (!h.length) box.innerHTML = '';
    const sending = atts; atts = []; paintAtts();
    const user = { role: 'user', thumbs: sending.length ? sending.map((a) => a.url) : undefined, content: selection ? `About: "${selection.slice(0, 200)}${selection.length > 200 ? '…' : ''}"\n${text}` : text };
    h.push(user); addNode(user, true);
    const reply = { role: 'assistant', content: '' };
    const node = addNode(reply, true); fillAssistant(node, reply, true);
    h.push(reply);
    box.scrollTop = box.scrollHeight;
    const sel = selection; selection = ''; $('.sel').style.display = 'none';
    const s = currentLec();
    busy = new AbortController(); grow();
    let stick = true;
    const onScroll = () => setTimeout(() => { stick = box.scrollHeight - box.scrollTop - box.clientHeight < 40; }, 50);
    box.addEventListener('wheel', onScroll, { passive: true }); box.addEventListener('touchmove', onScroll, { passive: true });
    // Text arrives in bursts; reveal it at a steady, calm pace that eases to catch up with what has arrived.
    let target = '', shown = 0, done = false, drained;
    const drain = new Promise((r) => (drained = r));
    const tick = () => {
      const backlog = target.length - shown;
      if (backlog > 0) {
        shown += Math.min(backlog, Math.max(1, Math.round(backlog / 24)));
        reply.content = target.slice(0, shown); fillAssistant(node, reply, true);
        if (stick) box.scrollTop = box.scrollHeight;
      }
      if (done && shown >= target.length) drained(); else requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    try {
      reply.tools = [];
      await stream({ mode: m, lec: s ? s.id : null, selection: sel, messages: h.slice(0, -1).map(({ role, content }) => ({ role, content })), images: sending.map(({ type, data }) => ({ type, data })), ...opts() }, (t) => {
        target = t;
      }, busy.signal, (ev) => {
        if (ev.t === 'tool') reply.tools.push(ev.d);
        if (ev.t === 'rebuilt') reply.rebuilt = true;
        fillAssistant(node, reply, true);
        if (stick) box.scrollTop = box.scrollHeight;
      });
    } catch (err) { if (err.name !== 'AbortError') target += (target ? '\n\n' : '') + 'Could not reach Claude: ' + err.message; else shown = target.length; }
    done = true; await drain; reply.content = target;
    if (HOME && reply.rebuilt) window.estudioRefresh?.();
    box.removeEventListener('wheel', onScroll); box.removeEventListener('touchmove', onScroll);
    busy = null; fillAssistant(node, reply, false); renderPlan(); save(); grow();
    if (stick) box.scrollTop = box.scrollHeight;
  }

  document.addEventListener('mouseup', (e) => {
    if (ep.contains(e.target) || e.target === askSel) return;
    setTimeout(() => {
      const s = getSelection(), t = s && s.toString().trim();
      if (!t || t.length < 3 || !document.querySelector('main').contains(s.anchorNode)) { askSel.style.display = 'none'; return; }
      const r = s.getRangeAt(0).getBoundingClientRect();
      Object.assign(askSel.style, { display: 'block', left: r.left + scrollX + 'px', top: r.bottom + scrollY + 6 + 'px' });
      askSel.dataset.t = t;
    });
  });
  askSel.onclick = () => {
    selection = askSel.dataset.t; askSel.style.display = 'none'; open(true);
    if (mode !== 'ask') setMode('ask');
    $('.sel span').textContent = '“' + selection + '”'; $('.sel').style.display = 'flex'; ta.focus();
  };

  window.estudioGrade = async (out, lec, index, answer, btn) => {
    if (!answer.trim()) { out.textContent = 'Write your answer first.'; return; }
    btn.disabled = true; out.innerHTML = '<span class="ep-think">Grading…</span>';
    try { await stream({ mode: 'grade', lec, index, answer, ...opts() }, (t) => { out.innerHTML = md(t); }); }
    catch (err) { out.textContent = 'Could not reach Claude: ' + err.message; }
    btn.disabled = false;
  };
  setMode(mode);
})();
