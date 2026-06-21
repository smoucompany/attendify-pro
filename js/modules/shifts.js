/* =========================================================
   SHIFTS MODULE
   Shift Templates · Weekly Schedule · Assignment
   ========================================================= */

const ShiftsModule = {
  render(container) {
    const days = [
      t('day.sat'), t('day.sun'), t('day.mon'),
      t('day.tue'), t('day.wed'), t('day.thu'), t('day.fri')
    ];
    // Build assignments dynamically from emp.shift field
    const shiftAssignments = {};
    DB.employees.forEach(emp => {
      if (emp.shift && emp.shift !== 'off') {
        shiftAssignments[emp.id] = Array(7).fill(emp.shift);
        shiftAssignments[emp.id][6] = 'off'; // Friday off by default
      }
    });
    const displayEmps = DB.employees.slice(0, 7);

    container.innerHTML = `
      <div class="page-header">
        <div class="page-header-text">
          <h1>${t('shifts.title')}</h1>
          <p>${t('shifts.subtitle')}</p>
        </div>
        <div class="page-header-actions">
          <button class="btn btn-secondary" onclick="App.printPage()"><i class="fas fa-print"></i> ${t('common.print')}</button>
          <button class="btn btn-primary" onclick="ShiftsModule.openAdd()"><i class="fas fa-plus"></i> ${t('shifts.addShift')}</button>
        </div>
      </div>

      <!-- Shift Templates -->
      <div class="grid-4" style="margin-bottom:24px">
        ${DB.shifts.filter(s=>s.type!=='assignment').map(s => {
          const isOvernight = s.end && s.start && s.end <= s.start;
          const hrs = ShiftsModule._shiftHours(s.start, s.end);
          return `
          <div class="card" style="border-top:3px solid ${s.color||'#6366f1'}">
            <div class="card-body">
              <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
                <div style="display:flex;align-items:center;gap:8px">
                  <span style="font-size:15px;font-weight:700;color:var(--text-primary)">${s.name}</span>
                  ${isOvernight?`<span style="font-size:10px;background:rgba(139,92,246,0.12);color:#7c3aed;padding:2px 8px;border-radius:6px;font-weight:700">🌙 ليلي</span>`:''}
                </div>
                <button class="btn-icon btn" onclick="ShiftsModule.editShift('${s.id}')"><i class="fas fa-pencil"></i></button>
              </div>
              <div style="display:flex;flex-direction:column;gap:8px">
                <div style="display:flex;align-items:center;gap:8px;font-size:13px;color:var(--text-secondary)">
                  <i class="fas fa-clock" style="color:${s.color||'#6366f1'};width:16px"></i>
                  <span style="font-family:var(--font-en);font-weight:600">${s.start} — ${s.end}${isOvernight?' (+يوم)':''}</span>
                </div>
                <div style="display:flex;align-items:center;gap:8px;font-size:13px;color:var(--text-secondary)">
                  <i class="fas fa-hourglass-half" style="color:var(--success);width:16px"></i>
                  <span>${hrs}</span>
                </div>
                <div style="display:flex;align-items:center;gap:8px;font-size:13px;color:var(--text-secondary)">
                  <i class="fas fa-coffee" style="color:var(--warning);width:16px"></i>
                  <span>${s.break||0} ${currentLang==='ar'?'دقيقة استراحة':'min break'}</span>
                </div>
                <div style="display:flex;gap:3px;margin-top:4px;flex-wrap:wrap">
                  ${(s.days||[]).map(d => `<span style="padding:2px 7px;background:${s.color||'#6366f1'}22;color:${s.color||'#6366f1'};border-radius:4px;font-size:10px;font-weight:700">${t('day.'+d).substring(0,3)}</span>`).join('')}
                </div>
              </div>
            </div>
          </div>`;
        }).join('')}
      </div>

      <!-- Weekly Schedule -->
      <div class="card" style="margin-bottom:20px">
        <div class="card-header">
          <h3><i class="fas fa-calendar-week" style="color:var(--primary)"></i> ${t('shifts.weekSchedule')}</h3>
          <button class="btn btn-outline-primary btn-sm" onclick="ShiftsModule.openAssign()">
            <i class="fas fa-user-clock"></i> ${t('shifts.assignShift')}
          </button>
        </div>
        <div class="card-body" style="overflow-x:auto">
          <!-- Header -->
          <div class="shift-row" style="margin-bottom:8px">
            <div style="font-size:12px;font-weight:700;color:var(--text-muted);padding:8px">${t('common.name')}</div>
            ${days.map(d => `<div style="font-size:12px;font-weight:700;color:var(--text-muted);text-align:center;padding:8px">${d}</div>`).join('')}
          </div>
          <!-- Employee rows -->
          ${displayEmps.map(emp => {
            const assigns = shiftAssignments[emp.id] || Array(7).fill('off');
            return `
              <div class="shift-row stagger-item">
                <div style="display:flex;align-items:center;gap:8px;padding:4px 8px">
                  <div class="avatar ${emp.avatarColor}" style="width:28px;height:28px;font-size:11px">${emp.avatar}</div>
                  <span style="font-size:12.5px;font-weight:600;color:var(--text-primary)">${emp.name}</span>
                </div>
                ${assigns.map(sid => {
                  if (sid === 'off') return `<div class="shift-cell off">OFF</div>`;
                  const sh = DB.shifts.find(s => s.id === sid);
                  if (!sh) return `<div class="shift-cell empty"></div>`;
                  return `<div class="shift-cell ${sh.type}" title="${sh.name}: ${sh.start}–${sh.end}">${sh.start}</div>`;
                }).join('')}
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <!-- Legend -->
      <div class="card">
        <div class="card-body" style="display:flex;gap:20px;flex-wrap:wrap">
          <span style="font-size:13px;font-weight:700;color:var(--text-muted)">${currentLang==='ar'?'المفتاح:':'Legend:'}</span>
          <span class="shift-cell morning" style="padding:4px 12px">${t('shifts.morning')}</span>
          <span class="shift-cell evening" style="padding:4px 12px">${t('shifts.evening')}</span>
          <span class="shift-cell night"   style="padding:4px 12px">${t('shifts.night')}</span>
          <span class="shift-cell off"     style="padding:4px 12px">OFF / ${t('leaves.days')}</span>
        </div>
      </div>
    `;
  },

  openAdd() {
    App.openModal(t('shifts.addShift'), this._form(null));
  },

  editShift(id) {
    const shift = DB.shifts.find(s => s.id === id);
    App.openModal(t('common.edit') + ' ' + (shift?.name||''), this._form(shift));
  },

  _form(shift) {
    const allDays = ['sat','sun','mon','tue','wed','thu','fri'];
    return `
      <form onsubmit="ShiftsModule.saveShift(event, '${shift?.id||''}')">
        <div class="app-form-group">
          <label>${currentLang==='ar'?'اسم الوردية':'Shift Name'}</label>
          <input class="app-form-input" type="text" name="name" value="${shift?.name||''}" required>
        </div>
        <div class="app-form-row">
          <div class="app-form-group">
            <label>${t('shifts.startTime')}</label>
            <input class="app-form-input" type="time" name="start" value="${shift?.start||'08:00'}" required>
          </div>
          <div class="app-form-group">
            <label>${t('shifts.endTime')}</label>
            <input class="app-form-input" type="time" name="end" value="${shift?.end||'17:00'}" required>
          </div>
        </div>
        <div class="app-form-group">
          <label>${t('shifts.breakTime')} (${currentLang==='ar'?'دقيقة':'minutes'})</label>
          <input class="app-form-input" type="number" name="break" value="${shift?.break||60}" min="0" step="15">
        </div>
        <div class="app-form-group">
          <label>${t('shifts.days')}</label>
          <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:4px">
            ${allDays.map(d => `
              <label style="display:flex;align-items:center;gap:5px;cursor:pointer;background:var(--bg-input);border:1px solid var(--border);border-radius:8px;padding:6px 10px">
                <input type="checkbox" name="days" value="${d}" ${shift?.days.includes(d)?'checked':''}>
                <span style="font-size:12px;font-weight:600">${t('day.'+d)}</span>
              </label>
            `).join('')}
          </div>
        </div>
        <div class="modal-footer" style="padding:0;margin-top:20px">
          <button type="button" class="btn btn-secondary" onclick="App.closeModal()">${t('common.cancel')}</button>
          <button type="submit" class="btn btn-primary"><i class="fas fa-save"></i> ${t('common.save')}</button>
        </div>
      </form>
    `;
  },

  // helper: حساب مدة الوردية مع دعم الليلية
  _shiftHours(start, end) {
    if (!start || !end) return '—';
    const [sh,sm] = start.split(':').map(Number);
    const [eh,em] = end.split(':').map(Number);
    let diff = (eh*60+em) - (sh*60+sm);
    if (diff <= 0) diff += 24*60;
    const h = Math.floor(diff/60), m = diff%60;
    return m ? `${h} س ${m} د` : `${h} ساعة`;
  },

  _detectType(start) {
    const h = parseInt((start||'08:00').split(':')[0], 10);
    if (h >= 5  && h < 12) return { type:'morning', color:'#f59e0b' };
    if (h >= 12 && h < 20) return { type:'evening', color:'#6366f1' };
    return { type:'night', color:'#7c3aed' };
  },

  saveShift(e, id) {
    e.preventDefault();
    const form  = e.target;
    const data  = new FormData(form);
    const days  = data.getAll('days');
    const shObj = Object.fromEntries(data);
    shObj.days  = days;

    const { type, color } = this._detectType(shObj.start);

    if (id) {
      const s = DB.shifts.find(s => s.id === id);
      if (s) Object.assign(s, shObj, { type, color });
      App.toast(currentLang==='ar'?'تم تحديث الوردية':'Shift updated', 'success');
    } else {
      DB.shifts.push({ id: DB.nextId('s'), ...shObj, type, color });
      App.toast(currentLang==='ar'?'تمت إضافة الوردية':'Shift added', 'success');
    }

    DB.save();
    App.closeModal();
    this.render(document.getElementById('page-content'));
  },

  openAssign() {
    App.openModal(t('shifts.assignShift'), `
      <form onsubmit="ShiftsModule.saveAssign(event)">
        <div class="app-form-group">
          <label>${t('nav.employees')}</label>
          <select class="app-form-input app-form-select" name="empId" required>
            ${DB.employees.map(e=>`<option value="${e.id}">${e.name}</option>`).join('')}
          </select>
        </div>
        <div class="app-form-group">
          <label>${currentLang==='ar'?'الوردية':'Shift'}</label>
          <select class="app-form-input app-form-select" name="shiftId" required>
            ${DB.shifts.filter(s=>s.type!=='assignment').map(s=>`<option value="${s.id}">${s.name} (${s.start}–${s.end})</option>`).join('')}
          </select>
        </div>
        <div class="app-form-row">
          <div class="app-form-group">
            <label>${currentLang==='ar'?'من تاريخ':'From'}</label>
            <input class="app-form-input" type="date" name="from" value="${new Date().toISOString().split('T')[0]}" required>
          </div>
          <div class="app-form-group">
            <label>${currentLang==='ar'?'إلى تاريخ':'To'}</label>
            <input class="app-form-input" type="date" name="to">
          </div>
        </div>
        <div class="modal-footer" style="padding:0;margin-top:20px">
          <button type="button" class="btn btn-secondary" onclick="App.closeModal()">${t('common.cancel')}</button>
          <button type="submit" class="btn btn-primary">${t('shifts.assignShift')}</button>
        </div>
      </form>
    `, { size: 'sm' });
  },

  saveAssign(e) {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target));
    const emp = DB.getEmployee(data.empId);
    if (emp) {
      emp.shift = data.shiftId;
      // Record or update the assignment
      const existing = DB.shifts.find(s => s.type === 'assignment' && s.empId === data.empId);
      const rec = {
        id:      existing?.id || DB.nextId('sa'),
        type:    'assignment',
        empId:   data.empId,
        shiftId: data.shiftId,
        from:    data.from,
        to:      data.to || null,
      };
      if (existing) {
        Object.assign(existing, rec);
      } else {
        DB.shifts.push(rec);
      }
      const shiftName = DB.shifts.find(s => s.id === data.shiftId)?.name || data.shiftId;
      DB.logAudit('admin', currentLang==='ar'?'تعيين وردية':'Assign Shift', 'Shifts',
        `${emp.name} ← ${shiftName}`);
    }
    DB.save();
    App.closeModal();
    App.toast(currentLang==='ar'?'تم تعيين الوردية بنجاح':'Shift assigned successfully', 'success');
    this.render(document.getElementById('page-content'));
  }
};
