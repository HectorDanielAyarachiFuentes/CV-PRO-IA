---
name: gitnexus-impact-analysis
description: "Úsalo cuando el usuario quiera saber qué se romperá si cambia algo, o necesite un análisis de seguridad antes de editar código. Ejemplos: \"¿Es seguro cambiar X?\", \"¿Qué depende de esto?\", \"¿Qué se va a romper?\""
---

# Análisis de Impacto con GitNexus

## Cuándo usar esta habilidad

- "¿Es seguro modificar esta función?"
- "¿Qué se romperá si cambio X?"
- "Muéstrame el radio de impacto (blast radius)"
- "¿Quién usa este código o este estado?"
- Antes de realizar modificaciones complejas o refactorizaciones
- Antes de hacer commit para entender qué afectaron los cambios

---

## Flujo de Trabajo

```
0. list_repos {}
1. impact({target: "X", direction: "upstream"}) o `node .gitnexus/run.cjs impact "X" --direction upstream --repo .`
2. LEER gitnexus://repo/{name}/processes                   → Verificar flujos afectados
3. detect_changes({scope: "all"})                         → Control de cambios antes de commit
4. Evaluar el riesgo e informar al usuario
```

> Si el índice está desactualizado ("Index is stale"), ejecuta: `npm run gitnexus:analyze`.

---

## Interpretación de Profundidades de Impacto

| Profundidad | Nivel de Riesgo | Significado |
| --- | --- | --- |
| **d = 1** | **SE ROMPERÁ DIRECTAMENTE** | Invocadores e importadores directos |
| **d = 2** | **PROBABLEMENTE AFECTADO** | Dependencias indirectas |
| **d = 3** | **REQUIERE PRUEBAS** | Efectos transitivos |

---

## Escala de Riesgo

| Elementos afectados | Nivel de Riesgo |
| --- | --- |
| Menos de 5 símbolos, pocos flujos | **BAJO (LOW)** |
| 5 a 15 símbolos, 2 a 5 flujos | **MEDIO (MEDIUM)** |
| Más de 15 símbolos o muchos flujos | **ALTO (HIGH)** |
| Rutas críticas (estado del CV, renderers, servidor) | **CRÍTICO (CRITICAL)** |
| Sin llamadores detectados | **DESCONOCIDO (UNKNOWN)** (Verificar con búsqueda de texto) |

---

## Ejemplo: "¿Qué se rompe si modifico `cleanCvForPrompt` en `src/server.js`?"

```
impact({ target: "cleanCvForPrompt", direction: "upstream" })
→ d=1: Endpoints de optimización y chat de IA en src/server.js
→ Flujos afectados: ProcessUploadCV, AIAssistantGenerate
→ Nivel de riesgo: ALTO (afecta la comunicación con el LLM)
```
