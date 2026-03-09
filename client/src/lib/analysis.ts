import type { AnalysisResult } from "./types";
import {
  analyzeFaceFrames as runEngine,
  type FaceFrameSignal,
} from "@/services/faceScoreEngine";

// ImageData(픽셀) → FaceFrameSignal(0~1 신호)로 변환합니다.
// [확장1] 여기에 MediaPipe 얼굴 랜드마크 결과를 연결하면 정확도가 크게 올라갑니다.
function extractSignalFromImageData(frame: ImageData): FaceFrameSignal {
  const { data, width, height } = frame;

  let lumSum = 0;
  let lumSqSum = 0;
  let skinCount = 0;
  let edgeCount = 0;
  let sampleCount = 0;

  for (let i = 0; i < data.length; i += 16) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;
    lumSum += lum;
    lumSqSum += lum * lum;
    sampleCount++;

    if (r > 80 && r > g && r > b && (r - g) > 10 && b < 200) {
      skinCount++;
    }
  }

  const avgLum = sampleCount > 0 ? lumSum / sampleCount : 128;
  const variance = sampleCount > 0 ? (lumSqSum / sampleCount) - (avgLum * avgLum) : 500;
  const skinRatio = sampleCount > 0 ? skinCount / sampleCount : 0.3;

  for (let y = 1; y < height - 1; y += 6) {
    for (let x = 1; x < width - 1; x += 6) {
      const idx = (y * width + x) * 4;
      const idxR = idx + 4;
      const idxD = idx + width * 4;
      if (idxR + 2 < data.length && idxD + 2 < data.length) {
        const curr = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
        const right = (data[idxR] + data[idxR + 1] + data[idxR + 2]) / 3;
        const down = (data[idxD] + data[idxD + 1] + data[idxD + 2]) / 3;
        if (Math.abs(curr - right) > 20 || Math.abs(curr - down) > 20) edgeCount++;
      }
    }
  }

  const edgeSamples = Math.ceil(((height - 2) / 6)) * Math.ceil(((width - 2) / 6));
  const edgeRatio = edgeSamples > 0 ? Math.min(edgeCount / edgeSamples / 0.3, 1.0) : 0.5;

  const brightnessFactor = (avgLum > 40 && avgLum < 220) ? 1.0 : 0.5;
  const contrastFactor = variance > 500 ? 1.0 : variance > 200 ? 0.7 : 0.4;

  const captureQuality = clamp01(brightnessFactor * 0.3 + contrastFactor * 0.3 + edgeRatio * 0.4);
  const mouthSoftness = clamp01(0.3 + skinRatio * 0.5 + captureQuality * 0.2);
  const eyeTension = clamp01(0.5 - captureQuality * 0.25);
  const browTension = clamp01(0.45 - captureQuality * 0.2);
  const gazeStability = clamp01(0.4 + captureQuality * 0.3);
  const headStability = clamp01(0.4 + captureQuality * 0.3);
  const expressionConsistency = clamp01(0.45 + captureQuality * 0.25);
  const naturalSmileIndex = clamp01(0.3 + mouthSoftness * 0.35 + (1 - eyeTension) * 0.15);

  return {
    mouthSoftness,
    eyeTension,
    browTension,
    gazeStability,
    headStability,
    expressionConsistency,
    naturalSmileIndex,
    captureQuality,
  };
}

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, isNaN(v) ? 0.5 : v));
}

// 메인 분석 함수
// 반드시 얼굴 검증(validateFaceInImageData/validateFaceInFile)을 통과한 후에만 호출하세요.
// frames가 비어 있으면 에러를 발생시킵니다 — 얼굴 없이는 분석할 수 없습니다.
export async function analyzeFaceFrames(frames: ImageData[]): Promise<AnalysisResult> {
  if (frames.length === 0) {
    throw new Error("분석할 프레임이 없습니다. 얼굴 검증을 먼저 통과해야 합니다.");
  }

  const signals: FaceFrameSignal[] = frames.map(extractSignalFromImageData);

  const engineResult = runEngine(signals);

  return {
    friendliness: engineResult.scores.friendliness,
    vitality: engineResult.scores.vitality,
    confidence: engineResult.scores.confidence,
    stability: engineResult.scores.stability,
    totalScore: engineResult.scores.totalScore,
    summary: engineResult.coaching.summary,
    tips: engineResult.coaching.tips,
    mission: engineResult.coaching.mission,
    encouragement: engineResult.coaching.encouragement,
    qualityMessage: engineResult.qualityMessage,
  };
}
