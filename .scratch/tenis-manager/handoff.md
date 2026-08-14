# Handoff — Sistema de Gestión de Clases de Tenis (Riverside)

**Fecha**: 2026-08-14
**Estado**: Items 1-15 + pulido estético + manuales + acceso "Manual" por rol + skill `doesntbreak` + **responsive mobile (items 16-18: menú móvil unificado, tablas con scroll horizontal propio, headers con wrap)** — todo **commiteado y pusheado** (último commit `d93719b resposive`) + **`backend/sql/seed-demo.sql` creado (solo INSERT, pendiente de ejecutar por el usuario en la BD real)**. Backend: `node --check` OK en los 12 archivos. Frontend: `npm run build` OK (16 rutas). **Pendiente del usuario**: ejecutar `seed-demo.sql` contra la BD real, limpiar luego lo `demo.*`, y verificación final en Render/Droplet con hard refresh.
**Próxima acción**: usuario ejecuta `backend/sql/seed-demo.sql` en la BD real (SQLYog o similar) para probar todos los escenarios con datos demo (contraseña `demo123`, emails `demo.*`); luego verificar responsive en el droplet con hard refresh (menú móvil en una sola zona, tablas de facturación/plantillas/alumnos con scroll horizontal) y flujos de BD contra los datos demo. El usuario limpia lo `demo.*` al terminar.

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

---

## Estructura del monorepo (al día)

```
C:\GesttionSoftware\
├── .github/workflows/deploy-front.yml
├── .gitignore                 ← cubre node_modules/, .next/, out/, .env
├── AGENTS.md                  ← convención de esquema en español + caché del navegador + reglas de commit/push
├── CONTEXT.md                 ← glosario + decisiones (incluye tickets 07-12 y criterios nuevos del grilling)
├── .opencode/
│   └── skills/doesntbreak/    ← ★ NUEVO: skill responsive mobile-first vendida (SKILL.md + references/patterns.md + README MIT)
├── .scratch/tenis-manager/
│   ├── handoff.md             ← este archivo
│   ├── modificaciones.md      ← ★ 15 observaciones + TODAS las decisiones resueltas (la fuente de la próxima sesión)
│   ├── issues/, tickets/, spec.md, PRD.md, map.md, research/
├── docs/
├── deploy/nginx-riversideclases.conf
├── backend/
│   ├── server.js
│   ├── package.json, .env.example
│   ├── sql/
│   │   ├── schema.sql         ← 10 tablas + columna saldo_a_favor (item 15) YA actualizada
│   │   ├── migrations/001_saldo_a_favor.sql  ← ★ NUEVO (migración de referencia, idempotente)
│   │   ├── seed-admin.js / seed-admin.sql
│   │   └── seed-demo.sql      ← ★ NUEVO: seed de prueba con datos varios (solo INSERT, contraseña demo123, emails demo.*)
│   └── src/
│       ├── db.js              ← OK: dateStrings: true (fix item 3/7)
│       ├── middleware/auth.js
│       ├── services/instances.js, services/billing.js   ← OK: enrich + saldo + includePast
│       └── routes/ (auth, students, templates, instances, board, asistencias, billing, pagos)  ← OK
└── frontend/
    ├── package.json / next.config.js (output: 'export' + trailingSlash)
    ├── tailwind.config.js     ← OK: paleta A (canvas #F2F7F2)
    ├── src/components/Navigation.tsx · LevelChip.tsx   ← OK (nav persistente + chip de nivel) + ★ enlace "Manual" por rol (abre pestaña nueva)
    └── src/app/
        ├── page.tsx / layout.tsx / globals.css / login/page.tsx  ← OK (globals con .card/.btn/.input/.label/.chip/.table-head)
        ├── dashboard/page.tsx · admin/page.tsx   ← OK (rewrite con Navigation + .card)
        ├── alumnos/page.tsx · mis-clases/page.tsx   ← OK
        ├── plantillas/page.tsx · instancias/page.tsx · tablero/page.tsx   ← OK
        ├── clases-abiertas/page.tsx · facturacion/page.tsx · pagos/page.tsx   ← OK
        ├── perfil/page.tsx   ← NUEVO (item 11: nombre/tel + change-password)
        └── public/
            ├── manual-sistema.html   ← manual del sistema (profe/admin + alumno + arquitectura + reglas) — actualizado con items 1-15
            ├── manual-profesor.html  ← ★ NUEVO: manual-sistema SIN la sección de Arquitectura (renumerada 5→4)
            └── manual-usuario.html   ← manual para el usuario final (alumno), sin Arquitectura ni secciones internas
```

