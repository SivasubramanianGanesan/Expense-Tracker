import React, { useState } from 'react';
import { Wallet, LogOut, ShieldCheck } from 'lucide-react';
import ExpenseTracker from './Component/ExpenseTracker';
import LoginForm from './Component/LoginForm';
import './App.css';

const TOKEN_KEY = 'expense_tracker_token';

function App() {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) || '');

  const handleLogin = (newToken) => {
    localStorage.setItem(TOKEN_KEY, newToken);
    setToken(newToken);
  };

  const handleLogout = () => {
    localStorage.removeItem(TOKEN_KEY);
    setToken('');
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="/" aria-label="FinTrack home">
          <span className="brand-mark"><Wallet size={22} /></span>
          <span><strong>FinTrack</strong><small>PERSONAL FINANCE</small></span>
        </a>
        <div className="topbar-right">
          <span className="secure-label"><ShieldCheck size={16} /> Secure workspace</span>
          {token && <button className="logout-button" onClick={handleLogout}><LogOut size={16} /> Sign out</button>}
        </div>
      </header>
      {token ? <ExpenseTracker token={token} onLogout={handleLogout} /> : <LoginForm onLogin={handleLogin} />}
      <footer className="app-footer">FinTrack <span>•</span> Make every rupee count.</footer>
    </div>
  );
}

export default App;
