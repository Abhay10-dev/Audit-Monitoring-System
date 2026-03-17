"""
train.py — Baseline model training script for AMS ML service.

Generates a synthetic dataset of "normal" user behavior and trains an
Isolation Forest on it. Run this ONCE before starting the service:

    python train.py

The saved model file (models/model.joblib) will be loaded at service startup.
"""
import os
import numpy as np
import joblib
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline

# ── Output path ───────────────────────────────────────────────────────────────
MODEL_DIR = os.path.join(os.path.dirname(__file__), "models")
MODEL_PATH = os.path.join(MODEL_DIR, "model.joblib")
os.makedirs(MODEL_DIR, exist_ok=True)

# ── Seed for reproducibility ──────────────────────────────────────────────────
np.random.seed(42)
N_NORMAL = 2000   # synthetic normal samples
N_ANOMALY = 100   # synthetic anomaly samples — used for visual sanity-check only

# ── Generate synthetic baseline "normal" activity ─────────────────────────────
# Features: login_hour, session_duration, failed_attempts, is_new_device,
#           is_new_ip, is_weekend, is_off_hours

normal_data = np.column_stack([
    np.random.randint(8, 18, N_NORMAL),          # login_hour: 08–18 (business hours)
    np.random.exponential(1800, N_NORMAL),        # session_duration (avg 30 min)
    np.random.poisson(0.1, N_NORMAL),             # failed_attempts: mostly 0
    np.random.binomial(1, 0.05, N_NORMAL),        # is_new_device: rarely new
    np.random.binomial(1, 0.05, N_NORMAL),        # is_new_ip: rarely new
    np.random.binomial(1, 0.28, N_NORMAL),        # is_weekend: ~2/7 days
    np.zeros(N_NORMAL),                           # is_off_hours: always 0 for normals
])

# ── Anomalous data (just used for validation printout, not for training) ───────
anomaly_data = np.column_stack([
    np.random.choice([0, 1, 2, 3, 20, 21, 22, 23], N_ANOMALY),   # off-hours logins
    np.random.exponential(300, N_ANOMALY),                          # very short sessions
    np.random.randint(4, 10, N_ANOMALY),                           # many failed attempts
    np.random.binomial(1, 0.9, N_ANOMALY),                         # almost always new device
    np.random.binomial(1, 0.9, N_ANOMALY),                         # almost always new IP
    np.random.binomial(1, 0.5, N_ANOMALY),
    np.ones(N_ANOMALY),                                            # always off hours
])

# ── Train pipeline ─────────────────────────────────────────────────────────────
print("Training Isolation Forest model...")
pipeline = Pipeline([
    ("scaler", StandardScaler()),
    ("model", IsolationForest(
        n_estimators=200,
        max_samples=0.8,
        contamination=0.05,   # ~5% expected anomalies in production
        random_state=42
    ))
])

pipeline.fit(normal_data)

# ── Sanity check ───────────────────────────────────────────────────────────────
normal_scores = pipeline.decision_function(normal_data)
anomaly_scores = pipeline.decision_function(anomaly_data)

print(f"  Normal avg score  : {normal_scores.mean():.4f} (should be > 0)")
print(f"  Anomaly avg score : {anomaly_scores.mean():.4f} (should be < 0)")

# ── Save ───────────────────────────────────────────────────────────────────────
joblib.dump(pipeline, MODEL_PATH)
print(f"\nModel saved to: {MODEL_PATH}")
