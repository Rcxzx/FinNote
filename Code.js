const APP = {
  name: 'FinNote',
  tokenTtlSeconds: 21600,
  maxLoginAttempts: 5,
  lockoutMinutes: 15,
  sheets: {
    users: 'Users',
    transactions: 'Transactions',
    budgets: 'Budget',
    recurring: 'Recurring',
    settings: 'Settings',
    savingsGoals: 'SavingsGoals',
    savingsLogs: 'SavingsLogs',
    categories: 'Categories',
  },
  headers: {
    Users: ['userId', 'email', 'passwordHash', 'passwordSalt', 'displayName', 'profileImage', 'createdAt', 'updatedAt', 'lastLogin', 'rememberTokenHash', 'failedLoginCount', 'lockedUntil'],
    Transactions: ['transactionId', 'userId', 'type', 'amount', 'category', 'note', 'date', 'createdAt', 'source', 'recurringId'],
    Budget: ['budgetId', 'userId', 'period', 'amount', 'category', 'startDate', 'sortOrder', 'createdAt', 'updatedAt'],
    Recurring: ['recurringId', 'userId', 'type', 'amount', 'category', 'note', 'frequency', 'nextRunDate', 'active', 'createdAt', 'updatedAt', 'lastRunAt'],
    Settings: ['userId', 'darkMode', 'emailNotifications', 'reminderTime', 'budgetAlertThreshold', 'createdAt', 'updatedAt', 'lastReminderSentDate', 'lastStreakAlertSentDate', 'lastBudgetAlertSentKey'],
    SavingsGoals: ['savingsGoalId', 'userId', 'name', 'icon', 'targetAmount', 'note', 'archived', 'createdAt', 'updatedAt'],
    SavingsLogs: ['savingsLogId', 'userId', 'savingsGoalId', 'direction', 'amount', 'note', 'date', 'createdAt'],
    Categories: ['categoryId', 'userId', 'type', 'name', 'icon', 'color', 'sortOrder', 'createdAt', 'updatedAt'],
  },
};

// In-memory request cache to minimize redundant Sheets API read/write calls
const _MEM_CACHE = {};

function doGet() {
  return HtmlService.createTemplateFromFile('Index')
    .evaluate()
    .setTitle(APP.name)
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1, viewport-fit=cover');
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

function install() {
  setupSheets();
  formatSheets_();
  setupAutomationTriggers();
  return { ok: true, message: 'ติดตั้งชีตและระบบทำงานอัตโนมัติเรียบร้อยแล้ว' };
}

function setupSheets() {
  const ss = getSpreadsheet_();
  Object.keys(APP.headers).forEach(function (sheetName) {
    const sheet = ss.getSheetByName(sheetName) || ss.insertSheet(sheetName);
    const headers = APP.headers[sheetName];
    const lastCol = sheet.getLastColumn();
    const existing = lastCol ? sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(String) : [];

    if (!existing.length || existing.every(function (cell) { return !cell; })) {
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    } else {
      headers.forEach(function (header) {
        if (existing.indexOf(header) < 0) {
          sheet.getRange(1, sheet.getLastColumn() + 1).setValue(header);
        }
      });
    }
  });
  CacheService.getScriptCache().put('sheets_initialized', 'true', 21600);
}

function formatSheets_() {
  const ss = getSpreadsheet_();
  Object.keys(APP.headers).forEach(function (sheetName) {
    const sheet = ss.getSheetByName(sheetName);
    if (!sheet || !sheet.getLastColumn()) return;
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, sheet.getLastColumn()).setFontWeight('bold').setBackground('#eef2ff');
    sheet.autoResizeColumns(1, sheet.getLastColumn());
  });
}

function setupAutomationTriggers() {
  const managed = ['processRecurringTransactions', 'processEmailNotifications'];
  ScriptApp.getProjectTriggers().forEach(function (trigger) {
    if (managed.indexOf(trigger.getHandlerFunction()) >= 0) {
      ScriptApp.deleteTrigger(trigger);
    }
  });

  ScriptApp.newTrigger('processRecurringTransactions').timeBased().everyHours(1).create();
  ScriptApp.newTrigger('processEmailNotifications').timeBased().everyMinutes(15).create();
}

function registerUser(payload) {
  payload = payload || {};
  const email = normalizeEmail_(payload.email);
  const password = String(payload.password || '');
  const displayName = sanitizeText_(payload.displayName || email.split('@')[0], 80);
  const pin = String(payload.pin || '').trim();

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('กรุณากรอกอีเมลให้ถูกต้อง');
  if (password.length < 8) throw new Error('รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร');

  const users = getSheetData_(APP.sheets.users);
  if (users.rows.some(function (row) { return normalizeEmail_(row.email) === email; })) {
    throw new Error('อีเมลนี้ถูกสมัครใช้งานแล้ว');
  }

  const pinCacheKey = getRegistrationPinKey_(email);
  if (!pin) {
    const registrationPin = createRegistrationPin_();
    CacheService.getScriptCache().put(pinCacheKey, hashRegistrationPin_(email, registrationPin), 600);
    GmailApp.sendEmail(
      email,
      'FinNote: PIN ยืนยันอีเมล',
      'PIN สำหรับยืนยันอีเมลของคุณคือ ' + registrationPin + '\n\nรหัสนี้จะหมดอายุภายใน 10 นาที\n\n- FinNote'
    );
    return {
      ok: true,
      requiresPin: true,
      email: email,
      message: 'ส่ง PIN ไปยังอีเมลแล้ว กรุณาตรวจสอบกล่องจดหมาย',
    };
  }

  const expectedPinHash = CacheService.getScriptCache().get(pinCacheKey);
  if (!expectedPinHash || expectedPinHash !== hashRegistrationPin_(email, pin)) {
    throw new Error('PIN ไม่ถูกต้องหรือหมดอายุ กรุณาขอรหัสใหม่');
  }
  CacheService.getScriptCache().remove(pinCacheKey);

  const now = nowIso_();
  const salt = makeId_('salt');
  const userId = makeId_('usr');
  const passwordHash = hashPassword_(password, salt);

  appendObject_(APP.sheets.users, {
    userId: userId,
    email: email,
    passwordHash: passwordHash,
    passwordSalt: salt,
    displayName: displayName,
    profileImage: sanitizeImage_(payload.profileImage || ''),
    createdAt: now,
    updatedAt: now,
    lastLogin: now,
    rememberTokenHash: '',
  });

  appendObject_(APP.sheets.settings, {
    userId: userId,
    darkMode: false,
    emailNotifications: false,
    reminderTime: '20:00',
    budgetAlertThreshold: 0.8,
    createdAt: now,
    updatedAt: now,
    lastReminderSentDate: '',
    lastStreakAlertSentDate: '',
    lastBudgetAlertSentKey: '',
  });

  ensureCategoriesSeeded_(userId);

  const rememberToken = issueRememberToken_(userId);
  return createSessionResponse_(getUserById_(userId), rememberToken);
}

function loginUser(payload) {
  payload = payload || {};
  const email = normalizeEmail_(payload.email);
  const password = String(payload.password || '');
  const users = getSheetData_(APP.sheets.users);
  const user = users.rows.find(function (row) { return normalizeEmail_(row.email) === email; });

  if (user && user.lockedUntil && String(user.lockedUntil) > nowIso_()) {
    const minutesLeft = Math.max(1, Math.ceil((new Date(user.lockedUntil).getTime() - Date.now()) / 60000));
    throw new Error('บัญชีนี้ถูกล็อกชั่วคราวเนื่องจากใส่รหัสผ่านผิดหลายครั้งเกินไป กรุณาลองใหม่อีกครั้งในอีกประมาณ ' + minutesLeft + ' นาที หรือกด "ลืมรหัสผ่าน?" เพื่อตั้งรหัสผ่านใหม่');
  }

  if (!user || hashPassword_(password, user.passwordSalt) !== user.passwordHash) {
    if (user) {
      const failedCount = Number(user.failedLoginCount || 0) + 1;
      const patch = { failedLoginCount: failedCount, updatedAt: nowIso_() };
      if (failedCount >= APP.maxLoginAttempts) {
        patch.lockedUntil = Utilities.formatDate(
          new Date(Date.now() + APP.lockoutMinutes * 60000),
          Session.getScriptTimeZone(),
          "yyyy-MM-dd'T'HH:mm:ssXXX"
        );
        patch.failedLoginCount = 0;
      }
      updateObjectByKey_(APP.sheets.users, 'userId', user.userId, patch);
    }
    throw new Error('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
  }

  updateObjectByKey_(APP.sheets.users, 'userId', user.userId, {
    lastLogin: nowIso_(),
    updatedAt: nowIso_(),
    failedLoginCount: 0,
    lockedUntil: '',
  });
  const rememberToken = issueRememberToken_(user.userId);
  return createSessionResponse_(getUserById_(user.userId), rememberToken);
}

function requestPasswordReset(email) {
  const normalizedEmail = normalizeEmail_(email);
  const generic = { ok: true, message: 'หากอีเมลนี้มีอยู่ในระบบ เราได้ส่ง PIN สำหรับตั้งรหัสผ่านใหม่ไปให้ทางอีเมลแล้ว' };
  if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) return generic;

  const user = getSheetData_(APP.sheets.users).rows.find(function (row) { return normalizeEmail_(row.email) === normalizedEmail; });
  if (!user) return generic;

  const pin = createRegistrationPin_();
  CacheService.getScriptCache().put(getPasswordResetPinKey_(normalizedEmail), hashResetPin_(normalizedEmail, pin), 600);
  GmailApp.sendEmail(
    normalizedEmail,
    'FinNote: PIN สำหรับตั้งรหัสผ่านใหม่',
    'PIN สำหรับตั้งรหัสผ่านใหม่ของคุณคือ ' + pin + '\n\nรหัสนี้จะหมดอายุภายใน 10 นาที หากคุณไม่ได้ร้องขอ กรุณาเพิกเฉยต่ออีเมลนี้ได้เลย\n\n- FinNote'
  );
  return generic;
}

