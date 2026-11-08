// Chat sidebar injected by estudio.mjs into a study guide. Talks only to the local server.
(() => {
  const E = window.ESTUDIO;
  if (!E) return;
  const css = `
  #ep{position:fixed;z-index:7;top:48px;left:0;bottom:0;width:380px;background:#fff;display:flex;flex-direction:column;font-size:14px;line-height:20px;box-shadow:1px 0 0 var(--line);transform:translateX(-100%);visibility:hidden;transition:transform .16s cubic-bezier(.2,0,0,1),visibility 0s .16s}
  body.ep-on #ep{transform:none;visibility:visible;transition:transform .16s cubic-bezier(.2,0,0,1)}
  @media (min-width:1180px){body.ep-on main{margin-left:max(404px,calc((100vw - 740px)/2));margin-right:auto;max-width:min(740px,calc(100vw - 404px - 310px))}body.ep-on.toc-off main{max-width:min(740px,calc(100vw - 428px))}body.ep-on #exam{margin-left:max(404px,calc((100vw - 740px)/2));margin-right:auto;max-width:min(740px,calc(100vw - 428px))}}
  @media (max-width:1179px){#ep{width:100%}}
  #ep .hd{display:flex;align-items:center;gap:6px;padding:10px 12px 6px}
  #ep .seg{position:relative;display:flex;padding:2px;border-radius:10px;background:#f4f4f3}
  #ep .seg button{position:relative;z-index:1;height:28px;padding:0 12px;border:0;background:none;border-radius:8px;font:inherit;font-size:13px;color:var(--mute);cursor:pointer}
  #ep .seg button:hover{color:var(--fg)}#ep .seg button.on{color:var(--fg);font-weight:550}
  #ep .seg i{position:absolute;top:2px;bottom:2px;left:0;border-radius:8px;background:#fff;box-shadow:0 1px 2px rgba(0,0,0,.08),0 0 0 .5px rgba(0,0,0,.06);transition:transform .16s cubic-bezier(.2,0,0,1),width .16s cubic-bezier(.2,0,0,1)}
  #ep .ic{margin-left:auto;width:28px;height:28px;border:0;background:none;border-radius:8px;color:var(--mute);cursor:pointer;display:grid;place-items:center}
  #ep .ic:hover{background:rgba(0,0,0,.04);color:var(--fg)}
  #ep .opts{display:flex;gap:4px;padding:0 12px 6px}
  #ep select{height:26px;border:0;border-radius:7px;background:#f4f4f3;color:var(--mute);font:inherit;font-size:12px;padding:0 6px;cursor:pointer}
  #ep select:hover{color:var(--fg)}
  #ep .ctx{padding:0 16px 8px;color:var(--mute);font-size:12px;line-height:16px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;box-shadow:0 1px 0 var(--line)}
  #ep .plan{display:none;padding:8px 16px;font-size:12px;line-height:18px;box-shadow:0 1px 0 var(--line);color:var(--mute)}
  #ep .plan.show{display:block}#ep .plan ol{margin:0;padding-left:18px}#ep .plan li.cur{color:var(--fg);font-weight:550}#ep .plan li.done{text-decoration:line-through}
  #ep .msgs{flex:1;overflow-y:auto;padding:16px;overscroll-behavior:contain}
  #ep .m{margin:0 0 16px}#ep .m.new{animation:ep-in .16s cubic-bezier(.2,0,0,1)}
  #ep .m.u{margin-left:auto;max-width:85%;width:fit-content;background:color-mix(in oklab,var(--acc),#fff 88%);border-radius:14px;padding:8px 12px;white-space:pre-wrap}
  #ep .m.e{color:var(--mute)}
  #ep .m p{margin:0}#ep .m p+p,#ep .m p+ul,#ep .m ul+p{margin-top:8px}#ep .m ul{margin:6px 0 0;padding-left:18px}#ep .m li{margin:2px 0}
  @keyframes ep-in{from{opacity:0;transform:translateY(6px)}}
  .ep-think{display:inline-block;color:transparent;background:linear-gradient(90deg,#9a9996 0%,#1f1e1d 50%,#9a9996 100%);background-size:300% 100%;-webkit-background-clip:text;background-clip:text;animation:ep-sh 1.6s linear infinite}
  @keyframes ep-sh{from{background-position:100% 0}to{background-position:0 0}}
  @media (prefers-reduced-motion:reduce){#ep,#ep .m.new{transition:none;animation:none}.ep-think{animation:none;color:var(--mute)}}
  #ep .card{margin-top:10px;border-radius:12px;padding:12px;background:#fafaf9;box-shadow:0 0 0 1px var(--line)}
  #ep .card .qq{font-weight:550;margin-bottom:8px}
  #ep .card .op{display:block;width:100%;text-align:left;font:inherit;font-size:14px;color:var(--fg);background:#fff;border:0;border-radius:8px;box-shadow:0 0 0 1px var(--line);padding:7px 10px;margin:6px 0;cursor:pointer}
  #ep .card .op:hover{box-shadow:0 0 0 1px #cfcdc8}#ep .card .op.on{box-shadow:0 0 0 1.5px var(--fg)}
  #ep .card .op.idk{color:var(--mute)}
  #ep .card .lbl{display:flex;justify-content:space-between;color:var(--mute);font-size:12px;margin:10px 0 4px}
  #ep .card input[type=range]{width:100%;accent-color:var(--fg)}
  #ep .card textarea{width:100%;min-height:52px;border:0;border-radius:8px;box-shadow:0 0 0 1px var(--line);padding:7px 10px;font:inherit;font-size:14px;resize:vertical;background:#fff;margin-top:4px}
  #ep .card .go{margin-top:10px;height:32px;padding:0 14px;border:0;border-radius:16px;background:var(--fg);color:#fff;font:inherit;font-size:13px;cursor:pointer}
  #ep .card .go:disabled{opacity:.3;cursor:default}
  #ep .card.done{opacity:.6;pointer-events:none}
  #ep .sel{margin:0 16px 8px;font-size:12px;line-height:16px;color:var(--mute);display:none;align-items:center;gap:6px}
  #ep .sel span{flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  #ep .sel button{border:0;background:none;color:var(--mute);cursor:pointer}
  #ep form{position:relative;margin:0 12px 12px;border-radius:14px;background:#fff;box-shadow:0 0 0 1px var(--line),0 1px 1px rgba(0,0,0,.04);transition:box-shadow .08s}
  #ep form:hover{box-shadow:0 0 0 1px #dcdad5,0 1px 1px rgba(0,0,0,.04)}#ep form:focus-within{box-shadow:0 0 0 1px rgba(31,30,29,.25),0 1px 1px rgba(0,0,0,.04)}
  #ep form textarea{display:block;width:100%;border:0;outline:0;background:none;resize:none;font:inherit;font-size:14px;line-height:20px;padding:10px 48px 10px 12px;max-height:200px}
  @media (pointer:coarse){#ep textarea{font-size:16px!important}}
  #ep form .send{position:absolute;right:6px;bottom:6px;width:30px;height:30px;border:0;border-radius:15px;background:var(--fg);color:#fff;cursor:pointer;display:grid;place-items:center}
  #ep form .send:disabled{opacity:.25;cursor:default}
  #ep-ask{position:absolute;z-index:9;display:none;height:28px;padding:0 12px;border:0;border-radius:14px;background:var(--fg);color:#fff;font:inherit;font-size:12px;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,.15)}
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
  ep.innerHTML = `<div class="hd"><div class="seg"><i></i><button data-m="ask" class="on">Ask</button><button data-m="tutor">Tutor</button></div>
      <button class="ic" data-act="new" title="New chat" aria-label="New chat">${icon('<path d="M8 3.5v9M3.5 8h9"/>')}</button></div>
    <div class="opts"><select data-k="model" aria-label="Model"><option value="haiku">Haiku</option><option value="sonnet">Sonnet</option><option value="opus">Opus</option></select>
      <select data-k="effort" aria-label="Effort"><option value="low">Low effort</option><option value="medium">Medium effort</option><option value="high">High effort</option><option value="xhigh">Extra high effort</option></select></div>
    <div class="ctx"></div><div class="plan"></div><div class="msgs"></div><div class="sel"><span></span><button type="button" aria-label="Clear">✕</button></div>
    <form><textarea rows="1" placeholder="Ask about this lecture"></textarea><button class="send" aria-label="Send" disabled>${icon('<path d="M8 13V3M3.5 7.5 8 3l4.5 4.5"/>')}</button></form>`;
  const toggle = document.createElement('button');
  toggle.className = 'b'; toggle.title = 'Chat'; toggle.setAttribute('aria-label', 'Chat');
  toggle.innerHTML = icon('<rect x="2" y="2.5" width="12" height="11" rx="2"/><path d="M6 2.5v11"/>') + '<span>Chat</span>';
  const askSel = Object.assign(document.createElement('button'), { id: 'ep-ask', textContent: 'Ask about this' });
  document.body.append(ep, askSel);
  (document.getElementById('barl') || document.querySelector('nav.bar')).append(toggle);
  const $ = (s) => ep.querySelector(s);

  const store = {
    get(k, d) { try { const v = localStorage.getItem('ep:' + k); return v == null ? d : JSON.parse(v); } catch { return d; } },
    set(k, v) { try { localStorage.setItem('ep:' + k, JSON.stringify(v)); } catch { /* storage blocked */ } },
  };
  const course = location.pathname;
  const hist = { ask: store.get(course + ':ask', []), tutor: store.get(course + ':tutor', []) };
  const save = () => { store.set(course + ':ask', hist.ask.slice(-40)); store.set(course + ':tutor', hist.tutor.slice(-60)); };
  let mode = store.get('mode', 'ask'), selection = '', busy = null;
  ep.querySelectorAll('select').forEach((s) => { s.value = store.get(s.dataset.k, s.dataset.k === 'model' ? 'sonnet' : 'medium'); s.onchange = () => store.set(s.dataset.k, s.value); });

  const open = (v) => {
    document.body.classList.toggle('ep-on', v); toggle.classList.toggle('on', v);
    if (innerWidth >= 1180) store.set('open', v);
    if (v) requestAnimationFrame(pill);
  };
  open(innerWidth >= 1180 && store.get('open', true));
  toggle.onclick = () => open(!document.body.classList.contains('ep-on'));

  function pill() {
    const on = $('.seg button.on'), i = $('.seg i');
    i.style.width = on.offsetWidth + 'px'; i.style.transform = `translateX(${on.offsetLeft}px)`;
  }
  function currentLec() {
    let cur = null;
    for (const s of document.querySelectorAll('section.lec[id^="l"]')) if (s.getBoundingClientRect().top < innerHeight * 0.4) cur = s;
    return cur;
  }
  const showCtx = () => { const s = currentLec(); $('.ctx').textContent = s ? s.querySelector('h2').textContent : 'Scroll to a lecture to ask about it'; };
  addEventListener('scroll', showCtx, { passive: true }); showCtx();

  const box = $('.msgs');
  function setMode(m) {
    mode = m; store.set('mode', m);
    ep.querySelectorAll('.seg button').forEach((x) => x.classList.toggle('on', x.dataset.m === m));
    $('form textarea').placeholder = m === 'ask' ? 'Ask about this lecture' : 'Answer, or type "start"';
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
    const p = parse(msg.content);
    node.innerHTML = p.text.trim() ? md(p.text) : live ? '<span class="ep-think">Thinking…</span>' : '';
    if (p.quiz && !live) node.append(card(p.quiz, msg));
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
      box.innerHTML = `<div class="m e">${mode === 'ask' ? 'Ask anything about the lecture you are reading, or select text in the guide.' : 'The tutor first finds out what you already know, then teaches the topic one step at a time and checks each step with a question. Type "start".'}</div>`;
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

  async function stream(body, onText, signal) {
    const r = await fetch(E.api, { method: 'POST', signal, headers: { 'Content-Type': 'application/json', 'X-Estudio-Token': E.token }, body: JSON.stringify(body) });
    if (!r.ok) throw new Error(await r.text());
    const rd = r.body.getReader(), dec = new TextDecoder();
    let all = '';
    for (;;) { const { done, value } = await rd.read(); if (done) break; all += dec.decode(value, { stream: true }); onText(all); }
    return all;
  }
  const opts = () => ({ model: $('[data-k=model]').value, effort: $('[data-k=effort]').value });

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
    try {
      await stream({ mode: m, lec: s ? s.id : null, selection: sel, messages: h.slice(0, -1), ...opts() }, (t) => {
        reply.content = t; fillAssistant(node, reply, true);
        if (stick) box.scrollTop = box.scrollHeight;
      }, busy.signal);
    } catch (err) { if (err.name !== 'AbortError') reply.content = 'Could not reach Claude: ' + err.message; }
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
