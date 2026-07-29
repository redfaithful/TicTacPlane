import {Injectable} from '@angular/core';
import {Observable, Subject} from 'rxjs';

import {environment} from '../../environments/environment';
import {ClientMessage, ServerMessage} from './online.protocol';

/**
 * Thin wrapper around the browser WebSocket for the multiplayer backend.
 * Emits parsed server messages and connection-lifecycle events.
 */
@Injectable({providedIn: 'root'})
export class OnlineService {
  private socket?: WebSocket;
  private readonly messages = new Subject<ServerMessage>();
  private readonly connectionState = new Subject<'open' | 'closed' | 'error'>();
  private outbox: ClientMessage[] = [];

  get messages$(): Observable<ServerMessage> {
    return this.messages.asObservable();
  }

  get connection$(): Observable<'open' | 'closed' | 'error'> {
    return this.connectionState.asObservable();
  }

  connect(): void {
    if (
      this.socket &&
      (this.socket.readyState === WebSocket.OPEN ||
        this.socket.readyState === WebSocket.CONNECTING)
    ) {
      return;
    }

    const socket = new WebSocket(this.resolveUrl());
    this.socket = socket;

    socket.onopen = () => {
      this.connectionState.next('open');
      const queued = this.outbox;
      this.outbox = [];
      for (const message of queued) {
        this.send(message);
      }
    };

    socket.onmessage = event => {
      try {
        this.messages.next(JSON.parse(event.data as string) as ServerMessage);
      } catch {
        // Ignore malformed frames.
      }
    };

    socket.onerror = () => this.connectionState.next('error');
    socket.onclose = () => this.connectionState.next('closed');
  }

  send(message: ClientMessage): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message));
    } else {
      this.outbox.push(message);
      this.connect();
    }
  }

  disconnect(): void {
    this.outbox = [];
    this.socket?.close();
    this.socket = undefined;
  }

  private resolveUrl(): string {
    if (environment.wsUrl) {
      return environment.wsUrl;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    return `${protocol}://${window.location.host}/ws`;
  }
}
