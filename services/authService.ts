
import { User } from "../types";

const USERS_DB_KEY = 'talentecho_users_db';
const CURRENT_USER_KEY = 'talentecho_current_user';

interface UserRecord extends User {
  passwordHash: string; // Simulating auth
}

// Helper to get all users
const getUsersDB = (): UserRecord[] => {
  try {
    const stored = localStorage.getItem(USERS_DB_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

// Helper to save DB
const saveUsersDB = (users: UserRecord[]) => {
  localStorage.setItem(USERS_DB_KEY, JSON.stringify(users));
};

export const registerUser = async (name: string, email: string, password: string): Promise<User> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 800));

  const users = getUsersDB();
  if (users.find(u => u.email === email)) {
    throw new Error("User already exists with this email.");
  }

  const newUser: UserRecord = {
    id: Date.now().toString(),
    name,
    email,
    passwordHash: btoa(password) // Simple encoding for mock demo
  };

  users.push(newUser);
  saveUsersDB(users);
  
  // Auto login
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify({ id: newUser.id, name: newUser.name, email: newUser.email }));
  return { id: newUser.id, name: newUser.name, email: newUser.email };
};

export const loginUser = async (email: string, password: string): Promise<User> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 800));

  const users = getUsersDB();
  const user = users.find(u => u.email === email && u.passwordHash === btoa(password));

  if (!user) {
    throw new Error("Invalid email or password.");
  }

  const userData: User = { id: user.id, name: user.name, email: user.email };
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(userData));
  return userData;
};

export const logoutUser = () => {
  localStorage.removeItem(CURRENT_USER_KEY);
};

export const getCurrentUser = (): User | null => {
  try {
    const stored = localStorage.getItem(CURRENT_USER_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};
