# CONTEXT.md

Sistema para una profesora de tenis que administra clases, inscripciones y deudas. Glosario y lenguaje ubicuo — sin detalles de implementación.

## Términos canónicos

- **Clase** — una sesión de tenis en un **día**, una **franja horaria** (14h-20h) y un **nivel** (AVANZADO, INTERMEDIO, PRINCIPIANTE). No está ligada a un día de la semana; puede caer cualquier día.
- **Grupo** — conjunto de alumnos asignados a una misma franja. Pueden ser **parejas** (2) o grupos de **4**. El grupo define la tarifa del alumno.
- **Modalidad de la clase** — hay tres modalidades:
  - **Clase fija** — los alumnos están alistados por la profesora; no hay postulación abierta. El cupo lo administra ella directamente. Se cobra por **mes** (mensualidad), asista o no.
  - **Clase extra** — solo para alumnos fijos (y Visitantes). La profe la crea, los alumnos se postulan (flujo candidato). Precio: 50% del valor de la clase habitual. Se cobra por **asistencia** (mes vencido).
  - **Clase abierta/rotativa** — viernes PM y/o sábados AM. El ingreso es por **postulación**; los alumnos deciden si se inscriben o no (con cupo limitado). Se cobra por **asistencia**.
- **Nivel** — AVANZADO, INTERMEDIO, PRINCIPIANTE. Cada grupo/clase tiene un nivel asignado.
- **Alumno** — persona que participa del sistema (puede estar en clases fijas, abiertas o en espera). Tiene un nivel asignado.
- **Candidato** — postulación de un alumno a una **clase abierta**, pendiente de que la profesora la acepte o rechace.
- **Postulación** — el acto de un alumno por el que solicita entrar a una clase abierta; crea un candidato.
- **Cupo** — cantidad máxima de alumnos que una clase admite.
- **Lista de espera** — candidatos que no entraron al cupo y quedan disponibles para cubrir bajas posteriores. La profesora puede **borrar** candidatos; los no utilizados quedan pero dejan de tener valor cuando la clase ya se dictó.
- **Baja** — alumno que se retira de una clase; libera cupo y puede motivar la entrada de un candidato de la lista de espera o de otro grupo.
- **Alta directa** — entrada de un alumno a una clase decidida por la profesora sin postulación previa.
- **Deuda** — saldo pendiente de un alumno. Se **genera en base a las clases** y la profesora **carga los pagos** (resta). Unidad: **monto**.
- **Pago** — carga que hace la profesora sobre la deuda de un alumno; reduce el saldo pendiente.
- **Tarifa por clase** — modo de cobro donde la deuda se genera por **asistencia** (el alumno debe la clase que vino). Precio fijo por clase extra.
- **Tarifa mensual** — modo de cobro por **mensualidad**; el alumno debe la clase **asista o no** (ocupó cupo en el período). El monto total del mes = precio por clase × cantidad de clases del mes (varía mensualmente). La profe **define el precio por clase al crear la clase**.
- **Recurrencia de clase fija** — las clases fijas se planifican por **mes** (o por un rango de fechas preguntado a la profesora), no por semana.
- **Inasistencia** — no se recupera ni se descuenta. Las clases son **intransferibles**.
- **Visitante** — persona que puede asistir a clases extra; no es alumno fijo pero se postula a extras.

## Decisiones registradas

