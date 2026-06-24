/* =========================================================
   ATTENDIFY PRO — وحدة مكافأة نهاية الخدمة
   نظام العمل السعودي: المادة 84
   ========================================================= */

const GratuityModule = {

  render(container) {
    const employees = DB.employees.filter(e => e.hireDate);
    const all       = DB.employees;
    const totalEst  = employees.reduce((s,e) => s + this.calc(e,'termination').gratuity, 0);
    const eligible  = employees.filter(e => this.calc(e,'termination').eligible);

    container.innerHTML = `
      <div class="page-header">
        <div class="page-header-info">
          <h1 class="page-title">
            <i class="fas fa-award" style="color:#f59e0b;margin-left:10px"></i>
            مكافأة نهاية الخدمة
          </h1>
          <p class="page-subtitle">حساب تلقائي وفق نظام العمل السعودي (المادة 84)</p>
        </div>
        <div class="page-header-actions">
          <button class="btn btn-secondary" onclick="GratuityModule.exportExcel()">
            <i class="fas fa-download"></i> تصدير
          </button>
          <button class="btn btn-primary" onclick="GratuityModule.showInfo()">
            <i class="fas fa-info-circle"></i> معلومات الحساب
          </button>
        </div>
      </div>

      <div class="stats-grid stagger-container">
        <div class="stat-card primary stagger-item">
          <div class="stat-icon gradient-primary"><i class="fas fa-users"></i></div>
          <div class="stat-info">
            <div class="stat-value" data-count="${employees.length}">${employees.length}</div>
            <div class="stat-label">موظف مسجل تاريخ توظيف</div>
          </div>
        </div>
        <div class="stat-card success stagger-item">
          <div class="stat-icon gradient-success"><i class="fas fa-user-check"></i></div>
          <div class="stat-info">
            <div class="stat-value" data-count="${eligible.length}">${eligible.length}</div>
            <div class="stat-label">مستحق المكافأة</div>
          </div>
        </div>
        <div class="stat-card warning stagger-item">
          <div class="stat-icon gradient-warning"><i class="fas fa-coins"></i></div>
          <div class="stat-info">
            <div class="stat-value">${App.formatCurrency(totalEst)}</div>
            <div class="stat-label">إجمالي الالتزام التقديري</div>
          </div>
        </div>
        <div class="stat-card danger stagger-item">
          <div class="stat-icon gradient-danger"><i class="fas fa-calendar-check"></i></div>
          <div class="stat-info">
            <div class="stat-value">${all.length - employees.length}</div>
            <div class="stat-label">موظف بدون تاريخ توظيف</div>
          </div>
        </div>
      </div>

      <div class="filter-bar">
        <div class="filter-group">
          <select class="filter-select" id="gr-dept" onchange="GratuityModule._filter()">
            <option value="">كل الأقسام</option>
            ${DB.departments.map(d=>`<option value="${d.id}">${_esc(d.name)}</option>`).join('')}
          </select>
        </div>
        <div class="filter-group">
          <select class="filter-select" id="gr-years" onchange="GratuityModule._filter()">
            <option value="">كل الفترات</option>
            <option value="1">أقل من سنة</option>
            <option value="2">1–5 سنوات</option>
            <option value="3">5–10 سنوات</option>
            <option value="4">أكثر من 10 سنوات</option>
          </select>
        </div>
        <div class="filter-group" style="flex:1">
          <div class="search-box">
            <i class="fas fa-search search-icon"></i>
            <input type="text" class="search-input" id="gr-search" placeholder="بحث بالاسم..." oninput="GratuityModule._filter()">
          </div>
        </div>
      </div>

      <div class="data-table-wrap">
        <table class="data-table" id="gr-table">
          <thead>
            <tr>
              <th>الموظف</th>
              <th>القسم</th>
              <th>تاريخ التوظيف</th>
              <th>مدة الخدمة</th>
              <th>الراتب الأساسي</th>
              <th>مكافأة (إنهاء)</th>
              <th>مكافأة (استقالة)</th>
              <th>إجراءات</th>
            </tr>
          </thead>
          <tbody id="gr-tbody">
            ${this._rows(employees)}
          </tbody>
        </table>
        ${employees.length === 0 ? `
          <div class="empty-state">
            <div class="empty-icon"><i class="fas fa-award"></i></div>
            <div class="empty-title">لا توجد بيانات</div>
            <p class="empty-desc">أضف تاريخ التوظيف لكل موظف من صفحة الموظفين</p>
          </div>` : ''}
      </div>
    `;
  },

  _rows(list) {
    if (!list.length) return `<tr><td colspan="8" style="text-align:center;color:var(--text-muted);padding:40px">لا توجد نتائج</td></tr>`;
    return list.map(emp => {
      const dept      = DB.getDepartment(emp.dept)?.name || '—';
      const termCalc  = this.calc(emp, 'termination');
      const resignCalc= this.calc(emp, 'resign');
      const yearsStr  = this._yearsLabel(termCalc.years);
      return `
        <tr class="stagger-item">
          <td>
            <div style="display:flex;align-items:center;gap:10px">
              <div class="emp-avatar" style="width:36px;height:36px;font-size:14px">${(emp.name||'?').charAt(0)}</div>
              <div>
                <div style="font-weight:600;font-size:14px">${_esc(emp.name)}</div>
                <div style="color:var(--text-muted);font-size:11px">${_esc(emp.no||'')}</div>
              </div>
            </div>
          </td>
          <td style="color:var(--text-secondary)">${_esc(dept)}</td>
          <td style="color:var(--text-muted)">${emp.hireDate||'—'}</td>
          <td>
            <span class="badge ${termCalc.years>=5?'badge-success':termCalc.years>=2?'badge-primary':'badge-warning'}">
              ${yearsStr}
            </span>
          </td>
          <td style="font-weight:600">${App.formatCurrency(emp.salary||0)}</td>
          <td style="font-weight:700;color:#10b981">${termCalc.eligible ? App.formatCurrency(termCalc.gratuity) : '<span style="color:var(--text-muted);font-size:12px">غير مستحق</span>'}</td>
          <td style="color:#6366f1;font-weight:700">${resignCalc.eligible ? App.formatCurrency(resignCalc.gratuity) : '<span style="color:var(--text-muted);font-size:12px">غير مستحق</span>'}</td>
          <td>
            <button class="btn-icon-sm" title="تفاصيل الحساب" onclick="GratuityModule.details('${emp.id}')">
              <i class="fas fa-calculator"></i>
            </button>
          </td>
        </tr>
      `;
    }).join('');
  },

  _yearsLabel(years) {
    if (years < 1)  return `${Math.round(years*12)} شهر`;
    if (years === Math.floor(years)) return `${years} ${years===1?'سنة':'سنوات'}`;
    return `${Math.floor(years)} س ${Math.round((years%1)*12)} ش`;
  },

  _filter() {
    const dept   = document.getElementById('gr-dept')?.value || '';
    const yRange = document.getElementById('gr-years')?.value || '';
    const search = (document.getElementById('gr-search')?.value||'').toLowerCase();

    const list = DB.employees.filter(e => {
      if (!e.hireDate) return false;
      if (dept && e.dept !== dept) return false;
      if (search && !(e.name||'').toLowerCase().includes(search)) return false;
      if (yRange) {
        const y = this.calc(e,'termination').years;
        if (yRange==='1' && y>=1)   return false;
        if (yRange==='2' && (y<1||y>=5))  return false;
        if (yRange==='3' && (y<5||y>=10)) return false;
        if (yRange==='4' && y<10)   return false;
      }
      return true;
    });

    const tbody = document.getElementById('gr-tbody');
    if (tbody) tbody.innerHTML = this._rows(list);
  },

  // حساب مكافأة نهاية الخدمة — نظام العمل السعودي المادة 84
  calc(emp, type = 'termination', endDate = null) {
    if (!emp.hireDate) return { years:0, gratuity:0, eligible:false };
    const hire    = new Date(emp.hireDate);
    const end     = endDate ? new Date(endDate) : new Date();
    const msYears = (end - hire) / (365.25 * 24 * 3600 * 1000);
    const years   = Math.max(0, msYears);
    const salary  = emp.salary || 0;

    let gratuity = 0;
    // الحساب: نصف شهر لكل سنة عن الخمس سنوات الأولى + شهر كامل لكل سنة بعدها
    const first5  = Math.min(years, 5) * (salary / 2);
    const after5  = Math.max(0, years - 5) * salary;
    gratuity = first5 + after5;

    if (type === 'resign') {
      if (years < 2)        gratuity = 0;       // أقل من سنتين: لا مكافأة
      else if (years < 5)   gratuity *= 1/3;    // 2-5 سنوات: الثلث
      else if (years < 10)  gratuity *= 2/3;    // 5-10 سنوات: الثلثان
      // 10+ سنوات: المكافأة كاملة
    }
    // عند إنهاء الخدمة: مستحق بعد 6 أشهر على الأقل (عرف متعارف عليه)
    if (type === 'termination' && years < 0.5) gratuity = 0;

    return {
      years: Math.round(years * 10) / 10,
      gratuity: Math.round(gratuity),
      eligible: gratuity > 0,
    };
  },

  details(empId) {
    const emp = DB.getEmployee(empId);
    if (!emp) return;
    const term   = this.calc(emp, 'termination');
    const resign = this.calc(emp, 'resign');
    const dept   = DB.getDepartment(emp.dept)?.name || '—';

    const hireDate  = new Date(emp.hireDate);
    const todayDate = new Date();
    const first5    = Math.min(term.years, 5);
    const after5    = Math.max(0, term.years - 5);
    const salaryHalf = Math.round((emp.salary||0)/2);

    App.openModal(`حساب نهاية الخدمة — ${_esc(emp.name)}`, `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:20px">
        <div class="info-cell"><div class="info-label">الموظف</div><div class="info-val">${_esc(emp.name)}</div></div>
        <div class="info-cell"><div class="info-label">القسم</div><div>${_esc(dept)}</div></div>
        <div class="info-cell"><div class="info-label">تاريخ التوظيف</div><div>${emp.hireDate||'—'}</div></div>
        <div class="info-cell"><div class="info-label">مدة الخدمة</div><div style="font-weight:700">${this._yearsLabel(term.years)}</div></div>
        <div class="info-cell"><div class="info-label">الراتب الأساسي</div><div style="font-weight:700;color:#6366f1">${App.formatCurrency(emp.salary||0)}</div></div>
      </div>

      <div style="background:var(--bg);border-radius:12px;padding:16px;margin-bottom:16px">
        <div style="font-weight:700;margin-bottom:12px;color:var(--text-secondary)">تفصيل الحساب</div>
        <div style="display:grid;gap:8px;font-size:13px">
          ${first5 > 0 ? `
          <div style="display:flex;justify-content:space-between;padding:8px;background:var(--bg-card);border-radius:8px">
            <span>الخمس سنوات الأولى (${first5.toFixed(1)} × ${App.formatCurrency(salaryHalf)}/سنة)</span>
            <span style="font-weight:700;color:#10b981">${App.formatCurrency(Math.round(first5 * salaryHalf))}</span>
          </div>` : ''}
          ${after5 > 0 ? `
          <div style="display:flex;justify-content:space-between;padding:8px;background:var(--bg-card);border-radius:8px">
            <span>ما بعد 5 سنوات (${after5.toFixed(1)} × ${App.formatCurrency(emp.salary||0)}/سنة)</span>
            <span style="font-weight:700;color:#10b981">${App.formatCurrency(Math.round(after5 * (emp.salary||0)))}</span>
          </div>` : ''}
        </div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:20px">
        <div style="background:rgba(16,185,129,.08);border:1px solid rgba(16,185,129,.2);border-radius:12px;padding:16px;text-align:center">
          <div style="font-size:12px;color:#10b981;margin-bottom:8px;font-weight:600">
            <i class="fas fa-user-xmark"></i> عند إنهاء الخدمة
          </div>
          <div style="font-size:24px;font-weight:900;color:#10b981">${term.eligible ? App.formatCurrency(term.gratuity) : 'غير مستحق'}</div>
          <div style="font-size:11px;color:var(--text-muted);margin-top:4px">مكافأة كاملة</div>
        </div>
        <div style="background:rgba(99,102,241,.08);border:1px solid rgba(99,102,241,.2);border-radius:12px;padding:16px;text-align:center">
          <div style="font-size:12px;color:#6366f1;margin-bottom:8px;font-weight:600">
            <i class="fas fa-person-walking-arrow-right"></i> عند الاستقالة
          </div>
          <div style="font-size:24px;font-weight:900;color:#6366f1">${resign.eligible ? App.formatCurrency(resign.gratuity) : 'غير مستحق'}</div>
          <div style="font-size:11px;color:var(--text-muted);margin-top:4px">
            ${term.years < 2 ? 'أقل من سنتين' : term.years < 5 ? 'ثلث المكافأة' : term.years < 10 ? 'ثلثا المكافأة' : 'مكافأة كاملة'}
          </div>
        </div>
      </div>

      <div style="background:rgba(245,158,11,.08);border-radius:10px;padding:12px;font-size:12px;color:#92400e;margin-bottom:16px">
        <i class="fas fa-info-circle" style="margin-left:6px"></i>
        هذا تقدير استرشادي بناءً على المادة 84 من نظام العمل السعودي. قد تختلف المكافأة الفعلية بسبب الإجازات، الغيابات، أو الاتفاقيات الخاصة.
      </div>

      <div style="display:flex;gap:10px;justify-content:center">
        <button class="btn btn-secondary" onclick="App.closeModal()">إغلاق</button>
        <button class="btn btn-outline-primary" onclick="App.closeModal(); EmployeesModule.viewEmployee('${emp.id}')"><i class="fas fa-user"></i> ملف الموظف</button>
        <button class="btn btn-primary" onclick="App.closeModal(); App.navigate('payroll')"><i class="fas fa-money-bill-wave"></i> الرواتب</button>
      </div>
    `);
  },

  showInfo() {
    App.openModal('كيفية حساب مكافأة نهاية الخدمة', `
      <div style="font-size:14px;line-height:1.8">
        <div style="font-weight:700;margin-bottom:12px;font-size:16px">نظام العمل السعودي — المادة 84</div>
        <div style="display:grid;gap:10px">
          <div style="background:var(--bg);border-radius:10px;padding:14px">
            <div style="font-weight:700;color:#10b981;margin-bottom:6px"><i class="fas fa-user-xmark"></i> عند إنهاء الخدمة من صاحب العمل</div>
            <ul style="padding-right:18px;color:var(--text-secondary);display:grid;gap:4px">
              <li>الخمس سنوات الأولى: نصف شهر راتب لكل سنة</li>
              <li>ما بعد 5 سنوات: شهر راتب كامل لكل سنة</li>
              <li>مستحق بعد 6 أشهر خدمة</li>
            </ul>
          </div>
          <div style="background:var(--bg);border-radius:10px;padding:14px">
            <div style="font-weight:700;color:#6366f1;margin-bottom:6px"><i class="fas fa-person-walking-arrow-right"></i> عند استقالة الموظف</div>
            <ul style="padding-right:18px;color:var(--text-secondary);display:grid;gap:4px">
              <li>أقل من سنتين: لا مكافأة</li>
              <li>من 2 إلى أقل من 5 سنوات: ثلث المكافأة</li>
              <li>من 5 إلى أقل من 10 سنوات: ثلثا المكافأة</li>
              <li>10 سنوات فأكثر: المكافأة كاملة</li>
            </ul>
          </div>
        </div>
        <div style="background:rgba(245,158,11,.08);border-radius:8px;padding:10px;margin-top:12px;font-size:12px;color:#92400e">
          <i class="fas fa-exclamation-triangle"></i> هذه المعلومات إرشادية فقط. يُنصح بمراجعة متخصص قانوني لأي نزاع.
        </div>
      </div>
      <div style="margin-top:16px;text-align:center">
        <button class="btn btn-secondary" onclick="App.closeModal()">إغلاق</button>
      </div>
    `);
  },

  exportExcel() {
    const employees = DB.employees.filter(e => e.hireDate);
    if (!employees.length) { App.toast('لا توجد بيانات للتصدير','warning'); return; }

    const rows = employees.map(emp => {
      const dept   = DB.getDepartment(emp.dept)?.name || '—';
      const term   = this.calc(emp,'termination');
      const resign = this.calc(emp,'resign');
      return {
        'الموظف':                 emp.name||'',
        'رقم الموظف':             emp.no||'',
        'القسم':                  dept,
        'تاريخ التوظيف':          emp.hireDate||'',
        'مدة الخدمة (سنوات)':    term.years,
        'الراتب الأساسي':         emp.salary||0,
        'مكافأة الإنهاء':         term.gratuity,
        'مكافأة الاستقالة':       resign.gratuity,
      };
    });

    const sep = '\t';
    const header = Object.keys(rows[0]).join(sep);
    const body   = rows.map(r => Object.values(r).join(sep)).join('\n');
    const csv    = '﻿' + header + '\n' + body;
    const blob   = new Blob([csv], { type:'text/tab-separated-values;charset=utf-8' });
    const a      = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: `gratuity-${new Date().toISOString().slice(0,10)}.xls` });
    a.click();
    URL.revokeObjectURL(a.href);
    App.toast('✅ تم تصدير بيانات نهاية الخدمة','success');
  },
};
