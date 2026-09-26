// public/js/modules/exporter.js
// Módulo de exportación y compartición de CV (PDF, HTML, Typst y Enlaces URL)
(function () {
    window.CvApp = window.CvApp || {};

    /**
     * Exporta el CV a formato PDF utilizando los estilos de impresión nativos del navegador.
     */
    const downloadPdf = () => {
        if (typeof CvApp.syncFromInlinePreview === 'function') {
            CvApp.syncFromInlinePreview();
        }
        const cvData = CvApp.state?.cvData || {};
        const originalTitle = document.title;
        const firstName = cvData.personalInfo?.firstName || 'CV';
        const lastName = cvData.personalInfo?.lastName || 'Profesional';
        const newTitle = `CV_${firstName.replace(/ /g, '_')}_${lastName.replace(/ /g, '_')}`;
        
        document.title = newTitle;
        window.print();
        setTimeout(() => { 
            document.title = originalTitle; 
        }, 500);
    };

    /**
     * Exporta el CV a un archivo HTML autónomo descargable con estilos incrustados.
     */
    const downloadHtml = async () => {
        if (typeof CvApp.syncFromInlinePreview === 'function') {
            CvApp.syncFromInlinePreview();
        }
        const cvData = CvApp.state?.cvData || {};
        const cvPreviewWrapper = document.getElementById('cv-preview-wrapper');
        if (!cvPreviewWrapper) return;

        try {
            // Cargar los archivos CSS modulares que dan estilo al CV
            const [baseCssRes, previewCssRes] = await Promise.all([
                fetch('css/base.css').then(r => r.text()).catch(() => ''),
                fetch('css/preview.css').then(r => r.text()).catch(() => '')
            ]);

            const fontUrl = "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Lora:wght@400;600&family=Source+Code+Pro:wght@400;600&display=swap";
            const cvHtml = cvPreviewWrapper.innerHTML;
            const themeColor = cvData.themeColor || '#525f7f';
            const layout = cvData.layout || 'classic';

            const standaloneCss = `
                body {
                    margin: 0;
                    padding: 2rem 1rem;
                    background-color: #e9ecef;
                    font-family: var(--font-body, 'Inter', sans-serif);
                    color: var(--color-dark-text, #212529);
                    display: flex;
                    justify-content: center;
                    align-items: flex-start;
                    min-height: 100vh;
                    overflow-y: auto !important;
                }
                #cv-preview-wrapper {
                    margin: 0 auto;
                    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
                    border-radius: var(--radius-sm, 0.3rem);
                    overflow: hidden;
                    width: 100%;
                    max-width: 900px;
                    background-color: var(--color-white, #ffffff);
                    aspect-ratio: 210 / 297;
                    display: grid;
                }
                .download-floater {
                    position: fixed;
                    bottom: 24px;
                    right: 24px;
                    background-color: var(--primary-accent, #dc3545);
                    color: white;
                    border: none;
                    border-radius: 50%;
                    width: 56px;
                    height: 56px;
                    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.25);
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: transform 0.2s ease, box-shadow 0.2s ease;
                    z-index: 1000;
                }
                .download-floater:hover {
                    transform: scale(1.1);
                    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
                }
                @media (max-width: 768px) {
                    body {
                        padding: 0;
                        background: white;
                    }
                    #cv-preview-wrapper {
                        box-shadow: none;
                        border-radius: 0;
                        aspect-ratio: unset;
                    }
                }
                @media print {
                    body {
                        background: none !important;
                        padding: 0 !important;
                        margin: 0 !important;
                    }
                    .download-floater {
                        display: none !important;
                    }
                    #cv-preview-wrapper {
                        box-shadow: none !important;
                        border-radius: 0 !important;
                        margin: 0 !important;
                        max-width: none !important;
                        width: 100% !important;
                    }
                }
            `;

            const fullName = CvApp.templateHelpers ? CvApp.templateHelpers.getFullName(cvData.personalInfo) : (cvData.personalInfo?.firstName || 'CV');

            const fullHtml = `<!DOCTYPE html>
<html lang="es" style="--primary-accent: ${themeColor};">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CV de ${fullName}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="${fontUrl}" rel="stylesheet">
    <style>
${baseCssRes}

${previewCssRes}

${standaloneCss}
    </style>
</head>
<body data-theme="gray">
    <div id="cv-preview-wrapper" data-layout="${layout}">
${cvHtml}
    </div>
    
    <button class="download-floater" onclick="window.print()" title="Imprimir / Guardar en PDF">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
    </button>
</body>
</html>`;

            const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            const firstName = cvData.personalInfo?.firstName || 'CV';
            const lastName = cvData.personalInfo?.lastName || 'Profesional';
            a.download = `CV_${firstName.replace(/ /g, '_')}_${lastName.replace(/ /g, '_')}.html`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            CvApp.showToast("¡Archivo HTML exportado con éxito!", "success");
        } catch (error) {
            console.error("Error al generar el archivo HTML:", error);
            CvApp.showToast("Hubo un error al intentar generar el archivo HTML.", "error");
        }
    };

    /**
     * Exporta el código fuente tipográfico Typst (.typ).
     */
    const downloadTypst = async () => {
        if (typeof CvApp.syncFromInlinePreview === 'function') {
            CvApp.syncFromInlinePreview();
        }
        if (typeof TypstCompiler !== 'undefined') {
            try {
                const cvData = CvApp.state?.cvData || {};
                await TypstCompiler.downloadTypstFile(cvData, cvData.layout);
                CvApp.showToast(`¡Plantilla Typst (.typ) [${cvData.layout || 'classic'}] exportada con éxito!`, 'success');
            } catch (err) {
                console.error("Error al exportar Typst:", err);
                CvApp.showToast('Error al compilar el archivo Typst.', 'error');
            }
        } else {
            CvApp.showToast('Compilador Typst no disponible.', 'error');
        }
    };

    /**
     * Construye un documento Word (.doc) 100% compatible con MSO Tables para preservar
     * fielmente el diseño de columnas, sidebar, colores, avatar, barras de habilidades y tipografía.
     */
    const buildWordDocumentHtml = (cvData) => {
        const fullName = CvApp.templateHelpers ? CvApp.templateHelpers.getFullName(cvData.personalInfo) : (cvData.personalInfo?.firstName || 'CV');
        const themeColor = cvData.themeColor || '#008751';
        const titleColor = cvData.sectionTitleColor || themeColor;
        const textColorDark = cvData.textColorDark || '#212529';
        const textColorLight = cvData.textColorLight || '#ffffff';
        const textColorMuted = cvData.textColorMuted || '#6c757d';
        const layout = cvData.layout || 'classic';
        const pInfo = cvData.personalInfo || {};

        const fontMap = {
            'inter': "'Segoe UI', 'Calibri', 'Helvetica Neue', Arial, sans-serif",
            'outfit': "'Outfit', 'Segoe UI', 'Calibri', Arial, sans-serif",
            'roboto': "'Roboto', 'Segoe UI', 'Calibri', Arial, sans-serif",
            'merriweather': "'Merriweather', 'Georgia', 'Times New Roman', serif",
            'playfair': "'Playfair Display', 'Georgia', 'Times New Roman', serif"
        };
        const fontFamily = fontMap[cvData.fontFamily] || fontMap['inter'];

        // Helpers para componentes de Word
        const renderWordAvatar = (sizePt = 80, borderCol = '#ffffff') => {
            const avatar = cvData.avatar;
            const initials = (avatar?.type === 'initials' && avatar?.value)
                ? avatar.value
                : (CvApp.templateHelpers ? CvApp.templateHelpers.getInitials(pInfo) : 'CV');

            if (avatar && (avatar.type === 'photo' || avatar.type === 'url') && avatar.value) {
                return `<table align="center" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto 12pt auto; border-collapse:collapse;">
                    <tr>
                        <td align="center" valign="middle" style="width:${sizePt}pt; height:${sizePt}pt; border-radius:50%; border:3pt solid ${borderCol}; text-align:center; overflow:hidden;">
                            <img src="${avatar.value}" width="${Math.round(sizePt * 1.33)}" height="${Math.round(sizePt * 1.33)}" style="width:${sizePt}pt; height:${sizePt}pt; border-radius:50%; display:block;" />
                        </td>
                    </tr>
                </table>`;
            }
            if (avatar && avatar.type === 'none') return '';

            return `<table align="center" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto 12pt auto; border-collapse:collapse;">
                <tr>
                    <td align="center" valign="middle" bgcolor="${themeColor}" style="width:${sizePt}pt; height:${sizePt}pt; border-radius:50%; border:3pt solid ${borderCol}; background-color:${themeColor}; color:#ffffff; font-size:${Math.round(sizePt * 0.32)}pt; font-weight:bold; font-family:'Calibri','Segoe UI',sans-serif; text-align:center; vertical-align:middle; line-height:${sizePt}pt;">
                        ${initials || 'CV'}
                    </td>
                </tr>
            </table>`;
        };

        const renderWordContactVertical = (color) => {
            let html = '';
            if (pInfo.phone) html += `<p style="font-size:8pt; margin-bottom:6pt; color:${color}; line-height:1.3;"><strong>Teléfono:</strong><br>${pInfo.phone}</p>`;
            if (pInfo.email) html += `<p style="font-size:8pt; margin-bottom:6pt; color:${color}; line-height:1.3;"><strong>Email:</strong><br>${pInfo.email}</p>`;
            if (pInfo.address) html += `<p style="font-size:8pt; margin-bottom:6pt; color:${color}; line-height:1.3;"><strong>Dirección:</strong><br>${pInfo.address}</p>`;
            if (pInfo.website) html += `<p style="font-size:8pt; margin-bottom:6pt; color:${color}; line-height:1.3;"><strong>Web:</strong><br>${pInfo.website}</p>`;
            return html;
        };

        const renderWordContactHorizontal = (color) => {
            const items = [];
            if (pInfo.email) items.push(pInfo.email);
            if (pInfo.phone) items.push(pInfo.phone);
            if (pInfo.address) items.push(pInfo.address);
            if (pInfo.website) items.push(pInfo.website);
            return `<div style="font-size:8.5pt; color:${color}; margin-top:3pt;">${items.join(' &nbsp;•&nbsp; ')}</div>`;
        };

        const renderWordSectionHeader = (title, tCol) => {
            return `<table width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%; border-collapse:collapse; margin-top:14pt; margin-bottom:8pt;">
                <tr>
                    <td style="border-bottom:2pt solid ${tCol}; padding-bottom:3pt;">
                        <span style="font-size:11pt; font-weight:bold; color:${tCol}; text-transform:uppercase; letter-spacing:0.5pt; font-family:${fontFamily};">${title}</span>
                    </td>
                </tr>
            </table>`;
        };

        const renderWordExperience = (color, mColor, bulletCol) => {
            if (!Array.isArray(cvData.experience) || cvData.experience.length === 0) return '';
            return cvData.experience.map(exp => {
                const dateStr = CvApp.templateHelpers ? CvApp.templateHelpers.formatExperienceDate(exp.startDate, exp.endDate, exp.current) : (exp.startDate || '');
                return `<table width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%; border-collapse:collapse; margin-bottom:10pt;">
                    <tr>
                        ${bulletCol ? `<td width="14" valign="top" style="width:14pt; vertical-align:top; padding-top:2pt;"><span style="color:${bulletCol}; font-size:14pt; line-height:1;">•</span></td>` : ''}
                        <td valign="top" style="vertical-align:top;">
                            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%; border-collapse:collapse;">
                                <tr>
                                    <td valign="baseline" style="vertical-align:baseline;">
                                        <strong style="font-size:10pt; color:${color}; font-weight:bold;">${exp.position || ''}</strong>
                                    </td>
                                    <td align="right" valign="baseline" style="text-align:right; vertical-align:baseline; white-space:nowrap; font-size:8.5pt; color:${mColor}; font-style:italic;">
                                        ${dateStr}
                                    </td>
                                </tr>
                            </table>
                            ${exp.company ? `<div style="font-size:9pt; font-style:italic; color:${color}; opacity:0.9; margin-top:1pt; margin-bottom:2pt;">${exp.company}</div>` : ''}
                            ${exp.description ? `<div style="font-size:8.5pt; line-height:1.45; color:${color}; opacity:0.85; margin-top:2pt;">${exp.description.replace(/\n/g, '<br>')}</div>` : ''}
                        </td>
                    </tr>
                </table>`;
            }).join('');
        };

        const renderWordEducation = (color, mColor, bulletCol) => {
            if (!Array.isArray(cvData.education) || cvData.education.length === 0) return '';
            return cvData.education.map(edu => {
                const dateStr = CvApp.templateHelpers ? CvApp.templateHelpers.formatExperienceDate(edu.startDate, edu.endDate, edu.current) : (edu.startDate || '');
                return `<table width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%; border-collapse:collapse; margin-bottom:8pt;">
                    <tr>
                        ${bulletCol ? `<td width="14" valign="top" style="width:14pt; vertical-align:top; padding-top:2pt;"><span style="color:${bulletCol}; font-size:14pt; line-height:1;">•</span></td>` : ''}
                        <td valign="top" style="vertical-align:top;">
                            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%; border-collapse:collapse;">
                                <tr>
                                    <td valign="baseline" style="vertical-align:baseline;">
                                        <strong style="font-size:10pt; color:${color}; font-weight:bold;">${edu.degree || ''}</strong>
                                    </td>
                                    <td align="right" valign="baseline" style="text-align:right; vertical-align:baseline; white-space:nowrap; font-size:8.5pt; color:${mColor}; font-style:italic;">
                                        ${dateStr}
                                    </td>
                                </tr>
                            </table>
                            ${edu.institution ? `<div style="font-size:9pt; font-style:italic; color:${color}; opacity:0.9; margin-top:1pt;">${edu.institution}</div>` : ''}
                            ${edu.description ? `<div style="font-size:8.5pt; line-height:1.45; color:${color}; opacity:0.85; margin-top:2pt;">${edu.description.replace(/\n/g, '<br>')}</div>` : ''}
                        </td>
                    </tr>
                </table>`;
            }).join('');
        };

        const levelPercent = { beginner: 35, intermediate: 60, advanced: 85, expert: 98 };
        const renderWordSkills = (color, barColor, showBars = true) => {
            if (!Array.isArray(cvData.skills) || cvData.skills.length === 0) return '';
            return cvData.skills.map(s => {
                const pct = levelPercent[s.level] || 70;
                if (!showBars) {
                    return `<p style="font-size:8.5pt; margin-bottom:4pt; color:${color};">• <strong>${s.name}</strong> ${s.level ? `(${s.level})` : ''}</p>`;
                }
                return `<div style="margin-bottom:6pt;">
                    <div style="font-size:8.5pt; font-weight:500; color:${color}; margin-bottom:2pt;">${s.name}</div>
                    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%; height:5pt; background-color:#e5e7eb; border-collapse:collapse; border-radius:3pt;">
                        <tr>
                            <td width="${pct}%" bgcolor="${barColor}" style="width:${pct}%; background-color:${barColor}; height:5pt; font-size:1pt; line-height:1pt;">&nbsp;</td>
                            <td width="${100 - pct}%" style="width:${100 - pct}%; height:5pt; font-size:1pt; line-height:1pt;">&nbsp;</td>
                        </tr>
                    </table>
                </div>`;
            }).join('');
        };

        const renderWordImpacts = (color, bulletCol) => {
            if (!Array.isArray(cvData.impacts) || cvData.impacts.length === 0) return '';
            return `<ul style="margin-top:4pt; margin-bottom:8pt; padding-left:14pt; color:${color}; font-size:8.5pt;">
                ${cvData.impacts.map(i => `<li style="margin-bottom:3pt;">${i.description}</li>`).join('')}
            </ul>`;
        };

        const renderWordCustomSections = (color, tCol) => {
            if (!Array.isArray(cvData.customSections) || cvData.customSections.length === 0) return '';
            return cvData.customSections.map(cs => `
                ${renderWordSectionHeader(cs.title || 'Sección', tCol)}
                <div style="font-size:8.5pt; line-height:1.5; color:${color}; white-space:pre-wrap;">${cs.content || ''}</div>
            `).join('');
        };

        // Renderizado según familia de diseño
        const sidebarLayouts = ['classic', 'corporate', 'two-tone', 'swiss', 'prestige', 'gradient', 'bold', 'infographic'];
        const twoColMainLayouts = ['modern', 'compact', 'impact'];

        let bodyContent = '';

        if (sidebarLayouts.includes(layout)) {
            // DISEÑO CON SIDEBAR (IZQUIERDA) Y MAIN (DERECHA)
            const sidebarBg = layout === 'corporate' ? '#f8f9fa' : (layout === 'two-tone' ? '#f0f4f8' : (cvData.backgroundSidebar || themeColor));
            const sidebarText = (layout === 'corporate' || layout === 'two-tone') ? textColorDark : textColorLight;
            const mainBg = cvData.backgroundMain || '#ffffff';
            const bulletColor = themeColor;

            bodyContent = `
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%; border-collapse:collapse; min-height:100%;">
    <tr>
        <!-- SIDEBAR (35%) -->
        <td width="35%" bgcolor="${sidebarBg}" valign="top" style="width:35%; background-color:${sidebarBg}; color:${sidebarText}; padding:28pt 18pt; vertical-align:top;">
            ${renderWordAvatar(85, sidebarText === '#ffffff' ? '#ffffff' : themeColor)}

            <div style="text-align:center; margin-bottom:16pt;">
                <h1 style="font-size:18pt; font-weight:bold; color:${sidebarText}; margin:0 0 3pt 0; line-height:1.15; font-family:${fontFamily};">${fullName}</h1>
                <div style="font-size:10.5pt; color:${sidebarText}; opacity:0.9; margin-bottom:8pt; font-weight:500;">${pInfo.title || ''}</div>
                ${pInfo.summary ? `<p style="font-size:8pt; line-height:1.45; color:${sidebarText}; opacity:0.9; text-align:justify; margin:0;">${pInfo.summary}</p>` : ''}
            </div>

            <!-- CONTACTO -->
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:14pt; margin-bottom:6pt;">
                <tr><td style="border-bottom:1pt solid ${sidebarText === '#ffffff' ? 'rgba(255,255,255,0.35)' : '#dddddd'}; padding-bottom:3pt;">
                    <strong style="font-size:9.5pt; color:${sidebarText}; text-transform:uppercase; letter-spacing:0.5pt;">CONTACTO</strong>
                </td></tr>
            </table>
            ${renderWordContactVertical(sidebarText)}

            ${(layout === 'corporate' || layout === 'two-tone' || layout === 'swiss') ? `
                <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:14pt; margin-bottom:6pt;">
                    <tr><td style="border-bottom:1pt solid ${sidebarText === '#ffffff' ? 'rgba(255,255,255,0.35)' : '#dddddd'}; padding-bottom:3pt;">
                        <strong style="font-size:9.5pt; color:${sidebarText}; text-transform:uppercase; letter-spacing:0.5pt;">HABILIDADES</strong>
                    </td></tr>
                </table>
                ${renderWordSkills(sidebarText, themeColor, false)}
            ` : ''}
        </td>

        <!-- MAIN CONTENT (65%) -->
        <td width="65%" bgcolor="${mainBg}" valign="top" style="width:65%; background-color:${mainBg}; color:${textColorDark}; padding:28pt 22pt; vertical-align:top;">
            ${layout !== 'classic' ? `
                <h1 style="font-size:22pt; font-weight:bold; color:${themeColor}; margin:0 0 2pt 0; font-family:${fontFamily};">${fullName}</h1>
                <h2 style="font-size:11.5pt; font-weight:500; color:${textColorMuted}; margin:0 0 10pt 0; border-bottom:1pt solid #eeeeee; padding-bottom:6pt; font-family:${fontFamily};">${pInfo.title || ''}</h2>
            ` : ''}

            ${(Array.isArray(cvData.experience) && cvData.experience.length > 0) ? `
                ${renderWordSectionHeader('EXPERIENCIA LABORAL', titleColor)}
                ${renderWordExperience(textColorDark, textColorMuted, bulletColor)}
            ` : ''}

            ${(Array.isArray(cvData.education) && cvData.education.length > 0) ? `
                ${renderWordSectionHeader('EDUCACIÓN Y FORMACIÓN', titleColor)}
                ${renderWordEducation(textColorDark, textColorMuted, bulletColor)}
            ` : ''}

            ${(Array.isArray(cvData.skills) && cvData.skills.length > 0 && layout !== 'corporate' && layout !== 'two-tone' && layout !== 'swiss') ? `
                ${renderWordSectionHeader('HABILIDADES Y COMPETENCIAS', titleColor)}
                ${renderWordSkills(textColorDark, themeColor, true)}
            ` : ''}

            ${(Array.isArray(cvData.impacts) && cvData.impacts.length > 0) ? `
                ${renderWordSectionHeader('LOGROS E IMPACTO', titleColor)}
                ${renderWordImpacts(textColorDark, bulletColor)}
            ` : ''}

            ${renderWordCustomSections(textColorDark, titleColor)}
        </td>
    </tr>
</table>`;
        } else if (twoColMainLayouts.includes(layout)) {
            // DISEÑO CON HEADER SUPERIOR Y 2 COLUMNAS
            bodyContent = `
<div style="padding:24pt;">
    <!-- HEADER -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%; border-collapse:collapse; padding-bottom:12pt; border-bottom:2.5pt solid ${themeColor}; margin-bottom:16pt;">
        <tr>
            <td width="80" valign="middle" style="width:80pt; vertical-align:middle;">
                ${renderWordAvatar(65, themeColor)}
            </td>
            <td valign="middle" style="vertical-align:middle; padding-left:14pt;">
                <h1 style="font-size:24pt; font-weight:bold; color:${textColorDark}; margin:0 0 2pt 0; font-family:${fontFamily};">${fullName}</h1>
                <h2 style="font-size:12pt; font-weight:500; color:${themeColor}; margin:0 0 4pt 0; font-family:${fontFamily};">${pInfo.title || ''}</h2>
                ${renderWordContactHorizontal(textColorMuted)}
            </td>
        </tr>
    </table>

    <!-- 2 COLUMNAS -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%; border-collapse:collapse;">
        <tr>
            <!-- COLUMNA PRINCIPAL (65%) -->
            <td width="65%" valign="top" style="width:65%; vertical-align:top; padding-right:16pt;">
                ${pInfo.summary ? `
                    ${renderWordSectionHeader('Perfil Profesional', titleColor)}
                    <p style="font-size:8.5pt; line-height:1.5; color:${textColorDark}; text-align:justify;">${pInfo.summary}</p>
                ` : ''}

                ${(Array.isArray(cvData.experience) && cvData.experience.length > 0) ? `
                    ${renderWordSectionHeader('Experiencia Laboral', titleColor)}
                    ${renderWordExperience(textColorDark, textColorMuted, themeColor)}
                ` : ''}

                ${(Array.isArray(cvData.education) && cvData.education.length > 0) ? `
                    ${renderWordSectionHeader('Educación', titleColor)}
                    ${renderWordEducation(textColorDark, textColorMuted, themeColor)}
                ` : ''}

                ${renderWordCustomSections(textColorDark, titleColor)}
            </td>

            <!-- COLUMNA SECUNDARIA (35%) -->
            <td width="35%" valign="top" style="width:35%; vertical-align:top; padding-left:16pt; border-left:1pt solid #eeeeee;">
                ${(Array.isArray(cvData.skills) && cvData.skills.length > 0) ? `
                    ${renderWordSectionHeader('Habilidades', titleColor)}
                    ${renderWordSkills(textColorDark, themeColor, true)}
                ` : ''}

                ${(Array.isArray(cvData.impacts) && cvData.impacts.length > 0) ? `
                    ${renderWordSectionHeader('Logros Clave', titleColor)}
                    ${renderWordImpacts(textColorDark, themeColor)}
                ` : ''}
            </td>
        </tr>
    </table>
</div>`;
        } else {
            // DISEÑO CABECERA CENTRADA / EJECUTIVO / MINIMALISTA / ELEGANTE
            bodyContent = `
<div style="padding:28pt 32pt;">
    <div style="text-align:center; margin-bottom:18pt;">
        <h1 style="font-size:26pt; font-weight:bold; color:${textColorDark}; margin:0 0 3pt 0; font-family:${fontFamily};">${fullName}</h1>
        <h2 style="font-size:12pt; font-weight:normal; font-style:italic; color:${textColorMuted}; margin:0 0 6pt 0; font-family:${fontFamily};">${pInfo.title || ''}</h2>
        ${renderWordContactHorizontal(textColorMuted)}
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:10pt; margin-bottom:12pt;">
            <tr><td style="border-bottom:1.5pt solid ${themeColor};"></td></tr>
        </table>
    </div>

    ${pInfo.summary ? `
        ${renderWordSectionHeader('Resumen Profesional', titleColor)}
        <p style="font-size:9pt; line-height:1.6; color:${textColorDark}; text-align:justify; margin-bottom:10pt;">${pInfo.summary}</p>
    ` : ''}

    ${(Array.isArray(cvData.experience) && cvData.experience.length > 0) ? `
        ${renderWordSectionHeader('Experiencia Laboral', titleColor)}
        ${renderWordExperience(textColorDark, textColorMuted, themeColor)}
    ` : ''}

    ${(Array.isArray(cvData.education) && cvData.education.length > 0) ? `
        ${renderWordSectionHeader('Educación y Formación', titleColor)}
        ${renderWordEducation(textColorDark, textColorMuted, themeColor)}
    ` : ''}

    ${(Array.isArray(cvData.skills) && cvData.skills.length > 0) ? `
        ${renderWordSectionHeader('Habilidades y Competencias', titleColor)}
        <div style="margin-bottom:8pt;">
            ${renderWordSkills(textColorDark, themeColor, false)}
        </div>
    ` : ''}

    ${(Array.isArray(cvData.impacts) && cvData.impacts.length > 0) ? `
        ${renderWordSectionHeader('Logros e Impacto', titleColor)}
        ${renderWordImpacts(textColorDark, themeColor)}
    ` : ''}

    ${renderWordCustomSections(textColorDark, titleColor)}
</div>`;
        }

        return `<html xmlns:o="urn:schemas-microsoft-com:office:office" 
      xmlns:w="urn:schemas-microsoft-com:office:word" 
      xmlns="http://www.w3.org/TR/REC-html40">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
    <title>${fullName} - CV</title>
    <!--[if gte mso 9]>
    <xml>
        <w:WordDocument>
            <w:View>Print</w:View>
            <w:Zoom>100</w:Zoom>
            <w:DoNotOptimizeForBrowser/>
        </w:WordDocument>
    </xml>
    <![endif]-->
    <style>
        @page {
            size: 21.0cm 29.7cm;
            margin: 0cm;
            mso-page-orientation: portrait;
        }
        @page Section1 {
            size: 21.0cm 29.7cm;
            margin: 0cm;
            mso-header-margin: 0cm;
            mso-footer-margin: 0cm;
            mso-paper-source: 0;
        }
        div.Section1 {
            page: Section1;
        }
        body {
            font-family: ${fontFamily};
            font-size: 10pt;
            line-height: 1.4;
            color: ${textColorDark};
            background-color: #ffffff;
            margin: 0;
            padding: 0;
        }
        table {
            border-collapse: collapse;
            mso-table-lspace: 0pt;
            mso-table-rspace: 0pt;
        }
        td {
            padding: 0;
            vertical-align: top;
        }
        p {
            margin: 0 0 5pt 0;
            line-height: 1.4;
        }
        h1, h2, h3, h4 {
            margin: 0;
            font-family: ${fontFamily};
        }
        a {
            color: inherit;
            text-decoration: none;
        }
    </style>
</head>
<body>
    <div class="Section1">
        ${bodyContent}
    </div>
</body>
</html>`;
    };

    /**
     * Exporta el CV a un documento Word (.docx) nativo con formato OpenXML idéntico a la previsualización.
     */
    const downloadWord = async () => {
        if (typeof CvApp.syncFromInlinePreview === 'function') {
            CvApp.syncFromInlinePreview();
        }
        const cvData = CvApp.state?.cvData || {};
        const firstName = cvData.personalInfo?.firstName || 'CV';
        const lastName = cvData.personalInfo?.lastName || 'Profesional';
        const fileName = `CV_${firstName.replace(/ /g, '_')}_${lastName.replace(/ /g, '_')}.docx`;

        CvApp.showToast("Generando documento Word (.docx) profesional...", "info");

        try {
            // Generar documento Word OpenXML en el servidor
            const response = await fetch('/api/export/docx', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ cvData })
            });

            if (response.ok) {
                const blob = await response.blob();
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = fileName;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                CvApp.showToast("¡Documento Word (.docx) descargado con éxito!", "success");
                return;
            }

            console.warn("Fallo en generación remota, usando generador alternativo...");
        } catch (serverErr) {
            console.warn("Error contactando endpoint /api/export/docx:", serverErr);
        }

        // Fallback local si el servidor no tiene Quarto activo
        try {
            const layout = cvData.layout || 'classic';
            const wordHtml = buildWordDocumentHtml(cvData);
            const blob = new Blob(['\ufeff', wordHtml], { type: 'application/msword;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `CV_${firstName.replace(/ /g, '_')}_${lastName.replace(/ /g, '_')}_${layout}.doc`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            CvApp.showToast(`¡Documento Word exportado con éxito!`, "success");
        } catch (error) {
            console.error("Error exportando a Word:", error);
            CvApp.showToast("Hubo un error al generar el archivo Word.", "error");
        }
    };

    /**
     * Genera un enlace comprimido con el estado actual del CV y lo copia al portapapeles.
     */
    const shareCv = async () => {
        if (typeof CvApp.syncFromInlinePreview === 'function') {
            CvApp.syncFromInlinePreview();
        }
        const cvData = CvApp.state?.cvData || {};
        const cvPreviewWrapper = document.getElementById('cv-preview-wrapper');
        try {
            const dataToShare = JSON.parse(JSON.stringify(cvData));
            if (cvPreviewWrapper) {
                dataToShare.customHtml = cvPreviewWrapper.innerHTML;
            }
            const jsonString = JSON.stringify(dataToShare);
            const compressedString = typeof LZString !== 'undefined' ? LZString.compressToEncodedURIComponent(jsonString) : btoa(jsonString);
            const dataParam = typeof LZString !== 'undefined' ? compressedString : encodeURIComponent(compressedString);
            const shareUrl = `${window.location.origin}${window.location.pathname}#cv=${dataParam}`;

            if (shareUrl.length > 50000) {
                CvApp.showToast("El enlace generado es muy largo, pero debería funcionar.", "warning");
            }

            navigator.clipboard.writeText(shareUrl).then(() => {
                CvApp.showToast("¡Enlace para compartir copiado al portapapeles!", "success");
            }).catch(err => {
                console.error('Error al copiar al portapapeles: ', err);
                CvApp.showToast("No se pudo copiar automáticamente.", "error");
                CvApp.showModal("Copiar Enlace", { text: "Copia este enlace manualmente:", defaultValue: shareUrl }, "prompt");
            });
        } catch (error) {
            console.error("Error al crear el enlace para compartir:", error);
            CvApp.showToast("No se pudo generar el enlace para compartir.", "error");
        }
    };

    // Exponer API del módulo
    CvApp.exporter = {
        downloadPdf,
        downloadHtml,
        downloadTypst,
        downloadWord,
        shareCv
    };

    // Alias directos de compatibilidad
    CvApp.downloadPdf = downloadPdf;
    CvApp.downloadHtml = downloadHtml;
    CvApp.downloadTypst = downloadTypst;
    CvApp.downloadWord = downloadWord;
    CvApp.shareCv = shareCv;
})();
