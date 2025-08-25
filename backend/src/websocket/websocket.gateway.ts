import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { Email } from '../email/schemas/email.schema';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
})
export class AppWebSocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(AppWebSocketGateway.name);
  private connectedClients: Set<Socket> = new Set();

  handleConnection(client: Socket) {
    this.connectedClients.add(client);
    this.logger.log(`Client connected: ${client.id}`);
    
    client.emit('connected', { message: 'Connected to server' });
  }

  handleDisconnect(client: Socket) {
    this.connectedClients.delete(client);
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('subscribe')
  handleSubscribe(client: Socket, payload: any) {
    this.logger.log(`Client ${client.id} subscribed to updates`);
    client.emit('subscribed', { message: 'Subscribed to email updates' });
  }

  notifyEmailCreated(email: Email) {
    this.server.emit('email:created', email);
    this.logger.log(`Notified clients about new email: ${email.emailId}`);
  }

  /**
   * Notify all connected clients about email update
   */
  notifyEmailUpdated(email: Email) {
    this.server.emit('email:updated', email);
    this.logger.log(`Notified clients about email update: ${email.emailId}`);
  }

  /**
   * Notify all connected clients about email deletion
   */
  notifyEmailDeleted(emailId: string) {
    this.server.emit('email:deleted', { emailId });
    this.logger.log(`Notified clients about email deletion: ${emailId}`);
  }

  /**
   * Notify all connected clients about email processing completion
   */
  notifyEmailProcessed(emailId: string) {
    this.server.emit('email:processed', { emailId });
    this.logger.log(`Notified clients about email processed: ${emailId}`);
  }

  /**
   * Notify all connected clients about Gmail watch status
   */
  notifyGmailWatchStarted(expiration: Date) {
    this.server.emit('gmail:watch-started', { expiration });
    this.logger.log(`Notified clients about Gmail watch started`);
  }

  /**
   * Get number of connected clients
   */
  getConnectedClientsCount(): number {
    return this.connectedClients.size;
  }

  /**
   * Notify all connected clients about token refresh
   */
  notifyTokenRefreshed() {
    this.server.emit('gmail:token-refreshed', { 
      message: 'Gmail access token refreshed successfully',
      timestamp: new Date()
    });
    this.logger.log('Notified clients about token refresh');
  }

  /**
   * Notify all connected clients about re-authentication requirement
   */
  notifyReAuthenticationRequired() {
    this.server.emit('gmail:re-auth-required', { 
      message: 'Gmail re-authentication required',
      timestamp: new Date()
    });
    this.logger.log('Notified clients about re-authentication requirement');
  }
}
