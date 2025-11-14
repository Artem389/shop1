const API_URL = 'http://localhost:3001/api';

export const getProducts = async () => {
  try {
    const res = await fetch(`${API_URL}/products`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Ошибка загрузки товаров');
    }
    return await res.json();
  } catch (err) {
    if (err.name === 'TypeError' || err.message.includes('fetch')) {
      throw new Error('Сервер недоступен. Проверьте, запущен ли backend на порту 3001');
    }
    throw err;
  }
};

export const createProduct = async (data) => {
  try {
    const res = await fetch(`${API_URL}/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Ошибка создания товара');
    }
    return await res.json();
  } catch (err) {
    if (err.name === 'TypeError') throw new Error('Сервер недоступен');
    throw err;
  }
};

export const updateProduct = async (id, data) => {
  try {
    const res = await fetch(`${API_URL}/products/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Ошибка обновления товара');
    }
    return await res.json();
  } catch (err) {
    if (err.name === 'TypeError') throw new Error('Сервер недоступен');
    throw err;
  }
};

export const deleteProduct = async (id) => {
  try {
    const res = await fetch(`${API_URL}/products/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Ошибка удаления товара');
    }
  } catch (err) {
    if (err.name === 'TypeError') throw new Error('Сервер недоступен');
    throw err;
  }
};