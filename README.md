# apunte-clase

Convierte una materia en **una sola guía de estudio** (HTML) y te deja estudiarla con Claude al costado.

![Guía de estudio con Claude al costado](docs/estudio.jpg)

- **Guía por materia:** un agente por clase lee las slides, la grabación, las lecturas y los videos, y escribe la clase explicada, con capturas de las slides y los estudios con pregunta, método, resultado y qué muestran.
- **Práctica:** al final de cada clase hay multiple choice con explicación y preguntas abiertas con respuesta modelo, más un simulacro que mezcla todas las clases.
- **Claude al costado:** preguntá sobre la clase que estás leyendo (o un texto seleccionado), usá el tutor guiado que te enseña paso a paso, y hacé corregir tus respuestas abiertas. Funciona con tu suscripción de Claude a través de [Claude Code](https://code.claude.com).

Es una skill de agente (Claude Code o Codex): el agente sigue `SKILL.md` y usa los scripts. Las partes de abajo también andan solas.

## Requisitos

- macOS (la OCR y el llavero usan herramientas de macOS)
- Node 20+, Python 3, [pandoc](https://pandoc.org) y poppler (`brew install pandoc poppler`)
- [Claude Code](https://code.claude.com) instalado y logueado, para el panel de Claude
- Opcional: Playwright (se instala solo la primera vez) para bajar de Canvas y renderizar PDFs

## Probalo con el ejemplo

```sh
git clone https://github.com/frizynn/apunte-clase
cd apunte-clase
python3 scripts/build_html.py example/apunte    # arma example/Negociacion - Guia de estudio.html
node scripts/estudio.mjs example/apunte          # abre http://localhost:4317 con Claude al costado
```

Sin el servidor, el HTML se abre igual como archivo: tenés la guía, el índice y la práctica, pero no el panel de Claude.

## Usarlo con tu materia

1. Instalá la skill: enlazá esta carpeta en `.claude/skills/apunte-clase` (o `.agents/skills/`) del proyecto donde tenés tus materias.
2. Creá `<Materia>/apunte/course.json` copiando `example/apunte/course.json`: título, idioma, qué toma el examen y una entrada por clase (slides, lecturas, ID de la grabación de Granola, videos).
3. Pedile al agente: `/apunte-clase` y "armá la guía de <materia>" o "sumá la clase nueva". Lanza un agente por clase, revisa con `check.sh`, arma la práctica y regenera el HTML.
4. Estudiá con `node scripts/estudio.mjs "<Materia>/apunte"` (podés pasar varias materias).

## Cómo funciona el panel de Claude

`estudio.mjs` es un servidor local sin dependencias que sirve la guía y le agrega el panel. Cada pregunta se la pasa a `claude -p` con la clase que estás leyendo como contexto.

- Usa la cuenta con la que está logueado Claude Code. Borra `ANTHROPIC_API_KEY` del entorno para no cobrar por API.
- Claude corre sin herramientas, sin MCP y sin tus `CLAUDE.md`: solo lee el texto que le pasa el servidor.
- Escucha solo en `127.0.0.1` y pide un token que va únicamente en la página que sirve, así otra web no puede usar tu cuenta.
- Modelo por defecto `sonnet`; cambialo con `ESTUDIO_MODEL=opus`.

## Estructura

```
SKILL.md                  pasos que sigue el agente
references/               instrucciones para los agentes que escriben clases y práctica
scripts/
  canvas_sync.mjs         baja páginas y archivos de Canvas (credenciales del llavero de macOS)
  prepare_lecture.py      prepara slides, lecturas (con OCR) y quiz de una clase
  check.sh                chequeos de estilo de una clase
  check_practice.py       valida las preguntas de práctica
  build_html.py           arma la guía HTML con índice, práctica y simulacro
  estudio.mjs             servidor local con el panel de Claude
  estudio_panel.js        el panel (preguntar, tutor, corregir)
  assemble.py, render_pdf.mjs, export_docx.py   salida en PDF o docx
  transcribe_groq.sh      transcribe audio de clases en video (Groq Whisper)
example/apunte/           materia de ejemplo
```

El material de cada materia (slides, lecturas, grabaciones) es tuyo o de tu universidad y no va en este repo: `.gitignore` deja afuera `sources/`, `img/` y `reports/`.

El diseño del panel sigue las ideas de [Fluid Functionalism](https://www.fluidfunctionalism.com) (MIT).

## Licencia

MIT
