## Destination

Web app responsive para profesora de tenis que administra clases fijas (con plantillas + instancias automáticas del mes), clases abiertas/rotativas (con postulación de candidatos y cupo), clases extras (50% precio, para fijos y visitantes), alumnos con niveles, y deudas/pagos con historial. Multi-profesora (comparten todo). Los alumnos tienen login propio y pueden postularse a clases abiertas.

## Notes

- Dominio en `CONTEXT.md` — leerlo antes de cada sesión.
- Plataforma: web responsive, mobile-first. La mayoría usa celular.
- 3 roles: admin, profesora, alumno.
- Tarifas: fijas por mes (precio × clases del mes), abiertas/extras por asistencia.
- La profe define precio al crear la clase. El sistema genera instancias del mes.
- Deuda bloquea postulación (con excepción manual de la profe).
- Reserva condicionada al pago (con excepción manual).
- Multi-profesora: comparten todo, no se restringe visibilidad.

## Decisions so far

- [01-tech-stack](./research/01-tech-stack.md) — **Next.js + Supabase + Vercel**. Frontend: Next.js (React 19) con shadcn/ui. Backend: Supabase (PostgreSQL + Auth + Realtime + Edge Functions). Hosting: Vercel + Supabase. Auth: Supabase Auth. Costo estimado: $0-25/mo. RLS para control de acceso a nivel DB.
- [06-auth-approach](./research/06-auth-approach.md) — **Supabase Auth con roles en app_metadata**. Admin crea usuarios via inviteByEmail. Email+password como login principal. Magic Link como fallback. @supabase/ssr para integración con Next.js App Router. RLS + JWT para control de acceso por rol.
- [02-professor-dashboard](./tickets/02-professor-dashboard.md) — **Vista diaria por defecto** (swipe entre días) + **toggle semanal**. Navegación por mes con barra + picker. **Bottom sheet** por tap (ver alumnos, agregar, mover, borrar). Indicador: nombres + nivel + cupo. Reasignación por **tap + menú "Mover a..."**.
- [03-student-self-service](./tickets/03-student-self-service.md) — **Mis clases** como pantalla principal. Postulación desde "Clases disponibles" en dashboard. Deuda: saldo + desglose. Cancelar postulación pendiente. Editar: solo nombre y teléfono.
- [04-debt-model](./tickets/04-debt-model.md) — **Deuda semi-automática**: sistema calcula, profe aprueba. Inscripción a mitad de mes genera deuda al momento. Pagos individual + por lote, monto personalizado. Resumen global por fecha. Profe tiene control total de excepciones.
- [05-drag-drop](./tickets/05-drag-drop.md) — **Tap + menú "Mover a..."**: lista de todos los grupos del día con nivel y cupo. Aviso de confirmación si destino queda completo.
- [07-database-schema](./tickets/07-database-schema.md) — **Schema PostgreSQL completo**: profiles, class_templates, class_instances, groups, group_students, applications, attendance, debts, payments, billing_cycles. RLS para 3 roles. Ver ticket para DDL completo.

## Not yet specified

<!-- se llena a medida que se avance; por ahora todo está en tickets -->

## Out of scope

- Reportes y resumen mensual (se ve después)
- Notificaciones push/SMS (la comunicación es por WhatsApp externo)
- Multi-academia (por ahora es 1 sola escuela)
- Cobros electrónicos (la profe cobra en persona)
- App móvil nativa (es web responsive)
