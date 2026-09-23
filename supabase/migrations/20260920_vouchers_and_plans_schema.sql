-- ==============================================================================
-- DMI SUPABASE POSTGRESQL MIGRATION: PLANS & CRYPTOGRAPHIC VOUCHERS SYSTEM
-- Enforces:
-- 1. Immutable server-authoritative plans & pricing table
-- 2. Zero-plaintext voucher tokens (stored as HMAC-SHA256 hashes only)
-- 3. Atomic single-use redemption with rate-limiting & row-level security
-- 4. Unique M-Pesa payment receipt enforcement (idempotent STK callbacks)
-- ==============================================================================

-- 1. AUTHORITATIVE PLANS & TIERS TABLE
CREATE TABLE IF NOT EXISTS public.plans (
    id TEXT PRIMARY KEY,
    tier TEXT NOT NULL CHECK (tier IN ('Starter', 'Business', 'Enterprise')),
    duration_days INT NOT NULL CHECK (duration_days IN (7, 30, 90, 365)),
    price_kes INT NOT NULL CHECK (price_kes >= 0),
    name TEXT NOT NULL,
    max_branches INT NOT NULL DEFAULT 1,
    max_devices INT NOT NULL DEFAULT 2,
    max_products INT NOT NULL DEFAULT 1000,
    offline_grace_days INT NOT NULL DEFAULT 14,
    features JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Seed authoritative plans
INSERT INTO public.plans (id, tier, duration_days, price_kes, name, max_branches, max_devices, max_products, offline_grace_days, features) VALUES
    ('starter-7d', 'Starter', 7, 700, 'Starter Weekly Pass', 1, 2, 1000, 7, '["Core POS", "Barcode Scanner", "eTIMS Receipting", "Local SQLite Sync"]'::jsonb),
    ('starter-30d', 'Starter', 30, 2500, 'Starter Monthly Subscription', 1, 2, 1000, 14, '["Core POS", "Barcode Scanner", "eTIMS Receipting", "Local SQLite Sync"]'::jsonb),
    ('starter-90d', 'Starter', 90, 7000, 'Starter Quarterly License', 1, 2, 1000, 14, '["Core POS", "Barcode Scanner", "eTIMS Receipting", "Local SQLite Sync"]'::jsonb),
    ('starter-365d', 'Starter', 365, 25000, 'Starter Annual License', 1, 2, 1000, 30, '["Core POS", "Barcode Scanner", "eTIMS Receipting", "Local SQLite Sync"]'::jsonb),
    
    ('biz-7d', 'Business', 7, 2000, 'Business Weekly Pass', 5, 10, 25000, 14, '["Multi-Branch Transfer", "Wholesale & Tiered Pricing", "eTIMS Complete", "Customer Credit Ledger", "WhatsApp Alerts", "Outskirts Sync Engine"]'::jsonb),
    ('biz-30d', 'Business', 30, 7500, 'Business Monthly Subscription', 5, 10, 25000, 30, '["Multi-Branch Transfer", "Wholesale & Tiered Pricing", "eTIMS Complete", "Customer Credit Ledger", "WhatsApp Alerts", "Outskirts Sync Engine"]'::jsonb),
    ('biz-90d', 'Business', 90, 21000, 'Business Quarterly License', 5, 10, 25000, 30, '["Multi-Branch Transfer", "Wholesale & Tiered Pricing", "eTIMS Complete", "Customer Credit Ledger", "WhatsApp Alerts", "Outskirts Sync Engine"]'::jsonb),
    ('biz-365d', 'Business', 365, 75000, 'Business Annual License', 5, 10, 25000, 60, '["Multi-Branch Transfer", "Wholesale & Tiered Pricing", "eTIMS Complete", "Customer Credit Ledger", "WhatsApp Alerts", "Outskirts Sync Engine"]'::jsonb),

    ('ent-7d', 'Enterprise', 7, 6500, 'Enterprise Weekly Pass', 999, 999, 999999, 30, '["Unlimited Branches & Terminals", "Central Fleet Command", "Bi-directional SQLite Mesh", "Automated STK Reconciliation", "Developer Console Access", "24/7 Priority SLA"]'::jsonb),
    ('ent-30d', 'Enterprise', 30, 25000, 'Enterprise Monthly Subscription', 999, 999, 999999, 90, '["Unlimited Branches & Terminals", "Central Fleet Command", "Bi-directional SQLite Mesh", "Automated STK Reconciliation", "Developer Console Access", "24/7 Priority SLA"]'::jsonb),
    ('ent-90d', 'Enterprise', 90, 70000, 'Enterprise Quarterly License', 999, 999, 999999, 90, '["Unlimited Branches & Terminals", "Central Fleet Command", "Bi-directional SQLite Mesh", "Automated STK Reconciliation", "Developer Console Access", "24/7 Priority SLA"]'::jsonb),
    ('ent-365d', 'Enterprise', 365, 250000, 'Enterprise Annual License', 999, 999, 999999, 180, '["Unlimited Branches & Terminals", "Central Fleet Command", "Bi-directional SQLite Mesh", "Automated STK Reconciliation", "Developer Console Access", "24/7 Priority SLA"]'::jsonb)
ON CONFLICT (id) DO UPDATE SET
    price_kes = EXCLUDED.price_kes,
    features = EXCLUDED.features;

-- 2. CRYPTOGRAPHIC VOUCHERS TABLE
-- Plaintext tokens are NEVER stored in this table. Only the HMAC-SHA256 hash.
CREATE TABLE IF NOT EXISTS public.vouchers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token_hash TEXT UNIQUE NOT NULL,
    masked_prefix TEXT NOT NULL,                -- Audit preview (e.g. 'DMI-BIZ-****-****-****')
    tier TEXT NOT NULL,
    duration_days INT NOT NULL,
    price_kes INT NOT NULL,                     -- copied from plans table, NEVER accepted from client
    status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'redeemed', 'revoked', 'expired')),
    mpesa_receipt TEXT UNIQUE,                  -- blocks double-issuing one payment
    redeemed_by_tenant TEXT,
    redeemed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    created_by TEXT DEFAULT 'Dave Migichi (SuperAdmin NOC)',
    etims_invoice_number TEXT                   -- Tax revenue compliance for software licensing
);

