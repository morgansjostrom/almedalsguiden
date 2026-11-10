ALTER TABLE public.network_match_prefs ADD COLUMN IF NOT EXISTS linkedin text NOT NULL DEFAULT '';
CREATE OR REPLACE FUNCTION public.network_set_linkedin(url text) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE u uuid:=auth.uid(); v text:=btrim(coalesce(url,''));
BEGIN
 IF u IS NULL OR NOT public.network_allowed(u) THEN RAISE EXCEPTION 'Nätverkande är ännu inte öppet för besökare.'; END IF;
 IF v<>'' AND (length(v)>200 OR v !~ '^https://([a-z]{2,3}\.)?linkedin\.com/in/[A-Za-z0-9_%-]+/?$') THEN RAISE EXCEPTION 'Ange en LinkedIn-länk som börjar med https://www.linkedin.com/in/'; END IF;
 INSERT INTO public.network_match_prefs(user_id,linkedin) VALUES(u,v) ON CONFLICT(user_id) DO UPDATE SET linkedin=excluded.linkedin,updated_at=now();
 RETURN jsonb_build_object('ok',true);
END $$;
CREATE OR REPLACE FUNCTION public.network_linkedin_data(targets uuid[]) RETURNS TABLE(user_id uuid, linkedin text) LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
 SELECT p.user_id, m.linkedin FROM public.network_profiles p JOIN public.network_match_prefs m ON m.user_id=p.user_id
 WHERE public.network_allowed(auth.uid()) AND p.user_id=ANY(targets[1:50]) AND p.visible AND NOT p.suspended AND p.user_id<>auth.uid() AND m.linkedin<>''
  AND NOT EXISTS(SELECT 1 FROM public.network_blocks b WHERE (b.owner_id=auth.uid() AND b.target_id=p.user_id) OR (b.owner_id=p.user_id AND b.target_id=auth.uid()));
$$;
REVOKE ALL ON FUNCTION public.network_set_linkedin(text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.network_linkedin_data(uuid[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.network_set_linkedin(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.network_linkedin_data(uuid[]) TO authenticated;