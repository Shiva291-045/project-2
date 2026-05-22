# PrepAI Architecture Documentation

## System Overview

PrepAI is a full-stack SaaS application for AI-powered interview preparation using a microservices-inspired architecture with clear separation of concerns.

## Technology Stack

### Frontend
- **React 18**: Modern UI library
- **Vite**: Fast build tool (future)
- **Tailwind CSS**: Utility-first CSS framework
- **Framer Motion**: Smooth animations
- **Firebase SDK**: Authentication and real-time updates
- **Recharts**: Data visualization
- **Monaco Editor**: Code editor
- **Axios**: HTTP client
- **React Router**: Client-side routing

### Backend
- **Express.js**: Node.js framework
- **Firebase Admin SDK**: Backend Firebase integration
- **Google Generative AI**: Gemini API integration
- **Multer**: File upload handling
- **CORS**: Cross-origin handling

### Database & Auth
- **Firebase Firestore**: NoSQL document database
- **Firebase Authentication**: User authentication
- **Firebase Storage**: File storage

## Folder Structure

```
prepai/
├── src/
│   ├── app/                     # Application configuration
│   ├── components/
│   │   ├── ui/                  # Reusable UI components
│   │   │   ├── Button.jsx
│   │   │   ├── Card.jsx
│   │   │   ├── Input.jsx
│   │   │   └── ...
│   │   ├── layout/              # Layout components
│   │   │   ├── Header.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   └── Footer.jsx
│   │   └── common/              # Common components
│   │       ├── LoadingSpinner.jsx
│   │       └── Modal.jsx
│   ├── features/                # Feature modules
│   │   ├── auth/
│   │   │   ├── AuthProvider.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   └── useAuth.js
│   │   ├── dashboard/
│   │   │   └── Dashboard.jsx
│   │   ├── interview/
│   │   │   └── InterviewRoom.jsx
│   │   ├── coding/
│   │   │   └── CodingPractice.jsx
│   │   ├── resume/
│   │   │   └── ResumeAnalyzer.jsx
│   │   ├── analytics/
│   │   │   └── Analytics.jsx
│   │   ├── leaderboard/
│   │   │   └── Leaderboard.jsx
│   │   ├── landing/
│   │   │   └── Landing.jsx
│   │   └── profile/
│   │       └── Profile.jsx
│   ├── services/                # API and business logic
│   │   ├── apiClient.js
│   │   └── authService.js
│   ├── hooks/                   # Custom React hooks
│   │   ├── useAuth.js
│   │   ├── useDebounce.js
│   │   └── useLocalStorage.js
│   ├── utils/                   # Utility functions
│   │   ├── helpers.js
│   │   └── validators.js
│   ├── config/                  # Configuration files
│   │   └── firebase.js
│   ├── styles/                  # Global styles
│   │   └── index.css
│   ├── data/                    # Mock data
│   │   └── mockData.js
│   ├── assets/                  # Static assets
│   │   └── images/
│   ├── App.jsx                  # Main App component
│   └── index.js                 # Entry point
├── server/
│   ├── controllers/             # Request handlers
│   │   ├── authController.js
│   │   ├── interviewController.js
│   │   └── ...
│   ├── routes/                  # API routes
│   │   ├── authRoutes.js
│   │   ├── interviewRoutes.js
│   │   ├── codingRoutes.js
│   │   └── ...
│   ├── middleware/              # Express middleware
│   │   ├── auth.js
│   │   └── errorHandler.js
│   ├── services/                # Business logic
│   │   ├── geminiService.js
│   │   └── userService.js
│   ├── prompts/                 # AI prompts
│   │   └── interviewPrompts.js
│   ├── config/                  # Configuration
│   │   └── firebase.js
│   ├── utils/                   # Utilities
│   │   └── validators.js
│   ├── server.js                # Express server entry point
│   └── package.json
├── public/                      # Static files
├── package.json
├── tailwind.config.js
├── postcss.config.js
├── docker-compose.yml
├── Dockerfile                   # Frontend Docker
├── .env.example                 # Environment variables example
├── README.md
├── DEPLOYMENT.md
└── ARCHITECTURE.md
```

## Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     CLIENT SIDE (React)                      │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐         ┌───────────────────┐             │
│  │  Components  │────────▶│  State Management │             │
│  └──────────────┘         │   (Context/Hooks) │             │
│         │                 └───────────────────┘             │
│         │                           │                       │
│         └───────────────┬───────────┘                       │
│                         │                                   │
│                  ┌──────▼──────┐                           │
│                  │ API Service │                           │
│                  │ (Axios)     │                           │
│                  └──────┬──────┘                           │
│                         │                                   │
├─────────────────────────┼───────────────────────────────────┤
│                  HTTP  │  JSON                              │
│                         │                                   │
├─────────────────────────┼───────────────────────────────────┤
│                  SERVER SIDE (Express)                      │
│                         │                                   │
│                  ┌──────▼──────────┐                       │
│                  │  API Routes     │                       │
│                  │  + Middleware   │                       │
│                  └──────┬──────────┘                       │
│                         │                                   │
│                  ┌──────▼──────────┐                       │
│                  │ Controllers     │                       │
│                  │ Business Logic  │                       │
│                  └──────┬──────────┘                       │
│                         │                                   │
│          ┌──────────────┼──────────────┐                  │
│          │              │              │                  │
│   ┌──────▼────┐   ┌─────▼─────┐  ┌───▼──────┐           │
│   │ Firestore │   │  Gemini   │  │ Firebase │           │
│   │ Database  │   │ API (AI)  │  │ Storage  │           │
│   └───────────┘   └───────────┘  └──────────┘           │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

