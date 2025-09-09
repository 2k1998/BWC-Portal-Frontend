// src/services/websocketService.js - WebSocket service for real-time updates
class WebSocketService {
    constructor() {
        this.ws = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectInterval = 5000;
        this.listeners = new Map();
        this.isConnected = false;
        this.accessToken = null;
    }

    connect(accessToken) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            return;
        }

        this.accessToken = accessToken;
        const wsUrl = `${import.meta.env.VITE_API_BASE_URL || 'ws://localhost:8000'}/ws/${accessToken}`.replace('http', 'ws');
        
        try {
            this.ws = new WebSocket(wsUrl);
            
            this.ws.onopen = () => {
                this.isConnected = true;
                this.reconnectAttempts = 0;
                
                // Send ping to keep connection alive
                this.startHeartbeat();
            };

            this.ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    this.handleMessage(data);
                } catch (error) {
                    console.error('Error parsing WebSocket message:', error);
                }
            };

            this.ws.onclose = (event) => {
                this.isConnected = false;
                this.stopHeartbeat();
                
                // Attempt to reconnect if not a normal closure
                if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
                    setTimeout(() => {
                        this.reconnectAttempts++;
                        this.connect(this.accessToken);
                    }, this.reconnectInterval);
                }
            };

            this.ws.onerror = (error) => {
                console.error('WebSocket error:', error);
            };

        } catch (error) {
            console.error('Failed to create WebSocket connection:', error);
        }
    }

    disconnect() {
        this.stopHeartbeat();
        if (this.ws) {
            this.ws.close(1000, 'Manual disconnect');
            this.ws = null;
        }
        this.isConnected = false;
    }

    startHeartbeat() {
        this.heartbeatInterval = setInterval(() => {
            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                this.ws.send(JSON.stringify({ type: 'ping' }));
            }
        }, 30000); // Send ping every 30 seconds
    }

    stopHeartbeat() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
    }

    handleMessage(data) {
        // Emit to specific listeners based on message type
        const listeners = this.listeners.get(data.type) || [];
        listeners.forEach(callback => {
            try {
                callback(data);
            } catch (error) {
                console.error('Error in WebSocket listener:', error);
            }
        });

        // Also emit to 'all' listeners
        const allListeners = this.listeners.get('all') || [];
        allListeners.forEach(callback => {
            try {
                callback(data);
            } catch (error) {
                console.error('Error in WebSocket all listener:', error);
            }
        });
    }

    // Add event listener
    on(eventType, callback) {
        if (!this.listeners.has(eventType)) {
            this.listeners.set(eventType, []);
        }
        this.listeners.get(eventType).push(callback);

        // Return unsubscribe function
        return () => {
            const listeners = this.listeners.get(eventType);
            if (listeners) {
                const index = listeners.indexOf(callback);
                if (index > -1) {
                    listeners.splice(index, 1);
                }
            }
        };
    }

    // Remove event listener
    off(eventType, callback) {
        const listeners = this.listeners.get(eventType);
        if (listeners) {
            const index = listeners.indexOf(callback);
            if (index > -1) {
                listeners.splice(index, 1);
            }
        }
    }

    // Send message
    send(message) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(message));
        } else {
            console.warn('WebSocket is not connected. Cannot send message:', message);
        }
    }
}

// Create singleton instance
const websocketService = new WebSocketService();

export default websocketService;
