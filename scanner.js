/**
 * CAT-PULSE INTERACTIVE LIFECYCLE TERMINAL (QR & RFID SCANNER ENGINE)
 * - Ultra-Interactive Hardware Scanner Simulator with animated laser beam
 * - Interactive RFID Smart Card Tap Terminal with 3-LED hardware state indicators
 * - Web Audio API synthesizer for physical laser beeps & RFID chirps
 * - Dynamic QR Code Asset Badge generator with print preview
 * - Digital Handover Manifest & Live Telemetry Sync
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
        // High-pitch dual-frequency laser scan sweep
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
        // RFID verification double chirp
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
        // Major chord success confirmation [C5, E5, G5]
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
   * Render the Interactive QR & RFID Terminal into any container
   */
  renderScannerUI: function(containerId = "scanner-tab-body") {
    const container = document.getElementById(containerId);
    if (!container) return;

    const assets = window.currentFleetData || SEED_DATA.assets;
    const currentAsset = assets.find(a => a.id === this.selectedAssetId) || assets[0];
    const currentOperator = SEED_DATA.operators.find(o => o.id === this.selectedOperatorId) || SEED_DATA.operators[2];
    const isCheckIn = this.activeMode === "checkin";

    container.innerHTML = `
      <div class="space-y-6">
        
        <!-- Header Mode Toggle -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-3.5">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400 text-xl font-bold">
              📡
            </div>
            <div>
              <h3 class="text-white font-extrabold text-base">
                ${isCheckIn ? 'Equipment Digital Check-In & Inspection' : 'Equipment Digital Check-Out & Dispatch'}
              </h3>
              <p class="text-zinc-400 text-xs">Simulated Field Optical QR Code Scanner & RFID NFC Card Reader</p>
            </div>
          </div>

          <div class="flex bg-zinc-950 p-1 rounded-xl border border-zinc-800 shrink-0">
            <button onclick="CAT_SCANNER.switchMode('checkout', '${containerId}')" class="px-4 py-1.5 text-xs font-black rounded-lg transition-all ${!isCheckIn ? 'bg-amber-400 text-black shadow-lg' : 'text-zinc-400 hover:text-white'}">
              🚀 Check-Out Dispatch
            </button>
            <button onclick="CAT_SCANNER.switchMode('checkin', '${containerId}')" class="px-4 py-1.5 text-xs font-black rounded-lg transition-all ${isCheckIn ? 'bg-amber-400 text-black shadow-lg' : 'text-zinc-400 hover:text-white'}">
              📦 Check-In Return
            </button>
          </div>
        </div>

        <!-- 2-Column Interactive Hardware Workstation -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-5">
          
          <!-- LEFT: INTERACTIVE QR OPTICAL SCANNER -->
          <div class="bg-zinc-950 p-5 rounded-2xl border border-zinc-800 flex flex-col justify-between space-y-4 shadow-xl">
            <div>
              <div class="flex items-center justify-between mb-2">
                <span class="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <span>📷</span> 1. Optical QR Code Scanner
                </span>
                <span class="text-[10px] font-mono bg-zinc-900 px-2 py-0.5 rounded text-zinc-400 border border-zinc-800">
                  OPTICAL 2D ENGINE
                </span>
              </div>
              <p class="text-zinc-400 text-xs mb-3">Select a Caterpillar asset below to generate its unique machine QR tag, then click the viewfinder to simulate scanning.</p>

              <!-- Asset Dropdown -->
              <label class="text-zinc-400 text-[11px] font-semibold block mb-1">Target Equipment</label>
              <select id="scanner-asset-select" onchange="CAT_SCANNER.onAssetChange(this.value, '${containerId}')" class="w-full bg-zinc-900 border border-zinc-700 text-white rounded-lg px-3 py-2 text-xs font-mono focus:border-amber-400 outline-none">
                ${assets.map(a => `<option value="${a.id}" ${a.id === currentAsset.id ? 'selected' : ''}>${a.id} • ${a.type} (${a.model}) - ${a.siteId || 'UNASSIGNED'}</option>`).join('')}
              </select>
            </div>

            <!-- Realistic Scanner Viewfinder with Animated Red Laser -->
            <div class="flex flex-col items-center justify-center p-3 bg-zinc-900/80 rounded-xl border border-zinc-800 relative group cursor-pointer" onclick="CAT_SCANNER.triggerScanAnimation('${currentAsset.id}')" title="Click to trigger laser scan">
              
              <!-- Crosshair Corners -->
              <div class="relative p-4 bg-white rounded-xl shadow-2xl border-4 border-black flex flex-col items-center justify-between w-48 h-48 overflow-hidden">
                
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
                  <div class="w-6 h-6 bg-zinc-900 rounded-sm"></div>
                </div>

                <!-- Hover Overlay Trigger -->
                <div class="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-amber-400 font-bold text-xs gap-1 z-10 rounded-lg">
                  <span class="text-xl">⚡</span>
                  <span>Click to Laser Scan</span>
                  <span class="text-[10px] text-zinc-300 font-mono font-normal">Authenticates IoT Gateway</span>
                </div>
              </div>

              <div class="flex items-center gap-2 mt-3 text-xs">
                <span class="text-zinc-400 font-mono text-[11px]">Asset Serial:</span>
                <span class="text-amber-400 font-mono font-bold text-[11px]">${currentAsset.serialNumber}</span>
              </div>
            </div>

            <!-- Optical Sensor Status Indicator -->
            <div id="qr-scan-indicator" class="p-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs flex items-center justify-between">
              <span class="text-zinc-400 flex items-center gap-1.5 text-[11px]">
                <span id="qr-status-dot" class="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
                <span id="qr-status-label">Optical Sensor Ready • Awaiting Scan</span>
              </span>
              <span class="text-[10px] font-mono text-zinc-500">2.4GHz BLE</span>
            </div>
          </div>

          <!-- RIGHT: INTERACTIVE RFID SMART CARD & DISPATCH FORM -->
          <div class="bg-zinc-950 p-5 rounded-2xl border border-zinc-800 flex flex-col justify-between space-y-4 shadow-xl">
            <div>
              <div class="flex items-center justify-between mb-2">
                <span class="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <span>💳</span> 2. Operator RFID NFC Badge Tap
                </span>
                <div class="flex items-center gap-1 text-[10px] font-mono">
                  <span id="rfid-led-power" class="w-2 h-2 rounded-full bg-emerald-500" title="Reader Powered"></span>
                  <span id="rfid-led-read" class="w-2 h-2 rounded-full bg-zinc-700" title="Reading"></span>
                  <span id="rfid-led-ok" class="w-2 h-2 rounded-full bg-zinc-700" title="Validated"></span>
                </div>
              </div>
              <p class="text-zinc-400 text-xs mb-3">Select the certified Cat operator, then click "Tap Badge" to authenticate credentials against the Caterpillar master registry.</p>

              <!-- Operator Select & Tap Badge Button -->
              <div class="space-y-3">
                <div>
                  <label class="text-zinc-400 text-[11px] font-semibold block mb-1">Assigned Certified Operator</label>
                  <div class="flex items-center gap-2">
                    <select id="scanner-operator-select" onchange="CAT_SCANNER.onOperatorChange(this.value, '${containerId}')" class="flex-1 bg-zinc-900 border border-zinc-700 text-white rounded-lg px-3 py-2 text-xs focus:border-amber-400 outline-none">
                      ${SEED_DATA.operators.map(op => `
                        <option value="${op.id}" ${op.id === currentOperator.id ? 'selected' : ''}>
                          ${op.id} • ${op.name} (${op.certLevel} - ${op.specialty})
                        </option>
                      `).join('')}
                    </select>
                    <button type="button" onclick="CAT_SCANNER.triggerRFIDTap('${currentOperator.id}')" class="px-3.5 py-2 bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-500 hover:to-yellow-600 text-black text-xs font-extrabold rounded-lg shadow-md flex items-center gap-1.5 transition-transform active:scale-95">
                      <span>💳</span> Tap Badge
                    </button>
                  </div>
                </div>

                <!-- Visual RFID Card Mockup -->
                <div id="rfid-card-display" class="p-3 bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-900 border border-amber-400/40 rounded-xl flex items-center justify-between text-xs transition-all">
                  <div class="flex items-center gap-2.5">
                    <div class="w-9 h-9 rounded-lg bg-amber-400 text-black flex items-center justify-center font-black text-xs shadow">
                      CAT
                    </div>
                    <div>
                      <div class="text-white font-bold text-xs">${currentOperator.name}</div>
                      <div class="text-amber-400 font-mono text-[10px]">${currentOperator.id} • ${currentOperator.certLevel}</div>
                    </div>
                  </div>
                  <span id="rfid-card-badge" class="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] font-bold">
                    ACTIVE BADGE
                  </span>
                </div>

                ${!isCheckIn ? `
                  <!-- Check-Out Fields -->
                  <div>
                    <label class="text-zinc-400 text-[11px] font-semibold block mb-1">Destination Jobsite</label>
                    <select id="scanner-site-select" class="w-full bg-zinc-900 border border-zinc-700 text-white rounded-lg px-3 py-2 text-xs focus:border-amber-400 outline-none">
                      ${SEED_DATA.sites.map(s => `
                        <option value="${s.id}" ${s.id === (currentAsset.siteId || 'S003') ? 'selected' : ''}>
                          ${s.id} • ${s.name} (${s.projectPhase}) ${s.forecastDeficit ? '⚠️ DEFICIT SITE' : ''}
                        </option>
                      `).join('')}
                    </select>
                  </div>

                  <div>
                    <label class="text-zinc-400 text-[11px] font-semibold block mb-1">Expected Return Date</label>
                    <input type="date" id="scanner-return-date" value="2025-04-20" class="w-full bg-zinc-900 border border-zinc-700 text-white rounded-lg px-3 py-2 text-xs focus:border-amber-400 outline-none">
                  </div>
                ` : `
                  <!-- Check-In Fields -->
                  <div>
                    <label class="text-zinc-400 text-[11px] font-semibold block mb-1">Final Telemetry Log (Engine Runtime Hours)</label>
                    <input type="number" id="scanner-checkin-hours" value="${(currentAsset.engineHoursDay * currentAsset.operatingDays + 8.5).toFixed(1)}" step="0.5" class="w-full bg-zinc-900 border border-zinc-700 text-white rounded-lg px-3 py-2 text-xs focus:border-amber-400 outline-none">
                  </div>

                  <div>
                    <label class="text-zinc-400 text-[11px] font-semibold block mb-1">Physical Condition Inspection</label>
                    <select id="scanner-condition-select" class="w-full bg-zinc-900 border border-zinc-700 text-white rounded-lg px-3 py-2 text-xs focus:border-amber-400 outline-none">
                      <option value="Excellent">⭐ Excellent - Ready for Instant Redeployment</option>
                      <option value="Good">Good - Standard 50-Hour Lube & Inspection</option>
                      <option value="Maintenance_Required">⚠️ Maintenance Required - Route to Thiruvallur Service Bay</option>
                    </select>
                  </div>
                `}
              </div>
            </div>

            <!-- Submit Action Button -->
            <div class="pt-3 border-t border-zinc-800">
              <button onclick="CAT_SCANNER.executeTransaction('${currentAsset.id}', '${containerId}')" class="w-full py-3 bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 hover:from-amber-500 hover:to-yellow-600 text-black font-black text-xs rounded-xl uppercase tracking-wider transition-transform transform hover:scale-[1.02] active:scale-[0.98] shadow-2xl flex items-center justify-center gap-2">
                <span>⚡</span> ${isCheckIn ? 'Authorize Equipment Return & Close Contract' : 'Authorize Digital Dispatch & Sync Telemetry'}
              </button>
            </div>

          </div>

        </div>

        <!-- TRANSACTION SUCCESS MANIFEST RECEIPT (Hidden until submitted) -->
        <div id="scanner-manifest-receipt" class="hidden p-4 bg-zinc-900 border border-emerald-500/60 rounded-2xl text-xs space-y-3 animate-slide-down">
          <div class="flex items-center justify-between border-b border-zinc-800 pb-2">
            <div class="flex items-center gap-2">
              <span class="text-emerald-400 text-base">✅</span>
              <span class="font-bold text-white text-sm">Digital Handover Manifest Generated</span>
            </div>
            <span class="font-mono text-[10px] text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
              CAT-MANIFEST-#${Math.floor(100000 + Math.random() * 900000)}
            </span>
          </div>

          <div id="scanner-manifest-details" class="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-[11px]">
            <!-- Populated dynamically -->
          </div>
        </div>

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

  onOperatorChange: function(operatorId, containerId) {
    this.selectedOperatorId = operatorId;
    this.renderScannerUI(containerId);
  },

  triggerScanAnimation: function(assetId) {
    this.playSound("laser");
    const beam = document.getElementById("scanner-laser-beam");
    const indicator = document.getElementById("qr-status-label");
    const dot = document.getElementById("qr-status-dot");

    if (beam) {
      beam.classList.remove("hidden");
      setTimeout(() => beam.classList.add("hidden"), 1200);
    }

    if (indicator && dot) {
      dot.className = "w-2 h-2 rounded-full bg-emerald-400 animate-ping";
      indicator.innerHTML = `<strong class="text-emerald-400">QR Code Authenticated:</strong> Asset ${assetId} Verified`;
      setTimeout(() => {
        dot.className = "w-2 h-2 rounded-full bg-amber-400";
        indicator.innerHTML = `Optical Sensor Ready • Asset ${assetId} Locked`;
      }, 3500);
    }
  },

  triggerRFIDTap: function(operatorId) {
    this.playSound("rfid");

    const ledRead = document.getElementById("rfid-led-read");
    const ledOk = document.getElementById("rfid-led-ok");
    const cardDisplay = document.getElementById("rfid-card-display");
    const cardBadge = document.getElementById("rfid-card-badge");

    if (ledRead) ledRead.className = "w-2 h-2 rounded-full bg-amber-400 animate-ping";
    if (cardDisplay) cardDisplay.classList.add("ring-2", "ring-amber-400", "scale-[1.02]");

    setTimeout(() => {
      if (ledRead) ledRead.className = "w-2 h-2 rounded-full bg-zinc-700";
      if (ledOk) ledOk.className = "w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#10b981]";
      if (cardBadge) {
        cardBadge.className = "px-2 py-0.5 rounded bg-emerald-400 text-black font-extrabold text-[10px] animate-pulse";
        cardBadge.innerText = "AUTHENTICATED";
      }
    }, 400);

    setTimeout(() => {
      if (cardDisplay) cardDisplay.classList.remove("ring-2", "ring-amber-400", "scale-[1.02]");
    }, 2000);
  },

  executeTransaction: function(assetId, containerId) {
    this.playSound("success");

    const assets = window.currentFleetData || SEED_DATA.assets;
    const asset = assets.find(a => a.id === assetId);
    if (!asset) return;

    const isCheckIn = this.activeMode === "checkin";
    const opSelect = document.getElementById("scanner-operator-select");
    const siteSelect = document.getElementById("scanner-site-select");
    const returnDateInput = document.getElementById("scanner-return-date");

    let targetSiteId = "S003";
    let targetOpId = "OP108";

    if (!isCheckIn) {
      targetSiteId = siteSelect ? siteSelect.value : "S003";
      targetOpId = opSelect ? opSelect.value : "OP108";
      const targetSite = SEED_DATA.sites.find(s => s.id === targetSiteId);

      asset.siteId = targetSiteId;
      asset.operatorId = targetOpId;
      asset.status = "Active";
      asset.isReassigned = true;
      asset.engineHoursDay = 6.5;
      asset.idleHoursDay = 1.0;
      if (targetSite) {
        asset.lat = targetSite.lat + 0.001;
        asset.lng = targetSite.lng + 0.001;
      }
      if (returnDateInput) {
        asset.checkinDate = returnDateInput.value;
      }

      if (window.CAT_MAP && window.CAT_MAP.drawTransitRoute) {
        window.CAT_MAP.drawTransitRoute(SEED_DATA.dealerHub, targetSite);
      }
    } else {
      asset.siteId = null;
      asset.operatorId = null;
      asset.status = "Active";
      asset.lat = SEED_DATA.dealerHub.lat;
      asset.lng = SEED_DATA.dealerHub.lng;
    }

    // Refresh application state
    if (window.refreshDashboard) window.refreshDashboard();
    if (window.CAT_MAP && window.CAT_MAP.renderAssets) window.CAT_MAP.renderAssets();

    // Show Digital Handover Manifest Receipt
    const receipt = document.getElementById("scanner-manifest-receipt");
    const details = document.getElementById("scanner-manifest-details");

    if (receipt && details) {
      details.innerHTML = `
        <div class="bg-zinc-950 p-2.5 rounded-lg border border-zinc-800">
          <span class="text-zinc-500 text-[10px] block">Asset / Machine</span>
          <span class="font-bold text-amber-400 font-mono">${asset.id} (${asset.type})</span>
        </div>
        <div class="bg-zinc-950 p-2.5 rounded-lg border border-zinc-800">
          <span class="text-zinc-500 text-[10px] block">${!isCheckIn ? 'Destination Site' : 'Return Terminal'}</span>
          <span class="font-bold text-zinc-200">${!isCheckIn ? asset.siteId : 'CAT Thiruvallur Hub'}</span>
        </div>
        <div class="bg-zinc-950 p-2.5 rounded-lg border border-zinc-800">
          <span class="text-zinc-500 text-[10px] block">Authorized Operator</span>
          <span class="font-bold text-zinc-200">${!isCheckIn ? asset.operatorId : 'Hub Inspector'}</span>
        </div>
        <div class="bg-zinc-950 p-2.5 rounded-lg border border-zinc-800">
          <span class="text-zinc-500 text-[10px] block">Telemetry Sync</span>
          <span class="font-bold text-emerald-400">GPS & Fuel Active</span>
        </div>
      `;
      receipt.classList.remove("hidden");
    }

    if (window.showGlobalNotification) {
      window.showGlobalNotification(
        !isCheckIn 
          ? `✅ <strong>DIGITAL DISPATCH AUTHORIZED:</strong> Asset ${asset.id} assigned to Site ${asset.siteId} with Operator ${asset.operatorId}` 
          : `📦 <strong>DIGITAL RETURN PROCESSED:</strong> Asset ${asset.id} checked in at Thiruvallur Central Yard.`
      );
    }
  }
};

window.CAT_SCANNER = CAT_SCANNER;
