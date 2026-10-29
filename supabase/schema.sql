-- =====================================================================
-- PCM — ระบบบริหารและออกใบเสนอราคา
-- Supabase (PostgreSQL) schema: Auth + RLS + Workflow enforcement
--
-- วิธีใช้: เปิด Supabase Dashboard → SQL Editor → วางทั้งไฟล์ → Run
-- ไฟล์นี้รันซ้ำได้ แต่ส่วน "RESET" ด้านล่างจะ "ลบตารางเดิมทั้งหมด"
-- =====================================================================

-- ---------------------------------------------------------------------
-- 0) RESET (ลบโครงสร้างเดิม — ข้อมูลในตารางเหล่านี้จะหายทั้งหมด)
--    หากมีข้อมูลจริงแล้ว ให้ลบส่วนนี้ออกก่อนรัน
-- ---------------------------------------------------------------------
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TABLE IF EXISTS quotation_audit_logs CASCADE;
DROP TABLE IF EXISTS quotation_items CASCADE;
DROP TABLE IF EXISTS quotations CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS app_users CASCADE;
DROP TABLE IF EXISTS organizations CASCADE;

-- ---------------------------------------------------------------------
-- 1) TABLES
-- ---------------------------------------------------------------------
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    legal_name TEXT DEFAULT '',
    tagline TEXT DEFAULT '',
    logo_url TEXT DEFAULT '/logos/playch-logo.png',
    tax_id TEXT DEFAULT '',
    address TEXT DEFAULT '',
    phone TEXT DEFAULT '',
    email TEXT DEFAULT '',
    website TEXT DEFAULT '',
    bank_name TEXT DEFAULT '',
    bank_account_name TEXT DEFAULT '',
    bank_account_number TEXT DEFAULT '',
    promptpay_id TEXT,
    is_default BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- โปรไฟล์ผู้ใช้งาน (ผูกกับ Supabase Auth ผ่าน auth_user_id)
CREATE TABLE app_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL DEFAULT 'staff' CHECK (role IN ('admin', 'staff', 'signatory')),
    department TEXT DEFAULT '',
    position TEXT NOT NULL DEFAULT '',
    phone TEXT DEFAULT '',
    signature_data_url TEXT,
    can_sign BOOLEAN NOT NULL DEFAULT false,
    max_approval_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    sku TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'ทั่วไป',
    description TEXT DEFAULT '',
    unit_price NUMERIC(15, 2) NOT NULL DEFAULT 0,
    unit_label TEXT NOT NULL DEFAULT 'รายการ',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE quotations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quotation_number TEXT UNIQUE NOT NULL,
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    customer_name TEXT NOT NULL,
    customer_address TEXT DEFAULT '',
    customer_tax_id TEXT DEFAULT '',
    customer_phone TEXT DEFAULT '',
    customer_email TEXT DEFAULT '',
    issue_date TEXT NOT NULL,          -- รูปแบบไทย เช่น "29 ตุลาคม 2569"
    valid_until TEXT DEFAULT '',
    subtotal NUMERIC(15, 2) NOT NULL DEFAULT 0,
    discount_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
    vat_percent NUMERIC(5, 2) NOT NULL DEFAULT 7,
    vat_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
    grand_total NUMERIC(15, 2) NOT NULL DEFAULT 0,
    payment_bank_name TEXT DEFAULT '',
    payment_account_name TEXT DEFAULT '',
    payment_account_number TEXT DEFAULT '',
    notes TEXT DEFAULT '',
    status TEXT NOT NULL DEFAULT 'draft'
        CHECK (status IN ('draft', 'pending_approval', 'approved', 'rejected', 'sent')),
    created_by UUID REFERENCES app_users(id) ON DELETE SET NULL,
    created_by_name TEXT DEFAULT '',
    signatory_user_id UUID REFERENCES app_users(id) ON DELETE SET NULL,
    signatory_name TEXT,
    signatory_position TEXT,
    signature_data_url TEXT,
    signed_at TIMESTAMPTZ,
    rejection_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE quotation_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quotation_id UUID NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    item_order INT NOT NULL DEFAULT 1,
    item_name TEXT NOT NULL,
    quantity NUMERIC(12, 2) NOT NULL DEFAULT 1,
    unit_price NUMERIC(15, 2) NOT NULL DEFAULT 0,
    line_total NUMERIC(15, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- เก็บประวัติไว้แม้เอกสารถูกลบ (quotation_id จะกลายเป็น NULL)
CREATE TABLE quotation_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quotation_id UUID REFERENCES quotations(id) ON DELETE SET NULL,
    user_id UUID REFERENCES app_users(id) ON DELETE SET NULL,
    user_name TEXT NOT NULL,
    action TEXT NOT NULL,
    comment TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_quotations_org ON quotations(org_id);
CREATE INDEX idx_quotations_status ON quotations(status);
CREATE INDEX idx_quotations_signatory ON quotations(signatory_user_id);
CREATE INDEX idx_quotation_items_qid ON quotation_items(quotation_id);
CREATE INDEX idx_audit_quotation ON quotation_audit_logs(quotation_id);

-- ---------------------------------------------------------------------
-- 2) HELPER FUNCTIONS
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.current_app_user_id()
RETURNS UUID LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id FROM app_users WHERE auth_user_id = auth.uid() AND is_active LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE(
    (SELECT role = 'admin' FROM app_users WHERE auth_user_id = auth.uid() AND is_active LIMIT 1),
    false
  );
