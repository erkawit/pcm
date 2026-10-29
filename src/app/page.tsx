'use client';

import React, { useState } from 'react';
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
  Database,
  LogOut,
  RefreshCw,
  User as UserIcon,
  Loader2,
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
import SupabaseConfigModal from '@/components/quotation/SupabaseConfigModal';
import { LoginView } from '@/components/auth/LoginView';

type ActiveTab = 'QUOTATIONS' | 'PRODUCTS' | 'USERS' | 'ORGANIZATIONS';

function QuotationDashboardInner() {
  const {
    quotations,
    organizations,
    users,
    products,
    currentOrg,
    currentUser,
    switchOrganization,
    selectedQuotation,
    selectQuotation,
    deleteQuotation,
    submitForApproval,
    isSupabaseActive,
    isLoadingData,
    reloadFromSupabase,
    isAuthenticated,
    isAuthLoading,
    signOut,
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
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);
  const [auditQuotationId, setAuditQuotationId] = useState<string | undefined>();

  // If Auth state is still being determined
  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/20 mb-4 animate-bounce">
          <FileText className="w-8 h-8" />
        </div>
        <div className="flex items-center gap-2 text-slate-700 font-semibold text-sm">
          <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
          <span>กำลังตรวจสอบสถานะการเข้าสู่ระบบ...</span>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          PlayCH Channel & Quotation Management (PCM)
        </p>
      </div>
    );
  }

  // If user is not authenticated or pending approval -> show LoginView
  if (!isAuthenticated) {
    return <LoginView />;
  }

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

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'signatory':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      default:
        return 'bg-blue-100 text-blue-700 border-blue-200';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin':
        return 'ผู้ดูแลระบบ (Admin)';
      case 'signatory':
        return 'ผู้มีอำนาจลงนาม (Signatory)';
      default:
        return 'เจ้าหน้าที่ (Staff)';
    }
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
                src={currentOrg.logoUrl || '/logos/playch-logo.png'}
                alt="Logo"
                className="w-full h-full object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/logos/playch-logo.png';
                }}
              />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-base md:text-lg tracking-tight text-slate-900">
                  ระบบบริหารและออกใบเสนอราคา
                </h1>
                <span className="text-[11px] px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-medium border border-blue-200/60">
                  PCM Enterprise
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                {currentOrg.name} — ใบเสนอราคาและการลงนามอนุมัติดิจิทัล
              </p>
            </div>
          </div>

          {/* Quick Switchers & User Session Profile */}
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
              {currentUser.role === 'admin' && (
                <button
                  onClick={() => setIsOrgModalOpen(true)}
                  className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold ml-1 hover:underline"
                  title="จัดการองค์กร / ร้านค้า"
                >
                  จัดการ
                </button>
              )}
            </div>

            {/* Authenticated User Badge */}
            <div className="flex items-center bg-white border border-slate-200 rounded-lg px-3 py-1.5 gap-2 text-xs shadow-xs">
              <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-[11px]">
                {currentUser.fullName ? currentUser.fullName.charAt(0) : 'U'}
              </div>
              <div className="leading-tight text-left">
                <div className="font-semibold text-slate-900 truncate max-w-[130px]">
                  {currentUser.fullName}
                </div>
                <div className="text-[10px] text-slate-500 truncate max-w-[130px]">
                  {currentUser.position || currentUser.department || getRoleLabel(currentUser.role)}
                </div>
              </div>
              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getRoleBadge(
                  currentUser.role
                )}`}
              >
                {currentUser.role.toUpperCase()}
              </span>
            </div>

            {/* Supabase Status Pill */}
            <button
              onClick={() => setIsSupabaseModalOpen(true)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition shadow-xs ${
                isSupabaseActive
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-700 hover:bg-emerald-100'
                  : 'bg-amber-50 border-amber-300 text-amber-700 hover:bg-amber-100'
              }`}
              title="ตรวจสอบสถานะฐานข้อมูล Supabase"
            >
              <Database
                className={`w-3.5 h-3.5 ${isSupabaseActive ? 'text-emerald-600' : 'text-amber-600'}`}
              />
              <span className="hidden md:inline">
                {isSupabaseActive ? 'Supabase เชื่อมต่อแล้ว' : 'Supabase ออฟไลน์'}
              </span>
            </button>

            {/* Live Sync / Refresh Button */}
            <button
              onClick={() => reloadFromSupabase()}
              disabled={isLoadingData}
              className="p-2 rounded-lg bg-white hover:bg-slate-100 text-slate-600 hover:text-blue-600 transition border border-slate-200 shadow-xs disabled:opacity-50"
              title="รีเฟรชข้อมูลจากฐานข้อมูล"
            >
              <RefreshCw className={`w-4 h-4 ${isLoadingData ? 'animate-spin text-blue-600' : ''}`} />
            </button>

            {/* Sign Out Button */}
            <button
              onClick={() => signOut()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-medium text-xs transition shadow-xs"
              title="ออกจากระบบ"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>ออกจากระบบ</span>
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

            {currentUser.role === 'admin' && (
              <button
                onClick={() => setIsUserModalOpen(true)}
                className="flex items-center gap-2 px-3.5 py-2 rounded-lg font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
              >
                <Users className="w-4 h-4 text-slate-500" />
                <span>ผู้ใช้งาน & สิทธิ์ลงนาม ({users.length})</span>
              </button>
            )}

            {currentUser.role === 'admin' && (
              <button
                onClick={() => setIsOrgModalOpen(true)}
                className="flex items-center gap-2 px-3.5 py-2 rounded-lg font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
              >
                <Building2 className="w-4 h-4 text-slate-500" />
                <span>ข้อมูลองค์กร / ร้านค้า ({organizations.length})</span>
              </button>
            )}

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
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs shadow-xs transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  สร้างใบเสนอราคาใหม่
                </button>
              </div>

              {/* Search & Filters */}
              <div className="space-y-2">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="ค้นหาเลขที่เอกสาร, ชื่อลูกค้า, เบอร์โทร..."
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-900 placeholder-slate-400 transition"
                  />
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px]">
                  {[
                    { id: 'ALL', label: 'ทั้งหมด' },
                    { id: 'draft', label: 'แบบร่าง' },
                    { id: 'pending_approval', label: 'รออนุมัติ' },
                    { id: 'approved', label: 'อนุมัติแล้ว' },
                    { id: 'rejected', label: 'ส่งกลับแก้ไข' },
                  ].map((filter) => (
                    <button
                      key={filter.id}
                      onClick={() => setStatusFilter(filter.id)}
                      className={`px-2.5 py-1 rounded-md font-medium whitespace-nowrap transition ${
                        statusFilter === filter.id
                          ? 'bg-slate-800 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                      }`}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Quotations List */}
            <div className="space-y-2.5 max-h-[calc(100vh-320px)] overflow-y-auto pr-1">
              {filteredQuotations.length === 0 ? (
                <div className="p-8 text-center bg-white border border-slate-200 rounded-xl">
                  <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-700">ไม่พบเอกสารใบเสนอราคา</p>
                  <p className="text-xs text-slate-400 mt-1">
                    ยังไม่มีข้อมูลที่ตรงตามเงื่อนไข หรือยังไม่ได้สร้างเอกสาร
                  </p>
                  <button
                    onClick={handleCreateNew}
                    className="mt-3 inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 text-xs font-semibold hover:bg-blue-100 transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    สร้างเอกสารฉบับแรก
                  </button>
                </div>
              ) : (
                filteredQuotations.map((q) => {
                  const isSelected = selectedQuotation?.id === q.id;

                  const getStatusTag = (status: QuotationStatus) => {
                    switch (status) {
                      case 'approved':
                        return {
                          label: 'อนุมัติแล้ว',
                          color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                          icon: <CheckCircle className="w-3 h-3 text-emerald-600 inline mr-1" />,
                        };
                      case 'pending_approval':
                        return {
                          label: 'รออนุมัติ',
                          color: 'bg-amber-50 text-amber-700 border-amber-200',
                          icon: <Clock className="w-3 h-3 text-amber-600 inline mr-1" />,
                        };
                      case 'rejected':
                        return {
                          label: 'ส่งกลับแก้ไข',
                          color: 'bg-rose-50 text-rose-700 border-rose-200',
                          icon: <XCircle className="w-3 h-3 text-rose-600 inline mr-1" />,
                        };
                      default:
                        return {
                          label: 'แบบร่าง',
                          color: 'bg-slate-100 text-slate-600 border-slate-200',
                          icon: null,
                        };
                    }
                  };

                  const tag = getStatusTag(q.status);

                  return (
                    <div
                      key={q.id}
                      onClick={() => selectQuotation(q)}
                      className={`p-4 rounded-xl border transition cursor-pointer text-left relative ${
                        isSelected
                          ? 'bg-blue-50/50 border-blue-500 shadow-sm ring-1 ring-blue-500/20'
                          : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-xs'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold font-mono text-sm text-slate-900">
                              {q.quotationNumber}
                            </span>
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-md border font-medium ${tag.color}`}
                            >
                              {tag.icon}
                              {tag.label}
                            </span>
                          </div>
                          <h4 className="font-semibold text-xs text-slate-800 mt-1 truncate max-w-[240px]">
                            {q.customerName}
                          </h4>
                          <span className="text-[11px] text-slate-400 block mt-0.5">
                            ออกเมื่อ: {q.issueDate}
                          </span>
                        </div>

                        <div className="text-right">
                          <span className="text-sm font-bold font-mono text-slate-900 block">
                            ฿{q.grandTotal.toLocaleString()}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {q.items.length} รายการ
                          </span>
                        </div>
                      </div>

                      {/* Action buttons inside card */}
                      <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                          <span>สร้างโดย: {q.createdByName || 'พนักงาน'}</span>
                        </div>

                        <div className="flex items-center gap-1">
                          {(q.status === 'draft' || q.status === 'rejected' || currentUser.role === 'admin') && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEdit(q);
                              }}
                              className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition"
                              title="แก้ไขเอกสาร"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          )}

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewAudit(q.id);
                            }}
                            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition"
                            title="ดูประวัติการดำเนินงาน"
                          >
                            <History className="w-3.5 h-3.5" />
                          </button>

                          {(q.status === 'draft' || q.status === 'rejected' || currentUser.role === 'admin') && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteQuotation(q.id);
                              }}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition"
                              title="ลบเอกสาร"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: Live Enterprise Document Viewer & Action Toolbar */}
          <div className="lg:col-span-7">
            {selectedQuotation ? (
              <QuotationDocumentView
                quotation={selectedQuotation}
                organization={currentOrg}
                onEdit={() => handleEdit(selectedQuotation)}
                onViewAudit={() => handleViewAudit(selectedQuotation.id)}
              />
            ) : (
              <div className="p-12 text-center bg-white border border-slate-200 rounded-2xl shadow-xs">
                <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-800">
                  เลือกใบเสนอราคาเพื่อดูตัวอย่างเอกสาร
                </h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  คลิกที่รายการใบเสนอราคาด้านซ้ายเพื่อดูตัวอย่างเอกสารจริง ตรวจสอบการลงนาม หรือส่งออกเป็น Word/PDF
                </p>
                <button
                  onClick={handleCreateNew}
                  className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs shadow-xs transition"
                >
                  <Plus className="w-4 h-4" />
                  สร้างใบเสนอราคาใหม่
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

      <SupabaseConfigModal
        isOpen={isSupabaseModalOpen}
        onClose={() => setIsSupabaseModalOpen(false)}
        onConfigUpdated={() => reloadFromSupabase()}
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
