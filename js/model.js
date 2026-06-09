/**
 * MODEL — Single source of truth.
 * Manages state, localStorage persistence, and JSON backup I/O.
 */

const STORAGE_KEY_JOBS = 'jt_jobs';
const STORAGE_KEY_CV   = 'jt_cv';

const CV_DEFAULT = `AGUSTÍN THOMAS GUTIÉRREZ IOIME
Estudiante de Ingeniería en Sistemas de Información · UTN FRC

RESUMEN
Estudiante de Ingeniería en Sistemas de Información con experiencia en los roles de Analista de Sistemas y Soporte IT. Enfocado en la optimización de procesos de negocio a través de soluciones tecnológicas estratégicas. Me destaco por mi autonomía y capacidad de aprendizaje ágil ante nuevas tecnologías.

EXPERIENCIA LABORAL
Soporte IT y Analista de Sistemas — Corrugadora Centro S.A.
Medio tiempo · Presencial · Feb 2025 — Jun 2026

Administración ERP y Sistemas:
• Monitoreé la integración de datos entre ERP Totvs (Protheus) y DrCorr, reduciendo errores críticos en pedidos automáticos.
• Resolví incidentes complejos y gestioné tickets de soporte ERP, corrigiendo inconsistencias en documentos en coordinación con terceros.
• Administré accesos, perfiles y políticas de permisos de usuarios por módulos.

Infraestructura y Soporte IT:
• Gestioné inventario de hardware (PCs, redes) bajo metodologías de trazabilidad y optimicé presupuestos junto a Compras.
• Lideré el despliegue de infraestructura para nuevos ingresos (configuración de software e integración al dominio).
• Implementé ManageEngine Endpoint DLP para protección activa de datos sensibles.
• Configuré Zycoo IP Audio Center, líneas telefónicas IP y sistemas IVR.
• Administré Google Workspace (altas, bajas, licencias, grupos y delegación de correos).

Automatización y Mejora de Procesos:
• Analicé procesos en planta con metodologías Lean, diagramas As-Is/To-Be y SIPOC.
• Desarrollé app de escritorio en Python integrada con Google API (OAuth 2.0) y TSPL para automatizar impresión de etiquetas industriales Xprinter.
• Diseñé app en AppSheet para control preventivo de autoelevadores con base de datos relacional, validaciones, alertas automáticas y conexión a Power BI.

Gestión Web:
• Administré WordPress/WooCommerce (mantenimiento, parches de seguridad y extensiones).
• Actualicé frontend del sitio web institucional para cumplimiento de certificaciones de calidad.

FORMACIÓN ACADÉMICA
Ingeniería en Sistemas de Información — UTN FRC
Feb 2021 — Actualidad · 15 materias troncales aprobadas

HABILIDADES TÉCNICAS
ERP Totvs Protheus · DrCorr · Python · JavaScript · HTML/CSS
Google AppSheet · n8n · Google Apps Script · SQL
Google Workspace · Active Directory · ManageEngine DLP · Trello · AnyDesk

HABILIDADES BLANDAS
Análisis y resolución de problemas · Gestión del cambio · Pensamiento analítico
Comunicación asertiva · Autonomía y responsabilidad · Adaptabilidad · Trabajo en equipo

IDIOMAS: Inglés B1`;

// ── Internal state ──────────────────────────────────────────────────────────
let jobs   = [];
let cvText = CV_DEFAULT;

// ── Persistence helpers ─────────────────────────────────────────────────────
function persistJobs() {
  localStorage.setItem(STORAGE_KEY_JOBS, JSON.stringify(jobs));
}

function persistCV() {
  localStorage.setItem(STORAGE_KEY_CV, cvText);
}

// ── Bootstrap: hydrate from localStorage ────────────────────────────────────
function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_JOBS);
    if (raw) jobs = JSON.parse(raw);
  } catch { jobs = []; }

  const savedCV = localStorage.getItem(STORAGE_KEY_CV);
  if (savedCV !== null) cvText = savedCV;
}

// ── Getters ─────────────────────────────────────────────────────────────────
function getJobs()   { return [...jobs]; }
function getCVText() { return cvText; }

function getStats() {
  return {
    total:       jobs.length,
    pendientes:  jobs.filter(j => j.estado === 'pendiente').length,
    aplicadas:   jobs.filter(j => j.estado === 'aplicada').length,
    entrevistas: jobs.filter(j => j.estado === 'entrevista').length,
  };
}

// ── Mutators ────────────────────────────────────────────────────────────────
function addJob({ puesto, empresa, link, desc, estado }) {
  const job = {
    id:      Date.now(),
    puesto:  puesto.trim(),
    empresa: empresa.trim(),
    link:    (link  || '').trim(),
    desc:    (desc  || '').trim(),
    estado:  estado || 'pendiente',
    fecha:   new Date().toLocaleDateString('es-AR'),
  };
  jobs.unshift(job);
  persistJobs();
  return job;
}

function updateJobStatus(id, newEstado) {
  const job = jobs.find(j => j.id === id);
  if (!job) return false;
  job.estado = newEstado;
  persistJobs();
  return true;
}

function deleteJob(id) {
  const before = jobs.length;
  jobs = jobs.filter(j => j.id !== id);
  if (jobs.length !== before) { persistJobs(); return true; }
  return false;
}

function editCV(newText) {
  cvText = newText;
  persistCV();
}

// ── JSON Backup: Export ──────────────────────────────────────────────────────
function exportJSON() {
  const payload = {
    version:    3,
    exportedAt: new Date().toISOString(),
    jobs,
    cvMain: cvText,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = 'mis_empleos.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  return jobs.length;
}

// ── JSON Backup: Import ──────────────────────────────────────────────────────
/**
 * Reads a File object, parses it and merges the data into state.
 * Returns a Promise that resolves with { jobCount, hasCV }.
 */
function importJSON(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = ({ target }) => {
      try {
        const parsed = JSON.parse(target.result);
        if (Array.isArray(parsed.jobs)) {
          jobs = parsed.jobs;
          persistJobs();
        }
        if (typeof parsed.cvMain === 'string') {
          cvText = parsed.cvMain;
          persistCV();
        }
        resolve({ jobCount: jobs.length, hasCV: typeof parsed.cvMain === 'string' });
      } catch (err) {
        reject(new Error('JSON inválido'));
      }
    };
    reader.onerror = () => reject(new Error('Error de lectura'));
    reader.readAsText(file);
  });
}

// ── Public API ───────────────────────────────────────────────────────────────
export default {
  load,
  getJobs,
  getCVText,
  getStats,
  addJob,
  updateJobStatus,
  deleteJob,
  editCV,
  exportJSON,
  importJSON,
};
