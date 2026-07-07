/**
 * UTILS / PROMPTS — Pure functions.
 * Each function receives job data + cvData (object) and returns a prompt string.
 * Zero side effects. Zero DOM access.
 */

/**
 * Builds a formatted offer block used inside every prompt.
 * @param {Object} job
 * @returns {string}
 */
function ofertaBlock(job) {
  return `Puesto: ${job.puesto}
Empresa: ${job.empresa}
${job.link ? `Link: ${job.link}\n` : ''}
Descripción / Requisitos:
${job.desc || '(sin descripción proporcionada)'}`.trim();
}

/**
 * Formats the cvData object into a readable text block for AI prompts.
 * @param {Object} cvData
 * @returns {string}
 */
function formatCVForPrompt(cvData) {
  const sections = [];

  if (cvData.nombre) sections.push(`NOMBRE: ${cvData.nombre}`);
  if (cvData.rol) sections.push(`ROL / PUESTO ACTUAL: ${cvData.rol}`);

  // Contact info
  const contactParts = [];
  if (cvData.email) contactParts.push(`Email: ${cvData.email}`);
  if (cvData.telefono) contactParts.push(`Teléfono: ${cvData.telefono}`);
  if (cvData.linkedin) contactParts.push(`LinkedIn: ${cvData.linkedin}`);
  if (cvData.portfolio) contactParts.push(`Portfolio: ${cvData.portfolio}`);
  if (contactParts.length) sections.push(`DATOS DE CONTACTO:\n${contactParts.join('\n')}`);

  if (cvData.resumen) sections.push(`RESUMEN PROFESIONAL:\n${cvData.resumen}`);

  // Experiencia: soporta array estructurado y string legacy
  if (cvData.experiencia) {
    if (Array.isArray(cvData.experiencia) && cvData.experiencia.length > 0) {
      const expBlocks = cvData.experiencia.map(exp => {
        const parts = [];
        if (exp.rol) parts.push(`Rol: ${exp.rol}`);
        if (exp.lugar) parts.push(`Empresa: ${exp.lugar}`);
        const start = exp.fechaInicio || '';
        const end = exp.actualidad ? 'Actualidad' : (exp.fechaFin || '');
        if (start || end) parts.push(`Período: ${[start, end].filter(Boolean).join(' – ')}`);
        if (exp.descripcion) {
          // Strip HTML tags for prompt
          const plain = exp.descripcion.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
          if (plain) parts.push(`Descripción: ${plain}`);
        }
        return parts.join('\n');
      });
      sections.push(`EXPERIENCIA LABORAL:\n${expBlocks.join('\n---\n')}`);
    } else if (typeof cvData.experiencia === 'string' && cvData.experiencia.trim()) {
      sections.push(`EXPERIENCIA LABORAL:\n${cvData.experiencia}`);
    }
  }

  if (cvData.proyectos) {
    if (Array.isArray(cvData.proyectos) && cvData.proyectos.length > 0) {
      const proyBlocks = cvData.proyectos.map(proy => {
        const parts = [];
        if (proy.nombre) parts.push(`Proyecto: ${proy.nombre}`);
        if (proy.descripcion) {
          const plain = proy.descripcion.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
          if (plain) parts.push(`Descripción: ${plain}`);
        }
        return parts.join('\n');
      });
      sections.push(`PROYECTOS:\n${proyBlocks.join('\n---\n')}`);
    } else if (typeof cvData.proyectos === 'string' && cvData.proyectos.trim()) {
      sections.push(`PROYECTOS:\n${cvData.proyectos}`);
    }
  }

  if (cvData.habilidadesTec) {
    const arr = Array.isArray(cvData.habilidadesTec) ? cvData.habilidadesTec : [cvData.habilidadesTec];
    if (arr.length && arr.some(Boolean)) sections.push(`HABILIDADES TÉCNICAS:\n${arr.join(', ')}`);
  }

  if (cvData.formacion) {
    if (Array.isArray(cvData.formacion) && cvData.formacion.length > 0) {
      const formBlocks = cvData.formacion.map(form => {
        const parts = [];
        if (form.titulo) parts.push(`Título: ${form.titulo}`);
        if (form.institucion) parts.push(`Institución: ${form.institucion}`);
        const start = form.fechaInicio || '';
        const end = form.actualidad ? 'Actualidad' : (form.fechaFin || '');
        if (start || end) parts.push(`Período: ${[start, end].filter(Boolean).join(' – ')}`);
        return parts.join('\n');
      });
      sections.push(`FORMACIÓN ACADÉMICA:\n${formBlocks.join('\n---\n')}`);
    } else if (typeof cvData.formacion === 'string' && cvData.formacion.trim()) {
      sections.push(`FORMACIÓN ACADÉMICA:\n${cvData.formacion}`);
    }
  }

  if (cvData.habilidadesBlandas) {
    const arr = Array.isArray(cvData.habilidadesBlandas) ? cvData.habilidadesBlandas : [cvData.habilidadesBlandas];
    if (arr.length && arr.some(Boolean)) sections.push(`HABILIDADES BLANDAS:\n${arr.join(', ')}`);
  }

  if (cvData.idiomas) {
    let idStr = '';
    if (Array.isArray(cvData.idiomas) && cvData.idiomas.length > 0) {
      idStr = cvData.idiomas.map(i => `${i.nombre} (${i.nivel})`).join(', ');
    } else if (typeof cvData.idiomas === 'string' && cvData.idiomas.trim()) {
      idStr = cvData.idiomas;
    }
    if (idStr) sections.push(`IDIOMAS: ${idStr}`);
  }

  return sections.join('\n\n');
}

