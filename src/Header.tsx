import { User } from './auth';

interface HeaderProps {
  currentUser: User | null;
  onLogout: () => void;
}

export default function Header({ currentUser, onLogout }: HeaderProps) {
  return (
    <header className="navbar navbar-expand-lg px-3 py-2 bg-white border-bottom sticky-top shadow-sm">
      <div className="container-fluid">
        <div className="d-flex align-items-center flex-grow-1">
          <div className="bg-primary text-white fw-bold rounded-1 d-flex align-items-center justify-content-center me-3" style={{ width: '32px', height: '32px' }}>W</div>
          <h1 className="navbar-brand mb-0 h6 fw-bold text-dark fs-6">
            WordFlow — <span className="fw-normal text-muted">Smart Word Processor</span>
          </h1>
        </div>
        
        {/* Auth Section - Always shows logout since this header only appears on /app route */}
        <div className="d-flex align-items-center gap-2">
          <div className="text-end" style={{ fontSize: '0.9rem' }}>
            <div className="fw-500">Welcome, <strong>{currentUser?.name}</strong></div>
            <small className="text-muted">{currentUser?.email}</small>
          </div>
          <button 
            className="btn btn-outline-danger btn-sm ms-2"
            onClick={onLogout}
            title="Logout from your account"
          >
            <i className="fas fa-sign-out-alt me-1"></i>Logout
          </button>
        </div>
      </div>
    </header>
  );
}
