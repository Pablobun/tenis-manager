# Handoff — Sistema de Gestión de Clases de Tenis (Riverside)

**Fecha**: 2026-08-11
**Estado**: Tickets 01-03 COMMITEADOS (último commit `ticket3`). Tickets 04-05 implementados, SIN commitear y SIN deployar. Backend verificado localmente (auth/validaciones), build de frontend OK.
**Próxima acción**: Ticket 06 — Reasignación de Alumnos

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

## Estructura del monorepo (al día)

```
C:\GesttionSoftware\
├── .github/workflows/deploy-front.yml
├── .gitignore                 ← cubre node_modules/, .next/, out/, .env
├── AGENTS.md
├── CONTEXT.md                 ← dominio + decisiones (ver §Decisiones nuevas)
├── .opencode/
├── .scratch/tenis-manager/     ← docs, issues, spec, PRD, handoff
├── docs/
├── backend/
│   ├── server.js              ← Express API (raíz para Render). Monta auth, students, templates, instances, board
│   ├── package.json
│   ├── .env.example
│   ├── sql/schema.sql         ← 10 tablas ya ejecutadas en la BD (incluye class_templates, class_instances)
│   └── src/
│       ├── db.js
│       ├── middleware/auth.js
│       ├── services/instances.js      ← NUEVO: generación/actualización/cancelación de instancias
│       └── routes/
│           ├── auth.js
│           ├── students.js
│           ├── templates.js           ← CRUD plantillas + triggers de generación
│           ├── instances.js           ← NUEVO: GET ?month + POST /generate
│           └── board.js               ← NUEVO: GET /day + GET /week
└── frontend/
    ├── package.json / next.config.js
    ├── node_modules/          ← INSTALADO en sesión 3 (gitignored)
    └── src/app/
        ├── page.tsx / layout.tsx / globals.css / login/page.tsx
        ├── dashboard/page.tsx  ← cards: Tablero, Alumnos, Plantillas, Instancias
        ├── admin/page.tsx      ← idem
        ├── alumnos/page.tsx
        ├── mis-clases/page.tsx
        ├── plantillas/page.tsx ← NUEVO (ticket 03)
        ├── instancias/page.tsx ← NUEVO (ticket 04)
        └── tablero/page.tsx    ← NUEVO (ticket 05)
```

---

## Endpoints (todo bajo `/api`, auth por cookie/Bearer JWT)

| Método | Ruta | Rol | Descripción |
|---|---|---|---|
| POST | /auth/login, logout, register, password | varios | Auth |
| GET | /auth/me | cualquiera | Perfil propio |
| CRUD | /students | admin/profesor | Alumnos |
| CRUD | /templates | admin/profesor | Plantillas (+ genera instancias al crear/editar/activar/desactivar) |
| GET | /instances?month=YYYY-MM | admin/profesor | Instancias del mes |
| POST | /instances/generate?month=YYYY-MM | admin/profesor | Regenera un mes desde plantillas activas |
| GET | /board/day?date=YYYY-MM-DD | admin/profesor | Instancias del día + alumnos |
| GET | /board/week?date=YYYY-MM-DD | admin/profesor | 7 días de la semana + alumnos |
| GET | /health | público | Health check |

---

## Credenciales

| Credencial | Valor |
|-----------|-------|
| Admin email | `admin@tenismanager.com` |
| Admin password | `admin123` (cambiar después) |
| DB host | `137.184.178.21` (mismo que jockey) |
| DB user/password | (mismos que jockey — NO están en el repo; pedirlos al user para probar contra BD local) |
| DB name | `tenisriverside` |
| Render URL | `https://tenis-manager.onrender.com` |
| JWT_SECRET | `ts_riverside_2026_secret` (env var de Render) |
| Repo GitHub | `https://github.com/Pablobun/tenis-manager` |

---

## Qué se hizo en esta sesión

### Ticket 03 — Plantillas de Clases (commit `ticket3`)
- Backend: `routes/templates.js` (CRUD + toggle `is_active` + validación de **solapamiento** entre activas del mismo día y modalidad → 409).
- Frontend: `plantillas/page.tsx` (form con las 3 modalidades, lista con badges, Desactivar/Activar).
- Cards de acceso en dashboard/admin. Aclaración de `day_of_week` en CONTEXT.md.

### Ticket 04 — Generación de Instancias (SIN commitear)
- `services/instances.js`: genera 1 instancia por aparición del `day_of_week` en el mes (solo `fixed` activas), `INSERT IGNORE` + UNIQUE `uk_template_date`.
- Disparadores en `templates.js`: crear → genera mes; editar → in-place si no cambia el día, borra+regenera si cambia; desactivar → cancela futuras (`status='cancelled'`).
- `routes/instances.js`: `GET /api/instances?month=` + `POST /api/instances/generate?month=`.
- Frontend: `instancias/page.tsx` (calendario mensual con ◀ ▶ y botón "Generar mes").

