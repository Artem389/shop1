import { NavLink, useNavigate, Outlet } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import ThemeToggle from './ThemeToggle';

function Layout() {
  const navigate = useNavigate();
  const { isDark } = useTheme();

  const handleProfileClick = () => {
    // Редирект на страницу входа при клике на "Личный кабинет"
    navigate('/login');
  };

  const styles = {
    backgroundColor: isDark ? '#333' : '#fff',
    color: isDark ? '#fff' : '#000',
    minHeight: '100vh'
  };

  const navStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1rem 2rem',
    borderBottom: `1px solid ${isDark ? '#555' : '#ccc'}`,
    backgroundColor: isDark ? '#444' : '#f8f9fa'
  };

  const linksStyle = {
    display: 'flex',
    gap: '2rem'
  };

  const rightSectionStyle = {
    display: 'flex',
    gap: '1rem',
    alignItems: 'center'
  };

  const profileButtonStyle = {
    padding: '0.5rem 1rem',
    border: `1px solid ${isDark ? '#777' : '#ccc'}`,
    borderRadius: '4px',
    backgroundColor: 'transparent',
    color: 'inherit',
    cursor: 'pointer',
    fontSize: '0.9rem'
  };

  return (
    <div style={styles}>
      <nav style={navStyle}>
        <div style={linksStyle}>
          <NavLink 
            to="/" 
            style={({ isActive }) => ({
              fontWeight: isActive ? 'bold' : 'normal',
              color: isActive ? '#007bff' : 'inherit'
            })}
          >
            Главная
          </NavLink>
          <NavLink 
            to="/cart" 
            style={({ isActive }) => ({
              fontWeight: isActive ? 'bold' : 'normal',
              color: isActive ? '#007bff' : 'inherit'
            })}
          >
            Корзина
          </NavLink>
        </div>
        <div style={rightSectionStyle}>
          <button onClick={handleProfileClick} style={profileButtonStyle}>
            Личный кабинет
          </button>
          <ThemeToggle />
        </div>
      </nav>
      <Outlet />
    </div>
  );
}

export default Layout;