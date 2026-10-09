# Handoff â€” Sistema de GestiÃ³n de Clases de Tenis (Riverside)

**Fecha**: 2026-10-06 (actualizado 2026-10-08)
**Estado**: **lote 2 + rediseÃ±o "Polvo de Ladrillo" commiteados y pusheados** (commit `9982d0a cambios`, `main` = `origin/main`, working tree limpio). Incluye: los 10 puntos de `cambios.txt` (issue `13-cambios-lote2` â†’ **completed**), rediseÃ±o visual guiado por `impeccable` con cierre completo (detect `[]`, finish review **ship**, `DESIGN.md` + `.impeccable/design.json`, provenance del logo embebida), skill impeccable + `.impeccable/` + `DESIGN.md`/`PRODUCT.md`/`cambios.txt` versionados. **Tabla nueva `plantilla_alumnos` YA EJECUTADA en la BD real por el usuario** (Ãºnico cambio de esquema; migraciÃ³n `backend/sql/migrations/002_plantilla_alumnos.sql`; ningÃºn campo/ENUM modificado). Backend `node --check` OK; frontend `npm.cmd run build` OK (16 rutas). Items 1-15 + responsive 16-18 + manuales siguen commiteados (commit previo `d93719b`).
**Lote 3 (IMPLEMENTADO, sin commitear)**: issue **`14-lote3-compaÃ±eros-sponsors.md` â†’ done**. F1 compaÃ±eros en mis-clases (`attachStudents`/`enrichInstancesWithStudents` en `/mine` + `/open`), F2 modal sponsors (`ads.ts` + `AdModal.tsx`, 1Ã—/dÃ­a, solo alumno â€” `ads.ts` queda `ADS=[]` hasta que la clienta cargue banners en `public/banners/`), F3 `components/Modal.tsx` centrado (tablero), correcciones auditorÃ­a F4aâ€“F4f (verde extras en todas las vistas, panel Inscriptos en Clases Abiertas, mail en "Forzar", candidates filtra `aceptada`, baja propia en Disponibles, precio extra = 50% vÃ­a `lib/extraPrice.ts`). Bugfix SQL: alias de 3 SELECTs alineados a la whitelist. Finish review: **fix (5 hallazgos) â†’ 2 batches â†’ ship** (chip verde tablero, docs redâ†’green, un solo feltro en forms, density void, grises â†’ paleta). Detect `[]`, `node --check` OK, `npm.cmd run build` OK (16 rutas). Capturas nuevas en `.impeccable/review/` (11 frescas; `login-*` y `plantillas-desktop` stale). Logo nuevo: `frontend/public/logo.png` (PNG procesado con alfa, reemplaza a `logo.jpeg`).
**Lote 3.5 (ads, 2026-10-08)**: (1) modal de sponsors ahora se abre **cada vez que un alumno inicia sesiÃ³n** (flag `sessionStorage.ads_pending` seteado en `login/page.tsx`, consumido por `AdModal`; ya no 1Ã—/dÃ­a); (2) **`LOGIN_AD`** en `ads.ts`: una publicidad permanente debajo del formulario de login (hoy casamadre); (3) `tsconfig.json` `target: es5 â†’ ES2017` (resuelve el deprecation error de TS sin `ignoreDeprecations`); (4) usuario cargÃ³ 4 banners reales en `ADS` (casamadre, victoria, itec, kevin); (5) la barra verde "Â¿QuerÃ©s ser sponsor?" del modal es ahora **botÃ³n al WhatsApp** `wa.me/5493584024658` (constante `SPONSOR_WHATSAPP` en ads.ts; âœ• de cerrar sigue separada, hover con `rounded-xl` para no sangrar esquinas). Finish review: **ship** en todos los batches, detect `[]`, build OK. **PrÃ³xima acciÃ³n**: el usuario commitea (add/commit/push).
## SESIÃ“N 2026-10-08 â€” issue 15: 5 problemas post-lote3 â†’ IMPLEMENTADO (sin commitear)

Issue **`15-lista-problemas-post-lote3.md` â†’ done**. Grill con docs primero (puntos 2+3 fusionados en modelo de estados `programada`/`cancelada`/`archivada`/`completada`, ver decisiones en el issue), luego implementaciÃ³n completa de los 5:

1. **Clases Disponibles**: anti-join en `GET /api/instances/open` â€” inscriptos/aceptados salen de la lista; pendientes/lista_espera/rechazadas siguen visibles.
2. **Estado `archivada`**: ENUM extendido (`backend/sql/migrations/003_archivada.sql` â€” **el usuario debe correr el ALTER en SQLYog**), `archivada` = serie desactivada desde panel plantillas (invisible, no factura); `cancelada` = cancelaciÃ³n puntual desde calendario (visible, factura, Ãºnica acciÃ³n Reactivar). Filtros `estado <> 'archivada'` en board/billing/instances.
3. **ReactivaciÃ³n fix**: `PUT /api/instances/:id/status` + `reactivateFutureInstances` (UPDATE `archivadaâ†’programada` desde hoy, ya que INSERT IGNORE saltaba filas existentes por UNIQUE); botones Cancelar/Reactivar en modal del tablero (estado correcto: un solo feltro â€” `Ver alumnos` en programada, `Reactivar clase` en cancelada).
4. **Manuales â†’ Polvo de Ladrillo**: los 3 reestilizados + contenido de reglas nuevo (archivada/cancelada/facturaciÃ³n), `.main` 700px, `<h4>`â†’`<h3>`.
5. **Calendario**: semana navega Â±7 dÃ­as + `<input type="date">` para salto a fecha destino.

