/* =========================================================
   ATTENDIFY PRO — SUPABASE INTEGRATION LAYER
   Handles: init · load · sync · proxy-based auto-save
   ========================================================= */

const SupabaseDB = {

  _client:      null,
  _syncQueue:   [],     // pending upserts / deletes
  _flushTimer:  null,
  _syncTimer:   null,   // periodic dirty-check
  _checksums:   {},     // table checksum cache for dirty detection
  _status:      'disconnected', // 'disconnected' | 'connecting' | 'connected' | 'error'

  // JS DB key → Supabase table name
  _tables: {
    departments:   'departments',
    employees:     'employees',
    shifts:        'shifts',
    attendance:    'attendance',
    leaves:        'leaves',
    requests:      'requests',
    notifications: 'notifications',
    payroll:       'payroll',
    audit:         'audit_logs',
  },

  get isConnected() { return this._status === 'connected'; },

  // ── INIT ──────────────────────────────────────────────────

  async init() {
    const cfg = this.getConfig();
    if (!cfg.url || !cfg.key) {
      this._status = 'disconnected';
      return false;
    }

    this._status = 'connecting';
    try {
      // Supabase JS v2 — loaded via CDN
      this._client = window.supabase.createClient(cfg.url, cfg.key, {
        auth: { persistSession: false }
      });

      // Test connection with a lightweight query
      const { error } = await this._client.from('company').select('id').limit(1);
      if (error) throw new Error(error.message);

      this._status = 'connected';
      console.log('[Supabase] Connected ✓');
      return true;
    } catch(e) {
      this._status = 'error';
      console.warn('[Supabase] Connection failed:', e.message);
      this._client = null;
      return false;
    }
  },

  // ── LOAD ALL DATA ─────────────────────────────────────────

  async loadAll() {
    if (!this.isConnected) return false;

    try {
      // Load company settings
      const { data: co } = await this._client
        .from('company').select('data').eq('id','main').maybeSingle();
      if (co?.data) Object.assign(DB.company, co.data);

      // Load each array table
      for (const [jsKey, table] of Object.entries(this._tables)) {
        const { data, error } = await this._client
          .from(table).select('id,data').order('created_at', { ascending: true });

        if (error) {
          console.warn(`[Supabase] Load ${table}:`, error.message);
          continue;
        }

        if (data) {
          // Replace in-memory array contents
          DB[jsKey].length = 0;
          data.forEach(row => Array.prototype.push.call(DB[jsKey], row.data || {}));

          // Wrap array with Proxy for auto-sync
          DB[jsKey] = this._proxyArray(DB[jsKey], table);

          // Store checksum
          this._checksums[table] = this._checksum(DB[jsKey]);
        }
      }

      // Start periodic dirty-check sync
      this._startPeriodicSync();
      console.log('[Supabase] Data loaded ✓');
      return true;
    } catch(e) {
      console.warn('[Supabase] Load failed:', e.message);
      return false;
    }
  },

  // ── PROXY ARRAY ───────────────────────────────────────────
  // Intercepts push/splice/index-assignment for auto-sync

  _proxyArray(arr, tableName) {
    const self = this;
    return new Proxy(arr, {
      get(target, prop) {
        // Intercept mutating methods
        if (prop === 'push') {
          return function(...items) {
            const r = Array.prototype.push.apply(target, items);
            items.forEach(item => item?.id && self._enqueue('upsert', tableName, item));
            return r;
          };
        }
        if (prop === 'splice') {
          return function(start, delCount = 0, ...items) {
            const removed = Array.prototype.splice.call(target, start, delCount, ...items);
            removed.forEach(item => item?.id && self._enqueue('delete', tableName, item));
            items.forEach(item => item?.id && self._enqueue('upsert', tableName, item));
            return removed;
          };
        }
        if (prop === 'unshift') {
          return function(...items) {
            const r = Array.prototype.unshift.apply(target, items);
            items.forEach(item => item?.id && self._enqueue('upsert', tableName, item));
            return r;
          };
        }
        // Bind array methods to target
        const val = target[prop];
        if (typeof val === 'function') return val.bind(target);
        return val;
      },
      set(target, prop, value) {
        target[prop] = value;
        // Intercept numeric index assignment (arr[i] = obj)
        if (!isNaN(prop) && value?.id) {
          self._enqueue('upsert', tableName, value);
        }
        return true;
      }
    });
  },

  // ── SYNC QUEUE ────────────────────────────────────────────

  _enqueue(op, table, record) {
    if (!this.isConnected || !record?.id) return;
    // Deduplicate: last write wins
    this._syncQueue = this._syncQueue.filter(
      q => !(q.table === table && q.id === record.id)
    );
    this._syncQueue.push({ op, table, id: record.id, data: { ...record } });
    this._scheduleFlush();
  },

  _scheduleFlush() {
    clearTimeout(this._flushTimer);
    this._flushTimer = setTimeout(() => this._flush(), 1500);
  },

  async _flush() {
    if (!this.isConnected || !this._syncQueue.length) return;
    const batch = this._syncQueue.splice(0); // take all pending

    // Group by operation type for batch efficiency
    const upserts = batch.filter(q => q.op === 'upsert');
    const deletes  = batch.filter(q => q.op === 'delete');

    // Group upserts by table
    const upsertByTable = {};
    upserts.forEach(q => {
      if (!upsertByTable[q.table]) upsertByTable[q.table] = [];
      upsertByTable[q.table].push({ id: q.id, data: q.data });
    });

    // Execute upserts
    for (const [table, rows] of Object.entries(upsertByTable)) {
      try {
        const { error } = await this._client.from(table).upsert(rows);
        if (error) throw error;
      } catch(e) {
        console.warn(`[Supabase] Upsert ${table}:`, e.message);
        // Re-queue on failure
        rows.forEach(r => this._syncQueue.push({ op:'upsert', table, id:r.id, data:r.data }));
      }
    }

    // Execute deletes (one by one for safety)
    for (const q of deletes) {
      try {
        const { error } = await this._client.from(q.table).delete().eq('id', q.id);
        if (error) throw error;
      } catch(e) {
        console.warn(`[Supabase] Delete ${q.table}:`, e.message);
      }
    }
  },

  // ── PERIODIC DIRTY CHECK ──────────────────────────────────
  // Catches mutations the Proxy misses (direct property edits)

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
        // Sync all records in this table
        const rows = Array.from(arr).map(r => ({ id: r.id, data: { ...r } })).filter(r => r.id);
        if (rows.length) {
          try {
            await this._client.from(table).upsert(rows);
          } catch(e) {
            console.warn(`[Supabase] Dirty sync ${table}:`, e.message);
          }
        }
      }
    }
  },

  _checksum(arr) {
    // Fast approximate checksum — length + first+last record id
    if (!arr?.length) return '0';
    const a = Array.from(arr);
    return `${a.length}|${a[0]?.id||''}|${a[a.length-1]?.id||''}`;
  },

  // ── COMPANY SAVE ──────────────────────────────────────────

  async saveCompany() {
    if (!this.isConnected) return;
    try {
      await this._client.from('company').upsert({ id: 'main', data: DB.company });
    } catch(e) {
      console.warn('[Supabase] Save company:', e.message);
    }
  },

  // ── FORCE FULL SYNC ───────────────────────────────────────

  async syncAll() {
    if (!this.isConnected) {
      App.toast(currentLang==='ar'?'Supabase غير متصل':'Supabase not connected', 'warning');
      return;
    }

    App.toast(currentLang==='ar'?'جارٍ المزامنة الكاملة...':'Full sync in progress...', 'info');

    try {
      // Sync company
      await this._client.from('company').upsert({ id: 'main', data: DB.company });

      // Sync all arrays
      for (const [jsKey, table] of Object.entries(this._tables)) {
        const arr = Array.from(DB[jsKey]);
        if (!arr.length) continue;
        const rows = arr.map(r => ({ id: r.id, data: { ...r } })).filter(r => r.id);
        if (rows.length) await this._client.from(table).upsert(rows);
        this._checksums[table] = this._checksum(DB[jsKey]);
      }

      App.toast(currentLang==='ar'?'تمت المزامنة بنجاح ✓':'Sync complete ✓', 'success');
    } catch(e) {
      App.toast(`Supabase: ${e.message}`, 'error');
    }
  },

  // ── CONFIG ────────────────────────────────────────────────

  getConfig() {
    try {
      const saved = JSON.parse(localStorage.getItem('supabase-config') || '{}');
      if (saved.url && saved.key) return saved;
      // Fall back to config.js defaults
      if (typeof AppConfig !== 'undefined' && AppConfig.supabase?.url) {
        return AppConfig.supabase;
      }
      return {};
    }
    catch { return {}; }
  },

  async saveConfig(url, key) {
    if (!url || !key) {
      App.toast(currentLang==='ar'?'يرجى إدخال الرابط والمفتاح':'Please enter URL and key', 'warning');
      return false;
    }
    localStorage.setItem('supabase-config', JSON.stringify({ url: url.trim(), key: key.trim() }));
    this._client = null;
    this._status = 'disconnected';

    const ok = await this.init();
    if (ok) {
      App.toast(currentLang==='ar'?'تم الاتصال بـ Supabase بنجاح ✓':'Connected to Supabase ✓', 'success');
      await this.loadAll();
    } else {
      App.toast(currentLang==='ar'?'فشل الاتصال. تحقق من الرابط والمفتاح':'Connection failed. Check URL and key', 'error');
    }
    return ok;
  },

  clearConfig() {
    localStorage.removeItem('supabase-config');
    this._client = null;
    this._status = 'disconnected';
    clearInterval(this._syncTimer);
    App.toast(currentLang==='ar'?'تم قطع الاتصال بـ Supabase':'Supabase disconnected', 'info');
  },

  // ── STATUS BADGE HTML ─────────────────────────────────────

  getStatusBadge() {
    const map = {
      connected:    ['badge-success', 'متصل',          'Connected'],
      connecting:   ['badge-warning', 'جارٍ الاتصال...','Connecting...'],
      disconnected: ['badge-secondary','غير متصل',     'Disconnected'],
      error:        ['badge-danger',  'خطأ في الاتصال','Connection Error'],
    };
    const [cls, ar, en] = map[this._status] || map.disconnected;
    return `<span class="badge ${cls} badge-dot">${currentLang==='ar'?ar:en}</span>`;
  },
};
