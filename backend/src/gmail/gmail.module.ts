import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { GmailController } from './gmail.controller';
import { GmailService } from './gmail.service';
import { GmailCheckpointService } from './gmail-checkpoint.service';
import { Checkpoint, CheckpointSchema } from './schemas/checkpoint.schema';
import { ProcessedMessage, ProcessedMessageSchema } from './schemas/processed-message.schema';
import { EmailModule } from '../email/email.module';
import { WebSocketModule } from '../websocket/websocket.module';

@Module({
  imports: [
    EmailModule, 
    WebSocketModule,
    MongooseModule.forFeature([
      { name: Checkpoint.name, schema: CheckpointSchema },
      { name: ProcessedMessage.name, schema: ProcessedMessageSchema },
    ]),
  ],
  controllers: [GmailController],
  providers: [GmailService, GmailCheckpointService],
  exports: [GmailService],
})
export class GmailModule {}
