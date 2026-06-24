/* =========================================================
   ATTENDIFY PRO — وحدة السلف والقروض
   ========================================================= */

const LoansModule = {

  render(container) {
    const loans = DB.loans || [];
    const pending  = loans.filter(l => l.status === 'pending');
    const active   = loans.filter(l => l.status === 'approved');
    const paid     = loans.filter(l => l.status === 'paid');
    const activeAmt = active.reduce((s,l) => s + (l.remainingAmount||0), 0);

    container.innerHTML = `
      <div class="page-header">
        <div class="page-header-info">
          <h1 class="page-title">
            <i class="fas fa-hand-holding-dollar" style="color:#6366f1;margin-left:10px"></i>
            السلف والقروض
          </h1>
          <p class="page-subtitle">إدارة سلف وقروض الموظفين وتتبع الأقساط</p>
        </div>
        <div class="page-header-actions">
          <button class="btn btn-primary" onclick="LoansModule.openAddForm()">
            <i class="fas fa-plus"></i> إضافة سلفة / قرض
          </button>
        </div>
      </div>

      <div class="stats-grid stagger-container">
        <div class="stat-card primary stagger-item">
          <div class="stat-icon gradient-primary"><i class="fas fa-file-invoice-dollar"></i></div>
          <div class="stat-info">
            <div class="stat-value" data-count="${loans.length}">${loans.length}</div>
            <div class="stat-label">إجمالي الطلبات</div>
          </div>
        </div>
        <div class="stat-card warning stagger-item">
          <div class="stat-icon gradient-warning"><i class="fas fa-clock"></i></div>
          <div class="stat-info">
            <div class="stat-value" data-count="${pending.length}">${pending.length}</div>
            <div class="stat-label">في الانتظار</div>
          </div>
        </div>
        <div class="stat-card success stagger-item">
          <div class="stat-icon gradient-success"><i class="fas fa-check-circle"></i></div>
          <div class="stat-info">
            <div class="stat-value" data-count="${active.length}">${active.length}</div>
            <div class="stat-label">نشطة</div>
          </div>
        </div>
        <div class="stat-card danger stagger-item">
          <div class="stat-icon gradient-danger"><i class="fas fa-coins"></i></div>
          <div class="stat-info">
            <div class="stat-value">${App.formatCurrency(activeAmt)}</div>
            <div class="stat-label">إجمالي المتبقي</div>
          </div>
        </div>
      </div>

      <div class="filter-bar">
        <div class="filter-group">
          <select class="filter-select" id="ln-filter-status" onchange="LoansModule._filter()">
            <option value="">كل الحالات</option>
            <option value="pending">في الانتظار</option>
            <option value="approved">نشطة</option>
            <option value="rejected">مرفوضة</option>
            <option value="paid">مسددة</option>
          </select>
        </div>
        <div class="filter-group">
          <select class="filter-select" id="ln-filter-type" onchange="LoansModule._filter()">
            <option value="">كل الأنواع</option>
            <option value="advance">سلفة</option>
            <option value="loan">قرض</option>
          </select>
        </div>
        <div class="filter-group" style="flex:1">
          <div class="search-box">
            <i class="fas fa-search search-icon"></i>
            <input type="text" class="search-input" id="ln-search" placeholder="بحث بالاسم..." oninput="LoansModule._filter()">
          </div>
        </div>
      </div>

      <div class="data-table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>الموظف</th>
              <th>النوع</th>
              <th>المبلغ</th>
              <th>القسط الشهري</th>
              <th>المتبقي</th>
              <th>بداية الخصم</th>
              <th>الحالة</th>
              <th>إجراءات</th>
            </tr>
          </thead>
          <tbody id="loans-tbody">
            ${this._rows(loans)}
          </tbody>
        </table>
        ${loans.length === 0 ? `
          <div class="empty-state">
            <div class="empty-icon"><i class="fas fa-hand-holding-dollar"></i></div>
            <div class="empty-title">لا توجد سلف أو قروض</div>
            <p class="empty-desc">اضغط "إضافة سلفة / قرض" لإضافة طلب جديد</p>
          </div>` : ''}
      </div>
    `;
  },

  _rows(list) {
    if (!list.length) return `<tr><td colspan="8" style="text-align:center;color:var(--text-muted);padding:40px">لا توجد نتائج</td></tr>`;
    return list.map(ln => {
      const emp = DB.getEmployee(ln.empId);
      const pct = ln.amount > 0 ? Math.round(((ln.amount - (ln.remainingAmount||ln.amount)) / ln.amount) * 100) : 0;
      return `
        <tr class="stagger-item">
          <td>
            <div style="display:flex;align-items:center;gap:10px">
              <div class="emp-avatar" style="width:36px;height:36px;font-size:14px">${((emp?.name||'?').charAt(0))}</div>
              <div>
                <div style="font-weight:600;font-size:14px">${_esc(emp?.name||'—')}</div>
                <div style="color:var(--text-muted);font-size:11px">${_esc(emp?.no||'')}</div>
              </div>
            </div>
          </td>
          <td>${this._typeBadge(ln.type)}</td>
          <td style="font-weight:700">${App.formatCurrency(ln.amount||0)}</td>
          <td style="color:#6366f1;font-weight:600">${App.formatCurrency(ln.installment||0)}</td>
          <td>
            <div style="color:#ef4444;font-weight:700;margin-bottom:4px">${App.formatCurrency(ln.remainingAmount||0)}</div>
            ${ln.status==='approved' ? `<div style="background:var(--border);border-radius:4px;height:4px;width:80px"><div style="background:#6366f1;height:4px;border-radius:4px;width:${pct}%"></div></div>` : ''}
          </td>
          <td style="color:var(--text-muted)">${ln.startMonth||'—'}</td>
          <td>${this._statusBadge(ln.status)}</td>
          <td>
            <div style="display:flex;gap:6px;flex-wrap:wrap">
              ${ln.status==='pending' ? `
                <button class="btn-icon-sm" style="background:rgba(16,185,129,.12);color:#10b981" title="موافقة" onclick="LoansModule.approve('${ln.id}')"><i class="fas fa-check"></i></button>
                <button class="btn-icon-sm" style="background:rgba(239,68,68,.12);color:#ef4444" title="رفض" onclick="LoansModule.reject('${ln.id}')"><i class="fas fa-times"></i></button>
              ` : ''}
              ${ln.status==='approved' ? `
                <button class="btn-icon-sm" style="background:rgba(99,102,241,.12);color:#6366f1" title="تسجيل دفعة" onclick="LoansModule.recordPayment('${ln.id}')"><i class="fas fa-money-bill-wave"></i></button>
              ` : ''}
              <button class="btn-icon-sm" title="تفاصيل" onclick="LoansModule.viewDetails('${ln.id}')"><i class="fas fa-eye"></i></button>
              <button class="btn-icon-sm" style="background:rgba(239,68,68,.08);color:#ef4444" title="حذف" onclick="LoansModule.deleteLoan('${ln.id}')"><i class="fas fa-trash"></i></button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  },

  _statusBadge(s) {
    const m = {
      pending:  ['warning','clock','في الانتظار'],
      approved: ['success','check-circle','نشطة'],
      rejected: ['danger','times-circle','مرفوضة'],
      paid:     ['info','circle-check','مسددة'],
    };
    const [cls, icon, label] = m[s] || ['default','circle',s];
    return `<span class="badge badge-${cls}"><i class="fas fa-${icon}"></i> ${label}</span>`;
  },

  _typeBadge(t) {
    return t === 'advance'
      ? `<span class="badge badge-primary"><i class="fas fa-bolt"></i> سلفة</span>`
      : `<span class="badge" style="background:rgba(139,92,246,.12);color:#8b5cf6"><i class="fas fa-coins"></i> قرض</span>`;
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

    App.openModal('إضافة سلفة / قرض', `
      <div class="form-group">
        <label class="form-label">الموظف <span style="color:#ef4444">*</span></label>
        <select class="form-input" id="ln-emp">
          <option value="">اختر الموظف...</option>
          ${opts}
        </select>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
        <div class="form-group">
          <label class="form-label">النوع</label>
          <select class="form-input" id="ln-type">
            <option value="advance">سلفة راتب</option>
            <option value="loan">قرض</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">المبلغ الإجمالي <span style="color:#ef4444">*</span></label>
          <input class="form-input" type="number" id="ln-amount" min="1" placeholder="5000" oninput="LoansModule._calcInst()">
        </div>
        <div class="form-group">
          <label class="form-label">عدد الأقساط (أشهر)</label>
          <input class="form-input" type="number" id="ln-months" min="1" max="60" value="1" oninput="LoansModule._calcInst()">
        </div>
        <div class="form-group">
          <label class="form-label">القسط الشهري</label>
          <input class="form-input" type="text" id="ln-inst" readonly style="background:var(--bg);color:var(--text-muted)" placeholder="يُحسب تلقائياً">
        </div>
        <div class="form-group">
          <label class="form-label">تاريخ الطلب</label>
          <input class="form-input" type="date" id="ln-date" value="${new Date().toISOString().split('T')[0]}">
        </div>
        <div class="form-group">
          <label class="form-label">بداية الخصم من الراتب</label>
          <input class="form-input" type="month" id="ln-start" value="${new Date().toISOString().slice(0,7)}">
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">سبب الطلب</label>
        <textarea class="form-input" id="ln-reason" rows="2" placeholder="سبب السلفة أو القرض..."></textarea>
      </div>
      <div style="display:flex;gap:10px;margin-top:20px">
        <button class="btn btn-secondary" onclick="App.closeModal()">إلغاء</button>
        <button class="btn btn-primary" onclick="LoansModule.save()">
          <i class="fas fa-save"></i> حفظ
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

    if (!empId)    { App.toast('اختر الموظف', 'error'); return; }
    if (amount<=0) { App.toast('أدخل مبلغاً صحيحاً', 'error'); return; }

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
    DB.logAudit('admin', `إضافة ${type==='advance'?'سلفة':'قرض'} — ${emp?.name||''} — ${App.formatCurrency(amount)}`, 'Loans');
    App.toast('✅ تم إضافة الطلب بنجاح', 'success');
    this.render(document.getElementById('main-content'));
  },

  approve(id) {
    const ln = (DB.loans||[]).find(l=>l.id===id);
    if (!ln) return;
    ln.status = 'approved';
    ln.approvedDate = new Date().toISOString().split('T')[0];
    DB.save();
    if (typeof SupabaseDB !== 'undefined') SupabaseDB._enqueue('upsert','loans',ln);
    App.toast('✅ تمت الموافقة على الطلب', 'success');
    this.render(document.getElementById('main-content'));
  },

  reject(id) {
    const ln = (DB.loans||[]).find(l=>l.id===id);
    if (!ln || !confirm('هل أنت متأكد من رفض هذا الطلب؟')) return;
    ln.status = 'rejected';
    DB.save();
    if (typeof SupabaseDB !== 'undefined') SupabaseDB._enqueue('upsert','loans',ln);
    App.toast('تم رفض الطلب', 'info');
    this.render(document.getElementById('main-content'));
  },

  recordPayment(id) {
    const ln = (DB.loans||[]).find(l=>l.id===id);
    if (!ln) return;
    const remaining = ln.remainingAmount || 0;
    const suggested = Math.min(ln.installment||0, remaining);

    App.openModal('تسجيل دفعة', `
      <div style="background:var(--bg);border-radius:12px;padding:14px;margin-bottom:16px;display:grid;grid-template-columns:1fr 1fr;gap:10px">
        <div>
          <div style="font-size:11px;color:var(--text-muted);margin-bottom:2px">المبلغ الإجمالي</div>
          <div style="font-weight:700">${App.formatCurrency(ln.amount||0)}</div>
        </div>
        <div>
          <div style="font-size:11px;color:var(--text-muted);margin-bottom:2px">المتبقي</div>
          <div style="font-weight:700;color:#ef4444">${App.formatCurrency(remaining)}</div>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">مبلغ الدفعة</label>
        <input class="form-input" type="number" id="pay-amt" value="${suggested}" min="1" max="${remaining}">
      </div>
      <div class="form-group">
        <label class="form-label">تاريخ الدفع</label>
        <input class="form-input" type="date" id="pay-dt" value="${new Date().toISOString().split('T')[0]}">
      </div>
      <div style="display:flex;gap:10px;margin-top:20px">
        <button class="btn btn-secondary" onclick="App.closeModal()">إلغاء</button>
        <button class="btn btn-primary" onclick="LoansModule._doPayment('${id}')">
          <i class="fas fa-money-bill-wave"></i> تسجيل الدفعة
        </button>
      </div>
    `);
  },

  _doPayment(id) {
    const ln  = (DB.loans||[]).find(l=>l.id===id);
    if (!ln) return;
    const amt  = parseFloat(document.getElementById('pay-amt')?.value) || 0;
    const date = document.getElementById('pay-dt')?.value || '';
    if (amt<=0) { App.toast('أدخل مبلغاً صحيحاً','error'); return; }
    if (!ln.payments) ln.payments = [];
    ln.payments.push({ amount: amt, date });
    ln.remainingAmount = Math.max(0, (ln.remainingAmount||0) - amt);
    if (ln.remainingAmount === 0) ln.status = 'paid';
    DB.save();
    if (typeof SupabaseDB !== 'undefined') SupabaseDB._enqueue('upsert','loans',ln);
    App.closeModal();
    App.toast(`✅ تم تسجيل دفعة ${App.formatCurrency(amt)}`, 'success');
    this.render(document.getElementById('main-content'));
  },

  viewDetails(id) {
    const ln = (DB.loans||[]).find(l=>l.id===id);
    if (!ln) return;
    const emp      = DB.getEmployee(ln.empId);
    const payments = ln.payments || [];
    const paid     = payments.reduce((s,p)=>s+(p.amount||0),0);
    const pct      = ln.amount > 0 ? Math.round((paid/ln.amount)*100) : 0;

    App.openModal(`تفاصيل — ${_esc(emp?.name||'')}`, `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:20px">
        <div class="info-cell"><div class="info-label">الموظف</div><div class="info-val">${_esc(emp?.name||'—')}</div></div>
        <div class="info-cell"><div class="info-label">النوع</div><div>${LoansModule._typeBadge(ln.type)}</div></div>
        <div class="info-cell"><div class="info-label">المبلغ الإجمالي</div><div class="info-val" style="color:#6366f1">${App.formatCurrency(ln.amount||0)}</div></div>
        <div class="info-cell"><div class="info-label">المسدد</div><div class="info-val" style="color:#10b981">${App.formatCurrency(paid)}</div></div>
        <div class="info-cell"><div class="info-label">المتبقي</div><div class="info-val" style="color:#ef4444">${App.formatCurrency(ln.remainingAmount||0)}</div></div>
        <div class="info-cell"><div class="info-label">القسط الشهري</div><div class="info-val">${App.formatCurrency(ln.installment||0)}</div></div>
        <div class="info-cell"><div class="info-label">تاريخ الطلب</div><div>${ln.requestDate||'—'}</div></div>
        <div class="info-cell"><div class="info-label">بداية الخصم</div><div>${ln.startMonth||'—'}</div></div>
        ${ln.reason ? `<div class="info-cell" style="grid-column:1/-1"><div class="info-label">السبب</div><div>${_esc(ln.reason)}</div></div>` : ''}
      </div>
      <div style="background:var(--bg);border-radius:12px;padding:14px;margin-bottom:16px">
        <div style="display:flex;justify-content:space-between;margin-bottom:8px;font-size:13px">
          <span>نسبة السداد</span><span style="font-weight:700">${pct}%</span>
        </div>
        <div style="background:var(--border);border-radius:6px;height:8px">
          <div style="background:linear-gradient(90deg,#6366f1,#8b5cf6);height:8px;border-radius:6px;width:${pct}%;transition:width .4s"></div>
        </div>
      </div>
      ${payments.length > 0 ? `
        <div style="font-weight:700;margin-bottom:10px;font-size:14px">سجل الدفعات (${payments.length})</div>
        <div style="max-height:200px;overflow-y:auto">
          <table class="data-table" style="font-size:13px">
            <thead><tr><th>#</th><th>التاريخ</th><th>المبلغ</th></tr></thead>
            <tbody>
              ${payments.map((p,i)=>`<tr><td>${i+1}</td><td>${p.date||'—'}</td><td style="font-weight:600;color:#10b981">${App.formatCurrency(p.amount||0)}</td></tr>`).join('')}
            </tbody>
          </table>
        </div>
      ` : `<p style="text-align:center;color:var(--text-muted);padding:20px">لا توجد دفعات مسجلة بعد</p>`}
      <div style="margin-top:20px;display:flex;gap:10px;justify-content:center">
        <button class="btn btn-secondary" onclick="App.closeModal()">إغلاق</button>
        <button class="btn btn-outline-primary" onclick="App.closeModal(); EmployeesModule.viewEmployee('${ln.empId}')"><i class="fas fa-user"></i> ملف الموظف</button>
        ${ln.status==='approved'?`<button class="btn btn-primary" onclick="LoansModule.recordPayment('${ln.id}')"><i class="fas fa-money-bill-wave"></i> دفعة</button>`:''}
      </div>
    `);
  },

  deleteLoan(id) {
    if (!confirm('هل أنت متأكد من حذف هذا السجل؟')) return;
    const idx = (DB.loans||[]).findIndex(l=>l.id===id);
    if (idx===-1) return;
    DB.loans.splice(idx,1);
    DB.save();
    if (typeof SupabaseDB !== 'undefined') SupabaseDB._enqueue('delete','loans',{id});
    App.toast('تم الحذف','info');
    this.render(document.getElementById('main-content'));
  },

  // استخدامها في الرواتب — تُعيد إجمالي أقساط السلف لموظف في شهر معين
  getInstallmentFor(empId, period) {
    if (!DB.loans) return 0;
    return (DB.loans)
      .filter(l => l.empId === empId && l.status === 'approved' && (l.startMonth||'') <= period)
      .reduce((s,l) => s + Math.min(l.installment||0, l.remainingAmount||0), 0);
  },
};
