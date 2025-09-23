// src/pages/DashboardPage.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { calendarApi, taskApi, eventApi } from '../api/apiService';
import { useNotification } from '../context/NotificationContext';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import enUS from 'date-fns/locale/en-US';
import el from 'date-fns/locale/el';
import addMonths from 'date-fns/addMonths';
import subMonths from 'date-fns/subMonths';
import 'react-big-calendar/lib/css/react-big-calendar.css';

import EventModal from '../components/EventModal';
import LanguageModal from '../components/LanguageModal';
import './CalendarDashboard.css';
import './DashboardTasks.css';

// Expose BOTH locales so weekday & month names translate correctly
const locales = { en: enUS, el };

function DashboardPage() {
  const { currentUser, accessToken, loading: authLoading } = useAuth();
  const { showNotification } = useNotification();
  const { language, t } = useLanguage();
  const navigate = useNavigate();

  // Create the localizer with the full locales map (culture decides which one is used)
  const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });

  const [calendarEvents, setCalendarEvents] = useState([]);
  const [allMyTasks, setAllMyTasks] = useState([]);
  const [loadingContent, setLoadingContent] = useState(true);
  const [upcomingEvent, setUpcomingEvent] = useState(null);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [isLanguageModalOpen, setIsLanguageModalOpen] = useState(false);
  const [currentView, setCurrentView] = useState('month');
  const [currentDate, setCurrentDate] = useState(new Date());

  const isAdmin = currentUser?.role === 'admin';

  const fetchDashboardData = useCallback(async () => {
    if (!accessToken) return;
    setLoadingContent(true);
    try {
      const [calEvents, tasks] = await Promise.all([
        calendarApi.getCalendarEvents(accessToken),
        taskApi.getTasks(accessToken),
      ]);

      const formattedEvents = calEvents.map((ev) => ({
        title: ev.title,
        start: new Date(ev.start),
        end: new Date(ev.end),
        allDay: ev.allDay,
        resource: ev,
      }));
      setCalendarEvents(formattedEvents);
      setAllMyTasks(tasks);
    } catch (err) {
      showNotification(err.message || 'Failed to load dashboard content.', 'error');
    } finally {
      setLoadingContent(false);
    }
  }, [accessToken, showNotification]);

  useEffect(() => {
    const checkModals = async () => {
      const langPref = localStorage.getItem('languagePreference');
      if (!langPref) {
        setIsLanguageModalOpen(true);
        return;
      }
      if (!isAdmin && accessToken) {
        try {
          const event = await eventApi.getUpcomingEvent(accessToken);
          if (event) {
            setUpcomingEvent(event);
            setIsEventModalOpen(true);
          }
        } catch {
          // Silent fail for event modal
        }
      }
    };

    if (!authLoading && accessToken) {
      fetchDashboardData();
      checkModals();
    }
  }, [authLoading, accessToken, fetchDashboardData, isAdmin]);

  const handleCategoryClick = (category) => {
    navigate(`/tasks?filter=${category}`);
  };

  const categorizedTasks = useMemo(() => {
    const categories = {
      new: allMyTasks.filter((task) => task.status === 'new'),
      inProgress: allMyTasks.filter((task) => ['received', 'on_process'].includes(task.status)),
      pending: allMyTasks.filter((task) => task.status === 'pending'),
      completed: allMyTasks.filter((task) => task.status === 'completed'),
      looseEnd: allMyTasks.filter((task) => task.status === 'loose_end'),
      // Priority categories
      urgentImportant: allMyTasks.filter((task) => task.urgency && task.important && !task.completed),
      urgentOnly: allMyTasks.filter((task) => task.urgency && !task.important && !task.completed),
      importantOnly: allMyTasks.filter((task) => !task.urgency && task.important && !task.completed),
      normal: allMyTasks.filter((task) => !task.urgency && !task.important && !task.completed),
      allDayDeadline: allMyTasks.filter((task) => task.deadline_all_day && !task.completed),
    };
    return categories;
  }, [allMyTasks]);

  const renderTaskListCard = (tasks, titleKey, categoryClass) => (
    <div className={`task-category-card ${categoryClass}`}>
      <h3>
        {t(titleKey)} ({tasks.length})
      </h3>
      {tasks.length === 0 ? (
        <p>{t('no_tasks_in_category')}</p>
      ) : (
        <ul className="task-category-list">
          {tasks.slice(0, 5).map((task) => (
            <li key={task.id} className="task-category-list-item">
              <span className="task-category-title">{task.title}</span>
              {task.deadline && (
                <span className="task-category-deadline">
                  {' '}
                  ({t('deadline')}:{' '}
                  {format(new Date(task.deadline), 'PP', { locale: locales[language] })})
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  if (authLoading || loadingContent) {
    return <div className="loading-spinner fade-in">{t('loading')}</div>;
  }

  return (
    <div className="dashboard-container">
      <LanguageModal isOpen={isLanguageModalOpen} onClose={() => setIsLanguageModalOpen(false)} />
      <EventModal
        isOpen={isEventModalOpen && !isLanguageModalOpen}
        onClose={() => setIsEventModalOpen(false)}
        event={upcomingEvent}
      />

      <header className="dashboard-header">
        <div className="welcome-section">
          <h1 className="dashboard-title">
            {t('welcome_back')}, {currentUser?.first_name || 'User'}!
          </h1>
          <p className="dashboard-subtitle">{t('dashboard_intro')}</p>
        </div>
        <div className="dashboard-actions">
          <button 
            className="btn btn-primary btn-sm"
            onClick={() => navigate('/tasks')}
            aria-label={(t('view_all_tasks') && t('view_all_tasks') !== 'view_all_tasks') ? t('view_all_tasks') : (language === 'el' ? 'Προβολή Όλων των Εργασιών' : 'View All Tasks')}
          >
            {(t('view_all_tasks') && t('view_all_tasks') !== 'view_all_tasks') ? t('view_all_tasks') : (language === 'el' ? 'Προβολή Όλων των Εργασιών' : 'View All Tasks')}
          </button>
        </div>
      </header>

      <div className="dashboard-grid-container">
        {/* Row 1: Urgent & Important | Urgent */}
        <div className="dashboard-row">
          <div className="clickable-card" onClick={() => handleCategoryClick('urgentImportant')}>
            {renderTaskListCard(categorizedTasks.urgentImportant, 'urgent_important', 'red-category')}
          </div>
          <div className="clickable-card" onClick={() => handleCategoryClick('urgentOnly')}>
            {renderTaskListCard(categorizedTasks.urgentOnly, 'urgent', 'blue-category')}
          </div>
        </div>

        {/* Row 2: Important | All Day Deadlines */}
        <div className="dashboard-row">
          <div className="clickable-card" onClick={() => handleCategoryClick('importantOnly')}>
            {renderTaskListCard(categorizedTasks.importantOnly, 'important', 'green-category')}
          </div>
          <div className="clickable-card" onClick={() => handleCategoryClick('allDayDeadline')}>
            {renderTaskListCard(
              categorizedTasks.allDayDeadline,
              'all_day_deadlines',
              'orange-category'
            )}
          </div>
        </div>

        {/* Row 3: Not Urgent, Not Important | Calendar */}
        <div className="dashboard-row">
          <div className="clickable-card" onClick={() => handleCategoryClick('normal')}>
            {renderTaskListCard(categorizedTasks.normal, 'normal', 'yellow-category')}
          </div>
          <div className="dashboard-calendar-wrapper">
          <div className="custom-month-navigation">
            <button onClick={() => setCurrentDate(subMonths(currentDate, 1))} className="nav-arrow-button">
              &lt;
            </button>
            <span className="current-month-display">
              {format(currentDate, 'MMMM yyyy', { locale: locales[language] })}
            </span>
            <button onClick={() => setCurrentDate(addMonths(currentDate, 1))} className="nav-arrow-button">
              &gt;
            </button>
            <button onClick={() => setCurrentDate(new Date())} className="nav-today-button">
              {t('today')}
            </button>
          </div>

          <div className="custom-calendar-toolbar">
            <button onClick={() => setCurrentView('month')} className={currentView === 'month' ? 'active' : ''}>
              {t('month')}
            </button>
            <button onClick={() => setCurrentView('week')} className={currentView === 'week' ? 'active' : ''}>
              {t('week')}
            </button>
            <button onClick={() => setCurrentView('day')} className={currentView === 'day' ? 'active' : ''}>
              {t('day')}
            </button>
            <button onClick={() => setCurrentView('agenda')} className={currentView === 'agenda' ? 'active' : ''}>
              {t('agenda')}
            </button>
          </div>

          <Calendar
            localizer={localizer}
            culture={language} // ensure weekday/month labels switch with language
            events={calendarEvents}
            startAccessor="start"
            endAccessor="end"
            style={{ height: 500 }}
            view={currentView}
            date={currentDate}
            onNavigate={setCurrentDate}
            onView={setCurrentView}
            messages={{
              today: t('today'),
              previous: t('previous'),
              next: t('next'),
              month: t('month'),
              week: t('week'),
              day: t('day'),
              agenda: t('agenda'),
            }}
          />
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;

