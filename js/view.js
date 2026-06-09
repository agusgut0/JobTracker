/**
 * VIEW — Owns the DOM entirely.
 * Renders data, wires no business logic.
 * Exposes bindXxx() methods so the Controller can attach listeners.
 */

import { docFilename } from './utils/prompts.js';

// ── Platform data (presentation concern) ────────────────────────────────────
const ROLES = [
  {
    id: 'analista', label: 'Analista Funcional / Sistemas',
    queries: ['analista funcional sistemas', 'analista de sistemas información', 'functional analyst ERP'],
  },
  {
    id: 'soporte', label: 'Soporte IT / Aplicaciones',
    queries: ['soporte IT aplicaciones', 'helpdesk sistemas soporte', 'IT support analyst'],
  },
  {
    id: 'erp', label: 'ERP / Automatización',
    queries: ['especialista ERP implementación', 'analista ERP Totvs sistemas', 'ERP automation analyst'],
  },
];

const PLATFORMS_A = [
  { name: 'Greenhouse',      ico: '🌱', domain: 'boards.greenhouse.io' },
  { name: 'Ashby',           ico: '📐', domain: 'jobs.ashbyhq.com' },
  { name: 'Lever',           ico: '⚙️', domain: 'jobs.lever.co' },
  { name: 'SmartRecruiters', ico: '🎯', domain: 'jobs.smartrecruiters.com' },
  { name: 'Workday',         ico: '🏢', domain: 'myworkdayjobs.com' },
  { name: 'BambooHR',        ico: '🎋', domain: 'bamboohr.com/careers' },
  { name: 'Workable',        ico: '💼', domain: 'apply.workable.com' },
];

