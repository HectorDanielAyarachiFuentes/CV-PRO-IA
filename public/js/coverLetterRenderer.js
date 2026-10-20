// public/js/coverLetterRenderer.js
// Renderizador modular de plantillas para la Carta de Presentación (Cover Letter)
(function () {
    'use strict';
    window.CvApp = window.CvApp || {};

    /**
     * Devuelve una fecha formateada en español si no se especificó una fecha personalizada.
     */
    function getFormattedDate(customDate) {
        if (customDate && customDate.trim() !== '') return customDate.trim();
        const now = new Date();
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        try {
            return now.toLocaleDateString('es-ES', options);
        } catch (e) {
            return now.toISOString().split('T')[0];
        }
    }

    /**
     * Obtiene el nombre completo del remitente a partir de personalInfo.
     */
    function getSenderName(personalInfo) {
        if (!personalInfo) return 'Candidato Profesional';
        const fn = personalInfo.firstName || '';
        const ln = personalInfo.lastName || '';
        return (fn + ' ' + ln).trim() || 'Candidato Profesional';
    }

    /**
     * Plantillas visuales para la Carta de Presentación.
     */
    const templates = {
        /**
         * 1. Plantilla MODERNA: Acento superior, tipografía sans-serif limpia, membrete visual claro.
         */
        modern: function (cvData) {
            const p = cvData.personalInfo || {};
            const letter = cvData.coverLetter || {};
            const themeColor = cvData.themeColor || '#0d6efd';
            const textColorDark = cvData.textColorDark || '#1e293b';
            const textColorMuted = cvData.textColorMuted || '#64748b';
            const senderName = getSenderName(p);
            const dateStr = getFormattedDate(letter.date);
            const paragraphs = Array.isArray(letter.paragraphs) && letter.paragraphs.length > 0
                ? letter.paragraphs
                : ['Le escribo con gran entusiasmo para presentar mi candidatura...'];

            return `
            <div id="cover-letter-template" class="cover-letter-paper template-modern" style="background:#ffffff; color:${textColorDark}; font-family:var(--font-body, 'Inter', sans-serif); min-height:100%; display:flex; flex-direction:column; padding:3rem 3.5rem; box-sizing:border-box;">
                <!-- Barra de acento superior -->
                <div style="height:6px; background:${themeColor}; margin:-3rem -3.5rem 2.5rem -3.5rem;"></div>

                <!-- Encabezado / Membrete -->
                <header style="display:flex; justify-content:space-between; align-items:flex-start; border-bottom:1px solid #e2e8f0; padding-bottom:1.75rem; margin-bottom:2rem;">
                    <div>
                        <h1 style="margin:0; font-size:2rem; font-weight:700; color:${themeColor}; letter-spacing:-0.02em; line-height:1.1;">
                            ${senderName}
                        </h1>
                        <p style="margin:0.35rem 0 0 0; font-size:1.05rem; font-weight:500; color:${textColorMuted};">
                            ${p.title || 'Profesional'}
                        </p>
                    </div>
                    <div style="text-align:right; font-size:0.85rem; color:${textColorMuted}; line-height:1.5;">
                        ${p.email ? `<div><span style="color:${textColorDark};">✉</span> ${p.email}</div>` : ''}
                        ${p.phone ? `<div><span style="color:${textColorDark};">☎</span> ${p.phone}</div>` : ''}
                        ${p.address ? `<div><span style="color:${textColorDark};">📍</span> ${p.address}</div>` : ''}
                        ${p.website ? `<div><span style="color:${textColorDark};">🔗</span> ${p.website}</div>` : ''}
                    </div>
                </header>

                <!-- Fecha y Destinatario -->
                <section style="display:flex; justify-content:space-between; margin-bottom:2rem; font-size:0.9rem;">
                    <div>
                        <div style="font-size:0.8rem; font-weight:600; text-transform:uppercase; letter-spacing:0.05em; color:${themeColor}; margin-bottom:0.25rem;">Para:</div>
                        <div data-cover-field="recipientName" contenteditable="true" style="font-weight:600; font-size:0.95rem; color:${textColorDark};">${letter.recipientName || 'Equipo de Selección'}</div>
                        <div data-cover-field="recipientTitle" contenteditable="true" style="color:${textColorMuted}; font-size:0.85rem;">${letter.recipientTitle || 'Gerente de Recursos Humanos'}</div>
                        <div data-cover-field="companyName" contenteditable="true" style="font-weight:500; color:${textColorDark};">${letter.companyName || 'Empresa Destino'}</div>
                        <div data-cover-field="companyAddress" contenteditable="true" style="color:${textColorMuted}; font-size:0.85rem;">${letter.companyAddress || 'Ciudad, País'}</div>
                    </div>
                    <div style="text-align:right;">
                        <div style="font-size:0.8rem; font-weight:600; text-transform:uppercase; letter-spacing:0.05em; color:${themeColor}; margin-bottom:0.25rem;">Fecha:</div>
                        <div data-cover-field="date" contenteditable="true" style="color:${textColorDark}; font-weight:500;">${dateStr}</div>
                    </div>
                </section>

                <!-- Saludo -->
                <div data-cover-field="salutation" contenteditable="true" style="font-size:1rem; font-weight:600; margin-bottom:1.25rem; color:${textColorDark};">
                    ${letter.salutation || 'Estimado/a Equipo de Selección,'}
                </div>

                <!-- Cuerpo de la Carta -->
                <main style="flex:1; display:flex; flex-direction:column; gap:1.25rem; font-size:0.95rem; line-height:1.75; color:${textColorDark}; text-align:justify;">
                    ${paragraphs.map((pText, idx) => `
                        <p data-cover-field="paragraph-${idx}" contenteditable="true" style="margin:0; min-height:1.5rem;">${pText}</p>
                    `).join('')}
                </main>

                <!-- Despedida y Firma -->
                <footer style="margin-top:2.5rem; padding-top:1.5rem; border-top:1px solid #f1f5f9;">
                    <div data-cover-field="signoff" contenteditable="true" style="font-size:0.95rem; color:${textColorMuted}; margin-bottom:1.5rem;">
                        ${letter.signoff || 'Atentamente,'}
                    </div>
                    <div data-cover-field="signature" contenteditable="true" style="font-size:1.15rem; font-weight:700; color:${textColorDark};">
                        ${letter.signature || senderName}
                    </div>
                    <div style="font-size:0.85rem; color:${textColorMuted}; margin-top:0.15rem;">
                        ${p.title || ''}
                    </div>
                </footer>
            </div>`;
        },

        /**
         * 2. Plantilla EJECUTIVA: Centrada, tipografía serif editorial (Lora), estilo formal Harvard.
         */
        executive: function (cvData) {
            const p = cvData.personalInfo || {};
            const letter = cvData.coverLetter || {};
            const themeColor = cvData.themeColor || '#1e293b';
            const textColorDark = cvData.textColorDark || '#1e293b';
            const textColorMuted = cvData.textColorMuted || '#475569';
            const senderName = getSenderName(p);
            const dateStr = getFormattedDate(letter.date);
            const paragraphs = Array.isArray(letter.paragraphs) && letter.paragraphs.length > 0
                ? letter.paragraphs
                : ['Le escribo con gran entusiasmo para presentar mi candidatura...'];

            const contactItems = [p.email, p.phone, p.address, p.website].filter(Boolean);

            return `
            <div id="cover-letter-template" class="cover-letter-paper template-executive" style="background:#ffffff; color:${textColorDark}; font-family:var(--font-serif, 'Lora', Georgia, serif); min-height:100%; display:flex; flex-direction:column; padding:3.5rem 4rem; box-sizing:border-box;">
                <!-- Membrete Ejecutivo Centrado -->
                <header style="text-align:center; border-bottom:2px solid ${themeColor}; padding-bottom:1.5rem; margin-bottom:2.25rem;">
                    <h1 style="margin:0; font-size:2.4rem; font-weight:600; letter-spacing:0.02em; color:${textColorDark}; line-height:1.1;">
                        ${senderName}
                    </h1>
                    <p style="margin:0.4rem 0 0.75rem 0; font-size:1.1rem; font-style:italic; color:${textColorMuted};">
                        ${p.title || 'Profesional'}
                    </p>
                    <div style="font-size:0.88rem; color:${textColorMuted}; display:flex; justify-content:center; flex-wrap:wrap; gap:0.75rem;">
                        ${contactItems.map(item => `<span>${item}</span>`).join(' <span style="color:' + themeColor + '">•</span> ')}
                    </div>
                </header>

                <!-- Fecha y Destinatario -->
                <section style="margin-bottom:2rem; font-size:0.95rem; line-height:1.6;">
                    <div style="text-align:right; margin-bottom:1.5rem; color:${textColorMuted};">
                        <span data-cover-field="date" contenteditable="true">${dateStr}</span>
                    </div>
                    <div>
                        <div data-cover-field="recipientName" contenteditable="true" style="font-weight:600; color:${textColorDark};">${letter.recipientName || 'Equipo de Selección'}</div>
                        <div data-cover-field="recipientTitle" contenteditable="true" style="color:${textColorMuted}; font-style:italic;">${letter.recipientTitle || 'Gerente de Recursos Humanos'}</div>
                        <div data-cover-field="companyName" contenteditable="true" style="font-weight:600;">${letter.companyName || 'Empresa Destino'}</div>
                        <div data-cover-field="companyAddress" contenteditable="true" style="color:${textColorMuted};">${letter.companyAddress || 'Ciudad, País'}</div>
                    </div>
                </section>

                <!-- Saludo -->
                <div data-cover-field="salutation" contenteditable="true" style="font-size:1rem; font-weight:600; margin-bottom:1.5rem; color:${textColorDark};">
                    ${letter.salutation || 'Estimado/a Equipo de Selección,'}
                </div>

                <!-- Cuerpo -->
                <main style="flex:1; display:flex; flex-direction:column; gap:1.35rem; font-size:0.98rem; line-height:1.85; color:${textColorDark}; text-align:justify;">
                    ${paragraphs.map((pText, idx) => `
                        <p data-cover-field="paragraph-${idx}" contenteditable="true" style="margin:0; text-indent:1.5rem; min-height:1.5rem;">${pText}</p>
                    `).join('')}
                </main>

                <!-- Despedida y Firma -->
                <footer style="margin-top:3rem;">
                    <div data-cover-field="signoff" contenteditable="true" style="font-size:1rem; color:${textColorDark}; margin-bottom:2.5rem;">
                        ${letter.signoff || 'Atentamente,'}
                    </div>
                    <div data-cover-field="signature" contenteditable="true" style="font-size:1.2rem; font-weight:600; color:${textColorDark}; border-top:1px solid #cbd5e1; display:inline-block; padding-top:0.5rem; min-width:200px;">
                        ${letter.signature || senderName}
                    </div>
                </footer>
            </div>`;
        },

        /**
         * 3. Plantilla LATERAL (Sidebar): Dos columnas a juego con plantillas Classic / Corporate.
         */
        sidebar: function (cvData) {
            const p = cvData.personalInfo || {};
            const letter = cvData.coverLetter || {};
            const themeColor = cvData.themeColor || '#0d6efd';
            const textColorDark = cvData.textColorDark || '#1e293b';
            const textColorLight = cvData.textColorLight || '#ffffff';
            const textColorMuted = cvData.textColorMuted || '#64748b';
            const senderName = getSenderName(p);
            const dateStr = getFormattedDate(letter.date);
            const paragraphs = Array.isArray(letter.paragraphs) && letter.paragraphs.length > 0
                ? letter.paragraphs
                : ['Le escribo con gran entusiasmo para presentar mi candidatura...'];

            return `
            <div id="cover-letter-template" class="cover-letter-paper template-sidebar" style="background:#ffffff; color:${textColorDark}; font-family:var(--font-body, 'Inter', sans-serif); min-height:100%; display:grid; grid-template-columns:32% 68%; box-sizing:border-box;">
                <!-- Columna Lateral -->
                <aside style="background:${themeColor}; color:${textColorLight}; padding:3rem 2rem; display:flex; flex-direction:column; gap:2rem;">
                    <div>
                        <div style="width:65px; height:65px; border-radius:50%; background:rgba(255,255,255,0.2); border:2px solid ${textColorLight}; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:1.5rem; margin-bottom:1.25rem;">
                            ${(p.firstName?.[0] || 'C') + (p.lastName?.[0] || 'P')}
                        </div>
                        <h2 style="margin:0; font-size:1.35rem; font-weight:700; line-height:1.2; color:${textColorLight};">${senderName}</h2>
                        <p style="margin:0.35rem 0 0 0; font-size:0.85rem; opacity:0.9;">${p.title || 'Profesional'}</p>
                    </div>

                    <div style="font-size:0.8rem; line-height:1.6;">
                        <h4 style="margin:0 0 0.6rem 0; font-size:0.8rem; text-transform:uppercase; letter-spacing:0.08em; border-bottom:1px solid rgba(255,255,255,0.3); padding-bottom:0.35rem;">Contacto</h4>
                        ${p.email ? `<p style="margin:0 0 0.5rem 0; word-break:break-all;"><strong>Email:</strong><br>${p.email}</p>` : ''}
                        ${p.phone ? `<p style="margin:0 0 0.5rem 0;"><strong>Teléfono:</strong><br>${p.phone}</p>` : ''}
                        ${p.address ? `<p style="margin:0 0 0.5rem 0;"><strong>Ubicación:</strong><br>${p.address}</p>` : ''}
                        ${p.website ? `<p style="margin:0; word-break:break-all;"><strong>Web:</strong><br>${p.website}</p>` : ''}
                    </div>

                    <div style="font-size:0.8rem; line-height:1.6; margin-top:auto;">
                        <h4 style="margin:0 0 0.6rem 0; font-size:0.8rem; text-transform:uppercase; letter-spacing:0.08em; border-bottom:1px solid rgba(255,255,255,0.3); padding-bottom:0.35rem;">Destinatario</h4>
                        <p style="margin:0 0 0.25rem 0; font-weight:600;">${letter.companyName || 'Empresa Destino'}</p>
                        <p style="margin:0 0 0.25rem 0;">${letter.recipientName || 'Equipo de Selección'}</p>
                        <p style="margin:0;">${letter.companyAddress || 'Ciudad, País'}</p>
                    </div>
                </aside>

                <!-- Columna Principal -->
                <main style="padding:3.5rem 3rem; display:flex; flex-direction:column; justify-content:space-between;">
                    <div>
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:2rem; border-bottom:1px solid #f1f5f9; padding-bottom:1rem;">
                            <span style="font-size:0.85rem; font-weight:600; color:${themeColor}; text-transform:uppercase; letter-spacing:0.05em;">Carta de Presentación</span>
                            <span data-cover-field="date" contenteditable="true" style="font-size:0.88rem; color:${textColorMuted};">${dateStr}</span>
                        </div>

                        <div data-cover-field="salutation" contenteditable="true" style="font-size:1.05rem; font-weight:600; margin-bottom:1.5rem; color:${textColorDark};">
                            ${letter.salutation || 'Estimado/a Equipo de Selección,'}
                        </div>

                        <div style="display:flex; flex-direction:column; gap:1.25rem; font-size:0.94rem; line-height:1.75; color:${textColorDark}; text-align:justify;">
                            ${paragraphs.map((pText, idx) => `
                                <p data-cover-field="paragraph-${idx}" contenteditable="true" style="margin:0; min-height:1.5rem;">${pText}</p>
                            `).join('')}
                        </div>
                    </div>

                    <footer style="margin-top:2.5rem; padding-top:1.5rem; border-top:1px solid #f1f5f9;">
                        <div data-cover-field="signoff" contenteditable="true" style="font-size:0.95rem; color:${textColorMuted}; margin-bottom:1.25rem;">
                            ${letter.signoff || 'Atentamente,'}
                        </div>
                        <div data-cover-field="signature" contenteditable="true" style="font-size:1.15rem; font-weight:700; color:${textColorDark};">
                            ${letter.signature || senderName}
                        </div>
                    </footer>
                </main>
            </div>`;
        },

        /**
         * 4. Plantilla MINIMALISTA: Diseño suizo, márgenes cómodos, sin fondos invasivos, elegancia pura.
         */
        minimalist: function (cvData) {
            const p = cvData.personalInfo || {};
            const letter = cvData.coverLetter || {};
            const themeColor = cvData.themeColor || '#000000';
            const textColorDark = cvData.textColorDark || '#0f172a';
            const textColorMuted = cvData.textColorMuted || '#64748b';
            const senderName = getSenderName(p);
            const dateStr = getFormattedDate(letter.date);
            const paragraphs = Array.isArray(letter.paragraphs) && letter.paragraphs.length > 0
                ? letter.paragraphs
                : ['Le escribo con gran entusiasmo para presentar mi candidatura...'];

            return `
            <div id="cover-letter-template" class="cover-letter-paper template-minimalist" style="background:#ffffff; color:${textColorDark}; font-family:var(--font-body, 'Inter', sans-serif); min-height:100%; display:flex; flex-direction:column; padding:4rem; box-sizing:border-box;">
                <!-- Membrete Minimalista -->
                <header style="margin-bottom:3rem;">
                    <h1 style="margin:0; font-size:2.5rem; font-weight:300; letter-spacing:-0.03em; color:${textColorDark}; line-height:1;">
                        ${senderName}
                    </h1>
                    <p style="margin:0.4rem 0 1rem 0; font-size:1rem; font-weight:400; color:${themeColor};">
                        ${p.title || 'Profesional'}
                    </p>
                    <div style="font-size:0.82rem; color:${textColorMuted}; display:flex; gap:1.25rem; flex-wrap:wrap;">
                        ${p.email ? `<span>${p.email}</span>` : ''}
                        ${p.phone ? `<span>${p.phone}</span>` : ''}
                        ${p.address ? `<span>${p.address}</span>` : ''}
                        ${p.website ? `<span>${p.website}</span>` : ''}
                    </div>
                </header>

                <!-- Datos de Destino y Fecha -->
                <section style="display:flex; justify-content:space-between; margin-bottom:2.5rem; font-size:0.88rem; line-height:1.6; border-top:1px solid #e2e8f0; padding-top:1.5rem;">
                    <div>
                        <div data-cover-field="recipientName" contenteditable="true" style="font-weight:600; color:${textColorDark};">${letter.recipientName || 'Equipo de Selección'}</div>
                        <div data-cover-field="recipientTitle" contenteditable="true" style="color:${textColorMuted};">${letter.recipientTitle || 'Gerente de Recursos Humanos'}</div>
                        <div data-cover-field="companyName" contenteditable="true" style="font-weight:500;">${letter.companyName || 'Empresa Destino'}</div>
                        <div data-cover-field="companyAddress" contenteditable="true" style="color:${textColorMuted};">${letter.companyAddress || 'Ciudad, País'}</div>
                    </div>
                    <div style="text-align:right;">
                        <span data-cover-field="date" contenteditable="true" style="color:${textColorMuted}; font-weight:500;">${dateStr}</span>
                    </div>
                </section>

                <!-- Saludo -->
                <div data-cover-field="salutation" contenteditable="true" style="font-size:0.95rem; font-weight:600; margin-bottom:1.5rem; color:${textColorDark};">
                    ${letter.salutation || 'Estimado/a Equipo de Selección,'}
                </div>

                <!-- Cuerpo -->
                <main style="flex:1; display:flex; flex-direction:column; gap:1.35rem; font-size:0.94rem; line-height:1.8; color:${textColorDark}; text-align:justify;">
                    ${paragraphs.map((pText, idx) => `
                        <p data-cover-field="paragraph-${idx}" contenteditable="true" style="margin:0; min-height:1.5rem;">${pText}</p>
                    `).join('')}
                </main>

                <!-- Firma -->
                <footer style="margin-top:3.5rem;">
                    <div data-cover-field="signoff" contenteditable="true" style="font-size:0.92rem; color:${textColorMuted}; margin-bottom:2rem;">
                        ${letter.signoff || 'Atentamente,'}
                    </div>
                    <div data-cover-field="signature" contenteditable="true" style="font-size:1.1rem; font-weight:600; color:${textColorDark};">
                        ${letter.signature || senderName}
                    </div>
                </footer>
            </div>`;
        }
    };

    /**
     * Renderiza la Carta de Presentación según la plantilla seleccionada en cvData.coverLetter.template.
     */
    function render(cvData) {
        if (!cvData) return '';
        const letter = cvData.coverLetter || {};
        const templateName = letter.template || 'modern';
        const renderer = templates[templateName] || templates.modern;
        return renderer(cvData);
    }

    CvApp.coverLetterRenderer = {
        render: render,
        templates: templates,
        getFormattedDate: getFormattedDate
    };
})();
