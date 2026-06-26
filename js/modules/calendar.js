/* =========================================================
   TEAM CALENDAR MODULE — تقويم الفريق
   ========================================================= */

const CalendarModule = {

  _year:  new Date().getFullYear(),
  _month: new Date().getMonth(), // 0-based
  _filter: 'all', // all | dept:id | emp:id
  _selected: null, // selected date YYYY-MM-DD

  render(container) {
    const isAr = currentLang === 'ar';
    container.innerHTML = `
      <div class="page-header">
        <div class="page-header-text">
          <h1>${t('calendar.title')}</h1>
          <p>${t('calendar.subtitle')}</p>
        </div>
        <div class="page-header-actions" style="gap:8px">
          <select class="form-control" style="min-width:160px;height:38px" onchange="CalendarModule._filter=this.value;CalendarModule._renderBody()">
            <option value="all">${t('calendar.allEmployees')}</option>
            <optgroup label="${t('nav.departments')}">
              ${DB.departments.map(d => `<option value="dept:${d.id}" ${CalendarModule._filter==='dept:'+d.id?'selected':''}>${_esc(d.name)}</option>`).join('')}
            </optgroup>
            <optgroup label="${t('nav.employees')}">
              ${DB.employees.filter(e=>e.status!=='inactive').map(e => `<option value="emp:${e.id}" ${CalendarModule._filter==='emp:'+e.id?'selected':''}>${_esc(e.name)}</option>`).join('')}
            </optgroup>
          </select>
          <button class="btn btn-secondary" onclick="CalendarModule._print()">
            <i class="fas fa-print"></i> ${t('common.print')}
          </button>
        </div>
      </div>

      <div id="cal-body"></div>
    `;
    this._renderBody();
  },

  _renderBody() {
    const body = document.getElementById('cal-body');
    if (!body) return;

    const isAr     = currentLang === 'ar';
    const dayNames = isAr
      ? ['الأحد','الاثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت']
      : ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

    const monthNames = isAr
      ? ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر']
      : ['January','February','March','April','May','June','July','August','September','October','November','December'];

    const year  = this._year;
    const month = this._month;

    const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Build event map: date → { leaves:[], holidays:[], absences:[] }
    const events = this._buildEventMap(year, month);

    const cells = [];
    // Blank cells before first day
    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);

    body.innerHTML = `
      <div class="card" style="padding:0;overflow:hidden">

        <!-- Month Navigation -->
        <div style="display:flex;align-items:center;justify-content:space-between;padding:16px 20px;border-bottom:1px solid var(--border)">
          <button class="btn btn-secondary" onclick="CalendarModule._prevMonth()">
            <i class="fas fa-chevron-${isAr?'right':'left'}"></i>
          </button>
          <div style="font-size:20px;font-weight:700;color:var(--text-primary)">
            ${monthNames[month]} ${year}
          </div>
          <button class="btn btn-secondary" onclick="CalendarModule._nextMonth()">
            <i class="fas fa-chevron-${isAr?'left':'right'}"></i>
          </button>
        </div>

        <!-- Legend -->
        <div style="display:flex;gap:16px;padding:10px 20px;border-bottom:1px solid var(--border);flex-wrap:wrap">
          <div style="display:flex;align-items:center;gap:6px;font-size:12px">
            <div style="width:12px;height:12px;border-radius:3px;background:#f59e0b"></div> ${t('calendar.legendLeave')}
          </div>
          <div style="display:flex;align-items:center;gap:6px;font-size:12px">
            <div style="width:12px;height:12px;border-radius:3px;background:#6366f1"></div> ${t('calendar.legendHoliday')}
          </div>
          <div style="display:flex;align-items:center;gap:6px;font-size:12px">
            <div style="width:12px;height:12px;border-radius:3px;background:#ef4444"></div> ${t('calendar.legendAbsent')}
          </div>
          <div style="display:flex;align-items:center;gap:6px;font-size:12px">
            <div style="width:12px;height:12px;border-radius:3px;background:#10b981"></div> ${t('calendar.legendPresent')}
          </div>
        </div>

        <!-- Day Headers -->
        <div class="cal-grid" style="display:grid;grid-template-columns:repeat(7,1fr);border-bottom:1px solid var(--border)">
          ${dayNames.map(d => `<div style="text-align:center;padding:10px 4px;font-size:12px;font-weight:600;color:var(--text-muted);background:var(--bg-secondary)">${d}</div>`).join('')}
        </div>

        <!-- Calendar Grid -->
        <div class="cal-grid" style="display:grid;grid-template-columns:repeat(7,1fr);gap:0">
          ${cells.map(day => {
            if (!day) return `<div style="min-height:80px;border:1px solid var(--border);background:var(--bg-secondary);opacity:.4"></div>`;

            const dateStr  = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
            const ev       = events[dateStr] || {};
            const isToday  = dateStr === new Date().toISOString().slice(0,10);
            const isSel    = dateStr === this._selected;
            const isWeekend = this._isWeekend(new Date(year, month, day));
            const isHoliday = (ev.holidays||[]).length > 0;

            return `
              <div onclick="CalendarModule._selectDay('${dateStr}')"
                style="min-height:80px;border:1px solid var(--border);padding:6px;cursor:pointer;
                       background:${isSel?'var(--primary-alpha)':isHoliday?'#6366f120':isWeekend?'var(--bg-secondary)':'var(--bg-primary)'};
                       transition:background .15s">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
                  <span style="font-size:13px;font-weight:${isToday?'700':'500'};
                    color:${isToday?'var(--primary)':isWeekend?'var(--text-muted)':'var(--text-primary)'};
                    ${isToday?'background:var(--primary);color:#fff;width:22px;height:22px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center':''}">
                    ${day}
                  </span>
                  ${isHoliday ? `<span title="${_esc((ev.holidays[0]||{}).name||'')}" style="font-size:10px;color:#6366f1"><i class="fas fa-star"></i></span>` : ''}
                </div>
                <div style="display:flex;flex-direction:column;gap:2px">
                  ${(ev.leaves||[]).slice(0,2).map(l => `
                    <div style="font-size:10px;background:#f59e0b22;color:#b45309;border-radius:4px;padding:1px 4px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${_esc(l.empName)}">
                      <i class="fas fa-circle" style="font-size:7px"></i> ${_esc(l.empName)}
                    </div>
                  `).join('')}
                  ${(ev.leaves||[]).length > 2 ? `<div style="font-size:10px;color:var(--text-muted);padding:1px 4px">+${ev.leaves.length-2} ${t('orgchart.more')}</div>` : ''}
                  ${(ev.absences||[]).slice(0,1).map(a => `
                    <div style="font-size:10px;background:#ef444422;color:#b91c1c;border-radius:4px;padding:1px 4px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
                      <i class="fas fa-times-circle" style="font-size:7px"></i> ${_esc(a.empName)}
                    </div>
                  `).join('')}
                  ${(ev.absences||[]).length > 1 ? `<div style="font-size:10px;color:var(--text-muted);padding:1px 4px">+${ev.absences.length-1}</div>` : ''}
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <!-- Detail Panel -->
      <div id="cal-detail" style="${this._selected ? '' : 'display:none'};margin-top:16px">
        ${this._selected ? this._renderDetail(this._selected) : ''}
      </div>

      <!-- Monthly Summary -->
      ${this._renderSummary(year, month, events)}
    `;
  },

  _buildEventMap(year, month) {
    const map    = {};
    const prefix = `${year}-${String(month+1).padStart(2,'0')}-`;

    // Get filtered employees
    let empIds = null;
    if (this._filter.startsWith('dept:')) {
      const deptId = this._filter.slice(5);
      empIds = new Set(DB.employees.filter(e => e.dept === deptId).map(e => e.id));
    } else if (this._filter.startsWith('emp:')) {
      empIds = new Set([this._filter.slice(4)]);
    }

    const getEmp = id => DB.employees.find(e => e.id === id);

    // Leaves
    DB.leaves.forEach(l => {
      if (l.status !== 'approved') return;
      if (empIds && !empIds.has(l.empId)) return;
      const emp = getEmp(l.empId);
      if (!emp) return;
      // iterate days in range
      let cur = new Date(l.from);
      const end = new Date(l.to);
      while (cur <= end) {
        const ds = cur.toISOString().slice(0,10);
        if (ds.startsWith(prefix)) {
          if (!map[ds]) map[ds] = { leaves:[], holidays:[], absences:[], present:[] };
          map[ds].leaves.push({ empName: emp.name, type: l.type });
        }
        cur.setDate(cur.getDate() + 1);
      }
    });

    // Holidays
    (DB.company.holidays||[]).forEach(h => {
      if (!h.date) return;
      for (let i = 0; i < (h.days||1); i++) {
        const d = new Date(h.date);
        d.setDate(d.getDate() + i);
        const ds = d.toISOString().slice(0,10);
        if (ds.startsWith(prefix)) {
          if (!map[ds]) map[ds] = { leaves:[], holidays:[], absences:[], present:[] };
          map[ds].holidays.push({ name: h.name });
        }
      }
    });

    // Attendance (absences & present)
    DB.attendance.forEach(a => {
      if (!a.date.startsWith(prefix)) return;
      if (empIds && !empIds.has(a.empId)) return;
      const emp = getEmp(a.empId);
      if (!emp) return;
      if (!map[a.date]) map[a.date] = { leaves:[], holidays:[], absences:[], present:[] };
      if (a.status === 'absent') map[a.date].absences.push({ empName: emp.name });
      else map[a.date].present.push({ empName: emp.name });
    });

    return map;
  },

  _renderDetail(dateStr) {
    const isAr = currentLang === 'ar';
    const ev   = this._buildEventMapForDate(dateStr);
    const d    = new Date(dateStr);
    const dateLabel = d.toLocaleDateString(isAr ? 'ar-SA' : 'en-US', { weekday:'long', year:'numeric', month:'long', day:'numeric' });

    return `
      <div class="card" style="padding:20px">
        <div style="font-size:16px;font-weight:700;color:var(--text-primary);margin-bottom:16px;display:flex;align-items:center;gap:8px">
          <i class="fas fa-calendar-day" style="color:var(--primary)"></i>
          ${_esc(dateLabel)}
          <button onclick="CalendarModule._selected=null;CalendarModule._renderBody()" style="margin-${isAr?'right':'left'}:auto;background:none;border:none;cursor:pointer;color:var(--text-muted);font-size:18px">×</button>
        </div>

        ${ev.holidays.length > 0 ? `
          <div style="margin-bottom:14px">
            <div style="font-size:12px;font-weight:600;color:#6366f1;margin-bottom:8px;text-transform:uppercase">${t('calendar.legendHoliday')}</div>
            ${ev.holidays.map(h => `
              <div style="display:flex;align-items:center;gap:8px;padding:8px 12px;background:#6366f110;border-radius:8px;margin-bottom:6px">
                <i class="fas fa-star" style="color:#6366f1"></i>
                <span style="font-size:13px;font-weight:500">${_esc(h.name)}</span>
              </div>
            `).join('')}
          </div>
        ` : ''}

        ${ev.leaves.length > 0 ? `
          <div style="margin-bottom:14px">
            <div style="font-size:12px;font-weight:600;color:#f59e0b;margin-bottom:8px;text-transform:uppercase">${t('calendar.legendLeave')} (${ev.leaves.length})</div>
            <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:8px">
              ${ev.leaves.map(l => `
                <div style="display:flex;align-items:center;gap:8px;padding:8px 12px;background:#f59e0b10;border-radius:8px">
                  <div style="width:28px;height:28px;border-radius:50%;background:#f59e0b33;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:#b45309;flex-shrink:0">${_esc(l.empName.charAt(0))}</div>
                  <div>
                    <div style="font-size:12px;font-weight:600;color:var(--text-primary)">${_esc(l.empName)}</div>
                    <div style="font-size:10px;color:#b45309">${_esc(l.type)}</div>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}

        ${ev.absences.length > 0 ? `
          <div style="margin-bottom:14px">
            <div style="font-size:12px;font-weight:600;color:#ef4444;margin-bottom:8px;text-transform:uppercase">${t('calendar.legendAbsent')} (${ev.absences.length})</div>
            <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:8px">
              ${ev.absences.map(a => `
                <div style="display:flex;align-items:center;gap:8px;padding:8px 12px;background:#ef444410;border-radius:8px">
                  <div style="width:28px;height:28px;border-radius:50%;background:#ef444433;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:#b91c1c;flex-shrink:0">${_esc(a.empName.charAt(0))}</div>
                  <div style="font-size:12px;font-weight:600;color:var(--text-primary)">${_esc(a.empName)}</div>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}

        ${ev.present.length > 0 ? `
          <div>
            <div style="font-size:12px;font-weight:600;color:#10b981;margin-bottom:8px;text-transform:uppercase">${t('calendar.legendPresent')} (${ev.present.length})</div>
            <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:8px">
              ${ev.present.map(p => `
                <div style="display:flex;align-items:center;gap:8px;padding:8px 12px;background:#10b98110;border-radius:8px">
                  <div style="width:28px;height:28px;border-radius:50%;background:#10b98133;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:#065f46;flex-shrink:0">${_esc(p.empName.charAt(0))}</div>
                  <div style="font-size:12px;font-weight:600;color:var(--text-primary)">${_esc(p.empName)}</div>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}

        ${ev.leaves.length === 0 && ev.absences.length === 0 && ev.holidays.length === 0 && ev.present.length === 0 ? `
          <div style="text-align:center;color:var(--text-muted);padding:20px 0;font-size:14px">${t('calendar.noEvents')}</div>
        ` : ''}
      </div>
    `;
  },

  _buildEventMapForDate(dateStr) {
    const result = { leaves:[], holidays:[], absences:[], present:[] };
    let empIds = null;
    if (this._filter.startsWith('dept:')) {
      const deptId = this._filter.slice(5);
      empIds = new Set(DB.employees.filter(e => e.dept === deptId).map(e => e.id));
    } else if (this._filter.startsWith('emp:')) {
      empIds = new Set([this._filter.slice(4)]);
    }
    const getEmp = id => DB.employees.find(e => e.id === id);

    DB.leaves.forEach(l => {
      if (l.status !== 'approved') return;
      if (empIds && !empIds.has(l.empId)) return;
      if (dateStr >= l.from && dateStr <= l.to) {
        const emp = getEmp(l.empId);
        if (emp) result.leaves.push({ empName: emp.name, type: l.type });
      }
    });
    (DB.company.holidays||[]).forEach(h => {
      if (!h.date) return;
      for (let i = 0; i < (h.days||1); i++) {
        const d = new Date(h.date); d.setDate(d.getDate()+i);
        if (d.toISOString().slice(0,10) === dateStr) result.holidays.push({ name: h.name });
      }
    });
    DB.attendance.forEach(a => {
      if (a.date !== dateStr) return;
      if (empIds && !empIds.has(a.empId)) return;
      const emp = getEmp(a.empId);
      if (!emp) return;
      if (a.status === 'absent') result.absences.push({ empName: emp.name });
      else result.present.push({ empName: emp.name });
    });
    return result;
  },

  _renderSummary(year, month, events) {
    const isAr = currentLang === 'ar';
    let totalLeave = 0, totalAbsent = 0, totalHoliday = 0;
    Object.values(events).forEach(ev => {
      totalLeave   += (ev.leaves||[]).length;
      totalAbsent  += (ev.absences||[]).length;
      totalHoliday += (ev.holidays||[]).length > 0 ? 1 : 0;
    });
    return `
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:12px;margin-top:16px">
        <div class="card" style="padding:16px;text-align:center">
          <div style="font-size:28px;font-weight:700;color:#f59e0b">${totalLeave}</div>
          <div style="font-size:12px;color:var(--text-muted);margin-top:4px">${t('calendar.totalLeave')}</div>
        </div>
        <div class="card" style="padding:16px;text-align:center">
          <div style="font-size:28px;font-weight:700;color:#ef4444">${totalAbsent}</div>
          <div style="font-size:12px;color:var(--text-muted);margin-top:4px">${t('calendar.totalAbsent')}</div>
        </div>
        <div class="card" style="padding:16px;text-align:center">
          <div style="font-size:28px;font-weight:700;color:#6366f1">${totalHoliday}</div>
          <div style="font-size:12px;color:var(--text-muted);margin-top:4px">${t('calendar.totalHoliday')}</div>
        </div>
        <div class="card" style="padding:16px;text-align:center">
          <div style="font-size:28px;font-weight:700;color:var(--text-primary)">${new Date(year, month+1, 0).getDate()}</div>
          <div style="font-size:12px;color:var(--text-muted);margin-top:4px">${t('calendar.totalDays')}</div>
        </div>
      </div>
    `;
  },

  _isWeekend(date) {
    const dayAbbr = ['sun','mon','tue','wed','thu','fri','sat'][date.getDay()];
    return (DB.company.weekend||['fri']).includes(dayAbbr);
  },

  _prevMonth() {
    this._month--;
    if (this._month < 0) { this._month = 11; this._year--; }
    this._selected = null;
    this._renderBody();
  },

  _nextMonth() {
    this._month++;
    if (this._month > 11) { this._month = 0; this._year++; }
    this._selected = null;
    this._renderBody();
  },

  _selectDay(dateStr) {
    this._selected = this._selected === dateStr ? null : dateStr;
    this._renderBody();
  },

  _print() {
    const isAr = currentLang === 'ar';
    const body = document.getElementById('cal-body')?.innerHTML || '';
    const win  = window.open('', '_blank');
    win.document.write(`<!DOCTYPE html><html dir="${isAr?'rtl':'ltr'}">
    <head><meta charset="UTF-8"><title>${t('calendar.title')}</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    <style>
      body{font-family:${isAr?'Tajawal,':''}sans-serif;padding:16px;background:#fff;color:#1e293b}
      .card{background:#fff;border-radius:12px;border:1px solid #e2e8f0;margin-bottom:12px}
      .cal-grid>div{border:1px solid #e2e8f0}
      button{display:none}select{display:none}.page-header-actions{display:none}
      @media print{body{padding:0}}
    </style></head>
    <body>${body}<script>window.onload=()=>window.print()<\/script></body></html>`);
    win.document.close();
  },
};
