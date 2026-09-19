import { Transaction, Budget } from '../types/finnote';

export function formatMoney(val: number): string {
  return '฿' + Number(val || 0).toLocaleString('th-TH', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

export function formatDateThai(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-').map(Number);
  if (parts.length < 3) return dateStr;
  const d = new Date(parts[0], parts[1] - 1, parts[2]);
  return new Intl.DateTimeFormat('th-TH', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(d);
}

export function formatTime(isoOrTime?: string): string {
  if (!isoOrTime) return '';
  if (/^\d{2}:\d{2}$/.test(isoOrTime)) return isoOrTime;
  const d = new Date(isoOrTime);
  if (isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat('th-TH', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(d);
}

export function getTodayDateString(): string {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
}

export function getCurrentTimeString(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export function computeBudgetProgress(transactions: Transaction[], budget: Budget) {
  const amount = Number(budget.amount || 0);
  const start = budget.startDate || getTodayDateString();
  const spent = transactions
    .filter((tx) => tx.type === 'expense' && (!budget.category || tx.category === budget.category))
    .reduce((sum, tx) => sum + Number(tx.amount || 0), 0);

  const remaining = Math.max(0, amount - spent);
  const ratio = amount > 0 ? spent / amount : 0;
  const percent = Math.round(ratio * 100);
  const overBudget = spent > amount;

  return {
    ...budget,
    spent,
    remaining: amount - spent,
    ratio,
    percent,
    overBudget,
  };
}
