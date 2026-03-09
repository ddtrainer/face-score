import { motion } from "framer-motion";

interface TraitBarProps {
  label: string;
  score: number;
  icon: string;
  delay?: number;
}

function getBarGradient(score: number): string {
  if (score >= 85) return "from-emerald-400 to-teal-500";
  if (score >= 75) return "from-violet-400 to-indigo-500";
  if (score >= 65) return "from-blue-400 to-violet-500";
  return "from-amber-400 to-orange-400";
}

export default function TraitBar({ label, score, icon, delay = 0 }: TraitBarProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <span className="text-lg">{icon}</span>
          <span className="text-sm font-semibold">{label}</span>
        </div>
        <span className="text-lg font-extrabold tabular-nums" data-testid={`text-trait-${label}`}>
          {score}
        </span>
      </div>
      <div className="h-3 rounded-full bg-gray-100 dark:bg-muted overflow-hidden">
        <motion.div
          className={`h-full rounded-full bg-gradient-to-r ${getBarGradient(score)}`}
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 1, delay, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}