## Authentication Flow

```
1. User Registration:
   User → React Component → Firebase Auth → Firestore User Document

2. User Login:
   User → React Component → Firebase Auth → Auth Token → Protected Routes

3. Protected API Calls:
   React Component → Axios → Add Auth Token → Express Middleware → Verify Token → Controller

4. Session Persistence:
   Firebase Auth Listener → Update Auth Context → Persist State
```

## Interview Processing Flow

```
1. Start Interview:
   Create Interview Document in Firestore
   Initialize Messages Array

2. User Sends Answer:
   POST /api/interview/:id/message
   ├─ Sanitize Input
   ├─ Add to Messages Array
   ├─ Call Gemini API
   ├─ Parse AI Response
   ├─ Calculate Score
   └─ Update Interview Document

3. End Interview:
   POST /api/interview/:id/end
   ├─ Calculate Final Score
   ├─ Generate Feedback
   ├─ Store in Database
   └─ Return Results
```

## Database Schema

### Users Collection
```javascript
{
  uid: "user_id",
  name: "John Doe",
  email: "john@example.com",
  targetRole: "Software Engineer",
  skills: ["JavaScript", "React", "Node.js"],
  bio: "Bio text",
  streak: 5,
  xp: 250,
  strongTopics: ["DSA", "React"],
  weakTopics: ["System Design"],
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### Interviews Collection
```javascript
{
  userId: "user_id",
  type: "Technical Interview",
  skills: ["JavaScript", "DSA"],
  messages: [
    {
      role: "user|assistant",
      content: "message text",
      feedback: "optional feedback",
      timestamp: Timestamp
    }
  ],
  score: 85,
  feedback: "detailed feedback",
  duration: 1200,
  startedAt: Timestamp,
  endedAt: Timestamp,
  status: "completed"
}
```

### Coding Submissions Collection
```javascript
{
  userId: "user_id",
  problemId: "problem_id",
  code: "code text",
  language: "javascript",
  passed: true,
  result: "All tests passed",
  submittedAt: Timestamp
}
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update profile
- `GET /api/auth/stats` - Get user statistics

### Interview
- `POST /api/interview/start` - Start new interview
- `POST /api/interview/:id/message` - Send message
- `POST /api/interview/:id/end` - End interview
- `GET /api/interview/history` - Get history

### Coding
- `GET /api/coding/problems` - Get problems
- `POST /api/coding/submit` - Submit solution
- `GET /api/coding/submissions` - Get submissions

### Analytics
- `GET /api/analytics` - Get analytics
- `GET /api/analytics/topics` - Get topic analysis

### Leaderboard
- `GET /api/leaderboard` - Get leaderboard
- `GET /api/leaderboard/rank` - Get user rank

## Security Architecture

### Authentication
- Firebase Authentication (JWT)
- Session persistence with localStorage
- Protected routes with React Router

### Authorization
- Server-side token verification
- User ID validation
- Database-level access control

### Data Protection
- Environment variable management
- No API keys in frontend
- HTTPS/TLS for all communications
- Input validation and sanitization

## Performance Optimization

### Frontend
- Code splitting with React.lazy()
- Image optimization
- Memoization with React.memo()
- Virtual scrolling for large lists

### Backend
- Database indexing on Firestore
- API response caching
- Rate limiting
- Connection pooling

### Caching Strategy
- Client-side: localStorage for user data
- Server-side: In-memory cache for frequently accessed data
- CDN: Static assets via Firebase Hosting

## Monitoring & Analytics

### User Metrics
- Interview participation
- Average scores
- Problem-solving rate
- Platform engagement

### System Metrics
- API response times
- Error rates
- Database queries
- Server resource usage

## Deployment Architecture

```
┌──────────────────────────────┐
│    Firebase Hosting          │
│  (Frontend - React Build)    │
└──────────────────────────────┘
         │
         │ HTTPS
         │
┌──────────────────────────────┐
│   Cloud Load Balancer        │
└──────────────────────────────┘
         │
         │
┌──────────────────────────────┐
│   Express Server             │
│   (Node.js Application)      │
└──────────────────────────────┘
         │
    ┌────┼────┬────────┐
    │    │    │        │
┌───▼──┐ │ ┌──▼─┐ ┌───▼────┐
│Fire- │ │ │Gem-│ │Firebase│
│store │ │ │ini │ │Storage │
└──────┘ │ └────┘ └────────┘
         │
    ┌────▼────┐
    │ Firebase│
    │ Auth    │
    └─────────┘
```

## Scalability Considerations

### Horizontal Scaling
- Stateless API servers
- Load balanced with multiple instances
- Auto-scaling based on demand

### Database Scaling
- Firestore handles auto-scaling
- Distributed reads/writes
- Real-time synchronization

### Caching Layer
- Add Redis for frequently accessed data
- Cache interview questions
- Cache user profiles

## Future Enhancements

1. **Microservices**: Split into separate services
2. **Message Queue**: Use RabbitMQ for async operations
3. **WebSocket**: Real-time notifications
4. **Elasticsearch**: Advanced search capabilities
5. **CDN**: Global content distribution
6. **Machine Learning**: Prediction models for difficulty
7. **Mobile App**: React Native implementation
