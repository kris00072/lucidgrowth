import { Controller, Post, Get, Param, HttpCode, HttpStatus, Body, Logger } from '@nestjs/common';
import { GmailService } from './gmail.service';

@Controller('gmail')
export class GmailController {
  private readonly logger = new Logger(GmailController.name);
  
  constructor(private readonly gmailService: GmailService) {}

  @Post('start-watch')
  @HttpCode(HttpStatus.OK)
  async startWatch(): Promise<{ message: string }> {
    await this.gmailService.startWatch();
    return { message: 'Gmail watch started successfully' };
  }

  @Get('status')
  async getStatus() {
    return this.gmailService.getWatchStatus();
  }

  @Post('process/:emailId')
  @HttpCode(HttpStatus.OK)
  async processEmail(@Param('emailId') emailId: string): Promise<{ message: string }> {
    await this.gmailService.processEmailManually(emailId);
    return { message: `Email ${emailId} processing started` };
  }

  @Post('push')
  @HttpCode(HttpStatus.OK)
  async handlePushNotification(@Body() body: any): Promise<{ message: string }> {
    try {
      if (body.message && body.message.data) {
        const data = JSON.parse(Buffer.from(body.message.data, 'base64').toString());
        
        this.logger.log(`Received Gmail notification: ${JSON.stringify(data)}`);
        
        if (data.historyId) {
          setImmediate(() => {
            this.gmailService.processGmailHistoryChange(data.historyId);
          });
          
          return { message: 'Gmail history change processing queued' };
        }
      }
      
      return { message: 'Invalid push notification format' };
    } catch (error) {
      this.logger.error(`Error processing push notification: ${error.message}`);
      return { message: 'Error processing push notification' };
    }
  }

  @Post('refresh-token')
  @HttpCode(HttpStatus.OK)
  async refreshToken(): Promise<{ message: string }> {
    await this.gmailService.refreshTokenManually();
    return { message: 'Token refresh initiated' };
  }

  @Post('re-authenticate')
  @HttpCode(HttpStatus.OK)
  async reAuthenticate(): Promise<{ message: string }> {
    await this.gmailService.forceReAuthentication();
    return { message: 'Re-authentication initiated' };
  }
}
