/* =========================================================
   AI ATTENDANCE ANALYTICS — تحليل الحضور والانصراف بالذكاء الاصطناعي
   رفع ملف بصمة (Excel/CSV) → اكتشاف أعمدة → إعدادات سياسة →
   محرك تحليل قواعد ذكي → Dashboard + رسوم + جدول + تنبيهات + تقرير نصي
   ========================================================= */

const AIAnalyticsModule = {

  // ─── الحالة العامة ────────────────────────────────────────
  _step: 'upload',           // upload | mapping | results
  _file: null,               // { name, size, rowCount }
  _headers: [],              // رؤوس الأعمدة كما وردت في الملف
  _rawRows: [],              // الصفوف الخام (Array<Object>)
  _sheetAOA: [],              // كل صفوف الورقة كمصفوفة صفوف خام (لاختيار صف العناوين)
  _headerRowIndex: 0,         // فهرس صف العناوين المُختار ضمن _sheetAOA
  _mapping: { id: '', name: '', department: '', branch: '', date: '', checkin: '', checkout: '' },
  _policy: null,              // إعدادات سياسة الدوام (تُهيّأ في _defaultPolicy)
  _quality: { issues: [], fixedCount: 0 },
  _analysis: null,            // نتيجة محرك التحليل
  _resultsTab: 'overview',    // overview | table | quality | ai
  _table: { search: '', sortKey: 'complianceRate', sortDir: 'asc', page: 1, pageSize: 20, dept: 'all', status: 'all' },
  _charts: {},

  /* ═══════════════════════════════════════════════════════
     نقطة الدخول
  ═══════════════════════════════════════════════════════ */
  render(container) {
    if (!this._policy) this._policy = this._defaultPolicy();
    container.innerHTML = `
      <div class="page-header">
        <div class="page-header-text">
          <h1><i class="fas fa-brain" style="color:#8b5cf6;margin-left:8px"></i>تحليل الحضور والانصراف بالذكاء الاصطناعي</h1>
          <p>ارفع ملف بصمة أو تصدير حضور، ودع النظام يكتشف الأعمدة ويحلل البيانات وفق سياسة الدوام تلقائياً</p>
        </div>
        <div class="page-header-actions" id="ai-hdr-actions"></div>
      </div>
      <div id="ai-analytics-body"></div>
    `;
    this._renderStep();
  },

  _renderStep() {
    const body = document.getElementById('ai-analytics-body');
    if (!body) return;
    Object.values(this._charts).forEach(c => c?.destroy?.());
    this._charts = {};

    if (this._step === 'upload')   return this._renderUploadStep(body);
    if (this._step === 'mapping')  return this._renderMappingStep(body);
    if (this._step === 'results')  return this._renderResultsStep(body);
  },

  _resetAll() {
    this._step = 'upload';
    this._file = null; this._headers = []; this._rawRows = [];
    this._sheetAOA = []; this._headerRowIndex = 0;
    this._mapping = { id: '', name: '', department: '', branch: '', date: '', checkin: '', checkout: '' };
    this._quality = { issues: [], fixedCount: 0 };
    this._analysis = null;
    document.getElementById('ai-hdr-actions').innerHTML = '';
    this._renderStep();
  },

  /* ═══════════════════════════════════════════════════════
     الخطوة 1 — رفع الملف (Drag & Drop)
  ═══════════════════════════════════════════════════════ */
  _renderUploadStep(body) {
    document.getElementById('ai-hdr-actions').innerHTML = '';
    body.innerHTML = `
      <div class="ai-upload-wrap">
        <div class="ai-dropzone" id="ai-dropzone"
             ondragover="event.preventDefault();this.classList.add('drag')"
             ondragleave="this.classList.remove('drag')"
             ondrop="AIAnalyticsModule._onDrop(event)"
             onclick="document.getElementById('ai-file-input').click()">
          <input type="file" id="ai-file-input" accept=".xlsx,.xls,.csv" style="display:none"
                 onchange="AIAnalyticsModule._onFileSelected(event)">
          <div class="ai-dz-icon"><i class="fas fa-cloud-arrow-up"></i></div>
          <div class="ai-dz-title">اسحب وأفلت ملف الحضور هنا</div>
          <div class="ai-dz-sub">أو اضغط للاختيار من جهازك — يدعم xlsx, xls, csv</div>
          <button class="btn btn-primary" style="margin-top:14px" onclick="event.stopPropagation();document.getElementById('ai-file-input').click()">
            <i class="fas fa-folder-open"></i> اختيار ملف
          </button>
        </div>
        <div id="ai-file-progress" style="display:none" class="ai-file-card">
          <div class="ai-file-icon"><i class="fas fa-file-excel"></i></div>
          <div class="ai-file-info">
            <div class="ai-file-name" id="ai-file-name">—</div>
            <div class="ai-file-meta" id="ai-file-meta">—</div>
            <div class="ai-progress-bar"><div class="ai-progress-fill" id="ai-progress-fill"></div></div>
          </div>
        </div>
        <div class="ai-upload-hints">
          <div class="ai-hint-item"><i class="fas fa-check-circle"></i> يكتشف النظام الأعمدة تلقائياً (رقم الموظف، الاسم، التاريخ، الدخول، الخروج)</div>
          <div class="ai-hint-item"><i class="fas fa-check-circle"></i> يمكنك تعديل الربط يدوياً إذا أخطأ الاكتشاف التلقائي</div>
          <div class="ai-hint-item"><i class="fas fa-check-circle"></i> التحليل يتم بالكامل داخل المتصفح — بياناتك لا تُرسل لأي خادم خارجي</div>
        </div>
      </div>
    `;
  },

  _onDrop(e) {
    e.preventDefault();
    document.getElementById('ai-dropzone').classList.remove('drag');
    const file = e.dataTransfer.files?.[0];
    if (file) this._processFile(file);
  },

  _onFileSelected(e) {
    const file = e.target.files?.[0];
    if (file) this._processFile(file);
  },

  _processFile(file) {
    const validExt = /\.(xlsx|xls|csv)$/i.test(file.name);
    if (!validExt) { App.toast('صيغة الملف غير مدعومة — يرجى رفع xlsx أو xls أو csv', 'error'); return; }
    if (file.size > 30 * 1024 * 1024) { App.toast('حجم الملف كبير جداً (الحد الأقصى 30MB)', 'error'); return; }

    const progressCard = document.getElementById('ai-file-progress');
    const fill = document.getElementById('ai-progress-fill');
    progressCard.style.display = 'flex';
    document.getElementById('ai-file-name').textContent = file.name;
    document.getElementById('ai-file-meta').textContent = `${this._formatSize(file.size)} — جارٍ القراءة...`;
    fill.style.width = '15%';

    const reader = new FileReader();
    reader.onprogress = (ev) => {
      if (ev.lengthComputable) fill.style.width = Math.max(15, Math.round((ev.loaded / ev.total) * 70)) + '%';
    };
    reader.onload = (ev) => {
      fill.style.width = '85%';
      try {
        // ملفات CSV تُقرأ كنص UTF-8 صريح لتفادي أخطاء ترميز الأحرف العربية —
        // بينما xlsx/xls ثنائية وتُقرأ كمصفوفة بايتات (SheetJS يتولى ترميزها الداخلي)
        const isCsv = /\.csv$/i.test(file.name);
        const wb = isCsv
          ? XLSX.read(ev.target.result, { type: 'string', cellDates: true, raw: true })
          : XLSX.read(new Uint8Array(ev.target.result), { type: 'array', cellDates: true });

        const sheet = wb.Sheets[wb.SheetNames[0]];
        // نقرأ الورقة كمصفوفة صفوف خام (بدون افتراض أن الصف الأول عناوين) —
        // كثير من تصديرات أجهزة البصمة تحتوي صفوف عنوان/شعار قبل صف العناوين الفعلي
        const aoa = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: true, defval: '', blankrows: false });
        if (!aoa.length) { App.toast('الملف لا يحتوي على بيانات', 'error'); progressCard.style.display = 'none'; return; }

        this._sheetAOA = aoa;
        this._file = { name: file.name, size: file.size };
        this._headerRowIndex = this._detectHeaderRowIndex(aoa);
        this._buildRowsFromHeaderIndex(this._headerRowIndex);

        fill.style.width = '100%';
        document.getElementById('ai-file-meta').textContent =
          `${this._formatSize(file.size)} — ${this._rawRows.length.toLocaleString('ar')} صف`;

        setTimeout(() => {
          this._mapping = this._autoDetectColumns(this._headers);
          this._step = 'mapping';
          this._renderStep();
        }, 350);
      } catch (err) {
        console.error(err);
        App.toast('تعذّرت قراءة الملف: ' + err.message, 'error');
        progressCard.style.display = 'none';
      }
    };
    if (/\.csv$/i.test(file.name)) reader.readAsText(file, 'utf-8');
    else reader.readAsArrayBuffer(file);
  },

  _cellDisplay(v) {
    if (v instanceof Date && !isNaN(v)) {
      const hasTime = v.getHours() || v.getMinutes() || v.getSeconds();
      return hasTime ? v.toLocaleString('ar') : v.toLocaleDateString('ar');
    }
    return String(v ?? '');
  },

  /* اكتشاف صف العناوين تلقائياً — يفحص أول 10 صفوف ويختار الأعلى تطابقاً مع أسماء الأعمدة المعروفة */
  _detectHeaderRowIndex(aoa) {
    const allAliases = Object.values(this._columnAliases).flat();
    let bestIdx = 0, bestScore = -1;
    for (let i = 0; i < Math.min(10, aoa.length); i++) {
      const row = aoa[i];
      if (!row || !row.some(c => String(c ?? '').trim())) continue; // صف فارغ بالكامل
      const score = row.reduce((s, cell) => {
        const n = this._normalizeHeader(cell);
        if (!n) return s;
        return s + (allAliases.some(a => n === a || n.includes(a)) ? 1 : 0);
      }, 0);
      if (score > bestScore) { bestScore = score; bestIdx = i; }
    }
    return bestScore > 0 ? bestIdx : 0;
  },

  _buildRowsFromHeaderIndex(idx) {
    const aoa = this._sheetAOA;
    const headerRow = aoa[idx] || [];
    this._headers = headerRow.map((h, i) => String(h ?? '').trim() || `عمود ${i + 1}`);
    this._rawRows = aoa.slice(idx + 1)
      .filter(row => row.some(c => String(c ?? '').trim()))
      .map(row => {
        const obj = {};
        this._headers.forEach((h, i) => { obj[h] = row[i] ?? ''; });
        return obj;
      });
    this._file.rowCount = this._rawRows.length;
  },

  _changeHeaderRow(idx) {
    idx = Math.max(0, Math.min(this._sheetAOA.length - 1, idx));
    this._headerRowIndex = idx;
    this._buildRowsFromHeaderIndex(idx);
    this._mapping = this._autoDetectColumns(this._headers);
    this._renderStep();
  },

  _formatSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  },

  _removeFile() { this._resetAll(); },

  /* ═══════════════════════════════════════════════════════
     اكتشاف الأعمدة تلقائياً
  ═══════════════════════════════════════════════════════ */
  _columnAliases: {
    id:         ['employee id','emp id','emp no','empno','employeeid','id','code','emp code','بادج','رقم الموظف','رقم موظف','كود الموظف','كود','الرقم الوظيفي','رقم البصمة','badge','user id','userid'],
    name:       ['employee name','emp name','name','full name','الاسم','اسم الموظف','اسم'],
    department: ['department','dept','القسم','الادارة','الإدارة','قسم'],
    branch:     ['branch','location','site','الفرع','الموقع','فرع'],
    date:       ['date','attendance date','day','التاريخ','تاريخ','يوم'],
    checkin:    ['check in','checkin','time in','in time','clock in','punch in','الدخول','وقت الدخول','حضور','دخول'],
    checkout:   ['check out','checkout','time out','out time','clock out','punch out','الخروج','وقت الخروج','انصراف','خروج'],
    // عمود وقت عام (بدون تمييز دخول/خروج) — شائع في تصديرات أجهزة البصمة الخام (سجل بصمات: صف لكل بصمة وليس صف لكل يوم)
    time:       ['time','punch time','scan time','clock time','الوقت','وقت البصمة','وقت'],
  },

  // أعمدة تعريفية شائعة في تصديرات أجهزة البصمة (اسم الجهاز، مصدر البيانات...) لا تُستخدم أبداً كحقل بيانات —
  // نستثنيها من مطابقة الاسم/إلخ حتى لا يسرق عمود "اسم الجهاز" حقل "اسم الموظف" عبر المطابقة الجزئية العامة
  _noiseHeader(n) {
    return /(جهاز|device|مصدر البيانات|data source)/.test(n);
  },

  _normalizeHeader(h) {
    return String(h || '').trim().toLowerCase()
      // توحيد أشكال الألف (أ إ آ ٱ) وحذف التشكيل والتطويل حتى تُطابق رؤوس الأعمدة أسماء بها همزات مختلفة
      .replace(/[أإآٱ]/g, 'ا').replace(/ى/g, 'ي').replace(/[ً-ٟـ]/g, '')
      .replace(/[\s_\-./]+/g, ' ').trim();
  },

  _autoDetectColumns(headers) {
    const norm = headers.map(h => ({ raw: h, n: this._normalizeHeader(h) }));
    const claimed = new Set();
    const pick = (field) => {
      const aliases = this._columnAliases[field];
      // مطابقة كاملة أولاً، ثم جزئية (يحتوي على) — نتجاهل الأعمدة المحجوزة مسبقاً لحقل آخر والأعمدة التعريفية الشائعة (اسم الجهاز...)
      let match = norm.find(h => !claimed.has(h.raw) && !this._noiseHeader(h.n) && aliases.includes(h.n));
      if (!match) match = norm.find(h => !claimed.has(h.raw) && !this._noiseHeader(h.n) && aliases.some(a => h.n.includes(a)));
      if (match) claimed.add(match.raw);
      return match ? match.raw : '';
    };
    // الحقول الأكثر تحديداً (رقم الموظف، التاريخ) تُحجز أولاً لتفادي سرقة عمودها من حقول أعم مثل الاسم
    const id = pick('id');
    const date = pick('date');
    let checkin = pick('checkin'), checkout = pick('checkout');
    // لا يوجد عمودا دخول/خروج منفصلان — نبحث عن عمود وقت عام (سجل بصمات خام: صف لكل بصمة)
    // ونربطه بكلا الحقلين، فيتولى محرك التحليل اعتبار أقدم بصمة كدخول وأحدث بصمة كخروج لكل يوم
    if (!checkin && !checkout) {
      const timeCol = pick('time');
      if (timeCol) { checkin = timeCol; checkout = timeCol; }
    }
    const name = pick('name');
    const department = pick('department');
    const branch = pick('branch');
    return { id, name, department, branch, date, checkin, checkout };
  },

  /* منتقي صف العناوين — يظهر فقط عند وجود شك (عناوين فارغة/غير مكتشفة) أو دائماً كخيار متقدم */
  _renderHeaderRowPicker() {
    const hasBlankHeaders = this._headers.some(h => /^عمود \d+$/.test(h));
    const previewRows = this._sheetAOA.slice(0, 8);
    return `
      <div class="card" style="margin-top:16px${hasBlankHeaders ? ';border-color:var(--warning)' : ''}">
        <div class="card-header">
          <h3><i class="fas fa-table-list" style="color:${hasBlankHeaders ? 'var(--warning)' : '#6366f1'}"></i> صف عناوين الأعمدة</h3>
        </div>
        <div class="card-body">
          ${hasBlankHeaders ? `<p style="color:var(--warning);font-size:13px;margin-bottom:12px"><i class="fas fa-triangle-exclamation"></i> لم يتمكن النظام من تحديد صف العناوين تلقائياً بثقة — يرجى اختيار الصف الصحيح من المعاينة أدناه</p>` : `<p style="color:var(--text-muted);font-size:13px;margin-bottom:12px">إذا احتوى الملف على صفوف عنوان/شعار قبل صف العناوين الفعلي، اختر الصف الصحيح هنا</p>`}
          <div style="overflow-x:auto">
            <table class="data-table" style="min-width:600px">
              <tbody>
                ${previewRows.map((row, i) => `
                  <tr style="cursor:pointer;${i === this._headerRowIndex ? 'background:rgba(99,102,241,.1)' : ''}" onclick="AIAnalyticsModule._changeHeaderRow(${i})">
                    <td style="width:36px"><input type="radio" name="ai-header-row" ${i === this._headerRowIndex ? 'checked' : ''} onclick="event.stopPropagation();AIAnalyticsModule._changeHeaderRow(${i})"></td>
                    ${row.slice(0, 8).map(c => `<td>${_esc(this._cellDisplay(c))}</td>`).join('')}
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  },

  /* ═══════════════════════════════════════════════════════
     الخطوة 2 — ربط الأعمدة + معاينة
  ═══════════════════════════════════════════════════════ */
  _renderMappingStep(body) {
    document.getElementById('ai-hdr-actions').innerHTML = `
      <button class="btn btn-secondary" onclick="AIAnalyticsModule._resetAll()"><i class="fas fa-rotate-left"></i> ملف جديد</button>
    `;

    const fields = [
      { key: 'id',         label: 'رقم الموظف',   required: true },
      { key: 'name',       label: 'اسم الموظف',   required: true },
      { key: 'department', label: 'القسم',         required: false },
      { key: 'branch',     label: 'الفرع',         required: false },
      { key: 'date',       label: 'التاريخ',       required: true },
      { key: 'checkin',    label: 'وقت الدخول',   required: true },
      { key: 'checkout',   label: 'وقت الخروج',   required: true },
    ];

    const preview = this._rawRows.slice(0, 20);

    body.innerHTML = `
      <div class="card">
        <div class="card-header">
          <h3><i class="fas fa-file-excel" style="color:#10b981"></i> ${_esc(this._file.name)}</h3>
          <span class="badge badge-secondary">${this._file.rowCount.toLocaleString('ar')} صف — ${this._formatSize(this._file.size)}</span>
        </div>
      </div>

      ${this._renderHeaderRowPicker()}

      <div class="card" style="margin-top:16px">
        <div class="card-header"><h3><i class="fas fa-arrows-left-right" style="color:#6366f1"></i> ربط الأعمدة</h3></div>
        <div class="card-body">
          <p style="color:var(--text-muted);font-size:13px;margin-bottom:14px">
            اكتشف النظام الأعمدة التالية تلقائياً — يمكنك تعديل أي ربط غير صحيح
          </p>
          ${this._mapping.checkin && this._mapping.checkin === this._mapping.checkout ? `
          <div style="background:rgba(99,102,241,.1);border:1px solid rgba(99,102,241,.3);border-radius:10px;padding:10px 14px;margin-bottom:14px;font-size:13px;color:var(--text-primary)">
            <i class="fas fa-circle-info" style="color:#6366f1"></i>
            تم ربط عمود الدخول والخروج بنفس العمود (سجل بصمات خام - صف لكل بصمة). سيعتبر النظام <strong>أقدم بصمة</strong> في اليوم دخولاً و<strong>أحدث بصمة</strong> خروجاً تلقائياً.
          </div>` : ''}
          <div class="ai-mapping-grid">
            ${fields.map(f => `
              <div class="app-form-group">
                <label>${f.label} ${f.required ? '<span style="color:var(--danger)">*</span>' : ''}</label>
                <select class="app-form-input" id="ai-map-${f.key}" onchange="AIAnalyticsModule._mapping['${f.key}']=this.value">
                  <option value="">— بدون —</option>
                  ${this._headers.map(h => `<option value="${_esc(h)}" ${this._mapping[f.key] === h ? 'selected' : ''}>${_esc(h)}</option>`).join('')}
                </select>
              </div>
            `).join('')}
          </div>
        </div>
      </div>

      <div class="card" style="margin-top:16px">
        <div class="card-header"><h3><i class="fas fa-table" style="color:#f59e0b"></i> معاينة أول 20 صف</h3></div>
        <div class="card-body" style="overflow-x:auto">
          <table class="data-table" style="min-width:700px">
            <thead><tr>${this._headers.map(h => `<th>${_esc(h)}</th>`).join('')}</tr></thead>
            <tbody>
              ${preview.map(row => `<tr>${this._headers.map(h => `<td>${_esc(this._cellDisplay(row[h]))}</td>`).join('')}</tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <div style="display:flex;justify-content:flex-end;margin-top:20px;gap:10px">
        <button class="btn btn-primary btn-lg" onclick="AIAnalyticsModule._openSettingsModal()">
          <i class="fas fa-sliders"></i> متابعة إلى إعدادات التحليل
        </button>
      </div>
    `;
  },

  /* ═══════════════════════════════════════════════════════
     إعدادات سياسة الدوام
  ═══════════════════════════════════════════════════════ */
  _defaultPolicy() {
    return {
      shiftStart: '09:00',
      shiftEnd: '17:00',
      grace: 15,
      breakMinutes: 60,
      overtimeEnabled: true,
      earlyLeaveEnabled: true,
      excludeHolidays: true,
      weeklyOff: [5, 6],   // الجمعة والسبت
      holidays: [],        // ['YYYY-MM-DD', ...]
    };
  },

  _openSettingsModal() {
    const required = ['id', 'name', 'date', 'checkin', 'checkout'];
    const missing = required.filter(f => !this._mapping[f]);
    if (missing.length) {
      App.toast('يرجى ربط جميع الأعمدة الإلزامية (رقم الموظف، الاسم، التاريخ، الدخول، الخروج)', 'error');
      return;
    }

    const p = this._policy;
    const weekDays = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

    const html = `
      <div class="ai-settings-form">
        <div class="ai-settings-section">
          <h4><i class="fas fa-clock"></i> أوقات الدوام</h4>
          <div class="ai-mapping-grid">
            <div class="app-form-group"><label>بداية الدوام</label>
              <input type="time" class="app-form-input" id="ps-start" value="${p.shiftStart}"></div>
            <div class="app-form-group"><label>نهاية الدوام</label>
              <input type="time" class="app-form-input" id="ps-end" value="${p.shiftEnd}"></div>
            <div class="app-form-group"><label>فترة السماح (دقيقة)</label>
              <input type="number" min="0" class="app-form-input" id="ps-grace" value="${p.grace}"></div>
            <div class="app-form-group"><label>مدة الاستراحة (دقيقة)</label>
              <input type="number" min="0" class="app-form-input" id="ps-break" value="${p.breakMinutes}"></div>
          </div>
        </div>

        <div class="ai-settings-section">
          <h4><i class="fas fa-calculator"></i> قواعد الاحتساب</h4>
          <label class="ai-check-row"><input type="checkbox" id="ps-overtime" ${p.overtimeEnabled ? 'checked' : ''}> احتساب العمل الإضافي</label>
          <label class="ai-check-row"><input type="checkbox" id="ps-earlyleave" ${p.earlyLeaveEnabled ? 'checked' : ''}> احتساب الانصراف المبكر</label>
          <label class="ai-check-row"><input type="checkbox" id="ps-holidays" ${p.excludeHolidays ? 'checked' : ''}> استبعاد أيام الإجازة من الغياب</label>
        </div>

        <div class="ai-settings-section">
          <h4><i class="fas fa-calendar-week"></i> أيام الإجازة الأسبوعية</h4>
          <div class="ai-weekday-row">
            ${weekDays.map((d, i) => `
              <label class="ai-weekday-chip">
                <input type="checkbox" data-wd="${i}" ${p.weeklyOff.includes(i) ? 'checked' : ''}>
                <span>${d}</span>
              </label>
            `).join('')}
          </div>
        </div>

        <div class="ai-settings-section">
          <h4><i class="fas fa-umbrella-beach"></i> الإجازات الرسمية</h4>
          <div style="display:flex;gap:8px;margin-bottom:10px">
            <input type="date" class="app-form-input" id="ps-holiday-date">
            <button class="btn btn-secondary" onclick="AIAnalyticsModule._addHolidayTag()"><i class="fas fa-plus"></i> إضافة</button>
          </div>
          <div class="ai-holiday-tags" id="ps-holiday-list">
            ${p.holidays.map(h => this._holidayTagHTML(h)).join('')}
          </div>
        </div>
      </div>
    `;

    App.openModal('إعدادات تحليل الحضور', html, { size: 'lg' });
    document.getElementById('global-modal').querySelector('.modal-footer')?.remove();
    const body = document.getElementById('modal-body');
    const footer = document.createElement('div');
    footer.className = 'modal-footer';
    footer.style.cssText = 'display:flex;justify-content:flex-end;gap:10px;margin-top:20px';
    footer.innerHTML = `
      <button class="btn btn-secondary" onclick="App.closeModal()">إلغاء</button>
      <button class="btn btn-primary" onclick="AIAnalyticsModule._runAnalysisFromModal()"><i class="fas fa-wand-magic-sparkles"></i> بدء التحليل</button>
    `;
    body.appendChild(footer);
  },

  _holidayTagHTML(dateStr) {
    return `<span class="ai-holiday-tag" data-date="${dateStr}">${dateStr}
      <i class="fas fa-xmark" onclick="AIAnalyticsModule._removeHolidayTag('${dateStr}')"></i></span>`;
  },

  _addHolidayTag() {
    const input = document.getElementById('ps-holiday-date');
    const val = input.value;
    if (!val) return;
    if (!this._policy.holidays.includes(val)) {
      this._policy.holidays.push(val);
      document.getElementById('ps-holiday-list').insertAdjacentHTML('beforeend', this._holidayTagHTML(val));
    }
    input.value = '';
  },

  _removeHolidayTag(dateStr) {
    this._policy.holidays = this._policy.holidays.filter(h => h !== dateStr);
    document.querySelector(`.ai-holiday-tag[data-date="${dateStr}"]`)?.remove();
  },

  _runAnalysisFromModal() {
    const p = this._policy;
    p.shiftStart = document.getElementById('ps-start').value || '09:00';
    p.shiftEnd = document.getElementById('ps-end').value || '17:00';
    p.grace = parseInt(document.getElementById('ps-grace').value, 10) || 0;
    p.breakMinutes = parseInt(document.getElementById('ps-break').value, 10) || 0;
    p.overtimeEnabled = document.getElementById('ps-overtime').checked;
    p.earlyLeaveEnabled = document.getElementById('ps-earlyleave').checked;
    p.excludeHolidays = document.getElementById('ps-holidays').checked;
    p.weeklyOff = Array.from(document.querySelectorAll('.ai-weekday-chip input:checked')).map(el => parseInt(el.dataset.wd, 10));

    App.closeModal();
    App.toast('جارٍ تحليل البيانات...', 'info');
    setTimeout(() => {
      this._analysis = this._analyze();
      this._step = 'results';
      this._resultsTab = 'overview';
      this._renderStep();
    }, 60);
  },

  /* ═══════════════════════════════════════════════════════
     أدوات تحويل التاريخ/الوقت
  ═══════════════════════════════════════════════════════ */
  _excelSerialToDate(serial) {
    const utcDays = Math.floor(serial - 25569);
    const utcMs = utcDays * 86400 * 1000;
    const base = new Date(utcMs);
    const frac = serial - Math.floor(serial);
    const totalSec = Math.round(frac * 86400);
    const h = Math.floor(totalSec / 3600), m = Math.floor((totalSec % 3600) / 60), s = totalSec % 60;
    return new Date(base.getUTCFullYear(), base.getUTCMonth(), base.getUTCDate(), h, m, s);
  },

  _parseDateValue(v) {
    if (v instanceof Date && !isNaN(v)) return new Date(v.getFullYear(), v.getMonth(), v.getDate());
    if (typeof v === 'number') { const d = this._excelSerialToDate(v); return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
    if (typeof v === 'string') {
      const s = v.trim();
      if (!s) return null;
      let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
      if (m) return new Date(+m[1], +m[2] - 1, +m[3]);
      m = s.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})/);
      if (m) {
        let [, a, b, y] = m;
        y = y.length === 2 ? '20' + y : y;
        // نفترض DD/MM/YYYY (الشائع في السياق العربي)
        return new Date(+y, +b - 1, +a);
      }
      const d = new Date(s);
      if (!isNaN(d)) return new Date(d.getFullYear(), d.getMonth(), d.getDate());
    }
    return null;
  },

  _parseTimeValue(v, baseDate) {
    if (v == null || v === '' || !baseDate) return null;
    let h = null, mnt = 0, sec = 0;
    if (v instanceof Date && !isNaN(v)) { h = v.getHours(); mnt = v.getMinutes(); sec = v.getSeconds(); }
    else if (typeof v === 'number') {
      const frac = v - Math.floor(v);
      const totalSec = Math.round(frac * 86400);
      h = Math.floor(totalSec / 3600); mnt = Math.floor((totalSec % 3600) / 60); sec = totalSec % 60;
    } else if (typeof v === 'string') {
      const s = v.trim();
      let m = s.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*([AaPp][Mm])?$/);
      if (m) {
        h = parseInt(m[1], 10); mnt = parseInt(m[2], 10); sec = m[3] ? parseInt(m[3], 10) : 0;
        if (m[4]) { const ap = m[4].toLowerCase(); if (ap === 'pm' && h < 12) h += 12; if (ap === 'am' && h === 12) h = 0; }
      } else {
        const d = new Date(s);
        if (!isNaN(d)) { h = d.getHours(); mnt = d.getMinutes(); sec = d.getSeconds(); }
      }
    }
    if (h == null) return null;
    return new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), h, mnt, sec);
  },

  _fmtHM(minutes) {
    const m = Math.round(minutes || 0);
    const h = Math.floor(m / 60), r = m % 60;
    return `${h}س ${r}د`;
  },

  _fmtDate(d) {
    // نبني السلسلة من مكوّنات التاريخ المحلي — toISOString يحوّل إلى UTC
    // ويُزيح التاريخ يوماً كاملاً للخلف في المناطق ذات الإزاحة الموجبة (مثل توقيت السعودية)
    const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, '0'), day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  },

  /* ═══════════════════════════════════════════════════════
     محرك التحليل
  ═══════════════════════════════════════════════════════ */
  _analyze() {
    const map = this._mapping;
    const p = this._policy;
    const [sh, sm] = p.shiftStart.split(':').map(Number);
    const [eh, em] = p.shiftEnd.split(':').map(Number);
    const holidaySet = new Set(p.holidays);
    const weeklyOffSet = new Set(p.weeklyOff);

    // وضع "سجل بصمات خام": نفس العمود مربوط للدخول والخروج — كل صف بصمة واحدة فقط،
    // ويُحسب دخول/خروج اليوم لاحقاً من أقدم/أحدث بصمة (انظر تجميع dayMap أدناه)
    const singlePunch = !!(map.checkin && map.checkout && map.checkin === map.checkout);

    const issues = [];
    const parsed = [];

    this._rawRows.forEach((row, idx) => {
      const empId = String(row[map.id] ?? '').trim();
      const empName = String(row[map.name] ?? '').trim();
      const department = map.department ? String(row[map.department] ?? '').trim() : '';
      const branch = map.branch ? String(row[map.branch] ?? '').trim() : '';
      const dateVal = this._parseDateValue(row[map.date]);
      let checkIn = dateVal ? this._parseTimeValue(row[map.checkin], dateVal) : null;
      let checkOut = singlePunch ? checkIn : (dateVal ? this._parseTimeValue(row[map.checkout], dateVal) : null);

      if (!empId || !dateVal) {
        issues.push({ type: 'missing', rowIndex: idx, empId, empName, date: dateVal ? this._fmtDate(dateVal) : '—', desc: 'بيانات ناقصة (رقم موظف أو تاريخ مفقود)' });
        return;
      }
      if (!singlePunch) {
        if (checkIn && !checkOut) issues.push({ type: 'no-checkout', rowIndex: idx, empId, empName, date: this._fmtDate(dateVal), desc: 'دخول بدون خروج' });
        if (!checkIn && checkOut) issues.push({ type: 'no-checkin', rowIndex: idx, empId, empName, date: this._fmtDate(dateVal), desc: 'خروج بدون دخول' });
        if (checkIn && checkOut) {
          const diffH = (checkOut - checkIn) / 3600000;
          if (diffH <= 0 || diffH > 16) issues.push({ type: 'unreasonable', rowIndex: idx, empId, empName, date: this._fmtDate(dateVal), desc: `ساعات عمل غير منطقية (${diffH.toFixed(1)} ساعة)` });
        }
      }

      parsed.push({ empId, empName, department, branch, date: dateVal, checkIn, checkOut, rowIndex: idx });
    });

    // اكتشاف السجلات المكررة (نفس الموظف + نفس اليوم + نفس الدخول/الخروج)
    const dupMap = new Map();
    parsed.forEach(r => {
      const key = `${r.empId}|${this._fmtDate(r.date)}|${r.checkIn ? r.checkIn.getTime() : ''}|${r.checkOut ? r.checkOut.getTime() : ''}`;
      if (!dupMap.has(key)) dupMap.set(key, []);
      dupMap.get(key).push(r);
    });
    dupMap.forEach((group) => {
      if (group.length > 1) {
        group.slice(1).forEach(r => issues.push({ type: 'duplicate', rowIndex: r.rowIndex, empId: r.empId, empName: r.empName, date: this._fmtDate(r.date), desc: 'سجل مكرر' }));
      }
    });

    this._quality = { issues, fixedCount: 0 };

    // تجميع سجلات كل موظف/يوم (أقدم دخول + أحدث خروج)
    const dayMap = new Map();
    const employees = new Map();
    parsed.forEach(r => {
      const dayKey = `${r.empId}|${this._fmtDate(r.date)}`;
      if (!dayMap.has(dayKey)) dayMap.set(dayKey, { empId: r.empId, empName: r.empName, department: r.department, branch: r.branch, date: r.date, checkIn: r.checkIn, checkOut: r.checkOut });
      else {
        const e = dayMap.get(dayKey);
        if (r.checkIn && (!e.checkIn || r.checkIn < e.checkIn)) e.checkIn = r.checkIn;
        if (r.checkOut && (!e.checkOut || r.checkOut > e.checkOut)) e.checkOut = r.checkOut;
        if (r.empName) e.empName = r.empName;
        if (r.department) e.department = r.department;
        if (r.branch) e.branch = r.branch;
      }
      if (!employees.has(r.empId)) employees.set(r.empId, { empId: r.empId, empName: r.empName, department: r.department, branch: r.branch });
      else {
        const e = employees.get(r.empId);
        if (r.empName) e.empName = r.empName;
        if (r.department) e.department = r.department;
        if (r.branch) e.branch = r.branch;
      }
    });

    // في وضع سجل البصمات الخام: يوم فيه بصمة واحدة فقط لا يمكن تمييز دخوله من خروجه (نفس الوقت) — نُبلّغ عنه كخطأ جودة
    if (singlePunch) {
      dayMap.forEach((rec) => {
        if (rec.checkIn && rec.checkOut && rec.checkIn.getTime() === rec.checkOut.getTime()) {
          issues.push({ type: 'single-punch', rowIndex: -1, empId: rec.empId, empName: rec.empName, date: this._fmtDate(rec.date), desc: 'بصمة واحدة فقط في اليوم (دخول أو خروج غير مسجّل)' });
        }
      });
    }

    if (!parsed.length) {
      return { empty: true, overall: {}, employees: [], businessDays: [], dailyTrend: [], holidaySet, weeklyOffSet };
    }

    // نطاق التاريخ
    const allDates = parsed.map(r => r.date.getTime());
    const minDate = new Date(Math.min(...allDates));
    const maxDate = new Date(Math.max(...allDates));
    const allDays = [];
    for (let d = new Date(minDate); d <= maxDate; d.setDate(d.getDate() + 1)) allDays.push(new Date(d));

    const businessDays = allDays.filter(d => {
      if (weeklyOffSet.has(d.getDay())) return false;
      if (p.excludeHolidays && holidaySet.has(this._fmtDate(d))) return false;
      return true;
    });
    const businessDaySet = new Set(businessDays.map(d => this._fmtDate(d)));

    const empResults = [];
    const dailyPresentMap = new Map(businessDays.map(d => [this._fmtDate(d), 0]));

    employees.forEach((emp) => {
      let presentDays = 0, absentDays = 0, lateCount = 0, totalLateMinutes = 0;
      let earlyLeaveCount = 0, totalEarlyLeaveMinutes = 0, totalWorkedMinutes = 0, totalOvertimeMinutes = 0;
      let maxDayMinutes = 0;
      let noCheckoutDays = 0;
      let incompleteDays = 0;

      businessDays.forEach(day => {
        const dayKey = `${emp.empId}|${this._fmtDate(day)}`;
        const rec = dayMap.get(dayKey);
        if (!rec || (!rec.checkIn && !rec.checkOut)) { absentDays++; return; }
        presentDays++;

        // بصمة واحدة فقط لليوم (وضع سجل البصمات الخام) — لا يمكن احتساب تأخير/انصراف مبكر/ساعات عمل بثقة
        if (singlePunch && rec.checkIn && rec.checkOut && rec.checkIn.getTime() === rec.checkOut.getTime()) {
          incompleteDays++;
          dailyPresentMap.set(this._fmtDate(day), (dailyPresentMap.get(this._fmtDate(day)) || 0) + 1);
          return;
        }

        const shiftStart = new Date(day.getFullYear(), day.getMonth(), day.getDate(), sh, sm);
        const shiftEnd = new Date(day.getFullYear(), day.getMonth(), day.getDate(), eh, em);

        if (rec.checkIn) {
          const lateMin = Math.max(0, (rec.checkIn - shiftStart) / 60000 - p.grace);
          if (lateMin > 0) { lateCount++; totalLateMinutes += lateMin; }
        }
        if (!rec.checkOut) noCheckoutDays++;
        if (p.earlyLeaveEnabled && rec.checkOut) {
          const earlyMin = Math.max(0, (shiftEnd - rec.checkOut) / 60000);
          if (earlyMin > 0) { earlyLeaveCount++; totalEarlyLeaveMinutes += earlyMin; }
        }
        if (rec.checkIn && rec.checkOut && rec.checkOut > rec.checkIn) {
          const workedMin = Math.max(0, (rec.checkOut - rec.checkIn) / 60000 - p.breakMinutes);
          totalWorkedMinutes += workedMin;
          maxDayMinutes = Math.max(maxDayMinutes, workedMin);
          if (p.overtimeEnabled) {
            const otMin = Math.max(0, (rec.checkOut - shiftEnd) / 60000);
            totalOvertimeMinutes += otMin;
          }
        }
        dailyPresentMap.set(this._fmtDate(day), (dailyPresentMap.get(this._fmtDate(day)) || 0) + 1);
      });

      const workDays = businessDays.length;
      const complianceRate = workDays ? (presentDays / workDays) * 100 : 0;
      let status = 'excellent';
      if (complianceRate < 70) status = 'critical';
      else if (complianceRate < 85) status = 'warning';
      else if (complianceRate < 95 || lateCount > 2) status = 'good';

      empResults.push({
        ...emp, workDays, presentDays, absentDays, lateCount, totalLateMinutes,
        earlyLeaveCount, totalEarlyLeaveMinutes, totalWorkedMinutes, totalOvertimeMinutes,
        complianceRate, status, maxDayMinutes, noCheckoutDays, incompleteDays,
      });
    });

    empResults.sort((a, b) => b.complianceRate - a.complianceRate);

    const overall = {
      totalEmployees: empResults.length,
      workDays: businessDays.length,
      excludedDays: allDays.length - businessDays.length,
      presentDays: empResults.reduce((s, e) => s + e.presentDays, 0),
      absentDays: empResults.reduce((s, e) => s + e.absentDays, 0),
      lateCount: empResults.reduce((s, e) => s + e.lateCount, 0),
      totalLateMinutes: empResults.reduce((s, e) => s + e.totalLateMinutes, 0),
      earlyLeaveCount: empResults.reduce((s, e) => s + e.earlyLeaveCount, 0),
      totalWorkedMinutes: empResults.reduce((s, e) => s + e.totalWorkedMinutes, 0),
      totalOvertimeMinutes: empResults.reduce((s, e) => s + e.totalOvertimeMinutes, 0),
    };
    overall.attendanceRate = (overall.presentDays + overall.absentDays) ? (overall.presentDays / (overall.presentDays + overall.absentDays)) * 100 : 0;
    overall.avgWorkedMinutes = overall.totalEmployees ? overall.totalWorkedMinutes / overall.totalEmployees : 0;
    overall.best = empResults[0] || null;
    overall.worst = empResults[empResults.length - 1] || null;
    overall.mostLate = [...empResults].sort((a, b) => b.totalLateMinutes - a.totalLateMinutes)[0] || null;
    overall.mostAbsent = [...empResults].sort((a, b) => b.absentDays - a.absentDays)[0] || null;

    const dailyTrend = businessDays.map(d => ({ date: this._fmtDate(d), present: dailyPresentMap.get(this._fmtDate(d)) || 0, total: empResults.length }));

    const alerts = this._buildAlerts(empResults);

    return { empty: false, overall, employees: empResults, businessDays, dailyTrend, alerts, dayMap, minDate, maxDate, singlePunch };
  },

  _buildAlerts(empResults) {
    const alerts = [];
    empResults.forEach(e => {
      if (e.totalLateMinutes > 120) alerts.push({ level: 'warning', icon: 'fa-clock', text: `${e.empName || e.empId} تجاوز ساعتين من إجمالي التأخير (${this._fmtHM(e.totalLateMinutes)})` });
      if (e.maxDayMinutes > 720) alerts.push({ level: 'danger', icon: 'fa-triangle-exclamation', text: `${e.empName || e.empId} سجّل يوم عمل تجاوز 12 ساعة` });
      if (e.noCheckoutDays > 0) alerts.push({ level: 'warning', icon: 'fa-right-from-bracket', text: `${e.empName || e.empId} لم يسجّل خروج في ${e.noCheckoutDays} يوم` });
      if (e.absentDays >= 3) alerts.push({ level: 'danger', icon: 'fa-user-xmark', text: `${e.empName || e.empId} لديه غياب متكرر (${e.absentDays} يوم)` });
      if (e.lateCount >= 3) alerts.push({ level: 'warning', icon: 'fa-hourglass-half', text: `${e.empName || e.empId} لديه تأخير متكرر (${e.lateCount} مرة)` });
      if (e.incompleteDays > 0) alerts.push({ level: 'warning', icon: 'fa-fingerprint', text: `${e.empName || e.empId} سجّل بصمة واحدة فقط (دخول أو خروج مفقود) في ${e.incompleteDays} يوم` });
    });
    return alerts;
  },

  /* ═══════════════════════════════════════════════════════
     Auto Fix لجودة البيانات
  ═══════════════════════════════════════════════════════ */
  _autoFixIssues() {
    const fixableTypes = new Set(['duplicate', 'missing']);
    const before = this._quality.issues.length;
    const toRemoveRows = new Set(
      this._quality.issues.filter(i => fixableTypes.has(i.type)).map(i => i.rowIndex)
    );
    if (!toRemoveRows.size) { App.toast('لا توجد أخطاء يمكن إصلاحها تلقائياً', 'info'); return; }

    this._rawRows = this._rawRows.filter((_, idx) => !toRemoveRows.has(idx));
    App.toast(`تم إصلاح ${toRemoveRows.size} من أصل ${before} خطأ — جارٍ إعادة التحليل`, 'success');
    this._analysis = this._analyze(); // يعيد بناء قائمة الأخطاء من البيانات المنظّفة
    this._renderResultsStep(document.getElementById('ai-analytics-body'));
  },

  /* ═══════════════════════════════════════════════════════
     الخطوة 3 — النتائج (Dashboard / جدول / جودة / تقرير)
  ═══════════════════════════════════════════════════════ */
  _renderResultsStep(body) {
    document.getElementById('ai-hdr-actions').innerHTML = `
      <button class="btn btn-secondary" onclick="AIAnalyticsModule._openSettingsModal()"><i class="fas fa-sliders"></i> تعديل الإعدادات</button>
      <button class="btn btn-secondary" onclick="AIAnalyticsModule._exportExcel()"><i class="fas fa-file-excel"></i> تصدير Excel</button>
      <button class="btn btn-secondary" onclick="AIAnalyticsModule._exportCSVResults()"><i class="fas fa-file-csv"></i> تصدير CSV</button>
      <button class="btn btn-secondary" onclick="App.printPage()"><i class="fas fa-print"></i> طباعة</button>
      <button class="btn btn-danger" onclick="AIAnalyticsModule._resetAll()"><i class="fas fa-rotate-left"></i> ملف جديد</button>
    `;

    if (this._analysis.empty) {
      body.innerHTML = `<div class="empty-state"><div class="empty-icon"><i class="fas fa-circle-exclamation"></i></div>
        <div class="empty-title">لا توجد بيانات صالحة للتحليل</div>
        <p class="empty-desc">تحقق من ربط الأعمدة أو صحة الملف المرفوع</p></div>`;
      return;
    }

    const tabs = [
      { key: 'overview', label: 'نظرة عامة', icon: 'fa-gauge-high' },
      { key: 'table', label: 'جدول النتائج', icon: 'fa-table' },
      { key: 'quality', label: 'جودة البيانات والتنبيهات', icon: 'fa-triangle-exclamation', badge: this._quality.issues.length + this._analysis.alerts.length },
      { key: 'ai', label: 'التقرير الذكي', icon: 'fa-file-lines' },
    ];

    body.innerHTML = `
      <div class="ai-tabs">
        ${tabs.map(tb => `
          <button class="ai-tab-btn ${this._resultsTab === tb.key ? 'active' : ''}" onclick="AIAnalyticsModule._switchTab('${tb.key}')">
            <i class="fas ${tb.icon}"></i> ${tb.label}
            ${tb.badge ? `<span class="ai-tab-badge">${tb.badge}</span>` : ''}
          </button>
        `).join('')}
      </div>
      <div id="ai-tab-content"></div>
    `;
    this._renderTabContent();
  },

  _switchTab(key) {
    this._resultsTab = key;
    document.querySelectorAll('.ai-tab-btn').forEach((b, i) => {});
    this._renderResultsStep(document.getElementById('ai-analytics-body'));
  },

  _renderTabContent() {
    const el = document.getElementById('ai-tab-content');
    if (!el) return;
    if (this._resultsTab === 'overview') return this._renderOverviewTab(el);
    if (this._resultsTab === 'table') return this._renderTableTab(el);
    if (this._resultsTab === 'quality') return this._renderQualityTab(el);
    if (this._resultsTab === 'ai') return this._renderAiReportTab(el);
  },

  /* ── نظرة عامة (Dashboard + Charts) ───────────────────── */
  _renderOverviewTab(el) {
    const o = this._analysis.overall;
    const cards = [
      { v: o.totalEmployees, l: 'عدد الموظفين', i: 'fa-users', c: 'primary', ic: 'gradient-primary' },
      { v: o.presentDays.toLocaleString('ar'), l: 'أيام الحضور', i: 'fa-user-check', c: 'success', ic: 'gradient-success' },
      { v: o.absentDays.toLocaleString('ar'), l: 'أيام الغياب', i: 'fa-user-xmark', c: 'danger', ic: 'gradient-danger' },
      { v: o.lateCount.toLocaleString('ar'), l: 'مرات التأخير', i: 'fa-clock', c: 'warning', ic: 'gradient-warning' },
      { v: this._fmtHM(o.totalLateMinutes), l: 'إجمالي ساعات التأخير', i: 'fa-hourglass-half', c: 'warning', ic: 'gradient-warning' },
      { v: this._fmtHM(o.totalWorkedMinutes), l: 'إجمالي ساعات العمل', i: 'fa-briefcase', c: 'info', ic: 'gradient-cyan' },
      { v: this._fmtHM(o.totalOvertimeMinutes), l: 'إجمالي العمل الإضافي', i: 'fa-hourglass-end', c: 'info', ic: 'gradient-cyan' },
      { v: this._fmtHM(o.avgWorkedMinutes), l: 'متوسط ساعات العمل/موظف', i: 'fa-chart-simple', c: 'primary', ic: 'gradient-primary' },
      { v: o.attendanceRate.toFixed(1) + '%', l: 'نسبة الالتزام العامة', i: 'fa-percent', c: 'success', ic: 'gradient-success' },
      { v: o.best ? (o.best.empName || o.best.empId) : '—', l: 'أفضل موظف', i: 'fa-trophy', c: 'success', ic: 'gradient-success' },
      { v: o.worst ? (o.worst.empName || o.worst.empId) : '—', l: 'أسوأ موظف', i: 'fa-arrow-trend-down', c: 'danger', ic: 'gradient-danger' },
      { v: o.mostLate ? (o.mostLate.empName || o.mostLate.empId) : '—', l: 'الأكثر تأخيراً', i: 'fa-user-clock', c: 'warning', ic: 'gradient-warning' },
    ];

    el.innerHTML = `
      <div class="stat-cards">
        ${cards.map(c => `
          <div class="stat-card ${c.c} stagger-item">
            <div class="stat-icon ${c.ic}"><i class="fas ${c.i}"></i></div>
            <div class="stat-info"><div class="stat-value" style="font-size:${typeof c.v === 'string' && c.v.length > 10 ? '15px' : ''}">${_esc(String(c.v))}</div><div class="stat-label">${c.l}</div></div>
          </div>
        `).join('')}
      </div>

      <div class="grid-2" style="margin-top:20px">
        <div class="card">
          <div class="card-header"><h3><i class="fas fa-chart-pie" style="color:#6366f1"></i> الحضور مقابل الغياب</h3></div>
          <div class="card-body"><div class="chart-container" style="height:260px"><canvas id="ai-chart-attendance"></canvas></div></div>
        </div>
        <div class="card">
          <div class="card-header"><h3><i class="fas fa-chart-line" style="color:#10b981"></i> اتجاه الحضور اليومي</h3></div>
          <div class="card-body"><div class="chart-container" style="height:260px"><canvas id="ai-chart-trend"></canvas></div></div>
        </div>
      </div>
      <div class="grid-2" style="margin-top:20px">
        <div class="card">
          <div class="card-header"><h3><i class="fas fa-ranking-star" style="color:#f59e0b"></i> الأكثر تأخيراً (أعلى 10)</h3></div>
          <div class="card-body"><div class="chart-container" style="height:280px"><canvas id="ai-chart-late"></canvas></div></div>
        </div>
        <div class="card">
          <div class="card-header"><h3><i class="fas fa-hourglass-end" style="color:#06b6d4"></i> الأعلى عملاً إضافياً (أعلى 10)</h3></div>
          <div class="card-body"><div class="chart-container" style="height:280px"><canvas id="ai-chart-ot"></canvas></div></div>
        </div>
      </div>
    `;
    setTimeout(() => this._renderOverviewCharts(), 60);
  },

  _renderOverviewCharts() {
    const { color, grid, font } = App.getChartDefaults();
    const o = this._analysis.overall;
    const emps = this._analysis.employees;

    const c1 = document.getElementById('ai-chart-attendance');
    if (c1) this._charts.attendance = new Chart(c1, {
      type: 'doughnut',
      data: { labels: ['حضور', 'غياب'], datasets: [{ data: [o.presentDays, o.absentDays], backgroundColor: ['#10b981', '#ef4444'] }] },
      options: { plugins: { legend: { position: 'bottom', labels: { color, font: { family: font } } } } },
    });

    const c2 = document.getElementById('ai-chart-trend');
    if (c2) this._charts.trend = new Chart(c2, {
      type: 'line',
      data: {
        labels: this._analysis.dailyTrend.map(d => new Date(d.date).toLocaleDateString('ar', { day: 'numeric', month: 'short' })),
        datasets: [{ label: 'الحاضرون', data: this._analysis.dailyTrend.map(d => d.present), borderColor: '#6366f1', backgroundColor: 'rgba(99,102,241,.15)', fill: true, tension: 0.35 }],
      },
      options: { plugins: { legend: { display: false } }, scales: { x: { ticks: { color, font: { family: font } }, grid: { color: grid } }, y: { ticks: { color, font: { family: font } }, grid: { color: grid } } } },
    });

    const topLate = [...emps].sort((a, b) => b.totalLateMinutes - a.totalLateMinutes).slice(0, 10).filter(e => e.totalLateMinutes > 0);
    const c3 = document.getElementById('ai-chart-late');
    if (c3) this._charts.late = new Chart(c3, {
      type: 'bar',
      data: { labels: topLate.map(e => e.empName || e.empId), datasets: [{ label: 'دقائق التأخير', data: topLate.map(e => Math.round(e.totalLateMinutes)), backgroundColor: '#f59e0b' }] },
      options: { indexAxis: 'y', plugins: { legend: { display: false } }, scales: { x: { ticks: { color, font: { family: font } }, grid: { color: grid } }, y: { ticks: { color, font: { family: font } }, grid: { display: false } } } },
    });

    const topOt = [...emps].sort((a, b) => b.totalOvertimeMinutes - a.totalOvertimeMinutes).slice(0, 10).filter(e => e.totalOvertimeMinutes > 0);
    const c4 = document.getElementById('ai-chart-ot');
    if (c4) this._charts.ot = new Chart(c4, {
      type: 'bar',
      data: { labels: topOt.map(e => e.empName || e.empId), datasets: [{ label: 'دقائق إضافية', data: topOt.map(e => Math.round(e.totalOvertimeMinutes)), backgroundColor: '#06b6d4' }] },
      options: { indexAxis: 'y', plugins: { legend: { display: false } }, scales: { x: { ticks: { color, font: { family: font } }, grid: { color: grid } }, y: { ticks: { color, font: { family: font } }, grid: { display: false } } } },
    });
  },

  /* ── جدول النتائج ──────────────────────────────────────── */
  _renderTableTab(el) {
    const t = this._table;
    const depts = [...new Set(this._analysis.employees.map(e => e.department).filter(Boolean))];

    el.innerHTML = `
      <div class="card">
        <div class="card-body" style="display:flex;gap:10px;flex-wrap:wrap;align-items:center">
          <div class="toolbar-search" style="flex:1;min-width:200px">
            <i class="fas fa-magnifying-glass"></i>
            <input type="text" placeholder="بحث بالاسم أو الرقم..." value="${_esc(t.search)}"
              oninput="AIAnalyticsModule._table.search=this.value;AIAnalyticsModule._table.page=1;AIAnalyticsModule._renderTableTab(document.getElementById('ai-tab-content'))">
          </div>
          ${depts.length ? `
          <select class="toolbar-select" onchange="AIAnalyticsModule._table.dept=this.value;AIAnalyticsModule._table.page=1;AIAnalyticsModule._renderTableTab(document.getElementById('ai-tab-content'))">
            <option value="all">كل الأقسام</option>
            ${depts.map(d => `<option value="${_esc(d)}" ${t.dept === d ? 'selected' : ''}>${_esc(d)}</option>`).join('')}
          </select>` : ''}
          <select class="toolbar-select" onchange="AIAnalyticsModule._table.status=this.value;AIAnalyticsModule._table.page=1;AIAnalyticsModule._renderTableTab(document.getElementById('ai-tab-content'))">
            <option value="all">كل الحالات</option>
            <option value="excellent" ${t.status === 'excellent' ? 'selected' : ''}>ممتاز</option>
            <option value="good" ${t.status === 'good' ? 'selected' : ''}>جيد</option>
            <option value="warning" ${t.status === 'warning' ? 'selected' : ''}>تحذير</option>
            <option value="critical" ${t.status === 'critical' ? 'selected' : ''}>حرج</option>
          </select>
        </div>

        <div class="card-body" style="overflow-x:auto;padding-top:0">
          <table class="data-table" style="min-width:1100px">
            <thead>
              <tr>
                ${[
                  ['empId', 'رقم الموظف'], ['empName', 'الاسم'], ['department', 'القسم'],
                  ['workDays', 'أيام العمل'], ['presentDays', 'الحضور'], ['absentDays', 'الغياب'],
                  ['lateCount', 'مرات التأخير'], ['totalLateMinutes', 'إجمالي التأخير'],
                  ['totalWorkedMinutes', 'ساعات العمل'], ['totalOvertimeMinutes', 'الإضافي'],
                  ['complianceRate', 'نسبة الالتزام'], ['status', 'الحالة'],
                ].map(([k, l]) => `<th style="cursor:pointer" onclick="AIAnalyticsModule._sortTable('${k}')">${l} ${t.sortKey === k ? (t.sortDir === 'asc' ? '▲' : '▼') : ''}</th>`).join('')}
              </tr>
            </thead>
            <tbody id="ai-table-body"></tbody>
          </table>
        </div>
        <div class="card-body" id="ai-table-pagination" style="display:flex;justify-content:center;gap:6px"></div>
      </div>
    `;
    this._renderTableRows();
  },

  _sortTable(key) {
    const t = this._table;
    if (t.sortKey === key) t.sortDir = t.sortDir === 'asc' ? 'desc' : 'asc';
    else { t.sortKey = key; t.sortDir = 'asc'; }
    this._renderTableTab(document.getElementById('ai-tab-content'));
  },

  _statusMeta(status) {
    return {
      excellent: { label: 'ممتاز', badge: 'badge-success' },
      good: { label: 'جيد', badge: 'badge-info' },
      warning: { label: 'تحذير', badge: 'badge-warning' },
      critical: { label: 'حرج', badge: 'badge-danger' },
    }[status] || { label: status, badge: 'badge-secondary' };
  },

  _filteredEmployees() {
    const t = this._table;
    const q = t.search.trim().toLowerCase();
    let list = this._analysis.employees.filter(e => {
      const matchQ = !q || (e.empName || '').toLowerCase().includes(q) || (e.empId || '').toLowerCase().includes(q);
      const matchDept = t.dept === 'all' || e.department === t.dept;
      const matchStatus = t.status === 'all' || e.status === t.status;
      return matchQ && matchDept && matchStatus;
    });
    list.sort((a, b) => {
      const av = a[t.sortKey], bv = b[t.sortKey];
      const cmp = typeof av === 'string' ? av.localeCompare(bv, 'ar') : (av - bv);
      return t.sortDir === 'asc' ? cmp : -cmp;
    });
    return list;
  },

  _renderTableRows() {
    const tbody = document.getElementById('ai-table-body');
    if (!tbody) return;
    const t = this._table;
    const filtered = this._filteredEmployees();
    const totalPages = Math.max(1, Math.ceil(filtered.length / t.pageSize));
    t.page = Math.min(t.page, totalPages);
    const pageRows = filtered.slice((t.page - 1) * t.pageSize, t.page * t.pageSize);

    if (!pageRows.length) {
      tbody.innerHTML = `<tr><td colspan="12"><div class="empty-state" style="padding:30px"><div class="empty-title">لا توجد نتائج مطابقة</div></div></td></tr>`;
    } else {
      tbody.innerHTML = pageRows.map(e => {
        const sm = this._statusMeta(e.status);
        return `
          <tr style="cursor:pointer" onclick="AIAnalyticsModule._openEmployeeDetail('${_esc(e.empId)}')">
            <td>${_esc(e.empId)}</td>
            <td>${_esc(e.empName || '—')}</td>
            <td>${_esc(e.department || '—')}</td>
            <td>${e.workDays}</td>
            <td>${e.presentDays}</td>
            <td>${e.absentDays}</td>
            <td>${e.lateCount}</td>
            <td>${this._fmtHM(e.totalLateMinutes)}</td>
            <td>${this._fmtHM(e.totalWorkedMinutes)}</td>
            <td>${this._fmtHM(e.totalOvertimeMinutes)}</td>
            <td>${e.complianceRate.toFixed(1)}%</td>
            <td><span class="badge ${sm.badge}">${sm.label}</span></td>
          </tr>
        `;
      }).join('');
    }

    const pag = document.getElementById('ai-table-pagination');
    if (pag) {
      let html = `<button class="btn btn-ghost btn-sm" ${t.page <= 1 ? 'disabled' : ''} onclick="AIAnalyticsModule._table.page--;AIAnalyticsModule._renderTableRows()"><i class="fas fa-chevron-right"></i></button>`;
      html += `<span style="padding:6px 12px;font-size:13px;color:var(--text-muted)">صفحة ${t.page} من ${totalPages} — ${filtered.length} موظف</span>`;
      html += `<button class="btn btn-ghost btn-sm" ${t.page >= totalPages ? 'disabled' : ''} onclick="AIAnalyticsModule._table.page++;AIAnalyticsModule._renderTableRows()"><i class="fas fa-chevron-left"></i></button>`;
      pag.innerHTML = html;
    }
  },

  /* ── تفاصيل الموظف (Modal يومي بالتفصيل) ─────────────────── */
  _openEmployeeDetail(empId) {
    const emp = this._analysis.employees.find(e => e.empId === empId);
    if (!emp) return;
    const p = this._policy;
    const [sh, sm] = p.shiftStart.split(':').map(Number);
    const [eh, em] = p.shiftEnd.split(':').map(Number);

    const rows = this._analysis.businessDays.map(day => {
      const dayKey = `${empId}|${this._fmtDate(day)}`;
      const rec = this._analysis.dayMap.get(dayKey);
      const shiftStart = new Date(day.getFullYear(), day.getMonth(), day.getDate(), sh, sm);
      const shiftEnd = new Date(day.getFullYear(), day.getMonth(), day.getDate(), eh, em);
      if (!rec || (!rec.checkIn && !rec.checkOut)) {
        return { date: day, status: 'absent', checkIn: null, checkOut: null, worked: 0, late: 0, early: 0, ot: 0 };
      }
      if (this._analysis.singlePunch && rec.checkIn && rec.checkOut && rec.checkIn.getTime() === rec.checkOut.getTime()) {
        return { date: day, status: 'incomplete', checkIn: rec.checkIn, checkOut: null, worked: 0, late: 0, early: 0, ot: 0 };
      }
      const lateMin = rec.checkIn ? Math.max(0, (rec.checkIn - shiftStart) / 60000 - p.grace) : 0;
      const earlyMin = rec.checkOut ? Math.max(0, (shiftEnd - rec.checkOut) / 60000) : 0;
      const worked = (rec.checkIn && rec.checkOut && rec.checkOut > rec.checkIn) ? Math.max(0, (rec.checkOut - rec.checkIn) / 60000 - p.breakMinutes) : 0;
      const ot = (rec.checkIn && rec.checkOut && rec.checkOut > shiftEnd) ? Math.max(0, (rec.checkOut - shiftEnd) / 60000) : 0;
      let status = 'present';
      if (lateMin > 0) status = 'late';
      if (earlyMin > 0) status = 'early';
      return { date: day, status, checkIn: rec.checkIn, checkOut: rec.checkOut, worked, late: lateMin, early: earlyMin, ot };
    });

    const statusColor = { present: '#10b981', late: '#f59e0b', early: '#06b6d4', absent: '#ef4444', incomplete: '#8b5cf6' };
    const statusLabel = { present: 'حاضر', late: 'متأخر', early: 'انصراف مبكر', absent: 'غائب', incomplete: 'بصمة واحدة فقط' };

    const html = `
      <div style="margin-bottom:14px;display:flex;gap:16px;flex-wrap:wrap">
        <div><strong>${_esc(emp.empName || '—')}</strong> — ${_esc(emp.empId)}</div>
        ${emp.department ? `<div style="color:var(--text-muted)">${_esc(emp.department)}</div>` : ''}
        <div>نسبة الالتزام: <strong>${emp.complianceRate.toFixed(1)}%</strong></div>
      </div>
      <div style="max-height:420px;overflow:auto">
        <table class="data-table" style="min-width:640px">
          <thead><tr><th>التاريخ</th><th>الدخول</th><th>الخروج</th><th>ساعات العمل</th><th>التأخير</th><th>الانصراف المبكر</th><th>الإضافي</th><th>الحالة</th></tr></thead>
          <tbody>
            ${rows.map(r => `
              <tr>
                <td>${r.date.toLocaleDateString('ar', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                <td>${r.checkIn ? r.checkIn.toLocaleTimeString('ar', { hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                <td>${r.checkOut ? r.checkOut.toLocaleTimeString('ar', { hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                <td>${this._fmtHM(r.worked)}</td>
                <td>${r.late > 0 ? this._fmtHM(r.late) : '—'}</td>
                <td>${r.early > 0 ? this._fmtHM(r.early) : '—'}</td>
                <td>${r.ot > 0 ? this._fmtHM(r.ot) : '—'}</td>
                <td><span style="color:${statusColor[r.status]};font-weight:700">${statusLabel[r.status]}</span></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
    App.openModal(`تفاصيل الحضور — ${emp.empName || emp.empId}`, html, { size: 'lg' });
  },

  /* ── جودة البيانات والتنبيهات ─────────────────────────────── */
  _renderQualityTab(el) {
    const issues = this._quality.issues;
    const alerts = this._analysis.alerts;
    const typeLabel = { missing: 'بيانات ناقصة', 'no-checkout': 'دخول بدون خروج', 'no-checkin': 'خروج بدون دخول', unreasonable: 'ساعات غير منطقية', duplicate: 'سجل مكرر', 'single-punch': 'بصمة واحدة فقط' };
    const fixableCount = issues.filter(i => i.type === 'missing' || i.type === 'duplicate').length;

    el.innerHTML = `
      <div class="card">
        <div class="card-header">
          <h3><i class="fas fa-bug" style="color:#ef4444"></i> أخطاء جودة البيانات (${issues.length})</h3>
          ${fixableCount ? `<button class="btn btn-success btn-sm" onclick="AIAnalyticsModule._autoFixIssues()"><i class="fas fa-wand-magic-sparkles"></i> إصلاح تلقائي (${fixableCount})</button>` : ''}
        </div>
        <div class="card-body" style="overflow-x:auto">
          ${issues.length ? `
          <table class="data-table">
            <thead><tr><th>النوع</th><th>رقم الموظف</th><th>الاسم</th><th>التاريخ</th><th>الوصف</th></tr></thead>
            <tbody>
              ${issues.slice(0, 200).map(i => `
                <tr><td><span class="badge badge-secondary">${typeLabel[i.type] || i.type}</span></td>
                  <td>${_esc(i.empId || '—')}</td><td>${_esc(i.empName || '—')}</td><td>${_esc(i.date || '—')}</td><td>${_esc(i.desc)}</td></tr>
              `).join('')}
            </tbody>
          </table>
          ${issues.length > 200 ? `<p style="color:var(--text-muted);font-size:12px;margin-top:8px">عرض أول 200 من ${issues.length} خطأ</p>` : ''}
          ` : `<div class="empty-state" style="padding:20px"><div class="empty-title">لا توجد أخطاء — البيانات نظيفة ✓</div></div>`}
        </div>
      </div>

      <div class="card" style="margin-top:16px">
        <div class="card-header"><h3><i class="fas fa-bell" style="color:#f59e0b"></i> تنبيهات ذكية (${alerts.length})</h3></div>
        <div class="card-body">
          ${alerts.length ? alerts.slice(0, 100).map(a => `
            <div class="ai-alert-row ai-alert-${a.level}">
              <i class="fas ${a.icon}"></i> <span>${_esc(a.text)}</span>
            </div>
          `).join('') : `<div class="empty-state" style="padding:20px"><div class="empty-title">لا توجد تنبيهات حالياً</div></div>`}
        </div>
      </div>
    `;
  },

  /* ── التقرير الذكي النصي ──────────────────────────────────── */
  _generateAiReportText() {
    const o = this._analysis.overall;
    const emps = this._analysis.employees;
    const half = Math.floor(this._analysis.dailyTrend.length / 2);
    const firstHalf = this._analysis.dailyTrend.slice(0, half);
    const secondHalf = this._analysis.dailyTrend.slice(half);
    const avgRate = (arr) => arr.length ? arr.reduce((s, d) => s + (d.total ? d.present / d.total : 0), 0) / arr.length * 100 : 0;
    const r1 = avgRate(firstHalf), r2 = avgRate(secondHalf);
    const trendWord = r2 > r1 + 2 ? 'تحسّناً ملحوظاً' : (r2 < r1 - 2 ? 'تراجعاً ملحوظاً' : 'استقراراً نسبياً');

    const suggestions = [];
    if (o.attendanceRate < 85) suggestions.push('يُنصح بمراجعة أسباب الغياب المتكرر والتواصل مع الموظفين المعنيين لمعرفة العوائق.');
    if (o.totalEmployees && (o.totalLateMinutes / o.totalEmployees) > 60) suggestions.push('متوسط التأخير مرتفع — يُقترح مراجعة فترة السماح أو تطبيق سياسة أكثر صرامة تجاه التأخير المتكرر.');
    if (o.totalOvertimeMinutes / 60 > o.totalEmployees * 5) suggestions.push('حجم العمل الإضافي مرتفع نسبياً — يُنصح بمراجعة توزيع المهام وأعباء العمل لتفادي الإرهاق الوظيفي.');
    if (!suggestions.length) suggestions.push('المؤشرات العامة ضمن نطاق جيد — يُنصح بالاستمرار في المتابعة الدورية للحفاظ على مستوى الالتزام.');

    return `
ملخص أداء الحضور والانصراف للفترة من ${this._fmtDate(this._analysis.minDate)} إلى ${this._fmtDate(this._analysis.maxDate)}:

شملت الفترة ${o.totalEmployees} موظفاً على مدى ${o.workDays} يوم عمل رسمي. بلغت نسبة الالتزام العامة ${o.attendanceRate.toFixed(1)}%، حيث سُجّل ${o.presentDays} يوم حضور مقابل ${o.absentDays} يوم غياب.

سُجّلت ${o.lateCount} حالة تأخير بإجمالي ${this._fmtHM(o.totalLateMinutes)}، بينما بلغ إجمالي ساعات العمل الفعلية ${this._fmtHM(o.totalWorkedMinutes)} وإجمالي العمل الإضافي ${this._fmtHM(o.totalOvertimeMinutes)}.

${o.best ? `تصدّر الموظف "${o.best.empName || o.best.empId}" الترتيب بأعلى نسبة التزام (${o.best.complianceRate.toFixed(1)}%)، ` : ''}${o.worst ? `في حين سجّل "${o.worst.empName || o.worst.empId}" أدنى نسبة التزام (${o.worst.complianceRate.toFixed(1)}%).` : ''}

أظهر تحليل الاتجاه الزمني ${trendWord} في معدل الحضور بين النصف الأول والثاني من الفترة.

مقترحات لتحسين الالتزام:
${suggestions.map((s, i) => `${i + 1}. ${s}`).join('\n')}
    `.trim();
  },

  _renderAiReportTab(el) {
    const text = this._generateAiReportText();
    el.innerHTML = `
      <div class="card">
        <div class="card-header">
          <h3><i class="fas fa-file-lines" style="color:#8b5cf6"></i> تقرير إداري تلقائي</h3>
          <button class="btn btn-secondary btn-sm" onclick="navigator.clipboard.writeText(AIAnalyticsModule._generateAiReportText());App.toast('تم نسخ التقرير','success')"><i class="fas fa-copy"></i> نسخ</button>
        </div>
        <div class="card-body">
          <pre style="white-space:pre-wrap;font-family:inherit;line-height:2;font-size:14px;color:var(--text-primary)">${_esc(text)}</pre>
        </div>
      </div>
    `;
  },

  /* ═══════════════════════════════════════════════════════
     التصدير
  ═══════════════════════════════════════════════════════ */
  _exportRows() {
    return this._analysis.employees.map(e => ({
      'رقم الموظف': e.empId, 'الاسم': e.empName, 'القسم': e.department, 'الفرع': e.branch,
      'أيام العمل': e.workDays, 'الحضور': e.presentDays, 'الغياب': e.absentDays,
      'مرات التأخير': e.lateCount, 'إجمالي التأخير (دقيقة)': Math.round(e.totalLateMinutes),
      'الانصراف المبكر': e.earlyLeaveCount, 'ساعات العمل (دقيقة)': Math.round(e.totalWorkedMinutes),
      'الإضافي (دقيقة)': Math.round(e.totalOvertimeMinutes), 'نسبة الالتزام %': e.complianceRate.toFixed(1),
      'الحالة': this._statusMeta(e.status).label,
    }));
  },

  _exportCSVResults() { App.exportCSV(this._exportRows(), `attendance-analytics-${Date.now()}.csv`); },

  _exportExcel() {
    const ws = XLSX.utils.json_to_sheet(this._exportRows());
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'التحليل');
    XLSX.writeFile(wb, `attendance-analytics-${Date.now()}.xlsx`);
    App.toast('تم تصدير الملف بنجاح', 'success');
  },
};
