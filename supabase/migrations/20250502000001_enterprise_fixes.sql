-- ════════════════════════════════════════════════════════════════════════════
-- Migration: Enterprise panel fixes & improvements
-- ════════════════════════════════════════════════════════════════════════════

-- ── 1. Add company_display_name to usuarios (separate from real nombre) ────
ALTER TABLE usuarios
  ADD COLUMN IF NOT EXISTS company_display_name TEXT DEFAULT NULL;

-- ── 2. Add company_role to usuarios ─────────────────────────────────────────
ALTER TABLE usuarios
  ADD COLUMN IF NOT EXISTS company_role TEXT DEFAULT NULL
  CHECK (company_role IN ('manager','analyst','trainee','observer') OR company_role IS NULL);

-- ── 3. Add company_id and company_joined_at to usuarios ─────────────────────
ALTER TABLE usuarios
  ADD COLUMN IF NOT EXISTS company_id UUID DEFAULT NULL REFERENCES usuarios(id_usuario) ON DELETE SET NULL;

ALTER TABLE usuarios
  ADD COLUMN IF NOT EXISTS company_joined_at TIMESTAMPTZ DEFAULT NULL;

-- ── 4. Add enterprise settings columns to usuarios ──────────────────────────
ALTER TABLE usuarios
  ADD COLUMN IF NOT EXISTS settings_allowed_diffs TEXT[] DEFAULT ARRAY['Easy','Medium','Hard'];

ALTER TABLE usuarios
  ADD COLUMN IF NOT EXISTS industry_type TEXT DEFAULT 'marketing';

ALTER TABLE usuarios
  ADD COLUMN IF NOT EXISTS tournament_enabled BOOLEAN DEFAULT false;

ALTER TABLE usuarios
  ADD COLUMN IF NOT EXISTS default_challenge_type TEXT DEFAULT 'standard';

ALTER TABLE usuarios
  ADD COLUMN IF NOT EXISTS default_challenge_mode TEXT DEFAULT 'static';

ALTER TABLE usuarios
  ADD COLUMN IF NOT EXISTS performance_metrics JSONB DEFAULT '{
    "trackTimePerAttempt": true,
    "trackImprovementRate": true,
    "trackKeywordEffectiveness": true,
    "trackDepartmentComparison": true,
    "generateWeeklyReports": false,
    "generateMonthlyReports": true
  }'::jsonb;

ALTER TABLE usuarios
  ADD COLUMN IF NOT EXISTS training_config JSONB DEFAULT '{
    "enableProgressTracking": true,
    "enablePeerReview": false,
    "enableManagerApproval": false,
    "defaultFeedbackLevel": "immediate",
    "enableCertificates": false,
    "enableLeaderboards": true,
    "leaderboardScope": "company"
  }'::jsonb;

-- ── 5. Add challenge config columns to imagenes_ia ──────────────────────────
ALTER TABLE imagenes_ia
  ADD COLUMN IF NOT EXISTS company_id UUID DEFAULT NULL REFERENCES usuarios(id_usuario) ON DELETE SET NULL;

ALTER TABLE imagenes_ia
  ADD COLUMN IF NOT EXISTS challenge_description TEXT DEFAULT NULL;

ALTER TABLE imagenes_ia
  ADD COLUMN IF NOT EXISTS challenge_time_limit INTEGER DEFAULT 180;

ALTER TABLE imagenes_ia
  ADD COLUMN IF NOT EXISTS challenge_max_attempts INTEGER DEFAULT NULL;

ALTER TABLE imagenes_ia
  ADD COLUMN IF NOT EXISTS challenge_min_words INTEGER DEFAULT 10;

ALTER TABLE imagenes_ia
  ADD COLUMN IF NOT EXISTS challenge_start_date TIMESTAMPTZ DEFAULT NULL;

ALTER TABLE imagenes_ia
  ADD COLUMN IF NOT EXISTS challenge_end_date TIMESTAMPTZ DEFAULT NULL;

ALTER TABLE imagenes_ia
  ADD COLUMN IF NOT EXISTS challenge_visibility TEXT DEFAULT 'private'
  CHECK (challenge_visibility IN ('private','public'));

