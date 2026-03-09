interface FaceDetectionResult {
  hasFace: boolean;
}

async function detectFaceWithAPI(source: HTMLCanvasElement | HTMLImageElement): Promise<FaceDetectionResult | null> {
  if (typeof window === "undefined" || !("FaceDetector" in window)) {
    return null;
  }

  try {
    const detector = new (window as any).FaceDetector({ fastMode: true, maxDetectedFaces: 1 });
    const faces = await detector.detect(source);
    return { hasFace: faces.length > 0 };
  } catch {
    return null;
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

function detectFaceWithHeuristic(imageData: ImageData): FaceDetectionResult {
  const { data, width, height } = imageData;
  const totalPixels = width * height;
  let skinPixels = 0;
  let skinSumX = 0;
  let skinSumY = 0;
  let redDom = 0;
  let greenDom = 0;
  let blueDom = 0;

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

  if (greenRatio > 0.30) return { hasFace: false };
  if (blueRatio > 0.35) return { hasFace: false };
  if (redRatio > 0.25) return { hasFace: false };

  if (skinRatio < 0.12) return { hasFace: false };

  if (skinPixels > 0) {
    const avgX = skinSumX / skinPixels;
    const avgY = skinSumY / skinPixels;
    const centerX = width / 2;
    const centerY = height / 2;
    const distX = Math.abs(avgX - centerX) / width;
    const distY = Math.abs(avgY - centerY) / height;
    if (distX > 0.35 || distY > 0.40) return { hasFace: false };
  }

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
  if (centerSkinRatio < 0.15) return { hasFace: false };

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
  const darkRatio = eyeArea > 0 ? darkRegions / eyeArea : 0;
  if (darkRatio < 0.02) return { hasFace: false };

  return { hasFace: true };
}

export async function detectFaceInCanvas(canvas: HTMLCanvasElement): Promise<FaceDetectionResult> {
  const apiResult = await detectFaceWithAPI(canvas);
  if (apiResult !== null) return apiResult;

  const ctx = canvas.getContext("2d");
  if (!ctx) return { hasFace: false };
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  return detectFaceWithHeuristic(imageData);
}

export async function detectFaceInImageData(imageData: ImageData): Promise<FaceDetectionResult> {
  const canvas = document.createElement("canvas");
  canvas.width = imageData.width;
  canvas.height = imageData.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return { hasFace: false };
  ctx.putImageData(imageData, 0, 0);

  const apiResult = await detectFaceWithAPI(canvas);
  if (apiResult !== null) return apiResult;

  return detectFaceWithHeuristic(imageData);
}

export async function detectFaceInFile(file: File): Promise<FaceDetectionResult> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = async () => {
      const canvas = document.createElement("canvas");
      canvas.width = Math.min(img.width, 640);
      canvas.height = Math.min(img.height, 640);
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        URL.revokeObjectURL(url);
        resolve({ hasFace: false });
        return;
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);

      const apiResult = await detectFaceWithAPI(canvas);
      if (apiResult !== null) {
        resolve(apiResult);
        return;
      }

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      resolve(detectFaceWithHeuristic(imageData));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve({ hasFace: false });
    };
    img.src = url;
  });
}
