CREATE TABLE public.network_testers (user_id uuid PRIMARY KEY);
GRANT SELECT ON public.network_testers TO authenticated; GRANT ALL ON public.network_testers TO service_role;
ALTER TABLE public.network_testers ENABLE ROW LEVEL SECURITY;
CREATE POLICY own_tester ON public.network_testers FOR SELECT TO authenticated USING(user_id=auth.uid());
CREATE TABLE public.network_profiles (user_id uuid PRIMARY KEY, name text NOT NULL DEFAULT '', organization text NOT NULL DEFAULT '', role text NOT NULL DEFAULT '', interests text[] NOT NULL DEFAULT '{}', seeking text NOT NULL DEFAULT '', offering text NOT NULL DEFAULT '', days date[] NOT NULL DEFAULT '{}', visible boolean NOT NULL DEFAULT false, suspended boolean NOT NULL DEFAULT false, updated_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT ON public.network_profiles TO authenticated; GRANT ALL ON public.network_profiles TO service_role;
ALTER TABLE public.network_profiles ENABLE ROW LEVEL SECURITY;
CREATE TABLE public.network_consents (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL, version text NOT NULL, granted boolean NOT NULL, created_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT ON public.network_consents TO authenticated; GRANT ALL ON public.network_consents TO service_role;
ALTER TABLE public.network_consents ENABLE ROW LEVEL SECURITY;
CREATE POLICY own_consent ON public.network_consents FOR SELECT TO authenticated USING(user_id=auth.uid());
CREATE TABLE public.network_blocks (owner_id uuid NOT NULL, target_id uuid NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(owner_id,target_id), CHECK(owner_id<>target_id));
GRANT SELECT ON public.network_blocks TO authenticated; GRANT ALL ON public.network_blocks TO service_role;
ALTER TABLE public.network_blocks ENABLE ROW LEVEL SECURITY;
CREATE POLICY own_blocks ON public.network_blocks FOR SELECT TO authenticated USING(owner_id=auth.uid());
CREATE TABLE public.network_requests (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), sender_id uuid NOT NULL, recipient_id uuid NOT NULL, introduction text NOT NULL, status text NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','accepted','declined','cancelled','closed')), sender_seen timestamptz NOT NULL DEFAULT now(), recipient_seen timestamptz, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), CHECK(sender_id<>recipient_id));
CREATE UNIQUE INDEX network_live_pair ON public.network_requests(least(sender_id,recipient_id), greatest(sender_id,recipient_id)) WHERE status IN ('pending','accepted');
GRANT SELECT ON public.network_requests TO authenticated; GRANT ALL ON public.network_requests TO service_role;
ALTER TABLE public.network_requests ENABLE ROW LEVEL SECURITY;
CREATE TABLE public.network_messages (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), request_id uuid NOT NULL REFERENCES public.network_requests(id) ON DELETE CASCADE, sender_id uuid NOT NULL, body text NOT NULL, created_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT ON public.network_messages TO authenticated; GRANT ALL ON public.network_messages TO service_role;
ALTER TABLE public.network_messages ENABLE ROW LEVEL SECURITY;
CREATE TABLE public.network_reports (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), reporter_id uuid NOT NULL, target_id uuid NOT NULL, reason text NOT NULL, snapshot text NOT NULL, status text NOT NULL DEFAULT 'open' CHECK(status IN('open','resolved')), created_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT ON public.network_reports TO authenticated; GRANT ALL ON public.network_reports TO service_role;
ALTER TABLE public.network_reports ENABLE ROW LEVEL SECURITY;
CREATE FUNCTION public.network_allowed(u uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$ SELECT u IS NOT NULL AND (public.has_role(u,'admin') OR EXISTS(SELECT 1 FROM public.network_testers WHERE user_id=u)); $$;
CREATE FUNCTION public.network_pair_allowed(a uuid,b uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$ SELECT public.network_allowed(a) AND public.network_allowed(b) AND NOT EXISTS(SELECT 1 FROM public.network_profiles WHERE user_id IN(a,b) AND suspended) AND NOT EXISTS(SELECT 1 FROM public.network_blocks WHERE (owner_id=a AND target_id=b) OR(owner_id=b AND target_id=a)); $$;
CREATE POLICY network_profile_read ON public.network_profiles FOR SELECT TO authenticated USING(user_id=auth.uid() OR (visible AND NOT suspended AND public.network_pair_allowed(auth.uid(),user_id)));
CREATE POLICY network_request_read ON public.network_requests FOR SELECT TO authenticated USING(auth.uid() IN(sender_id,recipient_id) AND public.network_pair_allowed(sender_id,recipient_id));
CREATE POLICY network_message_read ON public.network_messages FOR SELECT TO authenticated USING(EXISTS(SELECT 1 FROM public.network_requests r WHERE r.id=request_id AND auth.uid() IN(r.sender_id,r.recipient_id) AND r.status='accepted' AND public.network_pair_allowed(r.sender_id,r.recipient_id)));
CREATE POLICY network_report_read ON public.network_reports FOR SELECT TO authenticated USING(reporter_id=auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE FUNCTION public.network_command(action text, payload jsonb) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE u uuid:=auth.uid(); t uuid; r public.network_requests; p public.network_profiles; msg public.network_messages; id uuid; txt text; other uuid; desired boolean;
BEGIN
 IF NOT public.network_allowed(u) THEN RAISE EXCEPTION 'Nätverkande är ännu inte öppet för besökare.'; END IF;
 -- Serializes networking commands, including consent withdrawal, blocks and moderation.
 PERFORM pg_advisory_xact_lock(724019267);
 IF action='moderate' THEN
  IF NOT public.has_role(u,'admin') THEN RAISE EXCEPTION 'Ingen behörighet'; END IF;
  id:=(payload->>'id')::uuid;
  SELECT target_id INTO t FROM public.network_reports WHERE network_reports.id=id;
  IF t IS NULL THEN RAISE EXCEPTION 'Rapporten saknas'; END IF;
  IF payload->>'decision'='suspend' THEN UPDATE public.network_profiles SET suspended=true,visible=false,updated_at=now() WHERE user_id=t;
  ELSIF payload->>'decision'<>'resolve' THEN RAISE EXCEPTION 'Ogiltigt beslut'; END IF;
  UPDATE public.network_reports SET status='resolved' WHERE network_reports.id=id;
  RETURN jsonb_build_object('ok',true);
 END IF;
 IF EXISTS(SELECT 1 FROM public.network_profiles WHERE user_id=u AND suspended) AND action NOT IN('hide','delete') THEN RAISE EXCEPTION 'Nätverkandet är avstängt för ditt konto.'; END IF;
 IF action='profile' THEN
  desired:=coalesce((payload->>'visible')::boolean,false);
  txt:=trim(coalesce(payload->>'name',''));
  IF length(txt)<1 OR length(txt)>100 OR length(coalesce(payload->>'organization',''))>200 OR length(coalesce(payload->>'role',''))>200 OR length(coalesce(payload->>'seeking',''))>1000 OR length(coalesce(payload->>'offering',''))>1000 THEN RAISE EXCEPTION 'Kontrollera profilfälten'; END IF;
  IF jsonb_array_length(payload->'interests')>30 OR jsonb_array_length(payload->'days')>30 OR EXISTS(SELECT 1 FROM jsonb_array_elements_text(payload->'interests') x WHERE length(x)>100) THEN RAISE EXCEPTION 'För många eller för långa val'; END IF;
  IF desired AND (payload->>'consent_version'<>'network-v1' OR coalesce((payload->>'consent')::boolean,false)=false) THEN RAISE EXCEPTION 'Aktivt medgivande krävs'; END IF;
  INSERT INTO public.network_profiles(user_id,name,organization,role,interests,seeking,offering,days,visible) VALUES(u,txt,coalesce(payload->>'organization',''),coalesce(payload->>'role',''),ARRAY(SELECT jsonb_array_elements_text(payload->'interests')),coalesce(payload->>'seeking',''),coalesce(payload->>'offering',''),ARRAY(SELECT x::date FROM jsonb_array_elements_text(payload->'days') x),desired)
  ON CONFLICT(user_id) DO UPDATE SET name=excluded.name,organization=excluded.organization,role=excluded.role,interests=excluded.interests,seeking=excluded.seeking,offering=excluded.offering,days=excluded.days,visible=excluded.visible,updated_at=now();
  INSERT INTO public.network_consents(user_id,version,granted) VALUES(u,'network-v1',desired);
 ELSIF action IN('hide','delete') THEN
  UPDATE public.network_profiles SET visible=false,updated_at=now() WHERE user_id=u;
  INSERT INTO public.network_consents(user_id,version,granted) VALUES(u,'network-v1',false);
  UPDATE public.network_requests SET status='cancelled',updated_at=now() WHERE u IN(sender_id,recipient_id) AND status='pending';
  IF action='delete' THEN
   DELETE FROM public.network_requests WHERE u IN(sender_id,recipient_id);
   DELETE FROM public.network_profiles WHERE user_id=u;
  END IF;
 ELSIF action IN('block','unblock','request','report') THEN
  t:=(payload->>'target')::uuid;
  IF t=u OR t IS NULL THEN RAISE EXCEPTION 'Ogiltig kontakt'; END IF;
  IF action='block' THEN
   IF NOT EXISTS(SELECT 1 FROM public.network_profiles WHERE user_id=t) THEN RAISE EXCEPTION 'Profilen saknas'; END IF;
   INSERT INTO public.network_blocks(owner_id,target_id) VALUES(u,t) ON CONFLICT DO NOTHING;
   UPDATE public.network_requests SET status='closed',updated_at=now() WHERE (sender_id=u AND recipient_id=t OR sender_id=t AND recipient_id=u) AND status IN('pending','accepted');
  ELSIF action='unblock' THEN DELETE FROM public.network_blocks WHERE owner_id=u AND target_id=t;
  ELSE
   IF NOT public.network_pair_allowed(u,t) THEN RAISE EXCEPTION 'Kontakten är inte tillgänglig'; END IF;
   SELECT * INTO p FROM public.network_profiles WHERE user_id=t;
   IF p.user_id IS NULL THEN RAISE EXCEPTION 'Profilen saknas'; END IF;
   txt:=trim(coalesce(payload->>'text',''));
   IF length(txt)<1 OR length(txt)>1000 THEN RAISE EXCEPTION 'Skriv 1–1000 tecken'; END IF;
   IF action='request' THEN
    IF NOT p.visible OR NOT EXISTS(SELECT 1 FROM public.network_profiles WHERE user_id=u AND visible AND NOT suspended) THEN RAISE EXCEPTION 'Båda behöver en synlig nätverksprofil'; END IF;
    IF (SELECT count(*) FROM public.network_requests WHERE sender_id=u AND created_at>now()-interval '24 hours')>=10 THEN RAISE EXCEPTION 'Högst 10 förfrågningar per dygn'; END IF;
    IF EXISTS(SELECT 1 FROM public.network_requests WHERE ((sender_id=u AND recipient_id=t) OR(sender_id=t AND recipient_id=u)) AND (status IN('pending','accepted') OR created_at>now()-interval '7 days')) THEN RAISE EXCEPTION 'En förfrågan finns redan eller har nyligen avslutats'; END IF;
    INSERT INTO public.network_requests(sender_id,recipient_id,introduction) VALUES(u,t,txt);
   ELSE
    IF (SELECT count(*) FROM public.network_reports WHERE reporter_id=u AND created_at>now()-interval '24 hours')>=5 THEN RAISE EXCEPTION 'Högst 5 rapporter per dygn'; END IF;
    IF payload->>'message_id' IS NOT NULL THEN
     SELECT m.* INTO msg FROM public.network_messages m JOIN public.network_requests q ON q.id=m.request_id WHERE m.id=(payload->>'message_id')::uuid AND m.sender_id=t AND u IN(q.sender_id,q.recipient_id) AND q.status='accepted';
     IF msg.id IS NULL THEN RAISE EXCEPTION 'Meddelandet är inte tillgängligt'; END IF;
     txt:=txt; INSERT INTO public.network_reports(reporter_id,target_id,reason,snapshot) VALUES(u,t,txt,msg.body);
    ELSE
     IF NOT p.visible THEN RAISE EXCEPTION 'Profilen är dold'; END IF;
     INSERT INTO public.network_reports(reporter_id,target_id,reason,snapshot) VALUES(u,t,txt,concat_ws(E'\n',p.name,p.organization,p.role,array_to_string(p.interests,', '),p.seeking,p.offering));
    END IF;
   END IF;
  END IF;
 ELSE
  SELECT * INTO r FROM public.network_requests WHERE network_requests.id=(payload->>'id')::uuid FOR UPDATE;
  IF r.id IS NULL OR u NOT IN(r.sender_id,r.recipient_id) OR NOT public.network_pair_allowed(r.sender_id,r.recipient_id) THEN RAISE EXCEPTION 'Kontakten är inte tillgänglig'; END IF;
  IF action IN('accept','decline') THEN
   IF r.recipient_id<>u OR r.status<>'pending' THEN RAISE EXCEPTION 'Förfrågan kan inte besvaras'; END IF;
   IF action='accept' AND NOT EXISTS(SELECT 1 FROM public.network_profiles WHERE user_id=r.sender_id AND visible) THEN RAISE EXCEPTION 'Avsändaren är inte tillgänglig'; END IF;
   UPDATE public.network_requests SET status=CASE WHEN action='accept' THEN 'accepted' ELSE 'declined' END,recipient_seen=now(),updated_at=now() WHERE network_requests.id=r.id;
  ELSIF action='cancel' THEN
   IF r.sender_id<>u OR r.status<>'pending' THEN RAISE EXCEPTION 'Förfrågan kan inte återkallas'; END IF;
   UPDATE public.network_requests SET status='cancelled',updated_at=now() WHERE network_requests.id=r.id;
  ELSIF action='close' THEN UPDATE public.network_requests SET status='closed',updated_at=now() WHERE network_requests.id=r.id;
  ELSIF action='seen' THEN UPDATE public.network_requests SET sender_seen=CASE WHEN u=sender_id THEN now() ELSE sender_seen END,recipient_seen=CASE WHEN u=recipient_id THEN now() ELSE recipient_seen END WHERE network_requests.id=r.id;
  ELSIF action='message' THEN
   txt:=trim(coalesce(payload->>'text',''));
   IF r.status<>'accepted' OR length(txt)<1 OR length(txt)>2000 THEN RAISE EXCEPTION 'Samtalet måste vara accepterat; skriv 1–2000 tecken'; END IF;
   IF (SELECT count(*) FROM public.network_messages WHERE sender_id=u AND created_at>now()-interval '1 hour')>=60 THEN RAISE EXCEPTION 'Högst 60 meddelanden per timme'; END IF;
   INSERT INTO public.network_messages(request_id,sender_id,body) VALUES(r.id,u,txt);
   UPDATE public.network_requests SET updated_at=now(),sender_seen=CASE WHEN u=sender_id THEN now() ELSE sender_seen END,recipient_seen=CASE WHEN u=recipient_id THEN now() ELSE recipient_seen END WHERE network_requests.id=r.id;
  ELSE RAISE EXCEPTION 'Okänd åtgärd'; END IF;
 END IF;
 RETURN jsonb_build_object('ok',true);
END; $$;
REVOKE ALL ON FUNCTION public.network_command(text,jsonb) FROM PUBLIC,anon; GRANT EXECUTE ON FUNCTION public.network_command(text,jsonb) TO authenticated;
REVOKE ALL ON FUNCTION public.network_allowed(uuid),public.network_pair_allowed(uuid,uuid) FROM PUBLIC,anon; GRANT EXECUTE ON FUNCTION public.network_allowed(uuid),public.network_pair_allowed(uuid,uuid) TO authenticated;
COMMENT ON TABLE public.network_testers IS 'Closed pilot: admin and explicitly allowlisted test accounts only; public enrollment requires a separate reviewed launch change.';