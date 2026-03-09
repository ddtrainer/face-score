// ============================================================
// Face Score 인상 분석 엔진
// ============================================================
// 이 파일은 Face Score 앱의 핵심 분석 엔진입니다.
//
// 역할:
//   3초 셀피 스캔에서 얻은 프레임 신호를 분석하여
//   인상 점수(4개 항목)와 맞춤 코칭을 생성합니다.
//
// 전문가 가중치:
//   1. 인상 및 표정 전문가 — 60%
//   2. 비언어 커뮤니케이션 심리학자 — 30%
//   3. 뇌과학/신경생리학 코칭 — 10%
//
// 코칭 원칙:
//   - 외모 평가 금지
//   - 비하/비판/진단 표현 금지
//   - "더 좋아질 수 있다" 방향의 긍정적 피드백
//   - 짧고 실천 가능한 행동 팁 중심
//
// 확장 포인트:
//   [확장1] extractSignalsFromImageData() → 여기에 MediaPipe 얼굴 랜드마크 결과를 연결 가능
//   [확장2] aggregateFrameSignals() → 여기에 실제 3초 비디오 프레임 분석 결과를 연결 가능
//   [확장3] generateSummary/generateTips → 여기에 LLM 기반 고급 코칭 생성 추가 가능
// ============================================================


// ============================================================
// 1. 타입 정의
// ============================================================

// 3초 스캔 중 한 프레임에서 추출한 신호값 (범위: 0~1)
export interface FaceFrameSignal {
  mouthSoftness: number;        // 입 주변이 얼마나 부드러운가 (높을수록 좋음)
  eyeTension: number;           // 눈가 긴장 정도 (높을수록 긴장 → 점수 계산 시 반전 필요)
  browTension: number;          // 미간/눈썹 긴장 정도 (높을수록 긴장 → 점수 계산 시 반전 필요)
  gazeStability: number;        // 시선이 얼마나 안정적인가 (높을수록 좋음)
  headStability: number;        // 고개 흔들림 없이 안정적인가 (높을수록 좋음)
  expressionConsistency: number; // 표정이 과하게 흔들리지 않는가 (높을수록 좋음)
  naturalSmileIndex: number;    // 자연스럽고 편안한 미소인가 (높을수록 좋음)
  captureQuality: number;       // 조명/정면/선명도 등 전반적 촬영 품질 (높을수록 좋음)
}

// 여러 프레임을 합산한 평균 신호 (범위: 0~1)
export interface AggregatedFaceSignals {
  mouthSoftness: number;
  eyeTension: number;
  browTension: number;
  gazeStability: number;
  headStability: number;
  expressionConsistency: number;
  naturalSmileIndex: number;
  captureQuality: number;
}

// 사용자에게 보여줄 점수 (범위: 0~100)
export interface ImpressionScores {
  friendliness: number;  // 친근함
  vitality: number;      // 생기
  confidence: number;    // 자신감
  stability: number;     // 안정감
  totalScore: number;    // 종합 점수
}

// 코칭 결과
export interface CoachingResult {
  summary: string;        // 오늘의 인상 총평 (1문장)
  tips: string[];         // 더 좋은 인상을 위한 팁 (항상 3개)
  mission: string;        // 내일의 1일 미션 (항상 1개)
  encouragement: string;  // 동기부여 문구 (항상 1개)
}

// 최종 분석 결과 (엔진이 반환하는 전체 데이터)
export interface FaceScoreAnalysisResult {
  signals: AggregatedFaceSignals;  // 집계된 신호값
  scores: ImpressionScores;        // 인상 점수
  coaching: CoachingResult;        // 코칭 결과
  qualityMessage: string;          // 촬영 품질 안내 메시지
}


// ============================================================
// 2. 헬퍼 함수
// ============================================================

// 값을 min~max 범위로 제한합니다
function clamp(value: number, min: number, max: number): number {
  if (isNaN(value)) return min;
  return Math.max(min, Math.min(max, value));
}

// 숫자 배열의 평균을 계산합니다
function average(values: number[]): number {
  if (values.length === 0) return 0;
  const sum = values.reduce((a, b) => a + b, 0);
  return sum / values.length;
}

