# PrepAI – AI-Powered Interview Preparation Platform

A full-featured, production-ready platform for software engineering interview preparation.

## ✨ Features

| Feature | Status | Details |
|---------|--------|---------|
| 450 DSA Problems | ✅ | Topic + difficulty filtering, search, solved tracking |
| Monaco Code Editor | ✅ | JS, Python, C, C++, Java with dark/light theme |
| Code Execution | ✅ | Browser JS + Judge0 API (optional key) |
| AI Interview Room | ✅ | Technical, Behavioral, HR modes; voice input; scoring |
| Resume Analyzer | ✅ | PDF/DOC upload, ATS score, AI suggestions |
| Firebase Auth | ✅ | Email/password login, register, protected routes |
| Dashboard | ✅ | Stats, charts, recent sessions |
| Analytics | ✅ | Score trends, radar chart, session history |
| Leaderboard | ✅ | Community rankings |
| Dark Mode | ✅ | Full Tailwind dark mode support |
| Mobile Responsive | ✅ | Works on all screen sizes |

## 🚀 Quick Start

### 1. Clone & Install

```bash
git clone https://github.com/Shiva291-045/project-2.git
cd project-2
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and fill in your keys:

```bash
cp .env.example .env
```

**Required:** Firebase credentials (get from [Firebase Console](https://console.firebase.google.com))  
**Optional:** Anthropic API key (better AI responses), Judge0 key (multi-language code execution)

### 3. Run Development Server

```bash
npm start
```

App opens at `http://localhost:3000`

## 🔧 Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `REACT_APP_FIREBASE_*` | ✅ | Firebase project credentials |
| `REACT_APP_ANTHROPIC_KEY` | Optional | AI-powered resume analysis & interview feedback |
| `REACT_APP_JUDGE0_KEY` | Optional | Multi-language code execution via Judge0 |

## 🏗️ Architecture

```
src/
├── components/
│   ├── layout/        # Header, Sidebar
│   ├── ui/            # Button, Card, Badge, etc.
│   └── ProtectedRoute.jsx
├── context/
│   └── AuthContext.jsx  # Firebase auth state
├── features/
│   ├── analytics/     # Progress charts
│   ├── auth/          # Login, Register
│   ├── coding/        # 450 DSA problems + editor
│   ├── dashboard/     # Home screen
│   ├── interview/     # AI interview room
│   ├── landing/       # Public landing page
│   ├── leaderboard/   # Rankings
│   └── resume/        # Resume analyzer
├── data/
│   └── 450DSA.json    # Problem database
├── hooks/
│   └── useAuth.js
└── services/
    └── apiClient.js
```

## 🎯 Key Decisions

- **Local-first**: Solved problems, interview history, and analytics are stored in localStorage — no backend required.
- **AI optional**: The platform works fully without API keys; connecting Anthropic adds richer AI responses.
- **Firebase auth**: Secure authentication with email/password; Firestore stores optional profile data.
- **Judge0 for code**: Optional RapidAPI key enables multi-language execution; JS runs directly in the browser as fallback.

## 📦 Build for Production

```bash
npm run build
```

Output goes to `build/` — deploy to Vercel, Netlify, Firebase Hosting, or any static host.

## 🛠️ Tech Stack

- **React 18** + React Router v6
- **Tailwind CSS** + custom dark mode
- **Firebase 10** (Auth + Firestore)
- **Monaco Editor** (@monaco-editor/react)
- **Recharts** for analytics
- **Framer Motion** for animations
- **Lucide React** icons
