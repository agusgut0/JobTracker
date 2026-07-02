---
tags:
  - proyecto
  - desarrollo
  - portfolio
  - frontend
  - ai-tools
  - moc
arquitectura: No-Backend (Local Storage)
fecha_creacion: 2026-06-30
estado: Beta (Desplegado en Vercel)
---
---
# 🗂️ JobTracker — Índice Principal (MOC)

Bienvenido al centro de comando de **JobTracker**. Esta nota sirve como Mapa de Contenido (MOC) para centralizar, organizar y conectar todas las especificaciones técnicas, vistas de la interfaz y módulos de Inteligencia Artificial del proyecto.

---

## 📐 Documentación del Sistema

* **[[Arquitectura y Configuración General]]**
    * *Estructura de persistencia en Local Storage, esquemas JSON de datos y configuración del stack tecnológico.*

---

## 📺 Vistas e Interfaz de Usuario (UI/UX)

Exploración de la interfaz, layouts, componentes visuales y comportamiento de las tres pestañas principales:

* **[[Busquedas]]**: Automatización de búsquedas de empleo utilizando Google Dorks (`site:`) y portales directos segmentados por rol.
* **[[Aplicaciones]]**: Panel de control del embudo de postulaciones, métricas en tiempo real, formulario de carga y tarjetas de acción con herramientas de IA.
* **[[Mi CV]]**: Formulario de carga de perfil profesional optimizado para sistemas ATS y exportación de datos.

---

## 🤖 Motor de Prompts (AI Tools)

Prompts estructurados de alta fidelidad que se procesan dinámicamente y se copian automáticamente al portapapeles desde la vista de aplicaciones:

* **[[Analizar Fit]]**: Evaluación estricta de compatibilidad entre el CV y la vacante (Rol: Lead Technical Recruiter).
* **[[Adaptar CV]]**: Optimización estratégica de palabras clave y reestructuración en Markdown limpio para ATS.
* **[[Crear Carta]]**: Generación de Pitch de Enganche para Email corporativo y mensajes ultra-compactos para LinkedIn.

---

## 🚀 Hoja de Ruta (Roadmap de Desarrollo)

### 🛑 Fase Beta Actual (Desplegado en Vercel)
Lista de modificaciones críticas para limpiar la interfaz y ajustar el comportamiento del motor de IA en la versión actual:

- [x] **Modificación 1: Simplificación de Estructura en `Prompt - Adaptar CV`**
	- [x] Actualizar el prompt para que la salida de la IA exija la línea `TITULO:` coordinada con la experiencia dentro de la sección 2.
	- [x] Refactorizar la sección 5 del prompt para incluir dicho título dentro del bloque final de Markdown.
	*(Ver estructura simplificada esperada en la nota correspondiente)*.

- [x] **Modificación 2: Reestructuración de Formato en `Prompt - Crear Carta`**
	- [x] **Email:** Forzar estructura rígida de 3 párrafos (P1: Resumen breve, P2: Interés en vacante X + "Soy especialista en...", P3: Motivación de la empresa, retos y disponibilidad). Cierre estricto: *"de antemano agradezco su atención, espero que tengan un buen día. Atte. [Nombre del usuario]"*.
	- [x] **LinkedIn:** Formato ultra-corto de red: *"Hola [Nombre de recruiter]! vi la búsqueda de [Postulación laboral] y creo que mi experiencia encaja con el puesto... [Texto breve de match]... Te dejo mi CV si te interesa profundizar. Saludos!"*.

- [x] **Modificación 3: Limpieza de UI en Herramientas IA (Pestaña Aplicaciones)**
	- [x] **Eliminar por completo** el contenedor/pestaña inferior que se abría al clickear los botones de IA (*"Pegá acá el CV generado por la IA"* y su respectivo botón de descarga).
	- [x] Remover esta funcionalidad de los 3 botones de IA. La acción debe limitarse única y exclusivamente a copiar el prompt generado al portapapeles (`navigator.clipboard.writeText`).
	
- [x] Modificación 4: Refactorización de la pestaña Busquedas
	- [x] Hacer que **SELECCIONÁ UN ROL** no esté hardcodeado, sino que sea una sección donde el usuario pueda agregar títulos de roles que le interesa buscar, para luego poder seleccionar alguno de los que agregó.
	- [x] Eliminar GRUPO A - VIA GOOGLE (SITE:) y cambiar el nombre de GRUPO B - PLATAFORMAS DIRECTAS a PLATAFORMAS DE BÚQUEDA
	- [x] Modificar las PLATAFORMAS DE BÚSQUEDA POR LAS SIGUIENTES (testar cada una):
		- [x] https://www.getonbrd.com/
		- [x] https://chumi-it.com/
		- [x] https://x64.ar/
		- [x] https://ar.indeed.com/
		- [x] https://www.linkedin.com/jobs/
		- [x] https://andeshire.com/jobs
		- [x] https://www.revistaempleo.com/
		- [x] https://campus.epam.com/en
		- [x] https://www.empleosit.com.ar/
		
- [x] **Modificación 5: Migración a Sidebar Global**
	- [x] Eliminar navegación superior (tabs).
	- [x] Implementar barra lateral persistente (Sidebar) con layout Flexbox (ancho ~260px).
	- [x] Trasladar botones de Importar/Exportar JSON al footer del sidebar.
	- [x] Agregar selector global de CV ("CV Seleccionado") arriba del backup de datos.
	- [x] Aplicar colores de marca: Naranja #F19C49 (sidebar) y Alabaster #F2F0E6 (contenido principal).
---

### ⏳ Siguientes Fases del Desarrollo Base

- [x] **Fase 1: Configuración & Base de Datos Local**
	- [x] Definir el stack tecnológico definitivo.
	- [x] Implementar servicios de lectura/escritura en `LocalStorage` (`Arquitectura y Configuración General`).
- [x] **Fase 2: Interfaz Core & Navegación**
	- [x] Crear la barra de navegación superior (pestañas tipo píldora).
	- [x] Desarrollar la pestaña de **[[Busquedas]]** con sus redirecciones dinámicas por rol.
	- [x] Maquetar el formulario de **[[Mi CV]]** con lógica de autoguardado en tiempo real.
- [x] **Fase 3: Gestión de Postulaciones**
	- [x] Construir el panel de métricas dinámico (tarjetas de contadores) de **[[Aplicaciones]]**.
	- [x] Implementar el formulario de carga "Nueva Oferta" y el renderizado de tarjetas de postulación.
	- [x] Añadir lógica para cambiar estados (dropdown interactivo) y eliminar registros.
- [x] **Fase 4: Integración IA & Exportación**
	- [x] Programar la funcionalidad de copia nativa para los botones de Herramientas IA.
	- [x] Vincular el reemplazo de variables de texto (`cvBlock` y `ofertaBlock`) dentro de la lógica de los botones.
	- [x] Implementar la librería/método para la descarga del CV en formato `.docx` desde la pestaña Mi CV.