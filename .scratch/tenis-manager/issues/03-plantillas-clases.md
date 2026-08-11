# 03 — Plantillas de Clases

**What to build:** La profesora puede crear, editar y desactivar plantillas de clases fijas. Cada plantilla define: día de la semana, franja horaria (start/end), nivel, modalidad (fija), cupo máximo, precio por clase, y frecuencia (veces por semana). Las plantillas se listan y se pueden gestionar.

**Blocked by:** 01-auth-scaffolding, 02-gestion-alumnos

**Status:** completed

- [x] Profesora puede crear plantilla de clase fija
- [x] Formulario: día, hora inicio/fin, nivel, cupo, precio, frecuencia
- [x] Profesora puede editar plantilla existente
- [x] Profesora puede desactivar plantilla (toggle `is_active`; la generación de instancias es ticket 04)
- [x] Lista de plantillas activas visibles (también inactivas con badge)
- [x] Validación: no solapamiento de horarios en la misma cancha (409 en backend)
- [ ] Test: profesora crea plantilla y aparece en la lista (manual en Render post-deploy)
- [ ] Test: desactivar plantilla no genera nuevas instancias (manual en Render post-deploy)

## Comments

- Implementado en sesión 3. Modelo por día de la semana + frecuencia (schema `class_templates`), las 3 modalidades (fixed/open/extra) en el form.
- Backend: `backend/src/routes/templates.js` montado en `/api/templates`. CRUD + toggle `is_active` + validación de solapamiento entre activas del mismo día y modalidad.
- Frontend: `frontend/src/app/plantillas/page.tsx` + cards de acceso en dashboard/admin.
- Verificado: sintaxis, arranque local, auth (401), validaciones (400), `npm run build` OK. Falta verificación contra la BD real (Render) tras push: crear/editar/desactivar + solapamiento (409).
