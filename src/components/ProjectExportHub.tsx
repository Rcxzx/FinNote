import React, { useState } from 'react';
import { 
  FolderArchive, 
  Download, 
  Check, 
  Copy, 
  FileCode, 
  CheckCircle2, 
  Github,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import JSZip from 'jszip';

interface ManifestFile {
  path: string;
  desc: string;
  content: string;
}

const DEFAULT_FILES: ManifestFile[] = [
  {
    path: '.npmrc',
    desc: 'ตั้งค่า npm บน Vercel ให้ bypass peer conflict',
    content: `legacy-peer-deps=true\n`
  },
  {
    path: 'vercel.json',
    desc: 'ตั้งค่า Routing บน Vercel ป้องกันหน้า 404',
    content: JSON.stringify({
      buildCommand: "npm run build",
      outputDirectory: "dist",
      framework: "vite",
      rewrites: [{ source: "/(.*)", destination: "/index.html" }]
    }, null, 2)
  },
  {
    path: '.env.example',
    desc: 'ตัวอย่างตัวแปร Environment สำหรับ Supabase',
    content: `VITE_SUPABASE_URL=https://your-project-id.supabase.co\nVITE_SUPABASE_ANON_KEY=your-anon-public-key\n`
  }
];

interface ProjectExportHubProps {
  onCopyText: (text: string, id: string) => void;
  copiedId: string | null;
}

export const ProjectExportHub: React.FC<ProjectExportHubProps> = ({
  onCopyText,
  copiedId,
}) => {
  const [isZipping, setIsZipping] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [expandedFile, setExpandedFile] = useState<string | null>(null);

  const handleDownloadAllZip = async () => {
    try {
      setIsZipping(true);
      const zip = new JSZip();

      DEFAULT_FILES.forEach((file) => {
        zip.file(file.path, file.content);
      });

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const downloadUrl = URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = 'finnote-config-files.zip';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);

      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3500);
    } catch (err) {
      console.error('Failed to create zip', err);
    } finally {
      setIsZipping(false);
    }
  };

  const handleDownloadSingleFile = (filename: string, content: string) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename.split('/').pop() || filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="p-6 sm:p-7 rounded-2xl bg-gradient-to-br from-[#1e293b] via-[#0f172a] to-[#020617] text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="max-w-2xl space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold border border-emerald-500/30">
              <FolderArchive className="w-3.5 h-3.5" />
              <span>Project Configuration Files</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
              ดาวน์โหลดไฟล์การตั้งค่าโปรเจกต์
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
              รวมไฟล์ <code>.npmrc</code> และ <code>vercel.json</code> ป้องกันข้อผิดพลาดตอน Deploy บน Vercel
            </p>
          </div>

          <button
            onClick={handleDownloadAllZip}
            disabled={isZipping}
            className="w-full md:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm shadow-lg transition-all transform active:scale-95 disabled:opacity-50 shrink-0 cursor-pointer"
          >
            {isZipping ? (
              <>
                <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                <span>กำลังเตรียมไฟล์...</span>
              </>
            ) : downloadSuccess ? (
              <>
                <CheckCircle2 className="w-5 h-5 text-slate-950" />
                <span>ดาวน์โหลดสำเร็จ!</span>
              </>
            ) : (
              <>
                <Download className="w-5 h-5" />
                <span>ดาวน์โหลด ZIP (Config Files)</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div className="p-5 rounded-2xl bg-white border border-[#ded5c0] shadow-sm space-y-3">
        <div className="flex items-center gap-2 font-bold text-sm text-[#2c2618]">
          <Github className="w-4 h-4 text-[#2c2618]" />
          <span>การนำไฟล์ขึ้น GitHub เพื่อเชื่อมต่อ Vercel</span>
        </div>
        <ol className="list-decimal list-inside text-xs sm:text-sm space-y-2 text-[#4d4432] leading-relaxed">
          <li>ตรวจสอบว่าไฟล์ <code>.npmrc</code> อยู่ที่โฟลเดอร์หลัก (Root) ของ Repository</li>
          <li>กำหนด Environment Variables <code>VITE_SUPABASE_URL</code> และ <code>VITE_SUPABASE_ANON_KEY</code> บน Vercel Settings</li>
          <li>Vercel จะ Build และ Deploy อัตโนมัติทุกครั้งที่ Commit ขึ้น GitHub</li>
        </ol>
      </div>

      <div className="rounded-2xl border border-[#ded5c0] bg-white overflow-hidden shadow-sm">
        <div className="p-4 bg-[#fcfbfa] border-b border-[#ded5c0]">
          <h3 className="font-bold text-sm text-[#2c2618] flex items-center gap-2">
            <FileCode className="w-4 h-4 text-[#3f6b52]" />
            <span>รายการไฟล์ Configuration ({DEFAULT_FILES.length} รายการ)</span>
          </h3>
        </div>

        <div className="divide-y divide-[#ece4d0] text-xs">
          {DEFAULT_FILES.map((file) => {
            const isExpanded = expandedFile === file.path;
            return (
              <div key={file.path} className="hover:bg-[#fdfcf9] transition-colors">
                <div className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setExpandedFile(isExpanded ? null : file.path)}
                      className="text-[#7a705a] hover:text-[#2c2618] cursor-pointer"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                    <div>
                      <span className="font-mono font-bold text-[#2c2618]">{file.path}</span>
                      <p className="text-[11px] text-[#7a705a] mt-0.5">{file.desc}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0">
                    <button
                      onClick={() => onCopyText(file.content, file.path)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#f1ecdf] hover:bg-[#ded5c0] text-[#2c2618] text-[11px] font-semibold transition-colors cursor-pointer"
                    >
                      {copiedId === file.path ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span>คัดลอกแล้ว</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>คัดลอก</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => handleDownloadSingleFile(file.path, file.content)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#f1ecdf] hover:bg-[#ded5c0] text-[#2c2618] text-[11px] font-semibold transition-colors cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>ดาวน์โหลด</span>
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="p-4 bg-[#1e293b] text-slate-100 border-t border-[#ded5c0] font-mono text-[11px] overflow-x-auto max-h-72 select-all leading-relaxed">
                    <pre>{file.content}</pre>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
