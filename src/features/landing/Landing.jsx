import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import { Container, Button, Badge } from "../../components/ui";
import {
  Brain, Zap, BarChart3, Users, CheckCircle, ArrowRight,
  Menu, X, Star, Code2, FileText, Trophy, Sparkles,
  MessageSquare, TrendingUp, Shield, Crown, ChevronRight,
} from "lucide-react";

const floatVariants = {
  animate: { y: [0, -12, 0], transition: { duration: 6, repeat: Infinity, ease: "easeInOut" } }
};

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.6, delay: i * 0.1, ease: "easeOut" } }),
};

const features = [
  { icon: Brain,       title: "AI Interview Coach",   desc: "Dynamic follow-up questions, real interviewer behavior, contextual conversation flow.", color: "from-brand-500 to-neon-blue",  glow: "rgba(123,47,247,0.3)" },
  { icon: Code2,       title: "450 DSA Problems",     desc: "Curated problem set with Monaco editor, test cases, and AI-powered hints.", color: "from-neon-blue to-neon-cyan",  glow: "rgba(0,245,212,0.2)" },
  { icon: FileText,    title: "Resume Analyzer",      desc: "ATS score, keyword matching, and actionable improvement suggestions.", color: "from-neon-cyan to-neon-pink",  glow: "rgba(241,91,181,0.2)" },
  { icon: BarChart3,   title: "Deep Analytics",       desc: "Performance trends, skill gap analysis, and personalized study plans.", color: "from-amber-500 to-orange-500", glow: "rgba(245,158,11,0.2)" },
  { icon: Trophy,      title: "Leaderboard",          desc: "Compete globally, earn XP, unlock achievements, and track your rank.", color: "from-yellow-400 to-amber-500", glow: "rgba(250,204,21,0.2)" },
  { icon: Shield,      title: "Privacy First",        desc: "Your data is encrypted and never shared. Practice with confidence.", color: "from-green-500 to-emerald-400", glow: "rgba(16,185,129,0.2)" },
];

const testimonials = [
  { name: "Sarah Chen",    role: "SWE @ Google",     content: "PrepAI's AI felt like a real interviewer. Got my Google offer after 2 weeks.", rating: 5, avatar: "SC" },
  { name: "Marcus Johnson", role: "PM @ Microsoft",  content: "The behavioral question follow-ups were incredibly realistic and challenging.", rating: 5, avatar: "MJ" },
  { name: "Priya Patel",   role: "DS @ Meta",        content: "Analytics showed exactly where I was weak. Went from 60% to 90% avg score.", rating: 5, avatar: "PP" },
];

const stats = [
  { value: "50K+",  label: "Users Trained" },
  { value: "1M+",   label: "Questions Answered" },
  { value: "94%",   label: "Success Rate" },
  { value: "4.9★",  label: "Avg Rating" },
];

