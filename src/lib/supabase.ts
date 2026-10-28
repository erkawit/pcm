import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Organization, AppUser, ProductItem, Quotation, QuotationAuditLog } from '@/types/quotation';

const ENV_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const ENV_SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const STORAGE_URL_KEY = 'pcm_supabase_url';
const STORAGE_KEY_KEY = 'pcm_supabase_anon_key';

export function getSupabaseConfig(): { url: string; key: string } {
  if (typeof window !== 'undefined') {
    const storedUrl = localStorage.getItem(STORAGE_URL_KEY);
    const storedKey = localStorage.getItem(STORAGE_KEY_KEY);
    if (storedUrl && storedKey) {
      return { url: storedUrl, key: storedKey };
    }
  }
  return {
    url: ENV_SUPABASE_URL,
    key: ENV_SUPABASE_KEY,
  };
}

// Singleton cache to avoid multiple GoTrueClient / Supabase client instances
let _cachedClient: SupabaseClient | null = null;
let _cachedUrl = '';
let _cachedKey = '';

export function saveSupabaseConfig(url: string, key: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_URL_KEY, url.trim());
    localStorage.setItem(STORAGE_KEY_KEY, key.trim());
  }
  _cachedClient = null;
  _cachedUrl = '';
  _cachedKey = '';
}

export function clearSupabaseConfig() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_URL_KEY);
    localStorage.removeItem(STORAGE_KEY_KEY);
  }
  _cachedClient = null;
  _cachedUrl = '';
  _cachedKey = '';
}

export function isSupabaseConfigured(): boolean {
  const { url, key } = getSupabaseConfig();
  return Boolean(url && key && !url.includes('your-project-id') && url.startsWith('http'));
}

export function getSupabaseClient(): SupabaseClient | null {
  const { url, key } = getSupabaseConfig();
  if (!url || !key || url.includes('your-project-id') || !url.startsWith('http')) {
    _cachedClient = null;
    return null;
  }

  // Return existing singleton instance if configuration has not changed
  if (_cachedClient && _cachedUrl === url && _cachedKey === key) {
    return _cachedClient;
  }

  try {
    _cachedClient = createClient(url, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });
    _cachedUrl = url;
    _cachedKey = key;
    return _cachedClient;
  } catch (err) {
    console.warn('Failed to initialize Supabase client singleton:', err);
    return null;
  }
}

export const supabase: SupabaseClient | null = typeof window !== 'undefined'
  ? null
  : getSupabaseClient();

// ========================================================
// SUPABASE DATABASE SYNC HELPERS
// ========================================================

