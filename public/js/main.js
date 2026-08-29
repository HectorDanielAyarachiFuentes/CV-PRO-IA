// script.js — Orquestador principal (modularizado)
// Los módulos individuales están en js/ y exponen funciones a través de window.CvApp
document.addEventListener('DOMContentLoaded', () => {

    // --- REFERENCIAS DOM ---
    const formWrapper = document.getElementById('form-section-wrapper');
    const downloadPdfBtn = document.getElementById('download-pdf-btn');
    const downloadHtmlBtn = document.getElementById('download-html-btn');
    const downloadTypstBtn = document.getElementById('download-typst-btn');
    const resetCvBtn = document.getElementById('reset-cv-btn');
    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    const toggleFullscreenBtn = document.getElementById('toggle-fullscreen-btn');
    const shareCvBtn = document.getElementById('share-cv-btn');
    const cvPreviewWrapper = document.getElementById('cv-preview-wrapper');
    const aboutBtn = document.getElementById('about-btn');
    const aboutModal = document.getElementById('about-modal');
    const modalCloseBtn = document.getElementById('modal-close-btn');
    const undoBtn = document.getElementById('undo-btn');
    const redoBtn = document.getElementById('redo-btn');

    const aboutAudio = new Audio('assets/audio/Dulce-song.mp3');

    // Alias cortos para el acceso a los módulos
    const state = CvApp.state;

    // --- FORM RENDERERS ---
    let formRenderers = {};

    const renderForm = (html) => {
        formWrapper.innerHTML = html;
        requestAnimationFrame(() => formWrapper.querySelector('.form-section')?.classList.add('active'));
    };

    // --- RENDER CV PREVIEW ---
    const renderCVPreview = () => {
        const cvData = state.cvData;
        const themeColor = cvData.themeColor || '#525f7f';
        document.documentElement.style.setProperty('--primary-accent', themeColor);
        const layout = cvData.layout || 'classic';
        cvPreviewWrapper.dataset.layout = layout;

        if (document.body.classList.contains('read-only-mode') && cvData.customHtml) {
            cvPreviewWrapper.innerHTML = cvData.customHtml;
            return;
        }

        const templateFn = state.templates[layout];
        if (typeof templateFn !== 'function') {
            console.error(`La plantilla "${layout}" no existe o no es una función.`);
            cvPreviewWrapper.innerHTML = `<div style="padding:2rem; text-align:center; color:red;">Error: La plantilla seleccionada no se pudo cargar.</div>`;
            return;
        }
        cvPreviewWrapper.innerHTML = templateFn(cvData, CvApp.templateHelpers);

        // Inyectar secciones personalizadas en el área principal del template renderizado
        if (cvData.customSections && cvData.customSections.length > 0) {
            const mainEl = cvPreviewWrapper.querySelector('[data-cv-background="main"] main, [data-cv-background="main"]') ||
                cvPreviewWrapper.querySelector('main') ||
                cvPreviewWrapper.firstElementChild;
            if (mainEl) {
                const accentColor = cvData.themeColor || '#333';
                const textColor = cvData.textColorDark || '#222';
                const titleColor = cvData.sectionTitleColor || accentColor;
                const customHtml = cvData.customSections.map(cs =>
                    `<div style="margin-top:1.5rem;">
                        <h3 style="font-family:var(--font-heading);font-size:1rem;font-weight:600;color:${titleColor};border-bottom:2px solid ${titleColor};padding-bottom:.25rem;margin-bottom:1rem;display:inline-block;text-transform:uppercase;">${cs.title || 'NUEVA SECCIÓN'}</h3>
                        <p style="font-size:.85rem;line-height:1.65;color:${textColor};white-space:pre-wrap;">${cs.content || ''}</p>
                    </div>`
                ).join('');
                mainEl.insertAdjacentHTML('beforeend', customHtml);
            }
        }
    };

    // Exponer renderCVPreview para que los módulos puedan llamarlo
    CvApp.renderCVPreview = renderCVPreview;

    // --- SET ACTIVE SECTION ---
    const setActiveSection = (sectionName) => {
        if (!sectionName) return;
        localStorage.setItem('cvProLastSection', sectionName);

        document.querySelectorAll('.editor-nav .nav-item').forEach(item => item.classList.toggle('active', item.getAttribute('href') === `#${sectionName}`));

        const renderer = formRenderers[sectionName];
        if (typeof renderer === 'function') {
            let activeSubTab = null;
            if (sectionName === 'design') {
                const activeTabEl = formWrapper.querySelector('.design-tab.active');
                if (activeTabEl) activeSubTab = activeTabEl.dataset.tab;
            }
            renderer();

            if (sectionName === 'design') {
                document.querySelectorAll('.layout-selector .mini-preview-container').forEach(container => {
                    const layoutCard = container.closest('.layout-card');
                    if (layoutCard) {
                        const layoutName = layoutCard.dataset.layout;
                        const templateFn = state.templates[layoutName];
                        if (templateFn) {
                            container.innerHTML = templateFn(state.cvData, CvApp.templateHelpers);
                            const child = container.firstElementChild;
                            if (child) {
                                const containerWidth = container.clientWidth || 120;
                                const scale = containerWidth / 794;
                                child.style.width = '794px';
                                child.style.height = '1123px';
                                child.style.transform = `scale(${scale})`;
                                child.style.transformOrigin = 'top left';
                                child.style.pointerEvents = 'none';
                            }
                        }
                    }
                });

                if (activeSubTab) {
                    const designTabs = formWrapper.querySelectorAll('.design-tab');
                    const designContents = formWrapper.querySelectorAll('.design-content');
                    designTabs.forEach(t => t.classList.toggle('active', t.dataset.tab === activeSubTab));
                    designContents.forEach(c => c.classList.toggle('active', c.dataset.content === activeSubTab));
                }
            }

            if (sectionName === 'structure') {
                setupDragAndDrop();
            }
            if (sectionName === 'design') {
                setupDesignHighlightListeners();
            }
        } else {
            console.error(`No se encontró un renderer para la sección: "${sectionName}"`);
            formWrapper.innerHTML = `<div class="form-section active"><h2 class="section-title">Error</h2><p>No se pudo cargar esta sección.</p></div>`;
        }
    };

    // Exponer setActiveSection para que los módulos puedan llamarlo
    CvApp.setActiveSection = setActiveSection;

    // --- DRAG & DROP LOGIC ---
    const setupDragAndDrop = () => {
        const list = document.getElementById('section-order-list');
        if (!list) return;

        let draggedItem = null;

        list.addEventListener('dragstart', e => {
            draggedItem = e.target;
            setTimeout(() => e.target.classList.add('dragging'), 0);
        });

        list.addEventListener('dragend', e => {
            draggedItem.classList.remove('dragging');
            draggedItem = null;
            const newOrder = [...list.querySelectorAll('.draggable-item')].map(item => item.dataset.sectionKey);
            state.cvData.sectionOrder = newOrder;
            CvApp.updateAndRender();
        });

        list.addEventListener('dragover', e => {
            e.preventDefault();
            const afterElement = [...list.querySelectorAll('.draggable-item:not(.dragging)')].reduce((closest, child) => {
                const box = child.getBoundingClientRect();
                const offset = e.clientY - box.top - box.height / 2;
                return (offset < 0 && offset > closest.offset) ? { offset: offset, element: child } : closest;
            }, { offset: Number.NEGATIVE_INFINITY }).element;

            if (afterElement == null) { list.appendChild(draggedItem); }
            else { list.insertBefore(draggedItem, afterElement); }
        });
    };

    // --- DESIGN HIGHLIGHT LISTENERS ---
    const setupDesignHighlightListeners = () => {
        const highlightableElements = formWrapper.querySelectorAll('[data-highlight-selector]');

        highlightableElements.forEach(element => {
            const selector = element.dataset.highlightSelector;
            if (!selector) return;

            element.addEventListener('mouseenter', () => {
                cvPreviewWrapper.querySelectorAll(selector).forEach(el => {
                    el.style.transition = 'outline 0.2s ease';
                    el.style.outline = '2px dashed var(--primary-accent)';
                });
            });
            element.addEventListener('mouseleave', () => {
                cvPreviewWrapper.querySelectorAll(selector).forEach(el => el.style.outline = 'none');
            });
        });
    };

    // --- DOWNLOAD HTML ---
    const downloadHtml = async () => {
        const cvData = state.cvData;
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

            const fullHtml = `<!DOCTYPE html>
<html lang="es" style="--primary-accent: ${themeColor};">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CV de ${CvApp.templateHelpers.getFullName(cvData.personalInfo)}</title>
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
            const firstName = cvData.personalInfo.firstName || 'CV';
            const lastName = cvData.personalInfo.lastName || 'Profesional';
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

    // --- SHARE ---
    const handleShareClick = async () => {
        const cvData = state.cvData;
        try {
            const dataToShare = JSON.parse(JSON.stringify(cvData));
            dataToShare.customHtml = cvPreviewWrapper.innerHTML;
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

    // --- THEME & FULLSCREEN ---
    const handleThemeToggle = () => {
        const currentTheme = document.body.dataset.editorTheme || 'light';
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        document.body.dataset.editorTheme = newTheme;
        localStorage.setItem('cvProEditorTheme', newTheme);
    };

    const handleFullscreenToggle = () => {
        const isFullscreen = document.body.classList.toggle('fullscreen-preview');
        if (isFullscreen) {
            cvPreviewWrapper.setAttribute('contenteditable', 'true');
            CvApp.history.initFsHistory();
            setTimeout(CvApp.markAvatarClickable, 100);
        } else {
            cvPreviewWrapper.removeAttribute('contenteditable');
            CvApp.hideInlineToolbar();
            CvApp.hideAvatarPanel();
            CvApp.history.clearFsHistory();
        }
    };

    const applySavedTheme = () => {
        const savedTheme = localStorage.getItem('cvProEditorTheme');
        if (savedTheme) {
            document.body.dataset.editorTheme = savedTheme;
        }
    };

    // --- RESET ---
    const resetCvData = () => {
        CvApp.showModal("Confirmar Limpieza", "¿Estás seguro de que quieres limpiar todo el formulario? Se perderán todos los cambios y se volverá a los datos de ejemplo.", "confirm", (confirmed) => {
            if (confirmed) {
                state.replaceCvData(JSON.parse(JSON.stringify(state.defaultCvData)));

                document.querySelectorAll('.form-section input.invalid, .form-section textarea.invalid').forEach(el => {
                    el.classList.remove('invalid');
                });

                CvApp.saveState();
                setActiveSection('welcome');
                CvApp.resetHistory();
                renderCVPreview();
            }
        });
    };

    // --- FORM EVENT HANDLERS ---
    const handleFormInput = (e) => {
        const { target } = e;
        const cvData = state.cvData;
        const section = target.closest('.form-section')?.dataset.section;
        if (!section) return;

        const inputHandlers = {
            personal: () => { cvData.personalInfo[target.name] = target.value; },
            experience: () => handleDynamicListInput(target, 'experience'),
            education: () => handleDynamicListInput(target, 'education'),
            impacts: () => handleDynamicListInput(target, 'impacts'),
            portfolio: () => handleDynamicListInput(target, 'portfolio'),
            avatar: () => {
                const handler = {
                    'initials-input': () => cvData.avatar = { type: 'initials', value: target.value.toUpperCase() },
                    'image-url-input': () => cvData.avatar = { type: 'url', value: target.value },
                    'svg-code-input': () => cvData.avatar = { type: 'svg', value: target.value },
                    'quote-input': () => cvData.avatar = { type: 'quote', value: target.value },
                    'qr-url-input': () => cvData.avatar = { type: 'qr', value: target.value },
                }[target.id];
                handler?.();
            },
            design: () => {
                if (target.id === 'custom-color-picker') cvData.themeColor = target.value;
                else if (target.dataset.colorType) {
                    cvData[target.dataset.colorType] = target.value;
                    setActiveSection('design');
                } else if (target.dataset.bgInputTarget) {
                    const targetType = target.dataset.bgInputTarget;
                    cvData[`background${targetType.charAt(0).toUpperCase() + targetType.slice(1)}`] = target.value;
                }
            }
        };

        (inputHandlers[section] || inputHandlers[target.id])?.();
        CvApp.updateAndRender();
    };

    const handleDynamicListInput = (target, section) => {
        const cvData = state.cvData;
        const itemEl = target.closest('.item');
        if (!itemEl) return;
        const itemId = itemEl.dataset.id;
        const itemIndex = cvData[section].findIndex(i => i.id == itemId);
        if (itemIndex === -1) return;

        const item = cvData[section][itemIndex];
        if (item) {
            item[target.name] = target.type === 'checkbox' ? target.checked : target.value;
            if (target.name === 'current') {
                const endDateInput = itemEl.querySelector('input[name="endDate"]');
                if (endDateInput) {
                    endDateInput.disabled = target.checked;
                    if (target.checked) {
                        endDateInput.classList.remove('invalid');
                        const validationMessageEl = itemEl.querySelector('[data-validation-for="dateRange"]');
                        if (validationMessageEl) {
                            validationMessageEl.textContent = '';
                        }
                    }
                }
                if (target.checked) item.endDate = '';
            } else if (target.name === 'startDate' || target.name === 'endDate') {
                CvApp.validateDateRange(itemEl);
            }
            if (section === 'portfolio') {
                if (target.name === 'img') {
                    const previewImg = itemEl.querySelector('.portfolio-preview');
                    previewImg.src = target.value || 'https://via.placeholder.com/100x75/e9ecef/6c757d?text=Vista';
                }
                if (target.name === 'title') {
                    itemEl.querySelector('.item-header h4').textContent = target.value || 'Nuevo Proyecto';
                }
            }
        }
    };

    const handleFormClick = (e) => {
        const cvData = state.cvData;
        const colorPalettes = state.colorPalettes;
        const loadedIcons = state.loadedIcons;
        const button = e.target.closest('button, .avatar-tab, .icon-option, .layout-card, .color-dot, .gradient-swatch, .gradient-tab, .design-tab, .palette-swatch, .background-target-selector');
        if (!button) return;

        const section = button.dataset.section || button.closest('.form-section')?.dataset.section;
        const action = getActionFromElement(button);

        const actionHandlers = {
            switchAvatarTab: (btn) => {
                const parent = btn.closest('.form-section');
                if (!parent) return;
                cvData.avatar.type = btn.dataset.type;
                parent.querySelectorAll('.avatar-tab').forEach(tab => tab.classList.remove('active'));
                btn.classList.add('active');
                parent.querySelectorAll('.avatar-content').forEach(content => content.classList.toggle('active', content.dataset.content === btn.dataset.type));
            },
            add: () => handleAddItem(section),
            delete: () => { cvData[section] = cvData[section].filter(i => i.id != button.dataset.id); },
            switchTab: () => {
                cvData.avatar.type = button.dataset.type;
                if (button.dataset.type === 'icon' && loadedIcons.length > 0) {
                    cvData.avatar.value = loadedIcons[0];
                }
            },
            selectIcon: () => { cvData.avatar = { type: 'icon', value: button.dataset.iconPath }; },
            removePhoto: () => { cvData.avatar = { type: 'photo', value: '' }; },
            selectLayout: (btn) => {
                cvData.layout = btn.dataset.layout;
                const selector = btn.closest('.layout-selector');
                if (selector) {
                    selector.querySelectorAll('.layout-card').forEach(card => {
                        card.classList.toggle('active', card === btn);
                    });
                }
            },
            selectColor: () => { cvData.themeColor = button.dataset.colorValue; },
            selectPalette: () => {
                const palette = colorPalettes[button.dataset.paletteIndex];
                cvData.themeColor = palette.accent;
                cvData.textColorDark = palette.dark;
                cvData.textColorLight = palette.light;
                cvData.textColorMuted = palette.muted;
                cvData.sectionTitleColor = palette.title || '';
            },
            resetColors: () => Object.assign(cvData, colorPalettes[0]),
            selectGradient: () => {
                const targetType = button.closest('.gradient-content-wrapper').dataset.bgTypeTarget;
                const propertyName = `background${targetType.charAt(0).toUpperCase() + targetType.slice(1)}`;
                cvData[propertyName] = button.dataset.gradientValue;
            },
            switchBgTarget: () => {
                const targetType = button.dataset.bgTarget;
                const parent = button.closest('.design-content');
                parent.querySelectorAll('.background-target-selector').forEach(s => s.classList.remove('active'));
                button.classList.add('active');
                parent.querySelectorAll('.gradient-content-wrapper').forEach(w => w.style.display = w.dataset.bgTypeTarget === targetType ? 'block' : 'none');
            },
            switchGradientTab: () => switchTab(button, '.gradient-tab', '.gradient-content'),
            switchDesignTab: () => switchTab(button, '.design-tab', '.design-content'),
        };

        if (actionHandlers[action]) {
            actionHandlers[action](button);

            const isUiOnlyAction = action.toLowerCase().includes('tab') || action === 'switchBgTarget';

            if (section && !isUiOnlyAction) {
                if ((section === 'design' && action !== 'selectLayout') || action === 'delete') {
                    setActiveSection(section);
                }
            }

            if (!isUiOnlyAction) CvApp.updateAndRender(true);
        }
    };

    const getActionFromElement = (el) => {
        if (el.dataset.action) return el.dataset.action;
        const classMap = { 'avatar-tab': 'switchAvatarTab', 'icon-option': 'selectIcon', 'layout-card': 'selectLayout', 'color-dot': 'selectColor', 'gradient-swatch': 'selectGradient', 'gradient-tab': 'switchGradientTab', 'design-tab': 'switchDesignTab', 'palette-swatch': 'selectPalette', 'background-target-selector': 'switchBgTarget' };
        for (const className in classMap) {
            if (el.classList.contains(className)) return classMap[className];
        }
        if (el.id === 'reset-colors-btn') return 'resetColors';
        if (el.id === 'remove-photo-btn') return 'removePhoto';
        return null;
    };

    const handleAddItem = (section) => {
        const cvData = state.cvData;
        if (section === 'footer') {
            const typeInput = document.getElementById('footer-item-type');
            const labelInput = document.getElementById('footer-item-label');
            const valueInput = document.getElementById('footer-item-value');
            if (valueInput.value.trim()) {
                cvData.footer.push({ id: Date.now(), type: typeInput.value, label: labelInput.value.trim(), value: valueInput.value.trim() });
                labelInput.value = ''; valueInput.value = '';
            }
            return;
        }
        const newItem = {
            impacts: { id: Date.now(), description: '' },
            portfolio: { id: Date.now(), title: 'Nuevo Proyecto', img: '' },
            experience: { id: Date.now(), description: '' },
            education: { id: Date.now(), description: '' },
        }[section] || { id: Date.now() };

        if (cvData[section]) cvData[section].push(newItem);
    };

    const switchTab = (tabElement, tabSelector, contentSelector) => {
        const parent = tabElement.closest('.form-section, .design-content, .gradient-content-wrapper');
        if (!parent) return;

        const tabName = tabElement.dataset.tab;

        parent.querySelectorAll(tabSelector).forEach(tab => {
            tab.classList.remove('active');
        });
        tabElement.classList.add('active');

        parent.querySelectorAll(contentSelector).forEach(content => content.classList.remove('active'));
        parent.querySelector(`${contentSelector}[data-content="${tabName}"]`)?.classList.add('active');
    };

    // --- INITIALIZATION ---
    async function postInitLoading() {
        applySavedTheme();

        // 1. Carga crítica que bloquea la interfaz (las plantillas)
        await CvApp.loadTemplates();

        // 2. Construimos los form renderers DESPUÉS de cargar las plantillas
        formRenderers = CvApp.buildFormRenderers(renderForm);

        // 3. Renderiza la interfaz inicial
        const lastSection = localStorage.getItem('cvProLastSection');
        if (!document.body.classList.contains('read-only-mode')) {
            setActiveSection(lastSection || 'welcome');
            const activeBgTarget = document.querySelector('.background-target-selector.active')?.dataset.bgTarget || 'main';
            document.querySelectorAll('.gradient-content-wrapper').forEach(w => {
                w.style.display = w.dataset.bgTypeTarget === activeBgTarget ? 'block' : 'none';
            });

            document.querySelectorAll('.form-section.active input, .form-section.active textarea').forEach(input => {
                CvApp.validateInput(input);
            });
            document.querySelectorAll('.form-section.active .item').forEach(itemEl => {
                CvApp.validateDateRange(itemEl);
            });
        }
        renderCVPreview();
        CvApp.initBaseline();

        // 4. Carga diferida de recursos menos urgentes
        Promise.all([
            CvApp.loadGradientPresets(),
            CvApp.loadIcons()
        ]).then(() => {
            renderCVPreview();
            const currentSection = localStorage.getItem('cvProLastSection');
            if (currentSection === 'design' || currentSection === 'avatar') {
                setActiveSection(currentSection);
            }
        });
    }

    async function init() {
        const urlParams = new URLSearchParams(window.location.search);
        let sharedData = urlParams.get('data');
        
        if (!sharedData && window.location.hash && window.location.hash.startsWith('#cv=')) {
            sharedData = window.location.hash.substring(4);
        }

        if (sharedData) {
            const loadingScreen = document.getElementById('loading-screen');
            if (loadingScreen) loadingScreen.style.display = 'flex';

            setTimeout(async () => {
                try {
                    let jsonString = null;
                    
                    if (typeof LZString !== 'undefined') {
                        jsonString = LZString.decompressFromEncodedURIComponent(sharedData);
                    }
                    
                    if (!jsonString) {
                        jsonString = atob(decodeURIComponent(sharedData));
                    }

                    const parsedData = JSON.parse(jsonString);
                    Object.assign(state.cvData, parsedData);

                    document.body.classList.add('read-only-mode');
                } catch (error) {
                    console.error("Error al decodificar los datos compartidos:", error);
                    CvApp.showToast("El enlace parece estar dañado. Cargando la versión por defecto.", "error");
                    CvApp.loadState(); 
                }
                
                await postInitLoading();
                if (loadingScreen) loadingScreen.style.display = 'none';
            }, 100);
            
        } else {
            CvApp.loadState();
            await postInitLoading();
        }

        // --- EVENT LISTENERS ---
        const handleDownloadPdf = () => {
            const originalTitle = document.title;
            const firstName = state.cvData.personalInfo.firstName || 'CV';
            const lastName = state.cvData.personalInfo.lastName || 'Profesional';
            const newTitle = `CV_${firstName.replace(/ /g, '_')}_${lastName.replace(/ /g, '_')}`;
            document.title = newTitle;
            window.print();
            setTimeout(() => { document.title = originalTitle; }, 500);
        };

        downloadPdfBtn.addEventListener('click', handleDownloadPdf);
        downloadHtmlBtn.addEventListener('click', downloadHtml);
        if (downloadTypstBtn) {
            downloadTypstBtn.addEventListener('click', () => {
                if (typeof TypstCompiler !== 'undefined') {
                    TypstCompiler.downloadTypstFile(state.cvData, state.cvData.layout);
                    CvApp.showToast('¡Plantilla Typst (.typ) exportada con éxito!', 'success');
                }
            });
        }
        shareCvBtn.addEventListener('click', handleShareClick);
        themeToggleBtn.addEventListener('click', handleThemeToggle);
        toggleFullscreenBtn.addEventListener('click', handleFullscreenToggle);
        resetCvBtn.addEventListener('click', resetCvData);

        // --- Historial: botones y teclado ---
        if (undoBtn) {
            undoBtn.addEventListener('click', CvApp.applyUndo);
            undoBtn.addEventListener('mousedown', (e) => e.preventDefault());
        }
        if (redoBtn) {
            redoBtn.addEventListener('click', CvApp.applyRedo);
            redoBtn.addEventListener('mousedown', (e) => e.preventDefault());
        }
        document.addEventListener('keydown', (e) => {
            if (!(e.ctrlKey || e.metaKey)) return;
            const inFs = document.body.classList.contains('fullscreen-preview');
            const isInlineEditing = inFs && cvPreviewWrapper.contains(document.activeElement);
            if (isInlineEditing) return;

            if (!e.shiftKey && e.key === 'z') {
                const canUndo = inFs
                    ? (CvApp.history.fsHistoryStack.length > 0 || CvApp.history.historyStack.length > 0)
                    : CvApp.history.historyStack.length > 0;
                if (canUndo) {
                    e.preventDefault();
                    CvApp.applyUndo();
                }
            } else if (e.key === 'y' || (e.shiftKey && e.key === 'z')) {
                const canRedo = inFs
                    ? (CvApp.history.fsRedoStack.length > 0)
                    : false;
                if (canRedo) {
                    e.preventDefault();
                    CvApp.applyRedo();
                }
            }
        });
        CvApp.updateHistoryBtns();

        // About modal
        aboutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            aboutModal.classList.add('show');
            aboutAudio.play().catch(err => console.log("Audio play blocked:", err));
        });
        modalCloseBtn.addEventListener('click', () => {
            aboutModal.classList.remove('show');
            aboutAudio.pause();
            aboutAudio.currentTime = 0;
        });
        aboutModal.addEventListener('click', (e) => {
            if (e.target === aboutModal) {
                aboutModal.classList.remove('show');
                aboutAudio.pause();
                aboutAudio.currentTime = 0;
            }
        });

        // Nav
        document.querySelectorAll('.editor-nav .nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                setActiveSection(item.getAttribute('href').substring(1));
            });
        });

        // Inline editor & avatar panel
        CvApp.setupInlineEditorListeners();
        CvApp.setupAvatarEditorPanel();

        // Form events
        formWrapper.addEventListener('input', (e) => {
            handleFormInput(e);
            if (e.target.name !== 'startDate' && e.target.name !== 'endDate') {
                CvApp.validateInput(e.target);
            }
        });
        formWrapper.addEventListener('click', handleFormClick);

        formWrapper.addEventListener('submit', (e) => {
            if (e.target.id === 'skills-form') {
                e.preventDefault();
                const nameInput = e.target.querySelector('#skillName');
                const level = e.target.querySelector('#skillLevel').value;
                if (nameInput.value.trim()) {
                    state.cvData.skills.push({ id: Date.now(), name: nameInput.value.trim(), level });
                    CvApp.updateAndRender(true);
                    setActiveSection('skills');
                }
            }
        });

        formWrapper.addEventListener('change', async (e) => {
            if (e.target.id === 'photo-input' && e.target.files[0]) {
                const base64 = await CvApp.resizeImageAndGetBase64(e.target.files[0], 250);
                state.cvData.avatar = { type: 'photo', value: base64 };
                CvApp.updateAndRender(true);
                setActiveSection('avatar');
            }
        });

        // Preview navigation
        cvPreviewWrapper.addEventListener('click', CvApp.handlePreviewElementClick);
    }

    init();
});