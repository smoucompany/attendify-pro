/* =========================================================
   LEAVES MODULE
   Leave requests · Balance · Approve/Reject · Calendar
   ========================================================= */

const LeavesModule = {
  _filter: 'all',

  render(container) {
    const pending  = DB.leaves.filter(l => l.status === 'pending').length;
    const approved = DB.leaves.filter(l => l.status === 'approved').length;
    const rejected = DB.leaves.filter(l => l.status === 'rejected').length;

    container.innerHTML = `
      <div class="page-header">
        <div class="page-header-text">
          <h1>${t('leaves.title')}</h1>
          <p>${t('leaves.subtitle')}</p>
        </div>
        <div class="page-header-actions">
          <button class="btn btn-secondary" onclick="LeavesModule.exportData()"><i class="fas fa-file-excel"></i> ${t('common.export')}</button>
          <button class="btn btn-primary" onclick="LeavesModule.openAdd()"><i class="fas fa-calendar-plus"></i> ${t('leaves.addLeave')}</button>
        </div>
      </div>

      <!-- Summary -->
      <div class="stat-cards" style="margin-bottom:20px">
        <div class="stat-card warning stagger-item">
          <div class="stat-icon gradient-warning"><i class="fas fa-clock"></i></div>
          <div class="stat-info">
            <div class="stat-value">${pending}</div>
            <div class="stat-label">${t('common.pending')}</div>
          </div>
        </div>
        <div class="stat-card success stagger-item">
          <div class="stat-icon gradient-success"><i class="fas fa-calendar-check"></i></div>
          <div class="stat-info">
            <div class="stat-value">${approved}</div>
            <div class="stat-label">${t('common.approved')}</div>
          </div>
        </div>
        <div class="stat-card danger stagger-item">
          <div class="stat-icon gradient-danger"><i class="fas fa-calendar-xmark"></i></div>
          <div class="stat-info">
            <div class="stat-value">${rejected}</div>
            <div class="stat-label">${t('common.rejected')}</div>
          </div>
        </div>
        <div class="stat-card primary stagger-item">
          <div class="stat-icon gradient-primary"><i class="fas fa-list"></i></div>
          <div class="stat-info">
            <div class="stat-value">${DB.leaves.length}</div>
            <div class="stat-label">${currentLang==='ar'?'إجمالي الطلبات':'Total Requests'}</div>
          </div>
        </div>
      </div>

      <!-- Filter Tabs -->
      <div class="tabs" style="max-width:500px">
        ${['all','pending','approved','rejected'].map(f => `
          <button class="tab-btn ${this._filter===f?'active':''}" onclick="LeavesModule._filter='${f}'; LeavesModule._renderList()">
            ${t('common.'+f)} ${f==='all'?'('+DB.leaves.length+')':f==='pending'?'('+pending+')':f==='approved'?'('+approved+')':'('+rejected+')'}
          </button>
        `).join('')}
      </div>

      <!-- Requests List -->
      <div class="grid-main-side">
        <div id="leaves-list"></div>

        <!-- Leave Balance Panel -->
        <div>
          <div class="card" style="margin-bottom:16px">
            <div class="card-header"><h3><i class="fas fa-chart-bar" style="color:var(--primary)"></i> ${t('leaves.balance')}</h3></div>
            <div class="card-body">
              ${DB.employees.slice(0, 6).map(emp => {
                const bal = DB.leaveBalances[emp.id] || { annual: 21, taken: 0, remaining: 21 };
                const pct = Math.round((bal.taken / bal.annual) * 100);
                return `
                  <div style="margin-bottom:14px">
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:5px">
                      <div style="display:flex;align-items:center;gap:6px">
                        <div class="avatar ${emp.avatarColor}" style="width:24px;height:24px;font-size:9px">${emp.avatar}</div>
                        <span style="font-size:12px;font-weight:600;color:var(--text-primary)">${emp.name}</span>
                      </div>
                      <span style="font-size:11px;color:var(--text-muted)">${bal.taken}/${bal.annual}</span>
                    </div>
                    <div class="progress-bar">
                      <div class="progress-fill ${pct>80?'gradient-danger':pct>50?'gradient-warning':'gradient-success'}" style="width:${pct}%"></div>
                    </div>
                    <div style="display:flex;justify-content:space-between;margin-top:3px">
                      <span style="font-size:10px;color:var(--text-muted)">${t('leaves.taken')}: ${bal.taken}</span>
                      <span style="font-size:10px;color:var(--success);font-weight:600">${t('leaves.remaining')}: ${bal.remaining}</span>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>

          <!-- Leave Types Guide -->
          <div class="card">
            <div class="card-header"><h3><i class="fas fa-info-circle" style="color:var(--info)"></i> ${currentLang==='ar'?'أنواع الإجازات':'Leave Types'}</h3></div>
            <div class="card-body">
              ${[
                ['annual','#6366f1',21],['sick','#ef4444',30],
                ['emergency','#f59e0b',5],['unpaid','#94a3b8','—'],
                ['maternity','#ec4899',90],['paternity','#3b82f6',3],
              ].map(([type,color,days]) => `
                <div style="display:flex;align-items:center;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--border)">
                  <div style="display:flex;align-items:center;gap:8px">
                    <div style="width:10px;height:10px;border-radius:2px;background:${color}"></div>
                    <span style="font-size:12.5px;color:var(--text-secondary)">${t('leaves.'+type)}</span>
                  </div>
                  <span style="font-size:12px;font-weight:700;color:var(--text-primary)">${days} ${typeof days==='number'?t('leaves.days'):''}</span>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      </div>
    `;

    this._renderList();
  },

  _renderList() {
    const container = document.getElementById('leaves-list');
    if (!container) return;

    const leaves = this._filter === 'all'
      ? DB.leaves
      : DB.leaves.filter(l => l.status === this._filter);

    if (!leaves.length) {
      container.innerHTML = `<div class="empty-state"><div class="empty-icon"><i class="fas fa-calendar-minus"></i></div><div class="empty-title">${t('common.noData')}</div></div>`;
      return;
    }

    container.innerHTML = `
      <div class="table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>${t('common.name')}</th>
              <th>${t('leaves.type')}</th>
              <th>${t('leaves.fromDate')}</th>
              <th>${t('leaves.toDate')}</th>
              <th>${t('leaves.days')}</th>
              <th>${t('common.status')}</th>
              <th>${t('common.actions')}</th>
            </tr>
          </thead>
          <tbody>
            ${leaves.map(l => {
              const emp  = DB.getEmployee(l.empId);
              const type = App.getLeaveTypeLabel(l.type);
              return `
                <tr class="stagger-item">
                  <td>
                    <div class="table-avatar">
                      <div class="avatar ${emp?.avatarColor||'gradient-primary'}">${emp?.avatar||'?'}</div>
                      <div class="avatar-info">
                        <div class="avatar-name">${emp?.name||'—'}</div>
                        <div class="avatar-sub">${App.formatDate(l.appliedOn)}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span style="display:inline-flex;align-items:center;gap:6px;padding:3px 10px;background:${type.color}15;color:${type.color};border-radius:6px;font-size:12px;font-weight:600">
                      <span style="width:6px;height:6px;border-radius:50%;background:${type.color}"></span>${type.label}
                    </span>
                  </td>
                  <td style="font-family:var(--font-en)">${App.formatDate(l.from)}</td>
                  <td style="font-family:var(--font-en)">${App.formatDate(l.to)}</td>
                  <td><span style="font-weight:700;color:var(--text-primary)">${l.days}</span> <span style="color:var(--text-muted);font-size:11px">${t('leaves.days')}</span></td>
                  <td>${App.getStatusBadge(l.status)}</td>
                  <td>
                    <div style="display:flex;gap:4px">
                      ${l.status === 'pending' ? `
                        <button class="btn btn-success btn-sm" onclick="LeavesModule.approve('${l.id}')"><i class="fas fa-check"></i></button>
                        <button class="btn btn-danger btn-sm"  onclick="LeavesModule.reject('${l.id}')"><i class="fas fa-xmark"></i></button>
                      ` : ''}
                      <button class="btn-icon btn" onclick="LeavesModule.viewLeave('${l.id}')"><i class="fas fa-eye"></i></button>
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

  approve(id) {
    const leave = DB.leaves.find(l => l.id === id);
    if (!leave) return;
    leave.status = 'approved';
    leave.approvedBy = App.state.user?.id || 'admin';

    // خصم أيام الإجازة من رصيد الموظف (الحقول المستخدمة هي from/to)
    const leaveFrom = leave.from || leave.startDate;
    const leaveTo   = leave.to   || leave.endDate;
    if (leaveFrom && leaveTo) {
      const days = leave.days || Math.max(1, Math.round((new Date(leaveTo) - new Date(leaveFrom)) / 86400000) + 1);
      if (!DB.leaveBalances[leave.empId]) DB.leaveBalances[leave.empId] = { annual: 21, sick: 10, emergency: 3, remaining: 21, taken: 0 };
      const bal = DB.leaveBalances[leave.empId];
      bal.taken     = (bal.taken || 0) + days;
      bal.remaining = Math.max(0, (bal.remaining ?? 21) - days);
    }

    DB.save();
    App.toast(currentLang==='ar'?'تمت الموافقة على الإجازة':'Leave approved', 'success');
    App._updateBadges();
    this._renderList();
    if (App.state.currentPage === 'dashboard') DashboardModule.render(document.getElementById('page-content'));
    // WhatsApp notification
    const emp = DB.getEmployee(leave.empId);
    if (emp) {
      if (WhatsApp.config.enabled) WhatsApp.notifyLeaveApproved(emp, leave);
      else this._offerWA(() => WhatsApp.notifyLeaveApproved(emp, leave));
    }
  },

  reject(id) {
    const leave = DB.leaves.find(l => l.id === id);
    if (!leave) return;
    leave.status = 'rejected';
    DB.save();
    App.toast(currentLang==='ar'?'تم رفض الإجازة':'Leave rejected', 'error');
    App._updateBadges();
    this._renderList();
    // WhatsApp notification
    const emp = DB.getEmployee(leave.empId);
    if (emp) {
      if (WhatsApp.config.enabled) WhatsApp.notifyLeaveRejected(emp, leave);
      else this._offerWA(() => WhatsApp.notifyLeaveRejected(emp, leave));
    }
  },

  _offerWA(sendFn) {
    setTimeout(() => {
      App.openModal('إرسال إشعار WhatsApp؟', `
        <div style="text-align:center;padding:16px 0">
          <div style="font-size:52px;margin-bottom:12px"><i class="fab fa-whatsapp" style="color:#25d366"></i></div>
          <p style="font-size:15px;font-weight:700;color:var(--text-primary);margin-bottom:6px">هل تريد إبلاغ الموظف عبر WhatsApp؟</p>
          <p style="font-size:13px;color:var(--text-muted);margin-bottom:24px">فعّل WhatsApp من الإعدادات للإرسال التلقائي</p>
          <div style="display:flex;gap:10px;justify-content:center">
            <button class="btn btn-success" onclick="App.navigate('settings');App.closeModal()">
              <i class="fas fa-gear"></i> إعداد WhatsApp
            </button>
            <button class="btn btn-secondary" onclick="App.closeModal()">تخطي</button>
          </div>
        </div>
      `, { size: 'sm' });
    }, 300);
  },

  viewLeave(id) {
    const leave = DB.leaves.find(l => l.id === id);
    const emp   = DB.getEmployee(leave?.empId);
    const type  = App.getLeaveTypeLabel(leave?.type);
    if (!leave) return;

    App.openModal(currentLang==='ar'?'تفاصيل الإجازة':'Leave Details', `
      <div style="text-align:center;margin-bottom:20px">
        <div class="avatar ${emp?.avatarColor}" style="width:60px;height:60px;font-size:22px;margin:0 auto 10px;border-radius:14px">${emp?.avatar}</div>
        <div style="font-size:16px;font-weight:700">${emp?.name}</div>
        <div style="font-size:12px;color:var(--text-muted)">${emp?.position}</div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:16px">
        ${[
          [t('leaves.type'),     type.label],
          [t('common.status'),   leave.status],
          [t('leaves.fromDate'), App.formatDate(leave.from)],
          [t('leaves.toDate'),   App.formatDate(leave.to)],
          [t('leaves.days'),     leave.days + ' ' + t('leaves.days')],
          [currentLang==='ar'?'تاريخ الطلب':'Applied On', App.formatDate(leave.appliedOn)],
        ].map(([label, val]) => `
          <div style="background:var(--bg-input);border-radius:8px;padding:10px">
            <div style="font-size:11px;color:var(--text-muted)">${label}</div>
            <div style="font-size:13.5px;font-weight:600;color:var(--text-primary);margin-top:2px">${val}</div>
          </div>
        `).join('')}
      </div>
      <div style="background:var(--bg-input);border-radius:8px;padding:12px;margin-bottom:16px">
        <div style="font-size:11px;color:var(--text-muted);margin-bottom:4px">${t('leaves.reason')}</div>
        <div style="font-size:13.5px;color:var(--text-primary)">${leave.reason}</div>
      </div>
      ${leave.status === 'pending' ? `
        <div style="display:flex;gap:10px">
          <button class="btn btn-success w-full" onclick="LeavesModule.approve('${id}'); App.closeModal()"><i class="fas fa-check"></i> ${t('common.approve')}</button>
          <button class="btn btn-danger w-full"  onclick="LeavesModule.reject('${id}');  App.closeModal()"><i class="fas fa-xmark"></i> ${t('common.reject')}</button>
        </div>
      ` : `<button class="btn btn-secondary w-full" onclick="App.closeModal()">${t('common.close')}</button>`}
    `, { size: 'sm' });
  },

  openAdd() {
    App.openModal(t('leaves.addLeave'), `
      <form onsubmit="LeavesModule.saveLeave(event)">
        <div class="app-form-group">
          <label>${t('nav.employees')}</label>
          <select class="app-form-input app-form-select" name="empId" required>
            ${DB.employees.map(e=>`<option value="${e.id}">${e.name}</option>`).join('')}
          </select>
        </div>
        <div class="app-form-group">
          <label>${t('leaves.type')}</label>
          <select class="app-form-input app-form-select" name="type" required>
            ${['annual','sick','emergency','unpaid','maternity','paternity'].map(type => `
              <option value="${type}">${t('leaves.'+type)}</option>
            `).join('')}
          </select>
        </div>
        <div class="app-form-row">
          <div class="app-form-group">
            <label>${t('leaves.fromDate')}</label>
            <input class="app-form-input" type="date" name="from" value="${new Date().toISOString().split('T')[0]}" required>
          </div>
          <div class="app-form-group">
            <label>${t('leaves.toDate')}</label>
            <input class="app-form-input" type="date" name="to" value="${new Date().toISOString().split('T')[0]}" required>
          </div>
        </div>
        <div class="app-form-group">
          <label>${t('leaves.reason')}</label>
          <textarea class="app-form-input" name="reason" rows="3" style="resize:vertical" required placeholder="${t('leaves.reason')}..."></textarea>
        </div>
        <div class="modal-footer" style="padding:0;margin-top:20px">
          <button type="button" class="btn btn-secondary" onclick="App.closeModal()">${t('common.cancel')}</button>
          <button type="submit" class="btn btn-primary"><i class="fas fa-calendar-plus"></i> ${t('leaves.addLeave')}</button>
        </div>
      </form>
    `);
  },

  saveLeave(e) {
    e.preventDefault();
    const data  = Object.fromEntries(new FormData(e.target));
    const from  = new Date(data.from);
    const to    = new Date(data.to);
    const days  = Math.max(1, Math.ceil((to - from) / 86400000) + 1);

    DB.leaves.push({
      id:         DB.nextId('l'),
      empId:      data.empId,
      type:       data.type,
      from:       data.from,
      to:         data.to,
      days,
      status:     'pending',
      reason:     data.reason,
      approvedBy: null,
      appliedOn:  new Date().toISOString().split('T')[0],
    });

    DB.save();
    App.closeModal();
    App.toast(t('leaves.addLeave') + ' — ' + (currentLang==='ar'?'تم بنجاح':'Submitted'), 'success');
    App._updateBadges();
    this.render(document.getElementById('page-content'));
  },

  exportData() {
    const data = DB.leaves.map(l => {
      const emp  = DB.getEmployee(l.empId);
      const type = App.getLeaveTypeLabel(l.type);
      return {
        [t('common.name')]:     emp?.name||'',
        [t('leaves.type')]:     type.label,
        [t('leaves.fromDate')]: l.from,
        [t('leaves.toDate')]:   l.to,
        [t('leaves.days')]:     l.days,
        [t('common.status')]:   l.status,
        [t('leaves.reason')]:   l.reason,
      };
    });
    App.exportCSV(data, 'leaves.csv');
  }
};
