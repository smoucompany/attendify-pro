/* =========================================================
   EMPLOYEES MODULE
   Grid/Table views · CRUD · Search · Filter · Export
   ========================================================= */

const EmployeesModule = {
  _view: 'table',
  _search: '',
  _deptFilter: 'all',
  _statusFilter: 'all',
  _page: 1,
  _perPage: 10,

  render(container) {
    const total  = DB.employees.length;
    const active = DB.employees.filter(e => e.status === 'active').length;
    const leaves = DB.employees.filter(e => e.status === 'on_leave').length;

    container.innerHTML = `
      <div class="page-header">
        <div class="page-header-text">
          <h1>${t('employees.title')}</h1>
          <p>${t('employees.subtitle')} — ${total} ${t('employees.totalEmp')}</p>
        </div>
        <div class="page-header-actions">
          <button class="btn btn-secondary" onclick="EmployeesModule.openImportExport()">
            <i class="fas fa-arrows-up-down"></i> ${t('employees.importExport')}
          </button>
          <button class="btn btn-secondary" onclick="EmployeesModule.migrateEmpNos()" title="${t('employees.migrateBtn')}">
            <i class="fas fa-arrow-rotate-right"></i> ${t('employees.migrateBtn')}
          </button>
          <button class="btn btn-primary" onclick="EmployeesModule.openAdd()">
            <i class="fas fa-user-plus"></i> ${t('employees.addEmployee')}
          </button>
        </div>
      </div>

      <!-- Summary Tiles -->
      <div class="summary-tiles">
        <div class="summary-tile">
          <div class="summary-tile-icon" style="color:var(--primary)"><i class="fas fa-users"></i></div>
          <div><div class="summary-tile-val">${total}</div><div class="summary-tile-label">${t('employees.totalEmp')}</div></div>
        </div>
        <div class="summary-tile">
          <div class="summary-tile-icon" style="color:var(--success)"><i class="fas fa-user-check"></i></div>
          <div><div class="summary-tile-val">${active}</div><div class="summary-tile-label">${t('common.active')}</div></div>
        </div>
        <div class="summary-tile">
          <div class="summary-tile-icon" style="color:var(--warning)"><i class="fas fa-calendar-minus"></i></div>
          <div><div class="summary-tile-val">${leaves}</div><div class="summary-tile-label">${t('nav.leaves')}</div></div>
        </div>
        <div class="summary-tile">
          <div class="summary-tile-icon" style="color:var(--danger)"><i class="fas fa-user-xmark"></i></div>
          <div><div class="summary-tile-val">${DB.employees.filter(e=>e.status==='inactive').length}</div><div class="summary-tile-label">${t('common.inactive')}</div></div>
        </div>
        <div class="summary-tile">
          <div class="summary-tile-icon" style="color:var(--info)"><i class="fas fa-building"></i></div>
          <div><div class="summary-tile-val">${DB.departments.length}</div><div class="summary-tile-label">${t('nav.departments')}</div></div>
        </div>
      </div>

      <!-- Toolbar -->
      <div class="toolbar">
        <div class="toolbar-search">
          <i class="fas fa-magnifying-glass"></i>
          <input type="text" placeholder="${t('common.search')}..." id="emp-search" value="${this._search}"
            oninput="EmployeesModule._search=this.value; EmployeesModule._page=1; EmployeesModule._renderList()">
        </div>
        <select class="toolbar-select" id="dept-filter" onchange="EmployeesModule._deptFilter=this.value; EmployeesModule._page=1; EmployeesModule._renderList()">
          <option value="all">${t('common.all')} ${t('nav.departments')}</option>
          ${DB.departments.map(d=>`<option value="${d.id}" ${this._deptFilter===d.id?'selected':''}>${d.name}</option>`).join('')}
        </select>
        <select class="toolbar-select" id="status-filter" onchange="EmployeesModule._statusFilter=this.value; EmployeesModule._renderList()">
          <option value="all">${t('common.all')} ${t('common.status')}</option>
          <option value="active"  ${this._statusFilter==='active'?'selected':''}>${t('common.active')}</option>
          <option value="inactive"${this._statusFilter==='inactive'?'selected':''}>${t('common.inactive')}</option>
          <option value="on_leave"${this._statusFilter==='on_leave'?'selected':''}>${t('nav.leaves')}</option>
        </select>
        <div class="toolbar-separator"></div>
        <button class="btn btn-secondary btn-sm ${this._view==='table'?'btn-outline-primary':''}" onclick="EmployeesModule._view='table'; EmployeesModule._renderList()" title="${t('employees.tableView')}"><i class="fas fa-table"></i></button>
        <button class="btn btn-secondary btn-sm ${this._view==='grid'?'btn-outline-primary':''}"  onclick="EmployeesModule._view='grid';  EmployeesModule._renderList()" title="${t('employees.gridView')}"><i class="fas fa-grip"></i></button>
      </div>

      <!-- List container -->
      <div id="employees-list"></div>
    `;

    this._renderList();
  },

  _renderList() {
    const list = document.getElementById('employees-list');
    if (!list) return;

    let emps = DB.employees.filter(e => {
      const q = this._search;
      const matchSearch = !q || (e.name||'').includes(q) || (e.nameEn||'').toLowerCase().includes(q.toLowerCase()) || (e.no||'').includes(q) || (e.email||'').includes(q) || (e.position||'').includes(q);
      const matchDept   = this._deptFilter === 'all' || e.dept === this._deptFilter;
      const matchStatus = this._statusFilter === 'all' || e.status === this._statusFilter;
      return matchSearch && matchDept && matchStatus;
    }).sort((a, b) => {
      const na = parseInt((a.no || '').replace(/^[^\d]+/, ''), 10) || 0;
      const nb = parseInt((b.no || '').replace(/^[^\d]+/, ''), 10) || 0;
      return na - nb;
    });

    if (!emps.length) {
      list.innerHTML = `<div class="empty-state"><div class="empty-icon"><i class="fas fa-users-slash"></i></div><div class="empty-title">${t('common.noData')}</div></div>`;
      return;
    }

    const total = emps.length;
    const pages = Math.ceil(total / this._perPage);
    if (this._page > pages) this._page = Math.max(1, pages);
    const start = (this._page - 1) * this._perPage;
    const paged = emps.slice(start, start + this._perPage);

    if (this._view === 'grid') {
      list.innerHTML = `
        <div class="employee-cards">${paged.map(e => this._empCard(e)).join('')}</div>
        <div class="pagination">${this._pagination(total)}</div>
      `;
    } else {
      list.innerHTML = `
        <div class="table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>${t('employees.employeeId')}</th>
                <th>${t('common.name')}</th>
                <th>${t('common.department')}</th>
                <th>${t('common.position')}</th>
                <th>${t('common.phone')}</th>
                <th>${t('employees.hireDate')}</th>
                <th>${t('common.status')}</th>
                <th>${t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              ${paged.map((e, i) => this._empRow(e, start + i)).join('')}
            </tbody>
          </table>
        </div>
        <div class="pagination">${this._pagination(total)}</div>
      `;
    }
  },

  _empCard(e) {
    const dept    = DB.getDepartment(e.dept);
    const deptIdx = DB.departments.findIndex(d => d.id === e.dept);
    const deptHex = dept?.hex || (typeof DepartmentsModule !== 'undefined'
      ? DepartmentsModule.COLORS[(deptIdx >= 0 ? deptIdx : 0) % DepartmentsModule.COLORS.length].hex
      : '#6366f1');
    return `
      <div class="employee-card stagger-item" style="border-top:3px solid ${deptHex}">
        <div class="employee-card-avatar" style="background:none;padding:0">${App.renderAvatar(e, 64, 16)}</div>
        <div class="employee-card-name">${e.name}</div>
        <div class="employee-card-role">${e.position}</div>
        <div class="employee-card-dept" style="color:${deptHex}"><i class="fas fa-building"></i> ${dept?.name || ''}</div>
        <div class="employee-card-stats">
          <div class="emp-stat" style="cursor:pointer" onclick="EmployeesModule._goEmpPage('${e.id}','${e.name}','leaves')" title="عرض الإجازات">
            <div class="emp-stat-val">${DB.leaveBalances[e.id]?.remaining || 0}</div>
            <div class="emp-stat-label">${t('leaves.remaining')}</div>
          </div>
          <div class="emp-stat" style="cursor:pointer" onclick="EmployeesModule._goEmpPage('${e.id}','${e.name}','attendance')" title="عرض الحضور">
            <div class="emp-stat-val">${DB.attendance.filter(a=>a.empId===e.id).length}</div>
            <div class="emp-stat-label">${t('nav.attendance')}</div>
          </div>
          <div class="emp-stat" style="cursor:pointer" onclick="EmployeesModule._goEmpPage('${e.id}','${e.name}','payroll')" title="عرض الراتب">
            <div class="emp-stat-val">${App.formatCurrency(e.salary)}</div>
            <div class="emp-stat-label">${t('payroll.baseSalary')}</div>
          </div>
        </div>
        <div style="margin-bottom:12px">${App.getStatusBadge(e.status)}</div>
        <div class="employee-card-actions">
          <button class="btn btn-outline-primary btn-sm" onclick="EmployeesModule.viewEmployee('${e.id}')"><i class="fas fa-eye"></i></button>
          <button class="btn btn-secondary btn-sm" onclick="EmployeesModule.openEdit('${e.id}')"><i class="fas fa-pencil"></i></button>
          <button class="btn btn-sm" style="background:var(--warning);color:#fff" title="${t('employees.passwordTitle')}" onclick="EmployeesModule.openPasswordModal('${e.id}')"><i class="fas fa-key"></i></button>
          <button class="btn btn-sm" style="background:#25d366;color:#fff" title="${t('employees.sendCredentials')}" onclick="EmployeesModule.sendCredentials('${e.id}')"><i class="fab fa-whatsapp"></i></button>
          <button class="btn btn-danger btn-sm" onclick="EmployeesModule.deleteEmployee('${e.id}')"><i class="fas fa-trash"></i></button>
        </div>
      </div>
    `;
  },

  _empRow(e, i) {
    const dept = DB.getDepartment(e.dept);
    return `
      <tr class="stagger-item">
        <td style="color:var(--text-muted)">${i + 1}</td>
        <td><code style="background:var(--bg-input);padding:2px 8px;border-radius:6px;font-size:12px">${e.no}</code></td>
        <td>
          <div class="table-avatar">
            ${App.renderAvatar(e, 36, 10)}
            <div class="avatar-info">
              <div class="avatar-name">${e.name}</div>
              <div class="avatar-sub">${e.email}</div>
            </div>
          </div>
        </td>
        <td><span class="badge badge-primary">${dept?.name || ''}</span></td>
        <td style="color:var(--text-secondary)">${e.position}</td>
        <td style="font-family:var(--font-en);direction:ltr;text-align:right">${e.phone}</td>
        <td style="color:var(--text-muted)">${App.formatDate(e.hireDate)}</td>
        <td>${App.getStatusBadge(e.status)}</td>
        <td>
          <div style="display:flex;gap:4px">
            <button class="btn-icon btn" title="${t('common.view')}" onclick="EmployeesModule.viewEmployee('${e.id}')"><i class="fas fa-eye"></i></button>
            <button class="btn-icon btn" title="${t('common.edit')}" onclick="EmployeesModule.openEdit('${e.id}')"><i class="fas fa-pencil"></i></button>
            <button class="btn-icon btn" title="${t('employees.passwordTitle')}" style="color:var(--warning)" onclick="EmployeesModule.openPasswordModal('${e.id}')"><i class="fas fa-key"></i></button>
            <button class="btn-icon btn" title="${t('employees.sendCredentials')}" style="color:#25d366" onclick="EmployeesModule.sendCredentials('${e.id}')"><i class="fab fa-whatsapp"></i></button>
            <button class="btn-icon btn" title="${t('common.delete')}" style="color:var(--danger)" onclick="EmployeesModule.deleteEmployee('${e.id}')"><i class="fas fa-trash"></i></button>
          </div>
        </td>
      </tr>
    `;
  },

  _pagination(total) {
    const pages = Math.ceil(total / this._perPage);
    if (pages <= 1) return '';
    const cur = this._page;
    let html = '';
    for (let i = 1; i <= pages; i++) {
      if (i === 1 || i === pages || (i >= cur-1 && i <= cur+1)) {
        html += `<div class="page-num ${i===cur?'active':''}" onclick="EmployeesModule._page=${i};EmployeesModule._renderList()">${i}</div>`;
      } else if (i === cur-2 || i === cur+2) {
        html += `<div class="page-num dots">…</div>`;
      }
    }
    return html;
  },

  goToPage(p) {
    this._page = p;
    this._renderList();
  },

  openAdd() {
    App.openModal(t('employees.addTitle'), this._form(null));
  },

  // معاينة كود الموظف لحظة كتابة الاسم (يدعم الأسماء العربية والإنجليزية)
  _previewEmpNo(firstName) {
    const preview = document.getElementById('emp-no-preview');
    const hidden  = document.querySelector('input[name="no"]');
    if (!preview) return;
    const ch = (firstName || '').trim().charAt(0);
    if (!ch) {
      preview.textContent = t('employees.autoGenerate');
      preview.style.color = 'var(--text-muted)';
      if (hidden) hidden.value = '';
      return;
    }
    // استخدم نفس الدالة الموجودة في data.js
    const code = DB.nextEmpNo(firstName);
    preview.textContent = code;
    preview.style.color = 'var(--text-primary)';
    if (hidden) hidden.value = code;
  },

  _toggleShift(shiftId, labelEl) {
    const cb   = labelEl.querySelector('input[type="checkbox"]');
    const icon = document.getElementById('shift-icon-' + shiftId);
    const txt  = document.getElementById('shift-txt-'  + shiftId);
    const isOn = !cb.checked;
    cb.checked = isOn;
    labelEl.style.borderColor  = isOn ? 'var(--primary)' : 'var(--border)';
    labelEl.style.background   = isOn ? 'var(--primary-bg)' : 'transparent';
    if (icon) { icon.style.color = isOn ? 'var(--primary)' : 'var(--border)'; }
    if (txt)  { txt.style.color  = isOn ? 'var(--primary)' : 'var(--text-secondary)'; }
    // Recalc hourly rate using first selected shift
    this._updateRates(document.getElementById('emp-salary-input')?.value);
  },

  _updateRates(salaryVal) {
    const salary    = Number(salaryVal) || 0;
    const parseHM   = (str, def) => { const p = (str||def).split(':').map(Number); return (isNaN(p[0]) || p.length < 2) ? def.split(':').map(Number) : p; };
    const workDays  = (DB.company.workDays||['sat','sun','mon','tue','wed','thu']).length;
    const monthDays = workDays * 4.33;
    // Read the first checked shift from the multi-shift picker
    const checkedCbs = [...document.querySelectorAll('#emp-shifts-picker input[type="checkbox"]:checked')];
    const shiftId    = checkedCbs[0]?.value || null;
    const empShift   = shiftId ? DB.shifts.find(s => s.id === shiftId) : null;
    const shiftStart = empShift?.start || DB.company.workStart || '08:00';
    const shiftEnd   = empShift?.end   || DB.company.workEnd   || '17:00';
    const [ssh, ssm] = parseHM(shiftStart, '08:00');
    const [seh, sem] = parseHM(shiftEnd,   '17:00');
    const rawHours   = ((seh*60+sem) - (ssh*60+ssm)) / 60;
    const workHours  = rawHours > 0 ? rawHours : 8;
    const dayRate   = salary > 0 ? (salary / monthDays).toFixed(2) : null;
    const hrRate    = salary > 0 ? (salary / monthDays / workHours).toFixed(2) : null;
    const dayEl = document.getElementById('emp-day-rate');
    const hrEl  = document.getElementById('emp-hr-val');
    const curr = currentLang === 'ar' ? ' ريال' : ' SAR';
    if (dayEl) dayEl.querySelector('span').textContent = dayRate ? dayRate + curr : '—';
    if (hrEl)  hrEl.textContent = hrRate ? hrRate + curr : '—';
  },

  openEdit(id) {
    const emp = DB.getEmployee(id);
    App.openModal(t('employees.editTitle'), this._form(emp));
  },

  _form(emp) {
    return `
      <form onsubmit="EmployeesModule.saveEmployee(event, '${emp?.id||''}')">
        <div class="app-form-group">
          <label>${t('employees.employeeId')} <span style="color:var(--text-muted);font-weight:400;font-size:11px">(${t('employees.loginCode')})</span></label>
          <div style="display:flex;align-items:center;gap:10px;background:var(--bg-input,#f8fafc);border:1.5px solid var(--border);border-radius:10px;padding:10px 14px" id="emp-no-display">
            <i class="fas fa-id-badge" style="color:var(--primary)"></i>
            <span id="emp-no-preview" style="font-size:18px;font-weight:800;letter-spacing:3px;color:${emp ? 'var(--text-primary)' : 'var(--text-muted)'}">
              ${emp ? emp.no : t('employees.autoGenerate')}
            </span>
            <span style="font-size:11px;color:var(--text-muted);margin-right:auto">${emp ? t('employees.existingCode') : t('employees.codeFormat')}</span>
          </div>
          <input type="hidden" name="no" value="${emp ? emp.no : ''}">
        </div>
        <div class="app-form-row">
          <div class="app-form-group">
            <label>${t('employees.firstName')}</label>
            <input class="app-form-input" type="text" name="firstName" value="${emp ? emp.name.split(' ')[0] : ''}" required
              oninput="EmployeesModule._previewEmpNo(this.value)">
          </div>
          <div class="app-form-group">
            <label>${t('employees.lastName')}</label>
            <input class="app-form-input" type="text" name="lastName" value="${emp ? emp.name.split(' ').slice(1).join(' ') : ''}" required>
          </div>
        </div>
        <div class="app-form-row">
          <div class="app-form-group">
            <label>${t('common.email')}</label>
            <input class="app-form-input" type="email" name="email" value="${emp?.email||''}" required>
          </div>
          <div class="app-form-group">
            <label>${t('common.phone')}</label>
            <input class="app-form-input" type="tel" name="phone" value="${emp?.phone||''}">
          </div>
        </div>
        <div class="app-form-row">
          <div class="app-form-group">
            <label>${t('common.department')}</label>
            <select class="app-form-input app-form-select" name="dept" required>
              ${DB.departments.map(d=>`<option value="${d.id}" ${emp?.dept===d.id?'selected':''}>${d.name}</option>`).join('')}
            </select>
          </div>
          <div class="app-form-group">
            <label>${t('common.position')}</label>
            <input class="app-form-input" type="text" name="position" value="${emp?.position||''}" required>
          </div>
        </div>
        <div class="app-form-row">
          <div class="app-form-group">
            <label>${t('employees.salary')}</label>
            <input class="app-form-input" type="number" name="salary" id="emp-salary-input"
              value="${emp?.salary||''}" min="0" step="100"
              oninput="EmployeesModule._updateRates(this.value)">
          </div>
          <div class="app-form-group">
            <label>${t('common.status')}</label>
            <select class="app-form-input app-form-select" name="status">
              <option value="active" ${emp?.status==='active'?'selected':''}>${t('common.active')}</option>
              <option value="inactive" ${emp?.status==='inactive'?'selected':''}>${t('common.inactive')}</option>
              <option value="on_leave" ${emp?.status==='on_leave'?'selected':''}>${t('nav.leaves')}</option>
            </select>
          </div>
        </div>
        <div class="app-form-row">
          <div class="app-form-group">
            <label><i class="fas fa-location-dot" style="color:var(--primary)"></i> ${t('employees.workLocation')}</label>
            <input class="app-form-input" type="text" name="workLocation" value="${emp?.workLocation||''}" placeholder="${t('employees.workLocationPlaceholder')}">
          </div>
          <div class="app-form-group">
            <label><i class="fas fa-building" style="color:var(--primary)"></i> ${t('employees.workEntity')}</label>
            <input class="app-form-input" type="text" name="workEntity" value="${emp?.workEntity||''}" placeholder="${t('employees.workEntityPlaceholder')}">
          </div>
        </div>
        ${(() => {
          const parseHM  = (str, def) => { const p = (str||def).split(':').map(Number); return (isNaN(p[0]) || p.length < 2) ? def.split(':').map(Number) : p; };
          const workDays = (DB.company.workDays||['sat','sun','mon','tue','wed','thu']).length;
          const monthDays = workDays * 4.33;
          // Shift hours: use employee's assigned shift, fallback to company hours
          const empShift   = emp?.shift ? DB.shifts.find(s => s.id === emp.shift) : null;
          const shiftStart = empShift?.start || DB.company.workStart || '08:00';
          const shiftEnd   = empShift?.end   || DB.company.workEnd   || '17:00';
          const [ssh, ssm] = parseHM(shiftStart, '08:00');
          const [seh, sem] = parseHM(shiftEnd,   '17:00');
          const rawHours   = ((seh*60+sem) - (ssh*60+ssm)) / 60;
          const workHours  = rawHours > 0 ? rawHours : 8;
          const shiftLabel = empShift ? empShift.name : t('employees.companyDefault');
          const salary     = Number(emp?.salary||0);
          const dayRate    = salary > 0 ? (salary / monthDays).toFixed(2) : '—';
          const hrRate     = salary > 0 ? (salary / monthDays / workHours).toFixed(2) : '—';
          return `
        <div class="app-form-row">
          <div class="app-form-group">
            <label style="display:flex;align-items:center;gap:6px">
              <i class="fas fa-calendar-day" style="color:var(--primary);font-size:12px"></i>
              ${t('employees.dayRate')}
            </label>
            <div id="emp-day-rate" class="app-form-input" style="background:var(--bg-input);color:var(--primary);font-weight:700;cursor:default;display:flex;align-items:center;justify-content:space-between">
              <span>${dayRate !== '—' ? dayRate + ' ' + (currentLang==='ar'?'ريال':'SAR') : '—'}</span>
              <span style="font-size:11px;color:var(--text-muted);font-weight:400">= ${currentLang==='ar'?'الراتب ÷':'Salary ÷'} ${Math.round(monthDays)} ${currentLang==='ar'?'يوم':'days'}</span>
            </div>
          </div>
          <div class="app-form-group">
            <label style="display:flex;align-items:center;gap:6px">
              <i class="fas fa-clock" style="color:var(--info);font-size:12px"></i>
              ${t('employees.hourRate')}
            </label>
            <div id="emp-hr-rate" class="app-form-input" style="background:var(--bg-input);color:#06b6d4;font-weight:700;cursor:default;display:flex;align-items:center;justify-content:space-between">
              <span id="emp-hr-val">${hrRate !== '—' ? hrRate + ' ' + (currentLang==='ar'?'ريال':'SAR') : '—'}</span>
              <span style="font-size:11px;color:var(--text-muted);font-weight:400;text-align:end">= ${currentLang==='ar'?'اليومية ÷':'Daily ÷'} ${workHours}${currentLang==='ar'?'س':'h'}<br><span style="color:var(--primary);opacity:.7">(${shiftLabel})</span></span>
            </div>
          </div>
        </div>`;
        })()}
        <div class="app-form-row">
          <div class="app-form-group">
            <label>${t('employees.hireDate')}</label>
            <input class="app-form-input" type="date" name="hireDate" value="${emp?.hireDate||''}">
          </div>
          <div class="app-form-group">
            <label>${t('employees.gender')}</label>
            <select class="app-form-input app-form-select" name="gender">
              <option value="m" ${emp?.gender==='m'?'selected':''}>${t('common.male')}</option>
              <option value="f" ${emp?.gender==='f'?'selected':''}>${t('common.female')}</option>
            </select>
          </div>
        </div>
        <div class="app-form-group">
          <label style="display:flex;align-items:center;gap:6px">
            <i class="fas fa-user-clock" style="color:var(--primary);font-size:12px"></i>
            ${t('employees.shifts')}
            <span style="font-size:11px;color:var(--text-muted);font-weight:400">${t('employees.multiShiftHint')}</span>
          </label>
          ${DB.shifts.filter(s => s.name && s.start && s.end).length ? `
          <div id="emp-shifts-picker" style="display:flex;flex-wrap:wrap;gap:8px;padding:10px;background:var(--bg-input);border:1px solid var(--border);border-radius:var(--radius-md)">
            ${DB.shifts.filter(s => s.name && s.start && s.end).map(s => {
              const pHM = str => (str||'00:00').split(':').map(Number);
              const [sh,sm] = pHM(s.start); const [eh,em] = pHM(s.end);
              const hrs = ((eh*60+em)-(sh*60+sm))/60;
              const timeRange = `${s.start} — ${s.end}`;
              const hrsLabel = hrs > 0 ? `(${hrs.toFixed(1)} س)` : '';
              const empShifts = Array.isArray(emp?.shifts) ? emp.shifts : (emp?.shift ? [emp.shift] : []);
              const isOn = empShifts.includes(s.id);
              const typeColors = { morning:'#f59e0b', evening:'#6366f1', night:'#7c3aed' };
              const dotColor = typeColors[s.type] || 'var(--primary)';
              return `
              <label style="display:flex;flex-direction:column;gap:3px;padding:9px 14px;border-radius:12px;cursor:pointer;border:1.5px solid ${isOn?'var(--primary)':'var(--border)'};background:${isOn?'var(--primary-bg)':'transparent'};transition:all .15s;user-select:none;min-width:130px" id="shift-lbl-${s.id}"
                onclick="EmployeesModule._toggleShift('${s.id}',this)">
                <input type="checkbox" name="shifts" value="${s.id}" ${isOn?'checked':''} style="display:none">
                <div style="display:flex;align-items:center;gap:6px">
                  <span style="width:8px;height:8px;border-radius:50%;background:${dotColor};flex-shrink:0"></span>
                  <span style="font-size:13px;font-weight:700;color:${isOn?'var(--primary)':'var(--text-primary)'}" id="shift-txt-${s.id}">${s.name}</span>
                  <i class="fas fa-circle-check" style="font-size:12px;color:${isOn?'var(--primary)':'var(--border)'};margin-right:auto" id="shift-icon-${s.id}"></i>
                </div>
                <div style="font-size:11px;color:var(--text-muted);direction:ltr;text-align:start">${timeRange} ${hrsLabel}</div>
              </label>`;
            }).join('')}
          </div>` : `<div style="padding:12px;color:var(--text-muted);font-size:13px;text-align:center;background:var(--bg-input);border-radius:var(--radius-md)">
            <i class="fas fa-circle-info"></i> ${t('employees.noShiftsHint')}
          </div>`}
        </div>
        <div class="modal-footer" style="padding:0;margin-top:20px">
          <button type="button" class="btn btn-secondary" onclick="App.closeModal()">${t('common.cancel')}</button>
          <button type="submit" class="btn btn-primary"><i class="fas fa-save"></i> ${t('common.save')}</button>
        </div>
      </form>
    `;
  },

  saveEmployee(e, id) {
    e.preventDefault();
    const form = e.target;
    const data = Object.fromEntries(new FormData(form));
    const fullName = `${data.firstName} ${data.lastName}`;

    if (id) {
      const emp = DB.getEmployee(id);
      if (emp) {
        emp.name = fullName;
        emp.no = data.no || emp.no;
        emp.email = data.email;
        emp.phone = data.phone;
        emp.dept = data.dept;
        emp.position = data.position;
        emp.salary = parseInt(data.salary) || emp.salary;
        emp.status = data.status;
        emp.gender = data.gender;
        emp.hireDate = data.hireDate;
        emp.workLocation = data.workLocation || emp.workLocation || '';
        emp.workEntity   = data.workEntity   || emp.workEntity   || '';
        emp.shifts = [...form.querySelectorAll('input[name="shifts"]:checked')].map(c => c.value);
        emp.shift  = emp.shifts[0] || null;  // backward compat for attendance module
        const pr = DB.payroll.find(p => p.empId === id);
        if (pr && emp.salary) {
          pr.base  = emp.salary;
          pr.total = Math.max(0, pr.base + (pr.housing||0) + (pr.transport||0) + (pr.food||0) + (pr.overtime||0) - (pr.absentDeduction||0) - (pr.lateDeduction||0));
        }
        DB.save();
        App.toast(`${t('common.edit')} ${fullName} ${currentLang==='ar'?'تم بنجاح':'updated'}`, 'success');
      }
    } else {
      const newEmp = {
        id: DB.nextId('e'),
        no: data.no || DB.nextEmpNo(data.firstName),
        name: fullName,
        nameEn: fullName,
        dept: data.dept,
        position: data.position,
        positionEn: data.position,
        salary: parseInt(data.salary) || 0,
        email: data.email,
        phone: data.phone,
        status: data.status || 'active',
        gender: data.gender,
        hireDate: data.hireDate || new Date().toISOString().split('T')[0],
        workLocation: data.workLocation || '',
        workEntity:   data.workEntity   || '',
        shifts: [...(e.target).querySelectorAll('input[name="shifts"]:checked')].map(c => c.value),
        shift:  [...(e.target).querySelectorAll('input[name="shifts"]:checked')].map(c => c.value)[0] || null,
        avatar: fullName.charAt(0),
        avatarColor: 'gradient-primary',
        password: Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 6),
      };
      DB.employees.push(newEmp);
      // رصيد الإجازات
      DB.leaveBalances[newEmp.id] = { annual: 21, sick: 10, emergency: 3, remaining: 21, taken: 0, sickTaken: 0, emergencyTaken: 0 };
      // سجل الراتب
      const base = newEmp.salary || 0;
      DB.payroll.push({
        id:              DB.nextId('pay'),
        empId:           newEmp.id,
        period:          new Date().toISOString().slice(0,7),
        base,
        housing:         0,
        transport:       0,
        food:            0,
        overtime:        0,
        absentDeduction: 0,
        lateDeduction:   0,
        absentDays:      0,
        total:           base,
      });
      DB.save();
      App.toast(`${t('employees.addEmployee')} ${fullName} ${currentLang==='ar'?'تم بنجاح':'added'}`, 'success');
    }

    App.closeModal();
    this.render(document.getElementById('page-content'));
  },

  viewEmployee(id) {
    const emp  = DB.getEmployee(id);
    const dept = DB.getDepartment(emp?.dept);
    if (!emp) return;

    const attCount = DB.attendance.filter(a => a.empId === id).length;
    const bal      = DB.leaveBalances[id] || {};

    App.openModal(emp.name, `
      <div style="text-align:center;padding:20px 0 24px">
        <div style="margin:0 auto 12px;width:80px">${App.renderAvatar(emp, 80, 20)}</div>
        <h2 style="font-size:20px;font-weight:800">${emp.name}</h2>
        <p style="color:var(--text-muted)">${emp.position}</p>
        <div style="margin-top:8px">${App.getStatusBadge(emp.status)}</div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:20px">
        ${[
          ['fas fa-hashtag',      t('employees.employeeId'), emp.no],
          ['fas fa-building',     t('common.department'),   dept?.name||'—'],
          ['fas fa-location-dot', 'مكان العمل',             emp.workLocation||'—'],
          ['fas fa-building-user','جهة العمل',              emp.workEntity||'—'],
          ['fas fa-envelope',     t('common.email'),        emp.email],
          ['fas fa-phone',        t('common.phone'),        emp.phone],
          ['fas fa-calendar',     t('employees.hireDate'),  App.formatDate(emp.hireDate)],
          ['fas fa-money-bill',   t('employees.salary'),    App.formatCurrency(emp.salary)],
          ['fas fa-clock',        t('nav.attendance'),      attCount + ' ' + t('common.month')],
          ['fas fa-calendar-minus',t('leaves.remaining'),   (bal.remaining||0) + ' ' + t('leaves.days')],
        ].map(([icon,label,val]) => `
          <div style="background:var(--bg-input);border-radius:10px;padding:12px">
            <div style="font-size:11px;color:var(--text-muted);margin-bottom:4px"><i class="${icon}"></i> ${label}</div>
            <div style="font-size:14px;font-weight:600;color:var(--text-primary)">${val}</div>
          </div>
        `).join('')}
      </div>
      ${typeof Biometrics !== 'undefined' ? Biometrics.renderBiometricCard(id) : ''}

      <!-- Quick navigation to related modules -->
      <div style="margin-top:16px;padding-top:14px;border-top:1px solid var(--border)">
        <div style="font-size:11px;color:var(--text-muted);font-weight:700;margin-bottom:10px;text-transform:uppercase;letter-spacing:.5px">انتقل إلى</div>
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px">
          ${[
            { icon:'fa-clock-rotate-left', label:'الحضور',    color:'#10b981', bg:'rgba(16,185,129,.1)',   page:'attendance' },
            { icon:'fa-calendar-minus',    label:'الإجازات',  color:'#f59e0b', bg:'rgba(245,158,11,.1)',   page:'leaves'     },
            { icon:'fa-money-bill-wave',   label:'الرواتب',   color:'#6366f1', bg:'rgba(99,102,241,.1)',   page:'payroll'    },
            { icon:'fa-hand-holding-dollar',label:'السلف',   color:'#8b5cf6', bg:'rgba(139,92,246,.1)',   page:'loans'      },
          ].map(a => `
            <button onclick="App.closeModal(); EmployeesModule._goEmpPage('${id}','${emp.name}','${a.page}')"
              style="padding:10px 4px;border-radius:10px;border:1.5px solid ${a.bg};background:${a.bg};color:${a.color};font-size:11px;font-weight:700;font-family:var(--font);cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:5px;transition:all .2s"
              onmouseover="this.style.borderColor='${a.color}'" onmouseout="this.style.borderColor='${a.bg}'">
              <i class="fas ${a.icon}" style="font-size:16px"></i>${a.label}
            </button>
          `).join('')}
        </div>
      </div>

      <div style="display:flex;gap:10px;justify-content:center;margin-top:14px;flex-wrap:wrap">
        <button class="btn btn-outline-primary" onclick="App.closeModal(); EmployeesModule.openEdit('${id}')"><i class="fas fa-pencil"></i> ${t('common.edit')}</button>
        <button class="btn btn-secondary" onclick="App.closeModal(); LoansModule.openAddForm('${id}')"><i class="fas fa-hand-holding-dollar"></i> سلفة جديدة</button>
        <button class="btn btn-sm" style="background:#25d366;color:#fff" onclick="App.closeModal(); EmployeesModule.sendCredentials('${id}')"><i class="fab fa-whatsapp"></i> إرسال بيانات الدخول</button>
        <button class="btn btn-danger" onclick="App.closeModal(); EmployeesModule.deleteEmployee('${id}')"><i class="fas fa-trash"></i> ${t('common.delete')}</button>
      </div>
    `);
  },

  deleteEmployee(id) {
    const emp = DB.getEmployee(id);
    App.confirm(`${t('employees.deleteConfirm')}\n${emp?.name}`, () => {
      const i = DB.employees.findIndex(e => e.id === id);
      if (i !== -1) DB.employees.splice(i, 1);
      App.toast(`${currentLang==='ar'?'تم حذف':'Deleted'} ${emp?.name}`, 'success');
      this.render(document.getElementById('page-content'));
    });
  },

  // Navigate to a module pre-filtered by employee name
  _goEmpPage(empId, empName, page) {
    App.navigate(page);
    // After render, find the search box and apply the employee's name as filter
    setTimeout(() => {
      const searchSelectors = [
        '#att-search', '#lv-search', '#payroll-emp-search',
        '#loan-search', '#emp-search', 'input[id$="-search"]',
        'input.search-input', '.search-box input',
      ];
      let found = false;
      for (const sel of searchSelectors) {
        const el = document.querySelector(sel);
        if (el) {
          el.value = empName;
          el.dispatchEvent(new Event('input', { bubbles: true }));
          found = true;
          break;
        }
      }
      if (!found) {
        // Fallback: try filter-select for empId
        const empSel = document.querySelector('select[id*="emp"]');
        if (empSel) { empSel.value = empId; empSel.dispatchEvent(new Event('change',{bubbles:true})); }
      }
    }, 180);
  },

  exportData() { this.openImportExport(); },

  // ── MIGRATE EMPLOYEE CODES ────────────────────────────────
  migrateEmpNos() {
    const count = DB.employees.length;
    if (!count) { App.toast('لا يوجد موظفون', 'warning'); return; }

    App.confirm(
      `سيتم تحديث أكواد ${count} موظف لتصبح بصيغة (حرف إنجليزي + أرقام). هذا الإجراء لا يمكن التراجع عنه.`,
      () => {
        // خريطة تحويل الحروف العربية (مع الحروف المركبة) — نفس الخريطة في data.js
        const _ar = {
          'ا':'A',  'أ':'A',  'إ':'E', 'آ':'A', 'ء':'A', 'ئ':'Y',
          'ب':'B',
          'ت':'T',  'ث':'TH',
          'ج':'J',
          'ح':'H',  'خ':'KH',
          'د':'D',  'ذ':'DH',
          'ر':'R',
          'ز':'Z',
          'س':'S',  'ش':'SH', 'ص':'S', 'ض':'D',
          'ط':'T',  'ظ':'Z',
          'ع':'O',  'غ':'GH',
          'ف':'F',
          'ق':'Q',  'ك':'K',
          'ل':'L',
          'م':'M',
          'ن':'N',
          'ه':'H',  'ة':'H',
          'و':'W',
          'ي':'Y',  'ى':'Y',
        };
        const prefix = name => {
          const n  = (name || '').trim();
          const ch = n.charAt(0);
          if (ch === 'ع') {
            const next = n.charAt(1);
            if (next === 'م' || next === 'ث') return 'O';
            if (next === 'ي')                 return 'I';
            return 'A';
          }
          return ch ? (_ar[ch] || (/[a-z]/i.test(ch) ? ch.toUpperCase() : 'E')) : 'E';
        };

        // رتّب حسب الرقم الموجود في الكود الحالي للحفاظ على الترتيب
        const sorted = [...DB.employees].sort((a, b) => {
          const na = parseInt((a.no || '').replace(/^[^\d]+/, ''), 10) || 0;
          const nb = parseInt((b.no || '').replace(/^[^\d]+/, ''), 10) || 0;
          return na - nb;
        });

        // أعد توليد الأكواد بشكل متسلسل 001, 002, ...
        sorted.forEach((emp, idx) => {
          const firstName = (emp.name || '').trim().split(/\s+/)[0];
          emp.no = prefix(firstName) + String(idx + 1).padStart(3, '0');
          // أضف كل موظف صراحةً في قائمة المزامنة حتى يُرفع فوراً لـ Supabase
          if (typeof SupabaseDB !== 'undefined' && SupabaseDB.isConnected) {
            SupabaseDB._enqueue('upsert', 'employees', emp);
          }
        });

        DB._saveToLocal();
        App.toast(`تم تحديث أكواد ${count} موظف بنجاح ✓ — جارٍ المزامنة...`, 'success');
        this.render(document.getElementById('page-content'));
      }
    );
  },

  // ── IMPORT / EXPORT MODAL ─────────────────────────────────
  openImportExport() {
    App.openModal('استيراد وتصدير بيانات الموظفين', `
      <div style="display:flex;flex-direction:column;gap:0">

        <!-- TABS -->
        <div style="display:flex;border-bottom:2px solid var(--border);margin-bottom:20px">
          <button id="ie-tab-import" onclick="EmployeesModule._ieTab('import')"
            style="flex:1;padding:11px;font-size:13px;font-weight:700;border:none;background:var(--primary);color:#fff;cursor:pointer;border-radius:8px 0 0 0">
            <i class="fas fa-upload"></i>  استيراد
          </button>
          <button id="ie-tab-export" onclick="EmployeesModule._ieTab('export')"
            style="flex:1;padding:11px;font-size:13px;font-weight:700;border:none;background:var(--bg-secondary);color:var(--text-muted);cursor:pointer;border-radius:0 8px 0 0">
            <i class="fas fa-download"></i>  تصدير
          </button>
        </div>

        <!-- IMPORT PANEL -->
        <div id="ie-panel-import">

          <!-- Step 1: Download template -->
          <div style="background:linear-gradient(135deg,#eff6ff,#dbeafe);border:1.5px solid #93c5fd;border-radius:12px;padding:16px 18px;margin-bottom:16px">
            <div style="display:flex;align-items:center;gap:12px">
              <div style="width:42px;height:42px;border-radius:10px;background:#2563eb;display:flex;align-items:center;justify-content:center;flex-shrink:0">
                <i class="fas fa-file-excel" style="color:#fff;font-size:19px"></i>
              </div>
              <div style="flex:1">
                <div style="font-size:13px;font-weight:800;color:#1e40af;margin-bottom:2px">الخطوة 1 — تحميل القالب</div>
                <div style="font-size:11.5px;color:#3b82f6;line-height:1.5">حمّل القالب الجاهز، عبّئ بيانات موظفيك، ثم ارفعه</div>
              </div>
              <button onclick="EmployeesModule.downloadTemplate()"
                style="background:#2563eb;color:#fff;border:none;border-radius:8px;padding:9px 16px;font-size:12.5px;font-weight:700;cursor:pointer;white-space:nowrap;display:flex;align-items:center;gap:6px">
                <i class="fas fa-download"></i> تحميل القالب
              </button>
            </div>
          </div>

          <!-- Step 2: Upload -->
          <div style="margin-bottom:16px">
            <div style="font-size:12.5px;font-weight:700;color:var(--text-primary);margin-bottom:8px">
              <span style="background:#6366f1;color:#fff;border-radius:50%;width:20px;height:20px;display:inline-flex;align-items:center;justify-content:center;font-size:10px;margin-left:6px">2</span>
              رفع ملف Excel المعبّأ
            </div>
            <label id="ie-dropzone"
              style="display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;
                     border:2px dashed #c7d2fe;border-radius:12px;padding:28px 20px;cursor:pointer;
                     background:#fafafa;transition:all 0.2s;text-align:center"
              ondragover="event.preventDefault();this.style.borderColor='#6366f1';this.style.background='#eef2ff'"
              ondragleave="this.style.borderColor='#c7d2fe';this.style.background='#fafafa'"
              ondrop="event.preventDefault();this.style.borderColor='#c7d2fe';this.style.background='#fafafa';EmployeesModule._handleImportFile(event.dataTransfer.files[0])">
              <i class="fas fa-cloud-arrow-up" style="font-size:32px;color:#a5b4fc"></i>
              <div style="font-size:13px;font-weight:700;color:var(--text-primary)">اسحب الملف هنا أو اضغط للاختيار</div>
              <div style="font-size:11px;color:var(--text-muted)">يدعم .xlsx و .xls فقط</div>
              <input type="file" accept=".xlsx,.xls" style="display:none" id="ie-file-input"
                onchange="EmployeesModule._handleImportFile(this.files[0])">
            </label>
          </div>

          <!-- Preview area -->
          <div id="ie-preview" style="display:none"></div>
        </div>

        <!-- EXPORT PANEL -->
        <div id="ie-panel-export" style="display:none">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">

            <div onclick="EmployeesModule.exportExcel()"
              style="border:1.5px solid #86efac;border-radius:12px;padding:20px;cursor:pointer;background:#f0fdf4;text-align:center;transition:all 0.2s"
              onmouseenter="this.style.background='#dcfce7'" onmouseleave="this.style.background='#f0fdf4'">
              <i class="fas fa-file-excel" style="font-size:30px;color:#16a34a;margin-bottom:8px;display:block"></i>
              <div style="font-size:13px;font-weight:800;color:#166534">Excel</div>
              <div style="font-size:11px;color:#4ade80;margin-top:3px">تصدير كامل البيانات</div>
            </div>

            <div onclick="EmployeesModule.exportCSVFile()"
              style="border:1.5px solid #93c5fd;border-radius:12px;padding:20px;cursor:pointer;background:#eff6ff;text-align:center;transition:all 0.2s"
              onmouseenter="this.style.background='#dbeafe'" onmouseleave="this.style.background='#eff6ff'">
              <i class="fas fa-file-csv" style="font-size:30px;color:#2563eb;margin-bottom:8px;display:block"></i>
              <div style="font-size:13px;font-weight:800;color:#1e40af">CSV</div>
              <div style="font-size:11px;color:#60a5fa;margin-top:3px">متوافق مع جميع البرامج</div>
            </div>
          </div>

          <div style="margin-top:16px;background:var(--bg-secondary);border-radius:10px;padding:12px 14px">
            <div style="font-size:12px;color:var(--text-muted);line-height:1.7">
              <i class="fas fa-circle-info" style="color:var(--primary);margin-left:4px"></i>
              سيتم تصدير <strong style="color:var(--text-primary)">${DB.employees.length} موظف</strong>
              بجميع بياناتهم
            </div>
          </div>
        </div>
      </div>
    `, { size: 'normal' });
  },

  _ieTab(tab) {
    ['import','export'].forEach(t => {
      const btn   = document.getElementById('ie-tab-' + t);
      const panel = document.getElementById('ie-panel-' + t);
      if (!btn || !panel) return;
      const active = t === tab;
      btn.style.background   = active ? 'var(--primary)' : 'var(--bg-secondary)';
      btn.style.color        = active ? '#fff' : 'var(--text-muted)';
      panel.style.display    = active ? '' : 'none';
    });
  },

  // ── TEMPLATE DOWNLOAD (generated in browser via SheetJS) ──
  downloadTemplate() {
    const a = document.createElement('a');
    a.href     = '/assets/employee-template.xlsx';
    a.download = 'قالب_رفع_الموظفين.xlsx';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    App.toast('تم تحميل القالب ✓', 'success');
  },

  // ── IMPORT: handle uploaded file ──────────────────────────
  _handleImportFile(file) {
    if (!file) return;
    if (!file.name.match(/\.(xlsx|xls)$/i)) {
      App.toast('يُقبل فقط ملفات .xlsx أو .xls', 'error'); return;
    }
    if (typeof XLSX === 'undefined') {
      App.toast('مكتبة Excel غير محملة، يرجى الانتظار', 'error'); return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        // cellDates:true يحوّل التواريخ لـ Date objects بدل serial numbers
        const wb  = XLSX.read(e.target.result, { type: 'binary', cellDates: true, cellNF: false });
        const ws  = wb.Sheets[wb.SheetNames[0]];

        // قراءة كل الصفوف كمصفوفات خام (بالموضع مش الاسم)
        const rawAll = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '', blankrows: false });

        // إيجاد صف الـ headers — أول صف فيه "الاسم" أو "name"
        let headerRowIdx = -1;
        for (let i = 0; i < Math.min(rawAll.length, 12); i++) {
          const row = rawAll[i];
          const norm = row.map(c => (c||'').toString().trim());
          if (norm.some(c => c.includes('الاسم') || c.toLowerCase().includes('name'))) {
            headerRowIdx = i;
            break;
          }
        }
        if (headerRowIdx === -1) {
          App.toast('لم يُعثر على صف الأعمدة في الملف', 'error'); return;
        }

        const headerRow  = rawAll[headerRowIdx].map(c => (c||'').toString().trim());
        const dataRows   = rawAll.slice(headerRowIdx + 1);

        // دالة مساعدة: البحث عن عمود بأي من الأسماء البديلة
        const colIdx = (...names) => {
          for (const n of names) {
            const i = headerRow.findIndex(h => h === n || h.replace(/\s*\*\s*$/,'').trim() === n);
            if (i !== -1) return i;
          }
          return -1;
        };

        // خريطة مواضع الأعمدة
        const C = {
          firstName: colIdx('الاسم الأول', 'الاسم'),
          lastName:  colIdx('اسم العائلة', 'العائلة'),
          fullName:  colIdx('الاسم الكامل'),
          phone:     colIdx('رقم الهاتف', 'الهاتف', 'موبايل'),
          email:     colIdx('البريد الإلكتروني', 'البريد'),
          dept:      colIdx('القسم', 'الإدارة', 'الادارة'),
          position:  colIdx('المنصب / الوظيفة', 'المنصب', 'الوظيفة', 'المسمى الوظيفي'),
          salary:    colIdx('الراتب الأساسي', 'الراتب'),
          hireDate:  colIdx('تاريخ التعيين', 'تاريخ الانضمام', 'تاريخ التوظيف'),
          gender:    colIdx('الجنس'),
          status:    colIdx('الحالة'),
          empNo:     colIdx('رقم الموظف', 'الرقم الوظيفي'),
          notes:     colIdx('ملاحظات', 'ملاحظة'),
          password:  colIdx('رمز الدخول (اختياري)', 'رمز الدخول', 'كلمة المرور'),
        };

        // تحويل تاريخ Excel (Serial أو Date object أو نص)
        const parseDate = (val) => {
          if (!val && val !== 0) return '';
          if (val instanceof Date && !isNaN(val)) {
            return val.toISOString().split('T')[0];
          }
          if (typeof val === 'number' && val > 1000) {
            // Excel serial date (Windows: epoch 1900-01-01 مع خطأ السنة الكبيسة)
            const d = new Date(Math.round((val - 25569) * 86400 * 1000));
            return d.toISOString().split('T')[0];
          }
          const s = val.toString().trim();
          // دعم dd/mm/yyyy أو dd-mm-yyyy
          const dmyMatch = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
          if (dmyMatch) return `${dmyMatch[3]}-${dmyMatch[2].padStart(2,'0')}-${dmyMatch[1].padStart(2,'0')}`;
          return s; // YYYY-MM-DD أو غيره
        };

        // تحويل رقم الهاتف (يضيف الصفر المحذوف لو ضروري)
        const parsePhone = (val) => {
          if (!val && val !== 0) return '';
          const s = val.toString().trim();
          // لو رقم بدأ بـ 5 وطوله 9 → ضيف 0 في البداية
          if (/^5\d{8}$/.test(s)) return '0' + s;
          return s;
        };

        const statusMap = {
          'نشط':'active', 'active':'active',
          'غير نشط':'inactive', 'inactive':'inactive',
          'في إجازة':'on_leave', 'on_leave':'on_leave'
        };
        const genderMap = {
          'ذكر':'m', 'male':'m', 'm':'m',
          'أنثى':'f', 'female':'f', 'f':'f'
        };

        const get = (row, idx) => idx !== -1 ? (row[idx] ?? '') : '';

        const mapped = dataRows.map((row, idx) => {
          const firstName = get(row, C.firstName).toString().trim();
          const lastName  = get(row, C.lastName).toString().trim();
          const name      = [firstName, lastName].filter(Boolean).join(' ')
                         || get(row, C.fullName).toString().trim();

          if (!name) return null; // صف فارغ

          const genderRaw = get(row, C.gender).toString().trim();
          const statusRaw = get(row, C.status).toString().trim();

          return {
            _row:     headerRowIdx + idx + 2,
            _valid:   true,
            _error:   '',
            name, firstName, lastName,
            email:    get(row, C.email).toString().trim(),
            phone:    parsePhone(get(row, C.phone)),
            deptName: get(row, C.dept).toString().trim(),
            position: get(row, C.position).toString().trim(),
            salary:   parseFloat(get(row, C.salary)) || 0,
            hireDate: parseDate(get(row, C.hireDate)) || new Date().toISOString().split('T')[0],
            gender:   genderMap[genderRaw] || 'm',
            status:   statusMap[statusRaw] || 'active',
            no:       get(row, C.empNo).toString().trim(),
            notes:    get(row, C.notes).toString().trim(),
            password: get(row, C.password).toString().trim(),
          };
        }).filter(Boolean); // إزالة الصفوف الفارغة

        if (!mapped.length) { App.toast('لم يُعثر على بيانات صالحة', 'error'); return; }

        this._showImportPreview(mapped);
      } catch(err) {
        App.toast('خطأ في قراءة الملف: ' + err.message, 'error');
      }
    };
    reader.readAsBinaryString(file);
  },

  _showImportPreview(rows) {
    const valid   = rows.filter(r => r._valid);
    const invalid = rows.filter(r => !r._valid);

    const preview = document.getElementById('ie-preview');
    if (!preview) return;
    preview.style.display = '';
    preview.innerHTML = `
      <div style="border-radius:10px;overflow:hidden;border:1.5px solid var(--border)">
        <div style="background:var(--bg-secondary);padding:10px 14px;display:flex;align-items:center;justify-content:space-between">
          <div style="font-size:12.5px;font-weight:700;color:var(--text-primary)">
            معاينة البيانات
            <span style="background:#dcfce7;color:#166534;border-radius:20px;padding:2px 10px;font-size:11px;margin-right:6px">${valid.length} صالح</span>
            ${invalid.length ? `<span style="background:#fee2e2;color:#991b1b;border-radius:20px;padding:2px 10px;font-size:11px">${invalid.length} خطأ</span>` : ''}
          </div>
          <button onclick="EmployeesModule._confirmImport(${JSON.stringify(valid).replace(/"/g,'&quot;')})"
            style="background:var(--primary);color:#fff;border:none;border-radius:8px;padding:7px 16px;font-size:12px;font-weight:700;cursor:pointer">
            <i class="fas fa-check"></i> استيراد ${valid.length} موظف
          </button>
        </div>
        <div style="max-height:220px;overflow-y:auto">
          <table style="width:100%;border-collapse:collapse;font-size:11.5px">
            <thead>
              <tr style="background:var(--bg-secondary)">
                ${['#','الاسم','القسم','المنصب','الراتب','الحالة',''].map(h=>`<th style="padding:7px 10px;text-align:right;color:var(--text-muted);font-weight:600;border-bottom:1px solid var(--border)">${h}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${rows.map((r,i) => `
                <tr style="border-bottom:1px solid var(--border);background:${r._valid ? (i%2?'var(--bg)':'var(--bg-secondary)') : '#fff5f5'}">
                  <td style="padding:7px 10px;color:var(--text-muted)">${r._row}</td>
                  <td style="padding:7px 10px;font-weight:600;color:var(--text-primary)">${r.name || '—'}</td>
                  <td style="padding:7px 10px;color:var(--text-muted)">${r.deptName || '—'}</td>
                  <td style="padding:7px 10px;color:var(--text-muted)">${r.position || '—'}</td>
                  <td style="padding:7px 10px">${r.salary ? r.salary.toLocaleString() : '—'}</td>
                  <td style="padding:7px 10px">
                    <span style="background:${r.status==='active'?'#dcfce7':r.status==='inactive'?'#fee2e2':'#fef3c7'};
                                 color:${r.status==='active'?'#166534':r.status==='inactive'?'#991b1b':'#92400e'};
                                 border-radius:20px;padding:2px 8px;font-size:10px">
                      ${r.status==='active'?'نشط':r.status==='inactive'?'غير نشط':'في إجازة'}
                    </span>
                  </td>
                  <td style="padding:7px 10px;color:#ef4444;font-size:11px">${r._error || ''}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  _confirmImport(rows) {
    let added = 0;
    rows.forEach(r => {
      // find or create dept
      let dept = DB.departments.find(d =>
        d.name === r.deptName || d.nameEn === r.deptName
      );
      if (!dept && r.deptName) {
        dept = { id: DB.nextId('d'), name: r.deptName, nameEn: r.deptName,
                 icon:'fas fa-building', hex:'#6366f1', manager:'', managerId:'', count:0, branch:'b1' };
        DB.departments.push(dept);
      }

      const empNo = r.no || DB.nextEmpNo((r.name || '').split(' ')[0]);
      const newEmp = {
        id:        DB.nextId('e'),
        no:        empNo,
        name:      r.name,
        nameEn:    r.name,
        email:     r.email,
        phone:     r.phone,
        dept:      dept?.id || '',
        position:  r.position,
        salary:    r.salary,
        status:    r.status,
        gender:    r.gender,
        hireDate:  r.hireDate,
        notes:     r.notes,
        avatar:    r.name.charAt(0),
        avatarColor: 'gradient-primary',
        password:  r.password || Math.random().toString(36).slice(2, 10),
      };
      DB.employees.push(newEmp);
      DB.leaveBalances[newEmp.id] = { annual:21, sick:10, emergency:3, remaining:21, taken:0, sickTaken:0, emergencyTaken:0 };
      added++;
    });

    DB.save();
    App.closeModal();
    App.toast(`تم استيراد ${added} موظف بنجاح ✓`, 'success');
    this.render(document.getElementById('page-content'));
  },

  // ── EXPORT TO EXCEL ───────────────────────────────────────
  exportExcel() {
    if (typeof XLSX === 'undefined') { App.toast('جارٍ تحميل مكتبة Excel...', 'info'); return; }

    const headers = ['رقم الموظف','الاسم الكامل','البريد الإلكتروني','الهاتف','القسم','المنصب','الراتب الأساسي','تاريخ التعيين','الجنس','الحالة','ملاحظات'];
    const rows = DB.employees.map(e => [
      e.no, e.name, e.email, e.phone,
      DB.getDepartment(e.dept)?.name || '',
      e.position, e.salary, e.hireDate,
      e.gender === 'male' ? 'ذكر' : e.gender === 'female' ? 'أنثى' : '',
      e.status === 'active' ? 'نشط' : e.status === 'inactive' ? 'غير نشط' : 'في إجازة',
      e.notes || ''
    ]);

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    ws['!cols'] = [
      {wch:13},{wch:20},{wch:24},{wch:14},{wch:18},{wch:18},
      {wch:14},{wch:14},{wch:8},{wch:10},{wch:24}
    ];
    XLSX.utils.book_append_sheet(wb, ws, 'الموظفون');
    XLSX.writeFile(wb, `الموظفون_${new Date().toISOString().split('T')[0]}.xlsx`);
    App.toast('تم تصدير البيانات ✓', 'success');
  },

  exportCSVFile() {
    const data = DB.employees.map(e => ({
      'رقم الموظف':       e.no,
      'الاسم الكامل':     e.name,
      'البريد الإلكتروني':e.email,
      'الهاتف':           e.phone,
      'القسم':            DB.getDepartment(e.dept)?.name || '',
      'المنصب':           e.position,
      'الراتب الأساسي':   e.salary,
      'تاريخ التعيين':    e.hireDate,
      'الحالة':           e.status === 'active' ? 'نشط' : e.status === 'inactive' ? 'غير نشط' : 'في إجازة',
    }));
    App.exportCSV(data, `الموظفون_${new Date().toISOString().split('T')[0]}.csv`);
    App.toast('تم تصدير CSV ✓', 'success');
  },

  // ── PASSWORD MANAGEMENT ──────────────────────────────────

  openPasswordModal(id) {
    const emp = DB.getEmployee(id);
    if (!emp) return;
    const pwd = emp.password || '';
    App.openModal(`كلمة مرور — ${emp.name}`, `
      <div style="display:flex;flex-direction:column;gap:16px">

        <!-- Current password display -->
        <div class="card" style="background:var(--bg-input);border:none;box-shadow:none">
          <div class="card-body" style="padding:14px">
            <div style="font-size:11px;font-weight:700;color:var(--text-muted);margin-bottom:8px">كلمة المرور الحالية</div>
            <div style="display:flex;align-items:center;gap:8px">
              <input id="emp-cur-pass" type="password" value="${pwd}"
                style="flex:1;background:transparent;border:none;font-family:var(--font-en);font-size:15px;font-weight:700;color:var(--text-primary);letter-spacing:2px;outline:none" readonly>
              <button class="btn-icon btn" title="إظهار" onclick="const i=document.getElementById('emp-cur-pass');i.type=i.type==='password'?'text':'password';this.querySelector('i').className=i.type==='password'?'fas fa-eye':'fas fa-eye-slash'">
                <i class="fas fa-eye"></i>
              </button>
              <button class="btn-icon btn" title="نسخ" onclick="navigator.clipboard.writeText('${pwd}');App.toast('تم نسخ كلمة المرور ✓','success')">
                <i class="fas fa-copy"></i>
              </button>
            </div>
          </div>
        </div>

        <!-- Set new password -->
        <div class="app-form-group">
          <label>كلمة مرور جديدة</label>
          <div style="display:flex;gap:8px">
            <div style="position:relative;flex:1">
              <input class="app-form-input" id="emp-new-pass" type="password" placeholder="أدخل كلمة مرور جديدة" style="padding-left:40px">
              <button type="button" class="btn-icon btn" style="position:absolute;left:8px;top:50%;transform:translateY(-50%)"
                onclick="const i=document.getElementById('emp-new-pass');i.type=i.type==='password'?'text':'password';this.querySelector('i').className=i.type==='password'?'fas fa-eye':'fas fa-eye-slash'">
                <i class="fas fa-eye"></i>
              </button>
            </div>
            <button class="btn btn-outline" title="توليد تلقائي" onclick="EmployeesModule._generatePass()" style="white-space:nowrap">
              <i class="fas fa-dice"></i> توليد
            </button>
          </div>
        </div>

        <div style="display:flex;gap:10px;justify-content:flex-end">
          <button class="btn btn-outline" onclick="App.closeModal()">إلغاء</button>
          <button class="btn btn-primary" onclick="EmployeesModule.savePassword('${id}')">
            <i class="fas fa-save"></i> حفظ كلمة المرور
          </button>
        </div>
      </div>
    `);
  },

  _generatePass() {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$!';
    let pass = '';
    for (let i = 0; i < 10; i++) pass += chars[Math.floor(Math.random() * chars.length)];
    const inp = document.getElementById('emp-new-pass');
    if (inp) { inp.value = pass; inp.type = 'text'; }
    App.toast('تم توليد كلمة مرور جديدة', 'info');
  },

  savePassword(id) {
    const emp  = DB.getEmployee(id);
    if (!emp) return;
    const newPass = document.getElementById('emp-new-pass')?.value.trim();
    if (!newPass) { App.toast('يرجى إدخال كلمة مرور', 'error'); return; }
    if (newPass.length < 6) { App.toast('كلمة المرور يجب أن تكون 6 أحرف على الأقل', 'error'); return; }
    emp.password = newPass;
    DB.save();
    DB.logAudit(App.state.user?.id || 'admin', 'تغيير كلمة مرور موظف', 'الموظفون', `تم تغيير كلمة مرور ${emp.name}`);
    App.closeModal();
    App.toast(`تم حفظ كلمة مرور ${emp.name} ✓`, 'success');
  },

  // ─── إرسال بيانات الدخول عبر واتساب ─────────────────────────
  sendCredentials(id) {
    const emp = DB.getEmployee(id);
    if (!emp) return;

    const password = emp.password || emp.no;
    const link     = window.location.origin + '/employee.html';
    const phone    = emp.phone || '';

    App.openModal(`إرسال بيانات الدخول — ${emp.name}`, `
      <div style="display:flex;flex-direction:column;gap:16px">

        <div style="background:rgba(37,211,102,.08);border:1px solid rgba(37,211,102,.25);border-radius:12px;padding:16px">
          <div style="font-size:12px;font-weight:700;color:#25d366;margin-bottom:10px">
            <i class="fab fa-whatsapp"></i> معاينة الرسالة
          </div>
          <div style="font-size:13px;line-height:1.7;color:var(--text-primary);white-space:pre-line">🔐 <b>بيانات دخول بوابة الموظفين</b>

أهلاً ${emp.name}،
فيما يلي بيانات دخولك إلى بوابة الموظفين:

👤 <b>كود الموظف:</b> ${emp.no}
🔑 <b>كلمة المرور:</b> ${password}
🌐 <b>رابط الدخول:</b> ${link}

يُرجى الحفاظ على سرية بيانات دخولك.

إدارة الموارد البشرية — ${DB.company.name || 'الشركة'}</div>
        </div>

        <div class="app-form-group">
          <label class="app-form-label">رقم هاتف الموظف (واتساب)</label>
          <input id="cred-phone" class="app-form-input" type="tel" value="${phone}" placeholder="05xxxxxxxx">
          ${!phone ? '<div style="font-size:11px;color:var(--warning);margin-top:4px"><i class="fas fa-triangle-exclamation"></i> لا يوجد رقم هاتف محفوظ لهذا الموظف</div>' : ''}
        </div>

        <div style="display:flex;gap:10px">
          <button class="btn btn-primary" style="flex:1;background:#25d366;border-color:#25d366" onclick="EmployeesModule._doSendCredentials('${id}')">
            <i class="fab fa-whatsapp"></i> إرسال عبر واتساب
          </button>
          <button class="btn btn-secondary" onclick="App.closeModal()">إلغاء</button>
        </div>

      </div>
    `);
  },

  async _doSendCredentials(id) {
    const emp   = DB.getEmployee(id);
    if (!emp) return;
    const phone = document.getElementById('cred-phone')?.value.trim();
    if (!phone) { App.toast('أدخل رقم الهاتف', 'error'); return; }

    // حفظ الرقم على الموظف إذا تغيّر
    if (phone !== emp.phone) { emp.phone = phone; DB.save(); }

    App.closeModal();
    await WhatsApp.sendCredentials(emp);
  },
};
