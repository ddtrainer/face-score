// ============================================================
// 얼굴 감지 및 입력 검증 (Hard Gate)
// ============================================================
// 분석 시작 전 반드시 이 검증을 통과해야 합니다.
// 통과하지 못하면 분석 함수가 절대 호출되지 않습니다.
// ============================================================

// 실패 이유 enum
export type FaceFailureReason =
  | "NO_FACE"          // 얼굴이 감지되지 않음
  | "MULTIPLE_FACES"   // 여러 얼굴이 감지됨
  | "LOW_QUALITY"      // 촬영 품질이 너무 낮음
  | "FACE_TOO_SMALL"   // 얼굴이 너무 작음
  | "FACE_NOT_FRONTAL" // 얼굴이 정면이 아님
  | "FACE_OCCLUDED";   // 눈/입이 과하게 가려짐

// 검증 결과 타입
export interface FaceValidationResult {
  success: boolean;
  reason: FaceFailureReason | null;
  faceCount: number;
}

// 실패 이유별 한국어 메시지
export function getFailureMessage(reason: FaceFailureReason): { title: string; description: string } {
  switch (reason) {
    case "NO_FACE":
      return {
        title: "사람 얼굴이 확인되지 않았어요",
        description: "정면 얼굴이 보이는 사진이나 셀피 영상으로 다시 시도해 주세요.",
      };
    case "MULTIPLE_FACES":
      return {
        title: "여러 얼굴이 감지되었어요",
        description: "한 사람만 촬영해 주세요. 1명의 얼굴만 분석할 수 있어요.",
      };
    case "LOW_QUALITY":
      return {
        title: "촬영 품질이 너무 낮아요",
        description: "밝은 곳에서 선명하게 다시 촬영해 주세요.",
      };
    case "FACE_TOO_SMALL":
      return {
        title: "얼굴이 너무 작게 촬영되었어요",
        description: "카메라에 얼굴을 더 가까이 대고 다시 시도해 주세요.",
      };
    case "FACE_NOT_FRONTAL":
      return {
        title: "정면 얼굴이 필요해요",
        description: "카메라를 정면으로 바라보고 다시 시도해 주세요.",
      };
    case "FACE_OCCLUDED":
      return {
        title: "얼굴이 가려져 있어요",
        description: "눈과 입이 잘 보이도록 가리는 것을 치우고 다시 시도해 주세요.",
      };
  }
}

// ============================================================
// 내부 감지 함수들
// ============================================================

function isSkinPixel(r: number, g: number, b: number): boolean {
  if (r < 60 || g < 30 || b < 15) return false;
  if (r < g || r < b) return false;
  const maxC = Math.max(r, g, b);
  const minC = Math.min(r, g, b);
  if (maxC - minC < 15) return false;
  if (r - g < 10) return false;
  const brightness = (r + g + b) / 3;
  if (brightness < 50 || brightness > 240) return false;
  return true;
}

// FaceDetector API를 사용하여 얼굴 개수와 위치를 감지
async function detectFacesWithAPI(source: HTMLCanvasElement | HTMLImageElement): Promise<{
  available: boolean;
  faceCount: number;
  faces: Array<{ x: number; y: number; width: number; height: number }>;
}> {
  if (typeof window === "undefined" || !("FaceDetector" in window)) {
    return { available: false, faceCount: 0, faces: [] };
  }

  try {
    const detector = new (window as any).FaceDetector({ fastMode: false, maxDetectedFaces: 5 });
    const detected = await detector.detect(source);
    const faces = detected.map((f: any) => ({
      x: f.boundingBox.x,
      y: f.boundingBox.y,
      width: f.boundingBox.width,
      height: f.boundingBox.height,
    }));
    return { available: true, faceCount: faces.length, faces };
  } catch {
    return { available: false, faceCount: 0, faces: [] };
  }
}

