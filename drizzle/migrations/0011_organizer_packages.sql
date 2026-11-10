ALTER TABLE public.organizer_accounts ADD COLUMN IF NOT EXISTS package_tier text NOT NULL DEFAULT 'grund';
ALTER TABLE public.organizer_accounts ADD COLUMN IF NOT EXISTS slug text;
CREATE UNIQUE INDEX IF NOT EXISTS organizer_accounts_slug_key ON public.organizer_accounts (slug) WHERE slug IS NOT NULL;
ALTER TABLE public.organizer_accounts ADD CONSTRAINT organizer_accounts_tier_check CHECK (package_tier IN ('grund','utokat'));

CREATE TABLE public.organizer_articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organizer_user_id uuid NOT NULL,
  title text NOT NULL,
  lead text NOT NULL DEFAULT '',
  body text NOT NULL DEFAULT '',
  image_key text NOT NULL DEFAULT '',
  event_ref text NOT NULL,
  subjects text[] NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.organizer_articles TO authenticated;
GRANT ALL ON public.organizer_articles TO service_role;
ALTER TABLE public.organizer_articles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own organizer articles read" ON public.organizer_articles FOR SELECT TO authenticated USING (auth.uid() = organizer_user_id);
CREATE INDEX organizer_articles_owner_idx ON public.organizer_articles (organizer_user_id);

CREATE TABLE public.organizer_featured_events (
  organizer_user_id uuid NOT NULL,
  event_ref text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (organizer_user_id, event_ref)
);
GRANT SELECT ON public.organizer_featured_events TO authenticated;
GRANT ALL ON public.organizer_featured_events TO service_role;
ALTER TABLE public.organizer_featured_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own featured events read" ON public.organizer_featured_events FOR SELECT TO authenticated USING (auth.uid() = organizer_user_id);

CREATE OR REPLACE FUNCTION public.organizer_quota(_user_id uuid)
RETURNS integer LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT CASE
    WHEN public.has_role(_user_id, 'admin') THEN 5
    WHEN (SELECT package_tier FROM public.organizer_accounts WHERE user_id = _user_id) = 'utokat' THEN 5
    ELSE 1 END
$$;

CREATE OR REPLACE FUNCTION public.organizer_quota_guard()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE n integer;
BEGIN
  IF TG_TABLE_NAME = 'organizer_articles' THEN
    SELECT count(*) INTO n FROM public.organizer_articles WHERE organizer_user_id = NEW.organizer_user_id;
  ELSE
    SELECT count(*) INTO n FROM public.organizer_featured_events WHERE organizer_user_id = NEW.organizer_user_id;
  END IF;
  IF n >= public.organizer_quota(NEW.organizer_user_id) THEN
    RAISE EXCEPTION 'quota_exceeded';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER organizer_articles_quota BEFORE INSERT ON public.organizer_articles FOR EACH ROW EXECUTE FUNCTION public.organizer_quota_guard();
CREATE TRIGGER organizer_featured_quota BEFORE INSERT ON public.organizer_featured_events FOR EACH ROW EXECUTE FUNCTION public.organizer_quota_guard();