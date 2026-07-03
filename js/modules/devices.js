/* =========================================================
   DEVICES MODULE — إدارة أجهزة البصمة (ZKTeco/Suprema)
   بحث/تصفية · عرض شبكة/جدول · تفاصيل الجهاز وسجله · أوامر حية
   (Sync Now / Test Connection / Restart) عبر device_events —
   تُنفَّذ فعلياً بواسطة خدمة المزامنة المحلية (sync-service/).
   ========================================================= */

const DevicesModule = {
  _search: '',
  _statusFilter: 'all',
  _selectedId: null,

  _statusMeta(status) {
    if (status === 'online')  return { label: 'متصل',      color: 'var(--success)', hero: ['#10b981','#059669'], badge: 'badge-success badge-live' };
    if (status === 'offline') return { label: 'غير متصل',  color: 'var(--danger)',  hero: ['#ef4444','#dc2626'], badge: 'badge-danger'  };
    return { label: 'غير معروف', color: 'var(--text-muted)', hero: ['#94a3b8','#64748b'], badge: 'badge-secondary' };
  },

  _pingMeta(ms) {
    if (ms == null) return { label: '—', color: 'var(--text-muted)' };
    if (ms < 150)   return { label: `${ms} ms`, color: 'var(--success)' };
    if (ms < 500)   return { label: `${ms} ms`, color: 'var(--warning, #f59e0b)' };
    return { label: `${ms} ms`, color: 'var(--danger)' };
  },

  render(container) {
    const devices  = DB.devices;
    const online   = devices.filter(d => d.status === 'online').length;
    const offline  = devices.filter(d => d.status === 'offline').length;
    const lastSync = devices.map(d => d.lastSyncAt).filter(Boolean).sort().pop();

    if (devices.length && !devices.some(d => d.id === this._selectedId)) {
      this._selectedId = devices[0].id;
    }
    if (!devices.length) this._selectedId = null;

    container.innerHTML = `
      <div class="page-header">
        <div class="page-header-text">
          <h1><i class="fas fa-fingerprint" style="color:#10b981;margin-left:8px"></i>أجهزة البصمة</h1>
          <p>إدارة ومزامنة أجهزة الحضور والانصراف — ${devices.length} جهاز</p>
        </div>
        <div class="page-header-actions">
          <div class="device-stat-pill"><i class="fas fa-signal" style="color:var(--success)"></i> ${online} متصلة</div>
          <div class="device-stat-pill"><i class="fas fa-plug-circle-xmark" style="color:var(--danger)"></i> ${offline} غير متصلة</div>
          <div class="device-stat-pill"><i class="fas fa-clock-rotate-left"></i> آخر مزامنة: ${lastSync ? new Date(lastSync).toLocaleString('ar') : '—'}</div>
          <button class="btn btn-secondary" onclick="DevicesModule.openLogs()"><i class="fas fa-list"></i> السجلات</button>
          <button class="btn btn-primary" onclick="DevicesModule.openAdd()"><i class="fas fa-plus"></i> إضافة جهاز</button>
        </div>
      </div>

      <div class="devices-hub">
        <aside class="devices-sidebar">
          <div class="devices-sidebar-head">
            <div class="toolbar-search" style="width:100%">
              <i class="fas fa-magnifying-glass"></i>
              <input type="text" placeholder="بحث بالاسم أو IP..." value="${this._search}"
                oninput="DevicesModule._search=this.value; DevicesModule._renderSidebar()">
            </div>
            <select class="toolbar-select" style="width:100%" onchange="DevicesModule._statusFilter=this.value; DevicesModule._renderSidebar()">
              <option value="all"     ${this._statusFilter==='all'?'selected':''}>كل الحالات</option>
              <option value="online"  ${this._statusFilter==='online'?'selected':''}>متصل</option>
              <option value="offline" ${this._statusFilter==='offline'?'selected':''}>غير متصل</option>
              <option value="unknown" ${this._statusFilter==='unknown'?'selected':''}>غير معروف</option>
            </select>
          </div>
          <div class="devices-sidebar-list" id="devices-sidebar-list"></div>
        </aside>

        <section class="devices-detail" id="devices-detail"></section>
      </div>
    `;

    this._renderSidebar();
    this._renderDetail();
  },

  _filtered() {
    const q = (this._search || '').trim().toLowerCase();
    return DB.devices.filter(d => {
      const matchSearch = !q || (d.name||'').toLowerCase().includes(q) || (d.ipAddress||'').includes(q);
      const matchStatus = this._statusFilter === 'all' || (d.status || 'unknown') === this._statusFilter;
      return matchSearch && matchStatus;
    });
  },

  select(id) {
    this._selectedId = id;
    this._renderSidebar();
    this._renderDetail();
  },

  _renderSidebar() {
    const list = document.getElementById('devices-sidebar-list');
    if (!list) return;
    const devices = this._filtered();

    if (!DB.devices.length) {
      list.innerHTML = `
        <div class="empty-state" style="padding:20px 10px">
          <div class="empty-icon"><i class="fas fa-fingerprint"></i></div>
          <div class="empty-title">لا توجد أجهزة</div>
          <p class="empty-desc">أضف جهاز البصمة الأول</p>
          <button class="btn btn-primary btn-sm" onclick="DevicesModule.openAdd()"><i class="fas fa-plus"></i> إضافة جهاز</button>
        </div>
      `;
      return;
    }

    if (!devices.length) {
      list.innerHTML = `<div class="empty-state" style="padding:20px 10px"><div class="empty-title">لا نتائج مطابقة</div></div>`;
      return;
    }

    list.innerHTML = devices.map(d => {
      const meta = this._statusMeta(d.status);
      const ping = this._pingMeta(d.responseTimeMs);
      const active = d.id === this._selectedId;
      return `
        <div class="device-item ${active ? 'active' : ''}" onclick="DevicesModule.select('${d.id}')">
          <span class="device-item-dot" style="background:${meta.color};color:${meta.color}"></span>
          <div style="flex:1;min-width:0">
            <div style="font-size:13px;font-weight:700;color:var(--text-primary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${d.name}</div>
            <div style="font-size:11px;color:var(--text-muted)" dir="ltr">${d.ipAddress || '—'}</div>
          </div>
          <span style="font-size:11px;font-weight:700;color:${ping.color};flex-shrink:0">${ping.label}</span>
        </div>
      `;
    }).join('');
  },

  // ── لوحة التفاصيل (يمين) ────────────────────────────────────
  async _renderDetail() {
    const box = document.getElementById('devices-detail');
    if (!box) return;
    const d = DB.devices.find(x => x.id === this._selectedId);

    if (!d) {
      box.innerHTML = `
        <div class="empty-state" style="padding:60px 20px">
          <div class="empty-icon"><i class="fas fa-fingerprint"></i></div>
          <div class="empty-title">اختر جهازاً لعرض تفاصيله</div>
          <p class="empty-desc">أو أضف جهاز بصمة جديد لبدء المزامنة</p>
          <button class="btn btn-primary" onclick="DevicesModule.openAdd()"><i class="fas fa-plus"></i> إضافة جهاز</button>
        </div>
      `;
      return;
    }

    const meta = this._statusMeta(d.status);
    const ping = this._pingMeta(d.responseTimeMs);

    box.innerHTML = `
      <div class="devices-detail-hero">
        <div style="position:absolute;inset:0;z-index:0;background:linear-gradient(135deg,${meta.hero[0]},${meta.hero[1]})"></div>
        <div style="display:flex;align-items:center;gap:16px">
          <div style="width:56px;height:56px;border-radius:16px;background:rgba(255,255,255,.18);backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;font-size:24px;flex-shrink:0">
            <i class="fas fa-fingerprint"></i>
          </div>
          <div style="flex:1;min-width:0">
            <div style="font-size:19px;font-weight:800">${d.name}</div>
            <div style="opacity:.9;font-size:12px;margin-top:2px" dir="ltr">${d.ipAddress || '—'}:${d.port || 4370}</div>
          </div>
          <span class="badge ${meta.badge} badge-dot" style="background:rgba(255,255,255,.22);color:#fff">${meta.label}</span>
        </div>
      </div>

      <div style="padding:20px">
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:20px">
          <button class="btn btn-primary btn-sm" onclick="DevicesModule.sendCommand('${d.id}','sync')"><i class="fas fa-rotate"></i> مزامنة الآن</button>
          <button class="btn btn-secondary btn-sm" onclick="DevicesModule.sendCommand('${d.id}','test')"><i class="fas fa-plug"></i> اختبار الاتصال</button>
          <button class="btn btn-secondary btn-sm" onclick="DevicesModule.sendCommand('${d.id}','restart')"><i class="fas fa-power-off"></i> إعادة تشغيل</button>
          <div style="flex:1"></div>
          <button class="btn-icon btn" onclick="DevicesModule.editDevice('${d.id}')" title="تعديل"><i class="fas fa-pencil"></i></button>
          <button class="btn-icon btn" style="color:var(--danger)" onclick="DevicesModule.deleteDevice('${d.id}')" title="حذف"><i class="fas fa-trash"></i></button>
        </div>

        ${d.lastError ? `<div style="font-size:12px;color:var(--danger);background:rgba(239,68,68,.08);padding:10px 12px;border-radius:10px;margin-bottom:18px;display:flex;align-items:center;gap:8px"><i class="fas fa-triangle-exclamation"></i> ${d.lastError}</div>` : ''}

        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:10px;margin-bottom:22px">
          <div style="padding:12px;background:var(--bg-input);border-radius:12px">
            <div style="font-size:11px;color:var(--text-muted);margin-bottom:3px"><i class="fas fa-location-dot"></i> الموقع</div>
            <div style="font-size:13px;font-weight:700">${d.location || '—'}</div>
          </div>
          <div style="padding:12px;background:var(--bg-input);border-radius:12px">
            <div style="font-size:11px;color:var(--text-muted);margin-bottom:3px"><i class="fas fa-building"></i> الفرع</div>
            <div style="font-size:13px;font-weight:700">${d.branch || '—'}</div>
          </div>
          <div style="padding:12px;background:var(--bg-input);border-radius:12px">
            <div style="font-size:11px;color:var(--text-muted);margin-bottom:3px"><i class="fas fa-gauge-high"></i> زمن الاستجابة</div>
            <div style="font-size:13px;font-weight:700;color:${ping.color}">${ping.label}</div>
          </div>
          <div style="padding:12px;background:var(--bg-input);border-radius:12px">
            <div style="font-size:11px;color:var(--text-muted);margin-bottom:3px"><i class="fas fa-clock"></i> آخر ظهور</div>
            <div style="font-size:13px;font-weight:700">${d.lastSeen ? new Date(d.lastSeen).toLocaleString('ar') : 'لم يتصل بعد'}</div>
          </div>
          <div style="padding:12px;background:var(--bg-input);border-radius:12px">
            <div style="font-size:11px;color:var(--text-muted);margin-bottom:3px"><i class="fas fa-hashtag"></i> الرقم التسلسلي</div>
            <div style="font-size:13px;font-weight:700" dir="ltr">${d.serialNumber || '—'}</div>
          </div>
        </div>

        <div style="font-size:13px;font-weight:700;color:var(--text-muted);margin-bottom:10px">آخر الأحداث</div>
        <div id="dev-detail-history" style="min-height:80px;display:flex;align-items:center;justify-content:center;color:var(--text-muted)"><i class="fas fa-spinner fa-spin"></i></div>
      </div>
    `;

    const [hist, errs] = await Promise.all([
      SupabaseDB._fetch('/api/data/device_sync_history'),
      SupabaseDB._fetch('/api/data/sync_errors'),
    ]);
    if (this._selectedId !== d.id) return;
    const rows = [
      ...(hist.data?.rows || []).map(r => r.data).filter(x => x.deviceId === d.id).map(x => ({ ...x, kind: 'sync', time: x.finishedAt })),
      ...(errs.data?.rows || []).map(r => r.data).filter(x => x.deviceId === d.id).map(x => ({ ...x, kind: 'error', time: x.capturedAt })),
    ].sort((a, b) => new Date(b.time || 0) - new Date(a.time || 0)).slice(0, 15);

    const historyBox = document.getElementById('dev-detail-history');
    if (!historyBox) return;
    historyBox.innerHTML = rows.length ? `
      <div style="display:flex;flex-direction:column;gap:8px;max-height:260px;overflow-y:auto;width:100%">
        ${rows.map(r => `
          <div style="display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:8px;background:var(--bg-input)">
            <i class="fas ${r.kind==='error'?'fa-triangle-exclamation':'fa-rotate'}" style="color:${r.kind==='error'?'var(--danger)':'var(--success)'};width:16px"></i>
            <div style="flex:1;font-size:12px">${r.message || (r.recordsImported != null ? `استورد ${r.recordsImported} سجل حضور` : '—')}</div>
            <div style="font-size:11px;color:var(--text-muted);white-space:nowrap">${r.time ? new Date(r.time).toLocaleString('ar') : '—'}</div>
          </div>
        `).join('')}
      </div>
    ` : `<div style="text-align:center;color:var(--text-muted);padding:10px;width:100%">لا توجد أحداث بعد</div>`;
  },

  // ── أوامر (Sync Now / Test Connection / Restart) ──────────
  async sendCommand(id, command) {
    const labels = { sync: 'مزامنة', test: 'اختبار الاتصال', restart: 'إعادة تشغيل' };
    App.toast(`جارٍ إرسال أمر ${labels[command]}...`, 'info');
    const r = await SupabaseDB._fetch(`/api/devices/${id}/command`, {
      method: 'POST', body: JSON.stringify({ command }),
    });
    if (r.ok) {
      App.toast(`تم إرسال أمر ${labels[command]} — سيُنفَّذ عند اتصال خدمة المزامنة`, 'success');
      DB.logAudit('admin', `أمر جهاز: ${labels[command]}`, 'Devices', id);
    } else {
      App.toast(r.data?.error || 'فشل إرسال الأمر', 'error');
    }
  },

  // ── السجلات (Connection / Sync / Error) ───────────────────
  async openLogs() {
    App.openModal('سجلات الأجهزة', `<div id="devices-logs-body" style="min-height:200px;display:flex;align-items:center;justify-content:center;color:var(--text-muted)"><i class="fas fa-spinner fa-spin"></i></div>`, { size: 'lg' });
    const [hist, errs, evs] = await Promise.all([
      SupabaseDB._fetch('/api/data/device_sync_history'),
      SupabaseDB._fetch('/api/data/sync_errors'),
      SupabaseDB._fetch('/api/data/device_events'),
    ]);
    const rows = [
      ...(hist.data?.rows || []).map(r => ({ ...r.data, kind: 'sync', time: r.data.finishedAt })),
      ...(errs.data?.rows || []).map(r => ({ ...r.data, kind: 'error', time: r.data.capturedAt })),
      ...(evs.data?.rows  || []).map(r => ({ ...r.data, kind: 'event', time: r.data.completedAt || r.data.requestedAt })),
    ].sort((a, b) => new Date(b.time || 0) - new Date(a.time || 0)).slice(0, 100);

    const body = document.getElementById('devices-logs-body');
    if (!body) return;
    if (!rows.length) {
      body.innerHTML = `<div style="text-align:center;color:var(--text-muted);padding:20px;width:100%">لا توجد سجلات بعد</div>`;
      return;
    }
    body.outerHTML = `
      <div id="devices-logs-body" style="max-height:420px;overflow-y:auto">
        <table class="data-table">
          <thead><tr><th>النوع</th><th>الجهاز</th><th>التفاصيل</th><th>الوقت</th></tr></thead>
          <tbody>
            ${rows.map(r => `
              <tr>
                <td>${r.kind === 'error' ? '<span class="badge badge-danger">خطأ</span>' : r.kind === 'sync' ? '<span class="badge badge-success">مزامنة</span>' : '<span class="badge badge-secondary">أمر</span>'}</td>
                <td dir="ltr" style="font-size:12px">${r.deviceId || '—'}</td>
                <td style="font-size:12px">${r.message || r.command || (r.recordsImported != null ? `استورد ${r.recordsImported} سجل` : '—')}</td>
                <td style="font-size:11px;color:var(--text-muted)">${r.time ? new Date(r.time).toLocaleString('ar') : '—'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  },

  // ── نموذج إضافة / تعديل ────────────────────────────────────
  _form(d) {
    return `
      <div class="app-form-group">
        <label>اسم الجهاز</label>
        <input class="app-form-input" type="text" name="name" value="${d?.name || ''}" required>
      </div>
      <div class="app-form-row">
        <div class="app-form-group">
          <label>عنوان IP</label>
          <input class="app-form-input" dir="ltr" type="text" name="ipAddress" value="${d?.ipAddress || ''}" placeholder="192.168.1.201" required>
        </div>
        <div class="app-form-group">
          <label>المنفذ (Port)</label>
          <input class="app-form-input" dir="ltr" type="number" name="port" value="${d?.port || 4370}" required>
        </div>
      </div>
      <div class="app-form-row">
        <div class="app-form-group">
          <label>الموقع</label>
          <input class="app-form-input" type="text" name="location" value="${d?.location || ''}">
        </div>
        <div class="app-form-group">
          <label>الفرع</label>
          <input class="app-form-input" type="text" name="branch" value="${d?.branch || ''}">
        </div>
      </div>
      <div class="app-form-group">
        <label>الرقم التسلسلي (اختياري)</label>
        <input class="app-form-input" dir="ltr" type="text" name="serialNumber" value="${d?.serialNumber || ''}">
      </div>
    `;
  },

  openAdd() {
    App.openModal('إضافة جهاز بصمة', `
      <form onsubmit="DevicesModule.saveNew(event)">
        ${this._form(null)}
        <div class="modal-footer" style="padding:0;margin-top:20px">
          <button type="button" class="btn btn-secondary" onclick="App.closeModal()">إلغاء</button>
          <button type="submit" class="btn btn-primary"><i class="fas fa-save"></i> حفظ</button>
        </div>
      </form>
    `, { size: 'sm' });
  },

  saveNew(e) {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target));
    const id = DB.nextId('dev');
    DB.devices.push({
      id,
      name: data.name, ipAddress: data.ipAddress, port: Number(data.port) || 4370,
      location: data.location || '', branch: data.branch || '',
      serialNumber: data.serialNumber || '', status: 'unknown',
      lastSeen: null, lastSyncAt: null, lastError: null, model: 'ZKTeco',
    });
    DB.save();
    this._selectedId = id;
    App.closeModal();
    App.toast('تمت إضافة الجهاز', 'success');
    this.render(document.getElementById('page-content'));
  },

  editDevice(id) {
    const d = DB.devices.find(x => x.id === id);
    if (!d) return;
    App.openModal('تعديل الجهاز', `
      <form onsubmit="DevicesModule.saveEdit(event, '${id}')">
        ${this._form(d)}
        <div class="modal-footer" style="padding:0;margin-top:20px">
          <button type="button" class="btn btn-secondary" onclick="App.closeModal()">إلغاء</button>
          <button type="submit" class="btn btn-primary">حفظ</button>
        </div>
      </form>
    `, { size: 'sm' });
  },

  saveEdit(e, id) {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target));
    const d = DB.devices.find(x => x.id === id);
    if (d) {
      d.name = data.name; d.ipAddress = data.ipAddress; d.port = Number(data.port) || 4370;
      d.location = data.location || ''; d.branch = data.branch || '';
      d.serialNumber = data.serialNumber || '';
    }
    DB.save();
    App.closeModal();
    App.toast('تم التحديث', 'success');
    this.render(document.getElementById('page-content'));
  },

  deleteDevice(id) {
    const d = DB.devices.find(x => x.id === id);
    if (!d) return;
    App.confirm(`هل تريد حذف جهاز "${d.name}"؟`, () => {
      const i = DB.devices.findIndex(x => x.id === id);
      if (i !== -1) DB.devices.splice(i, 1);
      DB.save();
      DB.logAudit('admin', 'حذف جهاز بصمة', 'Devices', d.name);
      App.toast(`تم حذف جهاز "${d.name}"`, 'success');
      this.render(document.getElementById('page-content'));
    });
  },
};
