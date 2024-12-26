import dgram from 'react-native-udp';
import { EventEmitter } from 'events';

class UdpService extends EventEmitter {
  constructor() {
    super();
    this.socket = null;
    this.droneIP = null;
    this.port = 50000;
    this.isConnected = false;
    this.connectionTimeout = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.lastCommandTime = Date.now();
  }

  formatJoystickValue(value) {
    const mapped = Math.floor(((value + 1) / 2) * 1000) + 1000;
    return Math.min(2000, Math.max(1000, mapped)).toString().padStart(4, '0');
  }

  async connect(ip) {
    try {
      // Clear any existing connection
      this.disconnect();
      
      this.droneIP = ip;
      this.reconnectAttempts = 0;
      
      await this.createSocket();
      
      // Start connection monitoring
      this.startConnectionMonitoring();
      
      return true;
    } catch (error) {
      console.error('UDP Connection Error:', error);
      this.emit('error', 'Failed to connect to drone');
      return false;
    }
  }

  async createSocket() {
    return new Promise((resolve, reject) => {
      try {
        this.socket = dgram.createSocket({
          type: 'udp4',
          debug: __DEV__
        });

        this.socket.bind(0);  // Bind to any available port

        this.socket.once('listening', () => {
          console.log('UDP Service listening');
          this.isConnected = true;
          this.emit('connected');
          resolve();
        });

        this.socket.on('error', (err) => {
          console.error('UDP Socket Error:', err);
          this.emit('error', 'Connection error');
          this.handleConnectionError();
        });

      } catch (error) {
        reject(error);
      }
    });
  }

  startConnectionMonitoring() {
    // Clear any existing monitoring
    if (this.connectionTimeout) {
      clearInterval(this.connectionTimeout);
    }

    // Monitor connection status every 2 seconds
    this.connectionTimeout = setInterval(() => {
      const timeSinceLastCommand = Date.now() - this.lastCommandTime;
      
      // If no commands sent for 5 seconds, consider connection lost
      if (timeSinceLastCommand > 5000 && this.isConnected) {
        this.handleConnectionError();
      }
    }, 2000);
  }

  async handleConnectionError() {
    this.isConnected = false;
    this.emit('disconnected');

    // Attempt to reconnect if within retry limit
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      try {
        await this.connect(this.droneIP);
      } catch (error) {
        console.error('Reconnection failed:', error);
      }
    } else {
      this.emit('error', 'Maximum reconnection attempts reached');
    }
  }

  sendCommand(leftX, leftY, rightX, rightY) {
    if (!this.socket || !this.droneIP || !this.isConnected) {
      console.warn('UDP Service not connected');
      return false;
    }

    try {
      const command = 
        this.formatJoystickValue(leftX) +
        this.formatJoystickValue(leftY) +
        this.formatJoystickValue(rightX) +
        this.formatJoystickValue(rightY);

      const message = Buffer.from(command);

      this.socket.send(
        message,
        0,
        message.length,
        this.port,
        this.droneIP,
        (err) => {
          if (err) {
            console.error('Send Error:', err);
            this.handleConnectionError();
            return false;
          }
          
          this.lastCommandTime = Date.now();
          return true;
        }
      );
    } catch (error) {
      console.error('Command Send Error:', error);
      this.handleConnectionError();
      return false;
    }
  }

  disconnect() {
    this.isConnected = false;
    
    if (this.connectionTimeout) {
      clearInterval(this.connectionTimeout);
      this.connectionTimeout = null;
    }
    
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    
    this.droneIP = null;
    this.reconnectAttempts = 0;
    this.emit('disconnected');
  }
}

export default new UdpService(); 