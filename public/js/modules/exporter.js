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
    const downloadTypst = () => {
        if (typeof CvApp.syncFromInlinePreview === 'function') {
            CvApp.syncFromInlinePreview();
        }
        if (typeof TypstCompiler !== 'undefined') {
            const cvData = CvApp.state?.cvData || {};
            TypstCompiler.downloadTypstFile(cvData, cvData.layout);
            CvApp.showToast('¡Plantilla Typst (.typ) exportada con éxito!', 'success');
        } else {
            CvApp.showToast('Compilador Typst no disponible.', 'error');
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
        shareCv
    };

    // Alias directos de compatibilidad
    CvApp.downloadPdf = downloadPdf;
    CvApp.downloadHtml = downloadHtml;
    CvApp.downloadTypst = downloadTypst;
    CvApp.shareCv = shareCv;
})();
