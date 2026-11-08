// Chat sidebar injected by estudio.mjs into a study guide. Talks only to the local server.
(() => {
  const E = window.ESTUDIO;
  if (!E) return;
  const HOME = !!E.home; // mounted inline on the workspace home instead of as the guide's sidebar
  const css = `
  #ep{position:fixed;z-index:7;top:48px;left:0;bottom:0;width:380px;background:var(--bg);display:flex;flex-direction:column;font-size:14px;line-height:20px;box-shadow:1px 0 0 var(--line);transform:translateX(-100%);visibility:hidden;transition:transform .16s cubic-bezier(.2,0,0,1),visibility 0s .16s}
  body.ep-on #ep{transform:none;visibility:visible;transition:transform .16s cubic-bezier(.2,0,0,1)}
  @media (min-width:1180px){body.ep-on main{margin-left:max(404px,calc((100vw - 740px)/2));margin-right:auto;max-width:min(740px,calc(100vw - 404px - 310px))}body.ep-on.toc-off main{max-width:min(740px,calc(100vw - 428px))}body.ep-on #exam{margin-left:max(404px,calc((100vw - 740px)/2));margin-right:auto;max-width:min(740px,calc(100vw - 428px))}}
  @media (max-width:1179px){#ep{width:100%}}
  #ep.inline{position:relative;top:auto;left:auto;bottom:auto;width:100%;height:100%;transform:none;visibility:visible;box-shadow:none;background:transparent;transition:none}
  #ep.inline .hd,#ep.inline .ctx{display:none}#ep.inline .msgs{padding:24px 4px}#ep.inline form{margin:0 0 16px}
  #ep .hd{display:flex;align-items:center;gap:6px;padding:10px 12px 6px}
  #ep .seg{position:relative;display:flex;padding:2px;border-radius:10px;background:var(--seg)}
  #ep .seg button{position:relative;z-index:1;height:28px;padding:0 12px;border:0;background:none;border-radius:8px;font:inherit;font-size:13px;color:var(--mute);cursor:pointer}
  #ep .seg button:hover{color:var(--fg)}#ep .seg button.on{color:var(--fg);font-weight:550}
  #ep .seg i{position:absolute;top:2px;bottom:2px;left:0;border-radius:8px;background:var(--surface);box-shadow:0 1px 2px rgba(0,0,0,.08),0 0 0 .5px var(--hover2);transition:transform .16s cubic-bezier(.2,0,0,1),width .16s cubic-bezier(.2,0,0,1)}
  #ep .ic{margin-left:auto;width:28px;height:28px;border:0;background:none;border-radius:8px;color:var(--mute);cursor:pointer;display:grid;place-items:center}
  #ep .ic:hover{background:var(--hover);color:var(--fg)}
  #ep .ctx{padding:0 16px 8px;color:var(--mute);font-size:12px;line-height:16px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;box-shadow:0 1px 0 var(--line)}
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
  #ep .card{margin-top:10px;border-radius:12px;padding:12px;background:var(--card);box-shadow:0 0 0 1px var(--line)}
  #ep .card .qq{font-weight:550;margin-bottom:8px}
  #ep .card .op{display:block;width:100%;text-align:left;font:inherit;font-size:14px;color:var(--fg);background:var(--surface);border:0;border-radius:8px;box-shadow:0 0 0 1px var(--line);padding:7px 10px;margin:6px 0;cursor:pointer}
  #ep .card .op:hover{box-shadow:0 0 0 1px var(--line2)}#ep .card .op.on{box-shadow:0 0 0 1.5px var(--fg)}
  #ep .card .op.idk{color:var(--mute)}
  #ep .card .lbl{display:flex;justify-content:space-between;color:var(--mute);font-size:12px;margin:10px 0 4px}
  #ep .card input[type=range]{width:100%;accent-color:var(--fg)}
  #ep .card textarea{width:100%;min-height:52px;border:0;border-radius:8px;box-shadow:0 0 0 1px var(--line);padding:7px 10px;font:inherit;font-size:14px;resize:vertical;background:var(--surface);color:var(--fg);margin-top:4px}
  #ep .card .go{margin-top:10px;height:32px;padding:0 14px;border:0;border-radius:16px;background:var(--fg);color:var(--on-fg);font:inherit;font-size:13px;cursor:pointer}
  #ep .card .go:disabled{opacity:.3;cursor:default}
  #ep .card.done{opacity:.6;pointer-events:none}
  #ep .sel{margin:0 16px 8px;font-size:12px;line-height:16px;color:var(--mute);display:none;align-items:center;gap:6px}
  #ep .sel span{flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  #ep .sel button{border:0;background:none;color:var(--mute);cursor:pointer}
  #ep form{position:relative;margin:0 12px 12px;border-radius:14px;background:var(--surface);box-shadow:0 0 0 1px var(--line),0 1px 1px rgba(0,0,0,.04);transition:box-shadow .08s}
  #ep form:hover{box-shadow:0 0 0 1px var(--line2),0 1px 1px rgba(0,0,0,.04)}#ep form:focus-within{box-shadow:0 0 0 1px color-mix(in oklab,var(--fg),transparent 70%),0 1px 1px rgba(0,0,0,.04)}
  #ep form textarea{display:block;width:100%;border:0;outline:0;background:none;color:var(--fg);resize:none;font:inherit;font-size:14px;line-height:20px;padding:10px 12px 2px;max-height:200px}
  #ep form .row{display:flex;align-items:center;gap:0;padding:2px 6px 6px}
  #ep .pick{height:26px;padding:0 7px;border:0;background:none;border-radius:7px;color:var(--mute);font:inherit;font-size:12px;cursor:pointer;display:inline-flex;align-items:center;gap:3px;transition:background .08s,color .08s}
  #ep .pick:hover,#ep .pick.on{background:var(--hover);color:var(--fg)}#ep .pick svg{width:10px;height:10px;opacity:.6}
  #ep .menu{position:absolute;left:6px;bottom:calc(100% + 6px);z-index:3;min-width:200px;background:var(--surface);border-radius:12px;padding:4px;box-shadow:0 0 0 1px var(--hover2),0 10px 28px var(--shadow);animation:ep-pop .12s cubic-bezier(.2,0,0,1);transform-origin:bottom left}
  #ep .menu button{display:flex;width:100%;align-items:baseline;gap:8px;border:0;background:none;border-radius:8px;padding:6px 10px;font:inherit;font-size:13px;color:var(--fg);cursor:pointer;text-align:left}
  #ep .menu button:hover{background:var(--hover)}#ep .menu small{color:var(--mute);font-size:12px;margin-left:auto}
  #ep .menu button.on{font-weight:550}
  @keyframes ep-pop{from{opacity:0;transform:scale(.96) translateY(4px)}}
  @media (pointer:coarse){#ep textarea{font-size:16px!important}}
  #ep form .send{margin-left:auto;width:30px;height:30px;border:0;border-radius:15px;background:var(--fg);color:var(--on-fg);cursor:pointer;display:grid;place-items:center}
  #ep form .send:disabled{opacity:.25;cursor:default}
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
    const open = out.text.indexOf('```');
    if (open >= 0) out.text = out.text.slice(0, open);
    return out;
  }

  const icon = (d) => `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
  const ep = document.createElement('aside');
  ep.id = 'ep';
  ep.innerHTML = `<div class="hd"><div class="seg"><i></i><button data-m="ask" class="on">Ask</button><button data-m="tutor">Tutor</button><button data-m="edit">Edit</button></div>
      <button class="ic" data-act="new" title="New chat" aria-label="New chat">${icon('<path d="M8 3.5v9M3.5 8h9"/>')}</button></div>
    <div class="ctx"></div><div class="plan"></div><div class="msgs"></div><div class="sel"><span></span><button type="button" aria-label="Clear">✕</button></div>
    <form><textarea rows="1" placeholder="Ask about this lecture"></textarea><div class="row"><button type="button" class="pick" data-k="model"></button><button type="button" class="pick" data-k="effort"></button><button class="send" aria-label="Send" disabled>${icon('<path d="M8 13V3M3.5 7.5 8 3l4.5 4.5"/>')}</button></div></form>`;
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
  const save = () => { for (const k in hist) store.set(course + ':' + k, hist[k].slice(-60)); };
  let mode = HOME ? 'home' : store.get('mode', 'ask'), selection = '', busy = null;
  const CHOICES = {
    model: [['haiku', 'Haiku', 'fastest'], ['sonnet', 'Sonnet', 'balanced'], ['opus', 'Opus', 'deepest']],
    effort: [['low', 'Low', 'quick'], ['medium', 'Medium', 'default'], ['high', 'High', 'thinks more'], ['xhigh', 'Extra high', 'slowest']],
  };
  const pickVal = { model: store.get('model', 'sonnet'), effort: store.get('effort', 'medium') };
  const caret = '<svg viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M2.5 4 5 6.5 7.5 4"/></svg>';
  let menu = null;
  const closeMenu = () => { menu?.remove(); menu = null; ep.querySelectorAll('.pick').forEach((b) => b.classList.remove('on')); };
  function paintPicks() {
    ep.querySelectorAll('.pick').forEach((b) => {
      const k = b.dataset.k, c = CHOICES[k].find((x) => x[0] === pickVal[k]) || CHOICES[k][1];
      b.innerHTML = (k === 'effort' ? c[1] + ' effort' : c[1]) + caret;
    });
  }
  ep.querySelectorAll('.pick').forEach((b) => (b.onclick = (e) => {
    e.stopPropagation();
    const was = menu && menu.dataset.k === b.dataset.k; closeMenu(); if (was) return;
    const k = b.dataset.k;
    menu = document.createElement('div'); menu.className = 'menu'; menu.dataset.k = k;
    menu.style.left = b.offsetLeft + 'px';
    menu.innerHTML = CHOICES[k].map(([v, l, d]) => `<button type="button" data-v="${v}" class="${v === pickVal[k] ? 'on' : ''}">${l}<small>${d}</small></button>`).join('');
    menu.querySelectorAll('button').forEach((x) => (x.onclick = () => { pickVal[k] = x.dataset.v; store.set(k, x.dataset.v); paintPicks(); closeMenu(); ta.focus(); }));
    $('form').append(menu); b.classList.add('on');
  }));
  document.addEventListener('click', (e) => { if (menu && !menu.contains(e.target)) closeMenu(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMenu(); });
  paintPicks();

  const open = (v) => {
    document.body.classList.toggle('ep-on', v); toggle.classList.toggle('on', v);
    if (innerWidth >= 1180) store.set('open', v);
    if (v) requestAnimationFrame(pill);
  };
  if (!HOME) open(innerWidth >= 1180 && store.get('open', true));
  toggle.onclick = () => open(!document.body.classList.contains('ep-on'));

  function pill() {
    const on = $('.seg button.on'), i = $('.seg i');
    if (!on) return;
    i.style.width = on.offsetWidth + 'px'; i.style.transform = `translateX(${on.offsetLeft}px)`;
  }
  function currentLec() {
    if (HOME) return null;
    let cur = null;
    for (const s of document.querySelectorAll('section.lec[id^="l"]')) if (s.getBoundingClientRect().top < innerHeight * 0.4) cur = s;
    return cur;
  }
  const showCtx = () => { const s = currentLec(); $('.ctx').textContent = s ? s.querySelector('h2').textContent : 'Scroll to a lecture to ask about it'; };
  addEventListener('scroll', showCtx, { passive: true }); showCtx();

  const box = $('.msgs');
  function setMode(m) {
    mode = m; if (!HOME) store.set('mode', m);
    ep.querySelectorAll('.seg button').forEach((x) => x.classList.toggle('on', x.dataset.m === m));
    $('form textarea').placeholder = { ask: 'Ask about this lecture', tutor: 'Answer, or type "start"', edit: 'What should change in the guide?', home: 'Create a workspace, add a lecture from Granola, ask anything…' }[m];
    pill(); renderAll();
  }
  ep.querySelectorAll('.seg button').forEach((b) => (b.onclick = () => setMode(b.dataset.m)));
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
    html += p.text.trim() ? md(p.text) : live ? '<span class="ep-think">' + (tools.length ? 'Working…' : 'Thinking…') + '</span>' : '';
    node.innerHTML = html;
    if (p.quiz && !live) node.append(card(p.quiz, msg));
    if (msg.rebuilt && !live && !HOME) {
      const b = Object.assign(document.createElement('button'), { className: 'reload', textContent: HOME ? 'Refresh workspaces' : 'Reload the guide' });
      b.onclick = () => location.reload(); node.append(b);
    }
  }
  function addNode(msg, animate) {
    const n = document.createElement('div');
    n.className = 'm' + (msg.role === 'user' ? ' u' : '') + (animate ? ' new' : '');
    if (msg.role === 'user') n.textContent = msg.content; else fillAssistant(n, msg, false);
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

  function card(q, msg) {
    const c = document.createElement('div');
    c.className = 'card' + (msg.answered ? ' done' : '');
    const hasOpts = Array.isArray(q.options) && q.options.length;
    let pick = null;
    c.innerHTML = `<div class="qq">${inline(q.q || '')}</div>` +
      (hasOpts ? q.options.map((o, i) => `<button class="op" data-i="${i}">${String.fromCharCode(65 + i)}. ${inline(o)}</button>`).join('') + '<button class="op idk" data-i="-1">I don\'t know</button>'
        : '<textarea class="ans" placeholder="Your answer"></textarea>') +
      `<div class="conf"><div class="lbl"><span>How sure are you?</span><b>50%</b></div><input type="range" min="0" max="5" step="1" value="2"></div>
       <textarea class="why" placeholder="Your reasoning (optional)"></textarea><button class="go" disabled>Answer</button>`;
    const stops = [0, 30, 50, 70, 90, 100];
    const go = c.querySelector('.go'), range = c.querySelector('input'), conf = c.querySelector('.conf');
    const ready = () => { go.disabled = hasOpts ? pick === null : !c.querySelector('.ans').value.trim(); };
    range.oninput = () => { c.querySelector('.lbl b').textContent = stops[range.value] + '%'; };
    c.querySelectorAll('.op').forEach((b) => (b.onclick = () => {
      pick = Number(b.dataset.i);
      c.querySelectorAll('.op').forEach((x) => x.classList.toggle('on', x === b));
      conf.style.display = pick === -1 ? 'none' : ''; ready();
    }));
    c.querySelector('.ans')?.addEventListener('input', ready);
    go.onclick = () => {
      const answer = hasOpts ? (pick === -1 ? "I don't know" : `${String.fromCharCode(65 + pick)}. ${q.options[pick]}`) : c.querySelector('.ans').value.trim();
      const why = c.querySelector('.why').value.trim();
      const lines = [`Answer: ${answer}`];
      if (pick !== -1) lines.push(`Confidence: ${stops[range.value]}%`);
      if (why) lines.push(`Reasoning: ${why}`);
      msg.answered = true; c.classList.add('done');
      send(lines.join('\n'));
    };
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

  const ta = $('form textarea'), sendBtn = $('form .send');
  const grow = () => { ta.style.height = 'auto'; ta.style.height = Math.min(ta.scrollHeight, 200) + 'px'; sendBtn.disabled = !ta.value.trim() || !!busy; };
  ta.addEventListener('input', grow);
  ta.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); $('form').requestSubmit(); } });
  $('form').onsubmit = (e) => { e.preventDefault(); const t = ta.value.trim(); if (t && !busy) { ta.value = ''; send(t); } };
  $('.sel button').onclick = () => { selection = ''; $('.sel').style.display = 'none'; };

  async function send(text) {
    const h = hist[mode], m = mode;
    if (!h.length) box.innerHTML = '';
    const user = { role: 'user', content: selection ? `About: "${selection.slice(0, 200)}${selection.length > 200 ? '…' : ''}"\n${text}` : text };
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
      await stream({ mode: m, lec: s ? s.id : null, selection: sel, messages: h.slice(0, -1).map(({ role, content }) => ({ role, content })), ...opts() }, (t) => {
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
