# Handoff — Sistema de Gestión de Clases de Tenis (Riverside)

**Fecha**: 2026-08-12
**Estado**: Tickets 01-07 IMPLEMENTADOS y PUSHEADOS (último commit `b086981 ticket7`, origin al día). Verificado localmente: `node --check` backend OK, `npm.cmd run build` frontend OK (13 páginas).
**Próxima acción**: Ticket 08 — Dashboard del Alumno (`dashboard-alumno`): "Mis clases" + "Clases disponibles" + saldo de deuda.

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
| DB | MySQL (`tenisriverside`) — tablas/columnas/ENUM en **español** | Droplet DigitalOcean |
| Auth | JWT + bcrypt, cookie httpOnly, roles en payload | Backend |
| Deploy Front | GitHub Actions → SSH + rsync | Automático en push a main |
| Deploy Back | Render (conectado al repo) | Automático en push a main |
| Nginx | `riversideclases.conf` en `/etc/nginx/conf.d/` (versionado en `deploy/nginx-riversideclases.conf`) | SSL via certbot + proxy `/api/` → Render |

---

## Arquitectura de deploy

```
GitHub (repo: Pablobun/tenis-manager)
  ├─ push a main ──► GitHub Actions → rsync frontend/out/ → droplet /var/www/tenis-manager/
  │                                    └─ instala nginx conf + reload (proxy /api/)
  └─ push a main ──► Render → npm install + node server.js → tenis-manager.onrender.com
                        ▲
                        └─ nginx del droplet proxea /api/* → tenis-manager.onrender.com (mismo origen)
```

**Mismo patrón que `torneos-jc`**: git push → deploy automático. Front en droplet, back en Render.

---

## Estructura del monorepo (al día)

```
C:\GesttionSoftware\
├── .github/workflows/deploy-front.yml
├── .gitignore                 ← cubre node_modules/, .next/, out/, .env
├── AGENTS.md                  ← incluye convención de esquema en español + caché del navegador
├── CONTEXT.md                 ← glosario + decisiones (incluye ticket 07: clases abiertas, postulaciones)
├── .opencode/
├── .scratch/tenis-manager/     ← docs, issues, spec, PRD, handoff
├── docs/
├── deploy/nginx-riversideclases.conf
├── backend/
│   ├── server.js              ← Express API (raíz para Render)
│   ├── package.json, .env.example
│   ├── sql/schema.sql         ← 10 tablas en castellano (perfiles, plantillas_clases, instancias_clases, grupos, grupo_alumnos, postulaciones, asistencias, deudas, pagos, ciclos_facturacion)
│   ├── sql/seed-admin.js      ← seed admin@tenismanager.com / admin123
│   └── src/
│       ├── db.js
│       ├── middleware/auth.js
│       ├── services/instances.js      ← generación mensual desde plantillas fija activas
│       └── routes/
│           ├── auth.js
│           ├── students.js
│           ├── templates.js           ← CRUD + validación + disparadores
│           ├── instances.js           ← ?month, /generate, + CRUD de clases abiertas (/open) + postulate
│           └── board.js               ← /day, /week, enroll (POST/DELETE)
└── frontend/
    ├── package.json / next.config.js  (output: 'export' + trailingSlash)
    └── src/app/
        ├── page.tsx / layout.tsx / globals.css / login/page.tsx
        ├── dashboard/page.tsx · admin/page.tsx  ← cards: Tablero, Plantillas, Instancias, Clases Abiertas, Alumnos
        ├── alumnos/page.tsx · mis-clases/page.tsx  ← mis-clases incluye "Clases Disponibles" con Postularme
        ├── plantillas/page.tsx · instancias/page.tsx · tablero/page.tsx
        └── clases-abiertas/page.tsx   ← NUEVO (ticket 07): CRUD de clases abiertas
```

---

## Endpoints (todo bajo `/api`, auth por cookie/Bearer JWT)

