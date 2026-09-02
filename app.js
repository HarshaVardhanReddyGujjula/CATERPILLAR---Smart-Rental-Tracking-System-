/**
 * CAT-PULSE MAIN APPLICATION CONTROLLER (LIGHT MODERN SAAS THEME & AI VOICE ENGINE)
 * Handles global state, home launchpad, table filtering, telemetry simulation, Chart.js graphs,
 * CSV report export, Enterprise ROI modal, Caterpillar imagery, and AI Voice Alerts.
 */

window.currentFleetData = JSON.parse(JSON.stringify(SEED_DATA.assets));
let isTelemetryStreaming = true;
let telemetryInterval = null;
let usageChart = null;
let currentActiveTab = "home";
window.isVoiceAlertsEnabled = false;

document.addEventListener("DOMContentLoaded", () => {
  initApp();
});

function initApp() {
  renderKPICards();
  renderFleetTable();
  renderAnomalyCenter();
  renderForecastView();
  initUsageChart();
  startTelemetryStream();

  if (window.CAT_SCANNER) {
    window.CAT_SCANNER.renderScannerUI("scanner-tab-body");
  }

  if (window.CAT_COPILOT) {
    window.CAT_COPILOT.init();
  }

  updateLiveClock();
  setInterval(updateLiveClock, 1000);
}

function updateLiveClock() {
  const clockEl = document.getElementById("live-clock");
  if (clockEl) {
    const now = new Date();
    clockEl.innerText = now.toUTCString().replace("GMT", "UTC");
  }
}

/**
 * AI Voice Engine & Speech Synthesis
 */
window.speakText = function(text, onStartCallback = null, onEndCallback = null) {
  if (!('speechSynthesis' in window)) {
    window.showGlobalNotification("⚠️ Web Speech API is not supported in your browser.");
    return;
  }

  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.05;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    if (onStartCallback) utterance.onstart = onStartCallback;
    if (onEndCallback) utterance.onend = onEndCallback;
    utterance.onerror = (e) => {
      console.warn("Speech synthesis notice:", e);
      if (onEndCallback) onEndCallback();
    };

    window.speechSynthesis.speak(utterance);
  } catch (e) {
    console.error("Speech synthesis error:", e);
    if (onEndCallback) onEndCallback();
  }
};

window.toggleAnomalyVoice = function() {
  window.isVoiceAlertsEnabled = !window.isVoiceAlertsEnabled;
  const btn = document.getElementById("anomaly-voice-toggle-btn");
  const icon = document.getElementById("voice-icon");
  const label = document.getElementById("voice-label");

  if (window.isVoiceAlertsEnabled) {
    if (btn) btn.className = "px-3.5 py-1.5 bg-amber-400 text-slate-950 text-xs font-black rounded-xl border border-amber-500 shadow-md flex items-center gap-1.5 transition-all";
    if (icon) icon.innerText = "🔊";
    if (label) label.innerText = "Voice Alerts: ON";

    window.speakText("Voice alerts enabled. Monitoring 25 Caterpillar machines for real-time fleet anomalies.");
    window.showGlobalNotification("🔊 AI Voice Alerts Activated: System will speak when anomalies are flagged.");
  } else {
    if (btn) btn.className = "px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border border-slate-300 shadow-sm flex items-center gap-1.5 transition-all";
    if (icon) icon.innerText = "🔇";
    if (label) label.innerText = "Voice Alerts: OFF";

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    window.showGlobalNotification("🔇 AI Voice Alerts Muted.");
  }
};

window.speakAnomaly = function(assetId) {
  const anom = CAT_ANALYTICS.detectAnomalies(window.currentFleetData).find(a => a.assetId === assetId);
  if (!anom) return;

  const btn = document.getElementById(`btn-speak-${assetId}`);
  const speechText = `Warning. ${anom.severity} Alert for machine ${anom.assetId}. ${anom.title}. ${anom.description}. Recommended action: ${anom.recommendedAction}.`;

  window.speakText(
    speechText,
    () => {
      if (btn) {
        btn.innerHTML = `<span>🔊</span> Speaking...`;
        btn.className = "px-3 py-1.5 bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow animate-pulse flex items-center gap-1";
      }
    },
    () => {
      if (btn) {
        btn.innerHTML = `<span>🔊</span> Listen`;
        btn.className = "px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl border border-slate-300 flex items-center gap-1 shadow-sm transition-all";
      }
    }
  );
};

