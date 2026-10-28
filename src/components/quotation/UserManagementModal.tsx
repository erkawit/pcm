'use client';

import React, { useState } from 'react';
import {
  X,
  Plus,
  Users,
  Shield,
  PenTool,
  Check,
  Edit2,
  Trash2,
  UserCheck,
  Award,
  Key,
} from 'lucide-react';
import { AppUser, UserRole } from '@/types/quotation';
import { useQuotationStore } from '@/lib/quotation-store';
import SignaturePadModal from './SignaturePadModal';
import Swal from 'sweetalert2';

interface UserManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function UserManagementModal({ isOpen, onClose }: UserManagementModalProps) {
  const {
    users,
    createUser,
    updateUser,
    deleteUser,
    updateUserSignature,
    currentUser,
    switchUser,
  } = useQuotationStore();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);

  // Signature Pad state for a specific user
  const [isSignModalOpen, setIsSignModalOpen] = useState(false);
  const [targetSignUser, setTargetSignUser] = useState<AppUser | null>(null);

  // Form states
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('staff');
  const [department, setDepartment] = useState('ฝ่ายผลิตสื่อและมีเดีย');
  const [position, setPosition] = useState('เจ้าหน้าที่ประสานงานมีเดีย');
  const [phone, setPhone] = useState('');
  const [canSign, setCanSign] = useState(false);
  const [maxApprovalAmount, setMaxApprovalAmount] = useState(1000000);

  if (!isOpen) return null;

  const handleOpenAdd = () => {
    setEditingUser(null);
    setUsername(`user_${Date.now().toString().slice(-4)}`);
    setFullName('');
    setEmail('');
    setRole('staff');
    setDepartment('ฝ่ายประสานงานการตลาด');
    setPosition('เจ้าหน้าที่ฝ่ายขายและการตลาด');
    setPhone('');
    setCanSign(false);
    setMaxApprovalAmount(500000);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (user: AppUser) => {
    setEditingUser(user);
    setUsername(user.username);
    setFullName(user.fullName);
    setEmail(user.email);
    setRole(user.role);
    setDepartment(user.department || '');
    setPosition(user.position || '');
    setPhone(user.phone || '');
    setCanSign(user.canSign);
    setMaxApprovalAmount(user.maxApprovalAmount || 1000000);
    setIsFormOpen(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'กรุณากรอกข้อมูลสำคัญให้ครบ',
        text: 'ชื่อ-นามสกุล และ อีเมล จำเป็นต้องระบุ',
        background: '#ffffff',
        color: '#0f172a',
      });
      return;
    }

    if (editingUser) {
      await updateUser(editingUser.id, {
        username,
        fullName,
        email,
        role,
        department,
        position,
        phone,
        canSign,
        maxApprovalAmount: Number(maxApprovalAmount),
      });
    } else {
      await createUser({
        username,
        fullName,
        email,
        role,
        department,
        position,
        phone,
        canSign,
        maxApprovalAmount: Number(maxApprovalAmount),
        isActive: true,
      });
    }

    setIsFormOpen(false);
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'success',
      title: 'บันทึกข้อมูลบุคลากรสำเร็จ',
      timer: 2000,
      showConfirmButton: false,
      background: '#ffffff',
      color: '#0f172a',
    });
  };

  const handleOpenSignaturePad = (user: AppUser) => {
    setTargetSignUser(user);
    setIsSignModalOpen(true);
  };

  const handleSaveSignature = (sigDataUrl: string) => {
    if (targetSignUser) {
      updateUserSignature(targetSignUser.id, sigDataUrl);
      setIsSignModalOpen(false);
      setTargetSignUser(null);
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: 'บันทึกลายมือชื่อดิจิทัลสำเร็จ',
        timer: 2000,
        showConfirmButton: false,
        background: '#ffffff',
        color: '#0f172a',
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-slate-900/50 backdrop-blur-xs overflow-y-auto animate-in fade-in">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-5xl shadow-xl flex flex-col max-h-[88vh] overflow-hidden my-auto text-slate-800">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600 border border-blue-200">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base md:text-lg font-bold text-slate-900">
                บุคลากรและสิทธิ์ลงนามอนุมัติ (Signatory & Roles)
              </h2>
              <p className="text-xs text-slate-500">
                จัดการสิทธิ์บุคลากร กำหนดผู้ลงนามอนุมัติ และบันทึกลายมือชื่อดิจิทัล
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
              ผู้ที่มีสถานะ <strong>ผู้มีอำนาจลงนาม</strong> จะสามารถอนุมัติใบเสนอราคาและประทับลายมือชื่อดิจิทัลได้
            </p>
            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition shadow-xs flex-shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>เพิ่มบุคลากรใหม่</span>
            </button>
          </div>

          {/* Form Drawer (When Adding/Editing) */}
          {isFormOpen && (
            <form
              onSubmit={handleSaveUser}
              className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3.5 shadow-xs"
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-blue-600" />
                  {editingUser ? 'แก้ไขข้อมูลบุคลากร' : 'เพิ่มบุคลากรใหม่'}
                </h4>
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    ชื่อ-นามสกุล <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="เช่น อดิตรา มอนด์บีนี"
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    อีเมล <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="user@playchannel.live"
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">ชื่อผู้ใช้ (Username)</label>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">บทบาทและสิทธิ์ (Role)</label>
                  <select
                    value={role}
                    onChange={(e) => {
                      const r = e.target.value as UserRole;
                      setRole(r);
                      if (r === 'signatory' || r === 'admin') setCanSign(true);
                    }}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900"
                  >
                    <option value="staff">บุคลากรทั่วไป (Staff - ออกใบเสนอราคา / เสนออนุมัติ)</option>
                    <option value="signatory">ผู้มีอำนาจลงนาม (Signatory - อนุมัติ & ประทับลายมือชื่อ)</option>
                    <option value="admin">ผู้ดูแลระบบสูงสุด (Admin - จัดการทุกส่วน)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">ฝ่าย / แผนก</label>
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="เช่น Executive, Production, Sales"
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">ตำแหน่งทางการ (Position)</label>
                  <input
                    type="text"
                    required
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    placeholder="เช่น ผู้จัดการทั่วไป, กรรมการผู้จัดการ"
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900"
                  />
                </div>
              </div>

              {/* Signatory Privileges settings */}
              <div className="p-3 rounded-lg bg-white border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="canSignCheck"
                    checked={canSign}
                    onChange={(e) => setCanSign(e.target.checked)}
                    className="rounded accent-blue-600 w-4 h-4 cursor-pointer"
                  />
                  <label htmlFor="canSignCheck" className="text-xs text-slate-800 cursor-pointer font-medium">
                    อนุญาตให้มีสิทธิ์ลงนามอนุมัติในใบเสนอราคา (Authorized Signatory)
                  </label>
                </div>

                {canSign && (
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-slate-500">วงเงินอนุมัติสูงสุด:</span>
                    <input
                      type="number"
                      value={maxApprovalAmount}
                      onChange={(e) => setMaxApprovalAmount(Number(e.target.value))}
                      className="w-32 bg-slate-50 border border-slate-300 rounded-md px-2 py-1 text-xs text-slate-900 font-mono text-right"
                    />
                    <span className="text-slate-500">บาท</span>
                  </div>
                )}
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
                  บันทึกข้อมูลบุคลากร
                </button>
              </div>
            </form>
          )}

          {/* Users Table */}
          <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
            <table className="w-full text-left">
              <thead className="bg-slate-100 text-xs text-slate-700 uppercase font-bold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">ชื่อ-นามสกุล / ตำแหน่ง</th>
                  <th className="px-4 py-3">บทบาท (Role)</th>
                  <th className="px-4 py-3">สิทธิ์ลงนาม</th>
                  <th className="px-4 py-3">ลายมือชื่อดิจิทัล</th>
                  <th className="px-4 py-3 text-center w-36">การจัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/60 transition">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900 flex items-center gap-2">
                        {u.fullName}
                        {u.id === currentUser.id && (
                          <span className="text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-medium border border-blue-200">
                            คุณ
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {u.position} • {u.department}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">{u.email}</div>
                    </td>

                    <td className="px-4 py-3">
                      {u.role === 'admin' ? (
                        <span className="px-2.5 py-0.5 rounded-md bg-rose-50 text-rose-700 font-semibold border border-rose-200">
                          ผู้ดูแลระบบ (Admin)
                        </span>
                      ) : u.role === 'signatory' ? (
                        <span className="px-2.5 py-0.5 rounded-md bg-amber-50 text-amber-700 font-semibold border border-amber-200">
                          ผู้ลงนาม (Signatory)
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold border border-slate-200">
                          บุคลากร (Staff)
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      {u.canSign ? (
                        <div>
                          <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                            <Check className="w-3.5 h-3.5 text-emerald-600" /> มีสิทธิ์ลงนาม
                          </span>
                          <div className="text-[10px] text-slate-500 font-mono">
                            วงเงิน: {u.maxApprovalAmount?.toLocaleString()} บ.
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-400">- ไม่มีสิทธิ์ -</span>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {u.signatureDataUrl ? (
                          <div className="h-8 w-20 bg-white border border-slate-200 rounded p-0.5 flex items-center justify-center">
                            <img
                              src={u.signatureDataUrl}
                              alt="Signature"
                              className="max-h-full max-w-full object-contain"
                            />
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">ยังไม่มีลายมือชื่อ</span>
                        )}
                        <button
                          onClick={() => handleOpenSignaturePad(u)}
                          className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] flex items-center gap-1 transition"
                          title="วาด/แก้ไขลายมือชื่อ"
                        >
                          <PenTool className="w-3 h-3 text-blue-600" />
                          <span>วาดใหม่</span>
                        </button>
                      </div>
                    </td>

                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => switchUser(u.id)}
                          className="px-2 py-1 rounded bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 text-[10px] font-medium transition"
                          title="สลับทำงานในนามบุคคลนี้"
                        >
                          สลับสิทธิ์
                        </button>
                        <button
                          onClick={() => handleOpenEdit(u)}
                          className="p-1.5 rounded-md text-slate-500 hover:text-blue-600 hover:bg-slate-100 transition"
                          title="แก้ไข"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => deleteUser(u.id)}
                          className="p-1.5 rounded-md text-slate-500 hover:text-rose-600 hover:bg-slate-100 transition"
                          title="ลบ"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>บุคลากรและผู้ลงนามในระบบ {users.length} คน</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-medium shadow-xs"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>

      {/* Signature Pad Modal */}
      {targetSignUser && (
        <SignaturePadModal
          isOpen={isSignModalOpen}
          onClose={() => {
            setIsSignModalOpen(false);
            setTargetSignUser(null);
          }}
          onSaveSignature={handleSaveSignature}
          initialSignature={targetSignUser.signatureDataUrl}
          title={`ลายมือชื่อดิจิทัลของ: ${targetSignUser.fullName}`}
        />
      )}
    </div>
  );
}
