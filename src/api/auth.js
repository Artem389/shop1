const API_URL = 'http://localhost:3001/api';

export const login = async (email, password) => {
  try {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) throw new Error('Invalid credentials');
    return res.json();
  } catch (err) {
    throw new Error(err.message === 'Failed to fetch' ? 'Сервер недоступен. Проверьте, запущен ли backend.' : err.message);
  }
};

export const register = async (phone, password, email) => {
  try {
    const res = await fetch(`${API_URL}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, password, email }),
    });
    if (!res.ok) throw new Error('Error registering');
    return res.json();
  } catch (err) {
    throw new Error(err.message === 'Failed to fetch' ? 'Сервер недоступен. Проверьте, запущен ли backend.' : err.message);
  }
};