"""
POST /predict — runs anomaly detection on a single activity event.
POST /retrain — triggers an async retraining job (admin only in MVP).
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional

from app.preprocessing import extract_features, normalize_anomaly_score
from app.model_loader import get_model

router = APIRouter()


# ── Request Schema ─────────────────────────────────────────────────────────────

class ActivityPredictRequest(BaseModel):
    user_id: str = Field(..., description="User ID for logging context")
    login_hour: int = Field(..., ge=0, le=23, description="Hour of the login (0-23)")
    session_duration: float = Field(0.0, ge=0, description="Session duration in seconds")
    failed_attempts: int = Field(0, ge=0, description="Recent failed login attempts")
    is_new_device: bool = Field(False, description="True if this is an unrecognized device")
    is_new_ip: bool = Field(False, description="True if this is an unrecognized IP")
    is_weekend: bool = Field(False, description="True if today is Saturday or Sunday")
    is_off_hours: Optional[bool] = Field(None, description="Override for off-hours flag")


# ── Response Schema ────────────────────────────────────────────────────────────

class PredictResponse(BaseModel):
    user_id: str
    anomaly_score: float = Field(..., description="0.0 = normal, 1.0 = highly anomalous")
    is_anomaly: bool = Field(..., description="True if score exceeds 0.5 threshold")
    raw_score: float = Field(..., description="Raw IsolationForest decision_function value")


# ── Endpoint ───────────────────────────────────────────────────────────────────

@router.post("", response_model=PredictResponse)
def predict(request: ActivityPredictRequest):
    """
    Run anomaly detection for a single user activity event.
    Returns an anomaly_score between 0.0 (normal) and 1.0 (anomalous).
    """
    try:
        pipeline = get_model()
    except FileNotFoundError as e:
        raise HTTPException(status_code=503, detail=str(e))

    features = extract_features(request.dict())

    # IsolationForest decision_function: negative = anomalous, positive = normal
    raw_score = float(pipeline.decision_function(features)[0])
    anomaly_score = normalize_anomaly_score(raw_score)

    return PredictResponse(
        user_id=request.user_id,
        anomaly_score=anomaly_score,
        is_anomaly=anomaly_score >= 0.5,
        raw_score=raw_score,
    )


@router.post("/retrain")
def retrain():
    """
    Trigger a model retraining job.
    In production this would call a background task; here it returns a stub.
    """
    # TODO Phase 6: Implement actual retraining with feedback-labeled data
    return {"message": "Retraining scheduled. This is a stub for MVP."}
