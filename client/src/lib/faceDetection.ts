export type FaceFailureReason =
  | "NO_FACE"
  | "MULTIPLE_FACES"
  | "LOW_QUALITY"
  | "FACE_TOO_SMALL"
  | "FACE_NOT_FRONTAL"
  | "FACE_OCCLUDED";

export interface FaceValidationResult {
  success: boolean;
  reason: FaceFailureReason | null;
  faceCount: number;
}

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

function detectFaceWithHeuristic(imageData: ImageData): {
  hasFace: boolean;
  reason: FaceFailureReason | null;
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

  if (greenRatio > 0.25 || blueRatio > 0.30 || redRatio > 0.20) {
    return { hasFace: false, reason: "NO_FACE" };
  }

  if (skinRatio < 0.18) {
    return { hasFace: false, reason: "NO_FACE" };
  }

  if (skinRatio > 0.75) {
    return { hasFace: false, reason: "NO_FACE" };
  }

  if (skinPixels > 0) {
    const avgX = skinSumX / skinPixels;
    const avgY = skinSumY / skinPixels;
    const centerX = width / 2;
    const centerY = height / 2;
    const distX = Math.abs(avgX - centerX) / width;
    const distY = Math.abs(avgY - centerY) / height;
    if (distX > 0.30 || distY > 0.35) {
      return { hasFace: false, reason: "FACE_NOT_FRONTAL" };
    }
  }

  const faceTop = Math.floor(height * 0.10);
  const faceBottom = Math.floor(height * 0.90);
  const faceLeft = Math.floor(width * 0.15);
  const faceRight = Math.floor(width * 0.85);
  let faceSkin = 0;
  let faceTotal = 0;
  let nonSkinInFace = 0;

  for (let y = faceTop; y < faceBottom; y += 3) {
    for (let x = faceLeft; x < faceRight; x += 3) {
      const idx = (y * width + x) * 4;
      faceTotal++;
      if (isSkinPixel(data[idx], data[idx + 1], data[idx + 2])) {
        faceSkin++;
      } else {
        nonSkinInFace++;
      }
    }
  }

  const faceSkinRatio = faceTotal > 0 ? faceSkin / faceTotal : 0;
  const nonSkinRatio = faceTotal > 0 ? nonSkinInFace / faceTotal : 1;

  if (faceSkinRatio < 0.10) {
    return { hasFace: false, reason: "FACE_TOO_SMALL" };
  }

  if (nonSkinRatio < 0.02) {
    return { hasFace: false, reason: "NO_FACE" };
  }

  const eyeTop = Math.floor(height * 0.25);
  const eyeBottom = Math.floor(height * 0.50);
  const midX = Math.floor(width / 2);
  const eyeLeftStart = Math.floor(width * 0.15);
  const eyeRightEnd = Math.floor(width * 0.85);

  let leftDark = 0;
  let leftTotal = 0;
  let rightDark = 0;
  let rightTotal = 0;

  for (let y = eyeTop; y < eyeBottom; y += 2) {
    for (let x = eyeLeftStart; x < midX; x += 2) {
      const idx = (y * width + x) * 4;
      const brightness = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
      leftTotal++;
      if (brightness < 80) leftDark++;
    }
    for (let x = midX; x < eyeRightEnd; x += 2) {
      const idx = (y * width + x) * 4;
      const brightness = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
      rightTotal++;
      if (brightness < 80) rightDark++;
    }
  }

  const leftDarkRatio = leftTotal > 0 ? leftDark / leftTotal : 0;
  const rightDarkRatio = rightTotal > 0 ? rightDark / rightTotal : 0;

  if (leftDarkRatio > 0.70 || rightDarkRatio > 0.70) {
    return { hasFace: false, reason: "NO_FACE" };
  }

  const darkSymmetry = (leftDarkRatio > 0 && rightDarkRatio > 0)
    ? Math.min(leftDarkRatio, rightDarkRatio) / Math.max(leftDarkRatio, rightDarkRatio)
    : 0;

  const mouthTop = Math.floor(height * 0.55);
  const mouthBottom = Math.floor(height * 0.75);
  const mouthLeft = Math.floor(width * 0.25);
  const mouthRight = Math.floor(width * 0.75);
  let mouthDark = 0;
  let mouthSkin = 0;
  let mouthTotal = 0;

  for (let y = mouthTop; y < mouthBottom; y += 2) {
    for (let x = mouthLeft; x < mouthRight; x += 2) {
      const idx = (y * width + x) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      const brightness = (r + g + b) / 3;
      mouthTotal++;
      if (brightness < 90) mouthDark++;
      if (isSkinPixel(r, g, b)) mouthSkin++;
    }
  }

  const mouthSkinRatio = mouthTotal > 0 ? mouthSkin / mouthTotal : 0;
  const mouthDarkRatio = mouthTotal > 0 ? mouthDark / mouthTotal : 0;

  if (mouthSkinRatio > 0.95 && mouthDarkRatio < 0.02) {
    return { hasFace: false, reason: "NO_FACE" };
  }

  const foreheadTop = Math.floor(height * 0.12);
  const foreheadBottom = Math.floor(height * 0.32);
  const foreheadLeft = Math.floor(width * 0.25);
  const foreheadRight = Math.floor(width * 0.75);
  let foreheadSkin = 0;
  let foreheadTotal = 0;

  for (let y = foreheadTop; y < foreheadBottom; y += 3) {
    for (let x = foreheadLeft; x < foreheadRight; x += 3) {
      const idx = (y * width + x) * 4;
      foreheadTotal++;
      if (isSkinPixel(data[idx], data[idx + 1], data[idx + 2])) {
        foreheadSkin++;
      }
    }
  }

  const foreheadSkinRatio = foreheadTotal > 0 ? foreheadSkin / foreheadTotal : 0;

  const chinTop = Math.floor(height * 0.70);
  const chinBottom = Math.floor(height * 0.90);
  const chinLeft = Math.floor(width * 0.30);
  const chinRight = Math.floor(width * 0.70);
  let chinSkin = 0;
  let chinTotal = 0;

  for (let y = chinTop; y < chinBottom; y += 3) {
    for (let x = chinLeft; x < chinRight; x += 3) {
      const idx = (y * width + x) * 4;
      chinTotal++;
      if (isSkinPixel(data[idx], data[idx + 1], data[idx + 2])) {
        chinSkin++;
      }
    }
  }

  const chinSkinRatio = chinTotal > 0 ? chinSkin / chinTotal : 0;

  let edgeCount = 0;
  let edgeSamples = 0;
  for (let y = eyeTop; y < eyeBottom; y += 3) {
    for (let x = eyeLeftStart + 1; x < eyeRightEnd - 1; x += 3) {
      const idx = (y * width + x) * 4;
      const idxR = idx + 4;
      const idxD = idx + width * 4;
      if (idxR + 2 < data.length && idxD + 2 < data.length) {
        const curr = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
        const right = (data[idxR] + data[idxR + 1] + data[idxR + 2]) / 3;
        const down = (data[idxD] + data[idxD + 1] + data[idxD + 2]) / 3;
        edgeSamples++;
        if (Math.abs(curr - right) > 25 || Math.abs(curr - down) > 25) edgeCount++;
      }
    }
  }

  const edgeRatio = edgeSamples > 0 ? edgeCount / edgeSamples : 0;

  let passedChecks = 0;
  if (faceSkinRatio >= 0.20) passedChecks++;
  if (leftDarkRatio >= 0.04 && rightDarkRatio >= 0.04) passedChecks++;
  if (darkSymmetry >= 0.25) passedChecks++;
  if (foreheadSkinRatio >= 0.08) passedChecks++;
  if (chinSkinRatio >= 0.08) passedChecks++;
  if (edgeRatio >= 0.03) passedChecks++;
  if (nonSkinRatio >= 0.04) passedChecks++;

  if (passedChecks < 5) {
    return { hasFace: false, reason: "NO_FACE" };
  }

  return { hasFace: true, reason: null };
}

