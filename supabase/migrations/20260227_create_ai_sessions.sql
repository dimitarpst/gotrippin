-- AI Operator: ai_sessions and ai_messages tables
-- Run this in Supabase SQL Editor or via Supabase CLI
-- See docs/AI_OPERATOR_IMPLEMENTATION.md

-- ============================================
-- ai_sessions
-- ============================================
CREATE TABLE IF NOT EXISTS public.ai_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  trip_id UUID NULL REFERENCES public.trips(id) ON DELETE SET NULL,
  scope TEXT NOT NULL CHECK (scope IN ('global', 'trip')),
  summary TEXT,
  slots JSONB NOT NULL DEFAULT '{}',
  model_name TEXT NOT NULL DEFAULT 'glm-5',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ensure trip_id is set when scope = 'trip'
ALTER TABLE public.ai_sessions
  ADD CONSTRAINT ai_sessions_trip_scope_check
  CHECK (
    (scope = 'global' AND trip_id IS NULL) OR
    (scope = 'trip' AND trip_id IS NOT NULL)
  );

CREATE INDEX idx_ai_sessions_user_id ON public.ai_sessions(user_id);
CREATE INDEX idx_ai_sessions_trip_id ON public.ai_sessions(trip_id);
CREATE INDEX idx_ai_sessions_updated_at ON public.ai_sessions(updated_at DESC);

-- RLS
ALTER TABLE public.ai_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own ai_sessions"
  ON public.ai_sessions FOR SELECT
  USING (
    user_id = auth.uid()
    AND (
      trip_id IS NULL
      OR EXISTS (
        SELECT 1 FROM public.trip_members
        WHERE trip_members.trip_id = ai_sessions.trip_id
        AND trip_members.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can insert own ai_sessions"
  ON public.ai_sessions FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND (
      trip_id IS NULL
      OR EXISTS (
        SELECT 1 FROM public.trip_members
        WHERE trip_members.trip_id = ai_sessions.trip_id
        AND trip_members.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can update own ai_sessions"
  ON public.ai_sessions FOR UPDATE
  USING (
    user_id = auth.uid()
    AND (
      trip_id IS NULL
      OR EXISTS (
        SELECT 1 FROM public.trip_members
        WHERE trip_members.trip_id = ai_sessions.trip_id
        AND trip_members.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can delete own ai_sessions"
  ON public.ai_sessions FOR DELETE
  USING (
    user_id = auth.uid()
    AND (
      trip_id IS NULL
      OR EXISTS (
        SELECT 1 FROM public.trip_members
        WHERE trip_members.trip_id = ai_sessions.trip_id
        AND trip_members.user_id = auth.uid()
      )
    )
  );

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ai_sessions_updated_at
  BEFORE UPDATE ON public.ai_sessions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================
-- ai_messages (optional, for debugging / history)
-- ============================================
CREATE TABLE IF NOT EXISTS public.ai_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.ai_sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'tool', 'system')),
  content JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ai_messages_session_id ON public.ai_messages(session_id);
CREATE INDEX idx_ai_messages_created_at ON public.ai_messages(session_id, created_at);

-- RLS: only session owner can access messages (via session join)
ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view ai_messages for own sessions"
  ON public.ai_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.ai_sessions s
      WHERE s.id = ai_messages.session_id
      AND s.user_id = auth.uid()
      AND (
        s.trip_id IS NULL
        OR EXISTS (
          SELECT 1 FROM public.trip_members tm
          WHERE tm.trip_id = s.trip_id AND tm.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Users can insert ai_messages for own sessions"
  ON public.ai_messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.ai_sessions s
      WHERE s.id = ai_messages.session_id
      AND s.user_id = auth.uid()
      AND (
        s.trip_id IS NULL
        OR EXISTS (
          SELECT 1 FROM public.trip_members tm
          WHERE tm.trip_id = s.trip_id AND tm.user_id = auth.uid()
        )
      )
    )
  );
