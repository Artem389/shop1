import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

function Login() {
  const navigate = useNavigate();
  const { isDark } = useTheme();

  const handleLogin = () => {
    // В реальном приложении здесь была бы проверка логина/пароля
    // После успешной аутентификации редирект на дашборд
    navigate('/dashboard');
  };

  const loginStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '60vh',
    padding: '2rem',
    backgroundColor: isDark ? '#333' : '#fff',
    color: isDark ? '#fff' : '#000'
  };

  const buttonStyle = {
    padding: '1rem 2rem',
    fontSize: '1.2rem',
    backgroundColor: isDark ? '#007bff' : '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    marginTop: '2rem'
  };

  return (
    <div style={loginStyle}>
      <h1>Вход в личный кабинет</h1>
      <p>Для доступа к личному кабинету необходимо авторизоваться</p>
      <button onClick={handleLogin} style={buttonStyle}>
        Войти
      </button>
    </div>
  );
}

export default Login;