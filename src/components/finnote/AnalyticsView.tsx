import React from 'react';
import { 
  BarChart3, 
  PieChart, 
  TrendingUp, 
  TrendingDown, 
  Calendar,
  AlertCircle
} from 'lucide-react';
import { Transaction, Budget, CategoryItem } from '../../types/finnote';
import { formatMoney } from '../../utils/formatters';

interface AnalyticsViewProps {
  transactions: Transaction[];
  budgets: Budget[];
  categories: { expense: CategoryItem[]; income: CategoryItem[] };
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  transactions,
  budgets,
  categories,
}) => {
  const currentMonthStr = new Date().toISOString().slice(0, 7);
  const currentMonthTx = transactions.filter((t) => t.date.startsWith(currentMonthStr));

  const totalExpense = currentMonthTx
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);

  const totalIncome = currentMonthTx
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);

  // Category breakdown
  const catExpenseMap: Record<string, number> = {};
  currentMonthTx
    .filter((t) => t.type === 'expense')
    .forEach((t) => {
      catExpenseMap[t.category] = (catExpenseMap[t.category] || 0) + Number(t.amount || 0);
    });

  const categoryBreakdown = Object.entries(catExpenseMap)
    .map(([cat, amt]) => ({
      category: cat,
      amount: amt,
      percent: totalExpense > 0 ? Math.round((amt / totalExpense) * 100) : 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  const catColorMap: Record<string, string> = {};
  categories.expense.forEach((c) => { catColorMap[c.name] = c.color; });

  return (
    <div className="space-y-6">
      {/* Chapter 1: Comparison */}
      <div className="p-6 rounded-3xl bg-[#fffefa] dark:bg-[#1e1811] border border-[#ddceac] dark:border-[#4a3f2c] shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <span className="w-8 h-8 rounded-full border border-dashed border-[#3f6b52] text-[#3f6b52] dark:text-[#8fbf9f] flex items-center justify-center font-display font-bold text-sm">
            1
          </span>
          <div>
            <p className="text-xs font-mono uppercase text-[#3f6b52] dark:text-[#8fbf9f] font-bold">ภาพรวมเดือนนี้</p>
            <h3 className="font-display font-bold text-base text-[#2c2618] dark:text-[#f5eedd]">
              เปรียบเทียบรายรับ vs รายจ่าย
            </h3>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div className="p-4 rounded-2xl bg-[#fbf7ee] dark:bg-[#2a2216] border border-[#ddceac]/60 dark:border-[#4a3f2c]">
            <p className="text-xs text-[#7c7057] dark:text-[#b8ac8e] font-medium">รายรับรวม</p>
            <p className="text-2xl font-mono font-bold text-[#3f6b52] dark:text-[#8fbf9f] mt-1">
              {formatMoney(totalIncome)}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#fbf7ee] dark:bg-[#2a2216] border border-[#ddceac]/60 dark:border-[#4a3f2c]">
            <p className="text-xs text-[#7c7057] dark:text-[#b8ac8e] font-medium">รายจ่ายรวม</p>
            <p className="text-2xl font-mono font-bold text-[#a03f2c] dark:text-[#e0916f] mt-1">
              {formatMoney(totalExpense)}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#fbf7ee] dark:bg-[#2a2216] border border-[#ddceac]/60 dark:border-[#4a3f2c]">
            <p className="text-xs text-[#7c7057] dark:text-[#b8ac8e] font-medium">เงินคงเหลือสุทธิ</p>
            <p className={`text-2xl font-mono font-bold mt-1 ${
              totalIncome - totalExpense >= 0 ? 'text-[#3f6b52] dark:text-[#8fbf9f]' : 'text-[#a03f2c] dark:text-[#e0916f]'
            }`}>
              {formatMoney(totalIncome - totalExpense)}
            </p>
          </div>
        </div>
      </div>

      {/* Chapter 2: Category Breakdown */}
      <div className="p-6 rounded-3xl bg-[#fffefa] dark:bg-[#1e1811] border border-[#ddceac] dark:border-[#4a3f2c] shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <span className="w-8 h-8 rounded-full border border-dashed border-[#3f6b52] text-[#3f6b52] dark:text-[#8fbf9f] flex items-center justify-center font-display font-bold text-sm">
            2
          </span>
          <div>
            <p className="text-xs font-mono uppercase text-[#3f6b52] dark:text-[#8fbf9f] font-bold">สัดส่วนรายจ่าย</p>
            <h3 className="font-display font-bold text-base text-[#2c2618] dark:text-[#f5eedd]">
              แยกตามหมวดหมู่ประจำเดือนนี้
            </h3>
          </div>
        </div>

        {categoryBreakdown.length === 0 ? (
          <p className="text-center py-8 text-xs text-[#7c7057] dark:text-[#b8ac8e]">ยังไม่มีข้อมูลรายจ่ายในเดือนนี้</p>
        ) : (
          <div className="space-y-3 pt-2">
            {categoryBreakdown.map((item) => {
              const color = catColorMap[item.category] || '#7a7a72';
              return (
                <div key={item.category} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-medium">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: color }} />
                      <span className="font-bold text-[#2c2618] dark:text-[#f5eedd]">{item.category}</span>
                    </div>
                    <div className="flex items-center gap-3 font-mono">
                      <span>{formatMoney(item.amount)}</span>
                      <span className="text-[#7c7057] dark:text-[#b8ac8e] w-10 text-right">{item.percent}%</span>
                    </div>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[#ece1c4] dark:bg-[#362d1f] overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${item.percent}%`, backgroundColor: color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Chapter 3: Budget Overspending Insights */}
      <div className="p-6 rounded-3xl bg-[#fffefa] dark:bg-[#1e1811] border border-[#ddceac] dark:border-[#4a3f2c] shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <span className="w-8 h-8 rounded-full border border-dashed border-[#3f6b52] text-[#3f6b52] dark:text-[#8fbf9f] flex items-center justify-center font-display font-bold text-sm">
            3
          </span>
          <div>
            <p className="text-xs font-mono uppercase text-[#3f6b52] dark:text-[#8fbf9f] font-bold">วินัยทางการเงิน</p>
            <h3 className="font-display font-bold text-base text-[#2c2618] dark:text-[#f5eedd]">
              การควบคุมงบประมาณ
            </h3>
          </div>
        </div>

        <div className="divide-y divide-[#ece1c4]/60 dark:divide-[#362d1f]">
          {budgets.length === 0 ? (
            <p className="text-center py-6 text-xs text-[#7c7057] dark:text-[#b8ac8e]">ยังไม่ได้ตั้งงบประมาณ</p>
          ) : (
            budgets.map((b) => {
              const spent = currentMonthTx
                .filter((t) => t.type === 'expense' && (!b.category || t.category === b.category))
                .reduce((sum, t) => sum + Number(t.amount || 0), 0);
              const isOver = spent > b.amount;
              const ratio = b.amount > 0 ? spent / b.amount : 0;
              const percent = Math.round(ratio * 100);

              return (
                <div key={b.budgetId} className="py-3 flex items-center justify-between gap-3 text-xs">
                  <div>
                    <p className="font-bold text-[#2c2618] dark:text-[#f5eedd]">
                      {b.category || 'ทุกหมวดหมู่ (งบรวม)'}
                    </p>
                    <p className="text-[#7c7057] dark:text-[#b8ac8e]">
                      วงเงิน {formatMoney(b.amount)} · ใช้ไป {formatMoney(spent)}
                    </p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full font-bold font-mono ${
                    isOver 
                      ? 'bg-[#a03f2c]/15 text-[#a03f2c] dark:text-[#e0916f]' 
                      : percent >= 80 
                      ? 'bg-[#a97a24]/15 text-[#a97a24] dark:text-[#dbb06c]' 
                      : 'bg-[#3f6b52]/15 text-[#3f6b52] dark:text-[#8fbf9f]'
                  }`}>
                    {isOver ? `เกินงบ ${percent}%` : `ใช้ไป ${percent}%`}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
