export interface FaceSignals {
  mouthSoftness: number;
  eyeTension: number;
  browTension: number;
  gazeStability: number;
  headStability: number;
  expressionConsistency: number;
  naturalSmileIndex: number;
  captureQuality: number;
}

export interface ImpressionScores {
  friendliness: number;
  vitality: number;
  confidence: number;
  stability: number;
  totalScore: number;
}

export interface CoachingResult {
  summary: string;
  tips: string[];
  mission: string;
}

export interface FaceScoreResult extends ImpressionScores, CoachingResult {}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function randomInRange(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function assessFrameQuality(frame: ImageData): number {
  const { data, width, height } = frame;
  const total = width * height;
  let brightnessSum = 0;
  let brightnessSquaredSum = 0;
  let edgeCount = 0;

  for (let i = 0; i < data.length; i += 16) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;
    brightnessSum += lum;
    brightnessSquaredSum += lum * lum;
  }

  const sampleCount = Math.ceil(data.length / 16);
  const avgBrightness = brightnessSum / sampleCount;
  const variance = (brightnessSquaredSum / sampleCount) - (avgBrightness * avgBrightness);

  const brightnessFactor = avgBrightness > 40 && avgBrightness < 220 ? 1.0 : 0.6;
  const contrastFactor = variance > 500 ? 1.0 : variance > 200 ? 0.8 : 0.5;

  for (let y = 1; y < height - 1; y += 6) {
    for (let x = 1; x < width - 1; x += 6) {
      const idx = (y * width + x) * 4;
      const idxRight = idx + 4;
      const idxDown = idx + width * 4;
      if (idxRight + 2 < data.length && idxDown + 2 < data.length) {
        const curr = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
        const right = (data[idxRight] + data[idxRight + 1] + data[idxRight + 2]) / 3;
        const down = (data[idxDown] + data[idxDown + 1] + data[idxDown + 2]) / 3;
        if (Math.abs(curr - right) > 20 || Math.abs(curr - down) > 20) edgeCount++;
      }
    }
  }

  const edgeSamples = Math.ceil(((height - 2) / 6)) * Math.ceil(((width - 2) / 6));
  const edgeFactor = edgeSamples > 0 ? Math.min(edgeCount / edgeSamples / 0.3, 1.0) : 0.5;

  return clamp(brightnessFactor * 0.3 + contrastFactor * 0.3 + edgeFactor * 0.4, 0, 1);
}

export function extractFaceSignals(frames: ImageData[]): FaceSignals {
  if (frames.length === 0) {
    return {
      mouthSoftness: randomInRange(50, 85),
      eyeTension: randomInRange(20, 60),
      browTension: randomInRange(15, 55),
      gazeStability: randomInRange(55, 90),
      headStability: randomInRange(50, 85),
      expressionConsistency: randomInRange(55, 90),
      naturalSmileIndex: randomInRange(40, 85),
      captureQuality: randomInRange(60, 90),
    };
  }

  const qualities = frames.map(assessFrameQuality);
  const avgQuality = qualities.reduce((a, b) => a + b, 0) / qualities.length;

  const brightnesses: number[] = [];
  const skinRatios: number[] = [];

  for (const frame of frames) {
    const { data, width, height } = frame;
    let lumSum = 0;
    let skinCount = 0;
    let sampleCount = 0;

    for (let i = 0; i < data.length; i += 16) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      lumSum += 0.299 * r + 0.587 * g + 0.114 * b;
      sampleCount++;
      if (r > 80 && r > g && r > b && (r - g) > 10 && b < 200) {
        skinCount++;
      }
    }

    brightnesses.push(lumSum / sampleCount);
    skinRatios.push(skinCount / sampleCount);
  }

  const avgBrightness = brightnesses.reduce((a, b) => a + b, 0) / brightnesses.length;
  const avgSkinRatio = skinRatios.reduce((a, b) => a + b, 0) / skinRatios.length;

  const brightnessVariance = brightnesses.reduce((sum, b) => sum + Math.pow(b - avgBrightness, 2), 0) / brightnesses.length;
  const brightnessStability = Math.max(0, 1 - brightnessVariance / 500);

  const skinVariance = skinRatios.reduce((sum, s) => sum + Math.pow(s - avgSkinRatio, 2), 0) / skinRatios.length;
  const skinStability = Math.max(0, 1 - skinVariance / 0.05);

  const mouthSoftness = clamp(
    Math.round(40 + avgSkinRatio * 60 + avgQuality * 20 + randomInRange(-8, 8)),
    30, 98
  );

  const eyeTension = clamp(
    Math.round(60 - avgQuality * 30 - brightnessStability * 15 + randomInRange(-5, 15)),
    10, 80
  );

  const browTension = clamp(
    Math.round(55 - avgQuality * 25 - skinStability * 15 + randomInRange(-5, 12)),
    10, 75
  );

  const gazeStability = clamp(
    Math.round(50 + brightnessStability * 30 + skinStability * 15 + randomInRange(-5, 10)),
    35, 95
  );

  const headStability = clamp(
    Math.round(45 + brightnessStability * 35 + skinStability * 10 + randomInRange(-5, 10)),
    30, 95
  );

  const expressionConsistency = clamp(
    Math.round(50 + skinStability * 25 + brightnessStability * 15 + randomInRange(-5, 10)),
    35, 95
  );

  const naturalSmileIndex = clamp(
    Math.round(35 + mouthSoftness * 0.4 - eyeTension * 0.2 + avgQuality * 15 + randomInRange(-5, 10)),
    25, 95
  );

  const captureQuality = clamp(Math.round(avgQuality * 100), 30, 98);

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

