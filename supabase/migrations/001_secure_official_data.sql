-- Secure official/admin data boundary for MPLSimulasi.
-- Apply only after reviewing the deployment and backup runbook.
-- Never expose service_role credentials to the browser.
-- User simulations are local-first and do not require these tables.

BEGIN;

-- Remove the legacy broad anon policies created by supabase_schema.sql.
DROP POLICY IF EXISTS "Anon Full Access Sessions" ON public.sessions;
DROP POLICY IF EXISTS "Anon Full Access Teams" ON public.teams;
DROP POLICY IF EXISTS "Anon Full Access Matches" ON public.matches;
DROP POLICY IF EXISTS "Anon Full Access Settings" ON public.settings;
DROP POLICY IF EXISTS "Anon Full Access Playoffs" ON public.playoffs;
DROP POLICY IF EXISTS "Anon Full Access Schedule Templates" ON public.schedule_templates;

-- Keep RLS enabled even if this migration is re-applied.
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playoffs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule_templates ENABLE ROW LEVEL SECURITY;

-- Public clients may read only official schedule/catalog snapshots.
-- Session/teams/matches/settings/playoffs are not user-facing cloud storage anymore.
CREATE POLICY "Public read official schedule templates"
    ON public.schedule_templates
    FOR SELECT
    TO anon, authenticated
    USING (true);

-- Authenticated users may read official schedule templates as well.
-- All writes must come from a trusted server-side function using service_role.
REVOKE INSERT, UPDATE, DELETE ON public.schedule_templates FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.sessions FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.teams FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.matches FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.settings FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.playoffs FROM anon, authenticated;

COMMIT;

-- Follow-up requirement:
-- expose narrowly scoped Edge Functions/RPC for authenticated admin writes.
-- Do not grant browser clients service_role privileges.