window.readAllAnomaliesVoice = function() {
  const anomalies = CAT_ANALYTICS.detectAnomalies(window.currentFleetData);
  if (anomalies.length === 0) {
    window.speakText("Fleet Status Normal. Zero critical anomalies detected across 25 Caterpillar machines.");
    return;
  }

  let text = `AI Fleet Anomaly Center Report. We have detected ${anomalies.length} equipment anomalies. `;
  anomalies.forEach((a, i) => {
    text += `Alert number ${i + 1}: ${a.severity} warning on machine ${a.assetId}. ${a.title}. `;
  });
  text += "Action recommended: Pre-position idle excavators to resolve site deficits and record avoided rental costs.";

  window.speakText(text);
  window.showGlobalNotification("📢 Reading full AI Anomaly Center fleet report aloud...");
};

/**
 * Tab Navigation (Supports Home Portal + 6 Dedicated Features)
 */
window.switchTab = function(tabName) {
  currentActiveTab = tabName;

  const tabs = ["home", "fleet", "map", "anomalies", "forecast", "scanner", "copilot"];
  tabs.forEach(t => {
    const view = document.getElementById(`view-${t}`);
    const btn = document.getElementById(`tab-btn-${t}`);
    if (view) {
      if (t === tabName) {
        view.classList.remove("hidden");
        view.classList.add("animate-fade-in");
      } else {
        view.classList.add("hidden");
        view.classList.remove("animate-fade-in");
      }
    }
    if (btn) {
      if (t === tabName) {
        btn.className = "px-4 py-2 text-xs font-black rounded-xl bg-amber-400 text-slate-950 flex items-center gap-2 whitespace-nowrap shadow-sm transition-all";
      } else {
        btn.className = "px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl flex items-center gap-2 whitespace-nowrap transition-all";
      }
    }
  });

  // Scroll to top when switching views for a fresh clean look
  window.scrollTo({ top: 0, behavior: "smooth" });

  if (tabName === "map") {
    setTimeout(() => {
      if (window.CAT_MAP) {
        window.CAT_MAP.initMap("map-container");
      }
    }, 50);
    setTimeout(() => {
      if (window.CAT_MAP && window.CAT_MAP.invalidate) {
        window.CAT_MAP.invalidate();
      }
    }, 250);
  }

  if (tabName === "scanner") {
    if (window.CAT_SCANNER) {
      window.CAT_SCANNER.renderScannerUI("scanner-tab-body");
    }
  }

  if (tabName === "anomalies" && window.isVoiceAlertsEnabled) {
    setTimeout(() => {
      window.readAllAnomaliesVoice();
    }, 300);
  }
};

/**
 * KPI Metric Cards (Updated for Home Portal + Control Tower)
 */
function renderKPICards() {
  const kpis = CAT_ANALYTICS.calculateFleetKPIs(window.currentFleetData);

  const setVal = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.innerText = val;
  };

  // Fleet View KPIs
  setVal("kpi-total-fleet", kpis.totalRented);
  setVal("kpi-active", kpis.activeCount);
  setVal("kpi-idle", kpis.idleCount);
  setVal("kpi-unassigned", kpis.unassignedCount);
  setVal("kpi-utilization", `${kpis.fleetUtilization}%`);
  setVal("kpi-avoided-cost", `$${kpis.totalAvoidedCost.toLocaleString()}`);

  // Home Portal KPIs
  setVal("home-kpi-total", kpis.totalRented);
  setVal("home-kpi-active", kpis.activeCount);
  setVal("home-kpi-unassigned", kpis.unassignedCount);
  setVal("home-kpi-avoided", `$${kpis.totalAvoidedCost.toLocaleString()}`);

  const avoidedCard = document.getElementById("kpi-card-avoided");
  if (avoidedCard) {
    if (kpis.totalAvoidedCost > 0) {
      avoidedCard.className = "cat-white-card p-4 rounded-2xl border-2 border-emerald-400 bg-emerald-50/70 shadow-md transition-all";
    } else {
      avoidedCard.className = "cat-white-card p-4 rounded-2xl transition-all";
    }
  }
}

/**
 * Fleet Table Rendering with Clean White Design & Photos
 */
