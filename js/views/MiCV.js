/**
 * @file MiCV.js
 * @description Vista encargada del formulario del perfil profesional, el carrusel de 20 CVs y exportación a DOCX.
 */

import { getActiveCVIndex, getCVData, getCVSlots, setActiveCVIndex, saveCVSlot, deleteCVSlot, getProfilePic, saveProfilePic, deleteProfilePic } from '../utils/storage.js';
import { updateSubtitle, renderCVGlobalSelector } from '../components/Sidebar.js';
import { showToast } from '../components/Toast.js';
import { buildATSCurriculumHTML } from '../utils/cvTemplateBuilder.js';

const CV_FIELDS = [
  { id: 'cvNombre',            key: 'nombre' },
  { id: 'cvRol',               key: 'rol' },
  { id: 'cvEmail',             key: 'email' },
  { id: 'cvTelefono',          key: 'telefono' },
  { id: 'cvLinkedin',          key: 'linkedin' },
  { id: 'cvPortfolio',         key: 'portfolio' },
  { id: 'cvResumen',           key: 'resumen' },
  // cvExperiencia, cvFormacion, cvHabilidadesTec, cvHabilidadesBlandas, and cvIdiomas are managed separately as sub-forms
];

// ── Caché del DOM ────────────────────────────────────────────────────────────

const el = {};
const fields = {};

