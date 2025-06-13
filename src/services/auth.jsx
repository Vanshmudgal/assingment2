// src/services/auth.js
const users = [
  {
    id: 1,
    username: 'developer',
    password: 'dev123',
    role: 'developer',
    name: 'John Developer'
  },
  {
    id: 2,
    username: 'manager',
    password: 'manager123',
    role: 'manager',
    name: 'Jane Manager'
  }
];

export const authenticate = (username, password) => {
  const user = users.find(
    u => u.username === username && u.password === password
  );
  
  if (user) {
    localStorage.setItem('user', JSON.stringify(user));
    return user;
  }
  
  return null;
};

export const logout = () => {
  localStorage.removeItem('user');
};

export const getCurrentUser = () => {
  return JSON.parse(localStorage.getItem('user'));
};