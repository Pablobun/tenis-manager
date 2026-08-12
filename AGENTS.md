# Agent skills

### Reglas de commit y push.

Nunca hacer commit ni push sin que el usuario lo pida explícitamente. Solo guardar cambios en archivos. El usuario es quien ejecuta git add, commit y push.

### Issue tracker.

Local markdown. El repo está en GitHub pero los issues viven en `.scratch/<feature>/`. Ver `docs/agents/issue-tracker.md`.

### Triage labels

Los 5 roles canónicos con strings por defecto. Ver `docs/agents/triage-labels.md`.

### Domain docs.

Single-context (raíz). `CONTEXT.md` existe en la raíz y es la fuente del glosario/decisiones. `docs/adr/` aún no existe; se crea lazy con `/grill-with-docs`. Ver `docs/agents/domain.md`.

### Esquema de BD en español (crítico).

Todas las tablas, columnas y valores ENUM están en **castellano** (`perfiles`, `plantillas_clases`, `instancias_clases`, `grupos`, `grupo_alumnos`, `postulaciones`, `asistencias`, `deudas`, `pagos`). Valores ENUM: `fija`/`extra`/`abierta`, `programada`/`completada`/`cancelada`, `pendiente`/`aceptada`/`rechazada`/`lista_espera`, `admin`/`profesor`/`alumno`. El backend mapea columnas en español a claves JSON en inglés (`fecha as instance_date`, `estado as status`, `nombre_completo as full_name`, `modalidad as modality`). **Nunca mandar valores ENUM en inglés** (`fixed`/`open`): MySQL los rechaza con error `1265` / `WARN_DATA_TRUNCATED`. `instancias_clases.plantilla_id` es `NOT NULL`: las clases abiertas ad-hoc se respaldan con una plantilla inactiva.

### Caché del navegador tras deploy.

Next.js estático genera bundles con hash, pero el HTML puede quedar cacheado (navegador/nginx). Tras un push, verificar siempre con hard refresh (Ctrl+F5) o ventana de incógnito; un bundle viejo cacheado sigue mandando valores/endpoints viejos y confunde el diagnóstico.

### Verificación local (no hay framework de tests).

Convención del proyecto: verificación **manual** + build. Backend: `node --check` por archivo, arrancar `node server.js` y probar auth/validaciones con un JWT firmado localmente (`node -e "console.log(require('jsonwebtoken').sign({id:1,role:'admin'},'test'))"` en `backend/`). Frontend: `npm run build`. En Windows la Execution Policy bloquea `npm.ps1` → usar `npm.cmd run build`.

### BD real.

Los credenciales de la BD (de jockey) **no están en el repo**. Sin `.env` real, las rutas que tocan datos devuelven 500 (esperado). Los flujos contra la BD se verifican en Render tras el push del usuario. El schema ya está ejecutado (`backend/sql/schema.sql`).

### Handoff.

El estado vivo del proyecto está en `.scratch/tenis-manager/handoff.md` (actualizarlo al cerrar sesión). Issues en `.scratch/tenis-manager/issues/`, tickets/decisiones en `.scratch/tenis-manager/tickets/`.
