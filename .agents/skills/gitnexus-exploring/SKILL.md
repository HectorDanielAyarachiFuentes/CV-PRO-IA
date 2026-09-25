---
name: gitnexus-exploring
description: "Úsalo cuando el usuario pregunte cómo funciona el código, quiera entender la arquitectura, seguir flujos de ejecución o explorar partes desconocidas del proyecto. Ejemplos: \"¿Cómo funciona X?\", \"¿Qué llama a esta función?\", \"Muéstrame el flujo del CV\""
---

# Exploración de Código con GitNexus

## Cuándo usar esta habilidad

- "¿Cómo funciona el guardado o renderizado del CV?"
- "¿Cuál es la estructura del proyecto?"
- "Muéstrame los componentes principales"
- "¿Dónde está la lógica de compilación o la llamada a la IA?"
- Comprender código nuevo o no familiarizado rápidamente

---

## Flujo de Trabajo

```
1. list_repos {} o LEER gitnexus://repos                      → Identificar repositorios indexados
2. LEER gitnexus://repo/{name}/context                         → Resumen general del proyecto
3. query({search_query: "<concepto o módulo a entender>"})   → Encontrar flujos relacionados
4. context({name: "<símbolo>"})                                → Vista profunda de un símbolo específico
5. LEER gitnexus://repo/{name}/process/{name}                  → Trazar flujo de ejecución completo
```

---

## Recursos Rápidos

| Recurso | Información que proporciona |
| --- | --- |
| `gitnexus://repo/{name}/context` | Estadísticas y estado de frescura (~150 tokens) |
| `gitnexus://repo/{name}/clusters` | Áreas funcionales con puntuación de cohesión (~300 tokens) |
| `gitnexus://repo/{name}/cluster/{name}` | Miembros de un área con sus rutas de archivo (~500 tokens) |
| `gitnexus://repo/{name}/process/{name}` | Traza de ejecución paso a paso (~200 tokens) |

---

## Ejemplo: "¿Cómo funciona la extracción de texto del CV subido?"

1. `query({search_query: "extract text upload cv"})`
   → Encuentra los procesos relacionados en `src/server.js` (`cleanCvForPrompt`, endpoints de carga `multer`, integración con `pdf-parse`/`mammoth`).
2. `context({name: "cleanCvForPrompt"})`
   → Muestra quién lo llama y qué estructura de datos procesa.
3. Se revisa el archivo de código concreto con contexto exacto sin gastar tokens leyendo todo el árbol.
