# 13 — Cambios de cliente (lote 2)

**What to build:** Los 10 puntos de `cambios.txt`: bajas propias de alumnos, extras con inscripción directa sin candidatos, alta forzada por la profe, replicación mensual con alumnos en fijas, borde rojo en extras, cobro 50%, plantillas con alumnos fijos precargados, edición de altas/bajas en vista profe y notificaciones por mail.

**Blocked by:** —

**Status:** ready-for-agent

## Decisiones del grilling (confirmadas con el usuario)

1. **Baja propia del alumno — todas las modalidades** (abierta, extra, fija), con **límite de 24h antes** de la hora de la clase; pasado ese límite solo la profe/admin puede quitarlo.
2. **Baja en fija = solo la instancia puntual** (un día). No sale del grupo, no se toca la mensualidad del mes en curso.
3. **Extras: inscripción directa, sin candidatos.** El alumno se inscribe y queda `aceptada` inmediatamente (ocupa cupo). Si el cupo está lleno → `lista_espera` automática (sin paso `pendiente`). Se elimina la vista/flujo de "candidatos" para extras (aceptar/rechazar no aplica). La profe puede agregar y quitar directamente.
4. **Cobro de extra:** 50% del valor de la clase habitual, cobrado por asistencia (regla actual confirmada) — aplica a todo alumno que se suma a una extra que no es suya.
5. **Replicación mensual:** plantillas `fija` → instancias **con sus alumnos** (roster de la plantilla); `extra` → instancias **vacías**; `abierta` → no se traslada gente (ad-hoc, como hoy).
6. **Plantilla con alumnos fijos:** al crear una plantilla fija se seleccionan sus alumnos; quedan guardados en la plantilla y se inscriben en cada instancia al replicar el mes. Editable después desde Plantillas. Templates viejos sin roster → se replican vacíos (compatibilidad).
7. **Notificaciones por mail** de subidas y bajas → **alumno (confirmación) + profe (aviso)**. Gmail nuevo dedicado (2FA + App Password, SMTP vía env vars); si no hay credenciales, el envío queda silenciosamente desactivado.

## Criterios

- [ ] P1 — Alumno se da de baja de una clase (abierta/extra/fija-instancia) con botón en su vista; bloqueado si faltan <24h (mensaje claro); la profe siempre puede quitarlo
- [ ] P1 — Baja en fija remueve solo esa instancia, mensualidad intacta
- [ ] P2 — Extra: inscripción directa (sin pendiente/candidatos); cupo lleno → lista de espera; se oculta UI de candidatos en extras
- [ ] P2 — Profe: alta forzada (salta cupo/deuda) y baja directa de alumnos en extras/abiertas
- [ ] P3 — Replicar mes: fijas con roster de plantilla, extras vacías, abiertas sin traslado
- [ ] P3 — Form de plantilla fija: selector de alumnos precargados; roster editable en Plantillas
- [ ] P4 — Tarjetas de clase extra con borde rojo (tablero, instancias, clases-abiertas, mis-clases)
- [ ] P4 — Extra cobra 50% de la clase habitual por asistencia (verificar/garantizar en billing)
- [ ] P5 — Vista profe: alta/baja de alumnos coherente en tablero/instancias/abiertas (bottom sheet + acciones)
- [ ] P6 — Servicio de mail (SMTP env vars) + mails de subida/baja a alumno y profe; desactivado sin credenciales
- [ ] Verificación: `node --check` backend + `npm.cmd run build` frontend
