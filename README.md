# PrepAI - AI-Powered Interview Preparation Platform

A modern, full-stack SaaS application for interview preparation with AI-powered coaching, real-time feedback, and comprehensive analytics.

## 🚀 Features

### Core Features
- **AI Interview Coach**: Practice interviews with an advanced AI model powered by Google Gemini
- **Real-time Feedback**: Get instant feedback on technical accuracy, communication, and clarity
- **Coding Practice**: Solve 500+ LeetCode-style problems with Monaco editor
- **Resume Analyzer**: Upload your resume for ATS scoring and improvement suggestions
- **Analytics Dashboard**: Track progress with detailed charts and insights
- **Global Leaderboard**: Compete with other candidates and earn badges

### Interview Modes
- Technical Interview
- HR Interview
- Mixed Interview
- Rapid Fire
- Project-Based Interview

### Technologies

**Frontend:**
- React.js 18
- Vite
- Tailwind CSS
- Framer Motion (animations)
- Recharts (analytics)
- Monaco Editor (code editor)
- Firebase Authentication

**Backend:**
- Node.js + Express.js
- Firebase Firestore (database)
- Firebase Authentication
- Google Gemini API
- Multer (file uploads)

**Deployment Ready:**
- Docker support
- Environment-based configuration
- Production-grade error handling

## 📋 Project Structure

```
prepai/
├── src/
│   ├── app/
│   ├── components/
│   │   ├── ui/          # Reusable UI components
│   │   ├── layout/      # Layout components
│   │   └── common/      # Common components
│   ├── features/
│   │   ├── auth/        # Authentication
│   │   ├── dashboard/   # Dashboard
│   │   ├── interview/   # Interview room
│   │   ├── resume/      # Resume analyzer
│   │   ├── analytics/   # Analytics
│   │   ├── coding/      # Coding practice
│   │   ├── leaderboard/ # Leaderboard
│   │   ├── landing/     # Landing page
│   │   └── profile/     # User profile
│   ├── services/        # API services
│   ├── hooks/           # Custom hooks
│   ├── utils/           # Utilities
│   ├── config/          # Configuration
│   ├── styles/          # Global styles
│   ├── data/            # Mock data
│   ├── assets/          # Images, fonts
│   ├── App.jsx
│   └── index.js
├── server/
│   ├── controllers/     # Route controllers
│   ├── routes/          # API routes
│   ├── middleware/      # Express middleware
│   ├── services/        # Business logic
│   ├── prompts/         # AI prompts
│   ├── config/          # Configuration
│   ├── utils/           # Utilities
│   └── server.js
├── public/
├── package.json
├── tailwind.config.js
└── README.md
```

## 🔧 Setup Instructions

### Prerequisites
- Node.js >= 16
- npm or yarn
- Firebase project account
- Google Gemini API key

### Frontend Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Create `.env` file:**
   ```env
   REACT_APP_FIREBASE_API_KEY=your_api_key
   REACT_APP_FIREBASE_AUTH_DOMAIN=your_auth_domain
   REACT_APP_FIREBASE_PROJECT_ID=your_project_id
   REACT_APP_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   REACT_APP_FIREBASE_APP_ID=your_app_id
   REACT_APP_API_URL=http://localhost:5001
   ```

3. **Start development server:**
   ```bash
   npm start
   ```

### Backend Setup

1. **Navigate to server directory:**
   ```bash
   cd server
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create `.env` file:**
   ```env
   PORT=5001
   NODE_ENV=development
   REACT_APP_FIREBASE_PROJECT_ID=your_project_id
   GEMINI_API_KEY=your_gemini_api_key
   FIREBASE_SERVICE_ACCOUNT=your_firebase_service_account_json
   ```

4. **Start server:**
   ```bash
   npm run dev
   ```

### Run Both Frontend and Backend

```bash
npm run dev
```

This will start both the React app (port 5000) and Express server (port 5001) concurrently.

## 📚 API Endpoints

### Authentication
- `POST /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile
- `GET /api/auth/stats` - Get user statistics

### Interview
- `POST /api/interview/start` - Start new interview
- `POST /api/interview/:id/message` - Send message in interview
- `POST /api/interview/:id/end` - End interview
- `GET /api/interview/history` - Get interview history

### Coding
- `GET /api/coding/problems` - Get coding problems
- `POST /api/coding/submit` - Submit solution
- `GET /api/coding/submissions` - Get submission history

### Analytics
- `GET /api/analytics` - Get user analytics
- `GET /api/analytics/topics` - Get topic-wise analytics

### Leaderboard
- `GET /api/leaderboard` - Get global leaderboard
- `GET /api/leaderboard/rank` - Get user rank

## 🎨 UI/UX Features

- **Dark/Light Mode**: Theme toggle with localStorage persistence
- **Glassmorphism Cards**: Modern card design with transparency
- **Gradient Accents**: Purple and Cyan gradient theme
- **Smooth Animations**: Framer Motion animations
- **Responsive Design**: Mobile-first approach
- **Loading States**: Skeleton loaders and spinners
- **Toast Notifications**: React Hot Toast integration

## 🔐 Security Features

- Firebase Authentication
- JWT token verification on backend
- Protected routes
- Secure API endpoints
- Environment variable management
- CORS configuration

## 📊 Database Schema

### Users Collection
```javascript
{
  uid: string,
  name: string,
  email: string,
  targetRole: string,
  skills: string[],
  bio: string,
  streak: number,
  xp: number,
  strongTopics: string[],
  weakTopics: string[],
  createdAt: timestamp
}
```

### Interviews Collection
```javascript
{
  userId: string,
  type: string,
  skills: string[],
  messages: array,
  score: number,
  feedback: string,
  duration: number,
  startedAt: timestamp,
  endedAt: timestamp,
  status: string
}
```

### Coding Submissions Collection
```javascript
{
  userId: string,
  problemId: string,
  code: string,
  language: string,
  passed: boolean,
  submittedAt: timestamp
}
```

## 🚀 Deployment

### Firebase Deployment (Frontend)
```bash
npm run build
firebase deploy --only hosting
```

### Heroku Deployment (Backend)
```bash
git push heroku main
```

### Docker Deployment
```bash
docker build -t prepai-frontend .
docker run -p 3000:3000 prepai-frontend

cd server
docker build -t prepai-backend .
docker run -p 5000:5000 prepai-backend
```

## 🎓 Demo Credentials

**Email:** demo@prepai.com
**Password:** Demo123!@#

## 📝 Features in Progress

- [ ] Voice interview mode
- [ ] Resume ATS checker
- [ ] Gamification system
- [ ] Achievement badges
- [ ] Daily challenges
- [ ] Community forum
- [ ] Real-time notifications
- [ ] Interview scheduling calendar

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

MIT License - feel free to use this project for your own purposes.

## 📞 Support

For support, email support@prepai.com or open an issue on GitHub.

---

**Built with ❤️ by the PrepAI Team**
