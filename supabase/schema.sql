-- ==============================================================================
-- FINNOTE: SUPABASE POSTGRESQL SCHEMA (WITH ROW LEVEL SECURITY & INDEXES)
-- รันสคริปต์นี้ใน Supabase SQL Editor (Dashboard > SQL Editor > New Query > Run)
-- ==============================================================================

-- 1. สร้างตาราง PROFILES (ผูกกับ auth.users ของ Supabase)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger อัปเดต Profiles อัตโนมัติเมื่อมีการสมัครสมาชิกใหม่ผ่าน Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. สร้างตาราง CATEGORIES (หมวดหมู่รายรับ-รายจ่าย)
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  name TEXT NOT NULL,
  icon TEXT DEFAULT 'tag',
  color TEXT DEFAULT '#4f46e5',
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. สร้างตาราง TRANSACTIONS (บันทึกรายรับ-รายจ่าย)
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  amount NUMERIC(12, 2) NOT NULL CHECK (amount >= 0),
  category TEXT NOT NULL,
  note TEXT DEFAULT '',
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  source TEXT DEFAULT 'manual',
  recurring_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. สร้างตาราง BUDGETS (งบประมาณ)
CREATE TABLE IF NOT EXISTS public.budgets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  period TEXT NOT NULL DEFAULT 'monthly' CHECK (period IN ('daily', 'weekly', 'monthly', 'yearly')),
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  category TEXT DEFAULT '', -- ว่าง = งบรวมทุกหมวด
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. สร้างตาราง RECURRING (รายการประจำอัตโนมัติ)
CREATE TABLE IF NOT EXISTS public.recurring (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  category TEXT NOT NULL,
  note TEXT DEFAULT '',
  frequency TEXT NOT NULL DEFAULT 'monthly' CHECK (frequency IN ('daily', 'weekly', 'monthly', 'yearly')),
  next_run_date DATE NOT NULL,
  active BOOLEAN DEFAULT TRUE,
  last_run_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. สร้างตาราง SAVINGS_GOALS (เป้าหมายการออมเงิน)
CREATE TABLE IF NOT EXISTS public.savings_goals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  icon TEXT DEFAULT 'piggy-bank',
  target_amount NUMERIC(12, 2) NOT NULL CHECK (target_amount > 0),
  note TEXT DEFAULT '',
  archived BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. สร้างตาราง SAVINGS_LOGS (ประวัติการฝาก/ถอนเป้าหมายออมเงิน)
CREATE TABLE IF NOT EXISTS public.savings_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  savings_goal_id UUID REFERENCES public.savings_goals(id) ON DELETE CASCADE NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('deposit', 'withdraw')),
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  note TEXT DEFAULT '',
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. สร้างตาราง SETTINGS (การตั้งค่าผู้ใช้)
CREATE TABLE IF NOT EXISTS public.settings (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  dark_mode BOOLEAN DEFAULT FALSE,
  email_notifications BOOLEAN DEFAULT FALSE,
  reminder_time TEXT DEFAULT '20:00',
  budget_alert_threshold NUMERIC(5, 2) DEFAULT 80,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- INDEXES สำหรับเร่งความเร็วในการค้นหาและคำนวณ (Query Optimization)
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_tx_user_date ON public.transactions(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_tx_user_category ON public.transactions(user_id, category);
CREATE INDEX IF NOT EXISTS idx_budget_user ON public.budgets(user_id);
CREATE INDEX IF NOT EXISTS idx_savings_user ON public.savings_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_savings_logs_goal ON public.savings_logs(savings_goal_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_categories_user ON public.categories(user_id, type);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) - ความปลอดภัยแยกผู้ใช้แต่ละคนแบบ 100%
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recurring ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.savings_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.savings_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- นโยบาย RLS: ผู้ใช้จะเห็นและแก้ไขได้เฉพาะข้อมูลที่เป็นของตัวเอง (auth.uid() = user_id)
CREATE POLICY "Users can manage their profile" ON public.profiles FOR ALL USING (auth.uid() = id);
CREATE POLICY "Users can manage categories" ON public.categories FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage transactions" ON public.transactions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage budgets" ON public.budgets FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage recurring" ON public.recurring FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage savings goals" ON public.savings_goals FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage savings logs" ON public.savings_logs FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage settings" ON public.settings FOR ALL USING (auth.uid() = user_id);
