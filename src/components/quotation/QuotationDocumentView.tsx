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
} from 'lucide-react';
import { Quotation, Organization } from '@/types/quotation';
import { useQuotationStore } from '@/lib/quotation-store';
import { exportQuotationToWord } from '@/lib/word-exporter';
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

  const formatMoney = (val: number) => {
    return val.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const handlePrintPdf = () => {
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
            <span className="hidden sm:inline">ส่งออก Word (.doc)</span>
            <span className="sm:hidden">Word</span>
          </button>

          {/* Print / Export to PDF */}
          <button
            onClick={handlePrintPdf}
            title="สั่งพิมพ์หรือบันทึกเป็น PDF"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>พิมพ์ / PDF</span>
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
      {/* THE QUOTATION SHEET (CLEAN, WHITE BUSINESS DOCUMENT)     */}
      {/* ======================================================== */}
      <div
        id="quotation-print-area"
        className="w-full max-w-[850px] min-h-[1100px] p-8 md:p-12 transition-all flex flex-col justify-between shadow-sm border border-slate-200 bg-white text-slate-900 rounded-xl relative select-text print:p-0 print:shadow-none print:border-none print:w-full print:max-w-none print:rounded-none"
      >
        <div>
          {/* HEADER ROW */}
          <div className="flex flex-col sm:flex-row items-start justify-between pb-8 border-b border-slate-200 gap-4">
            {/* Organization Identity */}
            <div className="flex items-start gap-4">
              <div className="relative w-16 h-16 rounded-xl overflow-hidden flex items-center justify-center p-1 bg-white border border-slate-200 shadow-xs flex-shrink-0">
                <img
                  src={organization.logoUrl || '/logos/playch-logo.png'}
                  alt={organization.name}
                  className="w-full h-full object-contain"
                />
              </div>

              <div>
                <h2 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900">
                  {organization.name}
                </h2>
                <p className="text-xs text-slate-600 mt-0.5">
                  {organization.legalName || organization.tagline || 'ระบบบริการสื่อมีเดียและการจัดการ'}
                </p>
                <p className="text-xs text-slate-500 mt-1 max-w-sm">
                  {organization.address}
                </p>
                <div className="mt-1.5 flex items-center gap-2 text-xs font-mono text-slate-700">
                  <span className="font-semibold text-slate-500">เลขประจำตัวผู้เสียภาษี:</span>
                  <span>{organization.taxId}</span>
                </div>
              </div>
            </div>

            {/* Title Section (ใบเสนอราคา / Quotation) */}
            <div className="text-left sm:text-right flex-shrink-0">
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900">
                ใบเสนอราคา
              </h1>
              <h3 className="text-lg md:text-xl font-bold tracking-tight text-slate-500 mt-0.5">
                QUOTATION
              </h3>
              <div className="mt-2.5 inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200 text-xs font-mono">
                <span className="text-slate-500">เลขที่:</span>
                <span className="font-bold text-slate-900">{quotation.quotationNumber}</span>
              </div>
            </div>
          </div>

          {/* CUSTOMER & DATE INFO BLOCK */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 py-6 border-b border-slate-200 text-sm">
            {/* Customer Details (Left 8 Cols) */}
            <div className="md:col-span-8 bg-slate-50/70 border border-slate-200/80 rounded-xl p-4 space-y-2">
              <div className="grid grid-cols-12 items-baseline">
                <span className="col-span-3 text-xs font-semibold text-slate-500">
                  ชื่อลูกค้า
                </span>
                <span className="col-span-9 font-bold text-slate-900 text-base">
                  {quotation.customerName}
                </span>
              </div>

              <div className="grid grid-cols-12 items-baseline">
                <span className="col-span-3 text-xs font-semibold text-slate-500">
                  ที่อยู่
                </span>
                <span className="col-span-9 text-xs text-slate-700 leading-relaxed">
                  {quotation.customerAddress || '-'}
                </span>
              </div>

              <div className="grid grid-cols-12 items-baseline">
                <span className="col-span-3 text-xs font-semibold text-slate-500">
                  เลขผู้เสียภาษี
                </span>
                <span className="col-span-9 text-xs font-mono text-slate-700">
                  {quotation.customerTaxId || '-'}
                </span>
              </div>

              <div className="grid grid-cols-12 items-baseline">
                <span className="col-span-3 text-xs font-semibold text-slate-500">
                  เบอร์โทรศัพท์
                </span>
                <span className="col-span-9 text-xs text-slate-700">
                  {quotation.customerPhone || '-'}
                </span>
              </div>
            </div>

            {/* Date Details (Right 4 Cols) */}
            <div className="md:col-span-4 bg-slate-50/70 border border-slate-200/80 rounded-xl p-4 flex flex-col justify-center space-y-2">
              <div>
                <span className="text-xs font-semibold text-slate-500 block">วันที่ออกเอกสาร</span>
                <strong className="text-sm md:text-base font-bold text-slate-900">
                  {quotation.issueDate}
                </strong>
              </div>
              {quotation.validUntil && (
                <div className="pt-2 border-t border-slate-200/60">
                  <span className="text-xs font-semibold text-slate-500 block">กำหนดยืนราคา</span>
                  <span className="text-xs font-medium text-slate-800">{quotation.validUntil}</span>
                </div>
              )}
            </div>
          </div>

          {/* TABLE OF ITEMS (Columns: ลำดับ, รายการสินค้า, จำนวน, ราคา/หน่วย, ราคารวม) */}
          <div className="mt-6 mb-8 overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100/80 border-y border-slate-200 text-xs uppercase font-bold text-slate-700">
                  <th className="py-3 px-3 text-center w-12">ลำดับ</th>
                  <th className="py-3 px-4">รายการสินค้า / บริการ</th>
                  <th className="py-3 px-4 text-center w-20">จำนวน</th>
                  <th className="py-3 px-4 text-right w-32">ราคา/หน่วย</th>
                  <th className="py-3 px-4 text-right w-36">ราคารวม</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {quotation.items.map((item, idx) => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="py-3.5 px-3 text-center font-mono text-xs text-slate-500">
                      {idx + 1}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-900">
                      {item.name}
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono text-slate-700">
                      {item.quantity}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-slate-700">
                      {formatMoney(item.unitPrice)}.-
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-semibold text-slate-900">
                      {formatMoney(item.totalPrice)}.-
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* BOTTOM SUMMARY & PAYMENT CHANNEL */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pt-4 pb-8 border-t-2 border-slate-200">
            {/* Payment Channel (Left 6 Cols) */}
            <div className="md:col-span-6 bg-slate-50/80 border border-slate-200/80 rounded-xl p-4 space-y-2">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                ช่องทางการชำระเงิน
              </h4>
              <div className="space-y-1 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 w-20">ธนาคาร:</span>
                  <span className="font-semibold text-slate-800">
                    {quotation.paymentBankName || organization.bankName}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 w-20">ชื่อบัญชี:</span>
                  <span className="font-semibold text-slate-800">
                    {quotation.paymentAccountName || organization.bankAccountName}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 w-20">เลขที่บัญชี:</span>
                  <span className="font-mono font-bold text-sm text-slate-900">
                    {quotation.paymentAccountNumber || organization.bankAccountNumber}
                  </span>
                </div>
              </div>

              {quotation.notes && (
                <div className="mt-3 pt-2.5 border-t border-slate-200 text-xs">
                  <span className="font-semibold text-slate-500">หมายเหตุ: </span>
                  <span className="text-slate-700">{quotation.notes}</span>
                </div>
              )}
            </div>

            {/* Calculations & Grand Total Pill (Right 6 Cols) */}
            <div className="md:col-span-6 space-y-2.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-600">ราคารวม (Subtotal)</span>
                <span className="font-mono font-semibold text-slate-800">
                  {formatMoney(quotation.subtotal)}.-
                </span>
              </div>

              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-600">
                  ภาษีมูลค่าเพิ่ม ({quotation.vatPercent}%)
                </span>
                <span className="font-mono font-semibold text-slate-800">
                  {formatMoney(quotation.vatAmount)}.-
                </span>
              </div>

              {quotation.discount > 0 && (
                <div className="flex justify-between items-center text-xs">
                  <span className="text-rose-600">ส่วนลด</span>
                  <span className="font-mono font-semibold text-rose-600">
                    -{formatMoney(quotation.discount)}.-
                  </span>
                </div>
              )}

              {/* GRAND TOTAL CONTAINER */}
              <div className="pt-2">
                <div className="flex justify-between items-center px-5 py-2.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 font-bold">
                  <span className="text-xs md:text-sm font-semibold">จำนวนเงินรวมทั้งสิ้น</span>
                  <span className="text-lg md:text-xl font-extrabold font-mono">
                    ฿{formatMoney(quotation.grandTotal)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* SIGNATURE SECTION */}
          <div className="mt-10 mb-6 flex justify-end">
            <div className="text-center min-w-[260px] space-y-1">
              {/* Electronic Signature or Drawing */}
              <div className="h-16 flex items-center justify-center relative">
                {quotation.signatureDataUrl ? (
                  <img
                    src={quotation.signatureDataUrl}
                    alt="Authorized Signature"
                    className="max-h-16 max-w-[200px] object-contain"
                  />
                ) : (
                  <span className="text-xs italic text-slate-400">
                    (รอลงนามโดยผู้มีอำนาจ)
                  </span>
                )}
              </div>

              {/* Dotted underline */}
              <div className="border-b border-slate-300 w-full my-1.5" />

              <p className="font-bold text-sm text-slate-900">
                ({quotation.signatoryName || 'อดิตรา มอนด์บีนี'})
              </p>
              <p className="text-xs font-medium text-slate-500">
                {quotation.signatoryPosition || 'ผู้จัดการ'}
              </p>
              {quotation.signedAt && (
                <p className="text-[11px] text-emerald-700 font-medium mt-0.5 flex items-center justify-center gap-1">
                  <CheckCircle className="w-3 h-3 text-emerald-600" />
                  ลงนามดิจิทัลเมื่อ: {new Date(quotation.signedAt).toLocaleDateString('th-TH')}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* BOTTOM FOOTER BAR */}
        <div className="w-full rounded-xl p-4 mt-6 bg-slate-50 border border-slate-200 text-slate-700">
          <div className="grid grid-cols-1 md:grid-cols-12 items-center gap-4 text-xs">
            {/* Logo & Company Name */}
            <div className="md:col-span-4 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg overflow-hidden bg-white border border-slate-200 p-0.5 flex-shrink-0">
                <img
                  src={organization.logoUrl || '/logos/playch-logo.png'}
                  alt={organization.name}
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <span className="font-bold text-slate-900">
                  {organization.name}
                </span>
                <p className="text-[11px] text-slate-500">{organization.legalName || ''}</p>
              </div>
            </div>

            {/* Email & Website */}
            <div className="md:col-span-4 space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-slate-400">อีเมล:</span>
                <span className="font-medium text-slate-700">{organization.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-400">เว็บไซต์:</span>
                <span className="font-medium text-slate-700">{organization.website}</span>
              </div>
            </div>

            {/* Phone & Address */}
            <div className="md:col-span-4 space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-slate-400">โทร:</span>
                <span className="font-medium text-slate-700">{organization.phone}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-400">ที่อยู่:</span>
                <span className="font-medium text-slate-700 truncate">{organization.address}</span>
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
