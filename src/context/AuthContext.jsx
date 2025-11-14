import { createContext, useState, useEffect, useContext } from 'react';
import { login, register } from '../api/auth';
import { getUserDiscount } from '../api/orders';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [personalDiscount, setPersonalDiscount] = useState(0);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      fetchPersonalDiscount(parsedUser.id);
    }
    setLoading(false);
  }, []);

  const fetchPersonalDiscount = async (userId) => {
    try {
      const data = await getUserDiscount(userId);
      setPersonalDiscount(data.personal_sum || 0);
    } catch (err) {
      console.error('Error fetching personal discount:', err);
    }
  };

  const signIn = async (email, password) => {
    try {
      const data = await login(email, password);
      setUser(data.user);
      localStorage.setItem('user', JSON.stringify(data.user));
      await fetchPersonalDiscount(data.user.id);
      if (data.user.role === 'admin') navigate('/admin');
      else navigate('/profile');
    } catch (err) {
      throw err;
    }
  };

  const signUp = async (phone, password, email) => {
    try {
      const data = await register(phone, password, email);
      const newUser = { id: data.id_users, role: 'user' };
      setUser(newUser);
      localStorage.setItem('user', JSON.stringify(newUser));
      await fetchPersonalDiscount(newUser.id);
      navigate('/profile');
    } catch (err) {
      throw err;
    }
  };

  const logout = () => {
    setUser(null);
    setPersonalDiscount(0);
    localStorage.removeItem('user');
    navigate('/');
  };

  return (
    <AuthContext.Provider value={{ user, personalDiscount, signIn, signUp, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);