// 긴장도처럼 "낮을수록 좋은" 신호를 반전합니다
// 예: eyeTension 0.8(긴장 높음) → 0.2(편안함 낮음)
function invertSignal(value: number): number {
  return clamp(1 - value, 0, 1);
}

// 0~1 범위의 신호값을 0~100 범위의 점수로 변환합니다
function toScore(value: number): number {
  return Math.round(clamp(value, 0, 1) * 100);
}

// 배열에서 랜덤으로 하나를 선택합니다
function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}


// ============================================================
// 3. 프레임 신호 집계
// ============================================================

// 여러 프레임의 신호를 평균으로 합산합니다.
// 극단값(가장 높은 값, 가장 낮은 값)을 제거하여 안정적인 결과를 만듭니다.
// frames가 비어 있으면 안전한 기본값을 반환합니다.
export function aggregateFrameSignals(frames: FaceFrameSignal[]): AggregatedFaceSignals {
  // 입력 신호를 0~1 범위로 정규화
  const normalized = frames.map((f) => ({
    mouthSoftness: clamp(f.mouthSoftness, 0, 1),
    eyeTension: clamp(f.eyeTension, 0, 1),
    browTension: clamp(f.browTension, 0, 1),
    gazeStability: clamp(f.gazeStability, 0, 1),
    headStability: clamp(f.headStability, 0, 1),
    expressionConsistency: clamp(f.expressionConsistency, 0, 1),
    naturalSmileIndex: clamp(f.naturalSmileIndex, 0, 1),
    captureQuality: clamp(f.captureQuality, 0, 1),
  }));

  // 프레임이 없으면 에러 — 얼굴 검증 없이 분석할 수 없습니다
  if (normalized.length === 0) {
    throw new Error("분석할 프레임이 없습니다. 얼굴 검증을 먼저 통과해야 합니다.");
  }

  // 프레임이 1~2개면 극단값 제거 없이 단순 평균
  if (normalized.length <= 2) {
    return {
      mouthSoftness: average(normalized.map((f) => f.mouthSoftness)),
      eyeTension: average(normalized.map((f) => f.eyeTension)),
      browTension: average(normalized.map((f) => f.browTension)),
      gazeStability: average(normalized.map((f) => f.gazeStability)),
      headStability: average(normalized.map((f) => f.headStability)),
      expressionConsistency: average(normalized.map((f) => f.expressionConsistency)),
      naturalSmileIndex: average(normalized.map((f) => f.naturalSmileIndex)),
      captureQuality: average(normalized.map((f) => f.captureQuality)),
    };
  }

  // 3개 이상이면 각 신호별로 최솟값과 최댓값을 제거한 뒤 평균 계산
  function trimmedAverage(values: number[]): number {
    const sorted = [...values].sort((a, b) => a - b);
    const trimmed = sorted.slice(1, -1); // 최솟값 1개, 최댓값 1개 제거
    return average(trimmed.length > 0 ? trimmed : sorted);
  }

  return {
    mouthSoftness: trimmedAverage(normalized.map((f) => f.mouthSoftness)),
    eyeTension: trimmedAverage(normalized.map((f) => f.eyeTension)),
    browTension: trimmedAverage(normalized.map((f) => f.browTension)),
    gazeStability: trimmedAverage(normalized.map((f) => f.gazeStability)),
    headStability: trimmedAverage(normalized.map((f) => f.headStability)),
    expressionConsistency: trimmedAverage(normalized.map((f) => f.expressionConsistency)),
    naturalSmileIndex: trimmedAverage(normalized.map((f) => f.naturalSmileIndex)),
    captureQuality: trimmedAverage(normalized.map((f) => f.captureQuality)),
  };
}


// ============================================================
// 4. 전문가 영역별 점수 계산
// ============================================================

// [인상 및 표정 전문가 60%]
// 입 주변 부드러움, 눈가 긴장 완화, 자연 미소, 표정 일관성 중심
function calculateExpressionExpertScore(signals: AggregatedFaceSignals): number {
  const score =
    signals.mouthSoftness * 0.30 +
    invertSignal(signals.eyeTension) * 0.25 +
    signals.naturalSmileIndex * 0.30 +
    signals.expressionConsistency * 0.15;
  return clamp(score, 0, 1);
}

