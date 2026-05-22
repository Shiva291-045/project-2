# PrepAI - AI-Powered Interview Preparation Platform
## Complete Implementation Guide

### 🎯 Project Overview

PrepAI is a full-stack, production-grade interview preparation platform that combines:
- **Real AI Interviews** powered by Google Gemini API
- **DSA Coding Practice** with 100+ real interview problems
- **Mock Interviews** with detailed performance analytics
- **Real-time Voice Input** using Web Speech API
- **Comprehensive Analytics** tracking user progress

### 🏗️ Architecture

#### Frontend (React + Vite)
```
src/
├── features/
│   ├── auth/           # Authentication & profile management
│   ├── interview/      # Real AI interview room with voice support
│   ├── coding/         # DSA problem practice & submissions
│   ├── dashboard/      # User dashboard & analytics
│   ├── leaderboard/    # Competitive rankings
│   └── resume/         # Resume parsing & analysis
├── components/         # Reusable UI components
├── hooks/             # Custom React hooks (useAuth, etc.)
├── services/          # API client & utilities
└── config/            # Firebase & config files
```

#### Backend (Express.js + Firebase)
```
server/
├── routes/            # API endpoints (6 routers)
│   ├── authRoutes.js      # Authentication
│   ├── interviewRoutes.js # AI interview endpoints
│   ├── codingRoutes.js    # Coding problems & submissions
│   ├── analyticsRoutes.js # User analytics
│   ├── resumeRoutes.js    # Resume analysis
│   └── leaderboardRoutes.js
├── services/          # Business logic
│   └── geminiService.js   # Gemini AI integration
├── data/             # Problem datasets
│   └── dsaProblems.js    # 100+ DSA problems database
├── middleware/        # Auth, validation, error handling
├── config/           # Firebase Admin setup
└── server.js         # Express app entry point
```

### 🔑 Key Features

#### 1. **Real AI Interview Room** (`/src/features/interview/InterviewRoom.jsx`)

**Capabilities:**
- Multi-turn AI conversation using Gemini 1.5 Pro
- Real-time feedback on answers (score + suggestions)
- Voice input via Web Speech API (SpeechRecognition)
- Interview transcript preservation
- Performance analysis with detailed breakdown:
  - Overall score (0-100)
  - Technical accuracy, clarity, completeness metrics
  - Strengths & weaknesses identification
  - Personalized recommendations

**Interview Types:**
- Technical interviews (algorithms, DS, coding)
- System design interviews
- Behavioral interviews
- Mixed interviews (tech + behavioral)
- Rapid-fire format
- Project-based format

**Usage:**
```javascript
// Start new interview
POST /api/interview/start
{
  "interviewType": "technical"
}

// Send response
POST /api/interview/:sessionId/respond
{
  "userResponse": "I would use a hash map to solve this problem..."
}

// End interview & get analysis
POST /api/interview/:sessionId/end

// Get interview history
GET /api/interview/history?limit=10&offset=0
```

#### 2. **Real DSA Coding Problems Database** (`/server/data/dsaProblems.js`)

**Content:**
- 100+ real interview preparation problems
- Covers 20 major DSA topics:
  - Arrays, Strings, Hashing, Recursion, Backtracking
  - Linked Lists, Stack, Queue, Sliding Window
  - Binary Search, Trees, BST, Heaps
  - Graphs, DP, Greedy, Tries, Bit Manipulation
  - Segment Trees, Advanced Data Structures

**Each Problem Includes:**
- Title, difficulty (Easy/Medium/Hard)
- Company tags (Amazon, Google, Meta, etc.)
- Detailed description & constraints
- 2+ code examples
- Brute force solution
- Optimized solution with explanation
- Time & space complexity analysis
- Key learning points
- Related topics

**Example Problem Structure:**
```javascript
{
  id: "array-001",
  title: "Two Sum",
  difficulty: "Easy",
  companies: ["Amazon", "Google"],
  description: "...",
  constraints: "...",
  examples: [...],
  starterCode: "...",
  bruteForceSolution: "...",
  optimizedSolution: "...",
  timeComplexity: "O(n)",
  spaceComplexity: "O(n)",
  topicTags: ["Array", "Hash Table"],
  keyLearnings: [...]
}
```

**Usage:**
```javascript
// Get all problems with filters
GET /api/coding/problems?page=1&limit=20&topic=Arrays&difficulty=Medium

// Get specific problem
GET /api/coding/problems/:id

// Submit solution
POST /api/coding/submit
{
  "problemId": "array-001",
  "code": "function twoSum(...) { ... }",
  "language": "javascript"
}

// Get user statistics
GET /api/coding/statistics
```

#### 3. **Real Gemini AI Service** (`/server/services/geminiService.js`)

**Functions:**

**startInterview(interviewType, userProfile)**
- Initializes new interview session
- Generates contextual opening question
- Returns opening statement

**getInterviewResponse(userMessage, conversationHistory, interviewType, userProfile)**
- Maintains multi-turn conversation
- Provides real-time feedback on answers
- Scores responses (1-10)
- Returns feedback suggestions

