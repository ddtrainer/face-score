import { motion } from "framer-motion";

interface ScoreCircleProps {
  score: number;
  size?: "sm" | "lg";
  animated?: boolean;
}

function getScoreGradient(score: number): { from: string; to: string } {
  if (score >= 85) return { from: "#6ee7b7", to: "#14b8a6" };
  if (score >= 75) return { from: "#a78bfa", to: "#6366f1" };
  if (score >= 65) return { from: "#60a5fa", to: "#8b5cf6" };
  return { from: "#fbbf24", to: "#f59e0b" };
}

function getScoreLabel(score: number): string {
  if (score >= 85) return "훌륭해요!";
  if (score >= 75) return "좋아요!";
  if (score >= 65) return "괜찮아요";
  return "성장 중";
}

export default function ScoreCircle({ score, size = "lg", animated = true }: ScoreCircleProps) {
  const isLarge = size === "lg";
  const outerSize = isLarge ? 200 : 80;
  const radius = isLarge ? 82 : 32;
  const strokeWidth = isLarge ? 8 : 5;
  const center = outerSize / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;
  const gradient = getScoreGradient(score);
  const label = getScoreLabel(score);
  const gradId = `score-grad-${size}`;

  return (
    <div className="relative flex items-center justify-center" style={{ width: outerSize, height: outerSize }}>
      <svg width={outerSize} height={outerSize} viewBox={`0 0 ${outerSize} ${outerSize}`} className="absolute inset-0">
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={gradient.from} />
            <stop offset="100%" stopColor={gradient.to} />
          </linearGradient>
        </defs>
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth={strokeWidth}
          opacity={0.4}
        />
        <motion.circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={`url(#${gradId})`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={animated ? { strokeDashoffset: circumference } : { strokeDashoffset: circumference - progress }}
          animate={{ strokeDashoffset: circumference - progress }}
          transition={animated ? { duration: 1.4, ease: "easeOut" } : { duration: 0 }}
          transform={`rotate(-90 ${center} ${center})`}
        />
      </svg>

      <div className="flex flex-col items-center justify-center relative z-10">
        {isLarge ? (
          <>
            <motion.span
              className="text-6xl font-extrabold tracking-tight"
              data-testid="text-total-score"
              initial={animated ? { opacity: 0, scale: 0.8 } : { opacity: 1, scale: 1 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6, type: "spring", stiffness: 200 }}
            >
              {score}
            </motion.span>
            <motion.span
              className="text-xs font-semibold text-muted-foreground mt-0.5"
              data-testid="text-score-label"
              initial={animated ? { opacity: 0 } : { opacity: 1 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
            >
              {label}
            </motion.span>
          </>
        ) : (
          <span
            className="text-xl font-extrabold"
            data-testid="text-total-score"
          >
            {score}
          </span>
        )}
      </div>
    </div>
  );
}
