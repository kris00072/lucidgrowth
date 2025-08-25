# Google Cloud Run Deployment Guide

## Prerequisites

1. **Google Cloud CLI** installed and configured
2. **Google Cloud Project** with billing enabled
3. **MongoDB Atlas** database
4. **Google OAuth2** credentials
5. **Google Cloud Pub/Sub** topic and subscription

## Step 1: Prepare Environment Variables

1. Copy the environment template:
   ```bash
   cp env.production.template .env
   ```

2. Update `.env` with your actual values:
   ```env
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database
   GOOGLE_CLOUD_PROJECT_ID=your-project-id
   GOOGLE_PUBSUB_TOPIC=projects/your-project-id/topics/gmail-notifications
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   GOOGLE_REDIRECT_URI=https://your-backend-url.run.app/api/gmail/auth/callback
   FRONTEND_URL=https://your-frontend-domain.vercel.app
   NODE_ENV=production
   PORT=3001
   ```

## Step 2: Deploy to Google Cloud Run

### Option A: Using the deployment script
1. Update `deploy.sh` with your project ID
2. Make it executable: `chmod +x deploy.sh`
3. Run: `./deploy.sh`

### Option B: Manual deployment
```bash
# Build the application
npm run build

# Deploy to Google Cloud Run
gcloud run deploy lucid-growth-backend \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --port 3001 \
  --set-env-vars NODE_ENV=production
```

## Step 3: Configure Environment Variables

After deployment, set your environment variables:

```bash
gcloud run services update lucid-growth-backend \
  --update-env-vars \
  MONGODB_URI=your_mongodb_uri,\
  GOOGLE_CLOUD_PROJECT_ID=your_project_id,\
  GOOGLE_PUBSUB_TOPIC=projects/your_project_id/topics/gmail-notifications,\
  GOOGLE_CLIENT_ID=your_client_id,\
  GOOGLE_CLIENT_SECRET=your_client_secret,\
  GOOGLE_REDIRECT_URI=https://your-backend-url.run.app/api/gmail/auth/callback
```

## Step 4: Update Pub/Sub Push Subscription

Update your Pub/Sub push subscription to point to the production backend:

```bash
gcloud pubsub subscriptions update gmail-notify-push \
  --push-endpoint=https://your-backend-url.run.app/api/gmail/push
```

## Step 5: Test the Deployment

1. **Test API endpoints:**
   ```bash
   curl https://your-backend-url.run.app/api/emails/stats/overview
   curl https://your-backend-url.run.app/api/gmail/status
   ```

2. **Test Gmail integration:**
   - Send a test email to `krisppy0@gmail.com` with subject `Lucid Growth Test Subject`
   - Check if it's processed and stored in MongoDB

## Step 6: Deploy Frontend

1. Deploy frontend to Vercel
2. Get your frontend URL
3. Update backend with frontend URL:
   ```bash
   gcloud run services update lucid-growth-backend \
     --update-env-vars FRONTEND_URL=https://your-frontend-domain.vercel.app
   ```

## Environment Variables Reference

| Variable | Description | Required |
|----------|-------------|----------|
| `MONGODB_URI` | MongoDB Atlas connection string | Yes |
| `GOOGLE_CLOUD_PROJECT_ID` | Your Google Cloud project ID | Yes |
| `GOOGLE_PUBSUB_TOPIC` | Pub/Sub topic for Gmail notifications | Yes |
| `GOOGLE_CLIENT_ID` | Google OAuth2 client ID | Yes |
| `GOOGLE_CLIENT_SECRET` | Google OAuth2 client secret | Yes |
| `GOOGLE_REDIRECT_URI` | OAuth2 redirect URI | Yes |
| `FRONTEND_URL` | Your frontend domain | No (initially) |
| `NODE_ENV` | Environment (production) | Yes |
| `PORT` | Port to run on (3001) | No |

## Troubleshooting

### Common Issues

1. **CORS errors**: Make sure `FRONTEND_URL` is set correctly
2. **MongoDB connection**: Verify `MONGODB_URI` is correct
3. **Gmail API errors**: Check OAuth2 credentials
4. **Pub/Sub errors**: Verify topic and subscription exist

### View Logs

```bash
gcloud logs read --service=lucid-growth-backend --limit=50
```

### Update Service

```bash
gcloud run services update lucid-growth-backend --source .
```

## Security Notes

1. **Environment variables** are encrypted at rest
2. **CORS** is configured to allow only specified domains
3. **HTTPS** is enforced in production
4. **Service account** permissions should be minimal

## Cost Optimization

1. **Auto-scaling**: Service scales to zero when not in use
2. **Memory**: Start with 512MB, adjust based on usage
3. **CPU**: Start with 1 CPU, adjust based on load
4. **Concurrency**: Default is 80, adjust based on needs



