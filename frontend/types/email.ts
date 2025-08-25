export enum EmailStatus {
  PENDING = 'pending',
  DONE = 'done',
}

export interface Email {
  emailId: string;
  subject: string;
  from: string;
  receivedChain: string[];
  espType: string;
  status: EmailStatus;
  timestamp: Date;
  rawEmail: string;
  
  // Enhanced header analysis fields
  messageId?: string;
  deliveredTo?: string;
  returnPath?: string;
  authenticationResults?: {
    spf?: string;
    dkim?: string;
    dmarc?: string;
  };
  deliveryTimeline?: Array<{
    hop: number;
    delay?: string;
    from?: string;
    to: string;
    protocol: string;
    timeReceived: string;
    additionalInfo?: string;
  }>;
  
  createdAt?: Date;
  updatedAt?: Date;
}

export interface EmailStats {
  total: number;
  pending: number;
  done: number;
  recentCount: number;
}

export interface EmailListResponse {
  emails: Email[];
  total: number;
  page: number;
  totalPages: number;
}
