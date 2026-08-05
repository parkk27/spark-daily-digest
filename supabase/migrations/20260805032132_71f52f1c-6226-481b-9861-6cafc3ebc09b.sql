ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role_focus TEXT NOT NULL DEFAULT 'product';

CREATE TABLE public.recommendations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  section TEXT NOT NULL,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  owner TEXT NOT NULL,
  priority TEXT NOT NULL,
  confidence INTEGER NOT NULL DEFAULT 70,
  evidence_count INTEGER NOT NULL DEFAULT 0,
  evidence JSONB NOT NULL DEFAULT '[]'::jsonb,
  rationale TEXT,
  related_vendor TEXT,
  related_technologies TEXT[] NOT NULL DEFAULT '{}'::text[],
  due_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.recommendations TO authenticated;
GRANT ALL ON public.recommendations TO service_role;
ALTER TABLE public.recommendations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Recommendations readable by authenticated" ON public.recommendations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Service role writes recommendations" ON public.recommendations FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE INDEX idx_recommendations_date ON public.recommendations (date DESC);

CREATE TABLE public.recommendation_status (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recommendation_id UUID NOT NULL REFERENCES public.recommendations(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'new',
  note TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, recommendation_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.recommendation_status TO authenticated;
GRANT ALL ON public.recommendation_status TO service_role;
ALTER TABLE public.recommendation_status ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own recommendation status" ON public.recommendation_status FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_rec_status_updated BEFORE UPDATE ON public.recommendation_status FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.bookmarks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id UUID,
  kind TEXT NOT NULL,
  ref_id TEXT NOT NULL,
  title TEXT NOT NULL,
  url TEXT,
  source TEXT,
  note TEXT,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, kind, ref_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bookmarks TO authenticated;
GRANT ALL ON public.bookmarks TO service_role;
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own bookmarks" ON public.bookmarks FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.analytics_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  workspace_id UUID,
  event TEXT NOT NULL,
  target TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT INSERT ON public.analytics_events TO authenticated;
GRANT SELECT ON public.analytics_events TO authenticated;
GRANT ALL ON public.analytics_events TO service_role;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users insert own events" ON public.analytics_events FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins read events" ON public.analytics_events FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE INDEX idx_analytics_events_created ON public.analytics_events (created_at DESC);