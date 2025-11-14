import { useEffect, useState } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getOrders } from '../api/orders';
import { useTheme } from '../context/ThemeContext'; // Тема

export default function UserProfile() {
  const { user, logout, personalDiscount } = useAuth();
  const { loadCart, items, error: cartError, loading: cartLoading } = useCart();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [errorOrders, setErrorOrders] = useState(null);
  const { isDark } = useTheme(); // Тема

  useEffect(() => {
    if (!user || user.role !== 'user') navigate('/');
    loadCart();
    async function fetchOrders() {
      try {
        const data = await getOrders(user.id);
        setOrders(data.filter(o => o.payment_date)); // Только completed
      } catch (err) {
        setErrorOrders(err.message);
      } finally {
        setLoadingOrders(false);
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
    const productDisc = Number(item.discount_value || 0); // Преобразование
    const totalDisc = productDisc + personalDiscount;
    const discountedPrice = Math.floor(Math.max(0, item.price * (1 - totalDisc / 100))); // Округление
    acc[item.id_orders].items.push({
      product_name: item.product_name,
      quantity: item.quantity,
      price: discountedPrice
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
      <div className="header-row">
        <h1>Личный кабинет</h1>
        <button onClick={logout}>Выход</button>
      </div>
      <h2>Ваша корзина</h2>
      {cartLoading && <div className="loading">Загрузка...</div>}
      {cartError && <div className="error">Ошибка: {cartError}</div>}
      {items.map(item => (
        <div key={item.cart_id}>
          <h3>{item.product_name}</h3>
          {/* ... аналогично Cart.jsx */}
        </div>
      ))}
      <h2>Ваши заказы</h2>
      {loadingOrders && <div className="loading">Загрузка...</div>}
      {errorOrders && <div className="error">Ошибка: {errorOrders}</div>}
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