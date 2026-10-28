'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Trash2,
  Package,
  Building2,
  Calendar,
  Save,
  SendHorizontal,
  DollarSign,
  UserCheck,
} from 'lucide-react';
import { Quotation, QuotationLineItem } from '@/types/quotation';
import { useQuotationStore } from '@/lib/quotation-store';
import Swal from 'sweetalert2';

interface QuotationEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  quotationToEdit?: Quotation | null;
}

export default function QuotationEditorModal({
  isOpen,
  onClose,
  quotationToEdit,
}: QuotationEditorModalProps) {
  const {
    organizations,
    users,
    products,
    createQuotation,
    updateQuotation,
    currentOrg,
    currentUser,
    submitForApproval,
  } = useQuotationStore();

  const [orgId, setOrgId] = useState<string>(currentOrg.id);
  const [quotationNumber, setQuotationNumber] = useState<string>('');
  const [customerName, setCustomerName] = useState<string>('');
  const [customerAddress, setCustomerAddress] = useState<string>('');
  const [customerTaxId, setCustomerTaxId] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [customerEmail, setCustomerEmail] = useState<string>('');
  const [issueDate, setIssueDate] = useState<string>('');
  const [validUntil, setValidUntil] = useState<string>('');
  const [items, setItems] = useState<QuotationLineItem[]>([]);
  const [discount, setDiscount] = useState<number>(0);
  const [enableVat, setEnableVat] = useState<boolean>(true);
  const [notes, setNotes] = useState<string>('');
  const [signatoryUserId, setSignatoryUserId] = useState<string>('');
  const [selectedProductId, setSelectedProductId] = useState<string>('');

  // Bank details
  const [paymentBankName, setPaymentBankName] = useState<string>('');
  const [paymentAccountName, setPaymentAccountName] = useState<string>('');
  const [paymentAccountNumber, setPaymentAccountNumber] = useState<string>('');

  const signatories = users.filter((u) => u.canSign && u.isActive);

  // Initialize form state
  useEffect(() => {
    if (quotationToEdit) {
      setOrgId(quotationToEdit.orgId);
      setQuotationNumber(quotationToEdit.quotationNumber);
      setCustomerName(quotationToEdit.customerName);
      setCustomerAddress(quotationToEdit.customerAddress);
      setCustomerTaxId(quotationToEdit.customerTaxId);
      setCustomerPhone(quotationToEdit.customerPhone);
      setCustomerEmail(quotationToEdit.customerEmail || '');
      setIssueDate(quotationToEdit.issueDate);
      setValidUntil(quotationToEdit.validUntil || '');
      setItems(quotationToEdit.items || []);
      setDiscount(quotationToEdit.discount || 0);
      setEnableVat(quotationToEdit.vatPercent > 0);
      setNotes(quotationToEdit.notes || '');
      setSignatoryUserId(quotationToEdit.signatoryUserId || (signatories[0]?.id ?? ''));
      setPaymentBankName(quotationToEdit.paymentBankName);
      setPaymentAccountName(quotationToEdit.paymentAccountName);
      setPaymentAccountNumber(quotationToEdit.paymentAccountNumber);
    } else {
      const now = new Date();
      const thaiYear = now.getFullYear() + 543;
      const thaiMonths = [
        'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
        'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
      ];
      const thaiDateStr = `${now.getDate()} ${thaiMonths[now.getMonth()]} ${thaiYear}`;

      setOrgId(currentOrg.id);
      setQuotationNumber(`QT-${thaiYear}-${String(Math.floor(Math.random() * 900) + 100)}`);
      setCustomerName('');
      setCustomerAddress('');
      setCustomerTaxId('');
      setCustomerPhone('');
      setCustomerEmail('');
      setIssueDate(thaiDateStr);
      setValidUntil('30 วันนับจากวันที่ออกเอกสาร');
      setItems([
        {
          id: 'item-1',
          order: 1,
          name: 'แพ็กเกจผลิตสื่อประชาสัมพันธ์ และโปรโมท',
          quantity: 1,
          unitPrice: 5000,
          totalPrice: 5000,
        },
      ]);
      setDiscount(0);
      setEnableVat(true);
      setNotes('ราคาดังกล่าวรวมภาษีมูลค่าเพิ่มแล้ว เงื่อนไขการชำระเงินโอนเข้าบัญชีภายใน 7 วัน');
      setSignatoryUserId(signatories[0]?.id ?? '');
      setPaymentBankName(currentOrg.bankName);
      setPaymentAccountName(currentOrg.bankAccountName);
      setPaymentAccountNumber(currentOrg.bankAccountNumber);
    }
  }, [quotationToEdit, isOpen, currentOrg]);

  // When changing organization, update bank details default
  const handleOrgChange = (newOrgId: string) => {
    setOrgId(newOrgId);
    const org = organizations.find((o) => o.id === newOrgId);
    if (org) {
      setPaymentBankName(org.bankName);
      setPaymentAccountName(org.bankAccountName);
      setPaymentAccountNumber(org.bankAccountNumber);
    }
  };

  // Calculations
  const subtotal = items.reduce((acc, item) => acc + item.totalPrice, 0);
  const discountedSubtotal = Math.max(0, subtotal - discount);
  const vatPercent = enableVat ? 7 : 0;
  const vatAmount = enableVat ? Math.round(discountedSubtotal * 0.07 * 100) / 100 : 0;
  const grandTotal = discountedSubtotal + vatAmount;

  // Add Item from product catalog
  const addItemFromCatalog = () => {
    if (!selectedProductId) return;
    const prod = products.find((p) => p.id === selectedProductId);
    if (!prod) return;

    const newItem: QuotationLineItem = {
      id: `item-${Date.now()}`,
      order: items.length + 1,
      productId: prod.id,
      name: prod.name,
      quantity: 1,
      unitPrice: prod.unitPrice,
      totalPrice: prod.unitPrice,
    };
    setItems((prev) => [...prev, newItem]);
    setSelectedProductId('');
  };

  // Add Custom blank line item
  const addCustomItem = () => {
    const newItem: QuotationLineItem = {
      id: `item-${Date.now()}`,
      order: items.length + 1,
      name: 'รายการบริการใหม่',
      quantity: 1,
      unitPrice: 1000,
      totalPrice: 1000,
    };
    setItems((prev) => [...prev, newItem]);
  };

  // Update item field
  const updateItem = (
    id: string,
    field: 'name' | 'quantity' | 'unitPrice',
    val: string | number
  ) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const updated = { ...item, [field]: val };
        if (field === 'quantity' || field === 'unitPrice') {
          const qty = Number(field === 'quantity' ? val : item.quantity) || 0;
          const price = Number(field === 'unitPrice' ? val : item.unitPrice) || 0;
          updated.totalPrice = Math.round(qty * price * 100) / 100;
        }
        return updated;
      })
    );
  };

  // Delete line item
  const removeItem = (id: string) => {
    if (items.length <= 1) {
      Swal.fire({
        toast: true,
        icon: 'warning',
        title: 'ต้องมีรายการสินค้าอย่างน้อย 1 รายการ',
        position: 'top-end',
        timer: 1800,
        showConfirmButton: false,
        background: '#ffffff',
        color: '#0f172a',
      });
      return;
    }
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleSave = async (submitNow: boolean = false) => {
    if (!customerName.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'กรุณากรอกชื่อลูกค้า',
        text: 'ชื่อลูกค้าหรือชื่อบริษัทผู้ว่าจ้างจำเป็นต้องระบุ',
        background: '#ffffff',
        color: '#0f172a',
        confirmButtonColor: '#2563eb',
      });
      return;
    }

    const selectedSignatory = users.find((u) => u.id === signatoryUserId) || signatories[0];

    const payload: Partial<Quotation> = {
      orgId,
      quotationNumber,
      customerName,
      customerAddress,
      customerTaxId,
      customerPhone,
      customerEmail,
      issueDate,
      validUntil,
      items,
      subtotal,
      discount,
      vatPercent,
      vatAmount,
      grandTotal,
      paymentBankName,
      paymentAccountName,
      paymentAccountNumber,
      notes,
      signatoryUserId: selectedSignatory?.id,
      signatoryName: selectedSignatory?.fullName,
      signatoryPosition: selectedSignatory?.position,
    };

    if (quotationToEdit) {
      await updateQuotation(quotationToEdit.id, payload);
      if (submitNow && selectedSignatory) {
        await submitForApproval(quotationToEdit.id, selectedSignatory.id);
      }
    } else {
      const created = await createQuotation(payload);
      if (submitNow && selectedSignatory) {
        await submitForApproval(created.id, selectedSignatory.id);
      }
    }

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-slate-900/50 backdrop-blur-xs overflow-y-auto animate-in fade-in">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-4xl shadow-xl flex flex-col max-h-[92vh] overflow-hidden my-auto text-slate-800">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600 border border-blue-200">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base md:text-lg font-bold text-slate-900 flex items-center gap-2">
                {quotationToEdit ? 'แก้ไขใบเสนอราคา' : 'สร้างใบเสนอราคาใหม่ (Quotation)'}
                <span className="text-xs px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-700 font-mono border border-blue-200">
                  {quotationNumber}
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                กรอกข้อมูลลูกค้า รายการสินค้า และกำหนดผู้ลงนามอนุมัติเอกสาร
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

        {/* Modal Scrollable Form Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-sm">
          {/* Section 1: Organization & Basic Meta */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-xl bg-slate-50/70 border border-slate-200">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-blue-600" />
                ออกในนามองค์กร / ร้านค้า
              </label>
              <select
                value={orgId}
                onChange={(e) => handleOrgChange(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 text-xs focus:outline-none focus:border-blue-500"
              >
                {organizations.map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.name} {org.isDefault ? '(หลัก)' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-blue-600" />
                วันที่ออกเอกสาร
              </label>
              <input
                type="text"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                placeholder="เช่น 31 สิงหาคม 2568"
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 text-xs focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                กำหนดยืนราคา (Valid Until)
              </label>
              <input
                type="text"
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
                placeholder="เช่น 30 วันนับจากวันที่ออกเอกสาร"
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 text-xs focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Section 2: Customer Information */}
          <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200 space-y-4">
            <h3 className="font-semibold text-slate-900 text-xs uppercase tracking-wider">
              ข้อมูลลูกค้า / ผู้รับใบเสนอราคา
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  ชื่อลูกค้า / บริษัท <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="เช่น บริษัท สตรีมมีเดีย จำกัด หรือ คุณสมชาย ใจดี"
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 text-xs focus:outline-none focus:border-blue-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">เบอร์โทรศัพท์</label>
                <input
                  type="text"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="เช่น 081-234-5678"
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">เลขประจำตัวผู้เสียภาษี</label>
                <input
                  type="text"
                  value={customerTaxId}
                  onChange={(e) => setCustomerTaxId(e.target.value)}
                  placeholder="เช่น 0105561234567"
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 text-xs focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">อีเมลติดต่อ</label>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="contact@customer.com"
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-slate-600 mb-1">ที่อยู่ลูกค้า</label>
                <input
                  type="text"
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  placeholder="เช่น 123/45 ถนนสุขุมวิท แขวงคลองเตย เขตคลองเตย กรุงเทพมหานคร 10110"
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 text-xs focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Line Items */}
          <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-semibold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5 text-blue-600" />
                รายการสินค้า / การบริการ ({items.length} รายการ)
              </h3>

              <div className="flex items-center gap-2">
                {/* Quick Add from Catalog */}
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 max-w-[220px]"
                >
                  <option value="">-- เลือกจากคลังสินค้า --</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.unitPrice.toLocaleString()} บ.)
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={addItemFromCatalog}
                  disabled={!selectedProductId}
                  className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-xs font-semibold flex items-center gap-1 transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  เพิ่มจากคลัง
                </button>
                <button
                  type="button"
                  onClick={addCustomItem}
                  className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center gap-1 transition border border-slate-300 shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  เพิ่มรายการเอง
                </button>
              </div>
            </div>

            {/* Items Table */}
            <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
              <table className="w-full text-left">
                <thead className="bg-slate-100 text-xs text-slate-700 uppercase font-bold border-b border-slate-200">
                  <tr>
                    <th className="px-3 py-2.5 w-12 text-center">ลำดับ</th>
                    <th className="px-3 py-2.5">รายการสินค้า / บริการ</th>
                    <th className="px-3 py-2.5 w-24 text-center">จำนวน</th>
                    <th className="px-3 py-2.5 w-32 text-right">ราคา/หน่วย</th>
                    <th className="px-3 py-2.5 w-32 text-right">ราคารวม</th>
                    <th className="px-2 py-2.5 w-10 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {items.map((item, idx) => (
                    <tr key={item.id} className="hover:bg-slate-50/60 transition">
                      <td className="px-3 py-2 text-center font-mono text-xs text-slate-400">{idx + 1}</td>
                      <td className="px-3 py-2">
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) => updateItem(item.id, 'name', e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1 text-slate-900 text-xs focus:bg-white focus:outline-none focus:border-blue-500"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateItem(item.id, 'quantity', e.target.value)}
                          className="w-full text-center bg-slate-50 border border-slate-200 rounded-md px-2 py-1 text-slate-900 text-xs focus:bg-white focus:outline-none focus:border-blue-500 font-mono"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          step="0.01"
                          value={item.unitPrice}
                          onChange={(e) => updateItem(item.id, 'unitPrice', e.target.value)}
                          className="w-full text-right bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1 text-slate-900 text-xs focus:bg-white focus:outline-none focus:border-blue-500 font-mono"
                        />
                      </td>
                      <td className="px-3 py-2 text-right font-mono font-semibold text-slate-900 text-xs">
                        {item.totalPrice.toLocaleString('th-TH', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                        .-
                      </td>
                      <td className="px-2 py-2 text-center">
                        <button
                          type="button"
                          onClick={() => removeItem(item.id)}
                          className="text-slate-400 hover:text-rose-600 p-1 rounded-md transition"
                          title="ลบรายการ"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Calculations & Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    ช่องทางชำระเงิน (ธนาคาร & เลขบัญชี)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={paymentBankName}
                      onChange={(e) => setPaymentBankName(e.target.value)}
                      placeholder="ธนาคาร"
                      className="bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900"
                    />
                    <input
                      type="text"
                      value={paymentAccountNumber}
                      onChange={(e) => setPaymentAccountNumber(e.target.value)}
                      placeholder="เลขที่บัญชี"
                      className="bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900 font-mono"
                    />
                  </div>
                  <input
                    type="text"
                    value={paymentAccountName}
                    onChange={(e) => setPaymentAccountName(e.target.value)}
                    placeholder="ชื่อบัญชี"
                    className="w-full mt-1.5 bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">หมายเหตุเพิ่มเติม</label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="ข้อความระบุเงื่อนไขการส่งมอบ หรือ การชำระเงิน..."
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2.5">
                <div className="flex justify-between items-center text-xs text-slate-700">
                  <span>ราคารวม (Subtotal):</span>
                  <span className="font-mono font-medium">
                    {subtotal.toLocaleString('th-TH', { minimumFractionDigits: 2 })}.-
                  </span>
                </div>

                <div className="flex justify-between items-center gap-2 text-xs">
                  <span className="text-slate-700">ส่วนลด (Discount):</span>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="0"
                      value={discount}
                      onChange={(e) => setDiscount(Number(e.target.value))}
                      className="w-28 text-right bg-slate-50 border border-slate-300 rounded-md px-2 py-1 text-xs text-rose-600 font-mono"
                    />
                    <span className="text-slate-500">.-</span>
                  </div>
                </div>

                <div className="flex justify-between items-center text-xs">
                  <label className="flex items-center gap-2 text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={enableVat}
                      onChange={(e) => setEnableVat(e.target.checked)}
                      className="rounded accent-blue-600"
                    />
                    <span>ภาษีมูลค่าเพิ่ม 7% (VAT):</span>
                  </label>
                  <span className="font-mono font-medium text-slate-700">
                    {vatAmount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}.-
                  </span>
                </div>

                <div className="border-t border-slate-200 pt-2.5 flex justify-between items-center">
                  <span className="text-sm font-bold text-slate-900">จำนวนเงินรวมทั้งสิ้น:</span>
                  <span className="text-base font-extrabold text-blue-700 font-mono bg-blue-50 border border-blue-200 px-3 py-1 rounded-lg">
                    ฿
                    {grandTotal.toLocaleString('th-TH', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Signatory Assignment */}
          <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-50 text-amber-700 border border-amber-200">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-semibold text-slate-900 text-sm">กำหนดผู้ลงนามอนุมัติ (Signatory)</h4>
                <p className="text-xs text-slate-500">
                  เลือกผู้มีอำนาจลงนามเพื่อส่งขออนุมัติเอกสารใบเสนอราคานี้
                </p>
              </div>
            </div>

            <div className="w-full md:w-auto min-w-[260px]">
              <select
                value={signatoryUserId}
                onChange={(e) => setSignatoryUserId(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-500 text-xs"
              >
                {signatories.map((sig) => (
                  <option key={sig.id} value={sig.id}>
                    {sig.fullName} — {sig.position}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Modal Action Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition text-xs font-medium"
          >
            ยกเลิก
          </button>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => handleSave(false)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white hover:bg-slate-100 text-slate-700 font-medium text-xs transition border border-slate-300 shadow-xs"
            >
              <Save className="w-4 h-4 text-slate-500" />
              <span>บันทึกแบบร่าง (Draft)</span>
            </button>

            <button
              type="button"
              onClick={() => handleSave(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition shadow-xs"
            >
              <SendHorizontal className="w-4 h-4" />
              <span>บันทึกและส่งเสนอผู้ลงนาม</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
