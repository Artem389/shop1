const API_URL = 'http://localhost:3001/api';

export const getDiscounts = async () => {
  const res = await fetch(`${API_URL}/discounts`);
  if (!res.ok) throw new Error('Error fetching discounts');
  return res.json();
};

export const createDiscount = async (data) => {
  const res = await fetch(`${API_URL}/discounts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Error creating discount');
  return res.json();
};

export const updateDiscount = async (id, data) => {
  const res = await fetch(`${API_URL}/discounts/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Error updating discount');
  return res.json();
};

export const deleteDiscount = async (id) => {
  const res = await fetch(`${API_URL}/discounts/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Error deleting discount');
};