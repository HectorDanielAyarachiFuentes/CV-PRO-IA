// Importamos las librerías necesarias
const express = require('express');
const fetch = require('node-fetch');
const path = require('path');
const multer = require('multer');
const mammoth = require('mammoth');
require('dotenv').config(); // Carga las claves desde el archivo .env

const app = express();
const port = 3000;

// Middleware para entender JSON y servir archivos estáticos
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, '../public')));

/**
 * Filtra el objeto CV para enviar únicamente datos semánticos relevantes a la IA.
 * Elimina imágenes en Base64, cachés SVG, gradientes y metadatos internos que inflan los tokens.
 */
function cleanCvForPrompt(cv) {
    if (!cv || typeof cv !== 'object') return null;
    return {
        personal: cv.personalInfo ? {
            firstName: cv.personalInfo.firstName || '',
            lastName: cv.personalInfo.lastName || '',
            title: cv.personalInfo.title || '',
            email: cv.personalInfo.email || '',
            phone: cv.personalInfo.phone || '',
            address: cv.personalInfo.address || '',
            summary: cv.personalInfo.summary || '',
            website: cv.personalInfo.website || ''
        } : {},
        experience: Array.isArray(cv.experience) ? cv.experience.map(e => ({
            id: e.id,
            position: e.position || '',
            company: e.company || '',
            startDate: e.startDate || '',
            endDate: e.endDate || '',
            description: e.description || ''
        })) : [],
        education: Array.isArray(cv.education) ? cv.education.map(e => ({
            id: e.id,
            degree: e.degree || '',
            institution: e.institution || '',
            startDate: e.startDate || '',
            endDate: e.endDate || '',
            description: e.description || ''
        })) : [],
        skills: Array.isArray(cv.skills) ? cv.skills.map(s => ({
            id: s.id,
            name: s.name || '',
            level: s.level || 'intermediate'
        })) : [],
        impacts: Array.isArray(cv.impacts) ? cv.impacts.map(i => ({
            id: i.id,
            description: i.description || ''
        })) : [],
        portfolio: Array.isArray(cv.portfolio) ? cv.portfolio.map(p => ({
            id: p.id,
            title: p.title || ''
        })) : [],
        footer: Array.isArray(cv.footer) ? cv.footer.map(f => ({
            id: f.id,
            type: f.type || 'text',
            label: f.label || '',
            value: f.value || ''
        })) : [],
        design: {
            themeColor: cv.themeColor || '',
            textColorDark: cv.textColorDark || '',
            textColorMuted: cv.textColorMuted || '',
            sectionTitleColor: cv.sectionTitleColor || ''
        }
    };
}

/**
 * Limpia y normaliza texto extraído para no desperdiciar tokens con espacios o saltos redundantes.
 */
function cleanExtractedText(text, maxChars = 7500) {
    if (!text) return '';
    let cleaned = text
        .replace(/\r\n/g, '\n')
        .replace(/[ \t]+/g, ' ')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
    if (cleaned.length > maxChars) {
        cleaned = cleaned.substring(0, maxChars) + '\n... [Texto truncado por límite de tamaño]';
    }
    return cleaned;
}

