# 08 — Dashboard del Alumno

**What to build:** Pantalla principal del alumno: "Mis clases" (fijas + abiertas aceptadas), "Clases disponibles" (abiertas/extras para postularse), y saldo de deuda arriba. El alumno entra y ve todo lo relevante sin navegar.

**Blocked by:** 01-auth-scaffolding, 02-gestion-alumnos, 04-generacion-instancias

**Status:** ready-for-agent

- [ ] Sección "Mis clases": clases fijas asignadas + abiertas aceptadas
- [ ] Cada clase muestra: día, hora, nivel
- [ ] Sección "Clases disponibles": clases abiertas/extras con cupo
- [ ] Cada clase disponible muestra: fecha, hora, nivel, cupo, botón "Postularme"
- [ ] Saldo de deuda arriba (monto total pendiente)
- [ ] El alumno solo ve sus propios datos (RLS)
- [ ] Loading states y empty states
- [ ] Test: alumno ve solo sus clases
- [ ] Test: alumno ve clases disponibles para postularse
