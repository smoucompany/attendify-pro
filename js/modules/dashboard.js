/* =========================================================
   DASHBOARD MODULE — لوحة التحكم
   ========================================================= */

const DashboardModule = {

  render(container) {
    const stats    = DB.getAttendanceStats();
    const trend    = DB.getAttendanceTrend();
    const counts   = DB.getPendingCount();
    const today    = DB.getTodayAttendance();
    const isAr     = currentLang === 'ar';
    const todayStr = new Date().toISOString().split('T')[0];
    const company  = DB.company;

    // Overtime
    const monthStart = todayStr.slice(0,7) + '-01';
    const todayOvMin  = DB.attendance.filter(a => a.date === todayStr && a.overtime > 0).reduce((s,a)=>s+(a.overtime||0),0);
    const monthOvMin  = DB.attendance.filter(a => a.date >= monthStart && a.overtime > 0).reduce((s,a)=>s+(a.overtime||0),0);
    const todayOvHrs  = (todayOvMin/60).toFixed(1);
    const monthOvHrs  = (monthOvMin/60).toFixed(1);

    // Attendance breakdown for hero
    const attRate   = stats.attendanceRate;
    const totalEmp  = stats.total || 1;
    const presentW  = Math.round((stats.present / totalEmp) * 100);
    const lateW     = Math.round((stats.late    / totalEmp) * 100);
    const absentW   = Math.round((stats.absent  / totalEmp) * 100);
    const leaveW    = Math.round((stats.onLeave / totalEmp) * 100);

    // New hires this month
    const newThisMonth = DB.employees.filter(e => e.hireDate && e.hireDate >= monthStart).length;

    const dateLabel = new Date().toLocaleDateString(isAr?'ar-SA':'en-US', {
      weekday:'long', year:'numeric', month:'long', day:'numeric'
    });

    container.innerHTML = `

      <!-- ═══ HERO BANNER ═══════════════════════════════════════ -->
      <div class="dash-hero-wrap">
        <!-- Left info -->
        <div class="dash-hero-info">
          <div class="dash-hero-date">
            <i class="fas fa-calendar-days"></i> ${dateLabel}
          </div>
          <h2 class="dash-hero-title">
            ${isAr ? 'مرحباً،' : 'Welcome,'} <span>${_esc(company.name || (isAr?'الشركة':'Company'))}</span>
          </h2>
          <p class="dash-hero-sub">
            ${isAr ? 'هذا ملخص أداء الحضور لليوم' : "Here's today's attendance snapshot"}
          </p>

          <!-- Status pills -->
          <div class="dash-hero-pills">
            ${[
              { val: stats.present, lbl: isAr?'حاضر':'Present',  color:'#10b981', glow:'rgba(16,185,129,.35)' },
              { val: stats.late,    lbl: isAr?'متأخر':'Late',     color:'#f59e0b', glow:'rgba(245,158,11,.35)' },
              { val: stats.absent,  lbl: isAr?'غائب':'Absent',    color:'#ef4444', glow:'rgba(239,68,68,.35)'  },
              { val: stats.onLeave, lbl: isAr?'إجازة':'On Leave', color:'rgba(255,255,255,.7)', glow:'rgba(255,255,255,.2)' },
            ].map(p=>`
              <div style="
                display:inline-flex;align-items:center;gap:6px;
                background:rgba(255,255,255,.14);
                border:1px solid rgba(255,255,255,.22);
                border-radius:20px;padding:5px 13px;
                color:#fff;font-size:12px;font-weight:600;
                backdrop-filter:blur(4px);
              ">
                <span style="width:7px;height:7px;border-radius:50%;background:${p.color};
                  flex-shrink:0;box-shadow:0 0 0 3px ${p.glow}"></span>
                ${p.val} ${p.lbl}
              </div>
            `).join('')}
          </div>

          <!-- Segmented attendance bar -->
          <div style="margin-top:16px">
            <div style="background:rgba(255,255,255,.2);border-radius:8px;height:10px;overflow:hidden;display:flex">
              <div style="background:#10b981;height:10px;width:${presentW}%;transition:width .8s ease"></div>
              <div style="background:#f59e0b;height:10px;width:${lateW}%;transition:width .8s ease .1s"></div>
              <div style="background:#ef4444;height:10px;width:${absentW}%;transition:width .8s ease .2s"></div>
              <div style="background:rgba(255,255,255,.35);height:10px;width:${leaveW}%;transition:width .8s ease .3s"></div>
            </div>
            <div style="font-size:11px;color:rgba(255,255,255,.75);margin-top:6px;font-weight:500">
              ${attRate}% ${isAr?'معدل الحضور اليوم':'attendance rate today'}
            </div>
          </div>
        </div>

        <!-- Right: Ring meter + actions -->
        <div class="dash-hero-ring-wrap">
          <!-- Conic-gradient attendance ring -->
          <div style="
            width:110px;height:110px;border-radius:50%;
            background:conic-gradient(#10b981 0% ${attRate}%, rgba(255,255,255,.18) ${attRate}% 100%);
            display:flex;align-items:center;justify-content:center;
            box-shadow:0 0 0 4px rgba(255,255,255,.15);
            margin-bottom:14px;
          ">
            <div style="
              width:88px;height:88px;border-radius:50%;
              background:rgba(67,56,202,.9);
              display:flex;flex-direction:column;align-items:center;justify-content:center;
            ">
              <div style="font-size:22px;font-weight:900;color:#fff;line-height:1">${attRate}%</div>
              <div style="font-size:9px;color:rgba(255,255,255,.7);margin-top:2px;font-weight:500">
                ${isAr?'حضور':'Attend.'}
              </div>
            </div>
          </div>
          <!-- Quick action buttons -->
          <div style="display:flex;gap:8px">
            <button onclick="App.navigate('attendance')" style="
              background:rgba(255,255,255,.2);color:#fff;border:1px solid rgba(255,255,255,.3);
              border-radius:10px;padding:7px 14px;font-size:12px;font-weight:700;cursor:pointer;
              transition:background .15s;font-family:inherit;backdrop-filter:blur(4px);
            " onmouseover="this.style.background='rgba(255,255,255,.3)'" onmouseout="this.style.background='rgba(255,255,255,.2)'">
              <i class="fas fa-clock" style="margin-${isAr?'left':'right'}:5px"></i>
              ${isAr?'حضور':'Check-in'}
            </button>
            <button onclick="App.navigate('reports')" style="
              background:rgba(255,255,255,.12);color:#fff;border:1px solid rgba(255,255,255,.2);
              border-radius:10px;padding:7px 14px;font-size:12px;font-weight:700;cursor:pointer;
              transition:background .15s;font-family:inherit;backdrop-filter:blur(4px);
            " onmouseover="this.style.background='rgba(255,255,255,.22)'" onmouseout="this.style.background='rgba(255,255,255,.12)'">
              <i class="fas fa-chart-bar" style="margin-${isAr?'left':'right'}:5px"></i>
              ${isAr?'تقارير':'Reports'}
            </button>
          </div>
        </div>

        <!-- Background decorations -->
        <div style="position:absolute;top:-50px;${isAr?'left':'right'}:-50px;width:220px;height:220px;
          border-radius:50%;background:rgba(255,255,255,.07);pointer-events:none"></div>
        <div style="position:absolute;bottom:-70px;${isAr?'right':'left'}:60px;width:180px;height:180px;
          border-radius:50%;background:rgba(255,255,255,.04);pointer-events:none"></div>
        <div style="position:absolute;top:20px;${isAr?'right':'left'}:40%;width:60px;height:60px;
          border-radius:50%;background:rgba(255,255,255,.05);pointer-events:none"></div>
      </div>

      <!-- ═══ KPI CARDS ══════════════════════════════════════════ -->
      <div class="dash-kpi-grid">
        ${[
          {
            icon:'fas fa-users', color:'#6366f1', link:'employees',
            val: stats.total,
            lbl: t('dashboard.totalEmployees'),
            sub: newThisMonth > 0 ? `+${newThisMonth} ${t('dashboard.thisMonth')}` : t('dashboard.noNewThisMonth'),
            trend: newThisMonth > 0 ? 'up' : 'neutral',
          },
          {
            icon:'fas fa-user-check', color:'#10b981', link:'attendance',
            val: stats.present + stats.late,
            lbl: t('dashboard.presentToday'),
            sub: `${attRate}% ${t('dashboard.attendanceRateLabel')}`,
            trend: attRate >= 80 ? 'up' : attRate >= 50 ? 'neutral' : 'down',
          },
          {
            icon:'fas fa-calendar-minus', color:'#f59e0b', link:'leaves',
            val: stats.onLeave,
            lbl: t('dashboard.onLeave'),
            sub: t('dashboard.confirmedLeaves'),
            trend: 'neutral',
          },
          {
            icon:'fas fa-clock', color:'#ef4444', link:'attendance',
            val: stats.late,
            lbl: t('dashboard.lateArrivals'),
            sub: t('common.today'),
            trend: stats.late > 3 ? 'down' : 'neutral',
          },
          {
            icon:'fas fa-user-xmark', color:'#8b5cf6', link:'attendance',
            val: stats.absent,
            lbl: t('dashboard.absent'),
            sub: t('dashboard.absentToday'),
            trend: stats.absent > 3 ? 'down' : 'neutral',
          },
          {
            icon:'fas fa-percent', color:'#3b82f6', link:'reports',
            val: attRate + '%',
            lbl: t('dashboard.attendanceRate'),
            sub: t('dashboard.vsYesterday'),
            trend: attRate >= 80 ? 'up' : 'neutral',
          },
          {
            icon:'fas fa-hourglass-half', color:'#14b8a6', link:'attendance',
            val: monthOvHrs,
            lbl: t('dashboard.overtimeHours'),
            sub: `${todayOvHrs} ${t('dashboard.overtimeTodayLabel')}`,
            trend: todayOvMin > 0 ? 'up' : 'neutral',
          },
          {
            icon:'fas fa-file-circle-question', color:'#ec4899', link:'requests',
            val: counts.leaves + counts.requests,
            lbl: t('dashboard.pendingRequests'),
            sub: t('dashboard.awaitingApproval'),
            trend: (counts.leaves + counts.requests) > 5 ? 'down' : 'neutral',
          },
        ].map((k, i) => this._kpiCard(k, i)).join('')}
      </div>

      <!-- ═══ CHARTS ROW ═════════════════════════════════════════ -->
      <div class="grid-main-side" style="margin-bottom:20px">

        <!-- Attendance Trend Chart -->
        <div class="card" style="overflow:hidden">
          <div class="card-header" style="border-bottom:1px solid var(--border);padding-bottom:14px">
            <div>
              <h3 style="margin-bottom:4px">
                <i class="fas fa-chart-line" style="color:#6366f1;margin-${isAr?'left':'right'}:8px"></i>
                ${t('dashboard.attendanceTrend')}
              </h3>
              <p style="font-size:11px;color:var(--text-muted);margin:0">
                ${isAr?'آخر 14 يوم':'Last 14 days'}
              </p>
            </div>
            <div style="display:flex;gap:8px;flex-wrap:wrap">
              ${[
                { color:'#10b981', lbl: t('attendance.present') },
                { color:'#f59e0b', lbl: t('attendance.late') },
                { color:'#ef4444', lbl: t('dashboard.absent') },
              ].map(l=>`
                <span style="display:inline-flex;align-items:center;gap:5px;
                  font-size:11px;font-weight:600;color:var(--text-secondary)">
                  <span style="width:8px;height:8px;border-radius:2px;background:${l.color};flex-shrink:0"></span>
                  ${l.lbl}
                </span>
              `).join('')}
            </div>
          </div>
          <div class="card-body">
            <div class="chart-container" style="height:260px">
              <canvas id="attendance-trend-chart"></canvas>
            </div>
          </div>
        </div>

        <!-- Department Donut -->
        <div class="card" style="overflow:hidden">
          <div class="card-header" style="border-bottom:1px solid var(--border);padding-bottom:14px">
            <div>
              <h3 style="margin-bottom:4px">
                <i class="fas fa-chart-pie" style="color:#8b5cf6;margin-${isAr?'left':'right'}:8px"></i>
                ${t('dashboard.deptBreakdown')}
              </h3>
              <p style="font-size:11px;color:var(--text-muted);margin:0">
                ${isAr?'توزيع الموظفين حسب القسم':'Employees by department'}
              </p>
            </div>
          </div>
          <div class="card-body">
            <div class="chart-container" style="height:200px">
              <canvas id="dept-chart"></canvas>
            </div>
            <div style="margin-top:12px" id="dept-legend"></div>
          </div>
        </div>
      </div>

      <!-- ═══ BOTTOM ROW ═════════════════════════════════════════ -->
      <div class="grid-2">

        <!-- Activity Feed -->
        <div class="card" style="display:flex;flex-direction:column;max-height:460px;overflow:hidden">
          <div class="card-header" style="flex-shrink:0;border-bottom:1px solid var(--border)">
            <div>
              <h3 style="margin-bottom:2px">
                <i class="fas fa-pulse" style="color:#10b981;margin-${isAr?'left':'right'}:8px"></i>
                ${t('dashboard.recentActivity')}
              </h3>
              <p style="font-size:11px;color:var(--text-muted);margin:0">
                ${isAr?'سجل حضور اليوم':'Today\'s attendance log'}
              </p>
            </div>
            <button class="btn-text" onclick="App.navigate('attendance')">
              ${t('common.view')} ${t('common.all')} <i class="fas fa-arrow-${isAr?'left':'right'}" style="font-size:10px"></i>
            </button>
          </div>
          <div style="overflow-y:auto;overflow-x:hidden;flex:1;min-height:0">
            ${this._recentActivity(today)}
          </div>
        </div>

        <!-- Right column: Pending + Weekly -->
        <div style="display:flex;flex-direction:column;gap:16px">

          <!-- Pending Leaves -->
          <div class="card">
            <div class="card-header" style="border-bottom:1px solid var(--border)">
              <h3>
                <i class="fas fa-calendar-minus" style="color:#f59e0b;margin-${isAr?'left':'right'}:8px"></i>
                ${t('leaves.title')} ${t('dashboard.pendingLabel')}
              </h3>
              <button class="btn-text" onclick="App.navigate('leaves')">
                ${t('common.view')} ${t('common.all')}
              </button>
            </div>
            <div class="card-body" style="padding:8px">
              ${DB.leaves.filter(l=>l.status==='pending').slice(0,3).map(l=>{
                const emp  = DB.getEmployee(l.empId);
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
              }).join('') || `<p style="text-align:center;color:var(--text-muted);padding:16px;font-size:13px">${t('common.noData')}</p>`}
            </div>
          </div>

          <!-- Weekly Attendance Summary -->
          <div class="card">
            <div class="card-header" style="border-bottom:1px solid var(--border)">
              <h3>
                <i class="fas fa-chart-bar" style="color:#3b82f6;margin-${isAr?'left':'right'}:8px"></i>
                ${t('dashboard.weeklySummary')}
              </h3>
            </div>
            <div class="card-body">
              ${(() => {
                const totalActive = DB.employees.filter(e => e.status !== 'terminated').length || 1;
                return trend.slice(-5).map(d => {
                  const attended = d.present + d.late;
                  const pct      = Math.round((attended / totalActive) * 100);
                  const dayName  = new Date(d.date + 'T12:00:00').toLocaleDateString(isAr?'ar-SA':'en-US', {weekday:'short'});
                  const barColor = pct >= 80 ? '#10b981' : pct >= 50 ? '#f59e0b' : '#ef4444';
                  return `
                    <div style="display:flex;align-items:center;gap:10px;margin-bottom:11px">
                      <span style="font-size:11px;color:var(--text-muted);width:48px;text-align:center;flex-shrink:0;font-weight:500">${dayName}</span>
                      <div style="flex:1;background:var(--border);border-radius:6px;height:7px;overflow:hidden">
                        <div style="height:7px;border-radius:6px;background:${barColor};width:${pct}%;transition:width .6s ease"></div>
                      </div>
                      <span style="font-size:12px;font-weight:700;color:var(--text-primary);width:36px;text-align:center">${pct}%</span>
                      <span style="font-size:11px;color:var(--text-muted);width:36px">${attended}/${totalActive}</span>
                    </div>
                  `;
                }).join('');
              })()}
            </div>
          </div>

        </div>
      </div>
    `;

    // Charts + counter animations
    setTimeout(() => {
      this._renderTrendChart(trend);
      this._renderDeptChart();
      this._animateCounters();
    }, 120);
  },

  /* ── KPI Card v2 — animated ──────────────────────────────── */
  _kpiCard({ icon, color, link, val, lbl, sub, trend }, idx) {
    const isAr = currentLang === 'ar';

    const trendCfg = {
      up:      { cls:'kpi-badge-up',   icon:'fa-arrow-trend-up',   lbl: isAr?'ارتفاع':'Rising'  },
      down:    { cls:'kpi-badge-down', icon:'fa-arrow-trend-down', lbl: isAr?'انخفاض':'Falling' },
      neutral: { cls:'kpi-badge-neu',  icon:'fa-minus',            lbl: isAr?'ثابت':'Stable'    },
    };
    const tc = trendCfg[trend] || trendCfg.neutral;

    // Unique icon animation per card
    const iconAnims = [
      'kpiIconFloat 3s ease-in-out infinite',
      'kpiIconBounce 2.4s ease infinite',
      'kpiIconSwing 3.5s ease-in-out infinite',
      'kpiIconTick 4s ease-in-out infinite',
      'kpiIconShake 2.8s ease-in-out infinite',
      'kpiIconSpin 7s linear infinite',
      'kpiIconPulseScale 2.5s ease-in-out infinite',
      'kpiIconWobble 3s ease-in-out infinite',
    ];
    const animStr  = iconAnims[idx % iconAnims.length];
    const ringDly  = `${(idx * 0.4).toFixed(1)}s`;
    const slideDly = `${(idx * 0.08).toFixed(2)}s`;
    const valDly   = `${(idx * 0.08 + 0.18).toFixed(2)}s`;
    const lineDly  = `${(idx * 0.1 + 0.3).toFixed(2)}s`;

    const numStr = String(val);
    const suffix = numStr.endsWith('%') ? '%' : '';
    const target = numStr.replace('%', '');
    const isNum  = !isNaN(Number(target)) && Number(target) > 0;

    return `
      <div class="dash-kpi-card"
        style="border-${isAr?'right':'left'}:4px solid ${color};animation:kpiSlideIn .45s cubic-bezier(.34,1.2,.64,1) ${slideDly} both"
        onclick="App.navigate('${link}')">

        <!-- Ambient radial glow -->
        <div style="position:absolute;${isAr?'left':'right'}:-20px;top:-20px;
          width:130px;height:130px;border-radius:50%;
          background:radial-gradient(circle,${color}14 0%,transparent 70%);
          pointer-events:none"></div>

        <!-- Top row -->
        <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:16px;position:relative;z-index:1">

          <!-- Trend badge -->
          <div class="${tc.cls}">
            <i class="fas ${tc.icon}" style="font-size:9px"></i> ${tc.lbl}
          </div>

          <!-- Animated icon with pulse ring -->
          <div style="position:relative;flex-shrink:0">
            <div style="position:absolute;inset:-5px;border-radius:18px;
              border:2px solid ${color};opacity:0;
              animation:kpiRing 2.5s ease-out ${ringDly} infinite"></div>
            <div style="
              width:52px;height:52px;border-radius:14px;
              background:${color}18;border:1.5px solid ${color}2a;
              display:flex;align-items:center;justify-content:center;
              animation:${animStr};
            ">
              <i class="${icon}" style="color:${color};font-size:20px"></i>
            </div>
          </div>
        </div>

        <!-- Animated counter value -->
        <div style="position:relative;z-index:1;margin-bottom:5px;
          animation:kpiValPop .55s cubic-bezier(.34,1.56,.64,1) ${valDly} both">
          <span class="kpi-counter"
            data-target="${target}" data-suffix="${suffix}" data-isnum="${isNum}"
            style="font-size:34px;font-weight:900;color:var(--text-primary);line-height:1">
            ${val}
          </span>
        </div>

        <!-- Label + sub -->
        <div style="font-size:13px;font-weight:600;color:var(--text-secondary);margin-bottom:3px;position:relative;z-index:1">${lbl}</div>
        <div style="font-size:11px;color:var(--text-muted);margin-bottom:13px;position:relative;z-index:1">${sub}</div>

        <!-- Animated accent line -->
        <div class="kpi-line-anim" style="
          height:3px;border-radius:3px;
          background:linear-gradient(${isAr?'to left':'to right'},${color},${color}55,transparent);
          transform-origin:${isAr?'right':'left'};
          animation:kpiLineGrow .85s ease ${lineDly} both;
        "></div>
      </div>
    `;
  },

  /* ── Number counter animation ─────────────────────────────── */
  _animateCounters() {
    document.querySelectorAll('.kpi-counter').forEach((el, i) => {
      const target = parseFloat(el.dataset.target);
      const suffix = el.dataset.suffix || '';
      const isNum  = el.dataset.isnum === 'true';
      if (!isNum || isNaN(target)) return;
      const isFloat = el.dataset.target.includes('.');
      const dur     = Math.min(900 + target * 8, 1800);
      setTimeout(() => {
        const t0 = performance.now();
        const tick = now => {
          const p = Math.min((now - t0) / dur, 1);
          const e = 1 - Math.pow(1 - p, 3);
          el.textContent = (isFloat ? (target*e).toFixed(1) : Math.round(target*e)) + suffix;
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }, i * 60 + 320);
    });
  },

  /* ── Activity Feed ────────────────────────────────────────── */
  _recentActivity(today) {
    const todayStr = new Date().toISOString().split('T')[0];
    const attMap   = {};
    today.forEach(a => { attMap[a.empId] = a; });
    const leaveSet = new Set(
      DB.leaves.filter(l => l.status==='approved' && l.from<=todayStr && l.to>=todayStr).map(l=>l.empId)
    );
    const allEmps = DB.employees.filter(e => e.status === 'active');
    if (!allEmps.length) return `<div class="empty-state"><div class="empty-icon"><i class="fas fa-users"></i></div><p class="empty-desc">${t('common.noData')}</p></div>`;

    const order = { present:0, late:1, leave:2, absent:3 };
    const rows  = allEmps.map(emp => {
      const att     = attMap[emp.id];
      const onLeave = leaveSet.has(emp.id);
      const status  = att ? att.status : (onLeave ? 'leave' : 'absent');
      return { emp, att, status };
    }).sort((a,b) => (order[a.status]||4) - (order[b.status]||4));

    const statusStyle = {
      present: { dot:'#10b981', bg:'rgba(16,185,129,.08)' },
      late:    { dot:'#f59e0b', bg:'rgba(245,158,11,.06)' },
      leave:   { dot:'#6366f1', bg:'rgba(99,102,241,.06)' },
      absent:  { dot:'#ef4444', bg:'rgba(239,68,68,.05)'  },
    };

    return rows.map(({ emp, att, status }) => {
      const dept    = DB.getDepartment(emp.dept);
      const checkIn = att?.checkIn || '—';
      const method  = att?.method  || '';
      const ss      = statusStyle[status] || statusStyle.absent;
      return `
        <div style="
          display:flex;align-items:center;gap:12px;
          padding:10px 16px;
          border-bottom:1px solid var(--border);
          transition:background .12s;
          background:${ss.bg};
          position:relative;
        " onmouseover="this.style.background='var(--bg-hover)'" onmouseout="this.style.background='${ss.bg}'">
          <div style="
            position:absolute;${currentLang==='ar'?'right':'left'}:0;top:0;bottom:0;
            width:3px;background:${ss.dot};
          "></div>
          ${App.renderAvatar(emp, 36, 10)}
          <div style="flex:1;min-width:0">
            <div style="font-size:13px;font-weight:600;color:var(--text-primary);
              white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${emp.name}</div>
            <div style="font-size:11px;color:var(--text-muted);
              white-space:nowrap;overflow:hidden;text-overflow:ellipsis">
              ${emp.position}${dept?' · '+dept.name:''}
            </div>
          </div>
          ${att ? `
            <div style="text-align:center;font-size:10px;color:var(--text-muted)">
              ${App.getMethodIcon(method)}
              <div style="margin-top:1px">${method}</div>
            </div>
          ` : ''}
          <div style="text-align:${currentLang==='ar'?'left':'right'};min-width:64px">
            <div style="font-size:13px;font-weight:700;color:var(--text-primary);font-family:var(--font-en)">${checkIn}</div>
            <div style="margin-top:2px">${App.getStatusBadge(status)}</div>
          </div>
        </div>
      `;
    }).join('');
  },

  /* ── Charts ───────────────────────────────────────────────── */
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
          { label: t('attendance.present'), data: trend.map(d=>d.present), borderColor:'#10b981', backgroundColor:'rgba(16,185,129,.08)', fill:true, tension:.4, pointBackgroundColor:'#10b981', pointRadius:4, pointHoverRadius:6, borderWidth:2.5 },
          { label: t('attendance.late'),    data: trend.map(d=>d.late),    borderColor:'#f59e0b', backgroundColor:'rgba(245,158,11,.06)',  fill:true, tension:.4, pointBackgroundColor:'#f59e0b', pointRadius:4, pointHoverRadius:6, borderWidth:2.5 },
          { label: t('dashboard.absent'),   data: trend.map(d=>d.absent||0),borderColor:'#ef4444',backgroundColor:'rgba(239,68,68,.05)',  fill:true, tension:.4, borderDash:[5,4], pointBackgroundColor:'#ef4444', pointRadius:4, pointHoverRadius:6, borderWidth:2 },
        ]
      },
      options: {
        responsive:true, maintainAspectRatio:false,
        plugins: {
          legend: { display:false },
          tooltip: { rtl: currentLang==='ar', bodyFont:{family:font}, titleFont:{family:font} }
        },
        scales: {
          x: { grid:{color:grid}, ticks:{color, font:{family:font, size:11}} },
          y: { grid:{color:grid}, ticks:{color, font:{family:font, size:11}}, beginAtZero:true }
        },
        interaction: { intersect:false, mode:'index' }
      }
    });
    App.registerChart('trend', chart);
  },

  _renderDeptChart() {
    const canvas = document.getElementById('dept-chart');
    const legend = document.getElementById('dept-legend');
    if (!canvas) return;

    const palette = ['#6366f1','#10b981','#f59e0b','#ef4444','#06b6d4','#8b5cf6','#f43f5e','#14b8a6','#a855f7','#ec4899','#84cc16','#f97316'];
    const { font } = App.getChartDefaults();

    const depts = DB.departments.map((d,i) => ({
      ...d,
      count: DB.employees.filter(e=>e.dept===d.id && e.status==='active').length,
      color: d.hex || palette[i % palette.length],
    })).filter(d=>d.count>0).sort((a,b)=>b.count-a.count).slice(0,8);

    const data     = depts.length ? depts.map(d=>d.count)  : [1];
    const labels   = depts.length ? depts.map(d=>d.name)   : [t('departments.noEmployees')];
    const bgColors = depts.length ? depts.map(d=>d.color)  : ['#e2e8f0'];

    const chart = new Chart(canvas, {
      type:'doughnut',
      data: { labels, datasets:[{ data, backgroundColor:bgColors, borderColor: App.state.theme==='dark'?'#0f172a':'#fff', borderWidth:3, hoverOffset:8 }] },
      options: {
        responsive:true, maintainAspectRatio:false, cutout:'68%',
        plugins: {
          legend:{display:false},
          tooltip:{ rtl:currentLang==='ar', bodyFont:{family:font}, titleFont:{family:font},
            callbacks:{ label:ctx=>` ${ctx.label}: ${ctx.raw} ${t('common.employees')}` }
          }
        }
      }
    });
    App.registerChart('dept', chart);

    if (legend) {
      legend.innerHTML = depts.length
        ? depts.map(d=>`
          <div style="display:flex;align-items:center;justify-content:space-between;
            padding:6px 0;border-bottom:1px solid var(--border)">
            <div style="display:flex;align-items:center;gap:8px">
              <div style="width:10px;height:10px;border-radius:3px;background:${d.color};flex-shrink:0"></div>
              <span style="font-size:12px;color:var(--text-secondary)">${d.name}</span>
            </div>
            <div style="display:flex;align-items:center;gap:6px">
              <div style="background:var(--border);border-radius:3px;height:4px;width:48px;overflow:hidden">
                <div style="height:4px;border-radius:3px;background:${d.color};width:${Math.round(d.count/Math.max(...depts.map(x=>x.count))*100)}%"></div>
              </div>
              <span style="font-size:13px;font-weight:700;color:var(--text-primary);width:20px;text-align:center">${d.count}</span>
            </div>
          </div>
        `).join('')
        : `<p style="text-align:center;color:var(--text-muted);font-size:12px;padding:12px">${t('dashboard.noEmpInDepts')}</p>`;
    }
  }
};
