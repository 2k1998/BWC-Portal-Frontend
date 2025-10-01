import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { googleCalendarApi } from '../api/apiService';
import { useNavigate, useSearchParams } from 'react-router-dom';

function CalendarSyncPage() {
  const { accessToken } = useAuth();
  const { showNotification } = useNotification();
  const [status, setStatus] = useState({ connected: false, sync_enabled: false });
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const loadStatus = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const s = await googleCalendarApi.getStatus(accessToken);
      setStatus(s);
    } catch (e) {
      showNotification(e.message || 'Failed to load status', 'error');
    } finally {
      setLoading(false);
    }
  }, [accessToken, showNotification]);

  useEffect(() => {
    loadStatus();
    if (searchParams.get('connected')) {
      showNotification('Google Calendar connected.', 'success');
      navigate('/calendar-sync', { replace: true });
    }
  }, [loadStatus, searchParams, navigate, showNotification]);

  const handleConnect = async () => {
    try {
      const { auth_url } = await googleCalendarApi.getAuthUrl(accessToken);
      window.location.href = auth_url;
    } catch (e) {
      showNotification(e.message || 'Failed to get authorization URL', 'error');
    }
  };

  const handleDisconnect = async () => {
    try {
      await googleCalendarApi.disconnect(accessToken);
      showNotification('Disconnected from Google Calendar', 'success');
      loadStatus();
    } catch (e) {
      showNotification(e.message || 'Failed to disconnect', 'error');
    }
  };

  const handleSync = async () => {
    try {
      const res = await googleCalendarApi.sync(accessToken);
      showNotification(`Synced ${res.created} events to Google Calendar`, 'success');
    } catch (e) {
      showNotification(e.message || 'Failed to sync', 'error');
    }
  };

  if (loading) return <div className="loading-spinner">Loading...</div>;

  return (
    <div className="page-container" style={{ padding: 20 }}>
      <h2>Google Calendar Sync</h2>
      {!status.connected ? (
        <>
          <p>Connect your Google Calendar to sync your BWC events.</p>
          <button className="btn btn-primary" onClick={handleConnect}>Connect Google Calendar</button>
        </>
      ) : (
        <>
          <p>Google Calendar is connected.</p>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-secondary" onClick={handleSync}>Sync now</button>
            <button className="btn btn-danger" onClick={handleDisconnect}>Disconnect</button>
          </div>
        </>
      )}
    </div>
  );
}

export default CalendarSyncPage;

