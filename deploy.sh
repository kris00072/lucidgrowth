#!/bin/bash

# Lucid Growth Email Analyzer Deployment Script
# This script deploys the backend to Google Cloud Run

set -e

# Configuration
PROJECT_ID="your-google-cloud-project-id"
REGION="us-central1"
SERVICE_NAME="lucid-growth-backend"
IMAGE_NAME="gcr.io/$PROJECT_ID/$SERVICE_NAME"

echo "🚀 Starting deployment to Google Cloud Run..."

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo "❌ gcloud CLI is not installed. Please install it first."
    exit 1
fi

# Check if docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install it first."
    exit 1
fi

# Set the project
echo "📋 Setting Google Cloud project to: $PROJECT_ID"
gcloud config set project $PROJECT_ID

# Enable required APIs
echo "🔌 Enabling required APIs..."
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com

# Build the Docker image
echo "🏗️ Building Docker image..."
cd backend
docker build -t $IMAGE_NAME .

# Push to Google Container Registry
echo "📤 Pushing image to Google Container Registry..."
docker push $IMAGE_NAME

# Deploy to Cloud Run
echo "🚀 Deploying to Cloud Run..."
gcloud run deploy $SERVICE_NAME \
    --image $IMAGE_NAME \
    --platform managed \
    --region $REGION \
    --allow-unauthenticated \
    --port 3001 \
    --memory 1Gi \
    --cpu 1 \
    --max-instances 10 \
    --set-env-vars="NODE_ENV=production" \
    --set-env-vars="PORT=3001"

# Get the service URL
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --region=$REGION --format='value(status.url)')

echo "✅ Deployment completed successfully!"
echo "🌐 Service URL: $SERVICE_URL"
echo ""
echo "📝 Next steps:"
echo "1. Update your frontend environment variables with: NEXT_PUBLIC_API_URL=$SERVICE_URL"
echo "2. Update your Pub/Sub push subscription endpoint to: $SERVICE_URL/api/gmail/push"
echo "3. Test the deployment by sending an email to krisppy0@gmail.com with subject 'Lucid Growth Test Subject'"
