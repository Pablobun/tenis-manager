-- =============================================
-- MIGRACIÓN 001 · Item 15 (modificaciones.md)
-- Monto a favor del alumno (saldo a favor cuando un pago supera la deuda)
--
-- Nota: los cambios de BD ya están aplicados en producción.
-- Este script queda como referencia/documentación y para replicar
-- el mismo estado en otra base (local, staging, etc.). Es idempotente:
-- se puede correr más de una vez sin romper.
-- =============================================

SET NAMES utf8mb4;

-- Agregar la columna saldo_a_favor a perfiles (si no existe).
ALTER TABLE perfiles
  ADD COLUMN IF NOT EXISTS saldo_a_favor DECIMAL(10,2) NOT NULL DEFAULT 0 AFTER telefono;

-- Inicializar el saldo a favor con los pagos huérfanos ya registrados
-- (pagos cuyo deuda_id es NULL = excedentes que hoy se pierden).
UPDATE perfiles p
  JOIN (
    SELECT pa.alumno_id, SUM(pa.monto) AS total
    FROM pagos pa
    WHERE pa.deuda_id IS NULL
    GROUP BY pa.alumno_id
  ) x ON x.alumno_id = p.id
SET p.saldo_a_favor = x.total;