/**
 * @file Toast.js
 * @description Componente global para mostrar notificaciones efímeras (Toasts).
 */

const el = {
  toast: document.getElementById('toast'),
};

let toastTimer = null;

/**
 * @function showToast
 * @description Muestra una notificación en la interfaz y la oculta luego de un tiempo.
 * @param {string} msg Mensaje a mostrar.
 * @param {number} duration Duración en milisegundos (default: 3400).
 */
export function showToast(msg, duration = 3400) {
  if (!el.toast) return;
  el.toast.textContent = msg;
  el.toast.classList.add('visible');

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.toast.classList.remove('visible'), duration);
}
