ALTER TABLE public.organizer_accounts ADD COLUMN IF NOT EXISTS aliases text[] NOT NULL DEFAULT '{}';

CREATE TABLE public.organizer_event_links (
  organizer_user_id uuid NOT NULL,
  event_ref text NOT NULL,
  mode text NOT NULL CHECK (mode IN ('include','exclude')),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (organizer_user_id, event_ref)
);
GRANT SELECT ON public.organizer_event_links TO authenticated;
GRANT ALL ON public.organizer_event_links TO service_role;
ALTER TABLE public.organizer_event_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own event links read" ON public.organizer_event_links FOR SELECT TO authenticated USING (auth.uid() = organizer_user_id);
CREATE POLICY "Admins read event links" ON public.organizer_event_links FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));