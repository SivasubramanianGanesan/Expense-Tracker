import React, { useState } from 'react';
import { Button } from '@mui/material';
import { TextField } from '@mui/material';
import { Alert, AlertTitle } from '@mui/material'; // Corrected import
import AlertIcon from '@mui/icons-material/ErrorOutline';
import { CircularProgress } from '@mui/material';

const LoginForm = ({ onLogin, onRegister }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        if (!username || !password) {
            setError('Please enter both username and password.');
            setIsLoading(false);
            return;
        }

        try {
            const response = await fetch('http://localhost:5000/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                setError(errorData.message || 'Login failed. Invalid credentials.');
                setIsLoading(false);
                return;
            }

            const data = await response.json();
            const token = data.token;
            if (token) {
                onLogin(token);
                setIsLoading(false);
            } else {
                setError('Login failed: Token not received.');
                setIsLoading(false);
            }

        } catch (err) {
            setError(err.message || 'An error occurred during login.');
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center p-4">
            <h2 className="text-2xl font-semibold mb-6 text-center">Login to Expense Tracker</h2>
            <form onSubmit={handleSubmit} className="w-full max-w-md space-y-6">
                <div>
                    <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                        Username
                    </label>
                    <TextField
                        type="text"
                        id="username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Enter your username"
                        className="w-full mt-1"
                        disabled={isLoading}
                        variant="outlined"
                    />
                </div>
                <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                        Password
                    </label>
                    <TextField
                        type="password"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password"
                        className="w-full mt-1"
                        disabled={isLoading}
                        variant="outlined"
                    />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                        <>
                            <CircularProgress size={20} className="mr-2" />
                            Loading...
                        </>
                    ) : (
                        'Login'
                    )}
                </Button>
                {onRegister && (
                    <div className="text-center text-sm text-gray-500">
                        <button
                            type="button"
                            onClick={onRegister}
                            className="text-blue-500 hover:underline"
                            disabled={isLoading}
                        >
                            Don't have an account? Register
                        </button>
                    </div>
                )}
            </form>
            {error && (
                <Alert severity="error" className="mt-6 w-full max-w-md">
                    <AlertIcon />
                    <AlertTitle>Error</AlertTitle>
                    {error} 
                </Alert>
            )}
        </div>
    );
};

export default LoginForm;
