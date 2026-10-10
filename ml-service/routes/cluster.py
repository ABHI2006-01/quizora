from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from sklearn.cluster import KMeans
import numpy as np

router = APIRouter()

class StudentVector(BaseModel):
    student_id: str
    name: str
    scores: List[float]  # Historical percentage scores across quizzes
    avg_time_taken: float # Time taken context

class ClusterRequest(BaseModel):
    students: List[StudentVector]

@router.post("/cluster")
def cluster_students(request: ClusterRequest):
    if len(request.students) < 2:
        # Not enough students to cluster meaningfully
        return {"clusters": [
            {
                "student_id": s.student_id,
                "name": s.name,
                "cluster_label": "Ungrouped (Not enough data)",
                "average_score": float(np.mean(s.scores)) if s.scores else 0.0
            } for s in request.students
        ]}

    # Construct the feature matrix X
    # We will use average score and average time taken as the 2D feature space
    X = []
    for s in request.students:
        avg_score = float(np.mean(s.scores)) if s.scores else 0.0
        X.append([avg_score, s.avg_time_taken])

    X_array = np.array(X)

    # We typically want 3 clusters: High Performers, Average, Needs Support
    # But if we have very few students, degrade to 2.
    n_clusters = min(3, len(request.students))

    # K-Means algorithm implementation
    kmeans = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
    labels = kmeans.fit_predict(X_array)

    # Map the cluster centroids to human readable generic names based on average score (feature 0)
    centers = kmeans.cluster_centers_
    sorted_cluster_indices = np.argsort(centers[:, 0]) # Sort ascending by score

    cluster_name_map = {}
    if n_clusters == 3:
        cluster_name_map[sorted_cluster_indices[0]] = "Needs Support"
        cluster_name_map[sorted_cluster_indices[1]] = "Average"
        cluster_name_map[sorted_cluster_indices[2]] = "High Performers"
    else:
        cluster_name_map[sorted_cluster_indices[0]] = "Needs Support"
        cluster_name_map[sorted_cluster_indices[1]] = "High Performers"

    result = []
    for i, s in enumerate(request.students):
        c_label = cluster_name_map[int(labels[i])]
        result.append({
            "student_id": s.student_id,
            "name": s.name,
            "cluster_label": c_label,
            "average_score": float(X_array[i][0])
        })

    return {"clusters": result}