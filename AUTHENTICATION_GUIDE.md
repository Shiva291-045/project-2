# Authentication System Guide

## Overview

This document describes the production-ready authentication system for PrepAI, including setup instructions, API documentation, and best practices.

## Architecture

```
┌─────────────────────────────────────────────┐
│         React Application (Frontend)         │
├─────────────────────────────────────────────┤
│  App.jsx                                    │
│  ├─ AuthProvider (Context)                  │
│  │  └─ useAuth Hook                         │
│  ├─ ProtectedRoute Component                │
│  ├─ Login/Register Pages                    │
│  └─ Protected Pages (Dashboard, etc)        │
├─────────────────────────────────────────────┤
│  Services Layer                             │
│  ├─ authService.js (Business Logic)         │
│  ├─ Validation Utilities                    │
│  └─ API Client                              │
├─────────────────────────────────────────────┤
│         Firebase (Backend)                   │
│  ├─ Authentication (Firebase Auth)          │
│  ├─ Firestore Database                      │
│  └─ Persistent Storage                      │
└─────────────────────────────────────────────┘
```

## Setup Instructions

### 1. Environment Configuration

Copy `.env.local.example` to `.env.local`:

```bash
cp .env.local.example .env.local
```

Fill in your Firebase credentials:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_domain.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 2. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project or use existing project
3. Enable Authentication:
   - Go to Authentication > Sign-in method
   - Enable "Email/Password"
4. Set up Firestore:
   - Go to Firestore Database
   - Create database (Start in production mode)
   - Create collections: `users`, `interviews`, `codeSubmissions`, `analytics`

### 3. Firestore Database Schema

#### Users Collection

```javascript
{
  uid: "user_id",
  email: "user@example.com",
  displayName: "John Doe",
  photoURL: null,
  createdAt: timestamp,
  updatedAt: timestamp,
  
  // Interview Stats
  totalInterviews: 0,
  averageInterviewScore: 0,
  lastInterviewDate: null,
  
  // Coding Stats
  totalCodingProblems: 0,
  codingProblemsSolved: 0,
  codingAcceptanceRate: 0,
  streakDays: 0,
  
  // Preferences
  targetRole: "Software Engineer",
  skills: ["JavaScript", "React", "Node.js"],
  experience: "beginner" // beginner, intermediate, advanced
}
```

#### Interviews Collection

```javascript
{
  sessionId: "unique_session_id",
  userId: "user_id",
  startTime: timestamp,
  endTime: timestamp,
  title: "System Design Interview",
  difficulty: "medium",
  
  // Conversation
  transcript: [
    {
      role: "user",
      content: "...",
      timestamp: timestamp
    },
    {
      role: "interviewer",
      content: "...",
      timestamp: timestamp
    }
  ],
  
  // Feedback
  score: 7.5,
  feedback: "...",
  strengths: [],
  improvements: [],
  
  // Tags
  categories: ["System Design"],
  companies: ["Google", "Amazon"]
}
```

## API Reference

### Auth Service (`src/services/authService.js`)

#### `register(email, password, displayName)`

Register a new user account.

**Parameters:**
- `email` (string): User email address
- `password` (string): User password (must meet strength requirements)
- `displayName` (string): User's display name

**Returns:**
```javascript
{
  user: FirebaseUser,
  success: true,
  message?: "Account created"
}
// Or on error:
{
  success: false,
  error: "auth/email-already-in-use",
  message: "This email is already registered..."
}
```

