// src/pages/EventsPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useNotification } from '../context/NotificationContext';
import { eventApi } from '../api/apiService';
import { format } from 'date-fns';
import './Events.css';
import { translations } from '../translations';

function EventsPage() {
    const { accessToken, currentUser } = useAuth();
    const { showNotification } = useNotification();
    const { language, t } = useLanguage();
    const navigate = useNavigate();

    // ADD THIS DEBUG CODE TEMPORARILY
    console.log('Current language:', language);
    console.log('Translation for event_management:', t('event_management'));
    console.log('All translations available:', translations);
    // END DEBUG CODE

    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const isAdmin = currentUser?.role === 'admin';

    // TEMPORARY WORKAROUND - Add manual translations
    const getTranslation = (key) => {
        const manualTranslations = {
            en: {
                event_management: 'Event Management',
                new_event: 'New Event',
                no_events_programmed: 'No events have been programmed.',
                delete: 'Delete',
                loading: 'Loading...',
            },
            el: {
                event_management: 'Διαχείριση Εκδηλώσεων',
                new_event: 'Νέα Εκδήλωση',
                no_events_programmed: 'Δεν υπάρχουν προγραμματισμένες εκδηλώσεις.',
                delete: 'Διαγραφή',
                loading: 'Φόρτωση...',
            }
        };
        
        const currentLang = language === 'el' ? 'el' : 'en';
        return manualTranslations[currentLang][key] || t(key);
    };

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
                <h1>{getTranslation('event_management')}</h1>
                {isAdmin && (
                    <button onClick={() => navigate('/events/new')} className="add-event-button">
                        {getTranslation('new_event')}
                    </button>
                )}
            </div>
            <div className="event-list">
                {loading ? (
                    <p>{getTranslation('loading')}</p>
                ) : events.length === 0 ? (
                    <p className="no-events-message">{getTranslation('no_events_programmed')}</p>
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
                                    <strong>{t('event_date')}:</strong> {format(new Date(event.event_date), 'PPPP p')}
                                </p>
                                <p>
                                    <strong>{t('event_location')}:</strong> {event.location}
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