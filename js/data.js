/* =========================================================
   ATTENDIFY PRO — DATA STORE
   ========================================================= */

const DB = {

  // ─── ADMIN CREDENTIALS (يتم تعديلها من الإعدادات) ────────
  adminCredentials: {
    email: '',
    password: '',
  },

  // ─── COMPANY ──────────────────────────────────────────────
  company: {
    name: '',
    nameEn: '',
    logo: '',
    address: '',
    phone: '',
    email: '',
    website: '',
    timezone: 'Asia/Riyadh',
    currency: 'SAR',
    workStart: '08:00',
    workEnd: '17:00',
    lateThreshold: 15,
    breakEnabled: false,
    overtimeEnabled: false,
    workPeriods: [
      { id: 'wp1', label: 'فترة العمل', start: '08:00', end: '17:00' },
    ],
    workDays: ['sat','sun','mon','tue','wed','thu'],
    weekend:  ['fri'],
    branches: [],
    holidays: [
      { id: 'h1', name: 'اليوم الوطني', date: '2025-09-23', days: 2 },
    ],
    payrollComponents: {
      housing: false, transport: false, phone: false,
      special: false, annualBonus: false, performanceBonus: false,
    },
    portalSettings: {
      enabled: true, checkin: true, leaves: true,
      payslip: true, profile: true, msg: false, forceChange: true,
    },
    securitySettings: {
      twoFactor: false, autoLogout: true, idleTimeout: '30',
      singleSession: false, logLogins: true,
      passMinLen: 8, passRenewalDays: 90, passMaxAttempts: 5,
      passNums: true, passSymbols: false, passMixed: true, passHistory: true,
      ipRestrict: false, allowedIPs: '',
    },
    backupSettings: {
      auto: true, freq: 'daily', time: '02:00', retention: 30, loc: 'local',
    },
  },

  // ─── DEPARTMENTS ──────────────────────────────────────────
  departments: [],

  // ─── EMPLOYEES ────────────────────────────────────────────
  employees: [],

  // ─── SHIFTS ───────────────────────────────────────────────
  shifts: [],

  // ─── ATTENDANCE ───────────────────────────────────────────
  attendance: [],

  // ─── LEAVES ───────────────────────────────────────────────
  leaves: [],

  // Leave balances per employee
  leaveBalances: {},

  // ─── REQUESTS ─────────────────────────────────────────────
  requests: [],

  // ─── NOTIFICATIONS ────────────────────────────────────────
  notifications: [],

  // ─── PAYROLL ──────────────────────────────────────────────
  payroll: [],

  // ─── DEDUCTIONS ───────────────────────────────────────────
  deductions: [],

  // ─── GPS LOCATIONS ────────────────────────────────────────
  locations: [],

  // ─── DEVICES (أجهزة البصمة) ──────────────────────────────
  devices: [],

  // ─── LOANS / ADVANCES ────────────────────────────────────
  loans: [],

  // ─── EXPENSES ─────────────────────────────────────────────
  expenses: [],

  // ─── AUDIT LOGS ───────────────────────────────────────────
  audit: [],

  // ─── ROLES ────────────────────────────────────────────────
  roles: [
    {
      id: 'role1', name: 'مدير النظام', nameEn: 'System Admin', color: 'gradient-danger',
      users: [],
      permissions: {
        employees:  { view: true,  create: true,  edit: true,  delete: true,  approve: true },
        attendance: { view: true,  create: true,  edit: true,  delete: true,  approve: true },
        leaves:     { view: true,  create: true,  edit: true,  delete: true,  approve: true },
        requests:   { view: true,  create: true,  edit: true,  delete: true,  approve: true },
        reports:    { view: true,  create: true,  edit: true,  delete: true,  approve: true },
        payroll:    { view: true,  create: true,  edit: true,  delete: true,  approve: true },
        settings:   { view: true,  create: true,  edit: true,  delete: true,  approve: true },
        roles:      { view: true,  create: true,  edit: true,  delete: true,  approve: true },
      }
    },
    {
      id: 'role2', name: 'مدير الموارد البشرية', nameEn: 'HR Manager', color: 'gradient-primary',
      users: [],
      permissions: {
        employees:  { view: true,  create: true,  edit: true,  delete: false, approve: true  },
        attendance: { view: true,  create: true,  edit: true,  delete: false, approve: true  },
        leaves:     { view: true,  create: true,  edit: true,  delete: false, approve: true  },
        requests:   { view: true,  create: true,  edit: true,  delete: false, approve: true  },
        reports:    { view: true,  create: true,  edit: false, delete: false, approve: false },
        payroll:    { view: true,  create: false, edit: false, delete: false, approve: false },
        settings:   { view: true,  create: false, edit: true,  delete: false, approve: false },
        roles:      { view: true,  create: false, edit: false, delete: false, approve: false },
      }
    },
    {
      id: 'role3', name: 'مدير القسم', nameEn: 'Department Manager', color: 'gradient-success',
      users: [],
      permissions: {
        employees:  { view: true,  create: false, edit: false, delete: false, approve: false },
        attendance: { view: true,  create: false, edit: false, delete: false, approve: false },
        leaves:     { view: true,  create: true,  edit: false, delete: false, approve: true  },
        requests:   { view: true,  create: false, edit: false, delete: false, approve: true  },
        reports:    { view: true,  create: false, edit: false, delete: false, approve: false },
        payroll:    { view: false, create: false, edit: false, delete: false, approve: false },
        settings:   { view: false, create: false, edit: false, delete: false, approve: false },
        roles:      { view: false, create: false, edit: false, delete: false, approve: false },
      }
    },
    {
      id: 'role4', name: 'موظف', nameEn: 'Employee', color: 'gradient-indigo',
      users: [],
      permissions: {
        employees:  { view: false, create: false, edit: false, delete: false, approve: false },
        attendance: { view: true,  create: true,  edit: false, delete: false, approve: false },
        leaves:     { view: true,  create: true,  edit: false, delete: false, approve: false },
        requests:   { view: true,  create: true,  edit: false, delete: false, approve: false },
        reports:    { view: false, create: false, edit: false, delete: false, approve: false },
        payroll:    { view: true,  create: false, edit: false, delete: false, approve: false },
        settings:   { view: false, create: false, edit: false, delete: false, approve: false },
        roles:      { view: false, create: false, edit: false, delete: false, approve: false },
      }
    },
  ],

  // ─── HELPER METHODS ───────────────────────────────────────

  getEmployee(id) {
    return this.employees.find(e => e.id === id);
  },

  getDepartment(id) {
    return this.departments.find(d => d.id === id);
  },

  // يُعيد وردية الموظف الصحيحة ليوم مُحدَّد (يدعم تعدد الورديات حسب أيام الأسبوع)
  // emp.shifts = ['shiftId', ...] أو [{shiftId, days:[]}] — كل قالب وردية يحمل قائمة days الخاصة به
  getEmployeeShift(empId, dateStr) {
    const emp = typeof empId === 'object' ? empId : this.getEmployee(empId);
    if (!emp) return null;
    const ids = Array.isArray(emp.shifts)
      ? emp.shifts.map(a => (typeof a === 'string' ? a : a?.shiftId)).filter(Boolean)
      : (emp.shift ? [emp.shift] : []);
    if (!ids.length) return null;

    const dayKey = dateStr
      ? new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short' }).toLowerCase()
      : null;

    let matched = null;
    if (dayKey) {
      ids.forEach(sid => {
        const tpl = this.shifts.find(s => s.id === sid);
        if (!tpl) return;
        const days = (tpl.days && tpl.days.length) ? tpl.days : ['sat','sun','mon','tue','wed','thu'];
        if (days.includes(dayKey)) matched = tpl;
      });
    }
    return matched || this.shifts.find(s => s.id === ids[0]) || null;
  },

  // يُعيد دقائق التأخير الفعلية (بعد خصم فترة السماح) لسجل حضور مُعطى، مقابل وردية
  // الموظف الصحيحة ليوم السجل. يدعم الورديات الليلية التي يقع فيها الدخول بعد منتصف
  // الليل (يوم لاحق زمنياً لكن بنفس تاريخ السجل) — دون هذا الدعم يظهر الفارق سالباً
  // جداً فيُحسب الموظف "حاضر" رغم تأخره الفعلي.
  getLateMinutes(empId, dateStr, checkIn) {
    if (!checkIn) return 0;
    const shift = this.getEmployeeShift(empId, dateStr);
    const shiftStart = shift?.start || this.company.workStart || '08:00';
    const [sh, sm] = shiftStart.split(':').map(Number);
    const [ch, cm] = checkIn.split(':').map(Number);
    let diff = (ch*60+cm) - (sh*60+sm);
    if (diff < -12*60) diff += 24*60; // دخول بعد منتصف الليل لوردية ليلية
    const grace = this.company.lateThreshold || 15;
    return Math.max(0, diff - grace);
  },

  // يُعيد حالة الحضور (present/late) بناءً على وردية الموظف الحالية ليوم السجل،
  // بدلاً من الاعتماد على قيمة status المخزّنة وقت إنشاء السجل (والتي قد تصبح قديمة
  // إذا تغيّرت وردية الموظف لاحقاً). يُستخدم فقط للسجلات التي فيها checkIn فعلي.
  computeAttendanceStatus(empId, dateStr, checkIn) {
    if (!checkIn) return null;
    return this.getLateMinutes(empId, dateStr, checkIn) > 0 ? 'late' : 'present';
  },

  getEmployeesByDept(deptId) {
    return this.employees.filter(e => e.dept === deptId);
  },

  getTodayAttendance() {
    const today = new Date().toISOString().split('T')[0];
    return this.attendance.filter(a => a.date === today).map(a => {
      if (!a.checkIn || (a.status !== 'late' && a.status !== 'present')) return a;
      return { ...a, status: this.computeAttendanceStatus(a.empId, a.date, a.checkIn) };
    });
  },

  getAttendanceStats() {
    const todayAtt = this.getTodayAttendance();
    const total    = this.employees.filter(e => e.status === 'active').length;
    const present  = todayAtt.filter(a => a.status === 'present').length;
    const late     = todayAtt.filter(a => a.status === 'late').length;
    const today    = new Date().toISOString().split('T')[0];
    const onLeave  = this.leaves.filter(l =>
      l.status === 'approved' && l.from <= today && l.to >= today
    ).length;
    const absent = Math.max(0, total - present - late - onLeave);
    const attendanceRate = total > 0 ? Math.round(((present + late) / total) * 100) : 0;
    return { total, present, late, onLeave, absent, attendanceRate };
  },

  getAttendanceTrend() {
    const trend      = [];
    const today      = new Date();
    const active     = this.employees.filter(e => e.status === 'active').length;
    const workDayNames = this.company.workDays || ['sat','sun','mon','tue','wed','thu'];
    const allDayNames  = ['sun','mon','tue','wed','thu','fri','sat'];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr  = d.toISOString().split('T')[0];
      const isWorkDay = workDayNames.includes(allDayNames[d.getDay()]);
      const dayAtt   = this.attendance.filter(a => a.date === dateStr);
      const present  = dayAtt.filter(a => a.status === 'present').length;
      const late     = dayAtt.filter(a => a.status === 'late').length;
      // Compute absent: active employees minus those who checked in (only for work days)
      const absent   = isWorkDay ? Math.max(0, active - present - late) : 0;
      trend.push({ date: dateStr, present, late, absent, total: active });
    }
    return trend;
  },

  getPendingCount() {
    return {
      leaves:        this.leaves.filter(l => l.status === 'pending').length,
      requests:      this.requests.filter(r => r.status === 'pending').length,
      notifications: this.notifications.filter(n => !n.read).length,
    };
  },

  // إضافة إشعار جديد تلقائياً
  addNotification({ title, desc, type = 'system', icon = 'fas fa-bell', iconBg = 'gradient-primary' }) {
    this.notifications.unshift({
      id: this.nextId('n'),
      title, desc, type, icon, iconBg,
      time: new Date().toISOString(),
      read: false,
    });
    // احتفظ بآخر 50 إشعار فقط
    if (this.notifications.length > 50) this.notifications.length = 50;
    this._scheduleSave();
    if (typeof App !== 'undefined') App._updateBadges();
  },

  _idSeq: 0,
  nextId(prefix) {
    return `${prefix}-${Date.now()}-${++this._idSeq}`;
  },

  nextEmpNo(firstName = '') {
    // خريطة تحويل الحروف العربية لمقابلها الإنجليزي (مع الحروف المركبة)
    const _ar = {
      'ا':'A', 'أ':'A', 'إ':'E', 'آ':'A', 'ء':'A', 'ئ':'Y',
      'ب':'B',
      'ت':'T', 'ث':'TH',
      'ج':'J',
      'ح':'H', 'خ':'KH',
      'د':'D', 'ذ':'DH',
      'ر':'R',
      'ز':'Z',
      'س':'S', 'ش':'SH', 'ص':'S', 'ض':'D',
      'ط':'T', 'ظ':'Z',
      'ع':'O', 'غ':'GH',
      'ف':'F',
      'ق':'Q', 'ك':'K',
      'ل':'L',
      'م':'M',
      'ن':'N',
      'ه':'H', 'ة':'H',
      'و':'W',
      'ي':'Y', 'ى':'Y',
    };
    const name = (firstName || '').trim();
    const ch   = name.charAt(0);
    let pre;
    if (ch === 'ع') {
      // ع ليس له مقابل ثابت — يُحدَّد بالحرف التالي
      const next = name.charAt(1);
      if (next === 'م' || next === 'ث')            pre = 'O'; // عمر، عثمان → O
      else if (next === 'ي')                        pre = 'I'; // عيسى → I
      else                                          pre = 'A'; // عبدالله، علي، عادل → A
    } else {
      pre = ch ? (_ar[ch] || (/[a-z]/i.test(ch) ? ch.toUpperCase() : 'E')) : 'E';
    }
    // رقم متسلسل عالمي — يُستخرج من الجزء الرقمي لكل الأكواد الموجودة
    const nums = this.employees
      .map(e => parseInt((e.no || '').replace(/^[^\d]+/, ''), 10))
      .filter(n => !isNaN(n) && n > 0);
    const seq = (nums.length ? Math.max(...nums) : 0) + 1;
    return pre + String(seq).padStart(3, '0');
  },

  // تسجيل حدث في سجل المراجعة
  logAudit(userId, action, module, details) {
    const record = {
      id:      this.nextId('a'),
      userId,
      action,
      module,
      details,
      ip:      '—',
      time:    new Date().toISOString(),
    };
    this.audit.unshift(record);
    if (typeof SupabaseDB !== 'undefined' && SupabaseDB.isConnected) {
      SupabaseDB._enqueue('upsert', 'audit_logs', record);
    }
    this._scheduleSave();
  },

  // مزامنة إعدادات الشركة مع Supabase
  saveCompany() {
    if (typeof SupabaseDB !== 'undefined' && SupabaseDB.isConnected) {
      SupabaseDB.saveCompany();
    }
    this._scheduleSave();
  },

  // ════════════════════════════════════════════════════════
  //  localStorage Persistence
  //  يحفظ كل البيانات محلياً — يعمل حتى بدون Supabase
  // ════════════════════════════════════════════════════════

  _saveTimer: null,

  // حفظ مؤجّل (debounced) لتجنب حفظ متكرر
  _scheduleSave() {
    clearTimeout(this._saveTimer);
    this._saveTimer = setTimeout(() => this._saveToLocal(), 200);
  },

  _saveToLocal() {
    try {
      const snap = {
        v:             2,
        ts:            Date.now(),
        company:       this.company,
        adminCreds:    this.adminCredentials,
        departments:   Array.from(this.departments),
        employees:     Array.from(this.employees),
        shifts:        Array.from(this.shifts),
        attendance:    Array.from(this.attendance),
        leaves:        Array.from(this.leaves),
        requests:      Array.from(this.requests),
        notifications: Array.from(this.notifications),
        payroll:       Array.from(this.payroll),
        deductions:    Array.from(this.deductions),
        loans:         Array.from(this.loans),
        expenses:      Array.from(this.expenses || []),
        locations:     Array.from(this.locations),
        devices:       Array.from(this.devices),
        roles:         Array.from(this.roles),
        audit:         Array.from(this.audit).slice(0, 300),
        leaveBalances: this.leaveBalances,
      };
      localStorage.setItem('attendify-db', JSON.stringify(snap));
    } catch(e) {
      console.warn('[DB] localStorage save failed:', e.message);
      if (e.name === 'QuotaExceededError') {
        if (typeof App !== 'undefined') App.toast('تحذير: مساحة التخزين ممتلئة، قد لا تُحفظ بعض البيانات', 'error');
      }
    }
  },

  loadFromLocal() {
    try {
      const raw = localStorage.getItem('attendify-db');
      if (!raw) return false;
      const snap = JSON.parse(raw);
      if (!snap?.v) return false;

      if (snap.company)    Object.assign(this.company, snap.company);
      if (snap.adminCreds) Object.assign(this.adminCredentials, snap.adminCreds);

      const arrays = ['departments','employees','shifts','attendance','leaves',
                      'requests','notifications','payroll','deductions','loans','expenses','locations','devices','roles','audit'];
      arrays.forEach(k => {
        if (Array.isArray(snap[k]) && snap[k].length) {
          this[k].length = 0;
          snap[k].forEach(r => Array.prototype.push.call(this[k], r));
        }
      });
      if (snap.leaveBalances && typeof snap.leaveBalances === 'object') {
        Object.assign(this.leaveBalances, snap.leaveBalances);
      }

      // إصلاح الـ IDs المتكررة في المصفوفات (ناتجة عن استخدام Date.now() في forEach)
      ['employees','departments','attendance','leaves','requests'].forEach(key => {
        const seen = new Set();
        this[key].forEach(r => {
          if (r.id && seen.has(r.id)) {
            r.id = `${r.id.split('-')[0]}-${Date.now()}-${++this._idSeq}`;
          }
          if (r.id) seen.add(r.id);
        });
      });

      console.log('[DB] Loaded from localStorage ✓', snap.ts ? new Date(snap.ts).toLocaleTimeString() : '');
      return true;
    } catch(e) {
      console.warn('[DB] localStorage load failed:', e.message);
      return false;
    }
  },

  // يُستدعى من كل الوحدات بعد أي تعديل
  save() {
    this._scheduleSave();
    // Trigger server sync for property mutations (not caught by proxy)
    if (typeof SupabaseDB !== 'undefined' && SupabaseDB.isConnected) {
      SupabaseDB._scheduleServerSync();
    }
  },

  // ─── تغليف المصفوفات بـ Proxy للحفظ التلقائي ────────────
  _wrapArrays() {
    const db = this;
    const keys = ['departments','employees','shifts','attendance','leaves',
                  'requests','notifications','payroll','deductions','locations','devices','roles','audit'];
    keys.forEach(key => {
      const arr = this[key];
      this[key] = new Proxy(arr, {
        get(target, prop) {
          if (['push','unshift'].includes(prop)) {
            return function(...args) {
              const r = Array.prototype[prop].apply(target, args);
              db._scheduleSave();
              return r;
            };
          }
          if (prop === 'splice') {
            return function(...args) {
              const r = Array.prototype.splice.apply(target, args);
              db._scheduleSave();
              return r;
            };
          }
          const val = target[prop];
          return typeof val === 'function' ? val.bind(target) : val;
        },
        set(target, prop, value) {
          target[prop] = value;
          if (!isNaN(prop)) db._scheduleSave();
          return true;
        },
      });
    });
  },
};
