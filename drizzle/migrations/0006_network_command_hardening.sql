DO $migration$
DECLARE definition text;
BEGIN
 SELECT pg_get_functiondef('public.network_command(text,jsonb)'::regprocedure) INTO definition;
 definition:=replace(definition, 'PERFORM pg_advisory_xact_lock(724019267);', E'PERFORM pg_advisory_xact_lock(724019267);\n PERFORM set_config(''network.command_input'',payload::text,true);\n IF action IS NULL OR payload IS NULL OR jsonb_typeof(payload)<>''object'' THEN RAISE EXCEPTION ''Ogiltiga uppgifter''; END IF;\n IF EXISTS(SELECT 1 FROM public.network_suspensions WHERE user_id=u) AND action NOT IN(''hide'',''delete'',''moderate'') THEN RAISE EXCEPTION ''Nätverkandet är avstängt för ditt konto.''; END IF;');
 definition:=replace(definition, 'payload->>''consent_version''<>''network-v1''', 'coalesce(payload->>''consent_version'','''')<>''network-v1''');
 definition:=replace(definition, 'IF jsonb_array_length(payload->''interests'')', E'IF coalesce(jsonb_typeof(payload->''interests''),'''')<>''array'' OR coalesce(jsonb_typeof(payload->''days''),'''')<>''array'' THEN RAISE EXCEPTION ''Ogiltiga val''; END IF;\n  IF jsonb_array_length(payload->''interests'')');
 EXECUTE definition;
END;
$migration$;
REVOKE ALL ON FUNCTION public.network_allowed(uuid),public.network_pair_allowed(uuid,uuid) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.network_allowed(uuid),public.network_pair_allowed(uuid,uuid) TO authenticated;