/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import Header from './Header';
import Editor from './Editor';

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
      <Editor />
    </div>
  );
}
