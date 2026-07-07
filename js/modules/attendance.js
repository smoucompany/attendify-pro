/* =========================================================
   ATTENDANCE MODULE
   Check-in/out · QR · Face Recognition · GPS · Records
   ========================================================= */

const AttendanceModule = {
  _view: 'table',
  _dateFrom: new Date().toISOString().split('T')[0],
  _dateTo: new Date().toISOString().split('T')[0],
  _empFilter: 'all',
  _statusFilter: 'all',
  _checkedIn: false,
  _checkInTime: null,

  render(container) {
    const today = DB.getTodayAttendance();
    const stats = DB.getAttendanceStats();

    container.innerHTML = `
      <div class="page-header">
        <div class="page-header-text">
          <h1>${t('attendance.title')}</h1>
          <p>${t('attendance.subtitle')}</p>
        </div>
        <div class="page-header-actions">
          <button class="btn btn-secondary" onclick="AttendanceModule.exportData()"><i class="fas fa-file-excel"></i> ${t('common.export')}</button>
          <button class="btn" style="background:linear-gradient(135deg,#6366f1,#8b5cf6);color:white" onclick="AttendanceModule.openFaceCheckin()"><i class="fas fa-face-smile"></i> ${t('attendance.faceCheckin')}</button>
          <button class="btn btn-secondary" onclick="AttendanceModule.openBulkEntry()"><i class="fas fa-calendar-days"></i> ${currentLang==='ar'?'إدخال حضور لعدة أيام':'Bulk Entry'}</button>
          <button class="btn btn-primary" onclick="AttendanceModule.openManual()"><i class="fas fa-plus"></i> ${t('attendance.addRecord')}</button>
        </div>
      </div>

      <!-- Check-in Widget + Stats -->
      <div class="grid-main-side" style="margin-bottom:20px">
        <!-- Check-in Widget -->
        <div class="checkin-widget">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:4px">
            <div>
              <div class="checkin-clock" id="checkin-clock">${(() => { const n=new Date(); return String(n.getHours()).padStart(2,'0')+':'+String(n.getMinutes()).padStart(2,'0')+':'+String(n.getSeconds()).padStart(2,'0'); })()}</div>
              <div class="checkin-date">${new Date().toLocaleDateString(currentLang==='ar'?'ar-SA':'en-US',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}</div>
            </div>
            <div style="background:rgba(255,255,255,0.15);padding:8px 14px;border-radius:10px;font-size:12px;color:rgba(255,255,255,0.8)">
              <i class="fas fa-map-pin"></i> ${DB.company.name || (currentLang==='ar'?'الفرع الرئيسي':'Main Branch')}
            </div>
          </div>
          ${this._checkedIn ? `
            <div style="background:rgba(16,185,129,0.2);border:1px solid rgba(16,185,129,0.3);border-radius:10px;padding:10px 14px;margin-bottom:16px;font-size:13px;color:rgba(255,255,255,0.9)">
              <i class="fas fa-circle-check" style="color:#34d399"></i> ${currentLang==='ar'?'تم تسجيل الحضور في':'Checked in at'} ${this._checkInTime}
            </div>
          ` : ''}
          <div class="checkin-actions">
            <button class="btn-checkin ${!this._checkedIn?'active':''}" onclick="AttendanceModule.doCheckIn()">
              <i class="fas fa-clock"></i> ${t('attendance.checkIn')}
            </button>
            <button class="btn-checkin ${this._checkedIn?'active':''}" onclick="AttendanceModule.doCheckOut()">
              <i class="fas fa-door-open"></i> ${t('attendance.checkOut')}
            </button>
          </div>
          <!-- Method Buttons -->
          <div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap">
            <button class="btn-checkin" style="flex:none;padding:8px 12px;font-size:12px" onclick="AttendanceModule.openFaceRec()">
              <i class="fas fa-face-smile"></i> ${t('attendance.faceRecog')}
            </button>
            <button class="btn-checkin" style="flex:none;padding:8px 12px;font-size:12px" onclick="AttendanceModule.openFingerprintRec()">
              <i class="fas fa-fingerprint"></i> ${t('login.fingerprint')}
            </button>
            <button class="btn-checkin" style="flex:none;padding:8px 12px;font-size:12px" onclick="AttendanceModule.openQRScan()">
              <i class="fas fa-qrcode"></i> ${t('attendance.qrScan')}
            </button>
            <button class="btn-checkin" style="flex:none;padding:8px 12px;font-size:12px" onclick="AttendanceModule.openGPSVerify()">
              <i class="fas fa-map-pin"></i> GPS
            </button>
          </div>
        </div>

        <!-- Today's Stats -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
          ${[
            {val: stats.total,           label: t('employees.totalEmp'),         icon: 'fas fa-users',      c: 'gradient-primary'},
            {val: stats.present + stats.late, label: t('dashboard.presentToday'),icon: 'fas fa-user-check', c: 'gradient-success'},
            {val: stats.late,            label: t('dashboard.lateArrivals'),     icon: 'fas fa-clock',      c: 'gradient-warning'},
            {val: stats.absent,          label: t('dashboard.absent'),           icon: 'fas fa-user-xmark', c: 'gradient-danger'},
          ].map(s => `
            <div class="card" style="padding:16px;display:flex;align-items:center;gap:14px">
              <div class="stat-icon ${s.c}" style="width:42px;height:42px;font-size:17px"><i class="${s.icon}"></i></div>
              <div>
                <div style="font-size:22px;font-weight:800;color:var(--text-primary)">${s.val}</div>
                <div style="font-size:12px;color:var(--text-muted)">${s.label}</div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Toolbar -->
      <div class="toolbar">
        <div class="toolbar-search">
          <i class="fas fa-magnifying-glass"></i>
          <input type="text" placeholder="${t('common.search')}..." id="att-search"
            oninput="AttendanceModule._search=this.value; AttendanceModule._renderTable()">
        </div>
        <div style="display:flex;align-items:center;gap:6px">
          <span style="font-size:12px;color:var(--text-muted)">${t('common.from')}</span>
          <input type="date" class="toolbar-select" value="${this._dateFrom}"
            onchange="AttendanceModule._dateFrom=this.value; if(AttendanceModule._dateTo<AttendanceModule._dateFrom) AttendanceModule._dateTo=AttendanceModule._dateFrom; AttendanceModule._renderTable()">
          <span style="font-size:12px;color:var(--text-muted)">${t('common.to')}</span>
          <input type="date" class="toolbar-select" value="${this._dateTo}"
            onchange="AttendanceModule._dateTo=this.value; if(AttendanceModule._dateTo<AttendanceModule._dateFrom) AttendanceModule._dateFrom=AttendanceModule._dateTo; AttendanceModule._renderTable()">
        </div>
        <select class="toolbar-select" onchange="AttendanceModule._statusFilter=this.value; AttendanceModule._renderTable()">
          <option value="all">${t('common.all')}</option>
          <option value="present">${t('attendance.present')}</option>
          <option value="late">${t('attendance.late')}</option>
          <option value="absent">${t('attendance.absent')}</option>
        </select>
        <select class="toolbar-select" onchange="AttendanceModule._empFilter=this.value; AttendanceModule._renderTable()">
          <option value="all" ${this._empFilter==='all'?'selected':''}>${t('common.all')} ${t('nav.employees')}</option>
          ${DB.employees.slice(0,10).map(e=>`<option value="${e.id}" ${e.id===this._empFilter?'selected':''}>${e.name}</option>`).join('')}
        </select>
        <div class="toolbar-separator"></div>
        <button class="btn btn-secondary btn-sm" onclick="AttendanceModule.exportData()">
          <i class="fas fa-file-csv"></i> CSV
        </button>
        <button class="btn btn-sm" style="background:#25d366;color:white" onclick="AttendanceModule.sendBulkWA()" title="${t('attendance.bulkNotifyTitle')}">
          <i class="fab fa-whatsapp"></i> ${t('attendance.bulkNotify')}
        </button>
      </div>

      <!-- Attendance Table -->
      <div id="attendance-table"></div>
    `;

    // Start clock — clear any previous interval first
    clearInterval(this._clockInterval);
    const clockEl = document.getElementById('checkin-clock');
    if (clockEl) {
      const tick = () => {
        const el = document.getElementById('checkin-clock');
        if (!el) { clearInterval(this._clockInterval); return; }
        const now = new Date();
        const hh = String(now.getHours()).padStart(2,'0');
        const mm = String(now.getMinutes()).padStart(2,'0');
        const ss = String(now.getSeconds()).padStart(2,'0');
        el.textContent = `${hh}:${mm}:${ss}`;
      };
      tick();
      this._clockInterval = setInterval(tick, 1000);
    }

    this._renderTable();
  },

  _renderTable() {
    const container = document.getElementById('attendance-table');
    if (!container) return;

    const search = (this._search || '').toLowerCase();

    const workDays = DB.company.workDays || ['sat','sun','mon','tue','wed','thu'];

    // Build the list of dates in the selected range (inclusive)
    const dateFromRaw = this._dateFrom || new Date().toISOString().split('T')[0];
    const dateToRaw   = this._dateTo   || dateFromRaw;
    const rangeStart = dateFromRaw <= dateToRaw ? dateFromRaw : dateToRaw;
    const rangeEnd   = dateFromRaw <= dateToRaw ? dateToRaw   : dateFromRaw;
    const dates = [];
    for (let d = new Date(rangeStart + 'T12:00:00'); d <= new Date(rangeEnd + 'T12:00:00'); d.setDate(d.getDate() + 1)) {
      dates.push(d.toISOString().split('T')[0]);
    }
    const isRange = dates.length > 1;

    const employees = DB.employees
      .filter(e => e.status !== 'terminated')
      .filter(e => this._empFilter === 'all' || e.id === this._empFilter)
      .filter(e => !search || e.name.toLowerCase().includes(search) || (e.no||'').includes(search));

    // Build merged list: every employee × every date in the range, with the matching attendance record (if any)
    let rows = [];
    for (const date of dates) {
      const dayName   = new Date(date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short' }).toLowerCase();
      const isWorkDay = workDays.includes(dayName);
      const isHoliday = (DB.company.holidays || []).some(h => h.date === date);

      for (const emp of employees) {
        const rec  = DB.attendance.find(a => a.date === date && a.empId === emp.id);
        const dept = DB.getDepartment(emp.dept);

        // Determine effective status
        let status, checkIn, checkOut, method, overtime, recId, lateMin;
        if (rec) {
          status   = rec.status;
          checkIn  = rec.checkIn;
          checkOut = rec.checkOut;
          method   = rec.method;
          overtime = rec.overtime;
          recId    = rec.id;
          // إعادة احتساب الحالة ديناميكياً حسب وردية الموظف الحالية (تدعم تعديل الورديات لاحقاً)
          if (checkIn && (status === 'late' || status === 'present')) {
            status = DB.computeAttendanceStatus(emp?.id, date, checkIn);
          }
          if (status === 'late' && checkIn) {
            lateMin = DB.getLateMinutes(emp?.id, date, checkIn);
          }
        } else if (!isWorkDay || isHoliday) {
          status = 'holiday';
        } else {
          // No record = absent (whether today or past)
          status = 'absent';
        }

        rows.push({ date, emp, dept, rec, status, checkIn, checkOut, method, overtime, recId, lateMin });
      }
    }
    rows = rows.filter(row => this._statusFilter === 'all' || row.status === this._statusFilter);
    rows.sort((a, b) => b.date.localeCompare(a.date) || a.emp.name.localeCompare(b.emp.name));

    if (!DB.employees.filter(e => e.status !== 'terminated').length) {
      container.innerHTML = `<div class="empty-state"><div class="empty-icon"><i class="fas fa-users"></i></div><div class="empty-title">${t('employees.noEmployees')}</div></div>`;
      return;
    }

    const statusBadge = (s) => {
      const map = {
        present:     `<span class="badge badge-success badge-dot">${t('attendance.present')}</span>`,
        late:        `<span class="badge badge-warning badge-dot">${t('attendance.late')}</span>`,
        absent:      `<span class="badge badge-danger badge-dot">${t('attendance.absent')}</span>`,
        not_arrived: `<span class="badge badge-secondary badge-dot">${t('attendance.notArrived')}</span>`,
        holiday:     `<span class="badge badge-info badge-dot">${t('attendance.holiday')}</span>`,
        on_leave:    `<span class="badge badge-warning badge-dot">${t('attendance.onLeave')}</span>`,
        no_fingerprint: `<span class="badge badge-secondary badge-dot">${t('attendance.noFingerprint')}</span>`,
      };
      return map[s] || `<span class="badge badge-secondary">${s}</span>`;
    };

    container.innerHTML = `
      <div class="table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              ${isRange ? `<th>${t('common.date')}</th>` : ''}
              <th>${t('common.name')}</th>
              <th>${t('common.department')}</th>
              <th>${t('attendance.checkInTime')}</th>
              <th>${t('attendance.checkOutTime')}</th>
              <th>${t('attendance.duration')}</th>
              <th>${t('attendance.method')}</th>
              <th>${t('attendance.overtime')}</th>
              <th>${t('common.status')}</th>
              <th>${t('common.actions')}</th>
            </tr>
          </thead>
          <tbody>
            ${rows.map(({ date, emp, dept, rec, status, checkIn, checkOut, method, overtime, recId, lateMin }) => {
              const dur = this._calcDuration(checkIn, checkOut);
              const rowBg = status === 'absent' ? 'background:rgba(239,68,68,0.04)' :
                            status === 'late'   ? 'background:rgba(245,158,11,0.04)' :
                            status === 'not_arrived' ? 'background:rgba(148,163,184,0.04)' : '';
              return `
                <tr class="stagger-item" style="${rowBg}">
                  ${isRange ? `<td><span style="font-family:var(--font-en);font-weight:600;color:var(--text-secondary)">${date}</span></td>` : ''}
                  <td>
                    <div class="table-avatar">
                      ${App.renderAvatar(emp, 36, 10)}
                      <div class="avatar-info">
                        <div class="avatar-name">${emp.name}</div>
                        <div class="avatar-sub">${emp.no||''} · ${emp.position||''}</div>
                      </div>
                    </div>
                  </td>
                  <td><span class="badge badge-primary">${dept?.name||'—'}</span></td>
                  <td><span style="font-family:var(--font-en);font-weight:600;color:var(--success)">${checkIn||'—'}</span></td>
                  <td><span style="font-family:var(--font-en);font-weight:600;color:var(--danger)">${checkOut||'—'}</span></td>
                  <td><span style="font-family:var(--font-en);color:var(--text-primary);font-weight:600">${dur||'—'}</span></td>
                  <td>${method ? App.getMethodIcon(method)+' <span style="font-size:11px;color:var(--text-muted)">'+method+'</span>' : '<span style="color:var(--text-muted)">—</span>'}</td>
                  <td>${
                    status === 'late'
                      ? (lateMin ? `<span class="badge badge-warning">${lateMin} ${currentLang==='ar'?'د تأخير':'min late'}</span>` : '<span style="color:var(--text-muted)">—</span>')
                      : (overtime ? `<span class="badge badge-info">${overtime} د</span>` : '<span style="color:var(--text-muted)">—</span>')
                  }</td>
                  <td>${statusBadge(status)}</td>
                  <td>
                    <div style="display:flex;gap:4px">
                      ${(status==='absent'||status==='not_arrived') ? `
                        <button class="btn btn-success btn-sm" title="${t('attendance.checkIn')}"
                          onclick="AttendanceModule._quickCheckIn('${emp.id}','${date}')">
                          <i class="fas fa-clock"></i>
                        </button>` : ''}
                      ${(status==='late'||status==='absent') ? `
                        <button class="btn-icon btn" title="WhatsApp" style="color:#25d366"
                          onclick="AttendanceModule.sendWA('${emp.id}','${status}','${recId||''}')">
                          <i class="fab fa-whatsapp"></i>
                        </button>` : ''}
                      ${recId ? `
                        <button class="btn-icon btn" onclick="AttendanceModule.editRecord('${recId}')" title="${t('common.edit')}"><i class="fas fa-pencil"></i></button>
                        <button class="btn-icon btn" onclick="AttendanceModule.deleteRecord('${recId}')" title="${t('common.delete')}" style="color:var(--danger)"><i class="fas fa-trash"></i></button>
                      ` : `
                        <button class="btn-icon btn" title="${t('attendance.addRecord')}"
                          onclick="AttendanceModule._quickCheckIn('${emp.id}','${date}')">
                          <i class="fas fa-plus" style="color:var(--primary)"></i>
                        </button>
                      `}
                    </div>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
      <p style="font-size:12px;color:var(--text-muted);margin-top:8px;padding:0 4px">
        ${t('common.showing')} ${rows.length} ${t('common.employees')} ·
        <span style="color:var(--success)">${rows.filter(r=>r.status==='present').length} ${t('attendance.present')}</span> ·
        <span style="color:var(--warning)">${rows.filter(r=>r.status==='late').length} ${t('attendance.late')}</span> ·
        <span style="color:var(--danger)">${rows.filter(r=>r.status==='absent').length} ${t('attendance.absent').toLowerCase()}</span> ·
        <span style="color:var(--text-muted)">${rows.filter(r=>r.status==='not_arrived').length} ${t('attendance.notArrived')}</span>
      </p>
    `;
  },

  _quickCheckIn(empId, date) {
    date = date || this._dateFrom;
    // منع التسجيل المكرر لنفس الموظف في نفس اليوم
    const existing = DB.attendance.find(a => a.empId === empId && a.date === date);
    if (existing) {
      App.toast(currentLang === 'ar' ? 'تم تسجيل الحضور مسبقاً لهذا الموظف' : 'Already checked in today', 'warning');
      return;
    }

    const now  = new Date();
    const time = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
    const lateMin = DB.getLateMinutes(empId, date, time);

    DB.attendance.push({
      id: DB.nextId('a'), empId, date,
      checkIn: time, checkOut: null,
      status: lateMin > 0 ? 'late' : 'present',
      method: 'manual', overtime: 0, lateMin,
    });
    DB.save();
    App.toast(`${DB.getEmployee(empId)?.name} — ${currentLang==='ar'?'تم تسجيل الحضور':'Checked in'} ${time}`, 'success');
    this._renderTable();
  },

  _calcDuration(start, end) {
    if (!start || !end) return '—';
    try {
      const [sh, sm] = start.split(':').map(Number);
      const [eh, em] = end.split(':').map(Number);
      let diff = (eh * 60 + em) - (sh * 60 + sm);
      if (diff < 0) diff += 24 * 60; // وردية ليلية تعدي منتصف الليل
      if (diff === 0) return '—';
      return `${Math.floor(diff/60)}:${String(diff%60).padStart(2,'0')}`;
    } catch { return '—'; }
  },

  // حساب دقائق الوردية مع دعم الوردية الليلية
  _shiftMinutes(start, end) {
    const [sh, sm] = (start||'00:00').split(':').map(Number);
    const [eh, em] = (end||'00:00').split(':').map(Number);
    let diff = (eh*60+em) - (sh*60+sm);
    if (diff <= 0) diff += 24*60;
    return diff;
  },

  doCheckIn(method = 'manual') {
    if (this._checkedIn) { App.toast(currentLang==='ar'?'أنت سجلت حضورك بالفعل':'Already checked in', 'warning'); return; }
    const now     = new Date();
    const nowTime = now.toTimeString().slice(0,5);
    const today   = now.toISOString().split('T')[0];
    this._checkedIn   = true;
    const _p = n => String(n).padStart(2,'0');
    this._checkInTime = `${_p(now.getHours())}:${_p(now.getMinutes())}:${_p(now.getSeconds())}`;

    const adminId = App.state?.user?.id || 'admin';
    const existing = DB.attendance.find(a => a.empId === adminId && a.date === today);
    if (existing) {
      existing.checkIn = nowTime;
    } else {
      const isLate  = DB.getLateMinutes(adminId, today, nowTime) > 0;
      DB.attendance.push({
        id: DB.nextId('att'), empId: adminId, date: today,
        checkIn: nowTime, checkOut: null,
        status: isLate ? 'late' : 'present',
        method, workedMins: 0, overtime: null,
        location: currentLang==='ar'?'تطبيق الويب':'Web App', notes: '',
      });
    }
    DB.save();
    App.toast(currentLang==='ar'?'تم تسجيل الحضور بنجاح':'Check-in recorded', 'success');
    this.render(document.getElementById('page-content'));
  },

  doCheckOut() {
    if (!this._checkedIn) { App.toast(currentLang==='ar'?'لم تسجل حضورك بعد':'Please check in first', 'warning'); return; }
    const now     = new Date();
    const nowTime = now.toTimeString().slice(0,5);
    const today   = now.toISOString().split('T')[0];
    this._checkedIn = false;

    const adminId  = App.state?.user?.id || 'admin';
    const existing = DB.attendance.find(a => a.empId === adminId && a.date === today);
    if (existing) {
      existing.checkOut   = nowTime;
      existing.workedMins = this._shiftMinutes(existing.checkIn, nowTime);
      const u = App.state?.user;
      const shiftForOT = u ? DB.getEmployeeShift(u.id, today) : null;
      if (shiftForOT?.start && shiftForOT?.end) {
        const shiftMins = this._shiftMinutes(shiftForOT.start, shiftForOT.end);
        const ot = existing.workedMins - shiftMins;
        existing.overtime = ot > 30 ? Math.round(ot) : null;
      }
    }
    DB.save();
    App.toast(currentLang==='ar'?'تم تسجيل الانصراف بنجاح':'Check-out recorded', 'success');
    this.render(document.getElementById('page-content'));
  },

  openFaceRec() {
    // يستخدم face-api.js الحقيقي من biometrics.js
    Biometrics.openFaceVerify({
      onSuccess: (matchedName) => {
        const emp = DB.employees.find(e => e.name === matchedName);
        if (emp) {
          this._recordCheckin(emp.id, 'face');
        } else {
          // تعرّف على وجه غير موجود في DB — سجّل كـ admin
          this.doCheckIn();
        }
      },
      onFail: () => App.toast(currentLang==='ar'?'لم يتم التعرف على الوجه — حاول مرة أخرى':'Face not recognized — try again', 'error'),
    });
  },

  openFingerprintRec() {
    if (!Biometrics.canWebAuthn()) {
      App.openModal(currentLang==='ar'?'بصمة الإصبع':'Fingerprint', `
        <div style="text-align:center;padding:24px 0">
          <div style="font-size:52px;margin-bottom:14px">⚠️</div>
          <p style="font-size:14px;font-weight:600;color:var(--text-secondary)">
            ${currentLang==='ar'?'جهازك لا يدعم البصمة البيومترية<br><span style="font-size:12px;font-weight:400;color:var(--text-muted)">يتطلب Windows Hello أو Touch ID أو Face ID</span>':'Your device does not support biometric authentication<br><span style="font-size:12px;font-weight:400;color:var(--text-muted)">Requires Windows Hello, Touch ID, or Face ID</span>'}
          </p>
          <button class="btn btn-secondary" style="margin-top:16px" onclick="App.closeModal()">${t('common.close')}</button>
        </div>
      `, { size: 'sm' });
      return;
    }

    // اختيار موظف ثم تحقق بيومتري
    App.openModal(currentLang==='ar'?'تسجيل الحضور بالبصمة':'Fingerprint Check-In', `
      <div style="padding:8px">
        <div class="app-form-group">
          <label>${currentLang==='ar'?'اختر الموظف':'Select Employee'}</label>
          <select class="app-form-input app-form-select" id="fp-emp-select">
            <option value="">${currentLang==='ar'?'— اختر —':'— Select —'}</option>
            ${DB.employees.filter(e=>e.status==='active').map(e=>`
              <option value="${e.id}" ${Biometrics.hasFingerprint(e.id)?'':'style="color:var(--text-muted)"'}>
                ${e.name}${Biometrics.hasFingerprint(e.id)?'':currentLang==='ar'?' (غير مسجّل)':' (not registered)'}
              </option>
            `).join('')}
          </select>
        </div>
        <div id="fp-info" style="margin-bottom:12px;font-size:12px;color:var(--text-muted)">
          ${currentLang==='ar'?'الموظفون بدون بصمة يجب تسجيلهم أولاً من ملفاتهم الشخصية':'Employees without fingerprint must register first from their profile'}
        </div>
        <button class="btn btn-primary w-full" onclick="AttendanceModule._doFingerprintCheckin()">
          <i class="fas fa-fingerprint"></i> ${currentLang==='ar'?'تحقق بالبصمة':'Verify Fingerprint'}
        </button>
      </div>
    `, { size: 'sm' });
  },

  async _doFingerprintCheckin() {
    const empId = document.getElementById('fp-emp-select')?.value;
    if (!empId) { App.toast(currentLang==='ar'?'اختر موظفاً أولاً':'Select an employee first', 'warning'); return; }
    const emp = DB.getEmployee(empId);
    if (!emp) return;
    App.closeModal();
    Biometrics.openFingerprintVerify(emp, () => {
      this._recordCheckin(emp.id, 'fingerprint');
    });
  },

  // تسجيل حضور لأي موظف بأي طريقة
  _recordCheckin(empId, method = 'manual') {
    const now     = new Date();
    const nowTime = now.toTimeString().slice(0,5);
    const today   = now.toISOString().split('T')[0];
    const emp     = DB.getEmployee(empId);
    if (!emp) return;

    const existing = DB.attendance.find(a => a.empId === empId && a.date === today);
    if (existing && !existing.checkOut) {
      existing.checkOut   = nowTime;
      existing.workedMins = this._shiftMinutes(existing.checkIn, nowTime);
      // حساب الأوفرتايم
      const empShiftForOT = DB.getEmployeeShift(emp.id, today);
      if (empShiftForOT?.start && empShiftForOT?.end) {
        const shiftMins = this._shiftMinutes(empShiftForOT.start, empShiftForOT.end);
        const ot = existing.workedMins - shiftMins;
        existing.overtime = ot > 30 ? Math.round(ot) : null;
      }
      DB.save();
      const otNote = existing.overtime ? ` (+${Math.floor(existing.overtime/60)}:${String(existing.overtime%60).padStart(2,'0')} ${currentLang==='ar'?'إضافي':'OT'})` : '';
      App.toast(`✅ ${currentLang==='ar'?'تم تسجيل انصراف':'Checkout recorded for'} ${emp.name} ${currentLang==='ar'?'الساعة':'at'} ${nowTime}${otNote}`, 'success');
    } else if (!existing) {
      const lateMins    = DB.getLateMinutes(emp.id, today, nowTime);
      const isLate      = lateMins > 0;
      DB.attendance.push({
        id: DB.nextId('att'), empId, date: today,
        checkIn: nowTime, checkOut: null,
        status: isLate ? 'late' : 'present',
        method, workedMins: 0, overtime: null,
        location: currentLang==='ar'?'تطبيق الويب':'Web App', notes: '',
      });
      DB.save();
      const lateNote = isLate ? (currentLang==='ar'?' (متأخر)':' (late)') : '';
      App.toast(`✅ ${currentLang==='ar'?'تم تسجيل حضور':'Checked in:'} ${emp.name} ${nowTime}${lateNote}`, isLate?'warning':'success');
      if (isLate) {
        DB.addNotification({ title: 'موظف متأخر', desc: `${emp.name} تأخر ${lateMins} دقيقة — وصل الساعة ${nowTime}`, type: 'attendance', icon: 'fas fa-clock', iconBg: 'gradient-warning' });
      }
    } else {
      App.toast(`${emp.name} ${currentLang==='ar'?'سجّل حضوره بالفعل اليوم':'already checked in today'}`, 'info');
    }
    this._renderTable?.();
  },

  _qrStream: null,
  _qrAnimFrame: null,

  openQRScan() {
    App.openModal(t('attendance.qrScan'), `
      <div style="padding:4px">
        <div style="position:relative;border-radius:14px;overflow:hidden;background:#000;aspect-ratio:4/3">
          <video id="qr-video" autoplay playsinline muted style="width:100%;height:100%;object-fit:cover;display:none"></video>
          <canvas id="qr-canvas" style="display:none"></canvas>
          <div id="qr-loading" style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:10px;color:rgba(255,255,255,.8)">
            <i class="fas fa-spinner fa-spin" style="font-size:28px"></i>
            <span style="font-size:13px">${currentLang==='ar'?'جارٍ تشغيل الكاميرا...':'Starting camera...'}</span>
          </div>
          <div id="qr-overlay" style="display:none;position:absolute;inset:0;pointer-events:none">
            <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:64%;aspect-ratio:1;border:2px solid rgba(99,102,241,.8);border-radius:8px;box-shadow:0 0 0 9999px rgba(0,0,0,.45)">
              <div class="qr-scan-line" style="position:absolute;left:0;right:0;top:0"></div>
            </div>
          </div>
        </div>
        <div id="qr-status" style="text-align:center;padding:12px 0;font-size:13px;color:var(--text-muted)">
          ${currentLang==='ar'?'وجّه الكاميرا نحو QR Code للموظف':'Point camera at employee QR Code'}
        </div>

        <!-- اختيار يدوي كبديل -->
        <div style="border-top:1px solid var(--border);padding-top:12px;margin-top:4px">
          <div style="font-size:11px;color:var(--text-muted);margin-bottom:6px;text-align:center">${currentLang==='ar'?'أو اختر موظفاً يدوياً:':'Or select employee manually:'}</div>
          <div style="display:flex;gap:8px">
            <select id="qr-emp-manual" class="app-form-input app-form-select" style="flex:1;font-size:12px">
              <option value="">${currentLang==='ar'?'— اختر موظفاً —':'— Select employee —'}</option>
              ${DB.employees.filter(e=>e.status==='active').map(e=>`<option value="${e.id}">${e.name}</option>`).join('')}
            </select>
            <button class="btn btn-primary" style="flex-shrink:0;font-size:12px" onclick="AttendanceModule._qrManualCheckin()">
              <i class="fas fa-check"></i> ${currentLang==='ar'?'تسجيل':'Check In'}
            </button>
          </div>
        </div>

        <button class="btn btn-secondary w-full" style="margin-top:10px" onclick="AttendanceModule._stopQR(); App.closeModal()">
          ${currentLang==='ar'?'إلغاء':'Cancel'}
        </button>
      </div>
    `, { size: 'sm' });

    this._startQR();
  },

  _startQR() {
    // تحميل مكتبة jsQR للمسح الحقيقي
    const startScan = () => {
      navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
        .then(stream => {
          this._qrStream = stream;
          const video   = document.getElementById('qr-video');
          const loading = document.getElementById('qr-loading');
          const overlay = document.getElementById('qr-overlay');
          if (!video) { stream.getTracks().forEach(t => t.stop()); return; }
          video.srcObject = stream;
          video.style.display = '';
          if (loading) loading.style.display = 'none';
          if (overlay) overlay.style.display = '';
          video.onloadedmetadata = () => this._qrTick();
        })
        .catch(err => {
          const el = document.getElementById('qr-loading');
          if (el) el.innerHTML = `<i class="fas fa-triangle-exclamation" style="font-size:28px;color:#ef4444"></i><span style="font-size:13px;color:#ef4444;margin-top:8px">${err.name === 'NotAllowedError' ? (currentLang==='ar'?'تم رفض إذن الكاميرا':'Camera permission denied') : err.message}</span>`;
        });
    };

    if (window.jsQR) { startScan(); return; }
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.min.js';
    s.onload = startScan;
    s.onerror = () => {
      const el = document.getElementById('qr-status');
      if (el) el.textContent = currentLang==='ar'?'تعذّر تحميل مكتبة QR — استخدم الاختيار اليدوي أدناه':'QR library failed to load — use manual selection below';
    };
    document.head.appendChild(s);
  },

  _qrTick() {
    const video  = document.getElementById('qr-video');
    const canvas = document.getElementById('qr-canvas');
    if (!video || !canvas || !window.jsQR) return;
    const ctx = canvas.getContext('2d');
    canvas.width  = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const img  = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(img.data, img.width, img.height);
    if (code?.data) {
      this._qrResult(code.data);
      return;
    }
    this._qrAnimFrame = requestAnimationFrame(() => this._qrTick());
  },

  _qrResult(data) {
    this._stopQR();
    // QR code يحتوي على empId أو رمز الشركة
    const emp = DB.employees.find(e => e.id === data || e.no === data || e.qrCode === data);
    if (emp) {
      App.closeModal();
      this._recordCheckin(emp.id, 'qr');
    } else if (data === (DB.company.id || 'company-qr')) {
      App.closeModal();
      this.doCheckIn('qr');
    } else {
      const status = document.getElementById('qr-status');
      if (status) status.innerHTML = `<span style="color:var(--warning)"><i class="fas fa-triangle-exclamation"></i> ${currentLang==='ar'?'QR غير معروف — جرّب مرة أخرى أو استخدم الاختيار اليدوي':'Unknown QR — try again or use manual selection'}</span>`;
      this._qrAnimFrame = requestAnimationFrame(() => this._qrTick());
    }
  },

  _stopQR() {
    if (this._qrAnimFrame) { cancelAnimationFrame(this._qrAnimFrame); this._qrAnimFrame = null; }
    if (this._qrStream) { this._qrStream.getTracks().forEach(t => t.stop()); this._qrStream = null; }
  },

  _qrManualCheckin() {
    const empId = document.getElementById('qr-emp-manual')?.value;
    if (!empId) { App.toast(currentLang==='ar'?'اختر موظفاً':'Select an employee', 'warning'); return; }
    this._stopQR();
    App.closeModal();
    this._recordCheckin(empId, 'qr');
  },

  openGPSVerify() {
    App.openModal('GPS ' + t('attendance.gpsVerify'), `
      <div style="padding:8px">
        <div id="gps-modal-map" class="map-container" style="height:220px;border-radius:12px;margin-bottom:16px;position:relative;overflow:hidden">
          <div class="map-grid"></div>
          <div class="geofence-circle" id="gps-fence"></div>
          <div class="map-pin" id="gps-pin" style="top:calc(50% - 10px);left:calc(50% - 10px)"></div>
          <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.35);border-radius:12px" id="gps-loading">
            <div style="text-align:center;color:#fff">
              <i class="fas fa-spinner fa-spin" style="font-size:28px;margin-bottom:8px;display:block"></i>
              <span style="font-size:13px">${currentLang==='ar'?'جارٍ تحديد موقعك...':'Locating you...'}</span>
            </div>
          </div>
        </div>
        <div id="gps-result" style="margin-bottom:14px"></div>
        <button id="gps-confirm-btn" class="btn btn-primary w-full" style="display:none"
          onclick="App.closeModal(); AttendanceModule.doCheckIn()">
          <i class="fas fa-map-pin"></i> ${currentLang==='ar'?'تأكيد الموقع وتسجيل الحضور':'Confirm Location & Check In'}
        </button>
        <button id="gps-override-btn" class="btn btn-secondary w-full" style="display:none;margin-top:8px"
          onclick="App.closeModal(); AttendanceModule.doCheckIn()">
          <i class="fas fa-circle-exclamation"></i> ${currentLang==='ar'?'تسجيل رغم خارج النطاق':'Check In Anyway (Outside Zone)'}
        </button>
      </div>
    `, { size: 'sm' });
    this._startGPS();
  },

  _calcDistance(lat1, lon1, lat2, lon2) {
    const R = 6371000;
    const φ1 = lat1 * Math.PI/180, φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180, Δλ = (lon2-lon1) * Math.PI/180;
    const a = Math.sin(Δφ/2)**2 + Math.cos(φ1)*Math.cos(φ2)*Math.sin(Δλ/2)**2;
    return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)));
  },

  _startGPS() {
    if (!navigator.geolocation) {
      this._gpsResult(false, null, currentLang==='ar'?'المتصفح لا يدعم GPS':'Browser does not support GPS');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const userLat  = pos.coords.latitude;
        const userLon  = pos.coords.longitude;
        const accuracy = Math.round(pos.coords.accuracy);
        const compLat  = DB.company.gpsLat;
        const compLon  = DB.company.gpsLon;
        const radius   = DB.company.gpsRadius || 200;

        document.getElementById('gps-loading')?.remove();

        if (!compLat || !compLon) {
          // موقع الشركة غير محدد — نسمح بالتسجيل مع تحذير
          this._gpsResult('unknown', accuracy,
            currentLang==='ar'
              ? `موقعك: ${userLat.toFixed(4)}, ${userLon.toFixed(4)} — موقع الشركة لم يُحدَّد بعد`
              : `Your location: ${userLat.toFixed(4)}, ${userLon.toFixed(4)} — Company GPS not set`
          );
          return;
        }

        const dist   = this._calcDistance(userLat, userLon, compLat, compLon);
        const inside = dist <= radius;
        this._gpsResult(inside, accuracy,
          currentLang==='ar'
            ? `${inside?'أنت داخل':'أنت خارج'} نطاق العمل — المسافة: ${dist}م (النطاق: ${radius}م) — دقة GPS: ±${accuracy}م`
            : `${inside?'Inside':'Outside'} work zone — Distance: ${dist}m (Radius: ${radius}m) — Accuracy: ±${accuracy}m`
        );
      },
      (err) => {
        const msgs = { 1:'تم رفض إذن الموقع — فعّل الإذن من إعدادات المتصفح', 2:'تعذّر تحديد الموقع', 3:'انتهت مهلة الطلب' };
        document.getElementById('gps-loading')?.remove();
        this._gpsResult(false, null, msgs[err.code] || err.message);
      },
      { enableHighAccuracy: true, timeout: 12000 }
    );
  },

  _gpsResult(inside, accuracy, msg) {
    const el = document.getElementById('gps-result');
    if (!el) return;
    if (inside === true) {
      el.innerHTML = `<div class="info-box info-box-success"><i class="fas fa-circle-check"></i><div><div style="font-weight:700">${currentLang==='ar'?'داخل نطاق العمل':'Inside Work Zone'}</div><div style="font-size:12px">${msg}</div></div></div>`;
      document.getElementById('gps-confirm-btn').style.display = '';
    } else if (inside === 'unknown') {
      el.innerHTML = `<div class="info-box info-box-warning"><i class="fas fa-triangle-exclamation"></i><div><div style="font-weight:700">${currentLang==='ar'?'موقع الشركة غير محدد':'Company GPS Not Set'}</div><div style="font-size:12px">${msg}</div></div></div>`;
      document.getElementById('gps-confirm-btn').style.display = '';
    } else {
      el.innerHTML = `<div class="info-box info-box-danger"><i class="fas fa-circle-xmark"></i><div><div style="font-weight:700">${currentLang==='ar'?'خارج نطاق العمل':'Outside Work Zone'}</div><div style="font-size:12px">${msg}</div></div></div>`;
      document.getElementById('gps-override-btn').style.display = '';
    }
  },

  openManual() {
    App.openModal(t('attendance.manualEntry'), `
      <form onsubmit="AttendanceModule.saveManual(event)">
        <div class="app-form-group">
          <label>${t('common.name')}</label>
          <select class="app-form-input app-form-select" name="empId" required>
            ${DB.employees.map(e=>`<option value="${e.id}">${e.name}</option>`).join('')}
          </select>
        </div>
        <div class="app-form-row">
          <div class="app-form-group">
            <label>${t('common.date')}</label>
            <input class="app-form-input" type="date" name="date" value="${new Date().toISOString().split('T')[0]}" required>
          </div>
          <div class="app-form-group">
            <label>${t('attendance.method')}</label>
            <select class="app-form-input app-form-select" name="method">
              <option value="manual">${t('attendance.manual')}</option>
              <option value="face">${t('attendance.faceRecog')}</option>
              <option value="qr">${t('attendance.qrScan')}</option>
              <option value="gps">GPS</option>
            </select>
          </div>
        </div>
        <div class="app-form-row">
          <div class="app-form-group">
            <label>${t('attendance.checkInTime')}</label>
            <input class="app-form-input" type="time" name="checkIn" id="manual-checkin" value="08:00" required>
          </div>
          <div class="app-form-group">
            <label>${t('attendance.checkOutTime')}</label>
            <input class="app-form-input" type="time" name="checkOut" id="manual-checkout" value="17:00">
          </div>
        </div>
        <!-- معلومة الوردية الليلية -->
        <div id="overnight-info" style="display:none;margin-bottom:10px;padding:10px 14px;background:rgba(139,92,246,0.08);border:1px solid rgba(139,92,246,0.25);border-radius:10px;font-size:12px;color:#7c3aed">
          <i class="fas fa-moon"></i> وردية ليلية — الانصراف يكون اليوم التالي، ساعات العمل تُحسب بشكل صحيح تلقائياً
        </div>
        <script>
          (function(){
            const ci = document.getElementById('manual-checkin');
            const co = document.getElementById('manual-checkout');
            function checkOvernight(){
              const info = document.getElementById('overnight-info');
              if(ci&&co&&info&&ci.value&&co.value) {
                info.style.display = co.value < ci.value ? '' : 'none';
              }
            }
            if(ci) ci.addEventListener('change', checkOvernight);
            if(co) co.addEventListener('change', checkOvernight);
          })();
        </script>
        <div class="app-form-group">
          <label>${t('attendance.notes')}</label>
          <input class="app-form-input" type="text" name="notes" placeholder="${t('attendance.notesPlaceholder')}">
        </div>
        <div class="modal-footer" style="padding:0;margin-top:20px">
          <button type="button" class="btn btn-secondary" onclick="App.closeModal()">${t('common.cancel')}</button>
          <button type="submit" class="btn btn-primary"><i class="fas fa-save"></i> ${t('common.save')}</button>
        </div>
      </form>
    `);
  },

  saveManual(e) {
    e.preventDefault();
    const form = e.target;
    const data = Object.fromEntries(new FormData(form));

    // تحديد وقت بداية وردية الموظف
    const emp = DB.employees.find(em => em.id === data.empId);
    const empShift = DB.getEmployeeShift(emp?.id, data.date);
    const isLate = DB.getLateMinutes(data.empId, data.date, data.checkIn) > 0;

    // حساب ساعات العمل (مع دعم الوردية الليلية)
    const workedMins = (data.checkIn && data.checkOut)
      ? this._shiftMinutes(data.checkIn, data.checkOut)
      : 0;

    // حساب الأوفر تايم
    const shiftMins = empShift ? this._shiftMinutes(empShift.start, empShift.end) : (8*60);
    const overtimeMins = Math.max(0, workedMins - shiftMins);

    DB.attendance.push({
      id:           DB.nextId('att'),
      empId:        data.empId,
      date:         data.date,
      checkIn:      data.checkIn,
      checkOut:     data.checkOut || null,
      status:       isLate ? 'late' : 'present',
      method:       data.method,
      workedMins,
      overtime:     overtimeMins > 0 ? overtimeMins : null,
      location:     currentLang==='ar'?'يدوي':'Manual',
      notes:        data.notes,
    });

    DB.save();
    App.closeModal();
    App.toast(t('attendance.addRecord') + ' — ' + (currentLang==='ar'?'تم بنجاح':'Added'), 'success');
    this._renderTable();
  },

  // ─── BULK MULTI-DAY ENTRY ─────────────────────────────────
  openBulkEntry() {
    const today = new Date().toISOString().split('T')[0];
    App.openModal(currentLang==='ar'?'تسجيل حضور وانصراف لعدة أيام':'Bulk Attendance Entry', `
      <div style="padding:4px">
        <div class="app-form-group">
          <label>${t('common.name')}</label>
          <select class="app-form-input app-form-select" id="bulk-emp" onchange="AttendanceModule._renderBulkRows()">
            <option value="">${currentLang==='ar'?'— اختر الموظف —':'— Select employee —'}</option>
            ${DB.employees.filter(e=>e.status!=='terminated').map(e=>`<option value="${e.id}">${e.name}</option>`).join('')}
          </select>
        </div>
        <div class="app-form-row">
          <div class="app-form-group">
            <label>${t('common.from')}</label>
            <input class="app-form-input" type="date" id="bulk-from" value="${today}" onchange="AttendanceModule._renderBulkRows()">
          </div>
          <div class="app-form-group">
            <label>${t('common.to')}</label>
            <input class="app-form-input" type="date" id="bulk-to" value="${today}" onchange="AttendanceModule._renderBulkRows()">
          </div>
        </div>

        <div style="display:flex;gap:10px;align-items:flex-end;margin-bottom:12px;padding:10px;background:rgba(99,102,241,0.06);border-radius:10px">
          <div class="app-form-group" style="margin-bottom:0;flex:1">
            <label style="font-size:11px">${currentLang==='ar'?'وقت حضور افتراضي':'Default check-in'}</label>
            <input class="app-form-input" type="time" id="bulk-default-in" value="08:00">
          </div>
          <div class="app-form-group" style="margin-bottom:0;flex:1">
            <label style="font-size:11px">${currentLang==='ar'?'وقت انصراف افتراضي':'Default check-out'}</label>
            <input class="app-form-input" type="time" id="bulk-default-out" value="17:00">
          </div>
          <button type="button" class="btn btn-secondary btn-sm" onclick="AttendanceModule._applyBulkDefaults()">
            ${currentLang==='ar'?'تطبيق على الكل':'Apply to all'}
          </button>
        </div>

        <div id="bulk-rows-wrapper" style="max-height:360px;overflow-y:auto;border:1px solid var(--border);border-radius:10px">
          <div style="padding:24px;text-align:center;color:var(--text-muted);font-size:13px">
            ${currentLang==='ar'?'اختر الموظف والفترة لعرض الأيام':'Select employee and date range to show days'}
          </div>
        </div>

        <div class="modal-footer" style="padding:0;margin-top:20px">
          <button type="button" class="btn btn-secondary" onclick="App.closeModal()">${t('common.cancel')}</button>
          <button type="button" class="btn btn-primary" onclick="AttendanceModule._saveBulkEntry()"><i class="fas fa-save"></i> ${currentLang==='ar'?'حفظ الكل':'Save all'}</button>
        </div>
      </div>
    `, { size: 'lg' });
  },

  _renderBulkRows() {
    const wrapper = document.getElementById('bulk-rows-wrapper');
    if (!wrapper) return;
    const empId = document.getElementById('bulk-emp')?.value;
    const from  = document.getElementById('bulk-from')?.value;
    const to    = document.getElementById('bulk-to')?.value;
    if (!empId || !from || !to) {
      wrapper.innerHTML = `<div style="padding:24px;text-align:center;color:var(--text-muted);font-size:13px">${currentLang==='ar'?'اختر الموظف والفترة لعرض الأيام':'Select employee and date range to show days'}</div>`;
      return;
    }

    const emp        = DB.getEmployee(empId);
    const workDays    = DB.company.workDays || ['sat','sun','mon','tue','wed','thu'];

    const start = from <= to ? from : to;
    const end   = from <= to ? to   : from;
    const dates = [];
    for (let d = new Date(start + 'T12:00:00'); d <= new Date(end + 'T12:00:00'); d.setDate(d.getDate() + 1)) {
      dates.push(d.toISOString().split('T')[0]);
    }

    const dayLabel = (date) => new Date(date + 'T12:00:00').toLocaleDateString(currentLang==='ar'?'ar-SA':'en-US', { weekday: 'short', day: 'numeric', month: 'short' });

    wrapper.innerHTML = `
      <table style="width:100%;border-collapse:collapse;font-size:13px">
        <thead style="position:sticky;top:0;background:var(--card-bg,#fff);z-index:1">
          <tr style="border-bottom:1px solid var(--border)">
            <th style="padding:8px"><input type="checkbox" id="bulk-check-all" checked onchange="AttendanceModule._toggleAllBulkRows(this.checked)"></th>
            <th style="padding:8px;text-align:${currentLang==='ar'?'right':'left'}">${t('common.date')}</th>
            <th style="padding:8px">${t('attendance.checkInTime')}</th>
            <th style="padding:8px">${t('attendance.checkOutTime')}</th>
            <th style="padding:8px">${t('attendance.noFingerprint')}</th>
          </tr>
        </thead>
        <tbody>
          ${dates.map(date => {
            const dayName   = new Date(date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short' }).toLowerCase();
            const isWorkDay = workDays.includes(dayName);
            const isHoliday = (DB.company.holidays || []).some(h => h.date === date);
            const offDay    = !isWorkDay || isHoliday;
            const existing  = DB.attendance.find(a => a.date === date && a.empId === empId);
            const dayShift  = DB.getEmployeeShift(empId, date);
            const defaultIn  = dayShift?.start || DB.company.workStart || '08:00';
            const defaultOut = dayShift?.end   || DB.company.workEnd   || '17:00';
            const noFp       = existing?.status === 'no_fingerprint';
            return `
              <tr class="bulk-row" data-date="${date}" style="border-bottom:1px solid var(--border);${offDay?'opacity:.5':''}">
                <td style="padding:8px"><input type="checkbox" class="bulk-row-check" ${offDay?'':'checked'}></td>
                <td style="padding:8px">${dayLabel(date)}${offDay ? ` <span style="font-size:11px;color:var(--text-muted)">(${isHoliday?(currentLang==='ar'?'عطلة':'Holiday'):(currentLang==='ar'?'إجازة أسبوعية':'Weekly off')})</span>` : ''}</td>
                <td style="padding:8px"><input type="time" class="app-form-input bulk-checkin" style="padding:6px 8px" value="${existing?.checkIn || (offDay?'':defaultIn)}" ${noFp?'disabled':''}></td>
                <td style="padding:8px"><input type="time" class="app-form-input bulk-checkout" style="padding:6px 8px" value="${existing?.checkOut || (offDay?'':defaultOut)}" ${noFp?'disabled':''}></td>
                <td style="padding:8px;text-align:center">
                  <input type="checkbox" class="bulk-no-fingerprint" ${noFp?'checked':''}
                    onchange="const r=this.closest('.bulk-row');r.querySelector('.bulk-checkin').disabled=this.checked;r.querySelector('.bulk-checkout').disabled=this.checked;">
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    `;
  },

  _toggleAllBulkRows(checked) {
    document.querySelectorAll('#bulk-rows-wrapper .bulk-row-check').forEach(cb => cb.checked = checked);
  },

  _applyBulkDefaults() {
    const inVal  = document.getElementById('bulk-default-in')?.value;
    const outVal = document.getElementById('bulk-default-out')?.value;
    document.querySelectorAll('#bulk-rows-wrapper .bulk-row').forEach(row => {
      if (!row.querySelector('.bulk-row-check')?.checked) return;
      if (inVal)  row.querySelector('.bulk-checkin').value  = inVal;
      if (outVal) row.querySelector('.bulk-checkout').value = outVal;
    });
  },

  _saveBulkEntry() {
    const empId = document.getElementById('bulk-emp')?.value;
    if (!empId) { App.toast(currentLang==='ar'?'اختر موظفاً أولاً':'Select an employee first', 'warning'); return; }
    const emp = DB.getEmployee(empId);
    if (!emp) return;

    const from = document.getElementById('bulk-from')?.value;
    const to   = document.getElementById('bulk-to')?.value;

    let saved = 0;
    document.querySelectorAll('#bulk-rows-wrapper .bulk-row').forEach(row => {
      if (!row.querySelector('.bulk-row-check')?.checked) return;
      const date       = row.dataset.date;
      const noFp       = row.querySelector('.bulk-no-fingerprint')?.checked;
      const existing   = DB.attendance.find(a => a.date === date && a.empId === empId);

      if (noFp) {
        // لا يوجد بصمة: يُسجَّل حضور الموظف بدون أوقات دخول/خروج فعلية
        if (existing) {
          existing.checkIn = null; existing.checkOut = null;
          existing.status = 'no_fingerprint'; existing.workedMins = 0; existing.overtime = null;
          existing.method = 'manual';
        } else {
          DB.attendance.push({
            id: DB.nextId('att'), empId, date,
            checkIn: null, checkOut: null,
            status: 'no_fingerprint',
            method: 'manual', workedMins: 0, overtime: null,
            location: currentLang==='ar'?'يدوي':'Manual', notes: '',
          });
        }
        saved++;
        return;
      }

      const checkIn  = row.querySelector('.bulk-checkin')?.value;
      const checkOut = row.querySelector('.bulk-checkout')?.value;
      if (!checkIn) {
        // بدون وقت حضور = غياب — احذف أي سجل سابق لهذا اليوم بدلاً من تركه كما هو
        if (existing) {
          const idx = DB.attendance.indexOf(existing);
          if (idx !== -1) DB.attendance.splice(idx, 1);
          saved++;
        }
        return;
      }

      const empShift     = DB.getEmployeeShift(empId, date);
      const shiftMins    = empShift ? this._shiftMinutes(empShift.start, empShift.end) : (8 * 60);
      const isLate       = DB.getLateMinutes(empId, date, checkIn) > 0;
      const workedMins   = checkOut ? this._shiftMinutes(checkIn, checkOut) : 0;
      const overtimeMins = checkOut ? Math.max(0, workedMins - shiftMins) : 0;

      if (existing) {
        existing.checkIn    = checkIn;
        existing.checkOut   = checkOut || null;
        existing.status     = isLate ? 'late' : 'present';
        existing.workedMins = workedMins;
        existing.overtime   = overtimeMins > 0 ? overtimeMins : null;
      } else {
        DB.attendance.push({
          id: DB.nextId('att'), empId, date,
          checkIn, checkOut: checkOut || null,
          status: isLate ? 'late' : 'present',
          method: 'manual', workedMins,
          overtime: overtimeMins > 0 ? overtimeMins : null,
          location: currentLang==='ar'?'يدوي':'Manual', notes: '',
        });
      }
      saved++;
    });

    if (!saved) { App.toast(currentLang==='ar'?'لم يتم اختيار أي يوم بوقت حضور':'No days with check-in time selected', 'warning'); return; }

    DB.save();
    App.closeModal();
    App.toast(`${currentLang==='ar'?'تم حفظ':'Saved'} ${saved} ${currentLang==='ar'?'يوم بنجاح':'day(s) successfully'}`, 'success');

    if (from) this._dateFrom = from;
    if (to)   this._dateTo   = to;
    this._empFilter = empId;
    this.render(document.getElementById('page-content'));
  },

  editRecord(id) {
    const rec = DB.attendance.find(a => a.id === id);
    if (!rec) return;
    App.openModal(t('common.edit'), `
      <form onsubmit="AttendanceModule.updateRecord(event, '${id}')">
        <div class="app-form-row">
          <div class="app-form-group">
            <label>${t('attendance.checkInTime')}</label>
            <input class="app-form-input" type="time" name="checkIn" value="${rec.checkIn}" required>
          </div>
          <div class="app-form-group">
            <label>${t('attendance.checkOutTime')}</label>
            <input class="app-form-input" type="time" name="checkOut" value="${rec.checkOut||''}">
          </div>
        </div>
        <div class="app-form-group">
          <label>${t('common.status')}</label>
          <select class="app-form-input app-form-select" name="status">
            <option value="present" ${rec.status==='present'?'selected':''}>${t('attendance.present')}</option>
            <option value="late"    ${rec.status==='late'?'selected':''}>${t('attendance.late')}</option>
          </select>
        </div>
        <div class="app-form-group">
          <label>${t('attendance.overtime')}</label>
          <input class="app-form-input" type="text" name="overtime" value="${rec.overtime||''}" placeholder="0:00">
        </div>
        <div class="modal-footer" style="padding:0;margin-top:20px">
          <button type="button" class="btn btn-secondary" onclick="App.closeModal()">${t('common.cancel')}</button>
          <button type="submit" class="btn btn-primary">${t('common.save')}</button>
        </div>
      </form>
    `, { size: 'sm' });
  },

  updateRecord(e, id) {
    e.preventDefault();
    const form = e.target;
    const data = Object.fromEntries(new FormData(form));
    const rec = DB.attendance.find(a => a.id === id);
    if (rec) {
      rec.checkIn  = data.checkIn  || rec.checkIn;
      rec.checkOut = data.checkOut || rec.checkOut;
      rec.status   = data.status   || rec.status;
      rec.overtime = data.overtime || null;
    }
    if (rec && rec.checkIn && rec.checkOut) {
      rec.workedMins = this._shiftMinutes(rec.checkIn, rec.checkOut);
      // حساب الأوفرتايم إن لم يُدخله المستخدم يدوياً
      if (!data.overtime) {
        const sh2  = DB.getEmployeeShift(rec.empId, rec.date);
        if (sh2?.start && sh2?.end) {
          const shMins = this._shiftMinutes(sh2.start, sh2.end);
          const ot = rec.workedMins - shMins;
          rec.overtime = ot > 30 ? Math.round(ot) : null;
        }
      }
    }
    DB.save();
    App.closeModal();
    App.toast(currentLang==='ar'?'تم التحديث بنجاح':'Updated successfully', 'success');
    this._renderTable();
  },

  deleteRecord(id) {
    App.confirm(currentLang==='ar'?'هل تريد حذف هذا السجل؟':'Delete this record?', () => {
      const i = DB.attendance.findIndex(a => a.id === id);
      if (i !== -1) DB.attendance.splice(i, 1);
      App.toast(currentLang==='ar'?'تم الحذف':'Deleted', 'success');
      this._renderTable();
    });
  },

  sendBulkWA() {
    const date   = this._dateFrom || new Date().toISOString().split('T')[0];
    const dayAtt = DB.attendance.filter(a => a.date === date);

    // Find absent employees (active, not in attendance)
    const presentIds = new Set(dayAtt.map(a => a.empId));
    const absentEmps = DB.employees.filter(e => e.status === 'active' && !presentIds.has(e.id));
    const lateEmps   = dayAtt.filter(a => a.status === 'late').map(a => DB.getEmployee(a.empId)).filter(Boolean);

    const allTargets = [...absentEmps, ...lateEmps];
    if (!allTargets.length) {
      App.toast(currentLang==='ar'?'لا يوجد غائبون أو متأخرون في هذا اليوم':'No absent or late employees today', 'info');
      return;
    }

    const today = new Date(date).toLocaleDateString('ar-SA', { weekday:'long', year:'numeric', month:'long', day:'numeric' });
    const absentMsg = WhatsApp.fill(WhatsApp.templates.absence, { name: '{name}', date: today });
    const lateMsg   = WhatsApp.fill(WhatsApp.templates.late,    { name: '{name}', date: today, minutes: '?' });

    App.openModal(`إرسال WhatsApp جماعي — ${allTargets.length} موظف`, `
      <div style="display:flex;gap:12px;margin-bottom:16px">
        <div style="flex:1;background:var(--danger-bg);border:1px solid var(--danger);border-radius:10px;padding:12px;text-align:center">
          <div style="font-size:24px;font-weight:800;color:var(--danger)">${absentEmps.length}</div>
          <div style="font-size:12px;color:var(--text-muted)">غائب</div>
        </div>
        <div style="flex:1;background:var(--warning-bg);border:1px solid var(--warning);border-radius:10px;padding:12px;text-align:center">
          <div style="font-size:24px;font-weight:800;color:var(--warning)">${lateEmps.length}</div>
          <div style="font-size:12px;color:var(--text-muted)">متأخر</div>
        </div>
      </div>

      ${absentEmps.length ? `
        <div class="app-form-group">
          <label>🔴 رسالة الغياب (${absentEmps.length} موظف)</label>
          <textarea class="app-form-input" id="bulk-absence-msg" rows="3" style="resize:vertical">${absentMsg}</textarea>
        </div>` : ''}

      ${lateEmps.length ? `
        <div class="app-form-group">
          <label>🟡 رسالة التأخير (${lateEmps.length} موظف)</label>
          <textarea class="app-form-input" id="bulk-late-msg" rows="3" style="resize:vertical">${lateMsg}</textarea>
        </div>` : ''}

      <div style="background:var(--warning-bg);border-radius:10px;padding:10px 12px;font-size:12px;color:var(--text-secondary);margin-bottom:16px">
        <i class="fas fa-info-circle" style="color:var(--warning)"></i>
        يستبدل النظام <code>{name}</code> باسم كل موظف تلقائياً — الإرسال تتابعي لتجنب الحظر
      </div>

      <div style="display:flex;gap:8px;justify-content:flex-end">
        <button class="btn btn-secondary" onclick="App.closeModal()">إلغاء</button>
        <button class="btn btn-sm" style="background:#25d366;color:white" onclick="AttendanceModule._executeBulkWA()">
          <i class="fab fa-whatsapp"></i> إرسال للجميع
        </button>
      </div>
    `, { size: 'lg' });

    // Store targets for execution
    this._bulkAbsent = absentEmps;
    this._bulkLate   = lateEmps;
  },

  async _executeBulkWA() {
    const absentMsg = document.getElementById('bulk-absence-msg')?.value?.trim();
    const lateMsg   = document.getElementById('bulk-late-msg')?.value?.trim();
    App.closeModal();

    let sent = 0;
    const allOps = [
      ...(this._bulkAbsent || []).map(emp => ({ emp, msg: absentMsg })),
      ...(this._bulkLate   || []).map(emp => ({ emp, msg: lateMsg })),
    ].filter(op => op.msg);

    for (let i = 0; i < allOps.length; i++) {
      const { emp, msg } = allOps[i];
      const filled = WhatsApp.fill(msg, { name: emp.name });
      const ok = await WhatsApp.send(emp.phone, filled);
      if (ok) sent++;
      if (i < allOps.length - 1) await new Promise(r => setTimeout(r, 1200));
    }

    App.toast(`تم إرسال ${sent} رسالة من ${allOps.length}`, sent === allOps.length ? 'success' : 'warning');
    this._bulkAbsent = [];
    this._bulkLate   = [];
  },

  sendWA(empId, status, attId) {
    const emp = DB.getEmployee(empId);
    if (!emp) return;
    const att = DB.attendance.find(a => a.id === attId);

    if (status === 'absent') {
      WhatsApp.openCompose(empId);
      // Pre-select absence template
      setTimeout(() => {
        const sel = document.getElementById('wa-tpl-select');
        if (sel) { sel.value = 'absence'; WhatsApp._previewTemplate('absence', empId); }
      }, 100);
    } else if (status === 'late') {
      WhatsApp.openCompose(empId);
      setTimeout(() => {
        const sel = document.getElementById('wa-tpl-select');
        if (sel) { sel.value = 'late'; WhatsApp._previewTemplate('late', empId); }
      }, 100);
    }
  },

  exportData() {
    const data = DB.attendance.slice(0, 100).map(a => {
      const emp = DB.getEmployee(a.empId);
      return {
        [t('common.name')]:              emp?.name||'',
        [t('common.date')]:              a.date,
        [t('attendance.checkInTime')]:   a.checkIn,
        [t('attendance.checkOutTime')]:  a.checkOut||'',
        [t('common.status')]:            a.status,
        [t('attendance.method')]:        a.method,
      };
    });
    App.exportCSV(data, 'attendance.csv');
  },

  // ─── FACE RECOGNITION CHECK-IN ───────────────────────────
  openFaceCheckin() {
    if (!Biometrics.canCamera()) {
      App.toast(currentLang==='ar'?'الكاميرا غير متاحة على هذا الجهاز':'Camera not available on this device', 'error');
      return;
    }

    // Build list of employees with registered faces
    const registered = DB.employees.filter(e => e.status === 'active' && Biometrics.hasStoredFace(e.id));
    if (!registered.length) {
      App.openModal('تسجيل الحضور بالوجه', `
        <div style="text-align:center;padding:20px 0">
          <div style="font-size:48px;margin-bottom:12px;opacity:.5">📷</div>
          <p style="font-size:14px;font-weight:600;color:var(--text-secondary)">
            لا توجد بصمات وجه مسجّلة حتى الآن<br>
            <span style="font-size:12px;color:var(--text-muted)">يجب تسجيل بصمة وجه الموظفين أولاً من ملفاتهم الشخصية</span>
          </p>
          <div style="margin-top:16px;display:flex;gap:8px;justify-content:center">
            <button class="btn btn-secondary" onclick="App.closeModal()">إغلاق</button>
            <button class="btn btn-primary" onclick="App.closeModal(); App.navigate('employees')">انتقل لقسم الموظفين</button>
          </div>
        </div>
      `, { size: 'sm' });
      return;
    }

    Biometrics.openFaceVerify({
      onSuccess: (matchedName) => {
        const emp = DB.employees.find(e => e.name === matchedName);
        if (!emp) { App.toast(currentLang==='ar'?'لم يُعثر على الموظف في النظام':'Employee not found in the system', 'error'); return; }
        this._recordCheckin(emp.id, 'face');
        this._renderTable?.();
      },
      onFail: () => App.toast(currentLang==='ar'?'لم يتم التعرف على الوجه — حاول مرة أخرى في ضوء أفضل':'Face not recognized — try again in better lighting', 'error'),
    });
  },
};
