import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';
import Home from './pages/Home';
import Cart from './pages/Cart';
import Login from './pages/Login';
import AdminPanel from './pages/AdminPanel';
import UserProfile from './pages/UserProfile';
import { useContext } from 'react';
import { ThemeContext } from './context/ThemeContext';

function App() {
  const { theme, toggleTheme } = useContext(ThemeContext);

  return (
    <div className={`app ${theme}`}>
      <header>
        <Link to="/">Главная</Link>
        <Link to="/cart">Корзина</Link>
        <Link to="/login">Личный кабинет</Link>
        <button onClick={toggleTheme}>Сменить тему</button>
      </header>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/login" element={<Login />} />
        <Route path="/admin" element={<AdminPanel />} />
        <Route path="/profile" element={<UserProfile />} />
      </Routes>
    </div>
  );
}

export default () => (
  <Router>
    <AuthProvider>
      <ThemeProvider>
        <CartProvider>
          <App />
        </CartProvider>
      </ThemeProvider>
    </AuthProvider>
  </Router>
);