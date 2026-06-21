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
    const totalBase = DB.payroll.reduce((s,p) => s + p.base, 0);
    const totalNet  = DB.payroll.reduce((s,p) => s + p.total, 0);
    const totalDeductions = DB.payroll.reduce((s,p) => s + p.absentDeduction + p.lateDeduction, 0);
    const totalOvertime   = DB.payroll.reduce((s,p) => s + p.overtime, 0);

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
          <div class="stat-info"><div class="stat-value">${DB.payroll.length}</div><div class="stat-label">${currentLang==='ar'?'موظفون في الكشف':'Employees in Payroll'}</div></div>
        </div>
        <div class="stat-card success stagger-item">
          <div class="stat-icon gradient-success"><i class="fas fa-money-bill-wave"></i></div>
          <div class="stat-info"><div class="stat-value">${App.formatCurrency(totalNet)}</div><div class="stat-label">${t('payroll.netSalary')} ${currentLang==='ar'?'الإجمالي':'Total'}</div></div>
        </div>
        <div class="stat-card danger stagger-item">
          <div class="stat-icon gradient-danger"><i class="fas fa-circle-minus"></i></div>
          <div class="stat-info"><div class="stat-value">${App.formatCurrency(totalDeductions)}</div><div class="stat-label">${t('payroll.deductions')}</div></div>
        </div>
        <div class="stat-card info stagger-item">
          <div class="stat-icon gradient-cyan"><i class="fas fa-hourglass-half"></i></div>
          <div class="stat-info"><div class="stat-value">${App.formatCurrency(totalOvertime)}</div><div class="stat-label">${t('payroll.overtime')}</div></div>
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
        const hasHousing  = DB.payroll.some(p => p.housing  > 0);
        const hasTransport= DB.payroll.some(p => p.transport> 0);
        const hasFood     = DB.payroll.some(p => p.food     > 0);
        const hasOvertime = DB.payroll.some(p => p.overtime > 0);
        const ar = currentLang === 'ar';
        return `
        <div class="table-wrapper" style="margin-bottom:20px">
          <table class="data-table">
            <thead><tr>
              <th>${t('common.name')}</th>
              <th>${t('payroll.baseSalary')}</th>
              ${hasHousing   ? `<th>${t('payroll.housing')}</th>`  : ''}
              ${hasTransport ? `<th>${t('payroll.transport')}</th>`: ''}
              ${hasFood      ? `<th>${t('payroll.food')}</th>`     : ''}
              ${hasOvertime  ? `<th>${t('payroll.overtime')}</th>` : ''}
              <th>${t('payroll.deductions')}</th>
              <th>${t('payroll.netSalary')}</th>
              <th>${t('common.actions')}</th>
            </tr></thead>
            <tbody>
              ${DB.payroll.map(p => {
                const emp = DB.getEmployee(p.empId);
                const ded = (p.absentDeduction||0) + (p.lateDeduction||0);
                return `
                  <tr class="stagger-item">
                    <td>
                      <div class="table-avatar">
                        <div class="avatar ${emp?.avatarColor}" style="width:30px;height:30px;font-size:11px">${emp?.avatar||'?'}</div>
                        <div class="avatar-info">
                          <div class="avatar-name">${emp?.name||'—'}</div>
                          <div class="avatar-sub">${emp?.position||''}</div>
                        </div>
                      </div>
                    </td>
                    <td style="font-weight:600">${App.formatCurrency(p.base)}</td>
                    ${hasHousing   ? `<td style="color:var(--success)">${App.formatCurrency(p.housing)}</td>`  : ''}
                    ${hasTransport ? `<td style="color:var(--success)">${App.formatCurrency(p.transport)}</td>`: ''}
                    ${hasFood      ? `<td style="color:var(--success)">${App.formatCurrency(p.food)}</td>`     : ''}
                    ${hasOvertime  ? `<td style="color:var(--info)">${p.overtime>0?App.formatCurrency(p.overtime):'<span style="color:var(--text-muted)">—</span>'}</td>` : ''}
                    <td style="color:var(--danger)">${ded>0?'-'+App.formatCurrency(ded):'<span style="color:var(--text-muted)">—</span>'}</td>
                    <td style="font-weight:800;color:var(--primary);font-size:14px">${App.formatCurrency(p.total)}</td>
                    <td><button class="btn btn-outline-primary btn-sm" onclick="PayrollModule.viewPayslip('${p.empId}')"><i class="fas fa-file-invoice-dollar"></i> ${t('payroll.payslip')}</button></td>
                  </tr>`;
              }).join('')}
            </tbody>
            <tfoot>
              <tr style="background:var(--bg-input);font-weight:800">
                <td style="color:var(--text-primary)">${t('common.total')}</td>
                <td>${App.formatCurrency(totalBase)}</td>
                ${hasHousing   ? `<td>${App.formatCurrency(DB.payroll.reduce((s,p)=>s+(p.housing||0),0))}</td>`  : ''}
                ${hasTransport ? `<td>${App.formatCurrency(DB.payroll.reduce((s,p)=>s+(p.transport||0),0))}</td>`: ''}
                ${hasFood      ? `<td>${App.formatCurrency(DB.payroll.reduce((s,p)=>s+(p.food||0),0))}</td>`     : ''}
                ${hasOvertime  ? `<td style="color:var(--info)">${App.formatCurrency(totalOvertime)}</td>`        : ''}
                <td style="color:var(--danger)">-${App.formatCurrency(totalDeductions)}</td>
                <td style="color:var(--primary);font-size:15px">${App.formatCurrency(totalNet)}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>`;
      })()}

      <!-- Payroll Chart -->
      <div class="card">
        <div class="card-header">
          <h3><i class="fas fa-chart-bar" style="color:var(--primary)"></i> ${currentLang==='ar'?'توزيع الرواتب':'Salary Distribution'}</h3>
        </div>
        <div class="card-body">
          <div class="chart-container" style="height:220px"><canvas id="payroll-chart"></canvas></div>
        </div>
      </div>
    `;

    setTimeout(() => this._renderPayrollChart(), 100);
  },

  viewPayslip(empId) {
    const emp     = DB.getEmployee(empId);
    const payroll = DB.payroll.find(p => p.empId === empId);
    if (!emp || !payroll) return;

    const deductions  = (payroll.absentDeduction||0) + (payroll.lateDeduction||0) + (payroll.customDeduction||0);
    const allowances  = (payroll.housing||0) + (payroll.transport||0) + (payroll.food||0) + (payroll.overtime||0);
    const gross       = (payroll.base||0) + allowances;
    const dept        = DB.getDepartment(emp.dept)?.name || '—';
    const periodLabel = new Date(((payroll.period||this._getPeriod())+'-01')).toLocaleDateString(currentLang==='ar'?'ar-SA':'en-US',{year:'numeric',month:'long'});
    const customDeds  = typeof DeductionsModule !== 'undefined'
      ? DB.deductions.filter(d => d.empId === empId && d.period === (payroll.period||this._getPeriod()) && d.status === 'applied')
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
            <div style="font-size:13px;font-weight:700;opacity:.8">قسيمة الراتب</div>
            <div style="font-size:16px;font-weight:800;margin-top:2px">${periodLabel}</div>
          </div>
        </div>

        <!-- Employee Info -->
        <div style="background:var(--bg-input,#f8fafc);padding:14px 24px;display:grid;grid-template-columns:repeat(4,1fr);gap:12px;border-bottom:1px solid var(--border,#e2e8f0)">
          ${[
            { label:'اسم الموظف',   val: emp.name },
            { label:'رقم الموظف',   val: '#'+emp.no },
            { label:'القسم',         val: dept },
            { label:'المسمى الوظيفي', val: emp.position||'—' },
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
              <i class="fas fa-plus-circle"></i> الاستحقاقات
            </div>
            ${this._payslipRow('الراتب الأساسي', payroll.base, '#10b981')}
            ${(payroll.housing||0)   > 0 ? this._payslipRow('بدل السكن',     payroll.housing,   '#10b981') : ''}
            ${(payroll.transport||0) > 0 ? this._payslipRow('بدل المواصلات', payroll.transport, '#10b981') : ''}
            ${(payroll.food||0)      > 0 ? this._payslipRow('بدل الطعام',    payroll.food,      '#10b981') : ''}
            ${(payroll.overtime||0)  > 0 ? this._payslipRow('إضافي',         payroll.overtime,  '#06b6d4') : ''}
            <div style="margin-top:10px;padding-top:8px;border-top:1.5px dashed #10b98140;display:flex;justify-content:space-between;font-weight:800">
              <span style="font-size:12px;color:var(--text-muted)">إجمالي الاستحقاقات</span>
              <span style="color:#10b981">${App.formatCurrency(gross)}</span>
            </div>
          </div>

          <!-- Deductions -->
          <div style="padding:16px 20px">
            <div style="font-size:11px;font-weight:800;color:#ef4444;text-transform:uppercase;letter-spacing:1px;margin-bottom:10px;display:flex;align-items:center;gap:6px">
              <i class="fas fa-minus-circle"></i> الخصومات
            </div>
            ${(payroll.absentDeduction||0) > 0 ? this._payslipRow('خصم الغياب',  payroll.absentDeduction, '#ef4444', true) : ''}
            ${(payroll.lateDeduction||0)   > 0 ? this._payslipRow('خصم التأخير', payroll.lateDeduction,   '#f59e0b', true) : ''}
            ${customDeds.map(d => {
              const tp = DeductionsModule._types[d.type] || DeductionsModule._types.other;
              return this._payslipRow(tp.label + (d.reason ? ` (${d.reason})` : ''), d.amount, '#ef4444', true);
            }).join('')}
            ${deductions === 0 ? `<div style="color:var(--text-muted);font-size:12px;padding:6px 0">لا توجد خصومات</div>` : ''}
            <div style="margin-top:10px;padding-top:8px;border-top:1.5px dashed #ef444440;display:flex;justify-content:space-between;font-weight:800">
              <span style="font-size:12px;color:var(--text-muted)">إجمالي الخصومات</span>
              <span style="color:#ef4444">-${App.formatCurrency(deductions)}</span>
            </div>
          </div>
        </div>

        <!-- Net Salary -->
        <div style="background:linear-gradient(135deg,#6366f1,#8b5cf6);color:white;padding:18px 24px;border-radius:0 0 14px 14px;display:flex;justify-content:space-between;align-items:center">
          <div>
            <div style="font-size:12px;opacity:.8;font-weight:600">صافي الراتب</div>
            <div style="font-size:12px;opacity:.7;margin-top:2px">${_esc(DB.company.name||'')} · ${periodLabel}</div>
          </div>
          <div style="font-size:26px;font-weight:900;font-family:var(--font-en)">${App.formatCurrency(payroll.total)}</div>
        </div>

        <!-- Attendance summary -->
        <div style="padding:12px 24px;display:flex;gap:20px;border-top:1px solid var(--border,#e2e8f0);margin-top:1px;background:var(--bg-input,#f8fafc);border-radius:0 0 14px 14px">
          <div style="font-size:11px;color:var(--text-muted)">أيام العمل: <strong>${payroll.absentDays >= 0 ? '—' : '—'}</strong></div>
          <div style="font-size:11px;color:var(--text-muted)">أيام الغياب: <strong style="color:#ef4444">${payroll.absentDays||0}</strong></div>
          <div style="font-size:11px;color:var(--text-muted)">أيام الحضور: <strong style="color:#10b981">${Math.max(0, (payroll.workdays||22) - (payroll.absentDays||0))}</strong></div>
        </div>
      </div>

      <div style="display:flex;gap:10px;margin-top:16px">
        <button class="btn btn-primary" style="flex:1" onclick="DeductionsModule && DeductionsModule.openAdd('${emp.id}')">
          <i class="fas fa-plus"></i> إضافة خصم
        </button>
        <button class="btn btn-danger" style="flex:1" onclick="PayrollModule._printPayslip()">
          <i class="fas fa-print"></i> طباعة القسيمة
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
    App.openModal(t('payroll.runPayroll'), `
      <div class="info-box info-box-warning">
        <i class="fas fa-triangle-exclamation"></i>
        <div>
          <div style="font-weight:700">${currentLang==='ar'?'تأكيد معالجة الرواتب':'Confirm Payroll Processing'}</div>
          <div style="font-size:12px">${currentLang==='ar'?'سيتم معالجة رواتب':'Will process salaries for'} ${DB.payroll.length} ${currentLang==='ar'?'موظف':'employees'} ${currentLang==='ar'?'بإجمالي':'with total'} ${App.formatCurrency(DB.payroll.reduce((s,p)=>s+p.total,0))}</div>
        </div>
      </div>
      <div id="payroll-progress" style="display:none;margin-top:16px">
        <div style="margin-bottom:8px;font-size:13px;color:var(--text-secondary)">${currentLang==='ar'?'جارٍ المعالجة...':'Processing...'}</div>
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

  _doRunPayroll() {
    const btn  = document.getElementById('run-payroll-btn');
    const prog = document.getElementById('payroll-progress');
    const bar  = document.getElementById('payroll-bar');
    if (btn) { btn.disabled = true; btn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${currentLang==='ar'?'جارٍ الحساب...':'Calculating...'}`; }
    if (prog) prog.style.display = 'block';
    if (bar) bar.style.width = '30%';

    const period = this._getPeriod();
    const [year, month] = period.split('-').map(Number);

    // Count actual working days in this month
    const workDayMap = { sun:0, mon:1, tue:2, wed:3, thu:4, fri:5, sat:6 };
    const allowedDays = new Set((DB.company.workDays||['sat','sun','mon','tue','wed','thu']).map(d => workDayMap[d]));
    let workdaysInPeriod = 0;
    const daysInMonth = new Date(year, month, 0).getDate();
    for (let d = 1; d <= daysInMonth; d++) {
      if (allowedDays.has(new Date(year, month-1, d).getDay())) workdaysInPeriod++;
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
        if (p && emp.salary && p.base !== emp.salary) {
          p.base = emp.salary;
        }
      }
    });

    if (bar) bar.style.width = '60%';

    DB.payroll.forEach(p => {
      const empAtt = periodAtt.filter(a => a.empId === p.empId);
      const attendedDays = empAtt.filter(a => a.status !== 'absent').length;
      const absentDays = Math.max(0, workdaysInPeriod - attendedDays);

      const dailyRate  = p.base / workdaysInPeriod;
      const hourlyRate = dailyRate / (workMinutesPerDay / 60);

      // Late minutes: calculate from checkIn vs workStart
      let totalLateMinutes = 0;
      empAtt.forEach(a => {
        if (a.lateMinutes > 0) {
          totalLateMinutes += a.lateMinutes;
        } else if ((a.status === 'late') && a.checkIn) {
          const [ch, cm] = a.checkIn.split(':').map(Number);
          const lateMin = (ch*60+cm) - (wsh*60+wsm);
          if (lateMin > lateThreshold) totalLateMinutes += lateMin;
        }
      });

      // Overtime: explicit field or from checkOut
      let totalOvertimeMinutes = 0;
      empAtt.forEach(a => {
        if (a.overtime > 0) {
          totalOvertimeMinutes += a.overtime;
        } else if (a.checkOut) {
          const [oh, om] = a.checkOut.split(':').map(Number);
          const ot = (oh*60+om) - (weh*60+wem);
          if (ot > 0) totalOvertimeMinutes += ot;
        }
      });

      const customDed = typeof DeductionsModule !== 'undefined'
        ? DeductionsModule.getTotal(p.empId, period) : 0;

      p.period          = period;
      p.absentDays      = absentDays;
      p.absentDeduction = Math.round(absentDays * dailyRate);
      p.lateDeduction   = Math.round((totalLateMinutes / 60) * hourlyRate * 0.5);
      p.overtime        = Math.round((totalOvertimeMinutes / 60) * hourlyRate * 1.5);
      p.customDeduction = customDed;
      p.total = Math.max(0, p.base + p.housing + p.transport + p.food + p.overtime - p.absentDeduction - p.lateDeduction - customDed);
    });

    if (bar) bar.style.width = '100%';
    DB.save();
    setTimeout(() => {
      App.closeModal();
      DB.logAudit('admin', currentLang==='ar'?`معالجة رواتب ${period}`:`Payroll processed ${period}`, 'Payroll',
        `${DB.payroll.length} ${currentLang==='ar'?'موظف':'employees'}`);
      App.toast(currentLang==='ar'?`تمت معالجة رواتب ${DB.payroll.length} موظف بنجاح ✓`:`Payroll processed for ${DB.payroll.length} employees ✓`, 'success');
      this.render(document.getElementById('page-content'));
    }, 500);
  },

  exportPayroll() {
    const data = DB.payroll.map(p => {
      const emp = DB.getEmployee(p.empId);
      return {
        [t('common.name')]:         emp?.name||'',
        [t('employees.employeeId')]:emp?.no||'',
        [t('payroll.baseSalary')]:  p.base,
        [t('payroll.housing')]:     p.housing,
        [t('payroll.transport')]:   p.transport,
        [t('payroll.food')]:        p.food,
        [t('payroll.overtime')]:    p.overtime,
        [t('payroll.deductions')]:  p.absentDeduction + p.lateDeduction,
        [t('payroll.netSalary')]:   p.total,
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
        labels: payroll.map(p => DB.getEmployee(p.empId)?.name.split(' ')[0]||''),
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
