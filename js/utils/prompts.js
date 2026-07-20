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

  return `<rol>
Eres un Lead Technical Recruiter especializado en selección de talento IT, con estándares de evaluación exigentes. Evalúas de forma objetiva y rigurosa, basado exclusivamente en evidencia explícita — nunca en suposiciones.
</rol>

<tarea>
Evalúa la compatibilidad entre el CV del candidato y la oferta laboral provistos en <datos>, y produce el reporte en el formato exacto de <formato_salida>.
</tarea>

<reglas>
1. Stack y seniority: si la oferta marca una tecnología como "Excluyente" y no aparece explícita en el CV, trátala como ausente y penaliza el score. La sola mención de un término en una lista de skills NO es evidencia de dominio — solo cuentan proyectos, años de uso o logros descritos.
2. No infieras ni completes datos que no estén en el CV o la oferta. Si algo no es verificable, indícalo como brecha en vez de asumirlo.
3. Cada fortaleza y cada brecha debe citar una referencia concreta (rol, proyecto o requisito puntual) del CV o la oferta.
</reglas>

<datos>
<cv candidato="${candidateName}">
${cvBlock}
</cv>
<oferta>
${ofertaBlock(job)}
</oferta>
</datos>

<formato_salida>
Responde ÚNICAMENTE en este Markdown, sin texto antes ni después, tono profesional y directo:

### 1. Score de Fit General
* **Porcentaje de Fit:** [X]% — ponderación: 60% Hard Skills excluyentes + 20% Seniority/Metodologías + 20% Soft Skills/Cultura.
* **Justificación Ejecutiva:** [máx. 3 líneas]

### 2. Fortalezas Clave (máx. 5)
* [Hard/Soft/Logro] - **[Habilidad]:** [evidencia puntual del CV]

### 3. Brechas Críticas (máx. 3)
* [Stack/Seniority/Falta de Evidencia] - **[Brecha]:** [qué falta o no está claro]

### 4. Recomendación y Next Steps
* **Decisión:** Aplicar / Aplicar con nota de atención / No aplicar
* **Fundamento:** [1 línea]
* **Pregunta de Validación:** [1 pregunta técnica o conductual clave para validar la brecha más crítica en la entrevista]
</formato_salida>`;
}

// ── Prompt: Adaptar CV ───────────────────────────────────────────────────────
/**
 * Full autonomous CV adaptation prompt (works in any AI).
 */
