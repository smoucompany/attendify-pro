/* =========================================================
   SHIFTS MODULE
   Shift Templates · Weekly Schedule · Multi-shift Assignment
   ========================================================= */

const ShiftsModule = {

  _search: '',

  // ── نموذج البيانات: emp.shifts = [{ shiftId, days[] }]
  // مع دعم legacy: emp.shift (string) → يُحوَّل تلقائياً

  _empDayMap(emp) {
    const map = {};
    const ids  = this._normalizeShifts(emp);
    ids.forEach(sid => {
      const tpl = DB.shifts.find(s => s.id === sid);
      if (!tpl) return;
      const days = (tpl.days && tpl.days.length) ? tpl.days : ['sat','sun','mon','tue','wed','thu'];
      days.forEach(d => { map[d] = sid; });
    });
    return map;
  },

  render(container) {
    const dayKeys = ['sat','sun','mon','tue','wed','thu','fri'];
    const days    = dayKeys.map(d => t('day.'+d));

    const query      = this._search.toLowerCase();
    const allEmps    = DB.employees.filter(e => e.status !== 'terminated');
    const displayEmps = query
      ? allEmps.filter(e => e.name.includes(query) || e.position?.toLowerCase().includes(query))
      : allEmps;

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
        ${DB.shifts.filter(s => s.type !== 'assignment').map(s => {
          const isOvernight = s.end && s.start && s.end <= s.start;
          const hrs = ShiftsModule._shiftHours(s.start, s.end);
          const assigned = allEmps.filter(e =>
            Array.isArray(e.shifts)
              ? e.shifts.includes(s.id)
              : e.shift === s.id
          ).length;
          return `
          <div class="card stagger-item" style="overflow:hidden;border:1.5px solid ${s.color||'#6366f1'}28;transition:transform .2s,box-shadow .2s" onmouseover="this.style.transform='translateY(-2px)';this.style.boxShadow='0 8px 24px rgba(0,0,0,0.10)'" onmouseout="this.style.transform='';this.style.boxShadow=''">
            <!-- Colored header -->
            <div style="background:linear-gradient(135deg,${s.color||'#6366f1'},${s.color||'#6366f1'}bb);padding:14px 16px;position:relative;overflow:hidden">
              <!-- Decorative circles -->
              <div style="position:absolute;top:-18px;left:-18px;width:70px;height:70px;border-radius:50%;background:rgba(255,255,255,0.08)"></div>
              <div style="position:absolute;bottom:-22px;right:10px;width:80px;height:80px;border-radius:50%;background:rgba(255,255,255,0.06)"></div>
              <div style="display:flex;align-items:center;justify-content:space-between;position:relative">
                <div>
                  <div style="font-size:15px;font-weight:800;color:white;margin-bottom:3px">${s.name}</div>
                  <div style="font-size:12px;color:rgba(255,255,255,0.8);font-family:var(--font-en)">${s.start} — ${s.end}${isOvernight?` <span style="font-size:10px;background:rgba(255,255,255,0.2);padding:1px 6px;border-radius:4px">+${t('common.dayAbbr')}</span>`:''}</div>
                </div>
                <div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px">
                  ${isOvernight ? `<span style="font-size:10px;background:rgba(255,255,255,0.2);color:white;padding:2px 8px;border-radius:6px;font-weight:700">🌙 ${t('shifts.overnight')}</span>` : ''}
                  <button class="btn-icon btn" onclick="ShiftsModule.editShift('${s.id}')" style="background:rgba(255,255,255,0.15);color:white;border-radius:8px;width:30px;height:30px">
                    <i class="fas fa-pencil" style="font-size:12px"></i>
                  </button>
                </div>
              </div>
            </div>
            <!-- Body -->
            <div class="card-body" style="padding:12px 16px">
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px">
                <div style="background:var(--bg-input);border-radius:8px;padding:8px 10px;text-align:center">
                  <div style="font-size:18px;font-weight:800;color:${s.color||'#6366f1'}">${hrs}</div>
                  <div style="font-size:10px;color:var(--text-muted)">${t('shifts.shiftDuration')}</div>
                </div>
                <div style="background:var(--bg-input);border-radius:8px;padding:8px 10px;text-align:center">
                  <div style="font-size:18px;font-weight:800;color:var(--primary)">${assigned}</div>
                  <div style="font-size:10px;color:var(--text-muted)">${t('shifts.employees')}</div>
                </div>
              </div>
              <div style="display:flex;gap:4px;flex-wrap:wrap">
                ${(s.days||[]).map(d => `<span style="padding:3px 8px;background:${s.color||'#6366f1'}18;color:${s.color||'#6366f1'};border-radius:6px;font-size:11px;font-weight:700">${t('day.'+d).substring(0,3)}</span>`).join('')}
              </div>
            </div>
          </div>`;
        }).join('')}
      </div>

      <!-- Weekly Schedule -->
      <div class="card" style="margin-bottom:20px">
        <div class="card-header">
          <h3><i class="fas fa-calendar-week" style="color:var(--primary)"></i> ${t('shifts.weekSchedule')}</h3>
          <div style="display:flex;gap:8px;align-items:center">
            <div style="position:relative">
              <i class="fas fa-search" style="position:absolute;right:10px;top:50%;transform:translateY(-50%);color:var(--text-muted);font-size:12px;pointer-events:none"></i>
              <input type="text" placeholder="${t('shifts.searchEmployee')}"
                value="${this._search}"
                oninput="ShiftsModule._search=this.value;ShiftsModule.render(document.getElementById('page-content'))"
                style="padding:7px 32px 7px 12px;border:1.5px solid var(--border);border-radius:8px;font-size:12px;background:var(--bg-input);color:var(--text-primary);width:180px;outline:none;direction:rtl">
            </div>
            <button class="btn btn-outline-primary btn-sm" onclick="ShiftsModule.openAssign()">
              <i class="fas fa-user-clock"></i> ${t('shifts.assignShift')}
            </button>
          </div>
        </div>
        <div class="card-body" style="overflow-x:auto;padding:0">
          <table style="width:100%;border-collapse:collapse;min-width:700px">
            <thead>
              <tr style="background:var(--bg-secondary)">
                <th style="padding:10px 14px;text-align:right;font-size:12px;font-weight:700;color:var(--text-muted);border-bottom:1px solid var(--border);min-width:160px">${t('common.name')}</th>
                ${days.map(d => `<th style="padding:10px 8px;text-align:center;font-size:12px;font-weight:700;color:var(--text-muted);border-bottom:1px solid var(--border)">${d}</th>`).join('')}
                <th style="padding:10px 8px;text-align:center;font-size:12px;font-weight:700;color:var(--text-muted);border-bottom:1px solid var(--border);width:70px"></th>
              </tr>
            </thead>
            <tbody>
              ${displayEmps.length ? displayEmps.map((emp, ri) => {
                const dayMap = ShiftsModule._empDayMap(emp);
                return `
                  <tr style="border-bottom:1px solid var(--border);background:${ri%2?'var(--bg-secondary)':'var(--bg)'}">
                    <td style="padding:8px 14px">
                      <div style="display:flex;align-items:center;gap:8px">
                        ${App.renderAvatar(emp, 28, 8)}
                        <div>
                          <div style="font-size:12.5px;font-weight:600;color:var(--text-primary)">${emp.name}</div>
                          <div style="font-size:11px;color:var(--text-muted)">${emp.position||''}</div>
                        </div>
                      </div>
                    </td>
                    ${dayKeys.map(d => {
                      const sid = dayMap[d];
                      const sh  = sid ? DB.shifts.find(s => s.id === sid) : null;
                      if (!sh) return `
                        <td style="padding:4px;text-align:center">
                          <div class="shift-cell off" style="cursor:pointer;font-size:10px"
                            onclick="ShiftsModule.quickAssign('${emp.id}','${d}')" title="${t('shifts.clickToSet')}">—</div>
                        </td>`;
                      return `
                        <td style="padding:4px;text-align:center">
                          <div class="shift-cell ${sh.type}" style="cursor:pointer;position:relative;font-size:11px"
                            onclick="ShiftsModule.quickAssign('${emp.id}','${d}')"
                            title="${sh.name}: ${sh.start}–${sh.end} (${t('shifts.clickToChange')})">
                            ${sh.start}
                          </div>
                        </td>`;
                    }).join('')}
                    <td style="padding:4px;text-align:center">
                      <button class="btn-icon btn" style="font-size:11px" title="${t('shifts.assignShifts')}"
                        onclick="ShiftsModule.openAssign('${emp.id}')">
                        <i class="fas fa-pencil"></i>
                      </button>
                    </td>
                  </tr>`;
              }).join('') : `
                <tr><td colspan="9" style="padding:40px;text-align:center;color:var(--text-muted)">
                  ${t('shifts.noEmployees')}
                </td></tr>`}
            </tbody>
          </table>
          ${displayEmps.length < allEmps.length ? `
            <div style="padding:8px 14px;font-size:12px;color:var(--text-muted);border-top:1px solid var(--border);text-align:center">
              ${t('shifts.showingOf').replace('{0}', displayEmps.length).replace('{1}', allEmps.length)}
            </div>` : ''}
        </div>
      </div>

      <!-- Legend -->
      <div class="card">
        <div class="card-body" style="display:flex;gap:20px;flex-wrap:wrap;align-items:center">
          <span style="font-size:13px;font-weight:700;color:var(--text-muted)">${t('shifts.legend')}</span>
          <span class="shift-cell morning" style="padding:4px 12px">${t('shifts.morning')}</span>
          <span class="shift-cell evening" style="padding:4px 12px">${t('shifts.evening')}</span>
          <span class="shift-cell night"   style="padding:4px 12px">${t('shifts.night')}</span>
          <span class="shift-cell off"     style="padding:4px 12px">— ${t('shifts.clickToAssign')}</span>
        </div>
      </div>
    `;
  },

  // ── تعيين سريع بالنقر على الخلية ──────────────────────────
  quickAssign(empId, day) {
    const emp = DB.getEmployee(empId);
    if (!emp) return;
    const shifts = DB.shifts.filter(s => s.type !== 'assignment');
    const dayMap = this._empDayMap(emp);
    const curSid = dayMap[day];

    App.openModal(`${emp.name} — ${t('day.'+day)}`, `
      <div style="margin-bottom:16px;font-size:13px;color:var(--text-muted)">
        ${t('shifts.currentShift')}
        <strong>${curSid ? DB.shifts.find(s=>s.id===curSid)?.name || '—' : '—'}</strong>
      </div>
      <div style="display:flex;flex-direction:column;gap:8px">
        <button onclick="ShiftsModule._setDayShift('${empId}','${day}',null);App.closeModal()"
          style="padding:10px 16px;border:1.5px solid var(--border);border-radius:10px;background:var(--bg-input);color:var(--danger);font-size:13px;font-weight:600;cursor:pointer;text-align:right">
          <i class="fas fa-ban"></i> ${t('shifts.setOff')}
        </button>
        ${shifts.map(s => `
          <button onclick="ShiftsModule._setDayShift('${empId}','${day}','${s.id}');App.closeModal()"
            style="padding:10px 16px;border:2px solid ${curSid===s.id?s.color:'var(--border)'};border-radius:10px;background:${curSid===s.id?s.color+'18':'var(--bg-input)'};cursor:pointer;text-align:right;display:flex;align-items:center;gap:10px">
            <span style="width:10px;height:10px;border-radius:50%;background:${s.color||'#6366f1'};flex-shrink:0"></span>
            <div style="flex:1">
              <div style="font-size:13px;font-weight:700;color:var(--text-primary)">${s.name}</div>
              <div style="font-size:11.5px;color:var(--text-muted)">${s.start} — ${s.end}</div>
            </div>
            ${curSid===s.id?'<i class="fas fa-check" style="color:'+s.color+'"></i>':''}
          </button>
        `).join('')}
      </div>
    `, { size: 'sm' });
  },

  _setDayShift(empId, day, shiftId) {
    const emp = DB.getEmployee(empId);
    if (!emp) return;

    // Normalize to string[]
    emp.shifts = this._normalizeShifts(emp);

    if (shiftId) {
      // Add shift if not already in list
      if (!emp.shifts.includes(shiftId)) {
        emp.shifts.push(shiftId);
      }
    } else {
      // OFF: remove the shift that covers this day
      const dayMap = this._empDayMap(emp);
      const curSid = dayMap[day];
      if (curSid) emp.shifts = emp.shifts.filter(id => id !== curSid);
    }

    emp.shift = emp.shifts[0] || null;
    DB.save();
    this.render(document.getElementById('page-content'));
  },

  // تحويل البيانات القديمة إلى string[] موحّد
  _normalizeShifts(emp) {
    if (!Array.isArray(emp.shifts)) {
      // Legacy: emp.shift string only
      return emp.shift && emp.shift !== 'off' ? [emp.shift] : [];
    }
    // Handle mixed: could be string[] or {shiftId,days}[]
    return emp.shifts.map(a => (typeof a === 'string' ? a : a?.shiftId)).filter(Boolean);
  },

  // ── نافذة التعيين المتقدم ─────────────────────────────────
  openAssign(preEmpId = '') {
    const shifts = DB.shifts.filter(s => s.type !== 'assignment');
    const allDays = ['sat','sun','mon','tue','wed','thu','fri'];

    const renderAssignments = (empId) => {
      const emp = DB.getEmployee(empId);
      if (!emp) return '';
      const ids = ShiftsModule._normalizeShifts(emp);
      if (!ids.length) return `<div style="color:var(--text-muted);font-size:12.5px;text-align:center;padding:10px">${t('shifts.noAssigned')}</div>`;
      return ids.map((sid) => {
        const sh = DB.shifts.find(s => s.id === sid);
        if (!sh) return '';
        return `
          <div style="display:flex;align-items:center;gap:8px;padding:8px 10px;border-radius:8px;background:${sh.color}18;border:1.5px solid ${sh.color}44;margin-bottom:6px">
            <span style="width:8px;height:8px;border-radius:50%;background:${sh.color};flex-shrink:0"></span>
            <div style="flex:1">
              <div style="font-size:12.5px;font-weight:700;color:var(--text-primary)">${sh.name}</div>
              <div style="font-size:11px;color:var(--text-muted);font-family:var(--font-en)">${sh.start} – ${sh.end}</div>
            </div>
            <button onclick="ShiftsModule._removeAssignment('${empId}','${sid}')"
              style="background:none;border:none;color:var(--danger);cursor:pointer;padding:4px"><i class="fas fa-trash" style="font-size:12px"></i></button>
          </div>`;
      }).join('');
    };

    App.openModal(t('shifts.assignShift'), `
      <div class="app-form-group">
        <label>${t('nav.employees')}</label>
        <select id="assign-emp" class="app-form-input app-form-select" onchange="ShiftsModule._refreshAssignPanel(this.value)">
          <option value="">${t('shifts.selectEmployee')}</option>
          ${DB.employees.filter(e=>e.status!=='terminated').map(e =>
            `<option value="${e.id}" ${e.id===preEmpId?'selected':''}>${e.name}</option>`
          ).join('')}
        </select>
      </div>

      <!-- الورديات الحالية -->
      <div id="current-assignments" style="margin-bottom:14px;min-height:30px">
        ${preEmpId ? renderAssignments(preEmpId) : ''}
      </div>

      <!-- إضافة وردية جديدة -->
      <div style="background:var(--bg-secondary);border-radius:10px;padding:12px;border:1.5px solid var(--border)">
        <div style="font-size:12px;font-weight:700;color:var(--text-muted);margin-bottom:10px">
          <i class="fas fa-plus-circle" style="color:var(--primary)"></i> ${t('shifts.addNew')}
        </div>
        <div style="display:flex;gap:8px">
          <select id="assign-shift" class="app-form-input app-form-select" style="padding:8px 12px;flex:1">
            <option value="">${t('shifts.selectShift')}</option>
            ${shifts.map(s=>`<option value="${s.id}">${s.name} · ${s.start}–${s.end}</option>`).join('')}
          </select>
          <button onclick="ShiftsModule._addAssignment()"
            style="background:var(--primary);color:#fff;border:none;border-radius:10px;padding:8px 16px;font-size:13px;font-weight:700;cursor:pointer;white-space:nowrap">
            <i class="fas fa-plus"></i> ${t('common.add')}
          </button>
        </div>
      </div>
    `, { size: 'sm' });

  },

  _refreshAssignPanel(empId) {
    const panel = document.getElementById('current-assignments');
    if (!panel) return;
    const emp = DB.getEmployee(empId);
    if (!emp) { panel.innerHTML = ''; return; }
    const ids = this._normalizeShifts(emp);
    if (!ids.length) {
      panel.innerHTML = `<div style="color:var(--text-muted);font-size:12.5px;text-align:center;padding:10px">${t('shifts.noAssigned')}</div>`;
      return;
    }
    panel.innerHTML = ids.map(sid => {
      const sh = DB.shifts.find(s => s.id === sid);
      if (!sh) return '';
      return `
        <div style="display:flex;align-items:center;gap:8px;padding:8px 10px;border-radius:8px;background:${sh.color}18;border:1.5px solid ${sh.color}44;margin-bottom:6px">
          <span style="width:8px;height:8px;border-radius:50%;background:${sh.color};flex-shrink:0"></span>
          <div style="flex:1">
            <div style="font-size:12.5px;font-weight:700;color:var(--text-primary)">${sh.name}</div>
            <div style="font-size:11px;color:var(--text-muted);font-family:var(--font-en)">${sh.start} – ${sh.end}</div>
          </div>
          <button onclick="ShiftsModule._removeAssignment('${empId}','${sid}')"
            style="background:none;border:none;color:var(--danger);cursor:pointer;padding:4px"><i class="fas fa-trash" style="font-size:12px"></i></button>
        </div>`;
    }).join('');
  },

  _addAssignment() {
    const empId   = document.getElementById('assign-emp')?.value;
    const shiftId = document.getElementById('assign-shift')?.value;

    if (!empId)   { App.toast(currentLang==='ar'?'اختر موظفاً أولاً':'Select an employee first', 'error'); return; }
    if (!shiftId) { App.toast(currentLang==='ar'?'اختر الوردية':'Select a shift', 'error'); return; }

    const emp = DB.getEmployee(empId);
    if (!emp) return;

    // توحيد الـ format إلى string[]
    emp.shifts = this._normalizeShifts(emp);
    emp.shift  = emp.shifts[0] || null;

    if (emp.shifts.includes(shiftId)) {
      App.toast(t('shifts.alreadyAssigned'), 'warning');
      return;
    }

    emp.shifts.push(shiftId);
    emp.shift = emp.shifts[0];

    DB.save();
    const sh = DB.shifts.find(s => s.id === shiftId);
    App.toast(`تم تعيين "${sh?.name}" لـ ${emp.name} ✓`, 'success');

    this._refreshAssignPanel(empId);
    this.render(document.getElementById('page-content'));
    document.getElementById('assign-shift').value = '';
  },

  _removeAssignment(empId, shiftId) {
    const emp = DB.getEmployee(empId);
    if (!emp) return;
    emp.shifts = this._normalizeShifts(emp).filter(id => id !== shiftId);
    emp.shift  = emp.shifts[0] || null;
    DB.save();
    const sh = DB.shifts.find(s => s.id === shiftId);
    App.toast(`تم إزالة "${sh?.name||'الوردية'}"`, 'success');
    this._refreshAssignPanel(empId);
    this.render(document.getElementById('page-content'));
  },

  // ── إضافة / تعديل قالب وردية ─────────────────────────────
  openAdd() {
    App.openModal(t('shifts.addShift'), this._form(null));
  },

  editShift(id) {
    const shift = DB.shifts.find(s => s.id === id);
    App.openModal(t('common.edit') + ' ' + (shift?.name||''), this._form(shift));
  },

  _form(shift) {
    const allDays = ['sat','sun','mon','tue','wed','thu','fri'];
    const presetColors = [
      '#6366f1','#8b5cf6','#ec4899','#ef4444',
      '#f59e0b','#10b981','#06b6d4','#3b82f6',
      '#f97316','#14b8a6','#84cc16','#64748b',
    ];
    const curColor = shift?.color || '#6366f1';
    return `
      <form onsubmit="ShiftsModule.saveShift(event, '${shift?.id||''}')">
        <div class="app-form-group">
          <label>${t('shifts.shiftName')}</label>
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
          <label>${t('shifts.breakTime')} (${t('shifts.breakMinutes')})</label>
          <input class="app-form-input" type="number" name="break" value="${shift?.break||60}" min="0" step="15">
        </div>
        <div class="app-form-group">
          <label style="display:flex;align-items:center;gap:8px">
            ${t('shifts.shiftColor')}
            <span id="shift-color-preview" style="display:inline-block;width:22px;height:22px;border-radius:6px;background:${curColor};border:2px solid rgba(0,0,0,0.1);vertical-align:middle"></span>
          </label>
          <input type="hidden" name="color" id="shift-color-val" value="${curColor}">
          <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:6px">
            ${presetColors.map(c => `
              <div onclick="ShiftsModule._pickColor('${c}')"
                style="width:30px;height:30px;border-radius:8px;background:${c};cursor:pointer;transition:transform .15s,box-shadow .15s;border:2px solid ${c===curColor?'white':'transparent'};box-shadow:${c===curColor?'0 0 0 2px '+c:'none'}"
                id="color-dot-${c.replace('#','')}"
                title="${c}"
                onmouseover="this.style.transform='scale(1.15)'" onmouseout="this.style.transform=''">
              </div>
            `).join('')}
            <!-- Custom color picker -->
            <label title="${t('shifts.customColor')}" style="width:30px;height:30px;border-radius:8px;background:linear-gradient(135deg,#f00,#0f0,#00f);cursor:pointer;position:relative;overflow:hidden;flex-shrink:0">
              <input type="color" value="${curColor}" style="opacity:0;position:absolute;inset:0;width:100%;height:100%;cursor:pointer"
                oninput="ShiftsModule._pickColor(this.value)">
            </label>
          </div>
        </div>
        <div class="app-form-group">
          <label>${t('shifts.days')}</label>
          <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:4px">
            ${allDays.map(d => `
              <label style="display:flex;align-items:center;gap:5px;cursor:pointer;background:var(--bg-input);border:1.5px solid var(--border);border-radius:8px;padding:6px 10px">
                <input type="checkbox" name="days" value="${d}" ${shift?.days?.includes(d)?'checked':''}>
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

  _pickColor(hex) {
    const val  = document.getElementById('shift-color-val');
    const prev = document.getElementById('shift-color-preview');
    if (val)  val.value = hex;
    if (prev) prev.style.background = hex;
    // Reset all dot borders
    document.querySelectorAll('[id^="color-dot-"]').forEach(el => {
      el.style.border = '2px solid transparent';
      el.style.boxShadow = 'none';
    });
    const dot = document.getElementById('color-dot-' + hex.replace('#',''));
    if (dot) { dot.style.border = '2px solid white'; dot.style.boxShadow = `0 0 0 2px ${hex}`; }
  },

  _shiftHours(start, end) {
    if (!start || !end) return '—';
    const [sh,sm] = start.split(':').map(Number);
    const [eh,em] = end.split(':').map(Number);
    let diff = (eh*60+em) - (sh*60+sm);
    if (diff <= 0) diff += 24*60;
    const h = Math.floor(diff/60), m = diff%60;
    if (currentLang === 'en') return m ? `${h}h ${m}m` : `${h}h`;
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

    const { type } = this._detectType(shObj.start);
    const color = shObj.color || this._detectType(shObj.start).color;

    if (id) {
      const s = DB.shifts.find(s => s.id === id);
      if (s) Object.assign(s, shObj, { type, color });
      App.toast(currentLang==='ar'?'تم تحديث الوردية':'Shift updated ✓', 'success');
    } else {
      DB.shifts.push({ id: DB.nextId('s'), ...shObj, type, color });
      App.toast(currentLang==='ar'?'تمت إضافة الوردية':'Shift added ✓', 'success');
    }

    DB.save();
    App.closeModal();
    this.render(document.getElementById('page-content'));
  },
};
