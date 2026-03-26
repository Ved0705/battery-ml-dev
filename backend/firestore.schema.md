# Firestore Schema (Battery Health Monitoring)

```text
batteryData/
  {deviceId}/
    latest/
      current {
        voltage: number,
        current: number,
        temperature: number,
        health: number,   // 0-100
        risk: string,     // LOW | MEDIUM | HIGH
        timestamp: number
      }

    history/
      {autoId} {
        voltage: number,
        current: number,
        temperature: number,
        health: number,
        risk: string,
        timestamp: number
      }
```

Notes:
- `deviceId` is your ESP32/device identifier.
- Use Firebase Auth UID to map an owner to one or many devices in your app-level logic.