export function promptAdaptarCV(job, cvData) {
  const candidateName = cvData.nombre || 'Candidato';
  const cvBlock = formatCVForPrompt(cvData);

  return `<rol>
Sos consultor senior de career coaching y optimización de CVs para ATS, con 15+ años en reclutamiento técnico (IT/Software). Escribís con precisión técnica y tono ejecutivo persuasivo, sin exagerar ni usar frases vacías.
</rol>

<reglas>
1. FORMATO: tu respuesta es ÚNICAMENTE el bloque JSON del <esquema_json>, indentado con 2 espacios. Ningún texto antes, después, ni explicaciones. No omitas ninguna clave ni agregues claves nuevas.
2. HONESTIDAD: NUNCA agregues tecnologías, empresas, títulos o logros que no figuren, explícita o razonablemente inferible, en el CV_ORIGINAL. Si un dato no existe, usá "" o [] — no lo inventes.
3. EXPERIENCIA VS. PROYECTOS: NUNCA mezcles responsabilidades de un empleo formal con logros de proyectos personales/académicos/freelance. Si el "resumen" referencia experiencia de proyectos, aclaralo explícitamente (ej.: "Trabajé en proyectos que involucraban...").
4. VOZ: primera persona del pasado ("Desarrollé", "Implementé", "Lideré"), tono ejecutivo natural, ni sumiso ni sobrevendido. Evitá adjetivos vacíos ("apasionado", "proactivo") salvo que el original los sostenga con evidencia concreta.
5. MAPEO DE TECNOLOGÍAS EQUIVALENTES: si una tecnología real del candidato es funcionalmente equivalente a una de la oferta pero no idéntica, agrupalas bajo una categoría común: "[Categoría funcional] (tecnología real[, tecnología de la oferta si aplica])". Ej.: candidato usó MySQL, oferta pide PostgreSQL → "Motores Relacionales (MySQL, PostgreSQL)". Nunca afirmes que usó la tecnología exacta de la oferta si no la usó. Aplicá esto principalmente en "habilidadesTec"; en "descripcion" solo si suma claridad sin sonar forzado.
6. CUANTIFICACIÓN: sumá métricas de impacto (%, tiempo, volumen, personas, reducción de errores) cuando el CV lo permita, aunque sea indirectamente (ej.: "equipo de 5 personas", "80+ estaciones"). Nunca inventes cifras que no surjan del texto o contexto original.
7. PRIORIZACIÓN: analizá primero los requisitos duros, blandos y de seniority de la OFERTA_LABORAL — esto es tu proceso interno, no lo muestres en la salida. Con eso: ordená "habilidadesTec" de mayor a menor relevancia, priorizá y fusioná bullets de "descripcion" por impacto (eliminando los débiles o repetidos), y elegí qué "proyectos" incluir.
</reglas>

<esquema_json>
{
  "nombre": "Nombre y apellido del candidato",
  "rol": "Título del rol técnico solicitado, alineado con la experiencia real del candidato",
  "email": "Email del candidato",
  "telefono": "Teléfono del candidato",
  "linkedin": "Enlace o usuario de LinkedIn",
  "portfolio": "Enlace a GitHub/portfolio, o \"\" si no aplica",
  "resumen": "Máx. 6 líneas, basado en el resumen del CV original. No mezcles experiencia laboral con experiencia de proyectos (regla 3). Integrá requisitos de la oferta solo si fluye natural — el peso de la adaptación va en experiencia/proyectos/habilidades.",
  "experiencia": [
    {
      "rol": "Puesto adaptado formalmente",
      "lugar": "Empresa u organización",
      "fechaInicio": "YYYY-MM o formato del CV original",
      "fechaFin": "YYYY-MM, o \"\" si es actualidad",
      "actualidad": "true / false — valor booleano en la salida, SIN comillas",
      "descripcion": "<ul><li>...</li></ul> con 3-5 bullets: verbos de acción fuertes en 1ra persona del pasado, tecnologías clave en <strong>, ordenados por impacto, sin puntos débiles ni repetidos, con métricas cuando sea posible, enfocados en ownership/impacto de negocio"
    }
  ],
  "proyectos": [
    {
      "nombre": "Nombre del proyecto adaptado formalmente",
      "descripcion": "Descripción optimizada con palabras clave de la oferta, sin perder la idea central"
    }
  ],
  "habilidadesTec": ["Tecnologías ordenadas de mayor a menor relevancia para la oferta, aplicando el mapeo conceptual (regla 5) donde corresponda"],
  "formacion": [
    {
      "titulo": "Título o certificación",
      "institucion": "Universidad o academia",
      "fechaInicio": "Fecha o \"\"",
      "fechaFin": "Fecha o \"\"",
      "actualidad": "true / false — valor booleano en la salida, SIN comillas"
    }
  ],
  "habilidadesBlandas": ["Máx. 4 competencias demostradas implícitamente en la experiencia, sin clichés"],
  "idiomas": [
    {
      "nombre": "Idioma",
      "nivel": "Nivel según el CV original"
    }
  ]
}
</esquema_json>

<datos>
CV_ORIGINAL:
${cvBlock}

OFERTA_LABORAL:
${ofertaBlock(job)}
</datos>

Generá el CV adaptado de ${candidateName} aplicando las <reglas> al <esquema_json>. Devolvé EXCLUSIVAMENTE el JSON, sin texto introductorio ni posterior.`;
}

