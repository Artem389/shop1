const API_URL = 'http://localhost:3001/api';

export const getProducts = async () => {
  try {
    const res = await fetch(`${API_URL}/products`);
    if (!res.ok) throw new Error('Error fetching products');
    return res.json();
  } catch (err) {
    throw new Error(err.message === 'Failed to fetch' ? 'Сервер недоступен. Проверьте, запущен ли backend.' : err.message);
  }
};

export const createProduct = async (data) => {
  try {
    const res = await fetch(`${API_URL}/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Error creating product');
    return res.json();
  } catch (err) {
    throw new Error(err.message === 'Failed to fetch' ? 'Сервер недоступен. Проверьте, запущен ли backend.' : err.message);
  }
};

export const updateProduct = async (id, data) => {
  try {
    const res = await fetch(`${API_URL}/products/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Error updating product');
    return res.json();
  } catch (err) {
    throw new Error(err.message === 'Failed to fetch' ? 'Сервер недоступен. Проверьте, запущен ли backend.' : err.message);
  }
};

export const deleteProduct = async (id) => {
  try {
    const res = await fetch(`${API_URL}/products/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Error deleting product');
  } catch (err) {
    throw new Error(err.message === 'Failed to fetch' ? 'Сервер недоступен. Проверьте, запущен ли backend.' : err.message);
  }
};