// [비언어 커뮤니케이션 심리학자 30%]
// 친근함, 거리감 감소, 안정된 시선, 정면 응시 인상 중심
function calculateNonverbalPsychologyScore(signals: AggregatedFaceSignals): number {
  const score =
    signals.gazeStability * 0.30 +
    signals.headStability * 0.25 +
    invertSignal(signals.browTension) * 0.25 +
    signals.expressionConsistency * 0.20;
  return clamp(score, 0, 1);
}

// [뇌과학/신경생리학 코칭 10%]
// 긴장 완화, 안정감, 반복 가능한 표정 습관 형성 가능성 중심
function calculateNeuroCoachingScore(signals: AggregatedFaceSignals): number {
  const score =
    invertSignal(signals.eyeTension) * 0.30 +
    invertSignal(signals.browTension) * 0.25 +
    signals.expressionConsistency * 0.25 +
    signals.headStability * 0.20;
  return clamp(score, 0, 1);
}


// ============================================================
// 5. 인상 점수 계산
// ============================================================

// 4개 세부 점수 + 종합 점수를 계산합니다.
// 종합 점수는 3개 전문가 영역의 가중 평균입니다.
export function calculateImpressionScores(signals: AggregatedFaceSignals): ImpressionScores {
  // --- 세부 점수 (각각 0~100) ---

  // 친근함: 입 부드러움 + 자연 미소 + 눈가 편안함 + 시선 안정
  const friendlinessRaw =
    signals.mouthSoftness * 0.30 +
    signals.naturalSmileIndex * 0.30 +
    invertSignal(signals.eyeTension) * 0.25 +
    signals.gazeStability * 0.15;
  const friendliness = clamp(toScore(friendlinessRaw), 0, 100);

  // 생기: 눈가 편안함 + 미간 편안함 + 자연 미소 + 촬영 품질
  const vitalityRaw =
    invertSignal(signals.eyeTension) * 0.25 +
    invertSignal(signals.browTension) * 0.25 +
    signals.naturalSmileIndex * 0.30 +
    signals.captureQuality * 0.20;
  const vitality = clamp(toScore(vitalityRaw), 0, 100);

  // 자신감: 시선 안정 + 고개 안정 + 표정 일관성
  const confidenceRaw =
    signals.gazeStability * 0.35 +
    signals.headStability * 0.30 +
    signals.expressionConsistency * 0.35;
  const confidence = clamp(toScore(confidenceRaw), 0, 100);

  // 안정감: 시선 안정 + 고개 안정 + 표정 일관성 + 미간 편안함
  const stabilityRaw =
    signals.gazeStability * 0.25 +
    signals.headStability * 0.30 +
    signals.expressionConsistency * 0.25 +
    invertSignal(signals.browTension) * 0.20;
  const stability = clamp(toScore(stabilityRaw), 0, 100);

  // --- 종합 점수 (전문가 가중 평균) ---
  const expressionExpert = calculateExpressionExpertScore(signals);   // 60%
  const nonverbalPsych = calculateNonverbalPsychologyScore(signals);  // 30%
  const neuroCoaching = calculateNeuroCoachingScore(signals);          // 10%

  const totalScoreRaw =
    expressionExpert * 0.60 +
    nonverbalPsych * 0.30 +
    neuroCoaching * 0.10;
  const totalScore = clamp(toScore(totalScoreRaw), 0, 100);

  return { friendliness, vitality, confidence, stability, totalScore };
}


// ============================================================
// 6. 코칭 생성 함수들
// ============================================================

// --- 가장 약한/강한 항목 찾기 ---
type Trait = "friendliness" | "vitality" | "confidence" | "stability";

function findWeakest(scores: ImpressionScores): Trait {
  const { friendliness: f, vitality: v, confidence: c, stability: s } = scores;
  const min = Math.min(f, v, c, s);
  if (f === min) return "friendliness";
  if (v === min) return "vitality";
  if (c === min) return "confidence";
  return "stability";
}

function findStrongest(scores: ImpressionScores): Trait {
  const { friendliness: f, vitality: v, confidence: c, stability: s } = scores;
  const max = Math.max(f, v, c, s);
  if (f === max) return "friendliness";
  if (v === max) return "vitality";
  if (c === max) return "confidence";
  return "stability";
}

