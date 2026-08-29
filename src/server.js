// Importamos las librerías que instalamos
const express = require('express');
const fetch = require('node-fetch');
const path = require('path');
const fs = require('fs');
require('dotenv').config(); // Carga la clave desde el archivo .env

const app = express();
const port = 3000;


// Middleware para que el servidor entienda JSON y sirva tu index.html
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Esta es la "puerta trasera" segura que llamará nuestro HTML
app.post('/api/chat', async (req, res) => {
    try {
        const { question, context, mode, history = [], currentCv = null } = req.body;
        // El servidor lee TODAS las claves secretas que empiecen con GROQ_API_KEY
        const groqApiKeys = Object.keys(process.env)
            .filter(key => key.startsWith('GROQ_API_KEY'))
            .map(key => process.env[key])
            .filter(key => key); // Filtramos por si alguna está vacía

        if (groqApiKeys.length === 0) {
            return res.status(500).json({ error: 'No hay claves de API configuradas en el servidor.' });
        }
        
        let messages = [];

        if (mode === 'cv-generator') {
            const cvActualContexto = currentCv ? `\n--- ESTADO ACTUAL DEL CV ---\n${JSON.stringify(currentCv)}\n----------------------------\n` : "";
            
            const systemPrompt = `Eres un asistente experto en Recursos Humanos diseñado para ayudar al usuario a crear o modificar su currículum profesional.
Tu objetivo es interactuar de manera amigable. Si el usuario te pide crear su CV desde cero, hazle preguntas conversacionales (1 o 2 a la vez) para obtener su información. 
Si el usuario te pide que modifiques o añadas algo al CV existente, aplica esos cambios sobre el 'ESTADO ACTUAL DEL CV' proporcionado.

IMPORTANTE: Cuando el usuario te pida explícitamente generar el CV, actualizar un dato, o cuando consideres que tienes suficiente información básica, debes responder ÚNICAMENTE con un objeto JSON válido con los datos actualizados, sin ningún texto adicional (sin markdown, sin \`\`\`json). El formato debe ser estrictamente este:
{
  "isJson": true,
  "data": {
    "personal": { "firstName": "", "lastName": "", "title": "", "email": "", "phone": "", "address": "", "summary": "" },
    "experience": [ { "id": "exp-1", "position": "", "company": "", "startDate": "", "endDate": "", "description": "" } ],
    "education": [ { "id": "edu-1", "degree": "", "institution": "", "startDate": "", "endDate": "", "description": "" } ],
    "skills": [ { "id": "skill-1", "name": "", "level": "advanced" } ],
    "impacts": [ { "id": "imp-1", "description": "" } ],
    "portfolio": [ { "id": "port-1", "title": "", "img": "" } ],
    "footer": [ { "id": "foot-1", "type": "text", "label": "", "value": "" } ],
    "design": { "themeColor": "", "textColorDark": "", "textColorMuted": "", "sectionTitleColor": "" }
  }
}
Asegúrate de conservar en el JSON final cualquier dato que ya existiera en el 'ESTADO ACTUAL DEL CV' si el usuario no pidió borrarlo. Sin embargo, si estás extrayendo datos de un documento nuevo proporcionado por el usuario, DEBES enviar arreglos vacíos [] para impacts, portfolio, footer y cualquier otra lista si la información no está presente en el documento, para que se borren los datos de ejemplo.
Si aún estás recolectando información y no es momento de actualizar el documento, responde de manera normal y conversacional en texto plano.${cvActualContexto}`;
            
            messages = [
                { role: "system", content: systemPrompt },
                ...history,
                { role: "user", content: question }
            ];
        } else {
            // Fallback (IA genérica o antiguo modo)
            const systemPrompt = "Eres un asistente experto.";
            messages = [
                { role: "system", content: systemPrompt },
                ...history,
                { role: "user", content: question }
            ];
        }

        // Lista de modelos de contingencia ordenados por preferencia
        const modelosGroq = [
            "openai/gpt-oss-120b",
            "openai/gpt-oss-safeguard-20b",
            "qwen/qwen3.6-27b",
            "openai/gpt-oss-20b"
        ];

        let data = null;
        let ultimoError = null;

        // Bucle anidado: Intentar con cada clave de API, y para cada clave, probar los modelos
        for (const apiKey of groqApiKeys) {
            const keyOculta = apiKey.slice(-4); // Para loggear solo los últimos 4 dígitos por seguridad
            
            for (const modeloActual of modelosGroq) {
                try {
                    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${apiKey}`
                        },
                        body: JSON.stringify({
                            model: modeloActual,
                            messages: messages
                        })
                    });

                    if (!response.ok) {
                        const errorData = await response.json();
                        ultimoError = errorData.error?.message || 'Error desconocido';
                        console.warn(`[API] Falló clave ...${keyOculta} con modelo ${modeloActual}. Pasando al siguiente...`);
                        continue; 
                    }

                    data = await response.json();
                    console.log(`[API] Éxito total usando modelo: ${modeloActual} (Clave ...${keyOculta})`);
                    break; // Éxito con este modelo, rompemos el bucle interno

                } catch (err) {
                    ultimoError = err.message;
                    console.warn(`[API] Fallo de red con modelo ${modeloActual}. Pasando al siguiente...`);
                    continue;
                }
            }
            // Si después de probar los modelos con esta clave 'data' tiene contenido, rompemos el bucle de claves
            if (data) break; 
        }

        // Si se recorrió absolutamente toda la matriz (claves x modelos) y falló todo
        if (!data) {
            throw new Error(`Se agotaron todos los tokens en TODAS las claves y modelos. Último error: ${ultimoError}`);
        }

        // El servidor devuelve solo la respuesta al navegador
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
const multer = require('multer');

const mammoth = require('mammoth');

const upload = multer({ storage: multer.memoryStorage() });

app.post('/api/upload-cv', upload.single('cvFile'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No se ha subido ningún archivo.' });
        }

        let text = '';
        const fileBuffer = req.file.buffer;
        const mimeType = req.file.mimetype;
        const originalName = req.file.originalname.toLowerCase();

        if (mimeType === 'application/pdf' || originalName.endsWith('.pdf')) {
            const { extractText } = await import('unpdf');
            const data = await extractText(new Uint8Array(fileBuffer));
            text = Array.isArray(data.text) ? data.text.join('\n') : data.text;
        } else if (
            mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
            mimeType === 'application/msword' || 
            originalName.endsWith('.docx') || originalName.endsWith('.doc')
        ) {
            // For older .doc files mammoth might not work perfectly, but it covers .docx well
            const result = await mammoth.extractRawText({ buffer: fileBuffer });
            text = result.value;
        } else {
            return res.status(400).json({ error: 'Formato de archivo no soportado. Por favor sube un PDF o Word.' });
        }

        if (!text || text.trim() === '') {
            return res.status(400).json({ error: 'No se pudo extraer texto del archivo.' });
        }

        res.json({ text: text.trim() });
    } catch (error) {
        console.error("Error procesando archivo:", error);
        res.status(500).json({ error: 'Error al procesar el archivo CV.' });
    }
});

// El servidor se pone a escuchar peticiones
app.listen(port, () => {
    console.log(`Servidor de prueba iniciado en http://localhost:${port}`);
});