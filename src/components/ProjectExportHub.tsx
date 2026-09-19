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
import { PROJECT_MANIFEST } from '../data/projectManifest';

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

      PROJECT_MANIFEST.forEach((file) => {
        zip.file(file.path, file.content);
      });

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const downloadUrl = URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = 'finnote-supabase-vercel-project.zip';
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
      {/* Download Hero Banner */}
      <div className="p-6 sm:p-7 rounded-2xl bg-gradient-to-br from-[#1e293b] via-[#0f172a] to-[#020617] text-white shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="max-w-2xl space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold border border-emerald-500/30">
              <FolderArchive className="w-3.5 h-3.5" />
              <span>Full Source Code Package ({PROJECT_MANIFEST.length} ไฟล์โครงสร้างครบถ้วน)</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
              ดาวน์โหลดโปรเจกต์ทั้งหมดเป็น .ZIP ใน 1 คลิก
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
              รวมทุกไฟล์ที่ต้องใช้อัปโหลดขึ้น GitHub หรือ Deploy บน Vercel ครบถ้วน 
              พร้อมไฟล์ <code>.npmrc</code> ป้องกัน Error peer dependency
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
                <span>กำลังบีบอัด ZIP...</span>
              </>
            ) : downloadSuccess ? (
              <>
                <CheckCircle2 className="w-5 h-5 text-slate-950" />
                <span>ดาวน์โหลดสำเร็จแล้ว!</span>
              </>
            ) : (
              <>
                <Download className="w-5 h-5" />
                <span>ดาวน์โหลด ZIP ทั้งโปรเจกต์ (1-Click)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* GitHub 3-Step Guide */}
      <div className="p-5 rounded-2xl bg-white border border-[#ded5c0] shadow-sm space-y-3">
        <div className="flex items-center gap-2 font-bold text-sm text-[#2c2618]">
          <Github className="w-4 h-4 text-[#2c2618]" />
          <span>ขั้นตอนการนำไฟล์ ZIP ขึ้น GitHub เพื่อต่อกับ Vercel (ง่ายมาก 2 นาที)</span>
        </div>
        <ol className="list-decimal list-inside text-xs sm:text-sm space-y-2 text-[#4d4432] leading-relaxed">
          <li>
            กดปุ่มสีเขียว <strong>"ดาวน์โหลด ZIP ทั้งโปรเจกต์"</strong> ด้านบน แล้วแตกไฟล์ (Extract ZIP) ในเครื่องของคุณ
          </li>
          <li>
            เปิดเว็บ <a href="https://github.com/new" target="_blank" rel="noreferrer" className="text-blue-600 underline font-semibold">github.com/new</a> แล้วกดสร้าง Repository ใหม่ (ตั้งชื่อเช่น <code>finnote-app</code>)
          </li>
          <li>
            ในหน้า Repository บน GitHub ให้คลิกลิงก์ <strong>"uploading an existing file"</strong>
          </li>
          <li>
            ลากไฟล์ทั้งหมดที่คุณเพิ่งแตกออกมา ไปวางในช่องอัปโหลดของ GitHub แล้วกดปุ่มเขียว <strong>"Commit changes"</strong>
          </li>
          <li>
            ไปที่ <a href="https://vercel.com/new" target="_blank" rel="noreferrer" className="text-blue-600 underline font-semibold">vercel.com/new</a> กด <strong>Import</strong> โปรเจกต์นี้ แล้วกด <strong>Deploy</strong> ได้ทันที!
          </li>
        </ol>
      </div>

      {/* File Explorer Table */}
      <div className="rounded-2xl border border-[#ded5c0] bg-white overflow-hidden shadow-sm">
        <div className="p-4 bg-[#fcfbfa] border-b border-[#ded5c0] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="font-bold text-sm text-[#2c2618] flex items-center gap-2">
              <FileCode className="w-4 h-4 text-[#3f6b52]" />
              <span>รายชื่อไฟล์ทั้งหมดที่อยู่ในโปรเจกต์ ({PROJECT_MANIFEST.length} รายการ)</span>
            </h3>
            <p className="text-[11px] text-[#7a705a]">สามารถดูโค้ด คัดลอก หรือดาวน์โหลดแยกทีละไฟล์ได้จากตารางด้านล่างนี้</p>
          </div>
        </div>

        <div className="divide-y divide-[#ece4d0] text-xs">
          {PROJECT_MANIFEST.map((file) => {
            const isExpanded = expandedFile === file.path;
            const lineCount = file.content.split('\n').length;
            const sizeKb = (new Blob([file.content]).size / 1024).toFixed(1);

            return (
              <div key={file.path} className="hover:bg-[#fdfcf9] transition-colors">
                <div className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-start sm:items-center gap-3">
                    <button
                      onClick={() => setExpandedFile(isExpanded ? null : file.path)}
                      className="text-[#7a705a] hover:text-[#2c2618] mt-0.5 sm:mt-0 cursor-pointer"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-[#2c2618]">{file.path}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#f1ecdf] text-[#6c614b] font-mono">
                          {sizeKb} KB · {lineCount} บรรทัด
                        </span>
                      </div>
                      <p className="text-[11px] text-[#7a705a] mt-0.5">{file.desc}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0">
                    <button
                      onClick={() => onCopyText(file.content, file.path)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#f1ecdf] hover:bg-[#ded5c0] text-[#2c2618] text-[11px] font-semibold transition-colors cursor-pointer"
                      title="คัดลอกโค้ดทั้งหมด"
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
                      title="ดาวน์โหลดไฟล์นี้เดี่ยวๆ"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>ดาวน์โหลด</span>
                    </button>
                  </div>
                </div>

                {/* Expanded Code Preview */}
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
