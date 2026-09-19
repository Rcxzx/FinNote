import React, { useState } from 'react';
import { 
  X, 
  Save, 
  Sparkles, 
  Mic, 
  Clock, 
  Calendar,
  Check
} from 'lucide-react';
import { Transaction, CategoryItem } from '../../types/finnote';
import { getTodayDateString, getCurrentTimeString } from '../../utils/formatters';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (tx: Transaction) => void;
  categories: { expense: CategoryItem[]; income: CategoryItem[] };
  editingTransaction?: Transaction | null;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  categories,
  editingTransaction,
}) => {
  const [mode, setMode] = useState<'normal' | 'nlp'>('normal');
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(getTodayDateString());
  const [time, setTime] = useState(getCurrentTimeString());

  // NLP input state
  const [nlpText, setNlpText] = useState('');
  const [nlpPreview, setNlpPreview] = useState<string | null>(null);

  React.useEffect(() => {
    if (editingTransaction) {
      setType(editingTransaction.type);
      setAmount(String(editingTransaction.amount));
      setCategory(editingTransaction.category);
      setNote(editingTransaction.note || '');
      setDate(editingTransaction.date);
      setMode('normal');
    } else {
      setType('expense');
      setAmount('');
      setCategory(categories.expense[0]?.name || 'อาหาร');
      setNote('');
      setDate(getTodayDateString());
      setTime(getCurrentTimeString());
      setNlpText('');
      setNlpPreview(null);
    }
  }, [editingTransaction, isOpen, categories]);

  if (!isOpen) return null;

  const currentCategories = type === 'expense' ? categories.expense : categories.income;

  // Simple NLP Parsing (e.g. "ข้าวขาหมู 60", "กาแฟ 55", "เงินเดือน 30000")
  const handleNlpChange = (text: string) => {
    setNlpText(text);
    if (!text.trim()) {
      setNlpPreview(null);
      return;
    }
    const match = text.match(/(.*?)\s*(\d+(?:\.\d+)?)\s*$/);
    if (match) {
      const itemDesc = match[1].trim() || 'รายการ';
      const itemAmt = Number(match[2]);
      setNlpPreview(`เข้าใจว่า: "${itemDesc}" จำนวน ฿${itemAmt}`);
    } else {
      setNlpPreview('พิมพ์ชื่อรายการตามด้วยราคา เช่น "ข้าวมันไก่ 50"');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (mode === 'nlp') {
      const match = nlpText.match(/(.*?)\s*(\d+(?:\.\d+)?)\s*$/);
      if (!match) return;
      const parsedNote = match[1].trim() || 'รายการ';
      const parsedAmount = Number(match[2]);

      // Auto detect category
      let matchedCat = currentCategories[0]?.name || 'อื่นๆ';
      if (/ข้าว|น้ำ|กิน|ก๋วยเตี๋ยว|กาแฟ|ขนม|ชา/i.test(parsedNote)) matchedCat = 'อาหาร';
      else if (/รถ|วิน|แท็กซี่|bts|mrt|น้ำมัน/i.test(parsedNote)) matchedCat = 'เดินทาง';
      else if (/เสื้อ|กางเกง|ช้อป/i.test(parsedNote)) matchedCat = 'ช้อปปิ้ง';

      onSave({
        transactionId: editingTransaction ? editingTransaction.transactionId : 'txn_' + Date.now(),
        type,
        amount: parsedAmount,
        category: matchedCat,
        note: parsedNote,
        date,
        createdAt: new Date().toISOString(),
        source: 'nlp',
      });
    } else {
      const numAmount = Number(amount);
      if (!numAmount || numAmount <= 0) return;

      onSave({
        transactionId: editingTransaction ? editingTransaction.transactionId : 'txn_' + Date.now(),
        type,
        amount: numAmount,
        category: category || currentCategories[0]?.name || 'อื่นๆ',
        note: note.trim(),
        date,
        createdAt: new Date().toISOString(),
        source: 'manual',
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="w-full max-w-md p-6 rounded-3xl bg-[#fffefa] dark:bg-[#1e1811] border border-[#ddceac] dark:border-[#4a3f2c] shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="font-display font-bold text-lg text-[#2c2618] dark:text-[#f5eedd]">
            {editingTransaction ? 'แก้ไขรายการ' : 'บันทึกรายรับ-รายจ่าย'}
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-[#7c7057] hover:bg-[#ece1c4] dark:hover:bg-[#362d1f] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Switcher: Normal vs NLP */}
        {!editingTransaction && (
          <div className="flex gap-2 p-1 rounded-xl bg-[#fbf7ee] dark:bg-[#2a2216] border border-[#ddceac] dark:border-[#4a3f2c] text-xs font-bold">
            <button
              type="button"
              onClick={() => setMode('normal')}
              className={`flex-1 py-1.5 rounded-lg cursor-pointer transition-colors ${
                mode === 'normal' ? 'bg-[#3f6b52] text-white shadow-sm' : 'text-[#7c7057] dark:text-[#b8ac8e]'
              }`}
            >
              จดแบบปกติ
            </button>
            <button
              type="button"
              onClick={() => setMode('nlp')}
              className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1 cursor-pointer transition-colors ${
                mode === 'nlp' ? 'bg-[#3f6b52] text-white shadow-sm' : 'text-[#7c7057] dark:text-[#b8ac8e]'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>พิมพ์ประโยคเดียว (NLP)</span>
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          {/* Expense vs Income */}
          <div className="flex rounded-xl bg-[#fbf7ee] dark:bg-[#2a2216] p-1 border border-[#ddceac] dark:border-[#4a3f2c]">
            <button
              type="button"
              onClick={() => setType('expense')}
              className={`flex-1 py-1.5 rounded-lg font-bold transition-colors cursor-pointer ${
                type === 'expense' ? 'bg-[#a03f2c] text-white shadow-sm' : 'text-[#7c7057] dark:text-[#b8ac8e]'
              }`}
            >
              รายจ่าย
            </button>
            <button
              type="button"
              onClick={() => setType('income')}
              className={`flex-1 py-1.5 rounded-lg font-bold transition-colors cursor-pointer ${
                type === 'income' ? 'bg-[#3f6b52] text-white shadow-sm' : 'text-[#7c7057] dark:text-[#b8ac8e]'
              }`}
            >
              รายรับ
            </button>
          </div>

          {mode === 'nlp' ? (
            <div className="space-y-3">
              <div>
                <label className="block text-[#7c7057] dark:text-[#b8ac8e] font-bold mb-1">
                  พิมพ์ชื่อรายการและราคา
                </label>
                <input
                  type="text"
                  required
                  value={nlpText}
                  onChange={(e) => handleNlpChange(e.target.value)}
                  placeholder="เช่น ข้าวขาหมู 60 หรือ ค่าไฟ 1200"
                  autoFocus
                  className="w-full p-3 rounded-xl bg-[#fbf7ee] dark:bg-[#2a2216] border border-[#ddceac] dark:border-[#4a3f2c] focus:outline-none text-sm font-medium"
                />
              </div>

              {nlpPreview && (
                <div className="p-3 rounded-xl bg-[#3f6b52]/10 border border-[#3f6b52]/20 text-[#3f6b52] dark:text-[#8fbf9f] font-semibold text-[11px]">
                  {nlpPreview}
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Amount */}
              <div>
                <label className="block text-[#7c7057] dark:text-[#b8ac8e] font-bold mb-1">
                  จำนวนเงิน (บาท)
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  autoFocus
                  className="w-full p-2.5 rounded-xl bg-[#fbf7ee] dark:bg-[#2a2216] border border-[#ddceac] dark:border-[#4a3f2c] focus:outline-none font-mono text-base font-bold text-[#2c2618] dark:text-[#f5eedd]"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-[#7c7057] dark:text-[#b8ac8e] font-bold mb-1">
                  หมวดหมู่
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-[#fbf7ee] dark:bg-[#2a2216] border border-[#ddceac] dark:border-[#4a3f2c] focus:outline-none"
                >
                  {currentCategories.map((c) => (
                    <option key={c.categoryId} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* Note */}
              <div>
                <label className="block text-[#7c7057] dark:text-[#b8ac8e] font-bold mb-1">
                  โน้ตบันทึก
                </label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="เช่น มื้อเที่ยงกับเพื่อน, ซื้อของเข้าบ้าน"
                  className="w-full p-2.5 rounded-xl bg-[#fbf7ee] dark:bg-[#2a2216] border border-[#ddceac] dark:border-[#4a3f2c] focus:outline-none"
                />
              </div>
            </>
          )}

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[#7c7057] dark:text-[#b8ac8e] font-bold mb-1">วันที่</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-[#fbf7ee] dark:bg-[#2a2216] border border-[#ddceac] dark:border-[#4a3f2c] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[#7c7057] dark:text-[#b8ac8e] font-bold mb-1">เวลา</label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-[#fbf7ee] dark:bg-[#2a2216] border border-[#ddceac] dark:border-[#4a3f2c] focus:outline-none"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-[#ece1c4] dark:bg-[#362d1f] text-[#7c7057] dark:text-[#b8ac8e] font-bold cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl bg-[#3f6b52] hover:bg-[#2c4c3a] text-white font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Save className="w-4 h-4" />
              <span>{editingTransaction ? 'บันทึกแก้ไข' : 'บันทึกทันที'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
