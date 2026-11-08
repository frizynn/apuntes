---
name: apunte-clase
description: Arma y actualiza el apunte de estudio de una materia (cualquier carpeta con apunte/course.json; baja de Canvas si la universidad lo usa), una sola guia por materia con todas las clases. Junta slides, lecturas y libro, la grabacion de Granola y las notas, y un agente por clase escribe su seccion con estudios explicados y capturas de las slides. Sale como HTML de estudio o como PDF/docx. Usar para "armá el apunte de la clase 13", "actualizá la guía de estudio", "sumá la clase nueva al HTML".
disable-model-invocation: true
---

# Apunte de clase

Rutas: `C` es la carpeta `apunte/` de la materia, con `course.json` (ejemplo: `example/apunte/` de este repo). `S` es la
carpeta `scripts/` de esta skill.

Estado de cada clase en `C`: `lectures/LNN.md` (texto), `img/LNN/` (capturas), `sources/` (insumos), `reports/LNN_report.md`.
`LNN` es la clave de `course.json`, en orden cronologico; las tutoriales son entradas con `"kind": "tutorial"`.
Agregar una clase es sumar su entrada y correr los pasos sólo para ella; el resto ya esta escrito.

## Pasos

1. **Canvas.** `node S/canvas_sync.mjs C`. Usuario y clave salen del Llavero (servicio `canvas.vu.nl`); si falta:
   `security add-generic-password -U -a <usuario> -s canvas.vu.nl -w '<clave>'`. Si los archivos ya estan bajados en la
   carpeta del curso, alcanza: `prepare_lecture.py` los busca ahi. Completá la entrada de la clase en `course.json`:
   `title`, `date`, `kind`, `slides`, `readers` (lecturas de esa semana segun el Course schedule), `paper` (lectura que no
   esta en la carpeta), `chapters` y `book` si hay libro en PDF, `quiz`, `clips` (videos y podcasts obligatorios), `prior`
   (guia vieja que sirva de insumo), `video_panopto`. Si las slides todavia no estan, avisá y seguí con lo que haya.
2. **Grabacion.** Buscá en Granola (`search_meetings` alrededor de la fecha; los titulos dicen "Lecture", "Tutorial" o la
   materia) y guardá los IDs en `granola`. Una grabacion puede cubrir dos clases. Clase en video sin Granola:
   `node S/canvas_sync.mjs C --audio LNN` y `S/transcribe_groq.sh C/sources/audio/LNN.mp3 C/sources/transcripts/LNN_video.txt`
   (clave en el Llavero, servicio `groq-api-key`); borrá el mp3 al terminar. Sin grabacion: slides, notas y lecturas.
   Una clase de 2 horas son unos 60k caracteres y la lee entera un solo agente. Sólo si pasa de 150k, partila en tramos
   de 60k con 5k de solapamiento, un agente extrae cada tramo a `sources/transcripts/LNN_partK.md` y el escritor lee esos.
3. **Notas del alumno.** Si el curso tiene `notes_export_glob`: tomá el export mas nuevo, ubicá las lineas de la clase y
   corré `python3 S/extract_notes.py C NN <export.md> <primera> <ultima>`.
4. **Insumos.** `python3 S/prepare_lecture.py C NN` imprime el manifiesto (slides en texto e imagen, libro, lecturas con
   OCR si son escaneos, quiz). Resolvé cada `MISSING` o anotalo como faltante.
5. **Escritura.** Un agente por clase, en paralelo si son varias (cada uno escribe sólo sus archivos). Prompt:
   "Leé `<ruta de esta skill>/references/writer-brief.md` y seguilo. C=<ruta absoluta>. Clase NN: <titulo>. Fuentes: <manifiesto>."
   Sin subagentes, escribí vos siguiendo el mismo brief.
6. **Revision.** `S/check.sh C LNN` tiene que salir 0 (las lineas de "source refs" se revisan a mano). Leé el reporte, un
   tramo del texto y dos imagenes. Pedí correcciones al mismo agente si algo falla.
7. **Practica.** Con las clases ya revisadas, un agente distinto del que escribio (para que no se pregunte lo que el
   mismo eligio explicar) arma `C/practice/LNN.json`: "Leé `<ruta de esta skill>/references/practice-brief.md` y seguilo.
   C=<ruta>. Clases: LNN ...". Un agente puede llevar 2 o 3 clases. `python3 S/check_practice.py C` tiene que salir 0.
   La guia HTML muestra la practica al final de cada clase (multiple choice con explicacion al responder y preguntas
   abiertas con respuesta modelo) y un simulacro que mezcla todas las clases.
8. **Armado.**
   - HTML (cursos con `output_html`): `python3 S/build_html.py C` escribe una sola guia en la carpeta del curso, con todas
     las clases y las imagenes embebidas. Siempre el mismo archivo: se regenera entero en cada clase nueva. Mirala en
     celular y escritorio con una captura headless (Playwright) antes de darla por buena.
   - PDF/docx (cursos con `output`): `python3 S/assemble.py C`, despues `node S/render_pdf.mjs C/<output>.md C/<output>.pdf`
     (objetivo 6-8 paginas por clase). Para Google Docs: `python3 S/export_docx.py C C/<nombre>.docx` (pandoc). No
     entregues el .md: algunos visores muestran sus imagenes como texto.

## Estudiar con Claude al costado

`node S/estudio.mjs "<Curso>/apunte" ...` levanta un servidor local
(127.0.0.1:4317) que sirve cada guia con un panel de Claude a la izquierda: **Preguntar** (sobre la clase que estas
leyendo o un texto seleccionado), **Tutor guiado** (enseña un paso, chequea con una pregunta, corrige) y **Corregir con
Claude** en cada pregunta abierta. Usa la CLI `claude` instalada, sin herramientas y sin `ANTHROPIC_API_KEY`, o sea la
cuenta con la que este logueada (la suscripcion). Abierto como archivo, sin servidor, la guia funciona sin el panel.

## Respuesta

Por clase: fuentes usadas (grabacion si o no), errores corregidos, que se agrego, cobertura del quiz, dudas sin verificar.
Despues veredicto y lo que le toca al alumno (slides o lecturas que faltan, clases sin grabar).

## Otra materia

Copiá `example/apunte/course.json` a `<Materia>/apunte/course.json`, completá `course_id` (si usás Canvas), `title`,
`language`, `exam` y una entrada por clase, y seguí los mismos pasos. Para un apunte en PDF con libro, usá `output` y
`book` en vez de `output_html` (ver `assemble.py`).