function renderFleetTable() {
  const tbody = document.getElementById("fleet-table-body");
  if (!tbody) return;

  const typeFilter = document.getElementById("filter-type") ? document.getElementById("filter-type").value : "ALL";
  const statusFilter = document.getElementById("filter-status") ? document.getElementById("filter-status").value : "ALL";
  const searchFilter = document.getElementById("filter-search") ? document.getElementById("filter-search").value.toLowerCase() : "";

  let filtered = window.currentFleetData.filter(a => {
    if (typeFilter !== "ALL" && a.type !== typeFilter) return false;
    if (statusFilter !== "ALL" && a.status !== statusFilter) return false;
    if (searchFilter) {
      const matchText = `${a.id} ${a.type} ${a.model} ${a.siteId || ''} ${a.operatorId || ''}`.toLowerCase();
      if (!matchText.includes(searchFilter)) return false;
    }
    return true;
  });

  tbody.innerHTML = filtered.map(asset => {
    const totalDaily = (asset.engineHoursDay || 0) + (asset.idleHoursDay || 0);
    const workPercent = totalDaily > 0 ? Math.round((asset.engineHoursDay / totalDaily) * 100) : 0;
    const idlePercent = totalDaily > 0 ? Math.round((asset.idleHoursDay / totalDaily) * 100) : 0;
    const photoUrl = asset.imageUrl || CAT_IMAGE_MAP[asset.type] || "https://desimachines.com/wp-content/uploads/2024/12/desi-machines-cat-excavator-345-gc-featured.jpg";

    let statusBadge = "";
    if (asset.status === "Unassigned" || !asset.siteId) {
      statusBadge = `<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
        <span class="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span> Unassigned
      </span>`;
    } else if (asset.status === "Idle" || asset.idleHoursDay > asset.engineHoursDay) {
      statusBadge = `<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
        <span class="w-1.5 h-1.5 rounded-full bg-amber-500"></span> High Idle
      </span>`;
    } else {
      statusBadge = `<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
        <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Active Duty
      </span>`;
    }

    return `
      <tr id="asset-row-${asset.id}" class="border-b border-slate-100 hover:bg-slate-50/90 transition-colors font-sans text-xs">
        <td class="py-3 px-4">
          <div class="flex items-center gap-3">
            <div class="relative w-12 h-10 rounded-lg overflow-hidden border border-slate-200 shrink-0 bg-slate-100 group shadow-sm">
              <img src="${photoUrl}" alt="${asset.model}" class="w-full h-full object-cover group-hover:scale-105 transition-transform">
              <span class="absolute bottom-0 right-0 bg-black/80 text-amber-400 text-[8px] font-mono px-1 font-bold">CAT</span>
            </div>
            <div>
              <div class="font-bold text-slate-900 font-mono flex items-center gap-1.5">
                <span>${asset.id}</span>
                ${asset.isReassigned ? '<span class="text-[9px] px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded-full font-bold">REASSIGNED</span>' : ''}
              </div>
              <div class="text-[11px] text-slate-600 font-medium">${asset.model}</div>
            </div>
          </div>
        </td>

        <td class="py-3 px-4">
          <span class="font-semibold text-slate-700">${asset.type}</span>
        </td>

        <td class="py-3 px-4">
          ${asset.siteId ? `
            <div class="font-bold text-slate-900">${asset.siteId}</div>
            <div class="text-[11px] text-slate-500">${SEED_DATA.sites.find(s => s.id === asset.siteId)?.name || ''}</div>
          ` : `
            <span class="font-mono text-rose-700 font-bold bg-rose-50 px-2 py-0.5 rounded border border-rose-200">NULL</span>
          `}
        </td>

        <td class="py-3 px-4">
          ${asset.operatorId ? `
            <div class="font-semibold text-slate-900">${asset.operatorId}</div>
            <div class="text-[11px] text-slate-500">${SEED_DATA.operators.find(o => o.id === asset.operatorId)?.name || ''}</div>
          ` : `
            <span class="font-mono text-rose-700 font-bold bg-rose-50 px-2 py-0.5 rounded border border-rose-200">NULL</span>
          `}
        </td>

        <td class="py-3 px-4">
          ${statusBadge}
        </td>

        <td class="py-3 px-4 min-w-[140px]">
          <div class="flex items-center justify-between text-[11px] mb-1">
            <span class="text-emerald-700 font-bold">${asset.engineHoursDay}h work</span>
            <span class="text-amber-700 font-bold">${asset.idleHoursDay}h idle</span>
          </div>
          <div class="w-full h-2 bg-slate-200 rounded-full overflow-hidden flex">
            <div class="bg-emerald-500 h-full" style="width: ${workPercent}%" title="Work: ${workPercent}%"></div>
            <div class="bg-amber-400 h-full" style="width: ${idlePercent}%" title="Idle: ${idlePercent}%"></div>
          </div>
        </td>

        <td class="py-3 px-4">
          <div class="flex items-center gap-2">
            <div class="w-12 bg-slate-200 h-2 rounded-full overflow-hidden">
              <div class="bg-amber-400 h-full" style="width: ${asset.fuelLevelPercent}%"></div>
            </div>
            <span class="text-slate-700 font-mono text-[11px] font-semibold">${asset.fuelLevelPercent}%</span>
          </div>
        </td>

        <td class="py-3 px-4 font-mono font-bold text-slate-900">
          $${asset.dailyRate}<span class="text-slate-400 text-[10px]">/d</span>
        </td>

        <td class="py-3 px-4 text-right">
          <div class="flex items-center justify-end gap-1.5">
            ${(!asset.siteId || asset.status === 'Unassigned') ? `
              <button onclick="window.triggerReassignModal('${asset.id}')" class="px-3 py-1 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs rounded-lg shadow-sm transition-transform transform active:scale-95">
                ⚡ Reassign
              </button>
            ` : `
              <button onclick="window.triggerCheckinModal('${asset.id}')" class="px-3 py-1 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-lg border border-slate-300 shadow-sm">
                Check-In
              </button>
            `}
            <button onclick="window.locateAssetOnMap('${asset.id}')" class="p-1.5 text-amber-700 hover:text-amber-900 rounded-lg border border-slate-300 bg-white shadow-sm" title="Locate on Map">
              🗺️
            </button>
            <button onclick="window.openAssetTelemetryModal('${asset.id}')" class="p-1.5 text-slate-600 hover:text-slate-900 rounded-lg border border-slate-300 bg-white shadow-sm" title="View Telemetry">
              📊
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

/**
 * Locate Asset on Map
 */
window.locateAssetOnMap = function(assetId) {
  window.switchTab("map");
  setTimeout(() => {
    if (window.CAT_MAP && window.CAT_MAP.flyToAsset) {
      window.CAT_MAP.flyToAsset(assetId);
    }
  }, 300);
};

/**
 * Anomaly Center View (Clean White Cards & Interactive Voice Narration)
 */
function renderAnomalyCenter() {
  const container = document.getElementById("anomaly-cards-container");
  if (!container) return;

  const anomalies = CAT_ANALYTICS.detectAnomalies(window.currentFleetData);

  if (anomalies.length === 0) {
    container.innerHTML = `
      <div class="col-span-full p-10 text-center bg-white rounded-2xl border border-slate-200 shadow-sm">
        <span class="text-4xl block mb-2">🎉</span>
        <h4 class="text-slate-900 font-bold text-base">Zero Critical Anomalies Detected</h4>
        <p class="text-slate-500 text-xs mt-1">All rented Caterpillar assets are properly assigned and efficiently utilized.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = anomalies.map(anom => {
    const asset = window.currentFleetData.find(a => a.id === anom.assetId);
    const photoUrl = asset?.imageUrl || CAT_IMAGE_MAP[asset?.type] || "https://desimachines.com/wp-content/uploads/2024/12/desi-machines-cat-excavator-345-gc-featured.jpg";

    return `
      <div class="cat-white-card rounded-2xl border ${anom.severity === 'Critical' ? 'border-rose-300' : 'border-amber-300'} overflow-hidden shadow-sm space-y-3">
        
        <!-- Header with Picture Backdrop -->
        <div class="h-32 relative overflow-hidden flex flex-col justify-between p-4"
             style="background: linear-gradient(to bottom, rgba(15, 23, 42, 0.4), rgba(15, 23, 42, 0.9)), url('${photoUrl}'); background-size: cover; background-position: center;">
          <div class="flex items-center justify-between">
            <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
              anom.severity === 'Critical' ? 'bg-rose-500 text-white' : 'bg-amber-400 text-slate-950'
            }">${anom.severity} Alert</span>
            <span class="font-mono text-white text-xs font-black bg-black/70 px-2.5 py-0.5 rounded-md">${anom.assetId}</span>
          </div>
          <div>
            <h4 class="text-white font-extrabold text-base drop-shadow">${anom.title}</h4>
            <p class="text-slate-200 text-xs">${anom.description}</p>
          </div>
        </div>

        <div class="p-5 pt-1 space-y-3">
          <div class="grid grid-cols-2 gap-2.5 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
            ${anom.dataSignals.map(s => `
              <div>
                <span class="text-slate-500 block text-[11px]">${s.label}</span>
                <span class="font-bold ${s.alert ? 'text-rose-600' : 'text-slate-800'}">${s.value}</span>
              </div>
            `).join('')}
          </div>

          <div class="pt-3 border-t border-slate-200 flex items-center justify-between gap-2 flex-wrap">
            <div class="text-xs text-slate-700 leading-tight flex-1">
              💡 <span class="font-bold text-slate-900">Action:</span> ${anom.recommendedAction}
            </div>
            
            <div class="flex items-center gap-1.5">
              <button id="btn-speak-${anom.assetId}" onclick="window.speakAnomaly('${anom.assetId}')" class="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl border border-slate-300 flex items-center gap-1 shadow-sm transition-all" title="Listen to AI Voice Readout">
                <span>🔊</span> Listen
              </button>
              
              <button onclick="window.triggerReassignModal('${anom.actionTargetAsset}')" class="cat-btn-primary px-3.5 py-1.5 text-xs font-black rounded-xl shrink-0 shadow">
                Resolve Now
              </button>
            </div>
          </div>
        </div>

      </div>
    `;
  }).join('');
}

/**
 * Demand Forecasting View (Clean White Cards)
 */
function renderForecastView() {
  const container = document.getElementById("forecast-grid-container");
  if (!container) return;

  const forecastData = CAT_ANALYTICS.generateDemandForecast(SEED_DATA.sites, window.currentFleetData);

  container.innerHTML = forecastData.siteForecasts.map(site => `
    <div id="forecast-card-${site.siteId}" class="cat-white-card p-5 rounded-2xl border ${site.deficitQty > 0 ? 'border-amber-300 bg-amber-50/40' : 'border-slate-200'} space-y-3.5 shadow-sm">
      <div class="flex items-center justify-between border-b border-slate-200 pb-3">
        <div>
          <span class="font-extrabold text-slate-900 text-sm">${site.siteId} - ${site.siteName}</span>
          <div class="text-slate-500 text-xs mt-0.5">${site.location} • Phase: <span class="text-slate-800 font-semibold">${site.projectPhase}</span></div>
        </div>
        ${site.deficitQty > 0 ? `
          <span class="px-2.5 py-1 rounded-full text-[10px] font-black bg-rose-500 text-white uppercase animate-pulse shadow-sm">Deficit Predicted</span>
        ` : `
          <span class="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">Balanced</span>
        `}
      </div>

      <div class="grid grid-cols-3 gap-2.5 text-center text-xs">
        <div class="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
          <span class="text-slate-500 text-[10px] block font-semibold">Excavators</span>
          <span class="font-black text-slate-900">${site.currentFleet.Excavators}</span> <span class="text-slate-400">/ ${site.forecastDemand.Excavators}</span>
        </div>
        <div class="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
          <span class="text-slate-500 text-[10px] block font-semibold">Bulldozers</span>
          <span class="font-black text-slate-900">${site.currentFleet.Bulldozers}</span> <span class="text-slate-400">/ ${site.forecastDemand.Bulldozers}</span>
        </div>
        <div class="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
          <span class="text-slate-500 text-[10px] block font-semibold">Graders</span>
          <span class="font-black text-slate-900">${site.currentFleet.Graders}</span> <span class="text-slate-400">/ ${site.forecastDemand.Graders}</span>
        </div>
      </div>

      <div class="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
        <span class="text-slate-900 font-bold">AI Recommendation:</span>
        <p class="text-slate-600 mt-0.5 leading-relaxed">${site.recommendation}</p>
      </div>

      ${site.deficitQty > 0 ? `
        <button onclick="window.triggerReassignModal('EQX1007')" class="cat-btn-primary w-full py-2.5 rounded-xl text-xs font-black shadow flex items-center justify-center gap-1.5">
          <span>⚡</span> Reallocate Idle EQX1007 to ${site.siteId} (Save $4,200)
        </button>
      ` : ''}
    </div>
  `).join('');
}

/**
 * Chart.js Telemetry Graph (Light Theme Grids & High Contrast Text)
 */
function initUsageChart() {
  const ctx = document.getElementById("usage-telemetry-chart");
  if (!ctx) return;

  const assets = window.currentFleetData;
  const labels = assets.map(a => a.id);
  const workHours = assets.map(a => a.engineHoursDay);
  const idleHours = assets.map(a => a.idleHoursDay);

  if (usageChart) {
    usageChart.destroy();
  }

  usageChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Active Engine Work (h/day)",
          data: workHours,
          backgroundColor: "#10B981",
          borderRadius: 6
        },
        {
          label: "Idle Time (h/day)",
          data: idleHours,
          backgroundColor: "#F59E0B",
          borderRadius: 6
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          grid: { color: "#f1f5f9" },
          ticks: { color: "#475569", font: { family: "JetBrains Mono, monospace", size: 10 } }
        },
        y: {
          grid: { color: "#e2e8f0" },
          ticks: { color: "#475569" },
          title: { display: true, text: "Daily Operating Hours", color: "#64748b" }
        }
      },
      plugins: {
        legend: {
          labels: { color: "#1e293b", font: { size: 12, family: "Outfit, sans-serif", weight: "600" } }
        }
      }
    }
  });
}

