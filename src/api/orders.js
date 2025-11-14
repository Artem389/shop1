const API_URL = 'http://localhost:3001/api';

export const createOrder = async (user_id, items) => {
  const res = await fetch(`${API_URL}/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id, items }),
  });
  if (!res.ok) throw new Error('Error creating order');
  return res.json();
};

export const getOrders = async (user_id) => {
  const res = await fetch(`${API_URL}/orders/${user_id}`);
  if (!res.ok) throw new Error('Error fetching orders');
  return res.json();
};

export const deleteCartItem = async (cart_id) => {
  const res = await fetch(`${API_URL}/cart/${cart_id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Error deleting cart item');
  return res.json();
};