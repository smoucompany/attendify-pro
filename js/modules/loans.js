/* =========================================================
   ATTENDIFY PRO — وحدة السلف والقروض
   ========================================================= */

const LoansModule = {

  render(container) {
    const loans    = DB.loans || [];
    const pending  = loans.filter(l => l.status === 'pending');
    const active   = loans.filter(l => l.status === 'approved');
    const paid     = loans.filter(l => l.status === 'paid');
    const rejected = loans.filter(l => l.status === 'rejected');
    const isAr     = currentLang === 'ar';

    const totalAmt  = loans.reduce((s,l) => s + (l.amount||0), 0);
    const activeAmt = active.reduce((s,l) => s + (l.remainingAmount||0), 0);
    const paidAmt   = paid.reduce((s,l) => s + (l.amount||0), 0);
    const paidPct   = totalAmt > 0 ? Math.round((paidAmt / totalAmt) * 100) : 0;

    container.innerHTML = `
      <div class="page-header">
        <div class="page-header-text">
          <h1 style="display:flex;align-items:center;gap:10px">
            <span style="width:38px;height:38px;border-radius:12px;background:linear-gradient(135deg,#6366f1,#818cf8);
              display:inline-flex;align-items:center;justify-content:center;color:#fff;font-size:18px;flex-shrink:0">
              <i class="fas fa-hand-holding-dollar"></i>
            </span>
            ${t('loans.title')}
          </h1>
          <p>${t('loans.subtitle')}</p>
        </div>
        <div class="page-header-actions">
          <button class="btn btn-primary" onclick="LoansModule.openAddForm()">
            <i class="fas fa-plus"></i> ${t('loans.addBtn')}
          </button>
        </div>
      </div>

      <!-- Stats -->
      <div class="orgchart-stats" style="grid-template-columns:repeat(auto-fill,minmax(200px,1fr));margin-bottom:20px">
        <div class="orgchart-stat-card" style="color:#6366f1">
          <div class="orgchart-stat-icon" style="background:#6366f115;color:#6366f1">
            <i class="fas fa-file-invoice-dollar"></i>
          </div>
          <div>
            <div class="orgchart-stat-val">${loans.length}</div>
            <div class="orgchart-stat-lbl">${t('loans.totalRequests')}</div>
          </div>
        </div>
        <div class="orgchart-stat-card" style="color:#f59e0b;cursor:pointer"
          onclick="document.getElementById('ln-filter-status').value='pending';LoansModule._filter()">
          <div class="orgchart-stat-icon" style="background:#f59e0b15;color:#f59e0b">
            <i class="fas fa-hourglass-half"></i>
          </div>
          <div>
            <div class="orgchart-stat-val">${pending.length}</div>
            <div class="orgchart-stat-lbl">${t('loans.pending')}</div>
          </div>
        </div>
        <div class="orgchart-stat-card" style="color:#10b981;cursor:pointer"
          onclick="document.getElementById('ln-filter-status').value='approved';LoansModule._filter()">
          <div class="orgchart-stat-icon" style="background:#10b98115;color:#10b981">
            <i class="fas fa-check-circle"></i>
          </div>
          <div>
            <div class="orgchart-stat-val">${active.length}</div>
            <div class="orgchart-stat-lbl">${t('loans.active')}</div>
          </div>
        </div>
        <div class="orgchart-stat-card" style="color:#ef4444">
          <div class="orgchart-stat-icon" style="background:#ef444415;color:#ef4444">
            <i class="fas fa-coins"></i>
          </div>
          <div>
            <div class="orgchart-stat-val" style="font-size:16px">${App.formatCurrency(activeAmt)}</div>
            <div class="orgchart-stat-lbl">${t('loans.totalRemaining')}</div>
          </div>
        </div>
      </div>

      <!-- Portfolio Overview -->
      ${loans.length > 0 ? `
      <div class="card" style="padding:18px 22px;margin-bottom:20px;display:flex;align-items:center;gap:24px;flex-wrap:wrap">
        <div style="flex:1;min-width:220px">
          <div style="display:flex;justify-content:space-between;margin-bottom:8px">
            <span style="font-size:13px;color:var(--text-muted)">
              ${isAr ? 'إجمالي المحفظة' : 'Total Portfolio'}
            </span>
            <span style="font-size:13px;font-weight:700;color:#6366f1">${App.formatCurrency(totalAmt)}</span>
          </div>
          <div style="background:var(--border);border-radius:8px;height:10px;overflow:hidden">
            <div style="height:10px;border-radius:8px;background:linear-gradient(90deg,#10b981,#6ee7b7);width:${paidPct}%;transition:width .6s"></div>
          </div>
          <div style="display:flex;justify-content:space-between;margin-top:6px">
            <span style="font-size:11px;color:#10b981;font-weight:600">
              <i class="fas fa-check"></i> ${App.formatCurrency(paidAmt)} ${isAr?'مسدّد':'paid'} (${paidPct}%)
            </span>
            <span style="font-size:11px;color:#ef4444;font-weight:600">
              ${App.formatCurrency(activeAmt)} ${isAr?'متبقي':'remaining'}
            </span>
          </div>
        </div>
        <div style="display:flex;gap:10px;flex-wrap:wrap">
          ${[
            { color:'#10b981', count: paid.length,     label: t('loans.paid') },
            { color:'#6366f1', count: active.length,   label: t('loans.active') },
            { color:'#f59e0b', count: pending.length,  label: t('loans.pending') },
            { color:'#ef4444', count: rejected.length, label: t('loans.rejected') },
          ].map(s => `
            <div style="display:flex;flex-direction:column;align-items:center;
              background:${s.color}10;border:1px solid ${s.color}30;border-radius:12px;
              padding:8px 14px;min-width:60px">
              <div style="font-size:20px;font-weight:800;color:${s.color}">${s.count}</div>
              <div style="font-size:10px;color:var(--text-muted);margin-top:2px">${s.label}</div>
            </div>
          `).join('')}
        </div>
      </div>
      ` : ''}

      <!-- Filters -->
      <div class="filter-bar">
        <div class="filter-group">
          <select class="filter-select" id="ln-filter-status" onchange="LoansModule._filter()">
            <option value="">${t('loans.allStatuses')}</option>
            <option value="pending">${t('loans.pending')}</option>
            <option value="approved">${t('loans.active')}</option>
            <option value="rejected">${t('loans.rejected')}</option>
            <option value="paid">${t('loans.paid')}</option>
          </select>
        </div>
        <div class="filter-group">
          <select class="filter-select" id="ln-filter-type" onchange="LoansModule._filter()">
            <option value="">${t('loans.allTypes')}</option>
            <option value="advance">${t('loans.typeAdvance')}</option>
            <option value="loan">${t('loans.typeLoan')}</option>
          </select>
        </div>
        <div class="filter-group" style="flex:1">
          <div class="search-box">
            <i class="fas fa-search search-icon"></i>
            <input type="text" class="search-input" id="ln-search"
              placeholder="${t('loans.searchPlaceholder')}" oninput="LoansModule._filter()">
          </div>
        </div>
      </div>

      <!-- Table -->
      <div class="data-table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>${t('loans.employee')}</th>
              <th>${t('loans.type')}</th>
              <th>${t('loans.amount')}</th>
              <th>${t('loans.monthlyInstallment')}</th>
              <th>${t('loans.remaining')}</th>
              <th>${t('loans.startMonth')}</th>
              <th>${t('common.status')}</th>
              <th>${t('common.actions')}</th>
            </tr>
          </thead>
          <tbody id="loans-tbody">
            ${this._rows(loans)}
          </tbody>
        </table>
        ${loans.length === 0 ? `
          <div class="empty-state">
            <div class="empty-icon"><i class="fas fa-hand-holding-dollar"></i></div>
            <div class="empty-title">${t('loans.noLoans')}</div>
            <p class="empty-desc">${t('loans.emptyDesc')}</p>
            <button class="btn btn-primary" style="margin-top:16px" onclick="LoansModule.openAddForm()">
              <i class="fas fa-plus"></i> ${t('loans.addBtn')}
            </button>
          </div>` : ''}
      </div>
    `;
  },

  _rows(list) {
    if (!list.length) return `<tr><td colspan="8" style="text-align:center;color:var(--text-muted);padding:40px">${t('loans.noResults')}</td></tr>`;

    const statusColors = { pending:'#f59e0b', approved:'#6366f1', rejected:'#ef4444', paid:'#10b981' };
    const isAr = currentLang === 'ar';

    return list.map(ln => {
      const emp  = DB.getEmployee(ln.empId);
      const paidAmt = (ln.amount||0) - (ln.remainingAmount||ln.amount||0);
      const pct  = ln.amount > 0 ? Math.round((paidAmt / ln.amount) * 100) : 0;
      const sc   = statusColors[ln.status] || '#94a3b8';
      const moRemaining = ln.installment > 0 && ln.remainingAmount > 0
        ? Math.ceil(ln.remainingAmount / ln.installment) : 0;

      return `
        <tr class="stagger-item" style="border-${isAr?'right':'left'}:3px solid ${sc}">
          <td>
            <div style="display:flex;align-items:center;gap:10px">
              ${App.renderAvatar(emp, 36, 12)}
              <div>
                <div style="font-weight:600;font-size:14px">${_esc(emp?.name||'—')}</div>
                <div style="color:var(--text-muted);font-size:11px">${_esc(emp?.no||emp?.position||'')}</div>
              </div>
            </div>
          </td>
          <td>${this._typeBadge(ln.type)}</td>
          <td>
            <div style="font-weight:700;font-size:14px">${App.formatCurrency(ln.amount||0)}</div>
            <div style="font-size:10px;color:var(--text-muted)">${ln.months||1} ${isAr?'شهر':'mo'}</div>
          </td>
          <td>
            <div style="color:#6366f1;font-weight:700">${App.formatCurrency(ln.installment||0)}</div>
            ${moRemaining > 0 ? `<div style="font-size:10px;color:var(--text-muted)">${moRemaining} ${isAr?'قسط متبقي':'left'}</div>` : ''}
          </td>
          <td>
            <div style="color:#ef4444;font-weight:700;margin-bottom:5px">${App.formatCurrency(ln.remainingAmount||0)}</div>
            ${ln.status==='approved' ? `
              <div style="background:var(--border);border-radius:4px;height:5px;width:90px;overflow:hidden">
                <div style="background:linear-gradient(90deg,#6366f1,#818cf8);height:5px;border-radius:4px;width:${pct}%"></div>
              </div>
              <div style="font-size:9px;color:var(--text-muted);margin-top:2px">${pct}% ${isAr?'مسدّد':'paid'}</div>
            ` : ''}
          </td>
          <td style="color:var(--text-muted);font-size:13px">${ln.startMonth||'—'}</td>
          <td>${this._statusBadge(ln.status)}</td>
          <td>
            <div style="display:flex;gap:5px;flex-wrap:wrap;align-items:center">
              ${ln.status==='pending' ? `
                <button class="btn btn-icon btn-sm" style="background:rgba(16,185,129,.12);color:#10b981;border-radius:8px"
                  title="${t('loans.approve')}" onclick="LoansModule.approve('${ln.id}')">
                  <i class="fas fa-check"></i>
                </button>
                <button class="btn btn-icon btn-sm" style="background:rgba(239,68,68,.12);color:#ef4444;border-radius:8px"
                  title="${t('loans.reject')}" onclick="LoansModule.reject('${ln.id}')">
                  <i class="fas fa-times"></i>
                </button>
              ` : ''}
              ${ln.status==='approved' ? `
                <button class="btn btn-icon btn-sm" style="background:rgba(99,102,241,.12);color:#6366f1;border-radius:8px"
                  title="${t('loans.payInstallment')}" onclick="LoansModule.recordPayment('${ln.id}')">
                  <i class="fas fa-money-bill-wave"></i>
                </button>
              ` : ''}
              <button class="btn btn-icon btn-sm" style="border-radius:8px"
                title="${t('loans.details')}" onclick="LoansModule.viewDetails('${ln.id}')">
                <i class="fas fa-eye"></i>
              </button>
              <button class="btn btn-icon btn-sm" style="background:rgba(239,68,68,.08);color:#ef4444;border-radius:8px"
                title="${t('common.delete')}" onclick="LoansModule.deleteLoan('${ln.id}')">
                <i class="fas fa-trash"></i>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  },

  _statusBadge(s) {
    const m = {
      pending:  ['warning','hourglass-half', t('loans.pending')],
      approved: ['success','check-circle',   t('loans.active')],
      rejected: ['danger','times-circle',    t('loans.rejected')],
      paid:     ['info','circle-check',      t('loans.paid')],
    };
    const [cls, icon, label] = m[s] || ['default','circle',s];
    return `<span class="badge badge-${cls}"><i class="fas fa-${icon}"></i> ${label}</span>`;
  },

  _typeBadge(tp) {
    return tp === 'advance'
      ? `<span class="badge badge-primary"><i class="fas fa-bolt"></i> ${t('loans.typeAdvance')}</span>`
      : `<span class="badge" style="background:rgba(139,92,246,.12);color:#8b5cf6"><i class="fas fa-coins"></i> ${t('loans.typeLoan')}</span>`;
  },

  _filter() {
    const status = document.getElementById('ln-filter-status')?.value || '';
    const type   = document.getElementById('ln-filter-type')?.value   || '';
    const search = (document.getElementById('ln-search')?.value || '').toLowerCase();
    const list = (DB.loans || []).filter(ln => {
      if (status && ln.status !== status) return false;
      if (type   && ln.type   !== type)   return false;
      if (search) {
        const emp = DB.getEmployee(ln.empId);
        if (!(emp?.name||'').toLowerCase().includes(search)) return false;
      }
      return true;
    });
    const tbody = document.getElementById('loans-tbody');
    if (tbody) tbody.innerHTML = this._rows(list);
  },

  openAddForm(preEmpId = '') {
    const opts = DB.employees
      .filter(e => e.status !== 'terminated')
      .map(e => `<option value="${e.id}" ${e.id===preEmpId?'selected':''}>${_esc(e.name)} (${_esc(e.no||'')})</option>`)
      .join('');

    App.openModal(t('loans.addBtn'), `
      <div class="app-form-group">
        <label>${t('loans.employee')} <span style="color:#ef4444">*</span></label>
        <select class="app-form-input app-form-select" id="ln-emp">
          <option value="">${t('loans.selectEmployee')}</option>
          ${opts}
        </select>
      </div>
      <div class="app-form-row">
        <div class="app-form-group">
          <label>${t('loans.type')}</label>
          <select class="app-form-input app-form-select" id="ln-type">
            <option value="advance">${t('loans.typeAdvanceSalary')}</option>
            <option value="loan">${t('loans.typeLoan')}</option>
          </select>
        </div>
        <div class="app-form-group">
          <label>${t('loans.totalAmount')} <span style="color:#ef4444">*</span></label>
          <input class="app-form-input" type="number" id="ln-amount" min="1" placeholder="5000" oninput="LoansModule._calcInst()">
        </div>
        <div class="app-form-group">
          <label>${t('loans.months')}</label>
          <input class="app-form-input" type="number" id="ln-months" min="1" max="60" value="1" oninput="LoansModule._calcInst()">
        </div>
        <div class="app-form-group">
          <label>${t('loans.monthlyInstallment')}</label>
          <input class="app-form-input" type="text" id="ln-inst" readonly placeholder="${t('loans.calcAuto')}">
        </div>
        <div class="app-form-group">
          <label>${t('loans.requestDate')}</label>
          <input class="app-form-input" type="date" id="ln-date" value="${new Date().toISOString().split('T')[0]}">
        </div>
        <div class="app-form-group">
          <label>${t('loans.salaryDeductStart')}</label>
          <input class="app-form-input" type="month" id="ln-start" value="${new Date().toISOString().slice(0,7)}">
        </div>
      </div>
      <div class="app-form-group">
        <label>${t('loans.reason')}</label>
        <textarea class="app-form-input" id="ln-reason" rows="2" placeholder="${t('loans.reasonPlaceholder')}"></textarea>
      </div>
      <div style="display:flex;gap:10px;margin-top:8px">
        <button class="btn btn-secondary" onclick="App.closeModal()">${t('common.cancel')}</button>
        <button class="btn btn-primary" onclick="LoansModule.save()">
          <i class="fas fa-save"></i> ${t('common.save')}
        </button>
      </div>
    `);
  },

  _calcInst() {
    const amt = parseFloat(document.getElementById('ln-amount')?.value) || 0;
    const mo  = parseInt(document.getElementById('ln-months')?.value) || 1;
    const el  = document.getElementById('ln-inst');
    if (el) el.value = mo > 0 && amt > 0 ? App.formatCurrency(Math.ceil(amt / mo)) : '';
  },

  save() {
    const empId  = document.getElementById('ln-emp')?.value;
    const type   = document.getElementById('ln-type')?.value || 'advance';
    const amount = parseFloat(document.getElementById('ln-amount')?.value) || 0;
    const months = parseInt(document.getElementById('ln-months')?.value) || 1;
    const reason = (document.getElementById('ln-reason')?.value || '').trim();
    const date   = document.getElementById('ln-date')?.value || new Date().toISOString().split('T')[0];
    const start  = document.getElementById('ln-start')?.value || new Date().toISOString().slice(0,7);

    if (!empId)    { App.toast(t('loans.selectEmpError'), 'error'); return; }
    if (amount<=0) { App.toast(t('loans.invalidAmtError'), 'error'); return; }

    const ln = {
      id: DB.nextId('loan'),
      empId, type, amount,
      installment: Math.ceil(amount / months),
      months,
      remainingAmount: amount,
      reason,
      requestDate: date,
      startMonth: start,
      status: 'pending',
      payments: [],
    };

    if (!DB.loans) DB.loans = [];
    DB.loans.push(ln);
    DB.save();
    if (typeof SupabaseDB !== 'undefined') SupabaseDB._enqueue('upsert','loans', ln);

    App.closeModal();
    const emp = DB.getEmployee(empId);
    DB.logAudit('admin', `${type==='advance'?t('loans.typeAdvance'):t('loans.typeLoan')} — ${emp?.name||''} — ${App.formatCurrency(amount)}`, 'Loans');
    App.toast('✅ ' + t('loans.toastAdded'), 'success');
    this.render(document.getElementById('page-content'));
  },

  approve(id) {
    const ln = (DB.loans||[]).find(l=>l.id===id);
    if (!ln) return;
    ln.status = 'approved';
    ln.approvedDate = new Date().toISOString().split('T')[0];
    DB.save();
    if (typeof SupabaseDB !== 'undefined') SupabaseDB._enqueue('upsert','loans',ln);
    App.toast('✅ ' + t('loans.toastApproved'), 'success');
    this.render(document.getElementById('page-content'));
  },

  reject(id) {
    const ln = (DB.loans||[]).find(l=>l.id===id);
    if (!ln || !confirm(t('loans.rejectConfirm'))) return;
    ln.status = 'rejected';
    DB.save();
    if (typeof SupabaseDB !== 'undefined') SupabaseDB._enqueue('upsert','loans',ln);
    App.toast(t('loans.toastRejected'), 'info');
    this.render(document.getElementById('page-content'));
  },

  recordPayment(id) {
    const ln = (DB.loans||[]).find(l=>l.id===id);
    if (!ln) return;
    const remaining = ln.remainingAmount || 0;
    const suggested = Math.min(ln.installment||0, remaining);

    App.openModal(t('loans.recordPayment'), `
      <div style="background:var(--bg);border-radius:12px;padding:14px;margin-bottom:16px;display:grid;grid-template-columns:1fr 1fr;gap:10px">
        <div>
          <div style="font-size:11px;color:var(--text-muted);margin-bottom:2px">${t('loans.totalAmount')}</div>
          <div style="font-weight:700">${App.formatCurrency(ln.amount||0)}</div>
        </div>
        <div>
          <div style="font-size:11px;color:var(--text-muted);margin-bottom:2px">${t('loans.remaining')}</div>
          <div style="font-weight:700;color:#ef4444">${App.formatCurrency(remaining)}</div>
        </div>
      </div>
      <div class="app-form-group">
        <label>${t('loans.paymentAmount')}</label>
        <input class="app-form-input" type="number" id="pay-amt" value="${suggested}" min="1" max="${remaining}">
      </div>
      <div class="app-form-group">
        <label>${t('loans.paymentDate')}</label>
        <input class="app-form-input" type="date" id="pay-dt" value="${new Date().toISOString().split('T')[0]}">
      </div>
      <div style="display:flex;gap:10px;margin-top:8px">
        <button class="btn btn-secondary" onclick="App.closeModal()">${t('common.cancel')}</button>
        <button class="btn btn-primary" onclick="LoansModule._doPayment('${id}')">
          <i class="fas fa-money-bill-wave"></i> ${t('loans.recordPayBtn')}
        </button>
      </div>
    `);
  },

  _doPayment(id) {
    const ln  = (DB.loans||[]).find(l=>l.id===id);
    if (!ln) return;
    const amt  = parseFloat(document.getElementById('pay-amt')?.value) || 0;
    const date = document.getElementById('pay-dt')?.value || '';
    if (amt<=0) { App.toast(t('loans.invalidAmtError'),'error'); return; }
    if (!ln.payments) ln.payments = [];
    ln.payments.push({ amount: amt, date });
    ln.remainingAmount = Math.max(0, (ln.remainingAmount||0) - amt);
    if (ln.remainingAmount === 0) ln.status = 'paid';
    DB.save();
    if (typeof SupabaseDB !== 'undefined') SupabaseDB._enqueue('upsert','loans',ln);
    App.closeModal();
    App.toast(`✅ ${t('loans.toastPayment')} ${App.formatCurrency(amt)}`, 'success');
    this.render(document.getElementById('page-content'));
  },

  viewDetails(id) {
    const ln = (DB.loans||[]).find(l=>l.id===id);
    if (!ln) return;
    const emp      = DB.getEmployee(ln.empId);
    const payments = ln.payments || [];
    const paid     = payments.reduce((s,p)=>s+(p.amount||0),0);
    const pct      = ln.amount > 0 ? Math.round((paid/ln.amount)*100) : 0;

    App.openModal(`${t('loans.detailsTitle')} — ${_esc(emp?.name||'')}`, `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:20px">
        <div class="info-cell"><div class="info-label">${t('loans.employee')}</div><div class="info-val">${_esc(emp?.name||'—')}</div></div>
        <div class="info-cell"><div class="info-label">${t('loans.type')}</div><div>${LoansModule._typeBadge(ln.type)}</div></div>
        <div class="info-cell"><div class="info-label">${t('loans.totalAmount')}</div><div class="info-val" style="color:#6366f1">${App.formatCurrency(ln.amount||0)}</div></div>
        <div class="info-cell"><div class="info-label">${t('loans.amountPaid')}</div><div class="info-val" style="color:#10b981">${App.formatCurrency(paid)}</div></div>
        <div class="info-cell"><div class="info-label">${t('loans.remaining')}</div><div class="info-val" style="color:#ef4444">${App.formatCurrency(ln.remainingAmount||0)}</div></div>
        <div class="info-cell"><div class="info-label">${t('loans.monthlyInstallment')}</div><div class="info-val">${App.formatCurrency(ln.installment||0)}</div></div>
        <div class="info-cell"><div class="info-label">${t('loans.requestDate')}</div><div>${ln.requestDate||'—'}</div></div>
        <div class="info-cell"><div class="info-label">${t('loans.startMonth')}</div><div>${ln.startMonth||'—'}</div></div>
        ${ln.reason ? `<div class="info-cell" style="grid-column:1/-1"><div class="info-label">${t('loans.reason')}</div><div>${_esc(ln.reason)}</div></div>` : ''}
      </div>
      <div style="background:var(--bg);border-radius:12px;padding:14px;margin-bottom:16px">
        <div style="display:flex;justify-content:space-between;margin-bottom:8px;font-size:13px">
          <span>${t('loans.repaymentPct')}</span><span style="font-weight:700">${pct}%</span>
        </div>
        <div style="background:var(--border);border-radius:6px;height:8px">
          <div style="background:linear-gradient(90deg,#6366f1,#8b5cf6);height:8px;border-radius:6px;width:${pct}%;transition:width .4s"></div>
        </div>
      </div>
      ${payments.length > 0 ? `
        <div style="font-weight:700;margin-bottom:10px;font-size:14px">${t('loans.paymentHistory')} (${payments.length})</div>
        <div style="max-height:200px;overflow-y:auto">
          <table class="data-table" style="font-size:13px">
            <thead><tr><th>#</th><th>${t('common.date')}</th><th>${t('loans.amount')}</th></tr></thead>
            <tbody>
              ${payments.map((p,i)=>`<tr><td>${i+1}</td><td>${p.date||'—'}</td><td style="font-weight:600;color:#10b981">${App.formatCurrency(p.amount||0)}</td></tr>`).join('')}
            </tbody>
          </table>
        </div>
      ` : `<p style="text-align:center;color:var(--text-muted);padding:20px">${t('loans.noPayments')}</p>`}
      <div style="margin-top:20px;display:flex;gap:10px;justify-content:center">
        <button class="btn btn-secondary" onclick="App.closeModal()">${t('common.close')}</button>
        <button class="btn btn-outline-primary" onclick="App.closeModal(); EmployeesModule.viewEmployee('${ln.empId}')"><i class="fas fa-user"></i> ${t('loans.empFile')}</button>
        ${ln.status==='approved'?`<button class="btn btn-primary" onclick="LoansModule.recordPayment('${ln.id}')"><i class="fas fa-money-bill-wave"></i> ${t('loans.payInstallment')}</button>`:''}
      </div>
    `);
  },

  deleteLoan(id) {
    if (!confirm(t('loans.deleteConfirm'))) return;
    const idx = (DB.loans||[]).findIndex(l=>l.id===id);
    if (idx===-1) return;
    DB.loans.splice(idx,1);
    DB.save();
    if (typeof SupabaseDB !== 'undefined') SupabaseDB._enqueue('delete','loans',{id});
    App.toast(t('loans.toastDeleted'),'info');
    this.render(document.getElementById('page-content'));
  },

  // استخدامها في الرواتب — تُعيد إجمالي أقساط السلف لموظف في شهر معين
  getInstallmentFor(empId, period) {
    if (!DB.loans) return 0;
    return (DB.loans)
      .filter(l => l.empId === empId && l.status === 'approved' && (l.startMonth||'') <= period)
      .reduce((s,l) => s + Math.min(l.installment||0, l.remainingAmount||0), 0);
  },
};
