/**
 * Dummy authentication system
 */

export interface User {
  id: string;
  username: string;
  password: string;
  email: string;
  name: string;
}

// Dummy users database
export const DUMMY_USERS: User[] = [
  {
    id: '1',
    username: 'john_doe',
    password: 'password123',
    email: 'john@example.com',
    name: 'John Doe'
  },
  {
    id: '2',
    username: 'jane_smith',
    password: 'secure456',
    email: 'jane@example.com',
    name: 'Jane Smith'
  },
  {
    id: '3',
    username: 'bob_wilson',
    password: 'pass789',
    email: 'bob@example.com',
    name: 'Bob Wilson'
  }
];

export const validateLogin = (username: string, password: string): User | null => {
  const user = DUMMY_USERS.find(
    u => u.username === username && u.password === password
  );
  return user || null;
};

export const getCurrentUser = (): User | null => {
  const userStr = localStorage.getItem('currentUser');
  return userStr ? JSON.parse(userStr) : null;
};

export const setCurrentUser = (user: User | null): void => {
  if (user) {
    localStorage.setItem('currentUser', JSON.stringify(user));
  } else {
    localStorage.removeItem('currentUser');
  }
};

export const logout = (): void => {
  localStorage.removeItem('currentUser');
};
