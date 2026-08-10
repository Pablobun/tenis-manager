Status: ready-for-agent

## Problem Statement

Una profesora de tenis administra clases, inscripciones y deudas manualmente en planillas Excel/CSV. El proceso diario implica: reacomodar alumnos entre grupos ("revoloteo"), gestionar postulaciones a clases abiertas por WhatsApp, controlar deudas y pagos, y planificar la mensualidad de clases fijas. Todo recae en ella, es propenso a errores, y consume tiempo que podría dedicar a enseñar.

## Solution

Web app responsive (mobile-first) para gestionar clases de tenis. La profesora administra clases fijas (con plantillas + instancias automáticas del mes), clases abiertas/rotativas (con postulación de candidatos y cupo), clases extras (50% precio, para fijos y visitantes), alumnos con niveles, y deudas/pagos con historial. Los alumnos tienen login propio y pueden postularse a clases abiertas, ver sus clases y su deuda.

## User Stories

### Profesora — Tablero

1. As a profesora, I want to see a daily view of all classes (grilla por franjas horarias), so that I can see at a glance what's happening today
2. As a profesora, I want to swipe between days in the daily view, so that I can quickly check other days
3. As a profesora, I want to toggle to a weekly view, so that I can see the full picture of the week
4. As a profesora, I want to navigate between months with a month picker, so that I can plan ahead
5. As a profesora, I want each group cell to show student names, level, and cupo (e.g. "SCOPPA / MALANO · Avanzado · 2/4"), so that I can assess the situation at a tap
6. As a profesora, I want to tap a group and see a bottom sheet with options (ver alumnos, agregar, mover, borrar), so that I can act quickly without navigating away

### Profesora — Reasignación

7. As a profesora, I want to tap "Mover a..." on a student and see a list of all groups of the day with level and cupo, so that I can choose where to move them
8. As a profesora, I want to see a confirmation alert if the destination group would become full (4/4), so that I can confirm or cancel
9. As a profesora, I want to move a student from one group to another without leaving the daily view, so that the reasignación is fast

### Profesora — Gestión de clases

10. As a profesora, I want to create a class template (día, franja, nivel, modalidad, cupo, precio, frecuencia), so that the system generates instances automatically
11. As a profesora, I want to create an open/rotativa class (fecha, hora, nivel, cupo, precio), so that students can apply
12. As a profesora, I want to create an extra class (fecha, hora, cupo, precio al 50%), so that fixed students can take additional classes
13. As a profesora, I want to edit or deactivate a class template, so that I can adjust to changes
14. As a profesora, I want to see all class instances for the current month in a calendar view, so that I can plan ahead

### Profesora — Candidatos

15. As a profesora, I want to see pending applications (candidatos) for my open/extra classes, so that I can accept or reject them
16. As a profesora, I want to accept a candidate and have them automatically occupy a cupo, so that the enrollment is immediate
17. As a profesora, I want rejected candidates to go to a waitlist, so that they can fill in if someone drops
18. As a profesora, I want to delete candidates from the waitlist when the class has already occurred, so that the list stays clean
19. As a profesora, I want to force-accept a student with debt (override), so that I can make exceptions

### Profesora — Alumnos

20. As a profesora, I want to create a new student profile (name, email, phone, level), so that they can log in and use the system
21. As a profesora, I want to assign a student to a fixed class group, so that they are enrolled in the class
22. As a profesora, I want to remove a student from a fixed class group, so that I can manage attendance
23. As a profesora, I want to see a student's profile with their classes, level, and debt summary, so that I can make informed decisions
24. As a profesora, I want to add a visitante (non-fixed student) to the system, so that they can apply to extra classes

### Profesora — Deuda y Pagos

25. As a profesora, I want to generate monthly debt for fixed-class students (semi-automática: system calculates, I approve), so that billing is accurate
26. As a profesora, I want to register a payment for a specific student (amount, date), so that the debt is reduced
27. As a profesora, I want to register batch payments (multiple students, same amount), so that I can process payments quickly
28. As a profesora, I want to enter a custom payment amount (partial payments allowed), so that flexibility is maintained
29. As a profesora, I want to see a debt summary per student (amount owed, breakdown by class, payment history), so that I can track collections
30. As a profesora, I want to see a global payment summary (all students, by date), so that I can see the overall picture
31. As a profesora, I want to be notified when a new month opens and there are students who haven't paid, so that I can decide whether to release their cupo
32. As a profesora, I want to force-allow a student to reserve cupo even with unpaid debt (override), so that I can make exceptions

### Profesora — Excepciones

33. As a profesora, I want to override the debt block when accepting a candidate, so that I can let students with debt join
34. As a profesora, I want to override the payment-required block when reserving cupo, so that I can make exceptions

### Alumno — Dashboard

