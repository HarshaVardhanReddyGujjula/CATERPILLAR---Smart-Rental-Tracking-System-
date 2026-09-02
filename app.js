/**
 * CAT-PULSE MAIN APPLICATION CONTROLLER (ENHANCED)
 * Handles global state, table filtering, telemetry simulation, Chart.js graphs,
 * CSV report export, Enterprise ROI modal, and seamless GIS Map + Scanner tab switching.
 */

window.currentFleetData = JSON.parse(JSON.stringify(SEED_DATA.assets));
let isTelemetryStreaming = true;
let telemetryInterval = null;
let usageChart = null;
let currentActiveTab = "fleet";

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
 * Tab Navigation (With guaranteed Leaflet map & Scanner re-layout)
 */
window.switchTab = function(tabName) {
  currentActiveTab = tabName;

  const tabs = ["fleet", "map", "anomalies", "forecast", "scanner", "copilot"];
  tabs.forEach(t => {
    const view = document.getElementById(`view-${t}`);
    const btn = document.getElementById(`tab-btn-${t}`);
    if (view) {
      if (t === tabName) {
        view.classList.remove("hidden");
      } else {
        view.classList.add("hidden");
      }
    }
    if (btn) {
      if (t === tabName) {
        btn.className = "px-3.5 py-1.5 text-xs font-black rounded-lg bg-amber-400 text-black flex items-center gap-1.5 whitespace-nowrap transition-colors shadow";
      } else {
        btn.className = "px-3.5 py-1.5 text-xs font-semibold text-zinc-400 hover:text-white rounded-lg flex items-center gap-1.5 whitespace-nowrap transition-colors";
      }
    }
  });

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
};

/**
 * KPI Metric Cards
 */
function renderKPICards() {
  const kpis = CAT_ANALYTICS.calculateFleetKPIs(window.currentFleetData);

  const setVal = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.innerText = val;
  };

  setVal("kpi-total-fleet", kpis.totalRented);
  setVal("kpi-active", kpis.activeCount);
  setVal("kpi-idle", kpis.idleCount);
  setVal("kpi-unassigned", kpis.unassignedCount);
  setVal("kpi-utilization", `${kpis.fleetUtilization}%`);
  setVal("kpi-avoided-cost", `$${kpis.totalAvoidedCost.toLocaleString()}`);
  setVal("kpi-wasted-spend", `$${kpis.totalWastedSpend.toLocaleString()}`);

  const avoidedCard = document.getElementById("kpi-card-avoided");
  if (avoidedCard) {
    if (kpis.totalAvoidedCost > 0) {
      avoidedCard.classList.add("border-emerald-400", "bg-emerald-950/30", "ring-2", "ring-emerald-500/50");
    } else {
      avoidedCard.classList.remove("border-emerald-400", "bg-emerald-950/30", "ring-2", "ring-emerald-500/50");
    }
  }
}

