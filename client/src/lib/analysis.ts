import type { AnalysisResult } from "./types";

function randomInRange(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// 여기에 실제 AI API 연결 가능
// Replace this function with a real AI API call to analyze the uploaded face image
export async function analyzeFaceMock(_imageData?: string): Promise<AnalysisResult> {
  const friendliness = randomInRange(55, 95);
  const vitality = randomInRange(50, 92);
  const confidence = randomInRange(52, 93);
  const totalScore = Math.round((friendliness + vitality + confidence) / 3);

  const summary = generateSummary(totalScore, friendliness, vitality, confidence);
  const tips = generateTips(totalScore, friendliness, vitality, confidence);

  return {
    friendliness,
    vitality,
    confidence,
    totalScore,
    summary,
    tips,
  };
}

export function generateSummary(
  total: number,
  friendliness: number,
  vitality: number,
  confidence: number
): string {
  if (total >= 85) {
    const options = [
      "오늘은 밝고 따뜻한 인상이 돋보여요! 자신감도 넘치는 하루네요.",
      "정말 좋은 인상이에요! 주변 사람들에게 긍정적인 에너지를 줄 수 있는 표정이에요.",
      "오늘의 인상은 최고예요! 친근함과 생기가 조화롭게 느껴져요.",
    ];
    return options[Math.floor(Math.random() * options.length)];
  }
  if (total >= 75) {
    const options = [
      "오늘은 차분하고 신뢰감 있는 인상이 돋보여요.",
      "안정적이고 편안한 인상이에요. 조금만 더 미소를 더하면 완벽해요!",
      "전체적으로 좋은 인상이에요! 표정에서 따뜻함이 느껴져요.",
    ];
    return options[Math.floor(Math.random() * options.length)];
  }
  if (total >= 65) {
    if (friendliness < vitality && friendliness < confidence) {
      return "조금만 표정을 부드럽게 하면 더 친근한 인상을 줄 수 있어요.";
    }
    if (vitality < friendliness && vitality < confidence) {
      return "전체적으로 안정적인 인상이지만, 생기를 더하면 훨씬 좋아질 수 있어요.";
    }
    return "좋은 기본 인상을 가지고 있어요! 작은 변화로 더 빛날 수 있어요.";
  }
  const options = [
    "오늘은 조금 피곤해 보일 수 있지만, 충분히 좋아질 수 있어요!",
    "편안한 표정을 연습하면 인상이 크게 달라질 수 있어요. 화이팅!",
    "매일 조금씩 연습하면 놀라운 변화를 만들 수 있어요!",
  ];
  return options[Math.floor(Math.random() * options.length)];
}

export function generateTips(
  total: number,
  friendliness: number,
  vitality: number,
  confidence: number
): string[] {
  const allTips: string[] = [];

  if (friendliness < 75) {
    allTips.push("입꼬리를 살짝 올리면 더 부드러운 인상을 줄 수 있어요.");
    allTips.push("눈웃음을 연습하면 친근한 인상이 훨씬 올라가요.");
  } else {
    allTips.push("지금의 따뜻한 미소를 유지해 보세요!");
  }

  if (vitality < 75) {
    allTips.push("충분한 수면과 수분 섭취가 생기 있는 인상의 비결이에요.");
    allTips.push("가벼운 스트레칭으로 혈색을 좋게 만들어 보세요.");
  } else {
    allTips.push("생기 넘치는 표정이 잘 유지되고 있어요!");
  }

  if (confidence < 75) {
    allTips.push("정면을 바라보며 턱을 살짝 들면 자신감 있는 인상을 줄 수 있어요.");
    allTips.push("어깨를 펴고 바른 자세를 유지하면 인상이 달라져요.");
  } else {
    allTips.push("자신감 있는 눈빛이 인상적이에요!");
  }

  if (total >= 80) {
    allTips.push("정면 조명을 활용하면 얼굴 인상이 더 또렷하게 보일 수 있어요.");
  }

  allTips.push("눈가 긴장을 풀고 편안한 표정을 유지해 보세요.");

  const selected: string[] = [];
  const shuffled = allTips.sort(() => Math.random() - 0.5);
  for (const tip of shuffled) {
    if (selected.length >= 3) break;
    selected.push(tip);
  }

  return selected;
}