35. As a alumno, I want to see my classes (fixed + accepted open/extra) on my main screen, so that I know what I have
36. As a alumno, I want to see my debt balance (amount owed + breakdown), so that I know my financial status
37. As a alumno, I want to see "Clases disponibles" section, so that I can discover open/extra classes to apply to

### Alumno — Postulación

38. As a alumno, I want to apply to an open/extra class from my dashboard, so that I can join without WhatsApp
39. As a alumno, I want to see the class details (date, time, level, available cupo) before applying, so that I make an informed choice
40. As a alumno, I want to cancel a pending application, so that I can change my mind
41. As a alumno, I want to see if my application was accepted or rejected, so that I know my status

### Alumno — Perfil

42. As a alumno, I want to edit my name and phone, so that my info stays current
43. As a alumno, I want to see my level, so that I know which classes are for me

### Admin

44. As admin, I want full access to all data and operations, so that I can manage the system
45. As admin, I want to create professor accounts, so that they can use the system
46. As admin, I want to see all professors' classes and students, so that I have oversight

### Auth & Acceso

47. As any user, I want to log in with email + password, so that access is simple
48. As admin, I want to invite new users via email, so that accounts are created securely
49. As a student, I want to only see my own data, so that privacy is maintained
50. As a professor, I want to see all classes and students, so that I can manage everything

## Implementation Decisions

### Stack

- **Frontend**: Next.js (React 19) con App Router
- **UI**: shadcn/ui + Tailwind CSS (mobile-first)
- **Backend**: Supabase (PostgreSQL + Auth + Realtime + Edge Functions)
- **Hosting**: Vercel (frontend) + Supabase (backend)
- **Auth**: Supabase Auth con roles en `app_metadata`

### Arquitectura de módulos

1. **Auth Module** — middleware de Next.js que verifica JWT + role. RLS en Supabase para control de acceso a nivel DB. Perfiles en tabla `profiles` vinculada a `auth.users`.

2. **Class Module** — `class_templates` (plantillas) + `class_instances` (instancias generadas). Edge Function para generar instancias mensuales al crear/editar plantilla. Los alumnos se asignan a `groups` vinculados a instances.

3. **Application Module** — `applications` con estados: pending → accepted/rejected/waitlisted. Al aceptar, se crea `group_students` automáticamente. Al rechazar, se mueve a waitlisted.

4. **Student Module** — `profiles` con rol `student`. CRUD por profesora/admin. Los alumnos ven su propio perfil via RLS.

5. **Debt Module** — `debts` + `payments`. Generación semi-automática: Edge Function calcula deuda mensual, profesora aprueba. Pagos: individual o por lote, monto personalizado. Resumen global por fecha.

6. **Dashboard Module** — dos vistas: profesora (grilla diaria/semanal) y alumno (mis clases + postulaciones). Componentes shadcn/ui responsive.

### API Contracts

- **Supabase Client**: se usa `@supabase/ssr` para Next.js App Router. Tres clientes: browser, server, middleware.
- **RLS**: todas las queries pasan por RLS. Los roles se verifican via `auth.jwt() -> 'app_metadata' ->> 'role'`.
- **Realtime**: suscripción a `applications` y `group_students` para updates en vivo.

### Schema

Ver `.scratch/tenis-manager/tickets/07-database-schema.md` para el DDL completo. Tablas principales: `profiles`, `class_templates`, `class_instances`, `groups`, `group_students`, `applications`, `attendance`, `debts`, `payments`, `billing_cycles`.

## Testing Decisions

- **Unit tests**: componentes React con Vitest + Testing Library. Testear renderizado condicional por rol, formularios, interacciones de tap.
- **Integration tests**: queries de Supabase contra una DB de test (Supabase local o Docker). Testear RLS policies, generación de instancias, cálculo de deuda.
- **E2E tests**: Playwright para flujos críticos (login, ver grilla, mover alumno, postularse, registrar pago).
- **Prior art**: no hay tests existentes (greenfield). Establecer convención desde el inicio.

## Out of Scope

- Reportes y resumen mensual automático (se ve después)
- Notificaciones push/SMS (comunicación por WhatsApp externo)
- Multi-academia (1 sola escuela por ahora)
- Cobros electrónicos (la profe cobra en persona)
- App móvil nativa (es web responsive)
- Paginación avanzada o búsqueda full-text (decenas de usuarios, no miles)
- Exportación a PDF/Excel (se puede agregar después)

## Further Notes

- El dominio completo está en `CONTEXT.md` — leerlo antes de implementar.
- El mapa de wayfinder está en `.scratch/tenis-manager/map.md` con todas las decisiones documentadas.
- El schema de DB está en `.scratch/tenis-manager/tickets/07-database-schema.md` con DDL completo.
- La app debe ser **usable en celular** como prioridad #1. Cada pantalla se diseña primero para 375px.
- El **costo estimado** es $0-25/mo (Supabase free tier + Vercel free tier).
