import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Tutor, StudentProfile } from '../types';
import { api } from '../services/api';

export function getDashboardRoute(role?: string): string {
  switch (role) {
    case 'STUDENT':
      return '/student/dashboard';
    case 'TUTOR':
      return '/tutor/dashboard';
    case 'ADMIN':
      return '/admin/dashboard';
    default:
      return '/login';
  }
}

interface AuthContextType {
  user: User | null;
  tutorProfile?: Tutor;
  studentProfile?: StudentProfile;
  loading: boolean;
  login: (email: string, pass: string) => Promise<{ user: User; role: string }>;
  register: (payload: any) => Promise<{ user: User; role: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  getDashboardRoute: (role?: string) => string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [tutorProfile, setTutorProfile] = useState<Tutor | undefined>();
  const [studentProfile, setStudentProfile] = useState<StudentProfile | undefined>();
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    const token = localStorage.getItem('tutornest_token');
    if (!token) {
      setUser(null);
      setTutorProfile(undefined);
      setStudentProfile(undefined);
      setLoading(false);
      return;
    }

    try {
      const data = await api.getMe();
      setUser(data.user);
      setTutorProfile(data.tutorProfile);
      setStudentProfile(data.studentProfile);
    } catch (err) {
      console.warn('[AuthContext] Stored session invalid or expired. Clearing token.');
      localStorage.removeItem('tutornest_token');
      setUser(null);
      setTutorProfile(undefined);
      setStudentProfile(undefined);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (email: string, pass: string): Promise<{ user: User; role: string }> => {
    setLoading(true);
    try {
      const res = await api.login(email, pass);
      setUser(res.user);
      try {
        const me = await api.getMe();
        setTutorProfile(me.tutorProfile);
        setStudentProfile(me.studentProfile);
      } catch {
        // ignore secondary profile error
      }
      return { user: res.user, role: res.user.role };
    } finally {
      setLoading(false);
    }
  };

  const register = async (payload: any): Promise<{ user: User; role: string }> => {
    setLoading(true);
    try {
      const res = await api.register(payload);
      setUser(res.user);
      try {
        const me = await api.getMe();
        setTutorProfile(me.tutorProfile);
        setStudentProfile(me.studentProfile);
      } catch {
        // ignore secondary profile error
      }
      return { user: res.user, role: res.user.role };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch {
      // ignore
    } finally {
      localStorage.removeItem('tutornest_token');
      setUser(null);
      setTutorProfile(undefined);
      setStudentProfile(undefined);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        tutorProfile,
        studentProfile,
        loading,
        login,
        register,
        logout,
        refreshUser,
        getDashboardRoute,
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
