/* =========================================================
   SETTINGS MODULE — Enterprise Full System Settings
   11 sections covering the entire platform
   ========================================================= */

const SettingsModule = {
  _section: 'company',

  _sections: [
    { key:'company',      icon:'fas fa-building',          label:'الشركة',            labelEn:'Company' },
    { key:'hours',        icon:'fas fa-clock',             label:'أوقات العمل',        labelEn:'Working Hours' },
    { key:'attendance',   icon:'fas fa-fingerprint',       label:'إعدادات الحضور',     labelEn:'Attendance' },
    { key:'leaves',       icon:'fas fa-calendar-minus',    label:'الإجازات',           labelEn:'Leaves' },
    { key:'payroll',      icon:'fas fa-money-bill-wave',   label:'الرواتب',            labelEn:'Payroll' },
    { key:'portal',       icon:'fas fa-user',              label:'بوابة الموظف',       labelEn:'Employee Portal' },
    { key:'notifications',icon:'fas fa-bell',              label:'الإشعارات',          labelEn:'Notifications' },
    { key:'integrations', icon:'fas fa-plug',              label:'التكاملات',          labelEn:'Integrations' },
    { key:'security',     icon:'fas fa-shield-halved',     label:'الأمان',             labelEn:'Security' },
    { key:'appearance',   icon:'fas fa-palette',           label:'المظهر',             labelEn:'Appearance' },
    { key:'backup',       icon:'fas fa-database',          label:'النسخ الاحتياطي',    labelEn:'Backup & Data' },
  ],

  render(container) {
    container.innerHTML = `
      <div class="page-header">
        <div class="page-header-text">
          <h1>${t('settings.title')}</h1>
          <p>${currentLang==='ar'?'إدارة شاملة لجميع إعدادات المنصة':'Complete platform configuration management'}</p>
        </div>
      </div>
      <div class="settings-grid">
        <!-- Sidebar Nav -->
        <div class="settings-nav" id="settings-nav">
          ${this._sections.map(s => `
            <div class="settings-nav-item ${this._section===s.key?'active':''}" data-key="${s.key}"
              onclick="SettingsModule.switchSection('${s.key}')">
              <i class="${s.icon}"></i>
              <span>${currentLang==='ar'?s.label:s.labelEn}</span>
            </div>
          `).join('')}
          <hr style="border:none;border-top:1px solid var(--border);margin:8px 0">
          <div class="settings-nav-item" style="color:var(--danger)" onclick="App.logout()">
            <i class="fas fa-right-from-bracket"></i>
            <span>${t('header.logout')}</span>
          </div>
        </div>
        <!-- Content -->
        <div id="settings-content"></div>
      </div>
    `;
    this._renderSection();
  },

  switchSection(key) {
    this._section = key;
    document.querySelectorAll('.settings-nav-item[data-key]').forEach(el => {
      el.classList.toggle('active', el.dataset.key === key);
    });
    this._renderSection();
  },

  _renderSection() {
    const el = document.getElementById('settings-content');
    if (!el) return;
    const map = {
      company:       () => this._company(),
      hours:         () => this._hours(),
      attendance:    () => this._attendance(),
      leaves:        () => this._leavesSettings(),
      payroll:       () => this._payrollSettings(),
      portal:        () => this._portal(),
      notifications: () => this._notifications(),
      integrations:  () => this._integrations(),
      security:      () => this._security(),
      appearance:    () => this._appearance(),
      backup:        () => this._backup(),
    };
    el.innerHTML = map[this._section]?.() || '';
  },

  /* ── HELPERS ── */
  _group(title, desc, content, action) {
    return `
      <div class="settings-group">
        <div class="settings-group-header" style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px">
          <div>
            <h4 style="font-size:15px;font-weight:800;color:var(--text-primary);margin-bottom:2px">${title}</h4>
            ${desc ? `<p style="font-size:12px;color:var(--text-muted)">${desc}</p>` : ''}
          </div>
          ${action || ''}
        </div>
        ${content}
      </div>`;
  },
  _row(label, desc, control) {
    return `
      <div class="settings-item">
        <div class="settings-item-info">
          <div class="settings-item-label">${label}</div>
          ${desc ? `<div class="settings-item-desc">${desc}</div>` : ''}
        </div>
        <div>${control}</div>
      </div>`;
  },
  _toggle(id, on, onchange) {
    return `<div class="toggle-switch ${on?'on':''}" id="${id}" onclick="${onchange||`this.classList.toggle('on');SettingsModule._changed()`}"></div>`;
  },
  _input(id, val, type='text', extra='') {
    return `<input class="app-form-input" type="${type}" id="${id}" value="${val}" ${extra} style="min-width:200px">`;
  },
  _select(id, opts, val) {
    return `<select class="app-form-input app-form-select" id="${id}" style="min-width:200px">${opts.map(o=>`<option value="${o.v}" ${o.v==val?'selected':''}>${o.l}</option>`).join('')}</select>`;
  },
  _changed() { /* track dirty state */ },
  _saveBtn(fn) {
    return `<div style="margin-top:20px;padding-top:16px;border-top:1px solid var(--border);display:flex;justify-content:flex-end;gap:10px">
      <button class="btn btn-secondary" onclick="SettingsModule._renderSection()">${t('common.cancel')}</button>
      <button class="btn btn-primary" onclick="${fn}"><i class="fas fa-save"></i> ${t('common.save')}</button>
    </div>`;
  },

  /* ══════════════════════════════════════════
     1. COMPANY
  ══════════════════════════════════════════ */
  _company() {
    const co = DB.company;
    return `
      <!-- Logo & Identity -->
      ${this._group('الهوية والشعار','معلومات الشركة الأساسية والشعار',`
        <div class="settings-item" style="align-items:flex-start;gap:20px;flex-wrap:wrap">
          <div style="display:flex;flex-direction:column;align-items:center;gap:10px">
            <div id="logo-preview" style="width:90px;height:90px;border-radius:20px;background:linear-gradient(135deg,var(--primary),#8b5cf6);display:flex;align-items:center;justify-content:center;font-size:28px;font-weight:800;color:white;overflow:hidden;cursor:pointer" onclick="document.getElementById('logo-file-input').click()" title="اضغط لتغيير الشعار">
              ${co.logo && co.logo.startsWith('data:')
                ? `<img src="${co.logo}" style="width:100%;height:100%;object-fit:cover;border-radius:20px">`
                : `<i class="fas fa-building" style="font-size:32px;opacity:.8"></i>`}
            </div>
            <input type="file" id="logo-file-input" accept="image/*" style="display:none" onchange="SettingsModule.uploadLogo(this)">
            <div style="display:flex;gap:6px">
              <button class="btn btn-secondary btn-sm" onclick="document.getElementById('logo-file-input').click()">
                <i class="fas fa-upload"></i> رفع شعار
              </button>
              ${co.logo ? `<button class="btn btn-danger btn-sm" onclick="SettingsModule.removeLogo()"><i class="fas fa-trash"></i></button>` : ''}
            </div>
            <div style="font-size:10px;color:var(--text-muted);text-align:center">PNG, JPG, SVG<br>حجم أقصى 2MB</div>
          </div>
          <div style="flex:1;min-width:260px;display:flex;flex-direction:column;gap:12px">
            <div class="app-form-row">
              <div class="app-form-group">
                <label>الاسم بالعربية</label>
                <input class="app-form-input" id="co-name" value="${co.name}">
              </div>
              <div class="app-form-group">
                <label>الاسم بالإنجليزية</label>
                <input class="app-form-input" id="co-name-en" value="${co.nameEn}" dir="ltr">
              </div>
            </div>
            <div class="app-form-row">
              <div class="app-form-group">
                <label>البريد الإلكتروني</label>
                <input class="app-form-input" id="co-email" type="email" value="${co.email}" dir="ltr">
              </div>
              <div class="app-form-group">
                <label>رقم الهاتف</label>
                <input class="app-form-input" id="co-phone" value="${co.phone}" dir="ltr">
              </div>
            </div>
            <div class="app-form-row">
              <div class="app-form-group">
                <label>الموقع الإلكتروني</label>
                <input class="app-form-input" id="co-web" value="${co.website||''}" dir="ltr">
              </div>
              <div class="app-form-group">
                <label>العنوان</label>
                <input class="app-form-input" id="co-addr" value="${co.address||''}">
              </div>
            </div>
          </div>
        </div>
      `)}

      <!-- Regional -->
      ${this._group('الإعدادات الإقليمية','المنطقة الزمنية والعملة واللغة',`
        <div class="app-form-row">
          <div class="app-form-group">
            <label>المنطقة الزمنية</label>
            ${this._select('co-tz',[
              {v:'Asia/Riyadh',l:'Asia/Riyadh — GMT+3'},
              {v:'Asia/Dubai',l:'Asia/Dubai — GMT+4'},
              {v:'Africa/Cairo',l:'Africa/Cairo — GMT+2'},
              {v:'Asia/Kuwait',l:'Asia/Kuwait — GMT+3'},
              {v:'UTC',l:'UTC — GMT+0'},
            ], co.timezone)}
          </div>
          <div class="app-form-group">
            <label>العملة</label>
            ${this._select('co-curr',[
              {v:'SAR',l:'SAR — ريال سعودي ﷼'},
              {v:'AED',l:'AED — درهم إماراتي'},
              {v:'EGP',l:'EGP — جنيه مصري'},
              {v:'KWD',l:'KWD — دينار كويتي'},
              {v:'USD',l:'USD — دولار أمريكي $'},
            ], co.currency)}
          </div>
          <div class="app-form-group">
            <label>تنسيق التاريخ</label>
            ${this._select('co-datefmt',[
              {v:'DD/MM/YYYY',l:'DD/MM/YYYY'},
              {v:'MM/DD/YYYY',l:'MM/DD/YYYY'},
              {v:'YYYY-MM-DD',l:'YYYY-MM-DD'},
            ],'DD/MM/YYYY')}
          </div>
        </div>
      `)}

      <!-- Branches -->
      ${this._group('الفروع والمواقع',`${co.branches.length} فروع مسجلة`,`
        ${co.branches.map((b,i)=>`
          <div class="settings-item">
            <div class="settings-item-info">
              <div style="display:flex;align-items:center;gap:8px">
                <div style="width:32px;height:32px;border-radius:8px;background:var(--primary-bg);color:var(--primary);display:flex;align-items:center;justify-content:center;font-size:14px">
                  <i class="fas fa-location-dot"></i>
                </div>
                <div>
                  <div class="settings-item-label">${b.name}</div>
                  <div class="settings-item-desc">${b.city}</div>
                </div>
              </div>
            </div>
            <div style="display:flex;gap:6px">
              <button class="btn btn-secondary btn-sm" onclick="SettingsModule.editBranch('${b.id}')"><i class="fas fa-pencil"></i></button>
              ${i>0?`<button class="btn btn-danger btn-sm" onclick="SettingsModule.deleteBranch('${b.id}')"><i class="fas fa-trash"></i></button>`:''}
            </div>
          </div>
        `).join('')}
        <div class="settings-item" style="border:none">
          <button class="btn btn-outline-primary btn-sm" onclick="SettingsModule.addBranch()">
            <i class="fas fa-plus"></i> إضافة فرع جديد
          </button>
        </div>
      `,`<span class="badge badge-primary">${co.branches.length}</span>`)}

      ${this._saveBtn('SettingsModule.saveCompany()')}
    `;
  },

  saveCompany() {
    const fields = {name:'co-name',nameEn:'co-name-en',email:'co-email',phone:'co-phone',website:'co-web',address:'co-addr',timezone:'co-tz',currency:'co-curr',dateFormat:'co-datefmt'};
    Object.entries(fields).forEach(([k,id])=>{
      const el = document.getElementById(id);
      if (el) DB.company[k] = el.value;
    });
    DB.saveCompany();
    SettingsModule._updateSidebarLogo();
    App.toast('تم حفظ بيانات الشركة بنجاح','success');
  },

  uploadLogo(input) {
    const file = input.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { App.toast('حجم الشعار يجب أن يكون أقل من 2MB', 'warning'); return; }
    const reader = new FileReader();
    reader.onload = e => {
      DB.company.logo = e.target.result; // base64
      DB.saveCompany();
      // Update preview immediately
      const preview = document.getElementById('logo-preview');
      if (preview) preview.innerHTML = `<img src="${DB.company.logo}" style="width:100%;height:100%;object-fit:cover;border-radius:20px">`;
      this._updateSidebarLogo();
      App.toast('تم رفع الشعار بنجاح ✓', 'success');
      // Re-render to show the remove button
      this._renderSection();
    };
    reader.readAsDataURL(file);
  },

  removeLogo() {
    DB.company.logo = '';
    DB.saveCompany();
    this._updateSidebarLogo();
    App.toast('تم حذف الشعار', 'info');
    this._renderSection();
  },

  deleteBranch(id) {
    if (!App.confirm) { if (!confirm('هل تريد حذف هذا الفرع؟')) return; }
    else if (!confirm('هل تريد حذف هذا الفرع؟')) return;
    DB.company.branches = DB.company.branches.filter(b => b.id !== id);
    DB.saveCompany();
    App.toast('تم حذف الفرع', 'success');
    this._renderSection();
  },

  _updateSidebarLogo() {
    const iconEl = document.querySelector('.logo-icon-sm');
    if (!iconEl) return;
    if (DB.company.logo && DB.company.logo.startsWith('data:')) {
      iconEl.innerHTML = `<img src="${DB.company.logo}" style="width:100%;height:100%;object-fit:cover;border-radius:10px">`;
    } else {
      iconEl.innerHTML = `<i class="fas fa-fingerprint"></i>`;
    }
    // Update company name in sidebar if shown
    const nameEl = document.querySelector('.logo-name');
    if (nameEl && DB.company.nameEn) nameEl.textContent = DB.company.nameEn;
  },

  addBranch() {
    App.openModal('إضافة فرع جديد',`
      <form onsubmit="SettingsModule.saveBranch(event)">
        <div class="app-form-group"><label>اسم الفرع</label><input class="app-form-input" name="name" required></div>
        <div class="app-form-group"><label>المدينة</label><input class="app-form-input" name="city" required></div>
        <div class="modal-footer" style="padding:0;margin-top:16px">
          <button type="button" class="btn btn-secondary" onclick="App.closeModal()">${t('common.cancel')}</button>
          <button type="submit" class="btn btn-primary"><i class="fas fa-save"></i> ${t('common.save')}</button>
        </div>
      </form>
    `,{size:'sm'});
  },
  saveBranch(e) {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(e.target));
    DB.company.branches.push({id:`b${Date.now()}`,name:d.name,city:d.city});
    DB.saveCompany();
    App.closeModal();
    App.toast('تم إضافة الفرع','success');
    this._renderSection();
  },
  editBranch(id) {
    const b = DB.company.branches.find(x=>x.id===id);
    App.openModal('تعديل الفرع',`
      <form onsubmit="SettingsModule.updateBranch(event,'${id}')">
        <div class="app-form-group"><label>اسم الفرع</label><input class="app-form-input" name="name" value="${b.name}" required></div>
        <div class="app-form-group"><label>المدينة</label><input class="app-form-input" name="city" value="${b.city}" required></div>
        <div class="modal-footer" style="padding:0;margin-top:16px">
          <button type="button" class="btn btn-secondary" onclick="App.closeModal()">${t('common.cancel')}</button>
          <button type="submit" class="btn btn-primary"><i class="fas fa-save"></i> ${t('common.save')}</button>
        </div>
      </form>
    `,{size:'sm'});
  },
  updateBranch(e,id) {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(e.target));
    const b = DB.company.branches.find(x=>x.id===id);
    if(b){b.name=d.name;b.city=d.city;}
    DB.saveCompany();
    App.closeModal();
    App.toast('تم تحديث الفرع','success');
    this._renderSection();
  },

  /* ══════════════════════════════════════════
     2. WORKING HOURS
  ══════════════════════════════════════════ */
  _hours() {
    const co = DB.company;
    const days = [
      {k:'sat',l:'السبت'},{k:'sun',l:'الأحد'},{k:'mon',l:'الإثنين'},
      {k:'tue',l:'الثلاثاء'},{k:'wed',l:'الأربعاء'},{k:'thu',l:'الخميس'},{k:'fri',l:'الجمعة'},
    ];
    const periods = co.workPeriods || [];
    const totalMins = periods.reduce((sum, p) => sum + this._periodMins(p), 0);
    const totalHrs = (totalMins/60).toFixed(1);

    return `
      <!-- Work Periods -->
      ${this._group(
        'فترات العمل اليومية',
        `إجمالي ساعات العمل: <strong style="color:var(--primary)">${totalHrs} ساعة</strong> يومياً — بدون استراحة · بدون أوفر تايم`,
        `
        <div id="periods-list">
          ${periods.map((p, i) => this._periodRow(p, i)).join('')}
        </div>
        <button class="btn btn-outline-primary btn-sm" style="margin-top:8px" onclick="SettingsModule.addPeriod()">
          <i class="fas fa-plus"></i> إضافة فترة عمل
        </button>
        <div style="margin-top:14px;padding:12px 14px;background:var(--primary-bg);border-radius:10px;font-size:12px;color:var(--primary);display:flex;align-items:center;gap:8px">
          <i class="fas fa-circle-info"></i>
          <span>كل فترة تُحسب من وقت الحضور إلى وقت الانصراف مباشرةً — لا استراحة ولا وقت إضافي</span>
        </div>
        `,
        `<span class="badge badge-primary">${periods.length} ${periods.length===1?'فترة':'فترات'}</span>`
      )}

      <!-- Work Days -->
      ${this._group('أيام العمل الرسمية','حدد أيام الدوام الأسبوعي',`
        <div style="display:flex;gap:8px;flex-wrap:wrap;padding:8px 0">
          ${days.map(d=>`
            <button id="day-${d.k}" class="btn btn-sm ${co.workDays.includes(d.k)?'btn-primary':'btn-secondary'}"
              onclick="this.classList.toggle('btn-primary');this.classList.toggle('btn-secondary');SettingsModule._refreshTotal()">
              ${d.l}
            </button>
          `).join('')}
        </div>
      `)}

      <!-- Late Threshold only — no overtime, no break -->
      ${this._group('إعدادات التأخر','الحد الزمني المسموح قبل احتساب الموظف متأخراً',`
        <div class="app-form-row">
          <div class="app-form-group">
            <label>مهلة التأخر (دقيقة)</label>
            <input class="app-form-input" type="number" id="late-threshold" value="${co.lateThreshold}" min="0" max="60" style="max-width:140px">
            <span style="font-size:11px;color:var(--text-muted);margin-top:4px;display:block">الدقائق المسموح بها بعد بداية الفترة</span>
          </div>
          <div class="app-form-group">
            ${this._row('خصم التأخر من الراتب','احتساب التأخر ضمن الخصومات الشهرية',this._toggle('deduct-late',true))}
          </div>
        </div>

        <!-- Disabled features info box -->
        <div style="margin-top:4px;border-radius:12px;border:1px solid var(--border);overflow:hidden">
          <div style="padding:10px 14px;background:var(--bg);border-bottom:1px solid var(--border);font-size:12px;font-weight:700;color:var(--text-muted)">
            الميزات المعطّلة لهذا النظام
          </div>
          ${[
            {icon:'fa-mug-hot',    l:'استراحة منتصف اليوم',  d:'لا توجد استراحة مجدولة في يوم العمل'},
            {icon:'fa-clock',      l:'الوقت الإضافي (أوفر تايم)', d:'لا يُحسب أي وقت إضافي بعد انتهاء الفترة'},
            {icon:'fa-money-bill', l:'بدل الوقت الإضافي',    d:'لا يُضاف أي بدل لأوفر تايم على الراتب'},
          ].map(f=>`
            <div style="display:flex;align-items:center;gap:12px;padding:11px 14px;border-bottom:1px solid var(--border)">
              <div style="width:32px;height:32px;border-radius:8px;background:var(--danger-bg,rgba(239,68,68,0.08));color:var(--danger);display:flex;align-items:center;justify-content:center;font-size:13px;flex-shrink:0">
                <i class="fas ${f.icon}"></i>
              </div>
              <div style="flex:1">
                <div style="font-size:13px;font-weight:600;color:var(--text-secondary)">${f.l}</div>
                <div style="font-size:11px;color:var(--text-muted)">${f.d}</div>
              </div>
              <span style="font-size:11px;font-weight:700;color:var(--danger);background:var(--danger-bg,rgba(239,68,68,0.08));padding:3px 10px;border-radius:6px">معطّل</span>
            </div>
          `).join('')}
        </div>
      `)}

      <!-- Holidays -->
      ${this._group('العطلات الرسمية','إدارة أيام العطل الرسمية',`
        <div id="holidays-list">
          ${(DB.company.holidays||[]).map(h=>`
            <div class="settings-item" id="holiday-${h.id}">
              <div class="settings-item-info">
                <div class="settings-item-label">${h.name}</div>
                <div class="settings-item-desc">${h.date} — ${h.days} ${h.days===1?'يوم':'أيام'}</div>
              </div>
              <button class="btn btn-danger btn-sm" onclick="SettingsModule.removeHoliday('${h.id}')">
                <i class="fas fa-trash"></i>
              </button>
            </div>
          `).join('')}
        </div>
        <div class="settings-item" style="border:none">
          <button class="btn btn-outline-primary btn-sm" onclick="SettingsModule.addHoliday()">
            <i class="fas fa-plus"></i> إضافة عطلة رسمية
          </button>
        </div>
      `)}

      ${this._saveBtn('SettingsModule.saveHours()')}
    `;
  },

  _periodRow(p, i) {
    const isOvernight = p.end && p.start && p.end <= p.start;
    const borderColor = isOvernight ? 'rgba(139,92,246,0.4)' : 'var(--border)';
    return `
      <div class="settings-item period-row" id="period-row-${p.id}"
        style="align-items:center;gap:10px;background:var(--bg);border-radius:12px;padding:12px 14px;margin-bottom:8px;border:1.5px solid ${borderColor}">
        <div style="width:36px;height:36px;border-radius:10px;background:${isOvernight?'rgba(139,92,246,0.12)':'var(--primary-bg)'};color:${isOvernight?'#7c3aed':'var(--primary)'};display:flex;align-items:center;justify-content:center;font-weight:800;font-size:13px;flex-shrink:0">
          ${isOvernight ? '🌙' : i+1}
        </div>
        <div class="app-form-group" style="margin:0;flex:1.5">
          <label style="font-size:11px;margin-bottom:4px">اسم الفترة</label>
          <input class="app-form-input" style="padding:7px 10px" value="${p.label}"
            onchange="DB.company.workPeriods[${i}].label=this.value">
        </div>
        <div class="app-form-group" style="margin:0;flex:1">
          <label style="font-size:11px;margin-bottom:4px">من</label>
          <input class="app-form-input" type="time" style="padding:7px 10px" value="${p.start}"
            onchange="DB.company.workPeriods[${i}].start=this.value;SettingsModule._refreshTotal()">
        </div>
        <div class="app-form-group" style="margin:0;flex:1">
          <label style="font-size:11px;margin-bottom:4px">إلى</label>
          <input class="app-form-input" type="time" style="padding:7px 10px" value="${p.end}"
            onchange="DB.company.workPeriods[${i}].end=this.value;SettingsModule._refreshTotal()">
        </div>
        <div style="flex-shrink:0;padding-top:18px">
          <span style="font-size:12px;font-weight:700;color:${isOvernight?'#7c3aed':'var(--success)'};white-space:nowrap" id="dur-${p.id}">
            ${this._calcDur(p.start, p.end)}
          </span>
        </div>
        ${i > 0 ? `
        <button class="btn btn-danger btn-sm" style="flex-shrink:0;background:none;color:var(--danger);width:28px;height:28px;margin-top:16px"
          onclick="SettingsModule.removePeriod('${p.id}')">
          <i class="fas fa-trash"></i>
        </button>` : '<div style="width:28px;margin-top:16px"></div>'}
      </div>
    `;
  },

  _calcDur(start, end) {
    const [sh,sm] = start.split(':').map(Number);
    const [eh,em] = end.split(':').map(Number);
    let diff = (eh*60+em) - (sh*60+sm);
    if (diff <= 0) diff += 24*60; // وردية ليلية تتعدى منتصف الليل
    const h = Math.floor(diff/60), m = diff%60;
    const overnight = end <= start ? ' <span style="font-size:10px;color:#8b5cf6;font-weight:700">🌙ليلي</span>' : '';
    return (m ? `${h}س ${m}د` : `${h} ساعة`) + overnight;
  },

  _periodMins(p) {
    const [sh,sm] = p.start.split(':').map(Number);
    const [eh,em] = p.end.split(':').map(Number);
    let diff = (eh*60+em) - (sh*60+sm);
    if (diff <= 0) diff += 24*60;
    return diff;
  },

  _refreshTotal() {
    const periods = DB.company.workPeriods || [];
    const totalMins = periods.reduce((sum, p) => sum + this._periodMins(p), 0);
    const totalHrs = (totalMins/60).toFixed(1);
    const header = document.querySelector('.settings-group-header p strong');
    if (header) header.textContent = `${totalHrs} ساعة`;
    // Refresh all duration displays
    periods.forEach((p, i) => {
      const el = document.getElementById(`dur-${p.id}`);
      if (el) el.innerHTML = this._calcDur(p.start, p.end);
    });
  },

  addPeriod() {
    const periods = DB.company.workPeriods;
    const newP = { id: `wp${Date.now()}`, label: `فترة ${periods.length+1}`, start: '08:00', end: '14:00' };
    periods.push(newP);
    DB.saveCompany();
    const list = document.getElementById('periods-list');
    if (list) {
      const div = document.createElement('div');
      div.innerHTML = this._periodRow(newP, periods.length - 1);
      list.appendChild(div.firstElementChild);
    }
    this._refreshTotal();
  },

  removePeriod(id) {
    DB.company.workPeriods = DB.company.workPeriods.filter(p => p.id !== id);
    DB.saveCompany();
    document.getElementById(`period-row-${id}`)?.remove();
    this._refreshTotal();
    this._renderSection();
  },

  saveHours() {
    const l = document.getElementById('late-threshold');
    if (l) DB.company.lateThreshold = parseInt(l.value) || 15;

    // Save selected work days
    const allDays = ['sat','sun','mon','tue','wed','thu','fri'];
    const workDays = allDays.filter(k => document.getElementById(`day-${k}`)?.classList.contains('btn-primary'));
    if (workDays.length) {
      DB.company.workDays = workDays;
      DB.company.weekend  = allDays.filter(k => !workDays.includes(k));
    }

    // Save period start/end
    const periods = DB.company.workPeriods;
    if (periods.length) {
      DB.company.workStart = periods[0].start;
      DB.company.workEnd   = periods[periods.length-1].end;
    }
    DB.saveCompany();
    App.toast('تم حفظ أوقات العمل بنجاح', 'success');
  },

  addHoliday() {
    App.openModal('إضافة عطلة رسمية',`
      <form onsubmit="SettingsModule.saveHoliday(event)">
        <div class="app-form-group"><label>اسم العطلة</label><input class="app-form-input" name="name" required></div>
        <div class="app-form-row">
          <div class="app-form-group"><label>تاريخ البداية</label><input class="app-form-input" type="date" name="date" required></div>
          <div class="app-form-group"><label>عدد الأيام</label><input class="app-form-input" type="number" name="days" value="1" min="1"></div>
        </div>
        <div class="modal-footer" style="padding:0;margin-top:16px">
          <button type="button" class="btn btn-secondary" onclick="App.closeModal()">${t('common.cancel')}</button>
          <button type="submit" class="btn btn-primary"><i class="fas fa-save"></i> ${t('common.save')}</button>
        </div>
      </form>
    `,{size:'sm'});
  },
  saveHoliday(e) {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target));
    if (!DB.company.holidays) DB.company.holidays = [];
    const holiday = {
      id:   `h-${Date.now()}`,
      name: data.name,
      date: data.date,
      days: parseInt(data.days) || 1,
    };
    DB.company.holidays.push(holiday);
    DB.saveCompany();
    DB.logAudit('admin', 'إضافة عطلة رسمية', 'Settings', holiday.name);
    App.closeModal();
    App.toast(`تم إضافة عطلة: ${holiday.name}`, 'success');
    this._renderSection();
  },

  removeHoliday(id) {
    DB.company.holidays = (DB.company.holidays||[]).filter(h => h.id !== id);
    DB.saveCompany();
    document.getElementById(`holiday-${id}`)?.remove();
    App.toast('تم حذف العطلة', 'success');
  },

  _getLeaveTypes() {
    if (!DB.company.leaveTypes) {
      DB.company.leaveTypes = [
        {key:'annual',    l:'إجازة سنوية',     days:21, paid:true,  carry:true,  color:'#6366f1'},
        {key:'sick',      l:'إجازة مرضية',     days:10, paid:true,  carry:false, color:'#10b981'},
        {key:'emergency', l:'إجازة طارئة',     days:3,  paid:true,  carry:false, color:'#f59e0b'},
        {key:'maternity', l:'إجازة أمومة',     days:70, paid:true,  carry:false, color:'#ec4899'},
        {key:'paternity', l:'إجازة أبوة',      days:3,  paid:true,  carry:false, color:'#06b6d4'},
        {key:'unpaid',    l:'إجازة بدون راتب', days:0,  paid:false, carry:false, color:'#94a3b8'},
      ];
    }
    return DB.company.leaveTypes;
  },

  saveLeaveTypes() {
    const types = this._getLeaveTypes();
    types.forEach(lt => {
      const daysEl = document.getElementById(`lt-days-${lt.key}`);
      const paidEl = document.getElementById(`lt-paid-${lt.key}`);
      const carryEl = document.getElementById(`lt-carry-${lt.key}`);
      if (daysEl)  lt.days  = parseInt(daysEl.value) || 0;
      if (paidEl)  lt.paid  = paidEl.classList.contains('on');
      if (carryEl) lt.carry = carryEl.classList.contains('on');
    });
    DB.saveCompany();
    App.toast('تم حفظ أنواع الإجازات ✓', 'success');
  },

  editLeaveType(key) {
    const lt = this._getLeaveTypes().find(t => t.key === key);
    if (!lt) return;
    App.openModal('تعديل نوع الإجازة', `
      <form onsubmit="SettingsModule._saveLeaveType(event,'${key}')">
        <div class="app-form-group"><label>اسم الإجازة</label><input class="app-form-input" name="l" value="${lt.l}" required></div>
        <div class="app-form-row">
          <div class="app-form-group"><label>الرصيد السنوي (يوم)</label><input class="app-form-input" type="number" name="days" value="${lt.days}" min="0"></div>
          <div class="app-form-group"><label>اللون</label><input class="app-form-input" type="color" name="color" value="${lt.color}"></div>
        </div>
        <div class="app-form-row">
          <div class="app-form-group" style="flex-direction:row;align-items:center;gap:10px">
            <label>براتب</label>
            <div class="toggle-switch ${lt.paid?'on':''}" id="edit-paid" onclick="this.classList.toggle('on')"></div>
          </div>
          <div class="app-form-group" style="flex-direction:row;align-items:center;gap:10px">
            <label>قابلة للترحيل</label>
            <div class="toggle-switch ${lt.carry?'on':''}" id="edit-carry" onclick="this.classList.toggle('on')"></div>
          </div>
        </div>
        <div class="modal-footer" style="padding:0;margin-top:16px">
          <button type="button" class="btn btn-secondary" onclick="App.closeModal()">إلغاء</button>
          <button type="submit" class="btn btn-primary"><i class="fas fa-save"></i> حفظ</button>
        </div>
      </form>
    `, {size:'sm'});
  },

  _saveLeaveType(e, key) {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target));
    const lt = this._getLeaveTypes().find(t => t.key === key);
    if (lt) {
      lt.l     = data.l;
      lt.days  = parseInt(data.days)||0;
      lt.color = data.color;
      lt.paid  = document.getElementById('edit-paid')?.classList.contains('on') || false;
      lt.carry = document.getElementById('edit-carry')?.classList.contains('on') || false;
      DB.saveCompany();
      App.toast('تم تحديث نوع الإجازة ✓', 'success');
      App.closeModal();
      this._renderSection();
    }
  },

  addLeaveType() {
    App.openModal('إضافة نوع إجازة جديد', `
      <form onsubmit="SettingsModule._saveNewLeaveType(event)">
        <div class="app-form-group"><label>اسم الإجازة</label><input class="app-form-input" name="l" placeholder="مثال: إجازة دراسية" required></div>
        <div class="app-form-row">
          <div class="app-form-group"><label>الرصيد السنوي (يوم)</label><input class="app-form-input" type="number" name="days" value="5" min="0"></div>
          <div class="app-form-group"><label>اللون</label><input class="app-form-input" type="color" name="color" value="#6366f1"></div>
        </div>
        <div class="modal-footer" style="padding:0;margin-top:16px">
          <button type="button" class="btn btn-secondary" onclick="App.closeModal()">إلغاء</button>
          <button type="submit" class="btn btn-primary"><i class="fas fa-plus"></i> إضافة</button>
        </div>
      </form>
    `, {size:'sm'});
  },

  _saveNewLeaveType(e) {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target));
    const types = this._getLeaveTypes();
    types.push({
      key:   `lt_${Date.now()}`,
      l:     data.l,
      days:  parseInt(data.days)||0,
      paid:  true,
      carry: false,
      color: data.color || '#6366f1',
    });
    DB.saveCompany();
    App.closeModal();
    App.toast('تم إضافة نوع الإجازة ✓', 'success');
    this._renderSection();
  },

  deleteLeaveType(key) {
    if (!confirm('هل تريد حذف هذا النوع؟')) return;
    DB.company.leaveTypes = this._getLeaveTypes().filter(t => t.key !== key);
    DB.saveCompany();
    App.toast('تم حذف نوع الإجازة', 'success');
    this._renderSection();
  },

  resetAllPasswords() {
    const defaultPass = 'Attendify@2025';
    DB.employees.forEach(emp => { emp.password = defaultPass; });
    DB.adminCredentials.password = defaultPass;
    DB.save();
    DB.logAudit('admin', 'إعادة تعيين كلمات المرور', 'Security', `${DB.employees.length} موظف`);
    App.toast(`تم تعيين كلمة المرور الافتراضية: ${defaultPass}`, 'success', 5000);
  },

  /* ══════════════════════════════════════════
     3. ATTENDANCE SETTINGS
  ══════════════════════════════════════════ */
  _attendance() {
    return `
      ${this._group('طرق تسجيل الحضور','تفعيل أو تعطيل طرق التسجيل المتاحة',`
        ${[
          {icon:'fas fa-face-smile',   color:'#6366f1', l:'التعرف على الوجه',       d:`face-api.js — يتطلب تسجيل وجه الموظف من ملفه الشخصي`,                                               on:true},
          {icon:'fas fa-fingerprint',  color:'#10b981', l:'بصمة الإصبع / الجهاز',  d:`WebAuthn — يعمل مع Windows Hello و Touch ID و Face ID و Android Fingerprint`,                           on: typeof PublicKeyCredential !== 'undefined'},
          {icon:'fas fa-qrcode',       color:'#f59e0b', l:'مسح QR Code',             d:'رمز QR شخصي لكل موظف',                                                                                     on:true},
          {icon:'fas fa-map-pin',      color:'#3b82f6', l:'GPS والسياج الجغرافي',    d:`Geolocation API — يحدد المسافة من موقع الشركة (${DB.company.gpsLat?'✅ تم تحديد الموقع':'⚠️ حدد موقع الشركة في الإعدادات'})`, on:true},
          {icon:'fas fa-keyboard',     color:'#06b6d4', l:'الإدخال اليدوي',           d:'إدخال الوقت يدوياً من الإدارة',                                                                           on:true},
        ].map(m=>`
          <div class="settings-item">
            <div class="settings-item-info">
              <div style="display:flex;align-items:center;gap:10px">
                <div style="width:38px;height:38px;border-radius:10px;background:${m.color}18;color:${m.color};display:flex;align-items:center;justify-content:center;font-size:16px"><i class="${m.icon}"></i></div>
                <div>
                  <div class="settings-item-label">${m.l}</div>
                  <div class="settings-item-desc">${m.d}</div>
                </div>
              </div>
            </div>
            ${this._toggle(`att-${m.l}`,m.on)}
          </div>
        `).join('')}
      `)}

      ${this._group('قواعد الحضور','ضبط سياسات الحضور والانصراف',`
        <div class="app-form-row">
          <div class="app-form-group">
            <label>السماح بالتسجيل المبكر (دقيقة)</label>
            <input class="app-form-input" type="number" value="30" min="0">
            <span style="font-size:11px;color:var(--text-muted)">قبل وقت الحضور الرسمي</span>
          </div>
          <div class="app-form-group">
            <label>الانصراف المبكر (دقيقة)</label>
            <input class="app-form-input" type="number" value="15" min="0">
            <span style="font-size:11px;color:var(--text-muted)">الحد المسموح للانصراف قبل الوقت</span>
          </div>
          <div class="app-form-group">
            <label>الحد الأقصى لساعات العمل اليومية</label>
            <input class="app-form-input" type="number" value="12" min="8">
          </div>
        </div>
        <div style="margin-top:8px">
          ${this._row('اشتراط تسجيل الانصراف','يعتبر غائباً إذا لم يسجل انصراف',this._toggle('require-out',true))}
          ${this._row('التسجيل خارج النطاق الجغرافي','السماح بالتسجيل خارج نطاق الشركة',this._toggle('allow-remote',false))}
          ${this._row('إشعار التأخر فوري','إرسال إشعار فور تجاوز وقت الحضور',this._toggle('instant-late',true))}
          ${this._row('الحضور من الجوال','السماح بالتسجيل عبر تطبيق الجوال',this._toggle('mobile-att',true))}
        </div>
      `)}

      ${this._group('إعدادات GPS','تكوين نطاق السياج الجغرافي لتسجيل الحضور',`
        <div class="app-form-row">
          <div class="app-form-group">
            <label>خط العرض (Latitude)</label>
            <input class="app-form-input" type="number" id="gps-lat" step="0.000001"
              value="${DB.company.gpsLat||''}" placeholder="مثال: 24.7136">
          </div>
          <div class="app-form-group">
            <label>خط الطول (Longitude)</label>
            <input class="app-form-input" type="number" id="gps-lon" step="0.000001"
              value="${DB.company.gpsLon||''}" placeholder="مثال: 46.6753">
          </div>
          <div class="app-form-group">
            <label>نطاق السياج (متر)</label>
            <input class="app-form-input" type="number" id="gps-radius"
              value="${DB.company.gpsRadius||200}" min="50" max="5000">
          </div>
        </div>
        <button type="button" class="btn btn-outline-primary btn-sm" onclick="SettingsModule.detectCompanyGPS()">
          <i class="fas fa-crosshairs"></i> تحديد موقع الشركة من موقعي الحالي
        </button>
        <div id="gps-status" style="margin-top:10px;font-size:12px;color:var(--text-muted)">
          ${DB.company.gpsLat ? `<span style="color:var(--success)"><i class="fas fa-circle-check"></i> تم تحديد الموقع: ${DB.company.gpsLat?.toFixed(4)}, ${DB.company.gpsLon?.toFixed(4)} — نطاق ${DB.company.gpsRadius||200}م</span>` : 'لم يتم تحديد موقع الشركة بعد'}
        </div>
        ${this._row('تحقق مزدوج (GPS + Face)','يتطلب التحقق من الموقع والوجه معاً',this._toggle('dual-verify',false))}
      `)}

      ${this._saveBtn("SettingsModule.saveAttendanceSettings()")}
    `;
  },

  saveAttendanceSettings() {
    const lat    = parseFloat(document.getElementById('gps-lat')?.value);
    const lon    = parseFloat(document.getElementById('gps-lon')?.value);
    const radius = parseInt(document.getElementById('gps-radius')?.value) || 200;
    if (!isNaN(lat) && !isNaN(lon)) {
      DB.company.gpsLat    = lat;
      DB.company.gpsLon    = lon;
      DB.company.gpsRadius = radius;
    }
    DB.saveCompany();
    App.toast('تم حفظ إعدادات الحضور والـ GPS بنجاح', 'success');
  },

  detectCompanyGPS() {
    const status = document.getElementById('gps-status');
    if (status) status.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جارٍ تحديد الموقع...';
    if (!navigator.geolocation) {
      if (status) status.innerHTML = '<span style="color:var(--danger)">المتصفح لا يدعم GPS</span>';
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        const latEl = document.getElementById('gps-lat');
        const lonEl = document.getElementById('gps-lon');
        if (latEl) latEl.value = lat.toFixed(6);
        if (lonEl) lonEl.value = lon.toFixed(6);
        DB.company.gpsLat = lat;
        DB.company.gpsLon = lon;
        if (!DB.company.gpsRadius) DB.company.gpsRadius = 200;
        DB.saveCompany();
        if (status) status.innerHTML = `<span style="color:var(--success)"><i class="fas fa-circle-check"></i> تم التحديد: ${lat.toFixed(4)}, ${lon.toFixed(4)} — دقة ±${Math.round(pos.coords.accuracy)}م</span>`;
        App.toast('تم تحديد موقع الشركة بنجاح', 'success');
      },
      (err) => {
        const msgs = { 1:'تم رفض إذن الموقع — فعّل الإذن من المتصفح', 2:'تعذّر تحديد الموقع', 3:'انتهت مهلة الطلب' };
        if (status) status.innerHTML = `<span style="color:var(--danger)"><i class="fas fa-triangle-exclamation"></i> ${msgs[err.code]||err.message}</span>`;
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  },

  /* ══════════════════════════════════════════
     4. LEAVE SETTINGS
  ══════════════════════════════════════════ */
  _leavesSettings() {
    const types = this._getLeaveTypes();
    return `
      ${this._group('أنواع الإجازات','تكوين أنواع الإجازات والرصيد السنوي',`
        <div class="table-wrapper" style="border:none;border-radius:0">
          <table class="data-table">
            <thead>
              <tr>
                <th>نوع الإجازة</th>
                <th>الرصيد السنوي</th>
                <th>براتب</th>
                <th>قابلة للترحيل</th>
                <th>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              ${types.map(lt=>`
                <tr>
                  <td>
                    <div style="display:flex;align-items:center;gap:8px">
                      <div style="width:8px;height:8px;border-radius:50%;background:${lt.color}"></div>
                      <span style="font-weight:600">${lt.l}</span>
                    </div>
                  </td>
                  <td>
                    <input class="app-form-input" type="number" id="lt-days-${lt.key}" value="${lt.days}" style="width:80px;padding:6px 10px">
                    <span style="font-size:12px;color:var(--text-muted)"> يوم</span>
                  </td>
                  <td>${this._toggle(`lt-paid-${lt.key}`,lt.paid)}</td>
                  <td>${this._toggle(`lt-carry-${lt.key}`,lt.carry)}</td>
                  <td>
                    <button class="btn btn-secondary btn-sm" onclick="SettingsModule.editLeaveType('${lt.key}')"><i class="fas fa-pencil"></i></button>
                    <button class="btn btn-danger btn-sm" onclick="SettingsModule.deleteLeaveType('${lt.key}')"><i class="fas fa-trash"></i></button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        <button class="btn btn-outline-primary btn-sm" style="margin-top:8px" onclick="SettingsModule.addLeaveType()">
          <i class="fas fa-plus"></i> إضافة نوع جديد
        </button>
      `)}

      ${this._group('سياسة الموافقة','تحديد مسار اعتماد طلبات الإجازة',`
        ${this._row('الموافقة التلقائية','قبول طلبات الإجازة تلقائياً دون مراجعة',this._toggle('auto-approve',false))}
        ${this._row('الموافقة من المدير المباشر','يتطلب موافقة مدير القسم أولاً',this._toggle('mgr-approve',true))}
        ${this._row('الموافقة من الموارد البشرية','يتطلب موافقة إضافية من HR',this._toggle('hr-approve',true))}
        ${this._row('إشعار الفريق عند الإجازة','إعلام زملاء القسم بإجازة الموظف',this._toggle('team-notif',true))}
        <div class="app-form-group" style="margin-top:12px">
          <label>المدة الدنيا لتقديم الطلب (أيام)</label>
          <input class="app-form-input" type="number" value="2" min="0" style="width:100px">
        </div>
      `)}

      ${this._group('ترحيل الرصيد',`قواعد ترحيل رصيد الإجازات للسنة القادمة`,`
        <div class="app-form-row">
          <div class="app-form-group">
            <label>الحد الأقصى للترحيل (يوم)</label>
            <input class="app-form-input" type="number" value="10" min="0">
          </div>
          <div class="app-form-group">
            <label>انتهاء صلاحية الرصيد المرحّل</label>
            ${this._select('carry-exp',[{v:'3',l:'3 أشهر'},{v:'6',l:'6 أشهر'},{v:'12',l:'سنة كاملة'},{v:'0',l:'لا ينتهي'}],'6')}
          </div>
        </div>
      `)}

      ${this._saveBtn("SettingsModule.saveLeaveTypes()")}
    `;
  },

  /* ══════════════════════════════════════════
     5. PAYROLL SETTINGS
  ══════════════════════════════════════════ */
  _payrollSettings() {
    return `
      ${this._group('دورة صرف الرواتب','تحديد موعد ومنهجية صرف الرواتب',`
        <div class="app-form-row">
          <div class="app-form-group">
            <label>دورة الرواتب</label>
            ${this._select('pay-cycle',[{v:'monthly',l:'شهري'},{v:'biweekly',l:'نصف شهري'},{v:'weekly',l:'أسبوعي'}],'monthly')}
          </div>
          <div class="app-form-group">
            <label>يوم الصرف (من الشهر)</label>
            <input class="app-form-input" type="number" value="28" min="1" max="31">
          </div>
          <div class="app-form-group">
            <label>العملة الافتراضية</label>
            ${this._select('pay-curr',[{v:'SAR',l:'SAR — ريال'},{v:'USD',l:'USD — دولار'},{v:'AED',l:'AED — درهم'}],'SAR')}
          </div>
        </div>
        ${this._row('معالجة الرواتب تلقائياً','صرف الرواتب تلقائياً في الموعد',this._toggle('auto-payroll',false))}
        ${this._row('بدل التأخر من الراتب','خصم قيمة التأخرات تلقائياً',this._toggle('late-deduct',true))}
        ${this._row('إضافة الأوفر تايم تلقائياً','احتساب الوقت الإضافي في الراتب',this._toggle('auto-ot-pay',true))}
      `)}

      ${this._group('مكونات الراتب','تفعيل وتعطيل بنود الراتب',`
        ${(() => {
          const pc = DB.company.payrollComponents || {};
          return [
            {l:'الراتب الأساسي',       d:'المرتب الثابت الشهري',              key:null,              fixed:true},
            {l:'بدل السكن',            d:'حسب سياسة الشركة',                  key:'housing',         fixed:false},
            {l:'بدل المواصلات',        d:'بدل التنقل اليومي',                 key:'transport',       fixed:false},
            {l:'بدل الاتصالات',        d:'رسوم الهاتف والإنترنت',             key:'phone',           fixed:false},
            {l:'بدل الطبيعة الخاصة',  d:'مقابل المهن ذات الطبيعة الخاصة',   key:'special',         fixed:false},
            {l:'العلاوة السنوية',      d:'زيادة الأجر السنوية',               key:'annualBonus',     fixed:false},
            {l:'مكافأة الأداء',        d:'بونص ربع سنوي أو سنوي',            key:'performanceBonus',fixed:false},
          ].map(c=>`
            <div class="settings-item">
              <div class="settings-item-info">
                <div class="settings-item-label">${c.l} ${c.fixed?'<span style="font-size:10px;background:var(--primary-bg);color:var(--primary);padding:2px 6px;border-radius:4px;font-weight:600">إلزامي</span>':''}</div>
                <div class="settings-item-desc">${c.d}</div>
              </div>
              ${c.fixed ? '<span style="font-size:12px;color:var(--text-muted)">مفعّل دائماً</span>' : this._toggle('pc-'+c.key, !!pc[c.key])}
            </div>
          `).join('');
        })()}
      `)}

      ${this._saveBtn("SettingsModule.savePayrollSettings()")}
    `;
  },

  savePayrollSettings() {
    if (!DB.company.payrollComponents) DB.company.payrollComponents = {};
    const pc = DB.company.payrollComponents;
    ['housing','transport','phone','special','annualBonus','performanceBonus'].forEach(k => {
      const el = document.getElementById('pc-' + k);
      if (el) pc[k] = el.classList.contains('on');
    });
    // Also save payroll cycle settings
    const cycleEl  = document.getElementById('pay-cycle');
    const currEl   = document.getElementById('pay-curr');
    if (cycleEl) DB.company.payrollCycle    = cycleEl.value;
    if (currEl)  DB.company.payrollCurrency = currEl.value;
    DB.saveCompany();
    App.toast('تم حفظ إعدادات الرواتب بنجاح ✓', 'success');
  },

  /* ══════════════════════════════════════════
     6. EMPLOYEE PORTAL
  ══════════════════════════════════════════ */
  _portal() {
    const ps = DB.company.portalSettings || {};
    return `
      ${this._group('تفعيل بوابة الموظف','التحكم في ميزات البوابة الذاتية للموظفين',`
        ${this._row('تفعيل البوابة','السماح للموظفين بالدخول لبوابتهم الشخصية',this._toggle('ps-enabled',  ps.enabled  !== false))}
        ${this._row('تسجيل الحضور من البوابة','السماح بتسجيل الحضور عبر البوابة',this._toggle('ps-checkin',  ps.checkin  !== false))}
        ${this._row('طلب الإجازات من البوابة','السماح بتقديم طلبات الإجازة',this._toggle('ps-leaves',   ps.leaves   !== false))}
        ${this._row('عرض كشف الراتب','تمكين الموظف من رؤية راتبه وبنوده',this._toggle('ps-payslip',  ps.payslip  !== false))}
        ${this._row('عرض السجل الشخصي','الاطلاع على بيانات الملف الشخصي',this._toggle('ps-profile',  ps.profile  !== false))}
        ${this._row('مراسلة الإدارة','إرسال رسائل للموارد البشرية',this._toggle('ps-msg',      !!ps.msg))}
      `)}

      ${this._group('إعدادات كلمة مرور الموظف','قواعد كلمة السر لبوابة الموظف',`
        <div class="app-form-row">
          <div class="app-form-group">
            <label>كلمة المرور الافتراضية</label>
            ${this._select('portal-defpass',[{v:'code',l:'كود الموظف'},{v:'phone4',l:'آخر 4 أرقام من الجوال'},{v:'custom',l:'تحديد يدوي'}],'code')}
          </div>
          <div class="app-form-group">
            <label>الحد الأدنى لطول الكلمة</label>
            <input class="app-form-input" type="number" value="6" min="4">
          </div>
        </div>
        ${this._row('إلزام تغيير الكلمة عند أول دخول','يُجبر الموظف على تغيير كلمة المرور',this._toggle('ps-forceChange', ps.forceChange !== false))}
      `)}

      ${this._group('إعادة تعيين كلمات المرور','تطبيق إعادة ضبط جماعية لكلمات المرور',`
        <div style="background:var(--warning-bg,rgba(245,158,11,0.08));border:1px solid rgba(245,158,11,0.2);border-radius:12px;padding:14px;margin-bottom:12px;display:flex;gap:10px;align-items:flex-start">
          <i class="fas fa-triangle-exclamation" style="color:var(--warning);margin-top:2px"></i>
          <div style="font-size:13px;color:var(--text-secondary)">
            ستؤدي هذه العملية إلى إعادة تعيين كلمات مرور جميع الموظفين إلى القيمة الافتراضية
          </div>
        </div>
        <button class="btn btn-warning btn-sm" onclick="if(confirm('هل أنت متأكد من إعادة تعيين كلمات مرور جميع الموظفين؟')) SettingsModule.resetAllPasswords()">
          <i class="fas fa-key"></i> إعادة تعيين جميع كلمات المرور
        </button>
      `)}

      ${this._saveBtn("SettingsModule.savePortalSettings()")}
    `;
  },

  savePortalSettings() {
    if (!DB.company.portalSettings) DB.company.portalSettings = {};
    const ps = DB.company.portalSettings;
    ['enabled','checkin','leaves','payslip','profile','msg','forceChange'].forEach(k => {
      const el = document.getElementById('ps-' + k);
      if (el) ps[k] = el.classList.contains('on');
    });
    DB.saveCompany();
    App.toast('تم حفظ إعدادات بوابة الموظف بنجاح ✓', 'success');
  },

  /* ══════════════════════════════════════════
     7. NOTIFICATIONS
  ══════════════════════════════════════════ */
  _notifications() {
    const events = [
      {l:'التأخر عن الدوام',     d:'إشعار فور انتهاء مهلة التأخر',       on:true},
      {l:'الغياب',               d:'إشعار عند غياب الموظف دون إذن',       on:true},
      {l:'طلب إجازة جديد',       d:'إشعار عند تقديم موظف طلب إجازة',     on:true},
      {l:'الموافقة على الإجازة', d:'إشعار للموظف عند قبول إجازته',        on:true},
      {l:'رفض الإجازة',          d:'إشعار للموظف عند رفض إجازته',         on:true},
      {l:'معالجة الرواتب',       d:'إشعار عند إصدار كشوف الرواتب',        on:true},
      {l:'تقارير الحضور اليومية',d:'ملخص يومي بحالة الحضور',              on:true},
    ];

    return `
      ${this._group('إعدادات واتساب التلقائي','ربط UltraMsg API للإرسال الفوري بدون أي تدخل',`
        <div id="wa-api-section">${WhatsApp.renderApiSettings()}</div>
      `)}

      ${this._group('قوالب رسائل WhatsApp','تخصيص نصوص الرسائل التلقائية المرسلة للموظفين',`
        <div style="font-size:12px;color:var(--text-muted);margin-bottom:12px">
          <i class="fas fa-info-circle"></i>
          المتغيرات المتاحة: <code style="background:var(--bg);padding:2px 6px;border-radius:4px">{name}</code>
          <code style="background:var(--bg);padding:2px 6px;border-radius:4px">{date}</code>
          <code style="background:var(--bg);padding:2px 6px;border-radius:4px">{minutes}</code>
          <code style="background:var(--bg);padding:2px 6px;border-radius:4px">{from}</code>
          <code style="background:var(--bg);padding:2px 6px;border-radius:4px">{to}</code>
          <code style="background:var(--bg);padding:2px 6px;border-radius:4px">{days}</code>
          <code style="background:var(--bg);padding:2px 6px;border-radius:4px">{amount}</code>
        </div>

        ${[
          { key:'absence',         label:'🔴 إشعار غياب' },
          { key:'late',            label:'🟡 إشعار تأخير' },
          { key:'warning',         label:'⚠️ إنذار رسمي' },
          { key:'leaveApproved',   label:'✅ موافقة إجازة' },
          { key:'leaveRejected',   label:'❌ رفض إجازة' },
          { key:'requestApproved', label:'✅ موافقة طلب' },
          { key:'requestRejected', label:'❌ رفض طلب' },
          { key:'salaryReady',     label:'💰 إشعار الراتب' },
        ].map(t=>`
          <div class="app-form-group">
            <label>${t.label}</label>
            <textarea class="app-form-input" id="wa-tpl-${t.key}" rows="3" style="resize:vertical;font-size:12px;line-height:1.7">${WhatsApp.templates[t.key]?.text||''}</textarea>
          </div>
        `).join('')}

        <button class="btn btn-primary" onclick="SettingsModule.saveWATemplates()">
          <i class="fas fa-save"></i> حفظ القوالب
        </button>
      `)}

      ${this._group('أحداث الإشعارات','اختر الأحداث التي تستدعي إرسال إشعار WhatsApp تلقائياً',`
        ${events.map(ev=>`
          <div class="settings-item">
            <div class="settings-item-info">
              <div class="settings-item-label">${ev.l}</div>
              <div class="settings-item-desc">${ev.d}</div>
            </div>
            ${this._toggle('ev-'+ev.l, ev.on)}
          </div>
        `).join('')}
      `)}
    `;
  },

  toggleWA(on) {
    WhatsApp.config.enabled = on;
    App.toast(on ? 'تم تفعيل إشعارات WhatsApp ✅' : 'تم تعطيل إشعارات WhatsApp', on ? 'success' : 'info');
  },

  toggleWAToken() { /* not used in wa.me mode */ },

  saveWAConfig() {
    App.toast('لا حاجة لإعدادات — الخدمة مجانية وتعمل تلقائياً ✅', 'success');
  },

  async testWA() {
    const phone = document.getElementById('wa-test-phone')?.value?.trim();
    if (!phone) { App.toast('أدخل رقم الهاتف للاختبار', 'warning'); return; }
    const msg = `مرحباً من Attendify Pro 👋\nهذه رسالة اختبار لتأكيد عمل الإشعارات.\n\n${DB.company.name || 'فريق الموارد البشرية'}`;
    const ok = await WhatsApp.send(phone, msg);
    if (ok) App.toast(WhatsApp.isApiReady() ? '✅ أُرسلت الرسالة تلقائياً' : '✅ تم فتح واتساب — اضغط إرسال', 'success');
  },

  saveWATemplates() {
    const keys = ['absence','late','warning','leaveApproved','leaveRejected','requestApproved','requestRejected','salaryReady'];
    const updated = {};
    keys.forEach(k => {
      const el = document.getElementById(`wa-tpl-${k}`);
      if (el && WhatsApp.templates[k]) {
        updated[k] = { ...WhatsApp.templates[k], text: el.value };
      }
    });
    Object.assign(WhatsApp.templates, updated);
    localStorage.setItem('wa-templates', JSON.stringify(WhatsApp.templates));
    App.toast('تم حفظ قوالب WhatsApp ✅', 'success');
  },

  /* ══════════════════════════════════════════
     8. INTEGRATIONS
  ══════════════════════════════════════════ */
  _integrations() {
    const sbCfg  = typeof SupabaseDB !== 'undefined' ? SupabaseDB.getConfig() : {};
    const sbConn = typeof SupabaseDB !== 'undefined' ? SupabaseDB.isConnected : false;

    const intgs = [
      {icon:'fab fa-whatsapp',    color:'#25d366', l:'WhatsApp Business',  d:'إرسال إشعارات وتنبيهات عبر WhatsApp',         connected:true,  cfg:'whatsapp'},
      {icon:'fas fa-comment-sms', color:'#3b82f6', l:'Twilio SMS',         d:'بوابة رسائل SMS للتنبيهات',                   connected:false, cfg:'twilio'},
      {icon:'fas fa-envelope',    color:'#6366f1', l:'SMTP Email',         d:'smtp.gmail.com:587 — TLS',                    connected:true,  cfg:'smtp'},
      {icon:'fas fa-fingerprint', color:'#10b981', l:'جهاز البصمة',        d:'ZKTeco / Suprema Biometric Device',           connected:false, cfg:'bio'},
      {icon:'fas fa-face-smile',  color:'#8b5cf6', l:'Face Recognition AI',d:'نموذج التعرف على الوجه المحلي',               connected:true,  cfg:'face'},
      {icon:'fas fa-lock',        color:'#0078d4', l:'Active Directory',   d:'مزامنة المستخدمين مع LDAP/AD',                connected:true,  cfg:'ldap'},
      {icon:'fas fa-calendar',    color:'#0f9d58', l:'Google Calendar',    d:'مزامنة العطل والأحداث مع Google Calendar',    connected:false, cfg:'gcal'},
      {icon:'fab fa-slack',       color:'#4a154b', l:'Slack',              d:'إرسال التنبيهات لقنوات Slack',                connected:false, cfg:'slack'},
    ];
    return `
      <div class="grid-2">
        ${intgs.map(i=>`
          <div class="card stagger-item">
            <div class="card-body">
              <div style="display:flex;align-items:flex-start;gap:12px;margin-bottom:14px">
                <div style="width:48px;height:48px;border-radius:14px;background:${i.color}18;color:${i.color};display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0">
                  <i class="${i.icon}"></i>
                </div>
                <div style="flex:1">
                  <div style="font-size:14px;font-weight:700;color:var(--text-primary);margin-bottom:3px">${i.l}</div>
                  <div style="font-size:12px;color:var(--text-muted)">${i.d}</div>
                </div>
                <span class="badge ${i.connected?'badge-success':'badge-secondary'} badge-dot">
                  ${i.connected?'متصل':'غير متصل'}
                </span>
              </div>
              <div style="display:flex;gap:8px">
                <button class="btn ${i.connected?'btn-danger':'btn-primary'} btn-sm" style="flex:1"
                  onclick="App.toast('${i.connected?'جارٍ فصل':'جارٍ ربط'} ${i.l}...','info')">
                  <i class="fas ${i.connected?'fa-link-slash':'fa-link'}"></i>
                  ${i.connected?'فصل':'ربط'}
                </button>
                <button class="btn btn-secondary btn-sm" onclick="SettingsModule.configIntegration('${i.cfg}','${i.l}')">
                  <i class="fas fa-gear"></i>
                </button>
              </div>
            </div>
          </div>
        `).join('')}
      </div>

      <!-- ── SUPABASE SECTION ──────────────────────────────── -->
      <div class="card" style="margin-bottom:20px;border:1.5px solid ${sbConn?'rgba(16,185,129,0.3)':'rgba(99,102,241,0.2)'}">
        <div class="card-body">
          <div style="display:flex;align-items:center;gap:14px;margin-bottom:18px">
            <div style="width:52px;height:52px;border-radius:16px;background:linear-gradient(135deg,#3ecf8e18,#3ecf8e30);display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:24px">
              🗄️
            </div>
            <div style="flex:1">
              <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
                <span style="font-size:15px;font-weight:800;color:var(--text-primary)">Supabase</span>
                <span id="sb-status-badge">${typeof SupabaseDB!=='undefined'?SupabaseDB.getStatusBadge():'<span class="badge badge-secondary">غير مفعّل</span>'}</span>
              </div>
              <div style="font-size:12.5px;color:var(--text-muted)">قاعدة بيانات PostgreSQL — مزامنة تلقائية للبيانات في الوقت الفعلي</div>
            </div>
          </div>

          <!-- Connection form -->
          <div style="display:flex;flex-direction:column;gap:12px">
            <div class="app-form-group" style="margin:0">
              <label>Project URL</label>
              <input class="app-form-input" id="sb-url" dir="ltr"
                placeholder="https://xxxxxxxxxxxx.supabase.co"
                value="${sbCfg.url||''}">
            </div>
            <div class="app-form-group" style="margin:0">
              <label>Anon Public Key</label>
              <div style="display:flex;gap:6px">
                <input class="app-form-input" id="sb-key" dir="ltr" type="password"
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  value="${sbCfg.key||''}">
                <button class="btn btn-secondary btn-sm"
                  onclick="const i=document.getElementById('sb-key');i.type=i.type==='password'?'text':'password'">
                  <i class="fas fa-eye"></i>
                </button>
              </div>
            </div>

            <!-- Actions row -->
            <div style="display:flex;gap:8px;flex-wrap:wrap;padding-top:4px">
              <button class="btn btn-primary" onclick="SettingsModule.supabaseSave()">
                <i class="fas fa-plug"></i> اتصال
              </button>
              <button class="btn btn-secondary" onclick="SettingsModule.supabaseSync()" ${sbConn?'':'disabled'}>
                <i class="fas fa-rotate"></i> مزامنة الآن
              </button>
              <button class="btn btn-secondary" onclick="SettingsModule.supabaseSetup()" style="margin-${currentLang==='ar'?'right':'left'}:auto">
                <i class="fas fa-book"></i> كيفية الإعداد
              </button>
              ${sbConn?`<button class="btn btn-ghost" style="color:var(--danger)" onclick="SettingsModule.supabaseDisconnect()"><i class="fas fa-link-slash"></i> قطع الاتصال</button>`:''}
            </div>

            <!-- Status info row when connected -->
            ${sbConn?`
              <div style="background:rgba(16,185,129,0.08);border:1px solid rgba(16,185,129,0.2);border-radius:10px;padding:12px;display:flex;align-items:center;gap:10px">
                <i class="fas fa-circle-check" style="color:var(--success)"></i>
                <div>
                  <div style="font-size:12.5px;font-weight:700;color:var(--success)">متصل بـ Supabase</div>
                  <div style="font-size:11px;color:var(--text-muted);font-family:var(--font-en)">${sbCfg.url||''}</div>
                </div>
              </div>
            `:`
              <div style="background:var(--bg-input);border-radius:10px;padding:12px;font-size:12px;color:var(--text-muted)">
                <i class="fas fa-info-circle" style="color:var(--primary)"></i>
                البيانات محفوظة في الذاكرة المحلية (localStorage). اربط Supabase لحفظها في قاعدة بيانات دائمة.
              </div>
            `}
          </div>
        </div>
      </div>

      ${this._group('API Keys & Webhooks','مفاتيح الوصول لواجهات برمجة التطبيقات',`
        <div class="settings-item" style="align-items:flex-start">
          <div class="settings-item-info">
            <div class="settings-item-label">API Key الخاص بك</div>
            <div class="settings-item-desc">استخدمه للربط مع تطبيقاتك الخارجية</div>
          </div>
          <div style="display:flex;gap:8px;flex-direction:column;min-width:260px">
            <div style="display:flex;gap:6px">
              <input class="app-form-input" value="" id="api-key" type="password" placeholder="لم يتم توليد مفتاح بعد" style="font-family:var(--font-en);flex:1" readonly>
              <button class="btn btn-secondary btn-sm" onclick="SettingsModule.toggleApiKey()"><i class="fas fa-eye" id="api-eye"></i></button>
              <button class="btn btn-secondary btn-sm" onclick="SettingsModule.copyApiKey()" title="نسخ"><i class="fas fa-copy"></i></button>
            </div>
            <button class="btn btn-warning btn-sm" onclick="if(confirm('هل تريد إعادة توليد المفتاح؟ سيتوقف عمل التكاملات القديمة.')) SettingsModule.generateApiKey()">
              <i class="fas fa-rotate"></i> إعادة توليد المفتاح
            </button>
          </div>
        </div>
        <div class="settings-item">
          <div class="settings-item-info">
            <div class="settings-item-label">Webhook URL</div>
            <div class="settings-item-desc">استقبال أحداث النظام على عنوانك</div>
          </div>
          <input class="app-form-input" placeholder="https://your-server.com/webhook" dir="ltr" style="min-width:260px">
        </div>
      `)}
    `;
  },

  configIntegration(type, name) {
    const configs = {
      whatsapp:`<div class="app-form-group"><label>Business Phone ID</label><input class="app-form-input" dir="ltr" placeholder="123456789"></div><div class="app-form-group"><label>Access Token</label><input class="app-form-input" type="password" dir="ltr" placeholder="EAABs..."></div>`,
      smtp:`<div class="app-form-group"><label>SMTP Host</label><input class="app-form-input" dir="ltr" value="smtp.gmail.com"></div><div class="app-form-row"><div class="app-form-group"><label>Port</label><input class="app-form-input" dir="ltr" value="587"></div><div class="app-form-group"><label>Security</label><select class="app-form-input app-form-select"><option>TLS</option><option>SSL</option></select></div></div><div class="app-form-group"><label>Username</label><input class="app-form-input" dir="ltr" placeholder="noreply@company.com"></div><div class="app-form-group"><label>Password</label><input class="app-form-input" type="password"></div>`,
      twilio:`<div class="app-form-group"><label>Account SID</label><input class="app-form-input" dir="ltr" placeholder="ACxxxxxx"></div><div class="app-form-group"><label>Auth Token</label><input class="app-form-input" type="password"></div><div class="app-form-group"><label>From Number</label><input class="app-form-input" dir="ltr" placeholder="+1234567890"></div>`,
    };
    App.openModal(`إعداد ${name}`, `
      <form onsubmit="event.preventDefault();App.closeModal();App.toast('تم حفظ الإعدادات','success')">
        ${configs[type]||`<div class="app-form-group"><label>API Endpoint</label><input class="app-form-input" dir="ltr"></div><div class="app-form-group"><label>Secret Key</label><input class="app-form-input" type="password"></div>`}
        <button type="button" class="btn btn-secondary btn-sm" onclick="SettingsModule.testWebhook(this.closest('form'))"><i class="fas fa-plug"></i> اختبار الاتصال</button>
        <div class="modal-footer" style="padding:0;margin-top:16px">
          <button type="button" class="btn btn-secondary" onclick="App.closeModal()">${t('common.cancel')}</button>
          <button type="submit" class="btn btn-primary"><i class="fas fa-save"></i> ${t('common.save')}</button>
        </div>
      </form>
    `,{size:'sm'});
  },

  toggleApiKey() {
    const inp = document.getElementById('api-key');
    const eye = document.getElementById('api-eye');
    if (!inp) return;
    if (!inp.value) { this.generateApiKey(); return; }
    if (inp.type==='password') { inp.type='text'; if (eye) eye.className='fas fa-eye-slash'; }
    else { inp.type='password'; if (eye) eye.className='fas fa-eye'; }
  },

  generateApiKey() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const key = 'atd_' + Array.from({length:48}, () => chars[Math.floor(Math.random()*chars.length)]).join('');
    localStorage.setItem('attendify-api-key', key);
    const inp = document.getElementById('api-key');
    if (inp) { inp.value = key; inp.type = 'text'; }
    const eye = document.getElementById('api-eye');
    if (eye) eye.className = 'fas fa-eye-slash';
    App.toast('تم توليد مفتاح API جديد ✓', 'success');
  },

  copyApiKey() {
    const inp = document.getElementById('api-key');
    const val = inp?.value || localStorage.getItem('attendify-api-key');
    if (!val) { App.toast('لا يوجد مفتاح — أنشئ مفتاحاً أولاً', 'warning'); return; }
    navigator.clipboard?.writeText(val).then(() => App.toast('تم نسخ المفتاح ✓', 'success'))
      .catch(() => { if (inp) { inp.select(); document.execCommand('copy'); App.toast('تم النسخ', 'success'); } });
  },

  async testWebhook(form) {
    const urlEl = form?.querySelector('input[placeholder*="webhook"], input[dir="ltr"]');
    const url = urlEl?.value?.trim();
    if (!url) { App.toast('أدخل Webhook URL أولاً', 'warning'); return; }
    App.toast('جارٍ اختبار الاتصال...', 'info', 3000);
    try {
      await fetch(url, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({test:true, from:'Attendify Pro', timestamp: new Date().toISOString()}) });
      App.toast('تم الاتصال بنجاح ✓', 'success');
    } catch {
      App.toast('تعذّر الاتصال — تحقق من الرابط', 'error');
    }
  },

  // ── SUPABASE ACTIONS ─────────────────────────────────────

  async supabaseSave() {
    const url = document.getElementById('sb-url')?.value?.trim();
    const key = document.getElementById('sb-key')?.value?.trim();
    if (!url || !key) { App.toast('أدخل الرابط والمفتاح أولاً','warning'); return; }
    App.toast('جارٍ الاتصال بـ Supabase...','info');
    document.getElementById('sb-status-badge').innerHTML = '<span class="badge badge-warning badge-dot">جارٍ الاتصال...</span>';
    const ok = await SupabaseDB.saveConfig(url, key);
    // Refresh integrations section to show updated status
    setTimeout(() => this.switchSection('integrations'), 800);
  },

  async supabaseSync() {
    await SupabaseDB.syncAll();
  },

  supabaseDisconnect() {
    App.confirm(
      'هل تريد قطع الاتصال بـ Supabase؟ ستظل البيانات محفوظة محلياً.',
      () => {
        SupabaseDB.clearConfig();
        setTimeout(() => this.switchSection('integrations'), 300);
      }
    );
  },

  supabaseSetup() {
    App.openModal('إعداد Supabase — خطوة بخطوة', `
      <div style="display:flex;flex-direction:column;gap:16px;font-size:13.5px;line-height:1.7">

        <div style="background:linear-gradient(135deg,#3ecf8e10,#3ecf8e20);border:1px solid rgba(62,207,142,0.3);border-radius:12px;padding:14px">
          <div style="font-weight:800;color:#059669;margin-bottom:4px">✅ Supabase مجاني تماماً للمشاريع الصغيرة</div>
          <div style="color:var(--text-muted);font-size:12px">500MB قاعدة بيانات · 50,000 طلب/شهر · SSL مجاني</div>
        </div>

        <div style="display:flex;flex-direction:column;gap:12px">
          ${[
            { n:1, t:'أنشئ حساباً', d:'اذهب إلى <strong style="color:var(--primary)">supabase.com</strong> وسجّل بالبريد الإلكتروني أو GitHub' },
            { n:2, t:'أنشئ مشروعاً جديداً', d:'اضغط "New Project" — اختر اسم المشروع وكلمة مرور قاعدة البيانات والمنطقة' },
            { n:3, t:'شغّل SQL Schema', d:'اذهب إلى <strong>SQL Editor → New Query</strong> والصق محتوى ملف <code style="background:var(--bg-input);padding:2px 6px;border-radius:4px">sql/schema.sql</code> ثم اضغط Run' },
            { n:4, t:'انسخ بياناتك', d:'اذهب إلى <strong>Project Settings → API</strong> وانسخ: <br>• Project URL<br>• anon public key' },
            { n:5, t:'أدخل البيانات هنا', d:'الصق الـ URL والـ anon key في الحقول أعلاه واضغط "اتصال"' },
          ].map(s=>`
            <div style="display:flex;gap:12px;align-items:flex-start">
              <div style="width:28px;height:28px;border-radius:50%;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:white;font-size:12px;font-weight:800;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:2px">${s.n}</div>
              <div>
                <div style="font-weight:700;color:var(--text-primary);margin-bottom:2px">${s.t}</div>
                <div style="color:var(--text-muted);font-size:12.5px">${s.d}</div>
              </div>
            </div>
          `).join('')}
        </div>

        <div style="background:rgba(245,158,11,0.08);border:1px solid rgba(245,158,11,0.25);border-radius:10px;padding:12px;font-size:12px;color:#92400e">
          <i class="fas fa-triangle-exclamation"></i>
          <strong>ملاحظة أمنية:</strong> استخدم <code>anon public key</code> فقط (وليس <code>service_role key</code>)
        </div>

        <div style="display:flex;gap:8px;justify-content:flex-end">
          <button class="btn btn-secondary" onclick="App.closeModal()">إغلاق</button>
        </div>
      </div>
    `);
  },

  /* ══════════════════════════════════════════
     9. SECURITY
  ══════════════════════════════════════════ */
  _security() {
    return `
      ${this._group('المصادقة والجلسات','إعدادات تسجيل الدخول وحماية الجلسة',`
        ${this._row('المصادقة الثنائية (2FA)','طبقة حماية إضافية عند تسجيل الدخول',this._toggle('sec-2fa',true))}
        ${this._row('تسجيل خروج تلقائي','إنهاء الجلسة بعد فترة من الخمول',this._toggle('sec-auto-logout',true))}
        <div class="settings-item" style="padding-top:4px">
          <div class="settings-item-info">
            <div class="settings-item-label">مدة الخمول قبل تسجيل الخروج</div>
          </div>
          ${this._select('idle-timeout',[{v:'15',l:'15 دقيقة'},{v:'30',l:'30 دقيقة'},{v:'60',l:'ساعة'},{v:'120',l:'ساعتان'}],'30')}
        </div>
        ${this._row('جلسة واحدة لكل مستخدم','منع تسجيل الدخول من أجهزة متعددة',this._toggle('single-session',false))}
        ${this._row('تسجيل جميع محاولات الدخول','حفظ سجل كامل لمحاولات الدخول',this._toggle('log-logins',true))}
      `)}

      ${this._group('سياسة كلمة المرور','قواعد إنشاء وتجديد كلمات المرور',`
        <div class="app-form-row">
          <div class="app-form-group">
            <label>الحد الأدنى للطول</label>
            <input class="app-form-input" type="number" value="8" min="6" max="32">
          </div>
          <div class="app-form-group">
            <label>تجديد الكلمة كل (يوم)</label>
            <input class="app-form-input" type="number" value="90" min="30">
          </div>
          <div class="app-form-group">
            <label>الحد الأقصى لمحاولات الدخول</label>
            <input class="app-form-input" type="number" value="5" min="3" max="10">
          </div>
        </div>
        ${this._row('يجب أن تحتوي على أرقام','رقم واحد على الأقل',this._toggle('pass-num',true))}
        ${this._row('يجب أن تحتوي على رموز','رمز خاص على الأقل (!@#$)',this._toggle('pass-sym',false))}
        ${this._row('يجب أن تحتوي على أحرف كبيرة وصغيرة','حرف كبير وصغير على الأقل',this._toggle('pass-case',true))}
        ${this._row('منع إعادة استخدام الكلمات السابقة','حفظ آخر 5 كلمات مرور',this._toggle('pass-history',true))}
      `)}

      ${this._group('قيود الوصول','تقييد الوصول بناءً على الموقع والجهاز',`
        ${this._row('قيود عنوان IP','السماح بالدخول من IPs محددة فقط',this._toggle('ip-restrict',false))}
        <div class="settings-item">
          <div class="settings-item-info">
            <div class="settings-item-label">عناوين IP المسموح بها</div>
            <div class="settings-item-desc">عنوان واحد في كل سطر، أو نطاق CIDR</div>
          </div>
          <textarea class="app-form-input" style="min-width:220px;height:80px;resize:vertical;font-family:var(--font-en);font-size:12px" placeholder="192.168.1.0/24&#10;10.0.0.1"></textarea>
        </div>
        ${this._row('تشفير البيانات (AES-256)','تشفير جميع البيانات الحساسة',this._toggle('encrypt',true))}
        ${this._row('تفعيل HTTPS فقط','رفض اتصالات HTTP غير المشفرة',this._toggle('https-only',true))}
      `)}

      ${this._group('سجل الأمان',`آخر ${DB.audit.filter(a=>a.action.includes('دخول')).length} عمليات دخول`,`
        ${DB.audit.filter(a=>a.action.includes('دخول')).slice(0,4).map(a=>{
          const user=DB.getEmployee(a.userId);
          return `
            <div class="settings-item">
              <div class="settings-item-info">
                <div style="display:flex;align-items:center;gap:8px">
                  <div class="avatar ${user?.avatarColor||'gradient-primary'}" style="width:28px;height:28px;font-size:10px">${user?.avatar||'?'}</div>
                  <div>
                    <div class="settings-item-label">${user?.name||a.userId}</div>
                    <div class="settings-item-desc">${a.ip} — ${App.timeAgo(a.time)}</div>
                  </div>
                </div>
              </div>
              <span class="badge badge-success badge-dot">ناجح</span>
            </div>
          `;
        }).join('')}
        <a href="#audit" class="btn btn-secondary btn-sm" style="margin-top:8px" onclick="App.navigate('audit')">
          <i class="fas fa-shield-halved"></i> عرض سجل المراجعة الكامل
        </a>
      `)}

      ${this._saveBtn("SettingsModule.saveSecuritySettings()")}
    `;
  },

  saveSecuritySettings() {
    if (!DB.company.securitySettings) DB.company.securitySettings = {};
    const ss = DB.company.securitySettings;
    [['twoFactor','sec-2fa'],['autoLogout','sec-auto-logout'],['singleSession','single-session'],
     ['logLogins','log-logins'],['passNums','pass-num'],['passSymbols','pass-sym'],
     ['passMixed','pass-case'],['passHistory','pass-history'],['ipRestrict','ip-restrict']
    ].forEach(([k,id]) => { const el=document.getElementById(id); if(el) ss[k]=el.classList.contains('on'); });
    const idleEl=document.getElementById('idle-timeout'); if(idleEl) ss.idleTimeout=idleEl.value;
    const mlEl=document.getElementById('pass-min-len');   if(mlEl) ss.passMinLen=parseInt(mlEl.value)||8;
    const rdEl=document.getElementById('pass-renewal');   if(rdEl) ss.passRenewalDays=parseInt(rdEl.value)||90;
    const maEl=document.getElementById('pass-max-attempts'); if(maEl) ss.passMaxAttempts=parseInt(maEl.value)||5;
    const ipEl=document.getElementById('allowed-ips');    if(ipEl) ss.allowedIPs=ipEl.value;
    DB.saveCompany();
    App.toast('تم حفظ إعدادات الأمان بنجاح ✓', 'success');
  },

  /* ══════════════════════════════════════════
     10. APPEARANCE
  ══════════════════════════════════════════ */
  _appearance() {
    const colors = [
      {hex:'#6366f1',l:'بنفسجي (افتراضي)'},{hex:'#0ea5e9',l:'أزرق سماوي'},
      {hex:'#10b981',l:'أخضر زمردي'},{hex:'#f59e0b',l:'برتقالي ذهبي'},
      {hex:'#ef4444',l:'أحمر'},{hex:'#8b5cf6',l:'بنفسجي فاتح'},
      {hex:'#ec4899',l:'وردي'},{hex:'#06b6d4',l:'سيان'},
    ];
    return `
      ${this._group('المظهر العام','وضع الليل والنهار وألوان الواجهة',`
        <div class="settings-item">
          <div class="settings-item-info">
            <div class="settings-item-label">وضع الليل</div>
            <div class="settings-item-desc">تبديل بين الوضع الداكن والفاتح</div>
          </div>
          <div style="display:flex;align-items:center;gap:12px">
            <span style="font-size:13px;color:var(--text-muted)"><i class="fas fa-sun"></i></span>
            <div class="toggle-switch ${App.state.theme==='dark'?'on':''}" onclick="this.classList.toggle('on');App.toggleTheme()"></div>
            <span style="font-size:13px;color:var(--text-muted)"><i class="fas fa-moon"></i></span>
          </div>
        </div>

        <div class="settings-item">
          <div class="settings-item-info">
            <div class="settings-item-label">اللون الأساسي</div>
            <div class="settings-item-desc">لون القائمة والأزرار والعناصر الرئيسية</div>
          </div>
          <div style="display:flex;flex-wrap:wrap;gap:8px">
            ${colors.map(c=>`
              <div title="${c.l}"
                style="width:32px;height:32px;border-radius:8px;background:${c.hex};cursor:pointer;position:relative;transition:transform .15s"
                onclick="SettingsModule.applyColor('${c.hex}','${c.l}')"
                onmouseover="this.style.transform='scale(1.15)'" onmouseout="this.style.transform='scale(1)'">
                ${c.hex==='#6366f1'?'<i class="fas fa-check" style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:white;font-size:12px"></i>':''}
              </div>
            `).join('')}
          </div>
        </div>

        ${this._row('حجم الخط','تعديل حجم النص في الواجهة',`
          <div style="display:flex;gap:6px">
            ${['صغير','متوسط','كبير'].map((s,i)=>`<button class="btn btn-sm btn-secondary" onclick="SettingsModule.applyFontSize(['13px','14px','16px'][${i}],'${s}',this)">${s}</button>`).join('')}
          </div>
        `)}

        ${this._row('تأثيرات الزجاج (Glassmorphism)','خلفية شفافة للبطاقات والنوافذ',this._toggle('glass-effect',true))}
        ${this._row('الحركات والانيميشن','تأثيرات الحركة عند تحميل الصفحات',this._toggle('animations',true))}
      `)}

      ${this._group('اللغة والاتجاه','ضبط لغة الواجهة واتجاه النص',`
        <div class="settings-item">
          <div class="settings-item-info">
            <div class="settings-item-label">لغة الواجهة</div>
          </div>
          <div style="display:flex;gap:8px">
            <button class="btn btn-sm ${currentLang==='ar'?'btn-primary':'btn-secondary'}" onclick="App.setLanguage('ar')">
              <i class="fas fa-a"></i> العربية
            </button>
            <button class="btn btn-sm ${currentLang==='en'?'btn-primary':'btn-secondary'}" onclick="App.setLanguage('en')">
              <i class="fas fa-a"></i> English
            </button>
          </div>
        </div>
        ${this._row('اتجاه النص RTL','من اليمين لليسار (للغة العربية)',`
          <div class="toggle-switch ${currentLang==='ar'?'on':''}" onclick="this.classList.toggle('on');App.toggleLanguage()"></div>
        `)}
      `)}

      ${this._group('تخصيص الشريط الجانبي','ضبط مظهر وسلوك القائمة الجانبية',`
        ${this._row('إخفاء الشريط التلقائي (موبايل)','طي الشريط تلقائياً على الشاشات الصغيرة',this._toggle('auto-collapse',true))}
        ${this._row('عرض الأيقونات فقط عند الطي','الاكتفاء بالأيقونة عند الشريط المطوي',this._toggle('icon-only',true))}
      `)}
    `;
  },

  /* ══════════════════════════════════════════
     11. BACKUP & DATA
  ══════════════════════════════════════════ */
  _backup() {
    return `
      ${this._group('تصدير البيانات','تحميل نسخة من بيانات النظام',`
        <div class="grid-2" style="gap:12px;margin-top:4px">
          ${[
            {icon:'fas fa-users',     l:'بيانات الموظفين',   d:'أسماء، وظائف، بيانات التواصل', fn:"EmployeesModule.exportData()"},
            {icon:'fas fa-clock',     l:'سجلات الحضور',      d:'جميع سجلات الحضور والانصراف',  fn:"SettingsModule.exportSection('attendance')"},
            {icon:'fas fa-calendar',  l:'بيانات الإجازات',   d:'الطلبات والأرصدة والموافقات',   fn:"LeavesModule.exportData()"},
            {icon:'fas fa-chart-bar', l:'التقارير',          d:'تقارير الحضور والأداء',         fn:"SettingsModule.exportSection('reports')"},
            {icon:'fas fa-money-bill',l:'كشوف الرواتب',      d:'بيانات الرواتب التاريخية',      fn:"PayrollModule.exportPayroll()"},
            {icon:'fas fa-shield',    l:'سجل المراجعة',      d:'جميع العمليات والأحداث',         fn:"AuditModule.exportLogs()"},
          ].map(e=>`
            <div style="background:var(--bg);border-radius:12px;padding:14px;border:1.5px solid var(--border);display:flex;align-items:center;gap:12px">
              <div style="width:40px;height:40px;border-radius:10px;background:var(--primary-bg);color:var(--primary);display:flex;align-items:center;justify-content:center;font-size:17px;flex-shrink:0">
                <i class="${e.icon}"></i>
              </div>
              <div style="flex:1;min-width:0">
                <div style="font-size:13px;font-weight:700;color:var(--text-primary)">${e.l}</div>
                <div style="font-size:11px;color:var(--text-muted)">${e.d}</div>
              </div>
              <div style="display:flex;gap:4px">
                <button class="btn btn-secondary btn-sm" onclick="${e.fn}" title="Excel"><i class="fas fa-file-excel"></i></button>
                <button class="btn btn-secondary btn-sm" onclick="SettingsModule.exportPrint('${e.l}')" title="PDF/طباعة"><i class="fas fa-print"></i></button>
              </div>
            </div>
          `).join('')}
        </div>
        <button class="btn btn-primary" style="margin-top:12px" onclick="SettingsModule.exportAllData()">
          <i class="fas fa-download"></i> تصدير جميع البيانات (JSON)
        </button>
      `)}

      ${this._group('النسخ الاحتياطي التلقائي','جدولة النسخ الاحتياطي الدوري',`
        ${(() => {
          const bs = DB.company.backupSettings || {};
          return `
            ${this._row('نسخ احتياطي تلقائي','إنشاء نسخة احتياطية دورية تلقائياً',this._toggle('backup-auto', bs.auto !== false))}
            <div class="app-form-row">
              <div class="app-form-group">
                <label>تكرار النسخ الاحتياطي</label>
                ${this._select('backup-freq',[{v:'daily',l:'يومياً'},{v:'weekly',l:'أسبوعياً'},{v:'monthly',l:'شهرياً'}], bs.freq||'daily')}
              </div>
              <div class="app-form-group">
                <label>وقت النسخ الاحتياطي</label>
                <input class="app-form-input" id="backup-time" type="time" value="${bs.time||'02:00'}">
              </div>
              <div class="app-form-group">
                <label>الاحتفاظ بالنسخ (أيام)</label>
                <input class="app-form-input" id="backup-retention" type="number" value="${bs.retention||30}" min="7">
              </div>
            </div>
            <div class="settings-item">
              <div class="settings-item-info">
                <div class="settings-item-label">مكان التخزين</div>
              </div>
              ${this._select('backup-loc',[{v:'local',l:'خادم محلي'},{v:'s3',l:'Amazon S3'},{v:'drive',l:'Google Drive'},{v:'azure',l:'Azure Blob'}], bs.loc||'local')}
            </div>
          `;
        })()}
      `)}

      ${this._group('آخر نسخ احتياطية',`سجل النسخ الأخيرة`,`
        ${[
          {date:'2025-06-19 02:00',size:'4.2 MB',status:'success'},
          {date:'2025-06-18 02:00',size:'4.1 MB',status:'success'},
          {date:'2025-06-17 02:01',size:'4.0 MB',status:'success'},
          {date:'2025-06-16 02:00',size:'3.9 MB',status:'failed'},
        ].map(b=>`
          <div class="settings-item">
            <div class="settings-item-info">
              <div class="settings-item-label" style="font-family:var(--font-en)">${b.date}</div>
              <div class="settings-item-desc">${b.size}</div>
            </div>
            <div style="display:flex;align-items:center;gap:8px">
              <span class="badge ${b.status==='success'?'badge-success':'badge-danger'} badge-dot">
                ${b.status==='success'?'ناجح':'فشل'}
              </span>
              ${b.status==='success'?`<button class="btn btn-secondary btn-sm" onclick="SettingsModule.exportAllData()" title="تحميل"><i class="fas fa-download"></i></button>`:''}
            </div>
          </div>
        `).join('')}
      `)}

      ${this._group('إعادة تعيين النظام','⚠️ عمليات خطرة — تعمل على حذف البيانات',`
        <div style="background:rgba(239,68,68,0.06);border:1px solid rgba(239,68,68,0.2);border-radius:12px;padding:16px">
          <div style="font-size:13px;font-weight:700;color:var(--danger);margin-bottom:14px">
            <i class="fas fa-triangle-exclamation"></i> منطقة خطر
          </div>
          <div style="display:flex;flex-direction:column;gap:10px">
            <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px">
              <div>
                <div style="font-size:13px;font-weight:600;color:var(--text-primary)">مسح سجلات الحضور القديمة</div>
                <div style="font-size:12px;color:var(--text-muted)">حذف السجلات قبل 12 شهراً</div>
              </div>
              <button class="btn btn-warning btn-sm" onclick="if(confirm('هل أنت متأكد من حذف السجلات الأقدم من 12 شهراً؟')) SettingsModule.deleteOldLogs()">حذف السجلات القديمة</button>
            </div>
            <hr style="border:none;border-top:1px solid rgba(239,68,68,0.15)">
            <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px">
              <div>
                <div style="font-size:13px;font-weight:600;color:var(--danger)">إعادة تعيين النظام بالكامل</div>
                <div style="font-size:12px;color:var(--text-muted)">حذف جميع البيانات وإعادة البدء من الصفر</div>
              </div>
              <button class="btn btn-danger btn-sm" onclick="if(confirm('⚠️ هذا الإجراء لا يمكن التراجع عنه! سيتم حذف جميع البيانات. هل أنت متأكد؟')) SettingsModule.hardReset()">
                <i class="fas fa-trash"></i> إعادة تعيين
              </button>
            </div>
          </div>
        </div>
      `)}

      ${this._saveBtn("SettingsModule.saveBackupSettings()")}
    `;
  },

  saveBackupSettings() {
    if (!DB.company.backupSettings) DB.company.backupSettings = {};
    const bs = DB.company.backupSettings;
    const autoEl  = document.getElementById('backup-auto');
    const freqEl  = document.getElementById('backup-freq');
    const timeEl  = document.getElementById('backup-time');
    const retEl   = document.getElementById('backup-retention');
    const locEl   = document.getElementById('backup-loc');
    if (autoEl)  bs.auto      = autoEl.classList.contains('on');
    if (freqEl)  bs.freq      = freqEl.value;
    if (timeEl)  bs.time      = timeEl.value;
    if (retEl)   bs.retention = parseInt(retEl.value) || 30;
    if (locEl)   bs.loc       = locEl.value;
    DB.saveCompany();
    App.toast('تم حفظ إعدادات النسخ الاحتياطي بنجاح ✓', 'success');
  },

  // ── HELPER METHODS ───────────────────────────────────────

  applyColor(hex, label) {
    document.documentElement.style.setProperty('--primary', hex);
    document.documentElement.style.setProperty('--primary-dark', hex);
    localStorage.setItem('attendify-color', hex);
    App.toast(`تم تطبيق اللون: ${label}`, 'success');
  },

  applyFontSize(size, label, btn) {
    document.documentElement.style.fontSize = size;
    localStorage.setItem('attendify-font-size', size);
    document.querySelectorAll('.btn-sm').forEach(b => b.classList.remove('btn-primary'));
    if (btn) { btn.classList.remove('btn-secondary'); btn.classList.add('btn-primary'); }
    App.toast(`تم تطبيق الحجم: ${label}`, 'success');
  },

  exportSection(type) {
    if (type === 'attendance') {
      const data = DB.attendance.map(a => {
        const emp = DB.getEmployee(a.empId);
        return { [currentLang==='ar'?'الموظف':'Employee']: emp?.name||a.empId, [currentLang==='ar'?'التاريخ':'Date']: a.date, [currentLang==='ar'?'الحضور':'Check-in']: a.checkIn||'', [currentLang==='ar'?'الانصراف':'Check-out']: a.checkOut||'', [currentLang==='ar'?'الحالة':'Status']: a.status||'' };
      });
      App.exportCSV(data, 'attendance.csv');
    } else if (type === 'reports') {
      const data = DB.employees.map(emp => {
        const atts = DB.attendance.filter(a => a.empId === emp.id);
        return { [currentLang==='ar'?'الموظف':'Employee']: emp.name, [currentLang==='ar'?'إجمالي أيام الحضور':'Total Days']: atts.length, [currentLang==='ar'?'أيام التأخر':'Late Days']: atts.filter(a=>a.status==='late').length, [currentLang==='ar'?'أيام الغياب':'Absent Days']: atts.filter(a=>a.status==='absent').length };
      });
      App.exportCSV(data, 'reports.csv');
    }
  },

  exportPrint(title) {
    const win = window.open('', '_blank');
    win.document.write(`<html><head><title>${title}</title><style>body{font-family:Arial;direction:rtl;padding:20px} table{width:100%;border-collapse:collapse} th,td{border:1px solid #ddd;padding:8px;text-align:right} th{background:#6366f1;color:white} @media print{button{display:none}}</style></head><body>`);
    win.document.write(`<h2>${DB.company.name||'Attendify Pro'} — ${title}</h2>`);
    win.document.write(`<p>${new Date().toLocaleDateString('ar-SA')}</p>`);
    win.document.write(`<p>${currentLang==='ar'?'تم التصدير من نظام Attendify Pro':'Exported from Attendify Pro'}</p>`);
    win.document.write(`<button onclick="window.print()">طباعة</button>`);
    win.document.write('</body></html>');
    win.document.close();
  },

  exportAllData() {
    const backup = {
      exportedAt:  new Date().toISOString(),
      version:     '1.0',
      company:     DB.company,
      employees:   DB.employees,
      departments: DB.departments,
      attendance:  DB.attendance,
      leaves:      DB.leaves,
      requests:    DB.requests,
      payroll:     DB.payroll,
      shifts:      DB.shifts,
      locations:   DB.locations,
      audit:       DB.audit,
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], {type:'application/json'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `attendify-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    App.toast(`تم تصدير ${DB.employees.length} موظف و${DB.attendance.length} سجل حضور ✓`, 'success');
  },

  deleteOldLogs() {
    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - 12);
    const cutoffStr = cutoff.toISOString().split('T')[0];
    let deleted = 0, deleted2 = 0;
    for (let i = DB.audit.length - 1; i >= 0; i--) {
      if ((DB.audit[i].time || '') < cutoffStr) { DB.audit.splice(i, 1); deleted++; }
    }
    for (let i = DB.attendance.length - 1; i >= 0; i--) {
      if ((DB.attendance[i].date || '') < cutoffStr) { DB.attendance.splice(i, 1); deleted2++; }
    }
    App.toast(`تم حذف ${deleted} سجل مراجعة و${deleted2} سجل حضور قديم ✓`, 'success');
  },

  hardReset() {
    ['employees','attendance','leaves','requests','payroll','shifts','locations','audit','notifications','departments'].forEach(k => {
      if (Array.isArray(DB[k])) DB[k].length = 0;
    });
    DB.company = { name:'',nameEn:'',logo:'',address:'',phone:'',email:'',website:'',timezone:'Asia/Riyadh',currency:'SAR',workStart:'08:00',workEnd:'17:00',lateThreshold:15,breakEnabled:false,overtimeEnabled:false,workPeriods:[{id:'wp1',label:'فترة العمل',start:'08:00',end:'17:00'}],workDays:['sat','sun','mon','tue','wed','thu'],branches:[],holidays:[] };
    DB.adminCredentials = { email:'', password:'' };
    localStorage.clear();
    App.toast('تم إعادة تعيين النظام — سيتم إعادة التحميل...', 'info', 2000);
    setTimeout(() => location.reload(), 2000);
  },
};
