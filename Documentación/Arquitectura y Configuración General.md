---
tags:
  - proyecto
  - arquitectura
  - desarrollo
  - localstorage
  - database
arquitectura: No-Backend (Client-Side Only)
estado: Beta - Desplegado en Vercel
---
---

# 🏗️ Arquitectura y Configuración General

Esta nota describe los cimientos técnicos de **JobTracker**. Al ser una aplicación sin servidor (No-Backend / Jamstack), toda la lógica de negocio y el almacenamiento se ejecutan exclusivamente del lado del cliente.

---

## 💾 Estrategia de Persistencia: Local Storage

Para prescindir de una base de datos tradicional, se utiliza la API nativa de `window.localStorage`. Los datos persisten de forma indefinida en el navegador web del usuario que utiliza la aplicación.

### Claves (Keys) Utilizadas en Local Storage
La aplicación divide la memoria local en dos claves principales:
1.  `jobtracker_cv`: Almacena de manera directa el objeto con el perfil profesional único del usuario.
2.  `jobtracker_applications`: Almacena un arreglo (array) de objetos, donde cada objeto representa una postulación cargada.

---

## 📊 Esquemas de Datos (JSON Schemas)

Para asegurar la consistencia al leer y escribir datos, las estructuras JSON deben responder estrictamente a los siguientes formatos de objeto:

### 1. Perfil del Usuario (`jobtracker_cv`)
Representa la información ingresada por el usuario en la pestaña "Mi CV". Todos los campos se guardan en tiempo real ante eventos de entrada (`onInput` / `onChange`).

    {
      "nombreApellido": "Pepito Aurelio",
      "puestoRol": "IT Support and Systems Analyst",
      "email": "ejemplo@email.com",
      "telefono": "+54 9 351 ...",
      "linkedin": "https://linkedin.com/in/...",
      "portfolio": "https://...",
      "resumenProfesional": "Breve párrafo que resuma tu perfil, experiencia...",
      "experienciaLaboral": "Describí tus experiencias laborales, roles y logros...",
      "habilidadesTecnicas": "Python, JavaScript, n8n, TOTVS, DrCorr",
      "formacionAcademica": "Ingeniería en Sistemas de Información — UTN FRC",
      "habilidadesBlandas": "Trabajo en equipo, comunicación...",
      "idiomas": "Español nativo, Inglés"
    }

### 2. Estructura de Aplicaciones (`jobtracker_applications`)
Arreglo que contiene cada postulación. Cada elemento requiere un identificador único generado en el cliente (ej: `crypto.randomUUID()` o un `Date.now()`) para permitir ediciones, eliminaciones o mutaciones de estado.

    [
      {
        "id": "app_1719762142000",
        "puesto": "Analista Funcional",
        "empresa": "Corrugadora Centro S.A.",
        "link": "https://oferta-laboral-link.com",
        "descripcion": "Pegá la descripción del puesto acá con sus requisitos...",
        "estado": "Pendiente", 
        "fechaCarga": "30/06/2026"
      }
    ]

*Valores permitidos para el campo `estado`:* `"Pendiente"`, `"Aplicada"`, `"Entrevistada"`, `"Descartada"`.

---

## ⚙️ Lógica de Negocio Global

### 1. Sistema de Copia en Portapapeles (Clipboard API)
Las herramientas de IA no interactúan con una API externa; en su lugar, utilizan la API nativa del navegador para inyectar los prompts preparados en el portapapeles:

    async function copiarPromptAlPortapapeles(textoPrompt) {
      try {
        await navigator.clipboard.writeText(textoPrompt);
      } catch (err) {
        console.error("Error al copiar el prompt: ", err);
      }
    }

### 2. Lógica de Reemplazo de Variables (String Interpolation)
Antes de llamar a la función de copia, la app debe mapear dinámicamente el prompt combinando los datos de las dos llaves de almacenamiento:
*   `${candidateName}` $\rightarrow$ Extraído de `jobtracker_cv.nombreApellido`
*   `${cvBlock}` $\rightarrow$ Mapeo concatenado de la experiencia, habilidades y formación de `jobtracker_cv`.
*   `${ofertaBlock(job)}` $\rightarrow$ String limpio estructurado con el `puesto`, `empresa` y la `descripcion` de la postulación activa.

---

## 🛠️ Stack Tecnológico de la Beta
*   **Hosting / Deployment:** Vercel (Producción continua).
*   **Entorno:** Cliente (Frontend-only).