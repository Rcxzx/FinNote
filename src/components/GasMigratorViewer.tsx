import React from 'react';
import { 
  FileCode2, 
  Copy, 
  Check, 
  Download, 
  PlayCircle, 
  AlertCircle, 
  Key, 
  CheckCircle2,
  ExternalLink
} from 'lucide-react';
import migratorGs from '../../gas/MigrateToSupabase.gs?raw';

interface GasMigratorViewerProps {
  onCopyText: (text: string, id: string) => void;
  copiedId: string | null;
}

export const GasMigratorViewer: React.FC<GasMigratorViewerProps> = ({
  onCopyText,
  copiedId,
}) => {
  const handleDownload = () => {
    const blob = new Blob([migratorGs], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'MigrateToSupabase.gs';
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
          <div className="w-10 h-10 rounded-xl bg-[#b45309] text-white flex items-center justify-center shrink-0 shadow-sm">
            <FileCode2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-[#2c2618]">
              สคริปต์ดูดข้อมูลอัตโนมัติ (Google Sheets ➡️ Supabase Migrator)
            </h3>
            <p className="text-xs text-[#7a705a]">
              คัดลอกไฟล์นี้ไปวางใน Apps Script แล้วกด Run ระบบจะดูดประวัติเก่าส่งเข้า Supabase ในคลิกเดียว
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => onCopyText(migratorGs, 'gas-migrator')}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-[#b45309] hover:bg-[#92400e] text-white text-xs font-semibold shadow-sm transition-colors"
          >
            {copiedId === 'gas-migrator' ? (
              <>
                <Check className="w-4 h-4" />
                <span>คัดลอกโค้ดแล้ว!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>คัดลอกโค้ด Migrator.gs</span>
              </>
            )}
          </button>
          <button
            onClick={handleDownload}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#f1ecdf] hover:bg-[#ded5c0] text-[#2c2618] text-xs font-semibold transition-colors"
            title="ดาวน์โหลดไฟล์ .gs"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">ดาวน์โหลด .gs</span>
          </button>
        </div>
      </div>

      {/* Guide Steps */}
      <div className="p-5 rounded-2xl bg-[#fffbeb] border border-[#fef3c7] text-[#92400e] space-y-4">
        <div className="flex items-center gap-2 font-bold text-sm text-[#78350f]">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>กรณีไม่มี User UUID ใน Supabase หรือยังไม่เคยสร้างบัญชี (ทำได้ 2 วิธีง่ายๆ)</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="p-3.5 bg-white rounded-xl border border-[#fde68a] space-y-1.5">
            <strong className="text-emerald-800 font-bold block flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              วิธีที่ 1 (อัตโนมัติ 100%): ให้สคริปต์สร้างให้
            </strong>
            <p className="text-[#78350f] leading-relaxed">
              ในไฟล์ <code>MigrateToSupabase.gs</code> เพียงแค่กรอก <code>userEmail: 'อีเมลของคุณ@gmail.com'</code> สคริปต์รุ่นใหม่จะ<strong>สร้าง User ให้คุณใน Supabase อัตโนมัติทันที</strong> พร้อมเปิดใช้งานบัญชีให้โดยไม่ต้องยืนยันอีเมล และดึง UUID มาผูกข้อมูลให้เองเลย!
            </p>
          </div>

          <div className="p-3.5 bg-white rounded-xl border border-[#fde68a] space-y-1.5">
            <strong className="text-blue-800 font-bold block flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-blue-600" />
              วิธีที่ 2 (ทำผ่าน Dashboard): กด Add user
            </strong>
            <p className="text-[#78350f] leading-relaxed">
              ไปที่ <strong>Supabase Dashboard &gt; Authentication &gt; Users</strong> แล้วกดปุ่ม <strong>"Add user" &gt; "Create user"</strong> กรอกอีเมลและรหัสผ่าน เมื่อสร้างเสร็จจะเห็นช่อง <strong>User UID</strong> ให้กดไอคอน Copy นำมาใส่ในสคริปต์ได้ทันที
            </p>
          </div>
        </div>

        <div className="pt-2 border-t border-[#fde68a]/70">
          <div className="font-bold text-xs text-[#78350f] mb-2">ขั้นตอนการรัน Migration:</div>
          <ol className="list-decimal list-inside text-xs space-y-1.5 text-[#854d0e] leading-relaxed">
            <li>เปิด Google Sheet เดิมของคุณ แล้วไปที่เมนู <strong>ส่วนขยาย (Extensions) &gt; Apps Script</strong></li>
            <li>กดเครื่องหมาย <strong>+</strong> ข้างซ้าย เลือก <strong>Script</strong> ตั้งชื่อว่า <code>MigrateToSupabase.gs</code></li>
            <li>วางโค้ดสคริปต์นี้ลงไปทั้งหมด</li>
            <li>
              แก้ไขตัวแปรบรรทัดบนสุด:
              <ul className="list-disc list-inside ml-4 mt-1 space-y-0.5 text-xs text-[#713f12]">
                <li><code>supabaseUrl</code>: นำมาจาก Supabase Dashboard &gt; Project Settings &gt; API</li>
                <li><code>supabaseServiceRoleKey</code>: นำมาจากหัวข้อ <em>service_role key (secret)</em></li>
                <li><code>userEmail</code>: ใส่อีเมลของคุณ (ระบบจะสร้างหรือดึง UUID ให้อัตโนมัติ) หรือใส่ <code>targetUserUuid</code> หากมีอยู่แล้ว</li>
              </ul>
            </li>
            <li>เลือกฟังก์ชัน <strong>testSupabaseConnection</strong> แล้วกด Run เพื่อทดสอบว่าเชื่อมต่อได้จริง</li>
            <li>เลือกฟังก์ชัน <strong>migrateAllDataToSupabase</strong> แล้วกด Run ข้อมูลทุกตารางจะถูกโอนย้ายทันที!</li>
          </ol>
        </div>
      </div>

      {/* Code Display */}
      <div className="rounded-2xl border border-[#ded5c0] bg-[#1e293b] text-slate-100 overflow-hidden shadow-sm">
        <div className="px-4 py-2.5 bg-slate-900/80 border-b border-slate-700/80 flex items-center justify-between text-xs text-slate-400">
          <span className="font-mono">gas/MigrateToSupabase.gs ({migratorGs.split('\n').length} lines)</span>
          <button
            onClick={() => onCopyText(migratorGs, 'gas-migrator-inner')}
            className="flex items-center gap-1 text-slate-300 hover:text-white"
          >
            {copiedId === 'gas-migrator-inner' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedId === 'gas-migrator-inner' ? 'คัดลอกแล้ว' : 'คัดลอก'}</span>
          </button>
        </div>
        <pre className="p-4 text-xs font-mono overflow-x-auto leading-relaxed max-h-[500px] select-all">
          <code>{migratorGs}</code>
        </pre>
      </div>
    </div>
  );
};
