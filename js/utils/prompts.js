/**
 * UTILS / PROMPTS — Pure functions.
 * Each function receives job data + cvText and returns a prompt string.
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

// ── Prompt: Analizar FIT ─────────────────────────────────────────────────────
/**
 * Full autonomous prompt for fit analysis (works in any AI).
 */
export function promptFIT(job, cvText) {
  return `Actuá como un experto en selección de talento IT.
Analizá la compatibilidad entre el perfil del candidato y la oferta laboral indicada.

=== CV DEL CANDIDATO (Agustín Thomas Gutiérrez Ioime) ===
${cvText}

=== OFERTA LABORAL ===
${ofertaBlock(job)}

Respondé con el siguiente formato:
1. Porcentaje de fit estimado (0–100%) y justificación concisa.
2. Fortalezas del perfil para este rol (máx. 5 puntos).
3. Brechas o áreas a reforzar (máx. 3 puntos).
4. Recomendación final: Aplicar / Aplicar con nota / No aplicar — con una línea de fundamento.`;
}

// ── Prompt: Adaptar CV ───────────────────────────────────────────────────────
/**
 * Full autonomous CV adaptation prompt (works in any AI).
 */
export function promptAdaptarCV(job, cvText) {
  return `Actuá como un experto en CVs para el sector IT.
Adaptá el CV que se provee a continuación para maximizar las probabilidades de pasar el filtro ATS y captar la atención del reclutador en la oferta indicada.

=== CV ORIGINAL (Agustín Thomas Gutiérrez Ioime) ===
${cvText}

=== OFERTA LABORAL ===
${ofertaBlock(job)}

Devolvé:
1. Resumen profesional reescrito, orientado específicamente a este rol (3–4 líneas).
2. Los 4–6 bullets de experiencia laboral que más impactan para esta posición, reescritos con verbos de acción y métricas donde sea posible.
3. Lista de habilidades técnicas ordenadas por relevancia para esta oferta.
4. Sugerencia de qué secciones o puntos reducir o eliminar para esta postulación.
5. El CV completo reestructurado y listo para copiar.`;
}

// ── Prompt: Crear Carta de Presentación ─────────────────────────────────────
/**
 * Full autonomous cover letter prompt (works in any AI).
 */
export function promptCarta(job, cvText) {
  return `Actuá como un experto en comunicación profesional para el sector IT.
Redactá una carta de presentación en español para la siguiente postulación laboral.

=== CV DEL CANDIDATO (Agustín Thomas Gutiérrez Ioime) ===
${cvText}

=== OFERTA LABORAL ===
${ofertaBlock(job)}

La carta debe:
- Tener 3–4 párrafos bien estructurados, con un tono profesional pero cercano y auténtico.
- Abrirse conectando directamente la experiencia en Corrugadora Centro S.A. con los requisitos del puesto.
- Destacar la capacidad de automatización de procesos y el trabajo con sistemas ERP como diferenciadores clave.
- Mostrar motivación genuina y conocimiento del tipo de empresa o industria.
- Cerrar con un llamado a la acción claro (solicitar entrevista / disponibilidad de contacto).
- Evitar frases genéricas, clichés y el uso de "soy una persona".

Devolvé únicamente el texto de la carta, listo para copiar y pegar.`;
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
