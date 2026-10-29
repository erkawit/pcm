'use client';

import React, { useState } from 'react';
import {
  LogIn,
  UserPlus,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Lock,
  Mail,
  User,
  Briefcase,
  Building2,
  Loader2,
  FileText,
} from 'lucide-react';
import { useQuotationStore } from '@/lib/quotation-store';

export const LoginView: React.FC = () => {
  const { signIn, signUp, authError, isAuthLoading, pendingActivationEmail } = useQuotationStore();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [department, setDepartment] = useState('ฝ่ายขายและการตลาด');
  const [position, setPosition] = useState('เจ้าหน้าที่การขาย');
  const [localError, setLocalError] = useState<string | null>(null);
  const [signupSuccess, setSignupSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    setSignupSuccess(false);

    if (!email || !password) {
      setLocalError('กรุณากรอกอีเมลและรหัสผ่านให้ครบถ้วน');
      return;
    }

    if (mode === 'signin') {
      try {
        await signIn(email, password);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'เข้าสู่ระบบไม่สำเร็จ';
        setLocalError(msg);
      }
    } else {
      if (!fullName) {
        setLocalError('กรุณากรอกชื่อ-นามสกุล');
        return;
      }
      if (password.length < 6) {
        setLocalError('รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร');
        return;
      }
      try {
        await signUp(email, password, {
          fullName,
          department,
          position,
        });
        setSignupSuccess(true);
        setMode('signin');
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'ลงทะเบียนไม่สำเร็จ';
        setLocalError(msg);
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        {/* App Logo & Name */}
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-500/20 mb-4">
          <FileText className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          ระบบบริหารและออกใบเสนอราคา
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          PlayCH Channel & Quotation Management (PCM)
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-6 shadow-sm border border-slate-200 rounded-2xl sm:px-10">
          {/* Tab Selector */}
          <div className="flex border-b border-slate-200 mb-6">
            <button
              type="button"
              onClick={() => {
                setMode('signin');
                setLocalError(null);
              }}
              className={`flex-1 pb-3 text-sm font-semibold text-center border-b-2 transition-colors ${
                mode === 'signin'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <LogIn className="w-4 h-4 inline-block mr-1.5 -mt-0.5" />
              เข้าสู่ระบบ
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setLocalError(null);
              }}
              className={`flex-1 pb-3 text-sm font-semibold text-center border-b-2 transition-colors ${
                mode === 'signup'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <UserPlus className="w-4 h-4 inline-block mr-1.5 -mt-0.5" />
              ลงทะเบียนพนักงาน
            </button>
          </div>

          {/* Pending Activation Banner */}
          {pendingActivationEmail && (
            <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-sm">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-amber-800">รอการเปิดใช้งานบัญชี</h4>
                  <p className="mt-1 text-xs text-amber-700 leading-relaxed">
                    บัญชี <strong className="font-medium">{pendingActivationEmail}</strong>{' '}
                    ลงทะเบียนสำเร็จแล้ว แต่ยังอยู่ในสถานะรอให้ผู้ดูแลระบบ (Admin) อนุมัติการเปิดใช้งาน
                    กรุณาติดต่อผู้ดูแลระบบเพื่อเปิดสิทธิ์การเข้าใช้งาน
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Signup Success Banner */}
          {signupSuccess && (
            <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-sm">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-emerald-800">ลงทะเบียนสำเร็จ</h4>
                  <p className="mt-1 text-xs text-emerald-700 leading-relaxed">
                    สร้างบัญชีเรียบร้อย หากเป็นบัญชีแรกของระบบจะได้รับสิทธิ์ Admin ทันที หากเป็นพนักงานทั่วไป
                    กรุณาแจ้ง Admin เพื่อเปิดใช้งานก่อนเข้าสู่ระบบ
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {(localError || authError) && (
            <div className="mb-6 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span className="text-xs leading-normal">{localError || authError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ชื่อ - นามสกุล <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      placeholder="เช่น สมชาย ใจดี"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-800 placeholder-slate-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      แผนก / ฝ่าย
                    </label>
                    <div className="relative">
                      <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        placeholder="Sales & Marketing"
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-800 placeholder-slate-400"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      ตำแหน่ง
                    </label>
                    <div className="relative">
                      <Briefcase className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        placeholder="Account Executive"
                        value={position}
                        onChange={(e) => setPosition(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-800 placeholder-slate-400"
                      />
                    </div>
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                อีเมล <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  placeholder="admin@playchannel.live"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-800 placeholder-slate-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                รหัสผ่าน <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="รหัสผ่านอย่างน้อย 6 ตัวอักษร"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-800 placeholder-slate-400"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isAuthLoading}
              className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isAuthLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  กำลังดำเนินการ...
                </>
              ) : mode === 'signin' ? (
                <>
                  <LogIn className="w-4 h-4" />
                  เข้าสู่ระบบ
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  สร้างบัญชีผู้ใช้งาน
                </>
              )}
            </button>
          </form>

          {/* Quick Info Box */}
          <div className="mt-6 pt-5 border-t border-slate-100 text-center">
            <div className="flex items-center justify-center gap-1.5 text-xs text-slate-500">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>ความปลอดภัยระดับองค์กรด้วย Supabase Auth & RLS</span>
            </div>
            <p className="mt-2 text-[11px] text-slate-400">
              บัญชีแรกที่ลงทะเบียนในระบบจะได้รับสิทธิ์ผู้ดูแลระบบ (Admin) สูงสุดโดยอัตโนมัติ
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
