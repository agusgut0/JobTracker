/**
 * @file Aplicaciones.js
 * @description Vista encargada de la gestión del funnel de postulaciones y las herramientas de IA.
 */

import { getJobs, getStats, addJob, updateJobStatus, deleteJob, getCVData } from '../utils/storage.js';
import { copyToClipboard } from '../utils/clipboard.js';
import { promptFIT, promptAdaptarCV, promptCarta } from '../utils/prompts.js';
import { showToast } from '../components/Toast.js';

// ── Variables Globales de Estado UI ──────────────────────────────────────────
let pendingDelete = null; // ID de la oferta pendiente de eliminación
const filters = {
  puesto: '',
  empresa: '',
  estado: 'todos'
};

// ── Caché del DOM ────────────────────────────────────────────────────────────
const el = {};

function cacheDOM() {
  el.sTot          = document.getElementById('sTot');
  el.sPen          = document.getElementById('sPen');
  el.sApl          = document.getElementById('sApl');
  el.sEnt          = document.getElementById('sEnt');
  el.offerForm     = document.getElementById('offerForm');
  el.fPuesto       = document.getElementById('fPuesto');
  el.fEmpresa      = document.getElementById('fEmpresa');
  el.fLink         = document.getElementById('fLink');
  el.fDesc         = document.getElementById('fDesc');
  el.fEstado       = document.getElementById('fEstado');
  el.offerList     = document.getElementById('offerList');
  // Filters
  el.filterPuesto  = document.getElementById('filterPuesto');
  el.filterEmpresa = document.getElementById('filterEmpresa');
  el.filterEstado  = document.getElementById('filterEstado');
  // Modals
  el.modalDelete   = document.getElementById('modalDelete');
  el.modalCancel   = document.getElementById('modalCancelBtn');
  el.modalConfirm  = document.getElementById('modalConfirmBtn');
}

const ESTADO_LABELS = {
  pendiente:  '🟠 Pendiente',
  aplicada:   '🟢 Aplicada',
  entrevista: '🔵 Entrevista',
  descartada: '🔴 Descartada',
};

/** Escapa HTML */
const esc = s => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;')
  .replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// ── Renderizado ──────────────────────────────────────────────────────────────

/** Refresca las métricas */
function renderStats() {
  const { total, pendientes, aplicadas, entrevistas } = getStats();
  if (el.sTot) el.sTot.textContent = total;
  if (el.sPen) el.sPen.textContent = pendientes;
  if (el.sApl) el.sApl.textContent = aplicadas;
  if (el.sEnt) el.sEnt.textContent = entrevistas;
}