/**
 * Fleet Table Rendering & Filter
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

    let statusBadge = "";
    if (asset.status === "Unassigned" || !asset.siteId) {
      statusBadge = `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-red-950 text-red-400 border border-red-800 animate-pulse">
        <span class="w-1.5 h-1.5 rounded-full bg-red-500"></span> Unassigned
      </span>`;
    } else if (asset.status === "Idle" || asset.idleHoursDay > asset.engineHoursDay) {
      statusBadge = `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-amber-950 text-amber-400 border border-amber-800">
        <span class="w-1.5 h-1.5 rounded-full bg-amber-500"></span> High Idle
      </span>`;
    } else {
      statusBadge = `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
        <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Active Duty
      </span>`;
    }

    return `
      <tr id="asset-row-${asset.id}" class="border-b border-zinc-800/80 hover:bg-zinc-800/40 transition-colors font-sans text-xs">
        <td class="py-3 px-3">
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 rounded bg-zinc-900 border border-zinc-700 flex items-center justify-center font-bold text-amber-400 text-xs">
              ${asset.type === 'Excavator' ? '🏗️' : asset.type === 'Bulldozer' ? '🚜' : asset.type === 'Crane' ? '🏗️' : asset.type === 'Dump Truck' ? '🚚' : asset.type === 'Generator' ? '⚡' : '🛣️'}
            </div>
            <div>
              <div class="font-bold text-white font-mono flex items-center gap-1.5">
                <span>${asset.id}</span>
                ${asset.isReassigned ? '<span class="text-[9px] px-1 bg-emerald-500/20 text-emerald-400 rounded font-bold">REASSIGNED</span>' : ''}
              </div>
              <div class="text-[11px] text-zinc-400">${asset.model}</div>
            </div>
          </div>
        </td>

        <td class="py-3 px-3">
          <span class="font-semibold text-zinc-300">${asset.type}</span>
        </td>

        <td class="py-3 px-3">
          ${asset.siteId ? `
            <div class="font-bold text-zinc-200">${asset.siteId}</div>
            <div class="text-[10px] text-zinc-500">${SEED_DATA.sites.find(s => s.id === asset.siteId)?.name || ''}</div>
          ` : `
            <span class="font-mono text-red-400 font-bold bg-red-950/40 px-1.5 py-0.5 rounded border border-red-900">NULL</span>
          `}
        </td>

        <td class="py-3 px-3">
          ${asset.operatorId ? `
            <div class="font-semibold text-zinc-200">${asset.operatorId}</div>
            <div class="text-[10px] text-zinc-500">${SEED_DATA.operators.find(o => o.id === asset.operatorId)?.name || ''}</div>
          ` : `
            <span class="font-mono text-red-400 font-bold bg-red-950/40 px-1.5 py-0.5 rounded border border-red-900">NULL</span>
          `}
        </td>

        <td class="py-3 px-3">
          ${statusBadge}
        </td>

        <td class="py-3 px-3 min-w-[130px]">
          <div class="flex items-center justify-between text-[11px] mb-1">
            <span class="text-emerald-400 font-bold">${asset.engineHoursDay}h work</span>
            <span class="text-amber-400 font-bold">${asset.idleHoursDay}h idle</span>
          </div>
          <div class="w-full h-2 bg-zinc-800 rounded-full overflow-hidden flex">
            <div class="bg-emerald-500 h-full" style="width: ${workPercent}%" title="Work: ${workPercent}%"></div>
            <div class="bg-amber-500 h-full" style="width: ${idlePercent}%" title="Idle: ${idlePercent}%"></div>
          </div>
        </td>

        <td class="py-3 px-3">
          <div class="flex items-center gap-1.5">
            <div class="w-10 bg-zinc-800 h-1.5 rounded-full overflow-hidden">
              <div class="bg-amber-400 h-full" style="width: ${asset.fuelLevelPercent}%"></div>
            </div>
            <span class="text-zinc-300 font-mono text-[11px]">${asset.fuelLevelPercent}%</span>
          </div>
        </td>

        <td class="py-3 px-3 font-mono font-bold text-zinc-200">
          $${asset.dailyRate}<span class="text-zinc-500 text-[10px]">/d</span>
        </td>

        <td class="py-3 px-3 text-right">
          <div class="flex items-center justify-end gap-1.5">
            ${(!asset.siteId || asset.status === 'Unassigned') ? `
              <button onclick="window.triggerReassignModal('${asset.id}')" class="px-2.5 py-1 bg-amber-400 hover:bg-amber-500 text-black font-extrabold text-[11px] rounded transition-transform transform hover:scale-105 shadow">
                ⚡ Reassign
              </button>
            ` : `
              <button onclick="window.triggerCheckinModal('${asset.id}')" class="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-amber-400 text-[11px] font-bold rounded border border-zinc-700">
                Check-In
              </button>
            `}
            <button onclick="window.locateAssetOnMap('${asset.id}')" class="p-1 text-amber-400 hover:text-white rounded border border-zinc-800 bg-zinc-900" title="Locate on GIS Map">
              🗺️
            </button>
            <button onclick="window.openAssetTelemetryModal('${asset.id}')" class="p-1 text-zinc-400 hover:text-white rounded" title="View Telemetry">
              📊
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

/**
 * Locate Asset on Map directly from Table
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
 * Anomaly Center View
 */