// ── Prompt: Analizar FIT ─────────────────────────────────────────────────────
/**
 * Full autonomous prompt for fit analysis (works in any AI).
 */
export function promptFIT(job, cvData) {
  const candidateName = cvData.nombre || 'Candidato';
  const cvBlock = formatCVForPrompt(cvData);

  return `Actuá como un Lead Technical Recruiter y experto en selección de talento IT de alta exigencia. Tu objetivo es realizar un screening objetivo, riguroso y libre de sesgos normativos, penalizando la falta de evidencia explícita en el CV.

Analizá la compatibilidad entre el CV del candidato y la oferta laboral provista.

=== INSTRUCCIONES DE EVALUACIÓN ===
1. Sé estricto con el Seniority y los Stack Tecnológicos: Si la oferta pide una tecnología como "Excluyente" y no está explícita en el CV, asumí que no la posee y penalizá el puntaje.
2. No asumas experiencia: La proximidad de un término no implica dominio. Evaluá según proyectos, años de uso o logros descritos.
3. Justificación basada en datos: Cada fortaleza o brecha debe hacer referencia directa a una sección del CV o de la oferta.

=== CV DEL CANDIDATO (${candidateName}) ===
${cvBlock}

=== OFERTA LABORAL ===
${ofertaBlock(job)}

Respondé estrictamente con el siguiente formato Markdown, manteniendo un tono profesional, crítico y corporativo:

### 1. Score de Fit General
* **Porcentaje de Fit:** [X]% (Calculado de forma matemática: ponderá 60% Hard Skills excluyentes, 20% Seniority/Metodologías, 20% Soft Skills/Cultura).
* **Justificación Ejecutiva:** [Máximo 3 líneas que resuman el porqué de la calificación].

### 2. Fortalezas Clave (Máx. 5 puntos)
* [Categoría: Hard/Soft/Logro] - **[Habilidad]:** [Breve evidencia del CV que lo respalda].

### 3. Brechas Críticas y Áreas a Reforzar (Máx. 3 puntos)
* [Categoría: Stack/Seniority/Falta de Evidencia] - **[Brecha]:** [Qué le falta o qué no está claro en el CV respecto a la oferta].

### 4. Recomendación y Next Steps
* **Decisión:** [Aplicar / Aplicar con nota de atención / No aplicar]
* **Fundamento:** [Una sola línea estratégica].
* **Pregunta de Validación:** [Sugerí una pregunta técnica o de comportamiento clave que el reclutador debería hacerle en la primera entrevista para validar la brecha más importante encontrada].`;
}

// ── Prompt: Adaptar CV ───────────────────────────────────────────────────────
/**
 * Full autonomous CV adaptation prompt (works in any AI).
 */
