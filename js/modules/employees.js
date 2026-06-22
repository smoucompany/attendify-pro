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
            <i class="fas fa-arrows-up-down"></i> استيراد / تصدير
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
        <div class="employee-card-avatar ${e.avatarColor}">${e.avatar}</div>
        <div class="employee-card-name">${e.name}</div>
        <div class="employee-card-role">${e.position}</div>
        <div class="employee-card-dept" style="color:${deptHex}"><i class="fas fa-building"></i> ${dept?.name || ''}</div>
        <div class="employee-card-stats">
          <div class="emp-stat">
            <div class="emp-stat-val">${DB.leaveBalances[e.id]?.remaining || 0}</div>
            <div class="emp-stat-label">${t('leaves.remaining')}</div>
          </div>
          <div class="emp-stat">
            <div class="emp-stat-val">${DB.attendance.filter(a=>a.empId===e.id).length}</div>
            <div class="emp-stat-label">${t('nav.attendance')}</div>
          </div>
          <div class="emp-stat">
            <div class="emp-stat-val">${App.formatCurrency(e.salary)}</div>
            <div class="emp-stat-label">${t('payroll.baseSalary')}</div>
          </div>
        </div>
        <div style="margin-bottom:12px">${App.getStatusBadge(e.status)}</div>
        <div class="employee-card-actions">
          <button class="btn btn-outline-primary btn-sm" onclick="EmployeesModule.viewEmployee('${e.id}')"><i class="fas fa-eye"></i></button>
          <button class="btn btn-secondary btn-sm" onclick="EmployeesModule.openEdit('${e.id}')"><i class="fas fa-pencil"></i></button>
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
            <div class="avatar ${e.avatarColor}">${e.avatar}</div>
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

  openEdit(id) {
    const emp = DB.getEmployee(id);
    App.openModal(t('employees.editTitle'), this._form(emp));
  },

  _form(emp) {
    const nextNo = emp ? emp.no : DB.nextEmpNo();
    return `
      <form onsubmit="EmployeesModule.saveEmployee(event, '${emp?.id||''}')">
        <div class="app-form-group">
          <label>${t('employees.employeeId')} <span style="color:var(--text-muted);font-weight:400;font-size:11px">(كود الدخول لبوابة الموظف)</span></label>
          <div style="display:flex;align-items:center;gap:10px;background:var(--bg-input,#f8fafc);border:1.5px solid var(--border);border-radius:10px;padding:10px 14px">
            <i class="fas fa-hashtag" style="color:var(--primary)"></i>
            <span style="font-size:18px;font-weight:800;letter-spacing:3px;color:var(--text-primary)">${nextNo}</span>
            <span style="font-size:11px;color:var(--text-muted);margin-right:auto">${emp ? 'كود موجود' : 'يتولد تلقائياً'}</span>
          </div>
          <input type="hidden" name="no" value="${nextNo}">
        </div>
        <div class="app-form-row">
          <div class="app-form-group">
            <label>${t('employees.firstName')}</label>
            <input class="app-form-input" type="text" name="firstName" value="${emp ? emp.name.split(' ')[0] : ''}" required>
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
            <input class="app-form-input" type="number" name="salary" value="${emp?.salary||''}" min="0" step="100">
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
        no: data.no || DB.nextEmpNo(),
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
        avatar: fullName.charAt(0),
        avatarColor: 'gradient-primary',
        password: Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 6),
      };
      DB.employees.push(newEmp);
      // رصيد الإجازات
      DB.leaveBalances[newEmp.id] = { annual: 21, sick: 10, emergency: 3, remaining: 21, taken: 0 };
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
        <div class="avatar ${emp.avatarColor}" style="width:80px;height:80px;font-size:30px;margin:0 auto 12px;border-radius:20px">${emp.avatar}</div>
        <h2 style="font-size:20px;font-weight:800">${emp.name}</h2>
        <p style="color:var(--text-muted)">${emp.position}</p>
        <div style="margin-top:8px">${App.getStatusBadge(emp.status)}</div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:20px">
        ${[
          ['fas fa-hashtag', t('employees.employeeId'), emp.no],
          ['fas fa-building', t('common.department'), dept?.name||''],
          ['fas fa-envelope', t('common.email'), emp.email],
          ['fas fa-phone', t('common.phone'), emp.phone],
          ['fas fa-calendar', t('employees.hireDate'), App.formatDate(emp.hireDate)],
          ['fas fa-money-bill', t('employees.salary'), App.formatCurrency(emp.salary)],
          ['fas fa-clock', t('nav.attendance'), attCount + ' ' + t('common.month')],
          ['fas fa-calendar-minus', t('leaves.remaining'), (bal.remaining||0) + ' ' + t('leaves.days')],
        ].map(([icon,label,val]) => `
          <div style="background:var(--bg-input);border-radius:10px;padding:12px">
            <div style="font-size:11px;color:var(--text-muted);margin-bottom:4px"><i class="${icon}"></i> ${label}</div>
            <div style="font-size:14px;font-weight:600;color:var(--text-primary)">${val}</div>
          </div>
        `).join('')}
      </div>
      ${Biometrics.renderBiometricCard(id)}
      <div style="display:flex;gap:10px;justify-content:center;margin-top:16px">
        <button class="btn btn-outline-primary" onclick="App.closeModal(); EmployeesModule.openEdit('${id}')"><i class="fas fa-pencil"></i> ${t('common.edit')}</button>
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

  exportData() { this.openImportExport(); },

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
    if (typeof XLSX === 'undefined') {
      App.toast('جارٍ تحميل مكتبة Excel...', 'info');
      return;
    }
    const wb = XLSX.utils.book_new();

    // ── شيت البيانات ──
    const headers = [
      'الاسم الأول *', 'اسم العائلة *', 'رقم الهاتف', 'البريد الإلكتروني',
      'القسم *', 'المنصب / الوظيفة', 'الراتب الأساسي *', 'تاريخ التعيين *',
      'الجنس', 'الحالة', 'رقم الموظف', 'ملاحظات'
    ];
    const sample = [
      'أحمد', 'محمد', '0501234567', 'ahmed@company.com',
      'الموارد البشرية', 'محاسب', 5000, '2024-01-15',
      'ذكر', 'نشط', 'EMP-001', 'موظف نموذجي'
    ];

    const wsData = [headers, sample];
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // عرض الأعمدة
    ws['!cols'] = [
      {wch:16},{wch:16},{wch:15},{wch:24},{wch:18},{wch:20},
      {wch:15},{wch:15},{wch:10},{wch:12},{wch:13},{wch:22}
    ];

    // نطاق الجدول
    ws['!ref'] = XLSX.utils.encode_range({ s:{r:0,c:0}, e:{r:101,c:11} });

    XLSX.utils.book_append_sheet(wb, ws, 'بيانات الموظفين');

    // ── شيت التعليمات ──
    const wsInst = XLSX.utils.aoa_to_sheet([
      ['حقل', 'مطلوب؟', 'الوصف', 'مثال'],
      ['الاسم الأول',         'نعم', 'اسم الموظف الأول',                    'أحمد'],
      ['اسم العائلة',         'نعم', 'اسم العائلة',                           'محمد'],
      ['رقم الهاتف',          'لا',  'رقم الجوال مع رمز الدولة',             '0501234567'],
      ['البريد الإلكتروني',   'لا',  'للتواصل والإشعارات',                   'ahmed@co.com'],
      ['القسم',               'نعم', 'يجب أن يكون موجوداً في النظام',        'الموارد البشرية'],
      ['المنصب / الوظيفة',    'لا',  'المسمى الوظيفي',                        'محاسب'],
      ['الراتب الأساسي',      'نعم', 'أرقام فقط بدون رموز',                  '5000'],
      ['تاريخ التعيين',       'نعم', 'بالصيغة YYYY-MM-DD',                   '2024-01-15'],
      ['الجنس',               'لا',  'ذكر أو أنثى',                           'ذكر'],
      ['الحالة',              'لا',  'نشط / غير نشط / في إجازة',             'نشط'],
      ['رقم الموظف',          'لا',  'سيُولَّد تلقائياً إن تُرك فارغاً',     'EMP-001'],
      ['ملاحظات',             'لا',  'أي ملاحظات إضافية',                    ''],
      [],
      ['تعليمات مهمة:'],
      ['• لا تغيّر أسماء الأعمدة في الصف الأول'],
      ['• احذف صف المثال (الصف 2) قبل الرفع'],
      ['• الحقول المعلّمة بـ (*) إلزامية'],
    ]);
    wsInst['!cols'] = [{wch:20},{wch:10},{wch:36},{wch:18}];
    XLSX.utils.book_append_sheet(wb, wsInst, 'تعليمات');

    XLSX.writeFile(wb, 'قالب_رفع_الموظفين.xlsx');
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
        const wb   = XLSX.read(e.target.result, { type: 'binary' });
        const ws   = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(ws, { defval: '' });

        if (!rows.length) { App.toast('الملف فارغ أو لا يحتوي بيانات', 'error'); return; }

        // map headers → employee fields
        const mapped = rows.map((r, idx) => {
          const firstName = (r['الاسم الأول *'] || r['الاسم الأول'] || '').toString().trim();
          const lastName  = (r['اسم العائلة *'] || r['اسم العائلة'] || '').toString().trim();
          const name = [firstName, lastName].filter(Boolean).join(' ');

          const statusRaw = (r['الحالة'] || 'نشط').toString().trim();
          const statusMap = { 'نشط':'active', 'active':'active', 'غير نشط':'inactive', 'inactive':'inactive', 'في إجازة':'on_leave', 'on_leave':'on_leave' };

          const genderRaw = (r['الجنس'] || '').toString().trim();
          const genderMap = { 'ذكر':'male', 'male':'male', 'أنثى':'female', 'female':'female' };

          const dept    = (r['القسم *'] || r['القسم'] || '').toString().trim();
          const salary  = parseFloat(r['الراتب الأساسي *'] || r['الراتب الأساسي'] || 0) || 0;
          const hireDate= (r['تاريخ التعيين *'] || r['تاريخ التعيين'] || new Date().toISOString().split('T')[0]).toString().trim();

          return {
            _row:     idx + 2,
            _valid:   !!name,
            _error:   !name ? 'الاسم مطلوب' : '',
            name, firstName, lastName,
            phone:    (r['رقم الهاتف']         || '').toString().trim(),
            email:    (r['البريد الإلكتروني']   || '').toString().trim(),
            deptName: dept,
            position: (r['المنصب / الوظيفة']    || '').toString().trim(),
            salary,
            hireDate,
            gender:   genderMap[genderRaw] || 'male',
            status:   statusMap[statusRaw]  || 'active',
            no:       (r['رقم الموظف']         || '').toString().trim(),
            notes:    (r['ملاحظات']             || '').toString().trim(),
          };
        }).filter(r => r.name); // skip fully empty rows

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

      const empNo = r.no || DB.nextEmpNo();
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
        password:  Math.random().toString(36).slice(2, 10),
      };
      DB.employees.push(newEmp);
      DB.leaveBalances[newEmp.id] = { annual:21, sick:10, emergency:3, remaining:21, taken:0 };
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
};
