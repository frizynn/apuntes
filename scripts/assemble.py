#!/usr/bin/env python3
"""Join lectures/L*.md into the course's single notes file, embedding img/ images as data URIs.

Usage: assemble.py <course_dir>   (output name from course.json "output")
"""
import base64, json, re, sys
from pathlib import Path

course = Path(sys.argv[1]).resolve()
cfg = json.loads((course / "course.json").read_text())
files = sorted((course / "lectures").glob("L*.md"))
titles = [f.read_text().splitlines()[0].lstrip("# ").strip() for f in files]
parts = [f"# {cfg['title']}\n\nStudy notes, {len(files)} lectures.\n\n" + "\n".join(f"- {t}" for t in titles) + "\n"]
defs, missing = [], []


def embed(m):
    cap, rel = m.group(1), m.group(2)
    p = course / rel
    if not p.exists():
        missing.append(rel)
        return m.group(0)
    key = re.sub(r"[^A-Za-z0-9]", "_", rel)
    mime = "image/png" if p.suffix.lower() == ".png" else "image/jpeg"
    defs.append(f"[{key}]: <data:{mime};base64,{base64.b64encode(p.read_bytes()).decode()}>")
    return f"![{cap}][{key}]"


for f in files:
    parts.append(re.sub(r"!\[([^\]]*)\]\((img/[^)]+)\)", embed, f.read_text()))
notes = course / "sources" / "notes"
tail = "\n\n".join(p.read_text() for p in [notes / "image_defs.md", *sorted(notes.glob("L*_images.md"))] if p.exists())
body = "\n\n".join(parts)
used = set(re.findall(r"!\[[^\]]*\]\[([^\]]+)\]", body))
defs += [d for d in re.findall(r"^\[[^\]]+\]: <data:[^>]+>", tail, re.M) if d[1:d.index("]")] in used]
out = course / cfg["output"]
out.write_text(body + "\n\n" + "\n\n".join(defs) + "\n")
print(f"{out.name}: {len(files)} lectures, {len(defs)} images embedded, {out.stat().st_size // 1024} KB")
if missing:
    sys.exit(f"missing images: {missing}")
