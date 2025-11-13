const API_URL = 'http://localhost:3001/api';

export const addToCart = async (user_id, product_id, quantity = 1) => {
  const res = await fetch(`${API_URL}/cart`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id, product_id, quantity }),
  });
  if (!res.ok) throw new Error('Error adding to cart');
  return res.json();
};

export const getCart = async (user_id) => {
  const res = await fetch(`${API_URL}/cart/${user_id}`);
  if (!res.ok) throw new Error('Error fetching cart');
  return res.json();
};

export const deleteFromCart = async (user_id, product_id) => {
  const res = await fetch(`${API_URL}/cart/${user_id}/${product_id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Error deleting from cart');
  return res.json();
};