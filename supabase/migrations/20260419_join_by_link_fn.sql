-- Función para unirse a una empresa mediante link de invitación
CREATE OR REPLACE FUNCTION join_company_by_link(p_company_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_user_email text;
  v_existing_company uuid;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Verificar que la empresa existe y es de tipo enterprise
  IF NOT EXISTS (
    SELECT 1 FROM usuarios WHERE id_usuario = p_company_id AND user_type = 'enterprise'
  ) THEN
    RAISE EXCEPTION 'Company not found';
  END IF;

  -- No unirse a sí mismo
  IF v_user_id = p_company_id THEN
    RAISE EXCEPTION 'Cannot join your own company';
  END IF;

  -- Verificar si ya pertenece a alguna empresa
  SELECT company_id INTO v_existing_company FROM usuarios WHERE id_usuario = v_user_id;
  IF v_existing_company IS NOT NULL THEN
    RAISE EXCEPTION 'Already member of a company';
  END IF;

  -- Obtener email del usuario
  SELECT email INTO v_user_email FROM usuarios WHERE id_usuario = v_user_id;

  -- Registrar la unión (sin constraint único, simplemente insertar)
  INSERT INTO team_invitations (company_id, user_id, user_email, status, message)
  VALUES (p_company_id, v_user_id, v_user_email, 'accepted', 'Joined via invite link');

  -- Asignar empresa al usuario
  UPDATE usuarios
  SET company_id = p_company_id,
      company_joined_at = now()
  WHERE id_usuario = v_user_id;
END;
$$;
