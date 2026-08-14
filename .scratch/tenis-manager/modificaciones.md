# Modificaciones

Lista corrida de cosas detectadas en el sistema. Se actualiza a medida que se encuentran.

## Decisiones resueltas (grilling con docs)

### 1/2 · Navegación — barra persistente adaptativa
Se agrega una **barra de navegación persistente** con un componente compartido reutilizado en todas las pantallas:
- **Celular**: barra inferior fija (bottom nav) con los módulos clave (Tablero, Clases Abiertas, Facturación, Pagos, Menú).
- **PC**: barra superior con los enlaces + nombre de usuario + Salir.
- Un botón **Menú** abre el resto de los módulos (Plantillas, Instancias, Alumnos) en un panel desplegable/lateral.
- Reemplaza la redirección sin salida del login de profe → tablero y agrega el "volver al panel" en todas las pantallas.

### 3 · Vista semanal vacía — bug de tipo de dato (FIX)
**Causa raíz**: mysql2 devuelve columnas `DATE` como objetos `Date` (UTC) porque `dateStrings` default es `false`. En `GET /board/week` el agrupado `byDate[inst.instance_date]` (board.js:120) usa la fecha como objeto `Date`, cuya string (`"Thu Aug 13 2026..."`) nunca coincide con las claves string del bucket (`'2026-08-10'`) → todas las instancias quedan fuera → 7 días vacíos. `/board/day` no hace bucketing, por eso funcionaba.
**Fix aprobado**:
- `backend/src/db.js`: agregar `dateStrings: true` al pool.
- `backend/src/services/billing.js:13`: `inst.fecha.toISOString().slice(0, 7)` → `inst.fecha.slice(0, 7)` (único punto que rompía con el cambio global).
- Corrige también el item 7 (NaN).

### 4/9 · Indicador de candidatos en clases abiertas
- El listado de candidatos ya existe en `/clases-abiertas` (botón "Candidatos"); lo que falta es **feedback visual**.
- Backend: agregar campo liviano `pending_candidates` (conteo de postulaciones `pendiente`) a `GET /instances/open`.
- Frontend (solo en las tarjetas de `/clases-abiertas`):
  - **Cupo disponible + candidatos pendientes** → badge **ámbar** "N candidatos" (llama a actuar).
  - **Clase llena + candidatos pendientes** → badge **gris** "N en lista de espera" (informa, no urgencia).
  - Sin pendientes → sin badge.

### 5 · Color por nivel de clase
- **Chip/pill de nivel** con fondo de color suave junto al texto del nivel (tablero, instancias, mis-clases, clases-abiertas):
  - Principiante → `red-100` / `red-700`.
  - Intermedio → `green-100` / `green-700`.
  - Avanzado → `amber-100` / `amber-700`.
- El **borde de la tarjeta NO se toca**: sigue significando cupo (rojo = lleno) en el tablero.

### 6 · Profesor por clase
- **Selector "Profesor/a"** en el form de plantillas y de clases abiertas; default = quien crea.
- El backend usa el `profesor_id` elegido en vez de `req.user.id` (templates.js:59 / instances.js:367).
- El selector lista **solo rol `profesor`** (el admin no figura).
- Se muestra el nombre del profesor en tablero, instancias y clases-abiertas (además de lo que ya ve el alumno en mis-clases).
- **Sin cambios de BD**: `profesor_id` ya existe en `plantillas_clases` y `instancias_clases` (schema.sql).

### 7 · Fecha "NaN" en instancias
Cubierto por el fix del item 3 (`dateStrings: true`): las fechas vuelven como `YYYY-MM-DD` limpio y el frontend deja de romperse al parsear.

### 8 · Alumnos en las clases de Instancias
- Reusar `enrichInstancesWithStudents` en `GET /instances?month=` (hoy no enriquece).
- En la tarjeta de cada instancia de `/instancias`: línea "Alumnos: **N/M**" y los nombres debajo (o "Sin alumnos").

### 10 · Campo "frecuencia" en plantillas — se elimina
- `frecuencia` es metadata muerta (default 1, no se usa en ninguna lógica). La recurrencia la da el día de la semana (1 instancia por aparición del día en el mes).
- **Se saca el campo** del form de creación de plantillas y del listado.

### 11 · Perfil de usuario (datos + contraseña)
- Página dedicada **`/perfil`** accesible para **todos los roles** (admin, profesor, alumno), enlazada desde la barra de navegación nueva (items 1/2). El perfil sale de `/mis-clases` (ahí quedan solo "Mi Deuda / Mis Clases").
- **Editable**: nombre y teléfono. **Solo lectura**: email (es el login) y nivel (lo maneja la profe desde `/alumnos`).
- **Cambiar contraseña propia**: contraseña actual + nueva + confirmar → nuevo endpoint `POST /auth/change-password` (verifica la actual, hashea con bcrypt, actualiza `password_hash`). Sin tocar BD (columna ya existe).
- **Reset de contraseña desde `/alumnos`** (profe/admin): botón "Cambiar contraseña" que setea una nueva sin pedir la actual (hasheada) — para cuando el alumno pierde el acceso.
- La edición de datos del alumno (nombre/teléfono/nivel/activo) ya existe (`PUT /students/:id` desde `/alumnos`) y queda como está.

