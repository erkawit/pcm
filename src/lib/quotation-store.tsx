'use client';

import React, {
  useState,
  useEffect,
  useCallback,
  createContext,
  useContext,
  ReactNode,
} from 'react';
import type { Session, User } from '@supabase/supabase-js';
import Swal from 'sweetalert2';
import {
  Organization,
  AppUser,
  ProductItem,
  Quotation,
  QuotationAuditLog,
} from '@/types/quotation';
import { getSupabase, isSupabaseConfigured } from './supabase';
import {
  fetchAllData,
  fetchProfileByAuthId,
  fetchQuotations,
  fetchProducts,
  fetchOrganizations,
  fetchUsers,
  fetchAuditLogs,
  nextQuotationNumber,
  insertQuotation,
  updateQuotationRow,
  replaceQuotationItems,
  deleteQuotationRow,
  insertAuditLog,
  insertProduct,
  updateProductRow,
  deleteProductRow,
  insertOrganization,
  updateOrganizationRow,
  deleteOrganizationRow,
  updateAppUserRow,
  adminUsersApi,
  quotationContentToRow,
  dbErrorMessage,
  isValidUuid,
} from './db';

// SweetAlert Professional Business Styled Alert Helpers
export const showSuccessAlert = (title: string, text: string) => {
  return Swal.fire({
    title,
    text,
    icon: 'success',
    background: '#ffffff',
    color: '#0f172a',
    confirmButtonColor: '#2563eb',
    iconColor: '#16a34a',
    customClass: {
      popup: 'border border-slate-200 rounded-2xl shadow-xl',
    },
  });
};

export const showErrorAlert = (title: string, text: string) => {
  return Swal.fire({
    title,
    text,
    icon: 'error',
    background: '#ffffff',
    color: '#0f172a',
    confirmButtonColor: '#dc2626',
    iconColor: '#ef4444',
    customClass: {
      popup: 'border border-slate-200 rounded-2xl shadow-xl',
    },
  });
};

export const showConfirmDialog = async (
  title: string,
  text: string,
  confirmButtonText = 'ยืนยัน',
  cancelButtonText = 'ยกเลิก'
) => {
  return Swal.fire({
    title,
    text,
    icon: 'question',
    showCancelButton: true,
    confirmButtonColor: '#2563eb',
    cancelButtonColor: '#64748b',
    confirmButtonText,
    cancelButtonText,
    background: '#ffffff',
    color: '#0f172a',
    iconColor: '#2563eb',
    customClass: {
      popup: 'border border-slate-200 rounded-2xl shadow-xl',
    },
  });
};

const DEFAULT_ORG: Organization = {
  id: 'org-default',
  name: 'PlayCH (Play Channel)',
  legalName: 'บริษัท เพลย์แชนแนล มีเดีย แอนด์ เกมมิ่ง กรุ๊ป จำกัด',
  tagline: 'Official Media & Production Hub',
  logoUrl: '/logos/playch-logo.png',
  taxId: '0105567089123',
  address: '88/9 ถ.รัชดาภิเษก แขวงดินแดง เขตดินแดง กรุงเทพมหานคร 10400',
  phone: '082-999-7890, 02-123-4567',
  email: 'contact@playchannel.live',
  website: 'https://playchannel.live',
  bankName: 'ธนาคารกสิกรไทย (KBANK)',
  bankAccountName: 'บจก. เพลย์แชนแนล มีเดีย',
  bankAccountNumber: '789-2-34567-8',
  isDefault: true,
  createdAt: '2026-01-01T00:00:00.000Z',
};

const GUEST_USER: AppUser = {
  id: 'guest',
  username: 'guest',
  fullName: 'ผู้มาเยือน',
  email: '',
  role: 'staff',
  department: '',
  position: 'รอการเข้าสู่ระบบ',
  phone: '',
  canSign: false,
  maxApprovalAmount: 0,
  isActive: false,
  createdAt: '2026-01-01T00:00:00.000Z',
};

export interface QuotationStoreContextType {
  // Data State
  organizations: Organization[];
  users: AppUser[];
  products: ProductItem[];
  quotations: Quotation[];
  auditLogs: QuotationAuditLog[];
  currentOrg: Organization;
  currentUser: AppUser;
  selectedQuotation: Quotation | null;

