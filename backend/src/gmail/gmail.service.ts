import { Injectable, Logger, OnModuleInit, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { google } from 'googleapis';
import { OAuth2Client, Credentials } from 'google-auth-library';
import { EmailService } from '../email/email.service';
import { EmailStatus } from '../email/schemas/email.schema';
import { AppWebSocketGateway } from '../websocket/websocket.gateway';
import { GmailCheckpointService } from './gmail-checkpoint.service';

@Injectable()
export class GmailService implements OnModuleInit {
  private readonly logger = new Logger(GmailService.name);
  private oauth2Client: OAuth2Client;
  private gmail: any;
  private watchExpiration: Date | null = null;
  private readonly TEST_SUBJECT = 'Lucid Growth Test Subject';
  private readonly TEST_EMAIL = 'krisppy0@gmail.com';
  
  private tokenRefreshInProgress = false;
  private lastTokenRefresh: Date | null = null;
  private tokenRefreshAttempts = 0;
  private readonly MAX_REFRESH_ATTEMPTS = 3;
  
  private isProcessing = false;
  private readonly USER_ID = 'me';

  constructor(
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
    private readonly webSocketGateway: AppWebSocketGateway,
    private readonly checkpointService: GmailCheckpointService,
  ) {}

  async onModuleInit() {
    await this.initializeGmail();
    await this.startWatch();
  }

  private async handleTokenRefresh(): Promise<void> {
    if (this.tokenRefreshInProgress) {
      this.logger.log('Token refresh already in progress, waiting...');
      while (this.tokenRefreshInProgress) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      return;
    }

    try {
      this.tokenRefreshInProgress = true;
      this.logger.log('Refreshing access token...');

      const { credentials } = await this.oauth2Client.refreshAccessToken();
      
      if (credentials.access_token) {
        this.oauth2Client.setCredentials(credentials);
        this.lastTokenRefresh = new Date();
        this.tokenRefreshAttempts = 0;
        
        this.logger.log('Access token refreshed successfully');
        
        this.gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });
        
        this.webSocketGateway.notifyTokenRefreshed();
      } else {
        throw new Error('No access token received from refresh');
      }
    } catch (error) {
      this.tokenRefreshAttempts++;
      this.logger.error(`Token refresh failed (attempt ${this.tokenRefreshAttempts}): ${error.message}`);
      
      if (this.tokenRefreshAttempts >= this.MAX_REFRESH_ATTEMPTS) {
        this.logger.error('Max token refresh attempts reached, re-authentication required');
        await this.handleReAuthentication();
      } else {
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    } finally {
      this.tokenRefreshInProgress = false;
    }
  }

  private async handleReAuthentication(): Promise<void> {
    this.logger.log('Initiating re-authentication process...');
    
    try {
      this.oauth2Client.setCredentials({});
      
      await this.initializeGmail();
      
      this.tokenRefreshAttempts = 0;
      this.lastTokenRefresh = new Date();
      
      this.logger.log('Re-authentication successful');
    } catch (error) {
      this.logger.error(`Re-authentication failed: ${error.message}`);
      
      this.webSocketGateway.notifyReAuthenticationRequired();
      
      this.gmail = null;
      this.watchExpiration = null;
      
      throw new UnauthorizedException('Gmail authentication failed. Manual re-authentication required.');
    }
  }

  private async makeGmailRequest<T>(requestFn: () => Promise<T>): Promise<T> {
    try {
      return await requestFn();
    } catch (error) {
      if (error.code === 401 || error.status === 401) {
        this.logger.log('Unauthorized request, attempting token refresh...');
        await this.handleTokenRefresh();
        
        return await requestFn();
      }
      throw error;
    }
  }

  private async initializeGmail() {
    try {
      const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
      const clientSecret = this.configService.get<string>('GOOGLE_CLIENT_SECRET');
      const refreshToken = this.configService.get<string>('GOOGLE_REFRESH_TOKEN');

      if (!clientId || !clientSecret || !refreshToken) {
        throw new Error('Missing Google OAuth2 credentials');
      }

      this.oauth2Client = new OAuth2Client(clientId, clientSecret);
      this.oauth2Client.setCredentials({
        refresh_token: refreshToken,
      });

      this.gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });
      
      this.logger.log('Gmail API initialized successfully');
    } catch (error) {
      this.logger.error(`Failed to initialize Gmail API: ${error.message}`);
      throw error;
    }
  }

  async startWatch(): Promise<void> {
    try {
      const response = await this.makeGmailRequest(async () => {
        return await this.gmail.users.watch({
          userId: 'me',
          requestBody: {
            topicName: this.configService.get<string>('GOOGLE_PUBSUB_TOPIC'),
            labelIds: ['INBOX'],
          },
        });
      });

      this.watchExpiration = new Date(
        parseInt(response.data.expiration) * 1000
      );
      
      this.logger.log(`Gmail watch started, expires at: ${this.watchExpiration}`);
      
      this.webSocketGateway.notifyGmailWatchStarted(this.watchExpiration);
    } catch (error) {
      this.logger.error(`Failed to start Gmail watch: ${error.message}`);
      throw error;
    }
  }

  @Cron(CronExpression.EVERY_HOUR)
  async renewWatchIfNeeded(): Promise<void> {
    if (!this.watchExpiration) {
      await this.startWatch();
      return;
    }

    const now = new Date();
    const timeUntilExpiration = this.watchExpiration.getTime() - now.getTime();
    const oneHourInMs = 60 * 60 * 1000;

    if (timeUntilExpiration < oneHourInMs) {
      this.logger.log('Gmail watch expiring soon, renewing...');
      await this.startWatch();
    }
  }

  @Cron(CronExpression.EVERY_30_MINUTES)
  async refreshTokenIfNeeded(): Promise<void> {
    if (!this.lastTokenRefresh) {
      return;
    }

    const now = new Date();
    const timeSinceLastRefresh = now.getTime() - this.lastTokenRefresh.getTime();
    const oneHourInMs = 60 * 60 * 1000;

    if (timeSinceLastRefresh > 50 * 60 * 1000) {
      this.logger.log('Proactively refreshing access token...');
      await this.handleTokenRefresh();
    }
  }

  async processGmailHistoryChange(historyId: number): Promise<void> {
    if (this.isProcessing) {
      this.logger.log(`Already processing Gmail history, skipping notification for history ID: ${historyId}`);
      return;
    }

    this.isProcessing = true;
    
    try {
      this.logger.log(`Processing Gmail history change: ${historyId}`);
      
      const emailAddress = this.TEST_EMAIL;
      
      const lastProcessedHistoryId = await this.checkpointService.getLastProcessedHistoryId(emailAddress);
      
      if (!lastProcessedHistoryId) {
        this.logger.log(`No previous checkpoint found, starting from history ID: ${historyId}`);
        await this.checkpointService.updateLastProcessedHistoryId(emailAddress, historyId.toString());
        return;
      }

      const history = await this.makeGmailRequest(async () => {
        return await this.gmail.users.history.list({
          userId: this.USER_ID,
          startHistoryId: lastProcessedHistoryId,
          historyTypes: ['messageAdded'],
        });
      });

      this.logger.log(`History response: ${JSON.stringify(history.data)}`);

      if (!history.data.history || history.data.history.length === 0) {
        this.logger.log(`No new messages found in history since ${lastProcessedHistoryId}`);
        return;
      }

      let processedCount = 0;
      const newMessages: string[] = [];

      for (const historyItem of history.data.history) {
        if (historyItem.messagesAdded) {
          this.logger.log(`Found ${historyItem.messagesAdded.length} messages in history item`);
          
          for (const messageAdded of historyItem.messagesAdded) {
            const messageId = messageAdded.message.id;
            
            const isProcessed = await this.checkpointService.isMessageProcessed(messageId);
            if (isProcessed) {
              this.logger.log(`Message ${messageId} already processed, skipping`);
              continue;
            }

            newMessages.push(messageId);
          }
        }
      }

      for (const messageId of newMessages) {
        try {
          await this.processIncomingEmail(messageId, emailAddress, historyId.toString());
          processedCount++;
        } catch (error) {
          this.logger.error(`Failed to process message ${messageId}: ${error.message}`);
        }
      }

      if (processedCount > 0) {
        await this.checkpointService.updateLastProcessedHistoryId(emailAddress, historyId.toString());
        this.logger.log(`Successfully processed ${processedCount} new messages, updated checkpoint to ${historyId}`);
      } else {
        this.logger.log(`No new messages processed, keeping checkpoint at ${lastProcessedHistoryId}`);
      }

    } catch (error) {
      this.logger.error(`Failed to process Gmail history change ${historyId}: ${error.message}`);
    } finally {
      this.isProcessing = false;
    }
  }

  async processIncomingEmail(emailId: string, emailAddress: string, historyId: string): Promise<void> {
    try {
      this.logger.log(`Processing incoming email: ${emailId}`);
      
      try {
        const existingEmail = await this.emailService.findOne(emailId);
        this.logger.log(`Email ${emailId} already exists in database, skipping`);
        return;
      } catch (notFoundError) {
        this.logger.log(`Email ${emailId} not found in database, proceeding with processing...`);
      }
      
      const email = await this.makeGmailRequest(async () => {
        return await this.gmail.users.messages.get({
          userId: this.USER_ID,
          id: emailId,
          format: 'raw',
        });
      });

      const rawEmail = Buffer.from(email.data.raw, 'base64').toString();
      
      if (!this.isTestEmail(rawEmail)) {
        this.logger.log(`Email ${emailId} does not match test subject, skipping`);
        return;
      }

      const emailData = await this.emailService.processRawEmail(rawEmail, emailId);
      await this.emailService.create(emailData);
      
      await this.emailService.updateStatus(emailId, EmailStatus.DONE);
      
      await this.checkpointService.markMessageAsProcessed(emailId, emailAddress, historyId);
      
      this.logger.log(`Email ${emailId} processed successfully`);
      
      this.webSocketGateway.notifyEmailProcessed(emailId);
    } catch (error) {
      this.logger.error(`Failed to process email ${emailId}: ${error.message}`);
      
      if (error.message.includes('duplicate key')) {
        this.logger.log(`Email ${emailId} already exists in database, skipping`);
        return;
      }
      
      try {
        await this.emailService.updateStatus(emailId, EmailStatus.PENDING);
      } catch (updateError) {
        this.logger.error(`Failed to update email status: ${updateError.message}`);
      }
    }
  }

  private isTestEmail(rawEmail: string): boolean {
    const lines = rawEmail.split('\n');
    
    for (const line of lines) {
      if (line.toLowerCase().startsWith('subject:')) {
        const subject = line.substring(9).trim();
        this.logger.log(`Found email subject: "${subject}"`);
        this.logger.log(`Expected subject: "${this.TEST_SUBJECT}"`);
        this.logger.log(`Subject match: ${subject === this.TEST_SUBJECT}`);
        return subject === this.TEST_SUBJECT;
      }
    }
    
    this.logger.log('No subject line found in email');
    return false;
  }

  async getWatchStatus(): Promise<{
    isActive: boolean;
    expiration: Date | null;
    testEmail: string;
    testSubject: string;
    tokenStatus: {
      lastRefresh: Date | null;
      refreshAttempts: number;
      isRefreshing: boolean;
      needsReAuth: boolean;
    };
    processingStats: {
      lastProcessedHistoryId: string | null;
      totalProcessedMessages: number;
      lastProcessedAt: Date | null;
      isProcessing: boolean;
    };
  }> {
    const processingStats = await this.checkpointService.getProcessingStats(this.TEST_EMAIL);
    
    return {
      isActive: this.watchExpiration ? new Date() < this.watchExpiration : false,
      expiration: this.watchExpiration,
      testEmail: this.TEST_EMAIL,
      testSubject: this.TEST_SUBJECT,
      tokenStatus: {
        lastRefresh: this.lastTokenRefresh,
        refreshAttempts: this.tokenRefreshAttempts,
        isRefreshing: this.tokenRefreshInProgress,
        needsReAuth: this.tokenRefreshAttempts >= this.MAX_REFRESH_ATTEMPTS,
      },
      processingStats: {
        ...processingStats,
        isProcessing: this.isProcessing,
      },
    };
  }

  async processEmailManually(emailId: string): Promise<void> {
    await this.processIncomingEmail(emailId, this.TEST_EMAIL, 'manual');
  }

  async refreshTokenManually(): Promise<void> {
    this.logger.log('Manual token refresh requested');
    await this.handleTokenRefresh();
  }

  async forceReAuthentication(): Promise<void> {
    this.logger.log('Force re-authentication requested');
    await this.handleReAuthentication();
  }
}
