import React, { useState, useEffect } from "react";
import './ExpenseTracker.css';

const SavingsSuggestion = ({ salary, expenses }) => {
    const [suggestion, setSuggestion] = useState('');

    useEffect(() => {
        handleGetSuggestion();
    }, [salary, expenses]);

    const handleGetSuggestion = () => {
        const parsedSalary = parseFloat(salary);

        if (isNaN(parsedSalary)) {
            setSuggestion('Please enter a valid salary.');
        } else if (parsedSalary < expenses) {
            setSuggestion('You are spending more than your income. Consider reducing expenses.');
        } else {
            // "AI" logic here
            const essentialPercentage = 0.5;
            const savingsPercentage = 0.3;
            const lifestylePercentage = 0.2;

            const essentialAmount = parsedSalary * essentialPercentage;
            const savingsAmount = parsedSalary * savingsPercentage;
            const lifestyleAmount = parsedSalary * lifestylePercentage;

            const suggestionText = `Based on your income of ₹${parsedSalary.toFixed(2)}, here's a suggested budget:\n
            1. Essential Expenses (${essentialPercentage * 100}%): ₹${essentialAmount.toFixed(2)} (Rent, utilities, groceries, etc.)\n
            2. Savings & Investments (${savingsPercentage * 100}%): ₹${savingsAmount.toFixed(2)} (Emergency fund, long-term savings, investments)\n
            3. Lifestyle & Personal Growth (${lifestylePercentage * 100}%): ₹${lifestyleAmount.toFixed(2)} (Entertainment, self-development, etc.)\n
            Remember, this is a general guideline.  Adjust the percentages based on your specific needs and financial goals.  Consider consulting a financial advisor for personalized advice.
            `;
            setSuggestion(suggestionText);
        }
    };

    return (
        <div className="suggestion-container">
            <h3>Financial Guidance</h3>
            <div className="form-control">
                <label htmlFor="salary">Enter your Income:</label>
                <input
                    type="number"
                    id="salary"
                    name="salary"
                    value={salary}
                    onChange={(e) => {
                        const value = e.target.value;
                        setSalary(value);
                    }}
                    placeholder="Enter your income..."
                />
            </div>
            <button className="suggest-btn" onClick={handleGetSuggestion}>
                Get Plan
            </button>
            {suggestion && <textarea readOnly className="suggestion-text" value={suggestion} rows={8} />}
        </div>
    );
};

export default SavingsSuggestion;
