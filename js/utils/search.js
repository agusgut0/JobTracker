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
 * Diccionario de países soportados para las búsquedas.
 * @constant {Object}
 */
export const COUNTRIES = {
  ar: { name: 'Argentina', indeedSub: 'ar', getOnBoardId: 'argentina' },
  mx: { name: 'México', indeedSub: 'mx', getOnBoardId: 'mexico' },
  co: { name: 'Colombia', indeedSub: 'co', getOnBoardId: 'colombia' },
  cl: { name: 'Chile', indeedSub: 'cl', getOnBoardId: 'chile' },
  es: { name: 'España', indeedSub: 'es', getOnBoardId: 'espana' },
  uy: { name: 'Uruguay', indeedSub: 'uy', getOnBoardId: 'uruguay' },
  global: { name: 'Remoto (Global)', indeedSub: 'www', getOnBoardId: 'remote' }
};

/**
 * Array de configuración de las plataformas de búsqueda directa y ATS.
 * Define el nombre, el ícono, los países permitidos (si aplica) y la función constructora de la URL.
 * @constant {Array<Object>}
 */
export const PLATFORMS = [
  { 
    name: 'LinkedIn', 
    ico: '💼', 
    url: (q, c) => `https://www.linkedin.com/jobs/search/?keywords=${enc(q)}&location=${enc(COUNTRIES[c]?.name || 'Argentina')}&f_WT=2%2C1` 
  },
  { 
    name: 'Indeed', 
    ico: '🔍', 
    url: (q, c) => {
      const info = COUNTRIES[c] || COUNTRIES.ar;
      return `https://${info.indeedSub}.indeed.com/jobs?q=${enc(q)}&l=${enc(info.name)}${c === 'global' ? '' : '&remotejob=032b3046-06a3-4876-8dfd-474eb5e7ed11'}`;
    }
  },
  { 
    name: 'Get on Board', 
    ico: '🚀', 
    url: (q, c) => `https://www.getonbrd.com/jobs?q=${enc(q)}&country_id=${enc((COUNTRIES[c] || COUNTRIES.ar).getOnBoardId)}` 
  },
  { name: 'Chumi IT',       ico: '🤖', countries: ['ar'], url: q => `https://chumi-it.com/empleos?q=${enc(q)}` },
  { name: 'x64',            ico: '💻', countries: ['ar'], url: q => `https://x64.ar/?q=${enc(q)}` },
  { name: 'Revista Empleo', ico: '📰', countries: ['ar'], url: _q => `https://www.revistaempleo.com/todos-los-trabajos/` },
  { name: 'EPAM Campus',    ico: '🎓', url: _q => `https://campus.epam.com/en` },
  { name: 'EmpleosIT',      ico: '🔶', countries: ['ar'], url: q => `https://www.empleosit.com.ar/search?q=${enc(q)}` },
  { name: 'Andeshire',      ico: '🏔️', countries: ['ar', 'cl'], url: _q => `https://andeshire.com/` },
];
