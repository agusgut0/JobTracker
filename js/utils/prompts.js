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

  if (cvData.nombre)   sections.push(`NOMBRE: ${cvData.nombre}`);
  if (cvData.rol)      sections.push(`ROL / PUESTO ACTUAL: ${cvData.rol}`);

  // Contact info
  const contactParts = [];
  if (cvData.email)     contactParts.push(`Email: ${cvData.email}`);
  if (cvData.telefono)  contactParts.push(`Teléfono: ${cvData.telefono}`);
  if (cvData.linkedin)  contactParts.push(`LinkedIn: ${cvData.linkedin}`);
  if (cvData.portfolio) contactParts.push(`Portfolio: ${cvData.portfolio}`);
  if (contactParts.length) sections.push(`DATOS DE CONTACTO:\n${contactParts.join('\n')}`);

  if (cvData.resumen)            sections.push(`RESUMEN PROFESIONAL:\n${cvData.resumen}`);

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

Tu objetivo es adaptar de forma estratégica el CV del candidato para la oferta laboral provista, maximizando el "Keyword Match" sin caer en prácticas de spam y manteniendo la autenticidad del perfil.

=== REGLAS ESTRICTAS DE NEGOCIO ===
1. PROHIBIDO INVENTAR: No agregues tecnologías, herramientas, años de experiencia o roles que el candidato no mencione en su CV original.
2. LIMITACIÓN DE MÉTRICAS: Si el CV original no tiene métricas numéricas, no las inventes. En su lugar, usá la estructura de impacto: "Acción (Verbo) + Contexto Técnico + Resultado/Propósito" (Método XYZ de Google).
3. TONO: Profesional, técnico, directo y orientado al logro. Evitá adjetivos vacíos como "motivado", "proactivo" o "apasionado".

=== CV ORIGINAL (${candidateName}) ===
${cvBlock}

=== OFERTA LABORAL ===
${ofertaBlock(job)}

Analizá ambas fuentes y devolvé la información estructurada bajo el siguiente formato:

### 1. Diagnóstico de Adaptación (Breve)
* **Keywords Críticas Insertadas:** [Lista de 5-7 términos técnicos o metodologías de la oferta que se incorporaron orgánicamente].
* **Estrategia de Descarte:** [Qué proyectos o tecnologías secundarias del CV original sugerís pasar a segundo plano o resumir para que no hagan "ruido" visual en esta postulación].

### 2. Resumen Profesional Optimizado (Máx. 4 líneas)
TITULO: [Escribi el rol técnico del puesto solicitante haciendolo concordar con la experiencia del usuario]
[Escribí un párrafo compacto que responda: Qué es (Rol técnico) + Cuánta experiencia/Seniority tiene + Stack principal relevante para la oferta + Mayor valor que aporta para resolver el problema de la empresa].

### 3. Core Skills Reordenadas
* **Technical Skills (Relevantes para el puesto):** [Tecnologías ordenadas de Mayor a Menor importancia según la oferta].
* **Tools & Methodologies:** [Herramientas, metodologías ágiles o ERPs críticos para este rol].

### 4. Bloque de Experiencia Rediseñado (Los 4-6 bullets más potentes)
[Reescribí los bullets de los trabajos más relevantes usando verbos de acción fuertes en primera persona del pasado (ej: "Diseñé", "Optimicé", "Implementé"). Asegurate de que la tecnología de la oferta aparezca en el contexto de la acción].

### 5. CV Completo Reestructurado (Listo para copiar)
[Generá la versión final unificada del CV utilizando los datos de contacto del original e integrando las optimizaciones previas. Excluí tablas u otros elementos visuales complejos. El formato debe seguir estrictamente este orden y diseño en Markdown limpio]:

# [NOMBRE Y APELLIDO DEL CANDIDATO]
[Datos de contacto: Email | LinkedIn | Teléfono | Ubicación]

## Perfil profesional
[Inserta el título del rol]
[Insertar acá el párrafo del Resumen Profesional Optimizado generado en el punto 2].

## Experiencia Laboral
[Estructurar de forma cronológica inversa: **Puesto** - Empresa (Mes/Año Inicio - Mes/Año Fin o Actualidad). Incorporar debajo de cada rol los bullets de impacto técnico diseñados en el punto 4].

## Formación académica
[Listar títulos, instituciones y estado/fechas extraídos estrictamente del CV original].

## Habilidades técnicas
* **Lenguajes y Tecnologías:** [Listado limpio de tecnologías relevantes priorizadas para el puesto].
* **Sistemas y Herramientas:** [ERPs, plataformas de automatización, bases de datos o software específico del CV que aplique al rol].

## Habilidades blandas & Idiomas
* **Habilidades Blandas:** [Máximo 4 competencias interpersonales o metodológicas demostradas implícitamente en la experiencia del candidato, sin usar clichés].
* **Idiomas:** [Listar idiomas y niveles según el CV original].`;
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