// Endpoint de Chat con la IA
app.post('/api/chat', async (req, res) => {
    try {
        const { question = '', mode = 'cv-generator', history = [], currentCv = null } = req.body;

        // Lee todas las claves configuradas que empiecen por GROQ_API_KEY
        const groqApiKeys = Object.keys(process.env)
            .filter(key => key.startsWith('GROQ_API_KEY'))
            .map(key => process.env[key])
            .filter(Boolean);

        if (groqApiKeys.length === 0) {
            return res.status(500).json({ error: 'No hay claves de API (GROQ_API_KEY) configuradas en el archivo .env.' });
        }

        // Saneamiento de historial: últimos 4 intercambios y truncado de mensajes previos gigantes
        const sanitizedHistory = (Array.isArray(history) ? history.slice(-4) : []).map(msg => ({
            role: msg.role === 'ai' ? 'assistant' : msg.role,
            content: typeof msg.content === 'string' && msg.content.length > 1500
                ? msg.content.substring(0, 1500) + '... [resumido]'
                : msg.content
        }));

        // Limpiar pregunta actual para evitar desbordes accidentales
        const sanitizedQuestion = cleanExtractedText(question, 8000);

        let messages = [];

        if (mode === 'cv-generator') {
            const cleanCv = cleanCvForPrompt(currentCv);
            const cvActualContexto = cleanCv ? `\n--- ESTADO ACTUAL DEL CV ---\n${JSON.stringify(cleanCv)}\n----------------------------\n` : "";

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
                ...sanitizedHistory,
                { role: "user", content: sanitizedQuestion }
            ];
        } else {
            messages = [
                { role: "system", content: "Eres un asistente experto y conciso." },
                ...sanitizedHistory,
                { role: "user", content: sanitizedQuestion }
            ];
        }

        // Lista de modelos de contingencia ordenados: Qwen 3.8/3.6, GPT OSS y Llama
        const modelosGroq = [
            "qwen/qwen3.8-27b",
            "qwen/qwen3.6-27b",
            "openai/gpt-oss-120b",
            "openai/gpt-oss-20b",
            "llama-3.3-70b-versatile",
            "llama-3.1-8b-instant"
        ];

        let data = null;
        let ultimoError = null;

        // Bucle anidado: Intentar con cada clave y rotar modelos en caso de error
        for (const apiKey of groqApiKeys) {
            const keyOculta = apiKey.slice(-4);

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
                            messages: messages,
                            temperature: 0.2,
                            max_tokens: 3000
                        })
                    });

                    if (!response.ok) {
                        const errorData = await response.json().catch(() => ({}));
                        ultimoError = errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`;
                        console.warn(`[API Groq] Clave ...${keyOculta} con modelo ${modeloActual} falló (${ultimoError}). Probando siguiente modelo de contingencia...`);
                        continue;
                    }

                    data = await response.json();
                    console.log(`[API Groq] Éxito total usando modelo: ${modeloActual} (Clave ...${keyOculta})`);
                    break;

                } catch (err) {
                    ultimoError = err.message;
                    console.warn(`[API Groq] Error de red con modelo ${modeloActual}: ${err.message}. Probando siguiente...`);
                    continue;
                }
            }
            if (data) break;
        }

        if (!data) {
            throw new Error(`Se agotaron los tokens en todas las claves y modelos. Último error: ${ultimoError}`);
        }

        res.json(data);
    } catch (error) {
        console.error("[Servidor] Error en /api/chat:", error.message);
        res.status(500).json({ error: error.message });
    }
});

// Configuración de Multer para carga de archivos en memoria
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 15 * 1024 * 1024 } // 15MB máx
});

// Endpoint para extraer texto de PDF, Word e Imágenes (usando Qwen Vision)
app.post('/api/upload-cv', upload.single('cvFile'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No se ha subido ningún archivo.' });
        }

        let text = '';
        const fileBuffer = req.file.buffer;
        const mimeType = req.file.mimetype;
        const originalName = req.file.originalname.toLowerCase();

        // 1. Detección de imágenes (Diplomas, certificados, fotos de CV) -> Qwen Vision
        if (mimeType.startsWith('image/') || /\.(jpg|jpeg|png|webp|avif)$/i.test(originalName)) {
            const base64Image = fileBuffer.toString('base64');
            const dataUri = `data:${mimeType || 'image/jpeg'};base64,${base64Image}`;

            const groqApiKeys = Object.keys(process.env)
                .filter(key => key.startsWith('GROQ_API_KEY'))
                .map(key => process.env[key])
                .filter(Boolean);

            const modelosVision = ["qwen/qwen3.8-27b", "qwen/qwen3.6-27b"];
            let visionText = null;

            for (const apiKey of groqApiKeys) {
                for (const vModel of modelosVision) {
                    try {
                        const vResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${apiKey}`
                            },
                            body: JSON.stringify({
                                model: vModel,
                                messages: [
                                    {
                                        role: "user",
                                        content: [
                                            {
                                                type: "text",
                                                text: "Analiza minuciosamente esta imagen (es un currículum, certificado de estudios, diploma o constancia laboral). Extrae de forma limpia, estructurada y completa toda la información relevante legible: datos personales, títulos obtenidos, institución, fechas, tecnologías, habilidades y detalles importantes."
                                            },
                                            {
                                                type: "image_url",
                                                image_url: { url: dataUri }
                                            }
                                        ]
                                    }
                                ],
                                max_tokens: 2500
                            })
                        });

                        if (vResponse.ok) {
                            const vData = await vResponse.json();
                            visionText = vData.choices[0].message.content;
                            console.log(`[Qwen Vision] Imagen procesada exitosamente con modelo: ${vModel}`);
                            break;
                        }
                    } catch (err) {
                        console.warn(`[Qwen Vision] Falló modelo ${vModel}:`, err.message);
                    }
                }
                if (visionText) break;
            }

            if (!visionText) {
                return res.status(500).json({ error: 'No se pudo procesar la imagen con los modelos Qwen Vision de Groq.' });
            }
            text = visionText;

        // 2. Archivos PDF
        } else if (mimeType === 'application/pdf' || originalName.endsWith('.pdf')) {
            const { extractText } = await import('unpdf');
            const data = await extractText(new Uint8Array(fileBuffer));
            text = Array.isArray(data.text) ? data.text.join('\n') : data.text;

        // 3. Archivos Word (.docx / .doc)
        } else if (
            mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
            mimeType === 'application/msword' ||
            originalName.endsWith('.docx') || originalName.endsWith('.doc')
        ) {
            const result = await mammoth.extractRawText({ buffer: fileBuffer });
            text = result.value;
        } else {
            return res.status(400).json({ error: 'Formato no soportado. Por favor sube un PDF, Word (.docx) o Imagen (.jpg, .png).' });
        }

        if (!text || text.trim() === '') {
            return res.status(400).json({ error: 'No se pudo extraer texto legible del archivo.' });
        }

        // Limpiar el texto extraído
        const cleanedText = cleanExtractedText(text);

        res.json({ text: cleanedText, isImage: mimeType.startsWith('image/') || /\.(jpg|jpeg|png|webp|avif)$/i.test(originalName) });
    } catch (error) {
        console.error("Error procesando archivo:", error);
        res.status(500).json({ error: 'Error al procesar el archivo CV.' });
    }
});

// Iniciar servidor
app.listen(port, () => {
    console.log(`Servidor iniciado con éxito en http://localhost:${port}`);
});