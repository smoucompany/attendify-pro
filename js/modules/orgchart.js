/* =========================================================
   ORG CHART MODULE — الهيكل التنظيمي  v4
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
              <i class="fas fa-table-columns"></i> ${t('orgchart.listView')}
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
      { icon:'fas fa-users',        color:'#6366f1', bg:'#6366f115', val: emps.length,   lbl: isAr?'إجمالي الموظفين':'Total Employees' },
      { icon:'fas fa-building',     color:'#10b981', bg:'#10b98115', val: depts.length,  lbl: t('nav.departments') },
      { icon:'fas fa-user-tie',     color:'#f59e0b', bg:'#f59e0b15', val: managers,      lbl: isAr?'المديرون':'Managers' },
      { icon:'fas fa-circle-check', color:'#3b82f6', bg:'#3b82f615', val: presentAll,    lbl: isAr?'حاضرون اليوم':'Present Today' },
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
        <div class="orgchart-h-line" style="width:${Math.min(depts.length*256,96)}%;max-width:1600px"></div>

        <!-- Departments -->
        <div class="orgchart-level orgchart-level-depts"
          style="flex-wrap:wrap;gap:0 12px;align-items:flex-start;justify-content:center;padding:0 4px">
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
    const occPct      = emps.length > 0 ? Math.round(present / emps.length * 100) : 0;
    const displayEmps = others.slice(0, 4);
    const moreCount   = others.length > 4 ? others.length - 4 : 0;

    return `
      <div class="orgchart-dept-col">
        <div class="orgchart-connector-up" style="background:${hex};opacity:.5"></div>

        <div class="orgchart-dept-node">

          <!-- Gradient Header -->
          <div class="orgchart-dept-hdr" style="background:linear-gradient(135deg,${hex} 0%,${hex}cc 100%)">
            <div class="orgchart-dept-hdr-icon">
              <i class="${d.icon||'fas fa-building'}"></i>
            </div>
            <div style="flex:1;min-width:0">
              <div class="orgchart-dept-hdr-name">${_esc(d.name)}</div>
            </div>
            <div class="orgchart-dept-hdr-badge">
              ${emps.length} <i class="fas fa-user" style="font-size:9px"></i>
            </div>
          </div>

          <!-- Manager Section -->
          <div style="padding:10px 12px 8px">
            <div style="font-size:9px;font-weight:700;color:${hex};text-transform:uppercase;
              letter-spacing:.6px;margin-bottom:7px;opacity:.9">
              <i class="fas fa-user-tie" style="font-size:8px;margin-${isAr?'left':'right'}:4px"></i>
              ${isAr?'المدير':'Manager'}
            </div>
            ${manager ? `
              <div class="orgchart-mgr-card" style="background:${hex}0c;border-color:${hex}25">
                <div class="orgchart-mgr-avatar" style="background:linear-gradient(135deg,${hex},${hex}bb)">
                  ${_esc(manager.name.charAt(0))}
                </div>
                <div style="min-width:0;flex:1">
                  <div style="font-size:12px;font-weight:700;color:var(--text-primary);
                    white-space:nowrap;overflow:hidden;text-overflow:ellipsis">
                    ${_esc(manager.name)}
                  </div>
                  <div style="font-size:10px;color:${hex};font-weight:600;margin-top:1px">
                    ${_esc(manager.position || t('orgchart.manager'))}
                  </div>
                </div>
                <div class="orgchart-mgr-crown">
                  <i class="fas fa-crown" style="font-size:8px;color:#f59e0b"></i>
                </div>
              </div>
            ` : `
              <div style="display:flex;align-items:center;gap:6px;padding:9px 10px;
                background:var(--bg-secondary);border-radius:9px;
                color:var(--text-muted);font-size:11px;border:1px dashed var(--border)">
                <i class="fas fa-user-slash" style="opacity:.3;font-size:11px"></i>
                ${t('orgchart.noManager')}
              </div>
            `}
          </div>

          <!-- Team Grid -->
          ${others.length > 0 ? `
            <div style="padding:0 12px 8px">
              <div style="font-size:9px;font-weight:700;color:var(--text-muted);text-transform:uppercase;
                letter-spacing:.6px;margin-bottom:7px">
                <i class="fas fa-users" style="font-size:8px;margin-${isAr?'left':'right'}:4px"></i>
                ${isAr?'الفريق':'Team'} (${others.length})
              </div>
              <div class="orgchart-team-grid">
                ${displayEmps.map(e => `
                  <div class="orgchart-team-item" title="${_esc(e.name)}">
                    <div class="orgchart-team-av" style="background:${hex}18;color:${hex}">
                      ${_esc(e.name.charAt(0))}
                    </div>
                    <div style="min-width:0">
                      <div style="font-size:10px;font-weight:600;color:var(--text-primary);
                        white-space:nowrap;overflow:hidden;text-overflow:ellipsis">
                        ${_esc(e.name.split(' ')[0])}
                      </div>
                      ${e.position ? `<div style="font-size:9px;color:var(--text-muted);
                        white-space:nowrap;overflow:hidden;text-overflow:ellipsis">
                        ${_esc(e.position)}</div>` : ''}
                    </div>
                  </div>
                `).join('')}
                ${moreCount > 0 ? `
                  <div class="orgchart-team-more" style="color:${hex};border-color:${hex}35;background:${hex}08">
                    +${moreCount} ${isAr?'آخرون':'more'}
                  </div>
                ` : ''}
              </div>
            </div>
          ` : (emps.length === 0 ? `
            <div style="text-align:center;color:var(--text-muted);font-size:11px;
              padding:6px 12px 10px;opacity:.6">
              ${t('orgchart.empty')}
            </div>
          ` : '')}

          <!-- Footer -->
          <div class="orgchart-dept-footer">
            <div class="orgchart-dept-footer-stat">
              <div class="orgchart-present-dot"></div>
              ${present} ${isAr?'حاضر':'present'}
            </div>
            <div style="display:flex;align-items:center;gap:5px">
              <div style="width:42px;background:var(--border);border-radius:3px;height:4px;overflow:hidden">
                <div style="background:${hex};height:4px;border-radius:3px;width:${occPct}%;transition:width .6s"></div>
              </div>
              <span style="font-size:9px;color:var(--text-muted);font-weight:600">${occPct}%</span>
            </div>
          </div>

        </div>
      </div>
    `;
  },

  /* ── Directory (List) View ─────────────────────────────── */
  _renderList(isAr) {
    const depts      = DB.departments;
    const emps       = DB.employees.filter(e => e.status !== 'inactive');
    const unassigned = emps.filter(e => !e.dept || !depts.find(d => d.id === e.dept));
    const today      = new Date().toISOString().slice(0,10);

    if (depts.length === 0) {
      return `<div class="empty-state">
        <div class="empty-icon"><i class="fas fa-table-columns"></i></div>
        <div class="empty-title">${t('orgchart.noDepts')}</div>
      </div>`;
    }

    const deptCard = (d, hex, dEmps, mgr, rest, present, onLeave) => `
      <div class="orgchart-dir-card">

        <!-- Left: Dept Info -->
        <div class="orgchart-dir-left" style="border-top:4px solid ${hex}">
          <div class="orgchart-dir-icon" style="background:${hex}15;color:${hex};border-color:${hex}28">
            <i class="${d.icon||'fas fa-building'}"></i>
          </div>
          <div class="orgchart-dir-name">${_esc(d.name)}</div>
          <div class="orgchart-dir-count" style="color:${hex}">
            ${dEmps.length} ${t('orgchart.employee')}
          </div>
          <div style="display:flex;flex-direction:column;gap:4px;margin-top:4px">
            <div style="display:flex;align-items:center;gap:5px;font-size:11px;color:#10b981">
              <div style="width:6px;height:6px;border-radius:50%;background:#10b981;
                box-shadow:0 0 0 2px rgba(16,185,129,.2)"></div>
              ${present} ${isAr?'حاضر':'present'}
            </div>
            ${onLeave > 0 ? `
              <div style="display:flex;align-items:center;gap:5px;font-size:11px;color:#f59e0b">
                <i class="fas fa-umbrella-beach" style="font-size:9px;width:6px"></i>
                ${onLeave} ${isAr?'إجازة':'on leave'}
              </div>
            ` : ''}
          </div>
          <!-- mini bar -->
          <div style="margin-top:auto;padding-top:10px">
            <div style="background:var(--border);border-radius:4px;height:4px;overflow:hidden">
              <div style="background:${hex};height:4px;border-radius:4px;
                width:${dEmps.length>0?Math.round(present/dEmps.length*100):0}%"></div>
            </div>
            <div style="font-size:9px;color:var(--text-muted);margin-top:3px;text-align:center">
              ${present}/${dEmps.length}
            </div>
          </div>
        </div>

        <!-- Middle: Manager -->
        <div class="orgchart-dir-mgr">
          ${mgr ? `
            <div class="orgchart-dir-mgr-inner">
              <div class="orgchart-dir-mgr-av" style="background:linear-gradient(135deg,${hex},${hex}bb)">
                ${_esc(mgr.name.charAt(0))}
              </div>
              <div class="orgchart-dir-mgr-name">${_esc(mgr.name)}</div>
              <div style="font-size:11px;color:${hex};font-weight:500;margin-top:2px;
                white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:150px">
                ${_esc(mgr.position || t('orgchart.manager'))}
              </div>
              <div style="margin-top:8px">
                <span style="display:inline-flex;align-items:center;gap:4px;
                  background:#f59e0b18;color:#b45309;font-size:10px;font-weight:700;
                  border-radius:8px;padding:3px 9px;border:1px solid #f59e0b30">
                  <i class="fas fa-crown" style="font-size:8px"></i>
                  ${isAr?'مدير':'Manager'}
                </span>
              </div>
            </div>
          ` : `
            <div style="text-align:center;color:var(--text-muted)">
              <i class="fas fa-user-slash" style="font-size:28px;opacity:.25;display:block;margin-bottom:8px"></i>
              <div style="font-size:12px">${t('orgchart.noManager')}</div>
            </div>
          `}
        </div>

        <!-- Right: Team -->
        <div class="orgchart-dir-team">
          ${rest.length > 0 ? `
            <div class="orgchart-dir-emp-grid">
              ${rest.map(e => `
                <div class="orgchart-dir-emp-item">
                  <div class="orgchart-dir-emp-av" style="background:${hex}18;color:${hex}">
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
          ` : `
            <div style="color:var(--text-muted);font-size:13px;text-align:center;
              padding:20px;opacity:.5;width:100%">
              <i class="fas fa-users-slash" style="font-size:26px;display:block;margin-bottom:8px;opacity:.4"></i>
              ${t('orgchart.empty')}
            </div>
          `}
        </div>

      </div>
    `;

    return `
      <div class="orgchart-dir-list">
        ${depts.map((d, idx) => {
          const hex     = d.hex || this._colors[idx % this._colors.length];
          const dEmps   = emps.filter(e => e.dept === d.id);
          const mgr     = dEmps.find(e => e.name === d.manager);
          const rest    = dEmps.filter(e => e.id !== mgr?.id);
          const present = DB.attendance.filter(a =>
            a.date === today && dEmps.find(e => e.id === a.empId) && a.status !== 'absent'
          ).length;
          const onLeave = dEmps.filter(e => e.status === 'on_leave').length;
          return deptCard(d, hex, dEmps, mgr, rest, present, onLeave);
        }).join('')}

        ${unassigned.length > 0 ? `
          <div class="orgchart-dir-card">
            <div class="orgchart-dir-left" style="border-top:4px solid var(--border)">
              <div class="orgchart-dir-icon" style="background:var(--bg-tertiary);color:var(--text-muted);border-color:var(--border)">
                <i class="fas fa-user-slash"></i>
              </div>
              <div class="orgchart-dir-name">${t('orgchart.unassigned')}</div>
              <div class="orgchart-dir-count" style="color:var(--text-muted)">
                ${unassigned.length} ${t('orgchart.employee')}
              </div>
            </div>
            <div class="orgchart-dir-mgr">
              <div style="text-align:center;color:var(--text-muted);opacity:.5">
                <i class="fas fa-minus-circle" style="font-size:28px;display:block;margin-bottom:8px"></i>
                <div style="font-size:12px">${isAr?'غير مخصص':'Unassigned'}</div>
              </div>
            </div>
            <div class="orgchart-dir-team">
              <div class="orgchart-dir-emp-grid">
                ${unassigned.map(e => `
                  <div class="orgchart-dir-emp-item">
                    <div class="orgchart-dir-emp-av" style="background:var(--bg-tertiary);color:var(--text-muted)">
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
      /* Root hero */
      .orgchart-wrap{display:flex;flex-direction:column;align-items:center;padding:0 0 20px}
      .orgchart-root-hero{background:linear-gradient(135deg,#6366f1,#818cf8);border-radius:16px;padding:20px 24px;display:flex;align-items:center;gap:16px;width:100%}
      .orgchart-root-logo{width:56px;height:56px;border-radius:14px;background:rgba(255,255,255,.2);display:flex;align-items:center;justify-content:center;font-size:24px;color:#fff;flex-shrink:0;border:2px solid rgba(255,255,255,.3)}
      .orgchart-root-info{flex:1;position:relative;z-index:1}
      .orgchart-root-name{font-size:18px;font-weight:800;color:#fff}
      .orgchart-root-sub{font-size:12px;color:rgba(255,255,255,.75);margin-bottom:8px}
      .orgchart-root-pills{display:flex;gap:8px;flex-wrap:wrap}
      .orgchart-root-pill{display:inline-flex;align-items:center;gap:5px;background:rgba(255,255,255,.18);color:#fff;border-radius:20px;padding:3px 10px;font-size:11px;font-weight:600;border:1px solid rgba(255,255,255,.25)}
      /* Connectors */
      .orgchart-connector-down{width:2px;height:32px;background:#cbd5e1;margin:0 auto}
      .orgchart-h-line{height:2px;background:#e2e8f0;margin:0 auto}
      .orgchart-level{display:flex;justify-content:center;gap:12px;width:100%}
      .orgchart-level-root{width:100%}
      .orgchart-level-depts{flex-wrap:wrap;align-items:flex-start;gap:0 12px;justify-content:center}
      .orgchart-dept-col{display:flex;flex-direction:column;align-items:center;width:220px;flex-shrink:0}
      .orgchart-connector-up{width:2px;height:28px}
      /* Dept card */
      .orgchart-dept-node{background:#fff;border-radius:14px;border:1px solid #e2e8f0;width:100%;overflow:hidden}
      .orgchart-dept-hdr{display:flex;align-items:center;gap:8px;padding:11px 12px;position:relative;overflow:hidden}
      .orgchart-dept-hdr-icon{width:34px;height:34px;border-radius:9px;background:rgba(255,255,255,.22);display:flex;align-items:center;justify-content:center;font-size:15px;color:#fff;flex-shrink:0;border:1.5px solid rgba(255,255,255,.3)}
      .orgchart-dept-hdr-name{font-size:12px;font-weight:800;color:#fff;flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      .orgchart-dept-hdr-badge{display:inline-flex;align-items:center;gap:3px;background:rgba(255,255,255,.2);color:#fff;border-radius:12px;padding:2px 7px;font-size:9px;font-weight:700;border:1px solid rgba(255,255,255,.25);flex-shrink:0}
      .orgchart-mgr-card{display:flex;align-items:center;gap:8px;padding:7px 9px;border-radius:9px;border:1px solid #e2e8f0}
      .orgchart-mgr-avatar{width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:800;color:#fff;flex-shrink:0}
      .orgchart-mgr-crown{width:20px;height:20px;border-radius:6px;background:#fef3c7;border:1px solid #fde68a;display:flex;align-items:center;justify-content:center;flex-shrink:0}
      .orgchart-team-grid{display:grid;grid-template-columns:1fr 1fr;gap:4px}
      .orgchart-team-item{display:flex;align-items:center;gap:5px;padding:4px 6px;background:#f8fafc;border-radius:7px;min-width:0}
      .orgchart-team-av{width:22px;height:22px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:8px;font-weight:800;flex-shrink:0}
      .orgchart-team-more{display:flex;align-items:center;justify-content:center;padding:4px;border-radius:7px;border:1px dashed #e2e8f0;font-size:10px;font-weight:700;grid-column:1/-1;text-align:center;color:#94a3b8}
      .orgchart-dept-footer{padding:7px 12px;border-top:1px solid #f1f5f9;display:flex;align-items:center;justify-content:space-between;background:#f8fafc}
      .orgchart-dept-footer-stat{display:flex;align-items:center;gap:4px;font-size:10px;color:#64748b}
      .orgchart-present-dot{width:6px;height:6px;border-radius:50%;background:#10b981;flex-shrink:0}
      /* Directory */
      .orgchart-dir-list{display:flex;flex-direction:column;gap:10px}
      .orgchart-dir-card{background:#fff;border-radius:14px;border:1px solid #e2e8f0;display:grid;grid-template-columns:180px 160px 1fr;overflow:hidden}
      .orgchart-dir-left{padding:16px 14px;display:flex;flex-direction:column;gap:6px;border-inline-end:1px solid #f1f5f9}
      .orgchart-dir-icon{width:44px;height:44px;border-radius:13px;display:flex;align-items:center;justify-content:center;font-size:20px;border-width:1.5px;border-style:solid}
      .orgchart-dir-name{font-size:13px;font-weight:800;color:#1e293b;line-height:1.2}
      .orgchart-dir-count{font-size:11px;font-weight:600}
      .orgchart-dir-mgr{padding:16px 14px;display:flex;align-items:center;justify-content:center;border-inline-end:1px solid #f1f5f9;background:#f8fafc}
      .orgchart-dir-mgr-inner{text-align:center;max-width:140px}
      .orgchart-dir-mgr-av{width:44px;height:44px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:17px;font-weight:800;color:#fff;margin:0 auto 6px}
      .orgchart-dir-mgr-name{font-size:12px;font-weight:700;color:#1e293b;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      .orgchart-dir-team{padding:12px 16px;display:flex;align-items:center}
      .orgchart-dir-emp-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:5px;width:100%}
      .orgchart-dir-emp-item{display:flex;align-items:center;gap:7px;padding:6px 8px;border-radius:9px;background:#f8fafc}
      .orgchart-dir-emp-av{width:26px;height:26px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:800;flex-shrink:0}
      button,.page-header-actions{display:none}
      @media print{body{padding:8px;background:#fff}}
    </style></head>
    <body>${stats}${body}<script>window.onload=()=>window.print()<\/script></body></html>`);
    win.document.close();
  },
};
