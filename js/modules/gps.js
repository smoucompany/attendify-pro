/* =========================================================
   GPS TRACKING & GEOFENCING MODULE
   ========================================================= */

const GpsModule = {
  render(container) {
    const activeLocations = DB.locations.filter(l => l.active).length;

    container.innerHTML = `
      <div class="page-header">
        <div class="page-header-text">
          <h1>${t('gps.title')}</h1>
          <p>${t('gps.subtitle')}</p>
        </div>
        <div class="page-header-actions">
          <button class="btn btn-primary" onclick="GpsModule.openAdd()"><i class="fas fa-map-pin"></i> ${t('gps.addLocation')}</button>
        </div>
      </div>

      <!-- Stats -->
      <div class="stat-cards" style="margin-bottom:20px">
        ${[
          {v:DB.locations.length,    l:currentLang==='ar'?'مواقع العمل':'Work Locations',   g:'gradient-primary', i:'fas fa-map-location-dot'},
          {v:activeLocations,        l:currentLang==='ar'?'مواقع نشطة':'Active Locations',  g:'gradient-success', i:'fas fa-circle-check'},
          {v:DB.employees.filter(e=>e.status==='active').length, l:t('gps.activeEmployees'), g:'gradient-indigo',  i:'fas fa-users'},
          {v:0,                      l:t('gps.outsideZone'),                                 g:'gradient-danger',  i:'fas fa-triangle-exclamation'},
        ].map(s=>`
          <div class="stat-card stagger-item">
            <div class="stat-icon ${s.g}"><i class="${s.i}"></i></div>
            <div class="stat-info"><div class="stat-value">${s.v}</div><div class="stat-label">${s.l}</div></div>
          </div>
        `).join('')}
      </div>

      <!-- Map + Locations -->
      <div class="grid-main-side">
        <!-- Map -->
        <div class="card">
          <div class="card-header">
            <h3><i class="fas fa-map" style="color:var(--primary)"></i> ${currentLang==='ar'?'خريطة المواقع الحية':'Live Location Map'}</h3>
            <div style="display:flex;gap:8px">
              <span class="badge badge-success badge-dot">${t('gps.activeEmployees')}: ${DB.employees.filter(e=>e.status==='active').length}</span>
              <span class="badge badge-danger badge-dot">${t('gps.outsideZone')}: 0</span>
            </div>
          </div>
          <div class="card-body" style="padding:0">
            <div class="map-container" style="height:400px;border-radius:0 0 var(--radius-lg) var(--radius-lg)">
              <div class="map-grid"></div>
              <!-- Geofence circles -->
              <div class="geofence-circle"></div>
              <div class="geofence-circle" style="width:120px;height:120px;border-color:rgba(16,185,129,0.5);animation-delay:1s"></div>
              <!-- Employee pins -->
              <div class="map-pin" style="top:43%;left:46%;background:#6366f1"></div>
              <div class="map-pin" style="top:55%;left:52%;background:#10b981"></div>
              <div class="map-pin" style="top:38%;left:58%;background:#10b981"></div>
              <div class="map-pin" style="top:60%;left:40%;background:#f59e0b"></div>
              <div class="map-pin" style="top:47%;left:65%;background:#ef4444"></div>
              <!-- Labels -->
              <div style="position:absolute;top:16px;right:16px;background:rgba(0,0,0,0.7);backdrop-filter:blur(8px);border-radius:8px;padding:10px 14px">
                <div style="color:white;font-size:13px;font-weight:700;margin-bottom:6px">${currentLang==='ar'?'المفتاح':'Legend'}</div>
                <div style="display:flex;flex-direction:column;gap:4px">
                  <div style="display:flex;align-items:center;gap:6px;font-size:11px;color:rgba(255,255,255,0.8)"><div style="width:8px;height:8px;border-radius:50%;background:#6366f1"></div>${currentLang==='ar'?'المركز الرئيسي':'Head Office'}</div>
                  <div style="display:flex;align-items:center;gap:6px;font-size:11px;color:rgba(255,255,255,0.8)"><div style="width:8px;height:8px;border-radius:50%;background:#10b981"></div>${currentLang==='ar'?'داخل النطاق':'In Zone'}</div>
                  <div style="display:flex;align-items:center;gap:6px;font-size:11px;color:rgba(255,255,255,0.8)"><div style="width:8px;height:8px;border-radius:50%;background:#ef4444"></div>${currentLang==='ar'?'خارج النطاق':'Out of Zone'}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Locations List + Employee Tracking -->
        <div style="display:flex;flex-direction:column;gap:16px">
          <!-- Locations -->
          <div class="card">
            <div class="card-header"><h3><i class="fas fa-map-pin" style="color:var(--primary)"></i> ${currentLang==='ar'?'مواقع العمل':'Work Locations'}</h3></div>
            <div class="card-body" style="padding:8px">
              ${DB.locations.map(loc => `
                <div style="display:flex;gap:10px;align-items:flex-start;padding:10px;border-radius:10px;background:var(--bg-input);margin-bottom:8px">
                  <div style="width:38px;height:38px;border-radius:10px;background:${loc.active?'var(--primary-bg)':'var(--border)'};color:${loc.active?'var(--primary)':'var(--text-muted)'};display:flex;align-items:center;justify-content:center;font-size:15px;flex-shrink:0">
                    <i class="fas fa-map-pin"></i>
                  </div>
                  <div style="flex:1;min-width:0">
                    <div style="font-size:13px;font-weight:700;color:var(--text-primary);margin-bottom:3px">${loc.name}</div>
                    <div style="font-size:11px;color:var(--text-muted)">${t('gps.radius')}: ${loc.radius}${currentLang==='ar'?' متر':' m'}</div>
                    <div style="font-size:11px;color:var(--text-muted);font-family:var(--font-en)">${loc.lat.toFixed(4)}, ${loc.lng.toFixed(4)}</div>
                  </div>
                  <div style="display:flex;flex-direction:column;gap:4px;align-items:flex-end">
                    <span class="badge ${loc.active?'badge-success':'badge-secondary'} badge-dot">${loc.active?(currentLang==='ar'?'نشط':'Active'):(currentLang==='ar'?'معطل':'Inactive')}</span>
                    <button class="btn-icon btn" onclick="GpsModule.editLocation('${loc.id}')"><i class="fas fa-pencil"></i></button>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Real-time Tracking -->
          <div class="card">
            <div class="card-header">
              <h3><i class="fas fa-location-crosshairs" style="color:var(--success)"></i> ${currentLang==='ar'?'تتبع موقعي':'My Location'}</h3>
              <button class="btn btn-success btn-sm" onclick="GpsModule.trackMe()">
                <i class="fas fa-crosshairs"></i> ${currentLang==='ar'?'تحديد موقعي':'Locate Me'}
              </button>
            </div>
            <div class="card-body" style="padding:12px">
              <div id="gps-my-location">
                <div style="text-align:center;padding:16px;color:var(--text-muted);font-size:13px">
                  <i class="fas fa-location-dot" style="font-size:26px;margin-bottom:8px;display:block;opacity:.3"></i>
                  ${currentLang==='ar'?'اضغط "تحديد موقعي" للبدء':'Click "Locate Me" to start'}
                </div>
              </div>
              <div style="margin-top:10px;border-top:1px solid var(--border);padding-top:10px">
                <div style="font-size:11px;font-weight:700;color:var(--text-muted);margin-bottom:6px">${currentLang==='ar'?'حضور اليوم':'Today\'s Attendance'}</div>
                ${(() => {
                  const today = new Date().toISOString().split('T')[0];
                  const todayRecs = DB.attendance.filter(a => a.date === today);
                  if (!todayRecs.length) return `<div style="color:var(--text-muted);font-size:12px;text-align:center;padding:8px">${currentLang==='ar'?'لا توجد سجلات اليوم':'No records today'}</div>`;
                  return todayRecs.slice(0,4).map(a => {
                    const emp = DB.getEmployee(a.empId);
                    if (!emp) return '';
                    const inZone = a.lat && a.lng && DB.locations.some(loc => GpsModule._distanceM(a.lat, a.lng, loc.lat, loc.lng) <= loc.radius);
                    return `
                      <div style="display:flex;align-items:center;gap:8px;padding:6px;border-radius:8px;margin-bottom:4px">
                        <div class="avatar ${emp.avatarColor||'gradient-primary'}" style="width:26px;height:26px;font-size:10px">${emp.avatar||'?'}</div>
                        <div style="flex:1;font-size:12px;font-weight:600;color:var(--text-primary)">${emp.name}</div>
                        <span class="badge ${a.lat?(inZone?'badge-success':'badge-danger'):'badge-secondary'} badge-dot" style="font-size:10px">
                          ${a.lat?(inZone?(currentLang==='ar'?'داخل':'In'):(currentLang==='ar'?'خارج':'Out')):'—'}
                        </span>
                        <span style="font-size:10px;color:var(--text-muted)">${a.checkIn||'—'}</span>
                      </div>
                    `;
                  }).join('');
                })()}
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  // Haversine formula — returns distance in meters between two lat/lng points
  _distanceM(lat1, lng1, lat2, lng2) {
    const R = 6371000;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLng/2)**2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  },

  trackMe() {
    const box = document.getElementById('gps-my-location');
    if (!box) return;
    if (!navigator.geolocation) {
      box.innerHTML = `<div style="color:var(--danger);font-size:13px;padding:10px"><i class="fas fa-circle-xmark"></i> ${currentLang==='ar'?'المتصفح لا يدعم تحديد الموقع':'Browser does not support geolocation'}</div>`;
      return;
    }
    box.innerHTML = `<div style="text-align:center;padding:12px;color:var(--text-muted);font-size:13px"><i class="fas fa-spinner fa-spin" style="font-size:22px;margin-bottom:8px;display:block"></i>${currentLang==='ar'?'جارٍ تحديد الموقع...':'Getting location...'}</div>`;
    navigator.geolocation.getCurrentPosition(
      pos => {
        const { latitude: lat, longitude: lng, accuracy } = pos.coords;
        // Check against all registered locations
        const checks = DB.locations.map(loc => {
          const dist = Math.round(this._distanceM(lat, lng, loc.lat, loc.lng));
          const inside = dist <= loc.radius;
          return { loc, dist, inside };
        });
        const bestMatch = checks.find(c => c.inside) || checks.sort((a,b) => a.dist - b.dist)[0];
        const statusColor = bestMatch?.inside ? 'var(--success)' : 'var(--danger)';
        const statusText  = bestMatch?.inside
          ? (currentLang==='ar'?'داخل النطاق ✓':'Inside Zone ✓')
          : (currentLang==='ar'?'خارج النطاق':'Outside Zone');
        box.innerHTML = `
          <div style="background:var(--bg-input);border-radius:12px;padding:14px">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
              <span style="font-size:13px;font-weight:700;color:var(--text-primary)"><i class="fas fa-location-dot" style="color:var(--primary)"></i> ${currentLang==='ar'?'موقعك الحالي':'Your Location'}</span>
              <span style="font-size:12px;font-weight:700;color:${statusColor}">${statusText}</span>
            </div>
            <div style="font-family:var(--font-en);font-size:12px;color:var(--text-secondary);margin-bottom:6px">
              ${lat.toFixed(5)}, ${lng.toFixed(5)}
            </div>
            <div style="font-size:11px;color:var(--text-muted);margin-bottom:10px">
              <i class="fas fa-circle-dot"></i> ${currentLang==='ar'?'دقة':'Accuracy'}: ±${Math.round(accuracy)}${currentLang==='ar'?' متر':' m'}
            </div>
            ${checks.slice(0,3).map(({loc, dist, inside}) => `
              <div style="display:flex;justify-content:space-between;align-items:center;padding:6px 10px;border-radius:8px;background:${inside?'rgba(16,185,129,0.08)':'var(--bg)'};margin-bottom:4px;font-size:12px">
                <span style="color:var(--text-primary)">${loc.name}</span>
                <span style="color:${inside?'var(--success)':'var(--text-muted)'}">${dist < 1000 ? dist+'m' : (dist/1000).toFixed(1)+'km'}</span>
              </div>
            `).join('')}
            <button class="btn btn-outline-primary btn-sm w-full" style="margin-top:8px" onclick="GpsModule.trackMe()">
              <i class="fas fa-rotate"></i> ${currentLang==='ar'?'تحديث':'Refresh'}
            </button>
          </div>
        `;
        DB.logAudit('admin', currentLang==='ar'?'تتبع GPS':'GPS Track', 'GPS', `${lat.toFixed(4)}, ${lng.toFixed(4)}`);
      },
      err => {
        const msgs = { 1: currentLang==='ar'?'تم رفض إذن الموقع':'Location permission denied', 2: currentLang==='ar'?'الموقع غير متاح':'Location unavailable', 3: currentLang==='ar'?'انتهت مهلة الطلب':'Request timed out' };
        box.innerHTML = `<div style="color:var(--danger);font-size:13px;padding:10px;text-align:center"><i class="fas fa-circle-xmark" style="font-size:20px;display:block;margin-bottom:8px"></i>${msgs[err.code]||err.message}</div>`;
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    );
  },

  openAdd() {
    App.openModal(t('gps.addLocation'), `
      <form onsubmit="GpsModule.saveLocation(event)">
        <div class="app-form-group">
          <label>${t('gps.locationName')}</label>
          <input class="app-form-input" type="text" name="name" required>
        </div>
        <div style="margin-bottom:8px">
          <button type="button" class="btn btn-secondary btn-sm" onclick="GpsModule._fillCurrentLocation()">
            <i class="fas fa-crosshairs"></i> ${currentLang==='ar'?'استخدام موقعي الحالي':'Use My Current Location'}
          </button>
        </div>
        <div class="app-form-row">
          <div class="app-form-group">
            <label>Latitude</label>
            <input class="app-form-input" type="number" id="add-lat" name="lat" step="0.00001" placeholder="مثال: 24.7136" required>
          </div>
          <div class="app-form-group">
            <label>Longitude</label>
            <input class="app-form-input" type="number" id="add-lng" name="lng" step="0.00001" placeholder="مثال: 46.6753" required>
          </div>
        </div>
        <div class="app-form-group">
          <label>${t('gps.radius')} (${currentLang==='ar'?'متر':'meters'})</label>
          <input class="app-form-input" type="number" name="radius" value="200" min="50" max="5000">
        </div>
        <div class="app-form-group">
          <label>${currentLang==='ar'?'الفرع':'Branch'}</label>
          <select class="app-form-input app-form-select" name="branch">
            ${DB.company.branches.map(b=>`<option value="${b.id}">${b.name}</option>`).join('')}
          </select>
        </div>
        <div class="modal-footer" style="padding:0;margin-top:20px">
          <button type="button" class="btn btn-secondary" onclick="App.closeModal()">${t('common.cancel')}</button>
          <button type="submit" class="btn btn-primary"><i class="fas fa-save"></i> ${t('common.save')}</button>
        </div>
      </form>
    `, { size: 'sm' });
  },

  _fillCurrentLocation() {
    if (!navigator.geolocation) { App.toast(currentLang==='ar'?'المتصفح لا يدعم GPS':'Browser has no GPS', 'warning'); return; }
    App.toast(currentLang==='ar'?'جارٍ تحديد الموقع...':'Getting location...', 'info', 4000);
    navigator.geolocation.getCurrentPosition(pos => {
      const latEl = document.getElementById('add-lat');
      const lngEl = document.getElementById('add-lng');
      if (latEl) latEl.value = pos.coords.latitude.toFixed(6);
      if (lngEl) lngEl.value = pos.coords.longitude.toFixed(6);
      App.toast(currentLang==='ar'?'تم تحديد الموقع ✓':'Location set ✓', 'success');
    }, () => App.toast(currentLang==='ar'?'تعذّر الحصول على الموقع':'Could not get location', 'error'), { enableHighAccuracy: true, timeout: 8000 });
  },

  saveLocation(e) {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target));
    DB.locations.push({
      id: DB.nextId('loc'),
      name: data.name,
      lat: parseFloat(data.lat),
      lng: parseFloat(data.lng),
      radius: parseInt(data.radius)||200,
      branch: data.branch,
      active: true,
    });
    App.closeModal();
    App.toast(currentLang==='ar'?'تمت إضافة الموقع':'Location added', 'success');
    this.render(document.getElementById('page-content'));
  },

  editLocation(id) {
    const loc = DB.locations.find(l => l.id === id);
    if (!loc) return;
    App.openModal(t('common.edit') + ' ' + loc.name, `
      <form onsubmit="GpsModule.updateLocation(event, '${id}')">
        <div class="app-form-group">
          <label>${t('gps.locationName')}</label>
          <input class="app-form-input" type="text" name="name" value="${loc.name}" required>
        </div>
        <div class="app-form-group">
          <label>${t('gps.radius')}</label>
          <input class="app-form-input" type="number" name="radius" value="${loc.radius}">
        </div>
        <div class="settings-item" style="padding:12px 0">
          <div class="settings-item-info">
            <div class="settings-item-label">${currentLang==='ar'?'نشط':'Active'}</div>
          </div>
          <div class="toggle-switch ${loc.active?'on':''}" id="loc-toggle" onclick="this.classList.toggle('on')"></div>
        </div>
        <div class="modal-footer" style="padding:0;margin-top:16px">
          <button type="button" class="btn btn-secondary" onclick="App.closeModal()">${t('common.cancel')}</button>
          <button type="submit" class="btn btn-primary">${t('common.save')}</button>
        </div>
      </form>
    `, { size: 'sm' });
  },

  updateLocation(e, id) {
    e.preventDefault();
    const data   = Object.fromEntries(new FormData(e.target));
    const loc    = DB.locations.find(l => l.id === id);
    const toggle = document.getElementById('loc-toggle');
    if (loc) { loc.name = data.name; loc.radius = parseInt(data.radius)||loc.radius; loc.active = toggle?.classList.contains('on') || false; }
    App.closeModal();
    App.toast(currentLang==='ar'?'تم التحديث':'Updated', 'success');
    this.render(document.getElementById('page-content'));
  }
};
