# CV Pro IA

### Tu asistente inteligente para crear y mejorar tu currículum profesional.

**Demo en Vivo:** [**https://cv-pro-ia.onrender.com/**](https://cv-pro-ia.onrender.com/) *(Nota: Actualizar URL según el despliegue)*

---

## Descripción del Proyecto

**CV Pro IA** es una aplicación web innovadora que utiliza Inteligencia Artificial generativa para ayudarte a construir el currículum perfecto. Olvídate de los formatos en blanco y la hoja en blanco; nuestro asistente conversacional te guía paso a paso, extrae la información de tu CV actual (si ya tienes uno) y la organiza en diseños profesionales listos para descargar en alta calidad. ¡Todo 100% gratis, sin suscripciones ni inicios de sesión!

## Funcionalidades Principales

- **Diseño Personalizable:** Elige entre plantillas modernas, clásicas o minimalistas y ajusta el color principal a tu gusto.
- **Asistente de IA (Chatbot):** Responde a unas cuantas preguntas y deja que la IA redacte y organice tu experiencia y habilidades por ti.
- **Mejora tu CV Actual (Importación):** Sube tu currículum existente en formato PDF o Word (DOC/DOCX). La IA leerá el texto y lo adaptará automáticamente a nuestras plantillas mejoradas.
- **Descarga en Alta Calidad:** Genera tu currículum final en formato PDF gracias a la compilación en segundo plano de [Typst](https://typst.app/), garantizando una resolución y tipografía perfectas.
- **Edición Rápida:** Cambia los datos en el menú lateral o desde la vista previa de forma instantánea.

## ⚠️ Nota sobre el Despliegue

Esta aplicación está diseñada para ser ligera y puede ser alojada en plataformas como **Render**. Si está alojada en un plan gratuito, ten en cuenta lo siguiente:

- **Arranque en Frío (Cold Start):** Si la aplicación ha estado inactiva, la primera carga puede tardar unos segundos mientras el servidor se "despierta".
- **Límites de Uso:** Al utilizar claves y modelos gratuitos de IA (Groq/OpenAI), pueden existir limitaciones en la cantidad de consultas por minuto.

## Tecnologías Utilizadas

- **Frontend:** HTML5, CSS3, JavaScript (Vanilla), Typst (WebAssembly) para renderizado.
- **Backend:** Node.js, Express.
- **Procesamiento de Archivos:** `multer` (para cargas), `pdf-parse` (para lectura de PDFs), `mammoth` (para lectura de archivos Word).
- **Inteligencia Artificial:** Integración con la API de Groq y modelos de lenguaje avanzado (LLM).
- **Almacenamiento Local:** `localStorage` para guardar el progreso y el historial de chat sin necesidad de bases de datos.

## Instalación y Uso Local

1. Clona el repositorio:
   ```bash
   git clone https://github.com/HectorDanielAyarachiFuentes/CV-PRO-IA.git
   ```
2. Instala las dependencias:
   ```bash
   npm install
   ```
3. Configura tus claves de API:
   Crea un archivo `.env` en la raíz del proyecto y añade tus claves de Groq. El servidor soporta rotación de claves si añades varias:
   ```env
   GROQ_API_KEY_1=tu_clave_aqui
   GROQ_API_KEY_2=tu_otra_clave_aqui
   ```
4. Inicia el servidor:
   ```bash
   npm start
   ```
5. Abre en tu navegador `http://localhost:3000`.
