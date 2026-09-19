import React, { useState } from 'react';
import { 
  User, 
  Settings as SettingsIcon, 
  Bell, 
  Palette, 
  Download, 
  Database, 
  Plus, 
  Trash2,
  Check
} from 'lucide-react';
import { UserProfile, AppSettings, CategoryItem } from '../../types/finnote';

interface SettingsViewProps {
  user: UserProfile;
  settings: AppSettings;
  categories: { expense: CategoryItem[]; income: CategoryItem[] };
  onUpdateProfile: (name: string) => void;
  onUpdateSettings: (settings: AppSettings) => void;
  onAddCategory: (cat: CategoryItem) => void;
  onDeleteCategory: (id: string) => void;
  onExportCsv: () => void;
  onOpenMigrationHub: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  user,
  settings,
  categories,
  onUpdateProfile,
  onUpdateSettings,
  onAddCategory,
  onDeleteCategory,
  onExportCsv,
  onOpenMigrationHub,
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'categories' | 'notifications' | 'export'>('profile');
  const [displayName, setDisplayName] = useState(user.displayName || '');
  const [catType, setCatType] = useState<'expense' | 'income'>('expense');
  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState('#3f6b52');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) return;
    onUpdateProfile(displayName.trim());
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    onAddCategory({
      categoryId: 'cat_' + Date.now(),
      type: catType,
      name: newCatName.trim(),
      icon: 'tag',
      color: newCatColor,
      sortOrder: (categories[catType] || []).length,
    });
    setNewCatName('');
  };

  const currentCategories = categories[catType] || [];

  return (
    <div className="rounded-3xl border border-[#ddceac] dark:border-[#4a3f2c] bg-[#fffefa] dark:bg-[#1e1811] overflow-hidden shadow-sm grid grid-cols-1 md:grid-cols-12">
      {/* Left Navigation Rail */}
      <div className="md:col-span-4 p-4 sm:p-5 bg-[#fbf7ee] dark:bg-[#16120c] border-b md:border-b-0 md:border-r border-[#ddceac] dark:border-[#4a3f2c] space-y-2">
        <button
          onClick={() => setActiveTab('profile')}
          className={`w-full p-3 rounded-2xl text-xs font-bold text-left flex items-center gap-3 transition-colors cursor-pointer ${
            activeTab === 'profile' ? 'bg-[#3f6b52] text-white shadow-sm' : 'text-[#7c7057] dark:text-[#b8ac8e] hover:bg-[#ece1c4]/50'
          }`}
        >
          <User className="w-4 h-4" />
          <span>ข้อมูลโปรไฟล์</span>
        </button>

        <button
          onClick={() => setActiveTab('categories')}
          className={`w-full p-3 rounded-2xl text-xs font-bold text-left flex items-center gap-3 transition-colors cursor-pointer ${
            activeTab === 'categories' ? 'bg-[#3f6b52] text-white shadow-sm' : 'text-[#7c7057] dark:text-[#b8ac8e] hover:bg-[#ece1c4]/50'
          }`}
        >
          <Palette className="w-4 h-4" />
          <span>จัดการหมวดหมู่</span>
        </button>

        <button
          onClick={() => setActiveTab('notifications')}
          className={`w-full p-3 rounded-2xl text-xs font-bold text-left flex items-center gap-3 transition-colors cursor-pointer ${
            activeTab === 'notifications' ? 'bg-[#3f6b52] text-white shadow-sm' : 'text-[#7c7057] dark:text-[#b8ac8e] hover:bg-[#ece1c4]/50'
          }`}
        >
          <Bell className="w-4 h-4" />
          <span>การแจ้งเตือน & ระบบ</span>
        </button>

        <button
          onClick={() => setActiveTab('export')}
          className={`w-full p-3 rounded-2xl text-xs font-bold text-left flex items-center gap-3 transition-colors cursor-pointer ${
            activeTab === 'export' ? 'bg-[#3f6b52] text-white shadow-sm' : 'text-[#7c7057] dark:text-[#b8ac8e] hover:bg-[#ece1c4]/50'
          }`}
        >
          <Download className="w-4 h-4" />
          <span>ส่งออกข้อมูล (CSV)</span>
        </button>

        <div className="pt-4 border-t border-[#ddceac]/60 dark:border-[#4a3f2c]">
          <button
            onClick={onOpenMigrationHub}
            className="w-full p-3 rounded-2xl text-xs font-bold text-left flex items-center gap-3 bg-[#a97a24]/15 text-[#a97a24] dark:text-[#dbb06c] hover:bg-[#a97a24]/25 transition-colors cursor-pointer"
          >
            <Database className="w-4 h-4" />
            <span>เครื่องมือย้ายระบบ (Migration Hub)</span>
          </button>
        </div>
      </div>

      {/* Right Content Area */}
      <div className="md:col-span-8 p-6 sm:p-7">
        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="space-y-5 max-w-md">
            <div>
              <h3 className="font-display font-bold text-lg text-[#2c2618] dark:text-[#f5eedd]">ข้อมูลโปรไฟล์</h3>
              <p className="text-xs text-[#7c7057] dark:text-[#b8ac8e]">แก้ไขชื่อบัญชีและอีเมลที่ใช้งาน</p>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
              <div>
                <label className="block text-[#7c7057] dark:text-[#b8ac8e] font-bold mb-1">อีเมลบัญชีผู้ใช้</label>
                <input
                  type="text"
                  disabled
                  value={user.email}
                  className="w-full p-2.5 rounded-xl bg-[#ece1c4]/40 dark:bg-[#362d1f]/40 border border-[#ddceac] dark:border-[#4a3f2c] text-[#7c7057] cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-[#7c7057] dark:text-[#b8ac8e] font-bold mb-1">ชื่อที่แสดง</label>
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-[#fbf7ee] dark:bg-[#2a2216] border border-[#ddceac] dark:border-[#4a3f2c] focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="py-2.5 px-6 rounded-xl bg-[#3f6b52] hover:bg-[#2c4c3a] text-white font-bold inline-flex items-center gap-2 cursor-pointer shadow-sm"
              >
                {savedSuccess ? <Check className="w-4 h-4" /> : null}
                <span>{savedSuccess ? 'บันทึกสำเร็จ!' : 'บันทึกข้อมูล'}</span>
              </button>
            </form>
          </div>
        )}

        {/* Categories Tab */}
        {activeTab === 'categories' && (
          <div className="space-y-5">
            <div>
              <h3 className="font-display font-bold text-lg text-[#2c2618] dark:text-[#f5eedd]">จัดการหมวดหมู่</h3>
              <p className="text-xs text-[#7c7057] dark:text-[#b8ac8e]">เพิ่มหรือปรับแต่งหมวดหมู่สำหรับรายรับและรายจ่าย</p>
            </div>

            {/* Type Switcher */}
            <div className="flex gap-2 p-1 rounded-xl bg-[#fbf7ee] dark:bg-[#2a2216] border border-[#ddceac] dark:border-[#4a3f2c] w-fit text-xs">
              <button
                onClick={() => setCatType('expense')}
                className={`px-4 py-1.5 rounded-lg font-bold cursor-pointer ${
                  catType === 'expense' ? 'bg-[#a03f2c] text-white shadow-sm' : 'text-[#7c7057] dark:text-[#b8ac8e]'
                }`}
              >
                หมวดหมู่รายจ่าย
              </button>
              <button
                onClick={() => setCatType('income')}
                className={`px-4 py-1.5 rounded-lg font-bold cursor-pointer ${
                  catType === 'income' ? 'bg-[#3f6b52] text-white shadow-sm' : 'text-[#7c7057] dark:text-[#b8ac8e]'
                }`}
              >
                หมวดหมู่รายรับ
              </button>
            </div>

            {/* Add Category Form */}
            <form onSubmit={handleAddCategory} className="flex gap-2 items-center text-xs">
              <input
                type="text"
                required
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                placeholder="ชื่อหมวดหมู่ใหม่..."
                className="flex-1 p-2.5 rounded-xl bg-[#fbf7ee] dark:bg-[#2a2216] border border-[#ddceac] dark:border-[#4a3f2c] focus:outline-none"
              />
              <input
                type="color"
                value={newCatColor}
                onChange={(e) => setNewCatColor(e.target.value)}
                className="w-10 h-10 rounded-xl border border-[#ddceac] cursor-pointer"
              />
              <button
                type="submit"
                className="py-2.5 px-4 rounded-xl bg-[#3f6b52] hover:bg-[#2c4c3a] text-white font-bold flex items-center gap-1.5 cursor-pointer shadow-sm shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>เพิ่ม</span>
              </button>
            </form>

            {/* Category List */}
            <div className="divide-y divide-[#ece1c4]/60 dark:divide-[#362d1f] border border-[#ddceac] dark:border-[#4a3f2c] rounded-2xl overflow-hidden bg-[#fbf7ee]/40 dark:bg-[#2a2216]/40">
              {currentCategories.map((c) => (
                <div key={c.categoryId} className="p-3 px-4 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <span className="w-3.5 h-3.5 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                    <span className="font-bold text-[#2c2618] dark:text-[#f5eedd]">{c.name}</span>
                  </div>
                  {c.name !== 'อื่นๆ' && (
                    <button
                      onClick={() => onDeleteCategory(c.categoryId)}
                      className="p-1 rounded-lg hover:bg-[#a03f2c]/20 text-[#a03f2c] dark:text-[#e0916f] transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Notifications & System Tab */}
        {activeTab === 'notifications' && (
          <div className="space-y-5 max-w-md">
            <div>
              <h3 className="font-display font-bold text-lg text-[#2c2618] dark:text-[#f5eedd]">การแจ้งเตือน & เวลา</h3>
              <p className="text-xs text-[#7c7057] dark:text-[#b8ac8e]">ตั้งค่าเวลาแจ้งเตือนรายวันและงบประมาณ</p>
            </div>

            <div className="space-y-4 text-xs">
              <label className="p-3.5 rounded-2xl bg-[#fbf7ee] dark:bg-[#2a2216] border border-[#ddceac] dark:border-[#4a3f2c] flex items-center justify-between cursor-pointer">
                <div>
                  <p className="font-bold text-[#2c2618] dark:text-[#f5eedd]">การแจ้งเตือนทางอีเมล</p>
                  <p className="text-[11px] text-[#7c7057] dark:text-[#b8ac8e]">เตือนให้บันทึกรายวันและแจ้งเตือนใกล้งบเต็ม</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.emailNotifications}
                  onChange={(e) => onUpdateSettings({ ...settings, emailNotifications: e.target.checked })}
                  className="w-4 h-4 text-[#3f6b52] rounded focus:ring-0 cursor-pointer"
                />
              </label>

              <div>
                <label className="block text-[#7c7057] dark:text-[#b8ac8e] font-bold mb-1">เวลาเตือนประจำวัน</label>
                <input
                  type="time"
                  value={settings.reminderTime || '20:00'}
                  onChange={(e) => onUpdateSettings({ ...settings, reminderTime: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-[#fbf7ee] dark:bg-[#2a2216] border border-[#ddceac] dark:border-[#4a3f2c] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[#7c7057] dark:text-[#b8ac8e] font-bold mb-1">เกณฑ์แจ้งเตือนงบใกล้เต็ม</label>
                <select
                  value={settings.budgetAlertThreshold || 0.8}
                  onChange={(e) => onUpdateSettings({ ...settings, budgetAlertThreshold: Number(e.target.value) })}
                  className="w-full p-2.5 rounded-xl bg-[#fbf7ee] dark:bg-[#2a2216] border border-[#ddceac] dark:border-[#4a3f2c] focus:outline-none"
                >
                  <option value={0.7}>เมื่อใช้ถึง 70% ของวงเงิน</option>
                  <option value={0.8}>เมื่อใช้ถึง 80% ของวงเงิน</option>
                  <option value={0.9}>เมื่อใช้ถึง 90% ของวงเงิน</option>
                  <option value={1.0}>เมื่อใช้เกิน 100%</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Export Tab */}
        {activeTab === 'export' && (
          <div className="space-y-5 max-w-md">
            <div>
              <h3 className="font-display font-bold text-lg text-[#2c2618] dark:text-[#f5eedd]">ส่งออกข้อมูล (CSV)</h3>
              <p className="text-xs text-[#7c7057] dark:text-[#b8ac8e]">ดาวน์โหลดข้อมูลบันทึกทั้งหมดของคุณไปเปิดใน Excel หรือ Google Sheets</p>
            </div>

            <div className="p-5 rounded-2xl bg-[#fbf7ee] dark:bg-[#2a2216] border border-[#ddceac] dark:border-[#4a3f2c] space-y-3">
              <p className="text-xs text-[#4d4432] dark:text-[#b8ac8e] leading-relaxed">
                ไฟล์ CSV ประกอบด้วย วันที่, ประเภท, หมวดหมู่, จำนวนเงิน, และโน้ตบันทึกทั้งหมด รองรับภาษาไทยสมบูรณ์
              </p>
              <button
                onClick={onExportCsv}
                className="py-2.5 px-5 rounded-xl bg-[#3f6b52] hover:bg-[#2c4c3a] text-white text-xs font-bold flex items-center gap-2 cursor-pointer shadow-sm"
              >
                <Download className="w-4 h-4" />
                <span>ดาวน์โหลดรายการรับ-จ่าย (CSV)</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
