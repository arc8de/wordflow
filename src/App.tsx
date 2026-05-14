/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import AuthUI from './components/AuthUI';
import AuthModal from './components/AuthModal';

export default function App() {
  const [showAuthModal, setShowAuthModal] = useState(true);

  return (
    <div className="min-vh-100">
      {/* Header with Auth */}
      <header className="navbar navbar-expand-lg px-3 py-2 bg-white border-bottom shadow-sm">
        <div className="container-fluid">
          <div className="d-flex align-items-center justify-content-between w-100">
            <div className="d-flex align-items-center">
              <div
                className="bg-primary text-white fw-bold rounded-1 d-flex align-items-center justify-content-center me-3"
                style={{ width: '32px', height: '32px' }}
              >
                W
              </div>
              <h1 className="mb-0 h6 fw-bold text-dark">WordFlow</h1>
            </div>
            <AuthUI />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container py-5">
        <div className="text-center">
          <h2>Welcome to WordFlow</h2>
          <p className="text-muted">Your personal writing companion</p>
        </div>
      </div>

      {/* Auth Modal */}
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </div>
  );
}
