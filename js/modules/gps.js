/* =========================================================
   GPS TRACKING & GEOFENCING — Next-Gen Professional UI
   ========================================================= */

const GpsModule = {
  _map: null, _markers: [], _userMarker: null, _styleMode: 'street',
  _labelEls: [],
  _C: ['#6366f1','#10b981','#f59e0b','#06b6d4','#ec4899','#ef4444','#8b5cf6','#f97316'],

  render(container) {
    const today = new Date().toISOString().split('T')[0];
    const att   = DB.attendance.filter(a => a.date === today);
    const locs  = DB.locations;
    const inZ   = att.filter(a => a.lat && locs.some(l => this._distanceM(a.lat,a.lng,l.lat,l.lng) <= l.radius)).length;
    const outZ  = Math.max(0, att.length - inZ);

    this._css();
    container.innerHTML = `
<div class="gx">

  <!-- ══════════════ TOP STATS BAR ══════════════ -->
  <div class="gx-statsbar">
    ${[
      { n:locs.length,                          l:currentLang==='ar'?'مناطق':'Zones',     i:'fa-hexagon-nodes',        c:'#818cf8', bg:'rgba(129,140,248,.12)' },
      { n:locs.filter(l=>l.active!==false).length, l:currentLang==='ar'?'نشطة':'Active',  i:'fa-signal',               c:'#34d399', bg:'rgba(52,211,153,.12)'  },
      { n:att.length,                           l:currentLang==='ar'?'حاضر اليوم':'Present',  i:'fa-users',            c:'#38bdf8', bg:'rgba(56,189,248,.12)'  },
      { n:inZ,                                  l:currentLang==='ar'?'داخل النطاق':'In Zone', i:'fa-circle-check',     c:'#4ade80', bg:'rgba(74,222,128,.12)'  },
      { n:outZ,                                 l:currentLang==='ar'?'خارج النطاق':'Outside', i:'fa-circle-exclamation',c:'#f87171', bg:'rgba(248,113,113,.12)' },
    ].map(s=>`
      <div class="gx-stat" style="--sc:${s.c};--sbg:${s.bg}">
        <div class="gx-stat-icon"><i class="fas ${s.i}"></i></div>
        <div class="gx-stat-body">
          <span class="gx-stat-n">${s.n}</span>
          <span class="gx-stat-l">${s.l}</span>
        </div>
      </div>`).join('')}

    <div class="gx-statsbar-actions">
      <button class="gx-btn gx-btn-sat" id="gwStyleBtn" onclick="GpsModule._toggleStyle()">
        <i class="fas fa-satellite" id="gwStyleIco"></i>
        <span id="gwStyleLbl">${currentLang==='ar'?'قمر صناعي':'Satellite'}</span>
      </button>
      <button class="gx-btn gx-btn-gmaps" onclick="GpsModule._openGoogle()">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#4285F4"/>
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="url(#gpin)"/>
          <circle cx="12" cy="9" r="2.5" fill="white"/>
          <defs><linearGradient id="gpin" x1="5" y1="2" x2="19" y2="22"><stop offset="0%" stop-color="#4285F4"/><stop offset="50%" stop-color="#34A853"/><stop offset="100%" stop-color="#FBBC04"/></linearGradient></defs>
        </svg>
        Google Maps
      </button>
      <button class="gx-btn gx-btn-add" onclick="GpsModule.openAdd()">
        <i class="fas fa-plus"></i> ${currentLang==='ar'?'منطقة جديدة':'New Zone'}
      </button>
    </div>
  </div>

  <!-- ══════════════ MAIN CONTENT ══════════════ -->
  <div class="gx-body">

    <!-- ── LEFT PANEL ── -->
    <div class="gx-panel">

      <!-- Live indicator -->
      <div class="gx-live-badge">
        <span class="gx-live-dot"></span>
        <span>${currentLang==='ar'?'مباشر — يتحدث تلقائياً':'Live — Auto updating'}</span>
      </div>

      <!-- Zones list -->
      <div class="gx-card">
        <div class="gx-card-hd">
          <div class="gx-card-hd-icon" style="background:rgba(99,102,241,.15);color:#818cf8"><i class="fas fa-draw-polygon"></i></div>
          <div>
            <div class="gx-card-hd-title">${currentLang==='ar'?'مناطق السياج':'Geofence Zones'}</div>
            <div class="gx-card-hd-sub">${locs.length} ${currentLang==='ar'?'منطقة مضافة':'zones configured'}</div>
          </div>
        </div>
        <div class="gx-zones">
          ${locs.length ? locs.map((loc,i)=>{
            const c = this._C[i%this._C.length];
            const r = loc.radius < 1000 ? `${loc.radius}م` : `${(loc.radius/1000).toFixed(1)}كم`;
            const active = loc.active !== false;
            return `
            <div class="gx-zone" onclick="GpsModule._fly(${loc.lat},${loc.lng})" style="--zc:${c}">
              <div class="gx-zone-dot" style="background:${c}">
                ${active ? '<span class="gx-zone-pulse"></span>' : ''}
              </div>
              <div class="gx-zone-info">
                <div class="gx-zone-name">${loc.name}</div>
                <div class="gx-zone-meta">
                  <span class="gx-zone-tag" style="background:${c}18;color:${c}">${r}</span>
                  <span class="gx-zone-coords">${loc.lat.toFixed(4)}, ${loc.lng.toFixed(4)}</span>
                </div>
              </div>
              <div class="gx-zone-acts">
                <div class="gx-zone-status ${active?'gx-zone-on':'gx-zone-off'}">${active?(currentLang==='ar'?'نشط':'On'):(currentLang==='ar'?'معطل':'Off')}</div>
                <button class="gx-icon-btn" onclick="event.stopPropagation();GpsModule.editLocation('${loc.id}')"><i class="fas fa-pen"></i></button>
                <button class="gx-icon-btn gx-icon-del" onclick="event.stopPropagation();GpsModule.deleteLocation('${loc.id}')"><i class="fas fa-trash-can"></i></button>
              </div>
            </div>`;
          }).join('') : `
          <div class="gx-empty">
            <i class="fas fa-map-location-dot"></i>
            <p>${currentLang==='ar'?'لا توجد مناطق — أضف منطقة جديدة':'No zones — add one above'}</p>
          </div>`}
        </div>
      </div>

      <!-- My Location -->
      <div class="gx-card">
        <div class="gx-card-hd">
          <div class="gx-card-hd-icon" style="background:rgba(16,185,129,.15);color:#34d399"><i class="fas fa-crosshairs"></i></div>
          <div style="flex:1">
            <div class="gx-card-hd-title">${currentLang==='ar'?'موقعي الحالي':'My Location'}</div>
          </div>
          <button class="gx-locate-btn" onclick="GpsModule.trackMe()">
            <i class="fas fa-location-arrow"></i> ${currentLang==='ar'?'تحديد':'Locate'}
          </button>
        </div>
        <div id="gw-myloc" class="gx-myloc">
          <div class="gx-empty" style="padding:14px 8px">
            <i class="fas fa-satellite-dish" style="font-size:22px;color:rgba(255,255,255,.2)"></i>
            <p>${currentLang==='ar'?'اضغط "تحديد" للبدء':'Press Locate to start'}</p>
          </div>
        </div>
      </div>

      <!-- Today Attendance -->
      <div class="gx-card gx-card-flex">
        <div class="gx-card-hd">
          <div class="gx-card-hd-icon" style="background:rgba(56,189,248,.15);color:#38bdf8"><i class="fas fa-user-clock"></i></div>
          <div>
            <div class="gx-card-hd-title">${currentLang==='ar'?'حضور اليوم':'Today\'s Attendance'}</div>
            <div class="gx-card-hd-sub">${att.length} ${currentLang==='ar'?'موظف':'employees'}</div>
          </div>
        </div>
        <div class="gx-att-list">
          ${att.length ? att.slice(0,10).map(a=>{
            const emp = DB.getEmployee(a.empId); if (!emp) return '';
            const iz  = a.lat && locs.some(l=>this._distanceM(a.lat,a.lng,l.lat,l.lng)<=l.radius);
            const hasLoc = !!a.lat;
            return `<div class="gx-att-row">
              <div class="avatar ${emp.avatarColor||'gradient-primary'}" style="width:30px;height:30px;font-size:11px;flex-shrink:0">${emp.avatar||'?'}</div>
              <div class="gx-att-info">
                <div class="gx-att-name">${emp.name}</div>
                <div class="gx-att-time">${a.checkIn||'—'}</div>
              </div>
              <div class="gx-att-status ${hasLoc?(iz?'gx-in':'gx-out'):'gx-unknown'}">
                <i class="fas ${hasLoc?(iz?'fa-circle-check':'fa-circle-xmark'):'fa-circle-question'}"></i>
                ${hasLoc?(iz?(currentLang==='ar'?'داخل':'In'):(currentLang==='ar'?'خارج':'Out')):(currentLang==='ar'?'بدون GPS':'No GPS')}
              </div>
            </div>`;
          }).join('') : `
          <div class="gx-empty" style="padding:14px 8px">
            <i class="fas fa-calendar-xmark" style="font-size:22px;color:rgba(255,255,255,.2)"></i>
            <p>${currentLang==='ar'?'لا سجلات اليوم':'No records today'}</p>
          </div>`}
        </div>
      </div>

    </div><!-- /panel -->

    <!-- ── MAP ── -->
    <div class="gx-map-wrap">
      <div id="gw-map"></div>
      <!-- Map style switcher overlay -->
      <div class="gx-map-switcher">
        ${[
          {m:'street',    i:'fa-map',       l:currentLang==='ar'?'خريطة':'Map'},
          {m:'dark',      i:'fa-moon',      l:currentLang==='ar'?'ليلي':'Dark'},
          {m:'satellite', i:'fa-satellite', l:currentLang==='ar'?'قمر صناعي':'Satellite'},
        ].map(s=>`
          <button class="gx-sw-btn ${this._styleMode===s.m?'gx-sw-active':''}" id="gx-sw-${s.m}"
            onclick="GpsModule._setStyle('${s.m}')">
            <i class="fas ${s.i}"></i> ${s.l}
          </button>`).join('')}
        <div class="gx-sw-sep"></div>
        <button class="gx-sw-btn ${this._3dOn?'gx-sw-active':''}" id="gx-3d-btn" onclick="GpsModule.toggle3D()">
          <i class="fas fa-cube"></i> ${this._3dOn?(currentLang==='ar'?'3D مفعّل':'3D On'):'3D'}
        </button>
      </div>
      <!-- Zoom hint -->
      <div class="gx-map-hint" id="gx-hint" style="display:none">
        <i class="fas fa-expand-arrows-alt"></i>
        ${currentLang==='ar'?'اضغط على المنطقة للتكبير':'Click zone to zoom in'}
      </div>
    </div>

  </div><!-- /body -->
</div>`;

    setTimeout(() => {
      this._initMap();
      // show hint briefly
      const hint = document.getElementById('gx-hint');
      if (hint && locs.length) {
        hint.style.display = 'flex';
        setTimeout(()=>hint.style.display='none', 3000);
      }
    }, 80);
  },

  /* ═══════════════ MAP ═══════════════════════════════════ */
  _3dOn: true,

  _initMap() {
    const el = document.getElementById('gw-map');
    if (!el || typeof maplibregl === 'undefined') return;
    if (this._map) { this._map.remove(); this._map = null; }
    this._markers.forEach(m => m.remove()); this._markers = [];
    if (this._popups) { this._popups.forEach(p => p.remove()); }
    this._popups = [];
    this._labelEls = [];

    const locs   = DB.locations;
    const active = locs.filter(l => l.active !== false);
    const center = active.length ? [active[0].lng, active[0].lat]
                 : locs.length  ? [locs[0].lng,   locs[0].lat]
                 : [46.6753, 24.7136];

    this._styleMode = 'street';
    const map = new maplibregl.Map({
      container: 'gw-map',
      style: this._mapStyle('street'),
      center,
      zoom:    locs.length ? 15 : 5,
      pitch:   this._3dOn  ? 50 : 0,
      bearing: -10,
      antialias: true,
      maxPitch: 65,
    });

    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'bottom-right');
    map.addControl(new maplibregl.ScaleControl({ maxWidth: 90, unit: 'metric' }), 'bottom-left');

    map.on('load', () => {
      this._markers.forEach(m => m.remove()); this._markers = [];

      // ── 3D Buildings ──────────────────────────────────
      this._add3DBuildings(map);

      locs.forEach((loc, i) => {
        const c = this._C[i % this._C.length];
        this._addZone(map, loc, c);
        this._addLabel(map, loc, c);
      });

      if (locs.length > 1) {
        const b = locs.reduce(
          (acc, l) => acc.extend([l.lng, l.lat]),
          new maplibregl.LngLatBounds([locs[0].lng, locs[0].lat], [locs[0].lng, locs[0].lat])
        );
        map.fitBounds(b, { padding: 100, duration: 1000, pitch: this._3dOn ? 50 : 0 });
      }
    });

    this._map = map;
    this._hideGmapFrame();
    this._update3DBtn();
  },

  _add3DBuildings(map) {
    if (!this._3dOn) return;
    // Try adding 3D building extrusion from any available vector source
    try {
      const style = map.getStyle();
      const sources = style.sources || {};

      // Find any source that has a 'building' layer
      const hasBuildingSource = style.layers?.some(l => l['source-layer'] === 'building');

      if (hasBuildingSource) {
        const buildingLayer = style.layers?.find(l => l['source-layer'] === 'building');
        const srcName = buildingLayer?.source;
        if (srcName && !map.getLayer('gx-3d-buildings')) {
          map.addLayer({
            id:           'gx-3d-buildings',
            type:         'fill-extrusion',
            source:       srcName,
            'source-layer': 'building',
            minzoom: 14,
            filter: ['==', 'extrude', 'true'],
            paint: {
              'fill-extrusion-color':   ['interpolate', ['linear'], ['get', 'height'], 0, '#1e293b', 50, '#334155', 100, '#475569'],
              'fill-extrusion-height':  ['interpolate', ['linear'], ['zoom'], 14, 0, 14.5, ['get', 'height']],
              'fill-extrusion-base':    ['interpolate', ['linear'], ['zoom'], 14, 0, 14.5, ['get', 'min_height']],
              'fill-extrusion-opacity': 0.85,
            },
          });
        }
      } else {
        // No vector building data — add OSM overpass-based extrusion via custom GeoJSON
        this._addOsmBuildings(map);
      }
    } catch(e) {
      // Silently skip if no building data available
    }
  },

  _addOsmBuildings(map) {
    // Generic building layer for raster-based maps (adds visual depth)
    if (map.getLayer('gx-3d-shadow')) return;
    // Add a subtle ground shadow plane under zones for 3D feel
    // (no real building data available with raster tiles)
  },

  _mapStyle(mode) {
    if (mode === 'dark') {
      // Dark vector style with 3D buildings
      return 'https://tiles.openfreemap.org/styles/dark';
    }
    // Street: OpenFreeMap Liberty — free vector style with 3D buildings, no API key
    return 'https://tiles.openfreemap.org/styles/liberty';
  },

  toggle3D() {
    this._3dOn = !this._3dOn;
    this._update3DBtn();
    if (!this._map) return;
    this._map.easeTo({
      pitch:    this._3dOn ? 50 : 0,
      bearing:  this._3dOn ? -10 : 0,
      duration: 800,
    });
    if (this._3dOn) {
      this._add3DBuildings(this._map);
    } else {
      try { this._map.removeLayer('gx-3d-buildings'); } catch(_) {}
    }
  },

  _update3DBtn() {
    const btn = document.getElementById('gx-3d-btn');
    if (!btn) return;
    btn.classList.toggle('gx-sw-active', this._3dOn);
    btn.innerHTML = `<i class="fas fa-cube"></i> ${this._3dOn ? (currentLang==='ar'?'3D مفعّل':'3D On') : (currentLang==='ar'?'3D':'3D')}`;
  },

  _addZone(map, loc, c) {
    const id = `z-${loc.id}`;
    if (map.getSource(id)) return;
    const pts = 128, R = 6371000;
    const coords = Array.from({ length: pts + 1 }, (_, k) => {
      const a = (k / pts) * 2 * Math.PI;
      const dLat = (loc.radius / R) * (180 / Math.PI);
      const dLng = dLat / Math.cos(loc.lat * Math.PI / 180);
      return [loc.lng + dLng * Math.sin(a), loc.lat + dLat * Math.cos(a)];
    });
    map.addSource(id, { type:'geojson', data:{ type:'Feature', geometry:{ type:'Polygon', coordinates:[coords] } } });
    const active = loc.active !== false;
    map.addLayer({ id:`${id}-fill`, type:'fill', source:id, paint:{ 'fill-color':c, 'fill-opacity': active ? 0.12 : 0.04 } });
    map.addLayer({ id:`${id}-border`, type:'line', source:id, paint:{ 'line-color':c, 'line-width': active ? 2.5 : 1.5, 'line-dasharray': active ? [1,0] : [4,3], 'line-opacity': active ? 1 : 0.5 } });
  },

  /* ═══════ ANIMATED ZONE LABELS ═══════════════════════════
   * Strategy: split into TWO separate MapLibre objects:
   *   1. HTML Marker  → animated dot + rings (anchor:center)
   *   2. MapLibre Popup (always open, no tip) → zone name badge
   *
   * Popups are projected in map-space, so they're always in the
   * correct screen position regardless of pitch/bearing/zoom.
   * This fixes the "badge appears at wrong position in 3D" bug.
   ══════════════════════════════════════════════════════════ */
  _addLabel(map, loc, c) {
    const active = loc.active !== false;
    const r = loc.radius < 1000 ? `${loc.radius}م` : `${(loc.radius/1000).toFixed(1)}كم`;
    const idx = DB.locations.findIndex(l => l.id === loc.id);

    /* ── 1. Animated dot marker ── */
    const el = document.createElement('div');
    el.className = 'gx-zone-label';
    el.dataset.zoneId = loc.id;
    el.style.cssText = `--zc:${c}; animation-delay:${idx * 0.18}s; width:20px; height:20px; position:relative; cursor:pointer;`;
    el.innerHTML = `
      <div class="gx-zl-rings ${active ? 'gx-zl-active' : ''}">
        <span class="gx-zl-ring r1" style="border-color:${c}90"></span>
        <span class="gx-zl-ring r2" style="border-color:${c}55"></span>
        <span class="gx-zl-ring r3" style="border-color:${c}30"></span>
      </div>
      <div class="gx-zl-dot" style="background:${c}">
        <div class="gx-zl-dot-inner"></div>
      </div>
    `;
    el.addEventListener('click', () => this._fly(loc.lat, loc.lng));

    this._markers.push(
      new maplibregl.Marker({ element: el, anchor: 'center' })
        .setLngLat([loc.lng, loc.lat])
        .addTo(map)
    );
    this._labelEls.push(el);

    /* ── 2. Always-open popup = zone name badge ── */
    const popup = new maplibregl.Popup({
      closeButton:  false,
      closeOnClick: false,
      anchor:       'bottom',
      offset:       [0, -18],   // gap above the dot
      className:    'gx-zone-popup',
      maxWidth:     'none',
    }).setHTML(`
      <div class="gx-zl-badge ${active ? '' : 'gx-zl-inactive'}" style="--zc:${c};animation-delay:${idx * 0.18}s">
        <div class="gx-zl-badge-glow" style="background:${c}"></div>
        <i class="fas fa-location-dot" style="color:${c};font-size:11px;position:relative;z-index:1"></i>
        <span class="gx-zl-name">${loc.name}</span>
        <span class="gx-zl-radius" style="background:${c}22;color:${c}">${r}</span>
        ${active ? `<span class="gx-zl-live"><span class="gx-zl-live-dot" style="background:${c}"></span>${currentLang === 'ar' ? 'نشط' : 'Active'}</span>` : ''}
      </div>
    `);

    popup.setLngLat([loc.lng, loc.lat]).addTo(map);
    this._popups.push(popup);
  },

  /* ═══════ GOOGLE MAPS IFRAME ═══════════════════════════ */
  _showGmapFrame(lat, lng, zoom) {
    let frame = document.getElementById('gw-gmap-frame');
    if (!frame) {
      frame = document.createElement('iframe');
      frame.id = 'gw-gmap-frame';
      frame.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;border:none;z-index:5';
      frame.allow = 'geolocation';
      document.getElementById('gw-map')?.after(frame);
    }
    frame.src = `https://maps.google.com/maps?q=${lat},${lng}&t=k&z=${Math.round(zoom)||15}&output=embed&hl=${currentLang==='ar'?'ar':'en'}`;
    frame.style.display = 'block';
    // Hide labels during satellite mode
    this._labelEls.forEach(el => el.style.opacity = '0');
  },

  _hideGmapFrame() {
    const f = document.getElementById('gw-gmap-frame');
    if (f) { f.style.display = 'none'; f.src = 'about:blank'; }
    this._labelEls.forEach(el => el.style.opacity = '1');
  },

  /* ═══════ STYLE SWITCHER ════════════════════════════════ */
  _setStyle(mode) {
    // Update active button
    ['street','dark','satellite'].forEach(m => {
      document.getElementById(`gx-sw-${m}`)?.classList.toggle('gx-sw-active', m === mode);
    });

    if (mode === 'satellite') {
      const c = this._map ? this._map.getCenter() : { lat: 24.7136, lng: 46.6753 };
      const z = this._map ? this._map.getZoom() : 15;
      this._showGmapFrame(c.lat, c.lng, z);
      this._styleMode = 'satellite';
      return;
    }

    this._hideGmapFrame();
    this._styleMode = mode;
    if (!this._map) return;

    const c = this._map.getCenter(), z = this._map.getZoom();
    this._map.setStyle(this._mapStyle(mode));
    this._map.once('styledata', () => {
      this._map.easeTo({ center: c, zoom: z, duration: 0 });
      this._markers.forEach(mk => mk.remove()); this._markers = [];
      if (this._popups) { this._popups.forEach(p => p.remove()); } this._popups = [];
      this._labelEls = [];
      DB.locations.forEach((loc, i) => {
        this._addZone(this._map, loc, this._C[i % this._C.length]);
        this._addLabel(this._map, loc, this._C[i % this._C.length]);
      });
    });
  },

  // Keep old toggleStyle for backward compat
  _toggleStyle() {
    const cycle = { street:'satellite', satellite:'dark', dark:'street' };
    this._setStyle(cycle[this._styleMode] || 'street');
  },

  _fly(lat, lng) {
    if (this._styleMode === 'satellite') {
      this._showGmapFrame(lat, lng, 17);
    } else if (this._map) {
      this._map.flyTo({ center:[lng, lat], zoom:17, duration:900, easing: t => t<.5?4*t*t*t:(t-1)*(2*t-2)*(2*t-2)+1 });
    }
  },

  /* ═══════ GOOGLE MAPS MODAL ═════════════════════════════ */
  _openGoogle() {
    const locs = DB.locations;
    const loc  = locs[0];
    const center = loc ? `${loc.lat},${loc.lng}` : '24.7136,46.6753';

    const tabsHtml = locs.length > 1
      ? `<div class="gx-gm-tabs">${locs.map((l,i)=>`
          <button class="gx-gm-tab" onclick="GpsModule._gmapJump(${l.lat},${l.lng},this)"
            style="--tc:${this._C[i%this._C.length]}">
            <i class="fas fa-map-pin"></i> ${l.name}
          </button>`).join('')}</div>`
      : '';

    App.openModal(currentLang==='ar'?'خرائط جوجل':'Google Maps', `
      ${tabsHtml}
      <div style="border-radius:16px;overflow:hidden;height:480px;position:relative;background:#e8e8e8">
        <iframe id="gw-modal-map"
          src="https://maps.google.com/maps?q=${center}&t=m&z=15&output=embed&hl=${currentLang==='ar'?'ar':'en'}"
          style="width:100%;height:100%;border:none" allow="geolocation">
        </iframe>
        <div class="gx-gm-typebar">
          <button onclick="GpsModule._gmapType('m')" title="${currentLang==='ar'?'خريطة':'Map'}"><i class="fas fa-map"></i></button>
          <button onclick="GpsModule._gmapType('k')" title="${currentLang==='ar'?'قمر صناعي':'Satellite'}"><i class="fas fa-satellite"></i></button>
          <button onclick="GpsModule._gmapType('h')" title="${currentLang==='ar'?'هايبرد':'Hybrid'}"><i class="fas fa-layer-group"></i></button>
        </div>
      </div>`, { size:'lg' });
  },

  _gmapJump(lat, lng, btn) {
    const f = document.getElementById('gw-modal-map'); if (!f) return;
    const t = f.src.match(/&t=([^&]+)/)?.[1] || 'm';
    f.src = `https://maps.google.com/maps?q=${lat},${lng}&t=${t}&z=16&output=embed&hl=${currentLang==='ar'?'ar':'en'}`;
    document.querySelectorAll('.gx-gm-tab').forEach(b=>b.classList.remove('active'));
    btn?.classList.add('active');
  },

  _gmapType(t) {
    const f = document.getElementById('gw-modal-map'); if (!f) return;
    const m = f.src.match(/q=([\d.,-]+),([\d.,-]+)/);
    if (m) f.src = `https://maps.google.com/maps?q=${m[1]},${m[2]}&t=${t}&z=16&output=embed&hl=${currentLang==='ar'?'ar':'en'}`;
  },

  /* ═══════ LOCATE ME ══════════════════════════════════════ */
  trackMe() {
    const box = document.getElementById('gw-myloc');
    if (!box) return;
    if (!navigator.geolocation) {
      box.innerHTML = `<div class="gx-empty"><i class="fas fa-ban" style="color:#f87171"></i><p>${currentLang==='ar'?'لا يدعم GPS':'Not supported'}</p></div>`;
      return;
    }
    box.innerHTML = `<div class="gx-empty"><i class="fas fa-spinner fa-spin" style="color:#38bdf8"></i><p>${currentLang==='ar'?'جارٍ التحديد...':'Locating...'}</p></div>`;

    navigator.geolocation.getCurrentPosition(pos => {
      const { latitude:lat, longitude:lng, accuracy } = pos.coords;
      const checks = DB.locations.map(loc => ({
        loc, d: Math.round(this._distanceM(lat, lng, loc.lat, loc.lng)),
        in: Math.round(this._distanceM(lat, lng, loc.lat, loc.lng)) <= loc.radius,
      })).sort((a,b) => a.d - b.d);
      const ok = checks.some(c => c.in);

      box.innerHTML = `
        <div class="gx-myloc-result">
          <div class="gx-myloc-status ${ok?'gx-in':'gx-out'}">
            <i class="fas ${ok?'fa-circle-check':'fa-circle-xmark'}"></i>
            ${ok?(currentLang==='ar'?'داخل النطاق':'In Zone'):(currentLang==='ar'?'خارج النطاق':'Out of Zone')}
          </div>
          <div class="gx-myloc-coords">${lat.toFixed(5)}, ${lng.toFixed(5)} &nbsp;·&nbsp; ±${Math.round(accuracy)}م</div>
          ${checks.slice(0,3).map(({loc,d,in:inside})=>`
            <div class="gx-myloc-zone ${inside?'gx-in':''}">
              <i class="fas ${inside?'fa-check':'fa-arrow-right'}" style="font-size:9px;opacity:.6"></i>
              <span>${loc.name}</span>
              <span class="gx-myloc-dist">${d<1000?d+'م':(d/1000).toFixed(1)+'كم'}</span>
            </div>`).join('')}
          <button onclick="GpsModule.trackMe()" class="gx-refresh-btn"><i class="fas fa-rotate"></i> ${currentLang==='ar'?'تحديث':'Refresh'}</button>
        </div>`;

      if (this._map && this._styleMode !== 'satellite') {
        if (this._userMarker) this._userMarker.remove();
        const el = document.createElement('div'); el.className = 'gx-me-dot';
        this._userMarker = new maplibregl.Marker({ element:el, anchor:'center' })
          .setLngLat([lng, lat])
          .setPopup(new maplibregl.Popup({ offset:16 }).setHTML(
            `<div style="padding:8px;font-size:12px;font-weight:600">${currentLang==='ar'?'موقعك':'You'}<br><small style="font-family:monospace;color:#888">${lat.toFixed(5)}, ${lng.toFixed(5)}</small></div>`
          ))
          .addTo(this._map);
        this._map.flyTo({ center:[lng, lat], zoom:16, duration:1000 });
      }
    }, err => {
      const m = {1:currentLang==='ar'?'رُفض الإذن':'Permission denied',2:currentLang==='ar'?'غير متاح':'Unavailable',3:currentLang==='ar'?'انتهت المهلة':'Timeout'};
      box.innerHTML = `<div class="gx-empty"><i class="fas fa-circle-xmark" style="color:#f87171"></i><p>${m[err.code]||'Error'}</p></div>`;
    }, { enableHighAccuracy:true, timeout:10000, maximumAge:30000 });
  },

  _distanceM(lat1,lng1,lat2,lng2) {
    const R=6371000,dLat=(lat2-lat1)*Math.PI/180,dLng=(lng2-lng1)*Math.PI/180;
    const a=Math.sin(dLat/2)**2+Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2;
    return R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
  },

  /* ═══════ CRUD ═══════════════════════════════════════════ */
  openAdd() {
    App.openModal(currentLang==='ar'?'إضافة منطقة جديدة':'Add New Zone', `
      <form onsubmit="GpsModule.saveLocation(event)">
        <div class="app-form-group">
          <label>${currentLang==='ar'?'اسم المنطقة':'Zone Name'}</label>
          <input class="app-form-input" type="text" name="name" required placeholder="${currentLang==='ar'?'مثال: المقر الرئيسي':'e.g. Head Office'}">
        </div>
        <div class="app-form-group">
          <label><i class="fas fa-link" style="color:var(--primary)"></i> ${currentLang==='ar'?'رابط Google Maps (اختياري)':'Google Maps link (optional)'}</label>
          <div style="display:flex;gap:8px">
            <input class="app-form-input" id="gw-url" type="url" dir="ltr" placeholder="https://maps.google.com/..." oninput="GpsModule._ex(this.value)" style="flex:1">
            <button type="button" class="btn btn-secondary btn-sm" onclick="GpsModule._ex(document.getElementById('gw-url').value)"><i class="fas fa-wand-magic-sparkles"></i></button>
          </div>
          <div id="gw-url-st" style="font-size:11px;margin-top:4px;min-height:14px"></div>
        </div>
        <div style="margin-bottom:12px">
          <button type="button" class="btn btn-secondary btn-sm" onclick="GpsModule._fillLoc()">
            <i class="fas fa-crosshairs"></i> ${currentLang==='ar'?'استخدام موقعي الحالي':'Use My Location'}
          </button>
        </div>
        <div class="app-form-row">
          <div class="app-form-group"><label>Latitude</label><input class="app-form-input" id="gw-lat" type="number" name="lat" step="0.000001" required></div>
          <div class="app-form-group"><label>Longitude</label><input class="app-form-input" id="gw-lng" type="number" name="lng" step="0.000001" required></div>
        </div>
        <div class="app-form-group">
          <label>${currentLang==='ar'?'نطاق السياج (متر)':'Geofence Radius (m)'}</label>
          <input class="app-form-input" type="number" name="radius" value="200" min="30" max="5000">
        </div>
        <div class="modal-footer" style="padding:0;margin-top:20px">
          <button type="button" class="btn btn-secondary" onclick="App.closeModal()">${currentLang==='ar'?'إلغاء':'Cancel'}</button>
          <button type="submit" class="btn btn-primary"><i class="fas fa-save"></i> ${currentLang==='ar'?'حفظ':'Save'}</button>
        </div>
      </form>`, { size:'sm' });
  },

  _ex(url) {
    const st = document.getElementById('gw-url-st');
    if (!url || url.length < 10) { if (st) st.innerHTML = ''; return; }
    const set = (a, b) => {
      const le=document.getElementById('gw-lat'), lge=document.getElementById('gw-lng');
      if (le) le.value=parseFloat(a).toFixed(6); if (lge) lge.value=parseFloat(b).toFixed(6);
      if (st) st.innerHTML=`<span style="color:var(--success)"><i class="fas fa-circle-check"></i> ${parseFloat(a).toFixed(4)}, ${parseFloat(b).toFixed(4)}</span>`;
    };
    for (const p of [/@(-?\d+\.?\d*),(-?\d+\.?\d*)/,/[?&]ll=(-?\d+\.?\d*),(-?\d+\.?\d*)/,/[?&]q=(-?\d+\.?\d*),(-?\d+\.?\d*)/,/!3d(-?\d+\.?\d*)!4d(-?\d+\.?\d*)/,/\/(-?\d+\.\d{4,}),(-?\d+\.\d{4,})/]) {
      const m=url.match(p); if (m) { set(m[1], m[2]); return; }
    }
    if (st) st.innerHTML=`<span style="color:var(--warning)"><i class="fas fa-triangle-exclamation"></i> ${currentLang==='ar'?'لم يُعثر على إحداثيات':'No coordinates found'}</span>`;
  },

  _fillLoc() {
    if (!navigator.geolocation) { App.toast(currentLang==='ar'?'لا يدعم GPS':'No GPS','warning'); return; }
    App.toast(currentLang==='ar'?'جارٍ التحديد...':'Locating...','info',3000);
    navigator.geolocation.getCurrentPosition(p => {
      const le=document.getElementById('gw-lat'), lge=document.getElementById('gw-lng');
      if (le) le.value=p.coords.latitude.toFixed(6); if (lge) lge.value=p.coords.longitude.toFixed(6);
      App.toast(currentLang==='ar'?'تم ✓':'Done ✓','success');
    }, ()=>App.toast(currentLang==='ar'?'تعذّر':'Failed','error'), {enableHighAccuracy:true,timeout:8000});
  },

  saveLocation(e) {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(e.target));
    DB.locations.push({ id:DB.nextId('loc'), name:d.name, lat:parseFloat(d.lat), lng:parseFloat(d.lng), radius:parseInt(d.radius)||200, active:true });
    App.closeModal();
    App.toast(currentLang==='ar'?'تمت الإضافة ✓':'Added ✓','success');
    this.render(document.getElementById('page-content'));
  },

  editLocation(id) {
    const loc = DB.locations.find(l=>l.id===id); if (!loc) return;
    App.openModal((currentLang==='ar'?'تعديل: ':'Edit: ')+loc.name, `
      <form onsubmit="GpsModule.updateLocation(event,'${id}')">
        <div class="app-form-group"><label>${currentLang==='ar'?'اسم المنطقة':'Zone Name'}</label>
          <input class="app-form-input" type="text" name="name" value="${loc.name}" required></div>
        <div class="app-form-row">
          <div class="app-form-group"><label>Latitude</label><input class="app-form-input" type="number" name="lat" step="0.000001" value="${loc.lat}" required></div>
          <div class="app-form-group"><label>Longitude</label><input class="app-form-input" type="number" name="lng" step="0.000001" value="${loc.lng}" required></div>
        </div>
        <div class="app-form-group"><label>${currentLang==='ar'?'النطاق (متر)':'Radius (m)'}</label>
          <input class="app-form-input" type="number" name="radius" value="${loc.radius}" min="30" max="5000"></div>
        <div class="settings-item" style="padding:12px 0">
          <div class="settings-item-info"><div class="settings-item-label">${currentLang==='ar'?'نشط':'Active'}</div></div>
          <div class="toggle-switch ${loc.active!==false?'on':''}" id="loc-tog" onclick="this.classList.toggle('on')"></div>
        </div>
        <div class="modal-footer" style="padding:0;margin-top:16px">
          <button type="button" class="btn btn-secondary" onclick="App.closeModal()">${currentLang==='ar'?'إلغاء':'Cancel'}</button>
          <button type="submit" class="btn btn-primary">${currentLang==='ar'?'حفظ':'Save'}</button>
        </div>
      </form>`,{size:'sm'});
  },

  updateLocation(e, id) {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(e.target));
    const loc = DB.locations.find(l=>l.id===id);
    if (loc) {
      loc.name   = d.name;
      loc.lat    = parseFloat(d.lat) || loc.lat;
      loc.lng    = parseFloat(d.lng) || loc.lng;
      loc.radius = parseInt(d.radius) || loc.radius;
      loc.active = document.getElementById('loc-tog')?.classList.contains('on') !== false;
    }
    App.closeModal();
    App.toast(currentLang==='ar'?'تم التحديث ✓':'Updated ✓','success');
    this.render(document.getElementById('page-content'));
  },

  deleteLocation(id) {
    const loc = DB.locations.find(l=>l.id===id); if (!loc) return;
    App.confirm(currentLang==='ar'?`حذف "${loc.name}"؟`:`Delete "${loc.name}"?`, () => {
      DB.locations.splice(DB.locations.findIndex(l=>l.id===id), 1);
      App.toast(currentLang==='ar'?'تم الحذف':'Deleted','info');
      this.render(document.getElementById('page-content'));
    });
  },

  /* ═══════ CSS ════════════════════════════════════════════ */
  _css() {
    const ex = document.getElementById('gx-css'); if (ex) ex.remove();
    const s = document.createElement('style'); s.id = 'gx-css';
    s.textContent = `

/* ── root layout ── */
.gx { display:flex; flex-direction:column; height:100%; gap:0; }

/* ════════════════════════════════════════
   STATS BAR
════════════════════════════════════════ */
.gx-statsbar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 20px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 16px 16px 0 0;
  border-bottom: none;
  flex-wrap: wrap;
}
.gx-stat {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 16px;
  background: var(--sbg);
  border: 1px solid var(--sc,var(--border));
  border-opacity: 0.2;
  border-color: color-mix(in srgb, var(--sc) 25%, transparent);
  border-radius: 12px;
  min-width: 0;
  transition: transform .2s, box-shadow .2s;
}
.gx-stat:hover { transform: translateY(-1px); box-shadow: 0 4px 16px var(--sbg); }
.gx-stat-icon {
  width: 34px; height: 34px;
  background: var(--sbg);
  border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  color: var(--sc); font-size: 14px; flex-shrink: 0;
}
.gx-stat-body { display:flex; flex-direction:column; }
.gx-stat-n { font-size: 20px; font-weight: 900; color: var(--sc); line-height: 1; }
.gx-stat-l { font-size: 10px; color: var(--text-muted); font-weight: 600; margin-top: 2px; }

.gx-statsbar-actions { margin-right: auto; display:flex; gap:8px; flex-wrap:wrap; }
[data-lang="en"] .gx-statsbar-actions { margin-right:0; margin-left:auto; }

/* ── action buttons ── */
.gx-btn {
  display: flex; align-items: center; gap: 7px;
  padding: 8px 16px;
  border-radius: 10px;
  font-size: 12.5px; font-weight: 700;
  cursor: pointer; border: none;
  transition: all .18s;
}
.gx-btn-sat {
  background: rgba(99,102,241,.12);
  color: #818cf8;
  border: 1px solid rgba(99,102,241,.25);
}
.gx-btn-sat:hover { background: rgba(99,102,241,.22); }
.gx-btn-gmaps {
  background: linear-gradient(135deg, #4285F4, #34A853);
  color: white;
}
.gx-btn-gmaps:hover { filter: brightness(1.1); transform: translateY(-1px); box-shadow: 0 4px 16px rgba(66,133,244,.35); }
.gx-btn-add {
  background: linear-gradient(135deg, var(--primary), #4f46e5);
  color: white;
}
.gx-btn-add:hover { filter: brightness(1.1); transform: translateY(-1px); box-shadow: 0 4px 16px rgba(99,102,241,.4); }

/* ════════════════════════════════════════
   BODY
════════════════════════════════════════ */
.gx-body {
  display: grid;
  grid-template-columns: 300px 1fr;
  flex: 1;
  min-height: 0;
  border: 1px solid var(--border);
  border-radius: 0 0 16px 16px;
  overflow: hidden;
}

/* ════════════════════════════════════════
   LEFT PANEL
════════════════════════════════════════ */
.gx-panel {
  background: #0d0e1a;
  display: flex; flex-direction: column; gap: 0;
  overflow-y: auto;
  border-left: 1px solid rgba(255,255,255,.06);
  padding: 12px;
  gap: 10px;
}
[data-lang="en"] .gx-panel { border-left:none; border-right:1px solid rgba(255,255,255,.06); }

/* live badge */
.gx-live-badge {
  display: flex; align-items: center; gap: 8px;
  padding: 6px 12px;
  background: rgba(74,222,128,.08);
  border: 1px solid rgba(74,222,128,.18);
  border-radius: 20px;
  font-size: 10.5px; font-weight: 700; color: #4ade80;
  align-self: flex-start;
}
.gx-live-dot {
  width: 7px; height: 7px; border-radius: 50%; background: #4ade80; flex-shrink: 0;
  box-shadow: 0 0 0 0 rgba(74,222,128,.5);
  animation: gxPulse 2s ease-out infinite;
}
@keyframes gxPulse { 0%,100%{box-shadow:0 0 0 0 rgba(74,222,128,.5)} 60%{box-shadow:0 0 0 6px rgba(74,222,128,0)} }

/* card */
.gx-card {
  background: rgba(255,255,255,.03);
  border: 1px solid rgba(255,255,255,.07);
  border-radius: 14px;
  overflow: hidden;
}
.gx-card-flex { flex: 1; display:flex; flex-direction:column; min-height:180px; }
.gx-card-flex .gx-att-list { flex:1; overflow-y:auto; }
.gx-card-hd {
  display: flex; align-items: center; gap: 10px;
  padding: 12px 14px;
  border-bottom: 1px solid rgba(255,255,255,.06);
}
.gx-card-hd-icon {
  width: 32px; height: 32px; border-radius: 9px;
  display: flex; align-items: center; justify-content: center; font-size: 13px; flex-shrink: 0;
}
.gx-card-hd-title { font-size: 12px; font-weight: 800; color: rgba(255,255,255,.9); }
.gx-card-hd-sub { font-size: 10px; color: rgba(255,255,255,.35); margin-top: 1px; }

/* zones */
.gx-zones { padding: 6px; display:flex; flex-direction:column; gap:4px; }
.gx-zone {
  display: flex; align-items: center; gap: 9px;
  padding: 8px 10px;
  border-radius: 10px;
  border: 1px solid rgba(255,255,255,.04);
  cursor: pointer;
  transition: all .18s;
  border-right: 2px solid var(--zc);
}
[data-lang="en"] .gx-zone { border-right:1px solid rgba(255,255,255,.04); border-left:2px solid var(--zc); }
.gx-zone:hover { background: rgba(255,255,255,.06); transform: translateX(-2px); }
[data-lang="en"] .gx-zone:hover { transform: translateX(2px); }
.gx-zone-dot {
  width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0;
  position: relative;
}
.gx-zone-pulse {
  position: absolute; inset: -4px; border-radius: 50%;
  border: 2px solid currentColor;
  animation: gxZPulse 2s ease-out infinite;
}
@keyframes gxZPulse { 0%{transform:scale(1);opacity:.7} 100%{transform:scale(2.5);opacity:0} }
.gx-zone-info { flex:1; min-width:0; }
.gx-zone-name { font-size: 11.5px; font-weight: 700; color: rgba(255,255,255,.9); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.gx-zone-meta { display:flex; align-items:center; gap:6px; margin-top:3px; }
.gx-zone-tag { font-size: 9px; font-weight: 800; padding: 1px 7px; border-radius: 20px; }
.gx-zone-coords { font-size: 9.5px; color: rgba(255,255,255,.3); font-family: monospace; }
.gx-zone-acts { display:flex; align-items:center; gap:5px; flex-shrink:0; }
.gx-zone-status { font-size: 9.5px; font-weight: 800; padding: 2px 8px; border-radius: 20px; }
.gx-zone-on  { background: rgba(74,222,128,.12); color: #4ade80; }
.gx-zone-off { background: rgba(255,255,255,.06); color: rgba(255,255,255,.35); }
.gx-icon-btn {
  width: 24px; height: 24px; border-radius: 7px;
  background: transparent; border: 1px solid rgba(255,255,255,.08);
  color: rgba(255,255,255,.5); cursor:pointer; font-size: 9px;
  display:flex; align-items:center; justify-content:center;
  transition: all .15s;
}
.gx-icon-btn:hover { background: rgba(255,255,255,.12); color: #fff; }
.gx-icon-del:hover { background: rgba(248,113,113,.15); color: #f87171; border-color: rgba(248,113,113,.25); }

/* locate */
.gx-locate-btn {
  margin-right: auto;
  display: flex; align-items: center; gap: 5px;
  padding: 5px 12px;
  background: linear-gradient(135deg,#10b981,#059669);
  color: white; border: none; border-radius: 8px;
  cursor: pointer; font-size: 11px; font-weight: 700;
  transition: filter .15s;
}
[data-lang="en"] .gx-locate-btn { margin-right:0; margin-left:auto; }
.gx-locate-btn:hover { filter: brightness(1.12); }

/* myloc result */
.gx-myloc { padding: 6px 10px 10px; }
.gx-myloc-result { display:flex; flex-direction:column; gap:6px; }
.gx-myloc-status { display:flex; align-items:center; gap:6px; font-size:12px; font-weight:800; padding:6px 10px; border-radius:9px; }
.gx-in  { background: rgba(74,222,128,.12); color: #4ade80; }
.gx-out { background: rgba(248,113,113,.12); color: #f87171; }
.gx-unknown { background: rgba(255,255,255,.06); color: rgba(255,255,255,.4); }
.gx-myloc-coords { font-size: 9.5px; font-family: monospace; color: rgba(255,255,255,.35); padding: 0 2px; }
.gx-myloc-zone { display:flex; align-items:center; gap:6px; font-size:11px; color: rgba(255,255,255,.6); padding:4px 8px; border-radius:7px; background:rgba(255,255,255,.04); }
.gx-myloc-zone.gx-in { background: rgba(74,222,128,.08); color: rgba(255,255,255,.85); }
.gx-myloc-dist { margin-right:auto; font-weight:700; font-family:monospace; font-size:10px; }
[data-lang="en"] .gx-myloc-dist { margin-right:0; margin-left:auto; }
.gx-refresh-btn { width:100%; padding:5px; background:rgba(255,255,255,.06); color:rgba(255,255,255,.6); border:1px solid rgba(255,255,255,.1); border-radius:8px; cursor:pointer; font-size:11px; font-weight:700; }
.gx-refresh-btn:hover { background:rgba(255,255,255,.1); color:#fff; }

/* attendance */
.gx-att-list { padding: 6px; display:flex; flex-direction:column; gap:4px; }
.gx-att-row { display:flex; align-items:center; gap:8px; padding:6px 8px; border-radius:9px; transition:background .15s; }
.gx-att-row:hover { background: rgba(255,255,255,.05); }
.gx-att-info { flex:1; min-width:0; }
.gx-att-name { font-size: 11.5px; font-weight: 700; color: rgba(255,255,255,.85); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.gx-att-time { font-size: 10px; color: rgba(255,255,255,.35); }
.gx-att-status { display:flex; align-items:center; gap:4px; font-size: 10px; font-weight: 700; padding: 3px 8px; border-radius: 20px; white-space:nowrap; flex-shrink:0; }
.gx-att-status.gx-in  { background:rgba(74,222,128,.12); color:#4ade80; }
.gx-att-status.gx-out { background:rgba(248,113,113,.12); color:#f87171; }
.gx-att-status.gx-unknown { background:rgba(255,255,255,.06); color:rgba(255,255,255,.35); }

/* empty state */
.gx-empty { display:flex; flex-direction:column; align-items:center; gap:7px; padding:20px 10px; color:rgba(255,255,255,.25); font-size:11.5px; text-align:center; }
.gx-empty i { font-size:24px; }

/* ════════════════════════════════════════
   MAP AREA
════════════════════════════════════════ */
.gx-map-wrap { position:relative; flex:1; min-height:500px; }
#gw-map { position:absolute; inset:0; width:100%; height:100%; }

/* map style switcher */
.gx-map-switcher {
  position: absolute; top: 14px; left: 14px;
  z-index: 10;
  display: flex; gap: 4px;
  background: rgba(10,10,20,.75);
  backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255,255,255,.1);
  border-radius: 12px;
  padding: 4px;
}
[data-lang="en"] .gx-map-switcher { left:auto; right:14px; }
.gx-sw-btn {
  display: flex; align-items: center; gap: 6px;
  padding: 6px 12px;
  border-radius: 9px;
  border: none; background: transparent;
  color: rgba(255,255,255,.55); font-size: 11.5px; font-weight: 700;
  cursor: pointer; transition: all .18s;
}
.gx-sw-btn:hover { color: rgba(255,255,255,.85); background: rgba(255,255,255,.08); }
.gx-sw-active {
  background: rgba(99,102,241,.25) !important;
  color: #a5b4fc !important;
  border: 1px solid rgba(99,102,241,.3);
}

/* hint */
.gx-map-hint {
  position: absolute; bottom: 60px; left: 50%; transform: translateX(-50%);
  z-index: 10;
  display: flex; align-items: center; gap: 7px;
  padding: 7px 16px;
  background: rgba(10,10,20,.8);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255,255,255,.1);
  border-radius: 20px;
  font-size: 11.5px; font-weight: 700; color: rgba(255,255,255,.7);
  animation: gxHint 3s ease-out forwards;
}
@keyframes gxHint { 0%{opacity:0;transform:translateX(-50%) translateY(6px)} 15%{opacity:1;transform:translateX(-50%) translateY(0)} 75%{opacity:1} 100%{opacity:0} }

/* my location dot */
.gx-me-dot {
  width: 18px; height: 18px;
  background: #3b82f6;
  border: 3px solid white; border-radius: 50%;
  box-shadow: 0 0 0 0 rgba(59,130,246,.5);
  animation: gxMePulse 2.5s ease-out infinite;
}
@keyframes gxMePulse { 0%,100%{box-shadow:0 0 0 0 rgba(59,130,246,.4)} 60%{box-shadow:0 0 0 10px rgba(59,130,246,0)} }

/* ════════════════════════════════════════
   ANIMATED ZONE LABELS  ★
   anchor:'center' on a 20×20 wrapper.
   The dot fills the wrapper → sits exactly on lat/lng.
   Badge + rings use position:absolute and overflow freely.
════════════════════════════════════════ */

/* wrapper — fixed size, anchor:center points MapLibre here */
.gx-zone-label {
  width: 20px; height: 20px;
  position: relative;
  cursor: pointer;
  animation: gxLabelAppear .65s cubic-bezier(0.34,1.56,0.64,1) both,
             gxFloat 4s ease-in-out infinite;
  will-change: transform;
}
@keyframes gxLabelAppear {
  from { opacity:0; transform:scale(.3); }
  to   { opacity:1; transform:scale(1);  }
}
@keyframes gxFloat {
  0%,100% { transform: translateY(0);    }
  50%     { transform: translateY(-8px); }
}

/* ── center dot (fills the 20×20 wrapper) ── */
.gx-zl-dot {
  position: absolute; inset: 0;
  border-radius: 50%;
  border: 3px solid rgba(255,255,255,.92);
  box-shadow: 0 2px 14px var(--zc), 0 0 0 4px color-mix(in srgb,var(--zc) 20%,transparent);
  z-index: 2;
  display: flex; align-items: center; justify-content: center;
  transition: transform .2s, box-shadow .2s;
}
.gx-zone-label:hover .gx-zl-dot {
  transform: scale(1.4);
  box-shadow: 0 4px 20px var(--zc), 0 0 0 6px color-mix(in srgb,var(--zc) 25%,transparent);
}
.gx-zl-dot-inner {
  width: 7px; height: 7px; border-radius: 50%;
  background: rgba(255,255,255,.7);
}

/* ── rings — centered on wrapper, overflow outward ── */
.gx-zl-rings {
  position: absolute;
  top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none; z-index: 1;
}
.gx-zl-ring {
  position: absolute; border-radius: 50%;
  border: 1.5px solid; opacity: 0;
  top: 50%; left: 50%;
  transform: translate(-50%, -50%);
}
.gx-zl-rings.gx-zl-active .r1 { animation: gxRing 3.2s ease-out infinite 0.0s; }
.gx-zl-rings.gx-zl-active .r2 { animation: gxRing 3.2s ease-out infinite 1.1s; }
.gx-zl-rings.gx-zl-active .r3 { animation: gxRing 3.2s ease-out infinite 2.2s; }
@keyframes gxRing {
  0%   { width:20px;  height:20px;  opacity:.9; }
  100% { width:100px; height:100px; opacity:0;  }
}

/* ── floating badge — absolute ABOVE the dot, never moves anchor ── */
.gx-zl-badge {
  position: absolute;
  bottom: calc(100% + 12px);   /* sits above the 20px dot */
  left: 50%;
  transform: translateX(-50%);
  display: flex; align-items: center; gap: 6px;
  padding: 6px 12px 6px 9px;
  background: rgba(8,8,22,.92);
  backdrop-filter: blur(18px); -webkit-backdrop-filter: blur(18px);
  border: 1px solid rgba(255,255,255,.13);
  border-right: 2px solid var(--zc);
  border-radius: 24px;
  white-space: nowrap;
  z-index: 10;
  box-shadow: 0 8px 28px rgba(0,0,0,.5), 0 0 0 1px rgba(255,255,255,.04);
  transition: transform .22s, box-shadow .22s;
  overflow: hidden;
}
[data-lang="en"] .gx-zl-badge { border-right:1px solid rgba(255,255,255,.13); border-left:2px solid var(--zc); }
.gx-zone-label:hover .gx-zl-badge {
  transform: translateX(-50%) scale(1.06);
  box-shadow: 0 12px 36px rgba(0,0,0,.6), 0 0 22px color-mix(in srgb,var(--zc) 30%,transparent);
}

/* stem tip under the badge */
.gx-zl-stem-tip {
  position: absolute;
  bottom: -10px; left: 50%; transform: translateX(-50%);
  width: 2px; height: 10px; border-radius: 1px;
  opacity: .6;
}

/* badge bg glow */
.gx-zl-badge-glow {
  position: absolute; inset: 0; border-radius: inherit;
  opacity: .09; pointer-events: none;
}

/* zone name */
.gx-zl-name {
  font-size: 12.5px; font-weight: 800; color: rgba(255,255,255,.95);
  position: relative; z-index: 1; letter-spacing: .01em;
}
.gx-zone-label:hover .gx-zl-name {
  background: linear-gradient(90deg, rgba(255,255,255,.65) 0%,#fff 45%,rgba(255,255,255,.65) 100%);
  background-size: 200% auto;
  -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: gxShimmer 1.4s linear infinite;
}
@keyframes gxShimmer { to { background-position: 200% center; } }

/* radius pill */
.gx-zl-radius {
  font-size: 9.5px; font-weight: 800;
  padding: 2px 7px; border-radius: 20px;
  position: relative; z-index: 1;
}

/* live indicator */
.gx-zl-live {
  display: flex; align-items: center; gap: 4px;
  font-size: 9.5px; font-weight: 700; color: #4ade80;
  position: relative; z-index: 1;
}
.gx-zl-live-dot {
  width: 6px; height: 6px; border-radius: 50%;
  animation: gxPulse 2s ease-out infinite;
}

/* inactive zone */
.gx-zl-inactive { opacity:.5; filter:grayscale(.7); }

/* ── switcher separator ── */
.gx-sw-sep { width:1px; background:rgba(255,255,255,.12); margin:4px 2px; align-self:stretch; }

/* ════════════════════════════════════════
   GOOGLE MAPS MODAL
════════════════════════════════════════ */
.gx-gm-tabs { display:flex; gap:6px; flex-wrap:wrap; margin-bottom:12px; }
.gx-gm-tab {
  padding: 6px 14px; border-radius: 20px;
  border: 1px solid rgba(0,0,0,.1);
  background: var(--bg-input); color: var(--text-secondary);
  cursor: pointer; font-size: 12px; font-weight: 700;
  transition: all .15s;
  border-left: 3px solid var(--tc);
}
[data-lang="en"] .gx-gm-tab { border-left:1px solid rgba(0,0,0,.1); border-right:3px solid var(--tc); }
.gx-gm-tab:hover, .gx-gm-tab.active { background: color-mix(in srgb, var(--tc) 12%, transparent); color: var(--tc); }
.gx-gm-typebar {
  position: absolute; bottom: 12px; right: 12px;
  display: flex; gap: 4px;
}
[data-lang="en"] .gx-gm-typebar { right: auto; left: 12px; }
.gx-gm-typebar button {
  padding: 7px 14px; border-radius: 9px;
  background: rgba(0,0,0,.72); backdrop-filter:blur(8px);
  color: white; border: 1px solid rgba(255,255,255,.15);
  cursor: pointer; font-size: 12px; font-weight: 700;
  transition: background .15s;
}
.gx-gm-typebar button:hover { background: rgba(0,0,0,.88); }

/* ── maplibre popup zone badge ── */
.gx-zone-popup { z-index: 9 !important; }
.gx-zone-popup .maplibregl-popup-content {
  background: transparent !important;
  padding: 0 !important;
  box-shadow: none !important;
  border-radius: 0 !important;
}
.gx-zone-popup .maplibregl-popup-tip { display: none !important; }
/* Float animation on the popup wrapper */
.gx-zone-popup { animation: gxFloat 4s ease-in-out infinite; }

/* ── maplibre overrides ── */
.maplibregl-popup-content { border-radius:14px!important; padding:0!important; overflow:hidden; box-shadow:0 12px 40px rgba(0,0,0,.22)!important; }
.maplibregl-ctrl-group { border-radius:12px!important; overflow:hidden; border:1px solid rgba(255,255,255,.12)!important; background:rgba(10,10,20,.8)!important; backdrop-filter:blur(12px)!important; }
.maplibregl-ctrl-group button { background:transparent!important; border:none!important; color:rgba(255,255,255,.8)!important; }
.maplibregl-ctrl-group button:hover { background:rgba(255,255,255,.1)!important; }
.maplibregl-ctrl-scale { background:rgba(10,10,20,.65)!important; border:1px solid rgba(255,255,255,.1)!important; border-radius:6px!important; font-size:10px!important; color:rgba(255,255,255,.7)!important; padding:2px 7px!important; }

/* ── responsive ── */
@media (max-width: 900px) {
  .gx-body { grid-template-columns: 1fr; }
  .gx-panel { max-height: 320px; flex-direction: row; overflow-x: auto; flex-wrap: nowrap; }
  .gx-card { min-width: 260px; }
  .gx-map-wrap { min-height: 400px; }
  .gx-statsbar { gap: 6px; padding: 10px 14px; }
  .gx-stat-n { font-size: 16px; }
}
@media (max-width: 600px) {
  .gx-stat { padding: 6px 10px; }
  .gx-btn { padding: 7px 12px; font-size: 11.5px; }
}
`;
    document.head.appendChild(s);
  },
};
