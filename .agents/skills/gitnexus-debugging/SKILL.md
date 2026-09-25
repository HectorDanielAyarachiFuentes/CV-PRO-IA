---
name: gitnexus-debugging
description: "Úsalo cuando el usuario esté depurando un error, rastreando un bug o preguntando por qué falla algo. Ejemplos: \"¿Por qué falla X?\", \"¿De dónde proviene este error?\", \"Rastrea este bug\""
---

# Depuración con GitNexus

## Cuándo usar esta habilidad

- "¿Por qué falla esta función?"
- "Rastrea de dónde proviene este error"
- "¿Quién llama a este método?"
- "Este endpoint devuelve un error 500"
- Para investigar bugs, excepciones o comportamientos inesperados

---

## Flujo de Trabajo

```
0. list_repos {}                                          → Identificar el repositorio
1. query({search_query: "<error o síntoma>"})             → Encontrar flujos de ejecución relacionados
2. context({name: "<función o símbolo bajo sospecha>"})  → Ver quién llama (callers) y a quién llama (callees)
3. LEER gitnexus://repo/{name}/process/{name}             → Seguir el flujo paso a paso
4. cypher({statement: "MATCH path..."})                  → Trazados personalizados si se requieren
```

> Si se indica "Index is stale", ejecuta en terminal: `npm run gitnexus:analyze` o `node .gitnexus/run.cjs analyze`.

---

## Patrones de Depuración

| Síntoma | Enfoque con GitNexus |
| --- | --- |
| **Mensaje de error** | `query` con el texto de error → `context` en los sitios donde se lanza |
| **Valor de retorno erróneo** | `context` en la función → rastrear `callees` para seguir el flujo de datos |
| **Fallo intermitente** | `context` → buscar llamadas externas, dependencias asíncronas o APIs |
| **Problema de rendimiento** | `context` → encontrar símbolos con muchos invocadores (rutas calientes) |
| **Regresión reciente** | `detect_changes` para ver qué afectaron los cambios recientes |
| **"¿Cómo llega A hasta B?"** | `trace` entre ambos símbolos — cadena más corta en una sola llamada |

---

## Herramientas Útiles

- **`query`**: Encuentra código relacionado con el concepto o error.
- **`context`**: Vista de 360 grados de un símbolo (funciones que lo llaman, a las que llama y flujos en que participa).
- **`trace`**: Ruta más corta entre dos funciones o clases (`trace({ from: "A", to: "B" })`).
- **`cypher`**: Consultas directas personalizadas sobre el grafo.
