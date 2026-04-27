-- ════════════════════════════════════════════════════════════════════════════
-- Migration: Create user_preferences table
-- ════════════════════════════════════════════════════════════════════════════
-- Stores user privacy and visual preferences

-- ── CREATE TABLE ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  hide_from_ranking BOOLEAN DEFAULT false NOT NULL,
  incognito_mode BOOLEAN DEFAULT false NOT NULL,
  no_prompt_history BOOLEAN DEFAULT false NOT NULL,
  visual_mode TEXT DEFAULT 'default' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ── INDEXES ─────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_preferences_updated_at ON user_preferences(updated_at);

-- ── RLS POLICIES ────────────────────────────────────────────────────────────
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Users can only see and modify their own preferences
CREATE POLICY "user_preferences_select"
  ON user_preferences FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "user_preferences_insert"
  ON user_preferences FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "user_preferences_update"
  ON user_preferences FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "user_preferences_delete"
  ON user_preferences FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- ── COMMENTS ────────────────────────────────────────────────────────────────
COMMENT ON TABLE user_preferences IS 'Stores user privacy and visual mode preferences';
COMMENT ON COLUMN user_preferences.user_id IS 'Foreign key to auth.users';
COMMENT ON COLUMN user_preferences.hide_from_ranking IS 'Hide user from public leaderboards';
COMMENT ON COLUMN user_preferences.incognito_mode IS 'Hide user activity from other users';
COMMENT ON COLUMN user_preferences.no_prompt_history IS 'Do not save prompt history';
COMMENT ON COLUMN user_preferences.visual_mode IS 'Visual theme mode: default, sakura, retro, hacker';