CREATE INDEX IF NOT EXISTS idx_vouchers_token_hash ON public.vouchers(token_hash);
CREATE INDEX IF NOT EXISTS idx_vouchers_status ON public.vouchers(status);
CREATE INDEX IF NOT EXISTS idx_vouchers_mpesa_receipt ON public.vouchers(mpesa_receipt);
CREATE INDEX IF NOT EXISTS idx_vouchers_redeemed_tenant ON public.vouchers(redeemed_by_tenant);

-- 3. REDEMPTION RATE LIMIT AUDIT TABLE
CREATE TABLE IF NOT EXISTS public.voucher_redemption_attempts (
    id BIGSERIAL PRIMARY KEY,
    ip_address TEXT NOT NULL,
    tenant_id TEXT NOT NULL,
    attempt_time TIMESTAMPTZ DEFAULT now(),
    was_successful BOOLEAN DEFAULT false
);
CREATE INDEX IF NOT EXISTS idx_voucher_attempts ON public.voucher_redemption_attempts(ip_address, tenant_id, attempt_time);

-- 4. ROW LEVEL SECURITY (RLS)
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vouchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voucher_redemption_attempts ENABLE ROW LEVEL SECURITY;

-- Plans RLS: Everyone can read active plans, only superadmin can modify
DROP POLICY IF EXISTS "Public read plans" ON public.plans;
CREATE POLICY "Public read plans" ON public.plans
    FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Admin modify plans" ON public.plans;