  // Auth State & Methods
  session: Session | null;
  authUser: User | null;
  isAuthenticated: boolean;
  isAuthLoading: boolean;
  authError: string | null;
  pendingActivationEmail: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (
    email: string,
    password: string,
    profile: { fullName: string; department?: string; position?: string }
  ) => Promise<void>;
  signOut: () => Promise<void>;

  // Selection & Navigation
  switchUser: (userId: string) => void;
  switchOrganization: (orgId: string) => void;
  selectQuotation: (quotation: Quotation | null) => void;

  // Quotation CRUD & Workflow
  createQuotation: (data: Partial<Quotation>) => Promise<Quotation>;
  updateQuotation: (id: string, data: Partial<Quotation>) => Promise<void>;
  deleteQuotation: (id: string) => Promise<boolean>;
  submitForApproval: (quotationId: string, signatoryUserId: string) => Promise<boolean>;
  approveQuotation: (quotationId: string, signatureDataUrl?: string) => Promise<boolean>;
  rejectQuotation: (quotationId: string, reason: string) => Promise<boolean>;

  // Products CRUD
  createProduct: (product: Omit<ProductItem, 'id' | 'createdAt'>) => Promise<void>;
  updateProduct: (id: string, product: Partial<ProductItem>) => Promise<void>;
  deleteProduct: (id: string) => Promise<boolean>;

  // Users & Profile CRUD
  createUser: (user: Omit<AppUser, 'id' | 'createdAt'>) => Promise<void>;
  updateUser: (id: string, user: Partial<AppUser>) => Promise<void>;
  deleteUser: (id: string) => Promise<boolean>;
  updateUserSignature: (userId: string, signatureDataUrl: string) => Promise<void>;

  // Organizations CRUD
  createOrganization: (org: Omit<Organization, 'id' | 'createdAt'>) => Promise<void>;
  updateOrganization: (id: string, org: Partial<Organization>) => Promise<void>;
  deleteOrganization: (id: string) => Promise<boolean>;

  // System & Synchronization
  isSupabaseActive: boolean;
  isLoadingData: boolean;
  reloadFromSupabase: () => Promise<void>;
  resetToDefaults: () => void;
}

const QuotationStoreContext = createContext<QuotationStoreContextType | null>(null);

