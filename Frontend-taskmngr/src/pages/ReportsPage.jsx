// src/pages/ReportsPage.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { reportsApi } from '../api/apiService';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement } from 'chart.js';
import { Bar, Pie, Line } from 'react-chartjs-2';
import './Reports.css';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement);

function ReportsPage() {
    const { accessToken } = useAuth();
    const { t } = useLanguage();
    const [tasksPerCompany, setTasksPerCompany] = useState(null);
    const [carStatus, setCarStatus] = useState(null);
    const [tasksTimeline, setTasksTimeline] = useState(null);
    const [userTaskStats, setUserTaskStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState(null);

    const fetchReports = async () => {
        if (!accessToken) return;
        try {
            setLoading(true);
                const [tasksCompanyData, carStatusData, tasksTimelineData, userStatsData, debugData] = await Promise.all([
                    reportsApi.getTasksPerCompany(accessToken),
                    reportsApi.getRentalCarStatus(accessToken),
                    reportsApi.getTasksCompletedTimeline(accessToken),
                    reportsApi.getUserTaskStatistics(accessToken),
                    reportsApi.debugTasks(accessToken),
                ]);

                console.log("Raw API data:", {
                    tasksCompanyData,
                    carStatusData,
                    tasksTimelineData,
                    userStatsData,
                    debugData
                });

                setTasksPerCompany({
                    labels: tasksCompanyData?.map(d => d.company_name) || [],
                    datasets: [{
                        label: t('active_tasks'),
                        data: tasksCompanyData?.map(d => d.task_count) || [],
                        backgroundColor: 'rgba(184, 134, 11, 0.6)',
                        borderColor: 'rgba(184, 134, 11, 1)',
                        borderWidth: 1,
                    }],
                });

                setCarStatus({
                    labels: carStatusData?.map(d => t(d.status.toLowerCase())) || [],
                    datasets: [{
                        data: carStatusData?.map(d => d.count) || [],
                        backgroundColor: ['#e74c3c', '#2ecc71'],
                        hoverBackgroundColor: ['#c0392b', '#27ae60'],
                    }],
                });

                setTasksTimeline({
                    labels: tasksTimelineData?.map(d => d.date) || [],
                    datasets: [{
                        label: t('completed_tasks'),
                        data: tasksTimelineData?.map(d => d.count) || [],
                        fill: false,
                        borderColor: 'rgb(75, 192, 192)',
                        tension: 0.1,
                    }],
                });

                // Process user task statistics
                setUserTaskStats({
                    ownedTasks: {
                        labels: userStatsData?.map(d => d.user_name) || [],
                        datasets: [{
                            label: t('owned_tasks') || 'Owned Tasks',
                            data: userStatsData?.map(d => d.owned_tasks) || [],
                            backgroundColor: 'rgba(99, 102, 241, 0.6)',
                            borderColor: 'rgba(99, 102, 241, 1)',
                            borderWidth: 1,
                        }],
                    },
                    createdTasks: {
                        labels: userStatsData?.map(d => d.user_name) || [],
                        datasets: [{
                            label: t('created_tasks') || 'Created Tasks',
                            data: userStatsData?.map(d => d.created_tasks) || [],
                            backgroundColor: 'rgba(34, 197, 94, 0.6)',
                            borderColor: 'rgba(34, 197, 94, 1)',
                            borderWidth: 1,
                        }],
                    },
                });

            } catch (error) {
                console.error("Failed to fetch reports data:", error);
                console.error("Error details:", error.message);
                console.error("Stack trace:", error.stack);
            } finally {
                setLoading(false);
                setLastUpdated(new Date());
            }
        };

    useEffect(() => {
        fetchReports();
        
        // Auto-refresh every 30 seconds for live updates
        const interval = setInterval(fetchReports, 30000);
        return () => clearInterval(interval);
    }, [accessToken, t]);

    const handleRefresh = () => {
        fetchReports();
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { position: 'top' },
        },
    };

    if (loading) {
        return <div className="loading-spinner">{t('loading')}</div>;
    }

    return (
        <div className="reports-container">
            <div className="reports-header">
                <h1>{t('reports')}</h1>
                <div className="reports-controls">
                    <button 
                        onClick={handleRefresh} 
                        disabled={loading}
                        className="refresh-button"
                    >
                        {loading ? t('refreshing') || 'Refreshing...' : t('refresh') || 'Refresh'}
                    </button>
                    {lastUpdated && (
                        <span className="last-updated">
                            {t('last_updated') || 'Last updated'}: {lastUpdated.toLocaleTimeString()}
                        </span>
                    )}
                </div>
            </div>
            <div className="reports-grid">
                <div className="report-card">
                    <h2>{t('active_tasks_per_company') || 'Active Tasks per Company'}</h2>
                    <div className="chart-container">
                        {tasksPerCompany && <Bar options={chartOptions} data={tasksPerCompany} />}
                    </div>
                </div>
                <div className="report-card">
                    <h2>{t('car_rental_status') || 'Car Rental Status'}</h2>
                    <div className="chart-container pie-chart">
                        {carStatus && <Pie options={{ ...chartOptions, maintainAspectRatio: false }} data={carStatus} />}
                    </div>
                </div>
                <div className="report-card full-width">
                    <h2>{t('completed_tasks_last_30_days') || 'Completed Tasks (Last 30 Days)'}</h2>
                    <div className="chart-container">
                        {tasksTimeline && <Line options={chartOptions} data={tasksTimeline} />}
                    </div>
                </div>
                
                {/* New User Task Statistics Charts */}
                <div className="report-card">
                    <h2>{t('tasks_owned_by_users') || 'Tasks Owned by Users'}</h2>
                    <div className="chart-container">
                        {userTaskStats && <Bar options={chartOptions} data={userTaskStats.ownedTasks} />}
                    </div>
                </div>
                
                <div className="report-card">
                    <h2>{t('tasks_created_by_users') || 'Tasks Created by Users'}</h2>
                    <div className="chart-container">
                        {userTaskStats && <Bar options={chartOptions} data={userTaskStats.createdTasks} />}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ReportsPage;