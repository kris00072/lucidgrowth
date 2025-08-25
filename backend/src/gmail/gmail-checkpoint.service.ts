import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Checkpoint, CheckpointDocument } from './schemas/checkpoint.schema';
import { ProcessedMessage, ProcessedMessageDocument } from './schemas/processed-message.schema';

@Injectable()
export class GmailCheckpointService {
  private readonly logger = new Logger(GmailCheckpointService.name);
  private readonly USER_ID = 'me';

  constructor(
    @InjectModel(Checkpoint.name) private checkpointModel: Model<CheckpointDocument>,
    @InjectModel(ProcessedMessage.name) private processedMessageModel: Model<ProcessedMessageDocument>,
  ) {}

  /**
   * Get the last processed history ID for the user
   */
  async getLastProcessedHistoryId(emailAddress: string): Promise<string | null> {
    try {
      const checkpoint = await this.checkpointModel.findOne({ 
        userId: this.USER_ID,
        emailAddress 
      });
      
      return checkpoint?.lastProcessedHistoryId || null;
    } catch (error) {
      this.logger.error(`Failed to get last processed history ID: ${error.message}`);
      return null;
    }
  }

  /**
   * Update the last processed history ID
   */
  async updateLastProcessedHistoryId(emailAddress: string, historyId: string): Promise<void> {
    try {
      await this.checkpointModel.findOneAndUpdate(
        { userId: this.USER_ID, emailAddress },
        { 
          lastProcessedHistoryId: historyId,
          lastUpdated: new Date()
        },
        { upsert: true, new: true }
      );
      
      this.logger.log(`Updated checkpoint for ${emailAddress} to history ID: ${historyId}`);
    } catch (error) {
      this.logger.error(`Failed to update last processed history ID: ${error.message}`);
      throw error;
    }
  }

  /**
   * Check if a message has already been processed
   */
  async isMessageProcessed(messageId: string): Promise<boolean> {
    try {
      const processedMessage = await this.processedMessageModel.findOne({ messageId });
      return !!processedMessage;
    } catch (error) {
      this.logger.error(`Failed to check if message is processed: ${error.message}`);
      return false;
    }
  }

  /**
   * Mark a message as processed
   */
  async markMessageAsProcessed(messageId: string, emailAddress: string, historyId: string): Promise<void> {
    try {
      await this.processedMessageModel.create({
        messageId,
        userId: this.USER_ID,
        emailAddress,
        processedAt: new Date(),
        historyId
      });
      
      this.logger.log(`Marked message ${messageId} as processed`);
    } catch (error) {
      this.logger.error(`Failed to mark message as processed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get processing statistics
   */
  async getProcessingStats(emailAddress: string): Promise<{
    lastProcessedHistoryId: string | null;
    totalProcessedMessages: number;
    lastProcessedAt: Date | null;
  }> {
    try {
      const checkpoint = await this.checkpointModel.findOne({ 
        userId: this.USER_ID,
        emailAddress 
      });
      
      const totalProcessedMessages = await this.processedMessageModel.countDocuments({
        userId: this.USER_ID,
        emailAddress
      });

      const lastProcessedMessage = await this.processedMessageModel.findOne({
        userId: this.USER_ID,
        emailAddress
      }).sort({ processedAt: -1 });

      return {
        lastProcessedHistoryId: checkpoint?.lastProcessedHistoryId || null,
        totalProcessedMessages,
        lastProcessedAt: lastProcessedMessage?.processedAt || null
      };
    } catch (error) {
      this.logger.error(`Failed to get processing stats: ${error.message}`);
      return {
        lastProcessedHistoryId: null,
        totalProcessedMessages: 0,
        lastProcessedAt: null
      };
    }
  }
}

