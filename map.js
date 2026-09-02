/**
 * CAT-PULSE GIS MAP CONTROLLER (LIGHT MODERN THEME & PHOTO POPUPS)
 * - Seamless integration with single-page tabs and dynamic viewport resizing
 * - Real Industrial Corridor (Chennai / Bangalore regional projects)
 * - Multi-Tile Layer Switcher: Street Map (Default), Satellite Imagery, Dark Industrial
 * - Connected Supply Corridors from CAT Hub to all 6 Jobsites
 * - Real-time equipment pins with authentic machine photos and telemetry
 */

let catMap = null;
let siteLayers = [];
let assetMarkers = [];
let supplyCorridorLines = [];
let activeTransitLine = null;
let currentTileLayer = null;
let activeTileName = "streets";

const TILE_PROVIDERS = {
  streets: {
    name: "Clean Street Map",
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    options: { attribution: "&copy; OpenStreetMap contributors | CAT-Pulse GIS", maxZoom: 19 }
  },
  satellite: {
    name: "Satellite Imagery",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    options: { attribution: "Tiles &copy; Esri &mdash; Source: Esri, USGS", maxZoom: 18 }
  },
  dark: {
    name: "Dark Industrial",
    url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    options: { attribution: "&copy; OpenStreetMap &copy; CARTO", subdomains: "abcd", maxZoom: 19 }
  }
};

