import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import EmptyState from "@/components/EmptyState";
import { getRecords, getAverageScore } from "@/lib/faceStorage";
import type { FaceRecord } from "@/lib/types";

export default function HistoryPage() {
  const [records, setRecords] = useState<FaceRecord[]>([]);
  const [averageScore, setAverageScore] = useState<number | null>(null);

  useEffect(() => {
    setRecords(getRecords());
    setAverageScore(getAverageScore());
  }, []);

  const recentSeven = records.slice(0, 7).reverse();

  const chartData = recentSeven.map((r) => ({
    date: new Date(r.date).toLocaleDateString("ko-KR", { month: "short", day: "numeric" }),
    점수: r.totalScore,
  }));

  if (records.length === 0) {
    return (
      <div className="max-w-lg mx-auto px-4 py-6">
        <h2 className="text-xl font-bold mb-6" data-testid="text-history-title">기록</h2>
        <EmptyState
          title="아직 기록이 없어요"
          description="홈에서 사진을 분석하고 저장하면 여기에 기록이 쌓여요."
        />
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
      <h2 className="text-xl font-bold" data-testid="text-history-title">기록</h2>

      {averageScore !== null && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="p-5">
            <div className="flex items-center justify-between gap-1">
              <div>
                <p className="text-xs text-muted-foreground">최근 평균 점수</p>
                <p className="text-3xl font-bold mt-1" data-testid="text-average-score">{averageScore}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-primary" />
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
          <Card className="p-5" data-testid="chart-score-trend">
            <h3 className="text-sm font-semibold mb-4">점수 변화</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11 }}
                    stroke="hsl(var(--muted-foreground))"
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fontSize: 11 }}
                    stroke="hsl(var(--muted-foreground))"
                    tickLine={false}
                    axisLine={false}
                    width={30}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "6px",
                      fontSize: "12px",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="점수"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: "hsl(var(--primary))" }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </motion.div>
      )}

      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-muted-foreground">최근 기록</h3>
        {records.slice(0, 7).map((record, index) => (
          <motion.div
            key={record.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 * index }}
          >
            <Card className="p-4" data-testid={`card-record-${record.id}`}>
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary/20 to-chart-3/20 flex items-center justify-center shrink-0">
                  <span className="text-xl font-bold text-primary">{record.totalScore}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">
                    {new Date(record.date).toLocaleDateString("ko-KR", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                  <p className="text-sm font-medium truncate mt-0.5">{record.summary}</p>
                  <div className="flex gap-3 mt-1.5 text-xs text-muted-foreground">
                    <span>친근함 {record.friendliness}</span>
                    <span>생기 {record.vitality}</span>
                    <span>자신감 {record.confidence}</span>
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
