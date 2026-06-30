/**
 * MODEL — Single source of truth.
 * Manages state, localStorage persistence, and JSON backup I/O.
 */

const STORAGE_KEY_JOBS  = 'jt_jobs';
const STORAGE_KEY_CV    = 'jt_cv';
const STORAGE_KEY_ROLES = 'jt_roles';

const CV_DEFAULT = {
  nombre:            '',
  rol:               '',
  email:             '',
  telefono:          '',
  linkedin:          '',
  portfolio:         '',
  resumen:           '',
  experiencia:       '',
  habilidadesTec:    '',
  formacion:         '',
  habilidadesBlandas:'',
  idiomas:           '',
};

// ── Internal state ──────────────────────────────────────────────────────────
let jobs      = [];
let cvData    = { ...CV_DEFAULT };
let userRoles = [];

// ── Persistence helpers ─────────────────────────────────────────────────────
function persistJobs() {
  localStorage.setItem(STORAGE_KEY_JOBS, JSON.stringify(jobs));
}

function persistCV() {
  localStorage.setItem(STORAGE_KEY_CV, JSON.stringify(cvData));
}

function persistRoles() {
  localStorage.setItem(STORAGE_KEY_ROLES, JSON.stringify(userRoles));
}

// ── Bootstrap: hydrate from localStorage ────────────────────────────────────
function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_JOBS);
    if (raw) jobs = JSON.parse(raw);
  } catch { jobs = []; }

  try {
    const savedCV = localStorage.getItem(STORAGE_KEY_CV);
    if (savedCV !== null) {
      const parsed = JSON.parse(savedCV);
      // If the old format was a plain string, migrate it to the new object
      if (typeof parsed === 'string') {
        cvData = { ...CV_DEFAULT };
        cvData.experiencia = parsed;
      } else {
        cvData = { ...CV_DEFAULT, ...parsed };
      }
    }
  } catch { cvData = { ...CV_DEFAULT }; }

  try {
    const savedRoles = localStorage.getItem(STORAGE_KEY_ROLES);
    if (savedRoles) userRoles = JSON.parse(savedRoles);
  } catch { userRoles = []; }
}

// ── Getters ─────────────────────────────────────────────────────────────────
function getJobs()   { return [...jobs]; }
function getCVData() { return { ...cvData }; }
function getRoles()  { return [...userRoles]; }

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

function editCV(newData) {
  cvData = { ...CV_DEFAULT, ...newData };
  persistCV();
}

function addRole(label) {
  const trimmed = label.trim();
  if (!trimmed) return null;
  // Prevent duplicates (case-insensitive)
  if (userRoles.some(r => r.label.toLowerCase() === trimmed.toLowerCase())) return null;
  const role = { id: Date.now(), label: trimmed };
  userRoles.push(role);
  persistRoles();
  return role;
}

function deleteRole(id) {
  const before = userRoles.length;
  userRoles = userRoles.filter(r => r.id !== id);
  if (userRoles.length !== before) { persistRoles(); return true; }
  return false;
}

// ── JSON Backup: Export ──────────────────────────────────────────────────────
function exportJSON() {
  const payload = {
    version:    4,
    exportedAt: new Date().toISOString(),
    jobs,
    cvData,
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
        // Support new format (cvData object) and legacy format (cvMain string)
        let hasCV = false;
        if (parsed.cvData && typeof parsed.cvData === 'object') {
          cvData = { ...CV_DEFAULT, ...parsed.cvData };
          persistCV();
          hasCV = true;
        } else if (typeof parsed.cvMain === 'string') {
          cvData = { ...CV_DEFAULT, experiencia: parsed.cvMain };
          persistCV();
          hasCV = true;
        }
        resolve({ jobCount: jobs.length, hasCV });
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
  getCVData,
  getRoles,
  getStats,
  addJob,
  updateJobStatus,
  deleteJob,
  editCV,
  addRole,
  deleteRole,
  exportJSON,
  importJSON,
};
