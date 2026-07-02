/* =========================================================
   DEVICES MODULE — إدارة أجهزة البصمة (ZKTeco/Suprema)
   يعرض حالة الأجهزة (متصل/غير متصل/آخر مزامنة) ويرسل أوامر
   (Sync Now / Test Connection / Restart) عبر device_events —
   تُنفَّذ فعلياً بواسطة خدمة المزامنة المحلية (sync-service/).
   ========================================================= */

const DevicesModule = {

  _statusMeta(status) {
    if (status === 'online')  return { label: 'متصل',      color: 'var(--success)', badge: 'badge-success' };
    if (status === 'offline') return { label: 'غير متصل',  color: 'var(--danger)',  badge: 'badge-danger'  };
    return { label: 'غير معروف', color: 'var(--text-muted)', badge: 'badge-secondary' };
  },

  render(container) {
    const devices  = DB.devices;
    const online   = devices.filter(d => d.status === 'online').length;
    const offline  = devices.filter(d => d.status === 'offline').length;
    const lastSync = devices.map(d => d.lastSyncAt).filter(Boolean).sort().pop();

    container.innerHTML = `
      <div class="page-header">
        <div class="page-header-text">
          <h1>أجهزة البصمة</h1>
          <p>إدارة ومزامنة أجهزة الحضور والانصراف — ${devices.length} جهاز</p>
        </div>
        <div class="page-header-actions">
          <button class="btn btn-secondary" onclick="DevicesModule.openLogs()"><i class="fas fa-list"></i> السجلات</button>
          <button class="btn btn-primary" onclick="DevicesModule.openAdd()"><i class="fas fa-plus"></i> إضافة جهاز</button>
        </div>
      </div>

      <div class="stat-cards" style="margin-bottom:24px">
        <div class="stat-card">
          <div class="stat-icon" style="background:rgba(99,102,241,.15);color:#6366f1"><i class="fas fa-fingerprint"></i></div>
          <div class="stat-content"><div class="stat-value">${devices.length}</div><div class="stat-label">إجمالي الأجهزة</div></div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:rgba(16,185,129,.15);color:#10b981"><i class="fas fa-signal"></i></div>
          <div class="stat-content"><div class="stat-value">${online}</div><div class="stat-label">متصلة الآن</div></div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:rgba(239,68,68,.15);color:#ef4444"><i class="fas fa-plug-circle-xmark"></i></div>
          <div class="stat-content"><div class="stat-value">${offline}</div><div class="stat-label">غير متصلة</div></div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:rgba(245,158,11,.15);color:#f59e0b"><i class="fas fa-clock-rotate-left"></i></div>
          <div class="stat-content"><div class="stat-value" style="font-size:15px">${lastSync ? new Date(lastSync).toLocaleString('ar') : '—'}</div><div class="stat-label">آخر مزامنة</div></div>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:16px">
        ${devices.length ? devices.map(d => this._card(d)).join('') : `
          <div class="empty-state" style="grid-column:1/-1">
            <div class="empty-icon"><i class="fas fa-fingerprint"></i></div>
            <div class="empty-title">لا توجد أجهزة مضافة</div>
            <p class="empty-desc">أضف جهاز البصمة الأول لبدء المزامنة</p>
            <button class="btn btn-primary" onclick="DevicesModule.openAdd()"><i class="fas fa-plus"></i> إضافة جهاز</button>
          </div>
        `}
      </div>
    `;
  },

  _card(d) {
    const meta = this._statusMeta(d.status);
    return `
      <div class="card stagger-item">
        <div class="card-body">
          <div style="display:flex;align-items:flex-start;gap:12px;margin-bottom:14px">
            <div style="width:48px;height:48px;border-radius:14px;background:#6366f118;color:#6366f1;display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0">
              <i class="fas fa-fingerprint"></i>
            </div>
            <div style="flex:1;min-width:0">
              <div style="font-size:14px;font-weight:700;color:var(--text-primary);margin-bottom:3px">${d.name}</div>
              <div style="font-size:12px;color:var(--text-muted)" dir="ltr">${d.ipAddress || '—'}:${d.port || 4370}</div>
            </div>
            <span class="badge ${meta.badge} badge-dot">${meta.label}</span>
          </div>

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:12px;color:var(--text-muted);margin-bottom:14px">
            <div><i class="fas fa-location-dot"></i> ${d.location || '—'}</div>
            <div><i class="fas fa-building"></i> ${d.branch || '—'}</div>
            <div><i class="fas fa-clock"></i> ${d.lastSeen ? new Date(d.lastSeen).toLocaleString('ar') : 'لم يتصل بعد'}</div>
            <div><i class="fas fa-gauge-high"></i> ${d.responseTimeMs != null ? d.responseTimeMs + ' ms' : '—'}</div>
          </div>

          ${d.lastError ? `<div style="font-size:11px;color:var(--danger);background:var(--danger-bg,rgba(239,68,68,.08));padding:6px 10px;border-radius:8px;margin-bottom:12px"><i class="fas fa-triangle-exclamation"></i> ${d.lastError}</div>` : ''}

          <div style="display:flex;gap:6px;flex-wrap:wrap">
            <button class="btn btn-primary btn-sm" onclick="DevicesModule.sendCommand('${d.id}','sync')"><i class="fas fa-rotate"></i> مزامنة الآن</button>
            <button class="btn btn-secondary btn-sm" onclick="DevicesModule.sendCommand('${d.id}','test')"><i class="fas fa-plug"></i> اختبار</button>
            <button class="btn btn-secondary btn-sm" onclick="DevicesModule.sendCommand('${d.id}','restart')"><i class="fas fa-power-off"></i> إعادة تشغيل</button>
            <button class="btn-icon btn" onclick="DevicesModule.editDevice('${d.id}')"><i class="fas fa-pencil"></i></button>
            <button class="btn-icon btn" style="color:var(--danger)" onclick="DevicesModule.deleteDevice('${d.id}')"><i class="fas fa-trash"></i></button>
          </div>
        </div>
      </div>
    `;
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
    DB.devices.push({
      id: DB.nextId('dev'),
      name: data.name, ipAddress: data.ipAddress, port: Number(data.port) || 4370,
      location: data.location || '', branch: data.branch || '',
      serialNumber: data.serialNumber || '', status: 'unknown',
      lastSeen: null, lastSyncAt: null, lastError: null, model: 'ZKTeco',
    });
    DB.save();
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
