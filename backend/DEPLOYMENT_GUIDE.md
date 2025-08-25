# 🚀 Deployment Guide - Lucid Growth Email Analyzer

This guide will help you deploy your application to GitHub, Render (backend), and Vercel (frontend).

## 📋 Prerequisites

- GitHub account
- Render account (for backend)
- Vercel account (for frontend)
- MongoDB Atlas account
- Google Cloud Platform account

## 🔐 Security First

**⚠️ IMPORTANT**: Before pushing to GitHub, ensure sensitive data is removed:

1. **Remove `.env` files** from the repository
2. **Update `env.example`** with placeholder values (✅ Done)
3. **Check for hardcoded credentials** in any files

## 🚀 Step 1: GitHub Repository Setup

### 1.1 Initialize Git Repository
```bash
git init
git add .
git commit -m "Initial commit: Lucid Growth Email Analyzer"
```

### 1.2 Create GitHub Repository
1. Go to [GitHub](https://github.com) and create a new repository
2. Name it: `lucid-growth-email-analyzer`
3. Make it public or private (your choice)
4. **Don't** initialize with README, .gitignore, or license

### 1.3 Push to GitHub
```bash
git remote add origin https://github.com/YOUR_USERNAME/lucid-growth-email-analyzer.git
git branch -M main
git push -u origin main
```

## 🎯 Step 2: Backend Deployment (Render)

### 2.1 Connect to Render
1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New" → "Web Service"
3. Connect your GitHub repository
4. Select the repository: `lucid-growth-email-analyzer`

### 2.2 Configure Backend Service
- **Name**: `lucid-growth-backend`
- **Root Directory**: `backend`
- **Environment**: `Node`
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm run start:prod`
- **Plan**: Free (or paid if needed)

### 2.3 Environment Variables
Add these environment variables in Render dashboard:

```env
NODE_ENV=production
PORT=3001
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REFRESH_TOKEN=your_google_refresh_token
GOOGLE_PUBSUB_TOPIC=projects/your-project-id/topics/gmail-notifications
GOOGLE_CLOUD_PROJECT=your-project-id
FRONTEND_URL=https://your-frontend-domain.vercel.app
```

### 2.4 Deploy Backend
1. Click "Create Web Service"
2. Wait for deployment to complete
3. Note the service URL (e.g., `https://lucid-growth-backend.onrender.com`)

## 🌐 Step 3: Frontend Deployment (Vercel)

### 3.1 Connect to Vercel
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your GitHub repository
4. Select the repository: `lucid-growth-email-analyzer`

### 3.2 Configure Frontend Project
- **Framework Preset**: Next.js
- **Root Directory**: `frontend`
- **Build Command**: `npm run build`
- **Output Directory**: `.next`
- **Install Command**: `npm install`

### 3.3 Environment Variables
Add this environment variable in Vercel dashboard:

```env
NEXT_PUBLIC_API_URL=https://your-backend-url.onrender.com
```

**Replace `your-backend-url.onrender.com` with your actual Render backend URL**

### 3.4 Deploy Frontend
1. Click "Deploy"
2. Wait for deployment to complete
3. Note the frontend URL (e.g., `https://lucid-growth-frontend.vercel.app`)

## 🔄 Step 4: Update Backend with Frontend URL

### 4.1 Update Render Environment Variables
1. Go back to your Render backend service
2. Update the `FRONTEND_URL` environment variable:
```env
FRONTEND_URL=https://your-frontend-domain.vercel.app
```
3. Redeploy the backend service

## 🔧 Step 5: Google Cloud Configuration

### 5.1 Update Pub/Sub Push Subscription
```bash
gcloud pubsub subscriptions update gmail-notify-push \
  --push-endpoint=https://your-backend-url.onrender.com/api/gmail/push
```

### 5.2 Update OAuth2 Redirect URI
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Navigate to APIs & Services > Credentials
3. Edit your OAuth 2.0 Client ID
4. Add the production redirect URI:
   ```
   https://your-backend-url.onrender.com/api/gmail/auth/callback
   ```

## 🧪 Step 6: Testing

### 6.1 Test Backend Health
```bash
curl https://your-backend-url.onrender.com/api/health
```

### 6.2 Test Frontend
1. Visit your Vercel frontend URL
2. Check if the dashboard loads
3. Test WebSocket connection
4. Send a test email to `krisppy0@gmail.com` with subject `Lucid Growth Test Subject`

## 🔍 Troubleshooting

### Common Issues

1. **CORS Errors**
   - Ensure `FRONTEND_URL` is correctly set in backend
   - Check that the frontend URL matches exactly

2. **WebSocket Connection Failed**
   - Verify the backend URL in frontend environment variables
   - Check if Render supports WebSocket (it does)

3. **Environment Variables Not Loading**
   - Restart the Render service after adding environment variables
   - Check for typos in variable names

4. **Build Failures**
   - Check the build logs in Render/Vercel
   - Ensure all dependencies are in `package.json`

## 📊 Monitoring

### Render Monitoring
- View logs in Render dashboard
- Monitor service health
- Check resource usage

### Vercel Monitoring
- View deployment logs
- Monitor performance
- Check analytics

## 🔄 Continuous Deployment

Both Render and Vercel will automatically redeploy when you push changes to the `main` branch.

## 🚨 Security Checklist

- [ ] No sensitive data in repository
- [ ] Environment variables properly set
- [ ] CORS configured correctly
- [ ] OAuth2 redirect URIs updated
- [ ] Pub/Sub endpoints updated
- [ ] Health checks working

## 📞 Support

If you encounter issues:
1. Check the troubleshooting section
2. Review deployment logs
3. Verify environment variables
4. Test locally first

---

**🎉 Congratulations!** Your application is now deployed and ready for production use.
