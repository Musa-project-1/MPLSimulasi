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

This repository now contains `supabase/functions/admin-mutate/index.ts`. It:

- requires a bearer token;
- verifies the user through Supabase Auth;
- requires `user.app_metadata.role === "admin"`;
- accepts only the three official template IDs;
- bounds request size and validates payload shape;
- uses `SUPABASE_SERVICE_ROLE_KEY` only inside the Edge Function runtime.

The client-side PIN is a UI gate only. It is not authorization and must never be used as proof for a database mutation. The browser must be migrated to Supabase Auth before the RLS migration is applied.

## Edge Function deployment

From a machine with the Supabase CLI authenticated to the intended project:

```bash
supabase functions deploy admin-mutate
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=...
```

Do not put the service-role value in this repository, `.env` committed files, browser localStorage, or client JavaScript. Configure the admin user's `app_metadata.role` through a trusted Supabase admin process, then test unauthorized and authorized calls in a non-production project.

The current function uses explicit CORS headers. Replace the wildcard origin with the production origin before enabling browser calls in production.

`supabase/config.toml` sets `verify_jwt = false` because the function performs explicit `getUser(token)` verification and role checking. Keep that behavior covered by integration tests.


## Deployment procedure

1. Back up official tables.
2. Deploy and test the admin Edge Function/RPC in a non-production Supabase project.
3. Verify anonymous reads for official templates.
4. Verify anonymous and normal authenticated writes are rejected.
5. Verify authenticated admin writes succeed only through the trusted function.
6. Apply `001_secure_official_data.sql`.
7. Re-run the verification checks and record the migration timestamp.
8. Keep a rollback script prepared; never restore the old broad anon policies.
