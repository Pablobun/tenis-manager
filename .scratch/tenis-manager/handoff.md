# Handoff — Sistema de Gestión de Clases de Tenis

**Fecha**: 2026-08-08
**Estado**: Planificación completa. No se escribió código.
**Próxima acción**: Implementar ticket01 (Auth + Scaffolding)

---

## Qué es este proyecto

Web app responsive (mobile-first) para una profesora de tenis que administra clases, inscripciones y deudas. Actualmente lo hace en Excel/CSV manualmente.

**Usuarios**: profesora(s), alumnos, admin
**Plataforma**: web responsive, la mayoría usa celular

---

## Qué se hizo en esta sesión

Todo fue planificación. No se creó código.

1. **Instalar skills** — 31 skills de Matt Pocock copiados de `github.com/mattpocock/skills` a `.opencode/skills/`
2. **Setup issue tracker** — `AGENTS.md`, `docs/agents/issue-tracker.md`, `docs/agents/triage-labels.md`, `docs/agents/domain.md`
3. **Modelo de dominio** — `CONTEXT.md` con 27 términos canónicos y 20+ decisiones registradas
4. **Wayfinder** — 7 rondas de grilling, 7 tickets de decisión resueltos en `.scratch/tenis-manager/research/`
5. **Spec/PRD** — 50 user stories en `.scratch/tenis-manager/PRD.md`
6. **Schema de DB** — DDL completo con RLS en `.scratch/tenis-manager/tickets/07-database-schema.md`
7. **12 tickets de implementación** — en `.scratch/tenis-manager/issues/`

---

## Stack

### Fase 1 — Prototipo (arrancar aquí)

| Capa | Tecnología |
|------|-----------|
| Frontend | Next.js (React 19) + TypeScript |
| UI | shadcn/ui + Tailwind CSS |
| Backend | Supabase (PostgreSQL + Auth + Realtime) |
| Hosting | Vercel (gratis) |
| Auth | Supabase Auth (roles en `app_metadata`) |
| Tests | Vitest + Testing Library (unit) + Playwright (E2E) |

Costo estimado: $0-25/mo

### Fase 2 — Self-hosted (futuro)

| Capa | Tecnología |
|------|-----------|
| Frontend | React (se mantiene) |
| Backend | Python (FastAPI o Django REST) |
| BD | MySQL en droplet DigitalOcean |
| Deploy | GitHub → pull en droplet |
| Auth | JWT custom en Python |

---

## Dominio (resumen rápido)

**3 roles**: admin, profesora, alumno

**3 modalidades de clase**:
- **Fija** — alumnos alistados por la profe, cobro mensual (precio × clases del mes)
- **Abierta/rotativa** — postulación de alumnos, cobro por asistencia
- **Extra** — para fijos y visitantes, 50% precio, postulación

**Grupos**: parejas (2) o grupos de 4, con nivel asignado (avanzado/intermedio/principiante)

**Deuda**: semi-automática (sistema calcula, profe aprueba). Bloquea postulación (con excepción manual). Pagos: individual + por lote, monto personalizado.

**Reasignación**: tap + menú "Mover a..." (no drag en celular). Confirmación si destino queda completo.

**Vista profesor**: grilla diaria (swipe entre días) + toggle semanal. Bottom sheet por tap. Indicador: nombres + nivel + cupo.

**Vista alumno**: "Mis clases" + "Clases disponibles" + saldo de deuda. Puede postularse y cancelar postulación pendiente.

---

## 12 tickets de implementación

| # | Ticket | Bloqueado por | Qué entrega |
|---|--------|---------------|-------------|
| 01 | Auth + scaffolding | — | Proyecto Next.js, Supabase, login, roles, middleware |
| 02 | Gestión de alumnos | 01 | CRUD perfiles, nivel, teléfono, invitación |
| 03 | Plantillas de clases | 01, 02 | Crear/editar plantillas de clases fijas |
| 04 | Generación de instancias | 03 | Edge Function genera instancias del mes |
| 05 | Vista diaria del tablero | 04 | Grilla, swipe, bottom sheet, indicadores |
| 06 | Reasignación de alumnos | 05 | "Mover a..." con lista y confirmación |
| 07 | Clases abiertas/rotativas | 01, 02 | Crear clases abiertas, ver para alumnos |
| 08 | Dashboard del alumno | 01, 02, 04 | Mis clases, disponibles, deuda |
| 09 | Flujo de postulaciones | 07, 08 | Postular, aceptar/rechazar, waitlist, override |
| 10 | Clases extras | 07 | Crear extra, postular, asistencia |
| 11 | Facturación mensual | 04 | Generación semi-automática de deuda |
| 12 | Pagos | 11 | Individual + lote, historial, resumen global |

**Frontier actual**: solo ticket01 (sin bloqueos)

---

## Archivos importantes

| Ruta | Qué es |
|------|--------|
| `AGENTS.md` | Config de agent skills |
| `CONTEXT.md` | Glosario del dominio (27 términos + 20+ decisiones) |
| `.scratch/tenis-manager/map.md` | Mapa de wayfinder (destino + 7 decisiones) |
| `.scratch/tenis-manager/PRD.md` | Spec completo (50 user stories) |
| `.scratch/tenis-manager/tickets/07-database-schema.md` | Schema DDL con RLS |
| `.scratch/tenis-manager/research/01-tech-stack.md` | Research de stack |
| `.scratch/tenis-manager/research/06-auth-approach.md` | Research de auth |
| `.scratch/tenis-manager/issues/01-*.md` a `12-*.md` | Tickets de implementación |

---

## Qué hacer en la próxima sesión

1. Leer este handoff
2. Leer `CONTEXT.md` para el glosario
3. Leer el ticket01 en `.scratch/tenis-manager/issues/01-auth-scaffolding.md`
4. Ejecutar `/implement` en ticket01:
   - Crear proyecto Next.js (TypeScript, App Router, Tailwind)
   - Instalar shadcn/ui
   - Crear proyecto Supabase y configurar variables de entorno
   - Crear tablas según schema DDL
   - Configurar auth (login, middleware, routing por rol)
   - Tests básicos
5. Cuando ticket01 esté listo, seguir con ticket02

**NOTA**: El ticket01 dice "Status: completed" pero es incorrecto — no se escribió código. Hay que reabrirlo.

---

## Out of scope (por ahora)

- Reportes y resumen mensual automático
- Notificaciones push/SMS
- Multi-academia
- Cobros electrónicos
- App móvil nativa
- Paginación avanzada
- Exportación a PDF/Excel

---

## Notas técnicas

- El schema DDL usa PostgreSQL — en Fase 2 se adapta a MySQL
- RLS policies para 3 roles — alumnos solo ven sus datos
- Supabase Auth con roles en `app_metadata` — verificar JWT en middleware
- Edge Functions para generación de instancias y facturación
- shadcn/ui: usar componentes existentes (grilla, bottom sheet, swipe)
- Cada pantalla se diseña primero para 375px (mobile-first)
