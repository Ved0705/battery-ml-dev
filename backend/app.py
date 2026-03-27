"""
Instructions to Run:

1. Install dependencies:
   pip install fastapi uvicorn pandas scikit-learn xgboost joblib pydantic

2. Run the server (from the backend directory):
   uvicorn app:app --host 0.0.0.0 --port 8000 --reload
"""

import os
import pandas as pd
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from joblib import load

# Determine the absolute path to the parent directory where models are located
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Load models at startup
soc_model = load(os.path.join(BASE_DIR, "soc_model.pkl"))
soh_model = load(os.path.join(BASE_DIR, "soh_model.pkl"))
risk_model = load(os.path.join(BASE_DIR, "risk_model.pkl"))
ttf_model = load(os.path.join(BASE_DIR, "ttf_model.pkl"))

app = FastAPI()

# Enable CORS for frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class PredictRequest(BaseModel):
    voltage: float
    current: float
    temperature: float
    time: float
    battery_type: str
    power: float
    voltage_drop_rate: float
    temp_change_rate: float
    current_spike: float

@app.post("/predict")
def predict(data: PredictRequest):
    # Convert incoming request to a DataFrame
    input_data = data.dict()
    df = pd.DataFrame([input_data])
    
    # Apply identical feature engineering from training
    df["thermal_stress"] = df["temperature"] * df["temp_change_rate"]
    df["electrical_stress"] = df["current"] * df["voltage_drop_rate"]
    df["degradation_index"] = df["time"] * df["voltage_drop_rate"]
    
    # Perform predictions
    soc_pred = float(soc_model.predict(df)[0])
    soh_pred = float(soh_model.predict(df)[0])
    ttf_pred = float(ttf_model.predict(df)[0])
    risk_pred = int(risk_model.predict(df)[0])
    
    # Map back risk class to string label
    risk_mapping = {0: "Low", 1: "Medium", 2: "High"}
    
    return {
        "soc": soc_pred,
        "soh": soh_pred,
        "risk": risk_mapping.get(risk_pred, "Unknown"),
        "time_to_failure": ttf_pred
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
