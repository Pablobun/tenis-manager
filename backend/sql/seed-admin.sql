-- Seed Admin / Superusuario
-- Contraseña hash para 'admin123' (generado con bcrypt rounds=10)
INSERT IGNORE INTO perfiles (email, password_hash, nombre_completo, rol, activo)
VALUES ('p.bunader@gmail.com','1414', 'Administrador Riverside', 'admin', 1);