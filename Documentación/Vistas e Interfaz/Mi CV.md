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

### 1. Bloque "MI PERFIL PROFESIONAL"
Presenta una advertencia superior en color naranja que indica al usuario el comportamiento del guardado automático: *"📝 Editable en tiempo real. Cada cambio se guarda automáticamente."*

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

### 2. Bloque "DESCARGAR CV"
Sección inferior que cuenta con una breve descripción metodológica y expone un botón principal de ancho completo color azul sólido titulado: `📄 Descargar Mi CV (.docx)`.

---

## ⚙️ Comportamiento Lógico y Persistencia
*   **Escucha Reactiva (Autoguardado):** Cada input/textarea maneja un evento de escucha (`onInput` o `onChange`). Ni bien el usuario escribe un carácter, el objeto JSON se actualiza inmediatamente bajo la key `jobtracker_cv` en el Local Storage.
*   **Estructuración para Prompts:** La aplicación expone internamente una función que lee este objeto y compila todas las áreas de texto en una sola variable formateada llamada `${cvBlock}`, asegurando la correcta transmisión del perfil a las notas de prompts de IA.