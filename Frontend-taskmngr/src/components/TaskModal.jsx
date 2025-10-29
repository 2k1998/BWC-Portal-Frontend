import React, { useEffect, useMemo, useState } from 'react';
import { taskApi, companyApi } from '../api/apiService';
import { useLanguage } from '../context/LanguageContext';
import TaskStatusUpdate from './TaskStatusUpdate';  // ⬅️ status manager inside modal

/**
 * Props
 * - isOpen: boolean
 * - onClose: () => void
 * - task: the task object to view/edit
 * - accessToken: auth token for API
 * - onUpdated?: () => void   // optional callback after successful save
 */
const TaskModal = ({ isOpen, onClose, task, accessToken, onUpdated }) => {
  const { t } = useLanguage();

  // Guard
  if (!isOpen || !task) return null;

  const initialTask = useMemo(() => task, [task]);

  const [isEditing, setIsEditing] = useState(false);

  const [editValues, setEditValues] = useState({
    title: initialTask?.title || '',
    description: initialTask?.description || '',
    start_date: initialTask?.start_date || '',
    deadline: initialTask?.deadline || '',
    deadline_all_day: !!initialTask?.deadline_all_day,
    urgency: !!initialTask?.urgency,
    important: !!initialTask?.important,
    // 👇 Preselect existing company (supports task.company_id or task.company.id)
    company_id: initialTask?.company_id ?? initialTask?.company?.id ?? '',
  });

  // Keep form in sync if the task prop changes while modal is open
  useEffect(() => {
    setEditValues({
      title: initialTask?.title || '',
      description: initialTask?.description || '',
      start_date: initialTask?.start_date || '',
      deadline: initialTask?.deadline || '',
      deadline_all_day: !!initialTask?.deadline_all_day,
      urgency: !!initialTask?.urgency,
      important: !!initialTask?.important,
      company_id: initialTask?.company_id ?? initialTask?.company?.id ?? '',
    });
  }, [initialTask]);

  // 👇 Companies list for the selector
  const [companies, setCompanies] = useState([]);
  const [loadingCompanies, setLoadingCompanies] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setLoadingCompanies(true);
    companyApi
      .getAll(accessToken)
      .then((list) => setCompanies(Array.isArray(list) ? list : []))
      .finally(() => setLoadingCompanies(false));
  }, [isOpen, accessToken]);

  const handleEditChange = (name, value) => {
    setEditValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveEdits = async () => {
    const payload = {
      title: editValues.title,
      description: editValues.description,
      start_date: editValues.start_date,
      deadline: editValues.deadline,
      deadline_all_day: editValues.deadline_all_day,
      urgency: editValues.urgency,
      important: editValues.important,
      // 👇 include company change
      company_id: editValues.company_id || null,
    };

    await taskApi.updateTask(initialTask.id, payload, accessToken);
    setIsEditing(false);
    onUpdated && onUpdated();
    onClose(); // close after successful save
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content max-w-4xl" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            {isEditing ? (t('edit_task') || 'edit_task') : (t('task') || 'task')}
          </h2>
          <button className="btn-outline" onClick={onClose}>
            {t('cancel') || 'Άκυρο'}
          </button>
        </div>

        {/* Body */}
        {!isEditing ? (
          // ===== VIEW MODE =====
          <div className="task-view space-y-4">
            <div className="info-item">
              <label className="block text-xs font-semibold uppercase">{t('title') || 'Τίτλος'}</label>
              <div>{initialTask.title}</div>
            </div>
            <div className="info-item">
              <label className="block text-xs font-semibold uppercase">{t('description') || 'Περιγραφή'}</label>
              <div className="whitespace-pre-wrap">{initialTask.description}</div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="info-item">
                <label className="block text-xs font-semibold uppercase">{t('start_date') || 'Ημερομηνία έναρξης'}</label>
                <div>{initialTask.start_date || '—'}</div>
              </div>
              <div className="info-item">
                <label className="block text-xs font-semibold uppercase">{t('deadline') || 'Προθεσμία'}</label>
                <div>{initialTask.deadline || '—'}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="info-item">
                <label className="block text-xs font-semibold uppercase">{t('important') || 'Σημαντικό'}</label>
                <div>{initialTask.important ? t('yes') || 'Ναι' : t('no') || 'Όχι'}</div>
              </div>
              <div className="info-item">
                <label className="block text-xs font-semibold uppercase">{t('urgent') || 'Επείγον'}</label>
                <div>{initialTask.urgency ? t('yes') || 'Ναι' : t('no') || 'Όχι'}</div>
              </div>
            </div>

            <div className="info-item">
              <label className="block text-xs font-semibold uppercase">{t('company') || 'Εταιρεία'}</label>
              <div>{initialTask?.company?.name || '—'}</div>
            </div>

            {/* ⬇️ Status manager inside the View tab */}
            <div className="mt-6">
              <TaskStatusUpdate task={initialTask} onStatusUpdated={onUpdated} />
            </div>

            <div className="form-actions mt-6 flex gap-3">
              <button className="btn-primary" onClick={() => setIsEditing(true)}>
                {t('edit') || 'Επεξεργασία'}
              </button>
              <button className="btn-cancel" onClick={onClose}>
                {t('close') || 'Κλείσιμο'}
              </button>
            </div>
          </div>
        ) : (
          // ===== EDIT MODE =====
          <div className="task-edit-form space-y-4">
            <div className="info-item">
              <label className="block text-xs font-semibold uppercase">{t('title') || 'Τίτλος'}</label>
              <input
                type="text"
                value={editValues.title}
                onChange={(e) => handleEditChange('title', e.target.value)}
              />
            </div>

            <div className="info-item">
              <label className="block text-xs font-semibold uppercase">{t('description') || 'Περιγραφή'}</label>
              <textarea
                rows={4}
                value={editValues.description}
                onChange={(e) => handleEditChange('description', e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="info-item">
                <label className="block text-xs font-semibold uppercase">{t('start_date') || 'Ημερομηνία έναρξης'}</label>
                <input
                  type="datetime-local"
                  value={editValues.start_date || ''}
                  onChange={(e) => handleEditChange('start_date', e.target.value)}
                />
              </div>
              <div className="info-item">
                <label className="block text-xs font-semibold uppercase">{t('deadline') || 'Προθεσμία'}</label>
                <input
                  type="datetime-local"
                  value={editValues.deadline || ''}
                  onChange={(e) => handleEditChange('deadline', e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={!!editValues.deadline_all_day}
                  onChange={(e) => handleEditChange('deadline_all_day', e.target.checked)}
                />
                <span>{t('all_day_deadline') || 'Ολοήμερη προθεσμία'}</span>
              </label>

              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={!!editValues.important}
                  onChange={(e) => handleEditChange('important', e.target.checked)}
                />
                <span>{t('important') || 'Σημαντικό'}</span>
              </label>

              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={!!editValues.urgency}
                  onChange={(e) => handleEditChange('urgency', e.target.checked)}
                />
                <span>{t('urgent') || 'Επείγον'}</span>
              </label>
            </div>

            {/* 👇 Editable company selector in edit mode */}
            <div className="info-item">
              <label className="block text-xs font-semibold uppercase">{t('company') || 'Εταιρεία'}</label>
              <select
                value={editValues.company_id}
                onChange={(e) => handleEditChange('company_id', e.target.value)}
                disabled={loadingCompanies}
              >
                <option value="">{t('select_company') || 'Επιλέξτε εταιρεία'}</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-actions mt-6 flex gap-3">
              <button className="btn-primary" onClick={handleSaveEdits}>
                {t('save') || 'Αποθήκευση'}
              </button>
              <button className="btn-cancel" onClick={() => setIsEditing(false)}>
                {t('cancel') || 'Άκυρο'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskModal;
