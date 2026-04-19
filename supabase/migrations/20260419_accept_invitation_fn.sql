-- Función SECURITY DEFINER para aceptar invitaciones
-- Bypasea RLS para poder escribir company_id en el perfil del usuario invitado

CREATE OR REPLACE FUNCTION accept_team_invitation(invitation_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  inv RECORD;
  target_user_id uuid;
BEGIN
  -- Traer la invitación
  SELECT * INTO inv FROM team_invitations WHERE id = invitation_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invitation not found';
  END IF;

  -- Solo la empresa dueña puede aceptar
  IF inv.company_id != auth.uid() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  -- Resolver user_id si no está seteado
  target_user_id := inv.user_id;
  IF target_user_id IS NULL AND inv.user_email IS NOT NULL THEN
    SELECT id_usuario INTO target_user_id
    FROM usuarios
    WHERE email = inv.user_email
    LIMIT 1;
  END IF;

  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'User not found for this invitation';
  END IF;

  -- Marcar invitación como aceptada y guardar user_id resuelto
  UPDATE team_invitations
  SET status = 'accepted', user_id = target_user_id
  WHERE id = invitation_id;

  -- Asignar empresa al usuario (bypasea RLS gracias a SECURITY DEFINER)
  UPDATE usuarios
  SET company_id = inv.company_id,
      company_joined_at = now()
  WHERE id_usuario = target_user_id;
END;
$$;

-- También una función para que el usuario acepte una invitación enviada por la empresa
CREATE OR REPLACE FUNCTION accept_company_invite(invitation_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  inv RECORD;
BEGIN
  SELECT * INTO inv FROM team_invitations WHERE id = invitation_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invitation not found';
  END IF;

  -- Solo el usuario destinatario puede aceptar
  IF inv.user_id != auth.uid() AND inv.user_email != auth.email() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  UPDATE team_invitations
  SET status = 'accepted', user_id = auth.uid()
  WHERE id = invitation_id;

  UPDATE usuarios
  SET company_id = inv.company_id,
      company_joined_at = now()
  WHERE id_usuario = auth.uid();
END;
$$;