| Método | Ruta | Rol | Descripción |
|---|---|---|---|
| POST | /auth/login, logout, password | varios | Auth |
| GET | /auth/me | cualquiera | Perfil propio |
| CRUD | /students | admin/profesor | Alumnos |
| CRUD | /templates | admin/profesor | Plantillas (+ genera/cancela instancias) |
| GET | /instances?month=YYYY-MM | admin/profesor | Instancias del mes |
| POST | /instances/generate?month=YYYY-MM | admin/profesor | Regenera un mes desde plantillas activas |
| GET | /instances/open | admin/profesor/alumno | Clases abiertas (alumno: solo programadas futuras + su postulation_status) |
| POST | /instances/open | admin/profesor | Crea clase abierta ad-hoc (plantilla inactiva de respaldo + grupo) |
| PUT/DELETE | /instances/open/:id | admin/profesor | Edita / elimina clase abierta (cascada por plantilla) |
| POST | /instances/open/:id/postulate | alumno | Postula a clase abierta (estado `pendiente`) |
| GET | /board/day?date= / /board/week?date= | admin/profesor | Instancias del día/semana + alumnos |
| POST/DELETE | /board/enroll | admin/profesor | Inscribir / desinscribir alumno a una instancia |
| GET | /health | público | Health check |

---

## Credenciales

| Credencial | Valor |
|-----------|-------|
| Admin seed | `admin@tenismanager.com` / `admin123` |
| Superusuario Pablo | `pablo@tenismanager.com` / `1414` (insertado manual vía SQL con hash bcrypt) |
| DB host | `137.184.178.21` (mismo que jockey) |
| DB user/password | (mismos que jockey — NO están en el repo; pedirlos al user para probar contra BD local) |
| DB name | `tenisriverside` |
| Render URL | `https://tenis-manager.onrender.com` |
| JWT_SECRET | `ts_riverside_2026_secret` (env var de Render) |
| Repo GitHub | `https://github.com/Pablobun/tenis-manager` |

---

## Qué se hizo en esta sesión

### Re-implementación de Tickets 01-06 (tras borrado del repo)
- **01 Auth + scaffolding**: Express + JWT cookie httpOnly, roles `admin`/`profesor`/`alumno`, login/logout/me/register.
- **02 Gestión de alumnos**: CRUD `/students` + perfil editable en `/mis-clases`.
- **03 Plantillas**: CRUD `/templates` + validación de solapamiento (409) + triggers de generación.
- **04 Instancias**: `services/instances.js` (1 instancia por aparición del día, `INSERT IGNORE` + UNIQUE `uk_plantilla_fecha`), `/instances` con calendario mensual + "Generar mes".
- **05 Tablero**: `/board/dia` y `/semana` enriqueciendo con alumnos; `tablero/page.tsx` con swipe, toggle día/semana, bottom sheet, indicador de cupo por color.
- **06 Reasignación**: enroll/remove (`POST/DELETE /board/enroll`), "Agregar alumno"/"Quitar" funcionales en el sheet.

### Fix "Data truncated for column 'modalidad'"
- **Causa**: el frontend mandaba `fixed`/`open` (inglés) pero la BD usa ENUM en español (`fija`/`extra`/`abierta`). MySQL rechaaza valores inválidos.
- **Fix**: valores del form y mapas de display a `fija`/`abierta`/`extra` en `plantillas`, `tablero`, `instancias`; validación backend en `templates.js` (400 claro si modalidad/día/horas inválidos).
- **Lección**: el bundle viejo cacheado en el navegador confundió el diagnóstico; tras deploy usar hard refresh. Ver AGENTS.md.

### Ticket 07 — Clases Abiertas/Rotativas (commit `b086981 ticket7`)
- Backend en `routes/instances.js`: `GET/POST/PUT/DELETE /open` + `POST /open/:id/postulate`. Clase abierta = instancia ad-hoc con plantilla **inactiva** de respaldo (por `plantilla_id NOT NULL`) + grupo "Grupo Abierto", en transacción.
- Frontend: `/clases-abiertas` (CRUD profe, contador `enrolled_count`) + sección "Clases Disponibles" en `/mis-clases` (botón Postularme + badges Pendiente/Inscripto/Lleno).
- Cards en `dashboard` y `admin`.

