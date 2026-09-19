import React, { useState } from 'react';
import { 
  Repeat, 
  Plus, 
  Trash2, 
  Calendar, 
  ArrowUpRight, 
  ArrowDownLeft,
  Clock
} from 'lucide-react';
import { RecurringItem, CategoryItem } from '../../types/finnote';
import { formatMoney, formatDateThai } from '../../utils/formatters';

interface RecurringViewProps {
  recurringItems: RecurringItem[];
  categories: { expense: CategoryItem[]; income: CategoryItem[] };
  onSaveRecurring: (item: RecurringItem) => void;
  onDeleteRecurring: (id: string) => void;
}

export const RecurringView: React.FC<RecurringViewProps> = ({
  recurringItems,
  categories,
  onSaveRecurring,
  onDeleteRecurring,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'monthly'>('monthly');
  const [nextRunDate, setNextRunDate] = useState(new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState('');

  const availableCategories = type === 'expense' ? categories.expense : categories.income;

  const handleOpenCreate = () => {
    setType('expense');
    setAmount('');
    setCategory(categories.expense[0]?.name || 'อื่นๆ');
    setFrequency('monthly');
    setNextRunDate(new Date().toISOString().slice(0, 10));
    setNote('');
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) return;

    onSaveRecurring({
      recurringId: 'rec_' + Date.now(),
      type,
      amount: numAmount,
      category: category || availableCategories[0]?.name || 'อื่นๆ',
      frequency,
      nextRunDate,
      note: note.trim(),
      active: true,
    });
    setIsModalOpen(false);
  };

  const frequencyLabel = {
    daily: 'ทุกวัน',
    weekly: 'ทุกสัปดาห์',
    monthly: 'ทุกเดือน',
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-6 sm:p-7 rounded-3xl bg-[#fffefa] dark:bg-[#1e1811] border border-[#ddceac] dark:border-[#4a3f2c] shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[#3f6b8a]/15 text-[#3f6b8a] flex items-center justify-center shrink-0">
            <Repeat className="w-7 h-7" />
          </div>
          <div>
            <p className="text-xs font-mono uppercase text-[#7c7057] dark:text-[#b8ac8e]">รายการประจำอัตโนมัติ</p>
            <h2 className="text-2xl sm:text-3xl font-display font-bold text-[#2c2618] dark:text-[#f5eedd]">
              จัดการค่าใช้จ่ายประจำรอบ
            </h2>
            <p className="text-xs text-[#7c7057] dark:text-[#b8ac8e] mt-1">
              บันทึกค่าเช่าห้อง ค่าเน็ต ค่าประกัน หรือเงินเดือน เพื่อให้ระบบคำนวณและแจ้งเตือนตามรอบ
            </p>
          </div>
        </div>

        <button
          onClick={handleOpenCreate}
          className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-[#3f6b52] hover:bg-[#2c4c3a] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>เพิ่มรายการประจำ</span>
        </button>
      </div>

      {/* Recurring List */}
      <div className="rounded-3xl border border-[#ddceac] dark:border-[#4a3f2c] bg-[#fffefa] dark:bg-[#1e1811] p-5 shadow-sm space-y-4">
        <h3 className="font-display font-bold text-sm text-[#2c2618] dark:text-[#f5eedd]">
          รายการที่กำหนดไว้ทั้งหมด ({recurringItems.length})
        </h3>

        <div className="divide-y divide-[#ece1c4]/60 dark:divide-[#362d1f]">
          {recurringItems.length === 0 ? (
            <p className="text-center py-12 text-xs text-[#7c7057] dark:text-[#b8ac8e]">
              ยังไม่มีรายการประจำ กดปุ่ม "เพิ่มรายการประจำ" ด้านบนเพื่อตั้งค่า
            </p>
          ) : (
            recurringItems.map((item) => {
              const isInc = item.type === 'income';
              return (
                <div 
                  key={item.recurringId}
                  className="py-3.5 flex items-center justify-between gap-3 hover:bg-[#faf6ed] dark:hover:bg-[#241c13] transition-colors rounded-xl px-2"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                      isInc ? 'bg-[#3f6b52]/15 text-[#3f6b52] dark:text-[#8fbf9f]' : 'bg-[#a03f2c]/15 text-[#a03f2c] dark:text-[#e0916f]'
                    }`}>
                      {isInc ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-sm text-[#2c2618] dark:text-[#f5eedd] truncate">
                          {item.category}
                        </p>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#ece1c4] dark:bg-[#362d1f] text-[#7c7057] dark:text-[#b8ac8e]">
                          {frequencyLabel[item.frequency] || item.frequency}
                        </span>
                      </div>
                      <p className="text-xs text-[#7c7057] dark:text-[#b8ac8e] truncate mt-0.5">
                        {item.note ? `${item.note} · ` : ''}รอบถัดไป: {formatDateThai(item.nextRunDate)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className={`font-mono font-bold text-sm ${
                      isInc ? 'text-[#3f6b52] dark:text-[#8fbf9f]' : 'text-[#a03f2c] dark:text-[#e0916f]'
                    }`}>
                      {isInc ? '+' : '-'}{formatMoney(item.amount)}
                    </span>
                    <button
                      onClick={() => onDeleteRecurring(item.recurringId)}
                      className="p-1.5 rounded-lg hover:bg-[#a03f2c]/20 text-[#a03f2c] dark:text-[#e0916f] transition-colors cursor-pointer"
                      title="ลบ"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="w-full max-w-md p-6 rounded-3xl bg-[#fffefa] dark:bg-[#1e1811] border border-[#ddceac] dark:border-[#4a3f2c] shadow-2xl space-y-4">
            <h3 className="font-display font-bold text-lg text-[#2c2618] dark:text-[#f5eedd]">
              เพิ่มรายการประจำ
            </h3>

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              <div className="flex rounded-xl bg-[#fbf7ee] dark:bg-[#2a2216] p-1 border border-[#ddceac] dark:border-[#4a3f2c]">
                <button
                  type="button"
                  onClick={() => { setType('expense'); setCategory(categories.expense[0]?.name || ''); }}
                  className={`flex-1 py-1.5 rounded-lg font-bold ${type === 'expense' ? 'bg-[#a03f2c] text-white shadow-sm' : 'text-[#7c7057] dark:text-[#b8ac8e]'}`}
                >
                  รายจ่ายประจำ
                </button>
                <button
                  type="button"
                  onClick={() => { setType('income'); setCategory(categories.income[0]?.name || ''); }}
                  className={`flex-1 py-1.5 rounded-lg font-bold ${type === 'income' ? 'bg-[#3f6b52] text-white shadow-sm' : 'text-[#7c7057] dark:text-[#b8ac8e]'}`}
                >
                  รายรับประจำ
                </button>
              </div>

              <div>
                <label className="block text-[#7c7057] dark:text-[#b8ac8e] font-bold mb-1">จำนวนเงิน (บาท)</label>
                <input
                  type="number"
                  required
                  min="1"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full p-2.5 rounded-xl bg-[#fbf7ee] dark:bg-[#2a2216] border border-[#ddceac] dark:border-[#4a3f2c] focus:outline-none font-mono text-sm"
                />
              </div>

              <div>
                <label className="block text-[#7c7057] dark:text-[#b8ac8e] font-bold mb-1">หมวดหมู่</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-[#fbf7ee] dark:bg-[#2a2216] border border-[#ddceac] dark:border-[#4a3f2c] focus:outline-none"
                >
                  {availableCategories.map((c) => (
                    <option key={c.categoryId} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[#7c7057] dark:text-[#b8ac8e] font-bold mb-1">ความถี่</label>
                <select
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value as any)}
                  className="w-full p-2.5 rounded-xl bg-[#fbf7ee] dark:bg-[#2a2216] border border-[#ddceac] dark:border-[#4a3f2c] focus:outline-none"
                >
                  <option value="monthly">ทุกเดือน</option>
                  <option value="weekly">ทุกสัปดาห์</option>
                  <option value="daily">ทุกวัน</option>
                </select>
              </div>

              <div>
                <label className="block text-[#7c7057] dark:text-[#b8ac8e] font-bold mb-1">วันที่เริ่มมีผล</label>
                <input
                  type="date"
                  value={nextRunDate}
                  onChange={(e) => setNextRunDate(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-[#fbf7ee] dark:bg-[#2a2216] border border-[#ddceac] dark:border-[#4a3f2c] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[#7c7057] dark:text-[#b8ac8e] font-bold mb-1">โน้ต</label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="เช่น ค่าเน็ตบ้าน, หอพักห้อง 402"
                  className="w-full p-2.5 rounded-xl bg-[#fbf7ee] dark:bg-[#2a2216] border border-[#ddceac] dark:border-[#4a3f2c] focus:outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-[#ece1c4] dark:bg-[#362d1f] text-[#7c7057] dark:text-[#b8ac8e] font-bold cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#3f6b52] hover:bg-[#2c4c3a] text-white font-bold cursor-pointer"
                >
                  บันทึก
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
