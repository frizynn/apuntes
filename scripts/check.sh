#!/bin/zsh
# Style and integrity checks on lecture files. Usage: check.sh <course_dir> [LNN ...]
setopt null_glob
course=$1; shift
files=(); if [ $# -gt 0 ]; then for l in "$@"; do files+=("$course/lectures/$l.md"); done; else files=("$course"/lectures/L*.md); fi
fail=0
maxw=$(python3 -c "import json,sys;print(json.load(open(sys.argv[1])).get('max_words',2500))" "$course/course.json")
maxpx=$(python3 -c "import json,sys;print(json.load(open(sys.argv[1])).get('max_image_px',480))" "$course/course.json")
for f in $files; do
  n=$(basename $f .md)
  num=$(grep -c -E '^#{2,4} +([0-9]+(\.[0-9]+)*\.? |Step [0-9])' $f)
  dash=$(grep -c '—' $f)
  refs=$(grep -n -i -E '\bthe slides?\b|\bon the slide|\(slide|lecturer|in class\b|the chapter\b|the recording|the transcript|the book says|as the professor|la slide|las slides|en clase|el profesor|la profesora|la grabaci|la transcripci|el libro dice' $f)
  imgs=$(grep -o '!\[[^]]*\](img/[^)]*)' $f | sed 's/.*(\(.*\))/\1/')
  miss=""; big=""; for i in ${(f)imgs}; do
    if [ -f "$course/$i" ] && [[ $i == *.svg ]]; then
      grep -q -E '(fill|stroke)="#|style="' "$course/$i" && big="$big $i(hardcoded colour: use the diagram classes)"
    elif [ -f "$course/$i" ]; then
      px=$(sips -g pixelWidth -g pixelHeight "$course/$i" | awk '/pixel/{if($2>m)m=$2}END{print m}')
      [ $px -gt $((maxpx + 20)) ] && big="$big $i(${px}px)"
    else miss="$miss $i"; fi
  done
  wc=$(wc -w < $f | tr -d ' ')
  bold=$(grep -o '\*\*[^*]*\*\*' $f | wc -l | tr -d ' ')
  legacy=$(grep -o '!\[\]\[[A-Za-z0-9_]*image[0-9]*\]' $f | grep -o '[A-Za-z0-9_]*image[0-9]*' | while read k; do cat "$course"/sources/notes/image_defs.md "$course"/sources/notes/L*_images.md 2>/dev/null | grep -q "^\[$k\]:" || echo -n " $k"; done)
  echo "$n: $wc words, $(echo $imgs | grep -c img) images, numbered-headings=$num emdash=$dash bold=$bold"
  [ -n "$refs" ] && { echo "  source refs (check by hand, may be legit content):"; echo "$refs" | cut -c1-140 | sed 's/^/    /'; }
  [ -n "$miss$legacy" ] && { echo "  MISSING images:$miss$legacy"; fail=1; }
  [ -n "$big" ] && { echo "  TOO BIG (max ${maxpx}px, use sips -Z $maxpx):$big"; fail=1; }
  [ $wc -gt $maxw ] && { echo "  TOO LONG: $wc words (max $maxw)"; fail=1; }
  [ $bold -gt 30 ] && { echo "  TOO MUCH BOLD: $bold (max 30, only key terms)"; fail=1; }
  [ $num -gt 0 -o $dash -gt 0 ] && fail=1
done
exit $fail
