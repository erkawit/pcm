-- ========================================================
-- QUOTATION MANAGEMENT SYSTEM FOR PLAYCH & MULTI-TENANT
-- Schema Definition for Supabase (PostgreSQL)
-- ========================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Organizations / Stores / Streamer Channels
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
    theme_preset TEXT DEFAULT 'gamer-cyan-ruby',
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
    issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
    valid_until DATE,
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
    created_by_user_id UUID REFERENCES app_users(id) ON DELETE SET NULL,
    signatory_user_id UUID REFERENCES app_users(id) ON DELETE SET NULL,
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
    user_id UUID REFERENCES app_users(id) ON DELETE SET NULL,
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

-- Seed Initial Default Organization (PlayCH - Game Creator Channel)
INSERT INTO organizations (
    name, legal_name, tagline, logo_url, tax_id, address, phone, email, website, 
    bank_name, bank_account_name, bank_account_number, is_default, theme_preset
) VALUES (
    'PlayCH (Play Channel)',
    'บริษัท เพลย์แชนแนล มีเดีย แอนด์ เกมมิ่ง กรุ๊ป จำกัด',
    'Official Game Creator & Esports Broadcasting Hub',
    '/logos/playch-logo.png',
    '0105567089123',
    '88/9 ถ.รัชดาภิเษก แขวงดินแดง เขตดินแดง กรุงเทพมหานคร 10400',
    '082-999-7890, 02-123-4567',
    'contact@playchannel.live',
    'https://playch.tv',
    'ธนาคารกสิกรไทย (KBANK)',
    'บจก. เพลย์แชนแนล มีเดีย',
    '789-2-34567-8',
    true,
    'gamer-cyan-ruby'
) ON CONFLICT DO NOTHING;

-- Seed Initial Signatory & Staff Users
INSERT INTO app_users (
    username, full_name, email, role, department, position, phone, can_sign, max_approval_amount, is_active
) VALUES 
(
    'playch_admin',
    'พงศธร เกียรติวานิช (Admin Master)',
    'admin@playchannel.live',
    'admin',
    'Management & Executive',
    'Chief Operating Officer (COO)',
    '081-111-2222',
    true,
    2000000.00,
    true
),
(
    'signatory_manager',
    'อดิตรา มอนด์บีนี',
    'aditra.m@playchannel.live',
    'signatory',
    'Executive Board',
    'ผู้จัดการทั่วไป (General Manager)',
    '082-345-6789',
    true,
    1000000.00,
    true
),
(
    'staff_somchai',
    'สมชาย พิชิตเกม',
    'somchai.p@playchannel.live',
    'staff',
    'Content Production & Sales',
    'เจ้าหน้าที่ประสานงานลูกค้าและมีเดีย',
    '089-777-8888',
    false,
    0.00,
    true
) ON CONFLICT DO NOTHING;
