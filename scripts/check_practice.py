#!/usr/bin/env python3
"""Validate practice/LNN.json files. Usage: check_practice.py <course_dir> [LNN ...]"""
import json, re, sys
from collections import Counter
from pathlib import Path

course = Path(sys.argv[1]).resolve()
cfg = json.loads((course / "course.json").read_text())
names = sys.argv[2:] or sorted(p.stem for p in (course / "practice").glob("L*.json"))
fail = 0
for n in names:
    errs = []
    p = course / "practice" / f"{n}.json"
    lec = course / "lectures" / f"{n}.md"
    if not p.exists():
        print(f"{n}: MISSING {p.name}"); fail = 1; continue
    d = json.loads(p.read_text())
    heads = set(h.strip() for h in re.findall(r"^## +(.+)$", lec.read_text(), re.M)) if lec.exists() else set()
    tutorial = cfg["lectures"].get(n[1:], {}).get("kind") == "tutorial"
    need_mc, need_open = (6, 2) if tutorial else (10, 3)
    mc, op = d.get("mc", []), d.get("open", [])
    if len(mc) < need_mc: errs.append(f"{len(mc)} mc (need {need_mc})")
    if len(op) < need_open: errs.append(f"{len(op)} open (need {need_open})")
    for i, q in enumerate(mc):
        if len(q.get("options", [])) != 4 or q.get("answer") not in range(4) or not q.get("why") or not q.get("q"):
            errs.append(f"mc {i}: needs q, 4 options, answer 0-3, why")
        if q.get("ref") not in heads: errs.append(f"mc {i}: ref not a ## heading: {q.get('ref')!r}")
    for i, q in enumerate(op):
        if not (q.get("q") and q.get("points") and q.get("model")): errs.append(f"open {i}: needs q, points, model")
        if q.get("ref") not in heads: errs.append(f"open {i}: ref not a ## heading: {q.get('ref')!r}")
    pos = Counter(q.get("answer") for q in mc)
    low = [k for k in range(4) if pos[k] < (1 if tutorial else 2)]
    if mc and low: errs.append(f"answer positions unbalanced {dict(pos)}")
    if "—" in p.read_text(): errs.append("em dash")
    print(f"{n}: {len(mc)} mc, {len(op)} open, answers {dict(sorted(pos.items()))}" + ("" if not errs else "\n  " + "\n  ".join(errs)))
    fail |= bool(errs)
sys.exit(fail)
