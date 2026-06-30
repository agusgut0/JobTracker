/**
 * VIEW — Owns the DOM entirely.
 * Renders data, wires no business logic.
 * Exposes bindXxx() methods so the Controller can attach listeners.
 */


// ── Platform data (presentation concern) ────────────────────────────────────
const PLATFORMS = [
  { name: 'LinkedIn',       ico: '💼', url: q => `https://www.linkedin.com/jobs/search/?keywords=${enc(q)}&location=Argentina&f_WT=2%2C1` },
  { name: 'Indeed',         ico: '🔍', url: q => `https://ar.indeed.com/jobs?q=${enc(q)}&l=Argentina&remotejob=032b3046-06a3-4876-8dfd-474eb5e7ed11` },
  { name: 'Get on Board',   ico: '🚀', url: q => `https://www.getonbrd.com/jobs?q=${enc(q)}&country_id=Argentina` },
  { name: 'Chumi IT',       ico: '🤖', url: q => `https://chumi-it.com/empleos?q=${enc(q)}` },
  { name: 'x64',            ico: '💻', url: q => `https://x64.ar/?q=${enc(q)}` },
  { name: 'Revista Empleo', ico: '📰', url: _q => `https://www.revistaempleo.com/todos-los-trabajos/` },
  { name: 'EPAM Campus',    ico: '🎓', url: _q => `https://campus.epam.com/en` },
  { name: 'EmpleosIT',      ico: '🔶', url: q => `https://www.empleosit.com.ar/search?q=${enc(q)}` },
  { name: 'Andeshire',      ico: '🏔️', url: _q => `https://andeshire.com/` },
];

// ── Helpers ──────────────────────────────────────────────────────────────────
const enc  = s => encodeURIComponent(s);
const esc  = s => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;')
  .replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const ESTADO_LABELS = {
  pendiente:  '🟠 Pendiente',
  aplicada:   '🟢 Aplicada',
  entrevista: '🔵 Entrevista',
  descartada: '🔴 Descartada',
};

// ── CV field IDs (maps to cvData keys) ──────────────────────────────────────
const CV_FIELDS = [
  { id: 'cvNombre',            key: 'nombre' },
  { id: 'cvRol',               key: 'rol' },
  { id: 'cvEmail',             key: 'email' },
  { id: 'cvTelefono',          key: 'telefono' },
  { id: 'cvLinkedin',          key: 'linkedin' },
  { id: 'cvPortfolio',         key: 'portfolio' },
  { id: 'cvResumen',           key: 'resumen' },
  { id: 'cvExperiencia',       key: 'experiencia' },
  { id: 'cvHabilidadesTec',    key: 'habilidadesTec' },
  { id: 'cvFormacion',         key: 'formacion' },
  { id: 'cvHabilidadesBlandas',key: 'habilidadesBlandas' },
  { id: 'cvIdiomas',           key: 'idiomas' },
];

// ── DOM cache ────────────────────────────────────────────────────────────────
const $ = id => document.getElementById(id);

const el = {
  // Nav
  tabBtns:        () => document.querySelectorAll('.tab-btn'),
  tabPanels:      () => document.querySelectorAll('.tab-panel'),
  // Search tab
  roleTabs:       $('roleTabs'),
  roleInput:      $('roleInput'),
  btnAddRole:     $('btnAddRole'),
  groupB:         $('groupB'),
  // Stats
  sTot:           $('sTot'),
  sPen:           $('sPen'),
  sApl:           $('sApl'),
  sEnt:           $('sEnt'),
  // Form
  offerForm:      $('offerForm'),
  fPuesto:        $('fPuesto'),
  fEmpresa:       $('fEmpresa'),
  fLink:          $('fLink'),
  fDesc:          $('fDesc'),
  fEstado:        $('fEstado'),
  // Offer list
  offerList:      $('offerList'),
  // CV fields
  cvNombre:           $('cvNombre'),
  cvRol:              $('cvRol'),
  cvEmail:            $('cvEmail'),
  cvTelefono:         $('cvTelefono'),
  cvLinkedin:         $('cvLinkedin'),
  cvPortfolio:        $('cvPortfolio'),
  cvResumen:          $('cvResumen'),
  cvExperiencia:      $('cvExperiencia'),
  cvHabilidadesTec:   $('cvHabilidadesTec'),
  cvFormacion:        $('cvFormacion'),
  cvHabilidadesBlandas:$('cvHabilidadesBlandas'),
  cvIdiomas:          $('cvIdiomas'),
  // Header subtitle
  appSubtitle:    $('appSubtitle'),
  // Backup & Download
  btnExport:      $('btnExport'),
  btnImportTrig:  $('btnImportTrigger'),
  importFile:     $('importFile'),
  btnDownloadCV:  $('btnDownloadCV'),
  // Modal
  modalDelete:    $('modalDelete'),
  modalCancel:    $('modalCancelBtn'),
  modalConfirm:   $('modalConfirmBtn'),
  // Toast
  toast:          $('toast'),
};

// ── Toast ────────────────────────────────────────────────────────────────────
let toastTimer = null;