$$;

CREATE OR REPLACE FUNCTION public.can_edit_quotation(p_quotation_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.is_admin() OR EXISTS (
    SELECT 1 FROM quotations q
    WHERE q.id = p_quotation_id
      AND q.created_by = public.current_app_user_id()
      AND q.status IN ('draft', 'rejected')
  );
$$;

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END $$;

CREATE TRIGGER trg_org_updated BEFORE UPDATE ON organizations FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_users_updated BEFORE UPDATE ON app_users FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_products_updated BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_quotations_updated BEFORE UPDATE ON quotations FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- เลขที่เอกสารอัตโนมัติ: QT-<ปี พ.ศ.>-0001
CREATE OR REPLACE FUNCTION public.next_quotation_number()
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  yr TEXT := ((EXTRACT(YEAR FROM (NOW() AT TIME ZONE 'Asia/Bangkok'))::INT) + 543)::TEXT;
  n INT;
BEGIN
  SELECT COALESCE(MAX((regexp_match(quotation_number, '^QT-' || yr || '-(\d+)$'))[1]::INT), 0) + 1
    INTO n
    FROM quotations
   WHERE quotation_number LIKE 'QT-' || yr || '-%';
  RETURN 'QT-' || yr || '-' || LPAD(n::TEXT, 4, '0');
END $$;

-- แทนที่รายการสินค้าในเอกสารแบบ transaction เดียว (ใช้สิทธิ์ของผู้เรียก → RLS ยังทำงาน)
CREATE OR REPLACE FUNCTION public.replace_quotation_items(p_quotation_id UUID, p_items JSONB)
RETURNS VOID LANGUAGE plpgsql AS $$
BEGIN
  IF NOT public.can_edit_quotation(p_quotation_id) THEN
    RAISE EXCEPTION 'ไม่มีสิทธิ์แก้ไขรายการสินค้าในเอกสารนี้';
  END IF;

  DELETE FROM quotation_items WHERE quotation_id = p_quotation_id;

  INSERT INTO quotation_items (quotation_id, product_id, item_order, item_name, quantity, unit_price, line_total)
  SELECT p_quotation_id,
         NULLIF(x->>'productId', '')::UUID,
         t.ord::INT,
         COALESCE(NULLIF(x->>'name', ''), '-'),
         COALESCE((x->>'quantity')::NUMERIC, 0),
         COALESCE((x->>'unitPrice')::NUMERIC, 0),
         COALESCE((x->>'totalPrice')::NUMERIC, 0)
    FROM jsonb_array_elements(COALESCE(p_items, '[]'::JSONB)) WITH ORDINALITY AS t(x, ord);
END $$;

GRANT EXECUTE ON FUNCTION public.next_quotation_number() TO authenticated;
GRANT EXECUTE ON FUNCTION public.replace_quotation_items(UUID, JSONB) TO authenticated;

-- ---------------------------------------------------------------------
-- 3) AUTH → PROFILE (สร้างโปรไฟล์อัตโนมัติเมื่อมีผู้ใช้ใหม่ใน Supabase Auth)
--    ผู้ใช้คนแรกของระบบ = admin (เปิดใช้งานทันที)
--    ผู้ใช้ถัดไป = staff ที่ "ยังไม่เปิดใช้งาน" จนกว่า admin จะเปิด
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  is_first BOOLEAN;
BEGIN
  SELECT NOT EXISTS (SELECT 1 FROM public.app_users) INTO is_first;

  INSERT INTO public.app_users (
    auth_user_id, username, full_name, email, role, position,
    can_sign, max_approval_amount, is_active
  ) VALUES (
    NEW.id,
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'username', ''),
             split_part(NEW.email, '@', 1) || '_' || substr(NEW.id::TEXT, 1, 4)),
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'full_name', ''), split_part(NEW.email, '@', 1)),
    NEW.email,
    CASE WHEN is_first THEN 'admin' ELSE 'staff' END,
    CASE WHEN is_first THEN 'ผู้ดูแลระบบ' ELSE 'เจ้าหน้าที่' END,
    is_first,
    CASE WHEN is_first THEN 100000000 ELSE 0 END,
    is_first
  )
  ON CONFLICT (email) DO UPDATE SET auth_user_id = EXCLUDED.auth_user_id;

  RETURN NEW;
