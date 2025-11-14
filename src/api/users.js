const API_URL = 'http://localhost:3001/api';

export const getUsers = async () => {
  const res = await fetch(`${API_URL}/users`);
  if (!res.ok) throw new Error('Error fetching users');
  return res.json();
};