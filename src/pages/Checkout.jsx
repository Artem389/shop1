import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { updateOrder } from '../api/orders';

export default function Checkout() {
  const [address, setAddress] = useState('');
  const [paymentType, setPaymentType] = useState('cash');
  const { items, loadCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Предполагаем, что текущий order_id - первый из items (все в одном order)
  const orderId = items.length > 0 ? items[0].id_orders : null;

  if (!orderId) {
    return <p>Корзина пуста. Вернитесь в <a href="/cart">корзину</a>.</p>;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateOrder(orderId, address, paymentType);
      alert('Заказ оформлен! Вернитесь в личный кабинет.');
      loadCart(); // Обновить корзину (очистить?)
      navigate('/profile');
    } catch (err) {
      alert('Ошибка: ' + err.message);
    }
  };

  return (
    <div className="checkout">
      <h1>Оформление заказа</h1>
      <form onSubmit={handleSubmit}>
        <input 
          type="text" 
          value={address} 
          onChange={e => setAddress(e.target.value)} 
          placeholder="Адрес доставки" 
          required 
        />
        <select value={paymentType} onChange={e => setPaymentType(e.target.value)}>
          <option value="cash">Наличными</option>
          <option value="card">Картой</option>
        </select>
        <button type="submit">Оплатить</button>
      </form>
    </div>
  );
}