### Ticket 05 — Vista Diaria del Tablero (SIN commitear)
- `routes/board.js`: `GET /board/day` y `GET /board/week`, enriqueciendo instancias con alumnos vía `groups → group_students → profiles`.
- Frontend: `tablero/page.tsx` (grilla por franjas, swipe + ◀ ▶, toggle Día/Semana, bottom sheet con **Ver alumnos** funcional y Agregar/Mover/Borrar deshabilitados hasta ticket 06, indicador de cupo por color).
- Login de profesor → `/tablero`. Card "Tablero" en dashboard/admin.

---

## Estado de los tickets

| # | Ticket | Estado | Notas |
|---|--------|--------|-------|
| 01 | Auth + scaffolding | **COMMITEADO** | |
| 02 | Gestión de alumnos | **COMMITEADO** | |
| 03 | Plantillas de clases | **COMMITEADO** | commit `ticket3` |
| 04 | Generación de instancias | **IMPLEMENTADO, SIN PUSH** | backend + frontend listos |
| 05 | Vista diaria del tablero | **IMPLEMENTADO, SIN PUSH** | backend + frontend listos |
| 06 | Reasignación de alumnos | pendiente | **PRÓXIMO** |
| 07 | Clases abiertas/rotativas | pendiente | |
| 08 | Dashboard del alumno | pendiente | |
| 09 | Flujo de postulaciones | pendiente | |
| 10 | Clases extras | pendiente | |
| 11 | Facturación mensual | pendiente | |
| 12 | Pagos | pendiente | |

---

## Pendiente para la próxima sesión

1. **Commit + push de tickets 04 y 05** (los hace el usuario, nunca el agente). Con el push salen a producción 03-05.
2. **Verificación contra la BD real en Render** tras el push: crear plantilla → genera instancias del mes; editar/desactivar; grilla del tablero con alumnos (aún no hay inscripciones → celdas vacías "0/cupo").
3. **Ticket 06 — Reasignación de Alumnos**: conectar las acciones del bottom sheet (`Agregar`, `Mover a...`, `Borrar`). Requiere decisiones de modelo: `groups` por instancia, endpoint de inscripción/desinscripción, mover con confirmación "Queda 4/4. ¿Mover?" y optimistic update.

---

## Decisiones nuevas registradas (CONTEXT.md)

- `day_of_week` define la **recurrencia** semanal de la plantilla; la modalidad es independiente del día. Las instancias de un mes se generan juntas.
- **Generación de instancias**: 1 por aparición del día en el mes; `frequency` es metadata (más clases = más plantillas). Solo `fixed` activas.
- **Edición de plantilla**: día cambiado → borra futuras y regenera; solo campos → in-place.
- **Desactivar plantilla**: futuras pasan a `status='cancelled'`.
- Bottom sheet del tablero: "Ver alumnos" funcional; Agregar/Mover/Borrar → ticket 06.

---

## Notas importantes

- **Nunca hacer commit/push**: es el usuario quien ejecuta git add/commit/push (regla AGENTS.md).
- El workflow de GitHub Actions usa `npm install` (NO `npm ci`, no hay package-lock en frontend).
- **Windows**: la Execution Policy bloquea `npm.ps1` → usar `npm.cmd run build` (o `npm run build` falla). Igual con backend.
- Backend local: para probar contra BD real hace falta `.env` con los credenciales de jockey (no están en el repo). Sin DB, las rutas con datos devuelven 500 (esperado); auth (401) y validaciones (400) se prueban con un JWT firmado localmente con el mismo secret.
- **Verificación local sin framework de tests**: `node --check` + arranque + curl con JWT firmado (backend); `npm.cmd run build` (frontend). Convención del proyecto: verificación manual, sin framework de tests.
- Nginx config: `root /var/www/tenis-manager;` con `try_files $uri $uri.html $uri/ /index.html;` — path `/etc/nginx/conf.d/riversideclases.conf`.
- **Next.js**: `trailingSlash: true` genera carpetas (`plantillas/index.html`).
- **Roles en BD**: `admin`, `profesor`, `alumno` (NO `professor`/`student`).
- Frontend `node_modules` fue instalado en esta sesión (gitignored, no subir).

---

## Suggested skills

- **code-review** — para revisar el diff de los tickets 04-05 (y 03) antes de pushear: estándares del repo vs. spec del ticket.
- **implement** — para arrancar el ticket 06 (Reasignación de Alumnos) siguiendo el mismo patrón de las sesiones anteriores.
- **grill-with-docs** — si antes del ticket 06 querés definir bien el modelo de `groups` (uno por instancia vs. varios), inscripción/desinscripción y mover con cupos, y dejarlo registrado en CONTEXT.md/ADRs.
- **to-spec / to-issues** — si el ticket 06 necesita desglosarse en pasos más finos.

---

## Out of scope (por ahora)

- Reportes y resumen mensual automático
- Notificaciones push/SMS
- Multi-academia
- Cobros electrónicos
- App móvil nativa
- Paginación avanzada
- Exportación a PDF/Excel
