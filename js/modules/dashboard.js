/* =========================================================
   DASHBOARD MODULE
   KPI Cards · Attendance Chart · Department Donut · Activity
   ========================================================= */

const DashboardModule = {
  render(container) {
    const stats  = DB.getAttendanceStats();
    const trend  = DB.getAttendanceTrend();
    const counts = DB.getPendingCount();
    const today  = DB.getTodayAttendance();

    // حساب الساعات الإضافية الحقيقية من سجلات الحضور
    const todayStr = new Date().toISOString().split('T')[0];
    const todayOvertimeMin = DB.attendance
      .filter(a => a.date === todayStr && a.overtime > 0)
      .reduce((sum, a) => sum + (a.overtime || 0), 0);
    const todayOvertimeHrs = (todayOvertimeMin / 60).toFixed(1);

    const monthStart = todayStr.slice(0, 7) + '-01';
    const monthOvertimeMin = DB.attendance
      .filter(a => a.date >= monthStart && a.date <= todayStr && a.overtime > 0)
      .reduce((sum, a) => sum + (a.overtime || 0), 0);
    const monthOvertimeHrs = (monthOvertimeMin / 60).toFixed(1);

    container.innerHTML = `
      <div class="page-header">
        <div class="page-header-text">
          <h1>${t('dashboard.title')}</h1>
          <p>${t('dashboard.subtitle')} — ${new Date().toLocaleDateString(currentLang === 'ar' ? 'ar-SA' : 'en-US', {weekday:'long',year:'numeric',month:'long',day:'numeric'})}</p>
        </div>
        <div class="page-header-actions">
          <button class="btn btn-secondary" onclick="App.printPage()"><i class="fas fa-print"></i> ${t('common.print')}</button>
          <button class="btn btn-primary" onclick="App.navigate('attendance')"><i class="fas fa-clock"></i> ${t('dashboard.checkinNow')}</button>
        </div>
      </div>

      <!-- KPI CARDS -->
      <div class="stat-cards">
        ${(() => {
          const monthStart = todayStr.slice(0, 7) + '-01';
          const newThisMonth = DB.employees.filter(e => e.hireDate && e.hireDate >= monthStart).length;
          const newLabel = newThisMonth > 0
            ? `+${newThisMonth} ${currentLang==='ar'?'هذا الشهر':'this month'}`
            : (currentLang==='ar'?'لا إضافات هذا الشهر':'no new this month');
          return this._statCard('primary', 'fas fa-users', stats.total, t('dashboard.totalEmployees'), newLabel, newThisMonth > 0 ? 'up' : 'neutral', 'gradient-primary');
        })()}
        ${this._statCard('success', 'fas fa-user-check', stats.present + stats.late, t('dashboard.presentToday'), `${stats.attendanceRate}% ${currentLang==='ar'?'نسبة الحضور':'attendance rate'}`, 'up', 'gradient-success')}
        ${this._statCard('warning', 'fas fa-calendar-minus', stats.onLeave, t('dashboard.onLeave'), `${currentLang==='ar'?'إجازة مؤكدة':'confirmed leaves'}`, 'neutral', 'gradient-warning')}
        ${this._statCard('danger',  'fas fa-clock', stats.late, t('dashboard.lateArrivals'), `${currentLang==='ar'?'اليوم':'today'}`, stats.late > 3 ? 'down' : 'neutral', 'gradient-danger')}
        ${this._statCard('info',    'fas fa-user-xmark', stats.absent, t('dashboard.absent'), `${currentLang==='ar'?'غياب اليوم':'absent today'}`, 'down', 'gradient-info')}
        ${this._statCard('primary', 'fas fa-percent', stats.attendanceRate + '%', t('dashboard.attendanceRate'), currentLang==='ar'?'مقارنة بالأمس':'vs yesterday', 'up', 'gradient-indigo')}
        ${this._statCard('success', 'fas fa-hourglass-half', monthOvertimeHrs, t('dashboard.overtimeHours'), `${todayOvertimeHrs} ${currentLang==='ar'?'ساعة إضافية اليوم':'overtime hrs today'}`, todayOvertimeMin > 0 ? 'up' : 'neutral', 'gradient-cyan')}
        ${this._statCard('warning', 'fas fa-file-circle-question', counts.leaves + counts.requests, t('dashboard.pendingRequests'), currentLang==='ar'?'تنتظر موافقتك':'awaiting approval', 'neutral', 'gradient-rose')}
      </div>

      <!-- QUICK ACTIONS -->
      <div class="card" style="margin-bottom:20px">
        <div class="card-body" style="display:flex;gap:12px;flex-wrap:wrap;align-items:center">
          <span style="font-size:13px;font-weight:700;color:var(--text-muted)">${t('dashboard.quickActions')}</span>
          <button class="btn btn-primary btn-sm" onclick="App.navigate('attendance')"><i class="fas fa-clock"></i> ${t('dashboard.checkinNow')}</button>
          <button class="btn btn-success btn-sm" onclick="EmployeesModule.openAdd()"><i class="fas fa-user-plus"></i> ${t('dashboard.addEmployee')}</button>
          <button class="btn btn-outline-primary btn-sm" onclick="LeavesModule.openAdd()"><i class="fas fa-calendar-plus"></i> ${t('dashboard.newLeave')}</button>
          <button class="btn btn-secondary btn-sm" onclick="App.navigate('reports')"><i class="fas fa-chart-bar"></i> ${t('dashboard.viewReports')}</button>
          <button class="btn btn-secondary btn-sm" onclick="App.navigate('notifications')"><i class="fas fa-bell"></i> ${t('nav.notifications')}</button>
        </div>
      </div>

      <!-- CHARTS ROW -->
      <div class="grid-main-side">
        <!-- Attendance Trend Chart -->
        <div class="card">
          <div class="card-header">
            <h3><i class="fas fa-chart-line" style="color:var(--primary)"></i> ${t('dashboard.attendanceTrend')}</h3>
            <div style="display:flex;gap:8px">
              <span class="badge badge-success badge-dot">${t('attendance.present')}</span>
              <span class="badge badge-warning badge-dot">${t('attendance.late')}</span>
            </div>
          </div>
          <div class="card-body">
            <div class="chart-container" style="height:260px">
              <canvas id="attendance-trend-chart"></canvas>
            </div>
          </div>
        </div>

        <!-- Department Breakdown -->
        <div class="card">
          <div class="card-header">
            <h3><i class="fas fa-chart-pie" style="color:var(--secondary)"></i> ${t('dashboard.deptBreakdown')}</h3>
          </div>
          <div class="card-body">
            <div class="chart-container" style="height:200px">
              <canvas id="dept-chart"></canvas>
            </div>
            <div style="margin-top:12px" id="dept-legend"></div>
          </div>
        </div>
      </div>

      <!-- BOTTOM ROW -->
      <div class="grid-2">
        <!-- Recent Activity -->
        <div class="card">
          <div class="card-header">
            <h3><i class="fas fa-clock-rotate-left" style="color:var(--accent)"></i> ${t('dashboard.recentActivity')}</h3>
            <button class="btn-text" onclick="App.navigate('attendance')">${t('common.view')} ${t('common.all')}</button>
          </div>
          <div class="card-body" style="padding:0">
            ${this._recentActivity(today)}
          </div>
        </div>

        <!-- Pending Requests + Top Absent -->
        <div style="display:flex;flex-direction:column;gap:16px">
          <!-- Pending Leaves -->
          <div class="card">
            <div class="card-header">
              <h3><i class="fas fa-calendar-minus" style="color:var(--warning)"></i> ${t('leaves.title')} ${currentLang==='ar'?'المعلقة':'Pending'}</h3>
              <a href="#leaves" class="btn-text">${t('common.view')} ${t('common.all')}</a>
            </div>
            <div class="card-body" style="padding:8px">
              ${DB.leaves.filter(l=>l.status==='pending').slice(0,3).map(l=>{
                const emp = DB.getEmployee(l.empId);
                const type = App.getLeaveTypeLabel(l.type);
                return `
                  <div class="leave-item">
                    <div class="leave-type-bar" style="background:${type.color}"></div>
                    <div class="leave-content">
                      <div class="leave-emp">${emp?.name || ''}</div>
                      <div class="leave-meta">
                        <span><i class="fas fa-tag"></i> ${type.label}</span>
                        <span><i class="fas fa-calendar"></i> ${App.formatDate(l.from)}</span>
                        <span><i class="fas fa-moon"></i> ${l.days} ${t('leaves.days')}</span>
                      </div>
                    </div>
                    <div class="leave-actions">
                      <button class="btn btn-success btn-sm" onclick="LeavesModule.approve('${l.id}')"><i class="fas fa-check"></i></button>
                      <button class="btn btn-danger btn-sm"  onclick="LeavesModule.reject('${l.id}')"><i class="fas fa-xmark"></i></button>
                    </div>
                  </div>
                `;
              }).join('') || `<p style="text-align:center;color:var(--text-muted);padding:16px">${t('common.noData')}</p>`}
            </div>
          </div>

          <!-- Weekly Attendance Summary -->
          <div class="card">
            <div class="card-header">
              <h3><i class="fas fa-chart-bar" style="color:var(--success)"></i> ${currentLang==='ar'?'ملخص الأسبوع':'Weekly Summary'}</h3>
            </div>
            <div class="card-body">
              ${(() => {
                const totalActive = DB.employees.filter(e => e.status !== 'terminated').length || 1;
                return trend.slice(-5).map(d => {
                  const attended = d.present + d.late;
                  const pct = Math.round((attended / totalActive) * 100);
                  const dayName = new Date(d.date + 'T12:00:00').toLocaleDateString(currentLang==='ar'?'ar-SA':'en-US',{weekday:'short'});
                  const barColor = pct >= 80 ? 'gradient-success' : pct >= 50 ? 'gradient-warning' : 'gradient-danger';
                  return `
                    <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">
                      <span style="font-size:11px;color:var(--text-muted);width:50px;text-align:center;flex-shrink:0">${dayName}</span>
                      <div class="progress-bar" style="flex:1">
                        <div class="progress-fill ${barColor}" style="width:${pct}%;transition:width 0.6s ease"></div>
                      </div>
                      <span style="font-size:12px;font-weight:700;color:var(--text-primary);width:36px;text-align:center">${pct}%</span>
                      <span style="font-size:11px;color:var(--text-muted)">${attended}/${totalActive}</span>
                    </div>
                  `;
                }).join('');
              })()}
            </div>
          </div>
        </div>
      </div>
    `;

    // Render charts after DOM is ready
    setTimeout(() => {
      this._renderTrendChart(trend);
      this._renderDeptChart();
    }, 100);
  },

  _statCard(type, icon, value, label, trend, trendDir, gradient) {
    const trendIcons = { up: 'fa-arrow-trend-up', down: 'fa-arrow-trend-down', neutral: 'fa-minus' };
    return `
      <div class="stat-card ${type} stagger-item">
        <div style="display:flex;align-items:flex-start;justify-content:space-between">
          <div class="stat-icon ${gradient}"><i class="${icon}"></i></div>
          <div class="stat-info" style="text-align:${currentLang==='ar'?'right':'left'}">
            <div class="stat-value">${value}</div>
            <div class="stat-label">${label}</div>
          </div>
        </div>
        <div class="stat-trend ${trendDir}">
          <i class="fas ${trendIcons[trendDir]}"></i>
          <span>${trend}</span>
        </div>
      </div>
    `;
  },

  _recentActivity(today) {
    const items = today.slice(0, 8).map(att => {
      const emp = DB.getEmployee(att.empId);
      if (!emp) return '';
      return `
        <div style="display:flex;align-items:center;gap:12px;padding:10px 16px;border-bottom:1px solid var(--border);transition:background 0.15s" onmouseover="this.style.background='var(--bg-hover)'" onmouseout="this.style.background=''">
          <div class="avatar ${emp.avatarColor}">${emp.avatar}</div>
          <div style="flex:1;min-width:0">
            <div style="font-size:13.5px;font-weight:600;color:var(--text-primary)">${emp.name}</div>
            <div style="font-size:11.5px;color:var(--text-muted)">${emp.position}</div>
          </div>
          <div style="text-align:center">
            ${App.getMethodIcon(att.method)}
            <div style="font-size:10px;color:var(--text-muted);margin-top:2px">${att.method}</div>
          </div>
          <div style="text-align:center;min-width:60px">
            <div style="font-size:13px;font-weight:700;color:var(--text-primary);font-family:var(--font-en)">${att.checkIn}</div>
            <div>${App.getStatusBadge(att.status)}</div>
          </div>
        </div>
      `;
    }).join('');

    return items || `<div class="empty-state"><div class="empty-icon"><i class="fas fa-clock"></i></div><p class="empty-desc">${t('common.noData')}</p></div>`;
  },

  _renderTrendChart(trend) {
    const canvas = document.getElementById('attendance-trend-chart');
    if (!canvas) return;

    const { color, grid, font } = App.getChartDefaults();
    const labels = trend.map(d => new Date(d.date).toLocaleDateString(currentLang==='ar'?'ar-SA':'en-US', { weekday:'short', day:'numeric' }));

    const chart = new Chart(canvas, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: t('attendance.present'),
            data: trend.map(d => d.present),
            borderColor: '#10b981',
            backgroundColor: 'rgba(16,185,129,0.08)',
            fill: true,
            tension: 0.4,
            pointBackgroundColor: '#10b981',
            pointRadius: 4,
            pointHoverRadius: 6,
            borderWidth: 2.5,
          },
          {
            label: t('attendance.late'),
            data: trend.map(d => d.late),
            borderColor: '#f59e0b',
            backgroundColor: 'rgba(245,158,11,0.06)',
            fill: true,
            tension: 0.4,
            pointBackgroundColor: '#f59e0b',
            pointRadius: 4,
            pointHoverRadius: 6,
            borderWidth: 2.5,
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'top', labels: { color, font: { family: font, size: 12, weight: '600' }, padding: 16, usePointStyle: true } },
          tooltip: { rtl: currentLang === 'ar', bodyFont: { family: font }, titleFont: { family: font } }
        },
        scales: {
          x: { grid: { color: grid }, ticks: { color, font: { family: font, size: 11 } } },
          y: { grid: { color: grid }, ticks: { color, font: { family: font, size: 11 } }, beginAtZero: true }
        },
        interaction: { intersect: false, mode: 'index' }
      }
    });
    App.registerChart('trend', chart);
  },

  _renderDeptChart() {
    const canvas = document.getElementById('dept-chart');
    const legend = document.getElementById('dept-legend');
    if (!canvas) return;

    const colors = ['#6366f1','#10b981','#f59e0b','#ef4444','#06b6d4','#8b5cf6'];
    const { font } = App.getChartDefaults();

    // Count active employees per department
    const depts = DB.departments.slice(0, 6).map(d => ({
      ...d,
      count: DB.employees.filter(e => e.dept === d.id && e.status !== 'terminated').length,
    })).filter(d => d.count > 0);

    // Fallback: if no dept data, show total by status
    const data  = depts.length ? depts.map(d => d.count) : [1];
    const labels = depts.length ? depts.map(d => d.name) : [currentLang==='ar'?'لا توجد بيانات':'No data'];
    const bgColors = depts.length ? colors.slice(0, depts.length) : ['#e2e8f0'];

    const chart = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: bgColors,
          borderColor: App.state.theme === 'dark' ? '#0f172a' : '#fff',
          borderWidth: 3,
          hoverOffset: 6,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '68%',
        plugins: {
          legend: { display: false },
          tooltip: { rtl: currentLang === 'ar', bodyFont: { family: font }, titleFont: { family: font } }
        }
      }
    });
    App.registerChart('dept', chart);

    // Custom legend — show all depts even with 0 employees
    if (legend) {
      const allDepts = DB.departments.slice(0, 6).map((d, i) => ({
        ...d,
        count: DB.employees.filter(e => e.dept === d.id && e.status !== 'terminated').length,
        color: colors[i],
      }));
      legend.innerHTML = allDepts.length
        ? allDepts.map(d => `
          <div style="display:flex;align-items:center;justify-content:space-between;padding:4px 0">
            <div style="display:flex;align-items:center;gap:8px">
              <div style="width:10px;height:10px;border-radius:3px;background:${d.color};flex-shrink:0"></div>
              <span style="font-size:12px;color:var(--text-secondary)">${d.name}</span>
            </div>
            <span style="font-size:12px;font-weight:700;color:var(--text-primary)">${d.count}</span>
          </div>
        `).join('')
        : `<p style="text-align:center;color:var(--text-muted);font-size:12px">${currentLang==='ar'?'لا توجد أقسام':'No departments'}</p>`;
    }
  }
};
