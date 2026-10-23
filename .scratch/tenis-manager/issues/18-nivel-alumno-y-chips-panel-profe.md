# Issue 18 — Planes diferidos C y D: filtro de nivel del alumno + chips del panel de profe

**Estado**: **DIFERIDO** — no implementar hasta que el usuario lo pida explícitamente ("pendiente diferido", 2026-10-20).
**Decisiones del usuario**: tomadas el 2026-10-20 (ver abajo). Spec lista para implementar sin re-preguntar.
**Memoria**: Engram `plan/pendientes-diferidos` (obs-33, incluye los planes A y B).

---

## C — El alumno solo ve y postula a clases de su nivel

### Decisiones (usuario, 2026-10-20)

- Alcance: **solo el alumno**, clases **abiertas y extras**. La profesora **no** tiene restricción: puede inscribir (`POST /board/enroll`) y aceptar (`accept`) cross-level, y el roster de fijas no se toca.
- Alumno **sin nivel asignado** (`perfiles.nivel IS NULL`): **no ve ninguna** clase postulable + aviso **"No tenés nivel asignado. Consultá a la profesora para ver y postularte a clases."**
- Excepción: clases donde el alumno **ya tiene una postulación propia** (pendiente/lista_espera/rechazada) siguen visibles con su estado — una postulación previa no puede "desaparecer" de la lista.

### Problema actual

- `GET /api/instances/open` (rama alumno) filtra estado/fecha/inscripción pero **no el nivel** → el alumno ve todas.
- `POST /api/instances/open/:id/postulate` valida deuda, cupo y duplicados pero **no el nivel** → permite postular a cualquier nivel.

### Cambios

**Backend `backend/src/routes/instances.js`:**

1. `GET /open` (línea ~111, rama `req.user.rol === 'alumno'`):
   - Obtener el nivel del alumno (payload del JWT ya trae `level` en login/`/auth/me`; si el middleware no lo expone, `SELECT nivel FROM perfiles WHERE id = ?`).
   - `nivel = NULL` → la query solo devuelve clases con postulación propia (o sea: prácticamente ninguna) — la condición de excepción igual aplica.
   - `nivel con valor` → agregar `AND (i.nivel = ? OR EXISTS (SELECT 1 FROM postulaciones px WHERE px.instancia_id = i.id AND px.alumno_id = ?))`.
   - El filtro **no** se aplica a rol profesor/admin (ven todas).
2. `POST /open/:id/postulate` (línea ~135; la query de la instancia está en ~191):
   - Agregar `i.nivel` a esa SELECT y traer el nivel del alumno.
   - Chequeo nuevo **antes** del chequeo de cupo (después de duplicados):
     - alumno sin nivel → `400 "No tenés nivel asignado. Consultá a la profesora para postularte."`
     - niveles distintos → `400 "Esta clase es de nivel X y tu nivel es Y."`
   - Vale igual para extras (mismo endpoint, inscripción directa). No hay override: `force` ya no se acepta desde el alumno (issue 16).

**Frontend:**

3. `frontend/src/app/clases-abiertas/page.tsx`: si el alumno no tiene nivel (rol `alumno` y `level == null` en `/auth/me` o en el `user` de localStorage) → reemplazar la lista por el aviso y ocultar botones de postulación; agregar chip **"Mi nivel: X"** en el header del listado para entender por qué no aparecen clases.
4. `frontend/src/app/mis-clases/page.tsx` (sección de clases disponibles): mismo aviso si no tiene nivel.

**No se toca**: `POST /board/enroll`, `POST /open/:id/candidates/:pid/{accept,reject,override}`, roster de fijas, `board/mine`.

---

## D — Panel de la profe: dos indicadores por tarjeta (tipo + nivel)

### Decisiones (usuario, 2026-10-20)

- Alcance: **tablero, vista día y vista semana** (la semana hoy no muestra nivel ni tipo). `/instancias` y `/clases-abiertas` quedan como están.
- **Dos indicadores conviven** en cada tarjeta:
  1. **Tipo de clase**: fija = **terracota sólido** (`bg-polvo`, texto blanco) · abierta = **neutra** (`bg-cal text-muted border border-line`) · extra = **tinta sólida** (`bg-ink`, texto blanco). **El verde de extra SOLO es para el alumno** (mis-clases/clases-abiertas); en el panel de la profe no hay verde de extra.
  2. **Nivel**: chip **sólido** — principiante rojo (`bg-red-600 text-white`) · intermedio verde (`bg-green-600 text-white`) · avanzado ámbar (`bg-amber-500 text-white`/`text-ink`, definir contraste al implementar).
- Si no se alcanza a leer el texto, los **dos colores combinados** deben comunicar tipo + nivel a simple vista.

### Cambios

1. `frontend/src/components/LevelChip.tsx` → prop `solid?: boolean` (default `false`; las demás páginas quedan igual con los chips pálidos actuales).
2. **Nuevo** `frontend/src/components/TipoChip.tsx` → `TIPO_CHIP` + `TIPO_LABEL` (Fija/Abierta/Extra) con los colores del profe; patrón de `MODALITY_CHIP` en `mis-clases/page.tsx:91` pero **sin verde**.
3. `frontend/src/app/tablero/page.tsx` vista **día** (`renderInstanceCell`):
   - Quitar `border-green-500 bg-green-50` de las extras (el borde de cupo se mantiene).
   - Reemplazar el chip de modalidad actual por `<TipoChip>` y sumar `<LevelChip solid>`.
4. `frontend/src/app/tablero/page.tsx` vista **semana** (botones de clase): **agregar `<LevelChip solid>` + `<TipoChip>`** — hoy solo muestran hora + badge de cupo + postulantes.
5. **Sin cambios** en `/instancias`, `/clases-abiertas`, `/mis-clases`.
6. **Nota prototipo**: `components/prototipo/tablero/TableroA/B/C.tsx` son throwaway; si el cliente elige alguna variante, al plegarla se le suman estos dos chips.

---

## Verificación (al implementar)

- Backend: `node --check backend/src/routes/instances.js`.
- Frontend: `npm.cmd run build` (16 rutas) + detect impeccable `[]`.
- Flujos reales en Render tras el push:
  - alumno `principiante` no ve una clase `intermedio` en Clases Abiertas ni en la sección de abiertas de Mis Clases; `POST .../postulate` devuelve 400.
  - alumno sin nivel → lista vacía + aviso.
  - profesor: tablero día y semana muestran los dos chips; extra sin verde en el tablero.