// 휴리스틱 기반 얼굴 감지 (FaceDetector API 미지원 브라우저용)
function detectFaceWithHeuristic(imageData: ImageData): {
  hasFace: boolean;
  reason: FaceFailureReason | null;
  skinRatio: number;
  centerSkinRatio: number;
  darkFeatureRatio: number;
} {
  const { data, width, height } = imageData;
  const totalPixels = width * height;
  let skinPixels = 0;
  let skinSumX = 0;
  let skinSumY = 0;
  let greenDom = 0;
  let blueDom = 0;
  let redDom = 0;

  for (let i = 0; i < data.length; i += 16) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const px = (i / 4) % width;
    const py = Math.floor((i / 4) / width);

    if (isSkinPixel(r, g, b)) {
      skinPixels += 4;
      skinSumX += px * 4;
      skinSumY += py * 4;
    }

    if (g > r && g > b && g > 80) greenDom += 4;
    if (b > r && b > g && b > 80) blueDom += 4;
    if (r > 180 && g < 100 && b < 100) redDom += 4;
  }

  const skinRatio = skinPixels / totalPixels;
  const greenRatio = greenDom / totalPixels;
  const blueRatio = blueDom / totalPixels;
  const redRatio = redDom / totalPixels;

  if (greenRatio > 0.30 || blueRatio > 0.35 || redRatio > 0.25) {
    return { hasFace: false, reason: "NO_FACE", skinRatio, centerSkinRatio: 0, darkFeatureRatio: 0 };
  }

  if (skinRatio < 0.12) {
    return { hasFace: false, reason: "NO_FACE", skinRatio, centerSkinRatio: 0, darkFeatureRatio: 0 };
  }

  // 피부 영역이 중심에 있는지 확인 (정면성 체크)
  if (skinPixels > 0) {
    const avgX = skinSumX / skinPixels;
    const avgY = skinSumY / skinPixels;
    const centerX = width / 2;
    const centerY = height / 2;
    const distX = Math.abs(avgX - centerX) / width;
    const distY = Math.abs(avgY - centerY) / height;
    if (distX > 0.35 || distY > 0.40) {
      return { hasFace: false, reason: "FACE_NOT_FRONTAL", skinRatio, centerSkinRatio: 0, darkFeatureRatio: 0 };
    }
  }

  // 중심 영역 피부 비율 (얼굴 크기 추정)
  const centerTop = Math.floor(height * 0.15);
  const centerBottom = Math.floor(height * 0.85);
  const centerLeft = Math.floor(width * 0.15);
  const centerRight = Math.floor(width * 0.85);
  let centerSkin = 0;
  let centerTotal = 0;

  for (let y = centerTop; y < centerBottom; y += 4) {
    for (let x = centerLeft; x < centerRight; x += 4) {
      const idx = (y * width + x) * 4;
      centerTotal++;
      if (isSkinPixel(data[idx], data[idx + 1], data[idx + 2])) {
        centerSkin++;
      }
    }
  }

  const centerSkinRatio = centerTotal > 0 ? centerSkin / centerTotal : 0;
  if (centerSkinRatio < 0.15) {
    return { hasFace: false, reason: "FACE_TOO_SMALL", skinRatio, centerSkinRatio, darkFeatureRatio: 0 };
  }

  // 눈 영역에 어두운 특징이 있는지 (눈/눈썹 존재 확인)
  let darkRegions = 0;
  const eyeTop = Math.floor(height * 0.25);
  const eyeBottom = Math.floor(height * 0.55);
  const eyeLeft = Math.floor(width * 0.2);
  const eyeRight = Math.floor(width * 0.8);

  for (let y = eyeTop; y < eyeBottom; y += 3) {
    for (let x = eyeLeft; x < eyeRight; x += 3) {
      const idx = (y * width + x) * 4;
      const brightness = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
      if (brightness < 70) darkRegions++;
    }
  }

  const eyeArea = ((eyeBottom - eyeTop) / 3) * ((eyeRight - eyeLeft) / 3);
  const darkFeatureRatio = eyeArea > 0 ? darkRegions / eyeArea : 0;

  if (darkFeatureRatio < 0.02) {
    return { hasFace: false, reason: "FACE_OCCLUDED", skinRatio, centerSkinRatio, darkFeatureRatio };
  }

  return { hasFace: true, reason: null, skinRatio, centerSkinRatio, darkFeatureRatio };
}

// 촬영 품질 점검
function checkImageQuality(imageData: ImageData): { passes: boolean; reason: FaceFailureReason | null } {
  const { data, width, height } = imageData;

  if (width < 50 || height < 50) {
    return { passes: false, reason: "LOW_QUALITY" };
  }

  let lumSum = 0;
  let lumSqSum = 0;
  let sampleCount = 0;

  for (let i = 0; i < data.length; i += 16) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    lumSum += 0.299 * r + 0.587 * g + 0.114 * b;
    sampleCount++;
  }

  if (sampleCount === 0) return { passes: false, reason: "LOW_QUALITY" };

  const avgLum = lumSum / sampleCount;

  if (avgLum < 25 || avgLum > 245) {
    return { passes: false, reason: "LOW_QUALITY" };
  }

  return { passes: true, reason: null };
}


// ============================================================
// 공개 검증 함수들
// ============================================================

