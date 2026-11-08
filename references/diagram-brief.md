# Diagram brief

Diagrams explain what prose struggles with: a process, a model with parts, a comparison, a before/after, a cause and its
effect. Style: minimal and calm, like a careful hand-made figure. Two references next to this file:
`diagram-example.svg` (the visual style) and `diagram-example-story.svg` (what a teaching diagram must do).

## A diagram must teach on its own
The student's verdict on diagrams with only labels ("lo diseñado", "moderation"): "too empty, I don't understand them".
- Someone who skipped the text must get the idea from the diagram alone.
- Put the running example inside it: next to each part, one concrete line of what happens in the example (who does
  what). Labels alone are not enough.
- Every arrow says in plain words what it means or asks ("¿se aplica como se diseñó?"), not only its technical name.
- Each box: the exam term in bold, then its meaning in 3-6 plain words.
- One rich diagram per model beats several thin ones. Tall layouts (steps top to bottom with the example on the right)
  are fine and often clearer than a cramped row.

## When to draw one
- Every lecture gets 2-4 diagrams, each for a central model or idea the exam asks about.
- Good shapes: a chain of boxes with arrows (process, model), two panels side by side (before/after, A vs B), a 2x2
  grid (two dimensions), boxes grouped under a header (types of something), a simple axis (a scale, a timeline).
- Never draw decoration, a diagram of a single box, or a copy of a slide that already works as a screenshot.

## How to write it
- A plain SVG file `img/LNN/<name>.svg`, `viewBox` width 720, height whatever fits (220-700). No `width`/`height`
  attributes. Start with `<rect class="panel" ... rx="14"/>` covering the whole viewBox.
- Colours only through these classes, never `fill="#..."` or `stroke="#..."` (the guide switches light and dark):
  - shapes: `box` (neutral), `acc-box` (accent outline), `acc-fill` (the key element), `bad-fill`, `good-fill`
  - lines: `line`, `acc-line`, add `dash` for dashed; arrowheads with the two markers from the example (`head`, `acc-head`)
  - text: default is muted; `strong` for labels inside boxes, `title` for the diagram title, `small`, `b` (bold),
    `acc`, `bad`, `good` for coloured words, `mid` to centre text on its x.
- One accent at most per diagram: highlight the single thing the reader must notice. Everything else neutral.
- Boxes `rx="10"`, strokes come from the classes, 24px or more between boxes, arrows with right angles (`H`/`V` paths).
- Text: short lines (up to about 40 characters, split long ones over two `<text>` lines), 15px default (`small` is 13px). A short title top left (`title`, x=28, y=42).
  Optional one-sentence takeaway in an `acc-fill` box at the bottom. Text in the guide's language, exam terms in English.
- Add `role="img"` and an `aria-label` that says what the diagram shows in one sentence.

## Check it
Run `node <skill>/scripts/render_svg.mjs img/LNN/<name>.svg /tmp/<name>` and look at both PNGs: text must not touch or
cross a box edge, nothing overlaps, it reads at a glance. Fix and render again until it does.

Insert it in the lecture as `![Caption that says what to notice](img/LNN/<name>.svg)` right where the idea is explained,
and keep the prose short around it: the diagram carries the structure, the text gives the meaning and the example.
