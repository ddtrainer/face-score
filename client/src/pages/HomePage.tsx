import { useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Camera, Upload, Shield, ArrowRight } from "lucide-react";
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
  const { toast } = useToast();

  const handleImageSelected = useCallback(
    async (file: File) => {
      const imageUrl = URL.createObjectURL(file);
      setIsAnalyzing(true);

      try {
        await new Promise((resolve) => setTimeout(resolve, 1500 + Math.random() * 1000));
        // 여기에 실제 AI API 연결 가능
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
      }
    },
    [setAnalysisResult, setIsAnalyzing, setLocation, toast]
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast({
          title: "잘못된 파일 형식",
          description: "이미지 파일만 업로드할 수 있어요.",
          variant: "destructive",
        });
        return;
      }
      handleImageSelected(file);
    }
  };

  return (
    <>
      {isAnalyzing && <LoadingOverlay />}
      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center space-y-3 pt-4"
        >
          <h2
            className="text-3xl font-bold tracking-tight"
            data-testid="text-main-copy"
          >
            당신의 인상은 몇 점?
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-sm mx-auto" data-testid="text-description">
            AI가 매일 당신의 얼굴 표정(인상)을 분석해
            <br />
            점수로 보여주고, 더 좋은 인상을 만드는
            <br />
            방법까지 알려드립니다.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
        >
          <Card className="p-6 space-y-4">
            <div className="text-center space-y-1">
              <p className="text-sm font-medium">사진을 올려주세요</p>
              <p className="text-xs text-muted-foreground">셀카 또는 정면 사진이 좋아요</p>
            </div>

            <div className="flex gap-3">
              <Button
                className="flex-1 gap-2"
                size="lg"
                onClick={() => fileInputRef.current?.click()}
                data-testid="button-upload"
              >
                <Upload className="w-4 h-4" />
                사진 업로드
              </Button>
              <Button
                className="flex-1 gap-2"
                size="lg"
                variant="secondary"
                onClick={() => cameraInputRef.current?.click()}
                data-testid="button-camera"
              >
                <Camera className="w-4 h-4" />
                카메라 촬영
              </Button>
            </div>

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
              capture="user"
              className="hidden"
              onChange={handleFileChange}
              data-testid="input-camera-capture"
            />
          </Card>
        </motion.div>

        {latestRecord && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card className="p-5 hover-elevate cursor-pointer" onClick={() => setLocation("/history")} data-testid="card-latest-score">
              <div className="flex items-center gap-4">
                <ScoreCircle score={latestRecord.totalScore} size="sm" animated={false} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground mb-0.5">최근 분석 결과</p>
                  <p className="text-sm font-medium truncate">{latestRecord.summary}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(latestRecord.date).toLocaleDateString("ko-KR", {
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
              </div>
            </Card>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.45 }}
          className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground"
          data-testid="text-privacy-notice"
        >
          <Shield className="w-3.5 h-3.5" />
          <span>사진은 기본적으로 저장되지 않습니다.</span>
        </motion.div>
      </div>
    </>
  );
}
