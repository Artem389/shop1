import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

function Dashboard() {
  const navigate = useNavigate();
  const { isDark } = useTheme();

  const handleLogout = () => {
    // В реальном приложении здесь был бы выход из системы
    // После выхода делаем редирект на страницу входа
    navigate('/login');
  };

  const style = {
    padding: '2rem',
    backgroundColor: isDark ? '#333' : '#fff',
    color: isDark ? '#fff' : '#000',
    maxWidth: '800px',
    margin: '0 auto',
    textAlign: 'center'
  };

  const buttonStyle = {
    padding: '0.75rem 1.5rem',
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    marginTop: '2rem'
  };

  return (
    <div style={style}>
      <h1>Личный кабинет</h1>
      <p>Добро пожаловать в ваш личный кабинет!</p>
      <p>Здесь вы можете управлять своими заказами, настройками и персональными данными.</p>
      
      <button onClick={handleLogout} style={buttonStyle}>
        Выйти
      </button>
    </div>
  );
}

export default Dashboard;