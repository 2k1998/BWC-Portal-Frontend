import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import './TaskHistory.css';

function TaskHistory({ history }) {
    const { t } = useLanguage();

    if (!history || history.length === 0) {
        return null;
    }

    return (
        <div className="task-history-container">
            <h4>{t('task_history')}</h4>
            <ul className="history-list">
                {history.map(entry => (
                    <li key={entry.id} className="history-item">
                        <div className="history-details">
                            <strong>{entry.changed_by.full_name}</strong>
                            {entry.status_from && entry.status_to ? (
                                <span> {t('changed_status_from_to', { from: t(entry.status_from), to: t(entry.status_to) })}</span>
                            ) : (
                                <span> {t('added_comment')}</span>
                            )}
                            <span className="history-timestamp">
                                {new Date(entry.timestamp).toLocaleString()}
                            </span>
                        </div>
                        {entry.comment && <p className="history-comment">{entry.comment}</p>}
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default TaskHistory;