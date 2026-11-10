ALTER TABLE public.network_reports ADD COLUMN moderator_id uuid, ADD COLUMN decision text, ADD COLUMN resolved_at timestamptz;
CREATE TABLE public.network_suspensions(user_id uuid PRIMARY KEY, created_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT ON public.network_suspensions TO authenticated; GRANT ALL ON public.network_suspensions TO service_role;
ALTER TABLE public.network_suspensions ENABLE ROW LEVEL SECURITY;
CREATE POLICY own_suspension ON public.network_suspensions FOR SELECT TO authenticated USING(user_id=auth.uid());
CREATE OR REPLACE FUNCTION public.network_pair_allowed(a uuid,b uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$ SELECT public.network_allowed(a) AND public.network_allowed(b) AND NOT EXISTS(SELECT 1 FROM public.network_suspensions WHERE user_id IN(a,b)) AND NOT EXISTS(SELECT 1 FROM public.network_profiles WHERE user_id IN(a,b) AND suspended) AND NOT EXISTS(SELECT 1 FROM public.network_blocks WHERE (owner_id=a AND target_id=b) OR(owner_id=b AND target_id=a)); $$;
CREATE FUNCTION public.network_profile_guard() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF NEW.visible AND EXISTS(SELECT 1 FROM public.network_suspensions WHERE user_id=NEW.user_id) THEN RAISE EXCEPTION 'Nätverkandet är avstängt för ditt konto.'; END IF;
 IF NEW.suspended THEN INSERT INTO public.network_suspensions(user_id) VALUES(NEW.user_id) ON CONFLICT DO NOTHING; END IF;
 IF NOT NEW.visible THEN UPDATE public.network_requests SET status='cancelled',updated_at=now() WHERE NEW.user_id IN(sender_id,recipient_id) AND status='pending'; END IF;
 RETURN NEW;
END; $$;
CREATE TRIGGER network_profile_guard AFTER INSERT OR UPDATE ON public.network_profiles FOR EACH ROW EXECUTE FUNCTION public.network_profile_guard();
CREATE FUNCTION public.network_consent_guard() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE input jsonb;
BEGIN
 -- The command RPC stores its current input in a transaction-local setting below.
 IF NEW.granted THEN
  input:=current_setting('network.command_input',true)::jsonb;
  IF input IS NULL OR coalesce(input->>'consent_version','')<>'network-v1' OR coalesce(input->>'consent','')<>'true' THEN RAISE EXCEPTION 'Aktivt medgivande krävs'; END IF;
 END IF;
 RETURN NEW;
END; $$;
CREATE TRIGGER network_consent_guard BEFORE INSERT ON public.network_consents FOR EACH ROW EXECUTE FUNCTION public.network_consent_guard();
CREATE FUNCTION public.network_report_audit() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ BEGIN IF NEW.status='resolved' AND OLD.status='open' THEN NEW.moderator_id:=auth.uid(); NEW.resolved_at:=now(); NEW.decision:=CASE WHEN EXISTS(SELECT 1 FROM public.network_suspensions WHERE user_id=NEW.target_id) THEN 'suspend' ELSE 'resolve' END; END IF; RETURN NEW; END; $$;
CREATE TRIGGER network_report_audit BEFORE UPDATE ON public.network_reports FOR EACH ROW EXECUTE FUNCTION public.network_report_audit();
REVOKE ALL ON FUNCTION public.network_profile_guard(),public.network_consent_guard(),public.network_report_audit() FROM PUBLIC,anon,authenticated;
