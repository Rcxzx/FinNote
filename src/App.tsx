import React, { useState } from 'react';
import { 
  Database, 
  Layers, 
  FileCode2, 
  Send, 
  Globe, 
  Sparkles, 
  Zap, 
  ShieldCheck, 
  Check, 
  Copy, 
  Download,
  Activity,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  FolderArchive,
  Github
} from 'lucide-react';

import { MigrationRoadmap } from './components/MigrationRoadmap';
import { SqlSchemaViewer } from './components/SqlSchemaViewer';
import { GasMigratorViewer } from './components/GasMigratorViewer';
import { SupabaseTester } from './components/SupabaseTester';
import { VercelGuide } from './components/VercelGuide';
import { GasFilesViewer } from './components/GasFilesViewer';
import { ProjectExportHub } from './components/ProjectExportHub';

type NavTab = 'roadmap' | 'export' | 'sql' | 'migrator' | 'tester' | 'vercel' | 'gas';

export default function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('export');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const tabs: { id: NavTab; label: string; icon: React.ElementType; badge?: string }[] = [
    { id: 'export', label: 'ดาวน์โหลดไฟล์ขึ้น GitHub', icon: FolderArchive, badge: 'โหลด ZIP' },
    { id: 'roadmap', label: 'แผนย้ายระบบ (Roadmap)', icon: Layers },
    { id: 'sql', label: 'SQL Schema (Supabase)', icon: Database, badge: '8 ตาราง' },
    { id: 'migrator', label: 'สคริปต์ย้ายข้อมูล (GAS)', icon: Send, badge: '1-Click' },
    { id: 'tester', label: 'ทดสอบเชื่อมต่อ (Live)', icon: Activity },
    { id: 'vercel', label: 'คู่มือ Deploy Vercel', icon: Globe },
    { id: 'gas', label: 'โค้ดเดิม 4 ไฟล์ (GAS)', icon: FileCode2 },
  ];

  return (
    <div className="min-h-screen bg-[#fcfbfa] text-[#2c2618] font-sans antialiased selection:bg-[#ecd9b3]">
      {/* Top Header */}
      <header className="sticky top-0 z-30 border-b border-[#e9e3d5] bg-[#fcfbfa]/90 backdrop-blur-md px-4 sm:px-8 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#3f6b52] text-white flex items-center justify-center font-bold text-lg shadow-sm">
            ฿
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-base sm:text-lg tracking-tight">FinNote Migration Hub</h1>
              <span className="px-2 py-0.5 text-[11px] font-semibold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                Supabase + Vercel
              </span>
            </div>
            <p className="text-xs text-[#7a705a] hidden sm:block">
              ศูนย์กลางการเปลี่ยนผ่านจาก Google Sheets สู่ PostgreSQL + Edge Web App ฟรีตลอดชีพ
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('export')}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all"
          >
            <FolderArchive className="w-3.5 h-3.5" />
            <span>ดาวน์โหลด ZIP ขึ้น GitHub</span>
          </button>
          <a
            href="https://supabase.com"
            target="_blank"
            rel="noreferrer"
            className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#ded5c0] bg-white text-xs font-semibold text-[#5c533f] hover:bg-[#f5f1e8] transition-colors"
          >
            <span>Supabase</span>
            <ExternalLink className="w-3 h-3" />
          </a>
          <a
            href="https://vercel.com"
            target="_blank"
            rel="noreferrer"
            className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#ded5c0] bg-white text-xs font-semibold text-[#5c533f] hover:bg-[#f5f1e8] transition-colors"
          >
            <span>Vercel</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </header>

      {/* Main Container */}
      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-6 space-y-6">
        {/* Navigation Bar */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-[#f1ecdf] border border-[#ded5c0] overflow-x-auto scrollbar-none">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium transition-all whitespace-nowrap shrink-0 ${
                  isActive
                    ? 'bg-white text-[#2c2618] font-bold shadow-sm'
                    : 'text-[#6c614b] hover:text-[#2c2618] hover:bg-white/50'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-[#3f6b52]' : 'text-[#8a8069]'}`} />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span
                    className={`px-1.5 py-0.2 rounded-md text-[10px] font-semibold ${
                      isActive
                        ? 'bg-[#e8f1ec] text-[#2c7a6b]'
                        : 'bg-[#e5dec9] text-[#7a705a]'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tab Content Display */}
        <main>
          {activeTab === 'export' && (
            <ProjectExportHub
              onCopyText={handleCopyText}
              copiedId={copiedId}
            />
          )}

          {activeTab === 'roadmap' && (
            <MigrationRoadmap
              onNavigateTab={(tab) => setActiveTab(tab)}
              onCopyText={handleCopyText}
              copiedId={copiedId}
            />
          )}

          {activeTab === 'sql' && (
            <SqlSchemaViewer
              onCopyText={handleCopyText}
              copiedId={copiedId}
            />
          )}

          {activeTab === 'migrator' && (
            <GasMigratorViewer
              onCopyText={handleCopyText}
              copiedId={copiedId}
            />
          )}

          {activeTab === 'tester' && (
            <SupabaseTester />
          )}

          {activeTab === 'vercel' && (
            <VercelGuide
              onCopyText={handleCopyText}
              copiedId={copiedId}
            />
          )}

          {activeTab === 'gas' && (
            <GasFilesViewer
              onCopyText={handleCopyText}
              copiedId={copiedId}
            />
          )}
        </main>
      </div>

      {/* Footer */}
      <footer className="mt-12 border-t border-[#e9e3d5] py-6 text-center text-xs text-[#8a8069]">
        <p>FinNote Migration Center · อัปเกรด Google Apps Script สู่ Supabase (PostgreSQL) + Vercel Deployment</p>
      </footer>
    </div>
  );
}
