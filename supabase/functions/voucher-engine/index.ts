// Generates or redeems vouchers. Secrets needed:
// VOUCHER_PEPPER: long random string, never rotated without re-hashing
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { generateToken, hashToken, maskToken } from "../_shared/vouchers.ts";

const env = (k: string) => Deno.env.get(k)!;

Deno.serve(async (req) => {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return new Response("unauthorized", { status: 401 });

  const supabase = createClient(env("SUPABASE_URL"), env("SUPABASE_ANON_KEY"), {
    global: { headers: { Authorization: authHeader } },
  });
  const adminClient = createClient(env("SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"));

  const { action, ...body } = await req.json();

  // 1. GENERATE (platform admin only)
  if (action === "generate") {
    const { data: isAdmin } = await supabase.rpc("is_platform_admin");
    if (!isAdmin) return new Response("forbidden", { status: 403 });

    const { plan, durationDays } = body as { plan: string; durationDays: number };
    const { data: priceRow, error: pErr } = await adminClient
      .from("plan_prices")
      .select("price_kes")
      .eq("plan_id", plan.toLowerCase())
      .eq("duration_days", durationDays)
      .single();
    if (pErr || !priceRow) return new Response("invalid plan/duration", { status: 400 });

    const token = generateToken();
    const hash = await hashToken(token, env("VOUCHER_PEPPER"));
    const { data: user } = await supabase.auth.getUser();

    const { data: row, error: insErr } = await adminClient
      .from("vouchers")
      .insert({
        token_hash: hash,
        masked_prefix: maskToken(token),
        plan_id: plan.toLowerCase(),
        duration_days: durationDays,
        price_kes: priceRow.price_kes,
        created_by: user.user?.id,
      })
      .select()
      .single();
    if (insErr) return new Response(insErr.message, { status: 500 });

    return Response.json({
      voucher: {
        id: row.id,
        tier: plan,
        durationDays,
        price_kes: row.price_kes,
        masked_prefix: row.masked_prefix,
        status: "available",
        generatedAt: row.created_at,
      },
      token, // returned once; client must show it immediately
    });
  }

  // 2. REDEEM (client terminal)
  if (action === "redeem") {
    const { token, tenantId } = body as { token: string; tenantId: string };
    if (!token || !tenantId) return new Response("missing fields", { status: 400 });

    const hash = await hashToken(token, env("VOUCHER_PEPPER"));
    const { data, error } = await adminClient.rpc("redeem_voucher_hash", {
      p_tenant: tenantId,
      p_hash: hash,
    });
    if (error) return new Response(error.message, { status: 400 });
    return Response.json(data);
  }

  return new Response("bad action", { status: 400 });
});
