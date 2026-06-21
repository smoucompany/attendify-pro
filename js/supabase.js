/* =========================================================
   ATTENDIFY PRO — Backend API Client
   يتحدث مع Node.js backend بدلاً من Supabase مباشرة
   الـ Supabase credentials موجودة على السيرفر فقط
   ========================================================= */

const SupabaseDB = {

  _status:       'disconnected',
  _token:        null,
  _refreshToken: null,
  _syncQueue:    [],
  _flushTimer:   null,
  _syncTimer:    null,
  _checksums:    {},
  _baseUrl:      '',

  // JS DB key → backend table name
  _tables: {
    departments:   'departments',
    employees:     'employees',
    shifts:        'shifts',
    attendance:    'attendance',
    leaves:        'leaves',
    requests:      'requests',
    notifications: 'notifications',
    payroll:       'payroll',
    deductions:    'deductions',
    locations:     'locations',
    roles:         'roles',
    audit:         'audit_logs',
  },

  get isConnected() { return this._status === 'connected'; },

  // ── HTTP HELPER (مع تجديد تلقائي للـ token) ──────────────

  async _fetch(path, options = {}, _retry = false) {
    const headers = {
      'Content-Type': 'application/json',
      ...(this._token ? { 'Authorization': `Bearer ${this._token}` } : {}),
      ...(options.headers || {}),
    };
    try {
      const r    = await fetch(this._baseUrl + path, { ...options, headers });
      const json = await r.json().catch(() => ({}));

      // إذا انتهت الجلسة وعندنا refresh token — جدّد تلقائياً
      if (r.status === 401 && !_retry && this._refreshToken) {
        const refreshed = await this._doRefresh();
        if (refreshed) return this._fetch(path, options, true);
      }

      return { ok: r.ok, status: r.status, data: json };
    } catch(e) {
      console.warn('[API]', path, e.message);
      return { ok: false, status: 0, data: { error: e.message } };
    }
  },

  async _doRefresh() {
    try {
      const r    = await fetch(this._baseUrl + '/api/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: this._refreshToken }),
      });
      const data = await r.json();
      if (!r.ok) { this._clearTokens(); return false; }
      this._saveTokens(data.token, data.refreshToken);
      return true;
    } catch(e) { this._clearTokens(); return false; }
  },

  _saveTokens(token, refreshToken) {
    this._token        = token;
    this._refreshToken = refreshToken;
    localStorage.setItem('attendify-token',         token);
    localStorage.setItem('attendify-refresh-token', refreshToken);
  },

  _clearTokens() {
    this._token = null; this._refreshToken = null;
    localStorage.removeItem('attendify-token');
    localStorage.removeItem('attendify-refresh-token');
  },

  // ── INIT ──────────────────────────────────────────────────

  async init() {
    const cfg = this.getConfig();
    this._baseUrl = cfg.backendUrl || '';
    if (!this._baseUrl) { this._status = 'disconnected'; return false; }

    // استعادة الـ tokens
    this._token        = localStorage.getItem('attendify-token')         || null;
    this._refreshToken = localStorage.getItem('attendify-refresh-token') || null;

    this._status = 'connecting';
    const { ok } = await this._fetch('/api/health');
    if (!ok) { this._status = 'error'; return false; }

    this._status = 'connected';
    console.log('[Backend] Connected ✓');
    return true;
  },

  // ── AUTH ──────────────────────────────────────────────────

  async signIn(email, password) {
    const { ok, data } = await this._fetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (!ok) return { data: null, error: { message: data.error } };
    this._saveTokens(data.token, data.refreshToken);
    return { data: { user: data.user }, error: null };
  },

  async signUp(email, password, meta = {}) {
    const { ok, data } = await this._fetch('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password, ...meta }),
    });
    if (!ok) return { data: null, error: { message: data.error } };
    if (data.token) this._saveTokens(data.token, data.refreshToken);
    return { data: { user: data.user }, error: null };
  },

  async signOut() {
    this._clearTokens();
  },

  async getSession() {
    if (!this._token && !this._refreshToken) return null;
    // إذا فيه refresh token بس مافيش access token — جدّد أولاً
    if (!this._token && this._refreshToken) {
      const ok = await this._doRefresh();
      if (!ok) return null;
    }
    const { ok, data } = await this._fetch('/api/auth/me');
    if (!ok) return null;
    return { user: data.user };
  },

  async isFirstSetup() {
    const { ok, data } = await this._fetch('/api/data/company');
    if (!ok) return false;
    return !data.data;
  },

  async updatePassword(newPassword) {
    const { ok, data } = await this._fetch('/api/auth/password', {
      method: 'POST',
      body: JSON.stringify({ password: newPassword }),
    });
    return ok ? { error: null } : { error: { message: data.error } };
  },

  // ── LOAD ALL DATA ─────────────────────────────────────────

  async loadAll() {
    if (!this.isConnected) return false;
    try {
      // Company
      const { ok: cok, data: co } = await this._fetch('/api/data/company');
      if (cok && co.data) Object.assign(DB.company, co.data);

      // Arrays
      for (const [jsKey, table] of Object.entries(this._tables)) {
        const { ok, data } = await this._fetch(`/api/data/${table}`);
        if (!ok) { console.warn('[Backend] Load failed:', table); continue; }
        DB[jsKey].length = 0;
        (data.rows || []).forEach(row => Array.prototype.push.call(DB[jsKey], row.data || {}));
        DB[jsKey] = this._proxyArray(DB[jsKey], table);
        this._checksums[table] = this._checksum(DB[jsKey]);
      }

      this._startPeriodicSync();
      console.log('[Backend] Data loaded ✓');
      return true;
    } catch(e) {
      console.warn('[Backend] Load failed:', e.message);
      return false;
    }
  },

  // ── PROXY ARRAY (auto-sync on push/splice/set) ────────────

  _proxyArray(arr, tableName) {
    const self = this;
    return new Proxy(arr, {
      get(target, prop) {
        if (prop === 'push') return function(...items) {
          const r = Array.prototype.push.apply(target, items);
          items.forEach(item => item?.id && self._enqueue('upsert', tableName, item));
          return r;
        };
        if (prop === 'splice') return function(start, delCount = 0, ...items) {
          const removed = Array.prototype.splice.call(target, start, delCount, ...items);
          removed.forEach(item => item?.id && self._enqueue('delete', tableName, item));
          items.forEach(item => item?.id && self._enqueue('upsert', tableName, item));
          return removed;
        };
        if (prop === 'unshift') return function(...items) {
          const r = Array.prototype.unshift.apply(target, items);
          items.forEach(item => item?.id && self._enqueue('upsert', tableName, item));
          return r;
        };
        const val = target[prop];
        if (typeof val === 'function') return val.bind(target);
        return val;
      },
      set(target, prop, value) {
        target[prop] = value;
        if (!isNaN(prop) && value?.id) self._enqueue('upsert', tableName, value);
        return true;
      },
    });
  },

  // ── SYNC QUEUE ────────────────────────────────────────────

  _enqueue(op, table, record) {
    if (!this.isConnected || !record?.id) return;
    this._syncQueue = this._syncQueue.filter(q => !(q.table === table && q.id === record.id));
    this._syncQueue.push({ op, table, id: record.id, data: { ...record } });
    this._scheduleFlush();
  },

  _scheduleFlush() {
    clearTimeout(this._flushTimer);
    this._flushTimer = setTimeout(() => this._flush(), 1500);
  },

  async _flush() {
    if (!this.isConnected || !this._syncQueue.length) return;
    const batch   = this._syncQueue.splice(0);
    const upserts = batch.filter(q => q.op === 'upsert');
    const deletes  = batch.filter(q => q.op === 'delete');

    // Batch upserts by table
    const byTable = {};
    upserts.forEach(q => {
      if (!byTable[q.table]) byTable[q.table] = [];
      byTable[q.table].push({ id: q.id, data: q.data });
    });

    for (const [table, rows] of Object.entries(byTable)) {
      const { ok } = await this._fetch(`/api/data/${table}/upsert`, {
        method: 'POST', body: JSON.stringify(rows),
      });
      if (!ok) rows.forEach(r => this._syncQueue.push({ op:'upsert', table, id:r.id, data:r.data }));
    }

    for (const q of deletes) {
      await this._fetch(`/api/data/${q.table}/${q.id}`, { method: 'DELETE' });
    }
  },

  // ── PERIODIC DIRTY CHECK ──────────────────────────────────

  _startPeriodicSync() {
    clearInterval(this._syncTimer);
    this._syncTimer = setInterval(() => this._dirtySync(), 8000);
  },

  async _dirtySync() {
    if (!this.isConnected) return;
    for (const [jsKey, table] of Object.entries(this._tables)) {
      const arr = DB[jsKey];
      if (!arr?.length) continue;
      const cs = this._checksum(arr);
      if (cs !== this._checksums[table]) {
        this._checksums[table] = cs;
        const rows = Array.from(arr).map(r => ({ id:r.id, data:{...r} })).filter(r => r.id);
        if (rows.length) {
          await this._fetch(`/api/data/${table}/upsert`, {
            method: 'POST', body: JSON.stringify(rows),
          });
        }
      }
    }
  },

  _checksum(arr) {
    if (!arr?.length) return '0';
    const a = Array.from(arr);
    return `${a.length}|${a[0]?.id||''}|${a[a.length-1]?.id||''}`;
  },

  // ── COMPANY SAVE ──────────────────────────────────────────

  async saveCompany() {
    if (!this.isConnected) return;
    await this._fetch('/api/data/company/upsert', {
      method: 'POST',
      body: JSON.stringify({ id: 'main', data: DB.company }),
    });
  },

  // ── FORCE FULL SYNC ───────────────────────────────────────

  async syncAll() {
    if (!this.isConnected) {
      App.toast(currentLang==='ar' ? 'Backend غير متصل' : 'Backend not connected', 'warning');
      return;
    }
    App.toast(currentLang==='ar' ? 'جارٍ المزامنة الكاملة...' : 'Full sync...', 'info');
    try {
      await this._fetch('/api/data/company/upsert', {
        method: 'POST', body: JSON.stringify({ id:'main', data: DB.company }),
      });
      for (const [jsKey, table] of Object.entries(this._tables)) {
        const arr = Array.from(DB[jsKey]);
        if (!arr.length) continue;
        const rows = arr.map(r => ({ id:r.id, data:{...r} })).filter(r => r.id);
        if (rows.length) {
          await this._fetch(`/api/data/${table}/upsert`, {
            method: 'POST', body: JSON.stringify(rows),
          });
        }
        this._checksums[table] = this._checksum(DB[jsKey]);
      }
      App.toast(currentLang==='ar' ? 'تمت المزامنة بنجاح ✓' : 'Sync complete ✓', 'success');
    } catch(e) {
      App.toast('خطأ: ' + e.message, 'error');
    }
  },

  // ── CONFIG ────────────────────────────────────────────────

  getConfig() {
    try {
      const saved = JSON.parse(localStorage.getItem('backend-config') || '{}');
      if (saved.backendUrl) return saved;
      if (typeof AppConfig !== 'undefined' && AppConfig.backend?.url) {
        return { backendUrl: AppConfig.backend.url };
      }
      return {};
    } catch { return {}; }
  },

  // ── STATUS BADGE ──────────────────────────────────────────

  getStatusBadge() {
    const map = {
      connected:    ['badge-success',   'متصل',           'Connected'],
      connecting:   ['badge-warning',   'جارٍ الاتصال...','Connecting...'],
      disconnected: ['badge-secondary', 'غير متصل',       'Disconnected'],
      error:        ['badge-danger',    'خطأ في الاتصال', 'Connection Error'],
    };
    const [cls, ar, en] = map[this._status] || map.disconnected;
    return `<span class="badge ${cls} badge-dot">${currentLang==='ar'?ar:en}</span>`;
  },
};