---

## Endpoints (todo bajo `/api`, auth por cookie/Bearer JWT)

| Método | Ruta | Rol | Descripción |
|---|---|---|---|
| POST | /auth/login, logout | varios | Auth |
| GET | /auth/me | cualquiera | Perfil propio |
| POST | /auth/register | público | Registro (⚠ riesgo: acepta role del body) |
| CRUD | /students | admin/profesor | Alumnos (+ PUT /students/profile = propio) |
| CRUD | /templates | admin/profesor | Plantillas (+ genera/cancela instancias) |
| GET | /instances?month=YYYY-MM | admin/profesor | Instancias del mes |
| POST | /instances/generate?month=YYYY-MM | admin/profesor | Regenera un mes desde plantillas activas |
| GET | /instances/open | admin/profesor/alumno | Clases abiertas+extras (alumno: solo programadas futuras) |
| POST | /instances/open | admin/profesor | Crea clase abierta/extra ad-hoc |
| PUT/DELETE | /instances/open/:id | admin/profesor | Edita / elimina (cascada por plantilla) |
| POST | /instances/open/:id/postulate | alumno | Postula (chequea deuda; lleno → lista_espera; force) |
| DELETE | /instances/open/:id/postulate | alumno | Cancela postulación pendiente |
| GET | /instances/open/:id/candidates | admin/profesor | Candidatos + balance deuda |
| POST | /instances/open/:id/candidates/:pid/accept | admin/profesor | Acepta → ocupa cupo (lleno → waitlist) |
| POST | /instances/open/:id/candidates/:pid/reject | admin/profesor | Rechaza → lista_espera |
| POST | /instances/open/:id/candidates/:pid/override | admin/profesor | Fuerza aceptación (deuda/cupo) |
| GET | /board/day?date= / /board/week?date= | admin/profesor | Instancias del día/semana + alumnos |
| GET | /board/mine | alumno | Mis clases + saldo de deuda |
| POST/DELETE | /board/enroll | admin/profesor | Inscribir / desinscribir (fija genera mensualidad) |
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
| Superusuario Pablo | `pablo@tenismanager.com` / `1414` (insertado manual vía SQL) |
| DB host | `137.184.178.21` (mismo que jockey) |
| DB user/password | (mismos que jockey — NO están en el repo) |
| DB name | `tenisriverside` |
| Render URL | `https://tenis-manager.onrender.com` |
| JWT_SECRET | `ts_riverside_2026_secret` (env var de Render) |
| Repo GitHub | `https://github.com/Pablobun/tenis-manager` |

---

## Lo que se hizo en ESTA sesión

### 1. Artefacto HTML del manual del sistema
- **`frontend/public/manual-sistema.html`** (nuevo, autocontenido, en español). Se sirve en `https://riversideclases.portaltorneos-riocuarto.com.ar/manual-sistema.html` tras el próximo build/push. Contiene: introducción + roles, manual de uso por rol (profesora/admin y alumno), arquitectura (stack, deploy, esquema BD, endpoints, ENUMs) y reglas/restricciones de las acciones. Credenciales como placeholder (sin contraseñas reales).

### 2. Grilling completo de observaciones (skill grill-with-docs)
- Se listaron **15 observaciones** en `.scratch/tenis-manager/modificaciones.md` (usuario recorrió el sistema).
- Se grillaron **todas** y quedaron resueltas con decisiones concretas. **Detalle completo en `modificaciones.md`** — es la fuente principal de la próxima sesión. Resumen:

| # | Observación | Decisión |
|---|---|---|
| 1/2 | Nav sin salida al panel / botón volver | **Barra de navegación persistente** adaptativa: bottom nav mobile / top bar PC + botón "Menú" con el resto de módulos (componente compartido) |
| 3 | Vista semanal vacía (bug) | `dateStrings: true` en `db.js` + `inst.fecha.slice(0,7)` en `services/billing.js:13` |
| 4/9 | Candidatos poco visibles | Campo `pending_candidates` en `GET /instances/open`; badge ámbar "N candidatos" (cupo libre) / gris "N en lista de espera" (llena) en `/clases-abiertas` |
| 5 | Color por nivel | Chip de nivel: principiante red / intermedio green / avanzado amber; borde de tarjeta intacto (cupo) |
| 6 | Profesor por clase | Selector "Profesor/a" (solo rol `profesor`) en plantillas y abiertas; mostrar nombre en tablero/instancias/abiertas. Sin cambios de BD |
| 7 | Fecha NaN en instancias | Cubierto por fix del item 3 |
| 8 | Alumnos en instancias | `enrichInstancesWithStudents` en `GET /instances` + "Alumnos: N/M" con nombres |
| 10 | Campo "frecuencia" confuso | **Se elimina** del form y listado de plantillas |
| 11 | Perfil / contraseña | Página `/perfil` para todos (nombre+teléfono editables; email/nivel solo lectura); `POST /auth/change-password` (actual+nueva+confirmar); reset de contraseña desde `/alumnos` (profe/admin) |
| 12 | Alerta al cambiar nivel | Al guardar en `/alumnos`, listar clases discrepantes con `fecha >= hoy` (solo informa) |
| 13 | Facturación poco clara | 8 mejoras: detalle por clase, cuenta "N clases × $", estado mes/ciclo, saldo vs pagado, totales globales, columna Pagado, aviso inscripción a mitad de mes, fondo generadas/pendientes |
| 14 | Deuda mensual ambigua | Aclarar "precio por clase × N clases del mes" en form y facturación; **preguntar a la profe** al crear plantilla si genera fechas pasadas del mes en curso. Asistencia en fija NO afecta deuda |
| 15 | Monto a favor | Columna `saldo_a_favor` en `perfiles` (**único cambio de BD**); excedente de pago → saldo a favor; se aplica automático a próxima deuda; verde "a favor". **BD YA aplicada en producción** |

### 3. Cambios de BD (item 15) — ya aplicados en producción
- `backend/sql/schema.sql` — agregada `saldo_a_favor DECIMAL(10,2) NOT NULL DEFAULT 0` en `perfiles`.
- `backend/sql/migrations/001_saldo_a_favor.sql` — **nuevo**: script de referencia idempotente para SQLYog (agrega columna si no existe + inicializa con pagos huérfanos `deuda_id NULL`).
- **Nota**: la columna ya existe en la BD real; el script es solo referencia/replicación.

### 4. Pulido estético del frontend — PLAN APROBADO
- **Paleta A "Verde cancha / aire"** (elegida): fondo verde tenue cálido (`#F2F7F2` aprox.) en lugar de `gray-50` frío; tarjetas `rounded-xl/2xl` con borde sutil + borde de acento izquierdo + sombra difusa.
- **Header oscuro** (verde profundo `primary-800/900`, texto blanco) en todas las pantallas.
- Aplicar a **TODO el frontend** (login, dashboard/admin, tablero, plantillas, instancias, alumnos, clases-abiertas, facturación, pagos, mis-clases).
- Conservar chips de nivel (item 5) y badges de candidatos (item 4/9).
- Archivos clave: `tailwind.config.js` (paleta), `globals.css` (fondo body), headers y cards de cada `page.tsx`.
- Sin cambios de lógica.

### 5. Implementación funcional (items 1-15 + pulido) — esta sesión
- **Backend** (`node --check` OK): `db.js` (dateStrings), `services/billing.js` (`applySaldoToDebt`, applySaldo en ensureDebt/generate), `services/instances.js` (`enrichInstancesWithStudents`, `generateInstancesForMonth` con `includePast`), rutas `board/instances/templates/students/auth/pagos/billing/asistencias`.
- **Componentes nuevos**: `frontend/src/components/Navigation.tsx` y `LevelChip.tsx`.
- **Frontend** (`npm run build` OK, 16 rutas): login, dashboard, admin, tablero, mis-clases, plantillas, instancias, alumnos, clases-abiertas, facturación, pagos → reescritos con Navigation + `.card`/`.btn-*`/`.input`/`.chip`; **`/perfil` nuevo**.
- Detalle de cada item en las secciones de la sesión siguiente.

