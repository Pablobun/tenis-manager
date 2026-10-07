-- =============================================
-- MIGRACIÓN 002 · Item 8 (cambios.txt)
-- Roster de alumnos por plantilla fija (alumnos por defecto de la clase)
--
-- La plantilla fija guarda su lista de alumnos; al replicar el mes,
-- las instancias nuevas nacen ya inscriptas con esos alumnos.
-- Plantillas antiguas sin roster → instancias vacías (comportamiento previo).
-- Idempotente: se puede correr más de una vez sin romper.
-- =============================================

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS plantilla_alumnos (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  plantilla_id BIGINT UNSIGNED NOT NULL,
  alumno_id BIGINT UNSIGNED NOT NULL,
  agregado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_plantilla_alumno (plantilla_id, alumno_id),
  FOREIGN KEY (plantilla_id) REFERENCES plantillas_clases(id) ON DELETE CASCADE,
  FOREIGN KEY (alumno_id) REFERENCES perfiles(id) ON DELETE CASCADE
);
