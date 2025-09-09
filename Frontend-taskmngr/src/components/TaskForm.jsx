// src/components/TaskForm.jsx
import React, { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { companyApi, authApi } from '../api/apiService';
import './TaskForm.css';

function TaskForm({ onSubmit, submitButtonText }) {
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
    const [selectedUserId, setSelectedUserId] = useState('');
    const [loadingUsers, setLoadingUsers] = useState(true);
    const [selectedDepartment, setSelectedDepartment] = useState(''); // <-- NEW STATE

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

            // Allow all users to see other users for task assignment
            setLoadingUsers(true);
            authApi.listAllUsers(accessToken)
                .then(data => setUsers(data))
                .finally(() => setLoadingUsers(false));
        }
    }, [accessToken]);

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
        <form onSubmit={handleSubmit} className="create-task-form">
            <h3>{t('new_task')}</h3>
            <div className="form-group">
                <label>{t('title')}:</label>
                <input type="text" value={title} onChange={e => setTitle(e.target.value)} required />
            </div>
            <div className="form-group">
                <label>{t('description_optional')}:</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)}></textarea>
            </div>
            <div className="form-group">
                <label>{t('company_required')}: <span className="required">*</span></label>
                <select value={selectedCompanyId} onChange={e => setSelectedCompanyId(e.target.value)} required disabled={loadingCompanies}>
                    <option value="" disabled>{loadingCompanies ? t('loading') : t('select_a_company')}</option>
                    {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
            </div>

            {/* --- NEW DEPARTMENT DROPDOWN --- */}
            <div className="form-group">
                <label>{t('department')}:</label>
                <select value={selectedDepartment} onChange={e => setSelectedDepartment(e.target.value)}>
                    <option value="">{t('select_a_department')}</option>
                    {departmentOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>{t(opt.labelKey)}</option>
                    ))}
                </select>
            </div>
            {/* --- END NEW DROPDOWN --- */}

            <div className="form-group">
                <label>{t('assign_to_user')}:</label>
                <select value={selectedUserId} onChange={e => setSelectedUserId(e.target.value)} disabled={loadingUsers}>
                    <option value="">{loadingUsers ? t('loading') : t('assign_to_self')}</option>
                    {users.map(user => (
                        <option key={user.id} value={user.id}>
                            {user.full_name || `${user.first_name} ${user.surname}`.trim() || user.email}
                        </option>
                    ))}
                </select>
            </div>

            <div className="form-group">
                <label>{t('start_date')}:</label>
                <DatePicker 
                    selected={startDate} 
                    onChange={date => setStartDate(date)} 
                    showTimeInput
                    timeInputLabel="Time:"
                    dateFormat="dd/MM/yyyy HH:mm"
                    placeholderText={t('select_date_time')} 
                    className="custom-datepicker-input"
                />
            </div>
            <div className="form-group">
                <input type="checkbox" id="allDay" checked={isAllDay} onChange={e => setIsAllDay(e.target.checked)} />
                <label htmlFor="allDay">{t('all_day_deadline')}</label>
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
                    className="custom-datepicker-input"
                />
            </div>
            <div className="form-group">
                <input type="checkbox" id="urgent" checked={isUrgent} onChange={e => setIsUrgent(e.target.checked)} />
                <label htmlFor="urgent">{t('urgent_checkbox')}</label>
            </div>
            <div className="form-group">
                <input type="checkbox" id="important" checked={isImportant} onChange={e => setIsImportant(e.target.checked)} />
                <label htmlFor="important">{t('important_checkbox')}</label>
            </div>
            <button type="submit">{submitButtonText}</button>
        </form>
    );
}

export default TaskForm;