/* =========================================================
   DEDUCTIONS MODULE — Loans · Fines · Advances · Custom
   ========================================================= */

const DeductionsModule = {

  _types: {
    loan:      { label: 'قرض',           icon: 'fas fa-hand-holding-dollar', color: '#6366f1' },
    advance:   { label: 'سلفة',          icon: 'fas fa-money-bill-transfer',  color: '#f59e0b' },
    fine:      { label: 'غرامة',         icon: 'fas fa-gavel',               color: '#ef4444' },
    admin:     { label: 'جزاء إداري',    icon: 'fas fa-triangle-exclamation', color: '#dc2626' },
    custody:   { label: 'عهدة',          icon: 'fas fa-box-archive',          color: '#0891b2' },
    insurance: { label: 'تأمين',         icon: 'fas fa-shield-halved',       color: '#10b981' },
    tax:       { label: 'ضريبة',         icon: 'fas fa-receipt',             color: '#8b5cf6' },
    other:     { label: 'أخرى',          icon: 'fas fa-circle-minus',        color: '#64748b' },
  },

  render(container) {
    const totalAmount    = DB.deductions.reduce((s, d) => s + (d.amount || 0), 0);
    const pendingAmount  = DB.deductions.filter(d => d.status === 'pending').reduce((s, d) => s + (d.amount || 0), 0);
    const appliedAmount  = DB.deductions.filter(d => d.status === 'applied').reduce((s, d) => s + (d.amount || 0), 0);

    container.innerHTML = `
      <div class="page-header">
        <div class="page-header-text">
          <h1><i class="fas fa-circle-minus" style="color:var(--danger);font-size:22px"></i> الخصومات</h1>
          <p>إدارة القروض والسلف والغرامات والخصومات المخصصة</p>
        </div>
        <div class="page-header-actions">
          <button class="btn btn-primary" onclick="DeductionsModule.openAdd()">
            <i class="fas fa-plus"></i> إضافة خصم
          </button>
        </div>
      </div>

      <!-- Summary Cards -->
      <div class="stat-cards" style="margin-bottom:24px">
        <div class="stat-card primary stagger-item">
          <div class="stat-icon gradient-primary"><i class="fas fa-list"></i></div>
          <div class="stat-info">
            <div class="stat-value">${DB.deductions.length}</div>
            <div class="stat-label">إجمالي السجلات</div>
          </div>
        </div>
        <div class="stat-card warning stagger-item">
          <div class="stat-icon gradient-warning"><i class="fas fa-clock"></i></div>
          <div class="stat-info">
            <div class="stat-value">${App.formatCurrency(pendingAmount)}</div>
            <div class="stat-label">معلقة (لم تُطبق)</div>
          </div>
        </div>
        <div class="stat-card danger stagger-item">
          <div class="stat-icon gradient-danger"><i class="fas fa-circle-minus"></i></div>
          <div class="stat-info">
            <div class="stat-value">${App.formatCurrency(appliedAmount)}</div>
            <div class="stat-label">مطبقة على الراتب</div>
          </div>
        </div>
        <div class="stat-card success stagger-item">
          <div class="stat-icon gradient-success"><i class="fas fa-calculator"></i></div>
          <div class="stat-info">
            <div class="stat-value">${App.formatCurrency(totalAmount)}</div>
            <div class="stat-label">الإجمالي الكلي</div>
          </div>
        </div>
      </div>

      <!-- Filter by type -->
      <div class="card" style="margin-bottom:16px">
        <div class="card-body" style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">
          <span style="font-size:13px;font-weight:700;color:var(--text-muted)">نوع الخصم:</span>
          <button class="btn btn-primary btn-sm" onclick="DeductionsModule._filter('all', this)">الكل</button>
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
        <div class="empty-title">لا توجد خصومات</div>
        <p class="empty-desc">اضغط "إضافة خصم" لإضافة خصم جديد</p>
      </div>`;

    return `
      <div class="table-wrapper" style="border:none;border-radius:0">
        <table class="data-table">
          <thead>
            <tr>
              <th>الموظف</th>
              <th>نوع الخصم</th>
              <th>السبب</th>
              <th>المبلغ</th>
              <th>شهر التطبيق</th>
              <th>الحالة</th>
              <th>الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            ${rows.map(d => {
              const emp  = DB.getEmployee(d.empId);
              const type = this._types[d.type] || this._types.other;
              const statusMap = {
                pending: { label: 'معلق',   cls: 'badge-warning' },
                applied: { label: 'مطبق',   cls: 'badge-danger'  },
                paid:    { label: 'مسدد',   cls: 'badge-success' },
              };
              const st = statusMap[d.status] || statusMap.pending;
              return `
                <tr class="stagger-item">
                  <td>
                    <div class="table-avatar">
                      <div class="avatar ${emp?.avatarColor||'gradient-primary'}" style="width:30px;height:30px;font-size:11px">${emp?.avatar||'?'}</div>
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
                        <button class="btn btn-sm btn-danger" onclick="DeductionsModule.apply('${d.id}')" title="تطبيق على الراتب">
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
    App.openModal(isEdit ? 'تعديل الخصم' : 'إضافة خصم جديد', `
      <form onsubmit="DeductionsModule.save(event, '${ded?.id||''}')">
        <div class="app-form-row">
          <div class="app-form-group">
            <label>الموظف <span style="color:var(--danger)">*</span></label>
            <select class="app-form-input app-form-select" name="empId" required>
              <option value="">— اختر موظفاً —</option>
              ${DB.employees.filter(e=>e.status!=='terminated').map(e =>
                `<option value="${e.id}" ${(ded?.empId||preEmpId)===e.id?'selected':''}>${e.name} (#${e.no})</option>`
              ).join('')}
            </select>
          </div>
          <div class="app-form-group">
            <label>نوع الخصم <span style="color:var(--danger)">*</span></label>
            <select class="app-form-input app-form-select" name="type" required>
              ${Object.entries(this._types).map(([k,v]) =>
                `<option value="${k}" ${ded?.type===k?'selected':''}>${v.label}</option>`
              ).join('')}
            </select>
          </div>
        </div>
        <div class="app-form-row">
          <div class="app-form-group">
            <label>المبلغ <span style="color:var(--danger)">*</span></label>
            <input class="app-form-input" type="number" name="amount" min="1" step="0.01"
              value="${ded?.amount||''}" placeholder="0.00" required>
          </div>
          <div class="app-form-group">
            <label>شهر التطبيق <span style="color:var(--danger)">*</span></label>
            <input class="app-form-input" type="month" name="period" value="${ded?.period||curMonth}" required>
          </div>
        </div>
        <div class="app-form-group">
          <label>السبب / الملاحظة</label>
          <textarea class="app-form-input" name="reason" rows="2" placeholder="وصف مختصر...">${_esc(ded?.reason||'')}</textarea>
        </div>
        <div class="app-form-group">
          <label>الحالة</label>
          <select class="app-form-input app-form-select" name="status">
            <option value="pending" ${(!ded||ded.status==='pending')?'selected':''}>معلق (يُطبق عند تشغيل الرواتب)</option>
            <option value="applied" ${ded?.status==='applied'?'selected':''}>مطبق على الراتب</option>
            <option value="paid"    ${ded?.status==='paid'?'selected':''}>مسدد</option>
          </select>
        </div>
        <div class="modal-footer" style="padding:0;margin-top:20px">
          <button type="button" class="btn btn-secondary" onclick="App.closeModal()">إلغاء</button>
          <button type="submit" class="btn btn-primary"><i class="fas fa-save"></i> ${isEdit?'حفظ التعديلات':'إضافة الخصم'}</button>
        </div>
      </form>
    `);
  },

  save(e, id) {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target));
    if (!data.empId) { App.toast('يرجى اختيار الموظف', 'error'); return; }

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
        status: data.status || 'pending',
        createdAt: new Date().toISOString(),
      });
    }
    DB.save();
    App.closeModal();
    App.toast(id ? 'تم تحديث الخصم ✓' : 'تم إضافة الخصم ✓', 'success');
    this.render(document.getElementById('page-content'));
  },

  apply(id) {
    App.confirm('هل تريد تطبيق هذا الخصم على الراتب؟', () => {
      const d = DB.deductions.find(d => d.id === id);
      if (!d) return;
      d.status = 'applied';
      DB.save();
      App.toast('تم تطبيق الخصم ✓', 'success');
      this.render(document.getElementById('page-content'));
    });
  },

  delete(id) {
    App.confirm('هل تريد حذف هذا الخصم نهائياً؟', () => {
      const i = DB.deductions.findIndex(d => d.id === id);
      if (i !== -1) DB.deductions.splice(i, 1);
      DB.save();
      App.toast('تم حذف الخصم', 'info');
      this.render(document.getElementById('page-content'));
    });
  },

  // Returns total custom deductions for an employee in a given period
  getTotal(empId, period) {
    return DB.deductions
      .filter(d => d.empId === empId && d.period === period && d.status === 'applied')
      .reduce((s, d) => s + (d.amount || 0), 0);
  },
};
