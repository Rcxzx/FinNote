import React, { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  Pencil, 
  Wallet, 
  AlertTriangle, 
  CheckCircle2,
  Calendar
} from 'lucide-react';
import { Budget, Transaction, CategoryItem } from '../../types/finnote';
import { formatMoney } from '../../utils/formatters';

interface BudgetViewProps {
  budgets: Budget[];
  transactions: Transaction[];
  categories: CategoryItem[];
  onSaveBudget: (budget: Budget) => void;
  onDeleteBudget: (id: string) => void;
}

export const BudgetView: React.FC<BudgetViewProps> = ({
  budgets,
  transactions,
  categories,
  onSaveBudget,
  onDeleteBudget,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);

  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('monthly');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));

  const currentMonthStr = new Date().toISOString().slice(0, 7);
  const currentMonthExpenseTx = transactions.filter((t) => t.type === 'expense' && t.date.startsWith(currentMonthStr));

  // Compute stats for each budget
  const budgetStats = budgets.map((b) => {
    const spent = currentMonthExpenseTx
      .filter((t) => !b.category || t.category === b.category)
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);
    const remaining = b.amount - spent;
    const ratio = b.amount > 0 ? spent / b.amount : 0;
    const percent = Math.round(ratio * 100);
    return {
      ...b,
      spent,
      remaining,
      ratio,
      percent,
      overBudget: spent > b.amount,
    };
  });

  const totalBudgetAmount = budgets.reduce((sum, b) => sum + Number(b.amount || 0), 0);
  const overBudgetCount = budgetStats.filter((b) => b.overBudget).length;

  const handleOpenCreate = () => {
    setEditingBudget(null);
    setPeriod('monthly');
    setAmount('');
    setCategory('');
    setStartDate(new Date().toISOString().slice(0, 10));
    setIsModalOpen(true);
  };

  const handleOpenEdit = (b: Budget) => {
    setEditingBudget(b);
    setPeriod(b.period);
    setAmount(String(b.amount));
    setCategory(b.category || '');
    setStartDate(b.startDate || new Date().toISOString().slice(0, 10));
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) return;

    onSaveBudget({
      budgetId: editingBudget ? editingBudget.budgetId : 'bud_' + Date.now(),
      period,
      amount: numAmount,
      category,
      startDate,
    });
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-[#fffefa] dark:bg-[#1e1811] border border-[#ddceac] dark:border-[#4a3f2c] shadow-sm flex items-center gap-4">
          <div className="w-11 h-11 rounded-2xl bg-[#3f6b52]/15 text-[#3f6b52] dark:text-[#8fbf9f] flex items-center justify-center shrink-0">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-mono uppercase text-[#7c7057] dark:text-[#b8ac8e]">วงเงินงบประมาณรวม</p>
            <p className="text-2xl font-mono font-bold text-[#2c2618] dark:text-[#f5eedd]">
              {formatMoney(totalBudgetAmount)}
            </p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#fffefa] dark:bg-[#1e1811] border border-[#ddceac] dark:border-[#4a3f2c] shadow-sm flex items-center gap-4">
          <div className="w-11 h-11 rounded-2xl bg-[#a97a24]/15 text-[#a97a24] dark:text-[#dbb06c] flex items-center justify-center shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-mono uppercase text-[#7c7057] dark:text-[#b8ac8e]">จำนวนงบประมาณ</p>
            <p className="text-2xl font-mono font-bold text-[#2c2618] dark:text-[#f5eedd]">
              {budgets.length} <span className="text-sm font-normal text-[#7c7057]">รายการ</span>
            </p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#fffefa] dark:bg-[#1e1811] border border-[#ddceac] dark:border-[#4a3f2c] shadow-sm flex items-center gap-4">
          <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
            overBudgetCount > 0 ? 'bg-[#a03f2c]/15 text-[#a03f2c] dark:text-[#e0916f]' : 'bg-[#3f6b52]/15 text-[#3f6b52] dark:text-[#8fbf9f]'
          }`}>
            {overBudgetCount > 0 ? <AlertTriangle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
          </div>
          <div>
            <p className="text-xs font-mono uppercase text-[#7c7057] dark:text-[#b8ac8e]">สถานะเกินงบ</p>
            <p className={`text-2xl font-mono font-bold ${
              overBudgetCount > 0 ? 'text-[#a03f2c] dark:text-[#e0916f]' : 'text-[#3f6b52] dark:text-[#8fbf9f]'
            }`}>
              {overBudgetCount > 0 ? `เกินงบ ${overBudgetCount} รายการ` : 'ปกติทุกรายการ'}
            </p>
          </div>
        </div>
      </div>

      {/* Action Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display font-bold text-lg text-[#2c2618] dark:text-[#f5eedd]">
            รายการงบประมาณทั้งหมด
          </h3>
          <p className="text-xs text-[#7c7057] dark:text-[#b8ac8e]">
            ตั้งงบรวมหรือแยกตามหมวดหมู่เพื่อควบคุมรายจ่ายในแต่ละเดือน
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="px-4 py-2.5 rounded-xl bg-[#3f6b52] hover:bg-[#2c4c3a] text-white text-xs font-bold flex items-center gap-2 shadow-sm transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>ตั้งงบประมาณใหม่</span>
        </button>
      </div>

      {/* Envelope Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {budgetStats.length === 0 ? (
          <div className="col-span-full text-center py-16 rounded-3xl border border-dashed border-[#ddceac] dark:border-[#4a3f2c] bg-[#fffefa] dark:bg-[#1e1811] text-xs text-[#7c7057] dark:text-[#b8ac8e]">
            ยังไม่มีงบประมาณที่ตั้งไว้ กดปุ่ม "ตั้งงบประมาณใหม่" ด้านบนเพื่อเริ่มต้น
          </div>
        ) : (
          budgetStats.map((b) => {
            const barWidth = Math.min(100, b.percent || 0);
            return (
              <div 
                key={b.budgetId}
                className={`p-5 rounded-3xl border transition-all shadow-sm flex flex-col justify-between ${
                  b.overBudget 
                    ? 'border-[#a03f2c]/50 bg-[#fff5f2] dark:bg-[#261612]' 
                    : 'border-[#ddceac] dark:border-[#4a3f2c] bg-[#fffefa] dark:bg-[#1e1811]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                      b.overBudget 
                        ? 'bg-[#a03f2c]/15 text-[#a03f2c] dark:text-[#e0916f]' 
                        : b.percent >= 80 
                        ? 'bg-[#a97a24]/15 text-[#a97a24] dark:text-[#dbb06c]' 
                        : 'bg-[#3f6b52]/15 text-[#3f6b52] dark:text-[#8fbf9f]'
                    }`}>
                      {b.overBudget ? `เกินงบ ${b.percent}%` : `ใช้ไปแล้ว ${b.percent}%`}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEdit(b)}
                        className="p-1.5 rounded-lg hover:bg-[#ece1c4] dark:hover:bg-[#362d1f] text-[#7c7057] dark:text-[#b8ac8e] transition-colors cursor-pointer"
                        title="แก้ไข"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteBudget(b.budgetId)}
                        className="p-1.5 rounded-lg hover:bg-[#a03f2c]/20 text-[#a03f2c] dark:text-[#e0916f] transition-colors cursor-pointer"
                        title="ลบ"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <h4 className="font-display font-bold text-base text-[#2c2618] dark:text-[#f5eedd]">
                    {b.category || 'ทุกหมวดหมู่ (งบรวม)'}
                  </h4>
                  <p className="text-xs text-[#7c7057] dark:text-[#b8ac8e] mt-0.5">
                    รอบ {b.period === 'monthly' ? 'รายเดือน' : b.period === 'weekly' ? 'รายสัปดาห์' : 'รายวัน'}
                  </p>

                  <div className="mt-4 flex items-baseline justify-between font-mono">
                    <span className="text-xl font-bold text-[#2c2618] dark:text-[#f5eedd]">
                      {formatMoney(b.amount)}
                    </span>
                    <span className="text-xs text-[#7c7057] dark:text-[#b8ac8e]">
                      ใช้ไป {formatMoney(b.spent)}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full h-2.5 rounded-full bg-[#ece1c4] dark:bg-[#362d1f] overflow-hidden mt-2.5">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        b.overBudget 
                          ? 'bg-[#a03f2c] dark:bg-[#e0916f]' 
                          : b.percent >= 80 
                          ? 'bg-[#a97a24] dark:bg-[#dbb06c]' 
                          : 'bg-[#3f6b52] dark:bg-[#8fbf9f]'
                      }`}
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-[#ddceac]/40 dark:border-[#4a3f2c]/60 flex items-center justify-between text-xs">
                  <span className="text-[#7c7057] dark:text-[#b8ac8e]">
                    {b.overBudget ? 'เกินวงเงิน' : 'คงเหลือใช้ได้อีก'}
                  </span>
                  <span className={`font-mono font-bold ${
                    b.overBudget ? 'text-[#a03f2c] dark:text-[#e0916f]' : 'text-[#3f6b52] dark:text-[#8fbf9f]'
                  }`}>
                    {b.overBudget ? `-${formatMoney(Math.abs(b.remaining))}` : formatMoney(b.remaining)}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal Setup */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="w-full max-w-md p-6 rounded-3xl bg-[#fffefa] dark:bg-[#1e1811] border border-[#ddceac] dark:border-[#4a3f2c] shadow-2xl space-y-4">
            <h3 className="font-display font-bold text-lg text-[#2c2618] dark:text-[#f5eedd]">
              {editingBudget ? 'แก้ไขงบประมาณ' : 'ตั้งงบประมาณใหม่'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[#7c7057] dark:text-[#b8ac8e] font-bold mb-1">หมวดหมู่</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-[#fbf7ee] dark:bg-[#2a2216] border border-[#ddceac] dark:border-[#4a3f2c] focus:outline-none"
                >
                  <option value="">ทุกหมวดหมู่ (งบรวมทั้งหมด)</option>
                  {categories.map((c) => (
                    <option key={c.categoryId} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[#7c7057] dark:text-[#b8ac8e] font-bold mb-1">วงเงินงบประมาณ (บาท)</label>
                <input
                  type="number"
                  required
                  min="1"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="เช่น 15000"
                  className="w-full p-2.5 rounded-xl bg-[#fbf7ee] dark:bg-[#2a2216] border border-[#ddceac] dark:border-[#4a3f2c] focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-[#7c7057] dark:text-[#b8ac8e] font-bold mb-1">รูปแบบรอบงบประมาณ</label>
                <select
                  value={period}
                  onChange={(e) => setPeriod(e.target.value as any)}
                  className="w-full p-2.5 rounded-xl bg-[#fbf7ee] dark:bg-[#2a2216] border border-[#ddceac] dark:border-[#4a3f2c] focus:outline-none"
                >
                  <option value="monthly">รายเดือน</option>
                  <option value="weekly">รายสัปดาห์</option>
                  <option value="daily">รายวัน</option>
                </select>
              </div>

              <div>
                <label className="block text-[#7c7057] dark:text-[#b8ac8e] font-bold mb-1">วันที่เริ่มต้น</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
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
