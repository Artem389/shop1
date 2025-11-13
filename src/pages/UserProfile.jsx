import { useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function UserProfile() {
  const { user, logout } = useAuth();
  const { loadCart, items, error, loading } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || user.role !== 'user') navigate('/');
    loadCart();
  }, [user]);

  return (
    <div className="user-profile">
      <h1>Личный кабинет</h1>
      <button onClick={logout}>Выход</button>
      <h2>Ваша корзина</h2>
      {loading && <p>Загрузка...</p>}
      {error && <p>Ошибка: {error}</p>}
      {items.map(item => (
        <div key={item.id}>
          <h3>{item.product_name}</h3>
          {/* ... аналогично Cart.jsx */}
        </div>
      ))}
    </div>
  );
}