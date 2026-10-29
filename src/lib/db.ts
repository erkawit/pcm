/**
 * Data-access layer: แปลงข้อมูลระหว่างแถวในฐานข้อมูล (snake_case) กับโมเดลในแอป (camelCase)
 * และรวมคำสั่ง CRUD ทั้งหมดไว้ที่เดียว ทุกฟังก์ชัน "throw" เมื่อผิดพลาด
 */
import { getSupabase } from './supabase';
import type {
  AppUser,
  AuditAction,
  Organization,
  ProductItem,
  Quotation,
  QuotationAuditLog,
  QuotationLineItem,
} from '@/types/quotation';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = Record<string, any>;

const num = (v: unknown) => (v === null || v === undefined || v === '' ? 0 : Number(v));
const str = (v: unknown) => (v === null || v === undefined ? '' : String(v));

function clean(o: Row): Row {
  return Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined));
}

function check<T>(res: { data: T | null; error: unknown }): T {
  if (res.error) throw res.error;
  return res.data as T;
}

/** แปลง error จาก Supabase/PostgREST ให้เป็นข้อความภาษาไทยที่อ่านเข้าใจ */
export function dbErrorMessage(err: unknown): string {
  const e = err as { code?: string; message?: string } | null;
  if (!e) return 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ';
  const msg = e.message || '';
  if (e.code === '23505') return 'ข้อมูลซ้ำกับที่มีอยู่แล้วในระบบ (เช่น รหัสสินค้า / อีเมล / เลขที่เอกสาร)';
  if (e.code === '23503') return 'ไม่สามารถดำเนินการได้ เนื่องจากมีข้อมูลอื่นอ้างอิงอยู่';
  if (e.code === '42501' || /row-level security/i.test(msg)) return 'คุณไม่มีสิทธิ์ดำเนินการนี้';
  if (e.code === '42P01' || /does not exist/i.test(msg))
    return 'ไม่พบตารางในฐานข้อมูล กรุณารันไฟล์ supabase/schema.sql ใน Supabase SQL Editor';
  if (/Failed to fetch/i.test(msg)) return 'เชื่อมต่อฐานข้อมูลไม่ได้ กรุณาตรวจสอบอินเทอร์เน็ตหรือค่า Supabase URL';
  return msg || 'เกิดข้อผิดพลาด';
}

// ---------------------------------------------------------------------
// Mappers
// ---------------------------------------------------------------------
export function toOrganization(r: Row): Organization {
  return {
    id: r.id,
    name: str(r.name),
    legalName: str(r.legal_name),
    tagline: str(r.tagline),
    logoUrl: r.logo_url || '/logos/playch-logo.png',
    taxId: str(r.tax_id),
    address: str(r.address),
    phone: str(r.phone),
    email: str(r.email),
    website: str(r.website),
    bankName: str(r.bank_name),
    bankAccountName: str(r.bank_account_name),
    bankAccountNumber: str(r.bank_account_number),
    promptPayId: r.promptpay_id ?? undefined,
    isDefault: Boolean(r.is_default),
    createdAt: r.created_at,
  };
}

export function organizationToRow(o: Partial<Organization>): Row {
  return clean({
    name: o.name,
    legal_name: o.legalName,
    tagline: o.tagline,
    logo_url: o.logoUrl,
    tax_id: o.taxId,
    address: o.address,
    phone: o.phone,
    email: o.email,
    website: o.website,
    bank_name: o.bankName,
    bank_account_name: o.bankAccountName,
    bank_account_number: o.bankAccountNumber,
    promptpay_id: o.promptPayId,
    is_default: o.isDefault,
  });
}

export function toAppUser(r: Row): AppUser {
  return {
    id: r.id,
    authUserId: r.auth_user_id ?? undefined,
    username: str(r.username),
    fullName: str(r.full_name),
    email: str(r.email),
    role: r.role,
    department: str(r.department),
    position: str(r.position),
    phone: str(r.phone),
    signatureDataUrl: r.signature_data_url ?? undefined,
    canSign: Boolean(r.can_sign),
    maxApprovalAmount: num(r.max_approval_amount),
    isActive: Boolean(r.is_active),
    createdAt: r.created_at,
  };
}

