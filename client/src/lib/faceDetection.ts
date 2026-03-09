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

const MIN_FACE_AREA_RATIO = 0.02;

export function getFailureMessage(reason: FaceFailureReason): { title: string; description: string } {
  switch (reason) {
    case "NO_FACE":
      return {
        title: "얼굴을 찾지 못했어요",
        description: "사람 얼굴이 선명하게 보이는 사진으로 다시 시도해 주세요.",
      };
    case "MULTIPLE_FACES":
      return {
        title: "여러 얼굴이 감지되었어요",
        description: "한 사람의 얼굴만 나오도록 다시 촬영해 주세요.",
      };
    case "LOW_QUALITY":
      return {
        title: "이미지 품질이 낮아요",
        description: "너무 어둡거나 흐린 사진은 분석할 수 없어요.",
      };
    case "FACE_TOO_SMALL":
      return {
        title: "얼굴이 너무 작아요",
        description: "얼굴이 화면에서 더 크게 보이도록 촬영해 주세요.",
      };
    case "FACE_NOT_FRONTAL":
      return {
        title: "정면 얼굴이 필요해요",
        description: "카메라를 정면으로 바라본 사진으로 다시 시도해 주세요.",
      };
    case "FACE_OCCLUDED":
      return {
        title: "얼굴이 가려져 있어요",
        description: "얼굴을 가리는 물체를 제거하고 다시 시도해 주세요.",
      };
  }
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

function isSkinPixel(r: number, g: number, b: number): boolean {
  if (r < 40 || g < 20 || b < 10) return false;
  if (r < g || r < b) return false;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  if (max - min < 10) return false;
  if (r - g < 4) return false;
  const brightness = (r + g + b) / 3;
  return brightness >= 20 && brightness <= 250;
}

function detectFaceWithHeuristic(imageData: ImageData): { hasFace: boolean; reason: FaceFailureReason } {
  const { data, width, height } = imageData;
  const totalPixels = width * height;

  let skinCount = 0;
  let minX = width;
  let minY = height;
  let maxX = 0;
  let maxY = 0;

  for (let y = 0; y < height; y += 2) {
    for (let x = 0; x < width; x += 2) {
      const idx = (y * width + x) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      if (isSkinPixel(r, g, b)) {
        skinCount++;
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
  }

  const sampledPixels = Math.ceil(width / 2) * Math.ceil(height / 2);
  const skinRatio = sampledPixels > 0 ? skinCount / sampledPixels : 0;

  if (skinRatio < 0.04 || skinRatio > 0.92) {
    return { hasFace: false, reason: "NO_FACE" };
  }

  const boxW = Math.max(0, maxX - minX + 1);
  const boxH = Math.max(0, maxY - minY + 1);

  if (boxW === 0 || boxH === 0) {
    return { hasFace: false, reason: "NO_FACE" };
  }

  const boxAreaRatio = (boxW * boxH) / totalPixels;
  if (boxAreaRatio < MIN_FACE_AREA_RATIO) {
    return { hasFace: false, reason: "FACE_TOO_SMALL" };
  }

  const centerX = (minX + maxX) / 2 / width;
  const centerY = (minY + maxY) / 2 / height;

  if (centerX < 0.1 || centerX > 0.9 || centerY < 0.05 || centerY > 0.95) {
    return { hasFace: false, reason: "FACE_NOT_FRONTAL" };
  }

  return { hasFace: true, reason: "NO_FACE" };
}

function checkImageQuality(imageData: ImageData): { passes: boolean; reason: FaceFailureReason | null } {
  const { data, width, height } = imageData;

  if (width < 50 || height < 50) {
    return { passes: false, reason: "LOW_QUALITY" };
  }

  let luminanceSum = 0;
  let sampleCount = 0;

  for (let i = 0; i < data.length; i += 16) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    luminanceSum += 0.299 * r + 0.587 * g + 0.114 * b;
    sampleCount++;
  }

  if (sampleCount === 0) {
    return { passes: false, reason: "LOW_QUALITY" };
  }

  const avgLum = luminanceSum / sampleCount;
  if (avgLum < 10 || avgLum > 250) {
    return { passes: false, reason: "LOW_QUALITY" };
  }

  return { passes: true, reason: null };
}

async function validateCanvasFace(canvas: HTMLCanvasElement, imageData: ImageData): Promise<FaceValidationResult> {
  const quality = checkImageQuality(imageData);
  if (!quality.passes) {
    return { success: false, reason: quality.reason, faceCount: 0 };
  }

  const apiResult = await detectFacesWithAPI(canvas);

  if (apiResult.available) {
    if (apiResult.faceCount > 1) {
      return { success: false, reason: "MULTIPLE_FACES", faceCount: apiResult.faceCount };
    }

    if (apiResult.faceCount === 1) {
      const face = apiResult.faces[0];
      const faceArea = face.width * face.height;
      const imageArea = canvas.width * canvas.height;

      if (faceArea / imageArea < MIN_FACE_AREA_RATIO) {
        const fallbackSmall = detectFaceWithHeuristic(imageData);
        if (!fallbackSmall.hasFace) {
          return { success: false, reason: "FACE_TOO_SMALL", faceCount: 1 };
        }
      }

      const faceCenterX = (face.x + face.width / 2) / canvas.width;
      const faceCenterY = (face.y + face.height / 2) / canvas.height;

      if (faceCenterX < 0.1 || faceCenterX > 0.9 || faceCenterY < 0.05 || faceCenterY > 0.95) {
        const fallbackFrontal = detectFaceWithHeuristic(imageData);
        if (!fallbackFrontal.hasFace) {
          return { success: false, reason: "FACE_NOT_FRONTAL", faceCount: 1 };
        }
      }

      return { success: true, reason: null, faceCount: 1 };
    }
  }

  const heuristic = detectFaceWithHeuristic(imageData);
  if (!heuristic.hasFace) {
    return { success: false, reason: heuristic.reason, faceCount: 0 };
  }

  return { success: true, reason: null, faceCount: 1 };
}

export async function validateFaceInImageData(imageData: ImageData): Promise<FaceValidationResult> {
  const canvas = document.createElement("canvas");
  canvas.width = imageData.width;
  canvas.height = imageData.height;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return { success: false, reason: "LOW_QUALITY", faceCount: 0 };
  }

  ctx.putImageData(imageData, 0, 0);
  return validateCanvasFace(canvas, imageData);
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
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);

      const result = await validateCanvasFace(canvas, imageData);
      resolve(result);
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
