# Firebase Backend - Battery Health Monitoring

## 1) Firebase setup

Create a `.env` (or Expo env) with:

```bash
EXPO_PUBLIC_FIREBASE_API_KEY=...
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=...
EXPO_PUBLIC_FIREBASE_PROJECT_ID=...
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=...
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
EXPO_PUBLIC_FIREBASE_APP_ID=...
```

Firebase initialization is in `backend/firebase/config.js`.

## 2) Authentication

Implemented in `backend/firebase/authService.js`:
- `registerDeviceOwner(email, password)`
- `loginDeviceOwner(email, password)`
- `getCurrentOwnerUid()`
- `logoutDeviceOwner()`

## 3) Firestore service layer

Implemented in `backend/firebase/batteryService.js`:
- `sendBatteryData(deviceId, data)`
- `getLatestData(deviceId)`
- `getHistory(deviceId, maxItems)`

`sendBatteryData` will:
1. Run placeholder ML (`processBatteryData`)
2. Update `batteryData/{deviceId}/latest/current`
3. Append to `batteryData/{deviceId}/history/{autoId}`

## 4) ML placeholder

Implemented in `backend/firebase/ml.js`:
- `processBatteryData(voltage, current, temperature)`

Dummy behavior:
- Low voltage reduces health
- High temperature increases risk

## 5) Optional Cloud Function trigger

`backend/functions/index.js` includes:
- `onBatteryHistoryCreate` trigger on
  `batteryData/{deviceId}/history/{historyId}`
- Recomputes `health/risk`
- Updates both history document and latest document

## 6) Example usage

See `backend/exampleUsage.js` for a full flow.
