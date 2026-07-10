/**
 * @file storage.js
 * @description Módulo de utilidades encargado puramente de la persistencia en LocalStorage.
 * Actúa como la única fuente de la verdad (Single Source of Truth) para la aplicación.
 */

import { openDB } from 'https://cdn.jsdelivr.net/npm/idb@8/+esm';

const STORAGE_KEY_JOBS  = 'jobtracker_applications';
const STORAGE_KEY_CV    = 'jobtracker_cv';
const STORAGE_KEY_ROLES = 'jt_roles';
const STORAGE_KEY_COUNTRY = 'jt_search_country';

const MAX_CV_SLOTS = 20;

const CV_DEFAULT = {
  nombre:            '',
  rol:               '',
  email:             '',
  telefono:          '',
  linkedin:          '',
  portfolio:         '',
  resumen:           '',
  experiencia:       [],
  habilidadesTec:    [],
  formacion:         [],
  habilidadesBlandas:[],
  idiomas:           [],
};

// ── Estado Interno en Memoria ────────────────────────────────────────────────

let jobs          = [];
let cvSlots       = new Array(MAX_CV_SLOTS).fill(null);
let activeCVIndex = 0;
let userRoles     = [];
let searchCountry = 'ar';

// ── Persistencia (Privadas) ──────────────────────────────────────────────────

/** Guarda el array de trabajos en LocalStorage. */
function persistJobs() {
  localStorage.setItem(STORAGE_KEY_JOBS, JSON.stringify(jobs));
}

/** Guarda la ruleta de CVs y el índice activo en LocalStorage. */
function persistCV() {
  localStorage.setItem(STORAGE_KEY_CV, JSON.stringify({
    activeIndex: activeCVIndex,
    slots: cvSlots,
  }));
}

/** Guarda los roles del usuario en LocalStorage. */
function persistRoles() {
  localStorage.setItem(STORAGE_KEY_ROLES, JSON.stringify(userRoles));
}

// ── IndexedDB (Fotos) ────────────────────────────────────────────────────────

const DB_NAME = 'JobTrackerDB';
const DB_VERSION = 1;
const STORE_NAME = 'files';
const PIC_KEY = 'globalProfilePic';

let dbPromise = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      },
    });
  }
  return dbPromise;
}

export async function getProfilePic() {
  const db = await getDB();
  return db.get(STORE_NAME, PIC_KEY);
}

export async function saveProfilePic(base64Data) {
  const db = await getDB();
  await db.put(STORE_NAME, base64Data, PIC_KEY);
}

export async function deleteProfilePic() {
  const db = await getDB();
  await db.delete(STORE_NAME, PIC_KEY);
}


// ── Inicialización ───────────────────────────────────────────────────────────

/**
 * @function load
 * @description Hidrata el estado en memoria leyendo de LocalStorage. Aplica migraciones si es necesario.
 */
export function load() {
  // Jobs
  try {
    const raw = localStorage.getItem(STORAGE_KEY_JOBS);
    if (raw) jobs = JSON.parse(raw);
  } catch { jobs = []; }

  // CV — soporta formato multi-slot nuevo y formatos legacy
  try {
    const savedCV = localStorage.getItem(STORAGE_KEY_CV);
    if (savedCV !== null) {
      const parsed = JSON.parse(savedCV);

      if (parsed && parsed.slots && Array.isArray(parsed.slots)) {
        cvSlots = parsed.slots;
        while (cvSlots.length < MAX_CV_SLOTS) cvSlots.push(null);
        if (cvSlots.length > MAX_CV_SLOTS) cvSlots.length = MAX_CV_SLOTS;
        activeCVIndex = (typeof parsed.activeIndex === 'number'
          && parsed.activeIndex >= 0
          && parsed.activeIndex < MAX_CV_SLOTS)
          ? parsed.activeIndex : 0;
      } else if (typeof parsed === 'object' && !Array.isArray(parsed)) {
        cvSlots = new Array(MAX_CV_SLOTS).fill(null);
        cvSlots[0] = { ...CV_DEFAULT, ...parsed };
        activeCVIndex = 0;
      }
    }
  } catch {
    cvSlots = new Array(MAX_CV_SLOTS).fill(null);
    activeCVIndex = 0;
  }

  // Sanitizar campos: asegurar que los campos de array sean arrays
  for (let i = 0; i < cvSlots.length; i++) {
    if (cvSlots[i]) {
      if (!Array.isArray(cvSlots[i].experiencia))       cvSlots[i].experiencia = [];
      if (!Array.isArray(cvSlots[i].formacion))          cvSlots[i].formacion = [];
      if (!Array.isArray(cvSlots[i].habilidadesTec))     cvSlots[i].habilidadesTec = [];
      if (!Array.isArray(cvSlots[i].habilidadesBlandas)) cvSlots[i].habilidadesBlandas = [];
      if (!Array.isArray(cvSlots[i].idiomas))            cvSlots[i].idiomas = [];
    }
  }

  // Roles
  try {
    const savedRoles = localStorage.getItem(STORAGE_KEY_ROLES);
    if (savedRoles) userRoles = JSON.parse(savedRoles);
  } catch { userRoles = []; }

  // País de búsqueda
  try {
    const savedCountry = localStorage.getItem(STORAGE_KEY_COUNTRY);
    if (savedCountry) searchCountry = savedCountry;
  } catch { searchCountry = 'ar'; }
}

