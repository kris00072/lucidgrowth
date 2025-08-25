import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Email, EmailDocument, EmailStatus } from './schemas/email.schema';
import { CreateEmailDto } from './dto/create-email.dto';
import { UpdateEmailDto } from './dto/update-email.dto';
import { AppWebSocketGateway } from '../websocket/websocket.gateway';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(
    @InjectModel(Email.name) private emailModel: Model<EmailDocument>,
    private readonly webSocketGateway: AppWebSocketGateway,
  ) {}

  async create(createEmailDto: CreateEmailDto): Promise<Email> {
    try {
      const createdEmail = new this.emailModel(createEmailDto);
      const savedEmail = await createdEmail.save();
      
      this.logger.log(`Email created: ${savedEmail.emailId}`);
      
      this.webSocketGateway.notifyEmailCreated(savedEmail);
      
      return savedEmail;
    } catch (error) {
      this.logger.error(`Error creating email: ${error.message}`);
      throw error;
    }
  }

  async findAll(page: number = 1, limit: number = 50): Promise<{ emails: Email[]; total: number; page: number; totalPages: number }> {
    const skip = (page - 1) * limit;
    
    const [emails, total] = await Promise.all([
      this.emailModel
        .find()
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.emailModel.countDocuments().exec(),
    ]);

    return {
      emails,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(emailId: string): Promise<Email> {
    const email = await this.emailModel.findOne({ emailId }).exec();
    if (!email) {
      throw new NotFoundException(`Email with ID ${emailId} not found`);
    }
    return email;
  }

  /**
   * Update email status
   */
  async updateStatus(emailId: string, status: EmailStatus): Promise<Email> {
    const email = await this.emailModel.findOneAndUpdate(
      { emailId },
      { status },
      { new: true }
    ).exec();
    
    if (!email) {
      throw new NotFoundException(`Email with ID ${emailId} not found`);
    }
    
    this.logger.log(`Email status updated: ${emailId} -> ${status}`);
    
    // Notify frontend via WebSocket
    this.webSocketGateway.notifyEmailUpdated(email);
    
    return email;
  }

  /**
   * Update email by ID
   */
  async update(emailId: string, updateEmailDto: UpdateEmailDto): Promise<Email> {
    const email = await this.emailModel.findOneAndUpdate(
      { emailId },
      updateEmailDto,
      { new: true }
    ).exec();
    
    if (!email) {
      throw new NotFoundException(`Email with ID ${emailId} not found`);
    }
    
    this.logger.log(`Email updated: ${emailId}`);
    
    // Notify frontend via WebSocket
    this.webSocketGateway.notifyEmailUpdated(email);
    
    return email;
  }

  /**
   * Delete email by ID
   */
  async remove(emailId: string): Promise<void> {
    const result = await this.emailModel.deleteOne({ emailId }).exec();
    
    if (result.deletedCount === 0) {
      throw new NotFoundException(`Email with ID ${emailId} not found`);
    }
    
    this.logger.log(`Email deleted: ${emailId}`);
    
    // Notify frontend via WebSocket
    this.webSocketGateway.notifyEmailDeleted(emailId);
  }

  /**
   * Get email processing statistics
   */
  async getStats(): Promise<{
    total: number;
    pending: number;
    done: number;
    recentCount: number;
  }> {
    const [total, pending, done, recentCount] = await Promise.all([
      this.emailModel.countDocuments().exec(),
      this.emailModel.countDocuments({ status: EmailStatus.PENDING }).exec(),
      this.emailModel.countDocuments({ status: EmailStatus.DONE }).exec(),
      this.emailModel.countDocuments({
        timestamp: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      }).exec(),
    ]);

    return { total, pending, done, recentCount };
  }

  /**
   * Process raw email data and extract relevant information
   */
  async processRawEmail(rawEmail: string, emailId: string): Promise<CreateEmailDto> {
    // Extract email heade
    const lines = rawEmail.split('\n');
    const headers: { [key: string]: string } = {};
    
    let i = 0;
    while (i < lines.length && lines[i].trim() !== '') {
      const line = lines[i];
      const colonIndex = line.indexOf(':');
      if (colonIndex > 0) {
        const key = line.substring(0, colonIndex).trim().toLowerCase();
        const value = line.substring(colonIndex + 1).trim();
        
        if (headers[key]) {
          headers[key] += ' ' + value;
        } else {
          headers[key] = value;
        }
      }
      i++;
    }

    // Extract basic fields
    const subject = headers['subject'] || 'No Subject';
    const from = headers['from'] || 'Unknown Sender';
    const messageId = headers['message-id'] || headers['messageid'] || '';
    const deliveredTo = headers['delivered-to'] || '';
    const returnPath = headers['return-path'] || '';

    // Extract received chain
    const receivedChain: string[] = [];
    for (let j = 0; j < lines.length; j++) {
      const line = lines[j];
      if (line.toLowerCase().startsWith('received:') || line.toLowerCase().startsWith('x-received:')) {
        let headerValue = line.substring(line.indexOf(':') + 1).trim();
        
        // Handle multi-line headers
        let k = j + 1;
        while (k < lines.length && (lines[k].startsWith(' ') || lines[k].startsWith('\t'))) {
          headerValue += ' ' + lines[k].trim();
          k++;
        }
        
        if (headerValue) {
          receivedChain.push(headerValue);
        }
      }
    }

    // Extract authentication results
    const authenticationResults = this.extractAuthenticationResults(headers);

    // Extract delivery timeline
    const deliveryTimeline = this.extractDeliveryTimeline(lines);
    
    // Determine ESP type from from header and return path
    const espType = this.determineESPType(from, returnPath, receivedChain);

    return {
      emailId,
      subject,
      from,
      receivedChain,
      espType,
      status: EmailStatus.PENDING,
      timestamp: new Date().toISOString(),
      rawEmail,
      messageId,
      deliveredTo,
      returnPath,
      authenticationResults,
      deliveryTimeline,
    };
  }

  /**
   * Extract authentication results from headers
   */
  private extractAuthenticationResults(headers: { [key: string]: string }) {
    const authResults: { spf?: string; dkim?: string; dmarc?: string } = {};
    
    // Extract SPF
    if (headers['authentication-results']) {
      const authResultsStr = headers['authentication-results'];
      const spfMatch = authResultsStr.match(/spf=([^;\s]+)/i);
      if (spfMatch) {
        authResults.spf = spfMatch[1];
      }
      
      const dkimMatch = authResultsStr.match(/dkim=([^;\s]+)/i);
      if (dkimMatch) {
        authResults.dkim = dkimMatch[1];
      }
      
      const dmarcMatch = authResultsStr.match(/dmarc=([^;\s]+)/i);
      if (dmarcMatch) {
        authResults.dmarc = dmarcMatch[1];
      }
    }

    // Also check ARC-Authentication-Results
    if (headers['arc-authentication-results']) {
      const arcAuthResultsStr = headers['arc-authentication-results'];
      if (!authResults.spf) {
        const spfMatch = arcAuthResultsStr.match(/spf=([^;\s]+)/i);
        if (spfMatch) {
          authResults.spf = spfMatch[1];
        }
      }
      if (!authResults.dkim) {
        const dkimMatch = arcAuthResultsStr.match(/dkim=([^;\s]+)/i);
        if (dkimMatch) {
          authResults.dkim = dkimMatch[1];
        }
      }
      if (!authResults.dmarc) {
        const dmarcMatch = arcAuthResultsStr.match(/dmarc=([^;\s]+)/i);
        if (dmarcMatch) {
          authResults.dmarc = dmarcMatch[1];
        }
      }
    }

    return authResults;
  }

  /**
   * Extract delivery timeline from received headers
   */
  private extractDeliveryTimeline(lines: string[]) {
    const timeline: Array<{
      hop: number;
      delay?: string;
      from?: string;
      to: string;
      protocol: string;
      timeReceived: string;
      additionalInfo?: string;
    }> = [];

    let hopNumber = 0;
    const receivedHeaders: string[] = [];
    
    // Get email timestamp for delay calculation
    let emailTimestamp = new Date();
    for (const line of lines) {
      if (line.toLowerCase().startsWith('date:')) {
        const dateValue = line.substring(5).trim();
        const parsedDate = new Date(dateValue);
        if (!isNaN(parsedDate.getTime())) {
          emailTimestamp = parsedDate;
          break;
        }
      }
    }
    
    // Collect all received headers (including X-Received)
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.toLowerCase().startsWith('received:') || line.toLowerCase().startsWith('x-received:')) {
        let headerValue = line.substring(line.indexOf(':') + 1).trim();
        
        // Handle multi-line headers
        let j = i + 1;
        while (j < lines.length && (lines[j].startsWith(' ') || lines[j].startsWith('\t'))) {
          headerValue += ' ' + lines[j].trim();
          j++;
        }
        
        receivedHeaders.push(headerValue);
        console.log('📨 Found header:', headerValue);
      }
    }

    console.log(`📊 Total received headers found: ${receivedHeaders.length}`);

    // Process headers in reverse order (oldest first)
    for (let i = receivedHeaders.length - 1; i >= 0; i--) {
      const receivedValue = receivedHeaders[i];
      
      // Parse received header
      const parsed = this.parseReceivedHeader(receivedValue);
      if (parsed) {
        const timelineEntry = {
          hop: hopNumber++,
          from: parsed.from,
          to: parsed.to,
          protocol: parsed.protocol,
          timeReceived: parsed.timeReceived,
          additionalInfo: parsed.additionalInfo,
        };
        
        timeline.push(timelineEntry);
      }
    }

    // Calculate delays and enhance information
    for (let i = 0; i < timeline.length; i++) {
      if (i === 0) {
        // For the first hop, calculate delay based on email creation time vs first receipt time
        const hopTime = new Date(timeline[i].timeReceived);
        const delayMs = Math.abs(hopTime.getTime() - emailTimestamp.getTime());
        
        console.log(`⏱️ Calculating delay for hop ${i} (first hop):`, {
          hopTime: timeline[i].timeReceived,
          emailTime: emailTimestamp.toISOString(),
          delayMs
        });
        
        if (delayMs < 1000) { // Less than 1 second
          timeline[i].delay = '~0 sec';
        } else {
          timeline[i].delay = `${Math.round(delayMs / 1000)} sec`;
        }
      } else {
        const currentTime = new Date(timeline[i].timeReceived);
        const previousTime = new Date(timeline[i - 1].timeReceived);
        const delayMs = currentTime.getTime() - previousTime.getTime();
        
        console.log(`⏱️ Calculating delay for hop ${i}:`, {
          current: timeline[i].timeReceived,
          previous: timeline[i - 1].timeReceived,
          delayMs
        });
        
        if (delayMs > 0) {
          timeline[i].delay = `${Math.round(delayMs / 1000)} sec`;
        } else if (delayMs === 0) {
          timeline[i].delay = `0 sec`;
        } else {
          // Negative delay means timestamps might be out of order
          timeline[i].delay = `~0 sec`;
        }
      }

      // Add additional info for Gmail servers
      if (timeline[i].to.includes('google.com') || timeline[i].to.includes('gmail.com') || timeline[i].to.includes('mx.google.com')) {
        if (!timeline[i].additionalInfo || timeline[i].additionalInfo === 'Google Server') {
          timeline[i].additionalInfo = 'Originated at Gmail';
        }
      }
    }

    console.log('📊 Final timeline:', timeline);
    return timeline;
  }

  /**
   * Parse a received header line with enhanced parsing
   */
  private parseReceivedHeader(receivedValue: string) {
    try {
      let from = '';
      let to = '';
      let protocol = 'SMTP';
      let timeReceived = new Date().toISOString();
      let additionalInfo = '';

      console.log('🔍 Parsing received header:', receivedValue);

      // Handle Gmail's "by server with SMTP id id; timestamp" format (no "from")
      const gmailByPattern = /^by\s+([^\s]+(?:\s+[^\s]+)*?)\s+with\s+([^\s]+)\s+id\s+([^;]+);\s*(.+)/i;
      const gmailByMatch = receivedValue.match(gmailByPattern);
      if (gmailByMatch) {
        to = gmailByMatch[1].trim();
        protocol = gmailByMatch[2].toUpperCase();
        additionalInfo = `id ${gmailByMatch[3]}`;
        
        // Parse timestamp from the end
        const timeStr = gmailByMatch[4].trim();
        const parsedTime = new Date(timeStr);
        if (!isNaN(parsedTime.getTime())) {
          timeReceived = parsedTime.toISOString();
        }
        
        console.log('📤 Gmail "by" format parsed:', { from, to, protocol, additionalInfo, timeReceived });
        return { from, to, protocol, timeReceived, additionalInfo };
      }

      // Handle Gmail's "from server (server [ip]) by server with protocol id id for recipient; timestamp" format
      const gmailFromByPattern = /^from\s+([^\s]+(?:\s+[^\s]+)*?)\s+\(([^)]+)\)\s+by\s+([^\s]+(?:\s+[^\s]+)*?)\s+with\s+([^\s]+)\s+id\s+([^;]+)\s+for\s+([^;]+);\s*(.+)/i;
      const gmailFromByMatch = receivedValue.match(gmailFromByPattern);
      if (gmailFromByMatch) {
        from = gmailFromByMatch[1].trim();
        const serverInfo = gmailFromByMatch[2].trim();
        to = gmailFromByMatch[3].trim();
        protocol = gmailFromByMatch[4].toUpperCase();
        const id = gmailFromByMatch[5].trim();
        const recipient = gmailFromByMatch[6].trim();
        
        additionalInfo = `${serverInfo}; for ${recipient}`;
        
        // Parse timestamp from the end
        const timeStr = gmailFromByMatch[7].trim();
        const parsedTime = new Date(timeStr);
        if (!isNaN(parsedTime.getTime())) {
          timeReceived = parsedTime.toISOString();
        }
        
        console.log('📤 Gmail "from by" format parsed:', { from, to, protocol, additionalInfo, timeReceived });
        return { from, to, protocol, timeReceived, additionalInfo };
      }

      // Handle X-Received format: "by server with SMTP id id; timestamp"
      const xReceivedPattern = /^by\s+([^\s]+(?:\s+[^\s]+)*?)\s+with\s+([^\s]+)\s+id\s+([^;]+);\s*(.+)/i;
      const xReceivedMatch = receivedValue.match(xReceivedPattern);
      if (xReceivedMatch) {
        to = xReceivedMatch[1].trim();
        protocol = xReceivedMatch[2].toUpperCase();
        additionalInfo = `id ${xReceivedMatch[3]}`;
        
        // Parse timestamp from the end
        const timeStr = xReceivedMatch[4].trim();
        const parsedTime = new Date(timeStr);
        if (!isNaN(parsedTime.getTime())) {
          timeReceived = parsedTime.toISOString();
        }
        
        console.log('📤 X-Received format parsed:', { from, to, protocol, additionalInfo, timeReceived });
        return { from, to, protocol, timeReceived, additionalInfo };
      }

      // Handle standard format: "from server by server with protocol; timestamp"
      const standardPattern = /^from\s+([^\s]+(?:\s+[^\s]+)*?)\s+by\s+([^\s]+(?:\s+[^\s]+)*?)\s+with\s+([^\s;]+);\s*(.+)/i;
      const standardMatch = receivedValue.match(standardPattern);
      if (standardMatch) {
        from = standardMatch[1].trim();
        to = standardMatch[2].trim();
        protocol = standardMatch[3].toUpperCase();
        
        // Parse timestamp from the end
        const timeStr = standardMatch[4].trim();
        const parsedTime = new Date(timeStr);
        if (!isNaN(parsedTime.getTime())) {
          timeReceived = parsedTime.toISOString();
        }
        
        console.log('📤 Standard format parsed:', { from, to, protocol, timeReceived });
        return { from, to, protocol, timeReceived, additionalInfo };
      }

      // Fallback: Extract from (comprehensive patterns)
      const fromPatterns = [
        /from\s+([^\s;]+(?:\s+[^\s;]+)*?)(?:\s+by|\s+with|\s+via|\s*$)/i,
        /from\s+([^\s]+(?:\s+[^\s]+)*?)\s+\(/i,
        /from\s+([^\s]+(?:\s+[^\s]+)*?)\s*;/i
      ];
      
      for (const pattern of fromPatterns) {
        const fromMatch = receivedValue.match(pattern);
        if (fromMatch && fromMatch[1] && fromMatch[1] !== 'unknown' && fromMatch[1].trim()) {
          from = fromMatch[1].replace(/^\[|\]$/g, '').trim();
          console.log('📤 Found FROM:', from);
          break;
        }
      }

      // Fallback: Extract to (comprehensive patterns)
      const toPatterns = [
        /by\s+([^\s;]+(?:\s+[^\s;]+)*?)(?:\s+with|\s+via|\s+for|\s*$)/i,
        /by\s+([^\s]+(?:\s+[^\s]+)*?)\s+\(/i,
        /by\s+([^\s]+(?:\s+[^\s]+)*?)\s*;/i,
        /to\s+([^\s;]+(?:\s+[^\s;]+)*?)(?:\s+with|\s+via|\s+for|\s*$)/i
      ];
      
      for (const pattern of toPatterns) {
        const toMatch = receivedValue.match(pattern);
        if (toMatch && toMatch[1] && toMatch[1].trim()) {
          to = toMatch[1].replace(/^\[|\]$/g, '').trim();
          console.log('📥 Found TO:', to);
          break;
        }
      }

      // Fallback: Extract protocol
      const protocolPatterns = [
        /with\s+([^\s;]+)/i,
        /via\s+([^\s;]+)/i,
        /using\s+([^\s;]+)/i
      ];
      
      for (const pattern of protocolPatterns) {
        const protocolMatch = receivedValue.match(pattern);
        if (protocolMatch && protocolMatch[1]) {
          protocol = protocolMatch[1].toUpperCase();
          console.log('🔗 Found PROTOCOL:', protocol);
          break;
        }
      }

      // Fallback: Extract time (multiple formats)
      const timePatterns = [
        /([A-Za-z]{3},\s+\d{1,2}\s+[A-Za-z]{3}\s+\d{4}\s+\d{1,2}:\d{2}:\d{2}\s+[+-]\d{4})/,
        /([A-Za-z]{3}\s+[A-Za-z]{3}\s+\d{1,2}\s+\d{1,2}:\d{2}:\d{2}\s+\d{4})/,
        /(\d{1,2}\s+[A-Za-z]{3}\s+\d{4}\s+\d{1,2}:\d{2}:\d{2}\s+[+-]\d{4})/,
        /([A-Za-z]{3}\s+\d{1,2}\s+\d{1,2}:\d{2}:\d{2}\s+\d{4})/
      ];
      
      for (const pattern of timePatterns) {
        const timeMatch = receivedValue.match(pattern);
        if (timeMatch && timeMatch[1]) {
          try {
            const parsedTime = new Date(timeMatch[1]);
            if (!isNaN(parsedTime.getTime())) {
              timeReceived = parsedTime.toISOString();
              console.log('⏰ Found TIME:', timeReceived);
              break;
            }
          } catch (e) {
            // Continue to next pattern
          }
        }
      }

      // Fallback: Extract additional info
      const infoPatterns = [
        /\(([^)]+)\)/g,
        /for\s+([^;]+)/i,
        /id\s+([^;]+)/i
      ];
      
      for (const pattern of infoPatterns) {
        const infoMatches = receivedValue.match(pattern);
        if (infoMatches && infoMatches.length > 0) {
          additionalInfo = infoMatches[0].replace(/^\(|\)$/g, '').trim();
          console.log('ℹ️ Found INFO:', additionalInfo);
          break;
        }
      }

      // Clean up values
      from = from.replace(/^\[|\]$/g, '').trim();
      to = to.replace(/^\[|\]$/g, '').trim();
      
      // Handle empty from/to values
      if (!from || from === 'unknown' || from === '-') {
        from = '';
      }
      if (!to || to === 'unknown') {
        to = '';
      }

      // Add Google identification
      if (to.includes('google.com') || to.includes('gmail.com') || to.includes('mx.google.com')) {
        if (!additionalInfo || additionalInfo === 'Google Server') {
          additionalInfo = 'Originated at Gmail';
        }
      }

      const result = { from, to, protocol, timeReceived, additionalInfo };
      console.log('✅ Parsed result:', result);
      
      return result;
    } catch (error) {
      console.error('❌ Error parsing received header:', error);
      return null;
    }
  }

  /**
   * Determine ESP type from various headers
   */
  private determineESPType(from: string, returnPath: string, receivedChain: string[]): string {
    // Check return path first (most reliable)
    if (returnPath.includes('amazonses.com') || returnPath.includes('ses')) {
      return 'Amazon SES';
    }
    if (returnPath.includes('sendgrid.net')) {
      return 'SendGrid';
    }
    if (returnPath.includes('mailgun.org')) {
      return 'Mailgun';
    }
    if (returnPath.includes('mandrillapp.com')) {
      return 'Mandrill';
    }

    // Check from header
    if (from.includes('gmail.com')) {
      return 'Gmail';
    }
    if (from.includes('outlook.com') || from.includes('hotmail.com')) {
      return 'Outlook';
    }
    if (from.includes('yahoo.com')) {
      return 'Yahoo';
    }
    if (from.includes('amazonaws.com') || from.includes('ses')) {
      return 'Amazon SES';
    }
    if (from.includes('sendgrid.net')) {
      return 'SendGrid';
    }
    if (from.includes('mailgun.org')) {
      return 'Mailgun';
    }
    if (from.includes('mandrillapp.com')) {
      return 'Mandrill';
    }

    // Check received chain for ESP indicators
    const receivedChainStr = receivedChain.join(' ').toLowerCase();
    if (receivedChainStr.includes('amazonses.com') || receivedChainStr.includes('ses')) {
      return 'Amazon SES';
    }
    if (receivedChainStr.includes('sendgrid.net')) {
      return 'SendGrid';
    }
    if (receivedChainStr.includes('mailgun.org')) {
      return 'Mailgun';
    }
    if (receivedChainStr.includes('mandrillapp.com')) {
      return 'Mandrill';
    }

    // Try to extract domain from from header
    const domainMatch = from.match(/@([^>]+)/);
    if (domainMatch) {
      return domainMatch[1];
    }

    return 'Unknown';
  }
}
