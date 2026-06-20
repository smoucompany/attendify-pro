/* =========================================================
   ATTENDIFY PRO — WhatsApp Module (wa.me — FREE, No API)
   يفتح واتساب مع الرسالة جاهزة — لا يحتاج API ولا اشتراك
   ========================================================= */

const WhatsApp = {

  // ─── CONFIG ──────────────────────────────────────────────
  config: {
    enabled: true,   // always enabled — no API key needed
  },

  // ─── MESSAGE TEMPLATES ───────────────────────────────────
  templates: {
    absence: {
      label: 'غياب',
      icon:  'fas fa-user-slash',
      color: '#ef4444',
      text:  'عزيزي/عزيزتي {name}،\nتم رصد غيابك عن العمل بتاريخ {date}.\nيُرجى التواصل مع الإدارة لتوضيح السبب.\n\nإدارة الموارد البشرية — {company}',
    },
    late: {
      label: 'تأخر',
      icon:  'fas fa-clock',
      color: '#f59e0b',
      text:  'عزيزي/عزيزتي {name}،\nتم رصد تأخرك في الحضور بتاريخ {date} بمقدار {minutes} دقيقة.\nيُرجى الالتزام بمواعيد الدوام الرسمية.\n\nإدارة الموارد البشرية — {company}',
    },
    warning: {
      label: 'إنذار',
      icon:  'fas fa-triangle-exclamation',
      color: '#ef4444',
      text:  'عزيزي/عزيزتي {name}،\nنودّ إشعارك بصدور إنذار رسمي بحقك بتاريخ {date}.\nيُرجى مراجعة الإدارة في أقرب وقت.\n\nإدارة الموارد البشرية — {company}',
    },
    leaveApproved: {
      label: 'موافقة إجازة',
      icon:  'fas fa-calendar-check',
      color: '#10b981',
      text:  'عزيزي/عزيزتي {name}،\nتمت الموافقة على طلب إجازتك من {from} إلى {to} ({days} أيام).\nنتمنى لك إجازة سعيدة.\n\nإدارة الموارد البشرية — {company}',
    },
    leaveRejected: {
      label: 'رفض إجازة',
      icon:  'fas fa-calendar-xmark',
      color: '#ef4444',
      text:  'عزيزي/عزيزتي {name}،\nنأسف لإبلاغك بأنه تم رفض طلب إجازتك من {from} إلى {to}.\nللاستفسار يُرجى التواصل مع الإدارة.\n\nإدارة الموارد البشرية — {company}',
    },
    requestApproved: {
      label: 'موافقة طلب',
      icon:  'fas fa-circle-check',
      color: '#10b981',
      text:  'عزيزي/عزيزتي {name}،\nتمت الموافقة على طلبك المقدّم بتاريخ {date}.\n\nإدارة الموارد البشرية — {company}',
    },
    requestRejected: {
      label: 'رفض طلب',
      icon:  'fas fa-circle-xmark',
      color: '#ef4444',
      text:  'عزيزي/عزيزتي {name}،\nنأسف لإبلاغك بأنه تم رفض طلبك المقدّم بتاريخ {date}.\nللاستفسار يُرجى التواصل مع الإدارة.\n\nإدارة الموارد البشرية — {company}',
    },
    salaryReady: {
      label: 'راتب جاهز',
      icon:  'fas fa-money-bill-wave',
      color: '#6366f1',
      text:  'عزيزي/عزيزتي {name}،\nيسعدنا إبلاغك بأن راتب شهر {date} بمبلغ {amount} قد تم صرفه.\n\nإدارة الموارد البشرية — {company}',
    },
  },

  // ─── INIT ─────────────────────────────────────────────────
  init() {
    const saved = localStorage.getItem('wa-templates');
    if (saved) {
      try { Object.assign(this.templates, JSON.parse(saved)); } catch(e) {}
    }
  },

  // ─── FORMAT PHONE ─────────────────────────────────────────
  formatPhone(phone) {
    if (!phone) return null;
    let p = phone.replace(/\D/g, '');
    if (p.startsWith('01') && p.length === 11) return '2' + p;       // مصر
    if (p.startsWith('05') && p.length === 10) return '966' + p.slice(1); // السعودية
    if (p.startsWith('05') && p.length === 9)  return '971' + p.slice(1); // الإمارات
    if (p.startsWith('00')) return p.slice(2);
    return p;
  },

  // ─── FILL TEMPLATE ────────────────────────────────────────
  fill(text, data) {
    return text.replace(/\{(\w+)\}/g, (_, k) => data[k] !== undefined ? data[k] : '');
  },

  // ─── BUILD wa.me URL ──────────────────────────────────────
  buildUrl(phone, message) {
    const p = this.formatPhone(phone);
    if (!p) return null;
    return `https://wa.me/${p}?text=${encodeURIComponent(message)}`;
  },

  // ─── OPEN SINGLE wa.me LINK ───────────────────────────────
  open(phone, message) {
    const url = this.buildUrl(phone, message);
    if (!url) {
      App.toast('رقم الهاتف غير صالح أو غير موجود', 'error');
      return false;
    }
    window.open(url, '_blank', 'noopener,noreferrer');
    return true;
  },

  // ─── TEMPLATE DATA HELPER ─────────────────────────────────
  _data(emp, extra = {}) {
    return {
      name:    emp.name,
      date:    new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' }),
      company: DB.company.name || 'الشركة',
      ...extra,
    };
  },

  // ─── NOTIFICATION SHORTCUTS ───────────────────────────────
  notifyAbsence(emp) {
    const msg = this.fill(this.templates.absence.text, this._data(emp));
    return this.open(emp.phone, msg);
  },

  notifyLate(emp, att) {
    const msg = this.fill(this.templates.late.text, this._data(emp, { minutes: att?.lateMin || '?' }));
    return this.open(emp.phone, msg);
  },

  notifyWarning(emp) {
    const msg = this.fill(this.templates.warning.text, this._data(emp));
    return this.open(emp.phone, msg);
  },

  notifyLeaveApproved(emp, leave) {
    const msg = this.fill(this.templates.leaveApproved.text, this._data(emp, {
      from: App.formatDate(leave.from),
      to:   App.formatDate(leave.to),
      days: leave.days || '',
    }));
    return this.open(emp.phone, msg);
  },

  notifyLeaveRejected(emp, leave) {
    const msg = this.fill(this.templates.leaveRejected.text, this._data(emp, {
      from: App.formatDate(leave.from),
      to:   App.formatDate(leave.to),
    }));
    return this.open(emp.phone, msg);
  },

  notifyRequestApproved(emp, req) {
    const msg = this.fill(this.templates.requestApproved.text, this._data(emp, {
      date: App.formatDate(req.date),
    }));
    return this.open(emp.phone, msg);
  },

  notifyRequestRejected(emp, req) {
    const msg = this.fill(this.templates.requestRejected.text, this._data(emp, {
      date: App.formatDate(req.date),
    }));
    return this.open(emp.phone, msg);
  },

  notifySalary(emp, amount) {
    const msg = this.fill(this.templates.salaryReady.text, this._data(emp, { amount }));
    return this.open(emp.phone, msg);
  },

  // ─── OPEN COMPOSE MODAL (Individual) ─────────────────────
  openCompose(empId) {
    const emp = DB.getEmployee(empId);
    if (!emp) return;

    const tplOptions = Object.entries(this.templates).map(([k, v]) =>
      `<option value="${k}">${v.label}</option>`
    ).join('');

    App.openModal(`واتساب — ${emp.name}`, `
      <div style="display:flex;align-items:center;gap:10px;padding:12px;background:var(--bg-input);border-radius:12px;margin-bottom:16px">
        <div class="avatar ${emp.avatarColor}" style="width:38px;height:38px;font-size:14px">${emp.avatar}</div>
        <div>
          <div style="font-weight:700;font-size:13px">${emp.name}</div>
          <div style="font-size:12px;color:var(--text-muted)">${emp.phone || 'لا يوجد رقم'}</div>
        </div>
        ${emp.phone
          ? `<span class="badge badge-success badge-dot" style="margin-right:auto">رقم متاح</span>`
          : `<span class="badge badge-danger" style="margin-right:auto">⚠️ لا يوجد رقم</span>`
        }
      </div>

      ${!emp.phone ? `
        <div class="info-box info-box-warning" style="margin-bottom:14px">
          <i class="fas fa-triangle-exclamation"></i>
          <div>لم يُضف رقم هاتف لهذا الموظف — يُرجى تحديث ملف الموظف أولاً</div>
        </div>
      ` : ''}

      <div class="app-form-group">
        <label>قالب الرسالة</label>
        <select class="app-form-input app-form-select" id="wa-tpl-select" onchange="WhatsApp._previewTemplate(this.value,'${empId}')">
          <option value="">— اختر قالباً —</option>
          ${tplOptions}
          <option value="custom">✏️ رسالة مخصصة</option>
        </select>
      </div>

      <div class="app-form-group">
        <label>نص الرسالة</label>
        <textarea id="wa-msg-text" class="app-form-input" rows="6" style="resize:vertical;font-size:13px;line-height:1.7" placeholder="اكتب رسالتك هنا..."></textarea>
      </div>

      <div style="display:flex;align-items:center;gap:8px;padding:10px 14px;background:rgba(37,211,102,0.08);border:1.5px solid rgba(37,211,102,0.25);border-radius:10px;margin-bottom:16px;font-size:12px;color:var(--text-secondary)">
        <i class="fab fa-whatsapp" style="color:#25d366;font-size:18px;flex-shrink:0"></i>
        <span>سيُفتح واتساب مع الرسالة جاهزة — اضغط <strong>إرسال</strong> داخل واتساب لإتمام الإرسال. <strong>مجاناً تماماً.</strong></span>
      </div>

      <div style="display:flex;gap:10px;justify-content:flex-end">
        <button class="btn btn-secondary" onclick="App.closeModal()">إلغاء</button>
        <button class="btn" style="background:#25d366;color:white;border:none" onclick="WhatsApp._sendCompose('${empId}')" ${!emp.phone ? 'disabled style="opacity:.5;cursor:not-allowed"' : ''}>
          <i class="fab fa-whatsapp"></i> فتح واتساب
        </button>
      </div>
    `);
  },

  _previewTemplate(key, empId) {
    const ta = document.getElementById('wa-msg-text');
    if (!ta || !key || key === 'custom') { if (ta && key === 'custom') ta.value = ''; return; }
    const tpl = this.templates[key];
    if (!tpl) return;
    const emp = DB.getEmployee(empId);
    ta.value = this.fill(tpl.text, this._data(emp || { name: '—', phone: '' }));
  },

  _sendCompose(empId) {
    const emp = DB.getEmployee(empId);
    const msg = document.getElementById('wa-msg-text')?.value?.trim();
    if (!msg) { App.toast('اكتب الرسالة أولاً', 'warning'); return; }
    App.closeModal();
    const ok = this.open(emp.phone, msg);
    if (ok) {
      DB.logAudit(App.state.user?.id || 'admin', 'إرسال واتساب', 'التنبيهات', `فتح محادثة واتساب مع ${emp.name}`);
      App.toast(`✅ تم فتح واتساب — ${emp.name}`, 'success');
    }
  },

  // ─── BULK COMPOSE MODAL ───────────────────────────────────
  openBulkCompose(empIds, defaultType = '') {
    const emps = empIds.map(id => DB.getEmployee(id)).filter(Boolean);
    const withPhone    = emps.filter(e => e.phone);
    const withoutPhone = emps.filter(e => !e.phone);

    const tplOptions = Object.entries(this.templates).map(([k, v]) =>
      `<option value="${k}" ${k === defaultType ? 'selected' : ''}>${v.label}</option>`
    ).join('');

    App.openModal('إرسال جماعي — واتساب', `
      <div style="display:flex;gap:10px;margin-bottom:16px">
        <div style="flex:1;padding:12px;background:var(--success-bg);border-radius:10px;text-align:center">
          <div style="font-size:22px;font-weight:800;color:var(--success)">${withPhone.length}</div>
          <div style="font-size:12px;color:var(--text-muted)">لديهم رقم</div>
        </div>
        <div style="flex:1;padding:12px;background:var(--danger-bg);border-radius:10px;text-align:center">
          <div style="font-size:22px;font-weight:800;color:var(--danger)">${withoutPhone.length}</div>
          <div style="font-size:12px;color:var(--text-muted)">بدون رقم</div>
        </div>
        <div style="flex:1;padding:12px;background:var(--primary-bg);border-radius:10px;text-align:center">
          <div style="font-size:22px;font-weight:800;color:var(--primary)">${emps.length}</div>
          <div style="font-size:12px;color:var(--text-muted)">إجمالي</div>
        </div>
      </div>

      ${withoutPhone.length ? `
      <div class="info-box info-box-warning" style="margin-bottom:12px">
        <i class="fas fa-triangle-exclamation"></i>
        <div>${withoutPhone.length} موظف بدون رقم واتساب: ${withoutPhone.map(e => e.name).join('، ')}</div>
      </div>` : ''}

      <div class="app-form-group">
        <label>قالب الرسالة</label>
        <select class="app-form-input app-form-select" id="bulk-tpl-select" onchange="WhatsApp._previewBulkTemplate(this.value)">
          <option value="">— اختر قالباً —</option>
          ${tplOptions}
          <option value="custom">✏️ رسالة مخصصة</option>
        </select>
      </div>

      <div class="app-form-group">
        <label>نص الرسالة <span style="font-size:11px;color:var(--text-muted)">(سيُستبدل {name} باسم كل موظف تلقائياً)</span></label>
        <textarea id="bulk-msg-text" class="app-form-input" rows="5" style="resize:vertical;font-size:13px;line-height:1.7">${defaultType && this.templates[defaultType] ? this.templates[defaultType].text : ''}</textarea>
      </div>

      <div style="display:flex;align-items:flex-start;gap:8px;padding:10px 14px;background:rgba(37,211,102,0.08);border:1.5px solid rgba(37,211,102,0.25);border-radius:10px;margin-bottom:16px;font-size:12px;color:var(--text-secondary)">
        <i class="fab fa-whatsapp" style="color:#25d366;font-size:18px;flex-shrink:0;margin-top:1px"></i>
        <span>سيُفتح واتساب لكل موظف على حدة (${withPhone.length} نافذة). اضغط <strong>إرسال</strong> في كل نافذة. <strong>مجاناً تماماً — لا API ولا اشتراك.</strong></span>
      </div>

      <div style="display:flex;gap:10px;justify-content:flex-end">
        <button class="btn btn-secondary" onclick="App.closeModal()">إلغاء</button>
        <button class="btn" style="background:#25d366;color:white;border:none" onclick="WhatsApp._executeBulk(${JSON.stringify(empIds)})" ${!withPhone.length ? 'disabled' : ''}>
          <i class="fab fa-whatsapp"></i> فتح واتساب لـ ${withPhone.length} موظف
        </button>
      </div>
    `);
  },

  _previewBulkTemplate(key) {
    const ta = document.getElementById('bulk-msg-text');
    if (!ta || !key || key === 'custom') { if (ta && key === 'custom') ta.value = ''; return; }
    const tpl = this.templates[key];
    if (tpl) ta.value = tpl.text;
  },

  _executeBulk(empIds) {
    const msg = document.getElementById('bulk-msg-text')?.value?.trim();
    if (!msg) { App.toast('اكتب الرسالة أولاً', 'warning'); return; }
    App.closeModal();

    const emps = empIds.map(id => DB.getEmployee(id)).filter(e => e?.phone);
    if (!emps.length) { App.toast('لا يوجد موظفون لديهم رقم واتساب', 'error'); return; }

    let i = 0;
    const openNext = () => {
      if (i >= emps.length) {
        App.toast(`✅ تم فتح ${emps.length} محادثة واتساب`, 'success');
        return;
      }
      const emp = emps[i++];
      const filled = this.fill(msg, this._data(emp));
      this.open(emp.phone, filled);
      setTimeout(openNext, 1800); // تأخير لتجنب حجب المتصفح للنوافذ المنبثقة
    };

    App.toast(`جارٍ فتح ${emps.length} محادثة واتساب...`, 'info');
    openNext();
  },

  // ─── SETTINGS PAGE (تحديث شاشة الإعدادات) ───────────────
  saveTemplates() {
    const updated = {};
    Object.keys(this.templates).forEach(key => {
      const el = document.getElementById(`wa-tpl-${key}`);
      if (el) updated[key] = { ...this.templates[key], text: el.value };
    });
    Object.assign(this.templates, updated);
    localStorage.setItem('wa-templates', JSON.stringify(this.templates));
    App.toast('✅ تم حفظ القوالب', 'success');
  },
};

// Init on load
WhatsApp.init();
