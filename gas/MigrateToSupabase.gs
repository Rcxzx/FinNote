/**
 * ==============================================================================
 * SCRIPT ย้ายข้อมูลจาก GOOGLE SHEETS ไปยัง SUPABASE (1-CLICK DATA MIGRATOR)
 * ==============================================================================
 * วิธีใช้งาน:
 * 1. คัดลอกโค้ดนี้ไปสร้างเป็นไฟล์ใหม่ชื่อ MigrateToSupabase.gs ใน Google Apps Script
 * 2. กรอกค่า SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY และ TARGET_USER_UUID ด้านล่าง
 * 3. เลือกฟังก์ชัน "migrateAllDataToSupabase" แล้วกดปุ่ม Run (เรียกใช้)
 * ==============================================================================
 */

// ⚙️ กำหนดค่าการเชื่อมต่อ Supabase ของคุณ
const MIGRATION_CONFIG = {
  // หาได้จาก Supabase Dashboard > Project Settings > API > Project URL
  supabaseUrl: 'https://xxxxxxxxxxxxxxxx.supabase.co',
  
  // หาได้จาก Supabase Dashboard > Project Settings > API > service_role key (secret)
  // หมายเหตุ: ใช้ service_role key เฉพาะตอนรัน migration ใน Apps Script เพื่อข้าม RLS ได้อย่างราบรื่น
  supabaseServiceRoleKey: 'YOUR_SUPABASE_SERVICE_ROLE_KEY',
  
  // [ทางเลือกที่ 1 - แนะนำที่สุด]: ใส่อีเมลของคุณด้านล่าง สคริปต์จะค้นหา UUID หรือสร้าง User ให้คุณอัตโนมัติ 100%!
  userEmail: 'user@example.com',
  userPassword: 'ChangeMe123456!', // รหัสผ่านเริ่มต้น หากยังไม่มี user ในระบบสคริปต์จะสร้างให้ทันที

  // [ทางเลือกที่ 2]: หากมี UUID จากเมนู Authentication > Users อยู่แล้ว สามารถใส่ตรงนี้ได้เลย (ถ้าใส่จะใช้อันนี้ก่อน)
  targetUserUuid: '',
};

/**
 * ดึงหรือสร้าง User UUID ให้อัตโนมัติ ป้องกันปัญหาไม่มี UUID ในระบบ
 */