### 12 · Alerta al cambiar el nivel del alumno
- Al guardar el cambio de nivel en `/alumnos`, el sistema **chequea las clases (fijas/abiertas) donde el alumno está inscripto** con `fecha >= hoy`, compara el nivel de cada clase con el nuevo nivel del alumno y **lista las discrepantes** (solo informa, no modifica nada).
- Las clases **pasadas** no cuentan.

### 13 · Claridad de la facturación mensual
En `/facturacion` se agrega/mejora:
1. **Detalle por clase**: expandir y ver cada clase del mes (fecha, hora, precio individual) que compone el monto.
2. **Cuenta del cálculo**: "N clases × $precio = total" por alumno.
3. **Estado del mes/ciclo**: abierto/cerrado y qué deudas ya se generaron.
4. **Saldo vs. pagado** en la tabla de deudores: monto total, ya pagado y lo que falta.
5. **Totales globales del mes**: total general a cobrar, cantidad de alumnos con deuda y total ya pagado.
6. **Columna "Pagado"** en las tablas, además del saldo.
7. **Aviso de inscripción a mitad de mes**: si un monto difiere de precio × clases (deuda inmediata), indicarlo (ej. "incluye inscripción del 15/08").
8. **Distinción visual** generadas vs. pendientes (fondo verde suave = ya generada, blanco = pendiente).

