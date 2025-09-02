// src/pages/CommissionsPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import useAuth from '../context/useAuth';
import { authApi } from '../api/apiService';
import { paymentApi } from '../api/apiService';
import { useLanguage } from '../context/LanguageContext'; // Import language context
import '../styles/CommissionsPage.css';

const CommissionsPage = () => {
    const { accessToken } = useAuth();
    const { t } = useLanguage(); // Get translation function
    const [loading, setLoading] = useState(true);
    const [employees, setEmployees] = useState([]);
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [commissionSummary, setCommissionSummary] = useState(null);
    const [commissionRules, setCommissionRules] = useState([]);
    const [showRuleModal, setShowRuleModal] = useState(false);
    const [newRule, setNewRule] = useState({
        employee_id: null,
        sale_type: null,
        base_commission_rate: 10,
        min_sale_amount: 0,
        tier1_threshold: null,
        tier1_bonus_rate: 0,
        tier2_threshold: null,
        tier2_bonus_rate: 0,
        tier3_threshold: null,
        tier3_bonus_rate: 0,
        is_active: true
    });

    // Month names in both languages
    const monthNames = {
        en: [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ],
        el: [
            'Ιανουάριος', 'Φεβρουάριος', 'Μάρτιος', 'Απρίλιος', 'Μάιος', 'Ιούνιος',
            'Ιούλιος', 'Αύγουστος', 'Σεπτέμβριος', 'Οκτώβριος', 'Νοέμβριος', 'Δεκέμβριος'
        ]
    };

    const currentLang = localStorage.getItem('language') || 'en';
    const currentMonthNames = monthNames[currentLang] || monthNames.en;

    const fetchCommissionRules = useCallback(async (employeeId) => {
        try {
            const rules = await paymentApi.getCommissionRules(accessToken, employeeId);
            setCommissionRules(rules);
        } catch (error) {
            console.error('Error fetching commission rules:', error);
        }
    }, [accessToken]);

    const fetchEmployees = useCallback(async () => {
        try {
            setLoading(true);
            const users = await authApi.listAllUsers(accessToken);
            const salesEmployees = users.filter(user => 
                user.role === 'Sales' || user.role === 'Manager'
            );
            setEmployees(salesEmployees);
        } catch (error) {
            console.error('Error fetching employees:', error);
        } finally {
            setLoading(false);
        }
    }, [accessToken]);

    useEffect(() => {
        if (accessToken) {
            fetchEmployees();
        }
    }, [accessToken, fetchEmployees]);

    useEffect(() => {
        if (selectedEmployee) {
            fetchCommissionRules(selectedEmployee);
        }
    }, [selectedEmployee, fetchCommissionRules]);

    const calculateCommission = async () => {
        if (!selectedEmployee) {
            alert(t('please_select_employee') || 'Please select an employee');
            return;
        }

        try {
            setLoading(true);
            const summary = await paymentApi.calculateCommission(accessToken, {
                employee_id: selectedEmployee,
                year: selectedYear,
                month: selectedMonth,
                recalculate: true
            });
            setCommissionSummary(summary);
        } catch (error) {
            console.error('Error calculating commission:', error);
            alert(`${t('failed_to_calculate') || 'Failed to calculate commission'}: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const createCommissionPayment = async (summaryId) => {
        try {
            await paymentApi.createCommissionPayment(accessToken, summaryId);
            alert(t('payment_created_success') || 'Payment created successfully');
            calculateCommission();
        } catch (error) {
            console.error('Error creating payment:', error);
            alert(`${t('failed_to_create_payment') || 'Failed to create payment'}: ${error.message}`);
        }
    };

    const handleCreateRule = async () => {
        if (!newRule.employee_id) {
            alert(t('please_select_employee_for_rule') || 'Please select an employee for the rule');
            return;
        }

        try {
            await paymentApi.createCommissionRule(accessToken, newRule);
            alert(t('rule_created_success') || 'Commission rule created successfully');
            setShowRuleModal(false);
            setNewRule({
                employee_id: null,
                sale_type: null,
                base_commission_rate: 10,
                min_sale_amount: 0,
                tier1_threshold: null,
                tier1_bonus_rate: 0,
                tier2_threshold: null,
                tier2_bonus_rate: 0,
                tier3_threshold: null,
                tier3_bonus_rate: 0,
                is_active: true
            });
            if (selectedEmployee) {
                fetchCommissionRules(selectedEmployee);
            }
        } catch (error) {
            console.error('Error creating rule:', error);
            alert(`${t('failed_to_create_rule') || 'Failed to create rule'}: ${error.message}`);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('el-GR', {
            style: 'currency',
            currency: 'EUR'
        }).format(amount);
    };

    if (loading) {
        return <div className="loading-spinner">{t('loading') || 'Loading...'}</div>;
    }

    return (
        <div className="commissions-page">
            <div className="page-header">
                <h1>{t('commission_management') || 'Commission Management'}</h1>
                <button 
                    className="btn-primary"
                    onClick={() => setShowRuleModal(true)}
                >
                    {t('add_commission_rule') || 'Add Commission Rule'}
                </button>
            </div>

            {/* Commission Calculator */}
            <div className="commission-calculator">
                <h2>{t('calculate_monthly_commission') || 'Calculate Monthly Commission'}</h2>
                <div className="calculator-controls">
                    <div className="form-group">
                        <label>{t('employee') || 'Employee'}</label>
                        <select 
                            value={selectedEmployee || ''}
                            onChange={(e) => setSelectedEmployee(Number(e.target.value))}
                        >
                            <option value="">{t('select_employee') || 'Select Employee'}</option>
                            {employees.map(emp => (
                                <option key={emp.id} value={emp.id}>
                                    {emp.first_name} {emp.last_name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label>{t('year') || 'Year'}</label>
                        <select 
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(Number(e.target.value))}
                        >
                            {[2023, 2024, 2025].map(year => (
                                <option key={year} value={year}>{year}</option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label>{t('month') || 'Month'}</label>
                        <select 
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(Number(e.target.value))}
                        >
                            {currentMonthNames.map((month, index) => (
                                <option key={index} value={index + 1}>{month}</option>
                            ))}
                        </select>
                    </div>

                    <button 
                        className="btn-calculate"
                        onClick={calculateCommission}
                        disabled={!selectedEmployee}
                    >
                        {t('calculate_commission') || 'Calculate Commission'}
                    </button>
                </div>

                {/* Commission Summary */}
                {commissionSummary && (
                    <div className="commission-summary">
                        <h3>
                            {t('commission_summary_for') || 'Commission Summary for'} {currentMonthNames[commissionSummary.month - 1]} {commissionSummary.year}
                        </h3>
                        <div className="summary-grid">
                            <div className="summary-card">
                                <label>{t('total_sales') || 'Total Sales'}</label>
                                <div className="value">{formatCurrency(commissionSummary.total_sales_amount)}</div>
                            </div>
                            <div className="summary-card">
                                <label>{t('closed_deals') || 'Closed Deals'}</label>
                                <div className="value">{commissionSummary.closed_deals_count}</div>
                            </div>
                            <div className="summary-card">
                                <label>{t('base_commission') || 'Base Commission'}</label>
                                <div className="value">{formatCurrency(commissionSummary.base_commission)}</div>
                            </div>
                            <div className="summary-card">
                                <label>{t('tier_bonus') || 'Tier Bonus'}</label>
                                <div className="value">{formatCurrency(commissionSummary.tier_bonus)}</div>
                            </div>
                            <div className="summary-card highlight">
                                <label>{t('total_commission') || 'Total Commission'}</label>
                                <div className="value">{formatCurrency(commissionSummary.total_commission)}</div>
                            </div>
                            <div className="summary-card">
                                <label>{t('payment_status') || 'Payment Status'}</label>
                                <div className={`status ${commissionSummary.payment_status}`}>
                                    {t(commissionSummary.payment_status) || commissionSummary.payment_status}
                                </div>
                            </div>
                        </div>

                        {commissionSummary.payment_status === 'calculated' && (
                            <button 
                                className="btn-create-payment"
                                onClick={() => createCommissionPayment(commissionSummary.id)}
                            >
                                {t('create_payment') || 'Create Payment'}
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Commission Rules */}
            {selectedEmployee && (
                <div className="commission-rules">
                    <h2>{t('commission_rules_for_employee') || 'Commission Rules for Selected Employee'}</h2>
                    {commissionRules.length === 0 ? (
                        <p>{t('no_commission_rules') || 'No commission rules found for this employee.'}</p>
                    ) : (
                        <div className="rules-list">
                            {commissionRules.map(rule => (
                                <div key={rule.id} className="rule-card">
                                    <div className="rule-header">
                                        <span className="rule-type">
                                            {t(rule.sale_type) || rule.sale_type || t('all_sales') || 'All Sales'}
                                        </span>
                                        <span className={`rule-status ${rule.is_active ? 'active' : 'inactive'}`}>
                                            {rule.is_active ? (t('active') || 'Active') : (t('inactive') || 'Inactive')}
                                        </span>
                                    </div>
                                    <div className="rule-details">
                                        <div>{t('base_rate') || 'Base Rate'}: {rule.base_commission_rate}%</div>
                                        <div>{t('min_amount') || 'Min Amount'}: {formatCurrency(rule.min_sale_amount)}</div>
                                        {rule.tier1_threshold && (
                                            <div>{t('tier_1') || 'Tier 1'}: {formatCurrency(rule.tier1_threshold)} (+{rule.tier1_bonus_rate}%)</div>
                                        )}
                                        {rule.tier2_threshold && (
                                            <div>{t('tier_2') || 'Tier 2'}: {formatCurrency(rule.tier2_threshold)} (+{rule.tier2_bonus_rate}%)</div>
                                        )}
                                        {rule.tier3_threshold && (
                                            <div>{t('tier_3') || 'Tier 3'}: {formatCurrency(rule.tier3_threshold)} (+{rule.tier3_bonus_rate}%)</div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Commission Rule Modal */}
            {showRuleModal && (
                <div className="modal-overlay" onClick={() => setShowRuleModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h2>{t('create_commission_rule') || 'Create Commission Rule'}</h2>
                        
                        <div className="form-group">
                            <label>{t('employee') || 'Employee'} *</label>
                            <select 
                                value={newRule.employee_id || ''}
                                onChange={(e) => setNewRule({...newRule, employee_id: Number(e.target.value)})}
                            >
                                <option value="">{t('select_employee') || 'Select Employee'}</option>
                                {employees.map(emp => (
                                    <option key={emp.id} value={emp.id}>
                                        {emp.first_name} {emp.last_name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label>{t('sale_type') || 'Sale Type'}</label>
                            <select 
                                value={newRule.sale_type || ''}
                                onChange={(e) => setNewRule({...newRule, sale_type: e.target.value || null})}
                            >
                                <option value="">{t('all_sales') || 'All Sales'}</option>
                                <option value="rental">{t('rental') || 'Rental'}</option>
                                <option value="service">{t('service') || 'Service'}</option>
                                <option value="product">{t('product') || 'Product'}</option>
                                <option value="subscription">{t('subscription') || 'Subscription'}</option>
                            </select>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>{t('base_commission_rate') || 'Base Commission Rate'} (%)</label>
                                <input 
                                    type="number"
                                    value={newRule.base_commission_rate}
                                    onChange={(e) => setNewRule({...newRule, base_commission_rate: Number(e.target.value)})}
                                    min="0"
                                    max="100"
                                    step="0.1"
                                />
                            </div>

                            <div className="form-group">
                                <label>{t('minimum_sale_amount') || 'Minimum Sale Amount'}</label>
                                <input 
                                    type="number"
                                    value={newRule.min_sale_amount}
                                    onChange={(e) => setNewRule({...newRule, min_sale_amount: Number(e.target.value)})}
                                    min="0"
                                    step="100"
                                />
                            </div>
                        </div>

                        <h3>{t('bonus_tiers_optional') || 'Bonus Tiers (Optional)'}</h3>

                        <div className="form-row">
                            <div className="form-group">
                                <label>{t('tier_1_threshold') || 'Tier 1 Threshold'}</label>
                                <input 
                                    type="number"
                                    value={newRule.tier1_threshold || ''}
                                    onChange={(e) => setNewRule({...newRule, tier1_threshold: e.target.value ? Number(e.target.value) : null})}
                                    min="0"
                                    step="1000"
                                />
                            </div>
                            <div className="form-group">
                                <label>{t('tier_1_bonus') || 'Tier 1 Bonus'} (%)</label>
                                <input 
                                    type="number"
                                    value={newRule.tier1_bonus_rate}
                                    onChange={(e) => setNewRule({...newRule, tier1_bonus_rate: Number(e.target.value)})}
                                    min="0"
                                    max="100"
                                    step="0.1"
                                />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>{t('tier_2_threshold') || 'Tier 2 Threshold'}</label>
                                <input 
                                    type="number"
                                    value={newRule.tier2_threshold || ''}
                                    onChange={(e) => setNewRule({...newRule, tier2_threshold: e.target.value ? Number(e.target.value) : null})}
                                    min="0"
                                    step="1000"
                                />
                            </div>
                            <div className="form-group">
                                <label>{t('tier_2_bonus') || 'Tier 2 Bonus'} (%)</label>
                                <input 
                                    type="number"
                                    value={newRule.tier2_bonus_rate}
                                    onChange={(e) => setNewRule({...newRule, tier2_bonus_rate: Number(e.target.value)})}
                                    min="0"
                                    max="100"
                                    step="0.1"
                                />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>{t('tier_3_threshold') || 'Tier 3 Threshold'}</label>
                                <input 
                                    type="number"
                                    value={newRule.tier3_threshold || ''}
                                    onChange={(e) => setNewRule({...newRule, tier3_threshold: e.target.value ? Number(e.target.value) : null})}
                                    min="0"
                                    step="1000"
                                />
                            </div>
                            <div className="form-group">
                                <label>{t('tier_3_bonus') || 'Tier 3 Bonus'} (%)</label>
                                <input 
                                    type="number"
                                    value={newRule.tier3_bonus_rate}
                                    onChange={(e) => setNewRule({...newRule, tier3_bonus_rate: Number(e.target.value)})}
                                    min="0"
                                    max="100"
                                    step="0.1"
                                />
                            </div>
                        </div>

                        <div className="modal-actions">
                            <button 
                                className="btn-secondary"
                                onClick={() => setShowRuleModal(false)}
                            >
                                {t('cancel') || 'Cancel'}
                            </button>
                            <button 
                                className="btn-primary"
                                onClick={handleCreateRule}
                                disabled={!newRule.employee_id}
                            >
                                {t('create_rule') || 'Create Rule'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CommissionsPage;