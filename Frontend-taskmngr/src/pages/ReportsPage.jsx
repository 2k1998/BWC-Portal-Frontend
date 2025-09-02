// src/pages/ReportsPage.jsx
import React, { useState, useEffect } from 'react';
import useAuth from '../context/useAuth';
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
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchReports = async () => {
            if (!accessToken) return;
            try {
                setLoading(true);
                const [tasksCompanyData, carStatusData, tasksTimelineData] = await Promise.all([
                    reportsApi.getTasksPerCompany(accessToken),
                    reportsApi.getRentalCarStatus(accessToken),
                    reportsApi.getTasksCompletedTimeline(accessToken),
                ]);

                setTasksPerCompany({
                    labels: tasksCompanyData.map(d => d.company_name),
                    datasets: [{
                        label: t('active_tasks'),
                        data: tasksCompanyData.map(d => d.task_count),
                        backgroundColor: 'rgba(184, 134, 11, 0.6)',
                        borderColor: 'rgba(184, 134, 11, 1)',
                        borderWidth: 1,
                    }],
                });

                setCarStatus({
                    labels: carStatusData.map(d => t(d.status.toLowerCase())),
                    datasets: [{
                        data: carStatusData.map(d => d.count),
                        backgroundColor: ['#e74c3c', '#2ecc71'],
                        hoverBackgroundColor: ['#c0392b', '#27ae60'],
                    }],
                });

                setTasksTimeline({
                    labels: tasksTimelineData.map(d => d.date),
                    datasets: [{
                        label: t('completed_tasks'),
                        data: tasksTimelineData.map(d => d.count),
                        fill: false,
                        borderColor: 'rgb(75, 192, 192)',
                        tension: 0.1,
                    }],
                });

            } catch (error) {
                console.error("Failed to fetch reports data:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchReports();
    }, [accessToken, t]);

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
            <h1>{t('reports')}</h1>
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
            </div>
        </div>
    );
}

export default ReportsPage;