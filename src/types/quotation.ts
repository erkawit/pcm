export type UserRole = 'admin' | 'staff' | 'signatory';

export type QuotationStatus = 'draft' | 'pending_approval' | 'approved' | 'rejected' | 'sent';

export type QuotationTheme = 'classic' | 'gamer';

export interface Organization {
  id: string;
  name: string;
  legalName?: string;
  tagline?: string;
  logoUrl: string;
  taxId: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  bankName: string;
  bankAccountName: string;
  bankAccountNumber: string;
  promptPayId?: string;
  themePreset?: 'gamer-cyan-ruby' | 'classic-cream' | 'dark-gold';
  isDefault?: boolean;
  createdAt: string;
}

export interface AppUser {
  id: string;
  username: string;
  fullName: string;
  email: string;
  role: UserRole;
  department: string;
  position: string;
  phone: string;
  avatarUrl?: string;
  signatureDataUrl?: string;
  canSign: boolean;
  maxApprovalAmount: number;
  isActive: boolean;
  createdAt: string;
}

export interface ProductItem {
  id: string;
  orgId?: string;
  sku: string;
  name: string;
  category: string;
  description?: string;
  unitPrice: number;
  unitLabel: string;
  isActive: boolean;
  createdAt: string;
}

export interface QuotationLineItem {
  id: string;
  order: number;
  productId?: string;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface QuotationAuditLog {
  id: string;
  quotationId: string;
  userId: string;
  userName: string;
  action: 'CREATED' | 'UPDATED' | 'SUBMITTED_FOR_APPROVAL' | 'APPROVED' | 'REJECTED' | 'SIGNED' | 'EXPORTED_PDF' | 'EXPORTED_WORD';
  comment?: string;
  timestamp: string;
}

export interface Quotation {
  id: string;
  quotationNumber: string;
  orgId: string;
  customerName: string;
  customerAddress: string;
  customerTaxId: string;
  customerPhone: string;
  customerEmail?: string;
  issueDate: string; // e.g. "31 สิงหาคม 2568"
  validUntil?: string;
  items: QuotationLineItem[];
  subtotal: number;
  discount: number;
  vatPercent: number; // default 7%
  vatAmount: number;
  grandTotal: number;
  paymentBankName: string;
  paymentAccountName: string;
  paymentAccountNumber: string;
  notes?: string;
  status: QuotationStatus;
  theme: QuotationTheme;
  createdByUserId: string;
  createdByName: string;
  signatoryUserId?: string;
  signatoryName?: string;
  signatoryPosition?: string;
  signatureDataUrl?: string;
  signedAt?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}