CREATE POLICY "Admin modify plans" ON public.plans
    FOR ALL USING (
        auth.jwt() ->> 'role' = 'superadmin' OR
        auth.jwt() ->> 'email' = 'migichidave09@gmail.com'
    );

-- Vouchers RLS: Only superadmin or service role can select or insert vouchers
DROP POLICY IF EXISTS "Superadmin view vouchers" ON public.vouchers;
CREATE POLICY "Superadmin view vouchers" ON public.vouchers
    FOR SELECT USING (
        auth.jwt() ->> 'role' = 'superadmin' OR
        auth.jwt() ->> 'email' = 'migichidave09@gmail.com'
    );

DROP POLICY IF EXISTS "Tenant view redeemed vouchers" ON public.vouchers;
CREATE POLICY "Tenant view redeemed vouchers" ON public.vouchers
    FOR SELECT USING (
        redeemed_by_tenant = (auth.jwt() -> 'app_metadata' ->> 'business_id')
    );

DROP POLICY IF EXISTS "Superadmin manage vouchers" ON public.vouchers;
CREATE POLICY "Superadmin manage vouchers" ON public.vouchers
    FOR ALL USING (
        auth.jwt() ->> 'role' = 'superadmin' OR
        auth.jwt() ->> 'email' = 'migichidave09@gmail.com'
    );

-- 5. ATOMIC REDEMPTION STORED PROCEDURE
CREATE OR REPLACE FUNCTION public.redeem_voucher_atomic(
    p_token_hash TEXT,
    p_tenant_id TEXT,
    p_ip_address TEXT,
    p_max_attempts INT DEFAULT 5,
    p_window_minutes INT DEFAULT 15
)
RETURNS TABLE (
    success BOOLEAN,
    error_message TEXT,
    tier TEXT,
    duration_days INT,
    price_kes INT,
    voucher_id UUID
) AS $$
DECLARE
    v_recent_failures INT;
    v_voucher RECORD;
BEGIN
    -- Step 1: Rate Limiting Check
    SELECT count(*) INTO v_recent_failures
    FROM public.voucher_redemption_attempts
    WHERE (ip_address = p_ip_address OR tenant_id = p_tenant_id)
      AND attempt_time > (now() - (p_window_minutes || ' minutes')::interval)
      AND was_successful = false;

    IF v_recent_failures >= p_max_attempts THEN
        RETURN QUERY SELECT false, 'Too many failed redemption attempts. Please wait 15 minutes before trying again.'::TEXT, NULL::TEXT, NULL::INT, NULL::INT, NULL::UUID;
        RETURN;
    END IF;

    -- Step 2: Atomic Update with row-level lock
    UPDATE public.vouchers
    SET status = 'redeemed',
        redeemed_by_tenant = p_tenant_id,
        redeemed_at = now()
    WHERE token_hash = p_token_hash
      AND status = 'available'
    RETURNING id, vouchers.tier, vouchers.duration_days, vouchers.price_kes INTO v_voucher;

    -- Step 3: Handle outcome
    IF v_voucher.id IS NULL THEN
        -- Record failed attempt
        INSERT INTO public.voucher_redemption_attempts (ip_address, tenant_id, was_successful)
        VALUES (p_ip_address, p_tenant_id, false);

        -- Give identical generic message for invalid OR already used
        RETURN QUERY SELECT false, 'Invalid or already used voucher token.'::TEXT, NULL::TEXT, NULL::INT, NULL::INT, NULL::UUID;
        RETURN;
    ELSE
        -- Record successful attempt
        INSERT INTO public.voucher_redemption_attempts (ip_address, tenant_id, was_successful)
        VALUES (p_ip_address, p_tenant_id, true);

        RETURN QUERY SELECT true, NULL::TEXT, v_voucher.tier, v_voucher.duration_days, v_voucher.price_kes, v_voucher.id;
        RETURN;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
