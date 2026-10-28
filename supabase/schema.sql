-- ========================================================
-- QUOTATION MANAGEMENT SYSTEM (PCM)
-- Schema Definition for Supabase (PostgreSQL)
-- ========================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Organizations / Stores / Channels
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    legal_name TEXT,
    tagline TEXT,
    logo_url TEXT,
    tax_id TEXT,
    address TEXT,
    phone TEXT,
    email TEXT,
    website TEXT,
    bank_name TEXT,
    bank_account_name TEXT,
    bank_account_number TEXT,
    promptpay_id TEXT,
    theme_preset TEXT DEFAULT 'classic-clean',
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. System Users & Staff & Signatories
CREATE TABLE IF NOT EXISTS app_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'staff', 'signatory')),
    department TEXT,
    position TEXT NOT NULL,
    phone TEXT,
    avatar_url TEXT,
    signature_data_url TEXT,
    can_sign BOOLEAN DEFAULT false,
    max_approval_amount NUMERIC(15, 2) DEFAULT 500000.00,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Products & Services Catalog
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    sku TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT,
    unit_price NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    unit_label TEXT NOT NULL DEFAULT 'ชิ้น',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Quotations
CREATE TABLE IF NOT EXISTS quotations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quotation_number TEXT UNIQUE NOT NULL,
    org_id UUID REFERENCES organizations(id) ON DELETE RESTRICT,
    customer_name TEXT NOT NULL,
    customer_address TEXT,
    customer_tax_id TEXT,
    customer_phone TEXT,
    customer_email TEXT,
    issue_date TEXT NOT NULL,
    valid_until TEXT,
    subtotal NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    vat_percent NUMERIC(5, 2) NOT NULL DEFAULT 7.00,
    vat_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    discount_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    grand_total NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    payment_bank_name TEXT,
    payment_account_name TEXT,
    payment_account_number TEXT,
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending_approval', 'approved', 'rejected', 'sent')),
    theme TEXT DEFAULT 'classic',
    created_by_user_id TEXT,
    created_by_name TEXT,
    signatory_user_id TEXT,
    signatory_name TEXT,
    signatory_position TEXT,
    signature_data_url TEXT,
    signed_at TIMESTAMPTZ,
    rejection_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Quotation Line Items
CREATE TABLE IF NOT EXISTS quotation_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quotation_id UUID NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    item_order INT NOT NULL DEFAULT 1,
    item_name TEXT NOT NULL,
    quantity NUMERIC(10, 2) NOT NULL DEFAULT 1.00,
    unit_price NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    line_total NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Audit Logs
CREATE TABLE IF NOT EXISTS quotation_audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quotation_id UUID NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
    user_id TEXT,
    user_name TEXT NOT NULL,
    action TEXT NOT NULL,
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indices for rapid lookup
CREATE INDEX IF NOT EXISTS idx_quotations_org ON quotations(org_id);
CREATE INDEX IF NOT EXISTS idx_quotations_status ON quotations(status);
CREATE INDEX IF NOT EXISTS idx_quotation_items_qid ON quotation_items(quotation_id);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);

-- ========================================================
-- ROW LEVEL SECURITY (RLS) POLICIES FOR SUPABASE
-- Allows public read & write using Supabase anon key
-- ========================================================
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotation_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotation_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anon all on organizations" ON organizations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon all on app_users" ON app_users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon all on products" ON products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon all on quotations" ON quotations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon all on quotation_items" ON quotation_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon all on quotation_audit_logs" ON quotation_audit_logs FOR ALL USING (true) WITH CHECK (true);
