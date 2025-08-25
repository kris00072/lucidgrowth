import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ProcessedMessageDocument = ProcessedMessage & Document;

@Schema({ timestamps: true })
export class ProcessedMessage {
  @Prop({ required: true, unique: true })
  messageId: string;

  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  emailAddress: string;

  @Prop({ required: true })
  processedAt: Date;

  @Prop({ required: true })
  historyId: string;
}

export const ProcessedMessageSchema = SchemaFactory.createForClass(ProcessedMessage);

