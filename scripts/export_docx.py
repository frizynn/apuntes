#!/usr/bin/env python3
"""Export the course notes to .docx with real Heading 1/2/3 styles, so Google Docs shows the sections in its outline.

A PDF uploaded to Google Docs loses heading styles; a .docx keeps them. Needs pandoc (brew install pandoc).
Usage: export_docx.py <course_dir> <out.docx>
"""
import base64, json, re, subprocess, sys, tempfile
from pathlib import Path

course = Path(sys.argv[1]).resolve()
out = Path(sys.argv[2]).resolve()
cfg = json.loads((course / "course.json").read_text())
tmp = Path(tempfile.mkdtemp())

notes = course / "sources" / "notes"
legacy = {}
for f in [notes / "image_defs.md", *sorted(notes.glob("L*_images.md"))]:
    if f.exists():
        for key, mime, data in re.findall(r"^\[([^\]]+)\]: <data:image/(\w+);base64,([^>]+)>", f.read_text(), re.M):
            legacy[key] = (mime, data)


def legacy_img(m):
    key = m.group(2)
    if key not in legacy:
        return ""
    mime, data = legacy[key]
    p = tmp / f"{key}.{'jpg' if mime == 'jpeg' else mime}"
    p.write_bytes(base64.b64decode(data))
    return f"![{m.group(1)}]({p}){{width=7cm}}"


files = sorted((course / "lectures").glob("L*.md"))
parts = [f"# {cfg['title']}\n\nStudy notes, {len(files)} lectures.\n"]
for f in files:
    text = f.read_text()
    text = re.sub(r"!\[([^\]]*)\]\((img/[^)]+)\)", lambda m: f"![{m.group(1)}]({course / m.group(2)}){{width=7cm}}", text)
    text = re.sub(r"!\[([^\]]*)\]\[([^\]]+)\]", legacy_img, text)
    parts.append(text)
# A Word TOC field shows up empty in Google Docs, so prepend a plain list of links to the heading bookmarks instead.
tpl = tmp / "toc.tpl"
tpl.write_text("$toc$")
lectures_md = tmp / "lectures.md"
lectures_md.write_text("\n\n".join(parts[1:]))
toc = subprocess.run(["pandoc", str(lectures_md), "-f", "markdown-implicit_figures", "-t", "markdown", "--toc", "--toc-depth=2",
                      "--standalone", "--template", str(tpl)], check=True, capture_output=True, text=True).stdout
src = tmp / "notes.md"
src.write_text(f"{parts[0]}\n**Contents**\n\n{toc}\n\n{lectures_md.read_text()}")
subprocess.run(["pandoc", str(src), "-f", "markdown-implicit_figures", "-o", str(out)], check=True)
print(f"{out}: {out.stat().st_size // 1024} KB, {len(files)} lectures")