function resetPasswordWithPin(payload) {
  payload = payload || {};
  const email = normalizeEmail_(payload.email);
  const pin = String(payload.pin || '').trim();
  const newPassword = String(payload.newPassword || '');

  if (newPassword.length < 8) throw new Error('รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร');

  const cacheKey = getPasswordResetPinKey_(email);
  const expectedHash = CacheService.getScriptCache().get(cacheKey);
  if (!expectedHash || expectedHash !== hashResetPin_(email, pin)) {
    throw new Error('PIN ไม่ถูกต้องหรือหมดอายุ กรุณาขอรหัสใหม่');
  }

  const user = getSheetData_(APP.sheets.users).rows.find(function (row) { return normalizeEmail_(row.email) === email; });
  if (!user) throw new Error('ไม่พบบัญชีผู้ใช้นี้');

  CacheService.getScriptCache().remove(cacheKey);

  const salt = makeId_('salt');
  updateObjectByKey_(APP.sheets.users, 'userId', user.userId, {
    passwordHash: hashPassword_(newPassword, salt),
    passwordSalt: salt,
    updatedAt: nowIso_(),
    failedLoginCount: 0,
    lockedUntil: '',
  });

  const rememberToken = issueRememberToken_(user.userId);
  return createSessionResponse_(getUserById_(user.userId), rememberToken);
}

function resumeSession(rememberToken) {
  const token = String(rememberToken || '').trim();
  if (!token) throw new Error('ไม่พบข้อมูลการเข้าสู่ระบบก่อนหน้า กรุณาเข้าสู่ระบบใหม่');

  const hash = hashSecret_(token, 'remember-token');
  const user = getSheetData_(APP.sheets.users).rows.find(function (row) {
    return row.rememberTokenHash && row.rememberTokenHash === hash;
  });
  if (!user) throw new Error('เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่');

  updateObjectByKey_(APP.sheets.users, 'userId', user.userId, {
    lastLogin: nowIso_(),
    updatedAt: nowIso_(),
  });
  return createSessionResponse_(getUserById_(user.userId), token);
}

function logoutUser(token) {
  if (token) {
    const userId = CacheService.getScriptCache().get('session:' + token);
    if (userId) {
      updateObjectByKey_(APP.sheets.users, 'userId', userId, {
        rememberTokenHash: '',
        updatedAt: nowIso_(),
      });
    }
    CacheService.getScriptCache().remove('session:' + token);
  }
  return { ok: true };
}

function getAppData(token) {
  const user = requireUser_(token);
  return buildAppData_(user.userId);
}

function updateProfile(token, payload) {
  const user = requireUser_(token);
  payload = payload || {};
  const patch = {
    displayName: sanitizeText_(payload.displayName || user.displayName, 80),
    updatedAt: nowIso_(),
  };
  if (payload.profileImage !== undefined) patch.profileImage = sanitizeImage_(payload.profileImage);
  updateObjectByKey_(APP.sheets.users, 'userId', user.userId, patch);
  return buildAppData_(user.userId);
}

function saveTransaction(token, payload) {
  const user = requireUser_(token);
  payload = payload || {};
  const type = String(payload.type || '').toLowerCase();
  const amount = Number(payload.amount);
  const category = sanitizeText_(payload.category, 80);
  const date = normalizeDateInput_(payload.date || new Date());

  if (['income', 'expense'].indexOf(type) < 0) throw new Error('ประเภทเงินไม่ถูกต้อง');
  if (!amount || amount <= 0) throw new Error('จำนวนเงินต้องมากกว่า 0');
  if (!category) throw new Error('กรุณาเลือกหมวดหมู่');

  appendObject_(APP.sheets.transactions, {
    transactionId: makeId_('txn'),
    userId: user.userId,
    type: type,
    amount: roundMoney_(amount),
    category: category,
    note: sanitizeText_(payload.note || '', 300),
    date: date,
    createdAt: payload.time ? composeDateTimeIso_(date, payload.time) : nowIso_(),
    source: payload.source || 'manual',
    recurringId: payload.recurringId || '',
  });
  ensureCategoryExists_(user.userId, type, category);

  return buildAppData_(user.userId);
}

function saveTransactions(token, payloads) {
  const user = requireUser_(token);
  payloads = Array.isArray(payloads) ? payloads : [];
  if (!payloads.length) throw new Error('ไม่มีรายการสำหรับบันทึก');

  const rowsToAppend = [];
  const categoriesToCheck = [];

  payloads.forEach(function (payload) {
    payload = payload || {};
    const type = String(payload.type || '').toLowerCase();
    const amount = Number(payload.amount);
    const category = sanitizeText_(payload.category, 80);
    const date = normalizeDateInput_(payload.date || new Date());

    if (['income', 'expense'].indexOf(type) < 0) throw new Error('ประเภทเงินไม่ถูกต้อง');
    if (!amount || amount <= 0) throw new Error('จำนวนเงินต้องมากกว่า 0');
    if (!category) throw new Error('กรุณาเลือกหมวดหมู่');

    rowsToAppend.push({
      transactionId: makeId_('txn'),
      userId: user.userId,
      type: type,
      amount: roundMoney_(amount),
      category: category,
      note: sanitizeText_(payload.note || '', 300),
      date: date,
      createdAt: payload.time ? composeDateTimeIso_(date, payload.time) : nowIso_(),
      source: payload.source || 'manual',
      recurringId: payload.recurringId || '',
    });
    categoriesToCheck.push({ type: type, name: category });
  });

  appendObjectsBatch_(APP.sheets.transactions, rowsToAppend);
  categoriesToCheck.forEach(function (cat) {
    ensureCategoryExists_(user.userId, cat.type, cat.name);
  });

  return buildAppData_(user.userId);
}

function updateTransaction(token, transactionId, payload) {
  const user = requireUser_(token);
  payload = payload || {};
  const row = getSheetData_(APP.sheets.transactions).rows.find(function (item) {
    return item.transactionId === transactionId && item.userId === user.userId;
  });
  if (!row) throw new Error('ไม่พบรายการที่ต้องการแก้ไข');

  const type = String(payload.type || '').toLowerCase();
  const amount = Number(payload.amount);
  const category = sanitizeText_(payload.category, 80);
  const date = normalizeDateInput_(payload.date || new Date());

  if (['income', 'expense'].indexOf(type) < 0) throw new Error('ประเภทเงินไม่ถูกต้อง');
  if (!amount || amount <= 0) throw new Error('จำนวนเงินต้องมากกว่า 0');
  if (!category) throw new Error('กรุณาเลือกหมวดหมู่');

  const patch = {
    type: type,
    amount: roundMoney_(amount),
    category: category,
    note: sanitizeText_(payload.note || '', 300),
    date: date,
  };
  if (payload.time) patch.createdAt = composeDateTimeIso_(date, payload.time);
  updateObjectByKey_(APP.sheets.transactions, 'transactionId', transactionId, patch);
  ensureCategoryExists_(user.userId, type, category);

  return buildAppData_(user.userId);
}

function deleteTransaction(token, transactionId) {
  const user = requireUser_(token);
  const tx = getSheetData_(APP.sheets.transactions);
  const row = tx.rows.find(function (item) {
    return item.transactionId === transactionId && item.userId === user.userId;
  });
  if (!row) throw new Error('ไม่พบรายการที่ต้องการลบ');
  deleteRowByNumber_(APP.sheets.transactions, row._rowNumber);
  return buildAppData_(user.userId);
}

function saveBudget(token, payload) {
  const user = requireUser_(token);
  return saveBudgetForUser_(user.userId, payload || {});
}

function saveBudgetForUser_(userId, payload) {
  const period = String(payload.period || '').toLowerCase();
  const amount = Number(payload.amount);
  const category = sanitizeText_(payload.category || '', 80);
  if (['daily', 'weekly', 'monthly'].indexOf(period) < 0) throw new Error('รูปแบบงบประมาณไม่ถูกต้อง');
  if (!amount || amount <= 0) throw new Error('วงเงินงบประมาณต้องมากกว่า 0');

  const now = nowIso_();
  const budgets = getSheetData_(APP.sheets.budgets).rows
    .filter(function (row) { return row.userId === userId && row.period === period && String(row.category || '') === category; })
    .sort(function (a, b) { return String(b.updatedAt).localeCompare(String(a.updatedAt)); });

  if (budgets.length) {
    updateObjectByKey_(APP.sheets.budgets, 'budgetId', budgets[0].budgetId, {
      amount: roundMoney_(amount),
      startDate: normalizeDateInput_(payload.startDate || new Date()),
      updatedAt: now,
    });
  } else {
    appendObject_(APP.sheets.budgets, {
      budgetId: makeId_('bud'),
      userId: userId,
      period: period,
      amount: roundMoney_(amount),
      category: category,
      startDate: normalizeDateInput_(payload.startDate || new Date()),
      sortOrder: getNextBudgetSortOrder_(userId),
      createdAt: now,
      updatedAt: now,
    });
  }
  if (category) ensureCategoryExists_(userId, 'expense', category);
  return buildAppData_(userId);
}

