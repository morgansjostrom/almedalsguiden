CREATE TABLE public.network_action_log(id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL, kind text NOT NULL, target_id uuid, created_at timestamptz NOT NULL DEFAULT now());
GRANT ALL ON public.network_action_log TO service_role;
ALTER TABLE public.network_action_log ENABLE ROW LEVEL SECURITY;
CREATE INDEX network_action_log_quota ON public.network_action_log(user_id,kind,created_at);
CREATE FUNCTION public.network_limit_guard() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE u uuid; k text; t uuid; max_count integer; window_size interval;
BEGIN
 IF TG_TABLE_NAME='network_requests' THEN u:=NEW.sender_id; k:='request'; t:=NEW.recipient_id; max_count:=10; window_size:=interval '24 hours';
 ELSIF TG_TABLE_NAME='network_messages' THEN u:=NEW.sender_id; k:='message'; max_count:=60; window_size:=interval '1 hour';
 ELSE u:=NEW.reporter_id; k:='report'; t:=NEW.target_id; max_count:=5; window_size:=interval '24 hours'; END IF;
 IF (SELECT count(*) FROM public.network_action_log WHERE user_id=u AND kind=k AND created_at>now()-window_size)>=max_count THEN RAISE EXCEPTION 'Gränsen för förfrågningar, meddelanden eller rapporter har nåtts. Försök senare.'; END IF;
 IF k='request' AND EXISTS(SELECT 1 FROM public.network_action_log WHERE kind='request' AND ((user_id=u AND target_id=t) OR(user_id=t AND target_id=u)) AND created_at>now()-interval '7 days') THEN RAISE EXCEPTION 'En kontaktförfrågan har nyligen skickats. Vänta sju dagar.'; END IF;
 INSERT INTO public.network_action_log(user_id,kind,target_id) VALUES(u,k,t);
 RETURN NEW;
END; $$;
CREATE TRIGGER network_request_limit BEFORE INSERT ON public.network_requests FOR EACH ROW EXECUTE FUNCTION public.network_limit_guard();
CREATE TRIGGER network_message_limit BEFORE INSERT ON public.network_messages FOR EACH ROW EXECUTE FUNCTION public.network_limit_guard();
CREATE TRIGGER network_report_limit BEFORE INSERT ON public.network_reports FOR EACH ROW EXECUTE FUNCTION public.network_limit_guard();
REVOKE ALL ON FUNCTION public.network_limit_guard() FROM PUBLIC,anon,authenticated;