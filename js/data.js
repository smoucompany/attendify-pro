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
    branches: [],
    holidays: [
      { id: 'h1', name: 'اليوم الوطني', date: '2025-09-23', days: 2 },
    ],
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

  // ─── GPS LOCATIONS ────────────────────────────────────────
  locations: [],

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

  getEmployeesByDept(deptId) {
    return this.employees.filter(e => e.dept === deptId);
  },

  getTodayAttendance() {
    const today = new Date().toISOString().split('T')[0];
    return this.attendance.filter(a => a.date === today);
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
    const trend = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayAtt  = this.attendance.filter(a => a.date === dateStr);
      trend.push({
        date:    dateStr,
        present: dayAtt.filter(a => a.status === 'present').length,
        late:    dayAtt.filter(a => a.status === 'late').length,
        total:   dayAtt.length,
      });
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

  nextId(prefix) {
    return `${prefix}-${Date.now()}`;
  },

  nextEmpNo() {
    const nums = this.employees
      .map(e => parseInt(e.no))
      .filter(n => !isNaN(n));
    const max = nums.length ? Math.max(...nums) : 0;
    return String(max + 1).padStart(3, '0');
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
    this._saveTimer = setTimeout(() => this._saveToLocal(), 600);
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
        locations:     Array.from(this.locations),
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
      if (snap.adminCreds?.email) Object.assign(this.adminCredentials, snap.adminCreds);

      const arrays = ['departments','employees','shifts','attendance','leaves',
                      'requests','notifications','payroll','locations','roles','audit'];
      arrays.forEach(k => {
        if (Array.isArray(snap[k]) && snap[k].length) {
          this[k].length = 0;
          snap[k].forEach(r => Array.prototype.push.call(this[k], r));
        }
      });
      if (snap.leaveBalances && typeof snap.leaveBalances === 'object') {
        Object.assign(this.leaveBalances, snap.leaveBalances);
      }
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
    // Supabase sync handled by Proxy automatically
  },

  // ─── تغليف المصفوفات بـ Proxy للحفظ التلقائي ────────────
  _wrapArrays() {
    const db = this;
    const keys = ['departments','employees','shifts','attendance','leaves',
                  'requests','notifications','payroll','locations','roles','audit'];
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
