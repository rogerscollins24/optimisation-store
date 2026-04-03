type MessageHandler = (message: any) => void;
type ConnectionHandler = () => void;

class SupportSocket {
  private socket: WebSocket | null = null;
  private url: string;
  private token: string;
  private messageHandlers: MessageHandler[] = [];
  private connectionHandlers: ConnectionHandler[] = [];
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000;
  private intentionalClose = false;

  constructor(token: string) {
    this.token = token;
    const configuredApiUrl = (import.meta.env.VITE_API_URL as string | undefined)?.trim();
    if (configuredApiUrl) {
      const apiUrl = new URL(configuredApiUrl);
      const wsProtocol = apiUrl.protocol === 'https:' ? 'wss:' : 'ws:';
      this.url = `${wsProtocol}//${apiUrl.host}/api/support/ws`;
      return;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    this.url = `${protocol}//${window.location.host}/api/support/ws`;
  }

  connect(ticketId: number): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.intentionalClose = false;
        this.socket = new WebSocket(`${this.url}?ticket_id=${ticketId}&token=${this.token}`);

        this.socket.onopen = () => {
          this.reconnectAttempts = 0;
          this.connectionHandlers.forEach((handler) => handler());
          resolve();
        };

        this.socket.onmessage = (event) => {
          const payload = JSON.parse(event.data);
          this.messageHandlers.forEach((handler) => handler(payload));
        };

        this.socket.onerror = (event) => {
          reject(event);
        };

        this.socket.onclose = () => {
          if (this.intentionalClose) return;
          if (this.reconnectAttempts >= this.maxReconnectAttempts) return;

          this.reconnectAttempts += 1;
          window.setTimeout(() => {
            if (this.intentionalClose) return;
            this.connect(ticketId).catch(() => undefined);
          }, this.reconnectDelay);
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  send(content: string): void {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({ content }));
    }
  }

  onMessage(handler: MessageHandler): () => void {
    this.messageHandlers.push(handler);
    return () => {
      this.messageHandlers = this.messageHandlers.filter((item) => item !== handler);
    };
  }

  onConnect(handler: ConnectionHandler): () => void {
    this.connectionHandlers.push(handler);
    return () => {
      this.connectionHandlers = this.connectionHandlers.filter((item) => item !== handler);
    };
  }

  disconnect(): void {
    this.intentionalClose = true;
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.messageHandlers = [];
    this.connectionHandlers = [];
  }

  isConnected(): boolean {
    return this.socket?.readyState === WebSocket.OPEN;
  }
}

export default SupportSocket;
