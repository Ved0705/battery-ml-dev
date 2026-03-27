import pandas as pd
from pathlib import Path
from joblib import dump
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix, r2_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder
from xgboost import XGBClassifier

RANDOM_STATE = 42
DATASET_PATH = Path("battery_dataset_v2.csv")

RISK_MAP = {"Low": 0, "Medium": 1, "High": 2}


def load_dataset(path: Path) -> pd.DataFrame:
    if not path.exists():
        raise FileNotFoundError(f"Dataset file not found: {path}")
    df = pd.read_csv(path)

    required_cols = [
        "voltage","current","temperature","time","battery_type",
        "power","voltage_drop_rate","temp_change_rate","current_spike",
        "soc","soh","risk"
    ]
    missing = [c for c in required_cols if c not in df.columns]
    if missing:
        raise ValueError(f"Missing columns: {missing}")

    return df


def engineer_features(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    df["thermal_stress"] = df["temperature"] * df["temp_change_rate"]
    df["electrical_stress"] = df["current"] * df["voltage_drop_rate"]
    df["degradation_index"] = df["time"] * df["voltage_drop_rate"]
    df["time_to_failure"] = (df["soh"] / (df["voltage_drop_rate"] + 0.001)) * 10
    return df


def build_preprocessor() -> ColumnTransformer:
    categorical_features = ["battery_type"]
    numeric_features = [
        "voltage","current","temperature","time","power",
        "voltage_drop_rate","temp_change_rate","current_spike",
        "thermal_stress","electrical_stress","degradation_index"
    ]
    return ColumnTransformer([
        ("cat", OneHotEncoder(handle_unknown="ignore"), categorical_features),
        ("num", "passthrough", numeric_features)
    ])


def main():
    print("Loading dataset...")
    df = load_dataset(DATASET_PATH)

    print("Engineering features...")
    df = engineer_features(df)

    feature_columns = [
        "voltage","current","temperature","time","battery_type","power",
        "voltage_drop_rate","temp_change_rate","current_spike",
        "thermal_stress","electrical_stress","degradation_index"
    ]

    X = df[feature_columns]
    y_soc = df["soc"]
    y_soh = df["soh"]
    y_ttf = df["time_to_failure"]
    y_risk = df["risk"].map(RISK_MAP)
    
    if y_risk.isna().any():
        raise ValueError("Risk column contains values outside {Low, Medium, High}")

    print("Splitting dataset...")
    X_train, X_test, y_soc_train, y_soc_test, y_soh_train, y_soh_test, y_ttf_train, y_ttf_test, y_risk_train, y_risk_test = train_test_split(
        X, y_soc, y_soh, y_ttf, y_risk,
        test_size=0.2, random_state=RANDOM_STATE, stratify=y_risk
    )

    preprocessor = build_preprocessor()

    soc_model = Pipeline([
        ("preprocessor", preprocessor),
        ("model", RandomForestRegressor(n_estimators=300, random_state=RANDOM_STATE, n_jobs=-1, min_samples_leaf=2))
    ])

    soh_model = Pipeline(steps=[
        ("preprocessor", preprocessor),
        ("model", RandomForestRegressor(n_estimators=300, random_state=RANDOM_STATE, n_jobs=-1, min_samples_leaf=2))
    ])
    
    ttf_model = Pipeline(steps=[
        ("preprocessor", preprocessor),
        ("model", RandomForestRegressor(n_estimators=300, random_state=RANDOM_STATE, n_jobs=-1, min_samples_leaf=2))
    ])
    
    risk_model = Pipeline(steps=[
        ("preprocessor", preprocessor),
        ("model", XGBClassifier(
            n_estimators=300,
            max_depth=6,
            learning_rate=0.05,
            subsample=0.9,
            colsample_bytree=0.9,
            objective="multi:softmax",
            num_class=3,
            eval_metric="mlogloss",
            random_state=RANDOM_STATE,
            n_jobs=-1
        ))
    ])

    print("Training models...")
    soc_model.fit(X_train, y_soc_train)
    soh_model.fit(X_train, y_soh_train)
    ttf_model.fit(X_train, y_ttf_train)
    risk_model.fit(X_train, y_risk_train)
    
    print("Evaluating models...")
    soc_pred = soc_model.predict(X_test)
    soh_pred = soh_model.predict(X_test)
    ttf_pred = ttf_model.predict(X_test)
    risk_pred = risk_model.predict(X_test)

    print(f"SOC R2 score: {r2_score(y_soc_test, soc_pred):.4f}")
    print(f"SOH R2 score: {r2_score(y_soh_test, soh_pred):.4f}")
    print(f"Time-to-Failure R2 score: {r2_score(y_ttf_test, ttf_pred):.4f}")
    print(f"Risk accuracy: {accuracy_score(y_risk_test, risk_pred):.4f}")

    print("\nClassification report:")
    print(classification_report(y_risk_test, risk_pred, target_names=["Low","Medium","High"], digits=4))

    print("Confusion matrix:")
    print(confusion_matrix(y_risk_test, risk_pred))

    print("Saving models...")
    dump(soc_model, "soc_model.pkl")
    dump(soh_model, "soh_model.pkl")
    dump(ttf_model, "ttf_model.pkl")
    dump(risk_model, "risk_model.pkl")
    print("Saved models: soc_model.pkl, soh_model.pkl, ttf_model.pkl, risk_model.pkl")


if __name__ == "__main__":
    main()