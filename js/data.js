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
    // Sync to Supabase if connected
    if (typeof SupabaseDB !== 'undefined' && SupabaseDB.isConnected) {
      SupabaseDB._enqueue('upsert', 'audit_logs', record);
    }
  },

  // مزامنة إعدادات الشركة مع Supabase
  saveCompany() {
    if (typeof SupabaseDB !== 'undefined' && SupabaseDB.isConnected) {
      SupabaseDB.saveCompany();
    }
  },
};
