import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type EmailDocument = Email & Document;

export enum EmailStatus {
  PENDING = 'pending',
  DONE = 'done',
}

@Schema({ timestamps: true })
export class Email {
  @Prop({ required: true, unique: true })
  emailId: string;

  @Prop({ required: true })
  subject: string;

  @Prop({ required: true })
  from: string;

  @Prop({ type: [String], required: true })
  receivedChain: string[];

  @Prop({ required: true })
  espType: string;

  @Prop({ 
    type: String, 
    enum: EmailStatus, 
    default: EmailStatus.PENDING 
  })
  status: EmailStatus;

  @Prop({ required: true })
  timestamp: Date;

  @Prop({ required: true })
  rawEmail: string;

  // Enhanced header analysis fields
  @Prop()
  messageId?: string;

  @Prop()
  deliveredTo?: string;

  @Prop()
  returnPath?: string;

  @Prop({ type: Object })
  authenticationResults?: {
    spf?: string;
    dkim?: string;
    dmarc?: string;
  };

  @Prop({ type: [Object] })
  deliveryTimeline?: Array<{
    hop: number;
    delay?: string;
    from?: string;
    to: string;
    protocol: string;
    timeReceived: string;
    additionalInfo?: string;
  }>;

  @Prop()
  createdAt?: Date;

  @Prop()
  updatedAt?: Date;
}

export const EmailSchema = SchemaFactory.createForClass(Email);
