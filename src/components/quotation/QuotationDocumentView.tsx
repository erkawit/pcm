'use client';

import React, { useState } from 'react';
import {
  FileDown,
  Printer,
  FileText,
  CheckCircle,
  Clock,
  XCircle,
  PenTool,
  SendHorizontal,
  Mail,
  Phone,
  Globe,
  MapPin,
  Building2,
  Calendar,
  CreditCard,
  Edit2,
  History,
  Loader2,
} from 'lucide-react';
import { Quotation, Organization } from '@/types/quotation';
import { useQuotationStore } from '@/lib/quotation-store';
import { exportQuotationToWord } from '@/lib/word-exporter';
import { exportQuotationToPdf } from '@/lib/pdf-exporter';
import SignaturePadModal from './SignaturePadModal';
import Swal from 'sweetalert2';

interface QuotationDocumentViewProps {
  quotation: Quotation;
  organization: Organization;
  onEdit?: () => void;
  onViewAudit?: () => void;
}

export default function QuotationDocumentView({
  quotation,
  organization,
  onEdit,
  onViewAudit,
}: QuotationDocumentViewProps) {
  const {
    currentUser,
    submitForApproval,
    approveQuotation,
    rejectQuotation,
    users,
  } = useQuotationStore();

  const [isSignModalOpen, setIsSignModalOpen] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const formatMoney = (val: number) => {
    return val.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // ส่งออกเป็นไฟล์ PDF โดยตรง (A4 1 หน้า ไม่ผ่าน Print Dialog ของ Browser จึงไม่มี URL / วันที่ / หัวเว็บ)
  const handleExportPdf = async () => {
    try {
      setIsExportingPdf(true);
      await exportQuotationToPdf('quotation-print-area', quotation.quotationNumber);
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: 'ดาวน์โหลด PDF สำเร็จ',
        text: `ไฟล์ PDF ขนาด A4 1 หน้า (เลขที่ ${quotation.quotationNumber}) ถูกบันทึกเรียบร้อย`,
        showConfirmButton: false,
        timer: 3000,
        background: '#ffffff',
        color: '#0f172a',
        customClass: {
          popup: 'border border-slate-200 shadow-lg rounded-xl',
        },
      });
    } catch (err: unknown) {
      console.error('PDF export error:', err);
      Swal.fire({
        icon: 'error',
        title: 'ส่งออก PDF ไม่สำเร็จ',
        text: err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการสร้างไฟล์ PDF',
        background: '#ffffff',
        color: '#0f172a',
      });
    } finally {
      setIsExportingPdf(false);
    }
  };

  // พิมพ์ออกเครื่องพิมพ์โดยตรง (ตัดหัวเว็บและฟุตเตอร์ออกอัตโนมัติด้วย CSS @page)
  const handlePrintPhysical = () => {
    window.print();
  };

  const handleExportWord = () => {
    exportQuotationToWord(quotation, organization);
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'success',
      title: 'ส่งออกไฟล์ Microsoft Word (.doc) สำเร็จ',
      text: 'คุณสามารถเปิดแก้ไขรายละเอียดใน MS Word หรือ Google Docs ได้ทันที',
      showConfirmButton: false,
      timer: 3000,
      background: '#ffffff',
      color: '#0f172a',
      customClass: {
        popup: 'border border-slate-200 shadow-lg rounded-xl',
      },
    });
  };

  const handleSignDirect = (signatureDataUrl: string) => {
    approveQuotation(quotation.id, signatureDataUrl);
  };

  const handleRejectPrompt = () => {
    Swal.fire({
      title: 'ระบุเหตุผลการส่งกลับแก้ไข',
      input: 'textarea',
      inputPlaceholder: 'กรอกเหตุผลที่ต้องการให้แก้ไขข้อมูล...',
      showCancelButton: true,
      confirmButtonText: 'ยืนยันส่งกลับ',
      cancelButtonText: 'ยกเลิก',
      confirmButtonColor: '#e11d48',
      background: '#ffffff',
      color: '#0f172a',
      customClass: {
        popup: 'border border-slate-200 shadow-xl rounded-2xl',
        input: 'border-slate-300 text-sm focus:border-rose-500',
      },
    }).then((result) => {
      if (result.isConfirmed && result.value) {
        rejectQuotation(quotation.id, result.value);
      }
    });
  };

  const statusBadge = () => {
    switch (quotation.status) {
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle className="w-3.5 h-3.5" />
            อนุมัติและลงนามแล้ว
          </span>
        );
      case 'pending_approval':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3.5 h-3.5" />
            รอผู้ลงนามอนุมัติ
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3.5 h-3.5" />
            ส่งกลับแก้ไข
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            <FileText className="w-3.5 h-3.5" />
            แบบร่าง (Draft)
          </span>
        );
    }
  };

  return (
    <div className="w-full flex flex-col items-center">
      {/* ACTION TOOLBAR (Hidden in Print) */}
      <div className="w-full max-w-[850px] mb-4 flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-white border border-slate-200 shadow-xs print:hidden">
        <div className="flex items-center gap-2.5">
          {statusBadge()}
        </div>

        {/* Action Buttons: Sign, Submit, Export PDF, Export Word, Edit */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Staff submit for approval button */}
          {quotation.status === 'draft' && (
            <button
              onClick={() => {
                const defaultSig = users.find((u) => u.canSign)?.id || '';
                submitForApproval(quotation.id, defaultSig);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-xs transition"
            >
              <SendHorizontal className="w-3.5 h-3.5" />
              ส่งเสนอผู้ลงนาม
            </button>
          )}

          {/* Signatory Approve / Reject Buttons */}
          {quotation.status === 'pending_approval' && (currentUser.canSign || currentUser.role === 'admin') && (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setIsSignModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition"
              >
                <PenTool className="w-3.5 h-3.5" />
                ลงนามและอนุมัติ
              </button>
              <button
                onClick={handleRejectPrompt}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold border border-rose-200 transition"
              >
                ส่งกลับแก้ไข
              </button>
            </div>
          )}

          {/* Export to Word (.doc) */}
          <button
            onClick={handleExportWord}
            title="ดาวน์โหลดเป็นไฟล์ Microsoft Word (.doc) เพื่อนำไปแก้ไขได้ต่อ"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-300 shadow-xs transition"
          >
            <FileDown className="w-3.5 h-3.5 text-blue-600" />
            <span className="hidden sm:inline">ส่งออก Word</span>
          </button>

          {/* Direct PDF Download (A4 1 Page) */}
          <button
            onClick={handleExportPdf}
            disabled={isExportingPdf}
            title="ดาวน์โหลดเป็นไฟล์ PDF ขนาด A4 1 หน้ากระดาษทันที โดยไม่มีข้อมูลลิงก์หรือหัวเว็บของเบราว์เซอร์"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold shadow-xs transition"
          >
            {isExportingPdf ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <FileDown className="w-3.5 h-3.5" />
            )}
            <span>{isExportingPdf ? 'กำลังสร้าง PDF...' : 'ดาวน์โหลด PDF (A4)'}</span>
          </button>

          {/* Print to paper */}
          <button
            onClick={handlePrintPhysical}
            title="พิมพ์เอกสารออกเครื่องพิมพ์โดยตรง (ตัดหัวเว็บและฟุตเตอร์ออกอัตโนมัติ)"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium border border-slate-300 shadow-xs transition"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden md:inline">พิมพ์ออกกระดาษ</span>
          </button>

          {onViewAudit && (
            <button
              onClick={onViewAudit}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium border border-slate-300 shadow-xs transition"
              title="ดูประวัติการดำเนินงาน"
            >
              <History className="w-3.5 h-3.5" />
              <span>ประวัติ</span>
            </button>
          )}

          {onEdit && (
            <button
              onClick={onEdit}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium border border-slate-300 shadow-xs transition"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>แก้ไข</span>
            </button>
          )}
        </div>
      </div>

      {/* REJECTION REASON BANNER (IF REJECTED) */}
      {quotation.status === 'rejected' && quotation.rejectionReason && (
        <div className="w-full max-w-[850px] mb-4 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <XCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>
              <strong>เหตุผลการส่งกลับแก้ไข:</strong> {quotation.rejectionReason}
            </span>
          </div>
          {onEdit && (
            <button
              onClick={onEdit}
              className="px-2.5 py-1 rounded-md bg-rose-700 text-white font-semibold hover:bg-rose-800 transition"
            >
              แก้ไขข้อมูล
            </button>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* THE QUOTATION SHEET (CLEAN, COMPACT A4 1-PAGE DOCUMENT)  */}
      {/* ======================================================== */}
      <div
        id="quotation-print-area"
        className="w-full max-w-[800px] p-6 sm:p-7 bg-white text-slate-900 border border-slate-200 shadow-sm rounded-xl flex flex-col justify-between text-xs select-text print:p-0 print:border-none print:shadow-none print:w-full print:rounded-none"
      >
        <div>
          {/* HEADER ROW */}
          <div className="flex flex-col sm:flex-row items-start justify-between pb-3 mb-3 border-b border-slate-200 gap-3">
            {/* Organization Identity */}
            <div className="flex items-start gap-3">
              <div className="relative w-12 h-12 rounded-lg overflow-hidden flex items-center justify-center p-1 bg-white border border-slate-200 shadow-xs flex-shrink-0">
                <img
                  src={organization.logoUrl || '/logos/playch-logo.png'}
                  alt={organization.name}
                  className="w-full h-full object-contain"
                />
              </div>

              <div>
                <h2 className="text-base sm:text-lg font-bold tracking-tight text-slate-900 leading-tight">
                  {organization.name}
                </h2>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {organization.legalName || organization.tagline || 'ระบบบริการสื่อมีเดียและการจัดการ'}
                </p>
                <p className="text-[11px] text-slate-600 mt-0.5 max-w-sm leading-snug">
                  {organization.address}
                </p>
                <div className="mt-1 flex items-center gap-1.5 text-[11px] font-mono text-slate-700">
                  <span className="font-semibold text-slate-500">เลขประจำตัวผู้เสียภาษี:</span>
                  <span>{organization.taxId}</span>
                </div>
              </div>
            </div>

            {/* Title Section (ใบเสนอราคา / Quotation) */}
            <div className="text-left sm:text-right flex-shrink-0">
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 leading-tight">
                ใบเสนอราคา
              </h1>
              <h3 className="text-xs font-bold tracking-wider text-slate-500 uppercase mt-0.5">
                QUOTATION
              </h3>
              <div className="mt-1.5 inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-xs font-mono">
                <span className="text-slate-500 text-[11px]">เลขที่:</span>
                <span className="font-bold text-slate-900">{quotation.quotationNumber}</span>
              </div>
            </div>
          </div>

          {/* CUSTOMER & DATE INFO BLOCK */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 mb-3 text-xs">
            {/* Customer Details (Left 8 Cols) */}
            <div className="md:col-span-8 bg-slate-50/80 border border-slate-200/80 rounded-lg p-2.5 space-y-1">
              <div className="grid grid-cols-12 items-baseline">
                <span className="col-span-3 text-[11px] font-semibold text-slate-500">
                  ชื่อลูกค้า
                </span>
                <span className="col-span-9 font-bold text-slate-900 text-sm">
                  {quotation.customerName}
                </span>
              </div>

              <div className="grid grid-cols-12 items-baseline">
                <span className="col-span-3 text-[11px] font-semibold text-slate-500">
                  ที่อยู่
                </span>
                <span className="col-span-9 text-[11px] text-slate-700 leading-snug">
                  {quotation.customerAddress || '-'}
                </span>
              </div>

              <div className="grid grid-cols-12 items-baseline">
                <span className="col-span-3 text-[11px] font-semibold text-slate-500">
                  เลขผู้เสียภาษี
                </span>
                <span className="col-span-9 text-[11px] font-mono text-slate-700">
                  {quotation.customerTaxId || '-'}
                </span>
              </div>

              <div className="grid grid-cols-12 items-baseline">
                <span className="col-span-3 text-[11px] font-semibold text-slate-500">
                  เบอร์โทรศัพท์
                </span>
                <span className="col-span-9 text-[11px] text-slate-700">
                  {quotation.customerPhone || '-'}
                </span>
              </div>
            </div>

            {/* Date Details (Right 4 Cols) */}
            <div className="md:col-span-4 bg-slate-50/80 border border-slate-200/80 rounded-lg p-2.5 flex flex-col justify-center space-y-1.5">
              <div>
                <span className="text-[10px] font-semibold text-slate-500 block uppercase">วันที่ออกเอกสาร</span>
                <strong className="text-xs sm:text-sm font-bold text-slate-900">
                  {quotation.issueDate}
                </strong>
              </div>
              {quotation.validUntil && (
                <div className="pt-1.5 border-t border-slate-200/60">
                  <span className="text-[10px] font-semibold text-slate-500 block uppercase">กำหนดยืนราคา</span>
                  <span className="text-[11px] font-medium text-slate-800">{quotation.validUntil}</span>
                </div>
              )}
            </div>
          </div>

          {/* TABLE OF ITEMS */}
          <div className="mb-3 overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100/90 border-y border-slate-200 text-[11px] uppercase font-bold text-slate-700">
                  <th className="py-2 px-2.5 text-center w-10">ลำดับ</th>
                  <th className="py-2 px-3">รายการสินค้า / บริการ</th>
                  <th className="py-2 px-3 text-center w-16">จำนวน</th>
                  <th className="py-2 px-3 text-right w-28">ราคา/หน่วย</th>
                  <th className="py-2 px-3 text-right w-32">ราคารวม</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {quotation.items.map((item, idx) => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="py-2 px-2.5 text-center font-mono text-[11px] text-slate-500">
                      {idx + 1}
                    </td>
                    <td className="py-2 px-3 font-medium text-slate-900">
                      {item.name}
                    </td>
                    <td className="py-2 px-3 text-center font-mono text-slate-700">
                      {item.quantity}
                    </td>
                    <td className="py-2 px-3 text-right font-mono text-slate-700">
                      {formatMoney(item.unitPrice)}.-
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-semibold text-slate-900">
                      {formatMoney(item.totalPrice)}.-
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* BOTTOM SUMMARY & PAYMENT CHANNEL */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 pt-3 pb-3 border-t border-slate-200">
            {/* Payment Channel (Left 6 Cols) */}
            <div className="md:col-span-6 bg-slate-50/80 border border-slate-200/80 rounded-lg p-2.5 space-y-1 text-xs">
              <h4 className="text-[11px] font-bold text-slate-900 uppercase tracking-wider">
                ช่องทางการชำระเงิน
              </h4>
              <div className="space-y-0.5 text-[11px]">
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 w-16 shrink-0">ธนาคาร:</span>
                  <span className="font-semibold text-slate-800">
                    {quotation.paymentBankName || organization.bankName}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 w-16 shrink-0">ชื่อบัญชี:</span>
                  <span className="font-semibold text-slate-800">
                    {quotation.paymentAccountName || organization.bankAccountName}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 w-16 shrink-0">เลขที่บัญชี:</span>
                  <span className="font-mono font-bold text-xs text-slate-900">
                    {quotation.paymentAccountNumber || organization.bankAccountNumber}
                  </span>
                </div>
              </div>

              {quotation.notes && (
                <div className="mt-2 pt-1.5 border-t border-slate-200 text-[10px] leading-tight">
                  <span className="font-semibold text-slate-500">หมายเหตุ: </span>
                  <span className="text-slate-700">{quotation.notes}</span>
                </div>
              )}
            </div>

            {/* Calculations & Grand Total Pill (Right 6 Cols) */}
            <div className="md:col-span-6 space-y-1 text-xs">
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-slate-600">ราคารวม (Subtotal)</span>
                <span className="font-mono font-semibold text-slate-800">
                  {formatMoney(quotation.subtotal)}.-
                </span>
              </div>

              <div className="flex justify-between items-center text-[11px]">
                <span className="text-slate-600">
                  ภาษีมูลค่าเพิ่ม ({quotation.vatPercent}%)
                </span>
                <span className="font-mono font-semibold text-slate-800">
                  {formatMoney(quotation.vatAmount)}.-
                </span>
              </div>

              {quotation.discount > 0 && (
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-rose-600">ส่วนลด</span>
                  <span className="font-mono font-semibold text-rose-600">
                    -{formatMoney(quotation.discount)}.-
                  </span>
                </div>
              )}

              {/* GRAND TOTAL CONTAINER */}
              <div className="pt-1">
                <div className="flex justify-between items-center px-3.5 py-1.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-900 font-bold">
                  <span className="text-xs font-semibold">จำนวนเงินรวมทั้งสิ้น</span>
                  <span className="text-base sm:text-lg font-extrabold font-mono">
                    ฿{formatMoney(quotation.grandTotal)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* SIGNATURE SECTION */}
          <div className="my-2.5 flex justify-end">
            <div className="text-center min-w-[220px] space-y-0.5">
              {/* Electronic Signature or Drawing */}
              <div className="h-12 flex items-center justify-center relative">
                {quotation.signatureDataUrl ? (
                  <img
                    src={quotation.signatureDataUrl}
                    alt="Authorized Signature"
                    className="max-h-12 max-w-[180px] object-contain"
                  />
                ) : (
                  <span className="text-[11px] italic text-slate-400">
                    (รอลงนามโดยผู้มีอำนาจ)
                  </span>
                )}
              </div>

              {/* Dotted underline */}
              <div className="border-b border-slate-300 w-full my-1" />

              <p className="font-bold text-xs text-slate-900">
                ({quotation.signatoryName || 'อดิตรา มอนด์บีนี'})
              </p>
              <p className="text-[11px] font-medium text-slate-500">
                {quotation.signatoryPosition || 'ผู้จัดการ'}
              </p>
              {quotation.signedAt && (
                <p className="text-[10px] text-emerald-700 font-medium mt-0.5 flex items-center justify-center gap-1">
                  <CheckCircle className="w-3 h-3 text-emerald-600" />
                  ลงนามดิจิทัลเมื่อ: {new Date(quotation.signedAt).toLocaleDateString('th-TH')}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* BOTTOM FOOTER BAR */}
        <div className="w-full rounded-lg p-2.5 mt-2 bg-slate-50 border border-slate-200 text-slate-700">
          <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-3 text-[11px]">
            {/* Logo & Company Name */}
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-md overflow-hidden bg-white border border-slate-200 p-0.5 flex-shrink-0">
                <img
                  src={organization.logoUrl || '/logos/playch-logo.png'}
                  alt={organization.name}
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="min-w-0">
                <span className="font-bold text-slate-900 block truncate text-xs">
                  {organization.name}
                </span>
                <p className="text-[10px] text-slate-500 truncate">{organization.legalName || ''}</p>
              </div>
            </div>

            {/* Email & Website */}
            <div className="space-y-0.5 min-w-0 text-[10px]">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-slate-400 shrink-0">อีเมล:</span>
                <span className="font-medium text-slate-700 truncate" title={organization.email}>
                  {organization.email}
                </span>
              </div>
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-slate-400 shrink-0">เว็บไซต์:</span>
                <a
                  href={organization.website?.startsWith('http') ? organization.website : `https://${organization.website}`}
                  target="_blank"
                  rel="noreferrer"
                  className="font-medium text-blue-600 hover:underline truncate"
                  title={organization.website}
                >
                  {organization.website}
                </a>
              </div>
            </div>

            {/* Phone & Address */}
            <div className="space-y-0.5 min-w-0 text-[10px]">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-slate-400 shrink-0">โทร:</span>
                <span className="font-medium text-slate-700 truncate" title={organization.phone}>
                  {organization.phone}
                </span>
              </div>
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-slate-400 shrink-0">ที่อยู่:</span>
                <span className="font-medium text-slate-700 truncate" title={organization.address}>
                  {organization.address}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Signature Modal */}
      <SignaturePadModal
        isOpen={isSignModalOpen}
        onClose={() => setIsSignModalOpen(false)}
        onSaveSignature={handleSignDirect}
        title={`ลงนามอนุมัติเอกสาร ${quotation.quotationNumber}`}
      />
    </div>
  );
}
