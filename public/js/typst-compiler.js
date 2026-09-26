/**
 * TypstCompiler - Generador y compilador de plantillas de CV en formato Typst
 * Tu-CV-Pro-Edition-Ayarachi
 */

const TypstCompiler = (() => {
  let typstTemplates = {};

  // Función para escapar caracteres especiales de sintaxis Typst en los datos del usuario
  const escapeTypst = (input) => {
    if (input === null || input === undefined) return '';
    const str = typeof input === 'string' ? input : String(input);
    if (!str) return '';
    return str
      .replace(/\\/g, '\\\\')
      .replace(/#/g, '\\#')
      .replace(/\$/g, '\\$')
      .replace(/@/g, '\\@')
      .replace(/\[/g, '\\[')
      .replace(/\]/g, '\\]')
      .replace(/\*/g, '\\*')
      .replace(/_/g, '\\_')
      .replace(/</g, '\\<')
      .replace(/>/g, '\\>')
      .replace(/`/g, '\\`');
  };

  // Cargar las plantillas desde json-typst/typst.json
  const loadTypstTemplates = async () => {
    try {
      const response = await fetch('data/typst/typst.json');
      typstTemplates = await response.json();
      return typstTemplates;
    } catch (error) {
      console.error('Error al cargar plantillas Typst:', error);
      return {};
    }
  };

  // Formateador de fechas para Typst
  const formatDate = (startDate, endDate, current) => {
    if (!startDate) return '';
    const startStr = escapeTypst(startDate);
    if (current) return `${startStr} - Presente`;
    const endStr = endDate ? escapeTypst(endDate) : 'Presente';
    return `${startStr} - ${endStr}`;
  };

  // Renderizador de Secciones en Sintaxis Typst
  const buildTypstSections = (cvData) => {
    let output = '';
    const { sectionOrder, personalInfo, experience, education, skills, impacts, portfolio, themeColor, textColorDark } = cvData;
    const textColorMuted = cvData.textColorMuted || '#6c757d';

    const levelLabels = {
      beginner: 'Principiante',
      intermediate: 'Intermedio',
      advanced: 'Avanzado',
      expert: 'Experto'
    };

    const order = sectionOrder || ['summary', 'experience', 'education', 'skills', 'impacts'];

    order.forEach(sectionKey => {
      if (sectionKey === 'summary' && personalInfo && personalInfo.summary) {
        output += `
#v(10pt)
#text(weight: "bold", size: 11pt, fill: themeColor)[RESUMEN PROFESIONAL]
#v(3pt)
${escapeTypst(personalInfo.summary)}
#v(8pt)
`;
      }

      if (sectionKey === 'experience' && Array.isArray(experience) && experience.length > 0) {
        output += `
#v(10pt)
#text(weight: "bold", size: 11pt, fill: themeColor)[EXPERIENCIA LABORAL]
#v(3pt)
`;
        experience.forEach(exp => {
          const dates = formatDate(exp.startDate, exp.endDate, exp.current);
          output += `
#grid(
  columns: (1fr, auto),
  [*${escapeTypst(exp.position || '')}* - _${escapeTypst(exp.company || '')}_],
  [#text(size: 8.5pt, fill: textColorMuted)[${dates}]]
)
#v(2pt)
${exp.description ? escapeTypst(exp.description).replace(/\n/g, ' \\ ') : ''}
#v(6pt)
`;
        });
      }

      if (sectionKey === 'education' && Array.isArray(education) && education.length > 0) {
        output += `
#v(10pt)
#text(weight: "bold", size: 11pt, fill: themeColor)[EDUCACIÓN Y FORMACIÓN]
#v(3pt)
`;
        education.forEach(edu => {
          const dates = formatDate(edu.startDate, edu.endDate, edu.current);
          output += `
#grid(
  columns: (1fr, auto),
  [*${escapeTypst(edu.degree || '')}* - _${escapeTypst(edu.institution || '')}_],
  [#text(size: 8.5pt, fill: textColorMuted)[${dates}]]
)
#v(2pt)
${edu.description ? escapeTypst(edu.description).replace(/\n/g, ' \\ ') : ''}
#v(6pt)
`;
        });
      }

      if (sectionKey === 'impacts' && Array.isArray(impacts) && impacts.length > 0) {
        output += `
#v(10pt)
#text(weight: "bold", size: 11pt, fill: themeColor)[LOGROS E IMPACTO CLAVE]
#v(3pt)
`;
        impacts.forEach(imp => {
          output += `- ${escapeTypst(imp.description || '')}\n`;
        });
        output += `#v(6pt)\n`;
      }
    });

    return output;
  };

  // Renderizador de Lista de Habilidades para Typst
  const buildTypstSkillsList = (skills) => {
    if (!Array.isArray(skills) || skills.length === 0) return '';
    const levelLabels = {
      beginner: 'Principiante',
      intermediate: 'Intermedio',
      advanced: 'Avanzado',
      expert: 'Experto'
    };
    return skills.map(s => `- *${escapeTypst(s.name)}* (${levelLabels[s.level] || 'Intermedio'})`).join('\n');
  };

  const setTemplates = (templates) => {
    typstTemplates = templates || {};
  };

  // Generar Código Fuente Completo de Typst (.typ)
  const generateTypstSource = (cvData, layoutKey = 'classic', customTemplates = null) => {
    const templatesMap = customTemplates || typstTemplates;
    const selectedLayout = layoutKey || cvData.layout || 'classic';
    let templateRaw = templatesMap[selectedLayout] || templatesMap['classic'] || '';

    const fullName = (window.CvApp && window.CvApp.templateHelpers)
      ? window.CvApp.templateHelpers.getFullName(cvData.personalInfo)
      : `${cvData.personalInfo?.firstName || ''} ${cvData.personalInfo?.lastName || ''}`.trim();

    const initials = (cvData.avatar?.type === 'initials' && cvData.avatar?.value)
      ? cvData.avatar.value
      : ((window.CvApp && window.CvApp.templateHelpers)
          ? window.CvApp.templateHelpers.getInitials(cvData.personalInfo)
          : ((cvData.personalInfo?.firstName?.[0] || '') + (cvData.personalInfo?.lastName?.[0] || '')));

    const sectionsTypst = buildTypstSections(cvData);
    const skillsListTypst = buildTypstSkillsList(cvData.skills);

    let typstCode = templateRaw
      .replace(/\{\{fullName\}\}/g, escapeTypst(fullName))
      .replace(/\{\{initials\}\}/g, escapeTypst(initials.toUpperCase()))
      .replace(/\{\{title\}\}/g, escapeTypst(cvData.personalInfo?.title || ''))
      .replace(/\{\{email\}\}/g, escapeTypst(cvData.personalInfo?.email || ''))
      .replace(/\{\{phone\}\}/g, escapeTypst(cvData.personalInfo?.phone || ''))
      .replace(/\{\{address\}\}/g, escapeTypst(cvData.personalInfo?.address || ''))
      .replace(/\{\{website\}\}/g, escapeTypst(cvData.personalInfo?.website || ''))
      .replace(/\{\{themeColor\}\}/g, cvData.themeColor || '#dc3545')
      .replace(/\{\{textColorDark\}\}/g, cvData.textColorDark || '#212529')
      .replace(/\{\{textColorLight\}\}/g, cvData.textColorLight || '#ffffff')
      .replace(/\{\{textColorMuted\}\}/g, cvData.textColorMuted || '#6c757d')
      .replace(/\{\{sectionsTypst\}\}/g, sectionsTypst)
      .replace(/\{\{skillsListTypst\}\}/g, skillsListTypst);

    return typstCode;
  };

  // Descarga del código fuente Typst (.typ)
  const downloadTypstFile = async (cvData, layoutKey) => {
    if (!typstTemplates || Object.keys(typstTemplates).length === 0) {
      await loadTypstTemplates();
    }
    const layout = layoutKey || cvData.layout || 'classic';
    const code = generateTypstSource(cvData, layout);
    const blob = new Blob([code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const firstName = cvData.personalInfo?.firstName || 'CV';
    const lastName = cvData.personalInfo?.lastName || 'Documento';
    a.download = `CV_${firstName.replace(/ /g, '_')}_${lastName.replace(/ /g, '_')}_${layout}.typ`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return {
    loadTypstTemplates,
    setTemplates,
    generateTypstSource,
    downloadTypstFile
  };
})();

if (typeof window !== 'undefined') {
  window.TypstCompiler = TypstCompiler;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = TypstCompiler;
}
