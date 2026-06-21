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
          <button class="btn btn-secondary" onclick="EmployeesModule.exportData()"><i class="fas fa-file-excel"></i> ${t('common.export')}</button>
          <button class="btn btn-primary" onclick="EmployeesModule.openAdd()"><i class="fas fa-user-plus"></i> ${t('employees.addEmployee')}</button>
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
      const matchSearch = !this._search || e.name.includes(this._search) || e.nameEn.toLowerCase().includes(this._search.toLowerCase()) || e.no.includes(this._search) || e.email.includes(this._search);
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
        // تحديث الراتب في سجل الـ payroll
        const pr = DB.payroll.find(p => p.empId === id);
        if (pr && emp.salary) {
          pr.base      = emp.salary;
          pr.housing   = Math.round(emp.salary * 0.25);
          pr.transport = Math.round(emp.salary * 0.10);
          pr.food      = Math.round(emp.salary * 0.05);
          pr.total     = Math.max(0, pr.base + pr.housing + pr.transport + pr.food + pr.overtime - pr.absentDeduction - pr.lateDeduction);
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
        password: data.no || DB.nextEmpNo(), // default password = employee code
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
      DB.employees = DB.employees.filter(e => e.id !== id);
      App.toast(`${currentLang==='ar'?'تم حذف':'Deleted'} ${emp?.name}`, 'success');
      this.render(document.getElementById('page-content'));
    });
  },

  exportData() {
    const data = DB.employees.map(e => ({
      [t('employees.employeeId')]: e.no,
      [t('common.name')]:          e.name,
      [t('common.email')]:         e.email,
      [t('common.phone')]:         e.phone,
      [t('common.department')]:    DB.getDepartment(e.dept)?.name || '',
      [t('common.position')]:      e.position,
      [t('employees.salary')]:     e.salary,
      [t('common.status')]:        e.status,
      [t('employees.hireDate')]:   e.hireDate,
    }));
    App.exportCSV(data, 'employees.csv');
  }
};