ALTER TABLE imagenes_ia
  ADD COLUMN IF NOT EXISTS challenge_points INTEGER DEFAULT 100;

ALTER TABLE imagenes_ia
  ADD COLUMN IF NOT EXISTS challenge_tags TEXT[] DEFAULT ARRAY[]::TEXT[];

ALTER TABLE imagenes_ia
  ADD COLUMN IF NOT EXISTS challenge_hints TEXT[] DEFAULT ARRAY[]::TEXT[];

ALTER TABLE imagenes_ia
  ADD COLUMN IF NOT EXISTS challenge_evaluation_mode TEXT DEFAULT 'standard'
  CHECK (challenge_evaluation_mode IN ('standard','strict','flexible'));

-- ── 6. Create team_invitations table ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS team_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  user_id UUID DEFAULT NULL REFERENCES usuarios(id_usuario) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','accepted','rejected','requested','cancelled')),
  message TEXT DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_team_invitations_company_id ON team_invitations(company_id);
CREATE INDEX IF NOT EXISTS idx_team_invitations_user_id ON team_invitations(user_id);
CREATE INDEX IF NOT EXISTS idx_team_invitations_status ON team_invitations(status);

-- ── 7. RLS on team_invitations ───────────────────────────────────────────────
ALTER TABLE team_invitations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist before recreating
DO $$ BEGIN
  DROP POLICY IF EXISTS "team_invitations_company_select" ON team_invitations;
  DROP POLICY IF EXISTS "team_invitations_company_insert" ON team_invitations;
  DROP POLICY IF EXISTS "team_invitations_update"         ON team_invitations;
  DROP POLICY IF EXISTS "team_invitations_delete"         ON team_invitations;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Company owner can see all their invitations
CREATE POLICY "team_invitations_company_select"
  ON team_invitations FOR SELECT
  TO authenticated
  USING (company_id = auth.uid() OR user_id = auth.uid());

-- Company owner can insert invitations
CREATE POLICY "team_invitations_company_insert"
  ON team_invitations FOR INSERT
  TO authenticated
  WITH CHECK (company_id = auth.uid());

-- Company owner can update (accept/reject), invited user can update their own
CREATE POLICY "team_invitations_update"
  ON team_invitations FOR UPDATE
  TO authenticated
  USING (company_id = auth.uid() OR user_id = auth.uid());

-- Company owner can delete (cancel)
CREATE POLICY "team_invitations_delete"
  ON team_invitations FOR DELETE
  TO authenticated
  USING (company_id = auth.uid());

