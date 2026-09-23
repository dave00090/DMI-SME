import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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
    const licenseSecret = Deno.env.get("LICENSE_SIGNING_SECRET") ?? "dmi-hardware-os-ed25519-master-key-prod-2026";

    const supabase = createClient(supabaseUrl, supabaseKey);

    const {
      token,
      tenant_id,
      machine_hash,
      current_valid_until,
      client_timestamp,
    } = await req.json();

    if (!token || !tenant_id) {
      return new Response(
        JSON.stringify({ success: false, error: "token and tenant_id are required." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("cf-connecting-ip") ||
      "127.0.0.1";

    const now = Date.now();

    // 1. Clock Rollback & Skew Protection
    if (client_timestamp && Math.abs(now - Number(client_timestamp)) > 15 * 60 * 1000) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "System clock skew or rollback detected. Please synchronize terminal time with network time.",
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Hash input token
    const cleanToken = token.trim().toUpperCase().replace(/[^A-Z0-9-]/g, "");
    const tokenHash = await hmacSha256(voucherPepper, cleanToken);

    // 3. Call Atomic Stored Function with row-level lock & rate limiting
    const { data, error } = await supabase.rpc("redeem_voucher_atomic", {
      p_token_hash: tokenHash,
      p_tenant_id: tenant_id,
      p_ip_address: ip,
      p_max_attempts: 5,
      p_window_minutes: 15,
    });

    if (error) {
      return new Response(
        JSON.stringify({ success: false, error: error.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const result = Array.isArray(data) ? data[0] : data;

    if (!result || !result.success) {
      // Return exact generic message for invalid OR already used
      return new Response(
        JSON.stringify({
          success: false,
          error: result?.error_message || "Invalid or already used voucher token.",
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 4. Renewal & Start-at-redemption clock logic
    // Renewals extend from the current expiry if the tenant still has an active license
    let baseTime = now;
    if (current_valid_until) {
      const currentExpiryMs = new Date(current_valid_until).getTime();
      if (!isNaN(currentExpiryMs) && currentExpiryMs > now) {
        baseTime = currentExpiryMs;
      }
    }

    const durationDays = Number(result.duration_days);
    const validUntilDate = new Date(baseTime + durationDays * 86400000);
    const validUntilStr = validUntilDate.toISOString();

    // 5. Fetch plan limits
    const { data: plan } = await supabase
      .from("plans")
      .select("*")
      .eq("tier", result.tier)
      .eq("duration_days", durationDays)
      .maybeSingle();

    const limits = plan?.limits || {
      max_branches: result.tier === "Enterprise" ? 999 : result.tier === "Business" ? 5 : 1,
      max_devices: result.tier === "Enterprise" ? 999 : result.tier === "Business" ? 10 : 2,
      max_products: result.tier === "Enterprise" ? 999999 : result.tier === "Business" ? 25000 : 1000,
      offline_grace_days: result.tier === "Enterprise" ? 90 : result.tier === "Business" ? 30 : 14,
      features: ["Core POS", "Offline Engine"],
    };

    // 6. Sign cryptographic license with master key
    const licensePayload = JSON.stringify({
      tenantId: tenant_id,
      machineHash: machine_hash || "ALL_HW",
      tier: result.tier,
      durationDays: durationDays,
      limits,
      validFrom: new Date(now).toISOString(),
      validUntil: validUntilStr,
      voucherId: result.voucher_id,
      issuedAt: new Date(now).toISOString(),
      issuer: "DMi Cloud Systems Authority",
    });

    const signature = await hmacSha256(licenseSecret, licensePayload);
    const signedLicense = `DMI-CRYPT-${btoa(licensePayload).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")}.${signature.slice(0, 32)}`;

    const fingerprint = (await hmacSha256("pub-key-salt", licenseSecret)).slice(0, 16);

    return new Response(
      JSON.stringify({
        success: true,
        licenseKey: signedLicense,
        validUntil: validUntilStr,
        tier: result.tier,
        durationDays,
        voucherId: result.voucher_id,
        fingerprint,
        limits,
        message: `Success! License voucher verified. System upgraded to ${result.tier} for ${durationDays} days.`,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ success: false, error: err.message ?? "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