export function promptAdaptarCV(job, cvData) {
  const candidateName = cvData.nombre || 'Candidato';
  const cvBlock = formatCVForPrompt(cvData);

  return `Actuá como un experto en Redacción de CVs de Alto Impacto para el sector IT y especialista en optimización de algoritmos ATS (Applicant Tracking Systems). 

Tu objetivo es adaptar de forma estratégica el CV del candidato para la oferta laboral provista, maximizando el "Keyword Match" mediante la homologación de tecnologías equivalentes, sin caer en prácticas de spam y manteniendo la estricta autenticidad del perfil.

=== REGLAS ESTRICTAS DE NEGOCIO ===
1. PROHIBIDO INVENTAR: No agregues tecnologías, herramientas o roles que el candidato no domine en absoluto. Sin embargo, SI la oferta pide una tecnología que el candidato no tiene, pero el candidato posee una EQUIVALENTE directa (ej. pide SQLite y tiene MySQL, pide Vue y tiene React), debés aplicar la REGLA DE HOMOLOGACIÓN (ver Regla 4).
2. LIMITACIÓN DE MÉTRICAS: Si el CV original no tiene métricas numéricas, no las inventes. En su lugar, usá la estructura de impacto: "Acción (Verbo) + Contexto Técnico + Resultado/Propósito" (Método XYZ de Google).
3. TONO: Profesional, técnico, directo y orientado al logro. Evitá adjetivos vacíos como "motivado", "proactivo" o "apasionado".
4. REGLA DE HOMOLOGACIÓN PARA ATS: Para no perder palabras clave críticas de la oferta, agrupá las tecnologías por conceptos generales. Si la oferta pide un motor o framework específico que el candidato no tiene pero maneja su equivalente conceptual, reflejá esa equivalencia aclarando el nivel (ej: "Bases de Datos Relacionales: MySQL / SQLite [nociones]" o "Frameworks Frontend: React (Avanzado) / Vue [adaptabilidad]").

=== CV ORIGINAL (${candidateName}) ===
${cvBlock}

=== OFERTA LABORAL ===
${ofertaBlock(job)}

=== INSTRUCCIONES DE FORMATO Y SALIDA ===
Analizá ambas fuentes y devolvé la información adaptada **ÚNICA Y EXCLUSIVAMENTE** en un bloque de código JSON válido, sin textos introductorios ni explicaciones posteriores. 

El JSON debe respetar estrictamente la siguiente estructura de tipos y campos:

{
  "nombre": "[Nombre y Apellido del candidato extraído del CV]",
  "rol": "[Título del rol técnico del puesto solicitado, haciéndolo concordar con la experiencia del usuario]",
  "email": "[Email del candidato]",
  "telefono": "[Teléfono del candidato]",
  "linkedin": "[Enlace o usuario de LinkedIn]",
  "portfolio": "[Enlace a GitHub o Portfolio si aplica, sino string vacío]",
  "resumen": "[Escribí un párrafo compacto de máx 4 líneas basado estrictamente en el resumen del CV original. Mantené la esencia, tono y enfoque del candidato, evitando ser complaciente o sobre-adaptarlo a la oferta. Integrá requisitos técnicos de la oferta en este bloque solo si es absolutamente necesario y fluye de forma natural; el peso de la adaptación técnica debe recaer en las secciones de Experiencia, Proyectos y Habilidades Técnicas.]",
  "experiencia": [
    {
      "rol": "[Puesto o Cargo adaptado formalmente]",
      "lugar": "[Empresa u Organización]",
      "fechaInicio": "[Fecha en formato YYYY-MM o según CV original]",
      "fechaFin": "[Fecha en formato YYYY-MM o vacío si es actualidad]",
      "actualidad": [true o false según corresponda],
      "descripcion": "[Generá una lista HTML con etiquetas <ul><li>...</li></ul> que contenga entre 3 y 5 bullets de impacto técnico reescritos. Usá verbos de acción fuertes en primera persona del pasado. Resaltá las tecnologías clave usando la etiqueta <strong>. Si aplica, mencioná cómo la tecnología base del candidato se relaciona con la requerida]"
    }
  ],
  "proyectos": [
    {
      "nombre": "[Nombre del proyecto adaptado formalmente]",
      "descripcion": "[Descripción del proyecto optimizada para las palabras clave de la oferta]"
    }
  ],
  "habilidadesTec": [
    "[Lista de tecnologías ordenadas de Mayor a Menor importancia según la oferta. Cuando mapees equivalencias, usá el formato conceptual de la Regla 4 (ej: 'Motores Relacionales (MySQL, SQLite)') para pasar los filtros de los ATS sin mentir]"
  ],
  "formacion": [
    {
      "titulo": "[Título académico o certificación]",
      "institucion": "[Universidad o Academia]",
      "fechaInicio": "[Fecha de inicio o string vacío]",
      "fechaFin": "[Fecha de fin o string vacío]",
      "actualidad": [true o false]
    }
  ],
  "habilidadesBlandas": [
    "[Máximo 4 competencias interpersonales o metodológicas demostradas implícitamente en la experiencia, sin usar clichés]"
  ],
  "idiomas": [
    {
      "nombre": "[Idioma]",
      "nivel": "[Nivel alcanzado según el CV original]"
    }
  ]
}`;
}

