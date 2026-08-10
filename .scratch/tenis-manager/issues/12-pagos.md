# 12 — Pagos

**What to build:** Registro de pagos individual y por lote. Monto personalizado (parcial permitido). Historial de pagos por alumno. Resumen global por fecha. La profesora puede forzar entrada a pesar de deuda.

**Blocked by:** 11-facturacion-mensual

**Status:** ready-for-agent

- [ ] Profesora puede registrar pago individual (alumno, monto, fecha)
- [ ] Profesora puede registrar pago por lote (varios alumnos, mismo monto)
- [ ] Monto personalizado (parcial = diferencia como deuda)
- [ ] Pago registrado en tabla `payments` con fecha y monto
- [ ] Deuda del alumno se actualiza (paid_amount += pago)
- [ ] Perfil del alumno muestra desglose de deuda por mes
- [ ] Resumen global: todos los alumnos, por día de pago
- [ ] Override: profesora puede forzar reserva de cupo sin pago
- [ ] Test: registrar pago reduce deuda correctamente
- [ ] Test: pago parcial deja diferencia como deuda
- [ ] Test: resumen global muestra pagos por fecha
