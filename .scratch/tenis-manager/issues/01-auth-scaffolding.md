# 01 — Auth + Scaffolding

**What to build:** Proyecto Next.js con App Router, Supabase configurado (Auth + DB), login con email+password, middleware que verifica roles (admin/professor/student), routing por rol (professor → /dashboard, student → /mis-clases), y esquema base de shadcn/ui + Tailwind mobile-first.

**Blocked by:** Ninguno — puede empezar inmediatamente.

**Status:** pending

- [ ] Proyecto Next.js creado con App Router y TypeScript
- [ ] Supabase project configurado (local con supabase CLI o cloud)
- [ ] Tablas creadas según schema (profiles, class_templates, class_instances, groups, group_students, applications, attendance, debts, payments, billing_cycles)
- [ ] RLS policies aplicadas para 3 roles
- [ ] shadcn/ui + Tailwind configurado (mobile-first)
- [ ] Login con email+password funcional
- [ ] Middleware de Next.js que redirige según rol
- [ ] Perfiles vinculados a auth.users (trigger on signup)
- [ ] Test: login exitoso redirige a la ruta correcta según rol
