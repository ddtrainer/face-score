import { motion } from "framer-motion";
import { Camera } from "lucide-react";

interface EmptyStateProps {
  title: string;
  description: string;
}

export default function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-20 px-8 text-center"
      data-testid="empty-state"
    >
      <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-violet-100 to-indigo-100 dark:from-violet-500/15 dark:to-indigo-500/15 flex items-center justify-center mb-5">
        <Camera className="w-9 h-9 text-violet-400" />
      </div>
      <h3 className="text-lg font-bold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-[260px] leading-relaxed">{description}</p>
    </motion.div>
  );
}