**Password Requirements:**
- Minimum 8 characters
- At least one uppercase letter (A-Z)
- At least one lowercase letter (a-z)
- At least one number (0-9)
- At least one special character (!@#$%^&*)

#### `login(email, password)`

Sign in user with email and password.

**Parameters:**
- `email` (string): User email
- `password` (string): User password

**Returns:**
```javascript
{
  user: FirebaseUser,
  success: true
}
```

#### `logout()`

Sign out current user.

**Returns:**
```javascript
{
  success: true
}
```

#### `resetPassword(email)`

Send password reset email.

**Parameters:**
- `email` (string): User email

**Returns:**
```javascript
{
  success: true,
  message: "Password reset email sent"
}
```

#### `getCurrentUser()`

Get current authenticated user.

**Returns:**
```javascript
FirebaseUser | null
```

#### `getUserProfile(uid)`

Get user profile from Firestore.

**Parameters:**
- `uid` (string): User ID

**Returns:**
```javascript
{
  uid, email, displayName, ...
} | null
```

#### `updateUserProfile(uid, updates)`

Update user profile data.

**Parameters:**
- `uid` (string): User ID
- `updates` (object): Profile fields to update

**Returns:**
```javascript
{
  success: true
}
```

### useAuth Hook (`src/hooks/useAuth.js`)

Access authentication context in React components.

**Usage:**
```javascript
import { useAuth } from "../hooks/useAuth";

function MyComponent() {
  const {
    user,                 // Current Firebase user or null
    userProfile,         // User profile data from Firestore
    loading,             // Auth state loading
    error,               // Error message if any
    isAuthenticated,     // Boolean: is user logged in
    
    register,            // Function: register new user
    login,               // Function: sign in user
    logout,              // Function: sign out user
    resetPassword,       // Function: reset password
    updateProfile,       // Function: update profile
    clearError           // Function: clear error message
  } = useAuth();

  return (
    // Your component JSX
  );
}
```

### Validation Utilities (`src/utils/validation.js`)

#### `validateEmail(email)`

Validate email format.

```javascript
const result = validateEmail("user@example.com");
// { isValid: true, error: null }
```

#### `validatePassword(password)`

Validate password strength.

```javascript
const result = validatePassword("MyPass123!");
// {
//   isValid: true,
//   errors: [],
//   strength: 5,  // 0-5
//   strengthLabel: "Very Strong",
//   checks: {
//     length: true,
//     uppercase: true,
//     lowercase: true,
//     number: true,
//     special: true
//   }
// }
```

#### `validateName(name)`

Validate user name.

```javascript
const result = validateName("John Doe");
// { isValid: true, errors: [] }
```

#### `validateField(fieldName, value, rules)`

Real-time field validation.

```javascript
const validation = validateField(
  "email",
  "user@example.com",
  FORM_RULES
);
// { isValid: true, error: null, ... }
```

## Component Usage Examples

### Login Component

```javascript
import { useAuth } from "../../hooks/useAuth";
import { validateEmail, validatePassword } from "../../utils/validation";

export const LoginExample = () => {
  const { login, isAuthenticated } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      // Show error
      return;
    }

    const result = await login(email, password);
    if (result.success) {
      // Navigate to dashboard
    }
  };

  if (isAuthenticated) {
    return <Navigate to="/dashboard" />;
  }

  return (
    <form onSubmit={handleLogin}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button type="submit">Sign In</button>
    </form>
  );
};
```

### Protected Page Component

```javascript
import { useAuth } from "../../hooks/useAuth";
import ProtectedRoute from "../../components/ProtectedRoute";

export const DashboardPage = () => {
  const { user, userProfile, loading } = useAuth();

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <h1>Welcome, {user?.displayName}</h1>
      <p>Role: {userProfile?.targetRole}</p>
    </div>
  );
};

// In App.jsx
<Route
  path="/dashboard"
  element={
    <ProtectedRoute>
      <DashboardPage />
    </ProtectedRoute>
  }
/>
```

## Error Handling

### Common Error Codes

| Code | Message | Solution |
|------|---------|----------|
| `auth/email-already-in-use` | Email already registered | Use different email or login |
| `auth/invalid-email` | Invalid email format | Check email format |
| `auth/weak-password` | Password doesn't meet requirements | Use stronger password |
| `auth/user-not-found` | No account with this email | Register first |
| `auth/wrong-password` | Incorrect password | Check password and try again |
| `auth/too-many-requests` | Too many login attempts | Wait before trying again |
| `auth/network-request-failed` | Network error | Check internet connection |

### Error Handling Pattern

```javascript
const handleLogin = async () => {
  try {
    const result = await login(email, password);
    
    if (!result.success) {
      // Handle error
      toast.error(result.message);
      // Provide helpful guidance based on error code
      if (result.error === "auth/user-not-found") {
        // Suggest creating account
      }
      return;
    }

    // Success
    navigate("/dashboard");
  } catch (err) {
    console.error("Unexpected error:", err);
    toast.error("An unexpected error occurred");
  }
};
```

## Security Best Practices

### 1. Password Security
- Never store plain text passwords
- Enforce strong password requirements
- Implement password reset securely
- Use HTTPS in production
- Implement rate limiting on auth endpoints

### 2. Session Management
- Use secure session tokens (JWT)
- Implement token refresh mechanism
- Clear tokens on logout
- Implement automatic logout on inactivity

### 3. Data Protection
- Encrypt sensitive data at rest
- Use HTTPS for all communications
- Implement proper CORS policies
- Validate all inputs on frontend AND backend

### 4. Access Control
- Use ProtectedRoute for all protected pages
- Verify user permissions before allowing actions
- Implement role-based access control (RBAC)
- Log authentication attempts

## Testing

### Mock Authentication

For development/testing without Firebase:

```javascript
// In src/services/authService.js
const USE_MOCK = import.meta.env.VITE_USE_MOCK_AUTH === "true";

if (USE_MOCK) {
  // Use mock implementation
}
```

### Test Cases

```javascript
describe("Authentication", () => {
  test("should register new user", async () => {
    const result = await register(
      "test@example.com",
      "Password123!",
      "Test User"
    );
    expect(result.success).toBe(true);
    expect(result.user.email).toBe("test@example.com");
  });

  test("should reject weak password", async () => {
    const result = await register(
      "test@example.com",
      "weak",
      "Test User"
    );
    expect(result.success).toBe(false);
    expect(result.error).toBe("auth/weak-password");
  });

  test("should login existing user", async () => {
    const result = await login("test@example.com", "Password123!");
    expect(result.success).toBe(true);
  });
});
```

## Troubleshooting

### Issue: "useAuth must be used within an AuthProvider"

**Cause:** Component using useAuth is not wrapped with AuthProvider.

**Solution:** Ensure AuthProvider wraps the entire app in App.jsx:
```javascript
<AuthProvider>
  <Router>
    {/* routes */}
  </Router>
</AuthProvider>
```

### Issue: Firebase credentials not loading

**Cause:** Environment variables not set correctly.

**Solution:**
1. Check `.env.local` file exists
2. Verify variable names match `VITE_` prefix
3. Restart dev server: `npm run dev`

### Issue: Protected routes not working

**Cause:** ProtectedRoute component needs loading state.

**Solution:** ProtectedRoute already handles loading state. Check for:
- AuthProvider wrapping Router
- Correct import path: `src/components/ProtectedRoute`

### Issue: Password validation too strict

**Cause:** Password requirements enforced on frontend and backend.

**Solution:** Update validation rules in:
- `src/utils/validation.js` (frontend)
- `src/services/authService.js` (backend validation)

## Production Deployment

### Pre-deployment Checklist

- [ ] Environment variables configured
- [ ] Firebase credentials set up
- [ ] HTTPS enabled
- [ ] CORS policies configured
- [ ] Rate limiting implemented
- [ ] Error logging set up
- [ ] User authentication tested
- [ ] Protected routes verified
- [ ] Database backups configured
- [ ] Security rules implemented

### Firebase Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own profile
    match /users/{uid} {
      allow read, write: if request.auth.uid == uid;
    }

    // Users can read all interviews but only write their own
    match /interviews/{document=**} {
      allow read: if request.auth != null;
      allow create: if request.auth != null && 
                       request.resource.data.userId == request.auth.uid;
      allow update, delete: if request.auth.uid == resource.data.userId;
    }

    // Similar rules for other collections
  }
}
```

## Additional Resources

- [Firebase Authentication Documentation](https://firebase.google.com/docs/auth)
- [Firestore Documentation](https://firebase.google.com/docs/firestore)
- [React Context API](https://react.dev/reference/react/useContext)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
