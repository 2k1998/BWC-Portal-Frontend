// src/context/NotificationContext.jsx
import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
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

// Single shared AudioContext unlocked on first user interaction
const audioState = {
    ctx: null,
    unlocked: false,
};

function ensureAudioUnlocked() {
    if (audioState.unlocked) return;
    try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        if (!audioState.ctx) {
            audioState.ctx = new AudioCtx();
        }
        // Create a short silent buffer to satisfy autoplay policies
        const buffer = audioState.ctx.createBuffer(1, 1, 22050);
        const source = audioState.ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(audioState.ctx.destination);
        source.start(0);
        audioState.unlocked = true;
    } catch (_) {
        // Ignore
    }
}

function playNotificationTone() {
    try {
        if (!audioState.unlocked) return; // Require prior user interaction
        const ctx = audioState.ctx;
        if (!ctx) return;
        const oscillator = ctx.createOscillator();
        const gain = ctx.createGain();
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(880, ctx.currentTime);
        gain.gain.setValueAtTime(0.0001, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.07, ctx.currentTime + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.4);
        oscillator.connect(gain).connect(ctx.destination);
        oscillator.start();
        oscillator.stop(ctx.currentTime + 0.4);
    } catch (_) {
        // Silently ignore audio issues
    }
}

async function maybeShowNativeNotification(message) {
    try {
        if (!('Notification' in window)) return;
        let permission = Notification.permission;
        if (permission === 'default' && document.visibilityState === 'visible') {
            // Ask permission when app is visible
            permission = await Notification.requestPermission();
        }
        if (permission === 'granted') {
            const icon = '/brand-logo.png';
            new Notification('BWC Portal', { body: message, icon });
        }
    } catch (_) {
        // Ignore
    }
}

// Provider component
export const NotificationProvider = ({ children }) => {
    const [notifications, setNotifications] = useState([]);
    const initializedRef = useRef(false);

    // Install a one-time global unlock handler so audio can play without refresh
    useEffect(() => {
        if (initializedRef.current) return;
        const unlock = () => {
            ensureAudioUnlocked();
            // After first interaction, we can remove listeners
            window.removeEventListener('pointerdown', unlock);
            window.removeEventListener('keydown', unlock);
            window.removeEventListener('touchstart', unlock);
        };
        window.addEventListener('pointerdown', unlock, { once: true });
        window.addEventListener('keydown', unlock, { once: true });
        window.addEventListener('touchstart', unlock, { once: true });
        initializedRef.current = true;
    }, []);

    // Prompt for notification permission when the tab becomes visible
    useEffect(() => {
        const onVisible = async () => {
            try {
                if ('Notification' in window && Notification.permission === 'default' && document.visibilityState === 'visible') {
                    await Notification.requestPermission();
                }
            } catch (_) {}
        };
        document.addEventListener('visibilitychange', onVisible);
        // Run once on mount
        onVisible();
        return () => document.removeEventListener('visibilitychange', onVisible);
    }, []);

    // Function to show a new notification
    // type: 'success', 'error', 'info', 'warning'
    // message: The text to display
    // duration: How long it should stay (ms), 0 for persistent
    const showNotification = useCallback((message, type = 'info', duration = 3000) => {
        const id = uuidv4();
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
    }, []);

    // Function to remove a notification by ID
    const removeNotification = useCallback((id) => {
        setNotifications((prevNotifications) =>
            prevNotifications.filter((notification) => notification.id !== id)
        );
    }, []);

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