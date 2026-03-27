"""
Battery Health Monitoring ML Pipeline (Google Colab friendly)

This script:
1) Generates a synthetic battery telemetry dataset.
2) Engineers derived features.
3) Trains RandomForest models for SOC, SOH, and risk classification.
4) Evaluates model quality on a train/test split.
5) Exports trained models with joblib.

Run in Google Colab:
!pip install -q pandas numpy scikit-learn joblib
!python battery_ml_pipeline_colab.py
"""

from __future__ import annotations

import numpy as np
import pandas as pd
from joblib import dump
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    mean_absolute_error,
    mean_squared_error,
    r2_score,
)
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder


RANDOM_STATE = 42


def generate_synthetic_battery_data(
    n_samples: int = 12000,
    n_units: int = 200,
    random_state: int = RANDOM_STATE,
) -> pd.DataFrame:
    """Generate synthetic battery telemetry + labels.

    Columns produced (raw):
      - voltage, current, temperature, time, battery_type

    Derived features:
      - power = voltage * current
      - voltage_drop_rate
      - temp_change_rate

    Labels:
      - soc [0, 100]
      - soh [0, 100]
      - risk (Low/Medium/High)
    """

    rng = np.random.default_rng(random_state)

    battery_types = np.array(["lead_acid", "li_ion", "lifepo4"])
    type_probs = np.array([0.30, 0.45, 0.25])

    # Assign synthetic battery units and types
    battery_id = rng.integers(0, n_units, size=n_samples)
    battery_type = rng.choice(battery_types, size=n_samples, p=type_probs)

    # Base operating signals
    # time in hours since first observation
    time_hours = rng.uniform(0, 4000, size=n_samples)

    # Type-specific nominal voltage baseline
    v_nominal = np.select(
        [battery_type == "lead_acid", battery_type == "li_ion", battery_type == "lifepo4"],
        [12.5, 3.7, 3.2],
        default=3.7,
    )

    # Current (A): discharge-heavy positive values
    current = rng.normal(loc=25, scale=12, size=n_samples).clip(1, 80)

    # Temperature (°C)
    temperature = rng.normal(loc=31, scale=9, size=n_samples).clip(-5, 70)

    # Inject load switching spikes (roughly every 25 samples)
    spike_mask = rng.integers(0, 25, size=n_samples) == 0
    current[spike_mask] = current[spike_mask] * rng.uniform(1.5, 2.0, size=np.sum(spike_mask))
    current = current.clip(1, 80)
    temperature[spike_mask] = temperature[spike_mask] + rng.uniform(3, 5, size=np.sum(spike_mask))
    temperature = temperature.clip(-5, 70)

    # Voltage degradation slope factors by type
    # lead_acid -> faster drop, li_ion -> stable but temp sensitive, lifepo4 -> very stable
    type_voltage_drop = np.select(
        [battery_type == "lead_acid", battery_type == "li_ion", battery_type == "lifepo4"],
        [0.00150, 0.00040, 0.00010],
        default=0.00040,
    )

    # Temperature sensitivity (li-ion is highly temperature sensitive)
    temp_sensitivity = np.select(
        [battery_type == "lead_acid", battery_type == "li_ion", battery_type == "lifepo4"],
        [0.0030, 0.0090, 0.0015],
        default=0.0045,
    )

    # Current sensitivity impacts instantaneous voltage sag
    current_sensitivity = np.select(
        [battery_type == "lead_acid", battery_type == "li_ion", battery_type == "lifepo4"],
        [0.025, 0.012, 0.008],
        default=0.014,
    )

    # Voltage model with time, current, and temperature effects
    voltage = (
        v_nominal
        - type_voltage_drop * (time_hours / 10)
        - current_sensitivity * (current / 10)
        - temp_sensitivity * np.maximum(temperature - 25, 0)
        + rng.normal(0, 0.08, size=n_samples)
    )

    # Keep voltage within plausible bounds for each chemistry
    v_min = np.select(
        [battery_type == "lead_acid", battery_type == "li_ion", battery_type == "lifepo4"],
        [9.5, 2.7, 2.8],
        default=2.7,
    )
    v_max = np.select(
        [battery_type == "lead_acid", battery_type == "li_ion", battery_type == "lifepo4"],
        [13.0, 4.2, 3.65],
        default=4.2,
    )
    voltage = np.clip(voltage, v_min, v_max)

    df = pd.DataFrame(
        {
            "battery_id": battery_id,
            "battery_type": battery_type,
            "time": time_hours,
            "voltage": voltage,
            "current": current,
            "temperature": temperature,
        }
    )

    # Sort for time-based rate features by battery unit
    df = df.sort_values(["battery_id", "time"]).reset_index(drop=True)

    # Derived features
    df["power"] = df["voltage"] * df["current"]

    # Rates = delta(signal)/delta(time), per battery_id trajectory
    dt = df.groupby("battery_id")["time"].diff().replace(0, np.nan)
    dv = df.groupby("battery_id")["voltage"].diff()
    dtemp = df.groupby("battery_id")["temperature"].diff()

    df["voltage_drop_rate"] = (-(dv / dt)).fillna(0).clip(-0.1, 0.1)
    df["temp_change_rate"] = (dtemp / dt).fillna(0).clip(-1.0, 1.0)

    # New feature: current_spike
    avg_current_per_battery = df.groupby("battery_id")["current"].transform("mean")
    df["current_spike"] = (df["current"] / avg_current_per_battery).fillna(1.0)

    # Label logic
    # SOC: highly dependent on battery_type curves
    # lead_acid: strongly linear voltage dependent
    v_norm_lead = ((df["voltage"] - 11.8) / (12.6 - 11.8)).clip(0, 1)
    soc_lead_acid = v_norm_lead * 100

    # li_ion: smoother polynomial curve
    v_norm_li = ((df["voltage"] - 3.0) / (4.2 - 3.0)).clip(0, 1)
    soc_li_ion = np.power(v_norm_li, 0.8) * 100

    # lifepo4: flat/stable curve in the middle, drops sharply at ends (sigmoid approximation)
    v_norm_lfp = ((df["voltage"] - 2.8) / (3.65 - 2.8)).clip(0, 1)
    soc_lifepo4 = (1 / (1 + np.exp(-15 * (v_norm_lfp - 0.5)))) * 100

    soc = np.select(
        [df["battery_type"] == "lead_acid", df["battery_type"] == "li_ion", df["battery_type"] == "lifepo4"],
        [soc_lead_acid, soc_li_ion, soc_lifepo4],
        default=soc_li_ion,
    )
    
    # Add small random noise
    soc = soc + rng.normal(0, 2.0, size=n_samples)
    df["soc"] = soc.clip(0, 100)

    # SOH: decreases over time, faster under high temp/current and by chemistry
    # lead_acid -> faster degradation with time and load
    # li_ion -> highly sensitive to temperature
    # lifepo4 -> slow degradation overall
    type_soh_time_penalty = np.select(
        [df["battery_type"] == "lead_acid", df["battery_type"] == "li_ion", df["battery_type"] == "lifepo4"],
        [0.015, 0.008, 0.003],
        default=0.008,
    )
    type_temp_penalty = np.select(
        [df["battery_type"] == "lead_acid", df["battery_type"] == "li_ion", df["battery_type"] == "lifepo4"],
        [0.08, 0.25, 0.05],
        default=0.10,
    )
    type_load_penalty = np.select(
        [df["battery_type"] == "lead_acid", df["battery_type"] == "li_ion", df["battery_type"] == "lifepo4"],
        [0.18, 0.08, 0.04],
        default=0.08,
    )

    soh = (
        100
        - type_soh_time_penalty * df["time"]
        - type_temp_penalty * np.maximum(df["temperature"] - 30, 0)
        - type_load_penalty * np.maximum(df["current"] - 20, 0)
        - 130 * df["voltage_drop_rate"].clip(lower=0)
        + rng.normal(0, 2.8, size=n_samples)
    )
    df["soh"] = soh.clip(0, 100)

    # Risk label from SOC, SOH, temperature, current stress, and real-time stress indicators
    type_temp_risk = np.select(
        [df["battery_type"] == "lead_acid", df["battery_type"] == "li_ion", df["battery_type"] == "lifepo4"],
        [0.10, 0.30, 0.05],
        default=0.15,
    )
    type_vdrop_risk = np.select(
        [df["battery_type"] == "lead_acid", df["battery_type"] == "li_ion", df["battery_type"] == "lifepo4"],
        [200, 100, 50],
        default=100,
    )

    risk_score = (
        0.30 * (100 - df["soc"])
        + 0.25 * (100 - df["soh"])
        + type_temp_risk * np.maximum(df["temperature"] - 40, 0)
        + 0.10 * np.maximum(df["current"] - 50, 0)
        + type_vdrop_risk * df["voltage_drop_rate"].clip(lower=0)
        + 10 * df["temp_change_rate"].clip(lower=0)
    )

    df["risk"] = pd.cut(
        risk_score,
        bins=[-np.inf, 20, 45, np.inf],
        labels=["Low", "Medium", "High"],
        ordered=True,
    ).astype(str)

    return df


