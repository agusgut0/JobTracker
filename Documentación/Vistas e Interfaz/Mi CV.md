---
tags:
  - proyecto
  - desarrollo
  - vista
  - ui
estado: Beta (Desplegado en Vercel)
---

# 👤 Vista - Mi CV

Esta pestaña centraliza la información del perfil del profesional, actuando como la fuente de verdad (Single Source of Truth) para la inyección de datos en los bloques dinámicos de los prompts de Inteligencia Artificial.

---

## 🖼️ Layout Visual e Interfaz
Diseño enfocado a la carga masiva de datos limpios, estructurado en dos grandes bloques contenedores:

### 1. Carrusel de CVs (Navegación Superior)
Contenedor introducido en la Fase Beta ubicado por encima del formulario. Actúa como sistema de navegación circular (ruleta) para gestionar hasta 20 espacios de perfiles distintos.
*   **Elementos:** Botones de retroceso `[ < ]` y avance `[ > ]`, con un título central que indica el slot activo (ej. "CV 1 - Analista de Sistemas" o "CV 2 (Vacío)").

### 2. Bloque "MI PERFIL PROFESIONAL"
Formulario de carga de datos. Se ha retirado el autoguardado en tiempo real. Ahora presenta la instrucción: *"✏️ Completá los campos y presioná 'Guardar CV' para almacenar este perfil."*

Disposición de campos de entrada:
*   **Fila 1:** `Nombre y Apellido *` | `Puesto o Rol *`
*   **Fila 2:** `Email *` | `Teléfono *`
*   **Fila 3:** `LinkedIn (opcional)` | `Portfolio (opcional)`
*   **Campos Multilínea Verticales (Textareas):**
    *   `Resumen profesional`
    *   `Experiencia laboral`
    *   `Habilidades técnicas`
    *   `Formación académica`
    *   `Habilidades blandas`
*   **Fila Final:** Input simple para `Idiomas`.

### 3. Bloque "DESCARGAR CV"
Sección inferior que cuenta con una breve descripción metodológica y expone un botón principal de ancho completo color azul sólido titulado: `📄 Descargar Mi CV (.docx)`.

### 4. Botones de Acción y Guardado
Al final del formulario se han añadido dos botones principales con comportamiento rígido:
*   **💾 Guardar CV (Verde):** Persiste los datos que están rellenados en pantalla dentro del slot/índice correspondiente de la ruleta. Tras el guardado exitoso, actualiza el título del slot y **vacía por completo** todos los campos del formulario.
*   **🗑️ Eliminar:** Elimina el slot de persistencia activo, vacía el espacio de forma definitiva y deja los campos en blanco sin guardar ninguna información.

---

## ⚙️ Comportamiento Lógico y Persistencia
*   **Almacenamiento Estructurado (LocalStorage):** La key `jobtracker_cv` se ha reestructurado por completo. Ya no almacena un objeto único, sino un objeto que contiene un `activeIndex` y un arreglo (`slots`) capaz de contener hasta 20 elementos.
*   **Carga Dinámica Multislot:** Al navegar con las flechas superiores, el formulario reacciona cargando dinámicamente los datos almacenados en ese slot específico. Si es un espacio nuevo, se muestra vacío.
*   **Transmisión a Prompts (IA):** La aplicación está adaptada para que los botones generadores de IA (en la pestaña "Aplicaciones") apunten y utilicen como fuente de verdad única al CV que se encuentre seleccionado como activo en esta ruleta.