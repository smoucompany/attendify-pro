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
              style="${this._view!=='tree'?'background:transparent;box-shadow:none;color:var(--text-muted)':''};border-radius:7px;padding:6px 14px;font-size:13px;transition:all .2s"
              onclick="OrgChartModule._view='tree';OrgChartModule.render(document.getElementById('page-content'))">
              <i class="fas fa-sitemap"></i> ${t('orgchart.treeView')}
            </button>
            <button class="btn ${this._view==='list'?'btn-primary':''}"
              style="${this._view!=='list'?'background:transparent;box-shadow:none;color:var(--text-muted)':''};border-radius:7px;padding:6px 14px;font-size:13px;transition:all .2s"
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
    const unassigned = emps.filter(e => !e.dept || !depts.find(d => d.id === e.dept)).length;

    const stats = [
      { icon:'fas fa-users',      color:'#6366f1', bg:'#6366f115', val: emps.length,  lbl: isAr?'إجمالي الموظفين':'Total Employees' },
      { icon:'fas fa-building',   color:'#10b981', bg:'#10b98115', val: depts.length, lbl: t('nav.departments') },
      { icon:'fas fa-user-tie',   color:'#f59e0b', bg:'#f59e0b15', val: managers,     lbl: isAr?'المديرون':'Managers' },
      { icon:'fas fa-user-slash', color:'#ef4444', bg:'#ef444415', val: unassigned,   lbl: t('orgchart.unassigned') },
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

        <!-- ── Hero Company Root ───────────────────── -->
        <div class="orgchart-level orgchart-level-root" style="padding:0 4px">
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
                <div class="orgchart-root-pill">
                  <i class="fas fa-users" style="font-size:11px"></i>
                  ${emps.length} ${t('orgchart.employee')}
                </div>
                <div class="orgchart-root-pill">
                  <i class="fas fa-building" style="font-size:11px"></i>
                  ${depts.length} ${t('nav.departments')}
                </div>
                <div class="orgchart-root-pill">
                  <i class="fas fa-user-tie" style="font-size:11px"></i>
                  ${depts.filter(d=>d.manager).length} ${isAr?'مدير':'Managers'}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- ── Connector ───────────────────────────── -->
        <div class="orgchart-connector-down"></div>
        <div class="orgchart-h-line" style="width:${Math.min(depts.length * 256, 96)}%;max-width:1400px"></div>

        <!-- ── Departments ─────────────────────────── -->
        <div class="orgchart-level orgchart-level-depts"
          style="flex-wrap:wrap;gap:0 16px;align-items:flex-start;justify-content:center;padding:0 8px">
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

    // darken hex slightly for gradient end
    const hexAlpha = hex + '22';

    return `
      <div class="orgchart-dept-col">
        <div class="orgchart-connector-up" style="background:${hex};opacity:.6"></div>

        <div class="orgchart-dept-node">

          <!-- Banner -->
          <div class="orgchart-dept-banner"
            style="background:linear-gradient(160deg,${hex} 0%,${hex}cc 100%)">
            <div class="orgchart-dept-banner-icon">
              <i class="${d.icon||'fas fa-building'}"></i>
            </div>
            <div class="orgchart-dept-banner-name">${_esc(d.name)}</div>
            <div class="orgchart-dept-banner-count">
              <i class="fas fa-user" style="font-size:9px;margin-${isAr?'left':'right'}:3px"></i>
              ${emps.length} ${t('orgchart.employee')}
            </div>
          </div>

          <!-- Content -->
          <div class="orgchart-dept-content">

            ${manager ? `
              <div class="orgchart-manager-row">
                <div style="width:34px;height:34px;border-radius:50%;background:${hex};color:#fff;
                  display:flex;align-items:center;justify-content:center;
                  font-size:13px;font-weight:700;flex-shrink:0;
                  box-shadow:0 2px 8px ${hex}55">
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
                  <i class="fas fa-crown" style="font-size:8px;margin-${isAr?'left':'right'}:3px"></i>${isAr?'مدير':'Mgr'}
                </span>
              </div>
            ` : `
              <div style="display:flex;align-items:center;gap:6px;padding:9px 10px;
                background:var(--bg-secondary);border-radius:10px;margin-bottom:8px;
                color:var(--text-muted);font-size:11px;border:1px solid var(--border)">
                <i class="fas fa-user-slash" style="opacity:.4;font-size:12px"></i>
                ${t('orgchart.noManager')}
              </div>
            `}

            ${others.length > 0 ? `
              <div class="orgchart-emp-list">
                ${others.slice(0, 3).map(e => `
                  <div class="orgchart-emp-item">
                    <div style="width:26px;height:26px;border-radius:50%;flex-shrink:0;
                      background:${hex}20;display:flex;align-items:center;justify-content:center;
                      font-size:10px;font-weight:700;color:${hex}">
                      ${_esc(e.name.charAt(0))}
                    </div>
                    <div style="min-width:0;flex:1">
                      <div style="font-size:11px;font-weight:600;color:var(--text-primary);
                        overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
                        ${_esc(e.name)}
                      </div>
                      ${e.position ? `<div style="font-size:9px;color:var(--text-muted);
                        overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
                        ${_esc(e.position)}</div>` : ''}
                    </div>
                  </div>
                `).join('')}
                ${others.length > 3 ? `
                  <div style="text-align:center;padding:5px 8px;font-size:11px;
                    color:${hex};font-weight:600;background:${hex}12;
                    border-radius:8px;border:1px dashed ${hex}40">
                    +${others.length - 3} ${t('orgchart.more')}
                  </div>
                ` : ''}
              </div>
            ` : (emps.length === 0 ? `
              <div style="text-align:center;color:var(--text-muted);font-size:11px;padding:8px 0">
                ${t('orgchart.empty')}
              </div>
            ` : '')}

          </div>

          <!-- Footer -->
          <div class="orgchart-dept-footer">
            <div class="orgchart-dept-footer-stat">
              <div class="orgchart-present-dot"></div>
              ${present} ${isAr?'حاضر اليوم':'present today'}
            </div>
            ${emps.length > 0 ? `
              <div class="orgchart-avatar-stack">
                ${emps.slice(0,4).map(e => `
                  <div class="av" style="background:${hex}28;color:${hex}" title="${_esc(e.name)}">
                    ${_esc(e.name.charAt(0))}
                  </div>
                `).join('')}
                ${emps.length > 4 ? `
                  <div class="av" style="background:var(--bg-tertiary);color:var(--text-muted);font-size:8px">
                    +${emps.length-4}
                  </div>
                ` : ''}
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
        <div class="empty-icon"><i class="fas fa-th-large"></i></div>
        <div class="empty-title">${t('orgchart.noDepts')}</div>
      </div>`;
    }

    return `
      <div class="orgchart-list-grid">
        ${depts.map((d, idx) => {
          const hex   = d.hex || this._colors[idx % this._colors.length];
          const dEmps = emps.filter(e => e.dept === d.id);
          const mgr   = dEmps.find(e => e.name === d.manager);
          const rest  = dEmps.filter(e => e.id !== mgr?.id);
          const isExp = !this._collapsedDepts.has(d.id);

          return `
            <div class="orgchart-list-card" style="border-top:4px solid ${hex}">

              <!-- Header -->
              <div class="orgchart-list-card-header" onclick="OrgChartModule._toggleDept('${d.id}')">
                <div style="width:48px;height:48px;border-radius:14px;
                  background:linear-gradient(135deg,${hex}22,${hex}10);
                  display:flex;align-items:center;justify-content:center;
                  flex-shrink:0;border:1px solid ${hex}30">
                  <i class="${d.icon||'fas fa-building'}" style="color:${hex};font-size:22px"></i>
                </div>
                <div style="flex:1;min-width:0">
                  <div style="font-weight:700;font-size:15px;color:var(--text-primary);
                    white-space:nowrap;overflow:hidden;text-overflow:ellipsis">
                    ${_esc(d.name)}
                  </div>
                  ${d.manager
                    ? `<div style="font-size:12px;color:var(--text-muted);margin-top:2px;
                        display:flex;align-items:center;gap:5px">
                        <i class="fas fa-crown" style="color:#f59e0b;font-size:10px"></i>
                        ${_esc(d.manager)}
                      </div>`
                    : `<div style="font-size:11px;color:var(--text-muted);margin-top:2px">
                        ${t('orgchart.noManager')}
                      </div>`}
                </div>
                <div style="display:flex;align-items:center;gap:8px;flex-shrink:0">
                  <span class="orgchart-list-pill"
                    style="background:${hex}15;color:${hex};border-color:${hex}30">
                    ${dEmps.length} <i class="fas fa-user" style="font-size:10px"></i>
                  </span>
                  <i class="fas fa-chevron-${isExp?'up':'down'}"
                    style="color:var(--text-muted);font-size:11px;transition:transform .2s"></i>
                </div>
              </div>

              <!-- Body -->
              <div class="orgchart-list-card-body ${isExp?'':'hidden'}">
                ${dEmps.length === 0
                  ? `<div style="color:var(--text-muted);font-size:13px;text-align:center;
                      padding:16px 0;opacity:.7">
                      <i class="fas fa-users-slash" style="font-size:18px;display:block;margin-bottom:6px;opacity:.4"></i>
                      ${t('orgchart.empty')}
                    </div>`
                  : `
                    ${mgr ? `
                      <div class="orgchart-list-manager" style="background:${hex}08;border-color:${hex}20">
                        <div style="width:38px;height:38px;border-radius:50%;flex-shrink:0;
                          background:${hex};color:#fff;display:flex;align-items:center;
                          justify-content:center;font-size:15px;font-weight:700;
                          box-shadow:0 3px 10px ${hex}44">
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
                          <i class="fas fa-crown" style="font-size:8px;margin-${isAr?'left':'right'}:3px"></i>
                          ${isAr?'مدير':'Mgr'}
                        </span>
                      </div>
                    ` : ''}
                    ${rest.length > 0 ? `
                      <div class="orgchart-list-emp-grid">
                        ${rest.map(e => `
                          <div class="orgchart-list-emp-item">
                            <div class="av-lg" style="background:${hex}20;color:${hex}">
                              ${_esc(e.name.charAt(0))}
                            </div>
                            <div style="min-width:0;flex:1">
                              <div style="font-size:13px;font-weight:600;color:var(--text-primary);
                                white-space:nowrap;overflow:hidden;text-overflow:ellipsis">
                                ${_esc(e.name)}
                              </div>
                              <div style="font-size:11px;color:var(--text-muted);
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
          <div class="orgchart-list-card" style="border-top:4px solid var(--text-muted)">
            <div class="orgchart-list-card-header">
              <div style="width:48px;height:48px;border-radius:14px;
                background:var(--bg-tertiary);display:flex;align-items:center;
                justify-content:center;flex-shrink:0">
                <i class="fas fa-user-slash" style="color:var(--text-muted);font-size:20px"></i>
              </div>
              <div style="flex:1">
                <div style="font-weight:700;font-size:15px;color:var(--text-primary)">
                  ${t('orgchart.unassigned')}
                </div>
                <div style="font-size:11px;color:var(--text-muted);margin-top:2px">
                  ${isAr?'موظفون بدون قسم':'Employees without a department'}
                </div>
              </div>
              <span class="orgchart-list-pill"
                style="background:var(--bg-tertiary);color:var(--text-muted);border-color:var(--border)">
                ${unassigned.length} <i class="fas fa-user" style="font-size:10px"></i>
              </span>
            </div>
            <div class="orgchart-list-card-body">
              <div class="orgchart-list-emp-grid">
                ${unassigned.map(e => `
                  <div class="orgchart-list-emp-item">
                    <div class="av-lg" style="background:var(--bg-tertiary);color:var(--text-muted)">
                      ${_esc(e.name.charAt(0))}
                    </div>
                    <div style="min-width:0">
                      <div style="font-size:13px;font-weight:600;color:var(--text-primary);
                        white-space:nowrap;overflow:hidden;text-overflow:ellipsis">
                        ${_esc(e.name)}
                      </div>
                      <div style="font-size:11px;color:var(--text-muted);
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
      .orgchart-root-hero{background:linear-gradient(135deg,#6366f1,#818cf8);border-radius:16px;padding:20px 24px;display:flex;align-items:center;gap:16px;width:100%;margin-bottom:0}
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
      .orgchart-dept-col{display:flex;flex-direction:column;align-items:center;width:210px;flex-shrink:0}
      .orgchart-connector-up{width:2px;height:30px}
      .orgchart-dept-node{background:#fff;border-radius:14px;border:1px solid #e2e8f0;width:100%;overflow:hidden}
      .orgchart-dept-banner{padding:14px 12px 10px;display:flex;flex-direction:column;align-items:center;gap:5px;position:relative}
      .orgchart-dept-banner::after{content:'';position:absolute;inset:0;background:linear-gradient(180deg,rgba(255,255,255,0) 60%,#fff 100%);pointer-events:none}
      .orgchart-dept-banner-icon{width:42px;height:42px;border-radius:12px;background:rgba(255,255,255,.22);display:flex;align-items:center;justify-content:center;font-size:20px;color:#fff;border:2px solid rgba(255,255,255,.3);position:relative;z-index:1}
      .orgchart-dept-banner-name{font-size:12px;font-weight:700;color:#fff;text-align:center;position:relative;z-index:1}
      .orgchart-dept-banner-count{font-size:10px;color:rgba(255,255,255,.8);position:relative;z-index:1}
      .orgchart-dept-content{padding:10px 10px 8px}
      .orgchart-manager-row{display:flex;align-items:center;gap:7px;padding:7px 9px;background:#f8fafc;border-radius:9px;margin-bottom:7px;border:1px solid #f1f5f9}
      .orgchart-manager-crown{font-size:9px;background:#f59e0b;color:#fff;border-radius:7px;padding:2px 6px;font-weight:700;margin-inline-start:auto}
      .orgchart-emp-list{display:flex;flex-direction:column;gap:3px}
      .orgchart-emp-item{display:flex;align-items:center;gap:6px;padding:4px 7px;border-radius:7px;background:#f8fafc}
      .orgchart-dept-footer{padding:7px 10px;border-top:1px solid #f1f5f9;display:flex;align-items:center;justify-content:space-between;background:#f8fafc}
      .orgchart-dept-footer-stat{display:flex;align-items:center;gap:5px;font-size:10px;color:#64748b}
      .orgchart-present-dot{width:7px;height:7px;border-radius:50%;background:#10b981;flex-shrink:0}
      .orgchart-avatar-stack{display:flex;flex-direction:row-reverse;align-items:center}
      .orgchart-avatar-stack .av{width:22px;height:22px;border-radius:50%;border:2px solid #fff;display:flex;align-items:center;justify-content:center;font-size:8px;font-weight:700;margin-inline-start:-6px}
      .orgchart-list-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:14px}
      .orgchart-list-card{background:#fff;border-radius:14px;border:1px solid #e2e8f0;overflow:hidden}
      .orgchart-list-card-header{display:flex;align-items:center;gap:12px;padding:14px 16px}
      .orgchart-list-card-body{padding:12px 16px;border-top:1px solid #f1f5f9}
      .orgchart-list-emp-grid{display:grid;grid-template-columns:1fr;gap:5px}
      .orgchart-list-emp-item{display:flex;align-items:center;gap:9px;padding:8px 10px;background:#f8fafc;border-radius:9px}
      .av-lg{width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;flex-shrink:0}
      .orgchart-manager-badge{font-size:9px;font-weight:700;padding:2px 7px;border-radius:8px;margin-inline-start:auto}
      .orgchart-list-manager{display:flex;align-items:center;gap:8px;padding:8px 10px;margin-bottom:7px;border-radius:9px;border:1px solid #e2e8f0}
      .orgchart-list-pill{display:inline-flex;align-items:center;gap:4px;border-radius:20px;padding:3px 10px;font-size:11px;font-weight:600;border-width:1px;border-style:solid;white-space:nowrap}
      .hidden{display:none}
      button,.page-header-actions{display:none}
      @media print{body{padding:8px;background:#fff}}
    </style></head>
    <body>${stats}${body}<script>window.onload=()=>window.print()<\/script></body></html>`);
    win.document.close();
  },
};
