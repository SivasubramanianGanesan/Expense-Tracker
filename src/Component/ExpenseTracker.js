import React, { useState, useEffect, useCallback } from 'react';
import { Trash2 } from 'lucide-react';
import { Bar } from 'react-chartjs-2';
import { Chart, registerables } from 'chart.js';
import './ExpenseTracker.css';

Chart.register(...registerables);

const ExpenseChart = ({ expenseData }) => {
    const data = {
        labels: expenseData.map(item => item.category),
        datasets: [{
            label: 'Expenses by Category',
            data: expenseData.map(item => item.total),
            backgroundColor: [
                'rgba(255, 99, 132, 0.6)',
                'rgba(54, 162, 235, 0.6)',
                'rgba(255, 206, 86, 0.6)',
                'rgba(75, 192, 192, 0.6)',
                'rgba(153, 102, 255, 0.6)',
            ],
            borderWidth: 1
        }]
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom'
            }
        }
    };

    return <Bar data={data} options={options} />;
};

const getDynamicPercentages = (salary, expenses) => {
    // Base percentages (50/30/20 rule)
    let essentials = 50;
    let savings = 30;
    let lifestyle = 20;

    // Adjust for low-income earners (essentials will be higher)
    if (salary < 30000) { // Example threshold
        essentials = Math.min(70, essentials + 15); // Max 70% essentials
        lifestyle = Math.max(10, lifestyle - 10);   // Min 10% lifestyle
        savings = 100 - essentials - lifestyle;     // Remainder to savings
    }

    // Adjust if expenses already exceed recommended essentials
    const currentEssentialsRatio = (expenses / salary) * 100;
    if (currentEssentialsRatio > essentials) {
        const overspend = currentEssentialsRatio - essentials;
        essentials = currentEssentialsRatio; // Reflect reality
        lifestyle = Math.max(5, lifestyle - overspend * 0.5); // Reduce lifestyle first
        savings = 100 - essentials - lifestyle;
    }

    // Ensure no negative values
    return {
        essentials: Math.max(0, essentials),
        savings: Math.max(0, savings),
        lifestyle: Math.max(0, lifestyle),
    };
};
const SavingsSuggestion = ({ salary, expenses, onSalaryChange }) => {
    const [suggestion, setSuggestion] = useState('');

    useEffect(() => {
        const parsedSalary = parseFloat(salary);
        if (isNaN(parsedSalary) || parsedSalary <= 0) {
            setSuggestion('');
            return;
        }

        // Generate suggestions
        const balance = parsedSalary - expenses;
        let suggestionText = `Based on ₹${parsedSalary.toFixed(2)} income:\n\n`;
        
        const essentials = Math.min(60, Math.max(50, (expenses / parsedSalary) * 100));
        const savings = Math.max(20, 100 - essentials - 20);
        const lifestyle = 100 - essentials - savings;

        suggestionText += `1. Essentials: ${essentials.toFixed(0)}% (₹${(parsedSalary * essentials / 100).toFixed(2)})\n`;
        suggestionText += `2. Savings: ${savings.toFixed(0)}% (₹${(parsedSalary * savings / 100).toFixed(2)})\n`;
        suggestionText += `3. Lifestyle: ${lifestyle.toFixed(0)}% (₹${(parsedSalary * lifestyle / 100).toFixed(2)})\n\n`;

        if (balance < 0) {
            suggestionText += `⚠️ Overspending by ₹${Math.abs(balance).toFixed(2)}!`;
        }

        setSuggestion(suggestionText);
    }, [salary, expenses]);

    return (
        <div className="suggestion-container">
            <h3>Financial Guidance</h3>
            <div className="form-control">
                <label>Monthly Income (₹)</label>
                <input
                    type="number"
                    value={salary}
                    onChange={(e) => onSalaryChange(e.target.value)}
                    placeholder="Enter your income..."
                />
            </div>
            <textarea 
                className="suggestion-text" 
                value={suggestion}
                readOnly 
                placeholder="Enter income to see suggestions..."
            />
        </div>
    );
};
function ExpenseTracker() {
    const [transactions, setTransactions] = useState([]);
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [type, setType] = useState('expense');
    const [category, setCategory] = useState('');
    const [salary, setSalary] = useState('');
    const [income, setIncome] = useState(0);
    const [expenses, setExpenses] = useState(0);

    // Calculate derived values
    useEffect(() => {
        const newIncome = transactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + parseFloat(t.amount), 0);
        
        const newExpenses = transactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + parseFloat(t.amount), 0);
            
        setIncome(newIncome);
        setExpenses(newExpenses);
    }, [transactions]);

    const calculateBalance = () => income - expenses;

    const expenseDataForChart = transactions
        .filter(t => t.type === 'expense' && t.category)
        .reduce((acc, t) => {
            const amount = parseFloat(t.amount);
            if (!isNaN(amount)) {
                acc[t.category] = (acc[t.category] || 0) + amount;
            }
            return acc;
        }, {});

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!description || !amount || !category) return;
        
        const newTransaction = {
            id: Date.now(),
            description,
            amount: parseFloat(amount),
            type,
            category,
            date: new Date().toISOString()
        };
        
        setTransactions([...transactions, newTransaction]);
        setDescription('');
        setAmount('');
        setCategory('');
    };

    const handleDelete = (id) => {
        setTransactions(transactions.filter(t => t.id !== id));
    };

