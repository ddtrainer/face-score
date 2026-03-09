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
import { useToast } from "@/hooks/use-toast";

type ScanPhase = "init" | "countdown" | "scanning" | "analyzing" | "done" | "failed";

export default function ScanPage() {
  const { setAnalysisResult, analysisResult } = useAppState();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [phase, setPhase] = useState<ScanPhase>("init");
  const [countdown, setCountdown] = useState(3);
  const [cameraError, setCameraError] = useState(false);
  const [failureReason, setFailureReason] = useState<FaceFailureReason | null>(null);
  const pendingNavRef = useRef(false);
  const intervalsRef = useRef<number[]>([]);

  useEffect(() => {
    if (pendingNavRef.current && analysisResult) {
      pendingNavRef.current = false;
      setLocation("/result");
    }
  }, [analysisResult, setLocation]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      stopCamera();
      intervalsRef.current.forEach((id) => clearInterval(id));
      intervalsRef.current = [];
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

    let c = 3;
    const countdownInterval = window.setInterval(() => {
      c -= 1;
      if (c <= 0) {
        clearInterval(countdownInterval);
        setPhase("scanning");

        const frames: ImageData[] = [];
        let captureCount = 0;
        const captureInterval = window.setInterval(() => {
          const frame = captureFrame();
          if (frame) frames.push(frame);
          captureCount++;
          if (captureCount >= 6) {
            clearInterval(captureInterval);
            stopCamera();
            setPhase("analyzing");

            (async () => {
              try {
                // 하드 게이트: 모든 프레임에서 얼굴 검증 수행
                let passCount = 0;
                let failCount = 0;
                let lastFailReason: FaceFailureReason = "NO_FACE";

                for (const frame of frames) {
                  const validation = await validateFaceInImageData(frame);
                  if (validation.success) {
                    passCount++;
                  } else {
                    failCount++;
                    lastFailReason = validation.reason ?? "NO_FACE";
                    // MULTIPLE_FACES는 즉시 실패 — 여러 얼굴은 한 프레임이라도 허용 불가
                    if (validation.reason === "MULTIPLE_FACES") {
                      handleFailure("MULTIPLE_FACES");
                      return;
                    }
                  }
                }

                // 과반수 이상의 프레임에서 얼굴이 검증되어야 통과
                const total = passCount + failCount;
                if (passCount === 0 || passCount < Math.ceil(total / 2)) {
                  handleFailure(lastFailReason);
                  return;
                }

                // 검증 성공 → 분석 실행 허용
                const result = await analyzeFaceFrames(frames);
                pendingNavRef.current = true;
                setAnalysisResult(result);
                setPhase("done");
              } catch {
                handleFailure("NO_FACE");
              }
            })();
          }
        }, 500);
      } else {
        setCountdown(c);
      }
    }, 1000);
    intervalsRef.current.push(countdownInterval);
  }, [startCamera, captureFrame, stopCamera, setAnalysisResult, handleFailure]);

  const handleFileUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = "";
      if (!file || !file.type.startsWith("image/")) return;

      setPhase("analyzing");

      try {
        // 하드 게이트: 얼굴 검증을 먼저 수행
        const validation = await validateFaceInFile(file);
        if (!validation.success) {
          // 검증 실패 → 분석 중단, 점수 생성 금지
          handleFailure(validation.reason ?? "NO_FACE");
          return;
        }

        // 검증 성공 → 이미지 데이터를 추출하여 분석에 전달
        const imageData = await extractImageDataFromFile(file);
        if (!imageData) {
          handleFailure("LOW_QUALITY");
          return;
        }

        // 분석 실행 (실제 이미지 데이터를 전달)
        const result = await analyzeFaceFrames([imageData]);
        pendingNavRef.current = true;
        setAnalysisResult(result);
        setPhase("done");
      } catch {
        handleFailure("NO_FACE");
      }
    },
    [setAnalysisResult, handleFailure]
  );

  const failureInfo = failureReason ? getFailureMessage(failureReason) : null;
  const failureIcon = failureReason === "MULTIPLE_FACES" ? Users : UserX;
  const FailureIconComponent = failureIcon;

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
              <FailureIconComponent className="w-10 h-10 text-red-400 dark:text-red-400" />
            </div>

            <Card className="w-full p-6 rounded-2xl border-0 text-center space-y-3">
              <h3 className="text-lg font-bold text-foreground" data-testid="text-failure-title">
                {failureInfo.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed" data-testid="text-failure-description">
                {failureInfo.description}
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
                  onClick={() => {
                    handleRetryFromFailure();
                  }}
                  data-testid="button-back-to-init"
                >
                  <RotateCcw className="w-4 h-4" />
                  처음으로 돌아가기
                </Button>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="scanner"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full flex flex-col items-center"
          >
            <div className="relative w-full max-w-[320px] aspect-[3/4] rounded-3xl overflow-hidden bg-gray-900 mb-6">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="absolute inset-0 w-full h-full object-cover scale-x-[-1]"
                data-testid="video-camera"
              />

              {phase === "init" && !cameraError && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80">
                  <p className="text-white/70 text-sm font-medium text-center px-6">
                    아래 버튼을 눌러 스캔을 시작하세요
                  </p>
                </div>
              )}

              {phase === "init" && cameraError && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-gray-900/90 px-6">
                  <AlertCircle className="w-10 h-10 text-amber-400" />
                  <p className="text-white/80 text-sm font-medium text-center">
                    카메라를 사용할 수 없어요
                  </p>
                  <p className="text-white/50 text-xs text-center">
                    사진 업로드로 분석할 수 있어요
                  </p>
                </div>
              )}

              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-8 left-8 w-12 h-12 border-t-2 border-l-2 border-white/40 rounded-tl-2xl" />
                <div className="absolute top-8 right-8 w-12 h-12 border-t-2 border-r-2 border-white/40 rounded-tr-2xl" />
                <div className="absolute bottom-8 left-8 w-12 h-12 border-b-2 border-l-2 border-white/40 rounded-bl-2xl" />
                <div className="absolute bottom-8 right-8 w-12 h-12 border-b-2 border-r-2 border-white/40 rounded-br-2xl" />
              </div>

              <AnimatePresence>
                {phase === "countdown" && (
                  <motion.div
                    key="countdown"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 flex flex-col items-center justify-center bg-black/40"
                  >
                    <motion.span
                      key={countdown}
                      initial={{ scale: 2, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.5, opacity: 0 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      className="text-8xl font-extrabold text-white drop-shadow-lg"
                      data-testid="text-countdown"
                    >
                      {countdown}
                    </motion.span>
                    <p className="text-white/80 text-sm font-medium mt-4" data-testid="text-scan-guide">
                      카메라를 바라보고 자연스럽게 표정을 유지하세요
                    </p>
                  </motion.div>
                )}

                {phase === "scanning" && (
                  <motion.div
                    key="scanning"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 flex flex-col items-center justify-end pb-12"
                  >
                    <motion.div
                      className="absolute inset-4 rounded-2xl border-2 border-violet-400/60"
                      animate={{ opacity: [0.4, 1, 0.4] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    />
                    <motion.div
                      className="absolute left-4 right-4 h-0.5 bg-gradient-to-r from-transparent via-violet-400 to-transparent"
                      animate={{ top: ["10%", "90%", "10%"] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    />
                    <p className="text-white text-sm font-bold drop-shadow-lg" data-testid="text-scanning">
                      스캔 중...
                    </p>
                  </motion.div>
                )}

                {phase === "analyzing" && (
                  <motion.div
                    key="analyzing"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/60"
                  >
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      className="w-16 h-16 rounded-full"
                      style={{
                        background: "conic-gradient(from 0deg, #8b5cf6, #6366f1, #3b82f6, #8b5cf6)",
                        padding: 3,
                      }}
                    >
                      <div className="w-full h-full rounded-full bg-gray-900 flex items-center justify-center">
                        <div className="w-3 h-3 rounded-full bg-violet-400" />
                      </div>
                    </motion.div>
                    <p className="text-white text-sm font-bold" data-testid="text-analyzing">
                      인상을 분석하고 있어요
                    </p>
                    <p className="text-white/60 text-xs">맞춤 코칭을 준비 중이에요</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="w-full max-w-[320px] space-y-3">
              <AnimatePresence mode="wait">
                {phase === "init" && (
                  <motion.div
                    key="buttons"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    className="space-y-3"
                  >
                    {!cameraError && (
                      <Button
                        className="w-full gap-2.5 h-14 text-[15px] font-semibold rounded-xl bg-gradient-to-r from-violet-600 to-indigo-500"
                        onClick={startScan}
                        data-testid="button-start-scan"
                      >
                        3초 셀피 스캔 시작
                      </Button>
                    )}
                    <Button
                      variant={cameraError ? "default" : "secondary"}
                      className={`w-full gap-2.5 h-14 text-[15px] font-semibold rounded-xl ${
                        cameraError ? "bg-gradient-to-r from-violet-600 to-indigo-500" : ""
                      }`}
                      onClick={() => fileInputRef.current?.click()}
                      data-testid="button-upload-fallback"
                    >
                      <Upload className="w-5 h-5" />
                      사진 업로드로 분석하기
                    </Button>
                  </motion.div>
                )}

                {(phase === "countdown" || phase === "scanning") && (
                  <motion.p
                    key="guide"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center text-sm text-muted-foreground"
                  >
                    자연스럽게 카메라를 바라보세요
                  </motion.p>
                )}

                {phase === "analyzing" && (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex justify-center gap-2 py-4"
                  >
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        animate={{ y: [0, -8, 0] }}
                        transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.15 }}
                        className="w-3 h-3 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500"
                      />
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
