#!/usr/bin/env python3
"""Prepare the source files one lecture's writer needs. Idempotent: existing outputs are reused.

Usage: prepare_lecture.py <course_dir> <NN>
Prints a manifest of the prepared inputs (paths relative to course_dir).
"""
import json, re, shutil, subprocess, sys, zipfile
from pathlib import Path

SKILL = Path(__file__).resolve().parent
course = Path(sys.argv[1]).resolve()
nn = sys.argv[2].zfill(2)
cfg = json.loads((course / "course.json").read_text())
lec = cfg["lectures"][nn]
src = course / "sources"
search_roots = [src / "canvas" / "files", course.parent]


def find(name):
    for root in search_roots:
        hits = sorted(root.rglob(name))
        if hits:
            return hits[0]
    return None


def run(*args):
    return subprocess.run(args, check=True, capture_output=True, text=True).stdout


def words(p):
    return len(p.read_text(errors="ignore").split()) if p.exists() else 0


def ocr(pdf, out_txt):
    binary = Path.home() / ".cache" / "apunte-clase" / "ocr"
    if not binary.exists():
        binary.parent.mkdir(parents=True, exist_ok=True)
        run("swiftc", "-O", str(SKILL / "ocr.swift"), "-o", str(binary))
    pages = out_txt.with_suffix("")
    pages.mkdir(parents=True, exist_ok=True)
    run("pdftoppm", "-png", "-r", "150", str(pdf), str(pages / "p"))
    out_txt.write_text(run(str(binary), *sorted(str(p) for p in pages.glob("p-*.png"))))


manifest = []

if lec.get("slides"):
    pdf = find(lec["slides"])
    if pdf:
        dest = src / "slides" / f"L{nn}.pdf"
        dest.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy(pdf, dest)
        run("pdftotext", "-layout", str(dest), str(dest.with_suffix(".txt")))
        png_dir = src / "slides" / f"L{nn}"
        png_dir.mkdir(exist_ok=True)
        if not any(png_dir.glob("p-*.png")):
            run("pdftoppm", "-png", "-r", "80", str(dest), str(png_dir / "p"))
        manifest.append(f"slides: sources/slides/L{nn}.pdf, .txt and L{nn}/p-*.png ({len(list(png_dir.glob('p-*.png')))} pages)")
    else:
        manifest.append(f"slides: MISSING {lec['slides']} (run canvas_sync first or not posted yet)")
else:
    manifest.append("slides: none listed in course.json; check sources/canvas/index.json for this lecture's page")

book = cfg.get("book")
if book and lec.get("chapters"):
    book_pdf = (course / book["path"]).resolve()
    for ch in lec["chapters"]:
        out = src / "book" / f"ch{int(ch):02d}.txt"
        if not out.exists():
            a, b = book["chapters_pdf_pages"][str(ch)]
            out.parent.mkdir(parents=True, exist_ok=True)
            out.write_text(run("pdftotext", "-layout", "-f", str(a), "-l", str(b), str(book_pdf), "-"))
        manifest.append(f"book: sources/book/{out.name} (book PDF pages {book['chapters_pdf_pages'][str(ch)]}, book page = PDF page - {book['pdf_page_offset']})")

for name in lec.get("readers", []):
    pdf = find(name)
    if not pdf:
        manifest.append(f"reader: MISSING {name}")
        continue
    out = src / "readers" / (Path(name).stem + ".txt")
    out.parent.mkdir(parents=True, exist_ok=True)
    if not out.exists():
        run("pdftotext", "-layout", str(pdf), str(out))
        if words(out) < 200:
            ocr(pdf, out)
    manifest.append(f"reader: sources/readers/{out.name} ({words(out)} words) from {pdf}")

if lec.get("quiz"):
    out = src / "quiz" / f"L{nn}.txt"
    if not out.exists():
        pdf, pptx = find(lec["quiz"] + ".pdf"), find(lec["quiz"] + ".pptx")
        out.parent.mkdir(parents=True, exist_ok=True)
        if pdf:
            run("pdftotext", "-layout", str(pdf), str(out))
        elif pptx:
            with zipfile.ZipFile(pptx) as z:
                slides = sorted((n for n in z.namelist() if re.match(r"ppt/slides/slide\d+\.xml", n)),
                                key=lambda n: int(re.findall(r"\d+", n)[0]))
                out.write_text("\n\n".join(" ".join(re.findall(r"<a:t>([^<]*)</a:t>", z.read(n).decode())) for n in slides))
    if out.exists():
        manifest.append(f"quiz: sources/quiz/L{nn}.txt")

for key in ("paper", "granola", "video_panopto", "clips", "prior"):
    if lec.get(key):
        manifest.append(f"{key}: {lec[key]}")
for t in sorted((src / "transcripts").glob(f"L{nn}_*.txt")):
    manifest.append(f"transcript: sources/transcripts/{t.name} ({words(t)} words)")
notes = src / "notes" / f"L{nn}.md"
if notes.exists() or cfg.get("notes_export_glob"):
    manifest.append(f"student notes: sources/notes/L{nn}.md" + ("" if notes.exists() else " (MISSING: extract it from the newest notes export)"))

print(f"L{nn} {lec['title']}")
print("\n".join("- " + m for m in manifest))
