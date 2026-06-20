/* =========================================================
   DEPARTMENTS MODULE
   ========================================================= */

const DepartmentsModule = {
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
        ${DB.departments.map(d => {
          const empCount  = DB.getEmployeesByDept(d.id).length;
          const presentCt = DB.getTodayAttendance().filter(a => DB.getEmployee(a.empId)?.dept === d.id).length;
          const pct       = empCount > 0 ? Math.round((presentCt/empCount)*100) : 0;
          return `
            <div class="dept-card stagger-item">
              <div class="dept-icon ${d.color}"><i class="${d.icon}"></i></div>
              <div class="dept-name">${d.name}</div>
              <div class="dept-manager"><i class="fas fa-user-tie"></i> ${d.manager}</div>
              <div style="margin-bottom:12px">
                <div style="display:flex;justify-content:space-between;font-size:12px;color:var(--text-muted);margin-bottom:4px">
                  <span>${currentLang==='ar'?'نسبة الحضور':'Attendance'}</span>
                  <span style="font-weight:700;color:var(--text-primary)">${pct}%</span>
                </div>
                <div class="progress-bar">
                  <div class="progress-fill ${pct >= 80 ? 'gradient-success' : pct >= 60 ? 'gradient-warning' : 'gradient-danger'}" style="width:${pct}%"></div>
                </div>
              </div>
              <div class="dept-stats">
                <div class="dept-stat">
                  <div class="dept-stat-val">${empCount}</div>
                  <div class="dept-stat-label">${t('departments.employeeCount')}</div>
                </div>
                <div class="dept-stat">
                  <div class="dept-stat-val">${presentCt}</div>
                  <div class="dept-stat-label">${t('dashboard.presentToday')}</div>
                </div>
                <div class="dept-stat">
                  <div class="dept-stat-val">${empCount - presentCt}</div>
                  <div class="dept-stat-label">${t('dashboard.absent')}</div>
                </div>
              </div>
              <div style="display:flex;gap:8px;margin-top:16px">
                <button class="btn btn-outline-primary btn-sm" style="flex:1" onclick="DepartmentsModule.viewDept('${d.id}')"><i class="fas fa-eye"></i> ${t('common.view')}</button>
                <button class="btn btn-secondary btn-sm" style="flex:1" onclick="DepartmentsModule.editDept('${d.id}')"><i class="fas fa-pencil"></i> ${t('common.edit')}</button>
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
            ${DB.departments.map(d => {
              const empCount  = DB.getEmployeesByDept(d.id).length;
              const presentCt = DB.getTodayAttendance().filter(a => DB.getEmployee(a.empId)?.dept === d.id).length;
              const pct       = empCount > 0 ? Math.round((presentCt/empCount)*100) : 0;
              const branch    = DB.company.branches.find(b => b.id === d.branch);
              return `
                <tr>
                  <td>
                    <div style="display:flex;align-items:center;gap:10px">
                      <div class="dept-icon ${d.color}" style="width:34px;height:34px;font-size:13px"><i class="${d.icon}"></i></div>
                      <span style="font-weight:600;color:var(--text-primary)">${d.name}</span>
                    </div>
                  </td>
                  <td style="color:var(--text-secondary)">${d.manager}</td>
                  <td><span style="font-weight:700;color:var(--text-primary)">${empCount}</span></td>
                  <td><span class="badge badge-primary">${branch?.name||''}</span></td>
                  <td><span style="font-weight:600;color:var(--success)">${presentCt}</span></td>
                  <td>
                    <div style="display:flex;align-items:center;gap:8px">
                      <div class="progress-bar" style="width:80px">
                        <div class="progress-fill gradient-primary" style="width:${pct}%"></div>
                      </div>
                      <span style="font-size:12px;font-weight:700">${pct}%</span>
                    </div>
                  </td>
                  <td>
                    <div style="display:flex;gap:4px">
                      <button class="btn-icon btn" onclick="DepartmentsModule.viewDept('${d.id}')"><i class="fas fa-eye"></i></button>
                      <button class="btn-icon btn" onclick="DepartmentsModule.editDept('${d.id}')"><i class="fas fa-pencil"></i></button>
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
    const emps  = DB.getEmployeesByDept(id);
    App.openModal(dept.name, `
      <div style="display:flex;align-items:center;gap:14px;margin-bottom:20px;padding:16px;background:var(--bg-input);border-radius:12px">
        <div class="dept-icon ${dept.color}" style="width:56px;height:56px;font-size:22px"><i class="${dept.icon}"></i></div>
        <div>
          <div style="font-size:18px;font-weight:800">${dept.name}</div>
          <div style="color:var(--text-muted);font-size:13px"><i class="fas fa-user-tie"></i> ${dept.manager}</div>
        </div>
      </div>
      <div style="font-size:13px;font-weight:700;color:var(--text-muted);margin-bottom:10px">${t('nav.employees')} (${emps.length})</div>
      <div style="display:flex;flex-direction:column;gap:8px;max-height:280px;overflow-y:auto">
        ${emps.map(e => `
          <div style="display:flex;align-items:center;gap:10px;padding:8px;border-radius:8px;background:var(--bg-input)">
            <div class="avatar ${e.avatarColor}" style="width:30px;height:30px;font-size:11px">${e.avatar}</div>
            <div style="flex:1">
              <div style="font-size:13px;font-weight:600">${e.name}</div>
              <div style="font-size:11px;color:var(--text-muted)">${e.position}</div>
            </div>
            ${App.getStatusBadge(e.status)}
          </div>
        `).join('')}
      </div>
    `);
  },

  editDept(id) {
    const d = DB.getDepartment(id);
    App.openModal(t('common.edit') + ' ' + d.name, `
      <form onsubmit="DepartmentsModule.saveDept(event, '${id}')">
        <div class="app-form-group">
          <label>${currentLang==='ar'?'اسم القسم':'Department Name'}</label>
          <input class="app-form-input" type="text" name="name" value="${d.name}" required>
        </div>
        <div class="app-form-group">
          <label>${t('departments.manager')}</label>
          <select class="app-form-input app-form-select" name="managerId">
            ${DB.employees.map(e=>`<option value="${e.id}" ${d.managerId===e.id?'selected':''}>${e.name}</option>`).join('')}
          </select>
        </div>
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
    }
    App.closeModal();
    App.toast(currentLang==='ar'?'تم التحديث':'Updated', 'success');
    this.render(document.getElementById('page-content'));
  },

  openAdd() {
    App.openModal(t('departments.addDept'), `
      <form onsubmit="DepartmentsModule.saveNewDept(event)">
        <div class="app-form-group">
          <label>${currentLang==='ar'?'اسم القسم':'Name'}</label>
          <input class="app-form-input" type="text" name="name" required>
        </div>
        <div class="app-form-group">
          <label>${t('departments.manager')}</label>
          <select class="app-form-input app-form-select" name="managerId">
            <option value="">${currentLang==='ar'?'— اختر مديراً —':'— Select Manager —'}</option>
            ${DB.employees.map(e=>`<option value="${e.id}">${e.name}</option>`).join('')}
          </select>
        </div>
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
    DB.departments.push({
      id: DB.nextId('d'), name: data.name, nameEn: data.name,
      icon: 'fas fa-building', color: 'gradient-primary',
      manager: mgr?.name||'', managerId: data.managerId, count: 0, branch: 'b1',
    });
    App.closeModal();
    App.toast(currentLang==='ar'?'تمت إضافة القسم':'Department added', 'success');
    this.render(document.getElementById('page-content'));
  }
};
