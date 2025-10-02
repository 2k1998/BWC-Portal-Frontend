// src/components/TaskForm.jsx
import React, { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { companyApi, authApi, groupApi } from '../api/apiService';
import { Zap, Star } from 'lucide-react';
import './TaskForm.css';

function TaskForm({ onSubmit, submitButtonText, onCancel, isQuickMode = false }) {
    const { accessToken, currentUser } = useAuth();
    const { t } = useLanguage();
    
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [startDate, setStartDate] = useState(null);
    const [deadline, setDeadline] = useState(null);
    const [isAllDay, setIsAllDay] = useState(false);
    const [isUrgent, setIsUrgent] = useState(false);
    const [isImportant, setIsImportant] = useState(false);
    const [selectedCompanyId, setSelectedCompanyId] = useState('');
    const [companies, setCompanies] = useState([]);
    const [loadingCompanies, setLoadingCompanies] = useState(true);

    const [users, setUsers] = useState([]);
    const [priorityMemberIds, setPriorityMemberIds] = useState(new Set());
    const [selectedUserId, setSelectedUserId] = useState('');
    const [loadingUsers, setLoadingUsers] = useState(true);
    const [selectedDepartment, setSelectedDepartment] = useState('');
    const [showAdvanced, setShowAdvanced] = useState(false);

    const isAdmin = currentUser?.role === "admin";
    
    // Department options
    const departmentOptions = [
        { value: "Energy", labelKey: "energy" },
        { value: "Insurance", labelKey: "insurance" },
        { value: "Self Development Academy", labelKey: "self_development_academy" },
        { value: "Real Estate", labelKey: "real_estate" },
        { value: "Investments", labelKey: "investments" },
        { value: "Marketing/Social Media", labelKey: "marketing_social_media" },
    ];

    useEffect(() => {
        if (accessToken) {
            setLoadingCompanies(true);
            companyApi.getAll(accessToken)
                .then(data => setCompanies(data))
                .finally(() => setLoadingCompanies(false));

            setLoadingUsers(true);
            // Fetch users and groups to prioritize team members
            Promise.all([
                authApi.listBasicUsers(accessToken),
                groupApi.getGroups(accessToken).catch(() => [])
            ])
            .then(([allUsers, groups]) => {
                // Determine groups the current user is a member of (non-admin gets only own groups)
                const myGroupIds = new Set(
                    (groups || [])
                        .filter(g => Array.isArray(g.members) ? g.members.some(m => m.id === currentUser?.id) : true)
                        .map(g => g.id)
                );
                // Collect member ids from these groups
                const memberIds = new Set();
                (groups || []).forEach(g => {
                    if (myGroupIds.has(g.id) && Array.isArray(g.members)) {
                        g.members.forEach(m => memberIds.add(m.id));
                    }
                });
                setPriorityMemberIds(memberIds);
                // Sort users: team members first, then alphabetical by name/email
                const byName = (u) => (u.full_name || `${u.first_name || ''} ${u.surname || ''}`.trim() || u.email || '').toLowerCase();
                const sorted = [...allUsers].sort((a, b) => {
                    const aPri = memberIds.has(a.id) ? 0 : 1;
                    const bPri = memberIds.has(b.id) ? 0 : 1;
                    if (aPri !== bPri) return aPri - bPri;
                    return byName(a).localeCompare(byName(b));
                });
                setUsers(sorted);
                // Set current user as default assignment
                if (currentUser && !isQuickMode) {
                    setSelectedUserId(currentUser.id.toString());
                }
            })
            .finally(() => setLoadingUsers(false));

            // Set today as default start date
            if (!isQuickMode) {
                setStartDate(new Date());
            }
        }
    }, [accessToken, currentUser, isQuickMode]);

    const handleSubmit = (e) => {
        e.preventDefault();
        const taskData = {
            title, description, start_date: startDate?.toISOString(),
            deadline: deadline?.toISOString(), deadline_all_day: isAllDay,
            urgency: isUrgent, important: isImportant, company_id: parseInt(selectedCompanyId),
            owner_id: selectedUserId ? parseInt(selectedUserId) : null,
            department: selectedDepartment || null,
        };
        onSubmit(taskData);
    };

    return (
        <div className="task-form-container">
            <form onSubmit={handleSubmit} className="create-task-form">
                <div className="form-header">
                    <h3>{t('new_task')}</h3>
                    {!isQuickMode && (
                        <button 
                            type="button" 
                            className="toggle-advanced-btn"
                            onClick={() => setShowAdvanced(!showAdvanced)}
                        >
                            {showAdvanced ? t('hide_advanced') : t('show_advanced')}
                        </button>
                    )}
                </div>

                {/* Basic Information Section */}
                <div className="form-section">
                    <h4 className="section-title">{t('basic_information')}</h4>
                    <div className="form-row">
                        <div className="form-group full-width">
                            <label>{t('title')}: <span className="required">*</span></label>
                            <input 
                                type="text" 
                                value={title} 
                                onChange={e => setTitle(e.target.value)} 
                                required 
                                placeholder={t('enter_task_title')}
                                className="form-input"
                            />
                        </div>
                    </div>
                    <div className="form-row">
                        <div className="form-group full-width">
                            <label>{t('description_optional')}:</label>
                            <textarea 
                                value={description} 
                                onChange={e => setDescription(e.target.value)}
                                placeholder={t('enter_task_description')}
                                className="form-textarea"
                            ></textarea>
                        </div>
                    </div>
                </div>

                {/* Assignment Section */}
                <div className="form-section">
                    <h4 className="section-title">{t('assignment')}</h4>
                    <div className="form-row">
                        <div className="form-group">
                            <label>{t('company_required')}: <span className="required">*</span></label>
                            <select 
                                value={selectedCompanyId} 
                                onChange={e => setSelectedCompanyId(e.target.value)} 
                                required 
                                disabled={loadingCompanies}
                                className="form-select"
                            >
                                <option value="" disabled>{loadingCompanies ? t('loading') : t('select_a_company')}</option>
                                {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>{t('assign_to_user')}:</label>
                            <select 
                                value={selectedUserId} 
                                onChange={e => setSelectedUserId(e.target.value)} 
                                disabled={loadingUsers}
                                className="form-select"
                            >
                                <option value="">{t('select_user')}</option>
                                {users.map(user => (
                                    <option key={user.id} value={user.id}>
                                        {user.full_name || `${user.first_name} ${user.surname}`.trim() || user.email}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Advanced Options */}
                {(showAdvanced || isQuickMode) && (
                    <>
                        {/* Department Section */}
                        <div className="form-section">
                            <h4 className="section-title">{t('department')}</h4>
                            <div className="form-row">
                                <div className="form-group full-width">
                                    <label>{t('department')}:</label>
                                    <select 
                                        value={selectedDepartment} 
                                        onChange={e => setSelectedDepartment(e.target.value)}
                                        className="form-select"
                                    >
                                        <option value="">{t('select_a_department')}</option>
                                        {departmentOptions.map(opt => (
                                            <option key={opt.value} value={opt.value}>{t(opt.labelKey)}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Priority Section */}
                        <div className="form-section">
                            <h4 className="section-title">{t('priority')}</h4>
                            <div className="priority-controls">
                                <div className="checkbox-group">
                                    <input 
                                        type="checkbox" 
                                        id="urgent" 
                                        checked={isUrgent} 
                                        onChange={e => setIsUrgent(e.target.checked)} 
                                        className="priority-checkbox urgent"
                                    />
                                    <label htmlFor="urgent" className="priority-label urgent">
                                        <Zap className="priority-icon" size={16} />
                                        {t('urgent_checkbox')}
                                    </label>
                                </div>
                                <div className="checkbox-group">
                                    <input 
                                        type="checkbox" 
                                        id="important" 
                                        checked={isImportant} 
                                        onChange={e => setIsImportant(e.target.checked)} 
                                        className="priority-checkbox important"
                                    />
                                    <label htmlFor="important" className="priority-label important">
                                        <Star className="priority-icon" size={16} />
                                        {t('important_checkbox')}
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* Dates Section */}
                        <div className="form-section">
                            <h4 className="section-title">{t('dates')}</h4>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>{t('start_date')}:</label>
                                    <DatePicker 
                                        selected={startDate} 
                                        onChange={date => setStartDate(date)} 
                                        showTimeInput
                                        timeInputLabel="Time:"
                                        dateFormat="dd/MM/yyyy HH:mm"
                                        placeholderText={t('select_date_time')} 
                                        className="form-datepicker"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>{t('deadline')}:</label>
                                    <DatePicker 
                                        selected={deadline} 
                                        onChange={date => setDeadline(date)} 
                                        showTimeInput
                                        timeInputLabel="Time:"
                                        dateFormat="dd/MM/yyyy HH:mm"
                                        disabled={isAllDay} 
                                        placeholderText={t('select_date_time')} 
                                        className="form-datepicker"
                                    />
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="checkbox-group">
                                    <input 
                                        type="checkbox" 
                                        id="allDay" 
                                        checked={isAllDay} 
                                        onChange={e => setIsAllDay(e.target.checked)} 
                                        className="form-checkbox"
                                    />
                                    <label htmlFor="allDay">{t('all_day_deadline')}</label>
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {/* Form Actions */}
                <div className="form-actions">
                    {onCancel && (
                        <button type="button" onClick={onCancel} className="btn btn-secondary">
                            {t('cancel')}
                        </button>
                    )}
                    <button type="submit" className="btn btn-primary">
                        {submitButtonText || t('create_task')}
                    </button>
                </div>
            </form>
        </div>
    );
}

export default TaskForm;