/**
 * @file Sidebar.js
 * @description Componente global encargado de la lógica de la barra lateral (Sidebar).
 * Maneja la navegación, el selector global de CVs y el backup de datos.
 */

// ── Caché del DOM ────────────────────────────────────────────────────────────

const el = {
  appSubtitle:    document.getElementById('appSubtitle'),
  cvGlobalSelect: document.getElementById('cvGlobalSelect'),
  btnExport:      document.getElementById('btnExport'),
  btnImportTrig:  document.getElementById('btnImportTrigger'),
  importFile:     document.getElementById('importFile'),
  navButtons:     document.querySelectorAll('.sidebar-nav-btn'),
  panels:         document.querySelectorAll('.tab-panel'),
};

/**
 * Escapa strings HTML para prevenir XSS.
 * @param {string} s String a escapar.
 */
const esc = s => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;')
  .replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// ── Renderizado ──────────────────────────────────────────────────────────────

/**
 * @function updateSubtitle
 * @description Actualiza el subtítulo del Sidebar basado en el CV activo.
 * @param {Object} data Objeto del CV.
 */
export function updateSubtitle(data) {
  if (!el.appSubtitle) return;
  if (!data || !data.nombre) {
    el.appSubtitle.textContent = 'Tu asistente de búsqueda laboral';
    return;
  }
  el.appSubtitle.textContent = data.nombre;
}

/**
 * @function renderCVGlobalSelector
 * @description Puebla el `<select>` del Sidebar con los 20 slots de CVs.
 * @param {Array} slots Array con la data de los 20 CVs.
 * @param {number} activeIndex Índice seleccionado actualmente.
 */
export function renderCVGlobalSelector(slots, activeIndex) {
  if (!el.cvGlobalSelect) return;
  
  // Filtrar solo los slots que tienen información real
  const validSlots = slots
    .map((slot, i) => ({ slot, i }))
    .filter(item => item.slot && (item.slot.nombre || item.slot.rol || item.slot.experiencia || item.slot.resumen));

  if (validSlots.length === 0) {
    el.cvGlobalSelect.innerHTML = `<option value="" disabled selected>No hay CVs con datos</option>`;
    return;
  }

  // Si el activeIndex actual es uno vacío, el navegador seleccionará visualmente el primero válido.
  // Para evitar desincronizaciones engañosas, forzamos a que si el índice activo actual no está 
  // en la lista de válidos, no le pongamos 'selected' a ninguno (o se selecciona el primero visualmente).
  el.cvGlobalSelect.innerHTML = validSlots.map(({ slot, i }) => {
    const title = slot.rol ? `CV ${i + 1} - ${slot.rol}` : `CV ${i + 1} - ${slot.nombre || 'Sin título'}`;
    return `<option value="${i}" ${i === activeIndex ? 'selected' : ''}>${esc(title)}</option>`;
  }).join('');
}

// ── Event Binders & Helpers ──────────────────────────────────────────────────

/**
 * @function bindTabNav
 * @description Vincula el cambio de pestañas globales.
 * @param {Function} handler Callback que recibe el tabId.
 */
export function bindTabNav(handler) {
  el.navButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      handler(btn.dataset.tab);
    });
  });
}

/**
 * @function switchTab
 * @description Cambia la interfaz visual (paneles) a la pestaña seleccionada.
 * @param {string} tabId ID de la pestaña a mostrar (ej. "inicio").
 */
export function switchTab(tabId) {
  el.navButtons.forEach(b => {
    const isTarget = b.dataset.tab === tabId;
    b.classList.toggle('active', isTarget);
    b.setAttribute('aria-selected', isTarget);
  });
  el.panels.forEach(p => {
    const isTarget = p.id === `tab-${tabId}`;
    p.classList.toggle('active', isTarget);
    if (!isTarget) p.style.display = 'none';
    else {
      p.style.display = 'block';
      setTimeout(() => p.style.opacity = '1', 50);
    }
  });
}

/**
 * @function bindCVGlobalSelect
 * @description Vincula el selector global de CV.
 * @param {Function} handler Función que recibe el nuevo índice.
 */
export function bindCVGlobalSelect(handler) {
  if (!el.cvGlobalSelect) return;
  el.cvGlobalSelect.addEventListener('change', e => {
    handler(Number(e.target.value));
  });
}

/**
 * @function bindExport
 * @description Vincula el botón de Exportar JSON.
 * @param {Function} handler Callback al disparar.
 */
export function bindExport(handler) {
  if (el.btnExport) el.btnExport.addEventListener('click', handler);
}

/**
 * @function bindImport
 * @description Vincula el botón e input oculto para Importar JSON.
 * @param {Function} handler Callback que recibe el objeto File.
 */
export function bindImport(handler) {
  if (!el.btnImportTrig || !el.importFile) return;
  el.btnImportTrig.addEventListener('click', () => el.importFile.click());
  el.importFile.addEventListener('change', e => {
    const file = e.target.files[0];
    if (file) handler(file);
    e.target.value = '';
  });
}
