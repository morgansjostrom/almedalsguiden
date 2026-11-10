CREATE TABLE public.network_match_prefs(
 user_id uuid PRIMARY KEY,
 seeking text[] NOT NULL DEFAULT '{}',
 offering text[] NOT NULL DEFAULT '{}',
 share_schedule boolean NOT NULL DEFAULT false,
 updated_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT ON public.network_match_prefs TO authenticated;
GRANT ALL ON public.network_match_prefs TO service_role;
ALTER TABLE public.network_match_prefs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner reads match prefs" ON public.network_match_prefs FOR SELECT TO authenticated USING (user_id=auth.uid());

CREATE OR REPLACE FUNCTION public.network_set_match(seeking text[], offering text[], share_schedule boolean)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE u uuid:=auth.uid(); allowed text[]:=ARRAY['Samarbetspartner','Finansiering','Kunskap och expertis','Rekrytering','Kunder och uppdrag','Media och synlighet','Politiska kontakter','Mentorskap'];
BEGIN
 IF u IS NULL OR NOT public.network_allowed(u) THEN RAISE EXCEPTION 'Nätverkande är ännu inte öppet för besökare.'; END IF;
 IF NOT (coalesce(seeking,'{}') <@ allowed AND coalesce(offering,'{}') <@ allowed) THEN RAISE EXCEPTION 'Ogiltiga val'; END IF;
 INSERT INTO public.network_match_prefs(user_id,seeking,offering,share_schedule) VALUES(u,coalesce(seeking,'{}'),coalesce(offering,'{}'),coalesce(share_schedule,false))
 ON CONFLICT(user_id) DO UPDATE SET seeking=excluded.seeking,offering=excluded.offering,share_schedule=excluded.share_schedule,updated_at=now();
 RETURN jsonb_build_object('ok',true);
END $$;

-- Match data only for visible, unsuspended, unblocked profiles; shared events only when both opted in, and only events the caller saved.
CREATE OR REPLACE FUNCTION public.network_match_data(targets uuid[])
RETURNS TABLE(user_id uuid, seeking text[], offering text[], shared_events text[])
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
 SELECT p.user_id, coalesce(m.seeking,'{}'), coalesce(m.offering,'{}'),
  CASE WHEN m.share_schedule AND me.share_schedule THEN ARRAY(
    SELECT f.event_ref FROM public.favorites f JOIN public.favorites g ON g.event_ref=f.event_ref AND g.user_id=p.user_id AND g.saved
    WHERE f.user_id=auth.uid() AND f.saved ORDER BY f.event_ref LIMIT 20) ELSE '{}' END
 FROM public.network_profiles p
 LEFT JOIN public.network_match_prefs m ON m.user_id=p.user_id
 LEFT JOIN public.network_match_prefs me ON me.user_id=auth.uid()
 WHERE public.network_allowed(auth.uid()) AND p.user_id=ANY(targets[1:50]) AND p.visible AND NOT p.suspended AND p.user_id<>auth.uid()
  AND NOT EXISTS(SELECT 1 FROM public.network_blocks b WHERE (b.owner_id=auth.uid() AND b.target_id=p.user_id) OR (b.owner_id=p.user_id AND b.target_id=auth.uid()));
$$;
REVOKE ALL ON FUNCTION public.network_set_match(text[],text[],boolean) FROM public, anon;
REVOKE ALL ON FUNCTION public.network_match_data(uuid[]) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.network_set_match(text[],text[],boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.network_match_data(uuid[]) TO authenticated;