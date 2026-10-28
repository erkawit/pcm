'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Database,
  CheckCircle2,
  AlertCircle,
  Copy,
  ExternalLink,
  Save,
  Trash2,
  RefreshCw,
} from 'lucide-react';
import {
  getSupabaseConfig,
  saveSupabaseConfig,
  clearSupabaseConfig,
  isSupabaseConfigured,
  getSupabaseClient,
} from '@/lib/supabase';
import Swal from 'sweetalert2';

interface SupabaseConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigUpdated?: () => void;
}

export default function SupabaseConfigModal({
  isOpen,
  onClose,
  onConfigUpdated,
}: SupabaseConfigModalProps) {
  const [url, setUrl] = useState('');
  const [key, setKey] = useState('');
  const [testing, setTesting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const cfg = getSupabaseConfig();
      setUrl(cfg.url);
      setKey(cfg.key);
      setIsConnected(isSupabaseConfigured());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTestAndSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim() || !key.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'กรุณากรอกข้อมูลให้ครบ',
        text: 'กรุณาระบุทั้ง Supabase Project URL และ Anon Key',
        background: '#ffffff',
        color: '#0f172a',
      });
      return;
    }

    setTesting(true);
    saveSupabaseConfig(url, key);

    try {
      const client = getSupabaseClient();
      if (!client) throw new Error('ไม่สามารถสร้าง client ได้');

      // Test connection
      const { error } = await client.from('organizations').select('count', { count: 'exact', head: true });

      setTesting(false);
      setIsConnected(true);

      Swal.fire({
        icon: 'success',
        title: 'เชื่อมต่อ Supabase สำเร็จ!',
        text: 'ระบบเริ่มเชื่อมโยงฐานข้อมูล PostgreSQL บนคลาวด์แล้ว',
        confirmButtonColor: '#2563eb',
        background: '#ffffff',
        color: '#0f172a',
      });

      if (onConfigUpdated) onConfigUpdated();
      onClose();
    } catch (err: any) {
      setTesting(false);
      Swal.fire({
        icon: 'info',
        title: 'บันทึกการตั้งค่าแล้ว',
        text: 'หากยังไม่ได้รัน SQL Schema ใน Supabase ตารางอาจยังไม่ถูกสร้าง กรุณานำไฟล์ supabase/schema.sql ไปรันใน SQL Editor ของ Supabase',
        confirmButtonColor: '#2563eb',
        background: '#ffffff',
        color: '#0f172a',
      });
      if (onConfigUpdated) onConfigUpdated();
      onClose();
    }
  };

  const handleClear = () => {
    clearSupabaseConfig();
    setUrl('');
    setKey('');
    setIsConnected(false);
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'info',
      title: 'รีเซ็ตกลับเป็นโหมด LocalStorage',
      timer: 2000,
      showConfirmButton: false,
      background: '#ffffff',
      color: '#0f172a',
    });
    if (onConfigUpdated) onConfigUpdated();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-slate-900/50 backdrop-blur-xs overflow-y-auto animate-in fade-in">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl shadow-xl flex flex-col max-h-[90vh] overflow-hidden my-auto text-slate-800">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base md:text-lg font-bold text-slate-900 flex items-center gap-2">
                เชื่อมต่อฐานข้อมูล Supabase (PostgreSQL)
                {isConnected ? (
                  <span className="text-xs px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
                    เชื่อมต่ออยู่
                  </span>
                ) : (
                  <span className="text-xs px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200 font-medium">
                    โหมดออฟไลน์ (Local)
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-500">
                เชื่อมต่อคลาวด์ดาต้าเบสเพื่อซิงค์ข้อมูลใบเสนอราคาและผู้ลงนามแบบเรียลไทม์
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
        <form onSubmit={handleTestAndSave} className="p-6 overflow-y-auto space-y-5 text-sm flex-1">
          {/* Instructions Box */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs text-slate-600">
            <div className="flex items-center gap-2 font-semibold text-slate-900">
              <AlertCircle className="w-4 h-4 text-blue-600" />
              <span>วิธีตั้งค่า Supabase ให้พร้อมใช้งาน:</span>
            </div>
            <ol className="list-decimal list-inside space-y-1 pl-1 text-slate-600">
              <li>
                สร้าง Project ใหม่ที่{' '}
                <a
                  href="https://supabase.com"
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 hover:underline font-medium inline-flex items-center gap-0.5"
                >
                  supabase.com <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                ไปที่เมนู <strong>SQL Editor</strong> ใน Supabase แล้วคัดลอกไฟล์{' '}
                <code className="bg-slate-200 text-slate-800 px-1 py-0.5 rounded font-mono">
                  supabase/schema.sql
                </code>{' '}
                ไปวางแล้วกด Run เพื่อสร้างตาราง
              </li>
              <li>
                ไปที่ <strong>Project Settings → API</strong> แล้วคัดลอก <strong>Project URL</strong> และ{' '}
                <strong>anon public key</strong> มาใส่ด้านล่างนี้
              </li>
            </ol>
          </div>

          {/* Form Inputs */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Project URL <span className="text-rose-500">*</span>
              </label>
              <input
                type="url"
                required
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://your-project-id.supabase.co"
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 font-mono focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                API Key (anon / public) <span className="text-rose-500">*</span>
              </label>
              <input
                type="password"
                required
                value={key}
                onChange={(e) => setKey(e.target.value)}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 font-mono focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            {isConnected && (
              <button
                type="button"
                onClick={handleClear}
                className="text-xs text-rose-600 hover:text-rose-700 flex items-center gap-1 font-medium"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>ยกเลิกการเชื่อมต่อ</span>
              </button>
            )}
            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 text-xs font-medium"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                disabled={testing}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs"
              >
                {testing ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>กำลังเชื่อมต่อ...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>บันทึกและเชื่อมต่อ</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
