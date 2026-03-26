import {
  getCurrentOwnerUid,
  loginDeviceOwner,
  registerDeviceOwner,
} from './firebase/authService';
import {
  getHistory,
  getLatestData,
  sendBatteryData,
} from './firebase/batteryService';

async function runDemo() {
  // 1) Authentication (email/password)
  const owner = await registerDeviceOwner('owner@example.com', 'StrongPass123!');
  console.log('registered owner uid:', owner.uid);

  await loginDeviceOwner('owner@example.com', 'StrongPass123!');
  console.log('current uid:', getCurrentOwnerUid());

  // 2) Incoming data from ESP32/device
  const deviceId = 'esp32-device-001';

  await sendBatteryData(deviceId, {
    voltage: 11.7,
    current: 2.2,
    temperature: 41.5,
    timestamp: Date.now(),
  });

  await sendBatteryData(deviceId, {
    voltage: 10.9,
    current: 3.1,
    temperature: 48.3,
    timestamp: Date.now(),
  });

  // 3) Read API/service layer
  const latest = await getLatestData(deviceId);
  const history = await getHistory(deviceId);

  console.log('latest', latest);
  console.log('history count', history.length);
}

runDemo().catch((error) => {
  console.error('demo failed', error);
});
