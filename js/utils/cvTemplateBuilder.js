/**
 * @file cvTemplateBuilder.js
 * @description Generador puro de HTML para CVs optimizados para ATS.
 */

function escapeHtml(unsafe) {
    if (!unsafe) return '';
    return unsafe
         .toString()
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
}

export function buildATSCurriculumHTML(cvData) {
    // 1. Datos del Header
    const nombre = cvData.nombre || 'Nombre Apellido';
    const rol = cvData.rol || 'Puesto / Rol';
    
    const contactInfo = [];
    if (cvData.email) contactInfo.push(escapeHtml(cvData.email));
    if (cvData.telefono) contactInfo.push(escapeHtml(cvData.telefono));
    if (cvData.linkedin) contactInfo.push(escapeHtml(cvData.linkedin));
    if (cvData.portfolio) contactInfo.push(escapeHtml(cvData.portfolio));
    
    const contactString = contactInfo.join(' | ');

    // 2. Secciones
    let contentHtml = '';

    // PERFIL PROFESIONAL
    if (cvData.resumen && cvData.resumen.trim()) {
        contentHtml += `
            <section>
                <h2>PERFIL PROFESIONAL</h2>
                <div class="section-content">
                    <p>${escapeHtml(cvData.resumen).replace(/\n/g, '<br>')}</p>
                </div>
            </section>
        `;
    }

    // EXPERIENCIA LABORAL
    if (cvData.experiencia && Array.isArray(cvData.experiencia) && cvData.experiencia.length > 0) {
        let expHtml = '';
        cvData.experiencia.forEach(exp => {
            const lugar = escapeHtml(exp.lugar);
            const expRol = escapeHtml(exp.rol);
            
            const formatMonth = (val) => {
                if (!val) return '';
                const [y, m] = val.split('-');
                if (!m) return val;
                const months = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
                return `${months[parseInt(m, 10) - 1]} ${y}`;
            };

            const start = formatMonth(exp.fechaInicio);
            const end = exp.actualidad ? 'Actualidad' : formatMonth(exp.fechaFin);
            let dateStr = '';
            if (start && end) dateStr = `${start} – ${end}`;
            else if (start) dateStr = `Desde ${start}`;
            else if (end) dateStr = `Hasta ${end}`;

            expHtml += `
                <div class="exp-item">
                    <div class="exp-header">
                        <strong>${expRol ? expRol + (lugar ? ' — ' + lugar : '') : lugar}</strong>
                    </div>
                    ${dateStr ? `<div class="exp-dates">${escapeHtml(dateStr)}</div>` : ''}
                    <div class="exp-desc">
                        ${exp.descripcion}
                    </div>
                </div>
            `;
        });

        if (expHtml) {
            contentHtml += `
                <section>
                    <h2>EXPERIENCIA LABORAL</h2>
                    <div class="section-content">
                        ${expHtml}
                    </div>
                </section>
            `;
        }
    }

    // PROYECTOS ACADÉMICOS
    if (cvData.proyectos && Array.isArray(cvData.proyectos) && cvData.proyectos.length > 0) {
        let proyHtml = '';
        cvData.proyectos.forEach(proy => {
            const nombre = escapeHtml(proy.nombre);
            
            proyHtml += `
                <div class="exp-item">
                    <div class="exp-header">
                        <strong>${nombre}</strong>
                    </div>
                    <div class="exp-desc">
                        ${proy.descripcion}
                    </div>
                </div>
            `;
        });

        if (proyHtml) {
            contentHtml += `
                <section>
                    <h2>PROYECTOS ACADÉMICOS</h2>
                    <div class="section-content">
                        ${proyHtml}
                    </div>
                </section>
            `;
        }
    }

    // HABILIDADES TÉCNICAS
    if (cvData.habilidadesTec && Array.isArray(cvData.habilidadesTec) && cvData.habilidadesTec.length > 0) {
        const habTec = cvData.habilidadesTec.map(escapeHtml).join(' &middot; ');
        contentHtml += `
            <section>
                <h2>HABILIDADES TÉCNICAS</h2>
                <div class="section-content">
                    <p>${habTec}</p>
                </div>
            </section>
        `;
    }

    // FORMACIÓN ACADÉMICA
    if (cvData.formacion && Array.isArray(cvData.formacion) && cvData.formacion.length > 0) {
        let formHtml = '';
        cvData.formacion.forEach(form => {
            const institucion = escapeHtml(form.institucion);
            const titulo = escapeHtml(form.titulo);
            
            const formatMonth = (val) => {
                if (!val) return '';
                const [y, m] = val.split('-');
                if (!m) return val;
                const months = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
                return `${months[parseInt(m, 10) - 1]} ${y}`;
            };

            const start = formatMonth(form.fechaInicio);
            const end = form.actualidad ? 'Actualidad' : formatMonth(form.fechaFin);
            let dateStr = '';
            if (start && end) dateStr = `${start} – ${end}`;
            else if (start) dateStr = start;
            else if (end) dateStr = end;

            formHtml += `
                <div class="form-item">
                    <div class="form-header">
                        <div class="form-title"><strong>${titulo}</strong>${institucion ? ' — ' + institucion : ''}</div>
                        ${dateStr ? `<div class="form-dates">${escapeHtml(dateStr)}</div>` : ''}
                    </div>
                </div>
            `;
        });

        if (formHtml) {
            contentHtml += `
                <section>
                    <h2>FORMACIÓN ACADÉMICA</h2>
                    <div class="section-content">
                        ${formHtml}
                    </div>
                </section>
            `;
        }
    } else if (typeof cvData.formacion === 'string' && cvData.formacion.trim()) {
        contentHtml += `
            <section>
                <h2>FORMACIÓN ACADÉMICA</h2>
                <div class="section-content">
                    <p>${escapeHtml(cvData.formacion).replace(/\n/g, '<br>')}</p>
                </div>
            </section>
        `;
    }

    // HABILIDADES BLANDAS & IDIOMAS
    let blandasIdiomasHtml = [];
    if (cvData.habilidadesBlandas && Array.isArray(cvData.habilidadesBlandas) && cvData.habilidadesBlandas.length > 0) {
        blandasIdiomasHtml.push(`<strong>Habilidades Blandas:</strong> ${cvData.habilidadesBlandas.map(escapeHtml).join(' &middot; ')}`);
    }
    if (cvData.idiomas && Array.isArray(cvData.idiomas) && cvData.idiomas.length > 0) {
        const idiomasStrs = cvData.idiomas.map(i => `${escapeHtml(i.nombre)} (${escapeHtml(i.nivel)})`);
        blandasIdiomasHtml.push(`<strong>Idiomas:</strong> ${idiomasStrs.join(' &middot; ')}`);
    }

    if (blandasIdiomasHtml.length > 0) {
        contentHtml += `
            <section>
                <h2>HABILIDADES BLANDAS &amp; IDIOMAS</h2>
                <div class="section-content">
                    <p>${blandasIdiomasHtml.join('<br>')}</p>
                </div>
            </section>
        `;
    }

    return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>CV - ${escapeHtml(nombre)}</title>
    <style>
        /* Reglas de diseño ATS */
        :root {
            --color-principal: #1a5276;
            --color-texto: #333333;
            --color-secundario: #555555;
            --color-gris-claro: #e0e0e0;
        }

        @page {
            margin: 0;
        }

        body {
            font-family: Arial, Helvetica, sans-serif;
            font-size: 9pt;
            line-height: 1.5;
            color: var(--color-texto);
            margin: 0;
            padding: 0;
            background-color: white;
            box-sizing: border-box;
        }

        /* MAQUETACIÓN DE LA CABECERA (HEADER) */
        header {
            display: flex;
            align-items: center;
            margin-bottom: 20px;
        }

        .header-left {
            margin-right: 20px;
        }

        .profile-pic {
            width: 100px;
            height: 100px;
            background-color: var(--color-gris-claro);
            border-radius: 50%;
            flex-shrink: 0;
            object-fit: cover;
        }

        .header-right {
            display: flex;
            flex-direction: column;
        }

        h1 {
            font-size: 32px;
            font-weight: bold;
            color: var(--color-principal);
            margin: 0;
            line-height: 1.2;
        }

        .role-title {
            font-size: 18px;
            font-weight: bold;
            color: var(--color-principal);
            margin: 5px 0;
        }

        .contact-info {
            font-size: 14px;
            color: var(--color-texto);
        }

        /* ESTRUCTURA Y DISEÑO DE LAS SECCIONES */
        section {
            margin-bottom: 20px;
            page-break-inside: avoid;
        }

        h2 {
            text-transform: uppercase;
            font-size: 18px;
            color: var(--color-principal);
            margin: 0 0 5px 0;
            padding-bottom: 5px;
            border-bottom: 2px solid var(--color-principal);
        }

        .section-content {
            padding-top: 8px;
        }

        p {
            margin: 0 0 10px 0;
        }

        /* FORMATO DEL CONTENIDO INTERNO */
        .exp-item {
            margin-bottom: 15px;
            page-break-inside: avoid;
        }

        .exp-header {
            font-size: 12pt;
        }

        .exp-dates {
            font-style: italic;
            color: var(--color-secundario);
            margin-bottom: 5px;
            font-size: 10pt;
        }
        
        .exp-desc {
            margin-top: 5px;
        }

        .exp-desc ul, .exp-desc ol {
            margin: 0;
            padding-left: 20px;
        }

        .form-item {
            margin-bottom: 10px;
        }

        .form-header {
            display: flex;
            justify-content: space-between;
            align-items: baseline;
        }

        .form-title {
            flex: 1;
            padding-right: 15px;
        }

        .form-dates {
            font-style: italic;
            color: var(--color-secundario);
            flex-shrink: 0;
            text-align: right;
        }
    </style>
</head>
<body>
    <table style="width: 100%; border: none; border-collapse: collapse;">
        <thead><tr><td style="height: 1.5cm; padding: 0; border: none;"></td></tr></thead>
        <tbody><tr><td style="padding: 0 1.5cm; border: none;">
            <header>
                <div class="header-left">
                    ${cvData.profilePic ? `<img src="${cvData.profilePic}" class="profile-pic" alt="Perfil">` : `<div class="profile-pic"></div>`}
                </div>
                <div class="header-right">
                    <h1>${escapeHtml(nombre)}</h1>
                    <div class="role-title">${escapeHtml(rol)}</div>
                    <div class="contact-info">${contactString}</div>
                </div>
            </header>

            <main>
                ${contentHtml}
            </main>
        </td></tr></tbody>
        <tfoot><tr><td style="height: 1.5cm; padding: 0; border: none;"></td></tr></tfoot>
    </table>
</body>
</html>`;
}
