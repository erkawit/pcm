'use client';

import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import Swal from 'sweetalert2';
import {
  Organization,
  AppUser,
  ProductItem,
  Quotation,
  QuotationAuditLog,
  UserRole,
} from '@/types/quotation';
import {
  fetchAllFromSupabase,
  upsertQuotationToSupabase,
  deleteQuotationFromSupabase,
  isSupabaseConfigured,
} from './supabase';

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

// Seed default digital signature as SVG DataURL for the manager
const DEFAULT_SIGNATURE_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="220" height="70" viewBox="0 0 220 70"><path d="M15,45 Q40,15 70,30 T120,25 T160,40 T195,20 M60,35 Q75,55 90,35 M130,30 L150,52" stroke="%231d4ed8" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

const INITIAL_ORGS: Organization[] = [
  {
    id: 'org-playch',
    name: 'PlayCH (Play Channel)',
    legalName: 'บริษัท เพลย์แชนแนล มีเดีย แอนด์ เกมมิ่ง กรุ๊ป จำกัด',
    tagline: 'Official Game Creator & Esports Broadcasting Hub',
    logoUrl: '/logos/playch-logo.png',
    taxId: '0105567089123',
    address: '88/9 ถ.รัชดาภิเษก แขวงดินแดง เขตดินแดง กรุงเทพมหานคร 10400',
    phone: '082-999-7890, 02-123-4567',
    email: 'contact@playchannel.live',
    website: 'https://playch.tv',
    bankName: 'ธนาคารกสิกรไทย (KBANK)',
    bankAccountName: 'บจก. เพลย์แชนแนล มีเดีย',
    bankAccountNumber: '789-2-34567-8',
    promptPayId: '0105567089123',
    themePreset: 'gamer-cyan-ruby',
    isDefault: true,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'org-dco',
    name: 'DCO Gaming Gear & Merch',
    legalName: 'ร้านดีซีโอ เกียร์เมอร์ ช็อป',
    tagline: 'Gaming Hardware, PC Rig & Dark Fantasy Collectibles',
    logoUrl: '/logos/playch-logo.png',
    taxId: '0105566014499',
    address: '999 อาคารดิจิทัลเกตเวย์ ชั้น 4 สยามสแควร์ กรุงเทพฯ 10330',
    phone: '02-888-9999',
    email: 'shop@dreadcore.online',
    website: 'https://dreadcore.online',
    bankName: 'ธนาคารไทยพาณิชย์ (SCB)',
    bankAccountName: 'DCO Gaming Shop By PlayCH',
    bankAccountNumber: '111-2-99888-0',
    themePreset: 'dark-gold',
    isDefault: false,
    createdAt: '2026-02-01T00:00:00.000Z',
  },
  {
    id: 'org-borcelle',
    name: 'Borcelle Creative Agency',
    legalName: 'บอร์เซลล์ ครีเอทีฟ เอเจนซี่ จำกัด',
    tagline: 'Modern Digital Advertising & Brand Solutions',
    logoUrl: '/logos/playch-logo.png',
    taxId: '1234567890',
    address: '123 Anywhere St., Any City, ST 12345',
    phone: '123-456-7890',
    email: 'hello@reallygreatsite.com',
    website: 'www.reallygreatsite.com',
    bankName: 'LICERIA & CO. BANK',
    bankAccountName: 'LICERIA & CO.',
    bankAccountNumber: '1234567890',
    themePreset: 'classic-cream',
    isDefault: false,
    createdAt: '2026-03-01T00:00:00.000Z',
  },
];

const INITIAL_USERS: AppUser[] = [
  {
    id: 'user-admin',
    username: 'playch_admin',
    fullName: 'พงศธร เกียรติวานิช (Admin Master)',
    email: 'admin@playchannel.live',
    role: 'admin',
    department: 'Management & Operations',
    position: 'Chief Operating Officer (COO)',
    phone: '081-111-2222',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    signatureDataUrl: DEFAULT_SIGNATURE_SVG,
    canSign: true,
    maxApprovalAmount: 5000000,
    isActive: true,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'user-signatory',
    username: 'signatory_manager',
    fullName: 'อดิตรา มอนด์บีนี',
    email: 'aditra.m@playchannel.live',
    role: 'signatory',
    department: 'Executive Board',
    position: 'ผู้จัดการ (General Manager)',
    phone: '082-345-6789',
    avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    signatureDataUrl: DEFAULT_SIGNATURE_SVG,
    canSign: true,
    maxApprovalAmount: 1500000,
    isActive: true,
    createdAt: '2026-01-02T00:00:00.000Z',
  },
  {
    id: 'user-staff',
    username: 'staff_somchai',
    fullName: 'สมชาย พิชิตเกม',
    email: 'somchai.p@playchannel.live',
    role: 'staff',
    department: 'Content Production & Sales',
    position: 'เจ้าหน้าที่ประสานงานลูกค้าและมีเดีย (Media Coordinator)',
    phone: '089-777-8888',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    canSign: false,
    maxApprovalAmount: 0,
    isActive: true,
    createdAt: '2026-01-03T00:00:00.000Z',
  },
];

