# Lucid Growth Email Analyzer

A full-stack web application that analyzes Gmail receiving chains and ESP types in real-time. The application generates a test Gmail address and specific subject line, processes incoming emails automatically, and displays detailed analysis on a modern dashboard.

## 🚀 Features

- **Real-time Email Processing**: Automatically processes emails sent to the test Gmail account
- **Receiving Chain Analysis**: Extracts and visualizes the complete email routing path
- **ESP Detection**: Identifies Email Service Providers (Gmail, Outlook, Amazon SES, etc.)
- **Live Dashboard**: Real-time updates via WebSocket connections
- **Email Filtering**: Search and filter emails by various criteria
- **Responsive Design**: Modern, mobile-friendly UI built with Next.js and Tailwind CSS

## 🏗️ Architecture

- **Frontend**: Next.js 14 with TypeScript and Tailwind CSS
- **Backend**: NestJS with Node.js
- **Database**: MongoDB Atlas
- **Real-time**: WebSocket communication via Socket.IO
- **Gmail Integration**: Gmail API with OAuth2 and Pub/Sub push notifications
- **Advanced Token Management**: Automatic token refresh, proactive renewal, and graceful error recovery

## 📋 Prerequisites

- Node.js 18+ and npm
- MongoDB Atlas account
- Google Cloud Platform account
- Gmail account for testing

## 🛠️ Setup Instructions

### 1. Clone and Install Dependencies

```bash
git clone <repository-url>
cd lucidgrowth
npm run install:all
```

### 2. Backend Configuration

1. Navigate to the backend directory:
```bash
cd backend
```

2. Copy the environment template:
```bash
cp env.example .env
```

3. Configure your `.env` file with the following variables:

```env
# Server Configuration
PORT=3001
FRONTEND_URL=http://localhost:3000

# MongoDB Configuration
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/lucid-growth

# Google OAuth2 Configuration
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REFRESH_TOKEN=your_google_refresh_token

# Google Cloud Pub/Sub Configuration
GOOGLE_PUBSUB_TOPIC=projects/your-project/topics/gmail-notifications

# Google Cloud Project Configuration
GOOGLE_CLOUD_PROJECT=your-project-id
```

### 3. Google Cloud Setup

#### A. Enable Required APIs
```bash
gcloud services enable gmail.googleapis.com
gcloud services enable pubsub.googleapis.com
```

#### B. Create OAuth2 Credentials
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to APIs & Services > Credentials
3. Create OAuth 2.0 Client ID
4. Download the credentials and note the Client ID and Client Secret

#### C. Generate Refresh Token
1. Use the OAuth2 playground or create a simple script to generate a refresh token
2. Save the refresh token in your `.env` file

#### D. Create Pub/Sub Topic
```bash
gcloud pubsub topics create gmail-notifications
```

#### E. Create Push Subscription
```bash
gcloud pubsub subscriptions create gmail-push-subscription \
  --topic=gmail-notifications \
  --push-endpoint=https://your-domain.com/api/gmail/push \
  --ack-deadline=10
```

## 🔐 **Advanced Token Management**

The application includes sophisticated OAuth2 token management for seamless Gmail API operations:

### **Automatic Token Refresh**
- **Proactive Renewal**: Tokens are refreshed every 30 minutes before expiration
- **Automatic Retry**: Failed requests automatically trigger token refresh
- **Smart Queuing**: Prevents multiple simultaneous refresh attempts
- **Error Recovery**: Graceful handling of token refresh failures

### **Token Monitoring**
- **Real-time Status**: Monitor token health via `/api/gmail/status`
- **WebSocket Notifications**: Instant updates on token events
- **Automatic Recovery**: Self-healing when tokens become invalid

### **Manual Controls**
- **Force Refresh**: `/api/gmail/refresh-token` - Manually refresh tokens
- **Re-authentication**: `/api/gmail/re-authenticate` - Force re-auth when needed
- **Status Monitoring**: Real-time token health dashboard

### **Token Lifecycle**
1. **Initial Setup**: OAuth2 flow generates refresh token
2. **Automatic Refresh**: Access tokens refreshed every 30 minutes
3. **Error Handling**: Failed refreshes trigger re-authentication
4. **Recovery**: System attempts to recover using existing refresh token
5. **Fallback**: Manual intervention required if refresh token expires

### **Environment Variables for Tokens**
```env
GOOGLE_CLIENT_ID=your_oauth2_client_id
GOOGLE_CLIENT_SECRET=your_oauth2_client_secret
GOOGLE_REFRESH_TOKEN=your_long_lived_refresh_token
```

### 4. Frontend Configuration

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Create `.env.local` file:
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### 5. Database Setup

1. Create a MongoDB Atlas cluster
2. Create a database user with read/write permissions
3. Update the `MONGODB_URI` in your backend `.env` file

## 🚀 Running the Application

### Development Mode

