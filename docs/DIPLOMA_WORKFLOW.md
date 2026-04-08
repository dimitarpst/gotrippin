# Diploma thesis (DOCX) — workflow and MoN alignment

This note is in **English** for convenience. The thesis text itself stays **Bulgarian**.

## What we are doing (reset, in one place)

1. You write and style the final document in **Microsoft Word** using your school’s **custom styles** (Heading 1/2/3, „Дипломна работа“, etc.).
2. This repo holds **Bulgarian draft text** in `docs/diploma-sections/*.txt` — one **line** per paragraph or subheading, **no empty lines** in between (see below).
3. Facts, diagrams, and long technical notes stay in `docs/*.md` and the rest of the codebase; the thesis **narrative** is assembled in Word from the section `.txt` files plus your figures and tables.
4. We are **not** generating a finished `.docx` here; you paste and format yourself.

## Page length (MoN vs school practice)

- **MoN document** states a **minimum of 30 pages** for the diploma project (formal floor).
- **Your teachers** have indicated **40+** as the practical minimum to pass comfortably; treat that as the real lower bound.
- **Our target:** **45 pages or more**, with **substantive** content (analysis, architecture, implementation, testing, diagrams, screenshots)—not padding. Longer is fine if every section earns its space.

## Source documents in `docs/`


| File                             | Role                                                                                                                          |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `Указания от МОН за ДР.pdf`      | Official MoN model: structure, formatting, volume, **grading rubric** (theory defense).                                       |
| `for_access_to_dp.pdf`           | Your **reference style** that earned top marks: continuous prose under headings, **no bullet or numbered lists** in the body. |
| `Дипломен проект- структура.pdf` | School template (headings, styles, figure rules).                                                                             |


## Formal requirements (from MoN PDF, condensed)

- **Volume:** official minimum **30** pages; **aim ≥45** with quality (see above).
- **Page grid:** A4; **30 lines × ~60 characters**; about **1800–2000 characters** per full text page when the style is applied.
- **Body font:** **Times New Roman, 12 pt** (plus your school’s body style).
- **Structure:** title page, table of contents, introduction, main part, conclusion, references, appendices.
- **Reviewer criteria** (theory, Table 1 in the PDF) reward logical structure, depth of goals/tasks, methods, style and figures/tables, conclusions vs goals, originality, defense materials, Q&A, terminology.

## Plain-text format rule (important)

In `docs/diploma-sections/*.txt`:

- **Each line = one paragraph** (or one short heading line with **no leading numbering** like `1.` or `2.2.1.`).
- **Why no `2.2.1.` in the `.txt`:** Microsoft Word often interprets lines starting with `number + period` as **automatic numbered lists**, which breaks indentation and makes numbering “slip” into the body text after paste. Put **`1.`, `2.1.`, `2.2.1.`** back using your school template: **Heading 1/2/3** + **multilevel list** linked to those styles (not by typing numbers at the start of each line). See `docs/diploma-sections/ZAGLAVIA-V-WORD.txt` (Bulgarian) for the heading order mapping.
- **Do not put blank lines** between lines. An empty line in the file becomes an **extra empty line in Word** after paste, which you do not want—you already control spacing with **Word paragraph settings** (line spacing, **Spacing Before/After**).

Example (correct):

```text
Целева аудитория и потребителски нужди
Първи параграф целият на един ред във файла.
Втори параграф отново един ред без празен ред между тях.
```

**Figure captions in sources** use `Фигура 1 — …` (em dash, no dot right after the number) to reduce Word auto-list triggers; apply the school’s caption style in Word for the final look.

## Style rule for thesis prose

Match **`for_access_to_dp.pdf`**: hierarchical headings only; **dense paragraphs**; no markdown bullets or `F1.` style lists in the `.txt` sources. Tables and figures belong in Word.

## Copy–paste workflow (Word)

1. Open the `.txt` in VS Code or Notepad.
2. Word: **Paste Special → Unformatted Text** (Ctrl+Alt+V) so no stray formatting arrives.
3. Select blocks and apply **Heading 1 / 2 / 3** or body style; set **Spacing After** for body paragraphs (e.g. 6 pt) once—**do not** rely on blank lines in the `.txt`.
4. **Markdown → Word** is optional and weak for custom styles; **.txt + Paste Special** is the reliable path.

## Repository layout

- `docs/diploma-sections/*.txt` — Bulgarian text; **one line per paragraph, no empty lines**.
- `docs/*.md` — technical reference for writing accurate sections.

## What is drafted so far

Sections **1 (Увод)**, **2.1**, **2.2**, **2.3** exist as `.txt` in `diploma-sections/`. Still to write in the same convention: **2.4** (technologies), **2.5** (implementation — largest), **2.6** (testing), **3** (conclusion), plus references and appendices in Word.
