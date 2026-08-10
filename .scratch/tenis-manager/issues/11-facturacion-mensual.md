# 11 — Facturación Mensual

**What to build:** Generación semi-automática de deuda mensual para alumnos de clases fijas. El sistema calcula: alumnos × precio × clases del mes. La profesora aprueba o ajusta. Apertura de mes: sistema avisa quién no pagó, profesora decide si libera cupos. Inscripción a mitad de mes genera deuda al momento.

**Blocked by:** 04-generacion-instancias

**Status:** ready-for-agent

- [ ] Edge Function calcula deuda mensual (alumnos fijos × precio × clases)
- [ ] Profesora ve resumen y aprueba/ajusta antes de confirmar
- [ ] Deuda generada queda en tabla `debts` con estado pending
- [ ] Al alumno se inscribir a mitad de mes genera deuda inmediata
- [ ] Apertura de mes: lista de alumnos sin pago
- [ ] Profesora puede liberar o mantener cupos de no pagados
- [ ] Ciclo de facturación registrado en `billing_cycles`
- [ ] Test: generar deuda crea registros correctos
- [ ] Test: inscripción a mitad de mes genera deuda proporcional
