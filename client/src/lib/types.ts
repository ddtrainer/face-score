export interface FaceRecord {
  id: string;
  date: string;
  totalScore: number;
  friendliness: number;
  vitality: number;
  confidence: number;
  stability: number;
  summary: string;
  tips: string[];
  mission: string;
}

export interface AnalysisResult {
  friendliness: number;
  vitality: number;
  confidence: number;
  stability: number;
  totalScore: number;
  summary: string;
  tips: string[];
  mission: string;
}
