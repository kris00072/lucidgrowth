import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Configure CORS for both development and production
  const allowedOrigins = [
    'http://localhost:3000', // Local development
    'http://localhost:3001', // Local backend (if needed)
    'https://lucidgrowth-frontend.vercel.app', // Vercel frontend
  ];

  // Add production frontend URL if provided
  if (process.env.FRONTEND_URL) {
    allowedOrigins.push(process.env.FRONTEND_URL);
  }

  // Add Vercel domains for deployment
  if (process.env.NODE_ENV === 'production') {
    allowedOrigins.push(
      'https://*.vercel.app', // Allow all Vercel domains
      'https://vercel.app', // Allow Vercel main domain
    );
  }

  // Remove duplicates and filter out undefined values
  const uniqueOrigins = [...new Set(allowedOrigins.filter(Boolean))];

  console.log('🌐 Allowed CORS origins:', uniqueOrigins);
  
  app.enableCors({
    origin: uniqueOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  });
  
  // Global validation pipe
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
  }));
  
  // Global prefix for API routes
  app.setGlobalPrefix('api');
  
  const port = process.env.PORT || 3001;
  await app.listen(port);
  
  console.log(`🚀 Application is running on: http://localhost:${port}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📧 Test Gmail: krisppy0@gmail.com`);
  console.log(`📝 Test Subject: Lucid Growth Test Subject`);
  console.log(`🔗 CORS Origins: ${uniqueOrigins.join(', ')}`);
}

bootstrap();