const CAT_MAP = {
  initMap: function(containerId = "map-container") {
    const el = document.getElementById(containerId);
    if (!el) return;

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

    catMap = L.map(containerId, {
      center: [12.9800, 80.0500],
      zoom: 11,
      zoomControl: true
    });

    this.setTileLayer("streets");
    this.renderSupplyCorridors();
    this.renderSites();
    this.renderAssets();

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
    const provider = TILE_PROVIDERS[layerKey] || TILE_PROVIDERS.streets;
    activeTileName = layerKey;
    currentTileLayer = L.tileLayer(provider.url, provider.options).addTo(catMap);

    ["streets", "satellite", "dark"].forEach(t => {
      const btn = document.getElementById(`btn-map-tile-${t}`);
      if (btn) {
        if (t === layerKey) {
          btn.className = "px-3 py-1 rounded-lg font-bold bg-amber-400 text-slate-950 shadow-sm";
        } else {
          btn.className = "px-3 py-1 rounded-lg font-bold text-slate-600 hover:text-slate-900";
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
        color: isDeficitSite ? "#E11D48" : "#D97706",
        weight: isDeficitSite ? 3 : 2,
        opacity: isDeficitSite ? 0.9 : 0.6,
        dashArray: isDeficitSite ? "6, 8" : "4, 6"
      }).addTo(catMap);

      line.bindTooltip(`Supply Corridor: CAT Hub ➔ ${site.id} (${site.name})`, {
        sticky: true,
        className: "bg-white text-slate-900 font-mono text-[11px] border border-slate-300 shadow-sm rounded-lg"
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

    const hub = SEED_DATA.dealerHub;
    const hubIcon = L.divIcon({
      className: "cat-hub-pin",
      html: `<div class="flex flex-col items-center justify-center w-12 h-12 bg-amber-400 border-2 border-black rounded-2xl shadow-xl font-black text-black text-xs transform hover:scale-110 transition-transform">
        <span class="text-sm leading-none font-black">CAT</span>
        <span class="text-[8px] font-bold uppercase tracking-tighter">HUB</span>
      </div>`,
      iconSize: [48, 48],
      iconAnchor: [24, 24]
    });

    const hubMarker = L.marker([hub.lat, hub.lng], { icon: hubIcon })
      .bindPopup(`
        <div class="p-4 bg-white text-slate-900 rounded-2xl text-xs font-sans min-w-[240px] shadow-lg">
          <div class="text-slate-900 font-black uppercase tracking-wider text-sm flex items-center gap-1.5">
            <span>🏭</span> ${hub.name}
          </div>
          <div class="text-slate-500 mt-0.5 text-[11px]">${hub.location}</div>
          <div class="text-slate-400 text-[10px]">${hub.address}</div>
          
          <div class="mt-3 bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs space-y-1">
            <div class="text-slate-700"><span class="text-slate-400 font-semibold">Facility:</span> Central Staging Yard</div>
            <div class="text-slate-700"><span class="text-slate-400 font-semibold">Staged Surplus:</span> 3 Unassigned Units</div>
          </div>
        </div>
      `);
    hubMarker.addTo(catMap);
    siteLayers.push(hubMarker);

    SEED_DATA.sites.forEach(site => {
      const isDeficit = site.forecastDeficit;

      const circle = L.circle([site.lat, site.lng], {
        color: isDeficit ? "#E11D48" : "#D97706",
        fillColor: isDeficit ? "#F43F5E" : "#F59E0B",
        fillOpacity: 0.18,
        weight: 2.5,
        dashArray: isDeficit ? "6, 6" : null,
        radius: site.radiusMeters
      }).addTo(catMap);

      const siteIcon = L.divIcon({
        className: "cat-site-pin",
        html: `
          <div class="px-3 py-1 bg-white border ${isDeficit ? "border-rose-400 text-rose-700" : "border-slate-300 text-slate-800"} rounded-xl shadow-md text-xs font-bold whitespace-nowrap flex items-center gap-1.5 cursor-pointer">
            <span>📍</span> <span>${site.id}: ${site.name}</span>
            ${isDeficit ? '<span class="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>' : ''}
          </div>
        `,
        iconSize: [160, 30],
        iconAnchor: [80, 15]
      });

      const marker = L.marker([site.lat, site.lng], { icon: siteIcon })
        .bindPopup(`
          <div class="p-4 bg-white text-slate-900 rounded-2xl text-xs font-sans min-w-[250px] shadow-lg">
            <div class="font-black text-slate-900 text-sm flex items-center justify-between">
              <span>${site.id} - ${site.name}</span>
            </div>
            <div class="text-slate-500 text-xs mt-0.5">${site.location}</div>
            
            <div class="mt-3 space-y-1 bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs">
              <div class="text-slate-700"><span class="text-slate-400 font-semibold">Project:</span> ${site.currentProject}</div>
              <div class="text-slate-700"><span class="text-slate-400 font-semibold">Phase:</span> ${site.projectPhase}</div>
              <div class="text-slate-700"><span class="text-slate-400 font-semibold">Geofence:</span> ${site.radiusMeters}m radius</div>
            </div>

            ${isDeficit ? `
              <div class="mt-2.5 p-2 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 font-bold text-xs">
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

      let colorClass = "bg-emerald-500 border-white";
      let pulseRing = "";

      if (asset.status === "Unassigned" || !asset.siteId) {
        colorClass = "bg-rose-600 border-white";
        pulseRing = '<span class="absolute -inset-1 rounded-full bg-rose-400/60 animate-ping"></span>';
      } else if (asset.status === "Idle" || asset.idleHoursDay > asset.engineHoursDay) {
        colorClass = "bg-amber-500 border-white";
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

      const photoUrl = asset.imageUrl || CAT_IMAGE_MAP[asset.type] || "https://desimachines.com/wp-content/uploads/2024/12/desi-machines-cat-excavator-345-gc-featured.jpg";

      const icon = L.divIcon({
        className: "cat-asset-pin relative",
        html: `
          <div class="relative flex items-center justify-center w-8 h-8 ${colorClass} border-2 rounded-full text-white text-xs font-black shadow-md cursor-pointer transform hover:scale-125 transition-transform" title="${asset.id} - ${asset.model}">
            ${pulseRing}
            <span>${typeIcon}</span>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      const marker = L.marker([asset.lat, asset.lng], { icon: icon })
        .bindPopup(`
          <div class="p-4 bg-white text-slate-900 rounded-2xl text-xs font-sans min-w-[250px] space-y-2.5 shadow-xl">
            
            <!-- Picture Header in Popup -->
            <div class="h-24 rounded-xl overflow-hidden relative border border-slate-200 shadow-sm"
                 style="background: linear-gradient(to bottom, rgba(15, 23, 42, 0.1), rgba(15, 23, 42, 0.85)), url('${photoUrl}'); background-size: cover; background-position: center;">
              <div class="absolute bottom-2 left-2.5 right-2.5 flex items-end justify-between">
                <div>
                  <span class="font-extrabold text-amber-400 text-xs font-mono">${asset.id}</span>
                  <div class="text-slate-200 text-[10px] font-semibold">${asset.model}</div>
                </div>
                <span class="px-2 py-0.5 rounded-full text-[9px] font-bold ${
                  asset.status === 'Unassigned' ? 'bg-rose-500 text-white' :
                  asset.status === 'Active' ? 'bg-emerald-500 text-white' :
                  'bg-amber-400 text-slate-950'
                }">${asset.status}</span>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs">
              <div><span class="text-slate-400">Site:</span> <span class="font-bold ${asset.siteId ? 'text-slate-800' : 'text-rose-600'}">${asset.siteId || 'UNASSIGNED'}</span></div>
              <div><span class="text-slate-400">Driver:</span> <span class="font-bold ${asset.operatorId ? 'text-slate-800' : 'text-rose-600'}">${asset.operatorId || 'NONE'}</span></div>
              <div><span class="text-slate-400">Work:</span> <span class="font-bold text-emerald-700">${asset.engineHoursDay}h/d</span></div>
              <div><span class="text-slate-400">Idle:</span> <span class="font-bold ${asset.idleHoursDay > 5 ? 'text-amber-700' : 'text-slate-800'}">${asset.idleHoursDay}h/d</span></div>
            </div>

            <div class="flex items-center gap-2 pt-1">
              ${(!asset.siteId || asset.status === 'Unassigned') ? `
                <button onclick="window.triggerReassignModal('${asset.id}')" class="cat-btn-primary flex-1 py-1.5 px-2 text-slate-950 font-black rounded-lg text-center text-xs shadow">
                  ⚡ Reassign
                </button>
              ` : `
                <button onclick="window.triggerCheckinModal('${asset.id}')" class="flex-1 py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-lg text-center text-xs border border-slate-300">
                  Check-In
                </button>
              `}
              <button onclick="window.openAssetTelemetryModal('${asset.id}')" class="py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-center text-xs border border-slate-300 font-medium">
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