function resolveUserUuid_() {
  // 1. ถ้าผู้ใช้กรอก targetUserUuid ไว้อยู่แล้ว ให้ใช้ค่านั้น
  if (MIGRATION_CONFIG.targetUserUuid && MIGRATION_CONFIG.targetUserUuid !== 'YOUR_SUPABASE_USER_UUID' && MIGRATION_CONFIG.targetUserUuid.trim() !== '') {
    return MIGRATION_CONFIG.targetUserUuid.trim();
  }

  // 2. ถ้าไม่ได้กรอก UUID แต่มี userEmail ให้ค้นหาหรือสร้างใหม่ผ่าน Supabase Admin Auth API
  const email = (MIGRATION_CONFIG.userEmail || '').trim();
  if (!email || email === 'user@example.com') {
    throw new Error('กรุณาระบุ targetUserUuid หรือ userEmail ใน MIGRATION_CONFIG บรรทัดบนสุด');
  }

  Logger.log(`🔍 กำลังค้นหาบัญชีผู้ใช้สำหรับอีเมล: ${email}...`);

  // ดึงรายการ Users จาก Supabase Auth Admin API
  const listUrl = `${MIGRATION_CONFIG.supabaseUrl}/auth/v1/admin/users?page=1&per_page=50`;
  const headers = {
    'apikey': MIGRATION_CONFIG.supabaseServiceRoleKey,
    'Authorization': `Bearer ${MIGRATION_CONFIG.supabaseServiceRoleKey}`,
    'Content-Type': 'application/json'
  };

  try {
    const listRes = UrlFetchApp.fetch(listUrl, {
      method: 'get',
      headers: headers,
      muteHttpExceptions: true
    });

    if (listRes.getResponseCode() === 200) {
      const data = JSON.parse(listRes.getContentText());
      const users = data.users || [];
      const found = users.find(u => u.email && u.email.toLowerCase() === email.toLowerCase());
      if (found && found.id) {
        Logger.log(`✨ พบบัญชีผู้ใช้เดิมแล้ว! UUID คือ: ${found.id}`);
        return found.id;
      }
    }

    // 3. หากยังไม่พบบัญชี ให้สร้างบัญชีผู้ใช้ใหม่ผ่าน Admin API ทันที (Email Confirm อัตโนมัติ)
    Logger.log(`💡 ยังไม่พบบัญชีสำหรับ ${email} กำลังสร้างผู้ใช้ใหม่อัตโนมัติ...`);
    const createUrl = `${MIGRATION_CONFIG.supabaseUrl}/auth/v1/admin/users`;
    const createPayload = {
      email: email,
      password: MIGRATION_CONFIG.userPassword || 'FinNote2026!',
      email_confirm: true,
      user_metadata: {
        display_name: email.split('@')[0]
      }
    };

    const createRes = UrlFetchApp.fetch(createUrl, {
      method: 'post',
      headers: headers,
      payload: JSON.stringify(createPayload),
      muteHttpExceptions: true
    });

    const createCode = createRes.getResponseCode();
    if (createCode >= 200 && createCode < 300) {
      const newUser = JSON.parse(createRes.getContentText());
      Logger.log(`🎉 สร้าง User สำเร็จเรียบร้อย! UUID คือ: ${newUser.id}`);
      return newUser.id;
    } else {
      throw new Error(`ไม่สามารถสร้าง User อัตโนมัติได้ (${createCode}): ${createRes.getContentText()}`);
    }
  } catch (err) {
    throw new Error(`เกิดข้อผิดพลาดในการตรวจสอบ User UUID: ${err.message}`);
  }
}

/**
 * ฟังก์ชันทดสอบการเชื่อมต่อกับ Supabase
 */
function testSupabaseConnection() {
  const url = `${MIGRATION_CONFIG.supabaseUrl}/rest/v1/profiles?select=count`;
  const options = {
    method: 'get',
    headers: {
      'apikey': MIGRATION_CONFIG.supabaseServiceRoleKey,
      'Authorization': `Bearer ${MIGRATION_CONFIG.supabaseServiceRoleKey}`,
    },
    muteHttpExceptions: true,
  };

  try {
    const response = UrlFetchApp.fetch(url, options);
    const code = response.getResponseCode();
    if (code === 200 || code === 206) {
      Logger.log('✅ เชื่อมต่อ Supabase สำเร็จ!');
      return { success: true, message: 'เชื่อมต่อ Supabase สำเร็จ!' };
    } else {
      Logger.log(`❌ เชื่อมต่อไม่สำเร็จ (HTTP ${code}): ${response.getContentText()}`);
      return { success: false, error: response.getContentText() };
    }
  } catch (err) {
    Logger.log(`❌ Error: ${err.message}`);
    return { success: false, error: err.message };
  }
}

/**
 * ฟังก์ชันหลัก: ย้ายข้อมูลทั้งหมดจาก Google Sheets เข้า Supabase
 */
