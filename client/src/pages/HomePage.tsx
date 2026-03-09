import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Camera, Shield, ChevronRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import ScoreCircle from "@/components/ScoreCircle";
import { useAppState } from "@/lib/appState";

export default function HomePage() {
  const { latestRecord } = useAppState();
  const [, setLocation] = useLocation();

  return (
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
          오늘의 나, 어떤 인상일까?
        </h2>
        <p className="text-[15px] text-muted-foreground leading-relaxed max-w-[280px] mx-auto" data-testid="text-description">
          매일 3초 셀피 스캔으로 나만의 인상 코칭을 받아보세요.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card className="p-7 rounded-2xl space-y-5 border-0 bg-gradient-to-b from-violet-50 to-white dark:from-violet-500/5 dark:to-card">
          <div className="text-center space-y-1">
            <p className="text-base font-bold">3초면 충분해요</p>
            <p className="text-xs text-muted-foreground">카메라를 바라보고 자연스러운 표정을 유지하세요</p>
          </div>

          <Button
            className="w-full gap-2.5 h-14 text-[15px] font-semibold rounded-xl bg-gradient-to-r from-violet-600 to-indigo-500"
            onClick={() => setLocation("/scan")}
            data-testid="button-start-scan"
          >
            <Camera className="w-5 h-5" />
            3초 셀피 스캔 시작
          </Button>
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
        <span>얼굴 영상은 저장되지 않아요. 점수만 기록돼요.</span>
      </motion.div>
    </div>
  );
}
