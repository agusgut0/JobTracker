---
tags:
  - proyecto
  - desarrollo
  - vista
  - ui
  - layout
estado: Beta (Desplegado en Vercel)
---

# 🏠 Vista - Inicio (Sobre la aplicación)

Esta es la vista principal (Home) y el contenedor global de la aplicación. Introduce al usuario en **JobTracker** y centraliza la navegación mediante una barra lateral persistente.

---

## 🏗️ Layout Global y Navegación (Sidebar)
La aplicación implementa un diseño de **barra lateral anclada (Sticky Sidebar)** que permanece fija en todas las vistas.

### 1. Barra Lateral (Izquierda)
* **Ancho fijo:** 260px.
* **Color de fondo:** Naranja #F19C49.
* **Elementos de navegación:**
    * `Sobre la aplicación` (Vista actual / Home).
    * `Búsquedas`.
    * `Aplicaciones`.
    * `Mi CV`.
* **Módulo de Gestión de Datos (Sección inferior del Sidebar):**
    * Se trasladan aquí las funciones críticas de persistencia:
        * **Exportar JSON:** Descarga el estado completo del `localStorage` como archivo `.json`.
        * **Importar JSON:** Input de tipo `file` para restaurar datos desde un archivo local.

### 2. Contenedor de Contenido (Derecha)
* **Color de fondo:** Alabaster #F2F0E6
* **Scroll:** El contenido fluye de forma independiente a la barra lateral.
* **Componentes visuales:**
    * **Título:** "JobTracker" (Grande, centrado, tipografía destacada).
    * **Subtítulo:** "Tu asistente de búsqueda laboral".
    * **Cuerpo de texto:** Sección de bienvenida e instrucciones (Contenido inicial: *Lorem ipsum dolor sit amet...*).

---

## ⚙️ Lógica de Implementación (Sidebar Persistente)

Para que el Sidebar se visualice en todas las pestañas, se recomienda utilizar un componente `Layout` envolvente:

```jsx
// Estructura lógica sugerida para el modelo de IA
<div style={{ display: 'flex' }}>
  <aside style={{ width: '260px', position: 'sticky', height: '100vh' }}>
    <nav>
       <!-- Links a Búsquedas, Aplicaciones, Mi CV -->
       <!-- Botones Exportar/Importar JSON -->
    </nav>
  </aside>
  
  <main style={{ flex: 1, backgroundColor: '#ffffff' }}>
    {children} <!-- Aquí se renderiza la vista activa -->
  </main>
</div>