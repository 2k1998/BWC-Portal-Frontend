// src/api/carFinanceAPI.js
import { callApi } from './apiService';

export const carFinanceApi = {
    // Get financial summary
    getSummary: (startDate, endDate, token) => 
        callApi(`/car-finances/summary?start_date=${startDate}&end_date=${endDate}`, 'GET', null, token),
    
    // Get all cars in the fleet
    getCars: (token) => 
        callApi('/car-finances/cars', 'GET', null, token),
    
    // Get rental records
    getRentals: (token) => 
        callApi('/car-finances/rentals', 'GET', null, token),
    
    // Get all transactions
    getTransactions: (params, token) => {
        const queryString = new URLSearchParams(params).toString();
        return callApi(`/car-finances/transactions?${queryString}`, 'GET', null, token);
    },
    
    // Add income record
    addIncome: (incomeData, token) => 
        callApi('/car-finances/income', 'POST', incomeData, token),
    
    // Add expense record
    addExpense: (expenseData, token) => 
        callApi('/car-finances/expense', 'POST', expenseData, token),
    
    // Delete income record
    deleteIncome: (incomeId, token) => 
        callApi(`/car-finances/income/${incomeId}`, 'DELETE', null, token),
    
    // Delete expense record
    deleteExpense: (expenseId, token) => 
        callApi(`/car-finances/expense/${expenseId}`, 'DELETE', null, token),
    
    // Update income record
    updateIncome: (incomeId, incomeData, token) => 
        callApi(`/car-finances/income/${incomeId}`, 'PUT', incomeData, token),
    
    // Update expense record
    updateExpense: (expenseId, expenseData, token) => 
        callApi(`/car-finances/expense/${expenseId}`, 'PUT', expenseData, token),
};