export async function fetchAllFromSupabase(): Promise<{
  organizations?: Organization[];
  users?: AppUser[];
  products?: ProductItem[];
  quotations?: Quotation[];
  auditLogs?: QuotationAuditLog[];
} | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const [orgsRes, usersRes, prodsRes, quotsRes, logsRes] = await Promise.all([
      client.from('organizations').select('*'),
      client.from('app_users').select('*'),
      client.from('products').select('*'),
      client.from('quotations').select('*, quotation_items(*)'),
      client.from('quotation_audit_logs').select('*'),
    ]);

    const result: any = {};

    if (orgsRes.data && orgsRes.data.length > 0) {
      result.organizations = orgsRes.data.map((o: any) => ({
        id: o.id,
        name: o.name,
        legalName: o.legal_name,
        tagline: o.tagline,
        logoUrl: o.logo_url,
        taxId: o.tax_id,
        address: o.address,
        phone: o.phone,
        email: o.email,
        website: o.website,
        bankName: o.bank_name,
        bankAccountName: o.bank_account_name,
        bankAccountNumber: o.bank_account_number,
        promptPayId: o.promptpay_id,
        isDefault: o.is_default,
        createdAt: o.created_at,
      }));
    }

    if (usersRes.data && usersRes.data.length > 0) {
      result.users = usersRes.data.map((u: any) => ({
        id: u.id,
        username: u.username,
        fullName: u.full_name,
        email: u.email,
        role: u.role,
        department: u.department,
        position: u.position,
        phone: u.phone,
        avatarUrl: u.avatar_url,
        signatureDataUrl: u.signature_data_url,
        canSign: u.can_sign,
        maxApprovalAmount: Number(u.max_approval_amount),
        isActive: u.is_active,
        createdAt: u.created_at,
      }));
    }

    if (prodsRes.data && prodsRes.data.length > 0) {
      result.products = prodsRes.data.map((p: any) => ({
        id: p.id,
        orgId: p.org_id,
        sku: p.sku,
        name: p.name,
        category: p.category,
        description: p.description,
        unitPrice: Number(p.unit_price),
        unitLabel: p.unit_label,
        isActive: p.is_active,
        createdAt: p.created_at,
      }));
    }

    if (quotsRes.data && quotsRes.data.length > 0) {
      result.quotations = quotsRes.data.map((q: any) => ({
        id: q.id,
        quotationNumber: q.quotation_number,
        orgId: q.org_id,
        customerName: q.customer_name,
        customerAddress: q.customer_address,
        customerTaxId: q.customer_tax_id,
        customerPhone: q.customer_phone,
        customerEmail: q.customer_email,
        issueDate: q.issue_date,
        validUntil: q.valid_until,
        subtotal: Number(q.subtotal),
        discount: Number(q.discount_amount),
        vatPercent: Number(q.vat_percent),
        vatAmount: Number(q.vat_amount),
        grandTotal: Number(q.grand_total),
        paymentBankName: q.payment_bank_name,
        paymentAccountName: q.payment_account_name,
        paymentAccountNumber: q.payment_account_number,
        notes: q.notes,
        status: q.status,
        theme: q.theme || 'classic',
        createdByUserId: q.created_by_user_id,
        createdByName: q.created_by_name,
        signatoryUserId: q.signatory_user_id,
        signatoryName: q.signatory_name,
        signatoryPosition: q.signatory_position,
        signatureDataUrl: q.signature_data_url,
        signedAt: q.signed_at,
        rejectionReason: q.rejection_reason,
        createdAt: q.created_at,
        updatedAt: q.updated_at,
        items: (q.quotation_items || []).map((it: any) => ({
          id: it.id,
          order: it.item_order,
          productId: it.product_id,
          name: it.item_name,
          quantity: Number(it.quantity),
          unitPrice: Number(it.unit_price),
          totalPrice: Number(it.line_total),
        })),
      }));
    }

    if (logsRes.data && logsRes.data.length > 0) {
      result.auditLogs = logsRes.data.map((l: any) => ({
        id: l.id,
        quotationId: l.quotation_id,
        userId: l.user_id,
        userName: l.user_name,
        action: l.action,
        comment: l.comment,
        timestamp: l.created_at,
      }));
    }

    return result;
  } catch (err) {
    console.warn('Supabase fetch error:', err);
    return null;
  }
}

export async function upsertQuotationToSupabase(quotation: Quotation) {
  const client = getSupabaseClient();
  if (!client) return;

  try {
    const { error: qErr } = await client.from('quotations').upsert({
      id: quotation.id,
      quotation_number: quotation.quotationNumber,
      org_id: quotation.orgId,
      customer_name: quotation.customerName,
      customer_address: quotation.customerAddress,
      customer_tax_id: quotation.customerTaxId,
      customer_phone: quotation.customerPhone,
      customer_email: quotation.customerEmail,
      issue_date: quotation.issueDate,
      valid_until: quotation.validUntil,
      subtotal: quotation.subtotal,
      discount_amount: quotation.discount,
      vat_percent: quotation.vatPercent,
      vat_amount: quotation.vatAmount,
      grand_total: quotation.grandTotal,
      payment_bank_name: quotation.paymentBankName,
      payment_account_name: quotation.paymentAccountName,
      payment_account_number: quotation.paymentAccountNumber,
      notes: quotation.notes,
      status: quotation.status,
      theme: quotation.theme,
      signatory_user_id: quotation.signatoryUserId,
      signatory_name: quotation.signatoryName,
      signatory_position: quotation.signatoryPosition,
      signature_data_url: quotation.signatureDataUrl,
      signed_at: quotation.signedAt,
      rejection_reason: quotation.rejectionReason,
      updated_at: new Date().toISOString(),
    });

    if (qErr) console.warn('Supabase quotation upsert warning:', qErr);

    // Delete and recreate quotation items
    await client.from('quotation_items').delete().eq('quotation_id', quotation.id);

    if (quotation.items && quotation.items.length > 0) {
      await client.from('quotation_items').insert(
        quotation.items.map((it, idx) => ({
          quotation_id: quotation.id,
          product_id: it.productId || null,
          item_order: idx + 1,
          item_name: it.name,
          quantity: it.quantity,
          unit_price: it.unitPrice,
          line_total: it.totalPrice,
        }))
      );
    }
  } catch (err) {
    console.warn('Supabase save error:', err);
  }
}

export async function deleteQuotationFromSupabase(id: string) {
  const client = getSupabaseClient();
  if (!client) return;
  try {
    await client.from('quotations').delete().eq('id', id);
  } catch (err) {
    console.warn('Supabase delete error:', err);
  }
}
