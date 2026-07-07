/**
 * @file Busquedas.js
 * @description Vista encargada de gestionar los roles de búsqueda y la grilla de plataformas ATS/Directas.
 */

import { PLATFORMS } from '../utils/search.js';
import { getRoles, addRole, deleteRole, getSearchCountry, setSearchCountry } from '../utils/storage.js';
import { showToast } from '../components/Toast.js';

// ── Estado Local ─────────────────────────────────────────────────────────────
let activeRoleId = null;

// ── Caché del DOM ────────────────────────────────────────────────────────────
const el = {};

function cacheDOM() {
  el.roleTabs = document.getElementById('roleTabs');
  el.roleInput = document.getElementById('roleInput');
  el.btnAddRole = document.getElementById('btnAddRole');
  el.groupB = document.getElementById('groupB');
  el.countrySelect = document.getElementById('countrySelect');
}

/** Escapa strings para HTML */
const esc = s => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;')
  .replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// ── Renderizado ──────────────────────────────────────────────────────────────

/**
 * @function renderRoleTabs
 * @description Dibuja las pestañas de roles cargados por el usuario.
 */
function renderRoleTabs() {
  if (!el.roleTabs) return;
  const roles = getRoles();
  
  // Asegurar que exista un activeRoleId válido si hay roles
  if (!activeRoleId && roles.length) activeRoleId = roles[0].id;

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

/**
 * @function renderSearchButtons
 * @description Dibuja los botones de las plataformas inyectando el rol activo.
 */
function renderSearchButtons() {
  if (!el.groupB) return;
  const roles = getRoles();
  const activeRole = roles.find(r => r.id === activeRoleId);
  const query = activeRole ? activeRole.label : null;
  const qVal = (query || '').trim();
  const country = getSearchCountry();

  if (el.countrySelect) {
    el.countrySelect.value = country;
  }

  const filteredPlatforms = PLATFORMS.filter(p => !p.countries || p.countries.includes(country));

  el.groupB.innerHTML = filteredPlatforms.map(p => {
    const url = p.url(qVal, country);
    const subText = qVal ? `Buscar: ${esc(qVal)}` : 'Ver plataforma';
    return `<a class="search-btn" href="${url}" target="_blank" rel="noopener noreferrer">
      <span class="ico">${p.ico}</span>
      <span class="lbl">${esc(p.name)}<span class="sub">${subText}</span></span>
    </a>`;
  }).join('');
}

/** Refresca la vista completa */
export function refresh() {
  renderRoleTabs();
  renderSearchButtons();
}

// ── Handlers ─────────────────────────────────────────────────────────────────

function handleSelectRole(id) {
  activeRoleId = id;
  refresh();
}

function handleDeleteRole(id) {
  deleteRole(id);
  if (activeRoleId === id) {
    const roles = getRoles();
    activeRoleId = roles.length ? roles[0].id : null;
  }
  refresh();
  showToast('Rol eliminado.');
}

function handleAddRole() {
  const val = el.roleInput.value.trim();
  if (val) {
    const newRole = addRole(val);
    if (newRole) {
      activeRoleId = newRole.id;
      refresh();
      showToast('Rol añadido exitosamente.');
    } else {
      showToast('Ese rol ya existe o es inválido.');
    }
    el.roleInput.value = '';
  }
}

// ── Inicialización ───────────────────────────────────────────────────────────

/**
 * @function init
 * @description Vincula los eventos de la vista Busquedas e inicializa el primer renderizado.
 */
export function init() {
  cacheDOM();
  if (el.roleTabs) {
    el.roleTabs.addEventListener('click', e => {
      const delBtn = e.target.closest('[data-role-del]');
      if (delBtn) {
        handleDeleteRole(Number(delBtn.dataset.roleDel));
        return;
      }
      const btn = e.target.closest('.role-tab');
      if (btn) handleSelectRole(Number(btn.dataset.role));
    });
  }

  if (el.btnAddRole) {
    el.btnAddRole.addEventListener('click', handleAddRole);
  }

  if (el.roleInput) {
    el.roleInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleAddRole();
      }
    });
  }

  if (el.countrySelect) {
    el.countrySelect.addEventListener('change', e => {
      setSearchCountry(e.target.value);
      renderSearchButtons();
      showToast('Filtro de país actualizado.');
    });
  }

  refresh();
}
