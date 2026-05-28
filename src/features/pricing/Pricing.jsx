import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Container, Button, Badge } from "../../components/ui";
import { useAuth } from "../../hooks/useAuth";
import {
  Check, Crown, Zap, Brain, Code2, FileText, BarChart3,
  Shield, Sparkles, ArrowRight, X, Star, Users, Infinity,
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

export const Pricing = () => {
  const { user, userProfile } = useAuth();
  const navigate = useNavigate();
  const [billing,   setBilling]   = useState("monthly");  // monthly | yearly
  const [loading,   setLoading]   = useState(false);
  const isPremium = userProfile?.isPremium || false;

  const monthlyPrice = 499;
  const yearlyPrice  = Math.round(monthlyPrice * 12 * 0.6);
  const displayPrice = billing === "monthly" ? monthlyPrice : Math.round(yearlyPrice / 12);
  const savePercent  = 40;

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
    setLoading(true);
    try {
      const ok = await loadRazorpay();
      if (!ok) { toast.error("Payment gateway failed to load. Please try again."); setLoading(false); return; }

      // Create order from backend
      const token = localStorage.getItem("prepai_token");
      const orderRes = await fetch("/api/payment/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ plan: billing, amount: billing === "monthly" ? monthlyPrice * 100 : yearlyPrice * 100 }),
      });

      let orderId = null;
      if (orderRes.ok) {
        const orderData = await orderRes.json();
        orderId = orderData?.data?.orderId || orderData?.orderId;
      }

      const opts = {
        key: process.env.REACT_APP_RAZORPAY_KEY_ID || "rzp_test_placeholder",
        amount: (billing === "monthly" ? monthlyPrice : yearlyPrice) * 100,
        currency: "INR",
        name: "PrepAI Premium",
        description: `PrepAI Premium — ${billing === "monthly" ? "Monthly" : "Yearly"} Plan`,
        image: "/logo.png",
        order_id: orderId || undefined,
        prefill: {
          name:  userProfile?.name || user?.displayName || "",
          email: user?.email || "",
        },
        theme: { color: "#7b2ff7" },
        modal: { backdropclose: false },
        handler: async (response) => {
          try {
            const verRes = await fetch("/api/payment/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
              body: JSON.stringify({
                razorpay_order_id:   response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature:  response.razorpay_signature,
                plan: billing,
              }),
            });
            if (verRes.ok) {
              toast.success("🎉 Welcome to PrepAI Premium! Enjoy unlimited access.");
              setTimeout(() => navigate("/dashboard"), 1500);
            } else {
              toast.error("Payment verification failed. Contact support.");
            }
          } catch {
            toast.error("Verification error. Please contact support.");
          }
        },
      };

      const rzp = new window.Razorpay(opts);
      rzp.on("payment.failed", () => toast.error("Payment failed. Please try again."));
      rzp.open();
    } catch (err) {
      toast.error("Something went wrong. Please try again.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-surface text-white relative overflow-hidden">
      <div className="absolute inset-0 grid-bg opacity-40" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-brand-500/8 blur-3xl" />

      {/* Nav */}
      <header className="glass-strong border-b border-[rgba(155,93,229,0.15)] sticky top-0 z-50">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-neon-purple/60 to-transparent" />
        <Container>
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-3">
              <img src="/logo.png" alt="PrepAI" className="w-9 h-9 rounded-xl object-contain" />
              <span className="font-display text-xl font-bold gradient-text">PrepAI</span>
            </Link>
            <div className="flex items-center gap-3">
              {user ? (
                <Link to="/dashboard"><Button variant="secondary" size="sm">Dashboard</Button></Link>
              ) : (
                <>
                  <Link to="/login"><Button variant="ghost" size="sm">Sign in</Button></Link>
                  <Link to="/register"><Button variant="primary" size="sm">Get Started</Button></Link>
                </>
              )}
            </div>
          </div>
        </Container>
      </header>

      <Container>
        <div className="py-20 max-w-5xl mx-auto">
          {/* Heading */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="text-center mb-14"
          >
            <Badge variant="premium" className="mb-4 text-sm px-4 py-1.5">
              <Crown className="w-4 h-4 text-amber-400" /> Simple, Transparent Pricing
            </Badge>
            <h1 className="font-display text-5xl sm:text-6xl font-extrabold mb-4">
              Invest in Your <span className="gradient-text">Career</span>
            </h1>
            <p className="text-gray-400 text-lg max-w-xl mx-auto">One premium plan. Full access to every PrepAI feature. Cancel anytime.</p>

            {/* Billing toggle */}
            <div className="mt-8 inline-flex items-center gap-3 glass rounded-2xl p-1.5 border border-[rgba(155,93,229,0.2)]">
              {["monthly", "yearly"].map(b => (
                <button
                  key={b}
                  onClick={() => setBilling(b)}
                  className={`relative px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 capitalize ${billing === b ? "bg-brand-500 text-white shadow-[0_0_15px_rgba(123,47,247,0.4)]" : "text-gray-400 hover:text-white"}`}
                >
                  {b}
                  {b === "yearly" && <span className="ml-2 text-xs bg-neon-cyan/20 text-neon-cyan px-1.5 py-0.5 rounded-md font-bold">-{savePercent}%</span>}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Cards */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Free */}
            <motion.div
              initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="glass rounded-3xl p-8 border border-[rgba(155,93,229,0.12)]"
            >
              <div className="mb-6">
                <p className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Free</p>
                <div className="flex items-end gap-1">
                  <span className="font-display text-5xl font-extrabold text-white">₹0</span>
                  <span className="text-gray-500 mb-2">/month</span>
                </div>
                <p className="text-gray-500 text-sm mt-2">Perfect to get started</p>
              </div>

              <ul className="space-y-3 mb-8">
                {FREE_FEATURES.map(f => (
                  <li key={f} className="flex items-center gap-3 text-sm text-gray-300">
                    <Check className="w-4 h-4 text-gray-500 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>

              {user ? (
                <Link to="/dashboard">
                  <Button variant="secondary" className="w-full" size="lg">Go to Dashboard</Button>
                </Link>
              ) : (
                <Link to="/register">
                  <Button variant="secondary" className="w-full" size="lg">Get Started Free</Button>
                </Link>
              )}
            </motion.div>

            {/* Premium */}
            <motion.div
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 }}
              className="relative rounded-3xl p-px overflow-hidden"
              style={{ background: "linear-gradient(135deg, rgba(123,47,247,0.6), rgba(78,168,222,0.4))" }}
            >
              <div className="relative glass-strong rounded-3xl p-8 h-full">
                {/* Popular badge */}
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <div className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-gradient-to-r from-brand-500 to-neon-blue text-white text-xs font-bold shadow-brand">
                    <Sparkles className="w-3.5 h-3.5" /> Most Popular
                  </div>
                </div>

                <div className="mb-6 mt-2">
                  <div className="flex items-center gap-2 mb-3">
                    <p className="text-sm font-semibold text-amber-300 uppercase tracking-wider">Premium</p>
                    <Crown className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="flex items-end gap-1">
                    <span className="font-display text-5xl font-extrabold text-white">₹{displayPrice}</span>
                    <span className="text-gray-400 mb-2">/month</span>
                  </div>
                  {billing === "yearly" && (
                    <p className="text-xs text-neon-cyan mt-1.5">₹{yearlyPrice} billed annually · Save ₹{monthlyPrice * 12 - yearlyPrice}</p>
                  )}
                  <p className="text-gray-400 text-sm mt-2">Everything you need to crack any interview</p>
                </div>

                {/* Payment methods */}
                <div className="mb-5 p-3 rounded-xl bg-white/5 border border-white/10">
                  <p className="text-xs text-gray-500 mb-2">Accepted payments via Razorpay</p>
                  <div className="flex flex-wrap gap-2">
                    {["UPI / GPay", "PhonePe", "Paytm", "Cards", "Net Banking"].map(m => (
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
                  <Button
                    variant="primary" size="lg" className="w-full shadow-brand-lg"
                    onClick={handlePurchase} disabled={loading}
                  >
                    {loading ? "Processing..." : <>
                      <Crown className="w-5 h-5" />
                      {user ? `Upgrade Now — ₹${displayPrice}/mo` : "Get Premium"}
                    </>}
                  </Button>
                )}

                <p className="text-center text-xs text-gray-600 mt-3">Secure payment · Cancel anytime · Instant access</p>
              </div>
            </motion.div>
          </div>

          {/* Trust badges */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-14 grid grid-cols-2 sm:grid-cols-4 gap-4"
          >
            {[
              { icon: Shield, label: "Secure Payments", sub: "256-bit SSL encryption" },
              { icon: Zap,    label: "Instant Access",  sub: "Unlock immediately" },
              { icon: Users,  label: "50,000+ Users",   sub: "Trust PrepAI" },
              { icon: Star,   label: "4.9★ Rating",     sub: "From verified users" },
            ].map(({ icon: Icon, label, sub }) => (
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
