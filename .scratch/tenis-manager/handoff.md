# Handoff — Sistema de Gestión de Clases de Tenis (Riverside)

**Fecha**: 2026-08-10
**Estado**: Ticket01 completado. Ticket02 completado. Backend verificado y funcionando.
**Próxima acción**: Ticket03 — Plantillas de clases

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
| Frontend | Next.js (React) + Tailwind + output: 'export' + trailingSlash | Droplet DigitalOcean (`/var/www/tenis-manager/`) |
| Backend | Node.js + Express (plain JS) + mysql2 + JWT | Render (`tenis-manager.onrender.com`) |
| DB | MySQL (`tenisriverside`) | Droplet DigitalOcean |
| Auth | JWT + bcrypt, cookie httpOnly, roles en payload | Backend |
| Deploy Front | GitHub Actions → SSH + rsync | Automático en push a main |
| Deploy Back | Render (conectado al repo) | Automático en push a main |
| Nginx | `riversideclases.conf` en `/etc/nginx/conf.d/` | SSL via certbot |

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
│   ├── .env.example
│   ├── src/
│   │   ├── db.js               ← pool mysql2
│   │   ├── middleware/auth.js  ← JWT + authorize
│   │   └── routes/
│   │       ├── auth.js         ← login, register, logout, me, password
│   │       └── students.js     ← CRUD alumnos (list, get, create, update, profile)
│   └── sql/
│       ├── schema.sql          ← DDL MySQL (10 tablas, sin RLS)
│       └── seed-admin.sql      ← INSERT admin inicial
└── frontend/
    ├── package.json
    ├── next.config.js          ← output: 'export' + trailingSlash: true
    ├── tailwind.config.js
    └── src/app/
        ├── layout.tsx
        ├── page.tsx            ← redirect por rol
        ├── globals.css
        ├── login/page.tsx      ← login funcional
        ├── dashboard/page.tsx  ← panel profesor (con card Alumnos)
        ├── admin/page.tsx      ← panel admin (con card Alumnos)
        ├── alumnos/page.tsx    ← CRUD alumnos (lista, crear, editar)
        └── mis-clases/page.tsx ← vista alumno (ver/editar perfil)
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
| Render env vars | `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_DATABASE=tenisriverside`, `JWT_SECRET=ts_riverside_2026_secret`, `PORT=10000` |
| Dominio front | `https://riversideclases.portaltorneos-riocuarto.com.ar` |
| Repo GitHub | `https://github.com/Pablobun/tenis-manager` |

---

## Qué se hizo en esta sesión

### Sesión 1 — Scaffolding
1. **Planificación** — Cambio de stack: Supabase → Express + MySQL + JWT
2. **Ticket01 implementado** — Scaffolding completo (backend + frontend + workflow)
3. **Schema MySQL** — Adaptado desde Postgres (sin RLS, ENUM types, BIGINT IDs)
4. **Frontend** — Next.js estático con 4 pantallas (login, dashboard, admin, mis-clases)
5. **Backend** — Express + JWT + middleware por rol + 5 endpoints auth
6. **GitHub Actions** — Workflow deploy-front.yml funcional (npm install + rsync)
7. **Deploy** — Frontend llegando al droplet vía GitHub Actions

### Sesión 2 — Verificación + Ticket02
1. **BD verificada** — Schema ejecutado en SQLyog, admin seed correcto
2. **Backend verificado** — JWT_SECRET configurado en Render, login funcionando
3. **Ticket02 implementado** — CRUD de alumnos completo:
   - Backend: `routes/students.js` con 5 endpoints (list, get, create, update, profile)
   - Frontend: `/alumnos` con lista, formulario crear/editar
   - Frontend: `/mis-clases` con perfil editable por el alumno
   - Navegación: cards en admin y dashboard para acceder a Alumnos
4. **Fix de roles** — Login corregido: `profesor`/`alumno` (antes decía `professor`/`student`)
5. **Fix de Nginx** — `try_files` actualizado para soportar archivos `.html` planos de Next.js
6. **Fix de deploy** — Agregado `trailingSlash: true` para generar carpetas en vez de archivos planos

---

## Estado de los tickets

| # | Ticket | Estado | Notas |
|---|--------|--------|-------|
| 01 | Auth + scaffolding | **COMPLETADO** | Login, JWT, roles, middleware, deploy |
| 02 | Gestión de alumnos | **COMPLETADO** | CRUD completo, perfil alumno, navegación |
| 03 | Plantillas de clases | pendiente | Próximo |
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

1. **Ticket03** — Plantillas de clases (CRUD de clases recurrentes: día, hora, nivel, modalidad, precio)
2. Continuar con tickets 04-12 según prioridad

---

## Notas importantes

- El workflow de GitHub Actions funciona con `known_hosts: unnecessary` (no `just-a-placeholder`)
- El `npm ci` no funciona sin `package-lock.json` — usar `npm install` en el workflow
- La public key SSH debe estar en `~/.ssh/authorized_keys` del droplet
- El backend en Render usa Root Directory = `backend`
- **Nginx config**: `root /var/www/tenis-manager;` con `try_files $uri $uri.html $uri/ /index.html;`
- **Nginx path**: `/etc/nginx/conf.d/riversideclases.conf` (NO `sites-enabled/`)
- **Next.js**: `trailingSlash: true` genera `alumnos/index.html` en vez de `alumnos.html`
- **Roles en BD**: `admin`, `profesor`, `alumno` (NO `professor`, `student`)
- **JWT_SECRET en Render**: `ts_riverside_2026_secret`
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
