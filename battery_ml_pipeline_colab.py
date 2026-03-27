"""

Train battery health models from a synthetic CSV dataset.

Expected input file:
  - battery_dataset.csv

Saves:
  - soc_model.pkl
  - soh_model.pkl
  - risk_model.pkl

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


from pathlib import Path

import pandas as pd
from joblib import dump
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix, r2_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder
from xgboost import XGBClassifier

RANDOM_STATE = 42
DATASET_PATH = Path("battery_dataset.csv")


RISK_MAP = {"Low": 0, "Medium": 1, "High": 2}


def load_dataset(path: Path) -> pd.DataFrame:
    if not path.exists():
        raise FileNotFoundError(f"Dataset file not found: {path}")
    df = pd.read_csv(path)
    required_columns = {
        "voltage",
        "current",
        "temperature",
        "time",
        "battery_type",
        "power",
        "voltage_drop_rate",
        "temp_change_rate",
        "current_spike",
        "soc",
        "soh",
        "risk",
    }
    missing = sorted(required_columns - set(df.columns))
    if missing:
        raise ValueError(f"Dataset missing required columns: {missing}")
    return df


def engineer_features(df: pd.DataFrame) -> pd.DataFrame:
    result = df.copy()
    result["thermal_stress"] = result["temperature"] * result["temp_change_rate"]
    result["electrical_stress"] = result["current"] * result["voltage_drop_rate"]
    result["degradation_index"] = result["time"] * result["voltage_drop_rate"]
    return result


def build_preprocessor() -> ColumnTransformer:
    categorical = ["battery_type"]
    numeric = [

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

    # Voltage degradation slope factors by type (lead-acid drops faster)
    type_voltage_drop = np.select(
        [battery_type == "lead_acid", battery_type == "li_ion", battery_type == "lifepo4"],
        [0.00085, 0.00055, 0.00035],
        default=0.00055,
    )

    # Temperature sensitivity (li-ion is most temperature sensitive)
    temp_sensitivity = np.select(
        [battery_type == "lead_acid", battery_type == "li_ion", battery_type == "lifepo4"],
        [0.0040, 0.0070, 0.0025],
        default=0.0045,
    )

    # Current sensitivity impacts instantaneous voltage sag
    current_sensitivity = np.select(
        [battery_type == "lead_acid", battery_type == "li_ion", battery_type == "lifepo4"],
        [0.018, 0.014, 0.010],
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

    # Label logic
    # SOC: lower voltage + higher current => lower SOC
    type_soc_offset = np.select(
        [df["battery_type"] == "lead_acid", df["battery_type"] == "li_ion", df["battery_type"] == "lifepo4"],
        [-2.0, 2.0, 4.0],
        default=0.0,
    )

    soc = (
        55
        + 18 * (df["voltage"] - df["voltage"].mean()) / (df["voltage"].std() + 1e-6)
        - 0.45 * df["current"]
        - 120 * df["voltage_drop_rate"].clip(lower=0)
        + type_soc_offset
        + rng.normal(0, 4, size=n_samples)
    )
    df["soc"] = soc.clip(0, 100)

    # SOH: decreases over time, faster under high temp/current and by chemistry
    type_soh_time_penalty = np.select(
        [df["battery_type"] == "lead_acid", df["battery_type"] == "li_ion", df["battery_type"] == "lifepo4"],
        [0.011, 0.009, 0.006],
        default=0.009,
    )
    type_temp_penalty = np.select(
        [df["battery_type"] == "lead_acid", df["battery_type"] == "li_ion", df["battery_type"] == "lifepo4"],
        [0.10, 0.16, 0.07],
        default=0.10,
    )

    soh = (
        100
        - type_soh_time_penalty * df["time"]
        - type_temp_penalty * np.maximum(df["temperature"] - 30, 0)
        - 0.12 * np.maximum(df["current"] - 20, 0)
        - 130 * df["voltage_drop_rate"].clip(lower=0)
        + rng.normal(0, 2.8, size=n_samples)
    )
    df["soh"] = soh.clip(0, 100)

    # Risk label from SOC, SOH, temperature, and current stress
    risk_score = (
        0.45 * (100 - df["soc"])
        + 0.35 * (100 - df["soh"])
        + 0.12 * np.maximum(df["temperature"] - 40, 0)
        + 0.08 * np.maximum(df["current"] - 50, 0)
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
        "thermal_stress",
        "electrical_stress",
        "degradation_index",
    ]
    return ColumnTransformer(
        transformers=[
            ("cat", OneHotEncoder(handle_unknown="ignore"), categorical),
            ("num", "passthrough", numeric),

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

    df = load_dataset(DATASET_PATH)
    df = engineer_features(df)

    feature_columns = [

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
        "thermal_stress",
        "electrical_stress",
        "degradation_index",
    ]

    X = df[feature_columns]
    y_soc = df["soc"]
    y_soh = df["soh"]
    y_risk = df["risk"].map(RISK_MAP)

    if y_risk.isna().any():
        raise ValueError("Risk column contains values outside {Low, Medium, High}")

    (
        X_train,
        X_test,
        y_soc_train,
        y_soc_test,
        y_soh_train,
        y_soh_test,
        y_risk_train,
        y_risk_test,
    ) = train_test_split(
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
                XGBClassifier(
                    n_estimators=300,
                    max_depth=6,
                    learning_rate=0.05,
                    subsample=0.9,
                    colsample_bytree=0.9,
                    objective="multi:softprob",
                    num_class=3,
                    eval_metric="mlogloss",
                    random_state=RANDOM_STATE,
                    n_jobs=-1,
                ),
            ),
        ]
    )

    soc_model.fit(X_train, y_soc_train)
    soh_model.fit(X_train, y_soh_train)
    risk_model.fit(X_train, y_risk_train)

    soc_pred = soc_model.predict(X_test)
    soh_pred = soh_model.predict(X_test)
    risk_pred = risk_model.predict(X_test)

    print(f"SOC R2 score: {r2_score(y_soc_test, soc_pred):.4f}")
    print(f"SOH R2 score: {r2_score(y_soh_test, soh_pred):.4f}")
    print(f"Risk accuracy: {accuracy_score(y_risk_test, risk_pred):.4f}")
    print("Classification report:")
    print(classification_report(y_risk_test, risk_pred, target_names=["Low", "Medium", "High"], digits=4))
    print("Confusion matrix:")
    print(confusion_matrix(y_risk_test, risk_pred))
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
