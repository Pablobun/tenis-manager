# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Profesora(s) de tenis** — administran todo el sistema: crean clases (plantillas fijas, extras, abiertas), gestionan alumnos, asistencias, deudas y pagos. Uso mayoritario desde el celular, en el club.
- **Alumnos** — login propio; ven sus clases, se inscriben a extras/clases abiertas, se dan de baja, consultan su deuda y saldo.
- **Admin** — control total del sistema, incluye gestión de cuentas.

## Product Purpose

Web app responsive (mobile-first) para que una profesora de tenis administra clases, inscripciones, asistencias y deudas sin planillas Excel ni gestión por WhatsApp. Éxito: la profe dedica el mínimo tiempo a la administración y los alumnos se autogestionan (inscripciones, bajas, consulta de deuda).

## Positioning

Sistema todo-en-uno de gestión de club de tenis con facturación **semi-automática y verificable**: el sistema calcula la mensualidad (precio por clase × cantidad de clases del mes) y muestra la cuenta, la profe aprueba o ajusta. Los alumnos se inscriben y dan de baja solos bajo reglas de negocio (cupo, balance neto de deuda) que la profe siempre puede exceder a mano.

## Operating Context

- Club: **Tenis Riverside Country Club** (Río Cuarto, Argentina). Dominio: `riversideclases.portaltorneos-riocuarto.com.ar`.
- Uso principal: **celular** (375px), también PC.
- Deploy: frontend Next.js estático → droplet DigitalOcean (nginx + rsync vía GitHub Actions); backend Express → Render; MySQL en el droplet.
- Base de datos con esquema en **español** (tablas, columnas, ENUMs); la API traduce a JSON en inglés.
- Notificaciones por mail: cuenta **Gmail nueva** dedicada a envíos (credenciales pendientes; requiere 2FA + App Password, límite ~500 mails/día, holgado para la escala del club).
- Verificación: sin framework de tests; validación manual (`node --check` por archivo backend, `npm run build` frontend, flujos reales en Render).

## Capabilities and Constraints

- Roles: `admin`, `profesor`, `alumno`.
- Modalidades de clase: **fija** (mensualidad, asista o no), **extra** (50% del valor de la clase habitual, cobro por asistencia), **abierta/rotativa** (postulación con cupo).
- Ciclo mensual de facturación: deudas, pagos individuales y por lote, saldo a favor, liberación de cupos.
- Deuda condiciona inscripciones y postulaciones; la profe puede forzar excepciones (override).
- **10 cambios en curso** (`cambios.txt`): bajas de alumnos (abiertas con 24h de anticipación, fijas, extras), extras con inscripción directa sin candidatos, alta forzada por la profe, replicación mensual con alumnos en fijas y vacías en extras, borde verde en extras (decisión de la clienta: verde en todas las vistas, no rojo), cobro 50% en extras, plantillas con alumnos fijos precargados, edición de altas/bajas en vista profe, notificaciones por mail al subir/bajar de clases.
- **Abierto / decisión pendiente**: `POST /auth/register` acepta `role` del body sin restricción (posible escalada de privilegios).

## Brand Commitments

- Logo del cliente: `imagens/logo.jpeg` — wordmark "Tenis" en script blanco sobre fondo negro, "RIVERSIDE COUNTRY CLUB" en mayúsculas, pelota como detalle tipográfico. El usuario lo marcó explícitamente como **guía de diseño** para el trabajo visual del sistema.

## Evidence on Hand

- `cambios.txt` — lista de cambios pedidos por el cliente.
- `CONTEXT.md` — glosario y decisiones de dominio.
- `.scratch/tenis-manager/` — PRD, handoff, modificaciones (ítems 1-18 resueltos), tickets e issues.
- `frontend/public/manual-*.html` — manuales de usuario por rol.
- `backend/sql/seed-demo.sql` — datos de prueba (pendiente de ejecutar por el usuario).
- `imagens/logo.jpeg` — logo del cliente.
- **Ausencias que no deben fabricarse**: sin credenciales SMTP todavía; sin suite de tests; sin material de marketing ni testimonios.

## Product Principles

1. **Mobile-first**: la pantalla de 375px es el caso principal; PC es secundario.
2. **La profe manda**: el sistema calcula y propone, ella aprueba; toda excepción es manual y reversible.
3. **Trazabilidad de la plata**: toda deuda y pago muestra su cuenta (precio × clases, pagado, saldo a favor).
4. **Verdad en español**: esquema y ENUMs de la base en castellano; nunca valores ingleses en la BD.
5. **Sin sorpresas post-deploy**: verificación manual explícita (build + hard refresh) porque no hay tests automatizados.
