import { useState } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { updateOrder, createPayment } from '../api/orders';
import { useTheme } from '../context/ThemeContext';

export default function Checkout() {
  const { items, loading, error } = useCart();
  const { user, personalDiscount } = useAuth();
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const [address, setAddress] = useState('');
  const [paymentType, setPaymentType] = useState('cash');
  const [submitError, setSubmitError] = useState(null);

  if (!user) return <div className="error">Авторизуйтесь для оформления заказа</div>;
  if (loading) {
  console.log('Загрузка данных корзины для оформления...');
  return <div className="loading">Загрузка...</div>;
}
if (error) {
  console.error('Ошибка корзины в checkout:', error);
  return <div className="error">Ошибка: {error}</div>;
}
  if (items.length === 0) return <div className="error">Корзина пуста</div>;

  const orders_id = items[0].id_orders; // Предполагаем, что все items из одного заказа

  const total = Math.floor(items.reduce((sum, item) => {
    const productDisc = Number(item.discount_value || 0);
    const totalDisc = productDisc + personalDiscount;
    const discountedPrice = Math.floor(Math.max(0, item.price * (1 - totalDisc / 100))); // Округление
    return sum + discountedPrice * item.quantity;
  }, 0));

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateOrder(orders_id, address, paymentType);
      await createPayment(orders_id, total);
      navigate('/profile');
    } catch (err) {
      setSubmitError(err.message);
    }
  };

  return (
    <div className="checkout">
      <h1>Оформление заказа</h1>
      <form onSubmit={handleSubmit}>
        <input 
          type="text" 
          value={address} 
          onChange={(e) => setAddress(e.target.value)} 
          placeholder="Адрес доставки" 
          required 
        />
        <select value={paymentType} onChange={(e) => setPaymentType(e.target.value)}>
          <option value="cash">Наличными</option>
          <option value="card">Картой</option>
        </select>
        <p>Итого к оплате: {total} руб.</p>
        <button type="submit">Оплатить</button>
      </form>
      {submitError && <div className="error">Ошибка: {submitError}</div>}
    </div>
  );
}