// --- 6-1. 총평 생성 ---
// 부드럽고 따뜻한 톤으로 오늘의 인상을 1문장으로 요약합니다.
// 외모 평가 금지, 코칭형 표현 사용.
// [확장3] 여기에 LLM 기반 고급 코칭 생성 추가 가능
export function generateSummary(scores: ImpressionScores, signals: AggregatedFaceSignals): string {
  const { totalScore } = scores;
  const strongest = findStrongest(scores);
  const weakest = findWeakest(scores);

  if (totalScore >= 90) {
    return pick([
      "오늘 표정에서 따뜻함이 가득 느껴져요. 주변 사람들에게 좋은 에너지를 전할 수 있는 하루예요!",
      "친근함, 생기, 자신감, 안정감이 모두 조화롭게 빛나고 있어요. 이 느낌 그대로 하루를 보내 보세요!",
      "지금 표정이 정말 멋져요! 편안하면서도 밝은 인상이 자연스럽게 전해지고 있어요.",
    ]);
  }

  if (totalScore >= 80) {
    const strongLabels: Record<Trait, string> = {
      friendliness: "부드럽고 다가가기 편한 느낌",
      vitality: "활기차고 생동감 넘치는 느낌",
      confidence: "당당하고 신뢰감을 주는 느낌",
      stability: "차분하고 안정감 있는 느낌",
    };
    return pick([
      `오늘은 ${strongLabels[strongest]}이 특히 돋보여요. 작은 표정 변화만으로도 더 빛날 수 있어요!`,
      "전체적으로 안정감 있는 좋은 인상이에요. 자연스러운 미소가 잘 어울리는 하루네요.",
      "오늘의 인상에서 따뜻함과 여유가 느껴져요. 이 분위기를 유지해 보세요!",
    ]);
  }

  if (totalScore >= 70) {
    const weakLabels: Record<Trait, string[]> = {
      friendliness: [
        "차분하고 진중한 인상이에요. 살짝 미소를 더하면 한결 부드러운 느낌을 줄 수 있어요.",
        "신뢰감 있는 표정이에요. 눈가를 조금만 풀어주면 더 편안한 인상이 될 거예요.",
      ],
      vitality: [
        "편안하고 안정적인 인상이에요. 가벼운 스트레칭이나 산책으로 생기를 더해보는 건 어떨까요?",
        "차분한 매력이 있는 인상이에요. 약간의 생기만 더해지면 훨씬 좋아질 수 있어요.",
      ],
      confidence: [
        "친근하고 따뜻한 인상이에요. 시선을 살짝 높이면 더 당당한 느낌을 줄 수 있어요.",
        "부드러운 분위기가 좋아요. 바른 자세와 함께하면 인상이 한층 더 좋아질 거예요.",
      ],
      stability: [
        "밝고 활기찬 인상이에요. 호흡을 가다듬으면 더 안정감 있는 느낌을 줄 수 있어요.",
        "에너지가 느껴지는 표정이에요. 살짝 여유를 더하면 균형 잡힌 인상이 될 거예요.",
      ],
    };
    return pick(weakLabels[weakest]);
  }

  if (totalScore >= 60) {
    if (signals.eyeTension > 0.5) {
      return "눈 주위 긴장이 조금 느껴져요. 심호흡 한 번 하고 표정을 풀어보면 분명 달라질 거예요!";
    }
    return pick([
      "지금도 좋지만, 작은 습관 하나로 인상이 크게 달라질 수 있어요. 오늘의 코칭 팁을 확인해 보세요!",
      "누구나 컨디션에 따라 달라져요. 아래 팁을 참고하면 내일은 더 좋은 인상을 만들 수 있어요.",
    ]);
  }

  return pick([
    "오늘은 좀 지친 하루인가요? 괜찮아요, 충분히 쉬고 내일 다시 도전해 보세요!",
    "표정에 피로감이 살짝 묻어나지만, 작은 변화로 놀라운 차이를 만들 수 있어요. 코칭 팁을 참고해 보세요!",
    "오늘의 점수는 시작일 뿐이에요. 매일 조금씩 연습하면 눈에 띄는 변화가 찾아올 거예요!",
  ]);
}

