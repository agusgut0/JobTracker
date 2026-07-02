/**
 * @file clipboard.js
 * @description Utilidad encargada de manejar la API del portapapeles.
 */

/**
 * @function copyToClipboard
 * @description Copia texto al portapapeles del sistema operativo de manera asíncrona.
 * Implementa un fallback para contextos no seguros (donde navigator.clipboard no está disponible).
 * @param {string} text El texto a copiar.
 * @returns {Promise<void>}
 */
export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    // Fallback for non-secure contexts (e.g. without HTTPS/localhost or older browsers)
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.cssText = 'position:fixed;opacity:0;top:0;left:0';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); } catch { /* silent */ }
    document.body.removeChild(ta);
  }
}
