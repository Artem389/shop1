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

export const updateOrder = async (order_id, address, payment_type) => {
  const res = await fetch(`${API_URL}/orders/${order_id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ address, payment_type }),
  });
  if (!res.ok) throw new Error('Error updating order');
  return res.json();
};

export const createPayment = async (orders_id, amount) => {
  const res = await fetch(`${API_URL}/payments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orders_id, amount }),
  });
  if (!res.ok) throw new Error('Error creating payment');
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

export const updateCartQuantity = async (cart_id, quantity) => {
  const res = await fetch(`${API_URL}/cart/${cart_id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ quantity }),
  });
  if (!res.ok) throw new Error('Error updating cart quantity');
  return res.json();
};

export const addToCart = async (orders_id, product_id, quantity) => {
  const res = await fetch(`${API_URL}/cart`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orders_id, products_id: product_id, quantity }),
  });
  if (!res.ok) throw new Error('Error adding to cart');
  return res.json();
};

export const getUserDiscount = async (user_id) => {
  const res = await fetch(`${API_URL}/discounts/user/${user_id}`);
  if (!res.ok) throw new Error('Error fetching user discount');
  return res.json();
};