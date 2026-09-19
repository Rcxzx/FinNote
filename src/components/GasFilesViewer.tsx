import React, { useState } from 'react';
import { 
  FileCode2, 
  FileText, 
  Palette, 
  Braces, 
  Copy, 
  Check, 
  Download, 
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

import codeGs from '../../gas/Code.gs?raw';
import indexHtml from '../../gas/Index.html?raw';
import cssHtml from '../../gas/CSS.html?raw';
import jsHtml from '../../gas/JS.html?raw';

interface GasFilesViewerProps {
  onCopyText: (text: string, id: string) => void;
  copiedId: string | null;
}

export const GasFilesViewer: React.FC<GasFilesViewerProps> = ({
  onCopyText,
  copiedId,
}) => {
  const [selectedFileId, setSelectedFileId] = useState<string>('Code.gs');

  const files = [
    {
      id: 'Code.gs',
      name: 'Code.gs',
      icon: FileCode2,
      description: 'สคริปต์แบ็กเอนด์ Google Apps Script (ปรับปรุง In-memory Cache, รอบงบประมาณ, แก้บัค Overwrite แล้ว)',
      content: codeGs,
      lines: codeGs.split('\n').length,
      sizeKb: (new Blob([codeGs]).size / 1024).toFixed(1),
    },
    {
      id: 'Index.html',
      name: 'Index.html',
      icon: FileText,
      description: 'โครงสร้างหน้าจอหลัก HTML, โมดอลตั้งงบประมาณ, ระบบการจัดแท็บ และกล่องเตือนความเสี่ยง',
      content: indexHtml,
      lines: indexHtml.split('\n').length,
      sizeKb: (new Blob([indexHtml]).size / 1024).toFixed(1),
    },
    {
      id: 'CSS.html',
      name: 'CSS.html',
      icon: Palette,
      description: 'สไตล์ชีตหลัก ธีมกระดาษสมุดจด (Journal / Warm Tone), Dark Mode, ระบบ Responsive',
      content: cssHtml,
      lines: cssHtml.split('\n').length,
      sizeKb: (new Blob([cssHtml]).size / 1024).toFixed(1),
    },
    {
      id: 'JS.html',
      name: 'JS.html',
      icon: Braces,
      description: 'สคริปต์ฝั่งไคลเอนต์ (แก้ไข ReferenceError parseDate, ปรับปรุงเปิด/ปิด Modal, ซิงค์หมวดหมู่)',
      content: jsHtml,
      lines: jsHtml.split('\n').length,
      sizeKb: (new Blob([jsHtml]).size / 1024).toFixed(1),
    },
  ];

  const currentFile = files.find((f) => f.id === selectedFileId) || files[0];

  const handleDownload = (filename: string, content: string) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadAll = () => {
    files.forEach((f) => handleDownload(f.name, f.content));
  };

  return (
    <div className="space-y-6">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white border border-[#ded5c0] shadow-sm">
        <div>
          <h3 className="font-bold text-lg text-[#2c2618]">
            ไฟล์ชุดต้นฉบับ Google Apps Script (ฉบับปรับปรุงเสร็จสมบูรณ์)
          </h3>
          <p className="text-xs text-[#7a705a]">
            ชุดโค้ด 4 ไฟล์นี้ได้รับการแก้ไขบัคงบประมาณ การแบ่งรอบวันที่ และ In-memory cache ครบถ้วนแล้ว
          </p>
        </div>

        <button
          onClick={handleDownloadAll}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#3f6b52] hover:bg-[#345944] text-white text-xs font-semibold shadow-sm transition-colors shrink-0"
        >
          <Download className="w-4 h-4" />
          <span>ดาวน์โหลดครบทั้ง 4 ไฟล์</span>
        </button>
      </div>

      {/* File Selector Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {files.map((file) => {
          const Icon = file.icon;
          const isSelected = file.id === selectedFileId;
          return (
            <button
              key={file.id}
              onClick={() => setSelectedFileId(file.id)}
              className={`p-3.5 rounded-xl text-left border transition-all ${
                isSelected
                  ? 'bg-white border-[#3f6b52] shadow-sm ring-1 ring-[#3f6b52]'
                  : 'bg-[#fcfbfa] border-[#ded5c0] hover:bg-white hover:border-[#b8ad94]'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <Icon className={`w-4 h-4 ${isSelected ? 'text-[#3f6b52]' : 'text-[#7a705a]'}`} />
                <span className="text-[10px] text-[#8a8069]">{file.sizeKb} KB</span>
              </div>
              <div className="font-mono font-bold text-xs text-[#2c2618] truncate mb-0.5">{file.name}</div>
              <div className="text-[10px] text-[#7a705a]">{file.lines.toLocaleString()} บรรทัด</div>
            </button>
          );
        })}
      </div>

      {/* Selected File Details & Editor */}
      <div className="rounded-2xl border border-[#ded5c0] bg-[#1e293b] text-slate-100 overflow-hidden shadow-sm">
        <div className="px-4 py-3 bg-slate-900/80 border-b border-slate-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-white">{currentFile.name}</span>
            <span className="text-slate-400">({currentFile.lines} lines, {currentFile.sizeKb} KB)</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onCopyText(currentFile.content, currentFile.id)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs transition-colors"
            >
              {copiedId === currentFile.id ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>คัดลอกแล้ว</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>คัดลอกโค้ด</span>
                </>
              )}
            </button>
            <button
              onClick={() => handleDownload(currentFile.name, currentFile.content)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>ดาวน์โหลด</span>
            </button>
          </div>
        </div>

        <div className="px-4 py-2 bg-slate-800/40 text-slate-300 text-xs border-b border-slate-700/50">
          {currentFile.description}
        </div>

        <pre className="p-4 text-xs font-mono overflow-x-auto leading-relaxed max-h-[520px] select-all">
          <code>{currentFile.content}</code>
        </pre>
      </div>
    </div>
  );
};
