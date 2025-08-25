# Deployment Checklist

## ✅ Pre-Deployment Checklist

### Environment Setup
- [ ] Google Cloud CLI installed and configured
- [ ] Google Cloud project with billing enabled
- [ ] MongoDB Atlas database created
- [ ] Google OAuth2 credentials configured
- [ ] Google Cloud Pub/Sub topic and subscription created

### Code Preparation
- [ ] All TypeScript compilation errors resolved
- [ ] Environment variables template created (`env.production.template`)
- [ ] Dockerfile created and tested
- [ ] .dockerignore file configured
- [ ] .gitignore updated to exclude sensitive files
- [ ] Health check endpoint added (`/health`)

### Local Testing
- [ ] Backend runs locally without errors
- [ ] Gmail integration works locally
- [ ] Pub/Sub push notifications work locally
- [ ] WebSocket connections work locally
- [ ] Enhanced header analysis works correctly

## 🚀 Deployment Steps

### Step 1: Initial Deployment
- [ ] Update `deploy.sh` with your project ID
- [ ] Run deployment script: `./deploy.sh`
- [ ] Note the production URL (e.g., `https://lucid-growth-backend-abc123.run.app`)

### Step 2: Configure Environment Variables
- [ ] Set MongoDB URI in Google Cloud Run
- [ ] Set Google Cloud project ID
- [ ] Set Pub/Sub topic
- [ ] Set OAuth2 credentials
- [ ] Set redirect URI with production URL

### Step 3: Update Pub/Sub Subscription
- [ ] Update push endpoint to production URL
- [ ] Test push notifications reach production backend

### Step 4: Test Production Backend
- [ ] Test health endpoint: `GET /health`
- [ ] Test API info endpoint: `GET /`
- [ ] Test email stats: `GET /api/emails/stats/overview`
- [ ] Test Gmail status: `GET /api/gmail/status`
- [ ] Send test email and verify processing

## 🌐 Frontend Deployment

### Step 5: Deploy Frontend
- [ ] Deploy frontend to Vercel
- [ ] Get frontend production URL
- [ ] Update backend with frontend URL
- [ ] Test frontend-backend communication

### Step 6: Final Testing
- [ ] Test complete email processing flow
- [ ] Verify real-time updates work
- [ ] Test enhanced header analysis display
- [ ] Verify CORS configuration

## 🔧 Post-Deployment

### Monitoring
- [ ] Set up Google Cloud Logging
- [ ] Monitor application logs
- [ ] Set up error alerts
- [ ] Monitor performance metrics

### Security
- [ ] Review environment variables
- [ ] Verify CORS configuration
- [ ] Check service account permissions
- [ ] Enable HTTPS enforcement

### Optimization
- [ ] Monitor resource usage
- [ ] Adjust memory/CPU allocation
- [ ] Optimize auto-scaling settings
- [ ] Review cost optimization

## 🚨 Troubleshooting

### Common Issues
- [ ] CORS errors - Check FRONTEND_URL
- [ ] MongoDB connection - Verify MONGODB_URI
- [ ] Gmail API errors - Check OAuth2 credentials
- [ ] Pub/Sub errors - Verify topic/subscription
- [ ] WebSocket errors - Check CORS configuration

### Useful Commands
```bash
# View logs
gcloud logs read --service=lucid-growth-backend --limit=50

# Update environment variables
gcloud run services update lucid-growth-backend --update-env-vars KEY=value

# Redeploy
gcloud run services update lucid-growth-backend --source .

# Test endpoints
curl https://your-backend-url.run.app/health
curl https://your-backend-url.run.app/api/emails/stats/overview
```

## 📞 Support

If you encounter issues:
1. Check Google Cloud Run logs
2. Verify environment variables
3. Test endpoints individually
4. Review CORS configuration
5. Check Pub/Sub subscription status