function getNextBudgetSortOrder_(userId) {
  const orders = getSheetData_(APP.sheets.budgets).rows
    .filter(function (row) { return row.userId === userId; })
    .map(function (row) { return Number(row.sortOrder); })
    .filter(function (value) { return !isNaN(value); });
  return orders.length ? Math.max.apply(null, orders) + 1 : 0;
}

function ensureBudgetSortOrder_(userId) {
  const rows = getSheetData_(APP.sheets.budgets).rows.filter(function (row) { return row.userId === userId; });
  const missing = rows.filter(function (row) { return row.sortOrder === '' || row.sortOrder === undefined || row.sortOrder === null || isNaN(Number(row.sortOrder)); });
  if (!missing.length) return;
  missing.sort(function (a, b) { return String(a.createdAt).localeCompare(String(b.createdAt)); });
  const existingOrders = rows
    .map(function (row) { return Number(row.sortOrder); })
    .filter(function (value) { return !isNaN(value); });
  let next = existingOrders.length ? Math.max.apply(null, existingOrders) + 1 : 0;
  missing.forEach(function (row) {
    updateObjectByKey_(APP.sheets.budgets, 'budgetId', row.budgetId, { sortOrder: next });
    next += 1;
  });
}

function reorderBudgets(token, orderedIds) {
  const user = requireUser_(token);
  if (!Array.isArray(orderedIds)) throw new Error('ลำดับงบประมาณไม่ถูกต้อง');

  const budgetsData = getSheetData_(APP.sheets.budgets);
  const userBudgetMap = {};
  budgetsData.rows.forEach(function (row) {
    if (row.userId === user.userId) userBudgetMap[row.budgetId] = row;
  });

  const orderMap = {};
  orderedIds.forEach(function (id, idx) { orderMap[id] = idx; });

  const sheet = getSheet_(APP.sheets.budgets);
  const colIndex = budgetsData.headers.indexOf('sortOrder') + 1;
  if (colIndex > 0) {
    budgetsData.rows.forEach(function (row) {
      if (row.userId === user.userId && orderMap[row.budgetId] !== undefined) {
        sheet.getRange(row._rowNumber, colIndex).setValue(orderMap[row.budgetId]);
        row.sortOrder = orderMap[row.budgetId];
      }
    });
  }
  return buildAppData_(user.userId);
}

function updateBudget(token, budgetId, payload) {
  const user = requireUser_(token);
  payload = payload || {};
  const period = String(payload.period || '').toLowerCase();
  const amount = Number(payload.amount);
  const category = sanitizeText_(payload.category || '', 80);
  if (['daily', 'weekly', 'monthly'].indexOf(period) < 0) throw new Error('รูปแบบงบประมาณไม่ถูกต้อง');
  if (!amount || amount <= 0) throw new Error('วงเงินงบประมาณต้องมากกว่า 0');

  const budget = getSheetData_(APP.sheets.budgets).rows.find(function (row) {
    return row.budgetId === budgetId && row.userId === user.userId;
  });
  if (!budget) throw new Error('ไม่พบงบประมาณที่ต้องการแก้ไข');

  updateObjectByKey_(APP.sheets.budgets, 'budgetId', budgetId, {
    period: period,
    amount: roundMoney_(amount),
    category: category,
    startDate: normalizeDateInput_(payload.startDate || budget.startDate || new Date()),
    updatedAt: nowIso_(),
  });
  if (category) ensureCategoryExists_(user.userId, 'expense', category);
  return buildAppData_(user.userId);
}

function deleteBudget(token, budgetId) {
  const user = requireUser_(token);
  const budget = getSheetData_(APP.sheets.budgets).rows.find(function (row) {
    return row.budgetId === budgetId && row.userId === user.userId;
  });
  if (!budget) throw new Error('ไม่พบงบประมาณที่ต้องการลบ');
  deleteRowByNumber_(APP.sheets.budgets, budget._rowNumber);
  return buildAppData_(user.userId);
}

function saveRecurring(token, payload) {
  const user = requireUser_(token);
  payload = payload || {};
  const type = String(payload.type || '').toLowerCase();
  const frequency = String(payload.frequency || '').toLowerCase();
  const amount = Number(payload.amount);
  const category = sanitizeText_(payload.category, 80);
  if (['income', 'expense'].indexOf(type) < 0) throw new Error('ประเภทเงินไม่ถูกต้อง');
  if (['daily', 'weekly', 'monthly'].indexOf(frequency) < 0) throw new Error('รอบความถี่ไม่ถูกต้อง');
  if (!amount || amount <= 0) throw new Error('จำนวนเงินต้องมากกว่า 0');
  if (!category) throw new Error('กรุณาเลือกหมวดหมู่');

  const now = nowIso_();
  const recurringId = payload.recurringId || makeId_('rec');
  const existing = payload.recurringId ? getSheetData_(APP.sheets.recurring).rows.find(function(r) { return r.recurringId === payload.recurringId; }) : null;
  const row = {
    recurringId: recurringId,
    userId: user.userId,
    type: type,
    amount: roundMoney_(amount),
    category: category,
    note: sanitizeText_(payload.note || '', 300),
    frequency: frequency,
    nextRunDate: normalizeDateInput_(payload.nextRunDate || new Date()),
    active: payload.active === undefined ? true : Boolean(payload.active),
    updatedAt: now,
  };

  if (existing && existing.userId === user.userId) {
    updateObjectByKey_(APP.sheets.recurring, 'recurringId', recurringId, row);
  } else {
    row.createdAt = now;
    row.lastRunAt = '';
    appendObject_(APP.sheets.recurring, row);
  }
  ensureCategoryExists_(user.userId, type, category);
  return buildAppData_(user.userId);
}

function deleteRecurring(token, recurringId) {
  const user = requireUser_(token);
  const recurring = getSheetData_(APP.sheets.recurring).rows.find(function (row) {
    return row.recurringId === recurringId && row.userId === user.userId;
  });
  if (!recurring) throw new Error('ไม่พบรายการอัตโนมัติ');
  deleteRowByNumber_(APP.sheets.recurring, recurring._rowNumber);
  return buildAppData_(user.userId);
}

// ============ หมวดหมู่ (Categories) ============
const DEFAULT_CATEGORIES = {
  expense: [
    { name: 'อาหาร', icon: 'utensils', color: '#c4635a' },
    { name: 'เดินทาง', icon: 'car', color: '#a97a24' },
    { name: 'ช้อปปิ้ง', icon: 'shopping-bag', color: '#8a6fb0' },
    { name: 'ที่อยู่อาศัย', icon: 'home', color: '#3f6b8a' },
    { name: 'สุขภาพ', icon: 'heart-pulse', color: '#c25a7c' },
    { name: 'การศึกษา', icon: 'graduation-cap', color: '#2c7a6b' },
    { name: 'บันเทิง', icon: 'clapperboard', color: '#b0793f' },
    { name: 'อื่นๆ', icon: 'shapes', color: '#7a7a72' },
  ],
  income: [
    { name: 'เงินเดือน', icon: 'briefcase', color: '#3f6b52' },
    { name: 'ฟรีแลนซ์', icon: 'laptop', color: '#3f6b8a' },
    { name: 'ลงทุน', icon: 'trending-up', color: '#2c7a6b' },
    { name: 'โบนัส', icon: 'gift', color: '#a97a24' },
    { name: 'ขายของ', icon: 'shopping-bag', color: '#8a6fb0' },
    { name: 'ของขวัญ', icon: 'heart', color: '#c25a7c' },
    { name: 'อื่นๆ', icon: 'shapes', color: '#7a7a72' },
  ],
};
const FALLBACK_CATEGORY_ICON = 'tag';
const FALLBACK_CATEGORY_COLOR = '#7a7a72';

function ensureCategoriesSeeded_(userId) {
  const existing = getSheetData_(APP.sheets.categories).rows.filter(function (row) { return row.userId === userId; });
  if (existing.length) return;
  const now = nowIso_();
  let sortOrder = 0;
  const rowsToAppend = [];
  ['expense', 'income'].forEach(function (type) {
    DEFAULT_CATEGORIES[type].forEach(function (item) {
      rowsToAppend.push({
        categoryId: makeId_('cat'),
        userId: userId,
        type: type,
        name: item.name,
        icon: item.icon,
        color: item.color,
        sortOrder: sortOrder,
        createdAt: now,
        updatedAt: now,
      });
      sortOrder += 1;
    });
  });
  appendObjectsBatch_(APP.sheets.categories, rowsToAppend);
}

function getCategoriesForUser_(userId) {
  ensureCategoriesSeeded_(userId);
  const rows = getSheetData_(APP.sheets.categories).rows
    .filter(function (row) { return row.userId === userId; })
    .sort(function (a, b) { return Number(a.sortOrder || 0) - Number(b.sortOrder || 0); });

  const result = { expense: [], income: [] };
  rows.forEach(function (row) {
    const type = row.type === 'income' ? 'income' : 'expense';
    result[type].push({
      categoryId: row.categoryId,
      type: type,
      name: row.name,
      icon: row.icon || FALLBACK_CATEGORY_ICON,
      color: row.color || FALLBACK_CATEGORY_COLOR,
      sortOrder: Number(row.sortOrder || 0),
    });
  });
  return result;
}

