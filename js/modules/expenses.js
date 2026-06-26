/* =========================================================
   EXPENSES MODULE — إدارة المصروفات
   ========================================================= */

const ExpensesModule = {

  _filter: { status: 'all', empId: '', category: '' },
  _page: 1,
  _perPage: 15,

  // Categories
  _cats() {
    const isAr = currentLang === 'ar';
    return [
      { id: 'travel',        icon: 'fas fa-plane',          ar: 'سفر',          en: 'Travel'        },
      { id: 'meals',         icon: 'fas fa-utensils',        ar: 'وجبات',        en: 'Meals'         },
      { id: 'accommodation', icon: 'fas fa-hotel',           ar: 'إقامة',        en: 'Accommodation' },
      { id: 'transport',     icon: 'fas fa-car',             ar: 'مواصلات',      en: 'Transport'     },
      { id: 'communication', icon: 'fas fa-phone',           ar: 'اتصالات',      en: 'Communication' },
      { id: 'supplies',      icon: 'fas fa-box',             ar: 'مستلزمات',     en: 'Supplies'      },
      { id: 'other',         icon: 'fas fa-receipt',         ar: 'أخرى',         en: 'Other'         },
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

  render(container) {
    if (!DB.expenses) DB.expenses = [];
    const isAr = currentLang === 'ar';

    const expenses = this._getFiltered();
    const total    = expenses.reduce((s, e) => s + (Number(e.amount)||0), 0);
    const pending  = DB.expenses.filter(e => e.status === 'pending').length;
    const approved = DB.expenses.filter(e => e.status === 'approved').length;
    const rejected = DB.expenses.filter(e => e.status === 'rejected').length;
    const currency = DB.company.currency || 'SAR';

    container.innerHTML = `
      <div class="page-header">
        <div class="page-header-text">
          <h1>${t('expenses.title')}</h1>
          <p>${t('expenses.subtitle')}</p>
        </div>
        <div class="page-header-actions">
          <button class="btn btn-primary" onclick="ExpensesModule.openAdd()">
            <i class="fas fa-plus"></i> ${t('expenses.addExpense')}
          </button>
        </div>
      </div>

      <!-- Stats -->
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:12px;margin-bottom:20px">
        <div class="card" style="padding:16px;cursor:pointer" onclick="ExpensesModule._filter.status='pending';ExpensesModule._page=1;ExpensesModule._renderTable()">
          <div style="font-size:26px;font-weight:700;color:#f59e0b">${pending}</div>
          <div style="font-size:12px;color:var(--text-muted);margin-top:4px">${t('expenses.pending')}</div>
        </div>
        <div class="card" style="padding:16px;cursor:pointer" onclick="ExpensesModule._filter.status='approved';ExpensesModule._page=1;ExpensesModule._renderTable()">
          <div style="font-size:26px;font-weight:700;color:#10b981">${approved}</div>
          <div style="font-size:12px;color:var(--text-muted);margin-top:4px">${t('expenses.approved')}</div>
        </div>
        <div class="card" style="padding:16px;cursor:pointer" onclick="ExpensesModule._filter.status='rejected';ExpensesModule._page=1;ExpensesModule._renderTable()">
          <div style="font-size:26px;font-weight:700;color:#ef4444">${rejected}</div>
          <div style="font-size:12px;color:var(--text-muted);margin-top:4px">${t('expenses.rejected')}</div>
        </div>
        <div class="card" style="padding:16px">
          <div style="font-size:22px;font-weight:700;color:var(--primary)">${this._fmt(total)} ${currency}</div>
          <div style="font-size:12px;color:var(--text-muted);margin-top:4px">${t('expenses.totalAmount')} (${t('expenses.approvedOnly')})</div>
        </div>
      </div>

      <!-- Filters -->
      <div class="card" style="padding:14px 16px;margin-bottom:16px">
        <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center">
          <select class="form-control" style="height:36px;min-width:140px" id="exp-filter-status" onchange="ExpensesModule._filter.status=this.value;ExpensesModule._page=1;ExpensesModule._renderTable()">
            <option value="all">${t('common.all')}</option>
            <option value="pending">${t('expenses.pending')}</option>
            <option value="approved">${t('expenses.approved')}</option>
            <option value="rejected">${t('expenses.rejected')}</option>
          </select>
          <select class="form-control" style="height:36px;min-width:160px" id="exp-filter-emp" onchange="ExpensesModule._filter.empId=this.value;ExpensesModule._page=1;ExpensesModule._renderTable()">
            <option value="">${t('expenses.allEmployees')}</option>
            ${DB.employees.filter(e=>e.status!=='inactive').map(e=>`<option value="${e.id}">${_esc(e.name)}</option>`).join('')}
          </select>
          <select class="form-control" style="height:36px;min-width:140px" id="exp-filter-cat" onchange="ExpensesModule._filter.category=this.value;ExpensesModule._page=1;ExpensesModule._renderTable()">
            <option value="">${t('expenses.allCategories')}</option>
            ${this._cats().map(c=>`<option value="${c.id}">${isAr?c.ar:c.en}</option>`).join('')}
          </select>
          <button class="btn btn-secondary" style="height:36px" onclick="ExpensesModule._filter={status:'all',empId:'',category:''};ExpensesModule._page=1;ExpensesModule._renderTable()">
            <i class="fas fa-rotate-left"></i>
          </button>
        </div>
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
    const isAr = currentLang === 'ar';
    const list  = this._getFiltered();
    const start = (this._page - 1) * this._perPage;
    const page  = list.slice(start, start + this._perPage);
    const currency = DB.company.currency || 'SAR';

    if (list.length === 0) {
      wrap.innerHTML = `<div class="empty-state">
        <div class="empty-icon"><i class="fas fa-receipt"></i></div>
        <div class="empty-title">${t('expenses.noExpenses')}</div>
        <p class="empty-desc">${t('expenses.noExpensesDesc')}</p>
      </div>`;
      return;
    }

    wrap.innerHTML = `
      <div class="card" style="overflow:hidden;padding:0">
        <div style="overflow-x:auto">
          <table style="width:100%;border-collapse:collapse">
            <thead>
              <tr style="background:var(--bg-secondary)">
                <th style="padding:12px 16px;text-align:${isAr?'right':'left'};font-size:12px;font-weight:600;color:var(--text-muted)">${t('expenses.colEmployee')}</th>
                <th style="padding:12px 16px;text-align:${isAr?'right':'left'};font-size:12px;font-weight:600;color:var(--text-muted)">${t('expenses.colCategory')}</th>
                <th style="padding:12px 16px;text-align:${isAr?'right':'left'};font-size:12px;font-weight:600;color:var(--text-muted)">${t('expenses.colDescription')}</th>
                <th style="padding:12px 16px;text-align:${isAr?'right':'left'};font-size:12px;font-weight:600;color:var(--text-muted)">${t('expenses.colDate')}</th>
                <th style="padding:12px 16px;text-align:${isAr?'right':'left'};font-size:12px;font-weight:600;color:var(--text-muted)">${t('expenses.colAmount')}</th>
                <th style="padding:12px 16px;text-align:${isAr?'right':'left'};font-size:12px;font-weight:600;color:var(--text-muted)">${t('expenses.colStatus')}</th>
                <th style="padding:12px 16px;text-align:${isAr?'right':'left'};font-size:12px;font-weight:600;color:var(--text-muted)">${t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              ${page.map(ex => {
                const emp = DB.employees.find(e => e.id === ex.empId);
                const statusColors = { pending:'#f59e0b', approved:'#10b981', rejected:'#ef4444' };
                const statusLabels = { pending: t('expenses.pending'), approved: t('expenses.approved'), rejected: t('expenses.rejected') };
                const color = statusColors[ex.status] || '#94a3b8';
                return `
                  <tr style="border-top:1px solid var(--border)" onmouseover="this.style.background='var(--bg-secondary)'" onmouseout="this.style.background=''">
                    <td style="padding:12px 16px">
                      <div style="display:flex;align-items:center;gap:8px">
                        <div style="width:30px;height:30px;border-radius:50%;background:var(--primary-alpha);display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:var(--primary);flex-shrink:0">
                          ${emp ? _esc(emp.name.charAt(0)) : '?'}
                        </div>
                        <div style="font-size:13px;font-weight:500;color:var(--text-primary)">${emp ? _esc(emp.name) : '—'}</div>
                      </div>
                    </td>
                    <td style="padding:12px 16px">
                      <div style="display:flex;align-items:center;gap:6px">
                        <i class="${this._catIcon(ex.category)}" style="color:var(--text-muted);width:14px"></i>
                        <span style="font-size:13px;color:var(--text-primary)">${_esc(this._catLabel(ex.category))}</span>
                      </div>
                    </td>
                    <td style="padding:12px 16px;font-size:13px;color:var(--text-secondary);max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${_esc(ex.description||'—')}</td>
                    <td style="padding:12px 16px;font-size:13px;color:var(--text-muted)">${ex.date||'—'}</td>
                    <td style="padding:12px 16px;font-size:14px;font-weight:700;color:var(--text-primary)">${this._fmt(ex.amount)} ${currency}</td>
                    <td style="padding:12px 16px">
                      <span style="display:inline-flex;align-items:center;gap:4px;padding:4px 10px;border-radius:20px;font-size:11px;font-weight:600;background:${color}18;color:${color}">
                        ${statusLabels[ex.status]||ex.status}
                      </span>
                    </td>
                    <td style="padding:12px 16px">
                      <div style="display:flex;gap:4px;align-items:center">
                        ${ex.status === 'pending' ? `
                          <button class="btn-icon btn" style="color:#10b981" title="${t('expenses.approve')}" onclick="ExpensesModule.approve('${ex.id}')"><i class="fas fa-check"></i></button>
                          <button class="btn-icon btn" style="color:#ef4444" title="${t('expenses.reject')}" onclick="ExpensesModule.reject('${ex.id}')"><i class="fas fa-times"></i></button>
                        ` : ''}
                        <button class="btn-icon btn" title="${t('common.edit')}" onclick="ExpensesModule.openEdit('${ex.id}')"><i class="fas fa-pencil"></i></button>
                        <button class="btn-icon btn" style="color:var(--danger)" title="${t('common.delete')}" onclick="ExpensesModule.deleteExpense('${ex.id}')"><i class="fas fa-trash"></i></button>
                      </div>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
        ${list.length > this._perPage ? `
          <div style="display:flex;justify-content:center;align-items:center;gap:12px;padding:12px 16px;border-top:1px solid var(--border)">
            <button class="btn btn-secondary" ${this._page===1?'disabled':''} onclick="ExpensesModule._page--;ExpensesModule._renderTable()">
              <i class="fas fa-chevron-${isAr?'right':'left'}"></i>
            </button>
            <span style="font-size:13px;color:var(--text-muted)">${this._page} / ${Math.ceil(list.length/this._perPage)}</span>
            <button class="btn btn-secondary" ${this._page>=Math.ceil(list.length/this._perPage)?'disabled':''} onclick="ExpensesModule._page++;ExpensesModule._renderTable()">
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
    const isAr = currentLang === 'ar';
    const isEdit = !!ex;
    const currency = DB.company.currency || 'SAR';

    const body = `
      <div style="display:flex;flex-direction:column;gap:14px">
        <div>
          <label class="form-label">${t('expenses.colEmployee')} *</label>
          <select class="form-control" id="exp-emp" required>
            <option value="">${t('expenses.selectEmployee')}</option>
            ${DB.employees.filter(e=>e.status!=='inactive').map(e=>`<option value="${e.id}" ${isEdit&&ex.empId===e.id?'selected':''}>${_esc(e.name)}</option>`).join('')}
          </select>
        </div>
        <div>
          <label class="form-label">${t('expenses.colCategory')} *</label>
          <select class="form-control" id="exp-cat" required>
            <option value="">${t('expenses.selectCategory')}</option>
            ${this._cats().map(c=>`<option value="${c.id}" ${isEdit&&ex.category===c.id?'selected':''}>${isAr?c.ar:c.en}</option>`).join('')}
          </select>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
          <div>
            <label class="form-label">${t('expenses.colAmount')} (${currency}) *</label>
            <input type="number" class="form-control" id="exp-amount" min="0" step="0.01" value="${isEdit?ex.amount:''}" required>
          </div>
          <div>
            <label class="form-label">${t('expenses.colDate')} *</label>
            <input type="date" class="form-control" id="exp-date" value="${isEdit?ex.date:new Date().toISOString().slice(0,10)}" required>
          </div>
        </div>
        <div>
          <label class="form-label">${t('expenses.colDescription')}</label>
          <textarea class="form-control" id="exp-desc" rows="3" style="resize:vertical">${isEdit?_esc(ex.description||''):''}</textarea>
        </div>
        <div>
          <label class="form-label">${t('expenses.receipt')}</label>
          <input type="text" class="form-control" id="exp-receipt" value="${isEdit?_esc(ex.attachmentNote||''):''}" placeholder="${t('expenses.receiptPlaceholder')}">
        </div>
      </div>
    `;

    App.openModal(
      isEdit ? t('expenses.editExpense') : t('expenses.addExpense'),
      body,
      `<button class="btn btn-secondary" onclick="App.closeModal()">${t('common.cancel')}</button>
       <button class="btn btn-primary" onclick="ExpensesModule._save(${isEdit?`'${ex.id}'`:'null'})">
         <i class="fas fa-save"></i> ${t('common.save')}
       </button>`
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
