---
description: Reglas de arquitectura, estructura del proyecto y directrices de modificación para Cv Pro Ia.
---

# Guía de Arquitectura (Cv Pro Ia)

Este proyecto es un generador/editor de currículums (CV) asistido por Inteligencia Artificial. Está construido con HTML, CSS vainilla, JavaScript modular en el frontend, y un servidor Node.js/Express en el backend.

## 📂 Estructura de Directorios y Archivos

### 📄 Raíz
- `package.json`: Dependencias del backend (Express, dotenv, multer, pdf-parse, mammoth).
- `.env`: Configuración y claves de API de IA (ej. Groq, OpenAI).
- `README.md`: Documentación principal.

### 🌐 `public/` (Frontend)
- `index.html`: Punto de entrada principal. Estructura base de la UI.

#### 🎨 `public/css/` (Estilos Modulares)
- `base.css`: Variables CSS, reseteos.
- `layout.css`: Estructura general (grid, flexbox).
- `forms.css`: Estilos de formularios.
- `inline-editor.css`: Estilos para la edición en vista previa.
- `modals-toasts.css`: Modales y notificaciones.
- `preview.css`: Previsualización del CV.
- `ai-assistant.css`: Estilos de la interfaz de chat con IA.
- `dark-theme.css`: Modo oscuro.

#### ⚙️ `public/js/` (Lógica Modular)
- `main.js`: Orquestador principal e inicialización.
- `state.js`: Estado global (datos del CV).
- `history.js`: Deshacer/Rehacer (Undo/Redo).
- `formRenderers.js`: Renderizado dinámico de formularios.
- `inlineEditor.js`: Edición directa en la vista previa.
- `typst-compiler.js`: Compilación/renderizado Typst.
- `previewNavigation.js`: Control de la vista previa (zoom, páginas).
- `templateHelpers.js`: Helpers para inyectar datos en plantillas.
- `uiUtils.js`: Utilidades UI (modales, toasts).
- `validators.js`: Validación de datos.
- `ai-assistant.js`: Lógica del chatbot y comunicación con la API.

#### 🗂️ `public/data/` (Datos y Plantillas)
- `html/` y `typst/`: Plantillas base para los CVs.
- `icon.json` / `svg-cache.json`: Iconos vectoriales.
- `gradients/`: Gradientes UI/plantillas.

### 🖥️ `src/` (Backend)
- `server.js`: Servidor Express. Maneja la comunicación con la API de LLMs (Groq), rotación de claves, y procesamiento de carga de archivos (PDF/Word para importación de CVs).

## 🛠️ Reglas de Modificación (CRÍTICO)
1. **Separación de Intereses**: Mantén la lógica UI en `uiUtils.js`, el estado en `state.js`, y el renderizado en `formRenderers.js`.
2. **Backend**: Todo procesamiento de archivos (archivos locales, parseo de PDF) o llamadas a APIs secretas DEBE hacerse en `server.js`.
3. **CSS Modulares**: No mezcles estilos ni crees estilos globales fuera de `base.css`. Usa siempre las variables definidas en `base.css`.
4. **Eficiencia**: Mantén el código limpio, optimizado para tokens y no repitas código.
5. **Mantenimiento de esta regla**: Si modificas la estructura principal de carpetas o archivos, DEBES actualizar este archivo de reglas (`public/.agents/rules/architecture.md`) inmediatamente.
