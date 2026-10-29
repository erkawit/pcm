'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Database,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  Server,
  Key,
} from 'lucide-react';
import {
  getSupabaseConfig,
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
  const [testing, setTesting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [dbTablesStatus, setDbTablesStatus] = useState<string | null>(null);

  const testConnection = async () => {
    setTesting(true);
    setDbTablesStatus(null);
    try {
      const client = getSupabaseClient();
      if (!client) {
        throw new Error('ไม่พบการตั้งค่า Environment Variables');
      }

      const { data, error } = await client.from('organizations').select('count', { count: 'exact', head: true });
      if (error) {
        if (error.code === '42P01') {
          setDbTablesStatus('เชื่อมต่อได้ แต่ยังไม่พบตาราง organizations กรุณารัน supabase/schema.sql ใน Supabase SQL Editor');
        } else {
          setDbTablesStatus(`ผลการทดสอบ: ${error.message}`);
        }
      } else {
        setDbTablesStatus('ตาราง organizations พร้อมใช้งานเรียบร้อย');
      }
      setIsConnected(true);
    } catch (err: unknown) {
      setIsConnected(false);
      const msg = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการเชื่อมต่อ';
      setDbTablesStatus(msg);
    } finally {
      setTesting(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      const cfg = getSupabaseConfig();
      setUrl(cfg.url);
      setIsConnected(isSupabaseConfigured());
      testConnection();
    }
  }, [isOpen]);

  if (!isOpen) return null;

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
              <h2 className="text-base font-bold text-slate-900">
                สถานะการเชื่อมต่อฐานข้อมูล Supabase (PostgreSQL)
              </h2>
              <p className="text-xs text-slate-500">
                ตรวจสอบการเชื่อมต่อฐานข้อมูลและตัวแปร Environment Variables
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-sm">
          {/* Status Badge */}
          <div
            className={`p-4 rounded-xl border flex items-center gap-3 ${
              isConnected
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-amber-50 border-amber-200 text-amber-800'
            }`}
          >
            {isConnected ? (
              <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-6 h-6 text-amber-600 shrink-0" />
            )}
            <div>
              <h4 className="font-semibold text-sm">
                {isConnected
                  ? 'ระบบเชื่อมต่อกับ Supabase Cloud Database เรียบร้อย'
                  : 'ยังไม่ได้ตั้งค่าตัวแปรเชื่อมต่อ Supabase'}
              </h4>
              <p className="text-xs mt-0.5 opacity-90">
                {isConnected
                  ? 'ข้อมูลทั้งหมด (ผู้ใช้, สินค้า, องค์กร, ใบเสนอราคา) จะถูกบันทึกและซิงค์ผ่าน PostgreSQL'
                  : 'กรุณากำหนด NEXT_PUBLIC_SUPABASE_URL และ NEXT_PUBLIC_SUPABASE_ANON_KEY ใน Vercel หรือ .env.local'}
              </p>
            </div>
          </div>

          {/* Connection Details */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1 flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5 text-slate-400" />
                Supabase Project URL:
              </label>
              <div className="font-mono text-xs text-slate-800 bg-white p-2 rounded-lg border border-slate-200 truncate">
                {url || '(ยังไม่ได้ระบุใน Environment Variables)'}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-slate-400" />
                Supabase Anon Key:
              </label>
              <div className="font-mono text-xs text-slate-800 bg-white p-2 rounded-lg border border-slate-200">
                {isConnected ? '●●●●●●●●●●●● (ตั้งค่าแล้ว)' : '(ยังไม่ได้ระบุ)'}
              </div>
            </div>

            {dbTablesStatus && (
              <div className="pt-2 border-t border-slate-200 text-xs text-slate-600">
                <span className="font-semibold text-slate-700">ผลการตรวจสอบโครงสร้างฐานข้อมูล: </span>
                <span>{dbTablesStatus}</span>
              </div>
            )}
          </div>

          {/* Setup Guide Box */}
          <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 text-xs space-y-2 text-blue-900">
            <h5 className="font-semibold flex items-center gap-1.5">
              <span>คำแนะนำสำหรับการ Deploy บน Vercel:</span>
            </h5>
            <ol className="list-decimal pl-4 space-y-1 text-slate-700">
              <li>ไปที่หน้า Dashboard ของโปรเจกต์ใน Vercel &gt; Settings &gt; Environment Variables</li>
              <li>
                เพิ่ม <code className="bg-white px-1.5 py-0.5 rounded border border-blue-200 font-mono text-[11px]">NEXT_PUBLIC_SUPABASE_URL</code>
              </li>
              <li>
                เพิ่ม <code className="bg-white px-1.5 py-0.5 rounded border border-blue-200 font-mono text-[11px]">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>
              </li>
              <li>
                (ตัวเลือก) เพิ่ม <code className="bg-white px-1.5 py-0.5 rounded border border-blue-200 font-mono text-[11px]">SUPABASE_SERVICE_ROLE_KEY</code> สำหรับฟังก์ชันจัดการผู้ใช้ของ Admin
              </li>
              <li>กด Redeploy โปรเจกต์เพื่อให้ค่ามีผล</li>
            </ol>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={testConnection}
            disabled={testing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-medium transition disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${testing ? 'animate-spin' : ''}`} />
            ทดสอบการเชื่อมต่ออีกครั้ง
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
}
