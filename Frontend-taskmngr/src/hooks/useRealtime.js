
// src/hooks/useRealtime.js - Custom hook for real-time updates
import { useContext } from 'react';
import { RealtimeContext } from '../context/RealtimeContextDefinition';

export const useRealtime = () => {
    const context = useContext(RealtimeContext);
    if (!context) {
        throw new Error('useRealtime must be used within a RealtimeProvider');
    }
    return context;
};