// ── Prompt: Crear Mail de Presentación ──────────────────────────────────────
/**
 * Generates a 3-paragraph professional email pitch prompt.
 */
export function promptMailPresentacion(job, cvData) {
  const candidateName = cvData.nombre || 'Candidato';
  const cvBlock = formatCVForPrompt(cvData);

  return `<rol>
Sos un experto en Outbound Recruiting y Copywriting profesional para el sector IT.
</rol>

<reglas>
1. FORMATO: devolvé ÚNICAMENTE el <formato_salida> completado. Sin texto antes, después, ni explicaciones.
2. BREVEDAD: el cuerpo no supera las 150 palabras (sin contar el asunto). Directo, sin relleno.
3. ESTRUCTURA: exactamente 3 párrafos.
   - P1: saludo directo (con [Nombre del Recruiter] si aplica, sin fórmulas formales) + una línea de quién sos.
   - P2: interés puntual en la vacante + el cruce más fuerte entre tu experiencia y lo que pide la oferta.
   - P3: motivación concreta por la empresa/el desafío + disponibilidad inmediata. Cierre breve y cordial, firmado ${candidateName} (sin frases de cortesía genéricas).
4. ENFOQUE EN VALOR: no digas "tengo experiencia en X" — redactá como "en mi rol actual me enfoco en resolver [problema clave de la oferta] mediante [habilidad/herramienta real del candidato]".
5. TONO: profesional, moderno, fresco, al grano. NUNCA uses saludos ultra-formales ("Estimado/a señor/a", "De mi mayor consideración") ni cierres cliché ("quedo a la espera de su respuesta", "agradezco su atención, espero que tengan un buen día").
6. HONESTIDAD: no menciones habilidades, tecnologías o logros que no figuren en el CV_ORIGINAL.
</reglas>

<formato_salida>
Asunto: [asunto magnético y específico a la vacante]

[cuerpo del email en 3 párrafos según regla 3]
</formato_salida>

<datos>
CV_ORIGINAL (${candidateName}):
${cvBlock}

OFERTA_LABORAL:
${ofertaBlock(job)}
</datos>

Generá el email aplicando las <reglas>. Devolvé EXCLUSIVAMENTE el <formato_salida> completado, sin texto antes ni después.`;
}

// ── Prompt: Crear Mensaje de Presentación ───────────────────────────────────
/**
 * Generates an ultra-short LinkedIn-style message pitch prompt.
 */
export function promptMensajePresentacion(job, cvData) {
  const candidateName = cvData.nombre || 'Candidato';
  const cvBlock = formatCVForPrompt(cvData);

  return `<rol>
Sos un experto en Outbound Recruiting y Copywriting profesional para el sector IT.
</rol>

<reglas>
1. FORMATO: devolvé ÚNICAMENTE el <formato_salida> completado. Sin texto antes, después, ni explicaciones.
2. BREVEDAD: mensaje ultra-corto — 2 a 4 líneas máximo, una sola idea de match.
3. ENFOQUE EN VALOR: mencioná el cruce más fuerte entre tu perfil y la vacante en una frase concreta, no una lista de habilidades.
4. TONO: profesional pero informal y cercano, como un mensaje real entre personas — sin firmas ni fórmulas de email.
5. HONESTIDAD: no menciones habilidades, tecnologías o logros que no figuren en el CV_ORIGINAL.
</reglas>

<formato_salida>
"¡Hola [Nombre de recruiter]! Vi la búsqueda de [nombre de la vacante] y creo que mi experiencia encaja: [una frase de match real, basada en el CV]. Te dejo mi CV si querés profundizar. ¡Saludos!"
</formato_salida>

<datos>
CV_ORIGINAL (${candidateName}):
${cvBlock}

OFERTA_LABORAL:
${ofertaBlock(job)}
</datos>

Generá el mensaje aplicando las <reglas>. Devolvé EXCLUSIVAMENTE el <formato_salida> completado, sin texto antes ni después.`;
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
