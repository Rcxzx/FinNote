import { CategoryItem, Transaction, Budget, SavingsGoal, SavingsLog, RecurringItem } from '../types/finnote';

export const INITIAL_CATEGORIES: { expense: CategoryItem[]; income: CategoryItem[] } = {
  expense: [
    { categoryId: 'cat_food', name: 'อาหาร', icon: 'utensils', color: '#c4635a', type: 'expense', sortOrder: 0 },
    { categoryId: 'cat_travel', name: 'เดินทาง', icon: 'car', color: '#a97a24', type: 'expense', sortOrder: 1 },
    { categoryId: 'cat_shop', name: 'ช้อปปิ้ง', icon: 'shopping-bag', color: '#8a6fb0', type: 'expense', sortOrder: 2 },
    { categoryId: 'cat_home', name: 'ที่อยู่อาศัย', icon: 'home', color: '#3f6b8a', type: 'expense', sortOrder: 3 },
    { categoryId: 'cat_health', name: 'สุขภาพ', icon: 'heart-pulse', color: '#c25a7c', type: 'expense', sortOrder: 4 },
    { categoryId: 'cat_edu', name: 'การศึกษา', icon: 'graduation-cap', color: '#2c7a6b', type: 'expense', sortOrder: 5 },
    { categoryId: 'cat_ent', name: 'บันเทิง', icon: 'clapperboard', color: '#b0793f', type: 'expense', sortOrder: 6 },
    { categoryId: 'cat_other', name: 'อื่นๆ', icon: 'shapes', color: '#7a7a72', type: 'expense', sortOrder: 7 },
  ],
  income: [
    { categoryId: 'cat_salary', name: 'เงินเดือน', icon: 'briefcase', color: '#3f6b52', type: 'income', sortOrder: 0 },
    { categoryId: 'cat_free', name: 'ฟรีแลนซ์', icon: 'laptop', color: '#3f6b8a', type: 'income', sortOrder: 1 },
    { categoryId: 'cat_invest', name: 'ลงทุน', icon: 'trending-up', color: '#2c7a6b', type: 'income', sortOrder: 2 },
    { categoryId: 'cat_bonus', name: 'โบนัส', icon: 'gift', color: '#a97a24', type: 'income', sortOrder: 3 },
    { categoryId: 'cat_sales', name: 'ขายของ', icon: 'shopping-bag', color: '#8a6fb0', type: 'income', sortOrder: 4 },
    { categoryId: 'cat_gift', name: 'ของขวัญ', icon: 'heart', color: '#c25a7c', type: 'income', sortOrder: 5 },
    { categoryId: 'cat_inc_other', name: 'อื่นๆ', icon: 'shapes', color: '#7a7a72', type: 'income', sortOrder: 6 },
  ],
};

export const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    transactionId: 'txn_init_1',
    type: 'income',
    amount: 35000,
    category: 'เงินเดือน',
    note: 'เงินเดือนประจำเดือน',
    date: new Date().toISOString().slice(0, 7) + '-01',
    createdAt: new Date().toISOString(),
    source: 'manual',
  },
  {
    transactionId: 'txn_init_2',
    type: 'expense',
    amount: 120,
    category: 'อาหาร',
    note: 'ข้าวกะเพราไข่ดาว + กาแฟ',
    date: new Date().toISOString().slice(0, 10),
    createdAt: new Date().toISOString(),
    source: 'manual',
  },
  {
    transactionId: 'txn_init_3',
    type: 'expense',
    amount: 50,
    category: 'เดินทาง',
    note: 'BTS ไปทำงาน',
    date: new Date().toISOString().slice(0, 10),
    createdAt: new Date().toISOString(),
    source: 'manual',
  },
  {
    transactionId: 'txn_init_4',
    type: 'expense',
    amount: 450,
    category: 'ช้อปปิ้ง',
    note: 'ของใช้เข้าหอ',
    date: new Date(Date.now() - 86400000).toISOString().slice(0, 10),
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    source: 'manual',
  },
];

export const INITIAL_BUDGETS: Budget[] = [
  {
    budgetId: 'bud_init_overall',
    period: 'monthly',
    amount: 15000,
    category: '', // งบรวม
    startDate: new Date().toISOString().slice(0, 7) + '-01',
    sortOrder: 0,
  },
  {
    budgetId: 'bud_init_food',
    period: 'monthly',
    amount: 6000,
    category: 'อาหาร',
    startDate: new Date().toISOString().slice(0, 7) + '-01',
    sortOrder: 1,
  },
];

export const INITIAL_SAVINGS_GOALS: SavingsGoal[] = [
  {
    savingsGoalId: 'sav_init_1',
    name: 'กองทุนฉุกเฉิน 6 เดือน',
    icon: 'piggy-bank',
    targetAmount: 50000,
    saved: 12500,
    note: 'เก็บสำรองยามจำเป็น',
  },
  {
    savingsGoalId: 'sav_init_2',
    name: 'ทริปเที่ยวญี่ปุ่น',
    icon: 'plane',
    targetAmount: 30000,
    saved: 8000,
    note: 'ปลายปีนี้',
  },
];

export const INITIAL_SAVINGS_LOGS: SavingsLog[] = [
  {
    savingsLogId: 'svl_init_1',
    savingsGoalId: 'sav_init_1',
    direction: 'deposit',
    amount: 12500,
    note: 'เงินเก็บตั้งต้น',
    date: new Date().toISOString().slice(0, 7) + '-01',
  },
  {
    savingsLogId: 'svl_init_2',
    savingsGoalId: 'sav_init_2',
    direction: 'deposit',
    amount: 8000,
    note: 'โบนัสแบ่งมาออม',
    date: new Date().toISOString().slice(0, 7) + '-01',
  },
];

export const INITIAL_RECURRING: RecurringItem[] = [
  {
    recurringId: 'rec_init_1',
    type: 'expense',
    amount: 4500,
    category: 'ที่อยู่อาศัย',
    note: 'ค่าหอพัก/คอนโด',
    frequency: 'monthly',
    nextRunDate: new Date().toISOString().slice(0, 7) + '-25',
    active: true,
  },
];
