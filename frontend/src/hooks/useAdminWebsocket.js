import { useEffect, useState, useRef } from 'react';
import API_BASE_URL from '../services/apiConfig';

export const useAdminWebsocket = (onAlertReceived) => {
    const [isConnected, setIsConnected] = useState(false);
    const wsRef = useRef(null);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) return;

        // Convert http/https to ws/wss
        const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';

        // Convert base http/https API URL to ws/wss natively
        let wsUrlBase = API_BASE_URL.replace('http://', 'ws://').replace('https://', 'wss://');

        // Remove trailing /api/v1 if it exists so we can cleanly append the websocket route
        if (wsUrlBase.endsWith('/api/v1')) {
            wsUrlBase = wsUrlBase.slice(0, -7);
        }

        const wsUrl = `${wsUrlBase}/api/v1/admin/ws/alerts?token=${token}`;

        console.log("Connecting to Admin WS:", wsUrl);
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
            console.log('Admin WebSocket Connected');
            setIsConnected(true);
        };

        ws.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                if (message.type === 'new_alert' && onAlertReceived) {
                    onAlertReceived(message.data);
                }
            } catch (err) {
                console.error("Failed to parse WS message:", err);
            }
        };

        ws.onclose = () => {
            console.log('Admin WebSocket Disconnected');
            setIsConnected(false);
            // Optionally implement reconnection logic here
        };

        ws.onerror = (error) => {
            console.error('WebSocket Error:', error);
        };

        return () => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.close();
            }
        };
    }, []); // Only connect once on mount

    return { isConnected };
};
