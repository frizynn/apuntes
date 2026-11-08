#!/usr/bin/env python3
"""Build the course's single study-guide HTML from lectures/L*.md, with images embedded.

Usage: build_html.py <course_dir>   (writes <course_dir>/../<course.json output_html>)
Needs pandoc. Each lecture's headings shift down one level so the course title is the only h1.
"""
import base64, html, json, re, subprocess, sys
from datetime import date
from pathlib import Path

course = Path(sys.argv[1]).resolve()
cfg = json.loads((course / "course.json").read_text())
files = sorted((course / "lectures").glob("L*.md"))
missing = []

CSS = """
:root{--fg:#1f1e1d;--mute:#6b6a68;--line:#ebe9e4;--soft:#f7f6f3;--acc:#c96442}
*{box-sizing:border-box}html{scroll-behavior:smooth}
body{margin:0;background:#fff;color:var(--fg);font:16px/1.65 "Anthropic Sans","Styrene B","Söhne",Inter,-apple-system,system-ui,sans-serif;-webkit-font-smoothing:antialiased}
main{max-width:740px;margin:0 auto;padding:32px 16px 96px}
nav.bar{position:sticky;top:0;z-index:8;height:48px;background:rgba(255,255,255,.92);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);box-shadow:0 1px 0 var(--line);display:flex;align-items:center;gap:4px;padding:0 10px;font-size:13px}
nav.bar .t{flex:1;min-width:0;padding:0 6px;font-weight:550;font-size:14px;color:var(--fg);text-decoration:none;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
nav.bar .b{display:inline-flex;align-items:center;gap:6px;height:30px;padding:0 10px;border:0;border-radius:8px;background:none;color:var(--mute);font:inherit;font-size:13px;text-decoration:none;cursor:pointer;white-space:nowrap;transition:background .08s,color .08s}
nav.bar .b:hover{background:rgba(0,0,0,.04);color:var(--fg)}nav.bar .b.on{background:rgba(0,0,0,.06);color:var(--fg)}
nav.bar svg{width:16px;height:16px;flex:none}
@media (max-width:520px){nav.bar .b span{display:none}nav.bar .b{padding:0 8px}}
h1{font-size:28px;font-weight:600;margin:0 0 6px;letter-spacing:-.01em}
h2{font-size:23px;font-weight:600;margin:0 0 8px;letter-spacing:-.01em}
h3{font-size:19px;font-weight:600;margin:40px 0 6px}
h4{font-size:16px;font-weight:600;margin:26px 0 6px}
h5{font-size:15px;font-weight:600;margin:18px 0 4px;color:var(--mute)}
.lead,.when{color:var(--mute)}.when{font-size:13px;margin:0;text-transform:uppercase;letter-spacing:.04em}
p{margin:8px 0}ul,ol{padding-left:22px;margin:8px 0}li{margin:4px 0}
blockquote{margin:14px 0;background:var(--soft);border-left:3px solid var(--acc);border-radius:0 10px 10px 0;padding:10px 16px}
blockquote p{margin:4px 0}
table{border-collapse:collapse;width:100%;font-size:14px;margin:12px 0;display:block;overflow-x:auto}
th,td{border-bottom:1px solid var(--line);padding:7px 8px;text-align:left;vertical-align:top}th{font-weight:600}
code{background:var(--soft);padding:1px 5px;border-radius:4px;font-size:13px}
figure{margin:18px 0}figure img,p img{display:block;max-width:100%;height:auto;border:1px solid var(--line);border-radius:8px}
figcaption{color:var(--mute);font-size:13px;margin-top:6px}
.toc{border:1px solid var(--line);border-radius:12px;padding:14px 18px;margin:24px 0}
.toc ol{margin:6px 0 0;padding-left:22px}.toc li{margin:8px 0}
.toc a{color:var(--fg);text-decoration:none;font-weight:500}.toc a:hover{color:var(--acc)}
.toc span{display:block;color:var(--mute);font-size:13px;line-height:1.4}
section.lec{scroll-margin-top:56px;border-top:1px solid var(--line);margin-top:56px;padding-top:36px}
section.lec h3,section.lec h4{scroll-margin-top:52px}
.kind{display:inline-block;font-size:12px;color:var(--mute);border:1px solid var(--line);border-radius:20px;padding:1px 9px;margin-bottom:8px}
aside.side{display:none;font-size:13px;line-height:1.4}
@media (min-width:1180px){body:not(.toc-off) aside.side{display:block;position:fixed;top:68px;right:24px;width:270px;max-height:calc(100vh - 92px);overflow-y:auto;padding-left:12px;box-shadow:-1px 0 0 var(--line)}}
@media (max-width:1179px){body.toc-open aside.side{display:block;position:fixed;z-index:9;top:48px;left:0;right:0;bottom:0;overflow-y:auto;background:#fff;padding:12px 20px 40px}body.toc-open aside.side .grp .s{display:block}}
aside.side a{display:block;color:var(--mute);text-decoration:none;padding:3px 0}aside.side a:hover{color:var(--fg)}
aside.side .l{font-weight:600;margin-top:10px}aside.side .s{padding-left:10px}
aside.side .grp:not(.open) .s{display:none}
aside.side a.on,nav a.on{color:var(--acc)}
.practice{margin-top:40px;border-top:1px dashed var(--line);padding-top:8px}
.q{background:var(--soft);border-radius:12px;padding:14px 16px;margin:14px 0}
.q .qt{margin:0 0 10px;font-weight:500}
.opts button{display:block;width:100%;text-align:left;font:inherit;font-size:15px;color:var(--fg);background:#fff;border:1px solid var(--line);border-radius:8px;padding:9px 12px;margin:6px 0;cursor:pointer}
.opts button:hover:not(:disabled){border-color:var(--mute)}
.opts button:disabled{cursor:default}
.opts button.ok{border-color:#2f8f5b;background:#eef8f2}.opts button.bad{border-color:#c0392b;background:#fbeeed}
.why{margin-top:10px;font-size:15px}.why a,.q details a{color:var(--acc)}
.q textarea{width:100%;min-height:110px;font:inherit;font-size:15px;border:1px solid var(--line);border-radius:8px;padding:8px 10px;margin:4px 0 8px;background:#fff}
.q summary{cursor:pointer;color:var(--acc);font-size:15px}
.score{color:var(--mute);font-size:14px}
.btn{font:inherit;font-size:14px;border:1px solid var(--line);background:#fff;border-radius:20px;padding:6px 14px;cursor:pointer}
#exam{max-width:740px;margin:0 auto;padding:28px 16px 96px}#exam .back{display:inline-block;color:var(--mute);text-decoration:none;font-size:14px;margin-bottom:16px}#exam .back:hover{color:var(--fg)}
body.exam main,body.exam aside.side,body.exam .top{display:none!important}
.top{position:fixed;right:16px;bottom:16px;background:#fff;border:1px solid var(--line);border-radius:20px;padding:6px 12px;font-size:13px;color:var(--mute);text-decoration:none}
"""