function checkImageQuality(imageData: ImageData): { passes: boolean; reason: FaceFailureReason | null } {
  const { data, width, height } = imageData;

  if (width < 50 || height < 50) {
    return { passes: false, reason: "LOW_QUALITY" };
  }

  let lumSum = 0;
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

export async function validateFaceInImageData(imageData: ImageData): Promise<FaceValidationResult> {
  const quality = checkImageQuality(imageData);
  if (!quality.passes) {
    return { success: false, reason: quality.reason!, faceCount: 0 };
  }

  const canvas = document.createElement("canvas");
  canvas.width = imageData.width;
  canvas.height = imageData.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return { success: false, reason: "LOW_QUALITY", faceCount: 0 };
  ctx.putImageData(imageData, 0, 0);

  const apiResult = await detectFacesWithAPI(canvas);

  if (apiResult.available) {
    if (apiResult.faceCount === 0) {
      return { success: false, reason: "NO_FACE", faceCount: 0 };
    }
    if (apiResult.faceCount > 1) {
      return { success: false, reason: "MULTIPLE_FACES", faceCount: apiResult.faceCount };
    }

    const face = apiResult.faces[0];
    const faceArea = face.width * face.height;
    const imageArea = canvas.width * canvas.height;
    if (faceArea / imageArea < 0.03) {
      return { success: false, reason: "FACE_TOO_SMALL", faceCount: 1 };
    }

    const faceCenterX = (face.x + face.width / 2) / canvas.width;
    const faceCenterY = (face.y + face.height / 2) / canvas.height;
    if (faceCenterX < 0.15 || faceCenterX > 0.85 || faceCenterY < 0.1 || faceCenterY > 0.9) {
      return { success: false, reason: "FACE_NOT_FRONTAL", faceCount: 1 };
    }

    return { success: true, reason: null, faceCount: 1 };
  }

  const heuristic = detectFaceWithHeuristic(imageData);
  if (!heuristic.hasFace) {
    return { success: false, reason: heuristic.reason ?? "NO_FACE", faceCount: 0 };
  }

  return { success: true, reason: null, faceCount: 1 };
}

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

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const quality = checkImageQuality(imageData);
      if (!quality.passes) {
        resolve({ success: false, reason: quality.reason!, faceCount: 0 });
        return;
      }

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
