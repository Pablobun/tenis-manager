# 14 — Lote 3: compañeros de clase, modal de sponsors, modal centrado y correcciones del chequeo

**What to build:** 4 frentes acordados con la clienta: (1) el alumno ve quiénes más están en sus clases y en las disponibles, (2) modal de publicidad/sponsors que se abre 1×/día en la vista alumno con grilla de banners linkados, (3) la UI de agregar alumno de la profe pasa de bottom sheet a modal centrado, (4) correcciones de las brechas encontradas en la auditoría de `cambios.txt`.

**Blocked by:** —

**Status:** done

## Auditoría de `cambios.txt` (2026-10-07) — chequeo pedido por la clienta

| # | Pedido | Veredicto |
|---|---|---|
| 1 | Baja propia del alumno (24h antes) | ✅ `backend/src/routes/board.js:265,296` — aplica a todas las modalidades (decisión grill) |
| 2 | Extras: baja + cancelar postulación + inscripción directa | ✅ `backend/src/routes/instances.js:158-182` (directo a `aceptada`/`lista_espera`) |
| 3 | Profe agrega/forza alumnos | ⚠️ solo en Tablero (`tablero/page.tsx:197`); falta en Clases Abiertas e Instancias |
| 4 | Baja en fija (solo esa instancia) | ✅ `board.js:262-336` — no toca mensualidad |
| 5 | Replicación: fijas con roster / extras vacías / abiertas sin traslado | ✅ `services/instances.js:66-76,112-131` |
| 6 | Extra con contorno llamativo | ⚠️ falta en "Clases Disponibles" (`mis-clases/page.tsx:374`); hoy es keyline izq. 1px, no contorno completo |
| 7 | Extra ajena cobra 50% | ⚠️ NO automático: solo hint "Sugerido: 50%" en forms (`plantillas:398`, `clases-abiertas:493`); cobro = `precio × 1` al asistir (`asistencias.js:65`). Sin distinción dueño/ajeno. **Decisión nueva: automático + editable (ver abajo)** |
| 8 | Plantilla con alumnos fijos | ✅ `plantilla_alumnos` + selector en form (`plantillas/page.tsx:406-438`) |
| 9 | Edición subida/baja vista profe | ⚠️ = P3: solo Tablero |
| 10 | Mails subida/baja | ⚠️ 5 rutas mandan; **falta en override ("Forzar")** `instances.js:388-429`, `billing.js:260` release-slots y cancelar/eliminar clase con inscriptos |

**Menores detectados:** asimetría 24h (inscribirse sin límite, no poder bajarse <24h); panel "esperando cupo" de extras muestra inscriptos (`GET /candidates` sin filtrar `aceptada`); `DELETE /postulate` rechaza `aceptada` (anulación de extra aceptada no existe en UI); `/board/enroll` no valida `estado` de instancia.

## Decisiones (questionnaire 2026-10-07)

1. **Compañeros**: visibles en *Mis Clases* (clases en las que ya está) **y** en *Clases Disponibles*; **todos** los inscriptos (incluido yo); no hay pendientes en extras (auto-inscripción directa).
2. **Publicidades**: carpeta `frontend/public/banners/` + config en código `frontend/src/ads.ts` (`{ src, href }` → link al Instagram/página del anunciante). **Modal** al entrar al sistema, **1×/día** (marca de fecha en `localStorage`). **Grilla**: 2 por fila en celular, `md:grid-cols-3`, 4 por fila en PC. Solo vista alumno. Diseño de referencia (imágenes de la clienta, páginas de torneos): panel blanco centrado, **barra verde** "¿Querés ser sponsor?" + ✕, subtítulo "Apoyan este evento" → copy nuestro "Apoyan este sistema", tarjetas blancas redondeadas, cada una es `<a target="_blank">`.
3. **Modal centrado**: el bottom sheet actual (`tablero/page.tsx:461`, único overlay del repo) pasa a modal centrado; crear `components/Modal.tsx` reutilizable; actualizar `DESIGN.md` (sección Bottom Sheet) y `CONTEXT.md:46`.
4. **P7 — 50% automático + editable**: al crear/editar una extra, el precio se pre-carga con **50% del precio de la plantilla fija activa del mismo nivel** (fallback: cualquier fija activa; si no hay: vacío); la profe puede editarlo.
5. **P6 — look verde (elegido por la clienta en vez de rojo)**: contorno perimetral **verde** + fondo tintado verde suave en extras, en **todas** las vistas; elegir un verde que no colisione con "verde = pagado" del sistema de diseño.
6. **Brechas a corregir en este lote**: P3/P9 (alta/baja en Clases Abiertas), P6, P10 (mail en "Forzar"), panel "esperando cupo" limpio, anular extra aceptada (con regla 24h), P7.
7. **Postergado**: centrado del calendario en vista PC (fase 5, aparte).

## Criterios

- [x] F1 — `/board/mine` y `/instances/open` devuelven `students[]` (solo id/nombre/nivel); alumno ve "Compañeros: N" + nombres en Ambas secciones de `/mis-clases`
- [x] F2 — Modal de sponsors con grilla 2/3/4 columnas, links externos, 1×/día, solo alumno, config en `ads.ts`, carpeta `public/banners/`
- [x] F3 — Bottom sheet del tablero convertido a modal centrado; `components/Modal.tsx` creado; `DESIGN.md`/`CONTEXT.md` actualizados
- [x] F4a — Extras con contorno + tinte verde en todas las vistas (incl. Clases Disponibles)
- [x] F4b — Alta (forzar) y baja de inscriptos en Clases Abiertas
- [x] F4c — Mail en override ("Forzar")
- [x] F4d — "Esperando cupo" no lista inscriptos aceptados
- [x] F4e — Anulación de extra aceptada desde Clases Disponibles (24h)
- [x] F4f — Precio de extra pre-cargado al 50% de la fija del mismo nivel, editable
- [x] Verificación: `node --check` + `npm.cmd run build` + impeccable detect `[]` + finish review

## Comments

- **2026-10-07** — Auditoría completa contra el código (ver tabla). Creado el issue con el plan de las 5 fases. Pendiente: ejecución F1→F4 (F5 aparte).

- **2026-10-07** — Implementado F1→F4f + bugfix SQL (alias SELECT alineados a whitelist). Finish review: fix (5 hallazgos) → 2 batches → **disposition: ship** (todos los hallazgos resueltos, sin regresiones). Detect [], build OK.