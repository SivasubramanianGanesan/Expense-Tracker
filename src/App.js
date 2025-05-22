import React from 'react';
import ExpenseTracker from "./Component/ExpenseTracker"; // Import the component
import './App.css'; // If you have any global styles

function App() {
  return (
    <div className="app"> {/* Optional container for styling */}
      <ExpenseTracker /> {/* Use the ExpenseTracker component */}
    </div>
  );
}

export default App;