export const Landing = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { scrollY } = useScroll();
  const heroY = useTransform(scrollY, [0, 400], [0, -60]);

  return (
    <div className="min-h-screen bg-surface text-white overflow-x-hidden">
      {/* Background effects */}
      <div className="fixed inset-0 grid-bg opacity-50 pointer-events-none" />
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] rounded-full bg-brand-500/8 blur-[120px] pointer-events-none" />
      <div className="fixed bottom-0 right-0 w-[400px] h-[400px] rounded-full bg-neon-cyan/5 blur-[80px] pointer-events-none" />

      {/* ── Navbar ─────────────────────────────────────────────── */}
      <header className="fixed top-0 left-0 right-0 z-50 glass-strong border-b border-[rgba(155,93,229,0.15)]">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-neon-purple/60 to-transparent" />
        <Container>
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-3 group">
              <motion.img
                src="/logo.png" alt="PrepAI"
                className="w-9 h-9 rounded-xl object-contain"
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ type: "spring", stiffness: 300 }}
              />
              <span className="font-display text-xl font-bold gradient-text">PrepAI</span>
            </Link>

            <nav className="hidden md:flex items-center gap-6">
              {["Features", "Pricing", "Testimonials"].map(item => (
                <a key={item} href={`#${item.toLowerCase()}`} className="text-sm text-gray-400 hover:text-white transition-colors duration-200">{item}</a>
              ))}
            </nav>

            <div className="hidden md:flex items-center gap-3">
              <Link to="/login"><Button variant="ghost" size="sm">Sign in</Button></Link>
              <Link to="/register"><Button variant="primary" size="sm" className="glow-purple">Get Started Free</Button></Link>
            </div>

            <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden p-2 text-gray-400 hover:text-white">
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </Container>
        {mobileOpen && (
          <div className="md:hidden px-4 pb-4 flex flex-col gap-2 border-t border-[rgba(155,93,229,0.1)] pt-3">
            <Link to="/login"><Button variant="secondary" className="w-full">Sign in</Button></Link>
            <Link to="/register"><Button variant="primary" className="w-full">Get Started Free</Button></Link>
          </div>
        )}
      </header>

      {/* ── Hero ───────────────────────────────────────────────── */}
      <section className="relative pt-32 pb-24 px-4">
        <motion.div style={{ y: heroY }} className="max-w-5xl mx-auto text-center">
          <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={0}>
            <Badge variant="primary" className="mb-6 inline-flex gap-2 px-4 py-2 text-sm">
              <Sparkles className="w-4 h-4 text-neon-purple animate-pulse-neon" />
              Developed by Shiva
            </Badge>
          </motion.div>

          <motion.h1
            variants={fadeUp} initial="hidden" animate="visible" custom={1}
            className="font-display text-5xl sm:text-6xl lg:text-7xl font-extrabold leading-[1.05] mb-6"
          >
            Ace Your{" "}
            <span className="gradient-text-neon">Tech Interview</span>
            <br />with AI Precision
          </motion.h1>

          <motion.p
            variants={fadeUp} initial="hidden" animate="visible" custom={2}
            className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            PrepAI simulates real interviews with dynamic follow-up questions, instant AI feedback,
            450+ DSA problems, and deep analytics. Practice until you're confident.
          </motion.p>

          <motion.div
            variants={fadeUp} initial="hidden" animate="visible" custom={3}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link to="/register">
              <Button variant="primary" size="lg" className="shadow-brand-lg group">
                Start Free Today
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link to="/pricing">
              <Button variant="secondary" size="lg" className="gap-2">
                <Crown className="w-5 h-5 text-amber-400" />
                See Premium Plans
              </Button>
            </Link>
          </motion.div>

          {/* Stats row */}
          <motion.div
            variants={fadeUp} initial="hidden" animate="visible" custom={4}
            className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl mx-auto"
          >
            {stats.map(({ value, label }) => (
              <div key={label} className="glass rounded-2xl py-4 px-3 border border-[rgba(155,93,229,0.1)] text-center">
                <p className="font-display text-2xl font-bold gradient-text">{value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{label}</p>
              </div>
            ))}
          </motion.div>
        </motion.div>

        {/* Floating logo */}
        <motion.div
          className="mt-16 flex justify-center"
          animate={{ y: [0, -12, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        >
          <div className="relative">
            <img src="/logo.png" alt="PrepAI" className="w-32 h-32 rounded-3xl shadow-[0_0_60px_rgba(123,47,247,0.5)]" />
            <div className="absolute inset-0 rounded-3xl bg-neon-purple/20 blur-xl -z-10" />
            {/* Orbit ring */}
            <motion.div
              className="absolute inset-[-16px] rounded-full border border-neon-purple/20"
              animate={{ rotate: 360 }}
              transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
            >
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-neon-purple shadow-[0_0_8px_rgba(155,93,229,0.8)]" />
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* ── Features ───────────────────────────────────────────── */}
      <section id="features" className="py-24 px-4">
        <Container>
          <motion.div
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <Badge variant="cyan" className="mb-4">Everything You Need</Badge>
            <h2 className="font-display text-4xl sm:text-5xl font-bold mb-4">
              One Platform.{" "}<span className="gradient-text">All the Tools.</span>
            </h2>
            <p className="text-gray-400 max-w-xl mx-auto">From AI-powered mock interviews to resume analysis and coding practice — PrepAI covers the full preparation journey.</p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.1, duration: 0.5 }}
                whileHover={{ y: -6, transition: { duration: 0.2 } }}
                className="glass rounded-2xl p-6 border border-[rgba(155,93,229,0.1)] hover:border-[rgba(155,93,229,0.3)] transition-all duration-300 group cursor-default"
                style={{ boxShadow: `0 0 0px ${f.glow}` }}
                whileInView={{ boxShadow: `0 0 20px ${f.glow}` }}
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-4 shadow-lg`}>
                  <f.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-display text-lg font-bold text-white mb-2">{f.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </Container>
      </section>

      {/* ── Testimonials ───────────────────────────────────────── */}
      <section id="testimonials" className="py-24 px-4 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-brand-500/3 to-transparent pointer-events-none" />
        <Container>
          <motion.div
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} className="text-center mb-14"
          >
            <Badge variant="premium" className="mb-4">Trusted by 50,000+ learners</Badge>
            <h2 className="font-display text-4xl font-bold">What Our Users Say</h2>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.15 }}
                className="glass rounded-2xl p-6 border border-[rgba(155,93,229,0.1)] hover:border-[rgba(155,93,229,0.25)] transition-all duration-300"
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(t.rating)].map((_, j) => (
                    <Star key={j} className="w-4 h-4 text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-gray-300 text-sm leading-relaxed mb-5">"{t.content}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-brand-500 to-neon-blue flex items-center justify-center text-white text-xs font-bold">
                    {t.avatar}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{t.name}</p>
                    <p className="text-xs text-gray-500">{t.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </Container>
      </section>

      {/* ── CTA ────────────────────────────────────────────────── */}
      <section className="py-24 px-4">
        <Container>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative rounded-3xl overflow-hidden text-center py-20 px-8 border border-brand-500/30"
            style={{ background: "linear-gradient(135deg, rgba(123,47,247,0.15), rgba(78,168,222,0.08))" }}
          >
            <div className="absolute inset-0 grid-bg opacity-30" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-brand-500/15 blur-3xl pointer-events-none" />
            <div className="relative z-10">
              <motion.img
                src="/logo.png" alt="PrepAI"
                className="w-20 h-20 mx-auto mb-6 rounded-2xl shadow-brand"
                animate={{ y: [0, -8, 0] }} transition={{ duration: 4, repeat: Infinity }}
              />
              <h2 className="font-display text-4xl sm:text-5xl font-extrabold mb-4">
                Ready to <span className="gradient-text">Perform?</span>
              </h2>
              <p className="text-gray-400 mb-8 max-w-lg mx-auto">Join 50,000+ learners who used PrepAI to land their dream jobs at top tech companies.</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/register">
                  <Button variant="primary" size="lg" className="shadow-brand-lg">
                    Start Free — No Credit Card
                    <ArrowRight className="w-5 h-5" />
                  </Button>
                </Link>
                <Link to="/pricing">
                  <Button variant="secondary" size="lg"><Crown className="w-5 h-5 text-amber-400" /> View Premium</Button>
                </Link>
              </div>
            </div>
          </motion.div>
        </Container>
      </section>

      {/* ── Footer ─────────────────────────────────────────────── */}
      <footer className="border-t border-[rgba(155,93,229,0.1)] py-10 px-4">
        <Container>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="PrepAI" className="w-7 h-7 rounded-lg" />
              <span className="font-display font-bold gradient-text">PrepAI</span>
            </div>
            <p className="text-xs text-gray-600">© 2025 PrepAI · Developed by Shiva · Practice. Prepare. Perform.</p>
            <div className="flex gap-4 text-xs text-gray-600">
              <a href="#" className="hover:text-gray-400 transition-colors">Privacy</a>
              <a href="#" className="hover:text-gray-400 transition-colors">Terms</a>
              <Link to="/pricing" className="hover:text-gray-400 transition-colors">Pricing</Link>
            </div>
          </div>
        </Container>
      </footer>
    </div>
  );
};