/**
 * Real-Time Telemetry Stream
 */
function startTelemetryStream() {
  if (telemetryInterval) clearInterval(telemetryInterval);

  telemetryInterval = setInterval(() => {
    if (!isTelemetryStreaming) return;

    window.currentFleetData.forEach(asset => {
      if (asset.status === "Active") {
        asset.fuelLevelPercent = Math.max(10, parseFloat((asset.fuelLevelPercent - 0.05).toFixed(1)));
      }
    });

    const pill = document.getElementById("stream-status-pill");
    if (pill) {
      pill.classList.toggle("opacity-100");
      pill.classList.toggle("opacity-60");
    }
  }, 2500);
}

window.toggleTelemetryStream = function() {
  isTelemetryStreaming = !isTelemetryStreaming;
  const btn = document.getElementById("stream-toggle-btn");
  if (btn) {
    btn.innerHTML = isTelemetryStreaming 
      ? `<span class="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span> Live IoT Telemetry: Active`
      : `<span>⏸️</span> Live Telemetry: Paused`;
    btn.className = isTelemetryStreaming
      ? "px-3 py-1.5 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors shadow-sm"
      : "px-3 py-1.5 bg-slate-100 border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors shadow-sm";
  }
};

/**
 * Reassignment Action Trigger
 */
