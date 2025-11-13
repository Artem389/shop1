const API_URL = 'http://localhost:3001/api';

export const getCategories = async () => {
  const res = await fetch(`${API_URL}/categories`);
  if (!res.ok) throw new Error('Error fetching categories');
  return res.json();
};

export const createCategory = async (data) => {
  const res = await fetch(`${API_URL}/categories`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Error creating category');
  return res.json();
};

export const updateCategory = async (id, data) => {
  const res = await fetch(`${API_URL}/categories/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Error updating category');
  return res.json();
};

export const deleteCategory = async (id) => {
  const res = await fetch(`${API_URL}/categories/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Error deleting category');
};