import React from "react";
import { motion } from "framer-motion";
import { Sidebar } from "./layout/Sidebar";
import { Header }  from "./layout/Header";
import clsx from "clsx";

export const PageWrapper = ({ children, className, fullWidth = false }) => (
  <div className="flex h-screen bg-surface overflow-hidden">
    <Sidebar />
    {/* ml-[72px] matches collapsed sidebar width; sidebar handles its own width */}
    <div className="flex-1 flex flex-col min-w-0 transition-all duration-300 ml-[72px]">
      <Header />
      <main className="flex-1 overflow-y-auto relative">
        {/* Background grid */}
        <div className="fixed inset-0 grid-bg pointer-events-none opacity-40" />
        {/* Glow blobs */}
        <div className="fixed top-20 left-1/4 w-96 h-96 rounded-full bg-brand-500/5 blur-3xl pointer-events-none" />
        <div className="fixed bottom-20 right-1/4 w-64 h-64 rounded-full bg-neon-cyan/5 blur-3xl pointer-events-none" />
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className={clsx("relative z-10", fullWidth ? "" : "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8", className)}
        >
          {children}
        </motion.div>
      </main>
    </div>
  </div>
);
