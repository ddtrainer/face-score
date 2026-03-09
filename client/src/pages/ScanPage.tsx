import { useRef, useState, useCallback, useEffect } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, AlertCircle, RotateCcw, Camera, UserX, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { analyzeFaceFrames } from "@/lib/analysis";
import {
  validateFaceInImageData,
  validateFaceInFile,
  extractImageDataFromFile,
  getFailureMessage,
  type FaceFailureReason,
} from "@/lib/faceDetection";
import { useAppState } from "@/lib/appState";

type ScanPhase = "init" | "countdown" | "scanning" | "analyzing" | "done" | "failed";

export default function ScanPage() {
  const { setAnalysisResult, analysisResult } = useAppState();
  const [, setLocation] = useLocation();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [phase, setPhase] = useState<ScanPhase>("init");
  const [countdown, setCountdown] = useState(3);
  const [cameraError, setCameraError] = useState(false);
  const [failureReason, setFailureReason] = useState<FaceFailureReason | null>(null);
  const pendingNavRef = useRef(false);

  useEffect(() => {
    if (pendingNavRef.current && analysisResult) {
      pendingNavRef.current = false;
      setLocation("/result");
    }
  }, [analysisResult, setLocation]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      return true;
    } catch {
      setCameraError(true);
      return false;
    }
  }, []);

  const captureFrame = useCallback((): ImageData | null => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return null;

    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    canvas.width = video.videoWidth || 320;
    canvas.height = video.videoHeight || 240;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return ctx.getImageData(0, 0, canvas.width, canvas.height);
  }, []);

  const handleFailure = useCallback((reason: FaceFailureReason) => {
    setFailureReason(reason);
    setPhase("failed");
  }, []);

  const handleRetryFromFailure = useCallback(() => {
    setFailureReason(null);
    setPhase("init");
  }, []);

  const startScan = useCallback(async () => {
    const ok = await startCamera();
    if (!ok) return;

    setPhase("countdown");
    setCountdown(3);

    let count = 3;
    const countdownTimer = window.setInterval(() => {
      count -= 1;
      if (count <= 0) {
        clearInterval(countdownTimer);
        setPhase("scanning");

        const frames: ImageData[] = [];
        let captured = 0;
        const captureTimer = window.setInterval(() => {
          const frame = captureFrame();
          if (frame) frames.push(frame);
          captured += 1;

          if (captured >= 6) {
            clearInterval(captureTimer);
            stopCamera();
            setPhase("analyzing");

            (async () => {
              try {
                let passCount = 0;
                let failCount = 0;
                let lastFailReason: FaceFailureReason = "NO_FACE";

                for (const frameData of frames) {
                  const validation = await validateFaceInImageData(frameData);
                  if (validation.success) {
                    passCount++;
                  } else {
                    failCount++;
                    lastFailReason = validation.reason ?? "NO_FACE";
                    if (validation.reason === "MULTIPLE_FACES") {
                      handleFailure("MULTIPLE_FACES");
                      return;
                    }
                  }
                }

                const total = passCount + failCount;
                if (passCount < 2 && passCount <= failCount) {
                  handleFailure(lastFailReason);
                  return;
                }

                const result = await analyzeFaceFrames(frames);
                pendingNavRef.current = true;
                setAnalysisResult(result, true);
                setPhase("done");
              } catch {
                handleFailure("NO_FACE");
              }
            })();
          }
        }, 500);
      } else {
        setCountdown(count);
      }
    }, 1000);
  }, [startCamera, captureFrame, stopCamera, setAnalysisResult, handleFailure]);

  const handleFileUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = "";
      if (!file || !file.type.startsWith("image/")) return;

      setPhase("analyzing");

      try {
        const validation = await validateFaceInFile(file);
        if (!validation.success) {
          handleFailure(validation.reason ?? "NO_FACE");
          return;
        }

        const imageData = await extractImageDataFromFile(file);
        if (!imageData) {
          handleFailure("LOW_QUALITY");
          return;
        }

        const result = await analyzeFaceFrames([imageData]);
        pendingNavRef.current = true;
        setAnalysisResult(result, true);
        setPhase("done");
      } catch {
        handleFailure("NO_FACE");
      }
    },
    [setAnalysisResult, handleFailure],
  );

  const failureInfo = failureReason ? getFailureMessage(failureReason) : null;
  const FailureIcon = failureReason === "MULTIPLE_FACES" ? Users : UserX;

  return (
    <div className="max-w-lg mx-auto px-5 py-6 flex flex-col items-center min-h-[calc(100vh-140px)]">
      <canvas ref={canvasRef} className="hidden" />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileUpload}
        data-testid="input-file-fallback"
      />

      <AnimatePresence mode="wait">
        {phase === "failed" && failureInfo ? (
          <motion.div
            key="failure"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full max-w-[360px] flex flex-col items-center gap-6 py-8"
          >
            <div className="w-20 h-20 rounded-full bg-red-50 dark:bg-red-500/10 flex items-center justify-center">
              <FailureIcon className="w-10 h-10 text-red-400 dark:text-red-400" />
            </div>

            <Card className="w-full p-6 rounded-2xl border-0 text-center space-y-3">
              <h3 className="text-lg font-bold text-foreground" data-testid="text-failure-title">
                {failureInfo.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed" data-testid="text-failure-description">
                {failureInfo.description}
              </p>
              <p className="text-xs text-red-500/80 leading-relaxed" data-testid="text-human-face-only">
                사람 얼굴만 분석할 수 있어요. 동물, 캐릭터, 사물, 풍경 사진은 분석되지 않습니다.
              </p>
            </Card>

            <div className="w-full space-y-3">
              <Button
                className="w-full gap-2.5 h-14 text-[15px] font-semibold rounded-xl bg-gradient-to-r from-violet-600 to-indigo-500"
                onClick={() => {
                  handleRetryFromFailure();
                  if (!cameraError) {
                    setTimeout(() => startScan(), 100);
                  }
                }}
                data-testid="button-retry-scan"
              >
                <Camera className="w-5 h-5" />
                다시 촬영하기
              </Button>
              <Button
                variant="secondary"
                className="w-full gap-2.5 h-14 text-[15px] font-semibold rounded-xl"
                onClick={() => {
                  handleRetryFromFailure();
                  setTimeout(() => fileInputRef.current?.click(), 100);
                }}
                data-testid="button-retry-upload"
              >
                <Upload className="w-5 h-5" />
                다른 사진 업로드하기
              </Button>
              <div className="flex justify-center">
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-2 text-muted-foreground"
                  onClick={handleRetryFromFailure}
                  data-testid="button-back-to-init"
                >
                  <RotateCcw className="w-4 h-4" />
                  처음으로 돌아가기
                </Button>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div key="scanner" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full flex flex-col items-center">
            <div className="relative w-full max-w-[320px] aspect-[3/4] rounded-3xl overflow-hidden bg-gray-900 mb-6">
              <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover scale-x-[-1]" data-testid="video-camera" />

              {phase === "init" && !cameraError && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80 px-6">
                  <p className="text-white/70 text-sm font-medium text-center">사람 얼굴을 정면으로 두고 시작해 주세요.</p>
                </div>
              )}

              {phase === "init" && cameraError && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-gray-900/90 px-6">
                  <AlertCircle className="w-10 h-10 text-amber-400" />
                  <p className="text-white/80 text-sm font-medium text-center">카메라를 사용할 수 없어요.</p>
                  <p className="text-white/50 text-xs text-center">사진 업로드로 분석할 수 있어요.</p>
                </div>
              )}

              {phase === "countdown" && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40">
                  <span className="text-8xl font-extrabold text-white drop-shadow-lg" data-testid="text-countdown">{countdown}</span>
                </div>
              )}

              {phase === "scanning" && (
                <div className="absolute inset-0 flex items-end justify-center pb-10">
                  <p className="text-white text-sm font-bold drop-shadow-lg" data-testid="text-scanning">스캔 중...</p>
                </div>
              )}

              {phase === "analyzing" && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/60">
                  <p className="text-white text-sm font-bold" data-testid="text-analyzing">얼굴을 분석하고 있어요</p>
                  <p className="text-white/60 text-xs">맞춤 코칭을 준비 중이에요</p>
                </div>
              )}
            </div>

            <div className="w-full max-w-[320px] space-y-3">
              {phase === "init" && (
                <div className="space-y-3">
                  {!cameraError && (
                    <Button className="w-full gap-2.5 h-14 text-[15px] font-semibold rounded-xl bg-gradient-to-r from-violet-600 to-indigo-500" onClick={startScan} data-testid="button-start-scan">
                      3초 셀피 스캔 시작
                    </Button>
                  )}
                  <Button
                    variant={cameraError ? "default" : "secondary"}
                    className={`w-full gap-2.5 h-14 text-[15px] font-semibold rounded-xl ${cameraError ? "bg-gradient-to-r from-violet-600 to-indigo-500" : ""}`}
                    onClick={() => fileInputRef.current?.click()}
                    data-testid="button-upload-fallback"
                  >
                    <Upload className="w-5 h-5" />
                    사진 업로드로 분석하기
                  </Button>
                  <p className="text-xs text-center text-muted-foreground" data-testid="text-human-face-notice">
                    사람 얼굴이 선명한 사진만 분석 가능합니다.
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