window.triggerReassignModal = function(assetId) {
  if (window.CAT_SCANNER) {
    window.CAT_SCANNER.openModal("checkout", assetId);
  }
};

window.triggerCheckinModal = function(assetId) {
  if (window.CAT_SCANNER) {
    window.CAT_SCANNER.openModal("checkin", assetId);
  }
};

window.executeDirectReassignment = function(assetId, targetSiteId, targetOpId) {
  const asset = window.currentFleetData.find(a => a.id === assetId);
  if (!asset) return;

  const targetSite = SEED_DATA.sites.find(s => s.id === targetSiteId);
  asset.siteId = targetSiteId;
  asset.operatorId = targetOpId;
  asset.status = "Active";
  asset.isReassigned = true;
  asset.engineHoursDay = 7.0;
  asset.idleHoursDay = 1.0;
  if (targetSite) {
    asset.lat = targetSite.lat + 0.001;
    asset.lng = targetSite.lng + 0.001;
  }

  window.refreshDashboard();
  if (window.CAT_MAP && window.CAT_MAP.renderAssets) {
    window.CAT_MAP.renderAssets();
  }
  if (window.CAT_MAP && window.CAT_MAP.drawTransitRoute) {
    window.CAT_MAP.drawTransitRoute(SEED_DATA.dealerHub, targetSite);
  }

  window.showGlobalNotification(`⚡ Asset ${asset.id} successfully reassigned to Site ${targetSiteId} with Operator ${targetOpId}! Cost Avoidance: +$4,200.`);
};