END $$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ผู้ใช้ทั่วไปแก้ไขโปรไฟล์ตัวเองได้ (เช่น ลายเซ็น/เบอร์โทร) แต่เปลี่ยนสิทธิ์ตัวเองไม่ได้
CREATE OR REPLACE FUNCTION public.protect_app_user_fields()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.is_admin() THEN
    NEW.role := OLD.role;
    NEW.can_sign := OLD.can_sign;
    NEW.max_approval_amount := OLD.max_approval_amount;
    NEW.is_active := OLD.is_active;
    NEW.auth_user_id := OLD.auth_user_id;
    NEW.email := OLD.email;
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER trg_protect_app_user BEFORE UPDATE ON app_users
  FOR EACH ROW EXECUTE FUNCTION public.protect_app_user_fields();

-- ---------------------------------------------------------------------
-- 4) WORKFLOW ENFORCEMENT (กันการข้ามขั้นตอนอนุมัติจากฝั่ง client)
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.enforce_quotation_workflow()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  me UUID := public.current_app_user_id();
  me_can_sign BOOLEAN;
  me_limit NUMERIC;
BEGIN
  -- service role (ไม่มี auth.uid) และ admin ทำได้ทุกอย่าง
  IF auth.uid() IS NULL OR public.is_admin() THEN
    RETURN NEW;
  END IF;

  IF NEW.status IS DISTINCT FROM OLD.status THEN
    IF NEW.status IN ('approved', 'rejected') THEN
      IF OLD.status <> 'pending_approval' OR OLD.signatory_user_id IS DISTINCT FROM me THEN
        RAISE EXCEPTION 'คุณไม่ใช่ผู้ลงนามที่ได้รับมอบหมายสำหรับเอกสารนี้';
      END IF;
      IF NEW.status = 'approved' THEN
        SELECT can_sign, max_approval_amount INTO me_can_sign, me_limit FROM app_users WHERE id = me;
        IF NOT COALESCE(me_can_sign, false) THEN
          RAISE EXCEPTION 'บัญชีของคุณไม่มีสิทธิ์ลงนามอนุมัติ';
        END IF;
        IF NEW.grand_total > COALESCE(me_limit, 0) THEN
          RAISE EXCEPTION 'ยอดเอกสารเกินวงเงินอนุมัติของคุณ';
        END IF;
      END IF;
    ELSIF NEW.status = 'pending_approval' THEN
      IF OLD.status NOT IN ('draft', 'rejected') OR OLD.created_by IS DISTINCT FROM me THEN
        RAISE EXCEPTION 'ส่งเสนออนุมัติได้เฉพาะเอกสารแบบร่าง/ส่งกลับ ที่คุณเป็นผู้สร้าง';
      END IF;
    ELSIF NEW.status = 'draft' THEN
      IF OLD.status <> 'rejected' OR OLD.created_by IS DISTINCT FROM me THEN
        RAISE EXCEPTION 'ไม่สามารถเปลี่ยนสถานะเอกสารได้';
      END IF;
    ELSE
      RAISE EXCEPTION 'ไม่สามารถเปลี่ยนสถานะเอกสารได้';
    END IF;
  ELSE
    -- แก้ไขเนื้อหา: เฉพาะผู้สร้าง และเอกสารยังเป็นแบบร่าง/ส่งกลับ
    IF OLD.status NOT IN ('draft', 'rejected') OR OLD.created_by IS DISTINCT FROM me THEN
      RAISE EXCEPTION 'เอกสารนี้ถูกล็อกแล้ว (อยู่ระหว่างอนุมัติหรืออนุมัติแล้ว)';
    END IF;
  END IF;

  RETURN NEW;
END $$;

CREATE TRIGGER trg_quotation_workflow BEFORE UPDATE ON quotations
  FOR EACH ROW EXECUTE FUNCTION public.enforce_quotation_workflow();

-- ---------------------------------------------------------------------
-- 5) ROW LEVEL SECURITY
--    anon (ยังไม่ล็อกอิน) เข้าถึงอะไรไม่ได้เลย
-- ---------------------------------------------------------------------
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotation_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotation_audit_logs ENABLE ROW LEVEL SECURITY;

