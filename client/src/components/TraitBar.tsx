import { motion } from "framer-motion";

interface TraitBarProps {
  label: string;
  score: number;
  icon: string;
  delay?: number;
}

function getBarColor(score: number): string {
  if (score >= 85) return "bg-emerald-500";
  if (score >= 75) return "bg-primary";
  if (score >= 65) return "bg-blue-500";
  return "bg-amber-500";
}

export default function TraitBar({ label, score, icon, delay = 0 }: TraitBarProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-1">
        <div className="flex items-center gap-2">
          <span className="text-base">{icon}</span>
          <span className="text-sm font-medium">{label}</span>
        </div>
        <span className="text-sm font-bold tabular-nums" data-testid={`text-trait-${label}`}>
          {score}점
        </span>
      </div>
      <div className="h-2.5 rounded-full bg-muted overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${getBarColor(score)}`}
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.8, delay, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}
