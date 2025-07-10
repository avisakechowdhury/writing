import { io, Socket } from 'socket.io-client';

class SocketService {
  private socket: Socket | null = null;
  private token: string | null = null;
  private isConnecting: boolean = false;
  private messageListeners: Set<Function> = new Set();

  connect(token: string) {
    // Prevent multiple connections
    if (this.socket?.connected || this.isConnecting) {
      return this.socket;
    }

    this.isConnecting = true;
    this.token = token;
    
    this.socket = io(import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000', {
      auth: {
        token: token
      },
      forceNew: true,
      transports: ['websocket', 'polling']
    });

    this.socket.on('connect', () => {
      console.log('Connected to server');
      this.isConnecting = false;
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from server');
      this.isConnecting = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      this.isConnecting = false;
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      // Clear all listeners
      this.messageListeners.clear();
      this.socket.disconnect();
      this.socket = null;
      this.isConnecting = false;
    }
  }

  getSocket() {
    return this.socket;
  }

  // Chat methods
  sendMessage(content: string, room: string = 'general') {
    if (this.socket?.connected) {
      this.socket.emit('send_message', { content, room });
    }
  }

  onMessage(callback: (message: any) => void) {
    if (this.socket) {
      this.socket.on('receive_message', callback);
    }
  }

  offMessage() {
    if (this.socket) {
      this.socket.off('receive_message');
    }
  }

  // Direct messaging methods
  sendDirectMessage(receiverId: string, content: string) {
    if (this.socket?.connected) {
      this.socket.emit('send_direct_message', { receiverId, content });
    }
  }

  onDirectMessage(callback: (message: any) => void) {
    if (this.socket) {
      // Store callback reference to prevent duplicates
      if (this.messageListeners.has(callback)) {
        return;
      }
      
      this.messageListeners.add(callback);
      this.socket.on('receive_direct_message', callback);
    }
  }

  offDirectMessage() {
    if (this.socket) {
      this.messageListeners.clear();
      this.socket.off('receive_direct_message');
    }
  }

  // Typing indicators
  startTyping(receiverId: string) {
    if (this.socket?.connected) {
      this.socket.emit('typing_start', { receiverId });
    }
  }

  stopTyping(receiverId: string) {
    if (this.socket?.connected) {
      this.socket.emit('typing_stop', { receiverId });
    }
  }

  onTyping(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on('user_typing', callback);
    }
  }

  onStoppedTyping(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on('user_stopped_typing', callback);
    }
  }

  // Join/leave rooms
  joinRoom(room: string) {
    if (this.socket?.connected) {
      this.socket.emit('join_room', room);
    }
  }

  leaveRoom(room: string) {
    if (this.socket?.connected) {
      this.socket.emit('leave_room', room);
    }
  }
}

export const socketService = new SocketService();
export default socketService;