// --- 6-2. 코칭 팁 생성 ---
// 행동 단위의 실천 가능한 팁을 정확히 3개 생성합니다.
// [확장3] 여기에 LLM 기반 고급 코칭 생성 추가 가능
export function generateTips(scores: ImpressionScores, signals: AggregatedFaceSignals): string[] {
  const tips: string[] = [];

  // 신호 기반 맞춤 팁 추가
  if (signals.mouthSoftness < 0.5) {
    tips.push("입꼬리를 살짝 올리는 연습을 해보세요. 거울 앞에서 5초만 유지하면 자연스러워져요.");
  }
  if (signals.eyeTension > 0.5) {
    tips.push("눈 주변 근육을 가볍게 풀어보세요. 따뜻한 수건을 올려놓으면 긴장이 풀려요.");
  }
  if (signals.browTension > 0.45) {
    tips.push("이마와 눈썹 사이 긴장을 풀어보세요. 손가락으로 가볍게 마사지하면 효과적이에요.");
  }
  if (signals.gazeStability < 0.55) {
    tips.push("정면을 바라보며 턱을 살짝 당기면 안정감 있는 인상을 줄 수 있어요.");
  }
  if (signals.headStability < 0.5) {
    tips.push("스캔할 때 고개를 고정하고 촬영하면 더 정확한 분석이 가능해요.");
  }
  if (signals.naturalSmileIndex < 0.5) {
    tips.push("좋아하는 음악을 들으며 표정을 풀어보세요. 편안한 마음이 얼굴에 그대로 드러나요.");
  }
  if (signals.expressionConsistency < 0.5) {
    tips.push("촬영 전 심호흡을 3회 해보세요. 마음이 안정되면 표정도 자연스러워져요.");
  }

  // 점수 기반 맞춤 팁 추가
  if (scores.friendliness < 70) {
    tips.push("하루에 세 번, 거울을 보며 가볍게 미소 짓는 연습을 해보세요. 2주면 자연스러워져요.");
  }
  if (scores.vitality < 70) {
    tips.push("충분한 수면이 최고의 인상 관리예요. 오늘은 30분 일찍 잠자리에 들어보세요.");
  }
  if (scores.confidence < 70) {
    tips.push("매일 아침 거울 앞에서 \"오늘 하루도 괜찮을 거야\"라고 말해 보세요.");
  }
  if (scores.stability < 70) {
    tips.push("명상이나 호흡 운동을 해보세요. 내면의 안정감이 표정에 그대로 나타나요.");
  }

  // 점수가 높을 때 칭찬 팁
  if (scores.totalScore >= 85) {
    tips.push("지금의 따뜻한 표정을 유지하는 게 최고의 인상 관리예요!");
  }
  if (scores.friendliness >= 85) {
    tips.push("지금의 다가가기 편한 인상이 정말 좋아요. 이 느낌 그대로 유지해 보세요!");
  }

  // 항상 3개를 보장하기 위한 범용 팁 풀
  const fallbackTips = [
    "거울을 볼 때 가볍게 미소 짓는 습관을 들이면 표정 근육이 자연스러워져요.",
    "충분한 수면이 최고의 인상 관리예요. 오늘은 일찍 쉬어 보세요!",
    "물을 충분히 마시면 피부톤이 밝아지고 인상도 좋아져요.",
    "자세를 바로 하면 표정도 자연스럽게 밝아져요. 어깨를 펴 보세요!",
    "좋아하는 음악을 들으며 표정을 풀어보세요. 편안한 마음이 얼굴에 드러나요.",
    "표정 근육은 연습할수록 부드러워져요. 매일 1분씩 표정 스트레칭을 해보세요!",
    "좋은 인상은 타고나는 게 아니에요. 작은 습관이 쌓이면 빛나는 인상이 돼요.",
  ];

  // 부족하면 범용 풀에서 채움
  let fallbackIdx = 0;
  while (tips.length < 3 && fallbackIdx < fallbackTips.length) {
    const candidate = fallbackTips[fallbackIdx];
    if (!tips.includes(candidate)) {
      tips.push(candidate);
    }
    fallbackIdx++;
  }

  // 셔플 후 정확히 3개만 반환
  const shuffled = [...tips].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 3);
}

