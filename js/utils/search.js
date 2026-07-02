/**
 * @file search.js
 * @description Módulo encargado de gestionar las plataformas de búsqueda y la lógica de Google Dorking.
 */

/**
 * Helper interno para codificar strings para URL.
 * @param {string} s String a codificar
 * @returns {string} String codificado
 */
const enc = s => encodeURIComponent(s);

/**
 * Array de configuración de las plataformas de búsqueda directa y ATS.
 * Define el nombre, el ícono y la función constructora de la URL inyectando el rol buscado.
 * @constant {Array<Object>}
 */
export const PLATFORMS = [
  { name: 'LinkedIn',       ico: '💼', url: q => `https://www.linkedin.com/jobs/search/?keywords=${enc(q)}&location=Argentina&f_WT=2%2C1` },
  { name: 'Indeed',         ico: '🔍', url: q => `https://ar.indeed.com/jobs?q=${enc(q)}&l=Argentina&remotejob=032b3046-06a3-4876-8dfd-474eb5e7ed11` },
  { name: 'Get on Board',   ico: '🚀', url: q => `https://www.getonbrd.com/jobs?q=${enc(q)}&country_id=Argentina` },
  { name: 'Chumi IT',       ico: '🤖', url: q => `https://chumi-it.com/empleos?q=${enc(q)}` },
  { name: 'x64',            ico: '💻', url: q => `https://x64.ar/?q=${enc(q)}` },
  { name: 'Revista Empleo', ico: '📰', url: _q => `https://www.revistaempleo.com/todos-los-trabajos/` },
  { name: 'EPAM Campus',    ico: '🎓', url: _q => `https://campus.epam.com/en` },
  { name: 'EmpleosIT',      ico: '🔶', url: q => `https://www.empleosit.com.ar/search?q=${enc(q)}` },
  { name: 'Andeshire',      ico: '🏔️', url: _q => `https://andeshire.com/` },
];
