import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  ListChecks, 
  Gauge, 
  PiggyBank, 
  Repeat, 
  BarChart3, 
  Settings as SettingsIcon, 
  Plus, 
  Moon, 
  Sun,
  Database,
  ArrowLeft,
  Sparkles
} from 'lucide-react';
import { DashboardView } from './components/finnote/DashboardView';
import { TransactionsView } from './components/finnote/TransactionsView';
import { BudgetView } from './components/finnote/BudgetView';
import { SavingsView } from './components/finnote/SavingsView';
import { RecurringView } from './components/finnote/RecurringView';
import { AnalyticsView } from './components/finnote/AnalyticsView';
import { SettingsView } from './components/finnote/SettingsView';
import { TransactionModal } from './components/finnote/TransactionModal';

// Optional Migration Hub Components
import { MigrationRoadmap } from './components/MigrationRoadmap';
import { SqlSchemaViewer } from './components/SqlSchemaViewer';
import { GasMigratorViewer } from './components/GasMigratorViewer';
import { SupabaseTester } from './components/SupabaseTester';
import { VercelGuide } from './components/VercelGuide';
import { ProjectExportHub } from './components/ProjectExportHub';

import { 
  INITIAL_CATEGORIES, 
  INITIAL_TRANSACTIONS, 
  INITIAL_BUDGETS, 
  INITIAL_SAVINGS_GOALS, 
  INITIAL_SAVINGS_LOGS, 
  INITIAL_RECURRING 
} from './data/initialData';
import { Transaction, Budget, SavingsGoal, SavingsLog, RecurringItem, CategoryItem, AppSettings, UserProfile } from './types/finnote';
import { getSupabase } from './lib/supabase';

type FinNoteTab = 'dashboard' | 'transactions' | 'budget' | 'savings' | 'recurring' | 'analytics' | 'settings';
type MigrationTab = 'roadmap' | 'sql' | 'migrator' | 'tester' | 'vercel' | 'export';

