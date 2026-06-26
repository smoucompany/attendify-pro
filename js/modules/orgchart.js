/* =========================================================
   ORG CHART MODULE — الهيكل التنظيمي
   ========================================================= */

const OrgChartModule = {

  _view: 'tree', // tree | list

  render(container) {
    const isAr = currentLang === 'ar';
    container.innerHTML = `
      <div class="page-header">
        <div class="page-header-text">
          <h1>${t('orgchart.title')}</h1>
          <p>${t('orgchart.subtitle')}</p>
        </div>
        <div class="page-header-actions" style="gap:8px">
          <div class="btn-group" style="display:flex;gap:6px">
            <button class="btn ${this._view==='tree'?'btn-primary':'btn-secondary'}" onclick="OrgChartModule._view='tree';OrgChartModule.render(document.getElementById('page-content'))">
              <i class="fas fa-sitemap"></i> ${t('orgchart.treeView')}
            </button>
            <button class="btn ${this._view==='list'?'btn-primary':'btn-secondary'}" onclick="OrgChartModule._view='list';OrgChartModule.render(document.getElementById('page-content'))">
              <i class="fas fa-list"></i> ${t('orgchart.listView')}
            </button>
          </div>
          <button class="btn btn-secondary" onclick="OrgChartModule._print()">
            <i class="fas fa-print"></i> ${t('common.print')}
          </button>
        </div>
      </div>

      <div id="orgchart-body">
        ${this._view === 'tree' ? this._renderTree(isAr) : this._renderList(isAr)}
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

    const totalEmps = emps.length;

    return `
      <div class="orgchart-wrap">

        <!-- Company Root -->
        <div class="orgchart-level orgchart-level-root">
          <div class="orgchart-node orgchart-root">
            <div class="orgchart-node-icon" style="background:linear-gradient(135deg,#6366f1,#818cf8)">
              ${company.logo
                ? `<img src="${company.logo}" style="width:36px;height:36px;border-radius:50%;object-fit:cover">`
                : `<i class="fas fa-building" style="font-size:20px;color:#fff"></i>`}
            </div>
            <div class="orgchart-node-body">
              <div class="orgchart-node-name">${_esc(company.name || (isAr ? 'الشركة' : 'Company'))}</div>
              <div class="orgchart-node-role">${totalEmps} ${t('orgchart.employee')}</div>
            </div>
          </div>
          <div class="orgchart-connector-down"></div>
        </div>

        <!-- Department row connector -->
        <div class="orgchart-h-line" style="width:${Math.min(depts.length * 220, 95)}%;max-width:1200px"></div>

        <!-- Departments Row -->
        <div class="orgchart-level orgchart-level-depts" style="flex-wrap:wrap;gap:16px 12px">
          ${depts.map((d, idx) => this._deptNode(d, idx, emps, isAr)).join('')}
        </div>

      </div>
    `;
  },

  _deptNode(d, idx, allEmps, isAr) {
    const colors = ['#6366f1','#10b981','#f59e0b','#ef4444','#3b82f6','#ec4899','#14b8a6','#f97316','#8b5cf6','#06b6d4','#84cc16','#a855f7'];
    const hex    = d.hex || colors[idx % colors.length];
    const emps   = allEmps.filter(e => e.dept === d.id);
    const manager = emps.find(e => e.name === d.manager) || null;
    const others  = emps.filter(e => e.id !== manager?.id);

    return `
      <div class="orgchart-dept-col">
        <div class="orgchart-connector-up" style="border-color:${hex}"></div>
        <!-- Dept Header Node -->
        <div class="orgchart-dept-node" style="border-top:3px solid ${hex}">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">
            <div style="width:36px;height:36px;border-radius:10px;background:${hex}22;display:flex;align-items:center;justify-content:center;flex-shrink:0">
              <i class="${d.icon||'fas fa-building'}" style="color:${hex};font-size:16px"></i>
            </div>
            <div>
              <div style="font-weight:700;font-size:14px;color:var(--text-primary)">${_esc(d.name)}</div>
              <div style="font-size:11px;color:var(--text-muted)">${emps.length} ${t('orgchart.employee')}</div>
            </div>
          </div>

          ${manager ? `
            <div class="orgchart-manager-row">
              <div class="user-avatar-sm" style="width:30px;height:30px;font-size:12px;background:${hex};color:#fff;display:inline-flex;align-items:center;justify-content:center;border-radius:50%;flex-shrink:0">
                ${_esc(manager.name.charAt(0))}
              </div>
              <div style="${isAr?'margin-right':'margin-left'}:8px">
                <div style="font-size:12px;font-weight:600;color:var(--text-primary)">${_esc(manager.name)}</div>
                <div style="font-size:10px;color:${hex}">${t('orgchart.manager')}</div>
              </div>
            </div>
          ` : `<div style="font-size:11px;color:var(--text-muted);text-align:center;padding:4px 0">${t('orgchart.noManager')}</div>`}

          ${others.length > 0 ? `
            <div class="orgchart-emp-list">
              ${others.slice(0, 5).map(e => `
                <div class="orgchart-emp-item">
                  <div style="width:24px;height:24px;border-radius:50%;background:${hex}33;display:inline-flex;align-items:center;justify-content:center;font-size:10px;font-weight:600;color:${hex};flex-shrink:0">
                    ${_esc(e.name.charAt(0))}
                  </div>
                  <div style="${isAr?'margin-right':'margin-left'}:6px;font-size:11px;color:var(--text-primary);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${_esc(e.name)}</div>
                </div>
              `).join('')}
              ${others.length > 5 ? `<div style="font-size:11px;color:var(--text-muted);text-align:center;padding-top:4px">+${others.length - 5} ${t('orgchart.more')}</div>` : ''}
            </div>
          ` : ''}

          ${emps.length === 0 ? `<div style="font-size:11px;color:var(--text-muted);text-align:center;padding:8px 0">${t('orgchart.empty')}</div>` : ''}
        </div>
      </div>
    `;
  },

  _renderList(isAr) {
    const depts = DB.departments;
    const emps  = DB.employees.filter(e => e.status !== 'inactive');

    if (depts.length === 0) {
      return `<div class="empty-state">
        <div class="empty-icon"><i class="fas fa-list"></i></div>
        <div class="empty-title">${t('orgchart.noDepts')}</div>
      </div>`;
    }

    const unassigned = emps.filter(e => !e.dept || !depts.find(d => d.id === e.dept));

    return `
      <div style="display:flex;flex-direction:column;gap:16px">
        ${depts.map((d, idx) => {
          const colors = ['#6366f1','#10b981','#f59e0b','#ef4444','#3b82f6','#ec4899','#14b8a6','#f97316','#8b5cf6','#06b6d4','#84cc16','#a855f7'];
          const hex    = d.hex || colors[idx % colors.length];
          const dEmps  = emps.filter(e => e.dept === d.id);
          return `
            <div class="card" style="border-${isAr?'right':'left'}:4px solid ${hex};padding:0;overflow:hidden">
              <div style="padding:16px 20px;background:${hex}10;display:flex;align-items:center;justify-content:space-between;cursor:pointer"
                   onclick="this.nextElementSibling.style.display=this.nextElementSibling.style.display==='none'?'':'none'">
                <div style="display:flex;align-items:center;gap:12px">
                  <div style="width:40px;height:40px;border-radius:10px;background:${hex}22;display:flex;align-items:center;justify-content:center">
                    <i class="${d.icon||'fas fa-building'}" style="color:${hex};font-size:18px"></i>
                  </div>
                  <div>
                    <div style="font-weight:700;font-size:15px;color:var(--text-primary)">${_esc(d.name)}</div>
                    ${d.manager ? `<div style="font-size:12px;color:var(--text-muted)">${t('orgchart.manager')}: ${_esc(d.manager)}</div>` : ''}
                  </div>
                </div>
                <div style="display:flex;align-items:center;gap:8px">
                  <span class="badge" style="background:${hex}22;color:${hex};border-radius:20px;padding:4px 12px;font-size:12px">${dEmps.length} ${t('orgchart.employee')}</span>
                  <i class="fas fa-chevron-down" style="color:var(--text-muted)"></i>
                </div>
              </div>
              <div style="padding:16px 20px">
                ${dEmps.length === 0
                  ? `<div style="color:var(--text-muted);font-size:13px;text-align:center;padding:12px 0">${t('orgchart.empty')}</div>`
                  : `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:10px">
                    ${dEmps.map(e => `
                      <div style="display:flex;align-items:center;gap:10px;padding:8px 10px;background:var(--bg-secondary);border-radius:10px">
                        <div style="width:34px;height:34px;border-radius:50%;background:${hex}33;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;color:${hex};flex-shrink:0">${_esc(e.name.charAt(0))}</div>
                        <div style="overflow:hidden">
                          <div style="font-size:13px;font-weight:600;color:var(--text-primary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${_esc(e.name)}</div>
                          <div style="font-size:11px;color:var(--text-muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${_esc(e.position||'—')}</div>
                        </div>
                        ${e.name === d.manager ? `<span style="font-size:9px;background:${hex};color:#fff;border-radius:10px;padding:2px 6px;white-space:nowrap;margin-${isAr?'right':'left'}:auto">${t('orgchart.manager')}</span>` : ''}
                      </div>
                    `).join('')}
                  </div>`
                }
              </div>
            </div>
          `;
        }).join('')}

        ${unassigned.length > 0 ? `
          <div class="card" style="border-${isAr?'right':'left'}:4px solid var(--text-muted);padding:0;overflow:hidden">
            <div style="padding:16px 20px;background:var(--bg-secondary);display:flex;align-items:center;justify-content:space-between">
              <div style="display:flex;align-items:center;gap:12px">
                <div style="width:40px;height:40px;border-radius:10px;background:var(--bg-tertiary);display:flex;align-items:center;justify-content:center">
                  <i class="fas fa-user-slash" style="color:var(--text-muted);font-size:18px"></i>
                </div>
                <div style="font-weight:700;font-size:15px;color:var(--text-primary)">${t('orgchart.unassigned')}</div>
              </div>
              <span class="badge" style="background:var(--bg-tertiary);color:var(--text-muted);border-radius:20px;padding:4px 12px;font-size:12px">${unassigned.length} ${t('orgchart.employee')}</span>
            </div>
            <div style="padding:16px 20px;display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:10px">
              ${unassigned.map(e => `
                <div style="display:flex;align-items:center;gap:10px;padding:8px 10px;background:var(--bg-secondary);border-radius:10px">
                  <div style="width:34px;height:34px;border-radius:50%;background:var(--bg-tertiary);display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;color:var(--text-muted);flex-shrink:0">${_esc(e.name.charAt(0))}</div>
                  <div>
                    <div style="font-size:13px;font-weight:600;color:var(--text-primary)">${_esc(e.name)}</div>
                    <div style="font-size:11px;color:var(--text-muted)">${_esc(e.position||'—')}</div>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}
      </div>
    `;
  },

  _print() {
    const isAr  = currentLang === 'ar';
    const body  = document.getElementById('orgchart-body')?.innerHTML || '';
    const title = t('orgchart.title');
    const win   = window.open('', '_blank');
    win.document.write(`<!DOCTYPE html><html dir="${isAr?'rtl':'ltr'}" lang="${currentLang}">
    <head><meta charset="UTF-8"><title>${title}</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    <style>
      body{font-family:${isAr?'Tajawal,':''}sans-serif;direction:${isAr?'rtl':'ltr'};padding:24px;background:#fff;color:#1e293b}
      .orgchart-wrap{display:flex;flex-direction:column;align-items:center;gap:0}
      .orgchart-level{display:flex;justify-content:center;gap:12px;width:100%}
      .orgchart-node{display:flex;align-items:center;gap:12px;background:#f8fafc;border-radius:12px;padding:14px 20px;box-shadow:0 2px 8px rgba(0,0,0,.08)}
      .orgchart-root{background:#ede9fe;border:2px solid #6366f1}
      .orgchart-node-name{font-weight:700;font-size:16px}
      .orgchart-node-role{font-size:12px;color:#64748b}
      .orgchart-connector-down{width:2px;height:30px;background:#cbd5e1;margin:0 auto}
      .orgchart-h-line{height:2px;background:#cbd5e1;margin:0 auto}
      .orgchart-dept-col{display:flex;flex-direction:column;align-items:center;width:200px}
      .orgchart-connector-up{width:2px;height:30px;background:#cbd5e1}
      .orgchart-dept-node{background:#fff;border-radius:12px;padding:14px;box-shadow:0 2px 8px rgba(0,0,0,.08);width:100%;border:1px solid #e2e8f0}
      .orgchart-manager-row{display:flex;align-items:center;padding:8px;background:#f8fafc;border-radius:8px;margin-bottom:8px}
      .orgchart-emp-list{display:flex;flex-direction:column;gap:4px;margin-top:8px}
      .orgchart-emp-item{display:flex;align-items:center;padding:4px 6px;background:#f1f5f9;border-radius:6px}
      .card{background:#fff;border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,.08);margin-bottom:12px}
      .badge{display:inline-block;padding:3px 10px;border-radius:20px;font-size:12px}
      @media print{body{padding:0}button{display:none}}
    </style></head>
    <body>${body}<script>window.onload=()=>window.print()<\/script></body></html>`);
    win.document.close();
  },
};