### 6. Manuales actualizados — esta sesión
- **`frontend/public/manual-sistema.html`**: actualizado para reflejar los items 1-15 — Instancias (Alumnos N/M + nombres, profesor, chip nivel, `include_past`), Clases abiertas (badge de postulaciones, deuda neta en candidatos), Alumnos (reset de contraseña, alerta de nivel discrepante), Facturación (detalle expandible "N × $", totales globales, estado mes/ciclo, inscripción a mitad de mes, Pagado + saldo a favor), Pagos (saldo a favor, pago parcial/excedente), sección Alumno (perfil, change-password, bloqueo por deuda neta), reglas de negocio (deuda neta en postulación, pagos/saldo a favor, alumnos), tabla de endpoints (change-password, profesores, `/pagos/student/:id` neto, generate con `include_past`) y esquema `perfiles` (saldo_a_favor).
- **`frontend/public/manual-usuario.html`** (nuevo): manual para el usuario final (alumno), mismo estilo/CSS pero SIN la sección de Arquitectura ni el manual interno de profe/admin. Interpretación: "idéntico pero para usuario" = manual de alumno; si se quería copia literal solo sin la sección 4, ajustar.
- `npm.cmd run build` OK tras los cambios (16 rutas).

### 7. Manual de la profesora + acceso al manual desde el sistema + skill responsive — esta sesión
- **`frontend/public/manual-profesor.html`** (nuevo): **todo** el contenido de `manual-sistema.html` **sin el item de Arquitectura** (stack/deploy, esquema BD, endpoints, ENUMs). Incluye Introducción, Roles, Manual Profesora/Admin, Manual Alumno y Reglas y restricciones (renumerada de 5 → 4). Mismo CSS/estilo.
- **Acceso al manual desde el sistema** (`Navigation.tsx`): enlace **"Manual"** en la barra persistente, con destino **según rol**:
  - **admin** → `/manual-sistema.html` · **profesor** → `/manual-profesor.html` · **alumno** → `/manual-usuario.html`
  - Dónde aparece: PC → final de la barra superior; celular admin/profe → dentro del panel "Menú"; celular alumno → ítem directo en la barra inferior (no tienen botón Menú).
  - Abre en **pestaña nueva** (`target="_blank" rel="noopener noreferrer"`).
- **Skill `doesntbreak` vendida** en `.opencode/skills/doesntbreak/` (SKILL.md + `references/patterns.md` + README MIT). Diseño responsive mobile-first (320px+), tailwind-aware, con modo review. Origen: `https://github.com/Kyaa-A/doesntbreak` (MIT © 2026 Asnari). **Auditada y segura** (solo markdown; se dejaron fuera a propósito los hooks/scripts/update-check del repo). Adaptación local: sección 13 de `patterns.md` con tokens/patrones de Riverside. Se activa sola al tocar layout web; disponible recién en la **próxima sesión** (las skills se cargan al inicio).

### 8. Responsive mobile (items 16-18) + seed demo — esta sesión
- **Item 16 · Menú móvil unificado** (`Navigation.tsx`): se elimina el panel desplegable que aparecía arriba del contenido y el botón **Menú ahora expande el propio bottom nav** en una segunda fila (`grid-cols-5`, `text-[11px]`, `truncate`) con Plantillas/Instancias/Alumnos/Mi Perfil/Manual — **todo en una sola zona, abajo**. Indicador ▴/▾. Alumno sin cambios (sus 3 ítems van directos). PC sin cambios.
- **Item 17 · Tablas con scroll horizontal propio** (regla doesntbreak 9 "contain the scroll"): cada `<table>` envuelta en `<div className="overflow-x-auto">` y se quita el `card overflow-hidden` que recortaba el contenido. Aplicado en:
  - `facturacion/page.tsx` (2 tablas: deuda propuesta + apertura de mes).
  - `plantillas/page.tsx` (tabla de 9 columnas — el "Mod…" truncado).
  - `alumnos/page.tsx` (tabla de 7 columnas).
- **Item 18 · Botones/headers con wrap**: `flex-wrap` + `gap` en los headers y acciones de `facturacion` (selector mes + Generar deudas + Abrir mes), `plantillas`, `alumnos`, `instancias` y `clases-abiertas` (título + botón "+ Nueva…").
- **Páginas ya responsive (sin cambios)**: tablero, instancias, clases-abiertas, pagos, mis-clases, dashboard, admin, perfil, login (cards/grid, sin tablas anchas).
- **`backend/sql/seed-demo.sql`** (nuevo): seed de prueba **solo INSERT** (MySQL puro, sin DELETE — la limpieza la hace el usuario) para ejecutar en la BD real. Contraseña común **`demo123`** (hash bcrypt embebido), emails prefijo **`demo.*`**. Datos: 2 profesores + 12 alumnos (con deuda pendiente/parcial/pagada/atrasada, sin deuda, inactivo, saldo a favor ×2), 3 plantillas fijas con instancias del mes actual (dinámicas), inscripciones en clase fija, clase abierta futura con postulaciones (pendiente/aceptada/lista_espera), clase extra pasada con asistencia (deuda clase_extra), pagos (parcial/completo/huérfanos) y ciclos (mes anterior cerrado, mes actual abierto). Montos de mensualidad calculados con `COUNT(*)` de instancias (precio × clases). **Pendiente de ejecutar por el usuario.**
- `npm.cmd run build` OK tras el responsive (16 rutas). Commit del usuario: `d93719b resposive`.