- La clase **no** se clasifica por día de la semana; la modalidad (fija/abierta) es independiente del día. Una clase fija puede caer un sábado; una abierta, cualquier día. En la **plantilla** de clase fija, `day_of_week` define la **recurrencia** semanal; las instancias de un mes se generan todas juntas (ticket 04).
- **Aceptación de candidato**: al aceptar, el postulado **ocupa cupo automáticamente**. Los no aceptados/incluidos quedan en **lista de espera**.
- **Revoloteo diario**: la profesora **arrastra** alumnos entre grupos; si el grupo excede el cupo, la interfaz lo avisa y ella decide a quién saca. Incluye cambios de horario, reemplazos y altas.
- **La profesora crea las clases** desde una **plantilla** (día, franja horaria, nivel, modalidad, cupo, precio, frecuencia). El sistema **genera las instancias del mes automáticamente** para las fijas.
- **La profesora define el precio por clase al crear la clase**. El sistema calcula el total del mes: precio × cantidad de clases del mes.
- **Deuda como condición de ingreso**: por ahora **bloquea** la postulación a clases abiertas; la profe puede **forzar la excepción** (dejarlo entrar a pesar de la deuda). Pendiente de confirmación con el cliente (puede cambiar).
- **Clases extras**: la profe las crea, los alumnos (fijos o Visitantes) se postulan (flujo candidato). Se cobra al mes vencido por asistencia.
- **Reserva condicionada al pago**: si no pagó, **no puede reservar cupo**. La profe tiene una **opción de excepción** para dejarlo entrar igual.
- **Ciclo mensual**: el sistema tiene un ciclo mensual (1-31 o rango custom). La profe marca quién pagó en cualquier momento del mes. Los que no pagaron pierden cupo al inicio del mes siguiente (o cuando la profe decida).
- **Reportes/resumen mensual**: **pendiente** (se ve después).
- **Multi-profesora**: las profesoras **comparten todo** (ven todos los alumnos y clases). No se restringe visibilidad.
- **Usuarios**: alumnos, profesora y **admin** (administrador del sistema con poder para hacer todo). Los alumnos acceden con **login** propio; la carga no recae solo en la profesora.
- **Registro de usuarios**: **mix** — hay alta por la profesora/admin y también registro/ingreso de alumnos con login.
- **Plataforma**: página **web responsive**, optimizada para ser usada principalmente desde el celular.
- **Vista del tablero**: **ambas vistas** — diaria (por defecto, swipe entre días) y semanal (toggle secundario). Navegación por mes con barra superior + picker.
- **Acciones por tap**: **bottom sheet** contextual (tap grupo → opciones: ver alumnos, agregar, mover, borrar).
- **Indicador de grupo**: nombres + nivel + cupo (ej: "SCOPPA / MALANO · Avanzado · 2/4"). La deuda NO se muestra en la grilla.
- **Reasignación de alumnos**: **tap + menú "Mover a..."** como flujo principal (no drag real en celular). Menú muestra **lista de todos los grupos del día** con nivel y cupo. Si el destino queda completo, aviso de confirmación ("Queda 4/4. ¿Mover?").
- **Vista del alumno**: pantalla principal = **Mis clases** (fijas + abiertas aceptadas + saldo de deuda arriba). Postulación a clases abiertas desde "Clases disponibles" en su dashboard. Deuda: saldo + desglose (clases del mes - pagos). Puede cancelar postulación mientras esté pendiente. Editar perfil: solo nombre y teléfono.
- **Generación de deuda mensual**: **semi-automática** — el sistema calcula y muestra, la profe aprueba o ajusta. Si un alumno se inscribe a una clase fija a mitad de mes, se le genera la deuda **al momento de inscripción**.
- **Registro de pagos**: **individual y por lote**. La profe ingresa el monto realmente pagado (personalizado). Si es parcial, la diferencia queda como deuda.
- **Histórico de pagos**: en el perfil del alumno → pestaña "Deuda" con desglose por mes. Además, un **resumen global por fecha** (todos los alumnos, por día de pago).
- **Excepciones de deuda/pago**: la profe tiene control total — puede mantener alumno con deuda, liberar cupo, o ajustar montos.
- **Apertura de mes**: el sistema avisa "hay alumnos sin pago", la profe decide si libera o mantiene cupos.
- **Generación de instancias**: cada plantilla fija genera **una instancia por cada aparición de su día de la semana en el mes** (ej. Lunes → 4-5 instancias). El campo `frequency` es metadata; para más clases por semana se crean más plantillas. Se genera solo para plantillas `fija` activas.
- **Edición de plantilla**: si cambia el día de la semana se borran las instancias futuras y se regenera el mes; si solo cambian hora/precio/cupo/nivel se **actualizan in-place** las instancias futuras sin tocar fechas.
- **Desactivar plantilla**: las instancias futuras pasan a `estado = cancelada` (quedan como historial) y deja de generar nuevas.
- **Clase abierta/rotativa (ticket 07)**: la profe crea la instancia **ad-hoc** (fecha, franja, nivel, cupo, precio) sin plantilla recurrente. Como `instancias_clases.plantilla_id` es `NOT NULL`, la instancia se respalda con una **plantilla inactiva** (nunca genera instancias recurrentes). La clase aparece en el tablero de la profe y en **"Clases disponibles"** del alumno.
- **Postulación a clase abierta (tickets 07/09)**: el alumno se postula desde "Clases disponibles" → fila en `postulaciones` con estado `pendiente`; la profe acepta/rechaza (desarrollado en el ticket 09). El estado de la postulación se muestra al alumno en la tarjeta de la clase (Pendiente / Inscripto / Lleno).
- **Valores ENUM en BD**: las modalidades se almacenan como `fija` / `extra` / `abierta` y los estados como `programada` / `completada` / `cancelada` / `pendiente` / `aceptada` / `rechazada` / `lista_espera` (castellano, nunca `fixed` / `open`). El backend mapea columnas españolas a claves JSON en inglés (`fecha as instance_date`, `estado as status`, `nombre_completo as full_name`).
- **Flujo de postulaciones (ticket 09)**: aceptar un candidato lo **inscribe al grupo automáticamente** (ocupa cupo). Rechazar lo manda a **lista de espera**. La profe tiene botón **Forzar/Override** para aceptar a pesar de deuda o cupo lleno. Si el cupo está lleno al postularse, la postulación va **directo a lista de espera**. El alumno puede **cancelar** su postulación mientras esté pendiente; tras `cancelada`/`rechazada` puede volver a postularse.
- **Clase extra (ticket 10)**: misma mecánica de creación ad-hoc que la abierta (plantilla inactiva de respaldo + grupo "Grupo Extra"), modalidad `extra`, precio sugerido 50% de la clase habitual. Postulación igual que abierta. **Marcar asistencia en abierta/extra y "asistió" genera la deuda** (`clase_abierta`/`clase_extra`) por esa instancia (`/asistencias`).
- **Facturación mensual (ticket 11)**: semi-automática — `GET /billing/preview` calcula alumnos × precio × clases fijas del mes sin escribir; la profe revisa y `POST /billing/generate` crea las deudas `mensualidad` (una por alumno/mes, `mes_facturacion`, vinculadas a `ciclos_facturacion`). Inscribir a un alumno a mitad de mes a una fija genera la deuda de mensualidad **al momento** (`/board/enroll`). Apertura de mes (`POST /billing/open`) cierra ciclos anteriores, y `GET /billing/debtors` lista a quién no pagó; `POST /billing/release-slots` libera los cupos de un deudor.
- **Pagos (ticket 12)**: `POST /pagos` individual y `POST /pagos/batch` por lote (monto por alumno). El pago se aplica a la deuda pendiente más antigua (o a una `deuda_id` explícita), suma `monto_pagado` y recalcula `estado` (pendiente/parcial/pagada). Pago parcial deja diferencia como deuda. Desglose por mes + historial por alumno en `/pagos/student/:id` (visible por el propio alumno o admin/profesor). Resumen global por fecha en `/pagos/summary`.
- **Monto a favor (grilling)**: si un pago supera la deuda, el **excedente queda como saldo a favor del alumno** (`saldo_a_favor` en `perfiles`). El balance del alumno = deuda − saldo a favor; si da negativo se muestra "a favor". El saldo a favor **se aplica automáticamente** a la próxima deuda del alumno, y la profe también puede usarlo como pago manual.
- **Balance neto en postulaciones (grilling)**: la condición de deuda que bloquea la postulación a clases abiertas usa el **balance neto** (deuda − saldo a favor), no la deuda bruta. Un alumno con saldo a favor que cubra su deuda no queda bloqueado.
- **Deuda mensual (grilling)**: confirmado que la mensualidad de clase fija = **precio por clase × cantidad de clases del mes** (asista o no). Al crear una plantilla en el mes en curso, se **pregunta a la profe** si genera también las fechas ya pasadas del mes. La **asistencia en fija NO afecta la deuda**; en abierta/extra la deuda nace al marcar "asistió".
- **Profesor por clase (grilling)**: cada clase y plantilla tiene un **profesor asignado** (elegible al crearla, entre las cuentas rol `profesor`; el admin no figura). El nombre del profesor se muestra en el tablero, instancias y clases abiertas, y el alumno lo ve en sus clases.
- **Nivel y color (grilling)**: el nivel de una clase se indica con un **chip de color** (principiante=rojo, intermedio=verde, avanzado=ámbar). El borde de la tarjeta de clase NO se usa para el nivel: sigue significando cupo (rojo=lleno) en el tablero.
- **Cambio de nivel del alumno (grilling)**: al cambiarle el nivel desde Alumnos, el sistema **informa las clases (fecha >= hoy) donde el alumno quedó con nivel discrepante** (solo informa, no modifica).
- **Perfil de usuario (grilling)**: cada usuario tiene su perfil (todos los roles): edita nombre y teléfono; el email y el nivel son solo lectura. Cada usuario **cambia su contraseña** (actual + nueva). La profe/admin puede **resetear la contraseña** de un alumno desde Alumnos.

## Términos en disputa

- (vacío por ahora)