const INITIAL_PRODUCTS: ProductItem[] = [
  {
    id: 'prod-item-1',
    sku: 'ITEM-001',
    name: 'รายการที่ 1 (สตรีมมิ่งรีวิวเกม YouTube Live 2 ชั่วโมง)',
    category: 'Media & Streaming',
    description: 'โปรโมทและเล่นเกมถ่ายทอดสดพร้อมใส่โลโก้สปอนเซอร์และปักหมุดลิงก์',
    unitPrice: 1000,
    unitLabel: 'รายการ',
    isActive: true,
    createdAt: '2026-01-10T00:00:00.000Z',
  },
  {
    id: 'prod-item-2',
    sku: 'ITEM-002',
    name: 'รายการที่ 2 (ตัดต่อคลิปไฮไลท์ TikTok / Reels / Shorts)',
    category: 'Content Production',
    description: 'ตัดต่อคลิปสั้นไฮไลท์ช็อตเด็ดเกมความคมชัด 4K พร้อมซับไตเติล',
    unitPrice: 1000,
    unitLabel: 'คลิป',
    isActive: true,
    createdAt: '2026-01-10T00:00:00.000Z',
  },
  {
    id: 'prod-item-3',
    sku: 'ITEM-003',
    name: 'รายการที่ 3 (แบนเนอร์สนับสนุนมุมจอสตรีม Overlay 1 สัปดาห์)',
    category: 'Advertising Banner',
    description: 'วางโลโก้แบรนด์มุมขวาบนระหว่างการไลฟ์สตรีม',
    unitPrice: 1000,
    unitLabel: 'แพ็กเกจ',
    isActive: true,
    createdAt: '2026-01-10T00:00:00.000Z',
  },
  {
    id: 'prod-item-4',
    sku: 'ITEM-004',
    name: 'รายการที่ 4 (โพสต์โปรโมท Facebook Page & YouTube Community)',
    category: 'Social Media',
    description: 'โพสต์รูปภาพรีวิวสินค้าพร้อมแท็กเพจแบรนด์',
    unitPrice: 1000,
    unitLabel: 'โพสต์',
    isActive: true,
    createdAt: '2026-01-10T00:00:00.000Z',
  },
  {
    id: 'prod-item-5',
    sku: 'ITEM-005',
    name: 'รายการที่ 5 (สิทธิ์นำคลิปไปยิงโฆษณา Ads Whitelisting 30 วัน)',
    category: 'Commercial Rights',
    description: 'อนุญาตให้แบรนด์นำคลิปไปใช้ในการยิงโฆษณาแบบ Whitelist',
    unitPrice: 1000,
    unitLabel: 'สิทธิ์',
    isActive: true,
    createdAt: '2026-01-10T00:00:00.000Z',
  },
  {
    id: 'prod-item-6',
    sku: 'PC-REAVER-PRO',
    name: 'Custom Gaming PC Rig - PlayCH Esports Edition (Core i9 + RTX 4080)',
    category: 'Hardware & Gear',
    description: 'ชุดคอมพิวเตอร์สเปกสตรีมเมอร์ระดับสูง พร้อม Water Cooling',
    unitPrice: 85900,
    unitLabel: 'เซ็ต',
    isActive: true,
    createdAt: '2026-01-15T00:00:00.000Z',
  },
];

