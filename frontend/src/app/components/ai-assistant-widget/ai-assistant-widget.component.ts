import { Component, OnInit, OnDestroy, ElementRef, ViewChild, AfterViewChecked } from '@angular/core';
import { Router } from '@angular/router';
import { AIAssistantService } from '../../services/ai-assistant.service';
import { AIMessage } from '../../models/support.model';

@Component({
  selector: 'app-ai-assistant-widget',
  template: `
    <!-- Floating Bubble Trigger -->
    <div class="ai-bubble-trigger animate-bounce" *ngIf="displayMode === 'hidden'" (click)="setDisplayMode('window')" title="Open AI Travel Assistant">
      <img src="assets/Stylized_Bird_Logo_for_Volant_AI-removebg-preview.png" alt="Volant AI" class="bubble-logo-img">
    </div>

    <!-- Main Chat Container (Window or Full-Screen) -->
    <div class="ai-chat-container glass-panel" *ngIf="displayMode !== 'hidden'" [class.full-screen]="displayMode === 'fullscreen'">
      
      <!-- Header -->
      <div class="chat-header">
        <div class="header-info">
          <img src="assets/Stylized_Bird_Logo_for_Volant_AI-removebg-preview.png" alt="Volant AI" class="header-logo-img">
          <div>
            <h4 class="title">Volant Assistant</h4>
            <span class="subtitle">Virtual Travel Agent</span>
          </div>
        </div>
        <div class="header-actions">
          <!-- Reset Session -->
          <button class="icon-btn" (click)="resetChat()" title="Reset Conversation">🔄</button>
          
          <!-- Fullscreen / Window Toggle -->
          <button class="icon-btn" *ngIf="displayMode === 'window'" (click)="setDisplayMode('fullscreen')" title="Expand to Fullscreen">⛶</button>
          <button class="icon-btn" *ngIf="displayMode === 'fullscreen'" (click)="setDisplayMode('window')" title="Restore Window">❐</button>
          
          <!-- Close Chat -->
          <button class="icon-btn close-btn" (click)="setDisplayMode('hidden')" title="Minimize Chat">×</button>
        </div>
      </div>

      <!-- Navigation Tabs -->
      <div class="chat-tabs">
        <button class="tab-link" [class.active]="activeTab === 'chat'" (click)="setWidgetTab('chat')">💬 Chat</button>
        <button class="tab-link" [class.active]="activeTab === 'recent'" (click)="setWidgetTab('recent')">🕒 Recent</button>
      </div>

      <!-- Chat Tab Content -->
      <ng-container *ngIf="activeTab === 'chat'">
        <!-- Messages Area -->
        <div class="chat-messages-body" #messageScrollContainer>
          <div class="messages-list">
            <div *ngFor="let msg of messages" class="message-wrapper" [class.mine]="msg.sender === 'USER'">
              <div class="message-bubble" [class.ai-bubble]="msg.sender === 'AI'" [class.user-bubble]="msg.sender === 'USER'">
                <div class="meta-info">
                  <span class="sender">{{ msg.sender === 'USER' ? 'You' : 'Volant AI' }}</span>
                  <span class="time">{{ formatTime(msg.timestamp) }}</span>
                </div>
                <div class="text" [innerHTML]="formatMessageText(msg.messageText)"></div>
              </div>
            </div>

            <!-- Typing Indicator -->
            <div class="message-wrapper" *ngIf="typing">
              <div class="message-bubble ai-bubble typing-bubble">
                <span class="dot"></span>
                <span class="dot"></span>
                <span class="dot"></span>
              </div>
            </div>
          </div>
        </div>

        <!-- Quick FAQs Options -->
        <div class="quick-replies-row" *ngIf="messages.length > 0 && !typing">
          <button class="reply-tag" (click)="sendQuickReply('I want to fly from Tokyo to London next Friday')">✈️ Book Tokyo to London</button>
          <button class="reply-tag" (click)="sendQuickReply('Show me the cheapest flight')">💵 Cheapest Flight</button>
          <button class="reply-tag" (click)="sendQuickReply('What is the baggage policy?')">🎒 Baggage Rules</button>
          <button class="reply-tag" (click)="sendQuickReply('Is my payment secure?')">🔒 Secure Payments</button>
        </div>

        <!-- Input Form -->
        <div class="chat-input-footer">
          <input 
            type="text" 
            [(ngModel)]="userInput" 
            (keydown.enter)="sendMessage()" 
            placeholder="Ask me to book a flight or explain policies..." 
            class="chat-input"
            [disabled]="typing">
          <button class="btn btn-primary send-btn" (click)="sendMessage()" [disabled]="!userInput.trim() || typing">
            Send
          </button>
        </div>
      </ng-container>

      <!-- Recent Tab Content -->
      <div class="recent-tab-body" *ngIf="activeTab === 'recent'">
        <div class="section-title-widget">Current Conversation</div>
        <div class="current-session-card glass-card">
          <div class="session-info">
            <span class="session-label">Session ID:</span>
            <span class="session-value">{{ sessionId }}</span>
          </div>
          <div class="session-info">
            <span class="session-label">Messages Exchanged:</span>
            <span class="session-value">{{ messages.length }}</span>
          </div>
          <div class="session-card-actions" style="margin-top: 8px;">
            <button class="btn btn-primary download-btn-w" (click)="downloadChat(sessionId, messages)">
              📥 Download Chat
            </button>
            <button class="btn btn-secondary download-btn-w" (click)="startNewSession()">
              ➕ New Chat
            </button>
          </div>
        </div>

        <div class="section-title-widget">Past Conversations</div>
        
        <div class="loading-indicator" *ngIf="loadingSessions">
          <span class="spinner-sm"></span> Loading past sessions...
        </div>

        <div class="empty-sessions" *ngIf="!loadingSessions && getFilteredRecentSessions().length === 0">
          <p>No past conversations found. Your sessions will sync when logged in.</p>
        </div>

        <div class="sessions-list" *ngIf="!loadingSessions && getFilteredRecentSessions().length > 0">
          <div class="past-session-card glass-card" *ngFor="let sess of getFilteredRecentSessions()">
            <div class="session-card-header">
              <span class="sess-date">🕒 {{ formatDateTime(sess.createdAt) }}</span>
              <span class="sess-state-badge">{{ sess.currentState }}</span>
            </div>
            <div class="sess-summary">
              <strong>Topic:</strong> {{ getContextSummary(sess.contextData) }}
            </div>
            <div class="session-card-actions">
              <button class="btn btn-secondary btn-sm-widget" (click)="restoreSession(sess.sessionId)" title="Restore this chat">
                💬 Restore
              </button>
              <button class="btn btn-secondary btn-sm-widget" (click)="downloadPastChat(sess.sessionId)" title="Download chat history">
                📥 Download
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    /* Bubble Trigger */
    .ai-bubble-trigger {
      position: fixed;
      bottom: 24px;
      right: 24px;
      width: 65px;
      height: 65px;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--primary, #3b82f6) 0%, var(--accent, #8b5cf6) 100%);
      box-shadow: 0 8px 30px var(--primary-glow);
      z-index: 1000;
      cursor: pointer;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      border: 1px solid rgba(255,255,255,0.25);
      transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }
    .ai-bubble-trigger:hover {
      transform: scale(1.1) rotate(5deg);
    }
    .bubble-logo-img {
      width: 48px;
      height: 48px;
      object-fit: contain;
      filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.15));
    }

    /* Main Chat Container */
    .ai-chat-container {
      position: fixed;
      bottom: 24px;
      right: 24px;
      width: 400px;
      height: 600px;
      border-radius: 16px;
      z-index: 1001;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      background: var(--glass-bg);
      border: 1px solid var(--glass-border);
      box-shadow: 0 15px 50px rgba(0, 0, 0, 0.15);
      animation: openChat 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }
    @keyframes openChat {
      from { transform: scale(0.8) translateY(50px); opacity: 0; }
      to { transform: scale(1) translateY(0); opacity: 1; }
    }

    /* Full-Screen Mode overlay adjustments */
    .ai-chat-container.full-screen {
      position: fixed;
      top: 80px;
      left: 24px;
      right: 24px;
      bottom: 24px;
      width: calc(100vw - 48px);
      height: calc(100vh - 104px);
      border-radius: 20px;
      backdrop-filter: blur(24px);
      -webkit-backdrop-filter: blur(24px);
    }

    /* Header */
    .chat-header {
      padding: 16px 20px;
      background: var(--primary-glow);
      border-bottom: 1px solid var(--glass-border);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .header-info {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .header-logo-img {
      width: 34px;
      height: 34px;
      object-fit: contain;
      border-radius: 6px;
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid var(--glass-border);
      padding: 4px;
    }
    .chat-header .title {
      font-family: var(--font-title);
      font-size: 0.98rem;
      font-weight: 700;
      color: var(--text-primary);
    }
    .chat-header .subtitle {
      font-size: 0.75rem;
      color: var(--text-muted);
    }
    .header-actions {
      display: flex;
      gap: 8px;
    }
    .icon-btn {
      background: transparent;
      border: none;
      color: var(--text-secondary);
      font-size: 1.1rem;
      cursor: pointer;
      width: 28px;
      height: 28px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: var(--transition-fast);
    }
    .icon-btn:hover {
      background: rgba(255,255,255,0.08);
      color: var(--text-primary);
    }
    .close-btn {
      font-size: 1.5rem;
    }

    /* Tabs System */
    .chat-tabs {
      display: flex;
      background: rgba(255, 255, 255, 0.02);
      border-bottom: 1px solid var(--glass-border);
    }
    .tab-link {
      flex: 1;
      background: transparent;
      border: none;
      padding: 12px;
      font-size: 0.85rem;
      font-family: var(--font-title);
      font-weight: 600;
      color: var(--text-secondary);
      cursor: pointer;
      text-align: center;
      transition: var(--transition-fast);
      outline: none;
    }
    .tab-link:hover {
      background: rgba(255, 255, 255, 0.05);
      color: var(--text-primary);
    }
    .tab-link.active {
      color: var(--primary);
      border-bottom: 2px solid var(--primary);
      background: rgba(255, 255, 255, 0.03);
    }

    /* Messages Body */
    .chat-messages-body {
      flex: 1;
      padding: 20px;
      overflow-y: auto;
      background: rgba(255, 255, 255, 0.01);
    }
    .messages-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .message-wrapper {
      display: flex;
      width: 100%;
    }
    .message-wrapper.mine {
      justify-content: flex-end;
    }
    .message-bubble {
      max-width: 85%;
      padding: 12px 16px;
      border-radius: 16px;
      line-height: 1.45;
      font-size: 0.88rem;
    }
    .ai-bubble {
      background: var(--bg-secondary);
      border: 1px solid var(--glass-border);
      color: var(--text-primary);
      border-radius: 16px 16px 16px 4px;
    }
    .user-bubble {
      background: var(--primary);
      color: #ffffff;
      border-radius: 16px 16px 4px 16px;
    }
    .meta-info {
      display: flex;
      justify-content: space-between;
      font-size: 0.68rem;
      margin-bottom: 6px;
      opacity: 0.75;
      gap: 12px;
    }
    .meta-info .sender {
      font-weight: 700;
    }
    .text {
      word-break: break-word;
    }

    /* Markdown styling inside bubbles */
    .text ::ng-deep h3 {
      font-size: 0.98rem;
      margin: 8px 0 6px 0;
      color: var(--primary);
    }
    .text ::ng-deep ul {
      margin: 6px 0;
      padding-left: 16px;
    }
    .text ::ng-deep li {
      margin-bottom: 4px;
    }
    .text ::ng-deep a {
      color: var(--accent);
      text-decoration: underline;
      font-weight: 600;
    }
    .text ::ng-deep .btn-ai-nav {
      display: inline-block;
      margin-top: 8px;
      padding: 6px 12px;
      background: var(--primary);
      color: #fff !important;
      border-radius: 6px;
      text-decoration: none !important;
      font-size: 0.82rem;
      font-weight: 700;
      cursor: pointer;
    }

    /* Typing indicators */
    .typing-bubble {
      display: flex;
      gap: 4px;
      padding: 12px 20px;
    }
    .dot {
      width: 8px;
      height: 8px;
      background: var(--text-muted);
      border-radius: 50%;
      animation: bounceDot 1.4s infinite ease-in-out both;
    }
    .dot:nth-child(1) { animation-delay: -0.32s; }
    .dot:nth-child(2) { animation-delay: -0.16s; }
    @keyframes bounceDot {
      0%, 80%, 100% { transform: scale(0); }
      40% { transform: scale(1.0); }
    }

    /* Quick FAQ replies */
    .quick-replies-row {
      display: flex;
      gap: 8px;
      padding: 8px 16px;
      overflow-x: auto;
      border-top: 1px solid var(--glass-border);
      background: rgba(255,255,255,0.01);
    }
    .reply-tag {
      background: rgba(255,255,255,0.04);
      border: 1px solid var(--glass-border);
      color: var(--text-secondary);
      padding: 6px 12px;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 600;
      cursor: pointer;
      white-space: nowrap;
      transition: var(--transition-fast);
    }
    .reply-tag:hover {
      background: var(--primary-glow);
      color: var(--primary);
      border-color: var(--primary);
    }

    /* Input Footer */
    .chat-input-footer {
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
      background: rgba(255,255,255,0.8);
      color: var(--text-primary);
      outline: none;
      font-size: 0.88rem;
    }
    .chat-input:focus {
      border-color: var(--primary);
      background: #fff;
    }
    .send-btn {
      padding: 10px 18px;
      font-size: 0.88rem;
      height: 38px;
    }

    /* Recent Tab Styles */
    .recent-tab-body {
      flex: 1;
      padding: 20px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 16px;
      background: rgba(255, 255, 255, 0.01);
    }
    .section-title-widget {
      font-family: var(--font-title);
      font-size: 0.85rem;
      font-weight: 700;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 4px;
    }
    .glass-card {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid var(--glass-border);
      border-radius: 12px;
      padding: 14px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .current-session-card {
      border-left: 3px solid var(--primary);
    }
    .session-info {
      display: flex;
      justify-content: space-between;
      font-size: 0.8rem;
    }
    .session-label {
      color: var(--text-muted);
    }
    .session-value {
      font-family: monospace;
      color: var(--text-primary);
      font-weight: 600;
    }
    .download-btn-w {
      flex: 1;
      padding: 8px;
      font-size: 0.85rem;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      height: 34px;
    }
    .sessions-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .past-session-card {
      transition: transform 0.2s ease, border-color 0.2s ease;
    }
    .past-session-card:hover {
      transform: translateY(-1px);
      border-color: rgba(255, 255, 255, 0.15);
    }
    .session-card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .sess-date {
      font-size: 0.78rem;
      color: var(--text-secondary);
      font-weight: 600;
    }
    .sess-state-badge {
      font-size: 0.65rem;
      font-weight: 700;
      padding: 2px 6px;
      border-radius: 4px;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid var(--glass-border);
      color: var(--text-muted);
      text-transform: uppercase;
    }
    .sess-summary {
      font-size: 0.82rem;
      color: var(--text-primary);
      background: rgba(255,255,255,0.01);
      padding: 6px 8px;
      border-radius: 6px;
    }
    .session-card-actions {
      display: flex;
      gap: 8px;
      margin-top: 4px;
    }
    .btn-sm-widget {
      flex: 1;
      padding: 6px 10px;
      font-size: 0.78rem;
      height: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 4px;
    }
    .loading-indicator {
      font-size: 0.85rem;
      color: var(--text-muted);
      text-align: center;
      padding: 20px;
    }
    .empty-sessions {
      font-size: 0.82rem;
      color: var(--text-muted);
      text-align: center;
      padding: 24px;
      background: rgba(255,255,255,0.01);
      border-radius: 12px;
      border: 1px dashed var(--glass-border);
    }
    .spinner-sm {
      display: inline-block;
      width: 12px;
      height: 12px;
      border: 2px solid rgba(255,255,255,0.1);
      border-radius: 50%;
      border-top-color: var(--primary);
      animation: spin 0.8s linear infinite;
      margin-right: 6px;
      vertical-align: middle;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `]
})
export class AIAssistantWidgetComponent implements OnInit, AfterViewChecked {
  @ViewChild('messageScrollContainer') private scrollContainer!: ElementRef;

