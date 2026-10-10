// lib/ml.ts

/**
 * Client for communicating with the internal Python ML Microservice.
 * This service handles advanced heuristics, classification, clustering,
 * and predictions that are difficult or slow to do purely in Node/V8.
 */

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://localhost:8000";

interface ClassificationResult {
  label: "correct" | "partial" | "incorrect";
  confidence: number;
  similarity_score: number;
}

export async function classifyAnswerWithML(
  questionText: string,
  modelAnswer: string,
  studentAnswer: string
): Promise<ClassificationResult | null> {
  try {
    const res = await fetch(`${ML_SERVICE_URL}/api/ml/classify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question_text: questionText,
        model_answer: modelAnswer,
        student_answer: studentAnswer,
      }),
    });

    if (!res.ok) throw new Error("ML Service error on /classify");
    return await res.json();
  } catch (error) {
    console.warn("ML classification failed (is the Python service running?):", error);
    return null;
  }
}

interface StudentVectorInput {
  student_id: string;
  name: string;
  scores: number[];
  avg_time_taken: number;
}

interface ClusterResult {
  student_id: string;
  name: string;
  cluster_label: string;
  average_score: number;
}

export async function clusterStudentsWithML(
  students: StudentVectorInput[]
): Promise<ClusterResult[]> {
  try {
    const res = await fetch(`${ML_SERVICE_URL}/api/ml/cluster`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ students }),
    });

    if (!res.ok) throw new Error("ML Service error on /cluster");
    const data = await res.json();
    return data.clusters;
  } catch (error) {
    console.warn("ML clustering failed:", error);
    return [];
  }
}

export async function predictNextScoreWithML(
  studentId: string,
  historicalScores: number[]
): Promise<{ predicted_score: number; confidence: string; trend: string; slope?: number } | null> {
  try {
    const res = await fetch(`${ML_SERVICE_URL}/api/ml/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        student_id: studentId,
        historical_scores: historicalScores,
      }),
    });

    if (!res.ok) throw new Error("ML Service error on /predict");
    return await res.json();
  } catch (error) {
    console.warn("ML prediction failed:", error);
    return null;
  }
}

export async function getEnsembleScoreWithML(
  semanticSimilarity: number,
  keywordMatchRatio: number,
  ruleScore: number,
  maxMarks: number
): Promise<{ ensemble_final_score: number; normalized_prediction: number } | null> {
  try {
    const res = await fetch(`${ML_SERVICE_URL}/api/ml/ensemble-score`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        semantic_similarity: semanticSimilarity,
        keyword_match_ratio: keywordMatchRatio,
        rule_score: ruleScore,
        max_marks: maxMarks,
      }),
    });

    if (!res.ok) throw new Error("ML Service error on /ensemble-score");
    return await res.json();
  } catch (error) {
    console.warn("ML ensemble scoring failed:", error);
    return null;
  }
}