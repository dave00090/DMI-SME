// Initiates STK push. Supports two purposes:
//   "voucher"  - sells an offline voucher; token held in voucher_orders until collected.
//   "renewal"  - extends an existing tenant's subscription immediately upon callback.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const env = (k: string) => Deno.env.get(k)!;

async function getDarajaToken(): Promise<string> {
  const creds = btoa(`${env("DARAJA_CONSUMER_KEY")}:${env("DARAJA_CONSUMER_SECRET")}`);
  const res = await fetch(
    "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials",
    { headers: { Authorization: `Basic ${creds}` } },
  );
  if (!res.ok) throw new Error("daraja auth failed");
  return (await res.json()).access_token;
}

Deno.serve(async (req) => {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return new Response("unauthorized", { status: 401 });

  const supabase = createClient(env("SUPABASE_URL"), env("SUPABASE_ANON_KEY"), {
    global: { headers: { Authorization: authHeader } },
  });
  const admin = createClient(env("SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"));

  const { purpose = "voucher", phone, plan, durationDays = 30, buyerName, tenantId } =
    await req.json();

  const cleanPhone = phone.replace(/\D/g, "").replace(/^0/, "254").replace(/^\+/, "");
  if (!/^254(7|1)\d{8}$/.test(cleanPhone)) {
    return new Response("invalid phone", { status: 400 });
  }

  // Authoritative price check
  const { data: priceRow } = await admin
    .from("plan_prices")
    .select("price_kes")
    .eq("plan_id", plan.toLowerCase())
    .eq("duration_days", durationDays)
    .single();
  if (!priceRow) return new Response("invalid plan/duration", { status: 400 });

  const amount = priceRow.price_kes;
  const token = await getDarajaToken();

  const shortcode = env("DARAJA_SHORTCODE");
  const passkey = env("DARAJA_PASSKEY");
  const timestamp = new Date().toISOString().replace(/[-:T.Z]/g, "").slice(0, 14);
  const password = btoa(`${shortcode}${passkey}${timestamp}`);

  const callbackUrl = `${env("SUPABASE_URL")}/functions/v1/mpesa-callback?token=${env("CALLBACK_TOKEN")}&purpose=${purpose}`;

  const stkRes = await fetch(
    "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest",
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        BusinessShortCode: shortcode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: "CustomerPayBillOnline",
        Amount: amount,
        PartyA: cleanPhone,
        PartyB: shortcode,
        PhoneNumber: cleanPhone,
        CallBackURL: callbackUrl,
        AccountReference: purpose === "voucher" ? `VOUCH-${plan.toUpperCase()}` : `SUB-${tenantId}`,
        TransactionDesc: `DMi POS - ${plan} (${durationDays}d)`,
      }),
    },
  );

  const stk = await stkRes.json();
  if (stk.ResponseCode !== "0") {
    return new Response(stk.ResponseDescription || "STK failed", { status: 502 });
  }

  const { data: user } = await supabase.auth.getUser();

  if (purpose === "voucher") {
    await admin.from("voucher_orders").insert({
      checkout_request_id: stk.CheckoutRequestID,
      plan_id: plan.toLowerCase(),
      duration_days: durationDays,
      amount,
      phone: cleanPhone,
      buyer_name: buyerName,
      created_by: user.user?.id,
    });
  } else {
    // Existing renewal flow: rows go to subscription_payments as pending
    await admin.from("subscription_payments").insert({
      tenant_id: tenantId,
      plan_id: plan.toLowerCase(),
      period_days: durationDays,
      amount,
      method: "mpesa",
      status: "pending",
      mpesa_checkout_id: stk.CheckoutRequestID,
      phone: cleanPhone,
    });
  }

  return Response.json({
    checkoutRequestId: stk.CheckoutRequestID,
    merchantRequestId: stk.MerchantRequestID,
    amount,
    customerMessage: stk.CustomerMessage,
  });
});