// --- 6-3. 내일의 미션 생성 ---
// 매일 다시 스캔하고 싶게 만드는 실천 가능한 1일 미션 1개를 반환합니다.
export function generateMission(scores: ImpressionScores): string {
  const weakest = findWeakest(scores);

  if (scores.totalScore >= 85) {
    return pick([
      "내일도 오늘처럼! 거울 앞에서 좋아하는 표정을 3번 연습해 보세요.",
      "오늘의 좋은 인상을 기억하며, 하루 3번 의식적으로 미소 지어 보세요.",
      "좋은 인상을 유지하려면 숙면이 중요해요. 오늘은 평소보다 30분 일찍 잠들어 보세요.",
    ]);
  }

  const missions: Record<Trait, string[]> = {
    friendliness: [
      "내일 미션: 아침에 일어나서 거울 보며 입꼬리를 올린 상태로 10초 유지하기",
      "내일 미션: 좋아하는 노래를 들으며 거울 앞에서 자연스러운 미소 3번 연습하기",
      "내일 미션: 눈 주변을 손가락으로 부드럽게 원을 그리며 1분간 마사지하기",
    ],
    vitality: [
      "내일 미션: 아침에 간단한 스트레칭 5분 후 셀피 스캔해 보세요. 차이가 보일 거예요!",
      "내일 미션: 물 한 잔 마시고 가볍게 산책 후 셀피 스캔으로 변화를 확인해 보세요.",
      "내일 미션: 밝은 자연광 아래에서 셀피 스캔하기. 조명이 생기를 더해줘요!",
    ],
    confidence: [
      "내일 미션: 거울을 보며 정면 시선으로 5초 유지하는 연습 3회 하기",
      "내일 미션: 바른 자세로 어깨를 펴고 턱을 살짝 당긴 상태에서 셀피 스캔하기",
      "내일 미션: 거울 앞에서 \"나는 괜찮아\"를 3번 말한 후 셀피 스캔해 보세요.",
    ],
    stability: [
      "내일 미션: 스캔 전에 심호흡 3회 후 카메라를 고정하고 촬영해 보세요.",
      "내일 미션: 잠들기 전 5분 명상으로 마음을 정리한 뒤, 내일 아침 스캔해 보세요.",
      "내일 미션: 촬영 전 눈을 감고 5초간 깊은 호흡 후 편안한 표정으로 스캔하기",
    ],
  };

  return pick(missions[weakest]);
}

// --- 6-4. 동기부여 문구 생성 ---
// 사용자가 매일 다시 돌아오고 싶게 만드는 따뜻한 문구를 반환합니다.
export function generateEncouragement(scores: ImpressionScores): string {
  const { totalScore } = scores;

  if (totalScore >= 85) {
    return pick([
      "오늘도 멋진 하루를 만들어가고 있어요! 내일은 더 빛나는 인상을 기대해 봐요. ✨",
      "꾸준히 관리하는 당신이 정말 멋져요. 내일도 함께해요!",
      "지금 이 느낌을 기억해 두세요. 매일 더 좋아지고 있어요!",
    ]);
  }

  if (totalScore >= 70) {
    return pick([
      "조금씩 변화하고 있어요. 내일의 나는 오늘보다 더 빛날 거예요!",
      "매일 1분씩 연습하면 놀라운 변화가 찾아와요. 함께 해봐요!",
      "좋은 인상은 하루아침에 만들어지지 않아요. 꾸준함이 답이에요!",
      "오늘의 기록이 내일의 성장이 돼요. 내일 다시 만나요!",
    ]);
  }

  return pick([
    "누구나 시작이 있어요. 오늘의 기록이 내일의 변화를 만들어요!",
    "지금 이 순간부터 변할 수 있어요. 작은 한 걸음이 큰 차이를 만들어요.",
    "오늘은 쉬어가도 괜찮아요. 내일 다시 도전하면 돼요!",
    "포기하지 않는 것 자체가 멋진 거예요. 내일도 함께해요!",
  ]);
}


// ============================================================
// 7. 품질 메시지 생성
// ============================================================

