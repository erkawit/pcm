'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  FileText,
  Package,
  Users,
  Building2,
  Plus,
  Search,
  Filter,
  CheckCircle,
  Clock,
  XCircle,
  Eye,
  Edit2,
  Trash2,
  SendHorizontal,
  PenTool,
  FileDown,
  Printer,
  History,
  RotateCcw,
  Shield,
  Layers,
  ChevronRight,
  TrendingUp,
  CreditCard,
} from 'lucide-react';
import {
  useQuotationStore,
  QuotationStoreProvider,
} from '@/lib/quotation-store';
import { Quotation, QuotationStatus } from '@/types/quotation';
import QuotationDocumentView from '@/components/quotation/QuotationDocumentView';
import QuotationEditorModal from '@/components/quotation/QuotationEditorModal';
import ProductManagementModal from '@/components/quotation/ProductManagementModal';
import UserManagementModal from '@/components/quotation/UserManagementModal';
import OrganizationManagementModal from '@/components/quotation/OrganizationManagementModal';
import AuditLogModal from '@/components/quotation/AuditLogModal';

type ActiveTab = 'QUOTATIONS' | 'PRODUCTS' | 'USERS' | 'ORGANIZATIONS';

function QuotationDashboardInner() {
  const {
    quotations,
    organizations,
    users,
    products,
    currentOrg,
    currentUser,
    switchUser,
    switchOrganization,
    selectedQuotation,
    selectQuotation,
    deleteQuotation,
    submitForApproval,
    resetToDefaults,
  } = useQuotationStore();

  const [activeTab, setActiveTab] = useState<ActiveTab>('QUOTATIONS');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Modals
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [quotationToEdit, setQuotationToEdit] = useState<Quotation | null>(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isOrgModalOpen, setIsOrgModalOpen] = useState(false);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [auditQuotationId, setAuditQuotationId] = useState<string | undefined>();

  // Filtered Quotations
  const filteredQuotations = quotations.filter((q) => {
    const matchesOrg = q.orgId === currentOrg.id || currentOrg.isDefault;
    const matchesStatus = statusFilter === 'ALL' || q.status === statusFilter;
    const matchesSearch =
      q.quotationNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (q.customerPhone && q.customerPhone.includes(searchTerm));
    return matchesStatus && matchesSearch;
  });

  // Calculate Metrics
  const totalAmount = quotations.reduce((acc, q) => acc + q.grandTotal, 0);
  const pendingCount = quotations.filter((q) => q.status === 'pending_approval').length;
  const approvedCount = quotations.filter((q) => q.status === 'approved').length;

  const handleCreateNew = () => {
    setQuotationToEdit(null);
    setIsEditorOpen(true);
  };

  const handleEdit = (q: Quotation) => {
    setQuotationToEdit(q);
    setIsEditorOpen(true);
  };

  const handleViewAudit = (qId?: string) => {
    setAuditQuotationId(qId);
    setIsAuditModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* ======================================================== */}
      {/* TOP CLEAN ENTERPRISE NAVIGATION BAR                      */}
      {/* ======================================================== */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200/90 shadow-xs px-4 lg:px-8 py-3.5 print:hidden">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          {/* Brand & System Title */}
          <div className="flex items-center gap-3.5">
            <div className="relative w-10 h-10 rounded-xl overflow-hidden p-1 bg-white border border-slate-200 shadow-xs flex items-center justify-center">
              <img
                src="/logos/playch-logo.png"
                alt="PlayCH Logo"
                className="w-full h-full object-contain"
              />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-base md:text-lg tracking-tight text-slate-900">
                  ระบบบริหารและออกใบเสนอราคา
                </h1>
                <span className="text-[11px] px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-700 font-medium border border-blue-200/60">
                  PCM System
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                Quotation & Document Management System with Digital Signature Workflow
              </p>
            </div>
          </div>

          {/* Quick Switchers: Organization & Persona/Role Switcher */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Organization Selector */}
            <div className="flex items-center bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 gap-2 text-xs">
              <Building2 className="w-4 h-4 text-slate-500" />
              <select
                value={currentOrg.id}
                onChange={(e) => switchOrganization(e.target.value)}
                className="bg-transparent text-xs text-slate-800 font-medium focus:outline-none cursor-pointer max-w-[155px] truncate"
              >
                {organizations.map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.name}
                  </option>
                ))}
              </select>
              <button
                onClick={() => setIsOrgModalOpen(true)}
                className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold ml-1 hover:underline"
                title="จัดการองค์กร / ร้านค้า"
              >
                จัดการ
              </button>
            </div>

            {/* Persona Switcher (Allows testing Admin, Signatory, Staff instantly) */}
            <div className="flex items-center bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 gap-2 text-xs">
              <Shield className="w-4 h-4 text-blue-600" />
              <div className="text-xs flex items-center gap-1.5">
                <span className="text-slate-500 hidden md:inline">ผู้ใช้งาน:</span>
                <select
                  value={currentUser.id}
                  onChange={(e) => switchUser(e.target.value)}
                  className="bg-transparent text-xs text-slate-800 font-medium focus:outline-none cursor-pointer"
                >
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.fullName} [{u.role.toUpperCase()}]
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={() => setIsUserModalOpen(true)}
                className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold ml-1 hover:underline"
                title="จัดการสิทธิ์ผู้ใช้งาน"
              >
                ตั้งค่า
              </button>
            </div>

            {/* Reset Data Button */}
            <button
              onClick={resetToDefaults}
              className="p-2 rounded-lg bg-white hover:bg-slate-100 text-slate-600 hover:text-amber-600 transition border border-slate-200 shadow-xs"
              title="รีเซ็ตข้อมูลตัวอย่างกลับเป็นค่าเริ่มต้น"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="max-w-7xl mx-auto mt-3.5 flex items-center justify-between border-t border-slate-200 pt-2.5">
          <nav className="flex items-center gap-1.5 overflow-x-auto text-xs">
            <button
              onClick={() => setActiveTab('QUOTATIONS')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg font-medium transition ${
                activeTab === 'QUOTATIONS'
                  ? 'bg-blue-600 text-white font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>ใบเสนอราคา ({quotations.length})</span>
            </button>

            <button
              onClick={() => setIsProductModalOpen(true)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
            >
              <Package className="w-4 h-4 text-slate-500" />
              <span>สินค้า & บริการ ({products.length})</span>
            </button>

            <button
              onClick={() => setIsUserModalOpen(true)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
            >
              <Users className="w-4 h-4 text-slate-500" />
              <span>ผู้ใช้งาน & สิทธิ์ลงนาม ({users.length})</span>
            </button>

            <button
              onClick={() => setIsOrgModalOpen(true)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
            >
              <Building2 className="w-4 h-4 text-slate-500" />
              <span>ข้อมูลองค์กร / ร้านค้า ({organizations.length})</span>
            </button>

            <button
              onClick={() => handleViewAudit()}
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
            >
              <History className="w-4 h-4 text-slate-500" />
              <span>ประวัติการดำเนินงาน</span>
            </button>
          </nav>
        </div>
      </header>

      {/* ======================================================== */}
      {/* MAIN WORKSPACE: QUOTATION SYSTEM                         */}
      {/* ======================================================== */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-8 space-y-6">
        {/* KPI Summary Cards Bar */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 print:hidden">
          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs font-medium text-slate-500 block">ใบเสนอราคาทั้งหมด</span>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl font-bold font-mono text-slate-900">
                  {quotations.length}
                </span>
                <span className="text-xs text-slate-500">เอกสาร</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs font-medium text-amber-700 block">รอผู้ลงนามอนุมัติ</span>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl font-bold font-mono text-amber-600">
                  {pendingCount}
                </span>
                <span className="text-xs text-amber-600/80">รอดำเนินการ</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs font-medium text-emerald-700 block">อนุมัติและลงนามแล้ว</span>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl font-bold font-mono text-emerald-600">
                  {approvedCount}
                </span>
                <span className="text-xs text-emerald-600/80">สมบูรณ์</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle className="w-5 h-5" />
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs font-medium text-slate-500 block">ยอดรวมการเสนอราคา</span>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-xl md:text-2xl font-bold font-mono text-slate-900">
                  ฿{totalAmount.toLocaleString()}
                </span>
                <span className="text-xs text-slate-500">บาท</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
              <CreditCard className="w-5 h-5" />
            </div>
          </div>
        </section>

        {/* WORKSPACE LAYOUT: Left = List & Management, Right = Live Document View */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT COLUMN: Quotations List & Filter Bar (Print hidden) */}
          <div className="lg:col-span-5 space-y-4 print:hidden">
            {/* Action Bar */}
            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-3.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-600" />
                  <h3 className="font-bold text-sm text-slate-900">
                    รายการใบเสนอราคา
                  </h3>
                </div>
                <button
                  onClick={handleCreateNew}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>สร้างใบเสนอราคา</span>
                </button>
              </div>

              {/* Search & Filters */}
              <div className="space-y-2.5">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="ค้นหาเลขที่เอกสาร, ชื่อลูกค้า, เบอร์โทร..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition"
                  />
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto text-[11px] pb-1">
                  {[
                    { id: 'ALL', label: 'ทั้งหมด' },
                    { id: 'draft', label: 'แบบร่าง' },
                    { id: 'pending_approval', label: 'รออนุมัติ' },
                    { id: 'approved', label: 'อนุมัติแล้ว' },
                    { id: 'rejected', label: 'ส่งกลับ' },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setStatusFilter(tab.id)}
                      className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap font-medium ${
                        statusFilter === tab.id
                          ? 'bg-slate-900 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Quotations List Cards */}
            <div className="space-y-2.5 max-h-[780px] overflow-y-auto pr-1">
              {filteredQuotations.length === 0 ? (
                <div className="p-8 text-center bg-white border border-dashed border-slate-200 rounded-xl text-xs text-slate-500">
                  ไม่พบใบเสนอราคาในเงื่อนไขที่เลือก
                </div>
              ) : (
                filteredQuotations.map((q) => {
                  const isSelected = selectedQuotation?.id === q.id;
                  return (
                    <div
                      key={q.id}
                      onClick={() => selectQuotation(q)}
                      className={`p-4 rounded-xl border transition-all cursor-pointer relative group ${
                        isSelected
                          ? 'bg-blue-50/60 border-blue-500 shadow-sm ring-1 ring-blue-500/30'
                          : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-xs'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-blue-700">
                              {q.quotationNumber}
                            </span>
                            {/* Status tag */}
                            {q.status === 'approved' && (
                              <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
                                อนุมัติแล้ว
                              </span>
                            )}
                            {q.status === 'pending_approval' && (
                              <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 font-semibold border border-amber-200">
                                รอลงนาม
                              </span>
                            )}
                            {q.status === 'rejected' && (
                              <span className="text-[10px] px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 font-semibold border border-rose-200">
                                ส่งกลับแก้ไข
                              </span>
                            )}
                            {q.status === 'draft' && (
                              <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-semibold border border-slate-200">
                                แบบร่าง
                              </span>
                            )}
                          </div>
                          <h4 className="font-semibold text-slate-900 text-sm mt-1.5">
                            {q.customerName}
                          </h4>
                          <p className="text-xs text-slate-500 mt-0.5">
                            ออกวันที่: {q.issueDate} • {q.items?.length || 0} รายการ
                          </p>
                        </div>

                        <div className="text-right">
                          <span className="text-[11px] text-slate-400 block">ยอดรวมทั้งสิ้น</span>
                          <span className="font-mono font-bold text-sm text-slate-900">
                            ฿{q.grandTotal.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>

                      {/* Card Action footer */}
                      <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                        <span className="text-[11px] text-slate-500">
                          ผู้ลงนาม: {q.signatoryName || '-'}
                        </span>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEdit(q);
                            }}
                            className="p-1.5 rounded-md text-slate-500 hover:text-blue-600 hover:bg-slate-100 transition"
                            title="แก้ไข"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewAudit(q.id);
                            }}
                            className="p-1.5 rounded-md text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition"
                            title="ดูประวัติ"
                          >
                            <History className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteQuotation(q.id);
                            }}
                            className="p-1.5 rounded-md text-slate-500 hover:text-rose-600 hover:bg-slate-100 transition"
                            title="ลบเอกสาร"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: Clean Document View */}
          <div className="lg:col-span-7 flex justify-center">
            {selectedQuotation ? (
              <QuotationDocumentView
                quotation={selectedQuotation}
                organization={
                  organizations.find((o) => o.id === selectedQuotation.orgId) || currentOrg
                }
                onEdit={() => handleEdit(selectedQuotation)}
              />
            ) : (
              <div className="w-full min-h-[500px] flex flex-col items-center justify-center p-8 text-center rounded-2xl bg-white border border-slate-200 text-slate-500 shadow-xs">
                <FileText className="w-12 h-12 text-slate-300 mb-3" />
                <h3 className="text-slate-800 font-semibold text-base">เลือกใบเสนอราคาเพื่อดูตัวอย่าง</h3>
                <p className="text-xs text-slate-500 max-w-sm mt-1">
                  คลิกที่รายการใบเสนอราคาทางด้านซ้ายเพื่อดูตัวอย่างเอกสาร ลงนามอนุมัติ หรือส่งออกไฟล์ Word & PDF
                </p>
                <button
                  onClick={handleCreateNew}
                  className="mt-4 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs"
                >
                  + สร้างใบเสนอราคาใหม่
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* ======================================================== */}
      {/* SYSTEM MODALS                                            */}
      {/* ======================================================== */}
      <QuotationEditorModal
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        quotationToEdit={quotationToEdit}
      />

      <ProductManagementModal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
      />

      <UserManagementModal
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
      />

      <OrganizationManagementModal
        isOpen={isOrgModalOpen}
        onClose={() => setIsOrgModalOpen(false)}
      />

      <AuditLogModal
        isOpen={isAuditModalOpen}
        onClose={() => setIsAuditModalOpen(false)}
        quotationId={auditQuotationId}
      />
    </div>
  );
}

export default function QuotationDashboardPage() {
  return (
    <QuotationStoreProvider>
      <QuotationDashboardInner />
    </QuotationStoreProvider>
  );
}
