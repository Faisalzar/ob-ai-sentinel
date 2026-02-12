import { useAuth } from '../context/AuthContext';

export const useRole = () => {
  const { role } = useAuth();
  return role;
};

export const isAdmin = (user) => !!user?.is_admin;
export const isUser = (user) => !!user && !user.is_admin;
