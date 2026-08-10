# Handoff — Sistema de Gestión de Clases de Tenis (Riverside)

**Fecha**: 2026-08-10
**Estado**: Ticket01 completado. Frontend deployado. Backend pendiente de verificar.
**Próxima acción**: Verificar backend en Render + ejecutar schema SQL en SQLyog

---

## Qué es este proyecto

Web app responsive (mobile-first) para una profesora de tenis que administra clases, inscripciones y deudas.

**Usuarios**: profesora(s), alumnos, admin
**Plataforma**: web responsive, la mayoría usa celular
**Dominio**: `riversideclases.portaltorneos-riocuarto.com.ar`

---

## Stack actualizado

| Capa | Tecnología | Dónde corre |
|------|-----------|-------------|
| Frontend | Next.js (React) + Tailwind + output: 'export' | Droplet DigitalOcean (`/var/www/tenis-manager/`) |
| Backend | Node.js + Express (plain JS) + mysql2 + JWT | Render (`tenis-manager.onrender.com`) |
| DB | MySQL (`tenisriverside`) | Droplet DigitalOcean |
| Auth | JWT + bcrypt, cookie httpOnly, roles en payload | Backend |
| Deploy Front | GitHub Actions → SSH + rsync | Automático en push a main |
| Deploy Back | Render (conectado al repo) | Automático en push a main |
| Nginx | `riversideclases.conf` en el droplet | SSL via certbot |

---

## Arquitectura de deploy

```
GitHub (repo: Pablobun/tenis-manager)
  ├─ push a main ──► GitHub Actions → rsync frontend/out/ → droplet /var/www/tenis-manager/
  └─ push a main ──► Render → npm install + node server.js → tenis-manager.onrender.com
```

**Mismo patrón que `torneos-jc`**: git push → deploy automático. Front en droplet, back en Render.

---

## Estructura del monorepo

```
C:\GesttionSoftware\
├── .github/workflows/deploy-front.yml
├── .gitignore
├── AGENTS.md
├── CONTEXT.md
├── .opencode/
├── .scratch/tenis-manager/     ← docs, issues, spec, PRD
├── docs/
├── backend/
│   ├── server.js               ← Express API (raíz para Render)
│   ├── package.json
│   ├── src/
│   │   ├── db.js               ← pool mysql2
│   │   ├── middleware/auth.js  ← JWT + authorize
│   │   └── routes/auth.js     ← login, register, logout, me, password
│   └── sql/
│       ├── schema.sql          ← DDL MySQL (10 tablas, sin RLS)
│       └── seed-admin.sql      ← INSERT admin inicial
└── frontend/
    ├── package.json
    ├── next.config.js          ← output: 'export'
    ├── tailwind.config.js
    └── src/app/
        ├── layout.tsx
        ├── page.tsx            ← redirect
        ├── globals.css
        ├── login/page.tsx      ← login funcional
        ├── dashboard/page.tsx  ← panel profesor
        ├── admin/page.tsx      ← panel admin
        └── mis-clases/page.tsx ← vista alumno
```

---

## Credenciales

| Credencial | Valor |
|-----------|-------|
| Admin email | `admin@tenismanager.com` |
| Admin password | `admin123` (cambiar después) |
| DB host | `137.184.178.21` (mismo que jockey) |
| DB user | (mismos que jockey) |
| DB password | (mismos que jockey) |
| DB name | `tenisriverside` |
| Render URL | `https://tenis-manager.onrender.com` |
| Dominio front | `https://riversideclases.portaltorneos-riocuarto.com.ar` |
| Repo GitHub | `https://github.com/Pablobun/tenis-manager` |

---

## Qué se hizo en esta sesión

1. **Planificación** — Cambio de stack: Supabase → Express + MySQL + JWT
2. **Ticket01 implementado** — Scaffolding completo (backend + frontend + workflow)
3. **Schema MySQL** — Adaptado desde Postgres (sin RLS, ENUM types, BIGINT IDs)
4. **Frontend** — Next.js estático con 4 pantallas (login, dashboard, admin, mis-clases)
5. **Backend** — Express + JWT + middleware por rol + 5 endpoints auth
6. **GitHub Actions** — Workflow deploy-front.yml funcional (npm install + rsync)
7. **Deploy** — Frontend llegando al droplet vía GitHub Actions

---

## Estado de los tickets

| # | Ticket | Estado | Notas |
|---|--------|--------|-------|
| 01 | Auth + scaffolding | **EN PROGRESO** | Front deployado, back en Render pendiente verificar |
| 02 | Gestión de alumnos | pendiente | |
| 03 | Plantillas de clases | pendiente | |
| 04 | Generación de instancias | pendiente | |
| 05 | Vista diaria del tablero | pendiente | |
| 06 | Reasignación de alumnos | pendiente | |
| 07 | Clases abiertas/rotativas | pendiente | |
| 08 | Dashboard del alumno | pendiente | |
| 09 | Flujo de postulaciones | pendiente | |
| 10 | Clases extras | pendiente | |
| 11 | Facturación mensual | pendiente | |
| 12 | Pagos | pendiente | |

---

## Pendiente para la próxima sesión

1. **Ejecutar schema SQL** — Abrir SQLyog → conectarse al droplet → base `tenisriverside` → ejecutar `backend/sql/schema.sql`
2. **Ejecutar seed admin** — Ejecutar `backend/sql/seed-admin.sql`
3. **Verificar backend** — Probar `https://tenis-manager.onrender.com/api/health`
4. **Probar login** — Abrir `https://riversideclases.portaltorneos-riocuarto.com.ar/login` → `admin@tenismanager.com` / `admin123`
5. **Verificar Render env vars** — Confirmar que `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_DATABASE=tenisriverside`, `JWT_SECRET`, `PORT` estén en Render
6. **Continuar con ticket02** — Gestión de alumnos (CRUD perfiles, nivel, teléfono)

---

## Notas importantes

- El workflow de GitHub Actions funciona con `known_hosts: unnecessary` (no `just-a-placeholder`)
- El `npm ci` no funciona sin `package-lock.json` — usar `npm install` en el workflow
- La public key SSH debe estar en `~/.ssh/authorized_keys` del droplet
- El backend en Render usa Root Directory = `backend`
- Nginx config: `root /var/www/tenis-manager;` con `try_files $uri $uri/ /index.html;`
- El dominio del front es `riversideclases.portaltorneos-riocuarto.com.ar`
- El dominio del back es `tenis-manager.onrender.com`

---

## Out of scope (por ahora)

- Reportes y resumen mensual automático
- Notificaciones push/SMS
- Multi-academia
- Cobros electrónicos
- App móvil nativa
- Paginación avanzada
- Exportación a PDF/Excel
