# 09 — Flujo de Postulaciones

**What to build:** El alumno se postula a una clase abierta/extras desde su dashboard. La profesora ve los candidatos pendientes y acepta/rechaza. Al aceptar, el alumno ocupa cupo automáticamente. Los rechazados van a waitlist. La profesora puede forzar aceptación con deuda (override).

**Blocked by:** 07-clases-abiertas, 08-dashboard-alumno

**Status:** ready-for-agent

- [ ] Alumno puede postularse a clase abierta/extras
- [ ] Postulación aparece como "pendiente" para la profesora
- [ ] Profesora puede aceptar → alumno ocupa cupo automáticamente
- [ ] Profesora puede rechazar → alumno va a waitlist
- [ ] Profesora puede forzar aceptación con deuda (override)
- [ ] Alumno puede cancelar postulación pendiente
- [ ] Alumno ve estado de su postulación (pendiente/aceptada/rechazada)
- [ ] Si cupo está lleno, postulación va directo a waitlist
- [ ] Test: postular crea registro con estado pending
- [ ] Test: aceptar agrega alumno al grupo y actualiza cupo
- [ ] Test: override permite aceptar con deuda
