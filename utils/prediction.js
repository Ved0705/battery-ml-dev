export function calculatePrediction(currentData, history) {
  // 1. Estimated Remaining Time Calculation
  // Heuristic: Using standard Li-ion voltage curve approx (max 4.2V, min 3.2V)
  // Assume a generic 4000mAh (4.0Ah) battery for calculation purposes.
  const safeVoltage = Math.max(3.2, Math.min(4.2, currentData.voltage));
  const capacityPct = (safeVoltage - 3.2) / (4.2 - 3.2); // 0.0 to 1.0
  
  // Real capacity affected by health degradation
  const realCapacityAh = 4.0 * capacityPct * (currentData.health / 100);
  
  let timeHours = 0;
  if (currentData.current > 0.05) {
    timeHours = realCapacityAh / currentData.current;
  } else {
    timeHours = realCapacityAh / 0.1; // Minimal idle drain assumption
  }

  // 2. Health Trend
  // Looking at the difference between current health and the oldest history log.
  let trend = 'Stable';
  let trendColor = '#16A34A';
  if (history && history.length > 3) {
    const currentHealth = history[0].health;
    const oldestHealth = history[history.length - 1].health;
    // Declining if it drops more than 0.5% in the recorded window
    if (currentHealth < oldestHealth - 0.5) {
      trend = 'Declining';
      trendColor = '#DC2626';
    } else if (currentHealth < oldestHealth - 0.1) {
      trend = 'Slightly Declining';
      trendColor = '#D97706';
    }
  }

  // 3. Risk Forecast
  // Core Logic: High Temp + High Current is dangerous (rapid degradation)
  // Low voltage is also risky (deep discharge)
  let riskForecast = 'Low';
  let riskColor = '#16A34A';

  if (currentData.temperature >= 40 && currentData.current >= 1.5) {
    riskForecast = 'High - Overheating under load';
    riskColor = '#DC2626';
  } else if (currentData.voltage < 3.4) {
    riskForecast = 'High - Deep Discharge Risk';
    riskColor = '#DC2626';
  } else if (currentData.temperature >= 35 || currentData.current >= 1.2 || currentData.voltage < 3.6) {
    riskForecast = 'Medium - Elevated Stress';
    riskColor = '#D97706';
  }

  return {
    remainingHours: timeHours > 0 ? timeHours.toFixed(1) : '0.0',
    trend,
    trendColor,
    riskForecast,
    riskColor
  };
}
