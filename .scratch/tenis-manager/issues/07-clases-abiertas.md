# 07 — Clases Abiertas/Rotativas

**What to build:** La profesora puede crear instancias de clases abiertas (viernes PM, sábados AM, o cualquier día). Cada clase abierta tiene: fecha, hora, nivel, cupo, precio. Los alumnos pueden ver estas clases disponibles en su dashboard. La profesora puede ver las clases abiertas que ella creó.

**Blocked by:** 01-auth-scaffolding, 02-gestion-alumnos

**Status:** ready-for-agent

- [x] Profesora puede crear instancia de clase abierta
- [x] Formulario: fecha, hora inicio/fin, nivel, cupo, precio
- [x] Clase abierta aparece en "Clases disponibles" del alumno
- [x] Profesora puede editar/eliminar clase abierta
- [x] Lista de clases abiertas visibles para profesora
- [x] Test: crear clase abierta la hace visible para alumnos (manual en Render post-deploy)
- [x] Test: alumno ve la clase con cupo disponible (manual en Render post-deploy)

## Comments

- Backend: endpoints en `routes/instances.js`:
  - `GET /api/instances/open` (admin/profesor/alumno; alumnos solo ven programadas futuras; incluye `enrolled_count` y `postulation_status` del usuario).
  - `POST /api/instances/open` (crea plantilla inactiva de respaldo + instancia + grupo "Grupo Abierto", todo en transacción).
  - `PUT /api/instances/open/:id` y `DELETE /api/instances/open/:id` (borra la plantilla de respaldo → cascada).
  - `POST /api/instances/open/:id/postulate` (alumno, inserta en `postulaciones` estado `pendiente`).
- Frontend: `/clases-abiertas` (CRUD de la profesora) + sección "Clases Disponibles" en `/mis-clases` con botón "Postularme" y badges de estado.