// Initial Quotations (One matches Image 1 exactly!)
const INITIAL_QUOTATIONS: Quotation[] = [
  {
    id: 'quot-sample-01',
    quotationNumber: 'QT-2568-088',
    orgId: 'org-playch',
    customerName: 'OLIVIA WILSON',
    customerAddress: '123 Anywhere St., Any City, ST 12345',
    customerTaxId: '1234567890',
    customerPhone: '123-456-7890',
    customerEmail: 'olivia.wilson@example.com',
    issueDate: '31 สิงหาคม 2568',
    validUntil: '30 กันยายน 2568',
    items: [
      { id: 'item-1', order: 1, name: 'รายการที่ 1', quantity: 1, unitPrice: 1000, totalPrice: 1000 },
      { id: 'item-2', order: 2, name: 'รายการที่ 2', quantity: 3, unitPrice: 1000, totalPrice: 3000 },
      { id: 'item-3', order: 3, name: 'รายการที่ 3', quantity: 1, unitPrice: 1000, totalPrice: 1000 },
      { id: 'item-4', order: 4, name: 'รายการที่ 4', quantity: 1, unitPrice: 1000, totalPrice: 1000 },
      { id: 'item-5', order: 5, name: 'รายการที่ 5', quantity: 2, unitPrice: 1000, totalPrice: 2000 },
    ],
    subtotal: 8000,
    vatPercent: 7,
    vatAmount: 560,
    discount: 100,
    grandTotal: 8460, // Exact value from Image 1! (8000 + 560 - 100 = 8460.00)
    paymentBankName: 'LICERIA & CO. BANK',
    paymentAccountName: 'LICERIA & CO.',
    paymentAccountNumber: '1234567890',
    notes: 'กรุณาชำระเงินมัดจำ 50% ก่อนเริ่มดำเนินการผลิตงาน',
    status: 'approved',
    theme: 'gamer',
    createdByUserId: 'user-staff',
    createdByName: 'สมชาย พิชิตเกม',
    signatoryUserId: 'user-signatory',
    signatoryName: 'อดิตรา มอนด์บีนี',
    signatoryPosition: 'ผู้จัดการ',
    signatureDataUrl: DEFAULT_SIGNATURE_SVG,
    signedAt: '2026-08-31T14:30:00.000Z',
    createdAt: '2026-08-31T10:00:00.000Z',
    updatedAt: '2026-08-31T14:30:00.000Z',
  },
  {
    id: 'quot-sample-02',
    quotationNumber: 'PLAYCH-QT-2568-102',
    orgId: 'org-playch',
    customerName: 'CORSAIR GAMING (THAILAND) CO., LTD.',
    customerAddress: '555 อาคารเอ็มโพเรียม ทาวเวอร์ ชั้น 21 ถ.สุขุมวิท คลองตัน คลองเตย กทม. 10110',
    customerTaxId: '0105558123456',
    customerPhone: '02-664-9988',
    customerEmail: 'partner.th@corsair.com',
    issueDate: '28 ตุลาคม 2568',
    validUntil: '28 พฤศจิกายน 2568',
    items: [
      {
        id: 'item-201',
        order: 1,
        name: 'แพ็กเกจสปอนเซอร์หลัก ทัวร์นาเมนต์ DreadCore Champions League 2026',
        quantity: 1,
        unitPrice: 50000,
        totalPrice: 50000,
      },
      {
        id: 'item-202',
        order: 2,
        name: 'แบนเนอร์ Logo & Product Placement ในห้องแคสเตอร์สตรีมสด',
        quantity: 4,
        unitPrice: 5000,
        totalPrice: 20000,
      },
      {
        id: 'item-203',
        order: 3,
        name: 'ช่วงแจกของรางวัลหูฟังและคีย์บอร์ด Corsair แก่ผู้ชมไลฟ์สด',
        quantity: 2,
        unitPrice: 2500,
        totalPrice: 5000,
      },
    ],
    subtotal: 75000,
    vatPercent: 7,
    vatAmount: 5250,
    discount: 5000,
    grandTotal: 75250,
    paymentBankName: 'ธนาคารกสิกรไทย (KBANK)',
    paymentAccountName: 'บจก. เพลย์แชนแนล มีเดีย',
    paymentAccountNumber: '789-2-34567-8',
    notes: 'ราคารวมการโปรโมทผ่านทุกช่องทางในเครือข่าย PlayCH Network',
    status: 'pending_approval', // Ready for signatory to approve!
    theme: 'gamer',
    createdByUserId: 'user-staff',
    createdByName: 'สมชาย พิชิตเกม',
    signatoryUserId: 'user-signatory',
    signatoryName: 'อดิตรา มอนด์บีนี',
    signatoryPosition: 'ผู้จัดการ',
    createdAt: '2026-10-28T09:00:00.000Z',
    updatedAt: '2026-10-28T09:15:00.000Z',
  },
];

const INITIAL_LOGS: QuotationAuditLog[] = [
  {
    id: 'log-1',
    quotationId: 'quot-sample-01',
    userId: 'user-staff',
    userName: 'สมชาย พิชิตเกม',
    action: 'CREATED',
    comment: 'สร้างใบเสนอราคา QT-2568-088 สำหรับลูกค้า OLIVIA WILSON',
    timestamp: '2026-08-31T10:00:00.000Z',
  },
  {
    id: 'log-2',
    quotationId: 'quot-sample-01',
    userId: 'user-staff',
    userName: 'สมชาย พิชิตเกม',
    action: 'SUBMITTED_FOR_APPROVAL',
    comment: 'ส่งเสนอผู้จัดการ อดิตรา มอนด์บีนี เพื่อพิจารณาอนุมัติ',
    timestamp: '2026-08-31T10:30:00.000Z',
  },
  {
    id: 'log-3',
    quotationId: 'quot-sample-01',
    userId: 'user-signatory',
    userName: 'อดิตรา มอนด์บีนี',
    action: 'APPROVED',
    comment: 'ตรวจสอบความถูกต้องและอนุมัติใบเสนอราคาเรียบร้อย',
    timestamp: '2026-08-31T14:30:00.000Z',
  },
  {
    id: 'log-4',
    quotationId: 'quot-sample-02',
    userId: 'user-staff',
    userName: 'สมชาย พิชิตเกม',
    action: 'SUBMITTED_FOR_APPROVAL',
    comment: 'ส่งเสนอผู้จัดการ อนุมัติแพ็กเกจทัวร์นาเมนต์ Corsair Gaming',
    timestamp: '2026-10-28T09:15:00.000Z',
  },
];

