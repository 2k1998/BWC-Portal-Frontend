// src/pages/TasksPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { taskApi, companyApi } from '../api/apiService';
import { useNotification } from '../context/NotificationContext';
import TaskForm from '../components/TaskForm';
import TaskStatusUpdate from '../components/TaskStatusUpdate';
import TaskModal from '../components/TaskModal';
import TaskTransferModal from '../components/TaskTransferModal';
import TaskFilterMenu from '../components/TaskFilterMenu';
import './Tasks.css';

function TasksPage() {
  const { accessToken, loading: authLoading, currentUser } = useAuth();
  const { showNotification } = useNotification();
  const { language, t } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();

  const [allTasks, setAllTasks] = useState([]);
  const [completedTasks, setCompletedTasks] = useState([]);
  const [filteredActiveTasks, setFilteredActiveTasks] = useState([]);
  const [filteredCompletedTasks, setFilteredCompletedTasks] = useState([]);
  const [activeFilter, setActiveFilter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [taskToTransfer, setTaskToTransfer] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [serverFilters, setServerFilters] = useState({});

  const fetchTasks = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const fetchedTasks = await taskApi.getTasks(accessToken, serverFilters);
      setAllTasks(Array.isArray(fetchedTasks) ? fetchedTasks : fetchedTasks?.results || []);
    } catch (err) {
      showNotification(err.message || t('failed_to_fetch_tasks') || 'Failed to fetch tasks', 'error');
    } finally {
      setLoading(false);
    }
  }, [accessToken, serverFilters, showNotification, t]);

  const fetchCompletedTasks = useCallback(async () => {
    if (!accessToken) return;
    try {
      const fetched = await taskApi.getCompletedTasks(accessToken, { days: 30 });
      setCompletedTasks(Array.isArray(fetched) ? fetched : fetched?.results || []);
    } catch (err) {
      console.error(err);
      showNotification(err.message || t('failed_to_fetch_tasks') || 'Failed to fetch tasks', 'error');
    }
  }, [accessToken, showNotification, t]);

  useEffect(() => {
    if (!authLoading && accessToken) {
      fetchTasks();
      fetchCompletedTasks();
    }
  }, [accessToken, authLoading, fetchTasks, fetchCompletedTasks]);

  useEffect(() => {
    if (!accessToken) return;
    companyApi
      .getAll(accessToken)
      .then((fetchedCompanies) => setCompanies(Array.isArray(fetchedCompanies) ? fetchedCompanies : []))
      .catch(() => setCompanies([]));
  }, [accessToken]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const filter = params.get('filter');
    setActiveFilter(filter);
  }, [location.search]);

  const applyServerFilters = useCallback(
    (tasks) => {
      if (!serverFilters || Object.keys(serverFilters).length === 0) return tasks;

      return tasks.filter((task) => {
        if (serverFilters.company_id && String(task.company_id) !== String(serverFilters.company_id)) {
          return false;
        }
        if (serverFilters.user_id && String(task.owner_id) !== String(serverFilters.user_id)) {
          return false;
        }
        if (serverFilters.user_name) {
          const ownerName = (
            task.owner?.full_name ||
            `${task.owner?.first_name || ''} ${task.owner?.surname || ''}`.trim() ||
            task.owner?.username ||
            ''
          ).toLowerCase();
          if (!ownerName.includes(serverFilters.user_name.toLowerCase())) {
            return false;
          }
        }

        if (serverFilters.importance) {
          switch (serverFilters.importance) {
            case 'urgent':
              if (!(task.urgency && !task.important)) return false;
              break;
            case 'important':
              if (!(!task.urgency && task.important)) return false;
              break;
            case 'urgent_important':
              if (!(task.urgency && task.important)) return false;
              break;
            case 'none':
              if (task.urgency || task.important) return false;
              break;
            default:
              break;
          }
        }

        return true;
      });
    },
    [serverFilters]
  );

  const applyQuickFilter = useCallback((tasks) => {
    if (!activeFilter) return tasks;

    return tasks.filter((task) => {
      switch (activeFilter) {
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
  }, [activeFilter]);

  const applyStatusFilter = useCallback(
    (tasks) => {
      if (statusFilter === 'all') return tasks;
      return tasks.filter((task) => String(task.status).toLowerCase() === statusFilter);
    },
    [statusFilter]
  );

  useEffect(() => {
    const activeBase = applyServerFilters(allTasks.filter((task) => !task.completed));
    const quickFiltered = applyQuickFilter(activeBase);
    setFilteredActiveTasks(applyStatusFilter(quickFiltered));
  }, [allTasks, applyServerFilters, applyQuickFilter, applyStatusFilter]);

  useEffect(() => {
    const completedBase = applyServerFilters(completedTasks);
    const quickFiltered = applyQuickFilter(completedBase);
    setFilteredCompletedTasks(applyStatusFilter(quickFiltered));
  }, [completedTasks, applyServerFilters, applyQuickFilter, applyStatusFilter]);

  const handleCreateTask = async (taskData) => {
    try {
      await taskApi.createTask(taskData, accessToken);
      showNotification(t('task_created_success') || 'Task created successfully', 'success');
      fetchTasks();
      setShowCreateForm(false);
    } catch (err) {
      showNotification(err.message || t('failed_to_create_task') || 'Failed to create task', 'error');
    }
  };

  const handleToggleCompleted = async (taskId, currentCompletedStatus) => {
    try {
      await taskApi.updateTask(taskId, { completed: !currentCompletedStatus }, accessToken);
      showNotification(
        !currentCompletedStatus
          ? t('task_marked_completed') || 'Task marked as completed'
          : t('task_marked_incomplete') || 'Task marked as incomplete',
        'success'
      );
      fetchTasks();
      fetchCompletedTasks();
    } catch (err) {
      showNotification(err.message || t('failed_to_update_task_status') || 'Failed to update task status', 'error');
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (window.confirm(t('confirm_delete_task') || 'Are you sure you want to delete this task?')) {
      try {
        await taskApi.deleteTask(taskId, accessToken);
        showNotification(t('task_deleted_success') || 'Task deleted successfully', 'success');
        fetchTasks();
        fetchCompletedTasks();
      } catch (err) {
        showNotification(err.message || t('failed_to_delete_task') || 'Failed to delete task', 'error');
      }
    }
  };

  const openTaskModal = async (task) => {
    setSelectedTask(task);
    setShowTaskModal(true);
    try {
      const taskDetails = await taskApi.getTaskById(task.id, accessToken);
      setSelectedTask(taskDetails);
    } catch (err) {
      showNotification(err.message || t('failed_to_fetch_task_details') || 'Failed to fetch task details', 'error');
    }
  };

  const handleTaskUpdated = () => {
    fetchTasks();
    fetchCompletedTasks();
    if (selectedTask) {
      openTaskModal(selectedTask);
    }
  };

  const handleTransferTask = (task) => {
    setTaskToTransfer(task);
    setShowTransferModal(true);
  };

  const handleTransferSuccess = () => {
    fetchTasks();
    fetchCompletedTasks();
    setShowTransferModal(false);
    setTaskToTransfer(null);
  };

  const canTransferTask = (task) => task.owner_id === currentUser?.id;

  if (authLoading || loading) {
    return <div className="loading-spinner fade-in">{t('loading')}</div>;
  }

  return (
    <div className="tasks-container">
      <TaskFilterMenu token={accessToken} value={serverFilters} onChange={setServerFilters} />

      <div className="tasks-header">
        <h1>{t('my_tasks')}</h1>
        <div className="header-actions">
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="create-task-btn"
          >
            <span className="btn-icon">+</span>
            {showCreateForm
              ? (language === 'el' ? 'Απόκρυψη Φόρμας' : (t('hide_form') || 'Hide Form'))
              : (language === 'el' ? 'Δημιουργία Νέας Εργασίας' : (t('create_new_task') || 'Create New Task'))}
          </button>
        </div>
      </div>

      {showCreateForm && (
        <div className="create-task-panel">
          <TaskForm
            onSubmit={handleCreateTask}
            submitButtonText={t('create_task') || 'Create Task'}
            onCancel={() => setShowCreateForm(false)}
          />
        </div>
      )}

      {/* Status filter and quick filters remain unchanged */}
      <div className="filter-section">
        <div className="filter-controls">
          <div className="filter-group">
            <label className="filter-label">{t('filter_by_status')}:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="status-filter"
            >
              <option value="all">{t('all_statuses') || 'All Statuses'}</option>
              <option value="new">{t('status_new') || 'New'}</option>
              <option value="received">{t('status_received') || 'Received'}</option>
              <option value="on_process">{t('status_on_process') || 'On Process'}</option>
              <option value="pending">{t('status_pending') || 'Pending'}</option>
              <option value="completed">{t('status_completed') || 'Completed'}</option>
              <option value="loose_end">{t('status_loose_end') || 'Loose End'}</option>
            </select>
          </div>

          <div className="filter-group">
            <label className="filter-label">{t('quick_filters')}:</label>
            <div className="quick-filters">
              <button
                className={`quick-filter-btn urgent-important ${activeFilter === 'urgentImportant' ? 'active' : ''}`}
                onClick={() => navigate('/tasks?filter=urgentImportant')}
              >
                {t('urgent_important')}
              </button>
              <button
                className={`quick-filter-btn urgent-only ${activeFilter === 'urgentOnly' ? 'active' : ''}`}
                onClick={() => navigate('/tasks?filter=urgentOnly')}
              >
                {t('urgent_only')}
              </button>
              <button
                className={`quick-filter-btn important-only ${activeFilter === 'importantOnly' ? 'active' : ''}`}
                onClick={() => navigate('/tasks?filter=importantOnly')}
              >
                {t('important_only')}
              </button>
              <button
                className={`quick-filter-btn all-day ${activeFilter === 'allDayDeadline' ? 'active' : ''}`}
                onClick={() => navigate('/tasks?filter=allDayDeadline')}
              >
                {t('all_day_tasks')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* same rendering logic below */}
      {/* Active tasks */}
      <div className="active-tasks-section">
        <h2>
          {t('active_tasks')} ({filteredActiveTasks.length})
        </h2>
        <div className="task-list">
          {filteredActiveTasks.length === 0 ? (
            <p>{t('no_active_tasks')}</p>
          ) : (
            filteredActiveTasks.map((task) => (
                <div
                  key={task.id}
                  className={`task-item${task.urgency && task.important ? ' urgent-important-highlight' : ''}`}
                  onClick={() => openTaskModal(task)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="task-status-info">
                    <TaskStatusUpdate task={task} compact={true} />
                  </div>
                  <h3>{task.title}</h3>
                  <p>{task.description}</p>
                  {task.start_date && (
                    <p>
                      {t('starts')}: {new Date(task.start_date).toLocaleString()}
                    </p>
                  )}
                  {task.deadline && (
                    <p>
                      {t('deadline')}: {new Date(task.deadline).toLocaleString()}
                    </p>
                  )}
                  <div className="task-badges">
                    {task.urgency && task.important ? (
                      <span className="badge urgent-and-important">{t('urgent_important')}</span>
                    ) : task.urgency ? (
                      <span className="badge urgent-only">{t('urgent')}</span>
                    ) : task.important ? (
                      <span className="badge important-only">{t('important')}</span>
                    ) : (
                      <span className="badge not-urgent-not-important">{t('normal')}</span>
                    )}
                    <span className={`badge status-${String(task.status).toLowerCase().replace(/\s+/g, '_')}`}>
                      {t('status')}: {t(`status_${String(task.status).toLowerCase().replace(/\s+/g, '_')}`) || task.status}
                    </span>
                  </div>

                  <div className="task-ownership-info">
                    {task.owner && (
                      <div className="ownership-item">
                        <span className="ownership-label">{t('owner') || 'Owner'}:</span>
                        <span className="ownership-value owner">
                          {task.owner.full_name ||
                            `${task.owner.first_name || ''} ${task.owner.surname || ''}`.trim() ||
                            task.owner.email}
                        </span>
                      </div>
                    )}
                    {task.created_by && task.created_by.id !== task.owner?.id && (
                      <div className="ownership-item">
                        <span className="ownership-label">{t('created_by') || 'Created by'}:</span>
                        <span className="ownership-value creator">
                          {task.created_by.full_name ||
                            `${task.created_by.first_name || ''} ${task.created_by.surname || ''}`.trim() ||
                            task.created_by.email}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="task-actions">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleCompleted(task.id, task.completed);
                      }}
                      className="action-button mark-complete"
                    >
                      {t('mark_complete')}
                    </button>
                    {canTransferTask(task) && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTransferTask(task);
                        }}
                        className="action-button transfer-button"
                      >
                        {t('transfer_task') || 'Transfer'}
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteTask(task.id);
                      }}
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

      {/* Completed tasks */}
      <div className="completed-tasks-section">
        <h2>
          {t('completed_tasks')} ({filteredCompletedTasks.length})
        </h2>
        <div className="task-list">
          {filteredCompletedTasks.length === 0 ? (
            <p>{t('no_completed_tasks') || t('no_completed_tasks_yet') || 'No completed tasks yet.'}</p>
          ) : (
            filteredCompletedTasks.map((task) => (
              <div key={task.id} className="task-item completed">
                <h3>{task.title}</h3>
                <p>{task.description}</p>
                {task.deadline && (
                  <p>
                    {t('deadline')}: {new Date(task.deadline).toLocaleString()}
                  </p>
                )}
                <div className="task-actions">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleCompleted(task.id, task.completed);
                    }}
                    className="action-button mark-incomplete"
                  >
                    {t('mark_incomplete')}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteTask(task.id);
                    }}
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
          isOpen={showTaskModal}
          task={selectedTask}
          onClose={() => setShowTaskModal(false)}
          accessToken={accessToken}
          companies={companies}
          onUpdated={handleTaskUpdated}
        />
      )}

      {showTransferModal && taskToTransfer && (
        <TaskTransferModal
          task={taskToTransfer}
          isOpen={showTransferModal}
          onClose={() => {
            setShowTransferModal(false);
            setTaskToTransfer(null);
          }}
          onTransferSuccess={handleTransferSuccess}
        />
      )}
    </div>
  );
}

export default TasksPage;
