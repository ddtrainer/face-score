import type { AnalysisResult } from "./types";
import { runFaceScoreEngine } from "@/services/faceScoreEngine";

export async function analyzeFaceFrames(frames?: ImageData[]): Promise<AnalysisResult> {
  const result = await runFaceScoreEngine(frames ?? []);
  return result;
}
