---
name: gitnexus-cli
description: "Úsalo cuando el usuario necesite ejecutar comandos de la CLI de GitNexus como analizar/indexar un repo, ver el estado, limpiar el índice, generar una wiki o listar repositorios indexados. Ejemplos: \"Indexa este repo\", \"Reanaliza el código\", \"Genera una wiki\""
---

# Comandos de CLI de GitNexus

Los comandos descritos abajo utilizan `node .gitnexus/run.cjs <comando>` — el ejecutor local del proyecto que `gitnexus analyze` coloca junto al índice. Este selecciona automáticamente un ejecutor disponible al momento de la llamada (el `gitnexus` global, `pnpm dlx`, `bunx` o `npx`), sin requerir instalaciones globales previas.

> **¿Aún no está analizado o `node .gitnexus/run.cjs` dice `Cannot find module`?** (por ejemplo, en un clon nuevo o tras un `git clean`): Ejecuta `npx gitnexus analyze` desde la raíz del proyecto. En **npm 11.x**, si `npx` falla durante la instalación, instala una vez con `npm i -g gitnexus` (luego `gitnexus analyze`), o usa `pnpm --allow-build=@ladybugdb/core --allow-build=gitnexus --allow-build=tree-sitter dlx gitnexus@latest analyze`.

## Comandos Principales

### analyze — Construir o actualizar el índice del grafo

```bash
node .gitnexus/run.cjs analyze
```

Ejecutar desde la raíz del proyecto. Parsea todos los archivos fuente, construye el grafo de conocimiento, lo almacena en `.gitnexus/` y actualiza los archivos de contexto `CLAUDE.md` / `AGENTS.md`.

| Opción | Efecto |
| --- | --- |
| `--watch` | Mantiene el índice actualizado vigilando cambios en tiempo real |
| `--debounce <ms>` | Tiempo de espera antes de actualizar (por defecto: 300 ms) |
| `--force` | Fuerza una reindexación completa aunque esté al día |
| `--embeddings` | Habilita generación de embeddings para búsqueda semántica |
| `--drop-embeddings` | Descarta embeddings existentes al reconstruir |
| `--pdg` | Construye capas de dependencia de programa (flujo de datos, CDG y REACHING_DEF) |

**Cuándo ejecutarlo:** La primera vez en el proyecto, tras cambios grandes de código, o cuando `gitnexus://repo/{name}/context` reporte que el índice está desactualizado.

---

### status — Comprobar la vigencia del índice

```bash
node .gitnexus/run.cjs status
```

Indica si el repositorio actual tiene un índice de GitNexus, cuándo fue actualizado por última vez, y el conteo de símbolos y relaciones.

---

### clean — Eliminar el índice

```bash
node .gitnexus/run.cjs clean
```

Elimina el directorio `.gitnexus/` y desregistra el repositorio del registro global.

| Opción | Efecto |
| --- | --- |
| `--force` | Omite la confirmación de borrado |
| `--all` | Limpia todos los repositorios indexados, no solo el actual |

---

### wiki — Generar documentación a partir del grafo

```bash
node .gitnexus/run.cjs wiki
```

Genera documentación técnica del repositorio utilizando un LLM a partir del grafo de conocimiento.

| Opción | Efecto |
| --- | --- |
| `--force` | Fuerza regeneración total |
| `--provider <name>` | Proveedor de LLM (openai, openrouter, azure, claude, cursor, etc.) |
| `--lang <lang>` | Idioma de salida (ej. `spanish`, `english`) |

---

### list — Mostrar todos los repositorios indexados

```bash
node .gitnexus/run.cjs list
```

Lista todos los repositorios registrados localmente en GitNexus.

---

### serve — Iniciar la interfaz web visual

```bash
npx gitnexus serve
# O también en este proyecto:
npm run gitnexus
```

Levanta el servidor HTTP local en [http://localhost:4747](http://localhost:4747) para explorar el grafo y mapa mental del código en el navegador.
