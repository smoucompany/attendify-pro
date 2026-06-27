/* =========================================================
   ATTENDIFY PRO — وحدة مكافأة نهاية الخدمة
   نظام العمل السعودي: المادة 84
   ========================================================= */

const GratuityModule = {

  render(container) {
    const employees = DB.employees.filter(e => e.hireDate);
    const all       = DB.employees;
    const isAr      = currentLang === 'ar';

    const totalEst = employees.reduce((s,e) => s + this.calc(e,'termination').gratuity, 0);
    const eligible = employees.filter(e => this.calc(e,'termination').eligible);

    const tier0 = employees.filter(e => this.calc(e,'termination').years < 1).length;
    const tier1 = employees.filter(e => { const y=this.calc(e,'termination').years; return y>=1&&y<5; }).length;
    const tier2 = employees.filter(e => { const y=this.calc(e,'termination').years; return y>=5&&y<10; }).length;
    const tier3 = employees.filter(e => this.calc(e,'termination').years >= 10).length;

    container.innerHTML = `
      <div class="page-header">
        <div class="page-header-text">
          <h1 style="display:flex;align-items:center;gap:10px">
            <span style="width:38px;height:38px;border-radius:12px;background:linear-gradient(135deg,#f59e0b,#fbbf24);
              display:inline-flex;align-items:center;justify-content:center;color:#fff;font-size:18px;flex-shrink:0">
              <i class="fas fa-award"></i>
            </span>
            ${t('gratuity.title')}
          </h1>
          <p>${t('gratuity.subtitle')}</p>
        </div>
        <div class="page-header-actions">
          <button class="btn btn-secondary" onclick="GratuityModule.exportExcel()">
            <i class="fas fa-download"></i> ${t('gratuity.exportBtn')}
          </button>
          <button class="btn btn-primary" onclick="GratuityModule.showInfo()">
            <i class="fas fa-info-circle"></i> ${t('gratuity.calcInfo')}
          </button>
        </div>
      </div>

      <!-- Stats -->
      <div class="orgchart-stats" style="grid-template-columns:repeat(auto-fill,minmax(200px,1fr));margin-bottom:20px">
        <div class="orgchart-stat-card" style="color:#6366f1">
          <div class="orgchart-stat-icon" style="background:#6366f115;color:#6366f1">
            <i class="fas fa-users"></i>
          </div>
          <div>
            <div class="orgchart-stat-val">${employees.length}</div>
            <div class="orgchart-stat-lbl">${t('gratuity.withHireDate')}</div>
          </div>
        </div>
        <div class="orgchart-stat-card" style="color:#10b981">
          <div class="orgchart-stat-icon" style="background:#10b98115;color:#10b981">
            <i class="fas fa-user-check"></i>
          </div>
          <div>
            <div class="orgchart-stat-val">${eligible.length}</div>
            <div class="orgchart-stat-lbl">${t('gratuity.eligible')}</div>
          </div>
        </div>
        <div class="orgchart-stat-card" style="color:#f59e0b">
          <div class="orgchart-stat-icon" style="background:#f59e0b15;color:#f59e0b">
            <i class="fas fa-coins"></i>
          </div>
          <div>
            <div class="orgchart-stat-val" style="font-size:16px">${App.formatCurrency(totalEst)}</div>
            <div class="orgchart-stat-lbl">${t('gratuity.totalLiability')}</div>
          </div>
        </div>
        <div class="orgchart-stat-card" style="color:#ef4444">
          <div class="orgchart-stat-icon" style="background:#ef444415;color:#ef4444">
            <i class="fas fa-calendar-xmark"></i>
          </div>
          <div>
            <div class="orgchart-stat-val">${all.length - employees.length}</div>
            <div class="orgchart-stat-lbl">${t('gratuity.noHireDate')}</div>
          </div>
        </div>
      </div>

      <!-- Service Tiers -->
      ${employees.length > 0 ? `
      <div class="card" style="padding:18px 22px;margin-bottom:20px">
        <div style="font-size:13px;font-weight:700;color:var(--text-secondary);margin-bottom:14px">
          <i class="fas fa-layer-group" style="color:#f59e0b;margin-${isAr?'left':'right'}:6px"></i>
          ${isAr ? 'توزيع الموظفين حسب سنوات الخدمة' : 'Employee Distribution by Service Years'}
        </div>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:10px">
          ${[
            { color:'#94a3b8', label: isAr?'أقل من سنة':'< 1 Year',     icon:'fas fa-seedling', count: tier0, pct: employees.length ? Math.round(tier0/employees.length*100) : 0 },
            { color:'#6366f1', label: isAr?'1 - 5 سنوات':'1–5 Years',   icon:'fas fa-tree',     count: tier1, pct: employees.length ? Math.round(tier1/employees.length*100) : 0 },
            { color:'#10b981', label: isAr?'5 - 10 سنوات':'5–10 Years', icon:'fas fa-star',     count: tier2, pct: employees.length ? Math.round(tier2/employees.length*100) : 0 },
            { color:'#f59e0b', label: isAr?'10+ سنوات':'10+ Years',     icon:'fas fa-crown',    count: tier3, pct: employees.length ? Math.round(tier3/employees.length*100) : 0 },
          ].map(tier => `
            <div style="background:${tier.color}08;border:1px solid ${tier.color}25;border-radius:12px;padding:12px 14px">
              <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
                <div style="width:30px;height:30px;border-radius:8px;background:${tier.color}18;
                  display:flex;align-items:center;justify-content:center">
                  <i class="${tier.icon}" style="color:${tier.color};font-size:13px"></i>
                </div>
                <div style="font-size:22px;font-weight:800;color:${tier.color}">${tier.count}</div>
              </div>
              <div style="font-size:11px;color:var(--text-muted);margin-bottom:6px">${tier.label}</div>
              <div style="background:var(--border);border-radius:4px;height:4px;overflow:hidden">
                <div style="background:${tier.color};height:4px;border-radius:4px;width:${tier.pct}%"></div>
              </div>
              <div style="font-size:10px;color:${tier.color};font-weight:600;margin-top:4px">${tier.pct}%</div>
            </div>
          `).join('')}
        </div>
      </div>
      ` : ''}

      <!-- Filters -->
      <div class="filter-bar">
        <div class="filter-group">
          <select class="filter-select" id="gr-dept" onchange="GratuityModule._filter()">
            <option value="">${t('gratuity.allDepts')}</option>
            ${DB.departments.map(d=>`<option value="${d.id}">${_esc(d.name)}</option>`).join('')}
          </select>
        </div>
        <div class="filter-group">
          <select class="filter-select" id="gr-years" onchange="GratuityModule._filter()">
            <option value="">${t('gratuity.allPeriods')}</option>
            <option value="1">${t('gratuity.lessThan1Y')}</option>
            <option value="2">${t('gratuity.1to5Y')}</option>
            <option value="3">${t('gratuity.5to10Y')}</option>
            <option value="4">${t('gratuity.more10Y')}</option>
          </select>
        </div>
        <div class="filter-group" style="flex:1">
          <div class="search-box">
            <i class="fas fa-search search-icon"></i>
            <input type="text" class="search-input" id="gr-search"
              placeholder="${t('loans.searchPlaceholder')}" oninput="GratuityModule._filter()">
          </div>
        </div>
      </div>

      <!-- Table -->
      <div class="data-table-wrap">
        <table class="data-table" id="gr-table">
          <thead>
            <tr>
              <th>${t('gratuity.employee')}</th>
              <th>${t('common.department')}</th>
              <th>${t('gratuity.hireDate')}</th>
              <th>${t('gratuity.duration')}</th>
              <th>${t('gratuity.baseSalary')}</th>
              <th>${t('gratuity.termination')}</th>
              <th>${t('gratuity.resignation')}</th>
              <th>${t('common.actions')}</th>
            </tr>
          </thead>
          <tbody id="gr-tbody">
            ${this._rows(employees)}
          </tbody>
        </table>
        ${employees.length === 0 ? `
          <div class="empty-state">
            <div class="empty-icon"><i class="fas fa-award"></i></div>
            <div class="empty-title">${t('gratuity.noData')}</div>
            <p class="empty-desc">${t('gratuity.emptyDesc')}</p>
          </div>` : ''}
      </div>
    `;
  },

  _rows(list) {
    if (!list.length) return `<tr><td colspan="8" style="text-align:center;color:var(--text-muted);padding:40px">${t('gratuity.noResults')}</td></tr>`;
    const isAr = currentLang === 'ar';
    const tierColor = y => y >= 10 ? '#f59e0b' : y >= 5 ? '#10b981' : y >= 2 ? '#6366f1' : '#94a3b8';

    return list.map(emp => {
      const dept       = DB.getDepartment(emp.dept)?.name || '—';
      const termCalc   = this.calc(emp, 'termination');
      const resignCalc = this.calc(emp, 'resign');
      const yearsStr   = this._yearsLabel(termCalc.years);
      const tc         = tierColor(termCalc.years);

      return `
        <tr class="stagger-item" style="border-${isAr?'right':'left'}:3px solid ${tc}">
          <td>
            <div style="display:flex;align-items:center;gap:10px">
              ${App.renderAvatar(emp, 36, 12)}
              <div>
                <div style="font-weight:600;font-size:14px">${_esc(emp.name)}</div>
                <div style="color:var(--text-muted);font-size:11px">${_esc(emp.no||emp.position||'')}</div>
              </div>
            </div>
          </td>
          <td>
            <span style="font-size:12px;background:var(--bg-secondary);border-radius:6px;
              padding:3px 8px;color:var(--text-secondary)">
              ${_esc(dept)}
            </span>
          </td>
          <td style="color:var(--text-muted);font-size:13px">${emp.hireDate||'—'}</td>
          <td>
            <div style="display:flex;flex-direction:column;gap:4px">
              <span style="background:${tc}18;color:${tc};border:1px solid ${tc}30;
                border-radius:8px;padding:3px 9px;font-size:12px;font-weight:700;display:inline-block">
                ${yearsStr}
              </span>
              <div style="background:var(--border);border-radius:3px;height:3px;width:70px;overflow:hidden">
                <div style="background:${tc};height:3px;border-radius:3px;width:${Math.min(termCalc.years/10*100,100)}%"></div>
              </div>
            </div>
          </td>
          <td>
            <div style="font-weight:700;font-size:14px">${App.formatCurrency(emp.salary||0)}</div>
            <div style="font-size:10px;color:var(--text-muted)">${isAr?'أساسي شهري':'monthly base'}</div>
          </td>
          <td>
            ${termCalc.eligible
              ? `<div style="font-weight:800;font-size:15px;color:#10b981">${App.formatCurrency(termCalc.gratuity)}</div>
                 <div style="font-size:10px;color:var(--text-muted)">${isAr?'عند إنهاء الخدمة':'on termination'}</div>`
              : `<span style="color:var(--text-muted);font-size:12px;background:var(--bg-secondary);
                  border-radius:6px;padding:3px 8px">${t('gratuity.ineligible')}</span>`}
          </td>
          <td>
            ${resignCalc.eligible
              ? `<div style="font-weight:800;font-size:15px;color:#6366f1">${App.formatCurrency(resignCalc.gratuity)}</div>
                 <div style="font-size:10px;color:var(--text-muted)">${isAr?'عند الاستقالة':'on resignation'}</div>`
              : `<span style="color:var(--text-muted);font-size:12px;background:var(--bg-secondary);
                  border-radius:6px;padding:3px 8px">${t('gratuity.ineligible')}</span>`}
          </td>
          <td>
            <button class="btn btn-icon btn-sm" style="background:rgba(245,158,11,.12);color:#f59e0b;border-radius:8px"
              title="${t('gratuity.calcDetails')}" onclick="GratuityModule.details('${emp.id}')">
              <i class="fas fa-calculator"></i>
            </button>
          </td>
        </tr>
      `;
    }).join('');
  },

  _yearsLabel(years) {
    if (currentLang === 'en') {
      if (years < 1)  return `${Math.round(years*12)} mo`;
      if (years === Math.floor(years)) return `${years} ${years===1?'yr':'yrs'}`;
      return `${Math.floor(years)}y ${Math.round((years%1)*12)}m`;
    }
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
    const first5  = Math.min(years, 5) * (salary / 2);
    const after5  = Math.max(0, years - 5) * salary;
    gratuity = first5 + after5;

    if (type === 'resign') {
      if (years < 2)        gratuity = 0;
      else if (years < 5)   gratuity *= 1/3;
      else if (years < 10)  gratuity *= 2/3;
    }
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
    const isAr   = currentLang === 'ar';

    const first5     = Math.min(term.years, 5);
    const after5     = Math.max(0, term.years - 5);
    const salaryHalf = Math.round((emp.salary||0)/2);

    App.openModal(`${t('gratuity.calcDetails')} — ${_esc(emp.name)}`, `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:20px">
        <div class="info-cell"><div class="info-label">${t('gratuity.employee')}</div><div class="info-val">${_esc(emp.name)}</div></div>
        <div class="info-cell"><div class="info-label">${t('common.department')}</div><div>${_esc(dept)}</div></div>
        <div class="info-cell"><div class="info-label">${t('gratuity.hireDate')}</div><div>${emp.hireDate||'—'}</div></div>
        <div class="info-cell"><div class="info-label">${t('gratuity.duration')}</div><div style="font-weight:700">${this._yearsLabel(term.years)}</div></div>
        <div class="info-cell"><div class="info-label">${t('gratuity.baseSalary')}</div><div style="font-weight:700;color:#6366f1">${App.formatCurrency(emp.salary||0)}</div></div>
      </div>

      <div style="background:var(--bg);border-radius:12px;padding:16px;margin-bottom:16px">
        <div style="font-weight:700;margin-bottom:12px;color:var(--text-secondary)">${t('gratuity.breakdown')}</div>
        <div style="display:grid;gap:8px;font-size:13px">
          ${first5 > 0 ? `
          <div style="display:flex;justify-content:space-between;padding:8px;background:var(--bg-card);border-radius:8px">
            <span>${t('gratuity.first5Years')} (${first5.toFixed(1)} × ${App.formatCurrency(salaryHalf)}/${isAr?'سنة':'year'})</span>
            <span style="font-weight:700;color:#10b981">${App.formatCurrency(Math.round(first5 * salaryHalf))}</span>
          </div>` : ''}
          ${after5 > 0 ? `
          <div style="display:flex;justify-content:space-between;padding:8px;background:var(--bg-card);border-radius:8px">
            <span>${t('gratuity.after5')} (${after5.toFixed(1)} × ${App.formatCurrency(emp.salary||0)}/${isAr?'سنة':'year'})</span>
            <span style="font-weight:700;color:#10b981">${App.formatCurrency(Math.round(after5 * (emp.salary||0)))}</span>
          </div>` : ''}
        </div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:20px">
        <div style="background:rgba(16,185,129,.08);border:1px solid rgba(16,185,129,.2);border-radius:12px;padding:16px;text-align:center">
          <div style="font-size:12px;color:#10b981;margin-bottom:8px;font-weight:600">
            <i class="fas fa-user-xmark"></i> ${t('gratuity.terminationCase')}
          </div>
          <div style="font-size:24px;font-weight:900;color:#10b981">${term.eligible ? App.formatCurrency(term.gratuity) : t('gratuity.ineligible')}</div>
          <div style="font-size:11px;color:var(--text-muted);margin-top:4px">${t('gratuity.fullGratuity')}</div>
        </div>
        <div style="background:rgba(99,102,241,.08);border:1px solid rgba(99,102,241,.2);border-radius:12px;padding:16px;text-align:center">
          <div style="font-size:12px;color:#6366f1;margin-bottom:8px;font-weight:600">
            <i class="fas fa-person-walking-arrow-right"></i> ${t('gratuity.resignationCase')}
          </div>
          <div style="font-size:24px;font-weight:900;color:#6366f1">${resign.eligible ? App.formatCurrency(resign.gratuity) : t('gratuity.ineligible')}</div>
          <div style="font-size:11px;color:var(--text-muted);margin-top:4px">
            ${term.years < 2 ? t('gratuity.less2Y') : term.years < 5 ? t('gratuity.third') : term.years < 10 ? t('gratuity.twoThirds') : t('gratuity.fullGratuity')}
          </div>
        </div>
      </div>

      <div style="background:rgba(245,158,11,.08);border-radius:10px;padding:12px;font-size:12px;color:#92400e;margin-bottom:16px">
        <i class="fas fa-info-circle" style="margin-${isAr?'left':'right'}:6px"></i>
        ${t('gratuity.disclaimer')}
      </div>

      <div style="display:flex;gap:10px;justify-content:center">
        <button class="btn btn-secondary" onclick="App.closeModal()">${t('common.close')}</button>
        <button class="btn btn-outline-primary" onclick="App.closeModal(); EmployeesModule.viewEmployee('${emp.id}')"><i class="fas fa-user"></i> ${t('loans.empFile')}</button>
        <button class="btn btn-primary" onclick="App.closeModal(); App.navigate('payroll')"><i class="fas fa-money-bill-wave"></i> ${t('gratuity.payrollBtn')}</button>
      </div>
    `);
  },

  showInfo() {
    const isAr = currentLang === 'ar';
    App.openModal(t('gratuity.infoTitle'), `
      <div style="font-size:14px;line-height:1.8">
        <div style="font-weight:700;margin-bottom:12px;font-size:16px">${t('gratuity.law')}</div>
        <div style="display:grid;gap:10px">
          <div style="background:var(--bg);border-radius:10px;padding:14px">
            <div style="font-weight:700;color:#10b981;margin-bottom:6px"><i class="fas fa-user-xmark"></i> ${t('gratuity.terminationCase')}</div>
            <ul style="padding-${isAr?'right':'left'}:18px;color:var(--text-secondary);display:grid;gap:4px">
              <li>${t('gratuity.first5Years')}: ${isAr?'نصف شهر راتب لكل سنة':'half month salary per year'}</li>
              <li>${t('gratuity.after5')}: ${isAr?'شهر راتب كامل لكل سنة':'full month salary per year'}</li>
              <li>${isAr?'مستحق بعد 6 أشهر خدمة':'Eligible after 6 months of service'}</li>
            </ul>
          </div>
          <div style="background:var(--bg);border-radius:10px;padding:14px">
            <div style="font-weight:700;color:#6366f1;margin-bottom:6px"><i class="fas fa-person-walking-arrow-right"></i> ${t('gratuity.resignationCase')}</div>
            <ul style="padding-${isAr?'right':'left'}:18px;color:var(--text-secondary);display:grid;gap:4px">
              <li>${t('gratuity.less2Y')}: ${isAr?'لا مكافأة':'no gratuity'}</li>
              <li>2–5 ${isAr?'سنوات':'years'}: ${t('gratuity.third')}</li>
              <li>5–10 ${isAr?'سنوات':'years'}: ${t('gratuity.twoThirds')}</li>
              <li>10+ ${isAr?'سنوات':'years'}: ${t('gratuity.fullGratuity')}</li>
            </ul>
          </div>
        </div>
        <div style="background:rgba(245,158,11,.08);border-radius:8px;padding:10px;margin-top:12px;font-size:12px;color:#92400e">
          <i class="fas fa-exclamation-triangle"></i> ${t('gratuity.infoDisclaimer')}
        </div>
      </div>
      <div style="margin-top:16px;text-align:center">
        <button class="btn btn-secondary" onclick="App.closeModal()">${t('common.close')}</button>
      </div>
    `);
  },

  exportExcel() {
    const employees = DB.employees.filter(e => e.hireDate);
    if (!employees.length) { App.toast(t('gratuity.noExportData'),'warning'); return; }

    const rows = employees.map(emp => {
      const dept   = DB.getDepartment(emp.dept)?.name || '—';
      const term   = this.calc(emp,'termination');
      const resign = this.calc(emp,'resign');
      return {
        [t('gratuity.exportEmployee')]:   emp.name||'',
        [t('gratuity.exportEmpNo')]:      emp.no||'',
        [t('gratuity.exportDept')]:       dept,
        [t('gratuity.exportHireDate')]:   emp.hireDate||'',
        [t('gratuity.exportYears')]:      term.years,
        [t('gratuity.exportSalary')]:     emp.salary||0,
        [t('gratuity.exportTermination')]:term.gratuity,
        [t('gratuity.exportResignation')]:resign.gratuity,
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
    App.toast('✅ ' + t('gratuity.toastExported'),'success');
  },
};
