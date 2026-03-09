import { useEffect } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { RotateCcw, Save, Home, Lightbulb, Info, Check, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import ScoreCircle from "@/components/ScoreCircle";
import TraitBar from "@/components/TraitBar";
import { useAppState } from "@/lib/appState";
import { useToast } from "@/hooks/use-toast";

export default function ResultPage() {
  const { analysisResult, saveCurrentResult, clearAnalysisResult } = useAppState();
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
      toast({ title: "저장 완료!", description: "기록 탭에서 나의 변화를 확인해 보세요." });
    } else {
      toast({ title: "이미 저장된 결과예요!" });
    }
  };

  const handleRetry = () => {
    clearAnalysisResult();
    setLocation("/scan");
  };

  return (
    <div className="max-w-lg mx-auto px-5 py-6 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col items-center py-2"
      >
        <p className="text-[11px] font-semibold text-violet-500 uppercase tracking-widest mb-4">오늘의 인상 코칭</p>
        <ScoreCircle score={analysisResult.totalScore} size="lg" />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="p-6 rounded-2xl space-y-5 border-0">
          <h3 className="text-base font-bold">세부 분석</h3>
          <div className="space-y-5">
            <TraitBar label="친근함" score={analysisResult.friendliness} icon="smile" delay={0.4} />
            <TraitBar label="생기" score={analysisResult.vitality} icon="zap" delay={0.55} />
            <TraitBar label="자신감" score={analysisResult.confidence} icon="trophy" delay={0.7} />
            <TraitBar label="안정감" score={analysisResult.stability} icon="heart" delay={0.85} />
          </div>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Card className="p-6 rounded-2xl border-0 bg-gradient-to-br from-violet-50 to-indigo-50/50 dark:from-violet-500/5 dark:to-indigo-500/5">
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-violet-100 dark:bg-violet-500/15 flex items-center justify-center shrink-0 mt-0.5">
              <Check className="w-4 h-4 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <p className="text-xs font-semibold text-violet-500 mb-1">오늘의 인상 총평</p>
              <p className="text-[15px] font-medium leading-relaxed" data-testid="text-summary">
                {analysisResult.summary}
              </p>
            </div>
          </div>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <Card className="p-6 rounded-2xl space-y-4 border-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-500/15 flex items-center justify-center">
              <Lightbulb className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            </div>
            <h3 className="text-base font-bold">오늘의 코칭 팁</h3>
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
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        <Card className="p-6 rounded-2xl border-0 bg-gradient-to-br from-emerald-50 to-teal-50/50 dark:from-emerald-500/5 dark:to-teal-500/5">
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-500/15 flex items-center justify-center shrink-0 mt-0.5">
              <Target className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-1">내일의 미션</p>
              <p className="text-[15px] font-medium leading-relaxed" data-testid="text-mission">
                {analysisResult.mission}
              </p>
            </div>
          </div>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="flex items-center justify-center gap-2 text-xs text-muted-foreground/60"
        data-testid="text-disclaimer"
      >
        <Info className="w-3.5 h-3.5 shrink-0" />
        <span>이 결과는 재미와 자기관리를 위한 참고용이에요</span>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.85 }}
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
            다시 스캔
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
