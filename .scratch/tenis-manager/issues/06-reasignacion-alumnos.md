# 06 — Reasignación de Alumnos

**What to build:** Flujo "Mover a..." desde el bottom sheet. Al tocar "Mover a...", se muestra una lista de todos los grupos del día con nivel y cupo. Al seleccionar destino, se muestra confirmación si el grupo queda completo. El movimiento se refleja inmediatamente en la grilla.

**Blocked by:** 05-vista-diaria

**Status:** ready-for-agent

- [ ] Bottom sheet tiene opción "Mover a..."
- [ ] Tap "Mover a..." muestra lista de grupos del día
- [ ] Cada grupo en la lista muestra: nivel, cupo, alumnos actuales
- [ ] Al seleccionar destino, se mueve el alumno
- [ ] Confirmación si destino queda completo ("Queda 4/4. ¿Mover?")
- [ ] Movimiento se refleja inmediatamente en la grilla (optimistic update)
- [ ] Si hay error, se revierte el movimiento
- [ ] Test: mover alumno actualiza ambos grupos
- [ ] Test: confirmación aparece cuando destino queda lleno
