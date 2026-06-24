/* =========================================================
   BACKUP MODULE — Supabase + Google Drive auto-backup
   ========================================================= */

const BackupModule = {

  _autoTimer:    null,
  _googleToken:  null,
  _gisLoaded:    false,
  _tokenClient:  null,
  _pendingDriveCb: null,

  // ── RENDER ──────────────────────────────────────────────

  render(container) {
    const cfg = DB.company.backupSettings || {};
    const gdClientId = localStorage.getItem('attendify-gdrive-client-id') || '';
    const lastSupa   = localStorage.getItem('attendify-last-backup-supabase') || '';
    const lastDrive  = localStorage.getItem('attendify-last-backup-drive') || '';
    const autoOn     = cfg.auto !== false;
    const freq       = cfg.freq || 'daily';

    container.innerHTML = `
      <div class="page-header">
        <div class="page-header-text">
          <h1>النسخ الاحتياطي</h1>
          <p>حفظ تلقائي على Supabase وGoogle Drive</p>
        </div>
        <div style="display:flex;gap:10px">
          <button class="btn btn-primary" onclick="BackupModule.runBackup()">
            <i class="fas fa-cloud-arrow-up"></i> نسخ احتياطي الآن
          </button>
        </div>
      </div>

      <!-- Status Cards -->
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-bottom:20px">
        ${[
          { icon:'fa-database',    color:'gradient-primary', label:'Supabase',      sub: lastSupa  ? 'آخر نسخة: ' + BackupModule._ago(lastSupa)  : 'لم يتم بعد' },
          { icon:'fa-brands fa-google-drive', color:'gradient-success', label:'Google Drive', sub: lastDrive ? 'آخر نسخة: ' + BackupModule._ago(lastDrive) : 'لم يتم بعد' },
          { icon:'fa-clock-rotate-left', color:'gradient-warning', label:'التلقائي', sub: autoOn ? 'مفعّل — ' + BackupModule._freqLabel(freq) : 'متوقف' },
        ].map(c => `
          <div class="card">
            <div class="card-body" style="display:flex;align-items:center;gap:14px;padding:18px">
              <div class="stat-icon ${c.color}" style="width:46px;height:46px;font-size:20px;flex-shrink:0">
                <i class="fas ${c.icon}"></i>
              </div>
              <div>
                <div style="font-size:15px;font-weight:700;color:var(--text-primary)">${c.label}</div>
                <div style="font-size:12px;color:var(--text-muted);margin-top:2px">${c.sub}</div>
              </div>
            </div>
          </div>
        `).join('')}
      </div>

      <div style="display:grid;grid-template-columns:1fr 360px;gap:20px;align-items:start">

        <!-- Backup History -->
        <div class="card">
          <div class="card-header">
            <h3><i class="fas fa-history" style="color:var(--primary)"></i> سجل النسخ الاحتياطية</h3>
            <button class="btn btn-sm btn-outline" onclick="BackupModule._loadHistory()">
              <i class="fas fa-rotate-right"></i> تحديث
            </button>
          </div>
          <div class="card-body" id="bk-history" style="padding:8px">
            <div style="text-align:center;padding:30px;color:var(--text-muted)">
              <i class="fas fa-spinner fa-spin fa-2x" style="margin-bottom:12px;display:block"></i>
              جارٍ التحميل...
            </div>
          </div>
        </div>

        <!-- Settings -->
        <div style="display:flex;flex-direction:column;gap:16px">

          <!-- Auto Backup -->
          <div class="card">
            <div class="card-header"><h3><i class="fas fa-robot" style="color:var(--warning)"></i> النسخ التلقائي</h3></div>
            <div class="card-body" style="display:flex;flex-direction:column;gap:14px">
              <label style="display:flex;align-items:center;gap:10px;cursor:pointer">
                <div class="toggle-switch ${autoOn ? 'on' : ''}" id="bk-auto-toggle"
                  onclick="BackupModule._toggleAuto(this)" style="flex-shrink:0"></div>
                <span style="font-size:13px;font-weight:600">تفعيل النسخ التلقائي</span>
              </label>
              <div class="app-form-group">
                <label>التكرار</label>
                <select class="app-form-input" id="bk-freq" onchange="BackupModule._saveSettings()">
                  <option value="hourly"  ${freq==='hourly'  ?'selected':''}>كل ساعة</option>
                  <option value="daily"   ${freq==='daily'   ?'selected':''}>يومياً</option>
                  <option value="weekly"  ${freq==='weekly'  ?'selected':''}>أسبوعياً</option>
                </select>
              </div>
              <div class="app-form-group">
                <label>الوجهة</label>
                <div style="display:flex;flex-direction:column;gap:8px">
                  <label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:13px">
                    <input type="checkbox" id="bk-dest-supa" ${(cfg.destSupabase!==false)?'checked':''} onchange="BackupModule._saveSettings()">
                    <i class="fas fa-database" style="color:var(--primary)"></i> Supabase
                  </label>
                  <label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:13px">
                    <input type="checkbox" id="bk-dest-drive" ${cfg.destDrive?'checked':''} onchange="BackupModule._saveSettings()">
                    <i class="fab fa-google-drive" style="color:#4caf50"></i> Google Drive
                  </label>
                </div>
              </div>
            </div>
          </div>

          <!-- Google Drive Setup -->
          <div class="card">
            <div class="card-header"><h3><i class="fab fa-google-drive" style="color:#4caf50"></i> إعداد Google Drive</h3></div>
            <div class="card-body" style="display:flex;flex-direction:column;gap:12px">
              <div style="font-size:12px;color:var(--text-muted);background:var(--bg-input);padding:10px;border-radius:8px;line-height:1.7">
                <b>خطوات الإعداد:</b><br>
                1. افتح <a href="https://console.cloud.google.com" target="_blank" style="color:var(--primary)">Google Cloud Console</a><br>
                2. أنشئ مشروع جديد وفعّل <b>Drive API</b><br>
                3. أنشئ OAuth 2.0 Client ID (Web App)<br>
                4. أضف النطاق في Authorized Origins<br>
                5. الصق الـ Client ID أدناه
              </div>
              <div class="app-form-group">
                <label>Google Client ID</label>
                <input class="app-form-input" id="bk-gcid" type="text"
                  value="${gdClientId}" placeholder="xxxx.apps.googleusercontent.com"
                  style="font-family:var(--font-en);font-size:12px" dir="ltr">
              </div>
              <button class="btn btn-outline btn-sm" onclick="BackupModule._saveGoogleClientId()" style="width:100%">
                <i class="fas fa-save"></i> حفظ Client ID
              </button>
              ${(this._googleToken || localStorage.getItem('attendify-gdrive-connected') === '1') ? `
                <div style="display:flex;align-items:center;gap:8px">
                  <div style="flex:1;display:flex;align-items:center;gap:6px;color:var(--success);font-size:12px;font-weight:600">
                    <i class="fas fa-circle-check"></i> متصل بـ Google Drive
                  </div>
                  <button class="btn btn-sm btn-outline" style="color:var(--danger);border-color:var(--danger);font-size:11px" onclick="BackupModule._disconnectGoogle()">
                    قطع الاتصال
                  </button>
                </div>
              ` : `
                <button class="btn btn-sm" style="background:#4caf50;color:#fff;width:100%" onclick="BackupModule._connectGoogle()">
                  <i class="fab fa-google"></i> تسجيل الدخول بـ Google
                </button>
              `}
            </div>
          </div>

          <!-- Manual Export -->
          <div class="card">
            <div class="card-header"><h3><i class="fas fa-file-export" style="color:var(--cyan)"></i> تصدير يدوي</h3></div>
            <div class="card-body" style="display:flex;flex-direction:column;gap:8px">
              <button class="btn btn-outline btn-sm" onclick="BackupModule._exportJson()">
                <i class="fas fa-file-code"></i> تحميل كـ JSON
              </button>
              <button class="btn btn-outline btn-sm" onclick="BackupModule._importJson()">
                <i class="fas fa-file-import"></i> استيراد من JSON
                <input type="file" id="bk-import-file" accept=".json" style="display:none" onchange="BackupModule._doImport(this)">
              </button>
            </div>
          </div>

        </div>
      </div>
    `;

    this._loadHistory();
    this._startAutoTimer();
  },

  // ── CORE BACKUP ─────────────────────────────────────────

  async runBackup(silent = false) {
    const cfg = DB.company.backupSettings || {};
    const destSupa  = document.getElementById('bk-dest-supa')?.checked  ?? cfg.destSupabase !== false;
    const destDrive = document.getElementById('bk-dest-drive')?.checked ?? !!cfg.destDrive;

    if (!silent) App.toast('جارٍ الحفظ الاحتياطي...', 'info');

    let supaOk = true, driveOk = true;

    if (destSupa) supaOk  = await this._backupToSupabase(silent);
    if (destDrive) driveOk = await this._backupToDrive(silent);

    if (!silent) {
      if (supaOk && driveOk) App.toast('تم الحفظ الاحتياطي بنجاح ✓', 'success');
      else if (!supaOk && !driveOk) App.toast('فشل الحفظ على كلا الوجهتين', 'error');
      else App.toast('تم الحفظ جزئياً — تحقق من الإعدادات', 'warning');
      this._loadHistory();
    }

    return supaOk || driveOk;
  },

  async _backupToSupabase(silent = false) {
    if (!SupabaseDB.isConnected) {
      if (!silent) App.toast('Supabase غير متصل', 'warning');
      return false;
    }
    try {
      const snapshot = this._getSnapshot();
      const { ok, error } = await SupabaseDB._fetch('/api/backup/save', {
        method: 'POST',
        body: JSON.stringify({ snapshot, label: 'نسخة تلقائية' })
      });
      if (!ok) {
        if (!silent) App.toast('فشل الحفظ على Supabase: ' + (error || ''), 'error');
        return false;
      }
      localStorage.setItem('attendify-last-backup-supabase', new Date().toISOString());
      return true;
    } catch(e) {
      if (!silent) App.toast('خطأ: ' + e.message, 'error');
      return false;
    }
  },

  async _backupToDrive(silent = false) {
    const clientId = localStorage.getItem('attendify-gdrive-client-id');
    if (!clientId) {
      if (!silent) App.toast('يجب إدخال Google Client ID أولاً', 'warning');
      return false;
    }
    try {
      const token = await this._getGoogleToken(clientId);
      if (!token) { if (!silent) App.toast('فشل تسجيل الدخول بـ Google', 'error'); return false; }

      const snapshot = this._getSnapshot();
      const date     = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const filename = `attendify-backup-${date}.json`;
      const content  = JSON.stringify(snapshot, null, 2);

      const boundary = 'bk_attendify_boundary';
      const body = [
        `--${boundary}`,
        'Content-Type: application/json; charset=UTF-8',
        '',
        JSON.stringify({ name: filename, mimeType: 'application/json' }),
        `--${boundary}`,
        'Content-Type: application/json',
        '',
        content,
        `--${boundary}--`
      ].join('\r\n');

      const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
        method: 'POST',
        headers: {
          Authorization:  `Bearer ${token}`,
          'Content-Type': `multipart/related; boundary="${boundary}"`,
        },
        body
      });

      if (!res.ok) {
        const err = await res.json();
        if (!silent) App.toast('فشل الرفع على Drive: ' + (err.error?.message || res.status), 'error');
        return false;
      }

      localStorage.setItem('attendify-last-backup-drive', new Date().toISOString());
      return true;
    } catch(e) {
      if (!silent) App.toast('خطأ Google Drive: ' + e.message, 'error');
      return false;
    }
  },

  // ── GOOGLE AUTH ─────────────────────────────────────────

  _connectGoogle() {
    const clientId = document.getElementById('bk-gcid')?.value.trim()
                  || localStorage.getItem('attendify-gdrive-client-id');
    if (!clientId) { App.toast('يرجى إدخال Google Client ID أولاً', 'warning'); return; }
    this._getGoogleToken(clientId, true).then(token => {
      if (token) { App.toast('تم الاتصال بـ Google Drive ✓', 'success'); App._navigate('backup'); }
    });
  },

  _disconnectGoogle() {
    this._googleToken = null;
    try { sessionStorage.removeItem('attendify-gdrive-token'); } catch(_) {}
    try { localStorage.removeItem('attendify-gdrive-connected'); } catch(_) {}
    if (window.google?.accounts?.oauth2) {
      const clientId = localStorage.getItem('attendify-gdrive-client-id');
      if (clientId) window.google.accounts.oauth2.revoke(clientId, () => {});
    }
    App.toast('تم قطع الاتصال بـ Google Drive', 'info');
    App._navigate('backup');
  },

  _getGoogleToken(clientId, forceConsent = false) {
    return new Promise((resolve) => {
      // 1. Valid in-memory token
      if (!forceConsent && this._googleToken) { resolve(this._googleToken); return; }

      // 2. Valid cached token in sessionStorage
      if (!forceConsent) {
        try {
          const saved = JSON.parse(sessionStorage.getItem('attendify-gdrive-token') || 'null');
          if (saved?.token && Date.now() < saved.exp) {
            this._googleToken = saved.token;
            resolve(this._googleToken);
            return;
          }
        } catch(_) {}
      }

      if (!window.google?.accounts?.oauth2) {
        App.toast('مكتبة Google لم تُحمَّل بعد، أعد المحاولة', 'warning');
        resolve(null); return;
      }

      const saveToken = (token, expiresIn) => {
        this._googleToken = token;
        const exp = Date.now() + (expiresIn - 120) * 1000;
        try { sessionStorage.setItem('attendify-gdrive-token', JSON.stringify({ token, exp })); } catch(_) {}
        // Mark as permanently connected so we auto-refresh silently next time
        try { localStorage.setItem('attendify-gdrive-connected', '1'); } catch(_) {}
      };

      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: 'https://www.googleapis.com/auth/drive.file',
        callback: (response) => {
          if (response.error) { resolve(null); return; }
          saveToken(response.access_token, response.expires_in || 3600);
          resolve(this._googleToken);
        },
        error_callback: () => resolve(null),
      });

      const alreadyConnected = localStorage.getItem('attendify-gdrive-connected') === '1';
      // Silent refresh if user already granted consent — no popup, no click needed
      client.requestAccessToken({ prompt: (forceConsent || !alreadyConnected) ? 'consent' : '' });
    });
  },

  // Call on app load to pre-warm the token silently
  async _silentTokenRefresh() {
    const clientId = localStorage.getItem('attendify-gdrive-client-id');
    if (!clientId || localStorage.getItem('attendify-gdrive-connected') !== '1') return;
    // Wait for GIS script to load
    if (!window.google?.accounts?.oauth2) return;
    await this._getGoogleToken(clientId, false);
  },

  // ── HISTORY ─────────────────────────────────────────────

  async _loadHistory() {
    const el = document.getElementById('bk-history');
    if (!el) return;
    if (!SupabaseDB.isConnected) {
      el.innerHTML = `<p style="text-align:center;color:var(--text-muted);padding:20px;font-size:13px">
        <i class="fas fa-plug-circle-xmark" style="font-size:24px;display:block;margin-bottom:8px"></i>
        Supabase غير متصل — لا يمكن عرض السجل
      </p>`;
      return;
    }
    el.innerHTML = `<div style="text-align:center;padding:20px;color:var(--text-muted)"><i class="fas fa-spinner fa-spin"></i></div>`;
    const { ok, data } = await SupabaseDB._fetch('/api/backup/list');
    if (!ok || !data?.backups?.length) {
      el.innerHTML = `<p style="text-align:center;color:var(--text-muted);padding:20px;font-size:13px">
        <i class="fas fa-inbox fa-2x" style="display:block;margin-bottom:8px"></i>
        لا توجد نسخ احتياطية بعد
      </p>`;
      return;
    }
    el.innerHTML = data.backups.map(b => {
      const size = b['data->size'] ? (Math.round(b['data->size'] / 1024) + ' KB') : '—';
      const label = b['data->label'] || 'نسخة احتياطية';
      return `
        <div style="display:flex;align-items:center;gap:12px;padding:12px;border-radius:10px;margin-bottom:6px;background:var(--bg-input);transition:background .15s"
          onmouseover="this.style.background='var(--bg-secondary)'" onmouseout="this.style.background='var(--bg-input)'">
          <div class="stat-icon gradient-primary" style="width:36px;height:36px;font-size:14px;flex-shrink:0">
            <i class="fas fa-database"></i>
          </div>
          <div style="flex:1;min-width:0">
            <div style="font-size:13px;font-weight:700;color:var(--text-primary)">${label}</div>
            <div style="font-size:11px;color:var(--text-muted)">${new Date(b.created_at).toLocaleString('ar-SA')} · ${size}</div>
          </div>
          <div style="display:flex;gap:6px">
            <button class="btn btn-sm btn-outline" onclick="BackupModule._restore('${b.id}')" title="استعادة">
              <i class="fas fa-rotate-left"></i>
            </button>
            <button class="btn btn-sm btn-outline" style="color:var(--danger);border-color:var(--danger)" onclick="BackupModule._delete('${b.id}', this)" title="حذف">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
      `;
    }).join('');
  },

  // ── RESTORE / DELETE ────────────────────────────────────

  async _restore(id) {
    if (!confirm('هل تريد استعادة هذه النسخة؟ سيتم استبدال البيانات الحالية.')) return;
    App.toast('جارٍ الاستعادة...', 'info');
    const { ok, data } = await SupabaseDB._fetch(`/api/backup/${id}`);
    if (!ok || !data?.snapshot) { App.toast('فشل تحميل النسخة', 'error'); return; }
    const snap = data.snapshot;
    // Restore to localStorage then reload
    delete snap.savedAt; delete snap.label; delete snap.size;
    try {
      localStorage.setItem('attendify-db', JSON.stringify(snap));
      App.toast('تمت الاستعادة — سيتم تحديث الصفحة', 'success');
      setTimeout(() => location.reload(), 1500);
    } catch(e) { App.toast('فشل الاستعادة: ' + e.message, 'error'); }
  },

  async _delete(id, btn) {
    if (!confirm('حذف هذه النسخة الاحتياطية؟')) return;
    btn.disabled = true;
    const { ok } = await SupabaseDB._fetch(`/api/backup/${id}`, { method: 'DELETE' });
    if (ok) { App.toast('تم الحذف', 'success'); this._loadHistory(); }
    else { App.toast('فشل الحذف', 'error'); btn.disabled = false; }
  },

  // ── SETTINGS ────────────────────────────────────────────

  _toggleAuto(el) {
    el.classList.toggle('on');
    DB.company.backupSettings = DB.company.backupSettings || {};
    DB.company.backupSettings.auto = el.classList.contains('on');
    DB._saveToLocal();
    this._startAutoTimer();
    App.toast(el.classList.contains('on') ? 'النسخ التلقائي مفعّل ✓' : 'تم إيقاف النسخ التلقائي', 'info');
  },

  _saveSettings() {
    DB.company.backupSettings = DB.company.backupSettings || {};
    DB.company.backupSettings.freq         = document.getElementById('bk-freq')?.value || 'daily';
    DB.company.backupSettings.destSupabase = document.getElementById('bk-dest-supa')?.checked !== false;
    DB.company.backupSettings.destDrive    = !!document.getElementById('bk-dest-drive')?.checked;
    DB._saveToLocal();
    this._startAutoTimer();
  },

  _saveGoogleClientId() {
    const val = document.getElementById('bk-gcid')?.value.trim();
    if (!val) { App.toast('يرجى إدخال Client ID', 'error'); return; }
    localStorage.setItem('attendify-gdrive-client-id', val);
    App.toast('تم حفظ Client ID ✓', 'success');
  },

  // ── AUTO TIMER ──────────────────────────────────────────

  _startAutoTimer() {
    clearInterval(this._autoTimer);
    const cfg = DB.company.backupSettings || {};
    if (!cfg.auto) return;
    const ms = { hourly: 3600000, daily: 86400000, weekly: 604800000 }[cfg.freq || 'daily'] || 86400000;
    this._autoTimer = setInterval(() => this.runBackup(true), ms);
    // Check if it's been too long since last backup
    this._checkOverdue();
  },

  _checkOverdue() {
    const cfg = DB.company.backupSettings || {};
    if (!cfg.auto) return;
    const last = localStorage.getItem('attendify-last-backup-supabase');
    if (!last) { this.runBackup(true); return; }
    const ms = { hourly: 3600000, daily: 86400000, weekly: 604800000 }[cfg.freq || 'daily'] || 86400000;
    if (Date.now() - new Date(last).getTime() > ms) this.runBackup(true);
  },

  // ── EXPORT / IMPORT ─────────────────────────────────────

  _exportJson() {
    const snap     = this._getSnapshot();
    const date     = new Date().toISOString().split('T')[0];
    const filename = `attendify-backup-${date}.json`;
    const blob     = new Blob([JSON.stringify(snap, null, 2)], { type: 'application/json' });
    const a        = document.createElement('a');
    a.href         = URL.createObjectURL(blob);
    a.download     = filename;
    a.click();
    URL.revokeObjectURL(a.href);
    App.toast('تم تحميل الملف ✓', 'success');
  },

  _importJson() {
    document.getElementById('bk-import-file')?.click();
  },

  _doImport(input) {
    const file = input.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const snap = JSON.parse(e.target.result);
        if (!snap?.v) { App.toast('الملف غير صالح', 'error'); return; }
        if (!confirm('سيتم استبدال جميع البيانات الحالية. هل تريد المتابعة؟')) return;
        localStorage.setItem('attendify-db', JSON.stringify(snap));
        App.toast('تمت الاستعادة — سيتم تحديث الصفحة', 'success');
        setTimeout(() => location.reload(), 1500);
      } catch(e) { App.toast('خطأ في قراءة الملف: ' + e.message, 'error'); }
    };
    reader.readAsText(file);
    input.value = '';
  },

  // ── HELPERS ─────────────────────────────────────────────

  _getSnapshot() {
    try { return JSON.parse(localStorage.getItem('attendify-db') || '{}'); } catch(_) { return {}; }
  },

  _ago(iso) {
    if (!iso) return '—';
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1)  return 'الآن';
    if (m < 60) return `منذ ${m} د`;
    const h = Math.floor(m / 60);
    if (h < 24) return `منذ ${h} س`;
    return `منذ ${Math.floor(h / 24)} يوم`;
  },

  _freqLabel(f) {
    return { hourly: 'كل ساعة', daily: 'يومياً', weekly: 'أسبوعياً' }[f] || f;
  },
};
