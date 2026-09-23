-- ==============================================================================
-- DMI POSTGRESQL / SUPABASE MIGRATION: COMPLETE MULTI-TENANT ARCHITECTURE
-- Designed for: Multi-business SaaS, Branch isolation, Device security,
-- Event-sourced offline SQLite synchronization, Audit logging & Disaster recovery.
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. BUSINESSES (Tenants)
CREATE TABLE IF NOT EXISTS public.businesses (
    id TEXT PRIMARY KEY DEFAULT ('BUS-' || upper(substr(md5(random()::text), 1, 8))),
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    currency TEXT DEFAULT 'KSh',
    tax_pin TEXT,
    plan_tier TEXT DEFAULT 'starter' CHECK (plan_tier IN ('free', 'starter', 'pro', 'enterprise')),
    subscription_status TEXT DEFAULT 'active' CHECK (subscription_status IN ('trial', 'active', 'past_due', 'cancelled')),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. BRANCHES (Locations per Business)
CREATE TABLE IF NOT EXISTS public.branches (
    id TEXT PRIMARY KEY DEFAULT ('br-' || lower(substr(md5(random()::text), 1, 6))),
    business_id TEXT NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    code TEXT NOT NULL,
    location TEXT,
    phone TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_branches_business_id ON public.branches(business_id);

-- 4. ROLES & PERMISSIONS
CREATE TABLE IF NOT EXISTS public.roles (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO public.roles (id, name, description) VALUES
    ('owner', 'Business Owner', 'Full control across all business branches, devices, finances and users'),
    ('manager', 'Store Manager', 'Branch management, inventory ordering, price adjustments and void approvals'),
    ('cashier', 'Counter Cashier', 'Point of sale, barcode scanning, STK Push payments, receipt printing'),
    ('storekeeper', 'Storekeeper', 'Receiving purchase orders, stock taking, damage reporting and inter-branch transfers'),
    ('accountant', 'Accountant', 'Financial reports, reconciliation, tax reports and credit ledger audits')
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.permissions (
    id TEXT PRIMARY KEY,
    module TEXT NOT NULL,
    action TEXT NOT NULL,
    description TEXT
);

CREATE TABLE IF NOT EXISTS public.role_permissions (
    role_id TEXT NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
    permission_id TEXT NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

-- 5. STAFF (Users bound to Business & Role)
CREATE TABLE IF NOT EXISTS public.staff (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    business_id TEXT NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    branch_id TEXT REFERENCES public.branches(id) ON DELETE SET NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL REFERENCES public.roles(id),
    phone TEXT NOT NULL,
    email TEXT,
    pin_hash TEXT,
    is_active BOOLEAN DEFAULT true,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_staff_business_id ON public.staff(business_id);
CREATE INDEX IF NOT EXISTS idx_staff_phone ON public.staff(phone);
CREATE INDEX IF NOT EXISTS idx_staff_branch_id ON public.staff(branch_id);

-- 6. DEVICES (Point of Sale Terminals, Desktops, Android Mobiles)
CREATE TABLE IF NOT EXISTS public.devices (
    id TEXT PRIMARY KEY DEFAULT ('dev-' || lower(substr(md5(random()::text), 1, 8))),
    business_id TEXT NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    branch_id TEXT REFERENCES public.branches(id) ON DELETE SET NULL,
    user_id UUID REFERENCES public.staff(id) ON DELETE SET NULL,
    device_name TEXT NOT NULL,
    device_type TEXT NOT NULL DEFAULT 'pos_terminal' CHECK (device_type IN ('pos_terminal', 'desktop_electron', 'android_capacitor', 'web_tablet')),
    terminal_number TEXT,
    activation_code TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('pending_activation', 'active', 'revoked', 'retired')),
    app_version TEXT,
    ip_address TEXT,
    last_seen TIMESTAMPTZ DEFAULT now(),
    last_sync TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_devices_business_id ON public.devices(business_id);
CREATE INDEX IF NOT EXISTS idx_devices_branch_id ON public.devices(branch_id);

-- 7. PRODUCTS (Catalog metadata)
CREATE TABLE IF NOT EXISTS public.products (
    id TEXT PRIMARY KEY,
    business_id TEXT NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    sku TEXT NOT NULL,
    barcode TEXT,
    selling_price NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    cost_price NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    unit TEXT DEFAULT 'piece',
    low_stock_threshold NUMERIC(10,2) DEFAULT 5,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_products_business_id ON public.products(business_id);
CREATE INDEX IF NOT EXISTS idx_products_sku ON public.products(sku);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON public.products(barcode);

-- 8. BRANCH STOCK (Branch-specific inventory quantities)
CREATE TABLE IF NOT EXISTS public.branch_stock (
    product_id TEXT NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    branch_id TEXT NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
    business_id TEXT NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    quantity NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    shelf_location TEXT,
    updated_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (product_id, branch_id)
);
CREATE INDEX IF NOT EXISTS idx_branch_stock_business ON public.branch_stock(business_id);
CREATE INDEX IF NOT EXISTS idx_branch_stock_branch ON public.branch_stock(branch_id);

-- 9. INVENTORY STOCK DELTAS (Event-sourced offline sync transactions)
CREATE TABLE IF NOT EXISTS public.inventory_stock_deltas (
    id TEXT PRIMARY KEY DEFAULT ('delta-' || lower(substr(md5(random()::text), 1, 10))),
    business_id TEXT NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    branch_id TEXT NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
    product_id TEXT NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    delta_quantity NUMERIC(12,2) NOT NULL, -- Negative for sales, positive for restocks
    reason TEXT NOT NULL CHECK (reason IN ('sale', 'restock', 'void_reverse', 'damage', 'transfer_in', 'transfer_out', 'stock_take')),
    sale_id TEXT,
    cashier_id TEXT,
    device_id TEXT REFERENCES public.devices(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_stock_deltas_lookup ON public.inventory_stock_deltas(business_id, branch_id, product_id);
CREATE INDEX IF NOT EXISTS idx_stock_deltas_created ON public.inventory_stock_deltas(created_at);

-- Automatic Branch Stock Update Trigger
CREATE OR REPLACE FUNCTION public.apply_branch_stock_delta()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.branch_stock (product_id, branch_id, business_id, quantity, updated_at)
    VALUES (NEW.product_id, NEW.branch_id, NEW.business_id, NEW.delta_quantity, now())
    ON CONFLICT (product_id, branch_id)
    DO UPDATE SET 
        quantity = public.branch_stock.quantity + EXCLUDED.quantity,
        updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_apply_branch_stock_delta ON public.inventory_stock_deltas;
CREATE TRIGGER trg_apply_branch_stock_delta
AFTER INSERT ON public.inventory_stock_deltas
FOR EACH ROW EXECUTE FUNCTION public.apply_branch_stock_delta();

-- 10. CUSTOMERS & SUPPLIERS
CREATE TABLE IF NOT EXISTS public.customers (
    id TEXT PRIMARY KEY,
    business_id TEXT NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    location TEXT,
    tax_pin TEXT,
    outstanding_debt NUMERIC(12,2) DEFAULT 0.00,
    credit_limit NUMERIC(12,2) DEFAULT 10000.00,
    payment_terms TEXT DEFAULT 'Strictly 30 Days',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_customers_business_id ON public.customers(business_id);

CREATE TABLE IF NOT EXISTS public.suppliers (
    id TEXT PRIMARY KEY DEFAULT ('sup-' || lower(substr(md5(random()::text), 1, 8))),
    business_id TEXT NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    contact_person TEXT,
    phone TEXT NOT NULL,
    email TEXT,
    categories TEXT[] DEFAULT '{}',
    payment_terms TEXT DEFAULT 'Net 14 Days',
    lead_time_days INTEGER DEFAULT 2,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_suppliers_business_id ON public.suppliers(business_id);

-- 11. SALES, SALE ITEMS & PAYMENTS
CREATE TABLE IF NOT EXISTS public.sales (
    id TEXT PRIMARY KEY,
    business_id TEXT NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    branch_id TEXT NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
    device_id TEXT REFERENCES public.devices(id) ON DELETE SET NULL,
    receipt_number TEXT NOT NULL,
    subtotal NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    total_discount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    grand_total NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    payment_method TEXT NOT NULL,
    customer_id TEXT REFERENCES public.customers(id) ON DELETE SET NULL,
    cashier_id TEXT,
    status TEXT DEFAULT 'completed' CHECK (status IN ('completed', 'voided', 'pending')),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_sales_biz_branch ON public.sales(business_id, branch_id);
CREATE INDEX IF NOT EXISTS idx_sales_receipt ON public.sales(receipt_number);

CREATE TABLE IF NOT EXISTS public.sale_items (
    id TEXT PRIMARY KEY DEFAULT ('si-' || lower(substr(md5(random()::text), 1, 8))),
    sale_id TEXT NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
    product_id TEXT NOT NULL REFERENCES public.products(id),
    quantity NUMERIC(10,2) NOT NULL,
    selling_price NUMERIC(12,2) NOT NULL,
    cost_price NUMERIC(12,2) NOT NULL,
    discount NUMERIC(12,2) DEFAULT 0.00,
    total NUMERIC(12,2) NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sale_items_sale ON public.sale_items(sale_id);

CREATE TABLE IF NOT EXISTS public.payments (
    id TEXT PRIMARY KEY DEFAULT ('pay-' || lower(substr(md5(random()::text), 1, 8))),
    business_id TEXT NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    sale_id TEXT REFERENCES public.sales(id) ON DELETE SET NULL,
    customer_id TEXT REFERENCES public.customers(id) ON DELETE SET NULL,
    amount NUMERIC(12,2) NOT NULL,
    method TEXT NOT NULL CHECK (method IN ('cash', 'mpesa', 'bank_transfer', 'credit')),
    mpesa_receipt TEXT,
    phone TEXT,
    reference_number TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_payments_business ON public.payments(business_id);
CREATE INDEX IF NOT EXISTS idx_payments_mpesa ON public.payments(mpesa_receipt);

-- 12. AUDIT LOGS
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id TEXT PRIMARY KEY DEFAULT ('log-' || lower(substr(md5(random()::text), 1, 10))),
    business_id TEXT NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    branch_id TEXT REFERENCES public.branches(id) ON DELETE SET NULL,
    user_id TEXT,
    action TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    ip_address TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_audit_logs_biz ON public.audit_logs(business_id, created_at);

-- 13. ROW LEVEL SECURITY (RLS)
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.branch_stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_stock_deltas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper to extract business_id from JWT or active staff session
CREATE OR REPLACE FUNCTION public.current_business_id()
RETURNS TEXT AS $$
    SELECT coalesce(
        current_setting('request.jwt.claims', true)::json->>'business_id',
        (SELECT business_id FROM public.staff WHERE auth_user_id = auth.uid() LIMIT 1)
    );
$$ LANGUAGE sql STABLE;

-- RLS Enforcement Policies
CREATE POLICY "Tenant isolation for businesses" ON public.businesses FOR ALL USING (id = public.current_business_id());
CREATE POLICY "Tenant isolation for branches" ON public.branches FOR ALL USING (business_id = public.current_business_id());
CREATE POLICY "Tenant isolation for staff" ON public.staff FOR ALL USING (business_id = public.current_business_id());
CREATE POLICY "Tenant isolation for devices" ON public.devices FOR ALL USING (business_id = public.current_business_id());
CREATE POLICY "Tenant isolation for products" ON public.products FOR ALL USING (business_id = public.current_business_id());
CREATE POLICY "Tenant isolation for branch_stock" ON public.branch_stock FOR ALL USING (business_id = public.current_business_id());
CREATE POLICY "Tenant isolation for stock deltas" ON public.inventory_stock_deltas FOR ALL USING (business_id = public.current_business_id());
CREATE POLICY "Tenant isolation for customers" ON public.customers FOR ALL USING (business_id = public.current_business_id());
CREATE POLICY "Tenant isolation for suppliers" ON public.suppliers FOR ALL USING (business_id = public.current_business_id());
CREATE POLICY "Tenant isolation for sales" ON public.sales FOR ALL USING (business_id = public.current_business_id());
CREATE POLICY "Tenant isolation for sale items" ON public.sale_items FOR ALL USING (
    sale_id IN (SELECT id FROM public.sales WHERE business_id = public.current_business_id())
);
CREATE POLICY "Tenant isolation for payments" ON public.payments FOR ALL USING (business_id = public.current_business_id());
CREATE POLICY "Tenant isolation for audit logs" ON public.audit_logs FOR ALL USING (business_id = public.current_business_id());
