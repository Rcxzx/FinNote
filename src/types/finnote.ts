export interface UserProfile {
  userId: string;
  email: string;
  displayName: string;
  profileImage?: string;
  createdAt?: string;
}

export interface Transaction {
  transactionId: string;
  userId?: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  note?: string;
  date: string;
  createdAt: string;
  source?: 'manual' | 'nlp' | 'ocr' | 'recurring';
  recurringId?: string;
}

export interface Budget {
  budgetId: string;
  userId?: string;
  period: 'daily' | 'weekly' | 'monthly';
  amount: number;
  category: string; // empty string means overall
  startDate: string;
  sortOrder?: number;
  spent?: number;
  remaining?: number;
  ratio?: number;
  percent?: number;
  overBudget?: boolean;
  periodStart?: string;
  periodEnd?: string;
}

export interface RecurringItem {
  recurringId: string;
  userId?: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  note?: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  nextRunDate: string;
  active: boolean;
  createdAt?: string;
}

export interface SavingsGoal {
  savingsGoalId: string;
  userId?: string;
  name: string;
  icon: string;
  targetAmount: number;
  saved: number;
  note?: string;
  completed?: boolean;
  percent?: number;
  remaining?: number;
  createdAt?: string;
}

export interface SavingsLog {
  savingsLogId: string;
  userId?: string;
  savingsGoalId: string;
  direction: 'deposit' | 'withdraw';
  amount: number;
  note?: string;
  date: string;
  createdAt?: string;
}

export interface CategoryItem {
  categoryId: string;
  userId?: string;
  type: 'income' | 'expense';
  name: string;
  icon: string;
  color: string;
  sortOrder: number;
}

export interface AppSettings {
  darkMode: boolean;
  emailNotifications: boolean;
  reminderTime: string;
  budgetAlertThreshold: number;
}

export interface AppStateData {
  user: UserProfile;
  settings: AppSettings;
  categories: {
    expense: CategoryItem[];
    income: CategoryItem[];
  };
  transactions: Transaction[];
  budgets: Budget[];
  recurring: RecurringItem[];
  savingsGoals: SavingsGoal[];
  savingsLogs: SavingsLog[];
}
