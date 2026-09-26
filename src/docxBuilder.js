const docx = require('docx');
const { 
    Document, 
    Packer, 
    Paragraph, 
    TextRun, 
    Table, 
    TableRow, 
    TableCell, 
    WidthType, 
    AlignmentType, 
    BorderStyle, 
    ShadingType,
    HeightRule,
    TabStopType
} = docx;

// Constantes métricas para asegurar que las barras laterales y fondos llenen la página al 100%
const PAGE_SIZE_A4 = { width: 11906, height: 16838 };
const ZERO_MARGINS = { top: 0, bottom: 0, left: 0, right: 0 };
const FULL_PAGE_MIN_HEIGHT = 15500; // dxa para que el fondo o sidebar llegue al borde inferior sin desbordar
const SPLIT_BODY_MIN_HEIGHT = 13500; // dxa para cuerpos bajo banners superiores

function createTinyTrailingParagraph() {
    return new Paragraph({
        spacing: { before: 0, after: 0, line: 20 },
        children: [new TextRun({ text: '', size: 2 })]
    });
}

// --- DICCIONARIO DE PRESETS PARA TODAS LAS 42 PLANTILLAS ---
const TEMPLATE_PRESETS = {
    // 1. ESPECIALES CON DISEÑO ARTÍSTICO / ÚNICO
    'designer-portfolio': { archetype: 'designer-portfolio' },
    'modern-pro': { archetype: 'modern-pro' },
    'tech-lead': { archetype: 'tech-lead' },
    'executive-gold': { archetype: 'executive-gold' },
    'creative': { archetype: 'creative' },
    'bold': { archetype: 'bold' },
    'sleek-cv': { archetype: 'sleek-cv' },
    'startup-cv': { archetype: 'startup-cv' },
    'timeline-cv': { archetype: 'timeline-cv' },
    'chronological': { archetype: 'chronological' },
    'cards': { archetype: 'cards' },
    'headline': { archetype: 'headline' },
    'swiss': { archetype: 'swiss' },
    'two-tone': { archetype: 'two-tone' },
    'infographic': { archetype: 'infographic' },
    'impact': { archetype: 'impact' },
    'artisan': { archetype: 'artisan' },
    'columnist': { archetype: 'columnist' },
    'brilliant-cv': { archetype: 'brilliant-cv' },
    'portfolio': { archetype: 'portfolio' },
    'gallery': { archetype: 'gallery' },

    // 2. ARQUETIPO SIDEBAR VERTICAL (Barra lateral continua)
    'classic': { archetype: 'sidebar', sidebarWidth: 35, sidebarBg: 'theme', sidebarText: 'light', nameInSidebar: false, summaryInSidebar: false, skillsInSidebar: true, skillsStyle: 'list' },
    'gradient': { archetype: 'sidebar', sidebarWidth: 38, sidebarBg: 'theme', sidebarText: 'light', nameInSidebar: true, summaryInSidebar: false, skillsInSidebar: false, skillsStyle: 'bars' },
    'corporate': { archetype: 'sidebar', sidebarWidth: 30, sidebarBg: 'soft', sidebarText: 'dark', nameInSidebar: true, summaryInSidebar: false, skillsInSidebar: true, skillsStyle: 'list' },
    'neat-cv': { archetype: 'sidebar', sidebarWidth: 32, sidebarBg: 'soft', sidebarText: 'dark', nameInSidebar: true, summaryInSidebar: false, skillsInSidebar: true, skillsStyle: 'list' },
    'alta-cv': { archetype: 'sidebar', sidebarWidth: 33, sidebarBg: 'soft', sidebarText: 'dark', nameInSidebar: true, summaryInSidebar: false, skillsInSidebar: false, skillsStyle: 'bars' },
    'prestige': { archetype: 'sidebar', sidebarWidth: 35, sidebarBg: 'theme', sidebarText: 'light', nameInSidebar: false, summaryInSidebar: false, skillsInSidebar: true, skillsStyle: 'bars' },

    // 3. ARQUETIPO CABECERA SUPERIOR + 2 COLUMNAS (HEADER-SPLIT)
    'modern': { archetype: 'header-split', splitRatio: [68, 32], skillsInRightCol: true, skillsStyle: 'bars' },
    'compact': { archetype: 'header-split', splitRatio: [65, 35], skillsInRightCol: true, skillsStyle: 'bars' },

    // 4. ARQUETIPO MODO OSCURO (DARK-MODE)
    'minimalist-dark': { archetype: 'dark-mode', bg: '121212', text: 'E9ECEF', font: 'Segoe UI' },
    'midnight': { archetype: 'dark-mode', bg: '1A1A1A', text: 'F8F9FA', font: 'Segoe UI' },
    'visionary': { archetype: 'dark-mode', bg: '2D3748', text: 'F7FAFC', font: 'Segoe UI' },

    // 5. ARQUETIPOS ATS / EJECUTIVO / MONOSPACE / SERIF
    'executive': { archetype: 'single-column', font: 'Georgia', centered: true, divider: 'solid' },
    'minimalist': { archetype: 'single-column', font: 'Segoe UI', centered: false, divider: 'none' },
    'faang-resume': { archetype: 'ats-standard', font: 'Segoe UI', centered: true, divider: 'solid' },
    'rendercv': { archetype: 'ats-standard', font: 'Segoe UI', centered: true, divider: 'solid' },
    'basic-resume': { archetype: 'ats-standard', font: 'Segoe UI', centered: true, divider: 'solid' },
    'academic': { archetype: 'academic', font: 'Times New Roman' },
    'chic-cv': { archetype: 'chic-cv', font: 'Georgia' },
    'technical': { archetype: 'technical', font: 'Consolas' },
    'monochrome': { archetype: 'monochrome', font: 'Segoe UI' },
    'elegant': { archetype: 'elegant', font: 'Georgia' }
};

// --- HELPERS DE COLOR Y FECHAS ---
const cleanColor = (c, fallback = '008751') => {
    if (!c) return fallback;
    const str = String(c).trim().replace(/^#/, '');
    return /^[0-9A-Fa-f]{6}$/i.test(str) ? str.toUpperCase() : fallback;
};

const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const parts = String(dateStr).split('-');
    if (parts.length === 2) {
        const year = parts[0];
        const m = parseInt(parts[1], 10);
        if (!isNaN(m) && m >= 1 && m <= 12) {
            return `${months[m - 1]} ${year}`;
        }
    }
    return dateStr;
};

const formatRange = (start, end, current) => {
    const s = formatDate(start);
    const e = current ? 'Presente' : formatDate(end);
    if (!s && !e) return '';
    if (!s) return e;
    if (!e) return s;
    return `${s} - ${e}`;
};

// --- COMPONENTES VISUALES COMPARTIDOS ---
function createSectionTitle(titleText, colorHex, font = 'Segoe UI', borderStyle = BorderStyle.SINGLE, borderSize = 16) {
    return new Paragraph({
        spacing: { before: 240, after: 120 },
        border: {
            bottom: {
                color: colorHex,
                size: borderSize,
                style: borderStyle,
                space: 5
            }
        },
        children: [
            new TextRun({
                text: titleText.toUpperCase(),
                bold: true,
                color: colorHex,
                size: 20,
                font: font
            })
        ]
    });
}

function createAvatarBadge(initials, borderColor = 'FFFFFF', textColor = 'FFFFFF', font = 'Segoe UI', bgColor = null) {
    const shading = bgColor ? { fill: bgColor, type: ShadingType.CLEAR } : undefined;
    return [
        new Paragraph({ spacing: { before: 60, after: 80 } }),
        new Table({
            alignment: AlignmentType.CENTER,
            width: { size: 1400, type: WidthType.DXA },
            borders: {
                top: { style: BorderStyle.SINGLE, size: 24, color: borderColor },
                bottom: { style: BorderStyle.SINGLE, size: 24, color: borderColor },
                left: { style: BorderStyle.SINGLE, size: 24, color: borderColor },
                right: { style: BorderStyle.SINGLE, size: 24, color: borderColor },
                insideHorizontal: { style: BorderStyle.NONE },
                insideVertical: { style: BorderStyle.NONE }
            },
            rows: [
                new TableRow({
                    children: [
                        new TableCell({
                            shading: shading,
                            margins: { top: 160, bottom: 160, left: 100, right: 100 },
                            children: [
                                new Paragraph({
                                    alignment: AlignmentType.CENTER,
                                    children: [
                                        new TextRun({ text: initials || 'CV', bold: true, color: textColor, size: 36, font: font })
                                    ]
                                })
                            ]
                        })
                    ]
                })
            ]
        }),
        new Paragraph({ spacing: { before: 40, after: 80 } })
    ];
}

// Genera un item de Experiencia con Cargo a la izquierda y Fecha alineada a la derecha
function createExperienceItems(experience, themeColor, textColorDark, textColorMuted, font = 'Segoe UI') {
    const items = [];
    if (!Array.isArray(experience)) return items;

    experience.forEach(e => {
        const dateStr = formatRange(e.startDate, e.endDate, e.current);

        // Párrafo con Tab Stop para alinear el Cargo a la izquierda y la Fecha a la derecha sin tablas anidadas
        items.push(new Paragraph({
            spacing: { before: 80, after: 20 },
            tabStops: [{ type: TabStopType.RIGHT, position: 7000 }],
            children: [
                new TextRun({ text: e.position || '', bold: true, color: textColorDark, size: 19, font: font }),
                ...(dateStr ? [
                    new TextRun({ text: '\t' }),
                    new TextRun({ text: dateStr, color: textColorMuted, size: 15, font: font })
                ] : [])
            ]
        }));

        // Empresa en cursiva
        if (e.company) {
            items.push(new Paragraph({
                spacing: { before: 0, after: 35 },
                children: [
                    new TextRun({ text: e.company, italics: true, color: textColorDark, size: 17, font: font })
                ]
            }));
        }

        // Descripción con viñetas elegantes
        if (e.description) {
            const lines = String(e.description).split('\n').map(l => l.trim()).filter(Boolean);
            lines.forEach(line => {
                const isBullet = line.startsWith('-') || line.startsWith('•') || line.startsWith('*');
                const cleanLine = line.replace(/^[-•*]\s*/, '');
                items.push(new Paragraph({
                    spacing: { before: 15, after: 15 },
                    indent: isBullet ? { left: 240 } : undefined,
                    children: [
                        ...(isBullet ? [new TextRun({ text: '· ', color: '9CA3AF', bold: true, size: 16, font: font })] : []),
                        new TextRun({ text: cleanLine, color: textColorDark, size: 15.5, font: font })
                    ]
                }));
            });
            items.push(new Paragraph({ spacing: { before: 0, after: 50 } }));
        }
    });
    return items;
}

// Genera un item de Educación con Título a la izquierda y Fecha alineada a la derecha
function createEducationItems(education, themeColor, textColorDark, textColorMuted, font = 'Segoe UI') {
    const items = [];
    if (!Array.isArray(education)) return items;

    education.forEach(e => {
        const dateStr = formatRange(e.startDate, e.endDate, e.current);

        // Párrafo con Tab Stop para alinear Título a la izquierda y Fecha a la derecha sin tablas anidadas
        items.push(new Paragraph({
            spacing: { before: 80, after: 20 },
            tabStops: [{ type: TabStopType.RIGHT, position: 7000 }],
            children: [
                new TextRun({ text: e.degree || '', bold: true, color: textColorDark, size: 19, font: font }),
                ...(dateStr ? [
                    new TextRun({ text: '\t' }),
                    new TextRun({ text: dateStr, color: textColorMuted, size: 15, font: font })
                ] : [])
            ]
        }));

        if (e.institution) {
            items.push(new Paragraph({
                spacing: { before: 0, after: 35 },
                children: [
                    new TextRun({ text: e.institution, italics: true, color: textColorDark, size: 17, font: font })
                ]
            }));
        }

        if (e.description) {
            items.push(new Paragraph({
                spacing: { before: 0, after: 50 },
                children: [
                    new TextRun({ text: e.description, color: textColorDark, size: 15.5, font: font })
                ]
            }));
        }
    });
    return items;
}

