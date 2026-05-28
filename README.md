# PrepAI — AI-Powered Interview Preparation Platform

> **Practice. Prepare. Perform.**

PrepAI is a full-stack SaaS platform that simulates real technical, behavioral, and HR interviews using Claude AI, with dynamic follow-up questions, deep analytics, DSA coding practice, resume analysis, and a Razorpay-powered premium subscription system.

---

## ✨ Features

### 🎨 UI / Design
- **Premium dark neon theme** — black/purple/cyan glassmorphism aesthetic
- **Framer Motion animations** — page transitions, floating effects, wobble hovers, fade-ups
- **Glassmorphism cards** — `backdrop-filter` blur with neon glow borders
- **Gradient text & neon shadows** — brand purple → cyan palette throughout
- **Responsive layout** — collapsible sidebar, mobile-first design
- **Custom scrollbar, animated grid background, floating blobs**

### 🤖 AI Interview System (Improved)
- **No repeated questions** — tracks used questions per session
- **Dynamic follow-ups** — AI probes deeper based on your exact answers
- **Answer validation** — redirects off-topic responses
- **Intelligent difficulty scaling** — adapts to answer quality in real-time
- **Contextual conversation** — full message history sent each turn
- **FEEDBACK / SCORE / NEXT** structured AI response format
- **3 modes**: Technical, Behavioral, HR
- **3 difficulty levels**: Easy, Medium, Hard
- **Session timer** with colour warnings

### 💳 Payment — Razorpay Integration
- **Free plan**: 5 interviews/month, 30 DSA problems
- **Premium plan**: ₹499/mo or ₹3594/year (−40%)
- **Supported methods**: UPI, GPay, PhonePe, Paytm, Cards, Net Banking
- **Backend order creation** via `/api/payment/create-order`
- **HMAC-SHA256 signature verification** via `/api/payment/verify`
- **Automatic premium activation** in MongoDB on success
- **Auto-expiry check** on each `/api/payment/status` call
- **Premium route guards** via `ProtectedRoute requirePremium`

### 📊 Dashboard & Analytics
- Score trend (Recharts LineChart), skill radar chart
- Session history table with mode/difficulty/score
- Streak counter, XP, problems solved stats
- Quick action cards to all major features

### 🧩 Other Features
- **450 DSA problems** with Monaco editor, test cases, AI hints
- **Resume Analyzer** — ATS scoring, keyword gap, improvement tips
- **Leaderboard** — ranked table with podium, badges, streak
- **Profile** — skill selector, target role, bio
- **Auth** — email/OTP verify, forgot password, JWT sessions

---

## 🗂 Project Structure

```
prepai/
├── public/
│   ├── logo.png              ← PrepAI logo (favicon + branding)
│   └── index.html
├── src/
│   ├── components/
│   │   ├── ui/index.js       ← Button, Card, GlassCard, Badge, Input, Select…
│   │   ├── layout/
│   │   │   ├── Header.jsx    ← Sticky glass navbar with profile dropdown
│   │   │   └── Sidebar.jsx   ← Collapsible neon sidebar
│   │   ├── PageWrapper.jsx   ← Layout shell with animated page transitions
│   │   ├── LoadingScreen.jsx ← Full-screen branded loader
│   │   └── ProtectedRoute.jsx
│   ├── features/
│   │   ├── landing/          ← Hero, features, testimonials, CTA
│   │   ├── auth/             ← Login, Register, VerifyEmail, ForgotPassword
│   │   ├── dashboard/        ← Stats, quick actions, score chart
│   │   ├── interview/        ← AI mock interview (setup → session → results)
│   │   ├── coding/           ← 450 DSA problems + Monaco editor
│   │   ├── resume/           ← AI resume analyzer + ATS score
│   │   ├── analytics/        ← Score trends, radar, session table
│   │   ├── leaderboard/      ← Podium + ranked table
│   │   ├── profile/          ← User details + skill picker
│   │   └── pricing/          ← Plans + Razorpay checkout
│   ├── index.css             ← Global neon dark styles + Tailwind
│   └── App.jsx               ← Router with all routes
├── server/
│   ├── models/User.js        ← Includes isPremium, premiumPlan, premiumExpiry
│   ├── routes/
│   │   ├── interviewRoutes.js
│   │   ├── paymentRoutes.js  ← NEW: create-order, verify, status
│   │   └── …
│   ├── controllers/
│   │   └── interviewController.js  ← aiProxy (Claude API)
│   └── server.js
├── tailwind.config.js        ← neon-purple, neon-cyan, surface, brand palette
└── .env.example
```

---

## 🚀 Setup

### 1. Clone & Install
```bash
git clone https://github.com/Shiva291-045/project-2.git
cd project-2

# Frontend
npm install

# Backend
cd server && npm install
```

### 2. Environment Variables
```bash
# Frontend (.env)
REACT_APP_RAZORPAY_KEY_ID=rzp_test_XXXX

# Backend (server/.env)  — copy from .env.example
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your_secret
ANTHROPIC_API_KEY=sk-ant-...
RAZORPAY_KEY_ID=rzp_test_XXXX
RAZORPAY_KEY_SECRET=your_razorpay_secret
```

### 3. Run
```bash
# Terminal 1 — backend
cd server && npm run dev

# Terminal 2 — frontend
npm start
```

---

## 💳 Razorpay Setup

1. Create account at [razorpay.com](https://razorpay.com)
2. Go to **Settings → API Keys** → Generate Test Key
3. Add `RAZORPAY_KEY_ID` + `RAZORPAY_KEY_SECRET` to `server/.env`
4. Add `REACT_APP_RAZORPAY_KEY_ID` to frontend `.env`
5. Test with UPI ID `success@razorpay` in test mode

---

## 🎨 Design System

| Token | Value |
|---|---|
| `--brand` | `#7b2ff7` (purple) |
| `--neon-purple` | `#9b5de5` |
| `--neon-blue` | `#4ea8de` |
| `--neon-cyan` | `#00f5d4` |
| `--surface` | `#0a0a18` |
| `--card` | `#0f0f24` |
| Font Display | Syne |
| Font Body | DM Sans |
| Font Mono | DM Mono |

---

## 📄 License
MIT © PrepAI 2025
