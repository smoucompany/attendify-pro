/* =========================================================
   ATTENDIFY PRO — CORE APPLICATION
   Router · Auth · Theme · Language · Utilities
   ========================================================= */

// ── HTML sanitizer — prevents XSS in all innerHTML assignments ──
function _esc(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ── SHA-256 hash (async, returns hex string) ──────────────────
async function _sha256(str) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join('');
}

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
    DB.loadFromLocal();
    DB._wrapArrays();

    this.state.theme = localStorage.getItem('app-theme') || 'light';
    this.state.lang  = localStorage.getItem('app-lang')  || 'ar';
    this._applyTheme();
    initLanguage();

    if (DB.company.favicon) {
      let favLink = document.querySelector("link[rel~='icon']");
      if (!favLink) { favLink = document.createElement('link'); favLink.rel = 'icon'; document.head.appendChild(favLink); }
      favLink.href = DB.company.favicon;
    }
    /* Apply settings from Settings Center (overrides old localStorage color) */
    try { window.SettingsCenterV2?.applyFromDB(); } catch(_) {}
    const savedFont = localStorage.getItem('attendify-font-size');
    if (savedFont) document.documentElement.style.fontSize = savedFont;

    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); document.getElementById('global-search')?.focus(); }
      if (e.key === 'Escape') { this.closeModal(); this.closeNotifPanel(); this.closeUserMenu(); }
    });
    window.addEventListener('hashchange', () => this._route());

    // Fix sidebar visibility on window resize (mobile ↔ desktop)
    window.addEventListener('resize', () => {
      const sidebar = document.getElementById('sidebar');
      if (!sidebar) return;
      if (window.innerWidth <= 1024) {
        sidebar.style.display = sidebar.classList.contains('mobile-open') ? '' : 'none';
      } else {
        sidebar.style.display = '';
        sidebar.classList.remove('mobile-open');
        document.querySelector('.sidebar-mobile-overlay')?.remove();
      }
    });
    document.addEventListener('click', (e) => { if (!e.target.closest('.sb-user-card') && !e.target.closest('.sidebar-user') && !e.target.closest('#user-dropdown')) this.closeUserMenu(); });
    this._startClock();

    // ── Supabase Auth (الاتصال الكامل) ───────────────────────
    const ok = await SupabaseDB.init();
    if (ok) {
      const session = await SupabaseDB.getSession();
      if (session) {
        // مستخدم مسجّل مسبقاً — استعادة الجلسة
        const meta = session.user.user_metadata || {};
        // Prefer locally-saved profile (survives hard refresh) over Supabase metadata
        let savedProfile = null;
        try { const sp = localStorage.getItem('attendify-user-profile'); if (sp) savedProfile = JSON.parse(sp); } catch(_) {}
        const baseName = meta.name || (session.user.email || '').split('@')[0] || 'User';
        const displayName = savedProfile?.name || DB.adminCredentials?.name || baseName || 'User';
        this.state.user = {
          id:          session.user.id,
          name:        displayName,
          avatar:      displayName.trim().charAt(0).toUpperCase() || '?',
          position:    savedProfile?.position || DB.adminCredentials?.position || 'مدير النظام',
          email:       session.user.email || '',
          avatarColor: savedProfile?.avatarColor || DB.adminCredentials?.avatarColor || 'gradient-primary',
        };
        await SupabaseDB.loadAll();
        this._showApp();
        return;
      }
      // لا توجد جلسة — هل هذا أول إعداد؟
      const firstTime = await SupabaseDB.isFirstSetup();
      if (firstTime) {
        this._showSetupForm();
      } else {
        // يوجد حسابات مسبقة — اعرض صفحة تسجيل الدخول
        document.getElementById('login-page').style.display = 'flex';
        // أخفِ رابط "إنشاء حساب" لأن النظام فيه مستخدمين
        const regLink = document.getElementById('btn-register-link');
        if (regLink) regLink.style.display = 'none';
      }
      return;
    }

    // ── Fallback: تسجيل دخول محلي (Supabase غير متاح) ───────
    const savedUser = sessionStorage.getItem('app-user') || localStorage.getItem('attendify-user-profile');
    if (savedUser) {
      try {
        const u = JSON.parse(savedUser);
        // Ensure all required state.user fields exist (profile snapshot may be a subset)
        if (!u.avatar && u.name) u.avatar = u.name.charAt(0).toUpperCase();
        if (!u.id)               u.id = 'admin';
        if (!u.avatarColor)      u.avatarColor = DB.adminCredentials?.avatarColor || 'gradient-primary';
        if (!u.position)         u.position    = DB.adminCredentials?.position    || 'مدير النظام';
        // Always prefer DB.adminCredentials for name/position if more recent (DB was loaded first)
        if (DB.adminCredentials?.name && !u.savedAt) u.name = DB.adminCredentials.name;
        this.state.user = u;
        this._showApp();
        return;
      } catch(e) { sessionStorage.removeItem('app-user'); }
    }
    if (!DB.adminCredentials.email) { this._showSetupForm(); } else { document.getElementById('login-page').style.display = 'flex'; }
  },

  // ─── AUTH ─────────────────────────────────────────────────

  // Brute-force lockout state (in-memory, resets on page refresh)
  _loginAttempts: 0,
  _loginLockedUntil: 0,
  _MAX_LOGIN_ATTEMPTS: 5,
  _LOGIN_LOCK_MS: 15 * 60 * 1000, // 15 minutes

  async login(e) {
    e.preventDefault();
    const email    = document.getElementById('login-email').value.trim().toLowerCase();
    const password = document.getElementById('login-password').value;
    const btn      = document.getElementById('login-btn');
    if (!email || !password) { this.toast('يرجى ملء جميع الحقول', 'error'); return; }

    // ── Brute-force check ──────────────────────────────────────
    const now = Date.now();
    if (this._loginLockedUntil > now) {
      const wait = Math.ceil((this._loginLockedUntil - now) / 60000);
      this.toast(`تم تعطيل تسجيل الدخول مؤقتاً. انتظر ${wait} دقيقة.`, 'error'); return;
    }

    btn.innerHTML = `<span class="loading-spinner" style="width:20px;height:20px;border-width:2px;margin-left:8px"></span> <span>جارٍ التحميل...</span>`;
    btn.disabled = true;

    const resetBtn = () => {
      btn.disabled = false;
      btn.innerHTML = `<span>دخول لوحة الإدارة</span><i class="fas fa-arrow-left btn-arrow"></i>`;
    };

    const _onFail = (msg) => {
      this._loginAttempts++;
      if (this._loginAttempts >= this._MAX_LOGIN_ATTEMPTS) {
        this._loginLockedUntil = Date.now() + this._LOGIN_LOCK_MS;
        this._loginAttempts = 0;
        this.toast('تم تعطيل تسجيل الدخول 15 دقيقة بسبب محاولات متكررة فاشلة.', 'error');
      } else {
        const left = this._MAX_LOGIN_ATTEMPTS - this._loginAttempts;
        this.toast(`${msg} (${left} محاولة متبقية)`, 'error');
      }
      resetBtn();
    };

    // ── Supabase Auth ──────────────────────────────────────────
    if (SupabaseDB.isConnected) {
      const { data, error } = await SupabaseDB.signIn(email, password);
      if (error || !data?.user) {
        _onFail('البريد الإلكتروني أو كلمة المرور غير صحيحة');
        return;
      }
      this._loginAttempts = 0; // reset on success
      const meta = data.user.user_metadata || {};
      const user = {
        id:          data.user.id,
        name:        meta.name || email.split('@')[0],
        avatar:      (meta.name || email).charAt(0)?.toUpperCase() || '?',
        position:    'مدير النظام',
        email,
        avatarColor: 'gradient-primary',
      };
      this.state.user = user;
      await SupabaseDB.loadAll();
      document.getElementById('login-page').style.display = 'none';
      this._showApp();
      this.toast(`أهلاً ${user.name}`, 'success');
      DB.logAudit(user.id, 'تسجيل دخول', 'النظام', 'تسجيل دخول ناجح عبر Supabase Auth');
      return;
    }

    // ── Fallback: تسجيل دخول محلي ────────────────────────────
    const stored = DB.adminCredentials;
    if (email !== stored.email) { _onFail('البريد الإلكتروني أو كلمة المرور غير صحيحة'); return; }
    let match = false;
    if (stored.password?.startsWith('sha256:')) {
      match = (await _sha256(password)) === stored.password.slice(7);
    } else {
      match = password === stored.password;
      if (match) { stored.password = 'sha256:' + (await _sha256(password)); DB._saveToLocal(); }
    }
    if (!match) { _onFail('البريد الإلكتروني أو كلمة المرور غير صحيحة'); return; }
    this._loginAttempts = 0;

    setTimeout(() => {
      const savedName = DB.adminCredentials.name || '';
      const user = DB.employees.find(em => em.email === email) || { id:'admin', name:savedName||email.split('@')[0], avatar:(savedName||email).charAt(0).toUpperCase(), position:'مدير النظام', email, avatarColor:'gradient-primary' };
      this.state.user = user;
      sessionStorage.setItem('app-user', JSON.stringify(user));
      document.getElementById('login-page').style.display = 'none';
      this._showApp();
      this.toast(`أهلاً ${user.name}`, 'success');
      DB.logAudit(user.id, 'تسجيل دخول', 'النظام', 'تسجيل دخول محلي');
    }, 500);
  },

  forgotPassword(e) {
    e && e.preventDefault();
    // Build a full-page overlay — works even before app loads
    const existing = document.getElementById('reset-overlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'reset-overlay';
    overlay.style.cssText = `
      position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;
      background:rgba(0,0,0,0.6);backdrop-filter:blur(6px);
    `;
    overlay.innerHTML = `
      <div style="background:var(--bg-card,#fff);border-radius:20px;padding:36px 32px;width:380px;max-width:90vw;
                  box-shadow:0 24px 60px rgba(0,0,0,0.25);text-align:center">
        <div style="width:56px;height:56px;border-radius:50%;background:linear-gradient(135deg,#f59e0b,#d97706);
                    display:flex;align-items:center;justify-content:center;margin:0 auto 16px;font-size:24px;color:#fff">
          <i class="fas fa-key"></i>
        </div>
        <h3 style="margin:0 0 6px;font-size:20px;font-weight:800;color:var(--text-primary,#1e293b)">استرجاع الحساب</h3>
        <p style="color:var(--text-muted,#64748b);font-size:13px;margin-bottom:24px">
          ${DB.adminCredentials?.email ? `البريد: <strong>${DB.adminCredentials.email}</strong>` : 'أدخل كلمة مرور جديدة'}
        </p>
        <div style="text-align:right;margin-bottom:12px">
          <label style="font-size:13px;font-weight:600;color:var(--text-primary,#1e293b);display:block;margin-bottom:6px">كلمة المرور الجديدة</label>
          <input type="password" id="rp-new" placeholder="8 أحرف على الأقل"
            style="width:100%;padding:11px 14px;border:1.5px solid var(--border,#e2e8f0);border-radius:10px;
                   font-size:14px;box-sizing:border-box;outline:none;background:var(--bg-input,#f8fafc);
                   color:var(--text-primary,#1e293b);font-family:inherit">
        </div>
        <div style="text-align:right;margin-bottom:24px">
          <label style="font-size:13px;font-weight:600;color:var(--text-primary,#1e293b);display:block;margin-bottom:6px">تأكيد كلمة المرور</label>
          <input type="password" id="rp-confirm" placeholder="••••••••"
            style="width:100%;padding:11px 14px;border:1.5px solid var(--border,#e2e8f0);border-radius:10px;
                   font-size:14px;box-sizing:border-box;outline:none;background:var(--bg-input,#f8fafc);
                   color:var(--text-primary,#1e293b);font-family:inherit">
        </div>
        <button onclick="App._doResetPassword()"
          style="width:100%;padding:13px;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;
                 border:none;border-radius:12px;font-size:15px;font-weight:700;cursor:pointer;margin-bottom:10px;font-family:inherit">
          تعيين كلمة المرور الجديدة
        </button>
        <button onclick="document.getElementById('reset-overlay').remove()"
          style="width:100%;padding:10px;background:none;border:1.5px solid var(--border,#e2e8f0);border-radius:12px;
                 font-size:14px;cursor:pointer;color:var(--text-muted,#64748b);font-family:inherit">
          إلغاء
        </button>
      </div>
    `;
    document.body.appendChild(overlay);
    document.getElementById('rp-new').focus();
  },

  async _doResetPassword() {
    const newPass = document.getElementById('rp-new')?.value || '';
    const confirm = document.getElementById('rp-confirm')?.value || '';
    if (newPass.length < 8) { alert('يجب أن تكون كلمة المرور 8 أحرف على الأقل'); return; }
    if (newPass !== confirm) { alert('كلمتا المرور غير متطابقتين'); return; }

    // ── Supabase: تغيير كلمة المرور للمستخدم الحالي ────────
    if (SupabaseDB.isConnected && this.state.user) {
      const { error } = await SupabaseDB.updatePassword(newPass);
      if (error) { alert('خطأ: ' + error.message); return; }
      document.getElementById('reset-overlay')?.remove();
      alert('✓ تم تغيير كلمة المرور بنجاح');
      return;
    }

    // Fallback: محلي
    DB.adminCredentials.password = 'sha256:' + (await _sha256(newPass));
    DB._saveToLocal();
    document.getElementById('reset-overlay')?.remove();
    alert('✓ تم تغيير كلمة المرور بنجاح\nيمكنك الآن تسجيل الدخول بكلمة المرور الجديدة');
    location.reload();
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
          <label>الاسم الكامل</label>
          <div class="input-wrapper">
            <i class="fas fa-user input-icon-left"></i>
            <input type="text" id="setup-name" placeholder="محمد أحمد العمري" class="form-input" required>
          </div>
        </div>
        <div class="form-group">
          <label>البريد الإلكتروني</label>
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

  async completeSetup(e) {
    e.preventDefault();
    const email    = document.getElementById('setup-email').value.trim().toLowerCase();
    const pass     = document.getElementById('setup-pass').value;
    const confirm  = document.getElementById('setup-confirm').value;
    const fullName = (document.getElementById('setup-name')?.value || '').trim();
    const btn      = document.getElementById('setup-btn');

    if (!fullName) { this.toast('يرجى إدخال الاسم الكامل', 'error'); return; }
    if (pass !== confirm) { this.toast('كلمتا المرور غير متطابقتين', 'error'); return; }
    if (pass.length < 8)  { this.toast('يجب أن تكون كلمة المرور 8 أحرف على الأقل', 'error'); return; }

    btn.disabled = true;
    btn.innerHTML = '<span>جارٍ الإعداد...</span>';

    // ── Supabase Auth ──────────────────────────────────────────
    if (SupabaseDB.isConnected) {
      // signUp ينشئ الحساب ويسجّل الدخول تلقائياً (يعيد token + user)
      const { data: signUpData, error: signUpErr } = await SupabaseDB.signUp(email, pass, { name: fullName });
      if (signUpErr) {
        this.toast(signUpErr.message, 'error');
        btn.disabled = false; btn.innerHTML = '<span>إنشاء الحساب والبدء</span><i class="fas fa-arrow-left btn-arrow"></i>'; return;
      }

      // إذا signUp أعاد user مباشرة — استخدمه بدون signIn ثاني
      let userData = signUpData?.user;
      if (!userData) {
        // Fallback: حاول تسجيل الدخول يدوياً
        const { data: sd, error: signInErr } = await SupabaseDB.signIn(email, pass);
        if (signInErr || !sd?.user) {
          this.toast('تم إنشاء الحساب — يرجى تسجيل الدخول', 'success');
          location.reload(); return;
        }
        userData = sd.user;
      }

      const meta = userData.user_metadata || {};
      const user = { id: userData.id, name: meta.name||fullName, avatar: fullName.charAt(0)?.toUpperCase()||'?', position:'مدير النظام', email, avatarColor:'gradient-primary' };
      this.state.user = user;
      // احفظ بيانات الشركة لضمان isFirstSetup=false في الزيارات القادمة
      if (!DB.company.name) DB.company.name = fullName;
      await SupabaseDB.saveCompany();
      await SupabaseDB.loadAll();
      document.getElementById('login-page').style.display = 'none';
      this._showApp();
      this.toast('تم إنشاء الحساب بنجاح! أهلاً بك', 'success');
      return;
    }

    // ── Fallback: محلي ────────────────────────────────────────
    Object.assign(DB.adminCredentials, { email, password: 'sha256:' + (await _sha256(pass)), name: fullName });
    DB._saveToLocal();
    setTimeout(() => {
      const user = { id:'admin', name:fullName, avatar:fullName.charAt(0), position:'مدير النظام', email, avatarColor:'gradient-primary' };
      this.state.user = user;
      sessionStorage.setItem('app-user', JSON.stringify(user));
      document.getElementById('login-page').style.display = 'none';
      this._showApp();
      this.toast('تم إنشاء الحساب بنجاح! أهلاً بك', 'success');
    }, 600);
  },

  logout() {
    this.confirm('هل تريد تسجيل الخروج؟', async () => {
      if (SupabaseDB.isConnected) await SupabaseDB.signOut();
      sessionStorage.removeItem('app-user');
      this.state.user = null;
      Object.values(this.state.chartInstances).forEach(c => c?.destroy?.());
      this.state.chartInstances = {};
      document.getElementById('app').style.display = 'none';
      this.toast('تم تسجيل الخروج بنجاح', 'info');
      const formBody = document.querySelector('.login-form-body');
      if (formBody && !document.getElementById('login-form')) { location.reload(); return; }
      const btn = document.getElementById('login-btn');
      if (btn) { btn.disabled = false; btn.innerHTML = `<span data-i18n="login.adminBtn">${t('login.adminBtn')}</span><i class="fas fa-arrow-left btn-arrow"></i>`; }
      document.getElementById('login-page').style.display = 'flex';
      applyTranslations();
    });
  },

  // ─── SHOW APP ─────────────────────────────────────────────
  _showApp() {
    document.getElementById('login-page').style.display = 'none';
    const appEl = document.getElementById('app');
    appEl.style.display = 'flex';

    // Sidebar: always hidden on mobile/tablet — JS enforces this regardless of CSS cache state
    const sidebar = document.getElementById('sidebar');
    if (window.innerWidth <= 1024) {
      if (sidebar) sidebar.style.display = 'none';
      sidebar?.classList.remove('mobile-open');
      document.querySelector('.sidebar-mobile-overlay')?.remove();
    } else {
      // Desktop: restore sidebar display (remove any leftover inline style)
      if (sidebar) sidebar.style.display = '';
    }

    // Update user info in sidebar and header
    const user = this.state.user;
    if (user) {
      const initials = user.avatar || user.name?.charAt(0)?.toUpperCase() || '?';
      ['sidebar-user-avatar', 'header-user-avatar', 'dropdown-avatar'].forEach(id => {
        const el = document.getElementById(id);
        if (el) { el.textContent = initials; el.classList.add('avatar', user.avatarColor||'gradient-primary'); }
      });
      const nameEl = document.getElementById('sidebar-user-info');
      if (nameEl) {
        const nameSmEl = nameEl.querySelector('.user-name-sm');
        const roleSmEl = nameEl.querySelector('.user-role-sm');
        if (nameSmEl) nameSmEl.textContent = user.name || '';
        if (roleSmEl) roleSmEl.textContent = user.position || '';
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

    // Start auto-translator MutationObserver if language is not Arabic
    if (typeof Translator !== 'undefined' && currentLang !== 'ar') {
      Translator.startObserver(currentLang);
    }

    // Navigate to current hash or dashboard
    const hash = window.location.hash.slice(1) || 'dashboard';
    this._navigate(hash);

    // Preload face recognition models in background (silent — improves first-use speed)
    if (typeof Biometrics !== 'undefined' && Biometrics.canCamera()) {
      setTimeout(() => Biometrics.loadFaceApi().catch(() => {}), 3000);
    }

    // Start auto-backup timer + silent Google token refresh
    if (typeof BackupModule !== 'undefined') {
      setTimeout(() => {
        BackupModule._startAutoTimer();
        BackupModule._silentTokenRefresh();
      }, 5000);
    }

    // ── Idle timeout enforcement ───────────────────────────────
    this._startIdleWatcher();
  },

  _idleTimer: null,
  _idleLastActivity: Date.now(),

  _startIdleWatcher() {
    const minutes = parseInt(DB.company.idleTimeout) || 0;
    if (!minutes || minutes < 1) return;
    const ms = minutes * 60 * 1000;

    const resetIdle = () => { this._idleLastActivity = Date.now(); };
    ['mousemove','keydown','click','touchstart','scroll'].forEach(ev =>
      document.addEventListener(ev, resetIdle, { passive: true })
    );

    clearInterval(this._idleTimer);
    this._idleTimer = setInterval(() => {
      if (Date.now() - this._idleLastActivity >= ms) {
        clearInterval(this._idleTimer);
        this.toast('تم تسجيل الخروج تلقائياً بسبب عدم النشاط', 'warning', 5000);
        setTimeout(() => this.logout(), 1500);
      }
    }, 30_000); // check every 30s
  },

  _updateUserUI() {
    const user = this.state.user;
    if (!user) return;
    const initials = user.avatar || user.name?.charAt(0) || '?';
    ['sidebar-user-avatar','header-user-avatar','dropdown-avatar'].forEach(id => {
      const el = document.getElementById(id);
      if (el) { el.textContent = initials; el.classList.add('avatar', user.avatarColor||'gradient-primary'); }
    });
    const nameEl = document.getElementById('sidebar-user-info');
    if (nameEl) {
      const nameSmEl = nameEl.querySelector('.user-name-sm');
      const roleSmEl = nameEl.querySelector('.user-role-sm');
      if (nameSmEl) nameSmEl.textContent = user.name || '';
      if (roleSmEl) roleSmEl.textContent = user.position || '';
    }
    const hName = document.getElementById('header-user-name');
    const hRole = document.getElementById('header-user-role');
    const dName = document.getElementById('dropdown-name');
    if (hName) hName.textContent = user.name;
    if (hRole) hRole.textContent = user.position;
    if (dName) dName.textContent = user.name;
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

    // Close panels + sidebar on mobile
    this.closeNotifPanel();
    this.closeUserMenu();
    if (window.innerWidth <= 1024) {
      const sb = document.getElementById('sidebar');
      if (sb) { sb.classList.remove('mobile-open'); sb.style.display = 'none'; }
      document.querySelector('.sidebar-mobile-overlay')?.remove();
    }

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
          deductions:    () => DeductionsModule.render(content),
          loans:         () => typeof LoansModule !== 'undefined' ? LoansModule.render(content) : content.innerHTML = '<div class="empty-state"><div class="empty-icon"><i class="fas fa-hand-holding-dollar"></i></div><div class="empty-title">وحدة السلف</div><p class="empty-desc">الوحدة غير محملة</p></div>',
          gratuity:      () => typeof GratuityModule !== 'undefined' ? GratuityModule.render(content) : content.innerHTML = '<div class="empty-state"><div class="empty-icon"><i class="fas fa-award"></i></div><div class="empty-title">نهاية الخدمة</div><p class="empty-desc">الوحدة غير محملة</p></div>',
          gps:           () => GpsModule.render(content),
          audit:         () => AuditModule.render(content),
          settings:      () => {
            if (typeof SettingsCenterV2 !== 'undefined' && SettingsCenterV2?.render) {
              SettingsCenterV2.render(content);
            } else if (typeof SettingsModule !== 'undefined' && SettingsModule?.render) {
              SettingsModule.render(content);
            } else {
              content.innerHTML = '<div class="empty-state"><div class="empty-icon"><i class="fas fa-gear"></i></div><div class="empty-title">الإعدادات</div><p class="empty-desc">لم يتم تحميل واجهة Control Center</p></div>';
            }
          },
          profile:       () => ProfileModule.render(content),
          roles:         () => {
            if (typeof SettingsCenterV2 !== 'undefined' && SettingsCenterV2?.render) {
              SettingsCenterV2.render(content, 'users');
            } else if (typeof SettingsModule !== 'undefined' && SettingsModule?.render) {
              SettingsModule.render(content);
            }
          },
          backup:        () => {
            if (typeof SettingsCenterV2 !== 'undefined' && SettingsCenterV2?.render) {
              SettingsCenterV2.render(content, 'backup');
            } else if (typeof SettingsModule !== 'undefined' && SettingsModule?.render) {
              SettingsModule.render(content);
            }
          },
          orgchart:      () => typeof OrgChartModule  !== 'undefined' ? OrgChartModule.render(content)  : content.innerHTML = '<div class="empty-state"><div class="empty-icon"><i class="fas fa-sitemap"></i></div><div class="empty-title">الهيكل التنظيمي</div><p class="empty-desc">الوحدة غير محملة</p></div>',
          calendar:      () => typeof CalendarModule  !== 'undefined' ? CalendarModule.render(content)  : content.innerHTML = '<div class="empty-state"><div class="empty-icon"><i class="fas fa-calendar-days"></i></div><div class="empty-title">تقويم الفريق</div><p class="empty-desc">الوحدة غير محملة</p></div>',
          expenses:      () => typeof ExpensesModule  !== 'undefined' ? ExpensesModule.render(content)  : content.innerHTML = '<div class="empty-state"><div class="empty-icon"><i class="fas fa-receipt"></i></div><div class="empty-title">المصروفات</div><p class="empty-desc">الوحدة غير محملة</p></div>',
        };

        if (modules[page]) {
          modules[page]();
        } else {
          content.innerHTML = `<div class="empty-state"><div class="empty-icon"><i class="fas fa-exclamation-circle"></i></div><div class="empty-title">الصفحة غير موجودة</div><p class="empty-desc">الوحدة <strong>${_esc(page)}</strong> غير متاحة</p></div>`;
        }

        // Auto-translate user-entered Arabic data when language is not Arabic
        if (currentLang !== 'ar' && typeof Translator !== 'undefined') {
          Translator.translateEl(content, currentLang);
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
        content.innerHTML = `<div class="empty-state"><div class="empty-icon"><i class="fas fa-bug"></i></div><div class="empty-title">خطأ في التحميل</div><p class="empty-desc">${_esc(err.message)}</p></div>`;
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
    localStorage.setItem('app-lang', lang);
    currentLang = lang;
    applyTranslations();

    // Start/stop MutationObserver based on language
    if (typeof Translator !== 'undefined') {
      if (lang === 'ar') {
        Translator.stopObserver();
      } else {
        Translator.startObserver(lang);
      }
    }

    // Re-render current module so dynamic HTML also gets translated
    if (this.state.user) {
      this._navigate(this.state.currentPage || 'dashboard');
    }
  },

  toggleLanguage() {
    const order = ['ar', 'en', 'hi', 'ur', 'fil'];
    const next = order[(order.indexOf(currentLang) + 1) % order.length];
    this.setLanguage(next);
  },

  // ─── SIDEBAR ──────────────────────────────────────────────
  toggleSidebar() {
    const sidebar  = document.getElementById('sidebar');
    const appWrap  = document.querySelector('.app-wrapper');
    const isMobile = window.innerWidth <= 1024;

    if (isMobile) {
      const isOpen = sidebar.classList.toggle('mobile-open');
      // Clear inline display so CSS !important rules take effect
      sidebar.style.display = '';
      // Remove any stale overlay first
      document.querySelector('.sidebar-mobile-overlay')?.remove();
      if (isOpen) {
        const overlay = document.createElement('div');
        overlay.className = 'sidebar-mobile-overlay';
        overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:499';
        overlay.onclick = () => {
          sidebar.classList.remove('mobile-open');
          sidebar.style.display = 'none';
          overlay.remove();
        };
        document.body.appendChild(overlay);
      } else {
        sidebar.style.display = 'none';
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
            <div class="notif-title">${_esc(n.title)}</div>
            <div class="notif-desc">${_esc(n.desc)}</div>
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
      DB.save();
    }
  },

  markAllRead() {
    DB.notifications.forEach(n => n.read = true);
    DB.save();
    this._populateNotifPanel();
    this._updateBadges();
    const dot = document.getElementById('notif-dot');
    if (dot) dot.style.display = 'none';
    this.toast('تم تحديد كل الإشعارات كمقروءة', 'success');
    // تحديث صفحة الإشعارات الكاملة إن كانت مفتوحة
    if (this.state.currentPage === 'notifications' && typeof NotificationsModule !== 'undefined') {
      NotificationsModule._renderList();
    }
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

  // ─── RESET ALL EMPLOYEE PASSWORDS ────────────────────────
  async resetAllPasswords() {
    if (!confirm('سيتم إعادة ضبط كلمة مرور جميع الموظفين لتصبح = كود الموظف.\nهل أنت متأكد؟')) return;
    App.toast('جارٍ إعادة ضبط كلمات المرور...', 'info');
    try {
      const { ok, data } = await Supabase._fetch('/api/emp/reset-passwords', { method: 'POST' });
      if (ok) {
        App.toast(`تم إعادة ضبط ${data.updated} موظف ✓ — كلمة المرور الآن = كود الموظف`, 'success', 6000);
      } else {
        App.toast('فشل إعادة الضبط: ' + (data?.error || 'خطأ غير معروف'), 'error');
      }
    } catch(e) {
      App.toast('خطأ: ' + e.message, 'error');
    }
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
    const pad = n => String(n).padStart(2, '0');
    const updateClock = () => {
      const now    = new Date();
      const timeEl = document.getElementById('live-time');
      const dateEl = document.getElementById('live-date');

      if (timeEl) {
        timeEl.textContent = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
      }
      if (dateEl) {
        dateEl.textContent = now.toLocaleDateString(currentLang === 'ar' ? 'ar-EG' : 'en-US', {
          weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
        });
      }
    };
    if (this._clockInterval) clearInterval(this._clockInterval);
    updateClock();
    this._clockInterval = setInterval(updateClock, 1000);
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

  renderAvatar(emp, size = 36, radius = 10) {
    const isFemale = emp?.gender === 'f' || emp?.gender === 'female';
    const uid      = (emp?.id || Math.random()).toString().replace(/\W/g,'').slice(-6);
    const mgId     = `mg${uid}${size}`;
    const fgId     = `fg${uid}${size}`;

    // أفاتار صغير (أقل من 32px) — أيقونة مبسطة
    if (size < 32) {
      if (isFemale) {
        return `<svg width="${size}" height="${size}" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg"
          style="border-radius:${radius}px;flex-shrink:0;display:block">
          <defs><linearGradient id="${fgId}" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
            <stop stop-color="#7c3aed"/><stop offset="1" stop-color="#db2777"/></linearGradient></defs>
          <rect width="32" height="32" rx="${radius}" fill="url(#${fgId})"/>
          <ellipse cx="16" cy="12" rx="8" ry="8.5" fill="rgba(255,255,255,0.25)"/>
          <ellipse cx="16" cy="12" rx="5.5" ry="6" fill="#FDDBB4"/>
          <ellipse cx="13.5" cy="11" rx=".9" ry="1" fill="#3b1a08"/>
          <ellipse cx="18.5" cy="11" rx=".9" ry="1" fill="#3b1a08"/>
          <path d="M13.5 14.5 Q16 16.5 18.5 14.5" stroke="#c0815a" stroke-width=".9" stroke-linecap="round" fill="none"/>
          <path d="M5 28 Q8 22 16 23 Q24 22 27 28" fill="rgba(255,255,255,0.2)"/>
        </svg>`;
      } else {
        return `<svg width="${size}" height="${size}" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg"
          style="border-radius:${radius}px;flex-shrink:0;display:block">
          <defs><linearGradient id="${mgId}" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
            <stop stop-color="#2563eb"/><stop offset="1" stop-color="#7c3aed"/></linearGradient></defs>
          <rect width="32" height="32" rx="${radius}" fill="url(#${mgId})"/>
          <ellipse cx="16" cy="13" rx="6" ry="6.5" fill="#FDDBB4"/>
          <path d="M10 12 Q10 6 16 5.5 Q22 6 22 12 Q21 8.5 16 8 Q11 8.5 10 12Z" fill="#3b1a08"/>
          <ellipse cx="13.5" cy="12" rx=".9" ry="1" fill="#3b1a08"/>
          <ellipse cx="18.5" cy="12" rx=".9" ry="1" fill="#3b1a08"/>
          <path d="M13.5 15.5 Q16 17.5 18.5 15.5" stroke="#c0815a" stroke-width=".9" stroke-linecap="round" fill="none"/>
          <path d="M5 28 Q9 22 16 23.5 Q23 22 27 28" fill="rgba(255,255,255,0.2)"/>
        </svg>`;
      }
    }

    // أفاتار كبير (32px+) — وجه كامل مع تفاصيل
    if (isFemale) {
      return `<svg width="${size}" height="${size}" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"
        style="border-radius:${radius}px;flex-shrink:0;display:block">
        <defs><linearGradient id="${fgId}" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
          <stop stop-color="#7c3aed"/><stop offset="1" stop-color="#db2777"/></linearGradient></defs>
        <rect width="64" height="64" rx="${radius}" fill="url(#${fgId})"/>
        <ellipse cx="32" cy="72" rx="22" ry="18" fill="rgba(255,255,255,0.15)"/>
        <path d="M10 52 Q16 44 32 46 Q48 44 54 52 L56 64 H8 Z" fill="rgba(255,255,255,0.2)"/>
        <ellipse cx="32" cy="26" rx="16" ry="17" fill="rgba(255,255,255,0.25)"/>
        <path d="M16 28 Q14 38 16 46 Q24 50 32 50 Q40 50 48 46 Q50 38 48 28" fill="rgba(255,255,255,0.18)"/>
        <ellipse cx="32" cy="26" rx="11" ry="12" fill="#FDDBB4"/>
        <ellipse cx="27.5" cy="24" rx="1.6" ry="1.8" fill="#3b1a08"/>
        <ellipse cx="36.5" cy="24" rx="1.6" ry="1.8" fill="#3b1a08"/>
        <circle cx="27.8" cy="23.5" r=".6" fill="white" opacity=".7"/>
        <circle cx="36.8" cy="23.5" r=".6" fill="white" opacity=".7"/>
        <path d="M25 21.5 Q27.5 20 30 21.5" stroke="#6b3a1f" stroke-width="1.2" stroke-linecap="round" fill="none"/>
        <path d="M34 21.5 Q36.5 20 39 21.5" stroke="#6b3a1f" stroke-width="1.2" stroke-linecap="round" fill="none"/>
        <ellipse cx="26.5" cy="28" rx="1.2" ry=".6" fill="#e8a090" opacity=".6"/>
        <ellipse cx="37.5" cy="28" rx="1.2" ry=".6" fill="#e8a090" opacity=".6"/>
        <path d="M28 30.5 Q32 34 36 30.5" stroke="#c0815a" stroke-width="1.5" stroke-linecap="round" fill="none"/>
        <path d="M21 17 Q18 10 32 9 Q46 10 43 17" fill="rgba(255,255,255,0.28)" stroke="none"/>
      </svg>`;
    } else {
      return `<svg width="${size}" height="${size}" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"
        style="border-radius:${radius}px;flex-shrink:0;display:block">
        <defs><linearGradient id="${mgId}" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
          <stop stop-color="#2563eb"/><stop offset="1" stop-color="#7c3aed"/></linearGradient></defs>
        <rect width="64" height="64" rx="${radius}" fill="url(#${mgId})"/>
        <ellipse cx="32" cy="72" rx="22" ry="18" fill="rgba(255,255,255,0.15)"/>
        <path d="M12 56 Q20 46 32 48 Q44 46 52 56 L56 64 H8 Z" fill="rgba(255,255,255,0.2)"/>
        <path d="M28 48 L32 54 L36 48" fill="white" opacity=".4"/>
        <rect x="28" y="38" width="8" height="10" rx="3" fill="#FDDBB4"/>
        <ellipse cx="32" cy="27" rx="12" ry="13" fill="#FDDBB4"/>
        <path d="M20 24 Q20 12 32 11 Q44 12 44 24 Q42 17 32 16 Q22 17 20 24Z" fill="#3b1a08"/>
        <ellipse cx="20.5" cy="28" rx="2.2" ry="3" fill="#F0C090"/>
        <ellipse cx="43.5" cy="28" rx="2.2" ry="3" fill="#F0C090"/>
        <ellipse cx="27.5" cy="26" rx="1.6" ry="1.8" fill="#3b1a08"/>
        <ellipse cx="36.5" cy="26" rx="1.6" ry="1.8" fill="#3b1a08"/>
        <circle cx="27.8" cy="25.5" r=".6" fill="white" opacity=".7"/>
        <circle cx="36.8" cy="25.5" r=".6" fill="white" opacity=".7"/>
        <path d="M25 22.5 Q27.5 21 30 22.5" stroke="#3b1a08" stroke-width="1.4" stroke-linecap="round" fill="none"/>
        <path d="M34 22.5 Q36.5 21 39 22.5" stroke="#3b1a08" stroke-width="1.4" stroke-linecap="round" fill="none"/>
        <ellipse cx="26.5" cy="30" rx="1.2" ry=".6" fill="#e8a090" opacity=".5"/>
        <ellipse cx="37.5" cy="30" rx="1.2" ry=".6" fill="#e8a090" opacity=".5"/>
        <path d="M28 32.5 Q32 36 36 32.5" stroke="#c0815a" stroke-width="1.5" stroke-linecap="round" fill="none"/>
      </svg>`;
    }
  },

  getStatusBadge(status) {
    const map = {
      active:   { class: 'badge-success', label: t('common.active') },
      inactive: { class: 'badge-secondary', label: t('common.inactive') },
      on_leave: { class: 'badge-warning',  label: t('nav.leaves') },
      present:  { class: 'badge-success',  label: t('attendance.present') },
      late:     { class: 'badge-warning',  label: t('attendance.late') },
      absent:   { class: 'badge-danger',   label: t('attendance.absent') },
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
    const blob    = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' }); // BOM intentional for Excel
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
  // ─── DEMO MODE ───────────────────────────────────────────
  _injectDemoBtn() {
    const form = document.getElementById('login-form') || document.getElementById('setup-form');
    if (!form || document.getElementById('demo-btn')) return;
    const div = document.createElement('div');
    div.style.cssText = 'text-align:center;margin-top:12px';
    div.innerHTML = `
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">
        <div style="flex:1;height:1px;background:var(--border)"></div>
        <span style="font-size:11px;color:var(--text-muted)">أو</span>
        <div style="flex:1;height:1px;background:var(--border)"></div>
      </div>
      <button id="demo-btn" type="button" onclick="App.loadDemo()"
        style="width:100%;padding:12px;border-radius:12px;background:linear-gradient(135deg,#10b981,#059669);
               color:white;font-family:var(--font-ar);font-size:14px;font-weight:700;cursor:pointer;
               border:none;display:flex;align-items:center;justify-content:center;gap:8px;
               box-shadow:0 4px 14px rgba(16,185,129,0.3);transition:opacity 0.2s"
        onmouseover="this.style.opacity='.88'" onmouseout="this.style.opacity='1'">
        <i class="fas fa-rocket"></i> جرب النظام مجاناً — بيانات تجريبية جاهزة
      </button>
      <p style="font-size:11px;color:var(--text-muted);margin-top:8px">لا يحتاج تسجيل · يعمل فوراً</p>
    `;
    form.after(div);
  },

  loadDemo() {
    const btn = document.getElementById('demo-btn');
    if (btn) { btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جارٍ تحميل البيانات...'; btn.disabled = true; }

    // Seed demo credentials
    DB.adminCredentials = { email: 'demo@attendify.pro', password: 'demo1234' };

    // Seed company
    Object.assign(DB.company, {
      name: 'شركة سمو للخدمات', nameEn: 'Sumou Services Co.',
      address: 'الرياض، المملكة العربية السعودية',
      phone: '+966 50 000 0000', email: 'info@sumou.sa',
      timezone: 'Asia/Riyadh', currency: 'SAR',
      workStart: '08:00', workEnd: '17:00', lateThreshold: 15,
      workDays: ['sat','sun','mon','tue','wed','thu'], weekend: ['fri'],
    });

    // Departments
    const depts = [
      { id: 'd1', name: 'الإدارة',       nameEn: 'Management',   color: '#6366f1', manager: '' },
      { id: 'd2', name: 'المبيعات',       nameEn: 'Sales',        color: '#10b981', manager: '' },
      { id: 'd3', name: 'تقنية المعلومات',nameEn: 'IT',           color: '#06b6d4', manager: '' },
      { id: 'd4', name: 'الموارد البشرية',nameEn: 'HR',           color: '#f59e0b', manager: '' },
      { id: 'd5', name: 'المحاسبة',       nameEn: 'Accounting',   color: '#8b5cf6', manager: '' },
    ];
    depts.forEach(d => { if (!DB.departments.find(x=>x.id===d.id)) DB.departments.push(d); });

    // Employees
    const emps = [
      { id:'e1', no:'001', name:'أحمد محمد الغامدي', nameEn:'Ahmed Al-Ghamdi',   dept:'d1', position:'مدير عام',           salary:15000, status:'active', avatar:'أ', avatarColor:'gradient-primary',  email:'ahmed@sumou.sa',   hireDate:'2022-01-15', phone:'+966501111111' },
      { id:'e2', no:'002', name:'سارة عبدالله الشهري',nameEn:'Sara Al-Shahri',    dept:'d4', position:'مديرة الموارد البشرية',salary:10000, status:'active', avatar:'س', avatarColor:'gradient-success',  email:'sara@sumou.sa',    hireDate:'2022-03-10', phone:'+966502222222' },
      { id:'e3', no:'003', name:'محمد سالم القحطاني', nameEn:'Mohammed Al-Qahtani',dept:'d2', position:'مدير المبيعات',      salary:9500,  status:'active', avatar:'م', avatarColor:'gradient-warning',  email:'mohammed@sumou.sa',hireDate:'2022-06-01', phone:'+966503333333' },
      { id:'e4', no:'004', name:'فاطمة علي الزهراني', nameEn:'Fatima Al-Zahrani', dept:'d3', position:'مهندسة برمجيات',     salary:11000, status:'active', avatar:'ف', avatarColor:'gradient-indigo',   email:'fatima@sumou.sa',  hireDate:'2023-01-20', phone:'+966504444444' },
      { id:'e5', no:'005', name:'خالد عمر العتيبي',   nameEn:'Khalid Al-Otaibi',  dept:'d5', position:'محاسب أول',          salary:8000,  status:'active', avatar:'خ', avatarColor:'gradient-cyan',     email:'khalid@sumou.sa',  hireDate:'2023-04-05', phone:'+966505555555' },
      { id:'e6', no:'006', name:'نورة سعد المالكي',   nameEn:'Noura Al-Malki',    dept:'d2', position:'مندوبة مبيعات',      salary:7000,  status:'active', avatar:'ن', avatarColor:'gradient-rose',     email:'noura@sumou.sa',   hireDate:'2023-07-15', phone:'+966506666666' },
      { id:'e7', no:'007', name:'عبدالرحمن يوسف الدوسري',nameEn:'AbdulRahman',    dept:'d3', position:'مطور واجهات',        salary:9000,  status:'active', avatar:'ع', avatarColor:'gradient-danger',   email:'abdulrahman@sumou.sa',hireDate:'2023-09-01',phone:'+966507777777'},
      { id:'e8', no:'008', name:'ريم إبراهيم السبيعي', nameEn:'Reem Al-Subaie',   dept:'d4', position:'أخصائية تدريب',      salary:7500,  status:'active', avatar:'ر', avatarColor:'gradient-secondary',email:'reem@sumou.sa',    hireDate:'2024-01-10', phone:'+966508888888' },
    ];
    emps.forEach(e => { if (!DB.employees.find(x=>x.id===e.id)) DB.employees.push(e); });

    // Attendance — last 7 days
    const today = new Date();
    const workDays = DB.company.workDays;
    const dayMap = {0:'sun',1:'mon',2:'tue',3:'wed',4:'thu',5:'fri',6:'sat'};
    DB.attendance.splice(0); // clear
    for (let d = 6; d >= 0; d--) {
      const dt = new Date(today); dt.setDate(today.getDate() - d);
      const ds = dt.toISOString().split('T')[0];
      const dw = dayMap[dt.getDay()];
      if (!workDays.includes(dw)) continue;
      emps.forEach((emp, i) => {
        if (d === 0 && i > 4) return; // some not arrived today
        const lateChance = Math.random();
        const absent = d > 0 && i === 5 && d % 3 === 0;
        if (absent) return;
        const baseH = 8, baseM = lateChance < 0.25 ? Math.floor(Math.random()*30)+5 : Math.floor(Math.random()*10);
        const checkIn  = `${String(baseH).padStart(2,'0')}:${String(baseM).padStart(2,'0')}`;
        const outH = 17 + (Math.random()>0.7?1:0), outM = Math.floor(Math.random()*30);
        const checkOut = `${String(outH).padStart(2,'0')}:${String(outM).padStart(2,'0')}`;
        const late = baseM > 15;
        DB.attendance.push({
          id: DB.nextId('at'), empId: emp.id, date: ds,
          checkIn, checkOut: d === 0 ? null : checkOut,
          status: late ? 'late' : 'present',
          method: ['manual','qr','face','fingerprint'][i%4],
          overtime: outH > 17 ? (outH-17)*60+outM : 0,
          lateMin: late ? baseM - 15 : 0,
        });
      });
    }

    // Payroll
    DB.payroll.splice(0);
    emps.forEach(emp => {
      DB.payroll.push({ id:DB.nextId('p'), empId:emp.id, base:emp.salary, housing:Math.round(emp.salary*.25), transport:Math.round(emp.salary*.1), food:0, overtime:0, absentDeduction:0, lateDeduction:0, total:Math.round(emp.salary*1.35), month: today.toISOString().slice(0,7), status:'pending' });
    });

    // Leaves
    DB.leaves.splice(0);
    const leaveEmp = emps[2];
    const fromDate = new Date(today); fromDate.setDate(today.getDate()+3);
    DB.leaves.push({ id:'l1', empId:leaveEmp.id, type:'annual', from:fromDate.toISOString().split('T')[0], to:new Date(fromDate.getTime()+5*86400000).toISOString().split('T')[0], days:5, status:'pending', reason:'إجازة سنوية', createdAt:new Date().toISOString() });

    // Notifications
    DB.notifications.splice(0);
    DB.notifications.push(
      { id:'n1', title:'طلب إجازة جديد', desc:`${leaveEmp.name} طلب إجازة سنوية 5 أيام`, type:'leave',   icon:'fas fa-calendar', iconBg:'gradient-warning', time:new Date().toISOString(), read:false },
      { id:'n2', title:'موظف متأخر',      desc:'نورة المالكي تأخرت 22 دقيقة اليوم',       type:'attendance',icon:'fas fa-clock',    iconBg:'gradient-danger',  time:new Date().toISOString(), read:false },
      { id:'n3', title:'مرحباً بك في Attendify Pro', desc:'النظام جاهز للاستخدام',        type:'system',  icon:'fas fa-rocket',   iconBg:'gradient-primary', time:new Date().toISOString(), read:false },
    );

    DB.saveCompany();

    setTimeout(() => {
      this.state.user = { id:'admin', name:'مدير النظام', avatar:'م', position:'مدير النظام', email:'demo@attendify.pro', avatarColor:'gradient-primary' };
      sessionStorage.setItem('app-user', JSON.stringify(this.state.user));
      document.getElementById('login-page').style.display = 'none';
      this._showApp();
      this.toast('🎉 مرحباً! تم تحميل البيانات التجريبية', 'success', 4000);
    }, 600);
  },

  _confirmCb: null,

  confirm(message, onConfirm) {
    this._confirmCb = onConfirm;
    const html = `
      <div style="text-align:center;padding:16px 0">
        <div style="font-size:48px;margin-bottom:16px">⚠️</div>
        <p style="font-size:16px;color:var(--text-primary);font-weight:600;margin-bottom:8px">تأكيد الإجراء</p>
        <p style="font-size:14px;color:var(--text-muted);margin-bottom:24px">${message}</p>
        <div style="display:flex;gap:10px;justify-content:center">
          <button class="btn btn-danger" onclick="App._confirmCb?.(); App._confirmCb=null; App.closeModal()">تأكيد</button>
          <button class="btn btn-secondary" onclick="App._confirmCb=null; App.closeModal()">إلغاء</button>
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

// Force-save before tab/browser closes or hard-refresh (Ctrl+Shift+R)
window.addEventListener('beforeunload', () => {
  clearTimeout(DB._saveTimer);
  DB._saveToLocal();
  // Reset sync timestamp so local is always preferred on next load
  try { localStorage.removeItem('attendify-sync-ts'); } catch(_) {}
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
