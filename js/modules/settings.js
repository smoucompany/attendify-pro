/* =========================================================
   SETTINGS MODULE — Enterprise Full System Settings
   11 sections covering the entire platform
   ========================================================= */

const SettingsModule = {
  _section: 'company',

  _sections: [
    { key:'company',       icon:'fas fa-building'        },
    { key:'hours',         icon:'fas fa-clock'           },
    { key:'attendance',    icon:'fas fa-fingerprint'     },
    { key:'leaves',        icon:'fas fa-calendar-minus'  },
    { key:'payroll',       icon:'fas fa-money-bill-wave' },
    { key:'signatures',    icon:'fas fa-signature'       },
    { key:'portal',        icon:'fas fa-user'            },
    { key:'notifications', icon:'fas fa-bell'            },
    { key:'integrations',  icon:'fas fa-plug'            },
    { key:'security',      icon:'fas fa-shield-halved'   },
    { key:'appearance',    icon:'fas fa-palette'         },
    { key:'backup',        icon:'fas fa-cloud-arrow-up'  },
    { key:'roles',         icon:'fas fa-user-shield'     },
  ],

  render(container) {
    container.innerHTML = `
      <div class="page-header">
        <div class="page-header-text">
          <h1>${t('settings.title')}</h1>
          <p>${t('settings.subtitleDesc')}</p>
        </div>
      </div>
      <div class="settings-grid">
        <!-- Sidebar Nav -->
        <div class="settings-nav" id="settings-nav">
          ${this._sections.map(s => `
            <div class="settings-nav-item ${this._section===s.key?'active':''}" data-key="${s.key}"
              onclick="SettingsModule.switchSection('${s.key}')">
              <i class="${s.icon}"></i>
              <span>${t('settings.tab.' + s.key)}</span>
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

    // Modules with their own render() — delegate directly (guard against missing modules)
    if (this._section === 'backup') {
      if (typeof BackupModule !== 'undefined') { BackupModule.render(el); }
      else { el.innerHTML = `<div class="empty-state"><p>${t('settings.backupUnavailable')}</p></div>`; }
      return;
    }
    if (this._section === 'roles') {
      if (typeof RolesModule !== 'undefined') { RolesModule.render(el); }
      else { el.innerHTML = `<div class="empty-state"><p>${t('settings.rolesUnavailable')}</p></div>`; }
      return;
    }

    const map = {
      company:       () => this._company(),
      hours:         () => this._hours(),
      attendance:    () => this._attendance(),
      leaves:        () => this._leavesSettings(),
      payroll:       () => this._payrollSettings(),
      signatures:    () => this._signatures(),
      portal:        () => this._portal(),
      notifications: () => this._notifications(),
      integrations:  () => this._integrations(),
      security:      () => this._security(),
      appearance:    () => this._appearance(),
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
      ${this._group(t('settings.identityTitle'),t('settings.identityDesc'),`
        <div class="settings-item" style="align-items:flex-start;gap:20px;flex-wrap:wrap">
          <div style="display:flex;gap:20px;flex-wrap:wrap">
            <!-- Logo -->
            <div style="display:flex;flex-direction:column;align-items:center;gap:10px">
              <div style="font-size:11px;font-weight:700;color:var(--text-muted);margin-bottom:2px">${t('settings.companyLogo')}</div>
              <div id="logo-preview" style="width:90px;height:90px;border-radius:20px;background:linear-gradient(135deg,var(--primary),#8b5cf6);display:flex;align-items:center;justify-content:center;font-size:28px;font-weight:800;color:white;overflow:hidden;cursor:pointer" onclick="document.getElementById('logo-file-input').click()" title="${t('settings.clickToChangeLogo')}">
                ${co.logo && co.logo.startsWith('data:')
                  ? `<img src="${co.logo}" style="width:100%;height:100%;object-fit:cover;border-radius:20px">`
                  : `<i class="fas fa-building" style="font-size:32px;opacity:.8"></i>`}
              </div>
              <input type="file" id="logo-file-input" accept="image/*" style="display:none" onchange="SettingsModule.uploadLogo(this)">
              <div style="display:flex;gap:6px">
                <button class="btn btn-secondary btn-sm" onclick="document.getElementById('logo-file-input').click()">
                  <i class="fas fa-upload"></i> ${t('settings.upload')}
                </button>
                ${co.logo ? `<button class="btn btn-danger btn-sm" onclick="SettingsModule.removeLogo()"><i class="fas fa-trash"></i></button>` : ''}
              </div>
              <div style="font-size:10px;color:var(--text-muted);text-align:center">PNG, JPG, SVG<br>${t('settings.maxSize2MB')}</div>
            </div>

            <!-- Favicon -->
            <div style="display:flex;flex-direction:column;align-items:center;gap:10px">
              <div style="font-size:11px;font-weight:700;color:var(--text-muted);margin-bottom:2px">${t('settings.favicon')}</div>
              <div id="fav-preview" style="width:64px;height:64px;border-radius:14px;background:var(--bg-input);border:2px dashed var(--border);display:flex;align-items:center;justify-content:center;overflow:hidden;cursor:pointer" onclick="document.getElementById('fav-file-input').click()" title="${t('settings.clickToChangeIcon')}">
                ${co.favicon
                  ? `<img src="${co.favicon}" style="width:48px;height:48px;object-fit:contain">`
                  : `<i class="fas fa-globe" style="font-size:22px;color:var(--text-muted);opacity:.5"></i>`}
              </div>
              <input type="file" id="fav-file-input" accept="image/png,image/x-icon,image/svg+xml,image/jpeg" style="display:none" onchange="SettingsModule.uploadFavicon(this)">
              <div style="display:flex;gap:6px">
                <button class="btn btn-secondary btn-sm" onclick="document.getElementById('fav-file-input').click()">
                  <i class="fas fa-upload"></i> ${t('settings.upload')}
                </button>
                ${co.favicon ? `<button class="btn btn-danger btn-sm" onclick="SettingsModule.removeFavicon()"><i class="fas fa-trash"></i></button>` : ''}
              </div>
              <div style="font-size:10px;color:var(--text-muted);text-align:center">PNG, ICO, SVG<br>${t('settings.faviconIdeal')}</div>
            </div>
          </div>
          <div style="flex:1;min-width:260px;display:flex;flex-direction:column;gap:12px">
            <div class="app-form-row">
              <div class="app-form-group">
                <label>${t('settings.nameAr')}</label>
                <input class="app-form-input" id="co-name" value="${co.name}">
              </div>
              <div class="app-form-group">
                <label>${t('settings.nameEn')}</label>
                <input class="app-form-input" id="co-name-en" value="${co.nameEn}" dir="ltr">
              </div>
            </div>
            <div class="app-form-row">
              <div class="app-form-group">
                <label>${t('common.email')}</label>
                <input class="app-form-input" id="co-email" type="email" value="${co.email}" dir="ltr">
              </div>
              <div class="app-form-group">
                <label>${t('common.phone')}</label>
                <input class="app-form-input" id="co-phone" value="${co.phone}" dir="ltr">
              </div>
            </div>
            <div class="app-form-row">
              <div class="app-form-group">
                <label>${t('settings.website')}</label>
                <input class="app-form-input" id="co-web" value="${co.website||''}" dir="ltr">
              </div>
              <div class="app-form-group">
                <label>${t('settings.address')}</label>
                <input class="app-form-input" id="co-addr" value="${co.address||''}">
              </div>
            </div>
          </div>
        </div>
      `)}

      <!-- Regional -->
      ${this._group(t('settings.regionalTitle'),t('settings.regionalDesc'),`
        <div class="app-form-row">
          <div class="app-form-group">
            <label>${t('settings.timezone')}</label>
            ${this._select('co-tz',[
              {v:'Asia/Riyadh',l:'Asia/Riyadh — GMT+3'},
              {v:'Asia/Dubai',l:'Asia/Dubai — GMT+4'},
              {v:'Africa/Cairo',l:'Africa/Cairo — GMT+2'},
              {v:'Asia/Kuwait',l:'Asia/Kuwait — GMT+3'},
              {v:'UTC',l:'UTC — GMT+0'},
            ], co.timezone)}
          </div>
          <div class="app-form-group">
            <label>${t('settings.currency')}</label>
            ${this._select('co-curr',[
              {v:'SAR',l:'SAR — ريال سعودي ﷼'},
              {v:'AED',l:'AED — درهم إماراتي'},
              {v:'EGP',l:'EGP — جنيه مصري'},
              {v:'KWD',l:'KWD — دينار كويتي'},
              {v:'USD',l:'USD — دولار أمريكي $'},
            ], co.currency)}
          </div>
          <div class="app-form-group">
            <label>${t('settings.dateFormat')}</label>
            ${this._select('co-datefmt',[
              {v:'DD/MM/YYYY',l:'DD/MM/YYYY'},
              {v:'MM/DD/YYYY',l:'MM/DD/YYYY'},
              {v:'YYYY-MM-DD',l:'YYYY-MM-DD'},
            ],'DD/MM/YYYY')}
          </div>
        </div>
      `)}

      <!-- Branches -->
      ${this._group(t('settings.branchesTitle'),`${co.branches.length} ${t('settings.branchesRegistered')}`,`
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
            <i class="fas fa-plus"></i> ${t('settings.addBranch')}
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
    App.toast(t('settings.toastCompanySaved'),'success');
  },

  uploadLogo(input) {
    const file = input.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { App.toast(t('settings.logoSizeError'), 'warning'); return; }
    const reader = new FileReader();
    reader.onload = e => {
      DB.company.logo = e.target.result; // base64
      DB.saveCompany();
      // Update preview immediately
      const preview = document.getElementById('logo-preview');
      if (preview) preview.innerHTML = `<img src="${DB.company.logo}" style="width:100%;height:100%;object-fit:cover;border-radius:20px">`;
      this._updateSidebarLogo();
      App.toast(t('settings.toastLogoSaved'), 'success');
      // Re-render to show the remove button
      this._renderSection();
    };
    reader.readAsDataURL(file);
  },

  removeLogo() {
    DB.company.logo = '';
    DB.saveCompany();
    this._updateSidebarLogo();
    App.toast(t('settings.toastLogoDeleted'), 'info');
    this._renderSection();
  },

  uploadFavicon(input) {
    const file = input.files[0];
    if (!file) return;
    if (file.size > 1 * 1024 * 1024) { App.toast(t('settings.faviconSizeError'), 'warning'); return; }
    const reader = new FileReader();
    reader.onload = e => {
      DB.company.favicon = e.target.result;
      DB.saveCompany();
      this._applyFavicon(e.target.result);
      const preview = document.getElementById('fav-preview');
      if (preview) preview.innerHTML = `<img src="${e.target.result}" style="width:48px;height:48px;object-fit:contain">`;
      App.toast(t('settings.toastFaviconSaved'), 'success');
      this._renderSection();
    };
    reader.readAsDataURL(file);
  },

  removeFavicon() {
    DB.company.favicon = '';
    DB.saveCompany();
    this._applyFavicon(null);
    App.toast(t('settings.toastFaviconDeleted'), 'info');
    this._renderSection();
  },

  _applyFavicon(src) {
    let link = document.querySelector("link[rel~='icon']");
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    if (src) {
      link.href = src;
      link.type = src.startsWith('data:image/svg') ? 'image/svg+xml' : 'image/png';
    } else {
      link.href = '';
    }
  },

  deleteBranch(id) {
    App.confirm(t('settings.confirmDeleteBranch'), () => {
      DB.company.branches = DB.company.branches.filter(b => b.id !== id);
      DB.saveCompany();
      App.toast(t('settings.toastBranchDeleted'), 'success');
      this._renderSection();
    });
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
    App.openModal(t('settings.addBranchTitle'),`
      <form onsubmit="SettingsModule.saveBranch(event)">
        <div class="app-form-group"><label>${t('settings.branchName')}</label><input class="app-form-input" name="name" required></div>
        <div class="app-form-group"><label>${t('settings.branchCity')}</label><input class="app-form-input" name="city" required></div>
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
    App.toast(t('settings.toastBranchAdded'),'success');
    this._renderSection();
  },
  editBranch(id) {
    const b = DB.company.branches.find(x=>x.id===id);
    App.openModal(t('settings.editBranchTitle'),`
      <form onsubmit="SettingsModule.updateBranch(event,'${id}')">
        <div class="app-form-group"><label>${t('settings.branchName')}</label><input class="app-form-input" name="name" value="${b.name}" required></div>
        <div class="app-form-group"><label>${t('settings.branchCity')}</label><input class="app-form-input" name="city" value="${b.city}" required></div>
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
    App.toast(t('settings.toastBranchUpdated'),'success');
    this._renderSection();
  },

  /* ══════════════════════════════════════════
     2. WORKING HOURS
  ══════════════════════════════════════════ */
  _hours() {
    const co = DB.company;
    const days = [
      {k:'sat',l:t('day.sat')},{k:'sun',l:t('day.sun')},{k:'mon',l:t('day.mon')},
      {k:'tue',l:t('day.tue')},{k:'wed',l:t('day.wed')},{k:'thu',l:t('day.thu')},{k:'fri',l:t('day.fri')},
    ];
    const periods = co.workPeriods || [];
    const totalMins = periods.reduce((sum, p) => sum + this._periodMins(p), 0);
    const totalHrs = (totalMins/60).toFixed(1);

    return `
      <!-- Work Periods -->
      ${this._group(
        t('settings.workPeriods'),
        `${t('settings.totalWorkHours')}: <strong style="color:var(--primary)">${totalHrs} ${t('settings.hoursUnit')}</strong> ${t('settings.dailyNoBrk')}`,
        `
        <div id="periods-list">
          ${periods.map((p, i) => this._periodRow(p, i)).join('')}
        </div>
        <button class="btn btn-outline-primary btn-sm" style="margin-top:8px" onclick="SettingsModule.addPeriod()">
          <i class="fas fa-plus"></i> ${t('settings.addPeriod')}
        </button>
        <div style="margin-top:14px;padding:12px 14px;background:var(--primary-bg);border-radius:10px;font-size:12px;color:var(--primary);display:flex;align-items:center;gap:8px">
          <i class="fas fa-circle-info"></i>
          <span>${t('settings.periodCalcNote')}</span>
        </div>
        `,
        `<span class="badge badge-primary">${periods.length} ${t('settings.periodUnit')}</span>`
      )}

      <!-- Work Days -->
      ${this._group(t('settings.workDays'),t('settings.selectWorkDays'),`
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
      ${this._group(t('settings.lateSettings'),t('settings.lateSettingsDesc'),`
        <div class="app-form-row">
          <div class="app-form-group">
            <label>${t('settings.lateThreshold')}</label>
            <input class="app-form-input" type="number" id="late-threshold" value="${co.lateThreshold}" min="0" max="60" style="max-width:140px">
            <span style="font-size:11px;color:var(--text-muted);margin-top:4px;display:block">${t('settings.lateMinutesHint')}</span>
          </div>
          <div class="app-form-group">
            ${this._row(t('settings.deductLate'),t('settings.deductLateDesc'),this._toggle('deduct-late',true))}
          </div>
        </div>

        <!-- Disabled features info box -->
        <div style="margin-top:4px;border-radius:12px;border:1px solid var(--border);overflow:hidden">
          <div style="padding:10px 14px;background:var(--bg);border-bottom:1px solid var(--border);font-size:12px;font-weight:700;color:var(--text-muted)">
            ${t('settings.disabledFeatures')}
          </div>
          ${[
            {icon:'fa-mug-hot',    lKey:'settings.featureBreak',    dKey:'settings.featureBreakDesc'},
            {icon:'fa-clock',      lKey:'settings.featureOvertime',  dKey:'settings.featureOvertimeDesc'},
            {icon:'fa-money-bill', lKey:'settings.featureOtAllow',   dKey:'settings.featureOtAllowDesc'},
          ].map(f=>`
            <div style="display:flex;align-items:center;gap:12px;padding:11px 14px;border-bottom:1px solid var(--border)">
              <div style="width:32px;height:32px;border-radius:8px;background:var(--danger-bg,rgba(239,68,68,0.08));color:var(--danger);display:flex;align-items:center;justify-content:center;font-size:13px;flex-shrink:0">
                <i class="fas ${f.icon}"></i>
              </div>
              <div style="flex:1">
                <div style="font-size:13px;font-weight:600;color:var(--text-secondary)">${t(f.lKey)}</div>
                <div style="font-size:11px;color:var(--text-muted)">${t(f.dKey)}</div>
              </div>
              <span style="font-size:11px;font-weight:700;color:var(--danger);background:var(--danger-bg,rgba(239,68,68,0.08));padding:3px 10px;border-radius:6px">${t('settings.disabled')}</span>
            </div>
          `).join('')}
        </div>
      `)}

      <!-- Holidays -->
      ${this._group(t('settings.holidays'),t('settings.holidaysDesc'),`
        <div id="holidays-list">
          ${(DB.company.holidays||[]).map(h=>`
            <div class="settings-item" id="holiday-${h.id}">
              <div class="settings-item-info">
                <div class="settings-item-label">${h.name}</div>
                <div class="settings-item-desc">${h.date} — ${h.days} ${t('leaves.days')}</div>
              </div>
              <button class="btn btn-danger btn-sm" onclick="SettingsModule.removeHoliday('${h.id}')">
                <i class="fas fa-trash"></i>
              </button>
            </div>
          `).join('')}
        </div>
        <div class="settings-item" style="border:none">
          <button class="btn btn-outline-primary btn-sm" onclick="SettingsModule.addHoliday()">
            <i class="fas fa-plus"></i> ${t('settings.addHoliday')}
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
          <label style="font-size:11px;margin-bottom:4px">${t('settings.periodName')}</label>
          <input class="app-form-input" style="padding:7px 10px" value="${p.label}"
            onchange="DB.company.workPeriods[${i}].label=this.value">
        </div>
        <div class="app-form-group" style="margin:0;flex:1">
          <label style="font-size:11px;margin-bottom:4px">${t('common.from')}</label>
          <input class="app-form-input" type="time" style="padding:7px 10px" value="${p.start}"
            onchange="DB.company.workPeriods[${i}].start=this.value;SettingsModule._refreshTotal()">
        </div>
        <div class="app-form-group" style="margin:0;flex:1">
          <label style="font-size:11px;margin-bottom:4px">${t('common.to')}</label>
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
    const overnightLabel = currentLang === 'ar' ? 'ليلي' : 'Night';
    const overnight = end <= start ? ` <span style="font-size:10px;color:#8b5cf6;font-weight:700">🌙${overnightLabel}</span>` : '';
    const hLabel = currentLang === 'ar' ? 'س' : 'h';
    const mLabel = currentLang === 'ar' ? 'د' : 'm';
    return (m ? `${h}${hLabel} ${m}${mLabel}` : `${h} ${hLabel}`) + overnight;
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
    const hUnit = currentLang === 'ar' ? 'ساعة' : 'h';
    if (header) header.textContent = `${totalHrs} ${hUnit}`;
    // Refresh all duration displays
    periods.forEach((p, i) => {
      const el = document.getElementById(`dur-${p.id}`);
      if (el) el.innerHTML = this._calcDur(p.start, p.end);
    });
  },

  addPeriod() {
    const periods = DB.company.workPeriods;
    const periodLabel = currentLang === 'ar' ? `فترة ${periods.length+1}` : `Period ${periods.length+1}`;
    const newP = { id: `wp${Date.now()}`, label: periodLabel, start: '08:00', end: '14:00' };
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
    App.toast(t('settings.toastHoursSaved'), 'success');
  },

  addHoliday() {
    App.openModal(t('settings.addHolidayTitle'),`
      <form onsubmit="SettingsModule.saveHoliday(event)">
        <div class="app-form-group"><label>${t('settings.holidayName')}</label><input class="app-form-input" name="name" required></div>
        <div class="app-form-row">
          <div class="app-form-group"><label>${t('settings.holidayDate')}</label><input class="app-form-input" type="date" name="date" required></div>
          <div class="app-form-group"><label>${t('settings.holidayDays')}</label><input class="app-form-input" type="number" name="days" value="1" min="1"></div>
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
    App.closeModal();
    App.toast(`${t('settings.toastHolidayAdded')}: ${holiday.name}`, 'success');
    this._renderSection();
  },

  removeHoliday(id) {
    DB.company.holidays = (DB.company.holidays||[]).filter(h => h.id !== id);
    DB.saveCompany();
    document.getElementById(`holiday-${id}`)?.remove();
    App.toast(t('settings.toastHolidayDeleted'), 'success');
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
    App.toast(t('settings.toastLeaveTypesSaved'), 'success');
  },

  editLeaveType(key) {
    const lt = this._getLeaveTypes().find(x => x.key === key);
    if (!lt) return;
    App.openModal(t('settings.editLeaveTypeTitle'), `
      <form onsubmit="SettingsModule._saveLeaveType(event,'${key}')">
        <div class="app-form-group"><label>${t('settings.leaveName')}</label><input class="app-form-input" name="l" value="${lt.l}" required></div>
        <div class="app-form-row">
          <div class="app-form-group"><label>${t('settings.leaveBalance')}</label><input class="app-form-input" type="number" name="days" value="${lt.days}" min="0"></div>
          <div class="app-form-group"><label>${t('common.color','اللون')}</label><input class="app-form-input" type="color" name="color" value="${lt.color}"></div>
        </div>
        <div class="app-form-row">
          <div class="app-form-group" style="flex-direction:row;align-items:center;gap:10px">
            <label>${t('settings.withSalary')}</label>
            <div class="toggle-switch ${lt.paid?'on':''}" id="edit-paid" onclick="this.classList.toggle('on')"></div>
          </div>
          <div class="app-form-group" style="flex-direction:row;align-items:center;gap:10px">
            <label>${t('settings.carryOver')}</label>
            <div class="toggle-switch ${lt.carry?'on':''}" id="edit-carry" onclick="this.classList.toggle('on')"></div>
          </div>
        </div>
        <div class="modal-footer" style="padding:0;margin-top:16px">
          <button type="button" class="btn btn-secondary" onclick="App.closeModal()">${t('common.cancel')}</button>
          <button type="submit" class="btn btn-primary"><i class="fas fa-save"></i> ${t('common.save')}</button>
        </div>
      </form>
    `, {size:'sm'});
  },

  _saveLeaveType(e, key) {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target));
    const lt = this._getLeaveTypes().find(x => x.key === key);
    if (lt) {
      lt.l     = data.l;
      lt.days  = parseInt(data.days)||0;
      lt.color = data.color;
      lt.paid  = document.getElementById('edit-paid')?.classList.contains('on') || false;
      lt.carry = document.getElementById('edit-carry')?.classList.contains('on') || false;
      DB.saveCompany();
      App.toast(t('settings.toastLeaveTypesSaved'), 'success');
      App.closeModal();
      this._renderSection();
    }
  },

  addLeaveType() {
    App.openModal(t('settings.addLeaveType'), `
      <form onsubmit="SettingsModule._saveNewLeaveType(event)">
        <div class="app-form-group"><label>${t('settings.leaveName')}</label><input class="app-form-input" name="l" required></div>
        <div class="app-form-row">
          <div class="app-form-group"><label>${t('settings.leaveBalance')}</label><input class="app-form-input" type="number" name="days" value="5" min="0"></div>
          <div class="app-form-group"><label>${t('common.color','اللون')}</label><input class="app-form-input" type="color" name="color" value="#6366f1"></div>
        </div>
        <div class="modal-footer" style="padding:0;margin-top:16px">
          <button type="button" class="btn btn-secondary" onclick="App.closeModal()">${t('common.cancel')}</button>
          <button type="submit" class="btn btn-primary"><i class="fas fa-plus"></i> ${t('common.add')}</button>
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
    App.toast(t('settings.toastLeaveTypesSaved'), 'success');
    this._renderSection();
  },

  deleteLeaveType(key) {
    App.confirm(t('settings.toastHolidayDeleted'), () => {
      DB.company.leaveTypes = this._getLeaveTypes().filter(x => x.key !== key);
      DB.saveCompany();
      App.toast(t('settings.toastLeaveTypesSaved'), 'success');
      this._renderSection();
    });
  },

  resetAllPasswords() {
    const defaultPass = 'Attendify@2025';
    DB.employees.forEach(emp => { emp.password = defaultPass; });
    DB.adminCredentials.password = defaultPass;
    DB.save();
    App.toast(`${t('settings.toastSettingsSaved')}: ${defaultPass}`, 'success', 5000);
  },

  /* ══════════════════════════════════════════
     3. ATTENDANCE SETTINGS
  ══════════════════════════════════════════ */
  _attendance() {
    return `
      ${this._group(t('attendance.method'), t('settings.attendanceRulesDesc'),`
        ${[
          {icon:'fas fa-face-smile',   color:'#6366f1', l:t('attendance.faceRecog'),  d:currentLang==='ar'?`face-api.js — يتطلب تسجيل وجه الموظف من ملفه الشخصي`:`face-api.js — requires employee face registration`, on:true},
          {icon:'fas fa-fingerprint',  color:'#10b981', l:t('login.fingerprint'),     d:`WebAuthn — Windows Hello / Touch ID / Face ID`,                                                             on: typeof PublicKeyCredential !== 'undefined'},
          {icon:'fas fa-qrcode',       color:'#f59e0b', l:t('attendance.qrScan'),     d:currentLang==='ar'?'رمز QR شخصي لكل موظف':'Personal QR code per employee',                                  on:true},
          {icon:'fas fa-map-pin',      color:'#3b82f6', l:t('nav.gps'),               d:`Geolocation API (${DB.company.gpsLat?(currentLang==='ar'?'✅ تم تحديد الموقع':'✅ Location set'):(currentLang==='ar'?'⚠️ حدد موقع الشركة في الإعدادات':'⚠️ Set company location in settings')})`, on:true},
          {icon:'fas fa-keyboard',     color:'#06b6d4', l:t('attendance.manual'),     d:currentLang==='ar'?'إدخال الوقت يدوياً من الإدارة':'Manual time entry by admin',                           on:true},
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

      ${this._group(t('settings.attendanceRules'),t('settings.attendanceRulesDesc'),`
        <div class="app-form-row">
          <div class="app-form-group">
            <label>${t('settings.earlyCheckin')}</label>
            <input class="app-form-input" type="number" value="30" min="0">
            <span style="font-size:11px;color:var(--text-muted)">${t('settings.earlyCheckinHint')}</span>
          </div>
          <div class="app-form-group">
            <label>${t('settings.earlyCheckout')}</label>
            <input class="app-form-input" type="number" value="15" min="0">
            <span style="font-size:11px;color:var(--text-muted)">${t('settings.earlyCheckoutHint')}</span>
          </div>
          <div class="app-form-group">
            <label>${t('settings.maxWorkHours')}</label>
            <input class="app-form-input" type="number" value="12" min="8">
          </div>
        </div>
        <div style="margin-top:8px">
          ${this._row(t('settings.requireCheckout'),t('settings.requireCheckoutDesc'),this._toggle('require-out',true))}
          ${this._row(t('settings.allowRemote'),t('settings.allowRemoteDesc'),this._toggle('allow-remote',false))}
          ${this._row(t('settings.instantLate'),t('settings.instantLateDesc'),this._toggle('instant-late',true))}
          ${this._row(t('settings.mobileAttendance'),t('settings.mobileAttendanceDesc'),this._toggle('mobile-att',true))}
        </div>
      `)}

      ${this._group(t('settings.gpsZones'),t('settings.gpsZonesDesc'),`
        <div id="gps-zones-list" style="display:flex;flex-direction:column;gap:10px;margin-bottom:14px">
          ${SettingsModule._renderGpsZones()}
        </div>
        <button type="button" class="btn btn-outline-primary btn-sm" onclick="SettingsModule.addGpsZone()">
          <i class="fas fa-plus"></i> ${t('settings.addGpsZone')}
        </button>
        ${this._row(t('settings.dualVerify'),t('settings.dualVerifyDesc'),this._toggle('dual-verify',false))}
      `)}

      ${this._saveBtn("SettingsModule.saveAttendanceSettings()")}
    `;
  },

  _renderGpsZones() {
    if (!DB.locations.length) {
      return `<div style="text-align:center;padding:24px;background:var(--bg-input);border-radius:12px;color:var(--text-muted);font-size:13px">
        <i class="fas fa-map-pin" style="font-size:28px;display:block;margin-bottom:8px;opacity:.4"></i>
        ${t('settings.noGpsZones')}
      </div>`;
    }
    return DB.locations.map((loc, i) => `
      <div class="gps-zone-card" id="gzone-${loc.id}" style="border:1.5px solid var(--border);border-radius:14px;padding:16px;background:var(--bg-input);position:relative">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;flex-wrap:wrap">
          <div style="width:34px;height:34px;border-radius:10px;background:linear-gradient(135deg,#6366f1,#8b5cf6);display:flex;align-items:center;justify-content:center;color:#fff;font-size:14px;flex-shrink:0">
            <i class="fas fa-map-pin"></i>
          </div>
          <input class="app-form-input" type="text" placeholder="${t('settings.gpsZoneNamePlaceholder')}"
            value="${loc.name||''}" onchange="SettingsModule._updateZoneField('${loc.id}','name',this.value)"
            style="flex:1;min-width:160px;font-weight:700">
          <div style="display:flex;align-items:center;gap:6px;flex-shrink:0">
            <label style="font-size:11px;color:var(--text-muted)">${t('settings.active')}</label>
            <div class="toggle-switch ${loc.active!==false?'active':''}" onclick="SettingsModule._toggleZoneActive('${loc.id}',this)"
              style="width:36px;height:20px;border-radius:10px;cursor:pointer;transition:.2s;background:${loc.active!==false?'var(--primary)':'var(--border)'}">
              <div style="width:16px;height:16px;border-radius:50%;background:#fff;margin-top:2px;transition:.2s;margin-inline-start:${loc.active!==false?'18px':'2px'}"></div>
            </div>
          </div>
          <button onclick="SettingsModule._deleteZone('${loc.id}')" title="${t('common.delete')}"
            style="width:30px;height:30px;border-radius:8px;border:none;background:var(--danger-bg,#fee2e2);color:var(--danger,#ef4444);cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:12px;flex-shrink:0">
            <i class="fas fa-trash"></i>
          </button>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:10px">
          <div>
            <label style="font-size:11px;color:var(--text-muted);display:block;margin-bottom:4px">${t('settings.latitude')}</label>
            <input class="app-form-input" type="number" step="0.000001" placeholder="24.7136"
              value="${loc.lat||''}" onchange="SettingsModule._updateZoneField('${loc.id}','lat',parseFloat(this.value))"
              style="font-size:13px;padding:8px 10px">
          </div>
          <div>
            <label style="font-size:11px;color:var(--text-muted);display:block;margin-bottom:4px">${t('settings.longitude')}</label>
            <input class="app-form-input" type="number" step="0.000001" placeholder="46.6753"
              value="${loc.lng||''}" onchange="SettingsModule._updateZoneField('${loc.id}','lng',parseFloat(this.value))"
              style="font-size:13px;padding:8px 10px">
          </div>
          <div>
            <label style="font-size:11px;color:var(--text-muted);display:block;margin-bottom:4px">${t('settings.radius')}</label>
            <input class="app-form-input" type="number" min="30" max="5000" placeholder="200"
              value="${loc.radius||200}" onchange="SettingsModule._updateZoneField('${loc.id}','radius',parseInt(this.value))"
              style="font-size:13px;padding:8px 10px">
          </div>
        </div>
        <button type="button" class="btn btn-outline-primary btn-sm" onclick="SettingsModule._detectZoneGPS('${loc.id}')">
          <i class="fas fa-crosshairs"></i> ${t('settings.detectMyLocation')}
        </button>
        <span id="gzone-status-${loc.id}" style="font-size:11px;color:var(--text-muted);margin-inline-start:10px">
          ${loc.lat && loc.lng ? `<span style="color:var(--success)"><i class="fas fa-circle-check"></i> ${Number(loc.lat).toFixed(4)}, ${Number(loc.lng).toFixed(4)}</span>` : ''}
        </span>
      </div>
    `).join('');
  },

  addGpsZone() {
    const newZone = {
      id:     DB.nextId('loc'),
      name:   '',
      lat:    null,
      lng:    null,
      radius: 200,
      active: true,
    };
    DB.locations.push(newZone);
    DB.save();
    const list = document.getElementById('gps-zones-list');
    if (list) {
      list.innerHTML = this._renderGpsZones();
    }
    // Focus the name input of the new card
    setTimeout(() => {
      const card = document.getElementById(`gzone-${newZone.id}`);
      card?.querySelector('input[type="text"]')?.focus();
    }, 50);
  },

  _updateZoneField(id, field, value) {
    const loc = DB.locations.find(l => l.id === id);
    if (!loc) return;
    loc[field] = value;
    DB.save();
  },

  _toggleZoneActive(id, btn) {
    const loc = DB.locations.find(l => l.id === id);
    if (!loc) return;
    loc.active = !loc.active;
    DB.save();
    btn.style.background = loc.active ? 'var(--primary)' : 'var(--border)';
    const dot = btn.querySelector('div');
    if (dot) dot.style.marginInlineStart = loc.active ? '18px' : '2px';
    btn.classList.toggle('active', loc.active);
  },

  _deleteZone(id) {
    if (!confirm('حذف هذه المنطقة؟')) return;
    const idx = DB.locations.findIndex(l => l.id === id);
    if (idx !== -1) DB.locations.splice(idx, 1);
    DB.save();
    const list = document.getElementById('gps-zones-list');
    if (list) list.innerHTML = this._renderGpsZones();
    App.toast(currentLang==='ar'?'تم حذف المنطقة':'Zone deleted', 'success');
  },

  _detectZoneGPS(id) {
    const status = document.getElementById(`gzone-status-${id}`);
    if (status) status.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${currentLang==='ar'?'جارٍ التحديد...':'Locating...'}`;
    if (!navigator.geolocation) {
      if (status) status.innerHTML = `<span style="color:var(--danger)">${currentLang==='ar'?'المتصفح لا يدعم GPS':'GPS not supported by this browser'}</span>`;
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const loc = DB.locations.find(l => l.id === id);
        if (loc) { loc.lat = lat; loc.lng = lng; DB.save(); }
        // Update inputs in the card
        const card = document.getElementById(`gzone-${id}`);
        if (card) {
          const inputs = card.querySelectorAll('input[type="number"]');
          if (inputs[0]) inputs[0].value = lat.toFixed(6);
          if (inputs[1]) inputs[1].value = lng.toFixed(6);
        }
        const accLabel = currentLang === 'ar' ? `دقة ±${Math.round(pos.coords.accuracy)}م` : `±${Math.round(pos.coords.accuracy)}m accuracy`;
        if (status) status.innerHTML = `<span style="color:var(--success)"><i class="fas fa-circle-check"></i> ${lat.toFixed(4)}, ${lng.toFixed(4)} — ${accLabel}</span>`;
        App.toast(t('settings.toastSettingsSaved'), 'success');
      },
      (err) => {
        const msgs = currentLang === 'ar'
          ? { 1:'رُفض إذن الموقع', 2:'تعذّر التحديد', 3:'انتهت المهلة' }
          : { 1:'Location permission denied', 2:'Could not determine location', 3:'Timed out' };
        if (status) status.innerHTML = `<span style="color:var(--danger)"><i class="fas fa-triangle-exclamation"></i> ${msgs[err.code]||err.message}</span>`;
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  },

  saveAttendanceSettings() {
    DB.saveCompany();
    DB.save();
    App.toast(t('settings.toastSettingsSaved'), 'success');
  },

  detectCompanyGPS() {
    const status = document.getElementById('gps-status');
    if (status) status.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${currentLang==='ar'?'جارٍ تحديد الموقع...':'Locating...'}`;
    if (!navigator.geolocation) {
      if (status) status.innerHTML = `<span style="color:var(--danger)">${currentLang==='ar'?'المتصفح لا يدعم GPS':'GPS not supported by this browser'}</span>`;
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
        const locLabel = currentLang==='ar'?`تم التحديد: ${lat.toFixed(4)}, ${lon.toFixed(4)} — دقة ±${Math.round(pos.coords.accuracy)}م`:`Set: ${lat.toFixed(4)}, ${lon.toFixed(4)} — ±${Math.round(pos.coords.accuracy)}m`;
        if (status) status.innerHTML = `<span style="color:var(--success)"><i class="fas fa-circle-check"></i> ${locLabel}</span>`;
        App.toast(currentLang==='ar'?'تم تحديد موقع الشركة بنجاح':'Company location set successfully', 'success');
      },
      (err) => {
        const msgs = currentLang==='ar'
          ? { 1:'تم رفض إذن الموقع — فعّل الإذن من المتصفح', 2:'تعذّر تحديد الموقع', 3:'انتهت مهلة الطلب' }
          : { 1:'Location permission denied — enable in browser', 2:'Could not determine location', 3:'Request timed out' };
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
      ${this._group(t('leaves.leaveTypes'),t('settings.leaveTypesDesc'),`
        <div class="table-wrapper" style="border:none;border-radius:0">
          <table class="data-table">
            <thead>
              <tr>
                <th>${t('leaves.type')}</th>
                <th>${t('settings.annualBalance')}</th>
                <th>${t('settings.withSalary')}</th>
                <th>${t('settings.carryOver')}</th>
                <th>${t('common.actions')}</th>
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
                    <span style="font-size:12px;color:var(--text-muted)"> ${t('leaves.days')}</span>
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
          <i class="fas fa-plus"></i> ${t('settings.addLeaveType')}
        </button>
      `)}

      ${this._group(t('settings.approvalPolicy'),t('settings.approvalPolicyDesc'),`
        ${this._row(t('settings.autoApprove'),t('settings.autoApproveDesc'),this._toggle('auto-approve',false))}
        ${this._row(t('settings.managerApprove'),t('settings.managerApproveDesc'),this._toggle('mgr-approve',true))}
        ${this._row(t('settings.hrApprove'),t('settings.hrApproveDesc'),this._toggle('hr-approve',true))}
        ${this._row(t('settings.teamNotify'),t('settings.teamNotifyDesc'),this._toggle('team-notif',true))}
        <div class="app-form-group" style="margin-top:12px">
          <label>${t('settings.minRequestDays')}</label>
          <input class="app-form-input" type="number" value="2" min="0" style="width:100px">
        </div>
      `)}

      ${this._group(t('settings.carryOver'),t('settings.carryOverDesc'),`
        <div class="app-form-row">
          <div class="app-form-group">
            <label>${t('settings.maxCarryOver')}</label>
            <input class="app-form-input" type="number" value="10" min="0">
          </div>
          <div class="app-form-group">
            <label>${t('settings.carryExpiry')}</label>
            ${this._select('carry-exp',[{v:'3',l:t('settings.months3')},{v:'6',l:t('settings.months6')},{v:'12',l:t('settings.year1')},{v:'0',l:t('settings.noExpiry')}],'6')}
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
      ${this._group(t('settings.payrollCycle'),t('settings.payrollCycleDesc'),`
        <div class="app-form-row">
          <div class="app-form-group">
            <label>${t('settings.cycleLabel')}</label>
            ${this._select('pay-cycle',[{v:'monthly',l:t('settings.cycleMonthly')},{v:'biweekly',l:t('settings.cycleBiweekly')},{v:'weekly',l:t('settings.cycleWeekly')}], DB.company.payrollCycle || 'monthly')}
          </div>
          <div class="app-form-group">
            <label>${t('settings.payDay')}</label>
            <input class="app-form-input" id="pay-day" type="number" value="${DB.company.salaryDay ?? 28}" min="1" max="31">
          </div>
          <div class="app-form-group">
            <label>${t('settings.defaultCurrency')}</label>
            ${this._select('pay-curr',[{v:'SAR',l:'SAR — ريال'},{v:'USD',l:'USD — دولار'},{v:'AED',l:'AED — درهم'}], DB.company.payrollCurrency || 'SAR')}
          </div>
        </div>
        ${this._row(t('settings.autoPayroll'),t('settings.autoPayrollDesc'),this._toggle('auto-payroll', !!DB.company.autoPayroll))}
        ${this._row(t('settings.lateDeductPayroll'),t('settings.lateDeductPayrollDesc'),this._toggle('late-deduct', DB.company.lateDeduct !== false))}
        ${this._row(t('settings.autoOtPay'),t('settings.autoOtPayDesc'),this._toggle('auto-ot-pay', DB.company.autoOtPay !== false))}
      `)}

      ${this._group(t('settings.payrollComponents'),t('settings.payrollComponentsDesc'),`
        ${(() => {
          const pc = DB.company.payrollComponents || {};
          return [
            {lKey:'settings.basicSalary',       dKey:'settings.basicSalaryDesc',              key:null,              fixed:true},
            {lKey:'settings.housingAllowance',   dKey:'settings.housingAllowanceDesc',          key:'housing',         fixed:false},
            {lKey:'settings.transportAllowance', dKey:'settings.transportAllowanceDesc',        key:'transport',       fixed:false},
            {lKey:'settings.phoneAllowance',     dKey:'settings.phoneAllowanceDesc',            key:'phone',           fixed:false},
            {lKey:'settings.specialAllowance',   dKey:'settings.specialAllowanceDesc',          key:'special',         fixed:false},
            {lKey:'settings.annualBonus',        dKey:'settings.annualBonusDesc',               key:'annualBonus',     fixed:false},
            {lKey:'settings.performanceBonus',   dKey:'settings.performanceBonusDesc',          key:'performanceBonus',fixed:false},
          ].map(c=>`
            <div class="settings-item">
              <div class="settings-item-info">
                <div class="settings-item-label">${t(c.lKey)} ${c.fixed?`<span style="font-size:10px;background:var(--primary-bg);color:var(--primary);padding:2px 6px;border-radius:4px;font-weight:600">${t('settings.mandatory')}</span>`:''}</div>
                <div class="settings-item-desc">${t(c.dKey)}</div>
              </div>
              ${c.fixed ? `<span style="font-size:12px;color:var(--text-muted)">${t('settings.alwaysEnabled')}</span>` : this._toggle('pc-'+c.key, !!pc[c.key])}
            </div>
          `).join('');
        })()}
      `)}

      ${this._saveBtn("SettingsModule.savePayrollSettings()")}
    `;
  },

  savePayrollSettings() {
    // Payroll cycle fields
    const cycleEl = document.getElementById('pay-cycle');
    const dayEl   = document.getElementById('pay-day');
    const currEl  = document.getElementById('pay-curr');
    if (cycleEl) DB.company.payrollCycle    = cycleEl.value;
    if (dayEl)   DB.company.salaryDay       = parseInt(dayEl.value) || 28;
    if (currEl)  DB.company.payrollCurrency = currEl.value;

    // Toggle switches
    const togEl = id => document.getElementById(id)?.classList.contains('on');
    DB.company.autoPayroll = !!togEl('auto-payroll');
    DB.company.lateDeduct  = !!togEl('late-deduct');
    DB.company.autoOtPay   = !!togEl('auto-ot-pay');

    // Payroll components toggles
    if (!DB.company.payrollComponents) DB.company.payrollComponents = {};
    const pc = DB.company.payrollComponents;
    ['housing','transport','phone','special','annualBonus','performanceBonus'].forEach(k => {
      const el = document.getElementById('pc-' + k);
      if (el) pc[k] = el.classList.contains('on');
    });

    DB.saveCompany();
    App.toast(t('settings.toastSettingsSaved'), 'success');
  },

  /* ══════════════════════════════════════════
     6. EMPLOYEE PORTAL
  ══════════════════════════════════════════ */
  _portal() {
    const ps = DB.company.portalSettings || {};
    return `
      ${this._group(t('settings.portalEnable'),t('settings.portalEnableDesc'),`
        ${this._row(t('settings.portalEnabled'),t('settings.portalEnabledDesc'),this._toggle('ps-enabled',  ps.enabled  !== false))}
        ${this._row(t('settings.portalCheckin'),t('settings.portalCheckinDesc'),this._toggle('ps-checkin',  ps.checkin  !== false))}
        ${this._row(t('settings.portalLeaves'),t('settings.portalLeavesDesc'),this._toggle('ps-leaves',   ps.leaves   !== false))}
        ${this._row(t('settings.portalPayslip'),t('settings.portalPayslipDesc'),this._toggle('ps-payslip',  ps.payslip  !== false))}
        ${this._row(t('settings.portalProfile'),t('settings.portalProfileDesc'),this._toggle('ps-profile',  ps.profile  !== false))}
        ${this._row(t('settings.portalMsg'),t('settings.portalMsgDesc'),this._toggle('ps-msg',      !!ps.msg))}
      `)}

      ${this._group(t('settings.passwordSettings'),t('settings.passwordSettingsDesc'),`
        <div class="app-form-row">
          <div class="app-form-group">
            <label>${t('settings.defaultPassword')}</label>
            ${this._select('portal-defpass',[{v:'code',l:t('settings.passOptionCode')},{v:'phone4',l:t('settings.passOptionPhone4')},{v:'custom',l:t('settings.passOptionCustom')}],'code')}
          </div>
          <div class="app-form-group">
            <label>${t('settings.minPasswordLength')}</label>
            <input class="app-form-input" type="number" value="6" min="4">
          </div>
        </div>
        ${this._row(t('settings.forcePasswordChange'),t('settings.forcePasswordChangeDesc'),this._toggle('ps-forceChange', ps.forceChange !== false))}
      `)}

      ${this._group(t('settings.resetPasswords'),t('settings.resetPasswordsDesc'),`
        <div style="background:var(--warning-bg,rgba(245,158,11,0.08));border:1px solid rgba(245,158,11,0.2);border-radius:12px;padding:14px;margin-bottom:12px;display:flex;gap:10px;align-items:flex-start">
          <i class="fas fa-triangle-exclamation" style="color:var(--warning);margin-top:2px"></i>
          <div style="font-size:13px;color:var(--text-secondary)">
            ${t('settings.resetPasswordsWarning')}
          </div>
        </div>
        <button class="btn btn-warning btn-sm" onclick="if(confirm('${t('settings.resetPasswordsConfirm')}')) SettingsModule.resetAllPasswords()">
          <i class="fas fa-key"></i> ${t('settings.resetAllPasswords')}
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
    App.toast(t('settings.toastSettingsSaved'), 'success');
  },

  /* ══════════════════════════════════════════
     7. NOTIFICATIONS
  ══════════════════════════════════════════ */
  _notifications() {
    const events = [
      {id:'late-duty',    l:t('settings.evLate'),          d:t('settings.evLateDesc'),          on:true},
      {id:'absence',      l:t('settings.evAbsence'),       d:t('settings.evAbsenceDesc'),       on:true},
      {id:'leave-req',    l:t('settings.evLeaveReq'),      d:t('settings.evLeaveReqDesc'),      on:true},
      {id:'leave-apr',    l:t('settings.evLeaveApproved'), d:t('settings.evLeaveApprovedDesc'), on:true},
      {id:'leave-rej',    l:t('settings.evLeaveRejected'), d:t('settings.evLeaveRejectedDesc'), on:true},
      {id:'payroll-proc', l:t('settings.evPayroll'),       d:t('settings.evPayrollDesc'),       on:true},
      {id:'daily-report', l:t('settings.evDailyReport'),   d:t('settings.evDailyReportDesc'),   on:true},
    ];

    return `
      ${this._group(t('settings.waApiSettings'),t('settings.waApiSettingsDesc'),`
        <div id="wa-api-section">${WhatsApp.renderApiSettings()}</div>
      `)}

      ${this._group(t('settings.waTemplates'),t('settings.waTemplatesDesc'),`
        <div style="font-size:12px;color:var(--text-muted);margin-bottom:12px">
          <i class="fas fa-info-circle"></i>
          ${t('settings.availableVars')}: <code style="background:var(--bg);padding:2px 6px;border-radius:4px">{name}</code>
          <code style="background:var(--bg);padding:2px 6px;border-radius:4px">{date}</code>
          <code style="background:var(--bg);padding:2px 6px;border-radius:4px">{minutes}</code>
          <code style="background:var(--bg);padding:2px 6px;border-radius:4px">{from}</code>
          <code style="background:var(--bg);padding:2px 6px;border-radius:4px">{to}</code>
          <code style="background:var(--bg);padding:2px 6px;border-radius:4px">{days}</code>
          <code style="background:var(--bg);padding:2px 6px;border-radius:4px">{amount}</code>
        </div>

        ${[
          { key:'absence',         label:t('settings.tplAbsence') },
          { key:'late',            label:t('settings.tplLate') },
          { key:'warning',         label:t('settings.tplWarning') },
          { key:'leaveApproved',   label:t('settings.tplLeaveApproved') },
          { key:'leaveRejected',   label:t('settings.tplLeaveRejected') },
          { key:'requestApproved', label:t('settings.tplRequestApproved') },
          { key:'requestRejected', label:t('settings.tplRequestRejected') },
          { key:'salaryReady',     label:t('settings.tplSalaryReady') },
        ].map(tpl=>`
          <div class="app-form-group">
            <label>${tpl.label}</label>
            <textarea class="app-form-input" id="wa-tpl-${tpl.key}" rows="3" style="resize:vertical;font-size:12px;line-height:1.7">${WhatsApp.templates[tpl.key]?.text||''}</textarea>
          </div>
        `).join('')}

        <button class="btn btn-primary" onclick="SettingsModule.saveWATemplates()">
          <i class="fas fa-save"></i> ${t('settings.saveTemplates')}
        </button>
      `)}

      ${this._group(t('settings.notifEvents'),t('settings.notifEventsDesc'),`
        ${events.map(ev=>`
          <div class="settings-item">
            <div class="settings-item-info">
              <div class="settings-item-label">${ev.l}</div>
              <div class="settings-item-desc">${ev.d}</div>
            </div>
            ${this._toggle('ev-'+ev.id, ev.on)}
          </div>
        `).join('')}
      `)}
    `;
  },

  toggleWA(on) {
    WhatsApp.config.enabled = on;
    App.toast(on
      ? (currentLang==='ar' ? 'تم تفعيل إشعارات WhatsApp ✅' : 'WhatsApp notifications enabled ✅')
      : (currentLang==='ar' ? 'تم تعطيل إشعارات WhatsApp' : 'WhatsApp notifications disabled'),
      on ? 'success' : 'info');
  },

  toggleWAToken() { /* not used in wa.me mode */ },

  saveWAConfig() {
    App.toast(currentLang==='ar'?'لا حاجة لإعدادات — الخدمة مجانية وتعمل تلقائياً ✅':'No configuration needed — free service, works automatically ✅', 'success');
  },

  async testWA() {
    const phone = document.getElementById('wa-test-phone')?.value?.trim();
    if (!phone) { App.toast(currentLang==='ar'?'أدخل رقم الهاتف للاختبار':'Enter a phone number to test', 'warning'); return; }
    const msg = currentLang==='ar'
      ? `مرحباً من Attendify Pro 👋\nهذه رسالة اختبار لتأكيد عمل الإشعارات.\n\n${DB.company.name || 'فريق الموارد البشرية'}`
      : `Hello from Attendify Pro 👋\nThis is a test message to confirm notifications work.\n\n${DB.company.nameEn || DB.company.name || 'HR Team'}`;
    const ok = await WhatsApp.send(phone, msg);
    if (ok) App.toast(WhatsApp.isApiReady()
      ? (currentLang==='ar'?'✅ أُرسلت الرسالة تلقائياً':'✅ Message sent automatically')
      : (currentLang==='ar'?'✅ تم فتح واتساب — اضغط إرسال':'✅ WhatsApp opened — tap Send'),
      'success');
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
    App.toast(currentLang==='ar'?'تم حفظ قوالب WhatsApp ✅':'WhatsApp templates saved ✅', 'success');
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
              <button class="btn btn-warning" onclick="SettingsModule.syncFromLocal()" ${sbConn?'':'disabled'} title="ارفع بيانات هذا الجهاز للسيرفر">
                <i class="fas fa-upload"></i> استعادة بيانات هذا الجهاز
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
    const setupLabel = currentLang==='ar'?'إعداد':'Setup';
    App.openModal(`${setupLabel} ${name}`, `
      <form onsubmit="event.preventDefault();App.closeModal();App.toast(t('settings.toastSettingsSaved'),'success')">
        ${configs[type]||`<div class="app-form-group"><label>API Endpoint</label><input class="app-form-input" dir="ltr"></div><div class="app-form-group"><label>Secret Key</label><input class="app-form-input" type="password"></div>`}
        <button type="button" class="btn btn-secondary btn-sm" onclick="SettingsModule.testWebhook(this.closest('form'))"><i class="fas fa-plug"></i> ${currentLang==='ar'?'اختبار الاتصال':'Test Connection'}</button>
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
    App.toast(currentLang==='ar'?'تم توليد مفتاح API جديد ✓':'New API key generated ✓', 'success');
  },

  copyApiKey() {
    const inp = document.getElementById('api-key');
    const val = inp?.value || localStorage.getItem('attendify-api-key');
    if (!val) { App.toast(currentLang==='ar'?'لا يوجد مفتاح — أنشئ مفتاحاً أولاً':'No key — generate one first', 'warning'); return; }
    navigator.clipboard?.writeText(val).then(() => App.toast(currentLang==='ar'?'تم نسخ المفتاح ✓':'Key copied ✓', 'success'))
      .catch(() => { if (inp) { inp.select(); document.execCommand('copy'); App.toast(currentLang==='ar'?'تم النسخ':'Copied', 'success'); } });
  },

  async testWebhook(form) {
    const urlEl = form?.querySelector('input[placeholder*="webhook"], input[dir="ltr"]');
    const url = urlEl?.value?.trim();
    if (!url) { App.toast(currentLang==='ar'?'أدخل Webhook URL أولاً':'Enter a Webhook URL first', 'warning'); return; }
    App.toast(currentLang==='ar'?'جارٍ اختبار الاتصال...':'Testing connection...', 'info', 3000);
    try {
      await fetch(url, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({test:true, from:'Attendify Pro', timestamp: new Date().toISOString()}) });
      App.toast(currentLang==='ar'?'تم الاتصال بنجاح ✓':'Connected successfully ✓', 'success');
    } catch {
      App.toast(currentLang==='ar'?'تعذّر الاتصال — تحقق من الرابط':'Connection failed — check the URL', 'error');
    }
  },

  // ── SUPABASE ACTIONS ─────────────────────────────────────

  async supabaseSave() {
    const url = sanitizeUrl(document.getElementById('sb-url')?.value?.trim());
    const key = sanitizeText(document.getElementById('sb-key')?.value?.trim());
    if (!url || !key) { App.toast(currentLang==='ar'?'أدخل الرابط والمفتاح أولاً':'Enter URL and key first','warning'); return; }
    App.toast(currentLang==='ar'?'جارٍ الاتصال بـ Supabase...':'Connecting to Supabase...','info');
    const connectingLabel = currentLang==='ar'?'جارٍ الاتصال...':'Connecting...';
    document.getElementById('sb-status-badge').innerHTML = `<span class="badge badge-warning badge-dot">${connectingLabel}</span>`;
    const ok = await SupabaseDB.saveConfig(url, key);
    // Refresh integrations section to show updated status
    setTimeout(() => this.switchSection('integrations'), 800);
  },

  async supabaseSync() {
    await SupabaseDB.syncAll();
  },

  async syncFromLocal() {
    await SupabaseDB.syncFromLocal();
  },

  supabaseDisconnect() {
    App.confirm(
      currentLang==='ar'?'هل تريد قطع الاتصال بـ Supabase؟ ستظل البيانات محفوظة محلياً.':'Disconnect from Supabase? Your data will remain saved locally.',
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
                  ${App.renderAvatar(user, 28, 8)}
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
    App.toast(t('settings.toastSettingsSaved'), 'success');
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
    const hasLocal = (() => { try { const r = localStorage.getItem('attendify-db'); if (!r) return false; const s = JSON.parse(r); return ['employees','attendance','leaves'].some(k => Array.isArray(s[k]) && s[k].length > 0); } catch(e) { return false; } })();
    const isConn   = typeof SupabaseDB !== 'undefined' && SupabaseDB.isConnected;
    return `
      ${hasLocal ? `
      <div style="background:linear-gradient(135deg,#fef3c7,#fde68a);border:2px solid #f59e0b;border-radius:14px;padding:18px 20px;margin-bottom:20px;display:flex;align-items:center;gap:16px">
        <i class="fas fa-triangle-exclamation" style="font-size:28px;color:#d97706;flex-shrink:0"></i>
        <div style="flex:1">
          <div style="font-size:14px;font-weight:800;color:#92400e;margin-bottom:4px">يوجد بيانات محفوظة على هذا الجهاز فقط</div>
          <div style="font-size:12.5px;color:#78350f">هذه البيانات غير موجودة على الأجهزة الأخرى. اضغط الزر لرفعها للسيرفر.</div>
        </div>
        <button class="btn btn-primary" style="background:#d97706;border-color:#d97706;flex-shrink:0;white-space:nowrap" onclick="SettingsModule.syncFromLocal()" ${isConn ? '' : 'disabled'}>
          <i class="fas fa-upload"></i> رفع بيانات هذا الجهاز
        </button>
      </div>` : ''}

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
              <select class="app-form-input app-form-select" id="backup-loc" style="min-width:200px"
                onchange="SettingsModule._onBackupLocChange(this.value)">
                ${[{v:'local',l:'خادم محلي'},{v:'s3',l:'Amazon S3'},{v:'drive',l:'Google Drive'},{v:'azure',l:'Azure Blob'}]
                  .map(o=>`<option value="${o.v}" ${o.v==(bs.loc||'local')?'selected':''}>${o.l}</option>`).join('')}
              </select>
            </div>

            <!-- Google Drive config -->
            <div id="backup-drive-cfg" style="display:${(bs.loc||'local')==='drive'?'block':'none'}">
              <div class="app-form-group">
                <label><i class="fab fa-google-drive" style="color:#4285f4"></i> بريد Google الإلكتروني</label>
                <input class="app-form-input" id="backup-drive-email" type="email"
                  placeholder="example@gmail.com" value="${bs.driveEmail||''}" dir="ltr">
              </div>
              <div class="app-form-group">
                <label>معرّف المجلد (اختياري)</label>
                <input class="app-form-input" id="backup-drive-folder" type="text"
                  placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms" value="${bs.driveFolderId||''}" dir="ltr">
                <div style="font-size:11px;color:var(--text-muted);margin-top:4px">يمكنك تركه فارغاً — سيُحفظ في المجلد الجذر</div>
              </div>
            </div>

            <!-- Amazon S3 config -->
            <div id="backup-s3-cfg" style="display:${(bs.loc||'local')==='s3'?'block':'none'}">
              <div class="app-form-row">
                <div class="app-form-group">
                  <label>اسم الـ Bucket</label>
                  <input class="app-form-input" id="backup-s3-bucket" type="text"
                    placeholder="my-company-backups" value="${bs.s3Bucket||''}" dir="ltr">
                </div>
                <div class="app-form-group">
                  <label>المنطقة (Region)</label>
                  <input class="app-form-input" id="backup-s3-region" type="text"
                    placeholder="us-east-1" value="${bs.s3Region||''}" dir="ltr">
                </div>
              </div>
            </div>

            <!-- Azure Blob config -->
            <div id="backup-azure-cfg" style="display:${(bs.loc||'local')==='azure'?'block':'none'}">
              <div class="app-form-group">
                <label>اسم الـ Container</label>
                <input class="app-form-input" id="backup-azure-container" type="text"
                  placeholder="attendify-backups" value="${bs.azureContainer||''}" dir="ltr">
              </div>
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

  _onBackupLocChange(val) {
    ['drive','s3','azure'].forEach(k => {
      const el = document.getElementById(`backup-${k}-cfg`);
      if (el) el.style.display = val === k ? 'block' : 'none';
    });
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

    // Google Drive
    const driveEmail = document.getElementById('backup-drive-email')?.value?.trim();
    if (bs.loc === 'drive') {
      if (!driveEmail || !driveEmail.includes('@')) {
        App.toast(currentLang==='ar'?'أدخل بريد Google الإلكتروني أولاً':'Enter a Google email first', 'warning'); return;
      }
      bs.driveEmail    = driveEmail;
      bs.driveFolderId = document.getElementById('backup-drive-folder')?.value?.trim() || '';
    }
    // Amazon S3
    if (bs.loc === 's3') {
      bs.s3Bucket = document.getElementById('backup-s3-bucket')?.value?.trim() || '';
      bs.s3Region = document.getElementById('backup-s3-region')?.value?.trim() || '';
    }
    // Azure
    if (bs.loc === 'azure') {
      bs.azureContainer = document.getElementById('backup-azure-container')?.value?.trim() || '';
    }

    DB.saveCompany();
    App.toast(t('settings.toastSettingsSaved'), 'success');
  },

  // ── HELPER METHODS ───────────────────────────────────────

  applyColor(hex, label) {
    document.documentElement.style.setProperty('--primary', hex);
    document.documentElement.style.setProperty('--primary-dark', hex);
    localStorage.setItem('attendify-color', hex);
    App.toast(`${currentLang==='ar'?'تم تطبيق اللون':'Color applied'}: ${label}`, 'success');
  },

  applyFontSize(size, label, btn) {
    document.documentElement.style.fontSize = size;
    localStorage.setItem('attendify-font-size', size);
    document.querySelectorAll('.btn-sm').forEach(b => b.classList.remove('btn-primary'));
    if (btn) { btn.classList.remove('btn-secondary'); btn.classList.add('btn-primary'); }
    App.toast(`${currentLang==='ar'?'تم تطبيق الحجم':'Size applied'}: ${label}`, 'success');
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
    App.toast(currentLang==='ar'
      ? `تم تصدير ${DB.employees.length} موظف و${DB.attendance.length} سجل حضور ✓`
      : `Exported ${DB.employees.length} employees and ${DB.attendance.length} attendance records ✓`,
      'success');
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
    App.toast(currentLang==='ar'
      ? `تم حذف ${deleted} سجل مراجعة و${deleted2} سجل حضور قديم ✓`
      : `Deleted ${deleted} audit logs and ${deleted2} old attendance records ✓`,
      'success');
  },

  /* ══════════════════════════════════════════
     SIGNATURES — Approvers & Free-draw / Upload
  ══════════════════════════════════════════ */
  _getSigs() {
    if (!DB.company.signatures) DB.company.signatures = [];
    return DB.company.signatures;
  },

  _signatures() {
    const sigs = this._getSigs();
    const roleColors = { 'أعدّه':'#6366f1', 'راجعه':'#f59e0b', 'اعتمده':'#10b981', 'مخصص':'#64748b', 'Prepared':'#6366f1', 'Reviewed':'#f59e0b', 'Approved':'#10b981', 'Custom':'#64748b' };
    const sigTitle = currentLang==='ar' ? 'التواقيع والاعتماد' : 'Signatures & Approval';
    const sigDesc  = currentLang==='ar' ? 'تواقيع المسؤولين التي تظهر في التقارير المطبوعة' : 'Approver signatures shown in printed reports';
    const noSigsMsg = currentLang==='ar' ? 'لا توجد تواقيع بعد — اضغط "إضافة" لإنشاء أول توقيع' : 'No signatures yet — click "Add" to create the first one';
    const addBtnLabel = currentLang==='ar' ? 'إضافة معتمد جديد' : 'Add Approver';
    const sigInfoHint = currentLang==='ar'
      ? 'تظهر التواقيع أسفل التقارير المطبوعة في خانات <strong>أعدّه / راجعه / اعتمده</strong>. يمكن إضافة أي عدد من المعتمدين ولكن يُفضل ثلاثة كحد أقصى للطباعة.'
      : 'Signatures appear at the bottom of printed reports under <strong>Prepared / Reviewed / Approved</strong>. You can add any number, but three is ideal for printing.';

    return `
      ${this._group(
        sigTitle, sigDesc,
        `
        <div id="sigs-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:14px;margin-bottom:14px">
          ${sigs.length ? sigs.map(s => this._sigCard(s)).join('') : `
            <div style="grid-column:1/-1;text-align:center;padding:32px;color:var(--text-muted);font-size:13px">
              <i class="fas fa-signature" style="font-size:32px;display:block;margin-bottom:10px;opacity:.3"></i>
              ${noSigsMsg}
            </div>
          `}
        </div>
        <button class="btn btn-outline-primary btn-sm" onclick="SettingsModule.openSigEditor()">
          <i class="fas fa-plus"></i> ${addBtnLabel}
        </button>
        `,
        `<span class="badge badge-primary">${sigs.length}</span>`
      )}

      <div style="background:var(--primary-bg);border-radius:12px;padding:14px 16px;display:flex;align-items:flex-start;gap:10px;margin-top:4px">
        <i class="fas fa-circle-info" style="color:var(--primary);margin-top:2px"></i>
        <div style="font-size:12px;color:var(--text-secondary)">${sigInfoHint}</div>
      </div>
    `;
  },

  _sigCard(s) {
    const roleColors = { 'أعدّه':'#6366f1', 'راجعه':'#f59e0b', 'اعتمده':'#10b981', 'مخصص':'#64748b', 'Prepared':'#6366f1', 'Reviewed':'#f59e0b', 'Approved':'#10b981', 'Custom':'#64748b' };
    const col = roleColors[s.role] || '#64748b';
    const noSigLabel = currentLang==='ar' ? 'لا يوجد توقيع' : 'No signature';
    return `
      <div class="card stagger-item" style="border-top:3px solid ${col};min-width:0" id="sigcard-${s.id}">
        <div class="card-body" style="padding:14px">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
            <span style="font-size:11px;font-weight:700;padding:3px 9px;border-radius:6px;background:${col}18;color:${col}">${_esc(s.role)}</span>
            <div style="display:flex;gap:4px">
              <button class="btn-icon btn" onclick="SettingsModule.openSigEditor('${s.id}')" title="${t('common.edit')}"><i class="fas fa-pencil"></i></button>
              <button class="btn-icon btn" onclick="SettingsModule.deleteSig('${s.id}')" title="${t('common.delete')}"><i class="fas fa-trash" style="color:var(--danger)"></i></button>
            </div>
          </div>
          <div style="font-size:14px;font-weight:700;color:var(--text-primary);margin-bottom:2px">${_esc(s.name)}</div>
          <div style="font-size:11px;color:var(--text-muted);margin-bottom:10px">${_esc(s.title||'')}</div>
          <div style="height:64px;border-radius:8px;border:1px dashed var(--border);background:var(--bg-input);display:flex;align-items:center;justify-content:center;overflow:hidden">
            ${s.signature
              ? `<img src="${s.signature}" style="max-height:60px;max-width:100%;object-fit:contain">`
              : `<span style="font-size:11px;color:var(--text-muted)"><i class="fas fa-signature"></i> ${noSigLabel}</span>`}
          </div>
        </div>
      </div>`;
  },

  openSigEditor(id) {
    const sigs = this._getSigs();
    const s    = id ? sigs.find(x => x.id === id) : null;
    const isAr = currentLang === 'ar';
    const roles = isAr ? ['أعدّه','راجعه','اعتمده','مخصص'] : ['Prepared','Reviewed','Approved','Custom'];
    const modalTitle = id ? (isAr?'تعديل معتمد':'Edit Approver') : (isAr?'إضافة معتمد جديد':'Add Approver');

    App.openModal(modalTitle, `
      <form onsubmit="SettingsModule.saveSig(event,'${id||''}')">
        <div class="app-form-row">
          <div class="app-form-group">
            <label>${t('common.name')} <span style="color:var(--danger)">*</span></label>
            <input class="app-form-input" name="name" value="${_esc(s?.name||'')}" required>
          </div>
          <div class="app-form-group">
            <label>${isAr?'الدور':'Role'} <span style="color:var(--danger)">*</span></label>
            <select class="app-form-input app-form-select" name="role">
              ${roles.map(r=>`<option value="${r}" ${s?.role===r?'selected':''}>${r}</option>`).join('')}
            </select>
          </div>
        </div>
        <div class="app-form-group">
          <label>${t('common.position')}</label>
          <input class="app-form-input" name="title" value="${_esc(s?.title||'')}">
        </div>

        <!-- Signature tabs -->
        <div style="margin-top:4px">
          <div style="display:flex;gap:0;border-radius:10px;overflow:hidden;border:1px solid var(--border);margin-bottom:12px">
            <button type="button" id="sig-tab-draw"
              style="flex:1;padding:8px;font-size:12px;font-weight:700;border:none;cursor:pointer;background:var(--primary);color:white"
              onclick="SettingsModule._switchSigTab('draw')">
              <i class="fas fa-pen-nib"></i> ${isAr?'رسم حر':'Free Draw'}
            </button>
            <button type="button" id="sig-tab-upload"
              style="flex:1;padding:8px;font-size:12px;font-weight:700;border:none;cursor:pointer;background:var(--bg-input);color:var(--text-secondary)"
              onclick="SettingsModule._switchSigTab('upload')">
              <i class="fas fa-upload"></i> ${isAr?'رفع صورة':'Upload Image'}
            </button>
          </div>

          <!-- Draw panel -->
          <div id="sig-panel-draw">
            <div style="position:relative;border-radius:10px;overflow:hidden;border:1.5px solid var(--border);background:#fff">
              <canvas id="sig-canvas" width="460" height="160"
                style="display:block;width:100%;height:160px;cursor:crosshair;touch-action:none"></canvas>
              <div style="position:absolute;top:6px;inset-inline-end:8px;display:flex;gap:5px">
                <select id="sig-color" onchange="SettingsModule._updatePen()"
                  style="font-size:11px;padding:3px 6px;border-radius:6px;border:1px solid var(--border);background:var(--bg);cursor:pointer">
                  <option value="#1e293b">🖊 ${isAr?'أسود':'Black'}</option>
                  <option value="#1e40af">🖊 ${isAr?'أزرق':'Blue'}</option>
                  <option value="#991b1b">🖊 ${isAr?'أحمر':'Red'}</option>
                </select>
                <select id="sig-size" onchange="SettingsModule._updatePen()"
                  style="font-size:11px;padding:3px 6px;border-radius:6px;border:1px solid var(--border);background:var(--bg);cursor:pointer">
                  <option value="2">${isAr?'رفيع':'Thin'}</option>
                  <option value="3" selected>${isAr?'متوسط':'Medium'}</option>
                  <option value="5">${isAr?'سميك':'Thick'}</option>
                </select>
                <button type="button" onclick="SettingsModule._clearCanvas()"
                  style="font-size:11px;padding:3px 8px;border-radius:6px;border:1px solid var(--border);background:var(--bg);cursor:pointer;color:var(--danger)">
                  <i class="fas fa-eraser"></i> ${isAr?'مسح':'Clear'}
                </button>
              </div>
              <div style="position:absolute;bottom:6px;inset-inline-start:10px;font-size:10px;color:#94a3b8;pointer-events:none">${isAr?'ارسم توقيعك هنا':'Draw your signature here'}</div>
            </div>
            ${s?.signature ? `
              <div style="margin-top:8px;padding:8px 12px;border-radius:8px;background:var(--bg-input);display:flex;align-items:center;gap:8px">
                <img src="${s.signature}" style="height:40px;max-width:120px;object-fit:contain;border-radius:4px">
                <span style="font-size:11px;color:var(--text-muted)">${isAr?'التوقيع المحفوظ حالياً — ارسم جديداً للتحديث':'Current saved signature — draw a new one to update'}</span>
              </div>` : ''}
          </div>

          <!-- Upload panel -->
          <div id="sig-panel-upload" style="display:none">
            <div id="sig-upload-zone"
              style="border:2px dashed var(--border);border-radius:10px;padding:24px;text-align:center;cursor:pointer;transition:.2s"
              onclick="document.getElementById('sig-file-input').click()"
              ondragover="event.preventDefault();this.style.borderColor='var(--primary)'"
              ondragleave="this.style.borderColor='var(--border)'"
              ondrop="SettingsModule._dropSig(event)">
              <i class="fas fa-cloud-upload-alt" style="font-size:28px;color:var(--primary);opacity:.5;display:block;margin-bottom:8px"></i>
              <div style="font-size:13px;font-weight:600;color:var(--text-secondary)">${isAr?'اضغط أو اسحب صورة التوقيع':'Click or drag signature image'}</div>
              <div style="font-size:11px;color:var(--text-muted);margin-top:4px">PNG, JPG, SVG — ${isAr?'شفاف الخلفية أفضل':'transparent background preferred'}</div>
            </div>
            <input type="file" id="sig-file-input" accept="image/*" style="display:none" onchange="SettingsModule._loadSigFile(this)">
            <div id="sig-upload-preview" style="display:none;margin-top:10px;text-align:center;padding:12px;border-radius:10px;background:var(--bg-input)">
              <img id="sig-upload-img" style="max-height:80px;max-width:240px;object-fit:contain">
              <div style="margin-top:8px">
                <button type="button" class="btn btn-danger btn-sm" onclick="SettingsModule._clearUpload()">
                  <i class="fas fa-trash"></i> ${t('common.delete')}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-footer" style="padding:0;margin-top:16px">
          <button type="button" class="btn btn-secondary" onclick="App.closeModal()">${t('common.cancel')}</button>
          <button type="submit" class="btn btn-primary"><i class="fas fa-save"></i> ${isAr?'حفظ التوقيع':'Save Signature'}</button>
        </div>
      </form>
    `, { size: 'md' });

    // Init canvas AFTER modal is rendered
    requestAnimationFrame(() => SettingsModule._initSigCanvas(s?.signature || null));
  },

  _switchSigTab(tab) {
    const isDraw = tab === 'draw';
    document.getElementById('sig-panel-draw').style.display   = isDraw ? ''       : 'none';
    document.getElementById('sig-panel-upload').style.display = isDraw ? 'none'   : '';
    document.getElementById('sig-tab-draw').style.background   = isDraw ? 'var(--primary)' : 'var(--bg-input)';
    document.getElementById('sig-tab-draw').style.color        = isDraw ? 'white'          : 'var(--text-secondary)';
    document.getElementById('sig-tab-upload').style.background = isDraw ? 'var(--bg-input)': 'var(--primary)';
    document.getElementById('sig-tab-upload').style.color      = isDraw ? 'var(--text-secondary)' : 'white';
  },

  _initSigCanvas(existingSig) {
    const canvas = document.getElementById('sig-canvas');
    if (!canvas) return;
    const ctx    = canvas.getContext('2d');
    let drawing  = false;

    // Scale canvas to actual pixel size
    const rect = canvas.getBoundingClientRect();
    canvas.width  = rect.width  * (window.devicePixelRatio || 1);
    canvas.height = rect.height * (window.devicePixelRatio || 1);
    ctx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);

    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth   = 3;
    ctx.lineCap     = 'round';
    ctx.lineJoin    = 'round';

    const pos = (e) => {
      const r = canvas.getBoundingClientRect();
      const src = e.touches ? e.touches[0] : e;
      return { x: src.clientX - r.left, y: src.clientY - r.top };
    };

    canvas.addEventListener('mousedown',  e => { drawing = true; const p = pos(e); ctx.beginPath(); ctx.moveTo(p.x, p.y); });
    canvas.addEventListener('mousemove',  e => { if (!drawing) return; const p = pos(e); ctx.lineTo(p.x, p.y); ctx.stroke(); });
    canvas.addEventListener('mouseup',    ()=> drawing = false);
    canvas.addEventListener('mouseleave', ()=> drawing = false);

    canvas.addEventListener('touchstart', e => { e.preventDefault(); drawing = true; const p = pos(e); ctx.beginPath(); ctx.moveTo(p.x, p.y); }, { passive: false });
    canvas.addEventListener('touchmove',  e => { e.preventDefault(); if (!drawing) return; const p = pos(e); ctx.lineTo(p.x, p.y); ctx.stroke(); }, { passive: false });
    canvas.addEventListener('touchend',   e => { e.preventDefault(); drawing = false; }, { passive: false });

    this._sigCtx = ctx;
    this._sigCanvas = canvas;
  },

  _updatePen() {
    if (!this._sigCtx) return;
    this._sigCtx.strokeStyle = document.getElementById('sig-color')?.value || '#1e293b';
    this._sigCtx.lineWidth   = parseInt(document.getElementById('sig-size')?.value) || 3;
  },

  _clearCanvas() {
    if (!this._sigCanvas || !this._sigCtx) return;
    const rect = this._sigCanvas.getBoundingClientRect();
    this._sigCtx.clearRect(0, 0, rect.width, rect.height);
  },

  _isCanvasBlank() {
    if (!this._sigCanvas) return true;
    const data = this._sigCanvas.getContext('2d').getImageData(0, 0, this._sigCanvas.width, this._sigCanvas.height).data;
    return !data.some(v => v !== 0);
  },

  _loadSigFile(input) {
    const file = input.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { App.toast(currentLang==='ar'?'حجم الصورة يجب أن يكون أقل من 2MB':'Image size must be less than 2MB', 'warning'); return; }
    const reader = new FileReader();
    reader.onload = e => {
      const preview = document.getElementById('sig-upload-preview');
      const img     = document.getElementById('sig-upload-img');
      const zone    = document.getElementById('sig-upload-zone');
      if (img) img.src = e.target.result;
      if (preview) preview.style.display = '';
      if (zone)    zone.style.display    = 'none';
    };
    reader.readAsDataURL(file);
  },

  _dropSig(e) {
    e.preventDefault();
    document.getElementById('sig-upload-zone').style.borderColor = 'var(--border)';
    const file = e.dataTransfer.files[0];
    if (!file || !file.type.startsWith('image/')) return;
    const dt = new DataTransfer();
    dt.items.add(file);
    const input = document.getElementById('sig-file-input');
    input.files = dt.files;
    this._loadSigFile(input);
  },

  _clearUpload() {
    document.getElementById('sig-upload-preview').style.display = 'none';
    document.getElementById('sig-upload-zone').style.display    = '';
    document.getElementById('sig-file-input').value = '';
  },

  saveSig(e, id) {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target));
    if (!data.name.trim()) { App.toast(currentLang==='ar'?'الاسم مطلوب':'Name is required', 'error'); return; }

    // Determine signature image source: draw vs upload
    const isUpload  = document.getElementById('sig-panel-upload')?.style.display !== 'none';
    let   sigData   = null;

    if (isUpload) {
      const img = document.getElementById('sig-upload-img');
      sigData = img?.src && img.src !== window.location.href ? img.src : null;
    } else {
      if (!this._isCanvasBlank()) {
        sigData = this._sigCanvas.toDataURL('image/png');
      }
    }

    // If editing and no new sig provided, keep existing
    const sigs = this._getSigs();
    if (id) {
      const idx = sigs.findIndex(s => s.id === id);
      if (idx !== -1) {
        sigs[idx] = { ...sigs[idx], name: data.name.trim(), role: data.role, title: data.title?.trim() || '' };
        if (sigData) sigs[idx].signature = sigData;
      }
    } else {
      sigs.push({
        id:        `sg_${Date.now()}`,
        name:      data.name.trim(),
        role:      data.role,
        title:     data.title?.trim() || '',
        signature: sigData || null,
      });
    }

    DB.saveCompany();
    App.closeModal();
    App.toast(currentLang==='ar'
      ? `تم ${id?'تحديث':'إضافة'} توقيع ${data.name} ✓`
      : `Signature ${id?'updated':'added'}: ${data.name} ✓`,
      'success');
    this._renderSection();
  },

  deleteSig(id) {
    App.confirm(currentLang==='ar'?'هل تريد حذف هذا التوقيع نهائياً؟':'Delete this signature permanently?', () => {
      DB.company.signatures = this._getSigs().filter(s => s.id !== id);
      DB.saveCompany();
      document.getElementById(`sigcard-${id}`)?.remove();
      App.toast(currentLang==='ar'?'تم حذف التوقيع':'Signature deleted', 'info');
      this._renderSection();
    });
  },

  hardReset() {
    ['employees','attendance','leaves','requests','payroll','shifts','locations','audit','notifications','departments'].forEach(k => {
      if (Array.isArray(DB[k])) DB[k].length = 0;
    });
    const defaultPeriodLabel = currentLang === 'ar' ? 'فترة العمل' : 'Work Period';
    DB.company = { name:'',nameEn:'',logo:'',address:'',phone:'',email:'',website:'',timezone:'Asia/Riyadh',currency:'SAR',workStart:'08:00',workEnd:'17:00',lateThreshold:15,breakEnabled:false,overtimeEnabled:false,workPeriods:[{id:'wp1',label:defaultPeriodLabel,start:'08:00',end:'17:00'}],workDays:['sat','sun','mon','tue','wed','thu'],branches:[],holidays:[] };
    DB.adminCredentials = { email:'', password:'' };
    localStorage.clear();
    App.toast(currentLang==='ar'?'تم إعادة تعيين النظام — سيتم إعادة التحميل...':'System reset — reloading...', 'info', 2000);
    setTimeout(() => location.reload(), 2000);
  },
};
