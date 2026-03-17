"""
Model loader — loads the trained IsolationForest pipeline once at startup
and provides it as a singleton to all request handlers.
"""
import os
import joblib
from pathlib import Path

MODEL_PATH = Path(__file__).parent.parent / "models" / "model.joblib"

_pipeline = None


def load_model():
    """Load the model from disk and cache it in memory."""
    global _pipeline
    if _pipeline is None:
        if not MODEL_PATH.exists():
            raise FileNotFoundError(
                f"Model not found at {MODEL_PATH}. "
                "Please run `python train.py` first."
            )
        _pipeline = joblib.load(MODEL_PATH)
    return _pipeline


def get_model():
    """Return the cached model instance."""
    return load_model()
