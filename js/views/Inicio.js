/**
 * @file Inicio.js
 * @description Vista de la sección "Sobre la aplicación".
 */

import * as Sidebar from '../components/Sidebar.js';

export function init() {
  const btnStartNow = document.getElementById('btnStartNow');
  if (btnStartNow) {
    btnStartNow.addEventListener('click', () => {
      Sidebar.switchTab('micv');
    });
  }
}
