import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  setDoc,
} from 'firebase/firestore';
import { db } from './config';
import { processBatteryData } from './ml';

function buildLatestDocRef(deviceId) {
  return doc(db, 'batteryData', deviceId, 'latest', 'current');
}

function buildHistoryCollectionRef(deviceId) {
  return collection(db, 'batteryData', deviceId, 'history');
}

/**
 * Pushes a new sensor payload.
 * - processes health/risk (placeholder ML)
 * - updates latest/current
 * - appends to history
 */
export async function sendBatteryData(deviceId, data) {
  const timestamp = data.timestamp ?? Date.now();
  const { health, risk } = processBatteryData(data.voltage, data.current, data.temperature);

  const payload = {
    voltage: data.voltage,
    current: data.current,
    temperature: data.temperature,
    health,
    risk,
    timestamp,
  };

  const latestRef = buildLatestDocRef(deviceId);
  const historyRef = buildHistoryCollectionRef(deviceId);

  await setDoc(latestRef, payload);
  const historyDocRef = await addDoc(historyRef, payload);

  return {
    latestPath: latestRef.path,
    historyId: historyDocRef.id,
    payload,
  };
}

export async function getLatestData(deviceId) {
  const latestSnapshot = await getDoc(buildLatestDocRef(deviceId));

  if (!latestSnapshot.exists()) {
    return null;
  }

  return latestSnapshot.data();
}

export async function getHistory(deviceId, maxItems = 100) {
  const historyQuery = query(
    buildHistoryCollectionRef(deviceId),
    orderBy('timestamp', 'desc'),
    limit(maxItems)
  );

  const snapshot = await getDocs(historyQuery);

  return snapshot.docs.map((item) => ({
    id: item.id,
    ...item.data(),
  }));
}
