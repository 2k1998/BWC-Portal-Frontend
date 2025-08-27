import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { carFinanceApi } from '../api/carFinanceAPI';
import './CarFinancePage.css';

const CarFinancePage = () => {
    const { currentUser: user, accessToken } = useAuth();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [showIncomeModal, setShowIncomeModal] = useState(false);
    const [showExpenseModal, setShowExpenseModal] = useState(false);
    
    // Finance data state
    const [financeData, setFinanceData] = useState({
        totalIncome: 0,
        totalExpenses: 0,
        netProfit: 0,
        monthlyIncome: 0,
        monthlyExpenses: 0,
        carStatistics: {
            totalCars: 0,
            activeCars: 0,
            inServiceCars: 0,
            availableCars: 0
        },
        expenseBreakdown: {
            service: 0,
            repairs: 0,
            fuel: 0,
            insurance: 0,
            other: 0
        },
        recentTransactions: []
    });

    // Cars list for dropdowns
    const [availableCars, setAvailableCars] = useState([]);
    
    // Form states
    const [newIncome, setNewIncome] = useState({
        rental_id: null,
        car_id: '',
        amount: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
        customer_name: ''
    });

    const [newExpense, setNewExpense] = useState({
        car_id: '',
        service_type: 'maintenance',
        amount: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
        vendor: '',
        mileage: null
    });

    

    const fetchAllData = useCallback(async () => {
        setLoading(true);
        try {
            // Get current month date range
            const now = new Date();
            const startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
            const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
            
            // Fetch summary data
            const summary = await carFinanceApi.getSummary(startDate, endDate, accessToken);
            const transactions = await carFinanceApi.getTransactions({
                start_date: startDate,
                end_date: endDate
            }, accessToken);
            
            // Calculate expense breakdown
            const expenseBreakdown = {
                service: 0,
                repairs: 0,
                fuel: 0,
                insurance: 0,
                other: 0
            };
            
            transactions.forEach(trans => {
                if (trans.type === 'expense') {
                    switch(trans.service_type) {
                        case 'maintenance':
                        case 'service':
                            expenseBreakdown.service += trans.amount;
                            break;
                        case 'repair':
                            expenseBreakdown.repairs += trans.amount;
                            break;
                        case 'fuel':
                            expenseBreakdown.fuel += trans.amount;
                            break;
                        case 'insurance':
                            expenseBreakdown.insurance += trans.amount;
                            break;
                        default:
                            expenseBreakdown.other += trans.amount;
                    }
                }
            });
            
            setFinanceData({
                totalIncome: summary.total_income || 0,
                totalExpenses: summary.total_expenses || 0,
                netProfit: summary.net_profit || 0,
                monthlyIncome: summary.monthly_income || 0,
                monthlyExpenses: summary.monthly_expenses || 0,
                carStatistics: summary.car_statistics || {
                    totalCars: 0,
                    activeCars: 0,
                    inServiceCars: 0,
                    availableCars: 0
                },
                expenseBreakdown,
                recentTransactions: transactions.slice(0, 5)
            });
        } catch (error) {
            console.error('Error fetching finance data:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [accessToken]);

    const fetchCars = useCallback(async () => {
        try {
            const cars = await carFinanceApi.getCars(accessToken);
            setAvailableCars(cars || []);
        } catch (error) {
            console.error('Error fetching cars:', error);
            setAvailableCars([]);
        }
    }, [accessToken]);

    useEffect(() => {
        if (accessToken && user) {
            fetchAllData();
            fetchCars();
        }
    }, [accessToken, user, fetchAllData, fetchCars]);

    const handleRefresh = async () => {
        setRefreshing(true);
        await fetchAllData();
    };

    const handleAddIncome = async (e) => {
        e.preventDefault();
        try {
            if (!newIncome.car_id || !newIncome.amount || !newIncome.customer_name) {
                alert('Please fill in all required fields');
                return;
            }
            
            await carFinanceApi.addIncome({
                ...newIncome,
                amount: parseFloat(newIncome.amount)
            }, accessToken);
            
            setShowIncomeModal(false);
            setNewIncome({
                rental_id: null,
                car_id: '',
                amount: '',
                description: '',
                date: new Date().toISOString().split('T')[0],
                customer_name: ''
            });
            
            // Refresh data
            await fetchAllData();
        } catch (error) {
            console.error('Error adding income:', error);
            alert('Failed to add income record');
        }
    };

    const handleAddExpense = async (e) => {
        e.preventDefault();
        try {
            if (!newExpense.car_id || !newExpense.amount || !newExpense.vendor) {
                alert('Please fill in all required fields');
                return;
            }
            
            await carFinanceApi.addExpense({
                ...newExpense,
                amount: parseFloat(newExpense.amount),
                mileage: newExpense.mileage ? parseInt(newExpense.mileage) : null
            }, accessToken);
            
            setShowExpenseModal(false);
            setNewExpense({
                car_id: '',
                service_type: 'maintenance',
                amount: '',
                description: '',
                date: new Date().toISOString().split('T')[0],
                vendor: '',
                mileage: null
            });
            
            // Refresh data
            await fetchAllData();
        } catch (error) {
            console.error('Error adding expense:', error);
            alert('Failed to add expense record');
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'EUR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
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
            <div className="car-finance-loading">
                <div className="loading-spinner">Loading car finance data...</div>
            </div>
        );
    }

    return (
        <div className="car-finance-page">
            <div className="car-finance-widget">
                {/* Header */}
                <div className="widget-header">
                    <h2>🚗 Car Fleet Finances</h2>
                    <div className="header-actions">
                        <button 
                            className={`refresh-btn ${refreshing ? 'spinning' : ''}`}
                            onClick={handleRefresh}
                            disabled={refreshing}
                        >
                            🔄
                        </button>
                        <button 
                            className="action-btn income-btn"
                            onClick={() => setShowIncomeModal(true)}
                        >
                            + Add Income
                        </button>
                        <button 
                            className="action-btn expense-btn"
                            onClick={() => setShowExpenseModal(true)}
                        >
                            + Add Expense
                        </button>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="finance-summary-cards">
                    <div className="summary-card income">
                        <div className="card-icon">💰</div>
                        <div className="card-content">
                            <div className="card-label">Total Rental Income</div>
                            <div className="card-value">{formatCurrency(financeData.totalIncome)}</div>
                            <div className="card-subtext">This month: {formatCurrency(financeData.monthlyIncome)}</div>
                        </div>
                    </div>

                    <div className="summary-card expense">
                        <div className="card-icon">🔧</div>
                        <div className="card-content">
                            <div className="card-label">Total Service Expenses</div>
                            <div className="card-value">{formatCurrency(financeData.totalExpenses)}</div>
                            <div className="card-subtext">This month: {formatCurrency(financeData.monthlyExpenses)}</div>
                        </div>
                    </div>

                    <div className="summary-card profit">
                        <div className="card-icon">📈</div>
                        <div className="card-content">
                            <div className="card-label">Net Profit</div>
                            <div className={`card-value ${financeData.netProfit >= 0 ? 'positive' : 'negative'}`}>
                                {formatCurrency(financeData.netProfit)}
                            </div>
                            <div className="card-subtext">{financeData.netProfit >= 0 ? 'Profitable' : 'Loss'}</div>
                        </div>
                    </div>
                </div>

                {/* Service Expenses Breakdown */}
                <div className="expense-breakdown">
                    <h3>Service Expenses Breakdown</h3>
                    <div className="category-grid">
                        <div className="category-item">
                            <div className="category-icon">🔧</div>
                            <div className="category-details">
                                <div className="category-name">Service</div>
                                <div className="category-amount">{formatCurrency(financeData.expenseBreakdown.service)}</div>
                            </div>
                        </div>
                        
                        <div className="category-item">
                            <div className="category-icon">🔨</div>
                            <div className="category-details">
                                <div className="category-name">Repairs</div>
                                <div className="category-amount">{formatCurrency(financeData.expenseBreakdown.repairs)}</div>
                            </div>
                        </div>
                        
                        <div className="category-item">
                            <div className="category-icon">⛽</div>
                            <div className="category-details">
                                <div className="category-name">Fuel</div>
                                <div className="category-amount">{formatCurrency(financeData.expenseBreakdown.fuel)}</div>
                            </div>
                        </div>
                        
                        <div className="category-item">
                            <div className="category-icon">🛡️</div>
                            <div className="category-details">
                                <div className="category-name">Insurance</div>
                                <div className="category-amount">{formatCurrency(financeData.expenseBreakdown.insurance)}</div>
                            </div>
                        </div>
                        
                        <div className="category-item">
                            <div className="category-icon">📋</div>
                            <div className="category-details">
                                <div className="category-name">Other</div>
                                <div className="category-amount">{formatCurrency(financeData.expenseBreakdown.other)}</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Recent Transactions */}
                <div className="recent-transactions">
                    <h3>Recent Car-Related Transactions</h3>
                    {financeData.recentTransactions.length === 0 ? (
                        <div className="no-transactions">
                            No car-related transactions found
                        </div>
                    ) : (
                        <div className="transaction-list">
                            {financeData.recentTransactions.map((trans, index) => (
                                <div 
                                    key={trans.id || index} 
                                    className={`transaction-item ${trans.type}`}
                                >
                                    <div className="transaction-icon">
                                        {trans.type === 'income' ? '💰' : '💸'}
                                    </div>
                                    <div className="transaction-info">
                                        <div className="transaction-title">
                                            {trans.type === 'income' 
                                                ? trans.customer_name 
                                                : `${trans.service_type} - ${trans.vendor}`}
                                        </div>
                                        <div className="transaction-date">
                                            {formatDate(trans.date)}
                                        </div>
                                    </div>
                                    <div className={`transaction-amount ${trans.type}`}>
                                        {trans.type === 'income' ? '+' : '-'}{formatCurrency(trans.amount)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Monthly Overview */}
                <div className="monthly-overview">
                    <h3>Monthly Overview</h3>
                    <div className="overview-bars">
                        <div className="bar-group">
                            <div className="bar-label">Income</div>
                            <div className="bar-container">
                                <div 
                                    className="bar income-bar"
                                    style={{ 
                                        width: `${Math.min((financeData.monthlyIncome / (financeData.monthlyIncome + financeData.monthlyExpenses)) * 100, 100) || 0}%` 
                                    }}
                                >
                                    <span className="bar-value">{formatCurrency(financeData.monthlyIncome)}</span>
                                </div>
                            </div>
                        </div>
                        
                        <div className="bar-group">
                            <div className="bar-label">Expenses</div>
                            <div className="bar-container">
                                <div 
                                    className="bar expense-bar"
                                    style={{ 
                                        width: `${Math.min((financeData.monthlyExpenses / (financeData.monthlyIncome + financeData.monthlyExpenses)) * 100, 100) || 0}%` 
                                    }}
                                >
                                    <span className="bar-value">{formatCurrency(financeData.monthlyExpenses)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="monthly-net-section">
                        <span className="net-label">Net this month:</span>
                        <span className={`monthly-net ${financeData.netProfit >= 0 ? 'positive' : 'negative'}`}>
                            {formatCurrency(financeData.netProfit)}
                        </span>
                    </div>
                </div>

                {/* Fleet Status */}
                <div className="fleet-status">
                    <h3>Fleet Status</h3>
                    <div className="status-grid">
                        <div className="status-item">
                            <div className="status-value">{financeData.carStatistics.totalCars}</div>
                            <div className="status-label">Total Cars</div>
                        </div>
                        <div className="status-item">
                            <div className="status-value active">{financeData.carStatistics.activeCars}</div>
                            <div className="status-label">Currently Rented</div>
                        </div>
                        <div className="status-item">
                            <div className="status-value available">{financeData.carStatistics.availableCars}</div>
                            <div className="status-label">Available</div>
                        </div>
                        <div className="status-item">
                            <div className="status-value service">{financeData.carStatistics.inServiceCars}</div>
                            <div className="status-label">In Service</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Income Modal */}
            {showIncomeModal && (
                <div className="modal-overlay" onClick={() => setShowIncomeModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Add Rental Income</h2>
                            <button 
                                className="modal-close"
                                onClick={() => setShowIncomeModal(false)}
                            >
                                ×
                            </button>
                        </div>
                        <form onSubmit={handleAddIncome} className="modal-form">
                            <div className="form-group">
                                <label>Customer Name *</label>
                                <input 
                                    type="text" 
                                    value={newIncome.customer_name}
                                    onChange={(e) => setNewIncome({...newIncome, customer_name: e.target.value})}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Car *</label>
                                <select 
                                    value={newIncome.car_id}
                                    onChange={(e) => setNewIncome({...newIncome, car_id: e.target.value})}
                                    required
                                >
                                    <option value="">Select a car</option>
                                    {availableCars.map(car => (
                                        <option key={car.id} value={car.id}>
                                            {car.manufacturer} {car.model} - {car.license_plate}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Amount (€) *</label>
                                <input 
                                    type="number" 
                                    step="0.01"
                                    value={newIncome.amount}
                                    onChange={(e) => setNewIncome({...newIncome, amount: e.target.value})}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Date *</label>
                                <input 
                                    type="date" 
                                    value={newIncome.date}
                                    onChange={(e) => setNewIncome({...newIncome, date: e.target.value})}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Description</label>
                                <textarea 
                                    value={newIncome.description}
                                    onChange={(e) => setNewIncome({...newIncome, description: e.target.value})}
                                    rows="3"
                                />
                            </div>
                            <div className="modal-actions">
                                <button 
                                    type="button"
                                    className="btn-cancel"
                                    onClick={() => setShowIncomeModal(false)}
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit"
                                    className="btn-submit income"
                                >
                                    Add Income
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Expense Modal */}
            {showExpenseModal && (
                <div className="modal-overlay" onClick={() => setShowExpenseModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Add Service Expense</h2>
                            <button 
                                className="modal-close"
                                onClick={() => setShowExpenseModal(false)}
                            >
                                ×
                            </button>
                        </div>
                        <form onSubmit={handleAddExpense} className="modal-form">
                            <div className="form-group">
                                <label>Car *</label>
                                <select 
                                    value={newExpense.car_id}
                                    onChange={(e) => setNewExpense({...newExpense, car_id: e.target.value})}
                                    required
                                >
                                    <option value="">Select a car</option>
                                    {availableCars.map(car => (
                                        <option key={car.id} value={car.id}>
                                            {car.manufacturer} {car.model} - {car.license_plate}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Service Type *</label>
                                <select 
                                    value={newExpense.service_type}
                                    onChange={(e) => setNewExpense({...newExpense, service_type: e.target.value})}
                                    required
                                >
                                    <option value="maintenance">Maintenance</option>
                                    <option value="repair">Repair</option>
                                    <option value="fuel">Fuel</option>
                                    <option value="insurance">Insurance</option>
                                    <option value="registration">Registration</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Vendor *</label>
                                <input 
                                    type="text" 
                                    value={newExpense.vendor}
                                    onChange={(e) => setNewExpense({...newExpense, vendor: e.target.value})}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Amount (€) *</label>
                                <input 
                                    type="number" 
                                    step="0.01"
                                    value={newExpense.amount}
                                    onChange={(e) => setNewExpense({...newExpense, amount: e.target.value})}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Date *</label>
                                <input 
                                    type="date" 
                                    value={newExpense.date}
                                    onChange={(e) => setNewExpense({...newExpense, date: e.target.value})}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Mileage</label>
                                <input 
                                    type="number" 
                                    value={newExpense.mileage || ''}
                                    onChange={(e) => setNewExpense({...newExpense, mileage: e.target.value})}
                                />
                            </div>
                            <div className="form-group">
                                <label>Description</label>
                                <textarea 
                                    value={newExpense.description}
                                    onChange={(e) => setNewExpense({...newExpense, description: e.target.value})}
                                    rows="3"
                                />
                            </div>
                            <div className="modal-actions">
                                <button 
                                    type="button"
                                    className="btn-cancel"
                                    onClick={() => setShowExpenseModal(false)}
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit"
                                    className="btn-submit expense"
                                >
                                    Add Expense
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CarFinancePage;