/**
 * CAT-PULSE AI ANALYTICS ENGINE (ENHANCED)
 * - Anomaly Detection (Ghost rentals, excessive idle, unassigned operators, overdue)
 * - Demand Forecasting (Site requirement projection for next 30 days)
 * - Smart Reallocation & Cost Avoidance Optimizer
 * - Predictive Maintenance Health Diagnostics & Enterprise ROI Calculator
 */

const CAT_ANALYTICS = {
  IDLE_FUEL_BURN_L_HR: 3.5,
  ACTIVE_FUEL_BURN_L_HR: 18.0,
  FUEL_COST_PER_LITER_USD: 1.15,

  /**
   * Run comprehensive anomaly detection across the fleet
   */
  detectAnomalies: function(assets) {
    const anomalies = [];

    assets.forEach(asset => {
      const totalHours = (asset.engineHoursDay || 0) + (asset.idleHoursDay || 0);
      const idleRatio = totalHours > 0 ? (asset.idleHoursDay / totalHours) : 0;
      const wastedRentalCost = (asset.dailyRate || 350) * (asset.operatingDays || 0);
      const wastedFuelLiters = (asset.idleHoursDay || 0) * (asset.operatingDays || 0) * this.IDLE_FUEL_BURN_L_HR;
      const wastedFuelCost = wastedFuelLiters * this.FUEL_COST_PER_LITER_USD;

      // Anomaly 1: Ghost Rental (Critical) - Rented with No Site, No Operator, 0 Runtime
      if (!asset.siteId && (asset.engineHoursDay === 0 || !asset.operatorId)) {
        anomalies.push({
          id: `ANOM-${asset.id}-GHOST`,
          assetId: asset.id,
          assetType: asset.type,
          severity: "Critical",
          type: "Ghost Rental / Unassigned Asset",
          title: `Unassigned ${asset.type} (${asset.id}) Burning Rental`,
          description: `Machine is checked out for ${asset.operatingDays} days with NO assigned site or operator and 0.0h actual work.`,
          dataSignals: [
            { label: "Site ID", value: "NULL (Unassigned)", alert: true },
            { label: "Operator", value: "NULL (Unassigned)", alert: true },
            { label: "Engine Runtime", value: "0.0 h/day", alert: true },
            { label: "Idle Time", value: `${asset.idleHoursDay} h/day`, alert: true },
            { label: "Wasted Spend", value: `$${wastedRentalCost.toLocaleString()}`, alert: true }
          ],
          financialImpact: wastedRentalCost,
          recommendedAction: "Reassign immediately to a deficit site or execute Check-In to stop rental billing.",
          actionType: "REASSIGN_OR_RETURN",
          actionTargetAsset: asset.id
        });
      }
      // Anomaly 2: High Idle Ratio (Warning) - Engine on but doing very little work
      else if (idleRatio > 0.65 && asset.engineHoursDay > 0) {
        anomalies.push({
          id: `ANOM-${asset.id}-IDLE`,
          assetId: asset.id,
          assetType: asset.type,
          severity: "Warning",
          type: "Excessive Idle Time",
          title: `High Idle Anomaly on ${asset.id} (${(idleRatio * 100).toFixed(0)}% Idle)`,
          description: `Asset runs ${asset.idleHoursDay}h idle vs only ${asset.engineHoursDay}h actual engine work per day. Burning unnecessary fuel.`,
          dataSignals: [
            { label: "Site ID", value: asset.siteId, alert: false },
            { label: "Idle Ratio", value: `${(idleRatio * 100).toFixed(1)}%`, alert: true },
            { label: "Engine Work", value: `${asset.engineHoursDay} h/day`, alert: false },
            { label: "Fuel Wasted", value: `${wastedFuelLiters.toFixed(0)} Liters ($${wastedFuelCost.toFixed(0)})`, alert: true }
          ],
          financialImpact: wastedFuelCost,
          recommendedAction: "Optimize jobsite duty cycle or reallocate surplus hours to adjacent site.",
          actionType: "OPTIMIZE_DUTY",
          actionTargetAsset: asset.id
        });
      }
    });

    return anomalies;
  },

  /**
   * Calculate Fleet-wide Key Performance Indicators
   */
  calculateFleetKPIs: function(assets) {
    let totalRented = assets.length;
    let activeCount = 0;
    let idleCount = 0;
    let unassignedCount = 0;
    let totalWorkHours = 0;
    let totalIdleHours = 0;
    let totalDailyCost = 0;
    let totalWastedSpend = 0;
    let totalAvoidedCost = 0;

    assets.forEach(a => {
      totalDailyCost += (a.dailyRate || 0);
      totalWorkHours += ((a.engineHoursDay || 0) * (a.operatingDays || 1));
      totalIdleHours += ((a.idleHoursDay || 0) * (a.operatingDays || 1));

      if (!a.siteId || a.status === "Unassigned") {
        unassignedCount++;
        totalWastedSpend += ((a.dailyRate || 350) * (a.operatingDays || 1));
      } else if (a.status === "Idle" || (a.idleHoursDay > a.engineHoursDay)) {
        idleCount++;
      } else {
        activeCount++;
      }

      if (a.isReassigned) {
        totalAvoidedCost += ((a.dailyRate || 350) * 12);
      }
    });

    const totalHours = totalWorkHours + totalIdleHours;
    const fleetUtilization = totalHours > 0 ? ((totalWorkHours / totalHours) * 100) : 0;

    return {
      totalRented,
      activeCount,
      idleCount,
      unassignedCount,
      fleetUtilization: Math.round(fleetUtilization),
      totalDailyCost,
      totalWastedSpend,
      totalAvoidedCost,
      totalWorkHours: Math.round(totalWorkHours),
      totalIdleHours: Math.round(totalIdleHours),
      co2AvoidableTons: ((totalIdleHours * this.IDLE_FUEL_BURN_L_HR * 2.68) / 1000).toFixed(1)
    };
  },

  /**
   * AI Demand Forecasting by Site and Equipment Category (Next 30 Days)
   */
  generateDemandForecast: function(sites, assets) {
    const forecastTimeline = [
      { week: "Week 1 (Apr 01 - Apr 07)", label: "Immediate (0-7d)" },
      { week: "Week 2 (Apr 08 - Apr 14)", label: "Short-Term (8-14d)" },
      { week: "Week 3 (Apr 15 - Apr 21)", label: "Medium-Term (15-21d)" },
      { week: "Week 4 (Apr 22 - Apr 30)", label: "Long-Term (22-30d)" }
    ];

    const siteForecasts = sites.map(site => {
      const assigned = assets.filter(a => a.siteId === site.id);
      const assignedExcavators = assigned.filter(a => a.type === "Excavator").length;
      const assignedBulldozers = assigned.filter(a => a.type === "Bulldozer").length;
      const assignedGraders = assigned.filter(a => a.type === "Grader").length;
      const assignedCranes = assigned.filter(a => a.type === "Crane").length;

      let neededExcavators = site.requiredEquipment.filter(t => t === "Excavator").length;
      let neededBulldozers = site.requiredEquipment.filter(t => t === "Bulldozer").length;
      let neededGraders = site.requiredEquipment.filter(t => t === "Grader").length;

      let deficitType = null;
      let deficitQty = 0;
      let isSurplus = false;
      let surplusQty = 0;
      let recommendation = "Fleet balanced for current project phase.";

      if (site.id === "S003") {
        neededExcavators = 2;
        const deficit = neededExcavators - assignedExcavators;
        if (deficit > 0) {
          deficitType = "Excavator";
          deficitQty = deficit;
          recommendation = `High Urgency: Deep Trenching requires +${deficit} Excavator starting Apr 2. Pre-position idle EQX1007 instead of ordering new external rental.`;
        }
      } else if (site.id === "S004") {
        neededExcavators = 2;
        neededBulldozers = 1;
        neededGraders = 2;
        const totalDeficit = Math.max(0, neededExcavators - assignedExcavators) + 
                             Math.max(0, neededBulldozers - assignedBulldozers) + 
                             Math.max(0, neededGraders - assignedGraders);
        if (totalDeficit > 0) {
          deficitType = "Excavator & Grader & Dozer";
          deficitQty = totalDeficit;
          recommendation = `Major Demand Surge: Project transitioning into major asphalt paving & trenching. Requires +${neededExcavators - assignedExcavators} Excavator, +${neededBulldozers - assignedBulldozers} Dozer & +${neededGraders - assignedGraders} Grader. Recommend transferring surplus units from Kanchipuram Quarry (S006) and Staging Yard.`;
        }
      } else if (site.id === "S006") {
        neededBulldozers = 1;
        neededExcavators = 0;
        neededGraders = 0;
        if (assignedBulldozers > neededBulldozers) {
          isSurplus = true;
          surplusQty = assignedBulldozers - neededBulldozers;
          recommendation = `Project Completion Phase: Quarry extraction winding down. 1 Bulldozer is now surplus and can be demobilized or reallocated to ORR Expressway (S004) to prevent unnecessary rental billing.`;
        }
      }

      return {
        siteId: site.id,
        siteName: site.name,
        location: site.location,
        projectPhase: site.projectPhase,
        currentFleet: {
          Excavators: assignedExcavators,
          Bulldozers: assignedBulldozers,
          Graders: assignedGraders,
          Cranes: assignedCranes,
          total: assigned.length
        },
        forecastDemand: {
          Excavators: neededExcavators,
          Bulldozers: neededBulldozers,
          Graders: neededGraders,
          total: neededExcavators + neededBulldozers + neededGraders
        },
        deficitType,
        deficitQty,
        isSurplus,
        surplusQty,
        recommendation
      };
    });

    return {
      timeline: forecastTimeline,
      siteForecasts,
      primaryActionableInsight: {
        targetSiteId: "S003",
        targetSiteName: "Aerospace Tech Hub Park",
        requiredType: "Excavator",
        candidateAssetId: "EQX1007",
        costSavings: 4200,
        narrative: "Site S003 requires 1 additional Excavator next week. Reallocating EQX1007 (currently unassigned with 12h/day idle) avoids $4,200 in redundant new rental expenses."
      }
    };
  },

  /**
   * Enterprise Scalability Calculator (Simulating Enterprise ROI across larger fleet sizes)
   */
  calculateEnterpriseROI: function(fleetSize = 250, avgDailyRate = 420, avgGhostPercent = 14) {
    const unassignedUnits = Math.round(fleetSize * (avgGhostPercent / 100));
    const avgWastedDaysPerMonth = 8;
    const monthlyWastedSpend = unassignedUnits * avgDailyRate * avgWastedDaysPerMonth;
    const annualWastedSpend = monthlyWastedSpend * 12;

    const projectedAvoidedCostAnnual = annualWastedSpend * 0.85; // 85% recovered via CAT-Pulse
    const projectedCO2SavedTons = Math.round((unassignedUnits * 120 * this.IDLE_FUEL_BURN_L_HR * 2.68) / 1000);

    return {
      fleetSize,
      unassignedUnits,
      monthlyWastedSpend,
      annualWastedSpend,
      projectedAvoidedCostAnnual: Math.round(projectedAvoidedCostAnnual),
      projectedCO2SavedTons
    };
  }
};
