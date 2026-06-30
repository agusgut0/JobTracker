/**
 * CONTROLLER — The mediator.
 * Listens to View events → asks Model to mutate → tells View to re-render.
 * No DOM access. No business logic. Pure coordination.
 */

import Model from './model.js';
import View  from './view.js';
import { promptFIT, promptAdaptarCV, promptCarta } from './utils/prompts.js';

// ── Internal state (UI-only, not persisted) ───────────────────────────────────
// ── Internal state (UI-only, not persisted) ───────────────────────────────────
let activeRoleId = null;         // selected role ID
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

function refreshRoles() {
  const roles = Model.getRoles();
  const activeRole = roles.find(r => r.id === activeRoleId);
  View.renderRoleTabs(roles, activeRoleId);
  View.renderSearchButtons(activeRole ? activeRole.label : null);
}

// ── Handlers ──────────────────────────────────────────────────────────────────

function onTabNav(tabId) {
  View.switchTab(tabId);
}

const roleHandlers = {
  selectRole(id) {
    activeRoleId = id;
    refreshRoles();
  },
  deleteRole(id) {
    Model.deleteRole(id);
    if (activeRoleId === id) {
      const roles = Model.getRoles();
      activeRoleId = roles.length ? roles[0].id : null;
    }
    refreshRoles();
    View.showToast('Rol eliminado.');
  }
};

function onAddRole(label) {
  const newRole = Model.addRole(label);
  if (newRole) {
    if (activeRoleId === null) {
      activeRoleId = newRole.id;
    }
    refreshRoles();
    View.showToast('Rol agregado correctamente.');
  } else {
    View.showToast('⚠️ Este rol ya existe.');
  }
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
  const cvData = Model.getCVData();
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
  View.showToast(toastMsg);
}

function onToggleDesc(id) {
  View.toggleDesc(id);
}

function onCVInput(cvData) {
  Model.editCV(cvData);
  View.updateSubtitle(cvData);
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
    View.setCVData(Model.getCVData());
    refreshJobs();
    View.showToast(`📤 Importación exitosa: ${jobCount} oferta(s) restauradas.`);
  } catch {
    View.showToast('⚠️ No se pudo leer el archivo. ¿Es un JSON válido?');
  }
}

async function onDownloadCV() {
  const cv = Model.getCVData();
  if (!cv.nombre) {
    View.showToast('⚠️ Completá al menos tu Nombre y Apellido para descargar el CV.');
    return;
  }

  try {
    const response = await fetch('js/utils/PlantillaCV.docx');
    if (!response.ok) throw new Error('No se pudo cargar la plantilla');
    const arrayBuffer = await response.arrayBuffer();

    // Load the DOCX as a zip
    const zip = new PizZip(arrayBuffer);

    // Get the document.xml content
    const docXml = zip.file('word/document.xml');
    if (!docXml) throw new Error('Plantilla inválida');
    let content = docXml.asText();

    // Replace template placeholders in the XML
    // The template uses [Tag] style placeholders but Word may split them across XML runs.
    // We do a two-pass approach: first try direct replacement, then handle split tags.
    const replacements = {
      'Nombre y Apellido': cv.nombre || '',
      'Puesto o Rol':      cv.rol || '',
      'Email':             cv.email || '',
      'Teléfono':          cv.telefono || '',
      'LinkedIn':          cv.linkedin || '',
      'Porfolio':          cv.portfolio || '',   // Note: template has typo "Porfolio"
      'Portfolio':         cv.portfolio || '',
      'Perfil profesional':cv.resumen || '',
      'Experiencia laboral':cv.experiencia || '',
      'Habilidades técnicas':cv.habilidadesTec || '',
      'Formación académica':cv.formacion || '',
      'Habilidades blandas':cv.habilidadesBlandas || '',
      'Idiomas':           cv.idiomas || '',
    };

    // First: clean up split runs in the XML so placeholders become contiguous
    // This regex finds text within <w:t> tags and concatenates split bracket placeholders
    content = content.replace(
      /\[(<\/w:t><\/w:r>(?:<w:r[^>]*>)?(?:<w:rPr>.*?<\/w:rPr>)?<w:r[^>]*>(?:<w:rPr>.*?<\/w:rPr>)?<w:t[^>]*>)([^\]]*?)\]/g,
      (match) => {
        // Extract just the text content from the XML runs
        const textOnly = match.replace(/<[^>]+>/g, '');
        return textOnly;
      }
    );

    // Now do simple text replacement for each placeholder
    for (const [tag, value] of Object.entries(replacements)) {
      // Escape XML special chars in the replacement value
      const safeValue = value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
      
      // Replace [Tag] with the value
      const escaped = tag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`\\[${escaped}\\]`, 'g');
      content = content.replace(regex, safeValue);
    }

    // Write back the modified XML
    zip.file('word/document.xml', content);

    // Generate and download
    const blob = zip.generate({
      type: 'blob',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });

    const slug = cv.nombre
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9\s]/g, '')
      .trim()
      .replace(/\s+/g, '_')
      .substring(0, 40);

    saveAs(blob, `CV_${slug}.docx`);
    View.showToast('📄 CV descargado correctamente.');
  } catch (err) {
    console.error('Error generando CV:', err);
    View.showToast('⚠️ Error al generar el CV. Revisá la consola para más detalles.');
  }
}

// ── Init ──────────────────────────────────────────────────────────────────────
export function init() {
  // 1. Hydrate model from localStorage
  Model.load();

  // Load initial role state
  const roles = Model.getRoles();
  if (roles.length) {
    activeRoleId = roles[0].id;
  }

  // 2. Initial renders
  const activeRole = roles.find(r => r.id === activeRoleId);
  View.renderRoleTabs(roles, activeRoleId);
  View.renderSearchButtons(activeRole ? activeRole.label : null);

  View.renderStats(Model.getStats());
  View.renderOffers(Model.getJobs());
  View.setCVData(Model.getCVData());

  // 3. Wire events
  View.bindTabNav(onTabNav);
  View.bindRoleTabs(roleHandlers);
  View.bindAddRole(onAddRole);
  View.bindOfferForm(onOfferSubmit);

  View.bindOfferList({
    toggleDesc:    onToggleDesc,
    requestDelete: onRequestDelete,
    statusChange:  onStatusChange,
    aiAction:      onAIAction,
  });

  View.bindCVInput(onCVInput);
  View.bindDownloadCV(onDownloadCV);
  View.bindExport(onExport);
  View.bindImport(onImport);
  View.bindModalCancel(onModalCancel);
  View.bindModalConfirm(onModalConfirm);
}