function ensureCategoryExists_(userId, type, name) {
  const cleanName = sanitizeText_(name || '', 80);
  const cleanType = type === 'income' ? 'income' : 'expense';
  if (!cleanName) return;

  ensureCategoriesSeeded_(userId);
  const rows = getSheetData_(APP.sheets.categories).rows.filter(function (row) { return row.userId === userId; });
  const exists = rows.some(function (row) {
    return row.type === cleanType && String(row.name || '').trim().toLowerCase() === cleanName.toLowerCase();
  });
  if (exists) return;

  const orders = rows.map(function (row) { return Number(row.sortOrder); }).filter(function (v) { return !isNaN(v); });
  const nextOrder = orders.length ? Math.max.apply(null, orders) + 1 : 0;
  const defaultMatch = (DEFAULT_CATEGORIES[cleanType] || []).find(function (item) { return item.name === cleanName; });
  const now = nowIso_();
  appendObject_(APP.sheets.categories, {
    categoryId: makeId_('cat'),
    userId: userId,
    type: cleanType,
    name: cleanName,
    icon: defaultMatch ? defaultMatch.icon : FALLBACK_CATEGORY_ICON,
    color: defaultMatch ? defaultMatch.color : FALLBACK_CATEGORY_COLOR,
    sortOrder: nextOrder,
    createdAt: now,
    updatedAt: now,
  });
}

function saveCategory(token, payload) {
  const user = requireUser_(token);
  payload = payload || {};
  const type = payload.type === 'income' ? 'income' : 'expense';
  const name = sanitizeText_(payload.name || '', 80);
  const icon = sanitizeText_(payload.icon || FALLBACK_CATEGORY_ICON, 40);
  const color = /^#[0-9a-fA-F]{6}$/.test(String(payload.color || '')) ? payload.color : FALLBACK_CATEGORY_COLOR;
  if (!name) throw new Error('กรุณาตั้งชื่อหมวดหมู่');

  ensureCategoriesSeeded_(user.userId);
  const rows = getSheetData_(APP.sheets.categories).rows.filter(function (row) { return row.userId === user.userId; });
  const duplicate = rows.find(function (row) {
    return row.type === type && row.categoryId !== payload.categoryId && String(row.name || '').trim().toLowerCase() === name.toLowerCase();
  });
  if (duplicate) throw new Error('มีหมวดหมู่ชื่อนี้อยู่แล้ว');

  const now = nowIso_();
  if (payload.categoryId) {
    const existing = rows.find(function (row) { return row.categoryId === payload.categoryId; });
    if (!existing) throw new Error('ไม่พบหมวดหมู่ที่ต้องการแก้ไข');
    updateObjectByKey_(APP.sheets.categories, 'categoryId', payload.categoryId, {
      name: name,
      icon: icon,
      color: color,
      updatedAt: now,
    });
  } else {
    const orders = rows.filter(function (row) { return row.type === type; })
      .map(function (row) { return Number(row.sortOrder); })
      .filter(function (v) { return !isNaN(v); });
    appendObject_(APP.sheets.categories, {
      categoryId: makeId_('cat'),
      userId: user.userId,
      type: type,
      name: name,
      icon: icon,
      color: color,
      sortOrder: orders.length ? Math.max.apply(null, orders) + 1 : 0,
      createdAt: now,
      updatedAt: now,
    });
  }
  return buildAppData_(user.userId);
}

function deleteCategory(token, categoryId) {
  const user = requireUser_(token);
  const category = getSheetData_(APP.sheets.categories).rows.find(function (row) {
    return row.categoryId === categoryId && row.userId === user.userId;
  });
  if (!category) throw new Error('ไม่พบหมวดหมู่ที่ต้องการลบ');
  if (category.name === 'อื่นๆ') throw new Error('ไม่สามารถลบหมวดหมู่ "อื่นๆ" ได้ เนื่องจากเป็นหมวดสำรองของระบบ');

  const inUse = getSheetData_(APP.sheets.transactions).rows.some(function (row) {
    return row.userId === user.userId && row.category === category.name && row.type === category.type;
  }) || getSheetData_(APP.sheets.budgets).rows.some(function (row) {
    return row.userId === user.userId && row.category === category.name;
  }) || getSheetData_(APP.sheets.recurring).rows.some(function (row) {
    return row.userId === user.userId && row.category === category.name && row.type === category.type;
  });
  if (inUse) throw new Error('หมวดหมู่นี้ถูกใช้งานอยู่ กรุณาย้ายรายการ/งบประมาณที่ใช้หมวดนี้ไปหมวดอื่นก่อนลบ');

  deleteRowByNumber_(APP.sheets.categories, category._rowNumber);
  return buildAppData_(user.userId);
}

function reorderCategories(token, type, orderedIds) {
  const user = requireUser_(token);
  const cleanType = type === 'income' ? 'income' : 'expense';
  if (!Array.isArray(orderedIds)) throw new Error('ลำดับหมวดหมู่ไม่ถูกต้อง');

  const catData = getSheetData_(APP.sheets.categories);
  const orderMap = {};
  orderedIds.forEach(function (id, idx) { orderMap[id] = idx; });

  const sheet = getSheet_(APP.sheets.categories);
  const colIndex = catData.headers.indexOf('sortOrder') + 1;
  if (colIndex > 0) {
    catData.rows.forEach(function (row) {
      if (row.userId === user.userId && row.type === cleanType && orderMap[row.categoryId] !== undefined) {
        sheet.getRange(row._rowNumber, colIndex).setValue(orderMap[row.categoryId]);
        row.sortOrder = orderMap[row.categoryId];
      }
    });
  }
  return buildAppData_(user.userId);
}

function updateSettings(token, payload) {
  const user = requireUser_(token);
  payload = payload || {};
  const setting = getSettingsForUser_(user.userId);
  const patch = {
    darkMode: Boolean(payload.darkMode),
    emailNotifications: Boolean(payload.emailNotifications),
    reminderTime: normalizeTime_(payload.reminderTime || setting.reminderTime || '20:00'),
    budgetAlertThreshold: clamp_(Number(payload.budgetAlertThreshold || 0.8), 0.5, 1),
    updatedAt: nowIso_(),
  };
  updateObjectByKey_(APP.sheets.settings, 'userId', user.userId, patch);
  return buildAppData_(user.userId);
}

function deleteAccount(token, payload) {
  const user = requireUser_(token);
  payload = payload || {};
  const password = String(payload.password || '');
  if (!password || hashPassword_(password, user.passwordSalt) !== user.passwordHash) {
    throw new Error('รหัสผ่านไม่ถูกต้อง กรุณากรอกรหัสผ่านเพื่อยืนยันการลบบัญชี');
  }

  const sheetsToClean = [
    APP.sheets.transactions,
    APP.sheets.budgets,
    APP.sheets.recurring,
    APP.sheets.savingsGoals,
    APP.sheets.savingsLogs,
    APP.sheets.categories,
  ];

  sheetsToClean.forEach(function (sheetName) {
    const rows = getSheetData_(sheetName).rows
      .filter(function (row) { return row.userId === user.userId; })
      .sort(function (a, b) { return b._rowNumber - a._rowNumber; });
    rows.forEach(function (row) { deleteRowByNumber_(sheetName, row._rowNumber); });
  });

  const settingsRow = getSheetData_(APP.sheets.settings).rows.find(function(r) { return r.userId === user.userId; });
  if (settingsRow) deleteRowByNumber_(APP.sheets.settings, settingsRow._rowNumber);

  const userRow = getSheetData_(APP.sheets.users).rows.find(function(r) { return r.userId === user.userId; });
  if (userRow) deleteRowByNumber_(APP.sheets.users, userRow._rowNumber);

  CacheService.getScriptCache().remove('session:' + token);
  return { ok: true, message: 'ลบข้อมูลบัญชีเรียบร้อยแล้ว' };
}

// ============ SAVINGS GOAL SYSTEM ============
function saveSavingsGoal(token, payload) {
  const user = requireUser_(token);
  payload = payload || {};
  const name = sanitizeText_(payload.name, 80);
  const targetAmount = Number(payload.targetAmount || 0);
  if (!name) throw new Error('กรุณาตั้งชื่อเป้าหมายการออม');
  if (targetAmount < 0) throw new Error('เป้าหมายต้องไม่ติดลบ');

  const now = nowIso_();
  const editingId = payload.savingsGoalId ? String(payload.savingsGoalId) : '';
  const existing = editingId ? getSheetData_(APP.sheets.savingsGoals).rows.find(function(r) { return r.savingsGoalId === editingId; }) : null;
  if (editingId && (!existing || existing.userId !== user.userId)) {
    throw new Error('ไม่พบเป้าหมายการออมนี้');
  }

  const row = {
    savingsGoalId: editingId || makeId_('sav'),
    userId: user.userId,
    name: name,
    icon: sanitizeText_(payload.icon || 'piggy-bank', 40),
    targetAmount: roundMoney_(targetAmount),
    note: sanitizeText_(payload.note || '', 300),
    archived: false,
    updatedAt: now,
  };

  if (existing) {
    updateObjectByKey_(APP.sheets.savingsGoals, 'savingsGoalId', row.savingsGoalId, row);
  } else {
    row.createdAt = now;
    appendObject_(APP.sheets.savingsGoals, row);
  }
  return buildAppData_(user.userId);
}

function deleteSavingsGoal(token, savingsGoalId) {
  const user = requireUser_(token);
  const goal = getSheetData_(APP.sheets.savingsGoals).rows.find(function (row) {
    return row.savingsGoalId === savingsGoalId && row.userId === user.userId;
  });
  if (!goal) throw new Error('ไม่พบเป้าหมายการออมนี้');

  const saved = computeSavingsGoalSaved_(user.userId, savingsGoalId);
  if (roundMoney_(saved) > 0) throw new Error('กรุณาถอนเงินออมออกให้หมดก่อนลบเป้าหมายนี้');

  deleteRowByNumber_(APP.sheets.savingsGoals, goal._rowNumber);
  return buildAppData_(user.userId);
}

