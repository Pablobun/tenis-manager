# Handoff — Sistema de Gestión de Clases de Tenis (Riverside)

**Fecha**: 2026-08-13
**Estado**: Tickets 01-12 IMPLEMENTADOS (08-12 en esta sesión) y PUSHEADOS hasta `b086981` (ticket 07). El diff 08-12 **no está pusheado aún** — verificar en Render tras el push del usuario. Verificado localmente: `node --check` backend OK (13 archivos), `npm.cmd run build` frontend OK (15 páginas).
**Próxima acción**: Verificación del diff 08-12 en Render (BD real) + ajustes. Sin tickets pendientes conocidos.

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
├── CONTEXT.md                 ← glosario + decisiones (incluye tickets 07-12: clases abiertas, postulaciones, extras, facturación, pagos)
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
│       ├── services/billing.js        ← deuda inmediata al inscribir (ticket 11)
│       └── routes/
│           ├── auth.js
│           ├── students.js
│           ├── templates.js           ← CRUD + validación + disparadores
│           ├── instances.js           ← ?month, /generate, CRUD abiertas/extra (/open) + postulate + candidatos + decide + cancel
│           ├── board.js               ← /day, /week, /mine (clases del alumno), enroll (POST/DELETE)
│           ├── asistencias.js         ← GET/POST asistencia por instancia + genera deuda abierta/extra (ticket 10)
│           ├── billing.js             ← /preview, /generate, /debtors, /open, /release-slots, /adjust (ticket 11)
│           └── pagos.js               ← individual, /batch, /student/:id (desglose), /summary (ticket 12)
└── frontend/
    ├── package.json / next.config.js  (output: 'export' + trailingSlash)
    └── src/app/
        ├── page.tsx / layout.tsx / globals.css / login/page.tsx
        ├── dashboard/page.tsx · admin/page.tsx  ← cards: Tablero, Plantillas, Instancias, Clases Abiertas, Alumnos, Facturación, Pagos
        ├── alumnos/page.tsx · mis-clases/page.tsx  ← mis-clases: saldo + desglose deuda + "Mis clases" + "Clases Disponibles" con Postularme/Cancelar
        ├── plantillas/page.tsx · instancias/page.tsx · tablero/page.tsx
        ├── clases-abiertas/page.tsx   ← CRUD abiertas/extra + candidatos (aceptar/rechazar/forzar) + asistencia
        ├── facturacion/page.tsx       ← NUEVO (ticket 11): preview, generar deudas, apertura de mes, liberar cupos
        └── pagos/page.tsx             ← NUEVO (ticket 12): pago individual y por lote, resumen global
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
| GET | /instances/open | admin/profesor/alumno | Clases abiertas+extras (alumno: solo programadas futuras + su postulation_status) |
| POST | /instances/open | admin/profesor | Crea clase abierta/extra ad-hoc (modalidad en body) |
| PUT/DELETE | /instances/open/:id | admin/profesor | Edita / elimina (cascada por plantilla) |
| POST | /instances/open/:id/postulate | alumno | Postula (chequea deuda; si lleno → lista_espera; `force` para override) |
| DELETE | /instances/open/:id/postulate | alumno | Cancela postulación pendiente |
| GET | /instances/open/:id/candidates | admin/profesor | Candidatos + balance deuda |
| POST | /instances/open/:id/candidates/:pid/accept | admin/profesor | Acepta → ocupa cupo en grupo (si lleno → waitlist) |
| POST | /instances/open/:id/candidates/:pid/reject | admin/profesor | Rechaza → lista_espera |
| POST | /instances/open/:id/candidates/:pid/override | admin/profesor | Fuerza aceptación (deuda/cupo) |
| GET | /board/day?date= / /board/week?date= | admin/profesor | Instancias del día/semana + alumnos |
| GET | /board/mine | alumno | Mis clases (fijas+abiertas) + saldo de deuda (ticket 08) |
| POST/DELETE | /board/enroll | admin/profesor | Inscribir / desinscribir (fija genera deuda de mensualidad) |
| GET/POST | /asistencias/:instanceId | admin/profesor | Ver / registrar asistencia (+ deuda abierta/extra si asistió) |
| GET | /billing/preview?month= / /debtors?month= | admin/profesor | Deuda propuesta / deudores del mes |
| POST | /billing/generate?month= / /open / /release-slots | admin/profesor | Generar deudas, apertura de mes, liberar cupos |
| PUT | /billing/adjust/:deudaId | admin/profesor | Ajustar monto de una deuda |
| POST | /pagos / /pagos/batch | admin/profesor | Pago individual / por lote |
| GET | /pagos/student/:id | admin/profesor/alumno(propio) | Desglose de deuda + historial |
| GET | /pagos/summary?date= | admin/profesor | Resumen global de pagos por fecha |
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

### Ticket 08 — Dashboard del Alumno (NO PUSHEADO aún)
- Backend: `GET /board/mine` (rol alumno) — clases vía `grupo_alumnos → grupos → instancias_clases` + saldo `SUM(monto - monto_pagado)` deudas pendiente/parcial.
- Frontend `/mis-clases`: saldo de deuda arriba (rojo/verde) + sección "Mis clases" (día, hora, nivel, modalidad, profesor).

