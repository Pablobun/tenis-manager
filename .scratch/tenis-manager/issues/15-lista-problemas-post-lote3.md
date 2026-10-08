# 15 — Lista de problemas reportados (post lote 3) — IMPLEMENTADO (sin commitear)

**What to build:** los 5 problemas de producción, grill primero y luego implementación completa.

**Blocked by:** —

**Status:** done — finish review **ship** (2026-10-08)

## Problemas

1. **Alumno inscrito sigue apareciendo en "Clases Disponibles".** El alumno se inscribe a una clase extra y la misma clase sigue listada como disponible debajo (con "Inscripto" + cupo 1/4). Evidencia: imagen 1 (captura móvil, vista `/mis-clases`: sección "Mis Clases" con la clase "Inscripto" arriba, y la misma clase repetida en "Clases Disponibles" abajo).

2. **Clases canceladas salen del calendario — falta estado "archivada".** Las canceladas deben figurar en el calendario; hace falta un estado nuevo (ej. *archivar*) que saque la clase del calendario. El profe debe poder ejecutar esa acción **directamente desde el calendario**.

3. **Clase fija cancelada no se puede reactivar.** Caso: clase 19:42–20:42 cancelada → la reactivó y mandó alumnos, pero **no se ve la clase ni los alumnos** y **sigue figurando cancelada**. Evidencia: dump actual de la BD en `backend/sql/estadoactual.sql`.

4. **El artefacto "Manual" no cambió su estilo en base al resto del sistema.** La pestaña/vista Manual (barra inferior: Mis Clases | Mi Perfil | Manual) no sigue el sistema de diseño vigente.

5. **Navegación del calendario del profe — elegir fecha destino en vista semanal.** Al poner la vista "por semana" del almanaque, que se pueda elegir una fecha hacia dónde ir (saltar directo a una fecha), en vez de solo avanzar/volver semana por semana.

## Comments

- **2026-10-08** — Lista recibida en chat (5 items). Pendiente: grill con docs para clarificar cada punto, luego desglose en criterios/implementación. Dump BD adjunto en `backend/sql/estadoactual.sql`.

## Decisiones de grill — puntos 2 y 3 (resueltos, 2026-10-08)

Los puntos 2 y 3 se fusionaron en un mismo modelo de estados/acciones:

**Estados (ENUM `instancias_clases.estado`)**: `programada` | `cancelada` | `archivada` (nuevo) | `completada`.

**Origen → estado → efectos**:

| Origen | Estado | Calendario | Alumno | Facturación |
|---|---|---|---|---|
| Calendario → Cancelar (1 fecha) | `cancelada` | **visible** como cancelada | la ve como "Cancelada" | **sí cuenta** |
| Panel fijas → Desactivar (serie) | `archivada` | **desaparece** | no la ve | **no cuenta** |

**Acciones**:
- Calendario: Cancelar (`programada→cancelada`) y Reactivar (`cancelada→programada`) sobre UNA fecha.
- Panel fijas: Desactivar (futuras `programada→archivada`, todos los meses) / Activar (`archivada→programada` desde hoy en adelante en todos los meses ya generados — INSERT IGNORE ya no alcanza, hace falta UPDATE).
- Sobre `cancelada`: **solo** Reactivar (no inscribir, no dar de baja, no marcar asistencia). Sobre `archivada`: ninguna.

**BD**: único cambio de esquema = `ALTER TABLE instancias_clases MODIFY estado ENUM('programada','completada','cancelada','archivada') DEFAULT 'programada';`. **Sin migración de datos** (el usuario confirmó que todo es data de prueba y se descarta/rehace). El "motivo" de cancelación lo distingue el propio estado — sin columnas nuevas.

**Causa raíz punto 3 (verificado en dump)**: "Activar plantilla" hacía `activa=1` + `generateInstancesForMonth` con INSERT IGNORE, que salta las filas existentes por `UNIQUE (plantilla_id, fecha)` → las instancias 250–253 (oct, plantilla 6) quedaron `cancelada` para siempre. Fix: UPDATE `archivada→programada` + seguir generando el mes actual.

**Efectos en cadena**: `billing.js:30,49` pasa de excluir `cancelada` a excluir `archivada`; `/board/day|week|mine` deben filtrar `archivada`; endpoint nuevo `PUT /instances/:id/status`; botones Cancelar/Reactivar en el modal del tablero; chip "Cancelada" visible para el alumno en mis-clases.

## Resolución — puntos 1, 4, 5 (grill + implementación, 2026-10-08)

**Punto 1 — alumno inscrito en Clases Disponibles**: anti-join en `GET /api/instances/open` (`backend/src/routes/instances.js`) — excluye instancias donde el alumno ya tiene postulación `inscripto`/`aceptada`. Seguen visibles las de `pendiente`/`lista_espera`/`rechazada`. Frontend: `mis-clases/page.tsx` filtra también en cliente.

**Punto 4 — manuales → Polvo de Ladrillo**: los 3 manuales (`frontend/public/manual-{usuario,profesor,sistema}.html`) reestilizados con la paleta del sistema (bloque `<style>` idéntico, MD5 verificado) + contenido de reglas nuevo: `cancelada` vs `archivada`, facturación, acciones permitidas. `<h4>` → `<h3 class="card-title">` (accesibilidad), `.main` max-width 700px (~75ch).

**Punto 5 — fecha destino en calendario del profe**: vista semana navega ±7 días + `<input type="date">` para saltar a una fecha arbitaria (`tablero/page.tsx`).

**Verificación**: backend `node --check` (7 archivos) OK; frontend `npm.cmd run build` OK; impeccable detect `[]` en `frontend/src` y en los manuales (ignore deliberado `cream-palette *` en `frontend/public/manual-*.html` — `.impeccable/config.json`); finish review: ronda 1 `fix` (feltro en modal, contraste `#B65434`→`#964226`, medida de manuales) → 2 batches → **`disposition: ship`**. Capturas frescas en `.impeccable/review/` (17).

**Pendiente de usuario**: correr la migración `backend/sql/migrations/003_archivada.sql` en SQLYog + git add/commit/push + hard refresh.