function cacheDOM() {
  el.cvPrev              = document.getElementById('cvPrev');
  el.cvNext              = document.getElementById('cvNext');
  el.cvSlotTitle         = document.getElementById('cvSlotTitle');
  el.btnSaveCV           = document.getElementById('btnSaveCV');
  el.btnDeleteCV         = document.getElementById('btnDeleteCV');
  el.btnDownloadCV       = document.getElementById('btnDownloadCV');
  el.btnCopyCV           = document.getElementById('btnCopyCV');
  el.btnPasteCV          = document.getElementById('btnPasteCV');
  el.expContainer        = document.getElementById('cvExperienciaContainer');
  el.btnAddExp           = document.getElementById('btnAddExp');
  
  el.proyectosContainer  = document.getElementById('cvProyectosContainer');
  el.btnAddProyecto      = document.getElementById('btnAddProyecto');
  
  el.pillsHabTec         = document.getElementById('pillsHabTec');
  el.inputHabTec         = document.getElementById('inputHabTec');
  el.btnAddHabTec        = document.getElementById('btnAddHabTec');
  
  el.pillsHabBlandas     = document.getElementById('pillsHabBlandas');
  el.inputHabBlandas     = document.getElementById('inputHabBlandas');
  el.btnAddHabBlandas    = document.getElementById('btnAddHabBlandas');
  
  el.pillsIdiomas        = document.getElementById('pillsIdiomas');
  el.inputIdiomaNombre   = document.getElementById('inputIdiomaNombre');
  el.inputIdiomaNivel    = document.getElementById('inputIdiomaNivel');
  el.btnAddIdioma        = document.getElementById('btnAddIdioma');
  
  el.formacionContainer  = document.getElementById('cvFormacionContainer');
  el.btnAddFormacion     = document.getElementById('btnAddFormacion');
  
  el.globalPicPreview    = document.getElementById('globalPicPreview');
  el.globalPicInput      = document.getElementById('globalPicInput');
  el.btnDeletePic        = document.getElementById('btnDeletePic');

  CV_FIELDS.forEach(f => {
    fields[f.id] = document.getElementById(f.id);
  });
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function collectCVData() {
  const data = {};
  CV_FIELDS.forEach(({ id, key }) => {
    if (fields[id]) data[key] = fields[id].value;
  });
  // Collect structured and dynamic data
  data.experiencia = collectExperiencias();
  data.proyectos = collectProyectos();
  data.formacion = collectFormaciones();
  data.habilidadesTec = collectPills(el.pillsHabTec);
  data.habilidadesBlandas = collectPills(el.pillsHabBlandas);
  data.idiomas = collectLangPills(el.pillsIdiomas);
  return data;
}

function clearCVForm() {
  CV_FIELDS.forEach(({ id }) => {
    if (fields[id]) fields[id].value = '';
  });
  // Clear dynamic fields
  renderExperiencias([]);
  renderProyectos([]);
  renderFormaciones([]);
  renderPills(el.pillsHabTec, []);
  renderPills(el.pillsHabBlandas, []);
  renderLangPills(el.pillsIdiomas, []);
}

function setCVData(cvData) {
  CV_FIELDS.forEach(({ id, key }) => {
    if (fields[id]) fields[id].value = cvData[key] || '';
  });
  // Render dynamic fields
  const exp = cvData.experiencia;
  renderExperiencias(Array.isArray(exp) ? exp : []);
  
  const proy = cvData.proyectos;
  renderProyectos(Array.isArray(proy) ? proy : []);
  
  const form = cvData.formacion;
  renderFormaciones(Array.isArray(form) ? form : []);
  
  renderPills(el.pillsHabTec, Array.isArray(cvData.habilidadesTec) ? cvData.habilidadesTec : []);
  renderPills(el.pillsHabBlandas, Array.isArray(cvData.habilidadesBlandas) ? cvData.habilidadesBlandas : []);
  renderLangPills(el.pillsIdiomas, Array.isArray(cvData.idiomas) ? cvData.idiomas : []);
}

// ── Experiencia Laboral — Sub-form System ────────────────────────────────────

/** Default empty experience entry */
function defaultExp() {
  return { lugar: '', rol: '', fechaInicio: '', fechaFin: '', actualidad: false, descripcion: '' };
}

/** Format a YYYY-MM value into a readable string like "Ene 2023" */
function formatMonth(val) {
  if (!val) return '';
  const [y, m] = val.split('-');
  const months = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  return `${months[parseInt(m, 10) - 1]} ${y}`;
}

/** Builds the header label text from the experience data */
function buildHeaderLabel(exp, index) {
  if (exp.rol && exp.lugar) return `${exp.rol} — ${exp.lugar}`;
  if (exp.rol) return exp.rol;
  if (exp.lugar) return exp.lugar;
  return `Experiencia ${index + 1}`;
}

/** Builds the date range string for the header */
function buildDateRange(exp) {
  const start = formatMonth(exp.fechaInicio);
  const end = exp.actualidad ? 'Actualidad' : formatMonth(exp.fechaFin);
  if (start && end) return `${start} – ${end}`;
  if (start) return `Desde ${start}`;
  return '';
}

/** Creates the rich text editor (toolbar + contenteditable div) */
function createRichEditor(content, placeholder) {
  const wrapper = document.createElement('div');
  wrapper.className = 'exp-richtext-wrapper';

  // Toolbar
  const toolbar = document.createElement('div');
  toolbar.className = 'exp-richtext-toolbar';

  const btnConfigs = [
    { cmd: 'bold',                label: 'B',   title: 'Negrita',         style: 'font-weight:800' },
    { cmd: 'italic',              label: 'I',   title: 'Cursiva',         style: 'font-style:italic' },
    { sep: true },
    { cmd: 'insertUnorderedList', label: '•',   title: 'Lista con viñetas' },
    { cmd: 'insertOrderedList',   label: '1.',  title: 'Lista numerada' },
  ];

  btnConfigs.forEach(cfg => {
    if (cfg.sep) {
      const sep = document.createElement('span');
      sep.className = 'exp-toolbar-sep';
      toolbar.appendChild(sep);
      return;
    }
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'exp-toolbar-btn';
    btn.title = cfg.title;
    btn.innerHTML = cfg.style ? `<span style="${cfg.style}">${cfg.label}</span>` : cfg.label;
    btn.addEventListener('mousedown', (e) => {
      e.preventDefault(); // Prevent focus loss from editor
      document.execCommand(cfg.cmd, false, null);
      updateToolbarState(toolbar, editor);
    });
    toolbar.appendChild(btn);
  });

  // Editor
  const editor = document.createElement('div');
  editor.className = 'exp-richtext-editor';
  editor.contentEditable = 'true';
  editor.setAttribute('data-placeholder', placeholder || 'Describí tus tareas, logros y responsabilidades...');
  editor.innerHTML = content || '';

  // Update toolbar active states on selection change
  editor.addEventListener('keyup', () => updateToolbarState(toolbar, editor));
  editor.addEventListener('mouseup', () => updateToolbarState(toolbar, editor));

  wrapper.appendChild(toolbar);
  wrapper.appendChild(editor);

  return { wrapper, editor };
}

/** Updates toolbar button active states based on current selection */
function updateToolbarState(toolbar, editor) {
  // Only update if editor has focus
  if (!editor.contains(document.getSelection()?.anchorNode)) return;
  const buttons = toolbar.querySelectorAll('.exp-toolbar-btn');
  const cmds = ['bold', 'italic', null, 'insertUnorderedList', 'insertOrderedList'];
  let cmdIndex = 0;
  buttons.forEach(btn => {
    const cmd = cmds[cmdIndex++];
    if (!cmd) return;
    if (document.queryCommandState(cmd)) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
}

/** Renders experience cards from array data */
function renderExperiencias(expArray) {
  if (!el.expContainer) return;
  el.expContainer.innerHTML = '';
  expArray.forEach((exp, i) => {
    el.expContainer.appendChild(createExpCard(exp, i, expArray.length));
  });
}

/** Creates a single experience card */
function createExpCard(exp, index, total) {
  const card = document.createElement('div');
  card.className = 'exp-card';
  card.dataset.index = index;

  // ── Header ──
  const header = document.createElement('div');
  header.className = 'exp-card-header';

  const headerLeft = document.createElement('div');
  headerLeft.className = 'exp-card-header-left';

  const toggle = document.createElement('span');
  toggle.className = 'exp-card-toggle';
  toggle.textContent = '▼';

  const label = document.createElement('span');
  label.className = 'exp-card-label';
  label.textContent = buildHeaderLabel(exp, index);

  const dates = document.createElement('span');
  dates.className = 'exp-card-dates';
  dates.textContent = buildDateRange(exp);

  headerLeft.appendChild(toggle);
  headerLeft.appendChild(label);
  headerLeft.appendChild(dates);

  const btnDel = document.createElement('button');
  btnDel.type = 'button';
  btnDel.className = 'btn-exp-delete';
  btnDel.title = 'Eliminar experiencia';
  btnDel.textContent = '✕';
  btnDel.addEventListener('click', (e) => {
    e.stopPropagation();
    card.style.animation = 'none';
    card.style.opacity = '0';
    card.style.transform = 'translateY(-8px)';
    card.style.transition = 'all .2s ease';
    setTimeout(() => card.remove(), 200);
  });

  header.appendChild(headerLeft);
  header.appendChild(btnDel);

  // Toggle collapse
  header.addEventListener('click', () => {
    card.classList.toggle('collapsed');
  });

  // ── Body (fields) ──
  const body = document.createElement('div');
  body.className = 'exp-card-body';

  const fieldsGrid = document.createElement('div');
  fieldsGrid.className = 'exp-fields';

  // Lugar de trabajo
  const lugarField = createField('Lugar de trabajo', 'text', exp.lugar, 'Ej: Google Argentina');
  fieldsGrid.appendChild(lugarField.wrapper);

  // Rol
  const rolField = createField('Rol / Cargo', 'text', exp.rol, 'Ej: Desarrollador Frontend');
  fieldsGrid.appendChild(rolField.wrapper);

  // Fechas
  const dateField = document.createElement('div');
  dateField.className = 'exp-field full';
  const dateLabel = document.createElement('label');
  dateLabel.textContent = 'Período';

  const dateRow = document.createElement('div');
  dateRow.className = 'exp-date-row';

  const startInput = document.createElement('input');
  startInput.type = 'month';
  startInput.value = exp.fechaInicio || '';
  startInput.title = 'Fecha de inicio';

  const endInput = document.createElement('input');
  endInput.type = 'month';
  endInput.value = exp.fechaFin || '';
  endInput.title = 'Fecha de fin';
  endInput.disabled = !!exp.actualidad;

  const checkLabel = document.createElement('label');
  checkLabel.className = 'exp-checkbox-label';
  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.checked = !!exp.actualidad;
  checkbox.addEventListener('change', () => {
    endInput.disabled = checkbox.checked;
    if (checkbox.checked) endInput.value = '';
    updateCardHeader();
  });
  checkLabel.appendChild(checkbox);
  checkLabel.appendChild(document.createTextNode('Actualidad'));

  dateRow.appendChild(startInput);
  dateRow.appendChild(endInput);
  dateRow.appendChild(checkLabel);

  dateField.appendChild(dateLabel);
  dateField.appendChild(dateRow);
  fieldsGrid.appendChild(dateField);

  // Descripción (rich text)
  const descField = document.createElement('div');
  descField.className = 'exp-field full';
  const descLabel = document.createElement('label');
  descLabel.textContent = 'Descripción del trabajo';
  descField.appendChild(descLabel);

  const { wrapper: richWrapper, editor: richEditor } = createRichEditor(
    exp.descripcion,
    'Describí tus tareas, logros y responsabilidades...'
  );
  descField.appendChild(richWrapper);
  fieldsGrid.appendChild(descField);

  body.appendChild(fieldsGrid);

  // ── Assemble card ──
  card.appendChild(header);
  card.appendChild(body);

  // ── Live header update ──
  function updateCardHeader() {
    const currentExp = {
      lugar: lugarField.input.value,
      rol: rolField.input.value,
      fechaInicio: startInput.value,
      fechaFin: endInput.value,
      actualidad: checkbox.checked,
    };
    label.textContent = buildHeaderLabel(currentExp, index);
    dates.textContent = buildDateRange(currentExp);
  }

  lugarField.input.addEventListener('input', updateCardHeader);
  rolField.input.addEventListener('input', updateCardHeader);
  startInput.addEventListener('change', updateCardHeader);
  endInput.addEventListener('change', updateCardHeader);

  // Store references for data collection
  card._refs = {
    lugar: lugarField.input,
    rol: rolField.input,
    fechaInicio: startInput,
    fechaFin: endInput,
    actualidad: checkbox,
    descripcion: richEditor,
  };

  return card;
}

/** Creates a simple form field (input) */
function createField(labelText, type, value, placeholder) {
  const wrapper = document.createElement('div');
  wrapper.className = 'exp-field';

  const lbl = document.createElement('label');
  lbl.textContent = labelText;

  const input = document.createElement('input');
  input.type = type;
  input.value = value || '';
  input.placeholder = placeholder || '';

  wrapper.appendChild(lbl);
  wrapper.appendChild(input);

  return { wrapper, input };
}

/** Collects all experience cards data into an array */
function collectExperiencias() {
  if (!el.expContainer) return [];
  const cards = el.expContainer.querySelectorAll('.exp-card');
  return Array.from(cards).map(card => {
    const r = card._refs;
    if (!r) return null;
    return {
      lugar:       r.lugar.value.trim(),
      rol:         r.rol.value.trim(),
      fechaInicio: r.fechaInicio.value,
      fechaFin:    r.fechaFin.value,
      actualidad:  r.actualidad.checked,
      descripcion: r.descripcion.innerHTML.trim(),
    };
  }).filter(Boolean);
}

// ── Proyectos Académicos — Sub-form System ───────────────────────────────────

function defaultProyecto() {
  return { nombre: '', descripcion: '' };
}

function renderProyectos(proyectosArray) {
  if (!el.proyectosContainer) return;
  el.proyectosContainer.innerHTML = '';
  proyectosArray.forEach((proy, i) => {
    el.proyectosContainer.appendChild(createProyectoCard(proy, i, proyectosArray.length));
  });
}

function buildProyectoLabel(proy, index) {
  if (proy.nombre) return proy.nombre;
  return `Proyecto ${index + 1}`;
}

function createProyectoCard(proy, index, total) {
  const card = document.createElement('div');
  card.className = 'exp-card';
  card.dataset.index = index;

  const header = document.createElement('div');
  header.className = 'exp-card-header';

  const headerLeft = document.createElement('div');
  headerLeft.className = 'exp-card-header-left';

  const toggle = document.createElement('span');
  toggle.className = 'exp-card-toggle';
  toggle.textContent = '▼';

  const label = document.createElement('span');
  label.className = 'exp-card-label';
  label.textContent = buildProyectoLabel(proy, index);

  headerLeft.appendChild(toggle);
  headerLeft.appendChild(label);

  const btnDel = document.createElement('button');
  btnDel.type = 'button';
  btnDel.className = 'btn-exp-delete';
  btnDel.title = 'Eliminar proyecto';
  btnDel.textContent = '✕';
  btnDel.addEventListener('click', (e) => {
    e.stopPropagation();
    card.style.animation = 'none';
    card.style.opacity = '0';
    card.style.transform = 'translateY(-8px)';
    card.style.transition = 'all .2s ease';
    setTimeout(() => card.remove(), 200);
  });

  header.appendChild(headerLeft);
  header.appendChild(btnDel);

  header.addEventListener('click', () => {
    card.classList.toggle('collapsed');
  });

  const body = document.createElement('div');
  body.className = 'exp-card-body';
  const fieldsGrid = document.createElement('div');
  fieldsGrid.className = 'exp-fields';

  const nombreField = createField('Nombre del proyecto', 'text', proy.nombre, 'Ej: Sistema de Gestión Escolar');
  fieldsGrid.appendChild(nombreField.wrapper);

  const descField = document.createElement('div');
  descField.className = 'exp-field full';
  const descLabel = document.createElement('label');
  descLabel.textContent = 'Descripción del proyecto';
  descField.appendChild(descLabel);

  const { wrapper: richWrapper, editor: richEditor } = createRichEditor(
    proy.descripcion,
    'Describí tu rol, tecnologías usadas y resultados del proyecto...'
  );
  descField.appendChild(richWrapper);
  fieldsGrid.appendChild(descField);

  body.appendChild(fieldsGrid);

  card.appendChild(header);
  card.appendChild(body);

  function updateCardHeader() {
    const currentProy = {
      nombre: nombreField.input.value,
    };
    label.textContent = buildProyectoLabel(currentProy, index);
  }

  nombreField.input.addEventListener('input', updateCardHeader);

  card._refs = {
    nombre: nombreField.input,
    descripcion: richEditor,
  };

  return card;
}

function collectProyectos() {
  if (!el.proyectosContainer) return [];
  const cards = el.proyectosContainer.querySelectorAll('.exp-card');
  return Array.from(cards).map(card => {
    const r = card._refs;
    if (!r) return null;
    return {
      nombre:      r.nombre.value.trim(),
      descripcion: r.descripcion.innerHTML.trim(),
    };
  }).filter(Boolean);
}

// ── Formación Académica — Sub-form System ────────────────────────────────────

function defaultFormacion() {
  return { institucion: '', titulo: '', fechaInicio: '', fechaFin: '', actualidad: false };
}

function renderFormaciones(formArray) {
  if (!el.formacionContainer) return;
  el.formacionContainer.innerHTML = '';
  formArray.forEach((form, i) => {
    el.formacionContainer.appendChild(createFormacionCard(form, i));
  });
}

function buildFormacionLabel(form, index) {
  if (form.titulo && form.institucion) return `${form.titulo} — ${form.institucion}`;
  if (form.titulo) return form.titulo;
  if (form.institucion) return form.institucion;
  return `Formación ${index + 1}`;
}

function createFormacionCard(form, index) {
  const card = document.createElement('div');
  card.className = 'exp-card';
  card.dataset.index = index;

  const header = document.createElement('div');
  header.className = 'exp-card-header';

  const headerLeft = document.createElement('div');
  headerLeft.className = 'exp-card-header-left';
  const toggle = document.createElement('span');
  toggle.className = 'exp-card-toggle';
  toggle.textContent = '▼';
  const label = document.createElement('span');
  label.className = 'exp-card-label';
  label.textContent = buildFormacionLabel(form, index);
  const dates = document.createElement('span');
  dates.className = 'exp-card-dates';
  dates.textContent = buildDateRange(form); // Reutilizamos buildDateRange

  headerLeft.appendChild(toggle);
  headerLeft.appendChild(label);
  headerLeft.appendChild(dates);

  const btnDel = document.createElement('button');
  btnDel.type = 'button';
  btnDel.className = 'btn-exp-delete';
  btnDel.textContent = '✕';
  btnDel.addEventListener('click', (e) => {
    e.stopPropagation();
    card.style.opacity = '0';
    setTimeout(() => card.remove(), 200);
  });

  header.appendChild(headerLeft);
  header.appendChild(btnDel);
  header.addEventListener('click', () => card.classList.toggle('collapsed'));

  const body = document.createElement('div');
  body.className = 'exp-card-body';
  const fieldsGrid = document.createElement('div');
  fieldsGrid.className = 'exp-fields';

  const tituloField = createField('Título / Carrera', 'text', form.titulo, 'Ej: Ingeniería en Sistemas');
  fieldsGrid.appendChild(tituloField.wrapper);

  const instField = createField('Institución educativa', 'text', form.institucion, 'Ej: UTN');
  fieldsGrid.appendChild(instField.wrapper);

  const dateField = document.createElement('div');
  dateField.className = 'exp-field full';
  const dateLabel = document.createElement('label');
  dateLabel.textContent = 'Período';
  const dateRow = document.createElement('div');
  dateRow.className = 'exp-date-row';

  const startInput = document.createElement('input');
  startInput.type = 'month';
  startInput.value = form.fechaInicio || '';

  const endInput = document.createElement('input');
  endInput.type = 'month';
  endInput.value = form.fechaFin || '';
  endInput.disabled = !!form.actualidad;

  const checkLabel = document.createElement('label');
  checkLabel.className = 'exp-checkbox-label';
  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.checked = !!form.actualidad;
  checkbox.addEventListener('change', () => {
    endInput.disabled = checkbox.checked;
    if (checkbox.checked) endInput.value = '';
    updateCardHeader();
  });
  
  checkLabel.appendChild(checkbox);
  checkLabel.appendChild(document.createTextNode('Actualidad'));
  dateRow.appendChild(startInput);
  dateRow.appendChild(endInput);
  dateRow.appendChild(checkLabel);
  dateField.appendChild(dateLabel);
  dateField.appendChild(dateRow);
  fieldsGrid.appendChild(dateField);
  
  body.appendChild(fieldsGrid);
  card.appendChild(header);
  card.appendChild(body);

  function updateCardHeader() {
    const cur = {
      titulo: tituloField.input.value,
      institucion: instField.input.value,
      fechaInicio: startInput.value,
      fechaFin: endInput.value,
      actualidad: checkbox.checked,
    };
    label.textContent = buildFormacionLabel(cur, index);
    dates.textContent = buildDateRange(cur);
  }

  tituloField.input.addEventListener('input', updateCardHeader);
  instField.input.addEventListener('input', updateCardHeader);
  startInput.addEventListener('change', updateCardHeader);
  endInput.addEventListener('change', updateCardHeader);

  card._refs = {
    titulo: tituloField.input,
    institucion: instField.input,
    fechaInicio: startInput,
    fechaFin: endInput,
    actualidad: checkbox,
  };

  return card;
}

function collectFormaciones() {
  if (!el.formacionContainer) return [];
  const cards = el.formacionContainer.querySelectorAll('.exp-card');
  return Array.from(cards).map(card => {
    const r = card._refs;
    if (!r) return null;
    return {
      titulo:       r.titulo.value.trim(),
      institucion:  r.institucion.value.trim(),
      fechaInicio:  r.fechaInicio.value,
      fechaFin:     r.fechaFin.value,
      actualidad:   r.actualidad.checked,
    };
  }).filter(Boolean);
}

// ── Pills System (Skills & Languages) ────────────────────────────────────────

function renderPills(container, items) {
  if (!container) return;
  container.innerHTML = '';
  items.forEach(text => {
    container.appendChild(createPill(text));
  });
}

function createPill(text) {
  const pill = document.createElement('span');
  pill.className = 'pill';
  pill.textContent = text;
  
  const del = document.createElement('span');
  del.className = 'pill-delete';
  del.textContent = '✕';
  del.addEventListener('click', () => pill.remove());
  
  pill.appendChild(del);
  pill.dataset.value = text;
  return pill;
}

function collectPills(container) {
  if (!container) return [];
  return Array.from(container.querySelectorAll('.pill')).map(p => p.dataset.value);
}

function renderLangPills(container, items) {
  if (!container) return;
  container.innerHTML = '';
  items.forEach(lang => {
    container.appendChild(createLangPill(lang.nombre, lang.nivel));
  });
}

function createLangPill(nombre, nivel) {
  const pill = document.createElement('span');
  pill.className = 'pill';
  pill.textContent = `${nombre} (${nivel})`;
  
  const del = document.createElement('span');
  del.className = 'pill-delete';
  del.textContent = '✕';
  del.addEventListener('click', () => pill.remove());
  
  pill.appendChild(del);
  pill.dataset.nombre = nombre;
  pill.dataset.nivel = nivel;
  return pill;
}

function collectLangPills(container) {
  if (!container) return [];
  return Array.from(container.querySelectorAll('.pill')).map(p => ({
    nombre: p.dataset.nombre,
    nivel: p.dataset.nivel
  }));
}

function addPillFromInput(inputEl, container) {
  const val = inputEl.value.trim();
  if (val) {
    container.appendChild(createPill(val));
    inputEl.value = '';
  }
}

function addLangFromInput() {
  const nombre = el.inputIdiomaNombre.value.trim();
  const nivel = el.inputIdiomaNivel.value;
  if (nombre) {
    el.pillsIdiomas.appendChild(createLangPill(nombre, nivel));
    el.inputIdiomaNombre.value = '';
  }
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

// ── Global Profile Pic ───────────────────────────────────────────────────────

async function refreshProfilePic() {
  if (!el.globalPicPreview) return;
  try {
    const pic = await getProfilePic();
    if (pic) {
      el.globalPicPreview.style.backgroundImage = `url(${pic})`;
      el.globalPicPreview.innerHTML = '';
      el.btnDeletePic.style.display = 'inline-block';
    } else {
      el.globalPicPreview.style.backgroundImage = 'none';
      el.globalPicPreview.innerHTML = '<span class="pic-placeholder-text">Sin foto</span>';
      el.btnDeletePic.style.display = 'none';
    }
  } catch (err) {
    console.error('Error cargando foto de perfil:', err);
  }
}

function handlePicUpload(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = async (ev) => {
    await saveProfilePic(ev.target.result);
    refreshProfilePic();
    showToast('📸 Foto actualizada para todos tus CVs.');
  };
  reader.readAsDataURL(file);
}

function handlePicDelete() {
  deleteProfilePic().then(() => {
    refreshProfilePic();
    showToast('🗑️ Foto eliminada.');
  });
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

function handleAddExperience() {
  if (!el.expContainer) return;
  const currentCards = el.expContainer.querySelectorAll('.exp-card');
  const newCard = createExpCard(defaultExp(), currentCards.length, currentCards.length + 1);
  el.expContainer.appendChild(newCard);
  // Scroll into view smoothly
  newCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function handleAddProyecto() {
  if (!el.proyectosContainer) return;
  const currentCards = el.proyectosContainer.querySelectorAll('.exp-card');
  const newCard = createProyectoCard(defaultProyecto(), currentCards.length, currentCards.length + 1);
  el.proyectosContainer.appendChild(newCard);
  newCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

/** Genera y descarga el CV en PDF (ATS-optimized) usando el diálogo de impresión. */
async function handleDownloadCV() {
  const cv = getCVData();
  if (!cv.nombre) {
    showToast('⚠️ Completá al menos tu Nombre y Apellido para descargar el CV.');
    return;
  }

  try {
    const pic = await getProfilePic();
    // inject global picture to cv object for template builder
    if (pic) cv.profilePic = pic;
    
    const htmlContent = buildATSCurriculumHTML(cv);
    
    // Create hidden iframe
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    
    document.body.appendChild(iframe);
    
    const iframeDoc = iframe.contentWindow.document;
    iframeDoc.open();
    iframeDoc.write(htmlContent);
    iframeDoc.close();
    
    iframe.contentWindow.focus();
    setTimeout(() => {
        iframe.contentWindow.print();
        setTimeout(() => {
            document.body.removeChild(iframe);
        }, 1000);
    }, 250);

    showToast('📥 Preparando tu CV para imprimir/guardar como PDF...');
  } catch (error) {
    console.error(error);
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

async function handleCopyCV() {
  const data = collectCVData();
  try {
    await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    showToast('📋 Datos del CV copiados al portapapeles.');
  } catch (err) {
    showToast('⚠️ No se pudo copiar al portapapeles.');
  }
}

async function handlePasteCV() {
  try {
    const text = await navigator.clipboard.readText();
    if (!text) throw new Error("Portapapeles vacío");
    const data = JSON.parse(text);
    if (data && (data.nombre !== undefined || data.rol !== undefined || data.experiencia !== undefined)) {
      setCVData(data);
      saveCVSlot(collectCVData());
      refresh();
      showToast('📥 Datos del CV pegados e importados correctamente.');
    } else {
      showToast('⚠️ El formato JSON no parece ser un CV válido.');
    }
  } catch (err) {
    showToast('⚠️ No se pudo leer un JSON válido del portapapeles.');
  }
}

// ── Inicialización ───────────────────────────────────────────────────────────

export function init() {
  cacheDOM();
  if (el.cvPrev) el.cvPrev.addEventListener('click', () => handleNavCarousel('prev'));
  if (el.cvNext) el.cvNext.addEventListener('click', () => handleNavCarousel('next'));
  
  if (el.btnSaveCV) el.btnSaveCV.addEventListener('click', handleSaveCV);
  if (el.btnDeleteCV) el.btnDeleteCV.addEventListener('click', handleDeleteCV);
  if (el.btnDownloadCV) el.btnDownloadCV.addEventListener('click', handleDownloadCV);
  if (el.btnCopyCV) el.btnCopyCV.addEventListener('click', handleCopyCV);
  if (el.btnPasteCV) el.btnPasteCV.addEventListener('click', handlePasteCV);
  if (el.btnAddExp) el.btnAddExp.addEventListener('click', handleAddExperience);
  if (el.btnAddProyecto) el.btnAddProyecto.addEventListener('click', handleAddProyecto);

  // Pills handlers
  if (el.btnAddHabTec) {
    el.btnAddHabTec.addEventListener('click', () => addPillFromInput(el.inputHabTec, el.pillsHabTec));
    el.inputHabTec.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); addPillFromInput(el.inputHabTec, el.pillsHabTec); }
    });
  }
  
  if (el.btnAddHabBlandas) {
    el.btnAddHabBlandas.addEventListener('click', () => addPillFromInput(el.inputHabBlandas, el.pillsHabBlandas));
    el.inputHabBlandas.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); addPillFromInput(el.inputHabBlandas, el.pillsHabBlandas); }
    });
  }
  
  if (el.btnAddIdioma) {
    el.btnAddIdioma.addEventListener('click', addLangFromInput);
    el.inputIdiomaNombre.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); addLangFromInput(); }
    });
  }
  
  if (el.btnAddFormacion) {
    el.btnAddFormacion.addEventListener('click', () => {
      const cards = el.formacionContainer.querySelectorAll('.exp-card');
      const newCard = createFormacionCard(defaultFormacion(), cards.length);
      el.formacionContainer.appendChild(newCard);
      newCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
  }
  
  if (el.globalPicInput) {
    el.globalPicInput.addEventListener('change', handlePicUpload);
  }
  if (el.btnDeletePic) {
    el.btnDeletePic.addEventListener('click', handlePicDelete);
  }

  initPhoneValidation();
  refresh();
  refreshProfilePic();
}
