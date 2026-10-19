import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from 'chart.js';
import { ArrowDownLeft, ArrowUpRight, CalendarDays, CheckCircle2, CircleDollarSign, Clock3, Filter, LoaderCircle, Plus, Search, Sparkles, Trash2, TrendingUp, WalletCards } from 'lucide-react';
import './ExpenseTracker.css';

Chart.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);
const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';
const CATEGORIES = ['Food', 'Groceries', 'Transport', 'Bills', 'Shopping', 'Health', 'Entertainment', 'Salary', 'Freelance', 'Other'];
const money = (value) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(Number(value) || 0);
const dateLabel = (value) => {
  if (!value) return 'Date unavailable';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Date unavailable' : date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

function ExpenseTracker({ token, onLogout }) {
  const [transactions, setTransactions] = useState([]);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState('expense');
  const [category, setCategory] = useState('Food');
  const [salary, setSalary] = useState('');
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const request = useCallback(async (path, options = {}) => {
    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...(options.headers || {}) },
    });
    const data = await response.json().catch(() => ({}));
    if (response.status === 401 || response.status === 403) {
      onLogout?.();
      throw new Error('Your session has expired. Please sign in again.');
    }
    if (!response.ok) throw new Error(data.message || `Request failed (${response.status}).`);
    return data;
  }, [token, onLogout]);

  const loadTransactions = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const data = await request('/api/transactions');
      if (!Array.isArray(data)) throw new Error('The transactions API did not return a list.');
      setTransactions(data);
    } catch (err) {
      setError(`${err.message} Make sure the backend is running at ${API_BASE}.`);
    } finally { setLoading(false); }
  }, [request]);

  useEffect(() => { loadTransactions(); }, [loadTransactions]);

  const totals = useMemo(() => transactions.reduce((acc, item) => {
    const value = Number(item.amount) || 0;
    if (item.type === 'income') acc.income += value;
    if (item.type === 'expense') acc.expenses += value;
    return acc;
  }, { income: 0, expenses: 0 }), [transactions]);
  const balance = totals.income - totals.expenses;

  const categoryData = useMemo(() => {
    const grouped = {};
    transactions.filter(t => t.type === 'expense').forEach(t => { const key = t.category || 'Other'; grouped[key] = (grouped[key] || 0) + (Number(t.amount) || 0); });
    return Object.entries(grouped).sort((a, b) => b[1] - a[1]);
  }, [transactions]);
  const chartData = useMemo(() => ({
    labels: categoryData.map(([name]) => name),
    datasets: [{ label: 'Expenses', data: categoryData.map(([, value]) => value), backgroundColor: '#2c9b77', hoverBackgroundColor: '#167454', borderRadius: 7, maxBarThickness: 28 }],
  }), [categoryData]);
  const chartOptions = useMemo(() => ({ responsive: true, maintainAspectRatio: false, indexAxis: 'y', plugins: { legend: { display: false }, tooltip: { callbacks: { label: (context) => ` ${money(context.raw)}` } } }, scales: { x: { beginAtZero: true, grid: { color: '#edf1f5' }, ticks: { callback: (value) => `₹${Number(value).toLocaleString('en-IN')}`, color: '#8793a4', font: { size: 11 } }, border: { display: false } }, y: { grid: { display: false }, ticks: { color: '#526174', font: { size: 12 } }, border: { display: false } } } }), []);

  const filteredTransactions = useMemo(() => transactions.filter(t => {
    const query = search.trim().toLowerCase();
    const matchesQuery = !query || `${t.description || ''} ${t.category || ''}`.toLowerCase().includes(query);
    return matchesQuery && (filterType === 'all' || t.type === filterType);
  }), [transactions, search, filterType]);

  const handleSubmit = async (event) => {
    event.preventDefault(); setError(''); setNotice('');
    const parsedAmount = Number(amount);
    if (!description.trim() || !Number.isFinite(parsedAmount) || parsedAmount <= 0 || !category) {
      setError('Enter a description, a positive amount, and a category.'); return;
    }
    setSaving(true);
    try {
      const data = await request('/api/transactions', { method: 'POST', body: JSON.stringify({ description: description.trim(), amount: parsedAmount, type, category }) });
      if (data.transaction) setTransactions(current => [data.transaction, ...current.filter(t => t.id !== data.transaction.id)]);
      else await loadTransactions();
      setDescription(''); setAmount(''); setType('expense'); setCategory('Food');
      setNotice('Transaction saved to your account.');
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };

  const salaryValue = Number(salary);
  const savingsTarget = salaryValue > 0 ? Math.max(0, salaryValue * 0.2) : 0;
  const remaining = salaryValue - totals.expenses;

  return (
    <main className="dashboard-page">
      <section className="dashboard-heading">
        <div><p className="eyebrow">OVERVIEW</p><h1>Your financial snapshot</h1><p className="heading-copy">A simple view of where your money comes from and where it goes.</p></div>
        <div className="date-chip"><CalendarDays size={17} /> {new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</div>
      </section>

      {error && <div className="dashboard-alert error-alert" role="alert"><span>{error}</span><button onClick={() => { setError(''); loadTransactions(); }}>Try again</button></div>}
      {notice && <div className="dashboard-alert success-alert"><CheckCircle2 size={17} /> {notice}<button onClick={() => setNotice('')} aria-label="Dismiss message">×</button></div>}

      <section className="stats-grid" aria-label="Financial summary">
        <article className="stat-card balance-card"><div className="stat-top"><span className="stat-label">Available balance</span><span className="stat-icon"><WalletCards size={20} /></span></div><p className="stat-value">{money(balance)}</p><div className="stat-foot"><span className="stat-dot green-dot" /> Income minus expenses</div><div className="balance-decoration" /></article>
        <article className="stat-card"><div className="stat-top"><span className="stat-label">Total income</span><span className="stat-icon income-icon"><ArrowDownLeft size={20} /></span></div><p className="stat-value">{money(totals.income)}</p><div className="stat-foot"><span className="stat-dot green-dot" /> Money received</div></article>
        <article className="stat-card"><div className="stat-top"><span className="stat-label">Total expenses</span><span className="stat-icon expense-icon"><ArrowUpRight size={20} /></span></div><p className="stat-value">{money(totals.expenses)}</p><div className="stat-foot"><span className="stat-dot red-dot" /> Money spent</div></article>
        <article className="stat-card"><div className="stat-top"><span className="stat-label">Transactions</span><span className="stat-icon neutral-icon"><CircleDollarSign size={20} /></span></div><p className="stat-value">{transactions.length}</p><div className="stat-foot"><span className="stat-dot blue-dot" /> Saved records</div></article>
      </section>

      <section className="dashboard-grid">
        <article className="surface-card add-card">
          <div className="section-heading"><div><span className="section-kicker">QUICK ACTION</span><h2>Add a transaction</h2><p>Record income or an expense.</p></div><span className="heading-icon"><Plus size={21} /></span></div>
          <form className="transaction-form" onSubmit={handleSubmit}>
            <div className="type-switch" role="group" aria-label="Transaction type"><button type="button" className={type === 'expense' ? 'type-option active expense-active' : 'type-option'} onClick={() => { setType('expense'); if (category === 'Salary' || category === 'Freelance') setCategory('Food'); }}><ArrowUpRight size={17} /> Expense</button><button type="button" className={type === 'income' ? 'type-option active income-active' : 'type-option'} onClick={() => { setType('income'); if (['Food','Groceries','Transport','Bills','Shopping','Health','Entertainment'].includes(category)) setCategory('Salary'); }}><ArrowDownLeft size={17} /> Income</button></div>
            <div className="field-group"><label htmlFor="description">Description</label><input id="description" value={description} onChange={e => setDescription(e.target.value)} placeholder="e.g. Weekly groceries" maxLength={120} required /></div>
            <div className="field-row"><div className="field-group"><label htmlFor="amount">Amount (₹)</label><div className="amount-input"><span>₹</span><input id="amount" type="number" min="0.01" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" required /></div></div><div className="field-group"><label htmlFor="category">Category</label><select id="category" value={category} onChange={e => setCategory(e.target.value)} required>{CATEGORIES.filter(c => type === 'income' ? ['Salary','Freelance','Other'].includes(c) : !['Salary','Freelance'].includes(c)).map(c => <option key={c} value={c}>{c}</option>)}</select></div></div>
            <button className="primary-button save-button" type="submit" disabled={saving}>{saving ? <><LoaderCircle className="spin" size={18} /> Saving…</> : <><Plus size={18} /> Save transaction</>}</button>
          </form>
          <div className="form-secure-note"><CheckCircle2 size={15} /> Saved securely to your account</div>
        </article>

        <article className="surface-card chart-card">
          <div className="section-heading"><div><span className="section-kicker">SPENDING INSIGHTS</span><h2>Expenses by category</h2><p>See which categories use the most money.</p></div><span className="heading-icon"><TrendingUp size={21} /></span></div>
          {categoryData.length ? <div className="chart-area"><Bar data={chartData} options={chartOptions} /></div> : <div className="empty-chart"><span className="empty-illustration"><TrendingUp size={26} /></span><strong>No expense data yet</strong><p>Add an expense and your category breakdown will appear here.</p></div>}
        </article>
      </section>

      <section className="dashboard-grid lower-grid">
        <article className="surface-card transactions-card">
          <div className="section-heading transactions-heading"><div><span className="section-kicker">YOUR ACTIVITY</span><h2>Recent transactions</h2><p>Transactions retrieved from your account.</p></div><span className="count-pill">{filteredTransactions.length} records</span></div>
          <div className="transaction-tools"><div className="search-field"><Search size={17} /><input aria-label="Search transactions" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search description or category" /></div><div className="filter-field"><Filter size={16} /><select aria-label="Filter transaction type" value={filterType} onChange={e => setFilterType(e.target.value)}><option value="all">All types</option><option value="income">Income</option><option value="expense">Expenses</option></select></div></div>
          {loading ? <div className="loading-state"><LoaderCircle className="spin" size={22} /> Loading your transactions…</div> : filteredTransactions.length ? <div className="transaction-table-wrap"><table className="transaction-table"><thead><tr><th>TRANSACTION</th><th>DATE</th><th>TYPE</th><th className="amount-column">AMOUNT</th></tr></thead><tbody>{filteredTransactions.map(t => <tr key={t.id}><td><div className="transaction-name-cell"><span className={`transaction-symbol ${t.type === 'income' ? 'symbol-income' : 'symbol-expense'}`}>{t.type === 'income' ? <ArrowDownLeft size={17} /> : <ArrowUpRight size={17} />}</span><span><strong>{t.description}</strong><small>{t.category || 'Uncategorised'}</small></span></div></td><td className="date-cell"><Clock3 size={14} /> {dateLabel(t.createdAt || t.date)}</td><td><span className={`type-badge ${t.type === 'income' ? 'badge-income' : 'badge-expense'}`}>{t.type === 'income' ? 'Income' : 'Expense'}</span></td><td className={`amount-cell ${t.type === 'income' ? 'text-income' : 'text-expense'}`}>{t.type === 'income' ? '+' : '−'}{money(t.amount)}</td></tr>)}</tbody></table></div> : <div className="empty-transactions"><span className="empty-illustration"><WalletCards size={25} /></span><strong>{transactions.length ? 'No matching transactions' : 'Nothing here yet'}</strong><p>{transactions.length ? 'Try changing your search or filter.' : 'Your saved transactions will show up here after you add one.'}</p></div>}
          {!loading && transactions.length > 0 && <div className="table-footer"><span>Showing {filteredTransactions.length} of {transactions.length} transactions</span><button onClick={loadTransactions} className="refresh-button">Refresh list</button></div>}
        </article>

        <article className="surface-card advisor-card">
          <div className="section-heading"><div><span className="section-kicker">PLAN AHEAD</span><h2>Budget advisor</h2><p>A simple guide based on your monthly income.</p></div><span className="heading-icon advisor-icon"><Sparkles size={20} /></span></div>
          <div className="field-group salary-field"><label htmlFor="salary">Monthly income (₹)</label><input id="salary" type="number" min="0" value={salary} onChange={e => setSalary(e.target.value)} placeholder="Enter your monthly income" /></div>
          {salaryValue > 0 && Number.isFinite(salaryValue) ? <><div className="budget-summary"><span>Suggested savings target</span><strong>{money(savingsTarget)}</strong><small>20% of your monthly income</small></div><div className="budget-line"><div><span>Expenses so far</span><strong>{money(totals.expenses)}</strong></div><div className="progress-track"><span style={{ width: `${Math.min(100, (totals.expenses / salaryValue) * 100)}%` }} /></div><small>{Math.round((totals.expenses / salaryValue) * 100)}% of entered income spent</small></div><div className={`advisor-message ${remaining < 0 ? 'advisor-warning' : 'advisor-positive'}`}>{remaining < 0 ? 'Your recorded expenses are higher than this income. Review spending categories and adjust your budget if needed.' : `You have ${money(remaining)} left after recorded expenses. Consider setting aside ${money(savingsTarget)} toward savings.`}</div></> : <div className="advisor-placeholder"><Sparkles size={22} /><p>Enter your monthly income to see a suggested 20% savings target and spending progress.</p></div>}
          <p className="advisor-disclaimer">Guidance is a general budgeting aid, not financial advice.</p>
        </article>
      </section>
      <div className="dashboard-note"><CheckCircle2 size={15} /> Your dashboard is connected to your authenticated account. Values reflect all transactions returned by the API.</div>
    </main>
  );
}

export default ExpenseTracker;