-- ── 8. RPC: assign_company_role ──────────────────────────────────────────────
-- Only the company owner can assign roles to their members
CREATE OR REPLACE FUNCTION assign_company_role(
  target_user_id UUID,
  role TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify the target user belongs to the calling user's company
  IF NOT EXISTS (
    SELECT 1 FROM usuarios
    WHERE id_usuario = target_user_id
      AND company_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'User does not belong to your company';
  END IF;

  -- Validate role value
  IF role IS NOT NULL AND role NOT IN ('manager','analyst','trainee','observer','') THEN
    RAISE EXCEPTION 'Invalid role value';
  END IF;

  UPDATE usuarios
  SET company_role = NULLIF(role, '')
  WHERE id_usuario = target_user_id
    AND company_id = auth.uid();
END;
$$;

-- ── 9. RPC: remove_team_member ───────────────────────────────────────────────
CREATE OR REPLACE FUNCTION remove_team_member(
  target_user_id UUID
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify the target user belongs to the calling user's company
  IF NOT EXISTS (
    SELECT 1 FROM usuarios
    WHERE id_usuario = target_user_id
      AND company_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'User does not belong to your company';
  END IF;

  UPDATE usuarios
  SET company_id = NULL,
      company_role = NULL,
      company_joined_at = NULL,
      company_display_name = NULL
  WHERE id_usuario = target_user_id
    AND company_id = auth.uid();
END;
$$;

-- ── 10. RPC: accept_team_invitation ─────────────────────────────────────────
-- SECURITY DEFINER so it can write company_id to the user row
CREATE OR REPLACE FUNCTION accept_team_invitation(
  invitation_id UUID
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  inv RECORD;
BEGIN
  -- Fetch the invitation, must belong to the calling company
  SELECT * INTO inv
  FROM team_invitations
  WHERE id = invitation_id
    AND company_id = auth.uid()
    AND status IN ('requested','pending');

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invitation not found or already processed';
  END IF;

  -- Update the user's company_id
  UPDATE usuarios
  SET company_id = inv.company_id,
      company_joined_at = now()
  WHERE id_usuario = inv.user_id;

  -- Mark invitation as accepted
  UPDATE team_invitations
  SET status = 'accepted', updated_at = now()
  WHERE id = invitation_id;
END;
$$;

-- ── 11. RPC: set_company_display_name ────────────────────────────────────────
-- Company owner sets a display name for a member WITHIN the company context only
-- This does NOT touch the user's real nombre/nombre_display
CREATE OR REPLACE FUNCTION set_company_display_name(
  target_user_id UUID,
  display_name TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify the target user belongs to the calling user's company
  IF NOT EXISTS (
    SELECT 1 FROM usuarios
    WHERE id_usuario = target_user_id
      AND company_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'User does not belong to your company';         
  END IF;

  UPDATE usuarios
  SET company_display_name = NULLIF(trim(display_name), '')
  WHERE id_usuario = target_user_id
    AND company_id = auth.uid();
END;
$$;

-- ── 12. Add dashboard_filters to usuarios for saving filter preferences ──────
ALTER TABLE usuarios
  ADD COLUMN IF NOT EXISTS dashboard_filters JSONB DEFAULT '{
    "timeRange": "30",
    "selectedMember": "all",
    "difficulty": "all",
    "metric": "score"
  }'::jsonb;

-- ── 13. Add challenge_attempts_detailed view for better stats ─────────────────
CREATE OR REPLACE VIEW challenge_attempts_detailed AS
SELECT 
  i.id_intento,
  i.id_usuario,
  i.id_imagen,
  i.puntaje_similitud,
  i.prompt_usuario,
  i.strengths,
  i.improvements,
  i.fecha_hora,
  i.modo,
  img.image_theme,
  img.image_diff,
  img.prompt_original,
  img.company_id,
  u.nombre,
  u.nombre_display,
  u.company_display_name,
  u.email,
  u.avatar_url
FROM intentos i
JOIN imagenes_ia img ON i.id_imagen = img.id_imagen
JOIN usuarios u ON i.id_usuario = u.id_usuario
WHERE img.company_id IS NOT NULL;

-- ── 14. Create custom_roles table for dynamic role management ─────────────────
CREATE TABLE IF NOT EXISTS custom_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
  role_name TEXT NOT NULL,
  role_description TEXT DEFAULT NULL,
  role_color TEXT DEFAULT '#6b7280', -- Default gray color
  permissions JSONB DEFAULT '{
    "canViewAnalytics": true,
    "canManageTeam": false,
    "canCreateChallenges": false,
    "canViewReports": true
  }'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(company_id, role_name)
);

-- ── 15. RLS for custom_roles ─────────────────────────────────────────────────
ALTER TABLE custom_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "custom_roles_company_access"
  ON custom_roles FOR ALL
  TO authenticated
  USING (company_id = auth.uid())
  WITH CHECK (company_id = auth.uid());

-- ── 16. Insert default roles for existing companies ─────────────────────────
INSERT INTO custom_roles (company_id, role_name, role_description, role_color, permissions)
SELECT 
  id_usuario as company_id,
  'Manager' as role_name,
  'Team manager with full permissions' as role_description,
  '#8b5cf6' as role_color,
  '{
    "canViewAnalytics": true,
    "canManageTeam": true,
    "canCreateChallenges": true,
    "canViewReports": true
  }'::jsonb as permissions
FROM usuarios 
WHERE user_type = 'enterprise'
ON CONFLICT (company_id, role_name) DO NOTHING;

INSERT INTO custom_roles (company_id, role_name, role_description, role_color, permissions)
SELECT 
  id_usuario as company_id,
  'Analyst' as role_name,
  'Data analyst with reporting access' as role_description,
  '#3b82f6' as role_color,
  '{
    "canViewAnalytics": true,
    "canManageTeam": false,
    "canCreateChallenges": false,
    "canViewReports": true
  }'::jsonb as permissions
FROM usuarios 
WHERE user_type = 'enterprise'
ON CONFLICT (company_id, role_name) DO NOTHING;

INSERT INTO custom_roles (company_id, role_name, role_description, role_color, permissions)
SELECT 
  id_usuario as company_id,
  'Trainee' as role_name,
  'Team member in training' as role_description,
  '#f59e0b' as role_color,
  '{
    "canViewAnalytics": false,
    "canManageTeam": false,
    "canCreateChallenges": false,
    "canViewReports": false
  }'::jsonb as permissions
FROM usuarios 
WHERE user_type = 'enterprise'
ON CONFLICT (company_id, role_name) DO NOTHING;

INSERT INTO custom_roles (company_id, role_name, role_description, role_color, permissions)
SELECT 
  id_usuario as company_id,
  'Observer' as role_name,
  'Read-only access to team data' as role_description,
  '#6b7280' as role_color,
  '{
    "canViewAnalytics": true,
    "canManageTeam": false,
    "canCreateChallenges": false,
    "canViewReports": false
  }'::jsonb as permissions
