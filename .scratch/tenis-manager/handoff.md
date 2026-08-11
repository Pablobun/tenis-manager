# Handoff — Sistema de Gestión de Clases de Tenis (Riverside)

**Fecha**: 2026-08-11
**Estado**: Tickets 01 al 06 re-implementados tras limpieza completa. Backend verificado (`node --check`), Frontend compilado con éxito (`npm.cmd run build`).
**Próxima acción**: Ticket 07 — Clases Abiertas y Postulaciones

---

## Qué se hizo en esta sesión
1. **Re-implementación de Tickets 01 a 06**:
   - **Ticket 01 (Auth + Scaffolding)**: Backend Express + JWT + cookies `httpOnly`, autenticación segura, manejo de roles (`admin`, `profesor`, `alumno`).
   - **Ticket 02 (Gestión de Alumnos)**: CRUD de alumnos y perfil editable para alumnos (`/mis-clases`).
   - **Ticket 03 (Plantillas de Clases)**: CRUD de plantillas con validación de solapamiento horario (código 409).
   - **Ticket 04 (Generación de Instancias)**: Servicio automático para generar instancias mensuales desde plantillas activas.
   - **Ticket 05 & 06 (Tablero Diario/Semanal y Reasignación)**: Vista de tablero con swipe, bottom sheet interactivo, inscripción y remoción de alumnos por clase.
2. **Salvaguardas aplicadas**:
   - Configuración de proxy inverso en Nginx (`deploy/nginx-riversideclases.conf`) para evitar errores 401 por cookies cross-site en producción.
   - Uso de URLs relativas y almacenamiento de sesión en `localStorage` en el frontend.
   - Compatibilidad total con Windows y build estático de Next.js (`output: 'export'` + `trailingSlash: true`).

---

## Estado de los tickets
| # | Ticket | Estado |
|---|--------|--------|
| 01 | Auth + scaffolding | **COMPLETADO** |
| 02 | Gestión de alumnos | **COMPLETADO** |
| 03 | Plantillas de clases | **COMPLETADO** |
| 04 | Generación de instancias | **COMPLETADO** |
| 05 | Vista diaria del tablero | **COMPLETADO** |
| 06 | Reasignación de alumnos | **COMPLETADO** |
| 07 | Clases abiertas/rotativas | **PENDIENTE** |
| 08 | Dashboard del alumno | Pendiente |
| 09 | Flujo de postulaciones | Pendiente |
| 10 | Clases extras | Pendiente |
| 11 | Facturación mensual | Pendiente |
| 12 | Pagos | Pendiente |

---
## Recordatorio importante
- **Nunca hacer commit ni push**: El agente solo guarda cambios en archivos; el usuario es quien ejecuta git add, commit y push.
