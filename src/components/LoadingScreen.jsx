import React from "react";
import { motion } from "framer-motion";

export const LoadingScreen = ({ message = "Loading..." }) => (
  <div className="fixed inset-0 bg-surface flex flex-col items-center justify-center z-50">
    {/* Grid bg */}
    <div className="absolute inset-0 grid-bg opacity-30" />
    {/* Glow */}
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-brand-500/10 blur-3xl" />

    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className="relative flex flex-col items-center gap-8 z-10"
    >
      {/* Logo with wobble */}
      <motion.div
        animate={{ y: [0, -8, 0], rotate: [0, 1, -1, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      >
        <img src="/logo.png" alt="PrepAI" className="w-20 h-20 rounded-2xl shadow-[0_0_40px_rgba(123,47,247,0.5)]" />
      </motion.div>

      {/* Spinner ring */}
      <div className="relative w-16 h-16">
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-transparent border-t-neon-purple border-r-neon-blue"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
        <motion.div
          className="absolute inset-2 rounded-full border-2 border-transparent border-t-neon-cyan"
          animate={{ rotate: -360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
        />
      </div>

      <div className="text-center">
        <p className="font-display text-lg font-semibold gradient-text">{message}</p>
        <p className="text-xs text-gray-600 mt-1">Practice. Prepare. Perform.</p>
      </div>
    </motion.div>
  </div>
);
