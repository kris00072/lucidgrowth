import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { GmailModule } from './gmail/gmail.module';
import { EmailModule } from './email/email.module';
import { WebSocketModule } from './websocket/websocket.module';
import { AppController } from './app.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    MongooseModule.forRoot(process.env.MONGODB_URI || 'mongodb://localhost:27017/lucid-growth'),
    ScheduleModule.forRoot(),
    GmailModule,
    EmailModule,
    WebSocketModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
