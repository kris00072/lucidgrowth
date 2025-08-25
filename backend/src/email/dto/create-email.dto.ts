import { IsString, IsArray, IsEnum, IsDateString, IsOptional } from 'class-validator';
import { EmailStatus } from '../schemas/email.schema';

export class CreateEmailDto {
  @IsString()
  emailId: string;

  @IsString()
  subject: string;

  @IsString()
  from: string;

  @IsArray()
  @IsString({ each: true })
  receivedChain: string[];

  @IsString()
  espType: string;

  @IsEnum(EmailStatus)
  @IsOptional()
  status?: EmailStatus;

  @IsDateString()
  timestamp: string;

  @IsString()
  rawEmail: string;

  
  @IsOptional()
  @IsString()
  messageId?: string;

  @IsOptional()
  @IsString()
  deliveredTo?: string;

  @IsOptional()
  @IsString()
  returnPath?: string;

  @IsOptional()
  authenticationResults?: {
    spf?: string;
    dkim?: string;
    dmarc?: string;
  };

  @IsOptional()
  deliveryTimeline?: Array<{
    hop: number;
    delay?: string;
    from?: string;
    to: string;
    protocol: string;
    timeReceived: string;
  }>;
}
