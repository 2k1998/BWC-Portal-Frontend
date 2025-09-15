import React, { useState, useEffect } from 'react';
import { 
    Car, 
    RotateCcw, 
    Banknote, 
    Wrench, 
    TrendingUp, 
    TrendingDown, 
    Hammer, 
    Fuel, 
    Shield, 
    ClipboardList, 
    DollarSign 
} from 'lucide-react';

const CarFinanceWidget = ({ accessToken, paymentApi }) => {
    const [loading, setLoading] = useState(true);
    const [financeData, setFinanceData] = useState({
        totalRentalIncome: 0,
        totalServiceExpenses: 0,
        netProfit: 0,
        monthlyRentalIncome: 0,
        monthlyServiceExpenses: 0,
        recentTransactions: [],
        serviceCategories: {
            service: 0,
            repair: 0,
            fuel: 0,
            insurance: 0,
            other: 0
        }
    });

    useEffect(() => {
        const fetchCarFinanceData = async () => {
            try {
                setLoading(true);
                
                // Fetch all payments
                const allPayments = await paymentApi.getPayments(accessToken, {
                    limit: 1000
                });

                // Filter car-related payments
                const carRentalIncome = allPayments.filter(p => 
                    p.payment_type === 'car_rental_income' && p.status === 'paid'
                );
                
                const carExpenses = allPayments.filter(p => 
                    (p.category && (
                        p.category.toLowerCase().includes('service') ||
                        p.category.toLowerCase().includes('repair') ||
                        p.category.toLowerCase().includes('maintenance') ||
                        p.category.toLowerCase().includes('fuel') ||
                        p.category.toLowerCase().includes('insurance') ||
                        p.category.toLowerCase().includes('car')
                    )) && p.status === 'paid'
                );

                // Calculate totals
                const totalIncome = carRentalIncome.reduce((sum, p) => sum + parseFloat(p.amount), 0);
                const totalExpenses = carExpenses.reduce((sum, p) => sum + parseFloat(p.amount), 0);

                // Calculate monthly (current month)
                const currentMonth = new Date().getMonth();
                const currentYear = new Date().getFullYear();
                
                const monthlyIncome = carRentalIncome
                    .filter(p => {
                        const pDate = new Date(p.paid_date || p.due_date);
                        return pDate.getMonth() === currentMonth && pDate.getFullYear() === currentYear;
                    })
                    .reduce((sum, p) => sum + parseFloat(p.amount), 0);

                const monthlyExpenses = carExpenses
                    .filter(p => {
                        const pDate = new Date(p.paid_date || p.due_date);
                        return pDate.getMonth() === currentMonth && pDate.getFullYear() === currentYear;
                    })
                    .reduce((sum, p) => sum + parseFloat(p.amount), 0);

                // Categorize service expenses
                const categories = {
                    service: 0,
                    repair: 0,
                    fuel: 0,
                    insurance: 0,
                    other: 0
                };

                carExpenses.forEach(expense => {
                    const category = expense.category?.toLowerCase() || '';
                    if (category.includes('service')) {
                        categories.service += parseFloat(expense.amount);
                    } else if (category.includes('repair')) {
                        categories.repair += parseFloat(expense.amount);
                    } else if (category.includes('fuel') || category.includes('gas')) {
                        categories.fuel += parseFloat(expense.amount);
                    } else if (category.includes('insurance')) {
                        categories.insurance += parseFloat(expense.amount);
                    } else {
                        categories.other += parseFloat(expense.amount);
                    }
                });

                // Get recent transactions (last 10)
                const allCarTransactions = [...carRentalIncome, ...carExpenses]
                    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                    .slice(0, 10);

                setFinanceData({
                    totalRentalIncome: totalIncome,
                    totalServiceExpenses: totalExpenses,
                    netProfit: totalIncome - totalExpenses,
                    monthlyRentalIncome: monthlyIncome,
                    monthlyServiceExpenses: monthlyExpenses,
                    recentTransactions: allCarTransactions,
                    serviceCategories: categories
                });

            } catch (error) {
                console.error('Error fetching car finance data:', error);
            } finally {
                setLoading(false);
            }
        };

        if (accessToken) {
            fetchCarFinanceData();
        }
    }, [accessToken, paymentApi]);

    const fetchCarFinanceData = async () => {
        try {
            setLoading(true);
            
            // Fetch all payments
            const allPayments = await paymentApi.getPayments(accessToken, {
                limit: 1000
            });

            // Filter car-related payments
            const carRentalIncome = allPayments.filter(p => 
                p.payment_type === 'car_rental_income' && p.status === 'paid'
            );
            
            const carExpenses = allPayments.filter(p => 
                (p.category && (
                    p.category.toLowerCase().includes('service') ||
                    p.category.toLowerCase().includes('repair') ||
                    p.category.toLowerCase().includes('maintenance') ||
                    p.category.toLowerCase().includes('fuel') ||
                    p.category.toLowerCase().includes('insurance') ||
                    p.category.toLowerCase().includes('car')
                )) && p.status === 'paid'
            );

            // Calculate totals
            const totalIncome = carRentalIncome.reduce((sum, p) => sum + parseFloat(p.amount), 0);
            const totalExpenses = carExpenses.reduce((sum, p) => sum + parseFloat(p.amount), 0);

            // Calculate monthly (current month)
            const currentMonth = new Date().getMonth();
            const currentYear = new Date().getFullYear();
            
            const monthlyIncome = carRentalIncome
                .filter(p => {
                    const pDate = new Date(p.paid_date || p.due_date);
                    return pDate.getMonth() === currentMonth && pDate.getFullYear() === currentYear;
                })
                .reduce((sum, p) => sum + parseFloat(p.amount), 0);

            const monthlyExpenses = carExpenses
                .filter(p => {
                    const pDate = new Date(p.paid_date || p.due_date);
                    return pDate.getMonth() === currentMonth && pDate.getFullYear() === currentYear;
                })
                .reduce((sum, p) => sum + parseFloat(p.amount), 0);

            // Categorize service expenses
            const categories = {
                service: 0,
                repair: 0,
                fuel: 0,
                insurance: 0,
                other: 0
            };

            carExpenses.forEach(expense => {
                const category = expense.category?.toLowerCase() || '';
                if (category.includes('service')) {
                    categories.service += parseFloat(expense.amount);
                } else if (category.includes('repair')) {
                    categories.repair += parseFloat(expense.amount);
                } else if (category.includes('fuel') || category.includes('gas')) {
                    categories.fuel += parseFloat(expense.amount);
                } else if (category.includes('insurance')) {
                    categories.insurance += parseFloat(expense.amount);
                } else {
                    categories.other += parseFloat(expense.amount);
                }
            });

            // Get recent transactions (last 10)
            const allCarTransactions = [...carRentalIncome, ...carExpenses]
                .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                .slice(0, 10);

            setFinanceData({
                totalRentalIncome: totalIncome,
                totalServiceExpenses: totalExpenses,
                netProfit: totalIncome - totalExpenses,
                monthlyRentalIncome: monthlyIncome,
                monthlyServiceExpenses: monthlyExpenses,
                recentTransactions: allCarTransactions,
                serviceCategories: categories
            });

        } catch (error) {
            console.error('Error fetching car finance data:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'EUR'
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

    const getCategoryIcon = (category) => {
        const categoryLower = category?.toLowerCase() || '';
        if (categoryLower.includes('service')) return <Wrench size={16} />;
        if (categoryLower.includes('repair')) return <Hammer size={16} />;
        if (categoryLower.includes('fuel') || categoryLower.includes('gas')) return <Fuel size={16} />;
        if (categoryLower.includes('insurance')) return <Shield size={16} />;
        if (categoryLower.includes('rental')) return <Car size={16} />;
        return <DollarSign size={16} />;
    };

    if (loading) {
        return (
            <div className="car-finance-widget loading">
                <div className="widget-header">
                    <h2><Car size={24} /> Car Fleet Finances</h2>
                </div>
                <div className="loading-spinner">Loading financial data...</div>
            </div>
        );
    }

    return (
        <div className="car-finance-widget">
            <div className="widget-header">
                <h2><Car size={24} /> Car Fleet Finances</h2>
                <div className="header-actions">
                    <button 
                        className="refresh-btn"
                        onClick={fetchCarFinanceData}
                        title="Refresh data"
                        >
                            <RotateCcw size={20} />
                        </button>
                    <button 
                        className="view-all-btn"
                        onClick={() => window.location.href = '/payments'}
                    >
                        View All Payments
                    </button>
                </div>
            </div>

            {/* Main Summary Cards */}
            <div className="finance-summary-cards">
                <div className="summary-card income">
                    <Banknote className="card-icon" size={24} />
                    <div className="card-content">
                        <div className="card-label">Total Rental Income</div>
                        <div className="card-value">{formatCurrency(financeData.totalRentalIncome)}</div>
                        <div className="card-subtitle">
                            This month: {formatCurrency(financeData.monthlyRentalIncome)}
                        </div>
                    </div>
                </div>

                <div className="summary-card expense">
                    <Wrench className="card-icon" size={24} />
                    <div className="card-content">
                        <div className="card-label">Total Service Expenses</div>
                        <div className="card-value">{formatCurrency(financeData.totalServiceExpenses)}</div>
                        <div className="card-subtitle">
                            This month: {formatCurrency(financeData.monthlyServiceExpenses)}
                        </div>
                    </div>
                </div>

                <div className={`summary-card ${financeData.netProfit >= 0 ? 'profit' : 'loss'}`}>
                    {financeData.netProfit >= 0 ? <TrendingUp className="card-icon" size={24} /> : <TrendingDown className="card-icon" size={24} />}
                    <div className="card-content">
                        <div className="card-label">Net Profit</div>
                        <div className="card-value">{formatCurrency(financeData.netProfit)}</div>
                        <div className="card-subtitle">
                            {financeData.netProfit >= 0 ? 'Profitable' : 'Operating at loss'}
                        </div>
                    </div>
                </div>
            </div>

            {/* Service Categories Breakdown */}
            <div className="service-breakdown">
                <h3>Service Expenses Breakdown</h3>
                <div className="category-grid">
                    <div className="category-item">
                        <Wrench className="category-icon" size={20} />
                        <div className="category-details">
                            <span className="category-name">Service</span>
                            <span className="category-amount">{formatCurrency(financeData.serviceCategories.service)}</span>
                        </div>
                    </div>
                    <div className="category-item">
                        <Hammer className="category-icon" size={20} />
                        <div className="category-details">
                            <span className="category-name">Repairs</span>
                            <span className="category-amount">{formatCurrency(financeData.serviceCategories.repair)}</span>
                        </div>
                    </div>
                    <div className="category-item">
                        <Fuel className="category-icon" size={20} />
                        <div className="category-details">
                            <span className="category-name">Fuel</span>
                            <span className="category-amount">{formatCurrency(financeData.serviceCategories.fuel)}</span>
                        </div>
                    </div>
                    <div className="category-item">
                        <Shield className="category-icon" size={20} />
                        <div className="category-details">
                            <span className="category-name">Insurance</span>
                            <span className="category-amount">{formatCurrency(financeData.serviceCategories.insurance)}</span>
                        </div>
                    </div>
                    <div className="category-item">
                        <ClipboardList className="category-icon" size={20} />
                        <div className="category-details">
                            <span className="category-name">Other</span>
                            <span className="category-amount">{formatCurrency(financeData.serviceCategories.other)}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Transactions */}
            <div className="recent-transactions">
                <h3>Recent Car-Related Transactions</h3>
                {financeData.recentTransactions.length === 0 ? (
                    <div className="no-transactions">No car-related transactions found</div>
                ) : (
                    <div className="transaction-list">
                        {financeData.recentTransactions.map(transaction => (
                            <div key={transaction.id} className={`transaction-item ${transaction.is_income ? 'income' : 'expense'}`}>
                                <div className="transaction-icon">
                                    {getCategoryIcon(transaction.payment_type === 'car_rental_income' ? 'rental' : transaction.category)}
                                </div>
                                <div className="transaction-info">
                                    <div className="transaction-title">{transaction.title}</div>
                                    <div className="transaction-meta">
                                        {transaction.category || transaction.payment_type.replace(/_/g, ' ')} • {formatDate(transaction.paid_date || transaction.due_date)}
                                    </div>
                                </div>
                                <div className={`transaction-amount ${transaction.is_income ? 'positive' : 'negative'}`}>
                                    {transaction.is_income ? '+' : '-'}{formatCurrency(Math.abs(transaction.amount))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Monthly Comparison Chart (Simple Bar) */}
            <div className="monthly-comparison">
                <h3>Monthly Overview</h3>
                <div className="comparison-bars">
                    <div className="bar-group">
                        <div className="bar-label">Income</div>
                        <div className="bar-container">
                            <div 
                                className="bar income-bar" 
                                style={{
                                    width: `${Math.min((financeData.monthlyRentalIncome / Math.max(financeData.monthlyRentalIncome, financeData.monthlyServiceExpenses)) * 100, 100)}%`
                                }}
                            >
                                <span className="bar-value">{formatCurrency(financeData.monthlyRentalIncome)}</span>
                            </div>
                        </div>
                    </div>
                    <div className="bar-group">
                        <div className="bar-label">Expenses</div>
                        <div className="bar-container">
                            <div 
                                className="bar expense-bar" 
                                style={{
                                    width: `${Math.min((financeData.monthlyServiceExpenses / Math.max(financeData.monthlyRentalIncome, financeData.monthlyServiceExpenses)) * 100, 100)}%`
                                }}
                            >
                                <span className="bar-value">{formatCurrency(financeData.monthlyServiceExpenses)}</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="comparison-summary">
                    <span className={`monthly-net ${(financeData.monthlyRentalIncome - financeData.monthlyServiceExpenses) >= 0 ? 'positive' : 'negative'}`}>
                        Monthly Net: {formatCurrency(financeData.monthlyRentalIncome - financeData.monthlyServiceExpenses)}
                    </span>
                </div>
            </div>
        </div>
    );
};

// Add styles to the document
if (typeof document !== 'undefined' && !document.getElementById('car-finance-widget-styles')) {
    const styleSheet = document.createElement('style');
    styleSheet.id = 'car-finance-widget-styles';
    styleSheet.textContent = `
.car-finance-widget {
    background: white;
    border-radius: 12px;
    padding: 24px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
    margin-bottom: 24px;
}

.car-finance-widget.loading {
    min-height: 400px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
}

.widget-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
    padding-bottom: 16px;
    border-bottom: 2px solid #f0f0f0;
}

.widget-header h2 {
    margin: 0;
    font-size: 1.5rem;
    color: #2c3e50;
    display: flex;
    align-items: center;
    gap: 8px;
}

.header-actions {
    display: flex;
    gap: 10px;
}

.refresh-btn {
    padding: 8px 12px;
    background: #f0f0f0;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 16px;
    transition: all 0.3s;
}

.refresh-btn:hover {
    background: #e0e0e0;
    transform: rotate(180deg);
}

.view-all-btn {
    padding: 8px 16px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 500;
    transition: all 0.3s;
}

.view-all-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.finance-summary-cards {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 20px;
    margin-bottom: 30px;
}

.summary-card {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    padding: 20px;
    border-radius: 12px;
    color: white;
    display: flex;
    align-items: center;
    gap: 16px;
    transition: transform 0.3s;
}

.summary-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
}

.summary-card.income {
    background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
}

.summary-card.expense {
    background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
}

.summary-card.profit {
    background: linear-gradient(135deg, #00b894 0%, #00cec9 100%);
}

.summary-card.loss {
    background: linear-gradient(135deg, #d63031 0%, #74b9ff 100%);
}

.card-icon {
    font-size: 2.5rem;
}

.card-content {
    flex: 1;
}

.card-label {
    font-size: 0.9rem;
    opacity: 0.9;
    margin-bottom: 4px;
}

.card-value {
    font-size: 1.8rem;
    font-weight: bold;
    margin-bottom: 4px;
}

.card-subtitle {
    font-size: 0.85rem;
    opacity: 0.8;
}

.service-breakdown {
    background: #f8f9fa;
    padding: 20px;
    border-radius: 10px;
    margin-bottom: 25px;
}

.service-breakdown h3 {
    margin: 0 0 16px 0;
    color: #2c3e50;
    font-size: 1.1rem;
}

.category-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 15px;
}

.category-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px;
    background: white;
    border-radius: 8px;
    border: 1px solid #e0e0e0;
}

.category-icon {
    font-size: 1.5rem;
}

.category-details {
    display: flex;
    flex-direction: column;
    flex: 1;
}

.category-name {
    font-size: 0.85rem;
    color: #666;
    margin-bottom: 2px;
}

.category-amount {
    font-weight: 600;
    color: #2c3e50;
}

.recent-transactions {
    margin-top: 25px;
}

.recent-transactions h3 {
    margin: 0 0 16px 0;
    color: #2c3e50;
    font-size: 1.1rem;
}

.transaction-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.transaction-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px;
    background: #f8f9fa;
    border-radius: 8px;
    transition: all 0.3s;
    border-left: 3px solid transparent;
}

.transaction-item.income {
    border-left-color: #4CAF50;
}

.transaction-item.expense {
    border-left-color: #ff6b6b;
}

.transaction-item:hover {
    background: #e9ecef;
    transform: translateX(4px);
}

.transaction-icon {
    font-size: 1.5rem;
}

.transaction-info {
    flex: 1;
}

.transaction-title {
    font-weight: 600;
    color: #2c3e50;
    margin-bottom: 2px;
}

.transaction-meta {
    font-size: 0.85rem;
    color: #666;
}

.transaction-amount {
    font-weight: bold;
    font-size: 1.1rem;
}

.transaction-amount.positive {
    color: #4CAF50;
}

.transaction-amount.negative {
    color: #ff6b6b;
}

.monthly-comparison {
    margin-top: 30px;
    padding: 20px;
    background: #f8f9fa;
    border-radius: 10px;
}

.monthly-comparison h3 {
    margin: 0 0 20px 0;
    color: #2c3e50;
    font-size: 1.1rem;
}

.comparison-bars {
    display: flex;
    flex-direction: column;
    gap: 15px;
    margin-bottom: 20px;
}

.bar-group {
    display: flex;
    align-items: center;
    gap: 15px;
}

.bar-label {
    min-width: 80px;
    font-size: 0.9rem;
    color: #666;
}

.bar-container {
    flex: 1;
    height: 35px;
    background: #e0e0e0;
    border-radius: 20px;
    overflow: hidden;
    position: relative;
}

.bar {
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    padding-right: 10px;
    transition: width 0.5s ease;
    min-width: 80px;
}

.income-bar {
    background: linear-gradient(90deg, #4CAF50, #45a049);
}

.expense-bar {
    background: linear-gradient(90deg, #ff6b6b, #ee5a24);
}

.bar-value {
    color: white;
    font-weight: bold;
    font-size: 0.85rem;
}

.comparison-summary {
    text-align: center;
    padding-top: 15px;
    border-top: 1px solid #ddd;
}

.monthly-net {
    font-size: 1.1rem;
    font-weight: bold;
}

.monthly-net.positive {
    color: #4CAF50;
}

.monthly-net.negative {
    color: #ff6b6b;
}

.no-transactions {
    text-align: center;
    padding: 30px;
    color: #999;
    font-style: italic;
}

.loading-spinner {
    color: #666;
    font-style: italic;
}
    `;
    document.head.appendChild(styleSheet);
}

export default CarFinanceWidget;