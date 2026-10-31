// src/hooks/useAuth.ts
import { useState, useEffect } from 'react';

export const useAuth = () => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
  const [user, setUser] = useState<any>(() => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  });

  useEffect(() => {
    const handleStorage = () => {
      setToken(localStorage.getItem('token'));
      const userStr = localStorage.getItem('user');
      setUser(userStr ? JSON.parse(userStr) : null);
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('nstp_token');
    localStorage.removeItem('user');
    localStorage.removeItem('nstp_user');
    setToken(null);
    setUser(null);
    window.location.href = '/login'; 
  };

  const isAuthenticated = !!token;
  const isSuperAdmin = user?.role === 'super_admin';
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
  const isFaculty = user?.role === 'faculty';
  const isStudent = user?.role === 'student';

  return {
    token,
    user,
    logout,
    isAuthenticated,
    isSuperAdmin,
    isAdmin,
    isFaculty,
    isStudent,
  };
};