const STORAGE_KEY = 'playch_quotation_system_v1';

interface QuotationStoreContextType {
  organizations: Organization[];
  users: AppUser[];
  products: ProductItem[];
  quotations: Quotation[];
  auditLogs: QuotationAuditLog[];
  currentUser: AppUser;
  currentOrg: Organization;
  selectedQuotation: Quotation | null;

  // Actions
  switchUser: (userId: string) => void;
  switchOrganization: (orgId: string) => void;
  selectQuotation: (quotation: Quotation | null) => void;

  // Quotation Management
  createQuotation: (data: Partial<Quotation>) => Promise<Quotation>;
  updateQuotation: (id: string, data: Partial<Quotation>) => Promise<void>;
  deleteQuotation: (id: string) => Promise<boolean>;
  submitForApproval: (quotationId: string, signatoryUserId: string) => Promise<boolean>;
  approveQuotation: (quotationId: string, signatureDataUrl?: string) => Promise<boolean>;
  rejectQuotation: (quotationId: string, reason: string) => Promise<boolean>;

  // Products
  createProduct: (product: Omit<ProductItem, 'id' | 'createdAt'>) => Promise<void>;
  updateProduct: (id: string, product: Partial<ProductItem>) => Promise<void>;
  deleteProduct: (id: string) => Promise<boolean>;

  // Users & Staff
  createUser: (user: Omit<AppUser, 'id' | 'createdAt'>) => Promise<void>;
  updateUser: (id: string, user: Partial<AppUser>) => Promise<void>;
  deleteUser: (id: string) => Promise<boolean>;
  updateUserSignature: (userId: string, signatureDataUrl: string) => Promise<void>;

  // Organizations
  createOrganization: (org: Omit<Organization, 'id' | 'createdAt'>) => Promise<void>;
  updateOrganization: (id: string, org: Partial<Organization>) => Promise<void>;
  deleteOrganization: (id: string) => Promise<boolean>;

  // System
  isSupabaseActive: boolean;
  reloadFromSupabase: () => Promise<void>;
  resetToDefaults: () => void;
}

const QuotationStoreContext = createContext<QuotationStoreContextType | null>(null);

