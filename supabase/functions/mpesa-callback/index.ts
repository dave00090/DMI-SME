// Public endpoint called by Safaricom. Deploy with --no-verify-jwt.
// Daraja callbacks are not signed, so we require: (1) secret token in the URL,
// (2) a matching pending row created by mpesa-stk, (3) amount check, (4) idempotency.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { generateToken, hashToken, maskToken } from "../_shared/vouchers.ts";

const env = (k: string) => Deno.env.get(k)!;
const ack = () =>
  new Response(JSON.stringify({ ResultCode: 0, ResultDesc: "Accepted" }), {
    headers: { "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  const url = new URL(req.url);
  if (url.searchParams.get("token") !== env("CALLBACK_TOKEN")) {
    return new Response("forbidden", { status: 403 });
  }

  let cb;
  try {
    cb = (await req.json())?.Body?.stkCallback;
  } catch {
    return ack();
  }
  if (!cb) return ack();

  const checkoutId = cb.CheckoutRequestID as string;
  const resultCode = cb.ResultCode as number;
  const admin = createClient(env("SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"));
  const purpose = url.searchParams.get("purpose") || "voucher";

  // --- FLOW A: VOUCHER SALE ---
  if (purpose === "voucher") {
    const { data: order } = await admin
      .from("voucher_orders")
      .select("*")
      .eq("checkout_request_id", checkoutId)
      .single();
    if (!order || order.status !== "pending") return ack();

    if (resultCode !== 0) {
      await admin
        .from("voucher_orders")
        .update({ status: "failed", error: cb.ResultDesc || "payment cancelled" })
        .eq("checkout_request_id", checkoutId);
      return ack();
    }

    const items: Array<{ Name: string; Value: any }> = cb.CallbackMetadata?.Item ?? [];
    const val = (n: string) => items.find((i) => i.Name === n)?.Value;
    const paidAmount = Number(val("Amount"));
    const receipt = String(val("MpesaReceiptNumber") || "").toUpperCase();

    if (paidAmount < order.amount) {
      await admin
        .from("voucher_orders")
        .update({ status: "failed", error: "underpaid" })
        .eq("checkout_request_id", checkoutId);
      return ack();
    }

    // Mint the voucher
    const token = generateToken();
    const hash = await hashToken(token, env("VOUCHER_PEPPER"));
    const etimsInvoice = `INV-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${receipt.slice(-4)}`;

    const { data: voucher, error: vErr } = await admin
      .from("vouchers")
      .insert({
        token_hash: hash,
        masked_prefix: maskToken(token),
        plan_id: order.plan_id,
        duration_days: order.duration_days,
        price_kes: paidAmount,
        mpesa_receipt: receipt,
        etims_invoice_number: etimsInvoice,
        created_by: order.created_by,
      })
      .select()
      .single();

    if (vErr) {
      await admin
        .from("voucher_orders")
        .update({ status: "failed", error: vErr.message })
        .eq("checkout_request_id", checkoutId);
      return ack();
    }

    // Save token_once so the console poller can retrieve it
    await admin
      .from("voucher_orders")
      .update({
        status: "completed",
        voucher_id: voucher.id,
        token_once: token,
      })
      .eq("checkout_request_id", checkoutId);

    return ack();
  }

  // --- FLOW B: SUBSCRIPTION RENEWAL (existing) ---
  const { data: pay } = await admin
    .from("subscription_payments")
    .select("*")
    .eq("mpesa_checkout_id", checkoutId)
    .single();
  if (!pay || pay.status !== "pending") return ack();

  if (resultCode !== 0) {
    await admin
      .from("subscription_payments")
      .update({ status: "failed", failure_reason: cb.ResultDesc })
      .eq("id", pay.id);
    return ack();
  }

  const items: Array<{ Name: string; Value: any }> = cb.CallbackMetadata?.Item ?? [];
  const val = (n: string) => items.find((i) => i.Name === n)?.Value;
  const paidAmount = Number(val("Amount"));
  const receipt = String(val("MpesaReceiptNumber") || "").toUpperCase();

  if (paidAmount < pay.amount) {
    await admin
      .from("subscription_payments")
      .update({ status: "failed", failure_reason: "underpaid" })
      .eq("id", pay.id);
    return ack();
  }

  await admin
    .from("subscription_payments")
    .update({ status: "paid", mpesa_receipt: receipt, verified_at: new Date().toISOString() })
    .eq("id", pay.id);
  await admin.rpc("extend_subscription", {
    p_tenant: pay.tenant_id,
    p_plan: pay.plan_id,
    p_days: pay.period_days,
  });

  return ack();
});
