import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '@resqgrid/types';
import { api } from '../lib/api';

interface AuthContextType {
  currentUser: User | null;
  currentRole: UserRole;
  allUsers: User[];
  setCurrentRole: (role: UserRole) => void;
  switchUser: (user: User) => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentRole, setCurrentRoleState] = useState<UserRole>(UserRole.OPERATOR);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadUsers() {
      try {
        const res = await api.getUsers();
        if (res.success && res.data.length > 0) {
          setAllUsers(res.data);
          // Default to Operator (Commander Sarah Jenkins)
          const defaultOp = res.data.find((u: User) => u.role === UserRole.OPERATOR) || res.data[0];
          setCurrentUser(defaultOp);
          setCurrentRoleState(defaultOp.role);
        }
      } catch (err) {
        console.warn('Could not fetch users, using fallback profile:', err);
        const fallback: User = {
          id: 'op-01',
          name: 'Commander Sarah Jenkins',
          email: 'operator@resqgrid.io',
          role: UserRole.OPERATOR,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setCurrentUser(fallback);
      } finally {
        setIsLoading(false);
      }
    }
    loadUsers();
  }, []);

  const setCurrentRole = (role: UserRole) => {
    setCurrentRoleState(role);
    const matching = allUsers.find((u) => u.role === role);
    if (matching) {
      setCurrentUser(matching);
    }
  };

  const switchUser = (user: User) => {
    setCurrentUser(user);
    setCurrentRoleState(user.role);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        currentRole,
        allUsers,
        setCurrentRole,
        switchUser,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
