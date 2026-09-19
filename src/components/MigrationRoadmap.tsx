import React from 'react';
import { 
  CheckCircle2, 
  ArrowRight, 
  Database, 
  FileCode2, 
  Send, 
  Globe, 
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Zap,
  Copy,
  Check
} from 'lucide-react';

interface MigrationRoadmapProps {
  onNavigateTab: (tab: 'roadmap' | 'sql' | 'migrator' | 'tester' | 'vercel' | 'gas') => void;
  onCopyText: (text: string, id: string) => void;
  copiedId: string | null;
}

export const MigrationRoadmap: React.FC<MigrationRoadmapProps> = ({
  onNavigateTab,
  onCopyText,
  copiedId,
}) => {
  return (
    <div className="space-y-6">
      {/* Hero Banner */}
      <div className="rounded-2xl bg-gradient-to-br from-[#1e293b] via-[#0f172a] to-[#020617] text-white p-6 sm:p-8 shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold border border-emerald-500/30 mb-4">
            <Zap className="w-3.5 h-3.5" />
            <span>Modern Web Stack: 10x Speed + Zero Cost ($0)</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">
            แผนผังการย้ายระบบ FinNote ไปยัง Supabase + Vercel
          </h2>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed mb-6">
            อัปเกรดจาก Google Apps Script ที่โหลด 2-4 วินาที สู่ PostgreSQL ประสิทธิภาพสูงบน Supabase 
            พร้อมหน้าเว็บโหลดเสี้ยววินาทีบน Vercel Edge Network 
            โดยที่ข้อมูลประวัติเดิมใน Google Sheets จะถูกโอนย้ายไปครบทุกเรคคอร์ด 100%
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-800">
            <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50">
              <span className="text-xs text-slate-400 block mb-0.5">Database</span>
              <strong className="text-sm font-semibold text-emerald-400">Supabase (PostgreSQL)</strong>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50">
              <span className="text-xs text-slate-400 block mb-0.5">Hosting</span>
              <strong className="text-sm font-semibold text-blue-400">Vercel Edge</strong>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50">
              <span className="text-xs text-slate-400 block mb-0.5">ค่าใช้จ่าย</span>
              <strong className="text-sm font-semibold text-white">ฟรีตลอดชีพ ($0)</strong>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50">
              <span className="text-xs text-slate-400 block mb-0.5">ข้อมูลเดิม</span>
              <strong className="text-sm font-semibold text-amber-400">ย้ายครบ 100%</strong>
            </div>
          </div>
        </div>
      </div>

      {/* 4 Concrete Steps */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-[#2c2618] flex items-center gap-2">
          <span>4 ขั้นตอนการย้ายระบบสู่ความเร็วสูงสุด</span>
        </h3>

        {/* Step 1 */}
        <div className="p-5 sm:p-6 rounded-2xl bg-white border border-[#ded5c0] shadow-sm hover:border-[#3f6b52]/50 transition-colors">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#3f6b52] text-white font-bold flex items-center justify-center shrink-0 shadow-sm">
                1
              </div>
              <div>
                <h4 className="font-bold text-base text-[#2c2618]">
                  สร้างโปรเจกต์ใหม่บน Supabase (ฟรี 100%)
                </h4>
                <p className="text-xs text-[#7a705a]">ใช้เวลาประมาณ 1 นาที ไม่ต้องผูกบัตรเครดิต</p>
              </div>
            </div>
            <a
              href="https://supabase.com"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#f1ecdf] hover:bg-[#ded5c0] text-[#2c2618] text-xs font-semibold transition-colors shrink-0"
            >
              <span>เปิด Supabase.com</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          <div className="space-y-2 text-xs sm:text-sm text-[#4d4432] bg-[#fcfbfa] p-4 rounded-xl border border-[#ece4d0]">
            <p>1. เข้าเว็บไซต์ <strong>supabase.com</strong> กดปุ่ม <em>Start your project</em> (เข้าสู่ระบบด้วย GitHub ได้เลย)</p>
            <p>2. กด <strong>New project</strong> ตั้งชื่อโปรเจกต์ เช่น <code>finnote-app</code> และตั้งรหัสผ่าน Database</p>
            <p>3. เลือก Region: <strong>Singapore (ap-southeast-1)</strong> (แนะนำอย่างยิ่ง เพื่อให้ได้ Latency ต่ำที่สุดจากไทย ~25ms)</p>
            <p>4. ไปที่เมนู <strong>Project Settings &gt; API</strong> เพื่อคัดลอก <em>Project URL</em> และ <em>anon public key</em></p>
          </div>
        </div>

        {/* Step 2 */}
        <div className="p-5 sm:p-6 rounded-2xl bg-white border border-[#ded5c0] shadow-sm hover:border-[#3f6b52]/50 transition-colors">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#3f6b52] text-white font-bold flex items-center justify-center shrink-0 shadow-sm">
                2
              </div>
              <div>
                <h4 className="font-bold text-base text-[#2c2618]">
                  รัน SQL Schema สร้างตาราง 8 ตาราง + ระบบความปลอดภัย (RLS)
                </h4>
                <p className="text-xs text-[#7a705a]">เตรียมโครงสร้างฐานข้อมูล PostgreSQL ให้พร้อมรับข้อมูล</p>
              </div>
            </div>
            <button
              onClick={() => onNavigateTab('sql')}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#3f6b52] hover:bg-[#345944] text-white text-xs font-semibold shadow-sm transition-colors shrink-0"
            >
              <Database className="w-3.5 h-3.5" />
              <span>ดูและคัดลอก SQL Schema</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2 text-xs sm:text-sm text-[#4d4432] bg-[#fcfbfa] p-4 rounded-xl border border-[#ece4d0]">
            <p>1. ไปที่ Supabase Dashboard เลือกโปรเจกต์ของคุณ</p>
            <p>2. คลิกเมนูด้านซ้ายที่ไอคอน <strong>SQL Editor</strong> แล้วกดปุ่ม <strong>New query</strong></p>
            <p>3. กดปุ่ม <em>คัดลอก SQL Schema</em> จากแท็บด้านบนของหน้านี้ แล้วนำไปวางในช่องคำสั่ง</p>
            <p>4. กดปุ่ม <strong>Run</strong> (หรือกด <code>Cmd/Ctrl + Enter</code>) ตาราง 8 ตารางพร้อม Index และสิทธิความปลอดภัยจะถูกสร้างทันที</p>
          </div>
        </div>

        {/* Step 3 */}
        <div className="p-5 sm:p-6 rounded-2xl bg-white border border-[#ded5c0] shadow-sm hover:border-[#3f6b52]/50 transition-colors">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#b45309] text-white font-bold flex items-center justify-center shrink-0 shadow-sm">
                3
              </div>
              <div>
                <h4 className="font-bold text-base text-[#2c2618]">
                  ดูดข้อมูลเก่าจาก Google Sheets ส่งตรงเข้า Supabase (1-Click Migrator)
                </h4>
                <p className="text-xs text-[#7a705a]">ไม่ต้องพิมพ์ใหม่ หรือนั่ง Import CSV ทีละไฟล์ สคริปต์จะโอนให้ทั้งหมด</p>
              </div>
            </div>
            <button
              onClick={() => onNavigateTab('migrator')}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#b45309] hover:bg-[#92400e] text-white text-xs font-semibold shadow-sm transition-colors shrink-0"
            >
              <FileCode2 className="w-3.5 h-3.5" />
              <span>ดูสคริปต์ Migrator.gs</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2 text-xs sm:text-sm text-[#4d4432] bg-[#fcfbfa] p-4 rounded-xl border border-[#ece4d0]">
            <p>1. เปิด Google Sheet เดิมของคุณ ไปที่เมนู <strong>ส่วนขยาย (Extensions) &gt; Apps Script</strong></p>
            <p>2. สร้างไฟล์สคริปต์ใหม่ตั้งชื่อว่า <code>MigrateToSupabase.gs</code> แล้ววางโค้ดจากแท็บ <em>สคริปต์ย้ายข้อมูล</em></p>
            <p>3. ใส่ <strong>Supabase URL</strong> และ <strong>service_role key</strong> ของโปรเจกต์คุณ</p>
            <p>4. เลือกฟังก์ชัน <code>migrateAllDataToSupabase</code> แล้วกด <strong>Run</strong> ระบบจะดูดประวัติทุกหมวด ข้อมูลรายรับรายจ่าย งบประมาณ และยอดออมเงิน ส่งเข้า Supabase อัตโนมัติ</p>
          </div>
        </div>

        {/* Step 4 */}
        <div className="p-5 sm:p-6 rounded-2xl bg-white border border-[#ded5c0] shadow-sm hover:border-[#3f6b52]/50 transition-colors">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#2563eb] text-white font-bold flex items-center justify-center shrink-0 shadow-sm">
                4
              </div>
              <div>
                <h4 className="font-bold text-base text-[#2c2618]">
                  Deploy เว็บขึ้น Vercel (ฟรีตลอดชีพ + โดเมน HTTPS)
                </h4>
                <p className="text-xs text-[#7a705a]">กระจายแคชทั่วโลก โหลดเสี้ยววินาที รองรับ PWA ติดตั้งลงมือถือได้เหมือนแอปแท้</p>
              </div>
            </div>
            <button
              onClick={() => onNavigateTab('vercel')}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-xs font-semibold shadow-sm transition-colors shrink-0"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>ดูขั้นตอน Deploy Vercel</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2 text-xs sm:text-sm text-[#4d4432] bg-[#fcfbfa] p-4 rounded-xl border border-[#ece4d0]">
            <p>1. นำโค้ดโปรเจกต์นี้ขึ้น GitHub (หรือดาวน์โหลด ZIP ผ่านเมนู Settings ของ AI Studio)</p>
            <p>2. เข้าไปที่ <strong>vercel.com</strong> กด <em>Add New... &gt; Project</em> แล้วเลือก Repository ที่เพิ่งอัปโหลด</p>
            <p>3. ใส่ Environment Variables: <code>VITE_SUPABASE_URL</code> และ <code>VITE_SUPABASE_ANON_KEY</code></p>
            <p>4. กดปุ่ม <strong>Deploy</strong> ภายในไม่ถึง 1 นาที เว็บแอปของคุณจะออนไลน์ทันที พร้อมลิงก์ <code>.vercel.app</code> ที่เปิดได้รวดเร็วทันใจ</p>
          </div>
        </div>
      </div>
    </div>
  );
};
