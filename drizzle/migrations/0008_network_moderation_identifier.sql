DO $migration$
DECLARE definition text;
BEGIN
 SELECT pg_get_functiondef('public.network_command(text,jsonb)'::regprocedure) INTO definition;
 definition:=replace(definition,'id uuid; txt text;', 'report_id uuid; txt text;');
 definition:=replace(definition,'id:=(payload->>''id'')::uuid;', 'report_id:=(payload->>''id'')::uuid;');
 definition:=replace(definition,'network_reports.id=id', 'network_reports.id=report_id');
 EXECUTE definition;
END;
$migration$;