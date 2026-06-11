import { Component, Input, OnInit, OnDestroy, ElementRef, ViewChild, AfterViewChecked } from '@angular/core';
import { ChatService } from '../../services/chat.service';
import { AuthService } from '../../services/auth.service';
import { ChatMessage } from '../../models/support.model';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-chat-panel',
  template: `
    <div class="chat-container glass-panel animate-fade-in">
      <div class="chat-header">
        <h4 class="chat-title">
          <span class="status-indicator"></span>
          Live Support Chat - Booking #{{ bookingRef }}
        </h4>
      </div>

      <!-- Messages Stream -->
      <div class="chat-history" #messageScrollContainer>
        <div class="messages-list" *ngIf="messages.length > 0; else noMessages">
          <div 
            *ngFor="let msg of messages" 
            class="message-wrapper" 
            [class.mine]="isMine(msg)">
            
            <div class="message-bubble" [class.staff]="isStaff(msg)" [class.admin]="isAdminRole(msg)">
              <div class="meta-info">
                <span class="sender">{{ msg.senderUsername }} ({{ msg.senderRole }})</span>
                <span class="time">{{ formatTime(msg.timestamp) }}</span>
              </div>
              <p class="text">{{ msg.messageText }}</p>
            </div>
          </div>
        </div>
        <ng-template #noMessages>
          <div class="empty-chat">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="chat-icon">
              <path stroke-linecap="round" stroke-linejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 0 1-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8Z" />
            </svg>
            <p>Welcome to Volant Live Support. Type a message below to connect with our support agents.</p>
          </div>
        </ng-template>
      </div>

      <!-- Message Sender form -->
      <div class="chat-input-row">
        <input 
          type="text" 
          [(ngModel)]="newMsgText" 
          (keydown.enter)="sendMessage()" 
          placeholder="Type your message..." 
          class="chat-input"
          [disabled]="loading">
        <button class="btn btn-primary send-btn" (click)="sendMessage()" [disabled]="!newMsgText.trim() || loading">
          Send
        </button>
      </div>
    </div>
  `,
  styles: [`
    .chat-container {
      display: flex;
      flex-direction: column;
      height: 480px;
      border-radius: 12px;
      overflow: hidden;
      background: var(--glass-bg);
      border: 1px solid var(--glass-border);
      box-shadow: 0 8px 30px rgba(0, 0, 0, 0.05);
    }
    .chat-header {
      padding: 14px 20px;
      background: var(--primary-glow);
      border-bottom: 1px solid var(--glass-border);
    }
    .chat-title {
      font-family: var(--font-title);
      font-size: 0.95rem;
      font-weight: 700;
      color: var(--text-primary);
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .status-indicator {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--success);
      box-shadow: 0 0 8px var(--success-glow);
    }
    .chat-history {
      flex: 1;
      padding: 20px;
      overflow-y: auto;
      background: rgba(255, 255, 255, 0.02);
    }
    .messages-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .message-wrapper {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      width: 100%;
    }
    .message-wrapper.mine {
      align-items: flex-end;
    }
    .message-bubble {
      max-width: 80%;
      padding: 10px 14px;
      border-radius: 12px 12px 12px 2px;
      background: var(--bg-secondary);
      border: 1px solid var(--glass-border);
      color: var(--text-primary);
    }
    .message-wrapper.mine .message-bubble {
      border-radius: 12px 12px 2px 12px;
      background: var(--primary);
      color: #ffffff;
      border-color: transparent;
    }
    .message-bubble.staff {
      background: var(--accent-glow);
      border-color: var(--accent);
      color: var(--text-primary);
    }
    .message-bubble.admin {
      background: var(--primary-glow);
      border-color: var(--primary);
      color: var(--text-primary);
    }
    .message-wrapper.mine .message-bubble.staff,
    .message-wrapper.mine .message-bubble.admin {
      background: var(--primary);
      color: #ffffff;
      border-color: transparent;
    }
    .meta-info {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      font-size: 0.72rem;
      margin-bottom: 4px;
      opacity: 0.75;
    }
    .message-wrapper.mine .meta-info {
      opacity: 0.85;
    }
    .meta-info .sender {
      font-weight: 700;
    }
    .meta-info .time {
      white-space: nowrap;
    }
    .message-bubble .text {
      font-size: 0.88rem;
      line-height: 1.4;
      word-break: break-word;
    }
    .chat-input-row {
      display: flex;
      padding: 12px 16px;
      background: var(--glass-bg);
      border-top: 1px solid var(--glass-border);
      gap: 12px;
      align-items: center;
    }
    .chat-input {
      flex: 1;
      padding: 10px 14px;
      border-radius: 8px;
      border: 1px solid var(--glass-border);
      background: rgba(255,255,255,0.7);
      color: var(--text-primary);
      outline: none;
      font-size: 0.9rem;
      transition: var(--transition-fast);
    }
    .chat-input:focus {
      border-color: var(--primary);
      background: #ffffff;
    }
    .send-btn {
      padding: 10px 20px;
      font-size: 0.9rem;
      height: 40px;
    }
    .empty-chat {
      text-align: center;
      padding: 60px 20px;
      color: var(--text-muted);
    }
    .chat-icon {
      width: 48px;
      height: 48px;
      margin-bottom: 12px;
      opacity: 0.5;
    }
  `]
})
export class ChatPanelComponent implements OnInit, OnDestroy, AfterViewChecked {
  @Input() bookingRef!: string;
  @ViewChild('messageScrollContainer') private scrollContainer!: ElementRef;

