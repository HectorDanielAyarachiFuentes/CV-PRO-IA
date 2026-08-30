document.addEventListener('DOMContentLoaded', () => {
    const toggleBtn = document.getElementById('ai-chat-toggle');
    const closeBtn = document.getElementById('ai-chat-close');
    const clearBtn = document.getElementById('ai-chat-clear');
    const expandBtn = document.getElementById('ai-chat-expand');
    const chatWindow = document.getElementById('ai-chat-window');
    const chatMessages = document.getElementById('ai-chat-messages');
    const chatInput = document.getElementById('ai-chat-input');
    const sendBtn = document.getElementById('ai-chat-send');
    const attachBtn = document.getElementById('ai-chat-attach-btn');
    const fileInput = document.getElementById('ai-chat-file');

    const INITIAL_GREETING = '¡Hola! Soy tu asistente de IA. ¿Quieres que te ayude a rellenar tu currículum haciéndote algunas preguntas o subiendo un archivo?';

    // Cargar historial de localStorage
    let chatHistory = [];
    try {
        const savedHistory = localStorage.getItem('aiChatHistory');
        if (savedHistory) {
            chatHistory = JSON.parse(savedHistory);
            if (chatHistory.length > 0) {
                chatMessages.innerHTML = '';
                chatHistory.forEach(msg => {
                    const sender = msg.role === 'user' ? 'user' : 'ai';
                    addMessage(msg.content, sender);
                });
            }
        }
    } catch (e) {
        console.error("Error cargando historial de chat:", e);
    }

    // Toggle ventana del chat
    toggleBtn.addEventListener('click', () => {
        chatWindow.classList.toggle('hidden');
        if (!chatWindow.classList.contains('hidden')) {
            chatInput.focus();
        }
    });

    closeBtn.addEventListener('click', () => {
        chatWindow.classList.add('hidden');
    });

    if (expandBtn) {
        expandBtn.addEventListener('click', () => {
            chatWindow.classList.toggle('expanded');
        });
    }

    // Limpiar historial de chat
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            if (confirm('¿Deseas reiniciar la conversación con el asistente?')) {
                chatHistory = [];
                localStorage.removeItem('aiChatHistory');
                chatMessages.innerHTML = '';
                addMessage(INITIAL_GREETING, 'ai');
            }
        });
    }

    function addMessage(text, sender) {
        const msgDiv = document.createElement('div');
        msgDiv.className = `ai-msg ${sender}`;

        if (sender === 'ai' && typeof marked !== 'undefined') {
            msgDiv.innerHTML = marked.parse(text);
        } else {
            msgDiv.textContent = text;
        }

        chatMessages.appendChild(msgDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        return msgDiv;
    }

    function createTypingIndicator(text = 'Escribiendo...') {
        const typingDiv = document.createElement('div');
        typingDiv.className = 'ai-msg ai typing';
        typingDiv.textContent = text;
        chatMessages.appendChild(typingDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        return typingDiv;
    }

    function applyCvUpdates(newCvData) {
        const currentData = window.CvApp.state.cvData;

        if (newCvData.personal) {
            currentData.personalInfo = { ...currentData.personalInfo, ...newCvData.personal };
        }
        if (newCvData.experience && Array.isArray(newCvData.experience)) {
            currentData.experience = newCvData.experience;
        }
        if (newCvData.education && Array.isArray(newCvData.education)) {
            currentData.education = newCvData.education;
        }
        if (newCvData.skills && Array.isArray(newCvData.skills)) {
            currentData.skills = newCvData.skills;
        }
        if (newCvData.impacts && Array.isArray(newCvData.impacts)) {
            currentData.impacts = newCvData.impacts;
        }
        if (newCvData.portfolio && Array.isArray(newCvData.portfolio)) {
            currentData.portfolio = newCvData.portfolio;
        }
        if (newCvData.footer && Array.isArray(newCvData.footer)) {
            currentData.footer = newCvData.footer;
        }
        if (newCvData.design) {
            if (newCvData.design.themeColor) currentData.themeColor = newCvData.design.themeColor;
            if (newCvData.design.textColorDark) currentData.textColorDark = newCvData.design.textColorDark;
            if (newCvData.design.textColorMuted) currentData.textColorMuted = newCvData.design.textColorMuted;
            if (newCvData.design.sectionTitleColor !== undefined) currentData.sectionTitleColor = newCvData.design.sectionTitleColor;
        }

        window.CvApp.state.cvData = currentData;

        if (typeof window.CvApp.updateAndRender === 'function') {
            window.CvApp.updateAndRender();
        } else if (typeof window.CvApp.renderCVPreview === 'function') {
            window.CvApp.renderCVPreview();
        }

        if (typeof window.CvApp.setActiveSection === 'function') {
            const lastSec = localStorage.getItem('cvProLastSection') || 'welcome';
            window.CvApp.setActiveSection(lastSec);
        }

        if (typeof window.CvApp.saveState === 'function') {
            window.CvApp.saveState();
        }
    }

    function processAiResponse(aiResponse, userVisiblePrompt) {
        let cleanResponse = aiResponse;
        if (cleanResponse.startsWith('```json')) {
            cleanResponse = cleanResponse.replace(/```json/g, '').replace(/```/g, '').trim();
        } else if (cleanResponse.startsWith('```')) {
            cleanResponse = cleanResponse.replace(/```/g, '').trim();
        }

        try {
            const parsed = JSON.parse(cleanResponse);
            if (parsed.isJson && parsed.data) {
                const successMsg = '¡He actualizado tu CV con los datos proporcionados! Puedes revisar la vista previa.';
                addMessage(successMsg, 'ai');

                // Guardamos un historial limpio y corto
                chatHistory.push({ role: 'user', content: userVisiblePrompt });
                chatHistory.push({ role: 'assistant', content: successMsg });
                localStorage.setItem('aiChatHistory', JSON.stringify(chatHistory.slice(-10)));

                applyCvUpdates(parsed.data);
                return;
            }
        } catch (e) {
            // No era JSON, es respuesta de texto normal
        }

        addMessage(aiResponse, 'ai');
        chatHistory.push({ role: 'user', content: userVisiblePrompt });
        chatHistory.push({ role: 'assistant', content: aiResponse });
        localStorage.setItem('aiChatHistory', JSON.stringify(chatHistory.slice(-10)));
    }

    // Subida y procesamiento de documentos (PDF / Word)
    if (attachBtn && fileInput) {
        attachBtn.addEventListener('click', () => {
            fileInput.click();
        });

        fileInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const isImg = file.type.startsWith('image/') || /\.(png|jpe?g|webp|avif)$/i.test(file.name);
            addMessage(`📎 ${isImg ? 'Imagen' : 'Documento'} adjuntado: ${file.name}`, 'user');
            
            const typingIndicator = createTypingIndicator(
                isImg ? 'Analizando imagen con Qwen Vision...' : 'Leyendo y analizando documento...'
            );

            const formData = new FormData();
            formData.append('cvFile', file);

            try {
                const response = await fetch('/api/upload-cv', {
                    method: 'POST',
                    body: formData
                });
                const result = await response.json();

                if (result.error) {
                    if (chatMessages.contains(typingIndicator)) chatMessages.removeChild(typingIndicator);
                    addMessage('Error: ' + result.error, 'ai');
                    return;
                }

                typingIndicator.textContent = 'Integrando datos extraídos al CV con IA...';

                // Enviamos el contenido a la IA sin ensuciar la ventana de chat del usuario
                const aiPrompt = isImg
                    ? `He subido una imagen de mi diploma, certificado o CV (${file.name}). Aquí está la información extraída por Qwen Vision:\n\n${result.text}\n\nIntegra estos datos adecuadamente en mi CV (educación, certificaciones, experiencia o habilidades) manteniendo la estructura JSON.`
                    : `He subido mi currículum (${file.name}). Extrae todos los datos relevantes y genera mi CV manteniendo la estructura JSON correspondiente. Contenido del documento:\n\n${result.text}`;

                const chatRes = await fetch('/api/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        question: aiPrompt,
                        mode: 'cv-generator',
                        history: chatHistory.slice(-4),
                        currentCv: window.CvApp?.state?.cvData || null
                    })
                });

                const data = await chatRes.json();
                if (chatMessages.contains(typingIndicator)) chatMessages.removeChild(typingIndicator);

                if (data.error) {
                    addMessage('Error de la IA: ' + data.error, 'ai');
                    return;
                }

                processAiResponse(
                    data.choices[0].message.content, 
                    `He subido ${isImg ? 'una imagen/certificado' : 'mi CV'} (${file.name}) para extraer los datos.`
                );

            } catch (error) {
                if (chatMessages.contains(typingIndicator)) chatMessages.removeChild(typingIndicator);
                addMessage('Error al procesar el archivo: ' + error.message, 'ai');
            }

            fileInput.value = '';
        });
    }

    // Envío de mensajes de chat
    async function sendMessage() {
        const text = chatInput.value.trim();
        if (!text) return;

        addMessage(text, 'user');
        chatInput.value = '';

        const typingIndicator = createTypingIndicator('Escribiendo...');

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    question: text,
                    mode: 'cv-generator',
                    history: chatHistory.slice(-4),
                    currentCv: window.CvApp?.state?.cvData || null
                })
            });

            const data = await response.json();
            if (chatMessages.contains(typingIndicator)) chatMessages.removeChild(typingIndicator);

            if (data.error) {
                addMessage('Error: ' + data.error, 'ai');
                return;
            }

            const aiResponse = data.choices[0].message.content;
            processAiResponse(aiResponse, text);

        } catch (error) {
            if (chatMessages.contains(typingIndicator)) chatMessages.removeChild(typingIndicator);
            addMessage('Error de conexión con el servidor. Verifica que esté corriendo.', 'ai');
        }
    }

    sendBtn.addEventListener('click', sendMessage);
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
});
