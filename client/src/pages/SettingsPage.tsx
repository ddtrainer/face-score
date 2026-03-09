import { useState } from "react";
import { motion } from "framer-motion";
import { Info, Shield, Bell, Crown, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";

export default function SettingsPage() {
  const [notificationEnabled, setNotificationEnabled] = useState(false);

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
      <h2 className="text-xl font-bold" data-testid="text-settings-title">설정</h2>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold">앱 소개</h3>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed" data-testid="text-app-intro">
            Face Score는 AI가 당신의 얼굴 표정(인상)을 분석해
            점수로 보여주고, 더 좋은 인상을 만드는 방법을 알려주는 앱이에요.
            매일 사진을 찍고 기록을 쌓아 더 나은 인상을 만들어 보세요.
          </p>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold">개인정보 안내</h3>
          </div>
          <ul className="space-y-2 text-sm text-muted-foreground" data-testid="text-privacy-policy">
            <li className="flex gap-2">
              <span className="text-primary shrink-0">&#8226;</span>
              <span>사진은 분석 후 즉시 삭제되며, 서버에 저장되지 않아요.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-primary shrink-0">&#8226;</span>
              <span>점수 기록만 기기의 로컬 저장소에 저장돼요.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-primary shrink-0">&#8226;</span>
              <span>저장 버튼을 누를 때만 점수가 기록으로 남아요.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-primary shrink-0">&#8226;</span>
              <span>이 앱의 결과는 참고용이며, 의학적 진단이 아니에요.</span>
            </li>
          </ul>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="p-5">
          <div className="flex items-center justify-between gap-1">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">알림</p>
                <p className="text-xs text-muted-foreground">매일 분석 리마인더 받기</p>
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
        <Card className="p-5 space-y-3">
          <div className="flex items-center justify-between gap-1">
            <div className="flex items-center gap-2">
              <Crown className="w-4 h-4 text-amber-500" />
              <h3 className="text-sm font-semibold">프리미엄</h3>
            </div>
            <Badge variant="secondary" data-testid="badge-coming-soon">
              Coming Soon
            </Badge>
          </div>
          <ul className="space-y-1.5 text-sm text-muted-foreground">
            <li className="flex gap-2">
              <span className="text-amber-500 shrink-0">&#8226;</span>
              <span>더 정밀한 AI 분석</span>
            </li>
            <li className="flex gap-2">
              <span className="text-amber-500 shrink-0">&#8226;</span>
              <span>맞춤형 인상 개선 코칭</span>
            </li>
            <li className="flex gap-2">
              <span className="text-amber-500 shrink-0">&#8226;</span>
              <span>장기 기록 저장 및 트렌드 분석</span>
            </li>
          </ul>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground pt-2 pb-4"
      >
        <Info className="w-3.5 h-3.5" />
        <span>Face Score v1.0</span>
      </motion.div>
    </div>
  );
}