  messages: ChatMessage[] = [];
  newMsgText = '';
  loading = false;
  
  private messageSub!: Subscription;

  constructor(
    private chatService: ChatService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadHistory();
    this.subscribeToRealtimeMessages();
  }

  ngOnDestroy(): void {
    this.chatService.disconnect();
    if (this.messageSub) {
      this.messageSub.unsubscribe();
    }
  }

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  loadHistory(): void {
    this.loading = true;
    this.chatService.getChatHistory(this.bookingRef).subscribe({
      next: (data) => {
        this.messages = data;
        this.loading = false;
        this.scrollToBottom();
      },
      error: (err) => {
        console.error('Failed to load chat history', err);
        this.loading = false;
      }
    });
  }

  subscribeToRealtimeMessages(): void {
    // Connect to WebSocket channel
    this.chatService.connect(this.bookingRef);

    // Subscribe to incoming messages
    this.messageSub = this.chatService.messages$.subscribe({
      next: (msg) => {
        if (msg.bookingReference === this.bookingRef) {
          // Avoid duplicate messages if WebSocket + Polling overlap
          const exists = this.messages.some(m => m.id === msg.id && msg.id !== undefined);
          if (!exists) {
            this.messages.push(msg);
            this.scrollToBottom();
          }
        }
      }
    });
  }

  sendMessage(): void {
    if (!this.newMsgText.trim()) return;

    const user = this.authService.getCurrentUser();
    if (!user) return;

    const chatMsg: ChatMessage = {
      bookingReference: this.bookingRef,
      senderUsername: user.username,
      senderRole: user.role,
      messageText: this.newMsgText.trim(),
      timestamp: new Date().toISOString()
    };

    this.chatService.sendMessage(chatMsg);
    this.newMsgText = '';
  }

  isMine(msg: ChatMessage): boolean {
    const user = this.authService.getCurrentUser();
    return user ? msg.senderUsername === user.username : false;
  }

  isStaff(msg: ChatMessage): boolean {
    return msg.senderRole === 'SUPPORT_AGENT';
  }

  isAdminRole(msg: ChatMessage): boolean {
    return msg.senderRole === 'ADMIN';
  }

  formatTime(dateStr?: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  private scrollToBottom(): void {
    try {
      this.scrollContainer.nativeElement.scrollTop = this.scrollContainer.nativeElement.scrollHeight;
    } catch (err) {}
  }
}
