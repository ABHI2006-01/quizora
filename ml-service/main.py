from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routes import classify, cluster, predict, ensemble

app = FastAPI(
    title="Quizora ML Service",
    version="1.0",
    description="Machine learning microservice for Quizora"
)

# Allow requests from the Next.js app
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict to frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(classify.router, prefix="/api/ml", tags=["Classification"])
app.include_router(cluster.router, prefix="/api/ml", tags=["Clustering"])
app.include_router(predict.router, prefix="/api/ml", tags=["Prediction"])
app.include_router(ensemble.router, prefix="/api/ml", tags=["Ensemble Scoring"])

@app.get("/health")
def health_check():
    return {"status": "healthy"}