function migrateAllDataToSupabase() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const summary = {
    categories: 0,
    transactions: 0,
    budgets: 0,
    savingsGoals: 0,
    savingsLogs: 0,
  };

  Logger.log('🚀 เริ่มต้นกระบวนการย้ายข้อมูลจาก Google Sheets ไป Supabase...');

  // ดึงหรือสร้าง User UUID อัตโนมัติ (ไม่ต้องกังวลเรื่องไม่มี UUID)
  const activeUserUuid = resolveUserUuid_();
  Logger.log(`🎯 ผูกข้อมูลทั้งหมดเข้ากับ User UUID: ${activeUserUuid}`);

  // 1. ย้าย Categories (หมวดหมู่)
  const catSheet = ss.getSheetByName('Categories');
  if (catSheet && catSheet.getLastRow() > 1) {
    const rows = getSheetDataObjects_(catSheet);
    const catPayload = rows.map(r => ({
      user_id: activeUserUuid,
      type: (r.type || 'expense').toLowerCase(),
      name: String(r.name || '').trim(),
      icon: r.icon || 'tag',
      color: r.color || '#4f46e5',
      sort_order: Number(r.sortOrder || 0),
    })).filter(c => c.name);

    if (catPayload.length > 0) {
      postToSupabaseBatch_('categories', catPayload);
      summary.categories = catPayload.length;
      Logger.log(`✅ ย้าย Categories เรียบร้อย (${catPayload.length} รายการ)`);
    }
  }

  // 2. ย้าย Savings Goals (เป้าหมายออมเงิน)
  const goalSheet = ss.getSheetByName('SavingsGoals');
  const goalIdMap = {}; // เก่า -> ใหม่

  if (goalSheet && goalSheet.getLastRow() > 1) {
    const rows = getSheetDataObjects_(goalSheet);
    rows.forEach(r => {
      const payload = {
        user_id: activeUserUuid,
        name: String(r.name || 'เป้าหมายออมเงิน'),
        icon: r.icon || 'piggy-bank',
        target_amount: Number(r.targetAmount || 0),
        note: r.note || '',
        archived: Boolean(r.archived),
      };
      const res = postToSupabaseSingle_('savings_goals', payload);
      if (res && res.id) {
        goalIdMap[r.savingsGoalId] = res.id;
        summary.savingsGoals++;
      }
    });
    Logger.log(`✅ ย้าย Savings Goals เรียบร้อย (${summary.savingsGoals} เป้าหมาย)`);
  }

  // 3. ย้าย Savings Logs (ประวัติฝากถอนออมเงิน)
  const logSheet = ss.getSheetByName('SavingsLogs');
  if (logSheet && logSheet.getLastRow() > 1) {
    const rows = getSheetDataObjects_(logSheet);
    const logPayload = rows.map(r => {
      const newGoalId = goalIdMap[r.savingsGoalId];
      if (!newGoalId) return null;
      return {
        user_id: activeUserUuid,
        savings_goal_id: newGoalId,
        direction: (r.direction || 'deposit').toLowerCase(),
        amount: Number(r.amount || 0),
        note: r.note || '',
        date: formatDateIso_(r.date),
      };
    }).filter(Boolean);

    if (logPayload.length > 0) {
      postToSupabaseBatch_('savings_logs', logPayload);
      summary.savingsLogs = logPayload.length;
      Logger.log(`✅ ย้าย Savings Logs เรียบร้อย (${logPayload.length} รายการ)`);
    }
  }

  // 4. ย้าย Budgets (งบประมาณ)
  const budgetSheet = ss.getSheetByName('Budget');
  if (budgetSheet && budgetSheet.getLastRow() > 1) {
    const rows = getSheetDataObjects_(budgetSheet);
    const budgetPayload = rows.map(r => ({
      user_id: activeUserUuid,
      period: (r.period || 'monthly').toLowerCase(),
      amount: Number(r.amount || 0),
      category: r.category || '',
      start_date: formatDateIso_(r.startDate),
      sort_order: Number(r.sortOrder || 0),
    })).filter(b => b.amount > 0);

    if (budgetPayload.length > 0) {
      postToSupabaseBatch_('budgets', budgetPayload);
      summary.budgets = budgetPayload.length;
      Logger.log(`✅ ย้าย Budgets เรียบร้อย (${budgetPayload.length} งบประมาณ)`);
    }
  }

  // 5. ย้าย Transactions (รายการรายรับ-รายจ่าย)
  const txSheet = ss.getSheetByName('Transactions');
  if (txSheet && txSheet.getLastRow() > 1) {
    const rows = getSheetDataObjects_(txSheet);
    const txPayload = rows.map(r => ({
      user_id: activeUserUuid,
      type: (r.type || 'expense').toLowerCase(),
      amount: Number(r.amount || 0),
      category: r.category || 'ทั่วไป',
      note: r.note || '',
      date: formatDateIso_(r.date),
      source: r.source || 'migration_gas',
    })).filter(t => t.amount > 0);

    if (txPayload.length > 0) {
      // แบ่ง batch ทีละ 100 รายการ เพื่อไม่ให้เกิน payload limit
      const chunkSize = 100;
      for (let i = 0; i < txPayload.length; i += chunkSize) {
        const chunk = txPayload.slice(i, i + chunkSize);
        postToSupabaseBatch_('transactions', chunk);
      }
      summary.transactions = txPayload.length;
      Logger.log(`✅ ย้าย Transactions เรียบร้อย (${txPayload.length} รายการ)`);
    }
  }

  const resultMsg = `🎉 การย้ายข้อมูลเสร็จสมบูรณ์!\n` +
    `- หมวดหมู่ (Categories): ${summary.categories} รายการ\n` +
    `- ธุรกรรม (Transactions): ${summary.transactions} รายการ\n` +
    `- งบประมาณ (Budgets): ${summary.budgets} รายการ\n` +
    `- เป้าหมายออมเงิน (Savings Goals): ${summary.savingsGoals} รายการ\n` +
    `- บันทึกการออมเงิน (Savings Logs): ${summary.savingsLogs} รายการ`;

  Logger.log(resultMsg);
  try {
    SpreadsheetApp.getUi().alert('การย้ายข้อมูลไป Supabase', resultMsg, SpreadsheetApp.getUi().ButtonSet.OK);
  } catch (e) {
    // กรณีรันจาก Trigger หรือ Script Editor ตรงๆ
  }

  return summary;
}