function showToast(msg, duration = 3400) {
  el.toast.textContent = msg;
  el.toast.classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.toast.classList.remove('visible'), duration);
}

// ── Tab switching ────────────────────────────────────────────────────────────
function switchTab(targetId) {
  el.tabBtns().forEach(btn => {
    const active = btn.dataset.tab === targetId;
    btn.classList.toggle('active', active);
    btn.setAttribute('aria-selected', String(active));
  });
  el.tabPanels().forEach(panel => {
    panel.classList.toggle('active', panel.id === `tab-${targetId}`);
  });
}

// ── Role tabs (dynamic) ─────────────────────────────────────────────────────
function renderRoleTabs(roles, activeRoleId) {
  if (!roles.length) {
    el.roleTabs.innerHTML = `<p class="empty-roles-hint">No hay roles agregados. Escribí uno arriba para empezar.</p>`;
    return;
  }
  el.roleTabs.innerHTML = roles.map(r =>
    `<button class="role-tab${r.id === activeRoleId ? ' active' : ''}" data-role="${r.id}">
      ${esc(r.label)}
      <span class="role-delete" data-role-del="${r.id}" title="Eliminar rol">×</span>
    </button>`
  ).join('');
}

// ── Search buttons ───────────────────────────────────────────────────────────
function renderSearchButtons(query) {
  const qVal = (query || '').trim();

  el.groupB.innerHTML = PLATFORMS.map(p => {
    const url = p.url(qVal);
    const subText = qVal ? `Buscar: ${esc(qVal)}` : 'Ver plataforma';
    return `<a class="search-btn" href="${url}" target="_blank" rel="noopener noreferrer">
      <span class="ico">${p.ico}</span>
      <span class="lbl">${esc(p.name)}<span class="sub">${subText}</span></span>
    </a>`;
  }).join('');
}

// ── Stats ────────────────────────────────────────────────────────────────────
function renderStats({ total, pendientes, aplicadas, entrevistas }) {
  el.sTot.textContent = total;
  el.sPen.textContent = pendientes;
  el.sApl.textContent = aplicadas;
  el.sEnt.textContent = entrevistas;
}

// ── Offer list ───────────────────────────────────────────────────────────────
function renderOffers(jobs) {
  if (!jobs.length) {
    el.offerList.innerHTML = `
      <div class="empty-state">
        <span class="empty-state-icon">📭</span>
        Todavía no cargaste ofertas.<br>Agregá una usando el formulario de arriba.
      </div>`;
    return;
  }

  el.offerList.innerHTML = jobs.map(job => `
    <article class="offer-card" id="oc-${job.id}" data-id="${job.id}">
      <div class="offer-header">
        <div>
          <p class="offer-title">${esc(job.puesto)}</p>
          <p class="offer-meta">🏢 ${esc(job.empresa)} · ${esc(job.fecha)}</p>
        </div>
        <span class="badge badge-${job.estado}">${ESTADO_LABELS[job.estado] ?? job.estado}</span>
      </div>

      ${job.desc
        ? `<p class="offer-desc" id="desc-${job.id}">${esc(job.desc)}</p>`
        : ''}

      <div class="offer-actions">
        ${job.link
          ? `<a class="btn-sm" href="${esc(job.link)}" target="_blank" rel="noopener noreferrer">🔗 Ver oferta</a>`
          : ''}
        ${job.desc
          ? `<button class="btn-sm js-toggle-desc" data-id="${job.id}">📖 Ver más</button>`
          : ''}
        <select class="status-select js-status" data-id="${job.id}">
          ${Object.entries(ESTADO_LABELS).map(([val, lbl]) =>
            `<option value="${val}"${job.estado === val ? ' selected' : ''}>${lbl}</option>`
          ).join('')}
        </select>
        <button class="btn-sm danger js-delete" data-id="${job.id}">🗑️ Eliminar</button>
      </div>

      <!-- AI TOOLS -->
      <div class="ai-section">
        <p class="ai-label">✦ Herramientas IA</p>
        <div class="ai-row">
          <button class="btn-ai fit   js-ai" data-id="${job.id}" data-type="fit">✦ Analizar FIT</button>
          <button class="btn-ai cv    js-ai" data-id="${job.id}" data-type="cv">✦ Adaptar CV</button>
          <button class="btn-ai carta js-ai" data-id="${job.id}" data-type="carta">✦ Crear Carta</button>
        </div>
      </div>
    </article>
  `).join('');
}

// ── Toggle description ────────────────────────────────────────────────────────
function toggleDesc(id) {
  document.getElementById(`desc-${id}`)?.classList.toggle('expanded');
}

// ── CV form: populate fields ──────────────────────────────────────────────────
function setCVData(cvData) {
  CV_FIELDS.forEach(({ id, key }) => {
    const field = el[id];
    if (field) field.value = cvData[key] || '';
  });
  // Update header subtitle dynamically
  updateSubtitle(cvData);
}

