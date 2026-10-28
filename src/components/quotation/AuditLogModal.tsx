'use client';

import React from 'react';
import { X, History, CheckCircle, Clock, XCircle, FileText, SendHorizontal } from 'lucide-react';
import { QuotationAuditLog } from '@/types/quotation';
import { useQuotationStore } from '@/lib/quotation-store';

interface AuditLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  quotationId?: string;
}

export default function AuditLogModal({ isOpen, onClose, quotationId }: AuditLogModalProps) {
  const { auditLogs, quotations } = useQuotationStore();

  if (!isOpen) return null;

  const relevantLogs = quotationId
    ? auditLogs.filter((l) => l.quotationId === quotationId)
    : auditLogs;

  const currentQuot = quotationId ? quotations.find((q) => q.id === quotationId) : null;

  const getActionIcon = (action: QuotationAuditLog['action']) => {
    switch (action) {
      case 'APPROVED':
      case 'SIGNED':
        return <CheckCircle className="w-4 h-4 text-emerald-600" />;
      case 'SUBMITTED_FOR_APPROVAL':
        return <SendHorizontal className="w-4 h-4 text-amber-600" />;
      case 'REJECTED':
        return <XCircle className="w-4 h-4 text-rose-600" />;
      default:
        return <FileText className="w-4 h-4 text-blue-600" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-slate-900/50 backdrop-blur-xs overflow-y-auto animate-in fade-in">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl shadow-xl flex flex-col max-h-[85vh] overflow-hidden my-auto text-slate-800">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600 border border-blue-200">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base md:text-lg font-bold text-slate-900">
                บันทึกประวัติการทำงาน (Audit Trail)
              </h2>
              <p className="text-xs text-slate-500">
                {currentQuot
                  ? `ประวัติเอกสาร ${currentQuot.quotationNumber} (${currentQuot.customerName})`
                  : 'ประวัติการดำเนินการทั้งหมดในระบบใบเสนอราคา'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-2 rounded-lg hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-4 text-sm flex-1">
          {relevantLogs.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              ยังไม่มีประวัติการทำรายการ
            </div>
          ) : (
            <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              {relevantLogs.map((log) => (
                <div key={log.id} className="relative group">
                  {/* Dot */}
                  <div className="absolute -left-6 top-1 p-0.5 rounded-full bg-white border border-slate-200">
                    {getActionIcon(log.action)}
                  </div>

                  <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-3.5 space-y-1 hover:border-slate-300 transition">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-900 text-xs">
                        {log.userName}
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {new Date(log.timestamp).toLocaleString('th-TH')}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600">{log.comment || log.action}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-medium text-xs shadow-xs"
          >
            ปิด
          </button>
        </div>
      </div>
    </div>
  );
}