export function appUserToRow(u: Partial<AppUser>): Row {
  return clean({
    username: u.username,
    full_name: u.fullName,
    email: u.email,
    role: u.role,
    department: u.department,
    position: u.position,
    phone: u.phone,
    signature_data_url: u.signatureDataUrl,
    can_sign: u.canSign,
    max_approval_amount: u.maxApprovalAmount,
    is_active: u.isActive,
  });
}

export function toProduct(r: Row): ProductItem {
  return {
    id: r.id,
    orgId: r.org_id ?? undefined,
    sku: str(r.sku),
    name: str(r.name),
    category: str(r.category),
    description: str(r.description),
    unitPrice: num(r.unit_price),
    unitLabel: str(r.unit_label) || 'รายการ',
    isActive: Boolean(r.is_active),
    createdAt: r.created_at,
  };
}

export function productToRow(p: Partial<ProductItem>): Row {
  return clean({
    org_id: p.orgId === undefined ? undefined : p.orgId || null,
    sku: p.sku,
    name: p.name,
    category: p.category,
    description: p.description,
    unit_price: p.unitPrice,
    unit_label: p.unitLabel,
    is_active: p.isActive,
  });
}

function toLineItem(r: Row): QuotationLineItem {
  return {
    id: r.id,
    order: num(r.item_order),
    productId: r.product_id ?? undefined,
    name: str(r.item_name),
    quantity: num(r.quantity),
    unitPrice: num(r.unit_price),
    totalPrice: num(r.line_total),
  };
}

