-- Agrega columna ranked_count para trackear intentos rankeados por separado
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS ranked_count integer DEFAULT 0;

-- Backfill: calcular ranked_count actual para todos los usuarios
UPDATE usuarios u
SET ranked_count = (
  SELECT COUNT(*)
  FROM intentos i
  WHERE i.id_usuario = u.id_usuario
    AND i.is_ranked = true
);
