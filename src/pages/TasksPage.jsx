// src/pages/TasksPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { taskApi } from '../api/apiService';
import { useNotification } from '../context/NotificationContext';
import TaskForm from '../components/TaskForm';
import TaskStatusUpdate from '../components/TaskStatusUpdate';
import TaskModal from '../components/TaskModal';
import './Tasks.css';

function TasksPage() {
    const { accessToken, currentUser, loading: authLoading } = useAuth();
    const { showNotification } = useNotification();
    const { t } = useLanguage();
    const location = useLocation();
    const navigate = useNavigate();

    const [allTasks, setAllTasks] = useState([]);
    const [filteredTasks, setFilteredTasks] = useState([]);
    const [activeFilter, setActiveFilter] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [selectedTask, setSelectedTask] = useState(null);
    const [showTaskModal, setShowTaskModal] = useState(false);
    const [modalLoading, setModalLoading] = useState(false);
    const [statusFilter, setStatusFilter] = useState('all');

    const isAdmin = currentUser?.role === "admin";

    const fetchTasks = useCallback(async () => {
        if (!accessToken) return;
        setLoading(true);
        try {
            const fetchedTasks = await taskApi.getTasks(accessToken);
            setAllTasks(fetchedTasks);
        } catch (err) {
            showNotification(err.message || t('failed_to_fetch_tasks'), 'error');
        } finally {
            setLoading(false);
        }
    }, [accessToken, showNotification, t]);

    useEffect(() => {
        if (!authLoading && accessToken) {
            fetchTasks();
        }
    }, [accessToken, authLoading, fetchTasks]);

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const filter = params.get('filter');
        setActiveFilter(filter);

        if (!filter) {
            setFilteredTasks(allTasks);
            return;
        }

        const tasksToFilter = allTasks.filter(task => {
            switch (filter) {
                case 'urgentImportant':
                    return task.urgency && task.important && !task.deadline_all_day;
                case 'urgentOnly':
                    return task.urgency && !task.important && !task.deadline_all_day;
                case 'importantOnly':
                    return !task.urgency && task.important && !task.deadline_all_day;
                case 'normal':
                    return !task.urgency && !task.important && !task.deadline_all_day;
                case 'allDayDeadline':
                    return task.deadline_all_day;
                default:
                    return true;
            }
        });
        setFilteredTasks(tasksToFilter);

    }, [location.search, allTasks]);

    const handleCreateTask = async (taskData) => {
        try {
            await taskApi.createTask(taskData, accessToken);
            showNotification(t('task_created_success'), 'success');
            fetchTasks();
            setShowCreateForm(false);
        } catch (err) {
            showNotification(err.message || t('failed_to_create_task'), 'error');
        }
    };

    const handleToggleCompleted = async (taskId, currentCompletedStatus) => {
        try {
            await taskApi.updateTask(taskId, { completed: !currentCompletedStatus }, accessToken);
            showNotification(
                !currentCompletedStatus
                    ? t('task_marked_completed')
                    : t('task_marked_incomplete'),
                'success'
            );
            fetchTasks();
        } catch (err) {
            showNotification(err.message || t('failed_to_update_task_status'), 'error');
        }
    };

    const handleDeleteTask = async (taskId) => {
        if (window.confirm(t('confirm_delete_task') || 'Are you sure you want to delete this task?')) {
            try {
                await taskApi.deleteTask(taskId, accessToken);
                showNotification(t('task_deleted_success'), 'success');
                fetchTasks();
            } catch (err) {
                showNotification(err.message || t('failed_to_delete_task'), 'error');
            }
        }
    };

    const openTaskModal = async (task) => {
        setModalLoading(true);
        try {
            const taskDetails = await taskApi.getTaskById(task.id, accessToken);
            setSelectedTask(taskDetails);
            setShowTaskModal(true);
        } catch (err) {
            showNotification(err.message || 'Failed to fetch task details', 'error');
            setSelectedTask(null);
        } finally {
            setModalLoading(false);
        }
    };

    const handleTaskUpdated = () => {
        fetchTasks();
        if (selectedTask) {
            openTaskModal(selectedTask);
        }
    };

    const filteredTasksByStatus = React.useMemo(() => {
        if (statusFilter === 'all') return filteredTasks;
        return filteredTasks.filter(task => String(task.status).toLowerCase() === statusFilter);
    }, [filteredTasks, statusFilter]);

    if (authLoading || loading) {
        return <div className="loading-spinner">{t('loading')}</div>;
    }

    const activeTasks = filteredTasks.filter(task => !task.completed);
    const completedTasks = filteredTasks.filter(task => task.completed);

    return (
        <div className="tasks-container">
            <h1>{t('my_tasks')}</h1>

            <div className="filter-section">
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="status-filter"
                >
                    <option value="all">{t('all_statuses') || 'All Statuses'}</option>
                    <option value="new">{t('new')}</option>
                    <option value="received">{t('received')}</option>
                    <option value="on_process">{t('on_process')}</option>
                    <option value="pending">{t('pending')}</option>
                    <option value="completed">{t('completed')}</option>
                    <option value="loose_end">{t('loose_end')}</option>
                </select>
            </div>

            {activeFilter && (
                <div className="filter-info-bar">
                    <span>Showing filtered results for: <strong>{activeFilter}</strong></span>
                    <button onClick={() => navigate('/tasks')} className="clear-filter-button">
                        &times; Clear Filter
                    </button>
                </div>
            )}

            {isAdmin && (
                <button onClick={() => setShowCreateForm(!showCreateForm)} className="toggle-form-button">
                    {showCreateForm ? t('hide_create_task_form') : t('create_new_task')}
                </button>
            )}
            {isAdmin && showCreateForm && (
                <TaskForm onSubmit={handleCreateTask} submitButtonText={t('add_task')} />
            )}
            
            <div className="active-tasks-section">
                <h2>{t('active_tasks')} ({filteredTasksByStatus.filter(task => !task.completed).length})</h2>
                <div className="task-list">
                    {filteredTasksByStatus.filter(task => !task.completed).length === 0 ? (
                        <p>{t('no_active_tasks')}</p>
                    ) : (
                        filteredTasksByStatus.filter(task => !task.completed).map((task) => (
                            <div
                                key={task.id}
                                className={`task-item${task.urgency && task.important ? ' urgent-important-highlight' : ''}`}
                                onClick={() => openTaskModal(task)}
                                style={{ cursor: 'pointer' }}
                            >
                                <div className="task-status-info">
                                    <TaskStatusUpdate task={task} compact={true} />
                                    {/* Your existing task info */}
                                </div>
                                <h3>{task.title}</h3>
                                <p>{task.description}</p>
                                {task.start_date && <p>{t('starts')}: {new Date(task.start_date).toLocaleString()}</p>}
                                {task.deadline && <p>{t('deadline')}: {new Date(task.deadline).toLocaleString()}</p>}
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
                                    <span className={`badge status-${String(task.status).toLowerCase().replace(/\s+/g, '_')}`}>
                                        {t('status')}: {task.status}
                                    </span>
                                </div>
                                <div className="task-actions">
                                    <button
                                        onClick={e => { e.stopPropagation(); handleToggleCompleted(task.id, task.completed); }}
                                        className="action-button mark-complete"
                                    >
                                        {t('mark_complete')}
                                    </button>
                                    <button
                                        onClick={e => { e.stopPropagation(); handleDeleteTask(task.id); }}
                                        className="action-button delete-button"
                                    >
                                        {t('delete')}
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            <div className="completed-tasks-section">
                <h2>{t('completed_tasks')} ({completedTasks.length})</h2>
                <div className="task-list">
                    {completedTasks.length === 0 ? (
                        <p>{t('no_completed_tasks_yet')}</p>
                    ) : (
                        completedTasks.map((task) => (
                            <div key={task.id} className={`task-item completed${task.urgency && task.important ? ' urgent-important-highlight' : ''}`}>
                                <h3>{task.title}</h3>
                                <p>{task.description}</p>
                                {task.deadline && <p>{t('deadline')}: {new Date(task.deadline).toLocaleString()}</p>}
                                <div className="task-actions">
                                    <button
                                        onClick={e => { e.stopPropagation(); handleToggleCompleted(task.id, task.completed); }}
                                        className="action-button mark-incomplete"
                                    >
                                        {t('mark_incomplete')}
                                    </button>
                                    <button
                                        onClick={e => { e.stopPropagation(); handleDeleteTask(task.id); }}
                                        className="action-button delete-button"
                                    >
                                        {t('delete')}
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {showTaskModal && selectedTask && (
                <TaskModal
                    task={selectedTask}
                    isOpen={showTaskModal}
                    onClose={() => setShowTaskModal(false)}
                    onTaskUpdated={handleTaskUpdated}
                />
            )}
        </div>
    );
}

export default TasksPage;