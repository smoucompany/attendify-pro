/* =========================================================
   AUDIT LOGS MODULE
   ========================================================= */

const AuditModule = {
  render(container) {
    container.innerHTML = `
      <div class="page-header">
        <div class="page-header-text">
          <h1>${t('audit.title')}</h1>
          <p>${t('audit.subtitle')}</p>
        </div>
        <div class="page-header-actions">
          <button class="btn btn-secondary" onclick="AuditModule.exportLogs()"><i class="fas fa-file-excel"></i> ${t('common.export')}</button>
          <button class="btn btn-secondary" onclick="App.printPage()"><i class="fas fa-print"></i> ${t('common.print')}</button>
        </div>
      </div>

      <!-- Filter Toolbar -->
      <div class="toolbar">
        <div class="toolbar-search">
          <i class="fas fa-magnifying-glass"></i>
          <input type="text" placeholder="${t('common.search')}..." id="audit-search"
            oninput="AuditModule._search=this.value; AuditModule._renderList()">
        </div>
        <select class="toolbar-select" onchange="AuditModule._moduleFilter=this.value; AuditModule._renderList()">
          <option value="all">${t('common.all')} ${t('audit.module')}</option>
          ${[...new Set(DB.audit.map(a=>a.module))].map(m=>`<option value="${m}">${m}</option>`).join('')}
        </select>
        <input type="date" class="toolbar-select" value="${new Date().toISOString().split('T')[0].substring(0,10)}"
          onchange="AuditModule._dateFilter=this.value; AuditModule._renderList()">
      </div>

      <!-- Stats -->
      <div class="stat-cards" style="margin-bottom:20px">
        ${[
          {v:DB.audit.length, l:currentLang==='ar'?'إجمالي العمليات':'Total Operations', g:'gradient-primary', i:'fas fa-list'},
          {v:DB.audit.filter(a=>a.action.includes('إضافة')||a.action.includes('Add')).length,    l:currentLang==='ar'?'إضافات':'Additions',    g:'gradient-success', i:'fas fa-plus'},
          {v:DB.audit.filter(a=>a.action.includes('تعديل')||a.action.includes('Edit')).length,   l:currentLang==='ar'?'تعديلات':'Edits',        g:'gradient-warning', i:'fas fa-pencil'},
          {v:DB.audit.filter(a=>a.action.includes('حذف')||a.action.includes('Delete')).length,   l:currentLang==='ar'?'حذف':'Deletions',       g:'gradient-danger',  i:'fas fa-trash'},
          {v:DB.audit.filter(a=>a.action.includes('دخول')||a.action.includes('Login')).length,  l:currentLang==='ar'?'تسجيلات دخول':'Logins', g:'gradient-indigo',  i:'fas fa-right-to-bracket'},
        ].map(s=>`
          <div class="stat-card stagger-item">
            <div class="stat-icon ${s.g}"><i class="${s.i}"></i></div>
            <div class="stat-info"><div class="stat-value">${s.v}</div><div class="stat-label">${s.l}</div></div>
          </div>
        `).join('')}
      </div>

      <!-- Audit Log Timeline + Table -->
      <div class="grid-main-side">
        <!-- Timeline -->
        <div class="card">
          <div class="card-header">
            <h3><i class="fas fa-timeline" style="color:var(--primary)"></i> ${currentLang==='ar'?'سجل النشاط':'Activity Log'}</h3>
          </div>
          <div class="card-body" id="audit-list"></div>
        </div>

        <!-- Activity by Module Chart -->
        <div>
          <div class="card" style="margin-bottom:16px">
            <div class="card-header"><h3><i class="fas fa-chart-pie" style="color:var(--secondary)"></i> ${currentLang==='ar'?'حسب الوحدة':'By Module'}</h3></div>
            <div class="card-body">
              <div class="chart-container" style="height:200px"><canvas id="audit-chart"></canvas></div>
            </div>
          </div>

          <!-- Quick Stats -->
          <div class="card">
            <div class="card-header"><h3><i class="fas fa-users" style="color:var(--info)"></i> ${currentLang==='ar'?'أكثر المستخدمين نشاطاً':'Top Active Users'}</h3></div>
            <div class="card-body" style="padding:8px">
              ${(() => {
                const counts = {};
                DB.audit.forEach(a => { counts[a.userId] = (counts[a.userId]||0) + 1; });
                const ranked = DB.employees
                  .map(emp => ({ emp, count: counts[emp.id]||0 }))
                  .sort((a,b) => b.count - a.count)
                  .slice(0, 5);
                if (!ranked.length) return `<div style="padding:16px;text-align:center;color:var(--text-muted);font-size:13px">${t('common.noData')}</div>`;
                return ranked.map(({emp, count}, i) => `
                  <div style="display:flex;align-items:center;gap:10px;padding:8px;border-radius:8px;margin-bottom:4px">
                    <span style="font-size:13px;font-weight:700;color:var(--text-muted);width:20px;text-align:center">${i+1}</span>
                    <div class="avatar ${emp.avatarColor}" style="width:28px;height:28px;font-size:10px">${emp.avatar}</div>
                    <div style="flex:1">
                      <div style="font-size:12.5px;font-weight:600;color:var(--text-primary)">${emp.name}</div>
                    </div>
                    <span class="badge ${count>0?'badge-primary':'badge-secondary'}">${count} ${currentLang==='ar'?'عملية':'ops'}</span>
                  </div>
                `).join('');
              })()}
            </div>
          </div>
        </div>
      </div>
    `;

    this._search      = '';
    this._moduleFilter = 'all';
    this._dateFilter   = '';
    this._renderList();

    setTimeout(() => this._renderChart(), 100);
  },

  _renderList() {
    const container = document.getElementById('audit-list');
    if (!container) return;

    let logs = DB.audit.filter(a => {
      const search = (this._search||'').toLowerCase();
      const matchSearch = !search || a.action.includes(search) || a.details.includes(search);
      const matchMod    = !this._moduleFilter || this._moduleFilter === 'all' || a.module === this._moduleFilter;
      const matchDate   = !this._dateFilter || a.time.startsWith(this._dateFilter);
      return matchSearch && matchMod && matchDate;
    });

    if (!logs.length) {
      container.innerHTML = `<div class="empty-state"><div class="empty-icon"><i class="fas fa-shield-halved"></i></div><div class="empty-title">${t('common.noData')}</div></div>`;
      return;
    }

    const actionColors = {
      'تسجيل': 'gradient-indigo', 'Login': 'gradient-indigo',
      'إضافة': 'gradient-success', 'Add': 'gradient-success',
      'تعديل': 'gradient-warning', 'Edit': 'gradient-warning',
      'حذف':   'gradient-danger',  'Delete': 'gradient-danger',
      'موافقة': 'gradient-success', 'تصدير': 'gradient-cyan',
      'رفض':   'gradient-danger',  'معالجة': 'gradient-primary',
      'إرسال': 'gradient-cyan',
    };

    const getActionColor = (action) => {
      for (const [k,v] of Object.entries(actionColors)) {
        if (action.includes(k)) return v;
      }
      return 'gradient-primary';
    };

    container.innerHTML = `
      <div>
        ${logs.map((a, i) => {
          const user = DB.getEmployee(a.userId);
          const grad = getActionColor(a.action);
          return `
            <div class="audit-item stagger-item">
              <div class="audit-timeline">
                <div class="audit-dot"></div>
                ${i < logs.length-1 ? '<div class="audit-line"></div>' : ''}
              </div>
              <div style="flex:1;padding-bottom:12px">
                <div style="display:flex;align-items:flex-start;gap:10px">
                  <div class="stat-icon ${grad}" style="width:34px;height:34px;font-size:13px;flex-shrink:0">
                    <i class="fas fa-bolt"></i>
                  </div>
                  <div style="flex:1">
                    <div class="audit-action">${a.action}</div>
                    <div class="audit-detail">${a.details}</div>
                    <div class="audit-meta">
                      <span><i class="fas fa-user"></i> ${user?.name||a.userId}</span>
                      <span><i class="fas fa-layer-group"></i> ${a.module}</span>
                      <span><i class="fas fa-network-wired"></i> ${a.ip}</span>
                      <span><i class="fas fa-clock"></i> ${App.timeAgo(a.time)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  },

  _renderChart() {
    const canvas = document.getElementById('audit-chart');
    if (!canvas) return;
    const { font } = App.getChartDefaults();

    const moduleCounts = {};
    DB.audit.forEach(a => { moduleCounts[a.module] = (moduleCounts[a.module]||0) + 1; });
    const labels = Object.keys(moduleCounts);
    const data   = Object.values(moduleCounts);
    const colors = ['#6366f1','#10b981','#f59e0b','#ef4444','#06b6d4','#8b5cf6','#f43f5e'];

    const chart = new Chart(canvas, {
      type: 'doughnut',
      data: { labels, datasets: [{ data, backgroundColor: colors, borderColor: App.state.theme==='dark'?'#0f172a':'#fff', borderWidth:3, hoverOffset:4 }] },
      options: {
        responsive:true, maintainAspectRatio:false, cutout:'65%',
        plugins: { legend:{position:'bottom',labels:{color:App.getChartDefaults().color,font:{family:font,size:10},padding:8,usePointStyle:true}}, tooltip:{rtl:currentLang==='ar',bodyFont:{family:font},titleFont:{family:font}} }
      }
    });
    App.registerChart('audit', chart);
  },

  exportLogs() {
    const data = DB.audit.map(a => {
      const user = DB.getEmployee(a.userId);
      return {
        [t('common.date')]:    a.time.split('T')[0],
        [t('common.time')]:    a.time.split('T')[1]?.split('.')[0]||'',
        [t('audit.user')]:     user?.name||a.userId,
        [t('audit.action')]:   a.action,
        [t('audit.module')]:   a.module,
        [t('audit.details')]:  a.details,
        [t('audit.ipAddress')]:a.ip,
      };
    });
    App.exportCSV(data, 'audit-logs.csv');
  }
};
