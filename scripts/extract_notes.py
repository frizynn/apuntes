#!/usr/bin/env python3
"""Copy one lecture's section of a Google Docs markdown export into sources/notes/LNN.md.

Google Docs numbers exported images image1..imageN for the whole doc, so numbers shift between exports.
This renames the section's references to LNN_imageK and stores their definitions in sources/notes/LNN_images.md.
Usage: extract_notes.py <course_dir> <NN> <export.md> <first_line> <last_line>
"""
import re, sys
from pathlib import Path

course, nn, export = Path(sys.argv[1]), sys.argv[2].zfill(2), Path(sys.argv[3]).expanduser()
a, b = int(sys.argv[4]), int(sys.argv[5])
lines = export.read_text().splitlines()
section = "\n".join(lines[a - 1:b])
defs = dict(re.findall(r"^\[(image\d+)\]: (<data:[^>]+>)", "\n".join(lines), re.M))
used = sorted(set(re.findall(r"!\[[^\]]*\]\[(image\d+)\]", section)), key=lambda k: int(k[5:]))
for k in used:
    section = section.replace(f"][{k}]", f"][L{nn}_{k}]")
notes = course / "sources" / "notes"
notes.mkdir(parents=True, exist_ok=True)
(notes / f"L{nn}.md").write_text(section + "\n")
(notes / f"L{nn}_images.md").write_text("\n\n".join(f"[L{nn}_{k}]: {defs[k]}" for k in used if k in defs) + "\n")
print(f"L{nn}: {b - a + 1} lines, {len(section.split())} words, images {used}")
