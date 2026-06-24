/* =========================================================
   PROFILE MODULE — Admin / User personal profile page
   ========================================================= */

const ProfileModule = {

  render(container) {
    const user    = App.state.user || {};
    const empRec  = DB.employees.find(e => e.email === user.email);
    const creds   = DB.adminCredentials;
    const colors  = [
      { id:'gradient-primary',   label:'بنفسجي',   hex:'#6366f1' },
      { id:'gradient-success',   label:'أخضر',     hex:'#10b981' },
      { id:'gradient-warning',   label:'برتقالي',  hex:'#f59e0b' },
      { id:'gradient-danger',    label:'أحمر',      hex:'#ef4444' },
      { id:'gradient-cyan',      label:'سيان',      hex:'#06b6d4' },
      { id:'gradient-indigo',    label:'نيلي',      hex:'#818cf8' },
      { id:'gradient-rose',      label:'وردي',      hex:'#ec4899' },
      { id:'gradient-secondary', label:'رمادي',    hex:'#8b5cf6' },
    ];
    const curColor = user.avatarColor || 'gradient-primary';

    // Login history from audit
    const loginLogs = DB.audit
      .filter(a => a.userId === (user.id || 'admin') && a.action.includes('دخول'))
      .slice(0, 5);

    container.innerHTML = `
      <div class="page-header">
        <div class="page-header-text">
          <h1>الملف الشخصي</h1>
          <p>بياناتك الشخصية وإعدادات الحساب</p>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:300px 1fr;gap:20px;align-items:start">

        <!-- Left: Avatar Card -->
        <div style="display:flex;flex-direction:column;gap:16px">
          <div class="card">
            <div class="card-body" style="text-align:center;padding:28px 20px">
              <div id="prof-avatar" class="avatar ${curColor}"
                style="width:90px;height:90px;font-size:32px;margin:0 auto 16px;border:4px solid var(--border)">
                ${user.avatar || user.name?.charAt(0) || '?'}
              </div>
              <div style="font-size:18px;font-weight:800;color:var(--text-primary);margin-bottom:4px" id="prof-name-display">${user.name || '—'}</div>
              <div style="font-size:13px;color:var(--text-muted);margin-bottom:4px">${user.position || 'مدير النظام'}</div>
              <div style="font-size:12px;color:var(--text-muted);font-family:var(--font-en)">${user.email || creds?.email || '—'}</div>

              <!-- Color picker -->
              <div style="margin-top:18px;border-top:1px solid var(--border);padding-top:14px">
                <div style="font-size:11px;font-weight:700;color:var(--text-muted);margin-bottom:10px">لون الأفاتار</div>
                <div style="display:flex;flex-wrap:wrap;gap:8px;justify-content:center">
                  ${colors.map(c => `
                    <div onclick="ProfileModule._pickColor('${c.id}', this)"
                      title="${c.label}"
                      style="width:28px;height:28px;border-radius:50%;background:${c.hex};cursor:pointer;
                             border:3px solid ${curColor===c.id?'var(--primary)':'transparent'};
                             transition:transform .15s;box-shadow:0 2px 6px ${c.hex}55"
                      onmouseover="this.style.transform='scale(1.2)'" onmouseout="this.style.transform='scale(1)'"
                      data-color="${c.id}">
                    </div>
                  `).join('')}
                </div>
              </div>
            </div>
          </div>

          <!-- Login history -->
          <div class="card">
            <div class="card-header"><h3><i class="fas fa-clock-rotate-left" style="color:var(--primary)"></i> آخر تسجيلات الدخول</h3></div>
            <div class="card-body" style="padding:8px">
              ${loginLogs.length ? loginLogs.map(l => `
                <div style="display:flex;align-items:center;gap:10px;padding:8px;border-radius:8px;margin-bottom:4px;background:var(--bg-input)">
                  <i class="fas fa-circle-check" style="color:var(--success);font-size:12px"></i>
                  <div style="flex:1">
                    <div style="font-size:12px;font-weight:600;color:var(--text-primary)">تسجيل دخول ناجح</div>
                    <div style="font-size:11px;color:var(--text-muted)">${new Date(l.time).toLocaleString(currentLang==='ar'?'ar-SA':'en-US')}</div>
                  </div>
                </div>
              `).join('') : `<p style="text-align:center;color:var(--text-muted);font-size:12px;padding:12px">لا توجد سجلات بعد</p>`}
            </div>
          </div>
        </div>

        <!-- Right: Edit Forms -->
        <div style="display:flex;flex-direction:column;gap:16px">

          <!-- Personal Info -->
          <div class="card">
            <div class="card-header"><h3><i class="fas fa-user-pen" style="color:var(--primary)"></i> البيانات الشخصية</h3></div>
            <div class="card-body">
              <div class="app-form-row">
                <div class="app-form-group">
                  <label>الاسم الكامل</label>
                  <input class="app-form-input" id="prof-name" type="text" value="${user.name || ''}" placeholder="الاسم الكامل">
                </div>
                <div class="app-form-group">
                  <label>المسمى الوظيفي</label>
                  <input class="app-form-input" id="prof-position" type="text" value="${user.position || 'مدير النظام'}" placeholder="المسمى الوظيفي">
                </div>
              </div>
              <div class="app-form-row">
                <div class="app-form-group">
                  <label>البريد الإلكتروني</label>
                  <input class="app-form-input" id="prof-email" type="email" value="${user.email || creds?.email || ''}" readonly
                    style="opacity:.6;cursor:not-allowed" title="لا يمكن تعديل البريد الإلكتروني">
                </div>
                <div class="app-form-group">
                  <label>رقم الجوال</label>
                  <input class="app-form-input" id="prof-phone" type="tel" value="${empRec?.phone || ''}" placeholder="+966 5X XXX XXXX" dir="ltr">
                </div>
              </div>
              <button class="btn btn-primary" onclick="ProfileModule.saveInfo()">
                <i class="fas fa-save"></i> حفظ البيانات
              </button>
            </div>
          </div>

          <!-- Change Password -->
          <div class="card">
            <div class="card-header"><h3><i class="fas fa-lock" style="color:var(--warning)"></i> تغيير كلمة المرور</h3></div>
            <div class="card-body">
              <div class="app-form-row">
                <div class="app-form-group">
                  <label>كلمة المرور الحالية</label>
                  <div class="input-wrapper">
                    <input class="app-form-input" id="prof-old-pass" type="password" placeholder="••••••••">
                    <button type="button" class="input-icon-right btn-icon" onclick="App.togglePasswordVisibility(this)" style="top:50%;transform:translateY(-50%)"><i class="fas fa-eye"></i></button>
                  </div>
                </div>
              </div>
              <div class="app-form-row">
                <div class="app-form-group">
                  <label>كلمة المرور الجديدة</label>
                  <div class="input-wrapper">
                    <input class="app-form-input" id="prof-new-pass" type="password" placeholder="8 أحرف على الأقل">
                    <button type="button" class="input-icon-right btn-icon" onclick="App.togglePasswordVisibility(this)" style="top:50%;transform:translateY(-50%)"><i class="fas fa-eye"></i></button>
                  </div>
                </div>
                <div class="app-form-group">
                  <label>تأكيد كلمة المرور الجديدة</label>
                  <div class="input-wrapper">
                    <input class="app-form-input" id="prof-confirm-pass" type="password" placeholder="••••••••">
                    <button type="button" class="input-icon-right btn-icon" onclick="App.togglePasswordVisibility(this)" style="top:50%;transform:translateY(-50%)"><i class="fas fa-eye"></i></button>
                  </div>
                </div>
              </div>
              <button class="btn btn-warning" onclick="ProfileModule.changePassword()">
                <i class="fas fa-key"></i> تغيير كلمة المرور
              </button>
            </div>
          </div>

          <!-- Account Stats -->
          <div class="card">
            <div class="card-header"><h3><i class="fas fa-chart-simple" style="color:var(--success)"></i> إحصائيات الحساب</h3></div>
            <div class="card-body">
              <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px">
                ${[
                  { label:'إجمالي الموظفين', val: DB.employees.filter(e=>e.status!=='terminated').length, icon:'fas fa-users', color:'gradient-primary' },
                  { label:'سجلات الحضور',     val: DB.attendance.length,   icon:'fas fa-clock',      color:'gradient-success' },
                  { label:'الإجازات المعلقة', val: DB.leaves.filter(l=>l.status==='pending').length, icon:'fas fa-calendar', color:'gradient-warning' },
                ].map(s => `
                  <div style="text-align:center;padding:16px;border-radius:12px;background:var(--bg-input)">
                    <div class="stat-icon ${s.color}" style="width:38px;height:38px;font-size:15px;margin:0 auto 8px"><i class="${s.icon}"></i></div>
                    <div style="font-size:22px;font-weight:800;color:var(--text-primary)">${s.val}</div>
                    <div style="font-size:11px;color:var(--text-muted)">${s.label}</div>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>

        </div>
      </div>
    `;
  },

  _pickColor(colorId, el) {
    // Update selection UI
    el.closest('div').querySelectorAll('[data-color]').forEach(d => d.style.border = '3px solid transparent');
    el.style.border = '3px solid var(--primary)';

    // Update avatar
    const avatar = document.getElementById('prof-avatar');
    if (avatar) {
      avatar.className = `avatar ${colorId}`;
      avatar.style.cssText = 'width:90px;height:90px;font-size:32px;margin:0 auto 16px;border:4px solid var(--border)';
    }

    // Save
    const user = App.state.user;
    if (user) {
      user.avatarColor = colorId;
      user.avatar = user.avatar || user.name?.charAt(0) || '?';
      sessionStorage.setItem('app-user', JSON.stringify(user));
      App._updateUserUI();
    }
    if (DB.adminCredentials) DB.adminCredentials.avatarColor = colorId;

    // Update profile snapshot
    try {
      const sp = JSON.parse(localStorage.getItem('attendify-user-profile') || '{}');
      sp.avatarColor = colorId;
      sp.savedAt = Date.now();
      localStorage.setItem('attendify-user-profile', JSON.stringify(sp));
      DB._saveToLocal();
      localStorage.setItem('attendify-sync-ts', String(Date.now()));
    } catch(_) {}

    App.toast('تم تحديث لون الأفاتار ✓', 'success');
  },

  saveInfo() {
    const name     = document.getElementById('prof-name')?.value.trim();
    const position = document.getElementById('prof-position')?.value.trim();
    const phone    = document.getElementById('prof-phone')?.value.trim();

    if (!name) { App.toast('يرجى إدخال الاسم', 'error'); return; }

    const user = App.state.user;
    if (user) {
      user.name     = name;
      user.avatar   = name.charAt(0).toUpperCase();
      user.position = position || user.position;
    }

    // Update admin credentials
    if (DB.adminCredentials) {
      DB.adminCredentials.name     = name;
      DB.adminCredentials.position = position;
    }

    // Update employee record if exists
    const empRec = DB.employees.find(e => e.email === (user?.email || DB.adminCredentials?.email));
    if (empRec) {
      empRec.name  = name;
      empRec.phone = phone;
    }

    // Save complete profile snapshot (includes all fields needed to restore state.user)
    const profileSnap = {
      id:          user?.id || 'admin',
      name,
      avatar:      name.charAt(0).toUpperCase(),
      position,
      phone,
      email:       user?.email || DB.adminCredentials?.email,
      avatarColor: user?.avatarColor || 'gradient-primary',
      savedAt:     Date.now(),
    };
    try {
      localStorage.setItem('attendify-user-profile', JSON.stringify(profileSnap));
      DB._saveToLocal();
      // Stamp sync-ts to NOW so loadAll() knows local is up-to-date
      localStorage.setItem('attendify-sync-ts', String(Date.now()));
    } catch(_) {}

    // Keep session in sync
    if (user) sessionStorage.setItem('app-user', JSON.stringify(user));

    // Update Supabase user metadata if connected
    if (typeof SupabaseDB !== 'undefined' && SupabaseDB.isConnected && SupabaseDB._client) {
      SupabaseDB._client.auth.updateUser({ data: { name, position } }).catch(() => {});
    }

    App._updateUserUI();
    const nameDisp = document.getElementById('prof-name-display');
    if (nameDisp) nameDisp.textContent = name;

    App.toast('تم حفظ البيانات الشخصية ✓', 'success');
  },

  async changePassword() {
    const oldPass  = document.getElementById('prof-old-pass')?.value;
    const newPass  = document.getElementById('prof-new-pass')?.value;
    const confirm  = document.getElementById('prof-confirm-pass')?.value;

    if (!oldPass || !newPass || !confirm) { App.toast('يرجى ملء جميع الحقول', 'error'); return; }

    // Verify old password (supports hashed and legacy plaintext)
    const stored = DB.adminCredentials.password || '';
    let oldMatch = false;
    if (stored.startsWith('sha256:')) {
      oldMatch = ('sha256:' + await _sha256(oldPass)) === stored;
    } else {
      oldMatch = oldPass === stored;
    }
    if (!oldMatch) { App.toast('كلمة المرور الحالية غير صحيحة', 'error'); return; }
    if (newPass.length < 8) { App.toast('يجب أن تكون كلمة المرور 8 أحرف على الأقل', 'error'); return; }
    if (newPass !== confirm) { App.toast('كلمتا المرور الجديدتان غير متطابقتين', 'error'); return; }

    DB.adminCredentials.password = 'sha256:' + (await _sha256(newPass));
    DB._saveToLocal();
    DB.logAudit(App.state.user?.id || 'admin', 'تغيير كلمة المرور', 'الملف الشخصي', 'تم تغيير كلمة المرور بنجاح');

    document.getElementById('prof-old-pass').value     = '';
    document.getElementById('prof-new-pass').value     = '';
    document.getElementById('prof-confirm-pass').value = '';

    App.toast('تم تغيير كلمة المرور بنجاح ✓', 'success');
  },
};
