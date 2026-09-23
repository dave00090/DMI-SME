import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const A = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // 32 chars, no ambiguous 0/O, 1/I

function generateToken(): { token: string; maskedPrefix: string } {
  const chunk = () => {
    const bytes = new Uint8Array(4);
    crypto.getRandomValues(bytes);
    return Array.from(bytes, (b) => A[b % 32]).join("");
  };
  const c1 = chunk();
  const c2 = chunk();
  const c3 = chunk();
  const token = `DMI-BIZ-${c1}-${c2}-${c3}`; // >= 60 bits entropy
  const maskedPrefix = `DMI-BIZ-${c1}-****-****`;
  return { token, maskedPrefix };
}

async function hmacSha256(secret: string, data: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, enc.encode(data));
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const voucherPepper = Deno.env.get("VOUCHER_PEPPER") ?? "dmi-voucher-pepper-2026-supersecret-cryptographic-salt";

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { tier, duration_days, mpesa_receipt, created_by } = await req.json();

    if (!tier || !duration_days) {
      return new Response(
        JSON.stringify({ error: "tier and duration_days are required." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 1. Look up plan from authoritative plans table - NEVER accept price from client
    const { data: plan, error: planError } = await supabase
      .from("plans")
      .select("*")
      .eq("tier", tier)
      .eq("duration_days", Number(duration_days))
      .eq("is_active", true)
      .single();

    if (planError || !plan) {
      return new Response(
        JSON.stringify({ error: `Invalid plan for tier: ${tier}, duration: ${duration_days} days.` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Generate 60-bit entropy token
    const { token, maskedPrefix } = generateToken();
    const tokenHash = await hmacSha256(voucherPepper, token);

    // 3. Insert voucher into database with price copied strictly from plans table
    const { data: voucher, error: insertError } = await supabase
      .from("vouchers")
      .insert({
        token_hash: tokenHash,
        masked_prefix: maskedPrefix,
        tier: plan.tier,
        duration_days: plan.duration_days,
        price_kes: plan.price_kes, // STRICT: copied from plans, never client
        status: "available",
        mpesa_receipt: mpesa_receipt ? String(mpesa_receipt).trim() : null,
        created_by: created_by ?? "Dave Migichi (SuperAdmin NOC)",
      })
      .select()
      .single();

    if (insertError) {
      return new Response(
        JSON.stringify({ error: insertError.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Return token ONCE at generation for the administrator/operator
    return new Response(
      JSON.stringify({
        success: true,
        token, // Plaintext shown once, only HMAC is persisted
        voucher,
        notice: "Token is displayed once. Only its HMAC hash is retained in the database.",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message ?? "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