/**
 * Telemetry Deep-Dive Modal (Clean White Card)
 */
window.openAssetTelemetryModal = function(assetId) {
  const asset = window.currentFleetData.find(a => a.id === assetId);
  if (!asset) return;

  const modal = document.getElementById("telemetry-modal");
  const modalBody = document.getElementById("telemetry-modal-body");
  if (!modal || !modalBody) return;

  const totalDaily = (asset.engineHoursDay || 0) + (asset.idleHoursDay || 0);
  const wastedRental = (asset.dailyRate || 350) * (asset.operatingDays || 0);
  const photoUrl = asset.imageUrl || CAT_IMAGE_MAP[asset.type] || "https://desimachines.com/wp-content/uploads/2024/12/desi-machines-cat-excavator-345-gc-featured.jpg";

  modalBody.innerHTML = `
    <div class="space-y-4">
      
      <!-- Machinery Image Header -->
      <div class="h-36 rounded-2xl overflow-hidden relative border border-slate-200 shadow-sm"
           style="background: linear-gradient(to bottom, rgba(15, 23, 42, 0.2), rgba(15, 23, 42, 0.85)), url('${photoUrl}'); background-size: cover; background-position: center;">
        <div class="absolute bottom-3 left-3 right-3 flex items-end justify-between">
          <div>
            <span class="font-extrabold text-amber-400 text-lg">${asset.id} • ${asset.model}</span>
            <div class="text-slate-200 text-xs font-mono">SN: ${asset.serialNumber}</div>
          </div>
          <span class="px-2.5 py-1 rounded-full text-xs font-bold ${
            asset.status === 'Unassigned' ? 'bg-rose-500 text-white' :
            asset.status === 'Active' ? 'bg-emerald-500 text-white' :
            'bg-amber-400 text-slate-950'
          }">${asset.status}</span>
        </div>
      </div>

      <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center text-xs">
        <div class="bg-slate-50 p-3 rounded-xl border border-slate-200">
          <span class="text-slate-500 text-[10px] block font-semibold">Operating Site</span>
          <span class="font-bold ${asset.siteId ? 'text-slate-900' : 'text-rose-600'}">${asset.siteId || 'UNASSIGNED'}</span>
        </div>
        <div class="bg-slate-50 p-3 rounded-xl border border-slate-200">
          <span class="text-slate-500 text-[10px] block font-semibold">Assigned Driver</span>
          <span class="font-bold ${asset.operatorId ? 'text-slate-900' : 'text-rose-600'}">${asset.operatorId || 'UNASSIGNED'}</span>
        </div>
        <div class="bg-slate-50 p-3 rounded-xl border border-slate-200">
          <span class="text-slate-500 text-[10px] block font-semibold">Health Score</span>
          <span class="font-bold text-emerald-700">${asset.healthScore}/100</span>
        </div>
        <div class="bg-slate-50 p-3 rounded-xl border border-slate-200">
          <span class="text-slate-500 text-[10px] block font-semibold">Daily Rate</span>
          <span class="font-bold text-amber-900">$${asset.dailyRate}/d</span>
        </div>
      </div>

      <div class="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs space-y-2">
        <span class="text-slate-900 font-bold text-xs uppercase tracking-wider block">Predictive Sensor Diagnostics</span>
        <div class="grid grid-cols-3 gap-2 text-center text-xs">
          <div class="bg-white p-2 rounded-lg border border-slate-200">
            <span class="text-slate-500 text-[10px] block">Oil Life</span>
            <span class="font-bold text-emerald-700">88% (Good)</span>
          </div>
          <div class="bg-white p-2 rounded-lg border border-slate-200">
            <span class="text-slate-500 text-[10px] block">Coolant Temp</span>
            <span class="font-bold text-slate-800">89°C</span>
          </div>
          <div class="bg-white p-2 rounded-lg border border-slate-200">
            <span class="text-slate-500 text-[10px] block">Hydraulic PSI</span>
            <span class="font-bold text-slate-800">3,450 psi</span>
          </div>
        </div>
      </div>

      <div class="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
        <div class="flex justify-between text-xs">
          <span class="text-slate-600 font-medium">Daily Duty Distribution</span>
          <span class="font-mono text-slate-800 font-bold">${asset.engineHoursDay}h Work / ${asset.idleHoursDay}h Idle</span>
        </div>
        <div class="w-full h-3 bg-slate-200 rounded-full overflow-hidden flex">
          <div class="bg-emerald-500 h-full" style="width: ${totalDaily > 0 ? (asset.engineHoursDay/totalDaily)*100 : 0}%"></div>
          <div class="bg-amber-400 h-full" style="width: ${totalDaily > 0 ? (asset.idleHoursDay/totalDaily)*100 : 0}%"></div>
        </div>
      </div>

      <div class="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs space-y-1">
        <span class="font-bold text-rose-800">Financial Waste Audit:</span>
        <p class="text-slate-700">Total days on rent: <strong>${asset.operatingDays} days</strong> ($${asset.dailyRate}/day). Wasted cost on zero work: <strong class="text-rose-700">$${wastedRental.toLocaleString()}</strong>.</p>
      </div>

      <div class="flex justify-end gap-2 pt-2 border-t border-slate-200">
        <button onclick="window.closeAssetTelemetryModal()" class="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border border-slate-300">
          Close
        </button>
        ${(!asset.siteId || asset.status === 'Unassigned') ? `
          <button onclick="window.closeAssetTelemetryModal(); window.triggerReassignModal('${asset.id}')" class="cat-btn-primary px-5 py-2 text-xs font-black rounded-xl shadow">
            ⚡ Reassign to Deficit Site
          </button>
        ` : ''}
      </div>
    </div>
  `;

  modal.classList.remove("hidden");
  modal.classList.add("flex");
};

