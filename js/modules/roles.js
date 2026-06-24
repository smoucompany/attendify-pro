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
                  return `<span title="${emp?.name||''}">${App.renderAvatar(emp, 24, 7)}</span>`;
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
      <div class="card" style="margin-bottom:20px">
        <div class="card-header" style="position:sticky;top:0;z-index:5;background:var(--bg-card)">
          <div style="display:flex;align-items:center;gap:10px">
            <div style="width:34px;height:34px;border-radius:10px;background:var(--primary-bg);color:var(--primary);display:flex;align-items:center;justify-content:center;font-size:14px">
              <i class="fas fa-shield-halved"></i>
            </div>
            <div>
              <h3 style="margin:0">${currentLang==='ar'?'مصفوفة الصلاحيات':'Permission Matrix'}</h3>
              <div style="font-size:11px;color:var(--text-muted);margin-top:1px">${currentLang==='ar'?'انقر على اسم الدور لتحديد الكل • انقر الخلية للتبديل':'Click role name to toggle all • Click cell to toggle'}</div>
            </div>
          </div>
          <button class="btn btn-success btn-sm" onclick="RolesModule.saveMatrix()">
            <i class="fas fa-save"></i> ${t('common.save')}
          </button>
        </div>

        <div style="overflow-x:auto;-webkit-overflow-scrolling:touch">
          <table class="perm-matrix-table">
            <colgroup>
              <col style="min-width:160px;width:160px">
              ${DB.roles.map(()=>`
                <col style="width:46px"><col style="width:46px"><col style="width:46px"><col style="width:46px"><col style="width:46px">
              `).join('')}
            </colgroup>
            <thead>
              <!-- Role names row -->
              <tr class="pmx-role-row">
                <th class="pmx-corner">${currentLang==='ar'?'الوحدة':'Module'}</th>
                ${DB.roles.map((r, ri) => {
                  const colors = ['#6366f1','#10b981','#f59e0b','#ef4444','#06b6d4','#8b5cf6'];
                  const c = colors[ri % colors.length];
                  return `<th colspan="5" class="pmx-role-hd" style="--rc:${c}" onclick="RolesModule.toggleAllRole('${r.id}')">
                    <span class="pmx-role-name">${r.name}</span>
                    <span class="pmx-role-count">${r.users.length}</span>
                  </th>`;
                }).join('')}
              </tr>
              <!-- Permission labels row -->
              <tr class="pmx-perm-row">
                <th class="pmx-corner-sub"></th>
                ${DB.roles.map((r, ri) => {
                  const colors = ['#6366f1','#10b981','#f59e0b','#ef4444','#06b6d4','#8b5cf6'];
                  const c = colors[ri % colors.length];
                  const perms = [
                    {k:'view',   icon:'fa-eye',        lbl:currentLang==='ar'?'عرض':'View'},
                    {k:'create', icon:'fa-plus',        lbl:currentLang==='ar'?'إنشاء':'Add'},
                    {k:'edit',   icon:'fa-pencil',      lbl:currentLang==='ar'?'تعديل':'Edit'},
                    {k:'delete', icon:'fa-trash',       lbl:currentLang==='ar'?'حذف':'Del'},
                    {k:'approve',icon:'fa-circle-check',lbl:currentLang==='ar'?'موافقة':'Appr'},
                  ];
                  return perms.map((p, pi) => `
                    <th class="pmx-ph" style="border-inline-end:${pi===4?`2px solid ${c}40`:'none'}">
                      <i class="fas ${p.icon}" title="${p.lbl}" style="color:${c};font-size:10px"></i>
                      <span class="pmx-ph-lbl">${p.lbl}</span>
                    </th>`).join('');
                }).join('')}
              </tr>
            </thead>
            <tbody>
              ${modules.map((mod, mi) => {
                const isEven = mi % 2 === 0;
                return `
                <tr class="pmx-row ${isEven?'pmx-row-even':''}" data-mod="${mod}">
                  <td class="pmx-mod-cell" onclick="RolesModule.toggleAllMod('${mod}')">
                    <span class="pmx-mod-name">${moduleLabels[mod]||mod}</span>
                    <i class="fas fa-chevron-left pmx-mod-arr"></i>
                  </td>
                  ${DB.roles.map((role, ri) => {
                    const colors = ['#6366f1','#10b981','#f59e0b','#ef4444','#06b6d4','#8b5cf6'];
                    const c = colors[ri % colors.length];
                    const perms = role.permissions[mod] || {};
                    return ['view','create','edit','delete','approve'].map((perm, pi) => {
                      const checked = !!perms[perm];
                      return `<td class="pmx-cell" style="border-inline-end:${pi===4?`2px solid ${c}30`:'none'}">
                        <div class="pmx-chk ${checked?'pmx-on':''}"
                          data-role="${role.id}" data-mod="${mod}" data-perm="${perm}"
                          style="${checked?`--cc:${c};background:${c};border-color:${c}`:''}"
                          onclick="RolesModule._toggleCell(this,'${c}')">
                          <i class="fas fa-check"></i>
                        </div>
                      </td>`;
                    }).join('');
                  }).join('')}
                </tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>

        <!-- Legend -->
        <div style="padding:10px 16px;border-top:1px solid var(--border);display:flex;flex-wrap:wrap;gap:16px;align-items:center">
          <span style="font-size:11px;color:var(--text-muted);font-weight:600">${currentLang==='ar'?'مفتاح الصلاحيات:':'Legend:'}</span>
          ${[
            {icon:'fa-eye',        lbl:currentLang==='ar'?'عرض':'View'},
            {icon:'fa-plus',       lbl:currentLang==='ar'?'إنشاء':'Create'},
            {icon:'fa-pencil',     lbl:currentLang==='ar'?'تعديل':'Edit'},
            {icon:'fa-trash',      lbl:currentLang==='ar'?'حذف':'Delete'},
            {icon:'fa-circle-check',lbl:currentLang==='ar'?'موافقة':'Approve'},
          ].map(l=>`
            <span style="display:flex;align-items:center;gap:5px;font-size:11px;color:var(--text-secondary)">
              <i class="fas ${l.icon}" style="color:var(--primary);font-size:11px"></i> ${l.lbl}
            </span>`).join('')}
          <span style="margin-inline-start:auto;font-size:11px;color:var(--text-muted)">
            <i class="fas fa-circle-info"></i> ${currentLang==='ar'?'انقر اسم الوحدة لتبديل صفها كلها':'Click module name to toggle row'}
          </span>
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
                          ${App.renderAvatar(emp, 30, 8)}
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
            ${App.renderAvatar(emp, 20, 6)}
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

  _toggleCell(el, color) {
    const on = el.classList.toggle('pmx-on');
    if (on) {
      el.style.background = color;
      el.style.borderColor = color;
      el.style.setProperty('--cc', color);
    } else {
      el.style.background = '';
      el.style.borderColor = '';
    }
  },

  toggleAllRole(roleId) {
    const cells = document.querySelectorAll(`.pmx-chk[data-role="${roleId}"]`);
    const allOn = [...cells].every(c => c.classList.contains('pmx-on'));
    cells.forEach(c => {
      const color = c.style.getPropertyValue('--cc') || c.style.background || '#6366f1';
      const savedColor = c.closest('td').style.borderInlineEnd?.split(' ')[2] || '#6366f1';
      if (allOn) {
        c.classList.remove('pmx-on');
        c.style.background = '';
        c.style.borderColor = '';
      } else {
        c.classList.add('pmx-on');
        c.style.background = savedColor;
        c.style.borderColor = savedColor;
      }
    });
  },

  toggleAllMod(mod) {
    const cells = document.querySelectorAll(`.pmx-chk[data-mod="${mod}"]`);
    const allOn = [...cells].every(c => c.classList.contains('pmx-on'));
    cells.forEach(c => {
      if (allOn) {
        c.classList.remove('pmx-on');
        c.style.background = '';
        c.style.borderColor = '';
      } else {
        const color = c.closest('td').style.borderInlineEnd?.split(' ')[2] || '#6366f1';
        c.classList.add('pmx-on');
        c.style.background = color || '#6366f1';
        c.style.borderColor = color || '#6366f1';
      }
    });
  },

  saveMatrix() {
    document.querySelectorAll('.pmx-chk[data-role]').forEach(el => {
      const { role: roleId, mod, perm } = el.dataset;
      const role = DB.roles.find(r => r.id === roleId);
      if (!role) return;
      if (!role.permissions[mod]) role.permissions[mod] = {};
      role.permissions[mod][perm] = el.classList.contains('pmx-on');
    });
    DB.save();
    DB.logAudit('admin', currentLang==='ar'?'تعديل مصفوفة الصلاحيات':'Edit Permission Matrix', 'Roles', '');
    App.toast(currentLang==='ar'?'تم حفظ الصلاحيات بنجاح ✓':'Permissions saved ✓', 'success');
  }
};
