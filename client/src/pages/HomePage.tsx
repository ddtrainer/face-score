import { useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Camera, Upload, Shield, ChevronRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import ScoreCircle from "@/components/ScoreCircle";
import LoadingOverlay from "@/components/LoadingOverlay";
import { analyzeFaceMock } from "@/lib/analysis";
import { useAppState } from "@/lib/appState";
import { useToast } from "@/hooks/use-toast";

export default function HomePage() {
  const { isAnalyzing, setIsAnalyzing, setAnalysisResult, latestRecord } = useAppState();
  const [, setLocation] = useLocation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const processingRef = useRef(false);
  const { toast } = useToast();

  const handleImageSelected = useCallback(
    async (file: File) => {
      if (processingRef.current) return;
      processingRef.current = true;

      const imageUrl = URL.createObjectURL(file);
      setIsAnalyzing(true);

      try {
        await new Promise((resolve) => setTimeout(resolve, 1500 + Math.random() * 1000));
        const result = await analyzeFaceMock();
        setAnalysisResult(result, imageUrl);
        setLocation("/result");
      } catch {
        toast({
          title: "분석 실패",
          description: "사진 분석 중 문제가 발생했어요. 다시 시도해 주세요.",
          variant: "destructive",
        });
      } finally {
        setIsAnalyzing(false);
        processingRef.current = false;
      }
    },
    [setAnalysisResult, setIsAnalyzing, setLocation, toast]
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (!file.type.startsWith("image/")) {
        toast({
          title: "잘못된 파일 형식",
          description: "이미지 파일만 업로드할 수 있어요.",
          variant: "destructive",
        });
        e.target.value = "";
        return;
      }

      handleImageSelected(file);
      e.target.value = "";
    },
    [handleImageSelected, toast]
  );

  const openFileUpload = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
      fileInputRef.current.click();
    }
  }, []);

  const openCamera = useCallback(() => {
    if (cameraInputRef.current) {
      cameraInputRef.current.value = "";
      cameraInputRef.current.click();
    }
  }, []);

  return (
    <>
      {isAnalyzing && <LoadingOverlay />}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
        data-testid="input-file-upload"
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
        data-testid="input-camera-capture"
      />

      <div className="max-w-lg mx-auto px-5 py-8 space-y-7">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center space-y-4 pt-2"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
            className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center mx-auto mb-2"
          >
            <Sparkles className="w-7 h-7 text-white" />
          </motion.div>
          <h2
            className="text-[28px] font-extrabold tracking-tight leading-tight"
            data-testid="text-main-copy"
          >
            당신의 인상은 몇 점?
          </h2>
          <p className="text-[15px] text-muted-foreground leading-relaxed max-w-[280px] mx-auto" data-testid="text-description">
            AI가 매일 당신의 표정을 분석해 점수와 맞춤 코칭을 제공해요.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="p-7 rounded-2xl space-y-5 border-0 bg-gradient-to-b from-violet-50 to-white dark:from-violet-500/5 dark:to-card">
            <div className="text-center space-y-1">
              <p className="text-base font-bold">사진을 올려주세요</p>
              <p className="text-xs text-muted-foreground">셀카 또는 정면 사진이 좋아요</p>
            </div>

            <div className="flex gap-3">
              <Button
                className="flex-1 gap-2.5 h-14 text-[15px] font-semibold rounded-xl bg-gradient-to-r from-violet-600 to-indigo-500"
                onClick={openFileUpload}
                data-testid="button-upload"
              >
                <Upload className="w-5 h-5" />
                사진 업로드
              </Button>
              <Button
                className="flex-1 gap-2.5 h-14 text-[15px] font-semibold rounded-xl"
                variant="secondary"
                onClick={openCamera}
                data-testid="button-camera"
              >
                <Camera className="w-5 h-5" />
                카메라 촬영
              </Button>
            </div>
          </Card>
        </motion.div>

        {latestRecord && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.35 }}
          >
            <Card
              className="p-5 rounded-2xl hover-elevate cursor-pointer border-0"
              onClick={() => setLocation("/history")}
              data-testid="card-latest-score"
            >
              <div className="flex items-center gap-4">
                <ScoreCircle score={latestRecord.totalScore} size="sm" animated={false} />
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-semibold text-violet-500 uppercase tracking-wide mb-0.5">최근 결과</p>
                  <p className="text-sm font-semibold truncate">{latestRecord.summary}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(latestRecord.date).toLocaleDateString("ko-KR", {
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground/50 shrink-0" />
              </div>
            </Card>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="flex items-center justify-center gap-2 text-xs text-muted-foreground/70 pb-2"
          data-testid="text-privacy-notice"
        >
          <Shield className="w-3.5 h-3.5" />
          <span>사진은 기본적으로 저장되지 않습니다</span>
        </motion.div>
      </div>
    </>
  );
}
