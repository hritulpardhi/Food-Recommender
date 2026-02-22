"use client";

import { motion } from "framer-motion";

export default function CookingLoader() {
  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="flex flex-col items-center justify-center gap-6 py-12"
    >
      {/* Pan with animated food */}
      <div className="relative w-24 h-20">
        {/* Pan */}
        <motion.svg
          viewBox="0 0 100 80"
          className="w-full h-full"
          initial={{ rotate: 0 }}
          animate={{ rotate: [0, -8, 8, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <ellipse cx="50" cy="55" rx="35" ry="15" fill="none" stroke="var(--fg)" strokeWidth="2" />
          <path d="M 20 55 Q 15 50 10 45" fill="none" stroke="var(--fg)" strokeWidth="2" />
        </motion.svg>

        {/* Bouncing food particles */}
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-[var(--accent)]"
            style={{
              left: `${30 + i * 20}px`,
              top: `${40 - i * 5}px`,
              borderRadius: "50%",
            }}
            animate={{
              y: [0, -15, 0],
              opacity: [1, 0.6, 1],
            }}
            transition={{
              duration: 0.8,
              repeat: Infinity,
              delay: i * 0.2,
            }}
          />
        ))}
      </div>

      {/* Animated text */}
      <div className="text-center">
        <motion.h3 
          className="ascii-logo text-xl text-phosphor mb-2"
          animate={{ opacity: [1, 0.6, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          Cooking your snack
        </motion.h3>
        
        {/* Animated dots */}
        <div className="flex justify-center gap-1">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="w-1 h-1 bg-[var(--accent)] rounded-full"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{
                duration: 1,
                repeat: Infinity,
                delay: i * 0.2,
              }}
            />
          ))}
        </div>
      </div>

      {/* Flame animation */}
      <motion.div 
        className="ascii-logo text-2xl"
        animate={{ 
          scale: [1, 1.2, 1],
          y: [0, -4, 0]
        }}
        transition={{ duration: 0.8, repeat: Infinity }}
      >
        🔥
      </motion.div>
    </motion.div>
  );
}
