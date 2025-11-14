import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';
import Home from './pages/Home';
import Cart from './pages/Cart';
import Login from './pages/Login';
import AdminPanel from './pages/AdminPanel';
import UserProfile from './pages/UserProfile';
import Checkout from './pages/Checkout'; // Новый
import { useContext } from 'react';
import { ThemeContext } from './context/ThemeContext';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

function AppContent() {
  const { theme, toggleTheme } = useContext(ThemeContext);
  const { user } = useAuth();

  const cabinetPath = user ? (user.role === 'admin' ? '/admin' : '/profile') : '/login';

  return (
    <div className={`app ${theme}`}>
      <header>
        <Link to="/">Главная</Link>
        <Link to="/cart">Корзина</Link>
        <Link to={cabinetPath}>Личный кабинет</Link>
        <button onClick={toggleTheme}>Сменить тему</button>
      </header>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/cart" element={
          <ProtectedRoute>
            <Cart />
          </ProtectedRoute>
        } />
        <Route path="/checkout" element={
          <ProtectedRoute>
            <Checkout />
          </ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute requireRole="user">
            <UserProfile />
          </ProtectedRoute>
        } />
        <Route path="/admin" element={
          <ProtectedRoute requireRole="admin">
            <AdminPanel />
          </ProtectedRoute>
        } />
      </Routes>
    </div>
  );
}

export default () => (
  <Router>
    <AuthProvider>
      <ThemeProvider>
        <CartProvider>
          <AppContent />
        </CartProvider>
      </ThemeProvider>
    </AuthProvider>
  </Router>
);