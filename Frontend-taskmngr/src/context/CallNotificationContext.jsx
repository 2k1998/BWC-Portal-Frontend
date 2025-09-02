import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import useAuth from './useAuth';
import { dailyCallApi } from '../api/apiService'; // Fixed: removed 's' from dailyCallsApi

const CallNotificationContext = createContext();

export const useCallNotification = () => useContext(CallNotificationContext);

export const CallNotificationProvider = ({ children }) => {
    const { accessToken, isAuthenticated } = useAuth();
    const [upcomingCall, setUpcomingCall] = useState(null);
    const [notifiedCallIds, setNotifiedCallIds] = useState(new Set());

    const checkUpcomingCalls = useCallback(async () => {
        if (!isAuthenticated || !accessToken) return;

        try {
            // Fixed: use correct function name
            const dailyCalls = await dailyCallApi.getMyDailyCalls(accessToken);
            const now = new Date();
            const thirtyMinutesFromNow = new Date(now.getTime() + 30 * 60000);

            for (const call of dailyCalls) {
                if (call.next_call_at) {
                    const callTime = new Date(call.next_call_at);
                    // Check if the call is within the next 30 minutes and hasn't been notified yet
                    if (callTime > now && callTime <= thirtyMinutesFromNow && !notifiedCallIds.has(call.id)) {
                        setUpcomingCall(call); // Trigger the notification
                        setNotifiedCallIds(prev => new Set(prev).add(call.id)); // Mark as notified
                        break; // Show one notification at a time
                    }
                }
            }
        } catch (error) {
            console.error("Failed to check for upcoming calls:", error);
        }
    }, [accessToken, isAuthenticated, notifiedCallIds]);

    useEffect(() => {
        // Run initial check
        checkUpcomingCalls();
        
        // Run the check every minute
        const interval = setInterval(() => {
            checkUpcomingCalls();
        }, 60000); // 60,000 milliseconds = 1 minute

        // Clean up the interval when the component unmounts
        return () => clearInterval(interval);
    }, [checkUpcomingCalls]);

    const dismissNotification = () => {
        setUpcomingCall(null);
    };

    const value = { upcomingCall, dismissNotification };

    return (
        <CallNotificationContext.Provider value={value}>
            {children}
        </CallNotificationContext.Provider>
    );
};