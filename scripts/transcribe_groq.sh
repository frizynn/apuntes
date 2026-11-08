#!/bin/zsh
# Transcribe an audio file with Groq whisper-large-v3-turbo. Key from Keychain service "groq-api-key".
# Usage: transcribe_groq.sh <audio.mp3> <out.txt> [language=en]
set -euo pipefail
in=$1; out=$2; lang=${3:-en}
key=$(security find-generic-password -s groq-api-key -w)
tmp=$(mktemp -d)
# Groq rejects files over 25 MB: split into 60-minute chunks when needed.
if [ $(stat -f%z "$in") -gt 24000000 ]; then
  ffmpeg -nostdin -loglevel error -i "$in" -f segment -segment_time 3600 -c copy "$tmp/part_%02d.mp3"
else
  cp "$in" "$tmp/part_00.mp3"
fi
: > "$out"; offset=0
for p in "$tmp"/part_*.mp3; do
  curl -sS --fail https://api.groq.com/openai/v1/audio/transcriptions -H "Authorization: Bearer $key" \
    -F file=@"$p" -F model=whisper-large-v3-turbo -F language="$lang" -F response_format=verbose_json -o "$tmp/r.json"
  python3 - "$tmp/r.json" "$out" "$offset" <<'PY'
import json, sys
d = json.load(open(sys.argv[1])); off = float(sys.argv[3])
with open(sys.argv[2], 'a') as f:
    for s in d['segments']:
        t = s['start'] + off
        f.write('[%02d:%02d:%02d] %s\n' % (t // 3600, t % 3600 // 60, t % 60, s['text'].strip()))
PY
  offset=$(python3 -c "print($offset + float('$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$p")'))")
done
rm -rf "$tmp"
echo "$out: $(wc -w < "$out") words, $(tail -1 "$out" | cut -c1-10)"
