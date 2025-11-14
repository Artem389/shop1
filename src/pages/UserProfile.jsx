import { useEffect, useState } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getOrders } from '../api/orders';

export default function UserProfile() {
  const { user, logout } = useAuth();
  const { loadCart, items, error, loading } = useCart();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    if (!user || user.role !== 'user') navigate('/');
    loadCart();
    async function fetchOrders() {
      try {
        const data = await getOrders(user.id);
        setOrders(data.filter(o => o.payment_date)); // Только completed
      } catch (err) {
        console.error(err);
      }
    }
    fetchOrders();
  }, [user]);

  // Группировка по order_id
  const groupedOrders = orders.reduce((acc, item) => {
    if (!acc[item.id_orders]) {
      acc[item.id_orders] = {
        id: item.id_orders,
        address: item.address,
        payment_type: item.payment_type,
        payment_date: item.payment_date,
        items: []
      };
    }
    const disc = item.discount_value || 0;
    acc[item.id_orders].items.push({
      product_name: item.product_name,
      quantity: item.quantity,
      price: item.price * (1 - disc / 100)
    });
    return acc;
  }, {});

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const yyyy = date.getFullYear();
    const hh = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    return `${dd}.${mm}.${yyyy} ${hh}:${min}`;
  };

  const paymentTypeMap = {
    cash: 'Наличными',
    card: 'Картой'
  };

  return (
    <div className="user-profile">
      <h1>Личный кабинет</h1>
      <button onClick={logout}>Выход</button>
      <h2>Ваша корзина</h2>
      {loading && <p>Загрузка...</p>}
      {error && <p>Ошибка: {error}</p>}
      {items.map(item => (
        <div key={item.cart_id}>
          <h3>{item.product_name}</h3>
          {/* ... аналогично Cart.jsx */}
        </div>
      ))}
      <h2>Ваши заказы</h2>
      {Object.values(groupedOrders).map(order => (
        <div key={order.id}>
          <h3>Заказ #{order.id}</h3>
          <p>Адрес: {order.address}</p>
          <p>Тип оплаты: {paymentTypeMap[order.payment_type] || order.payment_type}</p>
          <p>Дата оформления: {formatDate(order.payment_date)}</p>
          <ul>
            {order.items.map((it, idx) => (
              <li key={idx}>{it.product_name} x {it.quantity} - {it.price * it.quantity} руб.</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}