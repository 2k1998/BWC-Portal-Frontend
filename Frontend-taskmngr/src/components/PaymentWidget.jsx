// src/components/PaymentWidget.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { paymentApi } from '../api/apiService';
import { 
    DollarSign, 
    Banknote, 
    CheckCircle, 
    Briefcase, 
    AlertCircle, 
    AlertTriangle, 
    Calendar, 
    CreditCard 
} from 'lucide-react';
import '../styles/PaymentWidget.css';
// REMOVED: import CarFinanceWidget from './CarFinanceWidget';

const PaymentWidget = () => {
    const { accessToken, isAdmin } = useAuth();
    const { t } = useLanguage();
    const [loading, setLoading] = useState(true);
    const [paymentData, setPaymentData] = useState({
        upcomingPayments: [],
        overduePayments: [],
        totalPending: 0,
        totalPaid: 0,
        currentMonthCommissions: 0,
        employeeSummaries: []
    });

    useEffect(() => {
        const fetchPaymentData = async () => {
            try {
                setLoading(true);
                
                // Fetch payments
                const payments = await paymentApi.getPayments(accessToken, {
                    limit: 100,
                    status_filter: 'pending'
                });
                
                // Fetch dashboard summary
                const summary = await paymentApi.getDashboardSummary(accessToken) || {};
                
                // Process payments
                const now = new Date();
                const upcoming = [];
                const overdue = [];
                let totalPending = 0;
                
                payments.forEach(payment => {
                    const dueDate = new Date(payment.due_date);
                    if (payment.status === 'pending') {
                        totalPending += parseFloat(payment.amount);
                        if (dueDate < now) {
                            overdue.push(payment);
                        } else {
                            upcoming.push(payment);
                        }
                    }
                });
                
                setPaymentData({
                    upcomingPayments: upcoming.slice(0, 5),
                    overduePayments: overdue.slice(0, 5),
                    totalPending: totalPending,
                    totalPaid: summary.total_paid_this_month || 0,
                    currentMonthCommissions: summary.total_commissions_this_month || 0,
                    employeeSummaries: summary.employee_summaries || []
                });
            } catch (error) {
                console.error('Error fetching payment data:', error);
            } finally {
                setLoading(false);
            }
        };

        if (accessToken) {
            fetchPaymentData();
        }
    }, [accessToken]);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'EUR',
            minimumFractionDigits: 2
        }).format(amount || 0);
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    if (loading) {
        return (
            <div className="payment-widget loading">
                <div className="loading-spinner">{t('loading_payment_data')}</div>
            </div>
        );
    }

    return (
        <div className="payment-widget">
            <div className="widget-header">
                <h2><DollarSign size={24} /> Financial Overview</h2>
                <div className="header-actions">
                    <button 
                        className="view-all-btn"
                        onClick={() => window.location.href = '/payments'}
                    >
                        View All Payments
                    </button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="payment-summary-cards">
                <div className="summary-card">
                    <Banknote className="card-icon" size={24} />
                    <div className="card-content">
                        <div className="card-label">{t('total_pending')}</div>
                        <div className="card-value">{formatCurrency(paymentData.totalPending)}</div>
                    </div>
                </div>
                
                <div className="summary-card">
                    <CheckCircle className="card-icon" size={24} />
                    <div className="card-content">
                        <div className="card-label">{t('paid_this_month')}</div>
                        <div className="card-value">{formatCurrency(paymentData.totalPaid)}</div>
                    </div>
                </div>
                
                {isAdmin && (
                    <div className="summary-card">
                        <Briefcase className="card-icon" size={24} />
                        <div className="card-content">
                            <div className="card-label">Commissions (Month)</div>
                            <div className="card-value">{formatCurrency(paymentData.currentMonthCommissions)}</div>
                        </div>
                    </div>
                )}
            </div>

            {/* Overdue Payments */}
            {paymentData.overduePayments.length > 0 && (
                <div className="overdue-payments">
                    <h3><AlertCircle size={20} /> {t('overdue')} {t('payments')}</h3>
                    <div className="payment-list">
                        {paymentData.overduePayments.map(payment => (
                            <div key={payment.id} className="payment-item overdue">
                                <AlertTriangle className="payment-icon" size={20} />
                                <div className="payment-info">
                                    <div className="payment-title">{payment.title}</div>
                                    <div className="payment-details">
                                        {payment.description}
                                    </div>
                                </div>
                                <div className="payment-amount-section">
                                    <div className="payment-amount overdue">{formatCurrency(payment.amount)}</div>
                                    <div className="payment-date">
                                        {t('overdue_since')} {formatDate(payment.due_date)}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Upcoming Payments */}
            <div className="upcoming-payments">
                <h3><Calendar size={20} /> {t('upcoming_payments')}</h3>
                {paymentData.upcomingPayments.length === 0 ? (
                    <p className="no-payments">{t('no_upcoming_payments')}</p>
                ) : (
                    <div className="payment-list">
                        {paymentData.upcomingPayments.map(payment => (
                            <div key={payment.id} className="payment-item">
                                <CreditCard className="payment-icon" size={20} />
                                <div className="payment-info">
                                    <div className="payment-title">{payment.title}</div>
                                    <div className="payment-details">
                                        {payment.description}
                                    </div>
                                </div>
                                <div className="payment-amount-section">
                                    <div className="payment-amount">{formatCurrency(payment.amount)}</div>
                                    <div className="payment-date">
                                        Due: {formatDate(payment.due_date)}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Employee Commission Summary */}
            {paymentData.employeeSummaries.length > 0 && (
                <div className="employee-commissions">
                    <h3>Employee Commissions (This Month)</h3>
                    <div className="commission-list">
                        {paymentData.employeeSummaries.map(employee => (
                            <div key={employee.employee_id} className="commission-item">
                                <div className="commission-employee">
                                    {employee.employee_name}
                                </div>
                                <div className="commission-details">
                                    <span className="commission-sales">
                                        Sales: {formatCurrency(employee.current_month_sales)}
                                    </span>
                                    <span className="commission-amount">
                                        Commission: {formatCurrency(employee.current_month_commission)}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* REMOVED: Car Finance Widget section */}
        </div>
    );
};

export default PaymentWidget;