/**
 * CAT-PULSE INTERACTIVE LIFECYCLE TERMINAL (QR & RFID SCANNER ENGINE - LIGHT MODERN THEME)
 * - Ultra-Interactive Hardware Scanner Simulator with animated laser beam
 * - Interactive RFID Smart Card Tap Terminal with 3-LED hardware state indicators
 * - Web Audio API synthesizer for physical laser beeps & RFID chirps
 * - Dynamic QR Code Asset Badge generator with print preview
 * - Digital Handover Manifest & Live Telemetry Sync
 * - Easy Exit / Close Modal controls & ESC key listener
 */

const CAT_SCANNER = {
  activeMode: "checkout", // "checkout" | "checkin"
  selectedAssetId: "EQX1007",
  selectedOperatorId: "OP108",
  isScanning: false,
  audioCtx: null,

  /**
   * Hardware Audio Synthesizer (Zero external audio files required)
   */
  playSound: function(type = "beep") {
    try {
      if (!this.audioCtx) {
        this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      const ctx = this.audioCtx;

      if (type === "laser") {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = "sine";
        osc.frequency.setValueAtTime(1400, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(2400, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
        osc.start();
        osc.stop(ctx.currentTime + 0.1);
      } else if (type === "rfid") {
        [0, 0.08].forEach((delay, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.type = "triangle";
          osc.frequency.setValueAtTime(idx === 0 ? 950 : 1450, ctx.currentTime + delay);
          gain.gain.setValueAtTime(0.25, ctx.currentTime + delay);
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + delay + 0.07);
          osc.start(ctx.currentTime + delay);
          osc.stop(ctx.currentTime + delay + 0.07);
        });
      } else if (type === "success") {
        [523.25, 659.25, 783.99].forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.type = "sine";
          osc.frequency.setValueAtTime(freq, ctx.currentTime + (idx * 0.06));
          gain.gain.setValueAtTime(0.2, ctx.currentTime + (idx * 0.06));
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + (idx * 0.06) + 0.25);
          osc.start(ctx.currentTime + (idx * 0.06));
          osc.stop(ctx.currentTime + (idx * 0.06) + 0.25);
        });
      }
    } catch (e) {
      console.log("Audio feedback enabled on user click.");
    }
  },

  openModal: function(mode = "checkout", preselectedAssetId = null) {
    this.activeMode = mode;
    if (preselectedAssetId) this.selectedAssetId = preselectedAssetId;

    const modal = document.getElementById("scanner-modal");
    if (modal) {
      modal.classList.remove("hidden");
      modal.classList.add("flex");
    }

    this.renderScannerUI("scanner-modal-body");
  },

  closeModal: function() {
    const modal = document.getElementById("scanner-modal");
    if (modal) {
      modal.classList.add("hidden");
      modal.classList.remove("flex");
    }
  },

  /**
   * Render the Interactive QR & RFID Terminal into any container (Clean Light Theme)
   */
  renderScannerUI: function(containerId = "scanner-tab-body") {
    const container = document.getElementById(containerId);
    if (!container) return;

    const assets = window.currentFleetData || SEED_DATA.assets;
    const currentAsset = assets.find(a => a.id === this.selectedAssetId) || assets[0];
    const currentOperator = SEED_DATA.operators.find(o => o.id === this.selectedOperatorId) || SEED_DATA.operators[2];
    const isCheckIn = this.activeMode === "checkin";
    const isInsideModal = containerId === "scanner-modal-body";

    container.innerHTML = `
      <div class="space-y-6">
        
        <!-- Header Mode Toggle & Exit Button -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-2xl bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-900 text-xl font-bold shadow-sm">
              📡
            </div>
            <div>
              <div class="flex items-center gap-2">
                <h3 class="text-slate-900 font-extrabold text-base">
                  ${isCheckIn ? 'Equipment Digital Check-In & Inspection' : 'Equipment Digital Check-Out & Dispatch'}
                </h3>
                ${isInsideModal ? `
                  <span class="px-2 py-0.5 bg-slate-100 border border-slate-300 text-slate-600 rounded text-[10px] font-bold">MODAL</span>
                ` : ''}
              </div>
              <p class="text-slate-500 text-xs font-medium">Field Optical QR Code Scanner & RFID NFC Card Reader Terminal</p>
            </div>
          </div>

          <div class="flex items-center gap-2 self-end sm:self-auto">
            <div class="flex bg-slate-100 p-1.5 rounded-xl border border-slate-200 shrink-0">
              <button onclick="CAT_SCANNER.switchMode('checkout', '${containerId}')" class="px-3.5 py-1.5 text-xs font-black rounded-lg transition-all ${!isCheckIn ? 'bg-amber-400 text-slate-950 shadow' : 'text-slate-600 hover:text-slate-900'}">
                🚀 Check-Out
              </button>
              <button onclick="CAT_SCANNER.switchMode('checkin', '${containerId}')" class="px-3.5 py-1.5 text-xs font-black rounded-lg transition-all ${isCheckIn ? 'bg-amber-400 text-slate-950 shadow' : 'text-slate-600 hover:text-slate-900'}">
                📦 Check-In
              </button>
            </div>

            <!-- PROMINENT EXIT / CLOSE BUTTON -->
            ${isInsideModal ? `
              <button onclick="CAT_SCANNER.closeModal()" class="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 hover:text-rose-900 border border-rose-300 rounded-xl text-xs font-extrabold flex items-center gap-1.5 shadow-sm transition-all" title="Close this modal (Esc)">
                <span>✕</span> Exit Modal
              </button>
            ` : `
              <button onclick="switchTab('fleet')" class="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all">
                <span>⬅️</span> Back to Fleet
              </button>
            `}
          </div>
        </div>

        <!-- 2-Column Interactive Hardware Workstation -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-5">
          
          <!-- LEFT: INTERACTIVE QR OPTICAL SCANNER -->
          <div class="bg-slate-50 p-5 rounded-2xl border border-slate-200 flex flex-col justify-between space-y-4 shadow-sm">
            <div>
              <div class="flex items-center justify-between mb-2">
                <span class="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <span>📷</span> 1. Optical QR Code Scanner
                </span>
                <span class="text-[10px] font-mono bg-white px-2 py-0.5 rounded-full text-slate-500 border border-slate-200 font-bold">
                  OPTICAL 2D ENGINE
                </span>
              </div>
              <p class="text-slate-600 text-xs mb-3">Select a Caterpillar asset below to generate its unique QR tag, then click the badge to simulate scanning.</p>

              <!-- Asset Dropdown -->
              <label class="text-slate-600 text-xs font-semibold block mb-1">Target Equipment</label>
              <select id="scanner-asset-select" onchange="CAT_SCANNER.onAssetChange(this.value, '${containerId}')" class="w-full bg-white border border-slate-300 text-slate-900 rounded-xl px-3.5 py-2 text-xs font-mono focus:border-amber-400 outline-none shadow-sm">
                ${assets.map(a => `<option value="${a.id}" ${a.id === currentAsset.id ? 'selected' : ''}>${a.id} • ${a.type} (${a.model}) - ${a.siteId || 'UNASSIGNED'}</option>`).join('')}
              </select>
            </div>

            <!-- Realistic Scanner Viewfinder with Animated Red Laser -->
            <div class="flex flex-col items-center justify-center p-4 bg-white rounded-2xl border border-slate-200 relative group cursor-pointer shadow-sm" onclick="CAT_SCANNER.triggerScanAnimation('${currentAsset.id}')" title="Click to trigger laser scan">
              
              <!-- Crosshair Corners -->
              <div class="relative p-4 bg-white rounded-xl shadow-md border-4 border-slate-900 flex flex-col items-center justify-between w-48 h-48 overflow-hidden">
                
                <!-- Animated Red Laser Line -->
                <div id="scanner-laser-beam" class="hidden absolute inset-x-0 h-1 bg-red-500 shadow-[0_0_12px_#ef4444] z-20 animate-bounce"></div>

                <!-- QR Header Pattern -->
                <div class="w-full flex justify-between">
                  <div class="w-9 h-9 bg-black border-2 border-white rounded-sm"></div>
                  <div class="w-9 h-9 bg-black border-2 border-white rounded-sm"></div>
                </div>

                <!-- Center Cat Badge & Serial -->
                <div class="text-center">
                  <div class="w-7 h-7 bg-amber-400 border-2 border-black rounded mx-auto flex items-center justify-center font-black text-black text-[9px]">CAT</div>
                  <div class="font-mono text-[10px] font-black text-black tracking-widest uppercase mt-1">
                    ${currentAsset.id}
                  </div>
                </div>

                <!-- QR Bottom Pattern -->
                <div class="w-full flex justify-between">
                  <div class="w-9 h-9 bg-black border-2 border-white rounded-sm"></div>
                  <div class="w-6 h-6 bg-slate-800 rounded-sm"></div>
                </div>

                <!-- Hover Overlay Trigger -->
                <div class="absolute inset-0 bg-slate-950/80 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-amber-400 font-bold text-xs gap-1 z-10 rounded-lg">
                  <span class="text-xl">⚡</span>
                  <span>Click to Laser Scan</span>
                  <span class="text-[10px] text-slate-300 font-mono font-normal">Authenticates IoT Gateway</span>
                </div>
              </div>

              <div class="flex items-center gap-2 mt-3 text-xs">
                <span class="text-slate-500 font-mono text-xs">Asset Serial:</span>
                <span class="text-slate-900 font-mono font-bold text-xs">${currentAsset.serialNumber}</span>
              </div>
            </div>

            <button onclick="CAT_SCANNER.triggerScanAnimation('${currentAsset.id}')" class="cat-btn-primary w-full py-2.5 rounded-xl text-xs font-black shadow flex items-center justify-center gap-2">
              <span>📷</span> Trigger Laser Optical Scan (${currentAsset.id})
            </button>
          </div>

          <!-- RIGHT: INTERACTIVE RFID SMART CARD TAP PAD -->
          <div class="bg-slate-50 p-5 rounded-2xl border border-slate-200 flex flex-col justify-between space-y-4 shadow-sm">
            <div>
              <div class="flex items-center justify-between mb-2">
                <span class="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <span>💳</span> 2. RFID NFC Smart Card Terminal
                </span>
                <span class="text-[10px] font-mono bg-white px-2 py-0.5 rounded-full text-slate-500 border border-slate-200 font-bold">
                  13.56 MHz NFC
                </span>
              </div>
              <p class="text-slate-600 text-xs mb-3">Select the certified Caterpillar operator, then tap their digital smart card badge to authenticate assignment.</p>

              <!-- Operator Dropdown -->
              <label class="text-slate-600 text-xs font-semibold block mb-1">Assigned Certified Operator</label>
              <select id="scanner-op-select" onchange="CAT_SCANNER.onOperatorChange(this.value, '${containerId}')" class="w-full bg-white border border-slate-300 text-slate-900 rounded-xl px-3.5 py-2 text-xs font-sans focus:border-amber-400 outline-none shadow-sm">
                ${SEED_DATA.operators.map(o => `<option value="${o.id}" ${o.id === currentOperator.id ? 'selected' : ''}>${o.id}: ${o.name} (${o.certLevel}) - ${o.specialty}</option>`).join('')}
              </select>
            </div>

            <!-- Realistic Smart Card Tap Pad with LED Hardware Indicators -->
            <div id="rfid-tap-pad" class="flex flex-col items-center justify-center p-4 bg-white rounded-2xl border border-slate-200 relative group cursor-pointer shadow-sm" onclick="CAT_SCANNER.triggerRFIDTap('${currentOperator.id}')" title="Click to Tap RFID Smart Card">
              
              <!-- Card Badge Graphic -->
              <div class="w-64 h-36 bg-gradient-to-br from-slate-900 to-slate-950 rounded-2xl p-3.5 border border-slate-700 shadow-xl flex flex-col justify-between text-white relative overflow-hidden group-hover:scale-105 transition-transform">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-1.5">
                    <div class="w-5 h-5 bg-amber-400 text-black font-black text-[9px] rounded flex items-center justify-center">CAT</div>
                    <span class="text-[10px] font-mono font-bold text-amber-400 tracking-wider">OPERATOR SMART PASS</span>
                  </div>
                  <span class="text-xs">📶</span>
                </div>

                <div class="space-y-0.5">
                  <div class="font-bold text-xs text-white">${currentOperator.name}</div>
                  <div class="text-[10px] text-amber-400 font-mono">${currentOperator.id} • ${currentOperator.certLevel}</div>
                  <div class="text-[9px] text-slate-400">Auth Cert: CAT-IND-2026-NFC</div>
                </div>

                <div class="flex justify-between items-center text-[9px] text-slate-400 font-mono pt-1 border-t border-slate-800">
                  <span>TAP TO AUTHORIZE</span>
                  <span class="text-emerald-400 font-bold">ACTIVE</span>
                </div>
              </div>

              <!-- Hardware LED State Indicator Lights -->
              <div class="flex items-center gap-4 mt-3 text-[10px] font-mono font-bold text-slate-500">
                <span class="flex items-center gap-1">
                  <span id="led-pwr" class="w-2 h-2 rounded-full bg-emerald-500"></span> PWR
                </span>
                <span class="flex items-center gap-1">
                  <span id="led-read" class="w-2 h-2 rounded-full bg-slate-300"></span> READ
                </span>
                <span class="flex items-center gap-1">
                  <span id="led-ok" class="w-2 h-2 rounded-full bg-slate-300"></span> AUTH
                </span>
              </div>
            </div>

            <button onclick="CAT_SCANNER.triggerRFIDTap('${currentOperator.id}')" class="cat-btn-secondary w-full py-2.5 rounded-xl text-xs font-bold shadow-sm flex items-center justify-center gap-2">
              <span>💳</span> Tap RFID NFC Smart Card (${currentOperator.id})
            </button>
          </div>

        </div>

        <!-- TRANSACTION DISPATCH & CONFIRMATION PANEL -->
        <div id="scanner-dispatch-panel" class="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4 shadow-sm">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
            <div>
              <span class="text-xs font-bold text-slate-900 uppercase tracking-wider block">3. Transaction Digital Manifest</span>
              <p class="text-slate-500 text-xs">Verify equipment telemetry, assigned jobsite geofence, and certified operator credentials.</p>
            </div>
            <span class="text-xs font-mono font-bold text-amber-900 bg-amber-100 px-3 py-1 rounded-full border border-amber-300 self-start sm:self-auto">
              ${isCheckIn ? 'Inspection & Return' : 'Dispatch & Site Pre-Position'}
            </span>
          </div>

          <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div class="bg-white p-3 rounded-xl border border-slate-200">
              <span class="text-slate-400 text-[10px] block font-semibold">Equipment Asset</span>
              <span class="font-extrabold text-slate-900">${currentAsset.id}</span>
              <div class="text-[10px] text-slate-500 truncate">${currentAsset.model}</div>
            </div>

            <div class="bg-white p-3 rounded-xl border border-slate-200">
              <span class="text-slate-400 text-[10px] block font-semibold">${isCheckIn ? 'Returning From' : 'Target Jobsite'}</span>
              <select id="scanner-target-site" class="w-full bg-slate-50 border border-slate-300 rounded text-slate-900 text-xs font-bold mt-0.5 outline-none p-1">
                ${SEED_DATA.sites.map(s => `<option value="${s.id}" ${s.id === 'S003' ? 'selected' : ''}>${s.id}: ${s.name}</option>`).join('')}
              </select>
            </div>

            <div class="bg-white p-3 rounded-xl border border-slate-200">
              <span class="text-slate-400 text-[10px] block font-semibold">Certified Driver</span>
              <span class="font-bold text-slate-900">${currentOperator.name}</span>
              <div class="text-[10px] text-slate-500">${currentOperator.id} • ${currentOperator.certLevel}</div>
            </div>

            <div class="bg-white p-3 rounded-xl border border-slate-200">
              <span class="text-slate-400 text-[10px] block font-semibold">Cost Avoidance Value</span>
              <span class="font-black text-emerald-600 font-mono text-sm">+$4,200</span>
              <div class="text-[10px] text-slate-500">12 Days @ $350/day</div>
            </div>
          </div>

          <div class="flex items-center justify-end gap-3 pt-2">
            ${isInsideModal ? `
              <button onclick="CAT_SCANNER.closeModal()" class="px-5 py-3 bg-white hover:bg-slate-100 text-slate-700 font-bold rounded-xl text-xs border border-slate-300 shadow-sm transition-all">
                Cancel / Close
              </button>
            ` : `
              <button onclick="switchTab('fleet')" class="px-5 py-3 bg-white hover:bg-slate-100 text-slate-700 font-bold rounded-xl text-xs border border-slate-300 shadow-sm transition-all">
                Return to Dashboard
              </button>
            `}
            <button onclick="CAT_SCANNER.commitTransaction('${containerId}')" class="cat-btn-primary px-6 py-3 rounded-xl text-xs font-black shadow flex items-center gap-2">
              <span>🚀</span> Authorize & Execute ${isCheckIn ? 'Digital Check-In' : 'Field Dispatch'}
            </button>
          </div>
        </div>

        <!-- DIGITAL RECEIPT MODAL / RECEIPT AREA -->
        <div id="scanner-receipt-container"></div>

      </div>
    `;
  },

  switchMode: function(mode, containerId) {
    this.activeMode = mode;
    this.renderScannerUI(containerId);
  },

  onAssetChange: function(assetId, containerId) {
    this.selectedAssetId = assetId;
    this.renderScannerUI(containerId);
  },

  onOperatorChange: function(opId, containerId) {
    this.selectedOperatorId = opId;
    this.renderScannerUI(containerId);
  },

  triggerScanAnimation: function(assetId) {
    this.playSound("laser");
    const laser = document.getElementById("scanner-laser-beam");
    if (laser) {
      laser.classList.remove("hidden");
      setTimeout(() => {
        laser.classList.add("hidden");
        window.showGlobalNotification(`📷 Optical QR Tag scanned for <strong>${assetId}</strong>! Serial Verified: CAN-Bus Online.`);
      }, 900);
    }
  },

  triggerRFIDTap: function(opId) {
    this.playSound("rfid");
    const ledRead = document.getElementById("led-read");
    const ledOk = document.getElementById("led-ok");

    if (ledRead) ledRead.className = "w-2 h-2 rounded-full bg-amber-400 animate-ping";

    setTimeout(() => {
      if (ledRead) ledRead.className = "w-2 h-2 rounded-full bg-slate-300";
      if (ledOk) ledOk.className = "w-2 h-2 rounded-full bg-emerald-500";
      this.playSound("success");
      window.showGlobalNotification(`💳 RFID Smart Card verified for <strong>${opId}</strong>! Master Operator Authenticated.`);
    }, 450);
  },

  commitTransaction: function(containerId) {
    const assetId = this.selectedAssetId;
    const opId = this.selectedOperatorId;
    const siteSelect = document.getElementById("scanner-target-site");
    const siteId = siteSelect ? siteSelect.value : "S003";

    this.playSound("success");

    if (window.executeDirectReassignment) {
      window.executeDirectReassignment(assetId, siteId, opId);
    }

    const receiptContainer = document.getElementById("scanner-receipt-container");
    if (receiptContainer) {
      receiptContainer.innerHTML = `
        <div class="p-5 bg-white border-2 border-emerald-400 rounded-2xl shadow-lg space-y-3 animate-fade-in text-xs">
          <div class="flex items-center justify-between border-b border-slate-200 pb-2.5">
            <span class="font-extrabold text-slate-900 flex items-center gap-2">
              <span class="p-1.5 bg-emerald-100 text-emerald-800 rounded-lg">✓</span> Official Caterpillar Digital Handover Manifest
            </span>
            <span class="font-mono text-slate-500 font-bold text-[11px]">${new Date().toISOString().slice(0,19).replace('T', ' ')} UTC</span>
          </div>

          <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div><span class="text-slate-400 text-[10px] block">Manifest ID</span><strong class="text-slate-900 font-mono">CAT-TRX-${Math.floor(100000 + Math.random() * 900000)}</strong></div>
            <div><span class="text-slate-400 text-[10px] block">Asset & Serial</span><strong class="text-slate-900">${assetId}</strong></div>
            <div><span class="text-slate-400 text-[10px] block">Authorized Driver</span><strong class="text-slate-900">${opId}</strong></div>
            <div><span class="text-slate-400 text-[10px] block">Avoided Cost</span><strong class="text-emerald-700 font-bold">+$4,200 Saved</strong></div>
          </div>

          <div class="flex justify-between items-center text-slate-600 text-xs pt-1">
            <span>Geofence Activated: <strong>${siteId}</strong> • Telemetry stream synched to Control Tower.</span>
            <button onclick="this.parentElement.parentElement.remove()" class="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg border border-slate-300">
              Dismiss Receipt
            </button>
          </div>
        </div>
      `;
    }

    if (this.closeModal) {
      setTimeout(() => {
        this.closeModal();
      }, 2500);
    }
  }
};

window.CAT_SCANNER = CAT_SCANNER;
