// Claude side panel injected by estudio.mjs into the study guide. Talks to the local server only.
(() => {
  const E = window.ESTUDIO;
  if (!E) return;
  const css = `
  #ep{position:fixed;z-index:5;background:#fff;display:flex;flex-direction:column;font-size:14px;line-height:20px}
  @media (min-width:1180px){#ep{top:44px;left:0;bottom:0;width:380px;box-shadow:1px 0 0 var(--line)}
    body.ep-on main{margin-left:max(404px,calc((100vw - 740px)/2));margin-right:auto;max-width:min(740px,calc(100vw - 404px - 310px))}#ep-fab{display:none}}
  @media (max-width:1179px){#ep{inset:0}}
  body:not(.ep-on) #ep{display:none}body.ep-on #ep-fab{display:none}
  #ep-fab{position:fixed;left:16px;bottom:16px;z-index:6;height:36px;padding:0 16px;border:0;border-radius:18px;background:var(--fg);color:#fff;font:inherit;font-size:13px;cursor:pointer;box-shadow:0 1px 2px rgba(0,0,0,.12)}
  #ep header{display:flex;align-items:center;padding:12px 12px 4px}
  #ep .seg{position:relative;display:flex;padding:3px;border-radius:12px;background:#f4f4f3}
  #ep .seg button{position:relative;z-index:1;height:30px;padding:0 12px;border:0;background:none;border-radius:9px;font:inherit;font-size:13px;color:var(--mute);cursor:pointer;transition:color .08s}
  #ep .seg button:hover{color:var(--fg)}#ep .seg button.on{color:var(--fg);font-weight:550}
  #ep .seg i{position:absolute;top:3px;bottom:3px;border-radius:9px;background:#fff;box-shadow:0 1px 2px rgba(0,0,0,.08),0 0 0 .5px rgba(0,0,0,.06);transition:transform .16s cubic-bezier(.2,0,0,1),width .16s cubic-bezier(.2,0,0,1)}
  #ep .x{margin-left:auto;width:30px;height:30px;border:0;background:none;border-radius:8px;color:var(--mute);cursor:pointer;font-size:15px}
  #ep .x:hover{background:rgba(0,0,0,.04);color:var(--fg)}
  #ep .ctx{padding:6px 16px 0;color:var(--mute);font-size:12px;line-height:16px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  #ep .msgs{flex:1;overflow-y:auto;padding:16px}
  #ep .m{margin:0 0 16px;animation:ep-in .16s cubic-bezier(.2,0,0,1)}
  #ep .m.u{margin-left:auto;max-width:80%;width:fit-content;background:color-mix(in oklab,var(--acc),#fff 88%);border-radius:14px;padding:8px 12px}
  #ep .m.e{color:var(--mute)}
  #ep .m p{margin:0}#ep .m p+p,#ep .m p+ul,#ep .m ul+p{margin-top:8px}#ep .m ul{margin:6px 0 0;padding-left:18px}#ep .m li{margin:2px 0}
  @keyframes ep-in{from{opacity:0;transform:translateY(8px) scale(.98)}}
  .ep-think{display:inline-block;color:transparent;background:linear-gradient(90deg,#9a9996 0%,#1f1e1d 50%,#9a9996 100%);background-size:300% 100%;-webkit-background-clip:text;background-clip:text;animation:ep-sh 1.6s linear infinite}
  @keyframes ep-sh{from{background-position:100% 0}to{background-position:0 0}}
  @media (prefers-reduced-motion:reduce){#ep .m{animation:none}.ep-think{animation:none;color:var(--mute)}}
  #ep .sel{margin:0 16px 8px;font-size:12px;line-height:16px;color:var(--mute);display:none;align-items:center;gap:6px}
  #ep .sel span{flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  #ep .sel button{border:0;background:none;color:var(--mute);cursor:pointer;font-size:13px}
  #ep form{position:relative;margin:0 12px 12px;border-radius:14px;background:#fff;box-shadow:0 0 0 1px var(--line),0 1px 1px rgba(0,0,0,.04);transition:box-shadow .08s}
  #ep form:hover{box-shadow:0 0 0 1px #dcdad5,0 1px 1px rgba(0,0,0,.04)}
  #ep form:focus-within{box-shadow:0 0 0 1px rgba(31,30,29,.2),0 1px 1px rgba(0,0,0,.04)}
  #ep textarea{display:block;width:100%;border:0;outline:0;background:none;resize:none;font:inherit;font-size:14px;line-height:20px;padding:10px 48px 10px 12px;max-height:200px}
  @media (pointer:coarse){#ep textarea{font-size:16px}}
  #ep form button{position:absolute;right:6px;bottom:6px;width:30px;height:30px;border:0;border-radius:15px;background:var(--fg);color:#fff;cursor:pointer;display:grid;place-items:center;transition:opacity .08s}
  #ep form button:disabled{opacity:.25;cursor:default}
  #ep-ask{position:absolute;z-index:7;display:none;height:28px;padding:0 12px;border:0;border-radius:14px;background:var(--fg);color:#fff;font:inherit;font-size:12px;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,.15)}
  .q .btn{margin-top:4px}
  `;
  document.head.append(Object.assign(document.createElement('style'), { textContent: css }));

  const esc = (s) => String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]);
  const inline = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/(^|[^*])\*([^*]+)\*/g, '$1<i>$2</i>');
  function md(s) {
    return s.split(/\n{2,}/).map((b) => {
      const lines = b.split('\n');
      if (lines.every((l) => /^\s*([-*]|\d+\.)\s/.test(l) || !l.trim()))
        return '<ul>' + lines.filter((l) => l.trim()).map((l) => '<li>' + inline(l.replace(/^\s*([-*]|\d+\.)\s/, '')) + '</li>').join('') + '</ul>';
      return '<p>' + lines.map(inline).join('<br>') + '</p>';
    }).join('');
  }

  const ep = document.createElement('div');
  ep.id = 'ep';
  ep.innerHTML = `<header><div class="seg"><i></i><button data-m="ask" class="on">Preguntar</button><button data-m="tutor">Tutor</button></div><button class="x" title="Cerrar" aria-label="Cerrar">✕</button></header>
    <div class="ctx"></div><div class="msgs"></div><div class="sel"><span></span><button type="button" aria-label="Quitar">✕</button></div>
    <form><textarea rows="1" placeholder="Preguntá sobre esta clase"></textarea><button aria-label="Enviar" disabled><svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M8 13V3M3.5 7.5 8 3l4.5 4.5"/></svg></button></form>`;
  const fab = Object.assign(document.createElement('button'), { id: 'ep-fab', textContent: 'Preguntar' });
  const askSel = Object.assign(document.createElement('button'), { id: 'ep-ask', textContent: 'Preguntar sobre esto' });
  document.body.append(ep, fab, askSel);
  const $ = (s) => ep.querySelector(s);
  const hist = { ask: [], tutor: [] };
  let mode = 'ask', selection = '', busy = false;
  const open = (v) => document.body.classList.toggle('ep-on', v);
  if (innerWidth >= 1180) open(true);
  fab.onclick = () => open(true);
  $('.x').onclick = () => open(false);

  function currentLec() {
    let cur = null;
    for (const s of document.querySelectorAll('section.lec[id^="l"]')) if (s.getBoundingClientRect().top < innerHeight * 0.4) cur = s;
    return cur;
  }
  function showCtx() {
    const s = currentLec();
    $('.ctx').textContent = s ? s.querySelector('h2').textContent : 'Bajá hasta una clase para preguntar sobre ella';
  }
  addEventListener('scroll', showCtx, { passive: true }); showCtx();

  function render() {
    const box = $('.msgs');
    const h = hist[mode];
    box.innerHTML = h.length ? h.map((m) => `<div class="m ${m.role === 'user' ? 'u' : ''}">${m.role === 'user' ? esc(m.content) : m.content ? md(m.content) : '<span class="ep-think">Pensando…</span>'}</div>`).join('')
      : `<div class="m e">${mode === 'ask' ? 'Preguntá lo que no entiendas de la clase que estás leyendo, o seleccioná un texto de la guía.' : 'Te enseño la clase paso a paso y te voy chequeando con preguntas. Escribí "empecemos" o un tema.'}</div>`;
    box.scrollTop = box.scrollHeight;
  }
  ep.querySelectorAll('header [data-m]').forEach((b) => (b.onclick = () => {
    mode = b.dataset.m; ep.querySelectorAll('header [data-m]').forEach((x) => x.classList.toggle('on', x === b));
    $('textarea').placeholder = mode === 'ask' ? 'Preguntá sobre esta clase' : 'Respondé o escribí "empecemos"';
    pill(); render();
  }));

  function pill() {
    const on = $('.seg button.on'), i = $('.seg i');
    i.style.width = on.offsetWidth + 'px'; i.style.transform = `translateX(${on.offsetLeft - 3}px)`;
  }
  requestAnimationFrame(pill);
  const ta0 = $('textarea'), send = $('form button');
  const grow = () => { ta0.style.height = 'auto'; ta0.style.height = Math.min(ta0.scrollHeight, 200) + 'px'; send.disabled = !ta0.value.trim() || busy; };
  ta0.addEventListener('input', grow);
  $('.sel button').onclick = () => { selection = ''; $('.sel').style.display = 'none'; };

  async function stream(body, onText) {
    const r = await fetch(E.api, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Estudio-Token': E.token }, body: JSON.stringify(body) });
    if (!r.ok) throw new Error(await r.text());
    const rd = r.body.getReader(), dec = new TextDecoder();
    let all = '';
    for (;;) { const { done, value } = await rd.read(); if (done) break; all += dec.decode(value, { stream: true }); onText(all); }
    return all;
  }

  $('form').onsubmit = async (e) => {
    e.preventDefault();
    const ta = $('textarea'), text = ta.value.trim();
    if (!text || busy) return;
    const s = currentLec();
    const h = hist[mode];
    h.push({ role: 'user', content: selection ? `Sobre: "${selection.slice(0, 200)}${selection.length > 200 ? '…' : ''}"\n${text}` : text });
    const reply = { role: 'assistant', content: '' };
    h.push(reply); ta.value = ''; busy = true; grow(); render();
    const sel = selection; selection = ''; $('.sel').style.display = 'none';
    try {
      await stream({ mode, lec: s ? s.id : null, selection: sel, messages: h.slice(0, -1) }, (t) => { reply.content = t; render(); });
    } catch (err) { reply.content = 'No pude conectar con Claude: ' + err.message; render(); }
    busy = false; grow();
  };
  $('textarea').addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); $('form').requestSubmit(); } });

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
    if (mode !== 'ask') ep.querySelector('[data-m="ask"]').click();
    $('.sel span').textContent = '“' + selection + '”';
    $('.sel').style.display = 'flex'; $('textarea').focus();
  };

  window.estudioGrade = async (out, lec, index, answer, btn) => {
    if (!answer.trim()) { out.textContent = 'Escribí tu respuesta primero.'; return; }
    btn.disabled = true; out.innerHTML = '<p>Corrigiendo…</p>';
    try { await stream({ mode: 'grade', lec, index, answer }, (t) => { out.innerHTML = md(t); }); }
    catch (err) { out.textContent = 'No pude conectar con Claude: ' + err.message; }
    btn.disabled = false;
  };
  render();
})();
