DO $migration$
DECLARE definition text;
BEGIN
 SELECT pg_get_functiondef('public.network_command(text,jsonb)'::regprocedure) INTO definition;
 definition:=replace(definition, 'coalesce(payload->>''consent_version'','''')<>''network-v1''', 'coalesce(payload->>''consent_version'','''') NOT IN (''network-v1'',''network-v2'')');
 definition:=replace(definition, 'VALUES(u,''network-v1'',desired)', 'VALUES(u,payload->>''consent_version'',desired)');
 EXECUTE definition;
END;
$migration$;
CREATE OR REPLACE FUNCTION public.network_consent_guard() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE input jsonb;
BEGIN
 IF NEW.granted THEN
  input:=current_setting('network.command_input',true)::jsonb;
  IF input IS NULL OR coalesce(input->>'consent_version','') NOT IN ('network-v1','network-v2') OR NEW.version<>input->>'consent_version' OR coalesce(input->>'consent','')<>'true' THEN RAISE EXCEPTION 'Aktivt medgivande krävs'; END IF;
 END IF;
 RETURN NEW;
END; $$;