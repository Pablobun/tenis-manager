# 04 — Generación de Instancias

**What to build:** Edge Function (o Server Action) que genera instancias mensuales de clases fijas desde las plantillas activas. Al crear/editar una plantilla, se generan las instancias del mes actual. La profesora puede ver todas las instancias del mes en una vista de calendario.

**Blocked by:** 03-plantillas-clases

**Status:** ready-for-agent

- [ ] Edge Function que genera instancias desde plantillas activas
- [ ] Generación al crear plantilla (instancias del mes actual)
- [ ] Generación al editar plantilla (actualiza instancias futuras)
- [ ] No genera instancias duplicadas (UNIQUE constraint)
- [ ] Vista de calendario mensual con todas las instancias
- [ ] Navegación por mes en la vista de calendario
- [ ] Test: crear plantilla genera instancias correctas del mes
- [ ] Test: editar plantilla actualiza instancias sin duplicar
