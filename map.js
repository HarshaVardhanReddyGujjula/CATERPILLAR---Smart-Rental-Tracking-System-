/**
 * CAT-PULSE GIS MAP CONTROLLER (FAIL-PROOF & ROCK-SOLID)
 * - Seamless integration with single-page tabs and dynamic viewport resizing
 * - Real Industrial Corridor (Chennai / Bangalore regional projects)
 * - Multi-Tile Layer Switcher: Dark Matter, Satellite Imagery, Street Maps
 * - Connected Supply Corridors from CAT Hub to all 6 Jobsites
 * - Real-time equipment pins with interactive telemetry popups
 */

let catMap = null;
let siteLayers = [];
let assetMarkers = [];
let supplyCorridorLines = [];
let activeTransitLine = null;
let currentTileLayer = null;
let activeTileName = "dark";

const TILE_PROVIDERS = {
  dark: {
    name: "Dark Industrial",
    url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    options: { attribution: "&copy; OpenStreetMap &copy; CARTO | CAT-Pulse GIS", subdomains: "abcd", maxZoom: 19 }
  },
  satellite: {
    name: "Satellite Imagery",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    options: { attribution: "Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community", maxZoom: 18 }
  },
  streets: {
    name: "Street Map",
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    options: { attribution: "&copy; OpenStreetMap contributors", maxZoom: 19 }
  }
};