function saveSavingsLog(token, payload) {
  const user = requireUser_(token);
  payload = payload || {};
  const direction = String(payload.direction || '').toLowerCase();
  const amount = Number(payload.amount);
  const savingsGoalId = String(payload.savingsGoalId || '');
  const date = normalizeDateInput_(payload.date || new Date());

  if (['deposit', 'withdraw'].indexOf(direction) < 0) throw new Error('ประเภทการออมไม่ถูกต้อง');
  if (!amount || amount <= 0) throw new Error('จำนวนเงินต้องมากกว่า 0');

  const goal = getSheetData_(APP.sheets.savingsGoals).rows.find(function(r) { return r.savingsGoalId === savingsGoalId; });
  if (!goal || goal.userId !== user.userId) throw new Error('ไม่พบเป้าหมายการออมนี้');

  if (direction === 'withdraw') {
    const currentSaved = computeSavingsGoalSaved_(user.userId, savingsGoalId);
    if (roundMoney_(amount) > roundMoney_(currentSaved)) throw new Error('ยอดเงินออมในเป้าหมายนี้ไม่พอสำหรับถอน');
  }

  appendObject_(APP.sheets.savingsLogs, {
    savingsLogId: makeId_('svl'),
    userId: user.userId,
    savingsGoalId: savingsGoalId,
    direction: direction,
    amount: roundMoney_(amount),
    note: sanitizeText_(payload.note || '', 300),
    date: date,
    createdAt: nowIso_(),
  });

  return buildAppData_(user.userId);
}

function deleteSavingsLog(token, savingsLogId) {
  const user = requireUser_(token);
  const row = getSheetData_(APP.sheets.savingsLogs).rows.find(function (item) {
    return item.savingsLogId === savingsLogId && item.userId === user.userId;
  });
  if (!row) throw new Error('ไม่พบรายการออมนี้');
  deleteRowByNumber_(APP.sheets.savingsLogs, row._rowNumber);
  return buildAppData_(user.userId);
}

function computeSavingsGoalSaved_(userId, savingsGoalId) {
  const logs = getSheetData_(APP.sheets.savingsLogs).rows.filter(function (row) {
    return row.userId === userId && row.savingsGoalId === savingsGoalId;
  });
  return roundMoney_(logs.reduce(function (sum, row) {
    return sum + (String(row.direction) === 'withdraw' ? -Number(row.amount || 0) : Number(row.amount || 0));
  }, 0));
}

function processRecurringTransactions() {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(30000)) return;
  try {
    const today = dateKey_(new Date());
    const recurringData = getSheetData_(APP.sheets.recurring);
    const existingTxRows = getSheetData_(APP.sheets.transactions).rows;

    recurringData.rows.forEach(function (item) {
      if (!toBoolean_(item.active)) return;
      let nextDate = normalizeDateInput_(item.nextRunDate || new Date());
      if (nextDate > today) return;

      while (nextDate <= today) {
        const alreadyExists = existingTxRows.some(function (tx) {
          return tx.userId === item.userId && tx.recurringId === item.recurringId && normalizeDateInput_(tx.date) === nextDate;
        });
        if (!alreadyExists) {
          appendObject_(APP.sheets.transactions, {
            transactionId: makeId_('txn'),
            userId: item.userId,
            type: item.type,
            amount: roundMoney_(Number(item.amount)),
            category: item.category,
            note: item.note,
            date: nextDate,
            createdAt: nowIso_(),
            source: 'recurring',
            recurringId: item.recurringId,
          });
        }
        nextDate = addFrequency_(nextDate, item.frequency);
      }

      updateObjectByKey_(APP.sheets.recurring, 'recurringId', item.recurringId, {
        nextRunDate: nextDate,
        lastRunAt: nowIso_(),
        updatedAt: nowIso_(),
      });
    });
  } finally {
    lock.releaseLock();
  }
}

function processEmailNotifications() {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(30000)) return;
  try {
    const users = getSheetData_(APP.sheets.users).rows;
    const today = dateKey_(new Date());
    users.forEach(function (user) {
      const settings = getSettingsForUser_(user.userId);
      if (!toBoolean_(settings.emailNotifications)) return;

      const appData = buildAppData_(user.userId);
      const patch = {};
      const reminderTime = normalizeTime_(settings.reminderTime || '20:00');

      if (isCurrentTimeWindow_(reminderTime) && settings.lastReminderSentDate !== today) {
        GmailApp.sendEmail(
          user.email,
          'FinNote: อย่าลืมบันทึกรายรับรายจ่ายวันนี้',
          'สวัสดี ' + user.displayName + '\n\nวันนี้คุณสามารถเข้ามาบันทึกรายรับรายจ่ายเพื่อให้สถิติและงบประมาณอัปเดตต่อเนื่องได้แล้ว'
        );
        patch.lastReminderSentDate = today;
      }

      const streakAlertCacheKey = 'streakAlert:' + user.userId + ':' + today;
      const streakAlertSentToday = settings.lastStreakAlertSentDate === today || CacheService.getScriptCache().get(streakAlertCacheKey);
      if (appData.streak.days > 0 && !appData.streak.hasLoggedToday && !streakAlertSentToday && isAfterLocalHour_(18)) {
        GmailApp.sendEmail(
          user.email,
          'FinNote : Streak ของคุณใกล้ขาดช่วง',
          'วันนี้คุณยังไม่ได้จดบันทึกเลย Streak ' + appData.streak.days + ' วันของคุณกำลังจะหายไปนะ'
        );
        CacheService.getScriptCache().put(streakAlertCacheKey, '1', 21600);
        patch.lastStreakAlertSentDate = today;
      }
      const threshold = clamp_(Number(settings.budgetAlertThreshold || 0.8), 0.5, 1);
      const activeBudget = appData.budget;
      const alertKey = activeBudget.period + ':' + activeBudget.periodStart;
      
      if (activeBudget.amount > 0 && activeBudget.ratio < 1 && activeBudget.ratio >= threshold && settings.lastBudgetAlertSentKey !== alertKey) {
        GmailApp.sendEmail(
          user.email,
          'FinNote : งบประมาณใกล้เต็มวงเงิน',
          'คุณใช้จ่ายไป ' + formatCurrency_(activeBudget.spent) + ' จากงบ ' + formatCurrency_(activeBudget.amount) + ' (' + Math.round(activeBudget.ratio * 100) + '%)\n\n- FinNote'
        );
        patch.lastBudgetAlertSentKey = alertKey;
      } 
      else if (activeBudget.amount > 0 && activeBudget.ratio >= 1 && settings.lastBudgetAlertSentKey !== alertKey + ':OVER') {
        GmailApp.sendEmail(
          user.email,
          'FinNote : คุณใช้จ่ายเกินงบประมาณแล้ว!',
          'คุณใช้จ่ายไป ' + formatCurrency_(activeBudget.spent) + ' จากงบ ' + formatCurrency_(activeBudget.amount) + ' (' + Math.round(activeBudget.ratio * 100) + '%)\n\n- FinNote'
        );
        patch.lastBudgetAlertSentKey = alertKey + ':OVER';
      }

      if (Object.keys(patch).length) {
        patch.updatedAt = nowIso_();
        updateObjectByKey_(APP.sheets.settings, 'userId', user.userId, patch);
      }
    });
  } finally {
    lock.releaseLock();
  }
}

