from fastapi import APIRouter
from pydantic import BaseModel
import xgboost as xgb
import numpy as np

router = APIRouter()

# ---------------------------------------------------------
# Training a dummy XGBoost model on startup to act as the
# Ensemble mechanism. In a real production system, this model
# would be pre-trained on verified human-graded datasets
# and loaded from disk.
# ---------------------------------------------------------

# Generate dummy training data
# Features: [semantic_similarity (0-1), keyword_match_ratio (0-1), rule_score (0-1)]
# Target: Normalized student score (0-1)
X_train = np.array([
    [0.9, 0.8, 1.0],
    [0.8, 0.7, 0.9],
    [0.5, 0.4, 0.5],
    [0.95, 0.9, 1.0],
    [0.2, 0.1, 0.0],
    [0.6, 0.5, 0.8],
    [0.1, 0.0, 0.0],
    [0.75, 0.6, 0.7],
    [0.4, 0.3, 0.2],
    [1.0, 1.0, 1.0]
])
# Synthesizing realistic target scores
y_train = np.array([0.9, 0.8, 0.45, 0.95, 0.1, 0.65, 0.0, 0.7, 0.3, 1.0])

model = xgb.XGBRegressor(objective="reg:squarederror", n_estimators=50, random_state=42)
model.fit(X_train, y_train)


class EnsembleRequest(BaseModel):
    semantic_similarity: float   # 0 to 1
    keyword_match_ratio: float   # 0 to 1
    rule_score: float            # 0 to 1
    max_marks: float

@router.post("/ensemble-score")
def ensemble_predict(request: EnsembleRequest):
    # Construct feature array for inference
    X_infer = np.array([[
        request.semantic_similarity,
        request.keyword_match_ratio,
        request.rule_score
    ]])

    # Inference
    raw_prediction = model.predict(X_infer)[0]

    # Convert the normalized prediction (0-1) to actual marks based on max_marks
    final_score = raw_prediction * request.max_marks

    # Clamp the boundaries
    final_score = max(0.0, min(float(request.max_marks), float(final_score)))

    # Round to 1 decimal place for neatness
    final_score = round(final_score, 1)

    return {
        "ensemble_final_score": final_score,
        "normalized_prediction": float(raw_prediction)
    }