FROM usuarios 
WHERE user_type = 'enterprise'
ON CONFLICT (company_id, role_name) DO NOTHING;

-- ── 17. RPC: create_custom_role ──────────────────────────────────────────────
CREATE OR REPLACE FUNCTION create_custom_role(
  role_name TEXT,
  role_description TEXT DEFAULT NULL,
  role_color TEXT DEFAULT '#6b7280'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $
DECLARE
  new_role_id UUID;
BEGIN
  -- Validate role name
  IF role_name IS NULL OR trim(role_name) = '' THEN
    RAISE EXCEPTION 'Role name cannot be empty';
  END IF;

  -- Insert new role
  INSERT INTO custom_roles (company_id, role_name, role_description, role_color)
  VALUES (auth.uid(), trim(role_name), role_description, role_color)
  RETURNING id INTO new_role_id;

  RETURN new_role_id;
END;
$;

-- ── 18. RPC: delete_custom_role ──────────────────────────────────────────────
CREATE OR REPLACE FUNCTION delete_custom_role(
  role_name TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $
BEGIN
  -- Check if role exists and belongs to company
  IF NOT EXISTS (
    SELECT 1 FROM custom_roles
    WHERE company_id = auth.uid() AND role_name = delete_custom_role.role_name
  ) THEN
    RAISE EXCEPTION 'Role not found or access denied';
  END IF;

  -- Remove role from all users first
  UPDATE usuarios
  SET company_role = NULL
  WHERE company_id = auth.uid() AND company_role = delete_custom_role.role_name;

  -- Delete the role
  DELETE FROM custom_roles
  WHERE company_id = auth.uid() AND role_name = delete_custom_role.role_name;
END;
$;

-- ── 19. Update assign_company_role to handle custom roles ───────────────────
CREATE OR REPLACE FUNCTION assign_company_role(
  target_user_id UUID,
  role TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $
BEGIN
  -- Verify the target user belongs to the calling user's company
  IF NOT EXISTS (
    SELECT 1 FROM usuarios
    WHERE id_usuario = target_user_id
      AND company_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'User does not belong to your company';
  END IF;

  -- If role is provided, validate it exists (either built-in or custom)
  IF role IS NOT NULL AND role != '' THEN
    IF NOT EXISTS (
      SELECT 1 FROM custom_roles
      WHERE company_id = auth.uid() AND role_name = role
    ) THEN
      -- Auto-create the role if it doesn't exist
      PERFORM create_custom_role(role, 'Auto-created role', '#6b7280');
    END IF;
  END IF;

  UPDATE usuarios
  SET company_role = NULLIF(role, '')
  WHERE id_usuario = target_user_id
    AND company_id = auth.uid();
END;
$;