// captureQuality 값에 따라 촬영 품질 안내 메시지를 생성합니다.
function generateQualityMessage(signals: AggregatedFaceSignals): string {
  const q = signals.captureQuality;

  if (q >= 0.8) {
    return "분석 품질이 안정적입니다.";
  }
  if (q >= 0.6) {
    return "조명을 조금 더 밝게 하면 더 정확한 분석이 가능해요.";
  }
  if (q >= 0.4) {
    return "정면을 바라보고 다시 스캔하면 더 정확한 결과를 얻을 수 있어요.";
  }
  return "밝은 곳에서 정면을 바라보고 다시 스캔해 주세요. 더 좋은 결과를 얻을 수 있어요!";
}


// ============================================================
// 8. 메인 분석 함수
// ============================================================

// 전체 분석 흐름을 한 번에 실행합니다.
// 입력: FaceFrameSignal[] (프레임 신호 배열)
// 출력: FaceScoreAnalysisResult (점수 + 코칭 + 품질 메시지)
//
// [확장1] frames 대신 MediaPipe 결과를 직접 전달 가능
// [확장2] 실제 3초 비디오 프레임 분석 결과를 연결 가능
export function analyzeFaceFrames(frames: FaceFrameSignal[]): FaceScoreAnalysisResult {
  // 1단계: 여러 프레임 신호를 하나로 집계
  const signals = aggregateFrameSignals(frames);

  // 2단계: 인상 점수 계산 (전문가 가중치 반영)
  const scores = calculateImpressionScores(signals);

  // 3단계: 코칭 생성
  const summary = generateSummary(scores, signals);
  const tips = generateTips(scores, signals);
  const mission = generateMission(scores);
  const encouragement = generateEncouragement(scores);

  // 4단계: 품질 메시지 생성
  const qualityMessage = generateQualityMessage(signals);

  return {
    signals,
    scores,
    coaching: { summary, tips, mission, encouragement },
    qualityMessage,
  };
}


// ============================================================
// 9. Mock 데이터 생성 (테스트용)
// ============================================================
// 실제 AI 모델이 없어도 테스트할 수 있도록
// 가짜 프레임 신호를 생성합니다.
//
// 사용법:
//   const frames = createMockFrames("neutral");
//   const result = analyzeFaceFrames(frames);
//   console.log(result.scores);
//   console.log(result.coaching);
//   console.log(result.qualityMessage);

function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

export function createMockFrames(mode: "good" | "neutral" | "tense" = "neutral"): FaceFrameSignal[] {
  const count = 6; // 3초 스캔, 500ms 간격 → 6프레임
  const frames: FaceFrameSignal[] = [];

  for (let i = 0; i < count; i++) {
    if (mode === "good") {
      // 부드럽고 안정적인 표정
      frames.push({
        mouthSoftness: randomBetween(0.7, 0.95),
        eyeTension: randomBetween(0.05, 0.2),
        browTension: randomBetween(0.05, 0.15),
        gazeStability: randomBetween(0.8, 0.95),
        headStability: randomBetween(0.8, 0.95),
        expressionConsistency: randomBetween(0.8, 0.95),
        naturalSmileIndex: randomBetween(0.75, 0.95),
        captureQuality: randomBetween(0.8, 0.95),
      });
    } else if (mode === "tense") {
      // 긴장도가 높은 표정
      frames.push({
        mouthSoftness: randomBetween(0.2, 0.4),
        eyeTension: randomBetween(0.6, 0.85),
        browTension: randomBetween(0.55, 0.8),
        gazeStability: randomBetween(0.3, 0.5),
        headStability: randomBetween(0.3, 0.5),
        expressionConsistency: randomBetween(0.3, 0.5),
        naturalSmileIndex: randomBetween(0.15, 0.35),
        captureQuality: randomBetween(0.4, 0.6),
      });
    } else {
      // 보통 표정
      frames.push({
        mouthSoftness: randomBetween(0.45, 0.65),
        eyeTension: randomBetween(0.3, 0.5),
        browTension: randomBetween(0.25, 0.45),
        gazeStability: randomBetween(0.5, 0.7),
        headStability: randomBetween(0.5, 0.7),
        expressionConsistency: randomBetween(0.5, 0.7),
        naturalSmileIndex: randomBetween(0.4, 0.6),
        captureQuality: randomBetween(0.55, 0.75),
      });
    }
  }

  return frames;
}
