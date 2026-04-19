-- Eliminar un miembro del equipo (solo la empresa puede hacerlo)
CREATE OR REPLACE FUNCTION remove_team_member(target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM usuarios
    WHERE id_usuario = target_user_id
      AND company_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Not authorized: user does not belong to your company';
  END IF;

  UPDATE usuarios
  SET company_id = NULL,
      company_joined_at = NULL,
      company_role = NULL
  WHERE id_usuario = target_user_id;

  UPDATE team_invitations
  SET status = 'removed'
  WHERE user_id = target_user_id
    AND company_id = auth.uid()
    AND status = 'accepted';
END;
$$;

-- Renombrar el display name de un miembro (solo la empresa puede hacerlo)
CREATE OR REPLACE FUNCTION rename_team_member(target_user_id uuid, new_display_name text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM usuarios
    WHERE id_usuario = target_user_id
      AND company_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Not authorized: user does not belong to your company';
  END IF;

  IF TRIM(new_display_name) = '' THEN
    RAISE EXCEPTION 'Display name cannot be empty';
  END IF;

  UPDATE usuarios
  SET nombre_display = TRIM(new_display_name)
  WHERE id_usuario = target_user_id;
END;
$$;
