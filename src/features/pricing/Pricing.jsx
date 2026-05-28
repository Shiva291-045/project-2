import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Container, Button, Badge } from "../../components/ui";
import { useAuth } from "../../hooks/useAuth";
import api from "../../services/apiClient";
import {
  Check, Crown, Zap, Brain, Code2, FileText, BarChart3,
  Shield, Sparkles, ArrowRight, Star, Users, AlertCircle,
  X, ExternalLink,
} from "lucide-react";
import toast from "react-hot-toast";

const FREE_FEATURES = [
  "5 AI mock interviews / month",
  "30 DSA problems access",
  "Basic resume analysis",
  "Community leaderboard",
  "Email support",
];

const PREMIUM_FEATURES = [
  "Unlimited AI mock interviews",
  "Full 450 DSA problems library",
  "Advanced resume analysis + rewrite tips",
  "Deep analytics & skill gap reports",
  "Priority AI — faster responses",
  "Premium leaderboard badges",
  "Dedicated support",
  "Early access to new features",
];

/* ── Modal shown when Razorpay key is not configured ── */
const SetupModal = ({ onClose, billing, price }) => (
  <motion.div
    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    className="fixed inset-0 z-50 flex items-center justify-center p-4"
    style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}
    onClick={onClose}
  >
    <motion.div
      initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
      onClick={e => e.stopPropagation()}
      className="glass-strong rounded-3xl border border-[rgba(155,93,229,0.3)] p-8 max-w-md w-full shadow-[0_30px_80px_rgba(0,0,0,0.6)]"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
            <Crown className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-display text-xl font-bold text-white">Enable Payments</h3>
            <p className="text-xs text-gray-500">Razorpay setup required</p>
          </div>
        </div>
        <button onClick={onClose} className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/10 transition-all">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Info */}
      <div className="mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-400/20">
        <div className="flex gap-3">
          <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-300 mb-1">Razorpay Key Not Configured</p>
            <p className="text-xs text-gray-400 leading-relaxed">
              The <code className="text-amber-300 bg-black/30 px-1 rounded">REACT_APP_RAZORPAY_KEY_ID</code> environment
              variable is not set in your Vercel deployment. Follow the steps below to enable live payments.
            </p>
          </div>
        </div>
      </div>

      {/* Steps */}
      <div className="space-y-3 mb-6">
        {[
          { step: "1", title: "Create Razorpay Account", desc: "Sign up free at razorpay.com → Settings → API Keys", link: "https://razorpay.com" },
          { step: "2", title: "Get Your Key ID", desc: "Generate Test/Live key — copy the Key ID (starts with rzp_)" },
          { step: "3", title: "Add to Vercel", desc: "Vercel Dashboard → Your Project → Settings → Environment Variables", link: "https://vercel.com/dashboard" },
          { step: "4", title: "Add Variable", desc: "Name: REACT_APP_RAZORPAY_KEY_ID  ·  Value: rzp_live_XXXX" },
          { step: "5", title: "Redeploy", desc: "Trigger a new deployment for the variable to take effect" },
        ].map(({ step, title, desc, link }) => (
          <div key={step} className="flex gap-3">
            <div className="w-6 h-6 rounded-full bg-brand-500/20 border border-brand-500/40 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-xs font-bold text-brand-300">{step}</span>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-white">{title}</p>
                {link && (
                  <a href={link} target="_blank" rel="noopener noreferrer" className="text-neon-purple hover:text-brand-300 transition-colors">
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Also need server key */}
      <div className="p-3 rounded-xl bg-surface-elevated border border-[rgba(155,93,229,0.1)] mb-5 text-xs text-gray-400">
        <p className="font-semibold text-gray-300 mb-1">Also add to Render (backend):</p>
        <code className="text-neon-cyan">RAZORPAY_KEY_ID</code> and <code className="text-neon-cyan">RAZORPAY_KEY_SECRET</code>
        <span className="ml-1">in your Render service environment variables.</span>
      </div>

      <div className="flex gap-3">
        <a href="https://razorpay.com" target="_blank" rel="noopener noreferrer" className="flex-1">
          <Button variant="primary" className="w-full">
            <ExternalLink className="w-4 h-4" /> Open Razorpay
          </Button>
        </a>
        <Button variant="secondary" onClick={onClose}>Close</Button>
      </div>
    </motion.div>
  </motion.div>
);

export const Pricing = () => {
  const { user, userProfile } = useAuth();
  const navigate = useNavigate();
  const [billing,    setBilling]    = useState("monthly");
  const [loading,    setLoading]    = useState(false);
  const [showSetup,  setShowSetup]  = useState(false);
  const isPremium = userProfile?.isPremium || false;

  const monthlyPrice = 499;
  const yearlyPrice  = Math.round(monthlyPrice * 12 * 0.6);
  const displayPrice = billing === "monthly" ? monthlyPrice : Math.round(yearlyPrice / 12);

  const loadRazorpay = () =>
    new Promise(resolve => {
      if (window.Razorpay) { resolve(true); return; }
      const s = document.createElement("script");
      s.src = "https://checkout.razorpay.com/v1/checkout.js";
      s.onload  = () => resolve(true);
      s.onerror = () => resolve(false);
      document.body.appendChild(s);
    });

  const handlePurchase = async () => {
    if (!user) { navigate("/register"); return; }

    const keyId = process.env.REACT_APP_RAZORPAY_KEY_ID;

    // Show setup guide if key not configured
    if (!keyId || keyId === "rzp_test_placeholder" || keyId === "rzp_test_XXXXXXXXXXXX") {
      setShowSetup(true);
      return;
    }

    setLoading(true);
    try {
      const ok = await loadRazorpay();
      if (!ok) {
        toast.error("Payment gateway failed to load. Please check your internet connection.");
        setLoading(false);
        return;
      }

      // Create backend order
      let orderId = null;
      try {
        const orderRes = await api.post("/api/payment/create-order", {
          plan: billing,
          amount: billing === "monthly" ? monthlyPrice * 100 : yearlyPrice * 100,
        });
        orderId = orderRes.data?.data?.orderId;
      } catch (e) {
        console.warn("Order creation failed, proceeding without order_id:", e?.message);
      }

      const opts = {
        key:      keyId,
        amount:   (billing === "monthly" ? monthlyPrice : yearlyPrice) * 100,
        currency: "INR",
        name:     "PrepAI Premium",
        description: `PrepAI Premium — ${billing === "monthly" ? "Monthly" : "Yearly"} Plan`,
        image:    window.location.origin + "/logo.png",
        ...(orderId ? { order_id: orderId } : {}),
        prefill: {
          name:  userProfile?.name || user?.displayName || "",
          email: user?.email || "",
        },
        theme: { color: "#7b2ff7" },
        modal: {
          backdropclose: false,
          ondismiss: () => setLoading(false),
        },
        handler: async (response) => {
          try {
            await api.post("/api/payment/verify", {
              razorpay_order_id:   response.razorpay_order_id   || "",
              razorpay_payment_id: response.razorpay_payment_id || "",
              razorpay_signature:  response.razorpay_signature  || "",
              plan: billing,
            });
            toast.success("🎉 Welcome to PrepAI Premium! Enjoy unlimited access.");
            setTimeout(() => navigate("/dashboard"), 1500);
          } catch {
            toast.error("Payment verification failed. Please contact support with your payment ID.");
          }
          setLoading(false);
        },
      };

      const rzp = new window.Razorpay(opts);
      rzp.on("payment.failed", (resp) => {
        toast.error(`Payment failed: ${resp?.error?.description || "Please try again."}`);
        setLoading(false);
      });
      rzp.open();
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface text-white relative overflow-hidden">
      <div className="absolute inset-0 grid-bg opacity-40" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-brand-500/8 blur-3xl" />

      {/* Setup modal */}
      <AnimatePresence>
        {showSetup && (
          <SetupModal
            onClose={() => setShowSetup(false)}
            billing={billing}
            price={displayPrice}
          />
        )}
      </AnimatePresence>

      {/* Nav */}
      <header className="glass-strong border-b border-[rgba(155,93,229,0.15)] sticky top-0 z-40">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-neon-purple/60 to-transparent" />
        <Container>
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-3">
              <img src="/logo.png" alt="PrepAI" className="w-9 h-9 rounded-xl object-contain" />
              <span className="font-display text-xl font-bold gradient-text">PrepAI</span>
            </Link>
            <div className="flex items-center gap-3">
              {user
                ? <Link to="/dashboard"><Button variant="secondary" size="sm">Dashboard</Button></Link>
                : <><Link to="/login"><Button variant="ghost" size="sm">Sign in</Button></Link>
                   <Link to="/register"><Button variant="primary" size="sm">Get Started</Button></Link></>
              }
            </div>
          </div>
        </Container>
      </header>

      <Container>
        <div className="py-20 max-w-5xl mx-auto">

          {/* Heading */}
          <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} className="text-center mb-14">
            <Badge variant="premium" className="mb-4 text-sm px-4 py-1.5">
              <Crown className="w-4 h-4 text-amber-400" /> Simple, Transparent Pricing
            </Badge>
            <h1 className="font-display text-5xl sm:text-6xl font-extrabold mb-4">
              Invest in Your <span className="gradient-text">Career</span>
            </h1>
            <p className="text-gray-400 text-lg max-w-xl mx-auto">One premium plan. Full access to every PrepAI feature. Cancel anytime.</p>

            {/* Billing toggle */}
            <div className="mt-8 inline-flex items-center gap-1 glass rounded-2xl p-1.5 border border-[rgba(155,93,229,0.2)]">
              {["monthly","yearly"].map(b => (
                <button key={b} onClick={() => setBilling(b)}
                  className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 capitalize ${
                    billing === b
                      ? "bg-brand-500 text-white shadow-[0_0_15px_rgba(123,47,247,0.4)]"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  {b}
                  {b === "yearly" && <span className="ml-2 text-xs bg-neon-cyan/20 text-neon-cyan px-1.5 py-0.5 rounded-md font-bold">−40%</span>}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Cards */}
          <div className="grid md:grid-cols-2 gap-6 mb-14">

            {/* Free */}
            <motion.div initial={{ opacity:0, x:-20 }} animate={{ opacity:1, x:0 }} transition={{ delay:0.1 }}
              className="glass rounded-3xl p-8 border border-[rgba(155,93,229,0.12)]">
              <p className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Free</p>
              <div className="flex items-end gap-1 mb-1">
                <span className="font-display text-5xl font-extrabold text-white">₹0</span>
                <span className="text-gray-500 mb-2">/month</span>
              </div>
              <p className="text-gray-500 text-sm mb-6">Perfect to get started</p>
              <ul className="space-y-3 mb-8">
                {FREE_FEATURES.map(f => (
                  <li key={f} className="flex items-center gap-3 text-sm text-gray-300">
                    <Check className="w-4 h-4 text-gray-500 flex-shrink-0" />{f}
                  </li>
                ))}
              </ul>
              {user
                ? <Link to="/dashboard"><Button variant="secondary" className="w-full" size="lg">Go to Dashboard</Button></Link>
                : <Link to="/register"><Button variant="secondary" className="w-full" size="lg">Get Started Free</Button></Link>
              }
            </motion.div>

            {/* Premium */}
            <motion.div initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} transition={{ delay:0.15 }}
              className="relative rounded-3xl p-px overflow-hidden"
              style={{ background:"linear-gradient(135deg,rgba(123,47,247,0.6),rgba(78,168,222,0.4))" }}
            >
              <div className="glass-strong rounded-3xl p-8 h-full relative">
                {/* Popular tag */}
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-gradient-to-r from-brand-500 to-neon-blue text-white text-xs font-bold shadow-brand">
                  <Sparkles className="w-3.5 h-3.5" /> Most Popular
                </div>

                <div className="mt-2 mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <p className="text-sm font-semibold text-amber-300 uppercase tracking-wider">Premium</p>
                    <Crown className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="flex items-end gap-1">
                    <span className="font-display text-5xl font-extrabold text-white">₹{displayPrice}</span>
                    <span className="text-gray-400 mb-2">/month</span>
                  </div>
                  {billing === "yearly" && (
                    <p className="text-xs text-neon-cyan mt-1.5">
                      ₹{yearlyPrice} billed annually · Save ₹{monthlyPrice * 12 - yearlyPrice}
                    </p>
                  )}
                  <p className="text-gray-400 text-sm mt-2">Everything you need to crack any interview</p>
                </div>

                {/* Payment methods */}
                <div className="mb-5 p-3 rounded-xl bg-white/5 border border-white/10">
                  <p className="text-xs text-gray-500 mb-2">Secure payment via Razorpay</p>
                  <div className="flex flex-wrap gap-2">
                    {["UPI / GPay","PhonePe","Paytm","Cards","Net Banking"].map(m => (
                      <span key={m} className="text-xs px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-gray-400">{m}</span>
                    ))}
                  </div>
                </div>

                <ul className="space-y-3 mb-8">
                  {PREMIUM_FEATURES.map(f => (
                    <li key={f} className="flex items-center gap-3 text-sm text-gray-200">
                      <div className="w-4 h-4 rounded-full bg-neon-cyan/20 border border-neon-cyan/40 flex items-center justify-center flex-shrink-0">
                        <Check className="w-2.5 h-2.5 text-neon-cyan" />
                      </div>
                      {f}
                    </li>
                  ))}
                </ul>

                {isPremium ? (
                  <div className="w-full py-3.5 rounded-xl bg-neon-cyan/10 border border-neon-cyan/30 text-neon-cyan text-center font-semibold text-sm flex items-center justify-center gap-2">
                    <Crown className="w-4 h-4" /> Premium Active ✓
                  </div>
                ) : (
                  <Button variant="primary" size="lg" className="w-full shadow-brand-lg"
                    onClick={handlePurchase} disabled={loading}>
                    {loading
                      ? "Opening payment..."
                      : <><Crown className="w-5 h-5" /> {user ? `Upgrade — ₹${displayPrice}/mo` : "Get Premium"}</>
                    }
                  </Button>
                )}

                <p className="text-center text-xs text-gray-600 mt-3">
                  Secure · Cancel anytime · Instant access
                </p>
              </div>
            </motion.div>
          </div>

          {/* Trust badges */}
          <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.3 }}
            className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { icon: Shield, label:"Secure Payments",  sub:"256-bit SSL encryption" },
              { icon: Zap,    label:"Instant Access",   sub:"Unlock immediately" },
              { icon: Users,  label:"50,000+ Users",    sub:"Trust PrepAI" },
              { icon: Star,   label:"4.9★ Rating",      sub:"From verified users" },
            ].map(({ icon:Icon, label, sub }) => (
              <div key={label} className="glass rounded-2xl p-4 border border-[rgba(155,93,229,0.1)] text-center">
                <Icon className="w-6 h-6 text-neon-purple mx-auto mb-2" />
                <p className="text-sm font-semibold text-white">{label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{sub}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </Container>
    </div>
  );
};