// Genera timeline vertical con línea continua y nodo con viñeta
function createTimelineItems(itemsList, isExp, themeColor, textColorDark, textColorMuted, font = 'Segoe UI') {
    const docNodes = [];
    if (!Array.isArray(itemsList) || itemsList.length === 0) return docNodes;

    itemsList.forEach((item, idx) => {
        const titleText = isExp ? (item.position || '') : (item.degree || '');
        const subText = isExp ? (item.company || '') : (item.institution || '');
        const dateStr = formatRange(item.startDate, item.endDate, item.current);

        const contentChildren = [];
        contentChildren.push(new Paragraph({
            spacing: { before: 40, after: 20 },
            children: [
                new TextRun({ text: titleText, bold: true, color: textColorDark, size: 19, font: font }),
                new TextRun({ text: `  •  ${dateStr}`, color: textColorMuted, size: 15, font: font })
            ]
        }));

        if (subText) {
            contentChildren.push(new Paragraph({
                spacing: { before: 0, after: 30 },
                children: [
                    new TextRun({ text: subText, italics: true, color: themeColor, bold: true, size: 16, font: font })
                ]
            }));
        }

        if (item.description) {
            const lines = String(item.description).split('\n').map(l => l.trim()).filter(Boolean);
            lines.forEach(l => {
                const clean = l.replace(/^[-•*]\s*/, '');
                contentChildren.push(new Paragraph({
                    spacing: { before: 10, after: 10 },
                    indent: { left: 160 },
                    children: [
                        new TextRun({ text: '· ', color: themeColor, bold: true, size: 16, font: font }),
                        new TextRun({ text: clean, color: textColorDark, size: 15, font: font })
                    ]
                }));
            });
        }

        docNodes.push(new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: {
                top: { style: BorderStyle.NONE },
                bottom: { style: BorderStyle.NONE },
                left: { style: BorderStyle.NONE },
                right: { style: BorderStyle.NONE },
                insideHorizontal: { style: BorderStyle.NONE },
                insideVertical: { style: BorderStyle.NONE }
            },
            rows: [
                new TableRow({
                    children: [
                        new TableCell({
                            width: { size: 6, type: WidthType.PERCENTAGE },
                            borders: {
                                right: { style: BorderStyle.SINGLE, size: 20, color: themeColor },
                                top: { style: BorderStyle.NONE },
                                bottom: { style: BorderStyle.NONE },
                                left: { style: BorderStyle.NONE }
                            },
                            children: [
                                new Paragraph({
                                    alignment: AlignmentType.CENTER,
                                    spacing: { before: 40, after: 0 },
                                    children: [
                                        new TextRun({ text: '●', color: themeColor, size: 24, font: font })
                                    ]
                                })
                            ]
                        }),
                        new TableCell({
                            width: { size: 94, type: WidthType.PERCENTAGE },
                            margins: { left: 240, top: 0, bottom: 120, right: 100 },
                            children: contentChildren
                        })
                    ]
                })
            ]
        }));
    });

    return docNodes;
}

function createSkillsElements(skills, style = 'bars', themeColor, textColor, inSidebar = false, font = 'Segoe UI') {
    const elements = [];
    if (!Array.isArray(skills) || skills.length === 0) return elements;

    const levelLabels = {
        beginner: 'Principiante',
        intermediate: 'Intermedio',
        advanced: 'Avanzado',
        expert: 'Experto'
    };

    const levelPercents = {
        beginner: 35,
        intermediate: 60,
        advanced: 85,
        expert: 98
    };

    if (style === 'bars') {
        skills.forEach(s => {
            const pct = levelPercents[s.level] || 70;
            const barFill = inSidebar ? 'FFFFFF' : themeColor;
            const barTrack = inSidebar ? themeColor : 'E5E7EB';

            elements.push(new Paragraph({
                spacing: { before: 90, after: 30 },
                children: [
                    new TextRun({ text: s.name, bold: true, color: textColor, size: 17, font: font })
                ]
            }));

            elements.push(new Table({
                width: { size: inSidebar ? 100 : 75, type: WidthType.PERCENTAGE },
                borders: {
                    top: { style: BorderStyle.NONE },
                    bottom: { style: BorderStyle.NONE },
                    left: { style: BorderStyle.NONE },
                    right: { style: BorderStyle.NONE },
                    insideHorizontal: { style: BorderStyle.NONE },
                    insideVertical: { style: BorderStyle.NONE }
                },
                rows: [
                    new TableRow({
                        height: { value: 50 },
                        children: [
                            new TableCell({
                                width: { size: pct, type: WidthType.PERCENTAGE },
                                shading: { fill: barFill, type: ShadingType.CLEAR },
                                children: [new Paragraph({ spacing: { before: 0, after: 0 } })]
                            }),
                            new TableCell({
                                width: { size: 100 - pct, type: WidthType.PERCENTAGE },
                                shading: { fill: barTrack, type: ShadingType.CLEAR },
                                children: [new Paragraph({ spacing: { before: 0, after: 0 } })]
                            })
                        ]
                    })
                ]
            }));
        });
    } else {
        skills.forEach(s => {
            elements.push(new Paragraph({
                spacing: { before: 30, after: 30 },
                children: [
                    new TextRun({ text: s.name, bold: true, color: textColor, size: 16.5, font: font }),
                    new TextRun({ text: ` (${levelLabels[s.level] || s.level || 'Intermedio'})`, color: inSidebar ? 'E0E0E0' : '6B7280', size: 14.5, font: font })
                ]
            }));
        });
    }
    return elements;
}

// Tarjetas Callout para "Impacto Clave" utilizando párrafos nativos con borde izquierdo y sombreado
function createImpactsElements(impacts, themeColor, textColorDark, font = 'Segoe UI') {
    const elements = [];
    if (!Array.isArray(impacts) || impacts.length === 0) return elements;

    impacts.forEach(imp => {
        if (!imp.description) return;

        elements.push(new Paragraph({
            spacing: { before: 60, after: 60 },
            border: { left: { color: themeColor, size: 28, style: BorderStyle.SINGLE, space: 12 } },
            shading: { fill: 'F4F4F5', type: ShadingType.CLEAR },
            indent: { left: 160, right: 160 },
            children: [
                new TextRun({ text: imp.description, color: textColorDark, size: 16, font: font })
            ]
        }));
    });
    return elements;
}

function createContactBlock(p, textColor, borderColor, font = 'Segoe UI') {
    const items = [];
    items.push(new Paragraph({
        spacing: { before: 160, after: 80 },
        border: { bottom: { color: borderColor, size: 10, style: BorderStyle.SINGLE, space: 4 } },
        children: [
            new TextRun({ text: 'CONTACTO', bold: true, color: textColor, size: 18, font: font })
        ]
    }));

    if (p.phone) {
        items.push(new Paragraph({
            spacing: { before: 30, after: 30 },
            children: [
                new TextRun({ text: 'Tel: ', bold: true, color: textColor, size: 16, font: font }),
                new TextRun({ text: p.phone, color: textColor, size: 16, font: font })
            ]
        }));
    }
    if (p.email) {
        items.push(new Paragraph({
            spacing: { before: 30, after: 30 },
            children: [
                new TextRun({ text: 'Email: ', bold: true, color: textColor, size: 16, font: font }),
                new TextRun({ text: p.email, color: textColor, size: 16, font: font })
            ]
        }));
    }
    if (p.address) {
        items.push(new Paragraph({
            spacing: { before: 30, after: 30 },
            children: [
                new TextRun({ text: 'Ubicación: ', bold: true, color: textColor, size: 16, font: font }),
                new TextRun({ text: p.address, color: textColor, size: 16, font: font })
            ]
        }));
    }
    if (p.website) {
        items.push(new Paragraph({
            spacing: { before: 30, after: 30 },
            children: [
                new TextRun({ text: 'Web: ', bold: true, color: textColor, size: 16, font: font }),
                new TextRun({ text: p.website, color: textColor, size: 16, font: font })
            ]
        }));
    }
    return items;
}

