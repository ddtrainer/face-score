import { useEffect } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { RotateCcw, Save, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import ScoreCircle from "@/components/ScoreCircle";
import TraitBar from "@/components/TraitBar";
import { useAppState } from "@/lib/appState";
import { useToast } from "@/hooks/use-toast";

export default function ResultPage() {
  const { analysisResult, canViewResult, saveCurrentResult, clearAnalysisResult } = useAppState();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    if (!analysisResult || !canViewResult) {
      setLocation("/scan");
    }
  }, [analysisResult, canViewResult, setLocation]);

  if (!analysisResult || !canViewResult) {
    return null;
  }

  const handleSave = () => {
    const saved = saveCurrentResult();
    if (saved) {
      toast({ title: "저장 완료", description: "결과가 기록에 저장되었습니다." });
    } else {
      toast({ title: "이미 저장된 결과입니다." });
    }
  };

  const handleRetry = () => {
    clearAnalysisResult();
    setLocation("/scan");
  };

  return (
    <div className="max-w-lg mx-auto px-5 py-6 space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex justify-center">
        <ScoreCircle score={analysisResult.totalScore} size="lg" />
      </motion.div>

      <Card className="p-6 rounded-2xl border-0 space-y-4">
        <h3 className="text-base font-bold">분석 결과</h3>
        <TraitBar label="친절함" score={analysisResult.friendliness} icon="smile" delay={0.1} />
        <TraitBar label="활기" score={analysisResult.vitality} icon="zap" delay={0.2} />
        <TraitBar label="자신감" score={analysisResult.confidence} icon="trophy" delay={0.3} />
        <TraitBar label="안정감" score={analysisResult.stability} icon="heart" delay={0.4} />
      </Card>

      <Card className="p-6 rounded-2xl border-0 space-y-3">
        <h3 className="text-base font-bold">요약</h3>
        <p className="text-sm text-muted-foreground">{analysisResult.summary}</p>
        <ul className="space-y-2">
          {analysisResult.tips.map((tip, i) => (
            <li key={i} className="text-sm text-muted-foreground">{i + 1}. {tip}</li>
          ))}
        </ul>
        <p className="text-sm"><strong>미션:</strong> {analysisResult.mission}</p>
        <p className="text-sm text-muted-foreground">{analysisResult.encouragement}</p>
      </Card>

      <div className="flex gap-3">
        <Button variant="secondary" className="flex-1 gap-2" onClick={handleRetry}>
          <RotateCcw className="w-4 h-4" />
          다시 스캔
        </Button>
        <Button className="flex-1 gap-2" onClick={handleSave}>
          <Save className="w-4 h-4" />
          저장
        </Button>
      </div>

      <div className="flex justify-center">
        <Button variant="ghost" size="sm" className="gap-2" onClick={() => setLocation("/")}>
          <Home className="w-4 h-4" />
          홈으로
        </Button>
      </div>
    </div>
  );
}
