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
    const micBtn = document.getElementById('ai-chat-mic-btn');
    const fileInput = document.getElementById('ai-chat-file');

    // Integración de voz mediante VoiceManager
    let voiceManager = null;
    if (typeof VoiceManager !== 'undefined') {
        try {
            voiceManager = new VoiceManager();
            voiceManager.onMicResult = (finalTranscript, interimTranscript) => {
                const text = finalTranscript || interimTranscript;
                if (text) chatInput.value = text;
            };
            voiceManager.onMicEnd = () => {
                if (micBtn) micBtn.classList.remove('recording');
                chatInput.placeholder = 'Escribe tu respuesta aquí...';
            };
            voiceManager.onMicError = () => {
                if (micBtn) micBtn.classList.remove('recording');
                chatInput.placeholder = 'Escribe tu respuesta aquí...';
            };
        } catch (err) {
            console.warn("No se pudo inicializar VoiceManager en el asistente:", err);
        }
    }

    if (micBtn && voiceManager) {
        micBtn.addEventListener('click', () => {
            const isActive = voiceManager.toggleMic();
            if (isActive) {
                micBtn.classList.add('recording');
                chatInput.placeholder = '🎙️ Escuchando tu voz...';
            } else {
                micBtn.classList.remove('recording');
                chatInput.placeholder = 'Escribe tu respuesta aquí...';
            }
        });
    }

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

    // Limpiar historial de chat con modal personalizado
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            const doReset = () => {
                chatHistory = [];
                localStorage.removeItem('aiChatHistory');
                chatMessages.innerHTML = '';
                addMessage(INITIAL_GREETING, 'ai');
                if (typeof window.CvApp !== 'undefined' && typeof window.CvApp.showToast === 'function') {
                    window.CvApp.showToast('Conversación reiniciada con éxito', 'success');
                }
            };

            if (typeof window.CvApp !== 'undefined' && typeof window.CvApp.showModal === 'function') {
                window.CvApp.showModal(
                    '¿Reiniciar conversación?',
                    'Se vaciará el historial de preguntas y respuestas con el asistente para que puedas comenzar de cero.',
                    'danger',
                    (confirmed) => {
                        if (confirmed) doReset();
                    },
                    { confirmText: 'Reiniciar Chat', cancelText: 'Cancelar' }
                );
            } else {
                doReset();
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

        // Manejo y actualización de avatar e iniciales
        if (newCvData.avatar) {
            currentData.avatar = {
                type: newCvData.avatar.type || currentData.avatar?.type || 'initials',
                value: newCvData.avatar.value !== undefined ? newCvData.avatar.value : (currentData.avatar?.value || ''),
                isCustom: !!newCvData.avatar.value
            };
        }

        // Si el avatar es de tipo iniciales o si cambió el nombre personal, sincronizar las iniciales
        if (currentData.avatar && currentData.avatar.type === 'initials') {
            if (newCvData.avatar && newCvData.avatar.value) {
                currentData.avatar.value = String(newCvData.avatar.value).toUpperCase();
            } else if (newCvData.personal && (newCvData.personal.firstName || newCvData.personal.lastName)) {
                const helperInitials = (window.CvApp && window.CvApp.templateHelpers && typeof window.CvApp.templateHelpers.getInitials === 'function')
                    ? window.CvApp.templateHelpers.getInitials(currentData.personalInfo)
                    : `${(currentData.personalInfo.firstName || '')[0] || ''}${(currentData.personalInfo.lastName || '')[0] || ''}`.toUpperCase();
                if (helperInitials) {
                    currentData.avatar.value = helperInitials;
                }
            }
        }

        // Sincronizar inputs de iniciales en el DOM si están presentes
        if (currentData.avatar?.type === 'initials') {
            const initialsInput = document.getElementById('initials-input');
            if (initialsInput) initialsInput.value = currentData.avatar.value || '';
            const panelInitials = document.getElementById('avatar-panel-initials');
            if (panelInitials) panelInitials.value = currentData.avatar.value || '';
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

    // ===================================================================
    // Gestor de Configuración de API Key (BYOK - Multi-Proveedor)
    // ===================================================================
    const apiKeyBtn = document.getElementById('ai-apikey-btn');
    const apiKeyModal = document.getElementById('ai-apikey-modal');
    const apiKeyModalClose = document.getElementById('apikey-modal-close');
    const apiKeyProviderSelect = document.getElementById('apikey-provider-select');
    const apiKeyInput = document.getElementById('apikey-input');
    const apiKeyModelSelect = document.getElementById('apikey-model-select');
    const apiKeyToggleEye = document.getElementById('apikey-toggle-eye');
    const apiKeyHelpDesc = document.getElementById('apikey-help-desc');
    const apiKeyHelpLink = document.getElementById('apikey-help-link');
    const apiKeyStatusBanner = document.getElementById('apikey-status-banner');
    const apiKeyTestBtn = document.getElementById('apikey-test-btn');
    const apiKeySaveBtn = document.getElementById('apikey-save-btn');
    const apiKeyClearBtn = document.getElementById('apikey-clear-btn');
    const apiKeyStatusDot = document.getElementById('ai-key-status-dot');
    const apiKeyCredentialsFields = document.getElementById('apikey-credentials-fields');

    const PROVIDER_CONFIGS = {
        gemini: {
            name: 'Google AI Studio (Gemini)',
            helpText: 'Obtener API Key gratis en Google AI Studio ↗',
            helpUrl: 'https://aistudio.google.com/app/apikey',
            placeholder: 'Ej: AIzaSy...',
            models: [
                { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash (Recomendado - Última generación)' },
                { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash (Rápido y estable)' },
                { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro (Máxima capacidad)' },
                { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro (Razonamiento profundo)' }
            ]
        },
        groq: {
            name: 'Groq Cloud',
            helpText: 'Obtener API Key gratis en Groq Console ↗',
            helpUrl: 'https://console.groq.com/keys',
            placeholder: 'Ej: gsk_...',
            models: [
                { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B Versatile (Recomendado)' },
                { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B Instant (Ultra rápido)' },
                { id: 'qwen/qwen3.8-27b', name: 'Qwen 3.8 27B' },
                { id: 'openai/gpt-oss-120b', name: 'GPT OSS 120B' }
            ]
        },
        openai: {
            name: 'OpenAI',
            helpText: 'Obtener API Key en OpenAI Platform ↗',
            helpUrl: 'https://platform.openai.com/api-keys',
            placeholder: 'Ej: sk-proj-...',
            models: [
                { id: 'gpt-4o-mini', name: 'GPT-4o Mini (Recomendado)' },
                { id: 'gpt-4o', name: 'GPT-4o (Alta precisión)' }
            ]
        },
        deepseek: {
            name: 'DeepSeek',
            helpText: 'Obtener API Key en DeepSeek Platform ↗',
            helpUrl: 'https://platform.deepseek.com/api_keys',
            placeholder: 'Ej: sk-...',
            models: [
                { id: 'deepseek-chat', name: 'DeepSeek Chat (V3)' },
                { id: 'deepseek-reasoner', name: 'DeepSeek Reasoner (R1)' }
            ]
        },
        server: {
            name: 'Servidor por defecto',
            helpText: '',
            helpUrl: '',
            placeholder: '',
            models: []
        }
    };

    function getCustomAiConfig() {
        try {
            const raw = localStorage.getItem('cv_custom_ai_config');
            if (raw) {
                const parsed = JSON.parse(raw);
                if (parsed && parsed.provider && parsed.provider !== 'server' && parsed.apiKey) {
                    return parsed;
                }
            }
        } catch (e) {
            console.error("Error leyendo custom AI config:", e);
        }
        return null;
    }

    function updateApiKeyUI() {
        const config = getCustomAiConfig();
        if (apiKeyStatusDot) {
            if (config && config.apiKey) {
                apiKeyStatusDot.classList.add('active');
                if (apiKeyBtn) apiKeyBtn.title = `🔑 Clave Activa: ${PROVIDER_CONFIGS[config.provider]?.name || config.provider}`;
            } else {
                apiKeyStatusDot.classList.remove('active');
                if (apiKeyBtn) apiKeyBtn.title = '🔑 Configurar tu propia API Key de IA (Google AI Studio, Groq, OpenAI)';
            }
        }
    }

    function renderProviderModels(provider, selectedModel = null) {
        if (!apiKeyModelSelect) return;
        apiKeyModelSelect.innerHTML = '';
        const provData = PROVIDER_CONFIGS[provider] || PROVIDER_CONFIGS.gemini;

        if (provider === 'server' || provData.models.length === 0) {
            const opt = document.createElement('option');
            opt.value = '';
            opt.textContent = 'Modelo gestionado por el servidor';
            apiKeyModelSelect.appendChild(opt);
            return;
        }

        provData.models.forEach(m => {
            const opt = document.createElement('option');
            opt.value = m.id;
            opt.textContent = m.name;
            if (selectedModel && selectedModel === m.id) {
                opt.selected = true;
            }
            apiKeyModelSelect.appendChild(opt);
        });
    }

    function onProviderChanged() {
        const provider = apiKeyProviderSelect.value;
        const provData = PROVIDER_CONFIGS[provider] || PROVIDER_CONFIGS.gemini;

        if (provider === 'server') {
            if (apiKeyCredentialsFields) apiKeyCredentialsFields.style.display = 'none';
        } else {
            if (apiKeyCredentialsFields) apiKeyCredentialsFields.style.display = 'block';
            if (apiKeyInput) apiKeyInput.placeholder = provData.placeholder;
            if (apiKeyHelpLink) {
                apiKeyHelpLink.textContent = provData.helpText;
                apiKeyHelpLink.href = provData.helpUrl;
            }
            renderProviderModels(provider);
        }
        hideStatusBanner();
    }

    function showStatusBanner(msg, type = 'loading') {
        if (!apiKeyStatusBanner) return;
        apiKeyStatusBanner.className = `apikey-status-banner ${type}`;
        apiKeyStatusBanner.innerHTML = msg;
    }

    function hideStatusBanner() {
        if (!apiKeyStatusBanner) return;
        apiKeyStatusBanner.className = 'apikey-status-banner';
        apiKeyStatusBanner.style.display = 'none';
    }

    function openApiKeyModal() {
        hideStatusBanner();
        const saved = getCustomAiConfig();
        if (saved) {
            apiKeyProviderSelect.value = saved.provider || 'gemini';
            if (apiKeyInput) apiKeyInput.value = saved.apiKey || '';
            renderProviderModels(saved.provider, saved.model);
        } else {
            apiKeyProviderSelect.value = 'gemini';
            if (apiKeyInput) apiKeyInput.value = '';
            renderProviderModels('gemini');
        }
        onProviderChanged();
        if (apiKeyModal) apiKeyModal.classList.add('show');
    }

    function closeApiKeyModal() {
        if (apiKeyModal) apiKeyModal.classList.remove('show');
    }

    if (apiKeyBtn) apiKeyBtn.addEventListener('click', openApiKeyModal);
    if (apiKeyModalClose) apiKeyModalClose.addEventListener('click', closeApiKeyModal);
    if (apiKeyModal) {
        apiKeyModal.addEventListener('click', (e) => {
            if (e.target === apiKeyModal) closeApiKeyModal();
        });
    }

    if (apiKeyProviderSelect) {
        apiKeyProviderSelect.addEventListener('change', onProviderChanged);
    }

    if (apiKeyToggleEye && apiKeyInput) {
        apiKeyToggleEye.addEventListener('click', () => {
            if (apiKeyInput.type === 'password') {
                apiKeyInput.type = 'text';
                apiKeyToggleEye.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9.88 9.88 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" y1="2" x2="22" y2="22"/></svg>';
            } else {
                apiKeyInput.type = 'password';
                apiKeyToggleEye.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>';
            }
        });
    }

    // Probar conexión
    if (apiKeyTestBtn) {
        apiKeyTestBtn.addEventListener('click', async () => {
            const provider = apiKeyProviderSelect.value;
            const apiKey = apiKeyInput.value.trim();
            const model = apiKeyModelSelect.value;

            if (provider !== 'server' && !apiKey) {
                showStatusBanner('⚠️ Por favor ingresa una API Key antes de probar.', 'error');
                return;
            }

            if (provider === 'server') {
                showStatusBanner('ℹ️ El modo servidor utiliza el backend por defecto.', 'loading');
                return;
            }

            showStatusBanner('⏳ Probando conexión con ' + (PROVIDER_CONFIGS[provider]?.name || provider) + '...', 'loading');
            apiKeyTestBtn.disabled = true;

            try {
                const res = await fetch('/api/test-key', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ provider, apiKey, model })
                });

                const data = await res.json();
                if (data.ok) {
                    showStatusBanner(`✅ ¡Conexión exitosa! El modelo <strong>${data.model}</strong> respondió correctamente.`, 'success');
                } else {
                    showStatusBanner(`❌ Error al conectar: ${data.error}`, 'error');
                }
            } catch (err) {
                showStatusBanner(`❌ Error de red: ${err.message}`, 'error');
            } finally {
                apiKeyTestBtn.disabled = false;
            }
        });
    }

    // Guardar configuración
    if (apiKeySaveBtn) {
        apiKeySaveBtn.addEventListener('click', () => {
            const provider = apiKeyProviderSelect.value;
            const apiKey = apiKeyInput.value.trim();
            const model = apiKeyModelSelect.value;

            if (provider !== 'server' && !apiKey) {
                showStatusBanner('⚠️ Debes ingresar una API Key válida o seleccionar "Servidor por defecto".', 'error');
                return;
            }

            if (provider === 'server') {
                localStorage.removeItem('cv_custom_ai_config');
                updateApiKeyUI();
                closeApiKeyModal();
                if (window.CvApp && typeof window.CvApp.showToast === 'function') {
                    window.CvApp.showToast('Configuración guardada: usando claves del servidor', 'info');
                }
                return;
            }

            const config = { provider, apiKey, model };
            localStorage.setItem('cv_custom_ai_config', JSON.stringify(config));
            updateApiKeyUI();
            closeApiKeyModal();

            if (window.CvApp && typeof window.CvApp.showToast === 'function') {
                window.CvApp.showToast(`¡Configuración de ${PROVIDER_CONFIGS[provider]?.name || provider} guardada y activa!`, 'success');
            }
        });
    }

    // Limpiar / Quitar Clave
    if (apiKeyClearBtn) {
        apiKeyClearBtn.addEventListener('click', () => {
            localStorage.removeItem('cv_custom_ai_config');
            if (apiKeyInput) apiKeyInput.value = '';
            if (apiKeyProviderSelect) apiKeyProviderSelect.value = 'server';
            onProviderChanged();
            updateApiKeyUI();
            closeApiKeyModal();
            if (window.CvApp && typeof window.CvApp.showToast === 'function') {
                window.CvApp.showToast('Clave eliminada. Ahora se usarán las claves automáticas del servidor.', 'info');
            }
        });
    }

    // Inicializar estado del dot
    updateApiKeyUI();

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
                        currentCv: window.CvApp?.state?.cvData || null,
                        customConfig: getCustomAiConfig()
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
                    currentCv: window.CvApp?.state?.cvData || null,
                    customConfig: getCustomAiConfig()
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
