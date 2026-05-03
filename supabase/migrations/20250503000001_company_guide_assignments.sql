-- ════════════════════════════════════════════════════════════════════════════
-- Migration: Company guide assignments
-- Permite a empresas asignar guías del catálogo o guías personalizadas
-- a sus empleados.
-- ════════════════════════════════════════════════════════════════════════════

-- ── 1. Tabla de asignaciones de guías ────────────────────────────────────────
-- Cada fila representa una guía asignada por una empresa a uno o todos sus miembros.
-- target_user_id NULL = asignada a todos los miembros de la empresa.
CREATE TABLE IF NOT EXISTS company_guide_assignments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      UUID NOT NULL REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
  -- NULL = guía del catálogo built-in; NOT NULL = guía personalizada
  guide_id        TEXT,                    -- id de la guía del catálogo (ej: 'fundamentos-prompting')
  -- Campos para guías personalizadas (guide_id = 'custom')
  custom_title    TEXT,
  custom_body     TEXT,                    -- Markdown
  custom_url      TEXT,                    -- enlace externo opcional
  -- Asignación
  target_user_id  UUID REFERENCES usuarios(id_usuario) ON DELETE CASCADE,  -- NULL = todos
  assigned_by     UUID REFERENCES usuarios(id_usuario) ON DELETE SET NULL,
  note            TEXT,                    -- nota/instrucción para el empleado
  due_date        DATE,                    -- fecha límite opcional
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── 2. Tabla de progreso de guías (persistencia en BD) ───────────────────────
-- Reemplaza el localStorage para que el progreso sea cross-device.
CREATE TABLE IF NOT EXISTS user_guide_progress (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
  guide_id        TEXT NOT NULL,
  checkpoints     TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],  -- checkpoints completados
  lesson_ack      BOOLEAN NOT NULL DEFAULT false,           -- lección leída
  quiz_passed     BOOLEAN NOT NULL DEFAULT false,
  completed_at    TIMESTAMPTZ,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, guide_id)
);

-- ── 3. RLS ───────────────────────────────────────────────────────────────────
ALTER TABLE company_guide_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_guide_progress ENABLE ROW LEVEL SECURITY;

-- Empresa puede ver y gestionar sus propias asignaciones
CREATE POLICY "company_manage_assignments"
  ON company_guide_assignments
  FOR ALL
  USING (company_id = auth.uid())
  WITH CHECK (company_id = auth.uid());

-- Empleado puede ver las asignaciones de su empresa
CREATE POLICY "member_view_assignments"
  ON company_guide_assignments
  FOR SELECT
  USING (
    target_user_id = auth.uid()
    OR target_user_id IS NULL AND EXISTS (
      SELECT 1 FROM usuarios
      WHERE id_usuario = auth.uid()
        AND company_id = company_guide_assignments.company_id
    )
  );

-- Usuario puede leer y escribir su propio progreso
CREATE POLICY "user_own_progress"
  ON user_guide_progress
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Empresa puede leer el progreso de sus miembros
CREATE POLICY "company_read_member_progress"
  ON user_guide_progress
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE id_usuario = user_guide_progress.user_id
        AND company_id = auth.uid()
    )
  );

-- ── 4. Índices ───────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_cga_company ON company_guide_assignments(company_id);
CREATE INDEX IF NOT EXISTS idx_cga_user    ON company_guide_assignments(target_user_id);
CREATE INDEX IF NOT EXISTS idx_ugp_user    ON user_guide_progress(user_id);
