-- ==============================================================================
-- SUPABASE POSTGRES MIGRATION: POWERSYNC + MULTI-TENANT BUSINESS SCOPING
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. BUSINESS IDENTITY TABLE
CREATE TABLE IF NOT EXISTS public.businesses (
    id TEXT PRIMARY KEY DEFAULT ('BUS-' || upper(substr(md5(random()::text), 1, 8))),
    name TEXT NOT NULL,
    owner_phone TEXT NOT NULL,
    owner_email TEXT,
    currency TEXT DEFAULT 'KSh',
    tax_pin TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. STAFF TABLE (Linked to auth.users with Role & PIN)
CREATE TABLE IF NOT EXISTS public.staff (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    business_id TEXT NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('owner', 'manager', 'cashier', 'storekeeper')),
    phone TEXT NOT NULL,
    email TEXT,
    pin_hash TEXT, -- Stored securely with crypt(pin, gen_salt('bf'))
    assigned_branch_id TEXT,
    is_active BOOLEAN DEFAULT true,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_staff_business_id ON public.staff(business_id);
CREATE INDEX IF NOT EXISTS idx_staff_auth_user_id ON public.staff(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_staff_phone ON public.staff(phone);

-- 4. BRANCHES / OUTLETS TABLE
CREATE TABLE IF NOT EXISTS public.branches (
    id TEXT PRIMARY KEY DEFAULT ('br-' || lower(substr(md5(random()::text), 1, 6))),
    business_id TEXT NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    code TEXT NOT NULL,
    till_number TEXT,
    location TEXT,
    phone TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_branches_business_id ON public.branches(business_id);

-- 5. PRODUCTS TABLE (Catalog Metadata & Prices)
CREATE TABLE IF NOT EXISTS public.products (
    id TEXT PRIMARY KEY,
    business_id TEXT NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    sku TEXT NOT NULL,
    selling_price NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    cost_price NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    unit TEXT DEFAULT 'piece',
    low_stock_threshold NUMERIC(10,2) DEFAULT 5,
    cached_stock NUMERIC(12,2) DEFAULT 0.00, -- Aggregated via delta triggers
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_products_business_id ON public.products(business_id);
CREATE INDEX IF NOT EXISTS idx_products_sku ON public.products(sku);
CREATE INDEX IF NOT EXISTS idx_products_name ON public.products(name);

-- 6. INVENTORY STOCK DELTAS TABLE (Additive Delta-based Sync)
-- Never overwrite absolute stock quantities! Commutative delta stream.
CREATE TABLE IF NOT EXISTS public.inventory_stock_deltas (
    id TEXT PRIMARY KEY DEFAULT ('delta-' || lower(substr(md5(random()::text), 1, 10))),
    business_id TEXT NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    product_id TEXT NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    branch_id TEXT,
    delta_quantity NUMERIC(12,2) NOT NULL, -- Negative for sales/damages, positive for restock
    reason TEXT NOT NULL CHECK (reason IN ('sale', 'restock', 'void_reverse', 'damage', 'transfer_in', 'transfer_out')),
    sale_id TEXT,
    cashier_id TEXT,
    device_id TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_stock_deltas_biz_prod ON public.inventory_stock_deltas(business_id, product_id);
CREATE INDEX IF NOT EXISTS idx_stock_deltas_created ON public.inventory_stock_deltas(created_at);

-- 7. SALES & SALE ITEMS TABLES
CREATE TABLE IF NOT EXISTS public.sales (
    id TEXT PRIMARY KEY,
    business_id TEXT NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    branch_id TEXT,
    receipt_number TEXT NOT NULL,
    subtotal NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    total_discount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    grand_total NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    payment_method TEXT NOT NULL,
    mpesa_code TEXT,
    customer_id TEXT,
    cashier_id TEXT,
    status TEXT DEFAULT 'completed' CHECK (status IN ('completed', 'voided', 'pending')),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_sales_business_id ON public.sales(business_id);
CREATE INDEX IF NOT EXISTS idx_sales_receipt_num ON public.sales(receipt_number);

CREATE TABLE IF NOT EXISTS public.sale_items (
    id TEXT PRIMARY KEY DEFAULT ('si-' || lower(substr(md5(random()::text), 1, 8))),
    sale_id TEXT NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
    product_id TEXT NOT NULL REFERENCES public.products(id),
    quantity NUMERIC(10,2) NOT NULL,
    selling_price NUMERIC(12,2) NOT NULL,
    discount NUMERIC(12,2) DEFAULT 0.00,
    total NUMERIC(12,2) NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sale_items_sale_id ON public.sale_items(sale_id);

-- 8. CUSTOMERS TABLE (Madeni / Credit)
CREATE TABLE IF NOT EXISTS public.customers (
    id TEXT PRIMARY KEY,
    business_id TEXT NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    outstanding_debt NUMERIC(12,2) DEFAULT 0.00,
    credit_limit NUMERIC(12,2) DEFAULT 10000.00,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_customers_business_id ON public.customers(business_id);

-- ==============================================================================
-- 9. ADDITIVE DELTA TRIGGER FUNCTION (Postgres Inventory Aggregator)
-- Automatically increments/decrements products.cached_stock on delta insert
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.apply_inventory_stock_delta()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.products
    SET cached_stock = cached_stock + NEW.delta_quantity,
        updated_at = now()
    WHERE id = NEW.product_id AND business_id = NEW.business_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_apply_stock_delta ON public.inventory_stock_deltas;
CREATE TRIGGER trg_apply_stock_delta
AFTER INSERT ON public.inventory_stock_deltas
FOR EACH ROW EXECUTE FUNCTION public.apply_inventory_stock_delta();

-- ==============================================================================
-- 10. ROW LEVEL SECURITY (RLS) POLICIES
-- Scoped strictly by business_id using JWT custom claims or staff lookup
-- ==============================================================================

-- Helper functions to resolve session context
CREATE OR REPLACE FUNCTION public.get_current_business_id()
RETURNS TEXT AS $$
    SELECT coalesce(
        current_setting('request.jwt.claims', true)::json->>'business_id',
        (SELECT business_id FROM public.staff WHERE auth_user_id = auth.uid() LIMIT 1)
    );
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT AS $$
    SELECT coalesce(
        current_setting('request.jwt.claims', true)::json->>'role',
        (SELECT role FROM public.staff WHERE auth_user_id = auth.uid() LIMIT 1)
    );
$$ LANGUAGE sql STABLE;

-- Enable RLS on all tables
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_stock_deltas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- 1. Businesses Policy
CREATE POLICY "Users can only view their own business"
ON public.businesses FOR ALL
USING (id = public.get_current_business_id());

-- 2. Staff Policy
CREATE POLICY "Staff visible only within same business"
ON public.staff FOR ALL
USING (business_id = public.get_current_business_id());

-- 3. Branches Policy
CREATE POLICY "Branches visible within same business"
ON public.branches FOR ALL
USING (business_id = public.get_current_business_id());

-- 4. Products Policy
CREATE POLICY "Products isolated by business"
ON public.products FOR ALL
USING (business_id = public.get_current_business_id())
WITH CHECK (business_id = public.get_current_business_id());

-- 5. Stock Deltas Policy
CREATE POLICY "Stock deltas isolated by business"
ON public.inventory_stock_deltas FOR ALL
USING (business_id = public.get_current_business_id())
WITH CHECK (business_id = public.get_current_business_id());

-- 6. Sales Policy
CREATE POLICY "Sales isolated by business"
ON public.sales FOR ALL
USING (business_id = public.get_current_business_id())
WITH CHECK (business_id = public.get_current_business_id());

-- 7. Sale Items Policy
CREATE POLICY "Sale items isolated by parent sale"
ON public.sale_items FOR ALL
USING (sale_id IN (SELECT id FROM public.sales WHERE business_id = public.get_current_business_id()));

-- 8. Customers Policy
CREATE POLICY "Customers isolated by business"
ON public.customers FOR ALL
USING (business_id = public.get_current_business_id())
WITH CHECK (business_id = public.get_current_business_id());

-- ==============================================================================
-- 11. POWERSYNC PUBLICATION
-- ==============================================================================
DROP PUBLICATION IF EXISTS powersync;
CREATE PUBLICATION powersync FOR TABLE
    public.staff,
    public.branches,
    public.products,
    public.inventory_stock_deltas,
    public.sales,
    public.sale_items,
    public.customers;
