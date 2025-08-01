// src/pages/EventsPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useNotification } from '../context/NotificationContext';
import { eventApi } from '../api/apiService';
import { format } from 'date-fns';
import './Events.css';

function EventsPage() {
    const { accessToken, currentUser } = useAuth();
    const { showNotification } = useNotification();
    const { t } = useLanguage();
    const navigate = useNavigate();

    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const isAdmin = currentUser?.role === 'admin';

    const fetchEvents = useCallback(async () => {
        if (!accessToken) return;
        setLoading(true);
        try {
            const data = await eventApi.getAllEvents(accessToken);
            setEvents(data);
        } catch (err) {
            showNotification(err.message || t('failed_to_fetch_events'), 'error');
        } finally {
            setLoading(false);
        }
    }, [accessToken, showNotification, t]);

    useEffect(() => {
        fetchEvents();
    }, [fetchEvents]);

    const handleDelete = async (id, title) => {
        if (window.confirm(t('confirm_delete_event', { title }))) {
            try {
                await eventApi.deleteEvent(id, accessToken);
                showNotification(t('event_deleted_success'), 'success');
                fetchEvents();
            } catch (err) {
                showNotification(err.message || t('failed_to_delete_event'), 'error');
            }
        }
    };

    return (
        <div className="events-container">
            <div className="events-header">
                <h1>{t('programmed_events')}</h1>
                {isAdmin && (
                    <button onClick={() => navigate('/events/new')} className="add-event-button">
                        {t('add_new_event')}
                    </button>
                )}
            </div>
            <div className="event-list">
                {loading ? (
                    <p>{t('loading')}</p>
                ) : events.length === 0 ? (
                    <p className="no-events-message">{t('no_events_programmed')}</p>
                ) : (
                    events.map(event => (
                        <div key={event.id} className="event-card">
                            <div className="event-card-header">
                                <h3>{event.title}</h3>
                                {isAdmin && (
                                    <button
                                        onClick={() => handleDelete(event.id, event.title)}
                                        className="delete-event-button"
                                    >
                                        {t('delete')}
                                    </button>
                                )}
                            </div>
                            <div className="event-card-body">
                                <p>
                                    <strong>{t('date_time')}:</strong> {format(new Date(event.event_date), 'PPPP p')}
                                </p>
                                <p>
                                    <strong>{t('location')}:</strong> {event.location}
                                </p>
                                {event.description && (
                                    <p className="event-description">{event.description}</p>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

export default EventsPage;