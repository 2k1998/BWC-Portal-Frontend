// src/context/NotificationContext.jsx
import React, { createContext, useContext, useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid'; // For unique IDs (install below)

// Create the context
const NotificationContext = createContext(null);

// Custom hook to easily consume the notification context
export const useNotification = () => {
    const context = useContext(NotificationContext);
    if (context === undefined) {
        throw new Error('useNotification must be used within a NotificationProvider');
    }
    return context;
};

// Lightweight sound using WebAudio (no asset needed)
function playNotificationTone() {
    try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        const oscillator = ctx.createOscillator();
        const gain = ctx.createGain();
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(880, ctx.currentTime); // A5
        gain.gain.setValueAtTime(0.0001, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.06, ctx.currentTime + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.5);
        oscillator.connect(gain).connect(ctx.destination);
        oscillator.start();
        oscillator.stop(ctx.currentTime + 0.5);
        // Close context after sound to free resources
        setTimeout(() => ctx.close(), 700);
    } catch (e) {
        // Silently ignore audio issues
    }
}

async function maybeShowNativeNotification(message) {
    try {
        if (!('Notification' in window)) return;
        // Request permission lazily
        let permission = Notification.permission;
        if (permission === 'default') {
            permission = await Notification.requestPermission();
        }
        if (permission === 'granted') {
            const icon = '/brand-logo.png'; // fall back to project logo in public/
            new Notification('BWC Portal', { body: message, icon });
        }
    } catch (e) {
        // Ignore
    }
}

// Provider component
export const NotificationProvider = ({ children }) => {
    const [notifications, setNotifications] = useState([]);

    // Function to show a new notification
    // type: 'success', 'error', 'info', 'warning'
    // message: The text to display
    // duration: How long it should stay (ms), 0 for persistent
    const showNotification = useCallback((message, type = 'info', duration = 3000) => {
        const id = uuidv4(); // Generate a unique ID for each notification
        const newNotification = { id, message, type };
        setNotifications((prevNotifications) => [...prevNotifications, newNotification]);

        // Side effects: sound + native notification
        playNotificationTone();
        maybeShowNativeNotification(message);

        if (duration > 0) {
            setTimeout(() => {
                removeNotification(id);
            }, duration);
        }
    }, []); // No dependencies for showNotification itself

    // Function to remove a notification by ID
    const removeNotification = useCallback((id) => {
        setNotifications((prevNotifications) =>
            prevNotifications.filter((notification) => notification.id !== id)
        );
    }, []); // No dependencies for removeNotification itself

    const value = {
        notifications,
        showNotification,
        removeNotification,
    };

    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    );
};