def embed(m):
    alt, rel = m.group(1), m.group(2)
    p = course / rel
    if not p.exists():
        missing.append(rel)
        return m.group(0)
    mime = "image/png" if p.suffix.lower() == ".png" else "image/jpeg"
    return f"![{alt}](data:{mime};base64,{base64.b64encode(p.read_bytes()).decode()})"


UI = {"es": ("Inicio", "Guía de estudio: {n} clases, actualizada el {d}.", "Índice", "Arriba", "Práctica", "Simulacro",
             "Respondé primero, después mirá la explicación.", "Ver en la guía", "Escribí tu respuesta en inglés antes de mirar",
             "Qué tiene que tener la respuesta", "Respuesta modelo", "Nuevo simulacro", "Correctas",
             "Preguntas mezcladas de todas las clases, como en el examen. Cada vez que tocás el botón salen otras."),
      "en": ("Home", "Study guide: {n} lectures, updated {d}.", "Contents", "Top", "Practice", "Mock exam",
             "Answer first, then read the explanation.", "See in the guide", "Write your answer before looking",
             "What the answer needs", "Model answer", "New mock exam", "Correct",
             "Mixed questions from every lecture, like the exam. Each click draws new ones.")}[cfg.get("ui_language", "en")]
practice = {}
sections, toc, side = [], [], []
for f in files:
    key = f.stem.lower()
    lec = cfg["lectures"].get(f.stem[1:], {})
    lines = f.read_text().splitlines()
    title = lines[0].lstrip("# ").strip()
    body = "\n".join(lines[1:])
    subs = [h.strip() for h in re.findall(r"^## +(.+)$", body, re.M)]
    md = re.sub(r"!\[([^\]]*)\]\((img/[^)]+)\)", embed, body)
    frag = subprocess.run(["pandoc", "-f", "markdown", "-t", "html5", "--shift-heading-level-by=1",
                           f"--id-prefix={key}-"], input=md, capture_output=True, text=True, check=True).stdout
    when = " · ".join(x for x in [lec.get("kind", ""), lec.get("date", "")] if x)

    heads = re.findall(r'<h3 id="([^"]+)"[^>]*>(.*?)</h3>', frag, re.S)
    pf = course / "practice" / f"{f.stem}.json"
    if pf.exists():
        ids = {html.unescape(re.sub(r"<[^>]+>", "", t)).strip(): i for i, t in heads}
        pd = json.loads(pf.read_text())
        for q in pd.get("mc", []) + pd.get("open", []):
            q["ref"] = ids.get(q.get("ref", ""), key)
            q["lec"] = key
        practice[key] = {"title": title, **pd}
        pid = f"{key}-practica"
        frag += (f'<div class="practice"><h3 id="{pid}">{UI[4]}</h3><p class="lead">{UI[6]}</p>'
                 f'<div class="pr" data-lec="{key}"></div></div>')
        heads.append((pid, UI[4]))
    side.append(f'<div class="grp" data-sec="{key}"><a class="l" href="#{key}">{html.escape(title)}</a>'
                + "".join(f'<a class="s" href="#{i}">{re.sub(r"<[^>]+>", "", t)}</a>' for i, t in heads) + "</div>")
    sections.append(f'<section class="lec" id="{key}" data-src="{f.name}">\n<span class="kind">{html.escape(when)}</span>\n'
                    f'<h2>{html.escape(title)}</h2>\n{frag}</section>')
    toc.append(f'<li><a href="#{key}">{html.escape(title)}</a><span>{html.escape(", ".join(subs[:5]))}</span></li>')