  displayMode: 'hidden' | 'window' | 'fullscreen' = 'hidden';
  messages: AIMessage[] = [];
  userInput = '';
  typing = false;
  sessionId = '';

  activeTab: 'chat' | 'recent' = 'chat';
  recentSessions: any[] = [];
  loadingSessions = false;

  constructor(
    private aiService: AIAssistantService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.sessionId = localStorage.getItem('aiSessionId') || '';
    if (!this.sessionId) {
      this.sessionId = 'session_' + Math.random().toString(36).substring(2, 15);
      localStorage.setItem('aiSessionId', this.sessionId);
    }

    this.loadChatHistory();

    // Register navigation listener for dynamic AI links
    window.addEventListener('ai-navigate', (event: any) => {
      const targetPath = event.detail;
      if (targetPath) {
        this.displayMode = 'window';
        this.router.navigateByUrl(targetPath);
      }
    });
  }

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  setDisplayMode(mode: 'hidden' | 'window' | 'fullscreen'): void {
    this.displayMode = mode;
    if (mode !== 'hidden' && this.messages.length === 0) {
      this.resetChat();
    }
  }

  loadChatHistory(): void {
    this.aiService.getChatHistory(this.sessionId).subscribe({
      next: (data) => {
        this.messages = data;
        this.scrollToBottom();
      },
      error: (err) => console.error('Failed to load AI chat history', err)
    });
  }

