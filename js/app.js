/* =========================================================
   ATTENDIFY PRO — CORE APPLICATION
   Router · Auth · Theme · Language · Utilities
   ========================================================= */

const App = {

  // State
  state: {
    user: null,
    currentPage: 'dashboard',
    sidebarCollapsed: false,
    theme: 'light',
    lang: 'ar',
    chartInstances: {},
  },

  // ─── INIT ────────────────────────────────────────────────
  async init() {
    // Load saved preferences
    this.state.theme = localStorage.getItem('app-theme') || 'light';
    this.state.lang  = localStorage.getItem('app-lang')  || 'ar';

    // Load admin credentials from localStorage
    try {
      const savedCreds = localStorage.getItem('admin-credentials');
      if (savedCreds) DB.adminCredentials = JSON.parse(savedCreds);
    } catch(e) {}

    // Apply theme & language
    this._applyTheme();
    initLanguage(); // from i18n.js

    // Restore saved color and font size
    const savedColor = localStorage.getItem('attendify-color');
    if (savedColor) document.documentElement.style.setProperty('--primary', savedColor);
    const savedFont = localStorage.getItem('attendify-font-size');
    if (savedFont) document.documentElement.style.fontSize = savedFont;
    // Restore API key
    const savedKey = localStorage.getItem('attendify-api-key');
    if (savedKey) { /* available for settings page */ }

    // Initialize Supabase (non-blocking — loads data in background)
    if (typeof SupabaseDB !== 'undefined') {
      SupabaseDB.init().then(ok => {
        if (ok) SupabaseDB.loadAll().then(() => {
          // Refresh current page if already showing app
          if (document.getElementById('app')?.style.display !== 'none') {
            const pg = this.state.currentPage;
            this.state.currentPage = '';
            this._navigate(pg);
          }
        });
      });
    }

    // Check saved session
    const savedUser = sessionStorage.getItem('app-user');
    if (savedUser) {
      try {
        this.state.user = JSON.parse(savedUser);
        this._showApp();
        return;
      } catch(e) { sessionStorage.removeItem('app-user'); }
    }

    // Show first-time setup or normal login
    if (!DB.adminCredentials.email) {
      this._showSetupForm();
    } else {
      document.getElementById('login-page').style.display = 'flex';
    }

    // Global keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        document.getElementById('global-search')?.focus();
      }
      if (e.key === 'Escape') {
        this.closeModal();
        this.closeNotifPanel();
        this.closeUserMenu();
      }
    });

    // Hash-based routing
    window.addEventListener('hashchange', () => this._route());

    // Click outside user dropdown
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.header-user')) this.closeUserMenu();
    });

    // Start live clock
    this._startClock();
  },

  // ─── AUTH ─────────────────────────────────────────────────
  login(e) {
    e.preventDefault();
    const email    = document.getElementById('login-email').value.trim().toLowerCase();
    const password = document.getElementById('login-password').value;
    const btn      = document.getElementById('login-btn');

    if (!email || !password) {
      this.toast('يرجى ملء جميع الحقول', 'error');
      return;
    }

    if (email !== DB.adminCredentials.email || password !== DB.adminCredentials.password) {
      this.toast('البريد الإلكتروني أو كلمة المرور غير صحيحة', 'error');
      return;
    }

    btn.innerHTML = `<span class="loading-spinner" style="width:20px;height:20px;border-width:2px;margin-left:8px"></span> <span>جارٍ التحميل...</span>`;
    btn.disabled = true;

    setTimeout(() => {
      const user = DB.employees.find(em => em.email === email) || {
        id: 'admin',
        name: email.split('@')[0],
        avatar: email.charAt(0).toUpperCase(),
        position: 'مدير النظام',
        email,
        avatarColor: 'gradient-primary',
      };
      this.state.user = user;
      sessionStorage.setItem('app-user', JSON.stringify(user));
      document.getElementById('login-page').style.display = 'none';
      this._showApp();
      this.toast(`أهلاً ${user.name}`, 'success');
      DB.logAudit(user.id, 'تسجيل دخول', 'النظام', 'تسجيل دخول ناجح');
    }, 800);
  },

  // ─── FIRST-TIME SETUP ────────────────────────────────────
  _showSetupForm() {
    document.getElementById('login-page').style.display = 'flex';
    const formBody = document.querySelector('.login-form-body');
    if (!formBody) return;
    formBody.innerHTML = `
      <div class="login-welcome">
        <h2>الإعداد الأولي</h2>
        <p>أنشئ حساب المدير للبدء باستخدام النظام</p>
      </div>
      <form id="setup-form" onsubmit="App.completeSetup(event)">
        <div class="form-group">
          <label>البريد الإلكتروني للمدير</label>
          <div class="input-wrapper">
            <i class="fas fa-envelope input-icon-left"></i>
            <input type="email" id="setup-email" placeholder="admin@company.com" class="form-input" required>
          </div>
        </div>
        <div class="form-group">
          <label>كلمة المرور (8 أحرف على الأقل)</label>
          <div class="input-wrapper">
            <i class="fas fa-lock input-icon-left"></i>
            <input type="password" id="setup-pass" placeholder="••••••••" class="form-input" required minlength="8">
            <button type="button" class="input-icon-right btn-icon" onclick="App.togglePasswordVisibility(this)">
              <i class="fas fa-eye"></i>
            </button>
          </div>
        </div>
        <div class="form-group">
          <label>تأكيد كلمة المرور</label>
          <div class="input-wrapper">
            <i class="fas fa-lock input-icon-left"></i>
            <input type="password" id="setup-confirm" placeholder="••••••••" class="form-input" required minlength="8">
            <button type="button" class="input-icon-right btn-icon" onclick="App.togglePasswordVisibility(this)">
              <i class="fas fa-eye"></i>
            </button>
          </div>
        </div>
        <button type="submit" class="btn-login-submit" id="setup-btn">
          <span>إنشاء الحساب والبدء</span>
          <i class="fas fa-arrow-left btn-arrow"></i>
        </button>
      </form>
    `;
  },

  completeSetup(e) {
    e.preventDefault();
    const email   = document.getElementById('setup-email').value.trim().toLowerCase();
    const pass    = document.getElementById('setup-pass').value;
    const confirm = document.getElementById('setup-confirm').value;
    const btn     = document.getElementById('setup-btn');

    if (pass !== confirm) { this.toast('كلمتا المرور غير متطابقتين', 'error'); return; }
    if (pass.length < 8)  { this.toast('يجب أن تكون كلمة المرور 8 أحرف على الأقل', 'error'); return; }

    DB.adminCredentials = { email, password: pass };
    localStorage.setItem('admin-credentials', JSON.stringify(DB.adminCredentials));

    btn.disabled = true;
    btn.innerHTML = '<span>جارٍ الإعداد...</span>';

    setTimeout(() => {
      const user = {
        id: 'admin',
        name: email.split('@')[0],
        avatar: email.charAt(0).toUpperCase(),
        position: 'مدير النظام',
        email,
        avatarColor: 'gradient-primary',
      };
      this.state.user = user;
      sessionStorage.setItem('app-user', JSON.stringify(user));
      document.getElementById('login-page').style.display = 'none';
      this._showApp();
      this.toast('تم إنشاء الحساب بنجاح! أهلاً بك', 'success');
    }, 600);
  },

  logout() {
    if (!confirm('هل تريد تسجيل الخروج؟')) return;
    sessionStorage.removeItem('app-user');
    this.state.user = null;
    Object.values(this.state.chartInstances).forEach(c => c?.destroy?.());
    this.state.chartInstances = {};
    document.getElementById('app').style.display = 'none';
    this.toast('تم تسجيل الخروج بنجاح', 'info');
    // Restore login form in case it was replaced by setup
    const formBody = document.querySelector('.login-form-body');
    if (formBody && !document.getElementById('login-form')) {
      location.reload();
      return;
    }
    const btn = document.getElementById('login-btn');
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = `<span>دخول لوحة الإدارة</span><i class="fas fa-arrow-left btn-arrow"></i>`;
    }
    document.getElementById('login-page').style.display = 'flex';
    applyTranslations();
  },

  // ─── SHOW APP ─────────────────────────────────────────────
  _showApp() {
    const appEl = document.getElementById('app');
    appEl.style.display = 'flex';

    // Update user info in sidebar and header
    const user = this.state.user;
    if (user) {
      const initials = user.avatar || user.name.charAt(0);
      ['sidebar-user-avatar', 'header-user-avatar', 'dropdown-avatar'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = initials;
      });
      const nameEl = document.getElementById('sidebar-user-info');
      if (nameEl) {
        nameEl.querySelector('.user-name-sm').textContent = user.name;
        nameEl.querySelector('.user-role-sm').textContent = user.position;
      }
      const hName  = document.getElementById('header-user-name');
      const hRole  = document.getElementById('header-user-role');
      const dName  = document.getElementById('dropdown-name');
      const dEmail = document.getElementById('dropdown-email');
      if (hName)  hName.textContent  = user.name;
      if (hRole)  hRole.textContent  = user.position;
      if (dName)  dName.textContent  = user.name;
      if (dEmail) dEmail.textContent = user.email || DB.adminCredentials.email || '';
    }

    // Show company logo in sidebar if uploaded
    if (typeof SettingsModule !== 'undefined') SettingsModule._updateSidebarLogo();

    // Update notification badges
    this._updateBadges();

    // Notification dot
    const counts = DB.getPendingCount();
    const dot = document.getElementById('notif-dot');
    if (dot) dot.style.display = counts.notifications > 0 ? 'block' : 'none';

    // Navigate to current hash or dashboard
    const hash = window.location.hash.slice(1) || 'dashboard';
    this._navigate(hash);
  },

  // ─── ROUTER ───────────────────────────────────────────────
  _route() {
    const page = window.location.hash.slice(1) || 'dashboard';
    this._navigate(page);
  },

  _navigate(page) {
    this.state.currentPage = page;

    // Update active nav item
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.toggle('active', item.dataset.page === page);
    });

    // Update breadcrumb
    const breadcrumb = document.getElementById('breadcrumb');
    if (breadcrumb) {
      breadcrumb.textContent = t(`nav.${page}`) || page;
    }

    // Update document title
    document.title = `${t(`nav.${page}`) || page} — Attendify Pro`;

    // Instant transition using CSS animation
    const content = document.getElementById('page-content');
    content.style.opacity = '0';
    content.style.transform = 'translateY(10px)';
    content.style.transition = 'opacity 0.15s ease, transform 0.15s ease';

    // Close panels
    this.closeNotifPanel();
    this.closeUserMenu();

    // Destroy existing charts
    Object.values(this.state.chartInstances).forEach(c => c?.destroy?.());
    this.state.chartInstances = {};

    // Load module after fade-out
    setTimeout(() => {
      try {
        const modules = {
          dashboard:     () => DashboardModule.render(content),
          employees:     () => EmployeesModule.render(content),
          attendance:    () => AttendanceModule.render(content),
          shifts:        () => ShiftsModule.render(content),
          leaves:        () => LeavesModule.render(content),
          requests:      () => RequestsModule.render(content),
          departments:   () => DepartmentsModule.render(content),
          reports:       () => ReportsModule.render(content),
          notifications: () => NotificationsModule.render(content),
          payroll:       () => PayrollModule.render(content),
          gps:           () => GpsModule.render(content),
          audit:         () => AuditModule.render(content),
          settings:      () => SettingsModule.render(content),
          roles:         () => RolesModule.render(content),
        };

        if (modules[page]) {
          modules[page]();
        } else {
          content.innerHTML = `<div class="empty-state"><div class="empty-icon"><i class="fas fa-exclamation-circle"></i></div><div class="empty-title">الصفحة غير موجودة</div><p class="empty-desc">الوحدة <strong>${page}</strong> غير متاحة</p></div>`;
        }

        // Fade-in after render
        requestAnimationFrame(() => {
          content.style.opacity = '1';
          content.style.transform = 'translateY(0)';
          setTimeout(() => {
            content.style.transition = '';
            if (typeof animateCounters === 'function') animateCounters(content);
          }, 100);
        });
      } catch (err) {
        console.error('Module render error:', err);
        content.innerHTML = `<div class="empty-state"><div class="empty-icon"><i class="fas fa-bug"></i></div><div class="empty-title">خطأ في التحميل</div><p class="empty-desc">${err.message}</p></div>`;
        content.style.opacity = '1';
        content.style.transform = 'translateY(0)';
      }
    }, 80);
  },

  navigate(page) {
    window.location.hash = page;
  },

  // ─── THEME ────────────────────────────────────────────────
  toggleTheme() {
    this.state.theme = this.state.theme === 'light' ? 'dark' : 'light';
    this._applyTheme();
    localStorage.setItem('app-theme', this.state.theme);
    // Re-render charts after theme change
    setTimeout(() => this._route(), 50);
  },

  _applyTheme() {
    document.documentElement.dataset.theme = this.state.theme;
    const isDark = this.state.theme === 'dark';
    document.querySelectorAll('#theme-icon, #theme-icon-login').forEach(el => {
      if (el) el.className = isDark ? 'fas fa-sun' : 'fas fa-moon';
    });
  },

  // ─── LANGUAGE ─────────────────────────────────────────────
  setLanguage(lang) {
    this.state.lang = lang;
    setLanguage(lang); // from i18n.js

    // Re-render current page
    if (this.state.user) {
      setTimeout(() => this._navigate(this.state.currentPage), 50);
    }
  },

  toggleLanguage() {
    this.setLanguage(this.state.lang === 'ar' ? 'en' : 'ar');
  },

  // ─── SIDEBAR ──────────────────────────────────────────────
  toggleSidebar() {
    const sidebar  = document.getElementById('sidebar');
    const appWrap  = document.querySelector('.app-wrapper');
    const isMobile = window.innerWidth <= 768;

    if (isMobile) {
      sidebar.classList.toggle('mobile-open');
      const overlay = document.createElement('div');
      overlay.className = 'sidebar-mobile-overlay';
      overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:299';
      overlay.onclick = () => { sidebar.classList.remove('mobile-open'); overlay.remove(); };
      if (sidebar.classList.contains('mobile-open')) {
        document.body.appendChild(overlay);
      } else {
        document.querySelector('.sidebar-mobile-overlay')?.remove();
      }
    } else {
      this.state.sidebarCollapsed = !this.state.sidebarCollapsed;
      sidebar.classList.toggle('collapsed', this.state.sidebarCollapsed);
      appWrap.classList.toggle('sidebar-collapsed', this.state.sidebarCollapsed);
    }
  },

  // ─── NOTIFICATION PANEL ───────────────────────────────────
  toggleNotifPanel() {
    const panel   = document.getElementById('notif-panel');
    const overlay = document.getElementById('notif-overlay');
    const isOpen  = panel.classList.contains('open');

    if (!isOpen) {
      this._populateNotifPanel();
      panel.classList.add('open');
      overlay.classList.add('open');
    } else {
      this.closeNotifPanel();
    }
  },

  closeNotifPanel() {
    document.getElementById('notif-panel')?.classList.remove('open');
    document.getElementById('notif-overlay')?.classList.remove('open');
  },

  _populateNotifPanel(filter = 'all') {
    const list = document.getElementById('notif-panel-list');
    if (!list) return;

    const notifs = filter === 'all'
      ? DB.notifications
      : DB.notifications.filter(n => n.type === filter);

    if (!notifs.length) {
      list.innerHTML = `<div class="empty-state" style="padding:32px"><div class="empty-icon"><i class="fas fa-bell-slash"></i></div><p class="empty-desc">لا توجد إشعارات</p></div>`;
      return;
    }

    list.innerHTML = notifs.map(n => {
      const time = this.timeAgo(n.time);
      return `
        <div class="notif-item ${n.read ? '' : 'unread'}" onclick="App.markNotifRead('${n.id}', this)">
          <div class="notif-icon ${n.iconBg}" style="color:white">${n.icon ? `<i class="${n.icon}"></i>` : ''}</div>
          <div class="notif-content">
            <div class="notif-title">${n.title}</div>
            <div class="notif-desc">${n.desc}</div>
            <div class="notif-time"><i class="fas fa-clock" style="font-size:10px"></i> ${time}</div>
          </div>
        </div>
      `;
    }).join('');

    // Filter tab click
    document.querySelectorAll('.notif-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.notif-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        this._populateNotifPanel(tab.dataset.filter);
      });
    });
  },

  markNotifRead(id, el) {
    const notif = DB.notifications.find(n => n.id === id);
    if (notif) {
      notif.read = true;
      el?.classList.remove('unread');
      this._updateBadges();
    }
  },

  markAllRead() {
    DB.notifications.forEach(n => n.read = true);
    this._populateNotifPanel();
    this._updateBadges();
    const dot = document.getElementById('notif-dot');
    if (dot) dot.style.display = 'none';
    this.toast('تم تحديد كل الإشعارات كمقروءة', 'success');
  },

  // ─── USER MENU ────────────────────────────────────────────
  toggleUserMenu() {
    const dropdown = document.getElementById('user-dropdown');
    const chevron  = document.getElementById('user-chevron');
    const isOpen   = dropdown.style.display !== 'none';
    dropdown.style.display = isOpen ? 'none' : 'block';
    if (chevron) chevron.style.transform = isOpen ? '' : 'rotate(180deg)';
  },

  closeUserMenu() {
    const dropdown = document.getElementById('user-dropdown');
    const chevron  = document.getElementById('user-chevron');
    if (dropdown) dropdown.style.display = 'none';
    if (chevron) chevron.style.transform = '';
  },

  // ─── MODAL ────────────────────────────────────────────────
  openModal(title, bodyHTML, { size = 'normal', onClose } = {}) {
    const overlay = document.getElementById('modal-overlay');
    const modal   = document.getElementById('global-modal');
    const titleEl = document.getElementById('modal-title');
    const bodyEl  = document.getElementById('modal-body');

    titleEl.textContent = title;
    bodyEl.innerHTML    = bodyHTML;

    if (size === 'lg') modal.style.maxWidth = '860px';
    else if (size === 'sm') modal.style.maxWidth = '440px';
    else modal.style.maxWidth = '640px';

    overlay.classList.add('open');
    modal.classList.add('open');
    modal.style.display = 'flex';
    overlay.style.display = 'block';

    if (onClose) modal._onClose = onClose;
  },

  closeModal() {
    const overlay = document.getElementById('modal-overlay');
    const modal   = document.getElementById('global-modal');
    overlay.classList.remove('open');
    modal.classList.remove('open');
    modal.style.display = 'none';
    overlay.style.display = 'none';
    if (modal._onClose) { modal._onClose(); modal._onClose = null; }
  },

  // ─── TOAST ────────────────────────────────────────────────
  toast(message, type = 'info', duration = 3500) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const icons = { success: 'fa-circle-check', error: 'fa-circle-xmark', warning: 'fa-triangle-exclamation', info: 'fa-circle-info' };
    const id = `toast-${Date.now()}`;

    const toast = document.createElement('div');
    toast.className = `toast-item ${type}`;
    toast.id = id;
    toast.innerHTML = `
      <i class="fas ${icons[type] || icons.info}"></i>
      <div style="flex:1">${message}</div>
      <span style="cursor:pointer;opacity:.5;font-size:12px;padding:2px 4px" onclick="App._removeToast('${id}')"><i class="fas fa-xmark"></i></span>
    `;

    container.appendChild(toast);

    setTimeout(() => this._removeToast(id), duration);
  },

  _removeToast(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.add('removing');
    setTimeout(() => el.remove(), 260);
  },

  // ─── BADGES ───────────────────────────────────────────────
  _updateBadges() {
    const counts = DB.getPendingCount();
    const leaveBadge  = document.getElementById('badge-leaves');
    const reqBadge    = document.getElementById('badge-requests');
    const notifBadge  = document.getElementById('badge-notifications');

    if (leaveBadge)  { leaveBadge.textContent  = counts.leaves;        leaveBadge.style.display  = counts.leaves > 0 ? 'inline' : 'none'; }
    if (reqBadge)    { reqBadge.textContent    = counts.requests;      reqBadge.style.display    = counts.requests > 0 ? 'inline' : 'none'; }
    if (notifBadge)  { notifBadge.textContent  = counts.notifications; notifBadge.style.display  = counts.notifications > 0 ? 'inline' : 'none'; }
  },

  // ─── CLOCK ────────────────────────────────────────────────
  _startClock() {
    const updateClock = () => {
      const now     = new Date();
      const timeEl  = document.getElementById('live-time');
      const dateEl  = document.getElementById('live-date');

      if (timeEl) {
        timeEl.textContent = now.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      }
      if (dateEl) {
        dateEl.textContent = now.toLocaleDateString(currentLang === 'ar' ? 'ar-SA' : 'en-US', {
          weekday: 'long', year: 'numeric', month: 'short', day: 'numeric'
        });
      }
    };
    updateClock();
    setInterval(updateClock, 1000);
  },

  // ─── UTILITIES ────────────────────────────────────────────

  togglePasswordVisibility(btn) {
    const input = btn.closest('.input-wrapper').querySelector('input');
    const icon  = btn.querySelector('i');
    if (input.type === 'password') {
      input.type = 'text';
      icon.className = 'fas fa-eye-slash';
    } else {
      input.type = 'password';
      icon.className = 'fas fa-eye';
    }
  },

  formatDate(dateStr, options = {}) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString(currentLang === 'ar' ? 'ar-SA' : 'en-US', {
      year: 'numeric', month: 'short', day: 'numeric', ...options
    });
  },

  formatCurrency(amount) {
    return new Intl.NumberFormat(currentLang === 'ar' ? 'ar-SA' : 'en-US', {
      style: 'currency', currency: 'SAR', minimumFractionDigits: 0
    }).format(amount);
  },

  timeAgo(dateStr) {
    const date = new Date(dateStr);
    const now  = new Date();
    const diff = Math.floor((now - date) / 1000);

    if (diff < 60)  return currentLang === 'ar' ? 'الآن' : 'Just now';
    if (diff < 3600) return currentLang === 'ar' ? `منذ ${Math.floor(diff/60)} دقيقة` : `${Math.floor(diff/60)}m ago`;
    if (diff < 86400) return currentLang === 'ar' ? `منذ ${Math.floor(diff/3600)} ساعة` : `${Math.floor(diff/3600)}h ago`;
    if (diff < 604800) return currentLang === 'ar' ? `منذ ${Math.floor(diff/86400)} يوم` : `${Math.floor(diff/86400)}d ago`;
    return this.formatDate(dateStr);
  },

  getStatusBadge(status) {
    const map = {
      active:   { class: 'badge-success', label: t('common.active') },
      inactive: { class: 'badge-secondary', label: t('common.inactive') },
      on_leave: { class: 'badge-warning',  label: t('nav.leaves') },
      present:  { class: 'badge-success',  label: t('attendance.present') },
      late:     { class: 'badge-warning',  label: t('attendance.late') },
      absent:   { class: 'badge-danger',   label: t('attendance.present').replace('حاضر','غائب') },
      pending:  { class: 'badge-warning',  label: t('common.pending') },
      approved: { class: 'badge-success',  label: t('common.approved') },
      rejected: { class: 'badge-danger',   label: t('common.rejected') },
    };
    const s = map[status] || { class: 'badge-secondary', label: status };
    return `<span class="badge ${s.class} badge-dot">${s.label}</span>`;
  },

  getMethodIcon(method) {
    const icons = {
      face:   '<i class="fas fa-face-smile" style="color:var(--primary)"></i>',
      qr:     '<i class="fas fa-qrcode"     style="color:var(--success)"></i>',
      manual: '<i class="fas fa-hand"       style="color:var(--warning)"></i>',
      gps:    '<i class="fas fa-map-pin"    style="color:var(--danger)"></i>',
    };
    return icons[method] || '<i class="fas fa-circle"></i>';
  },

  getLeaveTypeLabel(type) {
    const types = {
      annual:    { label: t('leaves.annual'),    color: '#6366f1' },
      sick:      { label: t('leaves.sick'),      color: '#ef4444' },
      emergency: { label: t('leaves.emergency'), color: '#f59e0b' },
      unpaid:    { label: t('leaves.unpaid'),    color: '#94a3b8' },
      maternity: { label: t('leaves.maternity'), color: '#ec4899' },
      paternity: { label: t('leaves.paternity'), color: '#3b82f6' },
    };
    return types[type] || { label: type, color: '#6b7280' };
  },

  getRequestTypeLabel(type) {
    const types = {
      overtime:       t('requests.overtime'),
      wfh:            t('requests.wfh'),
      scheduleChange: t('requests.scheduleChange'),
      loan:           t('requests.loan'),
      advance:        t('requests.advance'),
      document:       t('requests.document'),
      other:          t('requests.other'),
    };
    return types[type] || type;
  },

  // Register a chart instance for cleanup
  registerChart(id, instance) {
    if (this.state.chartInstances[id]) {
      this.state.chartInstances[id].destroy();
    }
    this.state.chartInstances[id] = instance;
  },

  // Chart default options
  getChartDefaults() {
    const isDark = this.state.theme === 'dark';
    return {
      color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)',
      grid:  isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
      font:  currentLang === 'ar' ? 'Cairo' : 'Inter',
    };
  },

  // Generate avatar color based on id
  getAvatarGradient(empId) {
    const colors = ['gradient-primary','gradient-success','gradient-warning','gradient-danger','gradient-indigo','gradient-cyan','gradient-rose'];
    const emp = DB.getEmployee(empId);
    return emp?.avatarColor || colors[empId.charCodeAt(empId.length-1) % colors.length];
  },

  // Export to CSV (simple implementation)
  exportCSV(data, filename) {
    if (!data.length) { this.toast('لا توجد بيانات للتصدير', 'warning'); return; }
    const headers = Object.keys(data[0]).join(',');
    const rows    = data.map(row => Object.values(row).map(v => `"${v}"`).join(','));
    const csv     = [headers, ...rows].join('\n');
    const blob    = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url     = URL.createObjectURL(blob);
    const a       = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
    this.toast('تم تصدير الملف بنجاح', 'success');
  },

  // Print page
  printPage() {
    window.print();
  },

  // Confirm dialog
  confirm(message, onConfirm) {
    const html = `
      <div style="text-align:center;padding:16px 0">
        <div style="font-size:48px;margin-bottom:16px">⚠️</div>
        <p style="font-size:16px;color:var(--text-primary);font-weight:600;margin-bottom:8px">تأكيد الإجراء</p>
        <p style="font-size:14px;color:var(--text-muted);margin-bottom:24px">${message}</p>
        <div style="display:flex;gap:10px;justify-content:center">
          <button class="btn btn-danger" onclick="(${onConfirm.toString()})(); App.closeModal()">تأكيد</button>
          <button class="btn btn-secondary" onclick="App.closeModal()">إلغاء</button>
        </div>
      </div>
    `;
    this.openModal('تأكيد', html, { size: 'sm' });
  },
};

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  App.init();
  _initRipple();
  _initStagger();
});

