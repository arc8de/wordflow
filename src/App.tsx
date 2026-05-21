/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import Header from './Header';

interface User {
  id: string;
  username: string;
  email: string;
  name: string;
}

interface AppProps {
  currentUser: User | null;
  onLogout: () => void;
}

export default function App({ currentUser, onLogout }: AppProps) {
  return (
    <div>
      <Header currentUser={currentUser} onLogout={onLogout} />

      {/* Main Content */}
      <div className="container-fluid mt-4">
        <div className="row">
          <div className="col-md-12">
            <div className="alert alert-info" role="alert">
              <strong>Welcome!</strong> You are logged in as <code>{currentUser?.username}</code>. This is your WordFlow workspace.
            </div>
            <div className="card">
              <div className="card-body">
                <h5 className="card-title">Main Editor</h5>
                <p className="card-text text-muted">The document editor will be displayed here.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
