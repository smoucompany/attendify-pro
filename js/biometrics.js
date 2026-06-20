/* =========================================================
   ATTENDIFY PRO — BIOMETRIC AUTHENTICATION
   Face Recognition (face-api.js) + Fingerprint (WebAuthn)
   ========================================================= */

// Compatibility shim: works in admin app (App object) and employee portal (local fns)
const _BioUI = {
  toast(msg, type)      { if (typeof App !== 'undefined') App.toast(msg, type); else if (typeof showToast !== 'undefined') showToast(msg, type); },
  openModal(title, html, opts) {
    if (typeof App !== 'undefined') { App.openModal(title, html, opts); return; }
    if (typeof openModal !== 'undefined') { openModal(`<div class="modal-title">${title}</div>${html}`); return; }
  },
  closeModal()          { if (typeof App !== 'undefined') App.closeModal(); else if (typeof closeModal !== 'undefined') closeModal(); },
  userId()              { return (typeof App !== 'undefined' && App.state?.user?.id) || 'emp'; },
};

const Biometrics = {

  faceApiLoaded: false,
  faceApiLoading: false,
  _stream: null,

  // ─── MODELS BASE PATH ────────────────────────────────────
  MODELS_URL: 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.13/model',

  // ─── CAPABILITIES ────────────────────────────────────────
  canWebAuthn() {
    return !!(window.PublicKeyCredential && navigator.credentials);
  },

  canCamera() {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  },

  // ─── FACE-API LOADER ─────────────────────────────────────
  async loadFaceApi() {
    if (this.faceApiLoaded) return true;
    if (this.faceApiLoading) {
      // wait for loading to finish
      await new Promise(r => {
        const check = setInterval(() => { if (this.faceApiLoaded) { clearInterval(check); r(); } }, 200);
      });
      return true;
    }
    this.faceApiLoading = true;
    try {
      if (typeof faceapi === 'undefined') {
        await new Promise((res, rej) => {
          const s = document.createElement('script');
          s.src = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.13/dist/face-api.js';
          s.onload = res; s.onerror = rej;
          document.head.appendChild(s);
        });
      }
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(this.MODELS_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(this.MODELS_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(this.MODELS_URL),
      ]);
      this.faceApiLoaded = true;
      this.faceApiLoading = false;
      return true;
    } catch(e) {
      this.faceApiLoading = false;
      return false;
    }
  },

  // ─── CAMERA HELPERS ──────────────────────────────────────
  async startCamera(videoEl) {
    if (this._stream) this.stopCamera();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: 640, height: 480 } });
      videoEl.srcObject = stream;
      this._stream = stream;
      await videoEl.play();
      return true;
    } catch(e) {
      return false;
    }
  },

  stopCamera() {
    if (this._stream) {
      this._stream.getTracks().forEach(t => t.stop());
      this._stream = null;
    }
  },

  // ─── DETECT FACE FROM VIDEO ──────────────────────────────
  async detectFace(videoEl) {
    const opts = new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.5 });
    return faceapi.detectSingleFace(videoEl, opts).withFaceLandmarks().withFaceDescriptor();
  },

  // ─── GET STORED DESCRIPTOR FOR EMPLOYEE ──────────────────
  getStoredDescriptor(empId) {
    try {
      const raw = localStorage.getItem(`face-desc-${empId}`);
      if (!raw) return null;
      return new Float32Array(JSON.parse(raw));
    } catch(e) { return null; }
  },

  storeDescriptor(empId, descriptor) {
    localStorage.setItem(`face-desc-${empId}`, JSON.stringify(Array.from(descriptor)));
  },

  hasStoredFace(empId) {
    return !!localStorage.getItem(`face-desc-${empId}`);
  },

  // ─── FACE DISTANCE COMPARISON ────────────────────────────
  faceDistance(d1, d2) {
    return faceapi.euclideanDistance(d1, d2);
  },

  MATCH_THRESHOLD: 0.52, // strict matching (lower = stricter)

  // ─── WEBAUTHN REGISTRATION ───────────────────────────────
  async registerFingerprint(emp) {
    if (!this.canWebAuthn()) return { ok: false, error: 'WebAuthn not supported on this device' };

    const encoder = new TextEncoder();
    const userId  = encoder.encode(emp.id.padEnd(8, '0').slice(0, 8));
    const challenge = crypto.getRandomValues(new Uint8Array(32));

    try {
      const credential = await navigator.credentials.create({
        publicKey: {
          challenge,
          rp: { name: 'Attendify Pro', id: location.hostname || 'localhost' },
          user: { id: userId, name: emp.email || emp.no, displayName: emp.name },
          pubKeyCredParams: [
            { type: 'public-key', alg: -7  }, // ES256
            { type: 'public-key', alg: -257 }, // RS256
          ],
          authenticatorSelection: {
            authenticatorAttachment: 'platform',
            userVerification: 'required',
            residentKey: 'preferred',
          },
          timeout: 60000,
        }
      });

      // Store credential ID
      localStorage.setItem(`wa-cred-${emp.id}`, btoa(String.fromCharCode(...new Uint8Array(credential.rawId))));
      return { ok: true };
    } catch(e) {
      if (e.name === 'NotAllowedError') return { ok: false, error: 'تم إلغاء العملية' };
      return { ok: false, error: e.message || 'فشل التسجيل' };
    }
  },

  hasFingerprint(empId) {
    return !!localStorage.getItem(`wa-cred-${empId}`);
  },

  // ─── WEBAUTHN AUTHENTICATION ─────────────────────────────
  async authenticateFingerprint(emp) {
    if (!this.canWebAuthn()) return { ok: false, error: 'WebAuthn not supported' };

    const storedRaw = localStorage.getItem(`wa-cred-${emp.id}`);
    if (!storedRaw) return { ok: false, error: 'لم يتم تسجيل البصمة لهذا الموظف' };

    const rawId = Uint8Array.from(atob(storedRaw), c => c.charCodeAt(0));
    const challenge = crypto.getRandomValues(new Uint8Array(32));

    try {
      await navigator.credentials.get({
        publicKey: {
          challenge,
          allowCredentials: [{ type: 'public-key', id: rawId, transports: ['internal'] }],
          userVerification: 'required',
          timeout: 60000,
        }
      });
      return { ok: true };
    } catch(e) {
      if (e.name === 'NotAllowedError') return { ok: false, error: 'تم إلغاء العملية' };
      return { ok: false, error: e.message || 'فشل التحقق' };
    }
  },

  // ─── UI: FACE REGISTRATION MODAL ─────────────────────────
  openFaceRegister(empId, onSuccess) {
    const emp = DB.getEmployee(empId);
    if (!emp) { _BioUI.toast('الموظف غير موجود', 'error'); return; }

    if (!this.canCamera()) {
      _BioUI.toast('الكاميرا غير متاحة على هذا الجهاز', 'error');
      return;
    }

    _BioUI.openModal(`تسجيل بصمة الوجه — ${emp.name}`, `
      <div style="text-align:center">
        <div style="position:relative;display:inline-block;margin-bottom:16px">
          <video id="bio-video" width="320" height="240" style="border-radius:16px;background:#000;display:block"></video>
          <canvas id="bio-canvas" width="320" height="240" style="position:absolute;top:0;left:0;border-radius:16px"></canvas>
          <div id="bio-overlay" style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;pointer-events:none">
            <div style="width:180px;height:210px;border:3px solid rgba(99,102,241,.8);border-radius:50%;box-shadow:0 0 0 4px rgba(99,102,241,.15)"></div>
          </div>
        </div>

        <div id="bio-status" style="font-size:14px;font-weight:600;color:var(--text-secondary);margin-bottom:16px;min-height:24px">
          <span class="loading-spinner" style="width:16px;height:16px;border-width:2px;vertical-align:middle;margin-left:6px"></span>
          جارٍ تحميل نماذج التعرف...
        </div>

        <div style="display:flex;gap:10px;justify-content:center">
          <button id="bio-capture-btn" class="btn btn-primary" onclick="Biometrics._captureFace('${empId}', ${JSON.stringify(!!onSuccess)})" disabled>
            <i class="fas fa-camera"></i> التقاط الوجه
          </button>
          <button class="btn btn-secondary" onclick="Biometrics._closeFaceModal()">إلغاء</button>
        </div>
        <p style="font-size:11px;color:var(--text-muted);margin-top:12px">ضع وجهك داخل الإطار وانظر مباشرةً للكاميرا ثم اضغط التقاط</p>
      </div>
    `, { size: 'sm' });

    this._pendingFaceCallback = onSuccess;
    this._initFaceRegister(empId);
  },

  async _initFaceRegister(empId) {
    const setStatus = (msg, color='var(--text-secondary)') => {
      const el = document.getElementById('bio-status');
      if (el) el.innerHTML = `<span style="color:${color}">${msg}</span>`;
    };

    const video = document.getElementById('bio-video');
    if (!video) return;

    const camOk = await this.startCamera(video);
    if (!camOk) { setStatus('❌ تعذّر الوصول للكاميرا — تأكد من السماح بالوصول', 'var(--danger)'); return; }

    setStatus('جارٍ تحميل نماذج التعرف على الوجه...');
    const apiOk = await this.loadFaceApi();
    if (!apiOk) { setStatus('❌ تعذّر تحميل نماذج التعرف — تحقق من الاتصال', 'var(--danger)'); return; }

    setStatus('✅ الكاميرا جاهزة — ضع وجهك في الإطار', 'var(--success)');
    const btn = document.getElementById('bio-capture-btn');
    if (btn) btn.disabled = false;

    // Live detection feedback
    const canvas = document.getElementById('bio-canvas');
    const ctx = canvas?.getContext('2d');
    this._liveDetect(video, canvas, ctx);
  },

  _liveDetect(video, canvas, ctx) {
    if (!canvas || !ctx || !document.getElementById('bio-video')) {
      this.stopCamera();
      return;
    }
    const opts = new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.4 });
    faceapi.detectSingleFace(video, opts).withFaceLandmarks().then(det => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (det) {
        const overlay = document.getElementById('bio-overlay');
        if (overlay) overlay.style.borderColor = 'var(--success)';
        // Draw points
        ctx.fillStyle = 'rgba(16,185,129,0.6)';
        det.landmarks.positions.forEach(p => {
          ctx.beginPath();
          ctx.arc(p.x * (canvas.width / video.videoWidth), p.y * (canvas.height / video.videoHeight), 2, 0, 2 * Math.PI);
          ctx.fill();
        });
      } else {
        const overlay = document.getElementById('bio-overlay');
        if (overlay) overlay.style.borderColor = 'rgba(99,102,241,.8)';
      }
      if (document.getElementById('bio-video')) {
        requestAnimationFrame(() => this._liveDetect(video, canvas, ctx));
      }
    }).catch(() => {
      if (document.getElementById('bio-video')) {
        setTimeout(() => this._liveDetect(video, canvas, ctx), 200);
      }
    });
  },

  async _captureFace(empId, hasCallback) {
    const video     = document.getElementById('bio-video');
    const setStatus = (msg, color='var(--text-secondary)') => {
      const el = document.getElementById('bio-status');
      if (el) el.innerHTML = `<span style="color:${color}">${msg}</span>`;
    };
    const btn = document.getElementById('bio-capture-btn');
    if (btn) { btn.disabled = true; btn.innerHTML = '<span class="loading-spinner" style="width:14px;height:14px;border-width:2px;vertical-align:middle;margin-left:6px"></span> جارٍ المعالجة...'; }

    setStatus('جارٍ الكشف عن الوجه...');

    const detection = await this.detectFace(video);
    if (!detection) {
      setStatus('❌ لم يُكتشف وجه — حاول مرة أخرى وتأكد من الإضاءة الجيدة', 'var(--danger)');
      if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-camera"></i> التقاط الوجه'; }
      return;
    }

    this.storeDescriptor(empId, detection.descriptor);
    this.stopCamera();
    setStatus(`✅ تم تسجيل بصمة الوجه بنجاح! (دقة: ${Math.round(detection.detection.score * 100)}%)`, 'var(--success)');

    const emp = DB.getEmployee(empId);
    DB.logAudit(_BioUI.userId(), 'تسجيل بصمة وجه', 'البيومترية', `تم تسجيل بصمة وجه الموظف: ${emp?.name}`);

    setTimeout(() => {
      _BioUI.closeModal();
      _BioUI.toast(`✅ تم تسجيل بصمة وجه ${emp?.name||''} بنجاح`, 'success');
      if (hasCallback && this._pendingFaceCallback) this._pendingFaceCallback();
    }, 1200);
  },

  _closeFaceModal() {
    this.stopCamera();
    _BioUI.closeModal();
  },

  // ─── UI: FACE VERIFICATION FOR CHECK-IN ──────────────────
  openFaceVerify(options = {}) {
    const { onSuccess, onFail, empId } = options;
    const targetLabel = empId
      ? `التحقق من ${DB.getEmployee(empId)?.name || 'الموظف'}`
      : 'التعرف على الوجه';

    _BioUI.openModal(targetLabel, `
      <div style="text-align:center">
        <div style="position:relative;display:inline-block;margin-bottom:16px">
          <video id="verify-video" width="320" height="240" style="border-radius:16px;background:#000;display:block"></video>
          <canvas id="verify-canvas" width="320" height="240" style="position:absolute;top:0;left:0;border-radius:16px;pointer-events:none"></canvas>
          <div id="verify-overlay" style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;pointer-events:none">
            <div style="width:180px;height:210px;border:3px solid rgba(99,102,241,.6);border-radius:50%"></div>
          </div>
        </div>

        <div id="verify-status" style="font-size:14px;font-weight:600;color:var(--text-secondary);min-height:48px;padding:0 8px;margin-bottom:12px">
          <span class="loading-spinner" style="width:14px;height:14px;border-width:2px;vertical-align:middle;margin-left:6px"></span>
          جارٍ التحضير...
        </div>

        <button class="btn btn-secondary" onclick="Biometrics._closeVerifyModal()">إلغاء</button>
        <p style="font-size:11px;color:var(--text-muted);margin-top:10px">انظر مباشرةً للكاميرا — سيتم التعرف تلقائياً</p>
      </div>
    `, { size: 'sm' });

    this._verifyCallbacks = { onSuccess, onFail, empId };
    this._runFaceVerify();
  },

  async _runFaceVerify() {
    const setStatus = (html) => {
      const el = document.getElementById('verify-status');
      if (el) el.innerHTML = html;
    };
    const setOverlay = (color) => {
      const el = document.getElementById('verify-overlay');
      if (el) el.querySelector('div').style.borderColor = color;
    };

    const video = document.getElementById('verify-video');
    if (!video) return;

    const camOk = await this.startCamera(video);
    if (!camOk) { setStatus('<span style="color:var(--danger)">❌ تعذّر الوصول للكاميرا</span>'); return; }

    setStatus('<span class="loading-spinner" style="width:14px;height:14px;border-width:2px;vertical-align:middle;margin-left:6px"></span> جارٍ تحميل نماذج التعرف...');
    const apiOk = await this.loadFaceApi();
    if (!apiOk) { setStatus('<span style="color:var(--danger)">❌ تعذّر تحميل النماذج — تحقق من الإنترنت</span>'); return; }

    // Build known faces
    const { empId } = this._verifyCallbacks;
    const labeledDescriptors = [];

    if (empId) {
      // Verify specific employee
      const desc = this.getStoredDescriptor(empId);
      if (!desc) {
        setStatus('<span style="color:var(--warning)">⚠️ لم يتم تسجيل بصمة هذا الموظف</span>');
        return;
      }
      const emp = DB.getEmployee(empId);
      labeledDescriptors.push(new faceapi.LabeledFaceDescriptors(emp?.name || empId, [desc]));
    } else {
      // Match against all registered employees
      DB.employees.forEach(emp => {
        const desc = this.getStoredDescriptor(emp.id);
        if (desc) labeledDescriptors.push(new faceapi.LabeledFaceDescriptors(emp.name, [desc]));
      });
      if (!labeledDescriptors.length) {
        setStatus('<span style="color:var(--warning)">⚠️ لا توجد بيانات وجه مسجّلة. سجّل البصمة أولاً من ملف الموظف.</span>');
        return;
      }
    }

    const matcher = new faceapi.FaceMatcher(labeledDescriptors, this.MATCH_THRESHOLD);
    setStatus('<i class="fas fa-face-smile" style="color:var(--primary)"></i> انظر للكاميرا — جارٍ التعرف...');

    let attempts = 0;
    const maxAttempts = 30;

    const tryDetect = async () => {
      if (!document.getElementById('verify-video')) return;
      if (attempts >= maxAttempts) {
        setStatus('<span style="color:var(--danger)">❌ لم يتم التعرف — حاول مرة أخرى في ضوء أفضل</span>');
        setOverlay('var(--danger)');
        if (this._verifyCallbacks.onFail) this._verifyCallbacks.onFail();
        return;
      }

      attempts++;
      const opts = new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.5 });
      const detection = await faceapi.detectSingleFace(video, opts).withFaceLandmarks().withFaceDescriptor().catch(() => null);

      if (!detection) {
        setOverlay('rgba(99,102,241,.5)');
        setTimeout(tryDetect, 300);
        return;
      }

      const result = matcher.findBestMatch(detection.descriptor);
      const canvas = document.getElementById('verify-canvas');
      const ctx = canvas?.getContext('2d');

      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'rgba(16,185,129,0.5)';
        detection.landmarks.positions.forEach(p => {
          ctx.beginPath();
          ctx.arc(p.x * (canvas.width/video.videoWidth), p.y * (canvas.height/video.videoHeight), 2, 0, 2*Math.PI);
          ctx.fill();
        });
      }

      if (result.label !== 'unknown') {
        setOverlay('#10b981');
        const confidence = Math.round((1 - result.distance) * 100);
        setStatus(`<span style="color:var(--success)">✅ تم التعرف: <strong>${result.label}</strong> (${confidence}%)</span>`);

        setTimeout(() => {
          this._closeVerifyModal();
          if (this._verifyCallbacks.onSuccess) this._verifyCallbacks.onSuccess(result.label);
        }, 1000);
      } else {
        setOverlay('rgba(245,158,11,.6)');
        setTimeout(tryDetect, 300);
      }
    };

    setTimeout(tryDetect, 500);
  },

  _closeVerifyModal() {
    this.stopCamera();
    _BioUI.closeModal();
  },

  // ─── UI: FINGERPRINT CHECK-IN MODAL ──────────────────────
  openFingerprintVerify(emp, onSuccess) {
    if (!this.canWebAuthn()) {
      _BioUI.openModal('بصمة الإصبع', `
        <div style="text-align:center;padding:20px 0">
          <div style="font-size:52px;margin-bottom:12px">⚠️</div>
          <p style="font-size:14px;font-weight:600;color:var(--text-secondary)">
            متصفحك أو جهازك لا يدعم البصمة البيومترية.<br>
            <span style="font-size:12px;color:var(--text-muted)">يتطلب Windows Hello أو Touch ID أو Face ID</span>
          </p>
          <button class="btn btn-secondary" style="margin-top:16px" onclick="_BioUI.closeModal()">حسناً</button>
        </div>
      `, { size: 'sm' });
      return;
    }

    _BioUI.openModal(`بصمة الإصبع — ${emp.name}`, `
      <div style="text-align:center;padding:16px 0">
        <div class="fingerprint-pulse" id="fp-ring" style="width:120px;height:120px;border-radius:50%;background:var(--primary-bg);border:3px solid var(--primary);display:flex;align-items:center;justify-content:center;margin:0 auto 20px;font-size:48px;color:var(--primary)">
          <i class="fas fa-fingerprint"></i>
        </div>
        <div id="fp-status" style="font-size:15px;font-weight:600;color:var(--text-secondary);margin-bottom:8px">
          جارٍ التحقق...
        </div>
        <p id="fp-sub" style="font-size:12px;color:var(--text-muted);margin-bottom:20px">
          ضع إصبعك على مستشعر البصمة أو أنظر للكاميرا
        </p>
        <button class="btn btn-secondary" onclick="_BioUI.closeModal()">إلغاء</button>
      </div>
    `, { size: 'sm' });

    // Start auth
    setTimeout(() => this._runFingerprintAuth(emp, onSuccess), 200);
  },

  async _runFingerprintAuth(emp, onSuccess) {
    const ring   = document.getElementById('fp-ring');
    const status = document.getElementById('fp-status');
    const sub    = document.getElementById('fp-sub');

    const setUI = (s, t, color) => {
      if (status) status.innerHTML = `<span style="color:${color}">${s}</span>`;
      if (sub) sub.textContent = t;
      if (ring) ring.style.borderColor = color;
    };

    if (!this.hasFingerprint(emp.id)) {
      setUI('⚠️ البصمة غير مسجّلة', 'سجّل البصمة أولاً من ملف الموظف', 'var(--warning)');
      return;
    }

    const result = await this.authenticateFingerprint(emp);

    if (result.ok) {
      if (ring) ring.innerHTML = '<i class="fas fa-check"></i>';
      setUI('✅ تم التحقق بنجاح', `مرحباً ${emp.name}`, 'var(--success)');
      DB.logAudit(emp.id, 'تسجيل بصمة إصبع', 'البيومترية', `مصادقة بيومترية للموظف: ${emp.name}`);
      setTimeout(() => { _BioUI.closeModal(); if (onSuccess) onSuccess(); }, 1000);
    } else {
      setUI('❌ ' + (result.error || 'فشل التحقق'), 'يمكنك المحاولة مرة أخرى', 'var(--danger)');
    }
  },

  // ─── REGISTRATION CARD UI (for employee profile in admin) ─
  renderBiometricCard(empId) {
    const hasFace  = this.hasStoredFace(empId);
    const hasFP    = this.hasFingerprint(empId);
    const canFP    = this.canWebAuthn();
    const canCam   = this.canCamera();

    return `
      <div class="card" style="margin-top:16px">
        <div class="card-header">
          <h3><i class="fas fa-fingerprint" style="color:var(--primary)"></i> التحقق البيومتري</h3>
        </div>
        <div class="card-body" style="display:flex;flex-direction:column;gap:12px">

          <!-- Face -->
          <div style="display:flex;align-items:center;gap:14px;padding:12px;background:var(--bg-input);border-radius:12px;border:1.5px solid ${hasFace?'var(--success)':'var(--border)'}">
            <div style="width:44px;height:44px;border-radius:12px;background:${hasFace?'var(--success-bg)':'var(--bg)'};color:${hasFace?'var(--success)':'var(--text-muted)'};display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0">
              <i class="fas fa-face-smile"></i>
            </div>
            <div style="flex:1">
              <div style="font-size:13px;font-weight:700;color:var(--text-primary)">بصمة الوجه</div>
              <div style="font-size:11px;color:${hasFace?'var(--success)':'var(--text-muted)'}">
                ${hasFace ? '✅ مسجّلة — جاهزة للاستخدام' : '— غير مسجّلة'}
              </div>
            </div>
            <div style="display:flex;gap:6px">
              ${hasFace ? `<button class="btn btn-secondary btn-sm" onclick="Biometrics._deleteFace('${empId}')"><i class="fas fa-trash"></i></button>` : ''}
              ${canCam ? `<button class="btn ${hasFace?'btn-secondary':'btn-primary'} btn-sm" onclick="Biometrics.openFaceRegister('${empId}')">
                <i class="fas fa-camera"></i> ${hasFace?'إعادة تسجيل':'تسجيل الوجه'}
              </button>` : '<span style="font-size:11px;color:var(--text-muted)">لا تتوفر كاميرا</span>'}
            </div>
          </div>

          <!-- Fingerprint -->
          <div style="display:flex;align-items:center;gap:14px;padding:12px;background:var(--bg-input);border-radius:12px;border:1.5px solid ${hasFP?'var(--success)':'var(--border)'}">
            <div style="width:44px;height:44px;border-radius:12px;background:${hasFP?'var(--success-bg)':'var(--bg)'};color:${hasFP?'var(--success)':'var(--text-muted)'};display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0">
              <i class="fas fa-fingerprint"></i>
            </div>
            <div style="flex:1">
              <div style="font-size:13px;font-weight:700;color:var(--text-primary)">بصمة الإصبع / Face ID</div>
              <div style="font-size:11px;color:${hasFP?'var(--success)':'var(--text-muted)'}">
                ${hasFP ? '✅ مسجّلة — Windows Hello / Touch ID / Face ID' : canFP ? '— غير مسجّلة' : '⚠️ الجهاز لا يدعم البصمة البيومترية'}
              </div>
            </div>
            ${canFP ? `
            <div style="display:flex;gap:6px">
              ${hasFP ? `<button class="btn btn-secondary btn-sm" onclick="Biometrics._deleteFingerprint('${empId}')"><i class="fas fa-trash"></i></button>` : ''}
              <button class="btn ${hasFP?'btn-secondary':'btn-primary'} btn-sm" onclick="Biometrics._registerFP('${empId}')">
                <i class="fas fa-fingerprint"></i> ${hasFP?'إعادة تسجيل':'تسجيل البصمة'}
              </button>
            </div>` : ''}
          </div>

        </div>
      </div>
    `;
  },

  _deleteFace(empId) {
    localStorage.removeItem(`face-desc-${empId}`);
    const emp = DB.getEmployee(empId);
    _BioUI.toast(`تم حذف بصمة وجه ${emp?.name||'الموظف'}`, 'info');
  },

  _deleteFingerprint(empId) {
    localStorage.removeItem(`wa-cred-${empId}`);
    const emp = DB.getEmployee(empId);
    _BioUI.toast(`تم حذف بصمة إصبع ${emp?.name||'الموظف'}`, 'info');
  },

  async _registerFP(empId) {
    const emp = DB.getEmployee(empId);
    if (!emp) return;
    _BioUI.toast('ابدأ التحقق البيومتري على جهازك...', 'info');
    const res = await this.registerFingerprint(emp);
    if (res.ok) {
      _BioUI.toast(`✅ تم تسجيل بصمة ${emp.name} بنجاح`, 'success');
      DB.logAudit(_BioUI.userId(), 'تسجيل بصمة إصبع', 'البيومترية', `تم تسجيل بصمة إصبع الموظف: ${emp.name}`);
    } else {
      _BioUI.toast(`❌ ${res.error}`, 'error');
    }
  },
};

// Add pulse animation CSS
(function addBioCss() {
  const style = document.createElement('style');
  style.textContent = `
    .fingerprint-pulse {
      animation: fpPulse 2s ease-in-out infinite;
    }
    @keyframes fpPulse {
      0%,100% { box-shadow: 0 0 0 0 rgba(99,102,241,0.4); }
      50%      { box-shadow: 0 0 0 20px rgba(99,102,241,0); }
    }
  `;
  document.head.appendChild(style);
})();