/* Ripple effect on .btn clicks */
function _initRipple() {
  document.addEventListener('click', e => {
    const btn = e.target.closest('.btn:not(.no-ripple)');
    if (!btn) return;
    const r = document.createElement('span');
    const rect = btn.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height) * 2;
    r.style.cssText = `position:absolute;border-radius:50%;pointer-events:none;
      width:${size}px;height:${size}px;
      left:${e.clientX - rect.left - size/2}px;
      top:${e.clientY - rect.top - size/2}px;
      background:rgba(255,255,255,0.25);
      transform:scale(0);animation:_ripple 0.5s ease forwards;z-index:0`;
    if (!document.getElementById('_ripple-style')) {
      const s = document.createElement('style');
      s.id = '_ripple-style';
      s.textContent = '@keyframes _ripple{to{transform:scale(1);opacity:0}}';
      document.head.appendChild(s);
    }
    btn.style.position = btn.style.position || 'relative';
    btn.style.overflow = 'hidden';
    btn.appendChild(r);
    setTimeout(() => r.remove(), 600);
  }, { passive: true });
}

/* Stagger animation for stat cards and table rows on page render */
function _initStagger() {
  const observer = new MutationObserver(mutations => {
    mutations.forEach(m => {
      m.addedNodes.forEach(node => {
        if (!(node instanceof HTMLElement)) return;
        /* stat cards */
        node.querySelectorAll?.('.stat-card:not(.stagger-item)').forEach((el, i) => {
          el.style.animationDelay = `${i * 55}ms`;
          el.classList.add('stagger-item');
        });
        /* already has class — just set delay */
        node.querySelectorAll?.('.stat-card.stagger-item').forEach((el, i) => {
          el.style.animationDelay = `${i * 55}ms`;
        });
        /* cards grid */
        node.querySelectorAll?.('.card:not(.stat-card):not(.stagger-item)').forEach((el, i) => {
          el.style.animationDelay = `${i * 40}ms`;
          el.classList.add('stagger-item');
        });
      });
    });
  });
  const content = document.getElementById('page-content');
  if (content) observer.observe(content, { childList: true, subtree: true });
}

/* Animate numeric stat values counting up */
function animateCounters(root) {
  (root || document).querySelectorAll('.stat-value').forEach(el => {
    const raw = el.textContent.trim();
    const num = parseFloat(raw.replace(/[^0-9.]/g, ''));
    if (!num || num < 2) return;
    const suffix = raw.replace(/[0-9.]/g, '');
    const dur = 700;
    const start = performance.now();
    const step = ts => {
      const p = Math.min((ts - start) / dur, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      el.textContent = (Math.round(num * ease)) + suffix;
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  });
}