---

## Sesión siguiente (prioridad)

**Ya implementado (todo listo para push del usuario):**

- **Item 3/7 (bug semana)**: `dateStrings: true` en `db.js` + `inst.fecha.slice(0,7)` en `services/billing.js:13`. ✔
- **Item 1/2 (nav)**: componente `Navigation.tsx` (bottom nav mobile / top bar PC oscura + "Menú") en TODAS las páginas. ✔
- **Item 10**: campo `frecuencia` eliminado de form/listado de plantillas. ✔
- **Item 15 (saldo a favor)**: excedente de pago → `saldo_a_favor` en `pagos.js`; se aplica automático en `billing.js` (ensureDebt/generate), `asistencias.js`; balance neto en `/board/mine`, `/pagos/student/:id`, candidatos de abiertas, preview/debtors de facturación. ✔
- **Items 4/9, 5, 6, 8**: `pending_candidates` (badge ámbar), `LevelChip`, `profesor_id`+`professor_name` (plantillas, abiertas, tablero, instancias), `enrichInstancesWithStudents` ("Alumnos N/M" + nombres). ✔
- **Item 11**: `/perfil` (nombre/tel + change-password) + `POST /auth/change-password` + reset de contraseña desde `/alumnos`. ✔
- **Item 12**: `PUT /students/:id` lista clases discrepantes futuras (warning, solo informa). ✔
- **Item 13 (facturación)**: preview con detalle por clase, "N × $", inscripción a mitad de mes, totales globales, estado mes/ciclo, columna Pagado + saldo a favor en deudores. ✔
- **Item 14**: pregunta `include_past` al crear plantilla y al regenerar mes; hint "mensualidad = precio × clases del mes". ✔
- **Pulido estético**: Paleta A (`#F2F7F2`), header oscuro `Navigation`, clases reutilizables en `globals.css` (`.card`, `.btn-primary`, `.input`, `.label`, `.chip`, `.table-head`). ✔
- **Items 16-18 (responsive)**: menú móvil unificado en una sola zona (bottom nav expandible), tablas con `overflow-x-auto` (facturación/plantillas/alumnos), headers con `flex-wrap`. ✔

**Próximo paso (pendiente del usuario):**
1. **Ejecutar `backend/sql/seed-demo.sql` en la BD real** (SQLYog o similar) para probar todos los escenarios con datos demo. Contraseña `demo123`, emails `demo.*`. Al terminar, el usuario **limpia los datos `demo.*`** (el script es solo INSERT, sin DELETE).
2. Verificar en **Render** los flujos contra BD real usando los datos demo:
   - Postulación con balance neto (item 15) y candidatos con `balance_favor` (Hugo/Elena pendientes, Irene lista_espera, Lucía aceptada).
   - Preview de facturación con detalle/totales y generate con auto-saldo (Ana pendiente, Bruno parcial, Carla pagada, Gabriela atrasada).
   - Saldo a favor (Facundo $15000, Lucía $5000) aplicándose a la próxima deuda.
   - `POST /auth/change-password` y reset desde `/alumnos`.
   - Regenerar mes con `include_past: false`.
3. Verificar frontend en el droplet con **hard refresh (Ctrl+F5) / incógnito**:
   - Menú móvil: al tocar "Menú" todo queda en la barra inferior (una sola zona), sin panel arriba.
   - Tablas de facturación/plantillas/alumnos con scroll horizontal propio (se desliza la tabla, no la página).
   - Headers/botones sin cortes en pantallas chicas.
   - 3 manuales servidos + enlace "Manual" por rol.
