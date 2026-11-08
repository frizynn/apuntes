---
name: apuntes
description: Arma y mantiene una guia de estudio por materia (un solo HTML con todas las clases, practica de examen y Claude al costado) a partir de slides, lecturas, libro, grabaciones y notas. Un agente por clase escribe su seccion con conceptos y estudios explicados y capturas de las slides; otro arma multiple choice y preguntas abiertas. Sirve para cualquier materia y universidad. Usar para "armá la guía de <materia>", "sumá la clase nueva", "actualizá la guía de estudio", "armá práctica para el examen", "quiero estudiar <materia> con Claude".
disable-model-invocation: true
---

# Apuntes

`C` es la carpeta `apunte/` de la materia, con su `course.json` (forma en `example/apunte/course.json`). `S` es
`scripts/` de esta skill. Cada clase vive en `C`: `lectures/LNN.md` (texto), `img/LNN/` (capturas), `sources/`
(insumos), `reports/LNN_report.md` y `practice/LNN.json`. `LNN` es la clave de `course.json`, en orden cronologico; una
tutorial o un practico es una entrada con `"kind": "tutorial"`. Sumar una clase es agregar su entrada y correr los pasos
solo para ella.

## Pasos

1. **Materia.** Si no hay `C/course.json`, crealo: `title`, `language` (idioma de la guia), `exam` (formato y que entra,
   del programa de la materia), `output_html`, y una entrada por clase con `title`, `date`, `kind` y sus fuentes:
   `slides` (nombre del PDF), `readers` (lecturas obligatorias de esa clase), `paper` (lectura que no esta en la
   carpeta, para buscarla), `chapters` + `book` (libro en PDF con rangos de paginas), `quiz`, `clips` (videos y podcasts
   obligatorios), `prior` (apunte viejo que sirva de insumo), `granola` o transcripciones. Los PDFs se buscan en toda la
   carpeta de la materia.
   - Si la materia esta en Canvas: `course_id` y `canvas` (URL) en `course.json`, y `node S/canvas_sync.mjs C` baja
     paginas y archivos. Usuario y clave salen del llavero de macOS, servicio = host de `canvas`:
     `security add-generic-password -U -a <usuario> -s <host> -w '<clave>'`. El login esta probado con SSO de Microsoft.
2. **Grabacion.** Cualquier transcripcion sirve: IDs de Granola en `granola` (buscalas por fecha y titulo), o texto en
   `C/sources/transcripts/LNN_*.txt`. Audio o video propio: `S/transcribe_groq.sh <audio> C/sources/transcripts/LNN_video.txt`
   (clave en el llavero, servicio `groq-api-key`). Una clase de 2 horas son unos 60k caracteres y la lee entera un solo
   agente. Solo si pasa de 150k, partila en tramos de 60k con 5k de solapamiento, un agente extrae cada tramo a
   `sources/transcripts/LNN_partK.md` y el escritor lee esos. Sin grabacion se escribe con slides, notas y lecturas.
3. **Notas del alumno.** Si `course.json` tiene `notes_export_glob`: `python3 S/extract_notes.py C NN <export.md> <primera> <ultima>`.
4. **Insumos.** `python3 S/prepare_lecture.py C NN` imprime el manifiesto (slides en texto e imagen, libro, lecturas con
   OCR si son escaneos, quiz). Resolve cada `MISSING` o anotalo como faltante.
5. **Escritura.** Un agente por clase, en paralelo si son varias (cada uno escribe solo sus archivos). Prompt:
   "Leé `<ruta de esta skill>/references/writer-brief.md` y seguilo. C=<ruta absoluta>. Clase NN: <titulo>. Fuentes: <manifiesto>."
   Empezá con una clase de piloto y lanzá el resto despues de revisarla. Sin subagentes, escribila vos con el mismo brief.
6. **Revision.** `S/check.sh C LNN` sale 0 (las lineas "source refs" se revisan a mano). Leé el reporte, un tramo del
   texto y dos imagenes. Las correcciones las hace el mismo agente.
7. **Practica.** Un agente distinto del que escribio (para que no pregunte solo lo que el eligio explicar) arma
   `C/practice/LNN.json`: "Leé `<ruta de esta skill>/references/practice-brief.md` y seguilo. C=<ruta>. Clases: LNN ...".
   Un agente puede llevar 2 o 3 clases. `python3 S/check_practice.py C` sale 0.
8. **Armado.** `python3 S/build_html.py C` regenera la guia entera (siempre el mismo archivo) junto a la carpeta `apunte/`:
   indice que sigue la lectura, practica al final de cada clase y un simulacro mezclado. Mirala en celular y escritorio
   con una captura antes de darla por buena. Para PDF o docx con libro: `output` en `course.json`, `assemble.py`,
   `render_pdf.mjs` y `export_docx.py`.

## Estudiar con Claude al costado

`node S/estudio.mjs "<Materia>/apunte" ...` levanta un servidor local (127.0.0.1:4317, cambia con `PORT`) que sirve cada
guia con un panel de Claude: **Preguntar** (sobre la clase que se esta leyendo o un texto seleccionado), **Tutor** (enseña
un paso, chequea con una pregunta, corrige) y **Corregir con Claude** en cada pregunta abierta. Usa la CLI `claude`
instalada, sin herramientas y sin `ANTHROPIC_API_KEY`, o sea la cuenta con la que este logueada (la suscripcion). Modelo
con `ESTUDIO_MODEL`. Abierta como archivo, sin servidor, la guia anda igual pero sin el panel.

## Respuesta

Por clase: fuentes usadas (grabacion si o no), errores corregidos, que se agrego, cobertura del quiz y de la practica,
dudas sin verificar. Despues veredicto y lo que le toca al alumno (slides o lecturas que faltan, clases sin grabar).
