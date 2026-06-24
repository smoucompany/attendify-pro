/* =========================================================
   DEDUCTIONS MODULE — Loans · Fines · Advances · Custom
   ========================================================= */

const DeductionsModule = {

  get _types() {
    return {
      loan:      { label: t('deductions.typeLoan'),      icon: 'fas fa-hand-holding-dollar', color: '#6366f1' },
      advance:   { label: t('deductions.typeAdvance'),   icon: 'fas fa-money-bill-transfer',  color: '#f59e0b' },
      fine:      { label: t('deductions.typeFine'),      icon: 'fas fa-gavel',               color: '#ef4444' },
      admin:     { label: t('deductions.typeAdmin'),     icon: 'fas fa-triangle-exclamation', color: '#dc2626' },
      custody:   { label: t('deductions.typeCustody'),   icon: 'fas fa-box-archive',          color: '#0891b2' },
      insurance: { label: t('deductions.typeInsurance'), icon: 'fas fa-shield-halved',       color: '#10b981' },
      tax:       { label: t('deductions.typeTax'),       icon: 'fas fa-receipt',             color: '#8b5cf6' },
      other:     { label: t('deductions.typeOther'),     icon: 'fas fa-circle-minus',        color: '#64748b' },
    };
  },

  render(container) {
    const totalAmount    = DB.deductions.reduce((s, d) => s + (d.amount || 0), 0);
    const pendingAmount  = DB.deductions.filter(d => d.status === 'pending').reduce((s, d) => s + (d.amount || 0), 0);
    const appliedAmount  = DB.deductions.filter(d => d.status === 'applied').reduce((s, d) => s + (d.amount || 0), 0);

    container.innerHTML = `
      <div class="page-header">
        <div class="page-header-text">
          <h1><i class="fas fa-circle-minus" style="color:var(--danger);font-size:22px"></i> ${t('deductions.title')}</h1>
          <p>${t('deductions.subtitle')}</p>
        </div>
        <div class="page-header-actions">
          <button class="btn btn-primary" onclick="DeductionsModule.openAdd()">
            <i class="fas fa-plus"></i> ${t('deductions.addBtn')}
          </button>
        </div>
      </div>

      <!-- Summary Cards -->
      <div class="stat-cards" style="margin-bottom:24px">
        <div class="stat-card primary stagger-item">
          <div class="stat-icon gradient-primary"><i class="fas fa-list"></i></div>
          <div class="stat-info">
            <div class="stat-value">${DB.deductions.length}</div>
            <div class="stat-label">${t('deductions.totalRecords')}</div>
          </div>
        </div>
        <div class="stat-card warning stagger-item">
          <div class="stat-icon gradient-warning"><i class="fas fa-clock"></i></div>
          <div class="stat-info">
            <div class="stat-value">${App.formatCurrency(pendingAmount)}</div>
            <div class="stat-label">${t('deductions.pendingAmount')}</div>
          </div>
        </div>
        <div class="stat-card danger stagger-item">
          <div class="stat-icon gradient-danger"><i class="fas fa-circle-minus"></i></div>
          <div class="stat-info">
            <div class="stat-value">${App.formatCurrency(appliedAmount)}</div>
            <div class="stat-label">${t('deductions.appliedAmount')}</div>
          </div>
        </div>
        <div class="stat-card success stagger-item">
          <div class="stat-icon gradient-success"><i class="fas fa-calculator"></i></div>
          <div class="stat-info">
            <div class="stat-value">${App.formatCurrency(totalAmount)}</div>
            <div class="stat-label">${t('deductions.totalAmount')}</div>
          </div>
        </div>
      </div>

      <!-- Filter by type -->
      <div class="card" style="margin-bottom:16px">
        <div class="card-body" style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">
          <span style="font-size:13px;font-weight:700;color:var(--text-muted)">${t('deductions.typeFilter')}</span>
          <button class="btn btn-primary btn-sm" onclick="DeductionsModule._filter('all', this)">${t('common.all')}</button>
          ${Object.entries(this._types).map(([k,v]) => `
            <button class="btn btn-secondary btn-sm" onclick="DeductionsModule._filter('${k}', this)" style="border-color:${v.color}15">
              <i class="${v.icon}" style="color:${v.color}"></i> ${v.label}
            </button>
          `).join('')}
        </div>
      </div>

      <!-- Table -->
      <div class="card">
        <div class="card-body" style="padding:0" id="deductions-table">
          ${this._renderTable(DB.deductions)}
        </div>
      </div>
    `;
  },

  _filter(type, btn) {
    document.querySelectorAll('.page-header ~ * .btn').forEach(b => b.classList.remove('btn-primary'));
    document.querySelectorAll('.page-header ~ * .btn').forEach(b => b.classList.add('btn-secondary'));
    btn.classList.remove('btn-secondary');
    btn.classList.add('btn-primary');
    const filtered = type === 'all' ? DB.deductions : DB.deductions.filter(d => d.type === type);
    document.getElementById('deductions-table').innerHTML = this._renderTable(filtered);
  },

  _renderTable(rows) {
    if (!rows.length) return `
      <div class="empty-state" style="padding:48px">
        <div class="empty-icon"><i class="fas fa-circle-minus"></i></div>
        <div class="empty-title">${t('deductions.noDeductions')}</div>
        <p class="empty-desc">${t('deductions.emptyDesc')}</p>
      </div>`;

    return `
      <div class="table-wrapper" style="border:none;border-radius:0">
        <table class="data-table">
          <thead>
            <tr>
              <th>${t('deductions.employee')}</th>
              <th>${t('deductions.deductionType')}</th>
              <th>${t('deductions.reason')}</th>
              <th>${t('deductions.amount')}</th>
              <th>${t('deductions.period')}</th>
              <th>${t('common.status')}</th>
              <th>${t('common.actions')}</th>
            </tr>
          </thead>
          <tbody>
            ${rows.map(d => {
              const emp  = DB.getEmployee(d.empId);
              const type = this._types[d.type] || this._types.other;
              const statusMap = {
                pending: { label: t('deductions.statusPending'), cls: 'badge-warning' },
                applied: { label: t('deductions.statusApplied'), cls: 'badge-danger'  },
                paid:    { label: t('deductions.statusPaid'),    cls: 'badge-success' },
              };
              const st = statusMap[d.status] || statusMap.pending;
              return `
                <tr class="stagger-item">
                  <td>
                    <div class="table-avatar">
                      ${App.renderAvatar(emp, 30, 8)}
                      <div class="avatar-info">
                        <div class="avatar-name">${emp?.name||'—'}</div>
                        <div class="avatar-sub">${emp?.no ? '#'+emp.no : ''}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span style="display:inline-flex;align-items:center;gap:6px;padding:3px 10px;border-radius:6px;font-size:12px;font-weight:600;background:${type.color}15;color:${type.color}">
                      <i class="${type.icon}"></i> ${type.label}
                    </span>
                  </td>
                  <td style="max-width:200px;font-size:13px;color:var(--text-secondary)">${_esc(d.reason||'—')}</td>
                  <td><span style="font-weight:700;color:var(--danger)">${App.formatCurrency(d.amount||0)}</span></td>
                  <td style="font-family:var(--font-en);font-size:13px">${d.period||'—'}</td>
                  <td><span class="badge ${st.cls}">${st.label}</span></td>
                  <td>
                    <div style="display:flex;gap:4px">
                      ${d.status === 'pending' ? `
                        <button class="btn btn-sm btn-danger" onclick="DeductionsModule.apply('${d.id}')" title="${t('deductions.applyTitle')}">
                          <i class="fas fa-check"></i>
                        </button>
                      ` : ''}
                      <button class="btn-icon btn" onclick="DeductionsModule.edit('${d.id}')"><i class="fas fa-pencil"></i></button>
                      <button class="btn-icon btn" onclick="DeductionsModule.delete('${d.id}')"><i class="fas fa-trash" style="color:var(--danger)"></i></button>
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

  openAdd(empId = '') {
    this._openForm(null, empId);
  },

  edit(id) {
    const d = DB.deductions.find(d => d.id === id);
    if (d) this._openForm(d);
  },

  _openForm(ded, preEmpId = '') {
    const isEdit = !!ded;
    const curMonth = new Date().toISOString().slice(0, 7);
    App.openModal(isEdit ? t('deductions.editTitle') : t('deductions.addTitle'), `
      <form onsubmit="DeductionsModule.save(event, '${ded?.id||''}')">
        <div class="app-form-row">
          <div class="app-form-group">
            <label>${t('deductions.employee')} <span style="color:var(--danger)">*</span></label>
            <select class="app-form-input app-form-select" name="empId" required>
              <option value="">${t('deductions.selectEmployee')}</option>
              ${DB.employees.filter(e=>e.status!=='terminated').map(e =>
                `<option value="${e.id}" ${(ded?.empId||preEmpId)===e.id?'selected':''}>${e.name} (#${e.no})</option>`
              ).join('')}
            </select>
          </div>
          <div class="app-form-group">
            <label>${t('deductions.deductionType')} <span style="color:var(--danger)">*</span></label>
            <select class="app-form-input app-form-select" name="type" required>
              ${Object.entries(this._types).map(([k,v]) =>
                `<option value="${k}" ${ded?.type===k?'selected':''}>${v.label}</option>`
              ).join('')}
            </select>
          </div>
        </div>
        <div class="app-form-row">
          <div class="app-form-group">
            <label>${t('deductions.amountLabel')} <span style="color:var(--danger)">*</span></label>
            <input class="app-form-input" type="number" name="amount" min="1" step="0.01"
              value="${ded?.amount||''}" placeholder="0.00" required>
          </div>
          <div class="app-form-group">
            <label>${t('deductions.periodLabel')} <span style="color:var(--danger)">*</span></label>
            <input class="app-form-input" type="month" name="period" value="${ded?.period||curMonth}" required>
          </div>
        </div>
        <div class="app-form-group">
          <label>${t('deductions.reasonLabel')}</label>
          <textarea class="app-form-input" name="reason" rows="2" placeholder="${t('deductions.reasonPlaceholder')}...">${_esc(ded?.reason||'')}</textarea>
        </div>
        <div class="app-form-group">
          <label>${t('deductions.statusLabel')}</label>
          <select class="app-form-input app-form-select" name="status">
            <option value="applied" ${(!ded||ded.status==='applied'||ded.status==='pending')?'selected':''}>${t('deductions.statusAppliedOption')}</option>
            <option value="paid"    ${ded?.status==='paid'?'selected':''}>${t('deductions.statusPaidOption')}</option>
          </select>
        </div>
        <div class="modal-footer" style="padding:0;margin-top:20px">
          <button type="button" class="btn btn-secondary" onclick="App.closeModal()">${t('common.cancel')}</button>
          <button type="submit" class="btn btn-primary"><i class="fas fa-save"></i> ${isEdit ? t('deductions.saveEdit') : t('deductions.saveAdd')}</button>
        </div>
      </form>
    `);
  },

  save(e, id) {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target));
    if (!data.empId) { App.toast(t('deductions.selectEmpError'), 'error'); return; }

    if (id) {
      const d = DB.deductions.find(d => d.id === id);
      if (d) Object.assign(d, { empId: data.empId, type: data.type, amount: parseFloat(data.amount)||0, reason: data.reason, period: data.period, status: data.status });
    } else {
      DB.deductions.push({
        id:     DB.nextId('ded'),
        empId:  data.empId,
        type:   data.type,
        amount: parseFloat(data.amount) || 0,
        reason: data.reason || '',
        period: data.period,
        status: data.status || 'applied',
        createdAt: new Date().toISOString(),
      });
    }
    DB.save();
    App.closeModal();
    App.toast(id ? t('deductions.toastUpdated') : t('deductions.toastAdded'), 'success');
    this.render(document.getElementById('page-content'));
  },

  apply(id) {
    App.confirm(t('deductions.confirmApply'), () => {
      const d = DB.deductions.find(d => d.id === id);
      if (!d) return;
      d.status = 'applied';
      DB.save();
      App.toast(t('deductions.toastApplied'), 'success');
      this.render(document.getElementById('page-content'));
    });
  },

  delete(id) {
    App.confirm(t('deductions.confirmDelete'), () => {
      const i = DB.deductions.findIndex(d => d.id === id);
      if (i !== -1) DB.deductions.splice(i, 1);
      DB.save();
      App.toast(t('deductions.toastDeleted'), 'info');
      this.render(document.getElementById('page-content'));
    });
  },

  // Returns total custom deductions for an employee in a given period
  getTotal(empId, period) {
    return DB.deductions
      .filter(d => d.empId === empId && d.period === period && d.status !== 'paid')
      .reduce((s, d) => s + (d.amount || 0), 0);
  },
};