function buildAppData_(userId) {
  const user = getUserById_(userId);
  const transactions = getSheetData_(APP.sheets.transactions).rows
    .filter(function (row) { return row.userId === userId; })
    .map(publicTransaction_)
    .sort(function (a, b) {
      return String(b.date + b.createdAt).localeCompare(String(a.date + a.createdAt));
    });

  ensureBudgetSortOrder_(userId);
  const budgets = getSheetData_(APP.sheets.budgets).rows
    .filter(function (row) { return row.userId === userId; })
    .map(function (row) {
      const budget = {
        budgetId: row.budgetId,
        period: row.period,
        amount: Number(row.amount || 0),
        category: row.category || '',
        startDate: normalizeDateInput_(row.startDate || new Date()),
        sortOrder: Number(row.sortOrder || 0),
        updatedAt: row.updatedAt,
      };
      Object.assign(budget, computeBudgetProgress_(transactions, budget));
      budget.overspend = computeBudgetOverspendStats_(transactions, budget);
      return budget;
    })
    .sort(function (a, b) { return a.sortOrder - b.sortOrder; });

  const recurring = getSheetData_(APP.sheets.recurring).rows
    .filter(function (row) { return row.userId === userId; })
    .map(function (row) {
      return {
        recurringId: row.recurringId,
        type: row.type,
        amount: Number(row.amount || 0),
        category: row.category,
        note: row.note,
        frequency: row.frequency,
        nextRunDate: normalizeDateInput_(row.nextRunDate || new Date()),
        active: toBoolean_(row.active),
      };
    })
    .sort(function (a, b) { return String(a.nextRunDate).localeCompare(String(b.nextRunDate)); });

  const savingsLogs = getSheetData_(APP.sheets.savingsLogs).rows
    .filter(function (row) { return row.userId === userId; })
    .map(publicSavingsLog_)
    .sort(function (a, b) { return String(b.date + b.createdAt).localeCompare(String(a.date + a.createdAt)); });

  const savingsGoals = getSheetData_(APP.sheets.savingsGoals).rows
    .filter(function (row) { return row.userId === userId && !toBoolean_(row.archived); })
    .map(function (row) {
      const saved = roundMoney_(savingsLogs
        .filter(function (log) { return log.savingsGoalId === row.savingsGoalId; })
        .reduce(function (sum, log) { return sum + (log.direction === 'withdraw' ? -log.amount : log.amount); }, 0));
      const target = Number(row.targetAmount || 0);
      const ratio = target > 0 ? saved / target : 0;
      return {
        savingsGoalId: row.savingsGoalId,
        name: row.name,
        icon: row.icon || 'piggy-bank',
        note: row.note || '',
        targetAmount: target,
        saved: saved,
        remaining: roundMoney_(Math.max(0, target - saved)),
        ratio: ratio,
        percent: target > 0 ? Math.min(100, Math.round(ratio * 100)) : 0,
        completed: target > 0 && saved >= target,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      };
    })
    .sort(function (a, b) { return String(b.updatedAt).localeCompare(String(a.updatedAt)); });

  const totalSaved = roundMoney_(savingsGoals.reduce(function (sum, goal) { return sum + goal.saved; }, 0));
  const allTimeTotals = totalsForRange_(transactions, { start: '0000-01-01', end: '9999-12-31' });
  const savingsSummary = {
    totalSaved: totalSaved,
    totalTarget: roundMoney_(savingsGoals.reduce(function (sum, goal) { return sum + goal.targetAmount; }, 0)),
    goalsCount: savingsGoals.length,
    completedCount: savingsGoals.filter(function (goal) { return goal.completed; }).length,
    availableBalance: roundMoney_(allTimeTotals.income - allTimeTotals.expense - totalSaved),
  };

  const settings = publicSettings_(getSettingsForUser_(userId));
  return {
    user: publicUser_(user),
    settings: settings,
    categories: getCategoriesForUser_(userId),
    transactions: transactions,
    recentTransactions: transactions.slice(0, 5),
    budgets: budgets,
    budget: buildBudgetSummary_(budgets),
    recurring: recurring,
    analytics: buildAnalytics_(transactions, budgets),
    streak: buildStreak_(transactions),
    savingsGoals: savingsGoals,
    savingsLogs: savingsLogs.slice(0, 20),
    savingsSummary: savingsSummary,
    serverTime: nowIso_(),
  };
}

function buildBudgetSummary_(budgets) {
  if (!budgets || !budgets.length) {
    return { period: 'monthly', amount: 0, spent: 0, remaining: 0, ratio: 0, percent: 0, overBudget: false, periodStart: getPeriodRange_('monthly').start, periodEnd: getPeriodRange_('monthly').end };
  }
  const overall = budgets.find(function (b) { return !b.category; });
  return overall || budgets[0];
}

function computeBudgetProgress_(transactions, budget) {
  const range = getPeriodRangeFromStart_(budget.period, budget.startDate);
  const spent = transactions
    .filter(function (tx) {
      if (tx.type !== 'expense' || tx.date < range.start || tx.date > range.end) return false;
      return !budget.category || tx.category === budget.category;
    })
    .reduce(function (sum, tx) { return sum + Number(tx.amount || 0); }, 0);
  const amount = Number(budget.amount || 0);
  const ratio = amount > 0 ? spent / amount : 0;
  return {
    spent: roundMoney_(spent),
    remaining: roundMoney_(amount - spent),
    ratio: ratio,
    percent: Math.round(ratio * 100),
    overBudget: ratio > 1,
    periodStart: range.start,
    periodEnd: range.end,
  };
}

function generateBudgetCycles_(period, startDateText) {
  const today = stripTime_(new Date());
  const anchor = stripTime_(parseDate_(normalizeDateInput_(startDateText || dateKey_(today))));
  const cycles = [];

  if (anchor.getTime() > today.getTime()) return cycles;

  if (period === 'daily') {
    const MAX_CYCLES = 180;
    let cursor = new Date(anchor);
    let count = 0;
    while (cursor.getTime() <= today.getTime() && count < MAX_CYCLES) {
      cycles.push({ start: dateKey_(cursor), end: dateKey_(cursor) });
      cursor.setDate(cursor.getDate() + 1);
      count++;
    }
    return cycles;
  }

  if (period === 'weekly') {
    const MAX_CYCLES = 104;
    let cycleStart = new Date(anchor);
    let count = 0;
    while (cycleStart.getTime() <= today.getTime() && count < MAX_CYCLES) {
      const cycleEnd = new Date(cycleStart);
      cycleEnd.setDate(cycleStart.getDate() + 6);
      cycles.push({ start: dateKey_(cycleStart), end: dateKey_(cycleEnd) });
      cycleStart = new Date(cycleStart);
      cycleStart.setDate(cycleStart.getDate() + 7);
      count++;
    }
    return cycles;
  }

  if (period === 'monthly') {
    const MAX_CYCLES = 60;
    const anchorDay = anchor.getDate();
    let cycleStart = new Date(anchor.getFullYear(), anchor.getMonth(), Math.min(anchorDay, daysInMonth_(anchor.getFullYear(), anchor.getMonth())));
    let count = 0;
    while (cycleStart.getTime() <= today.getTime() && count < MAX_CYCLES) {
      const nextAnchorMonth = new Date(cycleStart.getFullYear(), cycleStart.getMonth() + 1, 1);
      const nextCycleStart = new Date(nextAnchorMonth.getFullYear(), nextAnchorMonth.getMonth(), Math.min(anchorDay, daysInMonth_(nextAnchorMonth.getFullYear(), nextAnchorMonth.getMonth())));
      const cycleEnd = new Date(nextCycleStart);
      cycleEnd.setDate(cycleEnd.getDate() - 1);
      cycles.push({ start: dateKey_(cycleStart), end: dateKey_(cycleEnd) });
      cycleStart = nextCycleStart;
      count++;
    }
    return cycles;
  }

  return cycles;
}

function computeBudgetOverspendStats_(transactions, budget) {
  // Find earliest transaction date if earlier than startDate to allow historical analysis
  let effectiveStartDate = normalizeDateInput_(budget.startDate || new Date());
  transactions.forEach(function (tx) {
    if (tx.type !== 'expense') return;
    if (budget.category && tx.category !== budget.category) return;
    const txDate = normalizeDateInput_(tx.date);
    if (!effectiveStartDate || txDate < effectiveStartDate) {
      effectiveStartDate = txDate;
    }
  });

  const allCycles = generateBudgetCycles_(budget.period, effectiveStartDate);
  if (!allCycles.length) {
    return {
      totalCycles: 0,
      overCount: 0,
      overProbabilityPercent: 0,
      totalOverAmount: 0,
      avgOverPercent: 0,
      avgSpent: 0,
    };
  }

  const windowStart = stripTime_(new Date());
  if (budget.period === 'monthly') {
    windowStart.setFullYear(windowStart.getFullYear() - 1);
  } else if (budget.period === 'weekly') {
    windowStart.setMonth(windowStart.getMonth() - 3);
  } else {
    windowStart.setMonth(windowStart.getMonth() - 1);
  }
  const windowStartKey = dateKey_(windowStart);
  const scopedCycles = allCycles.filter(function (range) { return range.end >= windowStartKey; });

  const amount = Number(budget.amount || 0);
  let overCount = 0;
  let totalOverAmount = 0;
  let overPercentSum = 0;
  let totalSpent = 0;
  let evaluatedCyclesCount = 0;

  scopedCycles.forEach(function (range, idx) {
    const isCurrentCycle = (idx === scopedCycles.length - 1);
    const spent = transactions
      .filter(function (tx) {
        if (tx.type !== 'expense' || tx.date < range.start || tx.date > range.end) return false;
        return !budget.category || tx.category === budget.category;
      })
      .reduce(function (sum, tx) { return sum + Number(tx.amount || 0); }, 0);

    // If current cycle has no expenses yet and there are older cycles, skip incomplete cycle
    if (isCurrentCycle && spent === 0 && scopedCycles.length > 1) {
      return;
    }

    evaluatedCyclesCount++;
    totalSpent += spent;
    if (amount > 0 && spent > amount) {
      overCount++;
      const overAmount = spent - amount;
      totalOverAmount += overAmount;
      overPercentSum += (overAmount / amount) * 100;
    }
  });

  const totalCycles = evaluatedCyclesCount;
  return {
    totalCycles: totalCycles,
    overCount: overCount,
    overProbabilityPercent: totalCycles ? Math.round((overCount / totalCycles) * 100) : 0,
    totalOverAmount: roundMoney_(totalOverAmount),
    avgOverPercent: overCount ? Math.round(overPercentSum / overCount) : 0,
    avgSpent: totalCycles ? roundMoney_(totalSpent / totalCycles) : 0,
  };
}

function buildAnalytics_(transactions, budgets) {
  budgets = budgets || [];
  return {
    daily: buildPeriodStats_(transactions, 'daily'),
    weekly: buildPeriodStats_(transactions, 'weekly'),
    monthly: buildPeriodStats_(transactions, 'monthly'),
    categoryExpense: categoryBreakdown_(transactions, 'expense', getPeriodRange_('monthly')),
    categoryIncome: categoryBreakdown_(transactions, 'income', getPeriodRange_('monthly')),
    budgetOverspend: budgets.map(function (b) {
      return {
        budgetId: b.budgetId,
        category: b.category,
        period: b.period,
        amount: b.amount,
        spent: b.spent,
        overBudget: b.overBudget,
        percent: b.percent,
        overspend: b.overspend || computeBudgetOverspendStats_(transactions, b),
      };
    }),
  };
}

