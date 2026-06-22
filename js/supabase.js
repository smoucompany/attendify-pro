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

  _ascii(s) {
    if (!s || typeof s !== 'string') return '';
    var o = '';
    for (var i = 0; i < s.length; i++) { if (s.charCodeAt(i) < 128) o += s[i]; }
    return o;
  },

  async _fetch(path, options = {}, _retry = false) {
    var safeToken = this._ascii(sanitizeText(this._token) || '');
    var safeBase  = this._ascii(sanitizeUrl(this._baseUrl));
    const headers = {
      'Content-Type': 'application/json',
      ...(safeToken ? { 'Authorization': 'Bearer ' + safeToken } : {}),
      ...(options.headers || {}),
    };
    // Last-resort: verify no char > 127 survived — delete header if so
    if (headers['Authorization']) {
      var _authOk = true;
      for (var _ci = 0; _ci < headers['Authorization'].length; _ci++) {
        if (headers['Authorization'].charCodeAt(_ci) > 127) { _authOk = false; break; }
      }
      if (!_authOk) { delete headers['Authorization']; this._clearTokens(); }
    }

    try {
      const r    = await fetch(safeBase + path, { ...options, headers });
      const json = await r.json().catch(() => ({}));

      // إذا انتهت الجلسة وعندنا refresh token — جدّد تلقائياً
      if (r.status === 401 && !_retry && this._refreshToken) {
        const refreshed = await this._doRefresh();
        if (refreshed) return this._fetch(path, options, true);
      }

      return { ok: r.ok, status: r.status, data: json };
    } catch(e) {
      // Show visible diagnostic when ByteString error occurs
      if (e.message && e.message.indexOf('ByteString') !== -1) {
        var _dbgAuth = headers['Authorization'] || '';
        var _dbgCodes = [];
        for (var _di = 0; _di < Math.min(_dbgAuth.length, 12); _di++) { _dbgCodes.push(_dbgAuth.charCodeAt(_di)); }
        var _dbgMsg = 'ByteString at path=' + path + ' | auth[0-12]=[' + _dbgCodes.join(',') + '] | base=' + safeBase;
        console.error('[BYTESTRING DBG]', _dbgMsg);
        try {
          var _dv = document.getElementById('_bsdbg') || document.createElement('div');
          _dv.id = '_bsdbg';
          _dv.style.cssText = 'position:fixed;bottom:0;left:0;right:0;background:#7f1d1d;color:#fff;z-index:9999999;padding:10px;font:11px monospace;word-break:break-all;direction:ltr';
          _dv.textContent = _dbgMsg;
          if (!document.getElementById('_bsdbg')) document.body.appendChild(_dv);
        } catch(_) {}
      }
      console.warn('[API]', path, e.message);
      return { ok: false, status: 0, data: { error: e.message } };
    }
  },

  async _doRefresh() {
    try {
      const r    = await fetch(this._ascii(sanitizeUrl(this._baseUrl)) + '/api/auth/refresh', {
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

  _clean(s) { return sanitizeText(s) || null; },

  _saveTokens(token, refreshToken) {
    this._token        = sanitizeText(token) || null;
    this._refreshToken = sanitizeText(refreshToken) || null;
    if (this._token)        localSet('attendify-token',         this._token);
    if (this._refreshToken) localSet('attendify-refresh-token', this._refreshToken);
  },

  _clearTokens() {
    this._token = null; this._refreshToken = null;
    localStorage.removeItem('attendify-token');
    localStorage.removeItem('attendify-refresh-token');
  },

  // ── INIT ──────────────────────────────────────────────────

  async init() {
    const cfg = this.getConfig();
    const rawUrl = cfg.backendUrl || (typeof window !== 'undefined' ? window.location.origin : '');
    this._baseUrl = sanitizeUrl(rawUrl);

    this._token        = localGet('attendify-token') || null;
    this._refreshToken = localGet('attendify-refresh-token') || null;

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
    try {
      // endpoint بدون auth — يعمل حتى قبل تسجيل الدخول
      const r    = await fetch(this._ascii(sanitizeUrl(this._baseUrl)) + '/api/first-setup');
      const data = await r.json().catch(() => ({}));
      return data.firstSetup === true;
    } catch(e) {
      return false;
    }
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
      // Single request fetches all tables at once
      const { ok, data: all } = await this._fetch('/api/data/all');
      if (!ok) return false;

      // Company
      const co = all.data?.company;
      if (co?.data) Object.assign(DB.company, co.data);

      // Arrays
      for (const [jsKey, table] of Object.entries(this._tables)) {
        const td = all.data?.[table];
        if (!td) continue;
        DB[jsKey].length = 0;
        (td.rows || []).forEach(row => Array.prototype.push.call(DB[jsKey], row.data || {}));
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
      const saved = localGetJson('backend-config', {});
      if (saved.backendUrl) return saved;
      if (typeof AppConfig !== 'undefined' && AppConfig.backend?.url) {
        return { backendUrl: sanitizeUrl(AppConfig.backend.url) };
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