export default function App() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [activeTab, setActiveTab] = useState<FinNoteTab>('dashboard');
  const [showMigrationHub, setShowMigrationHub] = useState(false);
  const [migrationActiveTab, setMigrationActiveTab] = useState<MigrationTab>('roadmap');

  // FinNote State
  const [user, setUser] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('finnote_user');
    return saved ? JSON.parse(saved) : { userId: 'usr_me', email: 'me@finnote.app', displayName: 'สมุดของฉัน' };
  });

  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('finnote_settings');
    return saved ? JSON.parse(saved) : { darkMode: false, emailNotifications: true, reminderTime: '20:00', budgetAlertThreshold: 0.8 };
  });

  const [categories, setCategories] = useState<{ expense: CategoryItem[]; income: CategoryItem[] }>(() => {
    const saved = localStorage.getItem('finnote_categories');
    return saved ? JSON.parse(saved) : INITIAL_CATEGORIES;
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('finnote_transactions');
    return saved ? JSON.parse(saved) : INITIAL_TRANSACTIONS;
  });

  const [budgets, setBudgets] = useState<Budget[]>(() => {
    const saved = localStorage.getItem('finnote_budgets');
    return saved ? JSON.parse(saved) : INITIAL_BUDGETS;
  });

  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>(() => {
    const saved = localStorage.getItem('finnote_savings_goals');
    return saved ? JSON.parse(saved) : INITIAL_SAVINGS_GOALS;
  });

  const [savingsLogs, setSavingsLogs] = useState<SavingsLog[]>(() => {
    const saved = localStorage.getItem('finnote_savings_logs');
    return saved ? JSON.parse(saved) : INITIAL_SAVINGS_LOGS;
  });

  const [recurring, setRecurring] = useState<RecurringItem[]>(() => {
    const saved = localStorage.getItem('finnote_recurring');
    return saved ? JSON.parse(saved) : INITIAL_RECURRING;
  });

  // Modal State
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);

  // Persistence
  useEffect(() => {
    localStorage.setItem('finnote_transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('finnote_budgets', JSON.stringify(budgets));
  }, [budgets]);

  useEffect(() => {
    localStorage.setItem('finnote_savings_goals', JSON.stringify(savingsGoals));
  }, [savingsGoals]);

  useEffect(() => {
    localStorage.setItem('finnote_savings_logs', JSON.stringify(savingsLogs));
  }, [savingsLogs]);

  useEffect(() => {
    localStorage.setItem('finnote_recurring', JSON.stringify(recurring));
  }, [recurring]);

  useEffect(() => {
    localStorage.setItem('finnote_categories', JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem('finnote_user', JSON.stringify(user));
  }, [user]);

  useEffect(() => {
    localStorage.setItem('finnote_settings', JSON.stringify(settings));
  }, [settings]);

  // Sync dark mode class
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Handlers for Transactions
  const handleSaveTransaction = (tx: Transaction) => {
    if (editingTx) {
      setTransactions((prev) => prev.map((t) => (t.transactionId === tx.transactionId ? tx : t)));
    } else {
      setTransactions((prev) => [tx, ...prev]);
    }
    setEditingTx(null);
  };

  const handleDeleteTransaction = (id: string) => {
    setTransactions((prev) => prev.filter((t) => t.transactionId !== id));
  };

  const handleEditTransaction = (tx: Transaction) => {
    setEditingTx(tx);
    setIsTxModalOpen(true);
  };

  // Handlers for Budgets
  const handleSaveBudget = (b: Budget) => {
    setBudgets((prev) => {
      const exists = prev.some((item) => item.budgetId === b.budgetId);
      if (exists) {
        return prev.map((item) => (item.budgetId === b.budgetId ? b : item));
      }
      return [...prev, b];
    });
  };

  const handleDeleteBudget = (id: string) => {
    setBudgets((prev) => prev.filter((b) => b.budgetId !== id));
  };

  // Handlers for Savings
  const handleSaveGoal = (goal: SavingsGoal) => {
    setSavingsGoals((prev) => {
      const exists = prev.some((g) => g.savingsGoalId === goal.savingsGoalId);
      if (exists) {
        return prev.map((g) => (g.savingsGoalId === goal.savingsGoalId ? goal : g));
      }
      return [...prev, goal];
    });
  };

  const handleDeleteGoal = (id: string) => {
    setSavingsGoals((prev) => prev.filter((g) => g.savingsGoalId !== id));
  };

  const handleAddSavingsLog = (log: SavingsLog) => {
    setSavingsLogs((prev) => [log, ...prev]);
    setSavingsGoals((prev) =>
      prev.map((g) => {
        if (g.savingsGoalId === log.savingsGoalId) {
          const delta = log.direction === 'deposit' ? log.amount : -log.amount;
          return { ...g, saved: Math.max(0, g.saved + delta) };
        }
        return g;
      })
    );
  };

  // Handlers for Recurring
  const handleSaveRecurring = (item: RecurringItem) => {
    setRecurring((prev) => [...prev, item]);
  };

  const handleDeleteRecurring = (id: string) => {
    setRecurring((prev) => prev.filter((r) => r.recurringId !== id));
  };

  // Handlers for Categories
  const handleAddCategory = (cat: CategoryItem) => {
    setCategories((prev) => ({
      ...prev,
      [cat.type]: [...prev[cat.type], cat],
    }));
  };

  const handleDeleteCategory = (id: string) => {
    setCategories((prev) => ({
      expense: prev.expense.filter((c) => c.categoryId !== id),
      income: prev.income.filter((c) => c.categoryId !== id),
    }));
  };

  const handleExportCsv = () => {
    const headers = ['วันที่', 'ประเภท', 'หมวดหมู่', 'จำนวนเงิน', 'โน้ต'];
    const rows = transactions.map((t) => [
      t.date,
      t.type === 'income' ? 'รายรับ' : 'รายจ่าย',
      t.category,
      t.amount,
      t.note || '',
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.map((val) => `"${val}"`).join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `finnote-transactions-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const navTabs: { id: FinNoteTab; label: string; icon: React.ElementType }[] = [
    { id: 'dashboard', label: 'แดชบอร์ด', icon: LayoutDashboard },
    { id: 'transactions', label: 'ประวัติรายการ', icon: ListChecks },
    { id: 'budget', label: 'งบประมาณ', icon: Gauge },
    { id: 'savings', label: 'เงินออม', icon: PiggyBank },
    { id: 'recurring', label: 'รายการประจำ', icon: Repeat },
    { id: 'analytics', label: 'สถิติวิเคราะห์', icon: BarChart3 },
    { id: 'settings', label: 'ตั้งค่า', icon: SettingsIcon },
  ];

  const todayLabel = new Intl.DateTimeFormat('th-TH', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  return (
    <div className="min-h-screen bg-[#f4ecd8] dark:bg-[#16120c] text-[#2c2618] dark:text-[#f5eedd] paper-grain transition-colors pb-24 lg:pb-8">
      {/* Top App Header */}
      <header className="sticky top-0 z-30 border-b border-[#ddceac] dark:border-[#4a3f2c] bg-[#fffdf6]/90 dark:bg-[#1e1811]/90 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#2c4c3a] text-white flex items-center justify-center font-display font-bold text-lg shadow-sm border-2 border-[#fffdf6]">
              ฿
            </div>
            <div>
              <h1 className="font-display font-bold text-xl tracking-tight leading-none text-[#2c2618] dark:text-[#f5eedd]">
                FinNote
              </h1>
              <p className="text-[11px] text-[#7c7057] dark:text-[#b8ac8e] leading-tight">
                สมุดบันทึกรายรับ-รายจ่าย
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {showMigrationHub ? (
              <button
                onClick={() => setShowMigrationHub(false)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#3f6b52] text-white text-xs font-bold shadow-sm cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>กลับสู่แอปจดบันทึก</span>
              </button>
            ) : (
              <button
                onClick={() => setShowMigrationHub(true)}
                className="hidden sm:inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#ddceac]/40 dark:bg-[#4a3f2c]/50 text-[#7c7057] dark:text-[#b8ac8e] text-xs font-bold hover:bg-[#ddceac] transition-colors cursor-pointer"
                title="ดูคำสั่ง SQL, สคริปต์ย้ายข้อมูล และการตั้งค่า Vercel"
              >
                <Database className="w-3.5 h-3.5 text-[#a97a24]" />
                <span>เครื่องมือย้ายระบบ (Migration Hub)</span>
              </button>
            )}

            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 rounded-xl border border-[#ddceac] dark:border-[#4a3f2c] bg-[#fffefa] dark:bg-[#2a2216] text-[#7c7057] dark:text-[#b8ac8e] hover:text-[#2c2618] cursor-pointer"
              title="สลับโหมดมืด/สว่าง"
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-6">
        {showMigrationHub ? (
          /* Migration Hub View */
          <div className="space-y-6">
            <div className="p-5 rounded-2xl bg-white dark:bg-[#1e1811] border border-[#ddceac] dark:border-[#4a3f2c] flex items-center justify-between">
              <div>
                <h2 className="font-display font-bold text-lg text-[#2c2618] dark:text-[#f5eedd]">
                  FinNote Migration & Deployment Hub
                </h2>
                <p className="text-xs text-[#7c7057] dark:text-[#b8ac8e]">
                  เครื่องมือสำหรับย้ายข้อมูลจาก Google Sheets สู่ Supabase และ Deploy บน Vercel
                </p>
              </div>
              <button
                onClick={() => setShowMigrationHub(false)}
                className="px-4 py-2 rounded-xl bg-[#3f6b52] text-white text-xs font-bold cursor-pointer"
              >
                กลับไปหน้าแอพจดบันทึก
              </button>
            </div>

            {/* Migration Sub-navigation */}
            <div className="flex gap-2 overflow-x-auto pb-2 border-b border-[#ddceac]">
              <button
                onClick={() => setMigrationActiveTab('roadmap')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer ${
                  migrationActiveTab === 'roadmap' ? 'bg-[#3f6b52] text-white' : 'bg-white dark:bg-[#2a2216]'
                }`}
              >
                แผนงาน (Roadmap)
              </button>
              <button
                onClick={() => setMigrationActiveTab('sql')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer ${
                  migrationActiveTab === 'sql' ? 'bg-[#3f6b52] text-white' : 'bg-white dark:bg-[#2a2216]'
                }`}
              >
                SQL Schema
              </button>
              <button
                onClick={() => setMigrationActiveTab('migrator')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer ${
                  migrationActiveTab === 'migrator' ? 'bg-[#3f6b52] text-white' : 'bg-white dark:bg-[#2a2216]'
                }`}
              >
                สคริปต์ย้ายข้อมูล (GAS)
              </button>
              <button
                onClick={() => setMigrationActiveTab('tester')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer ${
                  migrationActiveTab === 'tester' ? 'bg-[#3f6b52] text-white' : 'bg-white dark:bg-[#2a2216]'
                }`}
              >
                ทดสอบเชื่อมต่อ Live
              </button>
              <button
                onClick={() => setMigrationActiveTab('vercel')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer ${
                  migrationActiveTab === 'vercel' ? 'bg-[#3f6b52] text-white' : 'bg-white dark:bg-[#2a2216]'
                }`}
              >
                คู่มือ Vercel
              </button>
              <button
                onClick={() => setMigrationActiveTab('export')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer ${
                  migrationActiveTab === 'export' ? 'bg-[#3f6b52] text-white' : 'bg-white dark:bg-[#2a2216]'
                }`}
              >
                ดาวน์โหลด ZIP
              </button>
            </div>

            {migrationActiveTab === 'roadmap' && <MigrationRoadmap onNavigateTab={(tab: any) => setMigrationActiveTab(tab)} onCopyText={() => {}} copiedId={null} />}
            {migrationActiveTab === 'sql' && <SqlSchemaViewer onCopyText={() => {}} copiedId={null} />}
            {migrationActiveTab === 'migrator' && <GasMigratorViewer onCopyText={() => {}} copiedId={null} />}
            {migrationActiveTab === 'tester' && <SupabaseTester />}
            {migrationActiveTab === 'vercel' && <VercelGuide onCopyText={() => {}} copiedId={null} />}
            {migrationActiveTab === 'export' && <ProjectExportHub onCopyText={() => {}} copiedId={null} />}
          </div>
        ) : (
          /* Actual FinNote Notebook View */
          <div className="space-y-6">
            {/* View Header & Date */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
              <div>
                <p className="text-xs font-mono font-bold uppercase text-[#3f6b52] dark:text-[#8fbf9f] tracking-wider">
                  {todayLabel}
                </p>
                <h2 className="text-3xl font-display font-bold text-[#2c2618] dark:text-[#f5eedd] tracking-tight">
                  {navTabs.find((t) => t.id === activeTab)?.label}
                </h2>
              </div>

              {/* Desktop Tabs */}
              <nav className="hidden lg:flex items-center gap-1 p-1 rounded-2xl bg-[#fffefa] dark:bg-[#1e1811] border border-[#ddceac] dark:border-[#4a3f2c] shadow-xs text-xs font-bold">
                {navTabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`px-3 py-2 rounded-xl inline-flex items-center gap-1.5 transition-all cursor-pointer ${
                        isActive
                          ? 'bg-[#3f6b52] text-white shadow-sm'
                          : 'text-[#7c7057] dark:text-[#b8ac8e] hover:text-[#2c2618] dark:hover:text-[#f5eedd]'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Tab Views */}
            {activeTab === 'dashboard' && (
              <DashboardView
                transactions={transactions}
                budgets={budgets}
                categories={categories}
                onNavigate={(t) => setActiveTab(t as any)}
                onOpenAddModal={() => {
                  setEditingTx(null);
                  setIsTxModalOpen(true);
                }}
              />
            )}

            {activeTab === 'transactions' && (
              <TransactionsView
                transactions={transactions}
                onDeleteTransaction={handleDeleteTransaction}
                onEditTransaction={handleEditTransaction}
              />
            )}

            {activeTab === 'budget' && (
              <BudgetView
                budgets={budgets}
                transactions={transactions}
                categories={categories.expense}
                onSaveBudget={handleSaveBudget}
                onDeleteBudget={handleDeleteBudget}
              />
            )}

            {activeTab === 'savings' && (
              <SavingsView
                savingsGoals={savingsGoals}
                savingsLogs={savingsLogs}
                onSaveGoal={handleSaveGoal}
                onDeleteGoal={handleDeleteGoal}
                onAddLog={handleAddSavingsLog}
              />
            )}

            {activeTab === 'recurring' && (
              <RecurringView
                recurringItems={recurring}
                categories={categories}
                onSaveRecurring={handleSaveRecurring}
                onDeleteRecurring={handleDeleteRecurring}
              />
            )}

            {activeTab === 'analytics' && (
              <AnalyticsView
                transactions={transactions}
                budgets={budgets}
                categories={categories}
              />
            )}

            {activeTab === 'settings' && (
              <SettingsView
                user={user}
                settings={settings}
                categories={categories}
                onUpdateProfile={(name) => setUser((p) => ({ ...p, displayName: name }))}
                onUpdateSettings={(s) => setSettings(s)}
                onAddCategory={handleAddCategory}
                onDeleteCategory={handleDeleteCategory}
                onExportCsv={handleExportCsv}
                onOpenMigrationHub={() => setShowMigrationHub(true)}
              />
            )}
          </div>
        )}
      </main>

      {/* Floating Action Button for Quick Add */}
      {!showMigrationHub && (
        <button
          onClick={() => {
            setEditingTx(null);
            setIsTxModalOpen(true);
          }}
          className="fixed bottom-20 lg:bottom-8 right-6 lg:right-10 z-40 w-14 h-14 rounded-full bg-[#a97a24] hover:bg-[#8f671e] text-slate-950 font-bold shadow-xl flex items-center justify-center transition-transform hover:scale-105 active:scale-95 cursor-pointer border-2 border-[#fffdf6]"
          title="จดบันทึกทันที"
        >
          <Plus className="w-7 h-7" />
        </button>
      )}

      {/* Mobile Bottom Navigation Bar */}
      {!showMigrationHub && (
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 border-t border-[#ddceac] dark:border-[#4a3f2c] bg-[#fffdf6]/95 dark:bg-[#1e1811]/95 backdrop-blur-md px-2 py-1.5 flex items-center justify-around text-[10px] font-bold">
          {navTabs.slice(0, 5).map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center gap-1 py-1 px-2 rounded-xl transition-colors cursor-pointer ${
                  isActive ? 'text-[#3f6b52] dark:text-[#8fbf9f]' : 'text-[#7c7057] dark:text-[#b8ac8e]'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex flex-col items-center gap-1 py-1 px-2 rounded-xl transition-colors cursor-pointer ${
              activeTab === 'settings' ? 'text-[#3f6b52] dark:text-[#8fbf9f]' : 'text-[#7c7057] dark:text-[#b8ac8e]'
            }`}
          >
            <SettingsIcon className="w-4 h-4" />
            <span>ตั้งค่า</span>
          </button>
        </nav>
      )}

      {/* Transaction Modal */}
      <TransactionModal
        isOpen={isTxModalOpen}
        onClose={() => setIsTxModalOpen(false)}
        onSave={handleSaveTransaction}
        categories={categories}
        editingTransaction={editingTx}
      />
    </div>
  );
}