### Ticket 09 — Flujo de Postulaciones (NO PUSHEADO aún)
- Backend en `routes/instances.js`: `GET /open/:id/candidates` (incluye balance deuda), `POST .../accept` (inscribe al grupo, transaction), `.../reject` (→ lista_espera), `.../override` (fuerza), `DELETE /open/:id/postulate` (alumno cancela). Postular ahora chequea **deuda** (bloquea si no hay `force`) y cupo lleno → `lista_espera` directo. Re-postulación tras cancelada/rechazada re-activa la misma fila.
- Frontend `/clases-abiertas`: botón "Candidatos" por clase → listado con badges de estado, botones Aceptar/Rechazar/Forzar y el balance de deuda del postulante. `/mis-clases`: badge "Postulado (Pendiente)" con botón **Cancelar**; badge diferenciado "Lista de espera".

### Ticket 10 — Clases Extras (NO PUSHEADO aún)
- Backend: `POST /open` acepta `modalidad: 'abierta'|'extra'` (plantilla inactiva + grupo "Grupo Extra"). `GET /open` incluye `extra`. Nuevo `routes/asistencias.js`: `GET/POST /asistencias/:instanceId`; al marcar "asistió" en abierta/extra crea deuda `clase_abierta`/`clase_extra` pendiente.
- Frontend `/clases-abiertas`: select de modalidad (sugerencia precio 50% en extra), botón "Asistencia" por clase con checkboxes asistió/no y guardado.

### Ticket 11 — Facturación Mensual (NO PUSHEADO aún)
- Backend: `services/billing.js` (`ensureDebtForEnrollment` — al inscribir a fija genera deuda de mensualidad inmediata, conectado en `/board/enroll`); `routes/billing.js`: `GET /preview` (no escribe), `POST /generate` (crea deudas por alumno/mes + `ciclos_facturacion`), `GET /debtors`, `POST /open` (cierra ciclos anteriores), `POST /release-slots`, `PUT /adjust/:id`.
- Frontend: `/facturacion` — picker de mes, preview de deuda propuesta (estado Generada/Pendiente), botones "Generar deudas" y "Abrir mes", tabla de deudores con "Liberar cupos".

### Ticket 12 — Pagos (NO PUSHEADO aún)
- Backend: `routes/pagos.js` — `POST /` individual (aplica a deuda pendiente más antigua o `deuda_id`), `POST /batch` (lote), `GET /student/:id` (desglose por mes + historial; accesible por el propio alumno), `GET /summary` (por fecha). Pago suma `monto_pagado` y recalcula estado pendiente/parcial/pagada.
- Frontend: `/pagos` (pago individual + lote con checkboxes + resumen global por fecha). `/mis-clases`: desglose de deuda expandible por mes + historial de pagos.

### Docs de agentes (esta sesión)
- `AGENTS.md:9` y `docs/agents/issue-tracker.md` actualizados: el repo está en GitHub (`Pablobun/tenis-manager`) pero los issues/tickets **siguen en markdown local** (`.scratch/tenis-manager/issues/`). No usar GitHub Issues hasta decisión explícita; para migrar hará falta `gh` CLI (hoy no instalada).

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
| 07 | Clases abiertas/rotativas | **COMPLETADO** | commit `b086981` |
| 08 | Dashboard del alumno | **COMPLETADO** | diff 08-12 sin pushear |
| 09 | Flujo de postulaciones | **COMPLETADO** | diff 08-12 sin pushear |
| 10 | Clases extras | **COMPLETADO** | diff 08-12 sin pushear |
| 11 | Facturación mensual | **COMPLETADO** | diff 08-12 sin pushear |
| 12 | Pagos | **COMPLETADO** | diff 08-12 sin pushear |

---

## Pendiente para la próxima sesión

1. **Verificar el diff 08-12 contra la BD real en Render** (tras el push del usuario):
   - Ticket 08: alumno entra a `/mis-clases` → ve saldo + "Mis clases" (fijas asignadas y abiertas aceptadas).
   - Ticket 09: alumno se postula a abierta → profe ve el candidato en "Candidatos" de `/clases-abiertas`, la acepta → aparece en "Mis clases" del alumno. Probar reject (waitlist), override, cancelar postulación, y postular con deuda (debe bloquear).
   - Ticket 10: crear clase extra (50%), alumno se postula, profe marca asistencia → se genera deuda `clase_extra`.
   - Ticket 11: `/facturacion` → preview del mes, generar deudas, abrir mes, liberar cupos de un deudor.
   - Ticket 12: `/pagos` → pago individual, pago por lote, desglose y resumen por fecha.
   - Si algo falla, chequear caché del navegador (hard refresh) antes de diagnosticar.
2. **Decisiones con el cliente pendientes (marcadas en CONTEXT.md)**:
   - Confirmar que la deuda siga bloqueando la postulación (override es la excepción).
   - Definir el precio de la clase extra (50% sugerido) cuando haya clases fijas reales creadas.
   - Confirmar que liberar cupos borra al deudor de las instancias fijas del mes (comportamiento actual).

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

- **code-review** — revisar el diff 08-12 (tickets 08-12) antes del push.
- **grill-with-docs** — si antes de seguir hay que cerrar las decisiones pendientes de facturación/pagos (liberar cupos, precio extra, deuda bloqueante).
- **wizard / to-questionnaire** — para confirmar las decisiones pendientes con el cliente.

---

## Out of scope (por ahora)

- Reportes y resumen mensual automático
- Notificaciones push/SMS
- Multi-academia
- Cobros electrónicos
- App móvil nativa
- Paginación avanzada
- Exportación a PDF/Excel
- **Visitantes** como rol propio (hoy usan cuenta `alumno`)