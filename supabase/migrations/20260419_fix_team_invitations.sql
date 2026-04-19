-- Fix team_invitations: make from_user_id nullable and add RLS policies

-- 1. Make from_user_id nullable (code doesn't always send it)
ALTER TABLE team_invitations ALTER COLUMN from_user_id DROP NOT NULL;

-- 2. Make to_email nullable (join requests come with user_email instead)
ALTER TABLE team_invitations ALTER COLUMN to_email DROP NOT NULL;

-- 3. RLS policies
-- SELECT: empresa ve sus invitaciones, usuario ve las suyas
CREATE POLICY "team_invitations_select"
ON team_invitations FOR SELECT
TO authenticated
USING (
  company_id = auth.uid()
  OR user_id = auth.uid()
  OR user_email = auth.email()
);

-- INSERT: empresa puede invitar (company_id = su uid), usuario puede pedir unirse (user_id = su uid)
CREATE POLICY "team_invitations_insert"
ON team_invitations FOR INSERT
TO authenticated
WITH CHECK (
  company_id = auth.uid()
  OR user_id = auth.uid()
);

-- UPDATE: empresa puede aceptar/rechazar solicitudes, usuario puede aceptar/rechazar invitaciones
CREATE POLICY "team_invitations_update"
ON team_invitations FOR UPDATE
TO authenticated
USING (
  company_id = auth.uid()
  OR user_id = auth.uid()
  OR user_email = auth.email()
);
