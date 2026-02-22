"use client";

import { motion } from "framer-motion";

export default function CookingLoader() {
  return (
    <div className="w-full flex items-center justify-center py-12">
      <motion.div
        className="flex flex-col items-center justify-center text-center gap-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div className="relative w-24 h-20 mx-auto">
          <motion.svg
            viewBox="0 0 100 80"
            style={{ width: "100%", height: "100%" }}
            initial={{ rotate: 0 }}
            animate={{ rotate: [0, -8, 8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <ellipse cx="50" cy="55" rx="35" ry="15" fill="none" stroke="var(--fg)" strokeWidth="2" />
            <path d="M 20 55 Q 15 50 10 45" fill="none" stroke="var(--fg)" strokeWidth="2" />
          </motion.svg>

          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              style={{
                position: "absolute",
                width: 8,
                height: 8,
                backgroundColor: "var(--accent)",
                borderRadius: "50%",
                left: `${30 + i * 20}px`,
                top: `${40 - i * 5}px`,
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

        <div className="flex flex-col items-center justify-center text-center">
          <motion.div animate={{ opacity: [1, 0.6, 1] }} transition={{ duration: 1.5, repeat: Infinity }}>
            <h3 className="ascii-logo text-xl text-phosphor mb-2">Cooking your snack</h3>
          </motion.div>

          <div className="flex items-center justify-center gap-1">
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                style={{
                  width: 4,
                  height: 4,
                  backgroundColor: "var(--accent)",
                  borderRadius: "50%",
                  display: "inline-block",
                }}
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

        <motion.div
          className="flex items-center justify-center"
          animate={{
            scale: [1, 1.2, 1],
            y: [0, -4, 0],
          }}
          transition={{ duration: 0.8, repeat: Infinity }}
        >
          <span className="ascii-logo text-2xl">🔥</span>
        </motion.div>
      </motion.div>
    </div>
  );
}