def build_preprocessor() -> ColumnTransformer:
    categorical_features = ["battery_type"]
    numeric_features = [
        "voltage",
        "current",
        "temperature",
        "time",
        "power",
        "voltage_drop_rate",
        "temp_change_rate",
        "current_spike",
    ]

    return ColumnTransformer(
        transformers=[
            (
                "cat",
                OneHotEncoder(handle_unknown="ignore"),
                categorical_features,
            ),
            ("num", "passthrough", numeric_features),
        ]
    )


def main() -> None:
    print("Generating synthetic dataset...")
    df = generate_synthetic_battery_data()

    # Keep only requested feature columns + derived features for modeling
    feature_cols = [
        "voltage",
        "current",
        "temperature",
        "time",
        "battery_type",
        "power",
        "voltage_drop_rate",
        "temp_change_rate",
        "current_spike",
    ]

    X = df[feature_cols]
    y_soc = df["soc"]
    y_soh = df["soh"]
    y_risk = df["risk"]

    # Train/test split shared across all tasks
    X_train, X_test, y_soc_train, y_soc_test, y_soh_train, y_soh_test, y_risk_train, y_risk_test = train_test_split(
        X,
        y_soc,
        y_soh,
        y_risk,
        test_size=0.2,
        random_state=RANDOM_STATE,
        stratify=y_risk,
    )

    preprocessor = build_preprocessor()

    soc_model = Pipeline(
        steps=[
            ("preprocessor", preprocessor),
            (
                "model",
                RandomForestRegressor(
                    n_estimators=300,
                    random_state=RANDOM_STATE,
                    n_jobs=-1,
                    min_samples_leaf=2,
                ),
            ),
        ]
    )

    soh_model = Pipeline(
        steps=[
            ("preprocessor", preprocessor),
            (
                "model",
                RandomForestRegressor(
                    n_estimators=300,
                    random_state=RANDOM_STATE,
                    n_jobs=-1,
                    min_samples_leaf=2,
                ),
            ),
        ]
    )

    risk_model = Pipeline(
        steps=[
            ("preprocessor", preprocessor),
            (
                "model",
                RandomForestClassifier(
                    n_estimators=300,
                    random_state=RANDOM_STATE,
                    n_jobs=-1,
                    class_weight="balanced",
                    min_samples_leaf=2,
                ),
            ),
        ]
    )

    print("Training SOC model...")
    soc_model.fit(X_train, y_soc_train)

    print("Training SOH model...")
    soh_model.fit(X_train, y_soh_train)

    print("Training risk model...")
    risk_model.fit(X_train, y_risk_train)

    # Evaluate SOC
    soc_pred = soc_model.predict(X_test)
    soc_mae = mean_absolute_error(y_soc_test, soc_pred)
    soc_rmse = np.sqrt(mean_squared_error(y_soc_test, soc_pred))
    soc_r2 = r2_score(y_soc_test, soc_pred)

    # Evaluate SOH
    soh_pred = soh_model.predict(X_test)
    soh_mae = mean_absolute_error(y_soh_test, soh_pred)
    soh_rmse = np.sqrt(mean_squared_error(y_soh_test, soh_pred))
    soh_r2 = r2_score(y_soh_test, soh_pred)

    # Evaluate risk
    risk_pred = risk_model.predict(X_test)
    risk_acc = accuracy_score(y_risk_test, risk_pred)

    print("\n=== Dataset Preview ===")
    print(df[[*feature_cols, "soc", "soh", "risk"]].head(10).to_string(index=False))

    print("\n=== Metrics ===")
    print(f"SOC   -> MAE: {soc_mae:.3f}, RMSE: {soc_rmse:.3f}, R2: {soc_r2:.3f}")
    print(f"SOH   -> MAE: {soh_mae:.3f}, RMSE: {soh_rmse:.3f}, R2: {soh_r2:.3f}")
    print(f"Risk  -> Accuracy: {risk_acc:.3f}")
    print("\nRisk classification report:")
    print(classification_report(y_risk_test, risk_pred, digits=3))

    # Export models
    dump(soc_model, "soc_model.pkl")
    dump(soh_model, "soh_model.pkl")
    dump(risk_model, "risk_model.pkl")

    print("Saved models: soc_model.pkl, soh_model.pkl, risk_model.pkl")


if __name__ == "__main__":
    main()
