interface FaceDetectionResult {
  hasFace: boolean;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("이미지를 불러올 수 없어요."));
    img.src = src;
  });
}

async function detectWithBrowserAPI(img: HTMLImageElement): Promise<boolean | null> {
  if (!("FaceDetector" in window)) return null;

  try {
    const detector = new (window as any).FaceDetector();
    const faces = await detector.detect(img);
    return faces.length > 0;
  } catch {
    return null;
  }
}

function isSkinTone(r: number, g: number, b: number): boolean {
  if (r < 80 || g < 30 || b < 15) return false;
  if (r <= g || r <= b) return false;
  if (r - g < 8) return false;
  if (r - b < 12) return false;

  const lum = 0.299 * r + 0.587 * g + 0.114 * b;
  if (lum < 50 || lum > 240) return false;

  const sum = r + g + b;
  const rn = r / sum;
  const gn = g / sum;
  if (rn < 0.33 || rn > 0.58) return false;
  if (gn < 0.18 || gn > 0.42) return false;

  return true;
}

function detectWithCanvas(img: HTMLImageElement): boolean {
  const canvas = document.createElement("canvas");
  const maxSize = 200;
  const scale = Math.min(maxSize / img.width, maxSize / img.height, 1);
  canvas.width = Math.round(img.width * scale);
  canvas.height = Math.round(img.height * scale);

  const ctx = canvas.getContext("2d");
  if (!ctx) return true;

  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  const fullData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = fullData.data;
  const totalPixels = canvas.width * canvas.height;

  let skinPixels = 0;
  let greenDominant = 0;
  let blueDominant = 0;
  let veryBrightRed = 0;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    if (isSkinTone(r, g, b)) skinPixels++;
    if (g > r + 20 && g > b + 20 && g > 80) greenDominant++;
    if (b > r + 20 && b > g + 20 && b > 80) blueDominant++;
    if (r > 200 && g < 80 && b < 80) veryBrightRed++;
  }

  const skinRatio = skinPixels / totalPixels;
  const greenRatio = greenDominant / totalPixels;
  const blueRatio = blueDominant / totalPixels;
  const redRatio = veryBrightRed / totalPixels;

  if (greenRatio > 0.35) return false;
  if (blueRatio > 0.35) return false;
  if (redRatio > 0.25) return false;

  if (skinRatio >= 0.15) return true;

  return false;
}

export async function detectFace(imageUrl: string): Promise<FaceDetectionResult> {
  try {
    const img = await loadImage(imageUrl);

    const browserResult = await detectWithBrowserAPI(img);
    if (browserResult !== null) {
      return { hasFace: browserResult };
    }

    const canvasResult = detectWithCanvas(img);
    return { hasFace: canvasResult };
  } catch {
    return { hasFace: true };
  }
}
