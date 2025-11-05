import { useTheme } from '../context/ThemeContext';

function ThemeToggle() {
  const { isDark, toggleTheme } = useTheme();

  const buttonStyle = {
    padding: '0.5rem 1rem',
    border: `1px solid ${isDark ? '#777' : '#ccc'}`,
    borderRadius: '20px',
    backgroundColor: isDark ? '#555' : '#fff',
    color: isDark ? '#fff' : '#000',
    cursor: 'pointer',
    fontSize: '0.9rem',
    transition: 'all 0.3s ease'
  };

  return (
    <button onClick={toggleTheme} style={buttonStyle}>
      {isDark ? '☀️' : '🌙'}
    </button>
  );
}

export default ThemeToggle;