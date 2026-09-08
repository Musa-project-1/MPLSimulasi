import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const MAX_BODY_BYTES = 1_000_000;
const ALLOWED_IDS = new Set([
  "master_s18",
  "master_teams_catalog",
  "official_live_matches",
]);

type MutationRequest = {
  action: "upsert_schedule" | "upsert_teams" | "broadcast_live";
  payload: Record<string, unknown>;
};

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function validateMutation(input: unknown): MutationRequest {
  if (!isRecord(input)) throw new Error("Request body must be an object.");
  const action = input.action;
  const payload = input.payload;
  if (
    action !== "upsert_schedule" &&
    action !== "upsert_teams" &&
    action !== "broadcast_live"
  ) {
    throw new Error("Unsupported admin mutation.");
  }
  if (!isRecord(payload)) throw new Error("Mutation payload must be an object.");
  if (typeof payload.id !== "string" || !ALLOWED_IDS.has(payload.id)) {
    throw new Error("Mutation target is not allowed.");
  }
  if (!("templates_data" in payload) || !isRecord(payload.templates_data)) {
    throw new Error("templates_data must be an object.");
  }
  return { action, payload };
}

function hasAdminRole(user: { app_metadata?: Record<string, unknown> }) {
  return user.app_metadata?.role === "admin";
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);

  const authHeader = request.headers.get("Authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
  if (!token) return jsonResponse({ error: "Missing bearer token" }, 401);

  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > MAX_BODY_BYTES) return jsonResponse({ error: "Payload too large" }, 413);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return jsonResponse({ error: "Function is not configured" }, 503);
  }

  const authClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data: { user }, error: userError } = await authClient.auth.getUser(token);
  if (userError || !user || !hasAdminRole(user)) {
    return jsonResponse({ error: "Admin authorization required" }, 403);
  }

  let mutation: MutationRequest;
  try {
    mutation = validateMutation(await request.json());
  } catch (error) {
    return jsonResponse({ error: error instanceof Error ? error.message : "Invalid request" }, 400);
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey);
  const { error } = await adminClient
    .from("schedule_templates")
    .upsert({
      id: mutation.payload.id,
      templates_data: mutation.payload.templates_data,
      updated_at: new Date().toISOString(),
    }, { onConflict: "id" });

  if (error) return jsonResponse({ error: "Official data write failed" }, 502);
  return jsonResponse({ ok: true, action: mutation.action, id: mutation.payload.id });
});
