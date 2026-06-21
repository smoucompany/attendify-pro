/* =========================================================
   ROLES & PERMISSIONS MODULE — Permission Matrix
   ========================================================= */

const RolesModule = {
  render(container) {
    const modules = ['employees','attendance','leaves','requests','reports','payroll','settings','roles'];
    const moduleLabels = {
      employees: t('nav.employees'), attendance: t('nav.attendance'), leaves: t('nav.leaves'),
      requests: t('nav.requests'), reports: t('nav.reports'), payroll: t('nav.payroll'),
      settings: t('nav.settings'), roles: t('roles.title'),
    };

    container.innerHTML = `
      <div class="page-header">
        <div class="page-header-text">
          <h1>${t('roles.title')}</h1>
          <p>${t('roles.subtitle')}</p>
        </div>
        <div class="page-header-actions">
          <button class="btn btn-primary" onclick="RolesModule.openAdd()"><i class="fas fa-plus"></i> ${t('roles.addRole')}</button>
        </div>
      </div>

      <!-- Role Cards -->
      <div class="grid-4" style="margin-bottom:24px">
        ${DB.roles.map(role => `
          <div class="card stagger-item" style="border-top:3px solid var(--primary)">
            <div class="card-body">
              <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px">
                <div class="stat-icon ${role.color}" style="width:38px;height:38px;font-size:15px"><i class="fas fa-user-shield"></i></div>
                <div>
                  <div style="font-size:14px;font-weight:700;color:var(--text-primary)">${role.name}</div>
                  <div style="font-size:11px;color:var(--text-muted)">${role.users.length} ${currentLang==='ar'?'مستخدم':'users'}</div>
                </div>
              </div>
              <div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:12px">
                ${role.users.slice(0,3).map(uid => {
                  const emp = DB.getEmployee(uid);
                  return `<div class="avatar ${emp?.avatarColor||'gradient-primary'}" style="width:24px;height:24px;font-size:9px" title="${emp?.name||''}">${emp?.avatar||'?'}</div>`;
                }).join('')}
                ${role.users.length > 3 ? `<div style="width:24px;height:24px;border-radius:7px;background:var(--border);display:flex;align-items:center;justify-content:center;font-size:9px;color:var(--text-muted)">+${role.users.length-3}</div>` : ''}
              </div>
              <div style="display:flex;gap:6px">
                <button class="btn btn-outline-primary btn-sm" style="flex:1" onclick="RolesModule.viewRole('${role.id}')"><i class="fas fa-eye"></i></button>
                <button class="btn btn-secondary btn-sm"  style="flex:1" onclick="RolesModule.editRole('${role.id}')"><i class="fas fa-pencil"></i></button>
              </div>
            </div>
          </div>
        `).join('')}
      </div>

      <!-- Permission Matrix -->
      <div class="card">
        <div class="card-header">
          <h3><i class="fas fa-table" style="color:var(--primary)"></i> ${currentLang==='ar'?'مصفوفة الصلاحيات':'Permission Matrix'}</h3>
          <button class="btn btn-success btn-sm" onclick="RolesModule.saveMatrix()"><i class="fas fa-save"></i> ${t('common.save')}</button>
        </div>
        <div class="card-body" style="overflow-x:auto;padding:0">
          <table class="perm-table">
            <thead>
              <tr>
                <th style="text-align:${currentLang==='ar'?'right':'left'};padding:14px 20px">${t('audit.module')}</th>
                ${DB.roles.map(r=>`<th colspan="5" style="border-right:1px solid var(--border)">${r.name}</th>`).join('')}
              </tr>
              <tr>
                <th style="text-align:${currentLang==='ar'?'right':'left'};padding:10px 20px;font-size:11px">${currentLang==='ar'?'الوحدة':'Module'}</th>
                ${DB.roles.map(()=>`
                  <th style="font-size:10px">${t('roles.view')}</th>
                  <th style="font-size:10px">${t('roles.create')}</th>
                  <th style="font-size:10px">${t('roles.editPerm')}</th>
                  <th style="font-size:10px">${t('roles.deletePerm')}</th>
                  <th style="font-size:10px;border-right:1px solid var(--border)">${t('roles.approve')}</th>
                `).join('')}
              </tr>
            </thead>
            <tbody>
              ${modules.map(mod => `
                <tr>
                  <td style="font-weight:600;padding:12px 20px;text-align:${currentLang==='ar'?'right':'left'}">${moduleLabels[mod]||mod}</td>
                  ${DB.roles.map(role => {
                    const perms = role.permissions[mod] || {};
                    return ['view','create','edit','delete','approve'].map((perm, pi) => {
                      const checked = !!perms[perm];
                      return `
                        <td style="${pi===4?'border-right:1px solid var(--border)':''}">
                          <div class="perm-check ${checked?'checked':''}"
                            data-role="${role.id}" data-mod="${mod}" data-perm="${perm}"
                            onclick="this.classList.toggle('checked');this.textContent=this.classList.contains('checked')?'✓':'';">
                            ${checked?'✓':''}
                          </div>
                        </td>
                      `;
                    }).join('');
                  }).join('')}
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <!-- User-Role Assignment -->
      <div class="card" style="margin-top:20px">
        <div class="card-header">
          <h3><i class="fas fa-user-gear" style="color:var(--secondary)"></i> ${currentLang==='ar'?'تعيين المستخدمين للأدوار':'User-Role Assignments'}</h3>
        </div>
        <div class="card-body" style="padding:0">
          <div class="table-wrapper" style="border:none;border-radius:0">
            <table class="data-table">
              <thead>
                <tr>
                  <th>${t('common.name')}</th>
                  <th>${t('common.department')}</th>
                  <th>${currentLang==='ar'?'الدور الحالي':'Current Role'}</th>
                  <th>${t('common.actions')}</th>
                </tr>
              </thead>
              <tbody>
                ${DB.employees.filter(e=>e.status!=='terminated').map(emp => {
                  const role = DB.roles.find(r => r.users.includes(emp.id));
                  const roleName = role ? role.name : (currentLang==='ar'?'غير محدد':'Unassigned');
                  const badgeStyle = role
                    ? `background:var(--primary-bg);color:var(--primary)`
                    : `background:var(--bg-input);color:var(--text-muted)`;
                  return `
                    <tr>
                      <td>
                        <div class="table-avatar">
                          <div class="avatar ${emp.avatarColor}" style="width:30px;height:30px;font-size:11px">${emp.avatar}</div>
                          <div class="avatar-info">
                            <div class="avatar-name">${emp.name}</div>
                            <div class="avatar-sub">${emp.position||''}</div>
                          </div>
                        </div>
                      </td>
                      <td><span class="badge badge-primary">${DB.getDepartment(emp.dept)?.name||'—'}</span></td>
                      <td>
                        <span style="padding:4px 12px;border-radius:6px;font-size:12px;font-weight:600;${badgeStyle}">
                          ${roleName}
                        </span>
                      </td>
                      <td>
                        <select class="app-form-input app-form-select" style="font-size:12px;padding:6px 10px;min-width:160px"
                          onchange="RolesModule.changeRole('${emp.id}', this.value)">
                          <option value="" ${!role?'selected':''}>— ${currentLang==='ar'?'بدون دور':'No role'} —</option>
                          ${DB.roles.map(r=>`<option value="${r.id}" ${role?.id===r.id?'selected':''}>${r.name}</option>`).join('')}
                        </select>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  },

  viewRole(id) {
    const role = DB.roles.find(r => r.id === id);
    App.openModal(role.name, `
      <div style="display:flex;align-items:center;gap:14px;margin-bottom:20px;padding:16px;background:var(--bg-input);border-radius:12px">
        <div class="stat-icon ${role.color}" style="width:50px;height:50px;font-size:22px"><i class="fas fa-user-shield"></i></div>
        <div>
          <div style="font-size:18px;font-weight:800">${role.name}</div>
          <div style="color:var(--text-muted)">${role.users.length} ${currentLang==='ar'?'مستخدم':'users'}</div>
        </div>
      </div>
      <div style="font-size:12px;font-weight:700;color:var(--text-muted);margin-bottom:10px">${currentLang==='ar'?'المستخدمون':'Users'}</div>
      <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:16px">
        ${role.users.map(uid => {
          const emp = DB.getEmployee(uid);
          return `<div style="display:flex;align-items:center;gap:6px;background:var(--bg-input);padding:5px 10px;border-radius:8px;font-size:12px">
            <div class="avatar ${emp?.avatarColor}" style="width:20px;height:20px;font-size:8px">${emp?.avatar||'?'}</div>
            ${emp?.name||uid}
          </div>`;
        }).join('')}
      </div>
      <button class="btn btn-secondary w-full" onclick="App.closeModal()">${t('common.close')}</button>
    `, { size: 'sm' });
  },

  editRole(id) {
    const role = DB.roles.find(r => r.id === id);
    App.openModal(t('common.edit') + ' ' + role.name, `
      <form onsubmit="RolesModule.saveRole(event, '${id}')">
        <div class="app-form-group">
          <label>${t('roles.roleName')}</label>
          <input class="app-form-input" type="text" name="name" value="${role.name}" required>
        </div>
        <div class="modal-footer" style="padding:0;margin-top:16px">
          <button type="button" class="btn btn-secondary" onclick="App.closeModal()">${t('common.cancel')}</button>
          <button type="submit" class="btn btn-primary">${t('common.save')}</button>
        </div>
      </form>
    `, { size: 'sm' });
  },

  saveRole(e, id) {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target));
    const role = DB.roles.find(r => r.id === id);
    if (role) role.name = data.name;
    DB.save();
    App.closeModal();
    App.toast(currentLang==='ar'?'تم التحديث':'Updated', 'success');
    this.render(document.getElementById('page-content'));
  },

  openAdd() {
    App.openModal(t('roles.addRole'), `
      <form onsubmit="RolesModule.saveNewRole(event)">
        <div class="app-form-group">
          <label>${t('roles.roleName')}</label>
          <input class="app-form-input" type="text" name="name" required placeholder="${currentLang==='ar'?'اسم الدور الجديد':'New role name'}">
        </div>
        <div class="modal-footer" style="padding:0;margin-top:16px">
          <button type="button" class="btn btn-secondary" onclick="App.closeModal()">${t('common.cancel')}</button>
          <button type="submit" class="btn btn-primary"><i class="fas fa-save"></i> ${t('common.save')}</button>
        </div>
      </form>
    `, { size: 'sm' });
  },

  saveNewRole(e) {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target));
    DB.roles.push({
      id:    DB.nextId('role'),
      name:  data.name,
      nameEn:data.name,
      color: 'gradient-indigo',
      users: [],
      permissions: {},
    });
    DB.save();
    App.closeModal();
    App.toast(currentLang==='ar'?'تم إضافة الدور':'Role added', 'success');
    this.render(document.getElementById('page-content'));
  },

  changeRole(empId, roleId) {
    // Remove from all roles first
    DB.roles.forEach(r => {
      const i = r.users.indexOf(empId);
      if (i !== -1) r.users.splice(i, 1);
    });
    // Assign new role if selected
    if (roleId) {
      const newRole = DB.roles.find(r => r.id === roleId);
      if (newRole) newRole.users.push(empId);
    }
    DB.save();
    const emp = DB.getEmployee(empId);
    const roleName = roleId ? DB.roles.find(r=>r.id===roleId)?.name : (currentLang==='ar'?'بدون دور':'No role');
    App.toast(`${emp?.name} ← ${roleName}`, 'success');
    // Refresh badge in table row immediately
    this.render(document.getElementById('page-content'));
  },

  saveMatrix() {
    document.querySelectorAll('.perm-check[data-role]').forEach(el => {
      const { role: roleId, mod, perm } = el.dataset;
      const role = DB.roles.find(r => r.id === roleId);
      if (!role) return;
      if (!role.permissions[mod]) role.permissions[mod] = {};
      role.permissions[mod][perm] = el.classList.contains('checked');
    });
    DB.save();
    DB.logAudit('admin', currentLang==='ar'?'تعديل مصفوفة الصلاحيات':'Edit Permission Matrix', 'Roles', '');
    App.toast(currentLang==='ar'?'تم حفظ الصلاحيات بنجاح ✓':'Permissions saved ✓', 'success');
  }
};
