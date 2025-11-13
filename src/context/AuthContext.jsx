import { createContext, useState, useEffect, useContext } from 'react';
import { login, register } from '../api/auth';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Проверка localStorage или куки, но для простоты - пусто
    setLoading(false);
  }, []);

  const signIn = async (email, password) => {
    try {
      const data = await login(email, password);
      setUser(data.user);
      if (data.user.role === 'admin') navigate('/admin');
      else navigate('/profile');
    } catch (err) {
      throw err;
    }
  };

  const signUp = async (phone, password, email) => {
    try {
      const data = await register(phone, password, email);
      setUser({ id: data.id_users, role: 'user' });
      navigate('/profile');
    } catch (err) {
      throw err;
    }
  };

  const logout = () => {
    setUser(null);
    navigate('/');
  };

  return (
    <AuthContext.Provider value={{ user, signIn, signUp, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);