// ── Update header subtitle from CV data ──────────────────────────────────────
function updateSubtitle(cvData) {
  const parts = [];
  if (cvData.nombre) parts.push(cvData.nombre);
  if (cvData.rol) parts.push(cvData.rol);
  el.appSubtitle.textContent = parts.length
    ? parts.join(' · ')
    : 'Tu asistente de búsqueda laboral';
}

// ── Collect CV data from form ────────────────────────────────────────────────
function collectCVData() {
  const data = {};
  CV_FIELDS.forEach(({ id, key }) => {
    const field = el[id];
    if (field) data[key] = field.value;
  });
  return data;
}

// ── Form reset ────────────────────────────────────────────────────────────────
function resetForm() {
  el.offerForm.reset();
}

// ── Modal helpers ─────────────────────────────────────────────────────────────
function openDeleteModal()  { el.modalDelete.removeAttribute('hidden'); }
function closeDeleteModal() { el.modalDelete.setAttribute('hidden', ''); }

// ── Event binders (called by Controller) ─────────────────────────────────────
function bindTabNav(handler) {
  document.querySelector('.tab-nav').addEventListener('click', e => {
    const btn = e.target.closest('.tab-btn');
    if (btn) handler(btn.dataset.tab);
  });
}

function bindRoleTabs(handler) {
  el.roleTabs.addEventListener('click', e => {
    // Delete role
    const delBtn = e.target.closest('[data-role-del]');
    if (delBtn) {
      handler.deleteRole(Number(delBtn.dataset.roleDel));
      return;
    }
    // Select role
    const btn = e.target.closest('.role-tab');
    if (btn) handler.selectRole(Number(btn.dataset.role));
  });
}

function bindAddRole(handler) {
  const submit = () => {
    const val = el.roleInput.value.trim();
    if (val) {
      handler(val);
      el.roleInput.value = '';
    }
  };
  el.btnAddRole.addEventListener('click', submit);
  el.roleInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') { e.preventDefault(); submit(); }
  });
}

function bindOfferForm(handler) {
  el.offerForm.addEventListener('submit', e => {
    e.preventDefault();
    handler({
      puesto:  el.fPuesto.value,
      empresa: el.fEmpresa.value,
      link:    el.fLink.value,
      desc:    el.fDesc.value,
      estado:  el.fEstado.value,
    });
  });
}

function bindOfferList(handlers) {
  el.offerList.addEventListener('click', e => {
    // Toggle description
    const toggleBtn = e.target.closest('.js-toggle-desc');
    if (toggleBtn) { handlers.toggleDesc(Number(toggleBtn.dataset.id)); return; }

    // Delete button
    const deleteBtn = e.target.closest('.js-delete');
    if (deleteBtn) { handlers.requestDelete(Number(deleteBtn.dataset.id)); return; }

    // AI buttons
    const aiBtn = e.target.closest('.js-ai');
    if (aiBtn) { handlers.aiAction(Number(aiBtn.dataset.id), aiBtn.dataset.type); return; }
  });

  el.offerList.addEventListener('change', e => {
    const sel = e.target.closest('.js-status');
    if (sel) handlers.statusChange(Number(sel.dataset.id), sel.value);
  });
}

function bindCVInput(handler) {
  // Listen on each CV field for real-time save
  CV_FIELDS.forEach(({ id }) => {
    const field = el[id];
    if (field) {
      field.addEventListener('input', () => {
        // Phone validation: strip invalid chars in real time
        if (id === 'cvTelefono') {
          const pos = field.selectionStart;
          const cleaned = field.value.replace(/[^+0-9]/g, '');
          if (cleaned !== field.value) {
            field.value = cleaned;
            field.setSelectionRange(pos - 1, pos - 1);
          }
        }
        const data = collectCVData();
        handler(data);
      });
    }
  });
}

function bindDownloadCV(handler) {
  el.btnDownloadCV.addEventListener('click', handler);
}

function bindExport(handler) {
  el.btnExport.addEventListener('click', handler);
}

function bindImport(handler) {
  el.btnImportTrig.addEventListener('click', () => el.importFile.click());
  el.importFile.addEventListener('change', e => {
    const file = e.target.files[0];
    if (file) handler(file);
    e.target.value = '';
  });
}

function bindModalCancel(handler) {
  el.modalCancel.addEventListener('click', handler);
  el.modalDelete.addEventListener('click', e => {
    if (e.target === el.modalDelete) handler(); // click-outside
  });
}

function bindModalConfirm(handler) {
  el.modalConfirm.addEventListener('click', handler);
}

// ── Public API ────────────────────────────────────────────────────────────────
export default {
  // Render
  renderRoleTabs,
  renderSearchButtons,
  renderStats,
  renderOffers,
  setCVData,
  resetForm,
  // Interaction helpers
  switchTab,
  toggleDesc,
  showToast,
  openDeleteModal,
  closeDeleteModal,
  updateSubtitle,
  // Event binders
  bindTabNav,
  bindRoleTabs,
  bindAddRole,
  bindOfferForm,
  bindOfferList,
  bindCVInput,
  bindDownloadCV,
  bindExport,
  bindImport,
  bindModalCancel,
  bindModalConfirm,
};
