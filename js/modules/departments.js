/* =========================================================
   DEPARTMENTS MODULE
   ========================================================= */

const DepartmentsModule = {

  // ── Palette ─────────────────────────────────────────────
  COLORS: [
    { hex: '#6366f1', name: 'بنفسجي' },
    { hex: '#10b981', name: 'أخضر'   },
    { hex: '#f59e0b', name: 'ذهبي'   },
    { hex: '#ef4444', name: 'أحمر'   },
    { hex: '#3b82f6', name: 'أزرق'   },
    { hex: '#ec4899', name: 'وردي'   },
    { hex: '#14b8a6', name: 'فيروزي' },
    { hex: '#f97316', name: 'برتقالي'},
    { hex: '#8b5cf6', name: 'موف'    },
    { hex: '#06b6d4', name: 'سماوي'  },
    { hex: '#84cc16', name: 'ليموني' },
    { hex: '#a855f7', name: 'أرجواني'},
  ],

  _color(d, idx) {
    // use saved hex, or legacy gradient class → palette, or pick by index
    if (d.hex) return d.hex;
    return this.COLORS[idx % this.COLORS.length].hex;
  },

  _iconBg(hex) {
    return `background:linear-gradient(135deg,${hex}dd,${hex}99)`;
  },

  _colorSwatches(selected) {
    return this.COLORS.map(c => `
      <label title="${c.name}" style="cursor:pointer">
        <input type="radio" name="hex" value="${c.hex}" ${selected===c.hex?'checked':''} style="display:none"
          onchange="document.getElementById('dept-color-preview').style.background='${c.hex}'">
        <div style="width:28px;height:28px;border-radius:8px;background:${c.hex};
          outline:${selected===c.hex?'3px solid var(--text-primary)':'3px solid transparent'};
          outline-offset:2px;transition:.15s"></div>
      </label>
    `).join('');
  },

  render(container) {
    container.innerHTML = `
      <div class="page-header">
        <div class="page-header-text">
          <h1>${t('departments.title')}</h1>
          <p>${t('departments.subtitle')} — ${DB.departments.length} ${currentLang==='ar'?'قسم':'departments'}</p>
        </div>
        <div class="page-header-actions">
          <button class="btn btn-primary" onclick="DepartmentsModule.openAdd()"><i class="fas fa-plus"></i> ${t('departments.addDept')}</button>
        </div>
      </div>

      <!-- Dept Cards Grid -->
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:16px;margin-bottom:24px">
        ${DB.departments.map((d, idx) => {
          const hex       = this._color(d, idx);
          const empCount  = DB.getEmployeesByDept(d.id).length;
          const presentCt = DB.getTodayAttendance().filter(a => DB.getEmployee(a.empId)?.dept === d.id).length;
          const pct       = empCount > 0 ? Math.round((presentCt/empCount)*100) : 0;
          return `
            <div class="dept-card stagger-item" style="border-top:4px solid ${hex}">
              <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:14px">
                <div class="dept-icon" style="${this._iconBg(hex)};margin-bottom:0">
                  <i class="${d.icon||'fas fa-building'}"></i>
                </div>
                <div style="display:flex;gap:4px">
                  <button class="btn-icon btn" onclick="DepartmentsModule.viewDept('${d.id}')"><i class="fas fa-eye"></i></button>
                  <button class="btn-icon btn" onclick="DepartmentsModule.editDept('${d.id}')"><i class="fas fa-pencil"></i></button>
                  <button class="btn-icon btn" style="color:var(--danger)" onclick="DepartmentsModule.deleteDept('${d.id}')"><i class="fas fa-trash"></i></button>
                </div>
              </div>
              <div class="dept-name">${d.name}</div>
              <div class="dept-manager"><i class="fas fa-user-tie"></i> ${d.manager||'—'}</div>
              <div style="margin-bottom:12px">
                <div style="display:flex;justify-content:space-between;font-size:12px;color:var(--text-muted);margin-bottom:4px">
                  <span>${currentLang==='ar'?'نسبة الحضور':'Attendance'}</span>
                  <span style="font-weight:700;color:${hex}">${pct}%</span>
                </div>
                <div class="progress-bar">
                  <div class="progress-fill" style="width:${pct}%;background:${hex}"></div>
                </div>
              </div>
              <div class="dept-stats">
                <div class="dept-stat">
                  <div class="dept-stat-val" style="color:${hex}">${empCount}</div>
                  <div class="dept-stat-label">${t('departments.employeeCount')}</div>
                </div>
                <div class="dept-stat">
                  <div class="dept-stat-val" style="color:var(--success)">${presentCt}</div>
                  <div class="dept-stat-label">${t('dashboard.presentToday')}</div>
                </div>
                <div class="dept-stat">
                  <div class="dept-stat-val" style="color:var(--danger)">${empCount - presentCt}</div>
                  <div class="dept-stat-label">${t('dashboard.absent')}</div>
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>

      <!-- Dept Table -->
      <div class="table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>${t('common.name')}</th>
              <th>${t('departments.manager')}</th>
              <th>${t('departments.employeeCount')}</th>
              <th>${currentLang==='ar'?'الفرع':'Branch'}</th>
              <th>${t('dashboard.presentToday')}</th>
              <th>${t('dashboard.attendanceRate')}</th>
              <th>${t('common.actions')}</th>
            </tr>
          </thead>
          <tbody>
            ${DB.departments.map((d, idx) => {
              const hex       = this._color(d, idx);
              const empCount  = DB.getEmployeesByDept(d.id).length;
              const presentCt = DB.getTodayAttendance().filter(a => DB.getEmployee(a.empId)?.dept === d.id).length;
              const pct       = empCount > 0 ? Math.round((presentCt/empCount)*100) : 0;
              const branch    = DB.company.branches.find(b => b.id === d.branch);
              return `
                <tr>
                  <td>
                    <div style="display:flex;align-items:center;gap:10px">
                      <div class="dept-icon" style="${this._iconBg(hex)};width:34px;height:34px;font-size:13px;margin-bottom:0">
                        <i class="${d.icon||'fas fa-building'}"></i>
                      </div>
                      <span style="font-weight:600;color:var(--text-primary)">${d.name}</span>
                    </div>
                  </td>
                  <td style="color:var(--text-secondary)">${d.manager||'—'}</td>
                  <td><span style="font-weight:700;color:var(--text-primary)">${empCount}</span></td>
                  <td><span class="badge" style="background:${hex}22;color:${hex}">${branch?.name||'—'}</span></td>
                  <td><span style="font-weight:600;color:var(--success)">${presentCt}</span></td>
                  <td>
                    <div style="display:flex;align-items:center;gap:8px">
                      <div class="progress-bar" style="width:80px">
                        <div class="progress-fill" style="width:${pct}%;background:${hex}"></div>
                      </div>
                      <span style="font-size:12px;font-weight:700;color:${hex}">${pct}%</span>
                    </div>
                  </td>
                  <td>
                    <div style="display:flex;gap:4px">
                      <button class="btn-icon btn" onclick="DepartmentsModule.viewDept('${d.id}')"><i class="fas fa-eye"></i></button>
                      <button class="btn-icon btn" onclick="DepartmentsModule.editDept('${d.id}')"><i class="fas fa-pencil"></i></button>
                      <button class="btn-icon btn" style="color:var(--danger)" onclick="DepartmentsModule.deleteDept('${d.id}')"><i class="fas fa-trash"></i></button>
                    </div>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;
  },

  viewDept(id) {
    const dept  = DB.getDepartment(id);
    const idx   = DB.departments.findIndex(d => d.id === id);
    const hex   = this._color(dept, idx);
    const emps  = DB.getEmployeesByDept(id);
    App.openModal(dept.name, `
      <div style="display:flex;align-items:center;gap:14px;margin-bottom:20px;padding:16px;background:${hex}11;border:1px solid ${hex}33;border-radius:12px">
        <div class="dept-icon" style="${this._iconBg(hex)};width:56px;height:56px;font-size:22px;margin-bottom:0"><i class="${dept.icon||'fas fa-building'}"></i></div>
        <div>
          <div style="font-size:18px;font-weight:800;color:${hex}">${dept.name}</div>
          <div style="color:var(--text-muted);font-size:13px;margin-top:3px"><i class="fas fa-user-tie"></i> ${dept.manager||'—'}</div>
        </div>
      </div>
      <div style="font-size:13px;font-weight:700;color:var(--text-muted);margin-bottom:10px">${t('nav.employees')} (${emps.length})</div>
      <div style="display:flex;flex-direction:column;gap:8px;max-height:280px;overflow-y:auto">
        ${emps.length ? emps.map(e => `
          <div style="display:flex;align-items:center;gap:10px;padding:8px;border-radius:8px;background:var(--bg-input)">
            ${App.renderAvatar(e, 30, 8)}
            <div style="flex:1">
              <div style="font-size:13px;font-weight:600">${e.name}</div>
              <div style="font-size:11px;color:var(--text-muted)">${e.position}</div>
            </div>
            ${App.getStatusBadge(e.status)}
          </div>
        `).join('') : `<div style="text-align:center;color:var(--text-muted);padding:20px">${currentLang==='ar'?'لا يوجد موظفون في هذا القسم':'No employees in this department'}</div>`}
      </div>
    `);
  },

  _form(d, idx) {
    const hex = d ? this._color(d, idx) : this.COLORS[DB.departments.length % this.COLORS.length].hex;
    return `
      <div class="app-form-group">
        <label>${currentLang==='ar'?'اسم القسم':'Department Name'}</label>
        <input class="app-form-input" type="text" name="name" value="${d?.name||''}" required>
      </div>
      <div class="app-form-group">
        <label>${t('departments.manager')}</label>
        <select class="app-form-input app-form-select" name="managerId">
          <option value="">${currentLang==='ar'?'— اختر مديراً —':'— Select Manager —'}</option>
          ${DB.employees.map(e=>`<option value="${e.id}" ${d?.managerId===e.id?'selected':''}>${e.name}</option>`).join('')}
        </select>
      </div>
      <div class="app-form-group">
        <label>${currentLang==='ar'?'لون القسم':'Department Color'}</label>
        <div style="display:flex;align-items:center;gap:12px;margin-top:6px">
          <div id="dept-color-preview" style="width:40px;height:40px;border-radius:10px;background:${hex};flex-shrink:0;transition:.2s"></div>
          <div style="display:flex;flex-wrap:wrap;gap:8px">
            ${this._colorSwatches(hex)}
          </div>
        </div>
      </div>
    `;
  },

  editDept(id) {
    const d   = DB.getDepartment(id);
    const idx = DB.departments.findIndex(dep => dep.id === id);
    App.openModal(t('common.edit') + ' ' + d.name, `
      <form onsubmit="DepartmentsModule.saveDept(event, '${id}')">
        ${this._form(d, idx)}
        <div class="modal-footer" style="padding:0;margin-top:20px">
          <button type="button" class="btn btn-secondary" onclick="App.closeModal()">${t('common.cancel')}</button>
          <button type="submit" class="btn btn-primary">${t('common.save')}</button>
        </div>
      </form>
    `, { size: 'sm' });
  },

  saveDept(e, id) {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target));
    const dept = DB.getDepartment(id);
    if (dept) {
      const mgr = DB.getEmployee(data.managerId);
      dept.name      = data.name;
      dept.manager   = mgr?.name || dept.manager;
      dept.managerId = data.managerId;
      if (data.hex) dept.hex = data.hex;
    }
    DB.save();
    App.closeModal();
    App.toast(currentLang==='ar'?'تم التحديث':'Updated', 'success');
    this.render(document.getElementById('page-content'));
  },

  deleteDept(id) {
    const dept = DB.getDepartment(id);
    if (!dept) return;
    const empCount = DB.getEmployeesByDept(id).length;
    const msg = empCount > 0
      ? (currentLang === 'ar'
          ? `القسم "${dept.name}" يحتوي على ${empCount} موظف — سيتم إلغاء تعيين القسم عنهم. هل تريد المتابعة؟`
          : `Department "${dept.name}" has ${empCount} employees — they will be unassigned. Continue?`)
      : (currentLang === 'ar'
          ? `هل تريد حذف قسم "${dept.name}"؟`
          : `Delete department "${dept.name}"?`);

    App.confirm(msg, () => {
      // إلغاء تعيين القسم عن موظفيه
      DB.employees.forEach(e => { if (e.dept === id) e.dept = ''; });
      // حذف القسم
      const i = DB.departments.findIndex(d => d.id === id);
      if (i !== -1) DB.departments.splice(i, 1);
      DB.save();
      DB.logAudit('admin', currentLang==='ar'?'حذف قسم':'Delete Department', 'Departments', dept.name);
      App.toast(currentLang==='ar'?`تم حذف قسم "${dept.name}"`:`Department "${dept.name}" deleted`, 'success');
      this.render(document.getElementById('page-content'));
    });
  },

  openAdd() {
    App.openModal(t('departments.addDept'), `
      <form onsubmit="DepartmentsModule.saveNewDept(event)">
        ${this._form(null, DB.departments.length)}
        <div class="modal-footer" style="padding:0;margin-top:20px">
          <button type="button" class="btn btn-secondary" onclick="App.closeModal()">${t('common.cancel')}</button>
          <button type="submit" class="btn btn-primary"><i class="fas fa-save"></i> ${t('common.save')}</button>
        </div>
      </form>
    `, { size: 'sm' });
  },

  saveNewDept(e) {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target));
    const mgr  = DB.getEmployee(data.managerId);
    const hex  = data.hex || this.COLORS[DB.departments.length % this.COLORS.length].hex;
    DB.departments.push({
      id: DB.nextId('d'), name: data.name, nameEn: data.name,
      icon: 'fas fa-building', hex,
      manager: mgr?.name||'', managerId: data.managerId, count: 0, branch: 'b1',
    });
    DB.save();
    App.closeModal();
    App.toast(currentLang==='ar'?'تمت إضافة القسم':'Department added', 'success');
    this.render(document.getElementById('page-content'));
  }
};
