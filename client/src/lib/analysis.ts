import type { AnalysisResult } from "./types";

function randomInRange(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
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

function findWeakest(f: number, v: number, c: number): "friendliness" | "vitality" | "confidence" {
  if (f <= v && f <= c) return "friendliness";
  if (v <= f && v <= c) return "vitality";
  return "confidence";
}

function findStrongest(f: number, v: number, c: number): "friendliness" | "vitality" | "confidence" {
  if (f >= v && f >= c) return "friendliness";
  if (v >= f && v >= c) return "vitality";
  return "confidence";
}

export function generateSummary(
  total: number,
  friendliness: number,
  vitality: number,
  confidence: number
): string {
  const strongest = findStrongest(friendliness, vitality, confidence);

  if (total >= 90) {
    return pick([
      "오늘 표정에서 따뜻함이 가득 느껴져요. 주변 사람들에게 좋은 에너지를 전할 수 있는 하루예요!",
      "친근함, 생기, 자신감이 모두 조화롭게 빛나고 있어요. 이 느낌 그대로 하루를 보내 보세요!",
      "지금 표정이 정말 멋져요! 편안하면서도 밝은 인상이 자연스럽게 전해지고 있어요.",
    ]);
  }

  if (total >= 80) {
    const strongLabels = {
      friendliness: "부드럽고 다가가기 편한 느낌",
      vitality: "활기차고 생동감 넘치는 느낌",
      confidence: "당당하고 신뢰감을 주는 느낌",
    };
    return pick([
      `오늘은 ${strongLabels[strongest]}이 특히 돋보여요. 작은 표정 변화만으로도 더 빛날 수 있어요!`,
      "전체적으로 안정감 있는 좋은 인상이에요. 자연스러운 미소가 잘 어울리는 하루네요.",
      "오늘의 인상에서 따뜻함과 여유가 느껴져요. 이 분위기를 유지해 보세요!",
    ]);
  }

  if (total >= 70) {
    const weakest = findWeakest(friendliness, vitality, confidence);
    if (weakest === "friendliness") {
      return pick([
        "차분하고 진중한 인상이에요. 살짝 미소를 더하면 한결 부드러운 느낌을 줄 수 있어요.",
        "신뢰감 있는 표정이에요. 눈가를 조금만 풀어주면 더 편안한 인상이 될 거예요.",
      ]);
    }
    if (weakest === "vitality") {
      return pick([
        "편안하고 안정적인 인상이에요. 가벼운 스트레칭이나 산책으로 생기를 더해보는 건 어떨까요?",
        "차분한 매력이 있는 인상이에요. 약간의 생기만 더해지면 훨씬 좋아질 수 있어요.",
      ]);
    }
    return pick([
      "친근하고 따뜻한 인상이에요. 시선을 살짝 높이면 더 당당한 느낌을 줄 수 있어요.",
      "부드러운 분위기가 좋아요. 바른 자세와 함께하면 인상이 한층 더 좋아질 거예요.",
    ]);
  }

  if (total >= 60) {
    return pick([
      "오늘은 조금 긴장되어 있는 것 같아요. 심호흡 한 번 하고 표정을 풀어보세요. 분명 달라질 거예요!",
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

export function generateTips(
  total: number,
  friendliness: number,
  vitality: number,
  confidence: number
): string[] {
  const tips: string[] = [];

  if (total >= 85) {
    if (friendliness >= 80) tips.push("지금의 따뜻한 미소가 정말 좋아요. 하루 종일 유지해 보세요!");
    if (vitality >= 80) tips.push("생기 넘치는 표정이 매력적이에요. 이 컨디션을 잘 기억해 두세요.");
    if (confidence >= 80) tips.push("당당한 눈빛이 인상적이에요. 이 자신감 그대로 유지해 보세요!");
    tips.push("거울을 볼 때 가볍게 미소 짓는 습관을 들이면 표정 근육이 자연스러워져요.");
    tips.push("따뜻한 조명 아래에서 거울을 보며 자신의 장점을 한 가지 찾아보세요.");
    tips.push("좋은 인상을 유지하는 비결은 충분한 수면이에요. 오늘 일찍 쉬어 보세요!");
  } else if (total >= 75) {
    if (friendliness < 75) {
      tips.push("입꼬리를 살짝 올리는 연습을 해보세요. 거울 앞에서 5초만 유지하면 자연스러워져요.");
      tips.push("눈웃음을 연습해 보세요. 눈 밑 근육에 살짝 힘을 주면 한결 부드러운 인상이 돼요.");
    } else {
      tips.push("자연스러운 미소가 아주 잘 어울려요. 이 느낌 그대로 유지해 보세요!");
    }
    if (vitality < 75) {
      tips.push("물을 충분히 마시고 가벼운 산책을 해보세요. 혈색이 좋아지면 인상도 밝아져요.");
      tips.push("아침에 세수 후 가볍게 얼굴 마사지를 해주면 생기 있는 표정에 도움이 돼요.");
    } else {
      tips.push("활기찬 에너지가 느껴져요! 가벼운 운동을 꾸준히 하면 이 생기가 계속 유지돼요.");
    }
    if (confidence < 75) {
      tips.push("정면을 바라보며 턱을 살짝 당기면 안정감 있는 인상을 줄 수 있어요.");
      tips.push("바른 자세로 어깨를 펴 보세요. 자세만 바꿔도 표정이 달라져요.");
    } else {
      tips.push("자신감 있는 시선이 돋보여요. 대화할 때 부드러운 눈맞춤을 더하면 더 좋아요!");
    }
  } else if (total >= 65) {
    if (friendliness < 70) {
      tips.push("하루에 세 번, 거울을 보며 가볍게 미소 짓는 연습을 해보세요. 2주면 자연스러워져요.");
      tips.push("좋아하는 음악을 들으며 표정을 풀어보세요. 편안한 마음이 얼굴에 그대로 드러나요.");
    }
    if (vitality < 70) {
      tips.push("충분한 수면이 최고의 인상 관리예요. 오늘은 30분 일찍 잠자리에 들어보세요.");
      tips.push("스트레칭이나 가벼운 운동으로 혈액순환을 도와주세요. 얼굴빛이 달라져요.");
    }
    if (confidence < 70) {
      tips.push("매일 아침 거울 앞에서 \"오늘 하루도 괜찮을 거야\"라고 말해 보세요. 작은 습관이 큰 변화를 만들어요.");
      tips.push("고개를 살짝 들고 먼 곳을 바라보는 연습을 해보세요. 눈빛에 여유가 생겨요.");
    }
    tips.push("표정 근육은 연습할수록 부드러워져요. 매일 1분씩 표정 스트레칭을 해보세요!");
    tips.push("좋은 인상은 타고나는 게 아니에요. 작은 습관이 쌓이면 누구나 빛나는 인상을 가질 수 있어요.");
    tips.push("하루 한 번 거울 앞에서 좋아하는 표정을 연습해 보세요. 자연스러움이 쌓여요.");
    tips.push("따뜻한 차 한 잔의 여유가 오늘의 표정을 더 편안하게 만들어 줄 거예요.");
  } else {
    tips.push("오늘은 충분히 쉬는 게 가장 좋은 인상 관리예요. 피곤할 땐 무리하지 마세요.");
    tips.push("따뜻한 물 한 잔과 함께 심호흡을 해보세요. 긴장이 풀리면 표정도 자연스럽게 편안해져요.");
    tips.push("컨디션이 좋은 날 다시 찍어보세요. 그날의 변화에 깜짝 놀랄 수도 있어요!");
    tips.push("입꼬리를 올리는 작은 연습부터 시작해 보세요. 하루 5초면 충분해요.");
    tips.push("좋아하는 것을 떠올리며 표정을 지어보세요. 자연스러운 미소가 가장 좋은 인상이에요.");
  }

  const shuffled = [...tips].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 3);
}