const PLATFORMS_B = [
  { name: 'LinkedIn',     ico: '💼', url: q => `https://www.linkedin.com/jobs/search/?keywords=${enc(q)}&location=C%C3%B3rdoba%2C+Argentina&f_WT=2%2C1` },
  { name: 'Indeed',       ico: '🔍', url: q => `https://ar.indeed.com/jobs?q=${enc(q)}&l=C%C3%B3rdoba&remotejob=032b3046-06a3-4876-8dfd-474eb5e7ed11` },
  { name: 'Workana',      ico: '🖥️', url: q => `https://www.workana.com/jobs?language=es&search=${enc(q)}&country=AR` },
  { name: 'Torre.ai',     ico: '🗼', url: q => `https://torre.ai/jobs?query=${enc(q)}&locationName=C%C3%B3rdoba,+Argentina` },
  { name: 'Wellfound',    ico: '🚀', url: q => `https://wellfound.com/jobs?q=${enc(q)}&remote=true` },
  { name: 'Bumeran',      ico: '🟡', url: q => `https://www.bumeran.com.ar/empleos-busqueda-${encodeURIComponent(q.replace(/ /g, '-'))}.html?provincia=cordoba` },
  { name: 'Computrabajo', ico: '🔶', url: q => `https://ar.computrabajo.com/trabajo-de-${encodeURIComponent(q.replace(/ /g, '-'))}?l=C%C3%B3rdoba` },
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

// ── DOM cache ────────────────────────────────────────────────────────────────
const $ = id => document.getElementById(id);

const el = {
  // Nav
  tabBtns:        () => document.querySelectorAll('.tab-btn'),
  tabPanels:      () => document.querySelectorAll('.tab-panel'),
  // Search tab
  roleTabs:       $('roleTabs'),
  groupA:         $('groupA'),
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
  // CV
  cvMain:         $('cvMain'),
  // Backup
  btnExport:      $('btnExport'),
  btnImportTrig:  $('btnImportTrigger'),
  importFile:     $('importFile'),
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

// ── Search buttons ───────────────────────────────────────────────────────────
function renderRoleTabs(activeRoleId) {
  el.roleTabs.innerHTML = ROLES.map(r =>
    `<button class="role-tab${r.id === activeRoleId ? ' active' : ''}" data-role="${r.id}">${r.label}</button>`
  ).join('');
}

function renderSearchButtons(activeRoleId) {
  const qs = ROLES.find(r => r.id === activeRoleId)?.queries ?? ROLES[0].queries;

  el.groupA.innerHTML = PLATFORMS_A.map((p, i) => {
    const url = `https://www.google.com/search?q=site:${p.domain}+${enc(qs[i % 3])}`;
    return `<a class="search-btn" href="${url}" target="_blank" rel="noopener noreferrer">
      <span class="ico">${p.ico}</span>
      <span class="lbl">${esc(p.name)}<span class="sub">via Google site:</span></span>
    </a>`;
  }).join('');

  el.groupB.innerHTML = PLATFORMS_B.map((p, i) =>
    `<a class="search-btn" href="${p.url(qs[i % 3])}" target="_blank" rel="noopener noreferrer">
      <span class="ico">${p.ico}</span>
      <span class="lbl">${esc(p.name)}<span class="sub">Córdoba + Remoto</span></span>
    </a>`
  ).join('');
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

        <!-- CV paste area -->
        <div class="paste-area" id="paste-cv-${job.id}">
          <p class="paste-steps">
            1. Prompt copiado ✓ Pegalo en tu IA favorita.<br>
            2. Cuando la IA responda, pegá el CV adaptado acá para descargarlo:
          </p>
          <textarea class="paste-textarea" id="result-cv-${job.id}"
            placeholder="Pegá acá el CV adaptado por la IA..."></textarea>
          <button class="btn-download js-download" data-id="${job.id}" data-doc="cv">
            📥 Descargar CV (.doc)
          </button>
        </div>

        <!-- Carta paste area -->
        <div class="paste-area" id="paste-carta-${job.id}">
          <p class="paste-steps">
            1. Prompt copiado ✓ Pegalo en tu IA favorita.<br>
            2. Cuando la IA responda, pegá la carta acá para descargarla:
          </p>
          <textarea class="paste-textarea" id="result-carta-${job.id}"
            placeholder="Pegá acá la carta generada por la IA..."></textarea>
          <button class="btn-download js-download" data-id="${job.id}" data-doc="carta">
            📥 Descargar Carta (.doc)
          </button>
        </div>
      </div>
    </article>
  `).join('');
}

// ── Toggle description ────────────────────────────────────────────────────────
function toggleDesc(id) {
  document.getElementById(`desc-${id}`)?.classList.toggle('expanded');
}

// ── Toggle paste area ─────────────────────────────────────────────────────────
function togglePasteArea(jobId, docType) {
  const target = document.getElementById(`paste-${docType}-${jobId}`);
  if (!target) return;
  // Close the other area in the same card first
  const card = document.getElementById(`oc-${jobId}`);
  card.querySelectorAll('.paste-area.open').forEach(a => {
    if (a !== target) a.classList.remove('open');
  });
  target.classList.toggle('open');
}

// ── Download .doc ─────────────────────────────────────────────────────────────
function downloadDoc(jobId, docType, empresa) {
  const taId   = `result-${docType}-${jobId}`;
  const text   = document.getElementById(taId)?.value.trim() ?? '';
  if (!text) { showToast('⚠️ Primero pegá la respuesta de la IA en el campo.'); return; }

  // Wrap in minimal RTF so Word opens it cleanly
  const rtfBody = text
    .replace(/\\/g, '\\\\')
    .replace(/\{/g, '\\{')
    .replace(/\}/g, '\\}')
    .split('\n').join('\\line\n');

  const rtf = `{\\rtf1\\ansi\\deff0\n{\\fonttbl{\\f0\\fnil\\fcharset0 Calibri;}}\n\\widowctrl\\wpaper12240\\wpapr9790\\margl1800\\margr1800\\margt1440\\margb1440\n\\f0\\fs22 ${rtfBody}\n}`;

  const blob = new Blob([rtf], { type: 'application/msword' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = docFilename(empresa, docType);
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  showToast(`📄 ${a.download} descargado.`);
}

// ── CV textarea ───────────────────────────────────────────────────────────────
function setCVText(text) {
  el.cvMain.value = text;
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
    const btn = e.target.closest('.role-tab');
    if (btn) handler(btn.dataset.role);
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

    // Download button
    const dlBtn = e.target.closest('.js-download');
    if (dlBtn) { handlers.download(Number(dlBtn.dataset.id), dlBtn.dataset.doc); return; }
  });

  el.offerList.addEventListener('change', e => {
    const sel = e.target.closest('.js-status');
    if (sel) handlers.statusChange(Number(sel.dataset.id), sel.value);
  });
}

function bindCVInput(handler) {
  el.cvMain.addEventListener('input', () => handler(el.cvMain.value));
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
  setCVText,
  resetForm,
  // Interaction helpers
  switchTab,
  toggleDesc,
  togglePasteArea,
  downloadDoc,
  showToast,
  openDeleteModal,
  closeDeleteModal,
  // Event binders
  bindTabNav,
  bindRoleTabs,
  bindOfferForm,
  bindOfferList,
  bindCVInput,
  bindExport,
  bindImport,
  bindModalCancel,
  bindModalConfirm,
};
