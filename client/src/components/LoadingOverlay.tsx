import { motion } from "framer-motion";
import { Scan } from "lucide-react";

export default function LoadingOverlay() {
  return (
    <div className="fixed inset-0 z-[100] bg-white/95 dark:bg-background/95 backdrop-blur-md flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center gap-8"
      >
        <div className="relative">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            className="w-24 h-24 rounded-full"
            style={{
              background: "conic-gradient(from 0deg, #8b5cf6, #6366f1, #3b82f6, #8b5cf6)",
              padding: 3,
            }}
          >
            <div className="w-full h-full rounded-full bg-white dark:bg-background flex items-center justify-center">
              <Scan className="w-10 h-10 text-violet-500" />
            </div>
          </motion.div>
          <motion.div
            animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0, 0.3] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute inset-0 rounded-full bg-violet-400/20"
          />
        </div>

        <div className="text-center space-y-2">
          <p className="text-xl font-bold" data-testid="text-analyzing">표정을 읽고 있어요</p>
          <p className="text-sm text-muted-foreground">맞춤 코칭을 준비하고 있어요. 잠시만요!</p>
        </div>

        <div className="flex gap-2">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.15 }}
              className="w-3 h-3 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500"
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
}
