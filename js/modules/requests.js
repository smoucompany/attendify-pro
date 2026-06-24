/* =========================================================
   REQUESTS MODULE — Employee Requests Workflow
   ========================================================= */

const RequestsModule = {
  _filter: 'all',

  render(container) {
    const pending  = DB.requests.filter(r => r.status === 'pending').length;
    const approved = DB.requests.filter(r => r.status === 'approved').length;
    const rejected = DB.requests.filter(r => r.status === 'rejected').length;

    container.innerHTML = `
      <div class="page-header">
        <div class="page-header-text">
          <h1>${t('requests.title')}</h1>
          <p>${t('requests.subtitle')}</p>
        </div>
        <div class="page-header-actions">
          <button class="btn btn-primary" onclick="RequestsModule.openAdd()"><i class="fas fa-plus"></i> ${t('requests.addRequest')}</button>
        </div>
      </div>

      <!-- Stats -->
      <div class="stat-cards" style="margin-bottom:20px">
        ${[
          {val:DB.requests.length, label:currentLang==='ar'?'إجمالي الطلبات':'Total', icon:'fas fa-list',            c:'gradient-primary'},
          {val:pending,            label:t('common.pending'),  icon:'fas fa-clock',           c:'gradient-warning'},
          {val:approved,           label:t('common.approved'), icon:'fas fa-circle-check',    c:'gradient-success'},
          {val:rejected,           label:t('common.rejected'), icon:'fas fa-circle-xmark',    c:'gradient-danger'},
        ].map(s=>`
          <div class="stat-card stagger-item">
            <div class="stat-icon ${s.c}"><i class="${s.icon}"></i></div>
            <div class="stat-info"><div class="stat-value">${s.val}</div><div class="stat-label">${s.label}</div></div>
          </div>
        `).join('')}
      </div>

      <!-- Filter Tabs -->
      <div class="tabs" style="max-width:480px">
        ${['all','pending','approved','rejected'].map(f => `
          <button class="tab-btn ${this._filter===f?'active':''}" onclick="RequestsModule._filter='${f}'; RequestsModule._renderList()">
            ${t('common.'+f)}
          </button>
        `).join('')}
      </div>

      <!-- Requests Grid -->
      <div id="requests-grid"></div>
    `;

    this._renderList();
  },

  _renderList() {
    const container = document.getElementById('requests-grid');
    if (!container) return;

    const reqs = this._filter === 'all'
      ? DB.requests
      : DB.requests.filter(r => r.status === this._filter);

    if (!reqs.length) {
      container.innerHTML = `<div class="empty-state"><div class="empty-icon"><i class="fas fa-file-circle-question"></i></div><div class="empty-title">${t('common.noData')}</div></div>`;
      return;
    }

    const typeIcons = {
      overtime: {icon:'fas fa-hourglass-half', color:'#f59e0b'},
      wfh:      {icon:'fas fa-house-laptop',   color:'#6366f1'},
      scheduleChange:{icon:'fas fa-calendar-days',color:'#3b82f6'},
      loan:     {icon:'fas fa-hand-holding-dollar',color:'#10b981'},
      advance:  {icon:'fas fa-wallet',          color:'#8b5cf6'},
      document: {icon:'fas fa-file-lines',      color:'#06b6d4'},
      other:    {icon:'fas fa-ellipsis',         color:'#94a3b8'},
    };

    container.innerHTML = `
      <div style="display:grid;gap:12px">
        ${reqs.map(r => {
          const emp  = DB.getEmployee(r.empId);
          const meta = typeIcons[r.type] || typeIcons.other;
          const prio = r.priority === 'high' ? {c:'badge-danger',l:currentLang==='ar'?'عالية':'High'} : r.priority === 'medium' ? {c:'badge-warning',l:currentLang==='ar'?'متوسطة':'Medium'} : {c:'badge-secondary',l:currentLang==='ar'?'منخفضة':'Low'};

          return `
            <div class="card stagger-item" style="border-right:4px solid ${meta.color}">
              <div class="card-body" style="display:flex;align-items:flex-start;gap:14px">
                <!-- Type Icon -->
                <div style="width:44px;height:44px;border-radius:12px;background:${meta.color}18;color:${meta.color};display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0">
                  <i class="${meta.icon}"></i>
                </div>

                <!-- Content -->
                <div style="flex:1;min-width:0">
                  <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;flex-wrap:wrap">
                    <span style="font-size:13px;font-weight:700;padding:3px 10px;background:${meta.color}15;color:${meta.color};border-radius:6px">
                      ${App.getRequestTypeLabel(r.type)}
                    </span>
                    <span class="badge ${prio.c}">${prio.l}</span>
                    ${App.getStatusBadge(r.status)}
                  </div>
                  <p style="font-size:13.5px;color:var(--text-primary);margin-bottom:8px;line-height:1.6">${r.desc}</p>
                  <div style="display:flex;align-items:center;gap:16px;font-size:12px;color:var(--text-muted)">
                    <span><i class="fas fa-user"></i> ${emp?.name||''}</span>
                    <span><i class="fas fa-calendar"></i> ${App.formatDate(r.date)}</span>
                    <span><i class="fas fa-building"></i> ${DB.getDepartment(emp?.dept)?.name||''}</span>
                  </div>
                </div>

                <!-- Actions -->
                <div style="display:flex;flex-direction:column;gap:6px;align-items:flex-end;flex-shrink:0">
                  ${r.status === 'pending' ? `
                    <button class="btn btn-success btn-sm" onclick="RequestsModule.approve('${r.id}')">
                      <i class="fas fa-check"></i> ${t('common.approve')}
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="RequestsModule.reject('${r.id}')">
                      <i class="fas fa-xmark"></i> ${t('common.reject')}
                    </button>
                  ` : `
                    <button class="btn btn-secondary btn-sm" onclick="RequestsModule.view('${r.id}')">
                      <i class="fas fa-eye"></i> ${t('common.view')}
                    </button>
                  `}
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  },

  approve(id) {
    const req = DB.requests.find(r => r.id === id);
    if (!req) return;
    const emp = DB.getEmployee(req.empId);
    App.confirm(`الموافقة على طلب ${emp?.name||''}؟`, () => {
      req.status     = 'approved';
      req.approvedBy = App.state.user?.id || 'admin';
      req.approvedAt = new Date().toISOString();
      DB.save();
      App.toast('تمت الموافقة على الطلب ✓', 'success');
      App._updateBadges();
      this._renderList();
      DB.logAudit('admin', 'موافقة طلب', 'الطلبات', `${emp?.name} — ${App.getRequestTypeLabel(req.type)}`);
      if (emp && typeof WhatsApp !== 'undefined' && WhatsApp.config?.enabled) WhatsApp.notifyRequestApproved(emp, req);
    });
  },

  reject(id) {
    const req = DB.requests.find(r => r.id === id);
    if (!req) return;
    const emp = DB.getEmployee(req.empId);
    App.confirm(`رفض طلب ${emp?.name||''}؟`, () => {
      req.status     = 'rejected';
      req.rejectedAt = new Date().toISOString();
      DB.save();
      App.toast('تم رفض الطلب', 'error');
      App._updateBadges();
      this._renderList();
      DB.logAudit('admin', 'رفض طلب', 'الطلبات', `${emp?.name} — ${App.getRequestTypeLabel(req.type)}`);
      if (emp && typeof WhatsApp !== 'undefined' && WhatsApp.config?.enabled) WhatsApp.notifyRequestRejected(emp, req);
    });
  },

  view(id) {
    const req  = DB.requests.find(r => r.id === id);
    const emp  = DB.getEmployee(req?.empId);
    App.openModal(App.getRequestTypeLabel(req?.type), `
      <div style="background:var(--bg-input);border-radius:10px;padding:16px;margin-bottom:16px">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px">
          ${App.renderAvatar(emp, 40, 11)}
          <div>
            <div style="font-weight:700;color:var(--text-primary)">${emp?.name}</div>
            <div style="font-size:12px;color:var(--text-muted)">${emp?.position}</div>
          </div>
          <div style="margin-right:auto">${App.getStatusBadge(req.status)}</div>
        </div>
        <p style="font-size:13.5px;color:var(--text-primary);line-height:1.7">${req.desc}</p>
      </div>
      <div style="font-size:12px;color:var(--text-muted);text-align:center">
        ${currentLang==='ar'?'تاريخ الطلب:':'Date:'} ${App.formatDate(req.date)}
      </div>
      <div style="margin-top:16px;text-align:center">
        <button class="btn btn-secondary" onclick="App.closeModal()">${t('common.close')}</button>
      </div>
    `, { size: 'sm' });
  },

  openAdd() {
    App.openModal(t('requests.addRequest'), `
      <form onsubmit="RequestsModule.saveRequest(event)">
        <div class="app-form-group">
          <label>${t('nav.employees')}</label>
          <select class="app-form-input app-form-select" name="empId" required>
            ${DB.employees.map(e=>`<option value="${e.id}">${e.name}</option>`).join('')}
          </select>
        </div>
        <div class="app-form-row">
          <div class="app-form-group">
            <label>${t('requests.requestType')}</label>
            <select class="app-form-input app-form-select" name="type" required>
              ${['overtime','wfh','scheduleChange','loan','advance','document','other'].map(t2=>`<option value="${t2}">${App.getRequestTypeLabel(t2)}</option>`).join('')}
            </select>
          </div>
          <div class="app-form-group">
            <label>${currentLang==='ar'?'الأولوية':'Priority'}</label>
            <select class="app-form-input app-form-select" name="priority">
              <option value="high">${currentLang==='ar'?'عالية':'High'}</option>
              <option value="medium" selected>${currentLang==='ar'?'متوسطة':'Medium'}</option>
              <option value="low">${currentLang==='ar'?'منخفضة':'Low'}</option>
            </select>
          </div>
        </div>
        <div class="app-form-group">
          <label>${t('requests.description')}</label>
          <textarea class="app-form-input" name="desc" rows="4" style="resize:vertical" required placeholder="${currentLang==='ar'?'اشرح تفاصيل طلبك...':'Describe your request...'}"></textarea>
        </div>
        <div class="modal-footer" style="padding:0;margin-top:20px">
          <button type="button" class="btn btn-secondary" onclick="App.closeModal()">${t('common.cancel')}</button>
          <button type="submit" class="btn btn-primary"><i class="fas fa-paper-plane"></i> ${t('requests.addRequest')}</button>
        </div>
      </form>
    `);
  },

  saveRequest(e) {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target));
    DB.requests.unshift({
      id:     DB.nextId('r'),
      empId:  data.empId,
      type:   data.type,
      status: 'pending',
      date:   new Date().toISOString().split('T')[0],
      desc:   data.desc,
      priority: data.priority,
    });
    DB.save();
    App.closeModal();
    App.toast(currentLang==='ar'?'تم تقديم الطلب بنجاح':'Request submitted', 'success');
    App._updateBadges();
    this.render(document.getElementById('page-content'));
  }
};
