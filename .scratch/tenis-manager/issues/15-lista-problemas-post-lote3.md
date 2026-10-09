# 15 â€” Lista de problemas reportados (post lote 3) â€” IMPLEMENTADO (sin commitear)

**What to build:** los 5 problemas de producciÃ³n, grill primero y luego implementaciÃ³n completa.

**Blocked by:** â€”

**Status:** done â€” finish review **ship** (2026-10-08)

## Problemas

1. **Alumno inscrito sigue apareciendo en "Clases Disponibles".** El alumno se inscribe a una clase extra y la misma clase sigue listada como disponible debajo (con "Inscripto" + cupo 1/4). Evidencia: imagen 1 (captura mÃ³vil, vista `/mis-clases`: secciÃ³n "Mis Clases" con la clase "Inscripto" arriba, y la misma clase repetida en "Clases Disponibles" abajo).

2. **Clases canceladas salen del calendario â€” falta estado "archivada".** Las canceladas deben figurar en el calendario; hace falta un estado nuevo (ej. *archivar*) que saque la clase del calendario. El profe debe poder ejecutar esa acciÃ³n **directamente desde el calendario**.

3. **Clase fija cancelada no se puede reactivar.** Caso: clase 19:42â€“20:42 cancelada â†’ la reactivÃ³ y mandÃ³ alumnos, pero **no se ve la clase ni los alumnos** y **sigue figurando cancelada**. Evidencia: dump actual de la BD en `backend/sql/estadoactual.sql`.

4. **El artefacto "Manual" no cambiÃ³ su estilo en base al resto del sistema.** La pestaÃ±a/vista Manual (barra inferior: Mis Clases | Mi Perfil | Manual) no sigue el sistema de diseÃ±o vigente.

5. **NavegaciÃ³n del calendario del profe â€” elegir fecha destino en vista semanal.** Al poner la vista "por semana" del almanaque, que se pueda elegir una fecha hacia dÃ³nde ir (saltar directo a una fecha), en vez de solo avanzar/volver semana por semana.

## Comments

- **2026-10-08** â€” Lista recibida en chat (5 items). Pendiente: grill con docs para clarificar cada punto, luego desglose en criterios/implementaciÃ³n. Dump BD adjunto en `backend/sql/estadoactual.sql`.

## Decisiones de grill â€” puntos 2 y 3 (resueltos, 2026-10-08)

Los puntos 2 y 3 se fusionaron en un mismo modelo de estados/acciones:

**Estados (ENUM `instancias_clases.estado`)**: `programada` | `cancelada` | `archivada` (nuevo) | `completada`.

**Origen â†’ estado â†’ efectos**:

| Origen | Estado | Calendario | Alumno | FacturaciÃ³n |
|---|---|---|---|---|
| Calendario â†’ Cancelar (1 fecha) | `cancelada` | **visible** como cancelada | la ve como "Cancelada" | **sÃ­ cuenta** |
| Panel fijas â†’ Desactivar (serie) | `archivada` | **desaparece** | no la ve | **no cuenta** |

**Acciones**:
- Calendario: Cancelar (`programadaâ†’cancelada`) y Reactivar (`canceladaâ†’programada`) sobre UNA fecha.
- Panel fijas: Desactivar (futuras `programadaâ†’archivada`, todos los meses) / Activar (`archivadaâ†’programada` desde hoy en adelante en todos los meses ya generados â€” INSERT IGNORE ya no alcanza, hace falta UPDATE).
- Sobre `cancelada`: **solo** Reactivar (no inscribir, no dar de baja, no marcar asistencia). Sobre `archivada`: ninguna.

**BD**: Ãºnico cambio de esquema = `ALTER TABLE instancias_clases MODIFY estado ENUM('programada','completada','cancelada','archivada') DEFAULT 'programada';`. **Sin migraciÃ³n de datos** (el usuario confirmÃ³ que todo es data de prueba y se descarta/rehace). El "motivo" de cancelaciÃ³n lo distingue el propio estado â€” sin columnas nuevas.

**Causa raÃ­z punto 3 (verificado en dump)**: "Activar plantilla" hacÃ­a `activa=1` + `generateInstancesForMonth` con INSERT IGNORE, que salta las filas existentes por `UNIQUE (plantilla_id, fecha)` â†’ las instancias 250â€“253 (oct, plantilla 6) quedaron `cancelada` para siempre. Fix: UPDATE `archivadaâ†’programada` + seguir generando el mes actual.

**Efectos en cadena**: `billing.js:30,49` pasa de excluir `cancelada` a excluir `archivada`; `/board/day|week|mine` deben filtrar `archivada`; endpoint nuevo `PUT /instances/:id/status`; botones Cancelar/Reactivar en el modal del tablero; chip "Cancelada" visible para el alumno en mis-clases.

## ResoluciÃ³n â€” puntos 1, 4, 5 (grill + implementaciÃ³n, 2026-10-08)

**Punto 1 â€” alumno inscrito en Clases Disponibles**: anti-join en `GET /api/instances/open` (`backend/src/routes/instances.js`) â€” excluye instancias donde el alumno ya tiene postulaciÃ³n `inscripto`/`aceptada`. Seguen visibles las de `pendiente`/`lista_espera`/`rechazada`. Frontend: `mis-clases/page.tsx` filtra tambiÃ©n en cliente.

**Punto 4 â€” manuales â†’ Polvo de Ladrillo**: los 3 manuales (`frontend/public/manual-{usuario,profesor,sistema}.html`) reestilizados con la paleta del sistema (bloque `<style>` idÃ©ntico, MD5 verificado) + contenido de reglas nuevo: `cancelada` vs `archivada`, facturaciÃ³n, acciones permitidas. `<h4>` â†’ `<h3 class="card-title">` (accesibilidad), `.main` max-width 700px (~75ch).

**Punto 5 â€” fecha destino en calendario del profe**: vista semana navega Â±7 dÃ­as + `<input type="date">` para saltar a una fecha arbitaria (`tablero/page.tsx`).

**VerificaciÃ³n**: backend `node --check` (7 archivos) OK; frontend `npm.cmd run build` OK; impeccable detect `[]` en `frontend/src` y en los manuales (ignore deliberado `cream-palette *` en `frontend/public/manual-*.html` â€” `.impeccable/config.json`); finish review: ronda 1 `fix` (feltro en modal, contraste `#B65434`â†’`#964226`, medida de manuales) â†’ 2 batches â†’ **`disposition: ship`**. Capturas frescas en `.impeccable/review/` (17).

**Pendiente de usuario**: correr la migraciÃ³n `backend/sql/migrations/003_archivada.sql` en SQLYog + git add/commit/push + hard refresh.
