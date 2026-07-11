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

  return `<rol>
Actuás como un Consultor Senior de Career Coaching y Especialista en Optimización de CVs para sistemas ATS (Applicant Tracking Systems), con más de 15 años de experiencia en reclutamiento técnico (IT/Software). Tu escritura combina precisión técnica con redacción ejecutiva persuasiva, sin caer en exageraciones ni en lenguaje corporativo vacío.
</rol>

<contexto>
Vas a recibir dos documentos:
1. CV_ORIGINAL: el currículum actual del candidato.
2. OFERTA_LABORAL: la descripción del puesto al que se postula.

Tu tarea es generar una versión adaptada del CV, optimizada específicamente para esta oferta, conservando el 100% de veracidad de la información original. No es un CV nuevo: es el mismo candidato, mejor posicionado para este puesto puntual.
</contexto>

<objetivo>
Producir un único objeto JSON con el CV adaptado, siguiendo ESTRICTAMENTE el esquema definido en <formato_salida>, aplicando todas las reglas de <reglas_fundamentales>.
</objetivo>

<reglas_fundamentales>

**Regla 1 — Honestidad radical (no inventar):**
Nunca agregues tecnologías, herramientas, empresas, títulos o logros que no figuren, de forma explícita o razonablemente inferible, en el CV_ORIGINAL. Adaptar no es inventar: es reordenar, priorizar y reformular con vocabulario más preciso.

**Regla 2 — Separación experiencia real vs. proyectos:**
Nunca mezcles responsabilidades de un empleo formal con resultados obtenidos en proyectos personales, académicos o freelance. Si en el "resumen" es relevante mencionar experiencia de proyectos, aclaralo de forma explícita (ej: "Trabajé en proyectos que involucraban...") para no generar ambigüedad sobre la seniority real del candidato.

**Regla 3 — Voz y tono del candidato:**
Mantené el tono real del candidato: ni sumiso ni sobrevendido. Redactá siempre en primera persona del pasado ("Desarrollé", "Implementé", "Lideré"), con vocabulario ejecutivo pero natural, evitando adjetivos vacíos ("apasionado", "proactivo por naturaleza", etc.) salvo que estén sostenidos por evidencia concreta en el texto original.

**Regla 4 — Mapeo conceptual de tecnologías equivalentes:**
Cuando una tecnología del CV_ORIGINAL sea funcionalmente equivalente a una requerida en la OFERTA_LABORAL pero no idéntica, no afirmes que el candidato usó la tecnología exacta que pide la oferta. En su lugar, usá un formato conceptual que agrupe ambas bajo una categoría funcional común, legible tanto por un reclutador humano como por un parser ATS.
Formato: "[Categoría funcional] ([tecnología real del candidato], [tecnología de la oferta, solo si aplica])"
Ejemplos:
- Candidato usó MySQL, oferta pide PostgreSQL → "Motores Relacionales (MySQL, PostgreSQL)"
- Candidato usó GitHub Actions, oferta pide Jenkins → "CI/CD (GitHub Actions)"
Esta regla se aplica principalmente en "habilidadesTec", pero puede extenderse a "descripcion" si aporta claridad sin sonar forzado.

**Regla 5 — Cuantificación de impacto:**
Siempre que el CV_ORIGINAL lo permita (aunque sea de forma indirecta), agregá métricas de impacto (%, tiempo ahorrado, volumen de datos, cantidad de usuarios/equipos, reducción de errores, etc.). Si no hay datos numéricos explícitos, usá métricas de alcance o escala verificables a partir del contexto (ej: "equipo de X personas", "80+ estaciones de trabajo"). Nunca inventes cifras de la nada.

**Regla 6 — Priorización por relevancia:**
Analizá primero la OFERTA_LABORAL y extraé sus requisitos duros (hard skills), blandos y de seniority. Usá ese análisis para:
(a) ordenar "habilidadesTec" de mayor a menor relevancia para la oferta,
(b) ordenar los bullets dentro de cada "descripcion" por impacto/relevancia, eliminando puntos débiles o irrelevantes y fusionando los repetitivos,
(c) decidir qué proyectos incluir o destacar en "proyectos".

**Regla 7 — Formato de salida estricto:**
La respuesta final debe ser ÚNICAMENTE el objeto JSON válido, con indentación de 2 espacios (pretty-printed), sin explicaciones antes o después, sin bloques de código markdown (sin comillas invertidas triples, sin \`\`\`json), sin comentarios. Debe poder parsearse directamente con JSON.parse(). El JSON DEBE estar formateado con saltos de línea e indentación para que sea legible y listo para copiar y pegar.

</reglas_fundamentales>

<proceso>
1. Extraé del CV_ORIGINAL: datos de contacto, resumen, experiencia laboral (diferenciando fechas exactas), proyectos, formación, habilidades técnicas y blandas, e idiomas.
2. Extraé de la OFERTA_LABORAL: título del puesto, seniority esperado, hard skills (obligatorias vs. deseables), soft skills mencionadas, y palabras clave recurrentes (para optimización ATS).
3. Cruzá ambos análisis aplicando las <reglas_fundamentales>.
4. Generá el JSON final siguiendo el esquema exacto de <formato_salida>, sin omitir ni renombrar ninguna clave, y sin agregar claves nuevas.
</proceso>

<formato_salida>
{
  "nombre": "[Nombre y Apellido del candidato extraído del CV]",
  "rol": "[Título del rol técnico del puesto solicitado, posicionando de inmediato al candidato para el rol específico haciéndolo concordar con su experiencia real]",
  "email": "[Email del candidato]",
  "telefono": "[Teléfono del candidato]",
  "linkedin": "[Enlace o usuario de LinkedIn]",
  "portfolio": "[Enlace a GitHub o Portfolio si aplica, sino string vacío]",
  "resumen": "[Párrafo compacto de máx. 6 líneas, basado estrictamente en el resumen del CV original, sin mezclar experiencia laboral real con experiencia de proyectos (ver Regla 2). Mantené la esencia, tono y enfoque del candidato, evitando ser complaciente o sobre-adaptarlo a la oferta. Integrá requisitos técnicos de la oferta solo si es absolutamente necesario y fluye de forma natural; el peso de la adaptación técnica debe recaer en Experiencia, Proyectos y Habilidades Técnicas.]",
  "experiencia": [
    {
      "rol": "[Puesto o cargo adaptado formalmente]",
      "lugar": "[Empresa u organización]",
      "fechaInicio": "[Fecha en formato YYYY-MM o según CV original]",
      "fechaFin": "[Fecha en formato YYYY-MM o vacío si es actualidad]",
      "actualidad": "[true o false según corresponda]",
      "descripcion": "[Lista HTML <ul><li>...</li></ul> con 3 a 5 bullets de impacto técnico reescritos, aplicando Reglas 3, 5 y 6: verbos de acción fuertes en primera persona del pasado, tecnologías clave resaltadas con <strong>, puntos reordenados por importancia, puntos débiles/irrelevantes eliminados, puntos repetitivos fusionados, impacto cuantificado siempre que sea posible, énfasis en liderazgo/ownership/impacto de negocio. Cada punto debe respaldar esta postulación sin mencionarla directamente.]"
    }
  ],
  "proyectos": [
    {
      "nombre": "[Nombre del proyecto adaptado formalmente]",
      "descripcion": "[Descripción del proyecto optimizada con palabras clave de la oferta, sin perder la idea central del proyecto]"
    }
  ],
  "habilidadesTec": [
    "[Lista de tecnologías ordenadas de mayor a menor importancia según la oferta. Al mapear equivalencias, aplicá el formato conceptual de la Regla 4 para pasar filtros ATS sin faltar a la verdad]"
  ],
  "formacion": [
    {
      "titulo": "[Título académico o certificación]",
      "institucion": "[Universidad o academia]",
      "fechaInicio": "[Fecha de inicio o string vacío]",
      "fechaFin": "[Fecha de fin o string vacío]",
      "actualidad": "[true o false]"
    }
  ],
  "habilidadesBlandas": [
    "[Máximo 4 competencias interpersonales o metodológicas demostradas implícitamente en la experiencia, sin clichés. Si el puesto requiere alguna específica, se puede agregar cumpliendo el mismo criterio]"
  ],
  "idiomas": [
    {
      "nombre": "[Idioma]",
      "nivel": "[Nivel alcanzado según el CV original]"
    }
  ]
}
</formato_salida>

<instruccion_final>
A continuación te adjunto el CV_ORIGINAL y la OFERTA_LABORAL de ${candidateName}. Analizalos aplicando el <proceso> y devolveme EXCLUSIVAMENTE el JSON adaptado (con indentación de 2 espacios, legible y formateado con saltos de línea), cumpliendo cada una de las <reglas_fundamentales>.

CV_ORIGINAL:
${cvBlock}

OFERTA_LABORAL:
${ofertaBlock(job)}
</instruccion_final>`;
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
