---
description: Reglas de arquitectura, estructura del proyecto y directrices de modificación para CV Pro IA con soporte de GitNexus.
---

# 🏛️ Guía Maestra de Arquitectura — CV Pro IA

Este proyecto es una plataforma avanzada para la creación, edición, análisis y mejora de currículums profesionales (CV) asistida por Inteligencia Artificial y compilación tipográfica.
Está construido con **HTML5 semántico**, **CSS nativo modular**, **JavaScript modular vanilla** en el frontend, y un servidor **Node.js/Express** en el backend, potenciado con **GitNexus** para inteligencia de código por grafos.

---

## 📂 Estructura del Repositorio

### 📄 Raíz del Proyecto
- `package.json`: Dependencias (`express`, `multer`, `pdf-parse`, `unpdf`, `mammoth`, etc.) y scripts (`start`, `gitnexus`, `gitnexus:analyze`).
- `.env`: Variables de entorno y claves de API de IA (Groq, OpenAI, etc.).
- `AGENTS.md`: Directivas unificadas para agentes de IA y GitNexus Code Intelligence.
- `.gitnexus/`: Base de datos de conocimiento y grafo relacional generado por GitNexus.
- `.claude/skills/` & `.agents/skills/`: Habilidades especializadas para exploración, depuración y análisis de impacto.
- `extract.py`: Utilidad complementaria en Python para extracción y procesamiento de texto/documentos.
- `test-pdf.js`, `test-unpdf.js`, `test-upload.js`: Suites de prueba para validación de extracción de archivos PDF/Word.

---

### 🌐 `public/` (Frontend)
- `index.html`: Punto de entrada principal y estructura base del constructor/editor de CV.
- `chat.html`: Interfaz aislada o complementaria para el asistente conversacional de IA.

#### 🎨 `public/css/` (Estilos Modulares Vainilla)
- `base.css`: Sistema de tokens, variables de color, tipografía y resets globales.
- `layout.css`: Estructura principal, rejillas (CSS Grid) y contenedores flexbox.
- `forms.css`: Formularios de datos personales, experiencia, educación, habilidades e idiomas.
- `preview.css`: Lienzo de previsualización en tiempo real del CV (A4 / carta).
- `inline-editor.css`: Estilos para edición en sitio sobre el lienzo del CV.
- `modals-toasts.css`: Sistema de modales accesibles y notificaciones emergentes (toasts).
- `dark-theme.css`: Esquema de colores para el modo oscuro dinámico.
- `ai-assistant.css`: Panel flotante e interactivo del asistente de IA.

#### ⚙️ `public/js/` (Arquitectura JavaScript Modular)
- `main.js`: Orquestador de la aplicación; inicializa oyentes de eventos y vincula submódulos.
- `app.js`: Configuración base y ciclo de vida de la aplicación.
- `state.js`: Fuente única de la verdad (Single Source of Truth) para el estado del CV y configuración de plantilla.
- `history.js`: Gestor del historial para operaciones de Deshacer / Rehacer (Undo / Redo).
- `formRenderers.js`: Renderizado y sincronización bidireccional de formularios dinámicos.
- `inlineEditor.js`: Mecanismo de edición directa sobre los campos del CV en la vista previa.
- `typst-compiler.js`: Compilador e integrador de plantillas basadas en Typst.
- `previewNavigation.js`: Controles de visualización (zoom, cambio de escala, navegación entre páginas).
- `templateHelpers.js`: Funciones utilitarias para formateo e inyección de datos en plantillas.
- `uiUtils.js`: Utilidades de interfaz gráfica (apertura/cierre de modales, toasts, loaders).
- `validators.js`: Validaciones de formularios, correos y campos requeridos.
- `ai-assistant.js`: Comunicación con el endpoint de IA del backend para optimización y chat.
- `modules/voice.js`: Módulo de reconocimiento y síntesis de voz para interacción por voz.

#### 🗂️ `public/data/` (Recursos y Plantillas)
- `html/` & `typst/`: Plantillas oficiales de CV (ej. Harvard, Modern, Minimalist, etc.).
- `icon.json` / `svg-cache.json`: Diccionario de iconos vectoriales optimizados.
- `gradients/`: Paletas y gradientes decorativos para plantillas.

---

### 🖥️ `src/` (Backend Node.js)
- `src/server.js`:
  - Servidor Express en puerto `3000`.
  - Configuración de subida en memoria vía `multer`.
  - Extracción de texto desde PDF (`pdf-parse`, `unpdf`) y Word `.docx` (`mammoth`).
  - Limpieza de datos semánticos (`cleanCvForPrompt`) para reducir consumo de tokens con LLMs.
  - Orquestación de llamadas hacia Groq / OpenAI con rotación y manejo de errores.

---

## 🧠 Integración con GitNexus (Inteligencia de Código)

El proyecto cuenta con un grafo de conocimiento indexado (más de 350 símbolos y 900 relaciones).

### Comandos de GitNexus disponibles:
- `npm run gitnexus`: Inicia la interfaz web visual en [http://localhost:4747](http://localhost:4747).
- `npm run gitnexus:analyze`: Re-indexa el repositorio tras cambios estructurales.
- `npx gitnexus impact "<Símbolo>"`: Evalúa el radio de impacto antes de modificar una función o clase clave.
- `npx gitnexus context "<Símbolo>"`: Muestra callers, callees y flujos asociados a un símbolo.

---

## 🛠️ Reglas Críticas de Desarrollo

1. **Separación de Responsabilidades**:
   - La lógica visual pertenece a `uiUtils.js` y `formRenderers.js`.
   - El estado reside exclusivamente en `state.js`.
   - La persistencia y el historial en `history.js`.
2. **Seguridad y Procesamiento Backend**:
   - Toda llamada con credenciales secretas (claves de IA) y procesamiento binario de archivos DEBE residir en `src/server.js`. Nunca exponer claves en `public/`.
3. **Estilos Modulares sin Colisiones**:
   - Todo nuevo estilo debe utilizar variables de `base.css`.
   - Evitar estilos en línea (`style="..."`) siempre que sea posible.
4. **Análisis de Impacto Previo**:
   - Antes de refactorizar métodos centrales de `state.js`, `main.js` o `server.js`, consultar el grafo con GitNexus para evitar regresiones.
5. **Mantenimiento Documental**:
   - Si se agregan o mueven módulos, actualizar esta guía en `.agents/rules/architecture.md` y `AGENTS.md`.
