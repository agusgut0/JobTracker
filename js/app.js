/**
 * @file app.js
 * @description Orquestador principal (Bootstrapper).
 * Inicializa la aplicación, enlaza el estado global con los componentes compartidos.
 */

import { load, setActiveCVIndex, exportJSON, importJSON } from './utils/storage.js';
import * as Sidebar from './components/Sidebar.js';
import { showToast } from './components/Toast.js';

import * as ViewInicio from './views/Inicio.js';
import * as ViewBusquedas from './views/Busquedas.js';
import * as ViewAplicaciones from './views/Aplicaciones.js';
import * as ViewMiCV from './views/MiCV.js';

function bootstrap() {
  // 1. Cargar persistencia (Memoria ← LocalStorage)
  load();

  // 2. Inicializar Componentes Globales (Sidebar)
  Sidebar.bindTabNav((tabId) => {
    Sidebar.switchTab(tabId);
  });

  Sidebar.bindCVGlobalSelect((index) => {
    setActiveCVIndex(index);
    // Forzar actualización cruzada de vistas
    ViewMiCV.refresh();
  });

  Sidebar.bindExport(() => {
    const count = exportJSON();
    const msg = count > 0
      ? `📥 ${count} oferta(s) exportadas correctamente.`
      : '📥 JSON descargado (sin ofertas aún, pero los CVs están guardados).';
    showToast(msg);
  });

  Sidebar.bindImport(async (file) => {
    try {
      const { jobCount } = await importJSON(file);
      // Forzar recarga de todas las vistas tras importar
      ViewMiCV.refresh();
      ViewBusquedas.refresh();
      ViewAplicaciones.refresh();
      showToast(`📤 Importación exitosa: ${jobCount} oferta(s) restauradas.`);
    } catch {
      showToast('⚠️ No se pudo leer el archivo. ¿Es un JSON válido?');
    }
  });

  // 3. Inicializar Vistas Individuales
  ViewInicio.init();
  ViewBusquedas.init();
  ViewAplicaciones.init();
  ViewMiCV.init();
}

document.addEventListener('DOMContentLoaded', bootstrap);
