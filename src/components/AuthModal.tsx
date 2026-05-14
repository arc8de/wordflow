import { useState } from 'react';
import { GoogleLogin, GoogleOAuthProvider } from '@react-oauth/google';
import { authStorage, decodeJwt, GoogleUser } from '../auth';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [error, setError] = useState('');

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
        console.log('Signed in as:', googleUser.email);
        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to sign in with Google');
      console.error('Auth error:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="modal show d-block"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
      role="dialog"
    >
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header border-0">
            <h5 className="modal-title">Welcome to WordFlow</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body text-center py-4">
            <p className="text-muted mb-4">Sign in to get started with your writing</p>

            {error && (
              <div className="alert alert-danger alert-dismissible fade show" role="alert">
                <strong>Error:</strong> {error}
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setError('')}
                ></button>
              </div>
            )}

            <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || ''}>
              <div className="d-flex justify-content-center">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => setError('Failed to sign in with Google')}
                  size="large"
                  text="signin"
                />
              </div>
            </GoogleOAuthProvider>
          </div>
          <div className="modal-footer border-0">
            <small className="text-muted w-100 text-center">
              By continuing, you agree to our Terms of Service
            </small>
          </div>
        </div>
      </div>
    </div>
  );
}

