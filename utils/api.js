// API utility for ML Backend
const API_BASE_URL = 'http://10.111.183.6:8000';

export async function getBatteryPrediction(data) {
  try {
    const response = await fetch(`${API_BASE_URL}/predict`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    throw error;
  }
}