function buildPeriodStats_(transactions, period) {
  const now = new Date();
  const current = getPeriodRange_(period, now, 0);
  const todayKey = dateKey_(stripTime_(now));
  const currentRange = { start: current.start, end: current.end < todayKey ? current.end : todayKey };

  const previousStart = getPeriodRange_(period, now, -1).start;
  const previousCutoff = comparablePreviousCutoff_(period, parseDate_(current.start), parseDate_(previousStart), now);

  const currentTotals = totalsForRange_(transactions, currentRange);
  const previousTotals = totalsUpToCutoff_(transactions, previousStart, previousCutoff);

  return {
    period: period,
    range: currentRange,
    income: currentTotals.income,
    expense: currentTotals.expense,
    balance: roundMoney_(currentTotals.income - currentTotals.expense),
    previousExpense: previousTotals.expense,
    expenseChangePercent: percentChange_(currentTotals.expense, previousTotals.expense),
  };
}

function comparablePreviousCutoff_(period, currentStart, previousStart, now) {
  const cutoff = new Date(previousStart);
  if (period === 'monthly') {
    const dayOfMonth = stripTime_(now).getDate();
    cutoff.setDate(Math.min(dayOfMonth, daysInMonth_(previousStart.getFullYear(), previousStart.getMonth())));
  } else {
    const elapsedDays = Math.round((stripTime_(now).getTime() - currentStart.getTime()) / 86400000);
    cutoff.setDate(cutoff.getDate() + elapsedDays);
  }
  cutoff.setHours(now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds());
  return cutoff;
}

function totalsUpToCutoff_(transactions, startKey, cutoffDate) {
  const cutoffKey = dateKey_(cutoffDate);
  return transactions
    .filter(function (tx) {
      if (tx.date < startKey || tx.date > cutoffKey) return false;
      if (tx.date === cutoffKey) {
        const createdAt = tx.createdAt ? new Date(tx.createdAt) : parseDate_(tx.date);
        return createdAt.getTime() <= cutoffDate.getTime();
      }
      return true;
    })
    .reduce(function (acc, tx) {
      acc[tx.type] += Number(tx.amount || 0);
      return acc;
    }, { income: 0, expense: 0 });
}

function totalsForRange_(transactions, range) {
  return transactions
    .filter(function (tx) { return tx.date >= range.start && tx.date <= range.end; })
    .reduce(function (acc, tx) {
      acc[tx.type] += Number(tx.amount || 0);
      return acc;
    }, { income: 0, expense: 0 });
}

function categoryBreakdown_(transactions, type, range) {
  const map = {};
  transactions
    .filter(function (tx) { return tx.type === type && tx.date >= range.start && tx.date <= range.end; })
    .forEach(function (tx) {
      map[tx.category] = (map[tx.category] || 0) + Number(tx.amount || 0);
    });
  return Object.keys(map).map(function (category) {
    return { category: category, amount: roundMoney_(map[category]) };
  }).sort(function (a, b) { return b.amount - a.amount; });
}

function buildStreak_(transactions) {
  if (!transactions.length) return { days: 0, hasLoggedToday: false, latestDate: '', latestCreatedAt: '' };
  const sorted = transactions.slice().sort(function (a, b) {
    return String(b.createdAt || b.date).localeCompare(String(a.createdAt || a.date));
  });
  const latest = sorted[0];
  const latestCreated = latest.createdAt ? new Date(latest.createdAt) : parseDate_(latest.date);
  const hoursSince = (new Date().getTime() - latestCreated.getTime()) / 36e5;
  if (hoursSince > 24) return { days: 0, hasLoggedToday: false, latestDate: latest.date, latestCreatedAt: latest.createdAt };

  const dateSet = {};
  transactions.forEach(function (tx) { dateSet[normalizeDateInput_(tx.date)] = true; });
  let cursor = parseDate_(normalizeDateInput_(latest.date));
  let days = 0;
  while (dateSet[dateKey_(cursor)]) {
    days++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return {
    days: days,
    hasLoggedToday: Boolean(dateSet[dateKey_(new Date())]),
    latestDate: latest.date,
    latestCreatedAt: latest.createdAt,
  };
}

function createSessionResponse_(user, rememberToken) {
  const token = makeId_('tok');
  CacheService.getScriptCache().put('session:' + token, user.userId, APP.tokenTtlSeconds);
  const response = {
    ok: true,
    token: token,
    expiresIn: APP.tokenTtlSeconds,
    data: buildAppData_(user.userId),
  };
  if (rememberToken) response.rememberToken = rememberToken;
  return response;
}

function issueRememberToken_(userId) {
  const token = makeId_('rem');
  updateObjectByKey_(APP.sheets.users, 'userId', userId, {
    rememberTokenHash: hashSecret_(token, 'remember-token'),
    updatedAt: nowIso_(),
  });
  return token;
}

function hashSecret_(value, context) {
  const raw = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    String(context || '') + ':' + String(value || ''),
    Utilities.Charset.UTF_8
  );
  return Utilities.base64Encode(raw);
}

function requireUser_(token) {
  if (!token) throw new Error('กรุณาเข้าสู่ระบบใหม่');
  const userId = CacheService.getScriptCache().get('session:' + token);
  if (!userId) throw new Error('เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่');
  const user = getUserById_(userId);
  if (!user) throw new Error('ไม่พบผู้ใช้');
  CacheService.getScriptCache().put('session:' + token, userId, APP.tokenTtlSeconds);
  return user;
}

function getUserById_(userId) {
  return getSheetData_(APP.sheets.users).rows.find(function (row) { return row.userId === userId; });
}

function getSettingsForUser_(userId) {
  const settings = getSheetData_(APP.sheets.settings).rows.find(function(r) { return r.userId === userId; });
  if (settings) return settings;
  const now = nowIso_();
  const newSetting = {
    userId: userId,
    darkMode: false,
    emailNotifications: false,
    reminderTime: '20:00',
    budgetAlertThreshold: 0.8,
    createdAt: now,
    updatedAt: now,
    lastReminderSentDate: '',
    lastStreakAlertSentDate: '',
    lastBudgetAlertSentKey: '',
  };
  appendObject_(APP.sheets.settings, newSetting);
  return newSetting;
}

function publicUser_(user) {
  return {
    userId: user.userId,
    email: user.email,
    displayName: user.displayName,
    profileImage: user.profileImage || '',
    createdAt: user.createdAt,
    lastLogin: user.lastLogin,
  };
}

function publicSettings_(settings) {
  return {
    darkMode: toBoolean_(settings.darkMode),
    emailNotifications: toBoolean_(settings.emailNotifications),
    reminderTime: normalizeTime_(settings.reminderTime || '20:00'),
    budgetAlertThreshold: Number(settings.budgetAlertThreshold || 0.8),
  };
}

function publicTransaction_(row) {
  return {
    transactionId: row.transactionId,
    type: row.type,
    amount: Number(row.amount || 0),
    category: row.category,
    note: row.note,
    date: normalizeDateInput_(row.date || new Date()),
    createdAt: row.createdAt,
    source: row.source || 'manual',
    recurringId: row.recurringId || '',
  };
}

function publicSavingsLog_(row) {
  return {
    savingsLogId: row.savingsLogId,
    savingsGoalId: row.savingsGoalId,
    direction: row.direction,
    amount: Number(row.amount || 0),
    note: row.note || '',
    date: normalizeDateInput_(row.date || new Date()),
    createdAt: row.createdAt,
  };
}

function getSpreadsheet_() {
  if (_MEM_CACHE.spreadsheet) return _MEM_CACHE.spreadsheet;
  const id = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
  const ss = id ? SpreadsheetApp.openById(id) : SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) throw new Error('กรุณาตั้งค่า Script Property ชื่อ SPREADSHEET_ID เป็น ID ของ Google Sheets');
  _MEM_CACHE.spreadsheet = ss;
  return ss;
}

function getSheet_(sheetName) {
  const ss = getSpreadsheet_();
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    setupSheets();
    sheet = ss.getSheetByName(sheetName);
  }
  if (!sheet) throw new Error('ไม่สามารถเข้าถึงชีต ' + sheetName);
  return sheet;
}

function getSheetData_(sheetName) {
  if (_MEM_CACHE[sheetName]) return _MEM_CACHE[sheetName];
  const sheet = getSheet_(sheetName);
  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn();
  if (lastRow < 1 || lastCol < 1) {
    const empty = { headers: [], rows: [] };
    _MEM_CACHE[sheetName] = empty;
    return empty;
  }
  const values = sheet.getRange(1, 1, lastRow, lastCol).getValues();
  const headers = values.shift().map(String);
  const rows = values.filter(function (row) {
    return row.some(function (cell) { return cell !== ''; });
  }).map(function (row, index) {
    const obj = {};
    headers.forEach(function (header, colIndex) {
      obj[header] = row[colIndex];
    });
    obj._rowNumber = index + 2;
    return obj;
  });
  const data = { headers: headers, rows: rows };
  _MEM_CACHE[sheetName] = data;
  return data;
}

function appendObject_(sheetName, obj) {
  const sheet = getSheet_(sheetName);
  const headers = getSheetData_(sheetName).headers;
  const row = headers.map(function (header) {
    return obj[header] === undefined ? '' : obj[header];
  });
  sheet.appendRow(row);
  delete _MEM_CACHE[sheetName];
}

