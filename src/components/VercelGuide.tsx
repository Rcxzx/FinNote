import React from 'react';
import { 
  Globe, 
  ExternalLink, 
  Terminal, 
  GitBranch, 
  ShieldCheck, 
  Check, 
  Copy,
  Zap,
  Layers,
  Sparkles
} from 'lucide-react';
import vercelJson from '../../vercel.json?raw';

interface VercelGuideProps {
  onCopyText: (text: string, id: string) => void;
  copiedId: string | null;
}

export const VercelGuide: React.FC<VercelGuideProps> = ({
  onCopyText,
  copiedId,
}) => {
  return (
    <div className="space-y-6">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white border border-[#ded5c0] shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#2563eb] text-white flex items-center justify-center shrink-0 shadow-sm">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-[#2c2618]">
              คู่มือการ Deploy ขึ้น Vercel (ฟรีตลอดชีพ)
            </h3>
            <p className="text-xs text-[#7a705a]">
              สถาปัตยกรรม Edge Network ให้ความเร็วระดับเสี้ยววินาที พร้อม SSL Certificate อัตโนมัติ
            </p>
          </div>
        </div>

        <a
          href="https://vercel.com/new"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-xs font-semibold shadow-sm transition-colors shrink-0"
        >
          <span>เปิด Vercel Dashboard</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      {/* 2 Ways to Deploy */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Method 1: Git-based */}
        <div className="p-5 rounded-2xl bg-white border border-[#ded5c0] shadow-sm space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#e8f1ec] text-[#2c7a6b] font-bold text-xs flex items-center justify-center">
              1
            </div>
            <h4 className="font-bold text-sm text-[#2c2618]">วิธีที่ 1: Deploy ผ่าน GitHub (แนะนำที่สุด)</h4>
          </div>
          <p className="text-xs text-[#5c533f] leading-relaxed">
            อัปเดตโค้ดอัตโนมัติทุกครั้งที่คุณ <code>git push</code>
          </p>
          <ol className="list-decimal list-inside text-xs space-y-2 text-[#4d4432]">
            <li>ดาวน์โหลดโปรเจกต์นี้ผ่านเมนู <strong>Export to GitHub</strong> หรือ <strong>Download ZIP</strong></li>
            <li>สร้าง Repository ใหม่บน <strong>GitHub.com</strong> แล้ว Push โค้ดขึ้นไป</li>
            <li>เข้าสู่ระบบที่ <strong>vercel.com</strong> เลือก <em>Add New &gt; Project</em></li>
            <li>เลือก Repository ของคุณ แล้วกด <strong>Import</strong></li>
            <li>
              ในหัวข้อ <strong>Environment Variables</strong> ให้เพิ่ม 2 ค่า:
              <div className="mt-1 p-2 bg-[#fcfbfa] border border-[#ece4d0] rounded-lg font-mono text-[11px] space-y-1">
                <div>VITE_SUPABASE_URL = <em>URL ของคุณ</em></div>
                <div>VITE_SUPABASE_ANON_KEY = <em>Key ของคุณ</em></div>
              </div>
            </li>
            <li>กดปุ่ม <strong>Deploy</strong> ใช้เวลาประมาณ 30 วินาที เว็บจะพร้อมใช้งานทันที</li>
          </ol>
        </div>

        {/* Method 2: Vercel CLI */}
        <div className="p-5 rounded-2xl bg-white border border-[#ded5c0] shadow-sm space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#eff6ff] text-[#2563eb] font-bold text-xs flex items-center justify-center">
              2
            </div>
            <h4 className="font-bold text-sm text-[#2c2618]">วิธีที่ 2: Deploy ด้วย Vercel CLI</h4>
          </div>
          <p className="text-xs text-[#5c533f] leading-relaxed">
            รันคำสั่งเพียง 1 บรรทัดจาก Terminal บนเครื่องคอมพิวเตอร์ของคุณ
          </p>
          <div className="p-3 bg-[#1e293b] rounded-xl text-slate-200 font-mono text-xs space-y-2">
            <div className="flex items-center justify-between text-slate-400 text-[10px]">
              <span>TERMINAL COMMANDS</span>
              <button
                onClick={() => onCopyText('npm i -g vercel && vercel', 'vercel-cli')}
                className="hover:text-white"
              >
                {copiedId === 'vercel-cli' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
            <div className="text-emerald-400"># 1. ติดตั้ง Vercel CLI</div>
            <div>npm i -g vercel</div>
            <div className="text-emerald-400"># 2. Deploy ขึ้นระบบทันที</div>
            <div>vercel --prod</div>
          </div>
          <p className="text-xs text-[#7a705a] leading-relaxed">
            ระบบจะถามชื่อโปรเจกต์และเชื่อมโยงบัญชีให้โดยอัตโนมัติ
          </p>
        </div>
      </div>

      {/* vercel.json configuration */}
      <div className="rounded-2xl border border-[#ded5c0] bg-white p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-[#3f6b52]" />
            <h4 className="font-bold text-sm text-[#2c2618]">ไฟล์ตั้งค่าการ Routing (vercel.json)</h4>
          </div>
          <button
            onClick={() => onCopyText(vercelJson, 'vercel-json')}
            className="inline-flex items-center gap-1 text-xs font-semibold text-[#3f6b52] hover:text-[#345944]"
          >
            {copiedId === 'vercel-json' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedId === 'vercel-json' ? 'คัดลอกแล้ว' : 'คัดลอก'}</span>
          </button>
        </div>
        <p className="text-xs text-[#7a705a]">
          ระบบได้สร้างไฟล์ <code>vercel.json</code> ที่ต้นโปรเจกต์ไว้ให้เรียบร้อยแล้ว เพื่อให้การรีเฟรชหน้าบน SPA ไม่เกิด Error 404
        </p>
        <div className="rounded-xl bg-[#1e293b] p-3 text-xs font-mono text-slate-100 overflow-x-auto">
          <code>{vercelJson}</code>
        </div>
      </div>
    </div>
  );
};
