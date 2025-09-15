import React, { useState, useEffect, useCallback } from 'react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useNotification } from '../context/NotificationContext';
import { dailyCallApi } from '../api/apiService'; // Fixed: removed 's' from dailyCallsApi
import './DailyCalls.css';

function DailyCallsPage() {
    const { accessToken } = useAuth();
    const { t } = useLanguage();
    const { showNotification } = useNotification();

    const [dailyCalls, setDailyCalls] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchDailyCalls = useCallback(async () => {
        if (!accessToken) return;
        setLoading(true);
        try {
            // Fixed: use correct function name
            const data = await dailyCallApi.getMyDailyCalls(accessToken);
            setDailyCalls(data);
        } catch (err) {
            const errorMessage = err.message || err.detail || err.toString() || t('failed_to_fetch_daily_calls');
            showNotification(errorMessage, 'error');
        } finally {
            setLoading(false);
        }
    }, [accessToken, showNotification, t]);

    useEffect(() => {
        fetchDailyCalls();
    }, [fetchDailyCalls]);

    const handleUpdate = async (callId, updateData) => {
        try {
            // Fixed: use correct function name
            await dailyCallApi.updateDailyCall(callId, updateData, accessToken);
            showNotification(t('call_updated_success'), 'success');
            fetchDailyCalls();
        } catch (err) {
            const errorMessage = err.message || err.detail || err.toString() || t('failed_to_update_call');
            showNotification(errorMessage, 'error');
        }
    };

    const handleRemove = async (callId) => {
        if (window.confirm(t('confirm_remove_from_daily_list'))) {
            try {
                // Fixed: use correct function name
                await dailyCallApi.removeFromDailyList(callId, accessToken);
                showNotification(t('call_removed_success'), 'success');
                fetchDailyCalls();
            } catch (err) {
                const errorMessage = err.message || err.detail || err.toString() || t('failed_to_remove_call');
                showNotification(errorMessage, 'error');
            }
        }
    };

    if (loading) return <div className="loading-spinner">{t('loading')}</div>;

    return (
        <div className="daily-calls-container">
            <h1>{t('daily_calls')}</h1>
            <div className="daily-calls-list">
                {dailyCalls.length > 0 ? (
                    <table>
                        <thead>
                            <tr>
                                <th>{t('contact_name')}</th>
                                <th>{t('calls_per_day')}</th>
                                <th>{t('next_call_at')}</th>
                                <th>{t('actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {dailyCalls.map(call => (
                                <tr key={call.id}>
                                    <td>{call.contact.first_name} {call.contact.last_name}</td>
                                    <td>
                                        <input
                                            type="number"
                                            min="1"
                                            className="frequency-input"
                                            value={call.call_frequency_per_day}
                                            onChange={(e) => handleUpdate(call.id, { call_frequency_per_day: parseInt(e.target.value) || 1 })}
                                        />
                                    </td>
                                    <td>
                                        <DatePicker
                                            selected={call.next_call_at ? new Date(call.next_call_at) : null}
                                            onChange={(date) => handleUpdate(call.id, { next_call_at: date ? date.toISOString() : null })}
                                            showTimeInput
                                            timeInputLabel={`${t('time')}:`}
                                            dateFormat="dd/MM/yyyy HH:mm"
                                            className="date-picker-input"
                                            placeholderText={t('set_next_call')}
                                        />
                                    </td>
                                    <td>
                                        <button className="remove-button" onClick={() => handleRemove(call.id)}>
                                            {t('remove')}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <p>{t('no_contacts_in_daily_list')}</p>
                )}
            </div>
        </div>
    );
}

export default DailyCallsPage;