import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CheckpointDocument = Checkpoint & Document;

@Schema({ timestamps: true })
export class Checkpoint {
  @Prop({ required: true, unique: true })
  userId: string;

  @Prop({ required: true })
  lastProcessedHistoryId: string;

  @Prop({ required: true })
  emailAddress: string;

  @Prop({ default: Date.now })
  lastUpdated: Date;
}

export const CheckpointSchema = SchemaFactory.createForClass(Checkpoint);

