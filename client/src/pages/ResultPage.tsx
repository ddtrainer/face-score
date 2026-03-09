import { useEffect } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { RotateCcw, Save, Home, Lightbulb, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import ScoreCircle from "@/components/ScoreCircle";
import TraitBar from "@/components/TraitBar";
import { useAppState } from "@/lib/appState";
import { useToast } from "@/hooks/use-toast";

export default function ResultPage() {
  const { analysisResult, imageUrl, saveCurrentResult, clearAnalysisResult } = useAppState();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    if (!analysisResult) {
      setLocation("/");
    }
  }, [analysisResult, setLocation]);

  if (!analysisResult) {
    return null;
  }

  const handleSave = () => {
    const saved = saveCurrentResult();
    if (saved) {
      toast({ title: "저장 완료", description: "기록 화면에서 확인할 수 있어요." });
    } else {
      toast({ title: "이미 저장되었어요!" });
    }
  };

  const handleRetry = () => {
    clearAnalysisResult();
    setLocation("/");
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
      {imageUrl && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="w-full aspect-[4/3] rounded-md overflow-hidden bg-muted"
        >
          <img
            src={imageUrl}
            alt="분석된 사진"
            className="w-full h-full object-cover"
            data-testid="img-uploaded-photo"
          />
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex flex-col items-center"
      >
        <p className="text-sm text-muted-foreground mb-3">오늘의 인상 점수</p>
        <ScoreCircle score={analysisResult.totalScore} size="lg" />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="p-5 space-y-4">
          <h3 className="text-sm font-semibold">세부 분석</h3>
          <div className="space-y-4">
            <TraitBar label="친근함" score={analysisResult.friendliness} icon="😊" delay={0.5} />
            <TraitBar label="생기" score={analysisResult.vitality} icon="✨" delay={0.65} />
            <TraitBar label="자신감" score={analysisResult.confidence} icon="💪" delay={0.8} />
          </div>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <Card className="p-5">
          <p className="text-sm font-medium leading-relaxed" data-testid="text-summary">
            {analysisResult.summary}
          </p>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        <Card className="p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold">더 좋은 인상을 위한 팁</h3>
          </div>
          <ul className="space-y-2.5" data-testid="list-tips">
            {analysisResult.tips.map((tip, i) => (
              <li key={i} className="flex gap-2.5 text-sm text-muted-foreground">
                <span className="text-primary font-bold shrink-0">{i + 1}.</span>
                <span className="leading-relaxed">{tip}</span>
              </li>
            ))}
          </ul>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.85 }}
        className="flex items-center gap-1.5 text-xs text-muted-foreground justify-center"
        data-testid="text-disclaimer"
      >
        <Info className="w-3.5 h-3.5 shrink-0" />
        <span>이 결과는 참고용 분석이며 의학적 진단이 아닙니다.</span>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
        className="flex gap-3 pb-4"
      >
        <Button
          variant="secondary"
          className="flex-1 gap-2"
          onClick={handleRetry}
          data-testid="button-retry"
        >
          <RotateCcw className="w-4 h-4" />
          다시 촬영
        </Button>
        <Button
          className="flex-1 gap-2"
          onClick={handleSave}
          data-testid="button-save"
        >
          <Save className="w-4 h-4" />
          저장하기
        </Button>
      </motion.div>

      <div className="flex justify-center pb-6">
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 text-muted-foreground"
          onClick={() => setLocation("/")}
          data-testid="button-go-home"
        >
          <Home className="w-4 h-4" />
          홈으로 가기
        </Button>
      </div>
    </div>
  );
}