// ── Getters Puros ────────────────────────────────────────────────────────────

/**
 * @function getJobs
 * @description Obtiene el array de postulaciones.
 * @returns {Array} Copia del array de trabajos.
 */
export function getJobs() { return [...jobs]; }

/**
 * @function getRoles
 * @description Obtiene el array de roles agregados por el usuario.
 * @returns {Array} Copia del array de roles.
 */
export function getRoles() { return [...userRoles]; }

/**
 * @function getCVSlots
 * @description Obtiene los 20 slots de la ruleta de CVs.
 * @returns {Array} Copia del array de slots.
 */
export function getCVSlots() { return [...cvSlots]; }

/**
 * @function getActiveCVIndex
 * @description Devuelve el índice del CV seleccionado actualmente.
 * @returns {number} El índice activo (0-19).
 */
export function getActiveCVIndex() { return activeCVIndex; }

/**
 * @function getCVData
 * @description Retorna los datos del slot activo. Si está vacío, devuelve un esqueleto vacío con los campos por defecto.
 * @returns {Object} Datos del CV.
 */
export function getCVData() {
  const slot = cvSlots[activeCVIndex];
  return slot ? { ...slot } : { ...CV_DEFAULT };
}

/**
 * @function getStats
 * @description Calcula las métricas del embudo de postulaciones.
 * @returns {Object} Objeto con totales (total, pendientes, aplicadas, entrevistas).
 */
export function getStats() {
  return {
    total:       jobs.length,
    pendientes:  jobs.filter(j => j.estado === 'pendiente').length,
    aplicadas:   jobs.filter(j => j.estado === 'aplicada').length,
    entrevistas: jobs.filter(j => j.estado === 'entrevista').length,
  };
}

// ── Mutadores (Setters) ──────────────────────────────────────────────────────

/**
 * @function setActiveCVIndex
 * @description Cambia el índice de la ruleta y lo persiste.
 * @param {number} index El índice al que se quiere cambiar.
 */
export function setActiveCVIndex(index) {
  if (index >= 0 && index < MAX_CV_SLOTS) {
    activeCVIndex = index;
    persistCV();
  }
}

/**
 * @function saveCVSlot
 * @description Persiste un CV en el slot activo.
 * @param {Object} data Los datos recolectados del formulario.
 */
export function saveCVSlot(data) {
  cvSlots[activeCVIndex] = { ...CV_DEFAULT, ...data };
  persistCV();
}

/**
 * @function deleteCVSlot
 * @description Elimina los datos del slot activo estableciéndolos en null.
 */
export function deleteCVSlot() {
  cvSlots[activeCVIndex] = null;
  persistCV();
}

/**
 * @function addJob
 * @description Añade una nueva postulación.
 * @param {Object} data Datos de la oferta (puesto, empresa, link, desc, estado).
 * @returns {Object} El trabajo añadido con su ID generado.
 */