/** Dibuja la lista de tarjetas de postulación */
function renderOffers() {
  if (!el.offerList) return;
  
  // Filter jobs based on state
  const jobs = getJobs().filter(job => {
    const matchPuesto = job.puesto.toLowerCase().includes(filters.puesto.toLowerCase());
    const matchEmpresa = job.empresa.toLowerCase().includes(filters.empresa.toLowerCase());
    const matchEstado = filters.estado === 'todos' || job.estado === filters.estado;
    return matchPuesto && matchEmpresa && matchEstado;
  });

  if (!jobs.length) {
    el.offerList.innerHTML = `
      <div class="empty-state">
        <h3>No hay postulaciones para mostrar</h3>
        <p>No se encontraron resultados para los filtros actuales, o no tenés postulaciones guardadas.</p>
      </div>`;
    return;
  }

  el.offerList.innerHTML = jobs.map(job => `
    <article class="offer-card">
      <!-- HEADER -->
      <div class="offer-header">
        <h3 class="offer-title" title="${esc(job.puesto)}">${esc(job.puesto)}</h3>
        <span class="badge badge-${job.estado}" data-status="${job.estado}">${ESTADO_LABELS[job.estado]}</span>
      </div>
      <!-- META -->
      <div class="offer-meta">
        <span class="company" title="${esc(job.empresa)}">🏢 ${esc(job.empresa)}</span>
        <span class="date">📅 ${job.fecha}</span>
      </div>
      <!-- DESC -->
      ${job.desc ? `<div id="desc-${job.id}" class="offer-desc">${esc(job.desc)}</div>` : ''}
      <!-- ACTIONS -->
      <div class="offer-actions">
        ${job.link
          ? `<a href="${esc(job.link)}" target="_blank" rel="noopener noreferrer" class="btn-sm">🔗 Ver oferta</a>`
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

export function refresh() {
  renderStats();
  renderOffers();
}

// ── Handlers ─────────────────────────────────────────────────────────────────

function handleAddOffer(e) {
  e.preventDefault();
  const puesto  = el.fPuesto.value.trim();
  const empresa = el.fEmpresa.value.trim();
  if (!puesto || !empresa) {
    showToast('Puesto y Empresa son obligatorios.');
    return;
  }
  addJob({
    puesto,
    empresa,
    link: el.fLink.value,
    desc: el.fDesc.value,
    estado: el.fEstado.value
  });
  el.offerForm.reset();
  refresh();
  showToast('Oferta guardada exitosamente.');
}

function handleStatusChange(id, newStatus) {
  if (updateJobStatus(id, newStatus)) {
    refresh();
    showToast('Estado actualizado.');
  }
}

function handleDeleteClick(id) {
  pendingDelete = id;
  el.modalDelete.removeAttribute('hidden');
}

function handleModalCancel() {
  pendingDelete = null;
  el.modalDelete.setAttribute('hidden', '');
}

function handleModalConfirm() {
  if (pendingDelete !== null) {
    deleteJob(pendingDelete);
    pendingDelete = null;
    el.modalDelete.setAttribute('hidden', '');
    refresh();
    showToast('Oferta eliminada.');
  }
}

async function handleAIAction(jobId, type) {
  const job = getJobs().find(j => j.id === jobId);
  const cvData = getCVData(); // Obtiene el CV actualmente activo
  if (!job) return;

  let prompt = '';
  let toastMsg = '';

  switch (type) {
    case 'fit':
      prompt   = promptFIT(job, cvData);
      toastMsg = '✦ Prompt de FIT copiado. ¡Pegalo en tu IA favorita!';
      break;
    case 'cv':
      prompt   = promptAdaptarCV(job, cvData);
      toastMsg = '✦ Prompt de CV copiado. ¡Pegalo en tu IA favorita!';
      break;
    case 'carta':
      prompt   = promptCarta(job, cvData);
      toastMsg = '✦ Prompt de carta copiado. ¡Pegalo en tu IA favorita!';
      break;
    default:
      return;
  }

  await copyToClipboard(prompt);
  showToast(toastMsg);
}

// ── Inicialización ───────────────────────────────────────────────────────────

export function init() {
  cacheDOM();
  // Bind filters
  if (el.filterPuesto) {
    el.filterPuesto.addEventListener('input', e => {
      filters.puesto = e.target.value;
      renderOffers();
    });
  }
  if (el.filterEmpresa) {
    el.filterEmpresa.addEventListener('input', e => {
      filters.empresa = e.target.value;
      renderOffers();
    });
  }
  if (el.filterEstado) {
    el.filterEstado.addEventListener('change', e => {
      filters.estado = e.target.value;
      renderOffers();
    });
  }

  if (el.offerForm) {
    el.offerForm.addEventListener('submit', handleAddOffer);
  }

  if (el.offerList) {
    el.offerList.addEventListener('click', e => {
      // Toggle description
      const tgl = e.target.closest('.js-toggle-desc');
      if (tgl) {
        document.getElementById(`desc-${tgl.dataset.id}`)?.classList.toggle('expanded');
        return;
      }
      // Delete button
      const del = e.target.closest('.js-delete');
      if (del) {
        handleDeleteClick(Number(del.dataset.id));
        return;
      }
      // AI buttons
      const aiBtn = e.target.closest('.js-ai');
      if (aiBtn) {
        handleAIAction(Number(aiBtn.dataset.id), aiBtn.dataset.type);
        return;
      }
    });

    // Status change
    el.offerList.addEventListener('change', e => {
      const sel = e.target.closest('.js-status');
      if (sel) handleStatusChange(Number(sel.dataset.id), sel.value);
    });
  }

  if (el.modalCancel && el.modalConfirm) {
    el.modalCancel.addEventListener('click', handleModalCancel);
    el.modalDelete.addEventListener('click', e => {
      if (e.target === el.modalDelete) handleModalCancel();
    });
    el.modalConfirm.addEventListener('click', handleModalConfirm);
  }

  refresh();
}
