"""
Preprocessing module for the AMS ML service.
Handles feature extraction and normalization for anomaly scoring.
"""
import numpy as np
from typing import Dict, Any


# Define the ordered feature columns the model was trained on
FEATURE_COLUMNS = [
    "login_hour",          # 0–23, integer
    "session_duration",    # seconds, float — use 0 if not available yet
    "failed_attempts",     # integer count of recent failed logins
    "is_new_device",       # 1 if device hasn't been seen before, else 0
    "is_new_ip",           # 1 if IP address hasn't been seen before, else 0
    "is_weekend",          # 1 if login occurred on weekend, else 0
    "is_off_hours",        # 1 if login time is outside 08:00–18:00, else 0
]


def extract_features(data: Dict[str, Any]) -> np.ndarray:
    """
    Transform raw API input dict into a fixed-length numpy feature vector.
    Expects keys matching the ActivityPredictRequest schema.
    """
    login_hour = int(data.get("login_hour", 12))
    session_duration = float(data.get("session_duration", 0))
    failed_attempts = int(data.get("failed_attempts", 0))
    is_new_device = int(bool(data.get("is_new_device", False)))
    is_new_ip = int(bool(data.get("is_new_ip", False)))
    is_weekend = int(bool(data.get("is_weekend", False)))
    # Derive is_off_hours from login_hour if not explicitly provided
    is_off_hours = int(data.get("is_off_hours", login_hour < 8 or login_hour > 18))

    return np.array([[
        login_hour,
        session_duration,
        failed_attempts,
        is_new_device,
        is_new_ip,
        is_weekend,
        is_off_hours,
    ]], dtype=float)


def normalize_anomaly_score(raw_score: float) -> float:
    """
    Convert IsolationForest's decision_function score to a 0.0–1.0 scale.
    Raw scores are typically in the range [-0.5, 0.5]:
      - Negative → more anomalous  
      - Positive → more normal
    We invert and scale to [0, 1]: 0 = normal, 1 = highly anomalous.
    """
    # Clamp to reasonable bounds first
    clamped = max(-0.6, min(0.6, raw_score))
    # Invert (higher raw → lower anomaly) and normalize
    normalized = (0.6 - clamped) / 1.2
    return float(f"{normalized:.4f}")
