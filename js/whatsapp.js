/* =========================================================
   ATTENDIFY PRO — WhatsApp Module v2.0
   إرسال تلقائي عبر UltraMsg API
   فولباك: wa.me إذا لم يُضبط الـ API
   ========================================================= */

const WhatsApp = {

  // ─── CONFIG ──────────────────────────────────────────────
  config: {
    provider:   'ultramsg',   // 'ultramsg' | 'wame' (fallback)
    instanceId: '',           // من ultramsg.com
    token:      '',           // من ultramsg.com
    enabled:    true,
  },

  // ─── TEMPLATES ───────────────────────────────────────────
  templates: {
    absence: {
      label: 'غياب',
      icon:  'fas fa-user-slash',
      color: '#ef4444',
      text:  'عزيزي/عزيزتي {name}،\nتم رصد غيابك عن العمل بتاريخ {date}.\nيُرجى التواصل مع الإدارة لتوضيح السبب.\n\nإدارة الموارد البشرية — {company}',
    },
    late: {
      label: 'تأخر',
      icon:  'fas fa-clock',
      color: '#f59e0b',
      text:  'عزيزي/عزيزتي {name}،\nتم رصد تأخرك في الحضور بتاريخ {date} بمقدار {minutes} دقيقة.\nيُرجى الالتزام بمواعيد الدوام الرسمية.\n\nإدارة الموارد البشرية — {company}',
    },
    checkin: {
      label: 'تسجيل حضور',
      icon:  'fas fa-user-check',
      color: '#10b981',
      text:  'عزيزي/عزيزتي {name}،\nتم تسجيل حضورك بنجاح الساعة {time} بتاريخ {date}.\n\nإدارة الموارد البشرية — {company}',
    },
    checkout: {
      label: 'تسجيل انصراف',
      icon:  'fas fa-sign-out-alt',
      color: '#6366f1',
      text:  'عزيزي/عزيزتي {name}،\nتم تسجيل انصرافك الساعة {time} بتاريخ {date}.\nإجمالي ساعات العمل: {hours}.\n\nإدارة الموارد البشرية — {company}',
    },
    warning: {
      label: 'إنذار',
      icon:  'fas fa-triangle-exclamation',
      color: '#ef4444',
      text:  'عزيزي/عزيزتي {name}،\nنودّ إشعارك بصدور إنذار رسمي بحقك بتاريخ {date}.\nيُرجى مراجعة الإدارة في أقرب وقت.\n\nإدارة الموارد البشرية — {company}',
    },
    leaveApproved: {
      label: 'موافقة إجازة',
      icon:  'fas fa-calendar-check',
      color: '#10b981',
      text:  'عزيزي/عزيزتي {name}،\nتمت الموافقة على طلب إجازتك من {from} إلى {to} ({days} أيام).\nنتمنى لك إجازة سعيدة.\n\nإدارة الموارد البشرية — {company}',
    },
    leaveRejected: {
      label: 'رفض إجازة',
      icon:  'fas fa-calendar-xmark',
      color: '#ef4444',
      text:  'عزيزي/عزيزتي {name}،\nنأسف لإبلاغك بأنه تم رفض طلب إجازتك من {from} إلى {to}.\nللاستفسار يُرجى التواصل مع الإدارة.\n\nإدارة الموارد البشرية — {company}',
    },
    requestApproved: {
      label: 'موافقة طلب',
      icon:  'fas fa-circle-check',
      color: '#10b981',
      text:  'عزيزي/عزيزتي {name}،\nتمت الموافقة على طلبك المقدّم بتاريخ {date}.\n\nإدارة الموارد البشرية — {company}',
    },
    requestRejected: {
      label: 'رفض طلب',
      icon:  'fas fa-circle-xmark',
      color: '#ef4444',
      text:  'عزيزي/عزيزتي {name}،\nنأسف لإبلاغك بأنه تم رفض طلبك المقدّم بتاريخ {date}.\nللاستفسار يُرجى التواصل مع الإدارة.\n\nإدارة الموارد البشرية — {company}',
    },
    salaryReady: {
      label: 'راتب جاهز',
      icon:  'fas fa-money-bill-wave',
      color: '#6366f1',
      text:  'عزيزي/عزيزتي {name}،\nيسعدنا إبلاغك بأن راتب شهر {month} قد تم صرفه.\n\n💰 الراتب الأساسي: {base} ريال\n➖ الخصومات: {deductions} ريال\n{deductionDetails}\n\n✅ صافي الراتب: {amount} ريال\n\nإدارة الموارد البشرية — {company}',
    },
    credentials: {
      label: 'بيانات الدخول',
      icon:  'fas fa-key',
      color: '#6366f1',
      text:  '🔐 *بيانات دخول بوابة الموظفين*\n\nأهلاً {name}،\nفيما يلي بيانات دخولك إلى بوابة الموظفين:\n\n👤 *كود الموظف:* {empNo}\n🔑 *كلمة المرور:* {password}\n🌐 *رابط الدخول:* {link}\n\nيُرجى الحفاظ على سرية بيانات دخولك.\n\nإدارة الموارد البشرية — {company}',
    },
  },

  // ─── INIT ─────────────────────────────────────────────────
  init() {
    // استرجاع إعدادات API المحفوظة
    try {
      const savedCfg = JSON.parse(localStorage.getItem('wa-config') || '{}');
      if (savedCfg.instanceId) Object.assign(this.config, savedCfg);
    } catch(e) {}

    // استرجاع القوالب المعدّلة
    try {
      const savedTpl = JSON.parse(localStorage.getItem('wa-templates') || '{}');
      if (Object.keys(savedTpl).length) Object.assign(this.templates, savedTpl);
    } catch(e) {}
  },

  // ─── هل API مضبوط؟ ───────────────────────────────────────
  isApiReady() {
    return !!(this.config.instanceId && this.config.token && this.config.enabled);
  },

  // ─── FORMAT PHONE ─────────────────────────────────────────
  formatPhone(phone) {
    if (!phone) return null;
    let p = phone.replace(/\D/g, '');
    if (p.startsWith('01') && p.length === 11) return '2' + p;
    if (p.startsWith('05') && p.length === 10) return '966' + p.slice(1);
    if (p.startsWith('05') && p.length === 9)  return '971' + p.slice(1);
    if (p.startsWith('00')) return p.slice(2);
    return p;
  },

  // ─── FILL TEMPLATE ────────────────────────────────────────
  fill(text, data) {
    return text.replace(/\{(\w+)\}/g, (_, k) => data[k] !== undefined ? data[k] : '');
  },

  // ─── DATA HELPER ─────────────────────────────────────────
  _data(emp, extra = {}) {
    const now     = new Date();
    const payroll = DB.payroll?.find(p => p.empId === emp?.id);
    const fmt     = n => Number(n||0).toLocaleString('ar-EG');

    // الخصومات المفصلة
    const absentDed  = payroll?.absentDeduction || 0;
    const lateDed    = payroll?.lateDeduction    || 0;
    const customDed  = payroll?.customDeduction  || 0;
    const totalDed   = absentDed + lateDed + customDed;

    // بناء سطر تفاصيل الخصومات (فقط غير الصفرية)
    const dedLines = [];
    if (absentDed  > 0) dedLines.push(`   • غياب (${payroll.absentDays} أيام): ${fmt(absentDed)} ريال`);
    if (lateDed    > 0) dedLines.push(`   • تأخير: ${fmt(lateDed)} ريال`);
    if (customDed  > 0) dedLines.push(`   • خصومات أخرى: ${fmt(customDed)} ريال`);

    const netSalary = payroll?.total ?? (payroll?.base || emp?.salary || 0);

    return {
      name:             emp.name,
      date:             now.toLocaleDateString('ar-EG', { year:'numeric', month:'long', day:'numeric' }),
      month:            now.toLocaleString('ar-EG', { month: 'long' }) + ' ' + now.getFullYear(),
      time:             now.toLocaleTimeString('ar-EG', { hour:'2-digit', minute:'2-digit' }),
      company:          DB.company.name || 'الشركة',
      amount:           fmt(netSalary),
      base:             fmt(payroll?.base || emp?.salary || 0),
      deductions:       fmt(totalDed),
      absentDays:       payroll?.absentDays || 0,
      absentDeduction:  fmt(absentDed),
      lateDeduction:    fmt(lateDed),
      customDeduction:  fmt(customDed),
      deductionDetails: dedLines.length ? dedLines.join('\n') : '   • لا توجد خصومات',
      ...extra,
    };
  },

  // ═══════════════════════════════════════════════════════════
  //  الإرسال الأساسي
  // ═══════════════════════════════════════════════════════════

  // إرسال تلقائي — UltraMsg API أو فتح wa.me
  async send(phone, message) {
    if (!phone) {
      console.warn('[WA] رقم هاتف غير موجود');
      return false;
    }
    const formatted = this.formatPhone(phone);
    if (!formatted) return false;

    if (this.isApiReady()) {
      return this._sendUltraMsg(formatted, message);
    } else {
      // fallback: فتح wa.me يدوياً
      return this._openWaMe(formatted, message);
    }
  },

  // ─── UltraMsg API ────────────────────────────────────────
  async _sendUltraMsg(phone, message) {
    const url = `https://api.ultramsg.com/${this.config.instanceId}/messages/chat`;
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          token: this.config.token,
          to:    phone,
          body:  message,
        }),
      });
      const json = await res.json();
      const ok = json?.sent === 'true' || json?.sent === true || !!json?.id;
      if (ok) {
        console.log(`[WA] ✅ أُرسلت إلى ${phone}`);
      } else {
        console.warn(`[WA] ⚠️ فشل الإرسال إلى ${phone}:`, json);
      }
      return ok;
    } catch (err) {
      console.error('[WA] خطأ في الاتصال بـ UltraMsg:', err);
      return false;
    }
  },

  // ─── wa.me fallback ───────────────────────────────────────
  _openWaMe(phone, message) {
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    return true;
  },

  // ═══════════════════════════════════════════════════════════
  //  اختصارات الإشعارات التلقائية
  // ═══════════════════════════════════════════════════════════

  async notifyCheckin(emp, att) {
    if (!this.config.enabled) return;
    const msg = this.fill(this.templates.checkin.text, this._data(emp, {
      time: att?.checkIn || '',
    }));
    return this.send(emp.phone, msg);
  },

  async notifyCheckout(emp, att) {
    if (!this.config.enabled) return;
    const hoursWorked = this._calcHours(att?.checkIn, att?.checkOut);
    const msg = this.fill(this.templates.checkout.text, this._data(emp, {
      time:  att?.checkOut || '',
      hours: hoursWorked,
    }));
    return this.send(emp.phone, msg);
  },

  async notifyAbsence(emp) {
    if (!this.config.enabled) return;
    const msg = this.fill(this.templates.absence.text, this._data(emp));
    return this.send(emp.phone, msg);
  },

  async notifyLate(emp, att) {
    if (!this.config.enabled) return;
    const msg = this.fill(this.templates.late.text, this._data(emp, {
      minutes: att?.lateMinutes || att?.lateMin || '?',
    }));
    return this.send(emp.phone, msg);
  },

  async notifyWarning(emp) {
    if (!this.config.enabled) return;
    const msg = this.fill(this.templates.warning.text, this._data(emp));
    return this.send(emp.phone, msg);
  },

  async notifyLeaveApproved(emp, leave) {
    if (!this.config.enabled) return;
    const msg = this.fill(this.templates.leaveApproved.text, this._data(emp, {
      from: App.formatDate(leave.from),
      to:   App.formatDate(leave.to),
      days: leave.days || '',
    }));
    return this.send(emp.phone, msg);
  },

  async notifyLeaveRejected(emp, leave) {
    if (!this.config.enabled) return;
    const msg = this.fill(this.templates.leaveRejected.text, this._data(emp, {
      from: App.formatDate(leave.from),
      to:   App.formatDate(leave.to),
    }));
    return this.send(emp.phone, msg);
  },

  async notifyRequestApproved(emp, req) {
    if (!this.config.enabled) return;
    const msg = this.fill(this.templates.requestApproved.text, this._data(emp, {
      date: App.formatDate(req.date || req.createdAt),
    }));
    return this.send(emp.phone, msg);
  },

  async notifyRequestRejected(emp, req) {
    if (!this.config.enabled) return;
    const msg = this.fill(this.templates.requestRejected.text, this._data(emp, {
      date: App.formatDate(req.date || req.createdAt),
    }));
    return this.send(emp.phone, msg);
  },

  async notifySalary(emp, amount) {
    if (!this.config.enabled) return;
    const msg = this.fill(this.templates.salaryReady.text, this._data(emp, {
      amount: amount ? Number(amount).toLocaleString('ar-EG') : undefined,
    }));
    return this.send(emp.phone, msg);
  },

  // ─── إرسال بيانات الدخول ──────────────────────────────────
  async sendCredentials(emp) {
    if (!emp.phone) {
      App.toast('لا يوجد رقم هاتف لهذا الموظف', 'error');
      return false;
    }
    const link     = window.location.origin + '/employee.html';
    const password = emp.password || emp.no;
    const msg = this.fill(this.templates.credentials.text, this._data(emp, {
      empNo:    emp.no,
      password,
      link,
    }));
    const ok = await this.send(emp.phone, msg);
    if (ok && this.isApiReady()) App.toast(`تم إرسال بيانات الدخول إلى ${emp.name}`, 'success');
    return ok;
  },

  // ─── حساب ساعات العمل ─────────────────────────────────────
  _calcHours(checkIn, checkOut) {
    if (!checkIn || !checkOut) return '—';
    try {
      const [ih, im] = checkIn.split(':').map(Number);
      const [oh, om] = checkOut.split(':').map(Number);
      const totalMin = (oh * 60 + om) - (ih * 60 + im);
      if (totalMin <= 0) return '—';
      const h = Math.floor(totalMin / 60);
      const m = totalMin % 60;
      return `${h}:${String(m).padStart(2, '0')} ساعة`;
    } catch { return '—'; }
  },

  // ═══════════════════════════════════════════════════════════
  //  شاشة إعدادات UltraMsg (تُستدعى من settings.js)
  // ═══════════════════════════════════════════════════════════

  renderApiSettings() {
    const ready = this.isApiReady();
    return `
      <div class="card" style="margin-top:20px">
        <div class="card-header">
          <h3><i class="fab fa-whatsapp" style="color:#25d366"></i> إعدادات واتساب التلقائي</h3>
          <span class="badge ${ready ? 'badge-success' : 'badge-warning'}">
            ${ready ? '✅ API مفعّل — إرسال تلقائي' : '⚠️ يدوي — API غير مضبوط'}
          </span>
        </div>
        <div class="card-body">

          <div class="info-box info-box-primary" style="margin-bottom:18px">
            <i class="fas fa-circle-info"></i>
            <div>
              للإرسال التلقائي بدون أي تدخل، سجّل في
              <strong>UltraMsg.com</strong> (يبدأ من ~15$/شهر)،
              ثم أدخل بيانات الـ Instance أدناه.
              <br>بدون هذه البيانات النظام يفتح واتساب يدوياً.
            </div>
          </div>

          <div class="grid-2" style="gap:14px">
            <div class="app-form-group">
              <label>Instance ID <span style="color:var(--text-muted);font-size:11px">(من لوحة UltraMsg)</span></label>
              <input id="wa-instance-id" class="app-form-input" type="text"
                     placeholder="مثال: instance12345"
                     value="${this.config.instanceId || ''}">
            </div>
            <div class="app-form-group">
              <label>Token <span style="color:var(--text-muted);font-size:11px">(من لوحة UltraMsg)</span></label>
              <input id="wa-token" class="app-form-input" type="password"
                     placeholder="الـ Token السري"
                     value="${this.config.token || ''}">
            </div>
          </div>

          <div class="app-form-group">
            <label style="display:flex;align-items:center;gap:10px;cursor:pointer">
              <div class="toggle-switch ${this.config.enabled ? 'on' : ''}"
                   id="wa-enabled-toggle"
                   onclick="this.classList.toggle('on')"></div>
              <span>تفعيل إشعارات واتساب التلقائية</span>
            </label>
          </div>

          <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:8px">
            <button class="btn btn-primary" onclick="WhatsApp.saveApiConfig()">
              <i class="fas fa-save"></i> حفظ الإعدادات
            </button>
            <button class="btn btn-secondary" onclick="WhatsApp.testApi()">
              <i class="fas fa-paper-plane"></i> اختبار الإرسال
            </button>
            <button class="btn btn-danger" onclick="WhatsApp.clearApiConfig()">
              <i class="fas fa-trash"></i> مسح البيانات
            </button>
          </div>

          ${ready ? `
          <div class="info-box info-box-success" style="margin-top:14px">
            <i class="fas fa-check-circle"></i>
            <div>
              الإرسال التلقائي مفعّل — الرسائل ترسل فوراً عند:
              تسجيل حضور/انصراف · الغياب · التأخر · موافقة/رفض إجازة أو طلب · صرف راتب
            </div>
          </div>` : ''}

        </div>
      </div>

      <!-- قوالب الرسائل -->
      <div class="card" style="margin-top:16px">
        <div class="card-header">
          <h3><i class="fas fa-message" style="color:var(--primary)"></i> قوالب الرسائل</h3>
          <button class="btn btn-primary btn-sm" onclick="WhatsApp.saveTemplates()">
            <i class="fas fa-save"></i> حفظ القوالب
          </button>
        </div>
        <div class="card-body">
          <p style="font-size:12px;color:var(--text-muted);margin-bottom:16px">
            المتغيرات المتاحة: <code>{name}</code> <code>{date}</code> <code>{time}</code>
            <code>{company}</code> <code>{minutes}</code> <code>{from}</code> <code>{to}</code>
            <code>{days}</code> <code>{amount}</code> <code>{hours}</code>
          </p>
          ${Object.entries(this.templates).map(([key, tpl]) => `
            <div class="app-form-group">
              <label style="display:flex;align-items:center;gap:8px">
                <span style="width:10px;height:10px;border-radius:50%;background:${tpl.color};display:inline-block"></span>
                <i class="${tpl.icon}" style="color:${tpl.color};width:16px"></i>
                ${tpl.label}
              </label>
              <textarea id="wa-tpl-${key}" class="app-form-input" rows="3"
                        style="font-size:12.5px;line-height:1.7;resize:vertical">${tpl.text}</textarea>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  },

  // ─── حفظ إعدادات API ─────────────────────────────────────
  saveApiConfig() {
    const instanceId = document.getElementById('wa-instance-id')?.value?.trim();
    const token      = document.getElementById('wa-token')?.value?.trim();
    const enabled    = document.getElementById('wa-enabled-toggle')?.classList.contains('on');

    this.config.instanceId = instanceId;
    this.config.token      = token;
    this.config.enabled    = enabled;

    localStorage.setItem('wa-config', JSON.stringify({
      instanceId, token, enabled,
    }));

    App.toast(
      instanceId && token
        ? '✅ تم حفظ إعدادات UltraMsg — الإرسال التلقائي مفعّل'
        : '💾 تم الحفظ — الإرسال يدوي (لا يوجد API)',
      instanceId && token ? 'success' : 'info'
    );

    // إعادة رسم الإعدادات لتحديث الـ badge
    if (typeof SettingsModule !== 'undefined') {
      const sec = document.getElementById('wa-api-section');
      if (sec) sec.innerHTML = this.renderApiSettings();
    }
  },

  // ─── اختبار الـ API ───────────────────────────────────────
  async testApi() {
    const instanceId = document.getElementById('wa-instance-id')?.value?.trim();
    const token      = document.getElementById('wa-token')?.value?.trim();

    if (!instanceId || !token) {
      App.toast('أدخل Instance ID و Token أولاً', 'warning');
      return;
    }

    // أرسل رسالة اختبار لأول موظف لديه رقم
    const testEmp = DB.employees.find(e => e.phone);
    if (!testEmp) {
      App.toast('لا يوجد موظف لديه رقم هاتف لاختبار الإرسال', 'warning');
      return;
    }

    App.toast('⏳ جارٍ إرسال رسالة اختبار...', 'info');
    const url = `https://api.ultramsg.com/${instanceId}/messages/chat`;
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          token,
          to:   this.formatPhone(testEmp.phone),
          body: `🔔 اختبار Attendify Pro\nتم الاتصال بـ UltraMsg بنجاح.\nالوقت: ${new Date().toLocaleTimeString('ar-EG')}`,
        }),
      });
      const json = await res.json();
      const ok = json?.sent === 'true' || json?.sent === true || !!json?.id;
      App.toast(
        ok ? `✅ تم الإرسال إلى ${testEmp.name} (${testEmp.phone})` : `❌ فشل الإرسال: ${JSON.stringify(json)}`,
        ok ? 'success' : 'error'
      );
    } catch(err) {
      App.toast('❌ خطأ في الاتصال: ' + err.message, 'error');
    }
  },

  // ─── مسح الإعدادات ───────────────────────────────────────
  clearApiConfig() {
    this.config.instanceId = '';
    this.config.token      = '';
    localStorage.removeItem('wa-config');
    document.getElementById('wa-instance-id').value = '';
    document.getElementById('wa-token').value       = '';
    App.toast('تم مسح إعدادات UltraMsg — الإرسال يدوي الآن', 'info');
    const sec = document.getElementById('wa-api-section');
    if (sec) sec.innerHTML = this.renderApiSettings();
  },

  // ─── حفظ القوالب ─────────────────────────────────────────
  saveTemplates() {
    const updated = {};
    Object.keys(this.templates).forEach(key => {
      const el = document.getElementById(`wa-tpl-${key}`);
      if (el) updated[key] = { ...this.templates[key], text: el.value };
    });
    Object.assign(this.templates, updated);
    localStorage.setItem('wa-templates', JSON.stringify(this.templates));
    App.toast('✅ تم حفظ القوالب', 'success');
  },

  // ═══════════════════════════════════════════════════════════
  //  Compose Modal (إرسال فردي)
  // ═══════════════════════════════════════════════════════════

  openCompose(empId) {
    const emp = DB.getEmployee(empId);
    if (!emp) return;

    const tplOptions = Object.entries(this.templates).map(([k, v]) =>
      `<option value="${k}">${v.label}</option>`
    ).join('');

    const apiMode = this.isApiReady();

    App.openModal(`واتساب — ${emp.name}`, `
      <div style="display:flex;align-items:center;gap:10px;padding:12px;background:var(--bg-input);border-radius:12px;margin-bottom:16px">
        <div class="avatar ${emp.avatarColor}" style="width:38px;height:38px;font-size:14px">${emp.avatar}</div>
        <div>
          <div style="font-weight:700;font-size:13px">${emp.name}</div>
          <div style="font-size:12px;color:var(--text-muted)">${emp.phone || 'لا يوجد رقم'}</div>
        </div>
        <div style="margin-right:auto;display:flex;flex-direction:column;gap:4px;align-items:flex-end">
          ${emp.phone
            ? `<span class="badge badge-success badge-dot">رقم متاح</span>`
            : `<span class="badge badge-danger">⚠️ لا يوجد رقم</span>`}
          <span class="badge ${apiMode ? 'badge-success' : 'badge-warning'}" style="font-size:10px">
            ${apiMode ? '🚀 إرسال تلقائي' : '🔗 فتح واتساب يدوياً'}
          </span>
        </div>
      </div>

      ${!emp.phone ? `
        <div class="info-box info-box-warning" style="margin-bottom:14px">
          <i class="fas fa-triangle-exclamation"></i>
          <div>لم يُضف رقم هاتف لهذا الموظف — يُرجى تحديث ملف الموظف أولاً</div>
        </div>` : ''}

      <div class="app-form-group">
        <label>قالب الرسالة</label>
        <select class="app-form-input app-form-select" onchange="WhatsApp._previewTemplate(this.value,'${empId}')">
          <option value="">— اختر قالباً —</option>
          ${tplOptions}
          <option value="custom">✏️ رسالة مخصصة</option>
        </select>
      </div>

      <div class="app-form-group">
        <label>نص الرسالة</label>
        <textarea id="wa-msg-text" class="app-form-input" rows="6"
                  style="resize:vertical;font-size:13px;line-height:1.7"
                  placeholder="اكتب رسالتك هنا..."></textarea>
      </div>

      <div style="display:flex;gap:10px;justify-content:flex-end">
        <button class="btn btn-secondary" onclick="App.closeModal()">إلغاء</button>
        <button class="btn" style="background:#25d366;color:white;border:none"
                onclick="WhatsApp._sendCompose('${empId}')"
                ${!emp.phone ? 'disabled style="opacity:.5"' : ''}>
          <i class="fab fa-whatsapp"></i>
          ${apiMode ? 'إرسال الآن' : 'فتح واتساب'}
        </button>
      </div>
    `);
  },

  _previewTemplate(key, empId) {
    const ta = document.getElementById('wa-msg-text');
    if (!ta || !key || key === 'custom') { if (ta && key === 'custom') ta.value = ''; return; }
    const tpl = this.templates[key];
    if (!tpl) return;
    const emp = DB.getEmployee(empId);
    ta.value = this.fill(tpl.text, this._data(emp || { name: '—', phone: '' }));
  },

  async _sendCompose(empId) {
    const emp = DB.getEmployee(empId);
    const msg = document.getElementById('wa-msg-text')?.value?.trim();
    if (!msg) { App.toast('اكتب الرسالة أولاً', 'warning'); return; }
    App.closeModal();
    const ok = await this.send(emp.phone, msg);
    if (ok) {
      DB.logAudit(App.state.user?.id || 'admin', 'إرسال واتساب', 'التنبيهات', `إرسال رسالة إلى ${emp.name}`);
      App.toast(`✅ تم الإرسال إلى ${emp.name}`, 'success');
    }
  },

  // ═══════════════════════════════════════════════════════════
  //  Bulk Compose (إرسال جماعي)
  // ═══════════════════════════════════════════════════════════

  openBulkCompose(empIds, defaultType = '') {
    const emps        = empIds.map(id => DB.getEmployee(id)).filter(Boolean);
    const withPhone   = emps.filter(e => e.phone);
    const noPhone     = emps.filter(e => !e.phone);
    const apiMode     = this.isApiReady();

    const tplOptions = Object.entries(this.templates).map(([k, v]) =>
      `<option value="${k}" ${k === defaultType ? 'selected' : ''}>${v.label}</option>`
    ).join('');

    App.openModal('إرسال جماعي — واتساب', `
      <div style="display:flex;gap:10px;margin-bottom:16px">
        <div style="flex:1;padding:12px;background:var(--success-bg);border-radius:10px;text-align:center">
          <div style="font-size:22px;font-weight:800;color:var(--success)">${withPhone.length}</div>
          <div style="font-size:12px;color:var(--text-muted)">لديهم رقم</div>
        </div>
        <div style="flex:1;padding:12px;background:var(--danger-bg);border-radius:10px;text-align:center">
          <div style="font-size:22px;font-weight:800;color:var(--danger)">${noPhone.length}</div>
          <div style="font-size:12px;color:var(--text-muted)">بدون رقم</div>
        </div>
        <div style="flex:1;padding:12px;background:var(--primary-bg);border-radius:10px;text-align:center">
          <div style="font-size:22px;font-weight:800;color:var(--primary)">${emps.length}</div>
          <div style="font-size:12px;color:var(--text-muted)">إجمالي</div>
        </div>
      </div>

      ${noPhone.length ? `
      <div class="info-box info-box-warning" style="margin-bottom:12px">
        <i class="fas fa-triangle-exclamation"></i>
        <div>${noPhone.length} موظف بدون رقم: ${noPhone.map(e => e.name).join('، ')}</div>
      </div>` : ''}

      <div style="margin-bottom:12px;padding:10px 14px;background:${apiMode ? 'rgba(16,185,129,0.08)' : 'rgba(245,158,11,0.08)'};border:1.5px solid ${apiMode ? 'rgba(16,185,129,0.3)' : 'rgba(245,158,11,0.3)'};border-radius:10px;font-size:12px">
        <i class="${apiMode ? 'fas fa-rocket' : 'fab fa-whatsapp'}" style="color:${apiMode ? 'var(--success)' : '#25d366'}"></i>
        ${apiMode
          ? `<strong>إرسال تلقائي مفعّل</strong> — ستُرسل الرسائل لـ ${withPhone.length} موظف فوراً بدون تدخل`
          : `<strong>وضع يدوي</strong> — سيُفتح واتساب لكل موظف على حدة`}
      </div>

      <div class="app-form-group">
        <label>قالب الرسالة</label>
        <select class="app-form-input app-form-select" onchange="WhatsApp._previewBulkTemplate(this.value)">
          <option value="">— اختر قالباً —</option>
          ${tplOptions}
          <option value="custom">✏️ رسالة مخصصة</option>
        </select>
      </div>

      <div class="app-form-group">
        <label>نص الرسالة <span style="font-size:11px;color:var(--text-muted)">{name} يُستبدل باسم كل موظف تلقائياً</span></label>
        <textarea id="bulk-msg-text" class="app-form-input" rows="5"
                  style="font-size:13px;line-height:1.7">${defaultType && this.templates[defaultType] ? this.templates[defaultType].text : ''}</textarea>
      </div>

      <div style="display:flex;gap:10px;justify-content:flex-end">
        <button class="btn btn-secondary" onclick="App.closeModal()">إلغاء</button>
        <button class="btn" style="background:#25d366;color:white;border:none"
                onclick="WhatsApp._executeBulk(${JSON.stringify(empIds)})"
                ${!withPhone.length ? 'disabled' : ''}>
          <i class="${apiMode ? 'fas fa-paper-plane' : 'fab fa-whatsapp'}"></i>
          ${apiMode ? `إرسال لـ ${withPhone.length} موظف` : `فتح واتساب لـ ${withPhone.length} موظف`}
        </button>
      </div>
    `);
  },

  _previewBulkTemplate(key) {
    const ta = document.getElementById('bulk-msg-text');
    if (!ta || !key || key === 'custom') { if (ta && key === 'custom') ta.value = ''; return; }
    const tpl = this.templates[key];
    if (tpl) ta.value = tpl.text;
  },

  async _executeBulk(empIds) {
    const msg  = document.getElementById('bulk-msg-text')?.value?.trim();
    if (!msg) { App.toast('اكتب الرسالة أولاً', 'warning'); return; }
    App.closeModal();

    const emps = empIds.map(id => DB.getEmployee(id)).filter(e => e?.phone);
    if (!emps.length) { App.toast('لا يوجد موظفون لديهم رقم واتساب', 'error'); return; }

    if (this.isApiReady()) {
      // إرسال تلقائي متوازٍ مع تأخير بسيط لتجنب Rate Limit
      App.toast(`⏳ جارٍ إرسال ${emps.length} رسالة...`, 'info');
      let sent = 0;
      for (const emp of emps) {
        const filled = this.fill(msg, this._data(emp));
        const ok = await this._sendUltraMsg(this.formatPhone(emp.phone), filled);
        if (ok) sent++;
        await new Promise(r => setTimeout(r, 500)); // 500ms بين كل رسالة
      }
      App.toast(`✅ أُرسلت ${sent} من ${emps.length} رسالة بنجاح`, sent === emps.length ? 'success' : 'warning');
      DB.logAudit('admin', 'إرسال جماعي واتساب', 'التنبيهات', `${sent}/${emps.length} رسالة`);
    } else {
      // فتح wa.me يدوياً بالتسلسل
      let i = 0;
      const openNext = () => {
        if (i >= emps.length) {
          App.toast(`✅ تم فتح ${emps.length} محادثة واتساب`, 'success');
          return;
        }
        const emp = emps[i++];
        this._openWaMe(this.formatPhone(emp.phone), this.fill(msg, this._data(emp)));
        setTimeout(openNext, 1800);
      };
      App.toast(`جارٍ فتح ${emps.length} محادثة واتساب...`, 'info');
      openNext();
    }
  },
};

// Init on load
WhatsApp.init();
