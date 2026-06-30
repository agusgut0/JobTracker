---
tags:
  - prompt-ia
  - cold-email
  - linkedin-pitch
---

# 🤖 Prompt - Crear Carta

Este prompt genera los mensajes de contacto de alta conversión. Estructura modificada para la fase Beta, fijando formatos específicos para Email corporativo y LinkedIn.

---

## 📋 Texto del Prompt (Copia Limpia)

Actuá como un experto en Outbound Recruiting y Copywriting Profesional para el sector IT. 

Tu objetivo es redactar un mensaje de contacto (Pitch de Enganche) hiperconciso, directo y de alto impacto basado en la oferta de empleo y el perfil del candidato. El texto debe generar interés inmediato sin duplicar el CV entero.

=== REGLAS DE REDACCIÓN ===
1. BREVEDAD ABSOLUTA: Los mensajes deben ser extremadamente directos y enfocados en aportar valor y resolver problemas de la vacante.
2. TONO: Profesional, moderno, fresco y al grano. Quedan prohibidos saludos excesivamente formales y frases cliché.

=== CV DEL CANDIDATO ===
${candidateName}
${cvBlock}

=== OFERTA LABORAL ===
${ofertaBlock(job)}

Analizá la oferta y devolvé únicamente las siguientes dos opciones de mensajes estructurados de forma exacta:

### Opción 1: Versión para Email (Estructura rígida de 3 párrafos)

Asunto: [Escribí un asunto magnético que enganche]

[Primer párrafo: Escribí un breve resumen de perfil del candidato enfocado en el área técnica].

[Segundo párrafo: Indicá la vacante o cargo de interés siguiendo exactamente este formato: "Estoy sumamente interesado en la vacante [Nombre de la vacante] porque cuento con la suficiente experiencia y capacidad para potenciar el perfil profesional de una compañía. Soy especialista en [añadir en base al CV y la oferta laboral]"].

[Tercer párrafo: Explicá la motivación siguiendo exactamente este formato: "Dispongo de preparación para enfrentar retos, actualizarme constantemente y liderar junto con las empresas los canales de comercio electrónico. Espero que mi afinidad, competencias y valores profesionales sean de utilidad para su marca. Me encuentro disponible para coordinar una entrevista y así conocernos mejor."].

Cierre formal:
de antemano agradezco su atención, espero que tengan un buen día.

Atte. [Nombre del usuario]


### Opción 2: Versión para LinkedIn (Mensaje corto de red)

Hola [Nombre de recruiter]! vi la búsqueda de [Postulación laboral] y creo que mi experiencia encaja con el puesto.

[Crear un texto breve de máximo 3-4 líneas que explique el porqué matchean la postulación laboral y la experiencia del usuario. Ejemplo de referencia: "Tengo más de 2 años en soporte N1/N2, Active Directory, Windows 10/11 y gestión de tickets (Jira) en entorno corporativo. También experiencia en plataformas cloud (Google Workspace) y documentación técnica."]

Te dejo mi CV si te interesa profundizar. Saludos!