VerificaciÃ³n: `node --check` (7 archivos) OK, `npm.cmd run build` OK, detect `[]` (ignore deliberado `cream-palette *` en manuales, `.impeccable/config.json`), finish review **`disposition: ship`** tras 2 rounds (batch 1: feltro/contraste/medida; batch 2: feltro estado-dependent). 17 capturas frescas en `.impeccable/review/`. Infra de captura mock+serve en `C:\Users\p_bun\AppData\Local\Temp\opencode\shot\` (servers ya detenidos).

**AcciÃ³n del usuario (sigue pendiente)**: (1) correr `backend/sql/migrations/003_archivada.sql` en SQLYog; (2) git add/commit/push de lotes 3 + 3.5 + issue 15; tras push, hard refresh (Ctrl+F5) en droplet/Render. `backend/sql/estadoactual.sql` (dump del punto 3) puede borrarse ya que sirviÃ³ al diagnÃ³stico.

**Pendientes menores conocidos**: seed-demo.sql sin ejecutar; SMTP sin credenciales; fase 5 (centrado calendario PC); confirm() nativos; gray/emerald/amber fuera de paleta en pÃ¡ginas no capturadas; registro pÃºblico acepta role del body.

---

## QuÃ© es este proyecto

Web app responsive (mobile-first) para una profesora de tenis que administra clases, inscripciones y deudas.

**Usuarios**: profesora(s), alumnos, admin
**Plataforma**: web responsive, la mayorÃ­a usa celular
**Dominio**: `riversideclases.portaltorneos-riocuarto.com.ar`

---

## Stack actualizado

| Capa | TecnologÃ­a | DÃ³nde corre |
|------|-----------|-------------|
| Frontend | Next.js (React) + Tailwind + output: 'export' + trailingSlash | Droplet DigitalOcean (`/var/www/tenis-manager/`) |
| Backend | Node.js + Express (plain JS) + mysql2 + JWT | Render (`tenis-manager.onrender.com`) |
| DB | MySQL (`tenisriverside`) â€” tablas/columnas/ENUM en **espaÃ±ol** | Droplet DigitalOcean |
| Auth | JWT + bcrypt, cookie httpOnly, roles en payload | Backend |
| Deploy Front | GitHub Actions â†’ SSH + rsync | AutomÃ¡tico en push a main |
| Deploy Back | Render (conectado al repo) | AutomÃ¡tico en push a main |
| Nginx | `riversideclases.conf` en `/etc/nginx/conf.d/` (versionado en `deploy/nginx-riversideclases.conf`) | SSL via certbot + proxy `/api/` â†’ Render |

---

## Arquitectura de deploy

```
GitHub (repo: Pablobun/tenis-manager)
  â”œâ”€ push a main â”€â”€â–º GitHub Actions â†’ rsync frontend/out/ â†’ droplet /var/www/tenis-manager/
  â”‚                                    â””â”€ instala nginx conf + reload (proxy /api/)
  â””â”€ push a main â”€â”€â–º Render â†’ npm install + node server.js â†’ tenis-manager.onrender.com
                        â–²
                        â””â”€ nginx del droplet proxea /api/* â†’ tenis-manager.onrender.com (mismo origen)
```

---

## Estructura del monorepo (al dÃ­a)

```
C:\GesttionSoftware\
â”œâ”€â”€ .github/workflows/deploy-front.yml
â”œâ”€â”€ .gitignore                 â† cubre node_modules/, .next/, out/, .env
â”œâ”€â”€ AGENTS.md                  â† convenciÃ³n de esquema en espaÃ±ol + cachÃ© del navegador + reglas de commit/push
â”œâ”€â”€ CONTEXT.md                 â† glosario + decisiones (incluye tickets 07-12 y criterios nuevos del grilling)
â”œâ”€â”€ .opencode/
â”‚   â””â”€â”€ skills/doesntbreak/    â† â˜… NUEVO: skill responsive mobile-first vendida (SKILL.md + references/patterns.md + README MIT)
â”œâ”€â”€ .scratch/tenis-manager/
â”‚   â”œâ”€â”€ handoff.md             â† este archivo
â”‚   â”œâ”€â”€ modificaciones.md      â† â˜… 15 observaciones + TODAS las decisiones resueltas (la fuente de la prÃ³xima sesiÃ³n)
â”‚   â”œâ”€â”€ issues/, tickets/, spec.md, PRD.md, map.md, research/
â”œâ”€â”€ docs/
â”œâ”€â”€ deploy/nginx-riversideclases.conf
â”œâ”€â”€ backend/
â”‚   â”œâ”€â”€ server.js
â”‚   â”œâ”€â”€ package.json, .env.example
â”‚   â”œâ”€â”€ sql/
â”‚   â”‚   â”œâ”€â”€ schema.sql         â† 10 tablas + columna saldo_a_favor (item 15) YA actualizada
â”‚   â”‚   â”œâ”€â”€ migrations/001_saldo_a_favor.sql  â† â˜… NUEVO (migraciÃ³n de referencia, idempotente)
â”‚   â”‚   â”œâ”€â”€ seed-admin.js / seed-admin.sql
â”‚   â”‚   â””â”€â”€ seed-demo.sql      â† â˜… NUEVO: seed de prueba con datos varios (solo INSERT, contraseÃ±a demo123, emails demo.*)
â”‚   â””â”€â”€ src/
â”‚       â”œâ”€â”€ db.js              â† OK: dateStrings: true (fix item 3/7)
â”‚       â”œâ”€â”€ middleware/auth.js
â”‚       â”œâ”€â”€ services/instances.js, services/billing.js   â† OK: enrich + saldo + includePast
â”‚       â””â”€â”€ routes/ (auth, students, templates, instances, board, asistencias, billing, pagos)  â† OK
â””â”€â”€ frontend/
    â”œâ”€â”€ package.json / next.config.js (output: 'export' + trailingSlash)
    â”œâ”€â”€ tailwind.config.js     â† OK: paleta A (canvas #F2F7F2)
    â”œâ”€â”€ src/components/Navigation.tsx Â· LevelChip.tsx   â† OK (nav persistente + chip de nivel) + â˜… enlace "Manual" por rol (abre pestaÃ±a nueva)
    â””â”€â”€ src/app/
        â”œâ”€â”€ page.tsx / layout.tsx / globals.css / login/page.tsx  â† OK (globals con .card/.btn/.input/.label/.chip/.table-head)
        â”œâ”€â”€ dashboard/page.tsx Â· admin/page.tsx   â† OK (rewrite con Navigation + .card)
        â”œâ”€â”€ alumnos/page.tsx Â· mis-clases/page.tsx   â† OK
        â”œâ”€â”€ plantillas/page.tsx Â· instancias/page.tsx Â· tablero/page.tsx   â† OK
        â”œâ”€â”€ clases-abiertas/page.tsx Â· facturacion/page.tsx Â· pagos/page.tsx   â† OK
        â”œâ”€â”€ perfil/page.tsx   â† NUEVO (item 11: nombre/tel + change-password)
        â””â”€â”€ public/
            â”œâ”€â”€ manual-sistema.html   â† manual del sistema (profe/admin + alumno + arquitectura + reglas) â€” actualizado con items 1-15
            â”œâ”€â”€ manual-profesor.html  â† â˜… NUEVO: manual-sistema SIN la secciÃ³n de Arquitectura (renumerada 5â†’4)
            â””â”€â”€ manual-usuario.html   â† manual para el usuario final (alumno), sin Arquitectura ni secciones internas
```

---

## Endpoints (todo bajo `/api`, auth por cookie/Bearer JWT)

| MÃ©todo | Ruta | Rol | DescripciÃ³n |
|---|---|---|---|
| POST | /auth/login, logout | varios | Auth |
| GET | /auth/me | cualquiera | Perfil propio |
| POST | /auth/register | pÃºblico | Registro (âš  riesgo: acepta role del body) |
| CRUD | /students | admin/profesor | Alumnos (+ PUT /students/profile = propio) |
| CRUD | /templates | admin/profesor | Plantillas (+ genera/cancela instancias) |
| GET | /instances?month=YYYY-MM | admin/profesor | Instancias del mes |
| POST | /instances/generate?month=YYYY-MM | admin/profesor | Regenera un mes desde plantillas activas |
| GET | /instances/open | admin/profesor/alumno | Clases abiertas+extras (alumno: solo programadas futuras) |
| POST | /instances/open | admin/profesor | Crea clase abierta/extra ad-hoc |
| PUT/DELETE | /instances/open/:id | admin/profesor | Edita / elimina (cascada por plantilla) |
| POST | /instances/open/:id/postulate | alumno | Postula (chequea deuda; lleno â†’ lista_espera; force) |
| DELETE | /instances/open/:id/postulate | alumno | Cancela postulaciÃ³n pendiente |
| GET | /instances/open/:id/candidates | admin/profesor | Candidatos + balance deuda |
| POST | /instances/open/:id/candidates/:pid/accept | admin/profesor | Acepta â†’ ocupa cupo (lleno â†’ waitlist) |
| POST | /instances/open/:id/candidates/:pid/reject | admin/profesor | Rechaza â†’ lista_espera |
| POST | /instances/open/:id/candidates/:pid/override | admin/profesor | Fuerza aceptaciÃ³n (deuda/cupo) |
| GET | /board/day?date= / /board/week?date= | admin/profesor | Instancias del dÃ­a/semana + alumnos |
| GET | /board/mine | alumno | Mis clases + saldo de deuda |
| POST/DELETE | /board/enroll | admin/profesor | Inscribir / desinscribir (fija genera mensualidad) |
| GET/POST | /asistencias/:instanceId | admin/profesor | Ver / registrar asistencia (+ deuda abierta/extra si asistiÃ³) |
| GET | /billing/preview?month= / /debtors?month= | admin/profesor | Deuda propuesta / deudores del mes |
| POST | /billing/generate?month= / /open / /release-slots | admin/profesor | Generar deudas, apertura de mes, liberar cupos |
| PUT | /billing/adjust/:deudaId | admin/profesor | Ajustar monto de una deuda |
| POST | /pagos / /pagos/batch | admin/profesor | Pago individual / por lote |
| GET | /pagos/student/:id | admin/profesor/alumno(propio) | Desglose de deuda + historial |
| GET | /pagos/summary?date= | admin/profesor | Resumen global de pagos por fecha |
| GET | /health | pÃºblico | Health check |

---

## Credenciales

| Credencial | Valor |
|-----------|-------|
| Admin seed | `admin@tenismanager.com` / `admin123` |
| Superusuario Pablo | `pablo@tenismanager.com` / `1414` (insertado manual vÃ­a SQL) |
| DB host | `137.184.178.21` (mismo que jockey) |
| DB user/password | (mismos que jockey â€” NO estÃ¡n en el repo) |
| DB name | `tenisriverside` |
| Render URL | `https://tenis-manager.onrender.com` |
| JWT_SECRET | `ts_riverside_2026_secret` (env var de Render) |
| Repo GitHub | `https://github.com/Pablobun/tenis-manager` |

---

## Lo que se hizo en ESTA sesiÃ³n

### 1. Artefacto HTML del manual del sistema
- **`frontend/public/manual-sistema.html`** (nuevo, autocontenido, en espaÃ±ol). Se sirve en `https://riversideclases.portaltorneos-riocuarto.com.ar/manual-sistema.html` tras el prÃ³ximo build/push. Contiene: introducciÃ³n + roles, manual de uso por rol (profesora/admin y alumno), arquitectura (stack, deploy, esquema BD, endpoints, ENUMs) y reglas/restricciones de las acciones. Credenciales como placeholder (sin contraseÃ±as reales).

### 2. Grilling completo de observaciones (skill grill-with-docs)
- Se listaron **15 observaciones** en `.scratch/tenis-manager/modificaciones.md` (usuario recorriÃ³ el sistema).
- Se grillaron **todas** y quedaron resueltas con decisiones concretas. **Detalle completo en `modificaciones.md`** â€” es la fuente principal de la prÃ³xima sesiÃ³n. Resumen:

| # | ObservaciÃ³n | DecisiÃ³n |
|---|---|---|
| 1/2 | Nav sin salida al panel / botÃ³n volver | **Barra de navegaciÃ³n persistente** adaptativa: bottom nav mobile / top bar PC + botÃ³n "MenÃº" con el resto de mÃ³dulos (componente compartido) |
| 3 | Vista semanal vacÃ­a (bug) | `dateStrings: true` en `db.js` + `inst.fecha.slice(0,7)` en `services/billing.js:13` |
| 4/9 | Candidatos poco visibles | Campo `pending_candidates` en `GET /instances/open`; badge Ã¡mbar "N candidatos" (cupo libre) / gris "N en lista de espera" (llena) en `/clases-abiertas` |
| 5 | Color por nivel | Chip de nivel: principiante red / intermedio green / avanzado amber; borde de tarjeta intacto (cupo) |
| 6 | Profesor por clase | Selector "Profesor/a" (solo rol `profesor`) en plantillas y abiertas; mostrar nombre en tablero/instancias/abiertas. Sin cambios de BD |
| 7 | Fecha NaN en instancias | Cubierto por fix del item 3 |
| 8 | Alumnos en instancias | `enrichInstancesWithStudents` en `GET /instances` + "Alumnos: N/M" con nombres |
| 10 | Campo "frecuencia" confuso | **Se elimina** del form y listado de plantillas |
| 11 | Perfil / contraseÃ±a | PÃ¡gina `/perfil` para todos (nombre+telÃ©fono editables; email/nivel solo lectura); `POST /auth/change-password` (actual+nueva+confirmar); reset de contraseÃ±a desde `/alumnos` (profe/admin) |
| 12 | Alerta al cambiar nivel | Al guardar en `/alumnos`, listar clases discrepantes con `fecha >= hoy` (solo informa) |
| 13 | FacturaciÃ³n poco clara | 8 mejoras: detalle por clase, cuenta "N clases Ã— $", estado mes/ciclo, saldo vs pagado, totales globales, columna Pagado, aviso inscripciÃ³n a mitad de mes, fondo generadas/pendientes |
| 14 | Deuda mensual ambigua | Aclarar "precio por clase Ã— N clases del mes" en form y facturaciÃ³n; **preguntar a la profe** al crear plantilla si genera fechas pasadas del mes en curso. Asistencia en fija NO afecta deuda |
| 15 | Monto a favor | Columna `saldo_a_favor` en `perfiles` (**Ãºnico cambio de BD**); excedente de pago â†’ saldo a favor; se aplica automÃ¡tico a prÃ³xima deuda; verde "a favor". **BD YA aplicada en producciÃ³n** |

### 3. Cambios de BD (item 15) â€” ya aplicados en producciÃ³n
- `backend/sql/schema.sql` â€” agregada `saldo_a_favor DECIMAL(10,2) NOT NULL DEFAULT 0` en `perfiles`.
- `backend/sql/migrations/001_saldo_a_favor.sql` â€” **nuevo**: script de referencia idempotente para SQLYog (agrega columna si no existe + inicializa con pagos huÃ©rfanos `deuda_id NULL`).
- **Nota**: la columna ya existe en la BD real; el script es solo referencia/replicaciÃ³n.

### 4. Pulido estÃ©tico del frontend â€” PLAN APROBADO
- **Paleta A "Verde cancha / aire"** (elegida): fondo verde tenue cÃ¡lido (`#F2F7F2` aprox.) en lugar de `gray-50` frÃ­o; tarjetas `rounded-xl/2xl` con borde sutil + borde de acento izquierdo + sombra difusa.
- **Header oscuro** (verde profundo `primary-800/900`, texto blanco) en todas las pantallas.
- Aplicar a **TODO el frontend** (login, dashboard/admin, tablero, plantillas, instancias, alumnos, clases-abiertas, facturaciÃ³n, pagos, mis-clases).
- Conservar chips de nivel (item 5) y badges de candidatos (item 4/9).
- Archivos clave: `tailwind.config.js` (paleta), `globals.css` (fondo body), headers y cards de cada `page.tsx`.
- Sin cambios de lÃ³gica.

### 5. ImplementaciÃ³n funcional (items 1-15 + pulido) â€” esta sesiÃ³n
- **Backend** (`node --check` OK): `db.js` (dateStrings), `services/billing.js` (`applySaldoToDebt`, applySaldo en ensureDebt/generate), `services/instances.js` (`enrichInstancesWithStudents`, `generateInstancesForMonth` con `includePast`), rutas `board/instances/templates/students/auth/pagos/billing/asistencias`.
- **Componentes nuevos**: `frontend/src/components/Navigation.tsx` y `LevelChip.tsx`.
- **Frontend** (`npm run build` OK, 16 rutas): login, dashboard, admin, tablero, mis-clases, plantillas, instancias, alumnos, clases-abiertas, facturaciÃ³n, pagos â†’ reescritos con Navigation + `.card`/`.btn-*`/`.input`/`.chip`; **`/perfil` nuevo**.
- Detalle de cada item en las secciones de la sesiÃ³n siguiente.

### 6. Manuales actualizados â€” esta sesiÃ³n
- **`frontend/public/manual-sistema.html`**: actualizado para reflejar los items 1-15 â€” Instancias (Alumnos N/M + nombres, profesor, chip nivel, `include_past`), Clases abiertas (badge de postulaciones, deuda neta en candidatos), Alumnos (reset de contraseÃ±a, alerta de nivel discrepante), FacturaciÃ³n (detalle expandible "N Ã— $", totales globales, estado mes/ciclo, inscripciÃ³n a mitad de mes, Pagado + saldo a favor), Pagos (saldo a favor, pago parcial/excedente), secciÃ³n Alumno (perfil, change-password, bloqueo por deuda neta), reglas de negocio (deuda neta en postulaciÃ³n, pagos/saldo a favor, alumnos), tabla de endpoints (change-password, profesores, `/pagos/student/:id` neto, generate con `include_past`) y esquema `perfiles` (saldo_a_favor).
- **`frontend/public/manual-usuario.html`** (nuevo): manual para el usuario final (alumno), mismo estilo/CSS pero SIN la secciÃ³n de Arquitectura ni el manual interno de profe/admin. InterpretaciÃ³n: "idÃ©ntico pero para usuario" = manual de alumno; si se querÃ­a copia literal solo sin la secciÃ³n 4, ajustar.
- `npm.cmd run build` OK tras los cambios (16 rutas).

### 7. Manual de la profesora + acceso al manual desde el sistema + skill responsive â€” esta sesiÃ³n
- **`frontend/public/manual-profesor.html`** (nuevo): **todo** el contenido de `manual-sistema.html` **sin el item de Arquitectura** (stack/deploy, esquema BD, endpoints, ENUMs). Incluye IntroducciÃ³n, Roles, Manual Profesora/Admin, Manual Alumno y Reglas y restricciones (renumerada de 5 â†’ 4). Mismo CSS/estilo.
- **Acceso al manual desde el sistema** (`Navigation.tsx`): enlace **"Manual"** en la barra persistente, con destino **segÃºn rol**:
  - **admin** â†’ `/manual-sistema.html` Â· **profesor** â†’ `/manual-profesor.html` Â· **alumno** â†’ `/manual-usuario.html`
  - DÃ³nde aparece: PC â†’ final de la barra superior; celular admin/profe â†’ dentro del panel "MenÃº"; celular alumno â†’ Ã­tem directo en la barra inferior (no tienen botÃ³n MenÃº).
  - Abre en **pestaÃ±a nueva** (`target="_blank" rel="noopener noreferrer"`).
- **Skill `doesntbreak` vendida** en `.opencode/skills/doesntbreak/` (SKILL.md + `references/patterns.md` + README MIT). DiseÃ±o responsive mobile-first (320px+), tailwind-aware, con modo review. Origen: `https://github.com/Kyaa-A/doesntbreak` (MIT Â© 2026 Asnari). **Auditada y segura** (solo markdown; se dejaron fuera a propÃ³sito los hooks/scripts/update-check del repo). AdaptaciÃ³n local: secciÃ³n 13 de `patterns.md` con tokens/patrones de Riverside. Se activa sola al tocar layout web; disponible reciÃ©n en la **prÃ³xima sesiÃ³n** (las skills se cargan al inicio).

### 8. Responsive mobile (items 16-18) + seed demo â€” esta sesiÃ³n
- **Item 16 Â· MenÃº mÃ³vil unificado** (`Navigation.tsx`): se elimina el panel desplegable que aparecÃ­a arriba del contenido y el botÃ³n **MenÃº ahora expande el propio bottom nav** en una segunda fila (`grid-cols-5`, `text-[11px]`, `truncate`) con Plantillas/Instancias/Alumnos/Mi Perfil/Manual â€” **todo en una sola zona, abajo**. Indicador â–´/â–¾. Alumno sin cambios (sus 3 Ã­tems van directos). PC sin cambios.
- **Item 17 Â· Tablas con scroll horizontal propio** (regla doesntbreak 9 "contain the scroll"): cada `<table>` envuelta en `<div className="overflow-x-auto">` y se quita el `card overflow-hidden` que recortaba el contenido. Aplicado en:
  - `facturacion/page.tsx` (2 tablas: deuda propuesta + apertura de mes).
  - `plantillas/page.tsx` (tabla de 9 columnas â€” el "Modâ€¦" truncado).
  - `alumnos/page.tsx` (tabla de 7 columnas).
- **Item 18 Â· Botones/headers con wrap**: `flex-wrap` + `gap` en los headers y acciones de `facturacion` (selector mes + Generar deudas + Abrir mes), `plantillas`, `alumnos`, `instancias` y `clases-abiertas` (tÃ­tulo + botÃ³n "+ Nuevaâ€¦").
- **PÃ¡ginas ya responsive (sin cambios)**: tablero, instancias, clases-abiertas, pagos, mis-clases, dashboard, admin, perfil, login (cards/grid, sin tablas anchas).
- **`backend/sql/seed-demo.sql`** (nuevo): seed de prueba **solo INSERT** (MySQL puro, sin DELETE â€” la limpieza la hace el usuario) para ejecutar en la BD real. ContraseÃ±a comÃºn **`demo123`** (hash bcrypt embebido), emails prefijo **`demo.*`**. Datos: 2 profesores + 12 alumnos (con deuda pendiente/parcial/pagada/atrasada, sin deuda, inactivo, saldo a favor Ã—2), 3 plantillas fijas con instancias del mes actual (dinÃ¡micas), inscripciones en clase fija, clase abierta futura con postulaciones (pendiente/aceptada/lista_espera), clase extra pasada con asistencia (deuda clase_extra), pagos (parcial/completo/huÃ©rfanos) y ciclos (mes anterior cerrado, mes actual abierto). Montos de mensualidad calculados con `COUNT(*)` de instancias (precio Ã— clases). **Pendiente de ejecutar por el usuario.**
- `npm.cmd run build` OK tras el responsive (16 rutas). Commit del usuario: `d93719b resposive`.

---

## SesiÃ³n siguiente (prioridad)

**Ya implementado (todo listo para push del usuario):**

- **Item 3/7 (bug semana)**: `dateStrings: true` en `db.js` + `inst.fecha.slice(0,7)` en `services/billing.js:13`. âœ”
- **Item 1/2 (nav)**: componente `Navigation.tsx` (bottom nav mobile / top bar PC oscura + "MenÃº") en TODAS las pÃ¡ginas. âœ”
- **Item 10**: campo `frecuencia` eliminado de form/listado de plantillas. âœ”
- **Item 15 (saldo a favor)**: excedente de pago â†’ `saldo_a_favor` en `pagos.js`; se aplica automÃ¡tico en `billing.js` (ensureDebt/generate), `asistencias.js`; balance neto en `/board/mine`, `/pagos/student/:id`, candidatos de abiertas, preview/debtors de facturaciÃ³n. âœ”
- **Items 4/9, 5, 6, 8**: `pending_candidates` (badge Ã¡mbar), `LevelChip`, `profesor_id`+`professor_name` (plantillas, abiertas, tablero, instancias), `enrichInstancesWithStudents` ("Alumnos N/M" + nombres). âœ”
- **Item 11**: `/perfil` (nombre/tel + change-password) + `POST /auth/change-password` + reset de contraseÃ±a desde `/alumnos`. âœ”
- **Item 12**: `PUT /students/:id` lista clases discrepantes futuras (warning, solo informa). âœ”
- **Item 13 (facturaciÃ³n)**: preview con detalle por clase, "N Ã— $", inscripciÃ³n a mitad de mes, totales globales, estado mes/ciclo, columna Pagado + saldo a favor en deudores. âœ”
- **Item 14**: pregunta `include_past` al crear plantilla y al regenerar mes; hint "mensualidad = precio Ã— clases del mes". âœ”
- **Pulido estÃ©tico**: Paleta A (`#F2F7F2`), header oscuro `Navigation`, clases reutilizables en `globals.css` (`.card`, `.btn-primary`, `.input`, `.label`, `.chip`, `.table-head`). âœ”
- **Items 16-18 (responsive)**: menÃº mÃ³vil unificado en una sola zona (bottom nav expandible), tablas con `overflow-x-auto` (facturaciÃ³n/plantillas/alumnos), headers con `flex-wrap`. âœ”

**PrÃ³ximo paso (pendiente del usuario):**
1. **Ejecutar `backend/sql/seed-demo.sql` en la BD real** (SQLYog o similar) para probar todos los escenarios con datos demo. ContraseÃ±a `demo123`, emails `demo.*`. Al terminar, el usuario **limpia los datos `demo.*`** (el script es solo INSERT, sin DELETE).
2. Verificar en **Render** los flujos contra BD real usando los datos demo:
   - PostulaciÃ³n con balance neto (item 15) y candidatos con `balance_favor` (Hugo/Elena pendientes, Irene lista_espera, LucÃ­a aceptada).
   - Preview de facturaciÃ³n con detalle/totales y generate con auto-saldo (Ana pendiente, Bruno parcial, Carla pagada, Gabriela atrasada).
   - Saldo a favor (Facundo $15000, LucÃ­a $5000) aplicÃ¡ndose a la prÃ³xima deuda.
   - `POST /auth/change-password` y reset desde `/alumnos`.
   - Regenerar mes con `include_past: false`.
3. Verificar frontend en el droplet con **hard refresh (Ctrl+F5) / incÃ³gnito**:
   - MenÃº mÃ³vil: al tocar "MenÃº" todo queda en la barra inferior (una sola zona), sin panel arriba.
   - Tablas de facturaciÃ³n/plantillas/alumnos con scroll horizontal propio (se desliza la tabla, no la pÃ¡gina).
   - Headers/botones sin cortes en pantallas chicas.
   - 3 manuales servidos + enlace "Manual" por rol.
4. Opcional: limpiar estado muerto en `mis-clases/page.tsx` (estado `profile/editing/form/saving/message/loading` + `fetchProfile`/`handleSubmit` quedaron sin uso tras quitar "Mi Perfil") â€” inofensivo, no bloquea build.

---

## Notas importantes

- **Nunca hacer commit/push**: es el usuario quien ejecuta git add/commit/push (regla AGENTS.md).
- **Esquema en espaÃ±ol**: tablas/columnas/ENUM en castellano (`fija`/`extra`/`abierta`, `programada`/`completada`/`cancelada`, `pendiente`/`aceptada`/`rechazada`/`lista_espera`). Nunca mandar `fixed`/`open`. El backend mapea columnas espaÃ±olas â†’ claves JSON en inglÃ©s. `instancias_clases.plantilla_id` es NOT NULL.
- **Windows**: la Execution Policy bloquea `npm.ps1` â†’ usar `npm.cmd run build` en frontend y `npm.cmd install` en backend.
- **VerificaciÃ³n local sin tests**: `node --check` por archivo (backend) + `npm.cmd run build` (frontend). Flujos contra BD real se prueban en Render tras push.
- **Sin `.env` local** no hay conexiÃ³n a BD (500 esperado); auth (401) y validaciones (400) se prueban con JWT firmado localmente (`node -e "console.log(require('jsonwebtoken').sign({id:1,rol:'admin'},'ts_riverside_2026_secret'))"` en `backend/`).
- **CachÃ© tras deploy**: verificar con hard refresh (Ctrl+F5) o incÃ³gnito. Un bundle viejo cacheado manda valores/endpoints viejos y confunde el diagnÃ³stico (lecciÃ³n del item 3).
- **mysql2**: las columnas DATE vuelven como objetos `Date` salvo que se setee `dateStrings: true` â€” causa del bug de semana (item 3) y del NaN (item 7).
- **Bug de zona horaria descartado** para la semana: el armado de fechas de `/board/week` da bien en UTC y Argentina; la causa real fue el tipo de dato de mysql2.
- Nginx: `root /var/www/tenis-manager;` + `location /api/` â†’ Render. Config versionada en `deploy/nginx-riversideclases.conf`.
- **Next.js**: `trailingSlash: true` genera carpetas (`clases-abiertas/index.html`).
- Roles en BD: `admin`, `profesor`, `alumno`.
- **Registro pÃºblico** (`POST /auth/register`) acepta `role` del body sin restricciÃ³n â€” posible escalada de privilegios a documentar/revisar (decisiÃ³n pendiente, no se grillÃ³).
- **Manuales** (en `frontend/public/`, servidos como estÃ¡ticos): `manual-sistema.html` (todo, con Arquitectura), `manual-profesor.html` (sin Arquitectura), `manual-usuario.html` (alumno, sin Arquitectura ni manual interno). Acceso desde la nav con el enlace **"Manual"** que redirige por rol. Recordar: los cambios a `frontend/public/` salen en el build de Next (output: export los copia a `out/`).
- **Skill `doesntbreak`**: `.opencode/skills/doesntbreak/` â€” solo markdown (sin scripts/red). Ya se aplicÃ³ para los items 16-18 (regla 9 "contain the scroll": envolver tablas anchas en `overflow-x-auto`, nunca dejar scroll horizontal en la pÃ¡gina).
- **Seed demo** (`backend/sql/seed-demo.sql`): solo INSERT (sin DELETE), contraseÃ±a `demo123`, emails `demo.*`. Ejecutar contra la BD real para probar; el usuario limpia lo `demo.*` al terminar. Montos de mensualidad se calculan con `COUNT(*)` de instancias del mes (precio Ã— clases), coherentes con facturaciÃ³n.

---

## Lote 2 + rediseÃ±o "Polvo de Ladrillo" (sesiÃ³n 2026-10-06 â€” commiteado y pusheado como `9982d0a cambios`)

**Spec**: `.scratch/tenis-manager/issues/13-cambios-lote2.md` (decisiones grill: baja propia alumno24h antes UTC-3, baja en fija = solo esa instancia, extras inscripciÃ³n directa `aceptada`/`lista_espera` sin candidatos, 50% del precio regular, replicaciÃ³n con roster solo en fijas, mails alumno+profe con Gmail App Password â†’ desactivado silencioso si faltan env vars `SMTP_HOST/SMTP_PORT/SMTP_USER/SMTP_PASS/MAIL_FROM`).

**Backend (node --check OK)**:
- `backend/sql/migrations/002_plantilla_alumnos.sql` + `schema.sql`: tabla `plantilla_alumnos` (roster de plantillas fijas).
- `backend/src/services/mailer.js` (nuevo): nodemailer no-op sin credenciales; `notifyClassChange` confirma alumno + aviso profe (omite si Ã©l es actor).
- `backend/src/services/instances.js`: `generateInstancesForMonth` inscribe roster solo en `modalidad='fija'`; instancia nueva â†’ grupo 'Grupo Principal' + INSERT IGNORE.
- `backend/src/routes/templates.js`: GET enriquecido con `students[]`; POST/PUT aceptan `student_ids`.
- `backend/src/routes/board.js`: `POST /board/drop` (alumno, lÃ­mite24h con startMs-24h, transacciÃ³n), `POST /board/enroll` con `force`, `DELETE /board/enroll` â€” mails en ambos.
- `backend/src/routes/instances.js`: open/postulate â†’ extra aceptada/lista_espera directo + mail; accept permite desde `lista_espera`; DELETE postulate cancela `pendiente`/`lista_espera`.

**Frontend (build OK,16 rutas)** â€” mundo visual `Polvo de Ladrillo` (polvo #B65434 / cal #F7F3EA / ficha #FFF / feltro #D9E24F solo acciÃ³n primaria / rojo cupo / verde pagado; display Archivo Narrow vÃ­a next/font; system stack UI; cifras tabular):
- Tokens: `tailwind.config.js` + `globals.css` (`.card` border-[1.5px], `.card-accent` left1px, court-line, day-in con reduced-motion, ::selection/caret/focus/scrollbars tematizados).
- `Navigation.tsx`: header/bottom-nav placa polvo, logo28px, `isActive` normaliza trailing slash.
- Tablero: **dÃ­a = cancha** (campo polvo con franjas horarias blancas y fichas encima), clase "Ahora" arriba con ring-white, `cupoColor` (extra/full â†’ rojo), force-add con warning.
- Mis-clases: baja propia24h (`canDropSelf`), inscripciÃ³n extra/waitlist, deuda.
- Plantillas: picker de alumnos (roster), hint 50%.
- Clases-abiertas: extras â†’ "Lista de espera", agregar/quitar directo, border rojo.
- Iconos: `frontend/src/components/icons.tsx` (chevrones/X SVG stroke-2 â€” sin glifos Unicode).
- Logo: `frontend/public/logo.png` (nuevo PNG procesado 800px blanco con alfa real â€” el original `imagens/logopng.png` traÃ­a el damero de transparencia quemado; login h16 + nav h28, next/image con `object-contain`, reemplaza al viejo `logo.jpeg` borrado); provenance embebida.

**Cierre impeccable**: detect limpio (`[]`); finish review **fix â†’ ship** (resueltos: cancha de horas, NaN fechas instancias, iconos SVG, copy "de octubre", nav activa, keylines1.5px); **`DESIGN.md` + `.impeccable/design.json` escritos en la raÃ­z**. Brief: `.impeccable/surfaces/frontend-src-app.md`; screenshots de evidencia: `.impeccable/review/*.png` (captura con fixtures + localStorage falso â€” script temporal `capture.mjs` en el temp del agente, no en el repo).

**Gotchas de la sesiÃ³n**:
- Captura headless: `localStorage.setItem('user', {"a":1})` guarda "[object Object]" â€” hay que serializar el JSON como string.
- `new Date('YYYY-MM-DDTHH:mm:ss' + 'T12:00:00')` â†’ NaN; normalizar con `split('T')[0]` antes de agrupar.
- Craft floor: **colored border-left >1px estÃ¡ prohibido** (side-tab) â€” el acento cupo vive en1px, el resto de la keyline en1.5px.
- El harness de imÃ¡genes mezcla attachments al leer PNGs (los subagentes leen bien; verificar contenido con `document.body.innerText` en la captura).

---

## Suggested skills

- **implement** â€” para ejecutar los items 1-15 y el pulido estÃ©tico con los tickets/documentos ya escritos.
- **to-tickets / to-issues** â€” si se quiere partir los 15 items en tickets de trabajo antes de implementar.
- **code-review** â€” revisar el diff de implementaciÃ³n antes del push del usuario.
- **grill-with-docs** â€” si surge una decisiÃ³n nueva de dominio (ej. arreglar el riesgo de `/auth/register`, o definir quÃ© pasa con las clases canceladas en facturaciÃ³n).
- **prototype** (rama UI) â€” opcional, si el pulido estÃ©tico quiere explorarse con variantes antes de decidir (ya se decidiÃ³ Paleta A, asÃ­ que probablemente no haga falta).
- **doesntbreak** â€” skill responsive mobile-first (ya aplicada en items 16-18); volver a usarla al tocar cualquier layout del frontend o para una revisiÃ³n responsive del conjunto.

---

## Out of scope (por ahora)

- Reportes y resumen mensual automÃ¡tico
- Notificaciones push/SMS
- Multi-academia
- Cobros electrÃ³nicos
- App mÃ³vil nativa
- PaginaciÃ³n avanzada
- ExportaciÃ³n a PDF/Excel
- **Visitantes** como rol propio (hoy usan cuenta `alumno`)
- Cambiar email del usuario (requiere verificaciÃ³n) â€” queda fuera por decisiÃ³n del item 11
- Arreglar el riesgo de `/auth/register` (rol desde el body)