function appendObjectsBatch_(sheetName, objects) {
  if (!objects || !objects.length) return;
  const sheet = getSheet_(sheetName);
  const headers = getSheetData_(sheetName).headers;
  const rows = objects.map(function (obj) {
    return headers.map(function (header) {
      return obj[header] === undefined ? '' : obj[header];
    });
  });
  const lastRow = Math.max(1, sheet.getLastRow());
  sheet.getRange(lastRow + 1, 1, rows.length, headers.length).setValues(rows);
  delete _MEM_CACHE[sheetName];
}

function updateObjectByKey_(sheetName, key, value, patch) {
  const data = getSheetData_(sheetName);
  const row = data.rows.find(function (item) { return item[key] === value; });
  if (!row) throw new Error('ไม่พบข้อมูลสำหรับอัปเดตในชีต ' + sheetName);
  const sheet = getSheet_(sheetName);

  Object.keys(patch).forEach(function (field) {
    const col = data.headers.indexOf(field) + 1;
    if (col > 0) {
      sheet.getRange(row._rowNumber, col).setValue(patch[field]);
      row[field] = patch[field];
    }
  });
  delete _MEM_CACHE[sheetName];
}

function deleteRowByNumber_(sheetName, rowNumber) {
  getSheet_(sheetName).deleteRow(rowNumber);
  delete _MEM_CACHE[sheetName];
}

function hashPassword_(password, salt) {
  const raw = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, salt + ':' + password, Utilities.Charset.UTF_8);
  return Utilities.base64Encode(raw);
}

function getRegistrationPinKey_(email) {
  return 'registerPin:' + normalizeEmail_(email);
}

function createRegistrationPin_() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function hashRegistrationPin_(email, pin) {
  const raw = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    normalizeEmail_(email) + ':registration-pin:' + String(pin || '').trim(),
    Utilities.Charset.UTF_8
  );
  return Utilities.base64Encode(raw);
}

function getPasswordResetPinKey_(email) {
  return 'resetPin:' + normalizeEmail_(email);
}

function hashResetPin_(email, pin) {
  const raw = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    normalizeEmail_(email) + ':password-reset-pin:' + String(pin || '').trim(),
    Utilities.Charset.UTF_8
  );
  return Utilities.base64Encode(raw);
}

function makeId_(prefix) {
  return prefix + '_' + Utilities.getUuid().replace(/-/g, '');
}

function normalizeEmail_(email) {
  return String(email || '').trim().toLowerCase();
}

function sanitizeText_(value, max) {
  return String(value || '').trim().replace(/[<>]/g, '').slice(0, max || 200);
}

function sanitizeImage_(value) {
  const image = String(value || '');
  if (!image) return '';
  if (!/^data:image\/(png|jpeg|jpg|webp);base64,/i.test(image)) throw new Error('รองรับเฉพาะไฟล์รูปภาพ png, jpg, webp');
  if (image.length > 750000) throw new Error('รูปโปรไฟล์ใหญ่เกินไป กรุณาเลือกรูปที่เล็กกว่า 750KB');
  return image;
}

function normalizeDateInput_(value) {
  if (!value) return dateKey_(new Date());
  if (Object.prototype.toString.call(value) === '[object Date]') {
    return isNaN(value.getTime()) ? dateKey_(new Date()) : dateKey_(value);
  }
  const text = String(value || '').trim();
  if (!text) return dateKey_(new Date());
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;
  const d = new Date(text);
  return isNaN(d.getTime()) ? dateKey_(new Date()) : dateKey_(d);
}

function normalizeTime_(value) {
  const text = String(value || '20:00').trim();
  const match = text.match(/^([01]\d|2[0-3]):([0-5]\d)$/);
  return match ? text : '20:00';
}

function composeDateTimeIso_(dateText, timeText) {
  const date = parseDate_(normalizeDateInput_(dateText));
  const parts = normalizeTime_(timeText).split(':').map(Number);
  date.setHours(parts[0], parts[1], 0, 0);
  return Utilities.formatDate(date, Session.getScriptTimeZone(), "yyyy-MM-dd'T'HH:mm:ssXXX");
}

function nowIso_() {
  return Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd'T'HH:mm:ssXXX");
}

function dateKey_(date) {
  return Utilities.formatDate(date, Session.getScriptTimeZone(), 'yyyy-MM-dd');
}

function parseDate_(dateText) {
  const parts = normalizeDateInput_(dateText).split('-').map(Number);
  return new Date(parts[0], parts[1] - 1, parts[2]);
}

function getPeriodRange_(period, baseDate, offset) {
  const date = baseDate ? new Date(baseDate) : new Date();
  offset = Number(offset || 0);
  let start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  let end = new Date(start);

  if (period === 'weekly') {
    const day = start.getDay();
    const diffToMonday = (day + 6) % 7;
    start.setDate(start.getDate() - diffToMonday + offset * 7);
    end = new Date(start);
    end.setDate(start.getDate() + 6);
  } else if (period === 'monthly') {
    start = new Date(date.getFullYear(), date.getMonth() + offset, 1);
    end = new Date(date.getFullYear(), date.getMonth() + offset + 1, 0);
  } else {
    start.setDate(start.getDate() + offset);
    end = new Date(start);
  }

  return { start: dateKey_(start), end: dateKey_(end) };
}

function getPeriodRangeFromStart_(period, startDateText) {
  const today = stripTime_(new Date());
  const todayKey = dateKey_(today);

  if (period === 'daily') {
    return { start: todayKey, end: todayKey };
  }

  const anchor = stripTime_(parseDate_(normalizeDateInput_(startDateText || todayKey)));

  if (anchor.getTime() > today.getTime()) {
    if (period === 'weekly') {
      const cycleEnd = new Date(anchor);
      cycleEnd.setDate(anchor.getDate() + 6);
      return { start: dateKey_(anchor), end: dateKey_(cycleEnd) };
    }
    if (period === 'monthly') {
      const anchorDay = anchor.getDate();
      const nextMonth = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 1);
      const nextCycleStart = new Date(nextMonth.getFullYear(), nextMonth.getMonth(), Math.min(anchorDay, daysInMonth_(nextMonth.getFullYear(), nextMonth.getMonth())));
      const cycleEnd = new Date(nextCycleStart);
      cycleEnd.setDate(cycleEnd.getDate() - 1);
      return { start: dateKey_(anchor), end: dateKey_(cycleEnd) };
    }
  }

  if (period === 'weekly') {
    const diffDays = Math.floor((today.getTime() - anchor.getTime()) / 86400000);
    const weeksPassed = Math.floor(diffDays / 7);
    const cycleStart = new Date(anchor);
    cycleStart.setDate(cycleStart.getDate() + weeksPassed * 7);
    const cycleEnd = new Date(cycleStart);
    cycleEnd.setDate(cycleStart.getDate() + 6);
    return { start: dateKey_(cycleStart), end: dateKey_(cycleEnd) };
  }

  if (period === 'monthly') {
    const anchorDay = anchor.getDate();
    let cycleStart = new Date(today.getFullYear(), today.getMonth(), Math.min(anchorDay, daysInMonth_(today.getFullYear(), today.getMonth())));
    if (cycleStart.getTime() > today.getTime()) {
      const prevMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      cycleStart = new Date(prevMonth.getFullYear(), prevMonth.getMonth(), Math.min(anchorDay, daysInMonth_(prevMonth.getFullYear(), prevMonth.getMonth())));
    }
    const nextAnchorMonth = new Date(cycleStart.getFullYear(), cycleStart.getMonth() + 1, 1);
    const nextCycleStart = new Date(nextAnchorMonth.getFullYear(), nextAnchorMonth.getMonth(), Math.min(anchorDay, daysInMonth_(nextAnchorMonth.getFullYear(), nextAnchorMonth.getMonth())));
    const cycleEnd = new Date(nextCycleStart);
    cycleEnd.setDate(cycleEnd.getDate() - 1);
    return { start: dateKey_(cycleStart), end: dateKey_(cycleEnd) };
  }

  return getPeriodRange_(period);
}

function daysInMonth_(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function stripTime_(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addFrequency_(dateText, frequency) {
  const date = parseDate_(dateText);
  if (frequency === 'weekly') date.setDate(date.getDate() + 7);
  else if (frequency === 'monthly') date.setMonth(date.getMonth() + 1);
  else date.setDate(date.getDate() + 1);
  return dateKey_(date);
}

function percentChange_(current, previous) {
  current = Number(current || 0);
  previous = Number(previous || 0);
  if (previous === 0 && current === 0) return 0;
  if (previous === 0) return 100;
  return Math.round(((current - previous) / previous) * 100);
}

function roundMoney_(amount) {
  return Math.round(Number(amount || 0) * 100) / 100;
}

function clamp_(value, min, max) {
  if (isNaN(value)) return min;
  return Math.max(min, Math.min(max, value));
}

function toBoolean_(value) {
  return value === true || String(value).toLowerCase() === 'true';
}

function isCurrentTimeWindow_(hhmm) {
  const now = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'HH:mm');
  const nowParts = now.split(':').map(Number);
  const targetParts = normalizeTime_(hhmm).split(':').map(Number);
  const nowMin = nowParts[0] * 60 + nowParts[1];
  const targetMin = targetParts[0] * 60 + targetParts[1];
  return nowMin >= targetMin && nowMin < targetMin + 15;
}

function isAfterLocalHour_(hour) {
  const localHour = Number(Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'H'));
  return localHour >= hour;
}

function formatCurrency_(value) {
  return '฿' + Number(value || 0).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
