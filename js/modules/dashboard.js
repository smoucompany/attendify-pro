/* =========================================================
   DASHBOARD — Enterprise Elite v4
   AI-Powered · Glassmorphism · Premium UX
   ========================================================= */

const DashboardModule = {

  _ai:   { open: false, history: [], thinking: false },
  _srch: { open: false },
  _glob: false,

  /* ═══════════════════════════════════════════════════════
     RENDER
  ═══════════════════════════════════════════════════════ */
  render(container) {
    const isAr     = currentLang === 'ar';
    const stats    = DB.getAttendanceStats();
    const trend    = DB.getAttendanceTrend();
    const counts   = DB.getPendingCount();
    const today    = DB.getTodayAttendance();
    const todayStr = new Date().toISOString().split('T')[0];
    const emps     = DB.employees.filter(e => e.status !== 'inactive');
    const company  = DB.company;

    const monthStart = todayStr.slice(0,7) + '-01';
    const monthOvMin = DB.attendance.filter(a => a.date >= monthStart && (a.overtime||0) > 0)
      .reduce((s,a) => s + (a.overtime||0), 0);
    const todayOvMin = DB.attendance.filter(a => a.date === todayStr && (a.overtime||0) > 0)
      .reduce((s,a) => s + (a.overtime||0), 0);
    const monthOvHrs = (monthOvMin/60).toFixed(1);
    const todayOvHrs = (todayOvMin/60).toFixed(1);
    const newHires   = emps.filter(e => e.hireDate && e.hireDate >= monthStart).length;
    const pending    = counts.leaves + counts.requests;

    const hr = new Date().getHours();
    const greet = isAr
      ? (hr<12?'صباح الخير':hr<17?'مساء الخير':'مساء النور')
      : (hr<12?'Good morning':hr<17?'Good afternoon':'Good evening');
    const dateLabel = new Date().toLocaleDateString(isAr?'ar-SA':'en-US',
      {weekday:'long',year:'numeric',month:'long',day:'numeric'});

    const trendP7 = trend.slice(-7);
    const insights = this._generateInsights(stats, counts, trend, emps, isAr);

    container.innerHTML = `

      <!-- ══ HERO ═══════════════════════════════════════════════ -->
      <div class="el-hero">
        <div class="el-hero-blob el-hero-blob-1"></div>
        <div class="el-hero-blob el-hero-blob-2"></div>
        <div class="el-hero-blob el-hero-blob-3"></div>
        <div class="el-hero-inner">
          <div class="el-hero-left">
            <div class="el-hero-greeting">
              <span class="el-hero-wave">👋</span>
              <span>${greet}</span>
            </div>
            <h1 class="el-hero-company">${_esc(company.name || (isAr?'الشركة':'Company'))}</h1>
            <p class="el-hero-date"><i class="fas fa-calendar-days"></i> ${dateLabel}</p>
            <div class="el-hero-pills">
              <div class="el-hero-pill el-pill-green">
                <span class="el-live-dot"></span>
                ${stats.present + stats.late} ${isAr?'حاضر':'Present'}
              </div>
              <div class="el-hero-pill el-pill-red">
                ${stats.absent} ${isAr?'غائب':'Absent'}
              </div>
              <div class="el-hero-pill el-pill-amber">
                ${stats.late} ${isAr?'متأخر':'Late'}
              </div>
              <div class="el-hero-pill el-pill-white">
                ${stats.onLeave} ${isAr?'إجازة':'Leave'}
              </div>
            </div>
            <div class="el-hero-actions">
              <button class="el-hero-btn el-hero-btn-primary" onclick="App.navigate('attendance')">
                <i class="fas fa-clock"></i> ${isAr?'تسجيل الحضور':'Check In'}
              </button>
              <button class="el-hero-btn el-hero-btn-ghost" onclick="App.navigate('reports')">
                <i class="fas fa-chart-bar"></i> ${isAr?'التقارير':'Reports'}
              </button>
              <button class="el-hero-btn el-hero-btn-ghost" onclick="DashboardModule._openSearch()">
                <i class="fas fa-magnifying-glass"></i>
                <kbd style="font-size:9px;opacity:.7;margin-${isAr?'right':'left'}:4px;background:rgba(255,255,255,.2);border-radius:4px;padding:1px 5px">⌘K</kbd>
              </button>
            </div>
          </div>
          <div class="el-hero-ring-wrap">
            <div class="el-ring-outer" style="background:conic-gradient(rgba(255,255,255,.9) 0% ${stats.attendanceRate}%, rgba(255,255,255,.15) ${stats.attendanceRate}% 100%)">
              <div class="el-ring-inner">
                <div class="el-ring-val">${stats.attendanceRate}<span style="font-size:14px">%</span></div>
                <div class="el-ring-lbl">${isAr?'الحضور':'Attend.'}</div>
              </div>
            </div>
            <div class="el-ring-label">${isAr?'معدل حضور اليوم':'Today\'s Rate'}</div>
          </div>
        </div>
        <!-- Attendance progress bar -->
        <div class="el-hero-bar-wrap">
          <div class="el-hero-bar-track">
            <div class="el-hero-bar-seg el-seg-present" style="width:${Math.round(stats.present/(emps.length||1)*100)}%"></div>
            <div class="el-hero-bar-seg el-seg-late"    style="width:${Math.round(stats.late/(emps.length||1)*100)}%"></div>
            <div class="el-hero-bar-seg el-seg-leave"   style="width:${Math.round(stats.onLeave/(emps.length||1)*100)}%"></div>
            <div class="el-hero-bar-seg el-seg-absent"  style="width:${Math.round(stats.absent/(emps.length||1)*100)}%"></div>
          </div>
          <div class="el-hero-bar-labels">
            <span style="color:rgba(255,255,255,.65);font-size:10px">${isAr?'حاضر':'Present'}</span>
            <span style="color:rgba(255,255,255,.65);font-size:10px">${isAr?'متأخر':'Late'}</span>
            <span style="color:rgba(255,255,255,.65);font-size:10px">${isAr?'إجازة':'Leave'}</span>
            <span style="color:rgba(255,255,255,.65);font-size:10px">${isAr?'غائب':'Absent'}</span>
          </div>
        </div>
      </div>

      <!-- ══ METRICS ════════════════════════════════════════════ -->
      <div class="el-metrics">
        ${this._metric({i:0,color:'#6366f1',icon:'fas fa-users',         val:emps.length,      suf:'',  lbl:isAr?'الموظفون':'Employees',      sub:newHires>0?`+${newHires} ${isAr?'جديد':'new'}`:isAr?'هذا الشهر':'this month',     up:newHires>0, spark:trendP7.map(d=>d.present+d.late),   link:'employees'})}
        ${this._metric({i:1,color:'#10b981',icon:'fas fa-circle-check',  val:stats.present+stats.late,suf:'',lbl:isAr?'حاضرون اليوم':'Present Today', sub:`${stats.attendanceRate}% ${isAr?'معدل':'rate'}`,up:stats.attendanceRate>=75,spark:trendP7.map(d=>d.present+d.late),link:'attendance'})}
        ${this._metric({i:2,color:'#f59e0b',icon:'fas fa-clock',         val:stats.late,       suf:'',  lbl:isAr?'التأخرات':'Late Arrivals',   sub:isAr?'اليوم':'today',             up:false,dn:stats.late>3,      spark:trendP7.map(d=>d.late),            link:'attendance'})}
        ${this._metric({i:3,color:'#ef4444',icon:'fas fa-user-xmark',    val:stats.absent,     suf:'',  lbl:isAr?'الغائبون':'Absent',          sub:isAr?'بدون إذن':'unexcused',      up:false,dn:stats.absent>5,   spark:trendP7.map(d=>d.absent||0),       link:'attendance'})}
        ${this._metric({i:4,color:'#8b5cf6',icon:'fas fa-umbrella-beach',val:stats.onLeave,    suf:'',  lbl:isAr?'الإجازات':'On Leave',        sub:isAr?'إجازات مؤكدة':'approved',   up:false,neu:true,           spark:trendP7.map(()=>stats.onLeave),    link:'leaves'})}
        ${this._metric({i:5,color:'#3b82f6',icon:'fas fa-percent',       val:stats.attendanceRate,suf:'%',lbl:isAr?'نسبة الحضور':'Rate',      sub:isAr?'مقارنة بالأمس':'vs yesterday',up:stats.attendanceRate>=80,dn:stats.attendanceRate<60,spark:trendP7.map(d=>Math.round((d.present+d.late)/(emps.length||1)*100)),link:'reports'})}
        ${this._metric({i:6,color:'#14b8a6',icon:'fas fa-hourglass-half',val:monthOvHrs,       suf:'h', lbl:isAr?'ساعات إضافية':'Overtime',    sub:`${todayOvHrs}h ${isAr?'اليوم':'today'}`,up:todayOvMin>0,       spark:trendP7.map(()=>Math.round(monthOvMin/60/7)),link:'attendance'})}
        ${this._metric({i:7,color:'#ec4899',icon:'fas fa-inbox',         val:pending,          suf:'',  lbl:isAr?'طلبات معلقة':'Pending',      sub:isAr?'بانتظار الموافقة':'await',  up:false,dn:pending>5,        spark:trendP7.map(()=>pending),          link:'requests'})}
      </div>

      <!-- ══ AI INSIGHTS ════════════════════════════════════════ -->
      ${insights.length > 0 ? `
        <div class="el-insights-wrap">
          <div class="el-insights-head">
            <div class="el-insights-title">
              <span class="el-ai-chip"><i class="fas fa-sparkles"></i> AI</span>
              ${isAr?'رؤى ذكية':'Smart Insights'}
            </div>
            <span style="font-size:11px;color:var(--text-muted)">${insights.length} ${isAr?'رؤية':'insights'}</span>
          </div>
          <div class="el-insights-scroll">
            ${insights.map(ins => `
              <div class="el-insight-card el-ins-${ins.type}">
                <div class="el-insight-icon">${ins.emoji}</div>
                <div class="el-insight-body">
                  <div class="el-insight-title">${ins.title}</div>
                  <div class="el-insight-desc">${ins.desc}</div>
                </div>
                ${ins.action ? `
                  <button class="el-insight-btn" onclick="App.navigate('${ins.link||''}')">
                    ${ins.action} <i class="fas fa-arrow-${isAr?'left':'right'}" style="font-size:9px"></i>
                  </button>
                ` : ''}
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}

      <!-- ══ CHARTS ════════════════════════════════════════════ -->
      <div class="el-charts-grid">
        <div class="el-card">
          <div class="el-card-head">
            <div>
              <div class="el-card-title"><i class="fas fa-chart-line" style="color:#6366f1"></i> ${isAr?'اتجاه الحضور':'Attendance Trend'}</div>
              <div class="el-card-sub">${isAr?'آخر 14 يوم — منحنى تفاعلي':'Last 14 days — interactive curve'}</div>
            </div>
            <div style="display:flex;gap:12px">
              ${[{c:'#10b981',l:isAr?'حاضر':'Present'},{c:'#f59e0b',l:isAr?'متأخر':'Late'},{c:'#ef4444',l:isAr?'غائب':'Absent'}].map(x=>`
                <div style="display:flex;align-items:center;gap:4px;font-size:11px;color:var(--text-muted);font-weight:600">
                  <div style="width:8px;height:8px;border-radius:50%;background:${x.c}"></div>${x.l}
                </div>
              `).join('')}
            </div>
          </div>
          <div class="el-card-body">
            <div style="height:250px"><canvas id="el-trend-chart"></canvas></div>
          </div>
        </div>
        <div style="display:flex;flex-direction:column;gap:16px">
          <div class="el-card" style="flex:1">
            <div class="el-card-head">
              <div>
                <div class="el-card-title"><i class="fas fa-chart-pie" style="color:#8b5cf6"></i> ${isAr?'الأقسام':'Departments'}</div>
                <div class="el-card-sub">${isAr?'توزيع الموظفين':'Distribution'}</div>
              </div>
            </div>
            <div class="el-card-body">
              <div style="height:175px"><canvas id="el-dept-chart"></canvas></div>
              <div style="margin-top:10px" id="el-dept-legend"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- ══ BOTTOM ROW ════════════════════════════════════════ -->
      <div class="el-bottom-grid">

        <!-- Activity Feed -->
        <div class="el-card el-activity-card">
          <div class="el-card-head">
            <div>
              <div class="el-card-title">
                <i class="fas fa-bolt" style="color:#10b981"></i> ${isAr?'نشاط اليوم':'Live Activity'}
                <span class="el-live-badge">${isAr?'مباشر':'LIVE'}</span>
              </div>
              <div class="el-card-sub">${isAr?'سجل الحضور الفوري':'Real-time attendance log'}</div>
            </div>
            <button class="el-link-btn" onclick="App.navigate('attendance')">
              ${isAr?'عرض الكل':'View all'} <i class="fas fa-arrow-${isAr?'left':'right'}" style="font-size:10px"></i>
            </button>
          </div>
          <div class="el-activity-list">
            ${this._renderActivity(today, isAr)}
          </div>
        </div>

        <!-- Side: Pending + Weekly -->
        <div style="display:flex;flex-direction:column;gap:16px">

          <div class="el-card">
            <div class="el-card-head">
              <div>
                <div class="el-card-title"><i class="fas fa-calendar-clock" style="color:#f59e0b"></i> ${isAr?'إجازات معلقة':'Pending Leaves'}</div>
                <div class="el-card-sub">${counts.leaves} ${isAr?'بانتظار قرار':'awaiting'}</div>
              </div>
              <button class="el-link-btn" onclick="App.navigate('leaves')">${isAr?'الكل':'All'}</button>
            </div>
            <div class="el-card-body" style="padding:8px 16px 14px">
              ${this._renderPending(isAr)}
            </div>
          </div>

          <div class="el-card">
            <div class="el-card-head">
              <div>
                <div class="el-card-title"><i class="fas fa-calendar-week" style="color:#3b82f6"></i> ${isAr?'ملخص الأسبوع':'Weekly'}</div>
              </div>
            </div>
            <div class="el-card-body">
              ${this._renderWeekly(trend, isAr, emps.length)}
            </div>
          </div>

        </div>
      </div>
    `;

    // Charts + animations
    setTimeout(() => {
      this._renderTrendChart(trend);
      this._renderDeptChart();
      this._animateCounters();
    }, 100);

    // One-time global init
    if (!this._glob) { this._initGlobal(); this._glob = true; }
  },

  /* ═══════════════════════════════════════════════════════
     METRIC CARD + SPARKLINE
  ═══════════════════════════════════════════════════════ */
  _metric({ i, color, icon, val, suf, lbl, sub, up, dn, neu, spark, link }) {
    const isAr = currentLang === 'ar';
    const trend = up ? { cls:'el-m-up', ico:'fa-arrow-trend-up', lbl:isAr?'ارتفاع':'Rising' }
                : dn ? { cls:'el-m-dn', ico:'fa-arrow-trend-down', lbl:isAr?'انخفاض':'Falling' }
                :      { cls:'el-m-neu',ico:'fa-minus',            lbl:isAr?'ثابت':'Stable' };
    const anims = ['elFloat','elBounce','elSwing','elTick','elShake','elSpin','elPulse','elWobble'];
    const anim  = anims[i % anims.length];
    const delay = (i * 0.09).toFixed(2);

    return `
      <div class="el-metric" style="
        border-${isAr?'right':'left'}:3px solid ${color};
        animation:elSlideUp .45s cubic-bezier(.34,1.2,.64,1) ${delay}s both;
      " onclick="App.navigate('${link}')">
        <div class="el-metric-top">
          <span class="el-trend ${trend.cls}">
            <i class="fas ${trend.ico}" style="font-size:9px"></i> ${trend.lbl}
          </span>
          <div class="el-metric-icon-wrap" style="--mc:${color}">
            <div class="el-metric-ring"></div>
            <div class="el-metric-icon" style="background:${color}15;animation:${anim} ${[3,2.4,3.5,4,2.8,7,2.5,3][i%8]}s ease-in-out ${(i*.35).toFixed(1)}s infinite">
              <i class="${icon}" style="color:${color};font-size:19px"></i>
            </div>
          </div>
        </div>
        <div class="el-metric-row">
          <div>
            <div class="el-metric-val">
              <span class="el-counter" data-t="${val}" data-s="${suf}" data-n="${!isNaN(Number(String(val).replace(/[,.]/g,''))) && Number(val)>0}">${val}${suf}</span>
            </div>
            <div class="el-metric-lbl">${lbl}</div>
            <div class="el-metric-sub">${sub}</div>
          </div>
          <div class="el-sparkline-wrap">
            ${this._sparkline(spark || [], color)}
          </div>
        </div>
        <div class="el-metric-line" style="background:linear-gradient(${isAr?'to left':'to right'},${color},${color}44,transparent);animation:elLineGrow .8s ease ${(i*.1+.3).toFixed(2)}s both"></div>
      </div>
    `;
  },

  _sparkline(data, color) {
    if (!data || data.length < 2) return '';
    const W = 80, H = 32;
    const max = Math.max(...data, 1);
    const min = Math.min(...data, 0);
    const rng = max - min || 1;
    const pts = data.map((v,i) => `${(i/(data.length-1))*W},${H-((v-min)/rng)*(H-6)-3}`);
    const fill = `M${pts[0]} L${pts.join(' L')} L${W},${H} L0,${H}Z`;
    const line = `M${pts.join(' L')}`;
    const id   = `sp${color.replace(/[^a-z0-9]/gi,'').slice(0,6)}${Math.random().toString(36).slice(2,5)}`;
    return `
      <svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" fill="none">
        <defs>
          <linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="${color}" stop-opacity=".3"/>
            <stop offset="100%" stop-color="${color}" stop-opacity="0"/>
          </linearGradient>
        </defs>
        <path d="${fill}" fill="url(#${id})"/>
        <path d="${line}" stroke="${color}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `;
  },

  /* ═══════════════════════════════════════════════════════
     AI INSIGHTS
  ═══════════════════════════════════════════════════════ */
  _generateInsights(stats, counts, trend, emps, isAr) {
    const ins = [];
    const todayStr = new Date().toISOString().split('T')[0];
    const monthStart = todayStr.slice(0,7) + '-01';

    if (stats.attendanceRate >= 90) {
      ins.push({ type:'success', emoji:'🏆',
        title: isAr?'أداء حضور استثنائي':'Exceptional Attendance',
        desc:  isAr?`${stats.attendanceRate}% من الفريق حاضر اليوم — رائع!`:`${stats.attendanceRate}% of the team present today — outstanding!`,
        action: isAr?'تقارير':'Reports', link:'reports'
      });
    } else if (stats.attendanceRate < 65) {
      ins.push({ type:'danger', emoji:'⚠️',
        title: isAr?'معدل حضور منخفض':'Low Attendance Alert',
        desc:  isAr?`الحضور اليوم ${stats.attendanceRate}% — أقل من الحد المطلوب 75%`:`Attendance is ${stats.attendanceRate}% — below the 75% threshold`,
        action: isAr?'تفاصيل':'Details', link:'attendance'
      });
    }

    // Late arrivals
    if (stats.late > 3) {
      ins.push({ type:'warning', emoji:'🕐',
        title: isAr?'موجة تأخرات اليوم':'Late Wave Detected',
        desc:  isAr?`${stats.late} موظف تأخر اليوم — تحقق من أسباب التأخر`:`${stats.late} employees arrived late today`,
        action: isAr?'عرض':'View', link:'attendance'
      });
    }

    // Most late employee this month
    const lateCounts = {};
    DB.attendance.filter(a => a.date >= monthStart && a.status === 'late')
      .forEach(a => { lateCounts[a.empId] = (lateCounts[a.empId]||0) + 1; });
    const topLate = Object.entries(lateCounts).sort((a,b) => b[1]-a[1])[0];
    if (topLate && topLate[1] >= 4) {
      const emp = DB.getEmployee(topLate[0]);
      if (emp) ins.push({ type:'warning', emoji:'📌',
        title: isAr?'تأخر متكرر':'Frequent Late Arrival',
        desc:  isAr?`${emp.name} تأخر ${topLate[1]} مرات هذا الشهر`:`${emp.name} has been late ${topLate[1]} times this month`,
        action: isAr?'ملف الموظف':'Profile', link:'employees'
      });
    }

    // Pending leaves
    if (counts.leaves > 0) {
      ins.push({ type: counts.leaves > 5 ? 'danger' : 'info', emoji:'📋',
        title: isAr?'إجازات تحتاج موافقة':'Leaves Need Approval',
        desc:  isAr?`${counts.leaves} طلب إجازة في انتظار قرارك`:`${counts.leaves} leave request(s) awaiting your decision`,
        action: isAr?'موافقة':'Approve', link:'leaves'
      });
    }

    // New hires
    const newH = emps.filter(e => e.hireDate && e.hireDate >= monthStart).length;
    if (newH > 0) {
      ins.push({ type:'success', emoji:'🎉',
        title: isAr?'موظفون جدد':'New Team Members',
        desc:  isAr?`${newH} موظف جديد انضم هذا الشهر — رحّب بهم!`:`${newH} new employee(s) joined this month`,
        action: isAr?'عرض':'View', link:'employees'
      });
    }

    // Absent count
    if (stats.absent > Math.round(emps.length * 0.15)) {
      ins.push({ type:'danger', emoji:'🚨',
        title: isAr?'غياب مرتفع':'High Absence Rate',
        desc:  isAr?`${stats.absent} غائب اليوم (${Math.round(stats.absent/emps.length*100)}% من الفريق)`:`${stats.absent} absent today (${Math.round(stats.absent/(emps.length||1)*100)}% of team)`,
        action: isAr?'تفاصيل':'Details', link:'attendance'
      });
    }

    // Weekend approaching
    const day = new Date().getDay();
    if (day === 4 && isAr) ins.push({ type:'info', emoji:'📅',
      title:'نهاية الأسبوع قريبة',
      desc:'غداً عطلة — تأكد من تسوية أي طلبات معلقة',
    });

    return ins.slice(0, 6);
  },

  /* ═══════════════════════════════════════════════════════
     ACTIVITY FEED
  ═══════════════════════════════════════════════════════ */
  _renderActivity(today, isAr) {
    const todayStr = new Date().toISOString().split('T')[0];
    const attMap   = {};
    today.forEach(a => { attMap[a.empId] = a; });
    const leaveSet = new Set(
      DB.leaves.filter(l => l.status==='approved' && l.from<=todayStr && l.to>=todayStr).map(l=>l.empId)
    );
    const allEmps = DB.employees.filter(e => e.status==='active');
    if (!allEmps.length) return `<div style="padding:24px;text-align:center;color:var(--text-muted);font-size:13px">${isAr?'لا يوجد موظفون':'No employees'}</div>`;

    const order = { present:0, late:1, leave:2, absent:3 };
    const rows = allEmps.map(emp => {
      const att     = attMap[emp.id];
      const onLeave = leaveSet.has(emp.id);
      const status  = att ? att.status : (onLeave ? 'leave' : 'absent');
      return { emp, att, status };
    }).sort((a,b) => (order[a.status]||4) - (order[b.status]||4));

    const cfg = {
      present: { dot:'#10b981', bg:'rgba(16,185,129,.04)' },
      late:    { dot:'#f59e0b', bg:'rgba(245,158,11,.04)' },
      leave:   { dot:'#8b5cf6', bg:'rgba(139,92,246,.04)' },
      absent:  { dot:'#ef4444', bg:'rgba(239,68,68,.03)'  },
    };

    return rows.map(({ emp, att, status }) => {
      const dept  = DB.getDepartment(emp.dept);
      const c     = cfg[status] || cfg.absent;
      const badge = { present:'#10b981', late:'#f59e0b', leave:'#8b5cf6', absent:'#ef4444' };
      const lbl   = { present: isAr?'حاضر':'Present', late: isAr?'متأخر':'Late', leave: isAr?'إجازة':'Leave', absent: isAr?'غائب':'Absent' };
      return `
        <div class="el-act-row" style="background:${c.bg}">
          <div class="el-act-dot" style="background:${c.dot}"></div>
          ${App.renderAvatar(emp, 34, 10)}
          <div style="flex:1;min-width:0">
            <div style="font-size:13px;font-weight:600;color:var(--text-primary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${emp.name}</div>
            <div style="font-size:11px;color:var(--text-muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${emp.position||''}${dept?' · '+dept.name:''}</div>
          </div>
          <div style="text-align:${isAr?'left':'right'};flex-shrink:0">
            <div style="font-size:13px;font-weight:700;color:var(--text-primary);font-family:var(--font-en)">${att?.checkIn||'—'}</div>
            <span style="font-size:10px;font-weight:700;padding:2px 8px;border-radius:8px;background:${badge[status]}18;color:${badge[status]}">${lbl[status]||status}</span>
          </div>
        </div>
      `;
    }).join('');
  },

  _renderPending(isAr) {
    const pending = DB.leaves.filter(l => l.status==='pending').slice(0,3);
    if (!pending.length) return `<div style="text-align:center;padding:16px;color:var(--text-muted);font-size:13px">✅ ${isAr?'لا إجازات معلقة':'No pending leaves'}</div>`;
    return pending.map(l => {
      const emp  = DB.getEmployee(l.empId);
      const type = App.getLeaveTypeLabel(l.type);
      return `
        <div style="display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid var(--border)">
          <div style="width:4px;height:36px;border-radius:2px;background:${type.color};flex-shrink:0"></div>
          ${App.renderAvatar(emp, 32, 9)}
          <div style="flex:1;min-width:0">
            <div style="font-size:12px;font-weight:600;color:var(--text-primary)">${emp?.name||'—'}</div>
            <div style="font-size:11px;color:var(--text-muted)">${type.label} · ${l.days} ${isAr?'يوم':'days'}</div>
          </div>
          <div style="display:flex;gap:5px">
            <button class="btn btn-success btn-sm" style="padding:4px 8px" onclick="LeavesModule.approve('${l.id}')"><i class="fas fa-check"></i></button>
            <button class="btn btn-danger btn-sm"  style="padding:4px 8px" onclick="LeavesModule.reject('${l.id}')"><i class="fas fa-xmark"></i></button>
          </div>
        </div>
      `;
    }).join('');
  },

  _renderWeekly(trend, isAr, total) {
    return trend.slice(-5).map(d => {
      const n    = d.present + d.late;
      const pct  = Math.round((n / (total||1)) * 100);
      const day  = new Date(d.date+'T12:00:00').toLocaleDateString(isAr?'ar-SA':'en-US',{weekday:'short'});
      const clr  = pct >= 80 ? '#10b981' : pct >= 50 ? '#f59e0b' : '#ef4444';
      return `
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">
          <span style="font-size:11px;color:var(--text-muted);width:44px;flex-shrink:0;font-weight:600;text-align:center">${day}</span>
          <div style="flex:1;background:var(--border);border-radius:6px;height:6px;overflow:hidden">
            <div style="height:6px;border-radius:6px;background:${clr};width:${pct}%;transition:width .6s ease"></div>
          </div>
          <span style="font-size:12px;font-weight:700;color:var(--text-primary);width:38px;text-align:center">${pct}%</span>
          <span style="font-size:10px;color:var(--text-muted);width:32px">${n}/${total}</span>
        </div>
      `;
    }).join('');
  },

  /* ═══════════════════════════════════════════════════════
     CHARTS
  ═══════════════════════════════════════════════════════ */
  _renderTrendChart(trend) {
    const canvas = document.getElementById('el-trend-chart');
    if (!canvas) return;
    const { color, grid, font } = App.getChartDefaults();
    const labels = trend.map(d => new Date(d.date).toLocaleDateString(
      currentLang==='ar'?'ar-SA':'en-US', {weekday:'short',day:'numeric'}));
    const chart = new Chart(canvas, {
      type:'line',
      data:{
        labels,
        datasets:[
          { label:'Present', data:trend.map(d=>d.present), borderColor:'#10b981', backgroundColor:'rgba(16,185,129,.08)', fill:true, tension:.4, pointBackgroundColor:'#10b981', pointRadius:3, borderWidth:2.5 },
          { label:'Late',    data:trend.map(d=>d.late),    borderColor:'#f59e0b', backgroundColor:'rgba(245,158,11,.06)', fill:true, tension:.4, pointBackgroundColor:'#f59e0b', pointRadius:3, borderWidth:2.5 },
          { label:'Absent',  data:trend.map(d=>d.absent||0),borderColor:'#ef4444',backgroundColor:'rgba(239,68,68,.05)', fill:true, tension:.4, borderDash:[4,3], pointBackgroundColor:'#ef4444', pointRadius:3, borderWidth:2 },
        ]
      },
      options:{
        responsive:true, maintainAspectRatio:false,
        plugins:{ legend:{display:false}, tooltip:{rtl:currentLang==='ar',bodyFont:{family:font},titleFont:{family:font}} },
        scales:{
          x:{grid:{color:grid},ticks:{color,font:{family:font,size:11}}},
          y:{grid:{color:grid},ticks:{color,font:{family:font,size:11}},beginAtZero:true}
        },
        interaction:{intersect:false,mode:'index'}
      }
    });
    App.registerChart('trend', chart);
  },

  _renderDeptChart() {
    const canvas = document.getElementById('el-dept-chart');
    const legend = document.getElementById('el-dept-legend');
    if (!canvas) return;
    const palette = ['#6366f1','#10b981','#f59e0b','#ef4444','#06b6d4','#8b5cf6','#f43f5e','#14b8a6'];
    const { font } = App.getChartDefaults();
    const depts = DB.departments.map((d,i) => ({
      ...d, color: d.hex||palette[i%palette.length],
      count: DB.employees.filter(e=>e.dept===d.id&&e.status==='active').length,
    })).filter(d=>d.count>0).sort((a,b)=>b.count-a.count).slice(0,8);

    const chart = new Chart(canvas, {
      type:'doughnut',
      data:{ labels:depts.map(d=>d.name), datasets:[{
        data:depts.map(d=>d.count), backgroundColor:depts.map(d=>d.color),
        borderColor:App.state.theme==='dark'?'#0f172a':'#fff', borderWidth:3, hoverOffset:6,
      }]},
      options:{ responsive:true, maintainAspectRatio:false, cutout:'70%',
        plugins:{ legend:{display:false},
          tooltip:{ rtl:currentLang==='ar', bodyFont:{family:font}, titleFont:{family:font},
            callbacks:{ label:c=>` ${c.label}: ${c.raw}` }
          }
        }
      }
    });
    App.registerChart('dept', chart);

    if (legend) legend.innerHTML = depts.map(d => `
      <div style="display:flex;align-items:center;justify-content:space-between;padding:5px 0;border-bottom:1px solid var(--border)">
        <div style="display:flex;align-items:center;gap:7px">
          <div style="width:9px;height:9px;border-radius:3px;background:${d.color};flex-shrink:0"></div>
          <span style="font-size:11.5px;color:var(--text-secondary)">${d.name}</span>
        </div>
        <div style="display:flex;align-items:center;gap:6px">
          <div style="width:44px;background:var(--border);border-radius:3px;height:3px;overflow:hidden">
            <div style="height:3px;border-radius:3px;background:${d.color};width:${Math.round(d.count/Math.max(...depts.map(x=>x.count))*100)}%"></div>
          </div>
          <span style="font-size:12px;font-weight:700;color:var(--text-primary);width:18px;text-align:center">${d.count}</span>
        </div>
      </div>
    `).join('');
  },

  /* ═══════════════════════════════════════════════════════
     COUNTER ANIMATION
  ═══════════════════════════════════════════════════════ */
  _animateCounters() {
    document.querySelectorAll('.el-counter').forEach((el, i) => {
      const target  = parseFloat(el.dataset.t);
      const suffix  = el.dataset.s || '';
      if (el.dataset.n !== 'true' || isNaN(target)) return;
      const isFloat = el.dataset.t.includes('.');
      const dur     = Math.min(900 + target*8, 1600);
      setTimeout(() => {
        const t0 = performance.now();
        const tick = now => {
          const p = Math.min((now-t0)/dur, 1);
          const e = 1 - Math.pow(1-p, 3);
          el.textContent = (isFloat ? (target*e).toFixed(1) : Math.round(target*e)) + suffix;
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }, i * 55 + 280);
    });
  },

  /* ═══════════════════════════════════════════════════════
     GLOBAL INIT — runs once across all navigations
  ═══════════════════════════════════════════════════════ */
  _initGlobal() {
    this._buildAIPanel();
    this._buildSearch();
    this._buildFAB();

    // Ctrl+K / Cmd+K
    document.addEventListener('keydown', e => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        this._openSearch();
      }
      if (e.key === 'Escape') {
        this._closeSearch();
        this._closeAI();
      }
    });
  },

  /* ═══════════════════════════════════════════════════════
     AI ASSISTANT PANEL
  ═══════════════════════════════════════════════════════ */
  _buildAIPanel() {
    const isAr = currentLang === 'ar';
    const panel = document.createElement('div');
    panel.id  = 'el-ai-panel';
    panel.className = 'el-ai-panel';
    panel.innerHTML = `
      <div class="el-ai-header">
        <div style="display:flex;align-items:center;gap:10px">
          <div class="el-ai-avatar"><i class="fas fa-sparkles"></i></div>
          <div>
            <div style="font-size:14px;font-weight:700;color:var(--text-primary)">${isAr?'مساعد Attendify الذكي':'Attendify AI'}</div>
            <div style="font-size:11px;color:#10b981;display:flex;align-items:center;gap:4px">
              <div class="el-live-dot" style="width:6px;height:6px"></div>
              ${isAr?'متصل الآن':'Online now'}
            </div>
          </div>
        </div>
        <button onclick="DashboardModule._closeAI()" class="el-ai-close"><i class="fas fa-xmark"></i></button>
      </div>
      <div class="el-ai-messages" id="el-ai-msgs">
        <div class="el-ai-msg el-ai-msg-bot">
          <div class="el-ai-bubble">
            ${isAr
              ? '👋 مرحباً! أنا مساعدك الذكي. يمكنني الإجابة على أسئلتك حول الحضور، الموظفين، التقارير، وأي شيء في النظام.'
              : "👋 Hello! I'm your AI assistant. Ask me anything about attendance, employees, reports, or any part of the system."}
          </div>
        </div>
        <div style="padding:8px 16px 4px">
          <div style="font-size:11px;color:var(--text-muted);margin-bottom:8px;font-weight:600">${isAr?'أسئلة شائعة:':'Quick questions:'}</div>
          <div style="display:flex;flex-wrap:wrap;gap:6px">
            ${(isAr
              ? ['كم عدد الموظفين؟','من غائب اليوم؟','معدل الحضور؟','الإجازات المعلقة']
              : ['How many employees?','Who is absent?','Attendance rate?','Pending leaves?']
            ).map(q=>`<button class="el-ai-chip-btn" onclick="DashboardModule._sendAI('${q}')">${q}</button>`).join('')}
          </div>
        </div>
      </div>
      <form class="el-ai-input-row" onsubmit="DashboardModule._sendAI();return false">
        <input id="el-ai-input" class="el-ai-input" placeholder="${isAr?'اكتب سؤالك...':'Ask anything...'}" autocomplete="off">
        <button type="submit" class="el-ai-send"><i class="fas fa-paper-plane"></i></button>
      </form>
    `;
    document.body.appendChild(panel);
  },

  _openAI()  { document.getElementById('el-ai-panel')?.classList.add('el-ai-open'); this._ai.open = true; },
  _closeAI() { document.getElementById('el-ai-panel')?.classList.remove('el-ai-open'); this._ai.open = false; },
  _toggleAI(){ this._ai.open ? this._closeAI() : this._openAI(); },

  async _sendAI(preset) {
    const input = document.getElementById('el-ai-input');
    const msg   = preset || (input?.value || '').trim();
    if (!msg) return;
    if (input) input.value = '';

    const msgs = document.getElementById('el-ai-msgs');
    if (!msgs) return;

    // User bubble
    msgs.insertAdjacentHTML('beforeend', `
      <div class="el-ai-msg el-ai-msg-user"><div class="el-ai-bubble">${_esc(msg)}</div></div>
    `);

    // Thinking
    const thinkId = 'el-think-' + Date.now();
    msgs.insertAdjacentHTML('beforeend', `
      <div class="el-ai-msg el-ai-msg-bot" id="${thinkId}">
        <div class="el-ai-bubble el-ai-thinking">
          <span></span><span></span><span></span>
        </div>
      </div>
    `);
    msgs.scrollTop = msgs.scrollHeight;

    this._ai.history = this._ai.history || [];

    let html;
    try {
      const res = await SupabaseDB._fetch('/api/ai/chat', {
        method: 'POST',
        body: JSON.stringify({ message: msg, history: this._ai.history }),
      });
      if (res.ok && res.data?.reply) {
        this._ai.history.push({ role: 'user', content: msg }, { role: 'assistant', content: res.data.reply });
        if (this._ai.history.length > 16) this._ai.history = this._ai.history.slice(-16);
        html = this._renderAIMarkdown(res.data.reply);
      } else {
        // No API key configured / provider error — fall back to local rule-based answers
        html = this._aiReply(msg) + (res.data?.error ? `<div class="el-ai-hint">${_esc(res.data.error)}</div>` : '');
      }
    } catch (e) {
      html = this._aiReply(msg);
    }

    const think = document.getElementById(thinkId);
    if (think) think.innerHTML = `<div class="el-ai-bubble">${html}</div>`;
    msgs.scrollTop = msgs.scrollHeight;
  },

  // Minimal markdown → HTML for AI replies: bold, line breaks, pipe tables
  _renderAIMarkdown(text) {
    const lines = String(text).split('\n');
    let html = '';
    let i = 0;
    while (i < lines.length) {
      const line = lines[i];
      if (/^\s*\|.*\|\s*$/.test(line) && /^\s*\|[\s:|-]+\|\s*$/.test(lines[i + 1] || '')) {
        const header = line.split('|').map(s => s.trim()).filter(Boolean);
        let body = [];
        i += 2;
        while (i < lines.length && /^\s*\|.*\|\s*$/.test(lines[i])) {
          body.push(lines[i].split('|').map(s => s.trim()).filter(Boolean));
          i++;
        }
        html += `<table class="el-ai-table"><thead><tr>${header.map(h => `<th>${_esc(h)}</th>`).join('')}</tr></thead><tbody>${
          body.map(row => `<tr>${row.map(c => `<td>${_esc(c)}</td>`).join('')}</tr>`).join('')
        }</tbody></table>`;
        continue;
      }
      html += `${_esc(line).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')}<br>`;
      i++;
    }
    return html;
  },

  _aiReply(msg) {
    const isAr = currentLang === 'ar';
    const m    = msg.toLowerCase();
    const stats = DB.getAttendanceStats();
    const emps  = DB.employees.filter(e => e.status !== 'inactive');
    const todayStr = new Date().toISOString().split('T')[0];

    // Attendance questions
    if (m.includes('حضور') || m.includes('attend') || m.includes('rate') || m.includes('نسبة')) {
      return isAr
        ? `📊 معدل الحضور اليوم <strong>${stats.attendanceRate}%</strong><br>حاضر: ${stats.present} | متأخر: ${stats.late} | غائب: ${stats.absent} | إجازة: ${stats.onLeave}`
        : `📊 Today's attendance rate is <strong>${stats.attendanceRate}%</strong><br>Present: ${stats.present} | Late: ${stats.late} | Absent: ${stats.absent} | Leave: ${stats.onLeave}`;
    }

    // Employee count
    if (m.includes('عدد الموظف') || m.includes('كم موظف') || m.includes('how many emp') || m.includes('employees')) {
      const active = emps.filter(e=>e.status==='active').length;
      const total  = emps.length;
      return isAr
        ? `👥 يوجد في النظام <strong>${total}</strong> موظف، منهم <strong>${active}</strong> نشط حالياً.`
        : `👥 There are <strong>${total}</strong> employees total, <strong>${active}</strong> are currently active.`;
    }

    // Absent today
    if (m.includes('غائب') || m.includes('absent')) {
      const absent = DB.attendance.filter(a=>a.date===todayStr&&a.status==='absent');
      const names  = absent.map(a=>DB.getEmployee(a.empId)?.name).filter(Boolean).slice(0,5);
      return isAr
        ? `🚨 الغائبون اليوم (${stats.absent}):<br>${names.length ? names.join('<br>') : 'لا يوجد تسجيل غياب بعد'}`
        : `🚨 Absent today (${stats.absent}):<br>${names.length ? names.join('<br>') : 'No absence records yet'}`;
    }

    // Late today
    if (m.includes('متأخر') || m.includes('late')) {
      const lates = DB.attendance.filter(a=>a.date===todayStr&&a.status==='late');
      const names = lates.map(a=>DB.getEmployee(a.empId)?.name).filter(Boolean).slice(0,5);
      return isAr
        ? `🕐 المتأخرون اليوم (${stats.late}):<br>${names.length ? names.join('<br>') : 'لا أحد'}`
        : `🕐 Late today (${stats.late}):<br>${names.length ? names.join('<br>') : 'None'}`;
    }

    // Pending leaves
    if (m.includes('إجازة') || m.includes('معلق') || m.includes('leave') || m.includes('pending')) {
      const pending = DB.leaves.filter(l=>l.status==='pending');
      return isAr
        ? `📋 يوجد <strong>${pending.length}</strong> طلب إجازة معلق بانتظار الموافقة.`
        : `📋 There are <strong>${pending.length}</strong> pending leave requests awaiting approval.`;
    }

    // Departments
    if (m.includes('قسم') || m.includes('dept') || m.includes('department')) {
      const depts = DB.departments.map(d => `${d.name}: ${DB.employees.filter(e=>e.dept===d.id&&e.status==='active').length}`);
      return isAr
        ? `🏢 الأقسام (${DB.departments.length}):<br>${depts.slice(0,5).join('<br>')}`
        : `🏢 Departments (${DB.departments.length}):<br>${depts.slice(0,5).join('<br>')}`;
    }

    // Salary / payroll
    if (m.includes('راتب') || m.includes('رواتب') || m.includes('payroll') || m.includes('salary')) {
      const total = emps.reduce((s,e)=>s+(e.salary||0),0);
      return isAr
        ? `💰 إجمالي الرواتب الشهرية: <strong>${total.toLocaleString('ar-SA')} ${DB.company.currency||'SAR'}</strong>`
        : `💰 Total monthly payroll: <strong>${total.toLocaleString()} ${DB.company.currency||'SAR'}</strong>`;
    }

    // Default smart response
    const fallbacks = isAr ? [
      '🤔 يمكنني مساعدتك في معرفة إحصائيات الحضور، بيانات الموظفين، الإجازات، الرواتب، والتقارير.',
      '💡 جرب أن تسألني: "من غائب اليوم؟" أو "ما معدل الحضور؟" أو "كم عدد الموظفين؟"',
      '📊 لديك الآن صلاحية الوصول إلى بيانات النظام. اسألني أي سؤال!',
    ] : [
      '🤔 I can help you with attendance stats, employee data, leaves, payroll, and reports.',
      '💡 Try asking: "Who is absent?" or "What\'s the attendance rate?" or "How many employees?"',
      '📊 I have access to all system data. Ask me anything!',
    ];
    return fallbacks[Math.floor(Math.random() * fallbacks.length)];
  },

  /* ═══════════════════════════════════════════════════════
     GLOBAL SEARCH  (Ctrl+K)
  ═══════════════════════════════════════════════════════ */
  _buildSearch() {
    const isAr = currentLang === 'ar';
    const overlay = document.createElement('div');
    overlay.id = 'el-search-overlay';
    overlay.className = 'el-search-overlay';
    overlay.innerHTML = `
      <div class="el-search-modal">
        <div class="el-search-bar">
          <i class="fas fa-magnifying-glass" style="color:var(--text-muted);font-size:16px;flex-shrink:0"></i>
          <input id="el-search-input" class="el-search-input"
            placeholder="${isAr?'ابحث في كل مكان...':'Search everywhere...'}"
            autocomplete="off" oninput="DashboardModule._doSearch(this.value)">
          <kbd class="el-search-esc">Esc</kbd>
        </div>
        <div class="el-search-results" id="el-search-results">
          ${this._searchDefaults(isAr)}
        </div>
        <div class="el-search-footer">
          <span><kbd>↵</kbd> ${isAr?'انتقال':'Go'}</span>
          <span><kbd>↑↓</kbd> ${isAr?'تنقل':'Navigate'}</span>
          <span><kbd>Esc</kbd> ${isAr?'إغلاق':'Close'}</span>
        </div>
      </div>
    `;
    overlay.addEventListener('click', e => { if (e.target === overlay) this._closeSearch(); });
    document.body.appendChild(overlay);
  },

  _searchDefaults(isAr) {
    const pages = [
      {icon:'fas fa-house',           color:'#6366f1', lbl:isAr?'لوحة التحكم':'Dashboard',  page:'dashboard'},
      {icon:'fas fa-users',           color:'#10b981', lbl:isAr?'الموظفون':'Employees',      page:'employees'},
      {icon:'fas fa-clock',           color:'#f59e0b', lbl:isAr?'الحضور':'Attendance',       page:'attendance'},
      {icon:'fas fa-calendar-minus',  color:'#8b5cf6', lbl:isAr?'الإجازات':'Leaves',         page:'leaves'},
      {icon:'fas fa-chart-bar',       color:'#3b82f6', lbl:isAr?'التقارير':'Reports',         page:'reports'},
      {icon:'fas fa-building',        color:'#ec4899', lbl:isAr?'الأقسام':'Departments',      page:'departments'},
      {icon:'fas fa-money-check-alt', color:'#14b8a6', lbl:isAr?'الرواتب':'Payroll',          page:'payroll'},
      {icon:'fas fa-cog',             color:'#94a3b8', lbl:isAr?'الإعدادات':'Settings',       page:'settings'},
    ];
    return `
      <div class="el-search-group">${isAr?'التنقل السريع':'Quick Navigation'}</div>
      ${pages.map(p=>`
        <div class="el-search-item" onclick="DashboardModule._closeSearch();App.navigate('${p.page}')">
          <div class="el-search-item-icon" style="background:${p.color}15;color:${p.color}">
            <i class="${p.icon}"></i>
          </div>
          <span>${p.lbl}</span>
          <i class="fas fa-arrow-${isAr?'left':'right'}" style="font-size:10px;color:var(--text-muted);margin-${isAr?'right':'left'}:auto"></i>
        </div>
      `).join('')}
    `;
  },

  _doSearch(q) {
    const isAr    = currentLang === 'ar';
    const results = document.getElementById('el-search-results');
    if (!results) return;
    if (!q.trim()) { results.innerHTML = this._searchDefaults(isAr); return; }

    const qu = q.toLowerCase();
    const emps  = DB.employees.filter(e => e.name.toLowerCase().includes(qu) || (e.no||'').includes(qu)).slice(0,5);
    const depts = DB.departments.filter(d => d.name.toLowerCase().includes(qu)).slice(0,3);

    if (!emps.length && !depts.length) {
      results.innerHTML = `<div style="padding:32px;text-align:center;color:var(--text-muted)">
        <i class="fas fa-magnifying-glass" style="font-size:28px;opacity:.3;display:block;margin-bottom:10px"></i>
        ${isAr?'لا نتائج لـ':'No results for'} "<strong>${_esc(q)}</strong>"
      </div>`;
      return;
    }

    results.innerHTML = `
      ${emps.length ? `
        <div class="el-search-group">${isAr?'الموظفون':'Employees'}</div>
        ${emps.map(e => `
          <div class="el-search-item" onclick="DashboardModule._closeSearch();App.navigate('employees')">
            ${App.renderAvatar(e, 28, 8)}
            <div style="min-width:0">
              <div style="font-size:13px;font-weight:600;color:var(--text-primary)">${_esc(e.name)}</div>
              <div style="font-size:11px;color:var(--text-muted)">${_esc(e.position||'')} · ${_esc(DB.getDepartment(e.dept)?.name||'')}</div>
            </div>
          </div>
        `).join('')}
      ` : ''}
      ${depts.length ? `
        <div class="el-search-group">${isAr?'الأقسام':'Departments'}</div>
        ${depts.map(d => `
          <div class="el-search-item" onclick="DashboardModule._closeSearch();App.navigate('departments')">
            <div class="el-search-item-icon" style="background:#6366f115;color:#6366f1"><i class="${d.icon||'fas fa-building'}"></i></div>
            <span>${_esc(d.name)}</span>
          </div>
        `).join('')}
      ` : ''}
    `;
  },

  _openSearch() {
    document.getElementById('el-search-overlay')?.classList.add('el-search-open');
    setTimeout(() => document.getElementById('el-search-input')?.focus(), 80);
    this._srch.open = true;
  },
  _closeSearch() {
    document.getElementById('el-search-overlay')?.classList.remove('el-search-open');
    const inp = document.getElementById('el-search-input');
    if (inp) inp.value = '';
    const res = document.getElementById('el-search-results');
    if (res)  res.innerHTML = this._searchDefaults(currentLang==='ar');
    this._srch.open = false;
  },

  /* ═══════════════════════════════════════════════════════
     FLOATING ACTION BUTTON
  ═══════════════════════════════════════════════════════ */
  _buildFAB() {
    if (document.getElementById('el-fab')) return;
    const isAr = currentLang === 'ar';
    const fab  = document.createElement('div');
    fab.id     = 'el-fab';
    fab.innerHTML = `
      <div class="el-fab-wrap">
        <button class="el-fab-btn el-fab-search" onclick="DashboardModule._openSearch()" title="${isAr?'بحث ⌘K':'Search ⌘K'}">
          <i class="fas fa-magnifying-glass"></i>
        </button>
        <button class="el-fab-btn el-fab-ai" onclick="DashboardModule._toggleAI()" title="${isAr?'مساعد AI':'AI Assistant'}">
          <div class="el-fab-ring"></div>
          <i class="fas fa-sparkles"></i>
        </button>
      </div>
    `;
    document.body.appendChild(fab);
  },
};
