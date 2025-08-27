// src/pages/PaymentsPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { paymentApi } from '../api/PaymentAPI';
import { authApi, companyApi } from '../api/apiService';
import '../styles/PaymentsPage.css';

const PaymentsPage = () => {
    const { accessToken } = useAuth();
    const { t } = useLanguage();
    const [loading, setLoading] = useState(true);
    const [payments, setPayments] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [companies, setCompanies] = useState([]);
    const [filters, setFilters] = useState({
        payment_type_filter: '',
        status_filter: '',
        employee_id: '',
        company_id: '',
        from_date: '',
        to_date: '',
        search: ''
    });
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedPayment, setSelectedPayment] = useState(null);
    const [statistics, setStatistics] = useState({
        totalPending: 0,
        totalPaid: 0,
        totalOverdue: 0,
        monthlyIncome: 0,
        monthlyExpenses: 0
    });
    const [newPayment, setNewPayment] = useState({
        title: '',
        description: '',
        amount: 0,
        currency: 'EUR',
        payment_type: 'salary',
        due_date: new Date().toISOString().split('T')[0],
        employee_id: null,
        company_id: null,
        category: '',
        notes: ''
    });

    // Define fetchPayments with useCallback
    const fetchPayments = useCallback(async () => {
        if (!accessToken) return;
        
        try {
            const params = {};
            Object.keys(filters).forEach(key => {
                if (filters[key]) {
                    params[key] = filters[key];
                }
            });
            
            const data = await paymentApi.getPayments(accessToken, params);
            const paymentsArray = Array.isArray(data) ? data : [];
            setPayments(paymentsArray);
            
            // Calculate statistics
            const now = new Date();
            const currentMonth = now.getMonth();
            const currentYear = now.getFullYear();
            
            let stats = {
                totalPending: 0,
                totalPaid: 0,
                totalOverdue: 0,
                monthlyIncome: 0,
                monthlyExpenses: 0
            };
            
            paymentsArray.forEach(payment => {
                if (!payment || !payment.due_date) return;
                
                const paymentDate = new Date(payment.due_date);
                const paymentMonth = paymentDate.getMonth();
                const paymentYear = paymentDate.getFullYear();
                const amount = parseFloat(payment.amount) || 0;
                
                // Calculate totals by status
                if (payment.status === 'pending') {
                    stats.totalPending += amount;
                    if (paymentDate < now) {
                        stats.totalOverdue += amount;
                    }
                } else if (payment.status === 'paid') {
                    stats.totalPaid += amount;
                }
                
                // Calculate monthly income/expenses for current month
                if (paymentMonth === currentMonth && paymentYear === currentYear) {
                    if (payment.is_income) {
                        stats.monthlyIncome += amount;
                    } else if (payment.is_expense) {
                        stats.monthlyExpenses += amount;
                    }
                }
            });
            
            setStatistics(stats);
        } catch (error) {
            console.error('Error fetching payments:', error);
            setPayments([]);
        }
    }, [filters, accessToken]);

    // Define fetchInitialData with useCallback
    const fetchInitialData = useCallback(async () => {
        if (!accessToken) return;
        
        try {
            setLoading(true);
            const [usersData, companiesData] = await Promise.all([
                authApi.listAllUsers(accessToken),
                companyApi.getAll(accessToken)
            ]);
            setEmployees(Array.isArray(usersData) ? usersData : []);
            setCompanies(Array.isArray(companiesData) ? companiesData : []);
        } catch (error) {
            console.error('Error fetching initial data:', error);
            setEmployees([]);
            setCompanies([]);
        } finally {
            setLoading(false);
        }
    }, [accessToken]);

    // useEffect for initial data
    useEffect(() => {
        if (accessToken) {
            fetchInitialData();
        }
    }, [accessToken, fetchInitialData]);

    // useEffect for fetching payments
    useEffect(() => {
        if (accessToken) {
            fetchPayments();
        }
    }, [accessToken, fetchPayments]);

    const handleCreatePayment = async () => {
        try {
            const paymentData = {
                ...newPayment,
                employee_id: newPayment.employee_id || null,
                company_id: newPayment.company_id || null
            };
            
            await paymentApi.createPayment(accessToken, paymentData);
            setShowCreateModal(false);
            resetNewPayment();
            fetchPayments();
        } catch (error) {
            console.error('Error creating payment:', error);
            alert('Failed to create payment: ' + error.message);
        }
    };

    const handleUpdatePayment = async () => {
        try {
            await paymentApi.updatePayment(accessToken, selectedPayment.id, selectedPayment);
            setShowEditModal(false);
            setSelectedPayment(null);
            fetchPayments();
        } catch (error) {
            console.error('Error updating payment:', error);
            alert('Failed to update payment: ' + error.message);
        }
    };

    const handleUpdateStatus = async (paymentId, status) => {
        try {
            const statusData = {
                status: status,
                paid_date: status === 'paid' ? new Date().toISOString().split('T')[0] : null
            };
            await paymentApi.updatePaymentStatus(accessToken, paymentId, statusData);
            fetchPayments();
        } catch (error) {
            console.error('Error updating payment status:', error);
            alert('Failed to update payment status: ' + error.message);
        }
    };

    const handleDeletePayment = async (paymentId) => {
        if (!window.confirm('Are you sure you want to delete this payment?')) {
            return;
        }
        
        try {
            await paymentApi.deletePayment(accessToken, paymentId);
            fetchPayments();
        } catch (error) {
            console.error('Error deleting payment:', error);
            alert('Failed to delete payment: ' + error.message);
        }
    };

    const resetNewPayment = () => {
        setNewPayment({
            title: '',
            description: '',
            amount: 0,
            currency: 'EUR',
            payment_type: 'salary',
            due_date: new Date().toISOString().split('T')[0],
            employee_id: null,
            company_id: null,
            category: '',
            notes: ''
        });
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('el-GR', {
            style: 'currency',
            currency: 'EUR'
        }).format(amount || 0);
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            return new Date(dateString).toLocaleDateString('el-GR');
        } catch {
            return 'N/A';
        }
    };

    const getStatusBadge = (status) => {
        const statusClasses = {
            pending: 'badge-warning',
            paid: 'badge-success',
            cancelled: 'badge-danger',
            approved: 'badge-info'
        };
        return `badge ${statusClasses[status] || 'badge-secondary'}`;
    };

    const getPaymentTypeLabel = (type) => {
        const labels = {
            salary: 'Salary',
            commission_payment: 'Commission',
            bonus: 'Bonus',
            expense_reimbursement: 'Expense',
            rent_income: 'Rent Income',
            service_income: 'Service Income',
            other_income: 'Other Income',
            other_expense: 'Other Expense'
        };
        return labels[type] || type;
    };

    if (loading) {
        return <div className="loading-spinner">{t('loading')}</div>;
    }

    return (
        <div className="payments-page">
            <div className="page-header">
                <h1>{t('payment_management')}</h1>
                <div className="header-actions">
                    <button 
                        className="btn-primary"
                        onClick={() => setShowCreateModal(true)}
                    >
                        + {t('new_payment')}
                    </button>
                    <button 
                        className="btn-secondary"
                        onClick={() => window.location.href = '/commissions'}
                    >
                        {t('commissions')}
                    </button>
                </div>
            </div>

            {/* Statistics Cards */}
            <div className="statistics-cards">
                <div className="stat-card">
                    <div className="stat-icon pending">💰</div>
                    <div className="stat-content">
                        <div className="stat-label">Total Pending</div>
                        <div className="stat-value">{formatCurrency(statistics.totalPending)}</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon overdue">⚠️</div>
                    <div className="stat-content">
                        <div className="stat-label">Overdue</div>
                        <div className="stat-value overdue">{formatCurrency(statistics.totalOverdue)}</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon paid">✅</div>
                    <div className="stat-content">
                        <div className="stat-label">Total Paid</div>
                        <div className="stat-value paid">{formatCurrency(statistics.totalPaid)}</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon income">📈</div>
                    <div className="stat-content">
                        <div className="stat-label">Monthly Income</div>
                        <div className="stat-value income">{formatCurrency(statistics.monthlyIncome)}</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon expense">📉</div>
                    <div className="stat-content">
                        <div className="stat-label">Monthly Expenses</div>
                        <div className="stat-value expense">{formatCurrency(statistics.monthlyExpenses)}</div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="filters-section">
                <div className="filter-row">
                    <div className="filter-group">
                        <label>{t('search')}</label>
                        <input 
                            type="text"
                            placeholder={`${t('search')} ${t('payments') || 'payments'}...`}
                            value={filters.search}
                            onChange={(e) => setFilters({...filters, search: e.target.value})}
                        />
                    </div>
                    
                    <div className="filter-group">
                        <label>{t('type') || 'Type'}</label>
                        <select 
                            value={filters.payment_type_filter}
                            onChange={(e) => setFilters({...filters, payment_type_filter: e.target.value})}
                        >
                            <option value="">{t('all_types') || 'All Types'}</option>
                            <option value="salary">{t('salary') || 'Salary'}</option>
                            <option value="commission_payment">{t('commission') || 'Commission'}</option>
                            <option value="bonus">{t('bonus') || 'Bonus'}</option>
                            <option value="expense_reimbursement">{t('expense_reimbursement') || 'Expense'}</option>
                            <option value="rent_income">{t('rent_income') || 'Rent Income'}</option>
                            <option value="service_income">{t('service_income') || 'Service Income'}</option>
                            <option value="other_income">{t('other_income') || 'Other Income'}</option>
                            <option value="other_expense">{t('other_expense') || 'Other Expense'}</option>
                        </select>
                    </div>
                    
                    <div className="filter-group">
                        <label>{t('status')}</label>
                        <select 
                            value={filters.status_filter}
                            onChange={(e) => setFilters({...filters, status_filter: e.target.value})}
                        >
                            <option value="">{t('all_statuses') || 'All Status'}</option>
                            <option value="pending">{t('pending')}</option>
                            <option value="paid">{t('paid') || 'Paid'}</option>
                            <option value="cancelled">{t('cancelled') || 'Cancelled'}</option>
                            <option value="approved">{t('approved')}</option>
                        </select>
                    </div>
                    
                    <div className="filter-group">
                        <label>{t('employee') || 'Employee'}</label>
                        <select 
                            value={filters.employee_id}
                            onChange={(e) => setFilters({...filters, employee_id: e.target.value})}
                        >
                            <option value="">{t('all_employees') || 'All Employees'}</option>
                            {employees.map(emp => (
                                <option key={emp.id} value={emp.id}>
                                    {emp.first_name} {emp.last_name}
                                </option>
                            ))}
                        </select>
                    </div>
                    
                    <div className="filter-group">
                        <label>{t('from_date')}</label>
                        <input 
                            type="date"
                            value={filters.from_date}
                            onChange={(e) => setFilters({...filters, from_date: e.target.value})}
                        />
                    </div>
                    
                    <div className="filter-group">
                        <label>{t('to_date')}</label>
                        <input 
                            type="date"
                            value={filters.to_date}
                            onChange={(e) => setFilters({...filters, to_date: e.target.value})}
                        />
                    </div>
                </div>
            </div>

            {/* Payments Table */}
            <div className="payments-table-container">
                <table className="payments-table">
                    <thead>
                        <tr>
                            <th>{t('title') || 'Title'}</th>
                            <th>{t('type') || 'Type'}</th>
                            <th>{t('employee') || 'Employee'}/{t('company') || 'Company'}</th>
                            <th>{t('payment_amount')}</th>
                            <th>{t('payment_date')}</th>
                            <th>{t('status')}</th>
                            <th>{t('actions')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {payments.length === 0 ? (
                            <tr>
                                <td colSpan="7" className="no-data">No payments found</td>
                            </tr>
                        ) : (
                            payments.map(payment => (
                                <tr key={payment.id}>
                                    <td>{payment.title}</td>
                                    <td>
                                        <span className="payment-type">
                                            {getPaymentTypeLabel(payment.payment_type)}
                                        </span>
                                    </td>
                                    <td>
                                        {payment.employee_name || payment.company_name || '-'}
                                    </td>
                                    <td className="amount">
                                        {formatCurrency(payment.amount)}
                                    </td>
                                    <td>{formatDate(payment.due_date)}</td>
                                    <td>
                                        <span className={getStatusBadge(payment.status)}>{t(payment.status) || payment.status}</span>
                                    </td>
                                    <td>
                                        <div className="action-buttons">
                                            {payment.status === 'pending' && (
                                                <>
                                                    <button 
                                                        className="btn-action btn-success"
                                                        onClick={() => handleUpdateStatus(payment.id, 'paid')}
                                                        title={t('mark_as_paid') || 'Mark as Paid'}
                                                    >
                                                        ✓
                                                    </button>
                                                    <button 
                                                        className="btn-action btn-edit"
                                                        onClick={() => {
                                                            setSelectedPayment(payment);
                                                            setShowEditModal(true);
                                                        }}
                                                        title={t('edit')}
                                                    >
                                                        ✏️
                                                    </button>
                                                </>
                                            )}
                                            <button 
                                                className="btn-action btn-danger"
                                                onClick={() => handleDeletePayment(payment.id)}
                                                title={t('delete')}
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Create Payment Modal */}
            {showCreateModal && (
                <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h2>{t('new_payment')}</h2>
                        
                        <div className="form-group">
                            <label>{t('title') || 'Title'} *</label>
                            <input 
                                type="text"
                                value={newPayment.title}
                                onChange={(e) => setNewPayment({...newPayment, title: e.target.value})}
                                placeholder={`${t('payment')} ${t('title') || 'title'}`}
                            />
                        </div>

                        <div className="form-group">
                            <label>{t('description')}</label>
                            <textarea 
                                value={newPayment.description}
                                onChange={(e) => setNewPayment({...newPayment, description: e.target.value})}
                                placeholder={`${t('payment')} ${t('description') || 'description'}`}
                                rows="3"
                            />
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>{t('payment_amount')} *</label>
                                <input 
                                    type="number"
                                    value={newPayment.amount}
                                    onChange={(e) => setNewPayment({...newPayment, amount: Number(e.target.value)})}
                                    min="0"
                                    step="0.01"
                                />
                            </div>

                            <div className="form-group">
                                <label>{t('currency') || 'Currency'}</label>
                                <select 
                                    value={newPayment.currency}
                                    onChange={(e) => setNewPayment({...newPayment, currency: e.target.value})}
                                >
                                    <option value="EUR">EUR</option>
                                    <option value="USD">USD</option>
                                    <option value="GBP">GBP</option>
                                </select>
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>{t('payment_type') || 'Payment Type'} *</label>
                                <select 
                                    value={newPayment.payment_type}
                                    onChange={(e) => setNewPayment({...newPayment, payment_type: e.target.value})}
                                >
                                    <option value="salary">{t('salary') || 'Salary'}</option>
                                    <option value="commission_payment">{t('commission') || 'Commission'}</option>
                                    <option value="bonus">{t('bonus') || 'Bonus'}</option>
                                    <option value="expense_reimbursement">{t('expense_reimbursement') || 'Expense Reimbursement'}</option>
                                    <option value="rent_income">{t('rent_income') || 'Rent Income'}</option>
                                    <option value="service_income">{t('service_income') || 'Service Income'}</option>
                                    <option value="other_income">{t('other_income') || 'Other Income'}</option>
                                    <option value="other_expense">{t('other_expense') || 'Other Expense'}</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label>{t('payment_date')} *</label>
                                <input 
                                    type="date"
                                    value={newPayment.due_date}
                                    onChange={(e) => setNewPayment({...newPayment, due_date: e.target.value})}
                                />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>{t('employee') || 'Employee'}</label>
                                <select 
                                    value={newPayment.employee_id || ''}
                                    onChange={(e) => setNewPayment({...newPayment, employee_id: e.target.value ? Number(e.target.value) : null})}
                                >
                                    <option value="">{t('none') || 'None'}</option>
                                    {employees.map(emp => (
                                        <option key={emp.id} value={emp.id}>
                                            {emp.first_name} {emp.last_name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label>{t('company') || 'Company'}</label>
                                <select 
                                    value={newPayment.company_id || ''}
                                    onChange={(e) => setNewPayment({...newPayment, company_id: e.target.value ? Number(e.target.value) : null})}
                                >
                                    <option value="">{t('none') || 'None'}</option>
                                    {companies.map(company => (
                                        <option key={company.id} value={company.id}>
                                            {company.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="form-group">
                            <label>{t('category') || 'Category'}</label>
                            <input 
                                type="text"
                                value={newPayment.category}
                                onChange={(e) => setNewPayment({...newPayment, category: e.target.value})}
                                placeholder={`${t('payment')} ${t('category') || 'category'}`}
                            />
                        </div>

                        <div className="form-group">
                            <label>{t('notes') || 'Notes'}</label>
                            <textarea 
                                value={newPayment.notes}
                                onChange={(e) => setNewPayment({...newPayment, notes: e.target.value})}
                                placeholder={t('additional_notes') || 'Additional notes'}
                                rows="2"
                            />
                        </div>

                        <div className="modal-actions">
                            <button 
                                className="btn-secondary"
                                onClick={() => {
                                    setShowCreateModal(false);
                                    resetNewPayment();
                                }}
                            >
                                {t('cancel')}
                            </button>
                            <button 
                                className="btn-primary"
                                onClick={handleCreatePayment}
                                disabled={!newPayment.title || newPayment.amount <= 0}
                            >
                                {t('create_payment') || 'Create Payment'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Payment Modal */}
            {showEditModal && selectedPayment && (
                <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h2>{t('edit_payment') || 'Edit Payment'}</h2>
                        
                        <div className="form-group">
                            <label>{t('title') || 'Title'} *</label>
                            <input 
                                type="text"
                                value={selectedPayment.title}
                                onChange={(e) => setSelectedPayment({...selectedPayment, title: e.target.value})}
                                placeholder={`${t('payment')} ${t('title') || 'title'}`}
                            />
                        </div>

                        <div className="form-group">
                            <label>{t('description')}</label>
                            <textarea 
                                value={selectedPayment.description || ''}
                                onChange={(e) => setSelectedPayment({...selectedPayment, description: e.target.value})}
                                placeholder={`${t('payment')} ${t('description') || 'description'}`}
                                rows="3"
                            />
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>{t('payment_amount')} *</label>
                                <input 
                                    type="number"
                                    value={selectedPayment.amount}
                                    onChange={(e) => setSelectedPayment({...selectedPayment, amount: Number(e.target.value)})}
                                    min="0"
                                    step="0.01"
                                />
                            </div>

                            <div className="form-group">
                                <label>{t('currency') || 'Currency'}</label>
                                <select 
                                    value={selectedPayment.currency}
                                    onChange={(e) => setSelectedPayment({...selectedPayment, currency: e.target.value})}
                                >
                                    <option value="EUR">EUR</option>
                                    <option value="USD">USD</option>
                                    <option value="GBP">GBP</option>
                                </select>
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>{t('payment_type') || 'Payment Type'} *</label>
                                <select 
                                    value={selectedPayment.payment_type}
                                    onChange={(e) => setSelectedPayment({...selectedPayment, payment_type: e.target.value})}
                                >
                                    <option value="salary">{t('salary') || 'Salary'}</option>
                                    <option value="commission_payment">{t('commission') || 'Commission'}</option>
                                    <option value="bonus">{t('bonus') || 'Bonus'}</option>
                                    <option value="expense_reimbursement">{t('expense_reimbursement') || 'Expense Reimbursement'}</option>
                                    <option value="rent_income">{t('rent_income') || 'Rent Income'}</option>
                                    <option value="service_income">{t('service_income') || 'Service Income'}</option>
                                    <option value="other_income">{t('other_income') || 'Other Income'}</option>
                                    <option value="other_expense">{t('other_expense') || 'Other Expense'}</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label>{t('status')}</label>
                                <select 
                                    value={selectedPayment.status}
                                    onChange={(e) => setSelectedPayment({...selectedPayment, status: e.target.value})}
                                >
                                    <option value="pending">{t('pending')}</option>
                                    <option value="paid">{t('paid') || 'Paid'}</option>
                                    <option value="cancelled">{t('cancelled') || 'Cancelled'}</option>
                                    <option value="approved">{t('approved')}</option>
                                </select>
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>{t('payment_date')} *</label>
                                <input 
                                    type="date"
                                    value={selectedPayment.due_date}
                                    onChange={(e) => setSelectedPayment({...selectedPayment, due_date: e.target.value})}
                                />
                            </div>

                            <div className="form-group">
                                <label>{t('paid_date') || 'Paid Date'}</label>
                                <input 
                                    type="date"
                                    value={selectedPayment.paid_date || ''}
                                    onChange={(e) => setSelectedPayment({...selectedPayment, paid_date: e.target.value})}
                                />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>{t('employee') || 'Employee'}</label>
                                <select 
                                    value={selectedPayment.employee_id || ''}
                                    onChange={(e) => setSelectedPayment({...selectedPayment, employee_id: e.target.value ? Number(e.target.value) : null})}
                                >
                                    <option value="">{t('none') || 'None'}</option>
                                    {employees.map(emp => (
                                        <option key={emp.id} value={emp.id}>
                                            {emp.first_name} {emp.last_name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label>{t('company') || 'Company'}</label>
                                <select 
                                    value={selectedPayment.company_id || ''}
                                    onChange={(e) => setSelectedPayment({...selectedPayment, company_id: e.target.value ? Number(e.target.value) : null})}
                                >
                                    <option value="">{t('none') || 'None'}</option>
                                    {companies.map(company => (
                                        <option key={company.id} value={company.id}>
                                            {company.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="form-group">
                            <label>{t('category') || 'Category'}</label>
                            <input 
                                type="text"
                                value={selectedPayment.category || ''}
                                onChange={(e) => setSelectedPayment({...selectedPayment, category: e.target.value})}
                                placeholder={`${t('payment')} ${t('category') || 'category'}`}
                            />
                        </div>

                        <div className="form-group">
                            <label>{t('notes') || 'Notes'}</label>
                            <textarea 
                                value={selectedPayment.notes || ''}
                                onChange={(e) => setSelectedPayment({...selectedPayment, notes: e.target.value})}
                                placeholder={t('additional_notes') || 'Additional notes'}
                                rows="2"
                            />
                        </div>

                        <div className="modal-actions">
                            <button 
                                className="btn-secondary"
                                onClick={() => {
                                    setShowEditModal(false);
                                    setSelectedPayment(null);
                                }}
                            >
                                {t('cancel')}
                            </button>
                            <button 
                                className="btn-primary"
                                onClick={handleUpdatePayment}
                                disabled={!selectedPayment.title || selectedPayment.amount <= 0}
                            >
                                {t('update_payment') || 'Update Payment'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PaymentsPage;