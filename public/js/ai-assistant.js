document.addEventListener('DOMContentLoaded', () => {
    const toggleBtn = document.getElementById('ai-chat-toggle');
    const closeBtn = document.getElementById('ai-chat-close');
    const chatWindow = document.getElementById('ai-chat-window');
    const chatMessages = document.getElementById('ai-chat-messages');
    const chatInput = document.getElementById('ai-chat-input');
    const sendBtn = document.getElementById('ai-chat-send');

    const expandBtn = document.getElementById('ai-chat-expand');
    
    // Load from local storage
    let chatHistory = [];
    try {
        const savedHistory = localStorage.getItem('aiChatHistory');
        if (savedHistory) {
            chatHistory = JSON.parse(savedHistory);
            if (chatHistory.length > 0) {
                chatMessages.innerHTML = ''; // Clear default welcome message
                chatHistory.forEach(msg => {
                    const sender = msg.role === 'user' ? 'user' : 'ai';
                    addMessage(msg.content, sender);
                });
            }
        }
    } catch(e) {
        console.error("Error loading chat history", e);
    }

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

    const attachBtn = document.getElementById('ai-chat-attach-btn');
    const fileInput = document.getElementById('ai-chat-file');

    if (attachBtn && fileInput) {
        attachBtn.addEventListener('click', () => {
            fileInput.click();
        });

        fileInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            addMessage(`Subiendo archivo: ${file.name}...`, 'user');
            
            const typingDiv = document.createElement('div');
            typingDiv.className = 'ai-msg ai typing';
            typingDiv.textContent = 'Procesando documento...';
            chatMessages.appendChild(typingDiv);
            chatMessages.scrollTop = chatMessages.scrollHeight;

            const formData = new FormData();
            formData.append('cvFile', file);

            try {
                const response = await fetch('/api/upload-cv', {
                    method: 'POST',
                    body: formData
                });
                const result = await response.json();
                
                chatMessages.removeChild(typingDiv);

                if (result.error) {
                    addMessage('Error: ' + result.error, 'ai');
                    return;
                }

                addMessage('¡Documento procesado! Ahora extraeré la información para tu CV...', 'ai');

                // Send hidden prompt to AI with the extracted text
                chatInput.value = `He subido un archivo con mi CV. Extrae la información y genera mi CV manteniendo todos los datos en los campos correspondientes. Aquí está el contenido:\n\n${result.text}`;
                await sendMessage();
                
            } catch (error) {
                chatMessages.removeChild(typingDiv);
                addMessage('Error al procesar el archivo: ' + error.message, 'ai');
            }
            
            fileInput.value = ''; // Reset input
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
    }

    async function sendMessage() {
        const text = chatInput.value.trim();
        if (!text) return;

        addMessage(text, 'user');
        chatInput.value = '';

        // Typing indicator
        const typingDiv = document.createElement('div');
        typingDiv.className = 'ai-msg ai typing';
        typingDiv.textContent = 'Escribiendo...';
        chatMessages.appendChild(typingDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    question: text,
                    mode: 'cv-generator',
                    history: chatHistory,
                    currentCv: window.CvApp.state.cvData
                })
            });

            const data = await response.json();
            chatMessages.removeChild(typingDiv);

            if (data.error) {
                addMessage('Error: ' + data.error, 'ai');
                return;
            }

            const aiResponse = data.choices[0].message.content;

            // Check if response is JSON (has isJson: true)
            try {
                // Remove Markdown code block if present
                let cleanResponse = aiResponse;
                if (cleanResponse.startsWith('```json')) {
                    cleanResponse = cleanResponse.replace(/```json/g, '').replace(/```/g, '').trim();
                } else if (cleanResponse.startsWith('```')) {
                    cleanResponse = cleanResponse.replace(/```/g, '').trim();
                }

                const parsed = JSON.parse(cleanResponse);
                if (parsed.isJson && parsed.data) {
                    const successMsg = '¡He generado tu CV con los datos proporcionados! Revisa la vista previa.';
                    addMessage(successMsg, 'ai');
                    chatHistory.push({ role: 'user', content: text });
                    chatHistory.push({ role: 'assistant', content: successMsg });
                    localStorage.setItem('aiChatHistory', JSON.stringify(chatHistory));
                    
                    // Update CV state
                    const newCvData = parsed.data;
                    const currentData = window.CvApp.state.cvData;
                    
                    if(newCvData.personal) {
                        currentData.personalInfo = { ...currentData.personalInfo, ...newCvData.personal };
                    }
                    if(newCvData.experience && Array.isArray(newCvData.experience)) {
                        currentData.experience = newCvData.experience;
                    }
                    if(newCvData.education && Array.isArray(newCvData.education)) {
                        currentData.education = newCvData.education;
                    }
                    if(newCvData.skills && Array.isArray(newCvData.skills)) {
                        currentData.skills = newCvData.skills;
                    }
                    if(newCvData.design) {
                        if (newCvData.design.themeColor) currentData.themeColor = newCvData.design.themeColor;
                        if (newCvData.design.textColorDark) currentData.textColorDark = newCvData.design.textColorDark;
                        if (newCvData.design.textColorMuted) currentData.textColorMuted = newCvData.design.textColorMuted;
                        if (newCvData.design.sectionTitleColor !== undefined) currentData.sectionTitleColor = newCvData.design.sectionTitleColor;
                    }
                    
                    // Assign new state
                    window.CvApp.state.cvData = currentData;
                    
                    // Force UI update
                    if (typeof window.CvApp.updateAndRender === 'function') {
                        window.CvApp.updateAndRender();
                        if (typeof window.CvApp.setActiveSection === 'function') {
                            const lastSec = localStorage.getItem('cvProLastSection') || 'welcome';
                            window.CvApp.setActiveSection(lastSec);
                        }
                    } else {
                        if (typeof window.CvApp.renderCVPreview === 'function') {
                            window.CvApp.renderCVPreview();
                        }
                        if (typeof window.CvApp.setActiveSection === 'function') {
                            const lastSec = localStorage.getItem('cvProLastSection') || 'welcome';
                            window.CvApp.setActiveSection(lastSec);
                        }
                    }
                    if (typeof window.CvApp.saveState === 'function') {
                        window.CvApp.saveState();
                    }
                } else {
                    throw new Error("No isJson property");
                }
            } catch(e) {
                // Not JSON, normal text conversation
                addMessage(aiResponse, 'ai');
                chatHistory.push({ role: 'user', content: text });
                chatHistory.push({ role: 'assistant', content: aiResponse });
                localStorage.setItem('aiChatHistory', JSON.stringify(chatHistory));
            }

        } catch (error) {
            if (chatMessages.contains(typingDiv)) {
                chatMessages.removeChild(typingDiv);
            }
            addMessage('Error de conexión o timeout.', 'ai');
        }
    }

    sendBtn.addEventListener('click', sendMessage);
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
});
