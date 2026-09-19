import React, { useState } from 'react';
import { 
  PiggyBank, 
  Plus, 
  Trash2, 
  Pencil, 
  ArrowDownToLine, 
  ArrowUpFromLine, 
  Sparkles,
  Plane,
  Home,
  Car,
  Target
} from 'lucide-react';
import { SavingsGoal, SavingsLog } from '../../types/finnote';
import { formatMoney, formatDateThai } from '../../utils/formatters';

interface SavingsViewProps {
  savingsGoals: SavingsGoal[];
  savingsLogs: SavingsLog[];
  onSaveGoal: (goal: SavingsGoal) => void;
  onDeleteGoal: (id: string) => void;
  onAddLog: (log: SavingsLog) => void;
}

export const SavingsView: React.FC<SavingsViewProps> = ({
  savingsGoals,
  savingsLogs,
  onSaveGoal,
  onDeleteGoal,
  onAddLog,
}) => {
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null);
  const [goalName, setGoalName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [goalNote, setGoalNote] = useState('');
  const [goalIcon, setGoalIcon] = useState('piggy-bank');

  // Deposit/Withdraw Modal
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [activeGoalForLog, setActiveGoalForLog] = useState<SavingsGoal | null>(null);
  const [logDirection, setLogDirection] = useState<'deposit' | 'withdraw'>('deposit');
  const [logAmount, setLogAmount] = useState('');
  const [logNote, setLogNote] = useState('');

  const totalSaved = savingsGoals.reduce((sum, g) => sum + Number(g.saved || 0), 0);
  const totalTarget = savingsGoals.reduce((sum, g) => sum + Number(g.targetAmount || 0), 0);
  const completedGoalsCount = savingsGoals.filter((g) => g.targetAmount > 0 && g.saved >= g.targetAmount).length;

  const handleOpenCreateGoal = () => {
    setEditingGoal(null);
    setGoalName('');
    setTargetAmount('');
    setGoalNote('');
    setGoalIcon('piggy-bank');
    setIsGoalModalOpen(true);
  };

  const handleOpenEditGoal = (g: SavingsGoal) => {
    setEditingGoal(g);
    setGoalName(g.name);
    setTargetAmount(g.targetAmount ? String(g.targetAmount) : '');
    setGoalNote(g.note || '');
    setGoalIcon(g.icon || 'piggy-bank');
    setIsGoalModalOpen(true);
  };

  const handleSaveGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalName.trim()) return;

    onSaveGoal({
      savingsGoalId: editingGoal ? editingGoal.savingsGoalId : 'sav_' + Date.now(),
      name: goalName.trim(),
      targetAmount: Number(targetAmount) || 0,
      saved: editingGoal ? editingGoal.saved : 0,
      note: goalNote.trim(),
      icon: goalIcon,
    });
    setIsGoalModalOpen(false);
  };

  const handleOpenLog = (g: SavingsGoal, direction: 'deposit' | 'withdraw') => {
    setActiveGoalForLog(g);
    setLogDirection(direction);
    setLogAmount('');
    setLogNote('');
    setIsLogModalOpen(true);
  };

  const handleSaveLog = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = Number(logAmount);
    if (!activeGoalForLog || !numAmount || numAmount <= 0) return;

    onAddLog({
      savingsLogId: 'svl_' + Date.now(),
      savingsGoalId: activeGoalForLog.savingsGoalId,
      direction: logDirection,
      amount: numAmount,
      note: logNote.trim(),
      date: new Date().toISOString().slice(0, 10),
    });
    setIsLogModalOpen(false);
  };

  const goalNameMap: Record<string, string> = {};
  savingsGoals.forEach((g) => { goalNameMap[g.savingsGoalId] = g.name; });

  return (
    <div className="space-y-6">
      {/* Top Hero Banner */}
      <div className="p-6 sm:p-7 rounded-3xl bg-[#fffefa] dark:bg-[#1e1811] border border-[#ddceac] dark:border-[#4a3f2c] shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[#a97a24]/15 text-[#a97a24] dark:text-[#dbb06c] flex items-center justify-center shrink-0">
            <PiggyBank className="w-7 h-7" />
          </div>
          <div>
            <p className="text-xs font-mono uppercase text-[#7c7057] dark:text-[#b8ac8e]">เงินออมสะสมทั้งหมด</p>
            <h2 className="text-3xl sm:text-4xl font-mono font-bold text-[#2c2618] dark:text-[#f5eedd]">
              {formatMoney(totalSaved)}
            </h2>
            <p className="text-xs text-[#7c7057] dark:text-[#b8ac8e] mt-1">
              จากเป้าหมายรวม {formatMoney(totalTarget)} ({completedGoalsCount} เป้าหมายสำเร็จแล้ว)
            </p>
          </div>
        </div>

        <button
          onClick={handleOpenCreateGoal}
          className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-[#3f6b52] hover:bg-[#2c4c3a] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>เพิ่มเป้าหมายการออม</span>
        </button>
      </div>

      {/* Goals Cards Grid */}
      <div>
        <h3 className="font-display font-bold text-base text-[#2c2618] dark:text-[#f5eedd] mb-3">
          เป้าหมายการออมของคุณ ({savingsGoals.length})
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {savingsGoals.length === 0 ? (
            <div className="col-span-full text-center py-12 rounded-3xl border border-dashed border-[#ddceac] dark:border-[#4a3f2c] bg-[#fffefa] dark:bg-[#1e1811] text-xs text-[#7c7057] dark:text-[#b8ac8e]">
              ยังไม่มีเป้าหมายการออม เริ่มต้นตั้งเป้าหมายแรกของคุณได้เลย!
            </div>
          ) : (
            savingsGoals.map((goal) => {
              const percent = goal.targetAmount > 0 ? Math.min(100, Math.round((goal.saved / goal.targetAmount) * 100)) : 0;
              const isCompleted = goal.targetAmount > 0 && goal.saved >= goal.targetAmount;

              return (
                <div 
                  key={goal.savingsGoalId}
                  className="p-5 rounded-3xl border border-[#ddceac] dark:border-[#4a3f2c] bg-[#fffefa] dark:bg-[#1e1811] shadow-sm flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        isCompleted 
                          ? 'bg-[#3f6b52]/15 text-[#3f6b52] dark:text-[#8fbf9f]' 
                          : 'bg-[#a97a24]/15 text-[#a97a24] dark:text-[#dbb06c]'
                      }`}>
                        {isCompleted ? 'สำเร็จแล้ว 🎉' : goal.targetAmount > 0 ? `${percent}%` : 'ไม่มีเป้าหมาย'}
                      </span>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEditGoal(goal)}
                          className="p-1 rounded-lg hover:bg-[#ece1c4] dark:hover:bg-[#362d1f] text-[#7c7057] dark:text-[#b8ac8e] transition-colors cursor-pointer"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteGoal(goal.savingsGoalId)}
                          className="p-1 rounded-lg hover:bg-[#a03f2c]/20 text-[#a03f2c] dark:text-[#e0916f] transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <h4 className="font-display font-bold text-base text-[#2c2618] dark:text-[#f5eedd]">
                      {goal.name}
                    </h4>
                    {goal.note && (
                      <p className="text-xs text-[#7c7057] dark:text-[#b8ac8e] mt-0.5">{goal.note}</p>
                    )}

                    <div className="mt-4 flex items-baseline justify-between font-mono">
                      <span className="text-xl font-bold text-[#3f6b52] dark:text-[#8fbf9f]">
                        {formatMoney(goal.saved)}
                      </span>
                      {goal.targetAmount > 0 && (
                        <span className="text-xs text-[#7c7057] dark:text-[#b8ac8e]">
                          เป้า {formatMoney(goal.targetAmount)}
                        </span>
                      )}
                    </div>

                    {goal.targetAmount > 0 && (
                      <div className="w-full h-2 rounded-full bg-[#ece1c4] dark:bg-[#362d1f] overflow-hidden mt-2">
                        <div 
                          className="h-full bg-[#a97a24] dark:bg-[#dbb06c] rounded-full transition-all duration-500"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Actions: Deposit & Withdraw */}
                  <div className="mt-5 pt-3 border-t border-[#ddceac]/40 dark:border-[#4a3f2c]/60 flex gap-2">
                    <button
                      onClick={() => handleOpenLog(goal, 'deposit')}
                      className="flex-1 py-1.5 rounded-xl bg-[#3f6b52]/10 hover:bg-[#3f6b52]/20 text-[#3f6b52] dark:text-[#8fbf9f] font-bold text-xs flex items-center justify-center gap-1 transition-colors cursor-pointer"
                    >
                      <ArrowDownToLine className="w-3.5 h-3.5" />
                      <span>ฝากเงิน</span>
                    </button>
                    <button
                      onClick={() => handleOpenLog(goal, 'withdraw')}
                      className="flex-1 py-1.5 rounded-xl bg-[#a03f2c]/10 hover:bg-[#a03f2c]/20 text-[#a03f2c] dark:text-[#e0916f] font-bold text-xs flex items-center justify-center gap-1 transition-colors cursor-pointer"
                    >
                      <ArrowUpFromLine className="w-3.5 h-3.5" />
                      <span>ถอนเงิน</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* History Log */}
      <div className="rounded-3xl border border-[#ddceac] dark:border-[#4a3f2c] bg-[#fffefa] dark:bg-[#1e1811] p-5 shadow-sm space-y-3">
        <h3 className="font-display font-bold text-sm text-[#2c2618] dark:text-[#f5eedd]">
          ประวัติการฝาก-ถอนเงินออม
        </h3>

        <div className="space-y-2">
          {savingsLogs.length === 0 ? (
            <p className="text-center py-6 text-xs text-[#7c7057] dark:text-[#b8ac8e]">ยังไม่มีประวัติการฝากถอน</p>
          ) : (
            savingsLogs.slice(0, 10).map((log) => {
              const isDeposit = log.direction === 'deposit';
              return (
                <div 
                  key={log.savingsLogId}
                  className="p-3 rounded-xl bg-[#fbf7ee] dark:bg-[#2a2216] border border-[#ddceac]/60 dark:border-[#4a3f2c] flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                      isDeposit ? 'bg-[#3f6b52]/15 text-[#3f6b52] dark:text-[#8fbf9f]' : 'bg-[#a03f2c]/15 text-[#a03f2c] dark:text-[#e0916f]'
                    }`}>
                      {isDeposit ? <ArrowDownToLine className="w-3.5 h-3.5" /> : <ArrowUpFromLine className="w-3.5 h-3.5" />}
                    </div>
                    <div>
                      <p className="font-bold text-[#2c2618] dark:text-[#f5eedd]">
                        {goalNameMap[log.savingsGoalId] || 'เงินออม'}
                      </p>
                      <p className="text-[10px] text-[#7c7057] dark:text-[#b8ac8e]">
                        {formatDateThai(log.date)} {log.note ? `· ${log.note}` : ''}
                      </p>
                    </div>
                  </div>

                  <span className={`font-mono font-bold ${
                    isDeposit ? 'text-[#3f6b52] dark:text-[#8fbf9f]' : 'text-[#a03f2c] dark:text-[#e0916f]'
                  }`}>
                    {isDeposit ? '+' : '-'}{formatMoney(log.amount)}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Goal Modal */}
      {isGoalModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="w-full max-w-md p-6 rounded-3xl bg-[#fffefa] dark:bg-[#1e1811] border border-[#ddceac] dark:border-[#4a3f2c] shadow-2xl space-y-4">
            <h3 className="font-display font-bold text-lg text-[#2c2618] dark:text-[#f5eedd]">
              {editingGoal ? 'แก้ไขเป้าหมายการออม' : 'เพิ่มเป้าหมายการออมใหม่'}
            </h3>

            <form onSubmit={handleSaveGoal} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[#7c7057] dark:text-[#b8ac8e] font-bold mb-1">ชื่อเป้าหมาย</label>
                <input
                  type="text"
                  required
                  value={goalName}
                  onChange={(e) => setGoalName(e.target.value)}
                  placeholder="เช่น เก็บเงินแต่งงาน, ออกรถใหม่, กองทุนสำรอง"
                  className="w-full p-2.5 rounded-xl bg-[#fbf7ee] dark:bg-[#2a2216] border border-[#ddceac] dark:border-[#4a3f2c] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[#7c7057] dark:text-[#b8ac8e] font-bold mb-1">จำนวนเป้าหมาย (บาท)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(e.target.value)}
                  placeholder="เช่น 50000 (หรือเว้นว่างถ้าไม่กำหนด)"
                  className="w-full p-2.5 rounded-xl bg-[#fbf7ee] dark:bg-[#2a2216] border border-[#ddceac] dark:border-[#4a3f2c] focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-[#7c7057] dark:text-[#b8ac8e] font-bold mb-1">โน้ตเพิ่มเติม</label>
                <textarea
                  rows={2}
                  value={goalNote}
                  onChange={(e) => setGoalNote(e.target.value)}
                  placeholder="รายละเอียดเพิ่มเติม..."
                  className="w-full p-2.5 rounded-xl bg-[#fbf7ee] dark:bg-[#2a2216] border border-[#ddceac] dark:border-[#4a3f2c] focus:outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsGoalModalOpen(false)}
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

      {/* Log Modal (Deposit/Withdraw) */}
      {isLogModalOpen && activeGoalForLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="w-full max-w-sm p-6 rounded-3xl bg-[#fffefa] dark:bg-[#1e1811] border border-[#ddceac] dark:border-[#4a3f2c] shadow-2xl space-y-4">
            <h3 className="font-display font-bold text-lg text-[#2c2618] dark:text-[#f5eedd]">
              {logDirection === 'deposit' ? 'ฝากเงินเข้า' : 'ถอนเงินจาก'}: {activeGoalForLog.name}
            </h3>

            <form onSubmit={handleSaveLog} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[#7c7057] dark:text-[#b8ac8e] font-bold mb-1">จำนวนเงิน (บาท)</label>
                <input
                  type="number"
                  required
                  min="1"
                  step="0.01"
                  value={logAmount}
                  onChange={(e) => setLogAmount(e.target.value)}
                  placeholder="0.00"
                  autoFocus
                  className="w-full p-2.5 rounded-xl bg-[#fbf7ee] dark:bg-[#2a2216] border border-[#ddceac] dark:border-[#4a3f2c] focus:outline-none font-mono text-base"
                />
              </div>

              {/* Quick Amount Pills */}
              <div className="flex gap-1.5 flex-wrap">
                {[500, 1000, 2000, 5000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setLogAmount(String(amt))}
                    className="px-2.5 py-1 rounded-lg bg-[#ece1c4] dark:bg-[#362d1f] text-[#7c7057] dark:text-[#b8ac8e] font-bold cursor-pointer hover:bg-[#ddceac]"
                  >
                    +{amt}
                  </button>
                ))}
              </div>

              <div>
                <label className="block text-[#7c7057] dark:text-[#b8ac8e] font-bold mb-1">โน้ต</label>
                <input
                  type="text"
                  value={logNote}
                  onChange={(e) => setLogNote(e.target.value)}
                  placeholder="เช่น เงินเก็บประจำเดือน, ออมเพิ่ม"
                  className="w-full p-2.5 rounded-xl bg-[#fbf7ee] dark:bg-[#2a2216] border border-[#ddceac] dark:border-[#4a3f2c] focus:outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsLogModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-[#ece1c4] dark:bg-[#362d1f] text-[#7c7057] dark:text-[#b8ac8e] font-bold cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#3f6b52] hover:bg-[#2c4c3a] text-white font-bold cursor-pointer"
                >
                  ยืนยัน
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