---

## Estado de los tickets

| # | Ticket | Estado | Notas |
|---|--------|--------|-------|
| 01 | Auth + scaffolding | **COMPLETADO** | |
| 02 | Gestión de alumnos | **COMPLETADO** | |
| 03 | Plantillas de clases | **COMPLETADO** | |
| 04 | Generación de instancias | **COMPLETADO** | |
| 05 | Vista diaria del tablero | **COMPLETADO** | |
| 06 | Reasignación de alumnos | **COMPLETADO** | |
| 07 | Clases abiertas/rotativas | **COMPLETADO** | commit `b086981` (bloqueante de 09) |
| 08 | Dashboard del alumno | pendiente | **PRÓXIMO** |
| 09 | Flujo de postulaciones | pendiente | aceptar/rechazar/waitlist/override |
| 10 | Clases extras | pendiente | |
| 11 | Facturación mensual | pendiente | |
| 12 | Pagos | pendiente | |

---

## Pendiente para la próxima sesión

1. **Verificación del ticket 07 contra la BD real en Render** (post-push, usuario ya pusheó `b086981`):
   - Crear clase abierta desde `/clases-abiertas` → aparece en tablero y en "Clases disponibles" de un alumno.
   - Alumno toca "Postularme" → aparece `pendiente` en `postulaciones` (verificar vía SQLyog).
   - Editar/eliminar clase abierta.
   - Si algo falla, chequear caché del navegador (hard refresh) antes de diagnosticar.
2. **Ticket 08 — Dashboard del Alumno**: mis-clases ya muestra "Clases disponibles"; falta "Mis clases" del alumno (fijas asignadas + abiertas aceptadas) y **saldo de deuda** arriba. Reusar `/board` y consultas a `grupos → grupo_alumnos` para las clases del alumno. Leer `.scratch/tenis-manager/issues/08-dashboard-alumno.md`.

---

## Notas importantes

- **Nunca hacer commit/push**: es el usuario quien ejecuta git add/commit/push (regla AGENTS.md).
- **Esquema en español**: tablas/columnas/ENUM en castellano (`fija`/`extra`/`abierta`, `programada`/`completada`/`cancelada`, `pendiente`/`aceptada`/`rechazada`/`lista_espera`). Nunca mandar `fixed`/`open`. El backend mapea columnas españolas → claves JSON en inglés. `instancias_clases.plantilla_id` es NOT NULL.
- **Windows**: la Execution Policy bloquea `npm.ps1` → usar `npm.cmd run build` en frontend y `npm.cmd install` en backend.
- **Verificación local sin tests**: `node --check` por archivo (backend) + `npm.cmd run build` (frontend). Flujos contra BD real se prueban en Render tras push.
- Sin `.env` local no hay conexión a BD (500 esperado); auth (401) y validaciones (400) se prueban con JWT firmado localmente (`node -e "console.log(require('jsonwebtoken').sign({id:1,rol:'admin'},'ts_riverside_2026_secret'))"` en `backend/`).
- **Caché tras deploy**: verificar con hard refresh (Ctrl+F5) o incógnito.
- Nginx: `root /var/www/tenis-manager;` + `location /api/` → Render. Path `/etc/nginx/conf.d/riversideclases.conf`, versionado en `deploy/nginx-riversideclases.conf`.
- **Next.js**: `trailingSlash: true` genera carpetas (`clases-abiertas/index.html`).
- Roles en BD: `admin`, `profesor`, `alumno`.

---

## Suggested skills

- **implement** — para el ticket 08 (Dashboard del Alumno), siguiendo el patrón de tickets anteriores.
- **grill-with-docs** — si antes del ticket 08 hay que decidir el modelo de deuda/saldo que verá el alumno (tickets 11-12 lo tocan).
- **code-review** — revisar el diff de los tickets 06-07 antes de seguir.

---

## Out of scope (por ahora)

- Reportes y resumen mensual automático
- Notificaciones push/SMS
- Multi-academia
- Cobros electrónicos
- App móvil nativa
- Paginación avanzada
- Exportación a PDF/Excel