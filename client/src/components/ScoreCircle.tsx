import { motion } from "framer-motion";

interface ScoreCircleProps {
  score: number;
  size?: "sm" | "lg";
  animated?: boolean;
}

function getScoreColor(score: number): string {
  if (score >= 85) return "from-emerald-400 to-teal-500";
  if (score >= 75) return "from-primary to-chart-3";
  if (score >= 65) return "from-blue-400 to-primary";
  return "from-amber-400 to-orange-400";
}

function getScoreLabel(score: number): string {
  if (score >= 85) return "훌륭해요!";
  if (score >= 75) return "좋아요!";
  if (score >= 65) return "괜찮아요";
  return "성장 중";
}

export default function ScoreCircle({ score, size = "lg", animated = true }: ScoreCircleProps) {
  const isLarge = size === "lg";
  const outerSize = isLarge ? "w-44 h-44" : "w-24 h-24";
  const innerSize = isLarge ? "w-36 h-36" : "w-20 h-20";
  const textSize = isLarge ? "text-5xl" : "text-2xl";
  const labelSize = isLarge ? "text-sm" : "text-[10px]";
  const gradient = getScoreColor(score);
  const label = getScoreLabel(score);

  const circumference = isLarge ? 2 * Math.PI * 68 : 2 * Math.PI * 38;
  const progress = (score / 100) * circumference;
  const svgSize = isLarge ? 176 : 96;
  const radius = isLarge ? 68 : 38;
  const center = svgSize / 2;
  const strokeWidth = isLarge ? 6 : 4;

  return (
    <div className={`relative ${outerSize} flex items-center justify-center`}>
      <svg
        className="absolute inset-0"
        width={svgSize}
        height={svgSize}
        viewBox={`0 0 ${svgSize} ${svgSize}`}
      >
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth={strokeWidth}
        />
        <motion.circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={animated ? { strokeDashoffset: circumference } : { strokeDashoffset: circumference - progress }}
          animate={{ strokeDashoffset: circumference - progress }}
          transition={animated ? { duration: 1.2, ease: "easeOut" } : { duration: 0 }}
          transform={`rotate(-90 ${center} ${center})`}
        />
      </svg>
      <div className={`${innerSize} rounded-full bg-gradient-to-br ${gradient} flex flex-col items-center justify-center`}>
        <motion.span
          className={`${textSize} font-bold text-white`}
          data-testid="text-total-score"
          initial={animated ? { opacity: 0 } : { opacity: 1 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {score}
        </motion.span>
        {isLarge && (
          <span className={`${labelSize} text-white/90 font-medium`} data-testid="text-score-label">
            {label}
          </span>
        )}
      </div>
    </div>
  );
}
