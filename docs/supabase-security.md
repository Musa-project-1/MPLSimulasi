# Supabase Security Boundary

## Current model

MPLSimulasi uses local-first storage for user simulation sessions. User sessions, settings, matches, teams, and playoff state are not cloud persistence.

Supabase is reserved for official/admin data:

- `schedule_templates` official schedules and live snapshots
- official team catalog data

## Migration

`supabase/migrations/001_secure_official_data.sql` removes the legacy broad anon `FOR ALL` policies and leaves public read only for `schedule_templates`.

Do not apply this migration to production until the admin write path is available through a trusted server-side function.

## Admin write requirement

The browser must not receive or use a `service_role` key. Admin writes must go through one of:

1. Supabase Edge Function that verifies Supabase Auth and an admin role.
2. Narrow `SECURITY DEFINER` RPC functions with explicit validation and authorization.

The client-side PIN is a UI gate only. It is not authorization and must never be used as proof for a database mutation.

## Deployment procedure

1. Back up official tables.
2. Deploy and test the admin Edge Function/RPC in a non-production Supabase project.
3. Verify anonymous reads for official templates.
4. Verify anonymous and normal authenticated writes are rejected.
5. Verify authenticated admin writes succeed only through the trusted function.
6. Apply `001_secure_official_data.sql`.
7. Re-run the verification checks and record the migration timestamp.
8. Keep a rollback script prepared; never restore the old broad anon policies.