-- organizations: ทุกคนที่ล็อกอินอ่านได้, admin เท่านั้นที่แก้ไข
CREATE POLICY org_select ON organizations FOR SELECT TO authenticated
  USING (public.current_app_user_id() IS NOT NULL);
CREATE POLICY org_write ON organizations FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- app_users: ทุกคนอ่านรายชื่อได้ (เพื่อเลือกผู้ลงนาม), แก้ไขตัวเอง/หรือ admin
CREATE POLICY users_select ON app_users FOR SELECT TO authenticated
  USING (auth_user_id = auth.uid() OR public.current_app_user_id() IS NOT NULL);
CREATE POLICY users_update ON app_users FOR UPDATE TO authenticated
  USING (public.is_admin() OR auth_user_id = auth.uid())
  WITH CHECK (public.is_admin() OR auth_user_id = auth.uid());
CREATE POLICY users_insert ON app_users FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());
CREATE POLICY users_delete ON app_users FOR DELETE TO authenticated
  USING (public.is_admin());

-- products: ทุกคนอ่าน/เพิ่ม/แก้ไขได้, ลบได้เฉพาะ admin
CREATE POLICY products_select ON products FOR SELECT TO authenticated
  USING (public.current_app_user_id() IS NOT NULL);
CREATE POLICY products_insert ON products FOR INSERT TO authenticated
  WITH CHECK (public.current_app_user_id() IS NOT NULL);
CREATE POLICY products_update ON products FOR UPDATE TO authenticated
  USING (public.current_app_user_id() IS NOT NULL)
  WITH CHECK (public.current_app_user_id() IS NOT NULL);
CREATE POLICY products_delete ON products FOR DELETE TO authenticated
  USING (public.is_admin());

-- quotations
CREATE POLICY quot_select ON quotations FOR SELECT TO authenticated
  USING (public.current_app_user_id() IS NOT NULL);
CREATE POLICY quot_insert ON quotations FOR INSERT TO authenticated
  WITH CHECK (public.current_app_user_id() IS NOT NULL AND created_by = public.current_app_user_id());
CREATE POLICY quot_update ON quotations FOR UPDATE TO authenticated
  USING (
    public.is_admin()
    OR created_by = public.current_app_user_id()
    OR signatory_user_id = public.current_app_user_id()
  );
CREATE POLICY quot_delete ON quotations FOR DELETE TO authenticated
  USING (
    public.is_admin()
    OR (created_by = public.current_app_user_id() AND status IN ('draft', 'rejected'))
  );

-- quotation_items
CREATE POLICY items_select ON quotation_items FOR SELECT TO authenticated
  USING (public.current_app_user_id() IS NOT NULL);
CREATE POLICY items_write ON quotation_items FOR ALL TO authenticated
  USING (public.can_edit_quotation(quotation_id))
  WITH CHECK (public.can_edit_quotation(quotation_id));

-- audit logs: อ่านได้ทุกคน, เพิ่มได้ในนามตัวเองเท่านั้น, ห้ามแก้/ลบ
CREATE POLICY logs_select ON quotation_audit_logs FOR SELECT TO authenticated
  USING (public.current_app_user_id() IS NOT NULL);
CREATE POLICY logs_insert ON quotation_audit_logs FOR INSERT TO authenticated
  WITH CHECK (user_id = public.current_app_user_id());

-- ---------------------------------------------------------------------
-- 6) SEED INITIAL ORGANIZATION (สร้างข้อมูลองค์กรตั้งต้นหากยังไม่มี)
-- ---------------------------------------------------------------------
INSERT INTO organizations (
    name, legal_name, tagline, logo_url, tax_id, address,
    phone, email, website, bank_name, bank_account_name,
    bank_account_number, is_default
) 
SELECT 
    'PlayCH (Play Channel)',
    'บริษัท เพลย์แชนแนล มีเดีย แอนด์ เกมมิ่ง กรุ๊ป จำกัด',
    'Official Media & Production Hub',
    '/logos/playch-logo.png',
    '0105567089123',
    '88/9 ถ.รัชดาภิเษก แขวงดินแดง เขตดินแดง กรุงเทพมหานคร 10400',
    '082-999-7890, 02-123-4567',
    'contact@playchannel.live',
    'https://playchannel.live',
    'ธนาคารกสิกรไทย (KBANK)',
    'บจก. เพลย์แชนแนล มีเดีย',
    '789-2-34567-8',
    true
WHERE NOT EXISTS (SELECT 1 FROM organizations);
