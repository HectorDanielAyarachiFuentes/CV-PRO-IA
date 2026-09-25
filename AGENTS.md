<!-- gitnexus:start -->
# GitNexus — Code Intelligence

This project is indexed by GitNexus as **CV-PRO-IA** (358 symbols, 924 relationships, 17 execution flows).

> Index stale? Run `node .gitnexus/run.cjs analyze --index-only` from the project root — it auto-selects an available runner. No `.gitnexus/run.cjs` yet? Bootstrap with `npx`, `bunx`, or `pnpm dlx` — e.g. `bunx gitnexus@latest analyze` (npm 11 npx crash; #1939).

## Always Do

- **MUST run impact before editing.** Use `impact({target: "symbolName", direction: "upstream"})` or `node .gitnexus/run.cjs impact "symbolName" --direction upstream --repo .`; report callers, processes, and risk. Never substitute grep for graph analysis.
- **MUST analyze graph changes before committing.** Use `detect_changes({scope: "all"})` (MCP) or `node .gitnexus/run.cjs detect-changes --scope all --repo .` (CLI fallback). `partial: true` or `truncated: true` is not a clean check — a zero means unseen, not unaffected; re-run it. For regression review: `detect_changes({scope: "compare", base_ref: "main"})` or `node .gitnexus/run.cjs detect-changes --scope compare --base-ref "main" --repo .`.
- MUST warn on HIGH/CRITICAL `risk` pre-edit; never use `riskSharedAxes` to waive a HIGH/CRITICAL `risk` warning. Compare File/symbol: MCP File omits axes; Graph-RAG expands File.
- **MUST treat `risk: UNKNOWN` as unresolved, not as low.** An empty caller set is not evidence the symbol is unused — it can also mean the callers are not resolvable by the index (plain-object property access, dynamic dispatch, cross-language calls). `impact` pairs `UNKNOWN` with a `riskNote` saying so. Confirm with a text search before treating the symbol as safe to change or delete; do not proceed on the strength of a zero.
- **MUST use `query({search_query: "concept"})` for concepts/flows, `context({name: "symbolName"})` for a named symbol, or `impact` for blast radius, on read-only callers, dependencies, imports, or execution flow.** Graph first; text search only for empty/`UNKNOWN`/literals.
- For security review, `explain({target: "fileOrSymbol"})` lists taint findings (source→sink flows; needs `analyze --pdg`).

## Never Do

- NEVER edit a function, class, or method before MCP/CLI impact analysis.
- NEVER ignore HIGH or CRITICAL risk warnings from impact analysis, and never read `UNKNOWN` as an all-clear — it means the walk could not answer, which is the one verdict that requires confirming by other means.
- NEVER rename symbols with find-and-replace — use `rename` which understands the call graph.
- NEVER commit before MCP/CLI graph change analysis.

## Resources

| Resource | Use for |
| --- | --- |
| `gitnexus://repo/CV-PRO-IA/context` | Codebase overview, check index freshness |
| `gitnexus://repo/CV-PRO-IA/clusters` | All functional areas |
| `gitnexus://repo/CV-PRO-IA/processes` | All execution flows |
| `gitnexus://repo/CV-PRO-IA/process/{name}` | Step-by-step execution trace |

## CLI

| Task | Read this skill file |
| --- | --- |
| Understand architecture / "How does X work?" | `.claude/skills/gitnexus-exploring/SKILL.md` |
| Blast radius / "What breaks if I change X?" | `.claude/skills/gitnexus-impact-analysis/SKILL.md` |
| Trace bugs / "Why is X failing?" | `.claude/skills/gitnexus-debugging/SKILL.md` |
| Rename / extract / split / refactor | `.claude/skills/gitnexus-refactoring/SKILL.md` |
| Tools, resources, schema reference | `.claude/skills/gitnexus-guide/SKILL.md` |
| Index, status, clean, wiki CLI commands | `.claude/skills/gitnexus-cli/SKILL.md` |

<!-- gitnexus:end -->

---

# 🚀 CV Pro IA — Directrices de Desarrollo y Arquitectura

Este proyecto es un generador/editor de currículums profesionales (CV) asistido por IA, con compilador de plantillas tipográficas y procesamiento de documentos.

## 📌 Principios de Arquitectura
1. **Frontend Modular (`public/`)**:
   - `public/js/state.js`: Estado global único del CV. Cualquier cambio reactivo pasa por este estado.
   - `public/js/history.js`: Pila de Deshacer / Rehacer (Undo / Redo).
   - `public/js/formRenderers.js`: Generación de formularios dinámicos y enlace de inputs con el estado.
   - `public/js/inlineEditor.js`: Edición interactiva directa sobre la vista previa.
   - `public/js/typst-compiler.js`: Compilación y renderizado Typst.
   - `public/js/modules/voice.js`: Integración de comandos y dictado por voz.
   - `public/js/ai-assistant.js`: Asistente conversacional para pulir redacción de CV y sugerencias.
   - `public/css/`: Sistema CSS Vainilla modular (`base.css`, `layout.css`, `preview.css`, etc.) sin dependencias pesadas.

2. **Backend Express (`src/server.js`)**:
   - Puerto `3000`. Sirve la carpeta `public/`.
   - Extracción de texto de CVs en formato PDF (`pdf-parse`, `unpdf`) y Word `.docx` (`mammoth`).
   - Función `cleanCvForPrompt`: Limpia metadatos y bases64 antes de enviar datos al LLM para ahorrar tokens.
   - Comunicación con LLMs externos (Groq / OpenAI) manteniendo las claves seguras en `.env`.

3. **Inteligencia de Código con GitNexus**:
   - `npm run gitnexus`: Inicia la interfaz web visual interactiva en `http://localhost:4747`.
   - `npm run gitnexus:analyze`: Actualiza el grafo de conocimiento del proyecto.
   - Habilidades disponibles en español en `.claude/skills/` y `.agents/skills/`.

## ⚠️ Reglas Obligatorias para Agentes de Código
- **No exponer credenciales ni lógica sensible** en `public/`. Todo secret o token debe residir en `.env` y consumirse en `src/server.js`.
- **Análisis de impacto obligatorio**: Antes de modificar funciones en `state.js`, `main.js` o `server.js`, consultar el grafo con GitNexus (`impact`) para no generar regresiones.
- **Mantener modularidad CSS**: Utilizar siempre variables de diseño definidas en `base.css` en lugar de estilos ad-hoc o clases globales conflictivas.

