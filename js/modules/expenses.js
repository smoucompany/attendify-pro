/* =========================================================
   EXPENSES MODULE — إدارة المصروفات
   ========================================================= */

const ExpensesModule = {

  _filter: { status: 'all', empId: '', category: '' },
  _page: 1,
  _perPage: 15,

  _cats() {
    const isAr = currentLang === 'ar';
    return [
      { id: 'travel',        icon: 'fas fa-plane',         color:'#6366f1', ar: 'سفر',       en: 'Travel'        },
      { id: 'meals',         icon: 'fas fa-utensils',       color:'#f59e0b', ar: 'وجبات',     en: 'Meals'         },
      { id: 'accommodation', icon: 'fas fa-hotel',          color:'#3b82f6', ar: 'إقامة',     en: 'Accommodation' },
      { id: 'transport',     icon: 'fas fa-car',            color:'#10b981', ar: 'مواصلات',   en: 'Transport'     },
      { id: 'communication', icon: 'fas fa-phone',          color:'#8b5cf6', ar: 'اتصالات',   en: 'Communication' },
      { id: 'supplies',      icon: 'fas fa-box',            color:'#ec4899', ar: 'مستلزمات',  en: 'Supplies'      },
      { id: 'other',         icon: 'fas fa-receipt',        color:'#94a3b8', ar: 'أخرى',      en: 'Other'         },
    ];
  },

  _catLabel(id) {
    const isAr = currentLang === 'ar';
    const c = this._cats().find(x => x.id === id);
    return c ? (isAr ? c.ar : c.en) : id;
  },

  _catIcon(id) {
    const c = this._cats().find(x => x.id === id);
    return c ? c.icon : 'fas fa-receipt';
  },

  _catColor(id) {
    const c = this._cats().find(x => x.id === id);
    return c ? c.color : '#94a3b8';
  },

  render(container) {
    if (!DB.expenses) DB.expenses = [];
    const isAr = currentLang === 'ar';

    const allExp   = DB.expenses;
    const pending  = allExp.filter(e => e.status === 'pending');
    const approved = allExp.filter(e => e.status === 'approved');
    const rejected = allExp.filter(e => e.status === 'rejected');
    const totalAmt = approved.reduce((s, e) => s + (Number(e.amount)||0), 0);
    const currency = DB.company.currency || 'SAR';

    // Category breakdown (top 4)
    const catTotals = {};
    approved.forEach(e => {
      catTotals[e.category] = (catTotals[e.category]||0) + (Number(e.amount)||0);
    });
    const topCats = Object.entries(catTotals)
      .sort((a,b) => b[1]-a[1])
      .slice(0, 4);

    container.innerHTML = `
      <div class="page-header">
        <div class="page-header-text">
          <h1 style="display:flex;align-items:center;gap:10px">
            <span style="width:38px;height:38px;border-radius:12px;background:linear-gradient(135deg,#ec4899,#f43f5e);
              display:inline-flex;align-items:center;justify-content:center;color:#fff;font-size:18px;flex-shrink:0">
              <i class="fas fa-receipt"></i>
            </span>
            ${t('expenses.title')}
          </h1>
          <p>${t('expenses.subtitle')}</p>
        </div>
        <div class="page-header-actions">
          <button class="btn btn-primary" onclick="ExpensesModule.openAdd()">
            <i class="fas fa-plus"></i> ${t('expenses.addExpense')}
          </button>
        </div>
      </div>

      <!-- Stats -->
      <div class="orgchart-stats" style="grid-template-columns:repeat(auto-fill,minmax(200px,1fr));margin-bottom:20px">
        <div class="orgchart-stat-card" style="color:#ec4899">
          <div class="orgchart-stat-icon" style="background:#ec489915;color:#ec4899">
            <i class="fas fa-receipt"></i>
          </div>
          <div>
            <div class="orgchart-stat-val">${allExp.length}</div>
            <div class="orgchart-stat-lbl">${isAr?'إجمالي المصروفات':'Total Expenses'}</div>
          </div>
        </div>
        <div class="orgchart-stat-card" style="color:#f59e0b;cursor:pointer"
          onclick="ExpensesModule._filter.status='pending';ExpensesModule._page=1;ExpensesModule._renderTable()">
          <div class="orgchart-stat-icon" style="background:#f59e0b15;color:#f59e0b">
            <i class="fas fa-hourglass-half"></i>
          </div>
          <div>
            <div class="orgchart-stat-val">${pending.length}</div>
            <div class="orgchart-stat-lbl">${t('expenses.pending')}</div>
          </div>
        </div>
        <div class="orgchart-stat-card" style="color:#10b981;cursor:pointer"
          onclick="ExpensesModule._filter.status='approved';ExpensesModule._page=1;ExpensesModule._renderTable()">
          <div class="orgchart-stat-icon" style="background:#10b98115;color:#10b981">
            <i class="fas fa-check-circle"></i>
          </div>
          <div>
            <div class="orgchart-stat-val">${approved.length}</div>
            <div class="orgchart-stat-lbl">${t('expenses.approved')}</div>
          </div>
        </div>
        <div class="orgchart-stat-card" style="color:#6366f1">
          <div class="orgchart-stat-icon" style="background:#6366f115;color:#6366f1">
            <i class="fas fa-coins"></i>
          </div>
          <div>
            <div class="orgchart-stat-val" style="font-size:16px">${this._fmt(totalAmt)} ${currency}</div>
            <div class="orgchart-stat-lbl">${t('expenses.totalAmount')}</div>
          </div>
        </div>
      </div>

      <!-- Category Breakdown -->
      ${topCats.length > 0 ? `
      <div class="card" style="padding:18px 22px;margin-bottom:20px">
        <div style="font-size:13px;font-weight:700;color:var(--text-secondary);margin-bottom:14px">
          <i class="fas fa-chart-bar" style="color:#ec4899;margin-${isAr?'left':'right'}:6px"></i>
          ${isAr?'أعلى الفئات إنفاقاً (المعتمد)':'Top Spending Categories (Approved)'}
        </div>
        <div style="display:grid;gap:10px">
          ${topCats.map(([catId, amt]) => {
            const pct = totalAmt > 0 ? Math.round(amt/totalAmt*100) : 0;
            const cc  = this._catColor(catId);
            return `
              <div style="display:flex;align-items:center;gap:12px">
                <div style="width:30px;height:30px;border-radius:8px;background:${cc}18;
                  display:flex;align-items:center;justify-content:center;flex-shrink:0">
                  <i class="${this._catIcon(catId)}" style="color:${cc};font-size:12px"></i>
                </div>
                <div style="flex:1;min-width:0">
                  <div style="display:flex;justify-content:space-between;margin-bottom:4px">
                    <span style="font-size:12px;font-weight:600;color:var(--text-primary)">${_esc(this._catLabel(catId))}</span>
                    <span style="font-size:12px;font-weight:700;color:${cc}">${this._fmt(amt)} ${currency} (${pct}%)</span>
                  </div>
                  <div style="background:var(--border);border-radius:4px;height:6px;overflow:hidden">
                    <div style="background:${cc};height:6px;border-radius:4px;width:${pct}%"></div>
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
      ` : ''}

      <!-- Filters -->
      <div class="toolbar">
        <select class="toolbar-select" id="exp-filter-status"
          onchange="ExpensesModule._filter.status=this.value;ExpensesModule._page=1;ExpensesModule._renderTable()">
          <option value="all">${t('common.all')}</option>
          <option value="pending">${t('expenses.pending')}</option>
          <option value="approved">${t('expenses.approved')}</option>
          <option value="rejected">${t('expenses.rejected')}</option>
        </select>
        <select class="toolbar-select" id="exp-filter-emp"
          onchange="ExpensesModule._filter.empId=this.value;ExpensesModule._page=1;ExpensesModule._renderTable()">
          <option value="">${t('expenses.allEmployees')}</option>
          ${DB.employees.filter(e=>e.status!=='inactive').map(e=>`<option value="${e.id}">${_esc(e.name)}</option>`).join('')}
        </select>
        <select class="toolbar-select" id="exp-filter-cat"
          onchange="ExpensesModule._filter.category=this.value;ExpensesModule._page=1;ExpensesModule._renderTable()">
          <option value="">${t('expenses.allCategories')}</option>
          ${this._cats().map(c=>`<option value="${c.id}">${currentLang==='ar'?c.ar:c.en}</option>`).join('')}
        </select>
        <div class="toolbar-separator"></div>
        <button class="btn btn-secondary"
          onclick="ExpensesModule._filter={status:'all',empId:'',category:''};ExpensesModule._page=1;ExpensesModule._renderTable();ExpensesModule._restoreFilters()">
          <i class="fas fa-rotate-left"></i>
        </button>
      </div>

      <!-- Table -->
      <div id="exp-table-wrap"></div>
    `;

    this._restoreFilters();
    this._renderTable();
  },

  _restoreFilters() {
    const fs = document.getElementById('exp-filter-status');
    const fe = document.getElementById('exp-filter-emp');
    const fc = document.getElementById('exp-filter-cat');
    if (fs) fs.value = this._filter.status;
    if (fe) fe.value = this._filter.empId;
    if (fc) fc.value = this._filter.category;
  },

  _getFiltered() {
    if (!DB.expenses) return [];
    let list = [...DB.expenses];
    if (this._filter.status !== 'all') list = list.filter(e => e.status === this._filter.status);
    if (this._filter.empId) list = list.filter(e => e.empId === this._filter.empId);
    if (this._filter.category) list = list.filter(e => e.category === this._filter.category);
    return list.sort((a,b) => new Date(b.createdAt||b.date) - new Date(a.createdAt||a.date));
  },

  _renderTable() {
    const wrap = document.getElementById('exp-table-wrap');
    if (!wrap) return;
    const isAr    = currentLang === 'ar';
    const list    = this._getFiltered();
    const start   = (this._page - 1) * this._perPage;
    const page    = list.slice(start, start + this._perPage);
    const currency = DB.company.currency || 'SAR';

    if (list.length === 0) {
      wrap.innerHTML = `<div class="empty-state">
        <div class="empty-icon"><i class="fas fa-receipt"></i></div>
        <div class="empty-title">${t('expenses.noExpenses')}</div>
        <p class="empty-desc">${t('expenses.noExpensesDesc')}</p>
        <button class="btn btn-primary" style="margin-top:16px" onclick="ExpensesModule.openAdd()">
          <i class="fas fa-plus"></i> ${t('expenses.addExpense')}
        </button>
      </div>`;
      return;
    }

    const statusMeta = {
      pending:  { color:'#f59e0b', icon:'fas fa-hourglass-half',  label: t('expenses.pending')  },
      approved: { color:'#10b981', icon:'fas fa-check-circle',     label: t('expenses.approved') },
      rejected: { color:'#ef4444', icon:'fas fa-times-circle',     label: t('expenses.rejected') },
    };

    wrap.innerHTML = `
      <div class="data-table-wrap" style="padding:0">
        <table class="data-table">
          <thead>
            <tr>
              <th>${t('expenses.colEmployee')}</th>
              <th>${t('expenses.colCategory')}</th>
              <th>${t('expenses.colDescription')}</th>
              <th>${t('expenses.colDate')}</th>
              <th>${t('expenses.colAmount')}</th>
              <th>${t('expenses.colStatus')}</th>
              <th>${t('common.actions')}</th>
            </tr>
          </thead>
          <tbody>
            ${page.map(ex => {
              const emp  = DB.employees.find(e => e.id === ex.empId);
              const sm   = statusMeta[ex.status] || { color:'#94a3b8', icon:'fas fa-circle', label: ex.status };
              const cc   = this._catColor(ex.category);

              return `
                <tr class="stagger-item" style="border-${isAr?'right':'left'}:3px solid ${sm.color}">
                  <td>
                    <div style="display:flex;align-items:center;gap:8px">
                      <div style="width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,#6366f1,#818cf8);
                        display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:#fff;flex-shrink:0">
                        ${emp ? _esc(emp.name.charAt(0)) : '?'}
                      </div>
                      <div style="font-size:13px;font-weight:600;color:var(--text-primary)">${emp ? _esc(emp.name) : '—'}</div>
                    </div>
                  </td>
                  <td>
                    <div style="display:flex;align-items:center;gap:7px">
                      <div style="width:26px;height:26px;border-radius:7px;background:${cc}18;
                        display:flex;align-items:center;justify-content:center;flex-shrink:0">
                        <i class="${this._catIcon(ex.category)}" style="color:${cc};font-size:11px"></i>
                      </div>
                      <span style="font-size:13px;color:var(--text-primary);font-weight:500">
                        ${_esc(this._catLabel(ex.category))}
                      </span>
                    </div>
                  </td>
                  <td style="font-size:13px;color:var(--text-secondary);max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
                    ${_esc(ex.description||'—')}
                  </td>
                  <td style="font-size:13px;color:var(--text-muted);white-space:nowrap">${ex.date||'—'}</td>
                  <td>
                    <div style="font-size:15px;font-weight:800;color:var(--text-primary)">${this._fmt(ex.amount)}</div>
                    <div style="font-size:10px;color:var(--text-muted)">${currency}</div>
                  </td>
                  <td>
                    <span style="display:inline-flex;align-items:center;gap:5px;padding:4px 10px;
                      border-radius:20px;font-size:11px;font-weight:600;
                      background:${sm.color}18;color:${sm.color};border:1px solid ${sm.color}30">
                      <i class="${sm.icon}" style="font-size:10px"></i>
                      ${sm.label}
                    </span>
                  </td>
                  <td>
                    <div style="display:flex;gap:5px;align-items:center">
                      ${ex.status === 'pending' ? `
                        <button class="btn btn-icon btn-sm" style="background:rgba(16,185,129,.12);color:#10b981;border-radius:8px"
                          title="${t('expenses.approve')}" onclick="ExpensesModule.approve('${ex.id}')">
                          <i class="fas fa-check"></i>
                        </button>
                        <button class="btn btn-icon btn-sm" style="background:rgba(239,68,68,.12);color:#ef4444;border-radius:8px"
                          title="${t('expenses.reject')}" onclick="ExpensesModule.reject('${ex.id}')">
                          <i class="fas fa-times"></i>
                        </button>
                      ` : ''}
                      <button class="btn btn-icon btn-sm" style="border-radius:8px"
                        title="${t('common.edit')}" onclick="ExpensesModule.openEdit('${ex.id}')">
                        <i class="fas fa-pencil"></i>
                      </button>
                      <button class="btn btn-icon btn-sm" style="background:rgba(239,68,68,.08);color:#ef4444;border-radius:8px"
                        title="${t('common.delete')}" onclick="ExpensesModule.deleteExpense('${ex.id}')">
                        <i class="fas fa-trash"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
        ${list.length > this._perPage ? `
          <div style="display:flex;justify-content:center;align-items:center;gap:12px;
            padding:14px 16px;border-top:1px solid var(--border);background:var(--bg-secondary)">
            <button class="btn btn-secondary" ${this._page===1?'disabled':''}
              onclick="ExpensesModule._page--;ExpensesModule._renderTable()">
              <i class="fas fa-chevron-${isAr?'right':'left'}"></i>
            </button>
            <span style="font-size:13px;color:var(--text-muted)">
              ${this._page} / ${Math.ceil(list.length/this._perPage)}
              <span style="color:var(--text-muted);font-size:11px">(${list.length})</span>
            </span>
            <button class="btn btn-secondary" ${this._page>=Math.ceil(list.length/this._perPage)?'disabled':''}
              onclick="ExpensesModule._page++;ExpensesModule._renderTable()">
              <i class="fas fa-chevron-${isAr?'left':'right'}"></i>
            </button>
          </div>
        ` : ''}
      </div>
    `;
  },

  openAdd() {
    this._openModal(null);
  },

  openEdit(id) {
    if (!DB.expenses) return;
    const ex = DB.expenses.find(x => x.id === id);
    if (ex) this._openModal(ex);
  },

  _openModal(ex) {
    const isAr  = currentLang === 'ar';
    const isEdit = !!ex;
    const currency = DB.company.currency || 'SAR';

    const body = `
      <div class="app-form-group">
        <label>${t('expenses.colEmployee')} <span style="color:#ef4444">*</span></label>
        <select class="app-form-input app-form-select" id="exp-emp" required>
          <option value="">${t('expenses.selectEmployee')}</option>
          ${DB.employees.filter(e=>e.status!=='inactive').map(e=>`<option value="${e.id}" ${isEdit&&ex.empId===e.id?'selected':''}>${_esc(e.name)}</option>`).join('')}
        </select>
      </div>
      <div class="app-form-group">
        <label>${t('expenses.colCategory')} <span style="color:#ef4444">*</span></label>
        <select class="app-form-input app-form-select" id="exp-cat" required>
          <option value="">${t('expenses.selectCategory')}</option>
          ${this._cats().map(c=>`<option value="${c.id}" ${isEdit&&ex.category===c.id?'selected':''}>${isAr?c.ar:c.en}</option>`).join('')}
        </select>
      </div>
      <div class="app-form-row">
        <div class="app-form-group">
          <label>${t('expenses.colAmount')} (${currency}) <span style="color:#ef4444">*</span></label>
          <input type="number" class="app-form-input" id="exp-amount" min="0" step="0.01" value="${isEdit?ex.amount:''}" required>
        </div>
        <div class="app-form-group">
          <label>${t('expenses.colDate')} <span style="color:#ef4444">*</span></label>
          <input type="date" class="app-form-input" id="exp-date" value="${isEdit?ex.date:new Date().toISOString().slice(0,10)}" required>
        </div>
      </div>
      <div class="app-form-group">
        <label>${t('expenses.colDescription')}</label>
        <textarea class="app-form-input" id="exp-desc" rows="3" style="resize:vertical">${isEdit?_esc(ex.description||''):''}</textarea>
      </div>
      <div class="app-form-group">
        <label>${t('expenses.receipt')}</label>
        <input type="text" class="app-form-input" id="exp-receipt" value="${isEdit?_esc(ex.attachmentNote||''):''}" placeholder="${t('expenses.receiptPlaceholder')}">
      </div>
      <div class="modal-footer" style="padding:0;margin-top:8px">
        <button class="btn btn-secondary" onclick="App.closeModal()">${t('common.cancel')}</button>
        <button class="btn btn-primary" onclick="ExpensesModule._save(${isEdit?`'${ex.id}'`:'null'})">
          <i class="fas fa-save"></i> ${t('common.save')}
        </button>
      </div>
    `;

    App.openModal(
      isEdit ? t('expenses.editExpense') : t('expenses.addExpense'),
      body
    );
  },

  _save(id) {
    const empId   = document.getElementById('exp-emp')?.value?.trim();
    const cat     = document.getElementById('exp-cat')?.value?.trim();
    const amount  = parseFloat(document.getElementById('exp-amount')?.value||'0');
    const date    = document.getElementById('exp-date')?.value?.trim();
    const desc    = document.getElementById('exp-desc')?.value?.trim();
    const receipt = document.getElementById('exp-receipt')?.value?.trim();
    const isAr    = currentLang === 'ar';

    if (!empId) { App.toast(isAr?'اختر موظفاً':'Select an employee','error'); return; }
    if (!cat)   { App.toast(isAr?'اختر فئة المصروف':'Select a category','error'); return; }
    if (!amount || amount <= 0) { App.toast(isAr?'أدخل مبلغاً صحيحاً':'Enter a valid amount','error'); return; }
    if (!date)  { App.toast(isAr?'اختر تاريخاً':'Select a date','error'); return; }

    if (!DB.expenses) DB.expenses = [];

    if (id) {
      const idx = DB.expenses.findIndex(x => x.id === id);
      if (idx === -1) return;
      DB.expenses[idx] = { ...DB.expenses[idx], empId, category: cat, amount, date, description: desc, attachmentNote: receipt };
      App.toast(isAr?'تم تعديل المصروف':'Expense updated','success');
    } else {
      DB.expenses.push({
        id: 'exp_' + Date.now(),
        empId, category: cat, amount, date,
        description: desc,
        attachmentNote: receipt,
        status: 'pending',
        createdAt: new Date().toISOString(),
        approvedBy: null, approvedAt: null,
      });
      App.toast(isAr?'تم إضافة المصروف بنجاح':'Expense added successfully','success');
    }

    DB.save();
    App.closeModal();
    this.render(document.getElementById('page-content'));
  },

  approve(id) {
    if (!DB.expenses) return;
    const ex = DB.expenses.find(x => x.id === id);
    if (!ex) return;
    const isAr = currentLang === 'ar';
    if (!confirm(isAr?'هل تريد الموافقة على هذا المصروف؟':'Approve this expense?')) return;
    ex.status     = 'approved';
    ex.approvedBy = App.state.user?.name || 'Admin';
    ex.approvedAt = new Date().toISOString();
    DB.save();
    App.toast(isAr?'تمت الموافقة على المصروف ✓':'Expense approved ✓','success');
    this._renderTable();
  },

  reject(id) {
    if (!DB.expenses) return;
    const ex = DB.expenses.find(x => x.id === id);
    if (!ex) return;
    const isAr = currentLang === 'ar';
    if (!confirm(isAr?'هل تريد رفض هذا المصروف؟':'Reject this expense?')) return;
    ex.status = 'rejected';
    DB.save();
    App.toast(isAr?'تم رفض المصروف':'Expense rejected','error');
    this._renderTable();
  },

  deleteExpense(id) {
    if (!DB.expenses) return;
    const isAr = currentLang === 'ar';
    if (!confirm(isAr?'هل تريد حذف هذا المصروف نهائياً؟':'Delete this expense permanently?')) return;
    DB.expenses = DB.expenses.filter(x => x.id !== id);
    DB.save();
    App.toast(isAr?'تم حذف المصروف':'Expense deleted','info');
    this.render(document.getElementById('page-content'));
  },

  _fmt(n) {
    const num = Number(n)||0;
    return num.toLocaleString(currentLang==='ar'?'ar-SA':'en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  },
};