**analyzeInterviewPerformance(conversationHistory, interviewType)**
- Analyzes entire interview
- Returns JSON with:
  - Overall score (0-100)
  - Category scores (technical, clarity, communication, etc.)
  - Strengths & weaknesses
  - Improvement suggestions

**gradeCodeSolution(problemId, userCode, problemData, testResults)**
- Evaluates code quality
- Analyzes efficiency
- Provides improvement suggestions
- Returns detailed feedback

**generateCodingExplanation(problemId, problemData)**
- Explains problem-solving approach
- Covers algorithm, complexity analysis
- Identifies edge cases
- Educational format

### 🗄️ Database Schema (Firebase Firestore)

#### Collections:

**users**
```
{
  uid: string,
  email: string,
  displayName: string,
  photoURL: string,
  
  // Interview stats
  totalInterviews: number,
  averageScore: number,
  lastInterviewDate: timestamp,
  weakAreas: string[],
  strongAreas: string[],
  
  // Coding stats
  problemsSolved: string[],
  problemsAttempted: string[],
  totalSubmissions: number,
  
  // Profile
  targetRole: string,
  skills: string[],
  experience: string,
  createdAt: timestamp
}
```

**interviews**
```
{
  userId: string,
  interviewType: string,
  startTime: timestamp,
  endTime: timestamp,
  status: "active" | "completed",
  
  transcript: [
    {
      role: "user" | "assistant",
      content: string,
      timestamp: timestamp,
      feedback?: { score, message }
    }
  ],
  
  analysis: {
    overallScore: number,
    technicalAccuracy: number,
    clarity: number,
    completeness: number,
    communication: number,
    confidence: number,
    strengths: string[],
    weaknesses: string[],
    improvements: string[],
    summary: string
  }
}
```

**codeSubmissions**
```
{
  userId: string,
  problemId: string,
  code: string,
  language: string,
  submittedAt: timestamp,
  status: "accepted" | "partial" | "rejected",
  
  testResults: [
    { id: number, passed: boolean }
  ],
  allPassed: boolean,
  passCount: number,
  totalTests: number,
  
  grade: {
    score: number,
    codeQuality: number,
    efficiency: number,
    correctness: number,
    feedback: string,
    improvements: string[],
    learningPoints: string[]
  }
}
```

**analytics**
```
{
  userId: string,
  date: timestamp,
  
  // Interview metrics
  interviewsCompleted: number,
  averageInterviewScore: number,
  interviewsByType: { technical: n, behavioral: n, ... },
  
  // Coding metrics
  problemsSolvedToday: number,
  totalProblemsAttempted: number,
  acceptanceRate: number,
  
  // Topic breakdown
  topicStats: {
    "Arrays": { attempted: n, solved: m },
    ...
  },
  difficultyStats: {
    "Easy": { attempted: n, solved: m },
    ...
  }
}
```

### 🔐 Authentication

**Mock System (Development):**
- Uses localStorage for user storage
- Perfect for testing without Firebase credentials
- Stored in `src/config/mockAuth.js` and `src/config/mockFirestore.js`

**Real Firebase (Production):**
- Configure `.env.production` with Firebase credentials
- Switch by updating `src/config/firebaseAuth.js` to use real Firebase SDK
- JWT tokens for backend authentication

**Environment Variables:**
```
REACT_APP_FIREBASE_API_KEY=...
REACT_APP_FIREBASE_AUTH_DOMAIN=...
REACT_APP_FIREBASE_PROJECT_ID=...
REACT_APP_FIREBASE_STORAGE_BUCKET=...
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=...
REACT_APP_FIREBASE_APP_ID=...
GEMINI_API_KEY=...
JWT_SECRET=...
```

### 🎤 Voice Input Implementation

**Browser Support:**
- Chrome, Edge, Safari (iOS 15+), Opera
- Falls back to text input gracefully

**Features:**
```javascript
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

const recognition = new SpeechRecognition();
recognition.continuous = false;
recognition.interimResults = true;
recognition.lang = "en-US";

// Shows interim results while speaking
recognition.onresult = (event) => {
  let interim = "";
  let final = "";
  
  for (let i = event.resultIndex; i < event.results.length; i++) {
    const transcript = event.results[i][0].transcript;
    if (event.results[i].isFinal) {
      final += transcript + " ";
    } else {
      interim += transcript;
    }
  }
  
  // Update UI with interim text and final transcription
};
```

### 📊 Analytics & Metrics

**User Dashboard Shows:**
- Total interviews completed
- Average interview score
- Problems solved / attempted
- Topic-wise performance
- Difficulty-wise breakdown
- Weekly progress trends
- Strengths & weaknesses summary
- Leaderboard ranking

**Interview Analysis Includes:**
- Individual answer scores
- Feedback on each response
- Performance categories:
  - Technical accuracy
  - Communication clarity
  - Completeness of answers
  - Confidence level