### 14 · Cálculo de deuda mensual (clase fija)
- El modelo registrado en `CONTEXT.md` se confirma: la **mensualidad = precio por clase × cantidad de clases del mes** (ej. $10 × 4 clases = $40). La lógica no cambia.
- Al **crear la plantilla** en el mes en curso, el sistema **pregunta a la profe**: "¿Generar también las fechas ya pasadas de este mes, o solo las futuras?" (hoy `generateInstancesForMonth` genera todo el mes incluido lo pasado).
- Se **aclara en el form** de plantilla: "Precio por clase — la mensualidad mensual = este precio × cantidad de clases del mes".
- La cuenta "N clases × $ = total" se muestra en `/facturacion` (item 13 #2).
- **Asistencia en fija NO afecta la deuda** (se debe el mes asista o no); en abierta/extra la deuda nace al marcar "asistió".

### 15 · Monto a favor del alumno (pago de más)
- **Nuevo campo `saldo_a_favor DECIMAL(10,2) DEFAULT 0`** en `perfiles` — **único cambio de BD** de todo el grilling.
- Cuando un pago supera la deuda, el **excedente se suma a `saldo_a_favor`** (hoy se pierde como pago huérfano con `deuda_id NULL`).
- El balance del alumno pasa a "deuda − saldo_a_favor"; si da negativo se muestra **verde "a favor"**.
- El saldo a favor **se aplica automáticamente** a la próxima deuda del alumno; además la profe puede usarlo como pago manual desde `/pagos`.
- **BD ya aplicada en producción.** Script de referencia idempotente en `backend/sql/migrations/001_saldo_a_favor.sql` (agrega columna + inicializa con pagos huérfanos existentes). `schema.sql` ya actualizado con la columna.

### 16 · Menú móvil unificado (una sola zona)
- El bottom nav del celular mostraba los módulos principales abajo y, al tocar **Menú**, los adicionales aparecían en un **panel aparte arriba** del contenido → el usuario percibía la navegación partida en dos zonas.
- **Fix**: se elimina el panel desplegable superior y el botón **Menú expande el propio bottom nav** en una segunda fila con los módulos restantes + Manual (todo en la misma zona, abajo).
  ```
  Cerrado:  [Tablero][Clases A.][Facturación][Pagos][Menú ▾]
  Abierto:  [Tablero][Clases A.][Facturación][Pagos][Menú ▴]
            [Plantillas][Instancias][Alumnos][Mi Perfil][Manual]
  ```
- Segunda fila `grid grid-cols-5` con `text-[11px]` y `truncate` (entra en 320px).
- El botón Menú alterna con indicador ▴/▾. Alumno sin cambios (sus 3 ítems ya van directos en la barra inferior). PC sin cambios.
- Archivo: `frontend/src/components/Navigation.tsx`.

### 17 · Scroll horizontal contenido en tablas (regla doesntbreak 9)
- Las tablas de **facturación (2)**, **plantillas (1)** y **alumnos (1)** excedían el ancho del celular y quedaban **recortadas** por el `card overflow-hidden` (columnas cortadas: "Mod…", totales, acciones) sin posibilidad de scroll.
- **Fix**: cada `<table>` se envuelve en `<div className="overflow-x-auto">` (el scroll queda **dentro** del contenedor, nunca en la página) y se quita el `overflow-hidden` de la tarjeta.
- Regla aplicada: "contain the scroll" — un scroll horizontal en la tabla es correcto; un scroll horizontal de página es un bug.
- Archivos: `facturacion/page.tsx`, `plantillas/page.tsx`, `alumnos/page.tsx`.

### 18 · Botones y headers con wrap (celular)
- Headers `flex justify-between` sin `flex-wrap` apretaban título + botón "+ Nueva…" en pantallas chicas; en facturación el selector de mes + "Generar deudas" + "Abrir mes" se cortaban.
- **Fix**: se agrega `flex-wrap gap-3` (o `gap-2`) a los headers/acciones de facturación, plantillas, alumnos, instancias y clases-abiertas.
- Archivos: `facturacion/page.tsx`, `plantillas/page.tsx`, `alumnos/page.tsx`, `instancias/page.tsx`, `clases-abiertas/page.tsx`.

## Lista de observaciones (pendientes y resueltas)

Estado: ✅ resuelto · ⬜ pendiente

## Navegación

1. **Login profe → tablero sin salida al panel**: al ingresar con rol profesor redirige al tablero, pero no hay forma de volver al panel principal donde están las demás opciones. ✅ (resuelto en "Decisiones resueltas" 1/2)
2. **Botón volver al panel**: falta en todas las pantallas un botón para volver a la página admin/panel. ✅ (resuelto en "Decisiones resueltas" 1/2)

## Tablero

3. **Vista semanal vacía**: al filtrar el tablero por semana no se ve nada (no muestra las clases). ✅ (bug de tipo de dato, fix aprobado — ver 3)
4. **Candidatos en la clase**: al tocar una clase para ver alumnos debería aparecer también, si correspondiera, el listado de candidatos. ✅ (resuelto como indicador visual — ver 4/9; el listado ya está en "Candidatos")
5. **Color por nivel de clase**: cuando la clase tiene un nivel definido debería mostrarse un color que lo identifique (avanzado=amarillo, intermedio=verde, principiante=rojo). ✅ (chip de nivel — ver 5)

## Clases / instancias

6. **Profesor por clase no fijado**: no se fija a qué profesor corresponde cada clase creada. ✅ (selector de profesor — ver 6)
7. **Fecha con leyenda "NaN"**: en el formulario de instancias no se ve la fecha a la que refiere la clase, solo se ve "NaN". ✅ (cubierto por fix 3)
8. **Alumnos en instancias**: en las clases que se muestran en las instancias debería verse los alumnos que están en cada clase. ✅ (ver 8)

## Clases abiertas

9. **Candidatos poco visibles**: en las clases abiertas no se nota cuándo hay candidatos esperando ser aceptados. Debería haber algo que informe esa situación. ✅ (indicador visual — ver 4/9)

## Plantillas

10. **Campo "frecuencia" confuso**: no se entiende para qué está el dato "frecuencia" en la creación de plantillas (clases recurrentes). ✅ (se elimina — ver 10)

## Usuario y perfil

11. **Perfil de usuario**: falta un perfil de usuario que permita cambiar la contraseña y sus datos. ✅ (página `/perfil` + change-password + reset desde Alumnos — ver 11)
12. **Alerta al cambiar nivel del alumno**: al cambiarle el nivel, informar que se deben chequear las clases en las que quedó mal puesto de acuerdo al nuevo nivel. ✅ (chequeo de clases discrepantes con fecha >= hoy — ver 12)

## Facturación

13. **Facturación mensual poco clara**: los datos de facturación mensual necesitan más información para que sean más claros. ✅ (8 mejoras de claridad — ver 13)
14. **Cálculo de deuda mensual ambiguo**: al crear una clase mensual no queda claro si el cálculo de deuda es esa clase o esa clase multiplicada por las 4 clases del mes. ✅ (se aclara precio × clases + pregunta de fechas pasadas — ver 14)

## Pagos

15. **Monto a favor del alumno**: en pagos, si se carga un valor superior a la deuda debe quedar como monto a favor del alumno. ✅ (columna `saldo_a_favor` — ver 15)

## Responsive / visual (celular)

16. **Menú partido en dos zonas**: al tocar "Menú", una parte de la navegación quedaba arriba y la otra abajo; se pide todo en la misma zona. ✅ (bottom nav expandible en una sola zona — ver 16)
17. **Tablas sin scroll en celular**: facturación, plantillas y alumnos mostraban las columnas cortadas y sin poder desplazarse. ✅ (scroll horizontal contenido por tabla — ver 17)
18. **Botones/headers apretados en celular**: título + botón "+ Nueva…" y las acciones de facturación se cortaban en pantallas chicas. ✅ (flex-wrap en headers — ver 18)