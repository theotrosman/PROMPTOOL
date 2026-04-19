CREATE OR REPLACE FUNCTION leave_company()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE usuarios
  SET company_id = NULL,
      company_joined_at = NULL,
      company_role = NULL
  WHERE id_usuario = auth.uid();

  UPDATE team_invitations
  SET status = 'left'
  WHERE user_id = auth.uid()
    AND status = 'accepted';
END;
$$;
