/* =========================================================
   REPORTS & ANALYTICS MODULE  —  Enhanced UI
   Report cards · Filters · Export modal · Print view
   ========================================================= */

const ReportsModule = {
  _activeReport: null,
  _activeType: null,
  _cache: {},   // يخزّن بيانات آخر تقرير عُرض على الشاشة لاستخدامها في الطباعة

  render(container) {
    const stats  = DB.getAttendanceStats();
    const today  = new Date().toLocaleDateString(currentLang==='ar'?'ar-EG':'en-US',{weekday:'long',year:'numeric',month:'long',day:'numeric'});
    const ar     = currentLang === 'ar';

    container.innerHTML = `
      <!-- Page header -->
      <div class="page-header">
        <div class="page-header-text">
          <h1>${t('reports.title')}</h1>
          <p style="color:var(--text-muted);font-size:13px">${today}</p>
        </div>
        <div class="page-header-actions" style="display:flex;gap:8px;flex-wrap:wrap">
          <button class="btn btn-secondary" onclick="ReportsModule.openExportModal()">
            <i class="fas fa-file-export"></i> ${ar?'تصدير':'Export'}
          </button>
          <button class="btn btn-secondary" onclick="ReportsModule.printReport()">
            <i class="fas fa-print"></i> ${ar?'طباعة':'Print'}
          </button>
        </div>
      </div>

      <!-- KPI quick-stats bar -->
      <div class="rpt-kpi-bar">
        ${[
          { v: stats.total,              l: ar?'إجمالي الموظفين':'Total Employees',  i:'fas fa-users',         c:'#6366f1' },
          { v: stats.present+stats.late, l: ar?'حاضر اليوم':'Present Today',        i:'fas fa-user-check',     c:'#10b981' },
          { v: stats.late,               l: ar?'متأخرون':'Late',                     i:'fas fa-clock',          c:'#f59e0b' },
          { v: stats.absent,             l: ar?'غائبون':'Absent',                    i:'fas fa-user-xmark',     c:'#ef4444' },
          { v: stats.attendanceRate+'%', l: ar?'معدل الحضور':'Attendance Rate',      i:'fas fa-percent',        c:'#8b5cf6' },
          { v: DB.leaves.filter(l=>l.status==='pending').length, l:ar?'إجازات معلقة':'Pending Leaves', i:'fas fa-calendar', c:'#06b6d4' },
        ].map(k=>`
          <div class="rpt-kpi-item">
            <span class="rpt-kpi-icon" style="background:${k.c}22;color:${k.c}"><i class="${k.i}"></i></span>
            <div>
              <div class="rpt-kpi-value">${k.v}</div>
              <div class="rpt-kpi-label">${k.l}</div>
            </div>
          </div>
        `).join('')}
      </div>

      <!-- Report type cards -->
      <div class="rpt-card-grid" id="report-types">
        ${this._reportTypes().map(r=>`
          <div class="rpt-type-card stagger-item" onclick="ReportsModule.generateReport('${r.key}')">
            <div class="rpt-type-icon ${r.color}"><i class="${r.icon}"></i></div>
            <div class="rpt-type-body">
              <div class="rpt-type-name">${t('reports.'+r.key)}</div>
              <div class="rpt-type-desc">${r.desc}</div>
            </div>
            <div class="rpt-type-arrow"><i class="fas fa-chevron-${ar?'left':'right'}"></i></div>
          </div>
        `).join('')}
      </div>

      <!-- Report area (filter + output) -->
      <div id="report-area"></div>

      <!-- Charts row -->
      <div class="grid-2" style="margin-top:24px">
        <div class="card">
          <div class="card-header">
            <h3 style="display:flex;align-items:center;gap:8px;font-size:14px;font-weight:700">
              <span style="width:28px;height:28px;background:linear-gradient(135deg,#6366f1,#8b5cf6);border-radius:8px;display:flex;align-items:center;justify-content:center;color:white;font-size:12px"><i class="fas fa-chart-bar"></i></span>
              ${ar?'الحضور حسب القسم':'Attendance by Department'}
            </h3>
          </div>
          <div class="card-body"><div class="chart-container" style="height:240px"><canvas id="dept-bar-chart"></canvas></div></div>
        </div>
        <div class="card">
          <div class="card-header">
            <h3 style="display:flex;align-items:center;gap:8px;font-size:14px;font-weight:700">
              <span style="width:28px;height:28px;background:linear-gradient(135deg,#10b981,#059669);border-radius:8px;display:flex;align-items:center;justify-content:center;color:white;font-size:12px"><i class="fas fa-chart-line"></i></span>
              ${ar?'اتجاه الحضور الشهري':'Monthly Attendance Trend'}
            </h3>
          </div>
          <div class="card-body"><div class="chart-container" style="height:240px"><canvas id="monthly-chart"></canvas></div></div>
        </div>
      </div>
    `;

    setTimeout(() => {
      this._renderDeptBarChart();
      this._renderMonthlyChart();
    }, 100);
  },

  _reportTypes() {
    const ar = currentLang === 'ar';
    return [
      { key:'attendance', icon:'fas fa-clock',           color:'gradient-primary', desc: ar?'حضور وغياب يومي وشهري للموظفين':'Daily & monthly attendance records' },
      { key:'late',       icon:'fas fa-clock-rotate-left',color:'gradient-warning', desc: ar?'التأخرات وأسبابها وتكلفتها المالية':'Late arrivals with financial impact' },
      { key:'overtime',   icon:'fas fa-hourglass-half',  color:'gradient-success', desc: ar?'ساعات العمل الإضافية وتكاليفها':'Overtime hours and associated costs' },
      { key:'leave',      icon:'fas fa-calendar-minus',  color:'gradient-danger',  desc: ar?'الإجازات المأخوذة والأرصدة المتبقية':'Leave taken and remaining balances' },
      { key:'payroll',    icon:'fas fa-money-bill-wave', color:'gradient-cyan',    desc: ar?'الرواتب والخصومات والبدلات':'Salaries, deductions & allowances' },
      { key:'summary',    icon:'fas fa-chart-line',      color:'gradient-rose',    desc: ar?'ملخص شامل لمؤشرات الأداء الرئيسية':'Comprehensive KPI performance summary' },
    ];
  },

  generateReport(type) {
    const area = document.getElementById('report-area');
    if (!area) return;
    this._activeType = type;
    const ar  = currentLang === 'ar';
    const now = new Date();
    const from = now.toISOString().slice(0,7) + '-01';
    const to   = now.toISOString().slice(0,10);
    const rpt  = this._reportTypes().find(r=>r.key===type);

    area.innerHTML = `
      <div class="card" style="margin-top:24px">
        <!-- Report header -->
        <div class="rpt-report-header">
          <div style="display:flex;align-items:center;gap:12px">
            <div class="rpt-report-icon ${rpt?.color||'gradient-primary'}"><i class="${rpt?.icon||'fas fa-chart-bar'}"></i></div>
            <div>
              <div style="font-size:15px;font-weight:800;color:var(--text-primary)">${t('reports.'+type)}</div>
              <div style="font-size:12px;color:var(--text-muted)">${rpt?.desc||''}</div>
            </div>
          </div>
          <button class="btn btn-ghost btn-icon" onclick="document.getElementById('report-area').innerHTML='';ReportsModule._activeType=null" title="${ar?'إغلاق':'Close'}">
            <i class="fas fa-xmark"></i>
          </button>
        </div>

        <!-- Filter bar -->
        <div class="rpt-filter-bar">
          <div class="rpt-filter-group">
            <label>${ar?'من':'From'}</label>
            <input class="app-form-input" type="date" id="rpt-from" value="${from}">
          </div>
          <div class="rpt-filter-group">
            <label>${ar?'إلى':'To'}</label>
            <input class="app-form-input" type="date" id="rpt-to" value="${to}">
          </div>
          <div class="rpt-filter-group">
            <label>${ar?'القسم':'Department'}</label>
            <select class="app-form-input" id="rpt-dept">
              <option value="all">${ar?'جميع الأقسام':'All Departments'}</option>
              ${DB.departments.map(d=>`<option value="${d.id}">${d.name}</option>`).join('')}
            </select>
          </div>
          <div class="rpt-filter-actions">
            <button class="btn btn-primary" onclick="ReportsModule._buildReport('${type}')">
              <i class="fas fa-magnifying-glass"></i> ${ar?'عرض التقرير':'Generate'}
            </button>
            <button class="btn btn-success" onclick="ReportsModule._exportCSVReport('${type}')">
              <i class="fas fa-file-csv"></i> CSV
            </button>
            <button class="btn btn-secondary" onclick="ReportsModule.printReport('${type}')">
              <i class="fas fa-print"></i> ${ar?'طباعة':'Print'}
            </button>
          </div>
        </div>
      </div>

      <!-- Report content -->
      <div id="report-content" style="margin-top:16px"></div>
    `;

    this._buildReport(type);
  },

  _buildReport(type) {
    const content = document.getElementById('report-content');
    if (!content) return;
    content.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;padding:48px;color:var(--text-muted)"><div class="loading-spinner" style="width:32px;height:32px;margin-${currentLang==='ar'?'left':'right'}:12px"></div> ${currentLang==='ar'?'جارٍ إنشاء التقرير...':'Generating report...'}</div>`;

    setTimeout(() => {
      const from = document.getElementById('rpt-from')?.value;
      const to   = document.getElementById('rpt-to')?.value;
      const dept = document.getElementById('rpt-dept')?.value;
      const handlers = {
        attendance: () => this._attendanceReport(content, from, to, dept),
        late:       () => this._lateReport(content, from, to, dept),
        overtime:   () => this._overtimeReport(content, from, to, dept),
        leave:      () => this._leaveReport(content, dept),
        payroll:    () => this._payrollReport(content, dept),
        summary:    () => this._summaryReport(content),
      };
      if (handlers[type]) handlers[type]();
    }, 80);
  },

  // ── HELPERS ──────────────────────────────────────────────

  // يُعيد قائمة أيام العمل في النطاق (يستثني عطل نهاية الأسبوع والإجازات الرسمية)
  _workingDays(from, to) {
    const days = [];
    const weekend = DB.company.weekend || ['friday','saturday'];
    const dayNames = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
    const holidays = (DB.company.holidays || []).map(h => h.date || h);
    for (let d = new Date(from); d <= new Date(to); d.setDate(d.getDate()+1)) {
      const ds  = d.toISOString().split('T')[0];
      const dow = dayNames[d.getDay()];
      if (!weekend.includes(dow) && !holidays.includes(ds)) days.push(ds);
    }
    return days;
  },

  // يُعيد سجلات الحضور الكاملة مع سجلات الغياب التلقائية
  _buildFullRecords(from, to, dept) {
    let emps = DB.employees.filter(e => e.status === 'active');
    if (dept && dept !== 'all') emps = emps.filter(e => e.dept === dept);

    const attMap = {};
    DB.attendance.filter(a => a.date >= from && a.date <= to).forEach(a => {
      if (!attMap[a.date]) attMap[a.date] = {};
      attMap[a.date][a.empId] = a;
    });

    const leaveDates = {}; // empId → Set of dates on leave
    DB.leaves.filter(l => l.status === 'approved').forEach(l => {
      if (!leaveDates[l.empId]) leaveDates[l.empId] = new Set();
      for (let d = new Date(l.from || l.startDate); d <= new Date(l.to || l.endDate); d.setDate(d.getDate()+1)) {
        leaveDates[l.empId].add(d.toISOString().split('T')[0]);
      }
    });

    const records = [];
    this._workingDays(from, to).forEach(dateStr => {
      emps.forEach(emp => {
        const rec = attMap[dateStr]?.[emp.id];
        if (rec) {
          records.push({ ...rec });
        } else if (leaveDates[emp.id]?.has(dateStr)) {
          records.push({ empId: emp.id, date: dateStr, status: 'leave', checkIn: null, checkOut: null, method: 'auto', _virtual: true });
        } else {
          records.push({ empId: emp.id, date: dateStr, status: 'absent', checkIn: null, checkOut: null, method: 'auto', _virtual: true });
        }
      });
    });
    return records.sort((a, b) => b.date.localeCompare(a.date) || (a.empId > b.empId ? 1 : -1));
  },

  // ── REPORT RENDERERS ─────────────────────────────────────

  _attendanceReport(container, from, to, dept) {
    const ar      = currentLang === 'ar';
    const records = this._buildFullRecords(from, to, dept);
    this._cache = { type:'attendance', from, to, dept, records };
    const present = records.filter(a => a.status === 'present').length;
    const late    = records.filter(a => a.status === 'late').length;
    const absent  = records.filter(a => a.status === 'absent').length;
    const onLeave = records.filter(a => a.status === 'leave').length;
    const total   = present + late + absent + onLeave;
    const pct     = total > 0 ? Math.round(((present+late)/total)*100) : 0;

    container.innerHTML = `
      ${this._miniStats([
        {v:total,          l:ar?'إجمالي السجلات':'Total Records',  c:'#6366f1', i:'fas fa-list'},
        {v:present,        l:ar?'حاضر':'Present',                   c:'#10b981', i:'fas fa-user-check'},
        {v:late,           l:ar?'متأخر':'Late',                     c:'#f59e0b', i:'fas fa-clock'},
        {v:absent,         l:ar?'غائب':'Absent',                    c:'#ef4444', i:'fas fa-user-xmark'},
        {v:onLeave,        l:ar?'إجازة':'On Leave',                 c:'#06b6d4', i:'fas fa-calendar-minus'},
        {v:pct+'%',        l:ar?'معدل الحضور':'Attendance Rate',    c:'#8b5cf6', i:'fas fa-percent'},
      ])}
      ${this._tableCard(
        [ar?'الموظف':'Employee', ar?'التاريخ':'Date', ar?'الدخول':'Check-in', ar?'الخروج':'Check-out', ar?'مدة العمل':'Hours', ar?'الحالة':'Status'],
        records.slice(0,100).map(a => {
          const emp  = DB.getEmployee(a.empId);
          const hrs  = a.workedMins > 0 ? `${Math.floor(a.workedMins/60)}:${String(a.workedMins%60).padStart(2,'0')}` : '—';
          return [
            `<div style="display:flex;align-items:center;gap:8px"><div class="avatar ${emp?.avatarColor||'gradient-primary'}" style="width:28px;height:28px;font-size:10px;flex-shrink:0">${emp?.avatar||'?'}</div><span style="font-weight:600;font-size:13px">${emp?.name||'—'}</span></div>`,
            `<span style="font-family:var(--font-en);color:var(--text-muted);font-size:12px">${a.date}</span>`,
            a.checkIn ? `<span style="color:var(--success);font-weight:700;font-family:var(--font-en)">${a.checkIn}</span>` : '<span style="color:var(--text-muted)">—</span>',
            a.checkOut ? `<span style="color:var(--danger);font-family:var(--font-en)">${a.checkOut}</span>` : '<span style="color:var(--text-muted)">—</span>',
            `<span style="font-family:var(--font-en)">${hrs}</span>`,
            App.getStatusBadge(a.status||'present'),
          ];
        }),
        records.length > 100 ? `<div class="rpt-more-note"><i class="fas fa-info-circle"></i> ${ar?`عرض أول 100 من ${records.length} سجل`:`Showing first 100 of ${records.length} records`}</div>` : ''
      )}
    `;
  },

  _lateReport(container, from, to, dept) {
    const ar = currentLang === 'ar';
    let lates = DB.attendance.filter(a => a.status === 'late' && a.date >= from && a.date <= to);
    if (dept !== 'all') lates = lates.filter(a => DB.getEmployee(a.empId)?.dept === dept);
    this._cache = { type:'late', from, to, dept, records: lates };

    // حساب دقائق التأخر لكل سجل بناءً على وردية الموظف الفعلية
    const _lateMin = (a) => {
      const emp = DB.getEmployee(a.empId);
      const empShift = emp?.shift ? DB.shifts.find(s => s.id === emp.shift) : null;
      const shiftStart = empShift?.start || DB.company.workPeriods?.[0]?.start || '08:00';
      const [sh, sm] = shiftStart.split(':').map(Number);
      const [ch, cm] = (a.checkIn || shiftStart).split(':').map(Number);
      return Math.max(0, (ch*60+cm) - (sh*60+sm));
    };
    const _dailyRate = (empId) => {
      const base = DB.payroll.find(p => p.empId === empId)?.base || DB.getEmployee(empId)?.salary || 0;
      return base / 30 / 8;
    };

    const totalMin  = lates.reduce((s, a) => s + _lateMin(a), 0);
    const totalCost = lates.reduce((s, a) => s + Math.round(_dailyRate(a.empId) * (_lateMin(a) / 60)), 0);

    // تجميع لكل موظف
    const empMap = {};
    lates.forEach(a => {
      const min = _lateMin(a);
      const ded = Math.round(_dailyRate(a.empId) * (min / 60));
      if (!empMap[a.empId]) empMap[a.empId] = { count: 0, totalMin: 0, totalDed: 0 };
      empMap[a.empId].count++;
      empMap[a.empId].totalMin += min;
      empMap[a.empId].totalDed += ded;
    });

    container.innerHTML = `
      ${this._miniStats([
        {v:lates.length,                  l:ar?'حالات التأخر':'Late Cases',         c:'#f59e0b', i:'fas fa-clock-rotate-left'},
        {v:Object.keys(empMap).length,    l:ar?'موظفون متأخرون':'Late Employees',    c:'#ef4444', i:'fas fa-user-clock'},
        {v:totalMin+' '+(ar?'د':'m'),     l:ar?'إجمالي الدقائق':'Total Minutes',     c:'#ef4444', i:'fas fa-stopwatch'},
        {v:App.formatCurrency(totalCost), l:ar?'إجمالي الخصومات':'Total Deductions', c:'#6366f1', i:'fas fa-money-bill-wave'},
        {v:lates.length>0?Math.round(totalMin/lates.length)+(ar?' د':' m'):'0',l:ar?'متوسط التأخر/حالة':'Avg per Case', c:'#8b5cf6', i:'fas fa-calculator'},
      ])}

      <!-- ملخص بالموظف -->
      ${Object.keys(empMap).length ? `
      <div class="card" style="margin-bottom:16px">
        <div class="card-header"><h3 style="font-size:13px;font-weight:700">${ar?'ملخص التأخرات لكل موظف':'Late Summary per Employee'}</h3></div>
        <div class="table-wrapper" style="border:none">
          <table class="data-table">
            <thead><tr>
              <th>${ar?'الموظف':'Employee'}</th>
              <th>${ar?'عدد مرات التأخر':'Times Late'}</th>
              <th>${ar?'إجمالي الدقائق':'Total Minutes'}</th>
              <th>${ar?'إجمالي الخصم':'Total Deduction'}</th>
            </tr></thead>
            <tbody>
              ${Object.entries(empMap).sort((a,b)=>b[1].totalMin-a[1].totalMin).map(([eid, d]) => {
                const emp = DB.getEmployee(eid);
                return `<tr>
                  <td><div style="display:flex;align-items:center;gap:8px"><div class="avatar ${emp?.avatarColor||'gradient-warning'}" style="width:28px;height:28px;font-size:10px">${emp?.avatar||'?'}</div><span style="font-weight:600">${emp?.name||'—'}</span></div></td>
                  <td><span class="badge badge-warning">${d.count} ${ar?'مرة':'times'}</span></td>
                  <td><span style="color:var(--warning);font-weight:700">${d.totalMin} ${ar?'د':'m'}</span></td>
                  <td><span style="color:var(--danger);font-weight:700">${App.formatCurrency(d.totalDed)}</span></td>
                </tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>` : ''}

      <!-- التفاصيل اليومية -->
      ${this._tableCard(
        [ar?'الموظف':'Employee', ar?'القسم':'Dept', ar?'التاريخ':'Date', ar?'وقت الدخول':'Check-in', ar?'التأخر (دقيقة)':'Late (min)', ar?'الخصم المقدر':'Est. Deduction'],
        lates.slice(0,100).map(a => {
          const emp  = DB.getEmployee(a.empId);
          const min  = _lateMin(a);
          const ded  = Math.round(_dailyRate(a.empId) * (min / 60));
          return [
            `<div style="display:flex;align-items:center;gap:8px"><div class="avatar ${emp?.avatarColor||'gradient-warning'}" style="width:28px;height:28px;font-size:10px;flex-shrink:0">${emp?.avatar||'?'}</div><span style="font-weight:600;font-size:13px">${emp?.name||'—'}</span></div>`,
            `<span style="font-size:12px;color:var(--text-muted)">${DB.getDepartment(emp?.dept)?.name||'—'}</span>`,
            `<span style="font-family:var(--font-en);color:var(--text-muted);font-size:12px">${a.date}</span>`,
            `<span style="color:var(--warning);font-weight:700;font-family:var(--font-en)">${a.checkIn}</span>`,
            `<span class="badge" style="background:rgba(239,68,68,0.1);color:var(--danger);border-radius:8px">+${min} ${ar?'د':'m'}</span>`,
            `<span style="color:var(--danger);font-weight:700">${ded>0?App.formatCurrency(ded):'—'}</span>`,
          ];
        })
      )}
    `;
  },

  _overtimeReport(container, from, to, dept) {
    const ar = currentLang === 'ar';
    let ots = DB.attendance.filter(a => a.overtime && a.date >= from && a.date <= to);
    if (dept !== 'all') ots = ots.filter(a => DB.getEmployee(a.empId)?.dept === dept);
    const totalHrs  = ots.reduce((s,a) => s+(parseInt(a.overtime)||0),0);
    const totalCost = ots.reduce((s,a) => { const hrs=parseInt(a.overtime)||0; return s+Math.round(((DB.payroll.find(p=>p.empId===a.empId)?.base||10000)/30/8)*hrs*1.5); },0);

    container.innerHTML = `
      ${this._miniStats([
        {v:ots.length,               l:ar?'سجلات إضافي':'OT Records',    c:'#10b981', i:'fas fa-hourglass-half'},
        {v:totalHrs+' '+(ar?'س':'h'),l:ar?'إجمالي الساعات':'Total Hours', c:'#6366f1', i:'fas fa-clock'},
        {v:App.formatCurrency(totalCost), l:ar?'إجمالي التكاليف':'Total Cost',  c:'#8b5cf6', i:'fas fa-money-bill'},
        {v:ots.length>0?Math.round(totalHrs/ots.length)+(ar?' س':' h'):'0', l:ar?'متوسط/سجل':'Avg/Record', c:'#06b6d4', i:'fas fa-calculator'},
      ])}
      ${this._tableCard(
        [ar?'الموظف':'Employee', ar?'التاريخ':'Date', ar?'ساعات إضافي':'OT Hours', ar?'المعدل':'Rate', ar?'التكلفة':'Cost'],
        ots.slice(0,50).map(a => {
          const emp  = DB.getEmployee(a.empId);
          const hrs  = parseInt(a.overtime)||0;
          const rate = Math.round((DB.payroll.find(p=>p.empId===a.empId)?.base||10000)/30/8);
          const cost = Math.round(rate*hrs*1.5);
          return [
            `<div style="display:flex;align-items:center;gap:8px"><div class="avatar ${emp?.avatarColor||'gradient-success'}" style="width:30px;height:30px;font-size:11px;flex-shrink:0">${emp?.avatar||'?'}</div><span style="font-weight:600">${emp?.name||'—'}</span></div>`,
            `<span style="font-family:var(--font-en);color:var(--text-muted)">${a.date}</span>`,
            `<span class="badge" style="background:rgba(16,185,129,0.12);color:var(--success);border-radius:8px;font-weight:700">${a.overtime}</span>`,
            `<span style="color:var(--text-muted)">${App.formatCurrency(rate)}/h × 1.5</span>`,
            `<span style="color:var(--success);font-weight:700">${App.formatCurrency(cost)}</span>`,
          ];
        })
      )}
    `;
  },

  _leaveReport(container, dept) {
    const ar = currentLang === 'ar';
    let leaves = [...DB.leaves];
    if (dept !== 'all') leaves = leaves.filter(l => DB.getEmployee(l.empId)?.dept === dept);
    const approved = leaves.filter(l=>l.status==='approved').length;
    const pending  = leaves.filter(l=>l.status==='pending').length;
    const totalDays = leaves.reduce((s,l)=>s+(l.days||0),0);

    container.innerHTML = `
      ${this._miniStats([
        {v:leaves.length, l:ar?'إجمالي طلبات الإجازة':'Total Requests', c:'#6366f1', i:'fas fa-calendar'},
        {v:approved,      l:ar?'معتمدة':'Approved',                      c:'#10b981', i:'fas fa-check-circle'},
        {v:pending,       l:ar?'معلقة':'Pending',                        c:'#f59e0b', i:'fas fa-hourglass'},
        {v:totalDays,     l:ar?'إجمالي الأيام':'Total Days',             c:'#8b5cf6', i:'fas fa-calendar-days'},
      ])}
      ${this._tableCard(
        [ar?'الموظف':'Employee', ar?'نوع الإجازة':'Leave Type', ar?'من':'From', ar?'إلى':'To', ar?'الأيام':'Days', ar?'الحالة':'Status'],
        leaves.map(l => {
          const emp  = DB.getEmployee(l.empId);
          const type = App.getLeaveTypeLabel(l.type);
          return [
            `<div style="display:flex;align-items:center;gap:8px"><div class="avatar ${emp?.avatarColor||'gradient-primary'}" style="width:30px;height:30px;font-size:11px;flex-shrink:0">${emp?.avatar||'?'}</div><span style="font-weight:600">${emp?.name||'—'}</span></div>`,
            `<span style="color:${type.color};font-weight:600">${type.label}</span>`,
            `<span style="font-family:var(--font-en);color:var(--text-muted)">${App.formatDate(l.from)}</span>`,
            `<span style="font-family:var(--font-en);color:var(--text-muted)">${App.formatDate(l.to)}</span>`,
            `<span style="font-weight:700;color:var(--primary)">${l.days} ${ar?'أيام':'days'}</span>`,
            App.getStatusBadge(l.status),
          ];
        })
      )}
    `;
  },

  _payrollReport(container, dept) {
    const ar   = currentLang === 'ar';
    const from = document.getElementById('rpt-from')?.value || new Date().toISOString().slice(0,7)+'-01';
    const to   = document.getElementById('rpt-to')?.value   || new Date().toISOString().slice(0,10);

    let emps = DB.employees.filter(e => e.status === 'active');
    if (dept !== 'all') emps = emps.filter(e => e.dept === dept);

    const workingDayCount = this._workingDays(from, to).length;

    // حساب الرواتب ديناميكياً من بيانات الحضور الفعلية
    const rows = emps.map(emp => {
      const payRec  = DB.payroll.find(p => p.empId === emp.id);
      const base    = payRec?.base || emp.salary || 0;
      const housing = payRec?.housing   ?? Math.round(base * 0.25);
      const transp  = payRec?.transport ?? Math.round(base * 0.10);
      const food    = payRec?.food      ?? Math.round(base * 0.05);
      const allow   = housing + transp + food;

      // سجلات الحضور في الفترة
      const attRecs = DB.attendance.filter(a => a.empId === emp.id && a.date >= from && a.date <= to);

      // عدد أيام الغياب الفعلي
      const empShift   = emp.shift ? DB.shifts.find(s => s.id === emp.shift) : null;
      const shiftStart = empShift?.start || DB.company.workPeriods?.[0]?.start || '08:00';
      const lateThresh = DB.company.lateThreshold || 15;
      const [sh, sm]   = shiftStart.split(':').map(Number);

      // أيام الإجازة الموافق عليها
      const leaveDays = new Set();
      DB.leaves.filter(l => l.empId === emp.id && l.status === 'approved').forEach(l => {
        for (let d = new Date(l.from || l.startDate); d <= new Date(l.to || l.endDate); d.setDate(d.getDate()+1))
          leaveDays.add(d.toISOString().split('T')[0]);
      });

      const workDays  = this._workingDays(from, to);
      let absentDays  = 0;
      let lateMins    = 0;
      let overtimeMins = 0;

      workDays.forEach(dateStr => {
        if (leaveDays.has(dateStr)) return;
        const rec = attRecs.find(a => a.date === dateStr);
        if (!rec) {
          absentDays++;
        } else {
          // حساب التأخر
          if (rec.checkIn) {
            const [ch, cm] = rec.checkIn.split(':').map(Number);
            const diff = (ch*60+cm) - (sh*60+sm);
            if (diff > lateThresh) lateMins += diff;
          }
          // حساب الأوفرتايم
          if (rec.workedMins) {
            const shiftHours = empShift ? (() => {
              const [eh, em] = (empShift.end||'17:00').split(':').map(Number);
              let d = (eh*60+em) - (sh*60+sm); if (d < 0) d += 24*60; return d;
            })() : 8*60;
            const ot = rec.workedMins - shiftHours;
            if (ot > 30) overtimeMins += ot;
          }
        }
      });

      const dailyRate      = base / 30;
      const hourlyRate     = dailyRate / 8;
      const absentDed      = Math.round(dailyRate * absentDays);
      const lateDed        = Math.round(hourlyRate * (lateMins / 60));
      const overtimeBonus  = Math.round(hourlyRate * (overtimeMins / 60) * 1.5);
      const totalDed       = absentDed + lateDed;
      const net            = Math.max(0, base + allow + overtimeBonus - totalDed);

      return { emp, base, allow, housing, transp, food, absentDays, lateMins, absentDed, lateDed, overtimeBonus, totalDed, net, workDays: workingDayCount };
    });

    const totalBase  = rows.reduce((s, r) => s + r.base, 0);
    const totalAllow = rows.reduce((s, r) => s + r.allow, 0);
    const totalDed   = rows.reduce((s, r) => s + r.totalDed, 0);
    const totalOT    = rows.reduce((s, r) => s + r.overtimeBonus, 0);
    const totalNet   = rows.reduce((s, r) => s + r.net, 0);
    this._cache = { type:'payroll', from, to, dept, rows, totalBase, totalAllow, totalDed, totalOT, totalNet, workingDayCount };

    container.innerHTML = `
      <div style="font-size:12px;color:var(--text-muted);margin-bottom:12px;background:var(--bg-input);border-radius:8px;padding:10px 14px">
        <i class="fas fa-calendar"></i> ${ar?'الفترة:':'Period:'} <strong>${from}</strong> ${ar?'إلى':'to'} <strong>${to}</strong>
        &nbsp;|&nbsp; ${ar?'أيام العمل:':'Working days:'} <strong>${workingDayCount}</strong>
        &nbsp;|&nbsp; ${ar?'إجمالي الموظفين:':'Employees:'} <strong>${rows.length}</strong>
      </div>
      ${this._miniStats([
        {v:rows.length,               l:ar?'عدد الموظفين':'Employees',     c:'#6366f1', i:'fas fa-users'},
        {v:App.formatCurrency(totalBase),  l:ar?'إجمالي الأساسي':'Base Total',    c:'#10b981', i:'fas fa-coins'},
        {v:App.formatCurrency(totalAllow), l:ar?'إجمالي البدلات':'Allowances',    c:'#8b5cf6', i:'fas fa-plus-circle'},
        {v:App.formatCurrency(totalDed),   l:ar?'إجمالي الخصومات':'Deductions',   c:'#ef4444', i:'fas fa-minus-circle'},
        {v:App.formatCurrency(totalOT),    l:ar?'إضافي':'Overtime',               c:'#06b6d4', i:'fas fa-hourglass-half'},
        {v:App.formatCurrency(totalNet),   l:ar?'إجمالي الصافي':'Net Total',      c:'#14b8a6', i:'fas fa-money-bill-wave'},
      ])}
      ${this._tableCard(
        [ar?'الموظف':'Employee', ar?'الأساسي':'Base', ar?'البدلات':'Allowances',
         ar?'أيام الغياب':'Absent', ar?'التأخر':'Late', ar?'الخصومات':'Deductions',
         ar?'إضافي':'Overtime', ar?'الصافي':'Net'],
        rows.map(r => [
          `<div style="display:flex;align-items:center;gap:8px"><div class="avatar ${r.emp.avatarColor||'gradient-primary'}" style="width:28px;height:28px;font-size:10px;flex-shrink:0">${r.emp.avatar||'?'}</div><span style="font-weight:600;font-size:13px">${r.emp.name||'—'}</span></div>`,
          `<span style="font-weight:600">${App.formatCurrency(r.base)}</span>`,
          `<span style="color:var(--success)">${App.formatCurrency(r.allow)}</span>`,
          r.absentDays > 0
            ? `<span class="badge badge-danger">${r.absentDays} ${ar?'يوم':'days'}</span>`
            : '<span style="color:var(--text-muted)">—</span>',
          r.lateMins > 0
            ? `<span class="badge badge-warning">${r.lateMins} ${ar?'د':'m'}</span>`
            : '<span style="color:var(--text-muted)">—</span>',
          r.totalDed > 0
            ? `<span style="color:var(--danger);font-weight:700">-${App.formatCurrency(r.totalDed)}</span>`
            : '<span style="color:var(--text-muted)">—</span>',
          r.overtimeBonus > 0
            ? `<span style="color:var(--info);font-weight:700">+${App.formatCurrency(r.overtimeBonus)}</span>`
            : '<span style="color:var(--text-muted)">—</span>',
          `<span style="font-weight:800;color:var(--primary);font-size:13px">${App.formatCurrency(r.net)}</span>`,
        ]),
        `<div style="display:grid;grid-template-columns:2fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr;gap:0;border-top:2px solid var(--primary);padding:12px 16px;background:var(--bg-input)">
          <div style="font-weight:800;color:var(--text-primary)">${ar?'المجموع':'Total'}</div>
          <div style="font-weight:700">${App.formatCurrency(totalBase)}</div>
          <div style="font-weight:700;color:var(--success)">${App.formatCurrency(totalAllow)}</div>
          <div>—</div><div>—</div>
          <div style="font-weight:700;color:var(--danger)">-${App.formatCurrency(totalDed)}</div>
          <div style="font-weight:700;color:var(--info)">+${App.formatCurrency(totalOT)}</div>
          <div style="font-weight:800;color:var(--primary)">${App.formatCurrency(totalNet)}</div>
        </div>`
      )}
    `;
  },

  _summaryReport(container) {
    const ar    = currentLang === 'ar';
    const now   = new Date();
    const from  = now.toISOString().slice(0,7)+'-01';
    const to    = now.toISOString().split('T')[0];

    const todayStats = DB.getAttendanceStats();
    const monthRecs  = this._buildFullRecords(from, to, 'all');

    // إحصائيات الشهر الحالي
    const mPresent = monthRecs.filter(a => a.status === 'present').length;
    const mLate    = monthRecs.filter(a => a.status === 'late').length;
    const mAbsent  = monthRecs.filter(a => a.status === 'absent').length;
    const mLeave   = monthRecs.filter(a => a.status === 'leave').length;
    const mTotal   = mPresent + mLate + mAbsent + mLeave;
    const mRate    = mTotal > 0 ? Math.round(((mPresent+mLate)/mTotal)*100) : 0;

    const workDays  = this._workingDays(from, to).length;
    const activeEmp = DB.employees.filter(e => e.status === 'active').length;

    // حساب الأوفرتايم الفعلي
    const totalOTMins = DB.attendance
      .filter(a => a.date >= from && a.date <= to && a.workedMins > 0)
      .reduce((s, a) => {
        const emp      = DB.getEmployee(a.empId);
        const shift    = emp?.shift ? DB.shifts.find(sh => sh.id === emp.shift) : null;
        const shiftH   = shift ? (() => { const [sh,sm]=(shift.start||'08:00').split(':').map(Number); const [eh,em]=(shift.end||'17:00').split(':').map(Number); let d=(eh*60+em)-(sh*60+sm); if(d<0)d+=24*60; return d; })() : 8*60;
        return s + Math.max(0, a.workedMins - shiftH);
      }, 0);

    const pendingL = DB.leaves.filter(l=>l.status==='pending').length;
    const pendingR = DB.requests.filter(r=>r.status==='pending').length;
    const totalPay = DB.employees.filter(e=>e.status==='active').reduce((s,e)=>{
      const p = DB.payroll.find(pr => pr.empId === e.id);
      return s + (p?.total || e.salary || 0);
    }, 0);

    container.innerHTML = `
      <!-- اليوم -->
      <div style="font-size:12px;font-weight:700;color:var(--text-muted);margin-bottom:8px;text-transform:uppercase">${ar?'الوضع الحالي (اليوم)':'Current Status (Today)'}</div>
      ${this._miniStats([
        {v:todayStats.total,              l:ar?'إجمالي الموظفين':'Total Employees', c:'#6366f1', i:'fas fa-users'},
        {v:todayStats.present+todayStats.late, l:ar?'حاضرون اليوم':'Present Today', c:'#10b981', i:'fas fa-user-check'},
        {v:todayStats.late,               l:ar?'متأخرون':'Late Today',              c:'#f59e0b', i:'fas fa-clock'},
        {v:todayStats.absent,             l:ar?'غائبون':'Absent Today',             c:'#ef4444', i:'fas fa-user-xmark'},
        {v:todayStats.onLeave,            l:ar?'في إجازة':'On Leave',              c:'#06b6d4', i:'fas fa-calendar-minus'},
        {v:todayStats.attendanceRate+'%', l:ar?'معدل الحضور اليوم':'Rate Today',   c:'#8b5cf6', i:'fas fa-percent'},
      ])}

      <!-- الشهر الحالي -->
      <div style="font-size:12px;font-weight:700;color:var(--text-muted);margin:16px 0 8px;text-transform:uppercase">
        ${ar?'إحصائيات الشهر الحالي':'Current Month Statistics'}
        <span style="font-size:11px;font-weight:400;color:var(--text-muted);margin-right:8px">(${from} — ${to}) | ${ar?'أيام العمل:':'Working days:'} ${workDays}</span>
      </div>
      ${this._miniStats([
        {v:mPresent,      l:ar?'سجلات حضور':'Present Records',  c:'#10b981', i:'fas fa-user-check'},
        {v:mLate,         l:ar?'حالات تأخر':'Late Cases',        c:'#f59e0b', i:'fas fa-clock'},
        {v:mAbsent,       l:ar?'أيام غياب':'Absent Days',        c:'#ef4444', i:'fas fa-user-xmark'},
        {v:mLeave,        l:ar?'أيام إجازة':'Leave Days',        c:'#06b6d4', i:'fas fa-calendar-minus'},
        {v:mRate+'%',     l:ar?'معدل الحضور الشهري':'Monthly Rate', c:'#8b5cf6', i:'fas fa-percent'},
        {v:Math.round(totalOTMins/60)+(ar?' س':' h'), l:ar?'ساعات إضافي':'Overtime Hrs', c:'#a855f7', i:'fas fa-hourglass-half'},
        {v:pendingL+pendingR, l:ar?'طلبات معلقة':'Pending',      c:'#f43f5e', i:'fas fa-file-circle-exclamation'},
        {v:App.formatCurrency(totalPay), l:ar?'إجمالي الرواتب':'Total Payroll', c:'#14b8a6', i:'fas fa-money-bill-wave'},
      ])}

      <!-- أعلى الأقسام -->
      <div class="card" style="margin-top:16px">
        <div class="card-header"><h3 style="font-size:14px;font-weight:700">${ar?'معدل الحضور الشهري حسب القسم':'Monthly Attendance Rate by Department'}</h3></div>
        <div class="card-body" style="padding:0">
          ${DB.departments.map(d=>{
            const dEmps  = DB.employees.filter(e=>e.dept===d.id&&e.status==='active');
            const dRecs  = monthRecs.filter(a=>DB.getEmployee(a.empId)?.dept===d.id);
            const dPres  = dRecs.filter(a=>a.status==='present'||a.status==='late').length;
            const dTotal = dRecs.length;
            const pct    = dTotal>0?Math.round((dPres/dTotal)*100):0;
            const hex    = d.hex||'#6366f1';
            return `
              <div style="display:flex;align-items:center;gap:14px;padding:13px 18px;border-bottom:1px solid var(--border)">
                <div style="width:4px;height:36px;background:${hex};border-radius:2px;flex-shrink:0"></div>
                <div style="width:130px;font-size:13px;font-weight:600;color:var(--text-primary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${d.name}</div>
                <div style="flex:1;background:var(--border);border-radius:99px;height:10px;overflow:hidden">
                  <div style="height:100%;border-radius:99px;background:${hex};width:${pct}%;transition:width 0.8s cubic-bezier(0.34,1.56,0.64,1)"></div>
                </div>
                <div style="font-size:12px;font-weight:700;color:${pct>=80?'var(--success)':pct>=60?'var(--warning)':'var(--danger)'};min-width:80px;text-align:center">
                  ${dPres}/${dTotal} <span style="color:var(--text-muted)">(${pct}%)</span>
                </div>
                <div style="font-size:11px;color:var(--text-muted);min-width:50px;text-align:center">${dEmps.length} ${ar?'موظف':'emp'}</div>
              </div>`;
          }).join('')}
        </div>
      </div>
    `;
  },

  // ── UI HELPERS ───────────────────────────────────────────

  _miniStats(items) {
    return `
      <div class="rpt-mini-stats">
        ${items.map(k=>`
          <div class="rpt-mini-stat">
            <span class="rpt-mini-icon" style="background:${k.c}18;color:${k.c}"><i class="${k.i}"></i></span>
            <div>
              <div class="rpt-mini-value">${k.v}</div>
              <div class="rpt-mini-label">${k.l}</div>
            </div>
          </div>
        `).join('')}
      </div>`;
  },

  _tableCard(headers, rows, footer='') {
    const ar = currentLang === 'ar';
    if (!rows.length) return `<div class="card"><div class="card-body"><div class="empty-state" style="padding:40px 20px"><div class="empty-icon"><i class="fas fa-inbox"></i></div><div class="empty-title">${ar?'لا توجد بيانات':'No Data'}</div><p class="empty-sub">${ar?'لا توجد سجلات في النطاق المحدد':'No records found in selected range'}</p></div></div></div>`;
    return `
      <div class="card">
        <div class="table-wrapper" style="border:none">
          <table class="data-table">
            <thead><tr>${headers.map(h=>`<th>${h}</th>`).join('')}</tr></thead>
            <tbody>${rows.map(cols=>`<tr>${cols.map(c=>`<td>${c}</td>`).join('')}</tr>`).join('')}</tbody>
          </table>
          ${footer}
        </div>
      </div>`;
  },

  // ── EXPORT CSV ───────────────────────────────────────────

  _exportCSVReport(type) {
    const from = document.getElementById('rpt-from')?.value || '';
    const to   = document.getElementById('rpt-to')?.value   || '';
    const ar   = currentLang === 'ar';
    let data = [], filename = `report-${type}-${from}-${to}.csv`;

    if (type === 'attendance') {
      const rows = DB.attendance.filter(a=>(!from||a.date>=from)&&(!to||a.date<=to));
      data = rows.map(a=>{ const e=DB.getEmployee(a.empId); return { [ar?'الموظف':'Employee']:e?.name||'—', [ar?'التاريخ':'Date']:a.date, [ar?'دخول':'Check-in']:a.checkIn||'—', [ar?'خروج':'Check-out']:a.checkOut||'—', [ar?'الطريقة':'Method']:a.method||'manual', [ar?'الحالة':'Status']:a.status }; });
    } else if (type === 'late') {
      const rows = DB.attendance.filter(a=>a.status==='late'&&(!from||a.date>=from)&&(!to||a.date<=to));
      data = rows.map(a=>{ const e=DB.getEmployee(a.empId); const [h,m]=(a.checkIn||'08:00').split(':').map(Number); const min=Math.max(0,(h*60+m)-8*60); return { [ar?'الموظف':'Employee']:e?.name||'—', [ar?'التاريخ':'Date']:a.date, [ar?'وقت الدخول':'Check-in']:a.checkIn, [ar?'التأخر (دقيقة)':'Late (min)']:min }; });
    } else if (type === 'payroll') {
      data = DB.payroll.map(p=>{ const e=DB.getEmployee(p.empId); return { [ar?'الموظف':'Employee']:e?.name||'—', [ar?'الأساسي':'Base']:p.base, [ar?'الإسكان':'Housing']:p.housing, [ar?'المواصلات':'Transport']:p.transport, [ar?'الطعام':'Food']:p.food, [ar?'خصم غياب':'Absence Ded']:p.absentDeduction, [ar?'خصم تأخر':'Late Ded']:p.lateDeduction, [ar?'الصافي':'Net']:p.total }; });
    } else if (type === 'leave') {
      data = DB.leaves.map(l=>{ const e=DB.getEmployee(l.empId); return { [ar?'الموظف':'Employee']:e?.name||'—', [ar?'النوع':'Type']:l.type, [ar?'من':'From']:l.from, [ar?'إلى':'To']:l.to, [ar?'الأيام':'Days']:l.days, [ar?'الحالة':'Status']:l.status }; });
    } else if (type === 'overtime') {
      data = DB.attendance.filter(a=>a.overtime&&(!from||a.date>=from)&&(!to||a.date<=to)).map(a=>{ const e=DB.getEmployee(a.empId); return { [ar?'الموظف':'Employee']:e?.name||'—', [ar?'التاريخ':'Date']:a.date, [ar?'الساعات':'Hours']:a.overtime }; });
    }

    if (!data.length) { App.toast(ar?'لا توجد بيانات للتصدير':'No data to export','warning'); return; }
    App.exportCSV(data, filename);
  },

  // ── EXPORT MODAL ─────────────────────────────────────────

  openExportModal() {
    const ar   = currentLang === 'ar';
    const type = this._activeType;
    const now  = new Date();
    const from = now.toISOString().slice(0,7)+'-01';
    const to   = now.toISOString().slice(0,10);

    App.openModal(ar?'تصدير التقرير':'Export Report', `
      <div style="display:flex;flex-direction:column;gap:20px">

        <!-- Report type selector -->
        <div>
          <label style="font-size:12px;font-weight:700;color:var(--text-muted);display:block;margin-bottom:8px">${ar?'نوع التقرير':'Report Type'}</label>
          <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px" id="exp-type-grid">
            ${this._reportTypes().map(r=>`
              <label class="rpt-exp-type-opt ${r.key===type?'selected':''}" style="cursor:pointer">
                <input type="radio" name="exp-type" value="${r.key}" ${r.key===type?'checked':''} onchange="document.querySelectorAll('.rpt-exp-type-opt').forEach(el=>el.classList.remove('selected'));this.closest('.rpt-exp-type-opt').classList.add('selected')" style="display:none">
                <span class="stat-icon ${r.color}" style="width:32px;height:32px;font-size:13px;border-radius:9px;margin-bottom:6px"><i class="${r.icon}"></i></span>
                <span style="font-size:11.5px;font-weight:600;text-align:center;line-height:1.3">${t('reports.'+r.key)}</span>
              </label>
            `).join('')}
          </div>
        </div>

        <!-- Date range -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
          <div><label style="font-size:12px;font-weight:700;color:var(--text-muted);display:block;margin-bottom:6px">${ar?'من':'From'}</label>
            <input class="app-form-input" type="date" id="exp-from" value="${from}"></div>
          <div><label style="font-size:12px;font-weight:700;color:var(--text-muted);display:block;margin-bottom:6px">${ar?'إلى':'To'}</label>
            <input class="app-form-input" type="date" id="exp-to" value="${to}"></div>
        </div>

        <!-- Format -->
        <div>
          <label style="font-size:12px;font-weight:700;color:var(--text-muted);display:block;margin-bottom:8px">${ar?'صيغة التصدير':'Export Format'}</label>
          <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px">
            ${[
              {id:'fmt-csv',  icon:'fas fa-file-csv',  label:'CSV',             sub:ar?'Excel & Google Sheets':'Excel & Google Sheets', color:'#10b981'},
              {id:'fmt-json', icon:'fas fa-code',       label:'JSON',            sub:ar?'للمطورين':'For developers',    color:'#6366f1'},
              {id:'fmt-print',icon:'fas fa-print',      label:ar?'طباعة':'Print', sub:ar?'PDF أو ورق':'PDF or paper',   color:'#f59e0b'},
            ].map(f=>`
              <label class="rpt-exp-fmt-opt" style="cursor:pointer">
                <input type="radio" name="exp-fmt" value="${f.id.replace('fmt-','')}" ${f.id==='fmt-csv'?'checked':''} style="display:none"
                  onchange="document.querySelectorAll('.rpt-exp-fmt-opt').forEach(el=>el.classList.remove('selected'));this.closest('.rpt-exp-fmt-opt').classList.add('selected')">
                <i class="${f.icon}" style="font-size:22px;color:${f.color};margin-bottom:6px"></i>
                <span style="font-size:13px;font-weight:700">${f.label}</span>
                <span style="font-size:10.5px;color:var(--text-muted)">${f.sub}</span>
              </label>
            `).join('')}
          </div>
          <label class="rpt-exp-fmt-opt selected" style="display:none" id="fmt-csv-opt"></label>
        </div>

        <!-- Actions -->
        <div style="display:flex;gap:10px;justify-content:flex-end">
          <button class="btn btn-secondary" onclick="App.closeModal()">${ar?'إلغاء':'Cancel'}</button>
          <button class="btn btn-primary" onclick="ReportsModule._doExport()">
            <i class="fas fa-download"></i> ${ar?'تصدير':'Export'}
          </button>
        </div>
      </div>
    `);

    // pre-select the first format option visually
    setTimeout(() => {
      document.querySelector('.rpt-exp-fmt-opt')?.classList.add('selected');
    }, 10);
  },

  _doExport() {
    const typeEl = document.querySelector('input[name="exp-type"]:checked');
    const fmtEl  = document.querySelector('input[name="exp-fmt"]:checked');
    const from   = document.getElementById('exp-from')?.value || '';
    const to     = document.getElementById('exp-to')?.value   || '';
    if (!typeEl || !fmtEl) return;

    const type = typeEl.value;
    const fmt  = fmtEl.value;
    App.closeModal();

    if (fmt === 'csv') {
      // inject date range into report inputs temporarily
      this._activeType = type;
      document.getElementById('rpt-from') ? (document.getElementById('rpt-from').value=from) : null;
      document.getElementById('rpt-to')   ? (document.getElementById('rpt-to').value=to)     : null;
      this._exportCSVReport(type);
    } else if (fmt === 'json') {
      this._exportJSON(type, from, to);
    } else if (fmt === 'print') {
      this.printReport(type, from, to);
    }
  },

  _exportJSON(type, from, to) {
    const ar = currentLang === 'ar';
    let data = [];
    if (type==='attendance') data = DB.attendance.filter(a=>(!from||a.date>=from)&&(!to||a.date<=to));
    else if (type==='late')  data = DB.attendance.filter(a=>a.status==='late'&&(!from||a.date>=from)&&(!to||a.date<=to));
    else if (type==='leave') data = DB.leaves;
    else if (type==='payroll') data = DB.payroll;
    else if (type==='overtime') data = DB.attendance.filter(a=>a.overtime);
    else data = DB.attendance;

    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], {type:'application/json'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${type}-${from||'all'}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    App.toast(ar?'تم تصدير JSON بنجاح':'JSON exported successfully','success');
  },

  // ── PRINT VIEW ───────────────────────────────────────────

  printReport(type, from, to) {
    const ar  = currentLang === 'ar';
    type = type || this._activeType || this._cache.type || 'summary';
    from = from || document.getElementById('rpt-from')?.value || this._cache.from || new Date().toISOString().slice(0,7)+'-01';
    to   = to   || document.getElementById('rpt-to')?.value   || this._cache.to   || new Date().toISOString().slice(0,10);

    const company   = DB.company;
    const printDate = new Date().toLocaleDateString(ar?'ar-EG':'en-US',{year:'numeric',month:'long',day:'numeric'});
    const rangeStr  = `${from} — ${to}`;

    // ── بناء بيانات الجدول من نفس المصدر المعروض على الشاشة ──
    let headers = [], rows = [], footerRow = null;

    if (type === 'attendance') {
      // استخدام _buildFullRecords لنفس بيانات الشاشة
      const recs = (this._cache.type === 'attendance' && this._cache.records)
        ? this._cache.records
        : this._buildFullRecords(from, to, 'all');
      headers = [ar?'الموظف':'Employee', ar?'القسم':'Dept', ar?'التاريخ':'Date', ar?'دخول':'In', ar?'خروج':'Out', ar?'مدة العمل':'Hours', ar?'الحالة':'Status'];
      rows = recs.map(a => {
        const e   = DB.getEmployee(a.empId);
        const hrs = a.workedMins > 0 ? `${Math.floor(a.workedMins/60)}:${String(a.workedMins%60).padStart(2,'0')}` : '—';
        return [e?.name||'—', DB.getDepartment(e?.dept)?.name||'—', a.date, a.checkIn||'—', a.checkOut||'—', hrs, a.status];
      });

    } else if (type === 'late') {
      const lates = (this._cache.type === 'late' && this._cache.records) ? this._cache.records
        : DB.attendance.filter(a => a.status === 'late' && a.date >= from && a.date <= to);
      headers = [ar?'الموظف':'Employee', ar?'القسم':'Dept', ar?'التاريخ':'Date', ar?'وقت الدخول':'Check-in', ar?'التأخر (دقيقة)':'Late (min)'];
      rows = lates.map(a => {
        const e   = DB.getEmployee(a.empId);
        const sh  = e?.shift ? DB.shifts.find(s => s.id === e.shift) : null;
        const ws  = sh?.start || DB.company.workPeriods?.[0]?.start || '08:00';
        const [sh2,sm2] = ws.split(':').map(Number);
        const [ch,cm]   = (a.checkIn||ws).split(':').map(Number);
        const min = Math.max(0, (ch*60+cm)-(sh2*60+sm2));
        return [e?.name||'—', DB.getDepartment(e?.dept)?.name||'—', a.date, a.checkIn||'—', min+' '+(ar?'د':'m')];
      });

    } else if (type === 'payroll') {
      // استخدام الصفوف المحسوبة من _payrollReport مباشرة
      const cachedRows = this._cache.type === 'payroll' ? this._cache.rows : null;
      if (cachedRows) {
        const hasAllow = cachedRows.some(r => r.allow > 0);
        const hasOT    = cachedRows.some(r => r.overtimeBonus > 0);
        headers = [ar?'الموظف':'Employee', ar?'الأساسي':'Base',
          ...(hasAllow ? [ar?'البدلات':'Allow.'] : []),
          ar?'أيام الغياب':'Absent', ar?'خصومات':'Deductions',
          ...(hasOT ? [ar?'إضافي':'OT'] : []),
          ar?'الصافي':'Net'];
        rows = cachedRows.map(r => [
          r.emp.name,
          App.formatCurrency(r.base),
          ...(hasAllow ? [App.formatCurrency(r.allow)] : []),
          r.absentDays > 0 ? `${r.absentDays} ${ar?'يوم':'days'}` : '—',
          r.totalDed > 0 ? `-${App.formatCurrency(r.totalDed)}` : '—',
          ...(hasOT ? [r.overtimeBonus > 0 ? `+${App.formatCurrency(r.overtimeBonus)}` : '—'] : []),
          App.formatCurrency(r.net),
        ]);
        footerRow = [ar?'الإجمالي':'Total', App.formatCurrency(this._cache.totalBase),
          ...(hasAllow ? [App.formatCurrency(this._cache.totalAllow)] : []),
          '—', `-${App.formatCurrency(this._cache.totalDed)}`,
          ...(hasOT ? [`+${App.formatCurrency(this._cache.totalOT)}`] : []),
          App.formatCurrency(this._cache.totalNet)];
      } else {
        headers = [ar?'الموظف':'Employee', ar?'الأساسي':'Base', ar?'الخصومات':'Ded.', ar?'الصافي':'Net'];
        rows = DB.payroll.map(p => { const e=DB.getEmployee(p.empId); return [e?.name||'—', App.formatCurrency(p.base), App.formatCurrency((p.absentDeduction||0)+(p.lateDeduction||0)), App.formatCurrency(p.total)]; });
      }

    } else if (type === 'leave') {
      headers = [ar?'الموظف':'Employee', ar?'النوع':'Type', ar?'من':'From', ar?'إلى':'To', ar?'الأيام':'Days', ar?'الحالة':'Status'];
      rows = DB.leaves.map(l => { const e=DB.getEmployee(l.empId); return [e?.name||'—', l.type, l.from||'—', l.to||'—', l.days||'—', l.status]; });

    } else if (type === 'overtime') {
      const ots = DB.attendance.filter(a => a.overtime && a.date >= from && a.date <= to);
      headers = [ar?'الموظف':'Employee', ar?'القسم':'Dept', ar?'التاريخ':'Date', ar?'الساعات الإضافية':'OT (min)'];
      rows = ots.map(a => { const e=DB.getEmployee(a.empId); return [e?.name||'—', DB.getDepartment(e?.dept)?.name||'—', a.date, `${Math.floor(a.overtime/60)}:${String(a.overtime%60).padStart(2,'0')}`]; });

    } else {
      const s = DB.getAttendanceStats();
      headers = [ar?'المؤشر':'KPI', ar?'القيمة':'Value'];
      rows = [
        [ar?'إجمالي الموظفين':'Total Employees', s.total],
        [ar?'حاضرون اليوم':'Present Today',      s.present+s.late],
        [ar?'متأخرون اليوم':'Late Today',         s.late],
        [ar?'غائبون اليوم':'Absent Today',        s.absent],
        [ar?'في إجازة':'On Leave',                s.onLeave],
        [ar?'معدل الحضور':'Attendance Rate',      s.attendanceRate+'%'],
        [ar?'إجمالي الرواتب':'Total Payroll',     App.formatCurrency(DB.payroll.reduce((s,p)=>s+(p.total||0),0))],
      ];
    }

    const html = `<!DOCTYPE html>
<html lang="${ar?'ar':'en'}" dir="${ar?'rtl':'ltr'}">
<head>
<meta charset="UTF-8">
<title>${t('reports.'+type)} — ${company.name||'Attendify Pro'}</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:${ar?"'Cairo','Segoe UI'":"'Segoe UI','Cairo'"},sans-serif;font-size:12px;color:#1e293b;background:#fff;direction:${ar?'rtl':'ltr'}}
  .page{max-width:900px;margin:0 auto;padding:32px}
  /* Header */
  .print-header{display:flex;align-items:center;justify-content:space-between;padding-bottom:20px;border-bottom:3px solid #6366f1;margin-bottom:24px}
  .print-logo{display:flex;align-items:center;gap:12px}
  .print-logo-icon{width:48px;height:48px;background:linear-gradient(135deg,#6366f1,#8b5cf6);border-radius:14px;display:flex;align-items:center;justify-content:center;color:white;font-size:22px}
  .print-company{font-size:20px;font-weight:900;color:#1e1b4b;letter-spacing:-0.5px}
  .print-company-sub{font-size:11px;color:#6b7280;margin-top:2px}
  .print-meta{text-align:${ar?'left':'right'}}
  .print-meta-date{font-size:11px;color:#6b7280}
  .print-meta-title{font-size:14px;font-weight:800;color:#6366f1;margin-top:4px}
  /* Report header */
  .rpt-header{background:linear-gradient(135deg,#eff6ff,#eef2ff);border:1px solid rgba(99,102,241,0.2);border-radius:12px;padding:16px 20px;display:flex;align-items:center;justify-content:space-between;margin-bottom:20px}
  .rpt-header-left{display:flex;flex-direction:column;gap:3px}
  .rpt-header-title{font-size:16px;font-weight:800;color:#1e1b4b}
  .rpt-header-range{font-size:11.5px;color:#6366f1;font-weight:600}
  .rpt-header-count{font-size:11px;color:#6b7280;margin-top:4px}
  .rpt-header-badge{background:#6366f1;color:white;border-radius:8px;padding:4px 12px;font-size:11px;font-weight:700}
  /* KPI row */
  .kpi-row{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:20px}
  .kpi-box{border:1px solid #e2e8f0;border-radius:10px;padding:12px 14px;background:#f8fafc}
  .kpi-value{font-size:20px;font-weight:900;color:#1e1b4b}
  .kpi-label{font-size:10.5px;color:#64748b;margin-top:2px}
  /* Table */
  table{width:100%;border-collapse:collapse;border-radius:10px;overflow:hidden;border:1px solid #e2e8f0}
  thead tr{background:linear-gradient(135deg,#6366f1,#4f46e5);color:white}
  th{padding:10px 12px;text-align:${ar?'right':'left'};font-size:11.5px;font-weight:700}
  td{padding:9px 12px;font-size:11.5px;color:#334155;border-bottom:1px solid #f1f5f9}
  tbody tr:nth-child(even){background:#f8fafc}
  tbody tr:last-child td{border-bottom:none}
  tbody tr:hover{background:#eff6ff}
  .tfoot-row td{background:#eef2ff;font-weight:700;color:#1e1b4b;border-top:2px solid #6366f1}
  /* Footer */
  .print-footer{margin-top:32px;padding-top:16px;border-top:1px solid #e2e8f0;display:flex;justify-content:space-between;align-items:center}
  .print-footer-left{font-size:10px;color:#94a3b8}
  .print-footer-sig{text-align:${ar?'left':'right'}}
  .sig-line{border-top:1px solid #cbd5e1;width:160px;margin-top:40px;padding-top:6px;font-size:10px;color:#64748b}
  .badge-status{display:inline-block;padding:2px 8px;border-radius:6px;font-size:10.5px;font-weight:600}
  .badge-present{background:#d1fae5;color:#065f46}
  .badge-late{background:#fef3c7;color:#92400e}
  .badge-absent{background:#fee2e2;color:#991b1b}
  .badge-approved{background:#d1fae5;color:#065f46}
  .badge-pending{background:#fef3c7;color:#92400e}
  .badge-rejected{background:#fee2e2;color:#991b1b}
  @media print{
    body{print-color-adjust:exact;-webkit-print-color-adjust:exact}
    .no-print{display:none!important}
    .page{padding:20px}
  }
</style>
</head>
<body>
<div class="page">

  <!-- Print toolbar (no-print) -->
  <div class="no-print" style="display:flex;gap:8px;margin-bottom:20px;justify-content:flex-end">
    <button onclick="window.print()" style="background:#6366f1;color:white;border:none;padding:9px 20px;border-radius:9px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit">
      🖨️ ${ar?'طباعة':'Print'}
    </button>
    <button onclick="window.close()" style="background:#f1f5f9;color:#374151;border:1px solid #e2e8f0;padding:9px 20px;border-radius:9px;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit">
      ${ar?'إغلاق':'Close'}
    </button>
  </div>

  <!-- Header -->
  <div class="print-header">
    <div class="print-logo">
      <div class="print-logo-icon">📊</div>
      <div>
        <div class="print-company">${company.name||'Attendify Pro'}</div>
        <div class="print-company-sub">${ar?'نظام إدارة الحضور والانصراف':'Attendance Management System'}</div>
      </div>
    </div>
    <div class="print-meta">
      <div class="print-meta-date">${ar?'تاريخ الطباعة:':'Print Date:'} ${printDate}</div>
      <div class="print-meta-title">${t('reports.'+type)}</div>
    </div>
  </div>

  <!-- Report header box -->
  <div class="rpt-header">
    <div class="rpt-header-left">
      <div class="rpt-header-title">${t('reports.'+type)}</div>
      <div class="rpt-header-range"><i>📅</i> ${ar?'الفترة:':'Period:'} ${rangeStr}</div>
      <div class="rpt-header-count">${ar?'إجمالي السجلات:':'Total records:'} ${rows.length}</div>
    </div>
    <div class="rpt-header-badge">${company.name||'Attendify Pro'}</div>
  </div>

  <!-- KPI row -->
  ${type==='summary' ? '' : `
  <div class="kpi-row">
    ${(()=>{
      const s = DB.getAttendanceStats();
      return [
        {v:DB.employees.filter(e=>e.status==='active').length, l:ar?'موظف نشط':'Active Employees'},
        {v:rows.length, l:ar?'عدد السجلات':'Records'},
        {v:s.attendanceRate+'%', l:ar?'معدل الحضور':'Attendance Rate'},
        {v:new Date().toLocaleDateString(ar?'ar-EG':'en-US',{month:'long',year:'numeric'}), l:ar?'الشهر الحالي':'Current Month'},
      ].map(k=>`<div class="kpi-box"><div class="kpi-value">${k.v}</div><div class="kpi-label">${k.l}</div></div>`).join('');
    })()}
  </div>`}

  <!-- Table -->
  <table>
    <thead><tr>${headers.map(h=>`<th>${h}</th>`).join('')}</tr></thead>
    <tbody>
      ${rows.map(row=>`<tr>${row.map(cell=>{
        const s = String(cell);
        const statusMap = {
          present:'badge-present', حاضر:'badge-present',
          late:'badge-late', متأخر:'badge-late',
          absent:'badge-absent', غائب:'badge-absent',
          leave:'badge-pending',  إجازة:'badge-pending',
          approved:'badge-approved', معتمد:'badge-approved',
          pending:'badge-pending', معلق:'badge-pending',
          rejected:'badge-rejected', مرفوض:'badge-rejected',
        };
        const cls = statusMap[s] ? `badge-status ${statusMap[s]}` : '';
        return `<td>${cls?`<span class="${cls}">${s}</span>`:s}</td>`;
      }).join('')}</tr>`).join('')}
    </tbody>
    ${footerRow ? `<tfoot><tr class="tfoot-row">${footerRow.map(c=>`<td>${c}</td>`).join('')}</tr></tfoot>` : ''}
  </table>

  <!-- Footer -->
  <div class="print-footer">
    <div class="print-footer-left">
      <div>Attendify Pro © ${new Date().getFullYear()}</div>
      <div>${ar?'تم إنشاؤه تلقائياً — غير رسمي بدون توقيع':'Auto-generated — not official without signature'}</div>
    </div>
    <div class="print-footer-sig">
      <div class="sig-line">${ar?'توقيع المدير المسؤول':'Authorized Signature'}</div>
    </div>
  </div>

</div>
</body>
</html>`;

    const win = window.open('', '_blank', 'width=960,height=700,scrollbars=yes');
    if (!win) { App.toast(ar?'يرجى السماح بالنوافذ المنبثقة':'Please allow popups','warning'); return; }
    win.document.write(html);
    win.document.close();
  },

  // ── CHARTS ───────────────────────────────────────────────

  _renderDeptBarChart() {
    const canvas = document.getElementById('dept-bar-chart');
    if (!canvas) return;
    const { color, grid, font } = App.getChartDefaults();
    const depts  = DB.departments;
    const today  = DB.getTodayAttendance();
    const counts = depts.map(d => today.filter(a=>a.status!=='absent'&&DB.getEmployee(a.empId)?.dept===d.id).length);
    const chart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: depts.map(d=>d.name.length>8?d.name.substring(0,8)+'…':d.name),
        datasets: [{
          label: currentLang==='ar'?'حاضر':'Present',
          data: counts,
          backgroundColor: ['#6366f1','#10b981','#f59e0b','#ef4444','#06b6d4','#8b5cf6','#f43f5e'],
          borderRadius: 8, borderSkipped: false,
        }]
      },
      options: {
        responsive:true, maintainAspectRatio:false,
        plugins:{ legend:{display:false}, tooltip:{rtl:currentLang==='ar',bodyFont:{family:font},titleFont:{family:font}} },
        scales:{
          x:{grid:{color:grid},ticks:{color,font:{family:font,size:10}}},
          y:{grid:{color:grid},ticks:{color,font:{family:font,size:11}},beginAtZero:true}
        }
      }
    });
    App.registerChart('deptBar', chart);
  },

  _renderMonthlyChart() {
    const canvas = document.getElementById('monthly-chart');
    if (!canvas) return;
    const { color, grid, font } = App.getChartDefaults();
    const months = Array.from({length:6},(_,i)=>{ const d=new Date(); d.setMonth(d.getMonth()-5+i); return d.toLocaleDateString(currentLang==='ar'?'ar-SA':'en-US',{month:'short'}); });
    const data1  = Array.from({length:6},(_,i)=>{ const d=new Date(); d.setMonth(d.getMonth()-5+i); const m=d.toISOString().slice(0,7); return DB.attendance.filter(a=>a.date.startsWith(m)&&a.status==='present').length; });
    const data2  = Array.from({length:6},(_,i)=>{ const d=new Date(); d.setMonth(d.getMonth()-5+i); const m=d.toISOString().slice(0,7); return DB.attendance.filter(a=>a.date.startsWith(m)&&a.status==='late').length; });
    const chart  = new Chart(canvas, {
      type: 'line',
      data: {
        labels: months,
        datasets: [
          { label:t('attendance.present'), data:data1, borderColor:'#10b981', backgroundColor:'rgba(16,185,129,0.08)', fill:true, tension:0.4, borderWidth:2.5, pointRadius:4, pointBackgroundColor:'#10b981' },
          { label:t('attendance.late'),    data:data2, borderColor:'#f59e0b', backgroundColor:'rgba(245,158,11,0.05)', fill:true, tension:0.4, borderWidth:2.5, pointRadius:4, pointBackgroundColor:'#f59e0b' },
        ]
      },
      options: {
        responsive:true, maintainAspectRatio:false,
        plugins:{ legend:{position:'top',labels:{color,font:{family:font,size:11},usePointStyle:true}}, tooltip:{rtl:currentLang==='ar',bodyFont:{family:font},titleFont:{family:font}} },
        scales:{
          x:{grid:{color:grid},ticks:{color,font:{family:font,size:11}}},
          y:{grid:{color:grid},ticks:{color,font:{family:font,size:11}},beginAtZero:true}
        }
      }
    });
    App.registerChart('monthly', chart);
  },
};
