/* =========================================================
   DASHBOARD MODULE (Enterprise v2)
   KPI Strip · Weekly Bar Chart · Who's In · Absences · Requests
   ========================================================= */

const DashboardModule = {
  render(container) {
    this._injectCss();

    const stats   = DB.getAttendanceStats();
    const trend   = DB.getAttendanceTrend();
    const counts  = DB.getPendingCount();
    const today   = DB.getTodayAttendance();
    const todayStr = new Date().toISOString().split('T')[0];
    const ar = currentLang === 'ar';

    // ── Derived metrics ──────────────────────────────────
    const totalActive = stats.total || 0;
    const presentNow  = stats.present + stats.late;
    const presentPct  = totalActive ? Math.round((presentNow / totalActive) * 100) : 0;
    const latePct     = totalActive ? Math.round((stats.late / totalActive) * 100) : 0;

    // Monthly compliance: avg attendance rate over work days this month
    const monthStart = todayStr.slice(0, 7) + '-01';
    const monthTrend = trend.filter(d => d.date >= monthStart);
    const compliance = (() => {
      const days = monthTrend.filter(d => d.total > 0);
      if (!days.length) return stats.attendanceRate;
      const sum = days.reduce((acc, d) => acc + ((d.present + d.late) / (d.total || 1)) * 100, 0);
      return Math.round(sum / days.length);
    })();
    const prevRate = trend.length > 1 ? (() => {
      const d = trend[trend.length - 2];
      return d.total ? Math.round(((d.present + d.late) / d.total) * 100) : 0;
    })() : stats.attendanceRate;
    const complianceTrend = stats.attendanceRate - prevRate;

    // Greeting
    const hour = new Date().getHours();
    const greet = hour < 12 ? (ar ? 'صباح الخير' : 'Good morning')
                : hour < 18 ? (ar ? 'مساء الخير' : 'Good afternoon')
                : (ar ? 'مساء الخير' : 'Good evening');
    const userName = App.state.user?.name || (ar ? 'المدير' : 'Admin');
    const dateLabel = new Date().toLocaleDateString(ar ? 'ar-SA' : 'en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const statusLabel = ar
      ? `${presentNow} من ${totalActive} موظف حاضر اليوم`
      : `${presentNow} of ${totalActive} present today`;

    container.innerHTML = `
      <div class="dashboard-enterprise">

        <!-- Greeting Bar -->
        <div class="db-greeting">
          <div>
            <h1 class="db-greeting-title">${greet}، ${DashboardModule._escape(userName)} 👋</h1>
            <p class="db-greeting-sub">${dateLabel} · ${statusLabel}</p>
          </div>
          <div class="db-greeting-actions">
            <button class="btn btn-secondary" onclick="App.printPage()"><i class="fas fa-print"></i> ${t('common.print')}</button>
            <button class="btn btn-secondary" onclick="EmployeesModule.openAdd()"><i class="fas fa-user-plus"></i> ${ar ? 'موظف جديد' : 'New Employee'}</button>
            <button class="btn btn-primary" onclick="App.navigate('attendance')"><i class="fas fa-clock"></i> ${t('dashboard.checkinNow')}</button>
          </div>
        </div>

        <!-- KPI Strip -->
        <div class="db-kpi-strip">
          ${this._kpi(ar ? 'إجمالي الموظفين' : 'Total Employees', totalActive, 'fas fa-users', 'tint-primary',
            `${totalActive} ${ar ? 'نشط' : 'active'}`, 'neutral')}

          ${this._kpi(ar ? 'الحاضرون اليوم' : 'Present Today', presentNow, 'fas fa-user-check', 'tint-success',
            `${presentPct}% ${ar ? 'من الفريق' : 'of team'}`, presentPct >= 70 ? 'up' : 'neutral')}

          ${this._kpiBar(ar ? 'المتأخرون اليوم' : 'Late Today', stats.late, 'fas fa-clock', 'tint-warning', latePct)}

          ${this._kpi(ar ? 'الغائبون اليوم' : 'Absent Today', stats.absent, 'fas fa-user-xmark', 'tint-danger',
            `${ar ? 'إجازة' : 'On leave'}: ${stats.onLeave}`, stats.absent > 0 ? 'down' : 'neutral')}

          ${this._kpiBig(ar ? 'الالتزام الشهري' : 'Monthly Compliance', compliance + '%', 'fas fa-chart-line',
            complianceTrend, ar)}
        </div>

        <!-- Middle Row -->
        <div class="db-mid-row">
          <!-- Weekly attendance chart -->
          <div class="db-chart-panel card">
            <div class="card-header">
              <h3><i class="fas fa-chart-column" style="color:var(--primary)"></i> ${ar ? 'حضور الأسبوع' : 'Weekly Attendance'}</h3>
              <div style="display:flex;gap:10px;align-items:center;font-size:11px;color:var(--text-muted)">
                <span class="db-legend-dot" style="background:#5B5BD6"></span>${t('attendance.present')}
                <span class="db-legend-dot" style="background:#F59E0B"></span>${t('attendance.late')}
                <span class="db-legend-dot" style="background:#EF4444"></span>${ar ? 'غائب' : 'Absent'}
              </div>
            </div>
            <div class="card-body">
              <div class="chart-container" style="height:280px">
                <canvas id="db-week-chart"></canvas>
              </div>
            </div>
          </div>

          <!-- Who's in now -->
          <div class="db-who-panel card">
            <div class="card-header">
              <h3><i class="fas fa-circle" style="color:var(--success);font-size:9px"></i> ${ar ? 'في المكتب الآن' : 'In the Office Now'}</h3>
              <span class="badge badge-success">${presentNow}</span>
            </div>
            <div class="card-body" style="padding:6px">
              ${this._whosIn(today, ar)}
            </div>
          </div>
        </div>

        <!-- Bottom Row -->
        <div class="db-bottom-row">
          <!-- Recent absences -->
          <div class="db-absences-panel card">
            <div class="card-header">
              <h3><i class="fas fa-user-clock" style="color:var(--danger)"></i> ${ar ? 'آخر التغيبات' : 'Recent Absences'}</h3>
              <button class="btn-text" onclick="App.navigate('attendance')">${t('common.view')} ${t('common.all')}</button>
            </div>
            <div class="card-body" style="padding:0">
              ${this._absences(today, todayStr, ar)}
            </div>
          </div>

          <!-- Pending requests -->
          <div class="db-requests-panel card">
            <div class="card-header">
              <h3><i class="fas fa-inbox" style="color:var(--warning)"></i> ${ar ? 'الطلبات المعلقة' : 'Pending Requests'}</h3>
              <span class="badge badge-warning">${counts.leaves + counts.requests}</span>
            </div>
            <div class="card-body" style="padding:8px">
              ${this._pendingRequests(ar)}
            </div>
          </div>
        </div>

      </div>
    `;

    setTimeout(() => this._renderWeekChart(trend, ar), 80);
  },

  // ── KPI tiles ────────────────────────────────────────
  _kpi(label, value, icon, tint, change, dir) {
    const dirIcon = { up: 'fa-arrow-up', down: 'fa-arrow-down', neutral: 'fa-minus' }[dir] || 'fa-minus';
    return `
      <div class="db-kpi stagger-item">
        <div class="db-kpi-top">
          <span class="db-kpi-icon ${tint}"><i class="${icon}"></i></span>
          <span class="db-kpi-change ${dir}"><i class="fas ${dirIcon}"></i> ${change}</span>
        </div>
        <div class="db-kpi-value">${value}</div>
        <div class="db-kpi-label">${label}</div>
      </div>
    `;
  },

  _kpiBar(label, value, icon, tint, pct) {
    return `
      <div class="db-kpi stagger-item">
        <div class="db-kpi-top">
          <span class="db-kpi-icon ${tint}"><i class="${icon}"></i></span>
        </div>
        <div class="db-kpi-value">${value}</div>
        <div class="db-kpi-label">${label}</div>
        <div class="db-kpi-progress"><div class="db-kpi-progress-fill" style="width:${Math.min(100, pct)}%"></div></div>
      </div>
    `;
  },

  _kpiBig(label, value, icon, trendVal, ar) {
    const dir = trendVal > 0 ? 'up' : trendVal < 0 ? 'down' : 'neutral';
    const dirIcon = { up: 'fa-arrow-trend-up', down: 'fa-arrow-trend-down', neutral: 'fa-minus' }[dir];
    const trendText = trendVal === 0
      ? (ar ? 'مستقر' : 'Stable')
      : `${trendVal > 0 ? '+' : ''}${trendVal}% ${ar ? 'مقارنة بالأمس' : 'vs yesterday'}`;
    return `
      <div class="db-kpi db-kpi-accent stagger-item">
        <div class="db-kpi-top">
          <span class="db-kpi-icon tint-primary"><i class="${icon}"></i></span>
          <span class="db-kpi-change ${dir}"><i class="fas ${dirIcon}"></i> ${trendText}</span>
        </div>
        <div class="db-kpi-value db-kpi-value-lg">${value}</div>
        <div class="db-kpi-label">${label}</div>
      </div>
    `;
  },

  // ── Who's in now ─────────────────────────────────────
  _whosIn(today, ar) {
    const present = today
      .filter(a => a.status === 'present' || a.status === 'late')
      .map(a => ({ a, emp: DB.getEmployee(a.empId) }))
      .filter(x => x.emp)
      .sort((x, y) => (x.a.checkIn || '').localeCompare(y.a.checkIn || ''))
      .slice(0, 5);

    if (!present.length) {
      return `<div class="empty-state" style="padding:36px 20px">
        <div class="empty-icon"><i class="fas fa-mug-hot"></i></div>
        <div class="empty-title">${ar ? 'لا أحد في المكتب بعد' : 'Nobody is in yet'}</div>
        <div class="empty-desc">${ar ? 'ستظهر هنا أسماء الموظفين فور تسجيل حضورهم' : 'Employees appear here once they check in'}</div>
      </div>`;
    }

    return present.map(({ a, emp }) => {
      const dept = DB.getDepartment(emp.dept);
      const isLate = a.status === 'late';
      return `
        <div class="db-who-item">
          <div class="avatar ${emp.avatarColor || 'gradient-primary'}" style="width:34px;height:34px;font-size:12px">${emp.avatar || ''}</div>
          <div class="db-who-info">
            <div class="db-who-name">${DashboardModule._escape(emp.name)}</div>
            <div class="db-who-dept">${dept ? DashboardModule._escape(dept.name) : DashboardModule._escape(emp.position || '')}</div>
          </div>
          <div class="db-who-time">
            <span class="db-who-clock">${this._fmtTime(a.checkIn)}</span>
            <span class="badge ${isLate ? 'badge-warning' : 'badge-success'}" style="font-size:10px">${isLate ? t('attendance.late') : t('attendance.present')}</span>
          </div>
        </div>
      `;
    }).join('');
  },

  // ── Recent absences ──────────────────────────────────
  _absences(today, todayStr, ar) {
    const attMap = {};
    today.forEach(a => { attMap[a.empId] = a; });
    const leaveSet = new Set(
      DB.leaves.filter(l => l.status === 'approved' && l.from <= todayStr && l.to >= todayStr).map(l => l.empId)
    );

    const absent = DB.employees
      .filter(e => e.status === 'active' && !attMap[e.id] && !leaveSet.has(e.id))
      .slice(0, 6);

    if (!absent.length) {
      return `<div class="empty-state" style="padding:36px 20px">
        <div class="empty-icon"><i class="fas fa-circle-check" style="color:var(--success)"></i></div>
        <div class="empty-title">${ar ? 'حضور كامل اليوم' : 'Full attendance today'}</div>
        <div class="empty-desc">${ar ? 'لا يوجد موظفون متغيبون' : 'No absent employees'}</div>
      </div>`;
    }

    return `
      <table class="data-table">
        <thead><tr>
          <th>${ar ? 'الموظف' : 'Employee'}</th>
          <th>${ar ? 'القسم' : 'Department'}</th>
          <th>${ar ? 'التاريخ' : 'Date'}</th>
        </tr></thead>
        <tbody>
          ${absent.map(emp => {
            const dept = DB.getDepartment(emp.dept);
            return `
              <tr>
                <td>
                  <div class="table-avatar">
                    <div class="avatar ${emp.avatarColor || 'gradient-danger'}" style="width:30px;height:30px;font-size:11px">${emp.avatar || ''}</div>
                    <div class="avatar-info"><span class="avatar-name">${DashboardModule._escape(emp.name)}</span></div>
                  </div>
                </td>
                <td style="color:var(--text-secondary)">${dept ? DashboardModule._escape(dept.name) : '—'}</td>
                <td><span class="badge badge-danger">${App.formatDate(todayStr)}</span></td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    `;
  },

  // ── Pending requests (quick approve/reject) ──────────
  _pendingRequests(ar) {
    const pending = DB.leaves.filter(l => l.status === 'pending').slice(0, 5);
    if (!pending.length) {
      return `<div class="empty-state" style="padding:36px 20px">
        <div class="empty-icon"><i class="fas fa-check-double"></i></div>
        <div class="empty-title">${ar ? 'لا طلبات معلقة' : 'No pending requests'}</div>
        <div class="empty-desc">${ar ? 'جميع الطلبات تمت معالجتها' : 'Everything is up to date'}</div>
      </div>`;
    }

    return pending.map(l => {
      const emp = DB.getEmployee(l.empId);
      const type = App.getLeaveTypeLabel(l.type);
      return `
        <div class="db-req-item">
          <div class="db-req-bar" style="background:${type.color}"></div>
          <div class="db-req-info">
            <div class="db-req-name">${DashboardModule._escape(emp?.name || '')}</div>
            <div class="db-req-meta">
              <span><i class="fas fa-tag"></i> ${type.label}</span>
              <span><i class="fas fa-calendar"></i> ${App.formatDate(l.from)}</span>
              <span><i class="fas fa-moon"></i> ${l.days} ${t('leaves.days')}</span>
            </div>
          </div>
          <div class="db-req-actions">
            <button class="btn btn-success btn-sm" title="${t('common.approved')}" onclick="LeavesModule.approve('${l.id}')"><i class="fas fa-check"></i></button>
            <button class="btn btn-danger btn-sm" title="${t('common.rejected')}" onclick="LeavesModule.reject('${l.id}')"><i class="fas fa-xmark"></i></button>
          </div>
        </div>
      `;
    }).join('');
  },

  // ── Weekly bar chart ─────────────────────────────────
  _renderWeekChart(trend, ar) {
    const canvas = document.getElementById('db-week-chart');
    if (!canvas) return;

    const { color, grid, font } = App.getChartDefaults();
    const labels = trend.map(d => new Date(d.date + 'T12:00:00').toLocaleDateString(ar ? 'ar-SA' : 'en-US', { weekday: 'short', day: 'numeric' }));

    // Gradient blue for present
    const ctx = canvas.getContext('2d');
    const presentGrad = ctx.createLinearGradient(0, 0, 0, 280);
    presentGrad.addColorStop(0, '#818CF8');
    presentGrad.addColorStop(1, '#5B5BD6');

    const chart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          { label: t('attendance.present'), data: trend.map(d => d.present), backgroundColor: presentGrad, borderRadius: 6, borderSkipped: false, stack: 'a', maxBarThickness: 38 },
          { label: t('attendance.late'),    data: trend.map(d => d.late),    backgroundColor: '#F59E0B', borderRadius: 6, borderSkipped: false, stack: 'a', maxBarThickness: 38 },
          { label: ar ? 'غائب' : 'Absent',   data: trend.map(d => d.absent || 0), backgroundColor: '#EF4444', borderRadius: 6, borderSkipped: false, stack: 'a', maxBarThickness: 38 },
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { rtl: ar, bodyFont: { family: font }, titleFont: { family: font }, padding: 10, cornerRadius: 8 }
        },
        scales: {
          x: { stacked: true, grid: { display: false }, ticks: { color, font: { family: font, size: 11 } } },
          y: { stacked: true, grid: { color: grid }, ticks: { color, font: { family: font, size: 11 }, precision: 0 }, beginAtZero: true }
        }
      }
    });
    App.registerChart('dbWeek', chart);
  },

  // ── Helpers ──────────────────────────────────────────
  _escape(str) {
    return String(str ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  },

  _fmtTime(str) {
    if (!str) return '—';
    // Force 24h, strip any AM/PM and Arabic numerals
    const m = String(str).match(/(\d{1,2})[:.](\d{2})/);
    if (!m) return str;
    const hh = String(parseInt(m[1], 10)).padStart(2, '0');
    return `${hh}:${m[2]}`;
  },

  _injectCss() {
    if (document.getElementById('dashboard-enterprise-css')) return;
    const style = document.createElement('style');
    style.id = 'dashboard-enterprise-css';
    style.textContent = `
      .dashboard-enterprise { display: flex; flex-direction: column; gap: 20px; }

      .db-greeting { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
      .db-greeting-title { font-size: 24px; font-weight: 700; color: var(--text-primary); letter-spacing: -0.4px; }
      .db-greeting-sub { font-size: 13px; color: var(--text-muted); margin-top: 4px; }
      .db-greeting-actions { display: flex; gap: 8px; flex-wrap: wrap; flex-shrink: 0; }

      .db-kpi-strip { display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px; }
      .db-kpi {
        background: var(--bg-surface); border: 1px solid var(--border); border-radius: var(--radius-lg);
        padding: 16px 18px; display: flex; flex-direction: column; gap: 6px; min-width: 0;
        transition: box-shadow 0.2s ease, border-color 0.2s ease;
      }
      .db-kpi:hover { box-shadow: var(--shadow-md); }
      .db-kpi-accent { border-color: var(--primary); background: linear-gradient(180deg, var(--primary-subtle), var(--bg-surface)); }
      .db-kpi-top { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 2px; }
      .db-kpi-icon { width: 34px; height: 34px; border-radius: var(--radius-md); display: flex; align-items: center; justify-content: center; font-size: 15px; flex-shrink: 0; }
      .db-kpi-icon.tint-primary { background: var(--primary-subtle); color: var(--primary); }
      .db-kpi-icon.tint-success { background: var(--success-subtle); color: var(--success); }
      .db-kpi-icon.tint-warning { background: var(--warning-subtle); color: var(--warning); }
      .db-kpi-icon.tint-danger  { background: var(--danger-subtle);  color: var(--danger); }
      .db-kpi-value { font-size: 28px; font-weight: 700; letter-spacing: -1px; color: var(--text-primary); line-height: 1.1; }
      .db-kpi-value-lg { font-size: 32px; }
      .db-kpi-label { font-size: 12px; color: var(--text-muted); font-weight: 500; }
      .db-kpi-change { font-size: 11px; font-weight: 600; display: inline-flex; align-items: center; gap: 3px; white-space: nowrap; }
      .db-kpi-change.up { color: var(--success); }
      .db-kpi-change.down { color: var(--danger); }
      .db-kpi-change.neutral { color: var(--text-muted); }
      .db-kpi-progress { height: 4px; background: var(--bg-subtle); border-radius: 99px; overflow: hidden; margin-top: 6px; }
      .db-kpi-progress-fill { height: 100%; background: var(--warning); border-radius: 99px; transition: width 0.6s ease; }

      .db-mid-row { display: grid; grid-template-columns: 1fr 40%; gap: 20px; align-items: stretch; }
      .db-chart-panel, .db-who-panel { display: flex; flex-direction: column; }
      .db-who-panel .card-body { flex: 1; overflow-y: auto; max-height: 360px; }
      .db-legend-dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; margin-inline-start: 6px; }

      .db-who-item { display: flex; align-items: center; gap: 10px; padding: 9px 10px; border-radius: var(--radius-md); transition: background 0.12s; }
      .db-who-item:hover { background: var(--bg-hover); }
      .db-who-info { flex: 1; min-width: 0; }
      .db-who-name { font-size: 13px; font-weight: 600; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .db-who-dept { font-size: 11.5px; color: var(--text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .db-who-time { display: flex; flex-direction: column; align-items: flex-end; gap: 3px; flex-shrink: 0; }
      .db-who-clock { font-size: 13px; font-weight: 700; color: var(--text-primary); font-family: var(--font-en); font-variant-numeric: tabular-nums; }

      .db-bottom-row { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; align-items: stretch; }
      .db-absences-panel, .db-requests-panel { display: flex; flex-direction: column; }
      .db-absences-panel .card-body, .db-requests-panel .card-body { flex: 1; overflow-y: auto; max-height: 360px; }

      .db-req-item { display: flex; align-items: center; gap: 12px; padding: 10px 12px; border-radius: var(--radius-md); transition: background 0.12s; }
      .db-req-item:hover { background: var(--bg-hover); }
      .db-req-bar { width: 4px; align-self: stretch; border-radius: 4px; flex-shrink: 0; min-height: 36px; }
      .db-req-info { flex: 1; min-width: 0; }
      .db-req-name { font-size: 13px; font-weight: 600; color: var(--text-primary); margin-bottom: 3px; }
      .db-req-meta { display: flex; gap: 10px; flex-wrap: wrap; font-size: 11px; color: var(--text-muted); }
      .db-req-meta i { margin-inline-end: 3px; }
      .db-req-actions { display: flex; gap: 6px; flex-shrink: 0; }
      .db-req-actions .btn-sm { padding: 5px 9px; }

      @media (max-width: 1100px) {
        .db-kpi-strip { grid-template-columns: repeat(3, 1fr); }
        .db-mid-row { grid-template-columns: 1fr; }
        .db-bottom-row { grid-template-columns: 1fr; }
      }
      @media (max-width: 640px) {
        .db-kpi-strip { grid-template-columns: repeat(2, 1fr); }
        .db-greeting-title { font-size: 20px; }
        .db-kpi-value { font-size: 24px; }
      }
      @media (max-width: 420px) {
        .db-kpi-strip { grid-template-columns: 1fr; }
      }
    `;
    document.head.appendChild(style);
  }
};
