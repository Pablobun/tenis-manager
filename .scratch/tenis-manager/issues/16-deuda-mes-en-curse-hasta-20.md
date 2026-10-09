# 16 — Deuda del mes en curso: gracia hasta el día 20 (y cierre del override `force` del alumno)

**What to build:** un alumno con deuda del **mes en curso** debe poder postularse a clases abiertas **hasta el día 20 inclusive**; a partir del día 21 la deuda bloquea. La deuda de meses anteriores sigue bloqueando siempre. El mensaje de bloqueo **no cambia** (el actual: *"Tenés una deuda pendiente. Consultá a la profesora para postularte."*).

**Blocked by:** —

**Status:** done

## Problema reportado (2026-10-09)

> El alumno tiene deuda y no lo deja inscribir en clases, pero la deuda que tiene es la del mes en curso. Debería darle hasta el 20 del mes en curso con la deuda si la deuda corresponde al mismo mes.

## Decisión

- **Gracia**: deuda con `mes_facturacion` = mes actual no bloquea hasta el día **20 inclusive** (hora Argentina, UTC−3); el 21 en adelante bloquea.
- **Deuda vieja**: `mes_facturacion` distinto al mes actual (incluye `NULL`) bloquea siempre.
- **Balance neto**: se mantiene — el saldo a favor cubre primero la deuda vieja y después la del mes.
- **Mensaje**: único, el existente, sin cambios para ambos casos.
- **Cierre de seguridad (hallazgo relacionado)**: `POST /open/:id/postulate` aceptaba `force` en el **body del alumno** (`instances.js:136`) y con `force: true` se salteaba el chequeo de deuda sin ninguna autorización. El frontend mandaba `force: false` pero eso es solo cortesía del cliente. Fix: el endpoint ya **no lee `force`**; el override legítimo sigue en los endpoints de la profe (`PUT /open/:id/accept` y `POST /board/enroll`, que exigen rol `profesor`/`admin`).

## Alcance

- `backend/src/routes/instances.js` — gate de deuda reescrito (split deuda_mes/deuda_vieja + día 20) y `force` eliminado del body.
- `CONTEXT.md` — regla de deuda como condición de ingreso + balance neto actualizados.

## Verificación

- `node --check backend/src/routes/instances.js` OK.
- Prueba local con JWT (4 casos): deuda mes en curso día ≤ 20 → pasa; día > 20 → bloquea (mensaje actual); deuda mes anterior → bloquea; saldo a favor cubre → pasa.
- Flujos reales contra BD → verificar en Render tras el push del usuario.