4. Opcional: limpiar estado muerto en `mis-clases/page.tsx` (estado `profile/editing/form/saving/message/loading` + `fetchProfile`/`handleSubmit` quedaron sin uso tras quitar "Mi Perfil") — inofensivo, no bloquea build.

---

## Notas importantes

- **Nunca hacer commit/push**: es el usuario quien ejecuta git add/commit/push (regla AGENTS.md).
- **Esquema en español**: tablas/columnas/ENUM en castellano (`fija`/`extra`/`abierta`, `programada`/`completada`/`cancelada`, `pendiente`/`aceptada`/`rechazada`/`lista_espera`). Nunca mandar `fixed`/`open`. El backend mapea columnas españolas → claves JSON en inglés. `instancias_clases.plantilla_id` es NOT NULL.
- **Windows**: la Execution Policy bloquea `npm.ps1` → usar `npm.cmd run build` en frontend y `npm.cmd install` en backend.
- **Verificación local sin tests**: `node --check` por archivo (backend) + `npm.cmd run build` (frontend). Flujos contra BD real se prueban en Render tras push.
- **Sin `.env` local** no hay conexión a BD (500 esperado); auth (401) y validaciones (400) se prueban con JWT firmado localmente (`node -e "console.log(require('jsonwebtoken').sign({id:1,rol:'admin'},'ts_riverside_2026_secret'))"` en `backend/`).
- **Caché tras deploy**: verificar con hard refresh (Ctrl+F5) o incógnito. Un bundle viejo cacheado manda valores/endpoints viejos y confunde el diagnóstico (lección del item 3).
- **mysql2**: las columnas DATE vuelven como objetos `Date` salvo que se setee `dateStrings: true` — causa del bug de semana (item 3) y del NaN (item 7).
- **Bug de zona horaria descartado** para la semana: el armado de fechas de `/board/week` da bien en UTC y Argentina; la causa real fue el tipo de dato de mysql2.
- Nginx: `root /var/www/tenis-manager;` + `location /api/` → Render. Config versionada en `deploy/nginx-riversideclases.conf`.
- **Next.js**: `trailingSlash: true` genera carpetas (`clases-abiertas/index.html`).
- Roles en BD: `admin`, `profesor`, `alumno`.
- **Registro público** (`POST /auth/register`) acepta `role` del body sin restricción — posible escalada de privilegios a documentar/revisar (decisión pendiente, no se grilló).
- **Manuales** (en `frontend/public/`, servidos como estáticos): `manual-sistema.html` (todo, con Arquitectura), `manual-profesor.html` (sin Arquitectura), `manual-usuario.html` (alumno, sin Arquitectura ni manual interno). Acceso desde la nav con el enlace **"Manual"** que redirige por rol. Recordar: los cambios a `frontend/public/` salen en el build de Next (output: export los copia a `out/`).
- **Skill `doesntbreak`**: `.opencode/skills/doesntbreak/` — solo markdown (sin scripts/red). Ya se aplicó para los items 16-18 (regla 9 "contain the scroll": envolver tablas anchas en `overflow-x-auto`, nunca dejar scroll horizontal en la página).
- **Seed demo** (`backend/sql/seed-demo.sql`): solo INSERT (sin DELETE), contraseña `demo123`, emails `demo.*`. Ejecutar contra la BD real para probar; el usuario limpia lo `demo.*` al terminar. Montos de mensualidad se calculan con `COUNT(*)` de instancias del mes (precio × clases), coherentes con facturación.

---

## Suggested skills

- **implement** — para ejecutar los items 1-15 y el pulido estético con los tickets/documentos ya escritos.
- **to-tickets / to-issues** — si se quiere partir los 15 items en tickets de trabajo antes de implementar.
- **code-review** — revisar el diff de implementación antes del push del usuario.
- **grill-with-docs** — si surge una decisión nueva de dominio (ej. arreglar el riesgo de `/auth/register`, o definir qué pasa con las clases canceladas en facturación).
- **prototype** (rama UI) — opcional, si el pulido estético quiere explorarse con variantes antes de decidir (ya se decidió Paleta A, así que probablemente no haga falta).
- **doesntbreak** — skill responsive mobile-first (ya aplicada en items 16-18); volver a usarla al tocar cualquier layout del frontend o para una revisión responsive del conjunto.

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
- Cambiar email del usuario (requiere verificación) — queda fuera por decisión del item 11
- Arreglar el riesgo de `/auth/register` (rol desde el body)