export function toQuotation(r: Row): Quotation {
  const items: QuotationLineItem[] = (r.quotation_items || [])
    .map(toLineItem)
    .sort((a: QuotationLineItem, b: QuotationLineItem) => a.order - b.order);
  return {
    id: r.id,
    quotationNumber: str(r.quotation_number),
    orgId: r.org_id,
    customerName: str(r.customer_name),
    customerAddress: str(r.customer_address),
    customerTaxId: str(r.customer_tax_id),
    customerPhone: str(r.customer_phone),
    customerEmail: str(r.customer_email),
    issueDate: str(r.issue_date),
    validUntil: str(r.valid_until),
    items,
    subtotal: num(r.subtotal),
    discount: num(r.discount_amount),
    vatPercent: num(r.vat_percent),
    vatAmount: num(r.vat_amount),
    grandTotal: num(r.grand_total),
    paymentBankName: str(r.payment_bank_name),
    paymentAccountName: str(r.payment_account_name),
    paymentAccountNumber: str(r.payment_account_number),
    notes: str(r.notes),
    status: r.status,
    theme: 'classic',
    createdByUserId: r.created_by ?? '',
    createdByName: str(r.created_by_name),
    signatoryUserId: r.signatory_user_id ?? undefined,
    signatoryName: r.signatory_name ?? undefined,
    signatoryPosition: r.signatory_position ?? undefined,
    signatureDataUrl: r.signature_data_url ?? undefined,
    signedAt: r.signed_at ?? undefined,
    rejectionReason: r.rejection_reason ?? undefined,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

/** เฉพาะฟิลด์เนื้อหาเอกสาร (ไม่รวมสถานะ/ลายเซ็น ซึ่งจัดการผ่าน workflow) */
export function quotationContentToRow(q: Partial<Quotation>): Row {
  return clean({
    org_id: q.orgId,
    customer_name: q.customerName,
    customer_address: q.customerAddress,
    customer_tax_id: q.customerTaxId,
    customer_phone: q.customerPhone,
    customer_email: q.customerEmail,
    issue_date: q.issueDate,
    valid_until: q.validUntil,
    subtotal: q.subtotal,
    discount_amount: q.discount,
    vat_percent: q.vatPercent,
    vat_amount: q.vatAmount,
    grand_total: q.grandTotal,
    payment_bank_name: q.paymentBankName,
    payment_account_name: q.paymentAccountName,
    payment_account_number: q.paymentAccountNumber,
    notes: q.notes,
    signatory_user_id: q.signatoryUserId === undefined ? undefined : q.signatoryUserId || null,
    signatory_name: q.signatoryName,
    signatory_position: q.signatoryPosition,
  });
}

function toAuditLog(r: Row): QuotationAuditLog {
  return {
    id: r.id,
    quotationId: r.quotation_id ?? '',
    userId: r.user_id ?? '',
    userName: str(r.user_name),
    action: r.action,
    comment: r.comment ?? undefined,
    timestamp: r.created_at,
  };
}

// ---------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------
const QUOTATION_SELECT = '*, quotation_items(*)';

export async function fetchOrganizations(): Promise<Organization[]> {
  const sb = getSupabase();
  const rows = check<Row[]>(
    await sb.from('organizations').select('*').order('is_default', { ascending: false }).order('created_at')
  );
  return rows.map(toOrganization);
}

export async function fetchUsers(): Promise<AppUser[]> {
  const sb = getSupabase();
  const rows = check<Row[]>(await sb.from('app_users').select('*').order('created_at'));
  return rows.map(toAppUser);
}

export async function fetchProducts(): Promise<ProductItem[]> {
  const sb = getSupabase();
  const rows = check<Row[]>(await sb.from('products').select('*').order('created_at', { ascending: false }));
  return rows.map(toProduct);
}

export async function fetchQuotations(): Promise<Quotation[]> {
  const sb = getSupabase();
  const rows = check<Row[]>(
    await sb.from('quotations').select(QUOTATION_SELECT).order('created_at', { ascending: false })
  );
  return rows.map(toQuotation);
}

export async function fetchAuditLogs(): Promise<QuotationAuditLog[]> {
  const sb = getSupabase();
  const rows = check<Row[]>(
    await sb.from('quotation_audit_logs').select('*').order('created_at', { ascending: false }).limit(500)
  );
  return rows.map(toAuditLog);
}

export async function fetchAllData() {
  const [organizations, users, products, quotations, auditLogs] = await Promise.all([
    fetchOrganizations(),
    fetchUsers(),
    fetchProducts(),
    fetchQuotations(),
    fetchAuditLogs(),
  ]);
  return { organizations, users, products, quotations, auditLogs };
}

export async function fetchProfileByAuthId(authUserId: string): Promise<AppUser | null> {
  const sb = getSupabase();
  const row = check<Row | null>(
    await sb.from('app_users').select('*').eq('auth_user_id', authUserId).maybeSingle()
  );
  return row ? toAppUser(row) : null;
}

export async function fetchQuotationById(id: string): Promise<Quotation> {
  const sb = getSupabase();
  const row = check<Row>(await sb.from('quotations').select(QUOTATION_SELECT).eq('id', id).single());
  return toQuotation(row);
}

// ---------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------
/**
 * Supabase จะ "ไม่ส่ง error" เมื่อ RLS บล็อกการ UPDATE/DELETE แต่จะได้ 0 แถว
 * จึงต้องตรวจจำนวนแถวที่ถูกแก้ไขเสมอ ไม่เช่นนั้นจะดูเหมือนบันทึกสำเร็จแต่ข้อมูลไม่เปลี่ยน
 */
function ensureAffected(rows: Row[] | null, action: string) {
  if (!rows || rows.length === 0) {
    throw { message: `${action}ไม่สำเร็จ: ไม่มีสิทธิ์ หรือไม่พบข้อมูล` };
  }
}

export async function nextQuotationNumber(): Promise<string> {
  const sb = getSupabase();
  return check<string>(await sb.rpc('next_quotation_number'));
}

export async function insertQuotation(row: Row): Promise<string> {
  const sb = getSupabase();
  const data = check<Row>(await sb.from('quotations').insert(row).select('id').single());
  return data.id;
}

export async function updateQuotationRow(id: string, row: Row): Promise<void> {
  const sb = getSupabase();
  const rows = check<Row[]>(await sb.from('quotations').update(row).eq('id', id).select('id'));
  ensureAffected(rows, 'บันทึกเอกสาร');
}

export async function replaceQuotationItems(quotationId: string, items: QuotationLineItem[]) {
  const sb = getSupabase();
  const payload = items.map((it) => ({
    productId: it.productId || '',
    name: it.name,
    quantity: it.quantity,
    unitPrice: it.unitPrice,
    totalPrice: it.totalPrice,
  }));
  check(await sb.rpc('replace_quotation_items', { p_quotation_id: quotationId, p_items: payload }));
}

export async function deleteQuotationRow(id: string): Promise<void> {
  const sb = getSupabase();
  const rows = check<Row[]>(await sb.from('quotations').delete().eq('id', id).select('id'));
  ensureAffected(rows, 'ลบเอกสาร');
}

export async function insertAuditLog(log: {
  quotationId: string | null;
  userId: string;
  userName: string;
  action: AuditAction;
  comment?: string;
}) {
  const sb = getSupabase();
  check(
    await sb.from('quotation_audit_logs').insert({
      quotation_id: log.quotationId,
      user_id: log.userId,
      user_name: log.userName,
      action: log.action,
      comment: log.comment ?? null,
    })
  );
}

export async function insertOrganization(o: Partial<Organization>): Promise<Organization> {
  const sb = getSupabase();
  return toOrganization(check<Row>(await sb.from('organizations').insert(organizationToRow(o)).select('*').single()));
}

export async function updateOrganizationRow(id: string, o: Partial<Organization>): Promise<Organization> {
  const sb = getSupabase();
  const rows = check<Row[]>(await sb.from('organizations').update(organizationToRow(o)).eq('id', id).select('*'));
  ensureAffected(rows, 'บันทึกองค์กร');
  return toOrganization(rows[0]);
}

export async function deleteOrganizationRow(id: string): Promise<void> {
  const sb = getSupabase();
  const rows = check<Row[]>(await sb.from('organizations').delete().eq('id', id).select('id'));
  ensureAffected(rows, 'ลบองค์กร');
}

export async function insertProduct(p: Partial<ProductItem>): Promise<ProductItem> {
  const sb = getSupabase();
  return toProduct(check<Row>(await sb.from('products').insert(productToRow(p)).select('*').single()));
}

export async function updateProductRow(id: string, p: Partial<ProductItem>): Promise<ProductItem> {
  const sb = getSupabase();
  const rows = check<Row[]>(await sb.from('products').update(productToRow(p)).eq('id', id).select('*'));
  ensureAffected(rows, 'บันทึกสินค้า');
  return toProduct(rows[0]);
}

export async function deleteProductRow(id: string): Promise<void> {
  const sb = getSupabase();
  const rows = check<Row[]>(await sb.from('products').delete().eq('id', id).select('id'));
  ensureAffected(rows, 'ลบสินค้า');
}

export async function updateAppUserRow(id: string, u: Partial<AppUser>): Promise<AppUser> {
  const sb = getSupabase();
  const rows = check<Row[]>(await sb.from('app_users').update(appUserToRow(u)).eq('id', id).select('*'));
  ensureAffected(rows, 'บันทึกผู้ใช้งาน');
  return toAppUser(rows[0]);
}

/** เรียก API ฝั่งเซิร์ฟเวอร์ (ใช้ service role) สำหรับสร้าง/ลบ/รีเซ็ตรหัสผ่านผู้ใช้ — admin เท่านั้น */
export async function adminUsersApi<T = Row>(method: 'POST' | 'PATCH' | 'DELETE', payload: Row): Promise<T> {
  const sb = getSupabase();
  const { data } = await sb.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw { message: 'เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่' };

  const res = await fetch('/api/admin/users', {
    method,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw { message: json.error || `เกิดข้อผิดพลาด (HTTP ${res.status})` };
  return json as T;
}
