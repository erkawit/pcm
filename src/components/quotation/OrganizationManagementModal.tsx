'use client';

import React, { useState } from 'react';
import {
  X,
  Plus,
  Building2,
  Edit2,
  Trash2,
  CheckCircle2,
  Upload,
  Globe,
  Phone,
  Mail,
  CreditCard,
  Tv,
} from 'lucide-react';
import { Organization } from '@/types/quotation';
import { useQuotationStore } from '@/lib/quotation-store';
import Swal from 'sweetalert2';

interface OrganizationManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function OrganizationManagementModal({
  isOpen,
  onClose,
}: OrganizationManagementModalProps) {
  const {
    organizations,
    createOrganization,
    updateOrganization,
    deleteOrganization,
    currentOrg,
    switchOrganization,
  } = useQuotationStore();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [legalName, setLegalName] = useState('');
  const [tagline, setTagline] = useState('');
  const [logoUrl, setLogoUrl] = useState('/logos/playch-logo.png');
  const [taxId, setTaxId] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [bankName, setBankName] = useState('ธนาคารกสิกรไทย (KBANK)');
  const [bankAccountName, setBankAccountName] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');

  if (!isOpen) return null;

  const handleOpenAdd = () => {
    setEditingOrg(null);
    setName('');
    setLegalName('');
    setTagline('มีเดียและบริการผลิตคอนเทนต์');
    setLogoUrl('/logos/playch-logo.png');
    setTaxId('0105567000000');
    setAddress('88/9 แขวงดินแดง เขตดินแดง กรุงเทพมหานคร 10400');
    setPhone('082-123-4567');
    setEmail('contact@organization.com');
    setWebsite('https://playch.tv');
    setBankName('ธนาคารกสิกรไทย (KBANK)');
    setBankAccountName('');
    setBankAccountNumber('');
    setIsFormOpen(true);
  };

  const handleOpenEdit = (org: Organization) => {
    setEditingOrg(org);
    setName(org.name);
    setLegalName(org.legalName || '');
    setTagline(org.tagline || '');
    setLogoUrl(org.logoUrl || '/logos/playch-logo.png');
    setTaxId(org.taxId);
    setAddress(org.address);
    setPhone(org.phone);
    setEmail(org.email);
    setWebsite(org.website || '');
    setBankName(org.bankName);
    setBankAccountName(org.bankAccountName);
    setBankAccountNumber(org.bankAccountNumber);
    setIsFormOpen(true);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setLogoUrl(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'กรุณากรอกชื่อองค์กร / ช่อง',
        background: '#ffffff',
        color: '#0f172a',
      });
      return;
    }

    if (editingOrg) {
      await updateOrganization(editingOrg.id, {
        name,
        legalName,
        tagline,
        logoUrl,
        taxId,
        address,
        phone,
        email,
        website,
        bankName,
        bankAccountName,
        bankAccountNumber,
      });
    } else {
      await createOrganization({
        name,
        legalName,
        tagline,
        logoUrl,
        taxId,
        address,
        phone,
        email,
        website,
        bankName,
        bankAccountName,
        bankAccountNumber,
        isDefault: false,
      });
    }

    setIsFormOpen(false);
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'success',
      title: 'บันทึกข้อมูลองค์กรเรียบร้อย',
      timer: 2000,
      showConfirmButton: false,
      background: '#ffffff',
      color: '#0f172a',
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-slate-900/50 backdrop-blur-xs overflow-y-auto animate-in fade-in">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-5xl shadow-xl flex flex-col max-h-[88vh] overflow-hidden my-auto text-slate-800">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600 border border-blue-200">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base md:text-lg font-bold text-slate-900">
                ข้อมูลองค์กรและร้านค้า (Organizations & Channels)
              </h2>
              <p className="text-xs text-slate-500">
                จัดการข้อมูลนิติบุคคล เลขประจำตัวผู้เสียภาษี และช่องทางรับชำระเงินของแต่ละร้านค้า
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

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4 text-sm flex-1">
          {/* Action Bar */}
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-slate-600">
              คุณสามารถสลับเลือกองค์กรหรือร้านค้าเพื่อออกใบเสนอราคาในนามองค์กรนั้นๆ ได้อย่างอิสระ
            </p>
            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition shadow-xs flex-shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>เพิ่มองค์กร / ร้านค้าใหม่</span>
            </button>
          </div>

          {/* Form Drawer (When Adding/Editing) */}
          {isFormOpen && (
            <form
              onSubmit={handleSaveOrg}
              className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3.5 shadow-xs"
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-blue-600" />
                  {editingOrg ? 'แก้ไขข้อมูลองค์กร / ร้านค้า' : 'เพิ่มองค์กร / ร้านค้าใหม่'}
                </h4>
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Logo Preview & Upload */}
              <div className="flex items-center gap-4 p-3 bg-white rounded-xl border border-slate-200">
                <div className="w-16 h-16 rounded-xl bg-white border border-slate-200 flex items-center justify-center overflow-hidden p-1">
                  <img src={logoUrl} alt="Logo" className="max-h-full max-w-full object-contain" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-800">โลโก้องค์กร / ร้านค้า</label>
                  <p className="text-[11px] text-slate-500">
                    รูปภาพโลโก้จะถูกนำไปแสดงบนหัวเอกสารใบเสนอราคา
                  </p>
                  <label className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs text-slate-700 cursor-pointer transition border border-slate-200">
                    <Upload className="w-3.5 h-3.5 text-blue-600" />
                    <span>อัปโหลดรูปภาพโลโก้</span>
                    <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    ชื่อร้านค้า / องค์กร <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="เช่น PlayCH Studio"
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">ชื่อนิติบุคคล / จดทะเบียน</label>
                  <input
                    type="text"
                    value={legalName}
                    onChange={(e) => setLegalName(e.target.value)}
                    placeholder="เช่น บริษัท เพลย์แชนแนล มีเดีย จำกัด"
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">เลขประจำตัวผู้เสียภาษี</label>
                  <input
                    type="text"
                    value={taxId}
                    onChange={(e) => setTaxId(e.target.value)}
                    placeholder="0105567089123"
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">เบอร์โทรศัพท์ติดต่อ</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="082-999-7890"
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">อีเมลติดต่อ</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="contact@playchannel.live"
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">เว็บไซต์ / โซเชียลมีเดีย</label>
                  <input
                    type="text"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="https://playch.tv"
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">สโลแกน / Tagline</label>
                  <input
                    type="text"
                    value={tagline}
                    onChange={(e) => setTagline(e.target.value)}
                    placeholder="ศูนย์กลางบริการสื่อและการจัดการคอนเทนต์มืออาชีพ"
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">ที่อยู่ออกใบเสนอราคา</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="88/9 ถ.รัชดาภิเษก แขวงดินแดง เขตดินแดง กรุงเทพฯ"
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900"
                />
              </div>

              {/* Bank Details */}
              <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-3">
                <h5 className="font-semibold text-xs text-slate-900 flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-blue-600" /> ข้อมูลบัญชีรับชำระเงินเริ่มต้น
                </h5>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">ธนาคาร</label>
                    <input
                      type="text"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      placeholder="ธนาคารกสิกรไทย (KBANK)"
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">ชื่อบัญชี</label>
                    <input
                      type="text"
                      value={bankAccountName}
                      onChange={(e) => setBankAccountName(e.target.value)}
                      placeholder="บจก. เพลย์แชนแนล มีเดีย"
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">เลขที่บัญชี</label>
                    <input
                      type="text"
                      value={bankAccountNumber}
                      onChange={(e) => setBankAccountNumber(e.target.value)}
                      placeholder="789-2-34567-8"
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900 font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-3 py-1.5 rounded-lg text-slate-600 hover:bg-slate-200 text-xs"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs"
                >
                  บันทึกข้อมูล
                </button>
              </div>
            </form>
          )}

          {/* Organizations Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {organizations.map((org) => {
              const isSelected = org.id === currentOrg.id;
              return (
                <div
                  key={org.id}
                  className={`p-4 rounded-xl border transition flex flex-col justify-between ${
                    isSelected
                      ? 'bg-blue-50/50 border-blue-500 shadow-sm ring-1 ring-blue-500/30'
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-xs'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 p-1 flex items-center justify-center overflow-hidden">
                          <img
                            src={org.logoUrl || '/logos/playch-logo.png'}
                            alt={org.name}
                            className="max-h-full max-w-full object-contain"
                          />
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                            {org.name}
                            {isSelected && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 font-medium">
                                กำลังใช้งาน
                              </span>
                            )}
                          </h4>
                          <p className="text-xs text-slate-500 truncate max-w-[200px]">
                            {org.tagline || org.legalName}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEdit(org)}
                          className="p-1.5 rounded-md text-slate-500 hover:text-blue-600 hover:bg-slate-100 transition"
                          title="แก้ไขข้อมูล"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        {organizations.length > 1 && (
                          <button
                            onClick={() => deleteOrganization(org.id)}
                            className="p-1.5 rounded-md text-slate-500 hover:text-rose-600 hover:bg-slate-100 transition"
                            title="ลบ"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-slate-100 text-xs space-y-1 text-slate-600">
                      <div>
                        <span className="text-slate-400">เลขผู้เสียภาษี:</span> {org.taxId}
                      </div>
                      <div className="truncate">
                        <span className="text-slate-400">บัญชี:</span> {org.bankName} - {org.bankAccountNumber} ({org.bankAccountName})
                      </div>
                      <div className="truncate text-[11px] text-slate-400">
                        📍 {org.address}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 flex justify-end">
                    {!isSelected ? (
                      <button
                        onClick={() => switchOrganization(org.id)}
                        className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 hover:bg-blue-600 hover:text-white hover:border-blue-600 text-slate-700 text-xs font-semibold transition shadow-xs"
                      >
                        สลับใช้งานองค์กรนี้
                      </button>
                    ) : (
                      <span className="text-xs font-semibold text-blue-600 flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" /> องค์กรที่กำลังใช้งาน
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>รวมองค์กรและร้านค้า {organizations.length} รายการ</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-medium shadow-xs"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
}
