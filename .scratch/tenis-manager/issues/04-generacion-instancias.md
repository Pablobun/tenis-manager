# 04 — Generación de Instancias

**What to build:** Edge Function (o Server Action) que genera instancias mensuales de clases fijas desde las plantillas activas. Al crear/editar una plantilla, se generan las instancias del mes actual. La profesora puede ver todas las instancias del mes en una vista de calendario.

**Blocked by:** 03-plantillas-clases

**Status:** completed

- [x] Generación de instancias desde plantillas activas (servicio backend, `services/instances.js`)
- [x] Generación al crear plantilla (instancias del mes actual)
- [x] Generación al editar plantilla (in-place si no cambia el día; borra+regenera si cambia el día)
- [x] No genera instancias duplicadas (INSERT IGNORE + UNIQUE `uk_template_date`)
- [x] Vista de calendario mensual con todas las instancias (`/instancias`)
- [x] Navegación por mes en la vista de calendario (+ botón "Generar mes")
- [ ] Test: crear plantilla genera instancias correctas del mes (manual en Render post-deploy)
- [ ] Test: editar plantilla actualiza instancias sin duplicar (manual en Render post-deploy)

## Comments

- Implementado en sesión 3. Se adaptó "Edge Function" → servicio Express + MySQL (`class_instances` ya existía).
- Generación: 1 instancia por aparición del `day_of_week` en el mes, solo plantillas `fixed` activas. `frequency` queda como metadata.
- Edición: in-place para campos; si cambia `day_of_week` → `regenFuture` (borra futuras y regenera). Desactivar → `status='cancelled'` en futuras.
- Backend: `backend/src/services/instances.js`, `backend/src/routes/instances.js` (GET ?month + POST /generate), disparadores en `templates.js`.
- Frontend: `frontend/src/app/instancias/page.tsx` + cards en dashboard/admin.
- Verificado: sintaxis, arranque, auth (401), validación de mes (400), `npm run build` OK. Falta verificación contra BD real (Render) tras push.
