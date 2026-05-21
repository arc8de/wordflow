import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { getCurrentUser, logout } from './auth';
import Login from './Login';
import App from './App';

interface User {
  id: string;
  username: string;
  email: string;
  name: string;
}

export default function AppRouter() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    const user = getCurrentUser();
    if (user) {
      setCurrentUser(user);
      setIsLoggedIn(true);
    }
    setIsLoading(false);
  }, []);

  const handleLoginSuccess = () => {
    const user = getCurrentUser();
    if (user) {
      setCurrentUser(user);
      setIsLoggedIn(true);
    }
  };

  const handleLogout = () => {
    logout();
    setCurrentUser(null);
    setIsLoggedIn(false);
  };

  if (isLoading) {
    return <div className="d-flex align-items-center justify-content-center" style={{ height: '100vh' }}>Loading...</div>;
  }

  return (
    <Router>
      <Routes>
        {/* Login Route */}
        <Route 
          path="/login" 
          element={
            isLoggedIn ? (
              <Navigate to="/app" replace />
            ) : (
              <Login onLoginSuccess={handleLoginSuccess} />
            )
          } 
        />

        {/* Main App Route */}
        <Route 
          path="/app" 
          element={
            isLoggedIn ? (
            <App currentUser={currentUser} onLogout={handleLogout} />
            ) : (
              <Navigate to="/login" replace />
            )
          } 
        />

        {/* Root - Redirect based on login status */}
        <Route 
          path="/" 
          element={
            isLoggedIn ? (
              <Navigate to="/app" replace />
            ) : (
              <Navigate to="/login" replace />
            )
          } 
        />

        {/* 404 - Catch all */}
        <Route path="*" element={<Navigate to={isLoggedIn ? "/app" : "/login"} replace />} />
      </Routes>
    </Router>
  );
}
