# 15 — Lista de problemas reportados (post lote 3) — PENDIENTE DE GRILL

**What to build:** registro crudo de los problemas que la clienta ve en producción. **Sin soluciones todavía** — cada punto pasa por grill (con docs) antes de implementar.

**Blocked by:** —

**Status:** needs-grill

## Problemas

1. **Alumno inscrito sigue apareciendo en "Clases Disponibles".** El alumno se inscribe a una clase extra y la misma clase sigue listada como disponible debajo (con "Inscripto" + cupo 1/4). Evidencia: imagen 1 (captura móvil, vista `/mis-clases`: sección "Mis Clases" con la clase "Inscripto" arriba, y la misma clase repetida en "Clases Disponibles" abajo).

2. **Clases canceladas salen del calendario — falta estado "archivada".** Las canceladas deben figurar en el calendario; hace falta un estado nuevo (ej. *archivar*) que saque la clase del calendario. El profe debe poder ejecutar esa acción **directamente desde el calendario**.

3. **Clase fija cancelada no se puede reactivar.** Caso: clase 19:42–20:42 cancelada → la reactivó y mandó alumnos, pero **no se ve la clase ni los alumnos** y **sigue figurando cancelada**. Evidencia: dump actual de la BD en `backend/sql/estadoactual.sql`.

4. **El artefacto "Manual" no cambió su estilo en base al resto del sistema.** La pestaña/vista Manual (barra inferior: Mis Clases | Mi Perfil | Manual) no sigue el sistema de diseño vigente.

5. **Navegación del calendario del profe — elegir fecha destino en vista semanal.** Al poner la vista "por semana" del almanaque, que se pueda elegir una fecha hacia dónde ir (saltar directo a una fecha), en vez de solo avanzar/volver semana por semana.

## Comments

- **2026-10-08** — Lista recibida en chat (5 items). Pendiente: grill con docs para clarificar cada punto, luego desglose en criterios/implementación. Dump BD adjunto en `backend/sql/estadoactual.sql`.
