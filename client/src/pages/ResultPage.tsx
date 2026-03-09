import { useEffect } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { RotateCcw, Save, Home, Lightbulb, Info, Check } from "lucide-react";
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
    <div className="max-w-lg mx-auto px-5 py-6 space-y-6">
      {imageUrl && (
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="w-full aspect-[4/3] rounded-2xl overflow-hidden bg-gray-100 dark:bg-muted"
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
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex flex-col items-center py-2"
      >
        <p className="text-[11px] font-semibold text-violet-500 uppercase tracking-widest mb-4">오늘의 인상 점수</p>
        <ScoreCircle score={analysisResult.totalScore} size="lg" />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="p-6 rounded-2xl space-y-5 border-0">
          <h3 className="text-base font-bold">세부 분석</h3>
          <div className="space-y-5">
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
        <Card className="p-6 rounded-2xl border-0 bg-gradient-to-br from-violet-50 to-indigo-50/50 dark:from-violet-500/5 dark:to-indigo-500/5">
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-violet-100 dark:bg-violet-500/15 flex items-center justify-center shrink-0 mt-0.5">
              <Check className="w-4 h-4 text-violet-600 dark:text-violet-400" />
            </div>
            <p className="text-[15px] font-medium leading-relaxed" data-testid="text-summary">
              {analysisResult.summary}
            </p>
          </div>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        <Card className="p-6 rounded-2xl space-y-4 border-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-500/15 flex items-center justify-center">
              <Lightbulb className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            </div>
            <h3 className="text-base font-bold">인상 코칭 팁</h3>
          </div>
          <ul className="space-y-3.5" data-testid="list-tips">
            {analysisResult.tips.map((tip, i) => (
              <li key={i} className="flex gap-3 items-start">
                <span className="w-6 h-6 rounded-full bg-violet-100 dark:bg-violet-500/15 flex items-center justify-center text-xs font-bold text-violet-600 dark:text-violet-400 shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <span className="text-[14px] leading-relaxed text-muted-foreground">{tip}</span>
              </li>
            ))}
          </ul>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.85 }}
        className="flex items-center justify-center gap-2 text-xs text-muted-foreground/60"
        data-testid="text-disclaimer"
      >
        <Info className="w-3.5 h-3.5 shrink-0" />
        <span>이 결과는 참고용 분석이며 의학적 진단이 아닙니다</span>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
        className="space-y-3 pb-6"
      >
        <div className="flex gap-3">
          <Button
            variant="secondary"
            className="flex-1 gap-2.5 h-14 text-[15px] font-semibold rounded-xl"
            onClick={handleRetry}
            data-testid="button-retry"
          >
            <RotateCcw className="w-4 h-4" />
            다시 촬영
          </Button>
          <Button
            className="flex-1 gap-2.5 h-14 text-[15px] font-semibold rounded-xl bg-gradient-to-r from-violet-600 to-indigo-500"
            onClick={handleSave}
            data-testid="button-save"
          >
            <Save className="w-4 h-4" />
            저장하기
          </Button>
        </div>

        <div className="flex justify-center">
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
      </motion.div>
    </div>
  );
}
