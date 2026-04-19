CREATE OR REPLACE FUNCTION assign_company_role(target_user_id uuid, role text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Solo la empresa del usuario puede asignarle un rol
  IF NOT EXISTS (
    SELECT 1 FROM usuarios
    WHERE id_usuario = target_user_id
      AND company_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Not authorized: user does not belong to your company';
  END IF;

  UPDATE usuarios
  SET company_role = NULLIF(TRIM(role), '')
  WHERE id_usuario = target_user_id;
END;
$$;