// ImageData 프레임에서 얼굴 검증 (카메라 스캔용)
export async function validateFaceInImageData(imageData: ImageData): Promise<FaceValidationResult> {
  // 1. 품질 점검
  const quality = checkImageQuality(imageData);
  if (!quality.passes) {
    return { success: false, reason: quality.reason!, faceCount: 0 };
  }

  // 2. 캔버스로 변환하여 API 감지 시도
  const canvas = document.createElement("canvas");
  canvas.width = imageData.width;
  canvas.height = imageData.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return { success: false, reason: "LOW_QUALITY", faceCount: 0 };
  ctx.putImageData(imageData, 0, 0);

  const apiResult = await detectFacesWithAPI(canvas);

  if (apiResult.available) {
    // API를 사용할 수 있을 때
    if (apiResult.faceCount === 0) {
      return { success: false, reason: "NO_FACE", faceCount: 0 };
    }
    if (apiResult.faceCount > 1) {
      return { success: false, reason: "MULTIPLE_FACES", faceCount: apiResult.faceCount };
    }

    // 얼굴 1개 — 크기 검증
    const face = apiResult.faces[0];
    const faceArea = face.width * face.height;
    const imageArea = canvas.width * canvas.height;
    if (faceArea / imageArea < 0.03) {
      return { success: false, reason: "FACE_TOO_SMALL", faceCount: 1 };
    }

    // 얼굴 중심이 가이드 영역 안에 있는지 확인
    const faceCenterX = (face.x + face.width / 2) / canvas.width;
    const faceCenterY = (face.y + face.height / 2) / canvas.height;
    if (faceCenterX < 0.15 || faceCenterX > 0.85 || faceCenterY < 0.1 || faceCenterY > 0.9) {
      return { success: false, reason: "FACE_NOT_FRONTAL", faceCount: 1 };
    }

    return { success: true, reason: null, faceCount: 1 };
  }

  // 3. API 미지원 → 휴리스틱 사용
  const heuristic = detectFaceWithHeuristic(imageData);
  if (!heuristic.hasFace) {
    return { success: false, reason: heuristic.reason ?? "NO_FACE", faceCount: 0 };
  }

  return { success: true, reason: null, faceCount: 1 };
}

// 파일에서 얼굴 검증 (업로드용)
export async function validateFaceInFile(file: File): Promise<FaceValidationResult> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = async () => {
      const canvas = document.createElement("canvas");
      canvas.width = Math.min(img.width, 640);
      canvas.height = Math.round(img.height * (canvas.width / img.width));
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        URL.revokeObjectURL(url);
        resolve({ success: false, reason: "LOW_QUALITY", faceCount: 0 });
        return;
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);

      // 1. 품질 점검
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const quality = checkImageQuality(imageData);
      if (!quality.passes) {
        resolve({ success: false, reason: quality.reason!, faceCount: 0 });
        return;
      }

      // 2. API 감지 시도
      const apiResult = await detectFacesWithAPI(canvas);

      if (apiResult.available) {
        if (apiResult.faceCount === 0) {
          resolve({ success: false, reason: "NO_FACE", faceCount: 0 });
          return;
        }
        if (apiResult.faceCount > 1) {
          resolve({ success: false, reason: "MULTIPLE_FACES", faceCount: apiResult.faceCount });
          return;
        }

        const face = apiResult.faces[0];
        const faceArea = face.width * face.height;
        const imageArea = canvas.width * canvas.height;
        if (faceArea / imageArea < 0.03) {
          resolve({ success: false, reason: "FACE_TOO_SMALL", faceCount: 1 });
          return;
        }

        const faceCenterX = (face.x + face.width / 2) / canvas.width;
        const faceCenterY = (face.y + face.height / 2) / canvas.height;
        if (faceCenterX < 0.15 || faceCenterX > 0.85 || faceCenterY < 0.1 || faceCenterY > 0.9) {
          resolve({ success: false, reason: "FACE_NOT_FRONTAL", faceCount: 1 });
          return;
        }

        resolve({ success: true, reason: null, faceCount: 1 });
        return;
      }

      // 3. 휴리스틱 사용
      const heuristic = detectFaceWithHeuristic(imageData);
      if (!heuristic.hasFace) {
        resolve({ success: false, reason: heuristic.reason ?? "NO_FACE", faceCount: 0 });
        return;
      }

      resolve({ success: true, reason: null, faceCount: 1 });
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve({ success: false, reason: "LOW_QUALITY", faceCount: 0 });
    };

    img.src = url;
  });
}

// 파일에서 ImageData 추출 (분석용)
export function extractImageDataFromFile(file: File): Promise<ImageData | null> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = Math.min(img.width, 640);
      canvas.height = Math.round(img.height * (canvas.width / img.width));
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        URL.revokeObjectURL(url);
        resolve(null);
        return;
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(ctx.getImageData(0, 0, canvas.width, canvas.height));
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };

    img.src = url;
  });
}
