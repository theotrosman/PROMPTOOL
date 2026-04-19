-- ══════════════════════════════════════════
-- SEGUIR USUARIOS
-- ══════════════════════════════════════════
CREATE TABLE IF NOT EXISTS follows (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(follower_id, following_id)
);

ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "follows_public_read" ON follows FOR SELECT USING (true);
CREATE POLICY "follows_own_insert" ON follows FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "follows_own_delete" ON follows FOR DELETE USING (auth.uid() = follower_id);

-- Agregar contadores a usuarios
ALTER TABLE usuarios
  ADD COLUMN IF NOT EXISTS followers_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS following_count INTEGER DEFAULT 0;

-- ══════════════════════════════════════════
-- TICKETS / SOPORTE
-- ══════════════════════════════════════════
CREATE TABLE IF NOT EXISTS tickets (
  id_ticket UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  id_usuario UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  asunto TEXT NOT NULL,
  estado TEXT DEFAULT 'open', -- open | in_progress | closed
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ticket_mensajes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  id_ticket UUID REFERENCES tickets(id_ticket) ON DELETE CASCADE,
  id_usuario UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  mensaje TEXT NOT NULL,
  es_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_mensajes ENABLE ROW LEVEL SECURITY;

-- Usuarios ven sus propios tickets
CREATE POLICY "tickets_own" ON tickets FOR SELECT USING (auth.uid() = id_usuario);
CREATE POLICY "tickets_insert" ON tickets FOR INSERT WITH CHECK (auth.uid() = id_usuario);
CREATE POLICY "ticket_msgs_own" ON ticket_mensajes FOR SELECT USING (
  EXISTS (SELECT 1 FROM tickets WHERE id_ticket = ticket_mensajes.id_ticket AND id_usuario = auth.uid())
);
CREATE POLICY "ticket_msgs_insert" ON ticket_mensajes FOR INSERT WITH CHECK (auth.uid() = id_usuario);

-- Admins ven y gestionan todo
CREATE POLICY "admin_tickets" ON tickets FOR ALL USING (
  (SELECT adminstate FROM usuarios WHERE id_usuario = auth.uid()) = true
);
CREATE POLICY "admin_ticket_msgs" ON ticket_mensajes FOR ALL USING (
  (SELECT adminstate FROM usuarios WHERE id_usuario = auth.uid()) = true
);
