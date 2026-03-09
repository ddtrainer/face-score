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
        <p className="text-sm text-muted-foreground mt-1">앱 정보와 개인정보를 확인하세요</p>
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
              <p className="text-xs text-muted-foreground">나만의 인상 코칭 파트너</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed" data-testid="text-app-intro">
            매일 한 장의 사진으로 나만의 인상을 체크하고, 맞춤 코칭을 받아보세요. 꾸준히 기록하면 작은 변화가 눈에 보일 거예요.
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
              "사진은 분석 후 바로 삭제돼요. 서버에 저장되지 않으니 안심하세요.",
              "점수 기록만 기기에 안전하게 보관돼요.",
              "저장 버튼을 누를 때만 기록이 남아요.",
              "이 결과는 재미와 자기관리를 위한 참고용이에요.",
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
                <p className="text-sm font-bold">매일 코칭 알림</p>
                <p className="text-xs text-muted-foreground">오늘의 인상 체크를 잊지 않도록 알려드려요</p>
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
              "더 세밀한 표정 분석과 맞춤 코칭",
              "나만의 인상 개선 플랜 제공",
              "장기 기록 보관 및 변화 트렌드 분석",
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
