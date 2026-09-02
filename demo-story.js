/**
 * CAT-PULSE 5-MINUTE DEMO NARRATIVE RUNNER
 * Implements Caterpillar's Official 5-Step Storyline (Slide 10):
 * SPOT -> EXPLAIN -> ACT -> PREDICT -> PROVE
 */

const CAT_DEMO = {
  currentStep: 0,
  isRunning: false,

  steps: [
    {
      step: 1,
      title: "01 • SPOT",
      subtitle: "Identify the Blind Spot",
      description: "The Asset Dashboard flags <strong>EQX1007</strong> in critical red: 12 days checked out, completely unassigned, and generating zero productive work.",
      actionLabel: "Next: Explain Signals →",
      execute: function() {
        if (window.switchTab) window.switchTab("fleet");
        setTimeout(() => {
          const row = document.getElementById("asset-row-EQX1007");
          if (row) {
            row.scrollIntoView({ behavior: "smooth", block: "center" });
            row.classList.add("ring-4", "ring-red-500", "bg-red-950/40");
          }
          if (window.CAT_MAP && window.CAT_MAP.flyToAsset) {
            window.CAT_MAP.flyToAsset("EQX1007");
          }
        }, 300);
      }
    },
    {
      step: 2,
      title: "02 • EXPLAIN",
      subtitle: "Convert Raw Data into Insight",
      description: "AI telemetry breakdown reveals the root cause: <strong>Site NULL, Operator NULL, 0.0h runtime, 12h/day idle</strong>. Total financial waste: <strong>$4,200</strong> in burning rental fees.",
      actionLabel: "Next: Take Action →",
      execute: function() {
        if (window.openAssetTelemetryModal) {
          window.openAssetTelemetryModal("EQX1007");
        }
      }
    },
    {
      step: 3,
      title: "03 • ACT",
      subtitle: "1-Click Digital Dispatch",
      description: "Operations immediately reassigns <strong>EQX1007</strong> to <strong>Site S003 (Aerospace Tech Hub)</strong> and attaches certified Master Operator <strong>OP108 (Arun Prakash)</strong>.",
      actionLabel: "Next: View Forecast →",
      execute: function() {
        if (window.closeAssetTelemetryModal) window.closeAssetTelemetryModal();
        if (window.executeDirectReassignment) {
          window.executeDirectReassignment("EQX1007", "S003", "OP108");
        }
      }
    },
    {
      step: 4,
      title: "04 • PREDICT",
      subtitle: "Explainable AI Demand Forecasting",
      description: "Why Site S003? The AI Time-Series Forecaster detected that S003's deep trenching phase has a <strong>+1 Excavator deficit</strong> next week. We pre-positioned without renting a new machine.",
      actionLabel: "Next: Prove ROI →",
      execute: function() {
        if (window.switchTab) window.switchTab("forecast");
        setTimeout(() => {
          const s3Card = document.getElementById("forecast-card-S003");
          if (s3Card) {
            s3Card.scrollIntoView({ behavior: "smooth", block: "center" });
            s3Card.classList.add("ring-4", "ring-amber-400");
          }
        }, 300);
      }
    },
    {
      step: 5,
      title: "05 • PROVE",
      subtitle: "Measurable Business Impact & ROI",
      description: "Measurable Outcome: <strong>$4,200 Cost Avoided</strong>, Ghost Rentals reduced to zero, and Fleet Utilization increased from <strong>48% to 76%</strong>!",
      actionLabel: "Finish & Reset Demo 🔄",
      execute: function() {
        if (window.switchTab) window.switchTab("fleet");
        if (window.triggerCelebration) window.triggerCelebration();
      }
    }
  ],

  startDemo: function() {
    this.isRunning = true;
    this.currentStep = 1;
    this.renderDemoBar();
    this.steps[0].execute();
  },

  nextStep: function() {
    if (this.currentStep < this.steps.length) {
      this.currentStep++;
      this.renderDemoBar();
      this.steps[this.currentStep - 1].execute();
    } else {
      this.resetDemo();
    }
  },

  prevStep: function() {
    if (this.currentStep > 1) {
      this.currentStep--;
      this.renderDemoBar();
      this.steps[this.currentStep - 1].execute();
    }
  },

  resetDemo: function() {
    this.currentStep = 0;
    this.isRunning = false;
    const bar = document.getElementById("demo-banner");
    if (bar) bar.classList.add("hidden");
    if (window.resetFleetData) window.resetFleetData();
  },

  renderDemoBar: function() {
    const bar = document.getElementById("demo-banner");
    if (!bar) return;

    bar.classList.remove("hidden");
    const stepData = this.steps[this.currentStep - 1];

    bar.innerHTML = `
      <div class="bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 text-black px-4 py-3 shadow-2xl border-b-2 border-black flex flex-col md:flex-row items-center justify-between gap-3 animate-slide-down">
        <!-- Step Progress Indicator -->
        <div class="flex items-center gap-3">
          <div class="flex items-center justify-center w-8 h-8 rounded-full bg-black text-amber-400 font-black text-sm shadow">
            ${stepData.step}
          </div>
          <div>
            <div class="flex items-center gap-2">
              <span class="font-mono text-xs font-black uppercase tracking-wider bg-black/15 px-2 py-0.5 rounded">${stepData.title}</span>
              <span class="font-bold text-sm text-black">${stepData.subtitle}</span>
            </div>
            <p class="text-xs text-black/85 mt-0.5 max-w-2xl">${stepData.description}</p>
          </div>
        </div>

        <!-- Controls -->
        <div class="flex items-center gap-2">
          ${this.currentStep > 1 ? `
            <button onclick="CAT_DEMO.prevStep()" class="px-3 py-1.5 bg-black/10 hover:bg-black/20 text-black font-bold text-xs rounded transition-colors">
              ← Back
            </button>
          ` : ''}
          <button onclick="CAT_DEMO.nextStep()" class="px-4 py-1.5 bg-black hover:bg-zinc-900 text-amber-400 font-extrabold text-xs rounded shadow-lg transition-transform transform hover:scale-105">
            ${stepData.actionLabel}
          </button>
          <button onclick="CAT_DEMO.resetDemo()" class="p-1.5 text-black/60 hover:text-black" title="Close Demo">
            ✕
          </button>
        </div>
      </div>
    `;
  }
};
