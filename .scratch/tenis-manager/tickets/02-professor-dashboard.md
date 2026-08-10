## Question

¿Cómo se ve y funciona el **tablero de la profesora**? Es la pantalla principal donde vive.

Preguntas clave:
- ¿Vista de **grilla** (como las imágenes) o **lista** o **calendario**?
- ¿Cómo se muestra el **revoloteo diario** (arrastrar alumnos entre grupos)?
- ¿Qué acciones accesibles tiene la profe en un tap/click? (agregar alumno, mover, borrar, aceptar candidato)
- ¿Cómo se ve el **cupo** de cada grupo? ¿Barra, número, indicador de color?
- ¿Cómo se ve la **deuda** de un alumno en el tablero? ¿Indicador visual?

Criterios: debe ser cómodo en celular, la profe lo usa todos los días, debe poder hacer todo con pocos taps.

## Type

grilling

## Mode

HITL

## Blocked by

01-tech-stack (resuelto)

## Resolution

**Vista principal**: ambas vistas — diaria (por defecto, swipe entre días) y semanal (toggle secundario). Navegación por mes con barra superior + picker.

**Acciones por tap**: bottom sheet contextual (tap grupo → opciones: ver alumnos, agregar, mover, borrar).

**Indicador de grupo**: nombres + nivel + cupo (ej: "SCOPPA / MALANO · Avanzado · 2/4"). La deuda NO se muestra en la grilla.

**Reasignación**: tap + menú "Mover a..." como flujo principal.

**Estado**: RESUELTO
