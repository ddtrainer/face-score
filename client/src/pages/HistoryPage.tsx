import { useEffect } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { TrendingUp, ArrowUpRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import EmptyState from "@/components/EmptyState";
import { useAppState } from "@/lib/appState";

export default function HistoryPage() {
  const { records, averageScore, refreshRecords } = useAppState();
  const [, setLocation] = useLocation();

  useEffect(() => {
    refreshRecords();
  }, [refreshRecords]);

  const recentSeven = records.slice(0, 7).reverse();

  const chartData = recentSeven.map((r) => ({
    date: new Date(r.date).toLocaleDateString("ko-KR", { month: "short", day: "numeric" }),
    점수: r.totalScore,
  }));

  if (records.length === 0) {
    return (
      <div className="max-w-lg mx-auto px-5 py-6">
        <h2 className="text-2xl font-extrabold mb-2" data-testid="text-history-title">나의 기록</h2>
        <p className="text-sm text-muted-foreground mb-4">매일 기록을 쌓아 변화를 확인해 보세요</p>
        <EmptyState
          title="아직 기록이 없어요"
          description="홈에서 사진을 분석하고 저장하면 여기에 기록이 쌓여요."
        />
        <div className="flex justify-center mt-6">
          <Button
            className="gap-2 rounded-xl h-12 px-8 bg-gradient-to-r from-violet-600 to-indigo-500"
            onClick={() => setLocation("/")}
            data-testid="button-start-analysis"
          >
            <ArrowUpRight className="w-4 h-4" />
            첫 분석 시작하기
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-5 py-6 space-y-5">
      <div>
        <h2 className="text-2xl font-extrabold" data-testid="text-history-title">나의 기록</h2>
        <p className="text-sm text-muted-foreground mt-1">매일 기록을 쌓아 변화를 확인해 보세요</p>
      </div>

      {averageScore !== null && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="p-6 rounded-2xl border-0 bg-gradient-to-br from-violet-50 to-indigo-50/50 dark:from-violet-500/5 dark:to-indigo-500/5">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-[11px] font-semibold text-violet-500 uppercase tracking-wide">최근 평균</p>
                <div className="flex items-baseline gap-1.5 mt-1">
                  <p className="text-5xl font-extrabold" data-testid="text-average-score">{averageScore}</p>
                  <span className="text-lg text-muted-foreground font-medium">/ 100</span>
                </div>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-violet-100 dark:bg-violet-500/15 flex items-center justify-center">
                <TrendingUp className="w-7 h-7 text-violet-600 dark:text-violet-400" />
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      {chartData.length >= 2 && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="p-6 rounded-2xl border-0" data-testid="chart-score-trend">
            <h3 className="text-base font-bold mb-5">점수 변화</h3>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                    tickLine={false}
                    axisLine={false}
                    width={28}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "12px",
                      fontSize: "13px",
                      fontWeight: 600,
                      padding: "8px 14px",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="점수"
                    stroke="url(#lineGradient)"
                    strokeWidth={3}
                    dot={{ r: 5, fill: "#8b5cf6", stroke: "#fff", strokeWidth: 2 }}
                    activeDot={{ r: 7, fill: "#8b5cf6", stroke: "#fff", strokeWidth: 2 }}
                  />
                  <defs>
                    <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#8b5cf6" />
                      <stop offset="100%" stopColor="#6366f1" />
                    </linearGradient>
                  </defs>
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </motion.div>
      )}

      <div className="space-y-3">
        <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wide">최근 기록</h3>
        {records.slice(0, 7).map((record, index) => (
          <motion.div
            key={record.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 * index }}
          >
            <Card className="p-5 rounded-2xl border-0" data-testid={`card-record-${record.id}`}>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-100 to-indigo-100 dark:from-violet-500/15 dark:to-indigo-500/10 flex items-center justify-center shrink-0">
                  <span className="text-2xl font-extrabold bg-gradient-to-br from-violet-600 to-indigo-500 bg-clip-text text-transparent">{record.totalScore}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground font-medium">
                    {new Date(record.date).toLocaleDateString("ko-KR", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                  <p className="text-sm font-semibold truncate mt-1">{record.summary}</p>
                  <div className="flex gap-3 mt-2 text-[11px] text-muted-foreground font-medium">
                    <span className="bg-violet-50 dark:bg-violet-500/10 px-2 py-0.5 rounded-md">친근함 {record.friendliness}</span>
                    <span className="bg-blue-50 dark:bg-blue-500/10 px-2 py-0.5 rounded-md">생기 {record.vitality}</span>
                    <span className="bg-indigo-50 dark:bg-indigo-500/10 px-2 py-0.5 rounded-md">자신감 {record.confidence}</span>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