// --- GENERADOR PRINCIPAL ---
function buildNativeDocx(cvData) {
    const layout = cvData.layout || cvData.template || 'classic';
    const preset = TEMPLATE_PRESETS[layout] || (
        layout.includes('dark') || layout.includes('midnight') ? { archetype: 'dark-mode', bg: '121212', text: 'E9ECEF' } :
        layout.includes('compact') || layout.includes('modern') ? { archetype: 'header-split', splitRatio: [68, 32] } :
        { archetype: 'sidebar', sidebarWidth: 35, sidebarBg: 'theme', sidebarText: 'light', nameInSidebar: false, summaryInSidebar: false, skillsInSidebar: true, skillsStyle: 'list' }
    );

    const p = cvData.personalInfo || {};
    const firstName = p.firstName || '';
    const lastName = p.lastName || '';
    const fullName = `${firstName} ${lastName}`.trim() || 'CV Profesional';
    const title = p.title || '';

    const themeColor = cleanColor(cvData.themeColor, '008751');
    const sectionTitleColor = cleanColor(cvData.sectionTitleColor, themeColor);
    const textColorDark = cleanColor(cvData.textColorDark, '1F2937');
    const textColorMuted = cleanColor(cvData.textColorMuted, '6B7280');
    const font = preset.font || 'Segoe UI';

    const avatar = cvData.avatar || {};
    let initials = (avatar.type === 'initials' && avatar.value) ? avatar.value : '';
    if (!initials) {
        initials = `${firstName[0] || ''}${lastName[0] || ''}`.toUpperCase() || 'CV';
    }

    // ==========================================
    // 1. ESPECIAL: DESIGNER-PORTFOLIO
    // ==========================================
    if (preset.archetype === 'designer-portfolio') {
        const cardElements = [];

        const headerTable = new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: {
                top: { style: BorderStyle.NONE },
                left: { style: BorderStyle.NONE },
                right: { style: BorderStyle.NONE },
                bottom: { style: BorderStyle.DASHED, size: 16, color: themeColor },
                insideHorizontal: { style: BorderStyle.NONE },
                insideVertical: { style: BorderStyle.NONE }
            },
            rows: [
                new TableRow({
                    children: [
                        new TableCell({
                            width: { size: 20, type: WidthType.PERCENTAGE },
                            children: createAvatarBadge(initials, 'FFFFFF', 'FFFFFF', font, themeColor)
                        }),
                        new TableCell({
                            width: { size: 80, type: WidthType.PERCENTAGE },
                            margins: { left: 250, top: 80, bottom: 80 },
                            children: [
                                new Paragraph({
                                    spacing: { before: 40, after: 30 },
                                    children: [new TextRun({ text: fullName, bold: true, color: textColorDark, size: 36, font: font })]
                                }),
                                new Paragraph({
                                    spacing: { before: 0, after: 40 },
                                    children: [new TextRun({ text: title, color: themeColor, bold: true, size: 20, font: font })]
                                })
                            ]
                        })
                    ]
                })
            ]
        });

        cardElements.push(headerTable);

        if (p.summary) {
            cardElements.push(createSectionTitle('Resumen', sectionTitleColor, font));
            cardElements.push(new Paragraph({
                spacing: { before: 40, after: 120 },
                children: [new TextRun({ text: p.summary, color: textColorDark, size: 16.5, font: font })]
            }));
        }

        if (Array.isArray(cvData.experience) && cvData.experience.length > 0) {
            cardElements.push(createSectionTitle('Experiencia', sectionTitleColor, font));
            cardElements.push(...createExperienceItems(cvData.experience, themeColor, textColorDark, textColorMuted, font));
        }

        if (Array.isArray(cvData.education) && cvData.education.length > 0) {
            cardElements.push(createSectionTitle('Educación', sectionTitleColor, font));
            cardElements.push(...createEducationItems(cvData.education, themeColor, textColorDark, textColorMuted, font));
        }

        if (Array.isArray(cvData.skills) && cvData.skills.length > 0) {
            cardElements.push(createSectionTitle('Habilidades', sectionTitleColor, font));
            cardElements.push(...createSkillsElements(cvData.skills, 'list', themeColor, textColorDark, false, font));
        }

        if (Array.isArray(cvData.impacts) && cvData.impacts.length > 0) {
            cardElements.push(createSectionTitle('Impacto Clave', sectionTitleColor, font));
            cardElements.push(...createImpactsElements(cvData.impacts, themeColor, textColorDark, font));
        }

        const topBand = new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: {
                top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE }, insideHorizontal: { style: BorderStyle.NONE }, insideVertical: { style: BorderStyle.NONE }
            },
            rows: [
                new TableRow({
                    height: { value: 700 },
                    children: [
                        new TableCell({
                            width: { size: 100, type: WidthType.PERCENTAGE },
                            shading: { fill: themeColor, type: ShadingType.CLEAR },
                            children: [new Paragraph({ spacing: { before: 0, after: 0 } })]
                        })
                    ]
                })
            ]
        });

        const elevatedCardTable = new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: {
                top: { style: BorderStyle.SINGLE, size: 6, color: 'E5E7EB' }, bottom: { style: BorderStyle.SINGLE, size: 6, color: 'E5E7EB' }, left: { style: BorderStyle.SINGLE, size: 6, color: 'E5E7EB' }, right: { style: BorderStyle.SINGLE, size: 6, color: 'E5E7EB' }, insideHorizontal: { style: BorderStyle.NONE }, insideVertical: { style: BorderStyle.NONE }
            },
            rows: [
                new TableRow({
                    height: { value: 14500, rule: HeightRule.ATLEAST },
                    children: [
                        new TableCell({
                            width: { size: 100, type: WidthType.PERCENTAGE },
                            shading: { fill: 'FFFFFF', type: ShadingType.CLEAR },
                            margins: { top: 400, bottom: 500, left: 550, right: 550 },
                            children: cardElements
                        })
                    ]
                })
            ]
        });

        return new Document({
            sections: [{
                properties: { page: { size: PAGE_SIZE_A4, margin: { top: 0, bottom: 0, left: 300, right: 300 } } },
                children: [topBand, new Paragraph({ spacing: { before: 60, after: 60 } }), elevatedCardTable, createTinyTrailingParagraph()]
            }]
        });
    }

    // ==========================================
    // 2. ESPECIAL: MODERN-PRO
    // ==========================================
    if (preset.archetype === 'modern-pro') {
        const bannerTable = new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: {
                top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE }, insideHorizontal: { style: BorderStyle.NONE }, insideVertical: { style: BorderStyle.NONE }
            },
            rows: [
                new TableRow({
                    children: [
                        new TableCell({
                            width: { size: 65, type: WidthType.PERCENTAGE },
                            shading: { fill: themeColor, type: ShadingType.CLEAR },
                            margins: { top: 450, bottom: 450, left: 550, right: 200 },
                            children: [
                                new Paragraph({
                                    spacing: { before: 0, after: 30 },
                                    children: [new TextRun({ text: fullName, bold: true, color: 'FFFFFF', size: 36, font: font })]
                                }),
                                new Paragraph({
                                    spacing: { before: 0, after: 0 },
                                    children: [new TextRun({ text: title, color: 'E5E7EB', size: 20, font: font })]
                                })
                            ]
                        }),
                        new TableCell({
                            width: { size: 35, type: WidthType.PERCENTAGE },
                            shading: { fill: themeColor, type: ShadingType.CLEAR },
                            margins: { top: 450, bottom: 450, left: 200, right: 550 },
                            children: [
                                new Paragraph({
                                    alignment: AlignmentType.RIGHT,
                                    spacing: { before: 0, after: 20 },
                                    children: [new TextRun({ text: p.email || '', color: 'FFFFFF', size: 15, font: font })]
                                }),
                                new Paragraph({
                                    alignment: AlignmentType.RIGHT,
                                    spacing: { before: 0, after: 0 },
                                    children: [new TextRun({ text: p.phone || '', color: 'FFFFFF', size: 15, font: font })]
                                })
                            ]
                        })
                    ]
                })
            ]
        });

        const leftColChildren = [];
        const rightColChildren = [];

        if (p.summary) {
            leftColChildren.push(createSectionTitle('Resumen', sectionTitleColor, font));
            leftColChildren.push(new Paragraph({
                spacing: { before: 40, after: 120 },
                children: [new TextRun({ text: p.summary, color: textColorDark, size: 16.5, font: font })]
            }));
        }

        if (Array.isArray(cvData.experience) && cvData.experience.length > 0) {
            leftColChildren.push(createSectionTitle('Experiencia', sectionTitleColor, font));
            leftColChildren.push(...createExperienceItems(cvData.experience, themeColor, textColorDark, textColorMuted, font));
        }

        if (Array.isArray(cvData.education) && cvData.education.length > 0) {
            leftColChildren.push(createSectionTitle('Educación', sectionTitleColor, font));
            leftColChildren.push(...createEducationItems(cvData.education, themeColor, textColorDark, textColorMuted, font));
        }

        if (Array.isArray(cvData.impacts) && cvData.impacts.length > 0) {
            leftColChildren.push(createSectionTitle('Impacto Clave', sectionTitleColor, font));
            leftColChildren.push(...createImpactsElements(cvData.impacts, themeColor, textColorDark, font));
        }

        const asideElements = [];
        asideElements.push(new Paragraph({
            spacing: { before: 40, after: 100 },
            border: { bottom: { color: themeColor, size: 16, style: BorderStyle.SINGLE, space: 4 } },
            children: [
                new TextRun({ text: 'HABILIDADES', bold: true, color: themeColor, size: 19, font: font })
            ]
        }));

        if (Array.isArray(cvData.skills)) {
            cvData.skills.forEach(s => {
                asideElements.push(new Table({
                    width: { size: 100, type: WidthType.PERCENTAGE },
                    borders: {
                        top: { style: BorderStyle.SINGLE, size: 6, color: 'D1D5DB' }, bottom: { style: BorderStyle.SINGLE, size: 6, color: 'D1D5DB' }, left: { style: BorderStyle.SINGLE, size: 6, color: 'D1D5DB' }, right: { style: BorderStyle.SINGLE, size: 6, color: 'D1D5DB' }, insideHorizontal: { style: BorderStyle.NONE }, insideVertical: { style: BorderStyle.NONE }
                    },
                    rows: [
                        new TableRow({
                            children: [
                                new TableCell({
                                    width: { size: 100, type: WidthType.PERCENTAGE },
                                    shading: { fill: 'FFFFFF', type: ShadingType.CLEAR },
                                    margins: { top: 80, bottom: 80, left: 120, right: 120 },
                                    children: [
                                        new Paragraph({
                                            spacing: { before: 0, after: 0 },
                                            children: [new TextRun({ text: s.name, color: textColorDark, size: 15.5, font: font })]
                                        })
                                    ]
                                })
                            ]
                        })
                    ]
                }));
                asideElements.push(new Paragraph({ spacing: { before: 0, after: 40 } }));
            });
        }

        const asideCard = new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: {
                top: { style: BorderStyle.SINGLE, size: 6, color: 'E5E7EB' }, bottom: { style: BorderStyle.SINGLE, size: 6, color: 'E5E7EB' }, left: { style: BorderStyle.SINGLE, size: 6, color: 'E5E7EB' }, right: { style: BorderStyle.SINGLE, size: 6, color: 'E5E7EB' }, insideHorizontal: { style: BorderStyle.NONE }, insideVertical: { style: BorderStyle.NONE }
            },
            rows: [
                new TableRow({
                    children: [
                        new TableCell({
                            width: { size: 100, type: WidthType.PERCENTAGE },
                            shading: { fill: 'F8F9FA', type: ShadingType.CLEAR },
                            margins: { top: 200, bottom: 250, left: 220, right: 220 },
                            children: asideElements
                        })
                    ]
                })
            ]
        });

        rightColChildren.push(asideCard);

        const bodySplitTable = new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: {
                top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE }, insideHorizontal: { style: BorderStyle.NONE }, insideVertical: { style: BorderStyle.NONE }
            },
            rows: [
                new TableRow({
                    height: { value: SPLIT_BODY_MIN_HEIGHT, rule: HeightRule.ATLEAST },
                    children: [
                        new TableCell({
                            width: { size: 68, type: WidthType.PERCENTAGE },
                            margins: { top: 400, bottom: 400, left: 550, right: 300 },
                            children: leftColChildren
                        }),
                        new TableCell({
                            width: { size: 32, type: WidthType.PERCENTAGE },
                            margins: { top: 400, bottom: 400, left: 300, right: 550 },
                            children: rightColChildren
                        })
                    ]
                })
            ]
        });

        return new Document({
            sections: [{
                properties: { page: { size: PAGE_SIZE_A4, margin: ZERO_MARGINS } },
                children: [bannerTable, bodySplitTable, createTinyTrailingParagraph()]
            }]
        });
    }

    // ==========================================
    // 3. ESPECIAL: TECH-LEAD (Terminal Hacker / Consolas)
    // ==========================================
    if (preset.archetype === 'tech-lead') {
        const bgDark = '1E1E1E';
        const neonGreen = '4AF626';
        const terminalFont = 'Consolas';

        const terminalHeader = new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: {
                top: { style: BorderStyle.SINGLE, size: 6, color: '333333' }, bottom: { style: BorderStyle.SINGLE, size: 6, color: '333333' }, left: { style: BorderStyle.SINGLE, size: 6, color: '333333' }, right: { style: BorderStyle.SINGLE, size: 6, color: '333333' }, insideHorizontal: { style: BorderStyle.NONE }, insideVertical: { style: BorderStyle.NONE }
            },
            rows: [
                new TableRow({
                    children: [
                        new TableCell({
                            width: { size: 100, type: WidthType.PERCENTAGE },
                            shading: { fill: '111111', type: ShadingType.CLEAR },
                            margins: { top: 300, bottom: 300, left: 400, right: 400 },
                            children: [
                                new Paragraph({
                                    spacing: { before: 0, after: 40 },
                                    children: [
                                        new TextRun({ text: 'root@tech-lead:~# ', color: 'FF5F56', bold: true, size: 28, font: terminalFont }),
                                        new TextRun({ text: fullName, bold: true, color: neonGreen, size: 32, font: terminalFont })
                                    ]
                                }),
                                new Paragraph({
                                    spacing: { before: 0, after: 40 },
                                    children: [new TextRun({ text: `> ${title || 'Lead Architect'}`, color: '00E5FF', size: 19, font: terminalFont })]
                                }),
                                new Paragraph({
                                    spacing: { before: 0, after: 0 },
                                    children: [new TextRun({ text: `// ${p.email || ''} | ${p.phone || ''} | ${p.website || ''}`, color: '888888', size: 15, font: terminalFont })]
                                })
                            ]
                        })
                    ]
                })
            ]
        });

        const bodyElements = [terminalHeader, new Paragraph({ spacing: { before: 120, after: 60 } })];

        if (p.summary) {
            bodyElements.push(createSectionTitle('// RESUMEN', neonGreen, terminalFont));
            bodyElements.push(new Paragraph({
                spacing: { before: 30, after: 120 },
                children: [new TextRun({ text: p.summary, color: 'DDDDDD', size: 16, font: terminalFont })]
            }));
        }

        if (Array.isArray(cvData.experience) && cvData.experience.length > 0) {
            bodyElements.push(createSectionTitle('// EXPERIENCIA', neonGreen, terminalFont));
            bodyElements.push(...createExperienceItems(cvData.experience, neonGreen, 'FFFFFF', '888888', terminalFont));
        }

        if (Array.isArray(cvData.education) && cvData.education.length > 0) {
            bodyElements.push(createSectionTitle('// EDUCACIÓN', neonGreen, terminalFont));
            bodyElements.push(...createEducationItems(cvData.education, neonGreen, 'FFFFFF', '888888', terminalFont));
        }

        if (Array.isArray(cvData.skills) && cvData.skills.length > 0) {
            bodyElements.push(createSectionTitle('// HABILIDADES', neonGreen, terminalFont));
            bodyElements.push(...createSkillsElements(cvData.skills, 'bars', neonGreen, 'FFFFFF', false, terminalFont));
        }

        const darkWrap = new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: {
                top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE }, insideHorizontal: { style: BorderStyle.NONE }, insideVertical: { style: BorderStyle.NONE }
            },
            rows: [
                new TableRow({
                    height: { value: FULL_PAGE_MIN_HEIGHT, rule: HeightRule.ATLEAST },
                    children: [
                        new TableCell({
                            width: { size: 100, type: WidthType.PERCENTAGE },
                            shading: { fill: bgDark, type: ShadingType.CLEAR },
                            margins: { top: 600, bottom: 600, left: 600, right: 600 },
                            children: bodyElements
                        })
                    ]
                })
            ]
        });

        return new Document({
            sections: [{
                properties: { page: { size: PAGE_SIZE_A4, margin: ZERO_MARGINS } },
                children: [darkWrap, createTinyTrailingParagraph()]
            }]
        });
    }

    // ==========================================
    // 4. ESPECIAL: STARTUP-CV (Header Tint + Borde Izquierdo Grueso)
    // ==========================================
    if (preset.archetype === 'startup-cv') {
        const headerTable = new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: {
                top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE },
                left: { style: BorderStyle.SINGLE, size: 36, color: themeColor },
                insideHorizontal: { style: BorderStyle.NONE }, insideVertical: { style: BorderStyle.NONE }
            },
            rows: [
                new TableRow({
                    children: [
                        new TableCell({
                            width: { size: 70, type: WidthType.PERCENTAGE },
                            shading: { fill: 'F4F4F5', type: ShadingType.CLEAR },
                            margins: { top: 350, bottom: 350, left: 400, right: 200 },
                            children: [
                                new Paragraph({
                                    spacing: { before: 0, after: 20 },
                                    children: [new TextRun({ text: fullName, bold: true, color: textColorDark, size: 36, font: font })]
                                }),
                                new Paragraph({
                                    spacing: { before: 0, after: 0 },
                                    children: [new TextRun({ text: title, color: themeColor, bold: true, size: 20, font: font })]
                                })
                            ]
                        }),
                        new TableCell({
                            width: { size: 30, type: WidthType.PERCENTAGE },
                            shading: { fill: 'F4F4F5', type: ShadingType.CLEAR },
                            margins: { top: 350, bottom: 350, left: 200, right: 400 },
                            children: [
                                new Paragraph({
                                    alignment: AlignmentType.RIGHT,
                                    spacing: { before: 0, after: 20 },
                                    children: [new TextRun({ text: p.email || '', color: textColorMuted, size: 15, font: font })]
                                }),
                                new Paragraph({
                                    alignment: AlignmentType.RIGHT,
                                    spacing: { before: 0, after: 0 },
                                    children: [new TextRun({ text: p.phone || '', color: textColorMuted, size: 15, font: font })]
                                })
                            ]
                        })
                    ]
                })
            ]
        });

        const bodyElements = [headerTable, new Paragraph({ spacing: { before: 80, after: 40 } })];

        if (p.summary) {
            bodyElements.push(createSectionTitle('Perfil Profesional', sectionTitleColor, font));
            bodyElements.push(new Paragraph({
                spacing: { before: 40, after: 120 },
                children: [new TextRun({ text: p.summary, color: textColorDark, size: 16.5, font: font })]
            }));
        }

        if (Array.isArray(cvData.experience) && cvData.experience.length > 0) {
            bodyElements.push(createSectionTitle('Experiencia', sectionTitleColor, font));
            bodyElements.push(...createExperienceItems(cvData.experience, themeColor, textColorDark, textColorMuted, font));
        }

        if (Array.isArray(cvData.education) && cvData.education.length > 0) {
            bodyElements.push(createSectionTitle('Educación', sectionTitleColor, font));
            bodyElements.push(...createEducationItems(cvData.education, themeColor, textColorDark, textColorMuted, font));
        }

        if (Array.isArray(cvData.skills) && cvData.skills.length > 0) {
            bodyElements.push(createSectionTitle('Habilidades', sectionTitleColor, font));
            bodyElements.push(...createSkillsElements(cvData.skills, 'list', themeColor, textColorDark, false, font));
        }

        if (Array.isArray(cvData.impacts) && cvData.impacts.length > 0) {
            bodyElements.push(createSectionTitle('Logros e Impacto', sectionTitleColor, font));
            bodyElements.push(...createImpactsElements(cvData.impacts, themeColor, textColorDark, font));
        }

        return new Document({
            sections: [{
                properties: { page: { size: PAGE_SIZE_A4, margin: { top: 600, bottom: 600, left: 600, right: 600 } } },
                children: bodyElements
            }]
        });
    }

    // ==========================================
    // 5. ESPECIAL: CARDS (Cada sección en una tarjeta blanca con fondo gris)
    // ==========================================
    if (preset.archetype === 'cards') {
        const wrapCard = (innerElements) => {
            return new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                borders: {
                    top: { style: BorderStyle.SINGLE, size: 6, color: 'E5E7EB' }, bottom: { style: BorderStyle.SINGLE, size: 6, color: 'E5E7EB' }, left: { style: BorderStyle.SINGLE, size: 6, color: 'E5E7EB' }, right: { style: BorderStyle.SINGLE, size: 6, color: 'E5E7EB' }, insideHorizontal: { style: BorderStyle.NONE }, insideVertical: { style: BorderStyle.NONE }
                },
                rows: [
                    new TableRow({
                        children: [
                            new TableCell({
                                width: { size: 100, type: WidthType.PERCENTAGE },
                                shading: { fill: 'FFFFFF', type: ShadingType.CLEAR },
                                margins: { top: 300, bottom: 300, left: 400, right: 400 },
                                children: innerElements
                            })
                        ]
                    })
                ]
            });
        };

        const pageCards = [];

        // Tarjeta Header
        pageCards.push(wrapCard([
            new Paragraph({
                spacing: { before: 0, after: 30 },
                children: [new TextRun({ text: fullName, bold: true, color: themeColor, size: 36, font: font })]
            }),
            new Paragraph({
                spacing: { before: 0, after: 60 },
                children: [new TextRun({ text: title, color: textColorDark, size: 20, font: font })]
            }),
            new Paragraph({
                spacing: { before: 0, after: 0 },
                children: [new TextRun({ text: `${p.email || ''}  •  ${p.phone || ''}  •  ${p.address || ''}`, color: textColorMuted, size: 15, font: font })]
            })
        ]));
        pageCards.push(new Paragraph({ spacing: { before: 0, after: 120 } }));

        if (p.summary) {
            pageCards.push(wrapCard([
                createSectionTitle('Perfil Profesional', sectionTitleColor, font),
                new Paragraph({
                    spacing: { before: 30, after: 40 },
                    children: [new TextRun({ text: p.summary, color: textColorDark, size: 16.5, font: font })]
                })
            ]));
            pageCards.push(new Paragraph({ spacing: { before: 0, after: 120 } }));
        }

        if (Array.isArray(cvData.experience) && cvData.experience.length > 0) {
            pageCards.push(wrapCard([
                createSectionTitle('Experiencia', sectionTitleColor, font),
                ...createExperienceItems(cvData.experience, themeColor, textColorDark, textColorMuted, font)
            ]));
            pageCards.push(new Paragraph({ spacing: { before: 0, after: 120 } }));
        }

        if (Array.isArray(cvData.education) && cvData.education.length > 0) {
            pageCards.push(wrapCard([
                createSectionTitle('Educación', sectionTitleColor, font),
                ...createEducationItems(cvData.education, themeColor, textColorDark, textColorMuted, font)
            ]));
            pageCards.push(new Paragraph({ spacing: { before: 0, after: 120 } }));
        }

        if (Array.isArray(cvData.skills) && cvData.skills.length > 0) {
            pageCards.push(wrapCard([
                createSectionTitle('Habilidades', sectionTitleColor, font),
                ...createSkillsElements(cvData.skills, 'bars', themeColor, textColorDark, false, font)
            ]));
        }

        const bgTable = new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: {
                top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE }, insideHorizontal: { style: BorderStyle.NONE }, insideVertical: { style: BorderStyle.NONE }
            },
            rows: [
                new TableRow({
                    height: { value: FULL_PAGE_MIN_HEIGHT, rule: HeightRule.ATLEAST },
                    children: [
                        new TableCell({
                            width: { size: 100, type: WidthType.PERCENTAGE },
                            shading: { fill: 'F0F2F5', type: ShadingType.CLEAR },
                            margins: { top: 600, bottom: 600, left: 600, right: 600 },
                            children: pageCards
                        })
                    ]
                })
            ]
        });

        return new Document({
            sections: [{
                properties: { page: { size: PAGE_SIZE_A4, margin: ZERO_MARGINS } },
                children: [bgTable, createTinyTrailingParagraph()]
            }]
        });
    }

    // ==========================================
    // 6. ESPECIAL: BOLD (Cabecera Masiva + 2 Columnas)
    // ==========================================
    if (preset.archetype === 'bold') {
        const banner = new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: {
                top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE }, insideHorizontal: { style: BorderStyle.NONE }, insideVertical: { style: BorderStyle.NONE }
            },
            rows: [
                new TableRow({
                    children: [
                        new TableCell({
                            width: { size: 100, type: WidthType.PERCENTAGE },
                            shading: { fill: themeColor, type: ShadingType.CLEAR },
                            margins: { top: 600, bottom: 600, left: 600, right: 600 },
                            children: [
                                new Paragraph({
                                    alignment: AlignmentType.CENTER,
                                    spacing: { before: 0, after: 40 },
                                    children: [new TextRun({ text: fullName.toUpperCase(), bold: true, color: 'FFFFFF', size: 42, font: font })]
                                }),
                                new Paragraph({
                                    alignment: AlignmentType.CENTER,
                                    spacing: { before: 0, after: 0 },
                                    children: [new TextRun({ text: title, color: 'FFFFFF', size: 22, font: font })]
                                })
                            ]
                        })
                    ]
                })
            ]
        });

        const leftAside = [];
        const rightMain = [];

        if (p.phone || p.email || p.address) {
            leftAside.push(...createContactBlock(p, textColorDark, themeColor, font));
        }

        if (Array.isArray(cvData.skills) && cvData.skills.length > 0) {
            leftAside.push(createSectionTitle('Habilidades', sectionTitleColor, font));
            leftAside.push(...createSkillsElements(cvData.skills, 'list', themeColor, textColorDark, false, font));
        }

        if (p.summary) {
            rightMain.push(createSectionTitle('Perfil Profesional', sectionTitleColor, font));
            rightMain.push(new Paragraph({
                spacing: { before: 30, after: 120 },
                children: [new TextRun({ text: p.summary, color: textColorDark, size: 16.5, font: font })]
            }));
        }

        if (Array.isArray(cvData.experience) && cvData.experience.length > 0) {
            rightMain.push(createSectionTitle('Experiencia', sectionTitleColor, font));
            rightMain.push(...createExperienceItems(cvData.experience, themeColor, textColorDark, textColorMuted, font));
        }

        if (Array.isArray(cvData.education) && cvData.education.length > 0) {
            rightMain.push(createSectionTitle('Educación', sectionTitleColor, font));
            rightMain.push(...createEducationItems(cvData.education, themeColor, textColorDark, textColorMuted, font));
        }

        const bodySplit = new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: {
                top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE }, insideHorizontal: { style: BorderStyle.NONE }, insideVertical: { style: BorderStyle.NONE }
            },
            rows: [
                new TableRow({
                    height: { value: SPLIT_BODY_MIN_HEIGHT, rule: HeightRule.ATLEAST },
                    children: [
                        new TableCell({
                            width: { size: 35, type: WidthType.PERCENTAGE },
                            margins: { top: 400, bottom: 400, left: 550, right: 300 },
                            children: leftAside
                        }),
                        new TableCell({
                            width: { size: 65, type: WidthType.PERCENTAGE },
                            margins: { top: 400, bottom: 400, left: 300, right: 550 },
                            children: rightMain
                        })
                    ]
                })
            ]
        });

        return new Document({
            sections: [{
                properties: { page: { size: PAGE_SIZE_A4, margin: ZERO_MARGINS } },
                children: [banner, bodySplit, createTinyTrailingParagraph()]
            }]
        });
    }

    // ==========================================
    // 7. ESPECIAL: SWISS (Encabezado Masivo Superior + 33/67 Split)
    // ==========================================
    if (preset.archetype === 'swiss') {
        const swissHeader = new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: {
                top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.SINGLE, size: 28, color: textColorDark }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE }, insideHorizontal: { style: BorderStyle.NONE }, insideVertical: { style: BorderStyle.NONE }
            },
            rows: [
                new TableRow({
                    children: [
                        new TableCell({
                            width: { size: 100, type: WidthType.PERCENTAGE },
                            margins: { top: 200, bottom: 250, left: 600, right: 600 },
                            children: [
                                new Paragraph({
                                    spacing: { before: 0, after: 30 },
                                    children: [new TextRun({ text: fullName, bold: true, color: textColorDark, size: 44, font: font })]
                                }),
                                new Paragraph({
                                    spacing: { before: 0, after: 0 },
                                    children: [new TextRun({ text: title, color: themeColor, bold: true, size: 22, font: font })]
                                })
                            ]
                        })
                    ]
                })
            ]
        });

        const leftCol = [];
        const rightCol = [];

        leftCol.push(...createContactBlock(p, textColorDark, themeColor, font));

        if (Array.isArray(cvData.skills) && cvData.skills.length > 0) {
            leftCol.push(createSectionTitle('HABILIDADES', sectionTitleColor, font));
            leftCol.push(...createSkillsElements(cvData.skills, 'list', themeColor, textColorDark, false, font));
        }

        if (p.summary) {
            rightCol.push(createSectionTitle('PERFIL', sectionTitleColor, font));
            rightCol.push(new Paragraph({
                spacing: { before: 30, after: 120 },
                children: [new TextRun({ text: p.summary, color: textColorDark, size: 16.5, font: font })]
            }));
        }

        if (Array.isArray(cvData.experience) && cvData.experience.length > 0) {
            rightCol.push(createSectionTitle('EXPERIENCIA', sectionTitleColor, font));
            rightCol.push(...createExperienceItems(cvData.experience, themeColor, textColorDark, textColorMuted, font));
        }

        if (Array.isArray(cvData.education) && cvData.education.length > 0) {
            rightCol.push(createSectionTitle('EDUCACIÓN', sectionTitleColor, font));
            rightCol.push(...createEducationItems(cvData.education, themeColor, textColorDark, textColorMuted, font));
        }

        const swissBody = new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: {
                top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE }, insideHorizontal: { style: BorderStyle.NONE }, insideVertical: { style: BorderStyle.NONE }
            },
            rows: [
                new TableRow({
                    height: { value: SPLIT_BODY_MIN_HEIGHT, rule: HeightRule.ATLEAST },
                    children: [
                        new TableCell({
                            width: { size: 33, type: WidthType.PERCENTAGE },
                            margins: { top: 350, bottom: 400, left: 600, right: 300 },
                            children: leftCol
                        }),
                        new TableCell({
                            width: { size: 67, type: WidthType.PERCENTAGE },
                            margins: { top: 350, bottom: 400, left: 300, right: 600 },
                            children: rightCol
                        })
                    ]
                })
            ]
        });

        return new Document({
            sections: [{
                properties: { page: { size: PAGE_SIZE_A4, margin: ZERO_MARGINS } },
                children: [swissHeader, swissBody, createTinyTrailingParagraph()]
            }]
        });
    }

    // ==========================================
    // 8. ESPECIAL: TIMELINE-CV & CHRONOLOGICAL (Línea de Tiempo Vertical Activa)
    // ==========================================
    if (preset.archetype === 'timeline-cv' || preset.archetype === 'chronological') {
        const timeHeader = [];
        timeHeader.push(new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 80, after: 30 },
            children: [new TextRun({ text: fullName, bold: true, color: themeColor, size: 38, font: font })]
        }));

        if (title) {
            timeHeader.push(new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 0, after: 50 },
                children: [new TextRun({ text: title, color: textColorDark, size: 20, font: font })]
            }));
        }

        const contactParts = [];
        if (p.email) contactParts.push(p.email);
        if (p.phone) contactParts.push(p.phone);
        if (p.address) contactParts.push(p.address);
        if (p.website) contactParts.push(p.website);

        if (contactParts.length > 0) {
            timeHeader.push(new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 0, after: 180 },
                border: { bottom: { color: themeColor, size: 16, style: BorderStyle.SINGLE, space: 6 } },
                children: [new TextRun({ text: contactParts.join('  •  '), color: textColorMuted, size: 16, font: font })]
            }));
        }

        const timelineElements = [...timeHeader];

        if (p.summary) {
            timelineElements.push(createSectionTitle('Perfil Profesional', sectionTitleColor, font));
            timelineElements.push(new Paragraph({
                spacing: { before: 40, after: 120 },
                children: [new TextRun({ text: p.summary, color: textColorDark, size: 16.5, font: font })]
            }));
        }

        if (Array.isArray(cvData.experience) && cvData.experience.length > 0) {
            timelineElements.push(createSectionTitle('Trayectoria Profesional', sectionTitleColor, font));
            timelineElements.push(...createTimelineItems(cvData.experience, true, themeColor, textColorDark, textColorMuted, font));
        }

        if (Array.isArray(cvData.education) && cvData.education.length > 0) {
            timelineElements.push(createSectionTitle('Formación Académica', sectionTitleColor, font));
            timelineElements.push(...createTimelineItems(cvData.education, false, themeColor, textColorDark, textColorMuted, font));
        }

        if (Array.isArray(cvData.skills) && cvData.skills.length > 0) {
            timelineElements.push(createSectionTitle('Habilidades', sectionTitleColor, font));
            timelineElements.push(...createSkillsElements(cvData.skills, 'bars', themeColor, textColorDark, false, font));
        }

        return new Document({
            sections: [{
                properties: { page: { size: PAGE_SIZE_A4, margin: { top: 720, bottom: 720, left: 720, right: 720 } } },
                children: timelineElements
            }]
        });
    }

    // ==========================================
    // 9. ESPECIAL: INFOGRAPHIC (50% / 50% Dividido con Barra Lateral Sólida)
    // ==========================================
    if (preset.archetype === 'infographic') {
        const leftSidebar = [];
        const rightMain = [];

        leftSidebar.push(...createAvatarBadge(initials, 'FFFFFF', 'FFFFFF', font));
        leftSidebar.push(new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 80, after: 30 },
            children: [new TextRun({ text: fullName, bold: true, color: 'FFFFFF', size: 34, font: font })]
        }));

        if (title) {
            leftSidebar.push(new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 0, after: 120 },
                children: [new TextRun({ text: title, color: 'E5E7EB', size: 19, font: font })]
            }));
        }

        if (p.summary) {
            leftSidebar.push(new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 60, after: 160 },
                children: [new TextRun({ text: p.summary, color: 'FFFFFF', size: 16, font: font })]
            }));
        }

        leftSidebar.push(...createContactBlock(p, 'FFFFFF', 'FFFFFF', font));

        if (Array.isArray(cvData.experience) && cvData.experience.length > 0) {
            rightMain.push(createSectionTitle('Experiencia', sectionTitleColor, font));
            rightMain.push(...createExperienceItems(cvData.experience, themeColor, textColorDark, textColorMuted, font));
        }

        if (Array.isArray(cvData.education) && cvData.education.length > 0) {
            rightMain.push(createSectionTitle('Educación', sectionTitleColor, font));
            rightMain.push(...createEducationItems(cvData.education, themeColor, textColorDark, textColorMuted, font));
        }

        if (Array.isArray(cvData.skills) && cvData.skills.length > 0) {
            rightMain.push(createSectionTitle('Habilidades', sectionTitleColor, font));
            rightMain.push(...createSkillsElements(cvData.skills, 'bars', themeColor, textColorDark, false, font));
        }

        const infoTable = new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: {
                top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE }, insideHorizontal: { style: BorderStyle.NONE }, insideVertical: { style: BorderStyle.NONE }
            },
            rows: [
                new TableRow({
                    height: { value: FULL_PAGE_MIN_HEIGHT, rule: HeightRule.ATLEAST },
                    children: [
                        new TableCell({
                            width: { size: 48, type: WidthType.PERCENTAGE },
                            shading: { fill: themeColor, type: ShadingType.CLEAR },
                            margins: { top: 600, bottom: 600, left: 450, right: 450 },
                            children: leftSidebar
                        }),
                        new TableCell({
                            width: { size: 52, type: WidthType.PERCENTAGE },
                            margins: { top: 600, bottom: 600, left: 450, right: 450 },
                            children: rightMain
                        })
                    ]
                })
            ]
        });

        return new Document({
            sections: [{
                properties: { page: { size: PAGE_SIZE_A4, margin: ZERO_MARGINS } },
                children: [infoTable, createTinyTrailingParagraph()]
            }]
        });
    }

    // ==========================================
    // 10. ESPECIAL: IMPACT (Cabecera Superior + Resaltado de Impacto 70/30)
    // ==========================================
    if (preset.archetype === 'impact') {
        const impactHeader = new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: {
                top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.SINGLE, size: 28, color: themeColor }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE }, insideHorizontal: { style: BorderStyle.NONE }, insideVertical: { style: BorderStyle.NONE }
            },
            rows: [
                new TableRow({
                    children: [
                        new TableCell({
                            width: { size: 65, type: WidthType.PERCENTAGE },
                            children: [
                                new Paragraph({
                                    spacing: { before: 0, after: 20 },
                                    children: [new TextRun({ text: fullName, bold: true, color: textColorDark, size: 38, font: font })]
                                }),
                                new Paragraph({
                                    spacing: { before: 0, after: 80 },
                                    children: [new TextRun({ text: title, color: themeColor, bold: true, size: 20, font: font })]
                                })
                            ]
                        }),
                        new TableCell({
                            width: { size: 35, type: WidthType.PERCENTAGE },
                            children: [
                                new Paragraph({
                                    alignment: AlignmentType.RIGHT,
                                    spacing: { before: 0, after: 20 },
                                    children: [new TextRun({ text: p.email || '', color: textColorMuted, size: 15, font: font })]
                                }),
                                new Paragraph({
                                    alignment: AlignmentType.RIGHT,
                                    spacing: { before: 0, after: 80 },
                                    children: [new TextRun({ text: p.phone || '', color: textColorMuted, size: 15, font: font })]
                                })
                            ]
                        })
                    ]
                })
            ]
        });

        const leftCol = [];
        const rightCol = [];

        if (p.summary) {
            leftCol.push(createSectionTitle('Resumen', sectionTitleColor, font));
            leftCol.push(new Paragraph({
                spacing: { before: 30, after: 120 },
                children: [new TextRun({ text: p.summary, color: textColorDark, size: 16.5, font: font })]
            }));
        }

        if (Array.isArray(cvData.experience) && cvData.experience.length > 0) {
            leftCol.push(createSectionTitle('Experiencia', sectionTitleColor, font));
            leftCol.push(...createExperienceItems(cvData.experience, themeColor, textColorDark, textColorMuted, font));
        }

        if (Array.isArray(cvData.education) && cvData.education.length > 0) {
            leftCol.push(createSectionTitle('Educación', sectionTitleColor, font));
            leftCol.push(...createEducationItems(cvData.education, themeColor, textColorDark, textColorMuted, font));
        }

        if (Array.isArray(cvData.impacts) && cvData.impacts.length > 0) {
            rightCol.push(createSectionTitle('Impacto Clave', sectionTitleColor, font));
            rightCol.push(...createImpactsElements(cvData.impacts, themeColor, textColorDark, font));
        }

        if (Array.isArray(cvData.skills) && cvData.skills.length > 0) {
            rightCol.push(createSectionTitle('Habilidades', sectionTitleColor, font));
            rightCol.push(...createSkillsElements(cvData.skills, 'list', themeColor, textColorDark, false, font));
        }

        const bodySplit = new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: {
                top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE }, insideHorizontal: { style: BorderStyle.NONE }, insideVertical: { style: BorderStyle.NONE }
            },
            rows: [
                new TableRow({
                    height: { value: SPLIT_BODY_MIN_HEIGHT, rule: HeightRule.ATLEAST },
                    children: [
                        new TableCell({
                            width: { size: 70, type: WidthType.PERCENTAGE },
                            margins: { top: 200, bottom: 200, left: 0, right: 300 },
                            children: leftCol
                        }),
                        new TableCell({
                            width: { size: 30, type: WidthType.PERCENTAGE },
                            margins: { top: 200, bottom: 200, left: 300, right: 0 },
                            children: rightCol
                        })
                    ]
                })
            ]
        });

        return new Document({
            sections: [{
                properties: { page: { size: PAGE_SIZE_A4, margin: { top: 720, bottom: 720, left: 720, right: 720 } } },
                children: [impactHeader, bodySplit]
            }]
        });
    }

    // ==========================================
    // 11. ESPECIAL: ARTISAN (Papel Cálido #FDFAF6 + Experiencia & Educación 2 Columnas)
    // ==========================================
    if (preset.archetype === 'artisan') {
        const artisanElements = [];

        artisanElements.push(new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 80, after: 30 },
            children: [new TextRun({ text: fullName, bold: true, color: themeColor, size: 38, font: 'Georgia' })]
        }));

        if (title) {
            artisanElements.push(new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 0, after: 60 },
                children: [new TextRun({ text: title, color: textColorDark, size: 20, font: 'Georgia' })]
            }));
        }

        if (p.summary) {
            artisanElements.push(new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 40, after: 140 },
                children: [new TextRun({ text: p.summary, italics: true, color: textColorDark, size: 16.5, font: 'Georgia' })]
            }));
        }

        const expCol = [];
        const eduCol = [];

        if (Array.isArray(cvData.experience) && cvData.experience.length > 0) {
            expCol.push(createSectionTitle('Experiencia', sectionTitleColor, 'Georgia'));
            expCol.push(...createExperienceItems(cvData.experience, themeColor, textColorDark, textColorMuted, 'Georgia'));
        }

        if (Array.isArray(cvData.education) && cvData.education.length > 0) {
            eduCol.push(createSectionTitle('Educación', sectionTitleColor, 'Georgia'));
            eduCol.push(...createEducationItems(cvData.education, themeColor, textColorDark, textColorMuted, 'Georgia'));
        }

        const gridTable = new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: {
                top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE }, insideHorizontal: { style: BorderStyle.NONE }, insideVertical: { style: BorderStyle.NONE }
            },
            rows: [
                new TableRow({
                    children: [
                        new TableCell({
                            width: { size: 50, type: WidthType.PERCENTAGE },
                            margins: { top: 100, bottom: 200, left: 0, right: 250 },
                            children: expCol
                        }),
                        new TableCell({
                            width: { size: 50, type: WidthType.PERCENTAGE },
                            margins: { top: 100, bottom: 200, left: 250, right: 0 },
                            children: eduCol
                        })
                    ]
                })
            ]
        });

        artisanElements.push(gridTable);

        if (Array.isArray(cvData.skills) && cvData.skills.length > 0) {
            artisanElements.push(createSectionTitle('Habilidades', sectionTitleColor, 'Georgia'));
            artisanElements.push(...createSkillsElements(cvData.skills, 'list', themeColor, textColorDark, false, 'Georgia'));
        }

        const warmWrap = new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: {
                top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE }, insideHorizontal: { style: BorderStyle.NONE }, insideVertical: { style: BorderStyle.NONE }
            },
            rows: [
                new TableRow({
                    height: { value: FULL_PAGE_MIN_HEIGHT, rule: HeightRule.ATLEAST },
                    children: [
                        new TableCell({
                            width: { size: 100, type: WidthType.PERCENTAGE },
                            shading: { fill: 'FDFAF6', type: ShadingType.CLEAR },
                            margins: { top: 600, bottom: 600, left: 600, right: 600 },
                            children: artisanElements
                        })
                    ]
                })
            ]
        });

        return new Document({
            sections: [{
                properties: { page: { size: PAGE_SIZE_A4, margin: ZERO_MARGINS } },
                children: [warmWrap, createTinyTrailingParagraph()]
            }]
        });
    }

    // ==========================================
    // 12. ESPECIAL: COLUMNIST (Formato Periódico / 2 Columnas)
    // ==========================================
    if (preset.archetype === 'columnist') {
        const colHeader = [];
        colHeader.push(new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 80, after: 20 },
            children: [new TextRun({ text: fullName.toUpperCase(), bold: true, color: textColorDark, size: 40, font: 'Georgia' })]
        }));

        if (title) {
            colHeader.push(new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 40, after: 180 },
                border: {
                    top: { color: 'CCCCCC', size: 8, style: BorderStyle.SINGLE, space: 4 },
                    bottom: { color: 'CCCCCC', size: 8, style: BorderStyle.SINGLE, space: 4 }
                },
                children: [new TextRun({ text: title, color: textColorDark, size: 18, font: 'Georgia' })]
            }));
        }

        const leftCol = [];
        const rightCol = [];

        if (p.summary) {
            leftCol.push(createSectionTitle('Perfil', sectionTitleColor, 'Georgia'));
            leftCol.push(new Paragraph({
                spacing: { before: 30, after: 120 },
                children: [new TextRun({ text: p.summary, color: textColorDark, size: 16.5, font: 'Georgia' })]
            }));
        }

        if (Array.isArray(cvData.experience) && cvData.experience.length > 0) {
            leftCol.push(createSectionTitle('Experiencia', sectionTitleColor, 'Georgia'));
            leftCol.push(...createExperienceItems(cvData.experience, themeColor, textColorDark, textColorMuted, 'Georgia'));
        }

        if (Array.isArray(cvData.education) && cvData.education.length > 0) {
            rightCol.push(createSectionTitle('Educación', sectionTitleColor, 'Georgia'));
            rightCol.push(...createEducationItems(cvData.education, themeColor, textColorDark, textColorMuted, 'Georgia'));
        }

        if (Array.isArray(cvData.skills) && cvData.skills.length > 0) {
            rightCol.push(createSectionTitle('Habilidades', sectionTitleColor, 'Georgia'));
            rightCol.push(...createSkillsElements(cvData.skills, 'list', themeColor, textColorDark, false, 'Georgia'));
        }

        const newspaperTable = new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: {
                top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE }, insideHorizontal: { style: BorderStyle.NONE }, insideVertical: { style: BorderStyle.NONE }
            },
            rows: [
                new TableRow({
                    height: { value: SPLIT_BODY_MIN_HEIGHT, rule: HeightRule.ATLEAST },
                    children: [
                        new TableCell({
                            width: { size: 50, type: WidthType.PERCENTAGE },
                            margins: { top: 100, bottom: 200, left: 0, right: 300 },
                            children: leftCol
                        }),
                        new TableCell({
                            width: { size: 50, type: WidthType.PERCENTAGE },
                            margins: { top: 100, bottom: 200, left: 300, right: 0 },
                            children: rightCol
                        })
                    ]
                })
            ]
        });

        return new Document({
            sections: [{
                properties: { page: { size: PAGE_SIZE_A4, margin: { top: 720, bottom: 720, left: 720, right: 720 } } },
                children: [...colHeader, newspaperTable]
            }]
        });
    }

    // ==========================================
    // 13. ESPECIAL: BRILLIANT-CV (Cabecera Flex Space-Between + Línea de Acento)
    // ==========================================
    if (preset.archetype === 'brilliant-cv') {
        const headerTable = new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: {
                top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.SINGLE, size: 16, color: themeColor }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE }, insideHorizontal: { style: BorderStyle.NONE }, insideVertical: { style: BorderStyle.NONE }
            },
            rows: [
                new TableRow({
                    children: [
                        new TableCell({
                            width: { size: 65, type: WidthType.PERCENTAGE },
                            children: [
                                new Paragraph({
                                    spacing: { before: 0, after: 20 },
                                    children: [new TextRun({ text: fullName, bold: true, color: themeColor, size: 38, font: font })]
                                }),
                                new Paragraph({
                                    spacing: { before: 0, after: 80 },
                                    children: [new TextRun({ text: title, color: textColorDark, size: 20, font: font })]
                                })
                            ]
                        }),
                        new TableCell({
                            width: { size: 35, type: WidthType.PERCENTAGE },
                            children: [
                                new Paragraph({
                                    alignment: AlignmentType.RIGHT,
                                    spacing: { before: 0, after: 20 },
                                    children: [new TextRun({ text: p.email || '', color: textColorMuted, size: 15, font: font })]
                                }),
                                new Paragraph({
                                    alignment: AlignmentType.RIGHT,
                                    spacing: { before: 0, after: 80 },
                                    children: [new TextRun({ text: p.phone || '', color: textColorMuted, size: 15, font: font })]
                                })
                            ]
                        })
                    ]
                })
            ]
        });

        const bodyElements = [headerTable];

        if (p.summary) {
            bodyElements.push(createSectionTitle('Perfil Profesional', sectionTitleColor, font));
            bodyElements.push(new Paragraph({
                spacing: { before: 40, after: 120 },
                children: [new TextRun({ text: p.summary, color: textColorDark, size: 16.5, font: font })]
            }));
        }

        if (Array.isArray(cvData.experience) && cvData.experience.length > 0) {
            bodyElements.push(createSectionTitle('Experiencia', sectionTitleColor, font));
            bodyElements.push(...createExperienceItems(cvData.experience, themeColor, textColorDark, textColorMuted, font));
        }

        if (Array.isArray(cvData.education) && cvData.education.length > 0) {
            bodyElements.push(createSectionTitle('Educación', sectionTitleColor, font));
            bodyElements.push(...createEducationItems(cvData.education, themeColor, textColorDark, textColorMuted, font));
        }

        if (Array.isArray(cvData.skills) && cvData.skills.length > 0) {
            bodyElements.push(createSectionTitle('Habilidades', sectionTitleColor, font));
            bodyElements.push(...createSkillsElements(cvData.skills, 'bars', themeColor, textColorDark, false, font));
        }

        return new Document({
            sections: [{
                properties: { page: { size: PAGE_SIZE_A4, margin: { top: 720, bottom: 720, left: 720, right: 720 } } },
                children: bodyElements
            }]
        });
    }

    // ==========================================
    // 14. ARQUETIPO SIDEBAR VERTICAL (CLASSIC / GRADIENT / CORPORATE / NEAT-CV / ALTA-CV / PRESTIGE / TWO-TONE / GALLERY)
    // ==========================================
    if (preset.archetype === 'sidebar' || preset.archetype === 'two-tone' || preset.archetype === 'gallery') {
        const sidebarChildren = [];
        const mainChildren = [];

        const isLightSidebar = preset.sidebarText === 'dark' || preset.archetype === 'two-tone' || preset.archetype === 'gallery';
        const sidebarTextColor = isLightSidebar ? textColorDark : 'FFFFFF';
        const sidebarBorderColor = isLightSidebar ? themeColor : 'FFFFFF';
        const sidebarShadingColor = (preset.sidebarBg === 'theme' && !isLightSidebar) ? themeColor : (preset.sidebarBg === 'soft' || isLightSidebar ? 'F3F4F6' : 'E5E7EB');

        sidebarChildren.push(...createAvatarBadge(initials, sidebarBorderColor, sidebarTextColor, font));

        if (preset.nameInSidebar) {
            sidebarChildren.push(new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 100, after: 60 },
                children: [new TextRun({ text: fullName, bold: true, color: sidebarTextColor, size: 30, font: font })]
            }));

            if (title) {
                sidebarChildren.push(new Paragraph({
                    alignment: AlignmentType.CENTER,
                    spacing: { before: 0, after: 140 },
                    children: [new TextRun({ text: title, color: isLightSidebar ? textColorMuted : 'E5E7EB', size: 19, font: font })]
                }));
            }

            if (preset.summaryInSidebar && p.summary) {
                sidebarChildren.push(new Paragraph({
                    alignment: AlignmentType.CENTER,
                    spacing: { before: 60, after: 180 },
                    children: [new TextRun({ text: p.summary, color: sidebarTextColor, size: 16, font: font })]
                }));
            }
        }

        if (p.phone || p.email || p.address || p.website) {
            sidebarChildren.push(...createContactBlock(p, sidebarTextColor, sidebarBorderColor, font));
        }

        if ((preset.skillsInSidebar || isLightSidebar) && Array.isArray(cvData.skills) && cvData.skills.length > 0) {
            sidebarChildren.push(new Paragraph({
                spacing: { before: 180, after: 90 },
                border: { bottom: { color: sidebarBorderColor, size: 10, style: BorderStyle.SINGLE, space: 4 } },
                children: [new TextRun({ text: 'HABILIDADES', bold: true, color: sidebarTextColor, size: 18, font: font })]
            }));
            sidebarChildren.push(...createSkillsElements(cvData.skills, preset.skillsStyle || 'list', themeColor, sidebarTextColor, !isLightSidebar, font));
        }

        if (!preset.nameInSidebar) {
            mainChildren.push(new Paragraph({
                spacing: { before: 80, after: 40 },
                children: [new TextRun({ text: fullName, bold: true, color: themeColor, size: 36, font: font })]
            }));

            if (title) {
                mainChildren.push(new Paragraph({
                    spacing: { before: 0, after: 150 },
                    border: { bottom: { color: 'E5E7EB', size: 8, style: BorderStyle.SINGLE, space: 6 } },
                    children: [new TextRun({ text: title, color: textColorDark, size: 21, font: font })]
                }));
            }

            if (p.summary) {
                mainChildren.push(createSectionTitle('Perfil Profesional', sectionTitleColor, font));
                mainChildren.push(new Paragraph({
                    spacing: { before: 40, after: 140 },
                    children: [new TextRun({ text: p.summary, color: textColorDark, size: 17, font: font })]
                }));
            }
        }

        if (Array.isArray(cvData.experience) && cvData.experience.length > 0) {
            mainChildren.push(createSectionTitle('Experiencia', sectionTitleColor, font));
            mainChildren.push(...createExperienceItems(cvData.experience, themeColor, textColorDark, textColorMuted, font));
        }

        if (Array.isArray(cvData.education) && cvData.education.length > 0) {
            mainChildren.push(createSectionTitle('Educación', sectionTitleColor, font));
            mainChildren.push(...createEducationItems(cvData.education, themeColor, textColorDark, textColorMuted, font));
        }

        if (!preset.skillsInSidebar && !isLightSidebar && Array.isArray(cvData.skills) && cvData.skills.length > 0) {
            mainChildren.push(createSectionTitle('Habilidades', sectionTitleColor, font));
            mainChildren.push(...createSkillsElements(cvData.skills, preset.skillsStyle || 'bars', themeColor, textColorDark, false, font));
        }

        if (Array.isArray(cvData.impacts) && cvData.impacts.length > 0) {
            mainChildren.push(createSectionTitle('Logros e Impacto', sectionTitleColor, font));
            mainChildren.push(...createImpactsElements(cvData.impacts, themeColor, textColorDark, font));
        }

        const layoutTable = new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: {
                top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE }, insideHorizontal: { style: BorderStyle.NONE }, insideVertical: { style: BorderStyle.NONE }
            },
            rows: [
                new TableRow({
                    height: { value: FULL_PAGE_MIN_HEIGHT, rule: HeightRule.ATLEAST },
                    children: [
                        new TableCell({
                            width: { size: preset.sidebarWidth || 35, type: WidthType.PERCENTAGE },
                            shading: { fill: sidebarShadingColor, type: ShadingType.CLEAR },
                            margins: { top: 600, bottom: 600, left: 400, right: 400 },
                            children: sidebarChildren
                        }),
                        new TableCell({
                            width: { size: 100 - (preset.sidebarWidth || 35), type: WidthType.PERCENTAGE },
                            margins: { top: 600, bottom: 600, left: 550, right: 450 },
                            children: mainChildren
                        })
                    ]
                })
            ]
        });

        return new Document({
            sections: [{
                properties: { page: { size: PAGE_SIZE_A4, margin: ZERO_MARGINS } },
                children: [layoutTable, createTinyTrailingParagraph()]
            }]
        });
    }

    // ==========================================
    // 15. ARQUETIPO CABECERA SUPERIOR + 2 COLUMNAS (HEADER-SPLIT / COMPACT / MODERN / HEADLINE)
    // ==========================================
    if (preset.archetype === 'header-split' || preset.archetype === 'headline') {
        const docChildren = [];

        docChildren.push(new Paragraph({
            spacing: { before: 40, after: 20 },
            children: [new TextRun({ text: fullName, bold: true, color: textColorDark, size: 38, font: font })]
        }));

        if (title) {
            docChildren.push(new Paragraph({
                spacing: { before: 0, after: 80 },
                children: [new TextRun({ text: title, color: themeColor, bold: true, size: 20, font: font })]
            }));
        }

        const contactParts = [];
        if (p.email) contactParts.push(p.email);
        if (p.phone) contactParts.push(p.phone);
        if (p.address) contactParts.push(p.address);
        if (p.website) contactParts.push(p.website);

        if (contactParts.length > 0) {
            docChildren.push(new Paragraph({
                spacing: { before: 0, after: 180 },
                border: { bottom: { color: themeColor, size: 16, style: BorderStyle.SINGLE, space: 6 } },
                children: [new TextRun({ text: contactParts.join('  •  '), color: textColorMuted, size: 16, font: font })]
            }));
        }

        const leftColChildren = [];
        const rightColChildren = [];

        if (p.summary) {
            leftColChildren.push(createSectionTitle('Perfil Profesional', sectionTitleColor, font));
            leftColChildren.push(new Paragraph({
                spacing: { before: 40, after: 120 },
                children: [new TextRun({ text: p.summary, color: textColorDark, size: 16.5, font: font })]
            }));
        }

        if (Array.isArray(cvData.experience) && cvData.experience.length > 0) {
            leftColChildren.push(createSectionTitle('Experiencia', sectionTitleColor, font));
            leftColChildren.push(...createExperienceItems(cvData.experience, themeColor, textColorDark, textColorMuted, font));
        }

        if (Array.isArray(cvData.education) && cvData.education.length > 0) {
            leftColChildren.push(createSectionTitle('Educación', sectionTitleColor, font));
            leftColChildren.push(...createEducationItems(cvData.education, themeColor, textColorDark, textColorMuted, font));
        }

        if (Array.isArray(cvData.skills) && cvData.skills.length > 0) {
            rightColChildren.push(createSectionTitle('Habilidades', sectionTitleColor, font));
            rightColChildren.push(...createSkillsElements(cvData.skills, preset.skillsStyle || 'bars', themeColor, textColorDark, false, font));
        }

        if (Array.isArray(cvData.impacts) && cvData.impacts.length > 0) {
            rightColChildren.push(createSectionTitle('Logros', sectionTitleColor, font));
            rightColChildren.push(...createImpactsElements(cvData.impacts, themeColor, textColorDark, font));
        }

        const splitRatio = preset.splitRatio || [68, 32];
        const splitTable = new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: {
                top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE }, insideHorizontal: { style: BorderStyle.NONE }, insideVertical: { style: BorderStyle.NONE }
            },
            rows: [
                new TableRow({
                    height: { value: SPLIT_BODY_MIN_HEIGHT, rule: HeightRule.ATLEAST },
                    children: [
                        new TableCell({
                            width: { size: splitRatio[0], type: WidthType.PERCENTAGE },
                            margins: { top: 100, bottom: 200, left: 0, right: 300 },
                            children: leftColChildren
                        }),
                        new TableCell({
                            width: { size: splitRatio[1], type: WidthType.PERCENTAGE },
                            margins: { top: 100, bottom: 200, left: 300, right: 0 },
                            children: rightColChildren
                        })
                    ]
                })
            ]
        });

        docChildren.push(splitTable);

        return new Document({
            sections: [{
                properties: { page: { size: PAGE_SIZE_A4, margin: { top: 720, bottom: 720, left: 720, right: 720 } } },
                children: docChildren
            }]
        });
    }

    // ==========================================
    // 16. ARQUETIPO BANNER SUPERIOR (TOP-BANNER / SLEEK-CV / CREATIVE / PORTFOLIO)
    // ==========================================
    if (preset.archetype === 'top-banner' || preset.archetype === 'sleek-cv' || preset.archetype === 'creative' || preset.archetype === 'portfolio') {
        const isDarkBanner = preset.archetype === 'sleek-cv';
        const bannerBgColor = isDarkBanner ? '212529' : themeColor;

        const bannerTable = new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: {
                top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE }, insideHorizontal: { style: BorderStyle.NONE }, insideVertical: { style: BorderStyle.NONE }
            },
            rows: [
                new TableRow({
                    children: [
                        new TableCell({
                            width: { size: 100, type: WidthType.PERCENTAGE },
                            shading: { fill: bannerBgColor, type: ShadingType.CLEAR },
                            margins: { top: 500, bottom: 500, left: 600, right: 600 },
                            children: [
                                new Paragraph({
                                    alignment: AlignmentType.CENTER,
                                    spacing: { before: 40, after: 40 },
                                    children: [new TextRun({ text: fullName, bold: true, color: 'FFFFFF', size: 36, font: font })]
                                }),
                                new Paragraph({
                                    alignment: AlignmentType.CENTER,
                                    spacing: { before: 0, after: 80 },
                                    children: [new TextRun({ text: title, color: isDarkBanner ? themeColor : 'E5E7EB', size: 20, font: font })]
                                })
                            ]
                        })
                    ]
                })
            ]
        });

        const bodyElements = [];
        if (p.summary) {
            bodyElements.push(createSectionTitle('Perfil Profesional', sectionTitleColor, font));
            bodyElements.push(new Paragraph({
                spacing: { before: 40, after: 120 },
                children: [new TextRun({ text: p.summary, color: textColorDark, size: 16.5, font: font })]
            }));
        }

        if (Array.isArray(cvData.experience) && cvData.experience.length > 0) {
            bodyElements.push(createSectionTitle('Experiencia', sectionTitleColor, font));
            bodyElements.push(...createExperienceItems(cvData.experience, themeColor, textColorDark, textColorMuted, font));
        }

        if (Array.isArray(cvData.education) && cvData.education.length > 0) {
            bodyElements.push(createSectionTitle('Educación', sectionTitleColor, font));
            bodyElements.push(...createEducationItems(cvData.education, themeColor, textColorDark, textColorMuted, font));
        }

        if (Array.isArray(cvData.skills) && cvData.skills.length > 0) {
            bodyElements.push(createSectionTitle('Habilidades', sectionTitleColor, font));
            bodyElements.push(...createSkillsElements(cvData.skills, 'bars', themeColor, textColorDark, false, font));
        }

        if (Array.isArray(cvData.impacts) && cvData.impacts.length > 0) {
            bodyElements.push(createSectionTitle('Impacto Clave', sectionTitleColor, font));
            bodyElements.push(...createImpactsElements(cvData.impacts, themeColor, textColorDark, font));
        }

        const bodyTable = new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: {
                top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE }, insideHorizontal: { style: BorderStyle.NONE }, insideVertical: { style: BorderStyle.NONE }
            },
            rows: [
                new TableRow({
                    height: { value: SPLIT_BODY_MIN_HEIGHT, rule: HeightRule.ATLEAST },
                    children: [
                        new TableCell({
                            width: { size: 100, type: WidthType.PERCENTAGE },
                            margins: { top: 400, bottom: 500, left: 600, right: 600 },
                            children: bodyElements
                        })
                    ]
                })
            ]
        });

        return new Document({
            sections: [{
                properties: { page: { size: PAGE_SIZE_A4, margin: ZERO_MARGINS } },
                children: [bannerTable, bodyTable, createTinyTrailingParagraph()]
            }]
        });
    }

    // ==========================================
    // 17. ARQUETIPO MODO OSCURO (DARK-MODE / MINIMALIST-DARK / MIDNIGHT / VISIONARY)
    // ==========================================
    if (preset.archetype === 'dark-mode') {
        const bgDark = preset.bg || '18181B';
        const textLight = preset.text || 'F9FAFB';
        const textMutedDark = '9CA3AF';

        const darkElements = [];

        darkElements.push(new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 80, after: 40 },
            children: [new TextRun({ text: fullName, bold: true, color: textLight, size: 36, font: font })]
        }));

        if (title) {
            darkElements.push(new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 0, after: 100 },
                children: [new TextRun({ text: title, color: themeColor, bold: true, size: 20, font: font })]
            }));
        }

        const contactParts = [];
        if (p.email) contactParts.push(p.email);
        if (p.phone) contactParts.push(p.phone);
        if (p.address) contactParts.push(p.address);
        if (p.website) contactParts.push(p.website);

        if (contactParts.length > 0) {
            darkElements.push(new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 0, after: 180 },
                border: { bottom: { color: themeColor, size: 12, style: BorderStyle.SINGLE, space: 6 } },
                children: [new TextRun({ text: contactParts.join('  •  '), color: textMutedDark, size: 16, font: font })]
            }));
        }

        if (p.summary) {
            darkElements.push(createSectionTitle('Perfil Profesional', themeColor, font));
            darkElements.push(new Paragraph({
                spacing: { before: 40, after: 120 },
                children: [new TextRun({ text: p.summary, color: textLight, size: 16, font: font })]
            }));
        }

        if (Array.isArray(cvData.experience) && cvData.experience.length > 0) {
            darkElements.push(createSectionTitle('Experiencia', themeColor, font));
            darkElements.push(...createExperienceItems(cvData.experience, themeColor, textLight, textMutedDark, font));
        }

        if (Array.isArray(cvData.education) && cvData.education.length > 0) {
            darkElements.push(createSectionTitle('Educación', themeColor, font));
            darkElements.push(...createEducationItems(cvData.education, themeColor, textLight, textMutedDark, font));
        }

        if (Array.isArray(cvData.skills) && cvData.skills.length > 0) {
            darkElements.push(createSectionTitle('Habilidades', themeColor, font));
            darkElements.push(...createSkillsElements(cvData.skills, 'bars', themeColor, textLight, false, font));
        }

        if (Array.isArray(cvData.impacts) && cvData.impacts.length > 0) {
            darkElements.push(createSectionTitle('Impacto Clave', themeColor, font));
            darkElements.push(...createImpactsElements(cvData.impacts, themeColor, textLight, font));
        }

        const darkTable = new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: {
                top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE }, insideHorizontal: { style: BorderStyle.NONE }, insideVertical: { style: BorderStyle.NONE }
            },
            rows: [
                new TableRow({
                    height: { value: FULL_PAGE_MIN_HEIGHT, rule: HeightRule.ATLEAST },
                    children: [
                        new TableCell({
                            width: { size: 100, type: WidthType.PERCENTAGE },
                            shading: { fill: bgDark, type: ShadingType.CLEAR },
                            margins: { top: 600, bottom: 600, left: 600, right: 600 },
                            children: darkElements
                        })
                    ]
                })
            ]
        });

        return new Document({
            sections: [{
                properties: { page: { size: PAGE_SIZE_A4, margin: ZERO_MARGINS } },
                children: [darkTable, createTinyTrailingParagraph()]
            }]
        });
    }

    // ==========================================
    // 18. ARQUETIPO ATS ESTÁNDAR (FAANG-RESUME / RENDERCV / BASIC-RESUME)
    // ==========================================
    if (preset.archetype === 'ats-standard') {
        const atsElements = [];

        atsElements.push(new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 40, after: 20 },
            children: [new TextRun({ text: fullName, bold: true, color: textColorDark, size: 34, font: font })]
        }));

        if (title) {
            atsElements.push(new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 0, after: 40 },
                children: [new TextRun({ text: title, color: themeColor, bold: true, size: 19, font: font })]
            }));
        }

        const contactParts = [];
        if (p.email) contactParts.push(p.email);
        if (p.phone) contactParts.push(p.phone);
        if (p.address) contactParts.push(p.address);
        if (p.website) contactParts.push(p.website);

        if (contactParts.length > 0) {
            atsElements.push(new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 0, after: 160 },
                border: { bottom: { color: themeColor, size: 12, style: BorderStyle.SINGLE, space: 6 } },
                children: [new TextRun({ text: contactParts.join('  |  '), color: textColorMuted, size: 15, font: font })]
            }));
        }

        if (p.summary) {
            atsElements.push(createSectionTitle('Resumen Profesional', sectionTitleColor, font, BorderStyle.SINGLE, 12));
            atsElements.push(new Paragraph({
                spacing: { before: 40, after: 120 },
                children: [new TextRun({ text: p.summary, color: textColorDark, size: 16, font: font })]
            }));
        }

        if (Array.isArray(cvData.experience) && cvData.experience.length > 0) {
            atsElements.push(createSectionTitle('Experiencia Laboral', sectionTitleColor, font, BorderStyle.SINGLE, 12));
            atsElements.push(...createExperienceItems(cvData.experience, themeColor, textColorDark, textColorMuted, font));
        }

        if (Array.isArray(cvData.education) && cvData.education.length > 0) {
            atsElements.push(createSectionTitle('Educación', sectionTitleColor, font, BorderStyle.SINGLE, 12));
            atsElements.push(...createEducationItems(cvData.education, themeColor, textColorDark, textColorMuted, font));
        }

        if (Array.isArray(cvData.skills) && cvData.skills.length > 0) {
            atsElements.push(createSectionTitle('Habilidades Técnicas', sectionTitleColor, font, BorderStyle.SINGLE, 12));
            atsElements.push(...createSkillsElements(cvData.skills, 'list', themeColor, textColorDark, false, font));
        }

        return new Document({
            sections: [{
                properties: { page: { size: PAGE_SIZE_A4, margin: { top: 720, bottom: 720, left: 720, right: 720 } } },
                children: atsElements
            }]
        });
    }

    // ==========================================
    // 19. ARQUETIPO ACADÉMICO / CHIC / MONOCROMO / ELEGANTE / EXECUTIVE / SINGLE-COLUMN
    // ==========================================
    const isExecutiveGold = preset.archetype === 'executive-gold';
    const singleElements = [];
    const alignment = preset.centered ? AlignmentType.CENTER : AlignmentType.LEFT;

    singleElements.push(new Paragraph({
        alignment: alignment,
        spacing: { before: 80, after: 40 },
        children: [
            new TextRun({ text: fullName, bold: true, color: themeColor, size: 36, font: font })
        ]
    }));

    if (title) {
        singleElements.push(new Paragraph({
            alignment: alignment,
            spacing: { before: 0, after: 80 },
            children: [
                new TextRun({ text: title, color: textColorDark, size: 20, font: font })
            ]
        }));
    }

    const contactParts = [];
    if (p.email) contactParts.push(p.email);
    if (p.phone) contactParts.push(p.phone);
    if (p.address) contactParts.push(p.address);
    if (p.website) contactParts.push(p.website);

    if (contactParts.length > 0) {
        singleElements.push(new Paragraph({
            alignment: alignment,
            spacing: { before: 0, after: 160 },
            border: {
                bottom: {
                    color: themeColor,
                    size: isExecutiveGold ? 16 : 10,
                    style: isExecutiveGold ? BorderStyle.DOUBLE : BorderStyle.SINGLE,
                    space: 5
                }
            },
            children: [
                new TextRun({ text: contactParts.join('  •  '), color: textColorMuted, size: 16, font: font })
            ]
        }));
    }

    if (p.summary) {
        singleElements.push(createSectionTitle('Perfil Profesional', sectionTitleColor, font));
        singleElements.push(new Paragraph({
            spacing: { before: 40, after: 120 },
            children: [new TextRun({ text: p.summary, color: textColorDark, size: 16.5, font: font })]
        }));
    }

    if (Array.isArray(cvData.experience) && cvData.experience.length > 0) {
        singleElements.push(createSectionTitle('Experiencia', sectionTitleColor, font));
        singleElements.push(...createExperienceItems(cvData.experience, themeColor, textColorDark, textColorMuted, font));
    }

    if (Array.isArray(cvData.education) && cvData.education.length > 0) {
        singleElements.push(createSectionTitle('Educación', sectionTitleColor, font));
        singleElements.push(...createEducationItems(cvData.education, themeColor, textColorDark, textColorMuted, font));
    }

    if (Array.isArray(cvData.skills) && cvData.skills.length > 0) {
        singleElements.push(createSectionTitle('Habilidades', sectionTitleColor, font));
        singleElements.push(...createSkillsElements(cvData.skills, 'list', themeColor, textColorDark, false, font));
    }

    if (Array.isArray(cvData.impacts) && cvData.impacts.length > 0) {
        singleElements.push(createSectionTitle('Impacto Clave', sectionTitleColor, font));
        singleElements.push(...createImpactsElements(cvData.impacts, themeColor, textColorDark, font));
    }

    if (isExecutiveGold) {
        const goldTable = new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: {
                top: { style: BorderStyle.DOUBLE, size: 24, color: themeColor },
                bottom: { style: BorderStyle.DOUBLE, size: 24, color: themeColor },
                left: { style: BorderStyle.DOUBLE, size: 24, color: themeColor },
                right: { style: BorderStyle.DOUBLE, size: 24, color: themeColor },
                insideHorizontal: { style: BorderStyle.NONE },
                insideVertical: { style: BorderStyle.NONE }
            },
            rows: [
                new TableRow({
                    height: { value: 14500, rule: HeightRule.ATLEAST },
                    children: [
                        new TableCell({
                            width: { size: 100, type: WidthType.PERCENTAGE },
                            margins: { top: 500, bottom: 500, left: 600, right: 600 },
                            children: singleElements
                        })
                    ]
                })
            ]
        });

        return new Document({
            sections: [{
                properties: { page: { size: PAGE_SIZE_A4, margin: { top: 500, bottom: 500, left: 500, right: 500 } } },
                children: [goldTable]
            }]
        });
    }

    return new Document({
        sections: [{
            properties: { page: { size: PAGE_SIZE_A4, margin: { top: 720, bottom: 720, left: 720, right: 720 } } },
            children: singleElements
        }]
    });
}

module.exports = {
    buildNativeDocx,
    TEMPLATE_PRESETS
};
