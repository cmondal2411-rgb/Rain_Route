/**
 * RAIN ROUTE - Rain-Aware Route Planning Prototype
 * Class 11 Science Exhibition Project
 * Vanilla JavaScript (No backend, No external paid APIs)
 */

(function () {
  "use strict";

  // Storage Keys
  const STORAGE_REPORTS_KEY = "rain_route_user_reports";
  const STORAGE_RAIN_MODE_KEY = "rain_route_mode_state";

  // Built-in Exhibition Demo Routes
  const SAMPLE_ROUTES = [
    {
      id: "route-a",
      name: "Route A (Lowland Underpass Road)",
      type: "Shortest Direct Route",
      distanceKm: 2.4,
      normalTimeMin: 8,
      waterDepthCm: 12,
      durationMin: 180,
      passability: "Difficult",
      riskLevel: "High",
      riskScore: 82,
      pathD: "M 80 340 C 140 320, 210 320, 260 260 C 310 200, 390 220, 520 140",
      color: "#ef4444",
      highlightColor: "#2563eb",
      hazardX: 280,
      hazardY: 240,
      hazardRadius: 28,
      hazardTitle: "Underpass Subway Flood Dip",
      reasonRainOff: "Selected because it offers the shortest travel distance (2.4 km) and quickest baseline travel time.",
      reasonRainOn: "NOT RECOMMENDED: 12 cm water depth and 180 min drainage duration create severe vehicular stalling risk and safety hazards."
    },
    {
      id: "route-b",
      name: "Route B (Ridge Parkway & Flyover)",
      type: "Elevated Bypass Route",
      distanceKm: 3.0,
      normalTimeMin: 10,
      waterDepthCm: 2,
      durationMin: 20,
      passability: "Easy",
      riskLevel: "Low",
      riskScore: 18,
      pathD: "M 80 340 C 90 200, 160 100, 280 80 C 400 60, 470 90, 520 140",
      color: "#10b981",
      highlightColor: "#2563eb",
      hazardX: 240,
      hazardY: 90,
      hazardRadius: 14,
      hazardTitle: "Ridge Drainage Gutter (Minor)",
      reasonRainOff: "Longer than Route A by 600m; discarded by standard distance-first routing algorithm.",
      reasonRainOn: "RECOMMENDED: Route B is slightly longer (+600m) but has significantly lower rain-related risk (only 2 cm surface pooling)."
    },
    {
      id: "route-c",
      name: "Route C (Riverbank Causeway Link)",
      type: "Secondary Arterial Route",
      distanceKm: 2.7,
      normalTimeMin: 9,
      waterDepthCm: 5,
      durationMin: 60,
      passability: "Easy",
      riskLevel: "Moderate",
      riskScore: 46,
      pathD: "M 80 340 C 180 370, 320 380, 420 300 C 470 240, 490 190, 520 140",
      color: "#f59e0b",
      highlightColor: "#2563eb",
      hazardX: 370,
      hazardY: 340,
      hazardRadius: 20,
      hazardTitle: "Culvert Approach Water Accumulation",
      reasonRainOff: "Secondary option with moderate distance (2.7 km) and average speed.",
      reasonRainOn: "Viable backup route with moderate waterlogging (5 cm), but higher risk than elevated Route B."
    }
  ];

  // Pre-seeded Historical Rain Memory Data for Science Exhibition Demo
  const SEED_MEMORY_REPORTS = [
    {
      id: "seed-1",
      road: "Station Underpass Road",
      rainIntensity: "Heavy",
      waterlogging: "High",
      waterDepth: 14,
      duration: 180,
      passability: "Difficult",
      description: "Chronic depression zone beneath railway tracks; water pumps frequently overwhelmed during cloudbursts.",
      date: "2026-09-24 14:30"
    },
    {
      id: "seed-2",
      road: "Station Underpass Road",
      rainIntensity: "Heavy",
      waterlogging: "High",
      waterDepth: 13,
      duration: 170,
      passability: "Not passable",
      description: "Auto-rickshaws stranded due to engine water intake.",
      date: "2026-09-23 18:15"
    },
    {
      id: "seed-3",
      road: "Station Underpass Road",
      rainIntensity: "Moderate",
      waterlogging: "Medium",
      waterDepth: 10,
      duration: 120,
      passability: "Difficult",
      description: "Slow moving traffic, water level up to pavement edge.",
      date: "2026-09-22 11:00"
    },
    {
      id: "seed-4",
      road: "Sector 4 Ridge Parkway",
      rainIntensity: "Heavy",
      waterlogging: "Low",
      waterDepth: 2,
      duration: 25,
      passability: "Easy",
      description: "Excellent slope and stormwater drainage channels; minimal puddles.",
      date: "2026-09-24 15:40"
    },
    {
      id: "seed-5",
      road: "Sector 4 Ridge Parkway",
      rainIntensity: "Moderate",
      waterlogging: "None",
      waterDepth: 1,
      duration: 15,
      passability: "Easy",
      description: "High elevation road remains completely dry and clear.",
      date: "2026-09-21 09:20"
    },
    {
      id: "seed-6",
      road: "Riverbank Causeway Link",
      rainIntensity: "Moderate",
      waterlogging: "Medium",
      waterDepth: 6,
      duration: 65,
      passability: "Easy",
      description: "Culvert runoff drains slowly toward the canal.",
      date: "2026-09-23 16:50"
    },
    {
      id: "seed-7",
      road: "Riverbank Causeway Link",
      rainIntensity: "Heavy",
      waterlogging: "Medium",
      waterDepth: 7,
      duration: 75,
      passability: "Difficult",
      description: "Slippery silt build-up along the outer curb.",
      date: "2026-09-22 17:10"
    },
    {
      id: "seed-8",
      road: "Central Market Lowlands",
      rainIntensity: "Heavy",
      waterlogging: "High",
      waterDepth: 11,
      duration: 140,
      passability: "Difficult",
      description: "Storm drains clogged with organic market debris; pooling persists for 2+ hours.",
      date: "2026-09-24 16:00"
    }
  ];

  // Application State
  const state = {
    rainMode: false,
    selectedRouteId: "route-a",
    allRoutes: JSON.parse(JSON.stringify(SAMPLE_ROUTES)),
    reports: [],
    weatherAnimation: true,
    demoStep: 0,
    currentTab: "home"
  };

  // DOM Elements
  let dom = {};

  /**
   * Initialize Application
   */
  function init() {
    cacheDom();
    loadReports();
    initRainAnimation();
    bindEvents();
    recalculateAllRoutes();
    renderAllViews();

    const initialHash = window.location.hash.replace("#", "");
    if (initialHash && ["home", "map", "report", "memory", "how"].includes(initialHash)) {
      switchView(initialHash, false);
    }
  }

  /**
   * Cache DOM nodes
   */
  function cacheDom() {
    dom = {
      // Header & Navigation
      navTabs: document.querySelectorAll(".nav-tab-btn"),
      views: document.querySelectorAll(".view-section"),
      rainToggleSwitch: document.getElementById("rain-mode-switch"),
      rainToggleCard: document.getElementById("rain-mode-card"),
      rainModePill: document.getElementById("rain-mode-header-pill"),
      rainModeStatusText: document.getElementById("rain-mode-status-text"),
      safetyBanner: document.getElementById("safety-banner"),
      dismissBannerBtn: document.getElementById("dismiss-banner-btn"),

      // Home & Planner
      fromInput: document.getElementById("from-location-input"),
      toInput: document.getElementById("to-location-input"),
      presetChips: document.querySelectorAll(".preset-chip"),
      swapLocationsBtn: document.getElementById("btn-swap-locations"),
      findRouteBtn: document.getElementById("btn-find-route"),
      runDemoBtn: document.getElementById("btn-run-demo"),
      heroRunDemoBtn: document.getElementById("btn-hero-demo"),

      // Stats
      statTotalReports: document.getElementById("stat-total-reports"),
      statAffectedRoads: document.getElementById("stat-affected-roads"),
      statHighRiskRoads: document.getElementById("stat-high-risk-roads"),
      statAvgDuration: document.getElementById("stat-avg-duration"),

      // Map Elements
      mapSvg: document.getElementById("interactive-rain-map"),
      mapSvgFull: document.getElementById("interactive-rain-map-full"),
      btnToggleWeather: document.getElementById("btn-toggle-weather"),
      btnResetMapView: document.getElementById("btn-reset-map-view"),
      btnSimulateStorm: document.getElementById("btn-simulate-storm"),

      // Route Comparison
      routesCardsContainer: document.getElementById("routes-cards-container"),
      routeModeBannerText: document.getElementById("route-mode-banner-text"),

      // Report Road Form
      reportForm: document.getElementById("report-road-form"),
      reportRoadSelect: document.getElementById("report-road-name"),
      reportDepthInput: document.getElementById("report-water-depth"),
      reportDurationInput: document.getElementById("report-duration"),
      reportDescInput: document.getElementById("report-description"),
      btnSeedDemoData: document.getElementById("btn-seed-demo-data"),
      btnClearUserData: document.getElementById("btn-clear-user-data"),

      // Rain Memory
      memoryGrid: document.getElementById("memory-cards-grid"),
      memoryFilterSelect: document.getElementById("memory-risk-filter"),
      btnExportMemory: document.getElementById("btn-export-memory"),

      // How It Works Sandbox
      sandboxDepth: document.getElementById("sandbox-depth"),
      sandboxDuration: document.getElementById("sandbox-duration"),
      sandboxDepthVal: document.getElementById("sandbox-depth-val"),
      sandboxDurationVal: document.getElementById("sandbox-duration-val"),
      sandboxScoreVal: document.getElementById("sandbox-score-val"),
      sandboxPenaltyVal: document.getElementById("sandbox-penalty-val"),
      sandboxDecisionVal: document.getElementById("sandbox-decision-val"),

      // Modal & Toast
      demoModal: document.getElementById("demo-walkthrough-modal"),
      demoModalClose: document.getElementById("demo-modal-close"),
      demoModalStepBadge: document.getElementById("demo-step-badge"),
      demoModalTitle: document.getElementById("demo-modal-title"),
      demoModalBody: document.getElementById("demo-modal-body"),
      demoModalNextBtn: document.getElementById("demo-modal-next-btn"),
      demoModalPrevBtn: document.getElementById("demo-modal-prev-btn"),
      toast: document.getElementById("toast-notification"),
      toastMsg: document.getElementById("toast-msg")
    };
  }

  /**
   * Load Reports from LocalStorage
   */
  function loadReports() {
    try {
      const stored = localStorage.getItem(STORAGE_REPORTS_KEY);
      if (stored) {
        state.reports = JSON.parse(stored);
      } else {
        // First run: Seed realistic exhibition demo data
        state.reports = JSON.parse(JSON.stringify(SEED_MEMORY_REPORTS));
        localStorage.setItem(STORAGE_REPORTS_KEY, JSON.stringify(state.reports));
      }
    } catch (e) {
      console.warn("Could not read from localStorage, using in-memory dataset:", e);
      state.reports = JSON.parse(JSON.stringify(SEED_MEMORY_REPORTS));
    }
  }

  /**
   * Save Reports to LocalStorage
   */
  function saveReports() {
    try {
      localStorage.setItem(STORAGE_REPORTS_KEY, JSON.stringify(state.reports));
    } catch (e) {
      console.warn("Could not write to localStorage:", e);
    }
  }

  /**
   * Bind DOM Events
   */
  function bindEvents() {
    // Navigation Tabs
    dom.navTabs.forEach(tab => {
      tab.addEventListener("click", () => {
        const viewId = tab.getAttribute("data-view");
        switchView(viewId);
      });
    });

    // Rain Mode Switch
    if (dom.rainToggleSwitch) {
      dom.rainToggleSwitch.addEventListener("change", (e) => {
        setRainMode(e.target.checked);
      });
    }

    // Header Quick Toggle Pill
    if (dom.rainModePill) {
      dom.rainModePill.addEventListener("click", () => {
        setRainMode(!state.rainMode);
      });
    }

    // Safety Banner Dismiss
    if (dom.dismissBannerBtn && dom.safetyBanner) {
      dom.dismissBannerBtn.addEventListener("click", () => {
        dom.safetyBanner.style.display = "none";
      });
    }

    // Preset Chip Clicking
dom.presetChips.forEach((chip, index) => {
  chip.addEventListener("click", () => {
    const from = chip.getAttribute("data-from");
    const to = chip.getAttribute("data-to");

    if (from && to) {
      dom.fromInput.value = from;
      dom.toInput.value = to;

      dom.fromInput.dispatchEvent(new Event("input", { bubbles: true }));
      dom.toInput.dispatchEvent(new Event("input", { bubbles: true }));

      // Connect each preset to a different exhibition route
      const presetRouteIds = [
        state.rainMode ? "route-b" : "route-a",
        "route-b",
        "route-c"
      ];

      state.selectedRouteId =
        presetRouteIds[index] || state.allRoutes[0].id;

      renderRouteComparison();
      renderMap();

      showToast(`Set route: ${from} → ${to}`);
    }
  });
});


   // Swap Locations Button
if (dom.swapLocationsBtn) {
  dom.swapLocationsBtn.addEventListener("click", () => {
    const tmp = dom.fromInput.value;
    dom.fromInput.value = dom.toInput.value;
    dom.toInput.value = tmp;

    // Update the route and map labels
    dom.fromInput.dispatchEvent(new Event("input", { bubbles: true }));
    dom.toInput.dispatchEvent(new Event("input", { bubbles: true }));

    renderRouteComparison();
    renderMap();

    showToast(`Swapped: ${dom.fromInput.value} → ${dom.toInput.value}`);
  });
}

    // Find Route Button
    if (dom.findRouteBtn) {
      dom.findRouteBtn.addEventListener("click", () => {
        recalculateAllRoutes();
        renderRouteComparison();
        renderMap();
        showToast(
          state.rainMode
            ? "Route recalculated with Rain Risk penalties applied!"
            : "Standard route found (shortest distance prioritized)."
        );
        // Smooth scroll to route comparison section
        const compSection = document.getElementById("route-comparison-anchor");
        if (compSection) {
          compSection.scrollIntoView({ behavior: "smooth" });
        }
      });
    }

    // Exhibition Demo Buttons
    if (dom.runDemoBtn) {
      dom.runDemoBtn.addEventListener("click", startExhibitionDemo);
    }
    if (dom.heroRunDemoBtn) {
      dom.heroRunDemoBtn.addEventListener("click", startExhibitionDemo);
    }

    // Demo Modal Controls
    if (dom.demoModalClose) {
      dom.demoModalClose.addEventListener("click", closeDemoModal);
    }
    if (dom.demoModal) {
      dom.demoModal.addEventListener("click", (e) => {
        if (e.target === dom.demoModal) closeDemoModal();
      });
    }
    if (dom.demoModalNextBtn) {
      dom.demoModalNextBtn.addEventListener("click", nextDemoStep);
    }
    if (dom.demoModalPrevBtn) {
      dom.demoModalPrevBtn.addEventListener("click", prevDemoStep);
    }

    // Hash navigation listener
    window.addEventListener("hashchange", () => {
      const hash = window.location.hash.replace("#", "");
      if (hash && ["home", "map", "report", "memory", "how"].includes(hash)) {
        switchView(hash, false);
      }
    });

    // Map Controls
    if (dom.btnToggleWeather) {
      dom.btnToggleWeather.addEventListener("click", () => {
        state.weatherAnimation = !state.weatherAnimation;
        const canvas = document.getElementById("rain-canvas");
        if (canvas) canvas.style.opacity = state.weatherAnimation ? "0.22" : "0";
        dom.btnToggleWeather.innerText = state.weatherAnimation ? "🌧 Rain FX: ON" : "🌧 Rain FX: OFF";
      });
    }

    if (dom.btnSimulateStorm) {
      dom.btnSimulateStorm.addEventListener("click", () => {
        setRainMode(true);
        showToast("Simulated severe rainfall event! Rain Route adjusted to elevated Ridge path.");
      });
    }

    if (dom.btnResetMapView) {
      dom.btnResetMapView.addEventListener("click", () => {
        state.selectedRouteId = state.rainMode ? "route-b" : "route-a";
        renderMap();
        renderRouteComparison();
      });
    }

    // Report Road Form Submission
    if (dom.reportForm) {
      dom.reportForm.addEventListener("submit", handleReportSubmit);
    }

    // Seed Demo Data Button
    if (dom.btnSeedDemoData) {
      dom.btnSeedDemoData.addEventListener("click", () => {
        state.reports = JSON.parse(JSON.stringify(SEED_MEMORY_REPORTS));
        saveReports();
        renderAllViews();
        showToast("Restored Class 11 science exhibition sample dataset!");
      });
    }

    // Clear User Data Button
    if (dom.btnClearUserData) {
      dom.btnClearUserData.addEventListener("click", () => {
        if (confirm("Reset all road reports and memory back to clean state?")) {
          state.reports = [];
          saveReports();
          renderAllViews();
          showToast("All road condition reports cleared.");
        }
      });
    }

    // Memory Filter Change
    if (dom.memoryFilterSelect) {
      dom.memoryFilterSelect.addEventListener("change", renderRainMemory);
    }

    // Export Memory Button
    if (dom.btnExportMemory) {
      dom.btnExportMemory.addEventListener("click", exportMemoryData);
    }

    // How It Works Sandbox Sliders
    if (dom.sandboxDepth && dom.sandboxDuration) {
      const updateSandbox = () => {
        const depth = parseInt(dom.sandboxDepth.value, 10);
        const duration = parseInt(dom.sandboxDuration.value, 10);
        dom.sandboxDepthVal.innerText = depth + " cm";
        dom.sandboxDurationVal.innerText = duration + " min";

        // Calculate prototype risk
        const depthFactor = Math.min(40, (depth / 15) * 40);
        const durationFactor = Math.min(30, (duration / 180) * 30);
        const passFactor = depth > 10 ? 25 : depth > 4 ? 15 : 5;
        const score = Math.round(Math.min(100, depthFactor + durationFactor + passFactor));
        const penalty = ((score / 100) * 8.0).toFixed(2);

        dom.sandboxScoreVal.innerText = score + " / 100";
        dom.sandboxPenaltyVal.innerText = "+" + penalty + " cost pts";

        if (score > 65) {
          dom.sandboxDecisionVal.innerHTML = '<span style="color:#ef4444;font-weight:bold;">AVOID ROAD (Severe Inundation)</span>';
        } else if (score > 35) {
          dom.sandboxDecisionVal.innerHTML = '<span style="color:#f59e0b;font-weight:bold;">CAUTION (Moderate Risk)</span>';
        } else {
          dom.sandboxDecisionVal.innerHTML = '<span style="color:#10b981;font-weight:bold;">RECOMMENDED (Passable)</span>';
        }
      };

      dom.sandboxDepth.addEventListener("input", updateSandbox);
      dom.sandboxDuration.addEventListener("input", updateSandbox);
      updateSandbox();
    }
  }

  /**
   * Switch Active Application View
   */
  function switchView(viewId, updateHash = true) {
    state.currentTab = viewId;
    if (updateHash) {
      window.location.hash = viewId;
    }
    dom.navTabs.forEach(tab => {
      const isTarget = tab.getAttribute("data-view") === viewId;
      tab.classList.toggle("active", isTarget);
    });

    dom.views.forEach(view => {
      const isTarget = view.id === `view-${viewId}`;
      view.classList.toggle("active-view", isTarget);
    });

    window.scrollTo({ top: 0, behavior: "smooth" });

    // Refresh view components if needed
    if (viewId === "map") {
      renderMap();
    } else if (viewId === "memory") {
      renderRainMemory();
    } else if (viewId === "home") {
      renderMap();
      renderRouteComparison();
    }
  }

  /**
   * Toggle Rain Mode State
   */
  function setRainMode(enabled) {
    state.rainMode = enabled;

    if (dom.rainToggleSwitch) dom.rainToggleSwitch.checked = enabled;
    if (dom.rainToggleCard) dom.rainToggleCard.classList.toggle("mode-on", enabled);
    if (dom.rainModePill) {
      dom.rainModePill.classList.toggle("active", enabled);
      dom.rainModePill.innerHTML = enabled
        ? '🌧 Rain Mode: <span style="color:#2563eb;font-weight:bold;margin-left:4px;">ON</span>'
        : '🌧 Rain Mode: <span style="color:#64748b;margin-left:4px;">OFF</span>';
    }

    if (dom.rainModeStatusText) {
      dom.rainModeStatusText.innerText = enabled
        ? "Rain Mode is ON: Considering waterlogging depth, duration, and passability hazards."
        : "Rain Mode is OFF: Showing fastest baseline routes without rainfall penalties.";
    }

    recalculateAllRoutes();
    renderRouteComparison();
    renderMap();
  }

  /**
   * Calculate Rain Risk & Costs for each route
   * Formula transparently explained in exhibition prototype.
   */
  function recalculateAllRoutes() {
    state.allRoutes.forEach(r => {
      // 1. Normal Cost = Distance (km) + (Time (min) * 0.25)
      r.normalCost = Number((r.distanceKm + r.normalTimeMin * 0.25).toFixed(2));

      // 2. Risk Score Calculation (0 - 100)
      const depthFactor = Math.min(40, (r.waterDepthCm / 15) * 40);
      const durationFactor = Math.min(30, (r.durationMin / 180) * 30);
      let passabilityFactor = 5;
      if (r.passability === "Difficult") passabilityFactor = 18;
      if (r.passability === "Not passable") passabilityFactor = 28;

      const calculatedScore = Math.round(Math.min(100, depthFactor + durationFactor + passabilityFactor + 2));
      r.riskScore = calculatedScore;

      // 3. Rain Penalty & Rain Adjusted Cost
      r.rainPenalty = Number(((r.riskScore / 100) * 8.0).toFixed(2));
      r.rainAdjustedCost = Number((r.normalCost + r.rainPenalty).toFixed(2));
    });

    // Select winning route based on Rain Mode
    if (!state.rainMode) {
      // Smallest Normal Cost is Route A
      state.allRoutes.sort((a, b) => a.normalCost - b.normalCost);
      state.selectedRouteId = state.allRoutes[0].id; // Route A
    } else {
      // Smallest Rain-Adjusted Cost is Route B
      state.allRoutes.sort((a, b) => a.rainAdjustedCost - b.rainAdjustedCost);
      state.selectedRouteId = state.allRoutes[0].id; // Route B
    }
  }

  /**
   * Render Route Comparison Cards
   */
  function renderRouteComparison() {
    if (!dom.routesCardsContainer) return;

    if (dom.routeModeBannerText) {
      if (state.rainMode) {
        dom.routeModeBannerText.innerHTML = `
          <span>🌧 <strong>Rain Mode ACTIVE:</strong> Route B is slightly longer (+600m) but has significantly lower rain-related risk.</span>
          <span class="badge-exhibition" style="background:#dcfce7;color:#166534;">Safety Optimal</span>
        `;
      } else {
        dom.routeModeBannerText.innerHTML = `
          <span>☀️ <strong>Rain Mode INACTIVE:</strong> Standard shortest-distance navigation selects Route A (2.4 km).</span>
          <span class="badge-exhibition" style="background:#e0f2fe;color:#0369a1;">Standard Shortest</span>
        `;
      }
    }

    dom.routesCardsContainer.innerHTML = "";

    // Always sort by ID: Route A, Route B, Route C for clean comparison layout
    const displayRoutes = [...SAMPLE_ROUTES].map(r => {
      return state.allRoutes.find(item => item.id === r.id) || r;
    });

    displayRoutes.forEach(route => {
      const isSelected = route.id === state.selectedRouteId;
      const isRainWinner = state.rainMode && route.id === "route-b";
      const isRainWarning = state.rainMode && route.id === "route-a";

      let cardClasses = "route-card";
      if (isSelected) cardClasses += " selected-route";
      if (isRainWinner) cardClasses += " rain-winner";
      if (isRainWarning) cardClasses += " rain-warning";

      let riskTagClass = "low";
      if (route.riskScore > 65) riskTagClass = "high";
      else if (route.riskScore > 35) riskTagClass = "med";

      // Depth bar percentage
      const depthPct = Math.min(100, Math.round((route.waterDepthCm / 15) * 100));

      const card = document.createElement("div");
      card.className = cardClasses;
      card.setAttribute("data-route-id", route.id);

      card.innerHTML = `
        <div class="route-card-header">
          <div class="route-badge-code">${route.id === "route-a" ? "A" : route.id === "route-b" ? "B" : "C"}</div>
          <div class="route-risk-tag ${riskTagClass}">
            ${route.riskLevel} Risk (${route.riskScore}/100)
          </div>
        </div>

        <h3 class="route-name">${route.name}</h3>
        <div class="route-type-label">${route.type}</div>

        <div class="route-metric-grid">
          <div class="route-metric-item">
            <div class="metric-label">Distance</div>
            <div class="metric-val">${route.distanceKm} km</div>
          </div>
          <div class="route-metric-item">
            <div class="metric-label">Normal Time</div>
            <div class="metric-val">${route.normalTimeMin} min</div>
          </div>
          <div class="route-metric-item">
            <div class="metric-label">Water Depth</div>
            <div class="metric-val" style="color:${route.waterDepthCm >= 10 ? '#ef4444' : route.waterDepthCm <= 3 ? '#10b981' : '#f59e0b'}">
              ${route.waterDepthCm} cm
            </div>
          </div>
          <div class="route-metric-item">
            <div class="metric-label">Drain Duration</div>
            <div class="metric-val">${route.durationMin} min</div>
          </div>
        </div>

        <div class="water-depth-bar-wrap">
          <div class="depth-bar-header">
            <span>Waterlogging Severity</span>
            <span>${route.waterDepthCm} cm (${route.passability})</span>
          </div>
          <div class="depth-track">
            <div class="depth-fill ${riskTagClass}" style="width: ${depthPct}%"></div>
          </div>
        </div>

        <div class="cost-calc-breakdown">
          <div class="cost-row">
            <span>Normal Cost (dist + time):</span>
            <span>${route.normalCost.toFixed(2)} pts</span>
          </div>
          <div class="cost-row" style="color: ${state.rainMode ? '#dc2626' : '#94a3b8'}">
            <span>Rain Risk Penalty:</span>
            <span>+${route.rainPenalty.toFixed(2)} pts</span>
          </div>
          <div class="cost-row total">
            <span>${state.rainMode ? "Rain-Adjusted Cost:" : "Normal Cost Score:"}</span>
            <span style="color: ${state.rainMode && route.id === 'route-b' ? '#059669' : state.rainMode && route.id === 'route-a' ? '#dc2626' : '#2563eb'}">
              ${state.rainMode ? route.rainAdjustedCost.toFixed(2) : route.normalCost.toFixed(2)}
            </span>
          </div>
        </div>

        <div class="route-reason-box ${isSelected ? (state.rainMode && route.id === 'route-b' ? 'positive' : 'neutral') : (isRainWarning ? 'warning' : 'neutral')}">
          ${state.rainMode ? route.reasonRainOn : route.reasonRainOff}
        </div>
      `;

      card.addEventListener("click", () => {
        state.selectedRouteId = route.id;
        renderRouteComparison();
        renderMap();
      });

      dom.routesCardsContainer.appendChild(card);
    });
  }

  /**
   * Render Interactive SVG Rain Map
   */
  function renderMap() {
    if (!dom.mapSvg) return;

    const svgWidth = 600;
    const svgHeight = 440;

    const selectedRoute = state.allRoutes.find(r => r.id === state.selectedRouteId) || state.allRoutes[0];

const startName = dom.fromInput?.value || "Greenwood";
const endName = dom.toInput?.value || "Central Metro";

    // Build SVG inner elements
    let svgContent = `
      <defs>
        <!-- Map Grid Pattern -->
        <pattern id="map-grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1e293b" stroke-width="0.8" />
        </pattern>

        <!-- Route Glow Filter -->
        <filter id="route-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
        <filter id="active-route-glow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="6" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>

        <!-- Water Ripple Animation Gradient -->
        <radialGradient id="water-gradient-a" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#ef4444" stop-opacity="0.85" />
          <stop offset="60%" stop-color="#ef4444" stop-opacity="0.35" />
          <stop offset="100%" stop-color="#ef4444" stop-opacity="0" />
        </radialGradient>
        <radialGradient id="water-gradient-b" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#10b981" stop-opacity="0.75" />
          <stop offset="100%" stop-color="#10b981" stop-opacity="0" />
        </radialGradient>
        <radialGradient id="water-gradient-c" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#f59e0b" stop-opacity="0.8" />
          <stop offset="100%" stop-color="#f59e0b" stop-opacity="0" />
        </radialGradient>
      </defs>

      <!-- Map Background & Grid -->
      <rect width="100%" height="100%" fill="#09101f" />
      <rect width="100%" height="100%" fill="url(#map-grid)" opacity="0.7" />

      <!-- City Geographic Features & Water canal -->
      <path d="M 0 280 C 120 270, 260 300, 340 370 C 400 420, 480 430, 600 410" fill="none" stroke="#0e3a63" stroke-width="26" stroke-linecap="round" opacity="0.6" />
      <text x="360" y="385" fill="#38bdf8" font-size="10" font-weight="600" opacity="0.65" letter-spacing="1">MUNICIPAL DRAINAGE CANAL</text>

      <!-- Contour Terrain Elevation Guides -->
      <path d="M 60 70 Q 280 40 540 60" fill="none" stroke="#1e3a5f" stroke-width="1.5" stroke-dasharray="4 6" />
      <text x="70" y="65" fill="#64748b" font-size="9" font-weight="bold">↑ ELEVATED RIDGE (+18m)</text>
      
      <path d="M 60 380 Q 280 400 540 360" fill="none" stroke="#1e3a5f" stroke-width="1.5" stroke-dasharray="4 6" />
      <text x="70" y="395" fill="#64748b" font-size="9" font-weight="bold">↓ LOWLAND BASIN (+2m)</text>

      <!-- Background Secondary Street Network -->
      <g stroke="#1e293b" stroke-width="4" stroke-linecap="round">
        <line x1="80" y1="40" x2="80" y2="400" />
        <line x1="280" y1="20" x2="280" y2="420" />
        <line x1="520" y1="40" x2="520" y2="400" />
        <line x1="40" y1="140" x2="560" y2="140" />
        <line x1="40" y1="240" x2="560" y2="240" />
        <line x1="40" y1="340" x2="560" y2="340" />
      </g>
    `;

    // Draw Waterlogged Hazard Zones
    SAMPLE_ROUTES.forEach(r => {
      const gradId = r.id === "route-a" ? "water-gradient-a" : r.id === "route-b" ? "water-gradient-b" : "water-gradient-c";
      const badgeColor = r.id === "route-a" ? "#ef4444" : r.id === "route-b" ? "#10b981" : "#f59e0b";

      svgContent += `
        <!-- Hazard Zone for ${r.name} -->
        <g class="hazard-group" style="cursor:pointer;" onclick="window.selectRouteFromMap('${r.id}')">
          <circle cx="${r.hazardX}" cy="${r.hazardY}" r="${r.hazardRadius + 14}" fill="url(#${gradId})">
            <animate attributeName="r" values="${r.hazardRadius + 6};${r.hazardRadius + 18};${r.hazardRadius + 6}" dur="3s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.8;0.3;0.8" dur="3s" repeatCount="indefinite" />
          </circle>
          <circle cx="${r.hazardX}" cy="${r.hazardY}" r="${r.hazardRadius}" fill="${badgeColor}" fill-opacity="0.25" stroke="${badgeColor}" stroke-width="1.8" stroke-dasharray="3 3" />
          <circle cx="${r.hazardX}" cy="${r.hazardY}" r="4" fill="${badgeColor}" />
          
          <!-- Hazard Tag Badge -->
          <rect x="${r.hazardX - 42}" y="${r.hazardY - 26}" width="84" height="18" rx="4" fill="#0f172a" stroke="${badgeColor}" stroke-width="1" />
          <text x="${r.hazardX}" y="${r.hazardY - 14}" fill="#ffffff" font-size="9" font-weight="700" text-anchor="middle">
            ${r.waterDepthCm}cm • ${r.durationMin}m
          </text>
        </g>
      `;
    });

    // Draw Non-Selected Routes First
    SAMPLE_ROUTES.forEach(r => {
      if (r.id !== state.selectedRouteId) {
        svgContent += `
          <g class="route-line-group" style="cursor:pointer;" onclick="window.selectRouteFromMap('${r.id}')">
            <!-- Outline -->
            <path d="${r.pathD}" fill="none" stroke="#334155" stroke-width="8" stroke-linecap="round" />
            <!-- Inner line -->
            <path d="${r.pathD}" fill="none" stroke="${r.color}" stroke-width="4" stroke-linecap="round" opacity="0.75" />
            <!-- Text label along path -->
            <text fill="#cbd5e1" font-size="10" font-weight="600">
              <textPath href="#path-${r.id}" startOffset="50%" text-anchor="middle">
                ${r.id.toUpperCase()}: ${r.distanceKm}km (${r.waterDepthCm}cm)
              </textPath>
            </text>
          </g>
          <path id="path-${r.id}" d="${r.pathD}" fill="none" stroke="transparent" />
        `;
      }
    });

    // Draw Currently Selected Route on Top with Dynamic Glow & Pulse
    const selColor = state.rainMode && selectedRoute.id === "route-b" ? "#06b6d4" : "#3b82f6";
    svgContent += `
      <g class="selected-route-line-group" filter="url(#active-route-glow)">
        <!-- Outer Glow -->
        <path d="${selectedRoute.pathD}" fill="none" stroke="${selColor}" stroke-width="14" stroke-linecap="round" opacity="0.35" />
        <!-- Dark Border -->
        <path d="${selectedRoute.pathD}" fill="none" stroke="#020617" stroke-width="9" stroke-linecap="round" />
        <!-- Solid High-Visibility Selected Line -->
        <path d="${selectedRoute.pathD}" fill="none" stroke="${selColor}" stroke-width="5" stroke-linecap="round" />
        <!-- Animated Dash Flow -->
        <path d="${selectedRoute.pathD}" fill="none" stroke="#ffffff" stroke-width="3" stroke-linecap="round" stroke-dasharray="10 16">
          <animate attributeName="stroke-dashoffset" values="100;0" dur="2s" repeatCount="indefinite" />
        </path>
      </g>
    `;

    // Start Location Marker (A)
    svgContent += `
      <g transform="translate(80, 340)">
        <circle cx="0" cy="0" r="16" fill="#10b981" fill-opacity="0.25">
          <animate attributeName="r" values="14;22;14" dur="2s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.7;0.2;0.7" dur="2s" repeatCount="indefinite" />
        </circle>
        <circle cx="0" cy="0" r="12" fill="#10b981" stroke="#ffffff" stroke-width="2.5" />
        <text x="0" y="4" fill="#ffffff" font-size="11" font-weight="900" text-anchor="middle">A</text>
        <!-- Marker Label -->
        <rect x="-60" y="-36" width="120" height="20" rx="4" fill="#0f172a" stroke="#10b981" stroke-width="1" />
        <text x="0" y="-22" fill="#a7f3d0" font-size="9.5" font-weight="bold" text-anchor="middle">START: ${startName}</text>
      </g>
    `;

    // Destination Location Marker (B)
    svgContent += `
      <g transform="translate(520, 140)">
        <circle cx="0" cy="0" r="16" fill="#ef4444" fill-opacity="0.25">
          <animate attributeName="r" values="14;22;14" dur="2s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.7;0.2;0.7" dur="2s" repeatCount="indefinite" />
        </circle>
        <circle cx="0" cy="0" r="12" fill="#ef4444" stroke="#ffffff" stroke-width="2.5" />
        <text x="0" y="4" fill="#ffffff" font-size="11" font-weight="900" text-anchor="middle">B</text>
        <!-- Marker Label -->
        <rect x="-65" y="-36" width="130" height="20" rx="4" fill="#0f172a" stroke="#ef4444" stroke-width="1" />
        <text x="0" y="-22" fill="#fecaca" font-size="9.5" font-weight="bold" text-anchor="middle">DEST: ${endName}</text>
      </g>
    `;

    // Active Selection Overlay Floating Pill on Map
    svgContent += `
      <g transform="translate(20, 20)">
        <rect width="260" height="34" rx="6" fill="#0f172a" fill-opacity="0.92" stroke="#334155" stroke-width="1" />
        <circle cx="16" cy="17" r="6" fill="${state.rainMode ? '#06b6d4' : '#3b82f6'}" />
        <text x="32" y="21" fill="#ffffff" font-size="11" font-weight="700">
          ${state.rainMode ? "RAIN-AWARE PICK: Route B (Safe Ridge)" : "SHORTEST PICK: Route A (2.4 km)"}
        </text>
      </g>
    `;

    dom.mapSvg.innerHTML = svgContent;
    if (dom.mapSvgFull) {
      dom.mapSvgFull.innerHTML = svgContent;
    }
  }

  // Global helper for map click events
  window.selectRouteFromMap = function (routeId) {
    state.selectedRouteId = routeId;
    renderRouteComparison();
    renderMap();
    const r = SAMPLE_ROUTES.find(item => item.id === routeId);
    if (r) {
      showToast(`Selected ${r.name} (${r.distanceKm} km, ${r.waterDepthCm} cm flood depth)`);
    }
  };

  /**
   * Handle Road Condition Report Submission
   */
  function handleReportSubmit(e) {
    e.preventDefault();

    const road = dom.reportRoadSelect.value.trim();
    const waterDepth = parseFloat(dom.reportDepthInput.value);
    const duration = parseInt(dom.reportDurationInput.value, 10);
    const desc = dom.reportDescInput.value.trim();

    // Checked radio values
    const rainIntensity = (document.querySelector('input[name="rainIntensity"]:checked') || {}).value || "Moderate";
    const waterlogging = (document.querySelector('input[name="waterlogging"]:checked') || {}).value || "Medium";
    const passability = (document.querySelector('input[name="passability"]:checked') || {}).value || "Difficult";

    // Form Validation
    if (!road) {
      alert("Please enter or select a road/location name.");
      return;
    }
    if (isNaN(waterDepth) || waterDepth < 0) {
      alert("Please enter a valid approximate water depth in cm.");
      return;
    }
    if (isNaN(duration) || duration < 0) {
      alert("Please enter a valid waterlogging duration in minutes.");
      return;
    }

    const newReport = {
      id: "rep-" + Date.now(),
      road: road,
      rainIntensity: rainIntensity,
      waterlogging: waterlogging,
      waterDepth: waterDepth,
      duration: duration,
      passability: passability,
      description: desc || "Citizen report submitted during rainfall event.",
      date: new Date().toISOString().replace("T", " ").substring(0, 16)
    };

    // Prepend new report to state
    state.reports.unshift(newReport);
    saveReports();

    // Reset Form
    dom.reportForm.reset();

    // Update App Components
    renderAllViews();

    showToast(`✓ Report saved for ${road}! Statistics and Rain Memory updated.`);

    // Switch to Rain Memory view to show immediate effect
    setTimeout(() => {
      switchView("memory");
    }, 400);
  }

  /**
   * Render Rain Memory Cards
   */
  function renderRainMemory() {
    if (!dom.memoryGrid) return;

    dom.memoryGrid.innerHTML = "";

    const filterVal = dom.memoryFilterSelect ? dom.memoryFilterSelect.value : "all";

    // Group reports by road name
    const grouped = {};
    state.reports.forEach(rep => {
      const roadName = rep.road;
      if (!grouped[roadName]) {
        grouped[roadName] = [];
      }
      grouped[roadName].push(rep);
    });

    const roadNames = Object.keys(grouped);

    if (roadNames.length === 0) {
      dom.memoryGrid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 3rem 1rem; color: #64748b;">
          <p style="font-size: 1.1rem; font-weight: 600;">No road condition reports recorded yet.</p>
          <p style="font-size: 0.85rem; margin-top: 0.5rem;">Use the "Report Road" form or click "Restore Exhibition Demo Data".</p>
        </div>
      `;
      return;
    }

    roadNames.forEach(roadName => {
      const reps = grouped[roadName];
      const count = reps.length;

      // Aggregations
      const totalDepth = reps.reduce((sum, r) => sum + (Number(r.waterDepth) || 0), 0);
      const avgDepth = (totalDepth / count).toFixed(1);

      const totalDuration = reps.reduce((sum, r) => sum + (Number(r.duration) || 0), 0);
      const avgDuration = Math.round(totalDuration / count);

      // Most common condition
      const conditionCounts = {};
      reps.forEach(r => {
        conditionCounts[r.waterlogging] = (conditionCounts[r.waterlogging] || 0) + 1;
      });
      let mostCommonCondition = "Low";
      let maxC = 0;
      for (const [cond, c] of Object.entries(conditionCounts)) {
        if (c > maxC) {
          maxC = c;
          mostCommonCondition = cond;
        }
      }

      // Most recent report date
      const latestDate = reps[0]?.date || "Recent";

      // Classify Risk Category
      let riskTagClass = "safe";
      let riskTitle = "Low Recurrent Risk";
      if (avgDepth >= 10 || avgDuration >= 120 || mostCommonCondition === "High") {
        riskTagClass = "danger";
        riskTitle = "Frequently Waterlogged (Chronic Flooding)";
      } else if (avgDepth >= 4 || avgDuration >= 45 || mostCommonCondition === "Medium") {
        riskTagClass = "caution";
        riskTitle = "Moderate Pooling Risk";
      }

      // Filter check
      if (filterVal === "high" && riskTagClass !== "danger") return;
      if (filterVal === "medium" && riskTagClass !== "caution") return;
      if (filterVal === "low" && riskTagClass !== "safe") return;

      const card = document.createElement("div");
      card.className = "memory-card";
      card.innerHTML = `
        <div class="memory-card-header">
          <h3 class="memory-card-title">${roadName}</h3>
          <span class="memory-report-count-badge">${count} report${count > 1 ? "s" : ""}</span>
        </div>

        <div class="memory-history-tag ${riskTagClass}">
          ${riskTagClass === "danger" ? "⚠️" : riskTagClass === "caution" ? "⚡" : "✓"} ${riskTitle}
        </div>

        <div class="memory-stats-table">
          <div class="memory-stat-row">
            <span class="lbl">Avg Water Depth:</span>
            <span class="val" style="color: ${avgDepth >= 10 ? '#ef4444' : avgDepth <= 3 ? '#10b981' : '#f59e0b'}">${avgDepth} cm</span>
          </div>
          <div class="memory-stat-row">
            <span class="lbl">Avg Waterlogging Duration:</span>
            <span class="val">${avgDuration >= 60 ? (avgDuration / 60).toFixed(1) + " hours" : avgDuration + " mins"}</span>
          </div>
          <div class="memory-stat-row">
            <span class="lbl">Most Common Condition:</span>
            <span class="val">${mostCommonCondition} Inundation</span>
          </div>
          <div class="memory-stat-row">
            <span class="lbl">Passability Status:</span>
            <span class="val">${reps[0].passability || "Difficult"}</span>
          </div>
        </div>

        <p style="font-size: 0.78rem; color: #475569; margin-bottom: 0.75rem; font-style: italic;">
          "${reps[0].description || 'Waterlogged section noted during rain.'}"
        </p>

        <div class="memory-footer">
          <span>Last logged: ${latestDate}</span>
          <button class="btn btn-secondary btn-sm" style="font-size: 0.7rem; padding: 0.2rem 0.5rem;" onclick="window.useRoadInPlanner('${roadName.replace(/'/g, "\\'")}')">
            Check in Map
          </button>
        </div>
      `;

      dom.memoryGrid.appendChild(card);
    });
  }

  // Quick helper to view road in home planner
  window.useRoadInPlanner = function (roadName) {
    if (dom.fromInput) dom.fromInput.value = roadName;
    switchView("home");
    showToast(`Focused on ${roadName} in Route Planner`);
  };

  /**
   * Update Dashboard Statistics
   */
  function updateDashboardStats() {
    const totalReports = state.reports.length;

    // Unique roads
    const uniqueRoads = new Set(state.reports.map(r => r.road));
    const totalRoadsCount = uniqueRoads.size;

    // High risk roads (depth >= 10 or waterlogging === 'High')
    const highRiskReports = state.reports.filter(r => (Number(r.waterDepth) >= 10 || r.waterlogging === "High"));
    const highRiskRoads = new Set(highRiskReports.map(r => r.road)).size;

    // Average duration
    const totalDuration = state.reports.reduce((acc, r) => acc + (Number(r.duration) || 0), 0);
    const avgDuration = totalReports > 0 ? Math.round(totalDuration / totalReports) : 0;

    if (dom.statTotalReports) dom.statTotalReports.innerText = totalReports;
    if (dom.statAffectedRoads) dom.statAffectedRoads.innerText = totalRoadsCount;
    if (dom.statHighRiskRoads) dom.statHighRiskRoads.innerText = highRiskRoads;
    if (dom.statAvgDuration) {
      dom.statAvgDuration.innerText = avgDuration >= 60 ? (avgDuration / 60).toFixed(1) + " hrs" : avgDuration + " min";
    }
  }

  /**
   * Render All Application Views
   */
  function renderAllViews() {
    updateDashboardStats();
    recalculateAllRoutes();
    renderRouteComparison();
    renderMap();
    renderRainMemory();
  }

  /**
   * Exhibition Demonstration Tour Walkthrough
   */
  const DEMO_STEPS = [
    {
      step: 1,
      title: "Step 1: Normal Dry-Weather Navigation (Rain Mode OFF)",
      content: `
        <p>In standard navigation systems (such as everyday GPS), route planning primarily minimizes physical distance and free-flow travel time.</p>
        <div style="background:#f8fafc;border:1px solid #e2e8f0;padding:0.75rem;border-radius:8px;margin:0.75rem 0;">
          <strong>Selected Route: Route A (Lowland Underpass Road)</strong><br>
          • Distance: 2.4 km (Shortest)<br>
          • Baseline Time: 8 minutes<br>
          • Cost Score: <strong>4.40 points (Lowest)</strong>
        </div>
        <p>At this stage, Route A is selected because neither water depth nor drainage failure is considered.</p>
      `,
      action: () => {
        setRainMode(false);
        state.selectedRouteId = "route-a";
        renderMap();
        renderRouteComparison();
      }
    },
    {
      step: 2,
      title: "Step 2: Rainfall Begins & Risk Mode Activates",
      content: `
        <p>A heavy rain shower occurs over the city. Roads in topographical depressions experience acute runoff accumulation.</p>
        <div style="background:#eff6ff;border:1px solid #bfdbfe;padding:0.75rem;border-radius:8px;margin:0.75rem 0;color:#1e3a8a;">
          <strong>🌧 Activating RAIN ROUTE Risk Algorithm:</strong><br>
          The system evaluates <em>Water Depth</em> (12 cm), <em>Drainage Duration</em> (180 min), and <em>Vehicle Passability</em> (Difficult).
        </div>
        <p>Observe how turning on Rain Mode introduces scientific risk penalties into the cost equation.</p>
      `,
      action: () => {
        setRainMode(true);
        renderMap();
        renderRouteComparison();
      }
    },
    {
      step: 3,
      title: "Step 3: Why Route A Fails During Rain",
      content: `
        <div style="background:#fef2f2;border:1px solid #fecaca;padding:0.75rem;border-radius:8px;margin:0.75rem 0;color:#991b1b;">
          <strong>⚠️ Route A Waterlogging Penalty:</strong><br>
          • Water Depth: 12 cm (Exceeds car exhaust/engine intake threshold)<br>
          • Waterlogging Duration: 180 minutes (Drain pump blockage)<br>
          • Calculated Risk Score: <strong>82 / 100 (HIGH RISK)</strong><br>
          • Rain Penalty: <strong>+6.56 points</strong><br>
          • Total Rain Cost: <strong>10.96 points (Discarded!)</strong>
        </div>
        <p>A driver following normal GPS onto Route A risks engine hydro-lock, traffic gridlock, or water entrapment.</p>
      `,
      action: () => {
        setRainMode(true);
        state.selectedRouteId = "route-b";
        renderMap();
        renderRouteComparison();
      }
    },
    {
      step: 4,
      title: "Step 4: Rain Route Selects the Elevated Ridge Parkway",
      content: `
        <div style="background:#ecfdf5;border:1px solid #a7f3d0;padding:0.75rem;border-radius:8px;margin:0.75rem 0;color:#065f46;">
          <strong>✓ Recommended: Route B (Ridge Parkway & Flyover)</strong><br>
          • Distance: 3.0 km (+600m longer)<br>
          • Normal Time: 10 min (+2 min longer)<br>
          • Water Depth: Only 2 cm (Safe runoff slope)<br>
          • Waterlogging Duration: 20 minutes<br>
          • Risk Score: <strong>18 / 100 (LOW RISK)</strong><br>
          • Rain-Adjusted Cost: <strong>6.94 points (LOWEST OVERALL!)</strong>
        </div>
        <p>Even though Route B is 600 meters longer, its rain-adjusted cost is vastly superior to the flooded Route A.</p>
      `,
      action: () => {
        setRainMode(true);
        state.selectedRouteId = "route-b";
        renderMap();
        renderRouteComparison();
      }
    },
    {
      step: 5,
      title: "Step 5: Exhibition Scientific Conclusion",
      content: `
        <div style="background:#f0f9ff;border:1px solid #bae6fd;padding:1rem;border-radius:8px;text-align:center;margin:0.75rem 0;">
          <h4 style="color:#0369a1;font-size:1.15rem;margin-bottom:0.4rem;">“Shortest isn’t always the best during rain.”</h4>
          <p style="color:#334155;font-size:0.9rem;">
            This working prototype proves the scientific hypothesis: incorporating empirical waterlogging data dynamically redirects commuters away from flood choke points to safer, reliable elevated routes.
          </p>
        </div>
        <p style="font-size:0.82rem;color:#64748b;font-style:italic;">
          Note: This is an educational science exhibition prototype. The weights demonstrate algorithmic principles and are not certified flood safety scores.
        </p>
      `,
      action: () => {
        setRainMode(true);
        state.selectedRouteId = "route-b";
        renderMap();
        renderRouteComparison();
      }
    }
  ];

  function startExhibitionDemo() {
    state.demoStep = 0;
    openDemoModal();
    renderDemoStep();
  }

  function openDemoModal() {
    if (dom.demoModal) dom.demoModal.classList.add("show");
  }

  function closeDemoModal() {
    if (dom.demoModal) dom.demoModal.classList.remove("show");
  }

  function nextDemoStep() {
    if (state.demoStep < DEMO_STEPS.length - 1) {
      state.demoStep++;
      renderDemoStep();
    } else {
      closeDemoModal();
      showToast("Exhibition demo complete! Feel free to explore and test your own road reports.");
    }
  }

  function prevDemoStep() {
    if (state.demoStep > 0) {
      state.demoStep--;
      renderDemoStep();
    }
  }

  function renderDemoStep() {
    const curr = DEMO_STEPS[state.demoStep];
    if (!curr) return;

    if (dom.demoModalStepBadge) dom.demoModalStepBadge.innerText = `EXHIBITION DEMO • STEP ${curr.step} OF ${DEMO_STEPS.length}`;
    if (dom.demoModalTitle) dom.demoModalTitle.innerText = curr.title;
    if (dom.demoModalBody) dom.demoModalBody.innerHTML = curr.content;

    if (dom.demoModalPrevBtn) {
      dom.demoModalPrevBtn.style.visibility = state.demoStep === 0 ? "hidden" : "visible";
    }
    if (dom.demoModalNextBtn) {
      dom.demoModalNextBtn.innerText = state.demoStep === DEMO_STEPS.length - 1 ? "Finish Demonstration ✓" : "Next Step →";
    }

    if (typeof curr.action === "function") {
      curr.action();
    }
  }

  /**
   * Export Memory Data as JSON
   */
  function exportMemoryData() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state.reports, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "rain_route_reports.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast("Exported reports as JSON for exhibition judges!");
  }

  /**
   * Toast Notifications Helper
   */
  let toastTimer = null;
  function showToast(msg) {
    if (!dom.toast || !dom.toastMsg) return;
    dom.toastMsg.innerText = msg;
    dom.toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      dom.toast.classList.remove("show");
    }, 3600);
  }

  /**
   * Canvas Ambient Rain Layer
   */
  function initRainAnimation() {
    const canvas = document.getElementById("rain-canvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    window.addEventListener("resize", () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    });

    const drops = [];
    const maxDrops = 60;
    for (let i = 0; i < maxDrops; i++) {
      drops.push({
        x: Math.random() * width,
        y: Math.random() * height,
        length: Math.random() * 18 + 10,
        speed: Math.random() * 4 + 4,
        opacity: Math.random() * 0.4 + 0.2
      });
    }

    function animate() {
      if (state.weatherAnimation) {
        ctx.clearRect(0, 0, width, height);
        ctx.strokeStyle = "#38bdf8";
        ctx.lineWidth = 1.2;

        for (let i = 0; i < drops.length; i++) {
          const d = drops[i];
          ctx.beginPath();
          ctx.moveTo(d.x, d.y);
          ctx.lineTo(d.x - 2, d.y + d.length);
          ctx.stroke();

          d.y += d.speed;
          d.x -= 0.6;

          if (d.y > height) {
            d.y = -d.length;
            d.x = Math.random() * width;
          }
        }
      }
      requestAnimationFrame(animate);
    }

    animate();
  }

  // Auto-init on DOMContentLoaded or immediate
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
