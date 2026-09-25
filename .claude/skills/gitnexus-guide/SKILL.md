---
name: gitnexus-guide
description: "Úsalo cuando el usuario pregunte sobre GitNexus en sí — herramientas disponibles, cómo consultar el grafo de conocimiento, recursos MCP o esquema del grafo. Ejemplos: \"¿Qué herramientas de GitNexus hay?\", \"¿Cómo uso GitNexus?\""
---

# Guía de Referencia de GitNexus

Referencia rápida de todas las herramientas MCP de GitNexus, recursos y esquema del grafo de conocimiento.

---

## Habilidades y Cuándo Usarlas

| Tarea | Habilidad |
| --- | --- |
| Entender la arquitectura / "¿Cómo funciona X?" | `gitnexus-exploring` |
| Radio de impacto / "¿Qué se rompe si cambio X?" | `gitnexus-impact-analysis` |
| Trazar errores / "¿Por qué falla X?" | `gitnexus-debugging` |
| Renombrar / extraer / refactorizar | `gitnexus-refactoring` |
| Comandos de terminal, estado, limpieza, wiki | `gitnexus-cli` |

---

## Catálogo de Herramientas MCP

| Herramienta | Función |
| --- | --- |
| `query` | Búsqueda semántica agrupada por procesos de ejecución. |
| `context` | Vista integral de un símbolo (llamadas entrantes, salientes, flujos). |
| `impact` | Análisis del radio de impacto de un símbolo a profundidades 1, 2 y 3. |
| `trace` | Ruta más corta entre dos símbolos ("¿cómo llega A hasta B?"). |
| `detect_changes`| Impacto según el git diff: qué áreas o flujos se ven afectados por cambios recientes. |
| `rename` | Renombrado coordinado en múltiples archivos con verificación por grafo. |
| `cypher` | Consultas Cypher directas sobre la base de datos de grafos. |
| `check` | Verificaciones estructurales (ej. imports circulares). |
| `list_repos` | Lista repositorios indexados en la máquina. |

---

## Esquema del Grafo

- **Nodos:** `File`, `Folder`, `Function`, `Class`, `Interface`, `Method`, `CodeElement`, `Community`, `Process`, `Route`, `Tool`.
- **Relaciones (Edges):** `CALLS`, `IMPORTS`, `EXTENDS`, `IMPLEMENTS`, `DEFINES`, `CONTAINS`, `MEMBER_OF`, `HAS_METHOD`, `HAS_PROPERTY`, `ACCESSES`, `STEP_IN_PROCESS`, `HANDLES_ROUTE`, `FETCHES`, entre otras.
