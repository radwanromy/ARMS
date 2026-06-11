import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AIMessage } from '../models/support.model';

@Injectable({
  providedIn: 'root'
})
export class AIAssistantService {
  private apiUrl = 'http://localhost:8080/api/ai/chat';

  constructor(private http: HttpClient) {}

  sendMessage(sessionId: string, messageText: string): Observable<AIMessage[]> {
    return this.http.post<AIMessage[]>(`${this.apiUrl}/message`, { sessionId, messageText });
  }

  getChatHistory(sessionId: string): Observable<AIMessage[]> {
    return this.http.get<AIMessage[]>(`${this.apiUrl}/history/${sessionId}`);
  }

  resetSession(sessionId: string): Observable<AIMessage[]> {
    return this.http.post<AIMessage[]>(`${this.apiUrl}/reset?sessionId=${sessionId}`, {});
  }

  getUserSessions(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/sessions`);
  }
}