page = f"""<!doctype html>
<html lang="{cfg.get('language', 'en')}"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>{html.escape(cfg['title'])}</title>
<style>{CSS}</style></head>
<body>
<nav class="bar"><span id="barl"></span><a class="t" href="#top">{html.escape(cfg['title'])}</a>{f'<a class="b" href="#exam"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 2.5h10v11H3zM5.5 6l1.5 1.5L10 4.5M5.5 10.5h5"/></svg><span>{UI[5]}</span></a>' if practice else ""}<button class="b" id="tocbtn" aria-label="{UI[2]}"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M2.5 4h11M2.5 8h11M2.5 12h7"/></svg><span>{UI[2]}</span></button></nav>
<main id="top">
<h1>{html.escape(cfg['title'])}</h1>
<p class="lead">{UI[1].format(n=len(files), d=date.today().strftime('%d/%m/%Y'))}</p>
<div class="toc"><p class="when">{UI[2]}</p><ol>
{chr(10).join(toc)}
</ol></div>
{chr(10).join(sections)}
</main>
{f'''<div id="exam" hidden><a class="back" href="#top">&larr; {UI[0]}</a><h1>{UI[5]}</h1><p class="lead">{UI[13]}</p>
<button class="btn" id="newsim">{UI[11]}</button><div id="sim"></div></div>''' if practice else ""}
<aside class="side">{''.join(side)}</aside>
<a class="top" href="#top">{UI[3]}</a>
<script>
const links=[...document.querySelectorAll('aside.side a')];
const tb=document.getElementById('tocbtn'),wide=()=>innerWidth>=1180;
let tocOff=false;try{{tocOff=localStorage.getItem('toc-off')==='1'}}catch(e){{}}
function tocSync(){{document.body.classList.toggle('toc-off',tocOff);tb.classList.toggle('on',wide()?!tocOff:document.body.classList.contains('toc-open'))}}
tb.onclick=()=>{{if(wide()){{tocOff=!tocOff;try{{localStorage.setItem('toc-off',tocOff?'1':'0')}}catch(e){{}}}}else document.body.classList.toggle('toc-open');tocSync()}};
document.querySelector('aside.side').addEventListener('click',e=>{{if(e.target.closest('a'))document.body.classList.remove('toc-open');tocSync()}});
addEventListener('resize',tocSync);tocSync();
const targets=[...document.querySelectorAll('section.lec, section.lec h3')];
function spy(){{
  let cur=null;for(const t of targets){{if(t.getBoundingClientRect().top<innerHeight*0.35)cur=t;else break;}}
  const sec=cur?(cur.closest('section.lec')||cur):null;
  links.forEach(a=>{{const id=a.getAttribute('href').slice(1);a.classList.toggle('on',!!cur&&(id===cur.id||(id===sec.id&&!a.classList.contains('l')&&a.closest('nav'))))}});
  document.querySelectorAll('aside.side .grp').forEach(g=>{{const o=!!sec&&g.dataset.sec===sec.id;g.classList.toggle('open',o);g.querySelector('.l').classList.toggle('on',o)}});
  const act=document.querySelector('aside.side a.s.on');if(act)act.scrollIntoView({{block:'nearest'}});
}}
addEventListener('scroll',spy,{{passive:true}});spy();
const P={json.dumps(practice, ensure_ascii=False).replace("</", "<\\/")};
const T={json.dumps(UI[7:13], ensure_ascii=False)};
function el(t,c,h){{const e=document.createElement(t);if(c)e.className=c;if(h!=null)e.innerHTML=h;return e;}}
function esc(s){{return String(s).replace(/[&<>]/g,c=>({{'&':'&amp;','<':'&lt;','>':'&gt;'}})[c]);}}
function md(s){{return esc(s).replace(/\\*\\*(.+?)\\*\\*/g,'<b>$1</b>').replace(/\\*(.+?)\\*/g,'<i>$1</i>');}}
function score(box){{const s=box.querySelector('.score');if(!s)return;const a=box.querySelectorAll('.q[data-done]');const ok=box.querySelectorAll('.q[data-done="1"]');s.textContent=T[5]+': '+ok.length+' / '+a.length;}}
function mc(q,n,box){{const d=el('div','q');d.append(el('p','qt',n+'. '+md(q.q)));const o=el('div','opts');
  q.options.forEach((t,i)=>{{const b=el('button','',String.fromCharCode(65+i)+'. '+md(t));b.onclick=()=>{{
    o.querySelectorAll('button').forEach((x,j)=>{{x.disabled=true;if(j===q.answer)x.classList.add('ok');}});
    if(i!==q.answer)b.classList.add('bad');d.dataset.done=i===q.answer?'1':'0';
    d.append(el('div','why',md(q.why)+' <a href="#'+q.ref+'">'+T[0]+'</a>'));score(box);}};o.append(b);}});
  d.append(o);return d;}}
function op(q,n){{const d=el('div','q');d.append(el('p','qt',n+'. '+md(q.q)));const ta=el('textarea');ta.placeholder=T[1];d.append(ta);
  const det=el('details');det.append(el('summary','',T[2]));det.append(el('ul','',q.points.map(p=>'<li>'+md(p)+'</li>').join('')));
  det.append(el('p','','<b>'+T[3]+':</b> '+md(q.model)+' <a href="#'+q.ref+'">'+T[0]+'</a>'));
  if(window.ESTUDIO){{const b=el('button','btn','Grade with Claude'),out=el('div','why');b.onclick=()=>window.estudioGrade(out,q.lec,P[q.lec].open.indexOf(q),ta.value,b);d.append(b,out);}}
  d.append(det);return d;}}
function fill(box,mcs,ops){{box.innerHTML='';box.append(el('p','score'));let n=1;mcs.forEach(q=>box.append(mc(q,n++,box)));ops.forEach(q=>box.append(op(q,n++)));score(box);}}
document.querySelectorAll('.pr').forEach(b=>{{const p=P[b.dataset.lec];fill(b,p.mc||[],p.open||[]);}});
function shuffle(a){{a=a.slice();for(let i=a.length-1;i>0;i--){{const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}}return a;}}
function sim(){{const all=Object.values(P);fill(document.getElementById('sim'),shuffle(all.flatMap(p=>p.mc||[])).slice(0,20),shuffle(all.flatMap(p=>p.open||[])).slice(0,2));}}
const nb=document.getElementById('newsim');if(nb)nb.onclick=()=>{{sim();scrollTo(0,0);}};
const ex=document.getElementById('exam');let pos=0;
function route(){{if(!ex)return;const on=location.hash==='#exam';if(on&&!document.body.classList.contains('exam'))pos=scrollY;
  document.body.classList.toggle('exam',on);ex.hidden=!on;document.querySelector('nav.bar a[href="#exam"]')?.classList.toggle('on',on);
  if(on){{if(!document.getElementById('sim').children.length)sim();scrollTo(0,0);}}else if(location.hash==='#top'||!location.hash)scrollTo(0,pos);}}
addEventListener('hashchange',route);route();
</script>
</body></html>
"""
out = course.parent / cfg["output_html"]
out.write_text(page)
print(f"{out.name}: {len(files)} lectures, {page.count('data:image')} images, {out.stat().st_size // 1024} KB")
if missing:
    sys.exit(f"missing images: {missing}")
