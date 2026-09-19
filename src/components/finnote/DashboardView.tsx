import React from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Tag, 
  ListChecks, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Flame, 
  ChevronRight,
  Plus
} from 'lucide-react';
import { Transaction, Budget, CategoryItem } from '../../types/finnote';
import { formatMoney, formatDateThai } from '../../utils/formatters';

interface DashboardViewProps {
  transactions: Transaction[];
  budgets: Budget[];
  categories: { expense: CategoryItem[]; income: CategoryItem[] };
  onNavigate: (tab: string) => void;
  onOpenAddModal: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  transactions,
  budgets,
  categories,
  onNavigate,
  onOpenAddModal,
}) => {
  const currentMonthStr = new Date().toISOString().slice(0, 7);
  const currentMonthTx = transactions.filter((t) => t.date.startsWith(currentMonthStr));

  const monthIncome = currentMonthTx
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);

  const monthExpense = currentMonthTx
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);

  const monthBalance = monthIncome - monthExpense;

  const todayStr = new Date().toISOString().slice(0, 10);
  const todayCount = transactions.filter((t) => t.date === todayStr).length;

  // Main Budget
  const primaryBudget = budgets.find((b) => !b.category) || budgets[0] || {
    amount: 15000,
    spent: monthExpense,
    remaining: 15000 - monthExpense,
    ratio: monthExpense / 15000,
    percent: Math.round((monthExpense / 15000) * 100),
  };

  const budgetRatio = primaryBudget.amount > 0 ? (primaryBudget.spent || monthExpense) / primaryBudget.amount : 0;
  const budgetPercent = Math.min(100, Math.round(budgetRatio * 100));

  // Top Category
  const catExpenseMap: Record<string, number> = {};
  currentMonthTx
    .filter((t) => t.type === 'expense')
    .forEach((t) => {
      catExpenseMap[t.category] = (catExpenseMap[t.category] || 0) + Number(t.amount || 0);
    });

  const topCategoryEntry = Object.entries(catExpenseMap).sort((a, b) => b[1] - a[1])[0];
  const topCategoryName = topCategoryEntry ? topCategoryEntry[0] : 'ยังไม่มีข้อมูล';
  const topCategoryAmt = topCategoryEntry ? topCategoryEntry[1] : 0;

  const recentTx = [...transactions]
    .sort((a, b) => (b.date + b.createdAt).localeCompare(a.date + a.createdAt))
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Focal Hero Card */}
      <div className="rounded-3xl border border-[#ddceac] bg-[#fffefa] dark:bg-[#1e1811] dark:border-[#4a3f2c] overflow-hidden shadow-sm relative">
        <div className="grid grid-cols-1 lg:grid-cols-12">
          {/* Left: Net Balance and Progress */}
          <div className="lg:col-span-7 p-6 sm:p-8 relative border-b lg:border-b-0 lg:border-r border-[#ddceac] dark:border-[#4a3f2c]">
            <div className="flex items-center justify-between gap-2 flex-wrap mb-3">
              <span className="text-xs font-mono font-bold tracking-wider text-[#3f6b52] dark:text-[#8fbf9f] uppercase">
                ยอดคงเหลือสุทธิ เดือนนี้
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#3f6b52]/10 text-[#3f6b52] dark:bg-[#8fbf9f]/15 dark:text-[#8fbf9f] border border-[#3f6b52]/20">
                {monthBalance >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                <span>{monthBalance >= 0 ? 'สถานะการเงินเป็นบวก' : 'รายจ่ายเกินรายรับ'}</span>
              </span>
            </div>

            <h2 className="text-4xl sm:text-5xl font-display font-bold text-[#2c2618] dark:text-[#f5eedd] tracking-tight mb-6">
              {formatMoney(monthBalance)}
            </h2>

            {/* Budget Progress Bar */}
            <div className="space-y-2 pt-2">
              <div className="flex justify-between items-center text-xs font-semibold text-[#7c7057] dark:text-[#b8ac8e]">
                <span>งบประมาณเดือนนี้</span>
                <span>ใช้ไป {budgetPercent}% ({formatMoney(primaryBudget.spent || monthExpense)} / {formatMoney(primaryBudget.amount)})</span>
              </div>
              <div className="w-full h-3 rounded-full bg-[#ece1c4] dark:bg-[#362d1f] overflow-hidden">
                <div 
                  className={`h-full transition-all duration-500 rounded-full ${
                    budgetPercent >= 100 
                      ? 'bg-[#a03f2c] dark:bg-[#e0916f]' 
                      : budgetPercent >= 80 
                      ? 'bg-[#a97a24] dark:bg-[#dbb06c]' 
                      : 'bg-[#3f6b52] dark:bg-[#8fbf9f]'
                  }`}
                  style={{ width: `${budgetPercent}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-xs text-[#7c7057] dark:text-[#b8ac8e] pt-1">
                <span>คงเหลืออีก {formatMoney(Math.max(0, primaryBudget.amount - (primaryBudget.spent || monthExpense)))}</span>
                <span className="inline-flex items-center gap-1 text-[#a97a24] dark:text-[#dbb06c] font-bold">
                  <Flame className="w-3.5 h-3.5" />
                  <span>บันทึกต่อเนื่อง (Streak)</span>
                </span>
              </div>
            </div>
          </div>

          {/* Right: Quick Recent Transactions */}
          <div className="lg:col-span-5 p-6 sm:p-7 bg-[#fbf7ee] dark:bg-[#16120c]/60 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-bold text-sm text-[#2c2618] dark:text-[#f5eedd] flex items-center gap-1.5">
                <span>รายการล่าสุด</span>
              </h3>
              <button 
                onClick={() => onNavigate('transactions')}
                className="text-xs font-bold text-[#3f6b52] dark:text-[#8fbf9f] hover:underline inline-flex items-center gap-0.5 cursor-pointer"
              >
                <span>ดูทั้งหมด</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2.5">
              {recentTx.length === 0 ? (
                <div className="text-center py-6 text-xs text-[#7c7057] dark:text-[#b8ac8e] border border-dashed border-[#ddceac] dark:border-[#4a3f2c] rounded-2xl">
                  ยังไม่มีรายการ กดปุ่ม + เพื่อเริ่มจด
                </div>
              ) : (
                recentTx.map((tx) => {
                  const isInc = tx.type === 'income';
                  return (
                    <div 
                      key={tx.transactionId}
                      className="p-2.5 px-3 rounded-xl bg-white dark:bg-[#2a2216] border border-[#ddceac]/70 dark:border-[#4a3f2c] flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                          isInc ? 'bg-[#3f6b52]/15 text-[#3f6b52] dark:text-[#8fbf9f]' : 'bg-[#a03f2c]/15 text-[#a03f2c] dark:text-[#e0916f]'
                        }`}>
                          {isInc ? <ArrowDownLeft className="w-3.5 h-3.5" /> : <ArrowUpRight className="w-3.5 h-3.5" />}
                        </div>
                        <div className="truncate">
                          <p className="font-bold text-[#2c2618] dark:text-[#f5eedd] truncate">{tx.category}</p>
                          <p className="text-[10px] text-[#7c7057] dark:text-[#b8ac8e]">{formatDateThai(tx.date)}</p>
                        </div>
                      </div>
                      <span className={`font-mono font-bold shrink-0 ${
                        isInc ? 'text-[#3f6b52] dark:text-[#8fbf9f]' : 'text-[#a03f2c] dark:text-[#e0916f]'
                      }`}>
                        {isInc ? '+' : '-'}{formatMoney(tx.amount)}
                      </span>
                    </div>
                  );
                })
              )}
            </div>

            <button
              onClick={onOpenAddModal}
              className="mt-4 w-full py-2.5 px-4 rounded-xl bg-[#3f6b52] hover:bg-[#2c4c3a] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>จดบันทึกรายการทันที</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 Summary Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Income */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#fffefa] dark:bg-[#1e1811] border border-[#ddceac] dark:border-[#4a3f2c] shadow-sm relative overflow-hidden">
          <div className="w-8 h-8 rounded-full bg-[#3f6b52]/15 text-[#3f6b52] dark:text-[#8fbf9f] flex items-center justify-center mb-3">
            <TrendingUp className="w-4 h-4" />
          </div>
          <p className="text-[11px] font-mono font-semibold uppercase text-[#7c7057] dark:text-[#b8ac8e]">รายรับเดือนนี้</p>
          <p className="text-xl sm:text-2xl font-mono font-bold text-[#3f6b52] dark:text-[#8fbf9f] mt-1">
            {formatMoney(monthIncome)}
          </p>
        </div>

        {/* Card 2: Expense */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#fffefa] dark:bg-[#1e1811] border border-[#ddceac] dark:border-[#4a3f2c] shadow-sm relative overflow-hidden">
          <div className="w-8 h-8 rounded-full bg-[#a03f2c]/15 text-[#a03f2c] dark:text-[#e0916f] flex items-center justify-center mb-3">
            <TrendingDown className="w-4 h-4" />
          </div>
          <p className="text-[11px] font-mono font-semibold uppercase text-[#7c7057] dark:text-[#b8ac8e]">รายจ่ายเดือนนี้</p>
          <p className="text-xl sm:text-2xl font-mono font-bold text-[#a03f2c] dark:text-[#e0916f] mt-1">
            {formatMoney(monthExpense)}
          </p>
        </div>

        {/* Card 3: Today Entries */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#fffefa] dark:bg-[#1e1811] border border-[#ddceac] dark:border-[#4a3f2c] shadow-sm relative overflow-hidden">
          <div className="w-8 h-8 rounded-full bg-[#a97a24]/15 text-[#a97a24] dark:text-[#dbb06c] flex items-center justify-center mb-3">
            <ListChecks className="w-4 h-4" />
          </div>
          <p className="text-[11px] font-mono font-semibold uppercase text-[#7c7057] dark:text-[#b8ac8e]">รายการวันนี้</p>
          <p className="text-xl sm:text-2xl font-mono font-bold text-[#2c2618] dark:text-[#f5eedd] mt-1">
            {todayCount} <span className="text-xs font-normal text-[#7c7057]">รายการ</span>
          </p>
        </div>

        {/* Card 4: Top Category */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#fffefa] dark:bg-[#1e1811] border border-[#ddceac] dark:border-[#4a3f2c] shadow-sm relative overflow-hidden">
          <div className="w-8 h-8 rounded-full bg-[#8a6fb0]/15 text-[#8a6fb0] flex items-center justify-center mb-3">
            <Tag className="w-4 h-4" />
          </div>
          <p className="text-[11px] font-mono font-semibold uppercase text-[#7c7057] dark:text-[#b8ac8e]">จ่ายมากที่สุด</p>
          <p className="text-base sm:text-lg font-bold text-[#2c2618] dark:text-[#f5eedd] mt-1 truncate">
            {topCategoryName}
          </p>
          <p className="text-xs font-mono text-[#a03f2c] dark:text-[#e0916f] font-semibold">
            {formatMoney(topCategoryAmt)}
          </p>
        </div>
      </div>
    </div>
  );
};
