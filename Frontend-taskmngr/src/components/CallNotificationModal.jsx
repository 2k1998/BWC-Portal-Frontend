import React from 'react';
import { useCallNotification } from '../context/CallNotificationContext';
import { useLanguage } from '../context/LanguageContext';
import './Modal.css'; // Reuse existing modal styles

function CallNotificationModal() {
    const { upcomingCall, dismissNotification } = useCallNotification();
    const { t } = useLanguage();

    if (!upcomingCall) {
        return null; // Don't render anything if there's no upcoming call
    }

    // --- THIS IS THE FIX ---
    // Construct the name and only add the last name if it exists.
    let contactName = upcomingCall.contact.first_name;
    if (upcomingCall.contact.last_name) {
        contactName += ` ${upcomingCall.contact.last_name}`;
    }
    // --- END OF FIX ---

    const callTime = new Date(upcomingCall.next_call_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    return (
        <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '450px' }}>
                <div className="modal-header">
                    <h3 className="modal-title">{t('upcoming_call_reminder')}</h3>
                </div>
                <div className="modal-body">
                    <p>{t('you_have_a_call_with', { name: contactName, time: callTime })}</p>
                </div>
                <div className="modal-footer">
                    <button onClick={dismissNotification} className="modal-confirm-button">
                        {t('dismiss')}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default CallNotificationModal;