// 여기에 실제 AI 얼굴 감지 API 연결 가능
// Replace this with a real face detection API for production use

interface FaceDetectionResult {
  hasFace: boolean;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
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

function detectWithSkinTone(img: HTMLImageElement): boolean {
  const canvas = document.createElement("canvas");
  const maxSize = 200;
  const scale = Math.min(maxSize / img.width, maxSize / img.height, 1);
  canvas.width = Math.round(img.width * scale);
  canvas.height = Math.round(img.height * scale);

  const ctx = canvas.getContext("2d");
  if (!ctx) return false;

  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  const centerX = Math.round(canvas.width * 0.25);
  const centerY = Math.round(canvas.height * 0.15);
  const regionW = Math.round(canvas.width * 0.5);
  const regionH = Math.round(canvas.height * 0.5);

  const imageData = ctx.getImageData(centerX, centerY, regionW, regionH);
  const data = imageData.data;
  const totalPixels = regionW * regionH;

  let skinPixels = 0;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    if (isSkinTone(r, g, b)) {
      skinPixels++;
    }
  }

  const skinRatio = skinPixels / totalPixels;
  return skinRatio > 0.15;
}

function isSkinTone(r: number, g: number, b: number): boolean {
  if (r > 95 && g > 40 && b > 20) {
    if (r > g && r > b) {
      if (Math.abs(r - g) > 15) {
        if (r - b > 15 && g - b > 0) {
          return true;
        }
      }
    }
  }

  if (r > 60 && g > 40 && b > 30) {
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    if (max - min > 15 && max - min < 130) {
      if (r > g - 10 && r > b) {
        return true;
      }
    }
  }

  return false;
}

export async function detectFace(imageUrl: string): Promise<FaceDetectionResult> {
  try {
    const img = await loadImage(imageUrl);

    const browserResult = await detectWithBrowserAPI(img);
    if (browserResult !== null) {
      return { hasFace: browserResult };
    }

    const skinResult = detectWithSkinTone(img);
    return { hasFace: skinResult };
  } catch {
    return { hasFace: true };
  }
}
