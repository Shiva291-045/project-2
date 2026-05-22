# Deployment Guide - PrepAI

This guide covers deploying PrepAI to various platforms.

## Prerequisites

- Firebase project account
- Google Gemini API key
- Node.js and npm installed
- Docker (optional)
- Git repository

## Environment Variables

Create `.env` in the root directory:

```env
# Firebase
REACT_APP_FIREBASE_API_KEY=your_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_auth_domain.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_storage_bucket.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id

# API
REACT_APP_API_URL=http://localhost:5000 (or your production URL)

# Server
PORT=5000
NODE_ENV=development
GEMINI_API_KEY=your_gemini_api_key
```

Create `server/.env`:

```env
PORT=5000
NODE_ENV=production
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
GEMINI_API_KEY=your_gemini_api_key
FIREBASE_SERVICE_ACCOUNT={"type": "service_account", ...}
FRONTEND_URL=your_frontend_url
```

## Docker Deployment

### Build Images

```bash
# Frontend
docker build -t prepai-frontend .

# Backend
docker build -t prepai-backend ./server
```

### Run with Docker Compose

```bash
docker-compose up -d
```

## Firebase Hosting (Frontend)

### Setup

```bash
npm install -g firebase-tools
firebase login
firebase init hosting
```

### Deploy

```bash
npm run build
firebase deploy --only hosting
```

## Heroku Deployment (Backend)

### Setup

```bash
npm install -g heroku
heroku login
heroku create your-app-name
```

### Configure Environment Variables

```bash
heroku config:set PORT=5000
heroku config:set NODE_ENV=production
heroku config:set GEMINI_API_KEY=your_key
heroku config:set FIREBASE_SERVICE_ACCOUNT='{"type":"service_account",...}'
```

### Deploy

```bash
git push heroku main
```

## Vercel Deployment (Frontend)

### Setup

1. Push your repo to GitHub
2. Import project on Vercel
3. Set environment variables
4. Deploy

### Environment Variables in Vercel

- REACT_APP_FIREBASE_API_KEY
- REACT_APP_FIREBASE_AUTH_DOMAIN
- REACT_APP_FIREBASE_PROJECT_ID
- REACT_APP_FIREBASE_STORAGE_BUCKET
- REACT_APP_FIREBASE_MESSAGING_SENDER_ID
- REACT_APP_FIREBASE_APP_ID
- REACT_APP_API_URL

## AWS Deployment

### EC2 for Backend

1. Create EC2 instance
2. SSH into instance
3. Clone repository
4. Install Node.js
5. Configure environment variables
6. Run: `npm install && npm start`
7. Use PM2 for process management:

```bash
npm install -g pm2
pm2 start server/server.js
pm2 save
```

### S3 + CloudFront for Frontend

```bash
npm run build
# Upload build/ folder to S3
# Configure CloudFront distribution
```

## Google Cloud Platform

### Cloud Run (Backend)

```bash
gcloud init
gcloud run deploy prepai-backend --source . --region us-central1
```

### Firebase Hosting (Frontend)

```bash
npm run build
firebase deploy
```

## Database Migration (Firestore)

### Backup

```bash
gcloud firestore export gs://your-bucket/backup
```

### Restore

```bash
gcloud firestore import gs://your-bucket/backup
```

## Monitoring & Logging

### Firebase Console
- Go to Firebase Console
- Monitor Firestore database
- Check Cloud Functions logs
- Review Authentication events

### Server Logs
```bash
heroku logs -t  # Real-time logs
docker logs -f container-id
```

## Performance Optimization

### Frontend
- Enable gzip compression
- Use CDN for static assets
- Lazy load components
- Optimize images

### Backend
- Enable Redis caching
- Use connection pooling
- Implement rate limiting
- Monitor API response times

## Security Checklist

- [ ] All secrets in environment variables
- [ ] Firebase security rules configured
- [ ] CORS properly configured
- [ ] SSL/TLS enabled
- [ ] API rate limiting enabled
- [ ] Input validation on backend
- [ ] Database backups automated
- [ ] Monitoring and alerts configured

## Troubleshooting

### Firebase Connection Issues
```bash
# Check credentials
gcloud auth list
gcloud config list

# Re-authenticate
gcloud auth application-default login
```

### Build Errors
```bash
# Clear cache
npm cache clean --force

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### Port Already in Use
```bash
# Linux/Mac
lsof -i :5000
kill -9 <PID>

# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

## Cost Estimation

### Firebase
- Firestore: ~$0.06 per 100K reads
- Authentication: Free (up to 50K)
- Hosting: Free tier + $0.15/GB

### Heroku
- Dyno: $7-50/month
- Database: $15-3000/month

### Vercel
- Hobby: Free
- Pro: $20/month

## Support

For detailed Firebase documentation: https://firebase.google.com/docs
For Heroku documentation: https://devcenter.heroku.com
For Vercel documentation: https://vercel.com/docs
