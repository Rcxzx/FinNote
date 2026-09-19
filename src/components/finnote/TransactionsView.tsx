import React, { useState } from 'react';
import { 
  Search, 
  Trash2, 
  Pencil, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Filter,
  Calendar
} from 'lucide-react';
import { Transaction } from '../../types/finnote';
import { formatMoney, formatDateThai, formatTime } from '../../utils/formatters';

interface TransactionsViewProps {
  transactions: Transaction[];
  onDeleteTransaction: (id: string) => void;
  onEditTransaction: (tx: Transaction) => void;
}

export const TransactionsView: React.FC<TransactionsViewProps> = ({
  transactions,
  onDeleteTransaction,
  onEditTransaction,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');

  const filtered = transactions.filter((t) => {
    const matchSearch = (t.category + (t.note || '') + t.date).toLowerCase().includes(searchTerm.toLowerCase());
    const matchType = filterType === 'all' || t.type === filterType;
    return matchSearch && matchType;
  });

  // Group by Date
  const grouped: Record<string, { income: number; expense: number; items: Transaction[] }> = {};
  filtered.forEach((t) => {
    if (!grouped[t.date]) {
      grouped[t.date] = { income: 0, expense: 0, items: [] };
    }
    if (t.type === 'income') grouped[t.date].income += Number(t.amount || 0);
    else grouped[t.date].expense += Number(t.amount || 0);
    grouped[t.date].items.push(t);
  });

  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  return (
    <div className="space-y-5">
      {/* Search & Filter Toolbar */}
      <div className="p-4 rounded-2xl bg-[#fffefa] dark:bg-[#1e1811] border border-[#ddceac] dark:border-[#4a3f2c] flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between shadow-sm">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#7c7057] dark:text-[#b8ac8e]" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="ค้นหาตามหมวดหมู่, โน้ต หรือวันที่..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#fbf7ee] dark:bg-[#2a2216] border border-[#ddceac]/70 dark:border-[#4a3f2c] text-xs font-medium focus:outline-none focus:border-[#3f6b52]"
          />
        </div>

        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#fbf7ee] dark:bg-[#2a2216] border border-[#ddceac]/70 dark:border-[#4a3f2c] self-start sm:self-auto text-xs">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer ${
              filterType === 'all' ? 'bg-[#3f6b52] text-white shadow-sm' : 'text-[#7c7057] dark:text-[#b8ac8e]'
            }`}
          >
            ทั้งหมด
          </button>
          <button
            onClick={() => setFilterType('income')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer ${
              filterType === 'income' ? 'bg-[#3f6b52] text-white shadow-sm' : 'text-[#7c7057] dark:text-[#b8ac8e]'
            }`}
          >
            รายรับ
          </button>
          <button
            onClick={() => setFilterType('expense')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer ${
              filterType === 'expense' ? 'bg-[#a03f2c] text-white shadow-sm' : 'text-[#7c7057] dark:text-[#b8ac8e]'
            }`}
          >
            รายจ่าย
          </button>
        </div>
      </div>

      {/* Ledger Book Style List */}
      <div className="rounded-3xl border border-[#ddceac] dark:border-[#4a3f2c] bg-[#fffefa] dark:bg-[#1e1811] overflow-hidden shadow-sm divide-y divide-[#ddceac]/60 dark:divide-[#4a3f2c]">
        {sortedDates.length === 0 ? (
          <div className="text-center py-16 text-sm text-[#7c7057] dark:text-[#b8ac8e]">
            ไม่พบรายการตามเงื่อนไขที่เลือก
          </div>
        ) : (
          sortedDates.map((dateKey) => {
            const group = grouped[dateKey];
            const net = group.income - group.expense;

            return (
              <div key={dateKey} className="divide-y divide-[#ece1c4]/60 dark:divide-[#362d1f]">
                {/* Group Header (Date) */}
                <div className="p-3.5 sm:px-6 bg-[#fbf7ee] dark:bg-[#16120c] flex items-center justify-between flex-wrap gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-[#3f6b52] dark:text-[#8fbf9f]" />
                    <span className="font-bold text-[#2c2618] dark:text-[#f5eedd] font-display text-sm">
                      {formatDateThai(dateKey)}
                    </span>
                    <span className="text-[11px] text-[#7c7057] dark:text-[#b8ac8e]">
                      ({group.items.length} รายการ)
                    </span>
                  </div>
                  <div className="flex items-center gap-3 font-mono font-semibold">
                    {group.income > 0 && <span className="text-[#3f6b52] dark:text-[#8fbf9f]">+{formatMoney(group.income)}</span>}
                    {group.expense > 0 && <span className="text-[#a03f2c] dark:text-[#e0916f]">-{formatMoney(group.expense)}</span>}
                  </div>
                </div>

                {/* Items */}
                <div className="divide-y divide-[#ece1c4]/40 dark:divide-[#362d1f]/60">
                  {group.items.map((tx) => {
                    const isInc = tx.type === 'income';
                    return (
                      <div 
                        key={tx.transactionId}
                        className="p-3.5 sm:px-6 flex items-center justify-between gap-3 hover:bg-[#faf6ed] dark:hover:bg-[#241c13] transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                            isInc ? 'bg-[#3f6b52]/15 text-[#3f6b52] dark:text-[#8fbf9f]' : 'bg-[#a03f2c]/15 text-[#a03f2c] dark:text-[#e0916f]'
                          }`}>
                            {isInc ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-sm text-[#2c2618] dark:text-[#f5eedd] truncate">
                              {tx.category}
                            </p>
                            <p className="text-xs text-[#7c7057] dark:text-[#b8ac8e] truncate">
                              {tx.note || 'ไม่มีโน้ต'} {tx.createdAt ? `· ${formatTime(tx.createdAt)} น.` : ''}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <span className={`font-mono font-bold text-sm ${
                            isInc ? 'text-[#3f6b52] dark:text-[#8fbf9f]' : 'text-[#a03f2c] dark:text-[#e0916f]'
                          }`}>
                            {isInc ? '+' : '-'}{formatMoney(tx.amount)}
                          </span>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => onEditTransaction(tx)}
                              className="p-1.5 rounded-lg hover:bg-[#ece1c4] dark:hover:bg-[#362d1f] text-[#7c7057] dark:text-[#b8ac8e] transition-colors cursor-pointer"
                              title="แก้ไข"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => onDeleteTransaction(tx.transactionId)}
                              className="p-1.5 rounded-lg hover:bg-[#a03f2c]/20 text-[#a03f2c] dark:text-[#e0916f] transition-colors cursor-pointer"
                              title="ลบ"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