function renderAnomalyCenter() {
  const container = document.getElementById("anomaly-cards-container");
  if (!container) return;

  const anomalies = CAT_ANALYTICS.detectAnomalies(window.currentFleetData);

  if (anomalies.length === 0) {
    container.innerHTML = `
      <div class="col-span-full p-8 text-center bg-zinc-900/50 rounded-xl border border-zinc-800">
        <span class="text-4xl block mb-2">🎉</span>
        <h4 class="text-white font-bold text-base">Zero Critical Anomalies Detected</h4>
        <p class="text-zinc-400 text-xs mt-1">All rented Caterpillar assets are properly assigned and utilized.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = anomalies.map(anom => `
    <div class="bg-zinc-950 p-4 rounded-xl border ${anom.severity === 'Critical' ? 'border-red-600/80 bg-red-950/10' : 'border-amber-600/80 bg-amber-950/10'} space-y-3 shadow-lg">
      <div class="flex items-center justify-between">
        <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
          anom.severity === 'Critical' ? 'bg-red-500 text-black' : 'bg-amber-400 text-black'
        }">${anom.severity} Alert</span>
        <span class="font-mono text-zinc-400 text-xs font-bold">${anom.assetId}</span>
      </div>

      <div>
        <h4 class="text-white font-bold text-sm">${anom.title}</h4>
        <p class="text-zinc-400 text-xs mt-0.5">${anom.description}</p>
      </div>

      <div class="grid grid-cols-2 gap-2 bg-zinc-900/80 p-2.5 rounded-lg border border-zinc-800 text-[11px]">
        ${anom.dataSignals.map(s => `
          <div>
            <span class="text-zinc-500 block text-[10px]">${s.label}</span>
            <span class="font-bold ${s.alert ? 'text-red-400' : 'text-zinc-200'}">${s.value}</span>
          </div>
        `).join('')}
      </div>

      <div class="pt-2 border-t border-zinc-800/80 flex items-center justify-between gap-2">
        <div class="text-[11px] text-zinc-300 leading-tight">
          💡 <span class="font-semibold text-amber-400">Action:</span> ${anom.recommendedAction}
        </div>
        <button onclick="window.triggerReassignModal('${anom.actionTargetAsset}')" class="px-3 py-1.5 bg-amber-400 hover:bg-amber-500 text-black font-extrabold text-xs rounded shrink-0 shadow">
          Resolve Now
        </button>
      </div>
    </div>
  `).join('');
}

/**
 * Demand Forecasting View
 */
function renderForecastView() {
  const container = document.getElementById("forecast-grid-container");
  if (!container) return;

  const forecastData = CAT_ANALYTICS.generateDemandForecast(SEED_DATA.sites, window.currentFleetData);

  container.innerHTML = forecastData.siteForecasts.map(site => `
    <div id="forecast-card-${site.siteId}" class="bg-zinc-950 p-4 rounded-xl border ${site.deficitQty > 0 ? 'border-amber-400 bg-amber-950/10' : 'border-zinc-800'} space-y-3">
      <div class="flex items-center justify-between border-b border-zinc-800 pb-2">
        <div>
          <span class="font-bold text-amber-400 text-sm">${site.siteId} - ${site.siteName}</span>
          <div class="text-zinc-500 text-[11px]">${site.location} • Phase: <span class="text-zinc-300 font-semibold">${site.projectPhase}</span></div>
        </div>
        ${site.deficitQty > 0 ? `
          <span class="px-2 py-0.5 rounded text-[10px] font-extrabold bg-red-500 text-black uppercase animate-pulse">Deficit Predicted</span>
        ` : `
          <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">Balanced</span>
        `}
      </div>

      <div class="grid grid-cols-3 gap-2 text-center text-xs">
        <div class="bg-zinc-900 p-2 rounded border border-zinc-800">
          <span class="text-zinc-500 text-[10px] block">Excavators</span>
          <span class="font-bold text-zinc-200">${site.currentFleet.Excavators}</span> <span class="text-zinc-500">/ ${site.forecastDemand.Excavators} need</span>
        </div>
        <div class="bg-zinc-900 p-2 rounded border border-zinc-800">
          <span class="text-zinc-500 text-[10px] block">Bulldozers</span>
          <span class="font-bold text-zinc-200">${site.currentFleet.Bulldozers}</span> <span class="text-zinc-500">/ ${site.forecastDemand.Bulldozers} need</span>
        </div>
        <div class="bg-zinc-900 p-2 rounded border border-zinc-800">
          <span class="text-zinc-500 text-[10px] block">Graders</span>
          <span class="font-bold text-zinc-200">${site.currentFleet.Graders}</span> <span class="text-zinc-500">/ ${site.forecastDemand.Graders} need</span>
        </div>
      </div>

      <div class="p-2.5 bg-zinc-900/60 rounded-lg border border-zinc-800 text-[11px]">
        <span class="text-amber-400 font-bold">AI Recommendation:</span>
        <p class="text-zinc-300 mt-0.5">${site.recommendation}</p>
      </div>

      ${site.deficitQty > 0 ? `
        <button onclick="window.triggerReassignModal('EQX1007')" class="w-full py-1.5 bg-amber-400 hover:bg-amber-500 text-black font-extrabold text-xs rounded transition-colors shadow flex items-center justify-center gap-1.5">
          <span>⚡</span> Reallocate Idle EQX1007 to ${site.siteId} (Save $4,200)
        </button>
      ` : ''}
    </div>
  `).join('');
}

/**
 * Chart.js Telemetry Graph
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
          borderRadius: 4
        },
        {
          label: "Idle Time (h/day)",
          data: idleHours,
          backgroundColor: "#F59E0B",
          borderRadius: 4
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          grid: { color: "#27272a" },
          ticks: { color: "#a1a1aa", font: { family: "monospace", size: 10 } }
        },
        y: {
          grid: { color: "#27272a" },
          ticks: { color: "#a1a1aa" },
          title: { display: true, text: "Daily Operating Hours", color: "#71717a" }
        }
      },
      plugins: {
        legend: {
          labels: { color: "#e4e4e7", font: { size: 11, family: "sans-serif" } }
        }
      }
    }
  });
}

/**
 * Real-Time Telemetry Stream Simulation
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
      ? `<span class="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span> Live IoT Stream: ACTIVE`
      : `<span>⏸️</span> Live Telemetry: PAUSED`;
  }
};

