export interface SupportTicket {
  id?: number;
  bookingReference: string;
  requestType: 'NAME_CORRECTION' | 'REFUND_REQUEST' | 'FLIGHT_ISSUE' | 'MISSING_TICKET' | 'SEAT_ISSUE' | 'OTHER';
  subject: string;
  description: string;
  attachmentUrl?: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'ESCALATED';
  createdBy?: string;
  assignedAgent?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ChatMessage {
  id?: number;
  bookingReference: string;
  supportTicketId?: number;
  senderUsername: string;
  senderRole: string;
  messageText: string;
  attachmentUrl?: string;
  timestamp?: string;
  isRead?: boolean;
}

export interface BookingAuditLog {
  id?: number;
  bookingReference: string;
  changedBy: string;
  description: string;
  changeTimestamp?: string;
}

export interface AIMessage {
  id?: number;
  sessionId: string;
  sender: 'USER' | 'AI';
  messageText: string;
  timestamp?: string;
}

