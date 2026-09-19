import React, { useState } from 'react';
import { 
  Database, 
  Copy, 
  Check, 
  Download, 
  ShieldCheck, 
  Table2, 
  Layers, 
  Zap,
  Info
} from 'lucide-react';
import schemaSql from '../../supabase/schema.sql?raw';

interface SqlSchemaViewerProps {
  onCopyText: (text: string, id: string) => void;
  copiedId: string | null;
}

export const SqlSchemaViewer: React.FC<SqlSchemaViewerProps> = ({
  onCopyText,
  copiedId,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'code' | 'tables'>('code');

  const tables = [
    {
      name: 'profiles',
      desc: 'ข้อมูลโปรไฟล์ผู้ใช้ ผูกกับ auth.users ของ Supabase โดยตรง เมื่อสมัครสมาชิกข้อมูลจะถูกสร้างทันทีผ่าน Trigger',
      rows: 'id, email, display_name, avatar_url, created_at, updated_at',
    },
    {
      name: 'categories',
      desc: 'หมวดหมู่รายรับและรายจ่าย พร้อมไอคอน สี และลำดับการจัดเรียง',
      rows: 'id, user_id, type (income/expense), name, icon, color, sort_order',
    },
    {
      name: 'transactions',
      desc: 'รายการบันทึกรายรับ-รายจ่าย รองรับการจัดหมวดหมู่ วันที่ และบันทึกเพิ่มเติม',
      rows: 'id, user_id, type, amount, category, note, date, source, recurring_id',
    },
    {
      name: 'budgets',
      desc: 'งบประมาณการใช้จ่าย (รายวัน/รายสัปดาห์/รายเดือน/รายปี) รองรับงบรวมและงบเฉพาะหมวด',
      rows: 'id, user_id, period, amount, category, start_date, sort_order',
    },
    {
      name: 'recurring',
      desc: 'รายการประจำที่ทำงานซ้ำอัตโนมัติตามรอบเวลา',
      rows: 'id, user_id, type, amount, category, frequency, next_run_date, active',
    },
    {
      name: 'savings_goals',
      desc: 'เป้าหมายการออมเงิน ยอดเป้าหมาย สถานะการเก็บออม',
      rows: 'id, user_id, name, icon, target_amount, note, archived',
    },
    {
      name: 'savings_logs',
      desc: 'ประวัติการฝากเงินหรือถอนเงินออกจากเป้าหมายการออม',
      rows: 'id, user_id, savings_goal_id, direction (deposit/withdraw), amount, note, date',
    },
    {
      name: 'settings',
      desc: 'การตั้งค่าผู้ใช้ เช่น โหมดมืด, เกณฑ์เตือนงบประมาณ, เวลาแจ้งเตือน',
      rows: 'user_id, dark_mode, email_notifications, reminder_time, budget_alert_threshold',
    },
  ];

  const handleDownload = () => {
    const blob = new Blob([schemaSql], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'supabase_schema.sql';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white border border-[#ded5c0] shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#3f6b52] text-white flex items-center justify-center shrink-0 shadow-sm">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-[#2c2618]">
              Supabase PostgreSQL Schema (8 ตาราง + RLS)
            </h3>
            <p className="text-xs text-[#7a705a]">
              สคริปต์ DDL พร้อมรันใน Supabase Dashboard &gt; SQL Editor เพื่อสร้างโครงสร้างฐานข้อมูลทันที
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => onCopyText(schemaSql, 'supabase-schema')}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-[#3f6b52] hover:bg-[#345944] text-white text-xs font-semibold shadow-sm transition-colors"
          >
            {copiedId === 'supabase-schema' ? (
              <>
                <Check className="w-4 h-4" />
                <span>คัดลอก SQL แล้ว!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>คัดลอก SQL ทั้งหมด</span>
              </>
            )}
          </button>
          <button
            onClick={handleDownload}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#f1ecdf] hover:bg-[#ded5c0] text-[#2c2618] text-xs font-semibold transition-colors"
            title="ดาวน์โหลดไฟล์ .sql"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">ดาวน์โหลด .sql</span>
          </button>
        </div>
      </div>

      {/* Feature Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-xl bg-[#f5f8f6] border border-[#d2e5d9] flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-[#2c7a6b] shrink-0 mt-0.5" />
          <div>
            <strong className="text-xs font-bold text-[#1f564b] block mb-0.5">Row Level Security (RLS)</strong>
            <span className="text-xs text-[#4d7265] leading-relaxed">
              ผู้ใช้แต่ละคนมองเห็นและจัดการได้เฉพาะข้อมูลของตัวเอง ป้องกันข้อมูลรั่วไหล 100%
            </span>
          </div>
        </div>
        <div className="p-4 rounded-xl bg-[#fbf8f0] border border-[#eddcb5] flex items-start gap-3">
          <Zap className="w-5 h-5 text-[#b45309] shrink-0 mt-0.5" />
          <div>
            <strong className="text-xs font-bold text-[#78350f] block mb-0.5">B-Tree Indexes</strong>
            <span className="text-xs text-[#92400e] leading-relaxed">
              ทำดัชนีคอลัมน์สำคัญ (user_id, date, category) ค้นหาและคำนวณยอดได้เร็วหลักมิลลิวินาที
            </span>
          </div>
        </div>
        <div className="p-4 rounded-xl bg-[#f4f7fb] border border-[#d6e2f1] flex items-start gap-3">
          <Layers className="w-5 h-5 text-[#2563eb] shrink-0 mt-0.5" />
          <div>
            <strong className="text-xs font-bold text-[#1e40af] block mb-0.5">Cascade Deletion</strong>
            <span className="text-xs text-[#3b82f6] leading-relaxed">
              เมื่อลบเป้าหมายการออม ระบบจะจัดการบันทึกลูกที่เกี่ยวข้องให้อัตโนมัติ ป้องกันข้อมูลกำพร้า
            </span>
          </div>
        </div>
      </div>

      {/* Sub tabs: Code vs Table Breakdown */}
      <div className="flex border-b border-[#ded5c0] gap-4">
        <button
          onClick={() => setActiveSubTab('code')}
          className={`pb-2.5 text-xs font-bold border-b-2 transition-colors ${
            activeSubTab === 'code'
              ? 'border-[#3f6b52] text-[#3f6b52]'
              : 'border-transparent text-[#7a705a] hover:text-[#2c2618]'
          }`}
        >
          โค้ดคำสั่ง SQL (schema.sql)
        </button>
        <button
          onClick={() => setActiveSubTab('tables')}
          className={`pb-2.5 text-xs font-bold border-b-2 transition-colors ${
            activeSubTab === 'tables'
              ? 'border-[#3f6b52] text-[#3f6b52]'
              : 'border-transparent text-[#7a705a] hover:text-[#2c2618]'
          }`}
        >
          สรุปโครงสร้างทั้ง 8 ตาราง
        </button>
      </div>

      {activeSubTab === 'code' ? (
        <div className="rounded-2xl border border-[#ded5c0] bg-[#1e293b] text-slate-100 overflow-hidden shadow-sm">
          <div className="px-4 py-2.5 bg-slate-900/80 border-b border-slate-700/80 flex items-center justify-between text-xs text-slate-400">
            <span className="font-mono">supabase/schema.sql ({schemaSql.split('\n').length} lines)</span>
            <button
              onClick={() => onCopyText(schemaSql, 'supabase-schema-inner')}
              className="flex items-center gap-1 text-slate-300 hover:text-white"
            >
              {copiedId === 'supabase-schema-inner' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedId === 'supabase-schema-inner' ? 'คัดลอกแล้ว' : 'คัดลอก'}</span>
            </button>
          </div>
          <pre className="p-4 text-xs font-mono overflow-x-auto leading-relaxed max-h-[500px] select-all">
            <code>{schemaSql}</code>
          </pre>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {tables.map((t) => (
            <div key={t.name} className="p-4 rounded-xl bg-white border border-[#ded5c0] shadow-sm">
              <div className="flex items-center gap-2 mb-1.5">
                <Table2 className="w-4 h-4 text-[#3f6b52]" />
                <span className="font-mono font-bold text-sm text-[#2c2618]">{t.name}</span>
              </div>
              <p className="text-xs text-[#5c533f] mb-2 leading-relaxed">{t.desc}</p>
              <div className="bg-[#fcfbfa] p-2 rounded-lg border border-[#ece4d0] font-mono text-[11px] text-[#7a705a] break-all">
                {t.rows}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