const CAT_MAP = {
  initMap: function(containerId = "map-container") {
    const el = document.getElementById(containerId);
    if (!el) return;

    // Ensure container has guaranteed explicit height
    el.style.height = "550px";
    el.style.minHeight = "550px";
    el.style.width = "100%";

    if (catMap) {
      try {
        catMap.remove();
      } catch (e) {
        console.warn("Map remove notice:", e);
      }
      catMap = null;
    }

    // Centered around the Chennai - Sriperumbudur - Kanchipuram Industrial Corridor
    catMap = L.map(containerId, {
      center: [12.9800, 80.0500],
      zoom: 11,
      zoomControl: true
    });

    this.setTileLayer("dark");
    this.renderSupplyCorridors();
    this.renderSites();
    this.renderAssets();

    // Trigger Leaflet layout recalculation after DOM unhiding
    setTimeout(() => {
      if (catMap) catMap.invalidateSize();
    }, 100);
    setTimeout(() => {
      if (catMap) catMap.invalidateSize();
    }, 350);
  },

  invalidate: function() {
    if (catMap) {
      catMap.invalidateSize();
    }
  },

  setTileLayer: function(layerKey) {
    if (!catMap) return;
    if (currentTileLayer) {
      catMap.removeLayer(currentTileLayer);
    }
    const provider = TILE_PROVIDERS[layerKey] || TILE_PROVIDERS.dark;
    activeTileName = layerKey;
    currentTileLayer = L.tileLayer(provider.url, provider.options).addTo(catMap);

    // Update button states if on screen
    ["dark", "satellite", "streets"].forEach(t => {
      const btn = document.getElementById(`btn-map-tile-${t}`);
      if (btn) {
        if (t === layerKey) {
          btn.className = "px-2.5 py-1 rounded font-bold bg-amber-400 text-black";
        } else {
          btn.className = "px-2.5 py-1 rounded font-bold text-zinc-400 hover:text-white";
        }
      }
    });
  },

  renderSupplyCorridors: function() {
    if (!catMap) return;

    supplyCorridorLines.forEach(l => {
      try { catMap.removeLayer(l); } catch(e){}
    });
    supplyCorridorLines = [];

    const hub = SEED_DATA.dealerHub;

    SEED_DATA.sites.forEach(site => {
      const isDeficitSite = site.id === "S003";
      const line = L.polyline([
        [hub.lat, hub.lng],
        [site.lat, site.lng]
      ], {
        color: isDeficitSite ? "#EF4444" : "#FFCD00",
        weight: isDeficitSite ? 2.5 : 1.5,
        opacity: isDeficitSite ? 0.85 : 0.45,
        dashArray: isDeficitSite ? "5, 8" : "3, 6"
      }).addTo(catMap);

      line.bindTooltip(`Supply Corridor: CAT Hub ➔ ${site.id} (${site.name})`, {
        sticky: true,
        className: "bg-zinc-900 text-amber-400 font-mono text-[10px] border border-zinc-700"
      });

      supplyCorridorLines.push(line);
    });
  },

  renderSites: function() {
    if (!catMap) return;

    siteLayers.forEach(l => {
      try { catMap.removeLayer(l); } catch(e){}
    });
    siteLayers = [];

    // Render Central Caterpillar Staging Yard Hub
    const hub = SEED_DATA.dealerHub;
    const hubIcon = L.divIcon({
      className: "cat-hub-pin",
      html: `<div class="flex flex-col items-center justify-center w-12 h-12 bg-amber-400 border-2 border-black rounded-xl shadow-2xl font-black text-black text-xs transform hover:scale-110 transition-transform">
        <span class="text-sm leading-none">CAT</span>
        <span class="text-[8px] font-bold uppercase tracking-tighter">HUB</span>
      </div>`,
      iconSize: [48, 48],
      iconAnchor: [24, 24]
    });

    const hubMarker = L.marker([hub.lat, hub.lng], { icon: hubIcon })
      .bindPopup(`
        <div class="p-3 bg-zinc-900 text-white rounded-lg text-xs font-sans min-w-[220px]">
          <div class="text-amber-400 font-bold uppercase tracking-wider text-sm flex items-center gap-1.5">
            <span>🏭</span> ${hub.name}
          </div>
          <div class="text-zinc-400 mt-0.5 text-[11px]">${hub.location}</div>
          <div class="text-zinc-500 text-[10px]">${hub.address}</div>
          
          <div class="mt-2 bg-zinc-950 p-2 rounded border border-zinc-800 text-[11px] space-y-1">
            <div class="text-zinc-300"><span class="text-zinc-500">Facility:</span> Central Distribution & Assembly</div>
            <div class="text-zinc-300"><span class="text-zinc-500">Staged Surplus:</span> 3 Unassigned Machinery Units</div>
          </div>
        </div>
      `);
    hubMarker.addTo(catMap);
    siteLayers.push(hubMarker);

    // Render Real Jobsites & Geofence Rings
    SEED_DATA.sites.forEach(site => {
      const isDeficit = site.forecastDeficit;

      const circle = L.circle([site.lat, site.lng], {
        color: isDeficit ? "#EF4444" : "#FFCD00",
        fillColor: isDeficit ? "#EF4444" : "#FFCD00",
        fillOpacity: 0.15,
        weight: 2,
        dashArray: isDeficit ? "6, 6" : null,
        radius: site.radiusMeters
      }).addTo(catMap);

      const siteIcon = L.divIcon({
        className: "cat-site-pin",
        html: `
          <div class="px-2.5 py-1 bg-zinc-950/90 backdrop-blur border ${isDeficit ? "border-red-500 text-red-400" : "border-amber-400 text-amber-400"} rounded-lg shadow-xl text-[11px] font-bold whitespace-nowrap flex items-center gap-1.5 cursor-pointer">
            <span>📍</span> <span>${site.id}: ${site.name}</span>
            ${isDeficit ? '<span class="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>' : ''}
          </div>
        `,
        iconSize: [160, 28],
        iconAnchor: [80, 14]
      });

      const marker = L.marker([site.lat, site.lng], { icon: siteIcon })
        .bindPopup(`
          <div class="p-3 bg-zinc-900 text-white rounded-lg text-xs font-sans min-w-[240px]">
            <div class="font-bold text-amber-400 text-sm flex items-center justify-between">
              <span>${site.id} - ${site.name}</span>
            </div>
            <div class="text-zinc-400 text-[11px] mt-0.5">${site.location}</div>
            
            <div class="mt-2 space-y-1 bg-zinc-950 p-2 rounded border border-zinc-800 text-[11px]">
              <div class="text-zinc-300"><span class="text-zinc-500">Project:</span> ${site.currentProject}</div>
              <div class="text-zinc-300"><span class="text-zinc-500">Phase:</span> ${site.projectPhase}</div>
              <div class="text-zinc-300"><span class="text-zinc-500">Geofence:</span> ${site.radiusMeters}m radius</div>
            </div>

            ${isDeficit ? `
              <div class="mt-2 p-2 bg-red-950/80 border border-red-800 rounded text-red-300 font-semibold text-[11px]">
                ⚠️ Deficit Forecast: Needs +${site.forecastDeficit.quantity} ${site.forecastDeficit.type} on ${site.forecastDeficit.startDate}
              </div>
            ` : ''}
          </div>
        `);
      marker.addTo(catMap);
      siteLayers.push(circle);
      siteLayers.push(marker);
    });
  },

  renderAssets: function() {
    if (!catMap) return;

    assetMarkers.forEach(m => {
      try { catMap.removeLayer(m); } catch(e){}
    });
    assetMarkers = [];

    const assets = window.currentFleetData || SEED_DATA.assets;

    assets.forEach(asset => {
      if (!asset.lat || !asset.lng) return;

      let colorClass = "bg-emerald-500 border-emerald-300";
      let pulseRing = "";

      if (asset.status === "Unassigned" || !asset.siteId) {
        colorClass = "bg-red-600 border-red-300";
        pulseRing = '<span class="absolute -inset-1 rounded-full bg-red-500/50 animate-ping"></span>';
      } else if (asset.status === "Idle" || asset.idleHoursDay > asset.engineHoursDay) {
        colorClass = "bg-amber-500 border-amber-300";
      }

      let typeIcon = "🚜";
      if (asset.type === "Excavator") typeIcon = "🏗️";
      if (asset.type === "Crane") typeIcon = "🏗️";
      if (asset.type === "Bulldozer") typeIcon = "🚜";
      if (asset.type === "Grader") typeIcon = "🛣️";
      if (asset.type === "Dump Truck") typeIcon = "🚚";
      if (asset.type === "Wheel Loader") typeIcon = "🚜";
      if (asset.type === "Backhoe") typeIcon = "🚜";
      if (asset.type === "Compactor") typeIcon = "🚜";
      if (asset.type === "Generator") typeIcon = "⚡";

      const icon = L.divIcon({
        className: "cat-asset-pin relative",
        html: `
          <div class="relative flex items-center justify-center w-8 h-8 ${colorClass} border-2 rounded-full text-white text-xs font-black shadow-lg cursor-pointer transform hover:scale-125 transition-transform" title="${asset.id} - ${asset.model}">
            ${pulseRing}
            <span>${typeIcon}</span>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      const marker = L.marker([asset.lat, asset.lng], { icon: icon })
        .bindPopup(`
          <div class="p-3 bg-zinc-900 text-white rounded-lg text-xs font-sans min-w-[220px]">
            <div class="flex items-center justify-between border-b border-zinc-800 pb-1.5">
              <span class="font-bold text-amber-400 text-sm">${asset.id}</span>
              <span class="px-1.5 py-0.5 rounded text-[10px] font-bold ${
                asset.status === 'Unassigned' ? 'bg-red-950 text-red-400 border border-red-800' :
                asset.status === 'Active' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' :
                'bg-amber-950 text-amber-400 border border-amber-800'
              }">${asset.status}</span>
            </div>

            <div class="text-zinc-300 font-semibold mt-1">${asset.model}</div>
            <div class="text-zinc-500 text-[11px]">${asset.serialNumber}</div>

            <div class="grid grid-cols-2 gap-1.5 mt-2 bg-zinc-950 p-2 rounded border border-zinc-800 text-[11px]">
              <div><span class="text-zinc-500">Site:</span> <span class="font-bold ${asset.siteId ? 'text-zinc-200' : 'text-red-400'}">${asset.siteId || 'UNASSIGNED'}</span></div>
              <div><span class="text-zinc-500">Driver:</span> <span class="font-bold ${asset.operatorId ? 'text-zinc-200' : 'text-red-400'}">${asset.operatorId || 'NONE'}</span></div>
              <div><span class="text-zinc-500">Work:</span> <span class="font-bold text-emerald-400">${asset.engineHoursDay}h/d</span></div>
              <div><span class="text-zinc-500">Idle:</span> <span class="font-bold ${asset.idleHoursDay > 5 ? 'text-amber-400' : 'text-zinc-300'}">${asset.idleHoursDay}h/d</span></div>
              <div><span class="text-zinc-500">Fuel:</span> <span class="font-bold text-amber-300">${asset.fuelLevelPercent}%</span></div>
              <div><span class="text-zinc-500">Rate:</span> <span class="font-bold text-zinc-200">$${asset.dailyRate}/d</span></div>
            </div>

            <div class="mt-2.5 flex items-center gap-1.5">
              ${(!asset.siteId || asset.status === 'Unassigned') ? `
                <button onclick="window.triggerReassignModal('${asset.id}')" class="flex-1 py-1 px-2 bg-amber-400 hover:bg-amber-500 text-black font-bold rounded text-center text-[11px] transition-colors">
                  ⚡ 1-Click Reassign
                </button>
              ` : `
                <button onclick="window.triggerCheckinModal('${asset.id}')" class="flex-1 py-1 px-2 bg-zinc-800 hover:bg-zinc-700 text-amber-400 font-bold rounded text-center text-[11px] transition-colors">
                  Check-In / Out
                </button>
              `}
              <button onclick="window.openAssetTelemetryModal('${asset.id}')" class="py-1 px-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded text-center text-[11px]">
                📊 Telemetry
              </button>
            </div>
          </div>
        `);

      marker.addTo(catMap);
      assetMarkers.push(marker);
    });
  },

  flyToSite: function(siteId) {
    if (!catMap) return;
    if (siteId === "HUB") {
      const hub = SEED_DATA.dealerHub;
      catMap.flyTo([hub.lat, hub.lng], 14, { duration: 1.2 });
      return;
    }
    const site = SEED_DATA.sites.find(s => s.id === siteId);
    if (site) {
      catMap.flyTo([site.lat, site.lng], 14, { duration: 1.2 });
    }
  },

  flyToAsset: function(assetId) {
    if (!catMap) return;
    const assets = window.currentFleetData || SEED_DATA.assets;
    const asset = assets.find(a => a.id === assetId);
    if (asset && asset.lat && asset.lng) {
      catMap.flyTo([asset.lat, asset.lng], 15, { duration: 1.5 });
    }
  },

  drawTransitRoute: function(origin, destination) {
    if (!catMap || !origin || !destination) return;

    if (activeTransitLine) {
      try { catMap.removeLayer(activeTransitLine); } catch(e){}
    }

    const latlngs = [
      [origin.lat, origin.lng],
      [destination.lat, destination.lng]
    ];

    activeTransitLine = L.polyline(latlngs, {
      color: "#FFCD00",
      weight: 4,
      dashArray: "10, 10",
      opacity: 1.0
    }).addTo(catMap);

    catMap.fitBounds(activeTransitLine.getBounds(), { padding: [50, 50] });
  }
};

window.CAT_MAP = CAT_MAP;
