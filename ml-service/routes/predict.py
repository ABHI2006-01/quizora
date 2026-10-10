from fastapi import APIRouter
from pydantic import BaseModel
from typing import List
from sklearn.linear_model import LinearRegression
import numpy as np

router = APIRouter()

class PredictorRequest(BaseModel):
    student_id: str
    historical_scores: List[float] # ordered chronologically

@router.post("/predict")
def predict_next_score(request: PredictorRequest):
    scores = request.historical_scores

    if len(scores) == 0:
        return {"predicted_score": 0.0, "confidence": "low", "trend": "flat"}

    if len(scores) == 1:
        # Not enough data for a trend, just return the only score
        return {"predicted_score": float(scores[0]), "confidence": "low", "trend": "flat"}

    # We have >= 2 scores, perform Linear Regression over time
    # X = [0, 1, 2, ...] representing quiz sequence
    X = np.array(range(len(scores))).reshape(-1, 1)
    y = np.array(scores)

    model = LinearRegression()
    model.fit(X, y)

    # Predict the next quiz (index = len(scores))
    next_index = np.array([[len(scores)]])
    predicted_val = model.predict(next_index)[0]

    # Clamp the prediction between 0 and 100 assuming percentages
    clamped_val = max(0.0, min(100.0, float(predicted_val)))

    # Determine trend
    slope = model.coef_[0]
    if slope > 1.0:
        trend = "improving"
    elif slope < -1.0:
        trend = "declining"
    else:
        trend = "stable"

    # The more historical data we have, the higher the confidence
    confidence = "high" if len(scores) >= 5 else "medium"

    return {
        "predicted_score": clamped_val,
        "confidence": confidence,
        "trend": trend,
        "slope": float(slope)
    }