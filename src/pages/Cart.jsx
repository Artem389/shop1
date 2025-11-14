import { useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Cart() {
  const { items, loading, error, loadCart, removeItem, updateQuantity } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) loadCart();
  }, [user]);

  if (!user) return <p>Авторизуйтесь для просмотра корзины</p>;
  if (loading) return <p>Загрузка...</p>;
  if (error) return <p>Ошибка: {error}</p>;

  const total = items.reduce((sum, item) => {
    const discountedPrice = item.price * (1 - (item.discount_value || 0) / 100);
    return sum + discountedPrice * item.quantity;
  }, 0);

  const handleCheckout = () => {
    navigate('/checkout');
  };

  return (
    <div className="cart">
      <h1>Корзина</h1>
      {items.map(item => (
        <div key={item.cart_id}>
          <h2>{item.product_name}</h2>
          <p>Количество: {item.quantity}</p>
          <button onClick={() => updateQuantity(item.cart_id, item.quantity - 1)}>-</button>
          <button onClick={() => updateQuantity(item.cart_id, item.quantity + 1)}>+</button>
          <p>Сумма: {item.price * (1 - (item.discount_value || 0) / 100) * item.quantity} руб. (Скидка: {item.discount_value || 0}%)</p>
          <button onClick={() => removeItem(item.cart_id)}>Удалить полностью</button>
        </div>
      ))}
      <p>Итого: {total} руб.</p>
      <button onClick={handleCheckout}>Оформить заказ</button>
    </div>
  );
}