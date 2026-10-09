# 17 — Postulantes en el calendario del profe: ver y aceptar desde el tablero

**What to build:** cuando un alumno se postula a una clase abierta y queda `pendiente`, la profesora debe verlo **en el calendario (tablero)** — chip en la tarjeta de la clase — y poder **aceptarlo o rechazarlo desde ahí** (modal), sin ir a la página Clases Abiertas.

**Blocked by:** —

**Status:** done — finish review **ship** (2026-10-09)

## Implementación

- **Backend** (`backend/src/services/instances.js`): `enrichInstancesWithStudents` adjunta `pending: [{postulation_id, student_id, full_name}]` (solo `estado='pendiente'`) vía `attachPendingCandidates`. Alimenta `/api/board/day` y `/api/board/week` (también `/instances` y `/board/mine`, inofensivo). NO va en `attachStudents` para no pisar el contador `pending_candidates` que `/open` calcula en su SELECT.
- **Frontend** (`frontend/src/app/tablero/page.tsx`):
  - Tarjeta (día y semana): chip `bg-primary-50 text-primary-700` "N postulante(s)" (mismo chip que Clases Abiertas), solo si `status != cancelada`.
  - Modal: vista nueva `candidates`. Con pendientes y clase `programada`, el **único feltro** pasa a "Ver postulantes (N)" y "Ver alumnos" baja a fila cal (regla de un solo feltro por modal).
  - Vista postulantes: por cada candidato Aceptar (`bg-green-600`) / Rechazar (`bg-red-500`) y Forzar (`bg-ink`) solo con cupo lleno — mismos estilos que Clases Abiertas. Acciones → endpoints existentes `POST /api/instances/open/:id/candidates/:postulationId/{accept|reject|override}`; luego cierra el modal y refresca el calendario.
  - Menores de finish review aplicados: demote de "Ver alumnos" condicionado a `programada` (evita modal sin feltro en `completada`+pending) y `py-2.5` en botones de candidato (touch target).

## Verificación

- `node --check` backend OK; `npm.cmd run build` OK; detect `[]`.
- Finish review: **`disposition: ship`** (sin material fixes; 2 minors aplicados, nits quedan como están).
- Capturas en `.impeccable/review/` (mock API local, evidencia declarada): `desktop`, `tablero-modal-pending-*`, `tablero-modal-candidates-pending-*`, `tablero-week-*`.
- Flujos reales contra BD → verificar en Render tras push (postular como alumno → ver chip en tablero → aceptar → alumno aparece inscripto).
