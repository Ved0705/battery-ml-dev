/**
 * Placeholder ML function.
 *
 * Current dummy logic:
 * - Lower voltage decreases health
 * - Higher temperature increases risk
 */
export function processBatteryData(voltage, current, temperature) {
  const minVoltage = 9;
  const maxVoltage = 13;

  const normalizedVoltage = (voltage - minVoltage) / (maxVoltage - minVoltage);
  const voltageScore = Math.max(0, Math.min(1, normalizedVoltage));

  const currentPenalty = Math.min(Math.abs(current) * 0.5, 10);
  const health = Math.round(Math.max(0, Math.min(100, voltageScore * 100 - currentPenalty)));

  let risk = 'LOW';

  if (temperature >= 55 || health < 30) {
    risk = 'HIGH';
  } else if (temperature >= 45 || health < 60) {
    risk = 'MEDIUM';
  }

  return { health, risk };
}