window.closeAssetTelemetryModal = function() {
  const modal = document.getElementById("telemetry-modal");
  if (modal) {
    modal.classList.add("hidden");
    modal.classList.remove("flex");
  }
};

/**
 * Enterprise ROI Modal
 */
window.openEnterpriseROIModal = function() {
  const modal = document.getElementById("roi-modal");
  if (!modal) return;
  modal.classList.remove("hidden");
  modal.classList.add("flex");
  updateEnterpriseROICalc(250);
};

window.closeEnterpriseROIModal = function() {
  const modal = document.getElementById("roi-modal");
  if (modal) {
    modal.classList.add("hidden");
    modal.classList.remove("flex");
  }
};

window.updateEnterpriseROICalc = function(fleetSize) {
  const roi = CAT_ANALYTICS.calculateEnterpriseROI(parseInt(fleetSize));
  const elFleet = document.getElementById("roi-fleet-val");
  const elSavings = document.getElementById("roi-savings-val");
  const elUnassigned = document.getElementById("roi-unassigned-val");
  const elCO2 = document.getElementById("roi-co2-val");

  if (elFleet) elFleet.innerText = `${roi.fleetSize} Machinery Assets`;
  if (elSavings) elSavings.innerText = `$${roi.projectedAvoidedCostAnnual.toLocaleString()} / year`;
  if (elUnassigned) elUnassigned.innerText = `${roi.unassignedUnits} machines saved from ghost rental`;
  if (elCO2) elCO2.innerText = `${roi.projectedCO2SavedTons} Tons CO₂ eliminated`;
};

