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
      <div class="table-wrapper" style="margin-bottom:20px">
        <table class="data-table">
          <thead>
            <tr>
              <th>${t('common.name')}</th>
              <th>${t('payroll.baseSalary')}</th>
              <th>${t('payroll.housing')}</th>
              <th>${t('payroll.transport')}</th>
              <th>${t('payroll.food')}</th>
              <th>${t('payroll.overtime')}</th>
              <th>${t('payroll.deductions')}</th>
              <th>${t('payroll.netSalary')}</th>
              <th>${t('common.actions')}</th>
            </tr>
          </thead>
          <tbody>
            ${DB.payroll.map(p => {
              const emp        = DB.getEmployee(p.empId);
              const deductions = p.absentDeduction + p.lateDeduction;
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
                  <td style="color:var(--success)">${App.formatCurrency(p.housing)}</td>
                  <td style="color:var(--success)">${App.formatCurrency(p.transport)}</td>
                  <td style="color:var(--success)">${App.formatCurrency(p.food)}</td>
                  <td style="color:var(--info)">${p.overtime > 0 ? App.formatCurrency(p.overtime) : '<span style="color:var(--text-muted)">—</span>'}</td>
                  <td style="color:var(--danger)">${deductions > 0 ? '-'+App.formatCurrency(deductions) : '<span style="color:var(--text-muted)">—</span>'}</td>
                  <td style="font-weight:800;color:var(--primary);font-size:14px">${App.formatCurrency(p.total)}</td>
                  <td>
                    <button class="btn btn-outline-primary btn-sm" onclick="PayrollModule.viewPayslip('${p.empId}')">
                      <i class="fas fa-file-invoice-dollar"></i> ${t('payroll.payslip')}
                    </button>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
          <tfoot>
            <tr style="background:var(--bg-input);font-weight:800">
              <td style="color:var(--text-primary)">${t('common.total')}</td>
              <td>${App.formatCurrency(totalBase)}</td>
              <td>${App.formatCurrency(DB.payroll.reduce((s,p)=>s+p.housing,0))}</td>
              <td>${App.formatCurrency(DB.payroll.reduce((s,p)=>s+p.transport,0))}</td>
              <td>${App.formatCurrency(DB.payroll.reduce((s,p)=>s+p.food,0))}</td>
              <td style="color:var(--info)">${App.formatCurrency(totalOvertime)}</td>
              <td style="color:var(--danger)">-${App.formatCurrency(totalDeductions)}</td>
              <td style="color:var(--primary);font-size:15px">${App.formatCurrency(totalNet)}</td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>

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

    const deductions = payroll.absentDeduction + payroll.lateDeduction;
    const allowances = payroll.housing + payroll.transport + payroll.food;

    App.openModal(t('payroll.payslip'), `
      <div class="payslip">
        <div class="payslip-header">
          <div class="payslip-company">${DB.company.name}</div>
          <div style="font-size:12px;color:var(--text-muted);margin-top:4px">${DB.company.address}</div>
          <div class="payslip-title">${t('payroll.payslip')} — ${new Date(((payroll.period||this._getPeriod())+'-01')).toLocaleDateString(currentLang==='ar'?'ar-SA':'en-US',{year:'numeric',month:'long'})}</div>
        </div>

        <div style="display:flex;justify-content:space-between;margin-bottom:16px;padding-bottom:12px;border-bottom:1px dashed var(--border)">
          <div>
            <div style="font-size:11px;color:var(--text-muted)">${t('common.name')}</div>
            <div style="font-weight:700;color:var(--text-primary)">${emp.name}</div>
          </div>
          <div>
            <div style="font-size:11px;color:var(--text-muted)">${t('employees.employeeId')}</div>
            <div style="font-weight:700;color:var(--text-primary)">${emp.no}</div>
          </div>
          <div>
            <div style="font-size:11px;color:var(--text-muted)">${t('common.department')}</div>
            <div style="font-weight:700;color:var(--text-primary)">${DB.getDepartment(emp.dept)?.name||''}</div>
          </div>
        </div>

        <div style="font-size:12px;font-weight:700;color:var(--text-muted);margin-bottom:8px;text-transform:uppercase;letter-spacing:1px">
          ${currentLang==='ar'?'الاستحقاقات':'Earnings'}
        </div>
        <div class="payslip-row"><span>${t('payroll.baseSalary')}</span><span style="color:var(--text-primary)">${App.formatCurrency(payroll.base)}</span></div>
        <div class="payslip-row"><span>${t('payroll.housing')}</span><span style="color:var(--success)">${App.formatCurrency(payroll.housing)}</span></div>
        <div class="payslip-row"><span>${t('payroll.transport')}</span><span style="color:var(--success)">${App.formatCurrency(payroll.transport)}</span></div>
        <div class="payslip-row"><span>${t('payroll.food')}</span><span style="color:var(--success)">${App.formatCurrency(payroll.food)}</span></div>
        ${payroll.overtime > 0 ? `<div class="payslip-row"><span>${t('payroll.overtime')}</span><span style="color:var(--info)">${App.formatCurrency(payroll.overtime)}</span></div>` : ''}

        <div style="font-size:12px;font-weight:700;color:var(--text-muted);margin:12px 0 8px;text-transform:uppercase;letter-spacing:1px">
          ${currentLang==='ar'?'الخصومات':'Deductions'}
        </div>
        ${payroll.absentDeduction > 0 ? `<div class="payslip-row"><span>${t('payroll.absentDeduction')}</span><span style="color:var(--danger)">-${App.formatCurrency(payroll.absentDeduction)}</span></div>` : ''}
        ${payroll.lateDeduction > 0 ? `<div class="payslip-row"><span>${t('payroll.lateDeduction')}</span><span style="color:var(--danger)">-${App.formatCurrency(payroll.lateDeduction)}</span></div>` : ''}
        ${deductions === 0 ? `<div class="payslip-row"><span style="color:var(--text-muted)">${currentLang==='ar'?'لا توجد خصومات':'No deductions'}</span><span>—</span></div>` : ''}

        <div style="margin-top:16px;padding:14px;background:var(--primary-bg);border-radius:10px;display:flex;justify-content:space-between;align-items:center">
          <span style="font-size:14px;font-weight:700;color:var(--text-primary)">${t('payroll.netSalary')}</span>
          <span class="payslip-total">${App.formatCurrency(payroll.total)}</span>
        </div>
      </div>
      <div style="display:flex;gap:10px;margin-top:16px">
        <button class="btn btn-danger w-full" onclick="App.printPage()"><i class="fas fa-print"></i> ${currentLang==='ar'?'طباعة القسيمة':'Print Payslip'}</button>
        <button class="btn btn-secondary w-full" onclick="App.closeModal()">${t('common.close')}</button>
      </div>
    `);
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

      p.period          = period;
      p.absentDays      = absentDays;
      p.absentDeduction = Math.round(absentDays * dailyRate);
      p.lateDeduction   = Math.round((totalLateMinutes / 60) * hourlyRate * 0.5);
      p.overtime        = Math.round((totalOvertimeMinutes / 60) * hourlyRate * 1.5);
      p.total = Math.max(0, p.base + p.housing + p.transport + p.food + p.overtime - p.absentDeduction - p.lateDeduction);
    });

    if (bar) bar.style.width = '100%';
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