- Comparative metrics

### 🚀 Setup Instructions

**1. Install Dependencies**
```bash
# Frontend
npm install

# Backend
cd server && npm install
```

**2. Configure Environment**
```bash
# Copy and fill .env.production
cp .env.production.example .env.production
```

**3. Start Development**
```bash
# Terminal 1: Frontend (Vite dev server)
npm run dev

# Terminal 2: Backend (Node.js)
cd server && npm start
```

**4. Access Application**
```
Frontend: http://localhost:5173
Backend: http://localhost:5000
API: http://localhost:5000/api
```

### 🔄 API Endpoints

#### Authentication
```
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
GET /api/auth/profile
```

#### Interview
```
POST /api/interview/start
POST /api/interview/:sessionId/respond
POST /api/interview/:sessionId/end
GET /api/interview/history
GET /api/interview/:sessionId
POST /api/interview/generate-questions
```

#### Coding
```
GET /api/coding/problems
GET /api/coding/problems/:id
GET /api/coding/topics
GET /api/coding/difficulties
POST /api/coding/submit
GET /api/coding/submissions
GET /api/coding/submissions/:submissionId
GET /api/coding/problems/:problemId/explanation
GET /api/coding/statistics
```

#### Analytics
```
GET /api/analytics/overview
GET /api/analytics/interview-stats
GET /api/analytics/coding-stats
GET /api/analytics/topic-breakdown
GET /api/analytics/weekly-progress
```

#### Leaderboard
```
GET /api/leaderboard/global
GET /api/leaderboard/coding
GET /api/leaderboard/interviews
GET /api/leaderboard/user/:userId
```

### 📚 Dependencies

**Frontend:**
- React 18.2.0
- React Router 6.22.0
- Framer Motion 11.0.6 (animations)
- Recharts 2.10.4 (analytics charts)
- Monaco Editor 4.6.0 (code editing)
- Tailwind CSS 3.4.1 (styling)
- Firebase 10.7.1 (real-time DB)
- @google/generative-ai 0.3.0 (Gemini API client)

**Backend:**
- Express 4.18.2
- Firebase Admin 12.0.0
- @google/generative-ai 0.3.0
- jsonwebtoken 9.1.2
- dotenv 16.3.1
- CORS 2.8.5

### 🎯 Real vs Mock Implementation

**Mock Mode (Development):**
- Uses in-memory localStorage
- No external API calls
- Perfect for testing UI
- Instant responses
- See: `src/config/mockAuth.js`, `src/config/mockFirestore.js`

**Real Mode (Production):**
- Firebase authentication
- Firestore persistence
- Gemini API for AI
- Real-time database sync
- Configure in `.env.production`

### 🛡️ Security Considerations

1. **API Keys:** Stored in environment variables, never committed
2. **JWT Tokens:** Issued by backend, validated on protected routes
3. **Firestore Rules:** Configure to restrict user data access
4. **Rate Limiting:** Implement on backend for API endpoints
5. **CORS:** Configured to allow frontend domain only

### 📈 Performance Optimizations

1. **Code Splitting:** Route-based lazy loading
2. **Memoization:** React.memo for expensive components
3. **Pagination:** Problems loaded in batches (20 per page)
4. **Caching:** Interview history cached on client
5. **Debouncing:** Search queries debounced
6. **Image Optimization:** Compressed assets

### 🧪 Testing

**To test the platform:**

1. **Authentication**
   - Register with email/password
   - Login with credentials
   - Mock users persist in localStorage

2. **Interview Room**
   - Start new interview
   - Send text responses
   - Use voice recording (if browser supports)
   - End interview to see analysis

3. **Coding Practice**
   - Browse problems by topic
   - Select problem and view details
   - Submit code solution
   - View test results and feedback

4. **Analytics**
   - View dashboard metrics
   - Check topic-wise progress
   - See interview history
   - Track coding submissions

### 📝 Common Issues & Solutions

**Issue:** Microphone not working
- **Solution:** Check browser permissions, ensure HTTPS in production

**Issue:** Interview API errors
- **Solution:** Verify Gemini API key is set in environment

**Issue:** Problems not loading
- **Solution:** Check server is running, verify API endpoint

**Issue:** Firebase errors in production
- **Solution:** Configure `.env.production` with valid credentials

### 🔮 Future Enhancements

- [ ] Video interview with webcam recording
- [ ] Whiteboard for system design discussions
- [ ] Collaborative interviews with peers
- [ ] AI resume parser with ATS scoring
- [ ] Integration with LinkedIn for profile import
- [ ] Timed contest mode with rankings
- [ ] Mobile app (React Native)
- [ ] Browser extension for problem hints
- [ ] Company-specific interview packs
- [ ] Mentor matching system

### 📞 Support

For issues or questions:
1. Check console for error messages
2. Review API response in network tab
3. Verify environment configuration
4. Check Firebase console for data

### 📄 License

MIT License - Feel free to use and modify for your needs!

---

**Happy Interviewing!** 🚀