/**
 * Export CSV Rental Audit Report
 */
window.exportFleetCSV = function() {
  const assets = window.currentFleetData;
  let csv = "Asset ID,Type,Model,Serial Number,Site ID,Operator ID,Check-Out,Check-In,Operating Days,Engine Hours/Day,Idle Hours/Day,Fuel %,Daily Rate,Status\n";

  assets.forEach(a => {
    csv += `"${a.id}","${a.type}","${a.model}","${a.serialNumber}","${a.siteId || 'UNASSIGNED'}","${a.operatorId || 'UNASSIGNED'}","${a.checkoutDate}","${a.checkinDate}",${a.operatingDays},${a.engineHoursDay},${a.idleHoursDay},${a.fuelLevelPercent},${a.dailyRate},"${a.status}"\n`;
  });

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `Caterpillar_Rental_Audit_${new Date().toISOString().slice(0,10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  window.showGlobalNotification("📄 Rental Audit Report exported as CSV successfully!");
};

/**
 * Global Dashboard Refresh
 */
window.refreshDashboard = function() {
  renderKPICards();
  renderFleetTable();
  renderAnomalyCenter();
  renderForecastView();
  initUsageChart();
};

window.resetFleetData = function() {
  window.currentFleetData = JSON.parse(JSON.stringify(SEED_DATA.assets));
  window.refreshDashboard();
  if (window.CAT_MAP && window.CAT_MAP.renderAssets) {
    window.CAT_MAP.renderAssets();
  }
  if (window.CAT_SCANNER) {
    window.CAT_SCANNER.renderScannerUI("scanner-tab-body");
  }
  window.showGlobalNotification("🔄 Fleet Data Reset to Benchmark Seed Values");
};

/**
 * Toast Notification Banner
 */
window.showGlobalNotification = function(msg) {
  const toast = document.getElementById("global-toast");
  const toastText = document.getElementById("global-toast-text");
  if (toast && toastText) {
    toastText.innerHTML = msg;
    toast.classList.remove("hidden");
    setTimeout(() => toast.classList.add("hidden"), 4500);
  }
};
