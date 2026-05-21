import { useState } from 'react';
import { validateLogin, setCurrentUser, DUMMY_USERS } from './auth';
import './Login.css';

interface LoginProps {
  onLoginSuccess: () => void;
}

export default function Login({ onLoginSuccess: onLoginSuccess }: LoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Simulate network delay
    setTimeout(() => {
      const user = validateLogin(username, password);
      
      if (user) {
        setCurrentUser(user);
        onLoginSuccess();
      } else {
        setError('Invalid username or password');
      }
      setIsLoading(false);
    }, 300);
  };

  const handleQuickLogin = (usr: string, pwd: string) => {
    setUsername(usr);
    setPassword(pwd);
    setError('');
    setIsLoading(true);

    setTimeout(() => {
      const user = validateLogin(usr, pwd);
      
      if (user) {
        setCurrentUser(user);
        onLoginSuccess();
      } else {
        setError('Invalid credentials');
      }
      setIsLoading(false);
    }, 300);
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-header">
          <div className="login-logo">W</div>
          <h1>WordFlow</h1>
          <p className="text-muted">Smart Word Processor</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="mb-3">
            <label htmlFor="username" className="form-label">Username</label>
            <input
              type="text"
              className="form-control"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              disabled={isLoading}
              required
            />
          </div>

          <div className="mb-3">
            <label htmlFor="password" className="form-label">Password</label>
            <input
              type="password"
              className="form-control"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              disabled={isLoading}
              required
            />
          </div>

          {error && (
            <div className="alert alert-danger alert-sm" role="alert">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary w-100"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Logging in...
              </>
            ) : (
              'Login'
            )}
          </button>
        </form>

        <div className="login-demo-section mt-4 pt-3 border-top">
          <p className="text-muted text-center mb-3">Demo Credentials (Click to Login):</p>
          <div className="demo-credentials">
            {DUMMY_USERS.map((user) => (
              <button
                key={user.id}
                type="button"
                className="btn btn-outline-primary btn-sm demo-login-btn"
                onClick={() => handleQuickLogin(user.username, user.password)}
                disabled={isLoading}
              >
                <div className="demo-btn-content">
                  <strong>{user.name}</strong>
                  <div className="text-monospace">{user.username}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