// ── Prompt: Crear Carta de Presentación ─────────────────────────────────────
/**
 * Full autonomous cover letter prompt (works in any AI).
 */
export function promptCarta(job, cvData) {
  const candidateName = cvData.nombre || 'Candidato';
  const cvBlock = formatCVForPrompt(cvData);

  return `Actuá como un experto en Outbound Recruiting y Copywriting Profesional para el sector IT. 

Tu objetivo es redactar un mensaje de contacto (Pitch de Enganche) hiperconciso, directo y de alto impacto para enviarle a un reclutador. El texto debe generar la curiosidad justa para que el reclutador desee abrir el CV adjunto o revisar el perfil del candidato, evitando repetir el CV entero en prosa.

=== REGLAS DE REDACCIÓN ===
1. BREVEDAD ABSOLUTA: El mensaje no debe superar las 150 palabras en su versión de Email y debe ser extremadamente directo.
2. ENFOQUE EN VALOR: En lugar de decir "tengo experiencia en X", redactalo como "en mi rol actual me enfoco en resolver [Problema clave de la oferta] mediante [habilidades/herramientas relevantes del candidato]".
3. TONO: Profesional, moderno, fresco y al grano. Quedan prohibidos los saludos excesivamente formales (ej: "De mi mayor consideración", "Estimado/a señor/a") y las frases cliché.

=== CV DEL CANDIDATO (${candidateName}) ===
${cvBlock}

=== OFERTA LABORAL ===
${ofertaBlock(job)}

Analizá la oferta y devolvé **únicamente** las siguientes dos opciones de mensajes listos para rellenar (con marcadores entre corchetes como [Nombre del Recruiter] si aplica):

### Opción 1: Versión para Email (Forzar estructura rígida de 3 párrafos)
[Escribí un asunto magnético. El cuerpo debe tener exactamente 3 párrafos:
P1: Resumen breve de tu perfil.
P2: Interés en la vacante X + "Soy especialista en...".
P3: Motivación por la empresa, retos y disponibilidad.
Cierre estricto (copiar literal): "de antemano agradezco su atención, espero que tengan un buen día. Atte. ${candidateName}"].

### Opción 2: Versión para LinkedIn (Formato ultra-corto de red)
[Generá un mensaje con exactamente esta estructura rellenando los corchetes: "Hola [Nombre de recruiter]! vi la búsqueda de [Postulación laboral] y creo que mi experiencia encaja con el puesto... [Texto breve de match]... Te dejo mi CV si te interesa profundizar. Saludos!"].`;
}

// ── Filename helpers ─────────────────────────────────────────────────────────
/**
 * Generates a safe filename slug from a company name.
 * @param {string} empresa
 * @param {'cv'|'carta'} type
 * @returns {string}
 */
export function docFilename(empresa, type) {
  const slug = empresa
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .trim()
    .replace(/\s+/g, '_')
    .substring(0, 40);

  return type === 'cv'
    ? `CV_Adaptado_${slug}.doc`
    : `Carta_Presentacion_${slug}.doc`;
}
