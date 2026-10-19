import React, { useState } from 'react';
import {
  ArrowRight,
  Eye,
  EyeOff,
  LockKeyhole,
  UserRound,
  Wallet,
  UserPlus,
} from 'lucide-react';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export default function LoginForm({ onLogin }) {
  const [mode, setMode] = useState('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const isRegister = mode === 'register';

  const switchMode = (nextMode) => {
    setMode(nextMode);
    setError('');
    setSuccess('');
    setPassword('');
    setConfirmPassword('');
    setShowPassword(false);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    const cleanUsername = username.trim();

    if (!cleanUsername || !password) {
      setError('Please enter your username and password.');
      return;
    }

    if (isRegister) {
      if (password.length < 8) {
        setError('Password must contain at least 8 characters.');
        return;
      }

      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
    }

    setLoading(true);

    try {
      const endpoint = isRegister ? '/api/register' : '/api/login';

      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: cleanUsername,
          password,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.message ||
            (isRegister
              ? 'Unable to create your account.'
              : 'Unable to sign in. Check your credentials.')
        );
      }

      if (isRegister) {
        // If registration returns a token, sign in immediately.
        if (data.token) {
          onLogin(data.token);
          return;
        }

        // Otherwise, ask the user to sign in with the new account.
        setPassword('');
        setConfirmPassword('');
        setMode('login');
        setSuccess('Account created successfully. Please sign in.');
        return;
      }

      if (!data.token) {
        throw new Error('The server did not return an authentication token.');
      }

      onLogin(data.token);
    } catch (err) {
      setError(
        err.message ||
          'Could not connect to the server. Check that your backend is running.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login-layout">
      <section className="login-promo">
        <div className="promo-icon">
          <Wallet size={28} />
        </div>

        <p className="eyebrow">A CLEARER VIEW OF YOUR MONEY</p>

        <h1>
          Build better habits.
          <br />
          <span>One rupee at a time.</span>
        </h1>

        <p className="promo-copy">
          Understand your spending, keep track of your income, and make more
          confident financial decisions.
        </p>

        <div className="promo-points">
          <span><i /> Income and expense tracking</span>
          <span><i /> Spending insights by category</span>
          <span><i /> Your data, behind secure login</span>
        </div>

        <div className="promo-orbit orbit-one" />
        <div className="promo-orbit orbit-two" />
      </section>

      <section className="login-panel">
        <div className="login-card">
          <div className="login-card-icon">
            {isRegister ? <UserPlus size={22} /> : <LockKeyhole size={22} />}
          </div>

          <p className="eyebrow">
            {isRegister ? 'GET STARTED' : 'WELCOME BACK'}
          </p>

          <h2>{isRegister ? 'Create your account' : 'Sign in to FinTrack'}</h2>

          <p className="login-subtitle">
            {isRegister
              ? 'Create an account to start managing your finances.'
              : 'Enter your account details to open your dashboard.'}
          </p>

          <div className="auth-tabs" role="tablist" aria-label="Account access">
            <button
              type="button"
              role="tab"
              aria-selected={!isRegister}
              className={`auth-tab ${!isRegister ? 'active' : ''}`}
              onClick={() => switchMode('login')}
              disabled={loading}
            >
              Sign in
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={isRegister}
              className={`auth-tab ${isRegister ? 'active' : ''}`}
              onClick={() => switchMode('register')}
              disabled={loading}
            >
              Create account
            </button>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            <label htmlFor="username">Username</label>

            <div className="input-with-icon">
              <UserRound size={18} />
              <input
                id="username"
                name="username"
                autoComplete="username"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="Your username"
                required
                disabled={loading}
              />
            </div>

            <label htmlFor="password">Password</label>

            <div className="input-with-icon">
              <LockKeyhole size={18} />
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete={isRegister ? 'new-password' : 'current-password'}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder={isRegister ? 'Create a password (8+ characters)' : 'Your password'}
                minLength={isRegister ? 8 : undefined}
                required
                disabled={loading}
              />

              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword((visible) => !visible)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {isRegister && (
              <>
                <label htmlFor="confirmPassword">Confirm password</label>

                <div className="input-with-icon">
                  <LockKeyhole size={18} />
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    placeholder="Re-enter your password"
                    minLength={8}
                    required
                    disabled={loading}
                  />
                </div>
              </>
            )}

            {error && (
              <div className="form-error" role="alert">
                {error}
              </div>
            )}

            {success && (
              <div className="form-success" role="status">
                {success}
              </div>
            )}

            <button
              className="primary-button login-submit"
              type="submit"
              disabled={loading}
            >
              {loading
                ? isRegister
                  ? 'Creating account…'
                  : 'Signing in…'
                : isRegister
                  ? 'Create account'
                  : 'Sign in'}
              {!loading && <ArrowRight size={18} />}
            </button>
          </form>

          <p className="login-footnote">
            Your financial data is available after you sign in.
          </p>
        </div>
      </section>
    </main>
  );
}
