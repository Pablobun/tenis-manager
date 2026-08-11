# 05 — Vista Diaria del Tablero

**What to build:** La pantalla principal de la profesora: grilla diaria con franjas horarias como filas y grupos como celdas. Cada celda muestra nombres + nivel + cupo. Swipe horizontal para cambiar de día. Bottom sheet al tocar un grupo con opciones (ver alumnos, agregar, mover, borrar). Indicador visual de cupo (lleno/vacío).

**Blocked by:** 04-generacion-instancias

**Status:** completed

- [x] Grilla diaria: franjas horarias del día como filas (distintas `start_hour`, ordenadas)
- [x] Celdas de grupo: nombres + nivel + cupo (ej: "SCOPPA / MALANO · Avanzado · 2/4")
- [x] Swipe horizontal para cambiar de día (+ botones ◀ ▶)
- [x] Barra superior con fecha del día actual (+ "Volver a hoy")
- [x] Bottom sheet al tocar grupo: Ver alumnos (funcional), Agregar/Mover/Borrar (hooks para ticket 06)
- [x] Indicador visual de cupo (verde ok / rojo lleno / gris cancelada)
- [x] Toggle para cambiar a vista semanal (ligera, 7 días con chips)
- [x] Loading states y empty states
- [ ] Test: grilla renderiza instancias del día seleccionado (manual en Render post-deploy)
- [ ] Test: bottom sheet muestra opciones correctas (manual en Render post-deploy)

## Comments

- Implementado en sesión 3. Backend: `backend/src/routes/board.js` (`GET /api/board/day` y `GET /api/board/week`), montado en `/api/board`. Enriquecen instancias con sus alumnos vía `groups → group_students → profiles`.
- Frontend: `frontend/src/app/tablero/page.tsx`. Login de profesor → `/tablero`. Card "Tablero" en dashboard/admin.
- Las acciones Agregar/Mover/Borrar del sheet quedan como disabled hasta el ticket 06 (reasignación).
- Sin alumnos asignados aún (no hay flujo de inscripción), las celdas muestran "Sin alumnos · 0/cupo".
- Verificado: sintaxis, arranque, auth (401), validación de fecha (400), `npm run build` OK. Flujo real contra BD en Render tras push.
