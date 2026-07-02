/**
 * @file MiCV.js
 * @description Vista encargada del formulario del perfil profesional, el carrusel de 20 CVs y exportación a DOCX.
 */

import { getActiveCVIndex, getCVData, getCVSlots, setActiveCVIndex, saveCVSlot, deleteCVSlot } from '../utils/storage.js';
import { updateSubtitle, renderCVGlobalSelector } from '../components/Sidebar.js';
import { showToast } from '../components/Toast.js';

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

// ── Caché del DOM ────────────────────────────────────────────────────────────

const el = {
  cvPrev:         document.getElementById('cvPrev'),
  cvNext:         document.getElementById('cvNext'),
  cvSlotTitle:    document.getElementById('cvSlotTitle'),
  btnSaveCV:      document.getElementById('btnSaveCV'),
  btnDeleteCV:    document.getElementById('btnDeleteCV'),
  btnDownloadCV:  document.getElementById('btnDownloadCV'),
};

const fields = {};
CV_FIELDS.forEach(f => {
  fields[f.id] = document.getElementById(f.id);
});

// ── Helpers ──────────────────────────────────────────────────────────────────

function collectCVData() {
  const data = {};
  CV_FIELDS.forEach(({ id, key }) => {
    if (fields[id]) data[key] = fields[id].value;
  });
  return data;
}

function clearCVForm() {
  CV_FIELDS.forEach(({ id }) => {
    if (fields[id]) fields[id].value = '';
  });
}

function setCVData(cvData) {
  CV_FIELDS.forEach(({ id, key }) => {
    if (fields[id]) fields[id].value = cvData[key] || '';
  });
}

// ── Renderizado ──────────────────────────────────────────────────────────────

/** Refresca la vista local de MiCV basándose en el estado de Storage */
export function refresh() {
  const index = getActiveCVIndex();
  const cvData = getCVData();
  const slots = getCVSlots();

  // Actualizar Título del Carrusel
  if (el.cvSlotTitle) {
    const rol = cvData && cvData.rol ? ` - ${cvData.rol}` : '';
    el.cvSlotTitle.textContent = `CV ${index + 1}${rol}`;
  }

  // Poblar formulario
  setCVData(cvData);

  // Actualizar componentes globales
  updateSubtitle(cvData);
  renderCVGlobalSelector(slots, index);
}

// ── Handlers ─────────────────────────────────────────────────────────────────

function handleNavCarousel(dir) {
  let index = getActiveCVIndex();
  if (dir === 'prev') {
    index = (index - 1 + 20) % 20;
  } else {
    index = (index + 1) % 20;
  }
  setActiveCVIndex(index);
  refresh();
}

function handleSaveCV() {
  const data = collectCVData();
  saveCVSlot(data);
  refresh();
  showToast(`💾 CV ${getActiveCVIndex() + 1} guardado correctamente.`);
}

function handleDeleteCV() {
  deleteCVSlot();
  clearCVForm();
  updateSubtitle({ nombre: '', rol: '' });
  refresh();
  showToast(`🗑️ CV ${getActiveCVIndex() + 1} eliminado.`);
}

/** Descarga el CV actual usando PizZip y FileSaver.js */
async function handleDownloadCV() {
  const cv = getCVData();
  if (!cv.nombre) {
    showToast('⚠️ Completá al menos tu Nombre y Apellido para descargar el CV.');
    return;
  }

  try {
    const response = await fetch('js/utils/PlantillaCV.docx');
    if (!response.ok) throw new Error('No se pudo cargar la plantilla');
    const arrayBuffer = await response.arrayBuffer();

    const zip = new window.PizZip(arrayBuffer);
    const docXml = zip.file('word/document.xml');
    if (!docXml) throw new Error('Plantilla inválida');
    let content = docXml.asText();

    const replacements = {
      'Nombre y Apellido': cv.nombre || '',
      'Puesto o Rol':      cv.rol || '',
      'Email':             cv.email || '',
      'Teléfono':          cv.telefono || '',
      'LinkedIn':          cv.linkedin || '',
      'Porfolio':          cv.portfolio || '',
      'Portfolio':         cv.portfolio || '',
      'Perfil profesional':cv.resumen || '',
      'Experiencia laboral':cv.experiencia || '',
      'Habilidades técnicas':cv.habilidadesTec || '',
      'Formación académica':cv.formacion || '',
      'Habilidades blandas':cv.habilidadesBlandas || '',
      'Idiomas':           cv.idiomas || '',
    };

    content = content.replace(
      /\[(<\/w:t><\/w:r>(?:<w:r[^>]*>)?(?:<w:rPr>.*?<\/w:rPr>)?<w:r[^>]*>(?:<w:rPr>.*?<\/w:rPr>)?<w:t[^>]*>)([^\]]*?)\]/g,
      match => match.replace(/<[^>]+>/g, '')
    );

    for (const [tag, value] of Object.entries(replacements)) {
      const safeValue = value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
      
      const escaped = tag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`\\[${escaped}\\]`, 'g');
      content = content.replace(regex, safeValue);
    }

    zip.file('word/document.xml', content);
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

    window.saveAs(blob, `CV_${slug}.docx`);
    showToast('📥 Descarga iniciada con éxito.');
  } catch (error) {
    showToast('⚠️ Error al generar CV. Revisá la consola.');
  }
}

function initPhoneValidation() {
  const field = fields.cvTelefono;
  if (field) {
    field.addEventListener('input', () => {
      const pos = field.selectionStart;
      const cleaned = field.value.replace(/[^+0-9]/g, '');
      if (cleaned !== field.value) {
        field.value = cleaned;
        field.setSelectionRange(pos - 1, pos - 1);
      }
    });
  }
}

// ── Inicialización ───────────────────────────────────────────────────────────

export function init() {
  if (el.cvPrev) el.cvPrev.addEventListener('click', () => handleNavCarousel('prev'));
  if (el.cvNext) el.cvNext.addEventListener('click', () => handleNavCarousel('next'));
  
  if (el.btnSaveCV) el.btnSaveCV.addEventListener('click', handleSaveCV);
  if (el.btnDeleteCV) el.btnDeleteCV.addEventListener('click', handleDeleteCV);
  if (el.btnDownloadCV) el.btnDownloadCV.addEventListener('click', handleDownloadCV);

  initPhoneValidation();
  refresh();
}