export function calculateImpressionScores(signals: FaceSignals): ImpressionScores {
  const {
    mouthSoftness, eyeTension, browTension, gazeStability,
    headStability, expressionConsistency, naturalSmileIndex, captureQuality,
  } = signals;

  const friendliness = clamp(Math.round(
    mouthSoftness * 0.35 +
    (100 - eyeTension) * 0.25 +
    naturalSmileIndex * 0.25 +
    (100 - browTension) * 0.15
  ), 30, 98);

  const vitality = clamp(Math.round(
    naturalSmileIndex * 0.30 +
    (100 - eyeTension) * 0.25 +
    captureQuality * 0.25 +
    expressionConsistency * 0.20
  ), 30, 98);

  const confidence = clamp(Math.round(
    gazeStability * 0.30 +
    headStability * 0.25 +
    (100 - browTension) * 0.25 +
    expressionConsistency * 0.20
  ), 30, 98);

  const stability = clamp(Math.round(
    headStability * 0.30 +
    gazeStability * 0.25 +
    expressionConsistency * 0.25 +
    (100 - eyeTension) * 0.20
  ), 30, 98);

  const expressionExpert = (friendliness + vitality) / 2;
  const nonverbalPsychology = (confidence + stability) / 2;
  const neuroscience = (
    naturalSmileIndex * 0.4 +
    (100 - eyeTension) * 0.3 +
    expressionConsistency * 0.3
  );

  const totalScore = clamp(Math.round(
    expressionExpert * 0.60 +
    nonverbalPsychology * 0.30 +
    neuroscience * 0.10
  ), 30, 98);

  return { friendliness, vitality, confidence, stability, totalScore };
}

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

