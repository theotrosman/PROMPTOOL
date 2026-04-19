-- 1. Permitir a empresas (user_type = 'enterprise') insertar desafíos
CREATE POLICY "enterprise_insert_challenges"
ON imagenes_ia FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM usuarios
    WHERE id_usuario = auth.uid()
      AND user_type = 'enterprise'
  )
);

-- 2. Permitir a empresas eliminar sus propias invitaciones pendientes
CREATE POLICY "team_invitations_delete"
ON team_invitations FOR DELETE
TO authenticated
USING (
  company_id = auth.uid()
  OR user_id = auth.uid()
);

-- 3. Columnas de configuración de empresa (si no existen)
ALTER TABLE usuarios
  ADD COLUMN IF NOT EXISTS settings_allowed_diffs text[] DEFAULT ARRAY['Easy','Medium','Hard'],
  ADD COLUMN IF NOT EXISTS settings_bio text,
  ADD COLUMN IF NOT EXISTS settings_website text;