export function addJob({ puesto, empresa, link, desc, estado }) {
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

/**
 * @function updateJobStatus
 * @description Actualiza el estado (funnel) de una postulación.
 * @param {number} id El ID de la postulación.
 * @param {string} newEstado El nuevo estado (ej. "aplicada").
 * @returns {boolean} true si fue exitoso, false si no se encontró.
 */
export function updateJobStatus(id, newEstado) {
  const job = jobs.find(j => j.id === id);
  if (!job) return false;
  job.estado = newEstado;
  persistJobs();
  return true;
}

/**
 * @function deleteJob
 * @description Elimina una postulación por su ID.
 * @param {number} id El ID de la postulación.
 * @returns {boolean} true si se eliminó, false si no.
 */
export function deleteJob(id) {
  const before = jobs.length;
  jobs = jobs.filter(j => j.id !== id);
  if (jobs.length !== before) { persistJobs(); return true; }
  return false;
}

/**
 * @function addRole
 * @description Agrega un nuevo rol de búsqueda.
 * @param {string} label El nombre del rol.
 * @returns {Object|null} El rol creado o null si ya existía.
 */
export function addRole(label) {
  const trimmed = label.trim();
  if (!trimmed) return null;
  if (userRoles.some(r => r.label.toLowerCase() === trimmed.toLowerCase())) return null;
  const role = { id: Date.now(), label: trimmed };
  userRoles.push(role);
  persistRoles();
  return role;
}

/**
 * @function deleteRole
 * @description Elimina un rol por su ID.
 * @param {number} id ID del rol.
 * @returns {boolean}
 */
export function deleteRole(id) {
  const before = userRoles.length;
  userRoles = userRoles.filter(r => r.id !== id);
  if (userRoles.length !== before) { persistRoles(); return true; }
  return false;
}

/**
 * @function getSearchCountry
 * @description Obtiene el código del país seleccionado para las búsquedas.
 * @returns {string}
 */
export function getSearchCountry() {
  return searchCountry;
}

/**
 * @function setSearchCountry
 * @description Guarda el código de país seleccionado y lo persiste.
 * @param {string} code Código de país (ar, mx, co, etc.)
 */
export function setSearchCountry(code) {
  searchCountry = code;
  localStorage.setItem(STORAGE_KEY_COUNTRY, code);
}

// ── Import/Export ────────────────────────────────────────────────────────────

/**
 * @function exportJSON
 * @description Descarga un backup completo en formato JSON unificando la persistencia.
 * @returns {number} Cantidad de postulaciones exportadas.
 */
export async function exportJSON() {
  const profilePic = await getProfilePic();
  
  const payload = {
    version:    6,
    exportedAt: new Date().toISOString(),
    jobtracker_applications: jobs,
    jobtracker_cv: {
      activeIndex: activeCVIndex,
      slots: cvSlots,
    },
    jobtracker_profilePic: profilePic || null,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = 'jobtracker_backup.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  return jobs.length;
}

/**
 * @function importJSON
 * @description Lee un archivo JSON y restaura la persistencia resolviendo incompatibilidades antiguas.
 * @param {File} file El archivo subido por el usuario.
 * @returns {Promise<{jobCount: number, hasCV: boolean}>} Promesa con el resultado de la importación.
 */
export function importJSON(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = ({ target }) => {
      try {
        const parsed = JSON.parse(target.result);

        if (Array.isArray(parsed.jobtracker_applications)) {
          jobs = parsed.jobtracker_applications;
          persistJobs();
        } else if (Array.isArray(parsed.jobs)) {
          jobs = parsed.jobs;
          persistJobs();
        }

        let hasCV = false;

        if (parsed.jobtracker_cv) {
          if (parsed.jobtracker_cv.slots && Array.isArray(parsed.jobtracker_cv.slots)) {
            cvSlots = parsed.jobtracker_cv.slots;
            while (cvSlots.length < MAX_CV_SLOTS) cvSlots.push(null);
            if (cvSlots.length > MAX_CV_SLOTS) cvSlots.length = MAX_CV_SLOTS;
            activeCVIndex = (typeof parsed.jobtracker_cv.activeIndex === 'number'
              && parsed.jobtracker_cv.activeIndex >= 0
              && parsed.jobtracker_cv.activeIndex < MAX_CV_SLOTS)
              ? parsed.jobtracker_cv.activeIndex : 0;
            persistCV();
            hasCV = true;
          } else if (typeof parsed.jobtracker_cv === 'object') {
            cvSlots = new Array(MAX_CV_SLOTS).fill(null);
            cvSlots[0] = { ...CV_DEFAULT, ...parsed.jobtracker_cv };
            activeCVIndex = 0;
            persistCV();
            hasCV = true;
          }
        } else if (parsed.cvData && typeof parsed.cvData === 'object') {
          cvSlots = new Array(MAX_CV_SLOTS).fill(null);
          cvSlots[0] = { ...CV_DEFAULT, ...parsed.cvData };
          activeCVIndex = 0;
          persistCV();
          hasCV = true;
        }

        // Sanitizar campos: asegurar que los campos de array sean arrays
        for (let i = 0; i < cvSlots.length; i++) {
          if (cvSlots[i]) {
            if (!Array.isArray(cvSlots[i].experiencia))       cvSlots[i].experiencia = [];
            if (!Array.isArray(cvSlots[i].formacion))          cvSlots[i].formacion = [];
            if (!Array.isArray(cvSlots[i].habilidadesTec))     cvSlots[i].habilidadesTec = [];
            if (!Array.isArray(cvSlots[i].habilidadesBlandas)) cvSlots[i].habilidadesBlandas = [];
            if (!Array.isArray(cvSlots[i].idiomas))            cvSlots[i].idiomas = [];
          }
        }

        if (parsed.jobtracker_profilePic) {
          saveProfilePic(parsed.jobtracker_profilePic).then(() => {
            resolve({ jobCount: jobs.length, hasCV });
          }).catch(() => resolve({ jobCount: jobs.length, hasCV }));
        } else {
          resolve({ jobCount: jobs.length, hasCV });
        }
      } catch (err) {
        reject(new Error('JSON inválido'));
      }
    };
    reader.onerror = () => reject(new Error('Error de lectura'));
    reader.readAsText(file);
  });
}
