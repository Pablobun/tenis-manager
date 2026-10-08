-- =============================================
-- MIGRACIÓN 003 · Issue 15 (puntos 2 y 3)
-- Nuevo estado 'archivada' en instancias_clases.estado
--
-- Modelo de estados (grill con docs):
--   programada  = se dicta
--   cancelada   = cancelación PUNTUAL desde el calendario:
--                 visible en calendario, el alumno la ve, SÍ factura
--   archivada   = cancelación de SERIE desde el panel de clases fijas:
--                 desaparece del calendario, el alumno no la ve, NO factura
--   completada  = dictada
--
-- Idempotente: correr una sola vez (MODIFY es no-op si el ENUM ya incluye
-- 'archivada'). NO migración de datos: el resto es data de prueba.
-- =============================================

SET NAMES utf8mb4;

ALTER TABLE instancias_clases
  MODIFY estado ENUM('programada', 'completada', 'cancelada', 'archivada') DEFAULT 'programada';
