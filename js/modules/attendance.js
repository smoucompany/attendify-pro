/* =========================================================
   ATTENDANCE MODULE
   Check-in/out · QR · Face Recognition · GPS · Records
   ========================================================= */

const AttendanceModule = {
  _view: 'table',
  _dateFilter: new Date().toISOString().split('T')[0],
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
          <button class="btn" style="background:linear-gradient(135deg,#6366f1,#8b5cf6);color:white" onclick="AttendanceModule.openFaceCheckin()"><i class="fas fa-face-smile"></i> تسجيل بالوجه</button>
          <button class="btn btn-primary" onclick="AttendanceModule.openManual()"><i class="fas fa-plus"></i> ${t('attendance.addRecord')}</button>
        </div>
      </div>

      <!-- Check-in Widget + Stats -->
      <div class="grid-main-side" style="margin-bottom:20px">
        <!-- Check-in Widget -->
        <div class="checkin-widget">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:4px">
            <div>
              <div class="checkin-clock" id="checkin-clock">08:00:00</div>
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
          <div style="display:flex;gap:8px;margin-top:12px">
            <button class="btn-checkin" style="flex:none;padding:8px 12px;font-size:12px" onclick="AttendanceModule.openFaceRec()">
              <i class="fas fa-face-smile"></i> ${t('attendance.faceRecog')}
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
        <input type="date" class="toolbar-select" value="${this._dateFilter}"
          onchange="AttendanceModule._dateFilter=this.value; AttendanceModule._renderTable()">
        <select class="toolbar-select" onchange="AttendanceModule._statusFilter=this.value; AttendanceModule._renderTable()">
          <option value="all">${t('common.all')}</option>
          <option value="present">${t('attendance.present')}</option>
          <option value="late">${t('attendance.late')}</option>
        </select>
        <select class="toolbar-select" onchange="AttendanceModule._empFilter=this.value; AttendanceModule._renderTable()">
          <option value="all">${t('common.all')} ${t('nav.employees')}</option>
          ${DB.employees.slice(0,10).map(e=>`<option value="${e.id}">${e.name}</option>`).join('')}
        </select>
        <div class="toolbar-separator"></div>
        <button class="btn btn-secondary btn-sm" onclick="AttendanceModule.exportData()">
          <i class="fas fa-file-csv"></i> CSV
        </button>
        <button class="btn btn-sm" style="background:#25d366;color:white" onclick="AttendanceModule.sendBulkWA()" title="إرسال WhatsApp للغائبين والمتأخرين">
          <i class="fab fa-whatsapp"></i> إشعار جماعي
        </button>
      </div>

      <!-- Attendance Table -->
      <div id="attendance-table"></div>
    `;

    // Start clock
    const clockEl = document.getElementById('checkin-clock');
    if (clockEl) {
      const tick = () => { if (document.getElementById('checkin-clock')) clockEl.textContent = new Date().toLocaleTimeString('ar-SA'); };
      tick();
      this._clockInterval = setInterval(tick, 1000);
    }

    this._renderTable();
  },

  _renderTable() {
    const container = document.getElementById('attendance-table');
    if (!container) return;

    let records = DB.attendance.filter(a => {
      const matchDate   = a.date === this._dateFilter;
      const matchStatus = this._statusFilter === 'all' || a.status === this._statusFilter;
      const matchEmp    = this._empFilter === 'all' || a.empId === this._empFilter;
      const search      = (this._search||'').toLowerCase();
      const emp         = DB.getEmployee(a.empId);
      const matchSearch = !search || emp?.name.includes(search);
      return matchDate && matchStatus && matchEmp && matchSearch;
    });

    if (!records.length) {
      container.innerHTML = `<div class="empty-state"><div class="empty-icon"><i class="fas fa-clock"></i></div><div class="empty-title">${t('common.noData')}</div><p class="empty-desc">${currentLang==='ar'?'لا توجد سجلات حضور لهذا اليوم':'No attendance records for this date'}</p></div>`;
      return;
    }

    container.innerHTML = `
      <div class="table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
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
            ${records.map(a => {
              const emp  = DB.getEmployee(a.empId);
              const dept = DB.getDepartment(emp?.dept);
              const dur  = this._calcDuration(a.checkIn, a.checkOut);
              return `
                <tr class="stagger-item">
                  <td>
                    <div class="table-avatar">
                      <div class="avatar ${emp?.avatarColor||'gradient-primary'}">${emp?.avatar||'?'}</div>
                      <div class="avatar-info">
                        <div class="avatar-name">${emp?.name||'—'}</div>
                        <div class="avatar-sub">${emp?.no||''}</div>
                      </div>
                    </div>
                  </td>
                  <td><span class="badge badge-primary">${dept?.name||''}</span></td>
                  <td><span style="font-family:var(--font-en);font-weight:600;color:var(--success)">${a.checkIn||'—'}</span></td>
                  <td><span style="font-family:var(--font-en);font-weight:600;color:var(--danger)">${a.checkOut||'—'}</span></td>
                  <td><span style="font-family:var(--font-en);color:var(--text-primary);font-weight:600">${dur}</span></td>
                  <td>${App.getMethodIcon(a.method||'manual')} <span style="font-size:11px;color:var(--text-muted)">${a.method||'manual'}</span></td>
                  <td>${a.overtime ? `<span class="badge badge-info">${a.overtime}</span>` : `<span style="color:var(--text-muted)">—</span>`}</td>
                  <td>${App.getStatusBadge(a.status||'present')}</td>
                  <td>
                    <div style="display:flex;gap:4px">
                      ${(a.status==='late'||a.status==='absent') ? `
                        <button class="btn-icon btn" title="إرسال WhatsApp" style="color:#25d366"
                          onclick="AttendanceModule.sendWA('${a.empId}','${a.status}','${a.id}')">
                          <i class="fab fa-whatsapp"></i>
                        </button>` : ''}
                      <button class="btn-icon btn" onclick="AttendanceModule.editRecord('${a.id}')" title="${t('common.edit')}"><i class="fas fa-pencil"></i></button>
                      <button class="btn-icon btn" onclick="AttendanceModule.deleteRecord('${a.id}')" title="${t('common.delete')}" style="color:var(--danger)"><i class="fas fa-trash"></i></button>
                    </div>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
      <p style="font-size:12px;color:var(--text-muted);margin-top:8px">
        ${t('common.showing')} ${records.length} ${t('common.results')}
      </p>
    `;
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

  doCheckIn() {
    if (this._checkedIn) { App.toast(currentLang==='ar'?'أنت سجلت حضورك بالفعل':'Already checked in', 'warning'); return; }
    this._checkedIn  = true;
    this._checkInTime = new Date().toLocaleTimeString('ar-SA');
    App.toast(currentLang==='ar'?'تم تسجيل الحضور بنجاح':'Check-in recorded', 'success');
    this.render(document.getElementById('page-content'));
  },

  doCheckOut() {
    if (!this._checkedIn) { App.toast(currentLang==='ar'?'لم تسجل حضورك بعد':'Please check in first', 'warning'); return; }
    this._checkedIn = false;
    App.toast(currentLang==='ar'?'تم تسجيل الانصراف بنجاح':'Check-out recorded', 'success');
    this.render(document.getElementById('page-content'));
  },

  openFaceRec() {
    App.openModal(t('attendance.faceRecog'), `
      <div class="face-rec-container">
        <div class="face-box">
          <div class="face-corners"></div>
          <i class="fas fa-face-smile face-icon"></i>
        </div>
        <p style="color:var(--text-muted);font-size:13px;text-align:center">${currentLang==='ar'?'انظر إلى الكاميرا للتعرف على وجهك':'Look at the camera for face recognition'}</p>
        <div class="info-box info-box-primary">
          <i class="fas fa-info-circle"></i>
          <span>${currentLang==='ar'?'يتم تشغيل تقنية التعرف على الوجه — وضع العرض التجريبي':'Face recognition engine running — Demo mode'}</span>
        </div>
        <button class="btn btn-primary w-full" onclick="App.closeModal(); AttendanceModule.doCheckIn()">
          <i class="fas fa-face-smile"></i> ${currentLang==='ar'?'تأكيد الحضور':'Confirm Attendance'}
        </button>
      </div>
    `, { size: 'sm' });
  },

  openQRScan() {
    App.openModal(t('attendance.qrScan'), `
      <div class="qr-container">
        <div class="qr-box">
          <i class="fas fa-qrcode"></i>
          <div class="qr-scan-line"></div>
        </div>
        <p style="color:var(--text-muted);font-size:13px;text-align:center">${currentLang==='ar'?'وجّه الكاميرا نحو QR Code لتسجيل الحضور':'Point camera at QR Code to record attendance'}</p>
        <div class="info-box info-box-success">
          <i class="fas fa-qrcode"></i>
          <span>${currentLang==='ar'?'جاهز للمسح — QR Code الخاص بشركتك نشط':'Ready to scan — Your company QR Code is active'}</span>
        </div>
        <button class="btn btn-success w-full" onclick="App.closeModal(); AttendanceModule.doCheckIn()">
          <i class="fas fa-qrcode"></i> ${currentLang==='ar'?'مسح وتأكيد':'Scan & Confirm'}
        </button>
      </div>
    `, { size: 'sm' });
  },

  openGPSVerify() {
    App.openModal('GPS ' + t('attendance.gpsVerify'), `
      <div style="padding:8px">
        <div class="map-container" style="height:260px;border-radius:12px;margin-bottom:16px">
          <div class="map-grid"></div>
          <div class="geofence-circle"></div>
          <div class="map-pin" style="top:calc(50% - 10px);left:calc(50% - 10px)"></div>
        </div>
        <div class="info-box info-box-success">
          <i class="fas fa-circle-check"></i>
          <div>
            <div style="font-weight:700">${currentLang==='ar'?'أنت داخل نطاق العمل':'You are within the work zone'}</div>
            <div style="font-size:12px">${currentLang==='ar'?'المركز الرئيسي — الرياض (120م)':'Head Office — Riyadh (120m)'}</div>
          </div>
        </div>
        <button class="btn btn-primary w-full" onclick="App.closeModal(); AttendanceModule.doCheckIn()">
          <i class="fas fa-map-pin"></i> ${currentLang==='ar'?'تأكيد الموقع وتسجيل الحضور':'Confirm Location & Check In'}
        </button>
      </div>
    `, { size: 'sm' });
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
          <label>${currentLang==='ar'?'ملاحظات':'Notes'}</label>
          <input class="app-form-input" type="text" name="notes" placeholder="${currentLang==='ar'?'ملاحظات اختيارية':'Optional notes'}">
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
    const empShift = emp?.shift ? DB.shifts.find(s => s.id === emp.shift) : null;
    const shiftStart = empShift?.start || DB.company.workStart || '08:00';
    const [sh, sm] = shiftStart.split(':').map(Number);
    const [ch, cm] = (data.checkIn||'00:00').split(':').map(Number);
    const late = (DB.company.lateThreshold || 15);
    const isLate = (ch*60+cm) > (sh*60+sm+late);

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
    App.closeModal();
    App.toast(currentLang==='ar'?'تم التحديث بنجاح':'Updated successfully', 'success');
    this._renderTable();
  },

  deleteRecord(id) {
    App.confirm(currentLang==='ar'?'هل تريد حذف هذا السجل؟':'Delete this record?', () => {
      DB.attendance = DB.attendance.filter(a => a.id !== id);
      App.toast(currentLang==='ar'?'تم الحذف':'Deleted', 'success');
      this._renderTable();
    });
  },

  sendBulkWA() {
    const date   = this._dateFilter || new Date().toISOString().split('T')[0];
    const dayAtt = DB.attendance.filter(a => a.date === date);

    // Find absent employees (active, not in attendance)
    const presentIds = new Set(dayAtt.map(a => a.empId));
    const absentEmps = DB.employees.filter(e => e.status === 'active' && !presentIds.has(e.id));
    const lateEmps   = dayAtt.filter(a => a.status === 'late').map(a => DB.getEmployee(a.empId)).filter(Boolean);

    const allTargets = [...absentEmps, ...lateEmps];
    if (!allTargets.length) {
      App.toast('لا يوجد غائبون أو متأخرون في هذا اليوم', 'info');
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
      App.toast('الكاميرا غير متاحة على هذا الجهاز', 'error');
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
        if (!emp) { App.toast('لم يُعثر على الموظف', 'error'); return; }

        const today = new Date().toISOString().split('T')[0];
        const now   = new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', hour12: false });
        const existing = DB.attendance.find(a => a.empId === emp.id && a.date === today);

        if (existing && !existing.checkOut) {
          // Check-out
          existing.checkOut = now;
          App.toast(`✅ تم تسجيل انصراف ${emp.name} الساعة ${now}`, 'success');
        } else if (!existing) {
          // Check-in
          const shift = DB.shifts?.find(s => s.id === emp.shift);
          const workStart = shift?.startTime || DB.company.workPeriods?.[0]?.start || '08:00';
          const [wh, wm] = workStart.split(':').map(Number);
          const [nh, nm] = now.split(':').map(Number);
          const lateMin = Math.max(0, (nh * 60 + nm) - (wh * 60 + wm));
          const status  = lateMin > 15 ? 'late' : 'present';

          DB.attendance.unshift({
            id:       DB.nextId('a'),
            empId:    emp.id,
            date:     today,
            checkIn:  now,
            checkOut: null,
            status,
            lateMin:  lateMin || null,
            method:   'face',
            overtime: null,
          });
          DB.logAudit(emp.id, 'تسجيل حضور بالوجه', 'الحضور', `تسجيل حضور ${emp.name} عبر التعرف على الوجه`);
          const lateNote = status === 'late' ? ` (متأخر ${lateMin} دقيقة)` : '';
          App.toast(`✅ تم تسجيل حضور ${emp.name} الساعة ${now}${lateNote}`, status === 'late' ? 'warning' : 'success');
        } else {
          App.toast(`تم تسجيل حضور ${emp.name} مسبقاً اليوم`, 'info');
        }

        this._renderTable?.();
      },
      onFail: () => App.toast('لم يتم التعرف على الوجه — حاول مرة أخرى', 'error'),
    });
  },
};
