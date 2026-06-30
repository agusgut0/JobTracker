---
tags:
  - proyecto
  - desarrollo
  - vista
  - ui
estado: Beta (Desplegado en Vercel)
---
# 🔍 Vista - Búsquedas

Esta nota documenta la interfaz y el comportamiento lógico de la pestaña de **Búsquedas**, diseñada para acelerar el descubrimiento de ofertas laborales en el sector IT.

---

## 🖼️ Layout Visual e Interfaz
El diseño de la vista está estructurado verticalmente en tres secciones principales:

1.  **SELECCIONÁ UN ROL (Superior):** Un contenedor que agrupa tres botones tipo píldora interactivos horizontales para definir el perfil de búsqueda activa.
2.  **GRUPO A — VIA GOOGLE (SITE:) (Medio):** Una grilla de dos columnas que contiene tarjetas para plataformas ATS populares. Cada tarjeta muestra un emoji identificativo y el nombre del sistema de reclutamiento.
3.  **GRUPO B — PLATAFORMAS DIRECTAS (Inferior):** Una grilla de dos columnas con tarjetas dirigidas a portales de empleo directo. Muestra un icono de la plataforma y la ubicación estática parametrizada.

---

## ⚙️ Lógica y Mapeo de Datos

### 1. Perfiles Profesionales Hardcodeados
Los tres roles disponibles para selección son:
*   `Analista Funcional / Sistemas`
*   `Soporte IT / Aplicaciones`
*   `ERP / Automatización`

### 2. Configuración de Plataformas del Grupo A (ATS)
Arreglo de objetos con el dominio base de indexación de cada ATS:
*   `Greenhouse` (ico: '🌱', domain: 'boards.greenhouse.io')
*   `Ashby` (ico: '📐', domain: 'jobs.ashbyhq.com')
*   `Lever` (ico: '⚙️', domain: 'jobs.lever.co')
*   `SmartRecruiters` (ico: '🎯', domain: 'jobs.smartrecruiters.com')
*   `Workday` (ico: '🏢', domain: 'myworkdayjobs.com')
*   `BambooHR` (ico: '🎋', domain: 'bamboohr.com/careers')
*   `Workable` (ico: '💼', domain: 'apply.workable.com')

### 3. Configuración de Plataformas del Grupo B (Directas)
Portales de redirección directa con parámetro de geolocalización fijado por defecto en *"Córdoba + Remoto"*:
*   `LinkedIn`
*   `Indeed`
*   `Workana`
*   `Torre.ai`
*   `Wellfound`
*   `Bumeran`
*   `Computrabajo`

---

## 🧠 Automatización de URL (Google Dorking)
Al hacer click sobre cualquier tarjeta del **Grupo A**, el sistema detecta el rol seleccionado y computa de forma dinámica la siguiente función para abrir una nueva pestaña en el navegador:

```javascript
// Variable 'qs' indexada para alternar o matchear la Query de búsqueda según el rol
const queryTarget = encodeURIComponent(rolSeleccionado);
const googleSearchUrl = `[https://www.google.com/search?q=site:$](https://www.google.com/search?q=site:$){plataforma.domain}+${queryTarget}`;
window.open(googleSearchUrl, '_blank');