  sendMessage(): void {
    const text = this.userInput.trim();
    if (!text) return;

    this.userInput = '';
    
    // Add user message locally for responsiveness
    this.messages.push({
      sessionId: this.sessionId,
      sender: 'USER',
      messageText: text,
      timestamp: new Date().toISOString()
    });
    this.scrollToBottom();

    this.typing = true;

    // Simulate typing delay for realistic interaction
    setTimeout(() => {
      this.aiService.sendMessage(this.sessionId, text).subscribe({
        next: (data) => {
          this.messages = data;
          this.typing = false;
          this.scrollToBottom();
        },
        error: (err) => {
          console.error('Failed to fetch AI response', err);
          this.typing = false;
        }
      });
    }, 1200);
  }

  sendQuickReply(text: string): void {
    this.userInput = text;
    this.sendMessage();
  }

  resetChat(): void {
    this.typing = true;
    this.aiService.resetSession(this.sessionId).subscribe({
      next: (data) => {
        this.messages = data;
        this.typing = false;
        this.scrollToBottom();
      },
      error: (err) => {
        console.error('Failed to reset AI session', err);
        this.typing = false;
      }
    });
  }

  formatTime(dateStr?: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  formatMessageText(text: string): string {
    if (!text) return '';
    // Format bold headers
    let formatted = text.replace(/###\s+(.*)/g, '<h3>$1</h3>');
    // Format bold text
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Format markdown links to router-navigation calls
    // Format `[Proceed to Payment](/payment/VOL-XXXX)` to a styled button link
    const linkRegex = /\[(.*?)\]\(\/(.*?)\)/g;
    formatted = formatted.replace(linkRegex, (match, linkText, path) => {
      return `<a class="btn-ai-nav" href="javascript:void(0)" onclick="window.dispatchEvent(new CustomEvent('ai-navigate', {detail: '/${path}'}))">${linkText}</a>`;
    });

    // Support formatting lists
    formatted = formatted.replace(/^\s*\*\s+(.*)/gm, '<li>$1</li>');
    formatted = formatted.replace(/^\s*-\s+(.*)/gm, '<li>$1</li>');
    
    return formatted;
  }

  setWidgetTab(tab: 'chat' | 'recent'): void {
    this.activeTab = tab;
    if (tab === 'recent') {
      this.loadUserSessions();
    }
  }

  loadUserSessions(): void {
    this.loadingSessions = true;
    this.aiService.getUserSessions().subscribe({
      next: (data) => {
        this.recentSessions = data;
        this.loadingSessions = false;
      },
      error: (err) => {
        console.error('Failed to load user AI sessions', err);
        this.loadingSessions = false;
      }
    });
  }

  getFilteredRecentSessions(): any[] {
    return this.recentSessions.filter(s => s.sessionId !== this.sessionId);
  }

  getContextSummary(contextJson: string): string {
    try {
      const ctx = JSON.parse(contextJson || '{}');
      if (ctx.bookingReference) {
        return `Manage Booking: ${ctx.bookingReference}`;
      }
      if (ctx.origin && ctx.destination) {
        return `Flight Search: ${ctx.origin} ➔ ${ctx.destination}`;
      }
      if (ctx.origin) {
        return `Flight Search from ${ctx.origin}`;
      }
      return 'General Travel Query';
    } catch (e) {
      return 'Travel Query';
    }
  }

  formatDateTime(dateStr?: string): string {
    if (!dateStr) return 'Unknown Date';
    const date = new Date(dateStr);
    return date.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  downloadChat(sessionId: string, msgs: AIMessage[]): void {
    if (!msgs || msgs.length === 0) {
      alert('There is no conversation history to download.');
      return;
    }

    let fileContent = `==================================================\n`;
    fileContent += `VOLANT AI ASSISTANT CHAT HISTORY\n`;
    fileContent += `Session: ${sessionId}\n`;
    fileContent += `Exported: ${new Date().toLocaleString()}\n`;
    fileContent += `==================================================\n\n`;

    msgs.forEach(msg => {
      const timeStr = this.formatTime(msg.timestamp) || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const senderName = msg.sender === 'USER' ? 'You' : 'Volant AI';
      fileContent += `[${timeStr}] ${senderName}:\n`;
      fileContent += `${msg.messageText}\n`;
      fileContent += `--------------------------------------------------\n`;
    });

    const blob = new Blob([fileContent], { type: 'text/plain;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `volant-ai-chat-${sessionId}.txt`;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  downloadPastChat(pastSessionId: string): void {
    this.aiService.getChatHistory(pastSessionId).subscribe({
      next: (msgs) => {
        this.downloadChat(pastSessionId, msgs);
      },
      error: (err) => {
        console.error('Failed to load past chat history for download', err);
        alert('Could not download past conversation history. Please try again.');
      }
    });
  }

  restoreSession(pastSessionId: string): void {
    this.sessionId = pastSessionId;
    localStorage.setItem('aiSessionId', pastSessionId);
    this.loadChatHistory();
    this.activeTab = 'chat';
  }

  startNewSession(): void {
    this.sessionId = 'session_' + Math.random().toString(36).substring(2, 15);
    localStorage.setItem('aiSessionId', this.sessionId);
    this.resetChat();
    this.activeTab = 'chat';
  }

  private scrollToBottom(): void {
    try {
      this.scrollContainer.nativeElement.scrollTop = this.scrollContainer.nativeElement.scrollHeight;
    } catch (err) {}
  }
}
