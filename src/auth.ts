// Google OAuth configuration
export const googleOAuthConfig = {
  clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
  authUri: 'https://accounts.google.com/o/oauth2/auth',
  tokenUri: 'https://oauth2.googleapis.com/token',
  redirectUri: window.location.origin,
  scope: 'openid profile email',
};

export interface GoogleUser {
  id: string;
  email: string;
  name: string;
  picture?: string;
  iat?: number;
  exp?: number;
}

// Store auth state in localStorage
const AUTH_STORAGE_KEY = 'wordflow_auth';

export const authStorage = {
  setUser: (user: GoogleUser | null) => {
    if (user) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  },

  getUser: (): GoogleUser | null => {
    const stored = localStorage.getItem(AUTH_STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  },

  setToken: (token: string) => {
    localStorage.setItem(`${AUTH_STORAGE_KEY}_token`, token);
  },

  getToken: (): string | null => {
    return localStorage.getItem(`${AUTH_STORAGE_KEY}_token`);
  },

  clear: () => {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    localStorage.removeItem(`${AUTH_STORAGE_KEY}_token`);
  },
};

// Decode JWT token
export const decodeJwt = (token: string): any => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Failed to decode JWT:', error);
    return null;
  }
};

// Check if token is expired
export const isTokenExpired = (token: string): boolean => {
  const decoded = decodeJwt(token);
  if (!decoded || !decoded.exp) return true;
  return decoded.exp * 1000 < Date.now();
};