return (
    <div className="container">
        <h2>Expense Tracker</h2>
        
        <div className="main-content">
            {/* Left Panel */}
            <div className="left-panel">
                {/* Add Transaction */}
                <div className="panel-section">
                    <h3>Add Transaction</h3>
                    <form className="add-transaction-form" onSubmit={handleSubmit}>
                        <div className="form-row">
                            <div className="form-control">
                                <label>Description</label>
                                <input
                                    type="text"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Enter description..."
                                    required
                                />
                            </div>
                            <div className="form-control">
                                <label>Amount (₹)</label>
                                <input
                                    type="number"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    placeholder="0.00"
                                    required
                                />
                            </div>
                        </div>
                        
                        <div className="form-row">
                            <div className="form-control">
                                <label>Type</label>
                                <select value={type} onChange={(e) => setType(e.target.value)}>
                                    <option value="expense">Expense</option>
                                    <option value="income">Income</option>
                                </select>
                            </div>
                            <div className="form-control">
                                <label>Category</label>
                                <input
                                    type="text"
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value)}
                                    placeholder="Category..."
                                    required
                                />
                            </div>
                        </div>
                        
                        <button type="submit" className="btn">Add Transaction</button>
                    </form>
                    
                    {/* Balance Summary */}
                    <div className="summary-container">
                        <div className="summary-item">
                            <h4>Balance</h4>
                            <p className={calculateBalance() >= 0 ? 'positive' : 'negative'}>
                                ₹{calculateBalance().toFixed(2)}
                            </p>
                        </div>
                        <div className="summary-item">
                            <h4>Income</h4>
                            <p className="income">₹{income.toFixed(2)}</p>
                        </div>
                        <div className="summary-item">
                            <h4>Expenses</h4>
                            <p className="expense">₹{expenses.toFixed(2)}</p>
                        </div>
                    </div>
                </div>
                
                {/* Transaction History */}
                <div className="panel-section">
                    <h3>Transaction History</h3>
                    <div className="transaction-list">
                        {transactions.length > 0 ? (
                            transactions.map(t => (
                                <div key={t.id} className={`transaction-item ${t.type}`}>
                                    <span>{t.description}</span>
                                    <span>₹{parseFloat(t.amount).toFixed(2)}</span>
                                    <button onClick={() => handleDelete(t.id)}>
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))
                        ) : (
                            <p>No transactions yet</p>
                        )}
                    </div>
                </div>
            </div>
            
            {/* Right Panel */}
            <div className="right-panel">
                {/* Expense Chart */}
                <div className="panel-section">
                    <h3>Expense Breakdown</h3>
                    <div className="chart-container">
                        {Object.keys(expenseDataForChart).length > 0 ? (
                            <ExpenseChart expenseData={
                                Object.entries(expenseDataForChart).map(([category, total]) => ({
                                    category,
                                    total
                                }))
                            } />
                        ) : (
                            <p>Add expenses to see chart</p>
                        )}
                    </div>
                </div>
                
                {/* Savings Suggestions */}
                 <div className="suggestion-container">
            <h3>AI-Powered Budget Advisor</h3>
      <div className="panel-section">
    <SavingsSuggestion 
        salary={salary} 
        expenses={expenses} 
        onSalaryChange={setSalary} 
    />
</div>

        </div>
            </div>
        </div>
    </div>
);
}

export default ExpenseTracker;