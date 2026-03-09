import { useState } from "react";
import { motion } from "framer-motion";
import { Info, Shield, Bell, Crown, Sparkles, ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";

export default function SettingsPage() {
  const [notificationEnabled, setNotificationEnabled] = useState(false);

  return (
    <div className="max-w-lg mx-auto px-5 py-6 space-y-5">
      <div>
        <h2 className="text-2xl font-extrabold" data-testid="text-settings-title">설정</h2>
        <p className="text-sm text-muted-foreground mt-1">앱 정보 및 개인정보 설정</p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="p-6 rounded-2xl space-y-4 border-0 bg-gradient-to-br from-violet-50 to-indigo-50/50 dark:from-violet-500/5 dark:to-indigo-500/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold">Face Score</h3>
              <p className="text-xs text-muted-foreground">인상 분석 & 코칭 앱</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed" data-testid="text-app-intro">
            AI가 당신의 표정을 분석해 점수와 맞춤 코칭을 제공하는 앱이에요. 매일 사진을 찍고 기록을 쌓아 더 나은 인상을 만들어 보세요.
          </p>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="p-6 rounded-2xl space-y-4 border-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-500/15 flex items-center justify-center">
              <Shield className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h3 className="text-base font-bold">개인정보 안내</h3>
          </div>
          <ul className="space-y-3" data-testid="text-privacy-policy">
            {[
              "사진은 분석 후 즉시 삭제되며, 서버에 저장되지 않아요.",
              "점수 기록만 기기의 로컬 저장소에 저장돼요.",
              "저장 버튼을 누를 때만 점수가 기록으로 남아요.",
              "이 앱의 결과는 참고용이며, 의학적 진단이 아니에요.",
            ].map((text, i) => (
              <li key={i} className="flex gap-3 items-start">
                <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-500/15 flex items-center justify-center shrink-0 mt-0.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                </div>
                <span className="text-sm text-muted-foreground leading-relaxed">{text}</span>
              </li>
            ))}
          </ul>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="p-5 rounded-2xl border-0">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-500/15 flex items-center justify-center">
                <Bell className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-bold">일일 리마인더</p>
                <p className="text-xs text-muted-foreground">매일 분석 알림 받기</p>
              </div>
            </div>
            <Switch
              checked={notificationEnabled}
              onCheckedChange={setNotificationEnabled}
              data-testid="switch-notification"
            />
          </div>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="p-6 rounded-2xl space-y-4 border-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-500/15 flex items-center justify-center">
                <Crown className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <h3 className="text-base font-bold">프리미엄</h3>
            </div>
            <Badge variant="secondary" className="rounded-full px-3" data-testid="badge-coming-soon">
              Coming Soon
            </Badge>
          </div>
          <div className="space-y-2.5">
            {[
              "더 정밀한 AI 분석",
              "맞춤형 인상 개선 코칭",
              "장기 기록 저장 및 트렌드 분석",
            ].map((text, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                <span className="text-sm text-muted-foreground">{text}</span>
                <ChevronRight className="w-4 h-4 text-muted-foreground/30" />
              </div>
            ))}
          </div>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="flex items-center justify-center gap-2 text-xs text-muted-foreground/50 pt-4 pb-6"
      >
        <Info className="w-3.5 h-3.5" />
        <span>Face Score v1.0</span>
      </motion.div>
    </div>
  );
}
