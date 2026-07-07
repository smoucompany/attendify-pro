/* =========================================================
   PAYROLL MODULE — Salary calculation and payslips
   ========================================================= */

const PayrollModule = {

  _currentPeriod: null,

  _getPeriod() {
    if (!this._currentPeriod) {
      const now = new Date();
      this._currentPeriod = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
    }
    return this._currentPeriod;
  },

  render(container) {
    // Auto-calculate deductions for current period before rendering
    this._autoCalc();

    const period          = this._getPeriod();
    const periodPayroll   = DB.payroll.filter(p => p.period === period);

    const totalBase       = periodPayroll.reduce((s,p) => s + (p.base||0), 0);
    const totalNet        = periodPayroll.reduce((s,p) => s + (p.total||0), 0);
    const totalDeductions = periodPayroll.reduce((s,p) => s + (p.absentDeduction||0) + (p.lateDeduction||0) + (p.customDeduction||0), 0);
    const totalAbsent     = periodPayroll.reduce((s,p) => s + (p.absentDays||0), 0);

    container.innerHTML = `
      <div class="page-header">
        <div class="page-header-text">
          <h1>${t('payroll.title')}</h1>
          <p>${t('payroll.subtitle')} — ${new Date().toLocaleDateString(currentLang==='ar'?'ar-SA':'en-US',{year:'numeric',month:'long'})}</p>
        </div>
        <div class="page-header-actions">
          <button class="btn btn-secondary" onclick="PayrollModule.exportPayroll()"><i class="fas fa-file-excel"></i> ${t('common.export')}</button>
          <button class="btn btn-primary" onclick="PayrollModule.runPayroll()"><i class="fas fa-cogs"></i> ${t('payroll.runPayroll')}</button>
        </div>
      </div>

      <!-- Summary Cards -->
      <div class="stat-cards" style="margin-bottom:20px">
        <div class="stat-card primary stagger-item">
          <div class="stat-icon gradient-primary"><i class="fas fa-users"></i></div>
          <div class="stat-info"><div class="stat-value">${periodPayroll.length}</div><div class="stat-label">${t('payroll.employeesInPayroll')}</div></div>
        </div>
        <div class="stat-card success stagger-item">
          <div class="stat-icon gradient-success"><i class="fas fa-money-bill-wave"></i></div>
          <div class="stat-info"><div class="stat-value">${App.formatCurrency(totalNet)}</div><div class="stat-label">${t('payroll.totalNetSalary')}</div></div>
        </div>
        <div class="stat-card danger stagger-item">
          <div class="stat-icon gradient-danger"><i class="fas fa-circle-minus"></i></div>
          <div class="stat-info"><div class="stat-value">${App.formatCurrency(totalDeductions)}</div><div class="stat-label">${t('payroll.deductions')}</div></div>
        </div>
        <div class="stat-card warning stagger-item">
          <div class="stat-icon gradient-warning"><i class="fas fa-user-xmark"></i></div>
          <div class="stat-info"><div class="stat-value">${totalAbsent}</div><div class="stat-label">${t('payroll.totalAbsentDays')}</div></div>
        </div>
      </div>

      <!-- Payroll Period Selector -->
      <div class="card" style="margin-bottom:20px">
        <div class="card-body" style="display:flex;gap:12px;align-items:center;flex-wrap:wrap">
          <div style="font-size:13px;font-weight:700;color:var(--text-secondary)">${t('payroll.period')}:</div>
          ${(() => {
            const months = [];
            const now = new Date();
            for (let i = 0; i < 6; i++) {
              const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
              months.push(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`);
            }
            const cur = this._getPeriod();
            return months.map(p => `
              <button class="btn ${p===cur?'btn-primary':'btn-secondary'} btn-sm"
                onclick="PayrollModule._currentPeriod='${p}'; PayrollModule.render(document.getElementById('page-content'))">
                ${new Date(p+'-01').toLocaleDateString(currentLang==='ar'?'ar-SA':'en-US',{year:'numeric',month:'long'})}
              </button>
            `).join('');
          })()}
        </div>
      </div>

      <!-- Payroll Table -->
      ${(() => {
        const ar = currentLang === 'ar';
        return `
        <div class="table-wrapper" style="margin-bottom:20px">
          <table class="data-table">
            <thead><tr>
              <th>${t('common.name')}</th>
              <th>${t('payroll.baseSalary')}</th>
              <th>${t('payroll.absentDaysCol')}</th>
              <th>${t('payroll.deductions')}</th>
              <th>${t('payroll.netSalary')}</th>
              <th>${t('common.actions')}</th>
            </tr></thead>
            <tbody>
              ${periodPayroll.map(p => {
                const emp = DB.getEmployee(p.empId);
                const ded = (p.absentDeduction||0) + (p.lateDeduction||0) + (p.customDeduction||0);
                return `
                  <tr class="stagger-item">
                    <td>
                      <div class="table-avatar">
                        ${App.renderAvatar(emp, 30, 8)}
                        <div class="avatar-info">
                          <div class="avatar-name">${emp?.name||'—'}</div>
                          <div class="avatar-sub">${emp?.position||''}</div>
                        </div>
                      </div>
                    </td>
                    <td style="font-weight:600">${App.formatCurrency(p.base)}</td>
                    <td style="color:${(p.absentDays||0)>0?'var(--danger)':'var(--text-muted)'}">
                      ${(p.absentDays||0)>0 ? `<strong>${p.absentDays}</strong> ${t('common.dayAbbr')}` : '—'}
                    </td>
                    <td style="color:var(--danger)">${ded>0?'-'+App.formatCurrency(ded):'<span style="color:var(--text-muted)">—</span>'}</td>
                    <td style="font-weight:800;color:var(--primary);font-size:14px">${App.formatCurrency(p.total)}</td>
                    <td><button class="btn btn-outline-primary btn-sm" onclick="PayrollModule.viewPayslip('${p.empId}')"><i class="fas fa-file-invoice-dollar"></i> ${t('payroll.payslip')}</button></td>
                  </tr>`;
              }).join('')}
            </tbody>
            <tfoot>
              <tr style="background:linear-gradient(135deg,rgba(99,102,241,.09),rgba(139,92,246,.09));border-top:3px solid var(--primary);font-weight:900;font-size:17px">
                <td style="color:var(--primary);font-size:15px;letter-spacing:.3px;white-space:nowrap">${t('common.total')}</td>
                <td style="color:var(--text-primary);font-size:17px">${App.formatCurrency(totalBase)}</td>
                <td style="color:${totalAbsent>0?'#ef4444':'var(--text-muted)'};font-size:17px">
                  ${totalAbsent>0 ? `${totalAbsent} ${t('common.dayAbbr')}` : '—'}
                </td>
                <td style="color:#ef4444;font-size:17px">-${App.formatCurrency(totalDeductions)}</td>
                <td style="color:#6366f1;font-size:22px;font-weight:900;letter-spacing:-.5px">${App.formatCurrency(totalNet)}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>`;
      })()}

      <!-- Payroll Chart -->
      <div class="card">
        <div class="card-header">
          <h3><i class="fas fa-chart-bar" style="color:var(--primary)"></i> ${t('payroll.salaryDist')}</h3>
        </div>
        <div class="card-body">
          <div class="chart-container" style="height:220px"><canvas id="payroll-chart"></canvas></div>
        </div>
      </div>
    `;

    setTimeout(() => this._renderPayrollChart(), 100);
  },

  viewPayslip(empId) {
    const ar      = currentLang === 'ar';
    const emp     = DB.getEmployee(empId);
    const period  = this._getPeriod();
    const payroll = DB.payroll.find(p => p.empId === empId && p.period === period);
    if (!emp || !payroll) return;

    const deductions  = (payroll.absentDeduction||0) + (payroll.lateDeduction||0) + (payroll.customDeduction||0) + (payroll.loanDeduction||0);
    const gross       = (payroll.base||0);
    const dept        = DB.getDepartment(emp.dept)?.name || '—';
    const periodLabel = new Date(((payroll.period||this._getPeriod())+'-01')).toLocaleDateString(currentLang==='ar'?'ar-SA':'en-US',{year:'numeric',month:'long'});
    const customDeds  = typeof DeductionsModule !== 'undefined'
      ? DB.deductions.filter(d => d.empId === empId && d.period === (payroll.period||this._getPeriod()) && d.status !== 'paid')
      : [];

    App.openModal(t('payroll.payslip'), `
      <div id="payslip-print-area" style="font-family:var(--font-ar);direction:rtl">

        <!-- Header -->
        <div style="background:linear-gradient(135deg,#6366f1,#8b5cf6);color:white;padding:20px 24px;border-radius:14px 14px 0 0;display:flex;justify-content:space-between;align-items:center">
          <div>
            ${DB.company.logo ? `<img src="${DB.company.logo}" style="height:40px;border-radius:6px;margin-bottom:8px;display:block">` : ''}
            <div style="font-size:18px;font-weight:800">${_esc(DB.company.name||'الشركة')}</div>
            <div style="font-size:11px;opacity:.8;margin-top:2px">${_esc(DB.company.address||'')}</div>
          </div>
          <div style="text-align:left">
            <div style="font-size:13px;font-weight:700;opacity:.8">${t('payroll.payslip')}</div>
            <div style="font-size:16px;font-weight:800;margin-top:2px">${periodLabel}</div>
          </div>
        </div>

        <!-- Employee Info -->
        <div style="background:var(--bg-input,#f8fafc);padding:14px 24px;display:grid;grid-template-columns:repeat(4,1fr);gap:12px;border-bottom:1px solid var(--border,#e2e8f0)">
          ${[
            { label: t('payroll.empName'),        val: emp.name },
            { label: t('payroll.empNo'),          val: '#'+emp.no },
            { label: t('common.department'),      val: dept },
            { label: t('common.position'),        val: emp.position||'—' },
          ].map(f => `
            <div>
              <div style="font-size:10px;font-weight:700;color:var(--text-muted,#64748b);text-transform:uppercase;letter-spacing:.5px;margin-bottom:3px">${f.label}</div>
              <div style="font-size:13px;font-weight:700;color:var(--text-primary,#1e293b)">${_esc(f.val)}</div>
            </div>
          `).join('')}
        </div>

        <!-- Earnings + Deductions side by side -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:0;border-bottom:1px solid var(--border,#e2e8f0)">

          <!-- Earnings -->
          <div style="padding:16px 20px;border-left:1px solid var(--border,#e2e8f0)">
            <div style="font-size:11px;font-weight:800;color:#10b981;text-transform:uppercase;letter-spacing:1px;margin-bottom:10px;display:flex;align-items:center;gap:6px">
              <i class="fas fa-plus-circle"></i> ${t('payroll.entitlements')}
            </div>
            ${this._payslipRow(t('payroll.baseSalary'), payroll.base, '#10b981')}
            <div style="margin-top:10px;padding-top:8px;border-top:1.5px dashed #10b98140;display:flex;justify-content:space-between;font-weight:800">
              <span style="font-size:12px;color:var(--text-muted)">${t('payroll.grossSalary')}</span>
              <span style="color:#10b981">${App.formatCurrency(payroll.base||0)}</span>
            </div>
          </div>

          <!-- Deductions -->
          <div style="padding:16px 20px">
            <div style="font-size:11px;font-weight:800;color:#ef4444;text-transform:uppercase;letter-spacing:1px;margin-bottom:10px;display:flex;align-items:center;gap:6px">
              <i class="fas fa-minus-circle"></i> ${t('payroll.deductions')}
            </div>
            ${(payroll.base||0) === 0 ? `<div style="color:#f59e0b;font-size:11px;padding:4px 0;display:flex;align-items:center;gap:4px"><i class="fas fa-exclamation-triangle"></i> ${t('payroll.noBaseSalaryWarn')}</div>` : ''}
            ${(payroll.absentDays||0) > 0 ? this._payslipRow(`${t('payroll.absentDeduction')} (${payroll.absentDays} ${t('leaves.days')})`, payroll.absentDeduction||0, '#ef4444', true) : ''}
            ${(payroll.lateDeduction||0) > 0 ? this._payslipRow(t('payroll.lateDeductLabel'), payroll.lateDeduction, '#f59e0b', true) : ''}
            ${customDeds.map(d => {
              const tp = DeductionsModule._types[d.type] || DeductionsModule._types.other;
              return this._payslipRow(tp.label + (d.reason ? ` (${d.reason})` : ''), d.amount, '#ef4444', true);
            }).join('')}
            ${(payroll.loanDeduction||0) > 0 ? this._payslipRow(t('payroll.loanInstallment'), payroll.loanDeduction, '#8b5cf6', true) : ''}
            ${deductions === 0 && (payroll.absentDays||0) === 0 ? `<div style="color:var(--text-muted);font-size:12px;padding:6px 0">${t('payroll.noDeductions')}</div>` : ''}
            <div style="margin-top:10px;padding-top:8px;border-top:1.5px dashed #ef444440;display:flex;justify-content:space-between;font-weight:800">
              <span style="font-size:12px;color:var(--text-muted)">${t('payroll.totalDeductions')}</span>
              <span style="color:#ef4444">-${App.formatCurrency(deductions)}</span>
            </div>
          </div>
        </div>

        <!-- Net Salary -->
        <div style="background:linear-gradient(135deg,#6366f1,#8b5cf6);color:white;padding:18px 24px;border-radius:0 0 14px 14px;display:flex;justify-content:space-between;align-items:center">
          <div>
            <div style="font-size:12px;opacity:.8;font-weight:600">${t('payroll.netSalary')}</div>
            <div style="font-size:12px;opacity:.7;margin-top:2px">${_esc(DB.company.name||'')} · ${periodLabel}</div>
          </div>
          <div style="font-size:26px;font-weight:900;font-family:var(--font-en)">${App.formatCurrency(payroll.total)}</div>
        </div>

        <!-- Attendance summary -->
        <div style="padding:12px 24px;display:flex;gap:20px;border-top:1px solid var(--border,#e2e8f0);margin-top:1px;background:var(--bg-input,#f8fafc);border-radius:0 0 14px 14px">
          <div style="font-size:11px;color:var(--text-muted)">${t('payroll.workdaysStat')} <strong>${payroll.workdays||'—'}</strong></div>
          <div style="font-size:11px;color:var(--text-muted)">${t('payroll.presentStat')} <strong style="color:#10b981">${payroll.attendedDays ?? Math.max(0,(payroll.workdays||0)-(payroll.absentDays||0))}</strong></div>
          <div style="font-size:11px;color:var(--text-muted)">${t('payroll.absentStat')} <strong style="color:#ef4444">${payroll.absentDays||0}</strong></div>
        </div>
      </div>

      <div style="display:flex;gap:8px;margin-top:16px;flex-wrap:wrap">
        <button class="btn btn-primary" style="flex:1" onclick="DeductionsModule && DeductionsModule.openAdd('${emp.id}')">
          <i class="fas fa-plus"></i> ${t('payroll.addDeductionBtn')}
        </button>
        <button class="btn btn-secondary" style="flex:1" onclick="App.closeModal(); LoansModule.openAddForm('${emp.id}')">
          <i class="fas fa-hand-holding-dollar"></i> ${t('payroll.newLoanBtn')}
        </button>
        <button class="btn btn-danger" style="flex:1" onclick="PayrollModule._printPayslip()">
          <i class="fas fa-print"></i> ${t('payroll.printBtn')}
        </button>
        <button class="btn btn-secondary" onclick="App.closeModal()">${t('common.close')}</button>
      </div>
    `, { size: 'lg' });
  },

  _payslipRow(label, amount, color = 'var(--text-primary)', minus = false) {
    return `
      <div style="display:flex;justify-content:space-between;align-items:center;padding:5px 0;border-bottom:1px solid var(--border,#e2e8f0)22">
        <span style="font-size:13px;color:var(--text-secondary,#64748b)">${_esc(label)}</span>
        <span style="font-size:13px;font-weight:700;color:${color}">${minus?'-':''}${App.formatCurrency(amount)}</span>
      </div>`;
  },

  _printPayslip() {
    const area = document.getElementById('payslip-print-area');
    if (!area) return;
    const win = window.open('', '_blank');
    win.document.write(`<!DOCTYPE html><html dir="rtl"><head>
      <meta charset="UTF-8"><title>قسيمة الراتب</title>
      <link rel="stylesheet" href="${location.origin}/css/fonts.css">
      <style>
        * { box-sizing:border-box; margin:0; padding:0; }
        body { font-family:'ThmanyahSans','Cairo',sans-serif; background:#fff; padding:20px; }
        @media print { body { padding:0; } }
      </style>
    </head><body>${area.outerHTML}</body></html>`);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); win.close(); }, 500);
  },

  runPayroll() {
    const ar = currentLang === 'ar';
    App.openModal(t('payroll.runPayroll'), `
      <div class="info-box info-box-warning">
        <i class="fas fa-triangle-exclamation"></i>
        <div>
          <div style="font-weight:700">${t('payroll.confirmTitle')}</div>
          <div style="font-size:12px">${t('payroll.confirmDesc')} ${DB.payroll.length} ${t('payroll.employeeUnit')} ${t('payroll.withTotal')} ${App.formatCurrency(DB.payroll.reduce((s,p)=>s+p.total,0))}</div>
        </div>
      </div>
      <div id="payroll-progress" style="display:none;margin-top:16px">
        <div style="margin-bottom:8px;font-size:13px;color:var(--text-secondary)">${t('payroll.processing')}</div>
        <div class="progress-bar" style="height:10px"><div class="progress-fill gradient-primary" id="payroll-bar" style="width:0%;transition:width 2s"></div></div>
      </div>
      <div style="display:flex;gap:10px;margin-top:20px">
        <button class="btn btn-secondary" onclick="App.closeModal()">${t('common.cancel')}</button>
        <button class="btn btn-primary" id="run-payroll-btn" onclick="PayrollModule._doRunPayroll()">
          <i class="fas fa-cogs"></i> ${t('payroll.runPayroll')}
        </button>
      </div>
    `, { size: 'sm' });
  },

  _autoCalc() {
    const period = this._getPeriod();
    const [year, month] = period.split('-').map(Number);
    const workDayMap    = { sun:0, mon:1, tue:2, wed:3, thu:4, fri:5, sat:6 };
    const allowedDays   = new Set((DB.company.workDays||['sat','sun','mon','tue','wed','thu']).map(d => workDayMap[d]));
    const today         = new Date();
    const daysInMonth   = Math.max(28, new Date(year, month, 0).getDate());

    // ── المقام: أيام الشهر الميلادية الكاملة (28/29/30/31) ──
    // هذه هي الطريقة المعتمدة في أنظمة الرواتب:
    //   الراتب اليومي = الراتب الشهري ÷ أيام الشهر الميلادية
    // مثال: يونيو 30 يوم → راتب يومي = 2500÷30 = 83.33 ﷺ
    //        يوليو 31 يوم → راتب يومي = 2500÷31 = 80.65 ﷺ
    //        فبراير 28 يوم → راتب يومي = 2500÷28 = 89.29 ﷺ

    // ── أيام العمل المنقضية حتى اليوم (لحساب الأيام المتوقعة) ──
    // نستثني أيام العطل الرسمية بالإضافة لأيام الراحة الأسبوعية (نفس منطق تقرير الرواتب)
    const holidays = new Set((DB.company.holidays || []).map(h => h.date || h));
    let workdaysElapsed = 0;
    const lastDay = (year === today.getFullYear() && month === today.getMonth()+1)
      ? today.getDate() : daysInMonth;
    for (let d = 1; d <= lastDay; d++) {
      const dt = new Date(year, month-1, d);
      const ds = dt.toISOString().split('T')[0];
      if (allowedDays.has(dt.getDay()) && !holidays.has(ds)) workdaysElapsed++;
    }
    if (!workdaysElapsed) workdaysElapsed = 1;

    const [wsh, wsm]   = (DB.company.workStart||'08:00').split(':').map(Number);
    const [weh, wem]   = (DB.company.workEnd||'17:00').split(':').map(Number);
    const workMins     = Math.max(1, (weh*60+wem) - (wsh*60+wsm));
    const lateThresh   = DB.company.lateThreshold || 15;
    const periodAtt    = DB.attendance.filter(a => a.date?.startsWith(period));

    // Ensure payroll record exists for every active employee FOR THIS PERIOD
    DB.employees.filter(e => e.status === 'active').forEach(emp => {
      if (!DB.payroll.find(p => p.empId === emp.id && p.period === period)) {
        DB.payroll.push({
          id: DB.nextId('pay'), empId: emp.id, period,
          base: emp.salary||0, absentDeduction:0, lateDeduction:0,
          absentDays:0, customDeduction:0, total: emp.salary||0,
        });
      }
    });

    // Only update records for the current period
    DB.payroll.filter(p => p.period === period).forEach(p => {
      const emp        = DB.getEmployee(p.empId);
      if (!emp || emp.status === 'terminated') return;
      p.base = (emp.salary != null && emp.salary !== '') ? (Number(emp.salary) || p.base || 0) : (p.base || 0);

      const empAtt         = periodAtt.filter(a => a.empId === p.empId);
      const attended       = empAtt.filter(a => a.status !== 'absent').length;
      const explicitAbsent = empAtt.filter(a => a.status === 'absent').length;

      // إجازات معتمدة في هذه الفترة (لا تُحسب غياباً)
      const approvedLeaveDays = DB.leaves
        .filter(l => l.empId === p.empId && l.status === 'approved' && l.startDate?.startsWith(period))
        .reduce((s, l) => s + (Number(l.days) || 1), 0);

      // أيام الغياب = أيام صريحة + أيام منقضية بدون سجل - إجازات معتمدة
      const recordedDays = empAtt.length;
      const missingDays  = Math.max(0, workdaysElapsed - recordedDays - approvedLeaveDays);
      const absentDays   = explicitAbsent + missingDays;

      // الراتب اليومي = الراتب الشهري ÷ أيام الشهر الميلادية (30/31/28/29)
      const dailyRate  = (p.base || 0) / daysInMonth;

      // حساب التأخر يومياً حسب وردية الموظف الفعلية لذلك اليوم بالذات (تدعم تعدد الورديات)
      // وبعد خصم فترة السماح (lateThresh) من دقائق التأخير
      let lateMins = 0;
      let lateDeduction = 0;
      empAtt.forEach(a => {
        const dayLateMin = DB.getLateMinutes(p.empId, a.date, a.checkIn);
        if (dayLateMin <= 0) return;
        const dayShift = DB.getEmployeeShift(p.empId, a.date);
        const shiftStart = dayShift?.start || DB.company.workStart || '08:00';
        const [sh, sm] = shiftStart.split(':').map(Number);
        const dayShiftMins = dayShift
          ? (() => { const [eh,em]=(dayShift.end||'17:00').split(':').map(Number); let d=(eh*60+em)-(sh*60+sm); if(d<0)d+=24*60; return Math.max(1,d); })()
          : workMins;
        const dayHourlyRate = dailyRate / (dayShiftMins / 60);
        lateMins += dayLateMin;
        lateDeduction += (dayLateMin / 60) * dayHourlyRate;
      });

      const customDed = typeof DeductionsModule !== 'undefined'
        ? DeductionsModule.getTotal(p.empId, period) : 0;
      const loanDed = typeof LoansModule !== 'undefined'
        ? LoansModule.getInstallmentFor(p.empId, period) : 0;

      p.period          = period;
      p.workdays        = daysInMonth;
      p.workdaysElapsed = workdaysElapsed;
      p.attendedDays    = attended;
      p.absentDays      = absentDays;
      p.absentDeduction = Math.round(absentDays * dailyRate);
      p.lateDeduction   = Math.round(lateDeduction);
      p.customDeduction = customDed;
      p.loanDeduction   = loanDed;
      p.total = Math.max(0, (p.base||0) + (p.housing||0) + (p.transport||0) + (p.food||0) + (p.overtime||0)
        - (p.absentDeduction||0) - (p.lateDeduction||0) - (customDed||0) - (loanDed||0));
    });
    DB.save();
  },

  _doRunPayroll() {
    const btn  = document.getElementById('run-payroll-btn');
    const prog = document.getElementById('payroll-progress');
    const bar  = document.getElementById('payroll-bar');
    if (btn) { btn.disabled = true; btn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${t('payroll.processing')}`; }
    if (prog) prog.style.display = 'block';
    if (bar) bar.style.width = '30%';

    const period = this._getPeriod();
    const [year, month] = period.split('-').map(Number);

    const workDayMap  = { sun:0, mon:1, tue:2, wed:3, thu:4, fri:5, sat:6 };
    const allowedDays = new Set((DB.company.workDays||['sat','sun','mon','tue','wed','thu']).map(d => workDayMap[d]));
    const daysInMonth = Math.max(28, new Date(year, month, 0).getDate());

    // أيام العمل الكاملة للشهر — هذا هو المقام الصحيح للراتب اليومي
    // نستثني أيام العطل الرسمية بالإضافة لأيام الراحة الأسبوعية (نفس منطق تقرير الرواتب)
    const holidaysRun = new Set((DB.company.holidays || []).map(h => h.date || h));
    let workdaysInPeriod = 0;
    for (let d = 1; d <= daysInMonth; d++) {
      const dt = new Date(year, month-1, d);
      const ds = dt.toISOString().split('T')[0];
      if (allowedDays.has(dt.getDay()) && !holidaysRun.has(ds)) workdaysInPeriod++;
    }
    if (!workdaysInPeriod) workdaysInPeriod = 22;

    const [wsh, wsm] = (DB.company.workStart||'08:00').split(':').map(Number);
    const [weh, wem] = (DB.company.workEnd||'17:00').split(':').map(Number);
    const workMinutesPerDay = Math.max(1, (weh*60+wem) - (wsh*60+wsm));
    const lateThreshold = DB.company.lateThreshold || 15;

    const periodAtt = DB.attendance.filter(a => a.date && a.date.startsWith(period));

    // ── إنشاء سجلات للموظفين الجدد الذين ليس لديهم راتب ──
    DB.employees.filter(e => e.status === 'active').forEach(emp => {
      if (!DB.payroll.find(p => p.empId === emp.id)) {
        const base = emp.salary || 0;
        DB.payroll.push({
          id:              DB.nextId('pay'),
          empId:           emp.id,
          period,
          base,
          housing:         0,
          transport:       0,
          food:            0,
          overtime:        0,
          absentDeduction: 0,
          lateDeduction:   0,
          absentDays:      0,
          total:           base,
        });
      } else {
        const p = DB.payroll.find(pr => pr.empId === emp.id);
        if (p) p.base = (emp.salary != null && emp.salary !== '') ? (Number(emp.salary) || p.base || 0) : (p.base || 0);
      }
    });

    if (bar) bar.style.width = '60%';

    // عند تشغيل الرواتب يدوياً: الأيام المنقضية = الشهر كاملاً
    const workdaysElapsedFull = workdaysInPeriod;

    DB.payroll.forEach(p => {
      const emp = DB.getEmployee(p.empId);
      if (!emp || emp.status === 'terminated') return;

      const empAtt         = periodAtt.filter(a => a.empId === p.empId);
      const attendedDays   = empAtt.filter(a => a.status !== 'absent').length;
      const explicitAbsent = empAtt.filter(a => a.status === 'absent').length;

      // إجازات معتمدة في هذه الفترة
      const approvedLeaveDays = DB.leaves
        .filter(l => l.empId === p.empId && l.status === 'approved' && l.startDate?.startsWith(period))
        .reduce((s, l) => s + (Number(l.days) || 1), 0);

      const recordedDays = empAtt.length;
      const missingDays  = Math.max(0, workdaysElapsedFull - recordedDays - approvedLeaveDays);
      const absentDays   = explicitAbsent + missingDays;

      // الراتب اليومي = الراتب ÷ أيام الشهر الميلادية (30/31/28/29)
      const dailyRate  = (p.base || 0) / daysInMonth;

      // حساب التأخر يومياً حسب وردية الموظف الفعلية لذلك اليوم (تدعم تعدد الورديات)
      // وبعد خصم فترة السماح من دقائق التأخير
      let totalLateMinutes = 0;
      let lateDeduction = 0;
      empAtt.forEach(a => {
        const dayLateMin = DB.getLateMinutes(p.empId, a.date, a.checkIn);
        if (dayLateMin <= 0) return;
        const dayShift = DB.getEmployeeShift(p.empId, a.date);
        const shiftStart = dayShift?.start || DB.company.workStart || '08:00';
        const [sh, sm] = shiftStart.split(':').map(Number);
        const dayShiftMins = dayShift
          ? (() => { const [eh,em]=(dayShift.end||'17:00').split(':').map(Number); let d=(eh*60+em)-(sh*60+sm); if(d<0)d+=24*60; return Math.max(1,d); })()
          : workMinutesPerDay;
        const dayHourlyRate = dailyRate / (dayShiftMins / 60);
        totalLateMinutes += dayLateMin;
        lateDeduction += (dayLateMin / 60) * dayHourlyRate;
      });

      const customDed = typeof DeductionsModule !== 'undefined'
        ? DeductionsModule.getTotal(p.empId, period) : 0;
      const loanDed = typeof LoansModule !== 'undefined'
        ? LoansModule.getInstallmentFor(p.empId, period) : 0;

      p.period          = period;
      p.workdays        = workdaysInPeriod;
      p.attendedDays    = attendedDays;
      p.absentDays      = absentDays;
      p.absentDeduction = Math.round(absentDays * dailyRate);
      p.lateDeduction   = Math.round(lateDeduction);
      p.customDeduction = customDed;
      p.loanDeduction   = loanDed;
      p.total = Math.max(0, (p.base||0) + (p.housing||0) + (p.transport||0) + (p.food||0) + (p.overtime||0)
        - (p.absentDeduction||0) - (p.lateDeduction||0) - (customDed||0) - (loanDed||0));
    });

    if (bar) bar.style.width = '100%';
    DB.save();
    setTimeout(() => {
      App.closeModal();
      DB.logAudit('admin', `${ar?'معالجة رواتب':'Payroll processed'} ${period}`, 'Payroll',
        `${DB.payroll.length} ${ar?'موظف':'employees'}`);
      DB.addNotification({ title: 'تم صرف الرواتب', desc: `تمت معالجة رواتب ${DB.payroll.length} موظف لشهر ${period}`, type: 'system', icon: 'fas fa-money-bill-wave', iconBg: 'gradient-success' });
      App.toast(`${t('payroll.toastSuccess')} (${DB.payroll.length} ${ar?'موظف':'employees'}) ✓`, 'success');
      this.render(document.getElementById('page-content'));
    }, 500);
  },

  exportPayroll() {
    const period = this._getPeriod();
    // Sanitize cells to prevent CSV/spreadsheet formula injection (=,+,-,@,|,\t,\r)
    const _csv = v => {
      const s = String(v ?? '');
      return /^[=+\-@|]/.test(s) ? "'" + s : s;
    };
    const data = DB.payroll.filter(p => p.period === period).map(p => {
      const emp = DB.getEmployee(p.empId);
      return {
        [t('common.name')]:         _csv(emp?.name||''),
        [t('employees.employeeId')]:_csv(emp?.no||''),
        [t('payroll.baseSalary')]:  p.base||0,
        [t('payroll.deductions')]:  (p.absentDeduction||0) + (p.lateDeduction||0) + (p.customDeduction||0),
        [t('payroll.netSalary')]:   p.total||0,
      };
    });
    App.exportCSV(data, 'payroll.csv');
  },

  _renderPayrollChart() {
    const canvas = document.getElementById('payroll-chart');
    if (!canvas) return;
    const { color, grid, font } = App.getChartDefaults();
    const payroll = DB.payroll.slice(0, 8);

    const chart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: payroll.map(p => DB.getEmployee(p.empId)?.name?.split(' ')[0] || ''),
        datasets: [
          { label: t('payroll.baseSalary'), data: payroll.map(p=>p.base),       backgroundColor: '#6366f155', borderColor: '#6366f1', borderWidth: 1.5, borderRadius:6 },
          { label: t('payroll.netSalary'),  data: payroll.map(p=>p.total),      backgroundColor: '#10b98155', borderColor: '#10b981', borderWidth: 1.5, borderRadius:6 },
          { label: t('payroll.deductions'), data: payroll.map(p=>p.absentDeduction+p.lateDeduction), backgroundColor: '#ef444455', borderColor: '#ef4444', borderWidth: 1.5, borderRadius:6 },
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend:{position:'top',labels:{color,font:{family:font,size:11},usePointStyle:true}}, tooltip:{rtl:currentLang==='ar',bodyFont:{family:font},titleFont:{family:font}} },
        scales: {
          x:{grid:{color:grid},ticks:{color,font:{family:font,size:10}}},
          y:{grid:{color:grid},ticks:{color,font:{family:font,size:11}},beginAtZero:true}
        }
      }
    });
    App.registerChart('payroll', chart);
  }
};