// ---------------- Helper Functions ----------------

function getSheetDataObjects_(sheet) {
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];
  const headers = data[0].map(h => String(h).trim());
  return data.slice(1).map(row => {
    const obj = {};
    headers.forEach((h, idx) => { obj[h] = row[idx]; });
    return obj;
  });
}

function formatDateIso_(dateVal) {
  if (!dateVal) return new Date().toISOString().slice(0, 10);
  if (dateVal instanceof Date) {
    return Utilities.formatDate(dateVal, Session.getScriptTimeZone() || 'Asia/Bangkok', 'yyyy-MM-dd');
  }
  const str = String(dateVal).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) return str.slice(0, 10);
  return new Date().toISOString().slice(0, 10);
}

function postToSupabaseBatch_(table, records) {
  const url = `${MIGRATION_CONFIG.supabaseUrl}/rest/v1/${table}`;
  const options = {
    method: 'post',
    contentType: 'application/json',
    headers: {
      'apikey': MIGRATION_CONFIG.supabaseServiceRoleKey,
      'Authorization': `Bearer ${MIGRATION_CONFIG.supabaseServiceRoleKey}`,
      'Prefer': 'return=minimal',
    },
    payload: JSON.stringify(records),
    muteHttpExceptions: true,
  };

  const response = UrlFetchApp.fetch(url, options);
  const code = response.getResponseCode();
  if (code < 200 || code >= 300) {
    Logger.log(`⚠️ ส่งข้อมูล ${table} เกิดข้อผิดพลาด (${code}): ${response.getContentText()}`);
  }
}

function postToSupabaseSingle_(table, record) {
  const url = `${MIGRATION_CONFIG.supabaseUrl}/rest/v1/${table}`;
  const options = {
    method: 'post',
    contentType: 'application/json',
    headers: {
      'apikey': MIGRATION_CONFIG.supabaseServiceRoleKey,
      'Authorization': `Bearer ${MIGRATION_CONFIG.supabaseServiceRoleKey}`,
      'Prefer': 'return=representation',
    },
    payload: JSON.stringify(record),
    muteHttpExceptions: true,
  };

  const response = UrlFetchApp.fetch(url, options);
  const code = response.getResponseCode();
  if (code >= 200 && code < 300) {
    const body = JSON.parse(response.getContentText());
    return Array.isArray(body) ? body[0] : body;
  } else {
    Logger.log(`⚠️ ข้อผิดพลาดตาราง ${table} (${code}): ${response.getContentText()}`);
    return null;
  }
}