export function QuotationStoreProvider({ children }: { children: ReactNode }) {
  const [organizations, setOrganizations] = useState<Organization[]>([DEFAULT_ORG]);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [auditLogs, setAuditLogs] = useState<QuotationAuditLog[]>([]);

  const [currentOrgId, setCurrentOrgId] = useState<string>('org-default');
  const [activeProfileUser, setActiveProfileUser] = useState<AppUser | null>(null);
  const [previewUserId, setPreviewUserId] = useState<string | null>(null);
  const [selectedQuotationId, setSelectedQuotationId] = useState<string | null>(null);

  // Auth State
  const [session, setSession] = useState<Session | null>(null);
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [pendingActivationEmail, setPendingActivationEmail] = useState<string | null>(null);

  const [isSupabaseActive, setIsSupabaseActive] = useState<boolean>(false);
  const [isLoadingData, setIsLoadingData] = useState<boolean>(false);

  // Compute currentUser: prefer preview user if set by admin, otherwise authenticated user profile
  const currentUser: AppUser =
    (previewUserId ? users.find((u) => u.id === previewUserId) : null) ||
    activeProfileUser ||
    GUEST_USER;

  // Compute currentOrg
  const currentOrg: Organization =
    organizations.find((o) => o.id === currentOrgId) || organizations[0] || DEFAULT_ORG;

  // Compute selectedQuotation
  const selectedQuotation: Quotation | null =
    quotations.find((q) => q.id === selectedQuotationId) || quotations[0] || null;

  // Load all data from Supabase
  const reloadFromSupabase = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      setIsSupabaseActive(false);
      return;
    }

    try {
      setIsLoadingData(true);
      const data = await fetchAllData();
      let orgs = data.organizations;

      // หากในฐานข้อมูลยังไม่มีข้อมูลองค์กรเลย ให้ลองสร้างองค์กรเริ่มต้นลง Supabase อัตโนมัติ
      if (orgs.length === 0) {
        try {
          const seeded = await insertOrganization({
            name: DEFAULT_ORG.name,
            legalName: DEFAULT_ORG.legalName,
            tagline: DEFAULT_ORG.tagline,
            logoUrl: DEFAULT_ORG.logoUrl,
            taxId: DEFAULT_ORG.taxId,
            address: DEFAULT_ORG.address,
            phone: DEFAULT_ORG.phone,
            email: DEFAULT_ORG.email,
            website: DEFAULT_ORG.website,
            bankName: DEFAULT_ORG.bankName,
            bankAccountName: DEFAULT_ORG.bankAccountName,
            bankAccountNumber: DEFAULT_ORG.bankAccountNumber,
            promptPayId: DEFAULT_ORG.promptPayId,
            isDefault: true,
          });
          orgs = [seeded];
        } catch {
          // หากยังไม่มีสิทธิ์ (ไม่ใช่ admin) ให้ใช้ค่าเริ่มต้นในหน่วยความจำไปก่อน
        }
      }

      if (orgs.length > 0) {
        setOrganizations(orgs);
        setCurrentOrgId((prev) => {
          if (!prev || prev === 'org-default' || !orgs.some((o) => o.id === prev)) {
            return orgs[0].id;
          }
          return prev;
        });
      }
      setUsers(data.users);
      setProducts(data.products);
      setQuotations(data.quotations);
      setAuditLogs(data.auditLogs);
      setIsSupabaseActive(true);
    } catch (err) {
      console.error('Failed to load data from Supabase:', err);
    } finally {
      setIsLoadingData(false);
    }
  }, []);

  // Sync profile after login or auth state change
  const syncUserProfile = useCallback(async (userId: string) => {
    try {
      const profile = await fetchProfileByAuthId(userId);
      if (profile) {
        if (!profile.isActive) {
          setActiveProfileUser(null);
          setPendingActivationEmail(profile.email);
        } else {
          setActiveProfileUser(profile);
          setPendingActivationEmail(null);
        }
      }
    } catch (err) {
      console.error('Error fetching user profile:', err);
    }
  }, []);

  // Initialize Auth & Supabase Listeners
  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setIsAuthLoading(false);
      setIsSupabaseActive(false);
      return;
    }

    const sb = getSupabase();

    // 1. Check existing session
    sb.auth.getSession().then(async ({ data: { session: initialSession }, error }) => {
      if (error) {
        console.error('Error getting initial session:', error);
      }
      if (initialSession?.user) {
        setSession(initialSession);
        setAuthUser(initialSession.user);
        await syncUserProfile(initialSession.user.id);
        await reloadFromSupabase();
      }
      setIsAuthLoading(false);
    });

    // 2. Listen to Auth changes
    const {
      data: { subscription },
    } = sb.auth.onAuthStateChange(async (event, newSession) => {
      setSession(newSession);
      setAuthUser(newSession?.user || null);

      if (event === 'SIGNED_IN' && newSession?.user) {
        await syncUserProfile(newSession.user.id);
        await reloadFromSupabase();
      } else if (event === 'SIGNED_OUT') {
        setActiveProfileUser(null);
        setPreviewUserId(null);
        setPendingActivationEmail(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [reloadFromSupabase, syncUserProfile]);

  // Authentication: Sign In
  const signIn = async (email: string, password: string) => {
    setAuthError(null);
    if (!isSupabaseConfigured()) {
      throw new Error('ระบบยังไม่ได้เชื่อมต่อ Supabase Database กรุณาตรวจสอบ Environment Variables');
    }

    const sb = getSupabase();
    const { data, error } = await sb.auth.signInWithPassword({ email, password });
    if (error) {
      const msg =
        error.message === 'Invalid login credentials'
          ? 'อีเมลหรือรหัสผ่านไม่ถูกต้อง'
          : error.message;
      setAuthError(msg);
      throw new Error(msg);
    }

    if (data.user) {
      // Fetch profile
      let profile = await fetchProfileByAuthId(data.user.id);
      // If profile takes a moment to be created by trigger, retry once
      if (!profile) {
        await new Promise((resolve) => setTimeout(resolve, 800));
        profile = await fetchProfileByAuthId(data.user.id);
      }

      if (profile && !profile.isActive) {
        setPendingActivationEmail(profile.email);
        await sb.auth.signOut();
        throw new Error(
          'บัญชีของคุณอยู่ระหว่างรอผู้ดูแลระบบ (Admin) เปิดการใช้งาน กรุณาติดต่อ Admin'
        );
      }

      if (profile) {
        setActiveProfileUser(profile);
        setPendingActivationEmail(null);
      }
      await reloadFromSupabase();
    }
  };

  // Authentication: Sign Up
  const signUp = async (
    email: string,
    password: string,
    profileData: { fullName: string; department?: string; position?: string }
  ) => {
    setAuthError(null);
    if (!isSupabaseConfigured()) {
      throw new Error('ระบบยังไม่ได้เชื่อมต่อ Supabase Database');
    }

    const sb = getSupabase();
    const { data, error } = await sb.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: profileData.fullName,
          department: profileData.department || '',
          position: profileData.position || '',
        },
      },
    });

    if (error) {
      setAuthError(error.message);
      throw new Error(error.message);
    }

    if (data.user) {
      // Check if user is active (first user is active automatically, others need activation)
      await new Promise((resolve) => setTimeout(resolve, 600));
      const profile = await fetchProfileByAuthId(data.user.id);
      if (profile && !profile.isActive) {
        setPendingActivationEmail(email);
      }
    }
  };

  // Authentication: Sign Out
  const signOut = async () => {
    if (isSupabaseConfigured()) {
      const sb = getSupabase();
      await sb.auth.signOut();
    }
    setSession(null);
    setAuthUser(null);
    setActiveProfileUser(null);
    setPreviewUserId(null);
    setPendingActivationEmail(null);
  };

  // Selection actions
  const switchUser = (userId: string) => {
    setPreviewUserId(userId);
  };

  const switchOrganization = (orgId: string) => {
    setCurrentOrgId(orgId);
  };

  const selectQuotation = (quotation: Quotation | null) => {
    setSelectedQuotationId(quotation?.id || null);
  };

  // Quotation Management
  const createQuotation = async (data: Partial<Quotation>): Promise<Quotation> => {
    try {
      const qNum = data.quotationNumber || (await nextQuotationNumber());
      let newOrgId = data.orgId || currentOrg.id;

      // ตรวจสอบความถูกต้องของ org_id (ต้องเป็น UUID จริงในฐานข้อมูล Supabase)
      if (!isValidUuid(newOrgId)) {
        const dbOrgs = await fetchOrganizations();
        if (dbOrgs.length > 0) {
          newOrgId = dbOrgs[0].id;
          setCurrentOrgId(newOrgId);
        } else {
          const seeded = await insertOrganization({
            name: DEFAULT_ORG.name,
            legalName: DEFAULT_ORG.legalName,
            tagline: DEFAULT_ORG.tagline,
            logoUrl: DEFAULT_ORG.logoUrl,
            taxId: DEFAULT_ORG.taxId,
            address: DEFAULT_ORG.address,
            phone: DEFAULT_ORG.phone,
            email: DEFAULT_ORG.email,
            website: DEFAULT_ORG.website,
            bankName: DEFAULT_ORG.bankName,
            bankAccountName: DEFAULT_ORG.bankAccountName,
            bankAccountNumber: DEFAULT_ORG.bankAccountNumber,
            promptPayId: DEFAULT_ORG.promptPayId,
            isDefault: true,
          });
          newOrgId = seeded.id;
          setCurrentOrgId(newOrgId);
          setOrganizations([seeded]);
        }
      }

      const quotationRow = {
        quotation_number: qNum,
        org_id: newOrgId,
        customer_name: data.customerName || '',
        customer_address: data.customerAddress || '',
        customer_tax_id: data.customerTaxId || '',
        customer_phone: data.customerPhone || '',
        customer_email: data.customerEmail || '',
        issue_date:
          data.issueDate ||
          new Date().toLocaleDateString('th-TH', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          }),
        valid_until: data.validUntil || '30 วัน นับจากวันที่ออกเอกสาร',
        subtotal: data.subtotal || 0,
        discount_amount: data.discount || 0,
        vat_percent: data.vatPercent !== undefined ? data.vatPercent : 7,
        vat_amount: data.vatAmount || 0,
        grand_total: data.grandTotal || 0,
        payment_bank_name: data.paymentBankName || currentOrg.bankName,
        payment_account_name: data.paymentAccountName || currentOrg.bankAccountName,
        payment_account_number: data.paymentAccountNumber || currentOrg.bankAccountNumber,
        notes: data.notes || '',
        status: 'draft',
        created_by: currentUser.id && currentUser.id !== 'guest' ? currentUser.id : null,
        created_by_name: currentUser.fullName,
        signatory_user_id: data.signatoryUserId || null,
        signatory_name: data.signatoryName || null,
        signatory_position: data.signatoryPosition || null,
      };

      const newId = await insertQuotation(quotationRow);

      if (data.items && data.items.length > 0) {
        await replaceQuotationItems(newId, data.items);
      }

      await insertAuditLog({
        quotationId: newId,
        userId: currentUser.id,
        userName: currentUser.fullName,
        action: 'CREATED',
        comment: `สร้างใบเสนอราคา ${qNum} สำหรับ ${data.customerName}`,
      });

      // Refresh list
      const updatedQuotations = await fetchQuotations();
      setQuotations(updatedQuotations);
      const created = updatedQuotations.find((q) => q.id === newId);
      if (created) {
        setSelectedQuotationId(created.id);
        return created;
      }
      throw new Error('ไม่พบข้อมูลเอกสารหลังการบันทึก');
    } catch (err: unknown) {
      const msg = dbErrorMessage(err);
      showErrorAlert('สร้างใบเสนอราคาไม่สำเร็จ', msg);
      throw new Error(msg);
    }
  };

  const updateQuotation = async (id: string, data: Partial<Quotation>): Promise<void> => {
    try {
      const rowUpdates = quotationContentToRow(data);
      await updateQuotationRow(id, rowUpdates);

      if (data.items) {
        await replaceQuotationItems(id, data.items);
      }

      await insertAuditLog({
        quotationId: id,
        userId: currentUser.id,
        userName: currentUser.fullName,
        action: 'UPDATED',
        comment: `แก้ไขข้อมูลใบเสนอราคา ยอดรวม ฿${(data.grandTotal || 0).toLocaleString()}`,
      });

      const updatedQuotations = await fetchQuotations();
      setQuotations(updatedQuotations);
    } catch (err: unknown) {
      const msg = dbErrorMessage(err);
      showErrorAlert('บันทึกการแก้ไขไม่สำเร็จ', msg);
      throw new Error(msg);
    }
  };

  const deleteQuotation = async (id: string): Promise<boolean> => {
    const confirm = await showConfirmDialog(
      'ยืนยันการลบใบเสนอราคา?',
      'เอกสารและรายการสินค้าที่เกี่ยวข้องจะถูกลบออกจากฐานข้อมูลอย่างถาวร',
      'ยืนยันการลบ',
      'ยกเลิก'
    );
    if (!confirm.isConfirmed) return false;

    try {
      const q = quotations.find((it) => it.id === id);
      await deleteQuotationRow(id);

      await insertAuditLog({
        quotationId: null,
        userId: currentUser.id,
        userName: currentUser.fullName,
        action: 'DELETED',
        comment: `ลบใบเสนอราคาเลขที่ ${q?.quotationNumber || id}`,
      });

      const updatedQuotations = await fetchQuotations();
      setQuotations(updatedQuotations);
      if (selectedQuotationId === id) {
        setSelectedQuotationId(updatedQuotations[0]?.id || null);
      }
      showSuccessAlert('ลบเอกสารสำเร็จ', 'ใบเสนอราคาถูกลบออกจากระบบเรียบร้อย');
      return true;
    } catch (err: unknown) {
      const msg = dbErrorMessage(err);
      showErrorAlert('ลบใบเสนอราคาไม่สำเร็จ', msg);
      return false;
    }
  };

  const submitForApproval = async (
    quotationId: string,
    signatoryUserId: string
  ): Promise<boolean> => {
    try {
      const signatory = users.find((u) => u.id === signatoryUserId);
      if (!signatory) {
        throw new Error('กรุณาเลือกผู้ลงนามที่มีอยู่ในระบบ');
      }

      const sb = getSupabase();
      const { error } = await sb
        .from('quotations')
        .update({
          status: 'pending_approval',
          signatory_user_id: signatory.id,
          signatory_name: signatory.fullName,
          signatory_position: signatory.position,
        })
        .eq('id', quotationId);

      if (error) throw error;

      await insertAuditLog({
        quotationId,
        userId: currentUser.id,
        userName: currentUser.fullName,
        action: 'SUBMITTED_FOR_APPROVAL',
        comment: `ส่งเสนอพิจารณาอนุมัติไปยัง ${signatory.fullName} (${signatory.position})`,
      });

      const updated = await fetchQuotations();
      setQuotations(updated);
      showSuccessAlert('ส่งเสนออนุมัติสำเร็จ', `ส่งเรื่องถึง ${signatory.fullName} เรียบร้อยแล้ว`);
      return true;
    } catch (err: unknown) {
      const msg = dbErrorMessage(err);
      showErrorAlert('ส่งเสนออนุมัติไม่สำเร็จ', msg);
      return false;
    }
  };

  const approveQuotation = async (
    quotationId: string,
    signatureDataUrl?: string
  ): Promise<boolean> => {
    try {
      const sigUrl = signatureDataUrl || currentUser.signatureDataUrl;
      if (!sigUrl) {
        throw new Error('ไม่พบลายเซ็นดิจิทัล กรุณาวาดลายเซ็นก่อนอนุมัติ');
      }

      const sb = getSupabase();
      const { error } = await sb
        .from('quotations')
        .update({
          status: 'approved',
          signature_data_url: sigUrl,
          signed_at: new Date().toISOString(),
          rejection_reason: null,
        })
        .eq('id', quotationId);

      if (error) throw error;

      await insertAuditLog({
        quotationId,
        userId: currentUser.id,
        userName: currentUser.fullName,
        action: 'APPROVED',
        comment: `อนุมัติและลงนามอิเล็กทรอนิกส์เรียบร้อย โดย ${currentUser.fullName}`,
      });

      const updated = await fetchQuotations();
      setQuotations(updated);
      showSuccessAlert('อนุมัติเอกสารเรียบร้อย', 'ใบเสนอราคาได้รับการลงนามดิจิทัลสมบูรณ์แล้ว');
      return true;
    } catch (err: unknown) {
      const msg = dbErrorMessage(err);
      showErrorAlert('อนุมัติเอกสารไม่สำเร็จ', msg);
      return false;
    }
  };

  const rejectQuotation = async (quotationId: string, reason: string): Promise<boolean> => {
    try {
      const sb = getSupabase();
      const { error } = await sb
        .from('quotations')
        .update({
          status: 'rejected',
          rejection_reason: reason,
        })
        .eq('id', quotationId);

      if (error) throw error;

      await insertAuditLog({
        quotationId,
        userId: currentUser.id,
        userName: currentUser.fullName,
        action: 'REJECTED',
        comment: `ส่งกลับแก้ไข: "${reason}"`,
      });

      const updated = await fetchQuotations();
      setQuotations(updated);
      showSuccessAlert('ส่งกลับแก้ไขเรียบร้อย', 'สถานะเอกสารถูกเปลี่ยนเป็นส่งกลับแก้ไขแล้ว');
      return true;
    } catch (err: unknown) {
      const msg = dbErrorMessage(err);
      showErrorAlert('ส่งกลับเอกสารไม่สำเร็จ', msg);
      return false;
    }
  };

  // Products CRUD
  const createProduct = async (product: Omit<ProductItem, 'id' | 'createdAt'>) => {
    try {
      await insertProduct(product);
      const updated = await fetchProducts();
      setProducts(updated);
    } catch (err: unknown) {
      const msg = dbErrorMessage(err);
      showErrorAlert('เพิ่มสินค้าไม่สำเร็จ', msg);
      throw new Error(msg);
    }
  };

  const updateProduct = async (id: string, product: Partial<ProductItem>) => {
    try {
      await updateProductRow(id, product);
      const updated = await fetchProducts();
      setProducts(updated);
    } catch (err: unknown) {
      const msg = dbErrorMessage(err);
      showErrorAlert('แก้ไขสินค้าไม่สำเร็จ', msg);
      throw new Error(msg);
    }
  };

  const deleteProduct = async (id: string): Promise<boolean> => {
    const confirm = await showConfirmDialog(
      'ยืนยันการลบสินค้า?',
      'สินค้านี้จะถูกนำออกจากรายการสินค้าของระบบ',
      'ลบสินค้า',
      'ยกเลิก'
    );
    if (!confirm.isConfirmed) return false;

    try {
      await deleteProductRow(id);
      const updated = await fetchProducts();
      setProducts(updated);
      showSuccessAlert('ลบสินค้าสำเร็จ', 'ลบรายการสินค้าเรียบร้อย');
      return true;
    } catch (err: unknown) {
      const msg = dbErrorMessage(err);
      showErrorAlert('ลบสินค้าไม่สำเร็จ', msg);
      return false;
    }
  };

  // Organizations CRUD
  const createOrganization = async (org: Omit<Organization, 'id' | 'createdAt'>) => {
    try {
      const created = await insertOrganization(org);
      const updated = await fetchOrganizations();
      setOrganizations(updated);
      setCurrentOrgId(created.id);
    } catch (err: unknown) {
      const msg = dbErrorMessage(err);
      showErrorAlert('เพิ่มองค์กรไม่สำเร็จ', msg);
      throw new Error(msg);
    }
  };

  const updateOrganization = async (id: string, org: Partial<Organization>) => {
    try {
      // หาก id เป็น mock placeholder 'org-default' หรือไม่ใช่ UUID ที่ถูกต้อง ให้บันทึกเป็นองค์กรใหม่ลงฐานข้อมูลจริง
      if (id === 'org-default' || !isValidUuid(id)) {
        const created = await insertOrganization({
          name: org.name || DEFAULT_ORG.name,
          legalName: org.legalName || DEFAULT_ORG.legalName,
          tagline: org.tagline || DEFAULT_ORG.tagline,
          logoUrl: org.logoUrl || DEFAULT_ORG.logoUrl,
          taxId: org.taxId || DEFAULT_ORG.taxId,
          address: org.address || DEFAULT_ORG.address,
          phone: org.phone || DEFAULT_ORG.phone,
          email: org.email || DEFAULT_ORG.email,
          website: org.website || DEFAULT_ORG.website,
          bankName: org.bankName || DEFAULT_ORG.bankName,
          bankAccountName: org.bankAccountName || DEFAULT_ORG.bankAccountName,
          bankAccountNumber: org.bankAccountNumber || DEFAULT_ORG.bankAccountNumber,
          promptPayId: org.promptPayId || DEFAULT_ORG.promptPayId,
          isDefault: true,
        });
        const updated = await fetchOrganizations();
        setOrganizations(updated);
        setCurrentOrgId(created.id);
        showSuccessAlert('บันทึกสำเร็จ', 'สร้างข้อมูลองค์กรในระบบเรียบร้อย');
        return;
      }

      await updateOrganizationRow(id, org);
      const updated = await fetchOrganizations();
      setOrganizations(updated);
      showSuccessAlert('บันทึกสำเร็จ', 'อัปเดตข้อมูลองค์กรเรียบร้อย');
    } catch (err: unknown) {
      const msg = dbErrorMessage(err);
      showErrorAlert('แก้ไของค์กรไม่สำเร็จ', msg);
      throw new Error(msg);
    }
  };

  const deleteOrganization = async (id: string): Promise<boolean> => {
    if (organizations.length <= 1) {
      showErrorAlert('ไม่สามารถลบได้', 'ระบบต้องมีองค์กรอย่างน้อย 1 แห่ง');
      return false;
    }

    const confirm = await showConfirmDialog(
      'ยืนยันการลบองค์กร?',
      'ข้อมูลองค์กรนี้จะถูกลบออกจากระบบ',
      'ลบองค์กร',
      'ยกเลิก'
    );
    if (!confirm.isConfirmed) return false;

    try {
      if (id === 'org-default' || !isValidUuid(id)) {
        const updated = organizations.filter((o) => o.id !== id);
        setOrganizations(updated);
        if (currentOrgId === id) {
          setCurrentOrgId(updated[0]?.id || 'org-default');
        }
        showSuccessAlert('ลบองค์กรสำเร็จ', 'ลบข้อมูลองค์กรเรียบร้อย');
        return true;
      }

      await deleteOrganizationRow(id);
      const updated = await fetchOrganizations();
      setOrganizations(updated);
      if (currentOrgId === id) {
        setCurrentOrgId(updated[0]?.id || 'org-default');
      }
      showSuccessAlert('ลบองค์กรสำเร็จ', 'ลบข้อมูลองค์กรเรียบร้อย');
      return true;
    } catch (err: unknown) {
      const msg = dbErrorMessage(err);
      showErrorAlert('ลบองค์กรไม่สำเร็จ', msg);
      return false;
    }
  };

  // Users CRUD
  const createUser = async (user: Omit<AppUser, 'id' | 'createdAt'>) => {
    try {
      // Try calling admin API first if service role key is available
      try {
        await adminUsersApi('POST', {
          email: user.email,
          password: 'Password123!',
          fullName: user.fullName,
          username: user.username,
          role: user.role,
          department: user.department,
          position: user.position,
          phone: user.phone,
          canSign: user.canSign,
          maxApprovalAmount: user.maxApprovalAmount,
          isActive: user.isActive,
        });
      } catch (adminErr) {
        console.warn('adminUsersApi POST failed, attempting direct insert into app_users:', adminErr);
        // Fallback: direct insert into app_users for admin
        const sb = getSupabase();
        const { error: insertErr } = await sb.from('app_users').insert({
          username: user.username,
          full_name: user.fullName,
          email: user.email,
          role: user.role,
          department: user.department,
          position: user.position,
          phone: user.phone,
          can_sign: user.canSign,
          max_approval_amount: user.maxApprovalAmount,
          is_active: user.isActive,
        });
        if (insertErr) throw insertErr;
      }

      const updated = await fetchUsers();
      setUsers(updated);
    } catch (err: unknown) {
      const msg = dbErrorMessage(err);
      showErrorAlert('เพิ่มผู้ใช้ไม่สำเร็จ', msg);
      throw new Error(msg);
    }
  };

  const updateUser = async (id: string, user: Partial<AppUser>) => {
    try {
      await updateAppUserRow(id, user);
      const updated = await fetchUsers();
      setUsers(updated);
      if (activeProfileUser?.id === id) {
        const refreshed = updated.find((u) => u.id === id);
        if (refreshed) setActiveProfileUser(refreshed);
      }
    } catch (err: unknown) {
      const msg = dbErrorMessage(err);
      showErrorAlert('แก้ไขผู้ใช้ไม่สำเร็จ', msg);
      throw new Error(msg);
    }
  };

  const deleteUser = async (id: string): Promise<boolean> => {
    const target = users.find((u) => u.id === id);
    if (!target) return false;

    if (target.id === currentUser.id) {
      showErrorAlert('ไม่สามารถลบได้', 'ไม่สามารถลบบัญชีของตนเองที่กำลังเข้าสู่ระบบอยู่ได้');
      return false;
    }

    const confirm = await showConfirmDialog(
      'ยืนยันการลบผู้ใช้?',
      `ผู้ใช้ ${target.fullName} จะถูกลบออกจากระบบ`,
      'ลบผู้ใช้',
      'ยกเลิก'
    );
    if (!confirm.isConfirmed) return false;

    try {
      if (target.authUserId) {
        try {
          await adminUsersApi('DELETE', { authUserId: target.authUserId, id: target.id });
        } catch {
          const sb = getSupabase();
          await sb.from('app_users').delete().eq('id', id);
        }
      } else {
        const sb = getSupabase();
        await sb.from('app_users').delete().eq('id', id);
      }

      const updated = await fetchUsers();
      setUsers(updated);
      showSuccessAlert('ลบผู้ใช้สำเร็จ', 'ลบข้อมูลผู้ใช้งานเรียบร้อย');
      return true;
    } catch (err: unknown) {
      const msg = dbErrorMessage(err);
      showErrorAlert('ลบผู้ใช้ไม่สำเร็จ', msg);
      return false;
    }
  };

  const updateUserSignature = async (userId: string, signatureDataUrl: string) => {
    try {
      await updateAppUserRow(userId, { signatureDataUrl });
      const updated = await fetchUsers();
      setUsers(updated);
      if (activeProfileUser?.id === userId) {
        setActiveProfileUser((prev) => (prev ? { ...prev, signatureDataUrl } : prev));
      }
    } catch (err: unknown) {
      const msg = dbErrorMessage(err);
      showErrorAlert('บันทึกลายเซ็นไม่สำเร็จ', msg);
      throw new Error(msg);
    }
  };

  const resetToDefaults = () => {
    reloadFromSupabase();
  };

  const isAuthenticated = Boolean(session && activeProfileUser && activeProfileUser.isActive);

  return (
    <QuotationStoreContext.Provider
      value={{
        organizations,
        users,
        products,
        quotations,
        auditLogs,
        currentOrg,
        currentUser,
        selectedQuotation,

        session,
        authUser,
        isAuthenticated,
        isAuthLoading,
        authError,
        pendingActivationEmail,
        signIn,
        signUp,
        signOut,

        switchUser,
        switchOrganization,
        selectQuotation,

        createQuotation,
        updateQuotation,
        deleteQuotation,
        submitForApproval,
        approveQuotation,
        rejectQuotation,

        createProduct,
        updateProduct,
        deleteProduct,

        createUser,
        updateUser,
        deleteUser,
        updateUserSignature,

        createOrganization,
        updateOrganization,
        deleteOrganization,

        isSupabaseActive,
        isLoadingData,
        reloadFromSupabase,
        resetToDefaults,
      }}
    >
      {children}
    </QuotationStoreContext.Provider>
  );
}

export function useQuotationStore(): QuotationStoreContextType {
  const context = useContext(QuotationStoreContext);
  if (!context) {
    throw new Error('useQuotationStore must be used within a QuotationStoreProvider');
  }
  return context;
}
