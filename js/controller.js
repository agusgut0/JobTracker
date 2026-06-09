/**
 * CONTROLLER — The mediator.
 * Listens to View events → asks Model to mutate → tells View to re-render.
 * No DOM access. No business logic. Pure coordination.
 */

import Model from './model.js';
import View  from './view.js';
import { promptFIT, promptAdaptarCV, promptCarta } from './utils/prompts.js';

// ── Internal state (UI-only, not persisted) ───────────────────────────────────
let activeRole   = 'analista';
let pendingDelete = null;        // job id awaiting confirmation

// ── Clipboard helper ──────────────────────────────────────────────────────────
async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    // Fallback for non-secure contexts
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.cssText = 'position:fixed;opacity:0;top:0;left:0';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); } catch { /* silent */ }
    document.body.removeChild(ta);
  }
}

// ── Refresh helpers ───────────────────────────────────────────────────────────
function refreshJobs() {
  View.renderStats(Model.getStats());
  View.renderOffers(Model.getJobs());
}

// ── Handlers ──────────────────────────────────────────────────────────────────

function onTabNav(tabId) {
  View.switchTab(tabId);
}

function onRoleSelect(roleId) {
  activeRole = roleId;
  View.renderRoleTabs(activeRole);
  View.renderSearchButtons(activeRole);
}

function onOfferSubmit(formData) {
  const { puesto, empresa } = formData;
  if (!puesto.trim() || !empresa.trim()) {
    View.showToast('⚠️ Completá al menos Puesto y Empresa.');
    return;
  }
  Model.addJob(formData);
  View.resetForm();
  refreshJobs();
  View.showToast('✅ Oferta guardada correctamente.');
}

function onStatusChange(id, newEstado) {
  if (Model.updateJobStatus(id, newEstado)) {
    refreshJobs();
    View.showToast('Estado actualizado.');
  }
}

function onRequestDelete(id) {
  pendingDelete = id;
  View.openDeleteModal();
}

function onModalCancel() {
  pendingDelete = null;
  View.closeDeleteModal();
}

function onModalConfirm() {
  if (pendingDelete !== null) {
    Model.deleteJob(pendingDelete);
    pendingDelete = null;
    View.closeDeleteModal();
    refreshJobs();
    View.showToast('Oferta eliminada.');
  }
}

async function onAIAction(jobId, type) {
  const job    = Model.getJobs().find(j => j.id === jobId);
  const cvText = Model.getCVText();
  if (!job) return;

  let prompt = '';
  let toastMsg = '';

  switch (type) {
    case 'fit':
      prompt   = promptFIT(job, cvText);
      toastMsg = '✦ Prompt de FIT copiado. ¡Pegalo en tu IA favorita!';
      break;
    case 'cv':
      prompt   = promptAdaptarCV(job, cvText);
      toastMsg = '✦ Prompt de CV copiado. Pegalo en tu IA y luego el resultado en el campo de abajo.';
      View.togglePasteArea(jobId, 'cv');
      break;
    case 'carta':
      prompt   = promptCarta(job, cvText);
      toastMsg = '✦ Prompt de carta copiado. Pegalo en tu IA y luego el resultado en el campo de abajo.';
      View.togglePasteArea(jobId, 'carta');
      break;
    default:
      return;
  }

  await copyToClipboard(prompt);
  View.showToast(toastMsg);
}

function onDownload(jobId, docType) {
  const job = Model.getJobs().find(j => j.id === jobId);
  if (!job) return;
  View.downloadDoc(jobId, docType, job.empresa);
}

function onToggleDesc(id) {
  View.toggleDesc(id);
}

function onCVInput(newText) {
  Model.editCV(newText);
}

function onExport() {
  const count = Model.exportJSON();
  const msg   = count > 0
    ? `📥 ${count} oferta(s) exportadas correctamente.`
    : '📥 JSON descargado (sin ofertas aún, pero el CV está guardado).';
  View.showToast(msg);
}

async function onImport(file) {
  try {
    const { jobCount } = await Model.importJSON(file);
    View.setCVText(Model.getCVText());
    refreshJobs();
    View.showToast(`📤 Importación exitosa: ${jobCount} oferta(s) restauradas.`);
  } catch {
    View.showToast('⚠️ No se pudo leer el archivo. ¿Es un JSON válido?');
  }
}

// ── Init ──────────────────────────────────────────────────────────────────────
export function init() {
  // 1. Hydrate model from localStorage
  Model.load();

  // 2. Initial renders
  View.renderRoleTabs(activeRole);
  View.renderSearchButtons(activeRole);
  View.renderStats(Model.getStats());
  View.renderOffers(Model.getJobs());
  View.setCVText(Model.getCVText());

  // 3. Wire events
  View.bindTabNav(onTabNav);
  View.bindRoleTabs(onRoleSelect);
  View.bindOfferForm(onOfferSubmit);

  View.bindOfferList({
    toggleDesc:    onToggleDesc,
    requestDelete: onRequestDelete,
    statusChange:  onStatusChange,
    aiAction:      onAIAction,
    download:      onDownload,
  });

  View.bindCVInput(onCVInput);
  View.bindExport(onExport);
  View.bindImport(onImport);
  View.bindModalCancel(onModalCancel);
  View.bindModalConfirm(onModalConfirm);
}
