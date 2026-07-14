import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject, interval, Subscription } from 'rxjs';
import { startWith, switchMap } from 'rxjs/operators';
import { ChatMessage } from '../models/support.model';
import { API_BASE, WS_BASE } from '../config/api.config';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private socket: WebSocket | null = null;
  private messageSubject = new Subject<ChatMessage>();
  public messages$: Observable<ChatMessage> = this.messageSubject.asObservable();
  
  private historyUrl = `${API_BASE}/api/chat/history`;
  private pollingSubscription: Subscription | null = null;

  constructor(private http: HttpClient) {}

  // Fetch past messages via REST
  getChatHistory(bookingRef: string): Observable<ChatMessage[]> {
    return this.http.get<ChatMessage[]>(`${this.historyUrl}/${bookingRef}`);
  }

  // Connect to native WebSocket channel
  connect(bookingRef: string): void {
    this.disconnect();

    const wsUrl = `${WS_BASE}/chat-socket?bookingRef=${bookingRef}`;
    logInfo('Connecting to Chat WebSocket:', wsUrl);

    try {
      this.socket = new WebSocket(wsUrl);

      this.socket.onmessage = (event) => {
        try {
          const message: ChatMessage = JSON.parse(event.data);
          this.messageSubject.next(message);
        } catch (e) {
          console.error('Failed to parse WebSocket message data', e);
        }
      };

      this.socket.onerror = (error) => {
        console.error('WebSocket Error encountered, switching to fallback polling', error);
        this.startFallbackPolling(bookingRef);
      };

      this.socket.onclose = (event) => {
        logInfo('WebSocket Connection closed:', event.reason);
        if (!event.wasClean) {
          this.startFallbackPolling(bookingRef);
        }
      };
    } catch (err) {
      console.error('Failed to establish WebSocket connection, polling initialized', err);
      this.startFallbackPolling(bookingRef);
    }
  }

  // Send message through active socket
  sendMessage(message: ChatMessage): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket is not open. Mock sending message locally.');
      // Locally push message into subject as fallback
      this.messageSubject.next(message);
    }
  }

  // Close connection
  disconnect(): void {
    if (this.pollingSubscription) {
      this.pollingSubscription.unsubscribe();
      this.pollingSubscription = null;
    }
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }

  // Fallback Polling if WebSocket is blocked or disconnected
  private startFallbackPolling(bookingRef: string): void {
    if (this.pollingSubscription) return;

    logInfo('Fallback polling started for chat history.');
    // Poll every 3 seconds
    this.pollingSubscription = interval(3000)
      .pipe(
        startWith(0),
        switchMap(() => this.getChatHistory(bookingRef))
      )
      .subscribe({
        next: (messages) => {
          // Push only new messages to UI
          messages.forEach(msg => this.messageSubject.next(msg));
        },
        error: (err) => console.error('Chat history polling failed', err)
      });
  }
}

// Simple internal logger helper
function logInfo(...args: any[]): void {
  console.log('[ChatService]', ...args);
}