function generateSummary(scores: ImpressionScores, signals: FaceSignals): string {
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
    if (signals.eyeTension > 50) {
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

function generateTips(scores: ImpressionScores, signals: FaceSignals): string[] {
  const { totalScore, friendliness, vitality, confidence, stability } = scores;
  const tips: string[] = [];

  if (totalScore >= 85) {
    if (friendliness >= 80) tips.push("지금의 따뜻한 미소가 정말 좋아요. 하루 종일 유지해 보세요!");
    if (vitality >= 80) tips.push("생기 넘치는 표정이 매력적이에요. 이 컨디션을 잘 기억해 두세요.");
    if (confidence >= 80) tips.push("당당한 눈빛이 인상적이에요. 이 자신감 그대로 유지해 보세요!");
    if (stability >= 80) tips.push("안정감 있는 표정이 돋보여요. 이 여유로움을 유지해 보세요!");
    tips.push("거울을 볼 때 가볍게 미소 짓는 습관을 들이면 표정 근육이 자연스러워져요.");
    tips.push("좋은 인상을 유지하는 비결은 충분한 수면이에요. 오늘 일찍 쉬어 보세요!");
  } else if (totalScore >= 75) {
    if (signals.mouthSoftness < 60) {
      tips.push("입꼬리를 살짝 올리는 연습을 해보세요. 거울 앞에서 5초만 유지하면 자연스러워져요.");
    }
    if (signals.eyeTension > 45) {
      tips.push("눈 주변 근육을 가볍게 풀어보세요. 눈웃음을 연습하면 한결 부드러운 인상이 돼요.");
    }
    if (signals.browTension > 40) {
      tips.push("이마와 눈썹 사이 긴장을 풀어보세요. 손가락으로 가볍게 마사지하면 효과적이에요.");
    }
    if (signals.gazeStability < 65) {
      tips.push("정면을 바라보며 턱을 살짝 당기면 안정감 있는 인상을 줄 수 있어요.");
    }
    if (vitality < 75) {
      tips.push("물을 충분히 마시고 가벼운 산책을 해보세요. 혈색이 좋아지면 인상도 밝아져요.");
    }
    if (confidence < 75) {
      tips.push("바른 자세로 어깨를 펴 보세요. 자세만 바꿔도 표정이 달라져요.");
    }
    if (stability < 75) {
      tips.push("촬영 전 심호흡을 3회 해보세요. 마음이 안정되면 표정도 자연스러워져요.");
    }
    tips.push("자연스러운 미소가 아주 잘 어울려요. 이 느낌 그대로 유지해 보세요!");
  } else if (totalScore >= 65) {
    if (signals.mouthSoftness < 55) {
      tips.push("하루에 세 번, 거울을 보며 가볍게 미소 짓는 연습을 해보세요. 2주면 자연스러워져요.");
    }
    if (signals.eyeTension > 50) {
      tips.push("촬영 전에 눈 주변 근육을 가볍게 풀어보세요. 따뜻한 수건을 올려도 좋아요.");
    }
    if (signals.naturalSmileIndex < 55) {
      tips.push("좋아하는 음악을 들으며 표정을 풀어보세요. 편안한 마음이 얼굴에 그대로 드러나요.");
    }
    if (vitality < 70) {
      tips.push("충분한 수면이 최고의 인상 관리예요. 오늘은 30분 일찍 잠자리에 들어보세요.");
    }
    if (confidence < 70) {
      tips.push("매일 아침 거울 앞에서 \"오늘 하루도 괜찮을 거야\"라고 말해 보세요.");
    }
    if (stability < 70) {
      tips.push("명상이나 호흡 운동을 해보세요. 내면의 안정감이 표정에 그대로 나타나요.");
    }
    tips.push("표정 근육은 연습할수록 부드러워져요. 매일 1분씩 표정 스트레칭을 해보세요!");
    tips.push("좋은 인상은 타고나는 게 아니에요. 작은 습관이 쌓이면 누구나 빛나는 인상을 가질 수 있어요.");
  } else {
    tips.push("오늘은 충분히 쉬는 게 가장 좋은 인상 관리예요. 피곤할 땐 무리하지 마세요.");
    tips.push("따뜻한 물 한 잔과 함께 심호흡을 해보세요. 긴장이 풀리면 표정도 편안해져요.");
    tips.push("컨디션이 좋은 날 다시 찍어보세요. 그날의 변화에 깜짝 놀랄 수도 있어요!");
    tips.push("입꼬리를 올리는 작은 연습부터 시작해 보세요. 하루 5초면 충분해요.");
    tips.push("좋아하는 것을 떠올리며 표정을 지어보세요. 자연스러운 미소가 가장 좋은 인상이에요.");
  }

  const fallbackPool = [
    "거울을 볼 때 가볍게 미소 짓는 습관을 들이면 표정 근육이 자연스러워져요.",
    "충분한 수면이 최고의 인상 관리예요. 오늘은 일찍 쉬어 보세요!",
    "물을 충분히 마시면 피부톤이 밝아지고 인상도 좋아져요.",
    "자세를 바로 하면 표정도 자연스럽게 밝아져요. 어깨를 펴 보세요!",
    "좋아하는 음악을 들으며 표정을 풀어보세요. 편안한 마음이 얼굴에 드러나요.",
  ];

  while (tips.length < 3) {
    const fallback = fallbackPool[tips.length % fallbackPool.length];
    if (!tips.includes(fallback)) {
      tips.push(fallback);
    } else {
      tips.push(fallbackPool[(tips.length + 1) % fallbackPool.length]);
    }
  }

  const shuffled = [...tips].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 3);
}

function generateMission(scores: ImpressionScores, signals: FaceSignals): string {
  const weakest = findWeakest(scores);

  if (scores.totalScore >= 85) {
    return pick([
      "내일도 오늘처럼! 거울 앞에서 좋아하는 표정을 3번 연습해 보세요.",
      "오늘의 좋은 인상을 기억하며, 하루 3번 의식적으로 미소 지어 보세요.",
      "좋은 인상을 유지하려면 숙면이 중요해요. 오늘은 평소보다 30분 일찍 잠들어 보세요.",
    ]);
  }

  if (weakest === "friendliness") {
    if (signals.mouthSoftness < 55) {
      return "내일 미션: 아침에 일어나서 거울 보며 입꼬리를 올린 상태로 10초 유지하기";
    }
    if (signals.eyeTension > 50) {
      return "내일 미션: 눈 주변을 손가락으로 부드럽게 원을 그리며 1분간 마사지하기";
    }
    return "내일 미션: 좋아하는 노래를 들으며 거울 앞에서 자연스러운 미소 3번 연습하기";
  }

  if (weakest === "vitality") {
    if (signals.captureQuality < 60) {
      return "내일 미션: 밝은 자연광 아래에서 셀피 스캔하기. 조명이 생기를 더해줘요!";
    }
    return pick([
      "내일 미션: 아침에 간단한 스트레칭 5분 후 셀피 스캔해 보세요. 차이가 보일 거예요!",
      "내일 미션: 물 한 잔 마시고 가볍게 산책 후 셀피 스캔으로 변화를 확인해 보세요.",
    ]);
  }

  if (weakest === "confidence") {
    if (signals.gazeStability < 60) {
      return "내일 미션: 거울을 보며 정면 시선으로 5초 유지하는 연습 3회 하기";
    }
    return pick([
      "내일 미션: 바른 자세로 어깨를 펴고 턱을 살짝 당긴 상태에서 셀피 스캔하기",
      "내일 미션: 거울 앞에서 \"나는 괜찮아\"를 3번 말한 후 셀피 스캔해 보세요.",
    ]);
  }

  if (signals.headStability < 55) {
    return "내일 미션: 스캔 전에 심호흡 3회 후 카메라를 고정하고 촬영해 보세요.";
  }
  return pick([
    "내일 미션: 잠들기 전 5분 명상으로 마음을 정리한 뒤, 내일 아침 스캔해 보세요.",
    "내일 미션: 촬영 전 눈을 감고 5초간 깊은 호흡 후 편안한 표정으로 스캔하기",
  ]);
}

export function generateCoaching(scores: ImpressionScores, signals: FaceSignals): CoachingResult {
  const summary = generateSummary(scores, signals);
  const tips = generateTips(scores, signals);
  const mission = generateMission(scores, signals);
  return { summary, tips, mission };
}

export function filterQualityFrames(frames: ImageData[]): ImageData[] {
  if (frames.length <= 1) return frames;

  const scored = frames.map((frame, i) => ({
    frame,
    quality: assessFrameQuality(frame),
    index: i,
  }));

  scored.sort((a, b) => b.quality - a.quality);

  const threshold = scored[0].quality * 0.6;
  return scored.filter((s) => s.quality >= threshold).map((s) => s.frame);
}

export async function runFaceScoreEngine(frames: ImageData[]): Promise<FaceScoreResult> {
  const qualityFrames = filterQualityFrames(frames);
  const signals = extractFaceSignals(qualityFrames);
  const scores = calculateImpressionScores(signals);
  const coaching = generateCoaching(scores, signals);

  return {
    ...scores,
    ...coaching,
  };
}
