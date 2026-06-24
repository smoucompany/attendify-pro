/* =========================================================
   NOTIFICATIONS MODULE — Full notification center
   ========================================================= */

const NotificationsModule = {
  _filter: 'all',

  render(container) {
    const unread = DB.notifications.filter(n => !n.read).length;

    container.innerHTML = `
      <div class="page-header">
        <div class="page-header-text">
          <h1>${t('notifications.title')}</h1>
          <p>${t('notifications.subtitle')} — ${unread} ${currentLang==='ar'?'غير مقروءة':'unread'}</p>
        </div>
        <div class="page-header-actions">
          <button class="btn btn-secondary" onclick="App.markAllRead()"><i class="fas fa-check-double"></i> ${t('notif.markAllRead')}</button>
          <button class="btn btn-danger" onclick="NotificationsModule.deleteAll()"><i class="fas fa-trash"></i> ${t('notifications.deleteAll')}</button>
        </div>
      </div>

      <!-- Channel Settings -->
      <div class="grid-3" style="margin-bottom:24px">
        ${[
          {icon:'fas fa-envelope',   color:'gradient-primary', name:'البريد الإلكتروني', nameEn:'Email',    status:true  },
          {icon:'fab fa-whatsapp',   color:'gradient-success', name:'واتساب',            nameEn:'WhatsApp', status:true  },
          {icon:'fas fa-mobile-alt', color:'gradient-cyan',    name:'رسائل SMS',         nameEn:'SMS',      status:false },
          {icon:'fas fa-desktop',    color:'gradient-indigo',  name:'إشعارات المتصفح',   nameEn:'Browser',  status:true  },
          {icon:'fas fa-bell',       color:'gradient-warning', name:'إشعارات التطبيق',   nameEn:'In-App',   status:true  },
          {icon:'fas fa-print',      color:'gradient-rose',    name:'تقارير تلقائية',    nameEn:'Auto Reports',status:false},
        ].map(ch => `
          <div class="card stagger-item">
            <div class="card-body" style="display:flex;align-items:center;gap:12px">
              <div class="stat-icon ${ch.color}" style="width:40px;height:40px;font-size:16px"><i class="${ch.icon}"></i></div>
              <div style="flex:1">
                <div style="font-size:13.5px;font-weight:600;color:var(--text-primary)">${currentLang==='ar'?ch.name:ch.nameEn}</div>
                <div style="font-size:11px;color:var(--text-muted)">${ch.status?(currentLang==='ar'?'مفعّل':'Active'):(currentLang==='ar'?'معطّل':'Disabled')}</div>
              </div>
              <div class="toggle-switch ${ch.status?'on':''}" onclick="this.classList.toggle('on'); NotificationsModule.saveChannelState('${ch.nameEn}',this.classList.contains('on'))"></div>
            </div>
          </div>
        `).join('')}
      </div>

      <!-- Filter Tabs + List -->
      <div class="card">
        <div class="card-header">
          <h3><i class="fas fa-bell" style="color:var(--primary)"></i> ${currentLang==='ar'?'جميع الإشعارات':'All Notifications'}</h3>
          <div class="notif-filter-tabs" style="padding:0;border:none">
            ${['all','attendance','leave','system'].map(f=>`
              <button class="notif-tab ${this._filter===f?'active':''}" onclick="NotificationsModule._filter='${f}'; NotificationsModule._renderList()">${t('notif.'+f)}</button>
            `).join('')}
          </div>
        </div>
        <div id="notif-full-list" style="padding:8px"></div>
      </div>
    `;

    this._renderList();
  },

  _renderList() {
    const container = document.getElementById('notif-full-list');
    if (!container) return;

    const notifs = this._filter === 'all'
      ? DB.notifications
      : DB.notifications.filter(n => n.type === this._filter);

    if (!notifs.length) {
      container.innerHTML = `<div class="empty-state"><div class="empty-icon"><i class="fas fa-bell-slash"></i></div><div class="empty-title">${t('common.noData')}</div></div>`;
      return;
    }

    const _typeLink = { leave:'leaves', attendance:'attendance', request:'requests', payroll:'payroll', loan:'loans', gratuity:'gratuity', employee:'employees', report:'reports', system:'dashboard' };
    container.innerHTML = notifs.map(n => {
      const link = n.link || _typeLink[n.type] || '';
      return `
      <div class="notif-item ${n.read?'':'unread'} stagger-item" style="margin-bottom:4px;cursor:${link?'pointer':'default'}" onclick="NotificationsModule.openNotif('${n.id}', this)">
        <div class="notif-icon ${n.iconBg}" style="color:white"><i class="${n.icon}"></i></div>
        <div class="notif-content">
          <div class="notif-title">${n.title}</div>
          <div class="notif-desc">${n.desc}</div>
          <div class="notif-time" style="display:flex;align-items:center;gap:8px">
            <span><i class="fas fa-clock" style="font-size:10px"></i> ${App.timeAgo(n.time)}</span>
            ${link ? `<span style="font-size:10px;color:var(--primary);font-weight:600"><i class="fas fa-arrow-left" style="font-size:9px"></i> ${NotificationsModule._pageName(link)}</span>` : ''}
          </div>
        </div>
        <div style="display:flex;flex-direction:column;gap:4px;align-items:flex-end;flex-shrink:0">
          ${!n.read ? `<span style="width:8px;height:8px;border-radius:50%;background:var(--primary);display:block"></span>` : ''}
          <button class="btn-icon btn btn-sm" onclick="event.stopPropagation(); NotificationsModule.deleteNotif('${n.id}', this.closest('.notif-item'))" style="color:var(--danger);width:28px;height:28px">
            <i class="fas fa-trash" style="font-size:11px"></i>
          </button>
        </div>
      </div>
    `}).join('');
  },

  _pageName(page) {
    const map = { leaves:'الإجازات', attendance:'الحضور', requests:'الطلبات', payroll:'الرواتب', loans:'السلف', gratuity:'نهاية الخدمة', employees:'الموظفون', reports:'التقارير', dashboard:'لوحة التحكم' };
    return map[page] || page;
  },

  openNotif(id, el) {
    const n = DB.notifications.find(n => n.id === id);
    if (!n) return;
    n.read = true;
    el?.classList.remove('unread');
    App._updateBadges();
    DB.save();
    const link = n.link || { leave:'leaves', attendance:'attendance', request:'requests', payroll:'payroll', loan:'loans', gratuity:'gratuity', employee:'employees', report:'reports' }[n.type];
    if (link) App.navigate(link);
  },

  markRead(id, el) {
    const n = DB.notifications.find(n => n.id === id);
    if (n) { n.read = true; el?.classList.remove('unread'); App._updateBadges(); DB.save(); }
  },

  deleteNotif(id, el) {
    const i = DB.notifications.findIndex(n => n.id === id);
    if (i !== -1) DB.notifications.splice(i, 1);
    el?.remove();
    App._updateBadges();
    App.toast(currentLang==='ar'?'تم حذف الإشعار':'Notification deleted', 'info');
  },

  deleteAll() {
    App.confirm(currentLang==='ar'?'هل تريد حذف جميع الإشعارات؟':'Delete all notifications?', () => {
      DB.notifications.splice(0);
      App._updateBadges();
      App.toast(currentLang==='ar'?'تم حذف كل الإشعارات':'All notifications deleted', 'success');
      this.render(document.getElementById('page-content'));
    });
  },

  saveChannelState(channel, enabled) {
    if (!DB.company.notifChannels) DB.company.notifChannels = {};
    DB.company.notifChannels[channel] = enabled;
    DB.saveCompany();
    App.toast(`${channel}: ${enabled?(currentLang==='ar'?'مفعّل':'Enabled'):(currentLang==='ar'?'معطّل':'Disabled')}`, 'success');
  },

  isChannelEnabled(channel) {
    if (!DB.company.notifChannels) return true;
    return DB.company.notifChannels[channel] !== false;
  },
};
