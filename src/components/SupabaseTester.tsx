import React, { useState, useEffect } from 'react';
import { 
  Database, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Key, 
  Link2, 
  ExternalLink,
  Table,
  Layers,
  Activity
} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

export const SupabaseTester: React.FC = () => {
  const [supabaseUrl, setSupabaseUrl] = useState<string>(() => {
    return localStorage.getItem('finnote_supabase_url') || import.meta.env.VITE_SUPABASE_URL || '';
  });
  const [supabaseAnonKey, setSupabaseAnonKey] = useState<string>(() => {
    return localStorage.getItem('finnote_supabase_key') || import.meta.env.VITE_SUPABASE_ANON_KEY || '';
  });

  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    ok?: boolean;
    message?: string;
    details?: {
      categoriesCount?: number;
      txCount?: number;
      budgetCount?: number;
      savingsCount?: number;
    };
  } | null>(null);

  const handleTestConnection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabaseUrl || !supabaseAnonKey) {
      setTestResult({ ok: false, message: 'กรุณากรอกทั้ง Supabase URL และ Anon Key' });
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    try {
      localStorage.setItem('finnote_supabase_url', supabaseUrl);
      localStorage.setItem('finnote_supabase_key', supabaseAnonKey);

      const client = createClient(supabaseUrl, supabaseAnonKey);

      // Ping multiple tables
      const [catRes, txRes, budgetRes, savingsRes] = await Promise.all([
        client.from('categories').select('*', { count: 'exact', head: true }),
        client.from('transactions').select('*', { count: 'exact', head: true }),
        client.from('budgets').select('*', { count: 'exact', head: true }),
        client.from('savings_goals').select('*', { count: 'exact', head: true }),
      ]);

      if (catRes.error && catRes.error.code !== 'PGRST116') {
        throw new Error(catRes.error.message);
      }

      setTestResult({
        ok: true,
        message: 'เชื่อมต่อ Supabase สำเร็จสมบูรณ์! ตารางทั้งหมดพร้อมทำงาน',
        details: {
          categoriesCount: catRes.count ?? 0,
          txCount: txRes.count ?? 0,
          budgetCount: budgetRes.count ?? 0,
          savingsCount: savingsRes.count ?? 0,
        },
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setTestResult({
        ok: false,
        message: `เชื่อมต่อไม่สำเร็จ: ${message} (หากยังไม่ได้รัน SQL Schema ให้ไปที่แท็บ 'SQL Schema' ก่อน)`,
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="p-5 rounded-2xl bg-white border border-[#ded5c0] shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-[#2563eb] text-white flex items-center justify-center shrink-0 shadow-sm">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-[#2c2618]">
              ทดสอบการเชื่อมต่อ Supabase ของคุณ (Live Connection Tester)
            </h3>
            <p className="text-xs text-[#7a705a]">
              กรอก Project URL และ anon key เพื่อทดสอบการเชื่อมต่อแบบ Real-time จากเบราว์เซอร์
            </p>
          </div>
        </div>

        <form onSubmit={handleTestConnection} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#5c533f] mb-1">
              Project URL (จาก Supabase Project Settings &gt; API)
            </label>
            <div className="relative">
              <input
                type="url"
                value={supabaseUrl}
                onChange={(e) => setSupabaseUrl(e.target.value)}
                placeholder="https://xxxxxxxxxxxxxxxx.supabase.co"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#ded5c0] text-xs font-mono bg-[#fcfbfa] focus:outline-none focus:ring-2 focus:ring-[#3f6b52]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#5c533f] mb-1">
              Anon / Public API Key (anon public key)
            </label>
            <div className="relative">
              <input
                type="password"
                value={supabaseAnonKey}
                onChange={(e) => setSupabaseAnonKey(e.target.value)}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#ded5c0] text-xs font-mono bg-[#fcfbfa] focus:outline-none focus:ring-2 focus:ring-[#3f6b52]"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <a
              href="https://supabase.com/dashboard"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs text-[#2563eb] hover:underline"
            >
              <span>เปิด Supabase Dashboard เพื่อดู API Key</span>
              <ExternalLink className="w-3 h-3" />
            </a>

            <button
              type="submit"
              disabled={isTesting}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-xs font-semibold shadow-sm transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isTesting ? 'animate-spin' : ''}`} />
              <span>{isTesting ? 'กำลังทดสอบ...' : 'ทดสอบการเชื่อมต่อ'}</span>
            </button>
          </div>
        </form>

        {/* User UUID Guide Box */}
        <div className="mt-5 p-4 rounded-xl bg-[#f8fafc] border border-slate-200">
          <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 font-bold text-xs mt-0.5">
              💡
            </div>
            <div className="space-y-2 text-xs">
              <strong className="text-slate-800 font-bold block text-sm">
                ไม่มี User UUID ใน Supabase หรือเพิ่งสร้างโปรเจกต์ใหม่?
              </strong>
              <p className="text-slate-600 leading-relaxed">
                ในระบบ Supabase การสร้างตารางจะผูกกับบัญชีผู้ใช้งาน (User UUID) เพื่อความปลอดภัย (Row Level Security):
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-1">
                <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1">
                  <span className="font-bold text-emerald-700 block">วิธีที่ 1: ให้สคริปต์สร้างให้ (แนะนำ)</span>
                  <span className="text-slate-600 block">
                    ใน <code>MigrateToSupabase.gs</code> เพียงแค่วางอีเมลของคุณตรง <code>userEmail: 'you@email.com'</code> สคริปต์จะสร้าง User ใน Supabase Auth ให้อัตโนมัติทันที
                  </span>
                </div>
                <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1">
                  <span className="font-bold text-blue-700 block">วิธีที่ 2: กดสร้างเองใน Dashboard</span>
                  <span className="text-slate-600 block">
                    ไปที่ Supabase &gt; เมนู <strong>Authentication &gt; Users</strong> &gt; กดปุ่ม <strong>Add user</strong> &gt; กรอกอีเมล/รหัสผ่าน แล้วคัดลอกค่า <strong>User UID</strong> มาใช้งาน
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {testResult && (
          <div
            className={`mt-4 p-4 rounded-xl border text-xs leading-relaxed ${
              testResult.ok
                ? 'bg-[#e8f1ec] border-[#d0e5d8] text-[#2c7a6b]'
                : 'bg-[#fbeeed] border-[#f5cfcc] text-[#b9382c]'
            }`}
          >
            <div className="flex items-center gap-2 font-bold mb-1">
              {testResult.ok ? (
                <CheckCircle2 className="w-4 h-4 text-[#2c7a6b]" />
              ) : (
                <AlertCircle className="w-4 h-4 text-[#b9382c]" />
              )}
              <span>{testResult.message}</span>
            </div>

            {testResult.ok && testResult.details && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 pt-3 border-t border-[#d0e5d8]/80 text-[#2c2618]">
                <div className="p-2 bg-white rounded-lg border border-[#d0e5d8]">
                  <span className="text-[10px] text-slate-500 block">หมวดหมู่</span>
                  <strong className="text-sm">{testResult.details.categoriesCount} รายการ</strong>
                </div>
                <div className="p-2 bg-white rounded-lg border border-[#d0e5d8]">
                  <span className="text-[10px] text-slate-500 block">รายการธุรกรรม</span>
                  <strong className="text-sm">{testResult.details.txCount} รายการ</strong>
                </div>
                <div className="p-2 bg-white rounded-lg border border-[#d0e5d8]">
                  <span className="text-[10px] text-slate-500 block">งบประมาณ</span>
                  <strong className="text-sm">{testResult.details.budgetCount} รายการ</strong>
                </div>
                <div className="p-2 bg-white rounded-lg border border-[#d0e5d8]">
                  <span className="text-[10px] text-slate-500 block">เป้าหมายการออม</span>
                  <strong className="text-sm">{testResult.details.savingsCount} รายการ</strong>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
