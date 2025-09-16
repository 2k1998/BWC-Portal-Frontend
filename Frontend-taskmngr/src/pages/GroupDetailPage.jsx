// src/pages/GroupDetailPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { groupApi, taskApi } from '../api/apiService';
import { useNotification } from '../context/NotificationContext';
import TaskForm from '../components/TaskForm';
import './Groups.css';

function GroupDetailPage() {
    const { groupId } = useParams();
    const { accessToken, currentUser } = useAuth();
    const { showNotification } = useNotification();
    const { t } = useLanguage();
    const navigate = useNavigate();

    const [group, setGroup] = useState(null);
    const [members, setMembers] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showTaskForm, setShowTaskForm] = useState(false);
    const isAdmin = currentUser?.role === 'admin';

    const fetchDetails = useCallback(async () => {
        if (!accessToken) return;
        setLoading(true);
        try {
            const [groupData, membersData, tasksData] = await Promise.all([
                groupApi.getGroupById(Number(groupId), accessToken),
                groupApi.getGroupMembers(Number(groupId), accessToken),
                groupApi.getGroupTasks(Number(groupId), accessToken)
            ]);
            console.log('Group data:', groupData); // Debug log
            setGroup(groupData);
            setMembers(membersData);
            setTasks(tasksData);
        } catch (err) {
            showNotification(err.message || t('failed_to_fetch_group_details') || 'Failed to fetch group details.', 'error');
        } finally {
            setLoading(false);
        }
    }, [accessToken, groupId, showNotification, t]);

    useEffect(() => {
        fetchDetails();
    }, [fetchDetails]);

    const handleAssignTask = async (taskData) => {
        try {
            await groupApi.assignGroupTask(Number(groupId), taskData, accessToken);
            showNotification(t('task_assigned_success') || 'Task assigned!', 'success');
            setShowTaskForm(false);
            fetchDetails();
        } catch (err) {
            showNotification(err.message || t('failed_to_assign_task') || 'Failed to assign task.', 'error');
        }
    };

    const handleToggleTaskCompleted = async (taskId, completed) => {
        try {
            await groupApi.updateTask(taskId, { status: completed ? "new" : "completed" }, accessToken);
            showNotification(t('task_status_updated') || 'Task status updated!', 'success');
            fetchDetails();
        } catch (err) {
            showNotification(err.message || t('failed_to_update_task_status') || 'Failed to update task status.', 'error');
        }
    };

    const handleDeleteTask = async (taskId, taskTitle) => {
        if (!window.confirm(t('confirm_delete_task_from_group', { title: taskTitle }) || `Are you sure you want to delete the task "${taskTitle}" from this group?`)) {
            return;
        }
        try {
            await taskApi.deleteTask(taskId, accessToken);
            showNotification(t('task_deleted_success') || `Task "${taskTitle}" deleted successfully!`, 'success');
            fetchDetails();
        } catch (err) {
            showNotification(err.message || t('failed_to_delete_task') || 'Failed to delete task.', 'error');
        }
    };

    if (loading) {
        return <div className="loading-spinner">{t('loading_group_details') || 'Loading group details...'}</div>;
    }

    if (!group) {
        return <div className="error-message">{t('group_not_found_or_unauthorized') || 'Group not found or you are not authorized to view its details.'}</div>;
    }

    return (
        <div className="group-detail-container">
            <button onClick={() => navigate(-1)}>{t('back')}</button>
            <h1>{t('group')}: {group?.name || `ID: ${groupId}`}</h1>
            {(() => {
                const computedHead = group?.head || members.find(m => m.role === 'Head');
                return computedHead ? (
                    <div className="group-head-display">
                        {t('head')}: {computedHead.first_name || ''} {computedHead.surname || ''}
                        <span className="role-badge">{computedHead.role}</span>
                    </div>
                ) : null;
            })()}
            <div className="section-card">
                <h2>{t('members')}</h2>
                <ul className="member-list">
                    {members.length === 0 ? (
                        <li>{t('no_members_in_group')}</li>
                    ) : (
                        members.map(member => (
                            <li key={member.id} className="member-item">
                                {member.full_name || member.email}
                            </li>
                        ))
                    )}
                </ul>
            </div>
            <div className="section-card">
                <h2>{t('group_tasks')}</h2>
                {isAdmin && (
                    <button onClick={() => setShowTaskForm(!showTaskForm)} className="assign-task-toggle-btn">
                        {showTaskForm ? t('cancel') : t('assign_new_task_to_group')}
                    </button>
                )}
                {showTaskForm && (
                    <TaskForm onSubmit={handleAssignTask} submitButtonText={t('submit')} />
                )}
                <div className="task-list">
                    {tasks.length === 0 ? (
                        <p>{t('no_tasks_assigned_to_group')}</p>
                    ) : (
                        tasks.map(task => (
                            <div
                                key={task.id}
                                className={`task-item ${task.completed ? 'completed' : ''} ${task.urgency && task.important ? 'urgent-important-highlight' : ''}`}
                            >
                                <h3>{task.title}</h3>
                                <p>{task.description}</p>
                                {task.start_date && (
                                    <p>{t('starts')}: {new Date(task.start_date).toLocaleString()}</p>
                                )}
                                {task.deadline && (
                                    <p>{t('deadline')}: {new Date(task.deadline).toLocaleString()}</p>
                                )}
                                {task.deadline_all_day && (
                                    <span className="badge all-day-badge">{t('all_day')}</span>
                                )}
                                <div className="task-badges">
                                    {task.deadline_all_day ? (
                                        <span className="badge all-day-badge">{t('all_day')}</span>
                                    ) : task.urgency && task.important ? (
                                        <span className="badge urgent-and-important">{t('urgent_and_important')}</span>
                                    ) : task.urgency ? (
                                        <span className="badge urgent-only">{t('urgent')}</span>
                                    ) : task.important ? (
                                        <span className="badge important-only">{t('important')}</span>
                                    ) : (
                                        <span className="badge not-urgent-not-important">{t('normal')}</span>
                                    )}
                                    <span className={`badge status-${task.status?.toLowerCase()}`}>{t('status')}: {task.status}</span>
                                </div>
                                <div className="task-actions">
                                    <button
                                        onClick={() => handleToggleTaskCompleted(task.id, task.completed)}
                                        className={`action-button ${task.completed ? 'mark-incomplete' : 'mark-complete'}`}
                                    >
                                        {task.completed ? t('mark_incomplete') : t('mark_complete')}
                                    </button>
                                    {isAdmin && (
                                        <button
                                            onClick={() => handleDeleteTask(task.id, task.title)}
                                            className="action-button delete-button"
                                        >
                                            {t('delete')}
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}

export default GroupDetailPage;