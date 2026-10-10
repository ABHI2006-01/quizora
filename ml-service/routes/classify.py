from fastapi import APIRouter
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer
import numpy as np

router = APIRouter()

# Initialize the embedding model
# We use a lightweight model suitable for quick similarity computations
model = SentenceTransformer('all-MiniLM-L6-v2')

class ClassifyRequest(BaseModel):
    question_text: str
    model_answer: str
    student_answer: str

class ClassifyResponse(BaseModel):
    label: str
    confidence: float
    similarity_score: float

@router.post("/classify", response_model=ClassifyResponse)
def classify_answer(request: ClassifyRequest):
    # Generate embeddings for both answers
    embeddings = model.encode([request.model_answer, request.student_answer])

    # Calculate cosine similarity
    similarity = np.dot(embeddings[0], embeddings[1]) / (np.linalg.norm(embeddings[0]) * np.linalg.norm(embeddings[1]))

    # Convert numpy float32 to native Python float
    sim_score = float(similarity)

    # Simple classification logic based on thresholding the embedding similarity
    if sim_score >= 0.75:
        label = "correct"
        confidence = sim_score
    elif sim_score >= 0.50:
        label = "partial"
        confidence = sim_score
    else:
        label = "incorrect"
        confidence = min(1.0, 1.0 - sim_score)

    return {
        "label": label,
        "confidence": confidence,
        "similarity_score": sim_score
    }