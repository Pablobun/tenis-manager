## Question

¿Cómo funciona el **modelo de deuda** completo?

Preguntas clave:
- ¿Cómo se **calcula** la deuda de un alumno? (suma de clases del mes × precio - pagos)
- ¿Cómo se **muestra**? (saldo actual, desglose por clase, historial)
- ¿Cómo se **carga un pago**? (la profe selecciona alumno, monto, fecha)
- ¿Qué pasa con el **ciclo mensual**? (cuándo se "cierra" el mes, cuándo se genera la deuda)
- ¿Cómo se ve el **resumen mensual**? (pendiente para después, pero ¿qué datos necesita?)
- ¿Cómo funciona la **excepción de deuda**? (la profe puede dejar entrar a un alumno que debe)
- ¿Cómo funciona la **excepción de pago**? (la profe puede reservar cupo sin pago)

Criterios: debe ser simple para la profe (marcar pagos rápido), pero suficiente para tener historial y saber quién debe.

## Type

grilling

## Mode

HITL

## Blocked by

01-tech-stack (resuelto)

## Resolution

**Generación de deuda**: semi-automática (sistema calcula, profe aprueba). Inscripción a mitad de mes genera deuda al momento de inscripción. **Pagos**: individual + por lote, monto personalizado (parcial = diferencia como deuda). **Histórico**: perfil del alumno + resumen global por fecha. **Excepciones**: profe tiene control total. **Apertura de mes**: sistema avisa, profe decide.

**Estado**: RESUELTO
