-- =============================================
-- SEED: Usuario admin inicial
-- Ejecutar en SQLyog después del schema.sql
-- =============================================

INSERT INTO profiles (email, password_hash, full_name, role)
VALUES ('admin@tenismanager.com', '$2b$10$ezGc3iX3nQZDVQtUrc4L8u1FbZBVrhlGrsgVaLG0UvDKpEGmNwADG', 'Administrador', 'admin');