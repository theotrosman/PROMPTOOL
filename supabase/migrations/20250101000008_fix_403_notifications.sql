-- ════════════════════════════════════════════════════════════════════════════
-- FIX 403 on team_invitations and guide_suggestions
-- Both tables have RLS enabled but are missing SELECT policies for
-- authenticated users, causing PostgREST to return 403 Forbidden.
-- ════════════════════════════════════════════════════════════════════════════

-- ── team_invitations ─────────────────────────────────────────────────────
-- Drop any conflicting policies from previous migrations
DROP POLICY IF EXISTS "invitations_select_own"              ON team_invitations;
DROP POLICY IF EXISTS "users_can_view_own_invitations"      ON team_invitations;
DROP POLICY IF EXISTS "invitations_insert"                  ON team_invitations;
DROP POLICY IF EXISTS "users_can_insert_invitations"        ON team_invitations;
DROP POLICY IF EXISTS "invitations_update_own"              ON team_invitations;
DROP POLICY IF EXISTS "users_can_update_invitations"        ON team_invitations;
DROP POLICY IF EXISTS "invitations_delete"                  ON team_invitations;
DROP POLICY IF EXISTS "admins_full_access_invitations"      ON team_invitations;

ALTER TABLE team_invitations ENABLE ROW LEVEL SECURITY;

-- SELECT: user is company, invited user, or invited by email
CREATE POLICY "invitations_select"
  ON team_invitations FOR SELECT
  TO authenticated
  USING (
    company_id = auth.uid()
    OR user_id  = auth.uid()
    OR user_email = (SELECT email FROM auth.users WHERE id = auth.uid())
    OR is_admin()
  );

-- INSERT: company creates invite, or user requests to join
CREATE POLICY "invitations_insert"
  ON team_invitations FOR INSERT
  TO authenticated
  WITH CHECK (
    company_id = auth.uid()
    OR user_id  = auth.uid()
    OR is_admin()
  );

-- UPDATE: parties involved can change status
CREATE POLICY "invitations_update"
  ON team_invitations FOR UPDATE
  TO authenticated
  USING (
    company_id = auth.uid()
    OR user_id  = auth.uid()
    OR user_email = (SELECT email FROM auth.users WHERE id = auth.uid())
    OR is_admin()
  );

-- DELETE: company that created it, or admin
CREATE POLICY "invitations_delete"
  ON team_invitations FOR DELETE
  TO authenticated
  USING (company_id = auth.uid() OR is_admin());

-- ── guide_suggestions ────────────────────────────────────────────────────
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'guide_suggestions'
  ) THEN
    ALTER TABLE guide_suggestions ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "guide_suggestions_select" ON guide_suggestions;
    DROP POLICY IF EXISTS "guide_suggestions_insert" ON guide_suggestions;
    DROP POLICY IF EXISTS "guide_suggestions_admin"  ON guide_suggestions;

    -- Users see suggestions targeted at them (by id or email)
    CREATE POLICY "guide_suggestions_select"
      ON guide_suggestions FOR SELECT
      TO authenticated
      USING (
        target_user_id = auth.uid()
        OR target_email = (SELECT email FROM auth.users WHERE id = auth.uid())
        OR is_admin()
      );

    -- Admins insert suggestions (used as notification carrier for report responses)
    CREATE POLICY "guide_suggestions_insert"
      ON guide_suggestions FOR INSERT
      TO authenticated
      WITH CHECK (is_admin());

    -- Admins can update/delete
    CREATE POLICY "guide_suggestions_admin"
      ON guide_suggestions FOR ALL
      TO authenticated
      USING (is_admin());
  END IF;
END $$;
