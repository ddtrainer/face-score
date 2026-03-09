import type { AnalysisResult } from "./types";
import {
  analyzeFaceFrames as runEngine,
  type FaceFrameSignal,
} from "@/services/faceScoreEngine";

// ImageData(픽셀) → FaceFrameSignal(0~1 신호)로 변환합니다.
// 현재는 픽셀 기반 간이 추출입니다.
// [확장1] 여기에 MediaPipe 얼굴 랜드마크 결과를 연결하면 정확도가 크게 올라갑니다.
function extractSignalFromImageData(frame: ImageData): FaceFrameSignal {
  const { data, width, height } = frame;
  const total = width * height;

  let lumSum = 0;
  let lumSqSum = 0;
  let skinCount = 0;
  let edgeCount = 0;
  let sampleCount = 0;

  // 밝기, 피부톤, 엣지 분석 (16px 간격 샘플링)
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

  // 엣지 카운트 (6px 간격)
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

  // 밝기 품질 (너무 어둡거나 밝으면 낮음)
  const brightnessFactor = (avgLum > 40 && avgLum < 220) ? 1.0 : 0.5;
  // 대비 품질
  const contrastFactor = variance > 500 ? 1.0 : variance > 200 ? 0.7 : 0.4;

  // 신호 생성 (0~1 범위) — 동일 이미지에서 동일 결과를 보장하는 결정적 계산
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
// ScanPage에서 호출됩니다.
// ImageData[] 프레임을 받아서 FaceFrameSignal[]로 변환 후 엔진 실행.
export async function analyzeFaceFrames(frames?: ImageData[]): Promise<AnalysisResult> {
  // ImageData → FaceFrameSignal 변환
  const signals: FaceFrameSignal[] = (frames ?? []).map(extractSignalFromImageData);

  // 엔진 실행
  const engineResult = runEngine(signals);

  // 엔진 결과를 앱의 AnalysisResult 형태로 매핑
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