```bash
# From the root directory
npm run dev

# Or run separately
npm run dev:backend    # Backend on port 3001
npm run dev:frontend   # Frontend on port 3000
```

### Production Build

```bash
npm run build
npm run start
```

## 📧 How to Use

### 1. Test Email Configuration
- **Test Gmail**: `krisppy0@gmail.com`
- **Test Subject**: `Lucid Growth Test Subject`

### 2. Send Test Emails
Send emails from any email address to the test Gmail account with the exact subject line. The application will:

1. Automatically detect incoming emails
2. Filter by the test subject line
3. Extract receiving chain headers
4. Identify the ESP type
5. Store data in MongoDB
6. Update the dashboard in real-time

### 3. Dashboard Features
- **Overview Tab**: Email statistics and analytics
- **Emails Tab**: Detailed email list with search and filtering
- **Real-time Updates**: Live notifications via WebSocket
- **Email Details**: Expandable cards showing receiving chain and raw email data

## 🌐 Deployment

### ✅ Backend Deployed
- **Status**: ✅ Live at https://lucidgrowth-backend.onrender.com/
- **Platform**: Render (free tier)
- **Health Check**: https://lucidgrowth-backend.onrender.com/api/health

### 🚀 Frontend Deployment
- **Status**: Ready for Vercel deployment
- **Platform**: Vercel (free tier)
- **Build**: ✅ Successful (all TypeScript errors resolved)

### Quick Deployment Guides
- **Backend**: [DOCKER_DEPLOYMENT_FIX.md](./DOCKER_DEPLOYMENT_FIX.md)
- **Frontend**: [VERCEL_DEPLOYMENT_GUIDE.md](./VERCEL_DEPLOYMENT_GUIDE.md)

### Deployment Options

#### ✅ Option 1: Render + Vercel (Current Setup)
- **Backend**: ✅ Deployed on Render
- **Frontend**: 🚀 Ready for Vercel
- **Database**: MongoDB Atlas

#### Option 2: Google Cloud Run + Vercel
- **Backend**: Deploy to Google Cloud Run
- **Frontend**: Deploy to Vercel
- **Database**: MongoDB Atlas

### Environment Variables for Production
- **Backend**: Set in Render dashboard
- **Frontend**: Set `NEXT_PUBLIC_API_URL=https://lucidgrowth-backend.onrender.com` in Vercel

### Security Notes
- Never commit `.env` files to version control
- Use environment variables for all sensitive data
- Update OAuth2 redirect URIs for production domains
- Configure CORS properly for production domains

## 🔧 API Endpoints

### Gmail Endpoints
- `POST /api/gmail/start-watch` - Start or renew Gmail watch
- `GET /api/gmail/status` - Get Gmail watch status
- `POST /api/gmail/process/:emailId` - Manually process email
- `POST /api/gmail/push` - Pub/Sub push notification endpoint

### Email Endpoints
- `GET /api/emails` - List all emails with pagination
- `GET /api/emails/:emailId` - Get email details
- `GET /api/emails/:emailId/status` - Get email processing status
- `POST /api/emails` - Create new email
- `POST /api/emails/:emailId` - Update email
- `DELETE /api/emails/:emailId` - Delete email
- `GET /api/emails/stats/overview` - Get email statistics

## 🧪 Testing

### Manual Testing
1. Start the application
2. Send an email to `krisppy0@gmail.com` with subject `Lucid Growth Test Subject`
3. Check the dashboard for real-time updates
4. Verify email processing and data extraction

### Automated Testing
```bash
# Backend tests
cd backend
npm run test

# Frontend tests
cd frontend
npm run test
```

## 🔒 Security Considerations

- OAuth2 tokens are stored securely
- API endpoints are protected with proper validation
- CORS is configured for production domains
- Environment variables are used for sensitive data

## 🐛 Troubleshooting

### Common Issues

1. **Gmail Watch Expired**
   - Check OAuth2 credentials
   - Verify Pub/Sub topic configuration
   - Check backend logs for errors

2. **MongoDB Connection Issues**
   - Verify connection string
   - Check network access and IP whitelist
   - Ensure database user has proper permissions

3. **WebSocket Connection Failed**
   - Check CORS configuration
   - Verify frontend API URL
   - Check backend WebSocket gateway

### Logs
- Backend logs are displayed in the console
- Frontend errors are logged to browser console
- Check Google Cloud logs for Pub/Sub issues

## 📚 Additional Resources

- [Gmail API Documentation](https://developers.google.com/gmail/api)
- [Google Cloud Pub/Sub](https://cloud.google.com/pubsub/docs)
- [NestJS Documentation](https://docs.nestjs.com/)
- [Next.js Documentation](https://nextjs.org/docs)
- [MongoDB Atlas](https://docs.atlas.mongodb.com/)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue in the GitHub repository
- Check the troubleshooting section
- Review the API documentation

---

**Note**: This application is designed for testing and development purposes. Ensure compliance with Gmail API usage limits and terms of service for production use.
