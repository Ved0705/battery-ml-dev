/**
 * Firebase Cloud Function (optional) that processes newly appended history records
 * and mirrors the result into latest/current.
 *
 * Deploy this from a Firebase Functions workspace with firebase-admin and
 * firebase-functions installed.
 */
const { onDocumentCreated } = require('firebase-functions/v2/firestore');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

initializeApp();

function processBatteryData(voltage, current, temperature) {
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

exports.onBatteryHistoryCreate = onDocumentCreated(
  'batteryData/{deviceId}/history/{historyId}',
  async (event) => {
    const db = getFirestore();
    const raw = event.data?.data();

    if (!raw) {
      return;
    }

    const { health, risk } = processBatteryData(raw.voltage, raw.current, raw.temperature);

    const payload = {
      ...raw,
      health,
      risk,
      timestamp: raw.timestamp ?? Date.now(),
    };

    const deviceId = event.params.deviceId;

    await db.doc(`batteryData/${deviceId}/latest/current`).set(payload, { merge: true });
    await event.data.ref.set(payload, { merge: true });
  }
);
