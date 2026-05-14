import { useState, useEffect } from 'react';
import { GoogleLogin, GoogleOAuthProvider } from '@react-oauth/google';
import { authStorage, decodeJwt, GoogleUser } from '../auth';

export default function AuthUI() {
  const [user, setUser] = useState<GoogleUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    const storedUser = authStorage.getUser();
    setUser(storedUser);
    setLoading(false);
  }, []);

  const handleGoogleSuccess = (credentialResponse: any) => {
    try {
      const decoded = decodeJwt(credentialResponse.credential);
      if (decoded) {
        const googleUser: GoogleUser = {
          id: decoded.sub,
          email: decoded.email,
          name: decoded.name,
          picture: decoded.picture,
        };
        authStorage.setUser(googleUser);
        authStorage.setToken(credentialResponse.credential);
        setUser(googleUser);
        console.log('Signed in as:', googleUser.email);
      }
    } catch (error) {
      console.error('Failed to process Google sign-in:', error);
    }
  };

  const handleSignOut = () => {
    authStorage.clear();
    setUser(null);
    console.log('Signed out successfully');
  };

  if (loading) {
    return (
      <div className="d-flex align-items-center justify-content-center p-3">
        <div className="spinner-border spinner-border-sm text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="d-flex align-items-center gap-2">
      {user ? (
        <>
          <div className="d-flex align-items-center gap-2">
            {user.picture && (
              <img
                src={user.picture}
                alt={user.name}
                className="rounded-circle"
                style={{ width: '32px', height: '32px' }}
              />
            )}
            <div>
              <div className="small fw-500">{user.name || user.email}</div>
              <button className="btn btn-sm btn-outline-secondary" onClick={handleSignOut}>
                Sign Out
              </button>
            </div>
          </div>
        </>
      ) : (
        <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || ''}>
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => console.log('Sign-in failed')}
            size="large"
            text="signin"
          />
        </GoogleOAuthProvider>
      )}
    </div>
  );
}

