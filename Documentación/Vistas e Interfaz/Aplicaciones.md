---
tags:
  - proyecto
  - desarrollo
  - vista
  - ui
estado: Beta (Desplegado en Vercel)
---

# 📊 Vista - Aplicaciones

Esta vista gestiona de forma interactiva el funnel de postulaciones y aloja las herramientas avanzadas de asistencia por IA.

---

## 🖼️ Layout Visual e Interfaz

### 1. Panel de Métricas
Ubicado en la parte superior, procesa y expone el estado global a través de 4 tarjetas numéricas:
*   **Total:** Conteo de todas las ofertas guardadas.
*   **Pendientes:** Aplicaciones registradas pero aún no enviadas.
*   **Aplicadas:** Postulaciones completadas eficazmente.
*   **Entrevistas:** Procesos selectivos con entrevistas activas.

### 2. Formulario "NUEVA OFERTA"
Bloque de carga estructurado con campos específicos para añadir vacantes al Local Storage:
*   Inputs en paralelo: Puesto * y Empresa *.
*   Input de texto simple: Link de la oferta.
*   Caja de texto multilínea: Descripción / Requisitos.
*   Dropdown: Selector de Estado inicial (Por defecto se inicializa en "Pendiente").
*   Botón de envío: Guardar oferta (Estilo ancho completo, azul sólido).

### 3. Tarjeta de Postulación Activa
Módulo dinámico que renderiza los datos de cada postulación:
*   **Header:** Muestra el título de la vacante y una etiqueta de estado de color pastel (ej. O PENDIENTE).
*   **Metadatos:** Icono de edificio, nombre de la empresa y la fecha de registro (DD/MM/AAAA).
*   **Acciones:** Botones compactos independientes para "Ver oferta" y "Ver más", un selector desplegable para modificar el estado y el botón secundario "Eliminar".

---

## 🚨 Ajuste Crítico de UI (Fase Beta)
> [!danger] MODIFICACIÓN DE DISEÑO APLICADA
> Se ha **removido por completo** la pestaña/caja inferior que desplegaba la leyenda "Pegá acá el CV generado por la IA" junto con su botón de descarga. Las herramientas de IA ahora ejecutan única y exclusivamente la acción limpia de inyección al portapapeles (navigator.clipboard.writeText).

---

## ✨ Módulo de Herramientas IA
Ubicado en el footer de cada tarjeta de postulación, delimitado por una línea punteada. Contiene 3 botones con lógica de mapeo dinámico automatizada:
*   🟣 **Analizar FIT:** Compila las variables y copia el prompt alojado en [[Analizar Fit]].
*   🔵 **Adaptar CV:** Compila las variables y copia el prompt alojado en [[Adaptar CV]].
*   🟢 **Crear Carta:** Compila las variables y copia el prompt alojado en [[Crear Carta]].