/**
 * Reassignment Action Modal & Execution
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

/**
 * Telemetry Deep-Dive Modal
 */
window.openAssetTelemetryModal = function(assetId) {
  const asset = window.currentFleetData.find(a => a.id === assetId);
  if (!asset) return;

  const modal = document.getElementById("telemetry-modal");
  const modalBody = document.getElementById("telemetry-modal-body");
  if (!modal || !modalBody) return;

  const totalDaily = (asset.engineHoursDay || 0) + (asset.idleHoursDay || 0);
  const wastedRental = (asset.dailyRate || 350) * (asset.operatingDays || 0);

  modalBody.innerHTML = `
    <div class="space-y-4">
      <div class="flex items-center justify-between border-b border-zinc-800 pb-3">
        <div>
          <span class="font-bold text-amber-400 text-base">${asset.id} • ${asset.model}</span>
          <div class="text-zinc-400 text-xs font-mono">SN: ${asset.serialNumber}</div>
        </div>
        <span class="px-2 py-1 rounded text-xs font-bold ${
          asset.status === 'Unassigned' ? 'bg-red-950 text-red-400 border border-red-800' :
          asset.status === 'Active' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' :
          'bg-amber-950 text-amber-400 border border-amber-800'
        }">${asset.status}</span>
      </div>

      <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center text-xs">
        <div class="bg-zinc-950 p-2.5 rounded-lg border border-zinc-800">
          <span class="text-zinc-500 text-[10px] block">Operating Site</span>
          <span class="font-bold ${asset.siteId ? 'text-zinc-200' : 'text-red-400'}">${asset.siteId || 'UNASSIGNED'}</span>
        </div>
        <div class="bg-zinc-950 p-2.5 rounded-lg border border-zinc-800">
          <span class="text-zinc-500 text-[10px] block">Assigned Driver</span>
          <span class="font-bold ${asset.operatorId ? 'text-zinc-200' : 'text-red-400'}">${asset.operatorId || 'UNASSIGNED'}</span>
        </div>
        <div class="bg-zinc-950 p-2.5 rounded-lg border border-zinc-800">
          <span class="text-zinc-500 text-[10px] block">Health Score</span>
          <span class="font-bold text-emerald-400">${asset.healthScore}/100</span>
        </div>
        <div class="bg-zinc-950 p-2.5 rounded-lg border border-zinc-800">
          <span class="text-zinc-500 text-[10px] block">Daily Rate</span>
          <span class="font-bold text-amber-400">$${asset.dailyRate}/d</span>
        </div>
      </div>

      <div class="bg-zinc-950 p-3 rounded-lg border border-zinc-800 text-xs space-y-2">
        <span class="text-amber-400 font-bold text-[11px] uppercase tracking-wider block">Predictive Sensor Diagnostics</span>
        <div class="grid grid-cols-3 gap-2 text-center text-[11px]">
          <div class="bg-zinc-900 p-2 rounded">
            <span class="text-zinc-500 text-[10px] block">Oil Life</span>
            <span class="font-bold text-emerald-400">88% (Good)</span>
          </div>
          <div class="bg-zinc-900 p-2 rounded">
            <span class="text-zinc-500 text-[10px] block">Coolant Temp</span>
            <span class="font-bold text-zinc-200">89°C</span>
          </div>
          <div class="bg-zinc-900 p-2 rounded">
            <span class="text-zinc-500 text-[10px] block">Hydraulic PSI</span>
            <span class="font-bold text-zinc-200">3,450 psi</span>
          </div>
        </div>
      </div>

      <div class="bg-zinc-950 p-3 rounded-lg border border-zinc-800 space-y-2">
        <div class="flex justify-between text-xs">
          <span class="text-zinc-400">Daily Duty Distribution</span>
          <span class="font-mono text-zinc-300">${asset.engineHoursDay}h Work / ${asset.idleHoursDay}h Idle</span>
        </div>
        <div class="w-full h-3 bg-zinc-800 rounded-full overflow-hidden flex">
          <div class="bg-emerald-500 h-full" style="width: ${totalDaily > 0 ? (asset.engineHoursDay/totalDaily)*100 : 0}%"></div>
          <div class="bg-amber-500 h-full" style="width: ${totalDaily > 0 ? (asset.idleHoursDay/totalDaily)*100 : 0}%"></div>
        </div>
      </div>

      <div class="p-3 bg-red-950/30 border border-red-900/60 rounded-lg text-xs space-y-1">
        <span class="font-bold text-red-400">Financial Waste Audit:</span>
        <p class="text-zinc-300">Total days on rent: <strong>${asset.operatingDays} days</strong> ($${asset.dailyRate}/day). Wasted cost on zero work: <strong class="text-red-400">$${wastedRental.toLocaleString()}</strong>.</p>
      </div>

      <div class="flex justify-end gap-2 pt-2 border-t border-zinc-800">
        <button onclick="window.closeAssetTelemetryModal()" class="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold rounded">
          Close
        </button>
        ${(!asset.siteId || asset.status === 'Unassigned') ? `
          <button onclick="window.closeAssetTelemetryModal(); window.triggerReassignModal('${asset.id}')" class="px-4 py-1.5 bg-amber-400 hover:bg-amber-500 text-black text-xs font-extrabold rounded shadow">
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