export function QuotationStoreProvider({ children }: { children: ReactNode }) {
  const [organizations, setOrganizations] = useState<Organization[]>(INITIAL_ORGS);
  const [users, setUsers] = useState<AppUser[]>(INITIAL_USERS);
  const [products, setProducts] = useState<ProductItem[]>(INITIAL_PRODUCTS);
  const [quotations, setQuotations] = useState<Quotation[]>(INITIAL_QUOTATIONS);
  const [auditLogs, setAuditLogs] = useState<QuotationAuditLog[]>(INITIAL_LOGS);

  const [currentUserId, setCurrentUserId] = useState<string>('user-admin');
  const [currentOrgId, setCurrentOrgId] = useState<string>('org-playch');
  const [selectedQuotationId, setSelectedQuotationId] = useState<string | null>('quot-sample-01');
  const [isSupabaseActive, setIsSupabaseActive] = useState<boolean>(false);

  const reloadFromSupabase = async () => {
    if (isSupabaseConfigured()) {
      setIsSupabaseActive(true);
      const data = await fetchAllFromSupabase();
      if (data) {
        if (data.organizations?.length) setOrganizations(data.organizations);
        if (data.users?.length) setUsers(data.users);
        if (data.products?.length) setProducts(data.products);
        if (data.quotations?.length) setQuotations(data.quotations);
        if (data.auditLogs?.length) setAuditLogs(data.auditLogs);
      }
    } else {
      setIsSupabaseActive(false);
    }
  };

  // Load from LocalStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.organizations) setOrganizations(parsed.organizations);
          if (parsed.users) setUsers(parsed.users);
          if (parsed.products) setProducts(parsed.products);
          if (parsed.quotations) setQuotations(parsed.quotations);
          if (parsed.auditLogs) setAuditLogs(parsed.auditLogs);
          if (parsed.currentUserId) setCurrentUserId(parsed.currentUserId);
          if (parsed.currentOrgId) setCurrentOrgId(parsed.currentOrgId);
        }
      } catch (e) {
        console.error('Error loading quotation store from localStorage:', e);
      }
    }
    reloadFromSupabase();
  }, []);

  // Save to LocalStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            organizations,
            users,
            products,
            quotations,
            auditLogs,
            currentUserId,
            currentOrgId,
          })
        );
      } catch (e) {
        console.error('Error saving quotation store to localStorage:', e);
      }
    }
  }, [organizations, users, products, quotations, auditLogs, currentUserId, currentOrgId]);

  const currentUser = users.find((u) => u.id === currentUserId) || users[0];
  const currentOrg = organizations.find((o) => o.id === currentOrgId) || organizations[0];
  const selectedQuotation = quotations.find((q) => q.id === selectedQuotationId) || null;

  const switchUser = (userId: string) => {
    const target = users.find((u) => u.id === userId);
    if (target) {
      setCurrentUserId(userId);
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'info',
        title: `สลับสิทธิ์การทำงานเป็น: ${target.fullName}`,
        text: `ตำแหน่ง: ${target.position} [${target.role.toUpperCase()}]`,
        showConfirmButton: false,
        timer: 2000,
        background: '#ffffff',
        color: '#0f172a',
        customClass: {
          popup: 'border border-slate-200 shadow-md rounded-xl',
        },
      });
    }
  };

  const switchOrganization = (orgId: string) => {
    const target = organizations.find((o) => o.id === orgId);
    if (target) {
      setCurrentOrgId(orgId);
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'info',
        title: `เปลี่ยนร้านค้า/ช่อง: ${target.name}`,
        showConfirmButton: false,
        timer: 1800,
        background: '#ffffff',
        color: '#0f172a',
        customClass: {
          popup: 'border border-slate-200 shadow-md rounded-xl',
        },
      });
    }
  };

  const selectQuotation = (quotation: Quotation | null) => {
    setSelectedQuotationId(quotation ? quotation.id : null);
  };

  // Add Log Entry
  const addAuditLog = (
    quotationId: string,
    action: QuotationAuditLog['action'],
    comment?: string
  ) => {
    const newLog: QuotationAuditLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      quotationId,
      userId: currentUser.id,
      userName: currentUser.fullName,
      action,
      comment,
      timestamp: new Date().toISOString(),
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  // Create Quotation
  const createQuotation = async (data: Partial<Quotation>): Promise<Quotation> => {
    const newId = `quot-${Date.now()}`;
    const dateNum = new Date();
    const thaiYear = dateNum.getFullYear() + 543;
    const quotNum = data.quotationNumber || `PLAYCH-QT-${thaiYear}-${String(quotations.length + 1).padStart(3, '0')}`;

    const newQuotation: Quotation = {
      id: newId,
      quotationNumber: quotNum,
      orgId: data.orgId || currentOrg.id,
      customerName: data.customerName || 'ลูกค้าทั่วไป',
      customerAddress: data.customerAddress || '',
      customerTaxId: data.customerTaxId || '',
      customerPhone: data.customerPhone || '',
      customerEmail: data.customerEmail || '',
      issueDate: data.issueDate || `${dateNum.getDate()} ${['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'][dateNum.getMonth()]} ${thaiYear}`,
      validUntil: data.validUntil || '',
      items: data.items || [],
      subtotal: data.subtotal || 0,
      discount: data.discount || 0,
      vatPercent: data.vatPercent !== undefined ? data.vatPercent : 7,
      vatAmount: data.vatAmount || 0,
      grandTotal: data.grandTotal || 0,
      paymentBankName: data.paymentBankName || currentOrg.bankName,
      paymentAccountName: data.paymentAccountName || currentOrg.bankAccountName,
      paymentAccountNumber: data.paymentAccountNumber || currentOrg.bankAccountNumber,
      notes: data.notes || '',
      status: 'draft',
      theme: data.theme || 'gamer',
      createdByUserId: currentUser.id,
      createdByName: currentUser.fullName,
      signatoryUserId: data.signatoryUserId,
      signatoryName: data.signatoryName || 'อดิตรา มอนด์บีนี',
      signatoryPosition: data.signatoryPosition || 'ผู้จัดการ',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setQuotations((prev) => [newQuotation, ...prev]);
    setSelectedQuotationId(newId);
    addAuditLog(newId, 'CREATED', `สร้างใบเสนอราคาใหม่ ${quotNum}`);

    // Sync to Supabase if configured
    upsertQuotationToSupabase(newQuotation);

    showSuccessAlert('สร้างใบเสนอราคาสำเร็จ!', `เลขที่เอกสาร ${quotNum} ถูกบันทึกเป็นแบบร่างแล้ว`);
    return newQuotation;
  };

  const updateQuotation = async (id: string, data: Partial<Quotation>) => {
    let updatedObj: Quotation | null = null;
    setQuotations((prev) =>
      prev.map((q) => {
        if (q.id === id) {
          const updated = {
            ...q,
            ...data,
            updatedAt: new Date().toISOString(),
          };
          updatedObj = updated;
          return updated;
        }
        return q;
      })
    );
    if (updatedObj) {
      upsertQuotationToSupabase(updatedObj);
    }
    addAuditLog(id, 'UPDATED', 'แก้ไขข้อมูลใบเสนอราคา');
    showSuccessAlert('บันทึกสำเร็จ', 'อัปเดตข้อมูลใบเสนอราคาเรียบร้อย');
  };

  const deleteQuotation = async (id: string): Promise<boolean> => {
    const target = quotations.find((q) => q.id === id);
    if (!target) return false;

    const res = await showConfirmDialog(
      'ยืนยันการลบใบเสนอราคา?',
      `คุณต้องการลบเอกสารเลขที่ ${target.quotationNumber} ใช่หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้`,
      'ลบเอกสาร'
    );

    if (res.isConfirmed) {
      setQuotations((prev) => prev.filter((q) => q.id !== id));
      if (selectedQuotationId === id) {
        setSelectedQuotationId(null);
      }
      deleteQuotationFromSupabase(id);
      showSuccessAlert('ลบสำเร็จ', `เอกสาร ${target.quotationNumber} ถูกลบออกจากระบบแล้ว`);
      return true;
    }
    return false;
  };

  // Workflow: Staff submits quotation to signatory for approval
  const submitForApproval = async (quotationId: string, signatoryUserId: string): Promise<boolean> => {
    const target = quotations.find((q) => q.id === quotationId);
    const signatory = users.find((u) => u.id === signatoryUserId);

    if (!target) return false;
    if (!signatory || !signatory.canSign) {
      showErrorAlert('ข้อผิดพลาด', 'กรุณาเลือกผู้มีสิทธิ์ลงนามที่ถูกต้อง');
      return false;
    }

    const res = await showConfirmDialog(
      'ส่งเสนอเพื่ออนุมัติ?',
      `ต้องการส่งใบเสนอราคา ${target.quotationNumber} ยอดรวม ${target.grandTotal.toLocaleString()} บาท เสนอต่อ "${signatory.fullName}" (${signatory.position}) หรือไม่?`,
      'ส่งเสนอเพื่ออนุมัติ'
    );

    if (res.isConfirmed) {
      const updated = {
        ...target,
        status: 'pending_approval' as const,
        signatoryUserId: signatory.id,
        signatoryName: signatory.fullName,
        signatoryPosition: signatory.position,
        updatedAt: new Date().toISOString(),
      };
      setQuotations((prev) =>
        prev.map((q) => (q.id === quotationId ? updated : q))
      );
      upsertQuotationToSupabase(updated);
      addAuditLog(
        quotationId,
        'SUBMITTED_FOR_APPROVAL',
        `ส่งเสนอผู้ลงนาม ${signatory.fullName} (${signatory.position})`
      );

      Swal.fire({
        icon: 'success',
        title: 'ส่งเสนออนุมัติสำเร็จ',
        html: `เอกสาร <b>${target.quotationNumber}</b> ได้ส่งเข้ากล่องรออนุมัติของ <b>${signatory.fullName}</b> เรียบร้อยแล้ว`,
        confirmButtonColor: '#2563eb',
        background: '#ffffff',
        color: '#0f172a',
        customClass: {
          popup: 'border border-slate-200 shadow-xl rounded-2xl',
        },
      });
      return true;
    }
    return false;
  };

  // Workflow: Signatory approves and applies signature
  const approveQuotation = async (quotationId: string, signatureDataUrl?: string): Promise<boolean> => {
    const target = quotations.find((q) => q.id === quotationId);
    if (!target) return false;

    if (!currentUser.canSign && currentUser.role !== 'admin') {
      showErrorAlert(
        'ไม่มีสิทธิ์ลงนาม',
        `บัญชีของคุณ (${currentUser.fullName}) ไม่ได้รับอนุญาตให้ลงนามในเอกสาร กรุณาเข้าสู่ระบบด้วยสิทธิ์ผู้ลงนามหรือผู้ดูแลระบบ`
      );
      return false;
    }

    const sigUrl = signatureDataUrl || currentUser.signatureDataUrl || DEFAULT_SIGNATURE_SVG;

    const res = await showConfirmDialog(
      'อนุมัติและลงนามเอกสาร?',
      `คุณกำลังจะอนุมัติและประทับลายมือชื่อในใบเสนอราคา ${target.quotationNumber} ในนาม "${currentUser.fullName}" (${currentUser.position})`,
      'อนุมัติและลงนาม'
    );

    if (res.isConfirmed) {
      const updated = {
        ...target,
        status: 'approved' as const,
        signatoryUserId: currentUser.id,
        signatoryName: currentUser.fullName,
        signatoryPosition: currentUser.position,
        signatureDataUrl: sigUrl,
        signedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setQuotations((prev) =>
        prev.map((q) => (q.id === quotationId ? updated : q))
      );
      upsertQuotationToSupabase(updated);
      addAuditLog(
        quotationId,
        'APPROVED',
        `อนุมัติและประทับลายมือชื่อเรียบร้อยโดย ${currentUser.fullName}`
      );

      Swal.fire({
        icon: 'success',
        title: 'อนุมัติและลงนามเรียบร้อย',
        html: `ใบเสนอราคา <b>${target.quotationNumber}</b> ได้รับการอนุมัติอย่างเป็นทางการ พร้อมส่งออกเป็น PDF และ Word แล้ว`,
        confirmButtonColor: '#2563eb',
        background: '#ffffff',
        color: '#0f172a',
        customClass: {
          popup: 'border border-slate-200 shadow-xl rounded-2xl',
        },
      });
      return true;
    }
    return false;
  };

  // Workflow: Signatory rejects quotation
  const rejectQuotation = async (quotationId: string, reason: string): Promise<boolean> => {
    const target = quotations.find((q) => q.id === quotationId);
    if (!target) return false;

    const { value: text, isConfirmed } = await Swal.fire({
      title: 'ระบุเหตุผลในการส่งกลับแก้ไข / ปฏิเสธ',
      input: 'textarea',
      inputPlaceholder: 'กรอกเหตุผลหรือสิ่งที่ต้องการให้บุคลากรแก้ไข เช่น ราคาผิด, เพิ่มส่วนลด...',
      inputValue: reason || '',
      showCancelButton: true,
      confirmButtonText: 'ส่งกลับแก้ไข',
      cancelButtonText: 'ยกเลิก',
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#64748b',
      background: '#ffffff',
      color: '#0f172a',
      customClass: {
        popup: 'border border-slate-200 shadow-xl rounded-2xl',
        input: 'border-slate-300 text-sm focus:border-rose-500',
      },
      inputValidator: (val) => {
        if (!val || !val.trim()) {
          return 'กรุณาระบุเหตุผลอย่างน้อย 5 ตัวอักษร';
        }
      },
    });

    if (isConfirmed && text) {
      const updated = {
        ...target,
        status: 'rejected' as const,
        rejectionReason: text,
        updatedAt: new Date().toISOString(),
      };
      setQuotations((prev) =>
        prev.map((q) => (q.id === quotationId ? updated : q))
      );
      upsertQuotationToSupabase(updated);
      addAuditLog(quotationId, 'REJECTED', `ส่งกลับแก้ไข: ${text}`);

      showSuccessAlert('ส่งกลับแก้ไขเรียบร้อย', 'สถานะเอกสารถูกเปลี่ยนเป็นส่งกลับแก้ไข และแจ้งบุคลากรแล้ว');
      return true;
    }
    return false;
  };

  // Products CRUD
  const createProduct = async (productData: Omit<ProductItem, 'id' | 'createdAt'>) => {
    const newProd: ProductItem = {
      ...productData,
      id: `prod-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setProducts((prev) => [newProd, ...prev]);
    showSuccessAlert('เพิ่มสินค้าสำเร็จ!', `สินค้า ${newProd.name} ถูกเพิ่มเข้าสู่ระบบแล้ว`);
  };

  const updateProduct = async (id: string, prodData: Partial<ProductItem>) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...prodData } : p))
    );
    showSuccessAlert('อัปเดตสินค้าเรียบร้อย', 'ข้อมูลสินค้าถูกบันทึกแล้ว');
  };

  const deleteProduct = async (id: string): Promise<boolean> => {
    const target = products.find((p) => p.id === id);
    if (!target) return false;

    const res = await showConfirmDialog(
      'ยืนยันการลบสินค้า?',
      `ต้องการลบสินค้า "${target.name}" (รหัส: ${target.sku}) ใช่หรือไม่?`,
      'ลบสินค้า'
    );
    if (res.isConfirmed) {
      setProducts((prev) => prev.filter((p) => p.id !== id));
      showSuccessAlert('ลบสินค้าสำเร็จ', `สินค้า ${target.name} ถูกลบออกจากระบบแล้ว`);
      return true;
    }
    return false;
  };

  // User Management
  const createUser = async (userData: Omit<AppUser, 'id' | 'createdAt'>) => {
    const newUser: AppUser = {
      ...userData,
      id: `user-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setUsers((prev) => [...prev, newUser]);
    showSuccessAlert('สร้างผู้ใช้งานสำเร็จ!', `เพิ่มบุคลากร ${newUser.fullName} ในตำแหน่ง ${newUser.position} เรียบร้อย`);
  };

  const updateUser = async (id: string, userData: Partial<AppUser>) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, ...userData } : u))
    );
    showSuccessAlert('อัปเดตผู้ใช้งานเรียบร้อย', 'ข้อมูลผู้ใช้งานและสิทธิ์ถูกปรับปรุงแล้ว');
  };

  const deleteUser = async (id: string): Promise<boolean> => {
    const target = users.find((u) => u.id === id);
    if (!target) return false;
    if (target.id === currentUser.id) {
      showErrorAlert('ไม่อนุญาต', 'ไม่สามารถลบบัญชีที่กำลังใช้งานอยู่ได้');
      return false;
    }

    const res = await showConfirmDialog(
      'ยืนยันการลบผู้ใช้งาน?',
      `ต้องการลบบุคลากร "${target.fullName}" ตำแหน่ง ${target.position} ใช่หรือไม่?`,
      'ลบผู้ใช้งาน'
    );
    if (res.isConfirmed) {
      setUsers((prev) => prev.filter((u) => u.id !== id));
      showSuccessAlert('ลบผู้ใช้งานสำเร็จ', `บุคลากร ${target.fullName} ถูกนำออกจากระบบแล้ว`);
      return true;
    }
    return false;
  };

  const updateUserSignature = async (userId: string, signatureDataUrl: string) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, signatureDataUrl, canSign: true } : u))
    );
    showSuccessAlert('บันทึกลายมือชื่อดิจิทัลสำเร็จ', 'ลายมือชื่อถูกผูกเข้ากับบัญชีผู้ลงนามเรียบร้อยแล้ว');
  };

  // Organization Management
  const createOrganization = async (orgData: Omit<Organization, 'id' | 'createdAt'>) => {
    const newOrg: Organization = {
      ...orgData,
      id: `org-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setOrganizations((prev) => [...prev, newOrg]);
    showSuccessAlert('สร้างข้อมูลองค์กร/ช่องสำเร็จ!', `เพิ่มช่อง/ร้านค้า "${newOrg.name}" เรียบร้อย`);
  };

  const updateOrganization = async (id: string, orgData: Partial<Organization>) => {
    setOrganizations((prev) =>
      prev.map((o) => (o.id === id ? { ...o, ...orgData } : o))
    );
    showSuccessAlert('อัปเดตข้อมูลองค์กรเรียบร้อย', 'ข้อมูลร้านค้าและช่องสตรีมเมอร์ถูกบันทึกแล้ว');
  };

  const deleteOrganization = async (id: string): Promise<boolean> => {
    if (organizations.length <= 1) {
      showErrorAlert('ไม่อนุญาต', 'ระบบต้องมีองค์กร/ร้านค้าหลักอย่างน้อย 1 รายการ');
      return false;
    }
    const target = organizations.find((o) => o.id === id);
    if (!target) return false;

    const res = await showConfirmDialog(
      'ยืนยันการลบองค์กร/ช่อง?',
      `ต้องการลบช่อง/ร้านค้า "${target.name}" ใช่หรือไม่?`,
      'ลบองค์กร'
    );
    if (res.isConfirmed) {
      setOrganizations((prev) => prev.filter((o) => o.id !== id));
      if (currentOrgId === id) {
        const remaining = organizations.filter((o) => o.id !== id);
        setCurrentOrgId(remaining[0].id);
      }
      showSuccessAlert('ลบองค์กรสำเร็จ', `องค์กร "${target.name}" ถูกลบแล้ว`);
      return true;
    }
    return false;
  };

  const resetToDefaults = () => {
    Swal.fire({
      title: 'รีเซ็ตข้อมูลเป็นค่าเริ่มต้น?',
      text: 'ข้อมูลใบเสนอราคา สินค้า และผู้ใช้จะถูกรีเซ็ตกลับเป็นค่าเริ่มต้นมาตรฐาน',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'รีเซ็ตข้อมูล',
      cancelButtonText: 'ยกเลิก',
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#64748b',
      background: '#ffffff',
      color: '#0f172a',
      customClass: {
        popup: 'border border-slate-200 shadow-xl rounded-2xl',
      },
    }).then((res) => {
      if (res.isConfirmed) {
        localStorage.removeItem(STORAGE_KEY);
        setOrganizations(INITIAL_ORGS);
        setUsers(INITIAL_USERS);
        setProducts(INITIAL_PRODUCTS);
        setQuotations(INITIAL_QUOTATIONS);
        setAuditLogs(INITIAL_LOGS);
        setCurrentUserId('user-admin');
        setCurrentOrgId('org-playch');
        setSelectedQuotationId('quot-sample-01');
        showSuccessAlert('รีเซ็ตสำเร็จ', 'ข้อมูลระบบถูกรีเซ็ตกลับสู่สถานะตั้งต้นเรียบร้อย');
      }
    });
  };

  return (
    <QuotationStoreContext.Provider
      value={{
        organizations,
        users,
        products,
        quotations,
        auditLogs,
        currentUser,
        currentOrg,
        selectedQuotation,
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
        reloadFromSupabase,
        resetToDefaults,
      }}
    >
      {children}
    </QuotationStoreContext.Provider>
  );
}

export function useQuotationStore() {
  const context = useContext(QuotationStoreContext);
  if (!context) {
    throw new Error('useQuotationStore must be used within a QuotationStoreProvider');
  }
  return context;
}
