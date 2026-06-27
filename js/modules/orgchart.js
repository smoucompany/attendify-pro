/* =========================================================
   ORG CHART MODULE — الهيكل التنظيمي
   ========================================================= */

const OrgChartModule = {

  _view: 'tree',
  _collapsedDepts: new Set(), // depts user explicitly collapsed

  render(container) {
    const isAr = currentLang === 'ar';
    container.innerHTML = `
      <div class="page-header">
        <div class="page-header-text">
          <h1>${t('orgchart.title')}</h1>
          <p>${t('orgchart.subtitle')}</p>
        </div>
        <div class="page-header-actions" style="gap:8px">
          <div style="display:flex;background:var(--bg-secondary);border-radius:10px;padding:4px;gap:4px;border:1px solid var(--border)">
            <button class="btn ${this._view==='tree'?'btn-primary':''}" style="${this._view!=='tree'?'background:transparent;box-shadow:none;color:var(--text-muted)':''};border-radius:7px;padding:6px 14px;font-size:13px"
              onclick="OrgChartModule._view='tree';OrgChartModule.render(document.getElementById('page-content'))">
              <i class="fas fa-sitemap"></i> ${t('orgchart.treeView')}
            </button>
            <button class="btn ${this._view==='list'?'btn-primary':''}" style="${this._view!=='list'?'background:transparent;box-shadow:none;color:var(--text-muted)':''};border-radius:7px;padding:6px 14px;font-size:13px"
              onclick="OrgChartModule._view='list';OrgChartModule.render(document.getElementById('page-content'))">
              <i class="fas fa-th-large"></i> ${t('orgchart.listView')}
            </button>
          </div>
          <button class="btn btn-secondary" onclick="OrgChartModule._print()">
            <i class="fas fa-print"></i> ${t('common.print')}
          </button>
        </div>
      </div>

      ${this._renderStats(isAr)}

      <div id="orgchart-body">
        ${this._view === 'tree' ? this._renderTree(isAr) : this._renderList(isAr)}
      </div>
    `;
  },

  _renderStats(isAr) {
    const emps    = DB.employees.filter(e => e.status !== 'inactive');
    const depts   = DB.departments;
    const managers = depts.filter(d => d.manager).length;
    const unassigned = emps.filter(e => !e.dept || !depts.find(d => d.id === e.dept)).length;

    const stats = [
      { icon: 'fas fa-users',        color: '#6366f1', bg: '#6366f115', val: emps.length,      lbl: t('orgchart.totalEmployees') || (isAr ? 'إجمالي الموظفين' : 'Total Employees') },
      { icon: 'fas fa-building',     color: '#10b981', bg: '#10b98115', val: depts.length,     lbl: t('nav.departments') },
      { icon: 'fas fa-user-tie',     color: '#f59e0b', bg: '#f59e0b15', val: managers,         lbl: isAr ? 'المديرون' : 'Managers' },
      { icon: 'fas fa-user-slash',   color: '#ef4444', bg: '#ef444415', val: unassigned,       lbl: t('orgchart.unassigned') },
    ];

    return `
      <div class="orgchart-stats">
        ${stats.map(s => `
          <div class="orgchart-stat-card">
            <div class="orgchart-stat-icon" style="background:${s.bg};color:${s.color}">
              <i class="${s.icon}"></i>
            </div>
            <div>
              <div class="orgchart-stat-val">${s.val}</div>
              <div class="orgchart-stat-lbl">${s.lbl}</div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  },

  _renderTree(isAr) {
    const company = DB.company;
    const depts   = DB.departments;
    const emps    = DB.employees.filter(e => e.status !== 'inactive');

    if (depts.length === 0) {
      return `<div class="empty-state">
        <div class="empty-icon"><i class="fas fa-sitemap"></i></div>
        <div class="empty-title">${t('orgchart.noDepts')}</div>
        <p class="empty-desc">${t('orgchart.noDeptsDesc')}</p>
        <a href="#departments" class="btn btn-primary" style="margin-top:12px">
          <i class="fas fa-plus"></i> ${t('orgchart.addDepts')}
        </a>
      </div>`;
    }

    return `
      <div class="orgchart-wrap">

        <!-- Company Root -->
        <div class="orgchart-level orgchart-level-root">
          <div class="orgchart-node orgchart-root">
            <div class="orgchart-node-icon" style="background:linear-gradient(135deg,#6366f1,#818cf8)">
              ${company.logo
                ? `<img src="${company.logo}" style="width:40px;height:40px;border-radius:10px;object-fit:cover">`
                : `<i class="fas fa-building" style="font-size:22px;color:#fff"></i>`}
            </div>
            <div>
              <div class="orgchart-node-name">${_esc(company.name || (isAr ? 'الشركة' : 'Company'))}</div>
              <div class="orgchart-node-role">${isAr ? 'المقر الرئيسي' : 'Headquarters'}</div>
              <div class="orgchart-node-badge">
                <i class="fas fa-users" style="font-size:10px"></i>
                ${emps.length} ${t('orgchart.employee')}
                &nbsp;·&nbsp;
                <i class="fas fa-building" style="font-size:10px"></i>
                ${depts.length} ${t('nav.departments')}
              </div>
            </div>
          </div>
          <div class="orgchart-connector-down"></div>
        </div>

        <!-- H-Line -->
        <div class="orgchart-h-line" style="width:${Math.min(depts.length * 236, 96)}%;max-width:1400px"></div>

        <!-- Departments Row -->
        <div class="orgchart-level orgchart-level-depts" style="flex-wrap:wrap;gap:20px 16px;align-items:flex-start;justify-content:center;padding:0 8px">
          ${depts.map((d, idx) => this._deptNode(d, idx, emps, isAr)).join('')}
        </div>

      </div>
    `;
  },

  _deptNode(d, idx, allEmps, isAr) {
    const colors  = ['#6366f1','#10b981','#f59e0b','#ef4444','#3b82f6','#ec4899','#14b8a6','#f97316','#8b5cf6','#06b6d4','#84cc16','#a855f7'];
    const hex     = d.hex || colors[idx % colors.length];
    const emps    = allEmps.filter(e => e.dept === d.id);
    const manager = emps.find(e => e.name === d.manager) || null;
    const others  = emps.filter(e => e.id !== manager?.id);
    const present = DB.attendance.filter(a => a.date === new Date().toISOString().slice(0,10) && emps.find(e=>e.id===a.empId) && a.status !== 'absent').length;

    // Avatar stack for others (up to 4)
    const avatarStack = others.slice(0, 4).map(e => `
      <div class="av" style="background:${hex}33;color:${hex}" title="${_esc(e.name)}">${_esc(e.name.charAt(0))}</div>
    `).join('');
    const extraCount = others.length > 4 ? others.length - 4 : 0;

    return `
      <div class="orgchart-dept-col">
        <div class="orgchart-connector-up" style="background:${hex};opacity:.5"></div>

        <div class="orgchart-dept-node" style="border-top:3px solid ${hex}">

          <!-- Header -->
          <div class="orgchart-dept-header">
            <div style="width:40px;height:40px;border-radius:12px;background:${hex}18;display:flex;align-items:center;justify-content:center;flex-shrink:0;border:1px solid ${hex}30">
              <i class="${d.icon||'fas fa-building'}" style="color:${hex};font-size:17px"></i>
            </div>
            <div style="min-width:0;flex:1">
              <div style="font-weight:700;font-size:13px;color:var(--text-primary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${_esc(d.name)}</div>
              <div style="font-size:10px;color:var(--text-muted);margin-top:2px">${emps.length} ${t('orgchart.employee')}</div>
            </div>
            <div style="width:10px;height:10px;border-radius:50%;background:${hex};box-shadow:0 0 6px ${hex};flex-shrink:0"></div>
          </div>

          <!-- Body -->
          <div class="orgchart-dept-body">

            ${manager ? `
              <div class="orgchart-manager-row">
                <div style="width:32px;height:32px;border-radius:50%;background:${hex};color:#fff;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;flex-shrink:0;box-shadow:0 2px 6px ${hex}66">
                  ${_esc(manager.name.charAt(0))}
                </div>
                <div style="min-width:0;flex:1">
                  <div style="font-size:12px;font-weight:600;color:var(--text-primary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${_esc(manager.name)}</div>
                  <div style="font-size:10px;color:${hex}">${_esc(manager.position || t('orgchart.manager'))}</div>
                </div>
                <span class="orgchart-manager-crown">
                  <i class="fas fa-crown" style="font-size:8px"></i>
                </span>
              </div>
            ` : `
              <div style="font-size:11px;color:var(--text-muted);text-align:center;padding:10px 0;background:var(--bg-secondary);border-radius:8px;margin-bottom:8px">
                <i class="fas fa-user-slash" style="margin-${isAr?'left':'right'}:4px;opacity:.5"></i>${t('orgchart.noManager')}
              </div>
            `}

            ${others.length > 0 ? `
              <div class="orgchart-emp-list">
                ${others.slice(0, 4).map(e => `
                  <div class="orgchart-emp-item">
                    <div style="width:24px;height:24px;border-radius:50%;background:${hex}25;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;color:${hex};flex-shrink:0">
                      ${_esc(e.name.charAt(0))}
                    </div>
                    <div style="font-size:11px;color:var(--text-primary);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1">${_esc(e.name)}</div>
                    ${e.position ? `<div style="font-size:9px;color:var(--text-muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:70px">${_esc(e.position)}</div>` : ''}
                  </div>
                `).join('')}
                ${others.length > 4 ? `
                  <div style="text-align:center;padding:5px;font-size:11px;color:${hex};font-weight:600;background:${hex}10;border-radius:7px;cursor:default">
                    +${others.length - 4} ${t('orgchart.more')}
                  </div>
                ` : ''}
              </div>
            ` : (emps.length === 0 ? `
              <div style="font-size:11px;color:var(--text-muted);text-align:center;padding:10px 0">${t('orgchart.empty')}</div>
            ` : '')}
          </div>

          <!-- Footer -->
          <div class="orgchart-dept-footer">
            <div class="orgchart-dept-footer-stat">
              <div style="width:7px;height:7px;border-radius:50%;background:#10b981"></div>
              ${present} ${isAr ? 'حاضر اليوم' : 'present today'}
            </div>
            ${others.length > 0 ? `
              <div class="orgchart-avatar-stack" style="margin-${isAr?'right':'left'}:auto">
                ${others.slice(0,3).map(e => `
                  <div class="av" style="background:${hex}30;color:${hex}" title="${_esc(e.name)}">${_esc(e.name.charAt(0))}</div>
                `).join('')}
                ${others.length > 3 ? `<div class="av" style="background:var(--bg-tertiary);color:var(--text-muted);font-size:9px">+${others.length-3}</div>` : ''}
              </div>
            ` : ''}
          </div>

        </div>
      </div>
    `;
  },

  _renderList(isAr) {
    const depts      = DB.departments;
    const emps       = DB.employees.filter(e => e.status !== 'inactive');
    const unassigned = emps.filter(e => !e.dept || !depts.find(d => d.id === e.dept));

    if (depts.length === 0) {
      return `<div class="empty-state">
        <div class="empty-icon"><i class="fas fa-list"></i></div>
        <div class="empty-title">${t('orgchart.noDepts')}</div>
      </div>`;
    }

    const colors = ['#6366f1','#10b981','#f59e0b','#ef4444','#3b82f6','#ec4899','#14b8a6','#f97316','#8b5cf6','#06b6d4','#84cc16','#a855f7'];

    return `
      <div class="orgchart-list-grid">
        ${depts.map((d, idx) => {
          const hex   = d.hex || colors[idx % colors.length];
          const dEmps = emps.filter(e => e.dept === d.id);
          const isExp = !this._collapsedDepts.has(d.id);

          return `
            <div class="orgchart-list-card" style="border-top:3px solid ${hex}">
              <!-- Header -->
              <div class="orgchart-list-card-header"
                onclick="OrgChartModule._toggleDept('${d.id}')">
                <div style="width:46px;height:46px;border-radius:14px;background:${hex}18;display:flex;align-items:center;justify-content:center;flex-shrink:0;border:1px solid ${hex}30">
                  <i class="${d.icon||'fas fa-building'}" style="color:${hex};font-size:20px"></i>
                </div>
                <div style="flex:1;min-width:0">
                  <div style="font-weight:700;font-size:15px;color:var(--text-primary)">${_esc(d.name)}</div>
                  ${d.manager ? `
                    <div style="font-size:12px;color:var(--text-muted);margin-top:2px;display:flex;align-items:center;gap:4px">
                      <i class="fas fa-user-tie" style="font-size:10px;color:${hex}"></i> ${_esc(d.manager)}
                    </div>
                  ` : `<div style="font-size:11px;color:var(--text-muted);margin-top:2px">${t('orgchart.noManager')}</div>`}
                </div>
                <div style="display:flex;align-items:center;gap:8px">
                  <span style="background:${hex}18;color:${hex};border-radius:20px;padding:4px 12px;font-size:12px;font-weight:600;border:1px solid ${hex}30">
                    ${dEmps.length} <i class="fas fa-user" style="font-size:10px"></i>
                  </span>
                  <i class="fas fa-chevron-${isExp?'up':'down'}" style="color:var(--text-muted);font-size:12px;transition:transform .2s"></i>
                </div>
              </div>

              <!-- Body -->
              <div class="orgchart-list-card-body ${isExp ? '' : 'hidden'}">
                ${dEmps.length === 0
                  ? `<div style="color:var(--text-muted);font-size:13px;text-align:center;padding:16px 0"><i class="fas fa-users-slash" style="margin-${isAr?'left':'right'}:6px;opacity:.4"></i>${t('orgchart.empty')}</div>`
                  : `<div class="orgchart-list-emp-grid">
                    ${dEmps.map(e => `
                      <div class="orgchart-list-emp-item">
                        <div class="av-lg" style="background:${hex}25;color:${hex}">${_esc(e.name.charAt(0))}</div>
                        <div style="min-width:0;flex:1">
                          <div style="font-size:13px;font-weight:600;color:var(--text-primary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${_esc(e.name)}</div>
                          <div style="font-size:11px;color:var(--text-muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${_esc(e.position||'—')}</div>
                        </div>
                        ${e.name === d.manager ? `
                          <span class="orgchart-manager-badge" style="background:${hex};color:#fff">
                            <i class="fas fa-crown" style="font-size:8px"></i>
                          </span>
                        ` : ''}
                      </div>
                    `).join('')}
                  </div>`
                }
              </div>
            </div>
          `;
        }).join('')}

        ${unassigned.length > 0 ? `
          <div class="orgchart-list-card" style="border-top:3px solid var(--text-muted)">
            <div class="orgchart-list-card-header">
              <div style="width:46px;height:46px;border-radius:14px;background:var(--bg-tertiary);display:flex;align-items:center;justify-content:center;flex-shrink:0">
                <i class="fas fa-user-slash" style="color:var(--text-muted);font-size:20px"></i>
              </div>
              <div style="flex:1">
                <div style="font-weight:700;font-size:15px;color:var(--text-primary)">${t('orgchart.unassigned')}</div>
                <div style="font-size:11px;color:var(--text-muted);margin-top:2px">${isAr ? 'موظفون بدون قسم' : 'Employees without a department'}</div>
              </div>
              <span style="background:var(--bg-tertiary);color:var(--text-muted);border-radius:20px;padding:4px 12px;font-size:12px;font-weight:600">
                ${unassigned.length} <i class="fas fa-user" style="font-size:10px"></i>
              </span>
            </div>
            <div class="orgchart-list-card-body">
              <div class="orgchart-list-emp-grid">
                ${unassigned.map(e => `
                  <div class="orgchart-list-emp-item">
                    <div class="av-lg" style="background:var(--bg-tertiary);color:var(--text-muted)">${_esc(e.name.charAt(0))}</div>
                    <div style="min-width:0">
                      <div style="font-size:13px;font-weight:600;color:var(--text-primary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${_esc(e.name)}</div>
                      <div style="font-size:11px;color:var(--text-muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${_esc(e.position||'—')}</div>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>
        ` : ''}
      </div>
    `;
  },

  _toggleDept(deptId) {
    if (this._collapsedDepts.has(deptId)) {
      this._collapsedDepts.delete(deptId);
    } else {
      this._collapsedDepts.add(deptId);
    }
    this.render(document.getElementById('page-content'));
  },

  _print() {
    const isAr  = currentLang === 'ar';
    const body  = document.getElementById('orgchart-body')?.innerHTML || '';
    const stats = document.querySelector('.orgchart-stats')?.outerHTML || '';
    const title = t('orgchart.title');
    const win   = window.open('', '_blank');
    win.document.write(`<!DOCTYPE html><html dir="${isAr?'rtl':'ltr'}" lang="${currentLang}">
    <head><meta charset="UTF-8"><title>${title}</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    <style>
      *{box-sizing:border-box}
      body{font-family:${isAr?'Tajawal,':''}sans-serif;direction:${isAr?'rtl':'ltr'};padding:24px;background:#fff;color:#1e293b}
      .orgchart-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:24px}
      .orgchart-stat-card{background:#f8fafc;border-radius:12px;padding:14px 18px;border:1px solid #e2e8f0;display:flex;align-items:center;gap:12px}
      .orgchart-stat-icon{width:40px;height:40px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0}
      .orgchart-stat-val{font-size:20px;font-weight:800;color:#1e293b}
      .orgchart-stat-lbl{font-size:11px;color:#64748b;margin-top:2px}
      .orgchart-wrap{display:flex;flex-direction:column;align-items:center;gap:0;padding:8px 0 24px}
      .orgchart-level{display:flex;justify-content:center;gap:16px;width:100%}
      .orgchart-node{display:flex;align-items:center;gap:14px;background:#f8fafc;border-radius:14px;padding:14px 22px;border:2px solid #e2e8f0}
      .orgchart-root{background:#ede9fe;border-color:#6366f1}
      .orgchart-node-icon{width:52px;height:52px;border-radius:12px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
      .orgchart-node-name{font-size:16px;font-weight:800}
      .orgchart-node-role{font-size:12px;color:#64748b}
      .orgchart-node-badge{display:inline-flex;align-items:center;gap:5px;font-size:11px;font-weight:600;background:#ede9fe;color:#6366f1;border-radius:20px;padding:3px 10px;margin-top:6px}
      .orgchart-connector-down{width:2px;height:32px;background:#cbd5e1;margin:0 auto}
      .orgchart-h-line{height:2px;background:#e2e8f0;margin:0 auto}
      .orgchart-level-depts{align-items:flex-start;flex-wrap:wrap;gap:16px;justify-content:center}
      .orgchart-dept-col{display:flex;flex-direction:column;align-items:center;width:200px;flex-shrink:0}
      .orgchart-connector-up{width:2px;height:28px;background:#cbd5e1}
      .orgchart-dept-node{background:#fff;border-radius:14px;padding:0;border:1px solid #e2e8f0;width:100%;overflow:hidden}
      .orgchart-dept-header{padding:12px 14px 10px;display:flex;align-items:center;gap:10px}
      .orgchart-dept-body{padding:0 12px 10px}
      .orgchart-dept-footer{padding:8px 12px;border-top:1px solid #f1f5f9;display:flex;align-items:center;justify-content:space-between}
      .orgchart-dept-footer-stat{display:flex;align-items:center;gap:5px;font-size:10px;color:#64748b}
      .orgchart-manager-row{display:flex;align-items:center;gap:8px;padding:8px 10px;background:#f8fafc;border-radius:8px;margin-bottom:8px;border:1px solid #f1f5f9}
      .orgchart-manager-crown{font-size:9px;background:#f59e0b;color:#fff;border-radius:10px;padding:2px 6px;font-weight:700;margin-inline-start:auto}
      .orgchart-emp-list{display:flex;flex-direction:column;gap:3px;margin-top:6px}
      .orgchart-emp-item{display:flex;align-items:center;gap:6px;padding:5px 8px;border-radius:6px;background:#f8fafc}
      .orgchart-avatar-stack{display:flex;flex-direction:row-reverse;align-items:center}
      .orgchart-avatar-stack .av{width:24px;height:24px;border-radius:50%;border:2px solid #fff;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:700;margin-inline-start:-7px}
      .orgchart-list-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:16px}
      .orgchart-list-card{background:#fff;border-radius:14px;border:1px solid #e2e8f0;overflow:hidden}
      .orgchart-list-card-header{padding:14px 18px;display:flex;align-items:center;gap:12px}
      .orgchart-list-card-body{padding:12px 18px;border-top:1px solid #f1f5f9}
      .orgchart-list-emp-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:8px}
      .orgchart-list-emp-item{display:flex;align-items:center;gap:10px;padding:9px 11px;background:#f8fafc;border-radius:10px}
      .av-lg{width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;flex-shrink:0}
      .orgchart-manager-badge{font-size:9px;font-weight:700;padding:2px 7px;border-radius:10px;margin-inline-start:auto}
      .hidden{display:none}
      button{display:none}
      @media print{body{padding:0}}
    </style></head>
    <body>${stats}${body}<script>window.onload=()=>window.print()<\/script></body></html>`);
    win.document.close();
  },
};
