/* =========================================================
   ORG CHART MODULE — الهيكل التنظيمي
   ========================================================= */

const OrgChartModule = {

  _view: 'tree',
  _collapsedDepts: new Set(),

  _colors: ['#6366f1','#10b981','#f59e0b','#ef4444','#3b82f6','#ec4899','#14b8a6','#f97316','#8b5cf6','#06b6d4','#84cc16','#a855f7'],

  render(container) {
    const isAr = currentLang === 'ar';
    container.innerHTML = `
      <div class="page-header">
        <div class="page-header-text">
          <h1>${t('orgchart.title')}</h1>
          <p>${t('orgchart.subtitle')}</p>
        </div>
        <div class="page-header-actions" style="gap:8px">
          <div style="display:flex;background:var(--bg-secondary);border-radius:10px;padding:4px;gap:3px;border:1px solid var(--border)">
            <button class="btn ${this._view==='tree'?'btn-primary':''}"
              style="${this._view!=='tree'?'background:transparent;box-shadow:none;color:var(--text-muted)':''};border-radius:7px;padding:6px 14px;font-size:13px"
              onclick="OrgChartModule._view='tree';OrgChartModule.render(document.getElementById('page-content'))">
              <i class="fas fa-sitemap"></i> ${t('orgchart.treeView')}
            </button>
            <button class="btn ${this._view==='list'?'btn-primary':''}"
              style="${this._view!=='list'?'background:transparent;box-shadow:none;color:var(--text-muted)':''};border-radius:7px;padding:6px 14px;font-size:13px"
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
    const emps       = DB.employees.filter(e => e.status !== 'inactive');
    const depts      = DB.departments;
    const managers   = depts.filter(d => d.manager).length;
    const today      = new Date().toISOString().slice(0,10);
    const presentAll = DB.attendance.filter(a => a.date === today && a.status !== 'absent').length;

    const stats = [
      { icon:'fas fa-users',       color:'#6366f1', bg:'#6366f115', val: emps.length,   lbl: isAr?'إجمالي الموظفين':'Total Employees' },
      { icon:'fas fa-building',    color:'#10b981', bg:'#10b98115', val: depts.length,  lbl: t('nav.departments') },
      { icon:'fas fa-user-tie',    color:'#f59e0b', bg:'#f59e0b15', val: managers,      lbl: isAr?'المديرون':'Managers' },
      { icon:'fas fa-circle-check',color:'#3b82f6', bg:'#3b82f615', val: presentAll,    lbl: isAr?'حاضرون اليوم':'Present Today' },
    ];

    return `
      <div class="orgchart-stats">
        ${stats.map(s => `
          <div class="orgchart-stat-card" style="color:${s.color}">
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

        <!-- Company Hero -->
        <div class="orgchart-level orgchart-level-root">
          <div class="orgchart-root-hero">
            <div class="orgchart-root-logo">
              ${company.logo
                ? `<img src="${company.logo}" style="width:44px;height:44px;border-radius:12px;object-fit:cover">`
                : `<i class="fas fa-building"></i>`}
            </div>
            <div class="orgchart-root-info">
              <div class="orgchart-root-name">${_esc(company.name || (isAr?'الشركة':'Company'))}</div>
              <div class="orgchart-root-sub">${isAr?'المقر الرئيسي':'Headquarters'}</div>
              <div class="orgchart-root-pills">
                <div class="orgchart-root-pill"><i class="fas fa-users" style="font-size:11px"></i> ${emps.length} ${t('orgchart.employee')}</div>
                <div class="orgchart-root-pill"><i class="fas fa-building" style="font-size:11px"></i> ${depts.length} ${t('nav.departments')}</div>
                <div class="orgchart-root-pill"><i class="fas fa-user-tie" style="font-size:11px"></i> ${depts.filter(d=>d.manager).length} ${isAr?'مدير':'Managers'}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Connectors -->
        <div class="orgchart-connector-down"></div>
        <div class="orgchart-h-line" style="width:${Math.min(depts.length*260,96)}%;max-width:1600px"></div>

        <!-- Departments -->
        <div class="orgchart-level orgchart-level-depts"
          style="flex-wrap:wrap;gap:0 14px;align-items:flex-start;justify-content:center;padding:0 8px">
          ${depts.map((d, idx) => this._deptNode(d, idx, emps, isAr)).join('')}
        </div>

      </div>
    `;
  },

  _deptNode(d, idx, allEmps, isAr) {
    const hex     = d.hex || this._colors[idx % this._colors.length];
    const emps    = allEmps.filter(e => e.dept === d.id);
    const manager = emps.find(e => e.name === d.manager) || null;
    const others  = emps.filter(e => e.id !== manager?.id);
    const today   = new Date().toISOString().slice(0,10);
    const present = DB.attendance.filter(a =>
      a.date === today && emps.find(e => e.id === a.empId) && a.status !== 'absent'
    ).length;
    const occPct  = emps.length > 0 ? Math.round(present / emps.length * 100) : 0;
    const avatarEmps = emps.slice(0, 6);
    const moreCount  = emps.length > 6 ? emps.length - 6 : 0;

    return `
      <div class="orgchart-dept-col">
        <div class="orgchart-connector-up" style="background:${hex};opacity:.5"></div>

        <div class="orgchart-dept-node">

          <!-- Top: Icon + Name + Count -->
          <div class="orgchart-dept-top" style="border-top:4px solid ${hex}">
            <div class="orgchart-dept-top-icon" style="background:${hex}15;color:${hex};border:1.5px solid ${hex}28">
              <i class="${d.icon||'fas fa-building'}"></i>
            </div>
            <div style="min-width:0;flex:1">
              <div class="orgchart-dept-top-name">${_esc(d.name)}</div>
              <div class="orgchart-dept-top-count">
                <span style="color:${hex};font-weight:700">${emps.length}</span>
                ${t('orgchart.employee')}
              </div>
            </div>
          </div>

          <!-- Manager -->
          <div class="orgchart-dept-section">
            ${manager ? `
              <div class="orgchart-manager-row">
                <div style="width:36px;height:36px;border-radius:50%;flex-shrink:0;
                  background:linear-gradient(135deg,${hex},${hex}bb);color:#fff;
                  display:flex;align-items:center;justify-content:center;
                  font-size:14px;font-weight:800;
                  box-shadow:0 3px 10px ${hex}44">
                  ${_esc(manager.name.charAt(0))}
                </div>
                <div style="min-width:0;flex:1">
                  <div style="font-size:12px;font-weight:700;color:var(--text-primary);
                    white-space:nowrap;overflow:hidden;text-overflow:ellipsis">
                    ${_esc(manager.name)}
                  </div>
                  <div style="font-size:10px;color:${hex};font-weight:500;margin-top:1px">
                    ${_esc(manager.position || t('orgchart.manager'))}
                  </div>
                </div>
                <span class="orgchart-manager-crown">
                  <i class="fas fa-crown" style="font-size:7px"></i>
                </span>
              </div>
            ` : `
              <div style="display:flex;align-items:center;gap:6px;padding:9px 10px;
                background:var(--bg-secondary);border-radius:10px;
                color:var(--text-muted);font-size:11px;border:1px dashed var(--border)">
                <i class="fas fa-user-slash" style="opacity:.35;font-size:11px"></i>
                ${t('orgchart.noManager')}
              </div>
            `}
          </div>

          <!-- Employee Avatars -->
          ${emps.length > 0 ? `
            <div class="orgchart-emp-avatars">
              ${avatarEmps.map(e => `
                <div class="orgchart-emp-av" title="${_esc(e.name)}"
                  style="background:${hex}20;color:${hex};border-color:var(--bg-card)">
                  ${_esc(e.name.charAt(0))}
                </div>
              `).join('')}
              ${moreCount > 0 ? `
                <div class="orgchart-emp-av orgchart-emp-av-more"
                  style="background:var(--bg-tertiary);color:var(--text-muted);border-color:var(--bg-card)">
                  +${moreCount}
                </div>
              ` : ''}
              ${others.slice(0, 3).map(e => `
                <div style="display:none" title="${_esc(e.name)}"></div>
              `).join('')}
            </div>
          ` : `
            <div style="text-align:center;color:var(--text-muted);font-size:11px;
              padding:8px 12px 10px;opacity:.65">
              <i class="fas fa-users-slash" style="display:block;font-size:14px;margin-bottom:4px;opacity:.4"></i>
              ${t('orgchart.empty')}
            </div>
          `}

          <!-- Footer: present + occupancy bar -->
          <div class="orgchart-dept-footer">
            <div class="orgchart-dept-footer-stat">
              <div class="orgchart-present-dot"></div>
              ${present} ${isAr?'حاضر':'present'}
            </div>
            <div style="display:flex;align-items:center;gap:6px">
              <div style="width:44px;background:var(--border);border-radius:4px;height:4px;overflow:hidden">
                <div style="background:${hex};height:4px;border-radius:4px;width:${occPct}%;transition:width .6s"></div>
              </div>
              <span style="font-size:9px;color:var(--text-muted);font-weight:500">${present}/${emps.length}</span>
            </div>
          </div>

        </div>
      </div>
    `;
  },

  _renderList(isAr) {
    const depts      = DB.departments;
    const emps       = DB.employees.filter(e => e.status !== 'inactive');
    const unassigned = emps.filter(e => !e.dept || !depts.find(d => d.id === e.dept));
    const today      = new Date().toISOString().slice(0,10);

    if (depts.length === 0) {
      return `<div class="empty-state">
        <div class="empty-icon"><i class="fas fa-th-large"></i></div>
        <div class="empty-title">${t('orgchart.noDepts')}</div>
      </div>`;
    }

    return `
      <div class="orgchart-list-grid">
        ${depts.map((d, idx) => {
          const hex     = d.hex || this._colors[idx % this._colors.length];
          const dEmps   = emps.filter(e => e.dept === d.id);
          const mgr     = dEmps.find(e => e.name === d.manager);
          const rest    = dEmps.filter(e => e.id !== mgr?.id);
          const isExp   = !this._collapsedDepts.has(d.id);
          const present = DB.attendance.filter(a =>
            a.date === today && dEmps.find(e => e.id === a.empId) && a.status !== 'absent'
          ).length;
          const onLeave = dEmps.filter(e => e.status === 'on_leave').length;

          return `
            <div class="orgchart-list-card" style="border-top:4px solid ${hex}">

              <!-- Header (clickable) -->
              <div class="orgchart-list-card-header" onclick="OrgChartModule._toggleDept('${d.id}')">
                <div style="width:46px;height:46px;border-radius:13px;
                  background:${hex}15;border:1.5px solid ${hex}28;
                  display:flex;align-items:center;justify-content:center;flex-shrink:0">
                  <i class="${d.icon||'fas fa-building'}" style="color:${hex};font-size:20px"></i>
                </div>
                <div style="flex:1;min-width:0">
                  <div style="font-weight:700;font-size:15px;color:var(--text-primary);
                    white-space:nowrap;overflow:hidden;text-overflow:ellipsis">
                    ${_esc(d.name)}
                  </div>
                  ${d.manager
                    ? `<div style="font-size:12px;color:var(--text-muted);margin-top:2px;
                        display:flex;align-items:center;gap:5px">
                        <i class="fas fa-crown" style="color:#f59e0b;font-size:9px"></i>
                        ${_esc(d.manager)}
                      </div>`
                    : `<div style="font-size:11px;color:var(--text-muted);margin-top:2px">
                        ${t('orgchart.noManager')}
                      </div>`}
                </div>
                <div style="display:flex;flex-direction:column;align-items:flex-end;gap:6px;flex-shrink:0">
                  <span class="orgchart-list-pill" style="background:${hex}15;color:${hex};border-color:${hex}30">
                    ${dEmps.length} <i class="fas fa-user" style="font-size:10px"></i>
                  </span>
                  <i class="fas fa-chevron-${isExp?'up':'down'}" style="color:var(--text-muted);font-size:11px"></i>
                </div>
              </div>

              <!-- Mini stats bar (always visible) -->
              <div style="display:flex;gap:0;border-top:1px solid var(--border)">
                <div style="flex:1;padding:7px 12px;text-align:center;border-${isAr?'left':'right'}:1px solid var(--border)">
                  <div style="font-size:14px;font-weight:800;color:#10b981">${present}</div>
                  <div style="font-size:9px;color:var(--text-muted)">${isAr?'حاضر':'Present'}</div>
                </div>
                <div style="flex:1;padding:7px 12px;text-align:center;border-${isAr?'left':'right'}:1px solid var(--border)">
                  <div style="font-size:14px;font-weight:800;color:#f59e0b">${onLeave}</div>
                  <div style="font-size:9px;color:var(--text-muted)">${isAr?'إجازة':'On Leave'}</div>
                </div>
                <div style="flex:1;padding:7px 12px;text-align:center">
                  <div style="font-size:14px;font-weight:800;color:${hex}">${dEmps.length}</div>
                  <div style="font-size:9px;color:var(--text-muted)">${isAr?'إجمالي':'Total'}</div>
                </div>
              </div>

              <!-- Body (expandable) -->
              <div class="orgchart-list-card-body ${isExp?'':'hidden'}">
                ${dEmps.length === 0
                  ? `<div style="color:var(--text-muted);font-size:13px;text-align:center;padding:20px 0;opacity:.7">
                      <i class="fas fa-users-slash" style="font-size:22px;display:block;margin-bottom:8px;opacity:.4"></i>
                      ${t('orgchart.empty')}
                    </div>`
                  : `
                    ${mgr ? `
                      <div class="orgchart-list-manager" style="background:${hex}08;border-color:${hex}20;margin-bottom:10px">
                        <div style="width:40px;height:40px;border-radius:50%;flex-shrink:0;
                          background:linear-gradient(135deg,${hex},${hex}bb);color:#fff;
                          display:flex;align-items:center;justify-content:center;
                          font-size:16px;font-weight:800;box-shadow:0 3px 10px ${hex}44">
                          ${_esc(mgr.name.charAt(0))}
                        </div>
                        <div style="min-width:0;flex:1">
                          <div style="font-size:13px;font-weight:700;color:var(--text-primary);
                            white-space:nowrap;overflow:hidden;text-overflow:ellipsis">
                            ${_esc(mgr.name)}
                          </div>
                          <div style="font-size:11px;color:${hex};font-weight:500">
                            ${_esc(mgr.position || t('orgchart.manager'))}
                          </div>
                        </div>
                        <span class="orgchart-manager-badge" style="background:${hex};color:#fff">
                          <i class="fas fa-crown" style="font-size:7px;margin-${isAr?'left':'right'}:3px"></i>
                          ${isAr?'مدير':'Mgr'}
                        </span>
                      </div>
                    ` : ''}
                    ${rest.length > 0 ? `
                      <div class="orgchart-list-emp-grid2">
                        ${rest.map(e => `
                          <div class="orgchart-list-emp-item2">
                            <div class="av-lg" style="background:${hex}18;color:${hex};width:32px;height:32px;font-size:12px">
                              ${_esc(e.name.charAt(0))}
                            </div>
                            <div style="min-width:0;flex:1">
                              <div style="font-size:12px;font-weight:600;color:var(--text-primary);
                                white-space:nowrap;overflow:hidden;text-overflow:ellipsis">
                                ${_esc(e.name)}
                              </div>
                              <div style="font-size:10px;color:var(--text-muted);
                                white-space:nowrap;overflow:hidden;text-overflow:ellipsis">
                                ${_esc(e.position||'—')}
                              </div>
                            </div>
                          </div>
                        `).join('')}
                      </div>
                    ` : ''}
                  `
                }
              </div>
            </div>
          `;
        }).join('')}

        ${unassigned.length > 0 ? `
          <div class="orgchart-list-card" style="border-top:4px solid var(--border)">
            <div class="orgchart-list-card-header">
              <div style="width:46px;height:46px;border-radius:13px;
                background:var(--bg-secondary);display:flex;align-items:center;justify-content:center;flex-shrink:0">
                <i class="fas fa-user-slash" style="color:var(--text-muted);font-size:18px"></i>
              </div>
              <div style="flex:1">
                <div style="font-weight:700;font-size:15px;color:var(--text-primary)">
                  ${t('orgchart.unassigned')}
                </div>
                <div style="font-size:11px;color:var(--text-muted);margin-top:2px">
                  ${isAr?'موظفون بدون قسم':'Employees without a department'}
                </div>
              </div>
              <span class="orgchart-list-pill" style="background:var(--bg-tertiary);color:var(--text-muted);border-color:var(--border)">
                ${unassigned.length} <i class="fas fa-user" style="font-size:10px"></i>
              </span>
            </div>
            <div class="orgchart-list-card-body">
              <div class="orgchart-list-emp-grid2">
                ${unassigned.map(e => `
                  <div class="orgchart-list-emp-item2">
                    <div class="av-lg" style="background:var(--bg-tertiary);color:var(--text-muted);width:32px;height:32px;font-size:12px">
                      ${_esc(e.name.charAt(0))}
                    </div>
                    <div style="min-width:0">
                      <div style="font-size:12px;font-weight:600;color:var(--text-primary);
                        white-space:nowrap;overflow:hidden;text-overflow:ellipsis">
                        ${_esc(e.name)}
                      </div>
                      <div style="font-size:10px;color:var(--text-muted);
                        white-space:nowrap;overflow:hidden;text-overflow:ellipsis">
                        ${_esc(e.position||'—')}
                      </div>
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
      *{box-sizing:border-box;margin:0;padding:0}
      body{font-family:${isAr?'Tajawal,':''}sans-serif;direction:${isAr?'rtl':'ltr'};padding:20px;background:#f8fafc;color:#1e293b}
      .orgchart-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:20px}
      .orgchart-stat-card{background:#fff;border-radius:12px;padding:14px 16px;border:1px solid #e2e8f0;display:flex;align-items:center;gap:12px}
      .orgchart-stat-icon{width:42px;height:42px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0}
      .orgchart-stat-val{font-size:22px;font-weight:800;color:#1e293b}
      .orgchart-stat-lbl{font-size:11px;color:#64748b;margin-top:3px}
      .orgchart-wrap{display:flex;flex-direction:column;align-items:center;padding:0 0 20px}
      .orgchart-root-hero{background:linear-gradient(135deg,#6366f1,#818cf8);border-radius:16px;padding:20px 24px;display:flex;align-items:center;gap:16px;width:100%}
      .orgchart-root-logo{width:56px;height:56px;border-radius:14px;background:rgba(255,255,255,.2);display:flex;align-items:center;justify-content:center;font-size:24px;color:#fff;flex-shrink:0;border:2px solid rgba(255,255,255,.3)}
      .orgchart-root-name{font-size:18px;font-weight:800;color:#fff}
      .orgchart-root-sub{font-size:12px;color:rgba(255,255,255,.75);margin-bottom:8px}
      .orgchart-root-pills{display:flex;gap:8px;flex-wrap:wrap}
      .orgchart-root-pill{display:inline-flex;align-items:center;gap:5px;background:rgba(255,255,255,.18);color:#fff;border-radius:20px;padding:3px 10px;font-size:11px;font-weight:600;border:1px solid rgba(255,255,255,.25)}
      .orgchart-connector-down{width:2px;height:32px;background:#cbd5e1;margin:0 auto}
      .orgchart-h-line{height:2px;background:#e2e8f0;margin:0 auto}
      .orgchart-level{display:flex;justify-content:center;gap:14px;width:100%}
      .orgchart-level-root{width:100%}
      .orgchart-level-depts{flex-wrap:wrap;align-items:flex-start;gap:0 14px;justify-content:center;padding:0}
      .orgchart-dept-col{display:flex;flex-direction:column;align-items:center;width:230px;flex-shrink:0}
      .orgchart-connector-up{width:2px;height:30px}
      .orgchart-dept-node{background:#fff;border-radius:14px;border:1px solid #e2e8f0;width:100%;overflow:hidden}
      .orgchart-dept-top{display:flex;align-items:center;gap:10px;padding:12px 13px;border-bottom:1px solid #f1f5f9}
      .orgchart-dept-top-icon{width:40px;height:40px;border-radius:11px;display:flex;align-items:center;justify-content:center;font-size:17px;flex-shrink:0}
      .orgchart-dept-top-name{font-size:13px;font-weight:700;color:#1e293b;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
      .orgchart-dept-top-count{font-size:10px;color:#64748b;margin-top:2px}
      .orgchart-dept-section{padding:10px 12px 8px}
      .orgchart-manager-row{display:flex;align-items:center;gap:8px;padding:8px 10px;background:#f8fafc;border-radius:9px;border:1px solid #f1f5f9}
      .orgchart-manager-crown{font-size:8px;background:linear-gradient(135deg,#f59e0b,#fbbf24);color:#fff;border-radius:6px;padding:2px 6px;font-weight:700;margin-inline-start:auto}
      .orgchart-emp-avatars{display:flex;align-items:center;gap:3px;flex-wrap:wrap;padding:4px 12px 10px}
      .orgchart-emp-av{width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;flex-shrink:0;border:2px solid #fff}
      .orgchart-emp-av-more{background:#f1f5f9;color:#64748b;font-size:8px}
      .orgchart-dept-footer{padding:7px 12px;border-top:1px solid #f1f5f9;display:flex;align-items:center;justify-content:space-between;background:#f8fafc}
      .orgchart-dept-footer-stat{display:flex;align-items:center;gap:5px;font-size:10px;color:#64748b}
      .orgchart-present-dot{width:7px;height:7px;border-radius:50%;background:#10b981;flex-shrink:0}
      .orgchart-list-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:14px}
      .orgchart-list-card{background:#fff;border-radius:14px;border:1px solid #e2e8f0;overflow:hidden}
      .orgchart-list-card-header{display:flex;align-items:center;gap:12px;padding:14px 16px}
      .orgchart-list-card-body{padding:12px 16px;border-top:1px solid #f1f5f9}
      .orgchart-list-emp-grid2{display:grid;grid-template-columns:1fr 1fr;gap:5px}
      .orgchart-list-emp-item2{display:flex;align-items:center;gap:7px;padding:7px 9px;background:#f8fafc;border-radius:9px}
      .av-lg{border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;flex-shrink:0}
      .orgchart-manager-badge{font-size:9px;font-weight:700;padding:2px 7px;border-radius:8px;margin-inline-start:auto}
      .orgchart-list-manager{display:flex;align-items:center;gap:8px;padding:8px 10px;border-radius:9px;border:1px solid #e2e8f0}
      .orgchart-list-pill{display:inline-flex;align-items:center;gap:4px;border-radius:20px;padding:3px 10px;font-size:11px;font-weight:600;border-width:1px;border-style:solid;white-space:nowrap}
      .hidden{display:none}
      button,.page-header-actions{display:none}
      @media print{body{padding:8px;background:#fff}}
    </style></head>
    <body>${stats}${body}<script>window.onload=()=>window.print()<\/script></body></html>`);
    win.document.close();
  },
};
